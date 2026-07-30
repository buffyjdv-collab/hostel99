import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const properties = await db.property.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: { buildings: true, rooms: true },
        },
        owner: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const propertiesWithStats = properties.map((property) => ({
      ...property,
      buildingsCount: property._count.buildings,
      roomsCount: property._count.rooms,
      occupancyPercentage:
        property.totalBeds > 0
          ? Math.round((property.occupancy / property.totalBeds) * 100)
          : 0,
    }))

    return NextResponse.json(propertiesWithStats)
  } catch (error) {
    console.error('Properties GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch properties' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      name,
      type,
      address,
      city,
      state,
      pincode,
      landmark,
      description,
      totalRooms,
      totalBeds,
      amenities,
      images,
      ownerId,
    } = body

    if (!name || !address || !city || !ownerId) {
      return NextResponse.json(
        { error: 'Name, address, city, and ownerId are required' },
        { status: 400 }
      )
    }

    const property = await db.property.create({
      data: {
        name,
        type: type || 'pg',
        address,
        city,
        state,
        pincode,
        landmark,
        description,
        totalRooms: totalRooms || 0,
        totalBeds: totalBeds || 0,
        amenities,
        images,
        ownerId,
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
      },
    })

    return NextResponse.json(property, { status: 201 })
  } catch (error) {
    console.error('Properties POST error:', error)
    return NextResponse.json({ error: 'Failed to create property' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, name, type, address, city, state, pincode, landmark, description, totalRooms, totalBeds, amenities, images, ownerId, isActive, occupancy } = body

    if (!id) {
      return NextResponse.json({ error: 'Property id is required' }, { status: 400 })
    }

    const existingProperty = await db.property.findUnique({ where: { id } })
    if (!existingProperty) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (type !== undefined) updateData.type = type
    if (address !== undefined) updateData.address = address
    if (city !== undefined) updateData.city = city
    if (state !== undefined) updateData.state = state
    if (pincode !== undefined) updateData.pincode = pincode
    if (landmark !== undefined) updateData.landmark = landmark
    if (description !== undefined) updateData.description = description
    if (totalRooms !== undefined) updateData.totalRooms = totalRooms
    if (totalBeds !== undefined) updateData.totalBeds = totalBeds
    if (amenities !== undefined) updateData.amenities = amenities
    if (images !== undefined) updateData.images = images
    if (ownerId !== undefined) updateData.ownerId = ownerId
    if (isActive !== undefined) updateData.isActive = isActive
    if (occupancy !== undefined) updateData.occupancy = occupancy

    const property = await db.property.update({
      where: { id },
      data: updateData,
      include: {
        owner: { select: { id: true, name: true, email: true } },
      },
    })

    return NextResponse.json(property)
  } catch (error) {
    console.error('Properties PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update property' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: 'Property id is required' }, { status: 400 })
    }

    const existingProperty = await db.property.findUnique({ where: { id } })
    if (!existingProperty) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    // Soft delete by setting isActive to false
    const property = await db.property.update({
      where: { id },
      data: { isActive: false },
    })

    return NextResponse.json({ message: 'Property deleted successfully', id })
  } catch (error) {
    console.error('Properties DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete property' }, { status: 500 })
  }
}
