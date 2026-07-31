import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { validateAccess, buildUserContext, buildScopedWhere } from '@/lib/auth-helpers'

// GET /api/staff - List staff (scoped to user's access)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || ''
    const role = searchParams.get('role') || ''
    const propertyId = searchParams.get('propertyId') || undefined
    const status = searchParams.get('status')
    const staffRole = searchParams.get('role_filter')

    // For staff: they can only see their own profile (bypass validateAccess)
    if (role === 'staff') {
      const staffProfile = await db.staff.findFirst({
        where: { userId },
        include: {
          user: { select: { id: true, name: true, email: true, phone: true, avatar: true, role: true } },
          property: { select: { id: true, name: true, type: true } },
        },
      })
      if (staffProfile) {
        return NextResponse.json({ staff: [staffProfile] })
      }
      return NextResponse.json({ staff: [] })
    }

    // Validate read access for non-staff roles
    const access = await validateAccess(userId, role, 'staff', 'read', propertyId)
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: 403 })
    }

    const where: any = { ...access.whereClause }
    if (status) where.status = status
    if (staffRole) where.role = staffRole

    const staff = await db.staff.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true, avatar: true, role: true },
        },
        property: {
          select: { id: true, name: true, type: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ staff })
  } catch (error) {
    console.error('Staff GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch staff' }, { status: 500 })
  }
}

// POST /api/staff - Create staff member
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      name, phone, role: staffRole, propertyId, salary, joinDate, status,
      aadhaarNumber, address, emergencyContact, emergencyPhone,
      createUser, email, password, userId: staffUserId,
      // Auth context
      userId, role,
    } = body

    // Validate create access
    const access = await validateAccess(userId, role, 'staff', 'create', propertyId)
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: 403 })
    }

    if (!name || !phone || !staffRole || !propertyId) {
      return NextResponse.json(
        { error: 'Name, phone, role, and propertyId are required' },
        { status: 400 }
      )
    }

    const property = await db.property.findUnique({ where: { id: propertyId } })
    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    let staffUserIdFinal = staffUserId

    // Create user if requested
    if (createUser && email) {
      const existingUser = await db.user.findUnique({ where: { email } })
      if (existingUser) {
        staffUserIdFinal = existingUser.id
      } else {
        const newUser = await db.user.create({
          data: {
            email, name, phone,
            password: password || `${name.toLowerCase().replace(/\s+/g, '')}123`,
            role: 'staff', isActive: true,
          },
        })
        staffUserIdFinal = newUser.id
      }
    }

    const staff = await db.staff.create({
      data: {
        userId: staffUserIdFinal, name, phone, role: staffRole, propertyId,
        salary: salary || 0, joinDate: joinDate ? new Date(joinDate) : new Date(),
        status: status || 'active', aadhaarNumber: aadhaarNumber || '',
        address: address || '', emergencyContact: emergencyContact || '',
        emergencyPhone: emergencyPhone || '',
      },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, role: true } },
        property: { select: { id: true, name: true, type: true } },
      },
    })

    // Create hostel assignment for this staff member
    if (staffUserIdFinal) {
      await db.hostelAssignment.upsert({
        where: { userId_propertyId: { userId: staffUserIdFinal, propertyId } },
        update: { role: 'staff', isActive: true },
        create: { userId: staffUserIdFinal, propertyId, role: 'staff', isActive: true },
      })
    }

    return NextResponse.json({ staff }, { status: 201 })
  } catch (error: any) {
    console.error('Staff POST error:', error)
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'A staff member with this information already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Failed to create staff member' }, { status: 500 })
  }
}

// PATCH /api/staff - Update staff member
export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, userId, role, ...data } = body

    // Validate update access
    const access = await validateAccess(userId, role, 'staff', 'update', data.propertyId)
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: 403 })
    }

    if (!id) {
      return NextResponse.json({ error: 'Staff id is required' }, { status: 400 })
    }

    const existing = await db.staff.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Staff not found' }, { status: 404 })
    }

    // Check property access
    if (!access.userCtx.isSuperAdmin && !access.userCtx.propertyIds.includes(existing.propertyId)) {
      return NextResponse.json({ error: 'You do not have access to this staff member' }, { status: 403 })
    }

    const allowedFields = ['name', 'phone', 'role', 'propertyId', 'salary', 'joinDate',
      'status', 'aadhaarNumber', 'address', 'emergencyContact', 'emergencyPhone']
    const updateData: any = {}
    for (const field of allowedFields) {
      if (data[field] !== undefined) updateData[field] = data[field]
    }

    // If propertyId changed, update hostel assignment
    if (data.propertyId && data.propertyId !== existing.propertyId) {
      await db.hostelAssignment.updateMany({
        where: { userId: existing.userId, propertyId: existing.propertyId },
        data: { isActive: false },
      })
      if (existing.userId) {
        await db.hostelAssignment.upsert({
          where: { userId_propertyId: { userId: existing.userId, propertyId: data.propertyId } },
          update: { role: 'staff', isActive: true },
          create: { userId: existing.userId, propertyId: data.propertyId, role: 'staff', isActive: true },
        })
      }
    }

    const staff = await db.staff.update({
      where: { id },
      data: updateData,
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, role: true } },
        property: { select: { id: true, name: true, type: true } },
      },
    })

    return NextResponse.json({ staff })
  } catch (error) {
    console.error('Staff PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update staff member' }, { status: 500 })
  }
}

// DELETE /api/staff - Delete staff member
export async function DELETE(request: Request) {
  try {
    const body = await request.json()
    const { id, userId, role } = body

    // Validate delete access
    const access = await validateAccess(userId, role, 'staff', 'delete')
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: 403 })
    }

    if (!id) {
      return NextResponse.json({ error: 'Staff id is required' }, { status: 400 })
    }

    const existing = await db.staff.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Staff not found' }, { status: 404 })
    }

    // Check property access
    if (!access.userCtx.isSuperAdmin && !access.userCtx.propertyIds.includes(existing.propertyId)) {
      return NextResponse.json({ error: 'You do not have access to this staff member' }, { status: 403 })
    }

    // Remove hostel assignment
    if (existing.userId) {
      await db.hostelAssignment.updateMany({
        where: { userId: existing.userId, propertyId: existing.propertyId },
        data: { isActive: false },
      })
    }

    await db.staff.delete({ where: { id } })
    return NextResponse.json({ message: 'Staff member deleted successfully' })
  } catch (error) {
    console.error('Staff DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete staff member' }, { status: 500 })
  }
}
