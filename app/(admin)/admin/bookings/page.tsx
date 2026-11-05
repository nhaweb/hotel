import { redirect } from 'next/navigation'
import { getCurrentAdmin } from '@/lib/actions/admin-auth'
import { getAdminBookings } from '@/lib/actions/admin-bookings'
import { BookingsManager } from '@/components/admin/bookings-manager'

export default async function AdminBookingsPage() {
  const auth = await getCurrentAdmin()
  if (!auth.ok) {
    redirect('/admin/login')
  }

  // Housekeeping staff is restricted from bookings
  if (!auth.user.permissions.canAccessBookings) {
    redirect('/admin/rooms')
  }

  const effectiveBranchId = auth.user.permissions.isBranchScoped
    ? auth.user.branchId || undefined
    : undefined

  const result = await getAdminBookings({ page: 1, pageSize: 10, branchId: effectiveBranchId })

  return (
    <BookingsManager
      initialResult={
        result.ok
          ? result.result
          : { data: [], total: 0, page: 1, pageSize: 10, totalPages: 1 }
      }
      initialError={result.ok ? undefined : result.error}
    />
  )
}
