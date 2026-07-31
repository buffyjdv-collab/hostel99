import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { validateAccess } from '@/lib/auth-helpers'

// GET /api/inventory - List all inventory items with categories
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId')
    const role = req.nextUrl.searchParams.get('role')
    const propertyId = req.nextUrl.searchParams.get('propertyId')
    const categorySlug = req.nextUrl.searchParams.get('category')
    const categoryId = req.nextUrl.searchParams.get('categoryId')
    const lowStock = req.nextUrl.searchParams.get('lowStock')
    const search = req.nextUrl.searchParams.get('search')
    const transactionsFor = req.nextUrl.searchParams.get('transactions')

    if (!userId || !role) {
      return NextResponse.json({ error: 'userId and role are required' }, { status: 400 })
    }

    const access = await validateAccess(userId, role, 'inventory', 'read', propertyId || undefined)
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: 403 })
    }

    // If requesting transactions for a specific item
    if (transactionsFor) {
      const txns = await db.stockTransaction.findMany({
        where: { itemId: transactionsFor, ...access.whereClause },
        include: { performedBy: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 50,
      })
      return NextResponse.json({ transactions: txns })
    }

    const where: any = { ...access.whereClause }
    if (propertyId) where.propertyId = propertyId
    if (search) where.name = { contains: search }
    if (categoryId) where.categoryId = categoryId
    if (categorySlug) {
      const cat = await db.inventoryCategory.findFirst({ where: { slug: categorySlug } })
      if (cat) where.categoryId = cat.id
    }

    const items = await db.inventoryItem.findMany({
      where,
      include: {
        category: true,
        property: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Filter low stock in JS since Prisma doesn't support cross-field comparison in SQLite
    let filtered = items
    if (lowStock === 'true') {
      filtered = items.filter(item => item.currentStock <= item.minStock)
    }

    const categories = await db.inventoryCategory.findMany({
      where: propertyId ? { propertyId, ...access.whereClause } : access.whereClause,
      include: { _count: { select: { items: true } } },
      orderBy: { name: 'asc' },
    })

    // Stats
    const totalItems = items.length
    const lowStockCount = items.filter(i => i.currentStock <= i.minStock).length
    const totalValue = items.reduce((sum, i) => sum + (i.currentStock * i.unitPrice), 0)
    const expiringSoon = items.filter(i => i.expiryDate && new Date(i.expiryDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)).length

    return NextResponse.json({
      items: filtered,
      categories,
      stats: { totalItems, lowStockCount, totalValue, expiringSoon },
    })
  } catch (error) {
    console.error('Inventory GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 })
  }
}

// POST /api/inventory - Create inventory item
export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    const { userId, role } = data

    if (!userId || !role) {
      return NextResponse.json({ error: 'userId and role are required' }, { status: 400 })
    }

    const access = await validateAccess(userId, role, 'inventory', 'create', data.propertyId)
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: 403 })
    }

    const item = await db.inventoryItem.create({
      data: {
        name: data.name,
        sku: data.sku,
        categoryId: data.categoryId,
        propertyId: data.propertyId,
        unit: data.unit || 'kg',
        unitPrice: data.unitPrice || 0,
        currentStock: data.currentStock || 0,
        openingStock: data.openingStock || data.currentStock || 0,
        minStock: data.minStock || 0,
        maxStock: data.maxStock,
        reorderLevel: data.reorderLevel,
        batchNumber: data.batchNumber,
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
        storeLocation: data.storeLocation,
        gstRate: data.gstRate || 0,
        hsnCode: data.hsnCode,
        isActive: true,
      },
      include: { category: true },
    })

    // Create opening stock transaction if stock > 0
    if (item.currentStock > 0) {
      await db.stockTransaction.create({
        data: {
          itemId: item.id,
          propertyId: item.propertyId,
          type: 'opening',
          quantity: item.currentStock,
          previousStock: 0,
          newStock: item.currentStock,
          unitPrice: item.unitPrice,
          notes: 'Opening stock',
        },
      })
    }

    return NextResponse.json(item)
  } catch (error) {
    console.error('Inventory POST error:', error)
    return NextResponse.json({ error: 'Failed to create inventory item' }, { status: 500 })
  }
}

