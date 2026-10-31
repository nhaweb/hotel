import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'

const data = JSON.parse(readFileSync('files/pml_hotel_dataset_full.json', 'utf8'))

const roomCopy = {
  'room-onsen-suite': {
    viewEn: 'Floor-to-ceiling street view',
    descriptionEn: 'A private mineral soaking tub and dry sauna in the room, with a floor-to-ceiling window looking onto the street.',
    featuresEn: ['Private mineral tub', 'In-room dry sauna', 'Floor-to-ceiling street view'],
  },
  'room-deluxe-city': {
    viewEn: 'Balcony over Dong Du street',
    descriptionEn: 'A balcony room looking onto Dong Du street, with a quiet desk for work and a soaking tub for the end of the day.',
    featuresEn: ['Street-facing balcony', 'Soaking tub', 'Quiet work desk'],
  },
  'room-rooftop-jacuzzi': {
    viewEn: '360° view of Saigon and the park',
    descriptionEn: 'A top-floor penthouse with a private outdoor jacuzzi and a 360° view, for celebrations and quiet nights in.',
    featuresEn: ['Private rooftop jacuzzi', '360° city and park view', 'In-room check-in'],
  },
}

const rooms = data.rooms.map((room) => {
  const extra = roomCopy[room.id] ?? {}
  return {
    id: room.id,
    branchId: room.branch_id,
    name: room.name,
    nameEn: room.name_en,
    category: room.category,
    sizeSqm: room.size_sqm,
    bedType: room.bed_type,
    capacity: room.capacity,
    maxAdults: room.max_adults,
    view: room.view,
    viewEn: extra.viewEn ?? room.view,
    priceVnd: room.price_vnd_per_night,
    breakfastIncluded: room.breakfast_included,
    description: room.description_vi,
    descriptionEn: extra.descriptionEn ?? room.description_vi,
    features: room.key_features.slice(0, 3),
    featuresEn: extra.featuresEn ?? room.key_features.slice(0, 3),
  }
})

const branches = data.branches.map((branch) => ({
  id: branch.id,
  slug: branch.slug,
  name: branch.name,
  shortName: branch.short_name,
  address: branch.address,
  street: branch.address.split(',')[0],
  district: branch.district,
  ward: branch.ward,
  phone: branch.phone,
  email: branch.email,
  highlights: branch.highlights,
  tagline: branch.tagline_vi,
  nearby: branch.nearby_landmarks.slice(0, 3).map((place) => {
    const minutes = place.distance.match(/(\d+)\s*phút/)
    return {
      name: place.name,
      minutes: minutes ? minutes[1].padStart(2, '0') : place.distance,
    }
  }),
}))

const amenityCopy = {
  'amenity-onsen': {
    nameEn: 'Japanese mineral onsen',
    detailEn: 'A 40°C mineral bath, an 18°C cold plunge, and a Himalayan salt sauna. Free for guests staying at Hai Ba Trung.',
  },
  'amenity-rooftop-skybar': {
    nameEn: 'Rooftop jacuzzi & sky bar',
    detailEn: 'A sunset jacuzzi and an evening bar. Staying guests receive 20% off the cocktail menu.',
  },
  'amenity-coworking': {
    nameEn: 'Executive coworking lounge',
    detailEn: 'A quiet room with desks, fast Wi-Fi, and coffee, free for guests at Central Park.',
  },
  'amenity-afternoon-tea': {
    nameEn: 'Afternoon tea',
    detailEn: 'Herbal tea, Vietnamese phin coffee, and pastries, free for guests who book on the website.',
  },
}

const amenityIds = ['amenity-onsen', 'amenity-rooftop-skybar', 'amenity-coworking', 'amenity-afternoon-tea']
const amenityHighlights = amenityIds.map((id) => {
  const amenity = data.wellness_and_amenities.find((item) => item.id === id)
  const extra = amenityCopy[id]
  return {
    id,
    name: amenity.name,
    nameEn: extra.nameEn,
    detail: amenity.details,
    detailEn: extra.detailEn,
    hours: amenity.hours,
  }
})

const offers = data.offers.map((offer) => ({
  id: offer.id,
  name: offer.name,
  description: offer.description,
  priceFromVnd: offer.price_from_vnd ?? null,
  conditions: offer.conditions,
  valid: offer.valid,
}))

const faqs = data.faq.map((item) => ({
  id: item.id,
  category: item.category,
  question: item.question,
  answer: item.answer,
}))

const reviewEn = {
  'rev-001': {
    titleEn: 'A slow weekend in Saigon',
    textEn: 'The private soaking tub and in-room sauna were wonderful. Staff remembered our names from check-in. Afternoon tea was excellent, and the rooms were surprisingly quiet in District 1.',
  },
  'rev-002': {
    titleEn: 'Perfect base for first-time visitors',
    textEn: 'Walkable to everything: Nguyen Hue, the Opera House, the river. The balcony room was quiet and breakfast had great phở. Staff gave me a hand-drawn walking map.',
  },
  'rev-003': {
    titleEn: 'A proposal on the roof',
    textEn: 'The team set almost everything up, including a backup plan when the rain arrived. Sunset in the jacuzzi is a moment we will not forget.',
  },
  'rev-004': {
    titleEn: 'An onsen worth the long day',
    textEn: 'The onsen was clean, quiet, and distinctly Japanese in spirit. The room was compact and calm. I would have liked a private evening slot.',
  },
  'rev-005': {
    titleEn: 'Easy to work, easy to rest',
    textEn: 'The coworking lounge was quiet, the Wi-Fi was fast, and the sky bar was an easy way to end the day. The park view in the morning was lovely.',
  },
  'rev-006': {
    titleEn: 'Connecting rooms that worked for the whole family',
    textEn: 'Two connecting rooms were practical for a family of five. The hotel had a cot and a high chair ready, and the staff were attentive.',
  },
  'rev-007': {
    titleEn: 'Three weeks that felt like home',
    textEn: 'The small kitchen and the wide desk were the real advantages. Weekly laundry was convenient. More flexible housekeeping times would help.',
  },
  'rev-008': {
    titleEn: 'Compact, handsome, and well placed',
    textEn: 'The Superior room is small, but the Indochine design is charming and very quiet. Walking out to the street is easy.',
  },
}

const reviews = data.reviews_sample.map((review) => ({
  id: review.id,
  guest: review.guest,
  origin: review.origin,
  rating: review.rating,
  title: review.title,
  titleEn: reviewEn[review.id].titleEn,
  text: review.text,
  textEn: reviewEn[review.id].textEn,
  branchId: review.branch_id,
  roomId: review.room_id,
}))

const stories = data.journal_articles_sample.map((article) => ({
  id: article.id,
  slug: article.slug,
  category: article.category,
  title: article.title,
  excerpt: article.excerpt,
  readMinutes: article.read_time_min,
}))

const emit = (path, body) => writeFileSync(path, body)

for (const directory of [
  'app/phong/[slug]',
  'app/co-so/[slug]',
  'app/dat-phong',
  'config',
  'components',
  'i18n',
  'lib',
]) {
  mkdirSync(directory, { recursive: true })
}

