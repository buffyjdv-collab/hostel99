'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
  IndianRupee,
  TrendingUp,
  TrendingDown,
  Plus,
  Search,
  Eye,
  MoreVertical,
  Loader2,
  Building2,
  Receipt,
  CreditCard,
  Wallet,
  ArrowUpDown,
  Filter,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  PieChart as PieChartIcon,
  BarChart3,
} from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────────

type ExpenseCategory = 'maintenance' | 'utilities' | 'salary' | 'supplies' | 'food' | 'marketing' | 'other'
type ExpenseStatus = 'pending' | 'approved' | 'rejected'
type IncomeSource = 'rent' | 'deposit' | 'other'

interface ExpenseData {
  id: string
  category: ExpenseCategory
  description: string
  amount: number
  date: string
  vendor?: string | null
  propertyId: string
  property: { id: string; name: string; address?: string }
  createdById: string
  createdBy?: { id: string; name: string; email: string } | null
  receipt?: string | null
  status: ExpenseStatus
  createdAt: string
  updatedAt: string
}

interface IncomeData {
  id: string
  date: string
  source: IncomeSource
  tenantName: string
  amount: number
  propertyId: string
  property: { id: string; name: string }
  paymentMethod: string
  status: string
}

interface PropertyInfo {
  id: string
  name: string
}

interface ExpenseFormData {
  category: ExpenseCategory
  description: string
  amount: string
  date: string
  vendor: string
  propertyId: string
  receipt: string
  status: ExpenseStatus
}

// ── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<ExpenseCategory, { label: string; bgClass: string; textClass: string; color: string }> = {
  maintenance: { label: 'Maintenance', bgClass: 'bg-orange-100 dark:bg-orange-950/50', textClass: 'text-orange-700 dark:text-orange-300', color: '#f97316' },
  utilities: { label: 'Utilities', bgClass: 'bg-blue-100 dark:bg-blue-950/50', textClass: 'text-blue-700 dark:text-blue-300', color: '#3b82f6' },
  salary: { label: 'Salary', bgClass: 'bg-purple-100 dark:bg-purple-950/50', textClass: 'text-purple-700 dark:text-purple-300', color: '#8b5cf6' },
  supplies: { label: 'Supplies', bgClass: 'bg-teal-100 dark:bg-teal-950/50', textClass: 'text-teal-700 dark:text-teal-300', color: '#14b8a6' },
  food: { label: 'Food', bgClass: 'bg-emerald-100 dark:bg-emerald-950/50', textClass: 'text-emerald-700 dark:text-emerald-300', color: '#10b981' },
  marketing: { label: 'Marketing', bgClass: 'bg-pink-100 dark:bg-pink-950/50', textClass: 'text-pink-700 dark:text-pink-300', color: '#ec4899' },
  other: { label: 'Other', bgClass: 'bg-gray-100 dark:bg-gray-950/50', textClass: 'text-gray-700 dark:text-gray-300', color: '#6b7280' },
}

const EXPENSE_STATUS_CONFIG: Record<ExpenseStatus, { label: string; bgClass: string; textClass: string; dotClass: string }> = {
  pending: { label: 'Pending', bgClass: 'bg-amber-100 dark:bg-amber-950/50', textClass: 'text-amber-700 dark:text-amber-300', dotClass: 'bg-amber-500' },
  approved: { label: 'Approved', bgClass: 'bg-emerald-100 dark:bg-emerald-950/50', textClass: 'text-emerald-700 dark:text-emerald-300', dotClass: 'bg-emerald-500' },
  rejected: { label: 'Rejected', bgClass: 'bg-red-100 dark:bg-red-950/50', textClass: 'text-red-700 dark:text-red-300', dotClass: 'bg-red-500' },
}

const INCOME_SOURCE_CONFIG: Record<IncomeSource, { label: string; bgClass: string; textClass: string }> = {
  rent: { label: 'Rent', bgClass: 'bg-emerald-100 dark:bg-emerald-950/50', textClass: 'text-emerald-700 dark:text-emerald-300' },
  deposit: { label: 'Deposit', bgClass: 'bg-blue-100 dark:bg-blue-950/50', textClass: 'text-blue-700 dark:text-blue-300' },
  other: { label: 'Other', bgClass: 'bg-gray-100 dark:bg-gray-950/50', textClass: 'text-gray-700 dark:text-gray-300' },
}

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const TREND_CHART_CONFIG: ChartConfig = {
  income: { label: 'Income', color: '#10b981' },
  expenses: { label: 'Expenses', color: '#ef4444' },
}

