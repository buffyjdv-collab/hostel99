'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useAppStore, hasPermission } from '@/lib/store'
import { buildAuthQuery, buildAuthBody } from '@/lib/api'
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { useToast } from '@/hooks/use-toast'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DoorOpen,
  Plus,
  Eye,
  Pencil,
  Ban,
  BedDouble,
  LayoutGrid,
  List,
  Filter,
  Loader2,
  Search,
  Building2,
  User,
  IndianRupee,
  BedSingle,
  Map as MapIcon,
  Snowflake,
  Sun,
  Crown,
  Sparkles,
  CircleDot,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Grid3X3,
  Trash2,
} from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────────

type RoomType = 'ac' | 'non_ac' | 'deluxe' | 'premium'
type SharingType = 'single' | 'double' | 'triple' | 'four_sharing'
type RoomStatus = 'available' | 'occupied' | 'maintenance' | 'blocked'
type BedStatus = 'available' | 'occupied' | 'blocked' | 'maintenance'

interface BedData {
  id: string
  name: string
  number: number
  status: BedStatus
  tenant?: { id: string; name: string } | null
}

interface RoomData {
  id: string
  name: string
  number: string
  floorId: string
  floor: { id: string; name: string; number: number }
  buildingId: string
  building: { id: string; name: string }
  propertyId: string
  property: { id: string; name: string }
  sharingType: SharingType
  roomType: RoomType
  totalBeds: number
  occupiedBeds: number
  rent: number
  deposit: number
  amenities?: string
  status: RoomStatus
  images?: string
  beds: BedData[]
  occupiedBedsCount: number
  availableBedsCount: number
  tenantsCount: number
  createdAt: string
  updatedAt: string
}

interface PropertyInfo {
  id: string
  name: string
  type: string
  buildings?: { id: string; name: string; floors?: { id: string; name: string; number: number }[] }[]
}

interface RoomFormData {
  propertyId: string
  buildingId: string
  floorId: string
  name: string
  number: string
  sharingType: SharingType
  roomType: RoomType
  totalBeds: number
  rent: number
  deposit: number
  amenities: string[]
}

interface EditRoomFormData {
  name: string
  number: string
  floor: string
  roomType: RoomType
  sharingType: SharingType
  totalBeds: number
  rent: number
  deposit: number
  status: RoomStatus
  amenities: string[]
}

// ── Constants ────────────────────────────────────────────────────────────────

const ROOM_TYPE_CONFIG: Record<RoomType, { label: string; icon: typeof Snowflake; bgClass: string; textClass: string }> = {
  ac: {
    label: 'AC',
    icon: Snowflake,
    bgClass: 'bg-blue-100 dark:bg-blue-950/50',
    textClass: 'text-blue-700 dark:text-blue-300',
  },
  non_ac: {
    label: 'Non-AC',
    icon: Sun,
    bgClass: 'bg-amber-100 dark:bg-amber-950/50',
    textClass: 'text-amber-700 dark:text-amber-300',
  },
  deluxe: {
    label: 'Deluxe',
    icon: Crown,
    bgClass: 'bg-purple-100 dark:bg-purple-950/50',
    textClass: 'text-purple-700 dark:text-purple-300',
  },
  premium: {
    label: 'Premium',
    icon: Sparkles,
    bgClass: 'bg-emerald-100 dark:bg-emerald-950/50',
    textClass: 'text-emerald-700 dark:text-emerald-300',
  },
}

const SHARING_TYPE_CONFIG: Record<SharingType, { label: string; shortLabel: string }> = {
  single: { label: 'Single Sharing', shortLabel: '1S' },
  double: { label: 'Double Sharing', shortLabel: '2S' },
  triple: { label: 'Triple Sharing', shortLabel: '3S' },
  four_sharing: { label: 'Four Sharing', shortLabel: '4S' },
}

const STATUS_CONFIG: Record<RoomStatus, { label: string; bgClass: string; textClass: string; dotClass: string }> = {
  available: {
    label: 'Available',
    bgClass: 'bg-emerald-100 dark:bg-emerald-950/50',
    textClass: 'text-emerald-700 dark:text-emerald-300',
    dotClass: 'bg-emerald-500',
  },
  occupied: {
    label: 'Occupied',
    bgClass: 'bg-blue-100 dark:bg-blue-950/50',
    textClass: 'text-blue-700 dark:text-blue-300',
    dotClass: 'bg-blue-500',
  },
  maintenance: {
    label: 'Maintenance',
    bgClass: 'bg-red-100 dark:bg-red-950/50',
    textClass: 'text-red-700 dark:text-red-300',
    dotClass: 'bg-red-500',
  },
  blocked: {
    label: 'Blocked',
    bgClass: 'bg-gray-100 dark:bg-gray-950/50',
    textClass: 'text-gray-700 dark:text-gray-300',
    dotClass: 'bg-gray-500',
  },
}

