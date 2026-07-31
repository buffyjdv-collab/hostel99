'use client'

import { useAppStore, type Page } from '@/lib/store'
import { cn } from '@/lib/utils'
import {
  Menu,
  Home,
  Bell,
  ChevronLeft,
} from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

const pageLabels: Record<Page, string> = {
  dashboard: 'Dashboard',
  properties: 'Properties',
  rooms: 'Rooms & Beds',
  leads: 'Lead CRM',
  tenants: 'Tenants',
  payments: 'Payments',
  complaints: 'Complaints',
  staff: 'Staff',
  expenses: 'Accounting',
  reports: 'Reports',
  notices: 'Communication',
  visitors: 'Visitors',
  settings: 'Settings',
  inventory: 'Inventory',
  vendors: 'Vendors',
  purchases: 'Purchases',
  kitchen: 'Kitchen & Menu',
  mess: 'Mess & Dining',
  assets: 'Assets & Laundry',
  users: 'User Management',
  'my-profile': 'My Profile',
  'role-management': 'Role & Access',
  hostels: 'Hostels',
}

interface MobileHeaderProps {
  onMenuOpen: () => void
}

export function MobileHeader({ onMenuOpen }: MobileHeaderProps) {
  const { currentPage, currentUser } = useAppStore()
  const pageTitle = pageLabels[currentPage] || 'HostelPro'

  return (
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-xl border-b border-slate-200/80 safe-area-top">
      <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
        {/* Left: Menu + Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuOpen}
            className="p-2 -ml-2 rounded-xl hover:bg-slate-100 active:bg-slate-200 transition-colors"
          >
            <Menu className="w-5 h-5 text-slate-600" />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500">
              <Home className="w-3.5 h-3.5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900 leading-tight">{pageTitle}</h1>
            </div>
          </div>
        </div>

        {/* Right: Notifications + Avatar */}
        <div className="flex items-center gap-2">
          <button className="relative p-2 rounded-xl hover:bg-slate-100 active:bg-slate-200 transition-colors">
            <Bell className="w-5 h-5 text-slate-500" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </button>
          <Avatar className="w-8 h-8 border-2 border-emerald-500/30">
            <AvatarFallback className="bg-emerald-50 text-emerald-600 text-xs font-semibold">
              {currentUser?.name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  )
}
