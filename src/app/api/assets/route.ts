import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/assets - Assets, laundry, housekeeping
export async function GET(req: NextRequest) {
  try {
    const propertyId = req.nextUrl.searchParams.get('propertyId')
    const type = req.nextUrl.searchParams.get('type') || 'all'
    const where: any = {}
    if (propertyId) where.propertyId = propertyId

    const result: any = {}

    if (type === 'all' || type === 'assets') {
      result.assets = await db.asset.findMany({
        where: propertyId ? { propertyId } : {},
        include: {
          property: { select: { name: true } },
          room: { select: { name: true, number: true } },
        },
        orderBy: { createdAt: 'desc' },
      })

      result.assetStats = {
        total: result.assets.length,
        active: result.assets.filter((a: any) => a.status === 'active').length,
        underMaintenance: result.assets.filter((a: any) => a.status === 'under_maintenance').length,
        disposed: result.assets.filter((a: any) => a.status === 'disposed').length,
        totalValue: result.assets.reduce((s: number, a: any) => s + (a.currentValue || a.purchasePrice || 0), 0),
        byCategory: {} as any,
      }

      // Group by category
      for (const asset of result.assets) {
        const cat = asset.category
        if (!result.assetStats.byCategory[cat]) result.assetStats.byCategory[cat] = 0
        result.assetStats.byCategory[cat]++
      }
    }

    if (type === 'all' || type === 'laundry') {
      result.laundry = await db.laundryItem.findMany({
        where: propertyId ? { propertyId } : {},
        include: {
          property: { select: { name: true } },
          room: { select: { name: true, number: true } },
        },
        orderBy: { name: 'asc' },
      })

      result.laundryStats = {
        totalItems: result.laundry.reduce((s: number, l: any) => s + l.totalQuantity, 0),
        inUse: result.laundry.reduce((s: number, l: any) => s + l.issuedQuantity, 0),
        inLaundry: result.laundry.reduce((s: number, l: any) => s + l.inLaundry, 0),
        damaged: result.laundry.reduce((s: number, l: any) => s + l.damagedQuantity, 0),
      }
    }

    if (type === 'all' || type === 'housekeeping') {
      result.housekeeping = await db.housekeepingItem.findMany({
        where: propertyId ? { propertyId, isActive: true } : { isActive: true },
        include: { property: { select: { name: true } } },
        orderBy: { name: 'asc' },
      })

      result.housekeepingStats = {
        totalItems: result.housekeeping.length,
        lowStock: result.housekeeping.filter((h: any) => h.currentStock <= h.minStock).length,
        totalValue: result.housekeeping.reduce((s: number, h: any) => s + (h.currentStock * h.unitPrice), 0),
      }
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Assets GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch assets' }, { status: 500 })
  }
}

// POST /api/assets
export async function POST(req: NextRequest) {
  try {
    const data = await req.json()

    if (data.type === 'asset') {
      const asset = await db.asset.create({
        data: {
          name: data.name,
          assetTag: data.assetTag,
          category: data.category,
          subCategory: data.subCategory,
          propertyId: data.propertyId,
          roomId: data.roomId || null,
          purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
          purchasePrice: data.purchasePrice,
          currentValue: data.currentValue || data.purchasePrice,
          depreciationRate: data.depreciationRate,
          vendor: data.vendor,
          warrantyExpiry: data.warrantyExpiry ? new Date(data.warrantyExpiry) : null,
          status: 'active',
          condition: data.condition || 'good',
          assignedTo: data.assignedTo,
          notes: data.notes,
        },
      })
      return NextResponse.json(asset)
    }

    if (data.type === 'laundry') {
      const item = await db.laundryItem.create({
        data: {
          name: data.name,
          category: data.category,
          propertyId: data.propertyId,
          roomId: data.roomId || null,
          totalQuantity: data.totalQuantity || 0,
          issuedQuantity: data.issuedQuantity || 0,
          inLaundry: data.inLaundry || 0,
          damagedQuantity: data.damagedQuantity || 0,
          condition: data.condition || 'good',
          status: 'in_use',
          notes: data.notes,
        },
      })
      return NextResponse.json(item)
    }

    if (data.type === 'housekeeping') {
      const item = await db.housekeepingItem.create({
        data: {
          name: data.name,
          category: data.category,
          propertyId: data.propertyId,
          unit: data.unit || 'pcs',
          currentStock: data.currentStock || 0,
          minStock: data.minStock || 0,
          unitPrice: data.unitPrice || 0,
          isActive: true,
          notes: data.notes,
        },
      })
      return NextResponse.json(item)
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (error) {
    console.error('Assets POST error:', error)
    return NextResponse.json({ error: 'Failed to create asset' }, { status: 500 })
  }
}

// PATCH /api/assets
export async function PATCH(req: NextRequest) {
  try {
    const data = await req.json()

    if (data.type === 'asset') {
      const asset = await db.asset.update({
        where: { id: data.id },
        data: {
          name: data.name,
          assetTag: data.assetTag,
          category: data.category,
          subCategory: data.subCategory,
          roomId: data.roomId,
          currentValue: data.currentValue,
          status: data.status,
          condition: data.condition,
          assignedTo: data.assignedTo,
          lastMaintenance: data.lastMaintenance ? new Date(data.lastMaintenance) : undefined,
          nextMaintenance: data.nextMaintenance ? new Date(data.nextMaintenance) : undefined,
          notes: data.notes,
        },
      })
      return NextResponse.json(asset)
    }

    if (data.type === 'laundry') {
      const item = await db.laundryItem.update({
        where: { id: data.id },
        data: {
          totalQuantity: data.totalQuantity,
          issuedQuantity: data.issuedQuantity,
          inLaundry: data.inLaundry,
          damagedQuantity: data.damagedQuantity,
          condition: data.condition,
          lastWashDate: data.lastWashDate ? new Date(data.lastWashDate) : undefined,
          nextWashDate: data.nextWashDate ? new Date(data.nextWashDate) : undefined,
          status: data.status,
          notes: data.notes,
        },
      })
      return NextResponse.json(item)
    }

    if (data.type === 'housekeeping') {
      const item = await db.housekeepingItem.update({
        where: { id: data.id },
        data: {
          currentStock: data.currentStock,
          minStock: data.minStock,
          unitPrice: data.unitPrice,
          lastRestocked: data.lastRestocked ? new Date(data.lastRestocked) : undefined,
          nextRestock: data.nextRestock ? new Date(data.nextRestock) : undefined,
          isActive: data.isActive,
          notes: data.notes,
        },
      })
      return NextResponse.json(item)
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (error) {
    console.error('Assets PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update asset' }, { status: 500 })
  }
}
