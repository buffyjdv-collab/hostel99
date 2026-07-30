'use client'

import { useEffect, useState, useMemo } from 'react'
import { useAppStore, hasPermission } from '@/lib/store'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
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
  Users,
  UserCheck,
  UserX,
  IndianRupee,
  UserPlus,
  Search,
  Eye,
  MoreVertical,
  Loader2,
  Phone,
  Mail,
  Building2,
  Calendar,
  Clock,
  MapPin,
  Filter,
  LayoutGrid,
  LayoutList,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  ShieldCheck,
  Sparkles,
  Paintbrush,
  Wrench,
  ChefHat,
  Briefcase,
  Trash2,
  Pencil,
} from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────────

type StaffRole = 'caretaker' | 'housekeeping' | 'maintenance' | 'security' | 'cook' | 'manager'
type StaffStatus = 'active' | 'inactive' | 'on_leave'
type AttendanceStatus = 'present' | 'absent' | 'half_day' | 'leave'
type SalaryStatus = 'paid' | 'pending' | 'processing'

interface StaffData {
  id: string
  userId?: string
  user?: { id: string; name: string; email: string; phone: string; avatar?: string } | null
  name: string
  phone: string
  role: StaffRole
  propertyId: string
  property: { id: string; name: string; address?: string }
  salary: number
  joinDate?: string | null
  status: StaffStatus
  aadhaarNumber?: string | null
  address?: string | null
  attendance?: AttendanceData[]
  salaryPayments?: SalaryPaymentData[]
  createdAt: string
  updatedAt: string
}

interface AttendanceData {
  id: string
  staffId: string
  date: string
  checkIn?: string | null
  checkOut?: string | null
  status: AttendanceStatus
  notes?: string | null
}

interface SalaryPaymentData {
  id: string
  staffId: string
  amount: number
  month: number
  year: number
  status: SalaryStatus
  paidDate?: string | null
  notes?: string | null
}

interface PropertyInfo {
  id: string
  name: string
}

interface StaffFormData {
  name: string
  phone: string
  email: string
  role: StaffRole
  propertyId: string
  salary: string
  joinDate: string
  aadhaarNumber: string
  address: string
}

// ── Constants ────────────────────────────────────────────────────────────────

const ROLE_CONFIG: Record<StaffRole, { label: string; bgClass: string; textClass: string; icon: typeof ShieldCheck }> = {
  caretaker: { label: 'Caretaker', bgClass: 'bg-emerald-100 dark:bg-emerald-950/50', textClass: 'text-emerald-700 dark:text-emerald-300', icon: ShieldCheck },
  housekeeping: { label: 'Housekeeping', bgClass: 'bg-blue-100 dark:bg-blue-950/50', textClass: 'text-blue-700 dark:text-blue-300', icon: Paintbrush },
  maintenance: { label: 'Maintenance', bgClass: 'bg-orange-100 dark:bg-orange-950/50', textClass: 'text-orange-700 dark:text-orange-300', icon: Wrench },
  security: { label: 'Security', bgClass: 'bg-red-100 dark:bg-red-950/50', textClass: 'text-red-700 dark:text-red-300', icon: ShieldCheck },
  cook: { label: 'Cook', bgClass: 'bg-purple-100 dark:bg-purple-950/50', textClass: 'text-purple-700 dark:text-purple-300', icon: ChefHat },
  manager: { label: 'Manager', bgClass: 'bg-teal-100 dark:bg-teal-950/50', textClass: 'text-teal-700 dark:text-teal-300', icon: Briefcase },
}

