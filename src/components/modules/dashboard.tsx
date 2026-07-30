'use client'

import { useEffect, useState } from 'react'
import { useAppStore, type Page } from '@/lib/store'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart'
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import {
  Building2,
  DoorOpen,
  BedDouble,
  BedSingle,
  IndianRupee,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Plus,
  UserPlus,
  Wallet,
  MessageSquareWarning,
  CalendarDays,
  Activity,
  ArrowRight,
  CircleDot,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Megaphone,
  Users,
} from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────────

interface KPIData {
  totalProperties: number
  totalRooms: number
  totalBeds: number
  occupiedBeds: number
  vacantBeds: number
  monthlyIncome: number
  pendingDues: number
  occupancyPercentage: number
  leadConversionRate: number
}

interface MonthlyIncomePoint {
  month: number
  year: number
  income: number
}

interface PaymentStatusItem {
  status: string
  count: number
  totalAmount: number
}

interface ComplaintStatusItem {
  status: string
  count: number
}

interface LeadSourceItem {
  source: string
  count: number
}

interface ActivityLogItem {
  id: string
  action: string
  description: string
  createdAt: string
  user: { id: string; name: string; email: string }
}

interface DashboardData {
  totalProperties: number
  totalRooms: number
  totalBeds: number
  occupiedBeds: number
  vacantBeds: number
  monthlyIncome: number
  pendingDues: number
  occupancyPercentage: number
  leadConversionRate: number
  recentActivity: ActivityLogItem[]
  monthlyIncomeTrend: MonthlyIncomePoint[]
  paymentStatusBreakdown: PaymentStatusItem[]
  complaintStatusBreakdown: ComplaintStatusItem[]
  leadSourceBreakdown: LeadSourceItem[]
}

// ── Chart Configs ────────────────────────────────────────────────────────────

const incomeChartConfig: ChartConfig = {
  income: {
    label: 'Income',
    color: '#10b981',
  },
}

const occupancyChartConfig: ChartConfig = {
  occupied: {
    label: 'Occupied',
    color: '#10b981',
  },
  vacant: {
    label: 'Vacant',
    color: '#e2e8f0',
  },
}

const paymentChartConfig: ChartConfig = {
  paid: {
    label: 'Paid',
    color: '#10b981',
  },
  pending: {
    label: 'Pending',
    color: '#f59e0b',
  },
  overdue: {
    label: 'Overdue',
    color: '#ef4444',
  },
}

const leadSourceChartConfig: ChartConfig = {
  referral: {
    label: 'Referral',
    color: '#10b981',
  },
  online: {
    label: 'Online',
    color: '#3b82f6',
  },
  walkin: {
    label: 'Walk-in',
    color: '#f59e0b',
  },
  social: {
    label: 'Social Media',
    color: '#8b5cf6',
  },
  other: {
    label: 'Other',
    color: '#6b7280',
  },
}

const LEAD_SOURCE_COLORS: Record<string, string> = {
  referral: '#10b981',
  online: '#3b82f6',
  walk_in: '#f59e0b',
  walkin: '#f59e0b',
  social: '#8b5cf6',
  social_media: '#8b5cf6',
  other: '#6b7280',
}

const OCCUPANCY_COLORS = ['#10b981', '#e2e8f0']

const PAYMENT_COLORS: Record<string, string> = {
  paid: '#10b981',
  pending: '#f59e0b',
  overdue: '#ef4444',
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
}

function getComplaintStatusIcon(status: string) {
  switch (status) {
    case 'open':
      return <CircleDot className="w-4 h-4 text-amber-500" />
    case 'in_progress':
      return <Clock className="w-4 h-4 text-blue-500" />
    case 'resolved':
      return <CheckCircle2 className="w-4 h-4 text-emerald-500" />
    case 'closed':
      return <XCircle className="w-4 h-4 text-slate-400" />
    default:
      return <CircleDot className="w-4 h-4 text-slate-400" />
  }
}

function getComplaintStatusColor(status: string): string {
  switch (status) {
    case 'open': return 'bg-amber-50 text-amber-700 border-amber-200'
    case 'in_progress': return 'bg-blue-50 text-blue-700 border-blue-200'
    case 'resolved': return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    case 'closed': return 'bg-slate-50 text-slate-600 border-slate-200'
    default: return 'bg-slate-50 text-slate-600 border-slate-200'
  }
}

