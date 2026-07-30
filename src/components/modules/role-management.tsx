'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAppStore, hasPermission, ROLE_PERMISSIONS, type Permission, type UserRole } from '@/lib/store'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ShieldCheck,
  Shield,
  Save,
  Loader2,
  CheckCircle2,
  XCircle,
  Users,
  Eye,
  Lock,
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'

const roleLabels: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  owner: 'Owner',
  manager: 'Manager',
  staff: 'Staff',
  tenant: 'Tenant',
}

const roleColors: Record<UserRole, string> = {
  super_admin: 'bg-red-500/15 text-red-400 border-0',
  owner: 'bg-purple-500/15 text-purple-400 border-0',
  manager: 'bg-blue-500/15 text-blue-400 border-0',
  staff: 'bg-amber-500/15 text-amber-400 border-0',
  tenant: 'bg-emerald-500/15 text-emerald-400 border-0',
}

const roleDescriptions: Record<UserRole, string> = {
  super_admin: 'Full system access. Can manage all modules, users, and role permissions.',
  owner: 'Property owner with full access to their properties and related data. Can view users but not manage roles.',
  manager: 'Day-to-day operations manager. Can create and update most records but cannot delete or manage users.',
  staff: 'Frontline staff with read-only access to most modules. Can create complaints and visitors.',
  tenant: 'Resident with limited access to their own payments, complaints, notices, and visitor logs.',
}

// Group permissions by module
const permissionGroups: { label: string; permissions: { key: Permission; label: string }[] }[] = [
  {
    label: 'Dashboard',
    permissions: [
      { key: 'dashboard:view', label: 'View Dashboard' },
    ],
  },
  {
    label: 'Properties',
    permissions: [
      { key: 'properties:create', label: 'Create' },
      { key: 'properties:read', label: 'Read' },
      { key: 'properties:update', label: 'Update' },
      { key: 'properties:delete', label: 'Delete' },
    ],
  },
  {
    label: 'Rooms & Beds',
    permissions: [
      { key: 'rooms:create', label: 'Create' },
      { key: 'rooms:read', label: 'Read' },
      { key: 'rooms:update', label: 'Update' },
      { key: 'rooms:delete', label: 'Delete' },
    ],
  },
  {
    label: 'Leads',
    permissions: [
      { key: 'leads:create', label: 'Create' },
      { key: 'leads:read', label: 'Read' },
      { key: 'leads:update', label: 'Update' },
      { key: 'leads:delete', label: 'Delete' },
    ],
  },
  {
    label: 'Tenants',
    permissions: [
      { key: 'tenants:create', label: 'Create' },
      { key: 'tenants:read', label: 'Read' },
      { key: 'tenants:update', label: 'Update' },
      { key: 'tenants:delete', label: 'Delete' },
    ],
  },
  {
    label: 'Payments',
    permissions: [
      { key: 'payments:create', label: 'Create' },
      { key: 'payments:read', label: 'Read' },
      { key: 'payments:update', label: 'Update' },
      { key: 'payments:delete', label: 'Delete' },
    ],
  },
  {
    label: 'Complaints',
    permissions: [
      { key: 'complaints:create', label: 'Create' },
      { key: 'complaints:read', label: 'Read' },
      { key: 'complaints:update', label: 'Update' },
      { key: 'complaints:delete', label: 'Delete' },
    ],
  },
  {
    label: 'Staff',
    permissions: [
      { key: 'staff:create', label: 'Create' },
      { key: 'staff:read', label: 'Read' },
      { key: 'staff:update', label: 'Update' },
      { key: 'staff:delete', label: 'Delete' },
    ],
  },
  {
    label: 'Expenses',
    permissions: [
      { key: 'expenses:create', label: 'Create' },
      { key: 'expenses:read', label: 'Read' },
      { key: 'expenses:update', label: 'Update' },
      { key: 'expenses:delete', label: 'Delete' },
    ],
  },
  {
    label: 'Reports',
    permissions: [
      { key: 'reports:read', label: 'Read' },
    ],
  },
  {
    label: 'Notices',
    permissions: [
      { key: 'notices:create', label: 'Create' },
      { key: 'notices:read', label: 'Read' },
      { key: 'notices:update', label: 'Update' },
      { key: 'notices:delete', label: 'Delete' },
    ],
  },
  {
    label: 'Visitors',
    permissions: [
      { key: 'visitors:create', label: 'Create' },
      { key: 'visitors:read', label: 'Read' },
      { key: 'visitors:update', label: 'Update' },
      { key: 'visitors:delete', label: 'Delete' },
    ],
  },
  {
    label: 'Inventory',
    permissions: [
      { key: 'inventory:create', label: 'Create' },
      { key: 'inventory:read', label: 'Read' },
      { key: 'inventory:update', label: 'Update' },
      { key: 'inventory:delete', label: 'Delete' },
    ],
  },
  {
    label: 'Vendors',
    permissions: [
      { key: 'vendors:create', label: 'Create' },
      { key: 'vendors:read', label: 'Read' },
      { key: 'vendors:update', label: 'Update' },
      { key: 'vendors:delete', label: 'Delete' },
    ],
  },
  {
    label: 'Purchases',
    permissions: [
      { key: 'purchases:create', label: 'Create' },
      { key: 'purchases:read', label: 'Read' },
      { key: 'purchases:update', label: 'Update' },
      { key: 'purchases:delete', label: 'Delete' },
    ],
  },
  {
    label: 'Kitchen',
    permissions: [
      { key: 'kitchen:create', label: 'Create' },
      { key: 'kitchen:read', label: 'Read' },
      { key: 'kitchen:update', label: 'Update' },
      { key: 'kitchen:delete', label: 'Delete' },
    ],
  },
  {
    label: 'Mess',
    permissions: [
      { key: 'mess:create', label: 'Create' },
      { key: 'mess:read', label: 'Read' },
      { key: 'mess:update', label: 'Update' },
      { key: 'mess:delete', label: 'Delete' },
    ],
  },
  {
    label: 'Assets',
    permissions: [
      { key: 'assets:create', label: 'Create' },
      { key: 'assets:read', label: 'Read' },
      { key: 'assets:update', label: 'Update' },
      { key: 'assets:delete', label: 'Delete' },
    ],
  },
  {
    label: 'Settings',
    permissions: [
      { key: 'settings:read', label: 'Read' },
      { key: 'settings:update', label: 'Update' },
    ],
  },
  {
    label: 'Users',
    permissions: [
      { key: 'users:create', label: 'Create' },
      { key: 'users:read', label: 'Read' },
      { key: 'users:update', label: 'Update' },
      { key: 'users:delete', label: 'Delete' },
    ],
  },
  {
    label: 'Role Management',
    permissions: [
      { key: 'role-management:read', label: 'Read' },
      { key: 'role-management:update', label: 'Update' },
    ],
  },
]

