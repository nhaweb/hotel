import type { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/site-client'
import { stories } from '@/data/reviews'
import { siteConfig } from '@/config/site'

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

export default function JournalPage() {
  const breadcrumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: siteConfig.name, item: siteConfig.url },
      { '@type': 'ListItem', position: 2, name: 'Tạp chí', item: `${siteConfig.url}/tin-tuc` },
    ],
  }

  return (
    <main>
      <Header />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }} />
      <section className="section" style={{ paddingTop: '10rem' }}>
        <p className="eyebrow ink">Tạp chí PML</p>
        <h1>Những nhịp chậm<br /><em>giữa Sài Gòn.</em></h1>
        <div className="branch-grid">
          {stories.map((story) => (
            <article key={story.id}>
              <p>{story.category} · {story.readMinutes} phút đọc</p>
              <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 3rem)' }}>{story.title}</h2>
              <p>{story.excerpt}</p>
              <Link href={`/tin-tuc#${story.slug}`}>Đọc câu chuyện →</Link>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
