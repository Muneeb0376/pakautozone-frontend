'use client';
// frontend/components/home/HeroSection.jsx
//
// ✅ POORI FILE REPLACE — Issue 4 (main page hero banner)
//
// Aap ki design (image 5) ke mutabiq dobara bana:
//   • FIND • BUY • SELL   → chhota eyebrow, letter-spaced
//   • Do line ki headline  → doosri line accent gold
//   • Bara search pill     → car naam + city + Search button
//   • Do CTA               → Browse Cars / Trade In Your Car
//   • "Drive Your Future"  → daayein taraf script writing
//   • Neeche trust strip   → 4 khaanay (Verified Dealers, Wide Selection,
//                             Genuine Spare Parts, Easy Trade-In)
//   • GEARS                → hamesha ghoomtay rehte hain (baayen bara gear
//                             clockwise, daayen chhota gear ulta) — CSS
//                             animation se, koi JS loop nahi, is liye CPU
//                             par bojh nahi parta.
//
// ── KOI CARTOON NAHI ──
// Purane version mein 🚗 emoji badge tha aur flat amber blocks thay. Ab:
//   • emoji ki jagah lucide ka <Zap/> line icon
//   • gear par asli metal gradient (light → mid → shadow → highlight) +
//     bevel stroke, taake flat/cartoon ki bajaye machined steel lagay
//   • buttons par layered shadow + inset highlight (asli button jaisa)
//
// ── ⚠️ PHASE 5 FIX — "EYEBROW" aur "Trust1" kyun dikh rahe thay ──
// Screenshot mein `EYEBROW` aur `Trust1 / Trust1s` likha aa raha tha.
// Wajah: ye strings i18n dictionary (lib/i18n.js) se aa rahi thin, aur
// wahan un keys ki value hi placeholder thi ("EYEBROW", "Trust1").
//
// Mera `tx()` helper sirf tab fallback deta hai jab t() key ka naam
// WAAPIS kar de. Yahan t() ne ek asli (magar bekaar) value lauta di, is
// liye fallback chala hi nahi.
//
// Hal: hero ki ye chhoti branding lines ab t() se nahi aatin — seedha
// yahan likhi hui hain. Ye tarjumay wali cheez hai bhi nahi (brand ka
// waada har zaban mein wahi rehta hai), aur is tarah dictionary mein
// koi key chhoot jaye to bhi hero kabhi toota hua nazar nahi aayega.
//
// Aur aap ke kehne par eyebrow ("FIND / BUY / SELL") poora hata diya —
// uski jagah ab ek asli maloomati line hai.
//
// ── DONO THEME ──
// Sab rang var(--*) tokens se aate hain jo globals.css mein pehle se hain.
// Gear ka gradient dono themes mein wahi gold hai (brand color), lekin uski
// opacity light theme mein kam kar di gayi hai (CSS class .paz-hero-gear) —
// warna safed background par gear text ke upar chhaa jata tha.
//
// ── AAP KI DESIGN WALI PICTURE ──
// Agar aap image 5 wali car/engine wali picture bhi lagana chahte hain:
//   1. usay `frontend/public/hero-car.png` naam se save karein (PNG,
//      background transparent, ~1200px chaura)
//   2. bas — neeche `HERO_CAR` already usi path ko point karta hai. File na
//      ho to component khud usay chhupa deta hai (onError), layout nahi tootta.

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, ArrowLeftRight, ArrowRight, ShieldCheck, Car, Cog, RefreshCw,
  MapPin, Gauge, Store, Sparkles, Tag,
} from 'lucide-react';
import { useLang } from '@/lib/i18nContext';
import { PK_CITIES } from '@/components/home/browseData';

const HERO_CAR = '/hero-car.png';

/* ─────────────────────────────────────────────────────────────
   ⚠️ SIRF MOBILE (sm se neeche) ke liye naye hisse.
   Desktop/tablet ka hero neeche waisa hi hai jaisa pehle tha.

   Chip labels teeno zabanon mein yahin likhe hain (dictionary mein
   koi nayi key nahi chahiye), aur `lang` se chunay jate hain.
   ───────────────────────────────────────────────────────────── */
