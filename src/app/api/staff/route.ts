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