emit(
  'data/rooms.ts',
  `export type Room = {
  id: string
  branchId: string
  name: string
  nameEn: string
  category: string
  sizeSqm: number
  bedType: string
  capacity: string
  maxAdults: number
  view: string
  viewEn: string
  priceVnd: number
  breakfastIncluded: boolean
  description: string
  descriptionEn: string
  features: string[]
  featuresEn: string[]
}

export const rooms: Room[] = ${JSON.stringify(rooms, null, 2)}

export const featuredRoomIds = ['room-onsen-suite', 'room-deluxe-city', 'room-rooftop-jacuzzi'] as const
`,
)

emit(
  'data/branches.ts',
  `export type NearbyPlace = {
  name: string
  minutes: string
}

export type Branch = {
  id: string
  slug: string
  name: string
  shortName: string
  address: string
  street: string
  district: string
  ward: string
  phone: string
  email: string
  highlights: string
  tagline: string
  nearby: NearbyPlace[]
}

export type AmenityHighlight = {
  id: string
  name: string
  nameEn: string
  detail: string
  detailEn: string
  hours: string
}

export const branches: Branch[] = ${JSON.stringify(branches, null, 2)}

export const amenityHighlights: AmenityHighlight[] = ${JSON.stringify(amenityHighlights, null, 2)}
`,
)

emit(
  'data/offers.ts',
  `export type Offer = {
  id: string
  name: string
  description: string
  priceFromVnd: number | null
  conditions: string
  valid: string
}

export const offers: Offer[] = ${JSON.stringify(offers, null, 2)}
`,
)

emit(
  'data/faqs.ts',
  `export type Faq = {
  id: string
  category: string
  question: string
  answer: string
}

export const faqs: Faq[] = ${JSON.stringify(faqs, null, 2)}
`,
)

emit(
  'data/reviews.ts',
  `export type Review = {
  id: string
  guest: string
  origin: string
  rating: number
  title: string
  titleEn: string
  text: string
  textEn: string
  branchId: string
  roomId: string
}

export type Story = {
  id: string
  slug: string
  category: string
  title: string
  excerpt: string
  readMinutes: number
}

export const reviews: Review[] = ${JSON.stringify(reviews, null, 2)}

export const stories: Story[] = ${JSON.stringify(stories, null, 2)}

export const sampleContentNote = {
  vi: 'Nội dung mẫu',
  en: 'Sample content',
} as const
`,
)

emit(
  'config/site.ts',
  `import { branches } from '@/data/branches'

export const siteConfig = {
  name: 'PML Hotel',
  tagline: { vi: 'Lưu trú vì cảm xúc.', en: 'Stay for the feeling.' },
  description: 'Khách sạn boutique & lifestyle tại trung tâm Quận 1, TP. Hồ Chí Minh.',
  url: 'https://hotel-gamma-pied.vercel.app',
  hotline: '+84 28 3822 9999',
  zalo: 'https://zalo.me/pmlhotel',
  email: 'stay@pmlhotel.com',
  social: { facebook: '#', instagram: '#', tiktok: '#', youtube: '#' },
  nav: [
    { key: 'experience', href: '#experience' },
    { key: 'rooms', href: '#rooms' },
    { key: 'amenities', href: '#amenities' },
    { key: 'locations', href: '#location' },
    { key: 'offers', href: '#offers' },
    { key: 'journal', href: '/tin-tuc' },
  ],
  branches,
} as const

export type Locale = 'vi' | 'en'
`,
)

emit(
  'lib/format-price.ts',
  `export function formatPrice(value: number) {
  return \`\${new Intl.NumberFormat('vi-VN').format(value)}đ\`
}
`,
)

emit(
  'lib/submit-booking.ts',
  `export type BookingRequest = {
  branchId: string
  checkIn: string
  checkOut: string
  guests: number
  name: string
  phone: string
  email?: string
  note?: string
}

export async function submitBooking(request: BookingRequest) {
  await new Promise((resolve) => setTimeout(resolve, 450))
  return { ok: true as const, reference: \`PML-\${Date.now().toString(36).toUpperCase()}\`, request }
}
`,
)

emit(
  'data/assistant.ts',
  `export type QuickReply = { id: string; label: string; prompt: string }

export const quickReplies: QuickReply[] = ${JSON.stringify(
    data.ai_assistant.quick_replies.slice(0, 6).map((item, index) => ({
      id: item.id ?? `quick-${index + 1}`,
      label: typeof item === 'string' ? item : item.label_vi ?? item.label ?? item.text ?? item.prompt,
      prompt: typeof item === 'string' ? item : item.prompt_vi ?? item.prompt ?? item.text ?? item.label,
    })),
    null,
    2,
  )}

export const assistantGuardrails = {
  noRealtimeAvailability: true,
  neverRequest: ['card number', 'CVV', 'OTP'],
  handoffTriggers: ${JSON.stringify(data.ai_assistant.handoff_triggers ?? [], null, 2)},
} as const
`,
)

const dictionaries = {
  vi: {
    nav: { experience: 'Trải nghiệm', rooms: 'Phòng nghỉ', amenities: 'Tiện ích', locations: 'Cơ sở', offers: 'Ưu đãi', journal: 'Tạp chí' },
    book: 'Đặt phòng',
    heroEyebrow: 'Ba khách sạn boutique giữa Quận 1',
    heroTitle: 'Lưu trú vì cảm xúc.',
    heroText: 'Nghi thức tắm khoáng Nhật Bản gặp tinh thần hiếu khách Sài Gòn.',
    explore: 'Khám phá phòng nghỉ',
    roomsLabel: 'Phòng nổi bật',
    roomsTitle: 'Mỗi căn phòng, một góc nhìn riêng.',
    amenitiesLabel: 'Tiện ích',
    amenitiesTitle: 'Những nghi thức nhỏ, được làm chỉn chu.',
    locationsLabel: 'Ba địa chỉ',
    locationsTitle: 'Ngay giữa nhịp sống Quận 1.',
    offersLabel: 'Ưu đãi',
    offersTitle: 'Thêm một lý do để ở lại.',
    reviewsLabel: 'Lời khách kể',
    reviewsTitle: 'Một cảm giác đáng sẻ chia.',
    galleryLabel: 'Khoảnh khắc PML',
    faqLabel: 'Câu hỏi thường gặp',
    sample: 'Nội dung mẫu',
    viewRoom: 'Xem phòng',
    viewBranch: 'Khám phá cơ sở',
    from: 'Từ',
    perNight: '/ đêm',
    locationCta: 'Khám phá khu phố',
    stories: 'Đọc câu chuyện',
    newsletter: 'Nhận tin từ PML',
    newsletterText: 'Ưu đãi và những câu chuyện Sài Gòn, gửi vừa đủ.',
    subscribe: 'Đăng ký',
    subscribed: 'Đã đăng ký thành công.',
  },
  en: {
    nav: { experience: 'Experience', rooms: 'Rooms', amenities: 'Amenities', locations: 'Locations', offers: 'Offers', journal: 'Journal' },
    book: 'Book now',
    heroEyebrow: 'Three boutique hotels in District 1',
    heroTitle: 'Stay for the feeling.',
    heroText: 'Japanese bathing rituals meet the generous spirit of Saigon.',
    explore: 'Explore rooms',
    roomsLabel: 'Featured rooms',
    roomsTitle: 'Every room has a point of view.',
    amenitiesLabel: 'Amenities',
    amenitiesTitle: 'Small rituals, beautifully done.',
    locationsLabel: 'Three addresses',
    locationsTitle: 'At the heart of District 1.',
    offersLabel: 'Offers',
    offersTitle: 'One more reason to linger.',
    reviewsLabel: 'Guest stories',
    reviewsTitle: 'A feeling worth sharing.',
    galleryLabel: 'PML moments',
    faqLabel: 'Frequently asked questions',
    sample: 'Sample content',
    viewRoom: 'View room',
    viewBranch: 'Explore location',
    from: 'From',
    perNight: '/ night',
    locationCta: 'Explore the neighborhood',
    stories: 'Read our stories',
    newsletter: 'Notes from PML',
    newsletterText: 'Offers and Saigon stories, sent sparingly.',
    subscribe: 'Subscribe',
    subscribed: 'You are subscribed.',
  },
}

