'use client'

import { useEffect, useId, useRef, useState } from 'react'
import type { Locale } from '@/lib/messages'

const options: { id: Locale; label: string }[] = [
  { id: 'en', label: 'ENG' },
  { id: 'vi', label: 'VIE' },
  { id: 'zh', label: 'CHN' },
]

function LocaleFlag({ id }: { id: Locale }) {
  const clipId = useId().replace(/:/g, '')

  if (id === 'vi') {
    return (
      <svg viewBox="0 0 24 16" className="h-4 w-6 shrink-0" aria-hidden="true">
        <rect width="24" height="16" fill="#DA251D" />
        <polygon fill="#FF0" points="12,2.2 13.6,6.8 18.4,6.8 14.5,9.6 16,14.2 12,11.4 8,14.2 9.5,9.6 5.6,6.8 10.4,6.8" />
      </svg>
    )
  }

  if (id === 'zh') {
    return (
      <svg viewBox="0 0 30 20" className="h-4 w-6 shrink-0" aria-hidden="true">
        <rect width="30" height="20" fill="#DE2910" />
        <polygon fill="#FFDE00" points="6,2.2 7.1,5.4 10.5,5.4 7.8,7.4 8.8,10.6 6,8.6 3.2,10.6 4.2,7.4 1.5,5.4 4.9,5.4" />
        <polygon fill="#FFDE00" points="11.2,1.6 11.6,2.6 12.6,2.6 11.8,3.2 12.1,4.2 11.2,3.6 10.3,4.2 10.6,3.2 9.8,2.6 10.8,2.6" />
        <polygon fill="#FFDE00" points="13.2,3.8 13.6,4.8 14.6,4.8 13.8,5.4 14.1,6.4 13.2,5.8 12.3,6.4 12.6,5.4 11.8,4.8 12.8,4.8" />
        <polygon fill="#FFDE00" points="13.2,7 13.6,8 14.6,8 13.8,8.6 14.1,9.6 13.2,9 12.3,9.6 12.6,8.6 11.8,8 12.8,8" />
        <polygon fill="#FFDE00" points="11.2,9.2 11.6,10.2 12.6,10.2 11.8,10.8 12.1,11.8 11.2,11.2 10.3,11.8 10.6,10.8 9.8,10.2 10.8,10.2" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 60 30" className="h-4 w-6 shrink-0" aria-hidden="true">
      <clipPath id={clipId}>
        <rect width="60" height="30" />
      </clipPath>
      <g clipPath={`url(#${clipId})`}>
        <rect width="60" height="30" fill="#012169" />
        <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="8" />
        <path d="M0,0 L60,30 M60,0 L0,30" stroke="#C8102E" strokeWidth="4" />
        <path d="M30,0 V30 M0,15 H60" stroke="#fff" strokeWidth="14" />
        <path d="M30,0 V30 M0,15 H60" stroke="#C8102E" strokeWidth="8" />
      </g>
    </svg>
  )
}

export function LanguageMenu({ locale, onChange }: { locale: Locale; onChange: (locale: Locale) => void }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonId = useId()
  const menuId = useId()
  const current = options.find((item) => item.id === locale) ?? options[0]

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div ref={rootRef} className="relative">
      <button
        id={buttonId}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2 px-2 py-2 text-base font-medium tracking-wide"
      >
        <LocaleFlag id={current.id} />
        {current.label}
      </button>
      {open && (
        <div
          id={menuId}
          role="menu"
          aria-labelledby={buttonId}
          className="absolute right-0 top-[calc(100%+4px)] z-50 min-w-[7.75rem] border border-white/10 bg-[#1f1c19] py-1 shadow-xl"
        >
          {options.map((item) => (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              onClick={() => {
                onChange(item.id)
                setOpen(false)
              }}
              className={`flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-base font-medium text-white select-none transition hover:bg-[#c89d66] hover:text-[#211b15] ${item.id === locale ? 'bg-[#c89d66] text-[#211b15]' : ''}`}
            >
              <LocaleFlag id={item.id} />
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
