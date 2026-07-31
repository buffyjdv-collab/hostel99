import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { buildUserContext, buildScopedWhere, buildPropertyWhere, checkPermission } from '@/lib/auth-helpers'

// GET /api/dashboard?userId=xxx&role=xxx&propertyId=xxx - Dashboard stats
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || ''
    const role = searchParams.get('role') || ''
    const requestedPropertyId = searchParams.get('propertyId') || undefined

    // Build user context for data isolation
    const userCtx = await buildUserContext(userId, role)
    
    // Property model uses `id`, other models use `propertyId`
    const propertyWhere = buildPropertyWhere(userCtx, requestedPropertyId)
    const dataWhere = buildScopedWhere(userCtx, requestedPropertyId)

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
      // Total properties (uses Property model - filter by id)
      db.property.count({ where: propertyWhere }),

      // Total rooms (uses propertyId)
      db.room.count({ where: dataWhere }),

      // Total active tenants
      db.tenant.count({ where: { ...dataWhere, status: 'active' } }),

      // Total active staff
      db.staff.count({ where: { ...dataWhere, status: 'active' } }),

      // Total leads
      db.lead.count({ where: dataWhere }),

      // Total open complaints
      db.complaint.count({ where: { ...dataWhere, status: { in: ['open', 'assigned', 'in_progress'] } } }),

      // Total payments
      db.payment.count({ where: dataWhere }),

      // Total expenses
      db.expense.count({ where: dataWhere }),

      // Recent payments
      db.payment.findMany({
        where: dataWhere,
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          tenant: { select: { name: true } },
        },
      }),

      // Recent complaints
      db.complaint.findMany({
        where: dataWhere,
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          tenant: { select: { name: true } },
        },
      }),

      // Recent leads
      db.lead.findMany({
        where: dataWhere,
        take: 5,
        orderBy: { createdAt: 'desc' },
      }),

      // Property occupancy stats
      requestedPropertyId
        ? db.property.findUnique({
            where: { id: requestedPropertyId },
            select: { totalRooms: true, totalBeds: true, occupancy: true, name: true },
          })
        : db.property.findMany({
            where: propertyWhere,
            select: { id: true, name: true, totalRooms: true, totalBeds: true, occupancy: true },
          }),
    ])

    // Revenue stats
    const currentMonth = new Date().getMonth() + 1
    const currentYear = new Date().getFullYear()

    const [paidPayments, pendingPayments, overduePayments, totalExpenseAmount] = await Promise.all([
      db.payment.aggregate({
        where: { ...dataWhere, month: currentMonth, year: currentYear, status: 'paid' },
        _sum: { amount: true },
      }),
      db.payment.aggregate({
        where: { ...dataWhere, month: currentMonth, year: currentYear, status: 'pending' },
        _sum: { amount: true },
      }),
      db.payment.aggregate({
        where: { ...dataWhere, status: 'overdue' },
        _sum: { amount: true },
      }),
      db.expense.aggregate({
        where: dataWhere,
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