function getComplaintStatusLabel(status: string): string {
  switch (status) {
    case 'open': return 'Open'
    case 'in_progress': return 'In Progress'
    case 'resolved': return 'Resolved'
    case 'closed': return 'Closed'
    default: return status
  }
}

// ── KPI Card ─────────────────────────────────────────────────────────────────

interface KPICardProps {
  title: string
  value: string | number
  icon: React.ElementType
  trend?: { value: number; label: string }
  iconBg?: string
  iconColor?: string
}

function KPICard({ title, value, icon: Icon, trend, iconBg = 'bg-emerald-50', iconColor = 'text-emerald-600' }: KPICardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-0">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground font-medium">{title}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {trend && (
              <div className="flex items-center gap-1 text-xs">
                {trend.value >= 0 ? (
                  <TrendingUp className="w-3 h-3 text-emerald-500" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-red-500" />
                )}
                <span className={trend.value >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                  {trend.value >= 0 ? '+' : ''}{trend.value}%
                </span>
                <span className="text-muted-foreground">{trend.label}</span>
              </div>
            )}
          </div>
          <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${iconBg}`}>
            <Icon className={`w-5 h-5 ${iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ── Skeleton Loaders ─────────────────────────────────────────────────────────

function KPICardSkeleton() {
  return (
    <Card>
      <CardContent className="pt-0">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-10 w-10 rounded-lg" />
        </div>
      </CardContent>
    </Card>
  )
}

function ChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-32" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[250px] w-full rounded-lg" />
      </CardContent>
    </Card>
  )
}

// ── Main Component ───────────────────────────────────────────────────────────

export function DashboardPage() {
  const { setCurrentPage, currentUser } = useAppStore()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  // Tenant-specific data
  const [tenantData, setTenantData] = useState<{
    tenant: any | null
    payments: any[]
    complaints: any[]
    notices: any[]
    visitors: any[]
  } | null>(null)

  useEffect(() => {
    async function fetchDashboard() {
      try {
        if (currentUser?.role === 'tenant') {
          // Step 1: Fetch tenant profile by userId
          const tenantRes = await fetch('/api/tenants?userId=' + currentUser.id)
          const tenantList = tenantRes.ok ? await tenantRes.json() : []
          const tenant = Array.isArray(tenantList) && tenantList.length > 0 ? tenantList[0] : null

          // Step 2: Fetch tenant-specific data using tenantId
          const tenantId = tenant?.id || currentUser.id
          const [payRes, compRes, noticeRes, visitorRes] = await Promise.all([
            fetch('/api/payments?tenantId=' + tenantId),
            fetch('/api/complaints?tenantId=' + tenantId),
            fetch('/api/notices'),
            fetch('/api/visitors?tenantId=' + tenantId),
          ])
          const payData = payRes.ok ? await payRes.json() : []
          const compData = compRes.ok ? await compRes.json() : []
          const noticeData = noticeRes.ok ? await noticeRes.json() : []
          const visitorData = visitorRes.ok ? await visitorRes.json() : []
          setTenantData({
            tenant,
            payments: Array.isArray(payData) ? payData : [],
            complaints: Array.isArray(compData) ? compData : [],
            notices: Array.isArray(noticeData) ? noticeData : [],
            visitors: Array.isArray(visitorData) ? visitorData : [],
          })
        } else {
          const res = await fetch('/api/dashboard')
          if (res.ok) {
            const json = await res.json()
            setData(json)
          }
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchDashboard()
  }, [currentUser])

  // ── Derived chart data ───────────────────────────────────────────────────

  const incomeTrendData = (data?.monthlyIncomeTrend ?? []).map((item) => ({
    month: MONTH_NAMES[item.month - 1],
    income: item.income,
  }))

  const occupancyData = data
    ? [
        { name: 'Occupied', value: data.occupiedBeds },
        { name: 'Vacant', value: data.vacantBeds },
      ]
    : []

  const paymentData = (data?.paymentStatusBreakdown ?? []).map((item) => ({
    status: item.status.charAt(0).toUpperCase() + item.status.slice(1),
    count: item.count,
    amount: item.totalAmount,
  }))

  const leadSourceData = (data?.leadSourceBreakdown ?? []).map((item) => ({
    name: item.source.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    value: item.count,
    source: item.source,
  }))

  // ── Quick actions ────────────────────────────────────────────────────────

  const quickActions: { page: Page; label: string; icon: React.ElementType; description: string; color: string }[] = [
    { page: 'properties', label: 'Add Property', icon: Plus, description: 'Register a new hostel property', color: 'bg-emerald-50 text-emerald-600' },
    { page: 'tenants', label: 'Add Tenant', icon: UserPlus, description: 'Onboard a new tenant', color: 'bg-blue-50 text-blue-600' },
    { page: 'payments', label: 'Collect Rent', icon: Wallet, description: 'Record a rent payment', color: 'bg-amber-50 text-amber-600' },
    { page: 'complaints', label: 'View Complaints', icon: MessageSquareWarning, description: 'Check open complaints', color: 'bg-red-50 text-red-600' },
  ]

  // ── Render ───────────────────────────────────────────────────────────────

  // Tenant Dashboard
  if (currentUser?.role === 'tenant') {
    const tenant = tenantData?.tenant
    const payments = tenantData?.payments ?? []
    const complaints = tenantData?.complaints ?? []
    const notices = tenantData?.notices ?? []
    const visitors = tenantData?.visitors ?? []

    // Payment summary
    const totalPaid = payments.filter((p: any) => p.status === 'paid').reduce((sum: number, p: any) => sum + (p.amount || 0), 0)
    const totalPending = payments.filter((p: any) => p.status === 'pending').reduce((sum: number, p: any) => sum + (p.amount || 0), 0)
    const totalOverdue = payments.filter((p: any) => p.status === 'overdue').reduce((sum: number, p: any) => sum + (p.amount || 0), 0)

    return (
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">My Dashboard</h1>
            <p className="text-muted-foreground text-sm">Welcome back, {currentUser.name}!</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarDays className="w-4 h-4" />
            {formatDate(new Date())}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-emerald-500" /></div>
        ) : (
          <>
            {/* Welcome Card with Room Info */}
            <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-0">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold mb-1">Hello, {currentUser.name}! 👋</h2>
                    <p className="text-emerald-100 text-sm">Here&apos;s an overview of your hostel stay</p>
                  </div>
                  {tenant && (
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2 bg-white/15 rounded-lg px-3 py-2">
                        <Building2 className="w-4 h-4" />
                        <span className="font-medium">{tenant.property?.name || 'N/A'}</span>
                      </div>
                      {tenant.room && (
                        <div className="flex items-center gap-2 bg-white/15 rounded-lg px-3 py-2">
                          <DoorOpen className="w-4 h-4" />
                          <span className="font-medium">Room {tenant.room.number || tenant.room.name || 'N/A'}</span>
                        </div>
                      )}
                      {tenant.bed && (
                        <div className="flex items-center gap-2 bg-white/15 rounded-lg px-3 py-2">
                          <BedDouble className="w-4 h-4" />
                          <span className="font-medium">Bed {tenant.bed.name || tenant.bed.number || 'N/A'}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {tenant && (
                  <div className="flex items-center gap-6 mt-4 pt-4 border-t border-white/20 text-sm">
                    <div>
                      <span className="text-emerald-100">Rent: </span>
                      <span className="font-semibold">{formatCurrency(tenant.rentAmount || 0)}/mo</span>
                    </div>
                    <div>
                      <span className="text-emerald-100">Status: </span>
                      <Badge className="bg-white/20 text-white border-0 hover:bg-white/30">
                        {tenant.status || 'Active'}
                      </Badge>
                    </div>
                    {tenant.checkInDate && (
                      <div>
                        <span className="text-emerald-100">Since: </span>
                        <span className="font-medium">{new Date(tenant.checkInDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Card className="cursor-pointer hover:border-emerald-300 transition-colors" onClick={() => setCurrentPage('payments')}>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                    <IndianRupee className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">My Payments</h3>
                    <p className="text-xs text-muted-foreground">View dues & history</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:border-amber-300 transition-colors" onClick={() => setCurrentPage('complaints')}>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                    <MessageSquareWarning className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">Complaints</h3>
                    <p className="text-xs text-muted-foreground">Raise & track issues</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:border-blue-300 transition-colors" onClick={() => setCurrentPage('notices')}>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                    <Megaphone className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">Notices</h3>
                    <p className="text-xs text-muted-foreground">Announcements</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:border-purple-300 transition-colors" onClick={() => setCurrentPage('visitors')}>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                    <Users className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">Visitors</h3>
                    <p className="text-xs text-muted-foreground">Log & manage</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Payment Status Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground font-medium">Total Paid</p>
                      <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totalPaid)}</p>
                      <p className="text-xs text-muted-foreground mt-1">{payments.filter((p: any) => p.status === 'paid').length} payment(s)</p>
                    </div>
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-50">
                      <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground font-medium">Pending</p>
                      <p className="text-2xl font-bold text-amber-600">{formatCurrency(totalPending)}</p>
                      <p className="text-xs text-muted-foreground mt-1">{payments.filter((p: any) => p.status === 'pending').length} payment(s)</p>
                    </div>
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-amber-50">
                      <Clock className="w-6 h-6 text-amber-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground font-medium">Overdue</p>
                      <p className="text-2xl font-bold text-red-600">{formatCurrency(totalOverdue)}</p>
                      <p className="text-xs text-muted-foreground mt-1">{payments.filter((p: any) => p.status === 'overdue').length} payment(s)</p>
                    </div>
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-red-50">
                      <AlertCircle className="w-6 h-6 text-red-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Middle Section: Recent Payments + Complaints */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Payments */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <IndianRupee className="w-5 h-5 text-emerald-500" />
                      Recent Payments
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => setCurrentPage('payments')}>View All <ArrowRight className="w-4 h-4 ml-1" /></Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {payments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                      <IndianRupee className="w-8 h-8 mb-2 opacity-40" />
                      <p className="text-sm">No payments found</p>
                    </div>
                  ) : (
                    <ScrollArea className="max-h-80">
                      <div className="space-y-3">
                        {payments.slice(0, 5).map((p: any) => (
                          <div key={p.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <div>
                              <p className="text-sm font-medium">{formatCurrency(p.amount)}</p>
                              <p className="text-xs text-muted-foreground">{MONTH_NAMES[(p.month || 1) - 1]} {p.year || new Date().getFullYear()}</p>
                            </div>
                            <Badge className={p.status === 'paid' ? 'bg-emerald-500/15 text-emerald-600 border-0' : p.status === 'overdue' ? 'bg-red-500/15 text-red-600 border-0' : 'bg-amber-500/15 text-amber-600 border-0'}>
                              {p.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>

              {/* Recent Complaints */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MessageSquareWarning className="w-5 h-5 text-amber-500" />
                      My Complaints
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => setCurrentPage('complaints')}>View All <ArrowRight className="w-4 h-4 ml-1" /></Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {complaints.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                      <CheckCircle2 className="w-8 h-8 mb-2 opacity-40" />
                      <p className="text-sm">No complaints raised</p>
                    </div>
                  ) : (
                    <ScrollArea className="max-h-80">
                      <div className="space-y-3">
                        {complaints.slice(0, 5).map((c: any) => (
                          <div key={c.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                            {getComplaintStatusIcon(c.status)}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">{c.title}</p>
                              <p className="text-xs text-muted-foreground line-clamp-1">{c.description}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge className={`text-[10px] px-1.5 py-0 ${getComplaintStatusColor(c.status)}`}>
                                  {getComplaintStatusLabel(c.status)}
                                </Badge>
                                <span className="text-[10px] text-muted-foreground">{formatRelativeTime(c.createdAt)}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Bottom Section: Notices + Visitors */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Active Notices */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Megaphone className="w-5 h-5 text-blue-500" />
                      Recent Notices
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => setCurrentPage('notices')}>View All <ArrowRight className="w-4 h-4 ml-1" /></Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {notices.filter((n: any) => n.isActive).length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                      <Megaphone className="w-8 h-8 mb-2 opacity-40" />
                      <p className="text-sm">No active notices</p>
                    </div>
                  ) : (
                    <ScrollArea className="max-h-80">
                      <div className="space-y-3">
                        {notices.filter((n: any) => n.isActive).slice(0, 5).map((n: any) => (
                          <div key={n.id} className="p-3 bg-slate-50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <Badge className={n.type === 'urgent' ? 'bg-red-500/15 text-red-600 border-0' : n.type === 'important' ? 'bg-amber-500/15 text-amber-600 border-0' : 'bg-blue-500/15 text-blue-600 border-0'}>
                                {n.type}
                              </Badge>
                              <span className="text-sm font-medium">{n.title}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{n.content}</p>
                            <p className="text-[10px] text-muted-foreground mt-1">{formatRelativeTime(n.createdAt)}</p>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>

              {/* Visitor Log */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Users className="w-5 h-5 text-purple-500" />
                      Visitor Log
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => setCurrentPage('visitors')}>View All <ArrowRight className="w-4 h-4 ml-1" /></Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {visitors.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                      <Users className="w-8 h-8 mb-2 opacity-40" />
                      <p className="text-sm">No visitors recorded</p>
                    </div>
                  ) : (
                    <ScrollArea className="max-h-80">
                      <div className="space-y-3">
                        {visitors.slice(0, 5).map((v: any) => (
                          <div key={v.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 shrink-0">
                                <Users className="w-4 h-4 text-purple-600" />
                              </div>
                              <div>
                                <p className="text-sm font-medium">{v.name}</p>
                                <p className="text-xs text-muted-foreground">{v.purpose}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge className={v.status === 'checked_in' ? 'bg-emerald-500/15 text-emerald-600 border-0' : 'bg-slate-500/15 text-slate-600 border-0'}>
                                {v.status === 'checked_in' ? 'In' : 'Out'}
                              </Badge>
                              <p className="text-[10px] text-muted-foreground mt-1">
                                {new Date(v.checkIn).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    )
  }

  // Admin/Owner/Manager/Staff Dashboard
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm">Overview of your hostel operations</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarDays className="w-4 h-4" />
          {formatDate(new Date())}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {loading ? (
          <>
            {Array.from({ length: 6 }).map((_, i) => (
              <KPICardSkeleton key={i} />
            ))}
          </>
        ) : (
          <>
            <KPICard
              title="Total Properties"
              value={data?.totalProperties ?? 0}
              icon={Building2}
              iconBg="bg-emerald-50"
              iconColor="text-emerald-600"
            />
            <KPICard
              title="Total Rooms"
              value={data?.totalRooms ?? 0}
              icon={DoorOpen}
              iconBg="bg-blue-50"
              iconColor="text-blue-600"
            />
            <KPICard
              title="Occupied Beds"
              value={data?.occupiedBeds ?? 0}
              icon={BedDouble}
              iconBg="bg-teal-50"
              iconColor="text-teal-600"
              trend={
                data
                  ? {
                      value: data.occupancyPercentage,
                      label: 'occupancy',
                    }
                  : undefined
              }
            />
            <KPICard
              title="Vacant Beds"
              value={data?.vacantBeds ?? 0}
              icon={BedSingle}
              iconBg="bg-slate-50"
              iconColor="text-slate-600"
            />
            <KPICard
              title="Monthly Income"
              value={formatCurrency(data?.monthlyIncome ?? 0)}
              icon={IndianRupee}
              iconBg="bg-emerald-50"
              iconColor="text-emerald-600"
              trend={{ value: 12, label: 'vs last month' }}
            />
            <KPICard
              title="Pending Dues"
              value={formatCurrency(data?.pendingDues ?? 0)}
              icon={AlertCircle}
              iconBg="bg-red-50"
              iconColor="text-red-600"
              trend={{ value: -5, label: 'vs last month' }}
            />
          </>
        )}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Income Trend */}
        {loading ? (
          <ChartSkeleton />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Monthly Income Trend</CardTitle>
              <CardDescription>Revenue over the last 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={incomeChartConfig} className="h-[250px] w-full">
                <AreaChart data={incomeTrendData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12 }}
                    tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}k`}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="income"
                    stroke="#10b981"
                    strokeWidth={2}
                    fill="url(#incomeGradient)"
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}

        {/* Occupancy Overview */}
        {loading ? (
          <ChartSkeleton />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Occupancy Overview</CardTitle>
              <CardDescription>Bed occupancy breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <ChartContainer config={occupancyChartConfig} className="h-[250px] w-[250px]">
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Pie
                      data={occupancyData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={4}
                      dataKey="value"
                      nameKey="name"
                    >
                      {occupancyData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={OCCUPANCY_COLORS[index]} />
                      ))}
                    </Pie>
                    <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                  </PieChart>
                </ChartContainer>
                <div className="flex-1 space-y-4">
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Occupancy Rate</span>
                      <span className="font-semibold text-emerald-600">
                        {data?.occupancyPercentage ?? 0}%
                      </span>
                    </div>
                    <Progress value={data?.occupancyPercentage ?? 0} className="h-2" />
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="p-3 rounded-lg bg-emerald-50">
                      <p className="text-emerald-600 font-medium">{data?.occupiedBeds ?? 0}</p>
                      <p className="text-emerald-600/70 text-xs">Occupied</p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50">
                      <p className="text-slate-600 font-medium">{data?.vacantBeds ?? 0}</p>
                      <p className="text-slate-500 text-xs">Vacant</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment Status */}
        {loading ? (
          <ChartSkeleton />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Payment Status</CardTitle>
              <CardDescription>Breakdown by payment status</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={paymentChartConfig} className="h-[250px] w-full">
                <BarChart data={paymentData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="status"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12 }}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {paymentData.map((entry) => (
                      <Cell
                        key={`payment-${entry.status}`}
                        fill={PAYMENT_COLORS[entry.status.toLowerCase()] || '#6b7280'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
              {/* Payment summary */}
              <div className="flex gap-4 mt-4 pt-4 border-t">
                {paymentData.map((entry) => (
                  <div key={entry.status} className="flex items-center gap-2 text-xs">
                    <div
                      className="w-2.5 h-2.5 rounded-sm"
                      style={{ backgroundColor: PAYMENT_COLORS[entry.status.toLowerCase()] || '#6b7280' }}
                    />
                    <span className="text-muted-foreground">{entry.status}:</span>
                    <span className="font-medium">{entry.count}</span>
                    <span className="text-muted-foreground">({formatCurrency(entry.amount)})</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lead Sources */}
        {loading ? (
          <ChartSkeleton />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Lead Sources</CardTitle>
              <CardDescription>Distribution of leads by source</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={leadSourceChartConfig} className="h-[250px] w-full">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                  <Pie
                    data={leadSourceData}
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                  >
                    {leadSourceData.map((entry) => (
                      <Cell
                        key={`lead-${entry.name}`}
                        fill={LEAD_SOURCE_COLORS[entry.source] || '#6b7280'}
                      />
                    ))}
                  </Pie>
                  <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Bottom Section: Activity + Quick Actions + Complaints */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Recent Activity</CardTitle>
              <Activity className="w-4 h-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (data?.recentActivity ?? []).length > 0 ? (
              <ScrollArea className="h-[320px]">
                <div className="space-y-4">
                  {data!.recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-50 shrink-0">
                        <Activity className="w-3.5 h-3.5 text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm leading-snug">
                          <span className="font-medium">{activity.user.name}</span>{' '}
                          <span className="text-muted-foreground">{activity.description || activity.action}</span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatRelativeTime(activity.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Activity className="w-8 h-8 mb-2 opacity-40" />
                <p className="text-sm">No recent activity</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Actions</CardTitle>
            <CardDescription>Common tasks at your fingertips</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action) => {
                const Icon = action.icon
                return (
                  <button
                    key={action.page}
                    onClick={() => setCurrentPage(action.page)}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border/50 hover:border-emerald-500/30 hover:bg-emerald-50/50 transition-all duration-200 group text-center"
                  >
                    <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${action.color} group-hover:scale-110 transition-transform`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-medium">{action.label}</span>
                    <span className="text-[11px] text-muted-foreground leading-tight">{action.description}</span>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Complaints Overview */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Complaints Overview</CardTitle>
                <CardDescription>Status breakdown</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentPage('complaints')}
                className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
              >
                View All
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-lg" />
                ))}
              </div>
            ) : (data?.complaintStatusBreakdown ?? []).length > 0 ? (
              <div className="space-y-3">
                {data!.complaintStatusBreakdown.map((item) => (
                  <div
                    key={item.status}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${getComplaintStatusColor(item.status)}`}
                  >
                    {getComplaintStatusIcon(item.status)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{getComplaintStatusLabel(item.status)}</p>
                      <p className="text-xs opacity-70">{item.count} complaint{item.count !== 1 ? 's' : ''}</p>
                    </div>
                    <Badge variant="outline" className="text-xs bg-white/50">
                      {item.count}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <CheckCircle2 className="w-8 h-8 mb-2 opacity-40" />
                <p className="text-sm">No complaints</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
