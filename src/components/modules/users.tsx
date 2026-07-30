'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAppStore, hasPermission } from '@/lib/store'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  UsersRound,
  Plus,
  Pencil,
  Trash2,
  Shield,
  Mail,
  Phone,
  Loader2,
  Search,
  UserCheck,
  UserX,
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface UserRecord {
  id: string
  name: string
  email: string
  phone?: string
  role: string
  isActive: boolean
  lastLogin?: string
  createdAt: string
}

export function UsersPage() {
  const { currentUser, selectedPropertyId } = useAppStore()
  const [users, setUsers] = useState<UserRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showDialog, setShowDialog] = useState(false)
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', role: 'manager', isActive: true })

  const canCreate = currentUser && hasPermission(currentUser.role, 'users:create')
  const canUpdate = currentUser && hasPermission(currentUser.role, 'users:update')
  const canDelete = currentUser && hasPermission(currentUser.role, 'users:delete')

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/users')
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users || [])
      }
    } catch (e) {
      console.error('Failed to fetch users:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const openCreate = () => {
    setEditingUser(null)
    setForm({ name: '', email: '', phone: '', password: '', role: 'manager', isActive: true })
    setShowDialog(true)
  }

  const openEdit = (user: UserRecord) => {
    setEditingUser(user)
    setForm({ name: user.name, email: user.email, phone: user.phone || '', password: '', role: user.role, isActive: user.isActive })
    setShowDialog(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (editingUser) {
        const res = await fetch('/api/users', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingUser.id, ...form }),
        })
        if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed to update') }
        toast({ title: 'User Updated', description: `${form.name} has been updated.` })
      } else {
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed to create') }
        toast({ title: 'User Created', description: `${form.name} has been created.` })
      }
      setShowDialog(false)
      fetchUsers()
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (user: UserRecord) => {
    if (!confirm(`Delete user "${user.name}"? This action cannot be undone.`)) return
    try {
      const res = await fetch('/api/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed to delete') }
      toast({ title: 'User Deleted', description: `${user.name} has been removed.` })
      fetchUsers()
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    }
  }

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  )

  const roleColors: Record<string, string> = {
    super_admin: 'bg-red-500/15 text-red-400 border-0',
    owner: 'bg-purple-500/15 text-purple-400 border-0',
    manager: 'bg-blue-500/15 text-blue-400 border-0',
    staff: 'bg-amber-500/15 text-amber-400 border-0',
    tenant: 'bg-emerald-500/15 text-emerald-400 border-0',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <UsersRound className="w-6 h-6 text-emerald-500" />
            User Management
          </h1>
          <p className="text-muted-foreground text-sm">Manage users, roles, and access control</p>
        </div>
        {canCreate && (
          <Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4 mr-2" /> Add User
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">All Users</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                        {user.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.phone ? (
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                          {user.phone}
                        </div>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge className={roleColors[user.role] || 'bg-slate-500/15 text-slate-400 border-0'}>
                        <Shield className="w-3 h-3 mr-1" />
                        {user.role.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={user.isActive ? 'bg-emerald-500/15 text-emerald-400 border-0' : 'bg-red-500/15 text-red-400 border-0'}>
                        {user.isActive ? <UserCheck className="w-3 h-3 mr-1" /> : <UserX className="w-3 h-3 mr-1" />}
                        {user.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {canUpdate && (
                          <Button variant="ghost" size="sm" onClick={() => openEdit(user)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                        )}
                        {canDelete && user.id !== currentUser?.id && (
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(user)} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Edit User' : 'Create User'}</DialogTitle>
            <DialogDescription>
              {editingUser ? 'Update user details and role.' : 'Add a new user to the system.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Enter full name" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Enter email address" />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Enter phone number" />
            </div>
            {!editingUser && (
              <div className="space-y-2">
                <Label>Password</Label>
                <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Enter password" />
              </div>
            )}
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                  <SelectItem value="owner">Owner</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="tenant">Tenant</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {editingUser && (
              <div className="flex items-center gap-2">
                <Label>Active</Label>
                <Button
                  variant={form.isActive ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setForm({ ...form, isActive: !form.isActive })}
                  className={form.isActive ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                >
                  {form.isActive ? 'Active' : 'Inactive'}
                </Button>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !form.name || !form.email} className="bg-emerald-600 hover:bg-emerald-700">
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {editingUser ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
