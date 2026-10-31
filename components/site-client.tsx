'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowUp, CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, Menu, MessageCircle, Minus, Phone, Plus, X } from 'lucide-react'
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
  return <header className={`site-header ${compact ? 'is-compact' : ''}`}>
    <Link href="/" className="wordmark" aria-label="Trang chủ PML Hotel">{siteConfig.name}</Link>
    <nav className="desktop-nav" aria-label="Điều hướng chính">{siteConfig.nav.map((item) => <Link key={item.key} href={item.href}>{copy.nav[item.key as keyof typeof copy.nav]}</Link>)}</nav>
    <div className="header-actions">
      <div className="language-toggle" aria-label="Ngôn ngữ">{(['vi','en'] as const).map((item, i) => <span key={item}>{i > 0 && ' | '}<button aria-pressed={locale === item} onClick={() => { document.cookie = `pml-locale=${item}; path=/; max-age=31536000; samesite=lax`; document.documentElement.lang = item; setLocale(item) }}>{item.toUpperCase()}</button></span>)}</div>
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
  const [open, setOpen] = useState(false)
  const [guests, setGuests] = useState(2)
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const sheet = useRef<HTMLDivElement>(null)
  const today = new Date().toISOString().slice(0, 10)

  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement
    document.body.style.overflow = 'hidden'
    sheet.current?.querySelector<HTMLElement>('button,select,input')?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
      if (event.key !== 'Tab' || !sheet.current) return
      const focusable = [...sheet.current.querySelectorAll<HTMLElement>('button,select,input')]
      const first = focusable[0]
      const last = focusable.at(-1)
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
    }
    addEventListener('keydown', onKeyDown)
    return () => { document.body.style.overflow = ''; removeEventListener('keydown', onKeyDown); previous?.focus() }
  }, [open])

  function GuestStepper() {
    return <div className="guest-stepper"><button type="button" onClick={() => setGuests((value) => Math.max(1, value - 1))} aria-label="Giảm số khách"><Minus /></button><output aria-live="polite">{guests}</output><button type="button" onClick={() => setGuests((value) => Math.min(8, value + 1))} aria-label="Tăng số khách"><Plus /></button><input type="hidden" name="guests" value={guests} /></div>
  }
  const fields = <><label>Cơ sở<select name="branchId">{branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.shortName}</option>)}</select></label><label>Nhận phòng<input name="checkIn" type="date" min={today} value={checkIn} onChange={(event) => { setCheckIn(event.target.value); if (checkOut && event.target.value >= checkOut) setCheckOut('') }} required /></label><label>Trả phòng<input name="checkOut" type="date" min={checkIn || today} value={checkOut} onChange={(event) => setCheckOut(event.target.value)} required /></label><label>Khách<GuestStepper /></label></>

  return <><form className="booking-bar" action="/dat-phong">{fields}<button className="button button-dark"><CalendarDays /> Kiểm tra phòng</button></form>
    <nav className="mobile-actions" aria-label="Hành động nhanh"><a href={`tel:${siteConfig.hotline.replace(/\s/g, '')}`}><Phone />Gọi</a><a href={siteConfig.zalo}><MessageCircle />Zalo</a><button type="button" onClick={() => setOpen(true)}><CalendarDays />Đặt phòng</button></nav>
    <AnimatePresence>{open && <motion.div className="booking-sheet-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false) }}><motion.div ref={sheet} className="booking-sheet" role="dialog" aria-modal="true" aria-labelledby="booking-sheet-title" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 320 }}><header><div><p className="eyebrow ink">Yêu cầu giữ chỗ</p><h2 id="booking-sheet-title">Đặt phòng</h2></div><button type="button" onClick={() => setOpen(false)} aria-label="Đóng form đặt phòng"><X /></button></header><form action="/dat-phong">{fields}<button className="button button-dark">Tiếp tục đặt phòng</button></form><small>Không thu thập thông tin thẻ. Đội ngũ PML sẽ xác nhận tình trạng phòng.</small></motion.div></motion.div>}</AnimatePresence>
  </>
}

export function FloatingActions() {
  const [visible, setVisible] = useState(false)
  useEffect(() => { const listener = () => setVisible(scrollY > 500); addEventListener('scroll', listener, { passive: true }); return () => removeEventListener('scroll', listener) }, [])
  return <div className="floating-actions"><a href={`tel:${siteConfig.hotline.replace(/\s/g, '')}`} aria-label="Gọi khách sạn"><Phone /></a><a href={siteConfig.zalo} aria-label="Nhắn Zalo"><MessageCircle /></a>{visible && <button aria-label="Lên đầu trang" onClick={() => scrollTo({ top: 0, behavior: 'smooth' })}><ArrowUp /></button>}</div>
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
      if (event.key === 'ArrowLeft') setActive((value) => value === null ? null : (value - 1 + images.length) % images.length)
      if (event.key === 'ArrowRight') setActive((value) => value === null ? null : (value + 1) % images.length)
      if (event.key !== 'Tab' || !dialog.current) return
      const buttons = [...dialog.current.querySelectorAll<HTMLElement>('button')]
      const first = buttons[0]
      const last = buttons.at(-1)
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
    }
    addEventListener('keydown', onKeyDown)
    return () => { document.body.style.overflow = ''; removeEventListener('keydown', onKeyDown); previous?.focus() }
  }, [active, images.length])

  return <><div className="room-gallery">{images.map((image, index) => <button key={image} type="button" onClick={() => setActive(index)} aria-label={`Mở ảnh ${index + 1} của ${roomName}`}><Image src={image} alt={`${roomName}, ảnh ${index + 1}`} fill priority={index === 0} sizes={index === 0 ? '(max-width: 900px) 100vw, 66vw' : '(max-width: 900px) 50vw, 34vw'} /></button>)}</div>
    {active !== null && <div className="lightbox" ref={dialog} role="dialog" aria-modal="true" aria-label={`Thư viện ảnh ${roomName}`}><button className="lightbox-close" onClick={() => setActive(null)} aria-label="Đóng thư viện ảnh"><X /></button><button className="lightbox-prev" onClick={() => setActive((active - 1 + images.length) % images.length)} aria-label="Ảnh trước"><ChevronLeft /></button><div className="lightbox-image"><Image src={images[active]} alt={`${roomName}, ảnh lớn ${active + 1}`} fill sizes="100vw" priority /></div><button className="lightbox-next" onClick={() => setActive((active + 1) % images.length)} aria-label="Ảnh tiếp theo"><ChevronRight /></button><p aria-live="polite">{active + 1} / {images.length}</p></div>}
  </>
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
      <p className="handoff">Cần người hỗ trợ? <a href={`tel:${siteConfig.hotline.replace(/\s/g, '')}`}>Gọi ngay</a> · <a href={siteConfig.zalo}>Zalo</a></p>
      <form onSubmit={(event) => { event.preventDefault(); send(draft) }}><input value={draft} onChange={(event) => setDraft(event.target.value)} aria-label="Tin nhắn" placeholder="Hỏi PML Concierge…" /><button aria-label="Gửi tin nhắn">Gửi</button></form>
    </div></div>}
  </>
}
