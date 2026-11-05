import type { AdminRole, AdminUser, RolePermissions } from '@/types/admin'

export const ROLE_PERMISSIONS: Record<AdminRole, RolePermissions> = {
  SUPER_ADMIN: {
    canAccessOverview: true,
    canAccessRooms: true,
    canAccessBookings: true,
    canAccessFaqs: true,
    canAccessLeads: true,

    canManageHousekeeping: true,
    canManageRooms: true,
    canUpdateRoomPricing: true,
    canCreateBooking: true,
    canModifyBooking: true,
    canManageFaqs: true,
    canCreateLead: true,
    canUpdateLead: true,
    canConvertLead: true,

    isBranchScoped: false,
  },
  MANAGER: {
    canAccessOverview: true,
    canAccessRooms: true,
    canAccessBookings: true,
    canAccessFaqs: true,
    canAccessLeads: true,

    canManageHousekeeping: true,
    canManageRooms: true,
    canUpdateRoomPricing: true,
    canCreateBooking: true,
    canModifyBooking: true,
    canManageFaqs: true,
    canCreateLead: true,
    canUpdateLead: true,
    canConvertLead: true,

    isBranchScoped: true,
  },
  RECEPTIONIST: {
    canAccessOverview: false,
    canAccessRooms: true,
    canAccessBookings: true,
    canAccessFaqs: true,
    canAccessLeads: true,

    canManageHousekeeping: true,
    canManageRooms: false,
    canUpdateRoomPricing: false,
    canCreateBooking: true,
    canModifyBooking: true,
    canManageFaqs: false,
    canCreateLead: true,
    canUpdateLead: true,
    canConvertLead: true,

    isBranchScoped: true,
  },
  HOUSEKEEPING: {
    canAccessOverview: false,
    canAccessRooms: true,
    canAccessBookings: false,
    canAccessFaqs: false,
    canAccessLeads: false,

    canManageHousekeeping: true,
    canManageRooms: false,
    canUpdateRoomPricing: false,
    canCreateBooking: false,
    canModifyBooking: false,
    canManageFaqs: false,
    canCreateLead: false,
    canUpdateLead: false,
    canConvertLead: false,

    isBranchScoped: true,
  },
}

export function getRolePermissions(role: AdminRole): RolePermissions {
  return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.HOUSEKEEPING
}

export function canUserAccessBranch(user: AdminUser, branchId?: string | null): boolean {
  if (user.role === 'SUPER_ADMIN') return true
  if (!branchId) return true
  return user.branchId === branchId
}

export function getEffectiveBranchId(user: AdminUser, requestedBranchId?: string): string | undefined {
  if (user.role === 'SUPER_ADMIN') {
    return requestedBranchId
  }
  // For branch-scoped staff (Manager, Receptionist, Housekeeping), force their assigned branchId
  return user.branchId || undefined
}

