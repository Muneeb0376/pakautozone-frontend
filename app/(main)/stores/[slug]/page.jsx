//ye is ki frontend/app/(main)/stores/[slug]/page.jsx file ha //
'use client';
import { useLang } from '@/lib/i18nContext';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MessageSquare, MapPin, Phone, MessageCircle, Eye, Wrench, ShieldCheck, ChevronRight, Gauge } from 'lucide-react';
import { getCleanToken } from '@/lib/auth';

// ✅ Simple relative-time helper for the "Updated X ago" line on car cards —
// no extra date library needed, matches the PakWheels-style reference card.
function timeAgo(dateStr, t) {
  if (!dateStr) return null;
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return t('common.justNow');
  if (mins < 60) return `${t('common.minutes', { n: mins })} ${t('common.ago')}`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${t('common.hours', { n: hrs })} ${t('common.ago')}`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${t('common.days', { n: days })} ${t('common.ago')}`;
  const months = Math.floor(days / 30);
  return `${t('common.months', { n: months })} ${t('common.ago')}`;
}

// ✅ Condition badge labels/colors — same pattern used on the homepage car cards
const CONDITION_LABELS = { NEW: 'New Car', USED: 'Used', CERTIFIED_PREOWNED: 'Certified Pre-Owned' };
const CONDITION_HEX    = { NEW: '#10b981', USED: '#475569', CERTIFIED_PREOWNED: '#f59e0b' };

// ✅ FIX: hardcoded 'http://localhost:5000' hata diya — mobile per (real device se
// network IP jese 192.168.x.x:3000 se access karte waqt) "localhost" phone ko refer
// karta tha, laptop ke backend ko nahi, isliye fetch fail ho kar "Showroom nahi mila"
// show hota tha. Ab yahi env variable use hota hai jo baqi app mein use hota hai.
const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';
const BASE_URL = API_BASE.replace('/api', '');

const getImageUrl = (url) => {
  if (!url) return '/placeholder.png';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};

const getPartImage = (part) => {
  const firstImage = Array.isArray(part.images) ? part.images[0] : null;
  return getImageUrl(
    typeof firstImage === 'string'
      ? firstImage
      : firstImage?.url || part.image || part.imageUrl
  );
};

// ✅ FIX: pehle maskedPhone seedha backend ke `phoneMasked` field par depend
// karta tha — agar backend wo field nahi bhejta (jaisa is case mein ho raha
// tha), to yahan `store.phone` (POORA number) fall back ho jata tha aur
// screen par asli number aa jata tha. Ab masking hamesha frontend khud karta
// hai, backend kuch bhi bheje — is liye number kabhi poora nahi dikhega.
function maskPhone(phone) {
  if (!phone) return '';
  const str = String(phone).replace(/\D/g, '');
  if (str.length <= 4) return str;
  const visible = 4;   // shuru ke 4 digits
  const tail = 3;       // aakhri 3 digits
  const hiddenCount = Math.max(str.length - visible - tail, 3);
  return str.slice(0, visible) + '•'.repeat(hiddenCount) + str.slice(-tail);
}

// WhatsApp link banana — hamesha store ke registered number se, kabhi kisi aur se nahi
const buildWhatsAppLink = (phone) => {
  if (!phone) return null;
  const clean = phone.replace(/\D/g, '');
  const intl = clean.startsWith('0') ? '92' + clean.slice(1) : clean;
  return `https://wa.me/${intl}`;
};

