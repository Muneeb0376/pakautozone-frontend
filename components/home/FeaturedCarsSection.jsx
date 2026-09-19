'use client';
// frontend/components/home/FeaturedCarsSection.jsx
//
// ✅ NAYI FILE — Issue 2 ka \"Boost\" wala hissa
//
// Aap ka masla: seller dashboard mein har car ke saath \"Boost\" button hai,
// lekin boost karne ke baad car kahin pehle number par nahi aati — yani boost
// ka koi faida nazar nahi aata.
//
// Wajah: boost sirf `Car.isFeatured = true` set karta tha, aur homepage par
// aisi koi jagah hi nahi thi jahan featured cars alag dikhein. Backend mein
// support pehle se maujood tha:
//     src/utils/filter.utils.js  →  ?isFeatured=true
//     src/services/car.service.js → orderBy: [{ isFeatured: 'desc' }, ...]
//
// Ab ye section homepage par ek \"Featured Cars\" row banata hai jo sirf boosted
// listings dikhati hai — aur kyunki `getAllCars` ka orderBy pehle se
// isFeatured ko upar rakhta hai, wahi car neeche \"All Cars\" grid mein bhi
// apni normal jagah par mojood rehti hai, bas sab se upar. Aap ne yahi kaha
// tha: \"wo uder aur simple car wali jagah per bhi show ho\".
//
// Agar koi car boost nahi hui to ye section render hi nahi hota (null return) —
// khali heading \"Featured Cars\" ke neeche khali jagah nahi rehti.

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MapPin, Gauge, Fuel, ArrowRight, Heart, Loader2, TrendingUp, Car as CarIcon } from 'lucide-react';

import { useLang } from '@/lib/i18nContext';
import { useWishlistStore } from '@/store/wishlistStore';
import { API, getImg } from '@/components/home/homeConstants';
import { formatPrice } from '@/lib/formatPrice';
import { carTitle, toTitleCase, humanizeEnum } from '@/lib/textCase';

const tx = (t, key, fallback) => {
  const out = t(key);
  return !out || out === key ? fallback : out;
};

/* ─────────────────────────────────────────────
   Ek featured car ka card
   ───────────────────────────────────────────── */