for (const locale of ['vi', 'en']) {
  emit(
    `i18n/${locale}.ts`,
    `export const ${locale} = ${JSON.stringify(dictionaries[locale], null, 2)} as const
`,
  )
}

emit(
  'i18n/index.ts',
  `import { en } from './en'
import { vi } from './vi'
import type { Locale } from '@/config/site'

export const dictionaries = { vi, en }
export function getDictionary(locale: Locale) { return dictionaries[locale] }
`,
)

emit(
  'components/language-menu.tsx',
  `'use client'

import type { Locale } from '@/config/site'

export function LanguageMenu({ locale, onChange }: { locale: Locale; onChange: (locale: Locale) => void }) {
  function choose(next: Locale) {
    document.cookie = \`pml-locale=\${next}; path=/; max-age=31536000; samesite=lax\`
    document.documentElement.lang = next
    onChange(next)
  }
  return <div className="language-toggle" aria-label="Ngôn ngữ">
    {(['vi', 'en'] as const).map((item, index) => <span key={item}>
      {index > 0 && <span aria-hidden="true">|</span>}
      <button type="button" aria-pressed={locale === item} onClick={() => choose(item)}>{item.toUpperCase()}</button>
    </span>)}
  </div>
}
`,
)

emit(
  'components/site-client.tsx',
  `'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowUp, CalendarDays, Check, ChevronDown, Menu, MessageCircle, Phone, X } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { siteConfig, type Locale } from '@/config/site'
import { dictionaries } from '@/i18n'
import { branches } from '@/data/branches'
import { quickReplies } from '@/data/assistant'

export function Header({ initialLocale = 'vi' }: { initialLocale?: Locale }) {
  const [locale, setLocale] = useState<Locale>(initialLocale)
  const [open, setOpen] = useState(false)
  const [compact, setCompact] = useState(false)
  const copy = dictionaries[locale]
  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > 48)
    onScroll(); window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return <header className={\`site-header \${compact ? 'is-compact' : ''}\`}>
    <Link href="/" className="wordmark" aria-label="Trang chủ PML Hotel">{siteConfig.name}</Link>
    <nav className="desktop-nav" aria-label="Điều hướng chính">{siteConfig.nav.map((item) => <Link key={item.key} href={item.href}>{copy.nav[item.key as keyof typeof copy.nav]}</Link>)}</nav>
    <div className="header-actions">
      <div className="language-toggle" aria-label="Ngôn ngữ">{(['vi','en'] as const).map((item, i) => <span key={item}>{i > 0 && ' | '}<button aria-pressed={locale === item} onClick={() => { document.cookie = \`pml-locale=\${item}; path=/; max-age=31536000; samesite=lax\`; document.documentElement.lang = item; setLocale(item) }}>{item.toUpperCase()}</button></span>)}</div>
      <Link href="/dat-phong" className="button button-accent desktop-book">{copy.book}</Link>
      <button className="menu-button" onClick={() => setOpen(!open)} aria-label="Mở điều hướng">{open ? <X /> : <Menu />}</button>
    </div>
    <AnimatePresence>{open && <motion.nav className="mobile-menu" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>{siteConfig.nav.map((item) => <Link key={item.key} href={item.href} onClick={() => setOpen(false)}>{copy.nav[item.key as keyof typeof copy.nav]}</Link>)}</motion.nav>}</AnimatePresence>
  </header>
}

export function Reveal({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const reduced = useReducedMotion()
  return <motion.div className={className} initial={reduced ? false : { opacity: 0, y: 18 }} whileInView={reduced ? {} : { opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: .55 }}>{children}</motion.div>
}

export function FAQAccordion({ items }: { items: { id: string; question: string; answer: string }[] }) {
  const [open, setOpen] = useState<string | null>(items[0]?.id ?? null)
  return <div className="faq-list">{items.map((item) => <div className="faq-item" key={item.id}>
    <button aria-expanded={open === item.id} onClick={() => setOpen(open === item.id ? null : item.id)}>{item.question}<ChevronDown className={open === item.id ? 'rotate' : ''} /></button>
    {open === item.id && <p>{item.answer}</p>}
  </div>)}</div>
}

export function Newsletter() {
  const [done, setDone] = useState(false)
  return <form className="newsletter" onSubmit={(event) => { event.preventDefault(); setDone(true) }}>
    <label htmlFor="newsletter-email">Email</label><div><input id="newsletter-email" type="email" required placeholder="you@example.com" /><button>{done ? <Check /> : 'Đăng ký'}</button></div>
    <p aria-live="polite">{done ? 'Đã đăng ký thành công.' : ''}</p>
  </form>
}

export function BookingBar() {
  return <><form className="booking-bar" action="/dat-phong"><label>Cơ sở<select name="branch">{branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.shortName}</option>)}</select></label><label>Nhận phòng<input name="checkIn" type="date" /></label><label>Trả phòng<input name="checkOut" type="date" /></label><label>Khách<select name="guests"><option>2</option><option>1</option><option>3</option><option>4</option></select></label><button className="button button-dark"><CalendarDays /> Kiểm tra phòng</button></form><Link href="/dat-phong" className="mobile-book">Đặt phòng</Link></>
}

export function FloatingActions() {
  const [visible, setVisible] = useState(false)
  useEffect(() => { const listener = () => setVisible(scrollY > 500); addEventListener('scroll', listener, { passive: true }); return () => removeEventListener('scroll', listener) }, [])
  return <div className="floating-actions"><a href={\`tel:\${siteConfig.hotline.replace(/\\s/g, '')}\`} aria-label="Gọi khách sạn"><Phone /></a><a href={siteConfig.zalo} aria-label="Nhắn Zalo"><MessageCircle /></a>{visible && <button aria-label="Lên đầu trang" onClick={() => scrollTo({ top: 0, behavior: 'smooth' })}><ArrowUp /></button>}</div>
}

export function Concierge() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<{ role: 'assistant'|'user'; text: string }[]>([{ role: 'assistant', text: 'Xin chào, em là PML Concierge. Em có thể giúp Quý khách chọn phòng, tìm hiểu Onsen hoặc lên lịch ở Sài Gòn.' }])
  const [draft, setDraft] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState(false)
  const dialog = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement
    dialog.current?.querySelector<HTMLElement>('button,input')?.focus()
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
      if (event.key === 'Tab' && dialog.current) {
        const focusable = [...dialog.current.querySelectorAll<HTMLElement>('button,input,a')]
        if (!focusable.length) return
        const first = focusable[0], last = focusable[focusable.length - 1]
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
      }
    }
    addEventListener('keydown', key); return () => { removeEventListener('keydown', key); previous?.focus() }
  }, [open])
  async function send(text: string) {
    if (!text.trim() || pending) return
    const next = [...messages, { role: 'user' as const, text }]
    setMessages(next); setDraft(''); setPending(true); setError(false)
    try {
      const response = await fetch('/api/assistant', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ locale: 'vi', messages: next.slice(-8) }) })
      const result = await response.json()
      if (!response.ok || !result.reply) throw new Error()
      setMessages([...next, { role: 'assistant', text: result.reply }])
    } catch { setError(true) } finally { setPending(false) }
  }
  return <><button className="concierge-launcher" onClick={() => setOpen(true)} aria-label="Mở PML Concierge"><MessageCircle /> <span>PML Concierge</span></button>
    {open && <div className="concierge-backdrop"><div className="concierge" ref={dialog} role="dialog" aria-modal="true" aria-label="PML Concierge">
      <header><div><strong>PML Concierge</strong><span><i /> Trực tuyến</span></div><button onClick={() => setOpen(false)} aria-label="Đóng trợ lý"><X /></button></header>
      <div className="messages" aria-live="polite">{messages.map((message, i) => <p key={i} className={message.role}>{message.text}</p>)}{pending && <p className="assistant typing">•••</p>}{error && <div className="assistant error">Chưa thể kết nối. <button onClick={() => send(messages.at(-1)?.text ?? '')}>Thử lại</button></div>}</div>
      <div className="quick-replies">{quickReplies.map((reply) => <button key={reply.id} onClick={() => send(reply.prompt)}>{reply.label}</button>)}</div>
      <p className="handoff">Cần người hỗ trợ? <a href={\`tel:\${siteConfig.hotline.replace(/\\s/g, '')}\`}>Gọi ngay</a> · <a href={siteConfig.zalo}>Zalo</a></p>
      <form onSubmit={(event) => { event.preventDefault(); send(draft) }}><input value={draft} onChange={(event) => setDraft(event.target.value)} aria-label="Tin nhắn" placeholder="Hỏi PML Concierge…" /><button aria-label="Gửi tin nhắn">Gửi</button></form>
    </div></div>}
  </>
}
`,
)

