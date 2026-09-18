'use client';
import { useLang } from '@/lib/i18nContext';
// frontend/components/contact/ContactForm.jsx
//
// ✅ NAYI FILE — Phase 5
//
// ══ AAP NE JO KAHA ══
// "Contact wale mein email wala option nahi chal raha — us par click
//  karo to nahi ja raha. Jab user us par click kare to koi bhi message
//  bheje to wo hamare paas email par aa jaye."
//
// ══ MASLA ══
// Purana button `mailto:pakautozone.inc@gmail.com` tha. `mailto:` tabhi
// chalta hai jab computer par koi mail app (Outlook waghera) laga ho.
// Zyada tar log Gmail browser mein use karte hain — un par click karne
// se kuch hota hi nahi, ya "is link ko kholne wali koi app nahi mili"
// ka error aata hai. Mobile par bhi aksar khali Gmail app khul jati hai
// bagair kisi text ke.
//
// ══ HAL ══
// Asli form. User bhare, submit kare — message SEEDHA aap ke Gmail
// inbox mein. Koi mail app ki zarurat nahi, koi click gum nahi hota.
//
// ⚠️ Backend chahiye: `POST /api/contact`
//    (backend/src/controllers/contact.controller.js + routes)
//    Aur `.env` mein GMAIL_USER + GMAIL_APP_PASSWORD.
//
// Form khud se validate karta hai (naam, raabta ka zariya, message ki
// lambai) taake server tak bekaar request na jaye — lekin backend bhi
// wahi checks dobara karta hai, kyunke browser ka check bypass kiya ja
// sakta hai.

import { useState } from 'react';
import { Send, Loader2, CheckCircle2, AlertTriangle, User, Mail, Phone, MessageSquare } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || '/api';

const TOPICS = [
  { value: 'general', labelKey: 'contactForm.topic.general' },
  { value: 'listing', labelKey: 'contactForm.topic.listing' },
  { value: 'payment', labelKey: 'contactForm.topic.payment' },
  { value: 'showroom', labelKey: 'contactForm.topic.showroom' },
  { value: 'report', labelKey: 'contactForm.topic.report' },
  { value: 'other', labelKey: 'contactForm.topic.other' },
];

const fieldStyle = {
  background: 'var(--bg-surface-alt)',
  border: '1px solid var(--border-color)',
  color: 'var(--text-primary)',
};

