'use client';
import { useLang } from '@/lib/i18nContext';
import { useState } from 'react';
import Link from 'next/link';
import { Car, Facebook, Instagram, Mail, ChevronDown } from 'lucide-react';
import { mailto } from '@/lib/siteContact';

const CARS_BY_MAKE = ['Toyota', 'Honda', 'Suzuki', 'Kia', 'Hyundai', 'Changan', 'MG', 'Nissan'];
const CARS_BY_CITY = ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Peshawar', 'Multan', 'Sialkot'];

function TikTokIcon({ size = 18 }) {
  const { t } = useLang();
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M16.6 5.82c-1.05-.9-1.71-2.13-1.86-3.5V2h-3.32v13.85a2.68 2.68 0 1 1-1.9-2.57v-3.4a6.02 6.02 0 1 0 5.22 5.97V9.4a7.28 7.28 0 0 0 4.24 1.36V7.44a4.44 4.44 0 0 1-2.38-1.62z" />
    </svg>
  );
}

// ✅ Mobile pe collapsible section (Amazon/Walmart style). md aur upar pe
// ye hamesha khula rakhta hai (chevron bhi chhup jata hai) — behavior sirf
// mobile pe activate hota hai.
function FooterSection({ title, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-800 md:border-none py-1 md:py-0">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between py-3 md:py-0 md:mb-3 md:pointer-events-none"
      >
        <h4 className="text-white font-semibold text-sm">{title}</h4>
        <ChevronDown
          size={16}
          className={`md:hidden transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <div className={`${open ? 'block' : 'hidden'} md:block pb-3 md:pb-0`}>
        {children}
      </div>
    </div>
  );
}

export default function Footer() {
  const { t } = useLang();
  return (
    <footer className="bg-gray-950 text-gray-400 mt-16">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:py-14">
        {/* Brand — hamesha upar, full width mobile pe */}
        <div className="mb-4 md:mb-8">
          <div className="flex items-center gap-2 mb-3">
            <div className="bg-amber-500 p-1.5 rounded-lg">
              <Car size={18} className="text-gray-950" />
            </div>
            <span className="font-black text-white text-lg">
              Pak <span className="text-amber-500">Auto</span> Zone
            </span>
          </div>
          <p className="text-sm leading-relaxed max-w-md">
            Pakistan ka #1 automotive marketplace — cars, spare parts, trade-in, sab kuch ek jagah.
          </p>
        </div>

        {/* ━━━━━━ LINK COLUMNS — mobile: accordion stack | desktop: 4-col grid ━━━━━━ */}
        <div className="md:grid md:grid-cols-4 md:gap-8">
          <FooterSection title={t('footer.carsByMake')}>
            <ul className="space-y-2 text-sm grid grid-cols-2 md:grid-cols-1 gap-x-4">
              {CARS_BY_MAKE.map((brand) => (
                <li key={brand}>
                  <Link href={`/cars?brand=${brand}`} className="hover:text-amber-400 active:text-amber-400 transition-colors">
                    {brand} Cars
                  </Link>
                </li>
              ))}
            </ul>
          </FooterSection>

          <FooterSection title={t('footer.carsByCity')}>
            <ul className="space-y-2 text-sm grid grid-cols-2 md:grid-cols-1 gap-x-4">
              {CARS_BY_CITY.map((city) => (
                <li key={city}>
                  <Link href={`/cars?city=${city}`} className="hover:text-amber-400 active:text-amber-400 transition-colors">
                    Cars in {city}
                  </Link>
                </li>
              ))}
            </ul>
          </FooterSection>

          <FooterSection title={t('common.explore')}>
            <ul className="space-y-2 text-sm">
              <li><Link href="/cars" className="hover:text-amber-400 active:text-amber-400 transition-colors">{t('nav.usedCars')}</Link></li>
              <li><Link href="/spare-parts" className="hover:text-amber-400 active:text-amber-400 transition-colors">{t('nav.parts')}</Link></li>
              <li><Link href="/stores" className="hover:text-amber-400 active:text-amber-400 transition-colors">{t('nav.verifiedDealers')}</Link></li>
              <li><Link href="/cars?exchange=true" className="hover:text-amber-400 active:text-amber-400 transition-colors">{t('nav.tradeIn')}</Link></li>
              <li><Link href="/price-check" className="hover:text-amber-400 active:text-amber-400 transition-colors">{t('nav.priceCheck')}</Link></li>
            </ul>
          </FooterSection>

          <FooterSection title={t('footer.company')}>
            <ul className="space-y-2 text-sm">
              <li><Link href="/sell" className="hover:text-amber-400 active:text-amber-400 transition-colors">{t('nav.sellYourCar')}</Link></li>
              <li><Link href="/dashboard/become-seller" className="hover:text-amber-400 active:text-amber-400 transition-colors">{t('footer.becomeDealer')}</Link></li>
              <li><Link href="/privacy-policy" className="hover:text-amber-400 active:text-amber-400 transition-colors">{t('nav.privacyPolicy')}</Link></li>
              <li><Link href="/dashboard" className="hover:text-amber-400 active:text-amber-400 transition-colors">{t('nav.dashboard')}</Link></li>
            </ul>
          </FooterSection>
        </div>

        {/* ━━━━━━ BOTTOM: SOCIAL + CONTACT + COPYRIGHT ━━━━━━ */}
        <div className="border-t border-gray-800 mt-6 md:mt-10 pt-6 flex flex-col-reverse md:flex-row items-center justify-between gap-4">
          <p className="text-xs sm:text-sm text-gray-500 text-center md:text-left">
            © 2026 Pak Auto Zone. All rights reserved.
          </p>

          <div className="flex items-center gap-3 sm:gap-4">
            <a
              href="https://facebook.com/pakautozone"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-800 hover:bg-amber-500 hover:text-gray-950 active:bg-amber-500 active:text-gray-950 transition-colors"
            >
              <Facebook size={16} />
            </a>
            <a
              href="https://instagram.com/pakautozone"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-800 hover:bg-amber-500 hover:text-gray-950 active:bg-amber-500 active:text-gray-950 transition-colors"
            >
              <Instagram size={16} />
            </a>
            <a
              href="https://tiktok.com/@pakautozone"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="TikTok"
              className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-800 hover:bg-amber-500 hover:text-gray-950 active:bg-amber-500 active:text-gray-950 transition-colors"
            >
              <TikTokIcon size={16} />
            </a>
            <a
              href={mailto()}
              aria-label={t('common.email')}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-800 hover:bg-amber-500 hover:text-gray-950 active:bg-amber-500 active:text-gray-950 transition-colors"
            >
              <Mail size={16} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}