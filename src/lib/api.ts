'use client'

import { useAppStore, hasPermission, type Permission } from '@/lib/store'

// ─── Auth-Aware Fetch Helper ────────────────────────────────────
// Automatically includes userId and role in all API calls

/**
 * Build query string with auth context
 * Usage: const qs = buildAuthQuery(); fetch(`/api/properties?${qs}`)
 */
export function buildAuthQuery(extraParams?: Record<string, string>): string {
  if (typeof window === 'undefined') return ''
  
  const saved = localStorage.getItem('hostelpro_user')
  if (!saved) return ''
  
  try {
    const user = JSON.parse(saved)
    const params = new URLSearchParams()
    if (user.id) params.set('userId', user.id)
    if (user.role) params.set('role', user.role)
    
    // Include current hostel context
    const hostelId = localStorage.getItem('hostelpro_currentHostelId')
    if (hostelId) params.set('propertyId', hostelId)
    
    // Add extra params
    if (extraParams) {
      for (const [key, value] of Object.entries(extraParams)) {
        if (value) params.set(key, value)
      }
    }
    
    return params.toString()
  } catch {
    return ''
  }
}

/**
 * Build auth body for POST/PATCH/DELETE requests
 * Merges auth context (userId, role) with the provided data
 */
export function buildAuthBody(data: Record<string, any>): Record<string, any> {
  if (typeof window === 'undefined') return data
  
  const saved = localStorage.getItem('hostelpro_user')
  if (!saved) return data
  
  try {
    const user = JSON.parse(saved)
    const hostelId = localStorage.getItem('hostelpro_currentHostelId')
    
    return {
      ...data,
      userId: user.id,
      role: user.role,
      ...(hostelId && !data.propertyId ? { propertyId: hostelId } : {}),
    }
  } catch {
    return data
  }
}

/**
 * Check if current user can perform a specific action
 * Uses the DB-loaded permissions from the store
 */
export function useCanPerform(module: string, action: 'create' | 'read' | 'update' | 'delete'): boolean {
  const { currentUser } = useAppStore()
  if (!currentUser) return false
  
  const permission = `${module}:${action}` as Permission
  return hasPermission(currentUser.role, permission)
}

/**
 * Get current user's role from localStorage
 */
export function getCurrentUserRole(): string {
  if (typeof window === 'undefined') return ''
  try {
    const saved = localStorage.getItem('hostelpro_user')
    if (saved) {
      const user = JSON.parse(saved)
      return user.role || ''
    }
  } catch {}
  return ''
}

/**
 * Get current user's ID from localStorage
 */
export function getCurrentUserId(): string {
  if (typeof window === 'undefined') return ''
  try {
    const saved = localStorage.getItem('hostelpro_user')
    if (saved) {
      const user = JSON.parse(saved)
      return user.id || ''
    }
  } catch {}
  return ''
}

/**
 * Get current hostel ID from localStorage
 */
export function getCurrentHostelId(): string {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem('hostelpro_currentHostelId') || ''
}
