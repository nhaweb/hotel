'use client'

import type { Locale } from '@/config/site'

export function LanguageMenu({ locale, onChange }: { locale: Locale; onChange: (locale: Locale) => void }) {
  function choose(next: Locale) {
    document.cookie = `pml-locale=${next}; path=/; max-age=31536000; samesite=lax`
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
