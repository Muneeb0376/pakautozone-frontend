'use client';
import { useLang } from '@/lib/i18nContext';
// frontend/app/(main)/cars/[id]/page.jsx
//
// ✅ POORI FILE REPLACE — Phase 4
//
// ══════════════════════════════════════════════════════════════
//  AAP NE JO KAHA
// ══════════════════════════════════════════════════════════════
// • "car detail page par mirror UI buttons lagane — jab koi car par
//    click kare to us ki info neeche show hoti hai, jaise PakWheels ka
//    hai — fuel, auto/manual waghera buttons type mein show hote hain,
//    waise show ho"
// • "neeche more cars mein car ka card bhi theek karo, is mein info
//    sahi show nahi ho rahi"
// • "cartoonish shades bhi is page se hatana"
//
// ══════════════════════════════════════════════════════════════
//  1. SPEC CHIPS — sab se bara change
// ══════════════════════════════════════════════════════════════
// Pehle 9 khaanon ka grid tha jismein har khaana `N/A` ya `—` bhi
// dikhata tha (screenshot 2: ENGINE: N/A, COLOR: N/A). Ye page bhara
// bhara aur adhoora dono lagta tha.
//
// Ab do hisse hain:
//
//   (a) CHIP ROW — title ke foran neeche, ek line mein: saal · km ·
//       fuel · transmission · engine · body · city. Har chip mein
//       chhota icon + value. YEHI wo "buttons type" hai jo aap ne
//       PakWheels par dekha.
//
//   (b) SPECIFICATIONS TABLE — us ke neeche, do column ki saaf table.
//       Yahan tafseel jati hai (registration, assembly waghera).
//
// ⚠️ AUR AHEM: jis field ki value nahi hai wo ab RENDER HI NAHI
//    HOTI. `N/A` chip banana bekar hai — jagah bhi khata hai aur
//    listing adhoori bhi lagti hai.
//
// ⚠️ Screenshot 2 mein `ENGINE: N/A`, `COLOR: N/A`, `YEAR: 1961` —
//    ye DATA ka masla tha, UI ka nahi. Wo listing purane form se
//    bani thi jab ye fields theek save hi nahi hoti thin. Phase 2 ka
//    naya form inhe theek bharta hai.
//
// ══════════════════════════════════════════════════════════════
//  2. CARTOON SHADES — kya kya nikla
// ══════════════════════════════════════════════════════════════
// • emojis: 📅 🕐 ⚙️ 🔍 🚗 ✨ 📝  → lucide line icons
// • bg-emerald-500 price badge      → gold (brand accent)
// • blue→blue gradient chat button  → solid accent
// • purple→pink exchange gradient   → gold outline button
// • cyan-500 icons (store, zap)     → accent / muted
// • orange-500 safety tips box      → neutral card + amber icon
// • border-blue-500 spinners        → accent
//
// ══════════════════════════════════════════════════════════════
//  3. LOGIN PROMPT
// ══════════════════════════════════════════════════════════════
// Pehle `router.push('/login')` — yani purana standalone safha. Ab
// wahi AuthModal khulta hai jo poori site par hai.
//
// ══════════════════════════════════════════════════════════════
//  4. IMAGE URL KA BUG
// ══════════════════════════════════════════════════════════════
// `getImageUrl` mein `http://localhost:5000/uploads/...` HARDCODED
// tha — production par ye kabhi kaam nahi karta (localhost sirf aap
// ke apne laptop ko point karta hai). Ab API ke origin se banta hai.

import { useEffect, useState, useRef, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  MapPin, Phone, MessageCircle, Heart, Share2, ChevronLeft, ChevronRight,
  AlertCircle, Send, Loader2, Store, Car as CarIcon, X, CheckCircle2, Star,
  Calendar, Gauge, Fuel, Settings2, Cog, Palette, Shapes, ShieldCheck,
  Maximize2, FileText, ArrowRight,
} from 'lucide-react';

import { getCleanToken } from '@/lib/auth';
import { useWishlistStore } from '@/store/wishlistStore';
import CarCard from '@/components/cars/CarCard';
import AuthModal from '@/components/auth/AuthModal';
import { getCarImageUrl, isCloudinary, WATERMARK_TEXT } from '@/lib/carImage';
import { formatPrice, formatPriceExact } from '@/lib/formatPrice';
import { carTitle, toTitleCase, humanizeEnum, personName } from '@/lib/textCase';
import { translateApiError } from '@/lib/i18n';

const API = process.env.NEXT_PUBLIC_API_URL || '/api';
const BASE = API.replace(/\/api\/?$/, '');

const CONDITION_LABELS = {
  NEW: 'car.new',
  USED: 'car.used',
  CERTIFIED_PREOWNED: 'car.certified',
};

