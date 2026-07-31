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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
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
  Package,
  AlertTriangle,
  IndianRupee,
  Clock,
  Plus,
  Search,
  MoreVertical,
  Loader2,
  ArrowUpDown,
  Edit3,
  ArrowLeftRight,
  History,
  TrendingUp,
  TrendingDown,
  RotateCcw,
  Trash2,
  AlertCircle,
  ShoppingCart,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Tag,
  Warehouse,
  FileText,
} from 'lucide-react'
import { format } from 'date-fns'
import { useToast } from '@/hooks/use-toast'

// ── Types ────────────────────────────────────────────────────────────────────

interface InventoryCategory {
  id: string
  name: string
  slug: string
  _count: { items: number }
}

interface InventoryItem {
  id: string
  name: string
  sku: string | null
  categoryId: string
  category: { id: string; name: string; slug: string }
  unit: string
  unitPrice: number
  currentStock: number
  minStock: number
  maxStock: number | null
  reorderLevel: number | null
  batchNumber: string | null
  expiryDate: string | null
  storeLocation: string | null
  gstRate: number
  hsnCode: string | null
  isActive: boolean
  propertyId: string
  property: { id: string; name: string }
  createdAt: string
  updatedAt: string
}

interface StockTransaction {
  id: string
  itemId: string
  type: string
  quantity: number
  previousStock: number
  newStock: number
  unitPrice: number | null
  notes: string | null
  performedById: string | null
  performedBy: { id: string; name: string } | null
  createdAt: string
}

interface InventoryStats {
  totalItems: number
  lowStockCount: number
  totalValue: number
  expiringSoon: number
}

interface InventoryFormData {
  name: string
  sku: string
  categoryId: string
  unit: string
  unitPrice: string
  currentStock: string
  minStock: string
  maxStock: string
  reorderLevel: string
  batchNumber: string
  expiryDate: string
  storeLocation: string
  gstRate: string
  hsnCode: string
}

interface StockAdjustFormData {
  type: string
  quantity: string
  notes: string
}

// ── Constants ────────────────────────────────────────────────────────────────

const UNIT_OPTIONS = [
  { value: 'kg', label: 'Kilogram (kg)' },
  { value: 'g', label: 'Gram (g)' },
  { value: 'l', label: 'Litre (l)' },
  { value: 'ml', label: 'Millilitre (ml)' },
  { value: 'pcs', label: 'Pieces (pcs)' },
  { value: 'pack', label: 'Pack' },
  { value: 'box', label: 'Box' },
  { value: 'bottle', label: 'Bottle' },
  { value: 'can', label: 'Can' },
  { value: 'cylinder', label: 'Cylinder' },
  { value: 'roll', label: 'Roll' },
  { value: 'sheet', label: 'Sheet' },
  { value: 'm', label: 'Metre (m)' },
  { value: 'set', label: 'Set' },
]

const ADJUSTMENT_TYPES: Record<string, { label: string; icon: React.ElementType; color: string; sign: '+' | '-' }> = {
  purchase: { label: 'Purchase (In)', icon: ShoppingCart, color: 'text-emerald-600', sign: '+' },
  issue: { label: 'Issue (Out)', icon: ArrowRight, color: 'text-orange-600', sign: '-' },
  adjustment: { label: 'Adjustment', icon: ArrowUpDown, color: 'text-blue-600', sign: '+' },
  damage: { label: 'Damage (Out)', icon: Trash2, color: 'text-red-600', sign: '-' },
  expiry: { label: 'Expiry (Out)', icon: Clock, color: 'text-amber-600', sign: '-' },
  return: { label: 'Return (In)', icon: RotateCcw, color: 'text-teal-600', sign: '+' },
}

const TRANSACTION_TYPE_CONFIG: Record<string, { label: string; bgClass: string; textClass: string; icon: React.ElementType }> = {
  purchase: { label: 'Purchase', bgClass: 'bg-emerald-100 dark:bg-emerald-950/50', textClass: 'text-emerald-700 dark:text-emerald-300', icon: ShoppingCart },
  issue: { label: 'Issue', bgClass: 'bg-orange-100 dark:bg-orange-950/50', textClass: 'text-orange-700 dark:text-orange-300', icon: ArrowRight },
  adjustment: { label: 'Adjustment', bgClass: 'bg-blue-100 dark:bg-blue-950/50', textClass: 'text-blue-700 dark:text-blue-300', icon: ArrowUpDown },
  transfer_in: { label: 'Transfer In', bgClass: 'bg-teal-100 dark:bg-teal-950/50', textClass: 'text-teal-700 dark:text-teal-300', icon: ArrowLeftRight },
  transfer_out: { label: 'Transfer Out', bgClass: 'bg-purple-100 dark:bg-purple-950/50', textClass: 'text-purple-700 dark:text-purple-300', icon: ArrowLeftRight },
  return: { label: 'Return', bgClass: 'bg-cyan-100 dark:bg-cyan-950/50', textClass: 'text-cyan-700 dark:text-cyan-300', icon: RotateCcw },
  damage: { label: 'Damage', bgClass: 'bg-red-100 dark:bg-red-950/50', textClass: 'text-red-700 dark:text-red-300', icon: Trash2 },
  expiry: { label: 'Expiry', bgClass: 'bg-amber-100 dark:bg-amber-950/50', textClass: 'text-amber-700 dark:text-amber-300', icon: Clock },
  opening: { label: 'Opening Stock', bgClass: 'bg-slate-100 dark:bg-slate-950/50', textClass: 'text-slate-700 dark:text-slate-300', icon: Package },
  closing: { label: 'Closing Stock', bgClass: 'bg-slate-100 dark:bg-slate-950/50', textClass: 'text-slate-700 dark:text-slate-300', icon: Package },
}