// PATCH /api/inventory - Update stock (adjustment)
export async function PATCH(req: NextRequest) {
  try {
    const data = await req.json()
    const { userId, role } = data

    if (!userId || !role) {
      return NextResponse.json({ error: 'userId and role are required' }, { status: 400 })
    }

    if (data.action === 'adjust') {
      const item = await db.inventoryItem.findUnique({ where: { id: data.itemId } })
      if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 })

      const access = await validateAccess(userId, role, 'inventory', 'update', item.propertyId)
      if (!access.allowed) {
        return NextResponse.json({ error: access.error }, { status: 403 })
      }

      const previousStock = item.currentStock
      const newStock = previousStock + data.quantity

      const [updated] = await Promise.all([
        db.inventoryItem.update({
          where: { id: data.itemId },
          data: { currentStock: newStock },
        }),
        db.stockTransaction.create({
          data: {
            itemId: data.itemId,
            propertyId: item.propertyId,
            type: data.type || 'adjustment',
            quantity: data.quantity,
            previousStock,
            newStock,
            unitPrice: item.unitPrice,
            notes: data.notes,
            performedById: data.userId,
          },
        }),
      ])

      return NextResponse.json(updated)
    }

    if (data.action === 'transfer') {
      const access = await validateAccess(userId, role, 'inventory', 'update')
      if (!access.allowed) {
        return NextResponse.json({ error: access.error }, { status: 403 })
      }

      const fromItem = await db.inventoryItem.findUnique({ where: { id: data.fromItemId } })
      if (!fromItem) return NextResponse.json({ error: 'Source item not found' }, { status: 404 })

      const toItem = await db.inventoryItem.findUnique({ where: { id: data.toItemId } })
      if (!toItem) return NextResponse.json({ error: 'Target item not found' }, { status: 404 })

      // Verify access to both properties
      const fromAccess = await validateAccess(userId, role, 'inventory', 'update', fromItem.propertyId)
      if (!fromAccess.allowed) {
        return NextResponse.json({ error: fromAccess.error }, { status: 403 })
      }
      const toAccess = await validateAccess(userId, role, 'inventory', 'update', toItem.propertyId)
      if (!toAccess.allowed) {
        return NextResponse.json({ error: toAccess.error }, { status: 403 })
      }

      const qty = data.quantity
      const fromPrev = fromItem.currentStock
      const toPrev = toItem.currentStock

      await Promise.all([
        db.inventoryItem.update({ where: { id: data.fromItemId }, data: { currentStock: fromPrev - qty } }),
        db.inventoryItem.update({ where: { id: data.toItemId }, data: { currentStock: toPrev + qty } }),
        db.stockTransaction.create({
          data: {
            itemId: data.fromItemId, propertyId: fromItem.propertyId, type: 'transfer_out',
            quantity: -qty, previousStock: fromPrev, newStock: fromPrev - qty, notes: `Transfer to ${toItem.name}`,
          },
        }),
        db.stockTransaction.create({
          data: {
            itemId: data.toItemId, propertyId: toItem.propertyId, type: 'transfer_in',
            quantity: qty, previousStock: toPrev, newStock: toPrev + qty, notes: `Transfer from ${fromItem.name}`,
          },
        }),
      ])

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Inventory PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update inventory' }, { status: 500 })
  }
}

// DELETE /api/inventory - Delete inventory item
export async function DELETE(req: NextRequest) {
  try {
    const data = await req.json()
    const { id, userId, role } = data

    if (!userId || !role) {
      return NextResponse.json({ error: 'userId and role are required' }, { status: 400 })
    }

    if (!id) {
      return NextResponse.json({ error: 'Item id is required' }, { status: 400 })
    }

    const existingItem = await db.inventoryItem.findUnique({ where: { id } })
    if (!existingItem) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    const access = await validateAccess(userId, role, 'inventory', 'delete', existingItem.propertyId)
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: 403 })
    }

    // Delete related records first, then the item
    await db.stockTransaction.deleteMany({ where: { itemId: id } })
    await db.kitchenIssue.deleteMany({ where: { itemId: id } })
    await db.recipeItem.deleteMany({ where: { itemId: id } })
    await db.consumptionLog.deleteMany({ where: { itemId: id } })
    await db.wasteRecord.deleteMany({ where: { itemId: id } })
    await db.purchaseOrderItem.deleteMany({ where: { itemId: id } })
    await db.inventoryItem.delete({ where: { id } })

    return NextResponse.json({ message: 'Inventory item deleted successfully', id })
  } catch (error) {
    console.error('Inventory DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete inventory item' }, { status: 500 })
  }
}
