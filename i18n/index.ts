import { en } from './en'
import { vi } from './vi'
import type { Locale } from '@/config/site'

export const dictionaries = { vi, en }
export function getDictionary(locale: Locale) { return dictionaries[locale] }