const EMPTY_FORM: InventoryFormData = {
  name: '',
  sku: '',
  categoryId: '',
  unit: 'pcs',
  unitPrice: '',
  currentStock: '',
  minStock: '',
  maxStock: '',
  reorderLevel: '',
  batchNumber: '',
  expiryDate: '',
  storeLocation: '',
  gstRate: '',
  hsnCode: '',
}

const EMPTY_ADJUST_FORM: StockAdjustFormData = {
  type: 'purchase',
  quantity: '',
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
  try {
    return format(new Date(dateStr), 'dd MMM yyyy')
  } catch {
    return '—'
  }
}

function formatDateTime(dateStr?: string | null): string {
  if (!dateStr) return '—'
  try {
    return format(new Date(dateStr), 'dd MMM yyyy, hh:mm a')
  } catch {
    return '—'
  }
}

function getStockStatus(current: number, min: number): { label: string; color: string; bgClass: string; textClass: string } {
  if (current <= 0) {
    return { label: 'Out of Stock', color: 'bg-red-500', bgClass: 'bg-red-100 dark:bg-red-950/50', textClass: 'text-red-700 dark:text-red-300' }
  }
  if (current <= min) {
    return { label: 'Low Stock', color: 'bg-red-500', bgClass: 'bg-red-100 dark:bg-red-950/50', textClass: 'text-red-700 dark:text-red-300' }
  }
  if (current <= min * 1.5) {
    return { label: 'Near Min', color: 'bg-amber-500', bgClass: 'bg-amber-100 dark:bg-amber-950/50', textClass: 'text-amber-700 dark:text-amber-300' }
  }
  return { label: 'In Stock', color: 'bg-emerald-500', bgClass: 'bg-emerald-100 dark:bg-emerald-950/50', textClass: 'text-emerald-700 dark:text-emerald-300' }
}

function isExpiringSoon(expiryDate: string | null): boolean {
  if (!expiryDate) return false
  const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  return new Date(expiryDate) <= sevenDaysFromNow
}

function isExpired(expiryDate: string | null): boolean {
  if (!expiryDate) return false
  return new Date(expiryDate) < new Date()
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
  badge?: { label: string; variant: 'destructive' | 'default' | 'secondary' }
}

