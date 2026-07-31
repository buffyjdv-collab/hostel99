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
  Package,
  Wrench,
  IndianRupee,
  Plus,
  Search,
  MoreVertical,
  Loader2,
  Edit3,
  Trash2,
  Shirt,
  SprayCan,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRightLeft,
  ArrowDownToLine,
  ArrowUpFromLine,
  RefreshCw,
  Database,
  Activity,
  ShieldAlert,
  Tag,
  Bed,
  Zap,
  Monitor,
  Refrigerator,
  CookingPot,
  HelpCircle,
  Droplets,
  Bath,
  Curtain,
  Sparkles,
  Hammer,
  ShoppingCart,
  PackageCheck,
  TrendingDown,
} from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────────

type AssetCondition = 'excellent' | 'good' | 'fair' | 'poor' | 'broken'
type AssetStatus = 'active' | 'under_maintenance' | 'disposed' | 'lost'
type AssetCategory = 'furniture' | 'electrical' | 'electronics' | 'appliance' | 'kitchen_equipment' | 'other'

type LaundryCategory = 'bedding' | 'bathroom' | 'curtain' | 'other'
type LaundryCondition = 'excellent' | 'good' | 'fair' | 'poor' | 'broken'
type LaundryStatus = 'in_use' | 'in_laundry' | 'stored' | 'damaged' | 'disposed'

type HousekeepingCategory = 'cleaning' | 'hygiene' | 'tool' | 'other'
type HousekeepingStatus = 'in_stock' | 'low_stock' | 'out_of_stock'

interface RoomInfo {
  id: string
  name: string
  number: string
}

interface AssetItem {
  id: string
  name: string
  assetTag: string | null
  category: string
  subCategory: string | null
  room: RoomInfo | null
  purchaseDate: string | null
  purchasePrice: number | null
  currentValue: number | null
  depreciationRate: number | null
  vendor: string | null
  warrantyExpiry: string | null
  status: AssetStatus
  condition: AssetCondition
  assignedTo: string | null
  lastMaintenance: string | null
  nextMaintenance: string | null
  notes: string | null
}

interface AssetStats {
  total: number
  active: number
  underMaintenance: number
  disposed: number
  totalValue: number
  byCategory: Record<string, number>
}

interface LaundryItemData {
  id: string
  name: string
  category: LaundryCategory
  room: RoomInfo | null
  totalQuantity: number
  issuedQuantity: number
  inLaundry: number
  damagedQuantity: number
  condition: LaundryCondition
  lastWashDate: string | null
  nextWashDate: string | null
  status: LaundryStatus
  notes: string | null
}

interface LaundryStats {
  totalItems: number
  inUse: number
  inLaundry: number
  damaged: number
}

interface HousekeepingItemData {
  id: string
  name: string
  category: HousekeepingCategory
  unit: string
  currentStock: number
  minStock: number
  unitPrice: number
  lastRestocked: string | null
  nextRestock: string | null
  isActive: boolean
  notes: string | null
}

interface HousekeepingStats {
  totalItems: number
  lowStock: number
  totalValue: number
}

// ── Constants ────────────────────────────────────────────────────────────────

const ASSET_CATEGORIES: { value: AssetCategory; label: string; icon: React.ReactNode }[] = [
  { value: 'furniture', label: 'Furniture', icon: <Bed className="h-3.5 w-3.5" /> },
  { value: 'electrical', label: 'Electrical', icon: <Zap className="h-3.5 w-3.5" /> },
  { value: 'electronics', label: 'Electronics', icon: <Monitor className="h-3.5 w-3.5" /> },
  { value: 'appliance', label: 'Appliance', icon: <Refrigerator className="h-3.5 w-3.5" /> },
  { value: 'kitchen_equipment', label: 'Kitchen Equipment', icon: <CookingPot className="h-3.5 w-3.5" /> },
  { value: 'other', label: 'Other', icon: <HelpCircle className="h-3.5 w-3.5" /> },
]

const ASSET_SUB_CATEGORIES: Record<string, string[]> = {
  furniture: ['bed', 'mattress', 'chair', 'table', 'sofa', 'cupboard', 'shelf', 'desk', 'other'],
  electrical: ['fan', 'ac', 'geyser', 'water_cooler', 'heater', 'inverter', 'other'],
  electronics: ['tv', 'router', 'cctv', 'intercom', 'music_system', 'other'],
  appliance: ['washing_machine', 'refrigerator', 'microwave', 'iron', 'vacuum_cleaner', 'other'],
  kitchen_equipment: ['gas_stove', 'mixer', 'water_purifier', 'chimney', 'toaster', 'other'],
  other: ['other'],
}

const LAUNDRY_CATEGORIES: { value: LaundryCategory; label: string }[] = [
  { value: 'bedding', label: 'Bedding' },
  { value: 'bathroom', label: 'Bathroom' },
  { value: 'curtain', label: 'Curtain' },
  { value: 'other', label: 'Other' },
]

const HOUSEKEEPING_CATEGORIES: { value: HousekeepingCategory; label: string }[] = [
  { value: 'cleaning', label: 'Cleaning' },
  { value: 'hygiene', label: 'Hygiene' },
  { value: 'tool', label: 'Tool' },
  { value: 'other', label: 'Other' },
]

const HOUSEKEEPING_UNITS = ['pcs', 'pack', 'l', 'kg', 'ml', 'g', 'roll', 'box', 'bottle', 'can']

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(value: number | null | undefined): string {
  if (value == null) return '—'
  return '₹' + value.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return '—'
  }
}

function isWarrantyExpiringSoon(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false
  const expiry = new Date(dateStr)
  const now = new Date()
  const diffDays = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  return diffDays > 0 && diffDays <= 90
}

function isWarrantyExpired(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false
  return new Date(dateStr) < new Date()
}

function getConditionBadge(condition: string) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    excellent: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-800 dark:text-emerald-300', label: 'Excellent' },
    good: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-300', label: 'Good' },
    fair: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-800 dark:text-amber-300', label: 'Fair' },
    poor: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-800 dark:text-orange-300', label: 'Poor' },
    broken: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-300', label: 'Broken' },
  }
  const c = map[condition] || map.good
  return (
    <Badge variant="secondary" className={`${c.bg} ${c.text} border-0 font-medium`}>
      {c.label}
    </Badge>
  )
}

function getAssetStatusBadge(status: string) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    active: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-800 dark:text-emerald-300', label: 'Active' },
    under_maintenance: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-800 dark:text-amber-300', label: 'Maintenance' },
    disposed: { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-700 dark:text-slate-300', label: 'Disposed' },
    lost: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-300', label: 'Lost' },
  }
  const c = map[status] || map.active
  return (
    <Badge variant="secondary" className={`${c.bg} ${c.text} border-0 font-medium`}>
      {c.label}
    </Badge>
  )
}

function getLaundryStatusBadge(status: string) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    in_use: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-800 dark:text-emerald-300', label: 'In Use' },
    in_laundry: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-300', label: 'In Laundry' },
    stored: { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-700 dark:text-slate-300', label: 'Stored' },
    damaged: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-300', label: 'Damaged' },
    disposed: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-800 dark:text-orange-300', label: 'Disposed' },
  }
  const c = map[status] || map.in_use
  return (
    <Badge variant="secondary" className={`${c.bg} ${c.text} border-0 font-medium`}>
      {c.label}
    </Badge>
  )
}

function getHousekeepingStatusBadge(item: HousekeepingItemData) {
  if (item.currentStock <= 0) {
    return <Badge variant="secondary" className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-0 font-medium">Out of Stock</Badge>
  }
  if (item.currentStock <= item.minStock) {
    return <Badge variant="secondary" className="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border-0 font-medium">Low Stock</Badge>
  }
  return <Badge variant="secondary" className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 border-0 font-medium">In Stock</Badge>
}

