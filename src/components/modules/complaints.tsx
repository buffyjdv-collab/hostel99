'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart'
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import {
  MessageSquareWarning,
  AlertCircle,
  Clock,
  CheckCircle2,
  Plus,
  Search,
  Eye,
  MoreVertical,
  Loader2,
  UserCircle,
  Wrench,
  Sparkles,
  Volume2,
  Utensils,
  Users,
  HelpCircle,
  Star,
  ArrowUpDown,
  FileText,
  Filter,
  UserCheck,
  CalendarDays,
  XCircle,
  CircleDot,
  Timer,
} from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────────

type ComplaintStatus = 'open' | 'assigned' | 'in_progress' | 'resolved' | 'closed'
type ComplaintPriority = 'low' | 'medium' | 'high' | 'urgent'
type ComplaintCategory = 'maintenance' | 'cleanliness' | 'noise' | 'food' | 'staff' | 'other'

interface TenantInfo {
  id: string
  name: string
  phone?: string
  room?: { id: string; name: string; number: string } | null
}

interface StaffInfo {
  id: string
  name: string
  email?: string
  phone?: string
}

interface CreatorInfo {
  id: string
  name: string
  email?: string
}

interface ComplaintData {
  id: string
  title: string
  description: string
  category: ComplaintCategory
  priority: ComplaintPriority
  status: ComplaintStatus
  rating?: number | null
  resolution?: string | null
  propertyId: string
  tenantId: string
  tenant: TenantInfo
  assignedToId?: string | null
  assignedTo?: StaffInfo | null
  createdById: string
  createdBy?: CreatorInfo | null
  createdAt: string
  updatedAt: string
}

interface PropertyInfo {
  id: string
  name: string
}

interface RaiseComplaintFormData {
  title: string
  description: string
  category: ComplaintCategory
  priority: ComplaintPriority
  tenantId: string
  propertyId: string
}

// ── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<ComplaintStatus, { label: string; bgClass: string; textClass: string; dotClass: string; icon: typeof CircleDot }> = {
  open: { label: 'Open', bgClass: 'bg-blue-100 dark:bg-blue-950/50', textClass: 'text-blue-700 dark:text-blue-300', dotClass: 'bg-blue-500', icon: CircleDot },
  assigned: { label: 'Assigned', bgClass: 'bg-amber-100 dark:bg-amber-950/50', textClass: 'text-amber-700 dark:text-amber-300', dotClass: 'bg-amber-500', icon: UserCheck },
  in_progress: { label: 'In Progress', bgClass: 'bg-orange-100 dark:bg-orange-950/50', textClass: 'text-orange-700 dark:text-orange-300', dotClass: 'bg-orange-500', icon: Clock },
  resolved: { label: 'Resolved', bgClass: 'bg-emerald-100 dark:bg-emerald-950/50', textClass: 'text-emerald-700 dark:text-emerald-300', dotClass: 'bg-emerald-500', icon: CheckCircle2 },
  closed: { label: 'Closed', bgClass: 'bg-gray-100 dark:bg-gray-950/50', textClass: 'text-gray-700 dark:text-gray-300', dotClass: 'bg-gray-500', icon: XCircle },
}

const PRIORITY_CONFIG: Record<ComplaintPriority, { label: string; bgClass: string; textClass: string; dotClass: string }> = {
  low: { label: 'Low', bgClass: 'bg-blue-100 dark:bg-blue-950/50', textClass: 'text-blue-700 dark:text-blue-300', dotClass: 'bg-blue-500' },
  medium: { label: 'Medium', bgClass: 'bg-amber-100 dark:bg-amber-950/50', textClass: 'text-amber-700 dark:text-amber-300', dotClass: 'bg-amber-500' },
  high: { label: 'High', bgClass: 'bg-orange-100 dark:bg-orange-950/50', textClass: 'text-orange-700 dark:text-orange-300', dotClass: 'bg-orange-500' },
  urgent: { label: 'Urgent', bgClass: 'bg-red-100 dark:bg-red-950/50', textClass: 'text-red-700 dark:text-red-300', dotClass: 'bg-red-500' },
}

