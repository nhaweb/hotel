import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Be_Vietnam_Pro, Lora } from 'next/font/google'
import { Concierge } from '@/components/site-client'
import { siteConfig } from '@/config/site'
import './globals.css'

const sans = Be_Vietnam_Pro({ subsets: ['latin', 'vietnamese'], weight: ['400','500','600','700'], variable: '--font-sans', display: 'swap' })
const serif = Lora({ subsets: ['latin', 'vietnamese'], weight: ['400','500','600'], style: ['normal','italic'], variable: '--font-serif', display: 'swap' })

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: { default: 'PML Hotel | Khách sạn boutique tại Quận 1', template: '%s | PML Hotel' },
  description: siteConfig.description,
  alternates: { canonical: '/' },
  openGraph: { title: siteConfig.name, description: siteConfig.description, locale: 'vi_VN', type: 'website' },
}
export const viewport: Viewport = { colorScheme: 'light', themeColor: '#f8f3eb' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="vi" className={`${sans.variable} ${serif.variable}`}><body>{children}<Concierge />{process.env.NODE_ENV === 'production' && <Analytics />}</body></html>
}
