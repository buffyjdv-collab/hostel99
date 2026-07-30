'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  UserCircle,
  Mail,
  Phone,
  Shield,
  Calendar,
  Save,
  Loader2,
  Key,
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'

export function MyProfilePage() {
  const { currentUser, setCurrentUser } = useAppStore()
  const [name, setName] = useState(currentUser?.name || '')
  const [phone, setPhone] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)

  const roleColors: Record<string, string> = {
    super_admin: 'bg-red-500/15 text-red-400 border-0',
    owner: 'bg-purple-500/15 text-purple-400 border-0',
    manager: 'bg-blue-500/15 text-blue-400 border-0',
    staff: 'bg-amber-500/15 text-amber-400 border-0',
    tenant: 'bg-emerald-500/15 text-emerald-400 border-0',
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: currentUser?.id, name, phone }),
      })
      if (!res.ok) throw new Error('Failed to update profile')
      const data = await res.json()
      const updatedUser = { ...currentUser!, name: data.user?.name || name }
      setCurrentUser(updatedUser)
      localStorage.setItem('hostelpro_user', JSON.stringify(updatedUser))
      toast({ title: 'Profile Updated', description: 'Your profile has been saved.' })
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      toast({ title: 'Error', description: 'Please fill in both password fields.', variant: 'destructive' })
      return
    }
    setChangingPassword(true)
    try {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: currentUser?.id, currentPassword, newPassword }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed to change password') }
      setCurrentPassword('')
      setNewPassword('')
      toast({ title: 'Password Changed', description: 'Your password has been updated.' })
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    } finally {
      setChangingPassword(false)
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <UserCircle className="w-6 h-6 text-emerald-500" />
          My Profile
        </h1>
        <p className="text-muted-foreground text-sm">Manage your account settings and preferences</p>
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Profile Information</CardTitle>
          <CardDescription>Update your personal details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
              <UserCircle className="w-8 h-8 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">{currentUser?.name}</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="w-3.5 h-3.5" /> {currentUser?.email}
              </div>
              <Badge className={`mt-1 ${roleColors[currentUser?.role || ''] || 'bg-slate-500/15 text-slate-400 border-0'}`}>
                <Shield className="w-3 h-3 mr-1" />
                {(currentUser?.role || '').replace('_', ' ')}
              </Badge>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={currentUser?.email || ''} disabled className="bg-slate-50" />
              <p className="text-xs text-muted-foreground">Email cannot be changed</p>
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Your phone number" />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Input value={(currentUser?.role || '').replace('_', ' ')} disabled className="bg-slate-50 capitalize" />
              <p className="text-xs text-muted-foreground">Role is managed by administrators</p>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSaveProfile} disabled={saving || !name} className="bg-emerald-600 hover:bg-emerald-700">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Change Password Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Key className="w-5 h-5" />
            Change Password
          </CardTitle>
          <CardDescription>Update your password to keep your account secure</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Current Password</Label>
            <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Enter current password" />
          </div>
          <div className="space-y-2">
            <Label>New Password</Label>
            <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password" />
          </div>
          <div className="flex justify-end">
            <Button onClick={handleChangePassword} disabled={changingPassword || !currentPassword || !newPassword} variant="outline">
              {changingPassword ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Key className="w-4 h-4 mr-2" />}
              Change Password
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
