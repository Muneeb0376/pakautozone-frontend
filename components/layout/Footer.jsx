'use client';
// frontend/components/layout/Footer.jsx
//
// ✅ POORI FILE REPLACE — Phase 3 (Phase 1 wali file ki jagah)
//
// Kya badla Phase 1 se:
//
// 1. ASLI RABTA — pehle yahan placeholder thay (`+92 000 0000000`,
//    `facebook.com/pakautozone` jo mojood hi nahi tha). Ab sab kuch
//    lib/siteContact.js se aata hai — aap ke asli do numbers, asli
//    email, aur asli Facebook/Instagram/TikTok links.
//
// 2. WHATSAPP BUTTON — dono numbers par seedha WhatsApp khulta hai.
//
// 3. CONTACT PAGE KA LINK — Company column mein "Rabta Karein" add hua.
//
// 4. Baqi sab Phase 1 jaisa: ghoomta hua logo, Categories aur Budget
//    ki columns browseData.js se, aur poora theme tokens par (light
//    mein light, dark mein dark).

import Link from 'next/link';
import { Mail, Phone, MapPin, MessageCircle } from 'lucide-react';
import { FaFacebookF, FaInstagram, FaTiktok, FaWhatsapp } from 'react-icons/fa';

import Logo from '@/components/layout/Logo';
import { useLang } from '@/lib/i18nContext';
import { BODY_TYPES, BUDGET_RANGES, toCarsHref } from '@/components/home/browseData';
import { SITE, PHONES, SOCIALS, ADDRESS, mailto, telLink, waLink } from '@/lib/siteContact';

const CARS_BY_MAKE = ['Toyota', 'Honda', 'Suzuki', 'Kia', 'Hyundai', 'Changan', 'MG', 'Nissan'];
const CARS_BY_CITY = ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Peshawar', 'Multan', 'Sialkot'];

const SOCIAL_ICON = {
  facebook: FaFacebookF,
  instagram: FaInstagram,
  tiktok: FaTiktok,
};

const tx = (t, key, fallback) => {
  const out = t(key);
  return !out || out === key ? fallback : out;
};

function FLink({ href, children, external }) {
  const cls = 'paz-f-link transition-colors';
  return (
    <li>
      {external ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>{children}</a>
      ) : (
        <Link href={href} className={cls}>{children}</Link>
      )}
    </li>
  );
}

function Column({ title, children }) {
  return (
    <div>
      <h4 className="font-bold mb-3 text-sm" style={{ color: 'var(--text-primary)' }}>
        {title}
      </h4>
      <ul className="space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
        {children}
      </ul>
    </div>
  );
}