/* ── WhatsApp brand icon (lucide ka MessageCircle pehchana nahi jata) ── */
function WhatsAppIcon({ size = 17, className = '' }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12.001 2C6.478 2 2 6.477 2 12c0 1.876.508 3.634 1.393 5.145L2 22l4.981-1.373A9.953 9.953 0 0 0 12.001 22C17.523 22 22 17.523 22 12S17.523 2 12.001 2zm0 18.166a8.14 8.14 0 0 1-4.152-1.14l-.298-.177-3.075.848.822-3.041-.194-.312a8.14 8.14 0 0 1-1.24-4.344c0-4.502 3.653-8.166 8.147-8.166 4.482 0 8.147 3.653 8.147 8.166 0 4.502-3.665 8.166-8.147 8.166z" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════
   SPEC CHIP — yehi wo "button type" cheez hai jo aap ne maangi
   ═══════════════════════════════════════════════════════════ */
function SpecChip({ icon: Icon, label, value }) {
  if (!value && value !== 0) return null;   // ⚠️ N/A kabhi nahi banta

  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-xl shrink-0"
      style={{ background: 'var(--bg-surface-alt)', border: '1px solid var(--border-color)' }}
      title={label}
    >
      <Icon size={15} strokeWidth={1.8} className="shrink-0" style={{ color: 'var(--accent)' }} />
      <div className="min-w-0 leading-tight">
        <span className="block text-[9px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          {label}
        </span>
        <span className="block text-[13px] font-bold truncate" style={{ color: 'var(--text-primary)' }}>
          {value}
        </span>
      </div>
    </div>
  );
}

/* Specification table ki ek row */
function SpecRow({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div
      className="flex items-center justify-between gap-4 py-2.5"
      style={{ borderBottom: '1px solid var(--border-color)' }}
    >
      <span className="text-[13px]" style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span className="text-[13px] font-bold text-right" style={{ color: 'var(--text-primary)' }}>{value}</span>
    </div>
  );
}