export function RoleManagementPage() {
  const { currentUser } = useAppStore()
  const [customPermissions, setCustomPermissions] = useState<Record<UserRole, Permission[]>>({})
  const [hasChanges, setHasChanges] = useState(false)
  const [saving, setSaving] = useState(false)
  const [selectedRole, setSelectedRole] = useState<UserRole>('manager')

  const canManage = currentUser && hasPermission(currentUser.role, 'role-management:update')
  const canView = currentUser && hasPermission(currentUser.role, 'role-management:read')

  // Initialize permissions from ROLE_PERMISSIONS
  useEffect(() => {
    setCustomPermissions({ ...ROLE_PERMISSIONS } as Record<UserRole, Permission[]>)
  }, [])

  const togglePermission = (role: UserRole, permission: Permission) => {
    if (!canManage) return
    if (role === 'super_admin') return // Cannot modify super_admin

    setCustomPermissions(prev => {
      const current = prev[role] || []
      const exists = current.includes(permission)
      const updated = exists
        ? current.filter(p => p !== permission)
        : [...current, permission]
      return { ...prev, [role]: updated }
    })
    setHasChanges(true)
  }

  const hasPerm = (role: UserRole, permission: Permission): boolean => {
    const perms = customPermissions[role] || []
    return perms.includes(permission)
  }

  const getPermissionCount = (role: UserRole): { total: number; granted: number } => {
    const allPerms = permissionGroups.reduce((acc, g) => acc + g.permissions.length, 0)
    const granted = (customPermissions[role] || []).length
    return { total: allPerms, granted }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // In a real app, this would save to the database
      // For now, we update the in-memory ROLE_PERMISSIONS
      Object.keys(customPermissions).forEach(role => {
        ROLE_PERMISSIONS[role] = customPermissions[role as UserRole]
      })
      setHasChanges(false)
      toast({ title: 'Permissions Saved', description: 'Role permissions have been updated successfully.' })
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    // Reset to defaults
    const defaults: Record<UserRole, Permission[]> = {
      super_admin: permissionGroups.flatMap(g => g.permissions.map(p => p.key)),
      owner: [
        'dashboard:view',
        'properties:create', 'properties:read', 'properties:update', 'properties:delete',
        'rooms:create', 'rooms:read', 'rooms:update', 'rooms:delete',
        'leads:create', 'leads:read', 'leads:update', 'leads:delete',
        'tenants:create', 'tenants:read', 'tenants:update', 'tenants:delete',
        'payments:create', 'payments:read', 'payments:update', 'payments:delete',
        'complaints:create', 'complaints:read', 'complaints:update', 'complaints:delete',
        'staff:create', 'staff:read', 'staff:update', 'staff:delete',
        'expenses:create', 'expenses:read', 'expenses:update', 'expenses:delete',
        'reports:read',
        'notices:create', 'notices:read', 'notices:update', 'notices:delete',
        'visitors:create', 'visitors:read', 'visitors:update', 'visitors:delete',
        'inventory:create', 'inventory:read', 'inventory:update', 'inventory:delete',
        'vendors:create', 'vendors:read', 'vendors:update', 'vendors:delete',
        'purchases:create', 'purchases:read', 'purchases:update', 'purchases:delete',
        'kitchen:create', 'kitchen:read', 'kitchen:update', 'kitchen:delete',
        'mess:create', 'mess:read', 'mess:update', 'mess:delete',
        'assets:create', 'assets:read', 'assets:update', 'assets:delete',
        'settings:read', 'settings:update',
        'users:read',
        'role-management:read',
      ],
      manager: [
        'dashboard:view',
        'properties:read',
        'rooms:create', 'rooms:read', 'rooms:update',
        'leads:create', 'leads:read', 'leads:update',
        'tenants:create', 'tenants:read', 'tenants:update',
        'payments:create', 'payments:read', 'payments:update',
        'complaints:create', 'complaints:read', 'complaints:update',
        'staff:read',
        'expenses:create', 'expenses:read', 'expenses:update',
        'reports:read',
        'notices:create', 'notices:read', 'notices:update',
        'visitors:create', 'visitors:read', 'visitors:update',
        'inventory:create', 'inventory:read', 'inventory:update',
        'vendors:read',
        'purchases:create', 'purchases:read', 'purchases:update',
        'kitchen:create', 'kitchen:read', 'kitchen:update',
        'mess:create', 'mess:read', 'mess:update',
        'assets:create', 'assets:read', 'assets:update',
      ],
      staff: [
        'dashboard:view',
        'rooms:read',
        'tenants:read',
        'complaints:create', 'complaints:read',
        'visitors:create', 'visitors:read',
        'inventory:read',
        'kitchen:read',
        'mess:read',
        'assets:read',
      ],
      tenant: [
        'dashboard:view',
        'payments:read',
        'complaints:create', 'complaints:read',
        'notices:read',
        'visitors:create', 'visitors:read',
        'mess:read',
      ],
    }
    setCustomPermissions(defaults)
    setHasChanges(true)
    toast({ title: 'Reset to Defaults', description: 'Permissions have been reset to default values.' })
  }

  if (!canView) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Lock className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-slate-600">Access Denied</h2>
          <p className="text-sm text-slate-500">You do not have permission to view role management.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-500" />
            Role & Access Management
          </h1>
          <p className="text-muted-foreground text-sm">Configure role-based access control for all system modules</p>
        </div>
        {canManage && (
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleReset}>
              Reset to Defaults
            </Button>
            <Button onClick={handleSave} disabled={saving || !hasChanges} className="bg-emerald-600 hover:bg-emerald-700">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Save Changes
            </Button>
          </div>
        )}
      </div>

      {/* Role Overview Cards */}
      <div className="grid grid-cols-5 gap-4">
        {(Object.keys(roleLabels) as UserRole[]).map((role) => {
          const counts = getPermissionCount(role)
          const isSelected = selectedRole === role
          return (
            <Card
              key={role}
              className={`cursor-pointer transition-all ${isSelected ? 'ring-2 ring-emerald-500 shadow-lg' : 'hover:shadow-md'}`}
              onClick={() => setSelectedRole(role)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className={`w-4 h-4 ${role === 'super_admin' ? 'text-red-400' : role === 'owner' ? 'text-purple-400' : role === 'manager' ? 'text-blue-400' : role === 'staff' ? 'text-amber-400' : 'text-emerald-400'}`} />
                  <span className="font-semibold text-sm">{roleLabels[role]}</span>
                </div>
                <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{roleDescriptions[role]}</p>
                <div className="flex items-center justify-between">
                  <Badge className={roleColors[role]}>
                    {counts.granted}/{counts.total}
                  </Badge>
                  <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all"
                      style={{ width: `${counts.total > 0 ? (counts.granted / counts.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Permission Matrix */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Permission Matrix
              </CardTitle>
              <CardDescription>
                {selectedRole === 'super_admin'
                  ? 'Super Admin has all permissions and cannot be modified'
                  : `Manage permissions for ${roleLabels[selectedRole]} role`}
              </CardDescription>
            </div>
            <Badge className={roleColors[selectedRole]}>
              {roleLabels[selectedRole]}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-48 sticky left-0 bg-white z-10">Module</TableHead>
                  <TableHead className="text-center w-20">Create</TableHead>
                  <TableHead className="text-center w-20">Read</TableHead>
                  <TableHead className="text-center w-20">Update</TableHead>
                  <TableHead className="text-center w-20">Delete</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {permissionGroups.map((group) => {
                  const createPerm = group.permissions.find(p => p.key.endsWith(':create'))
                  const readPerm = group.permissions.find(p => p.key.endsWith(':read'))
                  const updatePerm = group.permissions.find(p => p.key.endsWith(':update'))
                  const deletePerm = group.permissions.find(p => p.key.endsWith(':delete'))

                  // Skip non-CRUD permissions in this view
                  if (!createPerm && !readPerm && !updatePerm && !deletePerm) {
                    // For non-CRUD groups like dashboard, reports
                    const perm = group.permissions[0]
                    if (!perm) return null
                    return (
                      <TableRow key={group.label}>
                        <TableCell className="font-medium sticky left-0 bg-white z-10">
                          {group.label}
                        </TableCell>
                        <TableCell colSpan={3} />
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center">
                            <Switch
                              checked={hasPerm(selectedRole, perm.key)}
                              onCheckedChange={() => togglePermission(selectedRole, perm.key)}
                              disabled={selectedRole === 'super_admin' || !canManage}
                              className="data-[state=checked]:bg-emerald-500"
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  }

                  return (
                    <TableRow key={group.label}>
                      <TableCell className="font-medium sticky left-0 bg-white z-10">
                        {group.label}
                      </TableCell>
                      {[
                        { perm: createPerm, action: 'create' },
                        { perm: readPerm, action: 'read' },
                        { perm: updatePerm, action: 'update' },
                        { perm: deletePerm, action: 'delete' },
                      ].map(({ perm, action }) => (
                        <TableCell key={action} className="text-center">
                          {perm ? (
                            <div className="flex items-center justify-center">
                              <Switch
                                checked={hasPerm(selectedRole, perm.key)}
                                onCheckedChange={() => togglePermission(selectedRole, perm.key)}
                                disabled={selectedRole === 'super_admin' || !canManage}
                                className="data-[state=checked]:bg-emerald-500"
                              />
                            </div>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Role Description */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Role Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {(Object.keys(roleLabels) as UserRole[]).map((role) => (
              <div key={role} className="flex items-start gap-4 p-4 rounded-lg bg-slate-50">
                <Badge className={`${roleColors[role]} mt-0.5`}>
                  <Shield className="w-3 h-3 mr-1" />
                  {roleLabels[role]}
                </Badge>
                <div className="flex-1">
                  <p className="text-sm text-slate-600">{roleDescriptions[role]}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-muted-foreground">Permissions:</span>
                    <div className="flex flex-wrap gap-1">
                      {(customPermissions[role] || []).slice(0, 8).map(p => (
                        <Badge key={p} variant="secondary" className="text-[10px] px-1.5 py-0">
                          {p}
                        </Badge>
                      ))}
                      {(customPermissions[role] || []).length > 8 && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          +{(customPermissions[role] || []).length - 8} more
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold">{getPermissionCount(role).granted}</span>
                  <span className="text-xs text-muted-foreground">/{getPermissionCount(role).total}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
