import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const propertyId = searchParams.get('propertyId')

    const where: Record<string, unknown> = {}

    if (category) where.category = category
    if (propertyId) where.propertyId = propertyId

    if (startDate || endDate) {
      const dateFilter: Record<string, Date> = {}
      if (startDate) dateFilter.gte = new Date(startDate)
      if (endDate) dateFilter.lte = new Date(endDate)
      where.date = dateFilter
    }

    const expenses = await db.expense.findMany({
      where,
      include: {
        property: { select: { id: true, name: true, address: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { date: 'desc' },
    })

    return NextResponse.json(expenses)
  } catch (error) {
    console.error('Expenses GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      category,
      description,
      amount,
      date,
      vendor,
      propertyId,
      createdById,
      receipt,
      status,
    } = body

    if (!description || !amount || !propertyId || !createdById) {
      return NextResponse.json(
        { error: 'Description, amount, propertyId, and createdById are required' },
        { status: 400 }
      )
    }

    const expense = await db.expense.create({
      data: {
        category: category || 'maintenance',
        description,
        amount: parseFloat(amount),
        date: date ? new Date(date) : new Date(),
        vendor,
        propertyId,
        createdById,
        receipt,
        status: status || 'approved',
      },
      include: {
        property: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    })

    return NextResponse.json(expense, { status: 201 })
  } catch (error) {
    console.error('Expenses POST error:', error)
    return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, category, description, amount, date, vendor, receipt, status } = body

    if (!id) {
      return NextResponse.json({ error: 'Expense id is required' }, { status: 400 })
    }

    const existingExpense = await db.expense.findUnique({ where: { id } })
    if (!existingExpense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    if (category !== undefined) updateData.category = category
    if (description !== undefined) updateData.description = description
    if (amount !== undefined) updateData.amount = parseFloat(amount)
    if (date !== undefined) updateData.date = new Date(date)
    if (vendor !== undefined) updateData.vendor = vendor
    if (receipt !== undefined) updateData.receipt = receipt
    if (status !== undefined) updateData.status = status

    const expense = await db.expense.update({
      where: { id },
      data: updateData,
      include: {
        property: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    })

    return NextResponse.json(expense)
  } catch (error) {
    console.error('Expenses PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update expense' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: 'Expense id is required' }, { status: 400 })
    }

    const existingExpense = await db.expense.findUnique({ where: { id } })
    if (!existingExpense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    await db.expense.delete({ where: { id } })

    return NextResponse.json({ message: 'Expense deleted successfully', id })
  } catch (error) {
    console.error('Expenses DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete expense' }, { status: 500 })
  }
}
