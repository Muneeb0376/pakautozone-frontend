// app/layout.tsx
//
// Ab language SERVER SIDE set hoti hai cookie se —
// koi flash nahi, RTL pehle render se kaam karta hai.

import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { cookies } from 'next/headers';
import './globals.css';
import { ThemeProvider } from '@/lib/themeContext';
import { LangProvider } from '@/lib/i18nContext';

// ── Latin fonts (pehle jaisi) ──────────────────────────────────────────────
const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets : ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets : ['latin'],
});

// ── Urdu Nastaliq font ─────────────────────────────────────────────────────
// Agar build mein error aaye to neeche wala import hata do
// aur globals.css wala @import uncomment karo (file ke end mein comment hai)
import { Noto_Nastaliq_Urdu } from 'next/font/google';

const nastaliq = Noto_Nastaliq_Urdu({
  variable: '--font-nastaliq',
  subsets : ['arabic'],
  weight  : ['400', '700'],
  display : 'swap',
});

// ── Constants ──────────────────────────────────────────────────────────────
const VALID_LANGS = ['roman', 'en', 'ur'];
const DEFAULT     = 'roman';

// ── Metadata ───────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title      : 'AutoMarket - Pakistan ka #1 Auto Marketplace',
  description: 'New aur used cars, spare parts, trade-in — sab kuch ek jagah',
};

export const viewport: Viewport = {
  width         : 'device-width',
  initialScale  : 1,
  maximumScale  : 5,
  userScalable  : true,
};

// ── Root Layout ────────────────────────────────────────────────────────────
export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {

  // ✅ Cookie server-side padho → koi flash nahi
  const cookieStore = await cookies();
  const cookieLang  = cookieStore.get('autopk_lang')?.value ?? '';
  const lang        = VALID_LANGS.includes(cookieLang) ? cookieLang : DEFAULT;

  // dir aur htmlLang server side se set karo
  const dir      = lang === 'ur' ? 'rtl' : 'ltr';
  const htmlLang = lang === 'ur' ? 'ur'  : 'en';

  return (
    <html
      lang={htmlLang}
      dir={dir}
      className={[
        geistSans.variable,
        geistMono.variable,
        nastaliq.variable,
        'h-full antialiased',
        lang === 'ur' ? 'lang-ur' : '',
      ].join(' ')}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <ThemeProvider>
          {/* initialLang server se pass karo — client side match kare */}
          <LangProvider initialLang={lang}>
            {children}
          </LangProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}