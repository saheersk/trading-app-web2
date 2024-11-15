import { NextRequest, NextResponse } from 'next/server'
import { getSession } from 'next-auth/react'

// 1. Specify protected and public routes
const protectedRoutes = ['/markets']
const publicRoutes = ['/login', '/signup', '/']

export default async function middleware(req: any) {
  const path = req.nextUrl.pathname
  const isProtectedRoute = protectedRoutes.includes(path)
  const isPublicRoute = publicRoutes.includes(path)

  // 2. Get the session using next-auth's getSession
  const session = await getSession({ req })

  // 3. Redirect to /auth if the user is not authenticated and trying to access a protected route
  if (isProtectedRoute && !session) {
    const loginUrl = new URL('/auth', req.url)
    loginUrl.searchParams.set('redirect', path)  // Store the path to redirect after login
    return NextResponse.redirect(loginUrl)
  }

  // 4. Redirect to /markets if the user is authenticated and trying to access a public route
  if (isPublicRoute && session && !req.nextUrl.pathname.startsWith('/markets')) {
    return NextResponse.redirect(new URL('/markets', req.url))
  }

  return NextResponse.next()
}

// Routes Middleware should not run on
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'], // Exclude API and static files
}
