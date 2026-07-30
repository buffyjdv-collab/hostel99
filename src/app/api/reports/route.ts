import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'income'
    const propertyId = searchParams.get('propertyId')
    const month = searchParams.get('month')
    const year = searchParams.get('year')

    const yearNum = year ? parseInt(year) : new Date().getFullYear()
    const monthNum = month ? parseInt(month) : new Date().getMonth() + 1

    const propertyFilter = propertyId ? { propertyId } : {}

    switch (type) {
      case 'income': {
        const payments = await db.payment.findMany({
          where: {
            status: 'paid',
            month: monthNum,
            year: yearNum,
            ...propertyFilter,
          },
          include: {
            tenant: {
              select: { id: true, name: true, room: { select: { name: true } } },
            },
          },
        })
        const totalIncome = payments.reduce((sum, p) => sum + p.amount, 0)
        return NextResponse.json({ type, totalIncome, payments, month: monthNum, year: yearNum })
      }

      case 'expense': {
        const startDate = new Date(yearNum, monthNum - 1, 1)
        const endDate = new Date(yearNum, monthNum, 0, 23, 59, 59)
        const expenses = await db.expense.findMany({
          where: {
            date: { gte: startDate, lte: endDate },
            ...propertyFilter,
          },
          include: {
            property: { select: { id: true, name: true } },
          },
        })
        const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0)
        return NextResponse.json({ type, totalExpense, expenses, month: monthNum, year: yearNum })
      }

      case 'profit': {
        const paidPayments = await db.payment.findMany({
          where: {
            status: 'paid',
            month: monthNum,
            year: yearNum,
            ...propertyFilter,
          },
          select: { amount: true },
        })
        const totalIncome = paidPayments.reduce((sum, p) => sum + p.amount, 0)

        const startDate = new Date(yearNum, monthNum - 1, 1)
        const endDate = new Date(yearNum, monthNum, 0, 23, 59, 59)
        const expenses = await db.expense.findMany({
          where: {
            date: { gte: startDate, lte: endDate },
            ...propertyFilter,
          },
          select: { amount: true },
        })
        const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0)

        return NextResponse.json({
          type,
          totalIncome,
          totalExpense,
          profit: totalIncome - totalExpense,
          month: monthNum,
          year: yearNum,
        })
      }

      case 'collection': {
        const payments = await db.payment.findMany({
          where: {
            month: monthNum,
            year: yearNum,
            ...propertyFilter,
          },
          include: {
            tenant: { select: { id: true, name: true } },
          },
        })
        const collected = payments
          .filter((p) => p.status === 'paid')
          .reduce((sum, p) => sum + p.amount, 0)
        const totalExpected = payments.reduce((sum, p) => sum + p.amount, 0)
        const collectionRate = totalExpected > 0 ? Math.round((collected / totalExpected) * 100) : 0

        return NextResponse.json({
          type,
          totalExpected,
          collected,
          pending: totalExpected - collected,
          collectionRate,
          month: monthNum,
          year: yearNum,
        })
      }

      case 'due': {
        const dues = await db.payment.findMany({
          where: {
            status: { in: ['pending', 'overdue'] },
            ...propertyFilter,
          },
          include: {
            tenant: {
              select: {
                id: true,
                name: true,
                phone: true,
                room: { select: { name: true, number: true } },
              },
            },
          },
          orderBy: { dueDate: 'asc' },
        })
        const totalDue = dues.reduce((sum, p) => sum + p.amount, 0)
        return NextResponse.json({ type, totalDue, dues })
      }

      case 'vacancy': {
        const beds = await db.bed.findMany({
          where: { ...propertyFilter },
          include: {
            room: {
              select: { id: true, name: true, number: true, property: { select: { id: true, name: true } } },
            },
          },
        })
        const totalBeds = beds.length
        const vacantBeds = beds.filter((b) => b.status === 'available')
        const occupiedBeds = beds.filter((b) => b.status === 'occupied')
        const vacancyRate = totalBeds > 0 ? Math.round((vacantBeds.length / totalBeds) * 100) : 0

        return NextResponse.json({
          type,
          totalBeds,
          vacantBeds: vacantBeds.length,
          occupiedBeds: occupiedBeds.length,
          vacancyRate,
          vacantBedDetails: vacantBeds,
        })
      }

      case 'occupancy': {
        const rooms = await db.room.findMany({
          where: { ...propertyFilter },
          include: {
            beds: true,
            property: { select: { id: true, name: true } },
          },
        })
        const totalBeds = rooms.reduce((sum, r) => sum + r.totalBeds, 0)
        const occupiedBeds = rooms.reduce((sum, r) => sum + r.occupiedBeds, 0)
        const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0

        const propertyWise = await db.property.findMany({
          where: propertyId ? { id: propertyId } : { isActive: true },
          select: {
            id: true,
            name: true,
            totalBeds: true,
            occupancy: true,
          },
        })

        return NextResponse.json({
          type,
          totalBeds,
          occupiedBeds,
          occupancyRate,
          propertyWise,
        })
      }

      case 'tenant_ledger': {
        const tenantId = searchParams.get('tenantId')
        if (!tenantId) {
          return NextResponse.json({ error: 'tenantId is required for tenant_ledger report' }, { status: 400 })
        }

        const payments = await db.payment.findMany({
          where: {
            tenantId,
            ...propertyFilter,
          },
          orderBy: { dueDate: 'asc' },
        })

        const totalPaid = payments
          .filter((p) => p.status === 'paid')
          .reduce((sum, p) => sum + p.amount, 0)
        const totalDue = payments
          .filter((p) => p.status !== 'paid')
          .reduce((sum, p) => sum + p.amount, 0)

        return NextResponse.json({
          type,
          tenantId,
          payments,
          totalPaid,
          totalDue,
          balance: totalPaid - totalDue,
        })
      }

      case 'payment_report': {
        const paymentStatusBreakdown = await db.payment.groupBy({
          by: ['status'],
          where: {
            month: monthNum,
            year: yearNum,
            ...propertyFilter,
          },
          _count: { status: true },
          _sum: { amount: true },
        })

        const paymentMethodBreakdown = await db.payment.groupBy({
          by: ['paymentMethod'],
          where: {
            status: 'paid',
            month: monthNum,
            year: yearNum,
            ...propertyFilter,
          },
          _count: { paymentMethod: true },
          _sum: { amount: true },
        })

        return NextResponse.json({
          type,
          month: monthNum,
          year: yearNum,
          statusBreakdown: paymentStatusBreakdown.map((p) => ({
            status: p.status,
            count: p._count.status,
            totalAmount: p._sum.amount ?? 0,
          })),
          methodBreakdown: paymentMethodBreakdown.map((p) => ({
            method: p.paymentMethod,
            count: p._count.paymentMethod,
            totalAmount: p._sum.amount ?? 0,
          })),
        })
      }

      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 })
    }
  } catch (error) {
    console.error('Reports GET error:', error)
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 })
  }
}