const BED_STATUS_COLORS: Record<BedStatus, string> = {
  available: 'bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600',
  occupied: 'bg-emerald-500 border-emerald-600',
  blocked: 'bg-gray-400 dark:bg-gray-500 border-gray-500 dark:border-gray-400',
  maintenance: 'bg-red-500 border-red-600',
}

const ROOM_AMENITIES = [
  'AC',
  'WiFi',
  'Attached Bathroom',
  'Balcony',
  'Window',
  'Almirah',
  'Table',
  'Chair',
  'Fan',
  'Geyser',
  'TV',
  'Curtains',
  'Mirror',
  'Shoe Rack',
]

// ── Helpers ──────────────────────────────────────────────────────────────────

function parseAmenities(amenitiesStr?: string | null): string[] {
  if (!amenitiesStr) return []
  try {
    const parsed = JSON.parse(amenitiesStr)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return amenitiesStr.split(',').map((a) => a.trim()).filter(Boolean)
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// ── Sub-components ───────────────────────────────────────────────────────────

function RoomCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
        <Skeleton className="h-10 w-full rounded" />
        <div className="flex justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
        </div>
      </CardContent>
      <CardFooter className="gap-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
      </CardFooter>
    </Card>
  )
}

function StatCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-6 w-12" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function BedVisualization({ beds }: { beds: BedData[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {beds.map((bed) => (
        <div
          key={bed.id}
          className={`h-6 w-6 rounded-sm border flex items-center justify-center text-[8px] font-bold text-white ${BED_STATUS_COLORS[bed.status]}`}
          title={`${bed.name} - ${bed.status}${bed.tenant ? ` (${bed.tenant.name})` : ''}`}
        >
          {bed.number}
        </div>
      ))}
    </div>
  )
}

