import { cookies } from 'next/headers'
import { siteConfig, type Locale } from '@/config/site'
import { branches } from '@/data/branches'
import { faqs } from '@/data/faqs'
import { rooms } from '@/data/rooms'
import { reviews, sampleContentNote } from '@/data/reviews'
import { dictionaries } from '@/i18n'
import {
  AmenitiesExperience,
  GalleryMoments,
  LocationShowcase,
  OffersExperience,
  ReviewsExperience,
  RoomsCarousel,
} from '@/components/home-experience'
import {
  BookingBar,
  FAQAccordion,
  FloatingActions,
  Footer,
  Header,
  Reveal,
} from '@/components/site-client'

export default async function Home() {
  const locale: Locale = (await cookies()).get('pml-locale')?.value === 'en' ? 'en' : 'vi'
  const copy = dictionaries[locale]

  const hotelJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Hotel',
    name: siteConfig.name,
    description: copy.footerBlurb,
    url: siteConfig.url,
    telephone: siteConfig.hotline,
    email: siteConfig.email,
    containsPlace: branches.map((branch) => ({
      '@type': 'LodgingBusiness',
      name: branch.name,
      address: branch.address,
    })),
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
        <div className="section-contained">
          <Reveal>
            <p className="eyebrow ink">{copy.amenitiesLabel}</p>
            <h2 dangerouslySetInnerHTML={{ __html: copy.amenitiesTitleHtml }} />
          </Reveal>
          <AmenitiesExperience locale={locale} />
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
        <div className="section-contained">
          <Reveal>
            <p className="eyebrow">{copy.offersLabel}</p>
            <h2 dangerouslySetInnerHTML={{ __html: copy.offersTitleHtml }} />
          </Reveal>
          <OffersExperience locale={locale} />
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
          <h2 dangerouslySetInnerHTML={{ __html: copy.galleryTitleHtml }} />
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

      {/* Reusable Footer with Centered Copyright & Luxury Icon */}
      <Footer initialLocale={locale} />

      <FloatingActions initialLocale={locale} />
    </main>
  )
}