const CATEGORY_CONFIG: Record<ComplaintCategory, { label: string; bgClass: string; textClass: string; icon: typeof Wrench }> = {
  maintenance: { label: 'Maintenance', bgClass: 'bg-orange-100 dark:bg-orange-950/50', textClass: 'text-orange-700 dark:text-orange-300', icon: Wrench },
  cleanliness: { label: 'Cleanliness', bgClass: 'bg-blue-100 dark:bg-blue-950/50', textClass: 'text-blue-700 dark:text-blue-300', icon: Sparkles },
  noise: { label: 'Noise', bgClass: 'bg-yellow-100 dark:bg-yellow-950/50', textClass: 'text-yellow-700 dark:text-yellow-300', icon: Volume2 },
  food: { label: 'Food', bgClass: 'bg-red-100 dark:bg-red-950/50', textClass: 'text-red-700 dark:text-red-300', icon: Utensils },
  staff: { label: 'Staff', bgClass: 'bg-purple-100 dark:bg-purple-950/50', textClass: 'text-purple-700 dark:text-purple-300', icon: Users },
  other: { label: 'Other', bgClass: 'bg-gray-100 dark:bg-gray-950/50', textClass: 'text-gray-700 dark:text-gray-300', icon: HelpCircle },
}

const STATUS_PIE_CONFIG: ChartConfig = {
  open: { label: 'Open', color: '#3b82f6' },
  assigned: { label: 'Assigned', color: '#f59e0b' },
  in_progress: { label: 'In Progress', color: '#f97316' },
  resolved: { label: 'Resolved', color: '#10b981' },
  closed: { label: 'Closed', color: '#9ca3af' },
}

const STATUS_PIE_COLORS: Record<ComplaintStatus, string> = {
  open: '#3b82f6',
  assigned: '#f59e0b',
  in_progress: '#f97316',
  resolved: '#10b981',
  closed: '#9ca3af',
}

const PRIORITY_BAR_CONFIG: ChartConfig = {
  low: { label: 'Low', color: '#3b82f6' },
  medium: { label: 'Medium', color: '#f59e0b' },
  high: { label: 'High', color: '#f97316' },
  urgent: { label: 'Urgent', color: '#ef4444' },
}

const PRIORITY_BAR_COLORS: Record<ComplaintPriority, string> = {
  low: '#3b82f6',
  medium: '#f59e0b',
  high: '#f97316',
  urgent: '#ef4444',
}

