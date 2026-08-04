import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { validateAccess } from '@/lib/auth-helpers'

// GET /api/purchases - Purchase orders, requisitions, GRNs
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId')
    const role = req.nextUrl.searchParams.get('role')
    const propertyId = req.nextUrl.searchParams.get('propertyId')
    const type = req.nextUrl.searchParams.get('type') || 'orders'

    if (!userId || !role) {
      return NextResponse.json({ error: 'userId and role are required' }, { status: 400 })
    }

    const access = await validateAccess(userId, role, 'purchases', 'read', propertyId || undefined)
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: 403 })
    }

    const where = propertyId ? { propertyId } : access.whereClause

    if (type === 'requisitions') {
      const requisitions = await db.purchaseRequisition.findMany({
        where,
        include: {
          property: { select: { name: true } },
          requestedBy: { select: { name: true } },
          approvedBy: { select: { name: true } },
          items: true,
        },
        orderBy: { createdAt: 'desc' },
      })
      return NextResponse.json({ requisitions })
    }

    if (type === 'grns') {
      const grns = await db.goodsReceivedNote.findMany({
        where,
        include: {
          purchaseOrder: { include: { vendor: { select: { name: true } } } },
          receivedBy: { select: { name: true } },
          items: true,
        },
        orderBy: { createdAt: 'desc' },
      })
      return NextResponse.json({ grns })
    }

    // Default: purchase orders
    const orders = await db.purchaseOrder.findMany({
      where,
      include: {
        vendor: { select: { name: true, phone: true } },
        property: { select: { name: true } },
        createdBy: { select: { name: true } },
        approvedBy: { select: { name: true } },
        items: { include: { item: { select: { name: true, unit: true } } } },
        _count: { select: { goodsReceivedNotes: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const stats = {
      totalOrders: orders.length,
      pendingOrders: orders.filter(o => ['draft', 'submitted', 'approved'].includes(o.status)).length,
      totalValue: orders.reduce((s, o) => s + o.netAmount, 0),
      receivedOrders: orders.filter(o => ['received', 'partially_received'].includes(o.status)).length,
    }

    return NextResponse.json({ orders, stats })
  } catch (error) {
    console.error('Purchases GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch purchases' }, { status: 500 })
  }
}

// POST /api/purchases
export async function POST(req: NextRequest) {
  try {
    const data = await req.json()

    const userId = data.userId
    const role = data.role
    if (!userId || !role) {
      return NextResponse.json({ error: 'userId and role are required' }, { status: 400 })
    }
    const access = await validateAccess(userId, role, 'purchases', 'create', data.propertyId)
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: 403 })
    }

    if (data.type === 'requisition') {
      const prCount = await db.purchaseRequisition.count()
      const pr = await db.purchaseRequisition.create({
        data: {
          prNumber: `PR-${String(prCount + 1).padStart(4, '0')}`,
          title: data.title,
          description: data.description,
          propertyId: data.propertyId,
          requestedById: data.userId,
          status: 'submitted',
          priority: data.priority || 'normal',
          requiredBy: data.requiredBy ? new Date(data.requiredBy) : null,
          notes: data.notes,
          items: {
            create: (data.items || []).map((item: any) => ({
              itemName: item.itemName,
              description: item.description,
              quantity: item.quantity,
              unit: item.unit,
              estimatedPrice: item.estimatedPrice,
              notes: item.notes,
            })),
          },
        },
        include: { items: true },
      })
      return NextResponse.json(pr)
    }

    if (data.type === 'grn') {
      const grnCount = await db.goodsReceivedNote.count()
      const po = await db.purchaseOrder.findUnique({
        where: { id: data.purchaseOrderId },
        include: { items: true },
      })
      if (!po) return NextResponse.json({ error: 'PO not found' }, { status: 404 })

      // Verify access to the PO's property
      if (!access.userCtx.isSuperAdmin && !access.userCtx.propertyIds.includes(po.propertyId)) {
        return NextResponse.json({ error: 'You do not have access to this property' }, { status: 403 })
      }

      const grn = await db.goodsReceivedNote.create({
        data: {
          grnNumber: `GRN-${String(grnCount + 1).padStart(4, '0')}`,
          purchaseOrderId: data.purchaseOrderId,
          propertyId: data.propertyId,
          receivedById: data.userId,
          receivedDate: new Date(),
          invoiceNumber: data.invoiceNumber,
          invoiceDate: data.invoiceDate ? new Date(data.invoiceDate) : null,
          invoiceAmount: data.invoiceAmount,
          status: 'pending_inspection',
          notes: data.notes,
          items: {
            create: (data.items || []).map((item: any) => ({
              poItemId: item.poItemId,
              itemName: item.itemName,
              orderedQty: item.orderedQty,
              receivedQty: item.receivedQty,
              acceptedQty: item.acceptedQty,
              rejectedQty: item.rejectedQty || 0,
              unitPrice: item.unitPrice,
              batchNumber: item.batchNumber,
              expiryDate: item.expiryDate ? new Date(item.expiryDate) : null,
              notes: item.notes,
            })),
          },
        },
        include: { items: true },
      })

      // Update PO item received quantities and stock
      for (const grnItem of grn.items) {
        if (grnItem.acceptedQty > 0) {
          // Find the inventory item from the PO item
          const poItem = po.items.find(pi => pi.id === grnItem.poItemId)
          if (poItem?.itemId) {
            const invItem = await db.inventoryItem.findUnique({ where: { id: poItem.itemId } })
            if (invItem) {
              const prevStock = invItem.currentStock
              const newStock = prevStock + grnItem.acceptedQty
              await Promise.all([
                db.inventoryItem.update({
                  where: { id: invItem.id },
                  data: { currentStock: newStock },
                }),
                db.stockTransaction.create({
                  data: {
                    itemId: invItem.id,
                    propertyId: invItem.propertyId,
                    type: 'purchase',
                    quantity: grnItem.acceptedQty,
                    previousStock: prevStock,
                    newStock,
                    unitPrice: grnItem.unitPrice,
                    reference: grn.grnNumber,
                    referenceId: grn.id,
                    batchNumber: grnItem.batchNumber,
                    expiryDate: grnItem.expiryDate,
                    performedById: data.userId,
                  },
                }),
              ])
            }
          }
          // Update PO item received qty
          if (grnItem.poItemId) {
            await db.purchaseOrderItem.update({
              where: { id: grnItem.poItemId },
              data: { receivedQty: { increment: grnItem.acceptedQty } },
            })
          }
        }
      }

      return NextResponse.json(grn)
    }

    // Default: create purchase order
    const poCount = await db.purchaseOrder.count()
    const items = (data.items || []) as any[]
    const totalAmount = items.reduce((s: number, i: any) => s + i.totalPrice, 0)
    const gstAmount = items.reduce((s: number, i: any) => s + (i.totalPrice * (i.gstRate || 0) / 100), 0)
    const discount = data.discount || 0
    const netAmount = totalAmount + gstAmount - discount

    const po = await db.purchaseOrder.create({
      data: {
        poNumber: `PO-${String(poCount + 1).padStart(4, '0')}`,
        vendorId: data.vendorId,
        propertyId: data.propertyId,
        createdById: data.userId,
        status: 'draft',
        orderDate: new Date(),
        expectedDelivery: data.expectedDelivery ? new Date(data.expectedDelivery) : null,
        totalAmount,
        gstAmount,
        discount,
        netAmount,
        paymentStatus: 'unpaid',
        notes: data.notes,
        items: {
          create: items.map((item: any) => ({
            itemId: item.itemId || null,
            itemName: item.itemName,
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            unitPrice: item.unitPrice,
            gstRate: item.gstRate || 0,
            totalPrice: item.totalPrice,
          })),
        },
      },
      include: { items: true, vendor: true },
    })

    return NextResponse.json(po)
  } catch (error) {
    console.error('Purchases POST error:', error)
    return NextResponse.json({ error: 'Failed to create purchase' }, { status: 500 })
  }
}

