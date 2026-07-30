'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  Settings,
  User,
  CreditCard,
  Users,
  Database,
  Shield,
  Crown,
  Gem,
  Star,
  Building2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Mail,
  Phone,
  Pencil,
  Plus,
  Server,
  HardDrive,
  Activity,
  RefreshCw,
  Save,
  Zap,
  ChevronRight,
} from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────────

interface UserInfo {
  id: string
  name: string
  email: string
  phone?: string
  role: string
  isActive?: boolean
  lastLogin?: string
  avatar?: string
}

interface PlanInfo {
  key: string
  name: string
  price: number
  period: string
  features: string[]
  highlighted?: boolean
  current?: boolean
  icon: React.ReactNode
  color: string
}

// ── Constants ────────────────────────────────────────────────────────────────

const PLANS: PlanInfo[] = [
  {
    key: 'basic',
    name: 'Basic',
    price: 999,
    period: '/month',
    icon: <Zap className="h-5 w-5" />,
    color: 'text-gray-600',
    features: [
      'Up to 1 property',
      'Up to 50 beds',
      'Basic tenant management',
      'Payment tracking',
      'Email support',
    ],
  },
  {
    key: 'premium',
    name: 'Premium',
    price: 2499,
    period: '/month',
    icon: <Star className="h-5 w-5" />,
    color: 'text-emerald-600',
    highlighted: true,
    current: true,
    features: [
      'Up to 5 properties',
      'Up to 500 beds',
      'Advanced tenant management',
      'Lead CRM',
      'Payment & expense tracking',
      'Complaint management',
      'Staff management',
      'WhatsApp integration',
      'Priority support',
    ],
  },
  {
    key: 'gold',
    name: 'Gold',
    price: 4999,
    period: '/month',
    icon: <Crown className="h-5 w-5" />,
    color: 'text-amber-600',
    features: [
      'Up to 20 properties',
      'Unlimited beds',
      'All Premium features',
      'Advanced analytics',
      'Custom reports',
      'Multi-user access',
      'API access',
      'SMS & push notifications',
      'Dedicated account manager',
    ],
  },
  {
    key: 'white_label',
    name: 'White-Label',
    price: 9999,
    period: '/month',
    icon: <Gem className="h-5 w-5" />,
    color: 'text-violet-600',
    features: [
      'Unlimited properties',
      'Unlimited beds',
      'All Gold features',
      'Custom branding',
      'Custom domain',
      'White-label app',
      'Custom integrations',
      'SLA guarantee',
      '24/7 phone support',
      'On-premise deployment option',
    ],
  },
]

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  owner: 'Owner',
  manager: 'Manager',
  staff: 'Staff',
  tenant: 'Tenant',
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)
}

