'use client';
// frontend/components/home/BrandsCarousel.jsx
// "Brand se talash karein" homepage section. Includes BrandCard sub-component.
//
// ✅ MOBILE FIX — Mobile par ab arrow-pagination grid nahi, seedha ek horizontal
//    scroll row hai jisme SAARE brands ek line me hain (PakWheels jaisa) — 3+ thoda
//    sa next card ka peek dikhta hai, scroll se aage jao. Tablet/desktop (sm+) par
//    pehle wala arrow + paginated grid carousel intact hai.
// ✅ THEME FIX — Section, headings, arrows aur dots pehle hardcoded
//    bg-white/text-gray-900/border-gray-200 the — dark mode mein switch
//    hi nahi hote (page dark ho jati, ye section white hi reh jata).
//    Ab globals.css ke tokens (bg-surface, text-theme-*, border-theme,
//    var(--accent)) use karte hain taake light/dark dono mein poora
//    section ek hi theme follow kare.
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLang } from '@/lib/i18nContext';
import { BRANDS } from './homeConstants';

const BRANDS_PER_VIEW = 5;

export default function BrandsCarousel() {
  const router = useRouter();
  const { t } = useLang();
  const [brandIdx, setBrandIdx] = useState(0);

  const visibleBrands = BRANDS.slice(brandIdx, brandIdx + BRANDS_PER_VIEW);

  // ── Swipe support for Brand carousel (mobile touch) ──
  const brandTouchX = useRef(null);
  const handleBrandTouchStart = (e) => { brandTouchX.current = e.touches[0].clientX; };
  const handleBrandTouchEnd = (e) => {
    if (brandTouchX.current === null) return;
    const diff = brandTouchX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) setBrandIdx(i => Math.min(BRANDS.length - BRANDS_PER_VIEW, i + 1));
      else setBrandIdx(i => Math.max(0, i - 1));
    }
    brandTouchX.current = null;
  };

  return (
    <>
      {/* ━━━━━━ BRAND SE TALASH KAREIN ━━━━━━ */}
      {/* ✅ FULL-BLEED FIX — Hero jaisa hi breakout trick, taake ye section
          bhi screen ke edges tak jaye (pehle parent ki max-w/px se
          constrained tha). ✅ THEME FIX — className bg-surface pehle
          unreliable tha (is project mein Tailwind utility classes purge
          se fail ho jati hain — CarsGridSection ke comments dekho), ab
          seedha var(--bg-surface) inline style se guaranteed render hota
          hai, light aur dark dono theme mein sahi. */}
      <section
        className="relative left-1/2 right-1/2 -mx-[50vw] w-screen py-10 sm:py-16 px-4"
        style={{ background: 'var(--bg-surface)' }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-5 sm:mb-8">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-theme-primary">{t('home.brandSearch')}</h2>
              <p className="text-theme-muted text-xs sm:text-sm mt-1">{t('home.brandSearchSub')}</p>
            </div>
            {/* Arrows only make sense with the paginated grid, so hide on mobile */}
            <div className="hidden sm:flex gap-2">
              <button
                onClick={() => setBrandIdx(Math.max(0, brandIdx - 1))}
                disabled={brandIdx === 0}
                className="w-11 h-11 rounded-full flex items-center justify-center disabled:opacity-30 transition-all duration-200"
                style={{ border: '2px solid var(--border-color)', color: 'var(--text-primary)', background: 'var(--card-bg)' }}
                onMouseEnter={e => { if (brandIdx === 0) return; e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent-text)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--card-bg)'; e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
              >
                <ChevronLeft size={19} />
              </button>
              <button
                onClick={() => setBrandIdx(Math.min(BRANDS.length - BRANDS_PER_VIEW, brandIdx + 1))}
                disabled={brandIdx >= BRANDS.length - BRANDS_PER_VIEW}
                className="w-11 h-11 rounded-full flex items-center justify-center disabled:opacity-30 transition-all duration-200"
                style={{ border: '2px solid var(--border-color)', color: 'var(--text-primary)', background: 'var(--card-bg)' }}
                onMouseEnter={e => { if (brandIdx >= BRANDS.length - BRANDS_PER_VIEW) return; e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent-text)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--card-bg)'; e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
              >
                <ChevronRight size={19} />
              </button>
            </div>
          </div>

          {/* ── MOBILE: horizontal scroll, all brands, compact card ── */}
          <div className="sm:hidden flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 -mx-4 px-4 no-scrollbar">
            {BRANDS.map((brand) => (
              <div key={brand.name} className="flex-shrink-0 w-[26vw] max-w-[110px] min-w-[92px] snap-start">
                <BrandCard brand={brand} compact onClick={() => router.push(`/cars?brand=${brand.name}`)} />
              </div>
            ))}
          </div>

          {/* ── TABLET/DESKTOP: paginated grid + arrows ── */}
          <div
            className="hidden sm:grid sm:grid-cols-3 lg:grid-cols-5 gap-4 touch-pan-y"
            onTouchStart={handleBrandTouchStart}
            onTouchEnd={handleBrandTouchEnd}
          >
            {visibleBrands.map((brand) => (
              <BrandCard
                key={brand.name}
                brand={brand}
                onClick={() => router.push(`/cars?brand=${brand.name}`)}
              />
            ))}
          </div>

          <div className="hidden sm:flex justify-center gap-1.5 mt-6">
            {Array.from({ length: BRANDS.length - BRANDS_PER_VIEW + 1 }).map((_, i) => (
              <button
                key={i}
                onClick={() => setBrandIdx(i)}
                className="h-1.5 rounded-full transition-all"
                style={{
                  width: i === brandIdx ? 24 : 6,
                  backgroundColor: i === brandIdx ? 'var(--accent)' : 'var(--border-color)',
                }}
              />
            ))}
          </div>
        </div>

        <style jsx global>{`
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

          /* Brand card — 3D lift + shimmer */
          .brand-card-3d {
            position: relative; overflow: hidden;
            transform-style: preserve-3d;
            transition: transform 0.35s cubic-bezier(0.23,1,0.32,1), box-shadow 0.35s ease;
          }
          .brand-card-3d:hover {
            transform: translateY(-8px) rotateX(6deg) scale(1.05);
            box-shadow: 0 24px 48px -12px rgba(0,0,0,0.25);
          }
          .brand-card-3d::before {
            content: ''; position: absolute; top: 0; left: -75%; width: 50%; height: 100%;
            background: linear-gradient(120deg, transparent, rgba(255,255,255,0.4), transparent);
            transform: skewX(-20deg); transition: left 0.6s ease;
          }
          .brand-card-3d:hover::before { left: 125%; }
        `}</style>
      </section>
    </>
  );
}