function FeaturedCard({ car, onOpen }) {
  const { t } = useLang();
  const img = getImg(car.carImages?.[0] || car.images?.[0]);

  // ⚠️ Store ka shape: `ids` ek Set hai aur `isWished(id)` uska helper.
  // (CarsGridSection bhi bilkul yehi do cheezein use karta hai — dono
  // rows ka heart hamesha ek jaisa rehta hai.)
  const liked = useWishlistStore((s) => s.isWished(car.id));
  const toggle = useWishlistStore((s) => s.toggleWishlist);

  return (
    <article
      className="group relative shrink-0 w-[16rem] sm:w-auto rounded-2xl overflow-hidden flex flex-col cursor-pointer transition-transform duration-200 hover:-translate-y-1"
      onClick={() => onOpen(car.id)}
      style={{
        background: 'var(--card-bg)',
        // Featured card ko border se hi alag pehchan di — koi cartoon
        // ribbon/star nahi, sirf ek patli gold line jo premium lagti hai.
        border: '1.5px solid rgba(232,184,75,0.55)',
        boxShadow: '0 10px 30px -14px rgba(232,184,75,0.45)',
      }}
    >
      {/* ── Image ── */}
      {/* ✅ FIX: car poori dikhe — image ab `object-contain` hai (bilkul "All Cars" card jaisa),
          `object-cover` isay zoom karke kaat deta tha. Background bhi wahi gradient hai. */}
      <div
        className="relative aspect-[16/10] overflow-hidden"
        style={{ background: 'linear-gradient(135deg, var(--bg-surface-alt), var(--card-bg))' }}
      >
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={img}
            alt={carTitle(car)}
            loading="lazy"
            className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <CarIcon size={34} strokeWidth={1.2} style={{ color: 'var(--text-muted)' }} />
          </div>
        )}

        {/* Featured badge — text based, emoji nahi */}
        <span
          className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md"
          style={{
            background: 'var(--accent)',
            color: 'var(--accent-text)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
          }}
        >
          <TrendingUp size={11} strokeWidth={3} />{t('common.featured')}</span>

        <button
          type="button"
          aria-label="Wishlist"
          onClick={(e) => { e.stopPropagation(); toggle?.(car.id); }}
          className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm transition-colors"
          style={{ background: 'rgba(0,0,0,0.35)' }}
        >
          <Heart size={15} fill={liked ? '#ef4444' : 'none'} color={liked ? '#ef4444' : '#fff'} />
        </button>
      </div>

      {/* ── Body ── */}
      <div className="p-3.5 flex flex-col grow">
        <h3
          className="font-bold text-[15px] leading-snug line-clamp-1"
          style={{ color: 'var(--text-primary)' }}
        >
          {carTitle(car) || toTitleCase(car.title)}
        </h3>

        <p className="text-lg font-black mt-1" style={{ color: 'var(--accent)' }}>
          {formatPrice(car.price)}
        </p>

        <div
          className="flex items-center gap-3 flex-wrap text-[11px] mt-2.5 pt-2.5"
          style={{ color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)' }}
        >
          {car.city && (
            <span className="flex items-center gap-1">
              <MapPin size={12} /> {toTitleCase(car.city)}
            </span>
          )}
          {car.mileage ? (
            <span className="flex items-center gap-1">
              <Gauge size={12} /> {Number(car.mileage).toLocaleString('en-US')} km
            </span>
          ) : null}
          {car.fuelType && (
            <span className="flex items-center gap-1">
              <Fuel size={12} /> {humanizeEnum(car.fuelType)}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

/* ─────────────────────────────────────────────
   Section
   ───────────────────────────────────────────── */
export default function FeaturedCarsSection({ limit = 8 }) {
  const router = useRouter();
  const { t } = useLang();

  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchWishlist = useWishlistStore((s) => s.fetchWishlist);
  useEffect(() => { fetchWishlist?.(); }, [fetchWishlist]);

  useEffect(() => {
    let alive = true;
    setLoading(true);

    fetch(`${API}/cars?isFeatured=true&limit=${limit}`)
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        const arr = Array.isArray(d) ? d : (d.data || d.cars || []);
        setCars(arr);
      })
      .catch(() => alive && setCars([]))
      .finally(() => alive && setLoading(false));

    return () => { alive = false; };
  }, [limit]);

  // Loading ke doran ek chhota skeleton — layout jump se bachne ke liye
  if (loading) {
    return (
      <section className="relative left-1/2 right-1/2 -mx-[50vw] w-screen py-10 sm:py-14 px-4" style={{ background: 'var(--bg-surface-alt)' }}>
        <div className="max-w-6xl mx-auto flex items-center justify-center h-40">
          <Loader2 size={22} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
        </div>
      </section>
    );
  }

  // Koi boosted car nahi → section bilkul mat dikhao
  if (cars.length === 0) return null;

  return (
    <section className="relative left-1/2 right-1/2 -mx-[50vw] w-screen py-10 sm:py-14 px-4" style={{ background: 'var(--bg-surface-alt)' }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-end justify-between mb-5 sm:mb-7 gap-4">
          <div>
            <h2
              className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2.5"
              style={{ color: 'var(--text-primary)' }}
            >
              <span className="w-1 h-6 rounded-full" style={{ background: 'var(--accent)' }} />
              {tx(t, 'home.featuredCars', 'Featured Cars')}
            </h2>
            <p className="text-xs sm:text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              {tx(t, 'home.featuredCarsSub', 'Sellers ki boost ki hui listings — sab se upar')}
            </p>
          </div>

          <Link
            href="/cars?isFeatured=true"
            className="shrink-0 flex items-center gap-1.5 text-sm font-bold transition-opacity hover:opacity-75"
            style={{ color: 'var(--accent)' }}
          >
            {tx(t, 'common.viewAll', 'Sab dekhein')}
            <ArrowRight size={15} />
          </Link>
        </div>

        {/* Mobile par horizontal scroll, sm+ par grid — bilkul
            CarsGridSection jaisa pattern, taake dono row ek jaisi lagen */}
        <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto sm:overflow-visible pb-2 sm:pb-0 -mx-4 px-4 sm:mx-0 sm:px-0 no-scrollbar">
          {cars.map((car) => (
            <FeaturedCard key={car.id} car={car} onOpen={(id) => router.push(`/cars/${id}`)} />
          ))}
        </div>
      </div>

      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { scrollbar-width: none; -ms-overflow-style: none; }
      `}</style>
    </section>
  );
}