export default function StoreDetailPage() {
  const { t } = useLang();
  const { slug } = useParams();
  const router = useRouter();
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [numberRevealed, setNumberRevealed] = useState(false);
  const [logoOpen, setLogoOpen] = useState(false);
  // ✅ Cars aur Spare Parts ab do alag tabs mein show hote hain (ek dusre ke
  // neeche continuous list ki bajaye) — jis tab par user click kare wahi
  // section render hota hai. Default hamesha "cars" tab par khulta hai.
  const [activeTab, setActiveTab] = useState('cars');
  const token = getCleanToken();

  useEffect(() => {
    fetch(`${API_BASE}/stores/slug/${slug}`)
      .then(r => r.json())
      .then(data => {
        // ✅ Response ka data field check karo (naya backend format: { success, data })
        if (data.success && data.data) {
          setStore(data.data);
        } else if (data.name) {
          // Old format fallback
          setStore(data);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [slug]);

  const startChat = async () => {
    if (!token) { router.push('/login'); return; }
    try {
      const res = await fetch(`${API_BASE}/chat/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ storeId: store.id })
      });
      const data = await res.json();
      if (res.ok && data.id) {
        router.push(`/chat?roomId=${data.id}`);
      } else {
        router.push('/chat');
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-page)' }}>
      <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
    </div>
  );

  if (!store) return (
    <div className="min-h-screen flex items-center justify-center font-medium" style={{ background: 'var(--bg-page)', color: 'var(--text-muted)' }}>
      Showroom nahi mila
    </div>
  );

  // ✅ FIX: pehle yahan `store.isVerified` check ho raha tha — matlab agar
  // admin ne abhi "✓ Verified" badge nahi diya tha (chahe showroom paid +
  // live ho), to poora page "Yeh ek registered showroom profile nahi hai"
  // keh kar block kar deta tha. isVerified sirf ek cosmetic trust-badge hai,
  // "is this a real live showroom" ka jawab isActive deta hai (payment
  // approval se control hota hai) — isliye gate ab isActive par hai.
  if (!store.isActive) return (
    <div className="min-h-screen flex items-center justify-center font-medium text-center px-6" style={{ background: 'var(--bg-page)', color: 'var(--text-muted)' }}>
      Yeh showroom abhi live nahi hai — payment verification process mein hai.
    </div>
  );

  const waLink = buildWhatsAppLink(store.whatsapp || store.phone);
  // ✅ FIX: ab hamesha frontend khud mask karta hai (backend field par
  // bharosa nahi karta) — isliye poora number kabhi nazar nahi aayega.
  const maskedPhone = maskPhone(store.whatsapp || store.phone);

  // Jis category ke items zyada hain (cars ya parts), woh section page par pehle (upar) dikhega.
  // Dono sections hamesha alag-alag apne independent heading/count ke sath render hote hain —
  // is se chhota-sa inventory (masalan sirf 2 parts) bhi bade cars list ke neeche dab kar chupta nahi.
  const carsCount = store.cars?.length || 0;
  const partsCount = store.parts?.length || 0;

  const carsSection = (
    <>
        {/* Cars Section */}
        <div className="flex items-center gap-2 font-bold text-sm mb-6 uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
          <svg className="w-4 h-4" style={{ color: 'var(--accent)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"
              d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          Available Cars ({store.cars?.length || 0})
        </div>

        {!store.cars?.length ? (
          <div
            className="rounded-3xl p-16 text-center border flex flex-col items-center justify-center mb-10"
            style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)' }}
          >
            <div className="w-16 h-16 opacity-20 mb-4" style={{ color: 'var(--text-muted)' }}>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                  d="M5 10l1-2h12l1 2m-16 4h16m-16 0a2 2 0 002 2h12a2 2 0 002-2m-16 0v-4m16 0v4m-3-10V4a1 1 0 00-1-1H8a1 1 0 00-1 1v2M5 14h14" />
              </svg>
            </div>
            <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Is showroom mein abhi koi car nahi hai</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 mb-10">
            {store.cars.map(car => {
              const conditionLabel = CONDITION_LABELS[car.condition] || car.condition;
              const conditionHex   = CONDITION_HEX[car.condition] || '#374151';
              const specs = [
                car.year ? String(car.year) : null,
                car.mileage != null ? `${Number(car.mileage).toLocaleString()} km` : null,
                car.fuelType,
                car.engineCapacity ? `${car.engineCapacity} cc` : null,
                car.transmission,
              ].filter(Boolean);
              const updated = timeAgo(car.updatedAt || car.createdAt, t);

              return (
                <div
                  key={car.id}
                  onClick={() => router.push(`/cars/${car.id}`)}
                  className="group flex flex-row rounded-xl overflow-hidden border hover:shadow-lg transition-all duration-300 cursor-pointer"
                  style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)' }}
                >
                  {/* Image — fixed width & height, PakWheels style */}
                  <div
                    className="relative shrink-0 overflow-hidden"
                    style={{ width: '200px', minWidth: '200px', height: '148px', background: 'var(--bg-surface-alt)' }}
                  >
                    <img
                      src={getImageUrl(car.carImages?.[0]?.url)}
                      alt={car.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={e => { e.target.onerror = null; e.target.src = '/placeholder.png'; }}
                    />
                    {/* Condition + Exchange badges */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
                      {car.condition && (
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded text-white shadow"
                          style={{ backgroundColor: conditionHex }}
                        >
                          {conditionLabel}
                        </span>
                      )}
                      {car.isForExchange && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded text-white shadow" style={{ backgroundColor: '#9333ea' }}>{t('car.exchange')}</span>
                      )}
                    </div>
                    {/* Image count badge */}
                    {car.carImages?.length > 1 && (
                      <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd"/></svg>
                        {car.carImages.length}
                      </div>
                    )}
                  </div>

                  {/* Details — PakWheels-style layout */}
                  <div className="flex-1 px-4 py-3 flex flex-col justify-between min-w-0">
                    {/* Top row: title + price */}
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3
                          className="font-bold text-[15px] leading-snug line-clamp-2"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {car.title || `${car.year} ${car.brand} ${car.model}`}
                        </h3>
                        <span className="font-black text-base shrink-0 whitespace-nowrap" style={{ color: 'var(--accent)' }}>
                          PKR {Number(car.price).toLocaleString()}
                        </span>
                      </div>

                      {/* City */}
                      {car.city && (
                        <div className="flex items-center gap-1 text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
                          <MapPin size={11} /> {car.city}
                        </div>
                      )}

                      {/* Specs row — pipe-separated like PakWheels */}
                      {specs.length > 0 && (
                        <div className="flex flex-wrap items-center gap-x-0 gap-y-1 text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                          {specs.map((s, i) => (
                            <span key={i} className="flex items-center">
                              {i > 0 && <span className="mx-2" style={{ color: 'var(--border-color)' }}>|</span>}
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Bottom row: updated time + View Details */}
                    <div className="flex items-center justify-between gap-2 pt-2 mt-1 border-t" style={{ borderColor: 'var(--border-color)' }}>
                      <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                        {updated ? `Updated ${updated}` : ''}
                      </span>
                      <button
                        onClick={e => { e.stopPropagation(); router.push(`/cars/${car.id}`); }}
                        className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg shrink-0 transition-all hover:opacity-90"
                        style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
                      >{t('common.viewDetails')}<ChevronRight size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

    </>
  );

  const partsSection = (
    <>
        <div className="flex items-center gap-2 font-bold text-sm mb-6 uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
          <Wrench size={16} style={{ color: 'var(--accent)' }} />
          Spare Parts ({store.parts?.length || 0})
        </div>

        {!store.parts?.length ? (
          <div
            className="rounded-3xl p-16 text-center border flex flex-col items-center justify-center mb-10"
            style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)' }}
          >
            <Wrench className="w-12 h-12 opacity-20 mb-4" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Is showroom mein abhi koi spare part nahi hai</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {store.parts.map(part => (
                <div
                  key={part.id}
                  onClick={() => router.push(`/spare-parts/${part.id}`)}
                  className="group flex flex-col rounded-2xl overflow-hidden border hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer min-h-[270px]"
                  style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)' }}
                >
                  <div className="h-40 relative shrink-0 overflow-hidden" style={{ background: 'var(--bg-surface-alt)' }}>
                    <img
                      src={getPartImage(part)}
                      alt={part.name || part.title || 'Spare Part'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={e => { e.target.onerror = null; e.target.src = '/placeholder.png'; }}
                    />
                    {part.condition && (
                      <div className="absolute top-2 left-2 bg-black/50 backdrop-blur-md text-white text-[10px] px-2 py-0.5 rounded-md font-bold">
                        {part.condition}
                      </div>
                    )}
                  </div>
                  {/* ✅ FIX: pehle jab part.name ya part.price missing/undefined
                      hota tha to ye poora block blank/khaali dikhta tha (sirf
                      image nazar aati thi, koi text nahi) — isi wajah se
                      "info nahi aa rahi" wala masla ho raha tha. Ab hamesha
                      kuch na kuch readable text show hota hai, chahe backend
                      se woh field na aaye. */}
                  <div className="flex flex-col flex-1 p-4">
                    <h4 className="text-sm font-bold leading-snug line-clamp-2 mb-1" style={{ color: 'var(--text-primary)' }}>
                      {part.name || part.title || part.partName || 'Spare Part'}
                    </h4>
                    <p className="text-[11px] mb-2 truncate" style={{ color: 'var(--text-muted)' }}>
                      {[part.brand, part.category, part.city || store.city].filter(Boolean).join(' • ') || '—'}
                    </p>
                    {part.description && (
                      <p className="text-[11px] leading-relaxed line-clamp-2 mb-3" style={{ color: 'var(--text-secondary)' }}>
                        {part.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between gap-2 pt-2 mt-auto border-t" style={{ borderColor: 'var(--border-color)' }}>
                      <span className="text-[11px] font-semibold" style={{ color: 'var(--text-muted)' }}>
                        {part.condition || 'Used'}
                      </span>
                      <span className="font-black text-sm" style={{ color: 'var(--accent)' }}>
                      {(part.price ?? part.amount) != null && !Number.isNaN(Number(part.price ?? part.amount))
                        ? `PKR ${Number(part.price ?? part.amount).toLocaleString()}`
                        : 'Price on request'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
    </>
  );

  return (
    <div className="min-h-screen pb-24 sm:pb-0" style={{ background: 'var(--bg-page)' }}>
      <div className="max-w-4xl mx-auto px-4 py-16">

        {/* Main Showroom Info Card */}
        <div
          className="rounded-3xl p-8 border mb-10"
          style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)', boxShadow: 'var(--card-shadow)' }}
        >
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
            <div className="flex items-center gap-5">
              {/* Showroom Logo/Image */}
              {store.logo ? (
                <button
                  type="button"
                  onClick={() => setLogoOpen(true)}
                  className="w-14 h-14 rounded-2xl overflow-hidden shrink-0 cursor-zoom-in"
                  style={{ background: 'var(--bg-surface-alt)' }}
                >
                  <img
                    src={getImageUrl(store.logo)}
                    alt={store.name}
                    className="w-full h-full object-cover"
                    onError={e => { e.target.onerror = null; e.target.src = '/placeholder.png'; }}
                  />
                </button>
              ) : (
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'var(--bg-surface-alt)', color: 'var(--accent)' }}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              )}

              {/* Details */}
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{store.name}</h1>
                  {/* ✅ FIX: pehle ye icon hardcoded hamesha dikhta tha (sab
                      showrooms verified lagte thay, chahe admin ne verify
                      kiya ho ya nahi). Ab sirf tabhi dikhega jab admin ne
                      "Showroom Verification" tab se isVerified true kiya ho —
                      chota label bhi sath mein taake clear ho ye kis ne verify kiya. */}
                  {store.isVerified && (
                    <span
                      className="flex items-center gap-1 bg-emerald-500/10 text-emerald-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/20"
                      title="PakAutoZone ki taraf se manually verify kiya gaya showroom"
                    >
                      <ShieldCheck size={12} /> Verified by PakAutoZone
                    </span>
                  )}
                </div>
                {store.description && (
                  <p className="text-xs mb-2 max-w-xs" style={{ color: 'var(--text-secondary)' }}>{store.description}</p>
                )}
                <div className="flex flex-wrap items-center gap-3 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                  {store.city && (
                    <span className="flex items-center gap-1">
                      <MapPin size={13} /> {store.city}
                    </span>
                  )}
                  {store.address && (
                    <span style={{ color: 'var(--text-muted)' }}>• {store.address}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons — order: in-app Message (primary, sabse zyada trusted & tracked)
                → WhatsApp (quick, instant) → Phone reveal (last resort, masked by default) */}
            <div className="flex flex-col gap-2 min-w-40">
              <button
                onClick={startChat}
                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-5 py-2.5 rounded-2xl transition-all shadow-md shadow-blue-600/20"
              >
                <MessageSquare size={15} />{t('seller.sendMessage')}</button>

              {waLink && (
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold text-sm px-5 py-2.5 rounded-2xl transition-all"
                >
                  <MessageCircle size={15} />{t('seller.whatsapp')}</a>
              )}

              {/* ✅ FIX: number ab HAMESHA masked/partially-hidden hi dikhta
                  hai — poora number screen par kabhi print nahi hota
                  (privacy). Tap karne par call us store ke asli number par
                  hi jaati hai (tel: link), bas ANKHON se poora number kabhi
                  nazar nahi aata. Reveal-on-click wala toggle hata diya. */}
              {maskedPhone && (
                <a
                  href={`tel:${(store.whatsapp || store.phone || '').replace(/\D/g, '')}`}
                  className="flex items-center justify-center gap-2 border text-sm font-medium px-5 py-2.5 rounded-2xl transition-all"
                  style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
                >
                  <Phone size={14} />
                  <span>{maskedPhone}</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Cars / Spare Parts tabs — do alag categories, jaise Verified Dealers /
            Showrooms toggle. Sirf jis tab par click hota hai wahi section neeche
            render hota hai. */}
        <div className="flex gap-3 mb-8">
          <button
            type="button"
            onClick={() => setActiveTab('cars')}
            className="flex-1 flex items-center justify-center gap-2 font-bold text-sm px-5 py-3 rounded-2xl border transition-all"
            style={
              activeTab === 'cars'
                ? { background: 'var(--accent)', color: 'var(--accent-text)', borderColor: 'var(--accent)' }
                : { background: 'var(--card-bg)', color: 'var(--text-secondary)', borderColor: 'var(--border-color)' }
            }
          >{t('nav.cars')}<span
              className="text-[11px] font-bold px-2 py-0.5 rounded-full"
              style={
                activeTab === 'cars'
                  ? { background: 'rgba(0,0,0,0.15)' }
                  : { background: 'var(--bg-surface-alt)' }
              }
            >
              {carsCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('parts')}
            className="flex-1 flex items-center justify-center gap-2 font-bold text-sm px-5 py-3 rounded-2xl border transition-all"
            style={
              activeTab === 'parts'
                ? { background: 'var(--accent)', color: 'var(--accent-text)', borderColor: 'var(--accent)' }
                : { background: 'var(--card-bg)', color: 'var(--text-secondary)', borderColor: 'var(--border-color)' }
            }
          >{t('nav.parts')}<span
              className="text-[11px] font-bold px-2 py-0.5 rounded-full"
              style={
                activeTab === 'parts'
                  ? { background: 'rgba(0,0,0,0.15)' }
                  : { background: 'var(--bg-surface-alt)' }
              }
            >
              {partsCount}
            </span>
          </button>
        </div>

        {activeTab === 'cars' ? carsSection : partsSection}

      </div>

      {/* Sticky mobile CTA bar — chat hamesha ek tap door rehti hai, scroll karte waqt bhi */}
      <div
        className="sm:hidden fixed bottom-0 left-0 right-0 p-3 border-t z-20"
        style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)' }}
      >
        <button
          onClick={startChat}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm py-3 rounded-2xl transition-all"
        >
          <MessageSquare size={16} />{t('seller.sendMessage')}</button>
      </div>

      {/* Showroom logo lightbox — click backdrop or X to close */}
      {logoOpen && store.logo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
          onClick={() => setLogoOpen(false)}
        >
          <button
            type="button"
            onClick={() => setLogoOpen(false)}
            className="absolute top-5 right-5 text-white/80 hover:text-white text-3xl leading-none"
            aria-label={t('common.close')}
          >
            &times;
          </button>
          <img
            src={getImageUrl(store.logo)}
            alt={store.name}
            className="max-w-full max-h-full rounded-2xl object-contain"
            onClick={e => e.stopPropagation()}
            onError={e => { e.target.onerror = null; e.target.src = '/placeholder.png'; }}
          />
        </div>
      )}
    </div>
  );
}