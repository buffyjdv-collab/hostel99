'use client'

import { useAppStore, type Page, canAccessPage, type UserRole } from '@/lib/store'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Building2,
  DoorOpen,
  Users,
  UserCheck,
  IndianRupee,
  MessageSquareWarning,
  UserCog,
  Receipt,
  BarChart3,
  Megaphone,
  LogIn,
  Shield,
  Home,
  Settings,
  Package,
  Truck,
  ShoppingCart,
  ChefHat,
  UtensilsCrossed,
  Armchair,
  X,
  LogOut,
  UserCircle,
  UsersRound,
  ShieldCheck,
  Eye,
  ChevronRight,
  Hotel,
} from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
import { useState } from 'react'

const navItems: { page: Page; label: string; icon: React.ElementType; badge?: string; section?: string }[] = [
  { page: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, section: 'main' },
  { page: 'hostels', label: 'Hostels', icon: Hotel, section: 'main' },
  { page: 'properties', label: 'Properties', icon: Building2, section: 'main' },
  { page: 'rooms', label: 'Rooms & Beds', icon: DoorOpen, section: 'main' },
  { page: 'leads', label: 'Lead CRM', icon: Users, section: 'main' },
  { page: 'tenants', label: 'Tenants', icon: UserCheck, section: 'main' },
  { page: 'payments', label: 'Payments', icon: IndianRupee, badge: 'Funds', section: 'main' },
  { page: 'complaints', label: 'Complaints', icon: MessageSquareWarning, section: 'main' },
  { page: 'staff', label: 'Staff', icon: UserCog, section: 'main' },
  { page: 'expenses', label: 'Accounting', icon: Receipt, section: 'main' },
  { page: 'users', label: 'User Mgmt', icon: UsersRound, section: 'main' },
  { page: 'role-management', label: 'Role & Access', icon: ShieldCheck, section: 'main' },
  { page: 'inventory', label: 'Inventory', icon: Package, section: 'inventory' },
  { page: 'vendors', label: 'Vendors', icon: Truck, section: 'inventory' },
  { page: 'purchases', label: 'Purchases', icon: ShoppingCart, section: 'inventory' },
  { page: 'kitchen', label: 'Kitchen & Menu', icon: ChefHat, section: 'inventory' },
  { page: 'mess', label: 'Mess & Dining', icon: UtensilsCrossed, section: 'inventory' },
  { page: 'assets', label: 'Assets & Laundry', icon: Armchair, section: 'inventory' },
  { page: 'reports', label: 'Reports', icon: BarChart3, section: 'main' },
  { page: 'notices', label: 'Communication', icon: Megaphone, section: 'main' },
  { page: 'visitors', label: 'Visitors', icon: LogIn, section: 'main' },
  { page: 'settings', label: 'Settings', icon: Settings, section: 'main' },
]

const roleLabels: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  owner: 'Owner',
  manager: 'Manager',
  staff: 'Staff',
  tenant: 'Tenant',
}

const roleColors: Record<UserRole, string> = {
  super_admin: 'text-red-400',
  owner: 'text-purple-400',
  manager: 'text-blue-400',
  staff: 'text-amber-400',
  tenant: 'text-emerald-400',
}

interface MobileDrawerProps {
  open: boolean
  onClose: () => void
}

