// frontend/app/(main)/spare-parts/[id]/page.jsx
'use client';
import { useLang } from '@/lib/i18nContext';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Package, MapPin, Phone, MessageCircle, Send, Store, ChevronLeft, ChevronRight, X, Loader } from 'lucide-react';
import { getImageUrl } from '@/lib/partHelpers';
import { getCleanToken } from '@/lib/auth';
// ✅ PRICE — poori site par ek jaisa Pakistani format (lacs / crore)
import { formatPrice } from '@/lib/formatPrice';

export default function SparePartDetailPage() {
  const { t } = useLang();
  const { id } = useParams();
  const router = useRouter();

  const [part, setPart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchPart = async () => {
      setLoading(true);
      setError(null);
      try {
        const API = process.env.NEXT_PUBLIC_API_URL || '/api';
        const res = await fetch(`${API}/parts/${id}`);

        if (!res.ok) {
          throw new Error(res.status === 404 ? t('common.partNotFound') : t('common.somethingWrong'));
        }

        const data = await res.json();
        // Backend (parts.controller.js -> getPartById) response bhejta hai:
        // { success: true, data: {...} }
        setPart(data.data || data.part || data);
      } catch (err) {
        console.error('❌ Error fetching part:', err);
        setError(err.message || t('common.partLoadFailed'));
      } finally {
        setLoading(false);
      }
    };

    fetchPart();
  }, [id]);

  useEffect(() => {
    if (!lightboxOpen) return;

    const onKeyDown = (e) => {
      if (e.key === 'Escape') setLightboxOpen(false);
      if (e.key === 'ArrowLeft') showPrevImage();
      if (e.key === 'ArrowRight') showNextImage();
    };

    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [lightboxOpen]);

  if (loading) {
    return (
      <div className="min-h-screen bg-page-base flex items-center justify-center text-theme-muted">{t('common.loading')}</div>
    );
  }

  if (error || !part) {
    return (
      <div className="min-h-screen bg-page-base flex flex-col items-center justify-center gap-4 text-theme-muted">
        <p>{error || t('common.partNotFound')}</p>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 bg-surface-alt border border-theme hover:bg-black/5 dark:hover:bg-white/[0.08] px-4 py-2 rounded-lg text-sm text-theme-primary transition-colors"
        >
          <ChevronLeft size={16} /> {t('common.back')}
        </button>
      </div>
    );
  }

  // ---- Defensive / safe values (isi wajah se pehle title/price ghayab ho sakte the) ----
  const images = Array.isArray(part.images) ? part.images : [];
  const mainImg = images[activeImage] ? getImageUrl(images[activeImage].url) : null;

  const store = part.store || {};
  const dealerPhone = store.phone || store.whatsapp || '';
  const dealerWhatsapp = (store.whatsapp || store.phone || '').replace(/[^0-9]/g, '');

  // ✅ formatPrice khud "PKR" laga deta hai aur 1 lakh se upar lacs/crore
  // mein badal deta hai. Invalid/missing price par fallback text.
  const priceDisplay = formatPrice(part.price, { fallback: 'Price on request' });

  const partName = part.name || 'Spare Part';
  const cityLabel = store.city || part.city || 'Pakistan';

  const handleWhatsapp = () => {
    if (!dealerWhatsapp) return;
    const msg = encodeURIComponent(`Assalam o Alaikum, mujhe "${partName}" ke baare mein pochna tha.`);
    window.open(`https://wa.me/${dealerWhatsapp}?text=${msg}`, '_blank');
  };

  const handleCall = () => {
    if (!dealerPhone) return;
    window.location.href = `tel:${dealerPhone}`;
  };

  const handleMessage = async () => {
    const token = getCleanToken();
    if (!token) { alert(t('common.loginRequired')); router.push('/login'); return; }
    if (!store?.id) { alert(t('common.infoUnavailable')); return; }

    try {
      setChatLoading(true);
      const API = process.env.NEXT_PUBLIC_API_URL || '/api';
      const res = await fetch(`${API}/chat/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ storeId: store.id, partId: part.id }),
      });
      const data = await res.json();
      // Backend response shape: { success, message, data: { id, ... } }
      const roomId = data?.data?.id;
      if (res.ok && roomId) router.push(`/chat?roomId=${roomId}`);
      else alert(data.message || t('common.chatError'));
    } catch {
      alert(t('common.networkError'));
    } finally {
      setChatLoading(false);
    }
  };

  const handleVisitShowroom = () => {
    if (!store.id && !store.slug) return;
    router.push(`/stores/${store.slug || store.id}`);
  };

  const showPrevImage = () => {
    if (!images.length) return;
    setActiveImage((prev) => (prev - 1 + images.length) % images.length);
  };

  const showNextImage = () => {
    if (!images.length) return;
    setActiveImage((prev) => (prev + 1) % images.length);
  };

  // ✅ THEME FIX: pehle yahan text-blue-400 / green-400 / cyan-400 thay jo
  // light (white) background par bohat halke lagte thay. Ab -600/-500 shades
  // jo dono themes par readable hain.
  const contactActions = [
    {
      key: 'call',
      label: 'Call',
      icon: Phone,
      onClick: handleCall,
      disabled: !dealerPhone,
      color: 'text-blue-600 dark:text-blue-400',
    },
    {
      key: 'whatsapp',
      label: 'WhatsApp',
      icon: MessageCircle,
      onClick: handleWhatsapp,
      disabled: !dealerWhatsapp,
      color: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      key: 'message',
      label: chatLoading ? '...' : 'Message',
      icon: chatLoading ? Loader : Send,
      onClick: handleMessage,
      disabled: chatLoading,
      color: 'text-cyan-600 dark:text-cyan-400',
    },
  ];

  return (
    // ✅ THEME FIX: bg-slate-950 text-white → theme tokens
    <div className="min-h-screen bg-page-base text-theme-primary pb-28 md:pb-10">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-theme-muted hover:text-theme-primary text-sm mb-5 transition-colors"
        >
          <ChevronLeft size={16} />{t('common.back')}</button>

        {/* Grid layout — flex ke bajaye grid taake dono columns hamesha reliably render hon */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* Left: Image gallery */}
          <div className="w-full">
            <div className="aspect-square w-full bg-surface-alt rounded-2xl overflow-hidden border border-theme relative group">
              {mainImg ? (
                <button
                  type="button"
                  onClick={() => setLightboxOpen(true)}
                  className="w-full h-full block cursor-zoom-in"
                  aria-label="Image bara karke dekhein"
                >
                  <img
                    src={mainImg}
                    alt={partName}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                  <span className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                </button>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-theme-muted">
                  <Package size={48} />
                </div>
              )}

              {/* ✅ THEME FIX: is badge ka background hamesha dark hai, is liye
                  text-white explicitly likha — warna light mode mein parent se
                  kaala text inherit ho kar padha hi nahi jata tha. */}
              {part.condition && (
                <div className="absolute top-3 right-3 bg-black/70 text-white backdrop-blur-sm px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wide">
                  {part.condition}
                </div>
              )}
            </div>

            {images.length > 1 && (
              <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                {images.map((img, i) => (
                  <button
                    key={img.id || i}
                    type="button"
                    onClick={() => setActiveImage(i)}
                    className={`w-16 h-16 shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${
                      activeImage === i ? 'border-cyan-500' : 'border-theme hover:border-cyan-500/50'
                    }`}
                  >
                    <img src={getImageUrl(img.url)} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Details + dealer card */}
          <div className="w-full flex flex-col gap-5">
            <div>
              {part.category && (
                <span className="inline-block bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 text-[11px] font-semibold px-2.5 py-1 rounded-lg capitalize mb-2">
                  {part.category}
                </span>
              )}
              <h1 className="text-2xl md:text-3xl font-bold leading-tight text-theme-primary">{partName}</h1>
              <p className="text-3xl font-bold text-cyan-600 dark:text-cyan-400 mt-2">{priceDisplay}</p>
              <div className="flex items-center gap-1.5 text-sm text-theme-muted mt-2">
                <MapPin size={14} />
                {cityLabel}
              </div>
            </div>

            {/* ✅ THEME FIX: bg-white/5 border-white/10 → .glass-card
                (globals.css ka solid surface token — dono themes handle karta hai) */}
            {part.description && (
              <div className="glass-card rounded-2xl p-4">
                <h2 className="text-sm font-semibold text-theme-secondary mb-2">{t('common.description')}</h2>
                <p className="text-sm text-theme-muted whitespace-pre-line leading-relaxed">
                  {part.description}
                </p>
              </div>
            )}

            {/* Dealer contact card */}
            <div className="glass-card rounded-2xl p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-full bg-cyan-500/15 flex items-center justify-center shrink-0">
                  <Store size={20} className="text-cyan-600 dark:text-cyan-400" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate text-theme-primary">{store.name || 'Dealer'}</p>
                  <button
                    type="button"
                    onClick={handleVisitShowroom}
                    className="text-[12px] text-cyan-600 dark:text-cyan-400 hover:underline"
                  >
                    Showroom dekhein
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {contactActions.map(({ key, label, icon: Icon, onClick, disabled, color }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={onClick}
                    disabled={disabled}
                    className="flex flex-col items-center justify-center gap-1.5 bg-surface-alt border border-theme hover:bg-black/5 dark:hover:bg-white/[0.08] disabled:opacity-40 disabled:cursor-not-allowed py-3.5 rounded-xl transition-colors"
                  >
                    <Icon size={20} className={`${color} ${key === 'message' && chatLoading ? 'animate-spin' : ''}`} />
                    <span className="text-[11px] font-semibold text-theme-primary">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen image lightbox — inline styles taake Tailwind arbitrary-value
          compile na hone ki soorat mein bhi size hamesha sahi ho.
          NOTE: lightbox jaan boojh kar dono themes mein BLACK hi rehta hai —
          photo viewers (Google Photos, PakWheels) bhi aisa hi karte hain. */}
      {lightboxOpen && mainImg && (
        <div
          onClick={() => setLightboxOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100dvh',
            zIndex: 9999,
            background: 'rgba(0,0,0,0.92)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            boxSizing: 'border-box',
          }}
        >
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            className="hover:bg-white/20 transition-colors"
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              background: 'rgba(255,255,255,0.1)',
              padding: 8,
              borderRadius: '9999px',
              lineHeight: 0,
            }}
            aria-label="Band karein"
          >
            <X size={22} color="#fff" />
          </button>

          {images.length > 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); showPrevImage(); }}
              className="hover:bg-white/20 transition-colors"
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(255,255,255,0.1)',
                padding: 10,
                borderRadius: '9999px',
                lineHeight: 0,
              }}
              aria-label="Pichli image"
            >
              <ChevronLeft size={24} color="#fff" />
            </button>
          )}

          <img
            src={mainImg}
            alt={partName}
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '90vw',
              maxHeight: '78vh',
              width: 'auto',
              height: 'auto',
              objectFit: 'contain',
              borderRadius: 8,
            }}
          />

          {images.length > 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); showNextImage(); }}
              className="hover:bg-white/20 transition-colors"
              style={{
                position: 'absolute',
                right: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(255,255,255,0.1)',
                padding: 10,
                borderRadius: '9999px',
                lineHeight: 0,
              }}
              aria-label="Agli image"
            >
              <ChevronRight size={24} color="#fff" />
            </button>
          )}

          {images.length > 1 && (
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                display: 'flex',
                gap: 8,
                marginTop: 16,
                overflowX: 'auto',
                maxWidth: '100%',
                padding: '0 8px',
              }}
            >
              {images.map((img, i) => (
                <button
                  key={img.id || i}
                  type="button"
                  onClick={() => setActiveImage(i)}
                  style={{
                    width: 56,
                    height: 56,
                    flexShrink: 0,
                    borderRadius: 8,
                    overflow: 'hidden',
                    border: `2px solid ${activeImage === i ? '#22d3ee' : 'rgba(255,255,255,0.2)'}`,
                    padding: 0,
                  }}
                >
                  <img
                    src={getImageUrl(img.url)}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sticky mobile bottom bar */}
      {/* ✅ THEME FIX: bg-slate-950/95 → bg-surface + border-theme */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-theme p-3 flex gap-2 z-50">
        <button
          type="button"
          onClick={handleCall}
          disabled={!dealerPhone}
          className="flex-1 flex items-center justify-center gap-2 bg-surface-alt border border-theme text-theme-primary disabled:opacity-40 py-3 rounded-xl font-semibold text-sm"
        >
          <Phone size={16} />{t('seller.call')}</button>
        {/* Gradient button ka background hamesha rangeen hai — text-white explicit */}
        <button
          type="button"
          onClick={handleWhatsapp}
          disabled={!dealerWhatsapp}
          className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white disabled:opacity-40 py-3 rounded-xl font-semibold text-sm"
        >
          <MessageCircle size={16} />{t('seller.whatsapp')}</button>
      </div>
    </div>
  );
}