'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Phone } from 'lucide-react'
import { Footer, Header } from '@/components/site-client'
import { branches } from '@/data/branches'
import { rooms } from '@/data/rooms'
import { siteConfig } from '@/config/site'
import { BookingWizard } from '@/components/booking/booking-wizard'

function isRoomMatch(candidateId?: string | null, targetId?: string | null): boolean {
  if (!candidateId || !targetId) return false
  if (candidateId === targetId) return true
  const cleanA = candidateId.trim().toLowerCase().replace(/^room-/, '')
  const cleanB = targetId.trim().toLowerCase().replace(/^room-/, '')
  return cleanA === cleanB
}

function BookingWizardContainer() {
  const searchParams = useSearchParams()
  const rawRoom = searchParams.get('roomId') || searchParams.get('room') || ''
  const rawBranch = searchParams.get('branchId') || searchParams.get('branch') || ''
  const checkIn = searchParams.get('checkIn') || ''
  const checkOut = searchParams.get('checkOut') || ''
  const rawGuests = parseInt(searchParams.get('guests') || '2', 10)
  const guests = isNaN(rawGuests) || rawGuests < 1 ? 2 : rawGuests

  // Auto-detect branch from room if branch is missing or not found
  let resolvedBranchId = branches.some((b) => b.id === rawBranch) ? rawBranch : ''
  if (!resolvedBranchId && rawRoom) {
    const matchedRoom = rooms.find((r) => isRoomMatch(r.id, rawRoom))
    if (matchedRoom && branches.some((b) => b.id === matchedRoom.branchId)) {
      resolvedBranchId = matchedRoom.branchId
    }
  }
  if (!resolvedBranchId) {
    resolvedBranchId = branches[0]?.id ?? ''
  }

  return (
    <BookingWizard
      key={`${resolvedBranchId}-${rawRoom}-${checkIn}-${checkOut}-${guests}`}
      branches={branches}
      defaultBranchId={resolvedBranchId}
      defaultRoomTypeId={rawRoom}
      defaultCheckIn={checkIn}
      defaultCheckOut={checkOut}
      defaultGuests={guests}
    />
  )
}

export default function BookingPage() {
  return (
    <main>
      <Header />
      <section className="booking-page">
        <div className="booking-panel w-full">
          <header className="booking-page__intro">
            <div className="booking-page__intro-copy">
              <p className="eyebrow ink">Đặt phòng trực tuyến</p>
              <h1>
                Giữ phòng & thanh toán <em>trong 3 bước.</em>
              </h1>
              <p className="booking-page__lead">
                Cọc 30% qua VietQR · Thanh toán đủ (giảm 5%) · Hoặc trả tại quầy. Hệ thống kiểm tra phòng trống thời gian thực.
              </p>
            </div>
            <a className="booking-hotline-btn" href={`tel:${siteConfig.hotline.replace(/\s/g, '')}`}>
              <Phone size={15} />
              <span>Hotline: {siteConfig.hotline}</span>
            </a>
          </header>

          <Suspense
            fallback={
              <div className="rounded-2xl border border-border bg-card p-12 text-center text-muted-foreground">
                <p>Đang tải hệ thống đặt phòng trực tuyến PML...</p>
              </div>
            }
          >
            <BookingWizardContainer />
          </Suspense>
        </div>
      </section>
      <Footer />
    </main>
  )
}
