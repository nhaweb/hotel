import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { rooms } from '@/data/rooms'
import { branches } from '@/data/branches'
import { formatPrice } from '@/lib/format-price'
import { siteConfig } from '@/config/site'
import { Header, RoomGallery } from '@/components/site-client'

export function generateStaticParams() { return rooms.map((room) => ({ slug: room.id.replace('room-','') })) }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params; const room = rooms.find((item) => item.id === `room-${slug}`)
  if (!room) return {}
  const url = `/phong/${slug}`
  return { title: room.name, description: room.description, alternates: { canonical: url }, openGraph: { title: room.name, description: room.description, url, locale: 'vi_VN' } }
}
export default async function RoomPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const room = rooms.find((item) => item.id === `room-${slug}`); if (!room) notFound()
  const branch = branches.find((item) => item.id === room.branchId)
  const images = [
    'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1800&q=86',
    'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1400&q=86',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=86',
  ]
  const jsonLd = { '@context':'https://schema.org','@type':'HotelRoom',name:room.name,description:room.description,bed:{'@type':'BedDetails',typeOfBed:room.bedType},floorSize:{'@type':'QuantitativeValue',value:room.sizeSqm,unitCode:'MTK'},offers:{'@type':'Offer',price:room.priceVnd,priceCurrency:'VND',url:`${siteConfig.url}/phong/${slug}`} }
  return <main><Header/><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(jsonLd)}}/><RoomGallery images={images} roomName={room.name}/><section className="detail-layout"><article><p className="eyebrow ink">{branch?.name}</p><h1>{room.name}</h1><p className="lead">{room.description}</p><div className="spec-grid"><span>{room.sizeSqm} m²</span><span>{room.bedType}</span><span>{room.capacity}</span><span>{room.view}</span></div><h2>Tiện nghi nổi bật</h2><ul>{room.features.map((feature)=><li key={feature}>{feature}</li>)}</ul></article><aside><strong>{formatPrice(room.priceVnd)} <small>/ đêm</small></strong><p>Giá tham khảo. Tình trạng phòng được xác nhận ở bước tiếp theo.</p><Link className="button button-accent" href={`/dat-phong?room=${room.id}&branchId=${room.branchId}`}>Gửi yêu cầu đặt phòng</Link></aside></section></main>
}
