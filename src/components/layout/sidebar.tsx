'use client'

import { useAppStore, type Page } from '@/lib/store'
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

const navItems: { page: Page; label: string; icon: React.ElementType; badge?: string; roles?: string[] }[] = [
  { page: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { page: 'properties', label: 'Properties', icon: Building2, roles: ['super_admin', 'owner', 'manager'] },
  { page: 'rooms', label: 'Rooms & Beds', icon: DoorOpen },
  { page: 'leads', label: 'Lead CRM', icon: Users, roles: ['super_admin', 'owner', 'manager'] },
  { page: 'tenants', label: 'Tenants', icon: UserCheck },
  { page: 'payments', label: 'Payments', icon: IndianRupee, badge: 'Funds' },
  { page: 'complaints', label: 'Complaints', icon: MessageSquareWarning },
  { page: 'staff', label: 'Staff', icon: UserCog, roles: ['super_admin', 'owner', 'manager'] },
  { page: 'expenses', label: 'Accounting', icon: Receipt, roles: ['super_admin', 'owner', 'manager'] },
  { page: 'reports', label: 'Reports', icon: BarChart3 },
  { page: 'notices', label: 'Communication', icon: Megaphone },
  { page: 'visitors', label: 'Visitors', icon: LogIn },
  { page: 'settings', label: 'Settings', icon: Settings, roles: ['super_admin', 'owner'] },
]

export function Sidebar() {
  const { currentPage, setCurrentPage, currentUser, sidebarCollapsed, setSidebarCollapsed } = useAppStore()
  const role = currentUser?.role || 'manager'

  const filteredItems = navItems.filter(item => !item.roles || item.roles.includes(role))

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
          {filteredItems.map((item) => {
            const isActive = currentPage === item.page
            const Icon = item.icon
            const navBtn = (
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
        </nav>

        {/* User Info */}
        <div className="border-t border-slate-700/50 p-3">
          <div className={cn('flex items-center gap-3', sidebarCollapsed && 'justify-center')}>
            <Avatar className="w-9 h-9 border-2 border-emerald-500/50">
              <AvatarFallback className="bg-slate-700 text-sm">
                {currentUser?.name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            {!sidebarCollapsed && currentUser && (
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{currentUser.name}</p>
                <div className="flex items-center gap-1.5">
                  <Shield className="w-3 h-3 text-emerald-400" />
                  <p className="text-xs text-slate-400 capitalize">{currentUser.role.replace('_', ' ')}</p>
                </div>
              </div>
            )}
          </div>
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
