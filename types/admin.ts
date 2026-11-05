/**
 * PML Boutique & Lifestyle Hotel
 * Admin & Management System TypeScript Definitions
 */

export type BookingStatus = 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled'

export type PaymentStatus = 'pending' | 'unpaid' | 'partial' | 'paid' | 'refunded'

export type PaymentMethod = 'UNPAID' | 'CASH' | 'BANK_TRANSFER' | 'VNPAY' | 'CREDIT_CARD' | 'VIETQR' | 'STRIPE'

export type RoomUnitStatus = 'AVAILABLE' | 'OCCUPIED' | 'DIRTY' | 'CLEANING' | 'MAINTENANCE'

export interface AdminBranchItem {
  id: string
  name: string
  slug: string
  address: string
}

export interface AdminBookingItem {
  id: string
  bookingCode: string
  customerName: string
  customerPhone: string
  customerEmail: string | null
  branchId: string
  branchName: string
  roomTypeId: string
  roomTypeName: string
  assignedRoomUnitId: string | null
  roomNumber: string | null
  checkInDate: string
  checkOutDate: string
  numGuests: number
  numRooms: number
  totalAmountVnd: number
  depositAmountVnd: number
  paymentStatus: PaymentStatus
  paymentMethod: PaymentMethod
  bookingStatus: BookingStatus
  specialRequests: string | null
  internalNotes: string | null
  createdAt: string
  updatedAt: string
}

