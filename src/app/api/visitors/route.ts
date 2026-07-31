import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')

    const where: Record<string, unknown> = {}
    if (tenantId) where.tenantId = tenantId
    const propertyId = searchParams.get('propertyId')
    if (propertyId) where.propertyId = propertyId

    const visitors = await db.visitor.findMany({
      where,
      include: {
        tenant: { select: { id: true, name: true, phone: true } },
        host: { select: { id: true, name: true, email: true } },
        property: { select: { id: true, name: true, address: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(visitors)
  } catch (error) {
    console.error('Visitors GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch visitors' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      name,
      phone,
      purpose,
      tenantId,
      hostId,
      propertyId,
      checkIn,
      status,
      action,
      visitorId,
    } = body

    // Handle visitor checkout
    if (action === 'checkout' && visitorId) {
      const existingVisitor = await db.visitor.findUnique({ where: { id: visitorId } })
      if (!existingVisitor) {
        return NextResponse.json({ error: 'Visitor not found' }, { status: 404 })
      }

      const visitor = await db.visitor.update({
        where: { id: visitorId },
        data: {
          checkOut: new Date(),
          status: 'checked_out',
        },
        include: {
          tenant: { select: { id: true, name: true } },
          host: { select: { id: true, name: true } },
          property: { select: { id: true, name: true } },
        },
      })

      return NextResponse.json(visitor)
    }

    // Create new visitor
    if (!name || !purpose || !propertyId) {
      return NextResponse.json(
        { error: 'Name, purpose, and propertyId are required' },
        { status: 400 }
      )
    }

    const visitor = await db.visitor.create({
      data: {
        name,
        phone,
        purpose,
        tenantId,
        hostId,
        propertyId,
        checkIn: checkIn ? new Date(checkIn) : new Date(),
        status: status || 'checked_in',
      },
      include: {
        tenant: { select: { id: true, name: true } },
        host: { select: { id: true, name: true } },
        property: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json(visitor, { status: 201 })
  } catch (error) {
    console.error('Visitors POST error:', error)
    return NextResponse.json({ error: 'Failed to process visitor request' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, name, phone, purpose, tenantId, hostId, propertyId, checkIn, checkOut, status } = body

    if (!id) {
      return NextResponse.json({ error: 'Visitor id is required' }, { status: 400 })
    }

    const existingVisitor = await db.visitor.findUnique({ where: { id } })
    if (!existingVisitor) {
      return NextResponse.json({ error: 'Visitor not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (phone !== undefined) updateData.phone = phone
    if (purpose !== undefined) updateData.purpose = purpose
    if (tenantId !== undefined) updateData.tenantId = tenantId
    if (hostId !== undefined) updateData.hostId = hostId
    if (propertyId !== undefined) updateData.propertyId = propertyId
    if (checkIn !== undefined) updateData.checkIn = new Date(checkIn)
    if (checkOut !== undefined) updateData.checkOut = new Date(checkOut)
    if (status !== undefined) updateData.status = status

    const visitor = await db.visitor.update({
      where: { id },
      data: updateData,
      include: {
        tenant: { select: { id: true, name: true, phone: true } },
        host: { select: { id: true, name: true, email: true } },
        property: { select: { id: true, name: true, address: true } },
      },
    })

    return NextResponse.json(visitor)
  } catch (error) {
    console.error('Visitors PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update visitor' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: 'Visitor id is required' }, { status: 400 })
    }

    const existingVisitor = await db.visitor.findUnique({ where: { id } })
    if (!existingVisitor) {
      return NextResponse.json({ error: 'Visitor not found' }, { status: 404 })
    }

    await db.visitor.delete({ where: { id } })

    return NextResponse.json({ message: 'Visitor deleted successfully', id })
  } catch (error) {
    console.error('Visitors DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete visitor' }, { status: 500 })
  }
}
