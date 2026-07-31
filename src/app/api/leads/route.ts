import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { validateAccess } from '@/lib/auth-helpers'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const role = searchParams.get('role')

    if (!userId || !role) {
      return NextResponse.json({ error: 'userId and role are required' }, { status: 400 })
    }

    const access = await validateAccess(userId, role, 'leads', 'read')
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: 403 })
    }

    const leads = await db.lead.findMany({
      where: access.whereClause,
      include: {
        property: { select: { id: true, name: true, address: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Get stage counts
    const stageCounts = await db.lead.groupBy({
      by: ['status'],
      where: access.whereClause,
      _count: { status: true },
    })

    return NextResponse.json({
      leads,
      stageCounts: stageCounts.map((s) => ({
        status: s.status,
        count: s._count.status,
      })),
    })
  } catch (error) {
    console.error('Leads GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      name,
      email,
      phone,
      source,
      status,
      stage,
      propertyId,
      roomPreference,
      budget,
      visitDate,
      visitNotes,
      followUpDate,
      followUpNotes,
      tokenAmount,
      notes,
      assignedToId,
      createdById,
      userId,
      role,
    } = body

    if (!userId || !role) {
      return NextResponse.json({ error: 'userId and role are required' }, { status: 400 })
    }

    const access = await validateAccess(userId, role, 'leads', 'create', propertyId)
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: 403 })
    }

    if (!name || !phone || !propertyId || !createdById) {
      return NextResponse.json(
        { error: 'Name, phone, propertyId, and createdById are required' },
        { status: 400 }
      )
    }

    const lead = await db.lead.create({
      data: {
        name,
        email,
        phone,
        source: source || 'website',
        status: status || 'lead',
        stage: stage || 1,
        propertyId,
        roomPreference,
        budget,
        visitDate: visitDate ? new Date(visitDate) : undefined,
        visitNotes,
        followUpDate: followUpDate ? new Date(followUpDate) : undefined,
        followUpNotes,
        tokenAmount,
        notes,
        assignedToId,
        createdById,
      },
      include: {
        property: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json(lead, { status: 201 })
  } catch (error) {
    console.error('Leads POST error:', error)
    return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, status, stage, lostReason, assignedToId, followUpDate, followUpNotes, notes, userId, role } = body

    if (!userId || !role) {
      return NextResponse.json({ error: 'userId and role are required' }, { status: 400 })
    }

    if (!id) {
      return NextResponse.json({ error: 'Lead id is required' }, { status: 400 })
    }

    const existingLead = await db.lead.findUnique({ where: { id } })
    if (!existingLead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    const access = await validateAccess(userId, role, 'leads', 'update', existingLead.propertyId)
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: 403 })
    }

    const updateData: Record<string, unknown> = {}
    if (status !== undefined) updateData.status = status
    if (stage !== undefined) updateData.stage = stage
    if (lostReason !== undefined) updateData.lostReason = lostReason
    if (assignedToId !== undefined) updateData.assignedToId = assignedToId
    if (followUpDate !== undefined) updateData.followUpDate = new Date(followUpDate)
    if (followUpNotes !== undefined) updateData.followUpNotes = followUpNotes
    if (notes !== undefined) updateData.notes = notes

    const lead = await db.lead.update({
      where: { id },
      data: updateData,
      include: {
        property: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json(lead)
  } catch (error) {
    console.error('Leads PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json()
    const { id, userId, role } = body

    if (!userId || !role) {
      return NextResponse.json({ error: 'userId and role are required' }, { status: 400 })
    }

    if (!id) {
      return NextResponse.json({ error: 'Lead id is required' }, { status: 400 })
    }

    const existingLead = await db.lead.findUnique({
      where: { id },
      include: { bookings: true },
    })
    if (!existingLead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    const access = await validateAccess(userId, role, 'leads', 'delete', existingLead.propertyId)
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: 403 })
    }

    // Check for active bookings
    const activeBookings = existingLead.bookings.filter(
      (b) => b.status === 'confirmed' || b.status === 'checked_in'
    )
    if (activeBookings.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete lead with active bookings. Please cancel bookings first.' },
        { status: 400 }
      )
    }

    // Delete associated bookings first, then the lead
    await db.booking.deleteMany({ where: { leadId: id } })
    await db.lead.delete({ where: { id } })

    return NextResponse.json({ message: 'Lead deleted successfully', id })
  } catch (error) {
    console.error('Leads DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete lead' }, { status: 500 })
  }
}
