'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { Header } from '@/components/site-client'
import { branches } from '@/data/branches'
import { submitBooking } from '@/lib/submit-booking'
import { siteConfig } from '@/config/site'
import { blur, branchImages } from '@/lib/media'

const defaultBranchId = branches[0]?.id ?? ''

export default function BookingPage() {
  const [reference, setReference] = useState('')
  const [branchId, setBranchId] = useState(defaultBranchId)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const fromQuery = params.get('branchId')
    if (fromQuery && branches.some((branch) => branch.id === fromQuery)) {
      setBranchId(fromQuery)
    }
  }, [])

  const selected = branches.find((branch) => branch.id === branchId) ?? branches[0]
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
              Kỳ nghỉ được
              <br />
              <em>chăm chút.</em>
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
              const result = await submitBooking({
                branchId: String(form.get('branchId')),
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
                onChange={(event) => setBranchId(event.target.value)}
              >
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </label>
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
    </main>
  )
}
