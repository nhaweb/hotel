import Image from 'next/image'
import Link from 'next/link'
import { Bath, BriefcaseBusiness, Coffee, MapPin, Sparkles } from 'lucide-react'
import { siteConfig } from '@/config/site'
import { amenityHighlights, branches } from '@/data/branches'
import { faqs } from '@/data/faqs'
import { gallery } from '@/data/gallery'
import { offers } from '@/data/offers'
import { featuredRoomIds, rooms } from '@/data/rooms'
import { reviews, sampleContentNote } from '@/data/reviews'
import { formatPrice } from '@/lib/format-price'
import { BookingBar, FAQAccordion, FloatingActions, Header, Newsletter, Reveal } from '@/components/site-client'

const blur = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSIyNSI+PHJlY3QgZmlsbD0iI2Q4YzNiNCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjI1Ii8+PC9zdmc+'
const roomImages = {
  'room-onsen-suite': 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1400&q=85',
  'room-deluxe-city': 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1400&q=85',
  'room-rooftop-jacuzzi': 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=85',
}

export default function Home() {
  const featured = featuredRoomIds.map((id) => rooms.find((room) => room.id === id)!).filter(Boolean)
  const hotelJsonLd = { '@context': 'https://schema.org', '@type': 'Hotel', name: siteConfig.name, description: siteConfig.description, url: siteConfig.url, telephone: siteConfig.hotline, email: siteConfig.email, containsPlace: branches.map((branch) => ({ '@type': 'LodgingBusiness', name: branch.name, address: branch.address })) }
  const faqJsonLd = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.slice(0, 8).map((faq) => ({ '@type': 'Question', name: faq.question, acceptedAnswer: { '@type': 'Answer', text: faq.answer } })) }
  return <main>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(hotelJsonLd) }} />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
    <Header />
    <section className="hero" id="experience"><Image src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=2200&q=88" alt="Sảnh PML Hotel ấm áp tại trung tâm Quận 1" fill priority sizes="100vw" placeholder="blur" blurDataURL={blur} /><div className="hero-shade" /><div className="hero-content"><p className="eyebrow">Ba khách sạn boutique giữa Quận 1</p><h1>Lưu trú vì <em>cảm xúc.</em></h1><p>Nơi nghi thức tắm khoáng Nhật Bản gặp tinh thần hiếu khách Sài Gòn.</p><div className="hero-actions"><Link href="/dat-phong" className="button button-accent">Đặt phòng ngay</Link><Link href="#rooms" className="button button-ghost">Khám phá phòng nghỉ</Link></div><ul className="trust-badges"><li>Trà chiều miễn phí</li><li>Hủy trước 3 ngày</li><li>Lễ tân 24/7</li></ul></div></section>
    <BookingBar />

    <section className="section" id="rooms"><Reveal><p className="eyebrow ink">Phòng nổi bật</p><h2>Mỗi căn phòng,<br/><em>một góc nhìn riêng.</em></h2></Reveal><div className="room-grid">{featured.map((room) => <article className="room-card" key={room.id}><div className="image-wrap"><Image src={roomImages[room.id as keyof typeof roomImages]} alt={`${room.name}, ${room.view}`} fill sizes="(max-width: 768px) 100vw, 33vw" placeholder="blur" blurDataURL={blur} /></div><div><p>{branches.find((b) => b.id === room.branchId)?.shortName}</p><h3>{room.name}</h3><p>{room.description}</p><ul><li>{room.sizeSqm} m²</li><li>{room.bedType}</li><li>{room.view}</li></ul><footer><strong>Từ {formatPrice(room.priceVnd)} <small>/ đêm</small></strong><Link href={`/phong/${room.id.replace('room-','')}`}>Xem phòng →</Link></footer></div></article>)}</div></section>

    <section className="section tinted" id="amenities"><Reveal><p className="eyebrow ink">Tiện ích</p><h2>Những nghi thức nhỏ,<br/><em>được làm chỉn chu.</em></h2></Reveal><div className="bento">{amenityHighlights.map((amenity, index) => { const Icons = [Bath, Sparkles, BriefcaseBusiness, Coffee]; const Icon = Icons[index]; return <article key={amenity.id}><Icon/><h3>{amenity.name}</h3><p>{amenity.detail}</p><small>{amenity.hours}</small></article> })}</div></section>

    <section className="section" id="location"><Reveal><p className="eyebrow ink">Ba địa chỉ</p><h2>Ngay giữa nhịp sống<br/><em>Quận 1.</em></h2></Reveal><div className="branch-layout"><div className="branch-grid">{branches.map((branch) => <article key={branch.id}><MapPin/><h3>{branch.name}</h3><p>{branch.address}</p><p>{branch.tagline}</p><Link href={`/co-so/${branch.slug}`}>Khám phá cơ sở →</Link></article>)}</div><div className="map-placeholder"><span>Quận 1</span>{branches.map((branch, i) => <i key={branch.id} style={{ left: `${24 + i * 25}%`, top: `${30 + (i % 2) * 28}%` }}>{i + 1}</i>)}</div></div></section>

    <section className="section dark" id="offers"><Reveal><p className="eyebrow">Ưu đãi</p><h2>Thêm một lý do<br/><em>để ở lại.</em></h2></Reveal><div className="offer-grid">{offers.slice(0,3).map((offer) => <article key={offer.id}><h3>{offer.name}</h3><p>{offer.description}</p>{offer.priceFromVnd && <strong>Từ {formatPrice(offer.priceFromVnd)}</strong>}<Link href="/dat-phong">Tìm hiểu →</Link></article>)}</div></section>

    <section className="section reviews"><Reveal><p className="eyebrow ink">Lời khách kể</p><h2>Một cảm giác<br/><em>đáng sẻ chia.</em></h2></Reveal><div className="review-track">{reviews.slice(0,5).map((review) => <figure key={review.id}><div>★★★★★</div><blockquote>“{review.text}”</blockquote><figcaption>{review.guest} · {review.origin}</figcaption></figure>)}</div><small>{sampleContentNote.vi}</small></section>

    <section className="section gallery"><p className="eyebrow ink">Khoảnh khắc PML</p><div className="masonry">{gallery.map((item) => <div key={item.id}><Image src={item.src} alt={item.alt} width={900} height={700} sizes="(max-width: 768px) 50vw, 25vw" placeholder="blur" blurDataURL={blur} /></div>)}</div></section>

    <section className="section faq"><Reveal><p className="eyebrow ink">Câu hỏi thường gặp</p><h2>Trước khi<br/><em>Quý khách đến.</em></h2></Reveal><FAQAccordion items={faqs.slice(0,8)} /></section>

    <footer className="footer"><div><Link href="/" className="wordmark">{siteConfig.name}</Link><p>{siteConfig.description}</p><a href={`tel:${siteConfig.hotline.replace(/\s/g,'')}`}>{siteConfig.hotline}</a><a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a></div><div><h3>Ghé thăm</h3>{branches.map((branch) => <Link key={branch.id} href={`/co-so/${branch.slug}`}>{branch.street} · Quận 1</Link>)}</div><div><h3>Khám phá</h3><Link href="#location">Khám phá khu phố</Link><Link href="/tin-tuc">Đọc câu chuyện</Link><div className="socials">{Object.entries(siteConfig.social).map(([name,href]) => <a key={name} href={href}>{name}</a>)}</div></div><div><h3>Nhận tin từ PML</h3><p>Ưu đãi và những câu chuyện Sài Gòn, gửi vừa đủ.</p><Newsletter /></div><p className="footer-bottom">© 2026 {siteConfig.name}</p></footer>
    <FloatingActions/>
  </main>
}
