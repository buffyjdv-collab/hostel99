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
  Megaphone,
  Plus,
  Send,
  MessageSquare,
  Bell,
  AlertTriangle,
  Wrench,
  CalendarDays,
  IndianRupee,
  Clock,
  Building2,
  Filter,
  Loader2,
  CheckCircle2,
  XCircle,
  Smartphone,
  Mail,
  Speaker,
  Search,
  Trash2,
  Pencil,
} from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────────

interface Notice {
  id: string
  title: string
  content: string
  type: string
  propertyId: string
  isActive: boolean
  expiryDate: string | null
  createdAt: string
  property?: { id: string; name: string }
  createdBy?: { id: string; name: string; email: string }
}

interface Communication {
  id: string
  type: string
  message: string
  recipientType: string
  recipientId?: string | null
  propertyId?: string | null
  status: string
  sentAt: string
  sender?: { id: string; name: string }
}

interface Property {
  id: string
  name: string
}

// ── Constants ────────────────────────────────────────────────────────────────

const NOTICE_TYPE_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  general: { label: 'General', color: 'text-blue-700', bg: 'bg-blue-100 border-blue-200', icon: <Bell className="h-3.5 w-3.5" /> },
  urgent: { label: 'Urgent', color: 'text-red-700', bg: 'bg-red-100 border-red-200', icon: <AlertTriangle className="h-3.5 w-3.5" /> },
  maintenance: { label: 'Maintenance', color: 'text-orange-700', bg: 'bg-orange-100 border-orange-200', icon: <Wrench className="h-3.5 w-3.5" /> },
  event: { label: 'Event', color: 'text-purple-700', bg: 'bg-purple-100 border-purple-200', icon: <CalendarDays className="h-3.5 w-3.5" /> },
  payment: { label: 'Payment', color: 'text-emerald-700', bg: 'bg-emerald-100 border-emerald-200', icon: <IndianRupee className="h-3.5 w-3.5" /> },
}

