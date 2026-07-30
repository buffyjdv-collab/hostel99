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

    return NextResponse.json({
      user: userWithoutPassword,
      message: 'Login successful',
    })
  } catch (error) {
    console.error('Auth POST error:', error)
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}
