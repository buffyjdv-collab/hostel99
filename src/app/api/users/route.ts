import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// GET /api/users - List users
// Query params: role, propertyId (for scoping), assignedUserId
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')
    const propertyId = searchParams.get('propertyId')

    const where: any = {}
    if (role) where.role = role

    // If propertyId is provided, get users assigned to that property
    if (propertyId) {
      const assignments = await db.hostelAssignment.findMany({
        where: { propertyId, isActive: true },
        select: { userId: true },
      })
      const userIds = assignments.map(a => a.userId)
      where.id = { in: userIds }
    }

    const users = await db.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        avatar: true,
        createdAt: true,
        hostelAssignments: {
          where: { isActive: true },
          select: {
            id: true,
            propertyId: true,
            role: true,
            property: { select: { id: true, name: true, type: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ users })
  } catch (error) {
    console.error('Users GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

// POST /api/users - Create user with optional hostel assignment
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, phone, password, role, propertyId, assignRole } = body

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existing = await db.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 409 }
      )
    }

    const user = await db.user.create({
      data: {
        email,
        name,
        phone: phone || '',
        password: password || `${name.toLowerCase().replace(/\s+/g, '')}123`,
        role: role || 'staff',
        isActive: true,
      },
    })

    // If propertyId is provided, create hostel assignment
    if (propertyId && assignRole) {
      await db.hostelAssignment.create({
        data: {
          userId: user.id,
          propertyId,
          role: assignRole,
          isActive: true,
        },
      })
    }

    // Return user with assignments
    const userWithAssignments = await db.user.findUnique({
      where: { id: user.id },
      include: {
        hostelAssignments: {
          where: { isActive: true },
          include: {
            property: { select: { id: true, name: true, type: true } },
          },
        },
      },
    })

    return NextResponse.json({ user: userWithAssignments }, { status: 201 })
  } catch (error: any) {
    console.error('Users POST error:', error)
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'A user with this email already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}
