import Link from 'next/link'
import { siteConfig } from '@/config/site'
export default function NotFound(){return <main className="status-page"><span className="wordmark">{siteConfig.name}</span><p>404</p><h1>Trang này đã đi dạo đâu đó.</h1><Link className="button button-accent" href="/">Về trang chủ</Link></main>}
