'use client';
// frontend/components/home/BrowseByTabs.jsx
//
// ✅ POORI FILE REPLACE — Phase 3 (Phase 1 wali file ki jagah)
//
// ══ AAP NE JO KAHA ══
// "Jo categories main page par lagai hain us mein PakWheels jaisa hai
//  sab — writing aur styling thori different kar do taake PakWheels
//  jaisi na lagey."
//
// ══ KYA BADLA ══
//
// PAK WHEELS ka andaz            →  HAMARA nayi shakal
// ─────────────────────────────────────────────────────────────
// upar plain text tabs +         →  ek "segmented control" — ek
// neeche underline                  dabba jis mein pills, chalne
//                                   wala gold background
//
// har card: bech mein icon,      →  card: BAAYEIN gold patti + icon
// neeche naam (bilkul PW jaisa)     aur naam ek line mein — bilkul
//                                   alag layout
//
// city/make/model: saada         →  har link ke aage chhota gold dot,
// text ki fehrist                   aur hover par poori row highlight
//
// heading "Browse Used Cars"     →  "Kis tarah dhoondna chahenge?"
// (PW ki exact wording)             — apni zaban, apna lehja
//
// Data wahi hai (browseData.js) — sirf dikhne ka andaz badla hai, is
// liye listings ke filters se sab kuch waise hi juda rehta hai.

import { useState } from 'react';
import Link from 'next/link';
import {
  Zap, BatteryCharging, Leaf, Crown, Flag, Settings2, Gauge, History,
  Sparkles, Users, Truck, Car, Home, Mountain, Fuel, Droplet, Wrench,
  AlertTriangle, ArrowUpRight,
} from 'lucide-react';

import {
  BROWSE_CATEGORIES, PK_CITIES, MAKE_NAMES, POPULAR_MODELS,
  BUDGET_RANGES, BODY_TYPES, toCarsHref,
} from '@/components/home/browseData';
import { toTitleCase } from '@/lib/textCase';
import { useLang } from '@/lib/i18nContext';

const CAT_ICON = {
  'Sports Cars': Zap,
  'Electric Cars': BatteryCharging,
  'Hybrid Cars': Leaf,
  'Luxury Cars': Crown,
  'Japanese Cars': Flag,
  'Automatic Cars': Settings2,
  'Manual Cars': Gauge,
  'Old Cars': History,
  'New Cars': Sparkles,
  '7 Seater': Users,
  'Carry Daba': Truck,
  'Small Cars': Car,
  'Family Cars': Home,
  'Pickup / 4x4': Mountain,
  'CNG Cars': Fuel,
  'Diesel Cars': Droplet,
  'Modified Cars': Wrench,
  Accidental: AlertTriangle,
};

/* Apni zaban — PakWheels ki wording jaan boojh kar nahi */
const TABS = [
  { key: 'category', label: 'Qism se' },
  { key: 'city', label: 'Shehar se' },
  { key: 'make', label: 'Company se' },
  { key: 'model', label: 'Model se' },
  { key: 'budget', label: 'Budget se' },
  { key: 'body', label: 'Shakal se' },
];

/* ── Row link — dot + text, hover par poori row roshan ── */
function RowLink({ href, children }) {
  return (
    <Link
      href={href}
      className="paz-browse-row group flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors"
      style={{ color: 'var(--text-secondary)' }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0 transition-transform duration-200 group-hover:scale-150"
        style={{ background: 'var(--accent)', opacity: 0.55 }}
      />
      <span className="truncate">{children}</span>
      <ArrowUpRight
        size={13}
        className="ml-auto shrink-0 opacity-0 transition-opacity duration-150 group-hover:opacity-100"
        style={{ color: 'var(--accent)' }}
      />
    </Link>
  );
}

/* ── Card — icon BAAYEIN, gold patti ke saath (PW ka icon bech mein hota hai) ── */
function SideCard({ href, label, Icon }) {
  return (
    <Link
      href={href}
      className="paz-browse-card group relative flex items-center gap-3 pl-4 pr-3 py-3.5 rounded-xl overflow-hidden transition-all duration-200"
      style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--border-color)',
      }}
    >
      {/* Baayein gold patti — hover par chaurhi ho jati hai */}
      <span
        className="absolute left-0 top-0 bottom-0 w-[3px] transition-all duration-200 group-hover:w-[5px]"
        style={{ background: 'var(--accent)', opacity: 0.75 }}
      />

      <Icon
        size={18}
        strokeWidth={1.7}
        className="shrink-0 transition-transform duration-200 group-hover:scale-110"
        style={{ color: 'var(--accent)' }}
      />

      <span
        className="text-[13px] font-bold leading-tight min-w-0 truncate"
        style={{ color: 'var(--text-primary)' }}
      >
        {label}
      </span>
    </Link>
  );
}

