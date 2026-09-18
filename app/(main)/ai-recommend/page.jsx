'use client';
import { useState } from 'react';
import {
  Sparkles, Wallet, MapPin, Gauge, Users, Fuel, StickyNote,
  Loader2, ChevronRight, Check, Zap
} from 'lucide-react';
import { useLang } from '@/lib/i18nContext';

// ✅ Pehle sirf 7 cities thi, ab Pakistan ke bade + mid-size shehron
// ko cover kiya gaya hai. Top 6 upar quick-tap chips ke roop mein,
// baqi "More cities" dropdown mein.
const POPULAR_CITIES = ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan'];
const OTHER_CITIES = [
  'Peshawar', 'Quetta', 'Gujranwala', 'Sialkot', 'Hyderabad', 'Sukkur',
  'Bahawalpur', 'Sargodha', 'Sahiwal', 'Abbottabad', 'Mardan', 'Gujrat',
  'Jhelum', 'Kasur', 'Sheikhupura', 'Okara', 'Larkana', 'Nawabshah',
  'Rahim Yar Khan', 'Dera Ghazi Khan', 'Mirpur (AJK)', 'Muzaffarabad',
  'Wah Cantt', 'Chiniot',
];

// ✅ Easy Roman Urdu + icon, taake option "parhne" ke bajaye "dekh" ke
// pehchani ja sake.
const USAGES = [
  { value: 'Daily commute', labelKey: 'ai.dailyCommute', hintKey: 'ai.officeCollege', icon: Gauge },
  { value: 'Family trips', labelKey: 'ai.familyTrips', hintKey: 'ai.weekendOutings', icon: Users },
  { value: 'Business', labelKey: 'ai.business', hintKey: 'ai.meetingsDeliveries', icon: Wallet },
  { value: 'Off-road', labelKey: 'ai.offRoadUse', hintKey: 'ai.offRoadHint', icon: MapPin },
  { value: 'Long tours', labelKey: 'ai.longTours', hintKey: 'ai.highwayOutOfCity', icon: Sparkles },
];

// ✅ NEW — Pakistani market mein log "35 lakh" bolte hain, "3500000" nahi.
// Ek-tap budget chips isi vocabulary mein, taake form filling fast +
// familiar lage. Manual figure input neeche waise hi mojood hai.
const BUDGET_PRESETS = [
  { label: '10 Lakh', value: 1000000 },
  { label: '20 Lakh', value: 2000000 },
  { label: '35 Lakh', value: 3500000 },
  { label: '50 Lakh', value: 5000000 },
  { label: '80 Lakh', value: 8000000 },
  { label: '1 Crore+', value: 10000000 },
];

const FUEL_OPTIONS = ['Petrol', 'Diesel', 'CNG', 'Hybrid', 'Electric'];
const API = process.env.NEXT_PUBLIC_API_URL || '/api';

