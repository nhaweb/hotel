import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { branches } from '@/data/branches'
import { rooms } from '@/data/rooms'
import { siteConfig } from '@/config/site'
import { Header } from '@/components/site-client'
import { formatPrice } from '@/lib/format-price'

export function generateStaticParams(){return branches.map((branch)=>({slug:branch.slug}))}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{const {slug}=await params;const branch=branches.find((item)=>item.slug===slug);if(!branch)return{};const url=`/co-so/${slug}`;return{title:branch.name,description:branch.highlights,alternates:{canonical:url},openGraph:{title:branch.name,description:branch.highlights,url,locale:'vi_VN'}}}
export default async function BranchPage({params}:{params:Promise<{slug:string}>}){const{slug}=await params;const branch=branches.find((item)=>item.slug===slug);if(!branch)notFound();const branchRooms=rooms.filter((room)=>room.branchId===branch.id);const jsonLd={'@context':'https://schema.org','@type':'LodgingBusiness',name:branch.name,address:branch.address,telephone:branch.phone,email:branch.email,url:`${siteConfig.url}/co-so/${slug}`};return <main><Header/><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(jsonLd)}}/><div className="detail-hero"><Image src="https://images.unsplash.com/photo-1535827841776-24afc1e255ac?auto=format&fit=crop&w=1800&q=86" alt={`Sảnh ${branch.name}`} fill priority sizes="100vw"/></div><section className="section"><p className="eyebrow ink">Cơ sở PML</p><h1>{branch.name}</h1><p className="lead">{branch.highlights}</p><p>{branch.address}</p><h2>Phòng tại cơ sở</h2><div className="branch-grid">{branchRooms.map((room)=><article key={room.id}><h3>{room.name}</h3><p>{room.description}</p><strong>Từ {formatPrice(room.priceVnd)}</strong><Link href={`/phong/${room.id.replace('room-','')}`}>Xem phòng →</Link></article>)}</div></section></main>}
