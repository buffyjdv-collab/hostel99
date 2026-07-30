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
