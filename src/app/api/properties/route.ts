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