function formatDate(date: string | Date | null | undefined) {
  if (!date) return 'Never'
  return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatDateTime(date: string | Date | null | undefined) {
  if (!date) return 'Never'
  return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// ── Component ────────────────────────────────────────────────────────────────

export function SettingsPage() {
  const { currentUser } = useAppStore()
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<UserInfo[]>([])
  const [seeding, setSeeding] = useState(false)
  const [seedResult, setSeedResult] = useState<{ success: boolean; message: string } | null>(null)

  // Profile edit state
  const [profileEditing, setProfileEditing] = useState(false)
  const [profileForm, setProfileForm] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    phone: '',
  })
  const [profileSaving, setProfileSaving] = useState(false)

  // Add user dialog
  const [addUserOpen, setAddUserOpen] = useState(false)
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'manager',
  })
  const [addUserSaving, setAddUserSaving] = useState(false)

  // ── Data Fetching ──────────────────────────────────────────────────────

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/staff')
      if (res.ok) {
        const data = await res.json()
        setUsers(Array.isArray(data) ? data.map((s: { id: string; name: string; phone: string; userId?: string; user?: { id: string; name: string; email: string; phone?: string; role: string; isActive?: boolean; lastLogin?: string } }) => ({
          id: s.user?.id || s.id,
          name: s.user?.name || s.name,
          email: s.user?.email || '',
          phone: s.user?.phone || s.phone,
          role: s.user?.role || 'staff',
          isActive: s.user?.isActive,
          lastLogin: s.user?.lastLogin,
        })) : [])
      }
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    async function init() {
      await fetchUsers()
      setLoading(false)
    }
    init()
  }, [fetchUsers])

  // Populate profile form from currentUser - derive instead of effect
  const _profileFormDefault = currentUser ? {
    name: currentUser.name,
    email: currentUser.email,
    phone: '',
  } : { name: '', email: '', phone: '' }

  // ── Handlers ───────────────────────────────────────────────────────────

  const handleSaveProfile = async () => {
    setProfileSaving(true)
    // Simulate save
    await new Promise((r) => setTimeout(r, 1000))
    setProfileEditing(false)
    setProfileSaving(false)
  }

  const handleSeedData = async () => {
    setSeeding(true)
    setSeedResult(null)
    try {
      const res = await fetch('/api/seed', { method: 'POST' })
      const data = await res.json()
      setSeedResult({
        success: data.success,
        message: data.message || data.error || 'Seed completed',
      })
    } catch (err) {
      setSeedResult({ success: false, message: 'Failed to seed data' })
    }
    setSeeding(false)
  }

  const handleAddUser = async () => {
    if (!userForm.name || !userForm.email) return
    setAddUserSaving(true)
    await new Promise((r) => setTimeout(r, 1000))
    setUsers((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        name: userForm.name,
        email: userForm.email,
        phone: userForm.phone,
        role: userForm.role,
        isActive: true,
        lastLogin: undefined,
      },
    ])
    setAddUserOpen(false)
    setUserForm({ name: '', email: '', phone: '', role: 'manager' })
    setAddUserSaving(false)
  }

  // ── Loading Skeleton ────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-80" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-64 rounded-lg" />
          <Skeleton className="h-64 rounded-lg" />
        </div>
        <Skeleton className="h-[300px] rounded-lg" />
      </div>
    )
  }

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Settings className="h-6 w-6 text-emerald-600" />
          Settings
        </h1>
        <p className="text-muted-foreground mt-1">Manage your account, subscription, and system settings</p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="bg-emerald-50">
          <TabsTrigger value="profile" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
            <User className="h-4 w-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="subscription" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
            <CreditCard className="h-4 w-4 mr-2" />
            Subscription
          </TabsTrigger>
          <TabsTrigger value="users" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
            <Users className="h-4 w-4 mr-2" />
            Users
          </TabsTrigger>
          <TabsTrigger value="system" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
            <Database className="h-4 w-4 mr-2" />
            System
          </TabsTrigger>
        </TabsList>

        {/* ── Profile Tab ─────────────────────────────────────────────────── */}
        <TabsContent value="profile" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Current Profile Card */}
            <Card className="border-emerald-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <User className="h-4 w-4 text-emerald-600" />
                    Current Profile
                  </CardTitle>
                  {!profileEditing && (
                    <Button variant="outline" size="sm" className="gap-1 text-emerald-700 border-emerald-300 hover:bg-emerald-50" onClick={() => setProfileEditing(true)}>
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-xl">
                    {(currentUser?.name || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{currentUser?.name || 'Unknown User'}</h3>
                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 capitalize">
                      <Shield className="h-3 w-3 mr-1" />
                      {ROLE_LABELS[currentUser?.role || ''] || currentUser?.role || 'N/A'}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-3 pt-2 border-t">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-muted-foreground">Email:</span>
                    <span>{currentUser?.email || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-muted-foreground">Phone:</span>
                    <span>{profileForm.phone || 'Not set'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Shield className="h-4 w-4 text-gray-400" />
                    <span className="text-muted-foreground">Role:</span>
                    <span className="capitalize">{ROLE_LABELS[currentUser?.role || ''] || currentUser?.role || 'N/A'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Edit Profile Card */}
            <Card className={profileEditing ? 'border-emerald-300 ring-1 ring-emerald-200' : ''}>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Pencil className="h-4 w-4 text-emerald-600" />
                  Edit Profile
                </CardTitle>
                <CardDescription>Update your personal information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="profile-name">Full Name</Label>
                  <Input
                    id="profile-name"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, name: e.target.value }))}
                    disabled={!profileEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profile-email">Email</Label>
                  <Input
                    id="profile-email"
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, email: e.target.value }))}
                    disabled={!profileEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profile-phone">Phone</Label>
                  <Input
                    id="profile-phone"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, phone: e.target.value }))}
                    disabled={!profileEditing}
                    placeholder="Enter phone number"
                  />
                </div>
                {profileEditing && (
                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={handleSaveProfile}
                      disabled={profileSaving}
                      className="bg-emerald-600 hover:bg-emerald-700 gap-2"
                    >
                      {profileSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Save Changes
                    </Button>
                    <Button variant="outline" onClick={() => setProfileEditing(false)}>
                      Cancel
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Subscription Tab ─────────────────────────────────────────────── */}
        <TabsContent value="subscription" className="space-y-6">
          {/* Current Plan */}
          <Card className="border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                    <Star className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Premium Plan</h3>
                    <p className="text-sm text-emerald-600">Your current subscription</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-emerald-700">{formatCurrency(2499)}</p>
                  <p className="text-sm text-muted-foreground">/month</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-emerald-200">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {['5 Properties', '500 Beds', 'Priority Support', 'WhatsApp Integration'].map((feature) => (
                    <div key={feature} className="flex items-center gap-1.5 text-sm text-emerald-700">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      {feature}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Plan Comparison */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Plan Comparison</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {PLANS.map((plan) => (
                <Card
                  key={plan.key}
                  className={`relative transition-all hover:shadow-md ${
                    plan.highlighted
                      ? 'border-emerald-400 ring-2 ring-emerald-200'
                      : plan.current
                      ? 'border-emerald-300'
                      : ''
                  }`}
                >
                  {plan.highlighted && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-emerald-600 text-white">Popular</Badge>
                    </div>
                  )}
                  {plan.current && (
                    <div className="absolute -top-3 right-3">
                      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Current</Badge>
                    </div>
                  )}
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <span className={plan.color}>{plan.icon}</span>
                      <CardTitle className="text-base">{plan.name}</CardTitle>
                    </div>
                    <div className="mt-2">
                      <span className="text-2xl font-bold">{formatCurrency(plan.price)}</span>
                      <span className="text-sm text-muted-foreground">{plan.period}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <ul className="space-y-2">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      className={`w-full mt-2 ${
                        plan.current
                          ? 'bg-gray-100 text-gray-500 hover:bg-gray-100 cursor-default'
                          : plan.highlighted
                          ? 'bg-emerald-600 hover:bg-emerald-700'
                          : 'bg-white border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                      }`}
                      variant={plan.current ? 'secondary' : plan.highlighted ? 'default' : 'outline'}
                      disabled={plan.current}
                    >
                      {plan.current ? 'Current Plan' : 'Upgrade'}
                      {!plan.current && <ChevronRight className="h-4 w-4 ml-1" />}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* ── Users Tab ───────────────────────────────────────────────────── */}
        <TabsContent value="users" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">User Management</h3>
              <p className="text-sm text-muted-foreground">Manage users and their roles</p>
            </div>
            <Button onClick={() => setAddUserOpen(true)} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-4 w-4" />
              Add User
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        <Users className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-medium text-sm">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium">{user.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              user.role === 'super_admin' ? 'border-red-200 text-red-700 bg-red-50' :
                              user.role === 'owner' ? 'border-purple-200 text-purple-700 bg-purple-50' :
                              user.role === 'manager' ? 'border-emerald-200 text-emerald-700 bg-emerald-50' :
                              user.role === 'staff' ? 'border-blue-200 text-blue-700 bg-blue-50' :
                              'border-gray-200 text-gray-700 bg-gray-50'
                            }
                          >
                            {ROLE_LABELS[user.role] || user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              user.isActive !== false
                                ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                : 'bg-red-100 text-red-700 border-red-200'
                            }
                          >
                            {user.isActive !== false ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDateTime(user.lastLogin)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Role Info */}
          <Card className="border-emerald-200 bg-emerald-50/30">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4 text-emerald-600" />
                Role Permissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {[
                  { role: 'Super Admin', desc: 'Full system access, manage all properties and users', color: 'text-red-600' },
                  { role: 'Owner', desc: 'Manage owned properties, tenants, and finances', color: 'text-purple-600' },
                  { role: 'Manager', desc: 'Manage properties, tenants, leads, and staff', color: 'text-emerald-600' },
                  { role: 'Staff', desc: 'View assigned tasks, update attendance', color: 'text-blue-600' },
                  { role: 'Tenant', desc: 'View own profile, payments, and complaints', color: 'text-gray-600' },
                ].map((r) => (
                  <div key={r.role} className="flex items-start gap-2 p-3 rounded-lg bg-white border">
                    <Shield className={`h-4 w-4 mt-0.5 ${r.color}`} />
                    <div>
                      <p className="font-medium text-sm">{r.role}</p>
                      <p className="text-xs text-muted-foreground">{r.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── System Tab ──────────────────────────────────────────────────── */}
        <TabsContent value="system" className="space-y-6">
          {/* Database Info */}
          <Card className="border-emerald-200">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Database className="h-4 w-4 text-emerald-600" />
                Database Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50/50 border border-emerald-100">
                  <Server className="h-5 w-5 text-emerald-600" />
                  <div>
                    <p className="text-sm font-medium">Database Type</p>
                    <p className="text-xs text-muted-foreground">SQLite (Local)</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50/50 border border-emerald-100">
                  <HardDrive className="h-5 w-5 text-emerald-600" />
                  <div>
                    <p className="text-sm font-medium">Storage</p>
                    <p className="text-xs text-muted-foreground">Local filesystem</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50/50 border border-emerald-100">
                  <Activity className="h-5 w-5 text-emerald-600" />
                  <div>
                    <p className="text-sm font-medium">Status</p>
                    <p className="text-xs text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Operational
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Seed Data */}
          <Card className="border-amber-200">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-amber-600" />
                Seed Database
              </CardTitle>
              <CardDescription>
                Populate the database with sample data for testing and development. This will add sample properties, tenants, payments, and more.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Button
                  onClick={handleSeedData}
                  disabled={seeding}
                  className="gap-2 bg-amber-600 hover:bg-amber-700"
                >
                  {seeding ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  {seeding ? 'Seeding...' : 'Seed Sample Data'}
                </Button>
                {seedResult && (
                  <div className={`flex items-center gap-2 text-sm ${seedResult.success ? 'text-emerald-600' : 'text-red-600'}`}>
                    {seedResult.success ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <AlertCircle className="h-4 w-4" />
                    )}
                    {seedResult.message}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* System Health */}
          <Card className="border-emerald-200">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-600" />
                System Health
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {[
                  { name: 'API Server', status: 'healthy', detail: 'Response time: < 50ms' },
                  { name: 'Database', status: 'healthy', detail: 'Connection: Active' },
                  { name: 'File Storage', status: 'healthy', detail: 'Usage: 12%' },
                  { name: 'Background Jobs', status: 'healthy', detail: 'No pending jobs' },
                ].map((service) => (
                  <div key={service.name} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                      <div>
                        <p className="font-medium text-sm">{service.name}</p>
                        <p className="text-xs text-muted-foreground">{service.detail}</p>
                      </div>
                    </div>
                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                      Healthy
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* App Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Application Info</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 text-sm">
                <div className="flex justify-between p-2 border-b">
                  <span className="text-muted-foreground">Version</span>
                  <span className="font-medium">1.0.0</span>
                </div>
                <div className="flex justify-between p-2 border-b">
                  <span className="text-muted-foreground">Environment</span>
                  <span className="font-medium">Development</span>
                </div>
                <div className="flex justify-between p-2 border-b">
                  <span className="text-muted-foreground">Framework</span>
                  <span className="font-medium">Next.js 16</span>
                </div>
                <div className="flex justify-between p-2 border-b">
                  <span className="text-muted-foreground">Database</span>
                  <span className="font-medium">SQLite / Prisma</span>
                </div>
                <div className="flex justify-between p-2 border-b">
                  <span className="text-muted-foreground">UI Framework</span>
                  <span className="font-medium">shadcn/ui + Tailwind</span>
                </div>
                <div className="flex justify-between p-2 border-b">
                  <span className="text-muted-foreground">Last Deployment</span>
                  <span className="font-medium">{formatDate(new Date())}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add User Dialog */}
      <Dialog open={addUserOpen} onOpenChange={setAddUserOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-emerald-600" />
              Add User
            </DialogTitle>
            <DialogDescription>Add a new user to the system with a specific role.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="user-name">Full Name</Label>
              <Input
                id="user-name"
                placeholder="Enter full name"
                value={userForm.name}
                onChange={(e) => setUserForm((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-email">Email</Label>
              <Input
                id="user-email"
                type="email"
                placeholder="Enter email address"
                value={userForm.email}
                onChange={(e) => setUserForm((prev) => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-phone">Phone</Label>
              <Input
                id="user-phone"
                placeholder="Enter phone number"
                value={userForm.phone}
                onChange={(e) => setUserForm((prev) => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={userForm.role} onValueChange={(v) => setUserForm((prev) => ({ ...prev, role: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner">Owner</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddUserOpen(false)}>Cancel</Button>
            <Button
              onClick={handleAddUser}
              disabled={addUserSaving || !userForm.name || !userForm.email}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {addUserSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