const gallery = data.gallery_sample.slice(0, 8).map((item, index) => ({
  id: item.id,
  src: [
    'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb',
    'https://images.unsplash.com/photo-1535827841776-24afc1e255ac',
    'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6',
  ][index % 3] + `?auto=format&fit=crop&w=${index % 2 ? 900 : 1200}&q=82`,
  alt: item.alt_vi ?? item.caption ?? 'Không gian PML Hotel tại Quận 1',
}))

emit(
  'data/gallery.ts',
  `export type GalleryImage = { id: string; src: string; alt: string }
export const gallery: GalleryImage[] = ${JSON.stringify(gallery, null, 2)}
`,
)

emit(
  'app/layout.tsx',
  `import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Be_Vietnam_Pro, Lora } from 'next/font/google'
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
  return <html lang="vi" className={\`\${sans.variable} \${serif.variable}\`}><body>{children}{process.env.NODE_ENV === 'production' && <Analytics />}</body></html>
}
`,
)

emit(
  'app/page.tsx',
  `import Image from 'next/image'
import Link from 'next/link'
import { Bath, BriefcaseBusiness, Coffee, MapPin, Sparkles } from 'lucide-react'
import { siteConfig } from '@/config/site'
import { amenityHighlights, branches } from '@/data/branches'
import { faqs } from '@/data/faqs'
import { gallery } from '@/data/gallery'
import { offers } from '@/data/offers'
import { featuredRoomIds, rooms } from '@/data/rooms'
import { reviews, sampleContentNote } from '@/data/reviews'
import { formatPrice } from '@/lib/format-price'
import { BookingBar, Concierge, FAQAccordion, FloatingActions, Header, Newsletter, Reveal } from '@/components/site-client'

const blur = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSIyNSI+PHJlY3QgZmlsbD0iI2Q4YzNiNCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjI1Ii8+PC9zdmc+'
const roomImages = {
  'room-onsen-suite': 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1400&q=85',
  'room-deluxe-city': 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1400&q=85',
  'room-rooftop-jacuzzi': 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=85',
}

export default function Home() {
  const featured = featuredRoomIds.map((id) => rooms.find((room) => room.id === id)!).filter(Boolean)
  const hotelJsonLd = { '@context': 'https://schema.org', '@type': 'Hotel', name: siteConfig.name, description: siteConfig.description, url: siteConfig.url, telephone: siteConfig.hotline, email: siteConfig.email, containsPlace: branches.map((branch) => ({ '@type': 'LodgingBusiness', name: branch.name, address: branch.address })) }
  const faqJsonLd = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.slice(0, 8).map((faq) => ({ '@type': 'Question', name: faq.question, acceptedAnswer: { '@type': 'Answer', text: faq.answer } })) }
  return <main>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(hotelJsonLd) }} />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
    <Header />
    <section className="hero" id="experience"><Image src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=2200&q=88" alt="Sảnh PML Hotel ấm áp tại trung tâm Quận 1" fill priority sizes="100vw" placeholder="blur" blurDataURL={blur} /><div className="hero-shade" /><div className="hero-content"><p className="eyebrow">Ba khách sạn boutique giữa Quận 1</p><h1>Lưu trú vì <em>cảm xúc.</em></h1><p>Nơi nghi thức tắm khoáng Nhật Bản gặp tinh thần hiếu khách Sài Gòn.</p><div className="hero-actions"><Link href="/dat-phong" className="button button-accent">Đặt phòng ngay</Link><Link href="#rooms" className="button button-ghost">Khám phá phòng nghỉ</Link></div><ul className="trust-badges"><li>Trà chiều miễn phí</li><li>Hủy trước 3 ngày</li><li>Lễ tân 24/7</li></ul></div></section>
    <BookingBar />

    <section className="section" id="rooms"><Reveal><p className="eyebrow ink">Phòng nổi bật</p><h2>Mỗi căn phòng,<br/><em>một góc nhìn riêng.</em></h2></Reveal><div className="room-grid">{featured.map((room) => <article className="room-card" key={room.id}><div className="image-wrap"><Image src={roomImages[room.id as keyof typeof roomImages]} alt={\`\${room.name}, \${room.view}\`} fill sizes="(max-width: 768px) 100vw, 33vw" placeholder="blur" blurDataURL={blur} /></div><div><p>{branches.find((b) => b.id === room.branchId)?.shortName}</p><h3>{room.name}</h3><p>{room.description}</p><ul><li>{room.sizeSqm} m²</li><li>{room.bedType}</li><li>{room.view}</li></ul><footer><strong>Từ {formatPrice(room.priceVnd)} <small>/ đêm</small></strong><Link href={\`/phong/\${room.id.replace('room-','')}\`}>Xem phòng →</Link></footer></div></article>)}</div></section>

    <section className="section tinted" id="amenities"><Reveal><p className="eyebrow ink">Tiện ích</p><h2>Những nghi thức nhỏ,<br/><em>được làm chỉn chu.</em></h2></Reveal><div className="bento">{amenityHighlights.map((amenity, index) => { const Icons = [Bath, Sparkles, BriefcaseBusiness, Coffee]; const Icon = Icons[index]; return <article key={amenity.id}><Icon/><h3>{amenity.name}</h3><p>{amenity.detail}</p><small>{amenity.hours}</small></article> })}</div></section>

    <section className="section" id="location"><Reveal><p className="eyebrow ink">Ba địa chỉ</p><h2>Ngay giữa nhịp sống<br/><em>Quận 1.</em></h2></Reveal><div className="branch-layout"><div className="branch-grid">{branches.map((branch) => <article key={branch.id}><MapPin/><h3>{branch.name}</h3><p>{branch.address}</p><p>{branch.tagline}</p><Link href={\`/co-so/\${branch.slug}\`}>Khám phá cơ sở →</Link></article>)}</div><div className="map-placeholder"><span>Quận 1</span>{branches.map((branch, i) => <i key={branch.id} style={{ left: \`\${24 + i * 25}%\`, top: \`\${30 + (i % 2) * 28}%\` }}>{i + 1}</i>)}</div></div></section>

    <section className="section dark" id="offers"><Reveal><p className="eyebrow">Ưu đãi</p><h2>Thêm một lý do<br/><em>để ở lại.</em></h2></Reveal><div className="offer-grid">{offers.slice(0,3).map((offer) => <article key={offer.id}><h3>{offer.name}</h3><p>{offer.description}</p>{offer.priceFromVnd && <strong>Từ {formatPrice(offer.priceFromVnd)}</strong>}<Link href="/dat-phong">Tìm hiểu →</Link></article>)}</div></section>

    <section className="section reviews"><Reveal><p className="eyebrow ink">Lời khách kể</p><h2>Một cảm giác<br/><em>đáng sẻ chia.</em></h2></Reveal><div className="review-track">{reviews.slice(0,5).map((review) => <figure key={review.id}><div>★★★★★</div><blockquote>“{review.text}”</blockquote><figcaption>{review.guest} · {review.origin}</figcaption></figure>)}</div><small>{sampleContentNote.vi}</small></section>

    <section className="section gallery"><p className="eyebrow ink">Khoảnh khắc PML</p><div className="masonry">{gallery.map((item) => <div key={item.id}><Image src={item.src} alt={item.alt} width={900} height={700} sizes="(max-width: 768px) 50vw, 25vw" placeholder="blur" blurDataURL={blur} /></div>)}</div></section>

    <section className="section faq"><Reveal><p className="eyebrow ink">Câu hỏi thường gặp</p><h2>Trước khi<br/><em>Quý khách đến.</em></h2></Reveal><FAQAccordion items={faqs.slice(0,8)} /></section>

    <footer className="footer"><div><Link href="/" className="wordmark">{siteConfig.name}</Link><p>{siteConfig.description}</p><a href={\`tel:\${siteConfig.hotline.replace(/\\s/g,'')}\`}>{siteConfig.hotline}</a><a href={\`mailto:\${siteConfig.email}\`}>{siteConfig.email}</a></div><div><h3>Ghé thăm</h3>{branches.map((branch) => <Link key={branch.id} href={\`/co-so/\${branch.slug}\`}>{branch.street} · Quận 1</Link>)}</div><div><h3>Khám phá</h3><Link href="#location">Khám phá khu phố</Link><Link href="/tin-tuc">Đọc câu chuyện</Link><div className="socials">{Object.entries(siteConfig.social).map(([name,href]) => <a key={name} href={href}>{name}</a>)}</div></div><div><h3>Nhận tin từ PML</h3><p>Ưu đãi và những câu chuyện Sài Gòn, gửi vừa đủ.</p><Newsletter /></div><p className="footer-bottom">© 2026 {siteConfig.name}</p></footer>
    <FloatingActions/><Concierge/>
  </main>
}
`,
)

