'use client'

import { useEffect, useState, useMemo } from 'react'
import { useAppStore, hasPermission } from '@/lib/store'
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Building2,
  Plus,
  Search,
  Eye,
  Pencil,
  DoorOpen,
  BedDouble,
  BarChart3,
  MapPin,
  Star,
  LayoutGrid,
  List,
  Filter,
  Loader2,
  Home,
  Building,
  Users,
  Warehouse,
  Trash2,
} from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────────

type PropertyType = 'pg' | 'hostel' | 'co_living' | 'apartment'

interface PropertyData {
  id: string
  name: string
  type: PropertyType
  address: string
  city: string
  state?: string
  pincode?: string
  landmark?: string
  description?: string
  totalRooms: number
  totalBeds: number
  occupancy: number
  amenities?: string
  images?: string
  isActive: boolean
  ownerId: string
  owner?: { id: string; name: string; email: string }
  buildingsCount?: number
  roomsCount?: number
  occupancyPercentage?: number
  createdAt: string
  updatedAt: string
}

interface PropertyFormData {
  name: string
  type: PropertyType
  address: string
  city: string
  state: string
  pincode: string
  landmark: string
  description: string
  amenities: string[]
}

// ── Constants ────────────────────────────────────────────────────────────────

const PROPERTY_TYPE_CONFIG: Record<PropertyType, { label: string; color: string; bgClass: string; textClass: string; borderClass: string }> = {
  pg: {
    label: 'PG',
    color: 'emerald',
    bgClass: 'bg-emerald-100 dark:bg-emerald-950/50',
    textClass: 'text-emerald-700 dark:text-emerald-300',
    borderClass: 'border-emerald-200 dark:border-emerald-800',
  },
  hostel: {
    label: 'Hostel',
    color: 'blue',
    bgClass: 'bg-blue-100 dark:bg-blue-950/50',
    textClass: 'text-blue-700 dark:text-blue-300',
    borderClass: 'border-blue-200 dark:border-blue-800',
  },
  co_living: {
    label: 'Co-Living',
    color: 'purple',
    bgClass: 'bg-purple-100 dark:bg-purple-950/50',
    textClass: 'text-purple-700 dark:text-purple-300',
    borderClass: 'border-purple-200 dark:border-purple-800',
  },
  apartment: {
    label: 'Apartment',
    color: 'orange',
    bgClass: 'bg-orange-100 dark:bg-orange-950/50',
    textClass: 'text-orange-700 dark:text-orange-300',
    borderClass: 'border-orange-200 dark:border-orange-800',
  },
}

const AMENITIES_OPTIONS = [
  'WiFi',
  'AC',
  'Laundry',
  'Meals',
  'Parking',
  'Gym',
  'CCTV',
  'Power Backup',
  'Water Purifier',
  'Housekeeping',
  'Refrigerator',
  'Washing Machine',
  'TV',
  'Lift',
  'Intercom',
  'Security',
]

const FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'All Types' },
  { value: 'pg', label: 'PG' },
  { value: 'hostel', label: 'Hostel' },
  { value: 'co_living', label: 'Co-Living' },
  { value: 'apartment', label: 'Apartment' },
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

function PropertyTypeIcon({ type, className }: { type: PropertyType; className?: string }) {
  switch (type) {
    case 'pg': return <Home className={className} />
    case 'hostel': return <Building className={className} />
    case 'co_living': return <Users className={className} />
    case 'apartment': return <Warehouse className={className} />
    default: return <Building2 className={className} />
  }
}

// ── Sub-components ───────────────────────────────────────────────────────────

function PropertyCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-4 w-56" />
        <div className="grid grid-cols-3 gap-3">
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
        <div className="flex flex-wrap gap-1.5">
          <Skeleton className="h-5 w-14 rounded-full" />
          <Skeleton className="h-5 w-12 rounded-full" />
          <Skeleton className="h-5 w-10 rounded-full" />
        </div>
      </CardContent>
      <CardFooter className="gap-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-28" />
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

// ── Main Component ───────────────────────────────────────────────────────────

