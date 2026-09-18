// frontend/app/(main)/contact/page.jsx
//
// ✅ POORI FILE REPLACE — Phase 5 (Phase 3 wali file ki jagah)
//
// Kya badla:
//
// 1. ASLI FORM — pehle sirf `mailto:` links thay jo Gmail-in-browser
//    wale users par kaam hi nahi karte thay. Ab `<ContactForm />` hai jo
//    seedha aap ke inbox mein message bhejta hai.
//    (`mailto:` link phir bhi rakha hai — jin logon ke paas mail app hai
//     un ke liye ek shortcut, lekin ab wo AKELA raasta nahi hai.)
//
// 2. AUQAAT — saatoon din khule, Juma ko namaz ka waqfa. Pehle Itwaar
//    "Band" likha tha.
//
// 3. LOCATION — Haripur, Pakistan.
//
// 4. ZYADA ASLI SHAKAL — ab safha do columns mein hai: baayein form,
//    daayein rabta ke kaarD. Pehle sirf cards ki qatarein thin jo khali
//    khali lagti thin.
//
// ⚠️ Ye SERVER component hai (koi 'use client' nahi) taake Google poora
//    content pehli HTML response mein parh le. Form alag client
//    component hai — dono ek saath theek chalte hain.

import { cookies } from 'next/headers';
import Link from 'next/link';
import {
  Mail, Phone, MapPin, Clock, MessageCircle, ArrowRight,
  HelpCircle, Store, CreditCard, ShieldAlert, Car, Zap,
} from 'lucide-react';
import { FaFacebookF, FaInstagram, FaTiktok, FaWhatsapp } from 'react-icons/fa';

import ContactForm from '@/components/contact/ContactForm';
import { getT, DEFAULT_LANG } from '@/lib/i18n';
import {
  SITE, PHONES, SOCIALS, BUSINESS_HOURS, HOURS_NOTE_KEY, ADDRESS,
  mailto, telLink, waLink,
} from '@/lib/siteContact';

// Cookie ka naam lib/i18nContext.jsx wale COOKIE_KEY se match hona chahiye
const LANG_COOKIE = 'autopk_lang';

export const metadata = {
  title: `Rabta Karein — ${SITE.name}`,
  description:
    'Pak Auto Zone se raabta karein — phone, WhatsApp, email aur online form. Haripur, Pakistan. Saatoon din khule.',
  alternates: { canonical: '/contact' },
};

const SOCIAL_ICON = { facebook: FaFacebookF, instagram: FaInstagram, tiktok: FaTiktok };

// Note: titleKey/bodyKey/actionLabelKey — text yahan se nahi, t() se aata hai (translate())
const HELP_TOPICS = [
  {
    icon: Car,
    titleKey: 'contactPage.help.listing.title',
    bodyKey: 'contactPage.help.listing.body',
    action: { labelKey: 'contactPage.help.listing.action', href: '/dashboard/seller' },
  },
  {
    icon: CreditCard,
    titleKey: 'contactPage.help.payment.title',
    bodyKey: 'contactPage.help.payment.body',
    action: { labelKey: 'contactPage.help.payment.action', href: '/pricing' },
  },
  {
    icon: Store,
    titleKey: 'contactPage.help.showroom.title',
    bodyKey: 'contactPage.help.showroom.body',
    action: { labelKey: 'contactPage.help.showroom.action', href: '/dashboard/register-showroom' },
  },
  {
    icon: ShieldAlert,
    titleKey: 'contactPage.help.scam.title',
    bodyKey: 'contactPage.help.scam.body',
    action: { labelKey: 'contactPage.help.scam.action', href: '#contact-form' },
  },
];

const FAQS = [
  { qKey: 'contactPage.faq.reply.q', aKey: 'contactPage.faq.reply.a' },
  { qKey: 'contactPage.faq.cost.q', aKey: 'contactPage.faq.cost.a' },
  { qKey: 'contactPage.faq.liveTime.q', aKey: 'contactPage.faq.liveTime.a' },
  { qKey: 'contactPage.faq.numberVisible.q', aKey: 'contactPage.faq.numberVisible.a' },
  { qKey: 'contactPage.faq.badge.q', aKey: 'contactPage.faq.badge.a' },
];

