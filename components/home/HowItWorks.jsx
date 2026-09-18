'use client';
// frontend/components/home/HowItWorks.jsx
//
// ✅ PHASE 9 — "How It Works" homepage section.
// Do switchable flows: "Sell Your Car" (private seller) aur
// "Register a Showroom" (dealer).
//
// ✅ MOBILE FIX — Pehle 4 steps mobile par ek column me stack ho kar bohot
//    lamba ho jate the. Ab mobile par horizontal scroll row hai (step cards
//    fixed compact width ke), connecting line sirf desktop (lg+) par. sm+ par
//    grid layout pehle jaisa.
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  UserPlus,
  ShieldCheck,
  Camera,
  Rocket,
  Building2,
  CreditCard,
  LayoutDashboard,
  ArrowRight,
} from 'lucide-react';
import { useLang } from '@/lib/i18nContext';

const createSellerSteps = (t) => [
  {
    icon: UserPlus,
    title: t('sell.steps.seller.1.title'),
    desc: t('sell.steps.seller.1.desc'),
  },
  {
    icon: ShieldCheck,
    title: t('sell.steps.seller.2.title'),
    desc: t('sell.steps.seller.2.desc'),
  },
  {
    icon: Camera,
    title: t('sell.steps.seller.3.title'),
    desc: t('sell.steps.seller.3.desc'),
  },
  {
    icon: Rocket,
    title: t('sell.steps.seller.4.title'),
    desc: t('sell.steps.seller.4.desc'),
  },
];

const createShowroomSteps = (t) => [
  {
    icon: ShieldCheck,
    title: t('sell.steps.showroom.1.title'),
    desc: t('sell.steps.showroom.1.desc'),
  },
  {
    icon: Building2,
    title: t('sell.steps.showroom.2.title'),
    desc: t('sell.steps.showroom.2.desc'),
  },
  {
    icon: CreditCard,
    title: t('sell.steps.showroom.3.title'),
    desc: t('sell.steps.showroom.3.desc'),
  },
  {
    icon: LayoutDashboard,
    title: t('sell.steps.showroom.4.title'),
    desc: t('sell.steps.showroom.4.desc'),
  },
];

export default function HowItWorks() {
  const router = useRouter();
  const { t } = useLang();
  const [activeFlow, setActiveFlow] = useState('seller'); // 'seller' | 'showroom'

  const steps = activeFlow === 'seller' ? createSellerSteps(t) : createShowroomSteps(t);
  const ctaLabel = activeFlow === 'seller' ? t('sell.listNow') : t('showroom.register');
  const ctaHref = activeFlow === 'seller' ? '/dashboard/become-seller' : '/dashboard/register-showroom';

  return (
    <section
      className="py-10 sm:py-16 px-4 bg-surface-alt"
      style={{ width: '100vw', marginLeft: 'calc(50% - 50vw)', marginRight: 'calc(50% - 50vw)' }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 sm:mb-8 text-center">
          <h2 className="text-xl sm:text-2xl font-black text-theme-primary">{t('sell.howItWorks')}</h2>
          <p className="text-theme-secondary text-xs sm:text-sm mt-1">{t('sell.howItWorksSub')}</p>
        </div>

        {/* ── Flow switcher (tabs) ── */}
        <div className="flex justify-center mb-8 sm:mb-10">
          <div
            className="inline-flex rounded-full p-1 gap-1 border"
            style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)', boxShadow: 'var(--card-shadow)' }}
          >
            <button
              type="button"
              onClick={() => setActiveFlow('seller')}
              aria-pressed={activeFlow === 'seller'}
              className="px-4 sm:px-5 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold transition-all"
              style={activeFlow === 'seller'
                ? { background: 'var(--accent)', color: 'var(--accent-text)' }
                : { color: 'var(--text-secondary)' }}
            >{t('sell.postCar')}</button>
            <button
              type="button"
              onClick={() => setActiveFlow('showroom')}
              aria-pressed={activeFlow === 'showroom'}
              className="px-4 sm:px-5 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold transition-all"
              style={activeFlow === 'showroom'
                ? { background: 'var(--accent)', color: 'var(--accent-text)' }
                : { color: 'var(--text-secondary)' }}
            >
              {t('showroom.register')}
            </button>
          </div>
        </div>

        {/* ── MOBILE: full-width stacked list (was a narrow horizontal-scroll
             row of fixed w-[72vw] cards — looked chopped/half-width on
             phone screens). Now each step card spans the full container
             width, one per row, icon-left / text-right layout. ── */}
        <div className="sm:hidden flex flex-col gap-3">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={step.title}
                className="w-full rounded-2xl p-4 flex items-center gap-4 text-left border"
                style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)', boxShadow: 'var(--card-shadow)' }}
              >
                <div
                  className="shrink-0 w-12 h-12 rounded-full flex items-center justify-center border-2"
                  style={{ background: 'var(--card-bg)', borderColor: 'var(--accent)' }}
                >
                  <Icon size={20} style={{ color: 'var(--accent)' }} />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-bold block mb-0.5" style={{ color: 'var(--accent)' }}>STEP {idx + 1}</span>
                  <h3 className="font-black text-theme-primary text-sm mb-1">{step.title}</h3>
                  <p className="text-theme-secondary text-xs leading-relaxed">{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── TABLET/DESKTOP: grid with connecting line ── */}
        <div className="hidden sm:grid relative grid-cols-2 lg:grid-cols-4 gap-6">
          <div
            className="hidden lg:block absolute top-6 left-0 right-0 h-0.5"
            style={{ marginLeft: '12.5%', marginRight: '12.5%', background: 'var(--border-color)' }}
            aria-hidden="true"
          />

          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div key={step.title} className="relative flex flex-col items-center text-center">
                <div
                  className="relative z-10 w-12 h-12 rounded-full flex items-center justify-center mb-4 border-2 shadow-sm"
                  style={{ background: 'var(--card-bg)', borderColor: 'var(--accent)' }}
                >
                  <Icon size={20} style={{ color: 'var(--accent)' }} />
                </div>
                <span className="text-xs font-bold mb-1" style={{ color: 'var(--accent)' }}>STEP {idx + 1}</span>
                <h3 className="font-black text-theme-primary text-sm mb-1.5">{step.title}</h3>
                <p className="text-theme-secondary text-xs leading-relaxed">{step.desc}</p>
              </div>
            );
          })}
        </div>

        {/* ── CTA ── */}
        <div className="flex justify-center mt-8 sm:mt-10">
          <button
            type="button"
            onClick={() => router.push(ctaHref)}
            className="inline-flex items-center gap-2 font-bold text-xs sm:text-sm px-5 sm:px-6 py-2.5 sm:py-3 rounded-full transition-all hover:scale-[1.02]"
            style={{ background: 'var(--text-primary)', color: 'var(--bg-page)' }}
          >
            {ctaLabel} <ArrowRight size={16} />
          </button>
        </div>
      </div>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </section>
  );
}