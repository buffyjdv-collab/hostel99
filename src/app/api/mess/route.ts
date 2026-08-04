import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { validateAccess } from '@/lib/auth-helpers'

// GET /api/mess - Mess attendance, consumption, waste
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId')
    const role = req.nextUrl.searchParams.get('role')
    const propertyId = req.nextUrl.searchParams.get('propertyId')
    const type = req.nextUrl.searchParams.get('type') || 'all'
    const date = req.nextUrl.searchParams.get('date')

    if (!userId || !role) {
      return NextResponse.json({ error: 'userId and role are required' }, { status: 400 })
    }

    const access = await validateAccess(userId, role, 'mess', 'read', propertyId || undefined)
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: 403 })
    }

    const scopedWhere = propertyId ? { propertyId } : access.whereClause
    const result: any = {}

    if (type === 'all' || type === 'attendance') {
      const today = date ? new Date(date) : new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const attendance = await db.messAttendance.findMany({
        where: {
          ...scopedWhere,
          date: { gte: today, lt: tomorrow },
        },
        include: {
          tenant: { select: { name: true } },
          markedBy: { select: { name: true } },
        },
        orderBy: { mealType: 'asc' },
      })

      // Group by meal type
      const byMeal: any = {}
      for (const att of attendance) {
        if (!byMeal[att.mealType]) byMeal[att.mealType] = { present: 0, absent: 0, guests: 0, records: [] }
        if (att.present) byMeal[att.mealType].present++
        else byMeal[att.mealType].absent++
        byMeal[att.mealType].guests += att.guestCount
        byMeal[att.mealType].records.push(att)
      }

      result.attendance = byMeal
      result.totalPresent = attendance.filter(a => a.present).length
      result.totalGuests = attendance.reduce((s, a) => s + a.guestCount, 0)
    }

    if (type === 'all' || type === 'consumption') {
      const days = parseInt(req.nextUrl.searchParams.get('days') || '7')
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)
      startDate.setHours(0, 0, 0, 0)

      result.consumption = await db.consumptionLog.findMany({
        where: { ...scopedWhere, date: { gte: startDate } },
        include: { item: { select: { name: true, unit: true } } },
        orderBy: { date: 'desc' },
        take: 100,
      })
    }

    if (type === 'all' || type === 'waste') {
      const days = parseInt(req.nextUrl.searchParams.get('days') || '7')
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)
      startDate.setHours(0, 0, 0, 0)

      result.waste = await db.wasteRecord.findMany({
        where: { ...scopedWhere, date: { gte: startDate } },
        include: { item: { select: { name: true } } },
        orderBy: { date: 'desc' },
        take: 50,
      })

      result.wasteStats = {
        totalWaste: result.waste.reduce((s: number, w: any) => s + w.estimatedCost, 0),
        foodWaste: result.waste.filter((w: any) => w.category === 'food_waste').reduce((s: number, w: any) => s + w.estimatedCost, 0),
        expired: result.waste.filter((w: any) => w.category === 'expired').reduce((s: number, w: any) => s + w.estimatedCost, 0),
        damaged: result.waste.filter((w: any) => w.category === 'damaged').reduce((s: number, w: any) => s + w.estimatedCost, 0),
      }
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Mess GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch mess data' }, { status: 500 })
  }
}

