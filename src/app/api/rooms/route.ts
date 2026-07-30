import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const rooms = await db.room.findMany({
      include: {
        floor: { select: { id: true, name: true, number: true } },
        building: { select: { id: true, name: true } },
        property: { select: { id: true, name: true } },
        beds: {
          select: {
            id: true,
            name: true,
            number: true,
            status: true,
            tenant: { select: { id: true, name: true } },
          },
        },
        _count: {
          select: { tenants: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const roomsWithInfo = rooms.map((room) => ({
      ...room,
      occupiedBedsCount: room.beds.filter((b) => b.status === 'occupied').length,
      availableBedsCount: room.beds.filter((b) => b.status === 'available').length,
      tenantsCount: room._count.tenants,
    }))

    return NextResponse.json(roomsWithInfo)
  } catch (error) {
    console.error('Rooms GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch rooms' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      name,
      number,
      floorId,
      buildingId,
      propertyId,
      sharingType,
      roomType,
      totalBeds,
      rent,
      deposit,
      amenities,
      status,
      images,
      beds,
    } = body

    if (!name || !number || !floorId || !buildingId || !propertyId) {
      return NextResponse.json(
        { error: 'Name, number, floorId, buildingId, and propertyId are required' },
        { status: 400 }
      )
    }

    const room = await db.room.create({
      data: {
        name,
        number,
        floorId,
        buildingId,
        propertyId,
        sharingType: sharingType || 'single',
        roomType: roomType || 'non_ac',
        totalBeds: totalBeds || 1,
        rent: rent || 0,
        deposit: deposit || 0,
        amenities,
        status: status || 'available',
        images,
        beds: {
          create:
            beds && beds.length > 0
              ? beds
              : Array.from({ length: totalBeds || 1 }, (_, i) => ({
                  name: `Bed ${i + 1}`,
                  number: i + 1,
                  status: 'available',
                })),
        },
      },
      include: {
        floor: { select: { id: true, name: true, number: true } },
        building: { select: { id: true, name: true } },
        property: { select: { id: true, name: true } },
        beds: true,
      },
    })

    return NextResponse.json(room, { status: 201 })
  } catch (error) {
    console.error('Rooms POST error:', error)
    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 })
  }
}
