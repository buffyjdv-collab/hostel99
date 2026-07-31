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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Users,
  UserCheck,
  ShieldCheck,
  Clock,
  LogOut,
  UserPlus,
  Search,
  Eye,
  Pencil,
  Ban,
  MoreVertical,
  Loader2,
  Phone,
  Mail,
  Building2,
  BedDouble,
  IndianRupee,
  Calendar,
  FileText,
  CreditCard,
  User,
  Home,
  MapPin,
  Heart,
  Filter,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock4,
  BadgeCheck,
  FileCheck,
  FileX,
  FileClock,
  Trash2,
} from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────────

type TenantStatus = 'active' | 'inactive' | 'notice_period' | 'moved_out'
type KycStatus = 'pending' | 'verified' | 'rejected'
type AgreementStatus = 'pending' | 'signed' | 'expired'

interface TenantData {
  id: string
  userId?: string
  user?: { id: string; name: string; email: string; phone: string } | null
  name: string
  email?: string
  phone: string
  emergencyContact?: string
  emergencyPhone?: string
  fatherName?: string
  motherName?: string
  aadhaarNumber?: string
  panNumber?: string
  passportNumber?: string
  dateOfBirth?: string
  gender?: string
  occupation?: string
  company?: string
  permanentAddress?: string
  kycStatus: KycStatus
  policeVerified: boolean
  agreementStatus: AgreementStatus
  agreementStart?: string
  agreementEnd?: string
  propertyId: string
  property: { id: string; name: string; address?: string }
  roomId?: string
  room?: { id: string; name: string; number: string } | null
  bedId?: string
  bed?: { id: string; name: string; number: number } | null
  checkInDate?: string
  checkOutDate?: string
  status: TenantStatus
  rentAmount: number
  depositAmount: number
  depositStatus: string
  createdAt: string
  updatedAt: string
  payments?: PaymentData[]
}

interface PaymentData {
  id: string
  amount: number
  paymentMethod: string
  paymentType: string
  status: string
  dueDate: string
  paidDate?: string
  month: number
  year: number
  receiptNumber?: string
}

interface PropertyInfo {
  id: string
  name: string
}

interface RoomInfo {
  id: string
  name: string
  number: string
  propertyId: string
  totalBeds: number
  occupiedBeds: number
}

interface BedInfo {
  id: string
  name: string
  number: number
  roomId: string
  status: string
}

interface TenantFormData {
  name: string
  email: string
  phone: string
  dateOfBirth: string
  gender: string
  occupation: string
  company: string
  permanentAddress: string
  emergencyContact: string
  emergencyPhone: string
  fatherName: string
  motherName: string
  aadhaarNumber: string
  panNumber: string
  propertyId: string
  roomId: string
  bedId: string
  rentAmount: string
  depositAmount: string
  agreementStart: string
  agreementEnd: string
}

// ── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<TenantStatus, { label: string; bgClass: string; textClass: string; dotClass: string }> = {
  active: { label: 'Active', bgClass: 'bg-emerald-100 dark:bg-emerald-950/50', textClass: 'text-emerald-700 dark:text-emerald-300', dotClass: 'bg-emerald-500' },
  inactive: { label: 'Inactive', bgClass: 'bg-gray-100 dark:bg-gray-950/50', textClass: 'text-gray-700 dark:text-gray-300', dotClass: 'bg-gray-500' },
  notice_period: { label: 'Notice Period', bgClass: 'bg-amber-100 dark:bg-amber-950/50', textClass: 'text-amber-700 dark:text-amber-300', dotClass: 'bg-amber-500' },
  moved_out: { label: 'Moved Out', bgClass: 'bg-red-100 dark:bg-red-950/50', textClass: 'text-red-700 dark:text-red-300', dotClass: 'bg-red-500' },
}

const KYC_CONFIG: Record<KycStatus, { label: string; bgClass: string; textClass: string; icon: typeof BadgeCheck }> = {
  verified: { label: 'Verified', bgClass: 'bg-emerald-100 dark:bg-emerald-950/50', textClass: 'text-emerald-700 dark:text-emerald-300', icon: CheckCircle2 },
  pending: { label: 'Pending', bgClass: 'bg-amber-100 dark:bg-amber-950/50', textClass: 'text-amber-700 dark:text-amber-300', icon: Clock4 },
  rejected: { label: 'Rejected', bgClass: 'bg-red-100 dark:bg-red-950/50', textClass: 'text-red-700 dark:text-red-300', icon: XCircle },
}

