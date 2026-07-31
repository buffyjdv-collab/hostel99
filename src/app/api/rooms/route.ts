import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get('propertyId')

    const where: Record<string, unknown> = {}
    if (propertyId) where.propertyId = propertyId

    const rooms = await db.room.findMany({
      where,
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

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, name, number, sharingType, roomType, totalBeds, rent, deposit, amenities, status, images } = body

    if (!id) {
      return NextResponse.json({ error: 'Room id is required' }, { status: 400 })
    }

    const existingRoom = await db.room.findUnique({ where: { id } })
    if (!existingRoom) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (number !== undefined) updateData.number = number
    if (sharingType !== undefined) updateData.sharingType = sharingType
    if (roomType !== undefined) updateData.roomType = roomType
    if (totalBeds !== undefined) updateData.totalBeds = totalBeds
    if (rent !== undefined) updateData.rent = rent
    if (deposit !== undefined) updateData.deposit = deposit
    if (amenities !== undefined) updateData.amenities = amenities
    if (status !== undefined) updateData.status = status
    if (images !== undefined) updateData.images = images

    const room = await db.room.update({
      where: { id },
      data: updateData,
      include: {
        floor: { select: { id: true, name: true, number: true } },
        building: { select: { id: true, name: true } },
        property: { select: { id: true, name: true } },
        beds: true,
      },
    })

    return NextResponse.json(room)
  } catch (error) {
    console.error('Rooms PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update room' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: 'Room id is required' }, { status: 400 })
    }

    const existingRoom = await db.room.findUnique({
      where: { id },
      include: { tenants: true, beds: true },
    })
    if (!existingRoom) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    // Check for active tenants
    const activeTenants = existingRoom.tenants.filter((t) => t.status === 'active')
    if (activeTenants.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete room with active tenants. Please move out tenants first.' },
        { status: 400 }
      )
    }

    // Delete beds first, then the room
    await db.bed.deleteMany({ where: { roomId: id } })
    await db.room.delete({ where: { id } })

    return NextResponse.json({ message: 'Room deleted successfully', id })
  } catch (error) {
    console.error('Rooms DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete room' }, { status: 500 })
  }
}
