'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowUp, CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, Menu, MessageCircle, Phone, X } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { siteConfig, type Locale } from '@/config/site'
import { dictionaries } from '@/i18n'
import { quickReplies } from '@/data/assistant'

function readLocaleCookie(fallback: Locale): Locale {
  if (typeof document === 'undefined') return fallback
  const match = document.cookie.match(/(?:^|; )pml-locale=(en|vi)(?:;|$)/)
  return match?.[1] === 'en' || match?.[1] === 'vi' ? match[1] : fallback
}

function setLocaleCookie(locale: Locale) {
  document.cookie = `pml-locale=${locale}; path=/; max-age=31536000; samesite=lax`
  document.documentElement.lang = locale
}

export function Header({ initialLocale = 'vi' }: { initialLocale?: Locale; solid?: boolean }) {
  const [locale, setLocale] = useState<Locale>(initialLocale)
  const [open, setOpen] = useState(false)
  const copy = dictionaries[locale]

  useEffect(() => {
    const saved = readLocaleCookie(initialLocale)
    if (saved !== locale) setLocale(saved)
    document.documentElement.lang = saved
  }, [initialLocale])

  return (
    <header className="site-header is-compact">
      <Link href="/" className="wordmark" aria-label={`${copy.home} ${siteConfig.name}`}>
        {siteConfig.name}
      </Link>
      <nav className="desktop-nav" aria-label={copy.navAria}>
        {siteConfig.nav.map((item) => (
          <Link key={item.key} href={item.href} onClick={() => setOpen(false)}>
            {copy.nav[item.key as keyof typeof copy.nav]}
          </Link>
        ))}
      </nav>
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
      <AnimatePresence>
        {open && (
          <motion.nav
            className="mobile-menu"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            {siteConfig.nav.map((item) => (
              <Link key={item.key} href={item.href} onClick={() => setOpen(false)}>
                {copy.nav[item.key as keyof typeof copy.nav]}
              </Link>
            ))}
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
      initial={reduced ? false : { opacity: 0, y: 18 }}
      whileInView={reduced ? {} : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.55 }}
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

export function Concierge({ initialLocale = 'vi' }: { initialLocale?: Locale }) {
  const [locale, setLocale] = useState<Locale>(initialLocale)
  const copy = dictionaries[locale]
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<{ role: 'assistant' | 'user'; text: string }[]>([])
  const [draft, setDraft] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState(false)
  const dialog = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const saved = readLocaleCookie(initialLocale)
    setLocale(saved)
    setMessages([{ role: 'assistant', text: dictionaries[saved].conciergeGreeting }])
  }, [initialLocale])

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
    const next = [...messages, { role: 'user' as const, text }]
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
      setMessages([...next, { role: 'assistant', text: result.reply }])
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
          <span>PML Concierge</span>
        </button>
      )}
      {open && (
        <div className="concierge-backdrop">
          <div className="concierge" ref={dialog} role="dialog" aria-modal="true" aria-label="PML Concierge">
            <header>
              <div>
                <strong>PML Concierge</strong>
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
                <p key={i} className={message.role}>
                  {message.text}
                </p>
              ))}
              {pending && <p className="assistant typing">{copy.conciergeTyping}</p>}
              {error && (
                <div className="assistant error">
                  {copy.conciergeRetry}{' '}
                  <button type="button" onClick={() => send(messages.at(-1)?.text ?? '')}>
                    {copy.conciergeRetryBtn}
                  </button>
                </div>
              )}
            </div>
            <div className="quick-replies">
              {quickReplies.map((reply) => (
                <button key={reply.id} type="button" onClick={() => send(reply.prompt)}>
                  {reply.label}
                </button>
              ))}
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
