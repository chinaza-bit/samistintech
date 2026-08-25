import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_PREFIXES = [
  '/home', '/marketplace', '/tech-trends', '/business-trends',
  '/reels', '/blog', '/chat', '/profile', '/settings', '/u', '/business',
  '/notifications',
];

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  const { data: { session } } = await supabase.auth.getSession();

  const isProtected = PROTECTED_PREFIXES.some((p) => req.nextUrl.pathname.startsWith(p));

  if (isProtected && !session) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return res;
}

export const config = {
  matcher: [
    '/home/:path*', '/marketplace/:path*', '/tech-trends/:path*',
    '/business-trends/:path*', '/reels/:path*', '/blog/:path*',
    '/chat/:path*', '/profile/:path*', '/settings/:path*',
    '/u/:path*', '/business/:path*', '/notifications/:path*',
  ],
};
