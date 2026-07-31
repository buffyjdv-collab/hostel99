import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// GET /api/staff - List staff, optionally filtered by propertyId
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get('propertyId')
    const status = searchParams.get('status')
    const role = searchParams.get('role')

    const where: any = {}
    if (propertyId) where.propertyId = propertyId
    if (status) where.status = status
    if (role) where.role = role

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
// Supports creating user + staff profile + hostel assignment in one step
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      // Staff profile fields
      name, phone, role, propertyId, salary, joinDate, status,
      aadhaarNumber, address, emergencyContact, emergencyPhone,
      // User creation fields (optional - if creating new user)
      createUser, email, password,
      // Existing user ID (if not creating new user)
      userId,
    } = body

    if (!name || !phone || !role || !propertyId) {
      return NextResponse.json(
        { error: 'Name, phone, role, and propertyId are required' },
        { status: 400 }
      )
    }

    // Verify property exists
    const property = await db.property.findUnique({ where: { id: propertyId } })
    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    let staffUserId = userId

    // Create user if requested
    if (createUser && email) {
      const existingUser = await db.user.findUnique({ where: { email } })
      if (existingUser) {
        staffUserId = existingUser.id
      } else {
        const newUser = await db.user.create({
          data: {
            email,
            name,
            phone,
            password: password || `${name.toLowerCase().replace(/\s+/g, '')}123`,
            role: 'staff',
            isActive: true,
          },
        })
        staffUserId = newUser.id
      }
    }

    // Create staff profile
    const staff = await db.staff.create({
      data: {
        userId: staffUserId,
        name,
        phone,
        role,
        propertyId,
        salary: salary || 0,
        joinDate: joinDate ? new Date(joinDate) : new Date(),
        status: status || 'active',
        aadhaarNumber: aadhaarNumber || '',
        address: address || '',
        emergencyContact: emergencyContact || '',
        emergencyPhone: emergencyPhone || '',
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true, role: true },
        },
        property: {
          select: { id: true, name: true, type: true },
        },
      },
    })

    // Create hostel assignment for this staff member
    if (staffUserId) {
      await db.hostelAssignment.upsert({
        where: { userId_propertyId: { userId: staffUserId, propertyId } },
        update: { role: 'staff', isActive: true },
        create: { userId: staffUserId, propertyId, role: 'staff', isActive: true },
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
    const { id, ...data } = body

    if (!id) {
      return NextResponse.json({ error: 'Staff id is required' }, { status: 400 })
    }

    const existing = await db.staff.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Staff not found' }, { status: 404 })
    }

    const allowedFields = ['name', 'phone', 'role', 'propertyId', 'salary', 'joinDate',
      'status', 'aadhaarNumber', 'address', 'emergencyContact', 'emergencyPhone']
    const updateData: any = {}
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updateData[field] = data[field]
      }
    }

    // If propertyId changed, update hostel assignment
    if (data.propertyId && data.propertyId !== existing.propertyId) {
      // Deactivate old assignment
      await db.hostelAssignment.updateMany({
        where: { userId: existing.userId, propertyId: existing.propertyId },
        data: { isActive: false },
      })
      // Create new assignment
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
        user: {
          select: { id: true, name: true, email: true, phone: true, role: true },
        },
        property: {
          select: { id: true, name: true, type: true },
        },
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
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: 'Staff id is required' }, { status: 400 })
    }

    const existing = await db.staff.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Staff not found' }, { status: 404 })
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
