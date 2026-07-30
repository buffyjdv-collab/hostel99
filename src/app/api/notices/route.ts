import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const notices = await db.notice.findMany({
      where: { isActive: true },
      include: {
        property: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(notices)
  } catch (error) {
    console.error('Notices GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch notices' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { title, content, type, propertyId, createdById, isActive, expiryDate } = body

    if (!title || !content || !propertyId || !createdById) {
      return NextResponse.json(
        { error: 'Title, content, propertyId, and createdById are required' },
        { status: 400 }
      )
    }

    const notice = await db.notice.create({
      data: {
        title,
        content,
        type: type || 'general',
        propertyId,
        createdById,
        isActive: isActive !== undefined ? isActive : true,
        expiryDate: expiryDate ? new Date(expiryDate) : undefined,
      },
      include: {
        property: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    })

    return NextResponse.json(notice, { status: 201 })
  } catch (error) {
    console.error('Notices POST error:', error)
    return NextResponse.json({ error: 'Failed to create notice' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, title, content, type, propertyId, createdById, isActive, expiryDate } = body

    if (!id) {
      return NextResponse.json({ error: 'Notice id is required' }, { status: 400 })
    }

    const existingNotice = await db.notice.findUnique({ where: { id } })
    if (!existingNotice) {
      return NextResponse.json({ error: 'Notice not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    if (title !== undefined) updateData.title = title
    if (content !== undefined) updateData.content = content
    if (type !== undefined) updateData.type = type
    if (propertyId !== undefined) updateData.propertyId = propertyId
    if (createdById !== undefined) updateData.createdById = createdById
    if (isActive !== undefined) updateData.isActive = isActive
    if (expiryDate !== undefined) updateData.expiryDate = expiryDate ? new Date(expiryDate) : null

    const notice = await db.notice.update({
      where: { id },
      data: updateData,
      include: {
        property: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    })

    return NextResponse.json(notice)
  } catch (error) {
    console.error('Notices PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update notice' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: 'Notice id is required' }, { status: 400 })
    }

    const existingNotice = await db.notice.findUnique({ where: { id } })
    if (!existingNotice) {
      return NextResponse.json({ error: 'Notice not found' }, { status: 404 })
    }

    // Soft delete by setting isActive to false
    await db.notice.update({
      where: { id },
      data: { isActive: false },
    })

    return NextResponse.json({ message: 'Notice deleted successfully', id })
  } catch (error) {
    console.error('Notices DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete notice' }, { status: 500 })
  }
}
