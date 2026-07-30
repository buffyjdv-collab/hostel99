'use client'

import { Sidebar } from '@/components/layout/sidebar'
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
import { LoginPage } from '@/components/modules/login'
import { useRef, useEffect } from 'react'
import { Toaster } from '@/components/ui/toaster'

export default function Home() {
  const { currentPage, currentUser, setCurrentUser } = useAppStore()
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    // Restore user from localStorage on mount
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
      default: return <DashboardPage />
    }
  }

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
