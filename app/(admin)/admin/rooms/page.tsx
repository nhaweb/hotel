import { redirect } from 'next/navigation'
import { getCurrentAdmin } from '@/lib/actions/admin-auth'
import { getAdminRoomUnits, getAdminRoomTypes, getAdminBranches } from '@/lib/actions/admin-rooms'
import { RoomsManager } from '@/components/admin/rooms-manager'

export default async function AdminRoomsPage() {
  const auth = await getCurrentAdmin()
  if (!auth.ok) {
    redirect('/admin/login')
  }

  const effectiveBranchId = auth.user.permissions.isBranchScoped
    ? auth.user.branchId || undefined
    : undefined

  const [unitsResult, roomTypesResult, branchesResult] = await Promise.all([
    getAdminRoomUnits(effectiveBranchId),
    getAdminRoomTypes(effectiveBranchId),
    getAdminBranches(),
  ])

  return (
    <RoomsManager
      user={auth.user}
      initialUnits={unitsResult.ok ? unitsResult.units : []}
      initialRoomTypes={roomTypesResult.ok ? roomTypesResult.roomTypes : []}
      branches={branchesResult.ok ? branchesResult.branches : []}
      initialError={unitsResult.ok ? undefined : unitsResult.error}
    />
  )
}

