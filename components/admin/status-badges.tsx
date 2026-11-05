import { Badge } from '@/components/ui/badge'
import type { BookingStatus, PaymentStatus, RoomUnitStatus } from '@/types/admin'

const roomStatusTone: Record<RoomUnitStatus, string> = {
  AVAILABLE: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  OCCUPIED: 'bg-sky-100 text-sky-800 border-sky-200',
  DIRTY: 'bg-amber-100 text-amber-900 border-amber-200',
  CLEANING: 'bg-violet-100 text-violet-800 border-violet-200',
  MAINTENANCE: 'bg-rose-100 text-rose-800 border-rose-200',
}

const bookingStatusTone: Record<BookingStatus, string> = {
  pending: 'bg-amber-100 text-amber-900 border-amber-200',
  confirmed: 'bg-sky-100 text-sky-800 border-sky-200',
  checked_in: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  checked_out: 'bg-slate-100 text-slate-700 border-slate-200',
  cancelled: 'bg-rose-100 text-rose-800 border-rose-200',
}

const paymentStatusTone: Record<PaymentStatus, string> = {
  pending: 'bg-amber-50 text-amber-800 border-amber-200',
  unpaid: 'bg-zinc-100 text-zinc-700 border-zinc-200',
  partial: 'bg-sky-50 text-sky-800 border-sky-200',
  paid: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  refunded: 'bg-rose-50 text-rose-800 border-rose-200',
}

const paymentStatusLabel: Record<PaymentStatus, string> = {
  pending: 'Chờ thanh toán',
  unpaid: 'Chưa thanh toán',
  partial: 'Đã cọc 1 phần',
  paid: 'Đã thanh toán đủ',
  refunded: 'Đã hoàn tiền',
}

export function RoomStatusBadge({ status }: { status: RoomUnitStatus }) {
  return (
    <Badge variant="outline" className={roomStatusTone[status]}>
      {status}
    </Badge>
  )
}

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  return (
    <Badge variant="outline" className={bookingStatusTone[status]}>
      {status.replace('_', ' ')}
    </Badge>
  )
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return (
    <Badge variant="outline" className={paymentStatusTone[status] || 'bg-muted text-muted-foreground'}>
      {paymentStatusLabel[status] || status}
    </Badge>
  )
}
