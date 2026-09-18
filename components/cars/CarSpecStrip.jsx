'use client';
import { useLang } from '@/lib/i18nContext';
// frontend/components/cars/CarSpecStrip.jsx
//
// ✅ NAYI FILE — Phase 4 (car detail page ke buttons)
//
// ══ AAP NE JO KAHA ══
// "Car detail page par mirror UI buttons lagane. Jab koi car par click
//  kare to us ki info neeche show hoti hai — jaise PakWheels ka hai,
//  fuel / auto-manual waghera wo buttons type mein show hote hain,
//  waise show ho."
//
// ══ PEHLE KYA THA ══
// Aath alag alag dabbay (boxes) ek grid mein — har ek mein chhota
// label upar, value neeche. Sab se pehla dabba HARD-CODED emerald green
// tha (`bg-emerald-500/10 border-emerald-500/30`), jo baqi site ke
// gold/black brand se bilkul match nahi karta tha. Screenshot 2 mein
// yehi hara dabba nazar aa raha hai.
//
// ══ AB KYA HAI ══
// Do hisse:
//
//   1. CHIPS ROW — chhote pill-shaped buttons ek line mein, har ek par
//      icon + value. Bilkul waise jaise aap ne kaha:
//          [⛽ Petrol]  [⚙ Manual]  [📅 2022]  [🛣 45,000 km]
//      (icons lucide ke line icons hain, emoji nahi.)
//      Ye mobile par side-scroll karti hai, desktop par wrap ho jati hai.
//
//   2. DETAIL GRID — baqi tafseel (engine, body type, color, condition,
//      registration) ek saaf grid mein, ab sab ek jaisi shakal mein.
//      Koi hara dabba nahi.
//
// ══ 'N/A' KA MASLA ══
// Screenshot mein ENGINE aur COLOR par "N/A" likha tha. Ye UI ka masla
// NAHI — us listing mein wo fields khali hi save hui thin (purana form
// unhe theek se nahi bhejta tha; Phase 2 ka naya form bhejta hai).
// Ab jis field ki value nahi, wo chip dikhti hi nahi — khali "N/A" ka
// dabba jagah gherne se behtar hai ke wo nazar hi na aaye.

import {
  Fuel, Settings2, Calendar, Gauge, Cog, Car as CarIcon,
  Palette, BadgeCheck, MapPin, ShieldCheck,
} from 'lucide-react';

import { formatPrice } from '@/lib/formatPrice';
import { toTitleCase, humanizeEnum } from '@/lib/textCase';

const CONDITION_LABELS = {
  NEW: 'New Car',
  USED: 'Used',
  CERTIFIED_PREOWNED: 'Certified Pre-Owned',
};

/* ── Ek chip ── */
function Chip({ Icon, children }) {
  const { t } = useLang();
  return (
    <span
      className="inline-flex items-center gap-1.5 shrink-0 rounded-full px-3.5 py-2 text-[12.5px] sm:text-sm font-semibold whitespace-nowrap"
      style={{
        background: 'var(--bg-surface-alt)',
        border: '1px solid var(--border-color)',
        color: 'var(--text-primary)',
      }}
    >
      <Icon size={14} strokeWidth={1.9} style={{ color: 'var(--accent)' }} />
      {children}
    </span>
  );
}

/* ── Grid ka ek khaana ── */
function Cell({ Icon, label, value }) {
  if (!value) return null;
  return (
    <div
      className="rounded-xl p-3"
      style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}
    >
      <p
        className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider mb-1.5"
        style={{ color: 'var(--text-muted)' }}
      >
        <Icon size={12} strokeWidth={2} style={{ color: 'var(--accent)' }} />
        {label}
      </p>
      <p className="text-sm font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>
        {value}
      </p>
    </div>
  );
}