export default function AiRecommendPage() {
  const { t } = useLang();
  const [prefs, setPrefs] = useState({ budget: '', city: '', usage: '', familySize: '', fuelPreference: '', notes: '' });
  const [showMoreCities, setShowMoreCities] = useState(false);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    if (!prefs.budget) {
      setError(t('ai.enterBudget'));
      return;
    }

    setLoading(true);
    setError(null);
    setResults([]);

    try {
      const res = await fetch(`${API}/ai/recommend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(prefs)
      });

      if (!res.ok) {
        throw new Error(t('common.serverError'));
      }

      const data = await res.json();

      if (Array.isArray(data)) {
        setResults(data);
      } else if (data && Array.isArray(data.recommendations)) {
        setResults(data.recommendations);
      } else if (data && Array.isArray(data.data)) {
        setResults(data.data);
      } else {
        setError(t('ai.noResults'));
      }

    } catch (err) {
      console.error("AI Recommendation Fetch Error:", err);
      setError(t('ai.error'));
    } finally {
      setLoading(false);
    }
  };

  const isCityInOthers = prefs.city && !POPULAR_CITIES.includes(prefs.city);

  return (
    <div className="min-h-screen bg-page-base py-10 px-4">
      <div className="max-w-2xl mx-auto">

        {/* ✅ Hero banner — site ke --bg-hero token se, taake dono theme
            mein background ke sath seamlessly match ho */}
        <div
          className="relative overflow-hidden rounded-3xl px-6 py-8 mb-6 border border-theme"
          style={{ background: 'var(--bg-hero)' }}
        >
          <Sparkles className="absolute -right-3 -top-3 opacity-10" size={110} style={{ color: 'var(--accent)' }} />
          <Zap className="absolute right-16 bottom-2 opacity-10 rotate-12" size={48} style={{ color: 'var(--accent-2-from)' }} />
          <div className="relative flex items-center gap-3">
            <div
              className="p-3 rounded-2xl shrink-0"
              style={{ background: 'linear-gradient(135deg, var(--accent-2-from), var(--accent-2-to))' }}
            >
              <Sparkles className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-theme-primary">{t('ai.title')}</h1>
              <p className="text-sm text-theme-secondary mt-0.5">{t('ai.subtitle')}</p>
            </div>
          </div>
        </div>

        {/* Form card */}
        <div className="glass-card rounded-2xl p-6 space-y-6">

          {/* Budget */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-theme-muted uppercase tracking-wide mb-2">
              <Wallet size={14} /> {t('ai.budget')} (PKR)
            </label>

            <div className="flex flex-wrap gap-2 mb-3">
              {BUDGET_PRESETS.map(b => {
                const active = String(prefs.budget) === String(b.value);
                return (
                  <button
                    key={b.label}
                    type="button"
                    onClick={() => setPrefs(p => ({ ...p, budget: String(b.value) }))}
                    className="px-3 py-1.5 rounded-full text-xs font-medium border transition"
                    style={{
                      borderColor: active ? 'var(--accent)' : 'var(--border-color)',
                      background: active ? 'var(--accent)' : 'transparent',
                      color: active ? 'var(--accent-text)' : 'var(--text-secondary)',
                    }}
                  >
                    {b.label}
                  </button>
                );
              })}
            </div>

            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-theme-muted font-semibold">Rs</span>
              <input
                type="number"
                placeholder={t('ai.budgetPlaceholder')}
                value={prefs.budget}
                onChange={e => setPrefs(p => ({ ...p, budget: e.target.value }))}
                className="w-full border rounded-xl pl-9 pr-3 py-3 text-sm bg-transparent text-theme-primary border-theme focus:outline-none focus:ring-2 transition"
              />
            </div>
          </div>

          <div className="h-px" style={{ background: 'var(--border-color)' }} />

          {/* City */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-theme-muted uppercase tracking-wide mb-2">
              <MapPin size={14} /> {t('ai.city')}
            </label>

            <div className="flex flex-wrap gap-2 mb-2">
              {POPULAR_CITIES.map(c => {
                const active = prefs.city === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setPrefs(p => ({ ...p, city: c }))}
                    className="px-3 py-1.5 rounded-full text-xs font-medium border transition"
                    style={{
                      borderColor: active ? 'var(--accent)' : 'var(--border-color)',
                      background: active ? 'var(--accent)' : 'transparent',
                      color: active ? 'var(--accent-text)' : 'var(--text-secondary)',
                    }}
                  >
                    {c}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setShowMoreCities(s => !s)}
                className="px-3 py-1.5 rounded-full text-xs font-medium border transition"
                style={{
                  borderColor: isCityInOthers ? 'var(--accent)' : 'var(--border-color)',
                  background: isCityInOthers ? 'var(--accent)' : 'transparent',
                  color: isCityInOthers ? 'var(--accent-text)' : 'var(--text-secondary)',
                }}
              >
                {isCityInOthers ? prefs.city : t('ai.moreCities')}
              </button>
            </div>

            {(showMoreCities || isCityInOthers) && (
              <select
                value={isCityInOthers ? prefs.city : ''}
                onChange={e => setPrefs(p => ({ ...p, city: e.target.value }))}
                className="w-full border rounded-xl px-3 py-3 text-sm bg-transparent text-theme-primary border-theme focus:outline-none focus:ring-2 transition mt-1"
              >
                <option value="">{t('ai.selectCity')}</option>
                {OTHER_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            )}
          </div>

          <div className="h-px" style={{ background: 'var(--border-color)' }} />

          {/* Primary use — visual icon cards */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-theme-muted uppercase tracking-wide mb-2">
              <Gauge size={14} /> {t('ai.usageQuestion')}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {USAGES.map(u => {
                const Icon = u.icon;
                const active = prefs.usage === u.value;
                return (
                  <button
                    key={u.value}
                    type="button"
                    onClick={() => setPrefs(p => ({ ...p, usage: u.value }))}
                    className="relative flex items-center gap-3 rounded-xl border px-3 py-3 text-left transition hover:-translate-y-0.5"
                    style={{
                      borderColor: active ? 'var(--accent)' : 'var(--border-color)',
                      background: active ? 'var(--bg-dash-card)' : 'transparent',
                      boxShadow: active ? '0 6px 16px -6px var(--glow-1)' : 'none',
                    }}
                  >
                    {active && (
                      <span
                        className="absolute -top-2 -right-2 rounded-full p-1"
                        style={{ background: 'var(--accent)' }}
                      >
                        <Check size={10} color="var(--accent-text)" strokeWidth={3} />
                      </span>
                    )}
                    <span
                      className="shrink-0 p-2 rounded-lg"
                      style={{ background: active ? 'var(--accent)' : 'var(--bg-surface-alt)' }}
                    >
                      <Icon size={16} color={active ? 'var(--accent-text)' : 'var(--text-secondary)'} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-theme-primary truncate">{t(u.labelKey)}</span>
                      <span className="block text-xs text-theme-muted truncate">{t(u.hintKey)}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="h-px" style={{ background: 'var(--border-color)' }} />

          {/* Family size + Fuel preference */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-theme-muted uppercase tracking-wide mb-1.5">
                <Users size={14} /> {t('ai.family')}
              </label>
              <input
                type="text"
                placeholder={t('ai.familyPlaceholder')}
                value={prefs.familySize}
                onChange={e => setPrefs(p => ({ ...p, familySize: e.target.value }))}
                className="w-full border rounded-xl px-3 py-3 text-sm bg-transparent text-theme-primary border-theme focus:outline-none focus:ring-2 transition"
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-theme-muted uppercase tracking-wide mb-1.5">
                <Fuel size={14} /> {t('ai.fuelType')}
              </label>
              <select
                value={prefs.fuelPreference}
                onChange={e => setPrefs(p => ({ ...p, fuelPreference: e.target.value }))}
                className="w-full border rounded-xl px-3 py-3 text-sm bg-transparent text-theme-primary border-theme focus:outline-none focus:ring-2 transition"
              >
                <option value="">{t('ai.anyFuel')}</option>
                {FUEL_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-theme-muted uppercase tracking-wide mb-1.5">
              <StickyNote size={14} /> {t('ai.extraNotes')}
            </label>
            <textarea
              placeholder={t('ai.notesPlaceholder')}
              value={prefs.notes}
              onChange={e => setPrefs(p => ({ ...p, notes: e.target.value }))}
              className="w-full border rounded-xl px-3 py-3 text-sm bg-transparent text-theme-primary border-theme focus:outline-none focus:ring-2 transition resize-none"
              rows={3}
            />
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 text-white transition disabled:opacity-50 hover:opacity-95 active:scale-[0.99]"
            style={{ background: 'linear-gradient(135deg, var(--accent-2-from), var(--accent-2-to))' }}
          >
            {loading
              ? <><Loader2 size={18} className="animate-spin" /> {t('ai.loading')}</>
              : <><Sparkles size={18} /> {t('ai.findBtn')}</>}
          </button>
          <p className="text-center text-xs text-theme-muted -mt-3">{t('ai.freePowered')}</p>
        </div>

        {error && (
          <div
            className="mt-4 px-4 py-3 rounded-xl text-sm"
            style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.25)' }}
          >
            {error}
          </div>
        )}

        {results.length > 0 && (
          <div className="mt-8 space-y-4">
            <h2 className="font-bold text-theme-primary text-lg">{t('ai.results')}</h2>
            {results.map((rec, i) => {
              const currentCar = rec.car || rec;
              const rankDisplay = rec.rank || (i + 1);
              const priceDisplay = currentCar?.price ? Number(currentCar.price).toLocaleString() : "N/A";

              return (
                <div
                  key={i}
                  className="glass-card rounded-2xl p-5 relative overflow-hidden result-card"
                  style={{ animationDelay: `${i * 80}ms`, borderLeft: '3px solid var(--accent)' }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className="font-bold text-sm px-2 py-0.5 rounded-full"
                      style={{ background: 'var(--bg-dash-card)', color: 'var(--accent)', border: '1px solid var(--border-dash-card)' }}
                    >
                      #{rankDisplay}
                    </span>
                    <span className="font-semibold text-theme-primary">
                      {currentCar?.year} {currentCar?.brand} {currentCar?.model || currentCar?.title}
                    </span>
                  </div>
                  <p className="font-bold text-lg" style={{ color: 'var(--accent-2-from)' }}>PKR {priceDisplay}</p>
                  <p className="text-theme-secondary text-sm mt-2">{rec.reason || rec.description || rec.aiAnalysis}</p>

                  {rec.pros && rec.pros.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-semibold text-green-500 mb-1">✅ {t('ai.pros')}:</p>
                      <ul className="text-sm text-theme-secondary space-y-0.5">
                        {rec.pros.map((p, j) => <li key={j}>• {p}</li>)}
                      </ul>
                    </div>
                  )}

                  {rec.cons && rec.cons.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-semibold text-red-500 mb-1">⚠️ {t('ai.cons')}:</p>
                      <ul className="text-sm text-theme-secondary space-y-0.5">
                        {rec.cons.map((c, j) => <li key={j}>• {c}</li>)}
                      </ul>
                    </div>
                  )}

                  {(currentCar?.id || currentCar?._id) && (
                    <a
                      href={`/cars/${currentCar.id || currentCar._id}`}
                      className="mt-3 inline-flex items-center gap-1 text-sm px-4 py-2 rounded-lg text-white hover:opacity-90 transition"
                      style={{ background: 'linear-gradient(135deg, var(--accent-2-from), var(--accent-2-to))' }}
                    >
                      {t('ai.viewCar')} <ChevronRight size={14} />
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style jsx>{`
        .result-card {
          animation: fadeInUp 0.4s ease both;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .result-card { animation: none; }
        }
      `}</style>
    </div>
  );
}