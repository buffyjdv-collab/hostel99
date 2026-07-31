'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/hooks/use-toast'
import {
  Building2, Plus, Users, UserPlus, MapPin, Phone, Mail,
  Trash2, Edit, Shield, Crown, UserCog, Wrench, User,
  Search, Home, ArrowRightLeft, Loader2, CheckCircle2,
  KeyRound, Eye, EyeOff,
} from 'lucide-react'

interface Property {
  id: string
  name: string
  type: string
  address: string
  city: string
  state?: string
  pincode?: string
  totalRooms: number
  totalBeds: number
  occupancy: number
  isActive: boolean
  ownerId: string
  owner?: { id: string; name: string; email: string; phone?: string }
  createdAt: string
  _count?: { buildings: number; rooms: number }
}

interface Assignment {
  id: string
  userId: string
  propertyId: string
  role: string
  isActive: boolean
  user: { id: string; name: string; email: string; phone?: string; role: string; avatar?: string }
  property: { id: string; name: string; type: string; address: string; city: string; isActive: boolean }
}

interface UserItem {
  id: string
  name: string
  email: string
  phone?: string
  role: string
  isActive: boolean
}

const roleIcons: Record<string, React.ElementType> = {
  owner: Crown,
  manager: UserCog,
  staff: Wrench,
  tenant: User,
}

const roleColors: Record<string, string> = {
  owner: 'bg-purple-100 text-purple-800 border-purple-200',
  manager: 'bg-blue-100 text-blue-800 border-blue-200',
  staff: 'bg-amber-100 text-amber-800 border-amber-200',
  tenant: 'bg-emerald-100 text-emerald-800 border-emerald-200',
}

