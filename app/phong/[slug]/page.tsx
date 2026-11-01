import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { Check, MapPin } from 'lucide-react'
import { rooms } from '@/data/rooms'
import { branches } from '@/data/branches'
import { formatPrice } from '@/lib/format-price'
import { siteConfig, type Locale } from '@/config/site'
import { dictionaries } from '@/i18n'
import { blur, roomCover, roomImages } from '@/lib/media'
import { Header, RoomGallery } from '@/components/site-client'

export function generateStaticParams() {
  return rooms.map((room) => ({ slug: room.id.replace('room-', '') }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const room = rooms.find((item) => item.id === `room-${slug}`)
  if (!room) return {}
  const url = `/phong/${slug}`
  return {
    title: room.name,
    description: room.description,
    alternates: { canonical: url },
    openGraph: { title: room.name, description: room.description, url, locale: 'vi_VN' },
  }
}

export default async function RoomPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const room = rooms.find((item) => item.id === `room-${slug}`)
  if (!room) notFound()

  const locale: Locale = (await cookies()).get('pml-locale')?.value === 'en' ? 'en' : 'vi'
  const copy = dictionaries[locale]
  const branch = branches.find((item) => item.id === room.branchId)
  const related = rooms.filter((item) => item.branchId === room.branchId && item.id !== room.id).slice(0, 3)
  const images = roomImages[room.id] ?? [roomCover(room.id)]
  const name = locale === 'en' ? room.nameEn : room.name
  const description = locale === 'en' ? room.descriptionEn : room.description
  const view = locale === 'en' ? room.viewEn : room.view
  const features = locale === 'en' ? room.featuresEn : room.features

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'HotelRoom',
    name: room.name,
    description: room.description,
    bed: { '@type': 'BedDetails', typeOfBed: room.bedType },
    floorSize: { '@type': 'QuantitativeValue', value: room.sizeSqm, unitCode: 'MTK' },
    offers: { '@type': 'Offer', price: room.priceVnd, priceCurrency: 'VND', url: `${siteConfig.url}/phong/${slug}` },
  }

  return (
    <main className="room-detail-page">
      <Header initialLocale={locale} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <RoomGallery images={images} roomName={name} />

      <section className="detail-layout">
        <article>
          <p className="eyebrow ink">{branch?.name}</p>
          <h1>{name}</h1>
          <p className="lead">{description}</p>

          <div className="spec-grid">
            <span>
              <strong>{room.sizeSqm} m²</strong>
              <small>{locale === 'en' ? 'Room size' : 'Diện tích'}</small>
            </span>
            <span>
              <strong>{room.bedType}</strong>
              <small>{locale === 'en' ? 'Bed' : 'Giường'}</small>
            </span>
            <span>
              <strong>{room.capacity}</strong>
              <small>{locale === 'en' ? 'Capacity' : 'Sức chứa'}</small>
            </span>
            <span>
              <strong>{view}</strong>
              <small>{locale === 'en' ? 'View' : 'Tầm nhìn'}</small>
            </span>
          </div>

          <div className="room-detail-block">
            <h2>{locale === 'en' ? 'Signature features' : 'Tiện nghi nổi bật'}</h2>
            <ul className="feature-checklist">
              {features.map((feature) => (
                <li key={feature}>
                  <Check /> {feature}
                </li>
              ))}
              {room.breakfastIncluded && <li><Check /> {locale === 'en' ? 'Breakfast included' : 'Bao gồm bữa sáng'}</li>}
            </ul>
          </div>

          {branch && (
            <div className="room-detail-block room-branch-card">
              <h2>{locale === 'en' ? 'Stay at this branch' : 'Cơ sở lưu trú'}</h2>
              <p>
                <MapPin /> {branch.address}
              </p>
              <p>{branch.highlights}</p>
              <div className="branch-chips">
                {branch.nearby.slice(0, 3).map((place) => (
                  <span key={place.name}>
                    {place.name} · {place.minutes}’
                  </span>
                ))}
              </div>
              <Link href={`/co-so/${branch.slug}`}>{copy.viewBranch} →</Link>
            </div>
          )}

          <div className="room-detail-block">
            <h2>{locale === 'en' ? 'Good to know' : 'Lưu ý khi đặt'}</h2>
            <ul className="policy-list">
              <li>{locale === 'en' ? 'Check-in from 14:00 · Check-out before 12:00' : 'Nhận phòng từ 14:00 · Trả phòng trước 12:00'}</li>
              <li>{locale === 'en' ? 'Free cancellation up to 3 days before arrival' : 'Hủy miễn phí trước 3 ngày nhận phòng'}</li>
              <li>{locale === 'en' ? 'This is a stay request — our team confirms availability personally' : 'Đây là yêu cầu lưu trú — đội ngũ PML xác nhận phòng trực tiếp'}</li>
            </ul>
          </div>
        </article>

        <aside className="room-booking-card">
          <p className="eyebrow ink">{room.category}</p>
          <strong>
            {formatPrice(room.priceVnd)} <small>{copy.perNight}</small>
          </strong>
          <p>{locale === 'en' ? 'Reference rate including taxes where shown. Final confirmation by reservations.' : 'Giá tham khảo đã gồm thuế (nếu hiển thị). Giá cuối được xác nhận khi giữ chỗ.'}</p>
          <ul>
            <li>{view}</li>
            <li>{room.sizeSqm} m²</li>
            <li>{room.maxAdults} {locale === 'en' ? 'adults max' : 'người lớn tối đa'}</li>
          </ul>
          <Link className="button button-accent" href={`/dat-phong?room=${room.id}&branchId=${room.branchId}`}>
            {locale === 'en' ? 'Request this room' : 'Gửi yêu cầu đặt phòng'}
          </Link>
          <a className="button button-ghost-ink" href={`tel:${siteConfig.hotline.replace(/\s/g, '')}`}>
            {siteConfig.hotline}
          </a>
        </aside>
      </section>

      {related.length > 0 && (
        <section className="section related-rooms">
          <p className="eyebrow ink">{locale === 'en' ? 'Same branch' : 'Cùng cơ sở'}</p>
          <h2>{locale === 'en' ? 'You may also like' : 'Có thể bạn cũng thích'}</h2>
          <div className="room-grid">
            {related.map((item) => (
              <article className="room-card" key={item.id}>
                <div className="image-wrap">
                  <Image src={roomCover(item.id)} alt={item.name} fill sizes="33vw" placeholder="blur" blurDataURL={blur} />
                </div>
                <div>
                  <h3>{locale === 'en' ? item.nameEn : item.name}</h3>
                  <p>{locale === 'en' ? item.descriptionEn : item.description}</p>
                  <footer>
                    <strong>
                      {copy.from} {formatPrice(item.priceVnd)}
                    </strong>
                    <Link href={`/phong/${item.id.replace('room-', '')}`}>{copy.viewRoom} →</Link>
                  </footer>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