const STATUS_CONFIG: Record<StaffStatus, { label: string; bgClass: string; textClass: string; dotClass: string }> = {
  active: { label: 'Active', bgClass: 'bg-emerald-100 dark:bg-emerald-950/50', textClass: 'text-emerald-700 dark:text-emerald-300', dotClass: 'bg-emerald-500' },
  inactive: { label: 'Inactive', bgClass: 'bg-gray-100 dark:bg-gray-950/50', textClass: 'text-gray-700 dark:text-gray-300', dotClass: 'bg-gray-500' },
  on_leave: { label: 'On Leave', bgClass: 'bg-amber-100 dark:bg-amber-950/50', textClass: 'text-amber-700 dark:text-amber-300', dotClass: 'bg-amber-500' },
}

const ATTENDANCE_COLORS: Record<AttendanceStatus, string> = {
  present: 'bg-emerald-500',
  absent: 'bg-red-500',
  half_day: 'bg-yellow-500',
  leave: 'bg-gray-400',
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const EMPTY_FORM: StaffFormData = {
  name: '',
  phone: '',
  email: '',
  role: 'caretaker',
  propertyId: '',
  salary: '',
  joinDate: '',
  aadhaarNumber: '',
  address: '',
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function getAttendancePercentage(attendance: AttendanceData[]): number {
  if (!attendance || attendance.length === 0) return 0
  const presentDays = attendance.filter(a => a.status === 'present').length
  const halfDays = attendance.filter(a => a.status === 'half_day').length * 0.5
  return Math.round(((presentDays + halfDays) / attendance.length) * 100)
}

// ── Skeleton Loaders ─────────────────────────────────────────────────────────

function StatsCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
          </div>
          <Skeleton className="h-10 w-10 rounded-lg" />
        </div>
      </CardContent>
    </Card>
  )
}

function CardGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-3 w-full" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function TableSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-10 w-full rounded" />
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full rounded" />
      ))}
    </div>
  )
}

// ── Stats Card ───────────────────────────────────────────────────────────────

interface StatsCardProps {
  title: string
  value: string
  icon: React.ElementType
  iconBg?: string
  iconColor?: string
  subtitle?: string
}

