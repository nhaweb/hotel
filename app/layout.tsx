import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Be_Vietnam_Pro, Lora } from 'next/font/google'
import { cookies } from 'next/headers'
import { Concierge } from '@/components/site-client'
import { siteConfig, type Locale } from '@/config/site'
import './globals.css'

const sans = Be_Vietnam_Pro({ subsets: ['latin', 'vietnamese'], weight: ['400', '500', '600', '700'], variable: '--font-sans', display: 'swap' })
const serif = Lora({ subsets: ['latin', 'vietnamese'], weight: ['400', '500', '600'], style: ['normal', 'italic'], variable: '--font-serif', display: 'swap' })

async function getLocale(): Promise<Locale> {
  const store = await cookies()
  return store.get('pml-locale')?.value === 'en' ? 'en' : 'vi'
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const title = locale === 'en' ? 'PML Hotel | Boutique hotel in District 1' : 'PML Hotel | Khách sạn boutique tại Quận 1'
  const description = locale === 'en'
    ? 'Boutique & lifestyle hotels in the heart of District 1, Ho Chi Minh City.'
    : siteConfig.description
  return {
    metadataBase: new URL(siteConfig.url),
    title: { default: title, template: '%s | PML Hotel' },
    description,
    alternates: { canonical: '/' },
    openGraph: {
      title: siteConfig.name,
      description,
      locale: locale === 'en' ? 'en_US' : 'vi_VN',
      type: 'website',
    },
  }
}

export const viewport: Viewport = { colorScheme: 'light', themeColor: '#f8f3eb' }

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale()
  return (
    <html lang={locale} className={`${sans.variable} ${serif.variable}`}>
      <body>
        {children}
        <Concierge initialLocale={locale} />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
