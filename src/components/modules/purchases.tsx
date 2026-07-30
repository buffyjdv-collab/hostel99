'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useAppStore, hasPermission } from '@/lib/store'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import {
  ShoppingCart,
  FileText,
  PackageCheck,
  Plus,
  Search,
  Eye,
  MoreVertical,
  Loader2,
  IndianRupee,
  Clock,
  CheckCircle2,
  Truck,
  ClipboardList,
  XCircle,
  AlertTriangle,
  Trash2,
  Pencil,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Package,
} from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────────

type POStatus = 'draft' | 'submitted' | 'approved' | 'partially_received' | 'received' | 'cancelled'
type PaymentStatus = 'unpaid' | 'partial' | 'paid'
type PRStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'cancelled' | 'converted'
type PRPriority = 'low' | 'normal' | 'high' | 'urgent'
type GRNStatus = 'pending_inspection' | 'accepted' | 'partially_accepted' | 'rejected'

interface VendorInfo {
  id: string
  name: string
  phone?: string
}

interface UserInfo {
  name: string
}

interface InventoryItemInfo {
  name: string
  unit: string
}

interface POItem {
  id: string
  itemName: string
  quantity: number
  unit: string
  unitPrice: number
  gstRate: number
  totalPrice: number
  receivedQty: number
  status: string
  item: InventoryItemInfo | null
}

interface PurchaseOrder {
  id: string
  poNumber: string
  vendor: VendorInfo
  orderDate: string
  totalAmount: number
  gstAmount: number
  discount: number
  netAmount: number
  status: POStatus
  paymentStatus: PaymentStatus
  paymentMode: string | null
  createdBy: UserInfo
  items: POItem[]
  _count: { goodsReceivedNotes: number }
  expectedDelivery?: string | null
  notes?: string | null
}

interface PRItem {
  id: string
  itemName: string
  description?: string | null
  quantity: number
  unit: string
  estimatedPrice?: number | null
  notes?: string | null
}

interface PurchaseRequisition {
  id: string
  prNumber: string
  title: string
  description?: string | null
  requestedBy: UserInfo
  approvedBy: UserInfo | null
  status: PRStatus
  priority: PRPriority
  requiredBy?: string | null
  createdAt: string
  items: PRItem[]
  notes?: string | null
}

interface GRNItem {
  id: string
  poItemId?: string | null
  itemName: string
  orderedQty: number
  receivedQty: number
  acceptedQty: number
  rejectedQty: number
  unitPrice: number
  batchNumber?: string | null
  notes?: string | null
}

interface GoodsReceivedNote {
  id: string
  grnNumber: string
  purchaseOrderId: string
  purchaseOrder: { vendor: { name: string } }
  receivedBy: UserInfo
  receivedDate: string
  invoiceNumber?: string | null
  status: GRNStatus
  items: GRNItem[]
  notes?: string | null
}

interface PurchaseStats {
  totalOrders: number
  pendingOrders: number
  totalValue: number
  receivedOrders: number
}

interface VendorOption {
  id: string
  name: string
  phone?: string
}

interface InventoryOption {
  id: string
  name: string
  unit: string
  unitPrice: number
}

// ── PO Form Item ─────────────────────────────────────────────────────────────

interface POFormItem {
  itemId: string
  itemName: string
  quantity: string
  unit: string
  unitPrice: string
  gstRate: string
  totalPrice: number
}

interface PRFormItem {
  itemName: string
  description: string
  quantity: string
  unit: string
  estimatedPrice: string
}

interface GRNFormItem {
  poItemId: string
  itemName: string
  orderedQty: number
  receivedQty: string
  acceptedQty: string
  rejectedQty: string
  unitPrice: number
  batchNumber: string
}

// ── Constants ────────────────────────────────────────────────────────────────

const PO_STATUS_CONFIG: Record<POStatus, { label: string; bgClass: string; textClass: string; dotClass: string }> = {
  draft: { label: 'Draft', bgClass: 'bg-gray-100 dark:bg-gray-800/50', textClass: 'text-gray-700 dark:text-gray-300', dotClass: 'bg-gray-500' },
  submitted: { label: 'Submitted', bgClass: 'bg-amber-100 dark:bg-amber-950/50', textClass: 'text-amber-700 dark:text-amber-300', dotClass: 'bg-amber-500' },
  approved: { label: 'Approved', bgClass: 'bg-emerald-100 dark:bg-emerald-950/50', textClass: 'text-emerald-700 dark:text-emerald-300', dotClass: 'bg-emerald-500' },
  partially_received: { label: 'Partially Received', bgClass: 'bg-teal-100 dark:bg-teal-950/50', textClass: 'text-teal-700 dark:text-teal-300', dotClass: 'bg-teal-500' },
  received: { label: 'Received', bgClass: 'bg-green-100 dark:bg-green-950/50', textClass: 'text-green-700 dark:text-green-300', dotClass: 'bg-green-500' },
  cancelled: { label: 'Cancelled', bgClass: 'bg-red-100 dark:bg-red-950/50', textClass: 'text-red-700 dark:text-red-300', dotClass: 'bg-red-500' },
}

const PAYMENT_STATUS_CONFIG: Record<PaymentStatus, { label: string; bgClass: string; textClass: string }> = {
  unpaid: { label: 'Unpaid', bgClass: 'bg-red-100 dark:bg-red-950/50', textClass: 'text-red-700 dark:text-red-300' },
  partial: { label: 'Partial', bgClass: 'bg-amber-100 dark:bg-amber-950/50', textClass: 'text-amber-700 dark:text-amber-300' },
  paid: { label: 'Paid', bgClass: 'bg-emerald-100 dark:bg-emerald-950/50', textClass: 'text-emerald-700 dark:text-emerald-300' },
}

const PR_STATUS_CONFIG: Record<PRStatus, { label: string; bgClass: string; textClass: string; dotClass: string }> = {
  draft: { label: 'Draft', bgClass: 'bg-gray-100 dark:bg-gray-800/50', textClass: 'text-gray-700 dark:text-gray-300', dotClass: 'bg-gray-500' },
  submitted: { label: 'Submitted', bgClass: 'bg-amber-100 dark:bg-amber-950/50', textClass: 'text-amber-700 dark:text-amber-300', dotClass: 'bg-amber-500' },
  approved: { label: 'Approved', bgClass: 'bg-emerald-100 dark:bg-emerald-950/50', textClass: 'text-emerald-700 dark:text-emerald-300', dotClass: 'bg-emerald-500' },
  rejected: { label: 'Rejected', bgClass: 'bg-red-100 dark:bg-red-950/50', textClass: 'text-red-700 dark:text-red-300', dotClass: 'bg-red-500' },
  cancelled: { label: 'Cancelled', bgClass: 'bg-gray-100 dark:bg-gray-800/50', textClass: 'text-gray-500 dark:text-gray-400', dotClass: 'bg-gray-400' },
  converted: { label: 'Converted', bgClass: 'bg-teal-100 dark:bg-teal-950/50', textClass: 'text-teal-700 dark:text-teal-300', dotClass: 'bg-teal-500' },
}

const PR_PRIORITY_CONFIG: Record<PRPriority, { label: string; bgClass: string; textClass: string }> = {
  low: { label: 'Low', bgClass: 'bg-gray-100 dark:bg-gray-800/50', textClass: 'text-gray-700 dark:text-gray-300' },
  normal: { label: 'Normal', bgClass: 'bg-blue-100 dark:bg-blue-950/50', textClass: 'text-blue-700 dark:text-blue-300' },
  high: { label: 'High', bgClass: 'bg-orange-100 dark:bg-orange-950/50', textClass: 'text-orange-700 dark:text-orange-300' },
  urgent: { label: 'Urgent', bgClass: 'bg-red-100 dark:bg-red-950/50', textClass: 'text-red-700 dark:text-red-300' },
}

const GRN_STATUS_CONFIG: Record<GRNStatus, { label: string; bgClass: string; textClass: string; dotClass: string }> = {
  pending_inspection: { label: 'Pending Inspection', bgClass: 'bg-amber-100 dark:bg-amber-950/50', textClass: 'text-amber-700 dark:text-amber-300', dotClass: 'bg-amber-500' },
  accepted: { label: 'Accepted', bgClass: 'bg-emerald-100 dark:bg-emerald-950/50', textClass: 'text-emerald-700 dark:text-emerald-300', dotClass: 'bg-emerald-500' },
  partially_accepted: { label: 'Partially Accepted', bgClass: 'bg-teal-100 dark:bg-teal-950/50', textClass: 'text-teal-700 dark:text-teal-300', dotClass: 'bg-teal-500' },
  rejected: { label: 'Rejected', bgClass: 'bg-red-100 dark:bg-red-950/50', textClass: 'text-red-700 dark:text-red-300', dotClass: 'bg-red-500' },
}