emit(
  'app/phong/[slug]/page.tsx',
  `import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { rooms } from '@/data/rooms'
import { branches } from '@/data/branches'
import { formatPrice } from '@/lib/format-price'
import { siteConfig } from '@/config/site'
import { Header } from '@/components/site-client'

export function generateStaticParams() { return rooms.map((room) => ({ slug: room.id.replace('room-','') })) }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params; const room = rooms.find((item) => item.id === \`room-\${slug}\`)
  if (!room) return {}
  const url = \`/phong/\${slug}\`
  return { title: room.name, description: room.description, alternates: { canonical: url }, openGraph: { title: room.name, description: room.description, url, locale: 'vi_VN' } }
}
export default async function RoomPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const room = rooms.find((item) => item.id === \`room-\${slug}\`); if (!room) notFound()
  const branch = branches.find((item) => item.id === room.branchId)
  const image = 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1800&q=86'
  const jsonLd = { '@context':'https://schema.org','@type':'HotelRoom',name:room.name,description:room.description,bed:{'@type':'BedDetails',typeOfBed:room.bedType},floorSize:{'@type':'QuantitativeValue',value:room.sizeSqm,unitCode:'MTK'},offers:{'@type':'Offer',price:room.priceVnd,priceCurrency:'VND',url:\`\${siteConfig.url}/phong/\${slug}\`} }
  return <main><Header/><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(jsonLd)}}/><div className="detail-hero"><Image src={image} alt={\`\${room.name}, \${room.view}\`} fill priority sizes="100vw"/></div><section className="detail-layout"><article><p className="eyebrow ink">{branch?.name}</p><h1>{room.name}</h1><p className="lead">{room.description}</p><div className="spec-grid"><span>{room.sizeSqm} m²</span><span>{room.bedType}</span><span>{room.capacity}</span><span>{room.view}</span></div><h2>Tiện nghi nổi bật</h2><ul>{room.features.map((feature)=><li key={feature}>{feature}</li>)}</ul></article><aside><strong>{formatPrice(room.priceVnd)} <small>/ đêm</small></strong><p>Giá tham khảo. Tình trạng phòng được xác nhận ở bước tiếp theo.</p><Link className="button button-accent" href={\`/dat-phong?room=\${room.id}\`}>Gửi yêu cầu đặt phòng</Link></aside></section></main>
}
`,
)

emit(
  'app/co-so/[slug]/page.tsx',
  `import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { branches } from '@/data/branches'
import { rooms } from '@/data/rooms'
import { siteConfig } from '@/config/site'
import { Header } from '@/components/site-client'
import { formatPrice } from '@/lib/format-price'

export function generateStaticParams(){return branches.map((branch)=>({slug:branch.slug}))}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{const {slug}=await params;const branch=branches.find((item)=>item.slug===slug);if(!branch)return{};const url=\`/co-so/\${slug}\`;return{title:branch.name,description:branch.highlights,alternates:{canonical:url},openGraph:{title:branch.name,description:branch.highlights,url,locale:'vi_VN'}}}
export default async function BranchPage({params}:{params:Promise<{slug:string}>}){const{slug}=await params;const branch=branches.find((item)=>item.slug===slug);if(!branch)notFound();const branchRooms=rooms.filter((room)=>room.branchId===branch.id);const jsonLd={'@context':'https://schema.org','@type':'LodgingBusiness',name:branch.name,address:branch.address,telephone:branch.phone,email:branch.email,url:\`\${siteConfig.url}/co-so/\${slug}\`};return <main><Header/><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(jsonLd)}}/><div className="detail-hero"><Image src="https://images.unsplash.com/photo-1535827841776-24afc1e255ac?auto=format&fit=crop&w=1800&q=86" alt={\`Sảnh \${branch.name}\`} fill priority sizes="100vw"/></div><section className="section"><p className="eyebrow ink">Cơ sở PML</p><h1>{branch.name}</h1><p className="lead">{branch.highlights}</p><p>{branch.address}</p><h2>Phòng tại cơ sở</h2><div className="branch-grid">{branchRooms.map((room)=><article key={room.id}><h3>{room.name}</h3><p>{room.description}</p><strong>Từ {formatPrice(room.priceVnd)}</strong><Link href={\`/phong/\${room.id.replace('room-','')}\`}>Xem phòng →</Link></article>)}</div></section></main>}
`,
)