export interface AdminBookingFilter {
  branchId?: string
  bookingStatus?: BookingStatus | 'all'
  paymentStatus?: PaymentStatus | 'all'
  searchQuery?: string // searches code, customer name, phone
  startDate?: string   // YYYY-MM-DD
  endDate?: string     // YYYY-MM-DD
  page?: number
  pageSize?: number
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface RoomUnit {
  id: string
  branchId: string
  branchName: string
  roomTypeId: string
  roomTypeName: string
  basePriceVnd: number
  roomNumber: string
  floor: number
  status: RoomUnitStatus
  notes: string | null
  currentBookingId?: string | null
  currentCustomerId?: string | null
  currentCustomerPhone?: string | null
  currentBookingCode: string | null
  currentGuestName: string | null
  currentCheckOut: string | null
  currentTotalAmountVnd?: number
  currentDepositAmountVnd?: number
  currentPaymentStatus?: PaymentStatus
  updatedAt: string
}

export interface CreateRoomUnitInput {
  branchId: string
  roomTypeId: string
  roomNumber: string
  floor: number
  status?: RoomUnitStatus
  notes?: string | null
  adminName?: string
}

export interface UpdateRoomUnitInput {
  roomUnitId: string
  roomNumber?: string
  floor?: number
  roomTypeId?: string
  status?: RoomUnitStatus
  notes?: string | null
  adminName?: string
}

export interface AdminRoomTypeItem {
  id: string
  branchId: string
  branchName: string
  name: string
  slug: string
  sizeSqm: number
  maxGuests: number
  totalInventory: number
  basePriceVnd: number
  description: string | null
  features: string[]
  physicalRoomsCount: number
}

export interface CreateRoomTypeInput {
  id?: string
  branchId: string
  name: string
  slug?: string
  sizeSqm: number
  maxGuests?: number
  totalInventory?: number
  basePriceVnd: number
  description?: string | null
  features?: string[]
  adminName?: string
}

export interface UpdateRoomTypeInput {
  roomTypeId: string
  name?: string
  sizeSqm?: number
  maxGuests?: number
  totalInventory?: number
  basePriceVnd?: number
  description?: string | null
  features?: string[]
  adminName?: string
}

export interface DashboardStats {
  todayCheckIns: number
  todayCheckOuts: number
  totalOccupiedRooms: number
  totalAvailableRooms: number
  occupancyRatePercent: number
  pendingBookingsCount: number
  confirmedBookingsCount: number
  totalRevenueMonthVnd: number
  recentBookings: AdminBookingItem[]
  roomStatusBreakdown: {
    available: number
    occupied: number
    dirty: number
    cleaning: number
    maintenance: number
  }
}

export interface FaqItem {
  id: string
  category: string
  question: string
  questionEn: string | null
  answer: string
  answerEn: string | null
  keywords: string[]
  isActive: boolean
  displayOrder: number
  createdAt: string
  updatedAt: string
}

export interface HotelService {
  id: string
  branchId: string | null
  name: string
  nameEn: string | null
  category: 'ONSEN' | 'SPA' | 'DINING' | 'TRANSPORT' | 'EXPERIENCE'
  priceVnd: number | null
  description: string | null
  isActive: boolean
}

export interface AdminActivityLog {
  id: string
  adminName: string
  action: string
  entityType: 'BOOKING' | 'ROOM_UNIT' | 'ROOM_TYPE' | 'FAQ' | 'SERVICE' | 'LEAD' | 'LEAD_INTERACTION'
  entityId: string
  details: Record<string, unknown> | null
  createdAt: string
}

// ==========================================
// MINI-CRM TYPES & INTERFACES
// ==========================================

export type LeadSource =
  | 'WEBSITE'
  | 'AI_CHATBOT'
  | 'HOTLINE'
  | 'ZALO'
  | 'FACEBOOK'
  | 'WALK_IN'
  | 'REFERRAL'
  | 'EVENT'

export type LeadStage =
  | 'NEW'
  | 'CONTACTED'
  | 'CONSULTING'
  | 'PROPOSAL_SENT'
  | 'NEGOTIATING'
  | 'WON_BOOKED'
  | 'LOST'

export type LeadPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'VIP'

export type LeadInteractionType =
  | 'CALL'
  | 'ZALO'
  | 'EMAIL'
  | 'NOTE'
  | 'MEETING'
  | 'STAGE_CHANGE'

export interface LeadInteraction {
  id: string
  leadId: string
  staffName: string
  type: LeadInteractionType
  content: string
  createdAt: string
}

export interface AdminLeadItem {
  id: string
  fullName: string
  phone: string
  email: string | null
  source: LeadSource
  stage: LeadStage
  priority: LeadPriority
  branchId: string | null
  branchName: string | null
  roomTypeId: string | null
  roomTypeName: string | null
  estimatedCheckIn: string | null
  estimatedCheckOut: string | null
  numGuests: number
  budgetVnd: number | null
  interestNotes: string | null
  internalNotes: string | null
  assignedStaff: string | null
  tags: string[]
  convertedBookingId: string | null
  convertedBookingCode: string | null
  latestInteraction: string | null
  latestInteractionAt: string | null
  createdAt: string
  updatedAt: string
}

export interface AdminLeadDetail extends AdminLeadItem {
  interactions: LeadInteraction[]
}

export interface AdminLeadFilter {
  stage?: LeadStage | 'all'
  source?: LeadSource | 'all'
  priority?: LeadPriority | 'all'
  branchId?: string
  searchQuery?: string // matches name, phone, email, tags
  assignedStaff?: string
  startDate?: string
  endDate?: string
  page?: number
  pageSize?: number
}

export interface AdminLeadStats {
  totalLeads: number
  newLeadsCount: number
  consultingLeadsCount: number
  wonLeadsCount: number
  lostLeadsCount: number
  conversionRatePercent: number
  totalPotentialRevenueVnd: number
  stageBreakdown: Record<string, number>
  sourceBreakdown: Record<string, number>
  priorityBreakdown: Record<string, number>
}

export interface CreateLeadInput {
  fullName: string
  phone: string
  email?: string | null
  source?: LeadSource
  priority?: LeadPriority
  branchId?: string | null
  roomTypeId?: string | null
  estimatedCheckIn?: string | null
  estimatedCheckOut?: string | null
  numGuests?: number
  budgetVnd?: number | null
  interestNotes?: string | null
  internalNotes?: string | null
  assignedStaff?: string | null
  tags?: string[]
}

export interface UpdateLeadInput {
  leadId: string
  fullName?: string
  phone?: string
  email?: string | null
  priority?: LeadPriority
  branchId?: string | null
  roomTypeId?: string | null
  estimatedCheckIn?: string | null
  estimatedCheckOut?: string | null
  numGuests?: number
  budgetVnd?: number | null
  interestNotes?: string | null
  internalNotes?: string | null
  assignedStaff?: string | null
  tags?: string[]
  adminName?: string
}

export interface ConvertLeadToBookingInput {
  leadId: string
  branchId: string
  roomTypeId: string
  checkInDate: string
  checkOutDate: string
  numGuests?: number
  numRooms?: number
  totalAmountVnd: number
  depositAmountVnd?: number
  paymentMethod?: 'UNPAID' | 'CASH' | 'BANK_TRANSFER' | 'VNPAY' | 'CREDIT_CARD'
  assignedRoomUnitId?: string | null
  specialRequests?: string | null
  internalNotes?: string | null
  adminName?: string
}

// ==========================================
// ADMIN AUTHENTICATION & USERS
// ==========================================

export type AdminRole = 'SUPER_ADMIN' | 'MANAGER' | 'RECEPTIONIST' | 'HOUSEKEEPING'

export interface RolePermissions {
  canAccessOverview: boolean
  canAccessRooms: boolean
  canAccessBookings: boolean
  canAccessFaqs: boolean
  canAccessLeads: boolean

  canManageHousekeeping: boolean
  canManageRooms: boolean
  canUpdateRoomPricing: boolean
  canCreateBooking: boolean
  canModifyBooking: boolean
  canManageFaqs: boolean
  canCreateLead: boolean
  canUpdateLead: boolean
  canConvertLead: boolean

  isBranchScoped: boolean
}

export interface AdminUser {
  id: string
  username: string
  email: string
  fullName: string
  role: AdminRole
  branchId: string | null
  branchName: string | null
  isActive: boolean
  lastLoginAt: string | null
  createdAt: string
  permissions: RolePermissions
}

export interface LoginCredentials {
  username: string // accepts either username or email
  password: string
}

export interface ChangePasswordInput {
  currentPassword: string
  newPassword: string
}



