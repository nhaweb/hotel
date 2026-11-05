import { Suspense } from 'react'
import { LoginForm } from '@/components/admin/login-form'

export default function AdminLoginPage() {
  return (
    <div className="relative min-h-svh overflow-hidden bg-[var(--cream)] text-[var(--ink)]">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 18% 20%, rgba(201,155,101,.28), transparent 42%), radial-gradient(circle at 85% 75%, rgba(38,33,29,.12), transparent 40%), linear-gradient(135deg, #f8f3eb 0%, #efe6d9 55%, #e7dccb 100%)',
        }}
      />
      <div className="relative z-10 mx-auto flex min-h-svh max-w-6xl flex-col justify-center gap-10 px-4 py-10 lg:grid lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:gap-16 lg:px-8">
        <section className="max-w-xl">
          <p className="text-xs tracking-[0.22em] text-[var(--accent-dark)] uppercase">PML Boutique Hotel</p>
          <h1 className="mt-3 font-[family-name:var(--font-serif)] text-4xl leading-tight tracking-tight sm:text-5xl">
            Operations
            <br />
            <em className="text-[var(--accent-dark)] not-italic">Console</em>
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-[var(--muted)] sm:text-base">
            Không gian làm việc dành cho đội ngũ lễ tân, quản lý và housekeeping — giữ nhịp vận hành Quận 1 một cách chỉn chu.
          </p>
        </section>

        <section className="rounded-[1.4rem] border border-[var(--line)] bg-white/90 p-6 shadow-[0_24px_70px_rgba(38,33,29,.12)] backdrop-blur sm:p-8">
          <div className="mb-6">
            <p className="text-xs tracking-[0.16em] text-[var(--muted)] uppercase">Đăng nhập nhân sự</p>
            <h2 className="mt-1 font-[family-name:var(--font-serif)] text-2xl">Chào mừng trở lại</h2>
          </div>
          <Suspense fallback={<div className="h-40 animate-pulse rounded-xl bg-[var(--cream-2)]" />}>
            <LoginForm />
          </Suspense>
          <p className="mt-6 text-xs leading-relaxed text-[var(--muted)]">
            Phiên làm việc được bảo vệ bằng cookie HttpOnly. Liên hệ Super Admin nếu cần cấp lại mật khẩu.
          </p>
        </section>
      </div>
    </div>
  )
}
