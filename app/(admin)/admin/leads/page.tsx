import { redirect } from 'next/navigation'
import { getAdminLeads, getAdminLeadStats } from '@/lib/actions/admin-leads'
import { getCurrentAdmin } from '@/lib/actions/admin-auth'
import { LeadsManager } from '@/components/admin/leads-manager'
import { branches } from '@/data/branches'
import { rooms } from '@/data/rooms'

export default async function AdminLeadsPage() {
  const auth = await getCurrentAdmin()
  if (!auth.ok) {
    redirect('/admin/login')
  }

  // Housekeeping staff is restricted from CRM Leads
  if (!auth.user.permissions.canAccessLeads) {
    redirect('/admin/rooms')
  }

  const effectiveBranchId = auth.user.permissions.isBranchScoped
    ? auth.user.branchId || undefined
    : undefined

  const [leadsResult, statsResult] = await Promise.all([
    getAdminLeads({ page: 1, pageSize: 10, branchId: effectiveBranchId }),
    getAdminLeadStats(effectiveBranchId),
  ])

  return (
    <LeadsManager
      user={auth.user}
      initialResult={
        leadsResult.ok
          ? leadsResult.result
          : { data: [], total: 0, page: 1, pageSize: 10, totalPages: 1 }
      }
      initialStats={statsResult.ok ? statsResult.stats : null}
      initialError={leadsResult.ok ? undefined : leadsResult.error}
      branches={branches.map((branch) => ({
        id: branch.id,
        name: branch.name,
        shortName: branch.shortName,
      }))}
      rooms={rooms.map((room) => ({
        id: room.id,
        name: room.name,
        branchId: room.branchId,
        priceVnd: room.priceVnd,
      }))}
    />
  )
}
