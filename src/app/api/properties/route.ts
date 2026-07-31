import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { validateAccess, buildUserContext, buildPropertyWhere, checkPermission } from '@/lib/auth-helpers'

// GET /api/properties - List properties (scoped to user's access)
// Query params: userId, role, ownerId, type, city, assignedUserId
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || ''
    const role = searchParams.get('role') || ''
    const ownerId = searchParams.get('ownerId')
    const type = searchParams.get('type')
    const city = searchParams.get('city')

    // Validate read access
    const access = await validateAccess(userId, role, 'properties', 'read')
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: 403 })
    }

    // Property model uses `id` not `propertyId`, so rebuild the where clause
    const propertyWhere = buildPropertyWhere(access.userCtx)
    const where: any = { ...propertyWhere }
    if (ownerId) where.ownerId = ownerId
    if (type) where.type = type
    if (city) { where.city = { contains: city, mode: 'insensitive' } }

    const properties = await db.property.findMany({
      where,
      include: {
        owner: {
          select: { id: true, name: true, email: true, phone: true },
        },
        _count: {
          select: { buildings: true, rooms: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(properties)
  } catch (error) {
    console.error('Properties GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch properties' }, { status: 500 })
  }
}

// POST /api/properties - Create property (super_admin only)
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      name, type, address, city, state, pincode, landmark, description,
      totalRooms, totalBeds, amenities, ownerId, contactPhone, contactEmail,
      // Support creating owner user inline
      createOwner, ownerName, ownerEmail, ownerPhone, ownerPassword,
      // Auth context
      userId, role,
    } = body

    // Validate create access
    const access = await validateAccess(userId, role, 'properties', 'create')
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: 403 })
    }

    if (!name || !address || !city) {
      return NextResponse.json(
        { error: 'Name, address, and city are required' },
        { status: 400 }
      )
    }

    let propertyOwnerId = ownerId

    // If createOwner flag is set, create the owner user first
    if (createOwner && ownerName && ownerEmail) {
      const existingUser = await db.user.findUnique({ where: { email: ownerEmail } })
      if (existingUser) {
        propertyOwnerId = existingUser.id
      } else {
        const newUser = await db.user.create({
          data: {
            email: ownerEmail,
            name: ownerName,
            phone: ownerPhone || '',
            password: ownerPassword || `${ownerName.toLowerCase().replace(/\s+/g, '')}123`,
            role: 'owner',
            isActive: true,
          },
        })
        propertyOwnerId = newUser.id
      }
    }

    if (!propertyOwnerId) {
      return NextResponse.json({ error: 'Owner is required' }, { status: 400 })
    }

    const property = await db.property.create({
      data: {
        name,
        type: type || 'pg',
        address,
        city,
        state: state || '',
        pincode: pincode || '',
        landmark: landmark || '',
        description: description || '',
        totalRooms: totalRooms || 0,
        totalBeds: totalBeds || 0,
        occupancy: 0,
        amenities: amenities ? JSON.stringify(amenities) : JSON.stringify([]),
        images: JSON.stringify([]),
        ownerId: propertyOwnerId,
        contactPhone: contactPhone || '',
        contactEmail: contactEmail || '',
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    // Auto-assign owner to this property via HostelAssignment
    await db.hostelAssignment.upsert({
      where: { userId_propertyId: { userId: propertyOwnerId, propertyId: property.id } },
      update: { role: 'owner', isActive: true },
      create: { userId: propertyOwnerId, propertyId: property.id, role: 'owner', isActive: true },
    })

    return NextResponse.json(property, { status: 201 })
  } catch (error: any) {
    console.error('Properties POST error:', error)
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'A property with this name already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Failed to create property' }, { status: 500 })
  }
}

// PATCH /api/properties - Update property
export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, userId, role, ...data } = body

    // Validate update access
    const access = await validateAccess(userId, role, 'properties', 'update')
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: 403 })
    }

    if (!id) {
      return NextResponse.json({ error: 'Property id is required' }, { status: 400 })
    }

    const existing = await db.property.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    // Check if user has access to this specific property
    if (!access.userCtx.isSuperAdmin && !access.userCtx.propertyIds.includes(id)) {
      return NextResponse.json({ error: 'You do not have access to this property' }, { status: 403 })
    }

    const updateData: any = {}
    const allowedFields = ['name', 'type', 'address', 'city', 'state', 'pincode', 'landmark',
      'description', 'totalRooms', 'totalBeds', 'occupancy', 'amenities', 'ownerId',
      'contactPhone', 'contactEmail']

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updateData[field] = data[field]
      }
    }

    const property = await db.property.update({
      where: { id },
      data: updateData,
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    // If ownerId changed, update hostel assignment
    if (data.ownerId && data.ownerId !== existing.ownerId) {
      await db.hostelAssignment.upsert({
        where: { userId_propertyId: { userId: data.ownerId, propertyId: id } },
        update: { role: 'owner', isActive: true },
        create: { userId: data.ownerId, propertyId: id, role: 'owner', isActive: true },
      })
    }

    return NextResponse.json(property)
  } catch (error) {
    console.error('Properties PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update property' }, { status: 500 })
  }
}

// DELETE /api/properties - Delete/deactivate property (super_admin only)
export async function DELETE(request: Request) {
  try {
    const body = await request.json()
    const { id, userId, role } = body

    // Validate delete access
    const access = await validateAccess(userId, role, 'properties', 'delete')
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: 403 })
    }

    if (!id) {
      return NextResponse.json({ error: 'Property id is required' }, { status: 400 })
    }

    const existing = await db.property.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    // Check if user has access to this specific property
    if (!access.userCtx.isSuperAdmin && !access.userCtx.propertyIds.includes(id)) {
      return NextResponse.json({ error: 'You do not have access to this property' }, { status: 403 })
    }

    // Soft delete - deactivate all assignments
    await db.hostelAssignment.updateMany({
      where: { propertyId: id },
      data: { isActive: false },
    })

    await db.property.delete({ where: { id } })

    return NextResponse.json({ message: 'Property deleted successfully' })
  } catch (error) {
    console.error('Properties DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete property' }, { status: 500 })
  }
}
