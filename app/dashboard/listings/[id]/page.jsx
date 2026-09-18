'use client';
import { useLang } from '@/lib/i18nContext';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import {
  ArrowLeft, Car, MapPin, Calendar, Edit2, Trash2, Sparkles,
  Eye, AlertCircle, CheckCircle, Clock, XCircle, ChevronLeft, ChevronRight,
} from 'lucide-react';

const API  = process.env.NEXT_PUBLIC_API_URL || '/api';
const BASE = API.replace('/api', '');

const getImageUrl = (img) => {
  if (!img) return null;
  if (img.url) return img.url;
  const filename = img.filename || (typeof img === 'string' ? img : null);
  return filename ? `${BASE}/uploads/${filename}` : null;
};

const CONDITION_LABELS = {
  NEW: 'car.new',
  USED: 'car.used',
  CERTIFIED_PREOWNED: 'car.certified',
};

const formatEnum = (val) => {
  if (!val) return null;
  return String(val)
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

const STATUS_CONFIG = {
  ACTIVE:   { labelKey: 'common.active',   icon: <CheckCircle size={13} />, cls: 'bg-emerald-400/15 text-emerald-400 border-emerald-400/25' },
  PENDING:  { labelKey: 'common.pending',  icon: <Clock size={13} />,        cls: 'bg-amber-400/15 text-amber-400 border-amber-400/25'   },
  REJECTED: { labelKey: 'common.rejected', icon: <XCircle size={13} />,      cls: 'bg-red-400/15 text-red-400 border-red-400/25'         },
  SOLD:     { labelKey: 'common.sold',     icon: <CheckCircle size={13} />,  cls: 'bg-blue-400/15 text-blue-400 border-blue-400/25'      },
};

export default function DealerCarDetailPage() {
  const { t } = useLang();
  const router = useRouter();
  const params = useParams();
  const carId = params.id;
  const { token } = useAuthStore();

  const [car, setCar]           = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [imageIndex, setImageIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!carId) return;
    (async () => {
      try {
        setLoading(true);
        const res  = await fetch(`${API}/cars/${carId}`);
        const json = await res.json();
        if (!json.success || !json.data) { setError(t('car.notFound')); return; }
        setCar(json.data);
        setImageIndex(0);
      } catch (e) {
        setError(t('car.loadFailed'));
      } finally {
        setLoading(false);
      }
    })();
  }, [carId]);

  const handleDelete = async () => {
    if (!window.confirm(t('dashboard.confirmDelete'))) return;
    setDeleting(true);
    try {
      const res = await fetch(`${API}/cars/${carId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && (json.success === undefined || json.success)) {
        router.push('/dashboard/listings');
      } else {
        alert(json.message || t('common.saveFailed'));
        setDeleting(false);
      }
    } catch (err) {
      alert(t('dashboard.ui.serverConnection'));
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !car) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="text-center">
          <AlertCircle size={44} className="text-red-500 mx-auto mb-3" />
          <p className="text-white font-bold mb-4">{error || t('car.notFound')}</p>
          <button
            onClick={() => router.push('/dashboard/listings')}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-all"
          >
            {t('common.back')}
          </button>
        </div>
      </div>
    );
  }

  const images = car.carImages || car.images || [];
  const status = STATUS_CONFIG[car.status] || STATUS_CONFIG.PENDING;

  const specs = [
    { label: t('common.price'), value: `${t('common.pkr')} ${Number(car.price).toLocaleString()}`, highlight: true },
    { label: t('common.year'), value: car.year },
    { label: t('car.mileage'), value: car.mileage ? `${Number(car.mileage).toLocaleString()} ${t('common.km')}` : null },
    { label: t('car.transmission'), value: formatEnum(car.transmission) },
    { label: t('car.fuelType'), value: formatEnum(car.fuelType) },
    { label: t('car.engine'), value: car.engineCC ? `${car.engineCC}cc` : null },
    { label: t('car.bodyType'), value: formatEnum(car.bodyType) },
    { label: t('car.color'), value: car.color },
    { label: t('car.condition'), value: CONDITION_LABELS[car.condition] ? t(CONDITION_LABELS[car.condition]) : formatEnum(car.condition) },
    { label: t('common.city'), value: car.city },
  ].filter((s) => s.value);

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-16">
      <div className="h-1 bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-500" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

        {/* ── Back + Status ── */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.push('/dashboard/listings')}
            className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm font-semibold transition-all"
          >
            <ArrowLeft size={16} />{t('dashboard.myListings')}</button>
          <div className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border ${status.cls}`}>
            {status.icon} {t(status.labelKey)}
          </div>
        </div>

        {/* ── Image gallery ── */}
        <div className="relative bg-black rounded-2xl overflow-hidden mb-3" style={{ aspectRatio: '16/9' }}>
          {images.length > 0 ? (
            <>
              <img
                src={getImageUrl(images[imageIndex])}
                alt={car.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-3 right-3 bg-black/60 text-xs text-white px-2.5 py-1 rounded-full">
                {imageIndex + 1} / {images.length}
              </div>
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setImageIndex((i) => (i - 1 + images.length) % images.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 p-2 rounded-full transition-all"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={() => setImageIndex((i) => (i + 1) % images.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 p-2 rounded-full transition-all"
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Car size={44} className="text-slate-700" />
            </div>
          )}
        </div>

        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 mb-6">
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setImageIndex(idx)}
                className={`flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 bg-black transition-all ${
                  idx === imageIndex ? 'border-cyan-400 opacity-100' : 'border-transparent opacity-50 hover:opacity-90'
                }`}
              >
                <img src={getImageUrl(img)} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}

        {/* ── Title + meta ── */}
        <h1 className="text-2xl md:text-3xl font-extrabold mb-2 capitalize">
          {car.title || `${car.brand} ${car.model} ${car.year}`}
        </h1>
        <div className="flex flex-wrap items-center gap-3 mb-6 text-sm text-slate-400">
          {car.year && <span className="flex items-center gap-1"><Calendar size={13} /> {car.year}</span>}
          <span className="flex items-center gap-1"><MapPin size={13} /> {car.city || t('common.none')}</span>
          {car.views > 0 && <span className="flex items-center gap-1"><Eye size={13} /> {car.views} {t('dashboard.ui.views')}</span>}
          {car.isFeatured && (
            <span className="flex items-center gap-1 text-amber-400"><Sparkles size={13} /> {t('common.featured')}</span>
          )}
        </div>

        {/* ── Actions ── */}
        <div className="flex flex-wrap gap-2.5 mb-8">
          <Link
            href={`/dashboard/listings/${car.id}/edit`}
            className="flex items-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all"
          >
            <Edit2 size={14} />{t('common.edit')}</Link>

          {car.status === 'ACTIVE' && !car.isFeatured && (
            <Link
              href={`/payment/listing?carId=${car.id}&boost=true`}
              className="flex items-center gap-2 bg-white/5 border border-amber-400/25 hover:bg-amber-400/10 text-amber-400 text-sm font-semibold px-5 py-2.5 rounded-xl transition-all"
            >
              <Sparkles size={14} /> {t('dashboard.ui.boost')}
            </Link>
          )}

          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-2 bg-red-500/10 border border-red-400/25 hover:bg-red-500/20 text-red-400 text-sm font-semibold px-5 py-2.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 size={14} /> {deleting ? t('common.deleting') : t('common.remove')}
          </button>
        </div>

        {/* ── Specs grid ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {specs.map((s, i) => (
            <div
              key={i}
              className={`rounded-xl p-3 border ${
                s.highlight
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : 'bg-white/5 border-white/10'
              }`}
            >
              <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${s.highlight ? 'text-emerald-400/80' : 'text-slate-500'}`}>
                {s.label}
              </p>
              <p className={`text-sm font-bold capitalize ${s.highlight ? 'text-emerald-400' : 'text-white'}`}>
                {s.value}
              </p>
            </div>
          ))}
        </div>

        {/* ── Features ── */}
        {car.features?.length > 0 && (
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5 mb-8">
            <h2 className="text-lg font-bold mb-3">✨ {t('car.features')}</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {car.features.map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-slate-300">
                  <Sparkles size={13} className="text-cyan-400" /> {f.name || f}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Description ── */}
        {car.description && (
          <div className="mb-8">
            <h2 className="text-lg font-bold mb-3">📝 {t('common.description')}</h2>
            <p className="text-slate-300 leading-relaxed whitespace-pre-line">{car.description}</p>
          </div>
        )}

        {/* ── Status-specific note ── */}
        {car.status === 'PENDING' && (
          <div className="bg-amber-400/10 border border-amber-400/25 rounded-xl p-4 text-amber-300 text-sm flex items-start gap-2">
            <Clock size={16} className="mt-0.5 flex-shrink-0" />
            {t('payment.reviewingBody')}
          </div>
        )}
        {car.status === 'REJECTED' && (
          <div className="bg-red-500/10 border border-red-400/25 rounded-xl p-4 text-red-300 text-sm flex items-start gap-2">
            <XCircle size={16} className="mt-0.5 flex-shrink-0" />
            {t('common.rejected')}
          </div>
        )}
      </div>
    </div>
  );
}