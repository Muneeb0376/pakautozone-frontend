'use client';
import { useLang } from '@/lib/i18nContext';
// frontend/app/(main)/wishlist/page.jsx
// ✅ Cars + Parts dono tabs
// ✅ Counting properly show hoti hai
// ✅ Card design matches CarCard.jsx (screenshot jaisi)
// ✅ Image bug fixed (no hardcoded IP)
// ✅ Theme tokens use kiye (dark mode support)

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Heart, Trash2, Loader2, MapPin, Calendar,
  Gauge, ArrowRight, Car, Wrench, Tag, Package
} from 'lucide-react';
import { useWishlistStore } from '@/store/wishlistStore';

const API  = process.env.NEXT_PUBLIC_API_URL || '/api';
const BASE = API.replace(/\/api$/, '');

function getImageUrl(img) {
  if (!img) return null;
  const raw = typeof img === 'string' ? img : (img.url || img.filename);
  if (!raw) return null;
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
  return `${BASE}${raw.startsWith('/') ? '' : '/uploads/'}${raw}`;
}

const CONDITION_LABELS = {
  NEW: 'New Car',
  USED: 'Used',
  CERTIFIED_PREOWNED: 'CPO'
};
const CONDITION_HEX = {
  NEW: '#10b981',
  USED: '#475569',
  CERTIFIED_PREOWNED: '#f59e0b'
};

