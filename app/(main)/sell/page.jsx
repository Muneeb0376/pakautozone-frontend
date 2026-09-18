'use client';
import { useLang } from '@/lib/i18nContext';
// frontend/app/(main)/sell/page.jsx
//
// ✅ PHASE 9 — "Sell Your Car" informational page.
// Is page par HowItWorks aur FAQSection render hote hain,
// aur ek CTA button hai jo actual selling flow ki taraf le jata hai.
// Jaise dubicars.com par "Sell my car" page hota hai.
//
// ✅ THEME FIX — Ye page pehle apna alag hardcoded blue/cyan gradient hero
//    (`from-blue-900/90 to-cyan-900/80`) aur `bg-white` / `bg-gray-50` use
//    kar raha tha — jo aapke globals.css ke `--bg-hero` / `--bg-page` /
//    `--text-primary` token system ko bilkul ignore karta tha. Isi wajah
//    se light/dark toggle karne par ye page homepage ke saath match nahi
//    karta tha (screenshot: homepage cream/amber hero vs sell page ka
//    fixed blue box). Ab poora page sirf theme tokens use karta hai —
//    light aur dark dono mein automatically homepage jaisa hi behave
//    karega.
//
// ✅ HERO REDESIGN — flat blue/cyan gradient box ki jagah ab homepage
//    Hero jaisa hi treatment: grid pattern overlay + soft accent glow +
//    icon badge + pill tag — "professional card" feel, cartoonish flat
//    color-block nahi.

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import HowItWorks from '@/components/home/HowItWorks';
import FAQSection from '@/components/home/FAQSection';
import { ArrowRight, Car, ShieldCheck } from 'lucide-react';

export default function SellPage() {
  const { t } = useLang();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  const handleStartSelling = () => {
    if (isAuthenticated) {
      // Logged-in user → seedha selling flow
      router.push('/dashboard/become-seller');
    } else {
      // Guest → AuthModal khulega, Navbar se handle ho jayega
      router.push('/login?redirect=/dashboard/become-seller');
    }
  };

  return (
    <div className="min-h-screen bg-page-base">

      {/* ── Hero / CTA Section — same treatment as homepage Hero ── */}
      {/* ✅ FULL-BLEED FIX — this page's parent layout wraps content in a
          max-width container, which was clipping every section's colored
          background short of the real screen edges (visible gap on both
          sides in your screenshots). The calc(50% - 50vw) margin trick
          below breaks the background out of that wrapper regardless of
          how wide/narrow it is — the pattern is now edge-to-edge, while
          the text inside still stays centered via max-w-4xl below. */}
      <section
        className="relative overflow-hidden py-16 sm:py-24 px-4 text-center border-b"
        style={{
          background: 'var(--bg-hero)',
          borderColor: 'var(--border-color)',
          width: '100vw',
          marginLeft: 'calc(50% - 50vw)',
          marginRight: 'calc(50% - 50vw)',
        }}
      >
        {/* Faint grid — matches homepage hero texture, gives it depth instead of a flat block */}
        <div
          className="absolute inset-0 opacity-[0.05] pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(var(--text-primary) 1px,transparent 1px),linear-gradient(90deg,var(--text-primary) 1px,transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        {/* Soft accent glow for depth — no flat solid color anywhere */}
        <div
          className="absolute -top-20 left-1/2 -translate-x-1/2 w-[560px] h-[280px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, var(--glow-1) 0%, transparent 70%)' }}
        />

        <div className="relative max-w-4xl mx-auto">
          <span
            className="flex w-fit mx-auto items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-bold px-3 sm:px-4 py-1.5 sm:py-2 rounded-full mb-5 border"
            style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)', color: 'var(--accent)' }}
          >
            <ShieldCheck size={13} /> {t('sell.heroBadge')}
          </span>

          <div
            className="flex w-fit mx-auto items-center justify-center w-16 h-16 rounded-2xl mb-6 border"
            style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)', boxShadow: 'var(--card-shadow)' }}
          >
            <Car size={30} style={{ color: 'var(--accent)' }} />
          </div>

          <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight" style={{ color: 'var(--text-primary)' }}>
            {t('sell.heroTitle')}
            <br />
            <span style={{ color: 'var(--accent)' }}>{t('sell.heroTitleAccent')}</span>
          </h1>

          <p className="text-base sm:text-lg mt-4 max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
            {t('sell.heroSubtitle')}
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3 sm:gap-4">
            <button
              onClick={handleStartSelling}
              className="inline-flex items-center gap-2 font-bold text-sm px-8 py-4 rounded-full transition-all hover:scale-[1.02]"
              style={{ background: 'var(--accent)', color: 'var(--accent-text)', boxShadow: '0 10px 30px -8px var(--glow-1)' }}
            >
              {t('sell.primaryCta')} <ArrowRight size={18} />
            </button>
            <button
              onClick={() => router.push('/cars')}
              className="inline-flex items-center gap-2 font-semibold text-sm px-6 py-4 rounded-full border transition-all"
              style={{ background: 'var(--card-bg)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
            >{t('home.carsDekho')}</button>
          </div>

          <p className="text-xs mt-4" style={{ color: 'var(--text-muted)' }}>
            *Private seller: free listing • Showroom accounts: subscription based
          </p>
        </div>
      </section>

      {/* ── How It Works ── */}
      <HowItWorks />

      {/* ── FAQ Section ── */}
      <FAQSection />

      {/* ── Bottom CTA ── */}
      <section
        className="py-12 px-4 bg-surface-alt border-t border-theme"
        style={{ width: '100vw', marginLeft: 'calc(50% - 50vw)', marginRight: 'calc(50% - 50vw)' }}
      >
        <div className="max-w-3xl mx-auto text-center">
          <h3 className="text-xl font-bold text-theme-primary mb-2">{t('sell.readyTitle')}</h3>
          <p className="text-theme-secondary text-sm mb-6">
            {t('sell.readyText')}
          </p>
          <button
            onClick={handleStartSelling}
            className="inline-flex items-center gap-2 font-bold text-sm px-8 py-3.5 rounded-full transition-all hover:scale-[1.02]"
            style={{
              background: `linear-gradient(135deg, var(--accent-2-from), var(--accent-2-to))`,
              color: '#ffffff',
              boxShadow: '0 10px 30px -8px var(--glow-2)',
            }}
          >
            {t('sell.readyCta')} <ArrowRight size={16} />
          </button>
        </div>
      </section>
    </div>
  );
}