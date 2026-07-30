import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()

    // Basic counts
    const [totalProperties, totalRooms, totalBeds, occupiedBeds] = await Promise.all([
      db.property.count({ where: { isActive: true } }),
      db.room.count(),
      db.bed.count(),
      db.bed.count({ where: { status: 'occupied' } }),
    ])

    const vacantBeds = totalBeds - occupiedBeds
    const occupancyPercentage = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0

    // Monthly income (sum of paid payments for current month)
    const paidPayments = await db.payment.findMany({
      where: {
        status: 'paid',
        month: currentMonth,
        year: currentYear,
      },
      select: { amount: true },
    })
    const monthlyIncome = paidPayments.reduce((sum, p) => sum + p.amount, 0)

    // Pending dues (sum of pending/overdue payments)
    const pendingPayments = await db.payment.findMany({
      where: {
        status: { in: ['pending', 'overdue'] },
      },
      select: { amount: true },
    })
    const pendingDues = pendingPayments.reduce((sum, p) => sum + p.amount, 0)

    // Lead conversion rate
    const [totalLeads, convertedLeads] = await Promise.all([
      db.lead.count(),
      db.lead.count({ where: { status: { in: ['booking', 'move_in'] } } }),
    ])
    const leadConversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0

    // Recent activity (last 10 activity logs)
    const recentActivity = await db.activityLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    })

    // Monthly income trend (last 6 months)
    const monthlyIncomeTrend = []
    for (let i = 5; i >= 0; i--) {
      let month = currentMonth - i
      let year = currentYear
      if (month <= 0) {
        month += 12
        year -= 1
      }
      const payments = await db.payment.findMany({
        where: { status: 'paid', month, year },
        select: { amount: true },
      })
      const total = payments.reduce((sum, p) => sum + p.amount, 0)
      monthlyIncomeTrend.push({ month, year, income: total })
    }

    // Payment status breakdown
    const paymentStatusBreakdown = await db.payment.groupBy({
      by: ['status'],
      _count: { status: true },
      _sum: { amount: true },
    })

    // Complaint status breakdown
    const complaintStatusBreakdown = await db.complaint.groupBy({
      by: ['status'],
      _count: { status: true },
    })

    // Lead source breakdown
    const leadSourceBreakdown = await db.lead.groupBy({
      by: ['source'],
      _count: { source: true },
    })

    return NextResponse.json({
      totalProperties,
      totalRooms,
      totalBeds,
      occupiedBeds,
      vacantBeds,
      monthlyIncome,
      pendingDues,
      leadConversionRate,
      occupancyPercentage,
      recentActivity,
      monthlyIncomeTrend,
      paymentStatusBreakdown: paymentStatusBreakdown.map((p) => ({
        status: p.status,
        count: p._count.status,
        totalAmount: p._sum.amount ?? 0,
      })),
      complaintStatusBreakdown: complaintStatusBreakdown.map((c) => ({
        status: c.status,
        count: c._count.status,
      })),
      leadSourceBreakdown: leadSourceBreakdown.map((l) => ({
        source: l.source,
        count: l._count.source,
      })),
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 })
  }
}
