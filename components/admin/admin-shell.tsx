'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  BedDouble,
  BookOpen,
  CalendarDays,
  LayoutDashboard,
  LogOut,
  Menu,
  Users,
  X,
} from 'lucide-react'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { logoutAdmin } from '@/lib/actions/admin-auth'
import type { AdminUser } from '@/types/admin'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

const nav = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/rooms', label: 'Rooms', icon: BedDouble },
  { href: '/admin/bookings', label: 'Bookings', icon: CalendarDays },
  { href: '/admin/faqs', label: 'FAQs / Knowledge', icon: BookOpen },
  { href: '/admin/leads', label: 'Leads', icon: Users },
]

const roleLabel: Record<AdminUser['role'], string> = {
  SUPER_ADMIN: 'Super Admin',
  MANAGER: 'Quản lý (Manager)',
  RECEPTIONIST: 'Lễ tân (Receptionist)',
  HOUSEKEEPING: 'Buồng phòng (Housekeeping)',
}

const roleBadgeTone: Record<AdminUser['role'], string> = {
  SUPER_ADMIN: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  MANAGER: 'border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300',
  RECEPTIONIST: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  HOUSEKEEPING: 'border-purple-500/30 bg-purple-500/10 text-purple-700 dark:text-purple-300',
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function AdminShell({ children, user }: { children: React.ReactNode; user: AdminUser | null }) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  // Filter navigation links based on user role permissions
  const visibleNav = nav.filter((item) => {
    if (!user || !user.permissions) return true
    if (item.href === '/admin') return user.permissions.canAccessOverview
    if (item.href === '/admin/rooms') return user.permissions.canAccessRooms
    if (item.href === '/admin/bookings') return user.permissions.canAccessBookings
    if (item.href === '/admin/faqs') return user.permissions.canAccessFaqs
    if (item.href === '/admin/leads') return user.permissions.canAccessLeads
    return true
  })

  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  function handleLogout() {
    startTransition(async () => {
      const result = await logoutAdmin()
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success('Đã đăng xuất')
      router.replace('/admin/login')
      router.refresh()
    })
  }

  return (
    <div className="min-h-svh bg-background text-foreground">
      <div className="flex min-h-svh">
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border bg-card transition-transform lg:static lg:translate-x-0',
            open ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <div className="flex h-16 items-center justify-between px-5">
            <Link href="/admin" className="font-[family-name:var(--font-serif)] text-xl tracking-tight">
              PML Admin
            </Link>
            <Button variant="ghost" size="icon-sm" className="lg:hidden" onClick={() => setOpen(false)} aria-label="Đóng menu">
              <X />
            </Button>
          </div>
          <Separator />
          <nav className="flex flex-1 flex-col gap-1 p-3">
            {visibleNav.map((item) => {
              const active = item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href)
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    active
                      ? 'bg-[var(--cream-2)] text-[var(--ink)] shadow-[inset_3px_0_0_0_var(--accent)]'
                      : 'text-[var(--muted)] hover:bg-[var(--cream-2)]/70 hover:text-[var(--ink)]'
                  )}
                >
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
          <div className="border-t border-border p-4 text-xs text-muted-foreground space-y-1">
            <div className="flex items-center justify-between">
              <span>Phân quyền:</span>
              <span className="font-medium text-foreground">{user ? roleLabel[user.role] : '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Cơ sở:</span>
              <span className="font-medium text-foreground">{user?.branchName || (user?.role === 'SUPER_ADMIN' ? 'Toàn chuỗi (3)' : '—')}</span>
            </div>
          </div>
        </aside>

        {open ? <button type="button" className="fixed inset-0 z-30 bg-black/30 lg:hidden" aria-label="Đóng overlay" onClick={() => setOpen(false)} /> : null}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-border bg-card/95 px-4 backdrop-blur lg:px-6">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon-sm" className="lg:hidden" onClick={() => setOpen(true)} aria-label="Mở menu">
                <Menu />
              </Button>
              <div>
                <p className="text-xs tracking-[0.14em] text-muted-foreground uppercase">PML Hotel</p>
                <p className="text-sm font-medium">Operations Console</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden text-right sm:block">
                <div className="flex items-center justify-end gap-2">
                  <p className="text-sm font-medium">{user?.fullName ?? 'Nhân sự'}</p>
                  {user && (
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium leading-none',
                        roleBadgeTone[user.role]
                      )}
                    >
                      {roleLabel[user.role]}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {user ? (user.branchName ? `📍 ${user.branchName}` : '🌐 Quản trị toàn chuỗi') : 'Chưa đăng nhập'}
                </p>
              </div>
              <Avatar>
                <AvatarFallback className="bg-secondary text-sm font-semibold">
                  {user ? initials(user.fullName) : '—'}
                </AvatarFallback>
              </Avatar>
              <Button variant="outline" size="sm" onClick={handleLogout} disabled={pending || !user} aria-label="Đăng xuất">
                <LogOut />
                <span className="hidden md:inline">Đăng xuất</span>
              </Button>
            </div>
          </header>
          <main className="flex-1 p-4 lg:p-6">{children}</main>
        </div>
      </div>
    </div>
  )
}