const CATEGORY_PIE_CONFIG: ChartConfig = {
  maintenance: { label: 'Maintenance', color: '#f97316' },
  utilities: { label: 'Utilities', color: '#3b82f6' },
  salary: { label: 'Salary', color: '#8b5cf6' },
  supplies: { label: 'Supplies', color: '#14b8a6' },
  food: { label: 'Food', color: '#10b981' },
  marketing: { label: 'Marketing', color: '#ec4899' },
  other: { label: 'Other', color: '#6b7280' },
}

const CASH_FLOW_CONFIG: ChartConfig = {
  inflow: { label: 'Inflow', color: '#10b981' },
  outflow: { label: 'Outflow', color: '#ef4444' },
}

const EMPTY_FORM: ExpenseFormData = {
  category: 'maintenance',
  description: '',
  amount: '',
  date: new Date().toISOString().split('T')[0],
  vendor: '',
  propertyId: '',
  receipt: '',
  status: 'approved',
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ── Skeleton Loaders ─────────────────────────────────────────────────────────

function StatsCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
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
      <CardContent className="p-6">
        <Skeleton className="h-4 w-32 mb-4" />
        <Skeleton className="h-64 w-full" />
      </CardContent>
    </Card>
  )
}

function TableSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-10 w-full rounded" />
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full rounded" />
      ))}
    </div>
  )
}

// ── Stats Card ───────────────────────────────────────────────────────────────

interface StatsCardProps {
  title: string
  value: string
  icon: React.ElementType
  iconBg?: string
  iconColor?: string
  subtitle?: string
  trend?: { value: number; isPositive: boolean }
}

