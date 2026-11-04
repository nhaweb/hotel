'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowUp,
  BedDouble,
  Building2,
  CalendarCheck,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Gift,
  Mail,
  Menu,
  MessageCircle,
  Phone,
  Sparkles,
  Waves,
  X,
} from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { navigationMenu, siteConfig, type Locale } from '@/config/site'
import { branches } from '@/data/branches'
import { dictionaries } from '@/i18n'
import { formatPrice } from '@/lib/format-price'

function readLocaleCookie(fallback: Locale): Locale {
  if (typeof document === 'undefined') return fallback
  const match = document.cookie.match(/(?:^|; )pml-locale=(en|vi)(?:;|$)/)
  return match?.[1] === 'en' || match?.[1] === 'vi' ? match[1] : fallback
}

function setLocaleCookie(locale: Locale) {
  document.cookie = `pml-locale=${locale}; path=/; max-age=31536000; samesite=lax`
  document.documentElement.lang = locale
}

export function Header({ initialLocale = 'vi' }: { initialLocale?: Locale }) {
  const [locale, setLocale] = useState<Locale>(initialLocale)
  const [open, setOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const copy = dictionaries[locale]

  useEffect(() => {
    const saved = readLocaleCookie(initialLocale)
    if (saved !== locale) setLocale(saved)
    document.documentElement.lang = saved
  }, [initialLocale])

  return (
    <header className="site-header is-compact">
      <div className="header-inner">
        <Link href="/" className="wordmark" aria-label={`${copy.home} ${siteConfig.name}`}>
          {siteConfig.name}
        </Link>

        {/* Desktop Nav according to user hierarchy */}
        <nav className="desktop-nav" aria-label={copy.navAria}>
          {navigationMenu.map((item) => {
            const hasSub = Boolean(item.items && item.items.length > 0)
            const isOpen = activeDropdown === item.key
            return (
              <div
                key={item.key}
                className="nav-dropdown-wrapper"
                onMouseEnter={() => hasSub && setActiveDropdown(item.key)}
                onMouseLeave={() => hasSub && setActiveDropdown(null)}
              >
                <Link
                  href={item.href}
                  className={`nav-dropdown-trigger ${isOpen ? 'is-open' : ''}`}
                  onClick={(e) => {
                    if (hasSub && window.innerWidth > 900) {
                      // allow navigation but toggle dropdown
                      setActiveDropdown(isOpen ? null : item.key)
                    }
                  }}
                >
                  <span>{locale === 'en' ? item.labelEn : item.labelVi}</span>
                  {hasSub && <ChevronDown className="dropdown-caret" />}
                </Link>

                {hasSub && isOpen && (
                  <div className="nav-dropdown-menu">
                    {item.items!.map((sub) => (
                      <Link
                        key={sub.key}
                        href={sub.href}
                        className="nav-dropdown-item"
                        onClick={() => setActiveDropdown(null)}
                      >
                        <strong>{locale === 'en' ? sub.labelEn : sub.labelVi}</strong>
                        {(sub.descVi || sub.descEn) && (
                          <small>{locale === 'en' ? sub.descEn : sub.descVi}</small>
                        )}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* Header Right Actions */}
        <div className="header-actions">
          <div className="language-toggle" aria-label={copy.language}>
            {(['vi', 'en'] as const).map((item, i) => (
              <span key={item}>
                {i > 0 && ' | '}
                <button
                  type="button"
                  aria-pressed={locale === item}
                  onClick={() => {
                    setLocaleCookie(item)
                    setLocale(item)
                    window.location.reload()
                  }}
                >
                  {item.toUpperCase()}
                </button>
              </span>
            ))}
          </div>
          <Link href="/dat-phong" className="button button-accent desktop-book">
            {copy.book}
          </Link>
          <button className="menu-button" onClick={() => setOpen(!open)} aria-label={copy.openNav}>
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {open && (
          <motion.nav
            className="mobile-menu"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            {navigationMenu.map((item) => (
              <div key={item.key} className="mobile-nav-group">
                <Link
                  href={item.href}
                  className="mobile-nav-title"
                  onClick={() => setOpen(false)}
                >
                  {locale === 'en' ? item.labelEn : item.labelVi}
                </Link>
                {item.items && item.items.length > 0 && (
                  <div className="mobile-sub-nav">
                    {item.items.map((sub) => (
                      <Link
                        key={sub.key}
                        href={sub.href}
                        onClick={() => setOpen(false)}
                      >
                        {locale === 'en' ? sub.labelEn : sub.labelVi}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <Link
              href="/dat-phong"
              className="button button-accent text-center mt-2"
              onClick={() => setOpen(false)}
            >
              {copy.book}
            </Link>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  )
}

export function Reveal({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const reduced = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial={reduced ? false : { opacity: 0, y: 14 }}
      whileInView={reduced ? {} : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.45 }}
    >
      {children}
    </motion.div>
  )
}

export function FAQAccordion({ items }: { items: { id: string; question: string; answer: string }[] }) {
  const [open, setOpen] = useState<string | null>(items[0]?.id ?? null)
  return (
    <div className="faq-list">
      {items.map((item) => (
        <div className="faq-item" key={item.id}>
          <button aria-expanded={open === item.id} onClick={() => setOpen(open === item.id ? null : item.id)}>
            {item.question}
            <ChevronDown className={open === item.id ? 'rotate' : ''} />
          </button>
          {open === item.id && <p>{item.answer}</p>}
        </div>
      ))}
    </div>
  )
}

export function Newsletter({ initialLocale = 'vi' }: { initialLocale?: Locale }) {
  const [done, setDone] = useState(false)
  const [locale, setLocale] = useState<Locale>(initialLocale)
  const copy = dictionaries[locale]

  useEffect(() => {
    setLocale(readLocaleCookie(initialLocale))
  }, [initialLocale])

  return (
    <form
      className="newsletter"
      onSubmit={(event) => {
        event.preventDefault()
        setDone(true)
      }}
    >
      <label htmlFor="newsletter-email">{copy.email}</label>
      <div>
        <input id="newsletter-email" type="email" required placeholder={copy.emailPlaceholder} />
        <button type="submit">{done ? <Check /> : copy.subscribe}</button>
      </div>
      <p aria-live="polite">{done ? copy.subscribed : ''}</p>
    </form>
  )
}

export function BookingBar({ initialLocale = 'vi' }: { initialLocale?: Locale }) {
  const [locale, setLocale] = useState<Locale>(initialLocale)
  const copy = dictionaries[locale]

  useEffect(() => {
    setLocale(readLocaleCookie(initialLocale))
  }, [initialLocale])

  return (
    <nav className="mobile-actions" aria-label={copy.quickActions}>
      <a href={`tel:${siteConfig.hotline.replace(/\s/g, '')}`}>
        <Phone />
        {copy.call}
      </a>
      <a href={siteConfig.zalo}>
        <MessageCircle />
        {copy.zalo}
      </a>
      <Link href="/dat-phong">
        <CalendarDays />
        {copy.book}
      </Link>
    </nav>
  )
}

export function FloatingActions({ initialLocale = 'vi' }: { initialLocale?: Locale }) {
  const [visible, setVisible] = useState(false)
  const [locale, setLocale] = useState<Locale>(initialLocale)
  const copy = dictionaries[locale]

  useEffect(() => {
    setLocale(readLocaleCookie(initialLocale))
    const listener = () => setVisible(scrollY > 500)
    addEventListener('scroll', listener, { passive: true })
    return () => removeEventListener('scroll', listener)
  }, [initialLocale])

  return (
    <div className="floating-actions">
      <a href={`tel:${siteConfig.hotline.replace(/\s/g, '')}`} aria-label={copy.floatingCall}>
        <Phone />
      </a>
      <a href={siteConfig.zalo} aria-label={copy.floatingZalo}>
        <MessageCircle />
      </a>
      {visible && (
        <button type="button" aria-label={copy.floatingTop} onClick={() => scrollTo({ top: 0, behavior: 'smooth' })}>
          <ArrowUp />
        </button>
      )}
    </div>
  )
}

export function RoomGallery({ images, roomName }: { images: string[]; roomName: string }) {
  const [active, setActive] = useState<number | null>(null)
  const dialog = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (active === null) return
    const previous = document.activeElement as HTMLElement
    document.body.style.overflow = 'hidden'
    dialog.current?.querySelector<HTMLElement>('button')?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setActive(null)
      if (event.key === 'ArrowLeft') setActive((value) => (value === null ? null : (value - 1 + images.length) % images.length))
      if (event.key === 'ArrowRight') setActive((value) => (value === null ? null : (value + 1) % images.length))
      if (event.key !== 'Tab' || !dialog.current) return
      const buttons = [...dialog.current.querySelectorAll<HTMLElement>('button')]
      const first = buttons[0]
      const last = buttons.at(-1)
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last?.focus()
      }
      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first?.focus()
      }
    }
    addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = ''
      removeEventListener('keydown', onKeyDown)
      previous?.focus()
    }
  }, [active, images.length])

  return (
    <>
      <div className="room-gallery">
        {images.map((image, index) => (
          <button key={image} type="button" onClick={() => setActive(index)} aria-label={`Open image ${index + 1} of ${roomName}`}>
            <Image src={image} alt={`${roomName}, ${index + 1}`} fill priority={index === 0} sizes={index === 0 ? '(max-width: 900px) 100vw, 66vw' : '(max-width: 900px) 50vw, 34vw'} />
          </button>
        ))}
      </div>
      {active !== null && (
        <div className="lightbox" ref={dialog} role="dialog" aria-modal="true" aria-label={`${roomName} gallery`}>
          <button className="lightbox-close" onClick={() => setActive(null)} aria-label="Close">
            <X />
          </button>
          <button className="lightbox-prev" onClick={() => setActive((active - 1 + images.length) % images.length)} aria-label="Previous">
            <ChevronLeft />
          </button>
          <div className="lightbox-image">
            <Image src={images[active]} alt={`${roomName} ${active + 1}`} fill sizes="100vw" priority />
          </div>
          <button className="lightbox-next" onClick={() => setActive((active + 1) % images.length)} aria-label="Next">
            <ChevronRight />
          </button>
          <p aria-live="polite">
            {active + 1} / {images.length}
          </p>
        </div>
      )}
    </>
  )
}

export function Footer({ initialLocale = 'vi' }: { initialLocale?: Locale }) {
  const [locale, setLocale] = useState<Locale>(initialLocale)
  const copy = dictionaries[locale]

  useEffect(() => {
    setLocale(readLocaleCookie(initialLocale))
  }, [initialLocale])

  return (
    <footer className="footer">
      <div className="footer-col brand-col">
        <Link href="/" className="wordmark">
          {siteConfig.name}
        </Link>
        <p>{copy.footerBlurb}</p>
        <div className="footer-contacts">
          <a href={`tel:${siteConfig.hotline.replace(/\s/g, '')}`}>
            <Phone className="footer-contact-icon" />
            <span>{siteConfig.hotline}</span>
          </a>
          <a href={`mailto:${siteConfig.email}`}>
            <Mail className="footer-contact-icon" />
            <span>{siteConfig.email}</span>
          </a>
        </div>
      </div>

      <div className="footer-col">
        <h3>{copy.footerVisit}</h3>
        {branches.map((branch) => (
          <Link key={branch.id} href={`/co-so/${branch.slug}`} className="footer-branch-link">
            <strong>{branch.name}</strong>
            <small>{branch.street} · {copy.district1}</small>
          </Link>
        ))}
      </div>

      <div className="footer-col">
        <h3>{copy.footerAmenities}</h3>
        <Link href="/#amenities">{locale === 'en' ? 'Outdoor Pool & Jacuzzi' : 'Hồ bơi & Jacuzzi Rooftop'}</Link>
        <Link href="/#amenities">{locale === 'en' ? 'Fitness & Gym Studio' : 'Phòng Gym & Yoga Studio'}</Link>
        <Link href="/#amenities">{locale === 'en' ? 'Japanese Mineral Onsen' : 'Onsen Khoáng Nóng Nhật Bản'}</Link>
        <Link href="/#amenities">{locale === 'en' ? 'Rooftop Bar & Lounge' : 'Sky Bar & Quầy Cà Phê'}</Link>
        <Link href="/#offers">{copy.offersLabel}</Link>
        <Link href="/tin-tuc">{copy.stories}</Link>
      </div>

      <div className="footer-col">
        <h3>{copy.newsletter}</h3>
        <p>{copy.newsletterText}</p>
        <Newsletter initialLocale={locale} />
        <div className="socials">
          {Object.entries(siteConfig.social).map(([name, href]) => (
            <a key={name} href={href} aria-label={name}>
              {name}
            </a>
          ))}
        </div>
      </div>

      {/* Centered Footer Bottom with Luxury Icon */}
      <div className="footer-bottom">
        <div className="footer-bottom__center">
          <Sparkles className="footer-bottom__icon" />
          <span className="footer-bottom__copy">{copy.copyright} {siteConfig.name}</span>
          <span className="footer-bottom__dot">✦</span>
          <span className="footer-bottom__sub">
            {locale === 'en'
              ? 'Boutique Luxury Hospitality · District 1, Ho Chi Minh City'
              : 'Khách sạn Boutique & Lifestyle · Quận 1, TP. Hồ Chí Minh'}
          </span>
        </div>
      </div>
    </footer>
  )
}

const conciergeSuggestions = {
  vi: [
    {
      id: 'couple-room',
      icon: BedDouble,
      title: 'Phòng cặp đôi',
      desc: 'Lãng mạn, view đẹp & bồn tắm',
      prompt: 'Gợi ý phòng lãng mạn cho cặp đôi tại PML Hotel',
    },
    {
      id: 'onsen-wellness',
      icon: Waves,
      title: 'Onsen & Spa',
      desc: 'Giờ mở cửa, quy chuẩn & khoáng nóng',
      prompt: 'Dịch vụ Onsen khoáng nóng tại PML hoạt động thế nào?',
    },
    {
      id: 'checkin-rules',
      icon: Clock,
      title: 'Nhận & Trả phòng',
      desc: '14:00 nhận - 12:00 trả & hỗ trợ sớm',
      prompt: 'Quy định giờ nhận phòng và trả phòng tại PML Hotel như thế nào?',
    },
    {
      id: 'current-offers',
      icon: Gift,
      title: 'Ưu đãi hiện có',
      desc: 'Tiết kiệm tới 25% & dịch vụ tặng kèm',
      prompt: 'Khách sạn hiện đang có những gói ưu đãi nào?',
    },
  ],
  en: [
    {
      id: 'couple-room',
      icon: BedDouble,
      title: 'Couples & Romance',
      desc: 'Romantic rooms with skyline views',
      prompt: 'Recommend a romantic room for a couple at PML Hotel',
    },
    {
      id: 'onsen-wellness',
      icon: Waves,
      title: 'Onsen & Spa',
      desc: 'Opening hours & hot mineral rituals',
      prompt: 'How does the Onsen experience work at PML Hotel?',
    },
    {
      id: 'checkin-rules',
      icon: Clock,
      title: 'Check-in & Check-out',
      desc: '14:00 in - 12:00 out & early arrival',
      prompt: 'What are the check-in and check-out policies at PML Hotel?',
    },
    {
      id: 'current-offers',
      icon: Gift,
      title: 'Special Offers',
      desc: 'Save up to 25% with curated perks',
      prompt: 'What special offers or packages are currently available?',
    },
  ],
} as const

export type RoomCardInfo = {
  id: string
  slug: string
  name: string
  nameEn?: string
  branchId: string
  branchName: string
  priceVnd: number
  sizeSqm?: number
  bedType?: string
  capacity?: string
  imageUrl?: string
  bookingUrl: string
  detailUrl: string
}

type ChatMessage = {
  role: 'assistant' | 'user'
  text: string
  suggestions?: string[]
  roomCards?: RoomCardInfo[]
}

export function Concierge({ initialLocale = 'vi' }: { initialLocale?: Locale }) {
  const router = useRouter()
  const [locale, setLocale] = useState<Locale>(initialLocale)
  const copy = dictionaries[locale]
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState(false)
  const dialog = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const saved = readLocaleCookie(initialLocale)
    setLocale(saved)
    setMessages([{ role: 'assistant', text: dictionaries[saved].conciergeGreeting }])
  }, [initialLocale])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, pending])

  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement
    dialog.current?.querySelector<HTMLElement>('button,input')?.focus()
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
      if (event.key === 'Tab' && dialog.current) {
        const focusable = [...dialog.current.querySelectorAll<HTMLElement>('button,input,a')]
        if (!focusable.length) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }
    addEventListener('keydown', key)
    return () => {
      removeEventListener('keydown', key)
      previous?.focus()
    }
  }, [open])

  async function send(text: string) {
    if (!text.trim() || pending) return
    const next: ChatMessage[] = [...messages, { role: 'user', text }]
    setMessages(next)
    setDraft('')
    setPending(true)
    setError(false)
    try {
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale, messages: next.slice(-8) }),
      })
      const result = await response.json()
      if (!response.ok || !result.reply) throw new Error()
      setMessages([
        ...next,
        {
          role: 'assistant',
          text: result.reply,
          suggestions: Array.isArray(result.suggestions) ? result.suggestions : undefined,
          roomCards: Array.isArray(result.roomCards) ? result.roomCards : undefined,
        },
      ])
    } catch {
      setError(true)
    } finally {
      setPending(false)
    }
  }

  return (
    <>
      {!open && (
        <button className="concierge-launcher" onClick={() => setOpen(true)} aria-label={copy.conciergeOpen}>
          <MessageCircle />
          <span>PML Hotel</span>
        </button>
      )}
      {open && (
        <div className="concierge-backdrop">
          <div className="concierge" ref={dialog} role="dialog" aria-modal="true" aria-label="PML Hotel">
            <header>
              <div>
                <strong>PML Hotel</strong>
                <span>
                  <i /> {copy.conciergeOnline}
                </span>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label={copy.conciergeClose}>
                <X />
              </button>
            </header>
            <div className="messages" aria-live="polite">
              {messages.map((message, i) => (
                <div key={i} className={`concierge-msg-row concierge-msg-row--${message.role}`}>
                  <p className={`concierge-bubble concierge-bubble--${message.role}`}>
                    {message.text}
                  </p>
                  {i === 0 && message.role === 'assistant' && (
                    <div className="concierge-suggestions">
                      <div className="concierge-suggestions-label">
                        <Sparkles size={13} />
                        <span>{locale === 'vi' ? 'Gợi ý câu hỏi phổ biến:' : 'Popular inquiries:'}</span>
                      </div>
                      <div className="concierge-grid">
                        {conciergeSuggestions[locale].map((s) => {
                          const Icon = s.icon
                          return (
                            <button
                              key={s.id}
                              type="button"
                              className="concierge-card"
                              onClick={() => send(s.prompt)}
                              disabled={pending}
                            >
                              <div className="concierge-card__icon">
                                <Icon size={16} />
                              </div>
                              <div className="concierge-card__text">
                                <span className="concierge-card__title">{s.title}</span>
                                <span className="concierge-card__desc">{s.desc}</span>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                  {message.role === 'assistant' && message.roomCards && message.roomCards.length > 0 && (
                    <div className="concierge-rooms">
                      <div className="concierge-rooms-label">
                        <Building2 size={12} />
                        <span>{locale === 'vi' ? 'Hạng phòng gợi ý đặt ngay:' : 'Rooms available to book:'}</span>
                      </div>
                      <div className="concierge-rooms-list">
                        {message.roomCards.map((card) => (
                          <div key={card.id} className="concierge-room-card">
                            {card.imageUrl && (
                              <div className="concierge-room-card__img">
                                <img src={card.imageUrl} alt={card.name} />
                                <span className="concierge-room-card__badge">
                                  {card.branchName.replace('PML Hotel ', '')}
                                </span>
                              </div>
                            )}
                            <div className="concierge-room-card__body">
                              <div className="concierge-room-card__header">
                                <h4 className="concierge-room-card__title">
                                  {locale === 'en' && card.nameEn ? card.nameEn : card.name}
                                </h4>
                                <div className="concierge-room-card__price">
                                  <strong>{formatPrice(card.priceVnd)}</strong>
                                  <small>/ {locale === 'en' ? 'night' : 'đêm'}</small>
                                </div>
                              </div>
                              {(card.sizeSqm || card.capacity) && (
                                <p className="concierge-room-card__meta">
                                  {card.sizeSqm ? `${card.sizeSqm} m²` : ''}
                                  {card.sizeSqm && card.capacity ? ' · ' : ''}
                                  {card.capacity || ''}
                                </p>
                              )}
                              <div className="concierge-room-card__actions">
                                <button
                                  type="button"
                                  className="concierge-room-card__book-btn"
                                  onClick={() => {
                                    setOpen(false)
                                    router.push(card.bookingUrl)
                                  }}
                                >
                                  <CalendarCheck size={13} />
                                  <span>{locale === 'vi' ? 'Đặt phòng này' : 'Book this room'}</span>
                                </button>
                                <Link
                                  href={card.detailUrl}
                                  className="concierge-room-card__detail-link"
                                  onClick={() => setOpen(false)}
                                >
                                  {locale === 'vi' ? 'Xem phòng' : 'View room'} →
                                </Link>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {i > 0 && message.role === 'assistant' && message.suggestions && message.suggestions.length > 0 && (
                    <div className="concierge-followups">
                      <div className="concierge-followups-label">
                        <Sparkles size={12} />
                        <span>{locale === 'vi' ? 'Gợi ý câu hỏi liên quan:' : 'Related questions:'}</span>
                      </div>
                      <div className="concierge-followups-list">
                        {message.suggestions.map((suggestion, sIdx) => (
                          <button
                            key={sIdx}
                            type="button"
                            className="concierge-followup-pill"
                            onClick={() => send(suggestion)}
                            disabled={pending}
                          >
                            <span>{suggestion}</span>
                            <ChevronRight size={13} className="concierge-followup-icon" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {pending && <p className="concierge-bubble concierge-bubble--assistant typing">{copy.conciergeTyping}</p>}
              {error && (
                <div className="assistant error">
                  {copy.conciergeRetry}{' '}
                  <button type="button" onClick={() => send(messages.at(-1)?.text ?? '')}>
                    {copy.conciergeRetryBtn}
                  </button>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <p className="handoff">
              {copy.conciergeHandoff}{' '}
              <a href={`tel:${siteConfig.hotline.replace(/\s/g, '')}`}>{copy.conciergeCall}</a> · <a href={siteConfig.zalo}>Zalo</a>
            </p>
            <form
              onSubmit={(event) => {
                event.preventDefault()
                send(draft)
              }}
            >
              <input value={draft} onChange={(event) => setDraft(event.target.value)} aria-label={copy.conciergePlaceholder} placeholder={copy.conciergePlaceholder} />
              <button type="submit" aria-label={copy.conciergeSend}>
                {copy.conciergeSend}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
