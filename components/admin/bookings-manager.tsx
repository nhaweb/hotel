'use client'

import { useState, useTransition } from 'react'
import { Loader2, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { getAdminBookings, updateBookingStatus } from '@/lib/actions/admin-bookings'
import { formatPrice } from '@/lib/format-price'
import type { AdminBookingItem, BookingStatus, PaginatedResult } from '@/types/admin'
import { BookingStatusBadge, PaymentStatusBadge } from '@/components/admin/status-badges'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

const STATUSES: Array<BookingStatus | 'all'> = ['all', 'pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled']

type Props = {
  initialResult: PaginatedResult<AdminBookingItem>
  initialError?: string
}

export function BookingsManager({ initialResult, initialError }: Props) {
  const [result, setResult] = useState(initialResult)
  const [status, setStatus] = useState<BookingStatus | 'all'>('all')
  const [search, setSearch] = useState('')
  const [pending, startTransition] = useTransition()
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  function load(nextStatus = status, nextSearch = search, page = 1) {
    startTransition(async () => {
      const response = await getAdminBookings({
        bookingStatus: nextStatus,
        searchQuery: nextSearch.trim() || undefined,
        page,
        pageSize: result.pageSize || 10,
      })
      if (!response.ok) {
        toast.error(response.error)
        return
      }
      setResult(response.result)
    })
  }

  function changeStatus(bookingId: string, next: BookingStatus) {
    setUpdatingId(bookingId)
    startTransition(async () => {
      const response = await updateBookingStatus({
        bookingId,
        status: next,
        adminName: 'Admin Staff',
      })
      setUpdatingId(null)
      if (!response.ok) {
        toast.error(response.error)
        return
      }
      toast.success('Đã cập nhật trạng thái đặt phòng')
      load()
    })
  }

  if (initialError && result.data.length === 0) {
    return <p className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{initialError}</p>
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-serif)] text-3xl tracking-tight">Bookings</h1>
          <p className="text-sm text-muted-foreground">Theo dõi và cập nhật nhanh trạng thái đặt phòng.</p>
        </div>
        <Button variant="outline" onClick={() => load()} disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : <RefreshCw />}
          Refresh
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 rounded-xl border border-border bg-card p-3">
        <select
          className="h-9 min-w-44 rounded-lg border border-input bg-background px-2.5 text-sm"
          value={status}
          onChange={(event) => {
            const next = event.target.value as BookingStatus | 'all'
            setStatus(next)
            load(next, search, 1)
          }}
          aria-label="Lọc trạng thái booking"
        >
          {STATUSES.map((item) => (
            <option key={item} value={item}>
              {item === 'all' ? 'Tất cả trạng thái' : item.replace('_', ' ').toUpperCase()}
            </option>
          ))}
        </select>
        <Input
          className="max-w-xs"
          placeholder="Mã PML / tên / SĐT"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') load(status, search, 1)
          }}
        />
        <Button
          variant="secondary"
          onClick={() => load(status, search, 1)}
          disabled={pending}
        >
          Lọc
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm">
        {pending && result.data.length === 0 ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã</TableHead>
                <TableHead>Khách</TableHead>
                <TableHead>Phòng</TableHead>
                <TableHead>Ngày</TableHead>
                <TableHead>Tổng tiền & Cọc</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Cập nhật</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.data.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell className="font-medium">{booking.bookingCode}</TableCell>
                  <TableCell>
                    {booking.customerName}
                    <span className="mt-0.5 block text-xs text-muted-foreground">{booking.customerPhone}</span>
                  </TableCell>
                  <TableCell>
                    {booking.roomTypeName}
                    <span className="mt-0.5 block text-xs text-muted-foreground">{booking.branchName}</span>
                  </TableCell>
                  <TableCell>
                    {booking.checkInDate} → {booking.checkOutDate}
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold text-foreground">{formatPrice(booking.totalAmountVnd)}</div>
                    {booking.depositAmountVnd > 0 ? (
                      <div className="mt-0.5 text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                        Đã cọc: {formatPrice(booking.depositAmountVnd)}
                      </div>
                    ) : (
                      <div className="mt-0.5 text-xs text-muted-foreground">Chưa cọc</div>
                    )}
                    <div className="mt-1">
                      <PaymentStatusBadge status={booking.paymentStatus} />
                    </div>
                  </TableCell>
                  <TableCell>
                    <BookingStatusBadge status={booking.bookingStatus} />
                  </TableCell>
                  <TableCell className="text-right">
                    <select
                      className="h-8 rounded-lg border border-input bg-background px-2 text-xs"
                      value={booking.bookingStatus}
                      disabled={pending && updatingId === booking.id}
                      onChange={(event) => changeStatus(booking.id, event.target.value as BookingStatus)}
                      aria-label={`Cập nhật trạng thái ${booking.bookingCode}`}
                    >
                      {STATUSES.filter((item) => item !== 'all').map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </TableCell>
                </TableRow>
              ))}
              {result.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                    Không có booking nào.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        )}
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Trang {result.page}/{result.totalPages} · {result.total} booking
        </span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={pending || result.page <= 1} onClick={() => load(status, search, result.page - 1)}>
            Trước
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={pending || result.page >= result.totalPages}
            onClick={() => load(status, search, result.page + 1)}
          >
            Sau
          </Button>
        </div>
      </div>
    </div>
  )
}
