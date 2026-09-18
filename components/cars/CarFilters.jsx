'use client';
import { useLang } from '@/lib/i18nContext';
// frontend/components/cars/CarFilters.jsx
//
// ✅ POORI FILE REPLACE — Phase 4
//
// ⚠️ NOTE: `/cars` ka safha ye component use NAHI karta — us ke andar
//    apna `FilterForm` hai. Ye file un doosri jagahon ke liye hai jahan
//    filter sidebar chahiye (exchange page, store page waghera). Phir bhi
//    isay theek karna zaroori tha, warna do jagah do alag fehristein
//    reh jatin — jo ke asal masla hi yehi tha.
//
// Kya badla:
//
// 1. OPTIONS AB browseData.js SE
//    Pehle is file mein apni alag CITIES (9), BRANDS (10), BODY_TYPES (6)
//    parri hui thin. `/cars` page ki apni alag fehrist thi (12 brands,
//    8 body types), aur homepage ki apni. Teen jagah teen alag lists.
//    Ab teenon ek hi file se.
//
// 2. RANG THEEK
//    `bg-blue-600`, `bg-green-600`, `text-blue-600`, `focus:ring-blue-500`
//    sab hardcoded thay — brand ka gold kahin nazar nahi aata tha, aur
//    fuel filter ka hara rang to bilkul bahar ka lagta tha. Ab sab
//    `var(--accent)` par.
//
// 3. ENUM KI JAGAH PARHNE LAYAQ NAAM
//    Pehle button par seedha `MINIVAN` aur `CERTIFIED_PREOWNED` likha
//    aata tha. Ab "Mini Van" aur "Certified Pre-Owned".
//
// 4. MODEL AUR YEAR ke filters bhi add kiye — homepage ke
//    "Old Cars" aur "Corolla" jaise links inhi par chalte hain.

import {
  PK_CITIES, MAKE_NAMES, MAKES, POPULAR_MODELS,
  BODY_TYPES, TRANSMISSIONS, FUEL_TYPES, CONDITIONS,
} from '@/components/home/browseData';

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 45 }, (_, i) => CURRENT_YEAR - i);

const fieldStyle = {
  background: 'var(--bg-surface-alt)',
  border: '1px solid var(--border-color)',
  color: 'var(--text-primary)',
};

const inputCls = 'w-full rounded-lg px-3 py-2.5 text-sm outline-none min-h-[42px]';

