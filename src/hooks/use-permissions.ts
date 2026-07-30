'use client'

import { useAppStore, hasPermission, type Permission } from '@/lib/store'

export function usePermission(permission: Permission): boolean {
  const { currentUser } = useAppStore()
  if (!currentUser) return false
  return hasPermission(currentUser.role, permission)
}

export function usePermissions(): {
  can: (permission: Permission) => boolean
  role: string
  isSuperAdmin: boolean
  isOwner: boolean
  isManager: boolean
  isStaff: boolean
  isTenant: boolean
} {
  const { currentUser } = useAppStore()
  const role = currentUser?.role || ''

  return {
    can: (permission: Permission) => hasPermission(role, permission),
    role,
    isSuperAdmin: role === 'super_admin',
    isOwner: role === 'owner',
    isManager: role === 'manager',
    isStaff: role === 'staff',
    isTenant: role === 'tenant',
  }
}
