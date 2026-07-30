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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Truck,
  Plus,
  Search,
  Star,
  Phone,
  Mail,
  MapPin,
  Building2,
  MoreHorizontal,
  Edit,
  Eye,
  ShoppingCart,
  Ban,
  CheckCircle2,
  XCircle,
  Loader2,
  FileText,
  CreditCard,
  Banknote,
  Globe,
  Trash2,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

// ── Types ────────────────────────────────────────────────────────

interface VendorData {
  id: string
  name: string
  contactPerson: string | null
  phone: string
  email: string | null
  address: string | null
  city: string | null
  state: string | null
  pincode: string | null
  gstNumber: string | null
  panNumber: string | null
  bankName: string | null
  bankAccount: string | null
  ifscCode: string | null
  paymentTerms: string | null
  rating: number
  status: string
  propertyId: string
  property: { id: string; name: string }
  _count: { purchaseOrders: number; quotations: number }
  createdAt: string
}

interface VendorStats {
  totalVendors: number
  activeVendors: number
  avgRating: string
}

// ── Constants ────────────────────────────────────────────────────

const PAYMENT_TERMS = [
  { value: 'COD', label: 'Cash on Delivery' },
  { value: 'Net 15', label: 'Net 15 Days' },
  { value: 'Net 30', label: 'Net 30 Days' },
  { value: 'Net 45', label: 'Net 45 Days' },
  { value: 'Net 60', label: 'Net 60 Days' },
  { value: 'Advance', label: 'Advance Payment' },
  { value: '50-50', label: '50% Advance, 50% on Delivery' },
]

function getStatusBadge(status: string) {
  switch (status) {
    case 'active':
      return <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-0"><CheckCircle2 className="h-3 w-3 mr-1" />Active</Badge>
    case 'inactive':
      return <Badge className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-0"><XCircle className="h-3 w-3 mr-1" />Inactive</Badge>
    case 'blacklisted':
      return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-0"><Ban className="h-3 w-3 mr-1" />Blacklisted</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

function renderStars(rating: number) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-3.5 w-3.5 ${star <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300 dark:text-slate-600'}`}
        />
      ))}
      <span className="text-xs text-slate-500 ml-1">{rating.toFixed(1)}</span>
    </div>
  )
}

// ── Component ────────────────────────────────────────────────────

