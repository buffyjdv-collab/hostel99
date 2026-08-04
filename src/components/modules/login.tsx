'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/use-toast'
import {
  Home,
  Mail,
  Lock,
  Shield,
  Eye,
  EyeOff,
  Loader2,
  ArrowRight,
  UserCog,
  UserCircle,
  Building2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

interface DemoAccount {
  email: string
  password: string
  role: string
  label: string
  icon: React.ElementType
  color: string
}

const demoAccounts: DemoAccount[] = [
  {
    email: 'admin@hostelpro.com',
    password: 'admin123',
    role: 'super_admin',
    label: 'Super Admin',
    icon: Shield,
    color: 'from-red-500 to-rose-500',
  },
  {
    email: 'owner@hostelpro.com',
    password: 'owner123',
    role: 'owner',
    label: 'Owner',
    icon: Building2,
    color: 'from-purple-500 to-violet-500',
  },
  {
    email: 'manager@hostelpro.com',
    password: 'manager123',
    role: 'manager',
    label: 'Manager',
    icon: Mail,
    color: 'from-blue-500 to-indigo-500',
  },
  {
    email: 'staff1@hostelpro.com',
    password: 'staff123',
    role: 'staff',
    label: 'Staff',
    icon: UserCog,
    color: 'from-amber-500 to-orange-500',
  },
  {
    email: 'tenant1@hostelpro.com',
    password: 'tenant123',
    role: 'tenant',
    label: 'Tenant',
    icon: UserCircle,
    color: 'from-emerald-500 to-teal-500',
  },
]

export function LoginPage() {
  const { setCurrentUser } = useAppStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showDemos, setShowDemos] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast({
          title: 'Login Failed',
          description: data.error || 'Invalid credentials. Please try again.',
          variant: 'destructive',
        })
        return
      }

      const user = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role,
        avatar: data.user.avatar,
        hostelAssignments: data.hostelAssignments || [],
        permissionOverrides: data.permissionOverrides || [],
      }

      localStorage.setItem('hostelpro_user', JSON.stringify(user))
      if (data.defaultHostelId) {
        localStorage.setItem('hostelpro_currentHostelId', data.defaultHostelId)
      }
      setCurrentUser(user)
    } catch {
      toast({
        title: 'Connection Error',
        description: 'Unable to connect to the server. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDemoLogin = async (account: DemoAccount) => {
    setLoading(true)
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: account.email, password: account.password }),
      })
      const data = await res.json()

      if (!res.ok) {
        toast({ title: 'Login Failed', description: data.error, variant: 'destructive' })
        return
      }

      const user = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role,
        avatar: data.user.avatar,
        hostelAssignments: data.hostelAssignments || [],
        permissionOverrides: data.permissionOverrides || [],
      }

      localStorage.setItem('hostelpro_user', JSON.stringify(user))
      if (data.defaultHostelId) {
        localStorage.setItem('hostelpro_currentHostelId', data.defaultHostelId)
      }
      setCurrentUser(user)
    } catch {
      toast({ title: 'Connection Error', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-gradient-to-br from-slate-900 via-emerald-950 to-teal-900">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col justify-center px-5 py-8 max-w-md mx-auto w-full">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-xl shadow-emerald-500/30 mb-4">
            <Home className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">HostelPro</h1>
          <p className="text-emerald-200/60 text-sm mt-1">Hostel & PG Management ERP</p>
        </div>

        {/* Login Card */}
        <Card className="border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl rounded-2xl overflow-hidden">
          <CardHeader className="text-center pb-2 pt-5 px-5">
            <CardTitle className="text-xl text-white">Welcome back</CardTitle>
            <CardDescription className="text-slate-300/60 text-sm">
              Sign in to your account
            </CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Field */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-slate-200 text-xs font-medium">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-11 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus-visible:border-emerald-500/50 focus-visible:ring-emerald-500/20 rounded-xl text-base"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-slate-200 text-xs font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-11 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus-visible:border-emerald-500/50 focus-visible:ring-emerald-500/20 rounded-xl text-base"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Sign In Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/25 transition-all duration-200 rounded-xl text-base font-semibold"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </form>

            {/* Demo Accounts Toggle */}
            <div className="mt-5">
              <button
                onClick={() => setShowDemos(!showDemos)}
                className="flex items-center justify-center gap-2 w-full py-2 text-xs text-slate-400 hover:text-slate-300 transition-colors"
              >
                Quick Demo Login
                {showDemos ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showDemos && (
                <div className="space-y-2 mt-2 animate-slide-up">
                  {demoAccounts.map((account) => {
                    const Icon = account.icon
                    return (
                      <button
                        key={account.email}
                        type="button"
                        onClick={() => handleDemoLogin(account)}
                        disabled={loading}
                        className="flex items-center gap-3 w-full p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 active:bg-white/15 transition-all duration-200 text-left disabled:opacity-50"
                      >
                        <div className={cn(
                          'flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br shrink-0',
                          account.color
                        )}>
                          <Icon className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-white">{account.label}</span>
                            <Badge
                              variant="secondary"
                              className="text-[9px] bg-white/10 text-slate-300 border-0 px-1.5 py-0"
                            >
                              {account.role}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-slate-400 truncate">{account.email}</p>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-slate-500/50 mt-6">
          &copy; {new Date().getFullYear()} HostelPro. All rights reserved.
        </p>
      </div>
    </div>
  )
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}
