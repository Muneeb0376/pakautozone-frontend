//frontend/app/verify-email/page.jsx//
'use client';
// ✅ PHASE 5 — Ye page pehle bilkul maujood hi nahi tha. Backend
// (auth.controller.js) email me hamesha ye link bhejta tha:
//   `${FRONTEND_URL}/verify-email?token=...`
// lekin frontend me `/verify-email` route hi nahi tha — user click karta
// tha to seedha 404. Isi wajah se koi bhi email/password user kabhi
// verify hi nahi ho pata tha, chahe SMTP perfect kaam kar raha ho.
//
// Flow: token query param se uthao → backend GET /api/auth/verify-email
// ko call karo → success/fail dikhao → agar user isi browser me already
// login hai to uska local isVerified flag bhi turant refresh kar do
// (getMe() call se) taake use logout/login na karna pare.

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, XCircle, Loader2, Mail } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useLang } from '@/lib/i18nContext';

function VerifyEmailInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const { isAuthenticated, updateUser } = useAuthStore();
  const { t } = useLang();

  const [status, setStatus] = useState('checking'); // 'checking' | 'success' | 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage(t('auth.verificationTokenMissing'));
      return;
    }

    (async () => {
      try {
        const data = await api.get(`/auth/verify-email?token=${encodeURIComponent(token)}`);
        if (data.success) {
          setStatus('success');
          setMessage(data.message || t('auth.accountVerified'));

          // ✅ Agar user isi browser me pehle se logged in hai, uska local
          // state bhi turant refresh kar do — warna wo dashboard par wapis
          // jaake bhi "unverified" hi dikhega jab tak dobara login na kare.
          if (isAuthenticated) {
            try {
              const me = await api.get('/auth/me');
              if (me?.success && me?.user) {
                updateUser({ isVerified: me.user.isVerified });
              }
            } catch {
              // silent — refresh fail ho bhi jaye to verification khud ho chuki hai,
              // sirf agli baar login karne par flag sync ho jayega
            }
          }
        } else {
          setStatus('error');
          setMessage(data.message || t('auth.verificationFailed'));
        }
      } catch (err) {
        setStatus('error');
        setMessage(err?.response?.data?.message || t('auth.linkExpired'));
      }
    })();
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--bg-page)' }}>
      <div
        className="w-full max-w-md p-8 rounded-3xl border shadow-2xl text-center"
        style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)' }}
      >
        {status === 'checking' && (
          <>
            <div className="w-16 h-16 rounded-full bg-blue-500/15 flex items-center justify-center mx-auto mb-5">
              <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
            </div>
            <h1 className="text-xl font-extrabold mb-2" style={{ color: 'var(--text-primary)' }}>
              {t('auth.verifying')}
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t('common.loading')}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
            <h1 className="text-xl font-extrabold mb-2" style={{ color: 'var(--text-primary)' }}>
              {t('auth.accountVerified')}
            </h1>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>{message}</p>
            <button
              onClick={() => router.push(isAuthenticated ? '/dashboard' : '/login')}
              className="w-full py-3.5 font-bold text-white rounded-xl text-sm transition-all"
              style={{ background: 'linear-gradient(to right, #3b82f6, #22d3ee)' }}
            >
              {isAuthenticated ? t('nav.goToDashboard') : t('nav.login')}
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 rounded-full bg-red-500/15 flex items-center justify-center mx-auto mb-5">
              <XCircle className="w-8 h-8 text-red-400" />
            </div>
            <h1 className="text-xl font-extrabold mb-2" style={{ color: 'var(--text-primary)' }}>
              {t('auth.verificationFailed')}
            </h1>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>{message}</p>
            <div className="flex flex-col gap-2.5">
              {isAuthenticated && (
                <button
                  onClick={() => router.push('/verify-account')}
                  className="w-full py-3.5 font-bold text-white rounded-xl text-sm transition-all"
                  style={{ background: 'linear-gradient(to right, #3b82f6, #22d3ee)' }}
                >
                  <Mail size={15} className="inline mr-1.5 -mt-0.5" />
                  {t('auth.resendVerification')}
                </button>
              )}
              <button
                onClick={() => router.push('/login')}
                className="w-full py-3.5 font-bold rounded-xl border transition-all text-sm"
                style={{ background: 'var(--bg-surface-alt)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
              >
                {t('nav.login')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ✅ useSearchParams Suspense boundary maangta hai Next.js App Router mein
export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailInner />
    </Suspense>
  );
}