// POST /api/mess
export async function POST(req: NextRequest) {
  try {
    const data = await req.json()

    const userId = data.userId
    const role = data.role
    if (!userId || !role) {
      return NextResponse.json({ error: 'userId and role are required' }, { status: 400 })
    }
    const access = await validateAccess(userId, role, 'mess', 'create', data.propertyId)
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: 403 })
    }

    if (data.type === 'attendance') {
      // Bulk mark attendance for a meal
      const records = data.records as any[] // [{ tenantId, present, guestCount }]
      const date = new Date(data.date)
      const mealType = data.mealType

      const created = []
      for (const rec of records) {
        const att = await db.messAttendance.create({
          data: {
            date,
            mealType,
            propertyId: data.propertyId,
            tenantId: rec.tenantId || null,
            present: rec.present ?? false,
            guestCount: rec.guestCount || 0,
            markedById: data.userId,
            notes: rec.notes,
          },
        })
        created.push(att)
      }
      return NextResponse.json({ created, count: created.length })
    }

    if (data.type === 'consumption') {
      const log = await db.consumptionLog.create({
        data: {
          date: new Date(data.date),
          itemId: data.itemId,
          propertyId: data.propertyId,
          mealType: data.mealType,
          issuedQty: data.issuedQty || 0,
          consumedQty: data.consumedQty || 0,
          returnedQty: data.returnedQty || 0,
          wastageQty: data.wastageQty || 0,
          unit: data.unit,
          costPerUnit: data.costPerUnit || 0,
          totalCost: data.totalCost || 0,
          notes: data.notes,
        },
      })
      return NextResponse.json(log)
    }

    if (data.type === 'waste') {
      const record = await db.wasteRecord.create({
        data: {
          date: new Date(data.date),
          category: data.category,
          itemId: data.itemId || null,
          propertyId: data.propertyId,
          description: data.description,
          quantity: data.quantity || 0,
          unit: data.unit,
          estimatedCost: data.estimatedCost || 0,
          disposalMethod: data.disposalMethod,
          disposalDate: data.disposalDate ? new Date(data.disposalDate) : null,
          recordedById: data.userId,
          notes: data.notes,
        },
      })

      // If item is specified, deduct from stock for waste
      if (data.itemId && data.quantity > 0) {
        const item = await db.inventoryItem.findUnique({ where: { id: data.itemId } })
        if (item) {
          const prevStock = item.currentStock
          const newStock = Math.max(0, prevStock - data.quantity)
          await Promise.all([
            db.inventoryItem.update({ where: { id: data.itemId }, data: { currentStock: newStock } }),
            db.stockTransaction.create({
              data: {
                itemId: data.itemId,
                propertyId: item.propertyId,
                type: data.category === 'expired' ? 'expiry' : 'damage',
                quantity: -data.quantity,
                previousStock: prevStock,
                newStock,
                unitPrice: item.unitPrice,
                notes: `Waste: ${data.description}`,
                performedById: data.userId,
              },
            }),
          ])
        }
      }

      return NextResponse.json(record)
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (error) {
    console.error('Mess POST error:', error)
    return NextResponse.json({ error: 'Failed to process mess request' }, { status: 500 })
  }
}

