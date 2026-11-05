import type { Metadata } from 'next'
import { AdminShell } from '@/components/admin/admin-shell'
import { Toaster } from '@/components/ui/sonner'
import { getCurrentAdmin } from '@/lib/actions/admin-auth'

export const metadata: Metadata = {
  title: 'Admin | PML Hotel',
  robots: { index: false, follow: false },
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const auth = await getCurrentAdmin()

  return (
    <>
      <AdminShell user={auth.ok ? auth.user : null}>{children}</AdminShell>
      <Toaster position="top-right" richColors closeButton />
    </>
  )
}
