'use client'

import { useEffect, useRef } from 'react'
import type { Branch } from '@/data/branches'

type MapProps = {
  branches: Branch[]
  locale?: 'vi' | 'en'
}

declare global {
  interface Window {
    L?: any
  }
}

export function Map({ branches, locale = 'vi' }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = mapRef.current
    if (!el) return

    let cancelled = false
    let map: any = null

    const ensureLeaflet = async () => {
      if (!document.querySelector('link[data-leaflet]')) {
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
        link.dataset.leaflet = 'true'
        document.head.appendChild(link)
      }

      if (!window.L) {
        await new Promise<void>((resolve, reject) => {
          const existing = document.querySelector<HTMLScriptElement>('script[data-leaflet]')
          if (existing) {
            existing.addEventListener('load', () => resolve(), { once: true })
            existing.addEventListener('error', () => reject(new Error('Leaflet failed to load')), { once: true })
            return
          }
          const script = document.createElement('script')
          script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
          script.dataset.leaflet = 'true'
          script.onload = () => resolve()
          script.onerror = () => reject(new Error('Leaflet failed to load'))
          document.body.appendChild(script)
        })
      }

      if (cancelled || !window.L || !mapRef.current) return

      const L = window.L
      // Fix default marker icons when Leaflet is loaded from CDN
      delete L.Icon.Default.prototype._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      map = L.map(mapRef.current).setView([10.7797, 106.7037], 14)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map)

      const points: [number, number][] = []
      branches.forEach((branch) => {
        if (typeof branch.lat !== 'number' || typeof branch.lng !== 'number') return
        points.push([branch.lat, branch.lng])
        // Branch.name is Vietnamese by default (Đông Du / Onsen / Central Park)
        const label = branch.name
        const marker = L.marker([branch.lat, branch.lng]).addTo(map)
        marker.bindTooltip(label, {
          permanent: true,
          direction: 'top',
          offset: [0, -12],
          className: 'pml-map-tooltip',
        })
      })

      if (points.length > 1) {
        map.fitBounds(L.latLngBounds(points).pad(0.25))
      }

      // Locale kept for future EN labels; names in data are currently Vietnamese
      void locale
    }

    ensureLeaflet().catch(() => {})

    return () => {
      cancelled = true
      map?.remove()
    }
  }, [branches, locale])

  return <div ref={mapRef} className="hotel-map" style={{ height: 400, width: '100%', borderRadius: 16 }} />
}
