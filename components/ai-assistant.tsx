'use client'

import { useEffect, useId, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { messages, type Locale } from '@/lib/messages'

function AssistantMark() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className="size-7">
      <path fill="currentColor" d="M8 8.5h11.5a4.5 4.5 0 0 1 4.5 4.5v5.2a4.5 4.5 0 0 1-4.5 4.5H14l-4.2 3.1a.8.8 0 0 1-1.3-.7V22.7A4.5 4.5 0 0 1 4 18.2v-5.2A4.5 4.5 0 0 1 8 8.5Z" />
      <path fill="#fdfbf7" d="M16.2 6.2 17.1 8.6l2.4.9-2.4.9-.9 2.4-.9-2.4-2.4-.9 2.4-.9.9-2.4Z" />
    </svg>
  )
}

export function AiAssistant({ locale }: { locale: Locale }) {
  const [open, setOpen] = useState(false)
  const copy = messages[locale].assistant
  const panelId = useId()

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open])

  return (
    <div className="fixed right-4 bottom-20 z-50 flex flex-col items-end gap-3 sm:right-6 sm:bottom-6">
      <AnimatePresence>
        {open && (
          <motion.section
            id={panelId}
            role="dialog"
            aria-label={copy.title}
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="w-[min(22rem,calc(100vw-2rem))] overflow-hidden border border-[#eadcca] bg-[#fdfbf7] text-[#262422] shadow-2xl"
          >
            <header className="flex items-center justify-between bg-[#28231f] px-4 py-3 text-white">
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center bg-[#c89d66] text-[#211b15]">
                  <AssistantMark />
                </span>
                <div>
                  <p className="text-sm font-semibold">{copy.title}</p>
                  <p className="text-[11px] tracking-wide text-white/60">PML Hotel</p>
                </div>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="flex size-8 items-center justify-center text-white/80 hover:text-white">
                <X className="size-4" />
              </button>
            </header>
            <div className="px-4 py-5">
              <p className="bg-[#f4eee6] px-4 py-3 text-sm leading-6">{copy.greeting}</p>
              <p className="mt-4 text-xs tracking-wide text-[#9c7551]">{copy.soon}</p>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-3 bg-[#28231f] py-2 pr-2 pl-4 text-white shadow-xl ring-1 ring-[#c89d66]/70 transition hover:bg-[#3a332c]"
      >
        <span className="text-xs font-semibold tracking-[0.14em] uppercase">{copy.label}</span>
        <span className="flex size-11 items-center justify-center bg-[#c89d66] text-[#211b15]">
          {open ? <X className="size-5" /> : <AssistantMark />}
        </span>
      </button>
    </div>
  )
}