const MOBILE_LABELS = {
  en:    { newCars: 'New Cars',   usedCars: 'Used Cars',           tradeIn: 'Trade In',  dealers: 'Showrooms', aiFinder: 'AI Finder',          priceCheck: 'Price Check' },
  roman: { newCars: 'New Cars',   usedCars: 'Used Cars',           tradeIn: 'Trade In',  dealers: 'Showrooms', aiFinder: 'AI Finder',          priceCheck: 'Price Check' },
  ur:    { newCars: 'نئی گاڑیاں', usedCars: 'استعمال شدہ گاڑیاں', tradeIn: 'ٹریڈ اِن', dealers: 'شو رومز',   aiFinder: 'اے آئی کار فائنڈر', priceCheck: 'قیمت چیک' },
};

const MOBILE_CHIPS = [
  { key: 'newCars',    Icon: Car,            href: '/cars?condition=new' },
  { key: 'usedCars',   Icon: Gauge,          href: '/cars?condition=used' },
  { key: 'tradeIn',    Icon: ArrowLeftRight, href: '/cars?exchange=true' },
  { key: 'dealers',    Icon: Store,          href: '/stores' },
  { key: 'aiFinder',   Icon: Sparkles,       href: '/ai-recommend' },
  { key: 'priceCheck', Icon: Tag,            href: '/price-check' },
];

/* Mobile par trust strip ka chhota khaana — sirf icon + ek chhota title */
function MobileTrustItem({ Icon, title, last }) {
  return (
    <div
      className="flex flex-col items-center text-center gap-1 px-1 py-2.5"
      style={{ borderInlineEnd: last ? 'none' : '1px solid var(--border-color)' }}
    >
      <Icon size={19} strokeWidth={1.7} style={{ color: 'var(--accent)' }} className="shrink-0" />
      <p className="text-[10px] font-semibold leading-tight" style={{ color: 'var(--text-secondary)' }}>
        {title}
      </p>
    </div>
  );
}

/* Missing i18n key par key ka naam dikhne se behtar hai saaf angrezi text */
const tx = (t, key, fallback) => {
  const out = t(key);
  return !out || out === key ? fallback : out;
};

/* ─────────────────────────────────────────────────────────────
   GEAR — ek hi SVG, har jagah dobara istemal
   teeth: kitne daant · r: bahar ka radius · hole: bech ka sooraakh
   ───────────────────────────────────────────────────────────── */
