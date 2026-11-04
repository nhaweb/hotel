'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { Footer, Header } from '@/components/site-client'
import { branches } from '@/data/branches'
import { rooms } from '@/data/rooms'
import { formatPrice } from '@/lib/format-price'
import { submitBooking } from '@/lib/submit-booking'
import { siteConfig } from '@/config/site'
import { blur, branchImages } from '@/lib/media'

const defaultBranchId = branches[0]?.id ?? ''

export default function BookingPage() {
  const [reference, setReference] = useState('')
  const [branchId, setBranchId] = useState(defaultBranchId)
  const [roomId, setRoomId] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const fromRoom = params.get('roomId') || params.get('room')
    const fromBranch = params.get('branchId')

    if (fromRoom) {
      const found = rooms.find(
        (r) => r.id === fromRoom || r.id === `room-${fromRoom}` || r.id.replace('room-', '') === fromRoom
      )
      if (found) {
        setRoomId(found.id)
        setBranchId(found.branchId)
        return
      }
    }

    if (fromBranch && branches.some((branch) => branch.id === fromBranch)) {
      setBranchId(fromBranch)
    }
  }, [])

  const selected = branches.find((branch) => branch.id === branchId) ?? branches[0]
  const branchRooms = rooms.filter((r) => r.branchId === branchId)
  const selectedRoom = branchRooms.find((r) => r.id === roomId)
  const poster = branchImages[selected?.id ?? defaultBranchId] ?? Object.values(branchImages)[0]

  return (
    <main>
      <Header />
      <section className="booking-page">
        <aside className="booking-poster" aria-live="polite">
          <Image
            key={selected?.id}
            src={poster}
            alt={selected ? `Poster ${selected.name}` : 'PML Hotel'}
            fill
            sizes="(max-width: 900px) 100vw, 50vw"
            placeholder="blur"
            blurDataURL={blur}
            priority
          />
          <div className="booking-poster__caption">
            <p className="eyebrow">Cơ sở PML</p>
            <h2>{selected?.name ?? 'PML Hotel'}</h2>
            <p>{selected?.tagline}</p>
          </div>
        </aside>

        <div className="booking-panel">
          <div>
            <p className="eyebrow ink">Yêu cầu đặt phòng</p>
            <h1>
              Kỳ nghỉ được <em>chăm chút.</em>
            </h1>
            <p>
              Đây là yêu cầu giữ chỗ, không phải xác nhận phòng theo thời gian thực. Đội ngũ PML sẽ liên hệ trực tiếp.
            </p>
            <a href={`tel:${siteConfig.hotline.replace(/\s/g, '')}`}>{siteConfig.hotline}</a>
          </div>

          <form
            onSubmit={async (event) => {
              event.preventDefault()
              const form = new FormData(event.currentTarget)
              const chosenRoom = String(form.get('roomTypeId') || '')
              const result = await submitBooking({
                branchId: String(form.get('branchId')),
                roomTypeId: chosenRoom ? chosenRoom : undefined,
                checkIn: String(form.get('checkIn')),
                checkOut: String(form.get('checkOut')),
                guests: Number(form.get('guests')),
                name: String(form.get('name')),
                phone: String(form.get('phone')),
                email: String(form.get('email')),
              })
              setReference(result.reference)
            }}
          >
            <label>
              Cơ sở
              <select
                name="branchId"
                required
                value={branchId}
                onChange={(event) => {
                  setBranchId(event.target.value)
                  setRoomId('')
                }}
              >
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Hạng phòng mong muốn
              <select
                name="roomTypeId"
                value={roomId}
                onChange={(event) => setRoomId(event.target.value)}
              >
                <option value="">-- Để PML tư vấn theo nhu cầu --</option>
                {branchRooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name} ({formatPrice(room.priceVnd)}/đêm)
                  </option>
                ))}
              </select>
            </label>
            {selectedRoom && (
              <p className="booking-room-pill" style={{ margin: '-0.3rem 0 0.8rem', fontSize: '0.82rem', color: 'var(--accent-dark)' }}>
                ✓ Đang chọn: <strong>{selectedRoom.name}</strong> · {formatPrice(selectedRoom.priceVnd)}/đêm
              </p>
            )}
            <div>
              <label>
                Nhận phòng
                <input type="date" name="checkIn" required />
              </label>
              <label>
                Trả phòng
                <input type="date" name="checkOut" required />
              </label>
            </div>
            <label>
              Số khách
              <input type="number" name="guests" min="1" max="8" defaultValue="2" required />
            </label>
            <label>
              Họ tên
              <input name="name" autoComplete="name" required />
            </label>
            <label>
              Số điện thoại
              <input name="phone" autoComplete="tel" required />
            </label>
            <label>
              Email
              <input type="email" name="email" autoComplete="email" />
            </label>
            <button className="button button-dark">Gửi yêu cầu</button>
            <p aria-live="polite">{reference && `Đã nhận yêu cầu ${reference}. PML sẽ liên hệ với Quý khách.`}</p>
          </form>
        </div>
      </section>

      {/* Footer Info Added */}
      <Footer />
    </main>
  )
}
