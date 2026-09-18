'use client';
// frontend/components/cars/CarCard.jsx
//
// ✅ POORI FILE REPLACE — Phase 4
//
// ══ SCREENSHOT 3 MEIN JO GHALAT DIKH RAHA THA ══
//
// 1. CARD PAR NAAM SIRF "Kia" THA
//    Wajah: card `car.title` seedha dikhata tha. Us listing ka title
//    database mein bas "Kia" hai (purana form title khud nahi banata
//    tha, user ne ek lafz likh diya). Ab card samajhdar hai — agar
//    title ek hi lafz ka ho to brand + model + year se poora naam khud
//    bana leta hai.
//
// 2. PRICE KAT RAHA THA — "PKR 23.2…"
//    Wajah: related cars 3-column grid mein thay, aur card ka design
//    horizontal row hai (image baayein, text daayein). Tang khaane mein
//    price truncate ho jati thi. Ab `compact` variant ek BILKUL ALAG
//    vertical layout use karta hai (image upar, text neeche) — tang
//    jagah ke liye wahi theek hai.
//
// 3. IMAGE GHALAT THI (blog ki tasveer car par)
//    Ye card ka masla NAHI — us listing ke `carImages` mein database ke
//    andar hi ghalat URL para hai. Purana `updateCar` poori request body
//    ko spread kar deta tha, jis se kisi aur upload ka URL car par chipak
//    sakta tha. Phase 2 ke car.controller.js mein wo theek ho chuka hai
//    (ab sirf allowed fields update hote hain). Purani ghalat entry saaf
//    karne ka tareeqa README mein hai.
//
// ══ CARTOON HATAYA ══
//    • 🚗 emoji fallback → lucide ka line icon
//    • text-blue-600 price aur border-blue-600 button → var(--accent)
//    • bg-purple-600 exchange badge → gold tint
//    • condition badge ke emerald/slate/amber teen rang → ek neutral shakal

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  MapPin, Heart, ArrowRight, Gauge, BadgeCheck, Camera,
  Calendar, Fuel, Settings2, Clock, Car as CarIcon, ArrowLeftRight,
  TrendingUp,
} from 'lucide-react';

import { useWishlistStore, hasToken } from '@/store/wishlistStore';
import { getCardImageUrl } from '@/lib/carImage';
import { formatPrice } from '@/lib/formatPrice';
import { toTitleCase, humanizeEnum } from '@/lib/textCase';
import { useLang } from '@/lib/i18nContext';

// Backend enum → i18n key. Text yahan nahi hota, sirf key —
// is se card teeno zabanon mein sahi label dikhata hai.
const CONDITION_KEYS = {
  NEW: 'common.new',
  USED: 'car.used',
  CERTIFIED_PREOWNED: 'car.certifiedShort',
};

/* ─────────────────────────────────────────────────────────────
   Card par kya naam likha jaye

   Agar title mein do ya zyada lafz hain to user ka apna title
   rakhte hain — wo hamesha zyada maloomati hota hai
   ("Toyota Corolla 2022 GLI"). Ek hi lafz ho to brand + model +
   year se poora naam bana lete hain.
   ───────────────────────────────────────────────────────────── */
function displayName(car, t) {
  const parts = [car.brand, car.model, car.year].filter(Boolean).map(String);
  const built = parts.length >= 2 ? toTitleCase(parts.join(' ')) : '';

  const title = String(car.title || '').trim();
  const words = title ? title.split(/\s+/).length : 0;

  if (words >= 2) return toTitleCase(title);
  return built || toTitleCase(title) || (t ? t('car.genericName') : 'Car');
}

/* timeAgo ko `t` parameter ke zariye zaban milti hai.
   Ye plain function hai, React component nahi — is liye yahan
   useLang() hook lagana ghalat hota, `t` bahar se aata hai. */