// PATCH /api/purchases - Update PO/GRN status
export async function PATCH(req: NextRequest) {
  try {
    const data = await req.json()

    const userId = data.userId
    const role = data.role
    if (!userId || !role) {
      return NextResponse.json({ error: 'userId and role are required' }, { status: 400 })
    }

    if (data.type === 'requisition') {
      const existing = await db.purchaseRequisition.findUnique({ where: { id: data.id } })
      if (!existing) return NextResponse.json({ error: 'Requisition not found' }, { status: 404 })

      const access = await validateAccess(userId, role, 'purchases', 'update', existing.propertyId)
      if (!access.allowed) {
        return NextResponse.json({ error: access.error }, { status: 403 })
      }

      const pr = await db.purchaseRequisition.update({
        where: { id: data.id },
        data: {
          status: data.status,
          approvedById: data.approvedById,
          approvedAt: data.status === 'approved' ? new Date() : undefined,
        },
      })
      return NextResponse.json(pr)
    }

    if (data.type === 'grn') {
      const existing = await db.goodsReceivedNote.findUnique({ where: { id: data.id } })
      if (!existing) return NextResponse.json({ error: 'GRN not found' }, { status: 404 })

      const access = await validateAccess(userId, role, 'purchases', 'update', existing.propertyId)
      if (!access.allowed) {
        return NextResponse.json({ error: access.error }, { status: 403 })
      }

      const grn = await db.goodsReceivedNote.update({
        where: { id: data.id },
        data: { status: data.status },
      })
      return NextResponse.json(grn)
    }

    // Default: update PO
    const existing = await db.purchaseOrder.findUnique({ where: { id: data.id } })
    if (!existing) return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 })

    const access = await validateAccess(userId, role, 'purchases', 'update', existing.propertyId)
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: 403 })
    }

    const po = await db.purchaseOrder.update({
      where: { id: data.id },
      data: {
        status: data.status,
        approvedById: data.approvedById,
        paymentStatus: data.paymentStatus,
        paymentMode: data.paymentMode,
      },
    })
    return NextResponse.json(po)
  } catch (error) {
    console.error('Purchases PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update purchase' }, { status: 500 })
  }
}

