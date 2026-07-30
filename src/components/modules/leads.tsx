'use client'

import { useEffect, useState, useMemo } from 'react'
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  UserPlus,
  Phone,
  Mail,
  Calendar,
  Building2,
  IndianRupee,
  LayoutGrid,
  List,
  Filter,
  Loader2,
  Search,
  Users,
  TrendingUp,
  UserCheck,
  UserX,
  Target,
  ArrowRight,
  ArrowLeft,
  Eye,
  MoreVertical,
  Globe,
  MessageCircle,
  UserRound,
  Footprints,
  Search as SearchIcon,
  Share2,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Clock,
  StickyNote,
  X,
} from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────────

type LeadSource = 'website' | 'whatsapp' | 'referral' | 'walk_in' | 'google' | 'social_media'
type LeadStage = 'lead' | 'inquiry' | 'site_visit' | 'negotiation' | 'token' | 'booking' | 'move_in' | 'lost'

interface LeadData {
  id: string
  name: string
  email?: string
  phone: string
  source: LeadSource
  status: LeadStage
  stage: number
  propertyId: string
  property: { id: string; name: string; address?: string }
  roomPreference?: string
  budget?: number
  visitDate?: string
  visitNotes?: string
  followUpDate?: string
  followUpNotes?: string
  tokenAmount?: number
  notes?: string
  lostReason?: string
  assignedToId?: string
  assignedTo?: { id: string; name: string; email: string } | null
  createdById: string
  createdBy: { id: string; name: string; email: string }
  createdAt: string
  updatedAt: string
}

interface PropertyInfo {
  id: string
  name: string
}

interface StaffInfo {
  id: string
  name: string
  email: string
}

interface LeadFormData {
  name: string
  email: string
  phone: string
  source: LeadSource
  propertyId: string
  roomPreference: string
  budget: string
  notes: string
  followUpDate: string
  assignedToId: string
}

// ── Constants ────────────────────────────────────────────────────────────────

const PIPELINE_STAGES: { key: LeadStage; label: string; color: string; bgClass: string; borderClass: string }[] = [
  { key: 'lead', label: 'Lead', color: 'bg-slate-500', bgClass: 'bg-slate-50 dark:bg-slate-950/30', borderClass: 'border-slate-200 dark:border-slate-800' },
  { key: 'inquiry', label: 'Inquiry', color: 'bg-blue-500', bgClass: 'bg-blue-50 dark:bg-blue-950/30', borderClass: 'border-blue-200 dark:border-blue-800' },
  { key: 'site_visit', label: 'Site Visit', color: 'bg-amber-500', bgClass: 'bg-amber-50 dark:bg-amber-950/30', borderClass: 'border-amber-200 dark:border-amber-800' },
  { key: 'negotiation', label: 'Negotiation', color: 'bg-purple-500', bgClass: 'bg-purple-50 dark:bg-purple-950/30', borderClass: 'border-purple-200 dark:border-purple-800' },
  { key: 'token', label: 'Token', color: 'bg-orange-500', bgClass: 'bg-orange-50 dark:bg-orange-950/30', borderClass: 'border-orange-200 dark:border-orange-800' },
  { key: 'booking', label: 'Booking', color: 'bg-teal-500', bgClass: 'bg-teal-50 dark:bg-teal-950/30', borderClass: 'border-teal-200 dark:border-teal-800' },
  { key: 'move_in', label: 'Move In', color: 'bg-emerald-500', bgClass: 'bg-emerald-50 dark:bg-emerald-950/30', borderClass: 'border-emerald-200 dark:border-emerald-800' },
]

