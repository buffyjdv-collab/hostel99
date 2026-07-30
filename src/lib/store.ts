'use client'

import { create } from 'zustand'

export type Page = 'dashboard' | 'properties' | 'rooms' | 'leads' | 'tenants' | 'payments' | 'complaints' | 'staff' | 'expenses' | 'reports' | 'notices' | 'visitors' | 'settings'

interface AppState {
  currentPage: Page
  setCurrentPage: (page: Page) => void
  currentUser: {
    id: string
    name: string
    email: string
    role: string
    avatar?: string
  } | null
  setCurrentUser: (user: AppState['currentUser']) => void
  selectedPropertyId: string | null
  setSelectedPropertyId: (id: string | null) => void
  sidebarCollapsed: boolean
  setSidebarCollapsed: (collapsed: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  currentPage: 'dashboard',
  setCurrentPage: (page) => set({ currentPage: page }),
  currentUser: null,
  setCurrentUser: (user) => set({ currentUser: user }),
  selectedPropertyId: null,
  setSelectedPropertyId: (id) => set({ selectedPropertyId: id }),
  sidebarCollapsed: false,
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
}))
