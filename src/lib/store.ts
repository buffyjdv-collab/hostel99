'use client'

import { create } from 'zustand'

export type Page = 'dashboard' | 'properties' | 'rooms' | 'leads' | 'tenants' | 'payments' | 'complaints' | 'staff' | 'expenses' | 'reports' | 'notices' | 'visitors' | 'settings' | 'inventory' | 'vendors' | 'purchases' | 'kitchen' | 'mess' | 'assets' | 'users' | 'my-profile' | 'role-management'

// ─── RBAC Permission System ───────────────────────────────────────────
export type Permission =
  | 'dashboard:view'
  | 'properties:create' | 'properties:read' | 'properties:update' | 'properties:delete'
  | 'rooms:create' | 'rooms:read' | 'rooms:update' | 'rooms:delete'
  | 'leads:create' | 'leads:read' | 'leads:update' | 'leads:delete'
  | 'tenants:create' | 'tenants:read' | 'tenants:update' | 'tenants:delete'
  | 'payments:create' | 'payments:read' | 'payments:update' | 'payments:delete'
  | 'complaints:create' | 'complaints:read' | 'complaints:update' | 'complaints:delete'
  | 'staff:create' | 'staff:read' | 'staff:update' | 'staff:delete'
  | 'expenses:create' | 'expenses:read' | 'expenses:update' | 'expenses:delete'
  | 'reports:read'
  | 'notices:create' | 'notices:read' | 'notices:update' | 'notices:delete'
  | 'visitors:create' | 'visitors:read' | 'visitors:update' | 'visitors:delete'
  | 'inventory:create' | 'inventory:read' | 'inventory:update' | 'inventory:delete'
  | 'vendors:create' | 'vendors:read' | 'vendors:update' | 'vendors:delete'
  | 'purchases:create' | 'purchases:read' | 'purchases:update' | 'purchases:delete'
  | 'kitchen:create' | 'kitchen:read' | 'kitchen:update' | 'kitchen:delete'
  | 'mess:create' | 'mess:read' | 'mess:update' | 'mess:delete'
  | 'assets:create' | 'assets:read' | 'assets:update' | 'assets:delete'
  | 'settings:read' | 'settings:update'
  | 'users:create' | 'users:read' | 'users:update' | 'users:delete'
  | 'role-management:read' | 'role-management:update'

export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  super_admin: [
    'dashboard:view',
    'properties:create', 'properties:read', 'properties:update', 'properties:delete',
    'rooms:create', 'rooms:read', 'rooms:update', 'rooms:delete',
    'leads:create', 'leads:read', 'leads:update', 'leads:delete',
    'tenants:create', 'tenants:read', 'tenants:update', 'tenants:delete',
    'payments:create', 'payments:read', 'payments:update', 'payments:delete',
    'complaints:create', 'complaints:read', 'complaints:update', 'complaints:delete',
    'staff:create', 'staff:read', 'staff:update', 'staff:delete',
    'expenses:create', 'expenses:read', 'expenses:update', 'expenses:delete',
    'reports:read',
    'notices:create', 'notices:read', 'notices:update', 'notices:delete',
    'visitors:create', 'visitors:read', 'visitors:update', 'visitors:delete',
    'inventory:create', 'inventory:read', 'inventory:update', 'inventory:delete',
    'vendors:create', 'vendors:read', 'vendors:update', 'vendors:delete',
    'purchases:create', 'purchases:read', 'purchases:update', 'purchases:delete',
    'kitchen:create', 'kitchen:read', 'kitchen:update', 'kitchen:delete',
    'mess:create', 'mess:read', 'mess:update', 'mess:delete',
    'assets:create', 'assets:read', 'assets:update', 'assets:delete',
    'settings:read', 'settings:update',
    'users:create', 'users:read', 'users:update', 'users:delete',
    'role-management:read', 'role-management:update',
  ],
  owner: [
    'dashboard:view',
    'properties:create', 'properties:read', 'properties:update', 'properties:delete',
    'rooms:create', 'rooms:read', 'rooms:update', 'rooms:delete',
    'leads:create', 'leads:read', 'leads:update', 'leads:delete',
    'tenants:create', 'tenants:read', 'tenants:update', 'tenants:delete',
    'payments:create', 'payments:read', 'payments:update', 'payments:delete',
    'complaints:create', 'complaints:read', 'complaints:update', 'complaints:delete',
    'staff:create', 'staff:read', 'staff:update', 'staff:delete',
    'expenses:create', 'expenses:read', 'expenses:update', 'expenses:delete',
    'reports:read',
    'notices:create', 'notices:read', 'notices:update', 'notices:delete',
    'visitors:create', 'visitors:read', 'visitors:update', 'visitors:delete',
    'inventory:create', 'inventory:read', 'inventory:update', 'inventory:delete',
    'vendors:create', 'vendors:read', 'vendors:update', 'vendors:delete',
    'purchases:create', 'purchases:read', 'purchases:update', 'purchases:delete',
    'kitchen:create', 'kitchen:read', 'kitchen:update', 'kitchen:delete',
    'mess:create', 'mess:read', 'mess:update', 'mess:delete',
    'assets:create', 'assets:read', 'assets:update', 'assets:delete',
    'settings:read', 'settings:update',
    'users:read',
    'role-management:read',
  ],
  manager: [
    'dashboard:view',
    'properties:read',
    'rooms:create', 'rooms:read', 'rooms:update',
    'leads:create', 'leads:read', 'leads:update',
    'tenants:create', 'tenants:read', 'tenants:update',
    'payments:create', 'payments:read', 'payments:update',
    'complaints:create', 'complaints:read', 'complaints:update',
    'staff:read',
    'expenses:create', 'expenses:read', 'expenses:update',
    'reports:read',
    'notices:create', 'notices:read', 'notices:update',
    'visitors:create', 'visitors:read', 'visitors:update',
    'inventory:create', 'inventory:read', 'inventory:update',
    'vendors:read',
    'purchases:create', 'purchases:read', 'purchases:update',
    'kitchen:create', 'kitchen:read', 'kitchen:update',
    'mess:create', 'mess:read', 'mess:update',
    'assets:create', 'assets:read', 'assets:update',
  ],
  staff: [
    'dashboard:view',
    'rooms:read',
    'tenants:read',
    'complaints:create', 'complaints:read',
    'visitors:create', 'visitors:read',
    'inventory:read',
    'kitchen:read',
    'mess:read',
    'assets:read',
  ],
  tenant: [
    'dashboard:view',
    'payments:read',
    'complaints:create', 'complaints:read',
    'notices:read',
    'visitors:create', 'visitors:read',
    'mess:read',
  ],
}

