'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useAppStore, hasPermission } from '@/lib/store'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import type { ChartConfig } from '@/components/ui/chart'
import {
  UtensilsCrossed,
  Users,
  UserCheck,
  Trash2,
  Leaf,
  Plus,
  CalendarIcon,
  Loader2,
  Search,
  MoreVertical,
  AlertTriangle,
  TrendingUp,
  IndianRupee,
  Clock,
  Apple,
  Sun,
  Moon,
  Coffee,
  Cookie,
  Edit3,
  Trash,
  CheckCircle2,
  XCircle,
  BarChart3,
  Package,
  Recycle,
  Gift,
} from 'lucide-react'
import { format } from 'date-fns'
import { Bar, BarChart, XAxis, YAxis, CartesianGrid } from 'recharts'
import { useToast } from '@/hooks/use-toast'

// ─── Types ─────────────────────────────────────────────────────
interface Tenant {
  id: string
  name: string
  phone?: string
  email?: string
  user?: { id: string; name: string; email: string; phone: string }
  property?: { id: string; name: string }
  room?: { id: string; name: string; number: string }
}

interface InventoryItem {
  id: string
  name: string
  unit: string
  unitPrice: number
  currentStock: number
  category?: { id: string; name: string; slug: string }
}

interface AttendanceRecord {
  id: string
  date: string
  mealType: string
  tenantId: string | null
  tenant?: { name: string }
  present: boolean
  guestCount: number
  notes?: string
  markedById?: string
  markedBy?: { name: string }
}

interface MealAttendance {
  present: number
  absent: number
  guests: number
  records: AttendanceRecord[]
}

interface ConsumptionLog {
  id: string
  date: string
  item: { name: string; unit: string }
  mealType: string
  issuedQty: number
  consumedQty: number
  returnedQty: number
  wastageQty: number
  unit: string
  costPerUnit: number
  totalCost: number
}

interface WasteRecord {
  id: string
  date: string
  category: string
  item?: { name: string }
  description: string
  quantity: number
  unit?: string
  estimatedCost: number
  disposalMethod?: string
  recordedBy?: { name: string }
}

interface WasteStats {
  totalWaste: number
  foodWaste: number
  expired: number
  damaged: number
}

interface MessData {
  attendance?: Record<string, MealAttendance>
  totalPresent?: number
  totalGuests?: number
  consumption?: ConsumptionLog[]
  waste?: WasteRecord[]
  wasteStats?: WasteStats
}

