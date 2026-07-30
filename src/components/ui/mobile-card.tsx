'use client'

import { ReactNode } from 'react'

/**
 * MobileCard - renders a mobile-friendly card layout from table data
 * On mobile, this replaces table rows with stacked card layouts
 */
interface MobileCardProps {
  children: ReactNode
  className?: string
}

export function MobileCard({ children, className = '' }: MobileCardProps) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm ${className}`}>
      {children}
    </div>
  )
}

interface MobileCardFieldProps {
  label: string
  value: ReactNode
  className?: string
}

export function MobileCardField({ label, value, className = '' }: MobileCardFieldProps) {
  return (
    <div className={`flex items-center justify-between gap-2 py-1 ${className}`}>
      <span className="text-xs text-slate-500 font-medium shrink-0">{label}</span>
      <div className="text-sm font-medium text-slate-900 text-right">{value}</div>
    </div>
  )
}

interface MobileCardActionsProps {
  children: ReactNode
}

export function MobileCardActions({ children }: MobileCardActionsProps) {
  return (
    <div className="flex items-center gap-2 pt-2 mt-2 border-t border-slate-100">
      {children}
    </div>
  )
}

/**
 * MobilePageHeader - consistent page header for mobile
 */
interface MobilePageHeaderProps {
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function MobilePageHeader({ title, description, action, className = '' }: MobilePageHeaderProps) {
  return (
    <div className={`mb-4 ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-bold text-slate-900">{title}</h1>
          {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  )
}

/**
 * MobileStatCard - compact stat card for mobile dashboards
 */
interface MobileStatCardProps {
  label: string
  value: string | number
  icon: ReactNode
  trend?: { value: string; positive: boolean }
  className?: string
}

export function MobileStatCard({ label, value, icon, trend, className = '' }: MobileStatCardProps) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm ${className}`}>
      <div className="flex items-center gap-3">
        <div className="shrink-0">{icon}</div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-slate-500 font-medium truncate">{label}</p>
          <p className="text-lg font-bold text-slate-900">{value}</p>
        </div>
        {trend && (
          <span className={`text-xs font-medium ${trend.positive ? 'text-emerald-500' : 'text-red-500'}`}>
            {trend.value}
          </span>
        )}
      </div>
    </div>
  )
}
