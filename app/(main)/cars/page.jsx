'use client';
import { useLang } from '@/lib/i18nContext';
// frontend/app/(main)/cars/page.jsx
//
// ✅ POORI FILE REPLACE — Phase 4
//
// ══ AAP NE JO KAHA ══
// "Categories ki saari functionalities listings mein bhi daal dena taake
//  functions match karein."
//
// ══ MASLA KYA THA ══
// Homepage ka "Kis tarah dhoondna chahenge?" section aise links banata
// hai:
//     /cars?bodyType=MINIVAN        (7 Seater)
//     /cars?maxYear=2010            (Old Cars)
//     /cars?model=Corolla           (Model tab)
//     /cars?maxPrice=1000000        (Cars under 10 Lakhs)
//     /cars?isFeatured=true         (Featured)
//
// Lekin ye safha in mein se **sirf teen** ko parhta tha (bodyType,
// maxPrice ka aadha hissa, brand). `model`, `minYear`, `maxYear`,
// `isFeatured` ko wo dekhta hi nahi tha — aur `fetchCars` bhi unhe
// backend ko nahi bhejta tha.
//
// Nateeja: homepage se "Old Cars" ya "Corolla" par click karte hi filter
// khaamosh se gir jata tha aur saari cars aa jati thin. Bilkul wahi jo
// aap ne mehsoos kiya ke "functions match nahi karte".
//
// ══ AB ══
// 1. Har wo param jo browseData.js bana sakta hai, yahan parha bhi jata
//    hai aur backend ko bheja bhi jata hai.
// 2. Filter ke saare options ab `browseData.js` se aate hain — wahi ek
//    file jo homepage bhi use karta hai. Ab dono jagah kabhi alag
//    options nahi honge.
// 3. Upar quick category chips ki ek row — homepage wali hi categories,
//    seedha yahan se click karne ke liye.
// 4. "Active filters" ki chips — kaunsa filter laga hua hai wo saaf
//    dikhta hai aur ek click se hat jata hai.
// 5. Sab rang var(--*) tokens par (pehle blue-600, purple-600,
//    amber-500 hardcoded thay).
//
// ⚠️ BACKEND: `model`, `minYear`, `maxYear`, `isFeatured` ka support
//    Phase 2 ke car.controller.js mein add hua hai. Wo file lagayi na ho
//    to ye filters chalenge nahi.

import { useEffect, useState, useCallback, Suspense, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Search, SlidersHorizontal, X, ChevronLeft, ChevronRight,
  Car as CarIcon, Loader2, TrendingUp,
} from 'lucide-react';

import CarCard from '@/components/cars/CarCard';
import { toTitleCase } from '@/lib/textCase';
import {
  BROWSE_CATEGORIES, PK_CITIES, MAKE_NAMES, MAKES, POPULAR_MODELS,
  BODY_TYPES, TRANSMISSIONS, FUEL_TYPES, CONDITIONS, BUDGET_RANGES,
} from '@/components/home/browseData';

const API = process.env.NEXT_PUBLIC_API_URL || '/api';
const PER_PAGE = 12;
const CURRENT_YEAR = new Date().getFullYear();

const CATEGORY_KEYS = {
  'Sports Cars': 'category.sportsCars', 'Electric Cars': 'category.electricCars',
  'Hybrid Cars': 'category.hybridCars', 'Luxury Cars': 'category.luxuryCars',
  'Automatic Cars': 'category.automaticCars', 'Manual Cars': 'category.manualCars',
  'Old Cars': 'category.oldCars', 'New Cars': 'category.newCars',
  '7 Seater': 'category.sevenSeater', 'Carry Daba': 'category.carryDaba',
  'CNG Cars': 'category.cngCars', 'Diesel Cars': 'category.dieselCars',
  'Small Cars': 'category.smallCars', 'Family Cars': 'category.familyCars',
  'Pickup / 4x4': 'category.pickup4x4',
};

