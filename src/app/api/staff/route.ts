import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const staff = await db.staff.findMany({
      include: {
        property: { select: { id: true, name: true, address: true } },
        user: { select: { id: true, name: true, email: true, phone: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(staff)
  } catch (error) {
    console.error('Staff GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch staff' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      name,
      phone,
      role,
      propertyId,
      salary,
      joinDate,
      status,
      aadhaarNumber,
      address,
      userId,
    } = body

    if (!name || !phone || !propertyId) {
      return NextResponse.json(
        { error: 'Name, phone, and propertyId are required' },
        { status: 400 }
      )
    }

    const staff = await db.staff.create({
      data: {
        name,
        phone,
        role: role || 'caretaker',
        propertyId,
        salary: salary ? parseFloat(salary) : 0,
        joinDate: joinDate ? new Date(joinDate) : undefined,
        status: status || 'active',
        aadhaarNumber,
        address,
        userId,
      },
      include: {
        property: { select: { id: true, name: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    })

    return NextResponse.json(staff, { status: 201 })
  } catch (error) {
    console.error('Staff POST error:', error)
    return NextResponse.json({ error: 'Failed to create staff' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, name, phone, role, propertyId, salary, joinDate, status, aadhaarNumber, address, userId } = body

    if (!id) {
      return NextResponse.json({ error: 'Staff id is required' }, { status: 400 })
    }

    const existingStaff = await db.staff.findUnique({ where: { id } })
    if (!existingStaff) {
      return NextResponse.json({ error: 'Staff not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (phone !== undefined) updateData.phone = phone
    if (role !== undefined) updateData.role = role
    if (propertyId !== undefined) updateData.propertyId = propertyId
    if (salary !== undefined) updateData.salary = parseFloat(salary)
    if (joinDate !== undefined) updateData.joinDate = new Date(joinDate)
    if (status !== undefined) updateData.status = status
    if (aadhaarNumber !== undefined) updateData.aadhaarNumber = aadhaarNumber
    if (address !== undefined) updateData.address = address
    if (userId !== undefined) updateData.userId = userId

    const staff = await db.staff.update({
      where: { id },
      data: updateData,
      include: {
        property: { select: { id: true, name: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    })

    return NextResponse.json(staff)
  } catch (error) {
    console.error('Staff PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update staff' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: 'Staff id is required' }, { status: 400 })
    }

    const existingStaff = await db.staff.findUnique({ where: { id } })
    if (!existingStaff) {
      return NextResponse.json({ error: 'Staff not found' }, { status: 404 })
    }

    // Attendance and salary payments have cascade delete in schema
    await db.staff.delete({ where: { id } })

    return NextResponse.json({ message: 'Staff deleted successfully', id })
  } catch (error) {
    console.error('Staff DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete staff' }, { status: 500 })
  }
}
