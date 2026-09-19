// proxy.ts  (project root mein rakho — next.config.ts ke saath)
//
// ⚠️ NOTE: middleware.ts hata do, sirf proxy.ts rakho —
//    Next.js ka naya "proxy" convention middleware.ts se replace ho gaya hai.
//
// Kaam:
//   1. Har request par cookie check karo
//   2. Agar cookie nahi → default 'roman' set karo
//   3. Language header forward karo (layout server-side padh sake)

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const COOKIE_KEY  = 'autopk_lang';
const VALID_LANGS = ['roman', 'en', 'ur'];
const DEFAULT     = 'en';
const ONE_YEAR    = 60 * 60 * 24 * 365;

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Static files aur API routes ko skip karo
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api')   ||
    pathname.startsWith('/socket.io') ||
    pathname.startsWith('/uploads') ||
    /\.[\w]{1,5}$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  const response = NextResponse.next();

  // Cookie padho
  const cookieLang = request.cookies.get(COOKIE_KEY)?.value ?? '';
  const lang = VALID_LANGS.includes(cookieLang) ? cookieLang : DEFAULT;

  // Agar cookie nahi ya invalid → set karo
  if (!VALID_LANGS.includes(cookieLang)) {
    response.cookies.set(COOKIE_KEY, DEFAULT, {
      maxAge  : ONE_YEAR,
      path    : '/',
      sameSite: 'lax',
      httpOnly: false, // Client JS bhi padh sake
    });
  }

  // Layout server component is header se language padhe ga
  response.headers.set('x-lang', lang);

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};