const AGREEMENT_CONFIG: Record<AgreementStatus, { label: string; bgClass: string; textClass: string }> = {
  pending: { label: 'Pending', bgClass: 'bg-amber-100 dark:bg-amber-950/50', textClass: 'text-amber-700 dark:text-amber-300' },
  signed: { label: 'Signed', bgClass: 'bg-emerald-100 dark:bg-emerald-950/50', textClass: 'text-emerald-700 dark:text-emerald-300' },
  expired: { label: 'Expired', bgClass: 'bg-red-100 dark:bg-red-950/50', textClass: 'text-red-700 dark:text-red-300' },
}

const PAYMENT_STATUS_CONFIG: Record<string, { label: string; bgClass: string; textClass: string }> = {
  paid: { label: 'Paid', bgClass: 'bg-emerald-100 dark:bg-emerald-950/50', textClass: 'text-emerald-700 dark:text-emerald-300' },
  pending: { label: 'Pending', bgClass: 'bg-amber-100 dark:bg-amber-950/50', textClass: 'text-amber-700 dark:text-amber-300' },
  overdue: { label: 'Overdue', bgClass: 'bg-red-100 dark:bg-red-950/50', textClass: 'text-red-700 dark:text-red-300' },
  failed: { label: 'Failed', bgClass: 'bg-red-100 dark:bg-red-950/50', textClass: 'text-red-700 dark:text-red-300' },
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

function TenantDetailDialog({
  tenant,
  open,
  onClose,
}: {
  tenant: TenantData | null
  open: boolean
  onClose: () => void
}) {
  if (!tenant) return null

  const statusCfg = STATUS_CONFIG[tenant.status]
  const kycCfg = KYC_CONFIG[tenant.kycStatus]
  const agreementCfg = AGREEMENT_CONFIG[tenant.agreementStatus]

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center">
              <User className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <div>{tenant.name}</div>
              <div className="text-sm font-normal text-slate-500 flex items-center gap-2">
                <Badge variant="secondary" className={`${statusCfg.bgClass} ${statusCfg.textClass} text-xs`}>
                  <div className={`h-1.5 w-1.5 rounded-full ${statusCfg.dotClass} mr-1`} />
                  {statusCfg.label}
                </Badge>
                <Badge variant="secondary" className={`${kycCfg.bgClass} ${kycCfg.textClass} text-xs`}>
                  KYC: {kycCfg.label}
                </Badge>
              </div>
            </div>
          </DialogTitle>
          <DialogDescription>
            Tenant details and management
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="profile" className="mt-2">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="kyc">KYC</TabsTrigger>
            <TabsTrigger value="agreement">Agreement</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="room">Room</TabsTrigger>
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
                    <span className="font-medium">{tenant.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Phone</span>
                    <span className="font-medium">{tenant.phone}</span>
                  </div>
                  {tenant.email && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Email</span>
                      <span className="font-medium">{tenant.email}</span>
                    </div>
                  )}
                  {tenant.dateOfBirth && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Date of Birth</span>
                      <span className="font-medium">{formatDate(tenant.dateOfBirth)}</span>
                    </div>
                  )}
                  {tenant.gender && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Gender</span>
                      <span className="font-medium capitalize">{tenant.gender}</span>
                    </div>
                  )}
                  {tenant.occupation && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Occupation</span>
                      <span className="font-medium">{tenant.occupation}</span>
                    </div>
                  )}
                  {tenant.company && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Company</span>
                      <span className="font-medium">{tenant.company}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-500">Contact &amp; Family</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {tenant.permanentAddress && (
                    <div>
                      <span className="text-slate-500">Permanent Address</span>
                      <p className="font-medium mt-0.5">{tenant.permanentAddress}</p>
                    </div>
                  )}
                  {tenant.emergencyContact && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Emergency Contact</span>
                      <span className="font-medium">{tenant.emergencyContact}</span>
                    </div>
                  )}
                  {tenant.emergencyPhone && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Emergency Phone</span>
                      <span className="font-medium">{tenant.emergencyPhone}</span>
                    </div>
                  )}
                  {tenant.fatherName && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Father&apos;s Name</span>
                      <span className="font-medium">{tenant.fatherName}</span>
                    </div>
                  )}
                  {tenant.motherName && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Mother&apos;s Name</span>
                      <span className="font-medium">{tenant.motherName}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* KYC Tab */}
          <TabsContent value="kyc" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-500">KYC Verification Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                      <FileText className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Aadhaar Card</p>
                      <p className="text-xs text-slate-500">{tenant.aadhaarNumber || 'Not provided'}</p>
                    </div>
                  </div>
                  {tenant.aadhaarNumber ? (
                    <Badge className="bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300">
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Submitted
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-gray-100 dark:bg-gray-950/50 text-gray-500">
                      Not Submitted
                    </Badge>
                  )}
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                      <FileText className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">PAN Card</p>
                      <p className="text-xs text-slate-500">{tenant.panNumber || 'Not provided'}</p>
                    </div>
                  </div>
                  {tenant.panNumber ? (
                    <Badge className="bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300">
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Submitted
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-gray-100 dark:bg-gray-950/50 text-gray-500">
                      Not Submitted
                    </Badge>
                  )}
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                      <FileText className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Passport</p>
                      <p className="text-xs text-slate-500">{tenant.passportNumber || 'Not provided'}</p>
                    </div>
                  </div>
                  {tenant.passportNumber ? (
                    <Badge className="bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300">
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Submitted
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-gray-100 dark:bg-gray-950/50 text-gray-500">
                      Not Submitted
                    </Badge>
                  )}
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                      <ShieldCheck className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Police Verification</p>
                      <p className="text-xs text-slate-500">Local police station verification</p>
                    </div>
                  </div>
                  {tenant.policeVerified ? (
                    <Badge className="bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300">
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Verified
                    </Badge>
                  ) : (
                    <Badge className="bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300">
                      <Clock4 className="h-3 w-3 mr-1" /> Pending
                    </Badge>
                  )}
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                      <BadgeCheck className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Overall KYC Status</p>
                    </div>
                  </div>
                  <Badge className={`${kycCfg.bgClass} ${kycCfg.textClass}`}>
                    {tenant.kycStatus === 'verified' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                    {tenant.kycStatus === 'pending' && <Clock4 className="h-3 w-3 mr-1" />}
                    {tenant.kycStatus === 'rejected' && <XCircle className="h-3 w-3 mr-1" />}
                    {kycCfg.label}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Agreement Tab */}
          <TabsContent value="agreement" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-500">Agreement Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                    <p className="text-xs text-slate-500 mb-1">Agreement Status</p>
                    <Badge className={`${agreementCfg.bgClass} ${agreementCfg.textClass}`}>
                      {agreementCfg.label}
                    </Badge>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                    <p className="text-xs text-slate-500 mb-1">Start Date</p>
                    <p className="text-sm font-medium">{formatDate(tenant.agreementStart)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                    <p className="text-xs text-slate-500 mb-1">End Date</p>
                    <p className="text-sm font-medium">{formatDate(tenant.agreementEnd)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                    <p className="text-xs text-slate-500 mb-1">Deposit Status</p>
                    <Badge variant="secondary" className="text-xs capitalize">
                      {tenant.depositStatus || 'pending'}
                    </Badge>
                  </div>
                </div>
                {tenant.agreementEnd && new Date(tenant.agreementEnd) < new Date() && tenant.agreementStatus !== 'expired' && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 text-sm">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    Agreement has expired. Please renew or update status.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-500">Payment History</CardTitle>
              </CardHeader>
              <CardContent>
                {(!tenant.payments || tenant.payments.length === 0) ? (
                  <div className="text-center py-8 text-sm text-slate-400">
                    No payment records found
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Period</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Paid Date</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tenant.payments.map((p) => {
                        const pCfg = PAYMENT_STATUS_CONFIG[p.status] || PAYMENT_STATUS_CONFIG.pending
                        return (
                          <TableRow key={p.id}>
                            <TableCell className="font-medium">
                              {new Date(0, p.month - 1).toLocaleString('en-IN', { month: 'short' })} {p.year}
                            </TableCell>
                            <TableCell>{formatCurrency(p.amount)}</TableCell>
                            <TableCell className="capitalize">{p.paymentMethod?.replace('_', ' ') || '—'}</TableCell>
                            <TableCell>{formatDate(p.dueDate)}</TableCell>
                            <TableCell>{formatDate(p.paidDate)}</TableCell>
                            <TableCell>
                              <Badge className={`${pCfg.bgClass} ${pCfg.textClass} text-xs`}>
                                {pCfg.label}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Room Tab */}
          <TabsContent value="room" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-500">Room &amp; Bed Assignment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                    <p className="text-xs text-slate-500 mb-1">Property</p>
                    <div className="flex items-center gap-1.5 text-sm font-medium">
                      <Building2 className="h-4 w-4 text-slate-400" />
                      {tenant.property?.name || '—'}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                    <p className="text-xs text-slate-500 mb-1">Room</p>
                    <div className="flex items-center gap-1.5 text-sm font-medium">
                      <BedDouble className="h-4 w-4 text-slate-400" />
                      {tenant.room?.name || '—'}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                    <p className="text-xs text-slate-500 mb-1">Bed</p>
                    <div className="flex items-center gap-1.5 text-sm font-medium">
                      <Home className="h-4 w-4 text-slate-400" />
                      {tenant.bed?.name || '—'}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                    <p className="text-xs text-slate-500 mb-1">Check-in Date</p>
                    <p className="text-sm font-medium">{formatDate(tenant.checkInDate)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                    <p className="text-xs text-slate-500 mb-1">Monthly Rent</p>
                    <p className="text-sm font-medium">{formatCurrency(tenant.rentAmount)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                    <p className="text-xs text-slate-500 mb-1">Security Deposit</p>
                    <p className="text-sm font-medium">{formatCurrency(tenant.depositAmount)}</p>
                  </div>
                </div>
                {tenant.checkOutDate && (
                  <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30">
                    <p className="text-xs text-amber-600 dark:text-amber-400 mb-1">Check-out Date</p>
                    <p className="text-sm font-medium text-amber-700 dark:text-amber-300">{formatDate(tenant.checkOutDate)}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="text-xs text-slate-400 pt-2 border-t">
          Created on {formatDate(tenant.createdAt)} · Last updated {formatDate(tenant.updatedAt)}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Main Component ───────────────────────────────────────────────────────────

export function TenantsPage() {
  const { currentUser, currentHostelId } = useAppStore()
  const role = currentUser?.role || ''
  const canCreate = hasPermission(role, 'tenants:create')
  const canUpdate = hasPermission(role, 'tenants:update')
  const canDelete = hasPermission(role, 'tenants:delete')

  // Data state
  const [tenants, setTenants] = useState<TenantData[]>([])
  const [properties, setProperties] = useState<PropertyInfo[]>([])
  const [rooms, setRooms] = useState<RoomInfo[]>([])
  const [beds, setBeds] = useState<BedInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // UI state
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [selectedTenant, setSelectedTenant] = useState<TenantData | null>(null)
  const [showDetailDialog, setShowDetailDialog] = useState(false)

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    phone: '',
    emergencyContact: '',
    status: 'active' as TenantStatus,
  })
  const [submittingEdit, setSubmittingEdit] = useState(false)

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)

  const { toast } = useToast()

  // Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterKyc, setFilterKyc] = useState<string>('all')
  const [filterProperty, setFilterProperty] = useState<string>('all')

  // Sort state
  const [sortField, setSortField] = useState<string>('createdAt')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  // Form state
  const [form, setForm] = useState<TenantFormData>({
    name: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    occupation: '',
    company: '',
    permanentAddress: '',
    emergencyContact: '',
    emergencyPhone: '',
    fatherName: '',
    motherName: '',
    aadhaarNumber: '',
    panNumber: '',
    propertyId: '',
    roomId: '',
    bedId: '',
    rentAmount: '',
    depositAmount: '',
    agreementStart: '',
    agreementEnd: '',
  })

  // ── Data Fetching ──────────────────────────────────────────────────────────

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const [tenantsRes, propsRes] = await Promise.all([
          fetch('/api/tenants' + (currentHostelId ? `?propertyId=${currentHostelId}` : '')),
          fetch('/api/properties' + (currentHostelId ? `?propertyId=${currentHostelId}` : '')),
        ])
        if (tenantsRes.ok) {
          const data = await tenantsRes.json()
          setTenants(Array.isArray(data) ? data : data.tenants || [])
        }
        if (propsRes.ok) {
          const data = await propsRes.json()
          setProperties(Array.isArray(data) ? data : data.properties || [])
        }
      } catch (err) {
        console.error('Failed to fetch tenants data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [currentHostelId])

  // Fetch rooms when property changes in form
  useEffect(() => {
    if (!form.propertyId) {
      setRooms([])
      setBeds([])
      return
    }
    async function fetchRooms() {
      try {
        const res = await fetch(`/api/rooms?propertyId=${form.propertyId}`)
        if (res.ok) {
          const data = await res.json()
          const roomList = Array.isArray(data) ? data : data.rooms || []
          setRooms(roomList)
        }
      } catch (err) {
        console.error('Failed to fetch rooms:', err)
      }
    }
    fetchRooms()
  }, [form.propertyId])

  // Fetch beds when room changes in form
  useEffect(() => {
    if (!form.roomId) {
      setBeds([])
      return
    }
    async function fetchBeds() {
      try {
        const res = await fetch(`/api/rooms?propertyId=${form.propertyId}`)
        if (res.ok) {
          const data = await res.json()
          const roomList = Array.isArray(data) ? data : data.rooms || []
          const selectedRoom = roomList.find((r: RoomInfo) => r.id === form.roomId)
          if (selectedRoom?.beds) {
            setBeds(selectedRoom.beds.filter((b: BedInfo) => b.status === 'available'))
          }
        }
      } catch (err) {
        console.error('Failed to fetch beds:', err)
      }
    }
    fetchBeds()
  }, [form.roomId, form.propertyId])

  // ── Computed Values ────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const total = tenants.length
    const active = tenants.filter((t) => t.status === 'active').length
    const kycVerified = tenants.filter((t) => t.kycStatus === 'verified').length
    const pendingKyc = tenants.filter((t) => t.kycStatus === 'pending').length
    const noticePeriod = tenants.filter((t) => t.status === 'notice_period').length
    return { total, active, kycVerified, pendingKyc, noticePeriod }
  }, [tenants])

  const filteredAndSortedTenants = useMemo(() => {
    let result = [...tenants]

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.phone.toLowerCase().includes(q)
      )
    }
    if (filterStatus !== 'all') {
      result = result.filter((t) => t.status === filterStatus)
    }
    if (filterKyc !== 'all') {
      result = result.filter((t) => t.kycStatus === filterKyc)
    }
    if (filterProperty !== 'all') {
      result = result.filter((t) => t.propertyId === filterProperty)
    }

    result.sort((a, b) => {
      const aVal = a[sortField as keyof TenantData]
      const bVal = b[sortField as keyof TenantData]
      if (aVal == null && bVal == null) return 0
      if (aVal == null) return 1
      if (bVal == null) return -1
      const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true })
      return sortDir === 'asc' ? cmp : -cmp
    })

    return result
  }, [tenants, searchQuery, filterStatus, filterKyc, filterProperty, sortField, sortDir])

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

  async function handleAddTenant() {
    if (!form.name || !form.phone || !form.propertyId) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email || undefined,
          phone: form.phone,
          dateOfBirth: form.dateOfBirth || undefined,
          gender: form.gender || undefined,
          occupation: form.occupation || undefined,
          company: form.company || undefined,
          permanentAddress: form.permanentAddress || undefined,
          emergencyContact: form.emergencyContact || undefined,
          emergencyPhone: form.emergencyPhone || undefined,
          fatherName: form.fatherName || undefined,
          motherName: form.motherName || undefined,
          aadhaarNumber: form.aadhaarNumber || undefined,
          panNumber: form.panNumber || undefined,
          propertyId: form.propertyId,
          roomId: form.roomId || undefined,
          bedId: form.bedId || undefined,
          rentAmount: form.rentAmount ? parseFloat(form.rentAmount) : 0,
          depositAmount: form.depositAmount ? parseFloat(form.depositAmount) : 0,
          agreementStart: form.agreementStart || undefined,
          agreementEnd: form.agreementEnd || undefined,
          userId: currentUser?.id,
        }),
      })
      if (res.ok) {
        const newTenant = await res.json()
        setTenants((prev) => [newTenant, ...prev])
        setShowAddDialog(false)
        setForm({
          name: '',
          email: '',
          phone: '',
          dateOfBirth: '',
          gender: '',
          occupation: '',
          company: '',
          permanentAddress: '',
          emergencyContact: '',
          emergencyPhone: '',
          fatherName: '',
          motherName: '',
          aadhaarNumber: '',
          panNumber: '',
          propertyId: '',
          roomId: '',
          bedId: '',
          rentAmount: '',
          depositAmount: '',
          agreementStart: '',
          agreementEnd: '',
        })
      }
    } catch (err) {
      console.error('Failed to add tenant:', err)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDeactivate(tenantId: string) {
    try {
      const res = await fetch('/api/tenants', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: tenantId, status: 'inactive' }),
      })
      if (res.ok) {
        setTenants((prev) =>
          prev.map((t) => (t.id === tenantId ? { ...t, status: 'inactive' } : t))
        )
      }
    } catch (err) {
      console.error('Failed to deactivate tenant:', err)
    }
  }

  function openTenantDetail(tenant: TenantData) {
    setSelectedTenant(tenant)
    setShowDetailDialog(true)
  }

  function openEditDialog(tenant: TenantData) {
    setSelectedTenant(tenant)
    setEditFormData({
      name: tenant.name,
      email: tenant.email || '',
      phone: tenant.phone,
      emergencyContact: tenant.emergencyContact || '',
      status: tenant.status,
    })
    setEditDialogOpen(true)
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedTenant || !editFormData.name.trim()) {
      toast({ title: 'Validation Error', description: 'Tenant name is required', variant: 'destructive' })
      return
    }
    try {
      setSubmittingEdit(true)
      const res = await fetch('/api/tenants', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedTenant.id,
          name: editFormData.name.trim(),
          email: editFormData.email.trim() || undefined,
          phone: editFormData.phone.trim(),
          emergencyContact: editFormData.emergencyContact.trim() || undefined,
          status: editFormData.status,
        }),
      })
      if (res.ok) {
        toast({ title: 'Success', description: 'Tenant updated successfully' })
        setEditDialogOpen(false)
        setSelectedTenant(null)
        // Refresh data
        try {
          const tenantsRes = await fetch('/api/tenants' + (currentHostelId ? `?propertyId=${currentHostelId}` : ''))
          if (tenantsRes.ok) {
            const data = await tenantsRes.json()
            setTenants(Array.isArray(data) ? data : data.tenants || [])
          }
        } catch {}
      } else {
        const data = await res.json()
        toast({ title: 'Error', description: data.error || 'Failed to update tenant', variant: 'destructive' })
      }
    } catch (error) {
      console.error('Failed to update tenant:', error)
      toast({ title: 'Error', description: 'Failed to update tenant', variant: 'destructive' })
    } finally {
      setSubmittingEdit(false)
    }
  }

  function handleDelete(id: string) {
    const tenant = tenants.find((t) => t.id === id)
    if (!tenant) return
    setDeleteTarget({ id: tenant.id, name: tenant.name })
    setDeleteDialogOpen(true)
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return
    try {
      setSubmittingEdit(true)
      const res = await fetch(`/api/tenants/${deleteTarget.id}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: 'Success', description: `${deleteTarget.name} has been deleted` })
        setTenants((prev) => prev.filter((t) => t.id !== deleteTarget.id))
      } else {
        toast({ title: 'Error', description: 'Failed to delete tenant', variant: 'destructive' })
      }
    } catch (error) {
      console.error('Failed to delete tenant:', error)
      toast({ title: 'Error', description: 'Failed to delete tenant', variant: 'destructive' })
    } finally {
      setSubmittingEdit(false)
      setDeleteDialogOpen(false)
      setDeleteTarget(null)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Tenants</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage tenant profiles, KYC, and room assignments
          </p>
        </div>
        {canCreate && (
        <Button
          onClick={() => setShowAddDialog(true)}
          className="bg-emerald-600 hover:bg-emerald-700 shrink-0"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Add Tenant
        </Button>
        )}
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
                  <p className="text-sm text-slate-500 dark:text-slate-400">Total Tenants</p>
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
                  <p className="text-sm text-slate-500 dark:text-slate-400">Active</p>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.active}</p>
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
                  <p className="text-sm text-slate-500 dark:text-slate-400">KYC Verified</p>
                  <p className="text-2xl font-bold text-teal-600 dark:text-teal-400">{stats.kycVerified}</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-teal-100 dark:bg-teal-950/50 flex items-center justify-center">
                  <ShieldCheck className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Pending KYC</p>
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.pendingKyc}</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="col-span-2 sm:col-span-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Notice Period</p>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.noticePeriod}</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-orange-100 dark:bg-orange-950/50 flex items-center justify-center">
                  <LogOut className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by name or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 w-56 h-9"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-36 h-9">
              <Filter className="h-3.5 w-3.5 mr-1 text-slate-400" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterKyc} onValueChange={setFilterKyc}>
            <SelectTrigger className="w-36 h-9">
              <SelectValue placeholder="KYC Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All KYC</SelectItem>
              {Object.entries(KYC_CONFIG).map(([key, cfg]) => (
                <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
              ))}
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

      {/* Tenant Table */}
      {loading ? (
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
                  <TableHead>Email</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Room / Bed</TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort('rentAmount')}>
                    <div className="flex items-center gap-1">Rent <SortIcon field="rentAmount" /></div>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort('status')}>
                    <div className="flex items-center gap-1">Status <SortIcon field="status" /></div>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort('kycStatus')}>
                    <div className="flex items-center gap-1">KYC <SortIcon field="kycStatus" /></div>
                  </TableHead>
                  <TableHead>Agreement</TableHead>
                  <TableHead className="w-10">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedTenants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-slate-400">
                      No tenants found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAndSortedTenants.map((tenant) => {
                    const statusCfg = STATUS_CONFIG[tenant.status]
                    const kycCfg = KYC_CONFIG[tenant.kycStatus]
                    const agreementCfg = AGREEMENT_CONFIG[tenant.agreementStatus]

                    return (
                      <TableRow
                        key={tenant.id}
                        className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        onClick={() => openTenantDetail(tenant)}
                      >
                        <TableCell className="font-medium">{tenant.name}</TableCell>
                        <TableCell className="text-slate-600 dark:text-slate-400">{tenant.phone}</TableCell>
                        <TableCell className="text-slate-600 dark:text-slate-400">{tenant.email || '—'}</TableCell>
                        <TableCell className="text-slate-600 dark:text-slate-400">{tenant.property?.name || '—'}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {tenant.room?.name || '—'}
                            {tenant.bed?.name && (
                              <span className="text-slate-400"> / {tenant.bed.name}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{formatCurrency(tenant.rentAmount)}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={`${statusCfg.bgClass} ${statusCfg.textClass} text-xs`}>
                            <div className={`h-1.5 w-1.5 rounded-full ${statusCfg.dotClass} mr-1`} />
                            {statusCfg.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={`${kycCfg.bgClass} ${kycCfg.textClass} text-xs`}>
                            {kycCfg.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={`${agreementCfg.bgClass} ${agreementCfg.textClass} text-xs`}>
                            {agreementCfg.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openTenantDetail(tenant) }}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              {canUpdate && (
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEditDialog(tenant) }}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              )}
                              {tenant.status === 'active' && (
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={(e) => { e.stopPropagation(); handleDeactivate(tenant.id) }}
                                >
                                  <Ban className="h-4 w-4 mr-2" />
                                  Deactivate
                                </DropdownMenuItem>
                              )}
                              {canDelete && (
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={(e) => { e.stopPropagation(); handleDelete(tenant.id) }}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
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
      )}

      {/* Add Tenant Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Tenant</DialogTitle>
            <DialogDescription>
              Enter tenant details to register them in the system
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 py-4">
            {/* Personal Information */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                <User className="h-4 w-4 text-emerald-600" />
                Personal Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tenant-name">Name *</Label>
                  <Input
                    id="tenant-name"
                    placeholder="Full name"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tenant-phone">Phone *</Label>
                  <Input
                    id="tenant-phone"
                    placeholder="Phone number"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tenant-email">Email</Label>
                  <Input
                    id="tenant-email"
                    type="email"
                    placeholder="Email address"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tenant-dob">Date of Birth</Label>
                  <Input
                    id="tenant-dob"
                    type="date"
                    value={form.dateOfBirth}
                    onChange={(e) => setForm((f) => ({ ...f, dateOfBirth: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tenant-gender">Gender</Label>
                  <Select value={form.gender} onValueChange={(v) => setForm((f) => ({ ...f, gender: v }))}>
                    <SelectTrigger id="tenant-gender">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tenant-occupation">Occupation</Label>
                  <Input
                    id="tenant-occupation"
                    placeholder="e.g., Software Engineer"
                    value={form.occupation}
                    onChange={(e) => setForm((f) => ({ ...f, occupation: e.target.value }))}
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="tenant-company">Company</Label>
                  <Input
                    id="tenant-company"
                    placeholder="Company name"
                    value={form.company}
                    onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* Address */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-emerald-600" />
                Address
              </h3>
              <div className="space-y-2">
                <Label htmlFor="tenant-address">Permanent Address</Label>
                <Textarea
                  id="tenant-address"
                  placeholder="Full permanent address"
                  value={form.permanentAddress}
                  onChange={(e) => setForm((f) => ({ ...f, permanentAddress: e.target.value }))}
                  rows={2}
                />
              </div>
            </div>

            {/* Emergency Contact */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                <Heart className="h-4 w-4 text-emerald-600" />
                Emergency Contact
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tenant-emergency-name">Contact Name</Label>
                  <Input
                    id="tenant-emergency-name"
                    placeholder="Emergency contact name"
                    value={form.emergencyContact}
                    onChange={(e) => setForm((f) => ({ ...f, emergencyContact: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tenant-emergency-phone">Contact Phone</Label>
                  <Input
                    id="tenant-emergency-phone"
                    placeholder="Emergency contact phone"
                    value={form.emergencyPhone}
                    onChange={(e) => setForm((f) => ({ ...f, emergencyPhone: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* Family Information */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                <Users className="h-4 w-4 text-emerald-600" />
                Family Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tenant-father">Father&apos;s Name</Label>
                  <Input
                    id="tenant-father"
                    placeholder="Father's name"
                    value={form.fatherName}
                    onChange={(e) => setForm((f) => ({ ...f, fatherName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tenant-mother">Mother&apos;s Name</Label>
                  <Input
                    id="tenant-mother"
                    placeholder="Mother's name"
                    value={form.motherName}
                    onChange={(e) => setForm((f) => ({ ...f, motherName: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* KYC */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                KYC Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tenant-aadhaar">Aadhaar Number</Label>
                  <Input
                    id="tenant-aadhaar"
                    placeholder="XXXX XXXX XXXX"
                    value={form.aadhaarNumber}
                    onChange={(e) => setForm((f) => ({ ...f, aadhaarNumber: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tenant-pan">PAN Number</Label>
                  <Input
                    id="tenant-pan"
                    placeholder="ABCDE1234F"
                    value={form.panNumber}
                    onChange={(e) => setForm((f) => ({ ...f, panNumber: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* Assignment */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-emerald-600" />
                Room Assignment
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tenant-property">Property *</Label>
                  <Select value={form.propertyId} onValueChange={(v) => setForm((f) => ({ ...f, propertyId: v, roomId: '', bedId: '' }))}>
                    <SelectTrigger id="tenant-property">
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
                  <Label htmlFor="tenant-room">Room</Label>
                  <Select value={form.roomId} onValueChange={(v) => setForm((f) => ({ ...f, roomId: v, bedId: '' }))} disabled={!form.propertyId || rooms.length === 0}>
                    <SelectTrigger id="tenant-room">
                      <SelectValue placeholder={rooms.length ? 'Select room' : 'No rooms'} />
                    </SelectTrigger>
                    <SelectContent>
                      {rooms.map((r) => (
                        <SelectItem key={r.id} value={r.id}>{r.name} ({r.number})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tenant-bed">Bed</Label>
                  <Select value={form.bedId} onValueChange={(v) => setForm((f) => ({ ...f, bedId: v }))} disabled={!form.roomId || beds.length === 0}>
                    <SelectTrigger id="tenant-bed">
                      <SelectValue placeholder={beds.length ? 'Select bed' : 'No beds'} />
                    </SelectTrigger>
                    <SelectContent>
                      {beds.map((b) => (
                        <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Rent & Agreement */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-emerald-600" />
                Rent &amp; Agreement
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tenant-rent">Rent Amount</Label>
                  <Input
                    id="tenant-rent"
                    type="number"
                    placeholder="Monthly rent"
                    value={form.rentAmount}
                    onChange={(e) => setForm((f) => ({ ...f, rentAmount: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tenant-deposit">Deposit Amount</Label>
                  <Input
                    id="tenant-deposit"
                    type="number"
                    placeholder="Security deposit"
                    value={form.depositAmount}
                    onChange={(e) => setForm((f) => ({ ...f, depositAmount: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tenant-agreement-start">Agreement Start</Label>
                  <Input
                    id="tenant-agreement-start"
                    type="date"
                    value={form.agreementStart}
                    onChange={(e) => setForm((f) => ({ ...f, agreementStart: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tenant-agreement-end">Agreement End</Label>
                  <Input
                    id="tenant-agreement-end"
                    type="date"
                    value={form.agreementEnd}
                    onChange={(e) => setForm((f) => ({ ...f, agreementEnd: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddTenant}
              disabled={submitting || !form.name || !form.phone || !form.propertyId}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add Tenant
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tenant Detail Dialog */}
      <TenantDetailDialog
        tenant={selectedTenant}
        open={showDetailDialog}
        onClose={() => setShowDetailDialog(false)}
      />

      {/* ── Edit Tenant Dialog ────────────────────────────────────────────────── */}
      <Dialog open={editDialogOpen} onOpenChange={(open) => { setEditDialogOpen(open); if (!open) setSelectedTenant(null) }}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Tenant</DialogTitle>
            <DialogDescription>
              Update the tenant details below.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Name */}
              <div className="sm:col-span-2 space-y-2">
                <Label htmlFor="edit-tenant-name">Name *</Label>
                <Input
                  id="edit-tenant-name"
                  placeholder="Tenant name"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData((prev) => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="edit-tenant-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="edit-tenant-email"
                    type="email"
                    placeholder="email@example.com"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData((prev) => ({ ...prev, email: e.target.value }))}
                    className="pl-9"
                  />
                </div>
              </div>
              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="edit-tenant-phone">Phone *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="edit-tenant-phone"
                    placeholder="+91 9876543210"
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData((prev) => ({ ...prev, phone: e.target.value }))}
                    className="pl-9"
                  />
                </div>
              </div>
              {/* Emergency Contact */}
              <div className="space-y-2">
                <Label htmlFor="edit-tenant-emergency">Emergency Contact</Label>
                <Input
                  id="edit-tenant-emergency"
                  placeholder="Emergency contact name"
                  value={editFormData.emergencyContact}
                  onChange={(e) => setEditFormData((prev) => ({ ...prev, emergencyContact: e.target.value }))}
                />
              </div>
              {/* Status */}
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={editFormData.status}
                  onValueChange={(v) => setEditFormData((prev) => ({ ...prev, status: v as TenantStatus }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                      <SelectItem key={key} value={key}>
                        {cfg.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
                Update Tenant
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation Dialog ─────────────────────────────────────────── */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tenant</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This action cannot be undone. The tenant will be permanently removed from the system.
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
