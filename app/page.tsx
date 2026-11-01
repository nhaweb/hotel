import Image from 'next/image'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { siteConfig, type Locale } from '@/config/site'
import { amenityHighlights, branches } from '@/data/branches'
import { faqs } from '@/data/faqs'
import { offers } from '@/data/offers'
import { rooms } from '@/data/rooms'
import { reviews, sampleContentNote } from '@/data/reviews'
import { formatPrice } from '@/lib/format-price'
import { dictionaries } from '@/i18n'
import { amenityImages, blur, offerImages } from '@/lib/media'
import { GalleryMoments, LocationShowcase, ReviewsExperience, RoomsCarousel } from '@/components/home-experience'
import { BookingBar, FAQAccordion, FloatingActions, Header, Newsletter, Reveal } from '@/components/site-client'

export default async function Home() {
  const locale: Locale = (await cookies()).get('pml-locale')?.value === 'en' ? 'en' : 'vi'
  const copy = dictionaries[locale]
  const featuredOffers = offers.slice(0, 3)
  const hotelJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Hotel',
    name: siteConfig.name,
    description: copy.footerBlurb,
    url: siteConfig.url,
    telephone: siteConfig.hotline,
    email: siteConfig.email,
    containsPlace: branches.map((branch) => ({ '@type': 'LodgingBusiness', name: branch.name, address: branch.address })),
  }
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.slice(0, 8).map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  }

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(hotelJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <Header initialLocale={locale} />

      <section className="hero" id="experience">
        <video autoPlay muted loop playsInline className="hero-video" src="/banner-video.mp4" />
      </section>

      <BookingBar initialLocale={locale} />

      <section className="section" id="rooms">
        <Reveal>
          <p className="eyebrow ink">{copy.roomsLabel}</p>
          <h2 dangerouslySetInnerHTML={{ __html: copy.roomsTitleHtml }} />
        </Reveal>
        <RoomsCarousel rooms={rooms} branches={branches} locale={locale} />
      </section>

      <section className="section tinted" id="amenities">
        <Reveal>
          <p className="eyebrow ink">{copy.amenitiesLabel}</p>
          <h2 dangerouslySetInnerHTML={{ __html: copy.amenitiesTitleHtml }} />
        </Reveal>
        <div className="amenity-bento">
          {amenityHighlights.map((amenity) => (
            <article key={amenity.id} className="amenity-tile">
              <Image src={amenityImages[amenity.id]} alt={locale === 'en' ? amenity.nameEn : amenity.name} fill sizes="(max-width: 900px) 100vw, 33vw" placeholder="blur" blurDataURL={blur} />
              <div>
                <small>{amenity.hours}</small>
                <h3>{locale === 'en' ? amenity.nameEn : amenity.name}</h3>
                <p>{locale === 'en' ? amenity.detailEn : amenity.detail}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section" id="location">
        <Reveal>
          <p className="eyebrow ink">{copy.locationsLabel}</p>
          <h2 dangerouslySetInnerHTML={{ __html: copy.locationsTitleHtml }} />
        </Reveal>
        <LocationShowcase branches={branches} locale={locale} />
      </section>

      <section className="section dark" id="offers">
        <Reveal>
          <p className="eyebrow">{copy.offersLabel}</p>
          <h2 dangerouslySetInnerHTML={{ __html: copy.offersTitleHtml }} />
        </Reveal>
        <div className="offers-showcase">
          {featuredOffers.map((offer, index) => (
            <article key={offer.id} className={index === 0 ? 'offer-feature' : 'offer-card'}>
              <div className="offer-media">
                <Image src={offerImages[offer.id] ?? offerImages['offer-direct-booking']} alt={locale === 'en' ? offer.nameEn : offer.name} fill sizes="(max-width: 900px) 100vw, 50vw" placeholder="blur" blurDataURL={blur} />
              </div>
              <div>
                <p className="eyebrow">{offer.valid}</p>
                <h3>{locale === 'en' ? offer.nameEn : offer.name}</h3>
                <p>{locale === 'en' ? offer.descriptionEn : offer.description}</p>
                {offer.priceFromVnd ? (
                  <strong>
                    {copy.from} {formatPrice(offer.priceFromVnd)}
                  </strong>
                ) : (
                  <strong>{locale === 'en' ? 'Complimentary perks' : 'Quà tặng kèm'}</strong>
                )}
                <Link href="/dat-phong" className="button button-accent">
                  {copy.learnMore}
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section reviews">
        <Reveal>
          <p className="eyebrow ink">{copy.reviewsLabel}</p>
          <h2 dangerouslySetInnerHTML={{ __html: copy.reviewsTitleHtml }} />
        </Reveal>
        <ReviewsExperience reviews={reviews} locale={locale} note={sampleContentNote[locale]} />
      </section>

      <section className="section gallery">
        <Reveal>
          <p className="eyebrow ink">{copy.galleryLabel}</p>
          <h2>
            {locale === 'en' ? (
              <>
                Moments that keep
                <br />
                <em>the feeling.</em>
              </>
            ) : (
              <>
                Những khung hình
                <br />
                <em>giữ lại cảm xúc.</em>
              </>
            )}
          </h2>
        </Reveal>
        <GalleryMoments locale={locale} />
      </section>

      <section className="section faq">
        <Reveal>
          <p className="eyebrow ink">{copy.faqLabel}</p>
          <h2 dangerouslySetInnerHTML={{ __html: copy.faqTitleHtml }} />
        </Reveal>
        <FAQAccordion items={faqs.slice(0, 8)} />
      </section>

      <footer className="footer">
        <div>
          <Link href="/" className="wordmark">
            {siteConfig.name}
          </Link>
          <p>{copy.footerBlurb}</p>
          <a href={`tel:${siteConfig.hotline.replace(/\s/g, '')}`}>{siteConfig.hotline}</a>
          <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>
        </div>
        <div>
          <h3>{copy.footerVisit}</h3>
          {branches.map((branch) => (
            <Link key={branch.id} href={`/co-so/${branch.slug}`}>
              {branch.street} · {copy.district1}
            </Link>
          ))}
        </div>
        <div>
          <h3>{copy.footerExplore}</h3>
          <Link href="#location">{copy.locationCta}</Link>
          <Link href="/tin-tuc">{copy.stories}</Link>
          <div className="socials">
            {Object.entries(siteConfig.social).map(([name, href]) => (
              <a key={name} href={href}>
                {name}
              </a>
            ))}
          </div>
        </div>
        <div>
          <h3>{copy.newsletter}</h3>
          <p>{copy.newsletterText}</p>
          <Newsletter initialLocale={locale} />
        </div>
        <p className="footer-bottom">
          {copy.copyright} {siteConfig.name}
        </p>
      </footer>

      <FloatingActions initialLocale={locale} />
    </main>
  )
}
