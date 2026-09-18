'use client';
// frontend/components/ui/LoginWarningModal.jsx
//
// ✅ POORI FILE REPLACE — Phase 5
//
// ══ MASLA ══
// Ye modal purane safhon par bhej raha tha:
//
//     <Link href="/login">{t('nav.signIn')}</Link>
//     <Link href="/register">{t('nav.register')}</Link>
//
// Yehi wo raasta tha jis se log purane form par pohanch jate thay.
// Saath hi poori file `bg-white`, `text-gray-900`, `bg-blue-600` par
// hard-code thi — dark theme mein safed dabba nikal aata tha.
//
// ══ AB ══
// Ye khud AuthModal khol deta hai. Ek hi login system, ek hi shakal.
// Aur poora theme tokens par — light/dark dono theek.
//
// Istemal pehle jaisa hi hai, koi change nahi:
//
//     <LoginWarningModal isOpen={x} onClose={() => setX(false)} />
//
// Naye (optional) props:
//     message      — apni marzi ka text
//     redirectAfter — login ke baad kahan bhejna hai

import { useState } from 'react';
import { ShieldAlert, X } from 'lucide-react';
import AuthModal from '@/components/auth/AuthModal';
import { useLang } from '@/lib/i18nContext';

export default function LoginWarningModal({
  isOpen,
  onClose,
  message,
  redirectAfter,
}) {
  const { t } = useLang();
  const [showAuth, setShowAuth] = useState(false);

  // Default message hook ke baad banta hai — module scope mein t() nahi
  // chal sakta, is liye prop khali ho to yahan bhara jata hai.
  const text = message || t('auth.loginPrompt');

  // AuthModal khul gaya to warning chhupa do — do modal ek saath
  // ek doosre ke upar bohat bhadde lagte hain
  if (showAuth) {
    return (
      <AuthModal
        message={text}
        redirectAfter={redirectAfter}
        onClose={() => {
          setShowAuth(false);
          onClose?.();
        }}
      />
    );
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />

      <div
        className="relative w-full max-w-sm rounded-2xl p-6 text-center"
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--border-color)',
          boxShadow: '0 30px 70px -20px rgba(0,0,0,0.55)',
        }}
      >
        <button
          onClick={onClose}
          aria-label={t('common.close')}
          className="absolute top-3 right-3 p-1.5 rounded-lg transition-opacity hover:opacity-70"
          style={{ color: 'var(--text-muted)' }}
        >
          <X size={16} />
        </button>

        <span
          className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl"
          style={{ background: 'rgba(232,184,75,0.12)' }}
        >
          <ShieldAlert size={22} strokeWidth={1.8} style={{ color: 'var(--accent)' }} />
        </span>

        <h3 className="text-lg font-black mb-2" style={{ color: 'var(--text-primary)' }}>
          {t('auth.loginTitle')}
        </h3>
        <p className="text-sm mb-6 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          {message}
        </p>

        <div className="flex flex-col gap-2.5">
          {/* ✅ Ab /login par nahi bhejta — wahi AuthModal kholta hai */}
          <button
            onClick={() => setShowAuth(true)}
            className="w-full h-11 rounded-xl text-sm font-bold transition-transform active:scale-[0.98]"
            style={{
              background: 'var(--accent)',
              color: 'var(--accent-text)',
              boxShadow: '0 8px 20px -8px rgba(232,184,75,0.55)',
            }}
          >
            {t('auth.signInSignUp')}
          </button>

          <button
            onClick={onClose}
            className="w-full h-10 text-xs font-semibold transition-opacity hover:opacity-70"
            style={{ color: 'var(--text-muted)' }}
          >
            {t('auth.notNow')}
          </button>
        </div>
      </div>
    </div>
  );
}