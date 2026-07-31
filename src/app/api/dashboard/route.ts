import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// GET /api/dashboard?propertyId=xxx - Dashboard stats
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get('propertyId')

    const propertyFilter = propertyId ? { propertyId } : {}

    const [
      totalProperties,
      totalRooms,
      totalTenants,
      totalStaff,
      totalLeads,
      totalComplaints,
      totalPayments,
      totalExpenses,
      recentPayments,
      recentComplaints,
      recentLeads,
      propertyOccupancy,
    ] = await Promise.all([
      // Total properties
      propertyId
        ? db.property.count({ where: { id: propertyId } })
        : db.property.count(),

      // Total rooms
      db.room.count({ where: propertyFilter }),

      // Total active tenants
      db.tenant.count({ where: { ...propertyFilter, status: 'active' } }),

      // Total active staff
      db.staff.count({ where: { ...propertyFilter, status: 'active' } }),

      // Total leads
      db.lead.count({ where: propertyFilter }),

      // Total open complaints
      db.complaint.count({ where: { ...propertyFilter, status: { in: ['open', 'assigned', 'in_progress'] } } }),

      // Total payments
      db.payment.count({ where: propertyFilter }),

      // Total expenses
      db.expense.count({ where: propertyFilter }),

      // Recent payments
      db.payment.findMany({
        where: propertyFilter,
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          tenant: { select: { name: true } },
        },
      }),

      // Recent complaints
      db.complaint.findMany({
        where: propertyFilter,
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          tenant: { select: { name: true } },
        },
      }),

      // Recent leads
      db.lead.findMany({
        where: propertyFilter,
        take: 5,
        orderBy: { createdAt: 'desc' },
      }),

      // Property occupancy stats
      propertyId
        ? db.property.findUnique({
            where: { id: propertyId },
            select: { totalRooms: true, totalBeds: true, occupancy: true, name: true },
          })
        : db.property.findMany({
            select: { id: true, name: true, totalRooms: true, totalBeds: true, occupancy: true },
          }),
    ])

    // Revenue stats
    const currentMonth = new Date().getMonth() + 1
    const currentYear = new Date().getFullYear()

    const [paidPayments, pendingPayments, overduePayments, totalExpenseAmount] = await Promise.all([
      db.payment.aggregate({
        where: { ...propertyFilter, month: currentMonth, year: currentYear, status: 'paid' },
        _sum: { amount: true },
      }),
      db.payment.aggregate({
        where: { ...propertyFilter, month: currentMonth, year: currentYear, status: 'pending' },
        _sum: { amount: true },
      }),
      db.payment.aggregate({
        where: { ...propertyFilter, status: 'overdue' },
        _sum: { amount: true },
      }),
      db.expense.aggregate({
        where: propertyFilter,
        _sum: { amount: true },
      }),
    ])

    return NextResponse.json({
      stats: {
        totalProperties,
        totalRooms,
        totalTenants,
        totalStaff,
        totalLeads,
        totalComplaints,
        totalPayments,
        totalExpenses,
      },
      revenue: {
        collected: paidPayments._sum.amount || 0,
        pending: pendingPayments._sum.amount || 0,
        overdue: overduePayments._sum.amount || 0,
        expenses: totalExpenseAmount._sum.amount || 0,
      },
      recentPayments,
      recentComplaints,
      recentLeads,
      propertyOccupancy,
    })
  } catch (error) {
    console.error('Dashboard GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 })
  }
}
