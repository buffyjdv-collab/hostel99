'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
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
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart'
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import { format } from 'date-fns'
import {
  FileText,
  TrendingUp,
  TrendingDown,
  IndianRupee,
  Download,
  FileSpreadsheet,
  Filter,
  Building2,
  Calendar,
  PieChartIcon,
  BarChart3,
  Activity,
  Users,
  BedDouble,
  CreditCard,
  Receipt,
  Loader2,
  Package,
  ChefHat,
  AlertTriangle,
  Armchair,
  Trash2,
} from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────────

type ReportType = 'income' | 'expense' | 'profit' | 'collection' | 'due' | 'vacancy' | 'occupancy' | 'tenant_ledger' | 'payment_report' | 'stock_report' | 'consumption_report' | 'waste_report' | 'kitchen_cost' | 'asset_report' | 'low_stock' | 'expiry_report'

interface Property {
  id: string
  name: string
}

interface ReportTypeInfo {
  key: ReportType
  label: string
  icon: React.ReactNode
  description: string
  color: string
}

// ── Constants ────────────────────────────────────────────────────────────────

const REPORT_TYPES: ReportTypeInfo[] = [
  { key: 'income', label: 'Income', icon: <TrendingUp className="h-4 w-4" />, description: 'Monthly income breakdown', color: 'emerald' },
  { key: 'expense', label: 'Expense', icon: <TrendingDown className="h-4 w-4" />, description: 'Expense by category', color: 'rose' },
  { key: 'profit', label: 'Profit', icon: <Activity className="h-4 w-4" />, description: 'Profit & loss trend', color: 'teal' },
  { key: 'collection', label: 'Collection', icon: <IndianRupee className="h-4 w-4" />, description: 'Collection rate & summary', color: 'cyan' },
  { key: 'due', label: 'Due', icon: <Receipt className="h-4 w-4" />, description: 'Overdue payments', color: 'orange' },
  { key: 'vacancy', label: 'Vacancy', icon: <BedDouble className="h-4 w-4" />, description: 'Room & bed vacancy', color: 'violet' },
  { key: 'occupancy', label: 'Occupancy', icon: <Building2 className="h-4 w-4" />, description: 'Occupancy rates', color: 'blue' },
  { key: 'tenant_ledger', label: 'Tenant Ledger', icon: <Users className="h-4 w-4" />, description: 'Tenant transaction history', color: 'indigo' },
  { key: 'payment_report', label: 'Payment Report', icon: <CreditCard className="h-4 w-4" />, description: 'Detailed payment report', color: 'amber' },
  { key: 'stock_report', label: 'Stock Report', icon: <Package className="h-4 w-4" />, description: 'Current stock levels & values', color: 'emerald' },
  { key: 'consumption_report', label: 'Consumption', icon: <ChefHat className="h-4 w-4" />, description: 'Item-wise consumption tracking', color: 'orange' },
  { key: 'waste_report', label: 'Wastage', icon: <Trash2 className="h-4 w-4" />, description: 'Food waste & spoilage analysis', color: 'rose' },
  { key: 'kitchen_cost', label: 'Kitchen Cost', icon: <ChefHat className="h-4 w-4" />, description: 'Cost per student analysis', color: 'cyan' },
  { key: 'asset_report', label: 'Assets', icon: <Armchair className="h-4 w-4" />, description: 'Asset inventory & depreciation', color: 'violet' },
  { key: 'low_stock', label: 'Low Stock', icon: <AlertTriangle className="h-4 w-4" />, description: 'Items below minimum stock', color: 'red' },
  { key: 'expiry_report', label: 'Expiry', icon: <Calendar className="h-4 w-4" />, description: 'Items nearing expiry', color: 'amber' },
]

const MONTHS = [
  { value: '1', label: 'January' }, { value: '2', label: 'February' }, { value: '3', label: 'March' },
  { value: '4', label: 'April' }, { value: '5', label: 'May' }, { value: '6', label: 'June' },
  { value: '7', label: 'July' }, { value: '8', label: 'August' }, { value: '9', label: 'September' },
  { value: '10', label: 'October' }, { value: '11', label: 'November' }, { value: '12', label: 'December' },
]

const CHART_COLORS = ['#10b981', '#14b8a6', '#06b6d4', '#f59e0b', '#ef4444', '#8b5cf6', '#f97316', '#6366f1']

const incomeChartConfig: ChartConfig = {
  amount: { label: 'Amount', color: '#10b981' },
}

const expenseChartConfig: ChartConfig = {
  amount: { label: 'Amount', color: '#ef4444' },
  maintenance: { label: 'Maintenance', color: '#10b981' },
  utilities: { label: 'Utilities', color: '#14b8a6' },
  salary: { label: 'Salary', color: '#06b6d4' },
  supplies: { label: 'Supplies', color: '#f59e0b' },
  food: { label: 'Food', color: '#f97316' },
  marketing: { label: 'Marketing', color: '#8b5cf6' },
  other: { label: 'Other', color: '#6366f1' },
}

const profitChartConfig: ChartConfig = {
  income: { label: 'Income', color: '#10b981' },
  expense: { label: 'Expense', color: '#ef4444' },
  profit: { label: 'Profit', color: '#14b8a6' },
}

const collectionChartConfig: ChartConfig = {
  collected: { label: 'Collected', color: '#10b981' },
  pending: { label: 'Pending', color: '#f59e0b' },
}

const occupancyChartConfig: ChartConfig = {
  occupied: { label: 'Occupied', color: '#10b981' },
  vacant: { label: 'Vacant', color: '#e5e7eb' },
}

const paymentStatusChartConfig: ChartConfig = {
  paid: { label: 'Paid', color: '#10b981' },
  pending: { label: 'Pending', color: '#f59e0b' },
  overdue: { label: 'Overdue', color: '#ef4444' },
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)
}