export default function ContactForm() {
  const { t } = useLang();
  const [form, setForm] = useState({
    name: '', email: '', phone: '', topic: 'general', message: '',
    website: '', // honeypot — screen par nazar nahi aata
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) return setError(t('contactForm.errName'));
    if (!form.email.trim() && !form.phone.trim()) {
      return setError(t('contactForm.errContact'));
    }
    if (form.message.trim().length < 10) {
      return setError(t('contactForm.errMessage'));
    }

    setSending(true);
    setError('');

    try {
      const res = await fetch(`${API}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || t('contact.error'));
      }
      setSent(true);
    } catch (err) {
      setError(err.message || t('contactForm.errNetwork'));
      setSending(false);
    }
  };

  /* ══ Bhej diya ══ */
  if (sent) {
    return (
      <div
        className="rounded-2xl p-8 text-center"
        style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}
      >
        <span
          className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: 'rgba(5,150,105,0.10)' }}
        >
          <CheckCircle2 size={26} style={{ color: '#059669' }} />
        </span>

        <h3 className="font-black text-lg mb-2" style={{ color: 'var(--text-primary)' }}>
          {t('contact.messageSent')}
        </h3>
        <p className="text-sm mb-6 leading-relaxed max-w-sm mx-auto" style={{ color: 'var(--text-secondary)' }}>
          {t('contact.messageSentBody', { name: form.name.split(' ')[0] })}
        </p>

        <button
          type="button"
          onClick={() => {
            setSent(false);
            setSending(false);
            setForm({ name: '', email: '', phone: '', topic: 'general', message: '', website: '' });
          }}
          className="h-10 px-5 rounded-xl text-sm font-bold"
          style={{ border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
        >
          {t('contactForm.sendAnother')}
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl p-5 sm:p-6 space-y-4"
      style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--card-shadow)',
      }}
    >
      <div>
        <h3 className="font-black text-base" style={{ color: 'var(--text-primary)' }}>{t('seller.sendMessage')}</h3>
        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
          {t('contactForm.subtitle')}
        </p>
      </div>

      {error && (
        <div
          className="flex items-start gap-2.5 rounded-xl px-3.5 py-3"
          style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.22)' }}
        >
          <AlertTriangle size={15} className="shrink-0 mt-0.5" style={{ color: '#dc2626' }} />
          <p className="text-xs font-medium" style={{ color: '#dc2626' }}>{error}</p>
        </div>
      )}

      {/* Honeypot — asli user ise kabhi nahi dekhta, bots bhar dete hain.
          `display:none` ki bajaye off-screen, kyunke kuch bots hidden
          fields chhorh dete hain lekin off-screen ko nahi pehchante. */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        value={form.website}
        onChange={(e) => set('website', e.target.value)}
        style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }}
      />

      <Field Icon={User} label={t('contactForm.nameLabel')} required>
        <input
          type="text"
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          placeholder={t('auth.fullName')}
          className="w-full h-11 rounded-xl pl-11 pr-3 text-sm outline-none"
          style={fieldStyle}
        />
      </Field>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field Icon={Mail} label={t('common.email')}>
          <input
            type="email"
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            placeholder="aap@email.com"
            className="w-full h-11 rounded-xl pl-11 pr-3 text-sm outline-none"
            style={fieldStyle}
          />
        </Field>

        <Field Icon={Phone} label={t('contactForm.phoneLabel')}>
          <input
            type="tel"
            inputMode="tel"
            value={form.phone}
            onChange={(e) => set('phone', e.target.value)}
            placeholder="0300 1234567"
            className="w-full h-11 rounded-xl pl-11 pr-3 text-sm outline-none font-mono"
            style={fieldStyle}
          />
        </Field>
      </div>

      <p className="text-[11px] -mt-1" style={{ color: 'var(--text-muted)' }}>
        {t('contactForm.contactHint')}
      </p>

      <div>
        <label className="block text-[11px] font-bold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-muted)' }}>
          {t('contactForm.topicLabel')}
        </label>
        <select
          value={form.topic}
          onChange={(e) => set('topic', e.target.value)}
          className="w-full h-11 rounded-xl px-3.5 text-sm outline-none cursor-pointer"
          style={fieldStyle}
        >
          {TOPICS.map((opt) => <option key={opt.value} value={opt.value}>{t(opt.labelKey)}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-[11px] font-bold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-muted)' }}>{t('exchange.message')}<span style={{ color: 'var(--accent)' }}>*</span>
        </label>
        <textarea
          rows={5}
          value={form.message}
          onChange={(e) => set('message', e.target.value)}
          placeholder={t('contactForm.messagePh')}
          className="w-full rounded-xl p-3.5 text-sm outline-none resize-none leading-relaxed"
          style={fieldStyle}
        />
        <p className="text-[11px] mt-1.5 text-right" style={{ color: 'var(--text-muted)' }}>
          {form.message.trim().length} / 4000
        </p>
      </div>

      <button
        type="submit"
        disabled={sending}
        className="w-full h-12 rounded-xl flex items-center justify-center gap-2 text-sm font-bold disabled:opacity-50 transition-transform active:scale-[0.99]"
        style={{
          background: 'var(--accent)',
          color: 'var(--accent-text)',
          boxShadow: '0 8px 22px -8px rgba(232,184,75,0.55)',
        }}
      >
        {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={15} />}
        {sending ? t('contactForm.sending') : t('contactForm.send')}
      </button>

      <p className="text-[11px] text-center leading-relaxed" style={{ color: 'var(--text-muted)' }}>
        {t('contactForm.privacyNote')}
      </p>
    </form>
  );
}

function Field({ Icon, label, required, children }) {
  return (
    <div>
      <label className="block text-[11px] font-bold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-muted)' }}>
        {label}
        {required && <span style={{ color: 'var(--accent)' }}> *</span>}
      </label>
      <div className="relative">
        <Icon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
        {children}
      </div>
    </div>
  );
}