const MESSAGE_TYPE_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  whatsapp: { label: 'WhatsApp', icon: <Smartphone className="h-4 w-4" />, color: 'text-green-600' },
  sms: { label: 'SMS', icon: <Smartphone className="h-4 w-4" />, color: 'text-blue-600' },
  email: { label: 'Email', icon: <Mail className="h-4 w-4" />, color: 'text-orange-600' },
  push: { label: 'Push', icon: <Bell className="h-4 w-4" />, color: 'text-purple-600' },
  announcement: { label: 'Announcement', icon: <Speaker className="h-4 w-4" />, color: 'text-teal-600' },
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  sent: { label: 'Sent', color: 'text-blue-600', icon: <Send className="h-3.5 w-3.5" /> },
  delivered: { label: 'Delivered', color: 'text-emerald-600', icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  failed: { label: 'Failed', color: 'text-red-600', icon: <XCircle className="h-3.5 w-3.5" /> },
  read: { label: 'Read', color: 'text-teal-600', icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(date: string | Date | null) {
  if (!date) return 'N/A'
  return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatDateTime(date: string | Date) {
  return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function isExpired(expiryDate: string | null) {
  if (!expiryDate) return false
  return new Date(expiryDate) < new Date()
}

// ── Component ────────────────────────────────────────────────────────────────

export function NoticesPage() {
  const { currentUser } = useAppStore()
  const role = currentUser?.role || ''
  const canCreate = hasPermission(role, 'notices:create')
  const canUpdate = hasPermission(role, 'notices:update')
  const canDelete = hasPermission(role, 'notices:delete')
  const [loading, setLoading] = useState(true)
  const [notices, setNotices] = useState<Notice[]>([])
  const [properties, setProperties] = useState<Property[]>([])

  // Filters
  const [noticeTypeFilter, setNoticeTypeFilter] = useState<string>('all')
  const [noticePropertyFilter, setNoticePropertyFilter] = useState<string>('all')
  const [messageTypeFilter, setMessageTypeFilter] = useState<string>('all')

  // Dialogs
  const [createNoticeOpen, setCreateNoticeOpen] = useState(false)
  const [sendMessageOpen, setSendMessageOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Create Notice form
  const [noticeForm, setNoticeForm] = useState({
    title: '',
    content: '',
    type: 'general',
    propertyId: '',
    expiryDate: '',
  })

  // Send Message form
  const [messageForm, setMessageForm] = useState({
    message: '',
    type: 'whatsapp',
    recipientType: 'all',
    propertyId: '',
  })

  // Mock communications (the API doesn't have a dedicated endpoint yet)
  const [communications] = useState<Communication[]>([])

  // ── Data Fetching ──────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [noticesRes, propsRes] = await Promise.all([
        fetch('/api/notices'),
        fetch('/api/properties'),
      ])
      if (noticesRes.ok) {
        const noticesData = await noticesRes.json()
        setNotices(Array.isArray(noticesData) ? noticesData : [])
      }
      if (propsRes.ok) {
        const propsData = await propsRes.json()
        setProperties(Array.isArray(propsData) ? propsData.map((p: { id: string; name: string }) => ({ id: p.id, name: p.name })) : [])
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

  const filteredNotices = useMemo(() => {
    return notices.filter((n) => {
      if (noticeTypeFilter !== 'all' && n.type !== noticeTypeFilter) return false
      if (noticePropertyFilter !== 'all' && n.propertyId !== noticePropertyFilter) return false
      return true
    })
  }, [notices, noticeTypeFilter, noticePropertyFilter])

  const filteredCommunications = useMemo(() => {
    return communications.filter((c) => {
      if (messageTypeFilter !== 'all' && c.type !== messageTypeFilter) return false
      return true
    })
  }, [communications, messageTypeFilter])

  // ── Form Handlers ──────────────────────────────────────────────────────

  const handleCreateNotice = async () => {
    if (!noticeForm.title || !noticeForm.content || !noticeForm.propertyId || !currentUser) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/notices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: noticeForm.title,
          content: noticeForm.content,
          type: noticeForm.type,
          propertyId: noticeForm.propertyId,
          createdById: currentUser.id,
          expiryDate: noticeForm.expiryDate || undefined,
        }),
      })
      if (res.ok) {
        const newNotice = await res.json()
        setNotices((prev) => [newNotice, ...prev])
        setCreateNoticeOpen(false)
        setNoticeForm({ title: '', content: '', type: 'general', propertyId: '', expiryDate: '' })
      }
    } catch { /* ignore */ }
    setSubmitting(false)
  }

  const handleSendMessage = async () => {
    if (!messageForm.message || !currentUser) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/notices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Message: ${messageForm.type}`,
          content: messageForm.message,
          type: 'general',
          propertyId: messageForm.propertyId || properties[0]?.id,
          createdById: currentUser.id,
        }),
      })
      if (res.ok) {
        setSendMessageOpen(false)
        setMessageForm({ message: '', type: 'whatsapp', recipientType: 'all', propertyId: '' })
      }
    } catch { /* ignore */ }
    setSubmitting(false)
  }

  const handleExpireNotice = async (noticeId: string) => {
    try {
      // Update locally since there's no PATCH endpoint
      setNotices((prev) =>
        prev.map((n) => n.id === noticeId ? { ...n, isActive: false } : n)
      )
    } catch { /* ignore */ }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this notice?')) return
    try {
      const res = await fetch(`/api/notices/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setNotices((prev) => prev.filter((n) => n.id !== id))
      }
    } catch (error) {
      console.error('Failed to delete notice:', error)
    }
  }

  // ── Loading Skeleton ────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-64" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-lg" />
          ))}
        </div>
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
            <Megaphone className="h-6 w-6 text-emerald-600" />
            Communication
          </h1>
          <p className="text-muted-foreground mt-1">Manage notices and communicate with tenants and staff</p>
        </div>
        <div className="flex gap-2">
          {canCreate && (
          <Button onClick={() => setCreateNoticeOpen(true)} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
            <Plus className="h-4 w-4" />
            Create Notice
          </Button>
          )}
          <Button onClick={() => setSendMessageOpen(true)} variant="outline" className="gap-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50">
            <Send className="h-4 w-4" />
            Send Message
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="notices" className="space-y-4">
        <TabsList className="bg-emerald-50">
          <TabsTrigger value="notices" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
            <Bell className="h-4 w-4 mr-2" />
            Notice Board
          </TabsTrigger>
          <TabsTrigger value="messages" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
            <MessageSquare className="h-4 w-4 mr-2" />
            Messages
          </TabsTrigger>
        </TabsList>

        {/* Notice Board Tab */}
        <TabsContent value="notices" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-emerald-600" />
              <span className="text-sm font-medium text-gray-600">Filters:</span>
            </div>
            <Select value={noticeTypeFilter} onValueChange={setNoticeTypeFilter}>
              <SelectTrigger className="w-[150px] h-9">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(NOTICE_TYPE_CONFIG).map(([key, cfg]) => (
                  <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={noticePropertyFilter} onValueChange={setNoticePropertyFilter}>
              <SelectTrigger className="w-[180px] h-9">
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

          {/* Notices List */}
          {filteredNotices.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center">
                <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-muted-foreground font-medium">No notices found</p>
                <p className="text-sm text-muted-foreground mt-1">Create a notice to get started</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredNotices.map((notice) => {
                const typeConfig = NOTICE_TYPE_CONFIG[notice.type] || NOTICE_TYPE_CONFIG.general
                const expired = isExpired(notice.expiryDate) || !notice.isActive

                return (
                  <Card key={notice.id} className={`transition-all hover:shadow-md ${expired ? 'opacity-60' : 'border-emerald-200'}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base leading-tight">{notice.title}</CardTitle>
                        <Badge className={`${typeConfig.bg} ${typeConfig.color} border shrink-0 gap-1`}>
                          {typeConfig.icon}
                          {typeConfig.label}
                        </Badge>
                      </div>
                      {notice.property && (
                        <CardDescription className="flex items-center gap-1 mt-1">
                          <Building2 className="h-3 w-3" />
                          {notice.property.name}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-gray-600 line-clamp-3">{notice.content}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Created: {formatDate(notice.createdAt)}
                        </span>
                        {notice.expiryDate && (
                          <span className="flex items-center gap-1">
                            <CalendarDays className="h-3 w-3" />
                            Expires: {formatDate(notice.expiryDate)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t">
                        {expired ? (
                          <Badge variant="secondary" className="text-xs">Expired</Badge>
                        ) : (
                          <Badge className="bg-emerald-100 text-emerald-700 text-xs">Active</Badge>
                        )}
                        {notice.isActive && canUpdate && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 h-7"
                            onClick={() => handleExpireNotice(notice.id)}
                          >
                            Expire
                          </Button>
                        )}
                        {canUpdate && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-7"
                          >
                            <Pencil className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 h-7"
                            onClick={() => handleDelete(notice.id)}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* Messages Tab */}
        <TabsContent value="messages" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-emerald-600" />
              <span className="text-sm font-medium text-gray-600">Type:</span>
            </div>
            <Select value={messageTypeFilter} onValueChange={setMessageTypeFilter}>
              <SelectTrigger className="w-[160px] h-9">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(MESSAGE_TYPE_CONFIG).map(([key, cfg]) => (
                  <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Messages List */}
          {filteredCommunications.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center">
                <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-muted-foreground font-medium">No messages yet</p>
                <p className="text-sm text-muted-foreground mt-1">Send a message to tenants or staff</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredCommunications.map((msg) => {
                const typeConfig = MESSAGE_TYPE_CONFIG[msg.type] || MESSAGE_TYPE_CONFIG.whatsapp
                const statusConfig = STATUS_CONFIG[msg.status] || STATUS_CONFIG.sent

                return (
                  <Card key={msg.id} className="hover:shadow-sm transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`${statusConfig.color} mt-0.5`}>
                          {typeConfig.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-800">{msg.message}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              {typeConfig.icon}
                              {typeConfig.label}
                            </span>
                            <span className="capitalize">{msg.recipientType}</span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDateTime(msg.sentAt)}
                            </span>
                            <span className={`flex items-center gap-1 ${statusConfig.color}`}>
                              {statusConfig.icon}
                              {statusConfig.label}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Notice Dialog */}
      <Dialog open={createNoticeOpen} onOpenChange={setCreateNoticeOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-emerald-600" />
              Create Notice
            </DialogTitle>
            <DialogDescription>Post a new notice to the notice board for tenants and staff.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="notice-title">Title</Label>
              <Input
                id="notice-title"
                placeholder="Notice title"
                value={noticeForm.title}
                onChange={(e) => setNoticeForm((prev) => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notice-content">Content</Label>
              <Textarea
                id="notice-content"
                placeholder="Notice content..."
                rows={4}
                value={noticeForm.content}
                onChange={(e) => setNoticeForm((prev) => ({ ...prev, content: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={noticeForm.type} onValueChange={(v) => setNoticeForm((prev) => ({ ...prev, type: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(NOTICE_TYPE_CONFIG).map(([key, cfg]) => (
                      <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Property</Label>
                <Select value={noticeForm.propertyId} onValueChange={(v) => setNoticeForm((prev) => ({ ...prev, propertyId: v }))}>
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
            <div className="space-y-2">
              <Label htmlFor="notice-expiry">Expiry Date</Label>
              <Input
                id="notice-expiry"
                type="date"
                value={noticeForm.expiryDate}
                onChange={(e) => setNoticeForm((prev) => ({ ...prev, expiryDate: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateNoticeOpen(false)}>Cancel</Button>
            <Button
              onClick={handleCreateNotice}
              disabled={submitting || !noticeForm.title || !noticeForm.content || !noticeForm.propertyId}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Notice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Message Dialog */}
      <Dialog open={sendMessageOpen} onOpenChange={setSendMessageOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-emerald-600" />
              Send Message
            </DialogTitle>
            <DialogDescription>Send a message to tenants, staff, or specific individuals.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="msg-content">Message</Label>
              <Textarea
                id="msg-content"
                placeholder="Type your message..."
                rows={4}
                value={messageForm.message}
                onChange={(e) => setMessageForm((prev) => ({ ...prev, message: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={messageForm.type} onValueChange={(v) => setMessageForm((prev) => ({ ...prev, type: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(MESSAGE_TYPE_CONFIG).map(([key, cfg]) => (
                      <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Recipient Type</Label>
                <Select value={messageForm.recipientType} onValueChange={(v) => setMessageForm((prev) => ({ ...prev, recipientType: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="tenants">Tenants</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="specific">Specific</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Property (Optional)</Label>
              <Select value={messageForm.propertyId} onValueChange={(v) => setMessageForm((prev) => ({ ...prev, propertyId: v }))}>
                <SelectTrigger>
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendMessageOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSendMessage}
              disabled={submitting || !messageForm.message}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Send className="h-4 w-4 mr-2" />
              Send Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