export default function Footer() {
  const { t } = useLang();

  return (
    <footer
      className="mt-16 paz-has-bottom-nav"
      style={{ background: 'var(--bg-section-accent)', borderTop: '1px solid var(--border-color)' }}
    >
      <div className="max-w-7xl mx-auto px-4 py-12 sm:py-14">

        {/* ━━━━━━ TOP ━━━━━━ */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">

          {/* ── Brand + rabta ── */}
          <div className="col-span-2 lg:col-span-2">
            <div className="mb-4 -ml-1">
              <Logo size="sm" spin />
            </div>

            <p className="text-sm leading-relaxed max-w-xs" style={{ color: 'var(--text-secondary)' }}>
              {tx(
                t,
                'footer.brandTagline',
                'Pakistan ka apna auto marketplace — nayi aur used cars, genuine spare parts, verified showrooms aur asaan trade-in, sab ek jagah.'
              )}
            </p>

            {/* ✅ Asli rabta */}
            <ul className="mt-5 space-y-2.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
              <li className="flex items-start gap-2.5">
                <Mail size={15} style={{ color: 'var(--accent)' }} className="shrink-0 mt-0.5" />
                <a href={mailto()} className="paz-f-link break-all">{SITE.email}</a>
              </li>

              {PHONES.map((p) => (
                <li key={p.raw} className="flex items-center gap-2.5">
                  <Phone size={15} style={{ color: 'var(--accent)' }} className="shrink-0" />
                  <a href={telLink(p)} className="paz-f-link font-medium tabular-nums">
                    {p.display}
                  </a>
                  {p.whatsapp && (
                    <a
                      href={waLink(p)}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`WhatsApp ${p.display}`}
                      title={t('footer.whatsapp')}
                      className="shrink-0 w-6 h-6 rounded-md flex items-center justify-center transition-colors"
                      style={{ background: 'rgba(37,211,102,0.12)', color: '#25D366' }}
                    >
                      <FaWhatsapp size={12} />
                    </a>
                  )}
                </li>
              ))}

              <li className="flex items-start gap-2.5">
                <MapPin size={15} style={{ color: 'var(--accent)' }} className="shrink-0 mt-0.5" />
                <span>{ADDRESS.line}</span>
              </li>
            </ul>
          </div>

          <Column title={tx(t, 'footer.carsByMake', 'Cars by Make')}>
            {CARS_BY_MAKE.map((brand) => (
              <FLink key={brand} href={toCarsHref({ brand })}>{brand} Cars</FLink>
            ))}
          </Column>

          <Column title={tx(t, 'footer.carsByCity', 'Cars by City')}>
            {CARS_BY_CITY.map((city) => (
              <FLink key={city} href={toCarsHref({ city })}>Cars in {city}</FLink>
            ))}
          </Column>

          <Column title={tx(t, 'footer.categories', 'Categories')}>
            {BODY_TYPES.map((b) => (
              <FLink key={b.value} href={toCarsHref({ bodyType: b.value })}>{b.label}</FLink>
            ))}
          </Column>

          <Column title={tx(t, 'footer.byBudget', 'By Budget')}>
            {BUDGET_RANGES.slice(0, 8).map((b) => (
              <FLink key={b.label} href={toCarsHref(b.query)}>{b.label}</FLink>
            ))}
          </Column>
        </div>

        {/* ━━━━━━ MID ━━━━━━ */}
        <div
          className="grid grid-cols-2 sm:grid-cols-4 gap-8 mt-10 pt-8"
          style={{ borderTop: '1px solid var(--border-color)' }}
        >
          <Column title={tx(t, 'footer.explore', 'Explore')}>
            <FLink href="/cars">{tx(t, 'nav.usedCars', 'Used Cars')}</FLink>
            <FLink href="/cars?condition=NEW">{tx(t, 'nav.newCars', 'New Cars')}</FLink>
            <FLink href="/spare-parts">{tx(t, 'nav.parts', 'Spare Parts')}</FLink>
            <FLink href="/stores">{tx(t, 'nav.verifiedDealers', 'Verified Dealers')}</FLink>
          </Column>

          <Column title={tx(t, 'footer.tools', 'Tools')}>
            <FLink href="/cars?exchange=true">{tx(t, 'nav.tradeIn', 'Trade In')}</FLink>
            <FLink href="/price-check">{tx(t, 'footer.priceCheck', 'Price Check')}</FLink>
            <FLink href="/ai-recommend">{tx(t, 'footer.aiFinder', 'AI Car Finder')}</FLink>
            <FLink href="/wishlist">{tx(t, 'nav.wishlist', 'Wishlist')}</FLink>
          </Column>

          <Column title={tx(t, 'footer.forSellers', 'Sellers ke liye')}>
            <FLink href="/sell">{tx(t, 'nav.sellYourCar', 'Sell Your Car')}</FLink>
            <FLink href="/dashboard/new-listing">{tx(t, 'footer.postAd', 'Listing Lagayein')}</FLink>
            <FLink href="/dashboard/register-showroom">{tx(t, 'footer.becomeDealer', 'Showroom Register Karein')}</FLink>
            <FLink href="/pricing">{tx(t, 'footer.pricing', 'Pricing')}</FLink>
          </Column>

          <Column title={tx(t, 'footer.company', 'Company')}>
            <FLink href="/blog">{tx(t, 'nav.blog', 'Blog')}</FLink>
            {/* ✅ NEW */}
            <FLink href="/contact">{tx(t, 'nav.contact', 'Rabta Karein')}</FLink>
            <FLink href="/privacy-policy">{tx(t, 'nav.privacyPolicy', 'Privacy Policy')}</FLink>
            <FLink href="/dashboard">{tx(t, 'nav.dashboard', 'Dashboard')}</FLink>
          </Column>
        </div>

        {/* ━━━━━━ BOTTOM ━━━━━━ */}
        <div
          className="mt-10 pt-6 flex flex-col md:flex-row items-center justify-between gap-5"
          style={{ borderTop: '1px solid var(--border-color)' }}
        >
          <p className="text-sm order-3 md:order-1" style={{ color: 'var(--text-muted)' }}>
            © {new Date().getFullYear()} {SITE.name}. All rights reserved.
          </p>

          {/* ✅ Asli social links */}
          <div className="flex items-center gap-3 order-1 md:order-2">
            {SOCIALS.map((s) => {
              const Icon = SOCIAL_ICON[s.key] || MessageCircle;
              return (
                <a
                  key={s.key}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${s.label} — ${s.handle}`}
                  title={s.handle}
                  className="paz-f-social w-9 h-9 flex items-center justify-center rounded-full transition-colors"
                  style={{
                    background: 'var(--bg-surface-alt)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <Icon size={s.key === 'instagram' ? 16 : 14} />
                </a>
              );
            })}

            <a
              href={waLink(PHONES[0])}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t('footer.whatsapp')}
              className="paz-f-social w-9 h-9 flex items-center justify-center rounded-full transition-colors"
              style={{
                background: 'var(--bg-surface-alt)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-secondary)',
              }}
            >
              <FaWhatsapp size={16} />
            </a>

            <a
              href={mailto()}
              aria-label={t('common.email')}
              className="paz-f-social w-9 h-9 flex items-center justify-center rounded-full transition-colors"
              style={{
                background: 'var(--bg-surface-alt)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-secondary)',
              }}
            >
              <Mail size={15} />
            </a>
          </div>
        </div>
      </div>

      <style jsx>{`
        .paz-f-link:hover { color: var(--accent); }
        .paz-f-social:hover {
          background: var(--accent);
          color: var(--accent-text);
          border-color: var(--accent);
        }
      `}</style>
    </footer>
  );
}