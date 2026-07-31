import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { validateAccess } from '@/lib/auth-helpers'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const role = searchParams.get('role')
    const status = searchParams.get('status')
    const propertyId = searchParams.get('propertyId')
    const tenantId = searchParams.get('tenantId')

    if (!userId || !role) {
      return NextResponse.json({ error: 'userId and role are required' }, { status: 400 })
    }

    const access = await validateAccess(userId, role, 'complaints', 'read', propertyId || undefined)
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: 403 })
    }

    const where: Record<string, unknown> = { ...access.whereClause }
    if (status) where.status = status
    if (propertyId) where.propertyId = propertyId

    // Tenants can only see their own complaints
    if (role === 'tenant') {
      where.tenantId = userId
    } else if (tenantId) {
      where.tenantId = tenantId
    }

    const complaints = await db.complaint.findMany({
      where,
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            phone: true,
            room: { select: { id: true, name: true, number: true } },
          },
        },
        assignedTo: {
          select: { id: true, name: true, email: true, phone: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(complaints)
  } catch (error) {
    console.error('Complaints GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch complaints' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      title,
      description,
      category,
      priority,
      propertyId,
      tenantId,
      assignedToId,
      createdById,
      userId,
      role,
    } = body

    if (!userId || !role) {
      return NextResponse.json({ error: 'userId and role are required' }, { status: 400 })
    }

    const access = await validateAccess(userId, role, 'complaints', 'create', propertyId)
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: 403 })
    }

    if (!title || !description || !propertyId || !tenantId || !createdById) {
      return NextResponse.json(
        { error: 'Title, description, propertyId, tenantId, and createdById are required' },
        { status: 400 }
      )
    }

    // Tenants can only create complaints for themselves
    const effectiveTenantId = role === 'tenant' ? userId : tenantId

    const complaint = await db.complaint.create({
      data: {
        title,
        description,
        category: category || 'maintenance',
        priority: priority || 'medium',
        propertyId,
        tenantId: effectiveTenantId,
        assignedToId,
        createdById,
      },
      include: {
        tenant: { select: { id: true, name: true, phone: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json(complaint, { status: 201 })
  } catch (error) {
    console.error('Complaints POST error:', error)
    return NextResponse.json({ error: 'Failed to create complaint' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, status, assignedToId, priority, resolution, rating, userId, role } = body

    if (!userId || !role) {
      return NextResponse.json({ error: 'userId and role are required' }, { status: 400 })
    }

    if (!id) {
      return NextResponse.json({ error: 'Complaint id is required' }, { status: 400 })
    }

    const existingComplaint = await db.complaint.findUnique({ where: { id } })
    if (!existingComplaint) {
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 })
    }

    const access = await validateAccess(userId, role, 'complaints', 'update', existingComplaint.propertyId)
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: 403 })
    }

    // Tenants can only update their own complaints
    if (role === 'tenant' && existingComplaint.tenantId !== userId) {
      return NextResponse.json({ error: 'You can only update your own complaints' }, { status: 403 })
    }

    const updateData: Record<string, unknown> = {}
    if (status !== undefined) updateData.status = status
    if (assignedToId !== undefined) updateData.assignedToId = assignedToId
    if (priority !== undefined) updateData.priority = priority
    if (resolution !== undefined) updateData.resolution = resolution
    if (rating !== undefined) updateData.rating = rating

    const complaint = await db.complaint.update({
      where: { id },
      data: updateData,
      include: {
        tenant: { select: { id: true, name: true, phone: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json(complaint)
  } catch (error) {
    console.error('Complaints PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update complaint' }, { status: 500 })
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
      return NextResponse.json({ error: 'Complaint id is required' }, { status: 400 })
    }

    const existingComplaint = await db.complaint.findUnique({ where: { id } })
    if (!existingComplaint) {
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 })
    }

    const access = await validateAccess(userId, role, 'complaints', 'delete', existingComplaint.propertyId)
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: 403 })
    }

    // Delete related activity logs first
    await db.activityLog.deleteMany({ where: { complaintId: id } })
    await db.complaint.delete({ where: { id } })

    return NextResponse.json({ message: 'Complaint deleted successfully', id })
  } catch (error) {
    console.error('Complaints DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete complaint' }, { status: 500 })
  }
}
