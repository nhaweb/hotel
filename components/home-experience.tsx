'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Phone,
  Sparkles,
} from 'lucide-react'
import type { Locale } from '@/config/site'
import type { Room } from '@/data/rooms'
import type { Branch } from '@/data/branches'
import type { Review } from '@/data/reviews'
import { offers as rawOffers, type Offer } from '@/data/offers'
import { Map as HotelMap } from '@/components/map/Map'
import { amenityImages, blur, branchImages, galleryMoments, offerImages, roomCover } from '@/lib/media'
import { formatPrice } from '@/lib/format-price'
import { dictionaries } from '@/i18n'

type RoomsProps = {
  rooms: Room[]
  branches: Branch[]
  locale: Locale
}

export function RoomsCarousel({ rooms, branches, locale }: RoomsProps) {
  const copy = dictionaries[locale]
  const [index, setIndex] = useState(0)
  const [perPage, setPerPage] = useState(3)

  useEffect(() => {
    const sync = () => setPerPage(window.innerWidth < 900 ? 1 : window.innerWidth < 1200 ? 2 : 3)
    sync()
    window.addEventListener('resize', sync)
    return () => window.removeEventListener('resize', sync)
  }, [])

  const maxIndex = Math.max(0, rooms.length - perPage)
  const visible = rooms.slice(index, index + perPage)

  useEffect(() => {
    setIndex((value) => Math.min(value, maxIndex))
  }, [maxIndex])

  return (
    <div className="rooms-carousel">
      <div className="rooms-carousel__controls">
        <p>
          {index + 1}–{Math.min(index + perPage, rooms.length)} / {rooms.length}
        </p>
        <div>
          <button type="button" aria-label="Previous rooms" disabled={index === 0} onClick={() => setIndex((value) => Math.max(0, value - 1))}>
            <ChevronLeft />
          </button>
          <button type="button" aria-label="Next rooms" disabled={index >= maxIndex} onClick={() => setIndex((value) => Math.min(maxIndex, value + 1))}>
            <ChevronRight />
          </button>
        </div>
      </div>
      <div
        className="room-grid rooms-carousel__track"
        style={{ gridTemplateColumns: `repeat(${Math.max(visible.length, 1)}, minmax(0, 1fr))` }}
      >
        {visible.map((room) => {
          const name = locale === 'en' ? room.nameEn : room.name
          const description = locale === 'en' ? room.descriptionEn : room.description
          const view = locale === 'en' ? room.viewEn : room.view
          return (
            <article className="room-card" key={room.id}>
              <div className="image-wrap">
                <Image src={roomCover(room.id)} alt={`${name}, ${view}`} fill sizes="(max-width: 768px) 100vw, 33vw" placeholder="blur" blurDataURL={blur} />
                <span className="room-card__badge">{room.category}</span>
              </div>
              <div>
                <p>{branches.find((b) => b.id === room.branchId)?.shortName}</p>
                <h3>{name}</h3>
                <p>{description}</p>
                <ul>
                  <li>{room.sizeSqm} m²</li>
                  <li>{room.bedType}</li>
                  <li>{view}</li>
                </ul>
                <footer>
                  <strong>
                    {copy.from} {formatPrice(room.priceVnd)} <small>{copy.perNight}</small>
                  </strong>
                  <Link href={`/phong/${room.id.replace('room-', '')}`}>{copy.viewRoom} →</Link>
                </footer>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}

/* =========================================================================
   Amenities Experience (Tiện Nghi) — Point 3 with Category Tabs + Form
   ========================================================================= */

type AmenityItem = {
  id: string
  name: string
  nameEn: string
  category: 'pool-gym' | 'dining-bar' | 'wellness'
  categoryNameVi: string
  categoryNameEn: string
  hours: string
  branch: string
  detail: string
  detailEn: string
  features: string[]
  featuresEn: string[]
  imageKey: string
}

const AMENITY_DATA: AmenityItem[] = [
  {
    id: 'pool',
    name: 'Hồ Bơi Outdoor & Jacuzzi Rooftop',
    nameEn: 'Outdoor Pool & Rooftop Jacuzzi',
    category: 'pool-gym',
    categoryNameVi: 'Hồ bơi & Thư giãn',
    categoryNameEn: 'Pool & Relaxation',
    hours: '06:00 - 22:00',
    branch: 'PML Central Park & Rooftop',
    detail: 'Hồ bơi nước ấm ngoài trời nhìn thẳng ra công viên Lê Văn Tám xanh mát, kết hợp bồn ngâm Jacuzzi thư giãn.',
    detailEn: 'Heated outdoor swimming pool overlooking lush Le Van Tam park with a sunset jacuzzi tub.',
    features: ['Bể bơi nước ấm điều nhiệt', 'Jacuzzi massage ngắm hoàng hôn', 'Khăn tắm & nước khoáng miễn phí'],
    featuresEn: ['Temperature-controlled water', 'Sunset massage jacuzzi', 'Complimentary towels & water'],
    imageKey: 'amenity-pool',
  },
  {
    id: 'fitness',
    name: 'Phòng Gym & Yoga Studio',
    nameEn: 'Fitness Studio & Yoga Room',
    category: 'pool-gym',
    categoryNameVi: 'Thể thao & Sức khỏe',
    categoryNameEn: 'Fitness & Health',
    hours: '05:30 - 23:00',
    branch: 'PML Central Park',
    detail: 'Trang thiết bị cardio nhập khẩu, máy chạy bộ, máy elip, tạ tự do đa năng và thảm yoga cao cấp.',
    detailEn: 'Premium cardio equipment, treadmills, free weights and yoga mats for daily workout rituals.',
    features: ['Máy chạy bộ & xe đạp elip', 'Tạ tự do đa mức trọng lượng', 'Thảm tập yoga & bóng giãn cơ'],
    featuresEn: ['Treadmills & bikes', 'Multi-weight dumbells', 'Yoga mats & stretch balls'],
    imageKey: 'amenity-gym',
  },
  {
    id: 'onsen',
    name: 'Tổ Hợp Onsen Khoáng Nóng Nhật Bản',
    nameEn: 'Japanese Mineral Onsen Complex',
    category: 'wellness',
    categoryNameVi: 'Khoáng nóng & Xông hơi',
    categoryNameEn: 'Onsen & Sauna',
    hours: '06:00 - 22:00',
    branch: 'PML & Onsen Lounge',
    detail: 'Bể khoáng nóng 40°C, bể ngâm lạnh 18°C, phòng xông hơi đá muối Himalayan và phòng nghỉ ngơi tatami.',
    detailEn: '40°C mineral bath, 18°C cold plunge, Himalayan rock salt dry sauna and tatami rest area.',
    features: ['Khoáng thiên nhiên 40°C', 'Xông hơi đá muối Himalayan', 'Trà gạo lứt & áo Yukata'],
    featuresEn: ['Natural 40°C mineral water', 'Himalayan salt sauna', 'Roasted brown rice tea & Yukata'],
    imageKey: 'amenity-onsen',
  },
  {
    id: 'bar',
    name: 'Quầy Bar Rooftop & Sky Lounge',
    nameEn: 'Rooftop Bar & Sky Lounge',
    category: 'dining-bar',
    categoryNameVi: 'Nhà Hàng & Bar',
    categoryNameEn: 'Dining & Bar',
    hours: '16:00 - 01:00',
    branch: 'PML Central Park',
    detail: 'Không gian ngắm hoàng hôn 360° Sài Gòn, phục vụ cocktail sáng tạo từ thảo mộc địa phương và rượu vang chọn lọc.',
    detailEn: 'Sunset cocktail bar with 360° panoramic view of District 1 and artisanal herbal concoctions.',
    features: ['Cocktail cảm hứng Sài Gòn', 'View 360° tầng thượng lộng gió', 'Giảm 20% cho khách lưu trú'],
    featuresEn: ['Saigon-inspired craft cocktails', 'Panoramic rooftop deck', '20% off for staying guests'],
    imageKey: 'amenity-rooftop-skybar',
  },
  {
    id: 'cafe',
    name: 'Quầy Cafe & Cà Phê Phin Thủ Công',
    nameEn: 'Coffee House & Artisanal Phin',
    category: 'dining-bar',
    categoryNameVi: 'Nhà Hàng & Bar',
    categoryNameEn: 'Dining & Bar',
    hours: '06:30 - 22:00',
    branch: 'PML Đông Du Edition',
    detail: 'Hạt Arabica Cầu Đất phối Robusta Đắk Lắk rang mộc, pha phin truyền thống hoặc espresso chuẩn vị Ý.',
    detailEn: 'Handcrafted Vietnamese traditional drip phin and authentic Italian espresso blends.',
    features: ['Hạt cà phê nguyên chất Cầu Đất', 'Matcha Nhật Bản & Cacao Bến Tre', 'Bánh nướng tươi mỗi sáng'],
    featuresEn: ['Single-origin Cau Dat beans', 'Japanese matcha & Ben Tre cacao', 'Freshly baked pastries daily'],
    imageKey: 'amenity-cafe',
  },
  {
    id: 'afternoon-tea',
    name: 'Tiệc Trà Chiều Signature',
    nameEn: 'Signature Afternoon Tea',
    category: 'dining-bar',
    categoryNameVi: 'Nhà Hàng & Bar',
    categoryNameEn: 'Dining & Bar',
    hours: '14:30 - 16:30',
    branch: 'Tất cả 3 cơ sở',
    detail: 'Trà hoa hữu cơ hảo hạng, các món bánh ngọt kiểu Pháp, bánh mì kẹp nhẹ và trái cây nhiệt đới.',
    detailEn: 'Organic floral teas accompanied by French fine patisserie, finger sandwiches and seasonal fruits.',
    features: ['02 suất trà hoa thơm ngát', 'Khay bánh 3 tầng cao cấp', 'Tặng kèm khi đặt trực tiếp web'],
    featuresEn: ['2 floral tea pots', '3-tier artisan pastry tower', 'Complimentary for direct website bookings'],
    imageKey: 'amenity-afternoon-tea',
  },
]

export function AmenitiesExperience({ locale }: { locale: Locale }) {
  const [activeTab, setActiveTab] = useState<'all' | 'pool-gym' | 'dining-bar' | 'wellness'>('all')
  const [formSubmitted, setFormSubmitted] = useState(false)
  const [selectedAmenity, setSelectedAmenity] = useState('pool')

  const filtered = useMemo(() => {
    if (activeTab === 'all') return AMENITY_DATA
    return AMENITY_DATA.filter((item) => item.category === activeTab)
  }, [activeTab])

  const tabs = [
    { key: 'all' as const, labelVi: 'Tất cả tiện nghi', labelEn: 'All Amenities' },
    { key: 'pool-gym' as const, labelVi: 'Hồ bơi & Fitness', labelEn: 'Pool & Fitness' },
    { key: 'dining-bar' as const, labelVi: 'Quầy Bar & Cafe', labelEn: 'Dining & Bar' },
    { key: 'wellness' as const, labelVi: 'Onsen & Sức khỏe', labelEn: 'Onsen & Wellness' },
  ]

  return (
    <div className="amenities-container">
      {/* Category Filter Pills */}
      <div className="amenity-tabs" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`amenity-tab-btn ${activeTab === tab.key ? 'is-active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {locale === 'en' ? tab.labelEn : tab.labelVi}
          </button>
        ))}
      </div>

      {/* Grid of Structured Amenity Cards ("cho chữ vào form") */}
      <div className="amenities-form-grid">
        {filtered.map((item) => {
          const imgUrl = amenityImages[item.imageKey] ?? amenityImages['amenity-onsen']
          const name = locale === 'en' ? item.nameEn : item.name
          const desc = locale === 'en' ? item.detailEn : item.detail
          const feats = locale === 'en' ? item.featuresEn : item.features
          const catName = locale === 'en' ? item.categoryNameEn : item.categoryNameVi

          return (
            <article key={item.id} className="amenity-card-box">
              <div className="amenity-card-media">
                <Image src={imgUrl} alt={name} fill sizes="(max-width: 900px) 100vw, 33vw" placeholder="blur" blurDataURL={blur} />
                <span className="amenity-badge">{catName}</span>
                <span className="amenity-hours-badge">
                  <Clock className="w-3.5 h-3.5 mr-1 inline" /> {item.hours}
                </span>
              </div>
              <div className="amenity-card-body">
                <p className="amenity-branch-tag">
                  <MapPin className="w-3.5 h-3.5 inline mr-1 text-[var(--accent-dark)]" />
                  {item.branch}
                </p>
                <h3>{name}</h3>
                <p className="amenity-desc">{desc}</p>
                <ul className="amenity-features-list">
                  {feats.map((feat, i) => (
                    <li key={i}>
                      <Check className="w-3.5 h-3.5 text-[var(--accent-dark)] flex-none" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
                <div className="amenity-card-footer">
                  <a
                    href="#amenity-inquiry-form"
                    className="button button-accent w-full text-center"
                    onClick={() => setSelectedAmenity(item.id)}
                  >
                    {locale === 'en' ? 'Book this experience' : 'Đặt dịch vụ này'}
                  </a>
                </div>
              </div>
            </article>
          )
        })}
      </div>

      {/* Interactive Quick Service Inquiry Form ("cho chữ vào form luôn nha") */}
      <div id="amenity-inquiry-form" className="amenity-quick-form">
        <div className="amenity-quick-form__info">
          <p className="eyebrow ink">{locale === 'en' ? 'Fast Booking' : 'Đặt chỗ nhanh'}</p>
          <h3>{locale === 'en' ? 'Reserve an Amenity or Experience' : 'Đăng Ký Trải Nghiệm Tiện Nghi'}</h3>
          <p>
            {locale === 'en'
              ? 'Select your preferred service and schedule. Our concierge team will confirm within 15 minutes.'
              : 'Quý khách vui lòng chọn dịch vụ và thời gian mong muốn. Đội ngũ lễ tân PML sẽ xác nhận giữ chỗ trong vòng 15 phút.'}
          </p>
          <div className="amenity-perk-row">
            <span>✓ {locale === 'en' ? 'Complimentary for staying guests' : 'Miễn phí cho khách lưu trú'}</span>
            <span>✓ {locale === 'en' ? 'Dedicated lockers & towels' : 'Khăn tắm & đồ dùng chuẩn bị sẵn'}</span>
          </div>
        </div>

        <form
          className="amenity-quick-form__fields"
          onSubmit={async (e) => {
            e.preventDefault()
            const form = new FormData(e.currentTarget)
            setFormSubmitted(true)
            try {
              await fetch('/api/amenities', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  serviceType: selectedAmenity,
                  name: String(form.get('name') || 'Khách trải nghiệm tiện nghi'),
                  phone: String(form.get('phone') || '0789780167'),
                  date: String(form.get('date')),
                  timeSlot: String(form.get('timeSlot')),
                  guests: Number(form.get('guests') || 2),
                }),
              })
            } catch (err) {
              console.error('Amenity submission error:', err)
            }
          }}
        >
          <div className="form-group">
            <label>{locale === 'en' ? 'Service / Amenity' : 'Dịch vụ / Tiện nghi'}</label>
            <select
              name="serviceType"
              value={selectedAmenity}
              onChange={(e) => setSelectedAmenity(e.target.value)}
              required
            >
              <option value="pool">{locale === 'en' ? 'Outdoor Pool & Jacuzzi' : 'Hồ bơi Outdoor & Jacuzzi Rooftop'}</option>
              <option value="fitness">{locale === 'en' ? 'Gym & Fitness Studio' : 'Phòng Gym & Yoga Studio'}</option>
              <option value="onsen">{locale === 'en' ? 'Japanese Mineral Onsen' : 'Onsen Khoáng Nóng Nhật Bản'}</option>
              <option value="bar">{locale === 'en' ? 'Rooftop Bar Sunset Table' : 'Bàn ngắm hoàng hôn Sky Bar'}</option>
              <option value="cafe">{locale === 'en' ? 'Artisanal Coffee Tasting' : 'Thưởng thức Cà phê phin thủ công'}</option>
              <option value="afternoon-tea">{locale === 'en' ? 'Signature Afternoon Tea' : 'Tiệc Trà Chiều Signature'}</option>
            </select>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label>{locale === 'en' ? 'Date' : 'Ngày trải nghiệm'}</label>
              <input name="date" type="date" required defaultValue="2026-11-05" />
            </div>
            <div className="form-group">
              <label>{locale === 'en' ? 'Time slot' : 'Khung giờ'}</label>
              <select name="timeSlot" required defaultValue="17:00 - 19:30 (Hoàng hôn)">
                <option value="07:00 - 09:00">07:00 - 09:00</option>
                <option value="09:00 - 11:30">09:00 - 11:30</option>
                <option value="14:30 - 16:30 (Trà chiều)">14:30 - 16:30 (Trà chiều)</option>
                <option value="17:00 - 19:30 (Hoàng hôn)">17:00 - 19:30 (Hoàng hôn)</option>
                <option value="19:30 - 22:00 (Onsen tối)">19:30 - 22:00 (Onsen tối)</option>
              </select>
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label>{locale === 'en' ? 'Number of Guests' : 'Số lượng khách'}</label>
              <input name="guests" type="number" min="1" max="10" defaultValue="2" required />
            </div>
            <div className="form-group">
              <label>{locale === 'en' ? 'Your Phone / WhatsApp' : 'Số điện thoại / Zalo'}</label>
              <input name="phone" type="tel" placeholder="0789 780 167" defaultValue="0789 780 167" required />
            </div>
          </div>

          <button type="submit" className="button button-dark w-full">
            {locale === 'en' ? 'Confirm Reservation Request' : 'Gửi Yêu Cầu Đặt Chỗ'}
          </button>

          {formSubmitted && (
            <p className="form-success-alert" aria-live="polite">
              ✓ {locale === 'en'
                ? 'Thank you! Your amenity reservation request has been received. Our team will contact you shortly.'
                : 'Đã nhận yêu cầu đặt lịch! Đội ngũ lễ tân PML sẽ liên hệ xác nhận với Quý khách trong 15 phút.'}
            </p>
          )}
        </form>
      </div>
    </div>
  )
}

/* =========================================================================
   Offers Experience (Ưu Đãi) — Point 4 Complete Promotions System
   ========================================================================= */

type OfferExtended = Offer & {
  category: 'rooms' | 'dining' | 'packages'
  badge: string
  badgeEn: string
  perks: string[]
  perksEn: string[]
}

const EXTENDED_OFFERS: OfferExtended[] = [
  {
    id: 'offer-direct-booking',
    name: 'Đặt trực tiếp - Tặng Trà Chiều & Nâng Hạng',
    nameEn: 'Direct Booking - Afternoon Tea & Upgrade',
    category: 'rooms',
    badge: 'ĐẶC QUYỀN WEB',
    badgeEn: 'WEB EXCLUSIVE',
    description: 'Đặt phòng trực tiếp trên website để nhận 2 suất Trà chiều Signature hảo hạng và ưu tiên nâng hạng phòng cao hơn.',
    descriptionEn: 'Book directly via our official website to receive 2 complimentary Signature Afternoon Tea sets and priority room upgrade.',
    priceFromVnd: null,
    conditions: 'Áp dụng cho mọi hạng phòng khi đặt qua website. Không yêu cầu code.',
    valid: 'Áp dụng quanh năm',
    perks: ['Tặng 02 suất Trà chiều Signature', 'Ưu tiên nâng hạng phòng còn trống', 'Check-in sớm từ 12:00 khi có sẵn'],
    perksEn: ['2 complimentary Afternoon Tea sets', 'Priority complimentary room upgrade', 'Early check-in from 12:00 when available'],
  },
  {
    id: 'offer-onsen-weekend',
    name: 'Gói Nghỉ Dưỡng Onsen Cuối Tuần',
    nameEn: 'Onsen Weekend Retreat',
    category: 'packages',
    badge: 'GÓI NGHỈ DƯỠNG',
    badgeEn: 'WELLNESS RETREAT',
    description: 'Trọn gói 2 đêm phòng Onsen Suite, không giới hạn tắm khoáng nóng và xông hơi muối, kèm 1 liệu trình massage 60 phút cho 2 người.',
    descriptionEn: '2-night stay in Onsen Suite with unlimited mineral bath & sauna, plus a 60-minute massage for two.',
    priceFromVnd: 5200000,
    conditions: 'Áp dụng Thứ 6 đến Chủ Nhật. Đặt trước tối thiểu 3 ngày.',
    valid: 'Thứ 6 - Chủ Nhật',
    perks: ['2 đêm Onsen Suite cao cấp', 'Liệu trình massage thư giãn 60 phút', 'Ăn sáng buffet & trà chiều hàng ngày'],
    perksEn: ['2 nights in luxury Onsen Suite', '60-min relaxing body massage', 'Daily gourmet breakfast & afternoon tea'],
  },
  {
    id: 'offer-honeymoon',
    name: 'Gói Trăng Mật & Kỷ Niệm Ngày Cưới',
    nameEn: 'Honeymoon & Romantic Anniversary',
    category: 'packages',
    badge: 'LÃNG MẠN',
    badgeEn: 'ROMANTIC SPECIAL',
    description: 'Trang trí phòng lãng mạn với hoa hồng tươi, bánh kem thiết kế, chai vang nổ khai vị và bữa sáng phục vụ tận giường.',
    descriptionEn: 'Romantic floral setup, custom celebration cake, chilled sparkling wine and breakfast in bed.',
    priceFromVnd: 4400000,
    conditions: 'Thông báo trước 24h để khách sạn chuẩn bị chu đáo.',
    valid: 'Áp dụng quanh năm',
    perks: ['Set hoa tươi & nến trang trí phòng', 'Chai vang nổ thượng hạng & bánh kem', 'Trả phòng muộn đến 15:00'],
    perksEn: ['Fresh roses & candle bedroom decor', 'Chilled sparkling wine & artisan cake', 'Late check-out until 15:00'],
  },
  {
    id: 'offer-proposal',
    name: 'Gói Cầu Hôn Trên Sân Thượng Jacuzzi',
    nameEn: 'Rooftop Proposal & Penthouse Stay',
    category: 'packages',
    badge: 'TRỌN GÓI VIP',
    badgeEn: 'VIP EXPERIENCE',
    description: 'Không gian riêng tư ngắm hoàng hôn trên tầng thượng, hoa tươi nghệ thuật, nhiếp ảnh gia 60 phút và 1 đêm nghỉ Penthouse.',
    descriptionEn: 'Private rooftop sunset setting with artisan flowers, 60-minute photographer and 1 night in Penthouse.',
    priceFromVnd: 8500000,
    conditions: 'Đặt trước 5 ngày. Đội ngũ có phương án dự phòng khi thời tiết xấu.',
    valid: 'Quanh năm',
    perks: ['Setup bàn tiệc riêng ngắm hoàng hôn', 'Nhiếp ảnh gia chuyên nghiệp chụp 60 phút', '1 đêm nghỉ tại Rooftop Jacuzzi Penthouse'],
    perksEn: ['Private sunset rooftop dining setup', '60-min professional photography session', '1 night in Rooftop Jacuzzi Penthouse'],
  },
  {
    id: 'offer-staycation-midweek',
    name: 'Staycation Giữa Tuần - Giảm 15%',
    nameEn: 'Midweek Staycation - 15% Off',
    category: 'rooms',
    badge: 'GIẢM 15%',
    badgeEn: 'SAVE 15%',
    description: 'Nạp năng lượng giữa tuần tại Quận 1 với ưu đãi giảm 15% giá phòng, trả phòng muộn đến 14:00 từ Chủ Nhật đến Thứ 5.',
    descriptionEn: 'Recharge midweek in District 1 with 15% savings and late check-out until 14:00 from Sunday to Thursday.',
    priceFromVnd: 1870000,
    conditions: 'Áp dụng các ngày trong tuần từ Chủ Nhật đến Thứ 5.',
    valid: 'Chủ Nhật - Thứ 5',
    perks: ['Giảm trực tiếp 15% giá phòng', 'Trả phòng muộn đến 14:00', 'Miễn phí sử dụng Onsen hoặc Gym'],
    perksEn: ['Direct 15% discount on room rate', 'Late check-out until 14:00', 'Complimentary Onsen or Gym access'],
  },
  {
    id: 'offer-dining-skybar',
    name: 'Ưu Đãi Sky Bar - Giảm 20% Menu Cocktail',
    nameEn: 'Sky Bar Sunset - 20% Off Cocktails',
    category: 'dining',
    badge: 'ẨM THỰC & BAR',
    badgeEn: 'DINING & BAR',
    description: 'Khách lưu trú tại bất kỳ cơ sở nào của PML Hotel đều được giảm 20% toàn bộ thực đơn đồ uống và món nhắm tại Sky Bar.',
    descriptionEn: 'All in-house guests enjoy a 20% discount on all cocktails, premium wines and tapas at our Sky Bar.',
    priceFromVnd: null,
    conditions: 'Chỉ cần xuất trình thẻ phòng hoặc mã đặt phòng PML.',
    valid: '17:00 - 20:00 hàng ngày',
    perks: ['Giảm 20% cocktail sáng tạo', 'Chỗ ngồi ngắm hoàng hôn đẹp nhất', 'Miễn phí snack khai vị'],
    perksEn: ['20% off craft cocktails', 'Prime sunset viewing seats', 'Complimentary welcome tapas snacks'],
  },
]

export function OffersExperience({ locale }: { locale: Locale }) {
  const [category, setCategory] = useState<'all' | 'rooms' | 'dining' | 'packages'>('all')

  const filteredOffers = useMemo(() => {
    if (category === 'all') return EXTENDED_OFFERS
    return EXTENDED_OFFERS.filter((item) => item.category === category)
  }, [category])

  const tabs = [
    { key: 'all' as const, labelVi: 'Tất cả ưu đãi', labelEn: 'All Offers' },
    { key: 'rooms' as const, labelVi: 'Ưu đãi phòng', labelEn: 'Room Offers' },
    { key: 'dining' as const, labelVi: 'Ưu đãi nhà hàng & Bar', labelEn: 'Dining & Bar' },
    { key: 'packages' as const, labelVi: 'Gói sự kiện & Kỷ niệm', labelEn: 'Celebration Packages' },
  ]

  return (
    <div className="offers-experience-wrapper">
      {/* Category Filter Tabs */}
      <div className="amenity-tabs" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`amenity-tab-btn ${category === tab.key ? 'is-active' : ''}`}
            onClick={() => setCategory(tab.key)}
          >
            {locale === 'en' ? tab.labelEn : tab.labelVi}
          </button>
        ))}
      </div>

      {/* Grid of Complete Offer Cards */}
      <div className="offers-cards-grid">
        {filteredOffers.map((offer) => {
          const banner = offerImages[offer.id] ?? offerImages['offer-direct-booking']
          const name = locale === 'en' ? offer.nameEn : offer.name
          const desc = locale === 'en' ? offer.descriptionEn : offer.description
          const badge = locale === 'en' ? offer.badgeEn : offer.badge
          const perks = locale === 'en' ? offer.perksEn : offer.perks

          return (
            <article key={offer.id} className="offer-luxury-card">
              <div className="offer-luxury-media">
                <Image src={banner} alt={name} fill sizes="(max-width: 900px) 100vw, 33vw" placeholder="blur" blurDataURL={blur} />
                <span className="offer-ribbon">{badge}</span>
                <span className="offer-valid-tag">
                  <CalendarDays className="w-3.5 h-3.5 inline mr-1" />
                  {offer.valid}
                </span>
              </div>
              <div className="offer-luxury-content">
                <h3>{name}</h3>
                <p className="offer-desc">{desc}</p>

                <ul className="offer-perks-list">
                  {perks.map((perk, i) => (
                    <li key={i}>
                      <Check className="w-3.5 h-3.5 text-[var(--accent)] flex-none" />
                      <span>{perk}</span>
                    </li>
                  ))}
                </ul>

                <div className="offer-price-row">
                  {offer.priceFromVnd ? (
                    <div>
                      <small className="block text-xs uppercase opacity-75">{locale === 'en' ? 'Starting from' : 'Giá chỉ từ'}</small>
                      <strong className="text-xl text-[var(--accent)]">{formatPrice(offer.priceFromVnd)}</strong>
                    </div>
                  ) : (
                    <div>
                      <small className="block text-xs uppercase opacity-75">{locale === 'en' ? 'Special Privilege' : 'Đặc quyền đặc biệt'}</small>
                      <strong className="text-lg text-[var(--accent)]">{locale === 'en' ? 'Complimentary Perk' : 'Quà tặng kèm'}</strong>
                    </div>
                  )}

                  <Link
                    href={`/dat-phong?offer=${offer.id}`}
                    className="button button-accent"
                  >
                    {locale === 'en' ? 'Claim offer' : 'Nhận ưu đãi'}
                  </Link>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}

/* =========================================================================
   Location Showcase
   ========================================================================= */

type LocationProps = {
  branches: Branch[]
  locale: Locale
}

export function LocationShowcase({ branches, locale }: LocationProps) {
  const copy = dictionaries[locale]
  return (
    <div className="location-showcase">
      <div className="location-showcase__cards">
        {branches.map((branch) => (
          <article key={branch.id} className="branch-photo-card">
            <div className="branch-photo-card__media">
              <Image src={branchImages[branch.id]} alt={branch.name} fill sizes="(max-width: 900px) 100vw, 40vw" placeholder="blur" blurDataURL={blur} />
            </div>
            <div>
              <p className="eyebrow ink">{branch.shortName}</p>
              <h3>{branch.name}</h3>
              <p>{branch.tagline}</p>
              <p className="branch-photo-card__meta">
                <MapPin /> {branch.address}
              </p>
              <p className="branch-photo-card__meta">
                <a href={`tel:${branch.phone.replace(/\s/g, '')}`} className="branch-meta-call">
                  <Phone /> <span>{branch.phone}</span>
                </a>
              </p>
              <div className="branch-chips">
                {branch.nearby.slice(0, 3).map((place) => (
                  <span key={place.name}>
                    {place.name} · {place.minutes}’
                  </span>
                ))}
              </div>
              <Link href={`/co-so/${branch.slug}`}>{copy.viewBranch} →</Link>
            </div>
          </article>
        ))}
      </div>
      <div className="location-showcase__map">
        <HotelMap branches={branches} locale={locale} />
      </div>
    </div>
  )
}

/* =========================================================================
   Reviews Experience
   ========================================================================= */

type ReviewsProps = {
  reviews: Review[]
  locale: Locale
  note: string
}

export function ReviewsExperience({ reviews, locale, note }: ReviewsProps) {
  const [active, setActive] = useState(0)
  const review = reviews[active]
  const initials = useMemo(() => review.guest.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase(), [review.guest])

  useEffect(() => {
    const timer = setInterval(() => setActive((value) => (value + 1) % reviews.length), 7000)
    return () => clearInterval(timer)
  }, [reviews.length])

  return (
    <div className="reviews-experience">
      <div className="reviews-experience__stage">
        <div className="reviews-experience__intro">
          <div className="reviews-experience__avatar" aria-hidden>
            {initials}
          </div>
          <div>
            <div className="reviews-experience__stars" aria-label="5 / 5">
              ★★★★★
            </div>
            <div className="reviews-experience__meta">
              <strong>{review.guest}</strong>
              <span>{review.origin}</span>
            </div>
          </div>
        </div>
        <blockquote key={review.id}>“{locale === 'en' ? review.textEn : review.text}”</blockquote>
        <p className="reviews-experience__title">{locale === 'en' ? review.titleEn : review.title}</p>
        <div className="reviews-experience__controls">
          <button type="button" aria-label="Previous review" onClick={() => setActive((value) => (value - 1 + reviews.length) % reviews.length)}>
            <ChevronLeft />
          </button>
          <div className="reviews-experience__dots">
            {reviews.map((item, i) => (
              <button key={item.id} type="button" aria-label={`Review ${i + 1}`} aria-current={i === active} className={i === active ? 'is-active' : ''} onClick={() => setActive(i)} />
            ))}
          </div>
          <button type="button" aria-label="Next review" onClick={() => setActive((value) => (value + 1) % reviews.length)}>
            <ChevronRight />
          </button>
        </div>
      </div>
      <aside className="reviews-experience__side">
        <p className="reviews-experience__side-label">{locale === 'en' ? 'Guest voices' : 'Giọng nói khách'}</p>
        <div className="reviews-experience__rail">
          {reviews.map((item, i) => (
            <button key={item.id} type="button" className={i === active ? 'is-active' : ''} onClick={() => setActive(i)}>
              <strong>{item.guest}</strong>
              <span>{locale === 'en' ? item.titleEn : item.title}</span>
            </button>
          ))}
        </div>
        <small className="reviews-experience__note">{note}</small>
      </aside>
    </div>
  )
}

/* =========================================================================
   Gallery Moments
   ========================================================================= */

export function GalleryMoments({ locale }: { locale: Locale }) {
  const [active, setActive] = useState<number | null>(null)
  const copy = dictionaries[locale]

  return (
    <div className="gallery-moments">
      <div className="gallery-moments__grid">
        {galleryMoments.map((item, index) => (
          <button key={item.id} type="button" className={`gallery-moments__item is-${item.span}`} onClick={() => setActive(index)}>
            <Image src={item.src} alt={item.alt} fill sizes="(max-width: 768px) 50vw, 25vw" placeholder="blur" blurDataURL={blur} />
            <span>{item.alt}</span>
          </button>
        ))}
      </div>
      {active !== null && (
        <div className="lightbox gallery-lightbox" role="dialog" aria-modal="true" aria-label={copy.galleryLabel}>
          <button type="button" className="lightbox-close" onClick={() => setActive(null)} aria-label="Close">
            ×
          </button>
          <button type="button" className="lightbox-prev" onClick={() => setActive((active - 1 + galleryMoments.length) % galleryMoments.length)} aria-label="Previous">
            <ChevronLeft />
          </button>
          <div className="lightbox-image">
            <Image src={galleryMoments[active].src} alt={galleryMoments[active].alt} fill sizes="100vw" priority />
          </div>
          <button type="button" className="lightbox-next" onClick={() => setActive((active + 1) % galleryMoments.length)} aria-label="Next">
            <ChevronRight />
          </button>
          <p>{galleryMoments[active].alt}</p>
        </div>
      )}
    </div>
  )
}