export default function BrowseByTabs() {
  const { t } = useLang();
  const [tab, setTab] = useState('category');

  const panel = () => {
    switch (tab) {
      case 'category':
        return (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
            {BROWSE_CATEGORIES.map((c) => (
              <SideCard
                key={c.label}
                href={toCarsHref(c.query)}
                label={c.label}
                Icon={CAT_ICON[c.label] || Car}
              />
            ))}
          </div>
        );

      case 'city':
        return (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-2">
            {PK_CITIES.map((city) => (
              <RowLink key={city} href={toCarsHref({ city })}>{toTitleCase(city)}</RowLink>
            ))}
          </div>
        );

      case 'make':
        return (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-2">
            {MAKE_NAMES.filter((m) => m !== 'Other').map((brand) => (
              <RowLink key={brand} href={toCarsHref({ brand })}>{toTitleCase(brand)}</RowLink>
            ))}
          </div>
        );

      case 'model':
        return (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-2">
            {POPULAR_MODELS.map((model) => (
              <RowLink key={model} href={toCarsHref({ model })}>{toTitleCase(model)}</RowLink>
            ))}
          </div>
        );

      case 'budget':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-2">
            {BUDGET_RANGES.map((b) => (
              <RowLink key={b.label} href={toCarsHref(b.query)}>{b.label}</RowLink>
            ))}
          </div>
        );

      case 'body':
        return (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {BODY_TYPES.map((b) => (
              <SideCard
                key={b.value}
                href={toCarsHref({ bodyType: b.value })}
                label={b.label}
                Icon={
                  b.value === 'PICKUP' ? Mountain
                    : b.value === 'VAN' ? Truck
                    : b.value === 'MINIVAN' ? Users
                    : Car
                }
              />
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <section className="relative left-1/2 right-1/2 -mx-[50vw] w-screen py-12 sm:py-16 px-4" style={{ background: 'var(--bg-surface)' }}>
      <div className="max-w-6xl mx-auto">

        {/* ── Heading — apni wording ── */}
        <div className="mb-6">
          <h2
            className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2.5"
            style={{ color: 'var(--text-primary)' }}
          >
            <span className="w-1 h-7 rounded-full" style={{ background: 'var(--accent)' }} />
            {t('home.browseTitle')}
          </h2>
          <p className="text-sm mt-1.5 pl-4" style={{ color: 'var(--text-muted)' }}>
            {t('home.browseSub')}
          </p>
        </div>

        {/* ── Segmented control (underline tabs nahi) ── */}
        <div
          className="inline-flex gap-1 p-1 rounded-xl mb-6 max-w-full overflow-x-auto no-scrollbar browse-tabs"
          style={{ background: 'var(--bg-surface-alt)', border: '1px solid var(--border-color)' }}
          role="tablist"
        >
          {TABS.map((tb) => {
            const active = tab === tb.key;
            return (
              <button
                key={tb.key}
                role="tab"
                aria-selected={active}
                onClick={() => setTab(tb.key)}
                className="shrink-0 px-4 py-2 rounded-lg text-[13px] font-bold whitespace-nowrap transition-colors duration-200"
                style={{
                  background: active ? 'var(--accent)' : 'transparent',
                  color: active ? 'var(--accent-text)' : 'var(--text-secondary)',
                }}
              >
                {t(`home.browse.${tb.key}`)}
              </button>
            );
          })}
        </div>

        {/* ── Panel ── */}
        <div>{panel()}</div>
      </div>

      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { scrollbar-width: none; -ms-overflow-style: none; }
        @media (max-width: 639px) {
          .browse-tabs {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            width: 100%;
            overflow: visible;
            gap: 6px;
            padding: 6px;
            margin-bottom: 18px;
          }
          .browse-tabs button {
            min-width: 0;
            width: 100%;
            padding: 10px 6px;
            font-size: 12px;
          }
          .paz-browse-card {
            min-height: 56px;
            padding-top: 12px;
            padding-bottom: 12px;
          }
          .paz-browse-row {
            min-height: 44px;
            padding-top: 10px;
            padding-bottom: 10px;
            font-size: 13px;
          }
        }
      `}</style>
    </section>
  );
}