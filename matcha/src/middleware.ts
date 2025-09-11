import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'


const publicPaths = ["/auth", "/signup", "/api/login", "/api/signup"];

export function middleware(req: NextRequest) {
  const sessionId = req.cookies.get("session_id")?.value;
  const url = req.nextUrl.pathname;

  if (!sessionId && !publicPaths.includes(url)) {
    return NextResponse.redirect(new URL("/auth", req.url));
  }

  if (sessionId && ["/auth", "/signup"].includes(url)) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

// list of the path on wich middleware is not executed in order to limit slowings
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};