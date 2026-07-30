import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const month = searchParams.get('month')
    const year = searchParams.get('year')
    const propertyId = searchParams.get('propertyId')

    const where: Record<string, unknown> = {}

    if (status) where.status = status
    if (month) where.month = parseInt(month)
    if (year) where.year = parseInt(year)
    if (propertyId) where.propertyId = propertyId

    const payments = await db.payment.findMany({
      where,
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            phone: true,
            room: { select: { id: true, name: true, number: true } },
            bed: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(payments)
  } catch (error) {
    console.error('Payments GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      tenantId,
      propertyId,
      amount,
      rentAmount,
      electricity,
      water,
      wifi,
      food,
      laundry,
      parking,
      otherCharges,
      lateFine,
      discount,
      advanceAdjust,
      paymentMethod,
      paymentType,
      status,
      dueDate,
      paidDate,
      receiptNumber,
      utrNumber,
      notes,
      month,
      year,
    } = body

    if (!tenantId || !propertyId || !amount || !month || !year) {
      return NextResponse.json(
        { error: 'tenantId, propertyId, amount, month, and year are required' },
        { status: 400 }
      )
    }

    const payment = await db.payment.create({
      data: {
        tenantId,
        propertyId,
        amount: parseFloat(amount),
        rentAmount: rentAmount ? parseFloat(rentAmount) : 0,
        electricity: electricity ? parseFloat(electricity) : 0,
        water: water ? parseFloat(water) : 0,
        wifi: wifi ? parseFloat(wifi) : 0,
        food: food ? parseFloat(food) : 0,
        laundry: laundry ? parseFloat(laundry) : 0,
        parking: parking ? parseFloat(parking) : 0,
        otherCharges: otherCharges ? parseFloat(otherCharges) : 0,
        lateFine: lateFine ? parseFloat(lateFine) : 0,
        discount: discount ? parseFloat(discount) : 0,
        advanceAdjust: advanceAdjust ? parseFloat(advanceAdjust) : 0,
        paymentMethod: paymentMethod || 'upi',
        paymentType: paymentType || 'rent',
        status: status || 'pending',
        dueDate: dueDate ? new Date(dueDate) : new Date(),
        paidDate: paidDate ? new Date(paidDate) : undefined,
        receiptNumber,
        utrNumber,
        notes,
        month: parseInt(month),
        year: parseInt(year),
      },
      include: {
        tenant: {
          select: { id: true, name: true, phone: true },
        },
      },
    })

    return NextResponse.json(payment, { status: 201 })
  } catch (error) {
    console.error('Payments POST error:', error)
    return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, status, paidDate, receiptNumber, utrNumber, notes } = body

    if (!id) {
      return NextResponse.json({ error: 'Payment id is required' }, { status: 400 })
    }

    const existingPayment = await db.payment.findUnique({ where: { id } })
    if (!existingPayment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    if (status !== undefined) updateData.status = status
    if (paidDate !== undefined) updateData.paidDate = new Date(paidDate)
    if (receiptNumber !== undefined) updateData.receiptNumber = receiptNumber
    if (utrNumber !== undefined) updateData.utrNumber = utrNumber
    if (notes !== undefined) updateData.notes = notes

    // Auto-set paidDate when status changes to paid
    if (status === 'paid' && !paidDate) {
      updateData.paidDate = new Date()
    }

    const payment = await db.payment.update({
      where: { id },
      data: updateData,
      include: {
        tenant: {
          select: { id: true, name: true, phone: true },
        },
      },
    })

    return NextResponse.json(payment)
  } catch (error) {
    console.error('Payments PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update payment' }, { status: 500 })
  }
}
