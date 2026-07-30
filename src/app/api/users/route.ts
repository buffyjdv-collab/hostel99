import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// GET /api/users - List all users
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')

    const where: any = {}
    if (role) where.role = role

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
        lastLogin: true,
        createdAt: true,
        password: false,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ users })
  } catch (error) {
    console.error('Users GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

// POST /api/users - Create new user
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, phone, password, role, isActive } = body

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 })
    }

    const validRoles = ['super_admin', 'owner', 'manager', 'staff', 'tenant']
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Check if email already exists
    const existing = await db.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 409 })
    }

    const user = await db.user.create({
      data: {
        name,
        email,
        phone: phone || null,
        password,
        role,
        isActive: isActive !== false,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        avatar: true,
        lastLogin: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ user, message: 'User created successfully' })
  } catch (error) {
    console.error('Users POST error:', error)
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}

// PATCH /api/users - Update user
export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, name, email, phone, role, isActive, currentPassword, newPassword } = body

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const user = await db.user.findUnique({ where: { id } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Password change requires current password verification
    if (currentPassword && newPassword) {
      if (user.password !== currentPassword) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 })
      }
      await db.user.update({
        where: { id },
        data: { password: newPassword },
      })
      return NextResponse.json({ message: 'Password changed successfully' })
    }

    // Regular update
    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (email !== undefined) updateData.email = email
    if (phone !== undefined) updateData.phone = phone
    if (role !== undefined) {
      const validRoles = ['super_admin', 'owner', 'manager', 'staff', 'tenant']
      if (!validRoles.includes(role)) {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
      }
      updateData.role = role
    }
    if (isActive !== undefined) updateData.isActive = isActive

    const updated = await db.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        avatar: true,
        lastLogin: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ user: updated, message: 'User updated successfully' })
  } catch (error) {
    console.error('Users PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}

// DELETE /api/users - Delete user
export async function DELETE(request: Request) {
  try {
    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Check if user exists
    const user = await db.user.findUnique({ where: { id } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Delete related records first (cascade)
    // Staff profile
    await db.staff.deleteMany({ where: { userId: id } })
    // Tenant profile
    await db.tenant.deleteMany({ where: { userId: id } })
    // Activity logs
    await db.activityLog.deleteMany({ where: { userId: id } })
    // Attendance
    await db.attendance.deleteMany({ where: { userId: id } })
    // Stock transactions
    await db.stockTransaction.deleteMany({ where: { performedById: id } })
    // Complaints (reassign)
    await db.complaint.updateMany({ where: { createdById: id }, data: { createdById: 'system' } })
    await db.complaint.updateMany({ where: { assignedToId: id }, data: { assignedToId: null } })

    // Finally delete the user
    await db.user.delete({ where: { id } })

    return NextResponse.json({ message: 'User deleted successfully' })
  } catch (error) {
    console.error('Users DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}
