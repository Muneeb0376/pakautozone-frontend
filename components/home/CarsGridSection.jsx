'use client';
// frontend/components/home/CarsGridSection.jsx
// "Tamam Cars" homepage grid. Fetches its own data. Includes HomepageCarCard sub-component.
//
// ✅ MOBILE FIX — Ab mobile par cars ek grid mein wrap nahi hote, balke
//    BrandsCarousel/BodyTypeSection jaisa horizontal scroll row hai — ek
//    time par ~3 cards line mein visible, baaki side-scroll se. Tablet/
//    desktop (sm+) par pehle jaisa grid layout (3/4 columns) intact hai.
//    Loading skeleton bhi isi pattern ko follow karta hai taake layout shift
//    na ho.
// ✅ WISHLIST FIX — Heart button ab localStorage ('car_wishlist') ki jagah
//    useWishlistStore (Zustand, backend-synced) use karta hai — bilkul
//    wahi store jo /wishlist page aur baaki CarCard use karte hain. Pehle
//    homepage se wishlist karne pe sirf localStorage update hota tha,
//    isliye /wishlist page pe kabhi show hi nahi hota tha.
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Gauge, Car, ArrowRight, Heart, Loader2 } from 'lucide-react';
import { useLang } from '@/lib/i18nContext';
import { useWishlistStore } from '@/store/wishlistStore';
import { API, getImg } from './homeConstants';