// DELETE /api/purchases - Delete PO/PR/GRN
export async function DELETE(req: NextRequest) {
  try {
    const data = await req.json()

    const userId = data.userId
    const role = data.role
    if (!userId || !role) {
      return NextResponse.json({ error: 'userId and role are required' }, { status: 400 })
    }

    if (data.type === 'requisition') {
      const existing = await db.purchaseRequisition.findUnique({ where: { id: data.id } })
      if (!existing) return NextResponse.json({ error: 'Purchase requisition not found' }, { status: 404 })

      const access = await validateAccess(userId, role, 'purchases', 'delete', existing.propertyId)
      if (!access.allowed) {
        return NextResponse.json({ error: access.error }, { status: 403 })
      }

      // Only allow deletion of draft or cancelled requisitions
      if (!['draft', 'cancelled', 'rejected'].includes(existing.status)) {
        return NextResponse.json(
          { error: 'Cannot delete requisition with status: ' + existing.status + '. Only draft, cancelled, or rejected requisitions can be deleted.' },
          { status: 400 }
        )
      }

      // Items have cascade delete in schema
      await db.purchaseRequisition.delete({ where: { id: data.id } })
      return NextResponse.json({ message: 'Purchase requisition deleted successfully', id: data.id })
    }

    if (data.type === 'grn') {
      const existing = await db.goodsReceivedNote.findUnique({ where: { id: data.id } })
      if (!existing) return NextResponse.json({ error: 'GRN not found' }, { status: 404 })

      const access = await validateAccess(userId, role, 'purchases', 'delete', existing.propertyId)
      if (!access.allowed) {
        return NextResponse.json({ error: access.error }, { status: 403 })
      }

      // Only allow deletion of pending inspection or rejected GRNs
      if (!['pending_inspection', 'rejected'].includes(existing.status)) {
        return NextResponse.json(
          { error: 'Cannot delete GRN with status: ' + existing.status + '. Only pending_inspection or rejected GRNs can be deleted.' },
          { status: 400 }
        )
      }

      // Items have cascade delete in schema
      await db.goodsReceivedNote.delete({ where: { id: data.id } })
      return NextResponse.json({ message: 'GRN deleted successfully', id: data.id })
    }

    // Default: delete purchase order
    const existing = await db.purchaseOrder.findUnique({
      where: { id: data.id },
      include: { goodsReceivedNotes: true },
    })
    if (!existing) return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 })

    const access = await validateAccess(userId, role, 'purchases', 'delete', existing.propertyId)
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: 403 })
    }

    // Only allow deletion of draft or cancelled POs
    if (!['draft', 'cancelled'].includes(existing.status)) {
      return NextResponse.json(
        { error: 'Cannot delete PO with status: ' + existing.status + '. Only draft or cancelled POs can be deleted.' },
        { status: 400 }
      )
    }

    // Check for GRNs
    if (existing.goodsReceivedNotes.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete PO with existing GRNs. Please delete GRNs first.' },
        { status: 400 }
      )
    }

    // Items have cascade delete in schema
    await db.purchaseOrder.delete({ where: { id: data.id } })
    return NextResponse.json({ message: 'Purchase order deleted successfully', id: data.id })
  } catch (error) {
    console.error('Purchases DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete purchase' }, { status: 500 })
  }
}
