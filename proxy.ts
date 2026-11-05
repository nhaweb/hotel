import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if route is under /admin
  if (pathname.startsWith('/admin')) {
    const sessionToken = request.cookies.get('pml_admin_session')?.value
    const isLoginPage = pathname === '/admin/login'

    // If user is accessing login page while already having a session, redirect to /admin
    if (isLoginPage) {
      if (sessionToken) {
        return NextResponse.redirect(new URL('/admin', request.url))
      }
      return NextResponse.next()
    }

    // For all other /admin routes, require session cookie
    if (!sessionToken) {
      const loginUrl = new URL('/admin/login', request.url)
      // Save original destination to redirect after login
      loginUrl.searchParams.set('from', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