emit(
  'app/dat-phong/page.tsx',
  `'use client'
import { useState } from 'react'
import { Header } from '@/components/site-client'
import { branches } from '@/data/branches'
import { submitBooking } from '@/lib/submit-booking'
import { siteConfig } from '@/config/site'

export default function BookingPage(){const[reference,setReference]=useState('');return <main><Header/><section className="booking-page"><div><p className="eyebrow ink">Yêu cầu đặt phòng</p><h1>Kỳ nghỉ được<br/><em>chăm chút.</em></h1><p>Đây là yêu cầu giữ chỗ, không phải xác nhận phòng theo thời gian thực. Đội ngũ PML sẽ liên hệ trực tiếp.</p><a href={\`tel:\${siteConfig.hotline.replace(/\\s/g,'')}\`}>{siteConfig.hotline}</a></div><form onSubmit={async(event)=>{event.preventDefault();const form=new FormData(event.currentTarget);const result=await submitBooking({branchId:String(form.get('branchId')),checkIn:String(form.get('checkIn')),checkOut:String(form.get('checkOut')),guests:Number(form.get('guests')),name:String(form.get('name')),phone:String(form.get('phone')),email:String(form.get('email'))});setReference(result.reference)}}><label>Cơ sở<select name="branchId" required>{branches.map((branch)=><option key={branch.id} value={branch.id}>{branch.name}</option>)}</select></label><div><label>Nhận phòng<input type="date" name="checkIn" required/></label><label>Trả phòng<input type="date" name="checkOut" required/></label></div><label>Số khách<input type="number" name="guests" min="1" max="8" defaultValue="2" required/></label><label>Họ tên<input name="name" autoComplete="name" required/></label><label>Số điện thoại<input name="phone" autoComplete="tel" required/></label><label>Email<input type="email" name="email" autoComplete="email"/></label><button className="button button-dark">Gửi yêu cầu</button><p aria-live="polite">{reference&&\`Đã nhận yêu cầu \${reference}. PML sẽ liên hệ với Quý khách.\`}</p></form></section></main>}
`,
)

emit(
  'app/sitemap.ts',
  `import type { MetadataRoute } from 'next'
import { siteConfig } from '@/config/site'
import { rooms } from '@/data/rooms'
import { branches } from '@/data/branches'
export default function sitemap():MetadataRoute.Sitemap{return['','/dat-phong','/tin-tuc',...rooms.map((room)=>\`/phong/\${room.id.replace('room-','')}\`),...branches.map((branch)=>\`/co-so/\${branch.slug}\`)].map((path)=>({url:\`\${siteConfig.url}\${path}\`,lastModified:new Date(),changeFrequency:path?'monthly':'weekly',priority:path?.startsWith('/phong')?.8:1}))}
`,
)

emit(
  'app/robots.ts',
  `import type { MetadataRoute } from 'next'
import { siteConfig } from '@/config/site'
export default function robots():MetadataRoute.Robots{return{rules:{userAgent:'*',allow:'/',disallow:'/api/'},sitemap:\`\${siteConfig.url}/sitemap.xml\`}}
`,
)

emit(
  'app/opengraph-image.tsx',
  `import { ImageResponse } from 'next/og'
import { siteConfig } from '@/config/site'
export const size={width:1200,height:630}
export const contentType='image/png'
export default function Image(){return new ImageResponse(<div style={{width:'100%',height:'100%',display:'flex',flexDirection:'column',justifyContent:'center',padding:80,background:'#26211d',color:'#f8f3eb'}}><div style={{fontSize:28,color:'#c99b65'}}>BOUTIQUE · DISTRICT 1</div><div style={{fontSize:96,marginTop:30}}>{siteConfig.name}</div><div style={{fontSize:44,marginTop:18}}>{siteConfig.tagline.vi}</div></div>,size)}
`,
)

emit(
  'app/not-found.tsx',
  `import Link from 'next/link'
import { siteConfig } from '@/config/site'
export default function NotFound(){return <main className="status-page"><span className="wordmark">{siteConfig.name}</span><p>404</p><h1>Trang này đã đi dạo đâu đó.</h1><Link className="button button-accent" href="/">Về trang chủ</Link></main>}
`,
)

emit(
  'app/error.tsx',
  `'use client'
export default function ErrorPage({reset}:{reset:()=>void}){return <main className="status-page"><p>Có một nhịp chưa trọn vẹn.</p><h1>Trang chưa thể hiển thị.</h1><button className="button button-accent" onClick={reset}>Thử lại</button></main>}
`,
)

emit(
  'next.config.mjs',
  `/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'images.unsplash.com' }],
    formats: ['image/avif', 'image/webp'],
  },
}
export default nextConfig
`,
)