function timeAgo(dateStr, t) {
  if (!dateStr) return null;
  const diff = Date.now() - new Date(dateStr).getTime();
  if (diff < 0) return null;

  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t('common.justNow');
  if (mins < 60) return `${t('common.minutes', { n: mins })} ${t('common.ago')}`;

  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${t('common.hours', { n: hrs })} ${t('common.ago')}`;

  const days = Math.floor(hrs / 24);
  if (days < 30) return `${t('common.days', { n: days })} ${t('common.ago')}`;

  const months = Math.floor(days / 30);
  return `${t('common.months', { n: months })} ${t('common.ago')}`;
}

/* ── Image ── */
function Cover({ car, images, showCount = true }) {
  const { t } = useLang();
  const first = images.length > 0 ? getCardImageUrl(images[0]) : null;
  const second = images.length > 1 ? getCardImageUrl(images[1]) : null;

  if (!first) {
    return (
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ background: 'var(--bg-surface-alt)' }}
      >
        <CarIcon size={26} strokeWidth={1.2} style={{ color: 'var(--text-muted)' }} />
      </div>
    );
  }

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={first}
        alt={displayName(car, t)}
        loading="lazy"
        decoding="async"
        className="absolute inset-0 transition-transform duration-500 group-hover:scale-[1.04]"
        style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center' }}
        onError={(e) => {
          // Pehli image toot jaye to doosri, phir icon
          if (second && e.currentTarget.src !== second) {
            e.currentTarget.onerror = null;
            e.currentTarget.src = second;
          } else {
            e.currentTarget.style.display = 'none';
            e.currentTarget.parentElement
              ?.querySelector('.paz-img-fallback')
              ?.classList.remove('hidden');
          }
        }}
      />

      <div
        className="paz-img-fallback hidden absolute inset-0 items-center justify-center"
        style={{ background: 'var(--bg-surface-alt)' }}
      >
        <CarIcon size={26} strokeWidth={1.2} style={{ color: 'var(--text-muted)' }} />
      </div>

      {showCount && images.length > 1 && (
        <span
          className="absolute bottom-1.5 end-1.5 z-10 flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded backdrop-blur-sm"
          style={{ background: 'rgba(0,0,0,0.65)', color: '#fff' }}
        >
          <Camera size={10} />
          {images.length}
        </span>
      )}
    </>
  );
}

/* ── Badges ── */
function Badges({ car }) {
  const { t } = useLang();
  const condition = t(CONDITION_KEYS[car.condition] || CONDITION_KEYS.USED);

  return (
    <div className="absolute top-1.5 start-1.5 z-10 flex flex-col items-start gap-1">
      {car.isFeatured && (
        <span
          className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded"
          style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
        >
          <TrendingUp size={9} strokeWidth={3} /> {t('common.featured')}
        </span>
      )}

      <span
        className="text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded backdrop-blur-sm"
        style={{ background: 'rgba(10,10,10,0.62)', color: '#fff' }}
      >
        {condition}
      </span>

      {car.isForExchange && (
        <span
          className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded backdrop-blur-sm"
          style={{ background: 'rgba(10,10,10,0.62)', color: '#f0d79a' }}
        >
          <ArrowLeftRight size={9} /> {t('car.exchange')}
        </span>
      )}
    </div>
  );
}

export default function CarCard({ car, variant = 'full' }) {
  const router = useRouter();
  const { t, lang } = useLang();
  const isCompact = variant === 'compact';

  const wished = useWishlistStore((s) => s.isWished(car.id));
  const toggleWishlist = useWishlistStore((s) => s.toggleWishlist);
  const fetchWishlist = useWishlistStore((s) => s.fetchWishlist);

  useEffect(() => {
    const state = useWishlistStore.getState();
    if (!state.initialized && !state.loading) fetchWishlist();
  }, [fetchWishlist]);

  const handleWishlist = async (e) => {
    e.stopPropagation();
    if (!hasToken()) { router.push('/login'); return; }
    try {
      await toggleWishlist(car.id);
    } catch (err) {
      console.error('Wishlist update failed:', err);
    }
  };

  const images = car.carImages || car.images || [];
  const name = displayName(car, t);
  const city = car.city || car.store?.city;
  // Urdu mein bhi ginti Latin hi rakhte hain (readable), sirf unit translate hoti hai
  const mileage = car.mileage
    ? `${Number(car.mileage).toLocaleString('en-US')} ${t('common.km')}`
    : null;
  const fuel = car.fuelType ? humanizeEnum(car.fuelType) : null;
  const transmission = car.transmission ? humanizeEnum(car.transmission) : null;
  const updated = timeAgo(car.updatedAt || car.createdAt, t);

  const shell = {
    background: 'var(--card-bg)',
    border: car.isFeatured ? '1.5px solid rgba(232,184,75,0.55)' : '1px solid var(--border-color)',
    boxShadow: 'var(--card-shadow)',
  };

  /* ══════════════════════════════════════════════════════════
     COMPACT — related cars / sidebars.
     Layout AB VERTICAL hai (image upar, text neeche).
     Pehle ye bhi horizontal row tha aur 3-column grid mein
     squeeze ho kar price kaat deta tha — screenshot 3 wala masla.
     ══════════════════════════════════════════════════════════ */
  if (isCompact) {
    return (
      <article
        onClick={() => router.push(`/cars/${car.id}`)}
        className="group flex flex-col rounded-xl overflow-hidden cursor-pointer transition-transform duration-200 hover:-translate-y-1"
        style={shell}
      >
        <div
          className="relative aspect-[16/10] overflow-hidden"
          style={{ background: 'var(--bg-surface-alt)' }}
        >
          <Cover car={car} images={images} showCount={false} />
          <Badges car={car} />
        </div>

        <div className="p-3 flex flex-col grow">
          <h3
            className="font-bold text-[13.5px] leading-snug line-clamp-2 mb-1.5"
            style={{ color: 'var(--text-primary)' }}
          >
            {name}
          </h3>

          {city && (
            <p className="flex items-center gap-1 text-[11px] mb-2" style={{ color: 'var(--text-muted)' }}>
              <MapPin size={11} className="shrink-0" />
              {toTitleCase(city)}
            </p>
          )}

          <div
            className="flex items-center flex-wrap gap-x-2.5 gap-y-1 text-[11px] mb-2.5"
            style={{ color: 'var(--text-muted)' }}
          >
            {car.year && <span className="flex items-center gap-1"><Calendar size={10} />{car.year}</span>}
            {mileage && <span className="flex items-center gap-1"><Gauge size={10} />{mileage}</span>}
            {fuel && <span className="flex items-center gap-1"><Fuel size={10} />{fuel}</span>}
          </div>

          {/* Price — ab poori nazar aati hai */}
          <p
            className="mt-auto pt-2.5 text-[15px] font-black tracking-tight"
            style={{ color: 'var(--accent)', borderTop: '1px solid var(--border-color)' }}
          >
            {formatPrice(car.price)}
          </p>
        </div>
      </article>
    );
  }

  /* ══════════════════════════════════════════════════════════
     FULL — /cars ki fehrist ke liye horizontal row
     ══════════════════════════════════════════════════════════ */
  return (
    <article
      onClick={() => router.push(`/cars/${car.id}`)}
      className="group flex flex-row rounded-xl sm:rounded-2xl overflow-hidden cursor-pointer w-full transition-transform duration-200 hover:-translate-y-0.5"
      style={shell}
    >
      <div
        className="relative w-28 min-[420px]:w-32 sm:w-52 md:w-60 shrink-0 overflow-hidden"
        style={{ background: 'var(--bg-surface-alt)' }}
      >
        <Cover car={car} images={images} />
        <Badges car={car} />
      </div>

      <div className="flex-1 min-w-0 flex flex-col justify-between p-2.5 sm:p-4">
        <div>
          <h3
            className="font-bold text-[13px] sm:text-base leading-snug line-clamp-1"
            style={{ color: 'var(--text-primary)' }}
          >
            {name}
          </h3>

          {city && (
            <p className="flex items-center gap-1 text-[10px] sm:text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              <MapPin size={11} className="shrink-0" />
              {toTitleCase(city)}
            </p>
          )}

          <div
            className="flex items-center flex-wrap gap-x-2 sm:gap-x-2.5 gap-y-1 text-[10px] sm:text-xs mt-1.5"
            style={{ color: 'var(--text-muted)' }}
          >
            {car.year && <span className="flex items-center gap-1"><Calendar size={11} className="shrink-0" />{car.year}</span>}
            {mileage && <span className="flex items-center gap-1"><Gauge size={11} className="shrink-0" />{mileage}</span>}
            {fuel && <span className="hidden min-[420px]:flex items-center gap-1"><Fuel size={11} className="shrink-0" />{fuel}</span>}
            {transmission && <span className="hidden sm:flex items-center gap-1"><Settings2 size={11} className="shrink-0" />{transmission}</span>}
          </div>

          {car.store?.isVerified && (
            <span
              className="inline-flex items-center gap-1 text-[9px] sm:text-[11px] font-bold mt-1.5"
              style={{ color: '#059669' }}
            >
              <BadgeCheck size={11} className="shrink-0" />
              {t('seller.verifiedDealer')}
            </span>
          )}
        </div>

        <div
          className="flex items-end justify-between gap-2 mt-2 pt-2"
          style={{ borderTop: '1px solid var(--border-color)' }}
        >
          <div className="min-w-0">
            {updated && (
              <p
                className="flex items-center gap-1 text-[9px] sm:text-[10px] mb-0.5 sm:mb-1 truncate"
                style={{ color: 'var(--text-muted)' }}
              >
                <Clock size={9} className="shrink-0" />
                {updated}
              </p>
            )}
            <p
              className="text-[15px] sm:text-lg font-black tracking-tight truncate"
              style={{ color: 'var(--accent)' }}
            >
              {formatPrice(car.price)}
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={handleWishlist}
              title={wished ? t('wishlist.removeTitle') : t('wishlist.addTitle')}
              aria-label={wished ? t('wishlist.removeTitle') : t('wishlist.addTitle')}
              className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg transition-transform active:scale-90"
              style={
                wished
                  ? { background: 'rgba(220,38,38,0.10)', border: '1px solid rgba(220,38,38,0.35)', color: '#dc2626' }
                  : { background: 'var(--bg-surface-alt)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }
              }
            >
              <Heart size={14} fill={wished ? 'currentColor' : 'none'} />
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); router.push(`/cars/${car.id}`); }}
              className="flex items-center gap-1 text-[10px] sm:text-xs font-bold py-1.5 px-2 sm:px-3 rounded-lg transition-colors"
              style={{ border: '1.5px solid var(--accent)', color: 'var(--accent)', background: 'transparent' }}
            >
              {/* Chhoti screen par chhota lafz, bari screen par poora — dono translated */}
              <span className="hidden min-[420px]:inline">{t('common.viewDetails')}</span>
              <span className="min-[420px]:hidden">{t('common.view')}</span>
              <ArrowRight size={12} className={lang === 'ur' ? 'rotate-180' : ''} />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}