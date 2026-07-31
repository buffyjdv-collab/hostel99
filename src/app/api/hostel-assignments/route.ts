import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { validateAccess } from '@/lib/auth-helpers'

// GET /api/hostel-assignments - List hostel assignments
// Query params: userId, propertyId, role
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const authUserId = searchParams.get('userId')
    const authRole = searchParams.get('role')
    const filterUserId = searchParams.get('filterUserId')
    const propertyId = searchParams.get('propertyId')
    const filterRole = searchParams.get('filterRole')

    if (!authUserId || !authRole) {
      return NextResponse.json({ error: 'userId and role are required' }, { status: 400 })
    }

    const access = await validateAccess(authUserId, authRole, 'hostels', 'read', propertyId || undefined)
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: 403 })
    }

    const where: any = { ...access.whereClause, isActive: true }
    if (filterUserId) where.userId = filterUserId
    if (propertyId) where.propertyId = propertyId
    if (filterRole) where.role = filterRole

    const assignments = await db.hostelAssignment.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true, role: true, avatar: true },
        },
        property: {
          select: { id: true, name: true, type: true, address: true, city: true, isActive: true },
        },
      },
      orderBy: { assignedAt: 'desc' },
    })

    return NextResponse.json({ assignments })
  } catch (error) {
    console.error('HostelAssignments GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch hostel assignments' }, { status: 500 })
  }
}

// POST /api/hostel-assignments - Assign user to hostel
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId, propertyId, role, authUserId, authRole } = body

    if (!authUserId || !authRole) {
      return NextResponse.json({ error: 'userId and role are required' }, { status: 400 })
    }

    const access = await validateAccess(authUserId, authRole, 'hostels', 'create', propertyId)
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: 403 })
    }

    if (!userId || !propertyId || !role) {
      return NextResponse.json(
        { error: 'userId, propertyId, and role are required' },
        { status: 400 }
      )
    }

    const validRoles = ['owner', 'manager', 'staff', 'tenant']
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid role. Must be owner, manager, staff, or tenant' }, { status: 400 })
    }

    // Check if user exists
    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if property exists
    const property = await db.property.findUnique({ where: { id: propertyId } })
    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    // Check for existing assignment (upsert approach)
    const existing = await db.hostelAssignment.findUnique({
      where: { userId_propertyId: { userId, propertyId } },
    })

    if (existing) {
      // Update the existing assignment
      const updated = await db.hostelAssignment.update({
        where: { id: existing.id },
        data: { role, isActive: true },
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
          property: { select: { id: true, name: true, type: true } },
        },
      })
      return NextResponse.json({ assignment: updated, message: 'Assignment updated successfully' })
    }

    // Create new assignment
    const assignment = await db.hostelAssignment.create({
      data: { userId, propertyId, role },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        property: { select: { id: true, name: true, type: true } },
      },
    })

    return NextResponse.json({ assignment, message: 'User assigned to hostel successfully' }, { status: 201 })
  } catch (error) {
    console.error('HostelAssignments POST error:', error)
    return NextResponse.json({ error: 'Failed to assign user to hostel' }, { status: 500 })
  }
}

// PATCH /api/hostel-assignments - Update assignment
export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, role, isActive, userId, authRole } = body

    if (!userId || !authRole) {
      return NextResponse.json({ error: 'userId and role are required' }, { status: 400 })
    }

    if (!id) {
      return NextResponse.json({ error: 'Assignment id is required' }, { status: 400 })
    }

    const existing = await db.hostelAssignment.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    const access = await validateAccess(userId, authRole, 'hostels', 'update', existing.propertyId)
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: 403 })
    }

    const updateData: any = {}
    if (role !== undefined) {
      const validRoles = ['owner', 'manager', 'staff', 'tenant']
      if (!validRoles.includes(role)) {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
      }
      updateData.role = role
    }
    if (isActive !== undefined) updateData.isActive = isActive

    const assignment = await db.hostelAssignment.update({
      where: { id },
      data: updateData,
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        property: { select: { id: true, name: true, type: true } },
      },
    })

    return NextResponse.json({ assignment, message: 'Assignment updated successfully' })
  } catch (error) {
    console.error('HostelAssignments PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update assignment' }, { status: 500 })
  }
}

// DELETE /api/hostel-assignments - Remove assignment
export async function DELETE(request: Request) {
  try {
    const body = await request.json()
    const { id, userId, authRole } = body

    if (!userId || !authRole) {
      return NextResponse.json({ error: 'userId and role are required' }, { status: 400 })
    }

    if (!id) {
      return NextResponse.json({ error: 'Assignment id is required' }, { status: 400 })
    }

    const existing = await db.hostelAssignment.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    const access = await validateAccess(userId, authRole, 'hostels', 'delete', existing.propertyId)
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: 403 })
    }

    await db.hostelAssignment.delete({ where: { id } })

    return NextResponse.json({ message: 'Assignment removed successfully' })
  } catch (error) {
    console.error('HostelAssignments DELETE error:', error)
    return NextResponse.json({ error: 'Failed to remove assignment' }, { status: 500 })
  }
}