export function HostelsPage() {
  const { currentUser, currentHostelId, setCurrentHostelId } = useAppStore()
  const [properties, setProperties] = useState<Property[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [users, setUsers] = useState<UserItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Dialog states
  const [showCreateHostel, setShowCreateHostel] = useState(false)
  const [showAssignUser, setShowAssignUser] = useState(false)
  const [showEditHostel, setShowEditHostel] = useState(false)
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
  const [creating, setCreating] = useState(false)

  // Create hostel form - includes owner details
  const [newHostel, setNewHostel] = useState({
    // Hostel details
    name: '', type: 'pg', address: '', city: '', state: '', pincode: '',
    landmark: '', description: '', totalRooms: 0, totalBeds: 0,
    // Owner details (inline)
    ownerName: '', ownerEmail: '', ownerPhone: '', ownerPassword: '',
  })
  const [showOwnerPassword, setShowOwnerPassword] = useState(false)

  // Assign user form
  const [assignForm, setAssignForm] = useState({
    userId: '', propertyId: '', role: 'manager',
  })

  // Edit hostel form
  const [editForm, setEditForm] = useState({
    id: '', name: '', type: '', address: '', city: '', state: '', pincode: '',
    contactPhone: '', contactEmail: '', ownerId: '',
  })

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [propsRes, assignRes, usersRes] = await Promise.all([
        fetch('/api/properties'),
        fetch('/api/hostel-assignments'),
        fetch('/api/users'),
      ])
      if (propsRes.ok) {
        const propsData = await propsRes.json()
        setProperties(Array.isArray(propsData) ? propsData : [])
      }
      if (assignRes.ok) {
        const assignData = await assignRes.json()
        setAssignments(assignData.assignments || [])
      }
      if (usersRes.ok) {
        const usersData = await usersRes.json()
        setUsers(usersData.users || [])
      }
    } catch (error) {
      console.error('Failed to fetch hostels data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleCreateHostel = async () => {
    if (!newHostel.name || !newHostel.address || !newHostel.city) {
      toast({ title: 'Validation Error', description: 'Hostel name, address, and city are required', variant: 'destructive' })
      return
    }
    if (!newHostel.ownerName || !newHostel.ownerEmail || !newHostel.ownerPhone) {
      toast({ title: 'Validation Error', description: 'Owner name, email, and phone are required', variant: 'destructive' })
      return
    }
    setCreating(true)
    try {
      const res = await fetch('/api/hostels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hostelName: newHostel.name,
          hostelType: newHostel.type,
          address: newHostel.address,
          city: newHostel.city,
          state: newHostel.state,
          pincode: newHostel.pincode,
          landmark: newHostel.landmark,
          description: newHostel.description,
          totalRooms: newHostel.totalRooms,
          totalBeds: newHostel.totalBeds,
          ownerName: newHostel.ownerName,
          ownerEmail: newHostel.ownerEmail,
          ownerPhone: newHostel.ownerPhone,
          ownerPassword: newHostel.ownerPassword || undefined,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        toast({ title: 'Error', description: data.error, variant: 'destructive' })
        return
      }
      const result = await res.json()
      const ownerInfo = result.owner?.isNew
        ? `Owner ${result.owner.name} created with email ${result.owner.email}`
        : `Existing owner ${result.owner.name} assigned`
      toast({
        title: 'Hostel Created!',
        description: `${newHostel.name} created. ${ownerInfo}. Login: ${newHostel.ownerEmail} / ${newHostel.ownerPassword || newHostel.ownerName.toLowerCase().replace(/\s+/g, '') + '123'}`,
      })
      setShowCreateHostel(false)
      setNewHostel({
        name: '', type: 'pg', address: '', city: '', state: '', pincode: '',
        landmark: '', description: '', totalRooms: 0, totalBeds: 0,
        ownerName: '', ownerEmail: '', ownerPhone: '', ownerPassword: '',
      })
      fetchData()
    } catch {
      toast({ title: 'Error', description: 'Failed to create hostel', variant: 'destructive' })
    } finally {
      setCreating(false)
    }
  }

  const handleAssignUser = async () => {
    if (!assignForm.userId || !assignForm.propertyId || !assignForm.role) {
      toast({ title: 'Validation Error', description: 'All fields are required', variant: 'destructive' })
      return
    }
    try {
      const res = await fetch('/api/hostel-assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assignForm),
      })
      if (!res.ok) {
        const data = await res.json()
        toast({ title: 'Error', description: data.error, variant: 'destructive' })
        return
      }
      toast({ title: 'User Assigned', description: 'User has been assigned to the hostel successfully' })
      setShowAssignUser(false)
      setAssignForm({ userId: '', propertyId: '', role: 'manager' })
      fetchData()
    } catch {
      toast({ title: 'Error', description: 'Failed to assign user', variant: 'destructive' })
    }
  }

  const handleRemoveAssignment = async (assignmentId: string) => {
    try {
      await fetch('/api/hostel-assignments', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: assignmentId }),
      })
      toast({ title: 'Assignment Removed', description: 'User has been removed from the hostel' })
      fetchData()
    } catch {
      toast({ title: 'Error', description: 'Failed to remove assignment', variant: 'destructive' })
    }
  }

  const handleEditHostel = async () => {
    try {
      const res = await fetch('/api/properties', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })
      if (!res.ok) {
        const data = await res.json()
        toast({ title: 'Error', description: data.error, variant: 'destructive' })
        return
      }
      toast({ title: 'Hostel Updated', description: 'Hostel details updated successfully' })
      setShowEditHostel(false)
      fetchData()
    } catch {
      toast({ title: 'Error', description: 'Failed to update hostel', variant: 'destructive' })
    }
  }

  const handleDeleteHostel = async (propertyId: string) => {
    try {
      await fetch('/api/properties', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: propertyId }),
      })
      toast({ title: 'Hostel Deleted', description: 'Hostel has been deleted' })
      fetchData()
    } catch {
      toast({ title: 'Error', description: 'Failed to delete hostel', variant: 'destructive' })
    }
  }

  const getPropertyAssignments = (propertyId: string) => {
    return assignments.filter(a => a.propertyId === propertyId && a.isActive)
  }

  const filteredProperties = properties.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.address.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Users available for assignment (not super_admin, not already assigned to this hostel)
  const availableUsers = users.filter(u => u.role !== 'super_admin' && u.isActive)

  // Owners for hostel creation dropdown
  const owners = users.filter(u => u.role === 'owner' || u.role === 'super_admin')

  if (currentUser?.role !== 'super_admin') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Shield className="w-16 h-16 text-slate-300 mb-4" />
        <h2 className="text-xl font-semibold text-slate-700">Access Restricted</h2>
        <p className="text-slate-500 mt-2">Only Super Admins can manage hostels and assignments.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-7 h-7 text-indigo-600" />
            Hostel Management
          </h1>
          <p className="text-slate-500 mt-1">Create hostels with owner details and assign managers & staff</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowAssignUser(true)} variant="outline" className="gap-2">
            <UserPlus className="w-4 h-4" />
            Assign User
          </Button>
          <Button onClick={() => setShowCreateHostel(true)} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-4 h-4" />
            Create Hostel
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Search hostels by name, city, or address..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{properties.length}</p>
                <p className="text-xs text-slate-500">Total Hostels</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{assignments.length}</p>
                <p className="text-xs text-slate-500">Total Assignments</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Crown className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {assignments.filter(a => a.role === 'owner').length}
                </p>
                <p className="text-xs text-slate-500">Owners</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <UserCog className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {assignments.filter(a => a.role === 'manager').length}
                </p>
                <p className="text-xs text-slate-500">Managers</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hostels List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full" />
        </div>
      ) : filteredProperties.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="w-12 h-12 text-slate-300 mb-3" />
            <p className="text-slate-500">No hostels found. Create your first hostel to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {filteredProperties.map((property) => {
            const propAssignments = getPropertyAssignments(property.id)
            const occupancyPct = property.totalBeds > 0 ? Math.round((property.occupancy / property.totalBeds) * 100) : 0

            return (
              <Card key={property.id} className="overflow-hidden border-slate-200">
                <CardHeader className="pb-3 bg-gradient-to-r from-indigo-50/50 to-slate-50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center">
                        <Home className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{property.name}</CardTitle>
                        <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{property.address}, {property.city}</span>
                          <Badge variant="outline" className="text-xs capitalize">{property.type}</Badge>
                          {currentHostelId === property.id && (
                            <Badge className="bg-indigo-100 text-indigo-700 text-xs">Active</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCurrentHostelId(property.id)}
                        className="gap-1 text-xs"
                        title="Switch to this hostel context"
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5" />
                        Switch
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditForm({
                            id: property.id, name: property.name, type: property.type,
                            address: property.address, city: property.city, state: property.state || '',
                            pincode: property.pincode || '', contactPhone: '', contactEmail: '',
                            ownerId: property.ownerId,
                          })
                          setShowEditHostel(true)
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete {property.name}?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete the hostel and all its data. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteHostel(property.id)} className="bg-red-600 hover:bg-red-700">
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-4">
                  {/* Stats Row */}
                  <div className="grid grid-cols-3 gap-4 mb-4 p-3 bg-slate-50 rounded-lg">
                    <div className="text-center">
                      <p className="text-lg font-bold text-slate-900">{property.totalRooms}</p>
                      <p className="text-xs text-slate-500">Rooms</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-slate-900">{property.totalBeds}</p>
                      <p className="text-xs text-slate-500">Beds</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-slate-900">{occupancyPct}%</p>
                      <p className="text-xs text-slate-500">Occupancy</p>
                    </div>
                  </div>

                  {/* Owner Info */}
                  {property.owner && (
                    <div className="mb-4 p-3 bg-purple-50 rounded-lg border border-purple-100">
                      <div className="flex items-center gap-2 mb-1">
                        <Crown className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-semibold text-purple-800">Owner</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-purple-200 text-purple-800 text-xs font-medium">
                            {property.owner.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{property.owner.name}</p>
                          <div className="flex items-center gap-3 text-xs text-slate-500">
                            <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{property.owner.email}</span>
                            {property.owner.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{property.owner.phone}</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Assigned Users */}
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Assigned Team ({propAssignments.length})
                    </h4>
                    {propAssignments.length === 0 ? (
                      <p className="text-sm text-slate-400 py-2">No users assigned yet. Click &quot;Assign User&quot; to add team members.</p>
                    ) : (
                      <div className="space-y-2">
                        {propAssignments.map((assignment) => {
                          const RoleIcon = roleIcons[assignment.role] || User
                          const colorClass = roleColors[assignment.role] || 'bg-slate-100 text-slate-800'
                          return (
                            <div key={assignment.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-white">
                              <div className="flex items-center gap-3">
                                <Avatar className="w-9 h-9">
                                  <AvatarFallback className="bg-slate-100 text-slate-700 text-sm font-medium">
                                    {assignment.user.name.split(' ').map(n => n[0]).join('')}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="text-sm font-medium text-slate-900">{assignment.user.name}</p>
                                  <p className="text-xs text-slate-500">{assignment.user.email}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge className={`${colorClass} text-xs border`}>
                                  <RoleIcon className="w-3 h-3 mr-1" />
                                  {assignment.role}
                                </Badge>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-400 hover:text-red-600">
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Remove {assignment.user.name}?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This will remove {assignment.user.name} from {property.name}. They will no longer have access to this hostel&apos;s data.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleRemoveAssignment(assignment.id)} className="bg-red-600 hover:bg-red-700">
                                        Remove
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* ─── Create Hostel Dialog (with Owner Details) ──────────────────── */}
      <Dialog open={showCreateHostel} onOpenChange={setShowCreateHostel}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-600" />
              Create New Hostel & Assign Owner
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-2">
            {/* ─── Hostel Details Section ───────────────────── */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                <Building2 className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-semibold text-slate-800">Hostel Details</h3>
              </div>
              <div className="space-y-2">
                <Label>Hostel Name *</Label>
                <Input placeholder="e.g. Sunrise PG" value={newHostel.name} onChange={(e) => setNewHostel({ ...newHostel, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={newHostel.type} onValueChange={(v) => setNewHostel({ ...newHostel, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pg">PG</SelectItem>
                      <SelectItem value="hostel">Hostel</SelectItem>
                      <SelectItem value="co_living">Co-Living</SelectItem>
                      <SelectItem value="apartment">Apartment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Total Rooms</Label>
                  <Input type="number" placeholder="0" value={newHostel.totalRooms || ''} onChange={(e) => setNewHostel({ ...newHostel, totalRooms: parseInt(e.target.value) || 0 })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Address *</Label>
                <Input placeholder="Full address" value={newHostel.address} onChange={(e) => setNewHostel({ ...newHostel, address: e.target.value })} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>City *</Label>
                  <Input placeholder="City" value={newHostel.city} onChange={(e) => setNewHostel({ ...newHostel, city: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>State</Label>
                  <Input placeholder="State" value={newHostel.state} onChange={(e) => setNewHostel({ ...newHostel, state: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Pincode</Label>
                  <Input placeholder="Pincode" value={newHostel.pincode} onChange={(e) => setNewHostel({ ...newHostel, pincode: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Landmark</Label>
                  <Input placeholder="Nearby landmark" value={newHostel.landmark} onChange={(e) => setNewHostel({ ...newHostel, landmark: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Total Beds</Label>
                  <Input type="number" placeholder="0" value={newHostel.totalBeds || ''} onChange={(e) => setNewHostel({ ...newHostel, totalBeds: parseInt(e.target.value) || 0 })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea placeholder="Brief description of the hostel..." value={newHostel.description} onChange={(e) => setNewHostel({ ...newHostel, description: e.target.value })} rows={2} />
              </div>
            </div>

            {/* ─── Owner Details Section ────────────────────── */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                <Crown className="w-4 h-4 text-purple-600" />
                <h3 className="text-sm font-semibold text-slate-800">Owner Details</h3>
                <Badge variant="outline" className="text-xs text-purple-600 border-purple-300">Will be auto-assigned to this hostel</Badge>
              </div>
              <div className="space-y-2">
                <Label>Owner Full Name *</Label>
                <Input placeholder="e.g. Rajesh Kumar" value={newHostel.ownerName} onChange={(e) => setNewHostel({ ...newHostel, ownerName: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Owner Email *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input placeholder="owner@example.com" value={newHostel.ownerEmail} onChange={(e) => setNewHostel({ ...newHostel, ownerEmail: e.target.value })} className="pl-10" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Owner Phone *</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input placeholder="9876543210" value={newHostel.ownerPhone} onChange={(e) => setNewHostel({ ...newHostel, ownerPhone: e.target.value })} className="pl-10" />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Login Password</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    type={showOwnerPassword ? 'text' : 'password'}
                    placeholder="Leave blank to auto-generate"
                    value={newHostel.ownerPassword}
                    onChange={(e) => setNewHostel({ ...newHostel, ownerPassword: e.target.value })}
                    className="pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOwnerPassword(!showOwnerPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showOwnerPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-slate-400">If left blank, password will be auto-generated as: ownername123</p>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <div className="text-xs text-amber-800">
                    <p className="font-medium">What happens when you create:</p>
                    <ul className="mt-1 space-y-0.5 list-disc list-inside">
                      <li>A new owner user account is created with the details above</li>
                      <li>The hostel (property) is created and linked to this owner</li>
                      <li>The owner is automatically assigned to this hostel</li>
                      <li>Owner can login and create managers, staff, and manage their hostel</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateHostel(false)}>Cancel</Button>
            <Button onClick={handleCreateHostel} disabled={creating} className="bg-indigo-600 hover:bg-indigo-700 gap-2">
              {creating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Building2 className="w-4 h-4" />
                  Create Hostel & Owner
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Assign User Dialog ────────────────────────────────── */}
      <Dialog open={showAssignUser} onOpenChange={setShowAssignUser}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-indigo-600" />
              Assign User to Hostel
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Select Hostel *</Label>
              <Select value={assignForm.propertyId} onValueChange={(v) => setAssignForm({ ...assignForm, propertyId: v })}>
                <SelectTrigger><SelectValue placeholder="Choose a hostel" /></SelectTrigger>
                <SelectContent>
                  {properties.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name} - {p.city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Select User *</Label>
              <Select value={assignForm.userId} onValueChange={(v) => setAssignForm({ ...assignForm, userId: v })}>
                <SelectTrigger><SelectValue placeholder="Choose a user" /></SelectTrigger>
                <SelectContent>
                  {availableUsers.map(u => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name} ({u.email}) - {u.role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Role in this Hostel *</Label>
              <Select value={assignForm.role} onValueChange={(v) => setAssignForm({ ...assignForm, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner">Owner</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="tenant">Tenant</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignUser(false)}>Cancel</Button>
            <Button onClick={handleAssignUser} className="bg-indigo-600 hover:bg-indigo-700 gap-2">
              <UserPlus className="w-4 h-4" />
              Assign User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Edit Hostel Dialog ────────────────────────────────── */}
      <Dialog open={showEditHostel} onOpenChange={setShowEditHostel}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5 text-indigo-600" />
              Edit Hostel
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Hostel Name</Label>
              <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={editForm.type} onValueChange={(v) => setEditForm({ ...editForm, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pg">PG</SelectItem>
                    <SelectItem value="hostel">Hostel</SelectItem>
                    <SelectItem value="co_living">Co-Living</SelectItem>
                    <SelectItem value="apartment">Apartment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Owner</Label>
                <Select value={editForm.ownerId} onValueChange={(v) => setEditForm({ ...editForm, ownerId: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {owners.map(u => (
                      <SelectItem key={u.id} value={u.id}>{u.name} ({u.role})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>City</Label>
                <Input value={editForm.city} onChange={(e) => setEditForm({ ...editForm, city: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>State</Label>
                <Input value={editForm.state} onChange={(e) => setEditForm({ ...editForm, state: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Pincode</Label>
                <Input value={editForm.pincode} onChange={(e) => setEditForm({ ...editForm, pincode: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditHostel(false)}>Cancel</Button>
            <Button onClick={handleEditHostel} className="bg-indigo-600 hover:bg-indigo-700">Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
