'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, LockKeyhole, UserRound } from 'lucide-react'
import { toast } from 'sonner'
import { loginAdmin } from '@/lib/actions/admin-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [pending, startTransition] = useTransition()

  function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    startTransition(async () => {
      const result = await loginAdmin({ username: username.trim(), password })
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success(`Chào ${result.user.fullName}`)
      const from = searchParams.get('from')
      router.replace(from && from.startsWith('/admin') && from !== '/admin/login' ? from : '/admin')
      router.refresh()
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="admin-username">Tên đăng nhập hoặc email</Label>
        <div className="relative">
          <UserRound className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--muted)]" />
          <Input
            id="admin-username"
            className="h-11 pl-10"
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="admin"
            required
            disabled={pending}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="admin-password">Mật khẩu</Label>
        <div className="relative">
          <LockKeyhole className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--muted)]" />
          <Input
            id="admin-password"
            type="password"
            className="h-11 pl-10"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
            required
            disabled={pending}
          />
        </div>
      </div>

      <Button type="submit" className="h-11 w-full" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : null}
        Đăng nhập
      </Button>
    </form>
  )
}
