import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const isLoggedIn = req.cookies.get('session_id') || false
  console.log("isLoggedIn:", isLoggedIn)
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL('/auth', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Toutes les pages sauf auth et api
    '/((?!auth|api|_next/static|_next/image|favicon.ico).*)',
  ],
}