// ─── Meal type config ──────────────────────────────────────────
const MEAL_TYPES = [
  { value: 'breakfast', label: 'Breakfast', icon: Coffee, color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300', activeColor: 'bg-amber-500 text-white', border: 'border-amber-300 dark:border-amber-700' },
  { value: 'lunch', label: 'Lunch', icon: Sun, color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300', activeColor: 'bg-orange-500 text-white', border: 'border-orange-300 dark:border-orange-700' },
  { value: 'snacks', label: 'Snacks', icon: Cookie, color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300', activeColor: 'bg-emerald-500 text-white', border: 'border-emerald-300 dark:border-emerald-700' },
  { value: 'dinner', label: 'Dinner', icon: Moon, color: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300', activeColor: 'bg-violet-500 text-white', border: 'border-violet-300 dark:border-violet-700' },
] as const

const WASTE_CATEGORIES = [
  { value: 'food_waste', label: 'Food Waste' },
  { value: 'expired', label: 'Expired' },
  { value: 'damaged', label: 'Damaged' },
  { value: 'spoilage', label: 'Spoilage' },
  { value: 'other', label: 'Other' },
]

const DISPOSAL_METHODS = [
  { value: 'compost', label: 'Compost', icon: Leaf },
  { value: 'trash', label: 'Trash', icon: Trash2 },
  { value: 'donation', label: 'Donation', icon: Gift },
  { value: 'recycling', label: 'Recycling', icon: Recycle },
]

const consumptionChartConfig: ChartConfig = {
  consumed: { label: 'Consumed', color: 'hsl(var(--chart-1))' },
  wastage: { label: 'Wastage', color: 'hsl(var(--chart-5))' },
}

// ─── Helpers ───────────────────────────────────────────────────
function formatCurrency(amount: number) {
  return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

function formatDate(dateStr: string) {
  try {
    return format(new Date(dateStr), 'dd MMM yyyy')
  } catch {
    return dateStr
  }
}

function getMealColor(mealType: string) {
  return MEAL_TYPES.find(m => m.value === mealType) || MEAL_TYPES[0]
}

function getWasteCategoryLabel(cat: string) {
  return WASTE_CATEGORIES.find(c => c.value === cat)?.label || cat
}

function getDisposalLabel(method: string) {
  return DISPOSAL_METHODS.find(d => d.value === method)?.label || method
}

// ─── Component ─────────────────────────────────────────────────
export function MessPage() {
  const { selectedPropertyId, currentUser } = useAppStore()
  const { toast } = useToast()

  const role = currentUser?.role || ''
  const canCreate = hasPermission(role, 'mess:create')
  const canUpdate = hasPermission(role, 'mess:update')
  const canDelete = hasPermission(role, 'mess:delete')

  // ─── State ─────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('attendance')
  const [loading, setLoading] = useState(true)
  const [messData, setMessData] = useState<MessData>({})

  // Attendance state
  const [attendanceDate, setAttendanceDate] = useState<Date>(new Date())
  const [selectedMeal, setSelectedMeal] = useState<string>('breakfast')
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [attendanceRows, setAttendanceRows] = useState<{
    tenantId: string
    name: string
    present: boolean
    guestCount: number
    notes: string
  }[]>([])
  const [savingAttendance, setSavingAttendance] = useState(false)

  // Consumption state
  const [consumptionDays, setConsumptionDays] = useState(7)
  const [consumptionSearch, setConsumptionSearch] = useState('')
  const [showConsumptionDialog, setShowConsumptionDialog] = useState(false)
  const [savingConsumption, setSavingConsumption] = useState(false)
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])

  // Waste state
  const [wasteDays, setWasteDays] = useState(7)
  const [showWasteDialog, setShowWasteDialog] = useState(false)
  const [savingWaste, setSavingWaste] = useState(false)

  // Consumption form
  const [consumptionForm, setConsumptionForm] = useState({
    itemId: '',
    mealType: 'breakfast',
    issuedQty: 0,
    consumedQty: 0,
    returnedQty: 0,
    wastageQty: 0,
    date: format(new Date(), 'yyyy-MM-dd'),
    notes: '',
  })

  // Waste form
  const [wasteForm, setWasteForm] = useState({
    category: 'food_waste',
    description: '',
    itemId: '',
    quantity: 0,
    unit: 'kg',
    estimatedCost: 0,
    disposalMethod: 'trash',
    date: format(new Date(), 'yyyy-MM-dd'),
    notes: '',
  })

  // ─── Data fetching ─────────────────────────────────────────
  const fetchMessData = useCallback(async (type: string = 'all') => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedPropertyId) params.set('propertyId', selectedPropertyId)
      params.set('type', type)
      if (type === 'all' || type === 'attendance') {
        params.set('date', format(attendanceDate, 'yyyy-MM-dd'))
      }
      if (type === 'all' || type === 'consumption') {
        params.set('days', String(consumptionDays))
      }
      if (type === 'all' || type === 'waste') {
        params.set('days', String(wasteDays))
      }

      const res = await fetch(`/api/mess?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch mess data')
      const data = await res.json()
      setMessData(prev => ({ ...prev, ...data }))
    } catch (error) {
      console.error('Error fetching mess data:', error)
      toast({ title: 'Error', description: 'Failed to fetch mess data', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [selectedPropertyId, attendanceDate, consumptionDays, wasteDays, toast])

  const fetchTenants = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (selectedPropertyId) params.set('propertyId', selectedPropertyId)
      const res = await fetch(`/api/tenants?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch tenants')
      const data = await res.json()
      const tenantList = Array.isArray(data) ? data : []
      setTenants(tenantList)
      // Initialize attendance rows
      setAttendanceRows(
        tenantList.map((t: Tenant) => ({
          tenantId: t.id,
          name: t.user?.name || t.name,
          present: true,
          guestCount: 0,
          notes: '',
        }))
      )
    } catch (error) {
      console.error('Error fetching tenants:', error)
    }
  }, [selectedPropertyId])

  const fetchInventoryItems = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (selectedPropertyId) params.set('propertyId', selectedPropertyId)
      const res = await fetch(`/api/inventory?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch inventory')
      const data = await res.json()
      setInventoryItems(Array.isArray(data.items) ? data.items : [])
    } catch (error) {
      console.error('Error fetching inventory:', error)
    }
  }, [selectedPropertyId])

  // ─── Effects ───────────────────────────────────────────────
  useEffect(() => {
    fetchMessData(activeTab)
  }, [activeTab, attendanceDate, consumptionDays, wasteDays, fetchMessData])

  useEffect(() => {
    fetchTenants()
  }, [selectedPropertyId, fetchTenants])

  useEffect(() => {
    fetchInventoryItems()
  }, [selectedPropertyId, fetchInventoryItems])

  // Load existing attendance records into the rows when data changes
  useEffect(() => {
    if (messData.attendance && tenants.length > 0) {
      const mealData = messData.attendance[selectedMeal]
      if (mealData?.records?.length) {
        setAttendanceRows(prev =>
          prev.map(row => {
            const existing = mealData.records.find(
              (r: AttendanceRecord) => r.tenantId === row.tenantId
            )
            if (existing) {
              return {
                ...row,
                present: existing.present,
                guestCount: existing.guestCount,
                notes: existing.notes || '',
              }
            }
            return row
          })
        )
      }
    }
  }, [messData.attendance, selectedMeal, tenants.length])

  // ─── Computed values ───────────────────────────────────────
  const attendanceStats = useMemo(() => {
    const mealData = messData.attendance?.[selectedMeal]
    if (!mealData) {
      return { totalPresent: 0, totalGuests: 0, attendanceRate: 0, totalTenants: tenants.length }
    }
    const totalPresent = mealData.present
    const totalGuests = mealData.guests
    const total = mealData.present + mealData.absent
    const rate = total > 0 ? Math.round((totalPresent / total) * 100) : 0
    return { totalPresent, totalGuests, attendanceRate: rate, totalTenants: total }
  }, [messData.attendance, selectedMeal, tenants.length])

  const filteredConsumption = useMemo(() => {
    const logs = messData.consumption || []
    if (!consumptionSearch) return logs
    const q = consumptionSearch.toLowerCase()
    return logs.filter(
      (c: ConsumptionLog) =>
        c.item?.name?.toLowerCase().includes(q) ||
        c.mealType?.toLowerCase().includes(q)
    )
  }, [messData.consumption, consumptionSearch])

  const consumptionTotals = useMemo(() => {
    return filteredConsumption.reduce(
      (acc: { issued: number; consumed: number; returned: number; wastage: number; cost: number }, c: ConsumptionLog) => ({
        issued: acc.issued + c.issuedQty,
        consumed: acc.consumed + c.consumedQty,
        returned: acc.returned + c.returnedQty,
        wastage: acc.wastage + c.wastageQty,
        cost: acc.cost + c.totalCost,
      }),
      { issued: 0, consumed: 0, returned: 0, wastage: 0, cost: 0 }
    )
  }, [filteredConsumption])

  const consumptionChartData = useMemo(() => {
    if (!messData.consumption?.length) return []
    const grouped: Record<string, { consumed: number; wastage: number; label: string }> = {}
    for (const log of messData.consumption) {
      try {
        const dayKey = format(new Date(log.date), 'dd MMM')
        if (!grouped[dayKey]) grouped[dayKey] = { consumed: 0, wastage: 0, label: dayKey }
        grouped[dayKey].consumed += log.consumedQty
        grouped[dayKey].wastage += log.wastageQty
      } catch {
        // skip invalid dates
      }
    }
    return Object.values(grouped).sort((a, b) => a.label.localeCompare(b.label))
  }, [messData.consumption])

  const wasteStats = useMemo(() => {
    return messData.wasteStats || { totalWaste: 0, foodWaste: 0, expired: 0, damaged: 0 }
  }, [messData.wasteStats])

  // ─── Handlers ──────────────────────────────────────────────
  const handleMarkAttendance = async () => {
    if (!attendanceRows.length) return
    setSavingAttendance(true)
    try {
      const res = await fetch('/api/mess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'attendance',
          propertyId: selectedPropertyId,
          date: format(attendanceDate, 'yyyy-MM-dd'),
          mealType: selectedMeal,
          userId: currentUser?.id,
          records: attendanceRows.map(r => ({
            tenantId: r.tenantId,
            present: r.present,
            guestCount: r.guestCount,
            notes: r.notes,
          })),
        }),
      })
      if (!res.ok) throw new Error('Failed to mark attendance')
      const data = await res.json()
      toast({
        title: 'Attendance Marked',
        description: `Successfully marked attendance for ${data.count} tenant(s)`,
      })
      fetchMessData('attendance')
    } catch (error) {
      console.error('Error marking attendance:', error)
      toast({ title: 'Error', description: 'Failed to mark attendance', variant: 'destructive' })
    } finally {
      setSavingAttendance(false)
    }
  }

  const handleAddConsumption = async () => {
    if (!consumptionForm.itemId) {
      toast({ title: 'Validation Error', description: 'Please select an inventory item', variant: 'destructive' })
      return
    }
    setSavingConsumption(true)
    try {
      const selectedItem = inventoryItems.find(i => i.id === consumptionForm.itemId)
      const totalCost = (consumptionForm.consumedQty + consumptionForm.wastageQty) * (selectedItem?.unitPrice || 0)

      const res = await fetch('/api/mess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'consumption',
          propertyId: selectedPropertyId,
          date: consumptionForm.date,
          itemId: consumptionForm.itemId,
          mealType: consumptionForm.mealType,
          issuedQty: consumptionForm.issuedQty,
          consumedQty: consumptionForm.consumedQty,
          returnedQty: consumptionForm.returnedQty,
          wastageQty: consumptionForm.wastageQty,
          unit: selectedItem?.unit || 'kg',
          costPerUnit: selectedItem?.unitPrice || 0,
          totalCost,
          notes: consumptionForm.notes,
          userId: currentUser?.id,
        }),
      })
      if (!res.ok) throw new Error('Failed to add consumption log')
      toast({ title: 'Success', description: 'Consumption log added successfully' })
      setShowConsumptionDialog(false)
      setConsumptionForm({
        itemId: '',
        mealType: 'breakfast',
        issuedQty: 0,
        consumedQty: 0,
        returnedQty: 0,
        wastageQty: 0,
        date: format(new Date(), 'yyyy-MM-dd'),
        notes: '',
      })
      fetchMessData('consumption')
    } catch (error) {
      console.error('Error adding consumption:', error)
      toast({ title: 'Error', description: 'Failed to add consumption log', variant: 'destructive' })
    } finally {
      setSavingConsumption(false)
    }
  }

  const handleAddWaste = async () => {
    if (!wasteForm.description) {
      toast({ title: 'Validation Error', description: 'Please enter a description', variant: 'destructive' })
      return
    }
    setSavingWaste(true)
    try {
      const res = await fetch('/api/mess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'waste',
          propertyId: selectedPropertyId,
          date: wasteForm.date,
          category: wasteForm.category,
          itemId: wasteForm.itemId || null,
          description: wasteForm.description,
          quantity: wasteForm.quantity,
          unit: wasteForm.unit,
          estimatedCost: wasteForm.estimatedCost,
          disposalMethod: wasteForm.disposalMethod,
          notes: wasteForm.notes,
          userId: currentUser?.id,
        }),
      })
      if (!res.ok) throw new Error('Failed to add waste record')
      toast({ title: 'Success', description: 'Waste record added successfully' })
      setShowWasteDialog(false)
      setWasteForm({
        category: 'food_waste',
        description: '',
        itemId: '',
        quantity: 0,
        unit: 'kg',
        estimatedCost: 0,
        disposalMethod: 'trash',
        date: format(new Date(), 'yyyy-MM-dd'),
        notes: '',
      })
      fetchMessData('waste')
    } catch (error) {
      console.error('Error adding waste:', error)
      toast({ title: 'Error', description: 'Failed to add waste record', variant: 'destructive' })
    } finally {
      setSavingWaste(false)
    }
  }

  const toggleAttendanceRow = (tenantId: string, checked: boolean) => {
    setAttendanceRows(prev =>
      prev.map(r => (r.tenantId === tenantId ? { ...r, present: checked } : r))
    )
  }

  const updateAttendanceRow = (tenantId: string, field: 'guestCount' | 'notes', value: string | number) => {
    setAttendanceRows(prev =>
      prev.map(r => (r.tenantId === tenantId ? { ...r, [field]: value } : r))
    )
  }

  // ─── Stats Cards ───────────────────────────────────────────
  const statsCards = [
    {
      title: 'Present Today',
      value: messData.totalPresent ?? 0,
      icon: UserCheck,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    },
    {
      title: 'Total Guests',
      value: messData.totalGuests ?? 0,
      icon: Users,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-950/30',
    },
    {
      title: 'Total Waste Value',
      value: formatCurrency(wasteStats.totalWaste),
      icon: IndianRupee,
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-50 dark:bg-red-950/30',
    },
    {
      title: 'Food Waste',
      value: formatCurrency(wasteStats.foodWaste),
      icon: Apple,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-950/30',
    },
  ]

  // ─── Render ────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <UtensilsCrossed className="size-6" />
            Mess & Dining Management
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Track attendance, consumption, and waste management
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((card) => (
          <Card key={card.title} className="relative overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${card.bg}`}>
                  <card.icon className={`size-5 ${card.color}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">
                    {card.title}
                  </p>
                  <p className="text-lg font-bold text-slate-900 dark:text-slate-100 truncate">
                    {card.value}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 max-w-lg">
          <TabsTrigger value="attendance" className="gap-1.5">
            <UserCheck className="size-4" />
            <span className="hidden sm:inline">Attendance</span>
          </TabsTrigger>
          <TabsTrigger value="consumption" className="gap-1.5">
            <BarChart3 className="size-4" />
            <span className="hidden sm:inline">Consumption</span>
          </TabsTrigger>
          <TabsTrigger value="waste" className="gap-1.5">
            <Trash2 className="size-4" />
            <span className="hidden sm:inline">Waste</span>
          </TabsTrigger>
        </TabsList>

        {/* ─── Attendance Tab ─────────────────────────────────── */}
        <TabsContent value="attendance" className="space-y-4 mt-4">
          {/* Date & Meal Selector */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full sm:w-[200px] justify-start text-left font-normal"
                      >
                        <CalendarIcon className="size-4 mr-2" />
                        {format(attendanceDate, 'dd MMM yyyy')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={attendanceDate}
                        onSelect={(d) => d && setAttendanceDate(d)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2 flex-1">
                  <Label className="text-sm font-medium">Meal Type</Label>
                  <div className="flex flex-wrap gap-2">
                    {MEAL_TYPES.map((meal) => {
                      const Icon = meal.icon
                      const isActive = selectedMeal === meal.value
                      return (
                        <Button
                          key={meal.value}
                          variant="outline"
                          size="sm"
                          className={`gap-1.5 transition-all ${
                            isActive
                              ? meal.activeColor + ' border-transparent hover:opacity-90'
                              : meal.color + ' ' + meal.border
                          }`}
                          onClick={() => setSelectedMeal(meal.value)}
                        >
                          <Icon className="size-4" />
                          {meal.label}
                        </Button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Attendance Summary */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-xs text-slate-500 dark:text-slate-400">Total Present</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {attendanceStats.totalPresent}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-xs text-slate-500 dark:text-slate-400">Total Guests</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {attendanceStats.totalGuests}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-xs text-slate-500 dark:text-slate-400">Attendance Rate</p>
                <p className="text-2xl font-bold text-violet-600 dark:text-violet-400">
                  {attendanceStats.attendanceRate}%
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Attendance Table */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <CardTitle className="text-base">
                  {getMealColor(selectedMeal).label} Attendance — {format(attendanceDate, 'dd MMM yyyy')}
                </CardTitle>
                <Button
                  onClick={handleMarkAttendance}
                  disabled={savingAttendance || attendanceRows.length === 0}
                  className="gap-2"
                >
                  {savingAttendance ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="size-4" />
                  )}
                  Mark Attendance
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-6 space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : attendanceRows.length === 0 ? (
                <div className="p-8 text-center">
                  <Users className="size-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                  <p className="text-slate-500 dark:text-slate-400">No tenants found for this property</p>
                </div>
              ) : (
                <ScrollArea className="max-h-96">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">Present</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead className="w-28 text-center">Guests</TableHead>
                        <TableHead className="w-48">Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attendanceRows.map((row) => (
                        <TableRow key={row.tenantId}>
                          <TableCell>
                            <Checkbox
                              checked={row.present}
                              onCheckedChange={(checked) =>
                                toggleAttendanceRow(row.tenantId, checked === true)
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {row.present ? (
                                <CheckCircle2 className="size-4 text-emerald-500" />
                              ) : (
                                <XCircle className="size-4 text-slate-300 dark:text-slate-600" />
                              )}
                              <span className="font-medium text-sm">{row.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min={0}
                              max={20}
                              value={row.guestCount}
                              onChange={(e) =>
                                updateAttendanceRow(
                                  row.tenantId,
                                  'guestCount',
                                  parseInt(e.target.value) || 0
                                )
                              }
                              className="w-20 text-center h-8"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              placeholder="Notes..."
                              value={row.notes}
                              onChange={(e) =>
                                updateAttendanceRow(row.tenantId, 'notes', e.target.value)
                              }
                              className="h-8 text-sm"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Consumption Tab ────────────────────────────────── */}
        <TabsContent value="consumption" className="space-y-4 mt-4">
          {/* Controls */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end justify-between">
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Period</Label>
                    <Select
                      value={String(consumptionDays)}
                      onValueChange={(v) => setConsumptionDays(Number(v))}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7">Last 7 days</SelectItem>
                        <SelectItem value="14">Last 14 days</SelectItem>
                        <SelectItem value="30">Last 30 days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="relative">
                    <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input
                      placeholder="Search items..."
                      value={consumptionSearch}
                      onChange={(e) => setConsumptionSearch(e.target.value)}
                      className="pl-9 w-full sm:w-[200px]"
                    />
                  </div>
                </div>
                {canCreate && (
                  <Button onClick={() => setShowConsumptionDialog(true)} className="gap-2">
                    <Plus className="size-4" />
                    Add Consumption Log
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Consumption Chart */}
          {consumptionChartData.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="size-4" />
                  Daily Consumption Trend
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <ChartContainer config={consumptionChartConfig} className="h-[250px] w-full">
                  <BarChart data={consumptionChartData} accessibilityLayer>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      fontSize={12}
                    />
                    <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="consumed" fill="var(--color-consumed)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="wastage" fill="var(--color-wastage)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          )}

          {/* Consumption Table */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Consumption Logs</CardTitle>
              <CardDescription>
                {filteredConsumption.length} record(s) in the last {consumptionDays} days
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-6 space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : filteredConsumption.length === 0 ? (
                <div className="p-8 text-center">
                  <Package className="size-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                  <p className="text-slate-500 dark:text-slate-400">No consumption logs found</p>
                </div>
              ) : (
                <ScrollArea className="max-h-96">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item Name</TableHead>
                        <TableHead>Meal</TableHead>
                        <TableHead className="text-right">Issued</TableHead>
                        <TableHead className="text-right">Consumed</TableHead>
                        <TableHead className="text-right">Returned</TableHead>
                        <TableHead className="text-right">Wastage</TableHead>
                        <TableHead>Unit</TableHead>
                        <TableHead className="text-right">Cost/Unit</TableHead>
                        <TableHead className="text-right">Total Cost</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredConsumption.map((log: ConsumptionLog) => {
                        const mealInfo = getMealColor(log.mealType)
                        return (
                          <TableRow key={log.id}>
                            <TableCell className="font-medium text-sm">
                              {log.item?.name || '—'}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={`text-xs ${mealInfo.color} ${mealInfo.border}`}>
                                {mealInfo.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">{log.issuedQty}</TableCell>
                            <TableCell className="text-right">{log.consumedQty}</TableCell>
                            <TableCell className="text-right">{log.returnedQty}</TableCell>
                            <TableCell className="text-right">
                              <span className={log.wastageQty > 0 ? 'text-red-600 dark:text-red-400 font-medium' : ''}>
                                {log.wastageQty}
                              </span>
                            </TableCell>
                            <TableCell className="text-sm">{log.unit}</TableCell>
                            <TableCell className="text-right text-sm">{formatCurrency(log.costPerUnit)}</TableCell>
                            <TableCell className="text-right font-medium text-sm">
                              {formatCurrency(log.totalCost)}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                      {/* Totals row */}
                      <TableRow className="bg-slate-50 dark:bg-slate-800/50 font-semibold">
                        <TableCell colSpan={2}>Totals</TableCell>
                        <TableCell className="text-right">{consumptionTotals.issued.toFixed(1)}</TableCell>
                        <TableCell className="text-right">{consumptionTotals.consumed.toFixed(1)}</TableCell>
                        <TableCell className="text-right">{consumptionTotals.returned.toFixed(1)}</TableCell>
                        <TableCell className="text-right">
                          <span className={consumptionTotals.wastage > 0 ? 'text-red-600 dark:text-red-400' : ''}>
                            {consumptionTotals.wastage.toFixed(1)}
                          </span>
                        </TableCell>
                        <TableCell />
                        <TableCell />
                        <TableCell className="text-right">{formatCurrency(consumptionTotals.cost)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Waste Management Tab ───────────────────────────── */}
        <TabsContent value="waste" className="space-y-4 mt-4">
          {/* Waste Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Trash2 className="size-4 text-red-500" />
                  <p className="text-xs text-slate-500 dark:text-slate-400">Total Waste Cost</p>
                </div>
                <p className="text-xl font-bold text-red-600 dark:text-red-400 mt-1">
                  {formatCurrency(wasteStats.totalWaste)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Apple className="size-4 text-amber-500" />
                  <p className="text-xs text-slate-500 dark:text-slate-400">Food Waste</p>
                </div>
                <p className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                  {formatCurrency(wasteStats.foodWaste)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Clock className="size-4 text-orange-500" />
                  <p className="text-xs text-slate-500 dark:text-slate-400">Expired</p>
                </div>
                <p className="text-xl font-bold text-orange-600 dark:text-orange-400 mt-1">
                  {formatCurrency(wasteStats.expired)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="size-4 text-rose-500" />
                  <p className="text-xs text-slate-500 dark:text-slate-400">Damaged</p>
                </div>
                <p className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-1">
                  {formatCurrency(wasteStats.damaged)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Controls */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end justify-between">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Period</Label>
                  <Select
                    value={String(wasteDays)}
                    onValueChange={(v) => setWasteDays(Number(v))}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">Last 7 days</SelectItem>
                      <SelectItem value="14">Last 14 days</SelectItem>
                      <SelectItem value="30">Last 30 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {canCreate && (
                  <Button onClick={() => setShowWasteDialog(true)} className="gap-2">
                    <Plus className="size-4" />
                    Add Waste Record
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Waste Table */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Waste Records</CardTitle>
              <CardDescription>
                {(messData.waste || []).length} record(s) in the last {wasteDays} days
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-6 space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (messData.waste || []).length === 0 ? (
                <div className="p-8 text-center">
                  <Leaf className="size-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                  <p className="text-slate-500 dark:text-slate-400">No waste records found</p>
                </div>
              ) : (
                <ScrollArea className="max-h-96">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Item</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead>Unit</TableHead>
                        <TableHead className="text-right">Est. Cost</TableHead>
                        <TableHead>Disposal</TableHead>
                        <TableHead>Recorded By</TableHead>
                        <TableHead className="w-12" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(messData.waste || []).map((record: WasteRecord) => {
                        const catColor: Record<string, string> = {
                          food_waste: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
                          expired: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
                          damaged: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
                          spoilage: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300',
                          other: 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300',
                        }
                        const disposalIcon: Record<string, React.ReactNode> = {
                          compost: <Leaf className="size-3" />,
                          trash: <Trash2 className="size-3" />,
                          donation: <Gift className="size-3" />,
                          recycling: <Recycle className="size-3" />,
                        }
                        return (
                          <TableRow key={record.id}>
                            <TableCell className="text-sm">{formatDate(record.date)}</TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={`text-xs ${catColor[record.category] || catColor.other}`}
                              >
                                {getWasteCategoryLabel(record.category)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm max-w-[200px] truncate" title={record.description}>
                              {record.description}
                            </TableCell>
                            <TableCell className="text-sm">{record.item?.name || '—'}</TableCell>
                            <TableCell className="text-right">{record.quantity}</TableCell>
                            <TableCell className="text-sm">{record.unit || '—'}</TableCell>
                            <TableCell className="text-right text-sm font-medium text-red-600 dark:text-red-400">
                              {formatCurrency(record.estimatedCost)}
                            </TableCell>
                            <TableCell>
                              {record.disposalMethod ? (
                                <Badge variant="outline" className="text-xs gap-1">
                                  {disposalIcon[record.disposalMethod]}
                                  {getDisposalLabel(record.disposalMethod)}
                                </Badge>
                              ) : (
                                '—'
                              )}
                            </TableCell>
                            <TableCell className="text-sm">{record.recordedBy?.name || '—'}</TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="size-8">
                                    <MoreVertical className="size-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {canUpdate && (
                                    <DropdownMenuItem className="gap-2 text-slate-600 dark:text-slate-400">
                                      <Edit3 className="size-3.5" />
                                      View Details
                                    </DropdownMenuItem>
                                  )}
                                  {canDelete && (
                                    <DropdownMenuItem className="gap-2 text-red-600 dark:text-red-400">
                                      <Trash className="size-3.5" />
                                      Delete
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
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ─── Add Consumption Dialog ────────────────────────────── */}
      <Dialog open={showConsumptionDialog} onOpenChange={setShowConsumptionDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="size-5" />
              Add Consumption Log
            </DialogTitle>
            <DialogDescription>
              Record daily consumption of inventory items
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="cons-item">Inventory Item *</Label>
              <Select
                value={consumptionForm.itemId}
                onValueChange={(v) => setConsumptionForm(prev => ({ ...prev, itemId: v }))}
              >
                <SelectTrigger id="cons-item">
                  <SelectValue placeholder="Select an item" />
                </SelectTrigger>
                <SelectContent>
                  {inventoryItems.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name} ({item.unit}) — Stock: {item.currentStock}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="cons-meal">Meal Type</Label>
              <Select
                value={consumptionForm.mealType}
                onValueChange={(v) => setConsumptionForm(prev => ({ ...prev, mealType: v }))}
              >
                <SelectTrigger id="cons-meal">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MEAL_TYPES.map((meal) => (
                    <SelectItem key={meal.value} value={meal.value}>
                      {meal.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="cons-date">Date</Label>
                <Input
                  id="cons-date"
                  type="date"
                  value={consumptionForm.date}
                  onChange={(e) => setConsumptionForm(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cons-issued">Issued Qty</Label>
                <Input
                  id="cons-issued"
                  type="number"
                  min={0}
                  step="0.1"
                  value={consumptionForm.issuedQty}
                  onChange={(e) => setConsumptionForm(prev => ({ ...prev, issuedQty: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="cons-consumed">Consumed</Label>
                <Input
                  id="cons-consumed"
                  type="number"
                  min={0}
                  step="0.1"
                  value={consumptionForm.consumedQty}
                  onChange={(e) => setConsumptionForm(prev => ({ ...prev, consumedQty: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cons-returned">Returned</Label>
                <Input
                  id="cons-returned"
                  type="number"
                  min={0}
                  step="0.1"
                  value={consumptionForm.returnedQty}
                  onChange={(e) => setConsumptionForm(prev => ({ ...prev, returnedQty: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cons-wastage">Wastage</Label>
                <Input
                  id="cons-wastage"
                  type="number"
                  min={0}
                  step="0.1"
                  value={consumptionForm.wastageQty}
                  onChange={(e) => setConsumptionForm(prev => ({ ...prev, wastageQty: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="cons-notes">Notes</Label>
              <Textarea
                id="cons-notes"
                placeholder="Optional notes..."
                value={consumptionForm.notes}
                onChange={(e) => setConsumptionForm(prev => ({ ...prev, notes: e.target.value }))}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConsumptionDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddConsumption} disabled={savingConsumption} className="gap-2">
              {savingConsumption ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              Add Log
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Add Waste Record Dialog ──────────────────────────── */}
      <Dialog open={showWasteDialog} onOpenChange={setShowWasteDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="size-5" />
              Add Waste Record
            </DialogTitle>
            <DialogDescription>
              Record waste items. Stock will be automatically deducted if an inventory item is selected.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="waste-date">Date *</Label>
                <Input
                  id="waste-date"
                  type="date"
                  value={wasteForm.date}
                  onChange={(e) => setWasteForm(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="waste-category">Category *</Label>
                <Select
                  value={wasteForm.category}
                  onValueChange={(v) => setWasteForm(prev => ({ ...prev, category: v }))}
                >
                  <SelectTrigger id="waste-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WASTE_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="waste-desc">Description *</Label>
              <Textarea
                id="waste-desc"
                placeholder="Describe the waste..."
                value={wasteForm.description}
                onChange={(e) => setWasteForm(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="waste-item">Inventory Item (optional)</Label>
              <Select
                value={wasteForm.itemId}
                onValueChange={(v) => {
                  const item = inventoryItems.find(i => i.id === v)
                  setWasteForm(prev => ({
                    ...prev,
                    itemId: v,
                    unit: item?.unit || 'kg',
                    estimatedCost: item ? prev.quantity * item.unitPrice : prev.estimatedCost,
                  }))
                }}
              >
                <SelectTrigger id="waste-item">
                  <SelectValue placeholder="Select item (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {inventoryItems.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name} ({item.unit}) — Stock: {item.currentStock}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="waste-qty">Quantity</Label>
                <Input
                  id="waste-qty"
                  type="number"
                  min={0}
                  step="0.1"
                  value={wasteForm.quantity}
                  onChange={(e) => {
                    const qty = parseFloat(e.target.value) || 0
                    const item = inventoryItems.find(i => i.id === wasteForm.itemId)
                    setWasteForm(prev => ({
                      ...prev,
                      quantity: qty,
                      estimatedCost: item ? qty * item.unitPrice : prev.estimatedCost,
                    }))
                  }}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="waste-unit">Unit</Label>
                <Select
                  value={wasteForm.unit}
                  onValueChange={(v) => setWasteForm(prev => ({ ...prev, unit: v }))}
                >
                  <SelectTrigger id="waste-unit">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">Kg</SelectItem>
                    <SelectItem value="litres">Litres</SelectItem>
                    <SelectItem value="pieces">Pieces</SelectItem>
                    <SelectItem value="packets">Packets</SelectItem>
                    <SelectItem value="grams">Grams</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="waste-cost">Est. Cost (₹)</Label>
                <Input
                  id="waste-cost"
                  type="number"
                  min={0}
                  step="0.01"
                  value={wasteForm.estimatedCost}
                  onChange={(e) => setWasteForm(prev => ({ ...prev, estimatedCost: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Disposal Method</Label>
              <div className="flex flex-wrap gap-2">
                {DISPOSAL_METHODS.map((method) => {
                  const Icon = method.icon
                  const isActive = wasteForm.disposalMethod === method.value
                  return (
                    <Button
                      key={method.value}
                      type="button"
                      variant={isActive ? 'default' : 'outline'}
                      size="sm"
                      className="gap-1.5"
                      onClick={() => setWasteForm(prev => ({ ...prev, disposalMethod: method.value }))}
                    >
                      <Icon className="size-3.5" />
                      {method.label}
                    </Button>
                  )
                })}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="waste-notes">Notes</Label>
              <Textarea
                id="waste-notes"
                placeholder="Optional notes..."
                value={wasteForm.notes}
                onChange={(e) => setWasteForm(prev => ({ ...prev, notes: e.target.value }))}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWasteDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddWaste} disabled={savingWaste} className="gap-2">
              {savingWaste ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              Add Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