const OPTION_KEYS = {
  NEW: 'car.new', USED: 'car.used', CERTIFIED_PREOWNED: 'car.certified',
  SEDAN: 'body.sedan', SUV: 'body.suv', HATCHBACK: 'body.hatchback',
  CROSSOVER: 'body.crossover', COUPE: 'body.coupe', PICKUP: 'body.pickup',
  VAN: 'body.van', MINIVAN: 'body.minivan',
  MANUAL: 'car.manual', AUTOMATIC: 'car.automatic', CVT: 'car.cvt',
  PETROL: 'car.petrol', DIESEL: 'car.diesel', HYBRID: 'car.hybrid',
  ELECTRIC: 'car.electric', CNG: 'car.cng',
};

function translatedOption(t, option) {
  return OPTION_KEYS[option.value] ? t(OPTION_KEYS[option.value]) : option.label;
}

/* Wo saare params jo URL se aa sakte hain */
const EMPTY = {
  search: '', brand: '', model: '', city: '',
  condition: 'ALL', bodyType: 'ALL', transmission: 'ALL', fuelType: 'ALL',
  minPrice: '', maxPrice: '', minYear: '', maxYear: '',
  exchange: false, isFeatured: false,
  sortBy: 'newest', page: 1,
};

function CarsPageInner() {
  const { t } = useLang();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [cars, setCars] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);

  /* ── URL → filters ──
     ✅ Ab HAR param parha jata hai. Pehle model/minYear/maxYear/
     isFeatured chhoot jate thay, is liye homepage ke links kaam nahi
     karte thay. */
  const buildFromParams = useCallback((sp) => ({
    search: sp.get('search') || '',
    brand: sp.get('brand') || '',
    model: sp.get('model') || '',
    city: sp.get('city') || '',
    condition: sp.get('condition') || 'ALL',
    bodyType: sp.get('bodyType') || 'ALL',
    transmission: sp.get('transmission') || 'ALL',
    fuelType: sp.get('fuelType') || 'ALL',
    minPrice: sp.get('minPrice') || '',
    maxPrice: sp.get('maxPrice') || '',
    minYear: sp.get('minYear') || '',
    maxYear: sp.get('maxYear') || '',
    exchange: sp.get('exchange') === 'true',
    isFeatured: sp.get('isFeatured') === 'true',
    sortBy: sp.get('sortBy') || 'newest',
    page: parseInt(sp.get('page') || '1', 10),
  }), []);

  const [filters, setFilters] = useState(() => buildFromParams(searchParams));

  useEffect(() => {
    setFilters(buildFromParams(searchParams));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]);

  /* Drawer khule to background scroll band */
  useEffect(() => {
    if (!drawerOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [drawerOpen]);

  /* ── filters → backend ── */
  const fetchCars = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams();

      if (filters.search) p.set('search', filters.search);
      if (filters.brand) p.set('brand', filters.brand);
      if (filters.model) p.set('model', filters.model);          // ✅ NEW
      if (filters.city) p.set('city', filters.city);
      if (filters.condition !== 'ALL') p.set('condition', filters.condition);
      if (filters.bodyType !== 'ALL') p.set('bodyType', filters.bodyType);
      if (filters.transmission !== 'ALL') p.set('transmission', filters.transmission);
      if (filters.fuelType !== 'ALL') p.set('fuelType', filters.fuelType);
      if (filters.minPrice) p.set('minPrice', filters.minPrice);
      if (filters.maxPrice) p.set('maxPrice', filters.maxPrice);
      if (filters.minYear) p.set('minYear', filters.minYear);    // ✅ NEW
      if (filters.maxYear) p.set('maxYear', filters.maxYear);    // ✅ NEW
      if (filters.exchange) p.set('exchange', 'true');
      if (filters.isFeatured) p.set('isFeatured', 'true');       // ✅ NEW

      p.set('sortBy', filters.sortBy);
      p.set('limit', String(PER_PAGE));
      p.set('page', String(filters.page));

      const res = await fetch(`${API}/cars?${p.toString()}`);
      const json = await res.json();

      if (json.success) {
        setCars(json.data || []);
        setTotal(json.total || 0);
        setPages(json.pages || 1);
      } else {
        setCars([]); setTotal(0); setPages(1);
      }
    } catch {
      setCars([]); setTotal(0); setPages(1);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchCars(); }, [fetchCars]);

  /* ── filters → URL ──
     Filter badalte hi URL bhi badal jata hai, taake user page share ya
     bookmark kar sake aur back button bhi theek chale. */
  const pushFilters = useCallback((next) => {
    const p = new URLSearchParams();
    Object.entries(next).forEach(([k, v]) => {
      if (k === 'page' && v === 1) return;
      if (v === '' || v === false || v === 'ALL' || v === 'newest') return;
      p.set(k, String(v));
    });
    const qs = p.toString();
    router.push(qs ? `/cars?${qs}` : '/cars', { scroll: false });
  }, [router]);

  const updateFilter = (key, value) => {
    const next = { ...filters, [key]: value, page: key === 'page' ? value : 1 };
    setFilters(next);
    pushFilters(next);
  };

  /* Ek saath kai filters (category chip par click) */
  const applyPreset = (query) => {
    const next = { ...EMPTY, sortBy: filters.sortBy, ...query, page: 1 };
    // browseData ke kuch fields 'ALL' ki jagah khali aate hain — normalize
    if (!next.condition) next.condition = 'ALL';
    if (!next.bodyType) next.bodyType = 'ALL';
    if (!next.transmission) next.transmission = 'ALL';
    if (!next.fuelType) next.fuelType = 'ALL';
    // `tag` backend abhi nahi samajhta — bhejna bekaar hai
    delete next.tag;
    setFilters(next);
    pushFilters(next);
    setDrawerOpen(false);
  };

  const clearFilters = () => {
    setFilters({ ...EMPTY, sortBy: filters.sortBy });
    router.push('/cars', { scroll: false });
  };

  /* Brand chunte hi us brand ke models */
  const modelOptions = useMemo(
    () => (filters.brand ? (MAKES[filters.brand] || []) : POPULAR_MODELS),
    [filters.brand]
  );

  /* ── Active filter chips ── */
  const activeChips = useMemo(() => {
    const out = [];
    const add = (key, label, reset) => out.push({ key, label, reset });

    if (filters.brand) add('brand', toTitleCase(filters.brand), '');
    if (filters.model) add('model', toTitleCase(filters.model), '');
    if (filters.city) add('city', toTitleCase(filters.city), '');
    if (filters.condition !== 'ALL') add('condition', translatedOption(t, CONDITIONS.find((c) => c.value === filters.condition) || { value: filters.condition }), 'ALL');
    if (filters.bodyType !== 'ALL') add('bodyType', translatedOption(t, BODY_TYPES.find((b) => b.value === filters.bodyType) || { value: filters.bodyType }), 'ALL');
    if (filters.transmission !== 'ALL') add('transmission', translatedOption(t, TRANSMISSIONS.find((x) => x.value === filters.transmission) || { value: filters.transmission }), 'ALL');
    if (filters.fuelType !== 'ALL') add('fuelType', translatedOption(t, FUEL_TYPES.find((f) => f.value === filters.fuelType) || { value: filters.fuelType }), 'ALL');
    if (filters.minPrice) add('minPrice', `PKR ${Number(filters.minPrice).toLocaleString('en-US')}+`, '');
    if (filters.maxPrice) add('maxPrice', `PKR ${Number(filters.maxPrice).toLocaleString('en-US')} tak`, '');
    if (filters.minYear) add('minYear', `${filters.minYear} se`, '');
    if (filters.maxYear) add('maxYear', `${filters.maxYear} tak`, '');
    if (filters.exchange) add('exchange', t('car.exchange'), false);
    if (filters.isFeatured) add('isFeatured', t('common.featured'), false);

    return out;
  }, [filters, t]);

  /* ═══════════════ Filter form ═══════════════ */
  const FilterForm = () => (
    <div className="space-y-4">
      <Field label={t('car.brand')}>
        <Select value={filters.brand} onChange={(e) => updateFilter('brand', e.target.value)}>
          <option value="">{t('cars.allBrands')}</option>
          {MAKE_NAMES.map((b) => <option key={b} value={b}>{b}</option>)}
        </Select>
      </Field>

      {/* ✅ NEW — model ab dropdown, aur brand ke sath badalta hai */}
      <Field label={t('car.model')}>
        <Select value={filters.model} onChange={(e) => updateFilter('model', e.target.value)}>
          <option value="">{filters.brand ? t('cars.allModels') : t('cars.popularModels')}</option>
          {modelOptions.map((m) => <option key={m} value={m}>{m}</option>)}
        </Select>
      </Field>

      <Field label={t('common.city')}>
        <Select value={filters.city} onChange={(e) => updateFilter('city', e.target.value)}>
          <option value="">{t('cars.allCities')}</option>
          {PK_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </Select>
      </Field>

      <Field label={t('car.condition')}>
        <Select value={filters.condition} onChange={(e) => updateFilter('condition', e.target.value)}>
          <option value="ALL">{t('common.all')}</option>
          {CONDITIONS.map((c) => <option key={c.value} value={c.value}>{translatedOption(t, c)}</option>)}
        </Select>
      </Field>

      <Field label={t('car.bodyType')}>
        <Select value={filters.bodyType} onChange={(e) => updateFilter('bodyType', e.target.value)}>
          <option value="ALL">{t('common.all')}</option>
          {BODY_TYPES.map((b) => <option key={b.value} value={b.value}>{translatedOption(t, b)}</option>)}
        </Select>
      </Field>

      <Field label={t('car.transmission')}>
        <div className="flex flex-wrap gap-2">
          {TRANSMISSIONS.map((option) => (
            <Pill
              key={t.value}
              active={filters.transmission === t.value}
              onClick={() => updateFilter('transmission', filters.transmission === t.value ? 'ALL' : t.value)}
            >
              {translatedOption(t, option)}
            </Pill>
          ))}
        </div>
      </Field>

      <Field label={t('car.fuelType')}>
        <div className="flex flex-wrap gap-2">
          {FUEL_TYPES.map((f) => (
            <Pill
              key={f.value}
              active={filters.fuelType === f.value}
              onClick={() => updateFilter('fuelType', filters.fuelType === f.value ? 'ALL' : f.value)}
            >
              {translatedOption(t, f)}
            </Pill>
          ))}
        </div>
      </Field>

      {/* ✅ NEW — ready-made budget slabs, bilkul homepage jaise */}
      <Field label={t('cars.budget')}>
        <Select
          value={filters.maxPrice && !filters.minPrice ? filters.maxPrice : ''}
          onChange={(e) => {
            const v = e.target.value;
            const next = { ...filters, minPrice: '', maxPrice: v, page: 1 };
            setFilters(next); pushFilters(next);
          }}
        >
          <option value="">{t('ai.anyFuel')}</option>
          {BUDGET_RANGES.filter((b) => b.query.maxPrice).map((b) => (
            <option key={b.label} value={b.query.maxPrice}>{b.label}</option>
          ))}
        </Select>
      </Field>

      <Field label={`${t('car.price')} (PKR)`}>
        <div className="flex gap-2">
          <Input type="number" placeholder={t('common.min')} value={filters.minPrice}
            onChange={(e) => updateFilter('minPrice', e.target.value)} />
          <Input type="number" placeholder={t('common.max')} value={filters.maxPrice}
            onChange={(e) => updateFilter('maxPrice', e.target.value)} />
        </div>
      </Field>

      {/* ✅ NEW — saal ka range, "Old Cars" wale link ke liye lazmi */}
      <Field label={t('cars.modelYear')}>
        <div className="flex gap-2">
          <Select value={filters.minYear} onChange={(e) => updateFilter('minYear', e.target.value)}>
            <option value="">{t('cars.from')}</option>
            {Array.from({ length: 45 }, (_, i) => CURRENT_YEAR - i).map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </Select>
          <Select value={filters.maxYear} onChange={(e) => updateFilter('maxYear', e.target.value)}>
            <option value="">{t('cars.to')}</option>
            {Array.from({ length: 45 }, (_, i) => CURRENT_YEAR - i).map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </Select>
        </div>
      </Field>

      <Field label={t('cars.more')}>
        <div className="space-y-2">
          <Toggle
            active={filters.exchange}
            onClick={() => updateFilter('exchange', !filters.exchange)}
          >
            {t('cars.exchangeOnly')}
          </Toggle>
          {/* ✅ NEW */}
          <Toggle
            active={filters.isFeatured}
            onClick={() => updateFilter('isFeatured', !filters.isFeatured)}
          >
            {t('cars.featuredOnly')}
          </Toggle>
        </div>
      </Field>

      {activeChips.length > 0 && (
        <button
          onClick={clearFilters}
          className="w-full min-h-[42px] text-sm font-bold rounded-lg py-2.5 transition-colors"
          style={{ color: '#dc2626', border: '1px solid rgba(220,38,38,0.35)', background: 'rgba(220,38,38,0.05)' }}
        >
          {t('cars.clearFilters')}
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen paz-has-bottom-nav" style={{ background: 'var(--bg-page)' }}>

      {/* ══════════ Top bar ══════════ */}
      <div
        className="sticky top-0 z-30"
        style={{ background: 'var(--bg-header)', borderBottom: '1px solid var(--border-color)' }}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3.5 flex items-center gap-2 sm:gap-3">
          <div className="relative flex-1 min-w-0">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              placeholder={t('cars.searchPlaceholder')}
              className="w-full rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none"
              style={{ background: 'var(--bg-surface-alt)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
            />
          </div>

          <button
            onClick={() => setDrawerOpen(true)}
            aria-label={t('common.filters')}
            className="lg:hidden relative flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 shrink-0 rounded-xl active:opacity-70"
            style={{ border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
          >
            <SlidersHorizontal size={17} />
            {activeChips.length > 0 && (
              <span
                className="absolute -top-1 -right-1 w-4 h-4 text-[9px] font-bold rounded-full flex items-center justify-center"
                style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
              >
                {activeChips.length}
              </span>
            )}
          </button>

          <select
            value={filters.sortBy}
            onChange={(e) => updateFilter('sortBy', e.target.value)}
            className="hidden sm:block rounded-xl px-3 py-2.5 text-sm shrink-0 cursor-pointer outline-none"
            style={{ background: 'var(--bg-surface-alt)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
          >
            <option value="newest">{t('cars.newest')}</option>
            <option value="price_asc">{t('cars.priceLow')}</option>
            <option value="price_desc">{t('cars.priceHigh')}</option>
            <option value="popular">{t('cars.mostViewed')}</option>
          </select>
        </div>

        {/* ══════════ Quick category chips — homepage wali hi ══════════ */}
        <div className="max-w-7xl mx-auto px-3 sm:px-4 pb-2.5">
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            <button
              onClick={clearFilters}
              className="shrink-0 px-3.5 py-1.5 rounded-full text-[12px] font-bold whitespace-nowrap transition-colors"
              style={{
                background: activeChips.length === 0 ? 'var(--accent)' : 'var(--bg-surface-alt)',
                color: activeChips.length === 0 ? 'var(--accent-text)' : 'var(--text-secondary)',
                border: '1px solid var(--border-color)',
              }}
            >{t('showroom.allListings')}</button>

            <button
              onClick={() => applyPreset({ isFeatured: true })}
              className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px] font-bold whitespace-nowrap transition-colors"
              style={{
                background: filters.isFeatured ? 'var(--accent)' : 'var(--bg-surface-alt)',
                color: filters.isFeatured ? 'var(--accent-text)' : 'var(--text-secondary)',
                border: '1px solid var(--border-color)',
              }}
            >
              <TrendingUp size={12} />{t('common.featured')}</button>

            {BROWSE_CATEGORIES.filter((c) => !c.query.tag).map((c) => {
              const on = Object.entries(c.query).every(
                ([k, v]) => String(filters[k] ?? '') === String(v)
              );
              return (
                <button
                  key={c.label}
                  onClick={() => applyPreset(c.query)}
                  className="shrink-0 px-3.5 py-1.5 rounded-full text-[12px] font-bold whitespace-nowrap transition-colors"
                  style={{
                    background: on ? 'var(--accent)' : 'var(--bg-surface-alt)',
                    color: on ? 'var(--accent-text)' : 'var(--text-secondary)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  {CATEGORY_KEYS[c.label] ? t(CATEGORY_KEYS[c.label]) : c.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Mobile sort */}
        <div className="sm:hidden max-w-7xl mx-auto px-3 pb-2.5">
          <select
            value={filters.sortBy}
            onChange={(e) => updateFilter('sortBy', e.target.value)}
            className="w-full rounded-xl px-3 py-2 text-sm outline-none"
            style={{ background: 'var(--bg-surface-alt)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
          >
            <option value="newest">{t('cars.newest')}</option>
            <option value="price_asc">{t('cars.priceLow')}</option>
            <option value="price_desc">{t('cars.priceHigh')}</option>
            <option value="popular">{t('cars.mostViewed')}</option>
          </select>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 flex gap-6">

        {/* ══════════ Sidebar ══════════ */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div
            className="rounded-2xl p-4 sticky top-32"
            style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}
          >
            <h3
              className="font-black text-sm mb-4 flex items-center gap-1.5"
              style={{ color: 'var(--text-primary)' }}
            >
              <SlidersHorizontal size={15} style={{ color: 'var(--accent)' }} />{t('common.filters')}</h3>
            <FilterForm />
          </div>
        </aside>

        {/* ══════════ Results ══════════ */}
        <div className="flex-1 min-w-0">

          {/* Active chips */}
          {activeChips.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {activeChips.map((c) => (
                <button
                  key={c.key}
                  onClick={() => updateFilter(c.key, c.reset)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11.5px] font-bold transition-colors"
                  style={{
                    background: 'rgba(232,184,75,0.12)',
                    border: '1px solid rgba(232,184,75,0.32)',
                    color: 'var(--text-primary)',
                  }}
                >
                  {c.label}
                  <X size={11} style={{ color: 'var(--text-muted)' }} />
                </button>
              ))}
              <button
                onClick={clearFilters}
                className="text-[11.5px] font-bold underline underline-offset-2"
                style={{ color: 'var(--text-muted)' }}
              >
                {t('cars.clearAll')}
              </button>
            </div>
          )}

          <p className="text-[11px] sm:text-sm font-medium mb-3 sm:mb-4" style={{ color: 'var(--text-muted)' }}>
            {loading ? t('cars.loading') : t(total === 1 ? 'cars.carsFound' : 'cars.carsFoundPlural', { count: total })}
          </p>

          {loading ? (
            <div className="flex flex-col gap-2.5 sm:gap-4">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="rounded-xl sm:rounded-2xl overflow-hidden animate-pulse flex flex-row"
                  style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}
                >
                  <div
                    className="w-28 min-[420px]:w-32 sm:w-52 md:w-60 shrink-0 h-24 sm:h-36"
                    style={{ background: 'var(--skeleton-bg)' }}
                  />
                  <div className="flex-1 p-2.5 sm:p-4 space-y-2">
                    <div className="h-3 rounded w-3/4" style={{ background: 'var(--skeleton-bg)' }} />
                    <div className="h-3 rounded w-1/3" style={{ background: 'var(--skeleton-bg)' }} />
                    <div className="h-4 rounded w-1/4 mt-3" style={{ background: 'var(--skeleton-bg)' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : cars.length === 0 ? (
            <div className="text-center py-16 sm:py-20 px-4">
              <CarIcon size={40} strokeWidth={1.2} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
              <p className="font-bold" style={{ color: 'var(--text-primary)' }}>{t('car.noCarFound')}</p>
              <p className="text-sm mt-1 mb-5" style={{ color: 'var(--text-muted)' }}>
                {t('cars.adjustFilters')}
              </p>
              {activeChips.length > 0 && (
                <button
                  onClick={clearFilters}
                  className="inline-flex h-10 px-5 rounded-xl text-sm font-bold items-center"
                  style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
                >
                  {t('cars.clearFilters')}
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-2.5 sm:gap-4">
                {cars.map((car) => <CarCard key={car.id} car={car} />)}
              </div>

              {pages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6 sm:mt-8">
                  <PageBtn
                    disabled={filters.page <= 1}
                    onClick={() => updateFilter('page', Math.max(1, filters.page - 1))}
                  >
                    <ChevronLeft size={16} />
                  </PageBtn>
                  <span className="text-sm px-2 font-medium" style={{ color: 'var(--text-secondary)' }}>
                    {filters.page} / {pages}
                  </span>
                  <PageBtn
                    disabled={filters.page >= pages}
                    onClick={() => updateFilter('page', Math.min(pages, filters.page + 1))}
                  >
                    <ChevronRight size={16} />
                  </PageBtn>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ══════════ Mobile drawer ══════════ */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.45)' }} onClick={() => setDrawerOpen(false)} />

          <div
            className="absolute right-0 top-0 bottom-0 w-[88%] max-w-sm overflow-y-auto"
            style={{ background: 'var(--bg-page)' }}
          >
            <div
              className="sticky top-0 px-4 py-3.5 flex items-center justify-between z-10"
              style={{ background: 'var(--bg-page)', borderBottom: '1px solid var(--border-color)' }}
            >
              <h3 className="font-black flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                <SlidersHorizontal size={16} style={{ color: 'var(--accent)' }} />{t('common.filters')}</h3>
              <button
                onClick={() => setDrawerOpen(false)}
                aria-label={t('cars.closeFilters')}
                className="w-9 h-9 flex items-center justify-center rounded-full active:opacity-70"
                style={{ color: 'var(--text-secondary)' }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 pb-28"><FilterForm /></div>

            <div
              className="sticky bottom-0 p-4"
              style={{ background: 'var(--bg-page)', borderTop: '1px solid var(--border-color)' }}
            >
              <button
                onClick={() => setDrawerOpen(false)}
                className="w-full py-3 rounded-xl font-bold transition-transform active:scale-[0.99]"
                style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
              >
                {loading ? <Loader2 size={16} className="animate-spin mx-auto" /> : t('cars.showCars', { count: total })}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { scrollbar-width: none; -ms-overflow-style: none; }
      `}</style>
    </div>
  );
}

/* ═══════════ Chhote UI helpers ═══════════ */

const fieldStyle = {
  background: 'var(--bg-surface-alt)',
  border: '1px solid var(--border-color)',
  color: 'var(--text-primary)',
};

function Field({ label, children }) {
  return (
    <div>
      <label
        className="text-[10px] font-bold uppercase tracking-wide mb-1.5 block"
        style={{ color: 'var(--text-muted)' }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function Select({ children, ...props }) {
  return (
    <select
      {...props}
      className="w-full min-h-[42px] rounded-lg px-3 py-2.5 text-sm cursor-pointer outline-none"
      style={fieldStyle}
    >
      {children}
    </select>
  );
}

function Input(props) {
  return (
    <input
      {...props}
      className="w-1/2 min-h-[42px] rounded-lg px-3 py-2.5 text-sm outline-none"
      style={fieldStyle}
    />
  );
}

function Pill({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-xs font-semibold py-1.5 px-3 rounded-full transition-colors"
      style={{
        background: active ? 'var(--accent)' : 'var(--bg-surface-alt)',
        color: active ? 'var(--accent-text)' : 'var(--text-secondary)',
        border: `1px solid ${active ? 'var(--accent)' : 'var(--border-color)'}`,
      }}
    >
      {children}
    </button>
  );
}

function Toggle({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full min-h-[42px] flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] font-semibold transition-colors text-left"
      style={{
        background: active ? 'rgba(232,184,75,0.12)' : 'var(--bg-surface-alt)',
        border: `1px solid ${active ? 'var(--accent)' : 'var(--border-color)'}`,
        color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
      }}
    >
      <span
        className="w-4 h-4 rounded shrink-0 flex items-center justify-center"
        style={{
          background: active ? 'var(--accent)' : 'transparent',
          border: `1.5px solid ${active ? 'var(--accent)' : 'var(--border-color)'}`,
        }}
      >
        {active && <span className="text-[10px] font-black" style={{ color: 'var(--accent-text)' }}>✓</span>}
      </span>
      {children}
    </button>
  );
}

function PageBtn({ disabled, onClick, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-11 h-11 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg disabled:opacity-30 active:opacity-70 transition-opacity"
      style={{ border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
    >
      {children}
    </button>
  );
}

export default function CarsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-page)' }}>
          <Loader2 size={26} className="animate-spin" style={{ color: 'var(--accent)' }} />
        </div>
      }
    >
      <CarsPageInner />
    </Suspense>
  );
}