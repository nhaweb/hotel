import type { MetadataRoute } from 'next'
import { siteConfig } from '@/config/site'
import { rooms } from '@/data/rooms'
import { branches } from '@/data/branches'
export default function sitemap():MetadataRoute.Sitemap{return['','/dat-phong','/tin-tuc',...rooms.map((room)=>`/phong/${room.id.replace('room-','')}`),...branches.map((branch)=>`/co-so/${branch.slug}`)].map((path)=>({url:`${siteConfig.url}${path}`,lastModified:new Date(),changeFrequency:path?'monthly':'weekly',priority:path?.startsWith('/phong')?.8:1}))}
