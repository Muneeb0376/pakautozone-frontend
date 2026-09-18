// frontend/app/(main)/parts/[id]/page.jsx
'use client';
import { useLang } from '@/lib/i18nContext';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MapPin, Phone, MessageCircle, Send, Package, Store } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || '/api';

export default function PublicPartDetailsPage() {
  const { t } = useLang();
  const { id } = useParams();
  const router = useRouter();

  const [part, setPart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeImg, setActiveImg] = useState(0);

  useEffect(() => {
    if (!id) return;
    fetchPart();
  }, [id]);

  const fetchPart = async () => {
    setLoading(true);
    setError('');
    try {
      // ✅ Backend parts.controller.js -> getPartById response shape:
      // { success: true, data: { ...part, store: {...}, images: [{url}] } }
      const res = await fetch(`${API}/parts/${id}`);
      const json = await res.json();

      if (!res.ok || !json.success) {
        setError(json.message || 'Part nahi mila.');
        setPart(null);
        return;
      }

      setPart(json.data);
      setActiveImg(0);
    } catch (err) {
      console.error('❌ Error fetching part details:', err);
      setError(t('common.somethingWrong'));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !part) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center gap-4 px-4">
        <Package size={48} className="text-slate-600" />
        <p className="text-slate-300">{error || 'Part nahi mila.'}</p>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-blue-400 hover:text-blue-300 underline"
        >
          <ArrowLeft size={16} /> Wapis jayein
        </button>
      </div>
    );
  }

  const images = Array.isArray(part.images) && part.images.length > 0 ? part.images : [];
  const store = part.store || {};

  const handleWhatsapp = () => {
    const number = (store.whatsapp || store.phone || '').replace(/\D/g, '');
    if (!number) return;
    const msg = encodeURIComponent(`Assalam o Alaikum, mujhe "${part.name}" ke baare mein pochna tha.`);
    window.open(`https://wa.me/${number}?text=${msg}`, '_blank');
  };

  const handleMessage = () => {
    // TODO: apne existing buyer-dealer chat system ke actual route se link karein
    router.push(`/chat?dealerId=${store.id}&partId=${part.id}`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-28 md:pb-10">
      <div className="max-w-5xl mx-auto px-4 py-6">

        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft size={16} />{t('common.back')}</button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Images */}
          <div>
            <div className="aspect-square bg-slate-900 border border-white/10 rounded-2xl overflow-hidden mb-3">
              {images.length > 0 ? (
                <img
                  src={images[activeImg]?.url}
                  alt={part.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-600">
                  <Package size={64} />
                </div>
              )}
            </div>

            {images.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {images.map((img, idx) => (
                  <button
                    key={img.id || idx}
                    onClick={() => setActiveImg(idx)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      activeImg === idx ? 'border-cyan-400' : 'border-white/10 hover:border-white/30'
                    }`}
                  >
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-5">
            <div>
              {part.category && (
                <span className="inline-block bg-cyan-500/20 text-cyan-300 text-xs font-semibold px-2.5 py-1 rounded-lg capitalize mb-3">
                  {part.category}
                </span>
              )}
              <h1 className="text-2xl font-bold">{part.name}</h1>
              <p className="text-3xl font-bold text-cyan-400 mt-3">
                PKR {Number(part.price).toLocaleString()}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="bg-white/5 border border-white/10 text-xs font-semibold px-3 py-1.5 rounded-lg">
                {part.condition || 'Used'}
              </span>
              {part.brand && (
                <span className="bg-white/5 border border-white/10 text-xs font-semibold px-3 py-1.5 rounded-lg">
                  {part.brand}
                </span>
              )}
              <span className="flex items-center gap-1 bg-white/5 border border-white/10 text-xs font-semibold px-3 py-1.5 rounded-lg">
                <MapPin size={12} /> {store.city || part.city || 'Pakistan'}
              </span>
            </div>

            {part.description && (
              <div>
                <h2 className="text-sm font-semibold text-slate-300 mb-1">{t('common.description')}</h2>
                <p className="text-sm text-slate-400 leading-relaxed whitespace-pre-line">
                  {part.description}
                </p>
              </div>
            )}

            {/* Dealer contact card */}
            {part.store && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Store size={16} className="text-cyan-400" />
                  <span className="font-semibold text-sm">{store.name}</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <a
                    href={store.phone ? `tel:${store.phone}` : undefined}
                    className="flex flex-col items-center justify-center gap-1 bg-white/5 hover:bg-white/10 py-3 rounded-xl transition-colors"
                  >
                    <Phone size={18} className="text-blue-400" />
                    <span className="text-[11px] font-semibold">{t('seller.call')}</span>
                  </a>
                  <button
                    onClick={handleWhatsapp}
                    className="flex flex-col items-center justify-center gap-1 bg-white/5 hover:bg-white/10 py-3 rounded-xl transition-colors"
                  >
                    <MessageCircle size={18} className="text-green-400" />
                    <span className="text-[11px] font-semibold">{t('seller.whatsapp')}</span>
                  </button>
                  <button
                    onClick={handleMessage}
                    className="flex flex-col items-center justify-center gap-1 bg-white/5 hover:bg-white/10 py-3 rounded-xl transition-colors"
                  >
                    <Send size={18} className="text-cyan-400" />
                    <span className="text-[11px] font-semibold">{t('exchange.message')}</span>
                  </button>
                </div>

                {store.slug && (
                  <Link
                    href={`/stores/${store.slug}`}
                    className="inline-block text-xs text-blue-400 hover:text-blue-300 underline"
                  >
                    Showroom dekhein →
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sticky mobile bottom bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-950/95 backdrop-blur-sm border-t border-white/10 p-3 flex gap-2 z-50">
        <a
          href={store.phone ? `tel:${store.phone}` : undefined}
          className="flex-1 flex items-center justify-center gap-2 bg-white/10 py-3 rounded-xl font-semibold text-sm"
        >
          <Phone size={16} />{t('seller.call')}</a>
        <button
          onClick={handleWhatsapp}
          className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 py-3 rounded-xl font-semibold text-sm"
        >
          <MessageCircle size={16} />{t('seller.whatsapp')}</button>
      </div>
    </div>
  );
}