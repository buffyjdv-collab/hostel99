import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// GET /api/hostel-assignments - List hostel assignments
// Query params: userId, propertyId, role
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const propertyId = searchParams.get('propertyId')
    const role = searchParams.get('role')

    const where: any = {}
    if (userId) where.userId = userId
    if (propertyId) where.propertyId = propertyId
    if (role) where.role = role
    where.isActive = true

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
    const { userId, propertyId, role } = body

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
    const { id, role, isActive } = body

    if (!id) {
      return NextResponse.json({ error: 'Assignment id is required' }, { status: 400 })
    }

    const existing = await db.hostelAssignment.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
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
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: 'Assignment id is required' }, { status: 400 })
    }

    const existing = await db.hostelAssignment.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    await db.hostelAssignment.delete({ where: { id } })

    return NextResponse.json({ message: 'Assignment removed successfully' })
  } catch (error) {
    console.error('HostelAssignments DELETE error:', error)
    return NextResponse.json({ error: 'Failed to remove assignment' }, { status: 500 })
  }
}
