//frontend/app/verify-account/page.jsx//
'use client';
// ✅ PHASE 5 — Ye page pehle bilkul maujood nahi tha, sirf
// register-showroom/page.jsx me ek `VERIFY_ROUTE = '/verify-account'`
// constant reserved tha jo kabhi kisi real page ki taraf point nahi karta
// tha. Ye "check your inbox + resend" landing screen hai — koi token URL
// me nahi hota, sirf logged-in user ko nudge karta hai apna email verify
// karne ke liye (asal verification `/verify-email?token=...` link se hoti
// hai, jo user ke inbox me jaata hai).

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, ShieldCheck, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useLang } from '@/lib/i18nContext';

const RESEND_COOLDOWN_SEC = 60;

export default function VerifyAccountPage() {
  const router = useRouter();
  const { user, isAuthenticated, _hasHydrated } = useAuthStore();
  const { t } = useLang();

  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState(''); // 'success' | 'error'
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!isAuthenticated || !user) {
      router.replace('/login?redirect=/verify-account');
    }
  }, [_hasHydrated, isAuthenticated, user, router]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const handleResend = async () => {
    if (sending || cooldown > 0) return;
    setSending(true);
    setMsg('');
    try {
      const data = await api.post('/auth/resend-verification');
      if (data.success) {
        setMsgType('success');
        setMsg(data.alreadyVerified ? data.message : (data.message || t('auth.verificationLinkSent')));
        setCooldown(RESEND_COOLDOWN_SEC);
      } else {
        setMsgType('error');
        setMsg(data.message || t('common.somethingWrong'));
      }
    } catch (err) {
      setMsgType('error');
      setMsg(err?.response?.data?.message || t('auth.verificationSendFailed'));
    } finally {
      setSending(false);
    }
  };

  if (!_hasHydrated || !isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-page)' }}>
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    );
  }

  // ✅ Agar user already verified hai (e.g. dobara is page pe aa gaya),
  // seedha confusing "verify karein" screen dikhane ke bajaye clear
  // confirmation + wapis jaane ka option do.
  if (user.isVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--bg-page)' }}>
        <div
          className="w-full max-w-md p-8 rounded-3xl border shadow-2xl text-center"
          style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)' }}
        >
          <div className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-5">
            <ShieldCheck className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-xl font-extrabold mb-2" style={{ color: 'var(--text-primary)' }}>
            {t('auth.alreadyVerified')}
          </h1>
          <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
            {t('auth.verifiedContinue')}
          </p>
          <button
            onClick={() => router.back()}
            className="w-full py-3.5 font-bold text-white rounded-xl text-sm transition-all"
            style={{ background: 'linear-gradient(to right, #3b82f6, #22d3ee)' }}
          >
            {t('common.goBack')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--bg-page)' }}>
      <div
        className="w-full max-w-md p-8 rounded-3xl border shadow-2xl text-center"
        style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)' }}
      >
        <div className="w-16 h-16 rounded-full bg-amber-500/15 flex items-center justify-center mx-auto mb-5">
          <Mail className="w-8 h-8 text-amber-400" />
        </div>
        <h1 className="text-xl font-extrabold mb-2" style={{ color: 'var(--text-primary)' }}>
          {t('auth.verifyEmail')}
        </h1>
        <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
          {t('auth.verificationSentTo')} <strong style={{ color: 'var(--text-primary)' }}>{user.email}</strong>.
        </p>
        <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
          {t('auth.checkInbox')}
        </p>

        {msg && (
          <div
            className={`mb-5 p-3 rounded-xl text-sm border ${
              msgType === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}
          >
            {msg}
          </div>
        )}

        <button
          onClick={handleResend}
          disabled={sending || cooldown > 0}
          className="w-full py-3.5 font-bold text-white rounded-xl text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          style={{ background: 'linear-gradient(to right, #3b82f6, #22d3ee)' }}
        >
          {sending && <Loader2 size={16} className="animate-spin" />}
          {cooldown > 0
            ? `${t('auth.resendVerification')} (${cooldown}s)`
            : t('auth.resendVerificationEmail')}
        </button>

        <button
          onClick={() => router.back()}
          className="w-full py-3.5 mt-2.5 font-bold rounded-xl border transition-all text-sm"
          style={{ background: 'var(--bg-surface-alt)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
        >
          {t('common.goBack')}
        </button>
      </div>
    </div>
  );
}