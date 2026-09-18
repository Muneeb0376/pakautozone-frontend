'use client';
import { useLang } from '@/lib/i18nContext';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Package, Filter, X, MessageCircle, Phone, MapPin, ChevronDown, Heart,
  ChevronLeft, ChevronRight, LayoutGrid, Cog, Disc, Settings2, Cable,
  BatteryCharging, CarFront, ShieldCheck, Lightbulb, Armchair, Snowflake,
  Thermometer, Wind, Settings, Droplet, CircleDot, Compass, PanelTop,
  Volume2, Gauge, DoorOpen, Wrench, Radio, Sparkles, KeyRound,
} from 'lucide-react';
import { useTheme } from '@/lib/themeContext';
import { useWishlistStore, hasToken } from '@/store/wishlistStore';
// ✅ PRICE — poori site par ek jaisa Pakistani format (lacs / crore)
import { formatPrice } from '@/lib/formatPrice';

const API = process.env.NEXT_PUBLIC_API_URL || '/api';
const BASE_URL = API.replace('/api', '');

const getImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};

const maskPhone = (phone) => {
  if (!phone) return null;
  const d = phone.replace(/\D/g, '');
  if (d.length < 7) return phone;
  return `${d.slice(0, 4)}-***-${d.slice(-2)}`;
};

const getWhatsAppLink = (phone, partName) => {
  if (!phone) return null;
  const d = phone.replace(/\D/g, '');
  const num = d.startsWith('0') ? `92${d.slice(1)}` : d;
  const msg = `Assalam o Alaikum! Mujhe "${partName}" chahiye. Kya available hai?`;
  return `https://wa.me/${num}?text=${encodeURIComponent(msg)}`;
};

// ✅ REALISTIC, A-Z SPARE-PART CATEGORIES
// Har category ko ek dedicated icon + color mila hai taake filter pills aur
// card badges/fallback images asal auto-parts store jaisi lagein, generic
// emoji list ki jagah.
// ✅ PHASE 5 — 26 chamakdaar rang hata kar ek hi neutral/gold family.
// Icons ab bhi alag alag hain (pehchan ke liye), lekin rang ek jaisa —
// is se page premium lagta hai, bachon ki drawing jaisa nahi.
const CATEGORY_META = [
  { value: '', label: 'All Categories', icon: LayoutGrid, color: '#8a8578' },
  { value: 'engine', label: 'Engine Parts', icon: Cog, color: '#a17c33' },
  { value: 'brakes', label: 'Brakes', icon: Disc, color: '#8a8578' },
  { value: 'suspension', label: 'Suspension', icon: Settings2, color: '#a17c33' },
  { value: 'electrical', label: 'Electrical & Wiring', icon: Cable, color: '#c9a04b' },
  { value: 'battery', label: 'Batteries', icon: BatteryCharging, color: '#8a8578' },
  { value: 'body', label: 'Body Parts', icon: CarFront, color: '#a17c33' },
  { value: 'bumpers', label: 'Bumpers & Grills', icon: ShieldCheck, color: '#8a8578' },
  { value: 'lights', label: 'Lights & Headlamps', icon: Lightbulb, color: '#c9a04b' },
  { value: 'interior', label: 'Interior & Seats', icon: Armchair, color: '#a17c33' },
  { value: 'ac', label: 'AC & Cooling', icon: Snowflake, color: '#8a8578' },
  { value: 'radiator', label: 'Radiator & Cooling', icon: Thermometer, color: '#a17c33' },
  { value: 'exhaust', label: 'Exhaust & Silencer', icon: Wind, color: '#8a8578' },
  { value: 'clutch', label: 'Clutch & Gearbox', icon: Settings, color: '#a17c33' },
  { value: 'fuel', label: 'Fuel System', icon: Droplet, color: '#c9a04b' },
  { value: 'filters', label: 'Filters (Air/Oil)', icon: Filter, color: '#8a8578' },
  { value: 'tyres', label: 'Tyres & Rims', icon: CircleDot, color: '#6b6259' },
  { value: 'mirrors', label: 'Mirrors', icon: Compass, color: '#8a8578' },
  { value: 'glass', label: 'Glass & Windshield', icon: PanelTop, color: '#a17c33' },
  { value: 'audio', label: 'Audio & Speakers', icon: Volume2, color: '#8a8578' },
  { value: 'dashboard', label: 'Dashboard & Meters', icon: Gauge, color: '#a17c33' },
  { value: 'doors', label: 'Doors & Bonnet', icon: DoorOpen, color: '#8a8578' },
  { value: 'tools', label: 'Tools & Accessories', icon: Wrench, color: '#6b6259' },
  { value: 'sensors', label: 'Sensors & Electronics', icon: Radio, color: '#a17c33' },
  { value: 'paint', label: 'Paint & Body Kits', icon: Sparkles, color: '#c9a04b' },
  { value: 'locks', label: 'Locks & Keys', icon: KeyRound, color: '#8a8578' },
  { value: 'other', label: 'Other', icon: Package, color: '#6b6259' },
];