function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ── Inventory Report Components ─────────────────────────────────────────────

function StockReport({ selectedPropertyId }: { selectedPropertyId: string }) {
  const [invData, setInvData] = useState<any>(null)
  const [invLoading, setInvLoading] = useState(true)

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const pid = selectedPropertyId || ''
        const res = await fetch(`/api/inventory?propertyId=${pid}`)
        const data = await res.json()
        setInvData(data)
      } catch (e) { console.error(e) }
      finally { setInvLoading(false) }
    }
    fetchInventory()
  }, [selectedPropertyId])

  if (invLoading) return <div className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-emerald-500" /></div>
  if (!invData) return <div className="text-center text-muted-foreground p-12">No data available</div>

  const items = invData.items || []
  const categories = invData.categories || []
  const stats = invData.stats || {}

  const categoryData = categories.map((c: any) => {
    const catItems = items.filter((i: any) => i.categoryId === c.id)
    return { name: c.name, count: catItems.length, value: catItems.reduce((s: number, i: any) => s + i.currentStock * i.unitPrice, 0) }
  }).filter((c: any) => c.count > 0)

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Total Items</p><p className="text-2xl font-bold">{stats.totalItems || 0}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Low Stock</p><p className="text-2xl font-bold text-red-500">{stats.lowStockCount || 0}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Total Value</p><p className="text-2xl font-bold">{formatCurrency(stats.totalValue || 0)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Expiring Soon</p><p className="text-2xl font-bold text-amber-500">{stats.expiringSoon || 0}</p></CardContent></Card>
      </div>
      {categoryData.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Stock Value by Category</CardTitle></CardHeader>
          <CardContent>
            <ChartContainer config={{ value: { label: 'Value', color: '#10b981' } }} className="h-[300px]">
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader><CardTitle>Current Stock Levels</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Item</TableHead><TableHead>Category</TableHead><TableHead>Unit</TableHead><TableHead>Current Stock</TableHead><TableHead>Min Stock</TableHead><TableHead>Unit Price</TableHead><TableHead>Value</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {items.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell><Badge variant="outline">{item.category?.name || '-'}</Badge></TableCell>
                    <TableCell>{item.unit}</TableCell>
                    <TableCell className={item.currentStock <= item.minStock ? 'text-red-500 font-bold' : ''}>{item.currentStock}</TableCell>
                    <TableCell>{item.minStock}</TableCell>
                    <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                    <TableCell>{formatCurrency(item.currentStock * item.unitPrice)}</TableCell>
                    <TableCell><Badge variant={item.currentStock <= item.minStock ? 'destructive' : 'secondary'}>{item.currentStock <= item.minStock ? 'Low' : 'OK'}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function ConsumptionReport({ selectedPropertyId }: { selectedPropertyId: string }) {
  const [messData, setMessData] = useState<any>(null)
  const [messLoading, setMessLoading] = useState(true)

  useEffect(() => {
    const fetchMess = async () => {
      try {
        const pid = selectedPropertyId || ''
        const res = await fetch(`/api/mess?propertyId=${pid}&type=consumption&days=30`)
        const data = await res.json()
        setMessData(data)
      } catch (e) { console.error(e) }
      finally { setMessLoading(false) }
    }
    fetchMess()
  }, [selectedPropertyId])

  if (messLoading) return <div className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-emerald-500" /></div>

  const logs = messData?.consumption || []
  const totalIssued = logs.reduce((s: number, l: any) => s + l.issuedQty, 0)
  const totalConsumed = logs.reduce((s: number, l: any) => s + l.consumedQty, 0)
  const totalWastage = logs.reduce((s: number, l: any) => s + l.wastageQty, 0)
  const totalCost = logs.reduce((s: number, l: any) => s + l.totalCost, 0)

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Total Issued</p><p className="text-2xl font-bold">{totalIssued.toFixed(1)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Total Consumed</p><p className="text-2xl font-bold text-emerald-600">{totalConsumed.toFixed(1)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Total Wastage</p><p className="text-2xl font-bold text-red-500">{totalWastage.toFixed(1)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Total Cost</p><p className="text-2xl font-bold">{formatCurrency(totalCost)}</p></CardContent></Card>
      </div>
      <Card>
        <CardHeader><CardTitle>Consumption Log</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Item</TableHead><TableHead>Meal</TableHead><TableHead>Issued</TableHead><TableHead>Consumed</TableHead><TableHead>Returned</TableHead><TableHead>Wastage</TableHead><TableHead>Cost</TableHead></TableRow></TableHeader>
              <TableBody>
                {logs.map((log: any) => (
                  <TableRow key={log.id}>
                    <TableCell>{format(new Date(log.date), 'dd MMM')}</TableCell>
                    <TableCell className="font-medium">{log.item?.name || '-'}</TableCell>
                    <TableCell><Badge variant="outline">{log.mealType || '-'}</Badge></TableCell>
                    <TableCell>{log.issuedQty} {log.unit}</TableCell>
                    <TableCell>{log.consumedQty} {log.unit}</TableCell>
                    <TableCell>{log.returnedQty} {log.unit}</TableCell>
                    <TableCell className="text-red-500">{log.wastageQty} {log.unit}</TableCell>
                    <TableCell>{formatCurrency(log.totalCost)}</TableCell>
                  </TableRow>
                ))}
                {logs.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No consumption data available</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function WasteReport({ selectedPropertyId }: { selectedPropertyId: string }) {
  const [messData, setMessData] = useState<any>(null)
  const [messLoading, setMessLoading] = useState(true)

  useEffect(() => {
    const fetchMess = async () => {
      try {
        const pid = selectedPropertyId || ''
        const res = await fetch(`/api/mess?propertyId=${pid}&type=waste&days=30`)
        const data = await res.json()
        setMessData(data)
      } catch (e) { console.error(e) }
      finally { setMessLoading(false) }
    }
    fetchMess()
  }, [selectedPropertyId])

  if (messLoading) return <div className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-emerald-500" /></div>

  const waste = messData?.waste || []
  const wasteStats = messData?.wasteStats || {}
  const wasteByCategory = waste.reduce((acc: any, w: any) => {
    acc[w.category] = (acc[w.category] || 0) + w.estimatedCost
    return acc
  }, {})
  const pieData = Object.entries(wasteByCategory).map(([k, v]) => ({ name: k.replace('_', ' '), value: v as number }))

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Total Waste</p><p className="text-2xl font-bold">{formatCurrency(wasteStats.totalWaste || 0)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Food Waste</p><p className="text-2xl font-bold text-orange-500">{formatCurrency(wasteStats.foodWaste || 0)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Expired</p><p className="text-2xl font-bold text-amber-500">{formatCurrency(wasteStats.expired || 0)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Damaged</p><p className="text-2xl font-bold text-red-500">{formatCurrency(wasteStats.damaged || 0)}</p></CardContent></Card>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {pieData.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Waste by Category</CardTitle></CardHeader>
            <CardContent>
              <ChartContainer config={{ value: { label: 'Cost', color: '#ef4444' } }} className="h-[300px]">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                    {pieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardHeader><CardTitle>Waste Records</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Category</TableHead><TableHead>Description</TableHead><TableHead>Qty</TableHead><TableHead>Cost</TableHead><TableHead>Disposal</TableHead></TableRow></TableHeader>
                <TableBody>
                  {waste.map((w: any) => (
                    <TableRow key={w.id}>
                      <TableCell>{format(new Date(w.date), 'dd MMM')}</TableCell>
                      <TableCell><Badge variant="outline" className="capitalize">{w.category.replace('_', ' ')}</Badge></TableCell>
                      <TableCell>{w.description}</TableCell>
                      <TableCell>{w.quantity} {w.unit || ''}</TableCell>
                      <TableCell className="text-red-500">{formatCurrency(w.estimatedCost)}</TableCell>
                      <TableCell>{w.disposalMethod || '-'}</TableCell>
                    </TableRow>
                  ))}
                  {waste.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No waste records</TableCell></TableRow>}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function KitchenCostReport({ selectedPropertyId }: { selectedPropertyId: string }) {
  const [invData, setInvData] = useState<any>(null)
  const [kitchenData, setKitchenData] = useState<any>(null)
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const pid = selectedPropertyId || ''
        const [invRes, kitchenRes] = await Promise.all([
          fetch(`/api/inventory?propertyId=${pid}`),
          fetch(`/api/kitchen?propertyId=${pid}&type=issues`),
        ])
        setInvData(await invRes.json())
        setKitchenData(await kitchenRes.json())
      } catch (e) { console.error(e) }
      finally { setDataLoading(false) }
    }
    fetchData()
  }, [selectedPropertyId])

  if (dataLoading) return <div className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-emerald-500" /></div>

  const totalStockValue = invData?.stats?.totalValue || 0
  const issues = kitchenData?.issues || []
  const totalIssuedCost = issues.reduce((s: number, i: any) => s + (i.quantity * (i.item?.unitPrice || 0)), 0)
  const tenants = 80 // approximate
  const costPerStudent = tenants > 0 ? totalIssuedCost / tenants : 0

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Total Stock Value</p><p className="text-2xl font-bold">{formatCurrency(totalStockValue)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Total Issued Cost</p><p className="text-2xl font-bold text-orange-500">{formatCurrency(totalIssuedCost)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Est. Residents</p><p className="text-2xl font-bold">{tenants}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Cost per Student</p><p className="text-2xl font-bold text-emerald-600">{formatCurrency(costPerStudent)}</p></CardContent></Card>
      </div>
      <Card>
        <CardHeader><CardTitle>Recent Kitchen Issues</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Issue #</TableHead><TableHead>Item</TableHead><TableHead>Qty</TableHead><TableHead>Purpose</TableHead><TableHead>Date</TableHead><TableHead>Est. Cost</TableHead></TableRow></TableHeader>
              <TableBody>
                {issues.slice(0, 20).map((issue: any) => (
                  <TableRow key={issue.id}>
                    <TableCell className="font-mono text-sm">{issue.issueNumber}</TableCell>
                    <TableCell className="font-medium">{issue.item?.name || '-'}</TableCell>
                    <TableCell>{issue.quantity} {issue.unit}</TableCell>
                    <TableCell><Badge variant="outline" className="capitalize">{issue.purpose || '-'}</Badge></TableCell>
                    <TableCell>{format(new Date(issue.createdAt), 'dd MMM yyyy')}</TableCell>
                    <TableCell>{formatCurrency(issue.quantity * (issue.item?.unitPrice || 0))}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function AssetReport({ selectedPropertyId }: { selectedPropertyId: string }) {
  const [assetData, setAssetData] = useState<any>(null)
  const [assetLoading, setAssetLoading] = useState(true)

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const pid = selectedPropertyId || ''
        const res = await fetch(`/api/assets?propertyId=${pid}&type=assets`)
        const data = await res.json()
        setAssetData(data)
      } catch (e) { console.error(e) }
      finally { setAssetLoading(false) }
    }
    fetchAssets()
  }, [selectedPropertyId])

  if (assetLoading) return <div className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-emerald-500" /></div>

  const assets = assetData?.assets || []
  const stats = assetData?.assetStats || {}
  const byCategory = stats.byCategory || {}
  const catData = Object.entries(byCategory).map(([k, v]) => ({ name: k.replace('_', ' '), count: v as number }))

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Total Assets</p><p className="text-2xl font-bold">{stats.total || 0}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Active</p><p className="text-2xl font-bold text-emerald-600">{stats.active || 0}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Under Maintenance</p><p className="text-2xl font-bold text-amber-500">{stats.underMaintenance || 0}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Total Value</p><p className="text-2xl font-bold">{formatCurrency(stats.totalValue || 0)}</p></CardContent></Card>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {catData.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Assets by Category</CardTitle></CardHeader>
            <CardContent>
              <ChartContainer config={{ count: { label: 'Count', color: '#8b5cf6' } }} className="h-[300px]">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Pie data={catData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                    {catData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardHeader><CardTitle>Asset List</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Category</TableHead><TableHead>Room</TableHead><TableHead>Value</TableHead><TableHead>Condition</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                <TableBody>
                  {assets.map((a: any) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.name}</TableCell>
                      <TableCell><Badge variant="outline" className="capitalize">{a.category.replace('_', ' ')}</Badge></TableCell>
                      <TableCell>{a.room?.name || '-'}</TableCell>
                      <TableCell>{formatCurrency(a.currentValue || a.purchasePrice || 0)}</TableCell>
                      <TableCell><Badge variant={a.condition === 'broken' ? 'destructive' : a.condition === 'poor' ? 'secondary' : 'outline'} className="capitalize">{a.condition}</Badge></TableCell>
                      <TableCell><Badge variant={a.status === 'active' ? 'default' : 'secondary'} className="capitalize">{a.status.replace('_', ' ')}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function LowStockReport({ selectedPropertyId }: { selectedPropertyId: string }) {
  const [invData, setInvData] = useState<any>(null)
  const [invLoading, setInvLoading] = useState(true)

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const pid = selectedPropertyId || ''
        const res = await fetch(`/api/inventory?propertyId=${pid}&lowStock=true`)
        const data = await res.json()
        setInvData(data)
      } catch (e) { console.error(e) }
      finally { setInvLoading(false) }
    }
    fetchInventory()
  }, [selectedPropertyId])

  if (invLoading) return <div className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-emerald-500" /></div>

  const lowStockItems = (invData?.items || []).filter((i: any) => i.currentStock <= i.minStock)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-red-500" /> Low Stock Alert - {lowStockItems.length} Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Item</TableHead><TableHead>Category</TableHead><TableHead>Current Stock</TableHead><TableHead>Min Stock</TableHead><TableHead>Shortage</TableHead><TableHead>Unit</TableHead><TableHead>Reorder Qty</TableHead><TableHead>Est. Cost</TableHead></TableRow></TableHeader>
              <TableBody>
                {lowStockItems.map((item: any) => {
                  const shortage = item.minStock - item.currentStock
                  const reorderQty = (item.maxStock || item.minStock * 2) - item.currentStock
                  return (
                    <TableRow key={item.id} className="bg-red-50/50">
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell><Badge variant="outline">{item.category?.name || '-'}</Badge></TableCell>
                      <TableCell className="text-red-600 font-bold">{item.currentStock}</TableCell>
                      <TableCell>{item.minStock}</TableCell>
                      <TableCell className="text-red-500">{shortage > 0 ? shortage.toFixed(1) : '0'}</TableCell>
                      <TableCell>{item.unit}</TableCell>
                      <TableCell>{reorderQty > 0 ? reorderQty.toFixed(1) : '-'}</TableCell>
                      <TableCell>{reorderQty > 0 ? formatCurrency(reorderQty * item.unitPrice) : '-'}</TableCell>
                    </TableRow>
                  )
                })}
                {lowStockItems.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">All items are above minimum stock levels</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function ExpiryReport({ selectedPropertyId }: { selectedPropertyId: string }) {
  const [invData, setInvData] = useState<any>(null)
  const [invLoading, setInvLoading] = useState(true)

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const pid = selectedPropertyId || ''
        const res = await fetch(`/api/inventory?propertyId=${pid}`)
        const data = await res.json()
        setInvData(data)
      } catch (e) { console.error(e) }
      finally { setInvLoading(false) }
    }
    fetchInventory()
  }, [selectedPropertyId])

  if (invLoading) return <div className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-emerald-500" /></div>

  const now = new Date()
  const items = (invData?.items || []).filter((i: any) => i.expiryDate).map((i: any) => ({
    ...i,
    daysUntilExpiry: Math.ceil((new Date(i.expiryDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
  })).sort((a: any, b: any) => a.daysUntilExpiry - b.daysUntilExpiry)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Items with Expiry Dates</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Item</TableHead><TableHead>Category</TableHead><TableHead>Batch</TableHead><TableHead>Current Stock</TableHead><TableHead>Expiry Date</TableHead><TableHead>Days Left</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {items.map((item: any) => (
                  <TableRow key={item.id} className={item.daysUntilExpiry <= 0 ? 'bg-red-50/50' : item.daysUntilExpiry <= 7 ? 'bg-amber-50/50' : ''}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell><Badge variant="outline">{item.category?.name || '-'}</Badge></TableCell>
                    <TableCell>{item.batchNumber || '-'}</TableCell>
                    <TableCell>{item.currentStock} {item.unit}</TableCell>
                    <TableCell>{format(new Date(item.expiryDate), 'dd MMM yyyy')}</TableCell>
                    <TableCell className={item.daysUntilExpiry <= 0 ? 'text-red-600 font-bold' : item.daysUntilExpiry <= 7 ? 'text-amber-600 font-semibold' : ''}>{item.daysUntilExpiry} days</TableCell>
                    <TableCell><Badge variant={item.daysUntilExpiry <= 0 ? 'destructive' : item.daysUntilExpiry <= 7 ? 'secondary' : 'outline'}>{item.daysUntilExpiry <= 0 ? 'Expired' : item.daysUntilExpiry <= 7 ? 'Expiring Soon' : 'OK'}</Badge></TableCell>
                  </TableRow>
                ))}
                {items.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No items with expiry dates</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ── Component ────────────────────────────────────────────────────────────────

export function ReportsPage() {
  const { currentUser, selectedPropertyId, currentHostelId } = useAppStore()
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [reportData, setReportData] = useState<Record<string, unknown> | null>(null)
  const [reportLoading, setReportLoading] = useState(false)

  // Filters
  const [selectedReport, setSelectedReport] = useState<ReportType>('income')
  const [filterProperty, setFilterProperty] = useState<string>('all')
  const [filterMonth, setFilterMonth] = useState<string>(String(new Date().getMonth() + 1))
  const [filterYear, setFilterYear] = useState<string>(String(new Date().getFullYear()))
  const [filterTenantId, setFilterTenantId] = useState<string>('')
  const [tenants, setTenants] = useState<{ id: string; name: string }[]>([])

  // Fetch properties
  useEffect(() => {
    async function fetchProperties() {
      try {
        const res = await fetch('/api/properties' + (currentHostelId ? `?propertyId=${currentHostelId}` : ''))
        if (res.ok) {
          const data = await res.json()
          setProperties(Array.isArray(data) ? data.map((p: { id: string; name: string }) => ({ id: p.id, name: p.name })) : [])
        }
      } catch { /* ignore */ }
    }
    fetchProperties()
  }, [])

  // Fetch tenants for tenant ledger
  useEffect(() => {
    if (selectedReport === 'tenant_ledger') {
      async function fetchTenants() {
        try {
          const res = await fetch('/api/tenants' + (currentHostelId ? `?propertyId=${currentHostelId}` : ''))
          if (res.ok) {
            const data = await res.json()
            setTenants(Array.isArray(data) ? data.map((t: { id: string; name: string }) => ({ id: t.id, name: t.name })) : [])
          }
        } catch { /* ignore */ }
      }
      fetchTenants()
    }
  }, [selectedReport])

  // Fetch report data
  const fetchReport = useCallback(async () => {
    setReportLoading(true)
    try {
      const params = new URLSearchParams({
        type: selectedReport,
        ...(filterProperty !== 'all' && { propertyId: filterProperty }),
        ...(filterMonth && { month: filterMonth }),
        ...(filterYear && { year: filterYear }),
        ...(selectedReport === 'tenant_ledger' && filterTenantId && { tenantId: filterTenantId }),
      })
      if (currentHostelId && !params.has('propertyId')) params.set('propertyId', currentHostelId)
      const res = await fetch(`/api/reports?${params}`)
      if (res.ok) {
        const data = await res.json()
        setReportData(data)
      }
    } catch { /* ignore */ }
    setReportLoading(false)
    setLoading(false)
  }, [selectedReport, filterProperty, filterMonth, filterYear, filterTenantId])

  // Fetch on mount and when deps change
  const [lastFetchKey, setLastFetchKey] = useState('')
  const currentKey = `${selectedReport}-${filterProperty}-${filterMonth}-${filterYear}-${filterTenantId}`
  if (lastFetchKey !== currentKey && !reportLoading) {
    setLastFetchKey(currentKey)
    fetchReport()
  }

  // ── Report Renderers ────────────────────────────────────────────────────

  const renderIncomeReport = () => {
    const data = reportData as { totalIncome?: number; payments?: unknown[]; month?: number; year?: number } | null
    if (!data) return null

    const payments = (data.payments || []) as { amount: number; tenant?: { name: string; room?: { name: string } }; month?: number }[]

    // Group by month for chart
    const monthlyData = payments.length > 0
      ? [{ month: MONTHS[(data.month || 1) - 1]?.label || '', amount: data.totalIncome || 0 }]
      : [{ month: MONTHS[(data.month || 1) - 1]?.label || '', amount: 0 }]

    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-emerald-200 bg-emerald-50/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <IndianRupee className="h-4 w-4 text-emerald-600" />
                <span className="text-sm text-emerald-600">Total Income</span>
              </div>
              <p className="mt-1 text-2xl font-bold text-emerald-700">{formatCurrency(data.totalIncome || 0)}</p>
            </CardContent>
          </Card>
          <Card className="border-teal-200 bg-teal-50/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-teal-600" />
                <span className="text-sm text-teal-600">Payments Received</span>
              </div>
              <p className="mt-1 text-2xl font-bold text-teal-700">{payments.length}</p>
            </CardContent>
          </Card>
          <Card className="border-cyan-200 bg-cyan-50/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-cyan-600" />
                <span className="text-sm text-cyan-600">Period</span>
              </div>
              <p className="mt-1 text-2xl font-bold text-cyan-700">{MONTHS[(data.month || 1) - 1]?.label} {data.year}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Income by Month</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={incomeChartConfig} className="h-[300px] w-full">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="amount" fill="var(--color-amount)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payment Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">No payments found</TableCell></TableRow>
                ) : (
                  payments.map((p, i) => (
                    <TableRow key={i}>
                      <TableCell>{p.tenant?.name || 'N/A'}</TableCell>
                      <TableCell>{p.tenant?.room?.name || 'N/A'}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(p.amount)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderExpenseReport = () => {
    const data = reportData as { totalExpense?: number; expenses?: unknown[]; month?: number; year?: number } | null
    if (!data) return null

    const expenses = (data.expenses || []) as { amount: number; category: string; description: string; property?: { name: string } }[]

    // Group by category for pie chart
    const categoryMap = new Map<string, number>()
    expenses.forEach((e) => {
      categoryMap.set(e.category, (categoryMap.get(e.category) || 0) + e.amount)
    })
    const pieData = Array.from(categoryMap.entries()).map(([name, value]) => ({ name, value }))

    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-rose-200 bg-rose-50/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-rose-600" />
                <span className="text-sm text-rose-600">Total Expenses</span>
              </div>
              <p className="mt-1 text-2xl font-bold text-rose-700">{formatCurrency(data.totalExpense || 0)}</p>
            </CardContent>
          </Card>
          <Card className="border-amber-200 bg-amber-50/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <PieChartIcon className="h-4 w-4 text-amber-600" />
                <span className="text-sm text-amber-600">Categories</span>
              </div>
              <p className="mt-1 text-2xl font-bold text-amber-700">{categoryMap.size}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Expense by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={expenseChartConfig} className="h-[300px] w-full">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Expense Details</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.length === 0 ? (
                    <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">No expenses found</TableCell></TableRow>
                  ) : (
                    expenses.map((e, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">{e.category}</Badge>
                        </TableCell>
                        <TableCell>{e.description}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(e.amount)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const renderProfitReport = () => {
    const data = reportData as { totalIncome?: number; totalExpense?: number; profit?: number; month?: number; year?: number } | null
    if (!data) return null

    const trendData = [{
      month: MONTHS[(data.month || 1) - 1]?.label || '',
      income: data.totalIncome || 0,
      expense: data.totalExpense || 0,
      profit: data.profit || 0,
    }]

    const isProfit = (data.profit || 0) >= 0

    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-emerald-200 bg-emerald-50/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                <span className="text-sm text-emerald-600">Income</span>
              </div>
              <p className="mt-1 text-2xl font-bold text-emerald-700">{formatCurrency(data.totalIncome || 0)}</p>
            </CardContent>
          </Card>
          <Card className="border-rose-200 bg-rose-50/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-rose-600" />
                <span className="text-sm text-rose-600">Expenses</span>
              </div>
              <p className="mt-1 text-2xl font-bold text-rose-700">{formatCurrency(data.totalExpense || 0)}</p>
            </CardContent>
          </Card>
          <Card className={isProfit ? 'border-teal-200 bg-teal-50/50' : 'border-red-200 bg-red-50/50'}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Activity className={isProfit ? 'h-4 w-4 text-teal-600' : 'h-4 w-4 text-red-600'} />
                <span className={isProfit ? 'text-sm text-teal-600' : 'text-sm text-red-600'}>Net Profit</span>
              </div>
              <p className={`mt-1 text-2xl font-bold ${isProfit ? 'text-teal-700' : 'text-red-700'}`}>{formatCurrency(data.profit || 0)}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Profit Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={profitChartConfig} className="h-[300px] w-full">
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Area type="monotone" dataKey="income" stroke="var(--color-income)" fill="var(--color-income)" fillOpacity={0.2} />
                <Area type="monotone" dataKey="expense" stroke="var(--color-expense)" fill="var(--color-expense)" fillOpacity={0.2} />
                <Area type="monotone" dataKey="profit" stroke="var(--color-profit)" fill="var(--color-profit)" fillOpacity={0.3} />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderCollectionReport = () => {
    const data = reportData as { totalExpected?: number; collected?: number; pending?: number; collectionRate?: number; month?: number; year?: number } | null
    if (!data) return null

    const barData = [{
      month: MONTHS[(data.month || 1) - 1]?.label || '',
      collected: data.collected || 0,
      pending: data.pending || 0,
    }]

    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-emerald-200 bg-emerald-50/50">
            <CardContent className="p-4">
              <span className="text-sm text-emerald-600">Total Expected</span>
              <p className="mt-1 text-2xl font-bold text-emerald-700">{formatCurrency(data.totalExpected || 0)}</p>
            </CardContent>
          </Card>
          <Card className="border-teal-200 bg-teal-50/50">
            <CardContent className="p-4">
              <span className="text-sm text-teal-600">Collected</span>
              <p className="mt-1 text-2xl font-bold text-teal-700">{formatCurrency(data.collected || 0)}</p>
            </CardContent>
          </Card>
          <Card className="border-amber-200 bg-amber-50/50">
            <CardContent className="p-4">
              <span className="text-sm text-amber-600">Pending</span>
              <p className="mt-1 text-2xl font-bold text-amber-700">{formatCurrency(data.pending || 0)}</p>
            </CardContent>
          </Card>
          <Card className="border-cyan-200 bg-cyan-50/50">
            <CardContent className="p-4">
              <span className="text-sm text-cyan-600">Collection Rate</span>
              <p className="mt-1 text-2xl font-bold text-cyan-700">{data.collectionRate || 0}%</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Collection Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={collectionChartConfig} className="h-[300px] w-full">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="collected" fill="var(--color-collected)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="pending" fill="var(--color-pending)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderDueReport = () => {
    const data = reportData as { totalDue?: number; dues?: unknown[] } | null
    if (!data) return null

    const dues = (data.dues || []) as {
      id: string; amount: number; status: string; dueDate: string; month: number; year: number
      tenant?: { id: string; name: string; phone: string; room?: { name: string; number: string } }
    }[]

    return (
      <div className="space-y-6">
        <Card className="border-orange-200 bg-orange-50/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-orange-600" />
              <span className="text-sm text-orange-600">Total Overdue</span>
            </div>
            <p className="mt-1 text-2xl font-bold text-orange-700">{formatCurrency(data.totalDue || 0)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Overdue Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Month</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dues.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No overdue payments</TableCell></TableRow>
                ) : (
                  dues.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium">{d.tenant?.name || 'N/A'}</TableCell>
                      <TableCell>{d.tenant?.room?.name || 'N/A'}</TableCell>
                      <TableCell>{d.tenant?.phone || 'N/A'}</TableCell>
                      <TableCell>{MONTHS[d.month - 1]?.label} {d.year}</TableCell>
                      <TableCell>{formatDate(d.dueDate)}</TableCell>
                      <TableCell>
                        <Badge variant={d.status === 'overdue' ? 'destructive' : 'secondary'} className="capitalize">
                          {d.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(d.amount)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderVacancyReport = () => {
    const data = reportData as { totalBeds?: number; vacantBeds?: number; occupiedBeds?: number; vacancyRate?: number; vacantBedDetails?: unknown[] } | null
    if (!data) return null

    const vacantBedDetails = (data.vacantBedDetails || []) as {
      id: string; name: string; number: number; status: string
      room?: { name: string; number: string; property?: { name: string } }
    }[]

    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-violet-200 bg-violet-50/50">
            <CardContent className="p-4">
              <span className="text-sm text-violet-600">Total Beds</span>
              <p className="mt-1 text-2xl font-bold text-violet-700">{data.totalBeds || 0}</p>
            </CardContent>
          </Card>
          <Card className="border-emerald-200 bg-emerald-50/50">
            <CardContent className="p-4">
              <span className="text-sm text-emerald-600">Occupied</span>
              <p className="mt-1 text-2xl font-bold text-emerald-700">{data.occupiedBeds || 0}</p>
            </CardContent>
          </Card>
          <Card className="border-amber-200 bg-amber-50/50">
            <CardContent className="p-4">
              <span className="text-sm text-amber-600">Vacant</span>
              <p className="mt-1 text-2xl font-bold text-amber-700">{data.vacantBeds || 0}</p>
            </CardContent>
          </Card>
          <Card className="border-cyan-200 bg-cyan-50/50">
            <CardContent className="p-4">
              <span className="text-sm text-cyan-600">Vacancy Rate</span>
              <p className="mt-1 text-2xl font-bold text-cyan-700">{data.vacancyRate || 0}%</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Vacant Beds</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bed</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vacantBedDetails.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No vacant beds</TableCell></TableRow>
                ) : (
                  vacantBedDetails.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell className="font-medium">{b.name}</TableCell>
                      <TableCell>{b.room?.name || 'N/A'}</TableCell>
                      <TableCell>{b.room?.property?.name || 'N/A'}</TableCell>
                      <TableCell><Badge className="bg-emerald-100 text-emerald-700">Available</Badge></TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderOccupancyReport = () => {
    const data = reportData as { totalBeds?: number; occupiedBeds?: number; occupancyRate?: number; propertyWise?: unknown[] } | null
    if (!data) return null

    const propertyWise = (data.propertyWise || []) as { id: string; name: string; totalBeds: number; occupancy: number }[]

    const pieData = [
      { name: 'Occupied', value: data.occupiedBeds || 0 },
      { name: 'Vacant', value: (data.totalBeds || 0) - (data.occupiedBeds || 0) },
    ]

    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-emerald-200 bg-emerald-50/50">
            <CardContent className="p-4">
              <span className="text-sm text-emerald-600">Total Beds</span>
              <p className="mt-1 text-2xl font-bold text-emerald-700">{data.totalBeds || 0}</p>
            </CardContent>
          </Card>
          <Card className="border-teal-200 bg-teal-50/50">
            <CardContent className="p-4">
              <span className="text-sm text-teal-600">Occupied Beds</span>
              <p className="mt-1 text-2xl font-bold text-teal-700">{data.occupiedBeds || 0}</p>
            </CardContent>
          </Card>
          <Card className="border-cyan-200 bg-cyan-50/50">
            <CardContent className="p-4">
              <span className="text-sm text-cyan-600">Occupancy Rate</span>
              <p className="mt-1 text-2xl font-bold text-cyan-700">{data.occupancyRate || 0}%</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Occupancy Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={occupancyChartConfig} className="h-[300px] w-full">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                    <Cell fill="#10b981" />
                    <Cell fill="#e5e7eb" />
                  </Pie>
                  <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Property-wise Occupancy</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Property</TableHead>
                    <TableHead>Total Beds</TableHead>
                    <TableHead>Occupancy</TableHead>
                    <TableHead>Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {propertyWise.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No data</TableCell></TableRow>
                  ) : (
                    propertyWise.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell>{p.totalBeds}</TableCell>
                        <TableCell>{p.occupancy}</TableCell>
                        <TableCell>
                          <Badge variant={p.totalBeds > 0 && p.occupancy / p.totalBeds > 0.7 ? 'default' : 'secondary'}>
                            {p.totalBeds > 0 ? Math.round((p.occupancy / p.totalBeds) * 100) : 0}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const renderTenantLedger = () => {
    const data = reportData as { tenantId?: string; payments?: unknown[]; totalPaid?: number; totalDue?: number; balance?: number } | null
    if (!data) return null

    const payments = (data.payments || []) as {
      id: string; amount: number; status: string; dueDate: string; paidDate?: string; month: number; year: number; paymentMethod: string
    }[]

    return (
      <div className="space-y-6">
        {!filterTenantId ? (
          <Card className="border-amber-200 bg-amber-50/50">
            <CardContent className="p-6 text-center">
              <Users className="h-8 w-8 text-amber-500 mx-auto mb-2" />
              <p className="text-amber-700 font-medium">Select a tenant to view their ledger</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="border-emerald-200 bg-emerald-50/50">
                <CardContent className="p-4">
                  <span className="text-sm text-emerald-600">Total Paid</span>
                  <p className="mt-1 text-2xl font-bold text-emerald-700">{formatCurrency(data.totalPaid || 0)}</p>
                </CardContent>
              </Card>
              <Card className="border-rose-200 bg-rose-50/50">
                <CardContent className="p-4">
                  <span className="text-sm text-rose-600">Total Due</span>
                  <p className="mt-1 text-2xl font-bold text-rose-700">{formatCurrency(data.totalDue || 0)}</p>
                </CardContent>
              </Card>
              <Card className="border-teal-200 bg-teal-50/50">
                <CardContent className="p-4">
                  <span className="text-sm text-teal-600">Balance</span>
                  <p className="mt-1 text-2xl font-bold text-teal-700">{formatCurrency(data.balance || 0)}</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Transaction History</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Month</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Paid Date</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No transactions found</TableCell></TableRow>
                    ) : (
                      payments.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">{MONTHS[p.month - 1]?.label} {p.year}</TableCell>
                          <TableCell>{formatDate(p.dueDate)}</TableCell>
                          <TableCell>{p.paidDate ? formatDate(p.paidDate) : '-'}</TableCell>
                          <TableCell className="capitalize">{p.paymentMethod}</TableCell>
                          <TableCell>
                            <Badge
                              variant={p.status === 'paid' ? 'default' : p.status === 'overdue' ? 'destructive' : 'secondary'}
                              className="capitalize"
                            >
                              {p.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(p.amount)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    )
  }

  const renderPaymentReport = () => {
    const data = reportData as {
      month?: number; year?: number
      statusBreakdown?: { status: string; count: number; totalAmount: number }[]
      methodBreakdown?: { method: string; count: number; totalAmount: number }[]
    } | null
    if (!data) return null

    const statusData = (data.statusBreakdown || []).map((s) => ({
      name: s.status,
      value: s.totalAmount,
      count: s.count,
    }))

    const methodData = (data.methodBreakdown || []).map((m) => ({
      method: m.method,
      count: m.count,
      totalAmount: m.totalAmount,
    }))

    return (
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Payment Status Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={paymentStatusChartConfig} className="h-[300px] w-full">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                    {statusData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Payment Method Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={incomeChartConfig} className="h-[300px] w-full">
                <BarChart data={methodData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="method" type="category" width={100} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="totalAmount" fill="#14b8a6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Detailed Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h4 className="font-medium mb-3">By Status</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Count</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {statusData.map((s, i) => (
                      <TableRow key={i}>
                        <TableCell><Badge variant="outline" className="capitalize">{s.name}</Badge></TableCell>
                        <TableCell>{s.count}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(s.value)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div>
                <h4 className="font-medium mb-3">By Method</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Method</TableHead>
                      <TableHead>Count</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {methodData.map((m, i) => (
                      <TableRow key={i}>
                        <TableCell className="capitalize">{m.method}</TableCell>
                        <TableCell>{m.count}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(m.totalAmount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderReportContent = () => {
    switch (selectedReport) {
      case 'income': return renderIncomeReport()
      case 'expense': return renderExpenseReport()
      case 'profit': return renderProfitReport()
      case 'collection': return renderCollectionReport()
      case 'due': return renderDueReport()
      case 'vacancy': return renderVacancyReport()
      case 'occupancy': return renderOccupancyReport()
      case 'tenant_ledger': return renderTenantLedger()
      case 'payment_report': return renderPaymentReport()
      case 'stock_report': return <StockReport selectedPropertyId={selectedPropertyId || currentHostelId || ''} />
      case 'consumption_report': return <ConsumptionReport selectedPropertyId={selectedPropertyId || currentHostelId || ''} />
      case 'waste_report': return <WasteReport selectedPropertyId={selectedPropertyId || currentHostelId || ''} />
      case 'kitchen_cost': return <KitchenCostReport selectedPropertyId={selectedPropertyId || currentHostelId || ''} />
      case 'asset_report': return <AssetReport selectedPropertyId={selectedPropertyId || currentHostelId || ''} />
      case 'low_stock': return <LowStockReport selectedPropertyId={selectedPropertyId || currentHostelId || ''} />
      case 'expiry_report': return <ExpiryReport selectedPropertyId={selectedPropertyId || currentHostelId || ''} />
      default: return null
    }
  }

  // ── Loading Skeleton ────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-4 w-96" />
        <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 17 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-[300px] rounded-lg" />
        <Skeleton className="h-[200px] rounded-lg" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="h-6 w-6 text-emerald-600" />
            Reports
          </h1>
          <p className="text-muted-foreground mt-1">Analyze your hostel business performance with detailed reports</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2" disabled>
            <FileSpreadsheet className="h-4 w-4" />
            Export Excel
          </Button>
          <Button variant="outline" size="sm" className="gap-2" disabled>
            <Download className="h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Report Type Selector */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9">
        {REPORT_TYPES.map((rt) => (
          <button
            key={rt.key}
            onClick={() => setSelectedReport(rt.key)}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all text-center ${
              selectedReport === rt.key
                ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm'
                : 'border-gray-200 bg-white text-gray-600 hover:border-emerald-300 hover:bg-emerald-50/50'
            }`}
          >
            {rt.icon}
            <span className="text-xs font-medium">{rt.label}</span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Filter className="h-4 w-4 text-emerald-600" />
              Filters
            </div>
            <div className="flex-1 min-w-[160px]">
              <Label className="text-xs text-muted-foreground">Property</Label>
              <Select value={filterProperty} onValueChange={setFilterProperty}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="All Properties" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Properties</SelectItem>
                  {properties.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-[140px]">
              <Label className="text-xs text-muted-foreground">Month</Label>
              <Select value={filterMonth} onValueChange={setFilterMonth}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-[100px]">
              <Label className="text-xs text-muted-foreground">Year</Label>
              <Select value={filterYear} onValueChange={setFilterYear}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2025">2025</SelectItem>
                  <SelectItem value="2026">2026</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {selectedReport === 'tenant_ledger' && (
              <div className="min-w-[200px]">
                <Label className="text-xs text-muted-foreground">Tenant</Label>
                <Select value={filterTenantId} onValueChange={setFilterTenantId}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select Tenant" />
                  </SelectTrigger>
                  <SelectContent>
                    {tenants.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Report Content */}
      {reportLoading ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-[300px] rounded-lg" />
          <Skeleton className="h-[200px] rounded-lg" />
        </div>
      ) : (
        renderReportContent()
      )}
    </div>
  )
}
