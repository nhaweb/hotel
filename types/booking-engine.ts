/**
 * PML Boutique & Lifestyle Hotel
 * Online Booking Engine & Payment Systems Types
 */

import type { BookingStatus, PaymentMethod, PaymentStatus } from '@/types/admin'

export interface CheckAvailabilityInput {
  branchId: string
  checkInDate: string // YYYY-MM-DD
  checkOutDate: string // YYYY-MM-DD
  guests?: number
  rooms?: number
}

export interface AvailableRoomType {
  id: string
  branchId: string
  branchName: string
  name: string
  slug: string
  sizeSqm: number
  maxGuests: number
  totalInventory: number
  availableRooms: number
  basePriceVnd: number
  totalPriceVnd: number
  deposit30Vnd: number
  deposit50Vnd: number
  features: string[]
  description: string | null
  imageUrl: string | null
  nights: number
}

export interface CreateRoomHoldInput {
  roomTypeId: string
  branchId: string
  checkInDate: string
  checkOutDate: string
  numRooms: number
  sessionId: string
}

export interface RoomHoldResult {
  holdId: string
  expiresAt: string
  numRooms: number
}

export type OnlinePaymentOption = 'DEPOSIT_30' | 'DEPOSIT_50' | 'FULL_PAYMENT' | 'PAY_AT_HOTEL'

export interface CreateOnlineBookingInput {
  branchId: string
  roomTypeId: string
  checkInDate: string
  checkOutDate: string
  numGuests?: number
  numRooms?: number
  customerName: string
  customerPhone: string
  customerEmail?: string | null
  specialRequests?: string | null
  paymentOption: OnlinePaymentOption
  paymentMethod: PaymentMethod
  sessionId?: string
}

export interface VietQrPaymentDetails {
  bankId: string // e.g. "MB", "ICB"
  bankName: string // e.g. "Ngân hàng TMCP Quân Đội"
  accountNo: string // e.g. "0789780167"
  accountName: string // e.g. "PML HOTEL GROUP"
  amountVnd: number
  description: string // e.g. "PML-2688"
  qrImageUrl: string // QuickChart / VietQR quick image URL
  expiresAt: string // ISO date
}

export interface OnlineBookingResult {
  bookingId: string
  bookingCode: string
  customerName: string
  customerPhone: string
  branchName: string
  roomTypeName: string
  checkInDate: string
  checkOutDate: string
  nights: number
  numGuests: number
  numRooms: number
  totalAmountVnd: number
  depositRequiredVnd: number
  paymentOption: OnlinePaymentOption
  paymentMethod: PaymentMethod
  bookingStatus: BookingStatus
  paymentStatus: PaymentStatus
  qrPayment?: VietQrPaymentDetails | null
  expiresAt: string
}

export interface PaymentTransactionRecord {
  id: string
  bookingId: string
  bookingCode: string
  transactionCode: string
  paymentMethod: PaymentMethod
  paymentType: 'DEPOSIT' | 'FULL' | 'REMAINING' | 'REFUND'
  amountVnd: number
  feeVnd: number
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED'
  providerRef: string | null
  createdAt: string
  updatedAt: string
}