emit(
  'app/globals.css',
  `@import 'tailwindcss';

:root{--cream:#f8f3eb;--cream-2:#efe6d9;--ink:#26211d;--muted:#71685f;--accent:#c99b65;--accent-dark:#95683c;--line:rgba(38,33,29,.14);--shadow:0 24px 70px rgba(38,33,29,.14);--radius:1.25rem;--section:clamp(5rem,9vw,9rem)}
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--cream);color:var(--ink);font-family:var(--font-sans),sans-serif}a{color:inherit;text-decoration:none}button,input,select{font:inherit}button,a,input,select{outline-offset:4px}:focus-visible{outline:2px solid var(--accent-dark)}h1,h2,h3,.wordmark{font-family:var(--font-serif),serif}h1{font-size:clamp(3.7rem,8vw,8.5rem);line-height:.92;letter-spacing:-.055em}h2{font-size:clamp(2.8rem,5.3vw,5.8rem);line-height:1;letter-spacing:-.045em;margin:.3em 0 .8em}h3{font-size:clamp(1.5rem,2vw,2.2rem)}em{color:var(--accent-dark);font-weight:400}.site-header{position:fixed;z-index:50;top:0;left:0;right:0;height:84px;padding:0 clamp(1.2rem,4vw,4.5rem);display:flex;align-items:center;justify-content:space-between;color:white;border-bottom:1px solid rgba(255,255,255,.2);transition:.3s}.site-header.is-compact{height:66px;background:rgba(248,243,235,.96);color:var(--ink);box-shadow:0 6px 24px rgba(0,0,0,.08)}.wordmark{font-size:1.4rem;font-weight:600}.desktop-nav{display:flex;gap:2rem;font-size:.74rem;text-transform:uppercase;letter-spacing:.14em}.header-actions{display:flex;align-items:center;gap:1rem}.language-toggle{font-size:.75rem}.language-toggle button{border:0;background:none;color:inherit;padding:.4rem}.language-toggle button[aria-pressed=true]{color:var(--accent);font-weight:700}.menu-button{display:none;border:0;background:none;color:inherit}.mobile-menu{position:absolute;top:100%;left:0;right:0;padding:2rem;background:var(--cream);color:var(--ink);display:flex;flex-direction:column;gap:1.2rem}.button{display:inline-flex;align-items:center;justify-content:center;gap:.5rem;padding:1rem 1.35rem;border:0;text-transform:uppercase;font-size:.73rem;font-weight:700;letter-spacing:.14em;cursor:pointer}.button-accent{background:var(--accent);color:var(--ink)}.button-dark{background:var(--ink);color:white}.button-ghost{border:1px solid rgba(255,255,255,.7);color:white}.hero{height:min(920px,100svh);min-height:680px;position:relative;color:white;overflow:hidden}.hero>img{object-fit:cover;animation:heroZoom 18s ease-out both}.hero-shade{position:absolute;inset:0;background:linear-gradient(90deg,rgba(24,19,15,.8),rgba(24,19,15,.2)),linear-gradient(0deg,rgba(20,16,13,.45),transparent 55%)}.hero-content{position:absolute;z-index:2;left:clamp(1.4rem,7vw,8rem);bottom:clamp(7rem,17vh,11rem);max-width:850px}.hero-content h1{margin:.2em 0}.hero-content>p:not(.eyebrow){font-size:clamp(1rem,2vw,1.35rem);max-width:620px}.hero-actions{display:flex;gap:.8rem;margin-top:2rem}.eyebrow{text-transform:uppercase;letter-spacing:.22em;font-size:.72rem;font-weight:700;color:var(--accent)}.eyebrow.ink{color:var(--accent-dark)}.trust-badges{display:flex;gap:2rem;padding:0;margin:2.2rem 0 0;list-style:none;font-size:.8rem}.trust-badges li:before{content:'✓';color:var(--accent);margin-right:.5rem}.booking-bar{position:relative;z-index:4;max-width:1180px;margin:-52px auto 0;background:white;box-shadow:var(--shadow);padding:1rem;display:grid;grid-template-columns:1.3fr 1fr 1fr .7fr 1.25fr;gap:1px}.booking-bar label{font-size:.68rem;text-transform:uppercase;letter-spacing:.12em;padding:.45rem .8rem}.booking-bar input,.booking-bar select{display:block;width:100%;border:0;background:transparent;margin-top:.35rem;color:var(--ink)}.booking-bar svg{width:1rem}.mobile-book{display:none}.section{padding:var(--section) clamp(1.2rem,5vw,5rem);max-width:1500px;margin:auto}.tinted{max-width:none;background:var(--cream-2)}.dark{max-width:none;background:var(--ink);color:white}.room-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1.5rem}.room-card{background:white;box-shadow:0 8px 32px rgba(38,33,29,.07)}.image-wrap{position:relative;aspect-ratio:4/3;overflow:hidden}.image-wrap img{object-fit:cover;transition:.6s}.room-card:hover img{transform:scale(1.035)}.room-card>div:last-child{padding:1.5rem}.room-card h3{margin:.4rem 0}.room-card p{color:var(--muted);line-height:1.7}.room-card ul{padding:1rem 0;list-style:none;border-block:1px solid var(--line);font-size:.8rem}.room-card footer{display:flex;justify-content:space-between;gap:1rem;align-items:end}.room-card footer small{font-weight:400}.room-card footer a{color:var(--accent-dark);font-size:.8rem}.bento{display:grid;grid-template-columns:1.25fr .75fr .75fr 1.25fr;gap:1px;background:var(--line)}.bento article{background:var(--cream);padding:clamp(1.5rem,3vw,3rem);min-height:300px}.bento svg{color:var(--accent-dark)}.bento p{color:var(--muted);line-height:1.7}.branch-layout{display:grid;grid-template-columns:1.1fr .9fr;gap:3rem}.branch-grid{display:grid;gap:1rem}.branch-grid article{border:1px solid var(--line);padding:1.7rem;display:flex;flex-direction:column;align-items:start}.branch-grid article p{color:var(--muted)}.branch-grid article a{color:var(--accent-dark)}.map-placeholder{min-height:560px;position:relative;background:radial-gradient(circle at 50% 42%,#e2d2be,transparent 25%),linear-gradient(125deg,#e9dfd0,#d9c9b5);display:grid;place-items:center;color:#9a8064;font-family:var(--font-serif);font-size:4rem}.map-placeholder i{position:absolute;width:2.5rem;height:2.5rem;border-radius:50%;background:var(--ink);color:white;display:grid;place-items:center;font-size:.8rem}.offer-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:rgba(255,255,255,.18)}.offer-grid article{padding:2.5rem;background:var(--ink);display:flex;flex-direction:column;align-items:start}.offer-grid p{color:rgba(255,255,255,.62);line-height:1.7}.offer-grid a{color:var(--accent);margin-top:1.5rem}.review-track{display:flex;gap:1rem;overflow-x:auto;scroll-snap-type:x mandatory;padding-bottom:1rem}.review-track figure{min-width:min(410px,84vw);scroll-snap-align:start;border:1px solid var(--line);padding:2rem;margin:0}.review-track blockquote{font-family:var(--font-serif);font-size:1.3rem;line-height:1.6}.review-track figcaption{color:var(--accent-dark);font-size:.75rem;text-transform:uppercase;letter-spacing:.12em}.masonry{columns:4;column-gap:.8rem}.masonry div{break-inside:avoid;margin-bottom:.8rem}.masonry img{width:100%;height:auto;display:block}.faq{display:grid;grid-template-columns:.8fr 1.2fr;gap:5rem}.faq-list{border-top:1px solid var(--line)}.faq-item{border-bottom:1px solid var(--line)}.faq-item button{width:100%;display:flex;justify-content:space-between;align-items:center;text-align:left;padding:1.4rem 0;border:0;background:none;font-weight:600}.faq-item svg{width:1rem;transition:.2s}.faq-item svg.rotate{transform:rotate(180deg)}.faq-item p{color:var(--muted);line-height:1.7;margin:0 0 1.5rem}.footer{padding:5rem clamp(1.2rem,5vw,5rem) 2rem;background:#1d1916;color:white;display:grid;grid-template-columns:1.2fr .8fr .7fr 1fr;gap:3rem}.footer>div{display:flex;flex-direction:column;gap:.8rem}.footer p,.footer a{color:rgba(255,255,255,.62);line-height:1.6}.footer .wordmark{color:white}.footer h3{font-size:1rem;color:var(--accent)}.socials{display:flex;flex-wrap:wrap;gap:.7rem;text-transform:capitalize}.newsletter label{position:absolute;clip:rect(0 0 0 0)}.newsletter>div{display:flex}.newsletter input{min-width:0;width:100%;padding:.8rem;background:transparent;border:1px solid rgba(255,255,255,.3);color:white}.newsletter button{border:0;background:var(--accent);padding:.8rem}.footer-bottom{grid-column:1/-1;border-top:1px solid rgba(255,255,255,.12);padding-top:1.5rem}.floating-actions{position:fixed;z-index:35;right:1.2rem;bottom:6.5rem;display:flex;flex-direction:column;gap:.5rem}.floating-actions a,.floating-actions button{width:46px;height:46px;border-radius:50%;border:0;background:var(--cream);color:var(--ink);box-shadow:0 8px 28px rgba(0,0,0,.18);display:grid;place-items:center}.floating-actions svg{width:19px}.concierge-launcher{position:fixed;z-index:40;right:1.2rem;bottom:1.2rem;border:0;border-radius:999px;background:var(--ink);color:white;padding:.8rem 1rem;display:flex;gap:.6rem;align-items:center;box-shadow:var(--shadow)}.concierge-launcher svg{color:var(--accent)}.concierge-backdrop{position:fixed;z-index:60;inset:0;pointer-events:none}.concierge{pointer-events:auto;position:absolute;right:1.2rem;bottom:1.2rem;width:min(390px,calc(100vw - 2rem));height:min(620px,calc(100svh - 2rem));background:var(--cream);border-radius:1.4rem;box-shadow:0 25px 80px rgba(0,0,0,.25);overflow:hidden;display:flex;flex-direction:column}.concierge header{padding:1rem 1.2rem;background:var(--ink);color:white;display:flex;justify-content:space-between}.concierge header div{display:flex;flex-direction:column}.concierge header span{font-size:.7rem;color:#a8d6aa}.concierge header i{display:inline-block;width:7px;height:7px;border-radius:50%;background:#71c979}.concierge header button{border:0;background:none;color:white}.messages{flex:1;overflow:auto;padding:1rem;display:flex;flex-direction:column;gap:.7rem}.messages p{max-width:86%;margin:0;padding:.75rem 1rem;border-radius:1rem;line-height:1.5;font-size:.88rem}.messages .assistant{align-self:start;background:white}.messages .user{align-self:end;background:var(--accent)}.typing{letter-spacing:.2em}.error button{border:0;background:none;color:var(--accent-dark);text-decoration:underline}.quick-replies{display:flex;overflow-x:auto;gap:.4rem;padding:.5rem 1rem}.quick-replies button{white-space:nowrap;border:1px solid var(--line);border-radius:999px;background:white;padding:.5rem .7rem;font-size:.72rem}.handoff{font-size:.72rem;padding:0 1rem}.handoff a{color:var(--accent-dark)}.concierge form{display:flex;padding:.8rem;border-top:1px solid var(--line)}.concierge form input{flex:1;min-width:0;border:0;background:white;padding:.75rem}.concierge form button{border:0;background:var(--ink);color:white;padding:.7rem}.detail-hero{position:relative;height:min(70vh,720px)}.detail-hero img{object-fit:cover}.detail-layout{padding:5rem clamp(1.2rem,7vw,8rem);display:grid;grid-template-columns:1fr 360px;gap:6rem}.detail-layout h1,.booking-page h1,.section>h1{font-size:clamp(3rem,6vw,6.5rem)}.lead{font-size:1.2rem;line-height:1.8;color:var(--muted);max-width:760px}.spec-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:1px;background:var(--line);margin:3rem 0}.spec-grid span{background:var(--cream);padding:1.2rem}.detail-layout aside{position:sticky;top:100px;height:max-content;background:white;padding:2rem;box-shadow:var(--shadow)}.detail-layout aside strong{font-size:1.5rem}.booking-page{min-height:100vh;padding:10rem clamp(1.2rem,8vw,9rem) 5rem;display:grid;grid-template-columns:1fr 1fr;gap:7rem}.booking-page form{background:white;padding:clamp(1.5rem,4vw,3rem);box-shadow:var(--shadow)}.booking-page label{display:block;font-size:.78rem;text-transform:uppercase;letter-spacing:.1em;margin-bottom:1rem}.booking-page input,.booking-page select{display:block;width:100%;padding:.9rem;border:1px solid var(--line);margin-top:.4rem}.booking-page form>div{display:grid;grid-template-columns:1fr 1fr;gap:1rem}.status-page{min-height:100svh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:2rem}.status-page h1{font-size:clamp(3rem,7vw,6rem)}@keyframes heroZoom{from{transform:scale(1)}to{transform:scale(1.08)}}
@media(max-width:900px){.desktop-nav,.desktop-book{display:none}.menu-button{display:block}.room-grid,.offer-grid{grid-template-columns:1fr}.bento{grid-template-columns:1fr 1fr}.branch-layout,.faq,.detail-layout,.booking-page{grid-template-columns:1fr;gap:2rem}.map-placeholder{min-height:380px}.footer{grid-template-columns:1fr 1fr}.booking-bar{display:none}.mobile-book{display:block;position:fixed;z-index:30;left:0;right:0;bottom:0;background:var(--accent);text-align:center;padding:1rem;font-weight:700}.concierge-launcher{bottom:4.8rem}.floating-actions{bottom:8.7rem}.masonry{columns:2}.detail-layout aside{position:static}}
@media(max-width:560px){.site-header{height:68px}.hero{min-height:650px}.hero-content{bottom:7.5rem}.hero-actions{flex-direction:column;align-items:stretch}.trust-badges{gap:.7rem;flex-wrap:wrap}.bento,.footer{grid-template-columns:1fr}.bento article{min-height:auto}.concierge-launcher span{display:none}.concierge-backdrop{background:rgba(0,0,0,.25);pointer-events:auto}.concierge{inset:0;width:100%;height:100svh;border-radius:0}.review-track figure{min-width:88vw}.booking-page form>div{grid-template-columns:1fr}}
@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}.hero>img{animation:none!important}*,*:before,*:after{transition-duration:.01ms!important;animation-duration:.01ms!important;animation-iteration-count:1!important}}
`,
)

