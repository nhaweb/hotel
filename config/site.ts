import { branches } from '@/data/branches'

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