export function VendorsPage() {
  const { selectedPropertyId, currentUser } = useAppStore()
  const { toast } = useToast()

  const role = currentUser?.role || ''
  const canCreate = hasPermission(role, 'vendors:create')
  const canUpdate = hasPermission(role, 'vendors:update')
  const canDelete = hasPermission(role, 'vendors:delete')

  const [vendors, setVendors] = useState<VendorData[]>([])
  const [stats, setStats] = useState<VendorStats>({ totalVendors: 0, activeVendors: 0, avgRating: '0' })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Dialogs
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [selectedVendor, setSelectedVendor] = useState<VendorData | null>(null)

  // Form state
  const [form, setForm] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    gstNumber: '',
    panNumber: '',
    bankName: '',
    bankAccount: '',
    ifscCode: '',
    paymentTerms: 'Net 30',
    rating: 0,
  })

  const [editForm, setEditForm] = useState(form)
  const [submitting, setSubmitting] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const [deleting, setDeleting] = useState(false)

  // ── Data Fetching ──────────────────────────────────────────────

  const fetchVendors = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedPropertyId) params.set('propertyId', selectedPropertyId)
      const res = await fetch(`/api/vendors?${params}`)
      if (res.ok) {
        const data = await res.json()
        setVendors(data.vendors || [])
        setStats(data.stats || { totalVendors: 0, activeVendors: 0, avgRating: '0' })
      }
    } catch (err) {
      console.error('Failed to fetch vendors:', err)
    } finally {
      setLoading(false)
    }
  }, [selectedPropertyId])

  useEffect(() => { fetchVendors() }, [fetchVendors])

  // ── Filtering ──────────────────────────────────────────────────

  const filteredVendors = useMemo(() => {
    let result = vendors
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(v =>
        v.name.toLowerCase().includes(q) ||
        (v.contactPerson || '').toLowerCase().includes(q) ||
        (v.city || '').toLowerCase().includes(q) ||
        (v.email || '').toLowerCase().includes(q) ||
        (v.gstNumber || '').toLowerCase().includes(q)
      )
    }
    if (statusFilter !== 'all') {
      result = result.filter(v => v.status === statusFilter)
    }
    return result
  }, [vendors, search, statusFilter])

  // ── Form Handlers ──────────────────────────────────────────────

  const resetForm = () => {
    setForm({
      name: '', contactPerson: '', phone: '', email: '', address: '',
      city: '', state: '', pincode: '', gstNumber: '', panNumber: '',
      bankName: '', bankAccount: '', ifscCode: '', paymentTerms: 'Net 30', rating: 0,
    })
  }

  const handleAdd = async () => {
    if (!form.name || !form.phone) {
      toast({ title: 'Validation Error', description: 'Name and phone are required', variant: 'destructive' })
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, propertyId: selectedPropertyId }),
      })
      if (res.ok) {
        toast({ title: 'Success', description: 'Vendor added successfully' })
        setAddDialogOpen(false)
        resetForm()
        fetchVendors()
      } else {
        toast({ title: 'Error', description: 'Failed to add vendor', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to add vendor', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = async () => {
    if (!selectedVendor) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/vendors', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedVendor.id, ...editForm }),
      })
      if (res.ok) {
        toast({ title: 'Success', description: 'Vendor updated successfully' })
        setEditDialogOpen(false)
        fetchVendors()
      } else {
        toast({ title: 'Error', description: 'Failed to update vendor', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to update vendor', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleStatusChange = async (vendor: VendorData, newStatus: string) => {
    try {
      const res = await fetch('/api/vendors', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: vendor.id, status: newStatus }),
      })
      if (res.ok) {
        toast({ title: 'Success', description: `Vendor ${newStatus === 'active' ? 'activated' : newStatus === 'blacklisted' ? 'blacklisted' : 'deactivated'}` })
        fetchVendors()
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' })
    }
  }

  const openEdit = (vendor: VendorData) => {
    setSelectedVendor(vendor)
    setEditForm({
      name: vendor.name,
      contactPerson: vendor.contactPerson || '',
      phone: vendor.phone,
      email: vendor.email || '',
      address: vendor.address || '',
      city: vendor.city || '',
      state: vendor.state || '',
      pincode: vendor.pincode || '',
      gstNumber: vendor.gstNumber || '',
      panNumber: vendor.panNumber || '',
      bankName: vendor.bankName || '',
      bankAccount: vendor.bankAccount || '',
      ifscCode: vendor.ifscCode || '',
      paymentTerms: vendor.paymentTerms || 'Net 30',
      rating: vendor.rating,
    })
    setEditDialogOpen(true)
  }

  const openDetail = (vendor: VendorData) => {
    setSelectedVendor(vendor)
    setDetailDialogOpen(true)
  }

  const openDeleteDialog = (vendor: VendorData) => {
    setDeleteTarget({ id: vendor.id, name: vendor.name })
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch('/api/vendors', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deleteTarget.id }),
      })
      if (res.ok) {
        toast({ title: 'Success', description: `${deleteTarget.name} has been deleted` })
        fetchVendors()
      } else {
        const data = await res.json()
        toast({ title: 'Error', description: data.error || 'Failed to delete vendor', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to delete vendor', variant: 'destructive' })
    } finally {
      setDeleting(false)
      setDeleteDialogOpen(false)
      setDeleteTarget(null)
    }
  }

  // ── Render ─────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-24 rounded-lg" />
          <Skeleton className="h-24 rounded-lg" />
          <Skeleton className="h-24 rounded-lg" />
        </div>
        <Skeleton className="h-[400px] rounded-lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Vendor Management</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage suppliers, track purchase history, and vendor performance</p>
        </div>
        {canCreate && (
          <Button onClick={() => { resetForm(); setAddDialogOpen(true) }} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="h-4 w-4 mr-2" /> Add Vendor
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Truck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="text-sm text-slate-500 dark:text-slate-400">Total Vendors</div>
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.totalVendors}</div>
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
                <div className="text-sm text-slate-500 dark:text-slate-400">Active Vendors</div>
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.activeVendors}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <Star className="h-5 w-5 text-amber-500 dark:text-amber-400" />
              </div>
              <div>
                <div className="text-sm text-slate-500 dark:text-slate-400">Average Rating</div>
                <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.avgRating} / 5</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search vendors by name, contact, city, GST..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="blacklisted">Blacklisted</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendor</TableHead>
                  <TableHead className="hidden md:table-cell">Contact Person</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead className="hidden lg:table-cell">Email</TableHead>
                  <TableHead className="hidden xl:table-cell">GST Number</TableHead>
                  <TableHead className="hidden md:table-cell">City</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead className="hidden lg:table-cell">POs</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVendors.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-12">
                      <div className="flex flex-col items-center gap-2">
                        <Truck className="h-10 w-10 text-slate-300 dark:text-slate-600" />
                        <div className="text-slate-500 dark:text-slate-400">No vendors found</div>
                        <div className="text-sm text-slate-400">Add your first vendor to get started</div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredVendors.map((vendor) => (
                    <TableRow key={vendor.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer" onClick={() => openDetail(vendor)}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-semibold text-sm">
                            {vendor.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium text-slate-900 dark:text-slate-100">{vendor.name}</div>
                            {vendor.paymentTerms && (
                              <div className="text-xs text-slate-400">{vendor.paymentTerms}</div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-slate-600 dark:text-slate-400">{vendor.contactPerson || '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Phone className="h-3 w-3 text-slate-400" />
                          <span>{vendor.phone}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {vendor.email ? (
                          <div className="flex items-center gap-1.5">
                            <Mail className="h-3 w-3 text-slate-400" />
                            <span className="text-slate-600 dark:text-slate-400">{vendor.email}</span>
                          </div>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="hidden xl:table-cell font-mono text-xs text-slate-500">{vendor.gstNumber || '-'}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        {vendor.city ? (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-slate-400" />
                            <span>{vendor.city}</span>
                          </div>
                        ) : '-'}
                      </TableCell>
                      <TableCell>{renderStars(vendor.rating)}</TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Badge variant="outline" className="text-xs">{vendor._count.purchaseOrders} POs</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(vendor.status)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openDetail(vendor) }}>
                              <Eye className="h-4 w-4 mr-2" /> View Details
                            </DropdownMenuItem>
                            {canUpdate && (
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEdit(vendor) }}>
                                <Edit className="h-4 w-4 mr-2" /> Edit
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation() }}>
                              <ShoppingCart className="h-4 w-4 mr-2" /> Create PO
                            </DropdownMenuItem>
                            {vendor.status === 'active' && (
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleStatusChange(vendor, 'inactive') }} className="text-amber-600">
                                <XCircle className="h-4 w-4 mr-2" /> Deactivate
                              </DropdownMenuItem>
                            )}
                            {vendor.status === 'inactive' && (
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleStatusChange(vendor, 'active') }} className="text-emerald-600">
                                <CheckCircle2 className="h-4 w-4 mr-2" /> Activate
                              </DropdownMenuItem>
                            )}
                            {vendor.status !== 'blacklisted' && (
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleStatusChange(vendor, 'blacklisted') }} className="text-red-600">
                                <Ban className="h-4 w-4 mr-2" /> Blacklist
                              </DropdownMenuItem>
                            )}
                            {canDelete && (
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openDeleteDialog(vendor) }} className="text-red-600 dark:text-red-400">
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

      {/* Add Vendor Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Vendor</DialogTitle>
            <DialogDescription>Register a new supplier for your hostel</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Basic Info */}
            <div className="space-y-3">
              <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Building2 className="h-4 w-4" /> Basic Information
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Vendor Name *</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Enter vendor name" />
                </div>
                <div className="space-y-1.5">
                  <Label>Contact Person</Label>
                  <Input value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} placeholder="Contact person name" />
                </div>
                <div className="space-y-1.5">
                  <Label>Phone *</Label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone number" />
                </div>
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email address" />
                </div>
              </div>
            </div>

            <Separator />

            {/* Address */}
            <div className="space-y-3">
              <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <MapPin className="h-4 w-4" /> Address Information
              </div>
              <div className="space-y-1.5">
                <Label>Address</Label>
                <Textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Full address" rows={2} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label>City</Label>
                  <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="City" />
                </div>
                <div className="space-y-1.5">
                  <Label>State</Label>
                  <Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} placeholder="State" />
                </div>
                <div className="space-y-1.5">
                  <Label>Pincode</Label>
                  <Input value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} placeholder="Pincode" />
                </div>
              </div>
            </div>

            <Separator />

            {/* Tax & Legal */}
            <div className="space-y-3">
              <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Globe className="h-4 w-4" /> Tax & Legal
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>GST Number</Label>
                  <Input value={form.gstNumber} onChange={(e) => setForm({ ...form, gstNumber: e.target.value })} placeholder="GSTIN" />
                </div>
                <div className="space-y-1.5">
                  <Label>PAN Number</Label>
                  <Input value={form.panNumber} onChange={(e) => setForm({ ...form, panNumber: e.target.value })} placeholder="PAN number" />
                </div>
              </div>
            </div>

            <Separator />

            {/* Bank Details */}
            <div className="space-y-3">
              <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Banknote className="h-4 w-4" /> Bank Details
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label>Bank Name</Label>
                  <Input value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} placeholder="Bank name" />
                </div>
                <div className="space-y-1.5">
                  <Label>Account Number</Label>
                  <Input value={form.bankAccount} onChange={(e) => setForm({ ...form, bankAccount: e.target.value })} placeholder="Account number" />
                </div>
                <div className="space-y-1.5">
                  <Label>IFSC Code</Label>
                  <Input value={form.ifscCode} onChange={(e) => setForm({ ...form, ifscCode: e.target.value })} placeholder="IFSC code" />
                </div>
              </div>
            </div>

            <Separator />

            {/* Payment & Rating */}
            <div className="space-y-3">
              <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <CreditCard className="h-4 w-4" /> Payment & Rating
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Payment Terms</Label>
                  <Select value={form.paymentTerms} onValueChange={(v) => setForm({ ...form, paymentTerms: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PAYMENT_TERMS.map(pt => (
                        <SelectItem key={pt.value} value={pt.value}>{pt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Rating</Label>
                  <div className="flex items-center gap-1 mt-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star} type="button" onClick={() => setForm({ ...form, rating: star })}>
                        <Star className={`h-6 w-6 ${star <= form.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700">
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Add Vendor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Vendor Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Vendor</DialogTitle>
            <DialogDescription>Update vendor information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Vendor Name *</Label>
                <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Contact Person</Label>
                <Input value={editForm.contactPerson} onChange={(e) => setEditForm({ ...editForm, contactPerson: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Phone *</Label>
                <Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Address</Label>
              <Textarea value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} rows={2} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>City</Label>
                <Input value={editForm.city} onChange={(e) => setEditForm({ ...editForm, city: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>State</Label>
                <Input value={editForm.state} onChange={(e) => setEditForm({ ...editForm, state: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Pincode</Label>
                <Input value={editForm.pincode} onChange={(e) => setEditForm({ ...editForm, pincode: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>GST Number</Label>
                <Input value={editForm.gstNumber} onChange={(e) => setEditForm({ ...editForm, gstNumber: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>PAN Number</Label>
                <Input value={editForm.panNumber} onChange={(e) => setEditForm({ ...editForm, panNumber: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Bank Name</Label>
                <Input value={editForm.bankName} onChange={(e) => setEditForm({ ...editForm, bankName: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Account Number</Label>
                <Input value={editForm.bankAccount} onChange={(e) => setEditForm({ ...editForm, bankAccount: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>IFSC Code</Label>
                <Input value={editForm.ifscCode} onChange={(e) => setEditForm({ ...editForm, ifscCode: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Payment Terms</Label>
                <Select value={editForm.paymentTerms} onValueChange={(v) => setEditForm({ ...editForm, paymentTerms: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PAYMENT_TERMS.map(pt => (
                      <SelectItem key={pt.value} value={pt.value}>{pt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Rating</Label>
                <div className="flex items-center gap-1 mt-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} type="button" onClick={() => setEditForm({ ...editForm, rating: star })}>
                      <Star className={`h-6 w-6 ${star <= editForm.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleEdit} disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700">
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Update Vendor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Vendor Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
                {selectedVendor?.name.charAt(0)}
              </div>
              <div>
                <div>{selectedVendor?.name}</div>
                <div className="text-sm font-normal text-slate-500">{selectedVendor?.contactPerson || 'No contact person'}</div>
              </div>
            </DialogTitle>
          </DialogHeader>
          {selectedVendor && (
            <div className="space-y-4 py-4">
              {/* Status & Rating */}
              <div className="flex items-center gap-3">
                {getStatusBadge(selectedVendor.status)}
                {renderStars(selectedVendor.rating)}
              </div>

              <Separator />

              {/* Contact Info */}
              <div className="space-y-3">
                <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">Contact Information</div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-slate-400" />
                    <div>
                      <div className="text-xs text-slate-400">Phone</div>
                      <div className="text-sm">{selectedVendor.phone}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-slate-400" />
                    <div>
                      <div className="text-xs text-slate-400">Email</div>
                      <div className="text-sm">{selectedVendor.email || '-'}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Address */}
              {(selectedVendor.address || selectedVendor.city) && (
                <div className="space-y-2">
                  <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">Address</div>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-slate-400 mt-0.5" />
                    <div className="text-sm">
                      {selectedVendor.address && <div>{selectedVendor.address}</div>}
                      <div>{[selectedVendor.city, selectedVendor.state, selectedVendor.pincode].filter(Boolean).join(', ')}</div>
                    </div>
                  </div>
                </div>
              )}

              <Separator />

              {/* Tax & Banking */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">Tax Information</div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">GST Number</span>
                      <span className="font-mono text-xs">{selectedVendor.gstNumber || '-'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">PAN Number</span>
                      <span className="font-mono text-xs">{selectedVendor.panNumber || '-'}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">Bank Details</div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Bank</span>
                      <span>{selectedVendor.bankName || '-'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Account</span>
                      <span className="font-mono text-xs">{selectedVendor.bankAccount || '-'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">IFSC</span>
                      <span className="font-mono text-xs">{selectedVendor.ifscCode || '-'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Payment & History */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">Payment Terms</div>
                  <div className="text-sm">{selectedVendor.paymentTerms || '-'}</div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">Purchase History</div>
                  <div className="flex gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{selectedVendor._count.purchaseOrders}</div>
                      <div className="text-xs text-slate-500">Orders</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{selectedVendor._count.quotations}</div>
                      <div className="text-xs text-slate-500">Quotations</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>Close</Button>
            {canUpdate && (
              <Button onClick={() => { setDetailDialogOpen(false); if (selectedVendor) openEdit(selectedVendor) }} className="bg-emerald-600 hover:bg-emerald-700">
                <Edit className="h-4 w-4 mr-2" /> Edit Vendor
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Vendor</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This action cannot be undone.
              Vendors with existing purchase orders cannot be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {deleting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
