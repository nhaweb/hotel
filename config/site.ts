import { branches } from '@/data/branches'

export type NavSubItem = {
  key: string
  labelVi: string
  labelEn: string
  href: string
  descVi?: string
  descEn?: string
}

export type NavItem = {
  key: string
  labelVi: string
  labelEn: string
  href: string
  items?: NavSubItem[]
}

export const navigationMenu: NavItem[] = [
  {
    key: 'overview',
    labelVi: 'Tổng quan',
    labelEn: 'Overview',
    href: '/#experience',
    items: [
      { key: 'about', labelVi: 'Về chúng tôi', labelEn: 'About us', href: '/#experience', descVi: 'Triết lý lưu trú & phong cách sống boutique', descEn: 'Our story & hospitality ethos' },
      { key: 'location', labelVi: 'Vị trí', labelEn: 'Location', href: '/#location', descVi: '3 cơ sở đắc địa ngay trung tâm Quận 1', descEn: '3 prime addresses in District 1' },
    ],
  },
  {
    key: 'rooms',
    labelVi: 'Phòng Nghỉ',
    labelEn: 'Accommodations',
    href: '/#rooms',
    items: [
      { key: 'all-rooms', labelVi: 'Tất cả phòng nghỉ', labelEn: 'All Rooms & Suites', href: '/#rooms', descVi: '12 hạng phòng tiêu chuẩn cao cấp', descEn: '12 boutique rooms & suites' },
      { key: 'dong-du', labelVi: 'PML Đông Du Edition', labelEn: 'Dong Du Edition', href: '/co-so/dong-du', descVi: 'Sát phố đi bộ Nguyễn Huệ & Nhà hát TP', descEn: 'Near Nguyen Hue & Opera House' },
      { key: 'onsen', labelVi: 'PML Onsen Lounge', labelEn: 'Onsen Lounge', href: '/co-so/onsen-hai-ba-trung', descVi: 'Bể khoáng nóng Nhật Bản & xông hơi', descEn: 'Japanese hot springs & salt sauna' },
      { key: 'central-park', labelVi: 'PML Central Park', labelEn: 'Central Park', href: '/co-so/central-park', descVi: 'View công viên & Jacuzzi sân thượng', descEn: 'Park view & rooftop jacuzzi' },
    ],
  },
  {
    key: 'dining',
    labelVi: 'Nhà Hàng/Bar',
    labelEn: 'Dining & Bar',
    href: '/#amenities',
    items: [
      { key: 'bar', labelVi: 'Quầy bar', labelEn: 'Rooftop Bar', href: '/#amenities', descVi: 'Sky Bar & cocktail hoàng hôn 360° Sài Gòn', descEn: 'Sky bar with 360° Saigon sunset views' },
      { key: 'cafe', labelVi: 'Quầy Cafe', labelEn: 'Coffee & Tea House', href: '/#amenities', descVi: 'Cà phê phin thủ công & tiệc trà chiều', descEn: 'Artisanal coffee & afternoon tea' },
    ],
  },
  {
    key: 'amenities',
    labelVi: 'Tiện Nghi',
    labelEn: 'Amenities',
    href: '/#amenities',
    items: [
      { key: 'pool', labelVi: 'Hồ bơi', labelEn: 'Pool & Jacuzzi', href: '/#amenities', descVi: 'Hồ bơi outdoor thư giãn & Jacuzzi tầng thượng', descEn: 'Outdoor pool & rooftop jacuzzi' },
      { key: 'fitness', labelVi: 'Fitness', labelEn: 'Fitness Studio', href: '/#amenities', descVi: 'Phòng gym hiện đại & thảm yoga miễn phí', descEn: 'Modern gym & cardio equipment' },
      { key: 'onsen-bath', labelVi: 'Onsen khoáng nóng', labelEn: 'Japanese Onsen', href: '/#amenities', descVi: 'Khoáng 40°C & phòng xông đá muối Himalayan', descEn: 'Mineral bath 40°C & sauna' },
    ],
  },
  {
    key: 'offers',
    labelVi: 'Ưu Đãi',
    labelEn: 'Offers',
    href: '/#offers',
    items: [
      { key: 'room-offers', labelVi: 'Ưu đãi phòng', labelEn: 'Room Offers', href: '/#offers', descVi: 'Tặng trà chiều, giảm 15% staycation & dài ngày', descEn: 'Free tea set, 15% off staycation' },
      { key: 'dining-offers', labelVi: 'Ưu đãi nhà hàng', labelEn: 'Dining Offers', href: '/#offers', descVi: 'Giảm 20% menu cocktail & trà chiều đón khách', descEn: '20% off cocktail menu & afternoon tea' },
    ],
  },
]

export const siteConfig = {
  name: 'PML Hotel',
  tagline: { vi: 'Lưu trú vì cảm xúc.', en: 'Stay for the feeling.' },
  description: 'Khách sạn boutique & lifestyle tại trung tâm Quận 1, TP. Hồ Chí Minh.',
  url: 'https://hotel-gamma-pied.vercel.app',
  hotline: '0789 780 167',
  zalo: 'https://zalo.me/pmlhotel',
  email: 'stay@pmlhotel.com',
  social: { facebook: '#', instagram: '#', tiktok: '#', youtube: '#' },
  nav: [
    { key: 'overview', href: '/#experience' },
    { key: 'rooms', href: '/#rooms' },
    { key: 'dining', href: '/#amenities' },
    { key: 'amenities', href: '/#amenities' },
    { key: 'offers', href: '/#offers' },
  ],
  navigationMenu,
  branches,
} as const

export type Locale = 'vi' | 'en'