// PATCH /api/mess - Update attendance, consumption, waste
export async function PATCH(req: NextRequest) {
  try {
    const data = await req.json()

    const userId = data.userId
    const role = data.role
    if (!userId || !role) {
      return NextResponse.json({ error: 'userId and role are required' }, { status: 400 })
    }

    if (data.type === 'attendance') {
      const existing = await db.messAttendance.findUnique({ where: { id: data.id } })
      if (!existing) return NextResponse.json({ error: 'Attendance record not found' }, { status: 404 })

      const access = await validateAccess(userId, role, 'mess', 'update', existing.propertyId)
      if (!access.allowed) {
        return NextResponse.json({ error: access.error }, { status: 403 })
      }

      const updateData: Record<string, unknown> = {}
      if (data.present !== undefined) updateData.present = data.present
      if (data.guestCount !== undefined) updateData.guestCount = data.guestCount
      if (data.notes !== undefined) updateData.notes = data.notes

      const attendance = await db.messAttendance.update({
        where: { id: data.id },
        data: updateData,
        include: {
          tenant: { select: { name: true } },
          markedBy: { select: { name: true } },
        },
      })
      return NextResponse.json(attendance)
    }

    if (data.type === 'consumption') {
      const existing = await db.consumptionLog.findUnique({ where: { id: data.id } })
      if (!existing) return NextResponse.json({ error: 'Consumption log not found' }, { status: 404 })

      const access = await validateAccess(userId, role, 'mess', 'update', existing.propertyId)
      if (!access.allowed) {
        return NextResponse.json({ error: access.error }, { status: 403 })
      }

      const updateData: Record<string, unknown> = {}
      if (data.issuedQty !== undefined) updateData.issuedQty = data.issuedQty
      if (data.consumedQty !== undefined) updateData.consumedQty = data.consumedQty
      if (data.returnedQty !== undefined) updateData.returnedQty = data.returnedQty
      if (data.wastageQty !== undefined) updateData.wastageQty = data.wastageQty
      if (data.costPerUnit !== undefined) updateData.costPerUnit = data.costPerUnit
      if (data.totalCost !== undefined) updateData.totalCost = data.totalCost
      if (data.notes !== undefined) updateData.notes = data.notes

      const log = await db.consumptionLog.update({
        where: { id: data.id },
        data: updateData,
        include: { item: { select: { name: true, unit: true } } },
      })
      return NextResponse.json(log)
    }

    if (data.type === 'waste') {
      const existing = await db.wasteRecord.findUnique({ where: { id: data.id } })
      if (!existing) return NextResponse.json({ error: 'Waste record not found' }, { status: 404 })

      const access = await validateAccess(userId, role, 'mess', 'update', existing.propertyId)
      if (!access.allowed) {
        return NextResponse.json({ error: access.error }, { status: 403 })
      }

      const updateData: Record<string, unknown> = {}
      if (data.category !== undefined) updateData.category = data.category
      if (data.description !== undefined) updateData.description = data.description
      if (data.quantity !== undefined) updateData.quantity = data.quantity
      if (data.unit !== undefined) updateData.unit = data.unit
      if (data.estimatedCost !== undefined) updateData.estimatedCost = data.estimatedCost
      if (data.disposalMethod !== undefined) updateData.disposalMethod = data.disposalMethod
      if (data.disposalDate !== undefined) updateData.disposalDate = data.disposalDate ? new Date(data.disposalDate) : null
      if (data.notes !== undefined) updateData.notes = data.notes

      const record = await db.wasteRecord.update({
        where: { id: data.id },
        data: updateData,
        include: { item: { select: { name: true } } },
      })
      return NextResponse.json(record)
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (error) {
    console.error('Mess PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update mess data' }, { status: 500 })
  }
}

// DELETE /api/mess - Delete attendance, consumption, waste
export async function DELETE(req: NextRequest) {
  try {
    const data = await req.json()

    const userId = data.userId
    const role = data.role
    if (!userId || !role) {
      return NextResponse.json({ error: 'userId and role are required' }, { status: 400 })
    }

    if (data.type === 'attendance') {
      const existing = await db.messAttendance.findUnique({ where: { id: data.id } })
      if (!existing) return NextResponse.json({ error: 'Attendance record not found' }, { status: 404 })

      const access = await validateAccess(userId, role, 'mess', 'delete', existing.propertyId)
      if (!access.allowed) {
        return NextResponse.json({ error: access.error }, { status: 403 })
      }

      await db.messAttendance.delete({ where: { id: data.id } })
      return NextResponse.json({ message: 'Attendance record deleted successfully', id: data.id })
    }

    if (data.type === 'consumption') {
      const existing = await db.consumptionLog.findUnique({ where: { id: data.id } })
      if (!existing) return NextResponse.json({ error: 'Consumption log not found' }, { status: 404 })

      const access = await validateAccess(userId, role, 'mess', 'delete', existing.propertyId)
      if (!access.allowed) {
        return NextResponse.json({ error: access.error }, { status: 403 })
      }

      await db.consumptionLog.delete({ where: { id: data.id } })
      return NextResponse.json({ message: 'Consumption log deleted successfully', id: data.id })
    }

    if (data.type === 'waste') {
      const existing = await db.wasteRecord.findUnique({ where: { id: data.id } })
      if (!existing) return NextResponse.json({ error: 'Waste record not found' }, { status: 404 })

      const access = await validateAccess(userId, role, 'mess', 'delete', existing.propertyId)
      if (!access.allowed) {
        return NextResponse.json({ error: access.error }, { status: 403 })
      }

      await db.wasteRecord.delete({ where: { id: data.id } })
      return NextResponse.json({ message: 'Waste record deleted successfully', id: data.id })
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (error) {
    console.error('Mess DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete mess data' }, { status: 500 })
  }
}
