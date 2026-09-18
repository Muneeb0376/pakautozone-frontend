'use client';
// frontend/components/home/SparePartsGridSection.jsx
// Homepage "Spare Parts" grid — CarsGridSection jaisa hi pattern.
// Fetches its own data from /parts endpoint. New + Used dono show honge.
//
// ✅ MOBILE FIX — CarsGridSection ki tarah, mobile par parts ek grid mein
//    wrap nahi hote, balke horizontal scroll row hai — ek time par ~3 cards
//    line mein visible, baaki side-scroll se. Tablet/desktop (sm+) par
//    pehle jaisa grid layout (3/4 columns) intact hai. Loading skeleton
//    bhi isi pattern ko follow karta hai taake layout shift na ho.
// ✅ THEME FIX — Section bg, headings, card bg/border, aur skeletons pehle
//    hardcoded bg-white/gray the — dark mode mein ye section akela white
//    reh jata jab baaki page dark ho jati. Ab bg-surface / text-theme-* /
//    border-theme / skeleton-block (globals.css tokens) use hote hain.
//    Price/CTA accent bhi hardcoded amber-500/600 ki bajaye var(--accent)
//    se aata hai taake brand color ek hi jagah se control ho.
// ✅ WISHLIST FIX — Heart button ab localStorage ('parts_wishlist') ki
//    jagah useWishlistStore (Zustand, backend-synced) use karta hai —
//    bilkul wahi store jo /wishlist page use karta hai.
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Package, ArrowRight, Heart, Loader2 } from 'lucide-react';
import { useLang } from '@/lib/i18nContext';
import { useWishlistStore } from '@/store/wishlistStore';
import { API, getImg } from './homeConstants';