export function PropertiesPage() {
  const { currentUser } = useAppStore()
  const role = currentUser?.role || ''
  const canCreate = hasPermission(role, 'properties:create')
  const canUpdate = hasPermission(role, 'properties:update')
  const canDelete = hasPermission(role, 'properties:delete')

  // ── State ────────────────────────────────────────────────────────────────
  const [properties, setProperties] = useState<PropertyData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const [formData, setFormData] = useState<PropertyFormData>({
    name: '',
    type: 'pg',
    address: '',
    city: '',
    state: '',
    pincode: '',
    landmark: '',
    description: '',
    amenities: [],
  })

  // ── Data Fetching ────────────────────────────────────────────────────────
  useEffect(() => {
    fetchProperties()
  }, [])

  async function fetchProperties() {
    try {
      setLoading(true)
      const res = await fetch('/api/properties')
      if (res.ok) {
        const data = await res.json()
        setProperties(data)
      }
    } catch (error) {
      console.error('Failed to fetch properties:', error)
    } finally {
      setLoading(false)
    }
  }

  // ── Computed Values ──────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const totalProperties = properties.length
    const totalRooms = properties.reduce((sum, p) => sum + (p.roomsCount ?? p.totalRooms), 0)
    const totalBeds = properties.reduce((sum, p) => sum + p.totalBeds, 0)
    const totalOccupancy = properties.reduce((sum, p) => sum + p.occupancy, 0)
    const avgOccupancy = totalBeds > 0 ? Math.round((totalOccupancy / totalBeds) * 100) : 0
    return { totalProperties, totalRooms, totalBeds, avgOccupancy }
  }, [properties])

  const filteredProperties = useMemo(() => {
    let result = properties
    if (typeFilter !== 'all') {
      result = result.filter((p) => p.type === typeFilter)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.address.toLowerCase().includes(q) ||
          p.city.toLowerCase().includes(q) ||
          (p.landmark && p.landmark.toLowerCase().includes(q))
      )
    }
    return result
  }, [properties, typeFilter, searchQuery])

  // ── Form Handlers ────────────────────────────────────────────────────────
  function handleFormChange(field: keyof PropertyFormData, value: string | string[]) {
    setFormData((prev) => ({ ...prev, [field]: value }))
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
    if (!formData.name || !formData.address || !formData.city) return

    try {
      setSubmitting(true)
      const res = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          ownerId: currentUser?.id || 'default-owner',
          amenities: formData.amenities.length > 0 ? JSON.stringify(formData.amenities) : null,
        }),
      })

      if (res.ok) {
        const newProperty = await res.json()
        setProperties((prev) => [newProperty, ...prev])
        setDialogOpen(false)
        resetForm()
      }
    } catch (error) {
      console.error('Failed to create property:', error)
    } finally {
      setSubmitting(false)
    }
  }

  function resetForm() {
    setFormData({
      name: '',
      type: 'pg',
      address: '',
      city: '',
      state: '',
      pincode: '',
      landmark: '',
      description: '',
      amenities: [],
    })
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this property?')) return
    try {
      const res = await fetch(`/api/properties/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setProperties((prev) => prev.filter((p) => p.id !== id))
      }
    } catch (error) {
      console.error('Failed to delete property:', error)
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <ScrollArea className="h-full">
      <div className="p-4 md:p-6 space-y-6">
        {/* ── Page Header ─────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              Properties
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage your properties, rooms, and occupancy across all locations
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm() }}>
            {canCreate && (
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Property
              </Button>
            </DialogTrigger>
            )}
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Property</DialogTitle>
                <DialogDescription>
                  Fill in the details to register a new property in your portfolio.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name */}
                  <div className="sm:col-span-2 space-y-2">
                    <Label htmlFor="prop-name">Property Name *</Label>
                    <Input
                      id="prop-name"
                      placeholder="e.g. Sunshine PG"
                      value={formData.name}
                      onChange={(e) => handleFormChange('name', e.target.value)}
                      required
                    />
                  </div>
                  {/* Type */}
                  <div className="space-y-2">
                    <Label>Property Type *</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(v) => handleFormChange('type', v)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(PROPERTY_TYPE_CONFIG).map(([key, cfg]) => (
                          <SelectItem key={key} value={key}>
                            {cfg.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {/* City */}
                  <div className="space-y-2">
                    <Label htmlFor="prop-city">City *</Label>
                    <Input
                      id="prop-city"
                      placeholder="e.g. Mumbai"
                      value={formData.city}
                      onChange={(e) => handleFormChange('city', e.target.value)}
                      required
                    />
                  </div>
                  {/* Address */}
                  <div className="sm:col-span-2 space-y-2">
                    <Label htmlFor="prop-address">Address *</Label>
                    <Input
                      id="prop-address"
                      placeholder="Full street address"
                      value={formData.address}
                      onChange={(e) => handleFormChange('address', e.target.value)}
                      required
                    />
                  </div>
                  {/* State */}
                  <div className="space-y-2">
                    <Label htmlFor="prop-state">State</Label>
                    <Input
                      id="prop-state"
                      placeholder="e.g. Maharashtra"
                      value={formData.state}
                      onChange={(e) => handleFormChange('state', e.target.value)}
                    />
                  </div>
                  {/* Pincode */}
                  <div className="space-y-2">
                    <Label htmlFor="prop-pincode">Pincode</Label>
                    <Input
                      id="prop-pincode"
                      placeholder="e.g. 400001"
                      value={formData.pincode}
                      onChange={(e) => handleFormChange('pincode', e.target.value)}
                    />
                  </div>
                  {/* Landmark */}
                  <div className="sm:col-span-2 space-y-2">
                    <Label htmlFor="prop-landmark">Landmark</Label>
                    <Input
                      id="prop-landmark"
                      placeholder="Nearby landmark for easy navigation"
                      value={formData.landmark}
                      onChange={(e) => handleFormChange('landmark', e.target.value)}
                    />
                  </div>
                  {/* Description */}
                  <div className="sm:col-span-2 space-y-2">
                    <Label htmlFor="prop-desc">Description</Label>
                    <Textarea
                      id="prop-desc"
                      placeholder="Brief description of the property..."
                      value={formData.description}
                      onChange={(e) => handleFormChange('description', e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
                {/* Amenities */}
                <div className="space-y-3">
                  <Label>Amenities</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {AMENITIES_OPTIONS.map((amenity) => (
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
                    Create Property
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* ── Stats Cards ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            <>
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
                      <Building2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Properties</p>
                      <p className="text-2xl font-bold">{stats.totalProperties}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-teal-500">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-teal-100 dark:bg-teal-950/50 p-2.5">
                      <DoorOpen className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Rooms</p>
                      <p className="text-2xl font-bold">{stats.totalRooms}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-cyan-500">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-cyan-100 dark:bg-cyan-950/50 p-2.5">
                      <BedDouble className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Beds</p>
                      <p className="text-2xl font-bold">{stats.totalBeds}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-emerald-500">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-emerald-100 dark:bg-emerald-950/50 p-2.5">
                      <BarChart3 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Avg. Occupancy</p>
                      <p className="text-2xl font-bold">{stats.avgOccupancy}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* ── Filters & Search ─────────────────────────────────────────────── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            {FILTER_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                variant={typeFilter === opt.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTypeFilter(opt.value)}
                className={
                  typeFilter === opt.value
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : ''
                }
              >
                {opt.label}
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search properties..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
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
        </div>

        {/* ── Property Grid / List ─────────────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <PropertyCardSkeleton />
            <PropertyCardSkeleton />
            <PropertyCardSkeleton />
            <PropertyCardSkeleton />
            <PropertyCardSkeleton />
            <PropertyCardSkeleton />
          </div>
        ) : filteredProperties.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Building2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold">No properties found</h3>
              <p className="text-muted-foreground mt-1 max-w-sm">
                {searchQuery || typeFilter !== 'all'
                  ? 'Try adjusting your search or filters to find what you\'re looking for.'
                  : 'Get started by adding your first property to the system.'}
              </p>
              {!searchQuery && typeFilter === 'all' && canCreate && (
                <Button
                  className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => setDialogOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Property
                </Button>
              )}
            </CardContent>
          </Card>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProperties.map((property) => (
              <PropertyCard key={property.id} property={property} onDelete={handleDelete} />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredProperties.map((property) => (
              <PropertyListItem key={property.id} property={property} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>
    </ScrollArea>
  )
}

// ── Property Card (Grid View) ────────────────────────────────────────────────

function PropertyCard({ property, onDelete }: { property: PropertyData; onDelete: (id: string) => void }) {
  const { currentUser } = useAppStore()
  const role = currentUser?.role || ''
  const canUpdate = hasPermission(role, 'properties:update')
  const canDelete = hasPermission(role, 'properties:delete')
  const typeConfig = PROPERTY_TYPE_CONFIG[property.type] || PROPERTY_TYPE_CONFIG.pg
  const amenities = parseAmenities(property.amenities)
  const occupancyPct = property.occupancyPercentage ?? (property.totalBeds > 0 ? Math.round((property.occupancy / property.totalBeds) * 100) : 0)

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow group">
      {/* Color bar at top */}
      <div className={`h-1.5 ${
        property.type === 'pg' ? 'bg-emerald-500' :
        property.type === 'hostel' ? 'bg-blue-500' :
        property.type === 'co_living' ? 'bg-purple-500' :
        'bg-orange-500'
      }`} />
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2.5 min-w-0">
            <div className={`rounded-lg p-2 ${typeConfig.bgClass} shrink-0`}>
              <PropertyTypeIcon type={property.type} className={`h-4 w-4 ${typeConfig.textClass}`} />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-base truncate">{property.name}</CardTitle>
              <Badge
                variant="outline"
                className={`mt-1 text-[10px] px-1.5 py-0 ${typeConfig.bgClass} ${typeConfig.textClass} ${typeConfig.borderClass}`}
              >
                {typeConfig.label}
              </Badge>
            </div>
          </div>
          <Badge variant="outline" className="text-[10px] shrink-0">
            {property.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Address */}
        <div className="flex items-start gap-1.5 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span className="line-clamp-2">
            {property.address}, {property.city}
            {property.state && `, ${property.state}`}
            {property.pincode && ` - ${property.pincode}`}
          </span>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg bg-muted/50 p-2 text-center">
            <p className="text-lg font-bold text-foreground">{property.roomsCount ?? property.totalRooms}</p>
            <p className="text-[10px] text-muted-foreground">Rooms</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-2 text-center">
            <p className="text-lg font-bold text-foreground">{property.totalBeds}</p>
            <p className="text-[10px] text-muted-foreground">Beds</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-2 text-center">
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{occupancyPct}%</p>
            <p className="text-[10px] text-muted-foreground">Occupancy</p>
          </div>
        </div>

        {/* Occupancy bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Occupancy</span>
            <span className="font-medium">{property.occupancy}/{property.totalBeds} beds</span>
          </div>
          <Progress value={occupancyPct} className="h-2" />
        </div>

        {/* Amenities */}
        {amenities.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {amenities.slice(0, 5).map((amenity) => (
              <Badge key={amenity} variant="secondary" className="text-[10px] px-1.5 py-0">
                {amenity}
              </Badge>
            ))}
            {amenities.length > 5 && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                +{amenities.length - 5}
              </Badge>
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
        <Button variant="outline" size="sm" className="flex-1">
          <Pencil className="mr-1.5 h-3.5 w-3.5" />
          Edit
        </Button>
        )}
        {canDelete && (
        <Button variant="outline" size="sm" className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50" onClick={() => onDelete(property.id)}>
          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
          Delete
        </Button>
        )}
        <Button variant="outline" size="sm" className="flex-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/50">
          <DoorOpen className="mr-1.5 h-3.5 w-3.5" />
          Rooms
        </Button>
      </CardFooter>
    </Card>
  )
}

// ── Property List Item (List View) ──────────────────────────────────────────

function PropertyListItem({ property, onDelete }: { property: PropertyData; onDelete: (id: string) => void }) {
  const { currentUser } = useAppStore()
  const role = currentUser?.role || ''
  const canUpdate = hasPermission(role, 'properties:update')
  const canDelete = hasPermission(role, 'properties:delete')
  const typeConfig = PROPERTY_TYPE_CONFIG[property.type] || PROPERTY_TYPE_CONFIG.pg
  const amenities = parseAmenities(property.amenities)
  const occupancyPct = property.occupancyPercentage ?? (property.totalBeds > 0 ? Math.round((property.occupancy / property.totalBeds) * 100) : 0)

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3 min-w-0">
            <div className={`rounded-lg p-2.5 ${typeConfig.bgClass} shrink-0`}>
              <PropertyTypeIcon type={property.type} className={`h-5 w-5 ${typeConfig.textClass}`} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold truncate">{property.name}</h3>
                <Badge
                  variant="outline"
                  className={`text-[10px] px-1.5 py-0 ${typeConfig.bgClass} ${typeConfig.textClass} ${typeConfig.borderClass}`}
                >
                  {typeConfig.label}
                </Badge>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">
                  {property.address}, {property.city}
                  {property.state && `, ${property.state}`}
                </span>
              </div>
              {amenities.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {amenities.slice(0, 4).map((a) => (
                    <Badge key={a} variant="secondary" className="text-[10px] px-1.5 py-0">{a}</Badge>
                  ))}
                  {amenities.length > 4 && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">+{amenities.length - 4}</Badge>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-6 shrink-0">
            <div className="text-center">
              <p className="text-lg font-bold">{property.roomsCount ?? property.totalRooms}</p>
              <p className="text-[10px] text-muted-foreground">Rooms</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold">{property.totalBeds}</p>
              <p className="text-[10px] text-muted-foreground">Beds</p>
            </div>
            <div className="text-center min-w-[60px]">
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{occupancyPct}%</p>
              <p className="text-[10px] text-muted-foreground">Occupancy</p>
            </div>
            <div className="flex gap-1.5">
              <Button variant="outline" size="sm"><Eye className="h-3.5 w-3.5" /></Button>
              {canUpdate && <Button variant="outline" size="sm"><Pencil className="h-3.5 w-3.5" /></Button>}
              {canDelete && <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50" onClick={() => onDelete(property.id)}><Trash2 className="h-3.5 w-3.5" /></Button>}
              <Button variant="outline" size="sm" className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/50">
                <DoorOpen className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
