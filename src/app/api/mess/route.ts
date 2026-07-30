import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/mess - Mess attendance, consumption, waste
export async function GET(req: NextRequest) {
  try {
    const propertyId = req.nextUrl.searchParams.get('propertyId')
    const type = req.nextUrl.searchParams.get('type') || 'all'
    const date = req.nextUrl.searchParams.get('date')

    const where: any = {}
    if (propertyId) where.propertyId = propertyId

    const result: any = {}

    if (type === 'all' || type === 'attendance') {
      const today = date ? new Date(date) : new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const attendance = await db.messAttendance.findMany({
        where: {
          ...where,
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
        where: { ...where, date: { gte: startDate } },
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
        where: { ...where, date: { gte: startDate } },
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
