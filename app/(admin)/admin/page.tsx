import { redirect } from 'next/navigation'
import { getCurrentAdmin } from '@/lib/actions/admin-auth'
import { getAdminDashboardStats } from '@/lib/actions/admin-dashboard'
import { OverviewDashboard } from '@/components/admin/overview-dashboard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function AdminOverviewPage() {
  const auth = await getCurrentAdmin()
  if (!auth.ok) {
    redirect('/admin/login')
  }

  // Role redirection for users without financial overview access
  if (!auth.user.permissions.canAccessOverview) {
    if (auth.user.permissions.canAccessBookings) {
      redirect('/admin/bookings')
    } else {
      redirect('/admin/rooms')
    }
  }

  const effectiveBranchId = auth.user.permissions.isBranchScoped
    ? auth.user.branchId || undefined
    : undefined

  const result = await getAdminDashboardStats(effectiveBranchId)

  if (!result.ok) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Không tải được Overview</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-rose-700">{result.error}</CardContent>
      </Card>
    )
  }

  return <OverviewDashboard stats={result.stats} />
}
