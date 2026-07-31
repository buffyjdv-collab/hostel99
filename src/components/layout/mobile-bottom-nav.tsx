'use client'

import { useAppStore, type Page, canAccessPage } from '@/lib/store'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Building2,
  IndianRupee,
  MessageSquareWarning,
  Menu,
  UserCircle,
} from 'lucide-react'

// Primary nav items shown in bottom bar (max 5)
const bottomNavItems: { page: Page; label: string; icon: React.ElementType }[] = [
  { page: 'dashboard', label: 'Home', icon: LayoutDashboard },
  { page: 'properties', label: 'Properties', icon: Building2 },
  { page: 'payments', label: 'Payments', icon: IndianRupee },
  { page: 'complaints', label: 'Complaints', icon: MessageSquareWarning },
  { page: 'my-profile', label: 'Profile', icon: UserCircle },
]

interface MobileBottomNavProps {
  onMenuOpen: () => void
}

export function MobileBottomNav({ onMenuOpen }: MobileBottomNavProps) {
  const { currentPage, setCurrentPage, currentUser } = useAppStore()
  const role = currentUser?.role || 'manager'

  // Filter items based on RBAC
  const visibleItems = bottomNavItems.filter(item => {
    if (item.page === 'my-profile') return true
    return canAccessPage(role, item.page)
  })

  // Show at most 4 items + the menu button
  const primaryItems = visibleItems.slice(0, 4)

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-xl border-t border-slate-200/80 safe-area-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-1">
        {primaryItems.map((item) => {
          const isActive = currentPage === item.page
          const Icon = item.icon
          return (
            <button
              key={item.page}
              onClick={() => setCurrentPage(item.page)}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 py-1 px-2 rounded-xl transition-all duration-200',
                isActive
                  ? 'text-emerald-600'
                  : 'text-slate-400 active:text-slate-600 active:bg-slate-100'
              )}
            >
              <div className={cn(
                'flex items-center justify-center w-10 h-7 rounded-xl transition-all duration-200',
                isActive && 'bg-emerald-50'
              )}>
                <Icon className={cn(isActive ? 'w-5 h-5' : 'w-4.5 h-4.5')} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={cn(
                'text-[10px] font-medium leading-tight',
                isActive && 'font-semibold'
              )}>
                {item.label}
              </span>
            </button>
          )
        })}

        {/* Menu Button - always shown */}
        <button
          onClick={onMenuOpen}
          className="flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 py-1 px-2 rounded-xl text-slate-400 active:text-slate-600 active:bg-slate-100 transition-colors"
        >
          <div className="flex items-center justify-center w-10 h-7 rounded-xl">
            <Menu className="w-5 h-5" strokeWidth={2} />
          </div>
          <span className="text-[10px] font-medium leading-tight">Menu</span>
        </button>
      </div>
    </nav>
  )
}