emit(
  'README.md',
  `# PML Hotel

Next.js 16 App Router website for PML Hotel.

## Content architecture

- \`config/site.ts\`: brand name, tagline, contact details, navigation, social placeholders, and branch references.
- \`data/*.ts\`: typed room, branch, offer, FAQ, review, gallery, and assistant quick-reply content copied from \`files/pml_hotel_dataset_full.json\`.
- \`i18n/vi.ts\` and \`i18n/en.ts\`: typed public UI dictionaries. Vietnamese is the default; the toggle persists \`pml-locale\` as a cookie.
- \`app/globals.css\`: design variables under \`:root\` for cream, ink, accent, spacing, radius, and shadows.

Run \`node scripts/generate-hotel-data.mjs\` after intentionally updating the source dataset. Review generated copy before publishing.

## Images

Current photography uses remote Unsplash placeholders through \`next/image\`. Replace URLs with licensed hotel photography, preserve descriptive Vietnamese alt text, and keep only the hero image marked priority.

## Booking connection

\`lib/submit-booking.ts\` currently returns a local request reference. Replace its implementation with the production CRM/PMS endpoint. Never collect card numbers, CVV, or OTP in this form.

## AI assistant

The Gemini server route is \`app/api/assistant/route.ts\`. Knowledge and prompt guardrails come from \`files/01_brand_policies.json\` through \`files/08_content_seo.json\`; typed quick replies and guardrail references are in \`data/assistant.ts\`. The server-only \`GEMINI_API_KEY\` must stay in local or deployment environment variables.

## Development and deployment

\`\`\`
npm run dev
npm run lint
npm run build
\`\`\`

Deploy on Vercel and set \`GEMINI_API_KEY\` in project settings. Do not expose it through a \`NEXT_PUBLIC_\` variable.
`,
)
