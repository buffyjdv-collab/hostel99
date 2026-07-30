'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useAppStore, hasPermission } from '@/lib/store'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { useToast } from '@/hooks/use-toast'
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
  UserCheck,
  Users,
  Clock,
  LogOut,
  Plus,
  Search,
  Building2,
  Phone,
  Calendar,
  Loader2,
  ArrowRightLeft,
  Timer,
  DoorOpen,
  UserX,
  Trash2,
  Pencil,
} from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────────

interface Visitor {
  id: string
  name: string
  phone: string | null
  purpose: string
  tenantId: string | null
  hostId: string | null
  hostName: string | null
  propertyId: string
  checkIn: string
  checkOut: string | null
  status: string
  createdAt: string
  tenant?: { id: string; name: string; phone?: string } | null
  host?: { id: string; name: string; email?: string } | null
  property?: { id: string; name: string; address?: string } | null
}

interface EditVisitorFormData {
  name: string
  phone: string
  purpose: string
  hostName: string
  status: string
}

interface Property {
  id: string
  name: string
}

interface Tenant {
  id: string
  name: string
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDateTime(date: string | Date) {
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function formatTime(date: string | Date) {
  return new Date(date).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit',
  })
}

function calculateDuration(checkIn: string, checkOut: string | null): string {
  const start = new Date(checkIn)
  const end = checkOut ? new Date(checkOut) : new Date()
  const diffMs = end.getTime() - start.getTime()
  const hours = Math.floor(diffMs / (1000 * 60 * 60))
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

  if (hours === 0) return `${minutes}m`
  if (hours < 24) return `${hours}h ${minutes}m`
  const days = Math.floor(hours / 24)
  const remainingHours = hours % 24
  return `${days}d ${remainingHours}h`
}

function calculateAverageDuration(visitors: Visitor[]): string {
  if (visitors.length === 0) return '0m'
  const checkedOut = visitors.filter((v) => v.checkOut)
  if (checkedOut.length === 0) return 'N/A'

  const totalMinutes = checkedOut.reduce((sum, v) => {
    const start = new Date(v.checkIn)
    const end = new Date(v.checkOut!)
    return sum + (end.getTime() - start.getTime()) / (1000 * 60)
  }, 0)

  const avgMinutes = Math.round(totalMinutes / checkedOut.length)
  const hours = Math.floor(avgMinutes / 60)
  const minutes = avgMinutes % 60

  if (hours === 0) return `${minutes}m`
  return `${hours}h ${minutes}m`
}

function isToday(date: string | Date) {
  const d = new Date(date)
  const today = new Date()
  return d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
}

// ── Component ────────────────────────────────────────────────────────────────

