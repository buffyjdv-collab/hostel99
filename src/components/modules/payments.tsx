'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useAppStore, hasPermission } from '@/lib/store'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
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
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import {
  IndianRupee,
  Clock,
  AlertTriangle,
  TrendingUp,
  Plus,
  Search,
  Eye,
  MoreVertical,
  Loader2,
  CreditCard,
  Building2,
  Receipt,
  Send,
  CheckCircle2,
  Wallet,
  Smartphone,
  Landmark,
  Banknote,
  QrCode,
  Filter,
  ArrowUpDown,
  FileText,
  XCircle,
  CircleDot,
  Trash2,
  Pencil,
} from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────────

type PaymentStatus = 'paid' | 'pending' | 'overdue' | 'failed'
type PaymentMethod = 'upi' | 'bank_transfer' | 'card' | 'wallet' | 'cash' | 'qr'

interface TenantInfo {
  id: string
  name: string
  phone?: string
  room?: { id: string; name: string; number: string } | null
  bed?: { id: string; name: string } | null
}

interface PaymentData {
  id: string
  tenantId: string
  tenant: TenantInfo
  propertyId: string
  property?: { id: string; name: string; address?: string }
  amount: number
  rentAmount: number
  electricity: number
  water: number
  wifi: number
  food: number
  laundry: number
  parking: number
  otherCharges: number
  lateFine: number
  discount: number
  advanceAdjust: number
  paymentMethod: PaymentMethod
  paymentType: string
  status: PaymentStatus
  dueDate: string
  paidDate?: string | null
  receiptNumber?: string | null
  utrNumber?: string | null
  notes?: string | null
  month: number
  year: number
  createdAt: string
  updatedAt: string
}

interface PropertyInfo {
  id: string
  name: string
}

interface RecordPaymentFormData {
  tenantId: string
  propertyId: string
  month: string
  year: string
  rentAmount: string
  electricity: string
  water: string
  wifi: string
  food: string
  laundry: string
  parking: string
  otherCharges: string
  lateFine: string
  discount: string
  advanceAdjust: string
  paymentMethod: PaymentMethod
  utrNumber: string
  notes: string
}

// ── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<PaymentStatus, { label: string; bgClass: string; textClass: string; dotClass: string }> = {
  paid: { label: 'Paid', bgClass: 'bg-emerald-100 dark:bg-emerald-950/50', textClass: 'text-emerald-700 dark:text-emerald-300', dotClass: 'bg-emerald-500' },
  pending: { label: 'Pending', bgClass: 'bg-amber-100 dark:bg-amber-950/50', textClass: 'text-amber-700 dark:text-amber-300', dotClass: 'bg-amber-500' },
  overdue: { label: 'Overdue', bgClass: 'bg-red-100 dark:bg-red-950/50', textClass: 'text-red-700 dark:text-red-300', dotClass: 'bg-red-500' },
  failed: { label: 'Failed', bgClass: 'bg-gray-100 dark:bg-gray-950/50', textClass: 'text-gray-700 dark:text-gray-300', dotClass: 'bg-gray-500' },
}