function StatsCard({ title, value, icon: Icon, iconBg = 'bg-emerald-50 dark:bg-emerald-950/50', iconColor = 'text-emerald-600 dark:text-emerald-400', subtitle, trend }: StatsCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground font-medium">{title}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            <div className="flex items-center gap-1">
              {trend && (
                <span className={`text-xs font-medium flex items-center gap-0.5 ${trend.isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                  {trend.isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {Math.abs(trend.value)}%
                </span>
              )}
              {subtitle && <span className="text-xs text-muted-foreground">{subtitle}</span>}
            </div>
          </div>
          <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${iconBg}`}>
            <Icon className={`w-5 h-5 ${iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ── Add Expense Dialog ───────────────────────────────────────────────────────

function AddExpenseDialog({
  open,
  onClose,
  properties,
  onSubmit,
  submitting,
  userId,
}: {
  open: boolean
  onClose: () => void
  properties: PropertyInfo[]
  onSubmit: (data: ExpenseFormData) => Promise<void>
  submitting: boolean
  userId: string | undefined
}) {
  const [form, setForm] = useState<ExpenseFormData>(EMPTY_FORM)

  const handleSubmit = async () => {
    await onSubmit(form)
    setForm(EMPTY_FORM)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-emerald-600" />
            Add Expense
          </DialogTitle>
          <DialogDescription>Record a new expense entry</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Expense Details */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
              <Receipt className="h-4 w-4 text-emerald-600" />
              Expense Details
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expense-category">Category *</Label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v as ExpenseCategory }))}>
                  <SelectTrigger id="expense-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
                      <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="expense-amount">Amount *</Label>
                <Input
                  id="expense-amount"
                  type="number"
                  placeholder="Enter amount"
                  value={form.amount}
                  onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="expense-description">Description *</Label>
                <Textarea
                  id="expense-description"
                  placeholder="Enter expense description"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expense-date">Date</Label>
                <Input
                  id="expense-date"
                  type="date"
                  value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expense-vendor">Vendor</Label>
                <Input
                  id="expense-vendor"
                  placeholder="Vendor name"
                  value={form.vendor}
                  onChange={e => setForm(f => ({ ...f, vendor: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expense-property">Property *</Label>
                <Select value={form.propertyId} onValueChange={v => setForm(f => ({ ...f, propertyId: v }))}>
                  <SelectTrigger id="expense-property">
                    <SelectValue placeholder="Select property" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="expense-status">Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as ExpenseStatus }))}>
                  <SelectTrigger id="expense-status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(EXPENSE_STATUS_CONFIG).map(([key, cfg]) => (
                      <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="expense-receipt">Receipt URL</Label>
                <Input
                  id="expense-receipt"
                  placeholder="Receipt file URL or reference"
                  value={form.receipt}
                  onChange={e => setForm(f => ({ ...f, receipt: e.target.value }))}
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !form.description || !form.amount || !form.propertyId}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Add Expense
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Expense Detail Dialog ────────────────────────────────────────────────────

function ExpenseDetailDialog({
  expense,
  open,
  onClose,
}: {
  expense: ExpenseData | null
  open: boolean
  onClose: () => void
}) {
  if (!expense) return null

  const catCfg = CATEGORY_CONFIG[expense.category]
  const statusCfg = EXPENSE_STATUS_CONFIG[expense.status]

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-emerald-600" />
            Expense Details
          </DialogTitle>
          <DialogDescription>{expense.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Category</span>
                  <Badge variant="secondary" className={`${catCfg.bgClass} ${catCfg.textClass} text-xs`}>
                    {catCfg.label}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Amount</span>
                  <span className="font-bold text-lg">{formatCurrency(expense.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Date</span>
                  <span className="font-medium">{formatDate(expense.date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status</span>
                  <Badge variant="secondary" className={`${statusCfg.bgClass} ${statusCfg.textClass} text-xs`}>
                    <div className={`h-1.5 w-1.5 rounded-full ${statusCfg.dotClass} mr-1`} />
                    {statusCfg.label}
                  </Badge>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Property</span>
                  <span className="font-medium">{expense.property?.name}</span>
                </div>
                {expense.vendor && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Vendor</span>
                    <span className="font-medium">{expense.vendor}</span>
                  </div>
                )}
                {expense.createdBy && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Created By</span>
                    <span className="font-medium">{expense.createdBy.name}</span>
                  </div>
                )}
                {expense.receipt && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Receipt</span>
                    <a href={expense.receipt} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline text-xs">View Receipt</a>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Main Component ───────────────────────────────────────────────────────────

export function ExpensesPage() {
  const { currentUser } = useAppStore()

  // Data
  const [expenses, setExpenses] = useState<ExpenseData[]>([])
  const [incomeData, setIncomeData] = useState<IncomeData[]>([])
  const [properties, setProperties] = useState<PropertyInfo[]>([])
  const [loading, setLoading] = useState(true)

  // UI State
  const [activeTab, setActiveTab] = useState<string>('expenses')
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [propertyFilter, setPropertyFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [incomeSourceFilter, setIncomeSourceFilter] = useState<string>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // Dialogs
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState<ExpenseData | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // ── Data Fetching ──────────────────────────────────────────────────────────

  const fetchExpenses = async () => {
    try {
      const params = new URLSearchParams()
      if (categoryFilter !== 'all') params.set('category', categoryFilter)
      if (propertyFilter !== 'all') params.set('propertyId', propertyFilter)
      if (dateFrom) params.set('startDate', dateFrom)
      if (dateTo) params.set('endDate', dateTo)

      const res = await fetch(`/api/expenses?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setExpenses(data)
      }
    } catch (err) {
      console.error('Failed to fetch expenses:', err)
    }
  }

  const fetchProperties = async () => {
    try {
      const res = await fetch('/api/properties')
      if (res.ok) {
        const data = await res.json()
        setProperties(data.map((p: { id: string; name: string }) => ({ id: p.id, name: p.name })))
      }
    } catch (err) {
      console.error('Failed to fetch properties:', err)
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchExpenses(), fetchProperties()])
      setLoading(false)
    }
    loadData()
  }, [])

  useEffect(() => {
    if (!loading) {
      fetchExpenses()
    }
  }, [categoryFilter, propertyFilter, dateFrom, dateTo])

  // ── Generate Mock Income Data ──────────────────────────────────────────────
  // In a real app, this would come from /api/payments or /api/income

  const incomeRecords = useMemo<IncomeData[]>(() => {
    const sources: IncomeSource[] = ['rent', 'deposit', 'other']
    const methods = ['upi', 'bank_transfer', 'cash', 'card']
    const records: IncomeData[] = []

    expenses.forEach((_, idx) => {
      const prop = properties[Math.floor(Math.random() * properties.length)] || properties[0]
      if (prop) {
        records.push({
          id: `inc-${idx}`,
          date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
          source: sources[Math.floor(Math.random() * sources.length)],
          tenantName: `Tenant ${idx + 1}`,
          amount: Math.floor(5000 + Math.random() * 15000),
          propertyId: prop.id,
          property: { id: prop.id, name: prop.name },
          paymentMethod: methods[Math.floor(Math.random() * methods.length)],
          status: Math.random() > 0.2 ? 'completed' : 'pending',
        })
      }
    })

    return records
  }, [expenses, properties])

  // ── Computed Values ────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const now = new Date()
    const thisMonth = now.getMonth()
    const thisYear = now.getFullYear()

    const thisMonthExpenses = expenses.filter(e => {
      const d = new Date(e.date)
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear
    })
    const totalExpenses = thisMonthExpenses.reduce((sum, e) => sum + e.amount, 0)

    const thisMonthIncome = incomeRecords.filter(i => {
      const d = new Date(i.date)
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear
    })
    const totalIncome = thisMonthIncome.reduce((sum, i) => sum + i.amount, 0)

    const netProfit = totalIncome - totalExpenses
    const outstandingDues = incomeRecords.filter(i => i.status === 'pending').reduce((sum, i) => sum + i.amount, 0)

    return { totalIncome, totalExpenses, netProfit, outstandingDues }
  }, [expenses, incomeRecords])

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const matchesSearch = e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.vendor || '').toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = categoryFilter === 'all' || e.category === categoryFilter
      const matchesProperty = propertyFilter === 'all' || e.propertyId === propertyFilter
      const matchesStatus = statusFilter === 'all' || e.status === statusFilter
      return matchesSearch && matchesCategory && matchesProperty && matchesStatus
    })
  }, [expenses, searchQuery, categoryFilter, propertyFilter, statusFilter])

  const filteredIncome = useMemo(() => {
    return incomeRecords.filter(i => {
      const matchesSearch = i.tenantName.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesSource = incomeSourceFilter === 'all' || i.source === incomeSourceFilter
      const matchesProperty = propertyFilter === 'all' || i.propertyId === propertyFilter
      return matchesSearch && matchesSource && matchesProperty
    })
  }, [incomeRecords, searchQuery, incomeSourceFilter, propertyFilter])

  // ── Chart Data ─────────────────────────────────────────────────────────────

  const trendData = useMemo(() => {
    const now = new Date()
    return Array.from({ length: 6 }).map((_, i) => {
      const month = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1)
      const monthExpenses = expenses
        .filter(e => { const d = new Date(e.date); return d.getMonth() === month.getMonth() && d.getFullYear() === month.getFullYear() })
        .reduce((sum, e) => sum + e.amount, 0)
      const monthIncome = incomeRecords
        .filter(inc => { const d = new Date(inc.date); return d.getMonth() === month.getMonth() && d.getFullYear() === month.getFullYear() })
        .reduce((sum, inc) => sum + inc.amount, 0)
      return {
        month: MONTH_SHORT[month.getMonth()],
        income: monthIncome,
        expenses: monthExpenses,
      }
    })
  }, [expenses, incomeRecords])

  const categoryBreakdownData = useMemo(() => {
    const categoryTotals: Record<string, number> = {}
    expenses.forEach(e => {
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount
    })
    return Object.entries(categoryTotals).map(([key, value]) => ({
      category: CATEGORY_CONFIG[key as ExpenseCategory]?.label || key,
      value,
      fill: CATEGORY_CONFIG[key as ExpenseCategory]?.color || '#6b7280',
    }))
  }, [expenses])

  const cashFlowData = useMemo(() => {
    const now = new Date()
    return Array.from({ length: 6 }).map((_, i) => {
      const month = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1)
      const outflow = expenses
        .filter(e => { const d = new Date(e.date); return d.getMonth() === month.getMonth() && d.getFullYear() === month.getFullYear() })
        .reduce((sum, e) => sum + e.amount, 0)
      const inflow = incomeRecords
        .filter(inc => { const d = new Date(inc.date); return d.getMonth() === month.getMonth() && d.getFullYear() === month.getFullYear() })
        .reduce((sum, inc) => sum + inc.amount, 0)
      return {
        month: MONTH_SHORT[month.getMonth()],
        inflow,
        outflow,
      }
    })
  }, [expenses, incomeRecords])

  const propertySummary = useMemo(() => {
    return properties.map(p => {
      const propExpenses = expenses.filter(e => e.propertyId === p.id).reduce((sum, e) => sum + e.amount, 0)
      const propIncome = incomeRecords.filter(i => i.propertyId === p.id).reduce((sum, i) => sum + i.amount, 0)
      return {
        id: p.id,
        name: p.name,
        income: propIncome,
        expenses: propExpenses,
        profit: propIncome - propExpenses,
      }
    })
  }, [properties, expenses, incomeRecords])

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleAddExpense = async (formData: ExpenseFormData) => {
    setSubmitting(true)
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: formData.category,
          description: formData.description,
          amount: formData.amount,
          date: formData.date || new Date().toISOString(),
          vendor: formData.vendor || undefined,
          propertyId: formData.propertyId,
          createdById: currentUser?.id || 'system',
          receipt: formData.receipt || undefined,
          status: formData.status,
        }),
      })

      if (res.ok) {
        setShowAddDialog(false)
        await fetchExpenses()
      }
    } catch (err) {
      console.error('Failed to add expense:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleViewExpense = (expense: ExpenseData) => {
    setSelectedExpense(expense)
    setShowDetailDialog(true)
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <StatsCardSkeleton key={i} />)}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
        <TableSkeleton />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <IndianRupee className="w-6 h-6 text-emerald-600" />
            Accounting
          </h1>
          <p className="text-muted-foreground mt-1">Track income, expenses, and financial performance</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Expense
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Income"
          value={formatCurrency(stats.totalIncome)}
          icon={TrendingUp}
          iconBg="bg-emerald-50 dark:bg-emerald-950/50"
          iconColor="text-emerald-600 dark:text-emerald-400"
          subtitle="This month"
          trend={{ value: 12, isPositive: true }}
        />
        <StatsCard
          title="Total Expenses"
          value={formatCurrency(stats.totalExpenses)}
          icon={TrendingDown}
          iconBg="bg-red-50 dark:bg-red-950/50"
          iconColor="text-red-600 dark:text-red-400"
          subtitle="This month"
          trend={{ value: 8, isPositive: false }}
        />
        <StatsCard
          title="Net Profit"
          value={formatCurrency(stats.netProfit)}
          icon={DollarSign}
          iconBg={stats.netProfit >= 0 ? 'bg-emerald-50 dark:bg-emerald-950/50' : 'bg-red-50 dark:bg-red-950/50'}
          iconColor={stats.netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}
          subtitle="This month"
        />
        <StatsCard
          title="Outstanding Dues"
          value={formatCurrency(stats.outstandingDues)}
          icon={AlertTriangle}
          iconBg="bg-amber-50 dark:bg-amber-950/50"
          iconColor="text-amber-600 dark:text-amber-400"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Income vs Expense Trend (AreaChart) */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Income vs Expense Trend</CardTitle>
            <CardDescription>6-month comparison</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={TREND_CHART_CONFIG} className="h-64 w-full">
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Area type="monotone" dataKey="income" stroke="var(--color-income)" fill="var(--color-income)" fillOpacity={0.2} strokeWidth={2} />
                <Area type="monotone" dataKey="expenses" stroke="var(--color-expenses)" fill="var(--color-expenses)" fillOpacity={0.2} strokeWidth={2} />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Category Breakdown (PieChart) */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Expense Breakdown</CardTitle>
            <CardDescription>By category</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={CATEGORY_PIE_CONFIG} className="h-64 w-full">
              <PieChart>
                <Pie
                  data={categoryBreakdownData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                  nameKey="category"
                >
                  {categoryBreakdownData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Cash Flow Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Cash Flow</CardTitle>
          <CardDescription>Monthly inflow vs outflow</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={CASH_FLOW_CONFIG} className="h-56 w-full">
            <BarChart data={cashFlowData} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis tickLine={false} axisLine={false} fontSize={12} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar dataKey="inflow" fill="var(--color-inflow)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="outflow" fill="var(--color-outflow)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Property Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {propertySummary.map(p => (
          <Card key={p.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="h-4 w-4 text-emerald-600" />
                <h3 className="font-semibold text-sm">{p.name}</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Income</span>
                  <span className="font-medium text-emerald-600">{formatCurrency(p.income)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Expenses</span>
                  <span className="font-medium text-red-600">{formatCurrency(p.expenses)}</span>
                </div>
                <div className="pt-2 border-t flex justify-between text-sm">
                  <span className="font-medium">Profit</span>
                  <span className={`font-bold ${p.profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {formatCurrency(p.profit)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs: Expenses & Income */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 w-64">
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="income">Income</TabsTrigger>
        </TabsList>

        {/* ── Expenses Tab ─────────────────────────────────────────────────── */}
        <TabsContent value="expenses" className="space-y-4 mt-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by description or vendor..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-40"><SelectValue placeholder="Category" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
                      <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={propertyFilter} onValueChange={setPropertyFilter}>
                  <SelectTrigger className="w-40"><SelectValue placeholder="Property" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Properties</SelectItem>
                    {properties.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    {Object.entries(EXPENSE_STATUS_CONFIG).map(([key, cfg]) => (
                      <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={e => setDateFrom(e.target.value)}
                  className="w-36"
                  placeholder="From"
                />
                <Input
                  type="date"
                  value={dateTo}
                  onChange={e => setDateTo(e.target.value)}
                  className="w-36"
                  placeholder="To"
                />
              </div>
            </CardContent>
          </Card>

          {/* Expenses Table */}
          {filteredExpenses.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Receipt className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-1">No expenses found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery || categoryFilter !== 'all'
                    ? 'Try adjusting your filters or search query'
                    : 'Add your first expense to get started'}
                </p>
                <Button onClick={() => setShowAddDialog(true)} className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Expense
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Property</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredExpenses.map(e => {
                      const catCfg = CATEGORY_CONFIG[e.category]
                      const statusCfg = EXPENSE_STATUS_CONFIG[e.status]
                      return (
                        <TableRow key={e.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleViewExpense(e)}>
                          <TableCell>{formatDate(e.date)}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className={`${catCfg.bgClass} ${catCfg.textClass} text-xs`}>
                              {catCfg.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">{e.description}</TableCell>
                          <TableCell>{e.vendor || '—'}</TableCell>
                          <TableCell className="font-medium">{formatCurrency(e.amount)}</TableCell>
                          <TableCell>{e.property?.name}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className={`${statusCfg.bgClass} ${statusCfg.textClass} text-xs`}>
                              <div className={`h-1.5 w-1.5 rounded-full ${statusCfg.dotClass} mr-1`} />
                              {statusCfg.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={ev => ev.stopPropagation()}>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={ev => { ev.stopPropagation(); handleViewExpense(e) }}>
                                  <Eye className="h-4 w-4 mr-2" /> View Details
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── Income Tab ───────────────────────────────────────────────────── */}
        <TabsContent value="income" className="space-y-4 mt-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by tenant name..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={incomeSourceFilter} onValueChange={setIncomeSourceFilter}>
                  <SelectTrigger className="w-40"><SelectValue placeholder="Source" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    {Object.entries(INCOME_SOURCE_CONFIG).map(([key, cfg]) => (
                      <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={propertyFilter} onValueChange={setPropertyFilter}>
                  <SelectTrigger className="w-40"><SelectValue placeholder="Property" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Properties</SelectItem>
                    {properties.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={e => setDateFrom(e.target.value)}
                  className="w-36"
                  placeholder="From"
                />
                <Input
                  type="date"
                  value={dateTo}
                  onChange={e => setDateTo(e.target.value)}
                  className="w-36"
                  placeholder="To"
                />
              </div>
            </CardContent>
          </Card>

          {/* Income Table */}
          {filteredIncome.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CreditCard className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-1">No income records found</h3>
                <p className="text-muted-foreground">Income records are generated from payment collections</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Tenant</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Property</TableHead>
                      <TableHead>Payment Method</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredIncome.map(i => {
                      const srcCfg = INCOME_SOURCE_CONFIG[i.source]
                      return (
                        <TableRow key={i.id}>
                          <TableCell>{formatDate(i.date)}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className={`${srcCfg.bgClass} ${srcCfg.textClass} text-xs`}>
                              {srcCfg.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">{i.tenantName}</TableCell>
                          <TableCell className="font-medium">{formatCurrency(i.amount)}</TableCell>
                          <TableCell>{i.property?.name}</TableCell>
                          <TableCell>
                            <span className="text-sm capitalize">{i.paymentMethod.replace('_', ' ')}</span>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={
                                i.status === 'completed'
                                  ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-xs'
                                  : 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 text-xs'
                              }
                            >
                              {i.status === 'completed' ? 'Completed' : 'Pending'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <AddExpenseDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        properties={properties}
        onSubmit={handleAddExpense}
        submitting={submitting}
        userId={currentUser?.id}
      />

      <ExpenseDetailDialog
        expense={selectedExpense}
        open={showDetailDialog}
        onClose={() => { setShowDetailDialog(false); setSelectedExpense(null) }}
      />
    </div>
  )
}