const CATEGORY_KEYS = Object.fromEntries(
  CATEGORY_META.map((category) => [
    category.value,
    category.value ? `parts.category.${category.value}` : 'parts.allCategories',
  ])
);

const getCategoryMeta = (value) =>
  CATEGORY_META.find((c) => c.value === (value || '').toLowerCase()) ||
  CATEGORY_META[CATEGORY_META.length - 1];

const CITIES = [
  '', 'Karachi', 'Lahore', 'Islamabad', 'Rawalpindi',
  'Multan', 'Peshawar', 'Quetta', 'Faisalabad',
  'Gujranwala', 'Hyderabad', 'Abbottabad', 'Haripur',
  'Sukkur', 'Sialkot', 'Bahawalpur',
];

export default function SparePartsPage() {
  const { t } = useLang();
  const router = useRouter();
  const { theme } = useTheme();
  const dark = theme === 'dark';

  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ category: '', city: '', brand: '', condition: '' });

  // ✅ Category strip ke aagay/peechay arrows ke liye scroll ref + edge state
  const catScrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = () => {
    const el = catScrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    updateScrollState();
    const el = catScrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, []);

  const scrollCategories = (dir) => {
    const el = catScrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.min(320, el.clientWidth * 0.8), behavior: 'smooth' });
  };

  // ✅ Wishlist — cars wale CarCard.jsx jaisa hi pattern (partIds Set se
  // O(1) lookup, togglePartWishlist se optimistic add/remove)
  const partIds = useWishlistStore((s) => s.partIds);
  const togglePartWishlist = useWishlistStore((s) => s.togglePartWishlist);
  const fetchPartWishlist = useWishlistStore((s) => s.fetchPartWishlist);

  useEffect(() => {
    fetchParts();
  }, [filters]);

  useEffect(() => {
    const state = useWishlistStore.getState();
    if (!state.initialized) {
      fetchPartWishlist();
    }
  }, [fetchPartWishlist]);

  const handleWishlistClick = async (e, partId) => {
    e.stopPropagation();
    if (!hasToken()) {
      router.push('/login');
      return;
    }
    try {
      await togglePartWishlist(partId);
    } catch (err) {
      console.error('Part wishlist update failed:', err);
    }
  };

  const fetchParts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.category) params.append('category', filters.category);
      if (filters.city) params.append('city', filters.city);
      if (filters.brand) params.append('brand', filters.brand);
      if (filters.condition) params.append('condition', filters.condition);

      const res = await fetch(`${API}/parts?${params.toString()}`);
      const json = await res.json();
      const data = json.data ?? (Array.isArray(json) ? json : []);
      setParts(Array.isArray(data) ? data : []);
    } catch {
      setParts([]);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => setFilters({ category: '', city: '', brand: '', condition: '' });
  const hasActiveFilters = filters.category || filters.city || filters.brand || filters.condition;

  const goToPart = (partId) => {
    if (!partId) return;
    router.push(`/spare-parts/${partId}`);
  };

  return (
    // ✅ THEME FIX: bg-slate-950 (#020617, neela tint) aur bg-gray-50 hardcoded
    // thay — site ki asli theme #0c0c0d / #ffffff hai. Ab globals.css ke tokens.
    <div className="min-h-screen bg-page-base text-theme-primary">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-5 sm:py-8">

        {/* ━━━━━━━━ HEADER ━━━━━━━━ */}
        <div className="mb-5 sm:mb-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-theme-primary flex items-center gap-2.5">
            <Wrench size={26} strokeWidth={1.7} style={{ color: 'var(--accent)' }} />{t('nav.parts')}</h1>
          <p className="text-xs sm:text-sm mt-1 text-theme-muted">
            {t('parts.available', { count: parts.length })}
          </p>
        </div>

        {/* ━━━━━━━━ CATEGORY QUICK FILTER (arrow nav + touch swipe) ━━━━━━━━ */}
        <div className="relative mb-4 sm:mb-6 -mx-3 px-3 sm:mx-0 sm:px-0">
          {/* Left arrow — desktop only, mobile users swipe */}
          {canScrollLeft && (
            <button
              onClick={() => scrollCategories(-1)}
              aria-label={t('parts.scrollLeft')}
              className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 z-20 w-8 h-8 items-center justify-center rounded-full shadow-lg transition-all hover:scale-110 active:scale-95 bg-surface border border-theme text-theme-primary"
            >
              <ChevronLeft size={16} />
            </button>
          )}

          {/* Edge fade so the arrows read as "more content this way" */}
          {canScrollLeft && (
            <div
              className="hidden sm:block pointer-events-none absolute left-0 top-0 bottom-3 w-10 z-10"
              style={{ background: 'linear-gradient(to right, var(--bg-page), transparent)' }}
            />
          )}
          {canScrollRight && (
            <div
              className="hidden sm:block pointer-events-none absolute right-0 top-0 bottom-3 w-10 z-10"
              style={{ background: 'linear-gradient(to left, var(--bg-page), transparent)' }}
            />
          )}

          <div
            ref={catScrollRef}
            className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-3 scrollbar-hide scroll-smooth touch-pan-x"
          >
            {CATEGORY_META.map((cat) => {
              const Icon = cat.icon;
              const active = filters.category === cat.value;
              return (
                <button
                  key={cat.value}
                  onClick={() => setFilters((f) => ({ ...f, category: cat.value }))}
                  className={`whitespace-nowrap flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border transition-all shrink-0 ${
                    active
                      ? 'border-transparent shadow-lg'
                      : 'bg-surface-alt border-theme text-theme-secondary hover:text-theme-primary'
                  }`}
                  style={active ? { background: 'var(--accent)', color: 'var(--accent-text)' } : undefined}
                >
                  <Icon size={13} style={{ color: active ? 'var(--accent-text)' : cat.color }} className="shrink-0" />
                  {t(CATEGORY_KEYS[cat.value])}
                </button>
              );
            })}
          </div>

          {/* Right arrow — desktop only, mobile users swipe */}
          {canScrollRight && (
            <button
              onClick={() => scrollCategories(1)}
              aria-label={t('parts.scrollRight')}
              className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 z-20 w-8 h-8 items-center justify-center rounded-full shadow-lg transition-all hover:scale-110 active:scale-95 bg-surface border border-theme text-theme-primary"
            >
              <ChevronRight size={16} />
            </button>
          )}
        </div>

        {/* ━━━━━━━━ ADVANCED FILTERS ━━━━━━━━ */}
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1.5 sm:gap-2 border px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all bg-surface-alt border-theme text-theme-primary"
            >
              <Filter size={14} className="shrink-0" />
              <span className="hidden xs:inline">{t('home.advancedFilters')}</span>
              <span className="xs:hidden">{t('common.filters')}</span>
              {hasActiveFilters && (
                <span
                  className="text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
                >
                  {[filters.city, filters.brand, filters.condition].filter(Boolean).length}
                </span>
              )}
              <ChevronDown size={13} className={`transition-transform shrink-0 ${showFilters ? 'rotate-180' : ''}`} />
            </button>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-[11px] sm:text-xs text-rose-400 hover:text-rose-500 transition-colors shrink-0"
              >
                <X size={12} />{t('common.clearAll')}</button>
            )}
          </div>

          {showFilters && (
            <div className="mt-3 glass-card rounded-2xl p-3 sm:p-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* City */}
                <div>
                  <label className="text-[11px] block mb-1 font-semibold uppercase tracking-wider text-theme-muted">{t('common.city')}</label>
                  <select
                    value={filters.city}
                    onChange={e => setFilters(f => ({ ...f, city: e.target.value }))}
                    className="w-full bg-surface-alt border border-theme text-theme-primary rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-amber-400 transition-colors"
                  >
                    <option value="">{t('car.allCities')}</option>
                    {CITIES.filter(Boolean).map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>

                {/* Brand */}
                <div>
                  <label className="text-[11px] block mb-1 font-semibold uppercase tracking-wider text-theme-muted">{t('car.brand')}</label>
                  <input
                    type="text"
                    value={filters.brand}
                    onChange={e => setFilters(f => ({ ...f, brand: e.target.value }))}
                    placeholder={t('parts.brandPlaceholder')}
                    className="w-full bg-surface-alt border border-theme text-theme-primary rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-amber-400 transition-colors"
                  />
                </div>

                {/* Condition */}
                <div>
                  <label className="text-[11px] block mb-1 font-semibold uppercase tracking-wider text-theme-muted">{t('car.condition')}</label>
                  <select
                    value={filters.condition}
                    onChange={e => setFilters(f => ({ ...f, condition: e.target.value }))}
                    className="w-full bg-surface-alt border border-theme text-theme-primary rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-amber-400 transition-colors"
                  >
                    <option value="">{t('car.allConditions')}</option>
                    <option value="New">{t('common.new')}</option>
                    <option value="Used">{t('common.used')}</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ━━━━━━━━ PARTS GRID ━━━━━━━━ */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div
              className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
            />
          </div>
        ) : parts.length === 0 ? (
          <div className="text-center py-16 sm:py-20 glass-card rounded-3xl px-4">
            <Package size={40} className="mx-auto mb-4 text-theme-muted opacity-60" />
            <p className="font-semibold text-sm sm:text-base text-theme-secondary">{t('parts.noneFound')}</p>
            <p className="text-xs sm:text-sm mt-1 text-theme-muted">
              {t('parts.filtersHint')}
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="mt-4 text-sm transition-colors"
                style={{ color: 'var(--accent)' }}
              >
                {t('parts.clearFilters')}
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
            {parts.map((part, idx) => {
              const contactPhone = part.store?.whatsapp || part.store?.phone;
              const maskedPhone = maskPhone(contactPhone);
              const waLink = getWhatsAppLink(contactPhone, part.name);
              const imgUrl = getImageUrl(part.images?.[0]?.url);
              const catMeta = getCategoryMeta(part.category);
              const CatIcon = catMeta.icon;
              const isNew = (part.condition || '').toLowerCase() === 'new';

              return (
                <div
                  key={part.id}
                  onClick={() => goToPart(part.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter') goToPart(part.id); }}
                  className="glass-card spare-part-card rounded-xl sm:rounded-2xl overflow-hidden transition-all duration-300 group flex flex-col cursor-pointer hover:-translate-y-1 hover:shadow-xl"
                  style={{ animationDelay: `${idx * 40}ms` }}
                >
                  {/* Image */}
                  <div className="aspect-square relative overflow-hidden bg-surface-alt">
                    {/* Wishlist heart — top-left, cars wale CarCard jaisa behavior */}
                    <button
                      onClick={(e) => handleWishlistClick(e, part.id)}
                      title={partIds.has(part.id) ? 'Wishlist se hatayein' : 'Wishlist mein add karein'}
                      className={`absolute top-1.5 left-1.5 sm:top-2 sm:left-2 z-10 w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg backdrop-blur-sm transition-all active:scale-90 ${
                        partIds.has(part.id)
                          ? 'bg-red-500/90 text-white'
                          : 'bg-black/50 text-white hover:bg-black/70'
                      }`}
                    >
                      <Heart size={13} className="sm:w-3.5 sm:h-3.5" fill={partIds.has(part.id) ? 'currentColor' : 'none'} />
                    </button>

                    {imgUrl ? (
                      <img
                        src={imgUrl}
                        alt={part.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-400"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      // ✅ Realistic fallback — category ka apna icon + gradient,
                      // taake bina image ke part bhi ek proper catalog tile lage
                      <div
                        className="w-full h-full flex flex-col items-center justify-center gap-2"
                        style={{
                          background: `radial-gradient(circle at 30% 20%, ${catMeta.color}33, transparent 60%), var(--bg-surface-alt)`,
                        }}
                      >
                        <div
                          className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center"
                          style={{ background: `${catMeta.color}22`, border: `1px solid ${catMeta.color}55` }}
                        >
                          <CatIcon size={24} style={{ color: catMeta.color }} />
                        </div>
                        <span className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wide text-theme-muted">
                          {t(CATEGORY_KEYS[catMeta.value])}
                        </span>
                      </div>
                    )}

                    {/* Badges — condition top-left (jaisa CarCard "New Car" pill),
                        category top-right, taake image dhak na jaye */}
                    <div className="absolute top-1.5 left-9 sm:top-2 sm:left-11">
                      <span className={`text-white text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg backdrop-blur-sm ${
                        isNew ? 'bg-emerald-500/85' : 'bg-black/60'
                      }`}>
                        {part.condition?.toLowerCase() === 'new' ? t('common.new') : t('common.used')}
                      </span>
                    </div>
                    <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2">
                      <span
                        className="flex items-center gap-1 backdrop-blur-sm text-white text-[9px] sm:text-[10px] font-semibold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg"
                        style={{ backgroundColor: `${catMeta.color}cc` }}
                      >
                        <CatIcon size={10} />
                        <span className="hidden sm:inline">{t(CATEGORY_KEYS[catMeta.value])}</span>
                      </span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-2.5 sm:p-4 flex flex-col flex-1 gap-1.5 sm:gap-2">
                    <div>
                      <h3 className="font-bold text-xs sm:text-sm line-clamp-2 transition-colors leading-tight text-theme-primary spare-part-title">
                        {part.name}
                      </h3>
                      <p className="text-base sm:text-xl font-extrabold mt-1 sm:mt-2" style={{ color: 'var(--accent)' }}>
                        {formatPrice(part.price)}
                      </p>
                    </div>

                    {/* Location & Store */}
                    <div className="space-y-1 text-[10px] sm:text-xs text-theme-muted">
                      <div className="flex items-center gap-1 sm:gap-1.5">
                        <MapPin size={10} className="shrink-0" />
                        <span className="truncate">{part.store?.city || part.city || t('common.pakistan')}</span>
                      </div>
                      {part.store?.name && (
                        <p className="truncate pl-3.5 sm:pl-4 hidden sm:block">
                          {part.store.name}
                        </p>
                      )}
                    </div>

                    {/* ━━━━ CONTACT SECTION ━━━━ */}
                    <div className="mt-auto pt-2 sm:pt-3 border-t border-theme space-y-1.5 sm:space-y-2">
                      {maskedPhone && (
                        <div className="hidden sm:flex items-center justify-between rounded-lg px-3 py-2 bg-surface-alt border border-theme">
                          <span className="text-[10px] text-theme-muted">{t('parts.contactLabel')}</span>
                          <span className="font-mono text-xs text-theme-secondary">{maskedPhone}</span>
                        </div>
                      )}

                      {contactPhone ? (
                        <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center justify-center gap-1 sm:gap-1.5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-bold text-[10px] sm:text-[11px] transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg shadow-emerald-500/20"
                          >
                            <MessageCircle size={12} className="shrink-0" />
                            <span className="hidden xs:inline">{t('seller.whatsapp')}</span>
                            <span className="xs:hidden">{t('parts.chat')}</span>
                          </a>
                          <a
                            href={`tel:${contactPhone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center justify-center gap-1 sm:gap-1.5 border border-theme bg-surface-alt text-theme-primary py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-bold text-[10px] sm:text-[11px] transition-all duration-200 hover:scale-105 active:scale-95"
                          >
                            <Phone size={12} className="shrink-0" />{t('seller.call')}</a>
                        </div>
                      ) : (
                        <p className="text-center text-[9px] sm:text-[10px] py-2 text-theme-muted">{t('seller.contactUnavailable')}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
          -webkit-overflow-scrolling: touch;
        }
        .spare-part-card:hover {
          border-color: color-mix(in srgb, var(--accent) 45%, transparent);
        }
        .spare-part-card:hover .spare-part-title {
          color: var(--accent);
        }
      `}</style>
    </div>
  );
}