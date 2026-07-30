import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// GET /api/role-permissions — Returns all role permissions from the database
export async function GET() {
  try {
    const rolePermissions = await db.rolePermission.findMany({
      orderBy: { role: 'asc' },
    })

    // Parse the JSON strings back into arrays
    const parsed = rolePermissions.map((rp) => ({
      role: rp.role,
      permissions: JSON.parse(rp.permissions),
    }))

    return NextResponse.json(parsed)
  } catch (error) {
    console.error('RolePermissions GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch role permissions' }, { status: 500 })
  }
}

// POST /api/role-permissions — Saves role permissions to the database
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { permissions } = body as { permissions: Record<string, string[]> }

    if (!permissions || typeof permissions !== 'object') {
      return NextResponse.json({ error: 'permissions object is required' }, { status: 400 })
    }

    // Upsert each role's permissions
    const results = await Promise.all(
      Object.entries(permissions).map(async ([role, perms]) => {
        return db.rolePermission.upsert({
          where: { role },
          update: { permissions: JSON.stringify(perms) },
          create: { role, permissions: JSON.stringify(perms) },
        })
      })
    )

    return NextResponse.json({ message: 'Role permissions saved successfully', count: results.length })
  } catch (error) {
    console.error('RolePermissions POST error:', error)
    return NextResponse.json({ error: 'Failed to save role permissions' }, { status: 500 })
  }
}