const METHOD_CONFIG: Record<PaymentMethod, { label: string; icon: typeof CreditCard }> = {
  upi: { label: 'UPI', icon: Smartphone },
  bank_transfer: { label: 'Bank Transfer', icon: Landmark },
  card: { label: 'Card', icon: CreditCard },
  wallet: { label: 'Wallet', icon: Wallet },
  cash: { label: 'Cash', icon: Banknote },
  qr: { label: 'QR', icon: QrCode },
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const COLLECTION_CHART_CONFIG: ChartConfig = {
  collected: { label: 'Collected', color: '#10b981' },
  pending: { label: 'Pending', color: '#f59e0b' },
  overdue: { label: 'Overdue', color: '#ef4444' },
}

const STATUS_PIE_CONFIG: ChartConfig = {
  paid: { label: 'Paid', color: '#10b981' },
  pending: { label: 'Pending', color: '#f59e0b' },
  overdue: { label: 'Overdue', color: '#ef4444' },
  failed: { label: 'Failed', color: '#9ca3af' },
}

const STATUS_PIE_COLORS: Record<PaymentStatus, string> = {
  paid: '#10b981',
  pending: '#f59e0b',
  overdue: '#ef4444',
  failed: '#9ca3af',
}

const EMPTY_FORM: RecordPaymentFormData = {
  tenantId: '',
  propertyId: '',
  month: String(new Date().getMonth() + 1),
  year: String(new Date().getFullYear()),
  rentAmount: '',
  electricity: '',
  water: '',
  wifi: '',
  food: '',
  laundry: '',
  parking: '',
  otherCharges: '',
  lateFine: '',
  discount: '',
  advanceAdjust: '',
  paymentMethod: 'upi',
  utrNumber: '',
  notes: '',
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

function parseNum(val: string): number {
  const n = parseFloat(val)
  return isNaN(n) ? 0 : n
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
}

function StatsCard({ title, value, icon: Icon, iconBg = 'bg-emerald-50 dark:bg-emerald-950/50', iconColor = 'text-emerald-600 dark:text-emerald-400', subtitle }: StatsCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground font-medium">{title}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${iconBg}`}>
            <Icon className={`w-5 h-5 ${iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ── Payment Receipt Dialog ───────────────────────────────────────────────────

function PaymentReceiptDialog({
  payment,
  open,
  onClose,
}: {
  payment: PaymentData | null
  open: boolean
  onClose: () => void
}) {
  if (!payment) return null

  const total = payment.rentAmount + payment.electricity + payment.water + payment.wifi +
    payment.food + payment.laundry + payment.parking + payment.otherCharges +
    payment.lateFine - payment.discount - payment.advanceAdjust

  const statusCfg = STATUS_CONFIG[payment.status]
  const methodCfg = METHOD_CONFIG[payment.paymentMethod]

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-600" />
            Payment Receipt
          </DialogTitle>
          <DialogDescription>
            Receipt #{payment.receiptNumber || payment.id.slice(-8).toUpperCase()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg">
            <div>
              <p className="font-semibold text-emerald-900 dark:text-emerald-100">{payment.tenant.name}</p>
              <p className="text-sm text-emerald-700 dark:text-emerald-300">
                {payment.tenant.room ? `Room ${payment.tenant.room.number}` : 'No room assigned'}
              </p>
            </div>
            <Badge variant="secondary" className={`${statusCfg.bgClass} ${statusCfg.textClass}`}>
              <div className={`h-1.5 w-1.5 rounded-full ${statusCfg.dotClass} mr-1`} />
              {statusCfg.label}
            </Badge>
          </div>

          {/* Period */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Period</span>
              <span className="font-medium">{MONTH_NAMES[payment.month - 1]} {payment.year}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Method</span>
              <span className="font-medium flex items-center gap-1">
                <methodCfg.icon className="w-3.5 h-3.5" />
                {methodCfg.label}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Due Date</span>
              <span className="font-medium">{formatDate(payment.dueDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Paid Date</span>
              <span className="font-medium">{formatDate(payment.paidDate)}</span>
            </div>
          </div>

          {/* Breakdown */}
          <div className="border rounded-lg p-3 space-y-1.5 text-sm">
            <p className="font-medium text-xs text-muted-foreground uppercase tracking-wider mb-2">Charges Breakdown</p>
            {[
              { label: 'Rent', value: payment.rentAmount },
              { label: 'Electricity', value: payment.electricity },
              { label: 'Water', value: payment.water },
              { label: 'WiFi', value: payment.wifi },
              { label: 'Food', value: payment.food },
              { label: 'Laundry', value: payment.laundry },
              { label: 'Parking', value: payment.parking },
              { label: 'Other Charges', value: payment.otherCharges },
              { label: 'Late Fine', value: payment.lateFine },
            ].filter(item => item.value > 0).map(item => (
              <div key={item.label} className="flex justify-between">
                <span className="text-muted-foreground">{item.label}</span>
                <span>{formatCurrency(item.value)}</span>
              </div>
            ))}
            {payment.discount > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                <span>Discount</span>
                <span>-{formatCurrency(payment.discount)}</span>
              </div>
            )}
            {payment.advanceAdjust > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                <span>Advance Adjustment</span>
                <span>-{formatCurrency(payment.advanceAdjust)}</span>
              </div>
            )}
            <div className="border-t pt-1.5 mt-1.5 flex justify-between font-bold">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>

          {payment.utrNumber && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">UTR Number</span>
              <span className="font-mono text-xs">{payment.utrNumber}</span>
            </div>
          )}

          {payment.notes && (
            <div className="text-sm">
              <span className="text-muted-foreground">Notes:</span>
              <p className="mt-0.5 text-muted-foreground">{payment.notes}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Mark as Paid Confirmation Dialog ─────────────────────────────────────────

function MarkAsPaidDialog({
  open,
  onClose,
  onConfirm,
  payment,
  loading,
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  payment: PaymentData | null
  loading: boolean
}) {
  if (!payment) return null

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            Mark Payment as Paid
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to mark this payment as paid?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tenant</span>
            <span className="font-medium">{payment.tenant.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Period</span>
            <span className="font-medium">{MONTH_NAMES[payment.month - 1]} {payment.year}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Amount</span>
            <span className="font-bold">{formatCurrency(payment.amount)}</span>
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Mark as Paid
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// ── Record Payment Dialog ────────────────────────────────────────────────────

function RecordPaymentDialog({
  open,
  onClose,
  tenants,
  properties,
  onSubmit,
  loading,
}: {
  open: boolean
  onClose: () => void
  tenants: { id: string; name: string }[]
  properties: PropertyInfo[]
  onSubmit: (data: RecordPaymentFormData) => void
  loading: boolean
}) {
  const [form, setForm] = useState<RecordPaymentFormData>({ ...EMPTY_FORM })
  const resetForm = () => setForm({ ...EMPTY_FORM })

  const computedTotal = useMemo(() => {
    const rent = parseNum(form.rentAmount)
    const elec = parseNum(form.electricity)
    const wat = parseNum(form.water)
    const wifi = parseNum(form.wifi)
    const food = parseNum(form.food)
    const laun = parseNum(form.laundry)
    const park = parseNum(form.parking)
    const other = parseNum(form.otherCharges)
    const fine = parseNum(form.lateFine)
    const disc = parseNum(form.discount)
    const adv = parseNum(form.advanceAdjust)
    return rent + elec + wat + wifi + food + laun + park + other + fine - disc - adv
  }, [form])

  const handleField = (field: keyof RecordPaymentFormData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = () => {
    onSubmit({ ...form, amount: String(computedTotal) })
  }

  const isValid = form.tenantId && form.propertyId && form.month && form.year && computedTotal > 0

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-600" />
            Record Payment
          </DialogTitle>
          <DialogDescription>
            Record a new rent payment with charges breakdown
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Tenant & Property */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tenant *</Label>
              <Select value={form.tenantId} onValueChange={v => handleField('tenantId', v)}>
                <SelectTrigger><SelectValue placeholder="Select tenant" /></SelectTrigger>
                <SelectContent>
                  {tenants.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Property *</Label>
              <Select value={form.propertyId} onValueChange={v => handleField('propertyId', v)}>
                <SelectTrigger><SelectValue placeholder="Select property" /></SelectTrigger>
                <SelectContent>
                  {properties.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Month & Year */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Month *</Label>
              <Select value={form.month} onValueChange={v => handleField('month', v)}>
                <SelectTrigger><SelectValue placeholder="Select month" /></SelectTrigger>
                <SelectContent>
                  {MONTH_NAMES.map((m, i) => (
                    <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Year *</Label>
              <Select value={form.year} onValueChange={v => handleField('year', v)}>
                <SelectTrigger><SelectValue placeholder="Select year" /></SelectTrigger>
                <SelectContent>
                  {[2024, 2025, 2026].map(y => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Charges Breakdown */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Charges Breakdown</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Rent Amount</Label>
                <Input type="number" placeholder="0" value={form.rentAmount} onChange={e => handleField('rentAmount', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Electricity</Label>
                <Input type="number" placeholder="0" value={form.electricity} onChange={e => handleField('electricity', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Water</Label>
                <Input type="number" placeholder="0" value={form.water} onChange={e => handleField('water', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">WiFi</Label>
                <Input type="number" placeholder="0" value={form.wifi} onChange={e => handleField('wifi', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Food</Label>
                <Input type="number" placeholder="0" value={form.food} onChange={e => handleField('food', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Laundry</Label>
                <Input type="number" placeholder="0" value={form.laundry} onChange={e => handleField('laundry', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Parking</Label>
                <Input type="number" placeholder="0" value={form.parking} onChange={e => handleField('parking', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Other Charges</Label>
                <Input type="number" placeholder="0" value={form.otherCharges} onChange={e => handleField('otherCharges', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Adjustments */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Adjustments</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Late Fine</Label>
                <Input type="number" placeholder="0" value={form.lateFine} onChange={e => handleField('lateFine', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Discount</Label>
                <Input type="number" placeholder="0" value={form.discount} onChange={e => handleField('discount', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Advance Adjustment</Label>
                <Input type="number" placeholder="0" value={form.advanceAdjust} onChange={e => handleField('advanceAdjust', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Total */}
          <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-lg p-3 flex items-center justify-between">
            <span className="font-medium text-emerald-900 dark:text-emerald-100">Total Amount</span>
            <span className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{formatCurrency(computedTotal)}</span>
          </div>

          {/* Payment Method & UTR */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select value={form.paymentMethod} onValueChange={v => handleField('paymentMethod', v as PaymentMethod)}>
                <SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger>
                <SelectContent>
                  {Object.entries(METHOD_CONFIG).map(([key, cfg]) => (
                    <SelectItem key={key} value={key}>
                      <span className="flex items-center gap-2">
                        <cfg.icon className="w-3.5 h-3.5" />
                        {cfg.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {(form.paymentMethod === 'bank_transfer' || form.paymentMethod === 'upi') && (
              <div className="space-y-1.5">
                <Label className="text-xs">UTR Number</Label>
                <Input placeholder="Enter UTR number" value={form.utrNumber} onChange={e => handleField('utrNumber', e.target.value)} />
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea placeholder="Add any notes..." value={form.notes} onChange={e => handleField('notes', e.target.value)} rows={2} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!isValid || loading} className="bg-emerald-600 hover:bg-emerald-700">
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Record Payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Main Component ───────────────────────────────────────────────────────────

export function PaymentsPage() {
  const { currentUser, currentHostelId } = useAppStore()
  const role = currentUser?.role || ''
  const canCreate = hasPermission(role, 'payments:create')
  const canUpdate = hasPermission(role, 'payments:update')
  const canDelete = hasPermission(role, 'payments:delete')

  // Data
  const [payments, setPayments] = useState<PaymentData[]>([])
  const [properties, setProperties] = useState<PropertyInfo[]>([])
  const [tenants, setTenants] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [monthFilter, setMonthFilter] = useState<string>('all')
  const [yearFilter, setYearFilter] = useState<string>('all')
  const [propertyFilter, setPropertyFilter] = useState<string>('all')
  const [methodFilter, setMethodFilter] = useState<string>('all')

  // Dialogs
  const [showRecordDialog, setShowRecordDialog] = useState(false)
  const [showReceiptDialog, setShowReceiptDialog] = useState(false)
  const [showMarkPaidDialog, setShowMarkPaidDialog] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<PaymentData | null>(null)

  // ── Fetch Data ─────────────────────────────────────────────────────────────

  const fetchPayments = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (monthFilter !== 'all') params.set('month', monthFilter)
      if (yearFilter !== 'all') params.set('year', yearFilter)
      if (propertyFilter !== 'all') params.set('propertyId', propertyFilter)
      if (currentHostelId && !params.has('propertyId')) params.set('propertyId', currentHostelId)
      const res = await fetch(`/api/payments?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setPayments(data)
      }
    } catch (err) {
      console.error('Failed to fetch payments:', err)
    }
  }, [statusFilter, monthFilter, yearFilter, propertyFilter, currentHostelId])

  useEffect(() => {
    fetchPayments().finally(() => setLoading(false))
  }, [fetchPayments])

  useEffect(() => {
    async function fetchSupport() {
      try {
        const [propRes, tenantRes] = await Promise.all([
          fetch('/api/properties' + (currentHostelId ? `?propertyId=${currentHostelId}` : '')),
          fetch('/api/tenants' + (currentHostelId ? `?propertyId=${currentHostelId}` : '')),
        ])
        if (propRes.ok) setProperties(await propRes.json())
        if (tenantRes.ok) {
          const data = await tenantRes.json()
          setTenants(data.map((t: { id: string; name: string }) => ({ id: t.id, name: t.name })))
        }
      } catch (err) {
        console.error('Failed to fetch support data:', err)
      }
    }
    fetchSupport()
  }, [])

  // ── Computed Stats ─────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()

    const thisMonthPayments = payments.filter(p => p.month === currentMonth && p.year === currentYear)
    const collected = thisMonthPayments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0)
    const pending = thisMonthPayments.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0)
    const overdue = thisMonthPayments.filter(p => p.status === 'overdue').reduce((s, p) => s + p.amount, 0)
    const totalExpected = collected + pending + overdue
    const collectionRate = totalExpected > 0 ? Math.round((collected / totalExpected) * 100) : 0

    return { collected, pending, overdue, collectionRate }
  }, [payments])

  // ── Chart Data ─────────────────────────────────────────────────────────────

  const monthlyCollectionData = useMemo(() => {
    const currentYear = new Date().getFullYear()
    const monthMap: Record<number, { collected: number; pending: number; overdue: number }> = {}

    for (let i = 1; i <= 12; i++) {
      monthMap[i] = { collected: 0, pending: 0, overdue: 0 }
    }

    payments
      .filter(p => p.year === currentYear)
      .forEach(p => {
        if (p.status === 'paid') monthMap[p.month].collected += p.amount
        else if (p.status === 'pending') monthMap[p.month].pending += p.amount
        else if (p.status === 'overdue') monthMap[p.month].overdue += p.amount
      })

    return Object.entries(monthMap).map(([month, data]) => ({
      month: MONTH_SHORT[parseInt(month) - 1],
      ...data,
    }))
  }, [payments])

  const statusBreakdownData = useMemo(() => {
    const counts: Record<PaymentStatus, number> = { paid: 0, pending: 0, overdue: 0, failed: 0 }
    payments.forEach(p => {
      if (counts[p.status] !== undefined) counts[p.status]++
    })
    return Object.entries(counts)
      .filter(([, count]) => count > 0)
      .map(([status, count]) => ({ status, count, fill: STATUS_PIE_COLORS[status as PaymentStatus] }))
  }, [payments])

  // ── Filtered Payments ──────────────────────────────────────────────────────

  const filteredPayments = useMemo(() => {
    let result = payments

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(p => p.tenant.name.toLowerCase().includes(q))
    }
    if (methodFilter !== 'all') {
      result = result.filter(p => p.paymentMethod === methodFilter)
    }

    return result
  }, [payments, searchQuery, methodFilter])

  // ── Actions ────────────────────────────────────────────────────────────────

  const handleRecordPayment = async (formData: RecordPaymentFormData) => {
    setActionLoading(true)
    try {
      const total = parseNum(formData.rentAmount) + parseNum(formData.electricity) + parseNum(formData.water) +
        parseNum(formData.wifi) + parseNum(formData.food) + parseNum(formData.laundry) + parseNum(formData.parking) +
        parseNum(formData.otherCharges) + parseNum(formData.lateFine) - parseNum(formData.discount) - parseNum(formData.advanceAdjust)

      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: formData.tenantId,
          propertyId: formData.propertyId,
          amount: total,
          rentAmount: parseNum(formData.rentAmount),
          electricity: parseNum(formData.electricity),
          water: parseNum(formData.water),
          wifi: parseNum(formData.wifi),
          food: parseNum(formData.food),
          laundry: parseNum(formData.laundry),
          parking: parseNum(formData.parking),
          otherCharges: parseNum(formData.otherCharges),
          lateFine: parseNum(formData.lateFine),
          discount: parseNum(formData.discount),
          advanceAdjust: parseNum(formData.advanceAdjust),
          paymentMethod: formData.paymentMethod,
          utrNumber: formData.utrNumber,
          notes: formData.notes,
          month: formData.month,
          year: formData.year,
          status: 'pending',
          dueDate: new Date(parseInt(formData.year), parseInt(formData.month), 5).toISOString(),
        }),
      })

      if (res.ok) {
        setShowRecordDialog(false)
        await fetchPayments()
      }
    } catch (err) {
      console.error('Failed to record payment:', err)
    } finally {
      setActionLoading(false)
    }
  }

  const handleMarkAsPaid = async () => {
    if (!selectedPayment) return
    setActionLoading(true)
    try {
      const res = await fetch('/api/payments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedPayment.id,
          status: 'paid',
          paidDate: new Date().toISOString(),
        }),
      })
      if (res.ok) {
        setShowMarkPaidDialog(false)
        setSelectedPayment(null)
        await fetchPayments()
      }
    } catch (err) {
      console.error('Failed to mark as paid:', err)
    } finally {
      setActionLoading(false)
    }
  }

  const handleSendReminder = async (payment: PaymentData) => {
    try {
      // In a real app, this would call an API to send a notification
      alert(`Payment reminder sent to ${payment.tenant.name} for ${MONTH_NAMES[payment.month - 1]} ${payment.year}`)
    } catch (err) {
      console.error('Failed to send reminder:', err)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this payment?')) return
    try {
      const res = await fetch(`/api/payments/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setPayments((prev) => prev.filter((p) => p.id !== id))
      }
    } catch (error) {
      console.error('Failed to delete payment:', error)
    }
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
            Payments &amp; Rent
          </h1>
          <p className="text-muted-foreground mt-1">Track rent collections, dues, and payment history</p>
        </div>
        {canCreate && (
        <Button onClick={() => setShowRecordDialog(true)} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4 mr-2" />
          Record Payment
        </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Collected"
          value={formatCurrency(stats.collected)}
          icon={IndianRupee}
          iconBg="bg-emerald-50 dark:bg-emerald-950/50"
          iconColor="text-emerald-600 dark:text-emerald-400"
          subtitle="This month"
        />
        <StatsCard
          title="Pending Payments"
          value={formatCurrency(stats.pending)}
          icon={Clock}
          iconBg="bg-amber-50 dark:bg-amber-950/50"
          iconColor="text-amber-600 dark:text-amber-400"
        />
        <StatsCard
          title="Overdue"
          value={formatCurrency(stats.overdue)}
          icon={AlertTriangle}
          iconBg="bg-red-50 dark:bg-red-950/50"
          iconColor="text-red-600 dark:text-red-400"
        />
        <StatsCard
          title="Collection Rate"
          value={`${stats.collectionRate}%`}
          icon={TrendingUp}
          iconBg="bg-teal-50 dark:bg-teal-950/50"
          iconColor="text-teal-600 dark:text-teal-400"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Monthly Collection Bar Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Monthly Collection</CardTitle>
            <CardDescription>Revenue breakdown by month</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={COLLECTION_CHART_CONFIG} className="h-64 w-full">
              <BarChart data={monthlyCollectionData} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="collected" fill="var(--color-collected)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="pending" fill="var(--color-pending)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="overdue" fill="var(--color-overdue)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Payment Status Pie Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Payment Status</CardTitle>
            <CardDescription>Status breakdown of all payments</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={STATUS_PIE_CONFIG} className="h-64 w-full">
              <PieChart>
                <Pie
                  data={statusBreakdownData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="count"
                  nameKey="status"
                >
                  {statusBreakdownData.map((entry, index) => (
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
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={monthFilter} onValueChange={setMonthFilter}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Month" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Months</SelectItem>
                {MONTH_NAMES.map((m, i) => (
                  <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger className="w-28"><SelectValue placeholder="Year" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {[2024, 2025, 2026].map(y => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
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
            <Select value={methodFilter} onValueChange={setMethodFilter}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Method" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                {Object.entries(METHOD_CONFIG).map(([key, cfg]) => (
                  <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Payment Table */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-40">Tenant</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Month/Year</TableHead>
                  <TableHead className="text-right">Rent</TableHead>
                  <TableHead className="text-right">Electricity</TableHead>
                  <TableHead className="text-right">Water</TableHead>
                  <TableHead className="text-right">WiFi</TableHead>
                  <TableHead className="text-right">Food</TableHead>
                  <TableHead className="text-right">Late Fine</TableHead>
                  <TableHead className="text-right font-semibold">Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Paid Date</TableHead>
                  <TableHead className="w-12">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={15} className="text-center py-12 text-muted-foreground">
                      <FileText className="w-10 h-10 mx-auto mb-2 opacity-40" />
                      <p>No payments found</p>
                      <p className="text-xs">Try adjusting your filters or record a new payment</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPayments.map(payment => {
                    const statusCfg = STATUS_CONFIG[payment.status]
                    const methodCfg = METHOD_CONFIG[payment.paymentMethod]
                    const total = payment.rentAmount + payment.electricity + payment.water +
                      payment.wifi + payment.food + payment.laundry + payment.parking +
                      payment.otherCharges + payment.lateFine - payment.discount - payment.advanceAdjust

                    return (
                      <TableRow key={payment.id} className="group hover:bg-muted/50">
                        <TableCell className="font-medium">{payment.tenant.name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {payment.tenant.room ? `Room ${payment.tenant.room.number}` : '—'}
                        </TableCell>
                        <TableCell>{MONTH_SHORT[payment.month - 1]} {payment.year}</TableCell>
                        <TableCell className="text-right">{formatCurrency(payment.rentAmount)}</TableCell>
                        <TableCell className="text-right">{payment.electricity > 0 ? formatCurrency(payment.electricity) : '—'}</TableCell>
                        <TableCell className="text-right">{payment.water > 0 ? formatCurrency(payment.water) : '—'}</TableCell>
                        <TableCell className="text-right">{payment.wifi > 0 ? formatCurrency(payment.wifi) : '—'}</TableCell>
                        <TableCell className="text-right">{payment.food > 0 ? formatCurrency(payment.food) : '—'}</TableCell>
                        <TableCell className="text-right">{payment.lateFine > 0 ? formatCurrency(payment.lateFine) : '—'}</TableCell>
                        <TableCell className="text-right font-semibold">{formatCurrency(total)}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={`${statusCfg.bgClass} ${statusCfg.textClass} text-xs`}>
                            <div className={`h-1.5 w-1.5 rounded-full ${statusCfg.dotClass} mr-1`} />
                            {statusCfg.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="flex items-center gap-1 text-xs">
                            <methodCfg.icon className="w-3.5 h-3.5 text-muted-foreground" />
                            {methodCfg.label}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs">{formatDate(payment.dueDate)}</TableCell>
                        <TableCell className="text-xs">{formatDate(payment.paidDate)}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => { setSelectedPayment(payment); setShowReceiptDialog(true) }}>
                                <Eye className="w-4 h-4 mr-2" /> View Receipt
                              </DropdownMenuItem>
                              {payment.status !== 'paid' && (
                                <DropdownMenuItem onClick={() => { setSelectedPayment(payment); setShowMarkPaidDialog(true) }}>
                                  <CheckCircle2 className="w-4 h-4 mr-2" /> Mark as Paid
                                </DropdownMenuItem>
                              )}
                              {(payment.status === 'pending' || payment.status === 'overdue') && (
                                <DropdownMenuItem onClick={() => handleSendReminder(payment)}>
                                  <Send className="w-4 h-4 mr-2" /> Send Reminder
                                </DropdownMenuItem>
                              )}
                              {canUpdate && (
                                <DropdownMenuItem onClick={() => { setSelectedPayment(payment); setShowMarkPaidDialog(true) }}>
                                  <Pencil className="w-4 h-4 mr-2" /> Edit
                                </DropdownMenuItem>
                              )}
                              {canDelete && (
                                <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(payment.id)}>
                                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <RecordPaymentDialog
        open={showRecordDialog}
        onClose={() => setShowRecordDialog(false)}
        tenants={tenants}
        properties={properties}
        onSubmit={handleRecordPayment}
        loading={actionLoading}
      />

      <PaymentReceiptDialog
        payment={selectedPayment}
        open={showReceiptDialog}
        onClose={() => { setShowReceiptDialog(false); setSelectedPayment(null) }}
      />

      <MarkAsPaidDialog
        open={showMarkPaidDialog}
        onClose={() => { setShowMarkPaidDialog(false); setSelectedPayment(null) }}
        onConfirm={handleMarkAsPaid}
        payment={selectedPayment}
        loading={actionLoading}
      />
    </div>
  )
}
