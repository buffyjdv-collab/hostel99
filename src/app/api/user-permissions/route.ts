import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/user-permissions - Get permission overrides for a user
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId')
    const role = req.nextUrl.searchParams.get('role')
    const targetUserId = req.nextUrl.searchParams.get('targetUserId')

    if (!userId || !role) {
      return NextResponse.json({ error: 'userId and role are required' }, { status: 400 })
    }

    // Only super_admin can view user permission overrides
    if (role !== 'super_admin') {
      return NextResponse.json({ error: 'Only super admin can manage user permissions' }, { status: 403 })
    }

    if (targetUserId) {
      // Get overrides for a specific user
      const overrides = await db.userPermissionOverride.findMany({
        where: { userId: targetUserId },
        orderBy: { permission: 'asc' },
      })
      const user = await db.user.findUnique({
        where: { id: targetUserId },
        select: { id: true, name: true, email: true, role: true },
      })
      return NextResponse.json({ user, overrides })
    }

    // Get all users with their overrides (for admin view)
    const users = await db.user.findMany({
      where: { isActive: true, role: { not: 'super_admin' } },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        _count: { select: { permissionOverrides: true } },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ users })
  } catch (error) {
    console.error('UserPermissions GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch user permissions' }, { status: 500 })
  }
}

// POST /api/user-permissions - Set a permission override for a user
export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    const { userId, role, targetUserId, permission, granted } = data

    if (!userId || !role) {
      return NextResponse.json({ error: 'userId and role are required' }, { status: 400 })
    }

    if (role !== 'super_admin') {
      return NextResponse.json({ error: 'Only super admin can manage user permissions' }, { status: 403 })
    }

    if (!targetUserId || !permission) {
      return NextResponse.json({ error: 'targetUserId and permission are required' }, { status: 400 })
    }

    // Upsert the permission override
    const override = await db.userPermissionOverride.upsert({
      where: {
        userId_permission: { userId: targetUserId, permission },
      },
      update: { granted },
      create: { userId: targetUserId, permission, granted },
    })

    return NextResponse.json(override)
  } catch (error) {
    console.error('UserPermissions POST error:', error)
    return NextResponse.json({ error: 'Failed to set user permission' }, { status: 500 })
  }
}

// DELETE /api/user-permissions - Remove a permission override
export async function DELETE(req: NextRequest) {
  try {
    const data = await req.json()
    const { userId, role, overrideId } = data

    if (!userId || !role) {
      return NextResponse.json({ error: 'userId and role are required' }, { status: 400 })
    }

    if (role !== 'super_admin') {
      return NextResponse.json({ error: 'Only super admin can manage user permissions' }, { status: 403 })
    }

    if (!overrideId) {
      return NextResponse.json({ error: 'overrideId is required' }, { status: 400 })
    }

    await db.userPermissionOverride.delete({ where: { id: overrideId } })

    return NextResponse.json({ message: 'Permission override removed successfully' })
  } catch (error) {
    console.error('UserPermissions DELETE error:', error)
    return NextResponse.json({ error: 'Failed to remove user permission' }, { status: 500 })
  }
}