export default function SparePartsGridSection() {
  const router = useRouter();
  const { t } = useLang();
  const [parts, setParts] = useState([]);
  const [loadingParts, setLoadingParts] = useState(true);

  // ✅ Store ki part-wishlist ids ek baar fetch kar lo taake heart icons
  // sahi state ke sath render hon — logged-out user ke liye no-op hai.
  const fetchPartWishlist = useWishlistStore((s) => s.fetchPartWishlist);
  useEffect(() => {
    fetchPartWishlist();
  }, [fetchPartWishlist]);

  useEffect(() => {
    setLoadingParts(true);
    fetch(`${API}/parts?limit=8`)
      .then(r => r.json())
      .then(d => {
        const arr = Array.isArray(d) ? d : (d.data || []);
        setParts(arr);
      })
      .catch(() => setParts([]))
      .finally(() => setLoadingParts(false));
  }, []);

  return (
    <section className="relative left-1/2 right-1/2 -mx-[50vw] w-screen py-10 sm:py-16 px-4 bg-surface">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-5 sm:mb-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-theme-primary">{t('nav.parts')}</h2>
            <p className="text-theme-muted text-xs sm:text-sm mt-1">{t('home.partsSub')}</p>
          </div>
          <button
            onClick={() => router.push('/spare-parts')}
            className="text-[13px] sm:text-sm font-semibold flex items-center gap-1 transition-opacity hover:opacity-75 shrink-0"
            style={{ color: 'var(--accent)' }}
          >{t('common.viewAll')}<ArrowRight size={14} />
          </button>
        </div>

        {loadingParts ? (
          <>
            {/* ── MOBILE: horizontal scroll skeleton (3-up) ── */}
            <div className="sm:hidden flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 no-scrollbar">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex-shrink-0 w-[16rem] homepage-mobile-part-card bg-surface rounded-xl overflow-hidden animate-pulse border border-theme" style={{ boxShadow: 'var(--card-shadow)' }}>
                  <div className="h-40 skeleton-block" />
                  <div className="p-2 space-y-1.5">
                    <div className="h-2.5 skeleton-block rounded w-3/4" />
                    <div className="h-3 skeleton-block rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
            {/* ── TABLET/DESKTOP: grid skeleton ── */}
            <div className="hidden sm:grid sm:grid-cols-3 lg:grid-cols-4 gap-5">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-surface rounded-2xl overflow-hidden animate-pulse border border-theme" style={{ boxShadow: 'var(--card-shadow)' }}>
                  <div className="h-40 skeleton-block" />
                  <div className="p-3 space-y-2">
                    <div className="h-3 skeleton-block rounded w-3/4" />
                    <div className="h-4 skeleton-block rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : parts.length === 0 ? (
          <div className="text-center py-16 text-theme-muted">
            <p>No spare parts are currently available.
</p>
          </div>
        ) : (
          <>
            {/* ── MOBILE: horizontal scroll, 3-up, scroll for more ── */}
            <div className="sm:hidden flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 -mx-4 px-4 no-scrollbar">
              {parts.map(part => (
                <div key={part.id} className="flex-shrink-0 w-[16rem] snap-start homepage-mobile-part-card">
                  <HomepagePartCard part={part} onClick={() => router.push(`/spare-parts/${part.id}`)} />
                </div>
              ))}
            </div>

            {/* ── TABLET/DESKTOP: grid ── */}
            <div className="hidden sm:grid sm:grid-cols-3 lg:grid-cols-4 gap-5">
              {parts.map(part => (
                <HomepagePartCard
                  key={part.id}
                  part={part}
                  onClick={() => router.push(`/spare-parts/${part.id}`)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @media (max-width: 639px) {
          .homepage-mobile-part-card > div > div:first-child {
            height: 160px !important;
          }
        }
      `}</style>
    </section>
  );
}

// ─── HOMEPAGE PART CARD ────────────────────────────────────
function HomepagePartCard({ part, onClick }) {
  const router = useRouter();
  const [imgErr, setImgErr] = useState(false);
  const [toggling, setToggling] = useState(false);

  // ✅ Backend-synced wishlist state — same store used by /wishlist page
  const wishlisted = useWishlistStore((s) => s.isPartWished(part.id));
  const togglePartWishlist = useWishlistStore((s) => s.togglePartWishlist);

  const handleWishlistClick = async (e) => {
    e.stopPropagation();
    if (toggling) return;
    setToggling(true);
    try {
      await togglePartWishlist(part.id);
    } catch (err) {
      if (err?.message === 'AUTH_REQUIRED') {
        router.push('/login');
      }
    } finally {
      setToggling(false);
    }
  };

  const rawUrl = part.images?.[0]?.url || part.images?.[0] || null;
  const imgSrc = imgErr ? null : getImg(rawUrl);

  const conditionLabel = part.condition || 'Used';
  const conditionHex   = part.condition === 'NEW' ? '#10b981' : '#475569';

  return (
    <div
      onClick={onClick}
      className="bg-surface rounded-xl sm:rounded-2xl border border-theme overflow-hidden hover:-translate-y-0.5 transition-all cursor-pointer group w-full"
      style={{ boxShadow: 'var(--card-shadow)' }}
    >
      {/* ✅ FIX: image box + object-fit ab 100% inline style se control hota hai —
          Tailwind class purge/JIT config se bilkul independent, guaranteed chalega.
          Height clamp() CarsGridSection jaisa hi tight rakha (mobile par chhota).
          Background ab theme tokens se — light mein soft grey, dark mein soft
          charcoal, hardcoded #f3f4f6 ki bajaye. */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: 'clamp(88px, 22vw, 176px)',
          background: 'linear-gradient(135deg, var(--bg-surface-alt), var(--bg-surface))',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={part.name}
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
            className="group-hover:scale-105 transition-transform duration-300"
            onError={() => setImgErr(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-theme-muted">
            <Package size={24} className="sm:w-8 sm:h-8" />
          </div>
        )}

        {/* ✅ Gradient scrim — badges hamesha readable rahein (photo ke upar hai,
            is liye jaan-boojh kar theme-independent dark hai) */}
        <div
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0,
            height: '40px',
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.35), transparent)',
            pointerEvents: 'none',
          }}
        />

        {/* ✅ Wishlist heart button — top-right corner */}
        <button
          onClick={handleWishlistClick}
          disabled={toggling}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          style={{
            position: 'absolute',
            top: '5px',
            right: '5px',
            zIndex: 20,
            width: '26px',
            height: '26px',
            borderRadius: '50%',
            background: wishlisted ? '#ef4444' : 'rgba(0,0,0,0.45)',
            backdropFilter: 'blur(4px)',
            border: wishlisted ? '1.5px solid #ef4444' : '1.5px solid rgba(255,255,255,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: toggling ? 'default' : 'pointer',
            opacity: toggling ? 0.7 : 1,
            transition: 'all 0.2s ease',
            boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
          }}
        >
          {toggling ? (
            <Loader2 size={12} className="animate-spin" color="#fff" />
          ) : (
            <Heart
              size={13}
              fill={wishlisted ? '#fff' : 'none'}
              color='#fff'
              strokeWidth={2}
            />
          )}
        </button>

        {/* ✅ Badges: top-left, stacked, chhote font size mobile ke liye.
            Semantic status colors (green=new/slate=used/cyan=category)
            jaan-boojh kar theme se independent — inka meaning universal hai. */}
        <div style={{ position: 'absolute', top: '5px', left: '5px', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '3px', alignItems: 'flex-start' }}>
          <span style={{
            backgroundColor: conditionHex, color: '#fff', fontSize: '9px', fontWeight: 700,
            padding: '2px 6px', borderRadius: '999px', whiteSpace: 'nowrap',
            boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
          }}>
            {conditionLabel}
          </span>
          {part.category && (
            <span style={{
              backgroundColor: '#0891b2', color: '#fff', fontSize: '9px', fontWeight: 700,
              padding: '2px 6px', borderRadius: '999px', whiteSpace: 'nowrap', textTransform: 'capitalize',
              boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
            }}>
              {part.category}
            </span>
          )}
        </div>
      </div>

      {/* ✅ Mobile pe kam padding, chhote fonts — CarsGridSection jaisa */}
      <div className="p-2 sm:p-3">
        <p className="font-bold text-theme-primary text-[10px] sm:text-xs leading-tight line-clamp-2 transition-colors min-h-[26px] sm:min-h-[32px] group-hover:text-[var(--accent)]">
          {part.name}
        </p>
        <p className="font-extrabold text-[11px] sm:text-sm mt-0.5 sm:mt-1" style={{ color: 'var(--accent)' }}>
          PKR {Number(part.price).toLocaleString()}
        </p>
        <div className="text-theme-muted text-[8px] sm:text-[10px] mt-1 flex items-center gap-1">
          <MapPin size={8} className="shrink-0" />
          <span className="truncate">{part.store?.city || part.city || 'Pakistan'}</span>
        </div>
      </div>
    </div>
  );
}