export function MobileDrawer({ open, onClose }: MobileDrawerProps) {
  const { currentPage, setCurrentPage, currentUser, logout, switchRole, restoreOriginalRole } = useAppStore()
  const role = currentUser?.role || 'manager'
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  const filteredItems = navItems.filter(item => canAccessPage(role, item.page))
  const mainItems = filteredItems.filter(item => item.section === 'main')
  const inventoryItems = filteredItems.filter(item => item.section === 'inventory')
  const canSwitchRoles = currentUser?.originalRole === 'super_admin' || currentUser?.role === 'super_admin'

  const handleNav = (page: Page) => {
    setCurrentPage(page)
    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300',
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-[300px] bg-slate-900 text-white transition-transform duration-300 ease-out shadow-2xl',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg shadow-emerald-500/25">
              <Home className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">HostelPro</h1>
              <p className="text-[10px] text-slate-400 -mt-0.5">ERP Management</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Impersonation Banner */}
        {currentUser?.isImpersonating && (
          <div className="mx-3 mt-3 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="text-[11px] text-amber-300 font-medium">Viewing as {roleLabels[role]}</span>
            </div>
            <button
              onClick={restoreOriginalRole}
              className="text-[10px] text-amber-400 hover:text-amber-300 underline mt-0.5"
            >
              Back to {roleLabels[currentUser.originalRole as UserRole]}
            </button>
          </div>
        )}

        {/* User Profile */}
        <div className="px-3 pt-3 pb-2">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50">
            <Avatar className="w-11 h-11 border-2 border-emerald-500/50 shrink-0">
              <AvatarFallback className="bg-emerald-500/20 text-emerald-400 text-base font-semibold">
                {currentUser?.name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate">{currentUser?.name}</p>
              <div className="flex items-center gap-1.5">
                <Shield className={cn('w-3 h-3', roleColors[role as UserRole] || 'text-emerald-400')} />
                <p className="text-xs text-slate-400 capitalize">{role.replace('_', ' ')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5" style={{ maxHeight: 'calc(100vh - 260px)' }}>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-3 mb-1">Menu</p>
          {mainItems.map((item) => {
            const isActive = currentPage === item.page
            const Icon = item.icon
            return (
              <button
                key={item.page}
                onClick={() => handleNav(item.page)}
                className={cn(
                  'flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-emerald-500/20 text-emerald-400 shadow-sm'
                    : 'text-slate-300 active:bg-slate-800 active:text-white'
                )}
              >
                <Icon className={cn('shrink-0', isActive ? 'w-5 h-5' : 'w-4.5 h-4.5')} />
                <span className="truncate">{item.label}</span>
                {item.badge && (
                  <Badge variant="secondary" className="ml-auto text-[10px] bg-emerald-500/20 text-emerald-400 border-0 px-1.5 py-0">
                    {item.badge}
                  </Badge>
                )}
                {isActive && <ChevronRight className="w-4 h-4 ml-auto text-emerald-400/50" />}
              </button>
            )
          })}

          {/* Inventory Section */}
          {inventoryItems.length > 0 && (
            <>
              <div className="pt-3 pb-1">
                <div className="flex items-center gap-2 px-3">
                  <div className="h-px flex-1 bg-slate-700/50" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Inventory</span>
                  <div className="h-px flex-1 bg-slate-700/50" />
                </div>
              </div>
              {inventoryItems.map((item) => {
                const isActive = currentPage === item.page
                const Icon = item.icon
                return (
                  <button
                    key={item.page}
                    onClick={() => handleNav(item.page)}
                    className={cn(
                      'flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-emerald-500/20 text-emerald-400 shadow-sm'
                        : 'text-slate-300 active:bg-slate-800 active:text-white'
                    )}
                  >
                    <Icon className={cn('shrink-0', isActive ? 'w-5 h-5' : 'w-4.5 h-4.5')} />
                    <span className="truncate">{item.label}</span>
                    {isActive && <ChevronRight className="w-4 h-4 ml-auto text-emerald-400/50" />}
                  </button>
                )
              })}
            </>
          )}
        </nav>

        {/* Footer Actions */}
        <div className="border-t border-slate-700/50 p-3 space-y-1">
          {canSwitchRoles && (
            <div className="px-2 pb-2">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Eye className="w-3 h-3" /> Switch Role
              </p>
              <div className="flex flex-wrap gap-1">
                {(Object.keys(roleLabels) as UserRole[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => switchRole(r)}
                    className={cn(
                      'px-2 py-1 rounded-lg text-[10px] font-medium transition-colors',
                      role === r
                        ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 active:bg-slate-700'
                    )}
                  >
                    {roleLabels[r]}
                  </button>
                ))}
              </div>
            </div>
          )}
          <button
            onClick={() => { handleNav('my-profile') }}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-slate-300 active:bg-slate-800 transition-colors"
          >
            <UserCircle className="w-4 h-4" />
            My Profile
          </button>
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-red-400 active:bg-red-500/20 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Logout Confirmation */}
      <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <AlertDialogContent className="mx-4 max-w-[calc(100vw-2rem)]">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-base">
              <LogOut className="w-5 h-5 text-red-500" />
              Sign Out
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to sign out? You will need to log in again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setShowLogoutConfirm(false); logout(); }} className="bg-red-600 hover:bg-red-700">
              Sign Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