// ─── Car Card ─────────────────────────────────────────────────────────────────
function CarCard({ car, onRemove }) {
  const router = useRouter();
  const { t } = useLang();
  const activeImages = car.carImages || car.images || [];
  const displayImage = getImageUrl(activeImages[0]);
  const conditionLabel = CONDITION_LABELS[car.condition] || car.condition;
  const conditionHex   = CONDITION_HEX[car.condition] || '#475569';
  const location = car.city || car.store?.city;

  return (
    <div
      className="rounded-2xl border overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group flex flex-col"
      style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)' }}
    >
      {/* Image */}
      {/* ✅ FIX: Tailwind classes (aspect-[16/10], absolute, inset-0, object-cover)
          purge/JIT config ki wajah se render nahi ho rahi thin — 100% inline styles
          use kiye (same pattern as CarsGridSection & FeaturedCarsSection).
          object-cover → object-contain taake poori car dikhe, zoom na ho. */}
      <Link href={`/cars/${car.id}`} className="block">
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: 'clamp(140px, 22vw, 200px)',
            background: 'var(--bg-surface-alt)',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {displayImage ? (
            <img
              src={displayImage}
              alt={car.title || `${car.brand} ${car.model}`}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                display: 'block',
              }}
              className="group-hover:scale-105 transition-transform duration-500"
              onError={(e) => {
                e.target.onerror = null;
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div
            style={{
              display: displayImage ? 'none' : 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              position: 'absolute',
              inset: 0,
              background: 'var(--bg-surface-alt)',
            }}
          >
            <span style={{ fontSize: '28px' }}>🚗</span>
            <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)' }}>{t('wishlist.noImage')}</span>
          </div>

          {/* Condition Badge */}
          {car.condition && (
            <span
              style={{
                position: 'absolute', top: '8px', left: '8px',
                backgroundColor: conditionHex, color: '#fff',
                fontSize: '10px', fontWeight: 700,
                padding: '2px 7px', borderRadius: '6px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
              }}
            >
              {conditionLabel}
            </span>
          )}

          {/* Exchange Badge */}
          {car.isForExchange && (
            <span
              style={{
                position: 'absolute', top: '8px', right: '8px',
                backgroundColor: '#8b5cf6', color: '#fff',
                fontSize: '10px', fontWeight: 700,
                padding: '2px 7px', borderRadius: '6px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
              }}
            >
              {t('car.exchange')}
            </span>
          )}
        </div>
      </Link>

      {/* Info */}
      <div className="p-3 flex flex-col flex-1">
        <Link href={`/cars/${car.id}`}>
          <h3
            className="font-bold text-sm leading-snug truncate hover:underline"
            style={{ color: 'var(--text-primary)' }}
          >
            {car.title || `${car.year} ${car.brand} ${car.model}`}
          </h3>
        </Link>

        {/* Specs row */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-[11px]"
          style={{ color: 'var(--text-secondary)' }}>
          {location && (
            <span className="flex items-center gap-0.5">
              <MapPin size={10} /> {location}
            </span>
          )}
          {car.year && (
            <span className="flex items-center gap-0.5">
              <Calendar size={10} /> {car.year}
            </span>
          )}
          {car.mileage != null && (
            <span className="flex items-center gap-0.5">
              <Gauge size={10} /> {Number(car.mileage).toLocaleString()} km
            </span>
          )}
        </div>

        {/* Price + Actions */}
        <div
          className="flex items-center justify-between mt-auto pt-3 border-t mt-3"
          style={{ borderColor: 'var(--border-color)' }}
        >
          <p className="font-black text-base" style={{ color: 'var(--accent)' }}>
            PKR {Number(car.price).toLocaleString()}
          </p>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onRemove(car.id)}
              title={t('common.remove')}
              className="flex items-center justify-center w-7 h-7 rounded-lg border text-red-400 hover:bg-red-500/10 hover:text-red-500 transition-colors"
              style={{ borderColor: 'var(--border-color)' }}
            >
              <Trash2 size={13} />
            </button>
            <button
              onClick={() => window.location.href = `/cars/${car.id}`}
              className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-lg transition-all hover:opacity-90"
              style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
            >{t('common.view')}<ArrowRight size={11} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Part Card ────────────────────────────────────────────────────────────────
function PartCard({ part, onRemove }) {
  const { t } = useLang();
  const displayImage = getImageUrl(part.images?.[0]);

  const COND_COLOR = {
    New: '#10b981',
    Used: '#475569',
    Refurbished: '#f59e0b',
  };
  const condColor = COND_COLOR[part.condition] || '#475569';

  return (
    <div
      className="rounded-2xl border overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group flex flex-col"
      style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)' }}
    >
      {/* Image */}
      {/* ✅ FIX: Same inline styles fix as CarCard above — Tailwind purge issue
          + object-cover → object-contain taake part poora dikhe. */}
      <Link href={`/parts/${part.id}`} className="block">
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: 'clamp(140px, 22vw, 200px)',
            background: 'var(--bg-surface-alt)',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {displayImage ? (
            <img
              src={displayImage}
              alt={part.name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                display: 'block',
              }}
              className="group-hover:scale-105 transition-transform duration-500"
              onError={(e) => {
                e.target.onerror = null;
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div
            style={{
              display: displayImage ? 'none' : 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              position: 'absolute',
              inset: 0,
              background: 'var(--bg-surface-alt)',
            }}
          >
            <span style={{ fontSize: '28px' }}>🔧</span>
            <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)' }}>{t('wishlist.noImage')}</span>
          </div>

          {/* Condition Badge */}
          {part.condition && (
            <span
              style={{
                position: 'absolute', top: '8px', left: '8px',
                backgroundColor: condColor, color: '#fff',
                fontSize: '10px', fontWeight: 700,
                padding: '2px 7px', borderRadius: '6px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
              }}
            >
              {part.condition}
            </span>
          )}

          {/* Category Badge */}
          {part.category && (
            <span
              style={{
                position: 'absolute', bottom: '8px', left: '8px',
                background: 'rgba(0,0,0,0.55)', color: '#fff',
                fontSize: '10px', fontWeight: 600,
                padding: '2px 7px', borderRadius: '6px',
                textTransform: 'capitalize',
              }}
            >
              {part.category}
            </span>
          )}
        </div>
      </Link>

      {/* Info */}
      <div className="p-3 flex flex-col flex-1">
        <Link href={`/parts/${part.id}`}>
          <h3
            className="font-bold text-sm leading-snug truncate hover:underline"
            style={{ color: 'var(--text-primary)' }}
          >
            {part.name}
          </h3>
        </Link>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-[11px]"
          style={{ color: 'var(--text-secondary)' }}>
          {part.brand && (
            <span className="flex items-center gap-0.5">
              <Tag size={10} /> {part.brand}
            </span>
          )}
          {(part.city || part.store?.city) && (
            <span className="flex items-center gap-0.5">
              <MapPin size={10} /> {part.city || part.store?.city}
            </span>
          )}
        </div>

        <div
          className="flex items-center justify-between mt-auto pt-3 border-t mt-3"
          style={{ borderColor: 'var(--border-color)' }}
        >
          <p className="font-black text-base" style={{ color: 'var(--accent)' }}>
            PKR {Number(part.price).toLocaleString()}
          </p>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onRemove(part.id)}
              title={t('common.remove')}
              className="flex items-center justify-center w-7 h-7 rounded-lg border text-red-400 hover:bg-red-500/10 hover:text-red-500 transition-colors"
              style={{ borderColor: 'var(--border-color)' }}
            >
              <Trash2 size={13} />
            </button>
            <button
              onClick={() => window.location.href = `/parts/${part.id}`}
              className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-lg transition-all hover:opacity-90"
              style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
            >{t('common.view')}<ArrowRight size={11} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function WishlistPage() {
  const { t } = useLang();
  const [mounted, setMounted] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState('cars'); // 'cars' | 'parts'

  const {
    cars, parts,
    loading, initialized,
    fetchWishlist, fetchPartWishlist,
    removeFromWishlist, removePartFromWishlist,
    markWishlistSeen,
  } = useWishlistStore();

  useEffect(() => {
    try {
      const stored = localStorage.getItem('auth-storage');
      const parsed = stored ? JSON.parse(stored) : null;
      setLoggedIn(!!parsed?.state?.token);
    } catch {
      setLoggedIn(false);
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && loggedIn) {
      fetchWishlist();
      fetchPartWishlist();
      markWishlistSeen();
    }
  }, [mounted, loggedIn]);

  // ── Loading (SSR) ──────────────────────────────────────────────────────────
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-page)' }}>
        <Loader2 className="animate-spin" style={{ color: 'var(--accent)' }} size={32} />
      </div>
    );
  }

  // ── Not Logged In ──────────────────────────────────────────────────────────
  if (!loggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg-page)' }}>
        <div className="text-center">
          <Heart size={52} className="mx-auto mb-4 text-red-400" />
          <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            {t('wishlist.loginTitle')}
          </h2>
          <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>
            {t('wishlist.loginHint')}
          </p>
          <Link
            href="/login"
            className="inline-block px-7 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-105"
            style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
          >
            {t('wishlist.login')}
          </Link>
        </div>
      </div>
    );
  }

  const totalCount = cars.length + parts.length;

  // ── Tabs ───────────────────────────────────────────────────────────────────
  const tabs = [
    { key: 'cars',  label: t('wishlist.carsTab'),  icon: Car,     count: cars.length  },
    { key: 'parts', label: t('wishlist.partsTab'), icon: Wrench,  count: parts.length },
  ];

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-page)' }}>
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Heart className="text-red-500" size={24} fill="currentColor" />
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {t('wishlist.heading')}
          </h1>
          <span
            className="text-sm px-2.5 py-0.5 rounded-full font-semibold"
            style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--border-color)',
              color: 'var(--accent)'
            }}
          >
            {t('wishlist.savedCount', { count: totalCount })}
          </span>
        </div>

        {/* Tabs */}
        <div
          className="flex gap-1 p-1 rounded-xl mb-6 w-fit"
          style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}
        >
          {tabs.map(({ key, label, icon: Icon, count }) => {
            const active = activeTab === key;
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
                style={active
                  ? { background: 'var(--accent)', color: 'var(--accent-text)' }
                  : { color: 'var(--text-secondary)' }
                }
              >
                <Icon size={15} />
                {label}
                <span
                  className="text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center"
                  style={active
                    ? { background: 'rgba(255,255,255,0.25)', color: 'inherit' }
                    : { background: 'var(--bg-surface-alt)', color: 'var(--text-muted)' }
                  }
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        {loading && !initialized ? (
          <div className="flex justify-center py-24">
            <Loader2 className="animate-spin" style={{ color: 'var(--accent)' }} size={32} />
          </div>

        ) : activeTab === 'cars' ? (
          cars.length === 0 ? (
            <EmptyState
              icon="🚗"
              title={t('wishlist.emptyCars')}
              sub={t('wishlist.emptyCarsHint')}
              link="/cars"
              linkLabel={`${t('wishlist.browseCars')} →`}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {cars.map(car => (
                <CarCard key={car.id} car={car} onRemove={removeFromWishlist} />
              ))}
            </div>
          )

        ) : (
          parts.length === 0 ? (
            <EmptyState
              icon="🔧"
              title={t('wishlist.emptyParts')}
              sub={t('wishlist.emptyPartsHint')}
              link="/parts"
              linkLabel={`${t('wishlist.browseParts')} →`}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {parts.map(part => (
                <PartCard key={part.id} part={part} onRemove={removePartFromWishlist} />
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}

function EmptyState({ icon, title, sub, link, linkLabel }) {
  return (
    <div className="text-center py-24">
      <div className="text-5xl mb-4">{icon}</div>
      <p className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{title}</p>
      <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>{sub}</p>
      <Link href={link} className="text-sm font-bold" style={{ color: 'var(--accent)' }}>
        {linkLabel}
      </Link>
    </div>
  );
}