import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { MapPin, Phone } from 'lucide-react'
import { branches } from '@/data/branches'
import { rooms } from '@/data/rooms'
import { siteConfig, type Locale } from '@/config/site'
import { dictionaries } from '@/i18n'
import { Footer, Header } from '@/components/site-client'
import { formatPrice } from '@/lib/format-price'
import { blur, branchImages, roomCover } from '@/lib/media'

export function generateStaticParams() {
  return branches.map((branch) => ({ slug: branch.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const branch = branches.find((item) => item.slug === slug)
  if (!branch) return {}
  const url = `/co-so/${slug}`
  return {
    title: branch.name,
    description: branch.highlights,
    alternates: { canonical: url },
    openGraph: { title: branch.name, description: branch.highlights, url, locale: 'vi_VN' },
  }
}

export default async function BranchPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const branch = branches.find((item) => item.slug === slug)
  if (!branch) notFound()

  const locale: Locale = (await cookies()).get('pml-locale')?.value === 'en' ? 'en' : 'vi'
  const copy = dictionaries[locale]
  const branchRooms = rooms.filter((room) => room.branchId === branch.id)
  const heroImage = branchImages[branch.id] ?? 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1800&q=86'

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LodgingBusiness',
    name: branch.name,
    address: branch.address,
    telephone: branch.phone,
    email: branch.email,
    url: `${siteConfig.url}/co-so/${slug}`,
  }

  return (
    <main className="branch-detail-page">
      <Header initialLocale={locale} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="detail-hero">
        <Image src={heroImage} alt={`Sảnh ${branch.name}`} fill priority sizes="100vw" placeholder="blur" blurDataURL={blur} />
        <div className="hero-shade" />
        <div className="hero-content">
          <p className="eyebrow">{locale === 'en' ? 'PML Destination' : 'Cơ sở PML Hotel'}</p>
          <h1>{branch.name}</h1>
          <p>{branch.tagline}</p>
        </div>
      </div>

      <section className="section branch-info-section">
        <div className="branch-info-header">
          <div className="branch-info-text">
            <p className="eyebrow ink">{branch.shortName}</p>
            <h2>{locale === 'en' ? 'About this location' : 'Về cơ sở này'}</h2>
            <p className="lead">{branch.highlights}</p>
            <p className="branch-address-line">
              <MapPin className="w-4 h-4 inline mr-1 text-[var(--accent-dark)]" />
              <strong>{branch.address}</strong>
            </p>
            <p className="branch-phone-line">
              <Phone className="w-4 h-4 inline mr-1 text-[var(--accent-dark)]" />
              <a href={`tel:${branch.phone.replace(/\s/g, '')}`}>{branch.phone}</a>
            </p>
          </div>

          <div className="branch-nearby-card">
            <h3>{locale === 'en' ? 'Walking distances' : 'Khoảng cách đi bộ'}</h3>
            <div className="branch-nearby-list">
              {branch.nearby.map((place) => (
                <div key={place.name} className="branch-nearby-item">
                  <span>{place.name}</span>
                  <strong>{place.minutes}’</strong>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="branch-rooms-block">
          <p className="eyebrow ink">{locale === 'en' ? 'Accommodations' : 'Hạng phòng'}</p>
          <h2>{locale === 'en' ? 'Rooms & Suites at this location' : 'Phòng nghỉ tại cơ sở'}</h2>

          <div className="room-grid">
            {branchRooms.map((room) => {
              const name = locale === 'en' ? room.nameEn : room.name
              const description = locale === 'en' ? room.descriptionEn : room.description
              const view = locale === 'en' ? room.viewEn : room.view

              return (
                <article key={room.id} className="room-card">
                  <div className="image-wrap">
                    <Image src={roomCover(room.id)} alt={name} fill sizes="33vw" placeholder="blur" blurDataURL={blur} />
                    <span className="room-card__badge">{room.category}</span>
                  </div>
                  <div>
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
      </section>

      {/* Footer Info Added */}
      <Footer initialLocale={locale} />
    </main>
  )
}