function StatsCard({ title, value, icon: Icon, iconBg = 'bg-emerald-50 dark:bg-emerald-950/50', iconColor = 'text-emerald-600 dark:text-emerald-400', subtitle }: StatsCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground font-medium">{title}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${iconBg}`}>
            <Icon className={`w-5 h-5 ${iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ── Staff Detail Dialog ──────────────────────────────────────────────────────

function StaffDetailDialog({
  staff,
  open,
  onClose,
}: {
  staff: StaffData | null
  open: boolean
  onClose: () => void
}) {
  if (!staff) return null

  const roleCfg = ROLE_CONFIG[staff.role]
  const statusCfg = STATUS_CONFIG[staff.status]
  const attendancePct = getAttendancePercentage(staff.attendance || [])

  // Build attendance calendar for current month
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const attendanceMap: Record<string, AttendanceStatus> = {}
  ;(staff.attendance || []).forEach(a => {
    const d = new Date(a.date)
    if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
      attendanceMap[d.getDate()] = a.status
    }
  })

  const presentCount = (staff.attendance || []).filter(a => a.status === 'present').length
  const absentCount = (staff.attendance || []).filter(a => a.status === 'absent').length
  const halfDayCount = (staff.attendance || []).filter(a => a.status === 'half_day').length
  const leaveCount = (staff.attendance || []).filter(a => a.status === 'leave').length

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center">
              <Users className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <div>{staff.name}</div>
              <div className="text-sm font-normal text-slate-500 flex items-center gap-2">
                <Badge variant="secondary" className={`${roleCfg.bgClass} ${roleCfg.textClass} text-xs`}>
                  {roleCfg.label}
                </Badge>
                <Badge variant="secondary" className={`${statusCfg.bgClass} ${statusCfg.textClass} text-xs`}>
                  <div className={`h-1.5 w-1.5 rounded-full ${statusCfg.dotClass} mr-1`} />
                  {statusCfg.label}
                </Badge>
              </div>
            </div>
          </DialogTitle>
          <DialogDescription>Staff member details and management</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="profile" className="mt-2">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="salary">Salary</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-500">Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Name</span>
                    <span className="font-medium">{staff.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Phone</span>
                    <span className="font-medium">{staff.phone}</span>
                  </div>
                  {staff.user?.email && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Email</span>
                      <span className="font-medium">{staff.user.email}</span>
                    </div>
                  )}
                  {staff.aadhaarNumber && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Aadhaar</span>
                      <span className="font-medium">XXXX-XXXX-{staff.aadhaarNumber.slice(-4)}</span>
                    </div>
                  )}
                  {staff.address && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Address</span>
                      <span className="font-medium text-right max-w-[200px]">{staff.address}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-500">Work Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Role</span>
                    <Badge variant="secondary" className={`${roleCfg.bgClass} ${roleCfg.textClass} text-xs`}>
                      {roleCfg.label}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Property</span>
                    <span className="font-medium">{staff.property?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Salary</span>
                    <span className="font-medium">{formatCurrency(staff.salary)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Join Date</span>
                    <span className="font-medium">{formatDate(staff.joinDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Status</span>
                    <Badge variant="secondary" className={`${statusCfg.bgClass} ${statusCfg.textClass} text-xs`}>
                      <div className={`h-1.5 w-1.5 rounded-full ${statusCfg.dotClass} mr-1`} />
                      {statusCfg.label}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Attendance</span>
                    <span className="font-medium">{attendancePct}%</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Attendance Tab */}
          <TabsContent value="attendance" className="space-y-4 mt-4">
            {/* Monthly Summary */}
            <div className="grid grid-cols-4 gap-3">
              <Card>
                <CardContent className="p-3 text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <div className="h-3 w-3 rounded-full bg-emerald-500" />
                    <span className="text-xs text-muted-foreground">Present</span>
                  </div>
                  <p className="text-lg font-bold">{presentCount}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <div className="h-3 w-3 rounded-full bg-red-500" />
                    <span className="text-xs text-muted-foreground">Absent</span>
                  </div>
                  <p className="text-lg font-bold">{absentCount}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <div className="h-3 w-3 rounded-full bg-yellow-500" />
                    <span className="text-xs text-muted-foreground">Half Day</span>
                  </div>
                  <p className="text-lg font-bold">{halfDayCount}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <div className="h-3 w-3 rounded-full bg-gray-400" />
                    <span className="text-xs text-muted-foreground">Leave</span>
                  </div>
                  <p className="text-lg font-bold">{leaveCount}</p>
                </CardContent>
              </Card>
            </div>

            {/* Calendar View */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  {MONTH_NAMES[currentMonth]} {currentYear}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-1">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                    <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">
                      {d}
                    </div>
                  ))}
                  {/* Empty cells for days before the 1st */}
                  {Array.from({ length: new Date(currentYear, currentMonth, 1).getDay() }).map((_, i) => (
                    <div key={`empty-${i}`} />
                  ))}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1
                    const status = attendanceMap[day]
                    const isToday = day === now.getDate() && currentMonth === now.getMonth()
                    const isFuture = new Date(currentYear, currentMonth, day) > now
                    return (
                      <div
                        key={day}
                        className={`aspect-square rounded-md flex items-center justify-center text-xs relative
                          ${isToday ? 'ring-2 ring-emerald-500' : ''}
                          ${isFuture ? 'text-muted-foreground/40' : ''}
                        `}
                        title={status ? status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ') : 'No record'}
                      >
                        {day}
                        {status && !isFuture && (
                          <div className={`absolute bottom-0.5 h-1 w-1 rounded-full ${ATTENDANCE_COLORS[status]}`} />
                        )}
                      </div>
                    )
                  })}
                </div>
                <div className="flex items-center gap-4 mt-3 pt-3 border-t">
                  {Object.entries(ATTENDANCE_COLORS).map(([status, color]) => (
                    <div key={status} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <div className={`h-2.5 w-2.5 rounded-full ${color}`} />
                      {status === 'half_day' ? 'Half Day' : status.charAt(0).toUpperCase() + status.slice(1)}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Salary Tab */}
          <TabsContent value="salary" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Salary History</CardTitle>
                <CardDescription>
                  Current salary: {formatCurrency(staff.salary)}/month
                </CardDescription>
              </CardHeader>
              <CardContent>
                {staff.salaryPayments && staff.salaryPayments.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Month</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Paid Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {staff.salaryPayments.map(sp => (
                        <TableRow key={sp.id}>
                          <TableCell>{MONTH_NAMES[sp.month - 1]} {sp.year}</TableCell>
                          <TableCell className="font-medium">{formatCurrency(sp.amount)}</TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={
                                sp.status === 'paid'
                                  ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                                  : sp.status === 'pending'
                                  ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300'
                                  : 'bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300'
                              }
                            >
                              {sp.status.charAt(0).toUpperCase() + sp.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(sp.paidDate)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <IndianRupee className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No salary payment records found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

// ── Add Staff Dialog ─────────────────────────────────────────────────────────

function AddStaffDialog({
  open,
  onClose,
  properties,
  onSubmit,
  submitting,
}: {
  open: boolean
  onClose: () => void
  properties: PropertyInfo[]
  onSubmit: (data: StaffFormData) => Promise<void>
  submitting: boolean
}) {
  const [form, setForm] = useState<StaffFormData>(EMPTY_FORM)

  const handleSubmit = async () => {
    await onSubmit(form)
    setForm(EMPTY_FORM)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-emerald-600" />
            Add Staff Member
          </DialogTitle>
          <DialogDescription>Add a new staff member to your property</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Personal Information */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
              <Users className="h-4 w-4 text-emerald-600" />
              Personal Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="staff-name">Full Name *</Label>
                <Input
                  id="staff-name"
                  placeholder="Enter full name"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="staff-phone">Phone *</Label>
                <Input
                  id="staff-phone"
                  placeholder="Enter phone number"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="staff-email">Email</Label>
                <Input
                  id="staff-email"
                  type="email"
                  placeholder="Enter email address"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="staff-aadhaar">Aadhaar Number</Label>
                <Input
                  id="staff-aadhaar"
                  placeholder="XXXX XXXX XXXX"
                  value={form.aadhaarNumber}
                  onChange={e => setForm(f => ({ ...f, aadhaarNumber: e.target.value }))}
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="staff-address">Address</Label>
                <Textarea
                  id="staff-address"
                  placeholder="Enter full address"
                  value={form.address}
                  onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* Work Information */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-emerald-600" />
              Work Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="staff-role">Role *</Label>
                <Select value={form.role} onValueChange={v => setForm(f => ({ ...f, role: v as StaffRole }))}>
                  <SelectTrigger id="staff-role">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ROLE_CONFIG).map(([key, cfg]) => (
                      <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="staff-property">Property *</Label>
                <Select value={form.propertyId} onValueChange={v => setForm(f => ({ ...f, propertyId: v }))}>
                  <SelectTrigger id="staff-property">
                    <SelectValue placeholder="Select property" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="staff-salary">Monthly Salary</Label>
                <Input
                  id="staff-salary"
                  type="number"
                  placeholder="Enter salary amount"
                  value={form.salary}
                  onChange={e => setForm(f => ({ ...f, salary: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="staff-joindate">Join Date</Label>
                <Input
                  id="staff-joindate"
                  type="date"
                  value={form.joinDate}
                  onChange={e => setForm(f => ({ ...f, joinDate: e.target.value }))}
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !form.name || !form.phone || !form.propertyId}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Add Staff
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Mark Attendance Dialog ───────────────────────────────────────────────────

function MarkAttendanceDialog({
  open,
  onClose,
  staffList,
  onSubmit,
  submitting,
}: {
  open: boolean
  onClose: () => void
  staffList: StaffData[]
  onSubmit: (attendance: Record<string, AttendanceStatus>) => Promise<void>
  submitting: boolean
}) {
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>(() => {
    const initial: Record<string, AttendanceStatus> = {}
    staffList.forEach(s => {
      initial[s.id] = 'present'
    })
    return initial
  })

  const handleToggle = (staffId: string, checked: boolean) => {
    setAttendance(prev => ({ ...prev, [staffId]: checked ? 'present' : 'absent' }))
  }

  const handleSubmit = async () => {
    await onSubmit(attendance)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-emerald-600" />
            Mark Attendance
          </DialogTitle>
          <DialogDescription>
            Mark today&apos;s attendance for all staff members
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[400px] pr-2">
          <div className="space-y-3">
            {staffList.map(staff => {
              const roleCfg = ROLE_CONFIG[staff.role]
              const status = attendance[staff.id] || 'present'
              const isPresent = status === 'present'
              return (
                <div key={staff.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center">
                      <Users className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{staff.name}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className={`${roleCfg.bgClass} ${roleCfg.textClass} text-[10px] px-1.5 py-0`}>
                          {roleCfg.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{staff.property?.name}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={isPresent}
                      onCheckedChange={checked => handleToggle(staff.id, !!checked)}
                    />
                    <span className={`text-xs font-medium ${isPresent ? 'text-emerald-600' : 'text-red-500'}`}>
                      {isPresent ? 'Present' : 'Absent'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Attendance
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Main Component ───────────────────────────────────────────────────────────

export function StaffPage() {
  const { currentUser } = useAppStore()
  const role = currentUser?.role || ''
  const canCreate = hasPermission(role, 'staff:create')
  const canUpdate = hasPermission(role, 'staff:update')
  const canDelete = hasPermission(role, 'staff:delete')

  // Data
  const [staff, setStaff] = useState<StaffData[]>([])
  const [properties, setProperties] = useState<PropertyInfo[]>([])
  const [loading, setLoading] = useState(true)

  // UI State
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [propertyFilter, setPropertyFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Dialogs
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [showAttendanceDialog, setShowAttendanceDialog] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState<StaffData | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // ── Data Fetching ──────────────────────────────────────────────────────────

  const fetchStaff = async () => {
    try {
      const res = await fetch('/api/staff')
      if (res.ok) {
        const data = await res.json()
        setStaff(data)
      }
    } catch (err) {
      console.error('Failed to fetch staff:', err)
    }
  }

  const fetchProperties = async () => {
    try {
      const res = await fetch('/api/properties')
      if (res.ok) {
        const data = await res.json()
        setProperties(data.map((p: { id: string; name: string }) => ({ id: p.id, name: p.name })))
      }
    } catch (err) {
      console.error('Failed to fetch properties:', err)
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchStaff(), fetchProperties()])
      setLoading(false)
    }
    loadData()
  }, [])

  // ── Computed Values ────────────────────────────────────────────────────────

  const filteredStaff = useMemo(() => {
    return staff.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.phone.includes(searchQuery)
      const matchesRole = roleFilter === 'all' || s.role === roleFilter
      const matchesProperty = propertyFilter === 'all' || s.propertyId === propertyFilter
      const matchesStatus = statusFilter === 'all' || s.status === statusFilter
      return matchesSearch && matchesRole && matchesProperty && matchesStatus
    })
  }, [staff, searchQuery, roleFilter, propertyFilter, statusFilter])

  const stats = useMemo(() => {
    const total = staff.length
    const active = staff.filter(s => s.status === 'active').length
    const onLeave = staff.filter(s => s.status === 'on_leave').length
    const salaryCost = staff.reduce((sum, s) => sum + s.salary, 0)
    return { total, active, onLeave, salaryCost }
  }, [staff])

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleAddStaff = async (formData: StaffFormData) => {
    setSubmitting(true)
    try {
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          role: formData.role,
          propertyId: formData.propertyId,
          salary: formData.salary,
          joinDate: formData.joinDate || undefined,
          aadhaarNumber: formData.aadhaarNumber || undefined,
          address: formData.address || undefined,
          status: 'active',
        }),
      })

      if (res.ok) {
        setShowAddDialog(false)
        await fetchStaff()
      }
    } catch (err) {
      console.error('Failed to add staff:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleMarkAttendance = async (attendance: Record<string, AttendanceStatus>) => {
    setSubmitting(true)
    try {
      // In a real app, this would POST to /api/staff/attendance
      console.log('Marking attendance:', attendance)
      setShowAttendanceDialog(false)
      await fetchStaff()
    } catch (err) {
      console.error('Failed to mark attendance:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleViewStaff = (s: StaffData) => {
    setSelectedStaff(s)
    setShowDetailDialog(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this staff member?')) return
    try {
      const res = await fetch(`/api/staff/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setStaff((prev) => prev.filter((s) => s.id !== id))
      }
    } catch (error) {
      console.error('Failed to delete staff member:', error)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <StatsCardSkeleton key={i} />)}
        </div>
        <CardGridSkeleton />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-600" />
            Staff Management
          </h1>
          <p className="text-muted-foreground mt-1">Manage staff members, attendance, and salary payments</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowAttendanceDialog(true)}>
            <Calendar className="w-4 h-4 mr-2" />
            Mark Attendance
          </Button>
          {canCreate && (
          <Button onClick={() => setShowAddDialog(true)} className="bg-emerald-600 hover:bg-emerald-700">
            <UserPlus className="w-4 h-4 mr-2" />
            Add Staff
          </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Staff"
          value={String(stats.total)}
          icon={Users}
          iconBg="bg-emerald-50 dark:bg-emerald-950/50"
          iconColor="text-emerald-600 dark:text-emerald-400"
        />
        <StatsCard
          title="Active"
          value={String(stats.active)}
          icon={UserCheck}
          iconBg="bg-teal-50 dark:bg-teal-950/50"
          iconColor="text-teal-600 dark:text-teal-400"
        />
        <StatsCard
          title="On Leave"
          value={String(stats.onLeave)}
          icon={UserX}
          iconBg="bg-amber-50 dark:bg-amber-950/50"
          iconColor="text-amber-600 dark:text-amber-400"
        />
        <StatsCard
          title="Monthly Salary Cost"
          value={formatCurrency(stats.salaryCost)}
          icon={IndianRupee}
          iconBg="bg-blue-50 dark:bg-blue-950/50"
          iconColor="text-blue-600 dark:text-blue-400"
          subtitle="All staff combined"
        />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or phone..."
                className="pl-9"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Role" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {Object.entries(ROLE_CONFIG).map(([key, cfg]) => (
                  <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={propertyFilter} onValueChange={setPropertyFilter}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Property" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Properties</SelectItem>
                {properties.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                  <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center border rounded-md">
              <Button
                variant={viewMode === 'cards' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('cards')}
                className="rounded-r-none"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
                className="rounded-l-none"
              >
                <LayoutList className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Staff List */}
      {filteredStaff.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-1">No staff members found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || roleFilter !== 'all' || propertyFilter !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your filters or search query'
                : 'Add your first staff member to get started'}
            </p>
            {canCreate && (
            <Button onClick={() => setShowAddDialog(true)} className="bg-emerald-600 hover:bg-emerald-700">
              <UserPlus className="w-4 h-4 mr-2" />
              Add Staff
            </Button>
            )}
          </CardContent>
        </Card>
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStaff.map(s => {
            const roleCfg = ROLE_CONFIG[s.role]
            const statusCfg = STATUS_CONFIG[s.status]
            const attendancePct = getAttendancePercentage(s.attendance || [])
            return (
              <Card key={s.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleViewStaff(s)}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        {s.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-sm truncate">{s.name}</h3>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={e => { e.stopPropagation(); handleViewStaff(s) }}>
                              <Eye className="h-4 w-4 mr-2" /> View Details
                            </DropdownMenuItem>
                            {canUpdate && (
                            <DropdownMenuItem onClick={e => { e.stopPropagation(); handleViewStaff(s) }}>
                              <Pencil className="h-4 w-4 mr-2" /> Edit
                            </DropdownMenuItem>
                            )}
                            {canDelete && (
                            <DropdownMenuItem className="text-red-600" onClick={e => { e.stopPropagation(); handleDelete(s.id) }}>
                              <Trash2 className="h-4 w-4 mr-2" /> Delete
                            </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {s.phone}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                        <Building2 className="h-3 w-3" />
                        {s.property?.name}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className={`${roleCfg.bgClass} ${roleCfg.textClass} text-[10px] px-1.5 py-0`}>
                          {roleCfg.label}
                        </Badge>
                        <Badge variant="secondary" className={`${statusCfg.bgClass} ${statusCfg.textClass} text-[10px] px-1.5 py-0`}>
                          <div className={`h-1.5 w-1.5 rounded-full ${statusCfg.dotClass} mr-1`} />
                          {statusCfg.label}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between mt-3 pt-2 border-t text-xs">
                        <span className="text-muted-foreground">
                          Salary: <span className="font-medium text-foreground">{formatCurrency(s.salary)}</span>
                        </span>
                        <span className="text-muted-foreground">
                          Attendance: <span className={`font-medium ${attendancePct >= 75 ? 'text-emerald-600' : attendancePct >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                            {attendancePct}%
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Salary</TableHead>
                  <TableHead>Join Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Attendance</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStaff.map(s => {
                  const roleCfg = ROLE_CONFIG[s.role]
                  const statusCfg = STATUS_CONFIG[s.status]
                  const attendancePct = getAttendancePercentage(s.attendance || [])
                  return (
                    <TableRow key={s.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleViewStaff(s)}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                              {s.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          {s.name}
                        </div>
                      </TableCell>
                      <TableCell>{s.phone}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={`${roleCfg.bgClass} ${roleCfg.textClass} text-xs`}>
                          {roleCfg.label}
                        </Badge>
                      </TableCell>
                      <TableCell>{s.property?.name}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(s.salary)}</TableCell>
                      <TableCell>{formatDate(s.joinDate)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={`${statusCfg.bgClass} ${statusCfg.textClass} text-xs`}>
                          <div className={`h-1.5 w-1.5 rounded-full ${statusCfg.dotClass} mr-1`} />
                          {statusCfg.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className={`font-medium ${attendancePct >= 75 ? 'text-emerald-600' : attendancePct >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                          {attendancePct}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={e => { e.stopPropagation(); handleViewStaff(s) }}>
                              <Eye className="h-4 w-4 mr-2" /> View Details
                            </DropdownMenuItem>
                            {canUpdate && (
                            <DropdownMenuItem onClick={e => { e.stopPropagation(); handleViewStaff(s) }}>
                              <Pencil className="h-4 w-4 mr-2" /> Edit
                            </DropdownMenuItem>
                            )}
                            {canDelete && (
                            <DropdownMenuItem className="text-red-600" onClick={e => { e.stopPropagation(); handleDelete(s.id) }}>
                              <Trash2 className="h-4 w-4 mr-2" /> Delete
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
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <AddStaffDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        properties={properties}
        onSubmit={handleAddStaff}
        submitting={submitting}
      />

      <StaffDetailDialog
        staff={selectedStaff}
        open={showDetailDialog}
        onClose={() => { setShowDetailDialog(false); setSelectedStaff(null) }}
      />

      <MarkAttendanceDialog
        open={showAttendanceDialog}
        onClose={() => setShowAttendanceDialog(false)}
        staffList={staff.filter(s => s.status === 'active')}
        onSubmit={handleMarkAttendance}
        submitting={submitting}
      />
    </div>
  )
}