function VacancyMap({ rooms }: { rooms: RoomData[] }) {
  const statusColor = (status: RoomStatus) => {
    switch (status) {
      case 'available': return 'bg-emerald-500 hover:bg-emerald-400'
      case 'occupied': return 'bg-blue-500 hover:bg-blue-400'
      case 'maintenance': return 'bg-red-500 hover:bg-red-400'
      case 'blocked': return 'bg-gray-400 hover:bg-gray-300'
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Grid3X3 className="h-4 w-4 text-emerald-600" />
              Vacancy Map
            </CardTitle>
            <CardDescription className="text-xs mt-1">Color-coded room status overview</CardDescription>
          </div>
          <div className="flex items-center gap-3 text-[10px]">
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" /> Available</span>
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-blue-500" /> Occupied</span>
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-red-500" /> Maintenance</span>
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-gray-400" /> Blocked</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {rooms.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No rooms to display</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {rooms.map((room) => (
              <div
                key={room.id}
                className={`h-8 w-8 rounded text-[9px] font-bold text-white flex items-center justify-center cursor-default transition-colors ${statusColor(room.status)}`}
                title={`${room.name} (${room.number}) - ${STATUS_CONFIG[room.status].label} | ${room.property?.name || 'Unknown'}`}
              >
                {room.number.slice(0, 3)}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ── Main Component ───────────────────────────────────────────────────────────

export function RoomsPage() {
  const { currentUser, currentHostelId } = useAppStore()
  const { toast } = useToast()
  const role = currentUser?.role || ''
  const canCreate = hasPermission(role, 'rooms:create')
  const canUpdate = hasPermission(role, 'rooms:update')
  const canDelete = hasPermission(role, 'rooms:delete')

  // ── State ────────────────────────────────────────────────────────────────
  const [rooms, setRooms] = useState<RoomData[]>([])
  const [properties, setProperties] = useState<PropertyInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showVacancyMap, setShowVacancyMap] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState<RoomData | null>(null)
  const [submittingEdit, setSubmittingEdit] = useState(false)
  const [editFormData, setEditFormData] = useState<EditRoomFormData>({
    name: '',
    number: '',
    floor: '',
    roomType: 'non_ac',
    sharingType: 'single',
    totalBeds: 1,
    rent: 0,
    deposit: 0,
    status: 'available',
    amenities: [],
  })

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)

  // Filters
  const [filterProperty, setFilterProperty] = useState('all')
  const [filterFloor, setFilterFloor] = useState('all')
  const [filterRoomType, setFilterRoomType] = useState('all')
  const [filterSharingType, setFilterSharingType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  // Form
  const [formData, setFormData] = useState<RoomFormData>({
    propertyId: '',
    buildingId: '',
    floorId: '',
    name: '',
    number: '',
    sharingType: 'single',
    roomType: 'non_ac',
    totalBeds: 1,
    rent: 0,
    deposit: 0,
    amenities: [],
  })

  // ── Derived Data ─────────────────────────────────────────────────────────
  const selectedProperty = useMemo(
    () => properties.find((p) => p.id === formData.propertyId),
    [properties, formData.propertyId]
  )

  const availableBuildings = useMemo(() => selectedProperty?.buildings ?? [], [selectedProperty])

  const selectedBuilding = useMemo(
    () => availableBuildings.find((b) => b.id === formData.buildingId),
    [availableBuildings, formData.buildingId]
  )

  const availableFloors = useMemo(() => selectedBuilding?.floors ?? [], [selectedBuilding])

  // Floor options for filter
  const floorOptions = useMemo(() => {
    const floors = new Set<string>()
    rooms.forEach((r) => {
      if (r.floor?.name) floors.add(r.floor.name)
    })
    return Array.from(floors).sort()
  }, [rooms])

  // ── Data Fetching ────────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([fetchRooms(), fetchProperties()])
  }, [])

  const fetchRooms = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/rooms?' + buildAuthQuery())
      if (res.ok) {
        const data = await res.json()
        setRooms(data)
      }
    } catch (error) {
      console.error('Failed to fetch rooms:', error)
    } finally {
      setLoading(false)
    }
  }, [currentHostelId])

  async function fetchProperties() {
    try {
      const res = await fetch('/api/properties?' + buildAuthQuery())
      if (res.ok) {
        setProperties(await res.json())
      }
    } catch (error) {
      console.error('Failed to fetch properties:', error)
    }
  }

  // ── Computed Values ──────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const totalRooms = rooms.length
    const totalBeds = rooms.reduce((sum, r) => sum + r.totalBeds, 0)
    const occupied = rooms.reduce((sum, r) => sum + r.occupiedBedsCount, 0)
    const vacant = totalBeds - occupied
    const occupancyPct = totalBeds > 0 ? Math.round((occupied / totalBeds) * 100) : 0
    return { totalRooms, totalBeds, occupied, vacant, occupancyPct }
  }, [rooms])

  const filteredRooms = useMemo(() => {
    let result = rooms
    if (filterProperty !== 'all') {
      result = result.filter((r) => r.propertyId === filterProperty)
    }
    if (filterFloor !== 'all') {
      result = result.filter((r) => r.floor?.name === filterFloor)
    }
    if (filterRoomType !== 'all') {
      result = result.filter((r) => r.roomType === filterRoomType)
    }
    if (filterSharingType !== 'all') {
      result = result.filter((r) => r.sharingType === filterSharingType)
    }
    if (filterStatus !== 'all') {
      result = result.filter((r) => r.status === filterStatus)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.number.toLowerCase().includes(q) ||
          r.property?.name.toLowerCase().includes(q) ||
          r.building?.name.toLowerCase().includes(q)
      )
    }
    return result
  }, [rooms, filterProperty, filterFloor, filterRoomType, filterSharingType, filterStatus, searchQuery])

  // ── Form Handlers ────────────────────────────────────────────────────────
  function handleFormChange(field: keyof RoomFormData, value: string | number | string[]) {
    setFormData((prev) => {
      const next = { ...prev, [field]: value }
      // Reset building when property changes
      if (field === 'propertyId') {
        next.buildingId = ''
        next.floorId = ''
      }
      // Reset floor when building changes
      if (field === 'buildingId') {
        next.floorId = ''
      }
      return next
    })
  }

  function handleAmenityToggle(amenity: string) {
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.name || !formData.number || !formData.floorId || !formData.buildingId || !formData.propertyId) return

    try {
      setSubmitting(true)
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildAuthBody({
          ...formData,
          amenities: formData.amenities.length > 0 ? JSON.stringify(formData.amenities) : null,
          status: 'available',
        })),
      })

      if (res.ok) {
        const newRoom = await res.json()
        setRooms((prev) => [newRoom, ...prev])
        setDialogOpen(false)
        resetForm()
        toast({ title: 'Success', description: 'Room created successfully' })
      } else {
        const data = await res.json()
        toast({ title: 'Error', description: data.error || 'Failed to create room', variant: 'destructive' })
      }
    } catch (error) {
      console.error('Failed to create room:', error)
      toast({ title: 'Error', description: 'Failed to create room', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  function resetForm() {
    setFormData({
      propertyId: '',
      buildingId: '',
      floorId: '',
      name: '',
      number: '',
      sharingType: 'single',
      roomType: 'non_ac',
      totalBeds: 1,
      rent: 0,
      deposit: 0,
      amenities: [],
    })
  }

  // ── Edit Dialog Handlers ──────────────────────────────────────────────────

  function openEditDialog(room: RoomData) {
    setSelectedRoom(room)
    setEditFormData({
      name: room.name,
      number: room.number,
      floor: room.floor?.name || '',
      roomType: room.roomType,
      sharingType: room.sharingType,
      totalBeds: room.totalBeds,
      rent: room.rent,
      deposit: room.deposit,
      status: room.status,
      amenities: parseAmenities(room.amenities),
    })
    setEditDialogOpen(true)
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedRoom || !editFormData.name.trim()) {
      toast({ title: 'Validation Error', description: 'Room name is required', variant: 'destructive' })
      return
    }

    try {
      setSubmittingEdit(true)
      const res = await fetch('/api/rooms', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildAuthBody({
          id: selectedRoom.id,
          name: editFormData.name.trim(),
          number: editFormData.number.trim(),
          roomType: editFormData.roomType,
          sharingType: editFormData.sharingType,
          totalBeds: editFormData.totalBeds,
          rent: editFormData.rent,
          deposit: editFormData.deposit,
          status: editFormData.status,
          amenities: editFormData.amenities.length > 0 ? JSON.stringify(editFormData.amenities) : undefined,
        })),
      })

      if (res.ok) {
        toast({ title: 'Success', description: 'Room updated successfully' })
        setEditDialogOpen(false)
        setSelectedRoom(null)
        fetchRooms()
      } else {
        const data = await res.json()
        toast({ title: 'Error', description: data.error || 'Failed to update room', variant: 'destructive' })
      }
    } catch (error) {
      console.error('Failed to update room:', error)
      toast({ title: 'Error', description: 'Failed to update room', variant: 'destructive' })
    } finally {
      setSubmittingEdit(false)
    }
  }

  // ── Delete Dialog Handlers ────────────────────────────────────────────────

  function handleDelete(id: string) {
    const room = rooms.find((r) => r.id === id)
    if (!room) return
    setDeleteTarget({ id: room.id, name: room.name })
    setDeleteDialogOpen(true)
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return
    try {
      setSubmittingEdit(true)
      const res = await fetch('/api/rooms', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildAuthBody({ id: deleteTarget.id })),
      })
      if (res.ok) {
        toast({ title: 'Success', description: `${deleteTarget.name} has been deleted` })
        setRooms((prev) => prev.filter((r) => r.id !== deleteTarget.id))
      } else {
        const data = await res.json()
        toast({ title: 'Error', description: data.error || 'Failed to delete room', variant: 'destructive' })
      }
    } catch (error) {
      console.error('Failed to delete room:', error)
      toast({ title: 'Error', description: 'Failed to delete room', variant: 'destructive' })
    } finally {
      setSubmittingEdit(false)
      setDeleteDialogOpen(false)
      setDeleteTarget(null)
    }
  }

  function clearFilters() {
    setFilterProperty('all')
    setFilterFloor('all')
    setFilterRoomType('all')
    setFilterSharingType('all')
    setFilterStatus('all')
    setSearchQuery('')
  }

  const hasActiveFilters = filterProperty !== 'all' || filterFloor !== 'all' || filterRoomType !== 'all' || filterSharingType !== 'all' || filterStatus !== 'all' || searchQuery.trim() !== ''

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <ScrollArea className="h-full">
      <div className="p-4 md:p-6 space-y-6">
        {/* ── Page Header ─────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              Rooms & Beds
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage room inventory, bed allocation, and occupancy across all properties
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowVacancyMap(!showVacancyMap)}
              className={showVacancyMap ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800' : ''}
            >
              <MapIcon className="mr-1.5 h-4 w-4" />
              Vacancy Map
            </Button>
            <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm() }}>
              {canCreate && (
              <DialogTrigger asChild>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Room
                </Button>
              </DialogTrigger>
              )}
              <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Room</DialogTitle>
                  <DialogDescription>
                    Configure a new room with beds, pricing, and amenities.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Property */}
                    <div className="space-y-2">
                      <Label>Property *</Label>
                      <Select
                        value={formData.propertyId}
                        onValueChange={(v) => handleFormChange('propertyId', v)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select property" />
                        </SelectTrigger>
                        <SelectContent>
                          {properties.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {/* Building */}
                    <div className="space-y-2">
                      <Label>Building *</Label>
                      <Select
                        value={formData.buildingId}
                        onValueChange={(v) => handleFormChange('buildingId', v)}
                        disabled={!formData.propertyId || availableBuildings.length === 0}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={formData.propertyId ? 'Select building' : 'Select property first'} />
                        </SelectTrigger>
                        <SelectContent>
                          {availableBuildings.map((b) => (
                            <SelectItem key={b.id} value={b.id}>
                              {b.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {/* Floor */}
                    <div className="space-y-2">
                      <Label>Floor *</Label>
                      <Select
                        value={formData.floorId}
                        onValueChange={(v) => handleFormChange('floorId', v)}
                        disabled={!formData.buildingId || availableFloors.length === 0}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={formData.buildingId ? 'Select floor' : 'Select building first'} />
                        </SelectTrigger>
                        <SelectContent>
                          {availableFloors.map((f) => (
                            <SelectItem key={f.id} value={f.id}>
                              {f.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {/* Room Name */}
                    <div className="space-y-2">
                      <Label htmlFor="room-name">Room Name *</Label>
                      <Input
                        id="room-name"
                        placeholder="e.g. Room 101"
                        value={formData.name}
                        onChange={(e) => handleFormChange('name', e.target.value)}
                        required
                      />
                    </div>
                    {/* Room Number */}
                    <div className="space-y-2">
                      <Label htmlFor="room-number">Room Number *</Label>
                      <Input
                        id="room-number"
                        placeholder="e.g. 101"
                        value={formData.number}
                        onChange={(e) => handleFormChange('number', e.target.value)}
                        required
                      />
                    </div>
                    {/* Sharing Type */}
                    <div className="space-y-2">
                      <Label>Sharing Type</Label>
                      <Select
                        value={formData.sharingType}
                        onValueChange={(v) => handleFormChange('sharingType', v)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(SHARING_TYPE_CONFIG).map(([key, cfg]) => (
                            <SelectItem key={key} value={key}>
                              {cfg.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {/* Room Type */}
                    <div className="space-y-2">
                      <Label>Room Type</Label>
                      <Select
                        value={formData.roomType}
                        onValueChange={(v) => handleFormChange('roomType', v)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(ROOM_TYPE_CONFIG).map(([key, cfg]) => (
                            <SelectItem key={key} value={key}>
                              {cfg.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {/* Total Beds */}
                    <div className="space-y-2">
                      <Label htmlFor="room-beds">Total Beds</Label>
                      <Input
                        id="room-beds"
                        type="number"
                        min={1}
                        max={10}
                        value={formData.totalBeds}
                        onChange={(e) => handleFormChange('totalBeds', parseInt(e.target.value) || 1)}
                      />
                    </div>
                    {/* Rent */}
                    <div className="space-y-2">
                      <Label htmlFor="room-rent">Rent (₹/month)</Label>
                      <Input
                        id="room-rent"
                        type="number"
                        min={0}
                        value={formData.rent}
                        onChange={(e) => handleFormChange('rent', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    {/* Deposit */}
                    <div className="space-y-2">
                      <Label htmlFor="room-deposit">Deposit (₹)</Label>
                      <Input
                        id="room-deposit"
                        type="number"
                        min={0}
                        value={formData.deposit}
                        onChange={(e) => handleFormChange('deposit', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                  {/* Amenities */}
                  <div className="space-y-3">
                    <Label>Amenities</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {ROOM_AMENITIES.map((amenity) => (
                        <label
                          key={amenity}
                          className="flex items-center gap-2 text-sm cursor-pointer rounded-md border px-3 py-2 hover:bg-accent/50 transition-colors"
                        >
                          <Checkbox
                            checked={formData.amenities.includes(amenity)}
                            onCheckedChange={() => handleAmenityToggle(amenity)}
                          />
                          <span>{amenity}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      disabled={submitting}
                    >
                      {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Create Room
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* ── Stats Cards ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {loading ? (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : (
            <>
              <Card className="border-l-4 border-l-emerald-500">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-emerald-100 dark:bg-emerald-950/50 p-2.5">
                      <DoorOpen className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Rooms</p>
                      <p className="text-2xl font-bold">{stats.totalRooms}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-teal-500">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-teal-100 dark:bg-teal-950/50 p-2.5">
                      <BedDouble className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Beds</p>
                      <p className="text-2xl font-bold">{stats.totalBeds}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-blue-100 dark:bg-blue-950/50 p-2.5">
                      <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Occupied</p>
                      <p className="text-2xl font-bold">{stats.occupied}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-amber-500">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-amber-100 dark:bg-amber-950/50 p-2.5">
                      <BedSingle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Vacant</p>
                      <p className="text-2xl font-bold">{stats.vacant}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-emerald-500 sm:col-span-3 lg:col-span-1">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-emerald-100 dark:bg-emerald-950/50 p-2.5">
                      <CircleDot className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Occupancy</p>
                      <p className="text-2xl font-bold">{stats.occupancyPct}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* ── Vacancy Map ──────────────────────────────────────────────────── */}
        {showVacancyMap && !loading && (
          <VacancyMap rooms={filteredRooms} />
        )}

        {/* ── Filter Bar ──────────────────────────────────────────────────── */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  Filters
                </div>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs">
                    Clear all
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {/* Property filter */}
                <Select value={filterProperty} onValueChange={setFilterProperty}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Property" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Properties</SelectItem>
                    {properties.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {/* Floor filter */}
                <Select value={filterFloor} onValueChange={setFilterFloor}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Floor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Floors</SelectItem>
                    {floorOptions.map((f) => (
                      <SelectItem key={f} value={f}>{f}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {/* Room Type filter */}
                <Select value={filterRoomType} onValueChange={setFilterRoomType}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Room Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {Object.entries(ROOM_TYPE_CONFIG).map(([key, cfg]) => (
                      <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {/* Sharing Type filter */}
                <Select value={filterSharingType} onValueChange={setFilterSharingType}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sharing" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sharing</SelectItem>
                    {Object.entries(SHARING_TYPE_CONFIG).map(([key, cfg]) => (
                      <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {/* Status filter */}
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                      <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search rooms..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── View Toggle ──────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {filteredRooms.length} of {rooms.length} rooms
          </p>
          <div className="flex items-center rounded-md border">
            <Button
              variant="ghost"
              size="sm"
              className={viewMode === 'grid' ? 'bg-accent' : ''}
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={viewMode === 'list' ? 'bg-accent' : ''}
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* ── Room Grid / List ─────────────────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <RoomCardSkeleton />
            <RoomCardSkeleton />
            <RoomCardSkeleton />
            <RoomCardSkeleton />
            <RoomCardSkeleton />
            <RoomCardSkeleton />
          </div>
        ) : filteredRooms.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <DoorOpen className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold">No rooms found</h3>
              <p className="text-muted-foreground mt-1 max-w-sm">
                {hasActiveFilters
                  ? 'Try adjusting your filters to find what you\'re looking for.'
                  : 'Get started by adding your first room to the system.'}
              </p>
              {!hasActiveFilters && canCreate && (
                <Button
                  className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => setDialogOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Room
                </Button>
              )}
            </CardContent>
          </Card>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRooms.map((room) => (
              <RoomCard key={room.id} room={room} onEdit={openEditDialog} onDelete={handleDelete} />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRooms.map((room) => (
              <RoomListItem key={room.id} room={room} onEdit={openEditDialog} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>

      {/* ── Edit Room Dialog ────────────────────────────────────────────────── */}
      <Dialog open={editDialogOpen} onOpenChange={(open) => { setEditDialogOpen(open); if (!open) setSelectedRoom(null) }}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Room</DialogTitle>
            <DialogDescription>
              Update the room details below.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Room Name */}
              <div className="space-y-2">
                <Label htmlFor="edit-room-name">Room Name *</Label>
                <Input
                  id="edit-room-name"
                  placeholder="e.g. Room 101"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData((prev) => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              {/* Room Number */}
              <div className="space-y-2">
                <Label htmlFor="edit-room-number">Room Number *</Label>
                <Input
                  id="edit-room-number"
                  placeholder="e.g. 101"
                  value={editFormData.number}
                  onChange={(e) => setEditFormData((prev) => ({ ...prev, number: e.target.value }))}
                  required
                />
              </div>
              {/* Floor (read-only display) */}
              <div className="space-y-2">
                <Label htmlFor="edit-room-floor">Floor</Label>
                <Input
                  id="edit-room-floor"
                  value={editFormData.floor}
                  disabled
                  className="bg-muted"
                />
              </div>
              {/* Room Type */}
              <div className="space-y-2">
                <Label>Room Type</Label>
                <Select
                  value={editFormData.roomType}
                  onValueChange={(v) => setEditFormData((prev) => ({ ...prev, roomType: v as RoomType }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ROOM_TYPE_CONFIG).map(([key, cfg]) => (
                      <SelectItem key={key} value={key}>
                        {cfg.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Sharing Type */}
              <div className="space-y-2">
                <Label>Sharing Type</Label>
                <Select
                  value={editFormData.sharingType}
                  onValueChange={(v) => setEditFormData((prev) => ({ ...prev, sharingType: v as SharingType }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(SHARING_TYPE_CONFIG).map(([key, cfg]) => (
                      <SelectItem key={key} value={key}>
                        {cfg.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Total Beds */}
              <div className="space-y-2">
                <Label htmlFor="edit-room-beds">Total Beds</Label>
                <Input
                  id="edit-room-beds"
                  type="number"
                  min={1}
                  max={10}
                  value={editFormData.totalBeds}
                  onChange={(e) => setEditFormData((prev) => ({ ...prev, totalBeds: parseInt(e.target.value) || 1 }))}
                />
              </div>
              {/* Rent */}
              <div className="space-y-2">
                <Label htmlFor="edit-room-rent">Rent (₹/month)</Label>
                <Input
                  id="edit-room-rent"
                  type="number"
                  min={0}
                  value={editFormData.rent}
                  onChange={(e) => setEditFormData((prev) => ({ ...prev, rent: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              {/* Deposit */}
              <div className="space-y-2">
                <Label htmlFor="edit-room-deposit">Deposit (₹)</Label>
                <Input
                  id="edit-room-deposit"
                  type="number"
                  min={0}
                  value={editFormData.deposit}
                  onChange={(e) => setEditFormData((prev) => ({ ...prev, deposit: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              {/* Status */}
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={editFormData.status}
                  onValueChange={(v) => setEditFormData((prev) => ({ ...prev, status: v as RoomStatus }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                      <SelectItem key={key} value={key}>
                        {cfg.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {/* Amenities */}
            <div className="space-y-3">
              <Label>Amenities</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {ROOM_AMENITIES.map((amenity) => (
                  <label
                    key={amenity}
                    className="flex items-center gap-2 text-sm cursor-pointer rounded-md border px-3 py-2 hover:bg-accent/50 transition-colors"
                  >
                    <Checkbox
                      checked={editFormData.amenities.includes(amenity)}
                      onCheckedChange={() => setEditFormData((prev) => ({
                        ...prev,
                        amenities: prev.amenities.includes(amenity)
                          ? prev.amenities.filter((a) => a !== amenity)
                          : [...prev.amenities, amenity],
                      }))}
                    />
                    <span>{amenity}</span>
                  </label>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)} disabled={submittingEdit}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={submittingEdit}
              >
                {submittingEdit && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Room
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation Dialog ─────────────────────────────────────────── */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Room</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This action cannot be undone. The room and all its beds will be permanently removed from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submittingEdit}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={submittingEdit}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {submittingEdit && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ScrollArea>
  )
}

// ── Room Card (Grid View) ────────────────────────────────────────────────────

function RoomCard({ room, onEdit, onDelete }: { room: RoomData; onEdit: (room: RoomData) => void; onDelete: (id: string) => void }) {
  const { currentUser } = useAppStore()
  const role = currentUser?.role || ''
  const canUpdate = hasPermission(role, 'rooms:update')
  const canDelete = hasPermission(role, 'rooms:delete')
  const roomTypeConfig = ROOM_TYPE_CONFIG[room.roomType] || ROOM_TYPE_CONFIG.non_ac
  const sharingConfig = SHARING_TYPE_CONFIG[room.sharingType] || SHARING_TYPE_CONFIG.single
  const statusConfig = STATUS_CONFIG[room.status] || STATUS_CONFIG.available
  const TypeIcon = roomTypeConfig.icon
  const amenities = parseAmenities(room.amenities)
  const occupancyPct = room.totalBeds > 0 ? Math.round((room.occupiedBedsCount / room.totalBeds) * 100) : 0

  // Find the first occupied bed's tenant
  const occupiedBed = room.beds?.find((b) => b.status === 'occupied' && b.tenant)

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      {/* Status color bar */}
      <div className={`h-1.5 ${statusConfig.dotClass}`} />
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2.5 min-w-0">
            <div className={`rounded-lg p-2 ${roomTypeConfig.bgClass} shrink-0`}>
              <TypeIcon className={`h-4 w-4 ${roomTypeConfig.textClass}`} />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-base truncate">{room.name}</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">#{room.number}</p>
            </div>
          </div>
          <div className={`flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium ${statusConfig.bgClass} ${statusConfig.textClass}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${statusConfig.dotClass}`} />
            {statusConfig.label}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Type badges */}
        <div className="flex flex-wrap gap-1.5">
          <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium ${roomTypeConfig.bgClass} ${roomTypeConfig.textClass}`}>
            <TypeIcon className="h-3 w-3" />
            {roomTypeConfig.label}
          </span>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            {sharingConfig.label}
          </Badge>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            {room.property?.name || 'Unknown'}
          </Badge>
        </div>

        {/* Bed visualization */}
        {room.beds && room.beds.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Bed Layout</p>
            <BedVisualization beds={room.beds} />
          </div>
        )}

        {/* Rent & Deposit */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1.5">
            <IndianRupee className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="font-semibold">{formatCurrency(room.rent)}</span>
            <span className="text-muted-foreground text-xs">/mo</span>
          </div>
          <div className="text-xs text-muted-foreground">
            Deposit: {formatCurrency(room.deposit)}
          </div>
        </div>

        {/* Occupancy bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Occupancy</span>
            <span className="font-medium">{room.occupiedBedsCount}/{room.totalBeds} beds</span>
          </div>
          <Progress value={occupancyPct} className="h-1.5" />
        </div>

        {/* Current tenant */}
        {occupiedBed?.tenant && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground rounded-md bg-muted/50 px-2.5 py-1.5">
            <User className="h-3.5 w-3.5" />
            <span>
              <span className="font-medium text-foreground">{occupiedBed.tenant.name}</span>
            </span>
          </div>
        )}

        {/* Amenities */}
        {amenities.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {amenities.slice(0, 3).map((a) => (
              <Badge key={a} variant="secondary" className="text-[10px] px-1.5 py-0">{a}</Badge>
            ))}
            {amenities.length > 3 && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">+{amenities.length - 3}</Badge>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="gap-2 pt-0">
        <Button variant="outline" size="sm" className="flex-1">
          <Eye className="mr-1.5 h-3.5 w-3.5" />
          View
        </Button>
        {canUpdate && (
        <Button variant="outline" size="sm" className="flex-1" onClick={() => onEdit(room)}>
          <Pencil className="mr-1.5 h-3.5 w-3.5" />
          Edit
        </Button>
        )}
        {canDelete && (
        <Button variant="outline" size="sm" className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50" onClick={() => onDelete(room.id)}>
          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
          Delete
        </Button>
        )}
        <Button variant="outline" size="sm" className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50">
          <Ban className="mr-1.5 h-3.5 w-3.5" />
          Block
        </Button>
      </CardFooter>
    </Card>
  )
}

// ── Room List Item (List View) ──────────────────────────────────────────────

function RoomListItem({ room, onEdit, onDelete }: { room: RoomData; onEdit: (room: RoomData) => void; onDelete: (id: string) => void }) {
  const { currentUser } = useAppStore()
  const role = currentUser?.role || ''
  const canUpdate = hasPermission(role, 'rooms:update')
  const canDelete = hasPermission(role, 'rooms:delete')
  const roomTypeConfig = ROOM_TYPE_CONFIG[room.roomType] || ROOM_TYPE_CONFIG.non_ac
  const sharingConfig = SHARING_TYPE_CONFIG[room.sharingType] || SHARING_TYPE_CONFIG.single
  const statusConfig = STATUS_CONFIG[room.status] || STATUS_CONFIG.available
  const TypeIcon = roomTypeConfig.icon
  const occupancyPct = room.totalBeds > 0 ? Math.round((room.occupiedBedsCount / room.totalBeds) * 100) : 0
  const occupiedBed = room.beds?.find((b) => b.status === 'occupied' && b.tenant)

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Room info */}
          <div className="flex items-start gap-3 min-w-0">
            <div className={`rounded-lg p-2.5 ${roomTypeConfig.bgClass} shrink-0`}>
              <TypeIcon className={`h-5 w-5 ${roomTypeConfig.textClass}`} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold">{room.name}</h3>
                <span className="text-sm text-muted-foreground">#{room.number}</span>
                <div className={`flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium ${statusConfig.bgClass} ${statusConfig.textClass}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${statusConfig.dotClass}`} />
                  {statusConfig.label}
                </div>
              </div>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium ${roomTypeConfig.bgClass} ${roomTypeConfig.textClass}`}>
                  <TypeIcon className="h-3 w-3" />
                  {roomTypeConfig.label}
                </span>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">{sharingConfig.label}</Badge>
                <span className="text-xs text-muted-foreground">
                  <Building2 className="h-3 w-3 inline mr-1" />
                  {room.property?.name || 'Unknown'}
                </span>
              </div>
              {occupiedBed?.tenant && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1.5">
                  <User className="h-3 w-3" />
                  <span>{occupiedBed.tenant.name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Bed visualization */}
          {room.beds && room.beds.length > 0 && (
            <div className="shrink-0">
              <BedVisualization beds={room.beds} />
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center gap-5 shrink-0">
            <div className="text-center min-w-[60px]">
              <p className="text-lg font-bold">{formatCurrency(room.rent)}</p>
              <p className="text-[10px] text-muted-foreground">Rent/mo</p>
            </div>
            <div className="text-center min-w-[50px]">
              <p className="text-lg font-bold">{room.occupiedBedsCount}/{room.totalBeds}</p>
              <p className="text-[10px] text-muted-foreground">Beds</p>
            </div>
            <div className="text-center min-w-[50px]">
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{occupancyPct}%</p>
              <p className="text-[10px] text-muted-foreground">Occupied</p>
            </div>
            <div className="flex gap-1.5">
              <Button variant="outline" size="sm"><Eye className="h-3.5 w-3.5" /></Button>
              {canUpdate && <Button variant="outline" size="sm" onClick={() => onEdit(room)}><Pencil className="h-3.5 w-3.5" /></Button>}
              {canDelete && <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50" onClick={() => onDelete(room.id)}><Trash2 className="h-3.5 w-3.5" /></Button>}
              <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50">
                <Ban className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