// ✅ FIX: ye SERVER component hai, isliye `useLang()` (client hook) yahan
// nahi chal sakta. Cookie se lang seedha yahan padho aur server-safe
// getT() se t() banao — koi flash nahi, koi 'use client' ki zaroorat nahi.
export default async function ContactPage() {
  const cookieStore = await cookies();
  const lang = cookieStore.get(LANG_COOKIE)?.value || DEFAULT_LANG;
  const t = getT(lang);

  return (
    <div className="pb-16 paz-has-bottom-nav">

      {/* ══════════ HERO ══════════ */}
      <div
        className="relative left-1/2 right-1/2 -mx-[50vw] w-screen overflow-hidden mb-10"
        style={{ background: 'var(--bg-hero)' }}
      >
        <div
          aria-hidden="true"
          className="absolute -bottom-24 right-1/4 w-96 h-96 rounded-full blur-3xl pointer-events-none"
          style={{ background: 'rgba(232,184,75,0.12)' }}
        />

        <div className="relative max-w-5xl mx-auto px-4 py-14 sm:py-16">
          <span
            className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] px-3 py-1.5 rounded-full mb-5"
            style={{
              background: 'rgba(232,184,75,0.12)',
              color: 'var(--accent)',
              border: '1px solid rgba(232,184,75,0.3)',
            }}
          >
            <MessageCircle size={13} strokeWidth={2.5} />{t('parts.contact')}</span>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight" style={{ color: 'var(--text-primary)' }}>
            {t('contactPage.heroTitle')}
          </h1>

          <p className="mt-4 text-sm sm:text-base max-w-2xl leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {t('contactPage.heroDesc')}
          </p>

          {/* Fauri raabta */}
          <div className="mt-7 flex flex-wrap gap-3">
            <a
              href={waLink(PHONES[0], 'Assalam o Alaikum, mujhe madad chahiye thi.')}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 h-11 px-5 rounded-xl text-sm font-bold"
              style={{ background: '#25D366', color: '#0b3d2c' }}
            >
              <FaWhatsapp size={16} />{t('seller.whatsapp')}</a>
            <a
              href={telLink(PHONES[0])}
              className="inline-flex items-center gap-2 h-11 px-5 rounded-xl text-sm font-bold"
              style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
            >
              <Phone size={15} /> {t('contactPage.callBtn')}
            </a>
            <a
              href="#contact-form"
              className="inline-flex items-center gap-2 h-11 px-5 rounded-xl text-sm font-bold"
              style={{ border: '1px solid var(--border-color)', color: 'var(--text-primary)', background: 'var(--card-bg)' }}
            >
              <Mail size={15} /> {t('contactPage.messageBtn')}
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4">

        {/* ══════════ FORM + RABTA ══════════ */}
        <div id="contact-form" className="grid lg:grid-cols-[1.15fr_1fr] gap-5 mb-14 scroll-mt-24">

          {/* ── Form (client component) ── */}
          <ContactForm />

          {/* ── Rabta ke zarai ── */}
          <div className="space-y-4">

            {/* Phones */}
            {PHONES.map((p) => (
              <div
                key={p.raw}
                className="rounded-2xl p-5"
                style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}
              >
                <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
                  {t(p.labelKey)}
                </p>
                <p className="font-black text-lg tracking-wide mb-3.5 tabular-nums" style={{ color: 'var(--text-primary)' }}>
                  {p.display}
                </p>

                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={telLink(p)}
                    className="h-10 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold"
                    style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
                  >
                    <Phone size={13} />{t('seller.call')}</a>
                  <a
                    href={waLink(p, 'Assalam o Alaikum, Pak Auto Zone se raabta karna tha.')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-10 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold"
                    style={{ background: 'rgba(37,211,102,0.12)', color: '#128C7E', border: '1px solid rgba(37,211,102,0.30)' }}
                  >
                    <FaWhatsapp size={14} />{t('seller.whatsapp')}</a>
                </div>
              </div>
            ))}

            {/* Email — mailto ab AKELA raasta nahi, sirf shortcut hai */}
            <div
              className="rounded-2xl p-5"
              style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}
            >
              <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>{t('common.email')}</p>
              <p className="font-bold text-sm mb-2 break-all" style={{ color: 'var(--text-primary)' }}>
                {SITE.email}
              </p>
              <p className="text-[11px] leading-relaxed mb-3" style={{ color: 'var(--text-muted)' }}>
                {t('contactPage.emailNote')}
              </p>
              <a
                href={mailto('Pak Auto Zone — Sawal')}
                className="inline-flex items-center gap-1.5 text-xs font-bold"
                style={{ color: 'var(--accent)' }}
              >
                {t('contactPage.openMailApp')} <ArrowRight size={13} />
              </a>
            </div>

            {/* Auqaat */}
            <div
              className="rounded-2xl p-5"
              style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}
            >
              <div className="flex items-center gap-2.5 mb-4">
                <Clock size={17} strokeWidth={1.8} style={{ color: 'var(--accent)' }} />
                <h2 className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>
                  {t('contactPage.workingHoursTitle')}
                </h2>
                <span
                  className="ml-auto inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(5,150,105,0.12)', color: '#059669' }}
                >
                  <Zap size={9} /> {t('contactPage.sevenDays')}
                </span>
              </div>

              <ul className="space-y-2.5">
                {BUSINESS_HOURS.map((h) => (
                  <li key={h.daysKey} className="flex justify-between items-start gap-3 text-[13px]">
                    <span style={{ color: 'var(--text-secondary)' }}>{t(h.daysKey)}</span>
                    <span
                      className="font-bold text-right tabular-nums"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {h.time}
                    </span>
                  </li>
                ))}
              </ul>

              <p
                className="text-[11px] mt-4 pt-4 leading-relaxed"
                style={{ color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)' }}
              >
                {t(HOURS_NOTE_KEY)}
              </p>
            </div>

            {/* Location */}
            <div
              className="rounded-2xl p-5"
              style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}
            >
              <div className="flex items-center gap-2.5 mb-3">
                <MapPin size={17} strokeWidth={1.8} style={{ color: 'var(--accent)' }} />
                <h2 className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>
                  {t('contactPage.whereWeAre')}
                </h2>
              </div>

              <p className="text-sm font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                {ADDRESS.city}
              </p>
              <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
                {t(ADDRESS.provinceKey)}, {t(ADDRESS.countryKey)}
              </p>

              <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                {t('contactPage.locationDesc')}
              </p>
            </div>

            {/* Socials */}
            <div
              className="rounded-2xl p-5"
              style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}
            >
              <div className="flex items-center gap-2.5 mb-4">
                <MessageCircle size={17} strokeWidth={1.8} style={{ color: 'var(--accent)' }} />
                <h2 className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>
                  {t('contactPage.socialMedia')}
                </h2>
              </div>

              <div className="space-y-2.5">
                {SOCIALS.map((s) => {
                  const Icon = SOCIAL_ICON[s.key] || MessageCircle;
                  return (
                    <a
                      key={s.key}
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="paz-social-row flex items-center gap-3 p-2.5 rounded-xl transition-colors"
                      style={{ border: '1px solid var(--border-color)' }}
                    >
                      <span
                        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: 'var(--bg-surface-alt)', color: 'var(--text-secondary)' }}
                      >
                        <Icon size={15} />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>
                          {s.label}
                        </span>
                        <span className="block text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>
                          {s.handle}
                        </span>
                      </span>
                      <ArrowRight size={14} className="ml-auto shrink-0" style={{ color: 'var(--text-muted)' }} />
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ══════════ Masla kis qism ka ══════════ */}
        <div className="mb-14">
          <h2
            className="text-xl sm:text-2xl font-black tracking-tight mb-1.5 flex items-center gap-2.5"
            style={{ color: 'var(--text-primary)' }}
          >
            <span className="w-1 h-6 rounded-full" style={{ background: 'var(--accent)' }} />
            {t('contactPage.issueTypeTitle')}
          </h2>
          <p className="text-sm mb-6 pl-4" style={{ color: 'var(--text-muted)' }}>
            {t('contactPage.issueTypeSubtitle')}
          </p>

          <div className="grid sm:grid-cols-2 gap-4">
            {HELP_TOPICS.map(({ icon: Icon, titleKey, bodyKey, action }) => (
              <div
                key={titleKey}
                className="rounded-2xl p-5 flex flex-col"
                style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}
              >
                <div className="flex items-start gap-3 mb-3">
                  <span
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(232,184,75,0.10)' }}
                  >
                    <Icon size={16} strokeWidth={1.8} style={{ color: 'var(--accent)' }} />
                  </span>
                  <div className="min-w-0">
                    <p className="font-bold text-sm leading-tight" style={{ color: 'var(--text-primary)' }}>
                      {t(titleKey)}
                    </p>
                    <p className="text-xs mt-1.5 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      {t(bodyKey)}
                    </p>
                  </div>
                </div>

                <Link
                  href={action.href}
                  className="mt-auto inline-flex items-center gap-1.5 text-xs font-bold self-start"
                  style={{ color: 'var(--accent)' }}
                >
                  {t(action.labelKey)} <ArrowRight size={13} />
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* ══════════ FAQ ══════════ */}
        <div>
          <h2
            className="text-xl sm:text-2xl font-black tracking-tight mb-6 flex items-center gap-2.5"
            style={{ color: 'var(--text-primary)' }}
          >
            <span className="w-1 h-6 rounded-full" style={{ background: 'var(--accent)' }} />
            {t('contactPage.faqTitle')}
          </h2>

          <div className="space-y-3">
            {FAQS.map((f) => (
              <details
                key={f.qKey}
                className="group rounded-xl overflow-hidden"
                style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}
              >
                <summary
                  className="flex items-center gap-3 px-5 py-4 cursor-pointer list-none text-sm font-bold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  <HelpCircle size={15} className="shrink-0" style={{ color: 'var(--accent)' }} />
                  <span className="flex-1">{t(f.qKey)}</span>
                  <span
                    className="shrink-0 transition-transform duration-200 group-open:rotate-45 text-lg leading-none"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    +
                  </span>
                </summary>
                <p
                  className="px-5 pb-4 pl-[3.1rem] text-sm leading-relaxed"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {t(f.aKey)}
                </p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}