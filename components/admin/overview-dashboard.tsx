'use client'

import Link from 'next/link'
import { BedDouble, CalendarCheck2, DoorOpen, Percent, Wallet } from 'lucide-react'
import type { DashboardStats } from '@/types/admin'
import { formatPrice } from '@/lib/format-price'
import { BookingStatusBadge } from '@/components/admin/status-badges'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

type Props = {
  stats: DashboardStats
}

export function OverviewDashboard({ stats }: Props) {
  const cards = [
    { label: 'Check-in hôm nay', value: stats.todayCheckIns, icon: CalendarCheck2 },
    { label: 'Check-out hôm nay', value: stats.todayCheckOuts, icon: DoorOpen },
    { label: 'Phòng trống', value: stats.totalAvailableRooms, icon: BedDouble },
    { label: 'Occupancy', value: `${stats.occupancyRatePercent}%`, icon: Percent },
    { label: 'Pending', value: stats.pendingBookingsCount, icon: CalendarCheck2 },
    { label: 'Doanh thu tháng', value: formatPrice(stats.totalRevenueMonthVnd), icon: Wallet },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-serif)] text-3xl tracking-tight">Overview</h1>
        <p className="text-sm text-muted-foreground">KPI vận hành realtime của PML Hotel.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardDescription>{card.label}</CardDescription>
                <Icon className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <CardTitle className="text-2xl font-semibold tracking-tight">{card.value}</CardTitle>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Booking gần đây</CardTitle>
            <CardDescription>
              <Link href="/admin/bookings" className="text-primary underline-offset-4 hover:underline">
                Xem tất cả bookings
              </Link>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã</TableHead>
                  <TableHead>Khách</TableHead>
                  <TableHead>Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.recentBookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-medium">{booking.bookingCode}</TableCell>
                    <TableCell>{booking.customerName}</TableCell>
                    <TableCell>
                      <BookingStatusBadge status={booking.bookingStatus} />
                    </TableCell>
                  </TableRow>
                ))}
                {stats.recentBookings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                      Chưa có booking gần đây.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Room status</CardTitle>
            <CardDescription>Phân bổ trạng thái phòng vật lý</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {Object.entries(stats.roomStatusBreakdown).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between rounded-lg bg-secondary/70 px-3 py-2">
                <span className="capitalize text-muted-foreground">{key}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