function getCategoryLabel(category: string): string {
  const map: Record<string, string> = {
    furniture: 'Furniture',
    electrical: 'Electrical',
    electronics: 'Electronics',
    appliance: 'Appliance',
    kitchen_equipment: 'Kitchen Equipment',
    bedding: 'Bedding',
    bathroom: 'Bathroom',
    curtain: 'Curtain',
    cleaning: 'Cleaning',
    hygiene: 'Hygiene',
    tool: 'Tool',
    other: 'Other',
  }
  return map[category] || category
}

function getSubCategoryLabel(sub: string): string {
  return sub.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
}

// ── Main Component ───────────────────────────────────────────────────────────

export function AssetsPage() {
  const { selectedPropertyId, currentHostelId, currentUser } = useAppStore()
  const { toast } = useToast()

  const role = currentUser?.role || ''
  const canCreate = hasPermission(role, 'assets:create')
  const canUpdate = hasPermission(role, 'assets:update')
  const canDelete = hasPermission(role, 'assets:delete')

  // Active tab
  const [activeTab, setActiveTab] = useState<string>('assets')

  // Loading states
  const [assetsLoading, setAssetsLoading] = useState(true)
  const [laundryLoading, setLaundryLoading] = useState(true)
  const [housekeepingLoading, setHousekeepingLoading] = useState(true)
  const [roomsLoading, setRoomsLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  // Data
  const [assets, setAssets] = useState<AssetItem[]>([])
  const [assetStats, setAssetStats] = useState<AssetStats>({ total: 0, active: 0, underMaintenance: 0, disposed: 0, totalValue: 0, byCategory: {} })
  const [laundry, setLaundry] = useState<LaundryItemData[]>([])
  const [laundryStats, setLaundryStats] = useState<LaundryStats>({ totalItems: 0, inUse: 0, inLaundry: 0, damaged: 0 })
  const [housekeeping, setHousekeeping] = useState<HousekeepingItemData[]>([])
  const [housekeepingStats, setHousekeepingStats] = useState<HousekeepingStats>({ totalItems: 0, lowStock: 0, totalValue: 0 })
  const [rooms, setRooms] = useState<RoomInfo[]>([])

  // Filters
  const [assetSearch, setAssetSearch] = useState('')
  const [assetCategoryFilter, setAssetCategoryFilter] = useState<string>('all')
  const [laundrySearch, setLaundrySearch] = useState('')
  const [housekeepingSearch, setHousekeepingSearch] = useState('')

  // Dialogs
  const [assetDialogOpen, setAssetDialogOpen] = useState(false)
  const [editAssetDialogOpen, setEditAssetDialogOpen] = useState(false)
  const [laundryDialogOpen, setLaundryDialogOpen] = useState(false)
  const [editLaundryDialogOpen, setEditLaundryDialogOpen] = useState(false)
  const [housekeepingDialogOpen, setHousekeepingDialogOpen] = useState(false)
  const [restockDialogOpen, setRestockDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  // Form data
  const [selectedAsset, setSelectedAsset] = useState<AssetItem | null>(null)
  const [selectedLaundry, setSelectedLaundry] = useState<LaundryItemData | null>(null)
  const [selectedHousekeeping, setSelectedHousekeeping] = useState<HousekeepingItemData | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'asset' | 'laundry' | 'housekeeping'; id: string; name: string } | null>(null)

  // Asset form
  const [assetForm, setAssetForm] = useState({
    name: '',
    assetTag: '',
    category: 'furniture' as AssetCategory,
    subCategory: '',
    roomId: '',
    purchaseDate: '',
    purchasePrice: '',
    currentValue: '',
    depreciationRate: '',
    vendor: '',
    warrantyExpiry: '',
    condition: 'good' as AssetCondition,
    assignedTo: '',
    notes: '',
    status: 'active' as AssetStatus,
  })

  // Laundry form
  const [laundryForm, setLaundryForm] = useState({
    name: '',
    category: 'bedding' as LaundryCategory,
    roomId: '',
    totalQuantity: '',
    issuedQuantity: '',
    condition: 'good' as LaundryCondition,
    notes: '',
  })

  // Edit laundry form
  const [editLaundryForm, setEditLaundryForm] = useState({
    id: '',
    name: '',
    category: 'bedding' as LaundryCategory,
    roomId: '',
    totalQuantity: '',
    issuedQuantity: '',
    inLaundry: '',
    damagedQuantity: '',
    condition: 'good' as LaundryCondition,
    status: 'in_use' as LaundryStatus,
    notes: '',
  })

  // Housekeeping form
  const [housekeepingForm, setHousekeepingForm] = useState({
    name: '',
    category: 'cleaning' as HousekeepingCategory,
    unit: 'pcs',
    currentStock: '',
    minStock: '',
    unitPrice: '',
    notes: '',
  })

  // Restock form
  const [restockForm, setRestockForm] = useState({
    id: '',
    name: '',
    currentStock: 0,
    addQuantity: '',
    unitPrice: '',
  })

  // ── Data Fetching ──────────────────────────────────────────────────────────

  const fetchAssets = useCallback(async () => {
    setAssetsLoading(true)
    try {
      const params = new URLSearchParams({ type: 'assets' })
      if (selectedPropertyId || currentHostelId) params.set('propertyId', selectedPropertyId || currentHostelId!)
      const res = await fetch(`/api/assets?${params}`)
      if (res.ok) {
        const data = await res.json()
        setAssets(data.assets || [])
        setAssetStats(data.assetStats || { total: 0, active: 0, underMaintenance: 0, disposed: 0, totalValue: 0, byCategory: {} })
      }
    } catch (err) {
      console.error('Failed to fetch assets:', err)
    } finally {
      setAssetsLoading(false)
    }
  }, [selectedPropertyId, currentHostelId])

  const fetchLaundry = useCallback(async () => {
    setLaundryLoading(true)
    try {
      const params = new URLSearchParams({ type: 'laundry' })
      if (selectedPropertyId || currentHostelId) params.set('propertyId', selectedPropertyId || currentHostelId!)
      const res = await fetch(`/api/assets?${params}`)
      if (res.ok) {
        const data = await res.json()
        setLaundry(data.laundry || [])
        setLaundryStats(data.laundryStats || { totalItems: 0, inUse: 0, inLaundry: 0, damaged: 0 })
      }
    } catch (err) {
      console.error('Failed to fetch laundry:', err)
    } finally {
      setLaundryLoading(false)
    }
  }, [selectedPropertyId, currentHostelId])

  const fetchHousekeeping = useCallback(async () => {
    setHousekeepingLoading(true)
    try {
      const params = new URLSearchParams({ type: 'housekeeping' })
      if (selectedPropertyId || currentHostelId) params.set('propertyId', selectedPropertyId || currentHostelId!)
      const res = await fetch(`/api/assets?${params}`)
      if (res.ok) {
        const data = await res.json()
        setHousekeeping(data.housekeeping || [])
        setHousekeepingStats(data.housekeepingStats || { totalItems: 0, lowStock: 0, totalValue: 0 })
      }
    } catch (err) {
      console.error('Failed to fetch housekeeping:', err)
    } finally {
      setHousekeepingLoading(false)
    }
  }, [selectedPropertyId, currentHostelId])

  const fetchRooms = useCallback(async () => {
    setRoomsLoading(true)
    try {
      const res = await fetch('/api/rooms' + (currentHostelId ? `?propertyId=${currentHostelId}` : ''))
      if (res.ok) {
        const data = await res.json()
        const roomList: RoomInfo[] = data.map((r: any) => ({
          id: r.id,
          name: r.name,
          number: r.number,
        }))
        setRooms(roomList)
      }
    } catch (err) {
      console.error('Failed to fetch rooms:', err)
    } finally {
      setRoomsLoading(false)
    }
  }, [currentHostelId])

  useEffect(() => {
    fetchAssets()
    fetchLaundry()
    fetchHousekeeping()
    fetchRooms()
  }, [fetchAssets, fetchLaundry, fetchHousekeeping, fetchRooms])

  // ── Filtered Data ──────────────────────────────────────────────────────────

  const filteredAssets = useMemo(() => {
    let result = assets
    if (assetCategoryFilter !== 'all') {
      result = result.filter((a) => a.category === assetCategoryFilter)
    }
    if (assetSearch.trim()) {
      const q = assetSearch.toLowerCase()
      result = result.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          (a.assetTag && a.assetTag.toLowerCase().includes(q)) ||
          (a.subCategory && a.subCategory.toLowerCase().includes(q)) ||
          (a.room && a.room.name.toLowerCase().includes(q)) ||
          (a.vendor && a.vendor.toLowerCase().includes(q))
      )
    }
    return result
  }, [assets, assetCategoryFilter, assetSearch])

  const filteredLaundry = useMemo(() => {
    if (!laundrySearch.trim()) return laundry
    const q = laundrySearch.toLowerCase()
    return laundry.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.category.toLowerCase().includes(q) ||
        (l.room && l.room.name.toLowerCase().includes(q))
    )
  }, [laundry, laundrySearch])

  const filteredHousekeeping = useMemo(() => {
    if (!housekeepingSearch.trim()) return housekeeping
    const q = housekeepingSearch.toLowerCase()
    return housekeeping.filter(
      (h) =>
        h.name.toLowerCase().includes(q) ||
        h.category.toLowerCase().includes(q) ||
        h.unit.toLowerCase().includes(q)
    )
  }, [housekeeping, housekeepingSearch])

  // ── Asset CRUD ─────────────────────────────────────────────────────────────

  const resetAssetForm = () => {
    setAssetForm({
      name: '',
      assetTag: '',
      category: 'furniture',
      subCategory: '',
      roomId: '',
      purchaseDate: '',
      purchasePrice: '',
      currentValue: '',
      depreciationRate: '',
      vendor: '',
      warrantyExpiry: '',
      condition: 'good',
      assignedTo: '',
      notes: '',
      status: 'active',
    })
  }

  const openAddAssetDialog = () => {
    resetAssetForm()
    setAssetDialogOpen(true)
  }

  const openEditAssetDialog = (asset: AssetItem) => {
    setSelectedAsset(asset)
    setAssetForm({
      name: asset.name,
      assetTag: asset.assetTag || '',
      category: asset.category as AssetCategory,
      subCategory: asset.subCategory || '',
      roomId: asset.room?.id || '',
      purchaseDate: asset.purchaseDate ? new Date(asset.purchaseDate).toISOString().split('T')[0] : '',
      purchasePrice: asset.purchasePrice?.toString() || '',
      currentValue: asset.currentValue?.toString() || '',
      depreciationRate: asset.depreciationRate?.toString() || '',
      vendor: asset.vendor || '',
      warrantyExpiry: asset.warrantyExpiry ? new Date(asset.warrantyExpiry).toISOString().split('T')[0] : '',
      condition: asset.condition,
      assignedTo: asset.assignedTo || '',
      notes: asset.notes || '',
      status: asset.status,
    })
    setEditAssetDialogOpen(true)
  }

  const handleAddAsset = async () => {
    if (!assetForm.name.trim()) {
      toast({ title: 'Validation Error', description: 'Asset name is required', variant: 'destructive' })
      return
    }
    setActionLoading(true)
    try {
      const payload: any = {
        type: 'asset',
        name: assetForm.name.trim(),
        assetTag: assetForm.assetTag.trim() || null,
        category: assetForm.category,
        subCategory: assetForm.subCategory.trim() || null,
        propertyId: selectedPropertyId,
        roomId: assetForm.roomId || null,
        purchaseDate: assetForm.purchaseDate || null,
        purchasePrice: assetForm.purchasePrice ? parseFloat(assetForm.purchasePrice) : null,
        currentValue: assetForm.currentValue ? parseFloat(assetForm.currentValue) : null,
        depreciationRate: assetForm.depreciationRate ? parseFloat(assetForm.depreciationRate) : null,
        vendor: assetForm.vendor.trim() || null,
        warrantyExpiry: assetForm.warrantyExpiry || null,
        condition: assetForm.condition,
        assignedTo: assetForm.assignedTo.trim() || null,
        notes: assetForm.notes.trim() || null,
      }
      const res = await fetch('/api/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        toast({ title: 'Success', description: 'Asset added successfully' })
        setAssetDialogOpen(false)
        resetAssetForm()
        fetchAssets()
      } else {
        const data = await res.json()
        toast({ title: 'Error', description: data.error || 'Failed to add asset', variant: 'destructive' })
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to add asset', variant: 'destructive' })
    } finally {
      setActionLoading(false)
    }
  }

  const handleEditAsset = async () => {
    if (!selectedAsset || !assetForm.name.trim()) {
      toast({ title: 'Validation Error', description: 'Asset name is required', variant: 'destructive' })
      return
    }
    setActionLoading(true)
    try {
      const payload: any = {
        type: 'asset',
        id: selectedAsset.id,
        name: assetForm.name.trim(),
        assetTag: assetForm.assetTag.trim() || null,
        category: assetForm.category,
        subCategory: assetForm.subCategory.trim() || null,
        roomId: assetForm.roomId || null,
        currentValue: assetForm.currentValue ? parseFloat(assetForm.currentValue) : null,
        status: assetForm.status,
        condition: assetForm.condition,
        assignedTo: assetForm.assignedTo.trim() || null,
        notes: assetForm.notes.trim() || null,
      }
      const res = await fetch('/api/assets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        toast({ title: 'Success', description: 'Asset updated successfully' })
        setEditAssetDialogOpen(false)
        setSelectedAsset(null)
        fetchAssets()
      } else {
        const data = await res.json()
        toast({ title: 'Error', description: data.error || 'Failed to update asset', variant: 'destructive' })
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to update asset', variant: 'destructive' })
    } finally {
      setActionLoading(false)
    }
  }

  // ── Laundry CRUD ───────────────────────────────────────────────────────────

  const resetLaundryForm = () => {
    setLaundryForm({
      name: '',
      category: 'bedding',
      roomId: '',
      totalQuantity: '',
      issuedQuantity: '',
      condition: 'good',
      notes: '',
    })
  }

  const resetEditLaundryForm = () => {
    setEditLaundryForm({
      id: '',
      name: '',
      category: 'bedding',
      roomId: '',
      totalQuantity: '',
      issuedQuantity: '',
      inLaundry: '',
      damagedQuantity: '',
      condition: 'good',
      status: 'in_use',
      notes: '',
    })
  }

  const openAddLaundryDialog = () => {
    resetLaundryForm()
    setLaundryDialogOpen(true)
  }

  const openEditLaundryDialog = (item: LaundryItemData) => {
    setSelectedLaundry(item)
    setEditLaundryForm({
      id: item.id,
      name: item.name,
      category: item.category,
      roomId: item.room?.id || '',
      totalQuantity: item.totalQuantity.toString(),
      issuedQuantity: item.issuedQuantity.toString(),
      inLaundry: item.inLaundry.toString(),
      damagedQuantity: item.damagedQuantity.toString(),
      condition: item.condition,
      status: item.status,
      notes: item.notes || '',
    })
    setEditLaundryDialogOpen(true)
  }

  const handleAddLaundry = async () => {
    if (!laundryForm.name.trim()) {
      toast({ title: 'Validation Error', description: 'Item name is required', variant: 'destructive' })
      return
    }
    setActionLoading(true)
    try {
      const payload: any = {
        type: 'laundry',
        name: laundryForm.name.trim(),
        category: laundryForm.category,
        propertyId: selectedPropertyId,
        roomId: laundryForm.roomId || null,
        totalQuantity: laundryForm.totalQuantity ? parseInt(laundryForm.totalQuantity) : 0,
        issuedQuantity: laundryForm.issuedQuantity ? parseInt(laundryForm.issuedQuantity) : 0,
        condition: laundryForm.condition,
        notes: laundryForm.notes.trim() || null,
      }
      const res = await fetch('/api/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        toast({ title: 'Success', description: 'Laundry item added successfully' })
        setLaundryDialogOpen(false)
        resetLaundryForm()
        fetchLaundry()
      } else {
        const data = await res.json()
        toast({ title: 'Error', description: data.error || 'Failed to add laundry item', variant: 'destructive' })
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to add laundry item', variant: 'destructive' })
    } finally {
      setActionLoading(false)
    }
  }

  const handleEditLaundry = async () => {
    if (!selectedLaundry || !editLaundryForm.name.trim()) {
      toast({ title: 'Validation Error', description: 'Item name is required', variant: 'destructive' })
      return
    }
    setActionLoading(true)
    try {
      const payload: any = {
        type: 'laundry',
        id: selectedLaundry.id,
        totalQuantity: editLaundryForm.totalQuantity ? parseInt(editLaundryForm.totalQuantity) : undefined,
        issuedQuantity: editLaundryForm.issuedQuantity ? parseInt(editLaundryForm.issuedQuantity) : undefined,
        inLaundry: editLaundryForm.inLaundry ? parseInt(editLaundryForm.inLaundry) : undefined,
        damagedQuantity: editLaundryForm.damagedQuantity ? parseInt(editLaundryForm.damagedQuantity) : undefined,
        condition: editLaundryForm.condition,
        status: editLaundryForm.status,
        notes: editLaundryForm.notes.trim() || null,
      }
      const res = await fetch('/api/assets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        toast({ title: 'Success', description: 'Laundry item updated successfully' })
        setEditLaundryDialogOpen(false)
        setSelectedLaundry(null)
        fetchLaundry()
      } else {
        const data = await res.json()
        toast({ title: 'Error', description: data.error || 'Failed to update laundry item', variant: 'destructive' })
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to update laundry item', variant: 'destructive' })
    } finally {
      setActionLoading(false)
    }
  }

  // Quick actions for laundry
  const handleSendToLaundry = async (item: LaundryItemData) => {
    if (item.issuedQuantity <= 0) {
      toast({ title: 'Cannot Send', description: 'No items are currently issued to send to laundry', variant: 'destructive' })
      return
    }
    setActionLoading(true)
    try {
      const payload = {
        type: 'laundry',
        id: item.id,
        issuedQuantity: item.issuedQuantity - 1,
        inLaundry: item.inLaundry + 1,
        status: 'in_laundry' as LaundryStatus,
        lastWashDate: new Date().toISOString(),
      }
      const res = await fetch('/api/assets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        toast({ title: 'Success', description: `${item.name} sent to laundry` })
        fetchLaundry()
      } else {
        toast({ title: 'Error', description: 'Failed to send to laundry', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to send to laundry', variant: 'destructive' })
    } finally {
      setActionLoading(false)
    }
  }

  const handleReturnFromLaundry = async (item: LaundryItemData) => {
    if (item.inLaundry <= 0) {
      toast({ title: 'Cannot Return', description: 'No items are currently in laundry', variant: 'destructive' })
      return
    }
    setActionLoading(true)
    try {
      const payload = {
        type: 'laundry',
        id: item.id,
        issuedQuantity: item.issuedQuantity + 1,
        inLaundry: item.inLaundry - 1,
        status: 'in_use' as LaundryStatus,
        lastWashDate: new Date().toISOString(),
      }
      const res = await fetch('/api/assets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        toast({ title: 'Success', description: `${item.name} returned from laundry` })
        fetchLaundry()
      } else {
        toast({ title: 'Error', description: 'Failed to return from laundry', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to return from laundry', variant: 'destructive' })
    } finally {
      setActionLoading(false)
    }
  }

  const handleMarkDamaged = async (item: LaundryItemData) => {
    if (item.issuedQuantity <= 0 && item.inLaundry <= 0) {
      toast({ title: 'Cannot Mark', description: 'No items available to mark as damaged', variant: 'destructive' })
      return
    }
    setActionLoading(true)
    try {
      const wasIssued = item.issuedQuantity > 0
      const payload = {
        type: 'laundry',
        id: item.id,
        issuedQuantity: wasIssued ? item.issuedQuantity - 1 : item.issuedQuantity,
        inLaundry: wasIssued ? item.inLaundry : item.inLaundry - 1,
        damagedQuantity: item.damagedQuantity + 1,
        condition: 'poor' as LaundryCondition,
        status: 'damaged' as LaundryStatus,
      }
      const res = await fetch('/api/assets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        toast({ title: 'Success', description: `${item.name} marked as damaged` })
        fetchLaundry()
      } else {
        toast({ title: 'Error', description: 'Failed to mark as damaged', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to mark as damaged', variant: 'destructive' })
    } finally {
      setActionLoading(false)
    }
  }

  // ── Housekeeping CRUD ──────────────────────────────────────────────────────

  const resetHousekeepingForm = () => {
    setHousekeepingForm({
      name: '',
      category: 'cleaning',
      unit: 'pcs',
      currentStock: '',
      minStock: '',
      unitPrice: '',
      notes: '',
    })
  }

  const openAddHousekeepingDialog = () => {
    resetHousekeepingForm()
    setHousekeepingDialogOpen(true)
  }

  const openRestockDialog = (item: HousekeepingItemData) => {
    setSelectedHousekeeping(item)
    setRestockForm({
      id: item.id,
      name: item.name,
      currentStock: item.currentStock,
      addQuantity: '',
      unitPrice: item.unitPrice.toString(),
    })
    setRestockDialogOpen(true)
  }

  const handleAddHousekeeping = async () => {
    if (!housekeepingForm.name.trim()) {
      toast({ title: 'Validation Error', description: 'Item name is required', variant: 'destructive' })
      return
    }
    setActionLoading(true)
    try {
      const payload: any = {
        type: 'housekeeping',
        name: housekeepingForm.name.trim(),
        category: housekeepingForm.category,
        propertyId: selectedPropertyId,
        unit: housekeepingForm.unit,
        currentStock: housekeepingForm.currentStock ? parseFloat(housekeepingForm.currentStock) : 0,
        minStock: housekeepingForm.minStock ? parseFloat(housekeepingForm.minStock) : 0,
        unitPrice: housekeepingForm.unitPrice ? parseFloat(housekeepingForm.unitPrice) : 0,
        notes: housekeepingForm.notes.trim() || null,
      }
      const res = await fetch('/api/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        toast({ title: 'Success', description: 'Housekeeping item added successfully' })
        setHousekeepingDialogOpen(false)
        resetHousekeepingForm()
        fetchHousekeeping()
      } else {
        const data = await res.json()
        toast({ title: 'Error', description: data.error || 'Failed to add housekeeping item', variant: 'destructive' })
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to add housekeeping item', variant: 'destructive' })
    } finally {
      setActionLoading(false)
    }
  }

  const handleRestock = async () => {
    if (!restockForm.addQuantity || parseFloat(restockForm.addQuantity) <= 0) {
      toast({ title: 'Validation Error', description: 'Please enter a valid quantity', variant: 'destructive' })
      return
    }
    setActionLoading(true)
    try {
      const newStock = restockForm.currentStock + parseFloat(restockForm.addQuantity)
      const payload = {
        type: 'housekeeping',
        id: restockForm.id,
        currentStock: newStock,
        unitPrice: restockForm.unitPrice ? parseFloat(restockForm.unitPrice) : undefined,
        lastRestocked: new Date().toISOString(),
      }
      const res = await fetch('/api/assets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        toast({ title: 'Success', description: `${restockForm.name} restocked successfully. New stock: ${newStock}` })
        setRestockDialogOpen(false)
        fetchHousekeeping()
      } else {
        toast({ title: 'Error', description: 'Failed to restock item', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to restock item', variant: 'destructive' })
    } finally {
      setActionLoading(false)
    }
  }

  // ── Delete ─────────────────────────────────────────────────────────────────

  const openDeleteDialog = (type: 'asset' | 'laundry' | 'housekeeping', id: string, name: string) => {
    setDeleteTarget({ type, id, name })
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setActionLoading(true)
    try {
      const payload: any = {
        type: deleteTarget.type,
        id: deleteTarget.id,
      }
      if (deleteTarget.type === 'asset') {
        payload.status = 'disposed'
      } else if (deleteTarget.type === 'laundry') {
        payload.status = 'disposed'
      } else if (deleteTarget.type === 'housekeeping') {
        payload.isActive = false
      }
      const res = await fetch('/api/assets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        toast({ title: 'Success', description: `${deleteTarget.name} has been removed` })
        if (deleteTarget.type === 'asset') fetchAssets()
        else if (deleteTarget.type === 'laundry') fetchLaundry()
        else fetchHousekeeping()
      } else {
        toast({ title: 'Error', description: 'Failed to remove item', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to remove item', variant: 'destructive' })
    } finally {
      setActionLoading(false)
      setDeleteDialogOpen(false)
      setDeleteTarget(null)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Assets, Laundry & Housekeeping
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage property assets, laundry items, and housekeeping inventory
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 max-w-lg">
          <TabsTrigger value="assets" className="gap-2">
            <Package className="h-4 w-4" />
            Assets
          </TabsTrigger>
          <TabsTrigger value="laundry" className="gap-2">
            <Shirt className="h-4 w-4" />
            Laundry
          </TabsTrigger>
          <TabsTrigger value="housekeeping" className="gap-2">
            <SprayCan className="h-4 w-4" />
            Housekeeping
          </TabsTrigger>
        </TabsList>

        {/* ── Assets Tab ──────────────────────────────────────────────────── */}
        <TabsContent value="assets" className="space-y-6 mt-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
                    <Database className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Total Assets</p>
                    <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {assetsLoading ? <Skeleton className="h-7 w-12" /> : assetStats.total}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Active</p>
                    <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      {assetsLoading ? <Skeleton className="h-7 w-12" /> : assetStats.active}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                    <Wrench className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Under Maintenance</p>
                    <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                      {assetsLoading ? <Skeleton className="h-7 w-12" /> : assetStats.underMaintenance}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/30">
                    <IndianRupee className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Total Value</p>
                    <div className="text-2xl font-bold text-violet-600 dark:text-violet-400">
                      {assetsLoading ? <Skeleton className="h-7 w-20" /> : formatCurrency(assetStats.totalValue)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Category Filter Chips + Search + Add */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={assetCategoryFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setAssetCategoryFilter('all')}
                className="h-8"
              >
                All
              </Button>
              {ASSET_CATEGORIES.map((cat) => (
                <Button
                  key={cat.value}
                  variant={assetCategoryFilter === cat.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setAssetCategoryFilter(cat.value)}
                  className="h-8 gap-1.5"
                >
                  {cat.icon}
                  {cat.label}
                  {assetStats.byCategory[cat.value] ? (
                    <span className="ml-1 text-xs opacity-70">({assetStats.byCategory[cat.value]})</span>
                  ) : null}
                </Button>
              ))}
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search assets..."
                  value={assetSearch}
                  onChange={(e) => setAssetSearch(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
              {canCreate && (
                <Button onClick={openAddAssetDialog} size="sm" className="h-9 gap-1.5">
                  <Plus className="h-4 w-4" />
                  Add Asset
                </Button>
              )}
            </div>
          </div>

          {/* Assets Table */}
          <Card>
            <CardContent className="p-0">
              {assetsLoading ? (
                <div className="p-6 space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : filteredAssets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-500 dark:text-slate-400">
                  <Package className="h-12 w-12 mb-4 opacity-40" />
                  <p className="text-lg font-medium">No assets found</p>
                  <p className="text-sm mt-1">Add your first asset to get started</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[180px]">Name</TableHead>
                        <TableHead className="min-w-[100px]">Asset Tag</TableHead>
                        <TableHead className="min-w-[100px]">Category</TableHead>
                        <TableHead className="min-w-[100px]">Sub-category</TableHead>
                        <TableHead className="min-w-[100px]">Room</TableHead>
                        <TableHead className="min-w-[100px]">Purchase Date</TableHead>
                        <TableHead className="min-w-[100px]">Purchase Price</TableHead>
                        <TableHead className="min-w-[100px]">Current Value</TableHead>
                        <TableHead className="min-w-[90px]">Condition</TableHead>
                        <TableHead className="min-w-[110px]">Status</TableHead>
                        <TableHead className="min-w-[110px]">Warranty Expiry</TableHead>
                        <TableHead className="min-w-[80px] text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAssets.map((asset) => (
                        <TableRow key={asset.id} className="group">
                          <TableCell className="font-medium">{asset.name}</TableCell>
                          <TableCell>
                            {asset.assetTag ? (
                              <Badge variant="outline" className="font-mono text-xs">
                                {asset.assetTag}
                              </Badge>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="font-normal">
                              {getCategoryLabel(asset.category)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-slate-600 dark:text-slate-400">
                            {asset.subCategory ? getSubCategoryLabel(asset.subCategory) : '—'}
                          </TableCell>
                          <TableCell>
                            {asset.room ? (
                              <span className="text-sm">
                                {asset.room.name} ({asset.room.number})
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm">{formatDate(asset.purchaseDate)}</TableCell>
                          <TableCell className="text-sm">{formatCurrency(asset.purchasePrice)}</TableCell>
                          <TableCell className="text-sm font-medium">{formatCurrency(asset.currentValue)}</TableCell>
                          <TableCell>{getConditionBadge(asset.condition)}</TableCell>
                          <TableCell>{getAssetStatusBadge(asset.status)}</TableCell>
                          <TableCell>
                            {asset.warrantyExpiry ? (
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm">{formatDate(asset.warrantyExpiry)}</span>
                                {isWarrantyExpired(asset.warrantyExpiry) && (
                                  <XCircle className="h-3.5 w-3.5 text-red-500" />
                                )}
                                {isWarrantyExpiringSoon(asset.warrantyExpiry) && (
                                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {canUpdate && (
                                  <DropdownMenuItem onClick={() => openEditAssetDialog(asset)}>
                                    <Edit3 className="h-4 w-4 mr-2" />
                                    Edit Asset
                                  </DropdownMenuItem>
                                )}
                                {canDelete && (
                                  <DropdownMenuItem
                                    onClick={() => openDeleteDialog('asset', asset.id, asset.name)}
                                    className="text-red-600 dark:text-red-400"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Dispose Asset
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Laundry Tab ──────────────────────────────────────────────────── */}
        <TabsContent value="laundry" className="space-y-6 mt-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
                    <Shirt className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Total Items</p>
                    <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {laundryLoading ? <Skeleton className="h-7 w-12" /> : laundryStats.totalItems}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">In Use</p>
                    <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      {laundryLoading ? <Skeleton className="h-7 w-12" /> : laundryStats.inUse}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                    <Droplets className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">In Laundry</p>
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {laundryLoading ? <Skeleton className="h-7 w-12" /> : laundryStats.inLaundry}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                    <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Damaged</p>
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {laundryLoading ? <Skeleton className="h-7 w-12" /> : laundryStats.damaged}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search + Add */}
          <div className="flex gap-2 items-center justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search laundry items..."
                value={laundrySearch}
                onChange={(e) => setLaundrySearch(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            {canCreate && (
              <Button onClick={openAddLaundryDialog} size="sm" className="h-9 gap-1.5">
                <Plus className="h-4 w-4" />
                Add Item
              </Button>
            )}
          </div>

          {/* Laundry Table */}
          <Card>
            <CardContent className="p-0">
              {laundryLoading ? (
                <div className="p-6 space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : filteredLaundry.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-500 dark:text-slate-400">
                  <Shirt className="h-12 w-12 mb-4 opacity-40" />
                  <p className="text-lg font-medium">No laundry items found</p>
                  <p className="text-sm mt-1">Add your first laundry item to get started</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[150px]">Name</TableHead>
                        <TableHead className="min-w-[90px]">Category</TableHead>
                        <TableHead className="min-w-[90px]">Room</TableHead>
                        <TableHead className="min-w-[70px] text-center">Total Qty</TableHead>
                        <TableHead className="min-w-[70px] text-center">Issued</TableHead>
                        <TableHead className="min-w-[70px] text-center">In Laundry</TableHead>
                        <TableHead className="min-w-[70px] text-center">Damaged</TableHead>
                        <TableHead className="min-w-[90px]">Condition</TableHead>
                        <TableHead className="min-w-[100px]">Last Wash</TableHead>
                        <TableHead className="min-w-[100px]">Next Wash</TableHead>
                        <TableHead className="min-w-[90px]">Status</TableHead>
                        <TableHead className="min-w-[120px] text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLaundry.map((item) => (
                        <TableRow key={item.id} className="group">
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="font-normal">
                              {getCategoryLabel(item.category)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {item.room ? (
                              <span className="text-sm">{item.room.name} ({item.room.number})</span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center font-medium">{item.totalQuantity}</TableCell>
                          <TableCell className="text-center">{item.issuedQuantity}</TableCell>
                          <TableCell className="text-center">
                            <span className={item.inLaundry > 0 ? 'text-blue-600 dark:text-blue-400 font-medium' : ''}>
                              {item.inLaundry}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className={item.damagedQuantity > 0 ? 'text-red-600 dark:text-red-400 font-medium' : ''}>
                              {item.damagedQuantity}
                            </span>
                          </TableCell>
                          <TableCell>{getConditionBadge(item.condition)}</TableCell>
                          <TableCell className="text-sm">{formatDate(item.lastWashDate)}</TableCell>
                          <TableCell className="text-sm">{formatDate(item.nextWashDate)}</TableCell>
                          <TableCell>{getLaundryStatusBadge(item.status)}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {canUpdate && (
                                  <DropdownMenuItem onClick={() => openEditLaundryDialog(item)}>
                                    <Edit3 className="h-4 w-4 mr-2" />
                                    Edit Item
                                  </DropdownMenuItem>
                                )}
                                {canUpdate && (
                                  <DropdownMenuItem onClick={() => handleSendToLaundry(item)} disabled={item.issuedQuantity <= 0}>
                                    <ArrowDownToLine className="h-4 w-4 mr-2" />
                                    Send to Laundry
                                  </DropdownMenuItem>
                                )}
                                {canUpdate && (
                                  <DropdownMenuItem onClick={() => handleReturnFromLaundry(item)} disabled={item.inLaundry <= 0}>
                                    <ArrowUpFromLine className="h-4 w-4 mr-2" />
                                    Return from Laundry
                                  </DropdownMenuItem>
                                )}
                                {canUpdate && (
                                  <DropdownMenuItem onClick={() => handleMarkDamaged(item)} disabled={item.issuedQuantity <= 0 && item.inLaundry <= 0}>
                                    <AlertTriangle className="h-4 w-4 mr-2" />
                                    Mark Damaged
                                  </DropdownMenuItem>
                                )}
                                {canDelete && (
                                  <DropdownMenuItem
                                    onClick={() => openDeleteDialog('laundry', item.id, item.name)}
                                    className="text-red-600 dark:text-red-400"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Dispose Item
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Housekeeping Tab ─────────────────────────────────────────────── */}
        <TabsContent value="housekeeping" className="space-y-6 mt-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
                    <SprayCan className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Total Items</p>
                    <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {housekeepingLoading ? <Skeleton className="h-7 w-12" /> : housekeepingStats.totalItems}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                    <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Low Stock</p>
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {housekeepingLoading ? <Skeleton className="h-7 w-12" /> : housekeepingStats.lowStock}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/30">
                    <IndianRupee className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Total Value</p>
                    <div className="text-2xl font-bold text-violet-600 dark:text-violet-400">
                      {housekeepingLoading ? <Skeleton className="h-7 w-20" /> : formatCurrency(housekeepingStats.totalValue)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search + Add */}
          <div className="flex gap-2 items-center justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search housekeeping items..."
                value={housekeepingSearch}
                onChange={(e) => setHousekeepingSearch(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            {canCreate && (
              <Button onClick={openAddHousekeepingDialog} size="sm" className="h-9 gap-1.5">
                <Plus className="h-4 w-4" />
                Add Item
              </Button>
            )}
          </div>

          {/* Housekeeping Table */}
          <Card>
            <CardContent className="p-0">
              {housekeepingLoading ? (
                <div className="p-6 space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : filteredHousekeeping.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-500 dark:text-slate-400">
                  <SprayCan className="h-12 w-12 mb-4 opacity-40" />
                  <p className="text-lg font-medium">No housekeeping items found</p>
                  <p className="text-sm mt-1">Add your first housekeeping item to get started</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[150px]">Name</TableHead>
                        <TableHead className="min-w-[90px]">Category</TableHead>
                        <TableHead className="min-w-[60px]">Unit</TableHead>
                        <TableHead className="min-w-[90px] text-center">Current Stock</TableHead>
                        <TableHead className="min-w-[80px] text-center">Min Stock</TableHead>
                        <TableHead className="min-w-[90px]">Unit Price</TableHead>
                        <TableHead className="min-w-[90px]">Stock Value</TableHead>
                        <TableHead className="min-w-[100px]">Last Restocked</TableHead>
                        <TableHead className="min-w-[90px]">Status</TableHead>
                        <TableHead className="min-w-[80px] text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredHousekeeping.map((item) => {
                        const isLowStock = item.currentStock <= item.minStock
                        const isOutOfStock = item.currentStock <= 0
                        const stockValue = item.currentStock * item.unitPrice
                        return (
                          <TableRow key={item.id} className={`group ${isOutOfStock ? 'bg-red-50 dark:bg-red-950/20' : isLowStock ? 'bg-amber-50 dark:bg-amber-950/20' : ''}`}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                {item.name}
                                {isLowStock && (
                                  <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="font-normal">
                                {getCategoryLabel(item.category)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-slate-600 dark:text-slate-400">{item.unit}</TableCell>
                            <TableCell className="text-center">
                              <span className={`font-bold ${isOutOfStock ? 'text-red-600 dark:text-red-400' : isLowStock ? 'text-amber-600 dark:text-amber-400' : ''}`}>
                                {item.currentStock}
                              </span>
                            </TableCell>
                            <TableCell className="text-center text-sm text-slate-600 dark:text-slate-400">{item.minStock}</TableCell>
                            <TableCell className="text-sm">{formatCurrency(item.unitPrice)}</TableCell>
                            <TableCell className="text-sm font-medium">{formatCurrency(stockValue)}</TableCell>
                            <TableCell className="text-sm">{formatDate(item.lastRestocked)}</TableCell>
                            <TableCell>{getHousekeepingStatusBadge(item)}</TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {canUpdate && (
                                    <DropdownMenuItem onClick={() => openRestockDialog(item)}>
                                      <RefreshCw className="h-4 w-4 mr-2" />
                                      Restock
                                    </DropdownMenuItem>
                                  )}
                                  {canDelete && (
                                    <DropdownMenuItem
                                      onClick={() => openDeleteDialog('housekeeping', item.id, item.name)}
                                      className="text-red-600 dark:text-red-400"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Remove Item
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
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Add Asset Dialog ──────────────────────────────────────────────────── */}
      <Dialog open={assetDialogOpen} onOpenChange={setAssetDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Asset</DialogTitle>
            <DialogDescription>Add a new asset to the property inventory</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="asset-name">Name *</Label>
              <Input
                id="asset-name"
                placeholder="e.g., Office Chair"
                value={assetForm.name}
                onChange={(e) => setAssetForm({ ...assetForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="asset-tag">Asset Tag</Label>
              <Input
                id="asset-tag"
                placeholder="e.g., AST-001"
                value={assetForm.assetTag}
                onChange={(e) => setAssetForm({ ...assetForm, assetTag: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="asset-category">Category *</Label>
              <Select value={assetForm.category} onValueChange={(v) => setAssetForm({ ...assetForm, category: v as AssetCategory, subCategory: '' })}>
                <SelectTrigger id="asset-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {ASSET_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="asset-subcategory">Sub-category</Label>
              <Select value={assetForm.subCategory} onValueChange={(v) => setAssetForm({ ...assetForm, subCategory: v })}>
                <SelectTrigger id="asset-subcategory">
                  <SelectValue placeholder="Select sub-category" />
                </SelectTrigger>
                <SelectContent>
                  {(ASSET_SUB_CATEGORIES[assetForm.category] || []).map((sub) => (
                    <SelectItem key={sub} value={sub}>{getSubCategoryLabel(sub)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="asset-room">Room</Label>
              <Select value={assetForm.roomId} onValueChange={(v) => setAssetForm({ ...assetForm, roomId: v })}>
                <SelectTrigger id="asset-room">
                  <SelectValue placeholder="Select room (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {rooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      {room.name} ({room.number})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="asset-purchase-date">Purchase Date</Label>
              <Input
                id="asset-purchase-date"
                type="date"
                value={assetForm.purchaseDate}
                onChange={(e) => setAssetForm({ ...assetForm, purchaseDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="asset-purchase-price">Purchase Price (₹)</Label>
              <Input
                id="asset-purchase-price"
                type="number"
                placeholder="0.00"
                value={assetForm.purchasePrice}
                onChange={(e) => setAssetForm({ ...assetForm, purchasePrice: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="asset-current-value">Current Value (₹)</Label>
              <Input
                id="asset-current-value"
                type="number"
                placeholder="0.00"
                value={assetForm.currentValue}
                onChange={(e) => setAssetForm({ ...assetForm, currentValue: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="asset-depreciation">Depreciation Rate (%)</Label>
              <Input
                id="asset-depreciation"
                type="number"
                placeholder="0"
                value={assetForm.depreciationRate}
                onChange={(e) => setAssetForm({ ...assetForm, depreciationRate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="asset-vendor">Vendor</Label>
              <Input
                id="asset-vendor"
                placeholder="e.g., ABC Suppliers"
                value={assetForm.vendor}
                onChange={(e) => setAssetForm({ ...assetForm, vendor: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="asset-warranty">Warranty Expiry</Label>
              <Input
                id="asset-warranty"
                type="date"
                value={assetForm.warrantyExpiry}
                onChange={(e) => setAssetForm({ ...assetForm, warrantyExpiry: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="asset-condition">Condition</Label>
              <Select value={assetForm.condition} onValueChange={(v) => setAssetForm({ ...assetForm, condition: v as AssetCondition })}>
                <SelectTrigger id="asset-condition">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excellent">Excellent</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="fair">Fair</SelectItem>
                  <SelectItem value="poor">Poor</SelectItem>
                  <SelectItem value="broken">Broken</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="asset-assigned">Assigned To</Label>
              <Input
                id="asset-assigned"
                placeholder="e.g., Room 101"
                value={assetForm.assignedTo}
                onChange={(e) => setAssetForm({ ...assetForm, assignedTo: e.target.value })}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="asset-notes">Notes</Label>
              <Textarea
                id="asset-notes"
                placeholder="Additional notes..."
                value={assetForm.notes}
                onChange={(e) => setAssetForm({ ...assetForm, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssetDialogOpen(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button onClick={handleAddAsset} disabled={actionLoading}>
              {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              Add Asset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Asset Dialog ──────────────────────────────────────────────────── */}
      <Dialog open={editAssetDialogOpen} onOpenChange={setEditAssetDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Asset</DialogTitle>
            <DialogDescription>Update asset details and status</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-asset-name">Name *</Label>
              <Input
                id="edit-asset-name"
                value={assetForm.name}
                onChange={(e) => setAssetForm({ ...assetForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-asset-tag">Asset Tag</Label>
              <Input
                id="edit-asset-tag"
                value={assetForm.assetTag}
                onChange={(e) => setAssetForm({ ...assetForm, assetTag: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-asset-category">Category</Label>
              <Select value={assetForm.category} onValueChange={(v) => setAssetForm({ ...assetForm, category: v as AssetCategory, subCategory: '' })}>
                <SelectTrigger id="edit-asset-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ASSET_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-asset-subcategory">Sub-category</Label>
              <Select value={assetForm.subCategory} onValueChange={(v) => setAssetForm({ ...assetForm, subCategory: v })}>
                <SelectTrigger id="edit-asset-subcategory">
                  <SelectValue placeholder="Select sub-category" />
                </SelectTrigger>
                <SelectContent>
                  {(ASSET_SUB_CATEGORIES[assetForm.category] || []).map((sub) => (
                    <SelectItem key={sub} value={sub}>{getSubCategoryLabel(sub)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-asset-room">Room</Label>
              <Select value={assetForm.roomId} onValueChange={(v) => setAssetForm({ ...assetForm, roomId: v })}>
                <SelectTrigger id="edit-asset-room">
                  <SelectValue placeholder="Select room (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {rooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      {room.name} ({room.number})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-asset-current-value">Current Value (₹)</Label>
              <Input
                id="edit-asset-current-value"
                type="number"
                value={assetForm.currentValue}
                onChange={(e) => setAssetForm({ ...assetForm, currentValue: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-asset-condition">Condition</Label>
              <Select value={assetForm.condition} onValueChange={(v) => setAssetForm({ ...assetForm, condition: v as AssetCondition })}>
                <SelectTrigger id="edit-asset-condition">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excellent">Excellent</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="fair">Fair</SelectItem>
                  <SelectItem value="poor">Poor</SelectItem>
                  <SelectItem value="broken">Broken</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-asset-status">Status</Label>
              <Select value={assetForm.status} onValueChange={(v) => setAssetForm({ ...assetForm, status: v as AssetStatus })}>
                <SelectTrigger id="edit-asset-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="under_maintenance">Under Maintenance</SelectItem>
                  <SelectItem value="disposed">Disposed</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-asset-assigned">Assigned To</Label>
              <Input
                id="edit-asset-assigned"
                value={assetForm.assignedTo}
                onChange={(e) => setAssetForm({ ...assetForm, assignedTo: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-asset-vendor">Vendor</Label>
              <Input
                id="edit-asset-vendor"
                value={assetForm.vendor}
                onChange={(e) => setAssetForm({ ...assetForm, vendor: e.target.value })}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="edit-asset-notes">Notes</Label>
              <Textarea
                id="edit-asset-notes"
                value={assetForm.notes}
                onChange={(e) => setAssetForm({ ...assetForm, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditAssetDialogOpen(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button onClick={handleEditAsset} disabled={actionLoading}>
              {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Edit3 className="h-4 w-4 mr-2" />}
              Update Asset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add Laundry Item Dialog ──────────────────────────────────────────── */}
      <Dialog open={laundryDialogOpen} onOpenChange={setLaundryDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Laundry Item</DialogTitle>
            <DialogDescription>Add a new linen/laundry item to track</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="laundry-name">Name *</Label>
              <Input
                id="laundry-name"
                placeholder="e.g., Bed Sheets"
                value={laundryForm.name}
                onChange={(e) => setLaundryForm({ ...laundryForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="laundry-category">Category</Label>
              <Select value={laundryForm.category} onValueChange={(v) => setLaundryForm({ ...laundryForm, category: v as LaundryCategory })}>
                <SelectTrigger id="laundry-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LAUNDRY_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="laundry-room">Room</Label>
              <Select value={laundryForm.roomId} onValueChange={(v) => setLaundryForm({ ...laundryForm, roomId: v })}>
                <SelectTrigger id="laundry-room">
                  <SelectValue placeholder="Select room (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {rooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      {room.name} ({room.number})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="laundry-total-qty">Total Quantity</Label>
              <Input
                id="laundry-total-qty"
                type="number"
                placeholder="0"
                value={laundryForm.totalQuantity}
                onChange={(e) => setLaundryForm({ ...laundryForm, totalQuantity: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="laundry-issued-qty">Issued Quantity</Label>
              <Input
                id="laundry-issued-qty"
                type="number"
                placeholder="0"
                value={laundryForm.issuedQuantity}
                onChange={(e) => setLaundryForm({ ...laundryForm, issuedQuantity: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="laundry-condition">Condition</Label>
              <Select value={laundryForm.condition} onValueChange={(v) => setLaundryForm({ ...laundryForm, condition: v as LaundryCondition })}>
                <SelectTrigger id="laundry-condition">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excellent">Excellent</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="fair">Fair</SelectItem>
                  <SelectItem value="poor">Poor</SelectItem>
                  <SelectItem value="broken">Broken</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="laundry-notes">Notes</Label>
              <Textarea
                id="laundry-notes"
                placeholder="Additional notes..."
                value={laundryForm.notes}
                onChange={(e) => setLaundryForm({ ...laundryForm, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLaundryDialogOpen(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button onClick={handleAddLaundry} disabled={actionLoading}>
              {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              Add Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Laundry Item Dialog ──────────────────────────────────────────── */}
      <Dialog open={editLaundryDialogOpen} onOpenChange={setEditLaundryDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Laundry Item</DialogTitle>
            <DialogDescription>Update laundry item details and quantities</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
            <div className="space-y-2 sm:col-span-2">
              <Label>Item Name</Label>
              <Input value={editLaundryForm.name} disabled className="bg-slate-50 dark:bg-slate-800" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-laundry-total-qty">Total Quantity</Label>
              <Input
                id="edit-laundry-total-qty"
                type="number"
                value={editLaundryForm.totalQuantity}
                onChange={(e) => setEditLaundryForm({ ...editLaundryForm, totalQuantity: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-laundry-issued-qty">Issued Quantity</Label>
              <Input
                id="edit-laundry-issued-qty"
                type="number"
                value={editLaundryForm.issuedQuantity}
                onChange={(e) => setEditLaundryForm({ ...editLaundryForm, issuedQuantity: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-laundry-in-laundry">In Laundry</Label>
              <Input
                id="edit-laundry-in-laundry"
                type="number"
                value={editLaundryForm.inLaundry}
                onChange={(e) => setEditLaundryForm({ ...editLaundryForm, inLaundry: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-laundry-damaged">Damaged Quantity</Label>
              <Input
                id="edit-laundry-damaged"
                type="number"
                value={editLaundryForm.damagedQuantity}
                onChange={(e) => setEditLaundryForm({ ...editLaundryForm, damagedQuantity: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-laundry-condition">Condition</Label>
              <Select value={editLaundryForm.condition} onValueChange={(v) => setEditLaundryForm({ ...editLaundryForm, condition: v as LaundryCondition })}>
                <SelectTrigger id="edit-laundry-condition">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excellent">Excellent</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="fair">Fair</SelectItem>
                  <SelectItem value="poor">Poor</SelectItem>
                  <SelectItem value="broken">Broken</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-laundry-status">Status</Label>
              <Select value={editLaundryForm.status} onValueChange={(v) => setEditLaundryForm({ ...editLaundryForm, status: v as LaundryStatus })}>
                <SelectTrigger id="edit-laundry-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_use">In Use</SelectItem>
                  <SelectItem value="in_laundry">In Laundry</SelectItem>
                  <SelectItem value="stored">Stored</SelectItem>
                  <SelectItem value="damaged">Damaged</SelectItem>
                  <SelectItem value="disposed">Disposed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="edit-laundry-notes">Notes</Label>
              <Textarea
                id="edit-laundry-notes"
                value={editLaundryForm.notes}
                onChange={(e) => setEditLaundryForm({ ...editLaundryForm, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditLaundryDialogOpen(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button onClick={handleEditLaundry} disabled={actionLoading}>
              {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Edit3 className="h-4 w-4 mr-2" />}
              Update Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add Housekeeping Item Dialog ──────────────────────────────────────── */}
      <Dialog open={housekeepingDialogOpen} onOpenChange={setHousekeepingDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Housekeeping Item</DialogTitle>
            <DialogDescription>Add a new housekeeping supply to track</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="hk-name">Name *</Label>
              <Input
                id="hk-name"
                placeholder="e.g., Floor Cleaner"
                value={housekeepingForm.name}
                onChange={(e) => setHousekeepingForm({ ...housekeepingForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hk-category">Category</Label>
              <Select value={housekeepingForm.category} onValueChange={(v) => setHousekeepingForm({ ...housekeepingForm, category: v as HousekeepingCategory })}>
                <SelectTrigger id="hk-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HOUSEKEEPING_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="hk-unit">Unit</Label>
              <Select value={housekeepingForm.unit} onValueChange={(v) => setHousekeepingForm({ ...housekeepingForm, unit: v })}>
                <SelectTrigger id="hk-unit">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HOUSEKEEPING_UNITS.map((unit) => (
                    <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="hk-current-stock">Current Stock</Label>
              <Input
                id="hk-current-stock"
                type="number"
                placeholder="0"
                value={housekeepingForm.currentStock}
                onChange={(e) => setHousekeepingForm({ ...housekeepingForm, currentStock: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hk-min-stock">Minimum Stock</Label>
              <Input
                id="hk-min-stock"
                type="number"
                placeholder="0"
                value={housekeepingForm.minStock}
                onChange={(e) => setHousekeepingForm({ ...housekeepingForm, minStock: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hk-unit-price">Unit Price (₹)</Label>
              <Input
                id="hk-unit-price"
                type="number"
                placeholder="0.00"
                value={housekeepingForm.unitPrice}
                onChange={(e) => setHousekeepingForm({ ...housekeepingForm, unitPrice: e.target.value })}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="hk-notes">Notes</Label>
              <Textarea
                id="hk-notes"
                placeholder="Additional notes..."
                value={housekeepingForm.notes}
                onChange={(e) => setHousekeepingForm({ ...housekeepingForm, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setHousekeepingDialogOpen(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button onClick={handleAddHousekeeping} disabled={actionLoading}>
              {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              Add Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Restock Dialog ────────────────────────────────────────────────────── */}
      <Dialog open={restockDialogOpen} onOpenChange={setRestockDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Restock Item</DialogTitle>
            <DialogDescription>
              Add stock for {restockForm.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
              <span className="text-sm text-slate-600 dark:text-slate-400">Current Stock</span>
              <span className="font-bold text-lg">{restockForm.currentStock}</span>
            </div>
            <div className="space-y-2">
              <Label htmlFor="restock-qty">Quantity to Add *</Label>
              <Input
                id="restock-qty"
                type="number"
                placeholder="Enter quantity"
                value={restockForm.addQuantity}
                onChange={(e) => setRestockForm({ ...restockForm, addQuantity: e.target.value })}
                min="0"
                step="0.5"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="restock-price">Unit Price (₹)</Label>
              <Input
                id="restock-price"
                type="number"
                placeholder="0.00"
                value={restockForm.unitPrice}
                onChange={(e) => setRestockForm({ ...restockForm, unitPrice: e.target.value })}
              />
            </div>
            {restockForm.addQuantity && parseFloat(restockForm.addQuantity) > 0 && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
                <span className="text-sm text-emerald-700 dark:text-emerald-400">New Stock</span>
                <span className="font-bold text-lg text-emerald-700 dark:text-emerald-400">
                  {restockForm.currentStock + parseFloat(restockForm.addQuantity)}
                </span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRestockDialogOpen(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button onClick={handleRestock} disabled={actionLoading}>
              {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Restock
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete / Dispose Confirmation Dialog ──────────────────────────────── */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Removal</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>{deleteTarget?.name}</strong>?
              {deleteTarget?.type === 'asset' && ' This will mark the asset as disposed.'}
              {deleteTarget?.type === 'laundry' && ' This will mark the item as disposed.'}
              {deleteTarget?.type === 'housekeeping' && ' This will deactivate the item.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={actionLoading}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