export function hasPermission(role: string, permission: Permission): boolean {
  const perms = ROLE_PERMISSIONS[role] || []
  return perms.includes(permission)
}

export function canAccessPage(role: string, page: Page): boolean {
  const publicPages: Page[] = ['dashboard', 'my-profile']
  if (publicPages.includes(page)) return true

  const pagePermissionMap: Partial<Record<Page, Permission>> = {
    properties: 'properties:read',
    rooms: 'rooms:read',
    leads: 'leads:read',
    tenants: 'tenants:read',
    payments: 'payments:read',
    complaints: 'complaints:read',
    staff: 'staff:read',
    expenses: 'expenses:read',
    reports: 'reports:read',
    notices: 'notices:read',
    visitors: 'visitors:read',
    settings: 'settings:read',
    inventory: 'inventory:read',
    vendors: 'vendors:read',
    purchases: 'purchases:read',
    kitchen: 'kitchen:read',
    mess: 'mess:read',
    assets: 'assets:read',
    users: 'users:read',
    'role-management': 'role-management:read',
  }

  const requiredPerm = pagePermissionMap[page]
  if (!requiredPerm) return true
  return hasPermission(role, requiredPerm)
}

export type UserRole = 'super_admin' | 'owner' | 'manager' | 'staff' | 'tenant'

interface CurrentUser {
  id: string
  name: string
  email: string
  role: UserRole
  avatar?: string
  originalRole?: UserRole  // For role switching - stores the original role
  isImpersonating?: boolean // Whether the user is impersonating another role
}

interface AppState {
  currentPage: Page
  setCurrentPage: (page: Page) => void
  currentUser: CurrentUser | null
  setCurrentUser: (user: CurrentUser | null) => void
  logout: () => void
  switchRole: (newRole: UserRole) => void
  restoreOriginalRole: () => void
  selectedPropertyId: string | null
  setSelectedPropertyId: (id: string | null) => void
  sidebarCollapsed: boolean
  setSidebarCollapsed: (collapsed: boolean) => void
}

export const useAppStore = create<AppState>((set, get) => ({
  currentPage: 'dashboard',
  setCurrentPage: (page) => set({ currentPage: page }),
  currentUser: null,
  setCurrentUser: (user) => {
    if (user) {
      localStorage.setItem('hostelpro_user', JSON.stringify(user))
    } else {
      localStorage.removeItem('hostelpro_user')
    }
    set({ currentUser: user })
  },
  logout: () => {
    localStorage.removeItem('hostelpro_user')
    set({
      currentUser: null,
      currentPage: 'dashboard',
      selectedPropertyId: null,
      sidebarCollapsed: false,
    })
  },
  switchRole: (newRole: UserRole) => {
    const { currentUser } = get()
    if (!currentUser) return

    // Store the original role on first switch
    const originalRole = currentUser.originalRole || currentUser.role
    const isImpersonating = newRole !== originalRole

    const updatedUser: CurrentUser = {
      ...currentUser,
      role: newRole,
      originalRole: originalRole as UserRole,
      isImpersonating,
    }

    localStorage.setItem('hostelpro_user', JSON.stringify(updatedUser))
    set({ currentUser: updatedUser, currentPage: 'dashboard' })
  },
  restoreOriginalRole: () => {
    const { currentUser } = get()
    if (!currentUser || !currentUser.originalRole) return

    const updatedUser: CurrentUser = {
      ...currentUser,
      role: currentUser.originalRole,
      originalRole: undefined,
      isImpersonating: false,
    }

    localStorage.setItem('hostelpro_user', JSON.stringify(updatedUser))
    set({ currentUser: updatedUser, currentPage: 'dashboard' })
  },
  selectedPropertyId: null,
  setSelectedPropertyId: (id) => set({ selectedPropertyId: id }),
  sidebarCollapsed: false,
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
}))
