'use client'
export default function ErrorPage({reset}:{reset:()=>void}){return <main className="status-page"><p>Có một nhịp chưa trọn vẹn.</p><h1>Trang chưa thể hiển thị.</h1><button className="button button-accent" onClick={reset}>Thử lại</button></main>}