const EMPTY_FORM: RaiseComplaintFormData = {
  title: '',
  description: '',
  category: 'maintenance',
  priority: 'medium',
  tenantId: '',
  propertyId: '',
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
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

function ChartSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <Skeleton className="h-4 w-32 mb-4" />
        <Skeleton className="h-64 w-full" />
      </CardContent>
    </Card>
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
  value: string | number
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

// ── Star Rating Component ────────────────────────────────────────────────────

function StarRating({ rating, onChange, readonly = false }: { rating: number; onChange?: (r: number) => void; readonly?: boolean }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <button
          key={i}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(i + 1)}
          className={`${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} transition-transform`}
        >
          <Star
            className={`w-4 h-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
          />
        </button>
      ))}
    </div>
  )
}

// ── Complaint Detail Dialog ──────────────────────────────────────────────────

function ComplaintDetailDialog({
  complaint,
  open,
  onClose,
  staff,
  onUpdateStatus,
  onAssignStaff,
  onAddResolution,
  loading,
}: {
  complaint: ComplaintData | null
  open: boolean
  onClose: () => void
  staff: StaffInfo[]
  onUpdateStatus: (id: string, status: ComplaintStatus, resolution?: string, rating?: number) => void
  onAssignStaff: (id: string, staffId: string) => void
  onAddResolution: (id: string, resolution: string, rating: number) => void
  loading: boolean
}) {
  const [assignTo, setAssignTo] = useState(initialAssignTo)
  const [newStatus, setNewStatus] = useState<ComplaintStatus | ''>('')
  const [resolutionNotes, setResolutionNotes] = useState('')
  const [resolutionRating, setResolutionRating] = useState(initialRating)

  // Derive initial values from complaint - using key prop on parent Dialog instead of effect
  const initialAssignTo = complaint?.assignedToId || ''
  const initialRating = complaint?.rating || 0

  if (!complaint) return null

  const statusCfg = STATUS_CONFIG[complaint.status]
  const priorityCfg = PRIORITY_CONFIG[complaint.priority]
  const categoryCfg = CATEGORY_CONFIG[complaint.category]

  // Build timeline from status changes
  const timeline: { status: ComplaintStatus; date: string; label: string }[] = [
    { status: 'open', date: complaint.createdAt, label: `Complaint created by ${complaint.createdBy?.name || 'System'}` },
  ]
  if (complaint.assignedTo) {
    timeline.push({ status: 'assigned', date: complaint.updatedAt, label: `Assigned to ${complaint.assignedTo.name}` })
  }
  if (['in_progress', 'resolved', 'closed'].includes(complaint.status)) {
    timeline.push({ status: 'in_progress', date: complaint.updatedAt, label: 'Work started' })
  }
  if (['resolved', 'closed'].includes(complaint.status)) {
    timeline.push({ status: 'resolved', date: complaint.updatedAt, label: 'Complaint resolved' })
  }
  if (complaint.status === 'closed') {
    timeline.push({ status: 'closed', date: complaint.updatedAt, label: 'Complaint closed' })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquareWarning className="w-5 h-5 text-emerald-600" />
            {complaint.title}
          </DialogTitle>
          <DialogDescription>
            Complaint #{complaint.id.slice(-8).toUpperCase()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Status Badges Row */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className={`${statusCfg.bgClass} ${statusCfg.textClass}`}>
              <div className={`h-1.5 w-1.5 rounded-full ${statusCfg.dotClass} mr-1`} />
              {statusCfg.label}
            </Badge>
            <Badge variant="secondary" className={`${priorityCfg.bgClass} ${priorityCfg.textClass}`}>
              <div className={`h-1.5 w-1.5 rounded-full ${priorityCfg.dotClass} mr-1`} />
              {priorityCfg.label}
            </Badge>
            <Badge variant="secondary" className={`${categoryCfg.bgClass} ${categoryCfg.textClass}`}>
              <categoryCfg.icon className="w-3 h-3 mr-1" />
              {categoryCfg.label}
            </Badge>
          </div>

          {/* Description */}
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm font-medium text-muted-foreground mb-1">Description</p>
            <p className="text-sm whitespace-pre-wrap">{complaint.description}</p>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex justify-between p-2 bg-muted/30 rounded">
              <span className="text-muted-foreground">Tenant</span>
              <span className="font-medium">{complaint.tenant.name}</span>
            </div>
            <div className="flex justify-between p-2 bg-muted/30 rounded">
              <span className="text-muted-foreground">Room</span>
              <span className="font-medium">{complaint.tenant.room?.number || '—'}</span>
            </div>
            <div className="flex justify-between p-2 bg-muted/30 rounded">
              <span className="text-muted-foreground">Assigned To</span>
              <span className="font-medium">{complaint.assignedTo?.name || 'Unassigned'}</span>
            </div>
            <div className="flex justify-between p-2 bg-muted/30 rounded">
              <span className="text-muted-foreground">Created</span>
              <span className="font-medium">{formatDate(complaint.createdAt)}</span>
            </div>
          </div>

          {/* Rating */}
          {complaint.rating && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Rating:</span>
              <StarRating rating={complaint.rating} readonly />
            </div>
          )}

          {/* Resolution */}
          {complaint.resolution && (
            <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-lg p-4">
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300 mb-1">Resolution</p>
              <p className="text-sm whitespace-pre-wrap">{complaint.resolution}</p>
            </div>
          )}

          {/* Timeline */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Timeline</p>
            <div className="space-y-0">
              {timeline.map((item, idx) => {
                const cfg = STATUS_CONFIG[item.status]
                const TimelineIcon = cfg.icon
                return (
                  <div key={idx} className="flex items-start gap-3 pb-3">
                    <div className="flex flex-col items-center">
                      <div className={`flex items-center justify-center w-7 h-7 rounded-full ${cfg.bgClass}`}>
                        <TimelineIcon className={`w-3.5 h-3.5 ${cfg.textClass}`} />
                      </div>
                      {idx < timeline.length - 1 && <div className="w-px h-6 bg-border mt-1" />}
                    </div>
                    <div className="pt-0.5">
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{formatRelativeTime(item.date)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="border-t pt-4 space-y-4">
            {/* Assign to Staff */}
            {complaint.status !== 'resolved' && complaint.status !== 'closed' && (
              <div className="flex items-end gap-3">
                <div className="flex-1 space-y-1.5">
                  <Label className="text-xs">Assign to Staff</Label>
                  <Select value={assignTo} onValueChange={setAssignTo}>
                    <SelectTrigger><SelectValue placeholder="Select staff member" /></SelectTrigger>
                    <SelectContent>
                      {staff.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  size="sm"
                  onClick={() => assignTo && onAssignStaff(complaint.id, assignTo)}
                  disabled={!assignTo || loading}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                </Button>
              </div>
            )}

            {/* Update Status */}
            {complaint.status !== 'resolved' && complaint.status !== 'closed' && (
              <div className="flex items-end gap-3">
                <div className="flex-1 space-y-1.5">
                  <Label className="text-xs">Update Status</Label>
                  <Select value={newStatus} onValueChange={v => setNewStatus(v as ComplaintStatus)}>
                    <SelectTrigger><SelectValue placeholder="Select new status" /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUS_CONFIG)
                        .filter(([key]) => key !== complaint.status)
                        .map(([key, cfg]) => (
                          <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  size="sm"
                  onClick={() => newStatus && onUpdateStatus(complaint.id, newStatus as ComplaintStatus)}
                  disabled={!newStatus || loading}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update'}
                </Button>
              </div>
            )}

            {/* Add Resolution Notes */}
            {complaint.status === 'in_progress' && (
              <div className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground">Resolution</p>
                <Textarea
                  placeholder="Add resolution notes..."
                  value={resolutionNotes}
                  onChange={e => setResolutionNotes(e.target.value)}
                  rows={3}
                />
                <div className="flex items-center gap-3">
                  <Label className="text-xs">Rating:</Label>
                  <StarRating rating={resolutionRating} onChange={setResolutionRating} />
                </div>
                <Button
                  onClick={() => onAddResolution(complaint.id, resolutionNotes, resolutionRating)}
                  disabled={!resolutionNotes || loading}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Resolve Complaint
                </Button>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Raise Complaint Dialog ───────────────────────────────────────────────────

function RaiseComplaintDialog({
  open,
  onClose,
  tenants,
  properties,
  onSubmit,
  loading,
}: {
  open: boolean
  onClose: () => void
  tenants: { id: string; name: string }[]
  properties: PropertyInfo[]
  onSubmit: (data: RaiseComplaintFormData) => void
  loading: boolean
}) {
  // Reset form when dialog opens - use key prop on parent Dialog instead
  const [form, setForm] = useState<RaiseComplaintFormData>({ ...EMPTY_FORM })
  const resetForm = () => setForm({ ...EMPTY_FORM })

  const handleField = (field: keyof RaiseComplaintFormData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const isValid = form.title && form.description && form.tenantId && form.propertyId

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquareWarning className="w-5 h-5 text-emerald-600" />
            Raise Complaint
          </DialogTitle>
          <DialogDescription>
            Submit a new complaint for resolution
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Title *</Label>
            <Input
              placeholder="Brief description of the complaint"
              value={form.title}
              onChange={e => handleField('title', e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Description *</Label>
            <Textarea
              placeholder="Provide detailed description of the issue..."
              value={form.description}
              onChange={e => handleField('description', e.target.value)}
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={v => handleField('category', v)}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
                    <SelectItem key={key} value={key}>
                      <span className="flex items-center gap-2">
                        <cfg.icon className="w-3.5 h-3.5" />
                        {cfg.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={v => handleField('priority', v)}>
                <SelectTrigger><SelectValue placeholder="Select priority" /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => (
                    <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Tenant *</Label>
              <Select value={form.tenantId} onValueChange={v => handleField('tenantId', v)}>
                <SelectTrigger><SelectValue placeholder="Select tenant" /></SelectTrigger>
                <SelectContent>
                  {tenants.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Property *</Label>
              <Select value={form.propertyId} onValueChange={v => handleField('propertyId', v)}>
                <SelectTrigger><SelectValue placeholder="Select property" /></SelectTrigger>
                <SelectContent>
                  {properties.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={() => onSubmit(form)} disabled={!isValid || loading} className="bg-emerald-600 hover:bg-emerald-700">
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Submit Complaint
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Main Component ───────────────────────────────────────────────────────────

export function ComplaintsPage() {
  const { currentUser } = useAppStore()

  // Data
  const [complaints, setComplaints] = useState<ComplaintData[]>([])
  const [properties, setProperties] = useState<PropertyInfo[]>([])
  const [tenants, setTenants] = useState<{ id: string; name: string }[]>([])
  const [staff, setStaff] = useState<StaffInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  // Dialogs
  const [showRaiseDialog, setShowRaiseDialog] = useState(false)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintData | null>(null)

  // ── Fetch Data ─────────────────────────────────────────────────────────────

  const fetchComplaints = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (categoryFilter !== 'all') params.set('category', categoryFilter)
      const res = await fetch(`/api/complaints?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setComplaints(data)
      }
    } catch (err) {
      console.error('Failed to fetch complaints:', err)
    }
  }, [statusFilter, categoryFilter])

  useEffect(() => {
    fetchComplaints().finally(() => setLoading(false))
  }, [fetchComplaints])

  useEffect(() => {
    async function fetchSupport() {
      try {
        const [propRes, tenantRes, staffRes] = await Promise.all([
          fetch('/api/properties'),
          fetch('/api/tenants'),
          fetch('/api/staff'),
        ])
        if (propRes.ok) setProperties(await propRes.json())
        if (tenantRes.ok) {
          const data = await tenantRes.json()
          setTenants(data.map((t: { id: string; name: string }) => ({ id: t.id, name: t.name })))
        }
        if (staffRes.ok) {
          const data = await staffRes.json()
          setStaff(data.map((s: { id: string; name: string; email?: string; phone?: string }) => ({
            id: s.id,
            name: s.name,
            email: s.email,
            phone: s.phone,
          })))
        }
      } catch (err) {
        console.error('Failed to fetch support data:', err)
      }
    }
    fetchSupport()
  }, [])

  // ── Computed Stats ─────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const total = complaints.length
    const open = complaints.filter(c => c.status === 'open').length
    const inProgress = complaints.filter(c => c.status === 'assigned' || c.status === 'in_progress').length
    const resolved = complaints.filter(c => c.status === 'resolved' || c.status === 'closed').length

    // Average resolution time (days) for resolved complaints
    const resolvedComplaints = complaints.filter(c => c.status === 'resolved' || c.status === 'closed')
    let avgResolutionDays = 0
    if (resolvedComplaints.length > 0) {
      const totalDays = resolvedComplaints.reduce((sum, c) => {
        const created = new Date(c.createdAt)
        const updated = new Date(c.updatedAt)
        const diffDays = Math.max(1, Math.ceil((updated.getTime() - created.getTime()) / 86400000))
        return sum + diffDays
      }, 0)
      avgResolutionDays = Math.round(totalDays / resolvedComplaints.length)
    }

    return { total, open, inProgress, resolved, avgResolutionDays }
  }, [complaints])

  // ── Chart Data ─────────────────────────────────────────────────────────────

  const statusBreakdownData = useMemo(() => {
    const counts: Record<ComplaintStatus, number> = { open: 0, assigned: 0, in_progress: 0, resolved: 0, closed: 0 }
    complaints.forEach(c => {
      if (counts[c.status] !== undefined) counts[c.status]++
    })
    return Object.entries(counts)
      .filter(([, count]) => count > 0)
      .map(([status, count]) => ({ status, count, fill: STATUS_PIE_COLORS[status as ComplaintStatus] }))
  }, [complaints])

  const priorityBreakdownData = useMemo(() => {
    const counts: Record<ComplaintPriority, number> = { low: 0, medium: 0, high: 0, urgent: 0 }
    complaints.forEach(c => {
      if (counts[c.priority] !== undefined) counts[c.priority]++
    })
    return Object.entries(counts).map(([priority, count]) => ({
      priority: PRIORITY_CONFIG[priority as ComplaintPriority].label,
      count,
      fill: PRIORITY_BAR_COLORS[priority as ComplaintPriority],
    }))
  }, [complaints])

  // ── Filtered Complaints ────────────────────────────────────────────────────

  const filteredComplaints = useMemo(() => {
    let result = complaints

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(c =>
        c.title.toLowerCase().includes(q) ||
        c.tenant.name.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
      )
    }
    if (priorityFilter !== 'all') {
      result = result.filter(c => c.priority === priorityFilter)
    }

    return result
  }, [complaints, searchQuery, priorityFilter])

  // ── Actions ────────────────────────────────────────────────────────────────

  const handleRaiseComplaint = async (formData: RaiseComplaintFormData) => {
    setActionLoading(true)
    try {
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          priority: formData.priority,
          tenantId: formData.tenantId,
          propertyId: formData.propertyId,
          createdById: currentUser?.id || 'system',
        }),
      })
      if (res.ok) {
        setShowRaiseDialog(false)
        await fetchComplaints()
      }
    } catch (err) {
      console.error('Failed to raise complaint:', err)
    } finally {
      setActionLoading(false)
    }
  }

  const handleUpdateStatus = async (id: string, status: ComplaintStatus, resolution?: string, rating?: number) => {
    setActionLoading(true)
    try {
      const body: Record<string, unknown> = { id, status }
      if (resolution) body.resolution = resolution
      if (rating) body.rating = rating

      const res = await fetch('/api/complaints', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        setSelectedCom(null)
        setShowDetailDialog(false)
        await fetchComplaints()
      }
    } catch (err) {
      console.error('Failed to update complaint:', err)
    } finally {
      setActionLoading(false)
    }
  }

  const handleAssignStaff = async (id: string, staffId: string) => {
    setActionLoading(true)
    try {
      const res = await fetch('/api/complaints', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, assignedToId: staffId, status: 'assigned' }),
      })
      if (res.ok) {
        await fetchComplaints()
        // Update the selected complaint
        const updated = await res.json()
        setSelectedComplaint(updated)
      }
    } catch (err) {
      console.error('Failed to assign staff:', err)
    } finally {
      setActionLoading(false)
    }
  }

  const handleAddResolution = async (id: string, resolution: string, rating: number) => {
    setActionLoading(true)
    try {
      const res = await fetch('/api/complaints', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'resolved', resolution, rating }),
      })
      if (res.ok) {
        setSelectedComplaint(null)
        setShowDetailDialog(false)
        await fetchComplaints()
      }
    } catch (err) {
      console.error('Failed to resolve complaint:', err)
    } finally {
      setActionLoading(false)
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
        <div className="grid grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => <StatsCardSkeleton key={i} />)}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
        <TableSkeleton />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <MessageSquareWarning className="w-6 h-6 text-emerald-600" />
            Complaints
          </h1>
          <p className="text-muted-foreground mt-1">Track and manage tenant complaints and resolutions</p>
        </div>
        <Button onClick={() => setShowRaiseDialog(true)} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4 mr-2" />
          Raise Complaint
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatsCard
          title="Total Complaints"
          value={stats.total}
          icon={MessageSquareWarning}
          iconBg="bg-emerald-50 dark:bg-emerald-950/50"
          iconColor="text-emerald-600 dark:text-emerald-400"
        />
        <StatsCard
          title="Open"
          value={stats.open}
          icon={AlertCircle}
          iconBg="bg-blue-50 dark:bg-blue-950/50"
          iconColor="text-blue-600 dark:text-blue-400"
        />
        <StatsCard
          title="In Progress"
          value={stats.inProgress}
          icon={Clock}
          iconBg="bg-orange-50 dark:bg-orange-950/50"
          iconColor="text-orange-600 dark:text-orange-400"
        />
        <StatsCard
          title="Resolved"
          value={stats.resolved}
          icon={CheckCircle2}
          iconBg="bg-emerald-50 dark:bg-emerald-950/50"
          iconColor="text-emerald-600 dark:text-emerald-400"
        />
        <StatsCard
          title="Avg Resolution"
          value={stats.avgResolutionDays > 0 ? `${stats.avgResolutionDays}d` : '—'}
          icon={Timer}
          iconBg="bg-teal-50 dark:bg-teal-950/50"
          iconColor="text-teal-600 dark:text-teal-400"
          subtitle="Average time"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Status Pie Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Status Breakdown</CardTitle>
            <CardDescription>Complaint distribution by status</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={STATUS_PIE_CONFIG} className="h-64 w-full">
              <PieChart>
                <Pie
                  data={statusBreakdownData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="count"
                  nameKey="status"
                >
                  {statusBreakdownData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Priority Bar Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Priority Breakdown</CardTitle>
            <CardDescription>Complaint distribution by priority level</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={PRIORITY_BAR_CONFIG} className="h-64 w-full">
              <BarChart data={priorityBreakdownData} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="priority" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} allowDecimals={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {priorityBreakdownData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search complaints..."
                className="pl-9"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Priority" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
                  <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Complaint Table */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-48">Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead className="w-12">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredComplaints.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                      <MessageSquareWarning className="w-10 h-10 mx-auto mb-2 opacity-40" />
                      <p>No complaints found</p>
                      <p className="text-xs">Try adjusting your filters or raise a new complaint</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredComplaints.map(complaint => {
                    const statusCfg = STATUS_CONFIG[complaint.status]
                    const priorityCfg = PRIORITY_CONFIG[complaint.priority]
                    const categoryCfg = CATEGORY_CONFIG[complaint.category]

                    return (
                      <TableRow key={complaint.id} className="group hover:bg-muted/50">
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm line-clamp-1">{complaint.title}</p>
                            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{complaint.description}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={`${categoryCfg.bgClass} ${categoryCfg.textClass} text-xs`}>
                            <categoryCfg.icon className="w-3 h-3 mr-1" />
                            {categoryCfg.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={`${priorityCfg.bgClass} ${priorityCfg.textClass} text-xs`}>
                            <div className={`h-1.5 w-1.5 rounded-full ${priorityCfg.dotClass} mr-1`} />
                            {priorityCfg.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={`${statusCfg.bgClass} ${statusCfg.textClass} text-xs`}>
                            <div className={`h-1.5 w-1.5 rounded-full ${statusCfg.dotClass} mr-1`} />
                            {statusCfg.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{complaint.tenant.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {complaint.assignedTo?.name || '—'}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDate(complaint.createdAt)}
                        </TableCell>
                        <TableCell>
                          {complaint.rating ? (
                            <StarRating rating={complaint.rating} readonly />
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => { setSelectedComplaint(complaint); setShowDetailDialog(true) }}>
                                <Eye className="w-4 h-4 mr-2" /> View Details
                              </DropdownMenuItem>
                              {complaint.status === 'open' && (
                                <DropdownMenuItem onClick={() => { setSelectedComplaint(complaint); setShowDetailDialog(true) }}>
                                  <UserCheck className="w-4 h-4 mr-2" /> Assign
                                </DropdownMenuItem>
                              )}
                              {['open', 'assigned', 'in_progress'].includes(complaint.status) && (
                                <DropdownMenuItem onClick={() => { setSelectedComplaint(complaint); setShowDetailDialog(true) }}>
                                  <ArrowUpDown className="w-4 h-4 mr-2" /> Update Status
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <RaiseComplaintDialog
        open={showRaiseDialog}
        onClose={() => setShowRaiseDialog(false)}
        tenants={tenants}
        properties={properties}
        onSubmit={handleRaiseComplaint}
        loading={actionLoading}
      />

      <ComplaintDetailDialog
        complaint={selectedComplaint}
        open={showDetailDialog}
        onClose={() => { setShowDetailDialog(false); setSelectedComplaint(null) }}
        staff={staff}
        onUpdateStatus={handleUpdateStatus}
        onAssignStaff={handleAssignStaff}
        onAddResolution={handleAddResolution}
        loading={actionLoading}
      />
    </div>
  )
}
