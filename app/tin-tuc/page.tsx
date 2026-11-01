import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { Header, Reveal } from '@/components/site-client'
import { stories } from '@/data/reviews'
import { siteConfig, type Locale } from '@/config/site'
import { dictionaries } from '@/i18n'
import { blur, storyImages } from '@/lib/media'

export const metadata: Metadata = {
  title: 'Tạp chí',
  description: 'Những câu chuyện về Sài Gòn, wellness và nhịp sống quanh PML Hotel.',
  alternates: { canonical: '/tin-tuc' },
  openGraph: {
    title: 'Tạp chí PML Hotel',
    description: 'Những câu chuyện về Sài Gòn, wellness và nhịp sống quanh PML Hotel.',
    url: '/tin-tuc',
    locale: 'vi_VN',
  },
}

export default async function JournalPage() {
  const locale: Locale = (await cookies()).get('pml-locale')?.value === 'en' ? 'en' : 'vi'
  const copy = dictionaries[locale]
  const [featured, ...rest] = stories
  const breadcrumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: siteConfig.name, item: siteConfig.url },
      { '@type': 'ListItem', position: 2, name: locale === 'en' ? 'Journal' : 'Tạp chí', item: `${siteConfig.url}/tin-tuc` },
    ],
  }

  return (
    <main className="journal-page">
      <Header initialLocale={locale} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }} />

      <section className="journal-hero">
        <Image src={storyImages[0]} alt={featured.title} fill priority sizes="100vw" placeholder="blur" blurDataURL={blur} />
        <div className="journal-hero__shade" />
        <div className="journal-hero__content">
          <p className="eyebrow">{locale === 'en' ? 'PML Journal' : 'Tạp chí PML'}</p>
          <h1>
            {locale === 'en' ? (
              <>
                Slow rhythms
                <br />
                <em>in Saigon.</em>
              </>
            ) : (
              <>
                Những nhịp chậm
                <br />
                <em>giữa Sài Gòn.</em>
              </>
            )}
          </h1>
          <p>
            {locale === 'en'
              ? 'Stories about wellness, walking routes, food and the small rituals around our three District 1 hotels.'
              : 'Những câu chuyện về wellness, lộ trình đi bộ, ẩm thực và nghi thức nhỏ quanh ba cơ sở Quận 1.'}
          </p>
        </div>
      </section>

      <section className="section journal-featured">
        <Reveal>
          <article className="journal-feature-card">
            <div className="journal-feature-card__media">
              <Image src={storyImages[0]} alt={featured.title} fill sizes="(max-width: 900px) 100vw, 55vw" placeholder="blur" blurDataURL={blur} />
            </div>
            <div>
              <p className="eyebrow ink">
                {featured.category} · {featured.readMinutes} {locale === 'en' ? 'min read' : 'phút đọc'}
              </p>
              <h2>{featured.title}</h2>
              <p>{featured.excerpt}</p>
              <Link href={`/tin-tuc#${featured.slug}`} className="button button-accent">
                {locale === 'en' ? 'Read story' : 'Đọc câu chuyện'}
              </Link>
            </div>
          </article>
        </Reveal>
      </section>

      <section className="section journal-grid-section">
        <div className="journal-grid">
          {rest.map((story, index) => (
            <article key={story.id} id={story.slug} className="journal-card">
              <div className="journal-card__media">
                <Image src={storyImages[(index + 1) % storyImages.length]} alt={story.title} fill sizes="(max-width: 900px) 100vw, 33vw" placeholder="blur" blurDataURL={blur} />
              </div>
              <p>
                {story.category} · {story.readMinutes} {locale === 'en' ? 'min' : 'phút'}
              </p>
              <h3>{story.title}</h3>
              <p>{story.excerpt}</p>
              <Link href={`/tin-tuc#${story.slug}`}>{locale === 'en' ? 'Continue reading →' : 'Đọc tiếp →'}</Link>
            </article>
          ))}
        </div>
        <p className="journal-note">{copy.sample}</p>
      </section>
    </main>
  )
}
