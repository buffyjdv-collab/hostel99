import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const visitors = await db.visitor.findMany({
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