export default function CarsGridSection() {
  const router = useRouter();
  const { t } = useLang();
  const [cars, setCars] = useState([]);
  const [loadingCars, setLoadingCars] = useState(true);

  // ✅ Store ki wishlist ids ek baar fetch kar lo taake heart icons sahi
  // (filled/unfilled) state ke sath render hon — logged-out user ke liye
  // fetchWishlist khud hi no-op hai (store ke andar hasToken() check hai).
  const fetchWishlist = useWishlistStore((s) => s.fetchWishlist);
  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  useEffect(() => {
    setLoadingCars(true);
    fetch(`${API}/cars?limit=8`)
      .then(r => r.json())
      .then(d => {
        const arr = Array.isArray(d) ? d : (d.data || []);
        setCars(arr);
      })
      .catch(() => setCars([]))
      .finally(() => setLoadingCars(false));
  }, []);

  return (
    <>
      {/* ━━━━━━ TAMAM CARS ━━━━━━ */}
      <section className="relative left-1/2 right-1/2 -mx-[50vw] w-screen py-10 sm:py-16 px-4 bg-surface-alt">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-5 sm:mb-8">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-theme-primary">{t('home.allCarsHeading')}</h2>
              <p className="text-theme-muted text-xs sm:text-sm mt-1">{t('home.latestListings')}</p>
            </div>
            <button
              onClick={() => router.push('/cars')}
              className="text-amber-500 hover:text-amber-400 text-xs sm:text-sm font-semibold flex items-center gap-1 transition-colors shrink-0"
            >
              {t('home.advancedFilters')} <ArrowRight size={14} />
            </button>
          </div>

          {loadingCars ? (
            <>
              {/* ── MOBILE: horizontal scroll skeleton (3-up) ── */}
              <div className="sm:hidden flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 no-scrollbar">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex-shrink-0 w-[16rem] homepage-mobile-card bg-surface rounded-xl overflow-hidden shadow-sm animate-pulse">
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
                  <div key={i} className="bg-surface rounded-2xl overflow-hidden shadow-sm animate-pulse">
                    <div className="h-40 skeleton-block" />
                    <div className="p-3 space-y-2">
                      <div className="h-3 skeleton-block rounded w-3/4" />
                      <div className="h-4 skeleton-block rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : cars.length === 0 ? (
            <div className="text-center py-16 text-theme-muted">
              <p>{t('home.noCars')}</p>
            </div>
          ) : (
            <>
              {/* ── MOBILE: horizontal scroll, 3-up, scroll for more ── */}
              <div className="sm:hidden flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 -mx-4 px-4 no-scrollbar">
                {cars.map(car => (
                  <div key={car.id} className="flex-shrink-0 w-[16rem] snap-start homepage-mobile-card">
                    <HomepageCarCard car={car} onClick={() => router.push(`/cars/${car.id}`)} />
                  </div>
                ))}
              </div>

              {/* ── TABLET/DESKTOP: grid ── */}
              <div className="hidden sm:grid sm:grid-cols-3 lg:grid-cols-4 gap-5">
                {cars.map(car => (
                  <HomepageCarCard
                    key={car.id}
                    car={car}
                    onClick={() => router.push(`/cars/${car.id}`)}
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
            .homepage-mobile-card > div > div:first-child {
              height: 160px !important;
            }
          }
        `}</style>
      </section>
    </>
  );
}

// ─── HOMEPAGE CAR CARD ────────────────────────────────────
function HomepageCarCard({ car, onClick }) {
  const router = useRouter();
  const { t } = useLang();
  const [imgErr, setImgErr] = useState(false);
  const [toggling, setToggling] = useState(false);

  // ✅ Backend-synced wishlist state — same store used by /wishlist page
  const wishlisted = useWishlistStore((s) => s.isWished(car.id));
  const toggleWishlist = useWishlistStore((s) => s.toggleWishlist);

  const handleWishlistClick = async (e) => {
    e.stopPropagation();
    if (toggling) return;
    setToggling(true);
    try {
      await toggleWishlist(car.id);
    } catch (err) {
      if (err?.message === 'AUTH_REQUIRED') {
        router.push('/login');
      }
      // baaki errors ke liye store khud rollback kar deta hai — UI purani
      // state pe wapas aa jaati hai
    } finally {
      setToggling(false);
    }
  };

  const images = car.carImages || car.images || [];
  const rawUrl = images[0] || null;
  const imgSrc = imgErr ? null : getImg(rawUrl);

  // ✅ Condition badge labels & colors — HEX values direct use kiye (Tailwind
  // classes ki jagah), taake build/purge config se bilkul independent ho aur
  // guaranteed render ho (is project mein Tailwind classes fail hone ka
  // pehle se history raha hai — car detail page mein bhi isi wajah se
  // inline-style fallback use hua tha).
  const CONDITION_LABELS = { NEW: 'New Car', USED: 'Used', CERTIFIED_PREOWNED: 'Certified Pre-Owned' };
  const CONDITION_HEX    = { NEW: '#10b981', USED: '#475569', CERTIFIED_PREOWNED: '#f59e0b' };
  const conditionLabel = CONDITION_LABELS[car.condition] || car.condition;
  const conditionHex   = CONDITION_HEX[car.condition] || '#374151';
  const showExchangeBadge = car.isForExchange === true;
  const hasBadges = Boolean(car.condition || showExchangeBadge);

  return (
    <div
      onClick={onClick}
      className="bg-surface rounded-xl sm:rounded-2xl border border-theme overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group w-full"
    >
      {/* ✅ FIX: image box + object-fit ab 100% inline style se control hota hai —
          Tailwind class purge/JIT config se bilkul independent, guaranteed chalega */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: 'clamp(88px, 22vw, 176px)',
          background: 'linear-gradient(135deg, var(--bg-surface-alt), var(--card-bg))',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={car.title || car.model}
            loading="lazy"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              display: 'block',
            }}
            className="group-hover:scale-105 transition-transform duration-300"
            onError={() => setImgErr(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-theme-muted">
            <Car size={24} className="sm:w-8 sm:h-8" />
          </div>
        )}

        {/* ✅ Gradient scrim — badges hamesha readable rahein, image content kuch bhi ho */}
        {hasBadges && (
          <div
            style={{
              position: 'absolute',
              top: 0, left: 0, right: 0,
              height: '40px',
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.35), transparent)',
              pointerEvents: 'none',
            }}
          />
        )}

        {/* ✅ Wishlist heart button — top-right corner, always visible */}
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
              color={wishlisted ? '#fff' : '#fff'}
              strokeWidth={2}
            />
          )}
        </button>

        {/* ✅ Badges: top-left, stacked */}
        <div style={{ position: 'absolute', top: '5px', left: '5px', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '3px', alignItems: 'flex-start' }}>
          {car.condition && (
            <span style={{
              backgroundColor: conditionHex, color: '#fff', fontSize: '9px', fontWeight: 700,
              padding: '2px 6px', borderRadius: '999px', whiteSpace: 'nowrap',
              boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
            }}>
              {conditionLabel}
            </span>
          )}
          {showExchangeBadge && (
            <span style={{
              backgroundColor: '#9333ea', color: '#fff', fontSize: '9px', fontWeight: 700,
              padding: '2px 6px', borderRadius: '999px', whiteSpace: 'nowrap',
              boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
            }}>{t('car.exchange')}</span>
          )}
        </div>
      </div>
      {/* ✅ Mobile pe kam padding */}
      <div className="p-2 sm:p-3">
        <p className="font-bold text-theme-primary text-[10px] sm:text-xs leading-tight line-clamp-2 group-hover:text-amber-600 transition-colors min-h-[26px] sm:min-h-[32px]">
          {car.title || `${car.year} ${car.brand} ${car.model}`}
        </p>
        <p className="text-amber-600 font-extrabold text-[11px] sm:text-sm mt-0.5 sm:mt-1">
          PKR {Number(car.price).toLocaleString()}
        </p>
        {/* ✅ FIX: flex-wrap add kiya taake chhoti screen pe city + mileage overlap
            na hon — ab zaroorat pade to doosri line pe wrap ho jayenge. City ko
            truncate kiya taake lamba naam mileage ko push out na kare. */}
        <div className="text-theme-muted text-[8px] sm:text-[10px] mt-1 flex items-center flex-wrap gap-x-1 gap-y-0.5">
          <span className="flex items-center gap-0.5 max-w-full min-w-0">
            <MapPin size={8} className="shrink-0" />
            <span className="truncate">{car.city || car.store?.city || 'Pakistan'}</span>
          </span>
          {car.mileage > 0 && (
            <span className="flex items-center gap-0.5 shrink-0">
              <Gauge size={8} className="shrink-0" />
              {Number(car.mileage).toLocaleString()} km
            </span>
          )}
        </div>
      </div>
    </div>
  );
}