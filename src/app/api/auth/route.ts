import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const user = await db.user.findUnique({
      where: { email },
      include: {
        staffProfile: {
          include: { property: { select: { id: true, name: true } } },
        },
        tenantProfile: {
          include: {
            property: { select: { id: true, name: true } },
            room: { select: { id: true, name: true, number: true } },
            bed: { select: { id: true, name: true } },
          },
        },
        hostelAssignments: {
          where: { isActive: true },
          include: {
            property: {
              select: { id: true, name: true, type: true, address: true, city: true },
            },
          },
          orderBy: { assignedAt: 'desc' },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    if (!user.isActive) {
      return NextResponse.json({ error: 'Account is deactivated' }, { status: 403 })
    }

    // Simple string comparison for now (replace with bcrypt in production)
    if (user.password !== password) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    // Update last login (ignore errors if database is read-only)
    try {
      await db.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
      })
    } catch {
      // Ignore write errors in read-only mode
    }

    // Return user data without password
    const { password: _, ...userWithoutPassword } = user

    // Build hostel assignments summary for the frontend
    const hostelAssignments = user.hostelAssignments.map(a => ({
      id: a.id,
      propertyId: a.property.id,
      propertyName: a.property.name,
      propertyType: a.property.type,
      propertyAddress: a.property.address,
      propertyCity: a.property.city,
      role: a.role,
      isActive: a.isActive,
    }))

    // Fetch user-specific permission overrides for micro RBAC
    const permissionOverrides = await db.userPermissionOverride.findMany({
      where: { userId: user.id },
      select: { permission: true, granted: true },
    })

    // Determine the default/current hostel
    // For super_admin, they can see all hostels (no specific assignment needed)
    // For others, their first assignment is the default
    const defaultHostelId = user.role === 'super_admin'
      ? null // super_admin sees all, no specific hostel
      : hostelAssignments.length > 0
        ? hostelAssignments[0].propertyId
        : null

    return NextResponse.json({
      user: userWithoutPassword,
      hostelAssignments,
      defaultHostelId,
      permissionOverrides,
      message: 'Login successful',
    })
  } catch (error) {
    console.error('Auth POST error:', error)
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}