// ─── BRAND CARD — real logos via favicon, with a compact mobile variant ───
// Note: brand.bg (logo tile background) jaan-boojh kar per-brand hardcoded
// rehta hai (theme se independent) — asli app-icon tiles ki tarah, taake
// logo dono themes mein hamesha readable/consistent rahe.
function BrandCard({ brand, onClick, compact = false }) {
  const [imgFailed, setImgFailed] = useState(false);
  const logoUrl = `https://www.google.com/s2/favicons?domain=${brand.domain}&sz=128`;

  const wrapPad   = compact ? 'p-2.5' : 'p-6';
  const boxSize   = compact ? 'w-12 h-12' : 'w-20 h-20';
  const boxRadius = compact ? 'rounded-xl' : 'rounded-2xl';
  const imgSize   = compact ? 'w-8 h-8' : 'w-14 h-14';
  const nameSize  = compact ? 'text-[11px]' : 'text-sm';

  return (
    <div
      onClick={onClick}
      className={`brand-card-3d bg-surface border border-theme rounded-xl sm:rounded-2xl ${wrapPad} flex flex-col items-center gap-2 sm:gap-3 cursor-pointer w-full`}
      style={{ boxShadow: 'var(--card-shadow)' }}
    >
      <div
        className={`${boxSize} ${boxRadius} flex items-center justify-center overflow-hidden relative shrink-0`}
        style={{ background: brand.bg }}
      >
        {!imgFailed ? (
          <img
            src={logoUrl}
            alt={brand.name}
            className={`${imgSize} object-contain`}
            onError={() => setImgFailed(true)}
          />
        ) : (
          <>
            <span
              className="absolute rounded-full border-2"
              style={{ width: compact ? 30 : 52, height: compact ? 30 : 52, borderColor: brand.color, opacity: 0.35 }}
            />
            <span className={`font-black ${compact ? 'text-sm' : 'text-xl'} tracking-tight relative`} style={{ color: brand.color }}>
              {brand.abbr}
            </span>
          </>
        )}
      </div>
      <span className={`text-theme-primary font-semibold ${nameSize} text-center truncate w-full`}>{brand.name}</span>
    </div>
  );
}