export default function CarSpecStrip({ car }) {
  const { t } = useLang();
  if (!car) return null;

  const mileage = car.mileage ? `${Number(car.mileage).toLocaleString('en-US')} km` : null;
  const engine = car.engineCC ? `${Number(car.engineCC).toLocaleString('en-US')} cc` : null;
  const fuel = car.fuelType ? humanizeEnum(car.fuelType) : null;
  const transmission = car.transmission ? humanizeEnum(car.transmission) : null;
  const bodyType = car.bodyType ? humanizeEnum(car.bodyType) : null;
  const color = car.color && car.color !== 'N/A' ? toTitleCase(car.color) : null;
  const condition = CONDITION_LABELS[car.condition] || (car.condition ? humanizeEnum(car.condition) : null);
  const city = car.city ? toTitleCase(car.city) : null;

  return (
    <div className="space-y-4">

      {/* ══════════ 1. PRICE + CHIPS ══════════ */}
      <div
        className="rounded-2xl p-4 sm:p-5"
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--card-shadow)',
        }}
      >
        {/* Price — pehle hardcoded hara dabba tha, ab brand ka gold */}
        <div className="flex items-end justify-between gap-4 mb-4">
          <div className="min-w-0">
            <p
              className="text-[10px] font-bold uppercase tracking-wider mb-1"
              style={{ color: 'var(--text-muted)' }}
            >{t('car.askingPrice')}</p>
            <p
              className="text-2xl sm:text-3xl font-black tracking-tight leading-none"
              style={{ color: 'var(--accent)' }}
            >
              {formatPrice(car.price)}
            </p>
          </div>

          {condition && (
            <span
              className="shrink-0 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-bold"
              style={{
                background: 'rgba(232,184,75,0.12)',
                border: '1px solid rgba(232,184,75,0.3)',
                color: 'var(--accent)',
              }}
            >
              <BadgeCheck size={12} strokeWidth={2.4} />
              {condition}
            </span>
          )}
        </div>

        {/* ── Chips row — yahi wo "buttons type" hain ──
             Mobile par side-scroll, desktop par wrap. `-mx-4 px-4` is
             liye hai ke scroll karte waqt chips card ke kinare tak
             jayein, beech mein katti hui na lagein. */}
        <div className="flex gap-2 overflow-x-auto sm:flex-wrap sm:overflow-visible -mx-4 px-4 sm:mx-0 sm:px-0 pb-1 sm:pb-0 no-scrollbar">
          {car.year && <Chip Icon={Calendar}>{car.year}</Chip>}
          {mileage && <Chip Icon={Gauge}>{mileage}</Chip>}
          {fuel && <Chip Icon={Fuel}>{fuel}</Chip>}
          {transmission && <Chip Icon={Settings2}>{transmission}</Chip>}
          {engine && <Chip Icon={Cog}>{engine}</Chip>}
          {bodyType && <Chip Icon={CarIcon}>{bodyType}</Chip>}
          {city && <Chip Icon={MapPin}>{city}</Chip>}
        </div>
      </div>

      {/* ══════════ 2. TAFSEELI GRID ══════════ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        <Cell Icon={Calendar} label="Model Year" value={car.year} />
        <Cell Icon={Gauge} label="Mileage" value={mileage} />
        <Cell Icon={Cog} label="Engine" value={engine} />
        <Cell Icon={Settings2} label="Transmission" value={transmission} />
        <Cell Icon={Fuel} label="Fuel Type" value={fuel} />
        <Cell Icon={CarIcon} label="Body Type" value={bodyType} />
        <Cell Icon={Palette} label="Color" value={color} />
        <Cell Icon={MapPin} label="Registered In" value={city} />
      </div>

      {/* Verified dealer ki patti — pehle "Status: Active" ka dabba tha
          jo user ke kisi kaam ka nahi (wo hamara andaruni column hai). */}
      {car.store?.isVerified && (
        <div
          className="flex items-center gap-2.5 rounded-xl px-4 py-3"
          style={{ background: 'rgba(5,150,105,0.08)', border: '1px solid rgba(5,150,105,0.22)' }}
        >
          <ShieldCheck size={16} style={{ color: '#059669' }} className="shrink-0" />
          <p className="text-[12.5px] font-semibold" style={{ color: '#059669' }}>
            Ye listing Pak Auto Zone ke verified dealer ki hai
          </p>
        </div>
      )}

      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { scrollbar-width: none; -ms-overflow-style: none; }
      `}</style>
    </div>
  );
}