const SOURCE_CONFIG: Record<LeadSource, { label: string; icon: typeof Globe; bgClass: string; textClass: string }> = {
  website: { label: 'Website', icon: Globe, bgClass: 'bg-blue-100 dark:bg-blue-950/50', textClass: 'text-blue-700 dark:text-blue-300' },
  whatsapp: { label: 'WhatsApp', icon: MessageCircle, bgClass: 'bg-green-100 dark:bg-green-950/50', textClass: 'text-green-700 dark:text-green-300' },
  referral: { label: 'Referral', icon: UserRound, bgClass: 'bg-purple-100 dark:bg-purple-950/50', textClass: 'text-purple-700 dark:text-purple-300' },
  walk_in: { label: 'Walk-in', icon: Footprints, bgClass: 'bg-orange-100 dark:bg-orange-950/50', textClass: 'text-orange-700 dark:text-orange-300' },
  google: { label: 'Google', icon: SearchIcon, bgClass: 'bg-red-100 dark:bg-red-950/50', textClass: 'text-red-700 dark:text-red-300' },
  social_media: { label: 'Social Media', icon: Share2, bgClass: 'bg-pink-100 dark:bg-pink-950/50', textClass: 'text-pink-700 dark:text-pink-300' },
}

const STAGE_INDEX: Record<LeadStage, number> = {
  lead: 0,
  inquiry: 1,
  site_visit: 2,
  negotiation: 3,
  token: 4,
  booking: 5,
  move_in: 6,
  lost: -1,
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

function isOverdue(dateStr?: string | null): boolean {
  if (!dateStr) return false
  return new Date(dateStr) < new Date()
}

// ── Sub-components ───────────────────────────────────────────────────────────

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

function PipelineSkeleton() {
  return (
    <div className="grid grid-cols-7 gap-3">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="h-8 w-full rounded" />
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
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

function LeadCard({ lead, onClick }: { lead: LeadData; onClick: () => void }) {
  const sourceCfg = SOURCE_CONFIG[lead.source]
  const SourceIcon = sourceCfg.icon
  const overdue = isOverdue(lead.followUpDate)

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 shadow-sm hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700 transition-all duration-200"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="font-medium text-sm text-slate-900 dark:text-slate-100 truncate">{lead.name}</h4>
        <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 shrink-0 ${sourceCfg.bgClass} ${sourceCfg.textClass}`}>
          <SourceIcon className="h-2.5 w-2.5 mr-0.5" />
          {sourceCfg.label}
        </Badge>
      </div>
      <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1.5">
          <Phone className="h-3 w-3 shrink-0" />
          <span className="truncate">{lead.phone}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Building2 className="h-3 w-3 shrink-0" />
          <span className="truncate">{lead.property?.name || '—'}</span>
        </div>
        {lead.budget != null && (
          <div className="flex items-center gap-1.5">
            <IndianRupee className="h-3 w-3 shrink-0" />
            <span>{formatCurrency(lead.budget)}</span>
          </div>
        )}
        {lead.followUpDate && (
          <div className={`flex items-center gap-1.5 ${overdue ? 'text-red-600 dark:text-red-400 font-medium' : ''}`}>
            <Calendar className="h-3 w-3 shrink-0" />
            <span>{formatDate(lead.followUpDate)}</span>
            {overdue && <span className="text-[10px]">(overdue)</span>}
          </div>
        )}
      </div>
    </div>
  )
}

function LeadDetailDialog({
  lead,
  open,
  onClose,
  onStageChange,
}: {
  lead: LeadData | null
  open: boolean
  onClose: () => void
  onStageChange: (leadId: string, newStage: LeadStage) => void
}) {
  if (!lead) return null

  const currentIdx = STAGE_INDEX[lead.status] ?? 0
  const canMoveForward = currentIdx < 6
  const canMoveBack = currentIdx > 0

  const timeline = PIPELINE_STAGES.map((s, idx) => ({
    ...s,
    completed: idx < currentIdx,
    current: idx === currentIdx,
  }))

  const sourceCfg = SOURCE_CONFIG[lead.source]
  const SourceIcon = sourceCfg.icon

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {lead.name}
            <Badge variant="secondary" className={`${sourceCfg.bgClass} ${sourceCfg.textClass}`}>
              <SourceIcon className="h-3 w-3 mr-1" />
              {sourceCfg.label}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Lead details and pipeline stage management
          </DialogDescription>
        </DialogHeader>

        {/* Pipeline Timeline */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Pipeline Progress</h4>
          <div className="flex items-center gap-1">
            {timeline.map((step, idx) => (
              <TooltipProvider key={step.key}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center flex-1">
                      <div
                        className={`h-2.5 flex-1 rounded-full transition-colors ${
                          step.completed
                            ? 'bg-emerald-500'
                            : step.current
                            ? 'bg-emerald-400 animate-pulse'
                            : 'bg-slate-200 dark:bg-slate-700'
                        }`}
                      />
                      {idx < timeline.length - 1 && (
                        <div
                          className={`h-0.5 w-1 ${
                            step.completed ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'
                          }`}
                        />
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>{step.label}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-slate-400">
            {PIPELINE_STAGES.map((s) => (
              <span key={s.key} className="text-center flex-1">{s.label}</span>
            ))}
          </div>
        </div>

        {/* Stage Actions */}
        <div className="flex items-center gap-2">
          {canMoveBack && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onStageChange(lead.id, PIPELINE_STAGES[currentIdx - 1].key)}
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-1" />
              Back to {PIPELINE_STAGES[currentIdx - 1].label}
            </Button>
          )}
          {canMoveForward && (
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={() => onStageChange(lead.id, PIPELINE_STAGES[currentIdx + 1].key)}
            >
              Move to {PIPELINE_STAGES[currentIdx + 1].label}
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          )}
          {lead.status !== 'lost' && currentIdx < 6 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50"
              onClick={() => onStageChange(lead.id, 'lost')}
            >
              <UserX className="h-3.5 w-3.5 mr-1" />
              Mark Lost
            </Button>
          )}
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <p className="text-xs text-slate-500">Contact</p>
              <div className="flex items-center gap-1.5 text-sm mt-0.5">
                <Phone className="h-3.5 w-3.5 text-slate-400" />
                {lead.phone}
              </div>
              {lead.email && (
                <div className="flex items-center gap-1.5 text-sm mt-0.5">
                  <Mail className="h-3.5 w-3.5 text-slate-400" />
                  {lead.email}
                </div>
              )}
            </div>
            <div>
              <p className="text-xs text-slate-500">Property</p>
              <div className="flex items-center gap-1.5 text-sm mt-0.5">
                <Building2 className="h-3.5 w-3.5 text-slate-400" />
                {lead.property?.name || '—'}
              </div>
            </div>
            {lead.budget != null && (
              <div>
                <p className="text-xs text-slate-500">Budget</p>
                <div className="flex items-center gap-1.5 text-sm mt-0.5">
                  <IndianRupee className="h-3.5 w-3.5 text-slate-400" />
                  {formatCurrency(lead.budget)}
                </div>
              </div>
            )}
          </div>
          <div className="space-y-3">
            {lead.roomPreference && (
              <div>
                <p className="text-xs text-slate-500">Room Preference</p>
                <p className="text-sm mt-0.5">{lead.roomPreference}</p>
              </div>
            )}
            {lead.followUpDate && (
              <div>
                <p className="text-xs text-slate-500">Follow-up Date</p>
                <div className="flex items-center gap-1.5 text-sm mt-0.5">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  {formatDate(lead.followUpDate)}
                </div>
              </div>
            )}
            {lead.assignedTo && (
              <div>
                <p className="text-xs text-slate-500">Assigned To</p>
                <p className="text-sm mt-0.5">{lead.assignedTo.name}</p>
              </div>
            )}
            {lead.tokenAmount != null && (
              <div>
                <p className="text-xs text-slate-500">Token Amount</p>
                <p className="text-sm mt-0.5">{formatCurrency(lead.tokenAmount)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Notes */}
        {lead.notes && (
          <div>
            <p className="text-xs text-slate-500 mb-1">Notes</p>
            <div className="text-sm bg-slate-50 dark:bg-slate-800 rounded-md p-3 whitespace-pre-wrap">
              {lead.notes}
            </div>
          </div>
        )}
        {lead.followUpNotes && (
          <div>
            <p className="text-xs text-slate-500 mb-1">Follow-up Notes</p>
            <div className="text-sm bg-slate-50 dark:bg-slate-800 rounded-md p-3 whitespace-pre-wrap">
              {lead.followUpNotes}
            </div>
          </div>
        )}
        {lead.lostReason && (
          <div>
            <p className="text-xs text-red-500 mb-1">Lost Reason</p>
            <div className="text-sm bg-red-50 dark:bg-red-950/30 rounded-md p-3 text-red-700 dark:text-red-300">
              {lead.lostReason}
            </div>
          </div>
        )}

        {/* Created Info */}
        <div className="text-xs text-slate-400 pt-2 border-t">
          Created by {lead.createdBy?.name || 'System'} on {formatDate(lead.createdAt)}
          {lead.updatedAt && ` · Updated ${formatDate(lead.updatedAt)}`}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Main Component ───────────────────────────────────────────────────────────

export function LeadsPage() {
  const { currentUser } = useAppStore()

  // Data state
  const [leads, setLeads] = useState<LeadData[]>([])
  const [properties, setProperties] = useState<PropertyInfo[]>([])
  const [staff, setStaff] = useState<StaffInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // UI state
  const [viewMode, setViewMode] = useState<'pipeline' | 'list'>('pipeline')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [selectedLead, setSelectedLead] = useState<LeadData | null>(null)
  const [showDetailDialog, setShowDetailDialog] = useState(false)

  // Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [filterSource, setFilterSource] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterProperty, setFilterProperty] = useState<string>('all')

  // Sort state
  const [sortField, setSortField] = useState<string>('createdAt')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  // Form state
  const [form, setForm] = useState<LeadFormData>({
    name: '',
    email: '',
    phone: '',
    source: 'website',
    propertyId: '',
    roomPreference: '',
    budget: '',
    notes: '',
    followUpDate: '',
    assignedToId: '',
  })

  // ── Data Fetching ──────────────────────────────────────────────────────────

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const [leadsRes, propsRes, staffRes] = await Promise.all([
          fetch('/api/leads'),
          fetch('/api/properties'),
          fetch('/api/staff'),
        ])
        if (leadsRes.ok) {
          const data = await leadsRes.json()
          setLeads(data.leads || data || [])
        }
        if (propsRes.ok) {
          const data = await propsRes.json()
          setProperties(Array.isArray(data) ? data : data.properties || [])
        }
        if (staffRes.ok) {
          const data = await staffRes.json()
          setStaff(Array.isArray(data) ? data : data.staff || [])
        }
      } catch (err) {
        console.error('Failed to fetch leads data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // ── Computed Values ────────────────────────────────────────────────────────

  const activeLeads = useMemo(() => leads.filter((l) => l.status !== 'lost'), [leads])

  const stats = useMemo(() => {
    const total = leads.length
    const converted = leads.filter((l) => l.status === 'move_in').length
    const inPipeline = activeLeads.length - converted
    const lost = leads.filter((l) => l.status === 'lost').length
    const conversionRate = total > 0 ? ((converted / total) * 100).toFixed(1) : '0.0'
    return { total, converted, inPipeline, lost, conversionRate }
  }, [leads, activeLeads])

  const pipelineLeads = useMemo(() => {
    return PIPELINE_STAGES.map((stage) => ({
      ...stage,
      leads: activeLeads.filter((l) => l.status === stage.key),
    }))
  }, [activeLeads])

  const filteredAndSortedLeads = useMemo(() => {
    let result = [...leads]

    // Filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.phone.toLowerCase().includes(q) ||
          l.email?.toLowerCase().includes(q)
      )
    }
    if (filterSource !== 'all') {
      result = result.filter((l) => l.source === filterSource)
    }
    if (filterStatus !== 'all') {
      result = result.filter((l) => l.status === filterStatus)
    }
    if (filterProperty !== 'all') {
      result = result.filter((l) => l.propertyId === filterProperty)
    }

    // Sort
    result.sort((a, b) => {
      const aVal = a[sortField as keyof LeadData]
      const bVal = b[sortField as keyof LeadData]
      if (aVal == null && bVal == null) return 0
      if (aVal == null) return 1
      if (bVal == null) return -1
      const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true })
      return sortDir === 'asc' ? cmp : -cmp
    })

    return result
  }, [leads, searchQuery, filterSource, filterStatus, filterProperty, sortField, sortDir])

  // ── Handlers ───────────────────────────────────────────────────────────────

  function handleSort(field: string) {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  function SortIcon({ field }: { field: string }) {
    if (sortField !== field) return <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
    return sortDir === 'asc' ? (
      <ChevronUp className="h-3.5 w-3.5 text-emerald-600" />
    ) : (
      <ChevronDown className="h-3.5 w-3.5 text-emerald-600" />
    )
  }

  async function handleAddLead() {
    if (!form.name || !form.phone || !form.propertyId) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email || undefined,
          phone: form.phone,
          source: form.source,
          propertyId: form.propertyId,
          roomPreference: form.roomPreference || undefined,
          budget: form.budget ? parseFloat(form.budget) : undefined,
          notes: form.notes || undefined,
          followUpDate: form.followUpDate || undefined,
          assignedToId: form.assignedToId || undefined,
          createdById: currentUser?.id,
        }),
      })
      if (res.ok) {
        const newLead = await res.json()
        setLeads((prev) => [newLead, ...prev])
        setShowAddDialog(false)
        setForm({
          name: '',
          email: '',
          phone: '',
          source: 'website',
          propertyId: '',
          roomPreference: '',
          budget: '',
          notes: '',
          followUpDate: '',
          assignedToId: '',
        })
      }
    } catch (err) {
      console.error('Failed to add lead:', err)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleStageChange(leadId: string, newStage: LeadStage) {
    const stageIdx = STAGE_INDEX[newStage] ?? 0
    try {
      const res = await fetch('/api/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: leadId, status: newStage, stage: stageIdx + 1 }),
      })
      if (res.ok) {
        const updated = await res.json()
        setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, ...updated } : l)))
        setSelectedLead((prev) => (prev?.id === leadId ? { ...prev, ...updated } : prev))
      }
    } catch (err) {
      console.error('Failed to update lead stage:', err)
    }
  }

  function openLeadDetail(lead: LeadData) {
    setSelectedLead(lead)
    setShowDetailDialog(true)
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Lead CRM</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track and manage leads through the sales pipeline
          </p>
        </div>
        <Button
          onClick={() => setShowAddDialog(true)}
          className="bg-emerald-600 hover:bg-emerald-700 shrink-0"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Add Lead
        </Button>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <StatsCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Total Leads</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.total}</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center">
                  <Users className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Converted</p>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.converted}</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center">
                  <UserCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">In Pipeline</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.inPipeline}</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Lost</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.lost}</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-red-100 dark:bg-red-950/50 flex items-center justify-center">
                  <UserX className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="col-span-2 sm:col-span-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Conversion Rate</p>
                  <p className="text-2xl font-bold text-teal-600 dark:text-teal-400">{stats.conversionRate}%</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-teal-100 dark:bg-teal-950/50 flex items-center justify-center">
                  <Target className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* View Toggle & Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
          <Button
            variant={viewMode === 'pipeline' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('pipeline')}
            className={viewMode === 'pipeline' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
          >
            <LayoutGrid className="h-4 w-4 mr-1" />
            Pipeline
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
            className={viewMode === 'list' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
          >
            <List className="h-4 w-4 mr-1" />
            List
          </Button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search leads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-48 h-9"
            />
          </div>
          <Select value={filterSource} onValueChange={setFilterSource}>
            <SelectTrigger className="w-36 h-9">
              <Filter className="h-3.5 w-3.5 mr-1 text-slate-400" />
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              {Object.entries(SOURCE_CONFIG).map(([key, cfg]) => (
                <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-36 h-9">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {PIPELINE_STAGES.map((s) => (
                <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
              ))}
              <SelectItem value="lost">Lost</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterProperty} onValueChange={setFilterProperty}>
            <SelectTrigger className="w-40 h-9">
              <SelectValue placeholder="Property" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Properties</SelectItem>
              {properties.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Pipeline View */}
      {viewMode === 'pipeline' && (
        loading ? (
          <PipelineSkeleton />
        ) : (
          <ScrollArea className="w-full">
            <div className="grid grid-cols-7 gap-3 min-w-[1200px]">
              {pipelineLeads.map((stage) => (
                <div key={stage.key} className={`rounded-xl border ${stage.borderClass} ${stage.bgClass} p-3`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`h-2.5 w-2.5 rounded-full ${stage.color}`} />
                      <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-300">{stage.label}</h3>
                    </div>
                    <Badge variant="secondary" className="text-xs h-5 px-1.5 bg-white/80 dark:bg-slate-800/80">
                      {stage.leads.length}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    {stage.leads.length === 0 ? (
                      <div className="text-center py-6 text-xs text-slate-400 dark:text-slate-500">
                        No leads
                      </div>
                    ) : (
                      stage.leads.map((lead) => (
                        <LeadCard
                          key={lead.id}
                          lead={lead}
                          onClick={() => openLeadDetail(lead)}
                        />
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )
      )}

      {/* List View */}
      {viewMode === 'list' && (
        loading ? (
          <TableSkeleton />
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="cursor-pointer select-none" onClick={() => handleSort('name')}>
                      <div className="flex items-center gap-1">Name <SortIcon field="name" /></div>
                    </TableHead>
                    <TableHead className="cursor-pointer select-none" onClick={() => handleSort('phone')}>
                      <div className="flex items-center gap-1">Phone <SortIcon field="phone" /></div>
                    </TableHead>
                    <TableHead className="cursor-pointer select-none" onClick={() => handleSort('source')}>
                      <div className="flex items-center gap-1">Source <SortIcon field="source" /></div>
                    </TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead className="cursor-pointer select-none" onClick={() => handleSort('budget')}>
                      <div className="flex items-center gap-1">Budget <SortIcon field="budget" /></div>
                    </TableHead>
                    <TableHead className="cursor-pointer select-none" onClick={() => handleSort('status')}>
                      <div className="flex items-center gap-1">Status <SortIcon field="status" /></div>
                    </TableHead>
                    <TableHead className="cursor-pointer select-none" onClick={() => handleSort('followUpDate')}>
                      <div className="flex items-center gap-1">Follow-up <SortIcon field="followUpDate" /></div>
                    </TableHead>
                    <TableHead className="w-10">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedLeads.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-slate-400">
                        No leads found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAndSortedLeads.map((lead) => {
                      const sourceCfg = SOURCE_CONFIG[lead.source]
                      const stageIdx = STAGE_INDEX[lead.status] ?? -1
                      const stageInfo = stageIdx >= 0 ? PIPELINE_STAGES[stageIdx] : null
                      const overdue = isOverdue(lead.followUpDate)

                      return (
                        <TableRow key={lead.id} className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50" onClick={() => openLeadDetail(lead)}>
                          <TableCell className="font-medium">{lead.name}</TableCell>
                          <TableCell className="text-slate-600 dark:text-slate-400">{lead.phone}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className={`text-xs ${sourceCfg.bgClass} ${sourceCfg.textClass}`}>
                              {sourceCfg.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-slate-600 dark:text-slate-400">{lead.property?.name || '—'}</TableCell>
                          <TableCell>
                            {lead.budget != null ? formatCurrency(lead.budget) : '—'}
                          </TableCell>
                          <TableCell>
                            {lead.status === 'lost' ? (
                              <Badge variant="secondary" className="bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300 text-xs">
                                Lost
                              </Badge>
                            ) : stageInfo ? (
                              <Badge variant="secondary" className={`${stageInfo.bgClass} text-xs`}>
                                <div className={`h-1.5 w-1.5 rounded-full ${stageInfo.color} mr-1`} />
                                {stageInfo.label}
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">{lead.status}</Badge>
                            )}
                          </TableCell>
                          <TableCell className={overdue ? 'text-red-600 dark:text-red-400 font-medium' : ''}>
                            {formatDate(lead.followUpDate)}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openLeadDetail(lead) }}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                {lead.status !== 'lost' && STAGE_INDEX[lead.status] < 6 && (
                                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleStageChange(lead.id, PIPELINE_STAGES[STAGE_INDEX[lead.status] + 1].key) }}>
                                    <ArrowRight className="h-4 w-4 mr-2" />
                                    Move to Next Stage
                                  </DropdownMenuItem>
                                )}
                                {lead.status !== 'lost' && STAGE_INDEX[lead.status] > 0 && (
                                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleStageChange(lead.id, PIPELINE_STAGES[STAGE_INDEX[lead.status] - 1].key) }}>
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Move Back
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
            </CardContent>
          </Card>
        )
      )}

      {/* Add Lead Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Lead</DialogTitle>
            <DialogDescription>
              Enter the lead details to add them to the pipeline
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lead-name">Name *</Label>
                <Input
                  id="lead-name"
                  placeholder="Full name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lead-phone">Phone *</Label>
                <Input
                  id="lead-phone"
                  placeholder="Phone number"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lead-email">Email</Label>
                <Input
                  id="lead-email"
                  type="email"
                  placeholder="Email address"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lead-source">Source</Label>
                <Select value={form.source} onValueChange={(v) => setForm((f) => ({ ...f, source: v as LeadSource }))}>
                  <SelectTrigger id="lead-source">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(SOURCE_CONFIG).map(([key, cfg]) => (
                      <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lead-property">Property *</Label>
                <Select value={form.propertyId} onValueChange={(v) => setForm((f) => ({ ...f, propertyId: v }))}>
                  <SelectTrigger id="lead-property">
                    <SelectValue placeholder="Select property" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lead-room">Room Preference</Label>
                <Input
                  id="lead-room"
                  placeholder="e.g., AC Double Sharing"
                  value={form.roomPreference}
                  onChange={(e) => setForm((f) => ({ ...f, roomPreference: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lead-budget">Budget</Label>
                <Input
                  id="lead-budget"
                  type="number"
                  placeholder="Monthly budget"
                  value={form.budget}
                  onChange={(e) => setForm((f) => ({ ...f, budget: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lead-followup">Follow-up Date</Label>
                <Input
                  id="lead-followup"
                  type="date"
                  value={form.followUpDate}
                  onChange={(e) => setForm((f) => ({ ...f, followUpDate: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="lead-assign">Assign To</Label>
              <Select value={form.assignedToId} onValueChange={(v) => setForm((f) => ({ ...f, assignedToId: v }))}>
                <SelectTrigger id="lead-assign">
                  <SelectValue placeholder="Select staff member" />
                </SelectTrigger>
                <SelectContent>
                  {staff.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="lead-notes">Notes</Label>
              <Textarea
                id="lead-notes"
                placeholder="Additional notes about this lead..."
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddLead}
              disabled={submitting || !form.name || !form.phone || !form.propertyId}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add Lead
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lead Detail Dialog */}
      <LeadDetailDialog
        lead={selectedLead}
        open={showDetailDialog}
        onClose={() => setShowDetailDialog(false)}
        onStageChange={handleStageChange}
      />
    </div>
  )
}