const UNITS = ['kg', 'g', 'ltr', 'ml', 'pcs', 'box', 'pack', 'dozen', 'm', 'cm', 'sqft', 'set', 'roll', 'bag', 'unit']

const EMPTY_PO_ITEM: POFormItem = {
  itemId: '',
  itemName: '',
  quantity: '',
  unit: 'pcs',
  unitPrice: '',
  gstRate: '0',
  totalPrice: 0,
}

const EMPTY_PR_ITEM: PRFormItem = {
  itemName: '',
  description: '',
  quantity: '',
  unit: 'pcs',
  estimatedPrice: '',
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

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ── Status Badge Component ───────────────────────────────────────────────────

function StatusBadge({ config }: { config: { label: string; bgClass: string; textClass: string; dotClass?: string } }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bgClass} ${config.textClass}`}>
      {config.dotClass && <span className={`w-1.5 h-1.5 rounded-full ${config.dotClass}`} />}
      {config.label}
    </span>
  )
}

// ── Main Component ───────────────────────────────────────────────────────────

export function PurchasesPage() {
  const { selectedPropertyId, currentUser } = useAppStore()
  const { toast } = useToast()

  const role = currentUser?.role || ''
  const canCreate = hasPermission(role, 'purchases:create')
  const canUpdate = hasPermission(role, 'purchases:update')
  const canDelete = hasPermission(role, 'purchases:delete')

  // ── Tab state ──────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('orders')

  // ── Data state ─────────────────────────────────────────────────────────────
  const [orders, setOrders] = useState<PurchaseOrder[]>([])
  const [requisitions, setRequisitions] = useState<PurchaseRequisition[]>([])
  const [grns, setGrns] = useState<GoodsReceivedNote[]>([])
  const [stats, setStats] = useState<PurchaseStats>({ totalOrders: 0, pendingOrders: 0, totalValue: 0, receivedOrders: 0 })
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  // ── Search state ───────────────────────────────────────────────────────────
  const [orderSearch, setOrderSearch] = useState('')
  const [prSearch, setPrSearch] = useState('')
  const [grnSearch, setGrnSearch] = useState('')

  // ── Dialog state ───────────────────────────────────────────────────────────
  const [showCreatePO, setShowCreatePO] = useState(false)
  const [showPODetail, setShowPODetail] = useState(false)
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null)

  const [showCreatePR, setShowCreatePR] = useState(false)
  const [selectedPR, setSelectedPR] = useState<PurchaseRequisition | null>(null)
  const [showPRDetail, setShowPRDetail] = useState(false)
  const [showRejectPR, setShowRejectPR] = useState(false)

  const [showCreateGRN, setShowCreateGRN] = useState(false)
  const [showGRNDetail, setShowGRNDetail] = useState(false)
  const [selectedGRN, setSelectedGRN] = useState<GoodsReceivedNote | null>(null)

  // ── Edit dialog state ──────────────────────────────────────────────────────
  const [showEditPO, setShowEditPO] = useState(false)
  const [editingPO, setEditingPO] = useState<PurchaseOrder | null>(null)
  const [editPOStatus, setEditPOStatus] = useState<POStatus>('draft')
  const [editPOPaymentStatus, setEditPOPaymentStatus] = useState<PaymentStatus>('unpaid')
  const [editPOPaymentMode, setEditPOPaymentMode] = useState('')
  const [editPONotes, setEditPONotes] = useState('')

  const [showEditPR, setShowEditPR] = useState(false)
  const [editingPR, setEditingPR] = useState<PurchaseRequisition | null>(null)
  const [editPRStatus, setEditPRStatus] = useState<PRStatus>('draft')
  const [editPRPriority, setEditPRPriority] = useState<PRPriority>('normal')
  const [editPRNotes, setEditPRNotes] = useState('')

  const [showEditGRN, setShowEditGRN] = useState(false)
  const [editingGRN, setEditingGRN] = useState<GoodsReceivedNote | null>(null)
  const [editGRNStatus, setEditGRNStatus] = useState<GRNStatus>('pending_inspection')
  const [editGRNNotes, setEditGRNNotes] = useState('')

  // ── Delete dialog state ────────────────────────────────────────────────────
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'orders' | 'requisition' | 'grn'; id: string; name: string } | null>(null)

  // ── PO Form state ──────────────────────────────────────────────────────────
  const [poVendorId, setPoVendorId] = useState('')
  const [poItems, setPoItems] = useState<POFormItem[]>([{ ...EMPTY_PO_ITEM }])
  const [poExpectedDelivery, setPoExpectedDelivery] = useState('')
  const [poNotes, setPoNotes] = useState('')
  const [poDiscount, setPoDiscount] = useState('')

  // ── PR Form state ──────────────────────────────────────────────────────────
  const [prTitle, setPrTitle] = useState('')
  const [prDescription, setPrDescription] = useState('')
  const [prPriority, setPrPriority] = useState<PRPriority>('normal')
  const [prItems, setPrItems] = useState<PRFormItem[]>([{ ...EMPTY_PR_ITEM }])
  const [prRequiredBy, setPrRequiredBy] = useState('')
  const [prNotes, setPrNotes] = useState('')

  // ── GRN Form state ─────────────────────────────────────────────────────────
  const [grnPurchaseOrderId, setGrnPurchaseOrderId] = useState('')
  const [grnInvoiceNumber, setGrnInvoiceNumber] = useState('')
  const [grnItems, setGrnItems] = useState<GRNFormItem[]>([])
  const [grnNotes, setGrnNotes] = useState('')

  // ── Vendor/Inventory options ───────────────────────────────────────────────
  const [vendors, setVendors] = useState<VendorOption[]>([])
  const [inventoryItems, setInventoryItems] = useState<InventoryOption[]>([])

  // ── Fetch data ─────────────────────────────────────────────────────────────

  const fetchOrders = useCallback(async () => {
    try {
      const params = new URLSearchParams({ type: 'orders' })
      if (selectedPropertyId) params.set('propertyId', selectedPropertyId)
      const res = await fetch(`/api/purchases?${params}`)
      if (res.ok) {
        const data = await res.json()
        setOrders(data.orders || [])
        setStats(data.stats || { totalOrders: 0, pendingOrders: 0, totalValue: 0, receivedOrders: 0 })
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err)
    }
  }, [selectedPropertyId])

  const fetchRequisitions = useCallback(async () => {
    try {
      const params = new URLSearchParams({ type: 'requisitions' })
      if (selectedPropertyId) params.set('propertyId', selectedPropertyId)
      const res = await fetch(`/api/purchases?${params}`)
      if (res.ok) {
        const data = await res.json()
        setRequisitions(data.requisitions || [])
      }
    } catch (err) {
      console.error('Failed to fetch requisitions:', err)
    }
  }, [selectedPropertyId])

  const fetchGrns = useCallback(async () => {
    try {
      const params = new URLSearchParams({ type: 'grns' })
      if (selectedPropertyId) params.set('propertyId', selectedPropertyId)
      const res = await fetch(`/api/purchases?${params}`)
      if (res.ok) {
        const data = await res.json()
        setGrns(data.grns || [])
      }
    } catch (err) {
      console.error('Failed to fetch GRNs:', err)
    }
  }, [selectedPropertyId])

  const fetchVendors = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (selectedPropertyId) params.set('propertyId', selectedPropertyId)
      const res = await fetch(`/api/vendors?${params}`)
      if (res.ok) {
        const data = await res.json()
        setVendors((data.vendors || []).map((v: any) => ({ id: v.id, name: v.name, phone: v.phone })))
      }
    } catch (err) {
      console.error('Failed to fetch vendors:', err)
    }
  }, [selectedPropertyId])

  const fetchInventory = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (selectedPropertyId) params.set('propertyId', selectedPropertyId)
      const res = await fetch(`/api/inventory?${params}`)
      if (res.ok) {
        const data = await res.json()
        setInventoryItems((data.items || []).map((i: any) => ({ id: i.id, name: i.name, unit: i.unit, unitPrice: i.unitPrice })))
      }
    } catch (err) {
      console.error('Failed to fetch inventory:', err)
    }
  }, [selectedPropertyId])

  // ── Initial load ───────────────────────────────────────────────────────────

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true)
      await Promise.all([fetchOrders(), fetchRequisitions(), fetchGrns(), fetchVendors(), fetchInventory()])
      setLoading(false)
    }
    loadAll()
  }, [fetchOrders, fetchRequisitions, fetchGrns, fetchVendors, fetchInventory])

  // ── Filtered data ──────────────────────────────────────────────────────────

  const filteredOrders = useMemo(() => {
    if (!orderSearch.trim()) return orders
    const q = orderSearch.toLowerCase()
    return orders.filter(o =>
      o.poNumber.toLowerCase().includes(q) ||
      o.vendor.name.toLowerCase().includes(q) ||
      o.status.toLowerCase().includes(q)
    )
  }, [orders, orderSearch])

  const filteredRequisitions = useMemo(() => {
    if (!prSearch.trim()) return requisitions
    const q = prSearch.toLowerCase()
    return requisitions.filter(r =>
      r.prNumber.toLowerCase().includes(q) ||
      r.title.toLowerCase().includes(q) ||
      r.requestedBy.name.toLowerCase().includes(q)
    )
  }, [requisitions, prSearch])

  const filteredGrns = useMemo(() => {
    if (!grnSearch.trim()) return grns
    const q = grnSearch.toLowerCase()
    return grns.filter(g =>
      g.grnNumber.toLowerCase().includes(q) ||
      g.purchaseOrder.vendor.name.toLowerCase().includes(q) ||
      (g.invoiceNumber && g.invoiceNumber.toLowerCase().includes(q))
    )
  }, [grns, grnSearch])

  // ── PO Form helpers ────────────────────────────────────────────────────────

  const poSubtotal = useMemo(() => poItems.reduce((s, i) => s + i.totalPrice, 0), [poItems])
  const poGstTotal = useMemo(() => poItems.reduce((s, i) => s + (i.totalPrice * (parseFloat(i.gstRate) || 0) / 100), 0), [poItems])
  const poNetTotal = useMemo(() => poSubtotal + poGstTotal - (parseFloat(poDiscount) || 0), [poSubtotal, poGstTotal, poDiscount])

  const updatePOItem = (index: number, field: keyof POFormItem, value: string | number) => {
    setPoItems(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      if (field === 'quantity' || field === 'unitPrice') {
        const qty = parseFloat(updated[index].quantity) || 0
        const price = parseFloat(updated[index].unitPrice) || 0
        updated[index].totalPrice = qty * price
      }
      return updated
    })
  }

  const addPOItem = () => setPoItems(prev => [...prev, { ...EMPTY_PO_ITEM }])

  const removePOItem = (index: number) => {
    if (poItems.length <= 1) return
    setPoItems(prev => prev.filter((_, i) => i !== index))
  }

  const handlePOItemSelect = (index: number, itemId: string) => {
    const invItem = inventoryItems.find(i => i.id === itemId)
    if (invItem) {
      setPoItems(prev => {
        const updated = [...prev]
        updated[index] = {
          ...updated[index],
          itemId: invItem.id,
          itemName: invItem.name,
          unit: invItem.unit,
          unitPrice: String(invItem.unitPrice),
          totalPrice: (parseFloat(updated[index].quantity) || 0) * invItem.unitPrice,
        }
        return updated
      })
    }
  }

  // ── PR Form helpers ────────────────────────────────────────────────────────

  const updatePRItem = (index: number, field: keyof PRFormItem, value: string) => {
    setPrItems(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const addPRItem = () => setPrItems(prev => [...prev, { ...EMPTY_PR_ITEM }])

  const removePRItem = (index: number) => {
    if (prItems.length <= 1) return
    setPrItems(prev => prev.filter((_, i) => i !== index))
  }

  // ── GRN Form helpers ───────────────────────────────────────────────────────

  const approvedOrders = useMemo(() => orders.filter(o => ['approved', 'partially_received'].includes(o.status)), [orders])

  const selectedPOForGRN = useMemo(() => {
    if (!grnPurchaseOrderId) return null
    return orders.find(o => o.id === grnPurchaseOrderId) || null
  }, [grnPurchaseOrderId, orders])

  const handleGRNPOSelect = (poId: string) => {
    setGrnPurchaseOrderId(poId)
    const po = orders.find(o => o.id === poId)
    if (po) {
      setGrnItems(po.items.map(item => ({
        poItemId: item.id,
        itemName: item.itemName,
        orderedQty: item.quantity,
        receivedQty: '',
        acceptedQty: '',
        rejectedQty: '',
        unitPrice: item.unitPrice,
        batchNumber: '',
      })))
    } else {
      setGrnItems([])
    }
  }

  const updateGRNItem = (index: number, field: keyof GRNFormItem, value: string | number) => {
    setGrnItems(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  // ── Create PO ──────────────────────────────────────────────────────────────

  const handleCreatePO = async () => {
    if (!poVendorId) {
      toast({ title: 'Validation Error', description: 'Please select a vendor', variant: 'destructive' })
      return
    }
    const validItems = poItems.filter(i => i.itemName && parseFloat(i.quantity) > 0 && parseFloat(i.unitPrice) > 0)
    if (validItems.length === 0) {
      toast({ title: 'Validation Error', description: 'Please add at least one valid item', variant: 'destructive' })
      return
    }
    setActionLoading(true)
    try {
      const res = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'order',
          vendorId: poVendorId,
          propertyId: selectedPropertyId,
          userId: currentUser?.id,
          items: validItems.map(i => ({
            itemId: i.itemId || null,
            itemName: i.itemName,
            quantity: parseFloat(i.quantity),
            unit: i.unit,
            unitPrice: parseFloat(i.unitPrice),
            gstRate: parseFloat(i.gstRate) || 0,
            totalPrice: i.totalPrice,
          })),
          discount: parseFloat(poDiscount) || 0,
          expectedDelivery: poExpectedDelivery || null,
          notes: poNotes,
        }),
      })
      if (res.ok) {
        toast({ title: 'Success', description: 'Purchase order created successfully' })
        resetPOForm()
        setShowCreatePO(false)
        fetchOrders()
      } else {
        const data = await res.json()
        toast({ title: 'Error', description: data.error || 'Failed to create PO', variant: 'destructive' })
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to create purchase order', variant: 'destructive' })
    } finally {
      setActionLoading(false)
    }
  }

  const resetPOForm = () => {
    setPoVendorId('')
    setPoItems([{ ...EMPTY_PO_ITEM }])
    setPoExpectedDelivery('')
    setPoNotes('')
    setPoDiscount('')
  }

  // ── Create Requisition ─────────────────────────────────────────────────────

  const handleCreatePR = async () => {
    if (!prTitle.trim()) {
      toast({ title: 'Validation Error', description: 'Please enter a title', variant: 'destructive' })
      return
    }
    const validItems = prItems.filter(i => i.itemName && parseFloat(i.quantity) > 0)
    if (validItems.length === 0) {
      toast({ title: 'Validation Error', description: 'Please add at least one item', variant: 'destructive' })
      return
    }
    setActionLoading(true)
    try {
      const res = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'requisition',
          title: prTitle,
          description: prDescription,
          propertyId: selectedPropertyId,
          userId: currentUser?.id,
          priority: prPriority,
          requiredBy: prRequiredBy || null,
          notes: prNotes,
          items: validItems.map(i => ({
            itemName: i.itemName,
            description: i.description,
            quantity: parseFloat(i.quantity),
            unit: i.unit,
            estimatedPrice: parseFloat(i.estimatedPrice) || null,
          })),
        }),
      })
      if (res.ok) {
        toast({ title: 'Success', description: 'Requisition created successfully' })
        resetPRForm()
        setShowCreatePR(false)
        fetchRequisitions()
      } else {
        const data = await res.json()
        toast({ title: 'Error', description: data.error || 'Failed to create requisition', variant: 'destructive' })
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to create requisition', variant: 'destructive' })
    } finally {
      setActionLoading(false)
    }
  }

  const resetPRForm = () => {
    setPrTitle('')
    setPrDescription('')
    setPrPriority('normal')
    setPrItems([{ ...EMPTY_PR_ITEM }])
    setPrRequiredBy('')
    setPrNotes('')
  }

  // ── Create GRN ─────────────────────────────────────────────────────────────

  const handleCreateGRN = async () => {
    if (!grnPurchaseOrderId) {
      toast({ title: 'Validation Error', description: 'Please select a purchase order', variant: 'destructive' })
      return
    }
    const validItems = grnItems.filter(i => parseFloat(i.receivedQty) > 0)
    if (validItems.length === 0) {
      toast({ title: 'Validation Error', description: 'Please enter received quantities', variant: 'destructive' })
      return
    }
    setActionLoading(true)
    try {
      const res = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'grn',
          purchaseOrderId: grnPurchaseOrderId,
          propertyId: selectedPropertyId,
          userId: currentUser?.id,
          invoiceNumber: grnInvoiceNumber || null,
          notes: grnNotes,
          items: validItems.map(i => ({
            poItemId: i.poItemId,
            itemName: i.itemName,
            orderedQty: i.orderedQty,
            receivedQty: parseFloat(i.receivedQty),
            acceptedQty: parseFloat(i.acceptedQty) || parseFloat(i.receivedQty),
            rejectedQty: parseFloat(i.rejectedQty) || 0,
            unitPrice: i.unitPrice,
            batchNumber: i.batchNumber || null,
          })),
        }),
      })
      if (res.ok) {
        toast({ title: 'Success', description: 'Goods Received Note created successfully' })
        resetGRNForm()
        setShowCreateGRN(false)
        fetchGrns()
        fetchOrders()
      } else {
        const data = await res.json()
        toast({ title: 'Error', description: data.error || 'Failed to create GRN', variant: 'destructive' })
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to create GRN', variant: 'destructive' })
    } finally {
      setActionLoading(false)
    }
  }

  const resetGRNForm = () => {
    setGrnPurchaseOrderId('')
    setGrnInvoiceNumber('')
    setGrnItems([])
    setGrnNotes('')
  }

  // ── Update PO Status ───────────────────────────────────────────────────────

  const updatePOStatus = async (poId: string, status: POStatus, extra?: Record<string, any>) => {
    setActionLoading(true)
    try {
      const res = await fetch('/api/purchases', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: poId,
          status,
          approvedById: status === 'approved' ? currentUser?.id : undefined,
          ...extra,
        }),
      })
      if (res.ok) {
        toast({ title: 'Success', description: `PO status updated to ${PO_STATUS_CONFIG[status].label}` })
        fetchOrders()
      } else {
        toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' })
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' })
    } finally {
      setActionLoading(false)
    }
  }

  // ── Update PR Status ───────────────────────────────────────────────────────

  const updatePRStatus = async (prId: string, status: PRStatus) => {
    setActionLoading(true)
    try {
      const res = await fetch('/api/purchases', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'requisition',
          id: prId,
          status,
          approvedById: status === 'approved' ? currentUser?.id : undefined,
        }),
      })
      if (res.ok) {
        toast({ title: 'Success', description: `Requisition ${status === 'approved' ? 'approved' : 'rejected'}` })
        fetchRequisitions()
      } else {
        toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' })
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' })
    } finally {
      setActionLoading(false)
    }
  }

  // ── Update GRN Status ──────────────────────────────────────────────────────

  const updateGRNStatus = async (grnId: string, status: GRNStatus) => {
    setActionLoading(true)
    try {
      const res = await fetch('/api/purchases', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'grn',
          id: grnId,
          status,
        }),
      })
      if (res.ok) {
        toast({ title: 'Success', description: `GRN status updated to ${GRN_STATUS_CONFIG[status].label}` })
        fetchGrns()
        fetchOrders()
      } else {
        toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' })
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' })
    } finally {
      setActionLoading(false)
    }
  }

  // ── View PO Detail ─────────────────────────────────────────────────────────

  const openPODetail = (order: PurchaseOrder) => {
    setSelectedPO(order)
    setShowPODetail(true)
  }

  // ── View PR Detail ─────────────────────────────────────────────────────────

  const openPRDetail = (pr: PurchaseRequisition) => {
    setSelectedPR(pr)
    setShowPRDetail(true)
  }

  // ── View GRN Detail ────────────────────────────────────────────────────────

  const openGRNDetail = (grn: GoodsReceivedNote) => {
    setSelectedGRN(grn)
    setShowGRNDetail(true)
  }

  // ── Edit PO ────────────────────────────────────────────────────────────────

  const openEditPODialog = (order: PurchaseOrder) => {
    setEditingPO(order)
    setEditPOStatus(order.status)
    setEditPOPaymentStatus(order.paymentStatus)
    setEditPOPaymentMode(order.paymentMode || '')
    setEditPONotes(order.notes || '')
    setShowEditPO(true)
  }

  const handleEditPO = async () => {
    if (!editingPO) return
    setActionLoading(true)
    try {
      const res = await fetch('/api/purchases', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingPO.id,
          status: editPOStatus,
          paymentStatus: editPOPaymentStatus,
          paymentMode: editPOPaymentMode || null,
        }),
      })
      if (res.ok) {
        toast({ title: 'Success', description: 'Purchase order updated successfully' })
        setShowEditPO(false)
        setEditingPO(null)
        fetchOrders()
      } else {
        const data = await res.json()
        toast({ title: 'Error', description: data.error || 'Failed to update purchase order', variant: 'destructive' })
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to update purchase order', variant: 'destructive' })
    } finally {
      setActionLoading(false)
    }
  }

  // ── Edit PR ────────────────────────────────────────────────────────────────

  const openEditPRDialog = (pr: PurchaseRequisition) => {
    setEditingPR(pr)
    setEditPRStatus(pr.status)
    setEditPRPriority(pr.priority)
    setEditPRNotes(pr.notes || '')
    setShowEditPR(true)
  }

  const handleEditPR = async () => {
    if (!editingPR) return
    setActionLoading(true)
    try {
      const res = await fetch('/api/purchases', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'requisition',
          id: editingPR.id,
          status: editPRStatus,
        }),
      })
      if (res.ok) {
        toast({ title: 'Success', description: 'Requisition updated successfully' })
        setShowEditPR(false)
        setEditingPR(null)
        fetchRequisitions()
      } else {
        const data = await res.json()
        toast({ title: 'Error', description: data.error || 'Failed to update requisition', variant: 'destructive' })
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to update requisition', variant: 'destructive' })
    } finally {
      setActionLoading(false)
    }
  }

  // ── Edit GRN ───────────────────────────────────────────────────────────────

  const openEditGRNDialog = (grn: GoodsReceivedNote) => {
    setEditingGRN(grn)
    setEditGRNStatus(grn.status)
    setEditGRNNotes(grn.notes || '')
    setShowEditGRN(true)
  }

  const handleEditGRN = async () => {
    if (!editingGRN) return
    setActionLoading(true)
    try {
      const res = await fetch('/api/purchases', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'grn',
          id: editingGRN.id,
          status: editGRNStatus,
        }),
      })
      if (res.ok) {
        toast({ title: 'Success', description: 'GRN updated successfully' })
        setShowEditGRN(false)
        setEditingGRN(null)
        fetchGrns()
        fetchOrders()
      } else {
        const data = await res.json()
        toast({ title: 'Error', description: data.error || 'Failed to update GRN', variant: 'destructive' })
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to update GRN', variant: 'destructive' })
    } finally {
      setActionLoading(false)
    }
  }

  // ── Delete ─────────────────────────────────────────────────────────────────

  const openDeleteDialog = (type: 'orders' | 'requisition' | 'grn', id: string, name: string) => {
    setDeleteTarget({ type, id, name })
    setShowDeleteDialog(true)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setActionLoading(true)
    try {
      const res = await fetch('/api/purchases', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: deleteTarget.type,
          id: deleteTarget.id,
        }),
      })
      if (res.ok) {
        toast({ title: 'Success', description: `${deleteTarget.name} has been deleted` })
        if (deleteTarget.type === 'orders') fetchOrders()
        else if (deleteTarget.type === 'requisition') fetchRequisitions()
        else fetchGrns()
      } else {
        const data = await res.json()
        toast({ title: 'Error', description: data.error || 'Failed to delete', variant: 'destructive' })
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' })
    } finally {
      setActionLoading(false)
      setShowDeleteDialog(false)
      setDeleteTarget(null)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Purchase Management</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage purchase orders, requisitions & goods received</p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'orders' && canCreate && (
            <Button onClick={() => { resetPOForm(); setShowCreatePO(true) }} className="gap-2">
              <Plus className="h-4 w-4" /> New PO
            </Button>
          )}
          {activeTab === 'requisitions' && canCreate && (
            <Button onClick={() => { resetPRForm(); setShowCreatePR(true) }} className="gap-2">
              <Plus className="h-4 w-4" /> New Requisition
            </Button>
          )}
          {activeTab === 'grns' && canCreate && (
            <Button onClick={() => { resetGRNForm(); setShowCreateGRN(true) }} className="gap-2">
              <Plus className="h-4 w-4" /> New GRN
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Total Orders</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.totalOrders}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <ShoppingCart className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Pending Orders</p>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.pendingOrders}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Total Value</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{formatCurrency(stats.totalValue)}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center">
                <IndianRupee className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Received Orders</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.receivedOrders}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-950/50 flex items-center justify-center">
                <PackageCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 max-w-lg">
          <TabsTrigger value="orders" className="gap-2">
            <ShoppingCart className="h-4 w-4 hidden sm:block" /> Purchase Orders
          </TabsTrigger>
          <TabsTrigger value="requisitions" className="gap-2">
            <ClipboardList className="h-4 w-4 hidden sm:block" /> Requisitions
          </TabsTrigger>
          <TabsTrigger value="grns" className="gap-2">
            <PackageCheck className="h-4 w-4 hidden sm:block" /> GRN
          </TabsTrigger>
        </TabsList>

        {/* ═══════════════════════════════════════════════════════════════════════
            PURCHASE ORDERS TAB
        ═══════════════════════════════════════════════════════════════════════ */}
        <TabsContent value="orders" className="space-y-4">
          {/* Search */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search orders..."
                value={orderSearch}
                onChange={e => setOrderSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Orders Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>PO Number</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-center">Items</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-12 text-slate-500">
                          <ShoppingCart className="h-10 w-10 mx-auto mb-2 opacity-40" />
                          <p>No purchase orders found</p>
                          <p className="text-xs mt-1">Create your first purchase order to get started</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredOrders.map(order => (
                        <TableRow key={order.id} className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/50" onClick={() => openPODetail(order)}>
                          <TableCell className="font-medium text-slate-900 dark:text-slate-100">{order.poNumber}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium text-slate-900 dark:text-slate-100">{order.vendor.name}</p>
                              {order.vendor.phone && <p className="text-xs text-slate-500">{order.vendor.phone}</p>}
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-600 dark:text-slate-400">{formatDate(order.orderDate)}</TableCell>
                          <TableCell className="text-center">{order.items.length}</TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(order.netAmount)}</TableCell>
                          <TableCell>
                            <StatusBadge config={PO_STATUS_CONFIG[order.status]} />
                          </TableCell>
                          <TableCell>
                            <StatusBadge config={PAYMENT_STATUS_CONFIG[order.paymentStatus]} />
                          </TableCell>
                          <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openPODetail(order)}>
                                  <Eye className="h-4 w-4 mr-2" /> View Details
                                </DropdownMenuItem>
                                {canUpdate && (
                                  <DropdownMenuItem onClick={() => openEditPODialog(order)}>
                                    <Pencil className="h-4 w-4 mr-2" /> Edit
                                  </DropdownMenuItem>
                                )}
                                {order.status === 'draft' && canUpdate && (
                                  <DropdownMenuItem onClick={() => updatePOStatus(order.id, 'submitted')}>
                                    <ArrowRight className="h-4 w-4 mr-2" /> Submit
                                  </DropdownMenuItem>
                                )}
                                {order.status === 'submitted' && canUpdate && (
                                  <DropdownMenuItem onClick={() => updatePOStatus(order.id, 'approved')}>
                                    <CheckCircle2 className="h-4 w-4 mr-2" /> Approve
                                  </DropdownMenuItem>
                                )}
                                {order.status === 'approved' && canCreate && (
                                  <DropdownMenuItem onClick={() => { resetGRNForm(); setGrnPurchaseOrderId(order.id); const po = orders.find(o => o.id === order.id); if (po) { setGrnItems(po.items.map(item => ({ poItemId: item.id, itemName: item.itemName, orderedQty: item.quantity, receivedQty: '', acceptedQty: '', rejectedQty: '', unitPrice: item.unitPrice, batchNumber: '' }))); } setShowCreateGRN(true); }}>
                                    <PackageCheck className="h-4 w-4 mr-2" /> Create GRN
                                  </DropdownMenuItem>
                                )}
                                {['draft', 'submitted'].includes(order.status) && canDelete && (
                                  <DropdownMenuItem onClick={() => updatePOStatus(order.id, 'cancelled')} className="text-red-600">
                                    <XCircle className="h-4 w-4 mr-2" /> Cancel
                                  </DropdownMenuItem>
                                )}
                                {canDelete && (
                                  <DropdownMenuItem onClick={() => openDeleteDialog('orders', order.id, order.poNumber)} className="text-red-600">
                                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                                  </DropdownMenuItem>
                                )}
                                {order.paymentStatus === 'unpaid' && order.status === 'received' && canUpdate && (
                                  <DropdownMenuItem onClick={() => updatePOStatus(order.id, order.status, { paymentStatus: 'paid' })}>
                                    <CheckCircle2 className="h-4 w-4 mr-2" /> Mark as Paid
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════════════
            REQUISITIONS TAB
        ═══════════════════════════════════════════════════════════════════════ */}
        <TabsContent value="requisitions" className="space-y-4">
          {/* Search */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search requisitions..."
                value={prSearch}
                onChange={e => setPrSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Requisitions Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>PR Number</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Requested By</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequisitions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                          <ClipboardList className="h-10 w-10 mx-auto mb-2 opacity-40" />
                          <p>No requisitions found</p>
                          <p className="text-xs mt-1">Create your first requisition to get started</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredRequisitions.map(pr => (
                        <TableRow key={pr.id} className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/50" onClick={() => openPRDetail(pr)}>
                          <TableCell className="font-medium text-slate-900 dark:text-slate-100">{pr.prNumber}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium text-slate-900 dark:text-slate-100">{pr.title}</p>
                              {pr.items.length > 0 && <p className="text-xs text-slate-500">{pr.items.length} item(s)</p>}
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-600 dark:text-slate-400">{pr.requestedBy.name}</TableCell>
                          <TableCell>
                            <StatusBadge config={PR_PRIORITY_CONFIG[pr.priority]} />
                          </TableCell>
                          <TableCell>
                            <StatusBadge config={PR_STATUS_CONFIG[pr.status]} />
                          </TableCell>
                          <TableCell className="text-slate-600 dark:text-slate-400">{formatDate(pr.createdAt)}</TableCell>
                          <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openPRDetail(pr)}>
                                  <Eye className="h-4 w-4 mr-2" /> View Details
                                </DropdownMenuItem>
                                {canUpdate && (
                                  <DropdownMenuItem onClick={() => openEditPRDialog(pr)}>
                                    <Pencil className="h-4 w-4 mr-2" /> Edit
                                  </DropdownMenuItem>
                                )}
                                {pr.status === 'submitted' && canUpdate && (
                                  <>
                                    <DropdownMenuItem onClick={() => updatePRStatus(pr.id, 'approved')}>
                                      <CheckCircle2 className="h-4 w-4 mr-2" /> Approve
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => { setSelectedPR(pr); setShowRejectPR(true) }} className="text-red-600">
                                      <XCircle className="h-4 w-4 mr-2" /> Reject
                                    </DropdownMenuItem>
                                  </>
                                )}
                                {canDelete && (
                                  <DropdownMenuItem onClick={() => openDeleteDialog('requisition', pr.id, pr.prNumber)} className="text-red-600">
                                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════════════
            GRN TAB
        ═══════════════════════════════════════════════════════════════════════ */}
        <TabsContent value="grns" className="space-y-4">
          {/* Search */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search GRNs..."
                value={grnSearch}
                onChange={e => setGrnSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* GRN Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>GRN Number</TableHead>
                      <TableHead>PO Number</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Received Date</TableHead>
                      <TableHead>Invoice No.</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredGrns.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                          <PackageCheck className="h-10 w-10 mx-auto mb-2 opacity-40" />
                          <p>No goods received notes found</p>
                          <p className="text-xs mt-1">Create a GRN from an approved purchase order</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredGrns.map(grn => (
                        <TableRow key={grn.id} className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/50" onClick={() => openGRNDetail(grn)}>
                          <TableCell className="font-medium text-slate-900 dark:text-slate-100">{grn.grnNumber}</TableCell>
                          <TableCell className="text-slate-600 dark:text-slate-400">
                            {orders.find(o => o.id === grn.purchaseOrderId)?.poNumber || '—'}
                          </TableCell>
                          <TableCell className="text-slate-900 dark:text-slate-100">{grn.purchaseOrder.vendor.name}</TableCell>
                          <TableCell className="text-slate-600 dark:text-slate-400">{formatDate(grn.receivedDate)}</TableCell>
                          <TableCell className="text-slate-600 dark:text-slate-400">{grn.invoiceNumber || '—'}</TableCell>
                          <TableCell>
                            <StatusBadge config={GRN_STATUS_CONFIG[grn.status]} />
                          </TableCell>
                          <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openGRNDetail(grn)}>
                                  <Eye className="h-4 w-4 mr-2" /> View Details
                                </DropdownMenuItem>
                                {canUpdate && (
                                  <DropdownMenuItem onClick={() => openEditGRNDialog(grn)}>
                                    <Pencil className="h-4 w-4 mr-2" /> Edit
                                  </DropdownMenuItem>
                                )}
                                {grn.status === 'pending_inspection' && canUpdate && (
                                  <>
                                    <DropdownMenuItem onClick={() => updateGRNStatus(grn.id, 'accepted')}>
                                      <CheckCircle2 className="h-4 w-4 mr-2" /> Accept
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => updateGRNStatus(grn.id, 'partially_accepted')}>
                                      <Package className="h-4 w-4 mr-2" /> Partially Accept
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => updateGRNStatus(grn.id, 'rejected')} className="text-red-600">
                                      <XCircle className="h-4 w-4 mr-2" /> Reject
                                    </DropdownMenuItem>
                                  </>
                                )}
                                {canDelete && (
                                  <DropdownMenuItem onClick={() => openDeleteDialog('grn', grn.id, grn.grnNumber)} className="text-red-600">
                                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ═══════════════════════════════════════════════════════════════════════
          CREATE PO DIALOG
      ═══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={showCreatePO} onOpenChange={setShowCreatePO}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Purchase Order</DialogTitle>
            <DialogDescription>Add vendor and items to create a new purchase order</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Vendor & Delivery */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Vendor *</Label>
                <Select value={poVendorId} onValueChange={setPoVendorId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendors.map(v => (
                      <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Expected Delivery</Label>
                <Input type="date" value={poExpectedDelivery} onChange={e => setPoExpectedDelivery(e.target.value)} />
              </div>
            </div>

            {/* Items */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Items</Label>
                <Button type="button" variant="outline" size="sm" onClick={addPOItem} className="gap-1">
                  <Plus className="h-3.5 w-3.5" /> Add Item
                </Button>
              </div>

              <div className="space-y-3">
                {poItems.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                    {/* Item select or name */}
                    <div className="col-span-12 sm:col-span-3 space-y-1">
                      <Label className="text-xs">Item</Label>
                      <Select value={item.itemId} onValueChange={val => handlePOItemSelect(idx, val)}>
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue placeholder="Select or type" />
                        </SelectTrigger>
                        <SelectContent>
                          {inventoryItems.map(inv => (
                            <SelectItem key={inv.id} value={inv.id}>{inv.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {!item.itemId && (
                        <Input
                          placeholder="Item name"
                          value={item.itemName}
                          onChange={e => updatePOItem(idx, 'itemName', e.target.value)}
                          className="h-9 text-sm"
                        />
                      )}
                    </div>

                    {/* Quantity */}
                    <div className="col-span-4 sm:col-span-2 space-y-1">
                      <Label className="text-xs">Qty</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={item.quantity}
                        onChange={e => updatePOItem(idx, 'quantity', e.target.value)}
                        className="h-9 text-sm"
                        min="0"
                      />
                    </div>

                    {/* Unit */}
                    <div className="col-span-4 sm:col-span-1 space-y-1">
                      <Label className="text-xs">Unit</Label>
                      <Select value={item.unit} onValueChange={val => updatePOItem(idx, 'unit', val)}>
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {UNITS.map(u => (
                            <SelectItem key={u} value={u}>{u}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Unit Price */}
                    <div className="col-span-4 sm:col-span-2 space-y-1">
                      <Label className="text-xs">Unit Price</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={item.unitPrice}
                        onChange={e => updatePOItem(idx, 'unitPrice', e.target.value)}
                        className="h-9 text-sm"
                        min="0"
                      />
                    </div>

                    {/* GST Rate */}
                    <div className="col-span-4 sm:col-span-1 space-y-1">
                      <Label className="text-xs">GST %</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={item.gstRate}
                        onChange={e => updatePOItem(idx, 'gstRate', e.target.value)}
                        className="h-9 text-sm"
                        min="0"
                      />
                    </div>

                    {/* Total Price */}
                    <div className="col-span-4 sm:col-span-2 space-y-1">
                      <Label className="text-xs">Total</Label>
                      <div className="h-9 px-3 flex items-center rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium">
                        {formatCurrency(item.totalPrice)}
                      </div>
                    </div>

                    {/* Remove */}
                    <div className="col-span-4 sm:col-span-1 flex items-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50"
                        onClick={() => removePOItem(idx)}
                        disabled={poItems.length <= 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-4 space-y-2 bg-slate-50 dark:bg-slate-900/50">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">Subtotal</span>
                <span className="font-medium">{formatCurrency(poSubtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">GST</span>
                <span className="font-medium">{formatCurrency(poGstTotal)}</span>
              </div>
              <div className="flex items-center justify-between text-sm gap-3">
                <span className="text-slate-600 dark:text-slate-400">Discount</span>
                <Input
                  type="number"
                  placeholder="0"
                  value={poDiscount}
                  onChange={e => setPoDiscount(e.target.value)}
                  className="h-8 w-32 text-sm text-right"
                  min="0"
                />
              </div>
              <Separator />
              <div className="flex justify-between text-base font-semibold">
                <span>Net Total</span>
                <span className="text-emerald-600 dark:text-emerald-400">{formatCurrency(poNetTotal)}</span>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Additional notes or terms..."
                value={poNotes}
                onChange={e => setPoNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreatePO(false)} disabled={actionLoading}>Cancel</Button>
            <Button onClick={handleCreatePO} disabled={actionLoading}>
              {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create PO
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════════════
          PO DETAIL DIALOG
      ═══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={showPODetail} onOpenChange={setShowPODetail}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedPO?.poNumber}
              {selectedPO && <StatusBadge config={PO_STATUS_CONFIG[selectedPO.status]} />}
            </DialogTitle>
            <DialogDescription>Purchase order details</DialogDescription>
          </DialogHeader>

          {selectedPO && (
            <div className="space-y-6 py-4">
              {/* Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Vendor</p>
                  <p className="font-medium text-slate-900 dark:text-slate-100">{selectedPO.vendor.name}</p>
                  {selectedPO.vendor.phone && <p className="text-xs text-slate-500">{selectedPO.vendor.phone}</p>}
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Order Date</p>
                  <p className="font-medium text-slate-900 dark:text-slate-100">{formatDate(selectedPO.orderDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Created By</p>
                  <p className="font-medium text-slate-900 dark:text-slate-100">{selectedPO.createdBy.name}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Payment Status</p>
                  <StatusBadge config={PAYMENT_STATUS_CONFIG[selectedPO.paymentStatus]} />
                </div>
              </div>

              {selectedPO.expectedDelivery && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Expected Delivery</p>
                    <p className="font-medium text-slate-900 dark:text-slate-100">{formatDate(selectedPO.expectedDelivery)}</p>
                  </div>
                </div>
              )}

              {/* Items Table */}
              <div className="space-y-2">
                <h4 className="font-semibold text-slate-900 dark:text-slate-100">Items</h4>
                <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead>Unit</TableHead>
                        <TableHead className="text-right">Unit Price</TableHead>
                        <TableHead className="text-right">GST %</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">Received</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedPO.items.map(item => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium text-slate-900 dark:text-slate-100">
                            {item.itemName}
                            {item.item && <p className="text-xs text-slate-500">{item.item.name}</p>}
                          </TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell>{item.unit}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                          <TableCell className="text-right">{item.gstRate}%</TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(item.totalPrice)}</TableCell>
                          <TableCell className="text-right">{item.receivedQty}/{item.quantity}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {item.status === 'pending' ? 'Pending' :
                               item.status === 'partially_received' ? 'Partial' :
                               item.status === 'received' ? 'Received' :
                               item.status === 'returned' ? 'Returned' : item.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Totals */}
              <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-4 space-y-2 bg-slate-50 dark:bg-slate-900/50">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Subtotal</span>
                  <span>{formatCurrency(selectedPO.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">GST</span>
                  <span>{formatCurrency(selectedPO.gstAmount)}</span>
                </div>
                {selectedPO.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Discount</span>
                    <span>-{formatCurrency(selectedPO.discount)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-base font-semibold">
                  <span>Net Amount</span>
                  <span className="text-emerald-600 dark:text-emerald-400">{formatCurrency(selectedPO.netAmount)}</span>
                </div>
              </div>

              {/* GRN History */}
              {selectedPO._count.goodsReceivedNotes > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                    GRN History ({selectedPO._count.goodsReceivedNotes})
                  </h4>
                  <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 bg-slate-50 dark:bg-slate-900/50">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {selectedPO._count.goodsReceivedNotes} goods received note(s) have been created for this purchase order.
                    </p>
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedPO.notes && (
                <div className="space-y-1">
                  <h4 className="font-semibold text-slate-900 dark:text-slate-100">Notes</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3">
                    {selectedPO.notes}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-2">
                {selectedPO.status === 'draft' && (
                  <Button onClick={() => { updatePOStatus(selectedPO.id, 'submitted'); setShowPODetail(false); }} disabled={actionLoading}>
                    <ArrowRight className="h-4 w-4 mr-2" /> Submit
                  </Button>
                )}
                {selectedPO.status === 'submitted' && (
                  <Button onClick={() => { updatePOStatus(selectedPO.id, 'approved'); setShowPODetail(false); }} disabled={actionLoading}>
                    <CheckCircle2 className="h-4 w-4 mr-2" /> Approve
                  </Button>
                )}
                {selectedPO.status === 'approved' && (
                  <Button onClick={() => {
                    resetGRNForm()
                    setGrnPurchaseOrderId(selectedPO.id)
                    setGrnItems(selectedPO.items.map(item => ({
                      poItemId: item.id,
                      itemName: item.itemName,
                      orderedQty: item.quantity,
                      receivedQty: '',
                      acceptedQty: '',
                      rejectedQty: '',
                      unitPrice: item.unitPrice,
                      batchNumber: '',
                    })))
                    setShowPODetail(false)
                    setShowCreateGRN(true)
                  }} disabled={actionLoading}>
                    <PackageCheck className="h-4 w-4 mr-2" /> Create GRN
                  </Button>
                )}
                {selectedPO.paymentStatus === 'unpaid' && selectedPO.status === 'received' && (
                  <Button onClick={() => { updatePOStatus(selectedPO.id, selectedPO.status, { paymentStatus: 'paid' }); setShowPODetail(false); }} variant="outline" disabled={actionLoading}>
                    <CheckCircle2 className="h-4 w-4 mr-2" /> Mark as Paid
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════════════
          CREATE REQUISITION DIALOG
      ═══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={showCreatePR} onOpenChange={setShowCreatePR}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Purchase Requisition</DialogTitle>
            <DialogDescription>Request items for purchase with details and priority</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Title & Priority */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input
                  placeholder="Requisition title"
                  value={prTitle}
                  onChange={e => setPrTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={prPriority} onValueChange={val => setPrPriority(val as PRPriority)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Describe the requisition..."
                value={prDescription}
                onChange={e => setPrDescription(e.target.value)}
                rows={3}
              />
            </div>

            {/* Required By */}
            <div className="space-y-2 max-w-xs">
              <Label>Required By</Label>
              <Input
                type="date"
                value={prRequiredBy}
                onChange={e => setPrRequiredBy(e.target.value)}
              />
            </div>

            {/* Items */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Items</Label>
                <Button type="button" variant="outline" size="sm" onClick={addPRItem} className="gap-1">
                  <Plus className="h-3.5 w-3.5" /> Add Item
                </Button>
              </div>

              <div className="space-y-3">
                {prItems.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                    <div className="col-span-12 sm:col-span-4 space-y-1">
                      <Label className="text-xs">Item Name</Label>
                      <Input
                        placeholder="Item name"
                        value={item.itemName}
                        onChange={e => updatePRItem(idx, 'itemName', e.target.value)}
                        className="h-9 text-sm"
                      />
                    </div>
                    <div className="col-span-6 sm:col-span-2 space-y-1">
                      <Label className="text-xs">Qty</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={item.quantity}
                        onChange={e => updatePRItem(idx, 'quantity', e.target.value)}
                        className="h-9 text-sm"
                        min="0"
                      />
                    </div>
                    <div className="col-span-6 sm:col-span-2 space-y-1">
                      <Label className="text-xs">Unit</Label>
                      <Select value={item.unit} onValueChange={val => updatePRItem(idx, 'unit', val)}>
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {UNITS.map(u => (
                            <SelectItem key={u} value={u}>{u}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-6 sm:col-span-3 space-y-1">
                      <Label className="text-xs">Est. Price</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={item.estimatedPrice}
                        onChange={e => updatePRItem(idx, 'estimatedPrice', e.target.value)}
                        className="h-9 text-sm"
                        min="0"
                      />
                    </div>
                    <div className="col-span-6 sm:col-span-1 flex items-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50"
                        onClick={() => removePRItem(idx)}
                        disabled={prItems.length <= 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Additional notes..."
                value={prNotes}
                onChange={e => setPrNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreatePR(false)} disabled={actionLoading}>Cancel</Button>
            <Button onClick={handleCreatePR} disabled={actionLoading}>
              {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Requisition
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════════════
          PR DETAIL DIALOG
      ═══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={showPRDetail} onOpenChange={setShowPRDetail}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedPR?.prNumber}
              {selectedPR && <StatusBadge config={PR_STATUS_CONFIG[selectedPR.status]} />}
            </DialogTitle>
            <DialogDescription>{selectedPR?.title}</DialogDescription>
          </DialogHeader>

          {selectedPR && (
            <div className="space-y-6 py-4">
              {/* Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Requested By</p>
                  <p className="font-medium text-slate-900 dark:text-slate-100">{selectedPR.requestedBy.name}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Priority</p>
                  <StatusBadge config={PR_PRIORITY_CONFIG[selectedPR.priority]} />
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Required By</p>
                  <p className="font-medium text-slate-900 dark:text-slate-100">{formatDate(selectedPR.requiredBy)}</p>
                </div>
                {selectedPR.approvedBy && (
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Approved By</p>
                    <p className="font-medium text-slate-900 dark:text-slate-100">{selectedPR.approvedBy.name}</p>
                  </div>
                )}
              </div>

              {/* Description */}
              {selectedPR.description && (
                <div className="space-y-1">
                  <h4 className="font-semibold text-slate-900 dark:text-slate-100">Description</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3">
                    {selectedPR.description}
                  </p>
                </div>
              )}

              {/* Items Table */}
              <div className="space-y-2">
                <h4 className="font-semibold text-slate-900 dark:text-slate-100">Items</h4>
                <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead>Unit</TableHead>
                        <TableHead className="text-right">Est. Price</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedPR.items.map(item => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <p className="font-medium text-slate-900 dark:text-slate-100">{item.itemName}</p>
                            {item.description && <p className="text-xs text-slate-500">{item.description}</p>}
                          </TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell>{item.unit}</TableCell>
                          <TableCell className="text-right">{item.estimatedPrice ? formatCurrency(item.estimatedPrice) : '—'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Notes */}
              {selectedPR.notes && (
                <div className="space-y-1">
                  <h4 className="font-semibold text-slate-900 dark:text-slate-100">Notes</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3">
                    {selectedPR.notes}
                  </p>
                </div>
              )}

              {/* Actions */}
              {selectedPR.status === 'submitted' && (
                <div className="flex gap-2 pt-2">
                  <Button onClick={() => { updatePRStatus(selectedPR.id, 'approved'); setShowPRDetail(false); }} disabled={actionLoading}>
                    <CheckCircle2 className="h-4 w-4 mr-2" /> Approve
                  </Button>
                  <Button variant="destructive" onClick={() => { setShowPRDetail(false); setSelectedPR(selectedPR); setShowRejectPR(true); }} disabled={actionLoading}>
                    <XCircle className="h-4 w-4 mr-2" /> Reject
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════════════
          REJECT PR CONFIRMATION
      ═══════════════════════════════════════════════════════════════════════ */}
      <AlertDialog open={showRejectPR} onOpenChange={setShowRejectPR}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Requisition</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject requisition {selectedPR?.prNumber}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedPR) {
                  updatePRStatus(selectedPR.id, 'rejected')
                  setShowRejectPR(false)
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ═══════════════════════════════════════════════════════════════════════
          CREATE GRN DIALOG
      ═══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={showCreateGRN} onOpenChange={setShowCreateGRN}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Goods Received Note</DialogTitle>
            <DialogDescription>Record received items against a purchase order</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* PO Selection & Invoice */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Purchase Order *</Label>
                <Select value={grnPurchaseOrderId} onValueChange={handleGRNPOSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select purchase order" />
                  </SelectTrigger>
                  <SelectContent>
                    {approvedOrders.map(o => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.poNumber} — {o.vendor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Invoice Number</Label>
                <Input
                  placeholder="Invoice number"
                  value={grnInvoiceNumber}
                  onChange={e => setGrnInvoiceNumber(e.target.value)}
                />
              </div>
            </div>

            {/* PO Info */}
            {selectedPOForGRN && (
              <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 bg-slate-50 dark:bg-slate-900/50 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Vendor</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">{selectedPOForGRN.vendor.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">PO Amount</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">{formatCurrency(selectedPOForGRN.netAmount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Items</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">{selectedPOForGRN.items.length}</span>
                </div>
              </div>
            )}

            {/* Items - Received Quantities */}
            {grnItems.length > 0 && (
              <div className="space-y-3">
                <Label className="text-base font-semibold">Received Items</Label>
                <div className="space-y-3">
                  {grnItems.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                      <div className="col-span-12 sm:col-span-3 space-y-1">
                        <Label className="text-xs">Item</Label>
                        <div className="h-9 px-3 flex items-center rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm">
                          {item.itemName}
                        </div>
                      </div>
                      <div className="col-span-4 sm:col-span-2 space-y-1">
                        <Label className="text-xs">Ordered</Label>
                        <div className="h-9 px-3 flex items-center rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm">
                          {item.orderedQty}
                        </div>
                      </div>
                      <div className="col-span-4 sm:col-span-2 space-y-1">
                        <Label className="text-xs">Received Qty *</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={item.receivedQty}
                          onChange={e => updateGRNItem(idx, 'receivedQty', e.target.value)}
                          className="h-9 text-sm"
                          min="0"
                        />
                      </div>
                      <div className="col-span-4 sm:col-span-2 space-y-1">
                        <Label className="text-xs">Accepted</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={item.acceptedQty}
                          onChange={e => updateGRNItem(idx, 'acceptedQty', e.target.value)}
                          className="h-9 text-sm"
                          min="0"
                        />
                      </div>
                      <div className="col-span-4 sm:col-span-2 space-y-1">
                        <Label className="text-xs">Rejected</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={item.rejectedQty}
                          onChange={e => updateGRNItem(idx, 'rejectedQty', e.target.value)}
                          className="h-9 text-sm"
                          min="0"
                        />
                      </div>
                      <div className="col-span-4 sm:col-span-1 space-y-1">
                        <Label className="text-xs">Batch</Label>
                        <Input
                          placeholder="—"
                          value={item.batchNumber}
                          onChange={e => updateGRNItem(idx, 'batchNumber', e.target.value)}
                          className="h-9 text-sm"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Additional notes about delivery..."
                value={grnNotes}
                onChange={e => setGrnNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateGRN(false)} disabled={actionLoading}>Cancel</Button>
            <Button onClick={handleCreateGRN} disabled={actionLoading || grnItems.length === 0}>
              {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create GRN
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════════════
          GRN DETAIL DIALOG
      ═══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={showGRNDetail} onOpenChange={setShowGRNDetail}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedGRN?.grnNumber}
              {selectedGRN && <StatusBadge config={GRN_STATUS_CONFIG[selectedGRN.status]} />}
            </DialogTitle>
            <DialogDescription>Goods Received Note details</DialogDescription>
          </DialogHeader>

          {selectedGRN && (
            <div className="space-y-6 py-4">
              {/* Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">PO Number</p>
                  <p className="font-medium text-slate-900 dark:text-slate-100">
                    {orders.find(o => o.id === selectedGRN.purchaseOrderId)?.poNumber || '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Vendor</p>
                  <p className="font-medium text-slate-900 dark:text-slate-100">{selectedGRN.purchaseOrder.vendor.name}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Received By</p>
                  <p className="font-medium text-slate-900 dark:text-slate-100">{selectedGRN.receivedBy.name}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Received Date</p>
                  <p className="font-medium text-slate-900 dark:text-slate-100">{formatDate(selectedGRN.receivedDate)}</p>
                </div>
                {selectedGRN.invoiceNumber && (
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Invoice Number</p>
                    <p className="font-medium text-slate-900 dark:text-slate-100">{selectedGRN.invoiceNumber}</p>
                  </div>
                )}
              </div>

              {/* Items Table */}
              <div className="space-y-2">
                <h4 className="font-semibold text-slate-900 dark:text-slate-100">Items</h4>
                <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead className="text-right">Ordered</TableHead>
                        <TableHead className="text-right">Received</TableHead>
                        <TableHead className="text-right">Accepted</TableHead>
                        <TableHead className="text-right">Rejected</TableHead>
                        <TableHead className="text-right">Unit Price</TableHead>
                        <TableHead>Batch</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedGRN.items.map(item => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium text-slate-900 dark:text-slate-100">{item.itemName}</TableCell>
                          <TableCell className="text-right">{item.orderedQty}</TableCell>
                          <TableCell className="text-right">{item.receivedQty}</TableCell>
                          <TableCell className="text-right text-emerald-600 dark:text-emerald-400 font-medium">{item.acceptedQty}</TableCell>
                          <TableCell className="text-right text-red-600 dark:text-red-400">{item.rejectedQty}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                          <TableCell>{item.batchNumber || '—'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Notes */}
              {selectedGRN.notes && (
                <div className="space-y-1">
                  <h4 className="font-semibold text-slate-900 dark:text-slate-100">Notes</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3">
                    {selectedGRN.notes}
                  </p>
                </div>
              )}

              {/* Actions */}
              {selectedGRN.status === 'pending_inspection' && (
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button onClick={() => { updateGRNStatus(selectedGRN.id, 'accepted'); setShowGRNDetail(false); }} disabled={actionLoading}>
                    <CheckCircle2 className="h-4 w-4 mr-2" /> Accept All
                  </Button>
                  <Button variant="outline" onClick={() => { updateGRNStatus(selectedGRN.id, 'partially_accepted'); setShowGRNDetail(false); }} disabled={actionLoading}>
                    <Package className="h-4 w-4 mr-2" /> Partially Accept
                  </Button>
                  <Button variant="destructive" onClick={() => { updateGRNStatus(selectedGRN.id, 'rejected'); setShowGRNDetail(false); }} disabled={actionLoading}>
                    <XCircle className="h-4 w-4 mr-2" /> Reject
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════════════
          EDIT PO DIALOG
      ═══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={showEditPO} onOpenChange={setShowEditPO}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Purchase Order</DialogTitle>
            <DialogDescription>Update purchase order details for {editingPO?.poNumber}</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Read-only info */}
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 bg-slate-50 dark:bg-slate-900/50 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">PO Number</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">{editingPO?.poNumber}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">Vendor</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">{editingPO?.vendor.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">Net Amount</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">{editingPO ? formatCurrency(editingPO.netAmount) : '—'}</span>
              </div>
            </div>

            {/* Editable fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={editPOStatus} onValueChange={val => setEditPOStatus(val as POStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="partially_received">Partially Received</SelectItem>
                    <SelectItem value="received">Received</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Payment Status</Label>
                <Select value={editPOPaymentStatus} onValueChange={val => setEditPOPaymentStatus(val as PaymentStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unpaid">Unpaid</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Payment Mode</Label>
                <Select value={editPOPaymentMode} onValueChange={setEditPOPaymentMode}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="credit">Credit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Additional notes or terms..."
                value={editPONotes}
                onChange={e => setEditPONotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditPO(false)} disabled={actionLoading}>Cancel</Button>
            <Button onClick={handleEditPO} disabled={actionLoading}>
              {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Update PO
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════════════
          EDIT PR DIALOG
      ═══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={showEditPR} onOpenChange={setShowEditPR}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Requisition</DialogTitle>
            <DialogDescription>Update requisition details for {editingPR?.prNumber}</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Read-only info */}
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 bg-slate-50 dark:bg-slate-900/50 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">PR Number</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">{editingPR?.prNumber}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">Title</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">{editingPR?.title}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">Requested By</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">{editingPR?.requestedBy.name}</span>
              </div>
            </div>

            {/* Editable fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={editPRStatus} onValueChange={val => setEditPRStatus(val as PRStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="converted">Converted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={editPRPriority} onValueChange={val => setEditPRPriority(val as PRPriority)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Additional notes..."
                value={editPRNotes}
                onChange={e => setEditPRNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditPR(false)} disabled={actionLoading}>Cancel</Button>
            <Button onClick={handleEditPR} disabled={actionLoading}>
              {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Update Requisition
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════════════
          EDIT GRN DIALOG
      ═══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={showEditGRN} onOpenChange={setShowEditGRN}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit GRN</DialogTitle>
            <DialogDescription>Update GRN details for {editingGRN?.grnNumber}</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Read-only info */}
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 bg-slate-50 dark:bg-slate-900/50 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">GRN Number</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">{editingGRN?.grnNumber}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">Vendor</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">{editingGRN?.purchaseOrder.vendor.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">Received By</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">{editingGRN?.receivedBy.name}</span>
              </div>
            </div>

            {/* Editable fields */}
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={editGRNStatus} onValueChange={val => setEditGRNStatus(val as GRNStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending_inspection">Pending Inspection</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="partially_accepted">Partially Accepted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Additional notes..."
                value={editGRNNotes}
                onChange={e => setEditGRNNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditGRN(false)} disabled={actionLoading}>Cancel</Button>
            <Button onClick={handleEditGRN} disabled={actionLoading}>
              {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Update GRN
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════════════
          DELETE CONFIRMATION
      ═══════════════════════════════════════════════════════════════════════ */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.name}</strong>?
              {deleteTarget?.type === 'orders' && ' Only draft or cancelled purchase orders can be deleted.'}
              {deleteTarget?.type === 'requisition' && ' Only draft, cancelled, or rejected requisitions can be deleted.'}
              {deleteTarget?.type === 'grn' && ' Only pending inspection or rejected GRNs can be deleted.'}
              {' '}This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={actionLoading}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