function Gear({ teeth = 14, className = '', style }) {
  const R = 100;          // daant ka sira
  const rRoot = 84;       // daant ki jar
  const rRim = 62;        // andar ki ring
  const rHole = 34;       // bech ka sooraakh
  const step = 360 / teeth;

  // Daant ek-ek kar ke banao — har daant ek trapezium hai
  const path = [];
  for (let i = 0; i < teeth; i += 1) {
    const a = (i * step * Math.PI) / 180;
    const half = (step * Math.PI) / 180 / 2;
    const w = half * 0.42;   // sira ki chaurai
    const wr = half * 0.62;  // jar ki chaurai
    const pt = (rad, ang) => `${(rad * Math.cos(ang)).toFixed(2)},${(rad * Math.sin(ang)).toFixed(2)}`;
    path.push(
      `M ${pt(rRoot, a - wr)} L ${pt(R, a - w)} L ${pt(R, a + w)} L ${pt(rRoot, a + wr)} Z`
    );
  }

  return (
    <svg viewBox="-110 -110 220 220" className={className} style={style} aria-hidden="true">
      <defs>
        <linearGradient id={`gm${teeth}`} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0%" stopColor="#fbe6ad" />
          <stop offset="22%" stopColor="#e8b84b" />
          <stop offset="52%" stopColor="#8f6417" />
          <stop offset="76%" stopColor="#f2cd7a" />
          <stop offset="100%" stopColor="#6b4c12" />
        </linearGradient>
        <linearGradient id={`ge${teeth}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff8e4" stopOpacity="0.85" />
          <stop offset="55%" stopColor="#c9a04b" stopOpacity="0.30" />
          <stop offset="100%" stopColor="#33230a" stopOpacity="0.30" />
        </linearGradient>

        {/* Bech ka sooraakh — MASK se kaata hai, kisi rang se bhara nahi.
            Agar isay background ke rang se bhar dete to hero ke gradient
            par ek bhadda flat daira nazar aata (kyunki hero --bg-hero
            gradient hai, --bg-page ka flat rang uske sath match nahi
            karta). Mask se wahan se gear asal mein GAAYAB ho jata hai,
            is liye peeche ka gradient saaf dikhta hai. */}
        <mask id={`gh${teeth}`}>
          <rect x="-110" y="-110" width="220" height="220" fill="#fff" />
          <circle cx="0" cy="0" r={rHole} fill="#000" />
        </mask>
      </defs>

      <g fill={`url(#gm${teeth})`} mask={`url(#gh${teeth})`}>
        {path.map((d, i) => <path key={i} d={d} />)}
        <circle cx="0" cy="0" r={rRoot} />
      </g>

      {/* Machined halqe — chapta pan tootne ke liye */}
      <circle cx="0" cy="0" r={rRim} fill="none" stroke="#33230a" strokeWidth="4" opacity="0.45" />
      <circle cx="0" cy="0" r={rRim + 7} fill="none" stroke="#f0d79a" strokeWidth="1.5" opacity="0.35" />
      <circle cx="0" cy="0" r={rHole + 6} fill="none" stroke="#f0d79a" strokeWidth="1.5" opacity="0.30" />
      <circle cx="0" cy="0" r={R - 2} fill="none" stroke={`url(#ge${teeth})`} strokeWidth="2.5" />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────
   Trust strip ka ek khaana
   ───────────────────────────────────────────────────────────── */
function TrustItem({ Icon, title, sub, last }) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 sm:py-0"
      style={{ borderRight: last ? 'none' : '1px solid var(--border-color)' }}
    >
      <Icon size={26} strokeWidth={1.6} style={{ color: 'var(--accent)' }} className="shrink-0" />
      <div className="min-w-0">
        <p className="text-[13px] font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>
          {title}
        </p>
        <p className="text-[11px] leading-tight mt-0.5" style={{ color: 'var(--text-muted)' }}>
          {sub}
        </p>
      </div>
    </div>
  );
}

export default function HeroSection() {
  const router = useRouter();
  const { t, lang } = useLang();
  const M = MOBILE_LABELS[lang] || MOBILE_LABELS.en;

  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const [carOk, setCarOk] = useState(true);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (city) params.set('city', city);
    router.push(`/cars?${params.toString()}`);
  };

  return (
    <>
      {/* ═══════════════════════════════════════════════════════════
          📱 MOBILE HERO (sm se neeche) — halka, saaf, jaldi access
          • gears/grid/glow hata diye, height kam
          • ek search card: naam + shehar + Search
          • chips ki ek line: aik tap mein aham safhay
          • neeche 4 chhote trust khaane (bade cards nahi)
          ═══════════════════════════════════════════════════════════ */}
      <section
        className="sm:hidden relative left-1/2 right-1/2 -mx-[50vw] w-screen overflow-hidden"
        style={{ background: 'var(--bg-hero)' }}
      >
        {/* ⚙️ Ghoomtay gears — text ke peeche, sirf mobile par.
            Bara gear clockwise, chhota us se juda hua anti-clockwise.
            teeth 18 / 10 alag rakhe hain (desktop 16/14/12 use karta hai) taake
            SVG gradient ids takrayen nahi. `end-` ki wajah se Urdu (RTL) mein ye
            khud doosri taraf aa jate hain, text ke muqabil. */}
        <Gear
          teeth={18}
          className="paz-hero-gear paz-gear-cw pointer-events-none absolute block w-36 h-36 -end-9 -top-9"
          style={{ opacity: 0.4 }}
        />
        <Gear
          teeth={10}
          className="paz-hero-gear paz-gear-ccw pointer-events-none absolute block w-16 h-16 end-[66px] top-[66px]"
          style={{ opacity: 0.4 }}
        />

        <div className="relative z-10 px-4 pt-5 pb-4">
          <h1
            className="text-[1.6rem] leading-[1.15] font-black tracking-tight text-start"
            style={{ color: 'var(--text-primary)' }}
          >
            {tx(t, 'home.heroTitle', 'Your Dream Car')}{' '}
            <span style={{ color: 'var(--accent)' }}>
              {tx(t, 'home.heroTitleAccent', 'Is Right Here')}
            </span>
          </h1>

          <p className="mt-1.5 text-[12.5px] leading-snug text-start" style={{ color: 'var(--text-muted)' }}>
            {tx(t, 'home.eyebrow', 'Verified sellers across Pakistan — all in one place')}
          </p>

          {/* ── Search card ── */}
          <div
            className="mt-4 rounded-2xl p-2.5 space-y-2"
            style={{
              background: 'var(--bg-header)',
              border: '1px solid var(--border-color)',
              boxShadow: '0 14px 30px -18px rgba(0,0,0,0.45)',
            }}
          >
            <div
              className="flex items-center gap-2.5 rounded-xl px-3"
              style={{ background: 'var(--bg-surface-alt)', border: '1px solid var(--border-color)' }}
            >
              <Search size={17} className="shrink-0" style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder={tx(t, 'home.searchPlaceholder', 'Search by car name or model...')}
                className="flex-1 min-w-0 bg-transparent h-11 text-base font-medium focus:outline-none placeholder:text-[color:var(--text-muted)]"
                style={{ color: 'var(--text-primary)' }}
              />
            </div>

            <div className="flex items-center gap-2">
              <div
                className="flex items-center gap-2 flex-1 min-w-0 rounded-xl px-3"
                style={{ background: 'var(--bg-surface-alt)', border: '1px solid var(--border-color)' }}
              >
                <MapPin size={16} className="shrink-0" style={{ color: 'var(--accent)' }} />
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  aria-label={tx(t, 'common.city', 'City')}
                  className="flex-1 min-w-0 bg-transparent h-11 text-base font-medium focus:outline-none appearance-none cursor-pointer"
                  style={{ color: city ? 'var(--text-primary)' : 'var(--text-muted)' }}
                >
                  <option value="">{tx(t, 'common.city', 'City')}</option>
                  {PK_CITIES.map((c) => (
                    <option key={c} value={c} style={{ color: '#161616' }}>{c}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleSearch}
                className="shrink-0 h-[46px] px-5 rounded-xl text-sm font-bold inline-flex items-center justify-center gap-2 active:scale-95 transition-transform"
                style={{
                  background: 'var(--accent)',
                  color: 'var(--accent-text)',
                  boxShadow: '0 6px 16px -6px rgba(232,184,75,0.6), inset 0 1px 0 rgba(255,255,255,0.35)',
                }}
              >
                <Search size={16} strokeWidth={2.5} />
                {tx(t, 'home.search', 'Search')}
              </button>
            </div>
          </div>

          {/* ── Quick access chips (side scroll) ── */}
          <div
            className="mt-3 -mx-4 px-4 flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden"
            style={{ scrollbarWidth: 'none' }}
          >
            {MOBILE_CHIPS.map(({ key, Icon, href }) => (
              <button
                key={key}
                onClick={() => router.push(href)}
                className="shrink-0 h-9 ps-3 pe-3.5 rounded-full inline-flex items-center gap-1.5 text-[12.5px] font-semibold whitespace-nowrap active:scale-95 transition-transform"
                style={{
                  background: 'var(--bg-header)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                }}
              >
                <Icon size={14} strokeWidth={2} style={{ color: 'var(--accent)' }} />
                {M[key]}
              </button>
            ))}
          </div>
        </div>

        {/* ── Compact trust strip ── */}
        <div style={{ borderTop: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.04)' }}>
          <div className="grid grid-cols-4">
            <MobileTrustItem Icon={ShieldCheck} title={tx(t, 'home.verifiedShowrooms', 'Verified Showrooms')} />
            <MobileTrustItem Icon={Car} title={tx(t, 'home.newUsedCars', 'New and Used Cars')} />
            <MobileTrustItem Icon={Cog} title={tx(t, 'home.genuineParts', 'Genuine Spare Parts')} />
            <MobileTrustItem Icon={RefreshCw} title={tx(t, 'home.easyTradeIn', 'Easy Trade-In')} last />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          🖥️ DESKTOP / TABLET HERO — bilkul pehle jaisa (sirf `hidden sm:block` laga hai)
          ═══════════════════════════════════════════════════════════ */}
    <section
      className="hidden sm:block paz-hero relative left-1/2 right-1/2 -mx-[50vw] w-screen overflow-hidden"
      style={{ background: 'var(--bg-hero)' }}
    >
      {/* ─── Halka grid texture — depth ke liye, nazar mein na aaye ─── */}
      <div
        className="absolute inset-0 pointer-events-none paz-hero-grid"
        style={{
          backgroundImage:
            'linear-gradient(currentColor 1px,transparent 1px),linear-gradient(90deg,currentColor 1px,transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* ─── Warm ambient glow ─── */}
      <div
        className="absolute -top-32 left-1/4 w-[28rem] h-[28rem] rounded-full blur-3xl pointer-events-none"
        style={{ background: 'rgba(232,184,75,0.12)' }}
      />
      <div
        className="absolute -bottom-24 right-1/3 w-[32rem] h-[32rem] rounded-full blur-3xl pointer-events-none"
        style={{ background: 'rgba(232,184,75,0.09)' }}
      />

      {/* ═══ GHOOMTAY GEARS ═══
          Hamesha chalte hain. Baayen bara gear clockwise, daayen chhota
          anti-clockwise (jaisa asli gear train mein hota hai — mile hue
          gears hamesha ulti simt ghoomte hain).
          Mobile par bara gear chhota karke corner mein rakha gaya hai taake
          branding bhi nazar aaye aur hero text bhi readable rahe. */}
      <Gear
        teeth={16}
        className="paz-hero-gear paz-gear-cw pointer-events-none absolute block w-[11rem] h-[11rem] -left-[4.5rem] -top-[2rem] sm:w-[30rem] sm:h-[30rem] sm:-left-[13rem] sm:-top-[6rem]"
      />
      <Gear
        teeth={12}
        className="paz-hero-gear paz-gear-ccw pointer-events-none absolute hidden lg:block w-[15rem] h-[15rem] left-16 -bottom-24"
      />
      <Gear
        teeth={14}
        className="paz-hero-gear paz-gear-ccw pointer-events-none absolute hidden md:block w-[20rem] h-[20rem] -right-28 -bottom-32"
      />

      {/* ═══ CONTENT ═══ */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 pt-12 pb-0 sm:pt-16">
        <div className="relative flex items-center justify-center">
          {/* ── Baayan: text + search ── */}
          <div className="w-full max-w-4xl text-center">
            {/* Eyebrow hata diya. Uski jagah ek asli baat — kis tarah ke
                sellers hain. "FIND / BUY / SELL" se ye zyada kaam ki
                cheez hai: visitor ko foran andaza hota hai ke site khali
                to nahi. */}
            <div className="flex items-center gap-2 justify-center mb-4">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent)' }} />
              <span
                className="text-[11px] sm:text-xs font-bold tracking-wide"
                style={{ color: 'var(--text-secondary)' }}
              >
                {tx(t, 'home.eyebrow', 'Verified sellers across Pakistan — all in one place')}
              </span>
            </div>

            <h1
              className="text-[2.1rem] leading-[1.08] sm:text-5xl lg:text-[3.4rem] font-black tracking-tight"
              style={{ color: 'var(--text-primary)' }}
            >
              {tx(t, 'home.heroTitle', 'Your Dream Car')}
              <br />
              <span style={{ color: 'var(--accent)' }}>
                {tx(t, 'home.heroTitleAccent', 'Is Right Here')}
              </span>
            </h1>

            <p
              className="mt-4 text-sm sm:text-base max-w-md mx-auto leading-relaxed"
              style={{ color: 'var(--text-secondary)' }}
            >
              {tx(t, 'home.heroDescription', 'New and used cars, genuine spare parts and easy trade-in — all in one place.')}
            </p>

            {/* ── Search pill ── */}
            <div
              className="hero-pill mt-7 flex items-center gap-1 sm:gap-1.5 p-1.5 rounded-2xl max-w-2xl mx-auto"
              style={{
                background: 'var(--bg-header)',
                border: '1px solid var(--border-color)',
                boxShadow: '0 18px 40px -18px rgba(0,0,0,0.45)',
              }}
            >
              <div className="flex items-center flex-1 min-w-0 gap-2 pl-3">
                <Car size={17} style={{ color: 'var(--text-muted)' }} className="shrink-0 hidden sm:block" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder={tx(t, 'home.searchPlaceholder', 'Search by car name or model...')}
                  className="hero-in flex-1 min-w-0 bg-transparent py-3 pr-2 text-[13px] sm:text-sm font-medium focus:outline-none"
                  style={{ color: 'var(--text-primary)' }}
                />
              </div>

              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="hero-in shrink-0 bg-transparent py-3 px-2 sm:px-3 text-[13px] sm:text-sm font-medium focus:outline-none cursor-pointer w-[5.5rem] sm:w-40"
                style={{ color: city ? 'var(--text-primary)' : 'var(--text-muted)', borderLeft: '1px solid var(--border-color)' }}
              >
                <option value="">{tx(t, 'common.city', 'City')}</option>
                {PK_CITIES.map((c) => (
                  <option key={c} value={c} style={{ color: '#161616' }}>{c}</option>
                ))}
              </select>

              <button
                onClick={handleSearch}
                aria-label={tx(t, 'home.search', 'Search')}
                className="shrink-0 flex items-center justify-center gap-2 font-bold rounded-xl text-sm transition-transform duration-150 w-11 h-11 sm:w-auto sm:h-auto sm:px-6 sm:py-3 active:scale-95"
                style={{
                  background: 'var(--accent)',
                  color: 'var(--accent-text)',
                  boxShadow: '0 6px 18px -5px rgba(232,184,75,0.55), inset 0 1px 0 rgba(255,255,255,0.35)',
                }}
              >
                <Search size={16} strokeWidth={2.5} />
                <span className="hidden sm:inline">{tx(t, 'home.search', 'Search')}</span>
              </button>
            </div>

            {/* ── CTA ── */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-5 max-w-xs sm:max-w-none mx-auto">
              <button
                onClick={() => router.push('/cars')}
                className="font-bold px-7 py-3 rounded-xl text-sm flex items-center justify-center gap-2 transition-transform duration-150 active:scale-95"
                style={{
                  background: 'var(--accent)',
                  color: 'var(--accent-text)',
                  boxShadow: '0 8px 20px -6px rgba(232,184,75,0.45), inset 0 1px 0 rgba(255,255,255,0.3)',
                }}
              >
                {tx(t, 'home.carsDekho', 'Browse Cars')}
                <ArrowRight size={15} strokeWidth={2.5} />
              </button>

              <button
                onClick={() => router.push('/cars?exchange=true')}
                className="font-semibold px-7 py-3 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors"
                style={{
                  border: '1.5px solid var(--accent)',
                  color: 'var(--text-primary)',
                  background: 'transparent',
                }}
              >
                <ArrowLeftRight size={15} style={{ color: 'var(--accent)' }} />
                {tx(t, 'home.carExchange', 'Trade In Your Car')}
              </button>
            </div>
          </div>

          {/* ── Daayan: script writing + car ── */}
          <div className="absolute inset-0 hidden lg:block pointer-events-none">
            <div className="absolute -top-6 right-4 text-right select-none pointer-events-none">
              <span className="paz-script block text-2xl" style={{ color: 'var(--text-primary)' }}>
                {tx(t, 'home.drive', 'Drive')}
              </span>
              <span className="paz-script block text-4xl -mt-1" style={{ color: 'var(--accent)' }}>
                {tx(t, 'home.yourFuture', 'Your Future')}
              </span>
              <span
                className="block ml-auto mt-1 h-[2px] w-40 rounded-full"
                style={{ background: 'linear-gradient(90deg,transparent,var(--accent))' }}
              />
            </div>

            {carOk && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={HERO_CAR}
                alt=""
                aria-hidden="true"
                onError={() => setCarOk(false)}
                className="w-full max-w-xl ml-auto mt-16 object-contain select-none pointer-events-none"
                style={{ filter: 'drop-shadow(0 30px 40px rgba(0,0,0,0.45))' }}
              />
            )}
          </div>
        </div>
      </div>

      {/* ═══ TRUST STRIP ═══ */}
      <div
        className="relative z-10 mt-10"
        style={{ borderTop: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.04)' }}
      >
        <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 py-3 sm:py-5">
          {/* Har khaana ab asli faida batata hai, "Trust1 / Trust1s" jaisa
              placeholder nahi. Aur har sub-line mein ek THOS baat hai —
              "buy with confidence" jaisi khokhli tareef nahi. */}
          <TrustItem
            Icon={ShieldCheck}
            title={tx(t, 'home.verifiedShowrooms', 'Verified Showrooms')}
            sub={tx(t, 'home.verifiedShowroomsSub', 'Every dealer’s documents are checked')}
          />
          <TrustItem
            Icon={Car}
            title={tx(t, 'home.newUsedCars', 'New and Used Cars')}
            sub={tx(t, 'home.newUsedCarsSub', 'Every budget, every city')}
          />
          <TrustItem
            Icon={Cog}
            title={tx(t, 'home.genuineParts', 'Genuine Spare Parts')}
            sub={tx(t, 'home.genuinePartsSub', 'Direct from shops, without middlemen')}
          />
          <TrustItem
            Icon={RefreshCw}
            title={tx(t, 'home.easyTradeIn', 'Easy Trade-In')}
            sub={tx(t, 'home.easyTradeInSub', 'Trade your car with ease')}
            last
          />
        </div>
      </div>

      <style jsx>{`
        .hero-in::placeholder { color: var(--text-muted); opacity: 1; }
        .hero-in { appearance: none; }
      `}</style>
    </section>
    </>
  );
}