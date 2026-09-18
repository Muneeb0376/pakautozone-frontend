'use client';
// frontend/components/home/BodyTypeSection.jsx
// "Body type se talash" homepage section. Includes BodyTypeCard sub-component.
//
// ✅ REDESIGN — pehle har item ek bhaari card tha (border, box-shadow, mesh
//    dots, shine sweep, 3D tilt). Us se saara wazan card ke chrome par tha
//    aur car khud dab jati thi.
//
//    Ab reference wala saaf andaz: koi box nahi, sirf gari + naam + ek line.
//    Sab kuch center mein, seedhi grid. Hover par gari halki si upar uthti
//    hai aur naam apne rang mein aa jata hai — bas itna, taake nazar gari
//    par rahe na ke effects par.
//
//    Mobile par 2 columns (saare 8 types ek nazar mein), sm+ par 4 columns.
//    Pehle mobile par horizontal carousel tha jisme aadhe types chhup jate
//    the — grid behtar hai kyunki koi swipe kiye baghair sab dekh leta hai.
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLang } from '@/lib/i18nContext';
import { BODY_TYPE_SVGS, BODY_TYPES } from './bodyTypeData';

export default function BodyTypeSection() {
  const router = useRouter();
  const { t } = useLang();

  return (
    /* ✅ FULL-BLEED — Hero jaisa hi breakout trick, taake section screen ke
       edges tak jaye. Background inline style se (is project mein Tailwind
       utility classes purge se fail ho jati hain — CarsGridSection ke
       comments dekho), isliye var(--bg-section-accent) seedha diya gaya. */
    <section
      className="relative left-1/2 right-1/2 -mx-[50vw] w-screen py-10 sm:py-16 px-4"
      style={{ background: 'var(--bg-section-accent)' }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Heading — reference ki tarah center mein */}
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-theme-primary">
            {t('home.bodyTypeSearch')}
          </h2>
          <p className="text-theme-muted text-xs sm:text-sm mt-1.5">
            {t('home.bodyTypeSearchSub')}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-12">
          {BODY_TYPES.map((bt) => (
            <BodyTypeCard
              key={bt.type}
              bodyType={bt}
              onClick={() => router.push(`/cars?bodyType=${bt.type}`)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── BODY TYPE ITEM — gari + naam, koi card chrome nahi ──────
function BodyTypeCard({ bodyType, onClick }) {
  const { t } = useLang();
  const [hovered, setHovered] = useState(false);
  const svgEl = BODY_TYPE_SVGS[bodyType.type] || BODY_TYPE_SVGS.SEDAN;

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group w-full flex flex-col items-center text-center cursor-pointer bg-transparent border-0 p-0"
    >
      {/* ── Gari ──
          color yahan set hota hai; SVG ki body currentColor se rang leti hai,
          aur uske upar shading gradient apna kaam karta hai. */}
      <div
        className="w-full h-16 sm:h-24 flex items-center justify-center"
        style={{
          color: bodyType.color,
          transform: hovered ? 'translateY(-6px) scale(1.05)' : 'translateY(0) scale(1)',
          transition: 'transform 0.4s cubic-bezier(0.23,1,0.32,1)',
        }}
      >
        {svgEl}
      </div>

      {/* ── Naam + ek line ── */}
      <h3
        className="mt-3 sm:mt-4 font-bold text-sm sm:text-base leading-tight"
        style={{
          color: hovered ? bodyType.color : 'var(--text-primary)',
          transition: 'color 0.25s ease',
        }}
      >
        {t(`bodyType.${bodyType.type}.label`)}
      </h3>
      <p className="text-theme-muted text-[11px] sm:text-xs mt-1 px-1 leading-snug">
        {t(`bodyType.${bodyType.type}.desc`)}
      </p>
    </button>
  );
}