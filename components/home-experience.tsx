'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, MapPin, Phone } from 'lucide-react'
import type { Locale } from '@/config/site'
import type { Room } from '@/data/rooms'
import type { Branch } from '@/data/branches'
import type { Review } from '@/data/reviews'
import { Map as HotelMap } from '@/components/map/Map'
import { blur, branchImages, galleryMoments, roomCover } from '@/lib/media'
import { formatPrice } from '@/lib/format-price'
import { dictionaries } from '@/i18n'

type RoomsProps = {
  rooms: Room[]
  branches: Branch[]
  locale: Locale
}

export function RoomsCarousel({ rooms, branches, locale }: RoomsProps) {
  const copy = dictionaries[locale]
  const [index, setIndex] = useState(0)
  const [perPage, setPerPage] = useState(3)

  useEffect(() => {
    const sync = () => setPerPage(window.innerWidth < 900 ? 1 : window.innerWidth < 1200 ? 2 : 3)
    sync()
    window.addEventListener('resize', sync)
    return () => window.removeEventListener('resize', sync)
  }, [])

  const maxIndex = Math.max(0, rooms.length - perPage)
  const visible = rooms.slice(index, index + perPage)

  useEffect(() => {
    setIndex((value) => Math.min(value, maxIndex))
  }, [maxIndex])

  return (
    <div className="rooms-carousel">
      <div className="rooms-carousel__controls">
        <p>
          {index + 1}–{Math.min(index + perPage, rooms.length)} / {rooms.length}
        </p>
        <div>
          <button type="button" aria-label="Previous rooms" disabled={index === 0} onClick={() => setIndex((value) => Math.max(0, value - 1))}>
            <ChevronLeft />
          </button>
          <button type="button" aria-label="Next rooms" disabled={index >= maxIndex} onClick={() => setIndex((value) => Math.min(maxIndex, value + 1))}>
            <ChevronRight />
          </button>
        </div>
      </div>
      <div
        className="room-grid rooms-carousel__track"
        style={{ gridTemplateColumns: `repeat(${Math.max(visible.length, 1)}, minmax(0, 1fr))` }}
      >
        {visible.map((room) => {
          const name = locale === 'en' ? room.nameEn : room.name
          const description = locale === 'en' ? room.descriptionEn : room.description
          const view = locale === 'en' ? room.viewEn : room.view
          return (
            <article className="room-card" key={room.id}>
              <div className="image-wrap">
                <Image src={roomCover(room.id)} alt={`${name}, ${view}`} fill sizes="(max-width: 768px) 100vw, 33vw" placeholder="blur" blurDataURL={blur} />
                <span className="room-card__badge">{room.category}</span>
              </div>
              <div>
                <p>{branches.find((b) => b.id === room.branchId)?.shortName}</p>
                <h3>{name}</h3>
                <p>{description}</p>
                <ul>
                  <li>{room.sizeSqm} m²</li>
                  <li>{room.bedType}</li>
                  <li>{view}</li>
                </ul>
                <footer>
                  <strong>
                    {copy.from} {formatPrice(room.priceVnd)} <small>{copy.perNight}</small>
                  </strong>
                  <Link href={`/phong/${room.id.replace('room-', '')}`}>{copy.viewRoom} →</Link>
                </footer>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}

type LocationProps = {
  branches: Branch[]
  locale: Locale
}

export function LocationShowcase({ branches, locale }: LocationProps) {
  const copy = dictionaries[locale]
  return (
    <div className="location-showcase">
      <div className="location-showcase__cards">
        {branches.map((branch) => (
          <article key={branch.id} className="branch-photo-card">
            <div className="branch-photo-card__media">
              <Image src={branchImages[branch.id]} alt={branch.name} fill sizes="(max-width: 900px) 100vw, 40vw" placeholder="blur" blurDataURL={blur} />
            </div>
            <div>
              <p className="eyebrow ink">{branch.shortName}</p>
              <h3>{branch.name}</h3>
              <p>{branch.tagline}</p>
              <p className="branch-photo-card__meta">
                <MapPin /> {branch.address}
              </p>
              <p className="branch-photo-card__meta">
                <Phone /> {branch.phone}
              </p>
              <div className="branch-chips">
                {branch.nearby.slice(0, 3).map((place) => (
                  <span key={place.name}>
                    {place.name} · {place.minutes}’
                  </span>
                ))}
              </div>
              <Link href={`/co-so/${branch.slug}`}>{copy.viewBranch} →</Link>
            </div>
          </article>
        ))}
      </div>
      <div className="location-showcase__map">
        <HotelMap branches={branches} locale={locale} />
      </div>
    </div>
  )
}

type ReviewsProps = {
  reviews: Review[]
  locale: Locale
  note: string
}

export function ReviewsExperience({ reviews, locale, note }: ReviewsProps) {
  const [active, setActive] = useState(0)
  const review = reviews[active]
  const initials = useMemo(() => review.guest.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase(), [review.guest])

  useEffect(() => {
    const timer = setInterval(() => setActive((value) => (value + 1) % reviews.length), 7000)
    return () => clearInterval(timer)
  }, [reviews.length])

  return (
    <div className="reviews-experience">
      <div className="reviews-experience__stage">
        <div className="reviews-experience__avatar" aria-hidden>
          {initials}
        </div>
        <div className="reviews-experience__stars" aria-label="5 / 5">
          ★★★★★
        </div>
        <blockquote key={review.id}>“{locale === 'en' ? review.textEn : review.text}”</blockquote>
        <div className="reviews-experience__meta">
          <strong>{review.guest}</strong>
          <span>{review.origin}</span>
          <span>{locale === 'en' ? review.titleEn : review.title}</span>
        </div>
        <div className="reviews-experience__controls">
          <button type="button" aria-label="Previous review" onClick={() => setActive((value) => (value - 1 + reviews.length) % reviews.length)}>
            <ChevronLeft />
          </button>
          <div className="reviews-experience__dots">
            {reviews.map((item, i) => (
              <button key={item.id} type="button" aria-label={`Review ${i + 1}`} aria-current={i === active} className={i === active ? 'is-active' : ''} onClick={() => setActive(i)} />
            ))}
          </div>
          <button type="button" aria-label="Next review" onClick={() => setActive((value) => (value + 1) % reviews.length)}>
            <ChevronRight />
          </button>
        </div>
      </div>
      <aside className="reviews-experience__rail">
        {reviews.map((item, i) => (
          <button key={item.id} type="button" className={i === active ? 'is-active' : ''} onClick={() => setActive(i)}>
            <strong>{item.guest}</strong>
            <span>{locale === 'en' ? item.titleEn : item.title}</span>
          </button>
        ))}
        <small>{note}</small>
      </aside>
    </div>
  )
}

export function GalleryMoments({ locale }: { locale: Locale }) {
  const [active, setActive] = useState<number | null>(null)
  const copy = dictionaries[locale]

  return (
    <div className="gallery-moments">
      <div className="gallery-moments__grid">
        {galleryMoments.map((item, index) => (
          <button key={item.id} type="button" className={`gallery-moments__item is-${item.span}`} onClick={() => setActive(index)}>
            <Image src={item.src} alt={item.alt} fill sizes="(max-width: 768px) 50vw, 25vw" placeholder="blur" blurDataURL={blur} />
            <span>{item.alt}</span>
          </button>
        ))}
      </div>
      {active !== null && (
        <div className="lightbox gallery-lightbox" role="dialog" aria-modal="true" aria-label={copy.galleryLabel}>
          <button type="button" className="lightbox-close" onClick={() => setActive(null)} aria-label="Close">
            ×
          </button>
          <button type="button" className="lightbox-prev" onClick={() => setActive((active - 1 + galleryMoments.length) % galleryMoments.length)} aria-label="Previous">
            <ChevronLeft />
          </button>
          <div className="lightbox-image">
            <Image src={galleryMoments[active].src} alt={galleryMoments[active].alt} fill sizes="100vw" priority />
          </div>
          <button type="button" className="lightbox-next" onClick={() => setActive((active + 1) % galleryMoments.length)} aria-label="Next">
            <ChevronRight />
          </button>
          <p>{galleryMoments[active].alt}</p>
        </div>
      )}
    </div>
  )
}