export function VisitorsPage() {
  const { currentUser } = useAppStore()
  const role = currentUser?.role || ''
  const canCreate = hasPermission(role, 'visitors:create')
  const canUpdate = hasPermission(role, 'visitors:update')
  const canDelete = hasPermission(role, 'visitors:delete')
  const [loading, setLoading] = useState(true)
  const [visitors, setVisitors] = useState<Visitor[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [tenants, setTenants] = useState<Tenant[]>([])

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [propertyFilter, setPropertyFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>(new Date().toISOString().split('T')[0])
  const [searchQuery, setSearchQuery] = useState('')

  // Dialogs
  const [logVisitorOpen, setLogVisitorOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null)
  const [editFormData, setEditFormData] = useState<EditVisitorFormData>({
    name: '',
    phone: '',
    purpose: '',
    hostName: '',
    status: 'checked_in',
  })
  const [submittingEdit, setSubmittingEdit] = useState(false)

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)

  const { toast } = useToast()

  // Log Visitor form
  const [visitorForm, setVisitorForm] = useState({
    name: '',
    phone: '',
    purpose: '',
    tenantId: '',
    propertyId: '',
  })

  // ── Data Fetching ──────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [visitorsRes, propsRes, tenantsRes] = await Promise.all([
        fetch('/api/visitors'),
        fetch('/api/properties'),
        fetch('/api/tenants'),
      ])
      if (visitorsRes.ok) {
        const data = await visitorsRes.json()
        setVisitors(Array.isArray(data) ? data : [])
      }
      if (propsRes.ok) {
        const data = await propsRes.json()
        setProperties(Array.isArray(data) ? data.map((p: { id: string; name: string }) => ({ id: p.id, name: p.name })) : [])
      }
      if (tenantsRes.ok) {
        const data = await tenantsRes.json()
        setTenants(Array.isArray(data) ? data.map((t: { id: string; name: string }) => ({ id: t.id, name: t.name })) : [])
      }
    } catch { /* ignore */ }
    setLoading(false)
  }, [])

  // Fetch on mount
  const [hasFetched, setHasFetched] = useState(false)
  if (!hasFetched) {
    setHasFetched(true)
    fetchData()
  }

  // ── Filtered Data ──────────────────────────────────────────────────────

  const filteredVisitors = useMemo(() => {
    return visitors.filter((v) => {
      if (statusFilter !== 'all' && v.status !== statusFilter) return false
      if (propertyFilter !== 'all' && v.propertyId !== propertyFilter) return false
      if (dateFilter) {
        const visitorDate = new Date(v.checkIn).toISOString().split('T')[0]
        if (visitorDate !== dateFilter) return false
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const matchesName = v.name.toLowerCase().includes(q)
        const matchesPhone = v.phone?.toLowerCase().includes(q)
        if (!matchesName && !matchesPhone) return false
      }
      return true
    })
  }, [visitors, statusFilter, propertyFilter, dateFilter, searchQuery])

  // ── Stats ──────────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const todayVisitors = visitors.filter((v) => isToday(v.checkIn))
    const checkedIn = todayVisitors.filter((v) => v.status === 'checked_in')
    const checkedOut = todayVisitors.filter((v) => v.status === 'checked_out')
    return {
      totalToday: todayVisitors.length,
      checkedIn: checkedIn.length,
      checkedOut: checkedOut.length,
      avgDuration: calculateAverageDuration(todayVisitors),
    }
  }, [visitors])

  // ── Form Handlers ──────────────────────────────────────────────────────

  const handleLogVisitor = async () => {
    if (!visitorForm.name || !visitorForm.purpose || !visitorForm.propertyId) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/visitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: visitorForm.name,
          phone: visitorForm.phone || undefined,
          purpose: visitorForm.purpose,
          tenantId: visitorForm.tenantId || undefined,
          propertyId: visitorForm.propertyId,
          hostId: currentUser?.id,
        }),
      })
      if (res.ok) {
        const newVisitor = await res.json()
        setVisitors((prev) => [newVisitor, ...prev])
        setLogVisitorOpen(false)
        setVisitorForm({ name: '', phone: '', purpose: '', tenantId: '', propertyId: '' })
      }
    } catch { /* ignore */ }
    setSubmitting(false)
  }

  const handleCheckOut = async (visitorId: string) => {
    try {
      const res = await fetch('/api/visitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'checkout', visitorId }),
      })
      if (res.ok) {
        const updated = await res.json()
        setVisitors((prev) =>
          prev.map((v) => v.id === visitorId ? updated : v)
        )
        toast({ title: 'Success', description: 'Visitor checked out successfully' })
      }
    } catch { /* ignore */ }
  }

  // ── Edit Dialog Handlers ──────────────────────────────────────────────────

  function openEditDialog(visitor: Visitor) {
    setSelectedVisitor(visitor)
    setEditFormData({
      name: visitor.name,
      phone: visitor.phone || '',
      purpose: visitor.purpose,
      hostName: visitor.host?.name || '',
      status: visitor.status,
    })
    setEditDialogOpen(true)
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedVisitor || !editFormData.name.trim()) {
      toast({ title: 'Validation Error', description: 'Visitor name is required', variant: 'destructive' })
      return
    }

    try {
      setSubmittingEdit(true)
      const res = await fetch('/api/visitors', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedVisitor.id,
          name: editFormData.name.trim(),
          phone: editFormData.phone.trim() || undefined,
          purpose: editFormData.purpose.trim(),
          hostName: editFormData.hostName.trim() || undefined,
          status: editFormData.status,
        }),
      })

      if (res.ok) {
        toast({ title: 'Success', description: 'Visitor updated successfully' })
        setEditDialogOpen(false)
        setSelectedVisitor(null)
        fetchData()
      } else {
        const data = await res.json()
        toast({ title: 'Error', description: data.error || 'Failed to update visitor', variant: 'destructive' })
      }
    } catch (error) {
      console.error('Failed to update visitor:', error)
      toast({ title: 'Error', description: 'Failed to update visitor', variant: 'destructive' })
    } finally {
      setSubmittingEdit(false)
    }
  }

  // ── Delete Dialog Handlers ────────────────────────────────────────────────

  const handleDelete = (id: string) => {
    const v = visitors.find((vt) => vt.id === id)
    if (!v) return
    setDeleteTarget({ id: v.id, name: v.name })
    setDeleteDialogOpen(true)
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return
    try {
      setSubmittingEdit(true)
      const res = await fetch(`/api/visitors/${deleteTarget.id}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: 'Success', description: `${deleteTarget.name} has been deleted` })
        setVisitors((prev) => prev.filter((v) => v.id !== deleteTarget.id))
      } else {
        const data = await res.json()
        toast({ title: 'Error', description: data.error || 'Failed to delete visitor record', variant: 'destructive' })
      }
    } catch (error) {
      console.error('Failed to delete visitor record:', error)
      toast({ title: 'Error', description: 'Failed to delete visitor record', variant: 'destructive' })
    } finally {
      setSubmittingEdit(false)
      setDeleteDialogOpen(false)
      setDeleteTarget(null)
    }
  }

  // ── Loading Skeleton ────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-[400px] rounded-lg" />
      </div>
    )
  }

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="h-6 w-6 text-emerald-600" />
            Visitors
          </h1>
          <p className="text-muted-foreground mt-1">Track and manage visitor check-ins and check-outs</p>
        </div>
        {canCreate && (
        <Button onClick={() => setLogVisitorOpen(true)} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4" />
          Log Visitor
        </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-emerald-200 bg-emerald-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-600">Total Visitors Today</p>
                <p className="mt-1 text-2xl font-bold text-emerald-700">{stats.totalToday}</p>
              </div>
              <Users className="h-8 w-8 text-emerald-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-teal-200 bg-teal-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-teal-600">Currently Checked In</p>
                <p className="mt-1 text-2xl font-bold text-teal-700">{stats.checkedIn}</p>
              </div>
              <UserCheck className="h-8 w-8 text-teal-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-gray-200 bg-gray-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Checked Out</p>
                <p className="mt-1 text-2xl font-bold text-gray-700">{stats.checkedOut}</p>
              </div>
              <UserX className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-cyan-200 bg-cyan-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-cyan-600">Avg Visit Duration</p>
                <p className="mt-1 text-2xl font-bold text-cyan-700">{stats.avgDuration}</p>
              </div>
              <Timer className="h-8 w-8 text-cyan-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <Label className="text-xs text-muted-foreground">Search</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="min-w-[150px]">
              <Label className="text-xs text-muted-foreground">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="checked_in">Checked In</SelectItem>
                  <SelectItem value="checked_out">Checked Out</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-[180px]">
              <Label className="text-xs text-muted-foreground">Property</Label>
              <Select value={propertyFilter} onValueChange={setPropertyFilter}>
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
            <div className="min-w-[150px]">
              <Label className="text-xs text-muted-foreground">Date</Label>
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visitor Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Visitor Log</CardTitle>
          <CardDescription>{filteredVisitors.length} visitor(s) found</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Purpose</TableHead>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Check-in</TableHead>
                  <TableHead>Check-out</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVisitors.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                      <DoorOpen className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                      No visitors found for the selected filters
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredVisitors.map((visitor) => (
                    <TableRow key={visitor.id}>
                      <TableCell className="font-medium">{visitor.name}</TableCell>
                      <TableCell>
                        {visitor.phone ? (
                          <span className="flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3 text-gray-400" />
                            {visitor.phone}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>{visitor.purpose}</TableCell>
                      <TableCell>{visitor.tenant?.name || '-'}</TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1 text-sm">
                          <Building2 className="h-3 w-3 text-gray-400" />
                          {visitor.property?.name || 'N/A'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm whitespace-nowrap">{formatDateTime(visitor.checkIn)}</span>
                      </TableCell>
                      <TableCell>
                        {visitor.checkOut ? (
                          <span className="text-sm whitespace-nowrap">{formatDateTime(visitor.checkOut)}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            visitor.status === 'checked_in'
                              ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                              : 'bg-gray-100 text-gray-600 border-gray-200'
                          }
                        >
                          {visitor.status === 'checked_in' ? 'Checked In' : 'Checked Out'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {calculateDuration(visitor.checkIn, visitor.checkOut)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                        {canUpdate && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1 text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700 h-8"
                            onClick={() => openEditDialog(visitor)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </Button>
                        )}
                        {visitor.status === 'checked_in' && canUpdate && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1 text-amber-600 border-amber-200 hover:bg-amber-50 hover:text-amber-700 h-8"
                            onClick={() => handleCheckOut(visitor.id)}
                          >
                            <LogOut className="h-3.5 w-3.5" />
                            Check Out
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 h-8"
                            onClick={() => handleDelete(visitor.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </Button>
                        )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Log Visitor Dialog */}
      <Dialog open={logVisitorOpen} onOpenChange={setLogVisitorOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-emerald-600" />
              Log Visitor
            </DialogTitle>
            <DialogDescription>Register a new visitor entry at the property.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="visitor-name">Visitor Name</Label>
              <Input
                id="visitor-name"
                placeholder="Enter visitor's name"
                value={visitorForm.name}
                onChange={(e) => setVisitorForm((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="visitor-phone">Phone Number</Label>
              <Input
                id="visitor-phone"
                placeholder="Enter phone number"
                value={visitorForm.phone}
                onChange={(e) => setVisitorForm((prev) => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="visitor-purpose">Purpose of Visit</Label>
              <Input
                id="visitor-purpose"
                placeholder="e.g., Personal visit, Delivery, Meeting"
                value={visitorForm.purpose}
                onChange={(e) => setVisitorForm((prev) => ({ ...prev, purpose: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tenant (Optional)</Label>
                <Select value={visitorForm.tenantId} onValueChange={(v) => setVisitorForm((prev) => ({ ...prev, tenantId: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select tenant" />
                  </SelectTrigger>
                  <SelectContent>
                    {tenants.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Property</Label>
                <Select value={visitorForm.propertyId} onValueChange={(v) => setVisitorForm((prev) => ({ ...prev, propertyId: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select property" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLogVisitorOpen(false)}>Cancel</Button>
            <Button
              onClick={handleLogVisitor}
              disabled={submitting || !visitorForm.name || !visitorForm.purpose || !visitorForm.propertyId}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <UserCheck className="h-4 w-4 mr-2" />
              Check In Visitor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Visitor Dialog ──────────────────────────────────────────────── */}
      <Dialog open={editDialogOpen} onOpenChange={(open) => { setEditDialogOpen(open); if (!open) setSelectedVisitor(null) }}>
        <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Visitor</DialogTitle>
            <DialogDescription>Update the visitor details below.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-visitor-name">Name *</Label>
              <Input
                id="edit-visitor-name"
                placeholder="Visitor name"
                value={editFormData.name}
                onChange={(e) => setEditFormData((prev) => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-visitor-phone">Phone</Label>
              <Input
                id="edit-visitor-phone"
                placeholder="Phone number"
                value={editFormData.phone}
                onChange={(e) => setEditFormData((prev) => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-visitor-purpose">Purpose *</Label>
              <Input
                id="edit-visitor-purpose"
                placeholder="Purpose of visit"
                value={editFormData.purpose}
                onChange={(e) => setEditFormData((prev) => ({ ...prev, purpose: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-visitor-host">Host Name</Label>
              <Input
                id="edit-visitor-host"
                placeholder="Host name"
                value={editFormData.hostName}
                onChange={(e) => setEditFormData((prev) => ({ ...prev, hostName: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-visitor-status">Status *</Label>
              <Select value={editFormData.status} onValueChange={(v) => setEditFormData((prev) => ({ ...prev, status: v }))}>
                <SelectTrigger id="edit-visitor-status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="checked_in">Checked In</SelectItem>
                  <SelectItem value="checked_out">Checked Out</SelectItem>
                </SelectContent>
              </Select>
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
                Update Visitor
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation Dialog ─────────────────────────────────────────── */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Visitor Record</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the visitor record for <strong>{deleteTarget?.name}</strong>? This action cannot be undone.
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
    </div>
  )
}
