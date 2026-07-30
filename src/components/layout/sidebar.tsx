'use client'

import { useAppStore, type Page, canAccessPage } from '@/lib/store'
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
  ChevronLeft,
  ChevronRight,
  Shield,
  Home,
  Settings,
  Package,
  Truck,
  ShoppingCart,
  ChefHat,
  UtensilsCrossed,
  Armchair,
  LogOut,
  UserCircle,
  UsersRound,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const navItems: { page: Page; label: string; icon: React.ElementType; badge?: string; section?: string }[] = [
  { page: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, section: 'main' },
  { page: 'properties', label: 'Properties', icon: Building2, section: 'main' },
  { page: 'rooms', label: 'Rooms & Beds', icon: DoorOpen, section: 'main' },
  { page: 'leads', label: 'Lead CRM', icon: Users, section: 'main' },
  { page: 'tenants', label: 'Tenants', icon: UserCheck, section: 'main' },
  { page: 'payments', label: 'Payments', icon: IndianRupee, badge: 'Funds', section: 'main' },
  { page: 'complaints', label: 'Complaints', icon: MessageSquareWarning, section: 'main' },
  { page: 'staff', label: 'Staff', icon: UserCog, section: 'main' },
  { page: 'expenses', label: 'Accounting', icon: Receipt, section: 'main' },
  { page: 'users', label: 'User Management', icon: UsersRound, section: 'main' },

  // Inventory Section
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

export function Sidebar() {
  const { currentPage, setCurrentPage, currentUser, sidebarCollapsed, setSidebarCollapsed, logout } = useAppStore()
  const role = currentUser?.role || 'manager'

  // Filter nav items based on RBAC permissions
  const filteredItems = navItems.filter(item => canAccessPage(role, item.page))

  // Group items by section
  const mainItems = filteredItems.filter(item => item.section === 'main')
  const inventoryItems = filteredItems.filter(item => item.section === 'inventory')

  const renderNavButton = (item: typeof navItems[0]) => {
    const isActive = currentPage === item.page
    const Icon = item.icon
    return (
      <button
        key={item.page}
        onClick={() => setCurrentPage(item.page)}
        className={cn(
          'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
          isActive
            ? 'bg-emerald-500/20 text-emerald-400 shadow-sm shadow-emerald-500/10'
            : 'text-slate-300 hover:bg-slate-800 hover:text-white',
          sidebarCollapsed && 'justify-center px-2'
        )}
      >
        <Icon className={cn('shrink-0', isActive ? 'w-5 h-5' : 'w-4 h-4')} />
        {!sidebarCollapsed && (
          <>
            <span className="truncate">{item.label}</span>
            {item.badge && (
              <Badge variant="secondary" className="ml-auto text-[10px] bg-emerald-500/20 text-emerald-400 border-0 px-1.5 py-0">
                {item.badge}
              </Badge>
            )}
          </>
        )}
      </button>
    )
  }

  return (
    <TooltipProvider delayDuration={0}>
      <div className={cn(
        'flex flex-col h-screen bg-slate-900 text-white transition-all duration-300 border-r border-slate-800',
        sidebarCollapsed ? 'w-[68px]' : 'w-[260px]'
      )}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 h-16 border-b border-slate-700/50">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 shrink-0">
            <Home className="w-5 h-5 text-white" />
          </div>
          {!sidebarCollapsed && (
            <div className="overflow-hidden">
              <h1 className="text-lg font-bold tracking-tight text-white">HostelPro</h1>
              <p className="text-[10px] text-slate-400 -mt-0.5">ERP Management</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
          {mainItems.map((item) => {
            const navBtn = renderNavButton(item)
            if (sidebarCollapsed) {
              return (
                <Tooltip key={item.page}>
                  <TooltipTrigger asChild>{navBtn}</TooltipTrigger>
                  <TooltipContent side="right" className="bg-slate-800 text-white border-slate-700">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              )
            }
            return navBtn
          })}

          {/* Inventory Section */}
          {inventoryItems.length > 0 && (
            <>
              {!sidebarCollapsed ? (
                <div className="pt-4 pb-2">
                  <div className="flex items-center gap-2 px-3">
                    <div className="h-px flex-1 bg-slate-700/50" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Inventory</span>
                    <div className="h-px flex-1 bg-slate-700/50" />
                  </div>
                </div>
              ) : (
                <div className="my-2 mx-2 h-px bg-slate-700/50" />
              )}
              {inventoryItems.map((item) => {
                const navBtn = renderNavButton(item)
                if (sidebarCollapsed) {
                  return (
                    <Tooltip key={item.page}>
                      <TooltipTrigger asChild>{navBtn}</TooltipTrigger>
                      <TooltipContent side="right" className="bg-slate-800 text-white border-slate-700">
                        {item.label}
                      </TooltipContent>
                    </Tooltip>
                  )
                }
                return navBtn
              })}
            </>
          )}
        </nav>

        {/* User Info & Logout */}
        <div className="border-t border-slate-700/50 p-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={cn(
                'flex items-center gap-3 w-full rounded-lg p-2 hover:bg-slate-800 transition-colors',
                sidebarCollapsed && 'justify-center p-1'
              )}>
                <Avatar className="w-9 h-9 border-2 border-emerald-500/50 shrink-0">
                  <AvatarFallback className="bg-slate-700 text-sm">
                    {currentUser?.name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                {!sidebarCollapsed && currentUser && (
                  <div className="min-w-0 flex-1 text-left">
                    <p className="text-sm font-medium truncate">{currentUser.name}</p>
                    <div className="flex items-center gap-1.5">
                      <Shield className="w-3 h-3 text-emerald-400" />
                      <p className="text-xs text-slate-400 capitalize">{currentUser.role.replace('_', ' ')}</p>
                    </div>
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-56 bg-slate-800 border-slate-700 text-white">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{currentUser?.name}</p>
                <p className="text-xs text-slate-400">{currentUser?.email}</p>
                <Badge variant="secondary" className="mt-1 text-[10px] bg-emerald-500/15 text-emerald-400 border-0">
                  {currentUser?.role?.replace('_', ' ')}
                </Badge>
              </div>
              <DropdownMenuSeparator className="bg-slate-700" />
              <DropdownMenuItem
                onClick={() => setCurrentPage('my-profile')}
                className="cursor-pointer hover:bg-slate-700 focus:bg-slate-700"
              >
                <UserCircle className="w-4 h-4 mr-2" />
                My Profile
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={logout}
                className="cursor-pointer hover:bg-red-500/20 focus:bg-red-500/20 text-red-400"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Collapse Toggle */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="flex items-center justify-center h-10 border-t border-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </TooltipProvider>
  )
}