export default function CarFilters({ filters = {}, setFilter, resetFilters, onApply }) {
  const { t } = useLang();
  // Brand chunte hi us brand ke models — warna mashhoor models
  const modelOptions = filters.brand ? (MAKES[filters.brand] || []) : POPULAR_MODELS;

  return (
    <div
      className="rounded-2xl p-4 space-y-5 sticky top-4"
      style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--card-shadow)',
      }}
    >
      <div className="flex items-center justify-between">
        <h3 className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>{t('common.filters')}</h3>
        <button
          onClick={resetFilters}
          className="text-xs font-bold transition-opacity hover:opacity-70"
          style={{ color: 'var(--accent)' }}
        >
          Sab hatayein
        </button>
      </div>

      {/* City */}
      <Section title={t('common.city')}>
        <select
          value={filters.city || ''}
          onChange={(e) => setFilter('city', e.target.value)}
          className={`${inputCls} cursor-pointer`}
          style={fieldStyle}
        >
          <option value="">Sab shehar</option>
          {PK_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </Section>

      {/* Brand */}
      <Section title={t('car.brand')}>
        <select
          value={filters.brand || ''}
          onChange={(e) => {
            setFilter('brand', e.target.value);
            // Brand badalte hi purana model hata do — warna
            // "Toyota + Civic" jaisa namumkin combination reh jata hai
            setFilter('model', '');
          }}
          className={`${inputCls} cursor-pointer`}
          style={fieldStyle}
        >
          <option value="">Sab brands</option>
          {MAKE_NAMES.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
      </Section>

      {/* ✅ NEW — Model */}
      <Section title={t('car.model')}>
        <select
          value={filters.model || ''}
          onChange={(e) => setFilter('model', e.target.value)}
          className={`${inputCls} cursor-pointer`}
          style={fieldStyle}
        >
          <option value="">{filters.brand ? 'Sab models' : 'Mashhoor models'}</option>
          {modelOptions.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </Section>

      {/* Condition */}
      <Section title={t('car.condition')}>
        <div className="flex flex-wrap gap-2">
          {CONDITIONS.map((c) => (
            <Pill
              key={c.value}
              active={filters.condition === c.value}
              onClick={() => setFilter('condition', filters.condition === c.value ? '' : c.value)}
            >
              {c.label}
            </Pill>
          ))}
        </div>
      </Section>

      {/* Body Type */}
      <Section title={t('car.bodyType')}>
        <div className="grid grid-cols-2 gap-2">
          {BODY_TYPES.map((b) => (
            <Pill
              key={b.value}
              block
              active={filters.bodyType === b.value}
              onClick={() => setFilter('bodyType', filters.bodyType === b.value ? '' : b.value)}
            >
              {b.label}
            </Pill>
          ))}
        </div>
      </Section>

      {/* Transmission */}
      <Section title={t('car.transmission')}>
        <div className="flex flex-wrap gap-2">
          {TRANSMISSIONS.map((t) => (
            <Pill
              key={t.value}
              active={filters.transmission === t.value}
              onClick={() => setFilter('transmission', filters.transmission === t.value ? '' : t.value)}
            >
              {t.label}
            </Pill>
          ))}
        </div>
      </Section>

      {/* Fuel Type */}
      <Section title={t('car.fuelType')}>
        <div className="flex flex-wrap gap-2">
          {FUEL_TYPES.map((f) => (
            <Pill
              key={f.value}
              active={filters.fuelType === f.value}
              onClick={() => setFilter('fuelType', filters.fuelType === f.value ? '' : f.value)}
            >
              {f.label}
            </Pill>
          ))}
        </div>
      </Section>

      {/* Price */}
      <Section title="Price (PKR)">
        <div className="flex gap-2">
          <input
            type="number" placeholder={t('common.min')} value={filters.minPrice || ''}
            onChange={(e) => setFilter('minPrice', e.target.value)}
            className={`${inputCls} w-1/2`} style={fieldStyle}
          />
          <input
            type="number" placeholder={t('common.max')} value={filters.maxPrice || ''}
            onChange={(e) => setFilter('maxPrice', e.target.value)}
            className={`${inputCls} w-1/2`} style={fieldStyle}
          />
        </div>
      </Section>

      {/* ✅ Year — ab dropdown, taake user 1961 jaisa saal na likh de */}
      <Section title="Model Year">
        <div className="flex gap-2">
          <select
            value={filters.minYear || ''}
            onChange={(e) => setFilter('minYear', e.target.value)}
            className={`${inputCls} w-1/2 cursor-pointer`} style={fieldStyle}
          >
            <option value="">Se</option>
            {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <select
            value={filters.maxYear || ''}
            onChange={(e) => setFilter('maxYear', e.target.value)}
            className={`${inputCls} w-1/2 cursor-pointer`} style={fieldStyle}
          >
            <option value="">Tak</option>
            {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </Section>

      {onApply && (
        <button
          onClick={onApply}
          className="w-full py-3 rounded-xl font-bold text-sm transition-transform active:scale-[0.99]"
          style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
        >
          Filters Lagayein
        </button>
      )}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <p
        className="text-[10px] font-bold uppercase tracking-wide mb-2"
        style={{ color: 'var(--text-muted)' }}
      >
        {title}
      </p>
      {children}
    </div>
  );
}

function Pill({ active, onClick, children, block }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-xs font-semibold py-2 px-3 rounded-lg transition-colors ${block ? 'w-full' : 'rounded-full'}`}
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