'use client'

import { Sidebar } from '@/components/layout/sidebar'
import { MobileDrawer } from '@/components/layout/mobile-drawer'
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav'
import { MobileHeader } from '@/components/layout/mobile-header'
import { useAppStore } from '@/lib/store'
import { DashboardPage } from '@/components/modules/dashboard'
import { PropertiesPage } from '@/components/modules/properties'
import { RoomsPage } from '@/components/modules/rooms'
import { LeadsPage } from '@/components/modules/leads'
import { TenantsPage } from '@/components/modules/tenants'
import { PaymentsPage } from '@/components/modules/payments'
import { ComplaintsPage } from '@/components/modules/complaints'
import { StaffPage } from '@/components/modules/staff'
import { ExpensesPage } from '@/components/modules/expenses'
import { ReportsPage } from '@/components/modules/reports'
import { NoticesPage } from '@/components/modules/notices'
import { VisitorsPage } from '@/components/modules/visitors'
import { SettingsPage } from '@/components/modules/settings'
import { InventoryPage } from '@/components/modules/inventory'
import { VendorsPage } from '@/components/modules/vendors'
import { PurchasesPage } from '@/components/modules/purchases'
import { KitchenPage } from '@/components/modules/kitchen'
import { MessPage } from '@/components/modules/mess'
import { AssetsPage } from '@/components/modules/assets'
import { LoginPage } from '@/components/modules/login'
import { UsersPage } from '@/components/modules/users'
import { MyProfilePage } from '@/components/modules/my-profile'
import { RoleManagementPage } from '@/components/modules/role-management'
import { useRef, useEffect, useState } from 'react'
import { Toaster } from '@/components/ui/toaster'
import { useIsMobile } from '@/hooks/use-mobile'

export default function Home() {
  const { currentPage, currentUser, setCurrentUser } = useAppStore()
  const initialized = useRef(false)
  const isMobile = useIsMobile()
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    const saved = localStorage.getItem('hostelpro_user')
    if (saved) {
      try {
        setCurrentUser(JSON.parse(saved))
      } catch {
        localStorage.removeItem('hostelpro_user')
      }
    }
  }, [setCurrentUser])

  if (!currentUser) {
    return (
      <>
        <LoginPage />
        <Toaster />
      </>
    )
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <DashboardPage />
      case 'properties': return <PropertiesPage />
      case 'rooms': return <RoomsPage />
      case 'leads': return <LeadsPage />
      case 'tenants': return <TenantsPage />
      case 'payments': return <PaymentsPage />
      case 'complaints': return <ComplaintsPage />
      case 'staff': return <StaffPage />
      case 'expenses': return <ExpensesPage />
      case 'reports': return <ReportsPage />
      case 'notices': return <NoticesPage />
      case 'visitors': return <VisitorsPage />
      case 'settings': return <SettingsPage />
      case 'inventory': return <InventoryPage />
      case 'vendors': return <VendorsPage />
      case 'purchases': return <PurchasesPage />
      case 'kitchen': return <KitchenPage />
      case 'mess': return <MessPage />
      case 'assets': return <AssetsPage />
      case 'users': return <UsersPage />
      case 'my-profile': return <MyProfilePage />
      case 'role-management': return <RoleManagementPage />
      default: return <DashboardPage />
    }
  }

  // ─── Mobile Layout ─────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div className="flex flex-col h-[100dvh] bg-slate-50 overflow-hidden">
        {/* Top Header */}
        <MobileHeader onMenuOpen={() => setDrawerOpen(true)} />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto overscroll-y-contain pb-20">
          <div className="px-4 py-4 max-w-lg mx-auto">
            {renderPage()}
          </div>
        </main>

        {/* Bottom Navigation */}
        <MobileBottomNav onMenuOpen={() => setDrawerOpen(true)} />

        {/* Slide-out Drawer */}
        <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

        <Toaster />
      </div>
    )
  }

  // ─── Desktop Layout ────────────────────────────────────────────────────
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-[1600px] mx-auto">
          {renderPage()}
        </div>
      </main>
      <Toaster />
    </div>
  )
}