function StatsCard({ title, value, icon: Icon, iconBg = 'bg-emerald-50 dark:bg-emerald-950/50', iconColor = 'text-emerald-600 dark:text-emerald-400', subtitle, badge }: StatsCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground font-medium">{title}</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold tracking-tight">{value}</p>
              {badge && (
                <Badge variant={badge.variant} className="text-xs">{badge.label}</Badge>
              )}
            </div>
            {subtitle && <span className="text-xs text-muted-foreground">{subtitle}</span>}
          </div>
          <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${iconBg}`}>
            <Icon className={`w-5 h-5 ${iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ── Add Item Dialog ──────────────────────────────────────────────────────────

function AddItemDialog({
  open,
  onClose,
  categories,
  propertyId,
  onSubmit,
  submitting,
}: {
  open: boolean
  onClose: () => void
  categories: InventoryCategory[]
  propertyId: string | null
  onSubmit: (data: InventoryFormData) => Promise<void>
  submitting: boolean
}) {
  const [form, setForm] = useState<InventoryFormData>(EMPTY_FORM)

  const isValid = form.name.trim() && form.categoryId && form.unitPrice

  const handleSubmit = async () => {
    if (!isValid) return
    await onSubmit(form)
    setForm(EMPTY_FORM)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-emerald-600" />
            Add Inventory Item
          </DialogTitle>
          <DialogDescription>Create a new inventory item with stock details</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Basic Details */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
              <Package className="h-4 w-4 text-emerald-600" />
              Basic Details
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="item-name">Item Name *</Label>
                <Input
                  id="item-name"
                  placeholder="Enter item name"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="item-sku">SKU</Label>
                <Input
                  id="item-sku"
                  placeholder="e.g. SKU-001"
                  value={form.sku}
                  onChange={e => setForm(f => ({ ...f, sku: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="item-category">Category *</Label>
                <Select value={form.categoryId} onValueChange={v => setForm(f => ({ ...f, categoryId: v }))}>
                  <SelectTrigger id="item-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="item-unit">Unit *</Label>
                <Select value={form.unit} onValueChange={v => setForm(f => ({ ...f, unit: v }))}>
                  <SelectTrigger id="item-unit">
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {UNIT_OPTIONS.map(u => (
                      <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Stock & Pricing */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
              <IndianRupee className="h-4 w-4 text-emerald-600" />
              Stock &amp; Pricing
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="item-unitPrice">Unit Price (₹) *</Label>
                <Input
                  id="item-unitPrice"
                  type="number"
                  step="0.01"
                  placeholder="Enter unit price"
                  value={form.unitPrice}
                  onChange={e => setForm(f => ({ ...f, unitPrice: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="item-currentStock">Current Stock *</Label>
                <Input
                  id="item-currentStock"
                  type="number"
                  step="0.01"
                  placeholder="Enter current stock"
                  value={form.currentStock}
                  onChange={e => setForm(f => ({ ...f, currentStock: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="item-minStock">Min Stock Level</Label>
                <Input
                  id="item-minStock"
                  type="number"
                  step="0.01"
                  placeholder="Low stock alert threshold"
                  value={form.minStock}
                  onChange={e => setForm(f => ({ ...f, minStock: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="item-maxStock">Max Stock Level</Label>
                <Input
                  id="item-maxStock"
                  type="number"
                  step="0.01"
                  placeholder="Maximum stock capacity"
                  value={form.maxStock}
                  onChange={e => setForm(f => ({ ...f, maxStock: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="item-reorderLevel">Reorder Level</Label>
                <Input
                  id="item-reorderLevel"
                  type="number"
                  step="0.01"
                  placeholder="Auto reorder threshold"
                  value={form.reorderLevel}
                  onChange={e => setForm(f => ({ ...f, reorderLevel: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* Batch & Storage */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
              <Warehouse className="h-4 w-4 text-emerald-600" />
              Batch &amp; Storage
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="item-batchNumber">Batch Number</Label>
                <Input
                  id="item-batchNumber"
                  placeholder="e.g. BATCH-2024-001"
                  value={form.batchNumber}
                  onChange={e => setForm(f => ({ ...f, batchNumber: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="item-expiryDate">Expiry Date</Label>
                <Input
                  id="item-expiryDate"
                  type="date"
                  value={form.expiryDate}
                  onChange={e => setForm(f => ({ ...f, expiryDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="item-storeLocation">Store Location</Label>
                <Input
                  id="item-storeLocation"
                  placeholder="e.g. Store Room A, Shelf 3"
                  value={form.storeLocation}
                  onChange={e => setForm(f => ({ ...f, storeLocation: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* Tax Details */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4 text-emerald-600" />
              Tax Details
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="item-gstRate">GST Rate (%)</Label>
                <Input
                  id="item-gstRate"
                  type="number"
                  step="0.01"
                  placeholder="e.g. 18"
                  value={form.gstRate}
                  onChange={e => setForm(f => ({ ...f, gstRate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="item-hsnCode">HSN Code</Label>
                <Input
                  id="item-hsnCode"
                  placeholder="e.g. 1006"
                  value={form.hsnCode}
                  onChange={e => setForm(f => ({ ...f, hsnCode: e.target.value }))}
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={submitting || !isValid} className="bg-emerald-600 hover:bg-emerald-700">
            {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
            Add Item
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Stock Adjustment Dialog ──────────────────────────────────────────────────

function StockAdjustDialog({
  open,
  onClose,
  item,
  onSubmit,
  submitting,
}: {
  open: boolean
  onClose: () => void
  item: InventoryItem | null
  onSubmit: (data: StockAdjustFormData) => Promise<void>
  submitting: boolean
}) {
  const [form, setForm] = useState<StockAdjustFormData>(EMPTY_ADJUST_FORM)

  if (!item) return null

  const selectedType = ADJUSTMENT_TYPES[form.type]
  const quantity = parseFloat(form.quantity) || 0
  const newStock = selectedType?.sign === '+'
    ? item.currentStock + quantity
    : item.currentStock - quantity

  const isValid = form.type && form.quantity && parseFloat(form.quantity) > 0 && newStock >= 0

  const handleSubmit = async () => {
    if (!isValid) return
    await onSubmit(form)
    setForm(EMPTY_ADJUST_FORM)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowUpDown className="h-5 w-5 text-emerald-600" />
            Adjust Stock
          </DialogTitle>
          <DialogDescription>
            Adjust stock for <span className="font-semibold">{item.name}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Current Stock Info */}
          <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Current Stock</span>
              <span className="text-lg font-bold">{item.currentStock} {item.unit}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Adjustment Type *</Label>
            <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ADJUSTMENT_TYPES).map(([key, cfg]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <cfg.icon className={`h-4 w-4 ${cfg.color}`} />
                      {cfg.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="adjust-quantity">Quantity *</Label>
            <Input
              id="adjust-quantity"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="Enter quantity"
              value={form.quantity}
              onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
            />
          </div>

          {/* Preview */}
          {form.quantity && parseFloat(form.quantity) > 0 && (
            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Current Stock</span>
                <span className="font-medium">{item.currentStock} {item.unit}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {selectedType?.sign === '+' ? 'Adding' : 'Subtracting'}
                </span>
                <span className={`font-medium ${selectedType?.sign === '+' ? 'text-emerald-600' : 'text-red-600'}`}>
                  {selectedType?.sign}{quantity} {item.unit}
                </span>
              </div>
              <div className="border-t pt-2 flex items-center justify-between text-sm">
                <span className="font-medium">New Stock</span>
                <span className={`font-bold ${newStock < item.minStock ? 'text-red-600' : newStock >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {newStock} {item.unit}
                </span>
              </div>
              {newStock < 0 && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Stock cannot go below zero
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="adjust-notes">Notes</Label>
            <Textarea
              id="adjust-notes"
              placeholder="Add notes for this adjustment..."
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={submitting || !isValid} className="bg-emerald-600 hover:bg-emerald-700">
            {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ArrowUpDown className="h-4 w-4 mr-2" />}
            Adjust Stock
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Transaction History Dialog ───────────────────────────────────────────────

function TransactionHistoryDialog({
  open,
  onClose,
  item,
  transactions,
  loading: txLoading,
}: {
  open: boolean
  onClose: () => void
  item: InventoryItem | null
  transactions: StockTransaction[]
  loading: boolean
}) {
  if (!item) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-emerald-600" />
            Stock History
          </DialogTitle>
          <DialogDescription>
            Transaction history for <span className="font-semibold">{item.name}</span>
          </DialogDescription>
        </DialogHeader>

        {txLoading ? (
          <div className="py-8 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-12 text-center">
            <History className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-1">No transactions found</h3>
            <p className="text-muted-foreground">No stock transactions recorded for this item yet</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-3 pr-4">
              {transactions.map(tx => {
                const typeConfig = TRANSACTION_TYPE_CONFIG[tx.type] || TRANSACTION_TYPE_CONFIG.adjustment
                const TypeIcon = typeConfig.icon
                const isPositive = tx.quantity > 0
                return (
                  <div key={tx.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full ${typeConfig.bgClass} mt-0.5`}>
                      <TypeIcon className={`h-4 w-4 ${typeConfig.textClass}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className={`${typeConfig.bgClass} ${typeConfig.textClass} text-xs`}>
                            {typeConfig.label}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{formatDateTime(tx.createdAt)}</span>
                        </div>
                        <span className={`font-semibold text-sm ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                          {isPositive ? '+' : ''}{tx.quantity} units
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Stock: {tx.previousStock} → {tx.newStock}</span>
                        {tx.unitPrice != null && <span>Unit Price: {formatCurrency(tx.unitPrice)}</span>}
                      </div>
                      {tx.notes && (
                        <p className="text-xs text-muted-foreground mt-1">{tx.notes}</p>
                      )}
                      {tx.performedBy && (
                        <p className="text-xs text-muted-foreground mt-1">By: {tx.performedBy.name}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ── Edit Item Dialog ─────────────────────────────────────────────────────────

function EditItemDialog({
  open,
  onClose,
  item,
  categories,
  onSubmit,
  submitting,
}: {
  open: boolean
  onClose: () => void
  item: InventoryItem | null
  categories: InventoryCategory[]
  onSubmit: (data: Partial<InventoryItem>) => Promise<void>
  submitting: boolean
}) {
  const [form, setForm] = useState<Partial<InventoryItem>>(item ? {
    name: item.name,
    sku: item.sku,
    categoryId: item.categoryId,
    unit: item.unit,
    unitPrice: item.unitPrice,
    minStock: item.minStock,
    maxStock: item.maxStock,
    reorderLevel: item.reorderLevel,
    batchNumber: item.batchNumber,
    expiryDate: item.expiryDate,
    storeLocation: item.storeLocation,
    gstRate: item.gstRate,
    hsnCode: item.hsnCode,
    isActive: item.isActive,
  } : {})

  if (!item) return null

  const handleSubmit = async () => {
    await onSubmit(form)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="h-5 w-5 text-emerald-600" />
            Edit Item
          </DialogTitle>
          <DialogDescription>
            Update details for <span className="font-semibold">{item.name}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Item Name</Label>
              <Input
                value={form.name || ''}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>SKU</Label>
              <Input
                value={form.sku || ''}
                onChange={e => setForm(f => ({ ...f, sku: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={form.categoryId || ''} onValueChange={v => setForm(f => ({ ...f, categoryId: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Unit</Label>
              <Select value={form.unit || 'pcs'} onValueChange={v => setForm(f => ({ ...f, unit: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNIT_OPTIONS.map(u => (
                    <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Unit Price (₹)</Label>
              <Input
                type="number"
                step="0.01"
                value={form.unitPrice ?? ''}
                onChange={e => setForm(f => ({ ...f, unitPrice: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Min Stock Level</Label>
              <Input
                type="number"
                step="0.01"
                value={form.minStock ?? ''}
                onChange={e => setForm(f => ({ ...f, minStock: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Max Stock Level</Label>
              <Input
                type="number"
                step="0.01"
                value={form.maxStock ?? ''}
                onChange={e => setForm(f => ({ ...f, maxStock: parseFloat(e.target.value) || null }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Reorder Level</Label>
              <Input
                type="number"
                step="0.01"
                value={form.reorderLevel ?? ''}
                onChange={e => setForm(f => ({ ...f, reorderLevel: parseFloat(e.target.value) || null }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Batch Number</Label>
              <Input
                value={form.batchNumber || ''}
                onChange={e => setForm(f => ({ ...f, batchNumber: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Expiry Date</Label>
              <Input
                type="date"
                value={form.expiryDate ? new Date(form.expiryDate).toISOString().split('T')[0] : ''}
                onChange={e => setForm(f => ({ ...f, expiryDate: e.target.value ? new Date(e.target.value).toISOString() : null }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Store Location</Label>
              <Input
                value={form.storeLocation || ''}
                onChange={e => setForm(f => ({ ...f, storeLocation: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>GST Rate (%)</Label>
              <Input
                type="number"
                step="0.01"
                value={form.gstRate ?? ''}
                onChange={e => setForm(f => ({ ...f, gstRate: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            <div className="space-y-2">
              <Label>HSN Code</Label>
              <Input
                value={form.hsnCode || ''}
                onChange={e => setForm(f => ({ ...f, hsnCode: e.target.value }))}
              />
            </div>
            <div className="space-y-2 flex items-end">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="edit-active"
                  checked={form.isActive ?? true}
                  onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="edit-active">Active</Label>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700">
            {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Edit3 className="h-4 w-4 mr-2" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Main Component ───────────────────────────────────────────────────────────

export function InventoryPage() {
  const { selectedPropertyId, currentHostelId, currentUser } = useAppStore()
  const { toast } = useToast()

  const role = currentUser?.role || ''
  const canCreate = hasPermission(role, 'inventory:create')
  const canUpdate = hasPermission(role, 'inventory:update')
  const canDelete = hasPermission(role, 'inventory:delete')

  // Data
  const [items, setItems] = useState<InventoryItem[]>([])
  const [categories, setCategories] = useState<InventoryCategory[]>([])
  const [stats, setStats] = useState<InventoryStats>({ totalItems: 0, lowStockCount: 0, totalValue: 0, expiringSoon: 0 })
  const [transactions, setTransactions] = useState<StockTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [txLoading, setTxLoading] = useState(false)

  // UI State
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [lowStockFilter, setLowStockFilter] = useState(false)
  const [sortField, setSortField] = useState<string>('createdAt')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  // Dialogs
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showAdjustDialog, setShowAdjustDialog] = useState(false)
  const [showHistoryDialog, setShowHistoryDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // ── Data Fetching ──────────────────────────────────────────────────────────

  const fetchInventory = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (selectedPropertyId || currentHostelId) params.set('propertyId', selectedPropertyId || currentHostelId!)
      if (categoryFilter !== 'all') params.set('categoryId', categoryFilter)
      if (lowStockFilter) params.set('lowStock', 'true')
      if (searchQuery.trim()) params.set('search', searchQuery.trim())

      const res = await fetch(`/api/inventory?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setItems(data.items || [])
        setCategories(data.categories || [])
        setStats(data.stats || { totalItems: 0, lowStockCount: 0, totalValue: 0, expiringSoon: 0 })
      }
    } catch (err) {
      console.error('Failed to fetch inventory:', err)
    }
  }, [selectedPropertyId, currentHostelId, categoryFilter, lowStockFilter, searchQuery])

  const fetchTransactions = useCallback(async (itemId: string) => {
    setTxLoading(true)
    try {
      const res = await fetch(`/api/inventory?transactions=${itemId}` + (currentHostelId ? `&propertyId=${currentHostelId}` : ''))
      if (res.ok) {
        const data = await res.json()
        setTransactions(data.transactions || [])
      }
    } catch (err) {
      console.error('Failed to fetch transactions:', err)
    } finally {
      setTxLoading(false)
    }
  }, [])

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await fetchInventory()
      setLoading(false)
    }
    loadData()
  }, [fetchInventory])

  // Refetch when filters change (with debounce for search)
  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => {
        fetchInventory()
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [searchQuery, categoryFilter, lowStockFilter, selectedPropertyId])

  // ── Computed Values ────────────────────────────────────────────────────────

  const sortedItems = useMemo(() => {
    const sorted = [...items].sort((a, b) => {
      let aVal: string | number
      let bVal: string | number
      switch (sortField) {
        case 'name':
          aVal = a.name.toLowerCase()
          bVal = b.name.toLowerCase()
          break
        case 'currentStock':
          aVal = a.currentStock
          bVal = b.currentStock
          break
        case 'unitPrice':
          aVal = a.unitPrice
          bVal = b.unitPrice
          break
        case 'stockValue':
          aVal = a.currentStock * a.unitPrice
          bVal = b.currentStock * b.unitPrice
          break
        case 'expiryDate':
          aVal = a.expiryDate ? new Date(a.expiryDate).getTime() : Infinity
          bVal = b.expiryDate ? new Date(b.expiryDate).getTime() : Infinity
          break
        default:
          aVal = new Date(a.createdAt).getTime()
          bVal = new Date(b.createdAt).getTime()
      }
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return sorted
  }, [items, sortField, sortDir])

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 ml-1 text-muted-foreground/50" />
    return sortDir === 'asc'
      ? <TrendingUp className="h-3 w-3 ml-1 text-emerald-600" />
      : <TrendingDown className="h-3 w-3 ml-1 text-emerald-600" />
  }

  const handleAddItem = async (formData: InventoryFormData) => {
    setSubmitting(true)
    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          sku: formData.sku || null,
          categoryId: formData.categoryId,
          propertyId: selectedPropertyId,
          unit: formData.unit,
          unitPrice: parseFloat(formData.unitPrice) || 0,
          currentStock: parseFloat(formData.currentStock) || 0,
          minStock: parseFloat(formData.minStock) || 0,
          maxStock: formData.maxStock ? parseFloat(formData.maxStock) : null,
          reorderLevel: formData.reorderLevel ? parseFloat(formData.reorderLevel) : null,
          batchNumber: formData.batchNumber || null,
          expiryDate: formData.expiryDate || null,
          storeLocation: formData.storeLocation || null,
          gstRate: parseFloat(formData.gstRate) || 0,
          hsnCode: formData.hsnCode || null,
        }),
      })

      if (res.ok) {
        toast({ title: 'Item added', description: `${formData.name} has been added to inventory` })
        setShowAddDialog(false)
        await fetchInventory()
      } else {
        const err = await res.json()
        toast({ title: 'Error', description: err.error || 'Failed to add item', variant: 'destructive' })
      }
    } catch (err) {
      console.error('Failed to add item:', err)
      toast({ title: 'Error', description: 'Failed to add item', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleAdjustStock = async (formData: StockAdjustFormData) => {
    if (!selectedItem) return
    setSubmitting(true)
    try {
      const adjType = ADJUSTMENT_TYPES[formData.type]
      const quantity = parseFloat(formData.quantity)
      const effectiveQty = adjType?.sign === '-' ? -quantity : quantity

      const res = await fetch('/api/inventory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'adjust',
          itemId: selectedItem.id,
          type: formData.type,
          quantity: effectiveQty,
          notes: formData.notes,
          userId: currentUser?.id,
        }),
      })

      if (res.ok) {
        toast({ title: 'Stock adjusted', description: `${selectedItem.name} stock updated successfully` })
        setShowAdjustDialog(false)
        setSelectedItem(null)
        await fetchInventory()
      } else {
        const err = await res.json()
        toast({ title: 'Error', description: err.error || 'Failed to adjust stock', variant: 'destructive' })
      }
    } catch (err) {
      console.error('Failed to adjust stock:', err)
      toast({ title: 'Error', description: 'Failed to adjust stock', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditItem = async (formData: Partial<InventoryItem>) => {
    if (!selectedItem) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/inventory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          itemId: selectedItem.id,
          ...formData,
        }),
      })

      if (res.ok) {
        toast({ title: 'Item updated', description: `${selectedItem.name} has been updated` })
        setShowEditDialog(false)
        setSelectedItem(null)
        await fetchInventory()
      } else {
        toast({ title: 'Error', description: 'Failed to update item', variant: 'destructive' })
      }
    } catch (err) {
      console.error('Failed to update item:', err)
      toast({ title: 'Error', description: 'Failed to update item', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleViewTransactions = (item: InventoryItem) => {
    setSelectedItem(item)
    fetchTransactions(item.id)
    setShowHistoryDialog(true)
  }

  const handleAdjustClick = (item: InventoryItem) => {
    setSelectedItem(item)
    setShowAdjustDialog(true)
  }

  const handleEditClick = (item: InventoryItem) => {
    setSelectedItem(item)
    setShowEditDialog(true)
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <StatsCardSkeleton key={i} />)}
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
            <Package className="w-6 h-6 text-emerald-600" />
            Inventory
          </h1>
          <p className="text-muted-foreground mt-1">Manage stock items, track quantities, and monitor inventory levels</p>
        </div>
        {canCreate && (
          <Button onClick={() => setShowAddDialog(true)} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Items"
          value={stats.totalItems.toString()}
          icon={Package}
          iconBg="bg-emerald-50 dark:bg-emerald-950/50"
          iconColor="text-emerald-600 dark:text-emerald-400"
          subtitle="Across all categories"
        />
        <StatsCard
          title="Low Stock"
          value={stats.lowStockCount.toString()}
          icon={AlertTriangle}
          iconBg="bg-red-50 dark:bg-red-950/50"
          iconColor="text-red-600 dark:text-red-400"
          subtitle="Below minimum level"
          badge={stats.lowStockCount > 0 ? { label: 'Alert', variant: 'destructive' } : undefined}
        />
        <StatsCard
          title="Stock Value"
          value={formatCurrency(stats.totalValue)}
          icon={IndianRupee}
          iconBg="bg-amber-50 dark:bg-amber-950/50"
          iconColor="text-amber-600 dark:text-amber-400"
          subtitle="Total inventory value"
        />
        <StatsCard
          title="Expiring Soon"
          value={stats.expiringSoon.toString()}
          icon={Clock}
          iconBg="bg-orange-50 dark:bg-orange-950/50"
          iconColor="text-orange-600 dark:text-orange-400"
          subtitle="Within 7 days"
          badge={stats.expiringSoon > 0 ? { label: 'Warning', variant: 'destructive' } : undefined}
        />
      </div>

      {/* Category Filter Pills */}
      {categories.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Tag className="h-4 w-4 text-muted-foreground mr-1" />
              <button
                onClick={() => setCategoryFilter('all')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  categoryFilter === 'all'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                All
                <span className={`text-xs ${categoryFilter === 'all' ? 'text-emerald-100' : 'text-muted-foreground'}`}>
                  {stats.totalItems}
                </span>
              </button>
              {categories.map(cat => {
                const isActive = categoryFilter === cat.id
                return (
                  <button
                    key={cat.id}
                    onClick={() => setCategoryFilter(isActive ? 'all' : cat.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {cat.name}
                    <span className={`text-xs ${isActive ? 'text-emerald-100' : 'text-muted-foreground'}`}>
                      {cat._count.items}
                    </span>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search & Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by item name or SKU..."
                className="pl-9"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <Button
              variant={lowStockFilter ? 'default' : 'outline'}
              size="sm"
              onClick={() => setLowStockFilter(!lowStockFilter)}
              className={lowStockFilter ? 'bg-red-600 hover:bg-red-700 text-white' : ''}
            >
              <AlertTriangle className="h-4 w-4 mr-1.5" />
              Low Stock
            </Button>
            {lowStockFilter && (
              <Button variant="ghost" size="sm" onClick={() => setLowStockFilter(false)} className="text-muted-foreground">
                <XCircle className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      {sortedItems.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-1">No inventory items found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || categoryFilter !== 'all' || lowStockFilter
                ? 'Try adjusting your filters or search query'
                : 'Add your first inventory item to get started'}
            </p>
            {canCreate && (
              <Button onClick={() => setShowAddDialog(true)} className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="cursor-pointer select-none" onClick={() => handleSort('name')}>
                      <div className="flex items-center">Item Name <SortIcon field="name" /></div>
                    </TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead className="cursor-pointer select-none" onClick={() => handleSort('currentStock')}>
                      <div className="flex items-center">Current Stock <SortIcon field="currentStock" /></div>
                    </TableHead>
                    <TableHead>Min Stock</TableHead>
                    <TableHead className="cursor-pointer select-none" onClick={() => handleSort('unitPrice')}>
                      <div className="flex items-center">Unit Price <SortIcon field="unitPrice" /></div>
                    </TableHead>
                    <TableHead className="cursor-pointer select-none" onClick={() => handleSort('stockValue')}>
                      <div className="flex items-center">Stock Value <SortIcon field="stockValue" /></div>
                    </TableHead>
                    <TableHead>Batch</TableHead>
                    <TableHead className="cursor-pointer select-none" onClick={() => handleSort('expiryDate')}>
                      <div className="flex items-center">Expiry Date <SortIcon field="expiryDate" /></div>
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedItems.map(item => {
                    const stockStatus = getStockStatus(item.currentStock, item.minStock)
                    const stockValue = item.currentStock * item.unitPrice
                    const expired = isExpired(item.expiryDate)
                    const expiringSoon = isExpiringSoon(item.expiryDate)

                    return (
                      <TableRow key={item.id} className="hover:bg-muted/50">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className={`h-2 w-2 rounded-full ${stockStatus.color}`} />
                            <div>
                              <span className="font-medium">{item.name}</span>
                              {item.storeLocation && (
                                <p className="text-xs text-muted-foreground">{item.storeLocation}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm font-mono">
                          {item.sku || '—'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs">
                            {item.category?.name || 'Uncategorized'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{item.unit}</TableCell>
                        <TableCell>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center gap-1.5">
                                  <span className={`font-semibold ${stockStatus.textClass}`}>
                                    {item.currentStock}
                                  </span>
                                  <Badge variant="secondary" className={`${stockStatus.bgClass} ${stockStatus.textClass} text-[10px] px-1.5 py-0`}>
                                    {stockStatus.label}
                                  </Badge>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Min: {item.minStock} | Max: {item.maxStock ?? '—'} | Reorder: {item.reorderLevel ?? '—'}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{item.minStock}</TableCell>
                        <TableCell className="text-sm font-medium">{formatCurrency(item.unitPrice)}</TableCell>
                        <TableCell className="text-sm font-medium">{formatCurrency(stockValue)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground font-mono">
                          {item.batchNumber || '—'}
                        </TableCell>
                        <TableCell>
                          {item.expiryDate ? (
                            <div className="flex items-center gap-1">
                              <span className={`text-sm ${expired ? 'text-red-600 font-semibold' : expiringSoon ? 'text-amber-600 font-medium' : ''}`}>
                                {formatDate(item.expiryDate)}
                              </span>
                              {expired && (
                                <Badge variant="destructive" className="text-[10px] px-1 py-0">Expired</Badge>
                              )}
                              {!expired && expiringSoon && (
                                <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 text-[10px] px-1 py-0 hover:bg-amber-100">
                                  Soon
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {item.isActive ? (
                            <Badge variant="secondary" className="bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-xs">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs">
                              <XCircle className="h-3 w-3 mr-1" />
                              Inactive
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {canUpdate && (
                                <DropdownMenuItem onClick={() => handleEditClick(item)}>
                                  <Edit3 className="h-4 w-4 mr-2" /> Edit Item
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => handleAdjustClick(item)}>
                                <ArrowUpDown className="h-4 w-4 mr-2" /> Adjust Stock
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleViewTransactions(item)}>
                                <History className="h-4 w-4 mr-2" /> View Transactions
                              </DropdownMenuItem>
                              {canDelete && (
                                <DropdownMenuItem
                                  className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/50"
                                  onClick={() => {
                                    setDeleteTarget({ id: item.id, name: item.name })
                                    setDeleteDialogOpen(true)
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" /> Delete Item
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Table Footer - Summary */}
            <div className="border-t px-4 py-3 bg-muted/30">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Showing {sortedItems.length} of {stats.totalItems} items</span>
                <span>Total Stock Value: <span className="font-semibold text-foreground">{formatCurrency(sortedItems.reduce((sum, i) => sum + i.currentStock * i.unitPrice, 0))}</span></span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <AddItemDialog
        key={showAddDialog ? 'add-open' : 'add-closed'}
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        categories={categories}
        propertyId={selectedPropertyId}
        onSubmit={handleAddItem}
        submitting={submitting}
      />

      <StockAdjustDialog
        key={showAdjustDialog ? 'adjust-open' : 'adjust-closed'}
        open={showAdjustDialog}
        onClose={() => { setShowAdjustDialog(false); setSelectedItem(null) }}
        item={selectedItem}
        onSubmit={handleAdjustStock}
        submitting={submitting}
      />

      <TransactionHistoryDialog
        open={showHistoryDialog}
        onClose={() => { setShowHistoryDialog(false); setSelectedItem(null); setTransactions([]) }}
        item={selectedItem}
        transactions={transactions}
        loading={txLoading}
      />

      <EditItemDialog
        key={showEditDialog ? 'edit-open' : 'edit-closed'}
        open={showEditDialog}
        onClose={() => { setShowEditDialog(false); setSelectedItem(null) }}
        item={selectedItem}
        categories={categories}
        onSubmit={handleEditItem}
        submitting={submitting}
      />

      {/* ── Delete Confirmation Dialog ──────────────────────────────────────── */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Inventory Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This action cannot be undone. All related stock transactions, consumption logs, and waste records will also be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!deleteTarget) return
                setSubmitting(true)
                try {
                  const res = await fetch('/api/inventory', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: deleteTarget.id }),
                  })
                  if (res.ok) {
                    toast({ title: 'Success', description: `${deleteTarget.name} has been deleted` })
                    fetchInventory()
                  } else {
                    const data = await res.json()
                    toast({ title: 'Error', description: data.error || 'Failed to delete item', variant: 'destructive' })
                  }
                } catch {
                  toast({ title: 'Error', description: 'Failed to delete item', variant: 'destructive' })
                } finally {
                  setSubmitting(false)
                  setDeleteDialogOpen(false)
                  setDeleteTarget(null)
                }
              }}
              disabled={submitting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
