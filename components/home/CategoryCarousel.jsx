'use client';
// frontend/components/home/CategoryCarousel.jsx
// Used on homepage: "Kya dhundh rahe ho" category section. Includes MirrorCard sub-component.
//
// ✅ MOBILE FIX — Card height, padding, icon box aur font sizes mobile par
//    tight/narrow hain, sm+ par pehle jaisa spacious layout intact.
// ✅ THEME FIX (asal bug yahan tha) — Arrows aur progress-dots CARD ke
//    BAAHAR, page ke background par baithte hain. Pehle inka style
//    hardcoded `bg-white/10 border-white/20 text-white` tha — ye sirf dark
//    background par nazar aata tha. Light mode mein white background par
//    ye tinted-white cheez bilkul ghayab/washed-out ho jati thi, isliye
//    upar-neeche ka poora hero+carousel section "mismatched" lagta tha.
//    Ab dono globals.css ke theme tokens (--card-bg, --border-color,
//    --text-primary) use karte hain jo data-theme switch par khud-ba-khud
//    sahi rang le lete hain.
// ✅ REALISTIC LOOK — Photo card ka overlay/shadow thoda richer/layered
//    kiya (flat solid overlay ki jagah 3-stop gradient + finer border),
//    aur fallback (image na milne par) icon ab brand accent color leta hai
//    plain white ki bajaye — flat/cartoonish nahi, branded/premium lagta hai.
import { useState, useEffect, useRef, useCallback } from 'react';
import { Car, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { useLang } from '@/lib/i18nContext';

function CategoryCarousel({ categories, onSelect }) {
  const { t } = useLang();
  const [idx, setIdx]       = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef            = useRef(null);
  const touchX              = useRef(null);

  const next = useCallback(() => setIdx(i => (i + 1) % categories.length), [categories.length]);
  const prev = () => setIdx(i => (i - 1 + categories.length) % categories.length);

  useEffect(() => {
    if (paused) return;
    timerRef.current = setInterval(next, 4500);
    return () => clearInterval(timerRef.current);
  }, [paused, next]);

  const handleTouchStart = (e) => {
    setPaused(true);
    touchX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e) => {
    if (touchX.current !== null) {
      const diff = touchX.current - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 40) {
        if (diff > 0) next(); else prev();
      }
    }
    touchX.current = null;
    setPaused(false);
  };

  return (
    <div
      className="relative max-w-md sm:max-w-2xl lg:max-w-4xl mx-auto"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* ✅ Arrows: ab theme tokens use karte hain, isliye light/dark dono
          mein card ke baahar bhi sahi contrast + visibility milti hai */}
      <button
        onClick={prev}
        aria-label={t('common.prev')}
        className="absolute left-1 sm:-left-5 lg:-left-16 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all duration-200"
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--border-color)',
          color: 'var(--text-primary)',
          boxShadow: 'var(--card-shadow)',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent-text)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'var(--card-bg)'; e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
      >
        <ChevronLeft size={16} className="sm:w-5 sm:h-5" />
      </button>
      <button
        onClick={next}
        aria-label={t('common.next')}
        className="absolute right-1 sm:-right-5 lg:-right-16 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all duration-200"
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--border-color)',
          color: 'var(--text-primary)',
          boxShadow: 'var(--card-shadow)',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent-text)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'var(--card-bg)'; e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
      >
        <ChevronRight size={16} className="sm:w-5 sm:h-5" />
      </button>

      <div className="overflow-hidden rounded-2xl sm:rounded-[28px]">
        <div
          className="flex transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]"
          style={{ transform: `translateX(-${idx * 100}%)` }}
        >
          {categories.map((cat) => (
            <div key={cat.title} className="w-full shrink-0">
              <MirrorCard cat={cat} t={t} onClick={() => onSelect(cat.href)} />
            </div>
          ))}
        </div>
      </div>

      <style jsx global>{`
        /* Mirror card */
        .mirror-card {
          transform-style: preserve-3d;
          transition: transform 0.4s cubic-bezier(0.23,1,0.32,1), box-shadow 0.4s ease;
        }
      `}</style>

      {/* ✅ Dots: inactive state ab var(--border-color) leta hai, taake
          light theme ki white/light background par bhi dikhen (pehle
          rgba(255,255,255,0.2) light bg par tail invisible tha) */}
      <div className="flex justify-center gap-1.5 sm:gap-2 mt-4 sm:mt-6">
        {categories.map((cat, i) => (
          <button
            key={cat.title}
            onClick={() => setIdx(i)}
            aria-label={`Go to ${cat.title}`}
            className="h-1.5 sm:h-2 rounded-full transition-all"
            style={{
              width: i === idx ? 20 : 6,
              backgroundColor: i === idx ? cat.accent : 'var(--border-color)',
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── MIRROR CARD ─────────────────────────────────────────
// Note: yeh card poore background par ek photo dikhata hai, is liye
// (Netflix/PakWheels-style hero cards ki tarah) iska text/overlay treatment
// jaan-boojh kar dono themes mein consistent (photo-dark) rakha gaya hai —
// warna image ke upar likha text light theme mein illegible ho jayega.
function MirrorCard({ cat, t, onClick }) {
  const cardRef = useRef(null);
  const [tilt, setTilt]       = useState({ x: 0, y: 0 });
  const [glowPos, setGlowPos] = useState({ x: 50, y: 50 });
  const [hovered, setHovered] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const Icon = cat.icon || Car;

  const handleMouseMove = (e) => {
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top)  / rect.height;
    setTilt({ x: (y - 0.5) * 14, y: (x - 0.5) * -14 });
    setGlowPos({ x: x * 100, y: y * 100 });
  };

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setTilt({ x: 0, y: 0 }); setGlowPos({ x: 50, y: 50 }); setHovered(false); }}
      className="mirror-card relative rounded-2xl sm:rounded-[28px] overflow-hidden cursor-pointer h-[230px] sm:h-[360px] md:h-[420px] lg:h-[460px]"
      style={{
        transform: hovered
          ? `perspective(900px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(1.015)`
          : 'perspective(900px) rotateX(0deg) rotateY(0deg) scale(1)',
        boxShadow: hovered
          ? `0 40px 70px -18px rgba(0,0,0,0.55), 0 0 0 1px ${cat.accent}55`
          : '0 14px 34px rgba(0,0,0,0.32), 0 2px 8px rgba(0,0,0,0.18)',
      }}
    >
      {!imgFailed ? (
        <img
          src={cat.img}
          alt={cat.title}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: 'brightness(0.6) saturate(1.15) contrast(1.05)' }}
          onError={() => setImgFailed(true)}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center"
          style={{ background: `linear-gradient(135deg, ${cat.accent}30, var(--card-bg) 70%)` }}>
          <Icon size={44} className="sm:w-20 sm:h-20 opacity-70" color={cat.accent} />
        </div>
      )}
      {/* ✅ 3-stop gradient — flat single overlay ki jagah, zyada photographic depth */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.35) 45%, rgba(0,0,0,0.05) 75%, transparent 100%)' }} />
      <div className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 65% 65% at ${glowPos.x}% ${glowPos.y}%, ${cat.accent}25 0%, transparent 65%)`,
          transition: 'background 0.1s ease',
        }} />
      <div className="absolute inset-0 rounded-2xl sm:rounded-[28px] pointer-events-none"
        style={{
          border: `1px solid ${hovered ? cat.accent + '70' : 'rgba(255,255,255,0.14)'}`,
          transition: 'border-color 0.3s ease',
        }} />
      {/* ✅ NEW — thin top accent stripe for a more "branded/professional" card header feel */}
      <div className="absolute top-0 left-0 right-0 h-1 sm:h-1.5 rounded-t-2xl sm:rounded-t-[28px] pointer-events-none"
        style={{ background: `linear-gradient(90deg, transparent, ${cat.accent}, transparent)`, opacity: hovered ? 1 : 0.6, transition: 'opacity 0.3s ease' }} />
      {/* Icon badge */}
      <div className="absolute top-3.5 left-3.5 sm:top-6 sm:left-6 w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center backdrop-blur-md"
        style={{ background: `${cat.accent}28`, border: `1px solid ${cat.accent}55` }}>
        <Icon size={18} className="sm:w-[26px] sm:h-[26px]" color={cat.accent} />
      </div>
      {/* Text block */}
      <div className="absolute inset-0 flex flex-col justify-end p-4 sm:p-8">
        <h3 className="text-white text-xl sm:text-3xl md:text-4xl font-black mb-1 sm:mb-1.5 leading-tight tracking-tight"
          style={{ textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}>
          {t(`category.${cat.key}.title`)}
        </h3>
        <p className="text-white/75 text-[12px] sm:text-base line-clamp-2">{t(`category.${cat.key}.desc`)}</p>
        <div className="mt-2.5 sm:mt-5 flex items-center gap-1.5" style={{ color: cat.accent }}>
          <span className="text-[10px] sm:text-sm font-bold uppercase tracking-wider">{t('home.explore')}</span>
          <ArrowRight size={13} className="sm:w-4 sm:h-4" />
        </div>
      </div>
    </div>
  );
}
export default CategoryCarousel;