export default function CarDetailPage() {
  const { t } = useLang();
  const router = useRouter();
  const params = useParams();
  const carId = params.id;

  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageIndex, setImageIndex] = useState(0);
  const [chatLoading, setChatLoading] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [relatedCars, setRelatedCars] = useState([]);
  const [relatedLoading, setRelatedLoading] = useState(true);
  const [barVisible, setBarVisible] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);

  const wished = useWishlistStore((s) => (car?.id ? s.isWished(car.id) : false));
  const storeToggleWishlist = useWishlistStore((s) => s.toggleWishlist);
  const fetchWishlistData = useWishlistStore((s) => s.fetchWishlist);
  const wishlistInitialized = useWishlistStore((s) => s.initialized);

  /* ── Gallery swipe ── */
  const galleryTouchX = useRef(null);
  const onTouchStart = (e) => { galleryTouchX.current = e.touches[0].clientX; };
  const onTouchEnd = (e, imgs) => {
    if (galleryTouchX.current === null) return;
    const diff = galleryTouchX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40 && imgs.length > 1) {
      setImageIndex((i) => (diff > 0 ? (i + 1) % imgs.length : (i - 1 + imgs.length) % imgs.length));
    }
    galleryTouchX.current = null;
  };

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  /* ── Car ── */
  useEffect(() => {
    if (!carId) return;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API}/cars/${carId}`);
        const json = await res.json();
        if (!json.success || !json.data) { setError(t('car.notFound')); return; }
        setCar(json.data);
        setImageIndex(0);
        setShowPhone(false);
      } catch (err) {
        setError(translateApiError(err, t));
      } finally {
        setLoading(false);
      }
    })();
  }, [carId]);

  /* ── Related ── */
  useEffect(() => {
    if (!car?.id) return;
    (async () => {
      setRelatedLoading(true);
      try {
        let p = new URLSearchParams();
        if (car.brand) p.append('brand', car.brand);
        p.append('limit', '8');
        let res = await fetch(`${API}/cars?${p}`);
        let json = await res.json();
        let list = json.success ? (json.data || []).filter((c) => c.id !== car.id) : [];

        if (!list.length && car.city) {
          p = new URLSearchParams({ city: car.city, limit: '8' });
          res = await fetch(`${API}/cars?${p}`);
          json = await res.json();
          list = json.success ? (json.data || []).filter((c) => c.id !== car.id) : [];
        }
        setRelatedCars(list.slice(0, 4));
      } catch {
        setRelatedCars([]);
      } finally {
        setRelatedLoading(false);
      }
    })();
  }, [car?.id, car?.brand, car?.city]);

  /* ── Lightbox ── */
  useEffect(() => {
    document.body.style.overflow = lightboxOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [lightboxOpen]);

  useEffect(() => {
    if (!lightboxOpen) return undefined;
    const n = car?.carImages?.length || 0;
    const h = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); setLightboxOpen(false); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); setImageIndex((i) => (i - 1 + n) % n); }
      if (e.key === 'ArrowRight') { e.preventDefault(); setImageIndex((i) => (i + 1) % n); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [lightboxOpen, car]);

  /* ── Sticky bar ── */
  useEffect(() => {
    const handleScroll = () => setBarVisible((window.scrollY || 0) > 220);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!wishlistInitialized) fetchWishlistData();
  }, [wishlistInitialized, fetchWishlistData]);

  /* ═══════════ Helpers ═══════════ */

  // ✅ localhost hardcode nikal diya — ab API ke origin se
  const getImageUrl = (img) => {
    if (!img) return null;
    if (img.url) return img.url;
    const filename = img.filename || (typeof img === 'string' ? img : null);
    return filename ? `${BASE}/uploads/${filename}` : null;
  };

  const getWatermarkedUrl = (img) => {
    const raw = getImageUrl(img);
    if (!raw) return null;
    return getCarImageUrl(raw, { watermark: true, width: 1400 });
  };

  const maskPhone = (p) => {
    if (!p) return null;
    const c = p.replace(/\D/g, '');
    return c.length < 7 ? p : `${c.slice(0, 4)}-XXX-${c.slice(-2)}`;
  };

  const getWhatsAppLink = (phone) => {
    if (!phone || !car) return null;
    const c = phone.replace(/\D/g, '');
    const num = c.startsWith('0') ? `92${c.slice(1)}` : c;
    const msg = `Assalam o Alaikum! Mujhe "${carTitle(car) || car.title}" ke bare mein poochna tha. Kya available hai?`;
    return `https://wa.me/${num}?text=${encodeURIComponent(msg)}`;
  };

  const formatMemberSince = (d) => {
    if (!d) return null;
    try { return new Date(d).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }); }
    catch { return null; }
  };

  // ✅ Ab /login par nahi bhejta — wahi AuthModal khulta hai
  const requireAuth = () => {
    if (!getCleanToken()) { setShowAuth(true); return false; }
    return true;
  };

  const toggleWishlist = async () => {
    if (!requireAuth()) return;
    if (!car?.id || wishlistLoading) return;
    setWishlistLoading(true);
    try { await storeToggleWishlist(car.id); }
    catch { /* store khud rollback karta hai */ }
    finally { setWishlistLoading(false); }
  };

  const handleChat = async (e) => {
    e.preventDefault(); e.stopPropagation();
    if (!requireAuth()) return;
    const token = getCleanToken();
    if (!car?.storeId) return;
    try {
      setChatLoading(true);
      const res = await fetch(`${API}/chat/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ storeId: car.storeId, carId: car.id }),
      });
      const data = await res.json();
      const roomId = data?.data?.id;
      if (res.ok && roomId) router.push(`/chat?roomId=${roomId}`);
    } catch { /* ignore */ }
    finally { setChatLoading(false); }
  };

  /* ═══════════ Derived ═══════════ */

  // ✅ Cover image pehle — CarCard jaisa hi usool
  const images = useMemo(() => {
    const raw = car?.carImages || [];
    return [...raw].sort((a, b) => {
      if (a?.isPrimary && !b?.isPrimary) return -1;
      if (b?.isPrimary && !a?.isPrimary) return 1;
      return (a?.order ?? 999) - (b?.order ?? 999);
    });
  }, [car]);

  /* ═══════════ States ═══════════ */

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-page)' }}>
        <Loader2 size={30} className="animate-spin" style={{ color: 'var(--accent)' }} />
      </div>
    );
  }

  if (error || !car) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg-page)' }}>
        <div className="text-center">
          <AlertCircle size={44} className="mx-auto mb-3" style={{ color: '#dc2626' }} />
          <p className="font-bold" style={{ color: 'var(--text-primary)' }}>{error || t('car.notFound')}</p>
          <button
            onClick={() => router.push('/cars')}
            className="mt-5 px-6 py-2.5 rounded-xl text-sm font-bold"
            style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
          >
            {t('common.viewAll')}
          </button>
        </div>
      </div>
    );
  }

  const title = carTitle(car) ? `${carTitle(car)}${car.year ? ` ${car.year}` : ''}` : toTitleCase(car.title);
  const currentImg = images[imageIndex];
  const contactPhone = car.store?.whatsapp || car.store?.phone;
  const maskedPhone = maskPhone(contactPhone);
  const whatsappLink = getWhatsAppLink(contactPhone);
  const memberSince = formatMemberSince(car.store?.createdAt);
  const needsCssWatermark = !isCloudinary(getImageUrl(currentImg));
  const cityLabel = toTitleCase(car.city || car.store?.city || '');
  const conditionLabel = CONDITION_LABELS[car.condition]
    ? t(CONDITION_LABELS[car.condition])
    : humanizeEnum(car.condition);

  /* ✅ CHIP ROW ka data — jo field khali hai wo apne aap gir jati hai */
  const chips = [
    { icon: Calendar, label: t('car.year'), value: car.year || null },
    { icon: Gauge, label: t('car.mileage'), value: car.mileage ? `${Number(car.mileage).toLocaleString('en-US')} km` : null },
    { icon: Fuel, label: t('car.fuelType'), value: humanizeEnum(car.fuelType) },
    { icon: Settings2, label: t('car.transmission'), value: humanizeEnum(car.transmission) },
    { icon: Cog, label: t('car.engine'), value: car.engineCC ? `${car.engineCC} cc` : null },
    { icon: Shapes, label: t('car.bodyType'), value: humanizeEnum(car.bodyType) },
    { icon: Palette, label: t('car.color'), value: car.color && car.color !== 'N/A' ? toTitleCase(car.color) : null },
    { icon: MapPin, label: t('car.city'), value: cityLabel || null },
  ];

  const filledChips = chips.filter((c) => c.value);

  return (
    <div className="min-h-screen pb-24 sm:pb-28" style={{ background: 'var(--bg-page)', color: 'var(--text-primary)' }}>
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-6">

        {/* ══ Breadcrumb ══ */}
        <nav
          className="flex items-center gap-1.5 text-[10px] sm:text-xs mb-3 overflow-x-auto whitespace-nowrap"
          style={{ color: 'var(--text-muted)' }}
        >
          <Link href="/" className="hover:opacity-70">{t('nav.home')}</Link>
          <span>/</span>
          <Link href="/cars" className="hover:opacity-70">{t('nav.cars')}</Link>
          {car.brand && (
            <>
              <span>/</span>
              <Link href={`/cars?brand=${encodeURIComponent(car.brand)}`} className="hover:opacity-70">
                {toTitleCase(car.brand)}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="truncate" style={{ color: 'var(--text-secondary)' }}>{title}</span>
        </nav>

        {/* ══ Title (desktop) ══ */}
        {isDesktop && (
          <h1
            className="text-2xl md:text-3xl font-black mb-4 leading-snug break-words"
            style={{ color: 'var(--text-primary)' }}
          >
            {title}
          </h1>
        )}

        {/* ══ Main grid ══ */}
        <div
          style={{
            display: 'flex',
            flexDirection: isDesktop ? 'row' : 'column',
            gap: isDesktop ? '24px' : '14px',
            marginBottom: isDesktop ? '28px' : '20px',
            alignItems: 'flex-start',
          }}
        >
          {/* ── LEFT: gallery ── */}
          <div style={{ flex: isDesktop ? 1 : 'none', minWidth: 0, width: isDesktop ? 'auto' : '100%' }}>
            <div
              className="relative rounded-xl overflow-hidden"
              style={{ aspectRatio: '4/3', background: '#0a0a0a' }}
              onTouchStart={onTouchStart}
              onTouchEnd={(e) => onTouchEnd(e, images)}
            >
              {images.length > 0 ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getWatermarkedUrl(currentImg)}
                    alt={title}
                    onClick={() => setLightboxOpen(true)}
                    draggable={false}
                    onContextMenu={(e) => e.preventDefault()}
                    className="cursor-zoom-in select-none"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      objectPosition: 'center',
                      display: 'block',
                    }}
                  />

                  {needsCssWatermark && (
                    <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-center">
                      <span className="text-white/[0.20] font-black tracking-wide whitespace-nowrap text-2xl sm:text-4xl md:text-5xl">
                        {WATERMARK_TEXT}
                      </span>
                    </div>
                  )}

                  {/* ✅ Price badge — emerald ki jagah brand gold */}
                  <span
                    className="absolute top-2.5 left-2.5 font-black text-[12px] sm:text-base px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-lg pointer-events-none"
                    style={{
                      background: 'var(--accent)',
                      color: 'var(--accent-text)',
                      boxShadow: '0 4px 14px rgba(0,0,0,0.35)',
                    }}
                  >
                    {formatPrice(car.price)}
                  </span>

                  {/* ✅ 🔍 emoji ki jagah icon */}
                  <span
                    className="absolute bottom-2.5 left-2.5 text-[11px] px-2.5 py-1 rounded-full hidden sm:flex items-center gap-1.5 pointer-events-none"
                    style={{ background: 'rgba(0,0,0,0.6)', color: '#fff' }}
                  >
                    <Maximize2 size={11} /> {t('car.enlargeHint')}
                  </span>

                  <span
                    className="absolute bottom-2.5 right-2.5 text-[10px] sm:text-xs px-2.5 py-1 rounded-full pointer-events-none"
                    style={{ background: 'rgba(0,0,0,0.6)', color: '#fff' }}
                  >
                    {imageIndex + 1} / {images.length}
                  </span>

                  <div className="absolute top-2.5 right-2.5 flex gap-2 z-10">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleWishlist(); }}
                      disabled={wishlistLoading}
                      aria-label={t('nav.wishlist')}
                      className="p-2 rounded-full backdrop-blur-sm transition-colors disabled:opacity-60"
                      style={{ background: wished ? 'rgba(220,38,38,0.85)' : 'rgba(0,0,0,0.45)' }}
                    >
                      <Heart size={15} color="#fff" fill={wished ? 'currentColor' : 'none'} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); navigator.share?.({ title, url: window.location.href }); }}
                      aria-label={t('common.share')}
                      className="p-2 rounded-full backdrop-blur-sm transition-colors"
                      style={{ background: 'rgba(0,0,0,0.45)' }}
                    >
                      <Share2 size={15} color="#fff" />
                    </button>
                  </div>

                  {images.length > 1 && (
                    <>
                      <button
                        onClick={(e) => { e.stopPropagation(); setImageIndex((i) => (i - 1 + images.length) % images.length); }}
                        aria-label={t('car.previousImage')}
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-2 sm:p-2.5 rounded-full z-10"
                        style={{ background: 'rgba(0,0,0,0.5)', color: '#fff' }}
                      ><ChevronLeft size={20} /></button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setImageIndex((i) => (i + 1) % images.length); }}
                        aria-label={t('car.nextImage')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 sm:p-2.5 rounded-full z-10"
                        style={{ background: 'rgba(0,0,0,0.5)', color: '#fff' }}
                      ><ChevronRight size={20} /></button>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2" style={{ color: '#666' }}>
                  <CarIcon size={34} strokeWidth={1.2} />
                  <span className="text-xs">{t('car.noImages')}</span>
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pt-2.5 pb-1">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setImageIndex(idx)}
                    aria-label={`${t('car.noImages')} ${idx + 1}`}
                    className="flex-shrink-0 w-16 h-12 sm:w-20 sm:h-14 rounded-lg overflow-hidden transition-all"
                    style={{
                      background: '#0a0a0a',
                      border: `2px solid ${idx === imageIndex ? 'var(--accent)' : 'transparent'}`,
                      opacity: idx === imageIndex ? 1 : 0.55,
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={getImageUrl(img)} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* ── Mobile: naam + price ── */}
            {!isDesktop && (
              <div className="mt-3.5">
                <h1 className="text-lg font-black mb-1 leading-snug break-words" style={{ color: 'var(--text-primary)' }}>
                  {title}
                </h1>
                <p className="text-2xl font-black leading-tight" style={{ color: 'var(--accent)' }}>
                  {formatPrice(car.price)}
                </p>
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {formatPriceExact(car.price)}
                </p>
              </div>
            )}

            {/* ═══════════════════════════════════════════════
                ✅ SPEC CHIPS — yahi wo "buttons type" hain
                ═══════════════════════════════════════════════ */}
            {filledChips.length > 0 && (
              <div className="mt-4 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {filledChips.map((c) => (
                  <SpecChip key={c.label} icon={c.icon} label={c.label} value={c.value} />
                ))}
              </div>
            )}
          </div>

          {/* ── RIGHT: price + seller ── */}
          {car.store && (
            <div
              className="space-y-3"
              style={{
                width: isDesktop ? '340px' : '100%',
                flexShrink: 0,
                position: isDesktop ? 'sticky' : 'static',
                top: isDesktop ? '24px' : 'auto',
              }}
            >
              {isDesktop && (
                <div
                  className="rounded-2xl p-5"
                  style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', boxShadow: 'var(--card-shadow)' }}
                >
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>{t('car.askingPrice')}</p>
                  <p className="text-3xl font-black leading-tight" style={{ color: 'var(--accent)' }}>
                    {formatPrice(car.price)}
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    {formatPriceExact(car.price)}
                  </p>
                </div>
              )}

              <div
                className="rounded-2xl p-5"
                style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', boxShadow: 'var(--card-shadow)' }}
              >
                {/* Seller */}
                <div className="flex items-center gap-3 mb-3">
                  {car.store.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={car.store.logo}
                      alt={car.store.name}
                      className="w-11 h-11 rounded-full object-cover flex-shrink-0"
                      style={{ border: '1px solid var(--border-color)' }}
                    />
                  ) : (
                    <div
                      className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: 'var(--bg-surface-alt)' }}
                    >
                      <Store size={17} strokeWidth={1.7} style={{ color: 'var(--accent)' }} />
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-bold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                        {personName(car.store.name) || t('seller.dealer')}
                      </p>
                      {car.store.isVerified && <CheckCircle2 size={14} className="flex-shrink-0" style={{ color: '#059669' }} />}
                    </div>
                    {car.store.rating > 0 && (
                      <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--accent)' }}>
                        <Star size={11} fill="currentColor" />
                        <span>{car.store.rating.toFixed(1)}</span>
                        {car.store.totalReviews > 0 && (
                          <span style={{ color: 'var(--text-muted)' }}>({car.store.totalReviews})</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mb-4 space-y-1">
                  <p className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    <MapPin size={13} style={{ color: 'var(--text-muted)' }} className="flex-shrink-0" />
                    {toTitleCase(car.store.city) || t('car.pakistan')}
                  </p>
                  {memberSince && (
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{t('seller.memberSince')} {memberSince}</p>
                  )}
                </div>

                {/* ✅ Blue gradient hata kar solid accent */}
                <button
                  onClick={handleChat}
                  disabled={chatLoading}
                  className="w-full flex items-center justify-center gap-2 font-bold py-3 rounded-xl text-sm transition-transform active:scale-[0.98] disabled:opacity-60"
                  style={{
                    background: 'var(--accent)',
                    color: 'var(--accent-text)',
                    boxShadow: '0 8px 20px -8px rgba(232,184,75,0.55)',
                  }}
                >
                  {chatLoading
                    ? <><Loader2 size={16} className="animate-spin" />{t('common.loading')}</>
                    : <><MessageCircle size={16} />{t('seller.sendMessage')}</>}
                </button>

                <div className="space-y-2 mt-2.5">
                  {contactPhone && whatsappLink && (
                    <a
                      href={whatsappLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => { if (!requireAuth()) e.preventDefault(); }}
                      className="w-full flex items-center gap-3 rounded-xl px-3.5 py-2.5 transition-colors active:scale-[0.98]"
                      style={{ background: 'var(--bg-surface-alt)', border: '1px solid var(--border-color)' }}
                    >
                      <span
                        className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(37,211,102,0.14)' }}
                      >
                        <WhatsAppIcon size={15} className="text-[#25D366]" />
                      </span>
                      <span className="min-w-0 text-left">
                        <span className="block text-sm font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>{t('seller.whatsapp')}</span>
                        <span className="block text-xs truncate" style={{ color: 'var(--text-muted)' }}>{maskedPhone}</span>
                      </span>
                    </a>
                  )}

                  {contactPhone && (
                    showPhone ? (
                      <a
                        href={`tel:${contactPhone}`}
                        className="w-full flex items-center gap-3 rounded-xl px-3.5 py-2.5 transition-colors active:scale-[0.98]"
                        style={{ background: 'var(--bg-surface-alt)', border: '1px solid var(--border-color)' }}
                      >
                        <span
                          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ background: 'rgba(232,184,75,0.14)' }}
                        >
                          <Phone size={15} style={{ color: 'var(--accent)' }} />
                        </span>
                        <span className="min-w-0 text-left">
                          <span className="block text-sm font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>{contactPhone}</span>
                          <span className="block text-xs" style={{ color: 'var(--text-muted)' }}>{t('seller.tapToCall')}</span>
                        </span>
                      </a>
                    ) : (
                      <button
                        onClick={() => { if (requireAuth()) setShowPhone(true); }}
                        className="w-full flex items-center gap-3 rounded-xl px-3.5 py-2.5 transition-colors active:scale-[0.98]"
                        style={{ background: 'var(--bg-surface-alt)', border: '1px solid var(--border-color)' }}
                      >
                        <span
                          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ background: 'rgba(232,184,75,0.14)' }}
                        >
                          <Phone size={15} style={{ color: 'var(--accent)' }} />
                        </span>
                        <span className="min-w-0 text-left">
                          <span className="block text-sm font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>{maskedPhone}</span>
                          <span className="block text-xs" style={{ color: 'var(--text-muted)' }}>{t('seller.tapToShow')}</span>
                        </span>
                      </button>
                    )
                  )}

                  {car.store.slug && car.store.isVerified && (
                    <button
                      onClick={() => router.push(`/stores/${car.store.slug}`)}
                      className="w-full flex items-center gap-3 rounded-xl px-3.5 py-2.5 transition-colors active:scale-[0.98]"
                      style={{ background: 'var(--bg-surface-alt)', border: '1px solid var(--border-color)' }}
                    >
                      <span
                        className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: 'var(--card-bg)' }}
                      >
                        <Store size={15} style={{ color: 'var(--text-secondary)' }} />
                      </span>
                      <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{t('seller.visitShowroom')}</span>
                    </button>
                  )}

                  {/* ✅ Purple→pink gradient hata kar gold outline */}
                  {car.isForExchange && (
                    <button
                      onClick={() => router.push(`/exchange-request?dealCarId=${car.id}&dealerStoreId=${car.storeId}`)}
                      className="w-full flex items-center justify-center gap-2 font-bold py-2.5 rounded-xl text-sm transition-colors active:scale-[0.98]"
                      style={{ border: '1.5px solid var(--accent)', color: 'var(--accent)', background: 'transparent' }}
                    >
                      <Send size={15} />
                      {t('seller.offerExchange')}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════════
            SPECIFICATIONS + FEATURES + DESCRIPTION
            ══════════════════════════════════════════════ */}
        <div className="grid lg:grid-cols-2 gap-4 sm:gap-5">

          {/* ── Specifications table ── */}
          <section
            className="rounded-2xl p-5"
            style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}
          >
            <h2 className="text-base font-black mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <span className="w-1 h-5 rounded-full" style={{ background: 'var(--accent)' }} />
              {t('car.specifications')}
            </h2>

            <div>
              <SpecRow label={t('car.brand')} value={toTitleCase(car.brand)} />
              <SpecRow label={t('car.model')} value={toTitleCase(car.model)} />
              <SpecRow label={t('car.variant')} value={car.variant ? toTitleCase(car.variant) : null} />
              <SpecRow label={t('car.modelYear')} value={car.year} />
              <SpecRow label={t('car.mileageKm')} value={car.mileage ? `${Number(car.mileage).toLocaleString('en-US')} km` : null} />
              <SpecRow label={t('car.engine')} value={car.engineCC ? `${car.engineCC} cc` : null} />
              <SpecRow label={t('car.transmission')} value={humanizeEnum(car.transmission)} />
              <SpecRow label={t('car.fuelType')} value={humanizeEnum(car.fuelType)} />
              <SpecRow label={t('car.bodyType')} value={humanizeEnum(car.bodyType)} />
              <SpecRow label={t('car.color')} value={car.color && car.color !== 'N/A' ? toTitleCase(car.color) : null} />
              <SpecRow label={t('car.condition')} value={conditionLabel} />
              <SpecRow label={t('car.city')} value={cityLabel} />
            </div>

            {/* ⚠️ Agar bohat si rows khali hain to seller ko batao —
                buyer ka pehla sawal hamesha yehi hota hai */}
            {filledChips.length < 4 && (
              <p className="text-[11px] mt-3 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                {t('car.askSellerMissingDetails')}
              </p>
            )}
          </section>

          {/* ── Features ── */}
          <div className="space-y-4 sm:space-y-5">
            {car.features?.length > 0 && (
              <section
                className="rounded-2xl p-5"
                style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}
              >
                {/* ✅ ✨ emoji hata diya */}
                <h2 className="text-base font-black mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <span className="w-1 h-5 rounded-full" style={{ background: 'var(--accent)' }} />{t('car.features')}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                  {car.features.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-[13px]" style={{ color: 'var(--text-secondary)' }}>
                      <CheckCircle2 size={13} className="flex-shrink-0" style={{ color: 'var(--accent)' }} />
                      {f.name}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {car.description && (
              <section
                className="rounded-2xl p-5"
                style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}
              >
                {/* ✅ 📝 emoji hata diya */}
                <h2 className="text-base font-black mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <span className="w-1 h-5 rounded-full" style={{ background: 'var(--accent)' }} />
                  <FileText size={15} style={{ color: 'var(--accent)' }} />
                  {t('car.sellerDescription')}
                </h2>
                <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: 'var(--text-secondary)' }}>
                  {car.description}
                </p>
              </section>
            )}

            {/* ✅ Orange box hata kar neutral card */}
            <section
              className="rounded-2xl p-5"
              style={{ background: 'var(--bg-surface-alt)', border: '1px solid var(--border-color)' }}
            >
              <h3 className="font-black mb-3 flex items-center gap-2 text-sm" style={{ color: 'var(--text-primary)' }}>
                <ShieldCheck size={16} style={{ color: 'var(--accent)' }} />
                {t('car.beforeBuying')}
              </h3>
              <ul className="space-y-2 text-[13px]" style={{ color: 'var(--text-secondary)' }}>
                {[
                  t('safety.tip1'),
                  t('safety.tip2'),
                  t('safety.tip3'),
                  t('safety.tip4'),
                  t('safety.tip5'),
                ].map((tip) => (
                  <li key={tip} className="flex items-start gap-2">
                    <CheckCircle2 size={13} className="shrink-0 mt-0.5" style={{ color: 'var(--accent)' }} />
                    {tip}
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>

        {/* ══ Related ══ */}
        <div className="mt-10 sm:mt-14">
          <div className="flex items-end justify-between gap-4 mb-4">
            <h2 className="text-xl sm:text-2xl font-black flex items-center gap-2.5" style={{ color: 'var(--text-primary)' }}>
              <span className="w-1 h-6 rounded-full" style={{ background: 'var(--accent)' }} />
              {t('car.relatedCars')}
            </h2>
            <Link
              href={car.brand ? `/cars?brand=${encodeURIComponent(car.brand)}` : '/cars'}
              className="shrink-0 flex items-center gap-1.5 text-sm font-bold transition-opacity hover:opacity-75"
              style={{ color: 'var(--accent)' }}
            >
              {t('car.viewAllRelated')} <ArrowRight size={15} />
            </Link>
          </div>

          {relatedLoading ? (
            <div className="flex items-center justify-center py-14">
              <Loader2 size={24} className="animate-spin" style={{ color: 'var(--accent)' }} />
            </div>
          ) : relatedCars.length > 0 ? (
            // ⚠️ CarCard horizontal row hai — grid mein squeeze hone se
            // toot-ta hai. Is liye ek column ki list.
            <div className="flex flex-col gap-3">
              {relatedCars.map((c) => <CarCard key={c.id} car={c} />)}
            </div>
          ) : (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {t('car.noRelated')}
            </p>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          LIGHTBOX — hamesha kaala (photo viewer ka usool)
          ══════════════════════════════════════════════ */}
      {lightboxOpen && images.length > 0 && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, backgroundColor: '#000', display: 'flex', flexDirection: 'column' }}>
          <button
            onClick={() => setLightboxOpen(false)}
            aria-label={t('common.close')}
            style={{
              position: 'absolute', top: 16, right: 16, zIndex: 100000,
              width: 44, height: 44, borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.18)',
              border: '2px solid rgba(255,255,255,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', cursor: 'pointer',
            }}
          >
            <X size={22} strokeWidth={2.5} />
          </button>

          <div style={{
            position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)',
            zIndex: 100000, backgroundColor: 'rgba(0,0,0,0.6)',
            color: '#fff', fontSize: 13, padding: '4px 14px', borderRadius: 999,
          }}>
            {imageIndex + 1} / {images.length}
          </div>

          <div
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}
            onClick={() => setLightboxOpen(false)}
            onTouchStart={onTouchStart}
            onTouchEnd={(e) => onTouchEnd(e, images)}
          >
            {images.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); setImageIndex((i) => (i - 1 + images.length) % images.length); }}
                aria-label={t('car.previousImage')}
                style={{
                  position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                  zIndex: 100001, width: 44, height: 44, borderRadius: '50%',
                  backgroundColor: 'rgba(255,255,255,0.15)', border: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', cursor: 'pointer',
                }}
              ><ChevronLeft size={26} /></button>
            )}

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={getWatermarkedUrl(images[imageIndex])}
              alt={title}
              onClick={(e) => e.stopPropagation()}
              onContextMenu={(e) => e.preventDefault()}
              draggable={false}
              style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain', userSelect: 'none', padding: '60px 70px' }}
            />

            {needsCssWatermark && (
              <div
                aria-hidden="true"
                style={{
                  position: 'absolute', inset: 0, zIndex: 100000,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  pointerEvents: 'none',
                }}
              >
                <span style={{
                  color: 'rgba(255,255,255,0.18)', fontWeight: 800,
                  fontSize: 'clamp(28px, 6vw, 72px)', letterSpacing: '0.04em', whiteSpace: 'nowrap',
                }}>
                  {WATERMARK_TEXT}
                </span>
              </div>
            )}

            {images.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); setImageIndex((i) => (i + 1) % images.length); }}
                aria-label={t('car.nextImage')}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  zIndex: 100001, width: 44, height: 44, borderRadius: '50%',
                  backgroundColor: 'rgba(255,255,255,0.15)', border: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', cursor: 'pointer',
                }}
              ><ChevronRight size={26} /></button>
            )}
          </div>

          {/* Bottom bar — ✅ emojis nikal diye, icons lag gaye */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'rgba(0,0,0,0.92)',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              padding: '10px 16px',
              display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 14,
              fontSize: 13, color: '#cbd5e1',
            }}
          >
            {car.year ? <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Calendar size={13} />{car.year}</span> : null}
            {car.mileage ? <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Gauge size={13} />{Number(car.mileage).toLocaleString('en-US')} km</span> : null}
            {car.engineCC ? <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Cog size={13} />{car.engineCC} cc</span> : null}

            <span style={{ marginLeft: 'auto', fontWeight: 800, color: '#e8b84b', fontSize: 15 }}>
              {formatPrice(car.price)}
            </span>

            <button
              onClick={handleChat}
              disabled={chatLoading}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                backgroundColor: '#e8b84b', color: '#161616', fontWeight: 700,
                padding: '8px 16px', borderRadius: 8, fontSize: 13,
                border: 'none', cursor: 'pointer', opacity: chatLoading ? 0.6 : 1,
              }}
            >
              <MessageCircle size={15} />{t('exchange.message')}</button>
          </div>

          {images.length > 1 && (
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: '#000', borderTop: '1px solid rgba(255,255,255,0.1)',
                display: 'flex', gap: 8, overflowX: 'auto', padding: '8px 16px',
              }}
            >
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setImageIndex(idx)}
                  aria-label={`${t('car.noImages')} ${idx + 1}`}
                  style={{
                    flexShrink: 0, width: 68, height: 48, borderRadius: 6, overflow: 'hidden',
                    border: idx === imageIndex ? '2px solid #e8b84b' : '2px solid transparent',
                    opacity: idx === imageIndex ? 1 : 0.5,
                    cursor: 'pointer', padding: 0, background: 'none',
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={getImageUrl(img)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════ STICKY BOTTOM BAR ══════ */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 px-3 sm:px-4 py-2.5"
        style={{
          background: 'var(--bg-header)',
          borderTop: '1px solid var(--border-color)',
          opacity: barVisible ? 1 : 0,
          transform: barVisible ? 'translateY(0)' : 'translateY(100%)',
          pointerEvents: barVisible ? 'auto' : 'none',
          transition: 'opacity 300ms ease-out, transform 300ms ease-out',
          paddingBottom: 'calc(0.625rem + env(safe-area-inset-bottom))',
        }}
      >
        <div className="max-w-7xl mx-auto flex items-center gap-2 sm:gap-3">
          <div className="min-w-0 flex-1">
            <p className="font-black text-sm truncate" style={{ color: 'var(--accent)' }}>
              {formatPrice(car.price)}
            </p>
            <p className="text-[10px] sm:text-xs truncate" style={{ color: 'var(--text-muted)' }}>
              {personName(car.store?.name) || title}
            </p>
          </div>

          {contactPhone && whatsappLink && (
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              title={t('seller.whatsapp')}
              aria-label={t('seller.whatsapp')}
              onClick={(e) => { if (!requireAuth()) e.preventDefault(); }}
              className="flex items-center justify-center w-9 h-9 sm:w-11 sm:h-11 flex-shrink-0 rounded-xl transition-transform active:scale-95"
              style={{ background: 'rgba(37,211,102,0.14)', border: '1px solid rgba(37,211,102,0.40)', color: '#25D366' }}
            >
              <WhatsAppIcon size={17} />
            </a>
          )}

          {contactPhone && (
            showPhone ? (
              <a
                href={`tel:${contactPhone}`}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 text-[12px] sm:text-sm font-bold py-2.5 px-3 sm:px-4 rounded-xl transition-transform active:scale-[0.98]"
                style={{ border: '1.5px solid var(--accent)', color: 'var(--accent)' }}
              >
                <Phone size={14} />
                <span className="hidden sm:inline">{contactPhone}</span>
                <span className="sm:hidden">{t('seller.call')}</span>
              </a>
            ) : (
              <button
                onClick={() => { if (requireAuth()) setShowPhone(true); }}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 text-[12px] sm:text-sm font-bold py-2.5 px-3 sm:px-4 rounded-xl transition-transform active:scale-[0.98]"
                style={{ border: '1.5px solid var(--accent)', color: 'var(--accent)' }}
              >
                <Phone size={14} />
                <span className="hidden sm:inline">{t('seller.showNumber')}</span>
                <span className="sm:hidden">{t('seller.call')}</span>
              </button>
            )
          )}

          <button
            onClick={handleChat}
            disabled={chatLoading}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 text-[12px] sm:text-sm font-bold py-2.5 px-3 sm:px-4 rounded-xl transition-transform active:scale-[0.98] disabled:opacity-60"
            style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
          >
            <MessageCircle size={14} />
            <span className="hidden sm:inline">{t('seller.sendMessage')}</span>
            <span className="sm:hidden">{t('exchange.message')}</span>
          </button>
        </div>
      </div>

      {/* ✅ Ab /login par redirect nahi — wahi modal jo poori site par hai */}
      {showAuth && (
        <AuthModal
          onClose={() => setShowAuth(false)}
          message={t('car.contactSellerLogin')}
          redirectAfter={`/cars/${carId}`}
        />
      )}

      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { scrollbar-width: none; -ms-overflow-style: none; }
      `}</style>
    </div>
  );
}