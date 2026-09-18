// frontend/app/dashboard/listings/page.jsx
'use client';
import { useLang } from '@/lib/i18nContext';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Car, Plus, Edit2, Sparkles, Eye,
  MapPin, Calendar, AlertCircle, CheckCircle, Clock, XCircle, Trash2,
  X, Gauge, Fuel, Settings2, Palette, Info, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

const API = process.env.NEXT_PUBLIC_API_URL || '/api';
const BASE = API.replace('/api', '');

const getImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${BASE}${url.startsWith('/') ? '' : '/'}${url}`;
};

// ✅ Status badge colors kept semantic (same across light/dark) — matches
// the CheckCircle/Clock/XCircle status pattern used elsewhere in the app.
const STATUS_CONFIG = {
  ACTIVE:   { labelKey: 'common.active',   icon: <CheckCircle size={10} />, cls: 'bg-emerald-400/15 text-emerald-500 border-emerald-400/25' },
  PENDING:  { labelKey: 'common.pending',  icon: <Clock size={10} />,        cls: 'bg-amber-400/15 text-amber-500 border-amber-400/25'   },
  REJECTED: { labelKey: 'common.rejected', icon: <XCircle size={10} />,      cls: 'bg-red-400/15 text-red-500 border-red-400/25'         },
  SOLD:     { labelKey: 'common.sold',     icon: <CheckCircle size={10} />,  cls: 'bg-blue-400/15 text-blue-500 border-blue-400/25'      },
};

export default function ListingsPage() {
  const { t } = useLang();
  const router = useRouter();
  const { token, _hasHydrated } = useAuthStore();

  const [cars, setCars]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('ALL');
  const [deletingId, setDeletingId] = useState(null);
  const [selectedCar, setSelectedCar] = useState(null); // ✅ jis car ka detail modal khula hai

  useEffect(() => {
    if (!_hasHydrated || !token) return;

    const headers = { Authorization: `Bearer ${token}` };

    fetch(`${API}/cars/my-listings`, { headers })
      .then(r => r.json())
      .then(json => {
        const arr = Array.isArray(json) ? json
          : Array.isArray(json.data) ? json.data
          : Array.isArray(json.listings) ? json.listings : [];
        setCars(arr);
      })
      .catch(err => console.error('Listings fetch error:', err))
      .finally(() => setLoading(false));
  }, [_hasHydrated, token]);

  const handleDeleteCar = async (carId) => {
    if (!window.confirm(t('dashboard.confirmDelete'))) {
      return;
    }
    setDeletingId(carId);
    try {
      const res = await fetch(`${API}/cars/${carId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && (json.success === undefined || json.success)) {
        setCars(prev => prev.filter(c => c.id !== carId));
        setSelectedCar(prev => (prev?.id === carId ? null : prev));
      } else {
        alert(json.message || t('common.saveFailed'));
      }
    } catch (err) {
      console.error('Delete car error:', err);
      alert(t('dashboard.ui.serverConnection'));
    } finally {
      setDeletingId(null);
    }
  };

  const counts = {
    ALL:      cars.length,
    ACTIVE:   cars.filter(c => c.status === 'ACTIVE').length,
    PENDING:  cars.filter(c => c.status === 'PENDING').length,
    REJECTED: cars.filter(c => c.status === 'REJECTED').length,
  };

  const filtered = filter === 'ALL' ? cars : cars.filter(c => c.status === filter);

  return (
    // ✅ THEME FIX: pehle "bg-slate-950 text-white" hardcoded tha, isliye
    // theme toggle (light/dark) ka koi asar nahi hota tha aur showroom
    // dashboard se hamesha mismatch rehta tha. Ab --bg-dash-page /
    // --text-primary use ho rahe hain — bilkul showroom/page.jsx jaisa.
    <div className="min-h-screen" style={{ background: 'var(--bg-dash-page)', color: 'var(--text-primary)' }}>
      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-10">

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-4 sm:mb-8 gap-2">
          <div className="min-w-0">
            <h1 className="text-base sm:text-2xl font-extrabold leading-snug break-words" style={{ color: 'var(--text-primary)' }}>
              {t('dashboard.ui.myCarListings', { count: cars.length })}
            </h1>
            <p className="text-[10px] sm:text-sm mt-0.5 sm:mt-1" style={{ color: 'var(--text-secondary)' }}>
              {cars.length} {t('dashboard.totalListings').toLowerCase()}
            </p>
          </div>
          <Link
            href="/dashboard/new-listing"
            className="flex items-center justify-center gap-1.5 font-bold text-[11px] sm:text-sm px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl transition-all shrink-0 whitespace-nowrap hover:scale-[1.02]"
            style={{ background: 'var(--bg-dash-new-btn)', color: 'var(--text-dash-new-btn)', boxShadow: 'var(--card-shadow)' }}
          >
            <Plus size={13} className="sm:w-4 sm:h-4" /> {t('dashboard.ui.newListing')}
          </Link>
        </div>

        {/* ── Filter Tabs ── */}
        <div className="flex gap-1.5 sm:gap-2 mb-3 sm:mb-6 overflow-x-auto pb-1">
          {[
          { key: 'ALL',      labelKey: 'common.all' },
          { key: 'ACTIVE',   labelKey: 'common.active' },
          { key: 'PENDING',  labelKey: 'common.pending' },
          { key: 'REJECTED', labelKey: 'common.rejected' },
          ].map(tab => {
            const active = filter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[10px] sm:text-xs font-bold whitespace-nowrap transition-all border"
                style={active
                  ? { background: 'var(--bg-dash-new-btn)', color: 'var(--text-dash-new-btn)', borderColor: 'var(--bg-dash-new-btn)', boxShadow: 'var(--card-shadow)' }
                  : { background: 'var(--bg-dash-card)', color: 'var(--text-secondary)', borderColor: 'var(--border-dash-card)' }
                }
              >
                {t(tab.labelKey)}
                <span
                  className="px-1.5 py-0.5 rounded-md text-[9px] sm:text-[10px]"
                  style={active
                    ? { background: 'rgba(0,0,0,0.15)', color: 'var(--text-dash-new-btn)' }
                    : { background: 'var(--bg-dash-cta)', color: 'var(--text-muted)' }
                  }
                >
                  {counts[tab.key]}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Content ── */}
        {loading ? (
          <div className="flex items-center justify-center py-16 sm:py-24">
            <div
              className="h-9 w-9 sm:h-10 sm:w-10 border-2 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
            />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState filter={filter} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-5">
            {filtered.map((car, i) => (
              <CarCard
                key={car.id}
                car={car}
                delay={i * 40}
                onDelete={handleDeleteCar}
                isDeleting={deletingId === car.id}
                onView={() => setSelectedCar(car)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ✅ Detail Modal — card pe click karne se khulta hai */}
      {selectedCar && (
        <DetailModal
          car={selectedCar}
          onClose={() => setSelectedCar(null)}
          onDelete={handleDeleteCar}
          isDeleting={deletingId === selectedCar.id}
        />
      )}
    </div>
  );
}

// ── Car Card ──
function CarCard({ car, delay, onDelete, isDeleting, onView }) {
  const { t } = useLang();
  const rawImg = car.carImages?.[0]?.url || car.images?.[0]?.url;
  const img    = getImageUrl(rawImg);
  const status = STATUS_CONFIG[car.status] || STATUS_CONFIG.PENDING;

  return (
    <div
      style={{
        animationDelay: `${delay}ms`,
        background: 'var(--bg-dash-card)',
        border: '1px solid var(--border-dash-card)',
        boxShadow: 'var(--card-shadow)',
      }}
      onClick={onView}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') onView?.(); }}
      className="rounded-xl sm:rounded-2xl overflow-hidden hover:-translate-y-0.5 transition-all duration-300 group cursor-pointer flex"
    >
      {/* Image */}
      <div
        className="relative w-20 h-20 sm:w-32 sm:h-28 shrink-0 overflow-hidden"
        style={{ background: 'var(--bg-surface-alt)' }}
      >
        {img ? (
          <img
            src={img}
            alt={car.title || car.model}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        ) : (
          <div className="h-full flex items-center justify-center">
            <Car size={22} className="sm:w-7 sm:h-7" style={{ color: 'var(--text-muted)' }} />
          </div>
        )}

        {/* Boost / Views badge */}
        {car.isFeatured ? (
          <div className="absolute top-1 left-1 flex items-center gap-0.5 text-[8px] sm:text-[9px] font-bold bg-amber-400/90 backdrop-blur px-1 py-0.5 rounded text-slate-900">
            <Sparkles size={8} />
          </div>
        ) : car.views > 0 ? (
          <div className="absolute top-1 left-1 flex items-center gap-0.5 text-[8px] sm:text-[9px] font-semibold bg-black/50 backdrop-blur px-1 py-0.5 rounded text-slate-300">
            <Eye size={8} /> {car.views}
          </div>
        ) : null}
      </div>

      {/* Info */}
      <div className="p-2 sm:p-4 flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-1.5">
            <h3 className="font-bold text-[11px] sm:text-sm truncate" style={{ color: 'var(--text-primary)' }}>
              {car.title || `${car.brand} ${car.model}`}
            </h3>
            <span className={`shrink-0 flex items-center gap-1 text-[8px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full border ${status.cls}`}>
              {status.icon}
              <span className="hidden sm:inline">{t(status.labelKey)}</span>
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 text-[9px] sm:text-[11px] mt-0.5 sm:mt-1" style={{ color: 'var(--text-muted)' }}>
            <span className="flex items-center gap-1"><Calendar size={9} /> {car.year}</span>
            <span className="flex items-center gap-1"><MapPin size={9} /> {car.city || 'N/A'}</span>
          </div>

          <p className="text-[12px] sm:text-lg font-black mt-0.5 sm:mt-1" style={{ color: 'var(--accent)' }}>
            PKR {Number(car.price).toLocaleString()}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 mt-1.5 sm:mt-2">
          <Link
            href={`/dashboard/listings/${car.id}/edit`}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 flex items-center justify-center gap-1 text-[9px] sm:text-xs font-semibold py-1 sm:py-1.5 rounded-lg transition-all"
            style={{ background: 'var(--bg-surface-alt)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
          >
            <Edit2 size={10} />{t('common.edit')}</Link>

          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDelete(car.id); }}
            disabled={isDeleting}
            className="flex-1 flex items-center justify-center gap-1 bg-red-500/10 border border-red-400/25 hover:bg-red-500/20 text-red-500 text-[9px] sm:text-xs font-semibold py-1 sm:py-1.5 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 size={10} /> {isDeleting ? '...' : 'Remove'}
          </button>

          {car.status === 'ACTIVE' && !car.isFeatured && (
            <Link
              href={`/payment/listing?carId=${car.id}&boost=true`}
              title={t('dashboard.ui.boost')}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center justify-center gap-1 bg-amber-400/10 border border-amber-400/25 hover:bg-amber-400/20 text-amber-500 text-[9px] sm:text-xs font-semibold px-2 py-1 sm:py-1.5 rounded-lg transition-all whitespace-nowrap"
            >
              <Sparkles size={10} />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Detail Modal ──
function DetailModal({ car, onClose, onDelete, isDeleting }) {
  const { t } = useLang();
  // ✅ Saari uploaded images (pehle sirf [0] use ho rahi thi)
  const rawImages = car.carImages?.length ? car.carImages : (car.images || []);
  const images = rawImages.map(im => getImageUrl(im.url || im)).filter(Boolean);

  const [activeIndex, setActiveIndex] = useState(0);
  // ✅ FIX: broken/invalid image URLs ke liye error-tracking. Pehle onError
  // handler bilkul nahi tha, isliye jab image load fail hoti thi to browser
  // ka default "broken image" icon bohot bara/distorted dikhta tha (mobile
  // pe khaas kar bura lagta tha). Ab per-index track karke clean Car icon
  // fallback dikhayenge, jaisa CarCard mein pehle se ho raha hai.
  const [erroredIdx, setErroredIdx] = useState(() => new Set());
  const markErrored = (idx) => setErroredIdx(prev => new Set(prev).add(idx));

  const status = STATUS_CONFIG[car.status] || STATUS_CONFIG.PENDING;
  const currentImg = images[activeIndex];
  const currentImgFailed = erroredIdx.has(activeIndex);
  const hasUsableImages = images.length > 0 && !(images.length === 1 && currentImgFailed);

  const closeThenGo = () => onClose();

  const prevImg = (e) => { e.stopPropagation(); setActiveIndex(i => (i - 1 + images.length) % images.length); };
  const nextImg = (e) => { e.stopPropagation(); setActiveIndex(i => (i + 1) % images.length); };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="rounded-xl sm:rounded-2xl w-full max-w-sm sm:max-w-lg max-h-[90vh] overflow-y-auto"
        style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', boxShadow: 'var(--card-shadow)' }}
      >
        {/* Image + Close — photo viewer black rehta hai (dono themes mein), */}
        {/* jaisa marketplace apps mein aam hai, taake photos pop karein.    */}
        <div className="relative h-48 sm:h-64 bg-black">
          {images.length > 0 && !currentImgFailed ? (
            <img
              key={currentImg}
              src={currentImg}
              alt={car.title || car.model}
              className="w-full h-full object-contain"
              onError={() => markErrored(activeIndex)}
            />
          ) : (
            <div className="h-full flex items-center justify-center bg-black">
              <Car size={32} className="sm:w-10 sm:h-10 text-slate-700" />
            </div>
          )}

          {/* Prev / Next arrows — sirf jab 1 se zyada images hon */}
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={prevImg}
                className="absolute left-2 top-1/2 -translate-y-1/2 h-7 w-7 sm:h-8 sm:w-8 flex items-center justify-center rounded-full bg-black/60 backdrop-blur text-white hover:bg-black/80 transition-colors"
              >
                <ChevronLeft size={15} className="sm:w-[18px] sm:h-[18px]" />
              </button>
              <button
                type="button"
                onClick={nextImg}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 sm:h-8 sm:w-8 flex items-center justify-center rounded-full bg-black/60 backdrop-blur text-white hover:bg-black/80 transition-colors"
              >
                <ChevronRight size={15} className="sm:w-[18px] sm:h-[18px]" />
              </button>

              {/* Dots */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                {images.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setActiveIndex(idx); }}
                    className={`h-1.5 rounded-full transition-all ${
                      idx === activeIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/40'
                    }`}
                  />
                ))}
              </div>
            </>
          )}

          <button
            type="button"
            onClick={onClose}
            className="absolute top-2.5 sm:top-3 right-2.5 sm:right-3 h-7 w-7 sm:h-8 sm:w-8 flex items-center justify-center rounded-full bg-black/60 backdrop-blur text-white hover:bg-black/80 transition-colors"
          >
            <X size={14} className="sm:w-4 sm:h-4" />
          </button>
          <div className={`absolute top-2.5 sm:top-3 left-2.5 sm:left-3 flex items-center gap-1 text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg border backdrop-blur-sm ${status.cls}`}>
            {status.icon} {t(status.labelKey)}
          </div>
          {car.isFeatured && (
            <div className="absolute bottom-2.5 sm:bottom-3 right-2.5 sm:right-3 flex items-center gap-1 text-[9px] sm:text-[10px] font-bold bg-amber-400/90 backdrop-blur px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg text-slate-900">
              <Sparkles size={9} /> {t('dashboard.ui.boost')}
            </div>
          )}
        </div>

        {/* Thumbnail strip — sirf jab 1 se zyada images hon */}
        {images.length > 1 && (
          <div className="flex gap-1.5 sm:gap-2 px-3 sm:px-5 pt-2.5 sm:pt-3 overflow-x-auto">
            {images.map((src, idx) => (
              <button
                key={idx}
                type="button"
                onClick={(e) => { e.stopPropagation(); setActiveIndex(idx); }}
                className="h-11 w-16 sm:h-14 sm:w-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-colors flex items-center justify-center"
                style={{
                  background: 'var(--bg-surface-alt)',
                  borderColor: idx === activeIndex ? 'var(--accent)' : 'var(--border-color)',
                  opacity: idx === activeIndex ? 1 : 0.6,
                }}
              >
                {erroredIdx.has(idx) ? (
                  <Car size={16} style={{ color: 'var(--text-muted)' }} />
                ) : (
                  <img
                    src={src}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={() => markErrored(idx)}
                  />
                )}
              </button>
            ))}
          </div>
        )}

        {/* Body */}
        <div className="p-3 sm:p-5">
          <h2 className="text-[13px] sm:text-lg font-extrabold mb-1" style={{ color: 'var(--text-primary)' }}>
            {car.title || `${car.brand} ${car.model}`}
          </h2>
          <p className="text-base sm:text-xl font-black mb-3 sm:mb-4" style={{ color: 'var(--accent)' }}>
            PKR {Number(car.price).toLocaleString()}
          </p>

          {/* Quick facts grid */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-3.5 sm:mb-5">
            <Fact icon={<Calendar size={11} />} label={t('common.year')} value={car.year} />
            <Fact icon={<MapPin size={11} />} label={t('common.city')} value={car.city || t('common.none')} />
            {car.mileage != null && <Fact icon={<Gauge size={11} />} label={t('car.mileage')} value={`${Number(car.mileage).toLocaleString()} km`} />}
            {car.fuelType && <Fact icon={<Fuel size={11} />} label={t('car.fuelType')} value={car.fuelType} />}
            {car.transmission && <Fact icon={<Settings2 size={11} />} label={t('car.transmission')} value={car.transmission} />}
            {car.color && <Fact icon={<Palette size={11} />} label={t('car.color')} value={car.color} />}
            {car.views != null && <Fact icon={<Eye size={11} />} label={t('dashboard.ui.views')} value={car.views} />}
          </div>

          {/* Description */}
          <div className="mb-3.5 sm:mb-5">
            <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold mb-1.5 sm:mb-2" style={{ color: 'var(--text-secondary)' }}>
              <Info size={11} />{t('common.description')}</div>
            <p className="text-[11px] sm:text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>
              {car.description?.trim() ? car.description : t('common.noResults')}
            </p>
          </div>

          {car.status === 'PENDING' && (
            <div
              className="mb-3.5 sm:mb-5 text-[10px] sm:text-xs font-semibold rounded-xl px-2.5 sm:px-3 py-1.5 sm:py-2"
              style={{ background: 'var(--bg-dash-cta)', border: '1px solid var(--border-dash-cta)', color: 'var(--text-secondary)' }}
            >
              {t('payment.reviewingBody')}
            </div>
          )}

          {/* Actions — mobile pe stack, desktop pe row */}
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            <Link
              href={`/dashboard/listings/${car.id}/edit`}
              onClick={closeThenGo}
              className="flex-1 min-w-[90px] flex items-center justify-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs font-semibold py-2 sm:py-2.5 rounded-lg sm:rounded-xl transition-all"
              style={{ background: 'var(--bg-surface-alt)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
            >
              <Edit2 size={11} />{t('common.edit')}</Link>

            <button
              type="button"
              onClick={() => onDelete(car.id)}
              disabled={isDeleting}
              className="flex-1 min-w-[90px] flex items-center justify-center gap-1 sm:gap-1.5 bg-red-500/10 border border-red-400/25 hover:bg-red-500/20 text-red-500 text-[10px] sm:text-xs font-semibold py-2 sm:py-2.5 rounded-lg sm:rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 size={11} /> {isDeleting ? t('common.deleting') : t('common.remove')}
            </button>

            {car.status === 'ACTIVE' && !car.isFeatured && (
              <Link
                href={`/payment/listing?carId=${car.id}&boost=true`}
                onClick={closeThenGo}
                className="flex-1 min-w-[110px] flex items-center justify-center gap-1 sm:gap-1.5 bg-amber-400/10 border border-amber-400/25 hover:bg-amber-400/20 text-amber-500 text-[10px] sm:text-xs font-semibold py-2 sm:py-2.5 rounded-lg sm:rounded-xl transition-all whitespace-nowrap"
              >
                <Sparkles size={11} /> Boost · Rs 20
              </Link>
            )}

            {car.status === 'ACTIVE' && car.isFeatured && (
              <div className="flex-1 min-w-[90px] flex items-center justify-center gap-1 sm:gap-1.5 bg-amber-400/10 border border-amber-400/20 text-amber-500 text-[10px] sm:text-xs font-semibold py-2 sm:py-2.5 rounded-lg sm:rounded-xl">
                <Sparkles size={11} />{t('common.active')}</div>
            )}

            {car.status === 'REJECTED' && (
              <div className="flex-1 min-w-[90px] flex items-center justify-center gap-1 sm:gap-1.5 bg-red-500/10 border border-red-400/20 text-red-500 text-[10px] sm:text-xs font-semibold py-2 sm:py-2.5 rounded-lg sm:rounded-xl">
                <AlertCircle size={11} />{t('common.rejected')}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Fact({ icon, label, value }) {
  if (value === undefined || value === null || value === '') return null;
  return (
    <div
      className="flex items-center gap-1.5 sm:gap-2 rounded-xl px-2.5 sm:px-3 py-1.5 sm:py-2"
      style={{ background: 'var(--bg-dash-card)', border: '1px solid var(--border-dash-card)' }}
    >
      <span style={{ color: 'var(--text-muted)' }}>{icon}</span>
      <div>
        <div className="text-[9px] sm:text-[10px] font-semibold" style={{ color: 'var(--text-muted)' }}>{label}</div>
        <div className="text-[11px] sm:text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{value}</div>
      </div>
    </div>
  );
}

// ── Empty State ──
function EmptyState({ filter }) {
  const { t } = useLang();
  return (
    <div className="flex flex-col items-center justify-center py-16 sm:py-24 text-center">
      <div
        className="h-14 w-14 sm:h-20 sm:w-20 rounded-2xl flex items-center justify-center mb-3.5 sm:mb-5"
        style={{ background: 'var(--bg-dash-cta)', border: '1px solid var(--border-dash-cta)' }}
      >
        <Car size={24} className="sm:w-8 sm:h-8" style={{ color: 'var(--text-muted)' }} />
      </div>
      <h3 className="font-bold text-[13px] sm:text-base mb-1.5 sm:mb-2" style={{ color: 'var(--text-primary)' }}>
        {t('dashboard.ui.noListings')}
      </h3>
      <p className="text-[11px] sm:text-sm mb-4.5 sm:mb-6 max-w-xs" style={{ color: 'var(--text-secondary)' }}>
        {filter === 'ALL' ? t('dashboard.noListingsHint') : t('dashboard.ui.noListings')}
      </p>
      {filter === 'ALL' && (
        <Link
          href="/dashboard/new-listing"
          className="flex items-center gap-1.5 sm:gap-2 font-bold text-[11px] sm:text-sm px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl"
          style={{ background: 'var(--bg-dash-new-btn)', color: 'var(--text-dash-new-btn)', boxShadow: 'var(--card-shadow)' }}
        >
          <Plus size={13} className="sm:w-4 sm:h-4" /> {t('dashboard.ui.firstListing')}
        </Link>
      )}
    </div>
  );
}