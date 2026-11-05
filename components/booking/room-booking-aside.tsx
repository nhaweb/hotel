'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Calendar, CheckCircle2, ChevronRight, Phone, Sparkles } from 'lucide-react'
import type { Room } from '@/data/rooms'
import { formatPrice } from '@/lib/format-price'
import type { Locale } from '@/config/site'

interface Props {
  room: Room
  locale: Locale
  hotline: string
}

function getTomorrowDateString(offsetDays = 1): string {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  return d.toISOString().split('T')[0]
}

function calculateNights(start: string, end: string): number {
  if (!start || !end) return 1
  const s = new Date(start).getTime()
  const e = new Date(end).getTime()
  const diffDays = Math.round((e - s) / (1000 * 60 * 60 * 24))
  return diffDays > 0 ? diffDays : 1
}

export function RoomBookingAside({ room, locale, hotline }: Props) {
  const [checkIn, setCheckIn] = useState(getTomorrowDateString(0))
  const [checkOut, setCheckOut] = useState(getTomorrowDateString(2))

  const nights = calculateNights(checkIn, checkOut)
  const estimatedTotal = room.priceVnd * nights

  const view = locale === 'en' ? room.viewEn : room.view
  const bookingUrl = `/dat-phong?room=${room.id}&branchId=${room.branchId}&checkIn=${checkIn}&checkOut=${checkOut}&guests=2`

  return (
    <aside className="room-booking-card">
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <p className="eyebrow ink text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
          {room.category}
        </p>
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
          <Sparkles className="h-3 w-3" /> Kiểm tra trực tiếp
        </span>
      </div>

      <div className="mt-1">
        <strong className="text-2xl font-bold tracking-tight text-foreground">
          {formatPrice(room.priceVnd)}
        </strong>
        <small className="ml-1 text-xs text-muted-foreground">
          {locale === 'en' ? '/ night' : '/ đêm'}
        </small>
      </div>

      {/* Date Pickers */}
      <div className="my-2 rounded-xl border border-border/80 bg-muted/30 p-3 space-y-2.5">
        <div className="grid grid-cols-2 gap-2 text-left">
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              <Calendar className="inline h-3 w-3 mr-1 text-amber-600" />
              {locale === 'en' ? 'Check-in' : 'Nhận phòng'}
            </label>
            <input
              type="date"
              value={checkIn}
              min={getTomorrowDateString(0)}
              onChange={(e) => {
                setCheckIn(e.target.value)
                if (e.target.value >= checkOut) {
                  const nextDay = new Date(e.target.value)
                  nextDay.setDate(nextDay.getDate() + 1)
                  setCheckOut(nextDay.toISOString().split('T')[0])
                }
              }}
              className="w-full rounded-md border border-input bg-background px-2 py-1 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-amber-600"
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              <Calendar className="inline h-3 w-3 mr-1 text-amber-600" />
              {locale === 'en' ? 'Check-out' : 'Trả phòng'}
            </label>
            <input
              type="date"
              value={checkOut}
              min={checkIn || getTomorrowDateString(1)}
              onChange={(e) => setCheckOut(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-2 py-1 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-amber-600"
            />
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-border/60 pt-2 text-xs">
          <span className="text-muted-foreground">
            {locale === 'en' ? `Stay: ${nights} nights` : `Lưu trú: ${nights} đêm`}
          </span>
          <span className="font-semibold text-foreground">
            {locale === 'en' ? 'Est: ' : 'Tạm tính: '}
            <strong className="text-amber-700 dark:text-amber-400 font-bold">
              {formatPrice(estimatedTotal)}
            </strong>
          </span>
        </div>
      </div>

      <ul className="my-1 space-y-1 text-xs text-muted-foreground">
        <li>• {view}</li>
        <li>• {room.sizeSqm} m² · {room.bedType}</li>
        <li>• {room.maxAdults} {locale === 'en' ? 'adults max' : 'người lớn tối đa'}</li>
        {room.breakfastIncluded && (
          <li className="text-emerald-700 dark:text-emerald-400 font-medium">
            ✓ {locale === 'en' ? 'Breakfast included' : 'Bao gồm bữa sáng'}
          </li>
        )}
      </ul>

      {/* Main Booking Action */}
      <Link
        className="button button-accent w-full justify-center text-center font-bold shadow-md hover:shadow-lg transition-all"
        href={bookingUrl}
      >
        <span>{locale === 'en' ? 'Book this room now' : 'Đặt phòng này ngay'}</span>
        <ChevronRight className="h-4 w-4 ml-1" />
      </Link>

      <a
        className="button button-ghost-ink w-full justify-center text-xs"
        href={`tel:${hotline.replace(/\s/g, '')}`}
      >
        <Phone size={14} className="mr-1.5" />
        <span>Hotline: {hotline}</span>
      </a>

      <p className="text-[11px] text-muted-foreground text-center leading-relaxed mt-1">
        {locale === 'en'
          ? 'Real-time inventory check with instant VietQR deposit hold.'
          : 'Hệ thống kiểm tra phòng trống thời gian thực & giữ chỗ qua VietQR.'}
      </p>
    </aside>
  )
}

