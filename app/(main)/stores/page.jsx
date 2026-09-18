'use client';
import { useLang } from '@/lib/i18nContext';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Store, MapPin, Phone, CheckCircle, ChevronRight, Car, MessageCircle, ChevronDown } from 'lucide-react';
import { PROVINCES, getCitiesByProvince } from '@/lib/pakistanLocations';
import { useTheme } from '@/lib/themeContext';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';
const BASE_URL = API_BASE.replace('/api', '');

const getImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};

function maskPhone(phone) {
  if (!phone) return '';
  const str = String(phone).replace(/\s/g, '');
  if (str.length <= 7) return str;
  const visible = 4;
  return str.slice(0, visible) + '•'.repeat(str.length - visible - 3) + str.slice(-3);
}

function whatsappLink(phone) {
  if (!phone) return '#';
  const digits = String(phone).replace(/\D/g, '');
  const intl = digits.startsWith('0') ? '92' + digits.slice(1) : digits;
  return `https://wa.me/${intl}`;
}

export default function StoresPage() {
  const { t } = useLang();
  const { theme } = useTheme();
  const dark = theme === 'dark';

  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [revealedPhones, setRevealedPhones] = useState({});
  const [activeTab, setActiveTab] = useState('verified');

  const availableCities = selectedProvince ? getCitiesByProvince(selectedProvince) : [];

  useEffect(() => {
    fetchAllStores();
  }, []);

  const fetchAllStores = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/stores`);
      const data = await res.json();
      if (Array.isArray(data)) setStores(data);
      else if (Array.isArray(data?.data)) setStores(data.data);
      else setStores([]);
    } catch {
      setStores([]);
    } finally {
      setLoading(false);
    }
  };

  const verifiedCount = stores.filter((s) => s.isVerified).length;
  const showroomCount = stores.filter((s) => !s.isVerified).length;

  const filteredStores = stores.filter((store) => {
    if (activeTab === 'verified' && !store.isVerified) return false;
    if (activeTab === 'showrooms' && store.isVerified) return false;
    if (selectedCity) return store.city?.toLowerCase() === selectedCity.toLowerCase();
    if (selectedProvince) {
      const provinceCities = getCitiesByProvince(selectedProvince).map((c) => c.toLowerCase());
      return provinceCities.includes(store.city?.toLowerCase() || '');
    }
    return true;
  });

  const handleProvinceClick = (province) => {
    if (selectedProvince === province) {
      setSelectedProvince('');
      setSelectedCity('');
    } else {
      setSelectedProvince(province);
      setSelectedCity('');
    }
  };

  const togglePhone = (storeId) => {
    setRevealedPhones((prev) => ({ ...prev, [storeId]: !prev[storeId] }));
  };

  return (
    <div className={`min-h-screen ${dark ? 'bg-slate-950 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* HEADER */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${dark ? 'bg-amber-900/40' : 'bg-amber-100'}`}>
              <Store className="text-amber-500" size={22} />
            </div>
            <div>
              <h1 className={`text-2xl font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>{t('stores.title')}</h1>
              <p className={`text-sm ${dark ? 'text-slate-400' : 'text-gray-400'}`}>{t('stores.subtitle')}</p>
            </div>
          </div>
        </div>

        {/* TABS */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab('verified')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm font-bold border transition-all ${
              activeTab === 'verified'
                ? dark
                  ? 'bg-blue-900/40 text-blue-300 border-blue-700 shadow-sm'
                  : 'bg-blue-50 text-blue-700 border-blue-200 shadow-sm'
                : dark
                  ? 'bg-slate-900 text-slate-400 border-slate-700 hover:border-blue-600 hover:text-blue-400'
                  : 'bg-white text-gray-500 border-gray-100 hover:border-blue-200 hover:text-blue-600'
            }`}
          >
            <CheckCircle size={16} className={activeTab === 'verified' ? 'text-blue-500' : dark ? 'text-slate-600' : 'text-gray-300'} />{t('nav.verifiedDealers')}<span className={`text-[11px] px-1.5 py-0.5 rounded-full font-bold ${
              activeTab === 'verified'
                ? dark ? 'bg-blue-800 text-blue-200' : 'bg-blue-100 text-blue-700'
                : dark ? 'bg-slate-700 text-slate-400' : 'bg-gray-100 text-gray-400'
            }`}>
              {verifiedCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('showrooms')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm font-bold border transition-all ${
              activeTab === 'showrooms'
                ? dark
                  ? 'bg-amber-900/40 text-amber-300 border-amber-700 shadow-sm'
                  : 'bg-amber-50 text-amber-700 border-amber-200 shadow-sm'
                : dark
                  ? 'bg-slate-900 text-slate-400 border-slate-700 hover:border-amber-600 hover:text-amber-400'
                  : 'bg-white text-gray-500 border-gray-100 hover:border-amber-200 hover:text-amber-600'
            }`}
          >
            <Store size={16} className={activeTab === 'showrooms' ? 'text-amber-500' : dark ? 'text-slate-600' : 'text-gray-300'} />{t('nav.stores')}<span className={`text-[11px] px-1.5 py-0.5 rounded-full font-bold ${
              activeTab === 'showrooms'
                ? dark ? 'bg-amber-800 text-amber-200' : 'bg-amber-100 text-amber-700'
                : dark ? 'bg-slate-700 text-slate-400' : 'bg-gray-100 text-gray-400'
            }`}>
              {showroomCount}
            </span>
          </button>
        </div>

        {/* PROVINCE FILTER */}
        <div className={`rounded-2xl border shadow-sm p-5 mb-4 ${dark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-100'}`}>
          <p className={`text-xs font-bold uppercase tracking-widest mb-3 ${dark ? 'text-slate-500' : 'text-gray-400'}`}>
            {t('stores.province')}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => { setSelectedProvince(''); setSelectedCity(''); }}
              className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                !selectedProvince
                  ? 'bg-amber-500 text-white border-amber-500 shadow-sm shadow-amber-200'
                  : dark
                    ? 'bg-slate-800 text-slate-300 border-slate-600 hover:border-amber-500 hover:text-amber-400'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-amber-300 hover:text-amber-600'
              }`}
            >
              🇵🇰 {t('stores.allPakistan')}
            </button>

            {PROVINCES.map((province) => (
              <button
                key={province}
                onClick={() => handleProvinceClick(province)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all flex items-center gap-1.5 ${
                  selectedProvince === province
                    ? 'bg-amber-500 text-white border-amber-500 shadow-sm shadow-amber-200'
                    : dark
                      ? 'bg-slate-800 text-slate-300 border-slate-600 hover:border-amber-500 hover:text-amber-400'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-amber-300 hover:text-amber-600'
                }`}
              >
                {province}
                {selectedProvince === province && availableCities.length > 0 && (
                  <ChevronDown size={14} />
                )}
              </button>
            ))}
          </div>

          {/* CITY SUB-FILTER */}
          {selectedProvince && availableCities.length > 0 && (
            <div className={`mt-4 pt-4 border-t ${dark ? 'border-slate-700' : 'border-gray-100'}`}>
              <p className={`text-xs font-bold uppercase tracking-widest mb-3 ${dark ? 'text-slate-500' : 'text-gray-400'}`}>
                {t('stores.city')} — {selectedProvince}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCity('')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    !selectedCity
                      ? dark ? 'bg-amber-900/40 text-amber-300 border-amber-700' : 'bg-amber-100 text-amber-700 border-amber-300'
                      : dark ? 'bg-slate-800 text-slate-400 border-slate-600 hover:border-amber-500 hover:text-amber-400' : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-amber-200 hover:text-amber-600'
                  }`}
                >
                  {t('stores.allProvince', { province: selectedProvince.split(' ')[0] })}
                </button>
                {availableCities.map((city) => (
                  <button
                    key={city}
                    onClick={() => setSelectedCity(city === selectedCity ? '' : city)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      selectedCity === city
                        ? dark ? 'bg-amber-900/40 text-amber-300 border-amber-700' : 'bg-amber-100 text-amber-700 border-amber-300'
                        : dark ? 'bg-slate-800 text-slate-400 border-slate-600 hover:border-amber-500 hover:text-amber-400' : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-amber-200 hover:text-amber-600'
                    }`}
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RESULTS COUNT */}
        {!loading && (
          <p className={`text-sm mb-5 px-1 ${dark ? 'text-slate-400' : 'text-gray-400'}`}>
            {activeTab === 'verified'
              ? t('stores.verifiedCount', { count: filteredStores.length, place: selectedCity || selectedProvince || t('common.pakistan') })
              : t('stores.showroomCount', { count: filteredStores.length, place: selectedCity || selectedProvince || t('common.pakistan') })}
          </p>
        )}

        {/* STORE CARDS */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className={`rounded-2xl h-44 animate-pulse border ${dark ? 'bg-slate-800 border-slate-700' : 'bg-gray-100 border-gray-100'}`} />
            ))}
          </div>
        ) : filteredStores.length === 0 ? (
          <div className={`text-center py-20 rounded-2xl border ${dark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-100'}`}>
            <Store size={52} className={`mx-auto mb-4 ${dark ? 'text-slate-700' : 'text-gray-200'}`} />
            <p className={`text-base font-semibold ${dark ? 'text-slate-400' : 'text-gray-400'}`}>
              {selectedCity
                ? `${selectedCity} — ${activeTab === 'verified' ? t('stores.noVerified') : t('stores.noShowroom')}`
                : selectedProvince
                ? `${selectedProvince} — ${activeTab === 'verified' ? t('stores.noVerified') : t('stores.noShowroom')}`
                : activeTab === 'verified' ? t('stores.noVerified') : t('stores.noShowroom')}
            </p>
            {(selectedCity || selectedProvince) && (
              <button
                onClick={() => { setSelectedProvince(''); setSelectedCity(''); }}
                className="mt-4 text-sm font-semibold text-amber-600 hover:text-amber-500 underline"
              >
                {t('stores.viewAll')}
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredStores.map((store) => (
              <div
                key={store.id}
                className={`group rounded-2xl border shadow-sm hover:shadow-md transition-all overflow-hidden ${
                  dark
                    ? 'bg-slate-900 border-slate-700 hover:border-amber-600'
                    : 'bg-white border-gray-100 hover:border-amber-200'
                }`}
              >
                <Link href={`/stores/${store.slug}`} className="block p-5">
                  <div className="flex items-start gap-4">
                    {/* Logo */}
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center overflow-hidden shrink-0 border transition-colors ${
                      dark
                        ? 'bg-slate-800 border-slate-600 group-hover:border-amber-600'
                        : 'bg-amber-50 border-amber-100 group-hover:border-amber-300'
                    }`}>
                      {store.logo ? (
                        <img
                          src={getImageUrl(store.logo)}
                          alt={store.name}
                          className="w-full h-full object-cover"
                          onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }}
                        />
                      ) : (
                        <Store className="text-amber-400" size={24} />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <h3 className={`font-bold truncate text-base leading-tight ${dark ? 'text-white' : 'text-gray-900'}`}>
                          {store.name}
                        </h3>
                        {store.isVerified && (
                          <CheckCircle size={15} className="text-blue-500 shrink-0" />
                        )}
                      </div>

                      <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-semibold border mb-2.5 ${
                        dark ? 'bg-amber-900/30 text-amber-400 border-amber-800' : 'bg-amber-50 text-amber-700 border-amber-100'
                      }`}>
                        <Car size={10} />
                        {t('stores.carsListed', { count: store._count?.cars ?? store.carsCount ?? 0 })}
                      </span>

                      {store.city && (
                        <p className={`flex items-center gap-1.5 text-xs ${dark ? 'text-slate-400' : 'text-gray-400'}`}>
                          <MapPin size={12} className="text-amber-400 shrink-0" />
                          {store.city}
                        </p>
                      )}
                    </div>

                    <ChevronRight
                      size={16}
                      className={`mt-1 shrink-0 transition-colors ${dark ? 'text-slate-600 group-hover:text-amber-400' : 'text-gray-300 group-hover:text-amber-500'}`}
                    />
                  </div>
                </Link>

                {/* PHONE ROW */}
                {store.phone && (
                  <div className={`border-t px-5 py-3 flex items-center justify-between gap-3 ${
                    dark ? 'border-slate-700 bg-slate-800/50' : 'border-gray-50 bg-gray-50/50'
                  }`}>
                    <div className={`flex items-center gap-2 text-xs ${dark ? 'text-slate-400' : 'text-gray-400'}`}>
                      <Phone size={12} className="text-amber-400" />
                      <span className="font-mono tracking-wider">
                        {revealedPhones[store.id] ? store.phone : maskPhone(store.phone)}
                      </span>
                      <button
                        onClick={() => togglePhone(store.id)}
                        className="text-[10px] text-amber-500 font-semibold hover:text-amber-400 underline ml-1"
                      >
                        {revealedPhones[store.id] ? t('stores.hidePhone') : t('stores.showPhone')}
                      </button>
                    </div>

                    <a
                      href={whatsappLink(store.phone)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors shrink-0"
                    >
                      <MessageCircle size={13} />{t('seller.whatsapp')}</a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}