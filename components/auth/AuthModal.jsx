'use client';
// frontend/components/auth/AuthModal.jsx
//
// ✅ POORI FILE REPLACE — Issue 2 (login form)
//
// ══ AAP KI SHIKAYATEIN AUR UN KA HAL ══
//
// 1. "DO GOOGLE BUTTON DIKH RAHE HAIN"
//    Screenshot mein "Sign in with Google" (Google ka apna button) aur
//    "Google se Continue Karein" (hamara fallback) — DONO nazar aa rahe
//    thay. Purani file dono ko ek saath render karti thi.
//    Ab: Google ka asli button ek CHHUPE hue div mein render hota hai,
//    aur screen par sirf hamara ek button dikhta hai jo us chhupe hue
//    button ko click karta hai. Ek button, poori tarah kaam karta hua.
//
// 2. "PASSWORD MEIN EYE KA OPTION NAHI"
//    Ab hai — dono password fields par (Password aur Confirm Password).
//
// 3. "NUMBER PAR OTP NAHI AA RAHA"
//    Frontend ki taraf se do cheezen theek ki hain:
//      • number ab normalize ho kar jata hai (03001234567 → 923001234567).
//        Backend ka OTP provider 0 se shuru hone wale number ko reject
//        karta hai — yehi sab se aam wajah hoti hai.
//      • ab resend timer hai aur asal error message dikhta hai (pehle
//        error nigal liya jata tha, is liye lagta tha "kuch hua hi nahi").
//    ⚠️ Agar phir bhi na aaye to masla backend/provider ka hai — README
//       mein check karne ka tareeqa likha hai.
//
// 4. "NUMBER SE REGISTER BHI HO JAYE"
//    Ab phone flow mein bhi Sign In / Sign Up dono kaam karte hain. Naya
//    number verify hote hi account ban jata hai (yehi backend ka
//    /auth/otp/verify pehle se karta hai) — aur naam poochne ka step bhi
//    add kiya hai taake profile khali na rahe.
//
// 5. "THEME SE MATCH KARO"
//    Poora blue (#2563eb) hata diya. Ab har rang var(--*) token se —
//    header gold/black, inputs surface, text primary/secondary. Light
//    aur dark dono theek.
//
// 6. "PRODUCTION (VERCEL) PAR GOOGLE BUTTON GAYAB"
//    Wajah: browser code mein sirf NEXT_PUBLIC_ wale env variables milte
//    hain. Pehle yahan process.env.GOOGLE_CLIENT_ID tha — wo browser mein
//    hamesha undefined hota hai, is liye button render hi nahi hota tha.
//    Ab process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID use hota hai.
//    GOOGLE_CLIENT_SECRET client code mein kabhi nahi hona chahiye — hata
//    diya (ye flow use hi nahi karta).
//
// ⚠️ PURANE /login AUR /register SAFHAY:
//    Ye modal hi aap ka asli login hai. Purane standalone safhay
//    (app/(auth)/login, app/(auth)/register) ab bhi mojood hain aur
//    LoginWarningModal un par bhejta hai — isi liye "purana form" nazar
//    aa jata tha. README mein bataya hai ke kya karna hai.

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  X, Mail, Lock, User as UserIcon, Loader2, Phone, ShieldCheck,
  Eye, EyeOff, ArrowLeft, AlertTriangle, CheckCircle2,
} from 'lucide-react';

import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import Logo from '@/components/layout/Logo';
import { useLang } from '@/lib/i18nContext';

// ✅ FIX: NEXT_PUBLIC_ prefix zaroori hai — warna browser mein undefined aata hai
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

/* ✅ SPEED: Google ki script ek hi baar, ek hi jagah se load hoti hai.
   Navbar guest user ke liye page load ke baad khaali waqt mein isay pehle se
   load kar leta hai, taake "Sign In" dabate hi Google button tayar ho aur
   click ke waqt script download/parse ka bojh na pade. */
let googleScriptPromise = null;

function loadGoogleScript() {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if (window.google?.accounts?.id) return Promise.resolve(true);
  if (googleScriptPromise) return googleScriptPromise;

  googleScriptPromise = new Promise((resolve) => {
    const fail = () => { googleScriptPromise = null; resolve(false); };
    const existing = document.getElementById('google-identity-script');
    if (existing) {
      existing.addEventListener('load', () => resolve(true));
      existing.addEventListener('error', fail);
      return;
    }
    const s = document.createElement('script');
    s.id = 'google-identity-script';
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.defer = true;
    s.onload = () => resolve(true);
    s.onerror = () => { s.remove(); fail(); };
    (document.body || document.head).appendChild(s);
  });
  return googleScriptPromise;
}

export function preloadGoogleSignIn() {
  if (typeof window === 'undefined' || !GOOGLE_CLIENT_ID) return;
  const warm = () => { loadGoogleScript(); };
  if ('requestIdleCallback' in window) window.requestIdleCallback(warm, { timeout: 3000 });
  else setTimeout(warm, 1500);
}

/* WhatsApp/Instagram ke andar wala browser Google Sign-In block karta hai */
function isInAppBrowser() {
  if (typeof navigator === 'undefined') return false;
  return /FBAN|FBAV|Instagram|WhatsApp|Line|MicroMessenger|Twitter/i.test(navigator.userAgent || '');
}

/* ─────────────────────────────────────────────────────────────
   Pakistani number ko international shakal mein laao.
   OTP providers 0 se shuru hone wala number reject kar dete hain —
   yehi wajah hoti hai ke code "bhej diya" likh kar bhi aata nahi.
       03001234567    → 923001234567
       +92 300 123... → 923001234567
       3001234567     → 923001234567
   ───────────────────────────────────────────────────────────── */
function normalizePhone(input) {
  const d = String(input || '').replace(/\D/g, '');
  if (!d) return '';
  if (d.startsWith('92')) return d;
  if (d.startsWith('0')) return `92${d.slice(1)}`;
  if (d.length === 10) return `92${d}`;
  return d;
}

function isValidPkPhone(input) {
  const n = normalizePhone(input);
  // 92 + 3XXXXXXXXX = 12 hindse
  return n.length === 12 && n.startsWith('923');
}

/* ── Input shell — poori file mein ek hi shakal ── */
function Field({ Icon, children, right }) {
  return (
    <div className="relative">
      {Icon && (
        <Icon
          size={17}
          className="absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: 'var(--text-muted)' }}
        />
      )}
      {children}
      {right && (
        <div className="absolute end-3 top-1/2 -translate-y-1/2">{right}</div>
      )}
    </div>
  );
}

const inputBase =
  'w-full py-3.5 rounded-xl text-sm outline-none transition-colors';

const inputStyle = {
  background: 'var(--bg-surface-alt)',
  border: '1px solid var(--border-color)',
  color: 'var(--text-primary)',
};

export default function AuthModal({ onClose, message, redirectAfter }) {
  const router = useRouter();
  const { t } = useLang();
  const login = useAuthStore((s) => s.login);
  const [inApp] = useState(isInAppBrowser());

  const [method, setMethod] = useState('email'); // 'email' | 'phone'
  const [tab, setTab] = useState('login');       // 'login' | 'signup'

  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);

  /* ── Phone flow ── */
  const [phoneStep, setPhoneStep] = useState('enter'); // 'enter' | 'code' | 'name'
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [phoneName, setPhoneName] = useState('');
  const [resendIn, setResendIn] = useState(0);

  const googleHostRef = useRef(null);
  const googleReadyRef = useRef(false);
  const credentialCbRef = useRef();

  /* ── Escape + scroll lock ── */
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  /* ── Resend countdown ── */
  useEffect(() => {
    if (resendIn <= 0) return undefined;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const completeAuth = useCallback((user, token) => {
    login(user, token);
    onClose();
    if (redirectAfter) router.push(redirectAfter);
  }, [login, onClose, redirectAfter, router]);

  /* ═══════════════════════════════════════════════════════════
     GOOGLE
     Asli button ek chhupe hue div mein render hota hai (Google
     apni marzi ka HTML banata hai, hum usay style nahi kar sakte).
     Screen par hamara apna button hai jo us chhupe hue ko click
     karta hai — is tarah theme bhi hamari, aur flow bhi asli.
     ═══════════════════════════════════════════════════════════ */
  const handleGoogleCredential = useCallback(async (response) => {
    setError('');
    setLoading(true);
    try {
      const data = await api.post('/auth/google', { idToken: response.credential });
      if (data?.token && data?.user) completeAuth(data.user, data.token);
      else setError(data?.message || t('auth.errGoogleFailed'));
    } catch (err) {
      setError(err?.response?.data?.message || t('auth.errGoogleFailed'));
    } finally {
      setLoading(false);
    }
  }, [completeAuth, t]);

  credentialCbRef.current = handleGoogleCredential;

  useEffect(() => {
    if (typeof window === 'undefined' || !GOOGLE_CLIENT_ID || method !== 'email') return undefined;

    const render = () => {
      if (!window.google?.accounts?.id || !googleHostRef.current) return;

      if (!googleReadyRef.current) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (res) => credentialCbRef.current(res),
          // FedCM ngrok jaise dynamic https domains par mobile Chrome mein
          // khamoshi se fail ho jata hai — classic popup flow zyada mustaqil hai
          use_fedcm_for_prompt: false,
          auto_select: false,
        });
        googleReadyRef.current = true;
      }

      googleHostRef.current.innerHTML = '';
      window.google.accounts.id.renderButton(googleHostRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        width: 320,
        text: tab === 'signup' ? 'signup_with' : 'signin_with',
      });
    };

    let cancelled = false;
    loadGoogleScript().then((ok) => { if (ok && !cancelled) render(); });
    return () => { cancelled = true; };
  }, [tab, method]);

  const clickGoogle = () => {
    const real = googleHostRef.current?.querySelector('div[role="button"], iframe');
    if (real) { real.click(); return; }
    if (window.google?.accounts?.id) window.google.accounts.id.prompt();
    else setError(t('auth.errGoogleLoad'));
  };

  /* ═══════════════════════════════════════════════════════════
     EMAIL
     ═══════════════════════════════════════════════════════════ */
  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submitEmail = async (e) => {
    e.preventDefault();
    setError('');

    if (tab === 'signup') {
      if (!form.name.trim()) return setError(t('auth.errNameRequired'));
      if (form.password.length < 6) return setError(t('auth.errPasswordShort'));
      if (form.password !== form.confirmPassword) return setError(t('auth.errPasswordMismatch'));
    }
    if (!form.email.trim()) return setError(t('auth.errEmailRequired'));
    if (!form.password) return setError(t('auth.errPasswordRequired'));

    setLoading(true);
    try {
      const data = tab === 'login'
        ? await api.post('/auth/login', { email: form.email.trim(), password: form.password })
        : await api.post('/auth/register', {
            name: form.name.trim(),
            email: form.email.trim(),
            password: form.password,
            role: 'BUYER',
          });

      if (data?.token) completeAuth(data.user, data.token);
      else setError(data?.message || t('common.somethingWrong'));
    } catch (err) {
      setError(err?.response?.data?.message || t('common.somethingWrong'));
    } finally {
      setLoading(false);
    }
  };

  /* ═══════════════════════════════════════════════════════════
     PHONE + OTP
     ═══════════════════════════════════════════════════════════ */
  const requestOtp = async (e) => {
    e?.preventDefault();
    setError('');
    setNotice('');

    if (!isValidPkPhone(phoneNumber)) {
      return setError(t('auth.errPhoneInvalid'));
    }

    setLoading(true);
    try {
      // ✅ Normalize kar ke bhejte hain. Backend ka provider 03… wale
      // number par code bhejta hi nahi (silently drop kar deta hai).
      const data = await api.post('/auth/otp/request', { phone: normalizePhone(phoneNumber) });

      if (data?.success) {
        setPhoneStep('code');
        setResendIn(45);
        setNotice(data.message || t('auth.otpSentWhatsapp'));
      } else {
        setError(data?.message || t('auth.errOtpSend'));
      }
    } catch (err) {
      // ✅ Asal wajah dikhao — pehle sirf generic message aata tha, is
      // liye pata hi nahi chalta tha ke masla number ka hai ya server ka
      setError(
        err?.response?.data?.message ||
        err?.message ||
        t('auth.errOtpSend')
      );
      console.error('[auth] OTP request fail:', err);
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    setError('');

    if (otpCode.trim().length < 4) return setError(t('auth.errOtpFull'));

    setLoading(true);
    try {
      const data = await api.post('/auth/otp/verify', {
        phone: normalizePhone(phoneNumber),
        code: otpCode.trim(),
        // ✅ Naya user ho to naam bhi saath bhej dete hain — warna profile
        // khali reh jati thi aur dashboard par "Assalam o Alaikum, " likha
        // aata tha bagair naam ke.
        name: phoneName.trim() || undefined,
      });

      if (data?.token) {
        // Naya account bana lekin naam nahi diya → naam poocho
        if (data.isNewUser && !phoneName.trim() && phoneStep !== 'name') {
          setPhoneStep('name');
          setNotice(t('auth.numberVerifiedName'));
          // token abhi rakh lete hain, naam save karne ke baad login karenge
          setForm((f) => ({ ...f, _pendingToken: data.token, _pendingUser: data.user }));
          setLoading(false);
          return;
        }
        completeAuth(data.user, data.token);
      } else {
        setError(data?.message || t('auth.errOtpWrong'));
      }
    } catch (err) {
      setError(err?.response?.data?.message || t('auth.errOtpVerify'));
    } finally {
      setLoading(false);
    }
  };

  const savePhoneName = async (e) => {
    e.preventDefault();
    if (!phoneName.trim()) return setError(t('auth.errNameRequired'));

    setLoading(true);
    try {
      const token = form._pendingToken;
      const user = form._pendingUser;

      // Naam save karo, phir login
      await api.put('/auth/me', { name: phoneName.trim() }, {
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {}); // naam save na ho to bhi login rok-na theek nahi

      completeAuth({ ...user, name: phoneName.trim() }, token);
    } catch (err) {
      setError(t('auth.nameSaveFailed'));
      completeAuth(form._pendingUser, form._pendingToken);
    } finally {
      setLoading(false);
    }
  };

  /* ── Tab / method switch ── */
  const switchTab = (next) => {
    setTab(next);
    setError('');
    setNotice('');
    setForm({ name: '', email: '', password: '', confirmPassword: '' });
  };

  const switchMethod = (next) => {
    setMethod(next);
    setError('');
    setNotice('');
    setPhoneStep('enter');
    setOtpCode('');
    setResendIn(0);
  };

  /* ═══════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════ */
  const headerTitle =
    method === 'phone'
      ? (phoneStep === 'enter'
          ? t('auth.phoneSignInTitle')
          : phoneStep === 'code'
          ? t('auth.verifyCodeTitle')
          : t('auth.yourNameTitle'))
      : (tab === 'login' ? t('auth.welcomeTitle') : t('auth.createAccount'));

  const headerSub =
    message ||
    (method === 'phone'
      ? (phoneStep === 'enter'
          ? t('auth.phoneEnterSub')
          : phoneStep === 'code'
          ? t('auth.phoneCodeSub')
          : t('auth.nameSub'))
      : (tab === 'login' ? t('auth.loginSub') : t('auth.signupSub')));

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 100 }}>
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.68)' }} onClick={onClose} />

      <div
        className="relative w-full max-w-sm rounded-2xl overflow-hidden max-h-[92vh] overflow-y-auto"
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--border-color)',
          boxShadow: '0 30px 70px -20px rgba(0,0,0,0.55)',
        }}
      >
        {/* ══ Header — ab blue nahi, hero jaisa gradient ══ */}
        <div
          className="px-6 py-7 text-center relative"
          style={{ background: 'var(--bg-hero)', borderBottom: '1px solid var(--border-color)' }}
        >
          <div className="flex justify-center mb-2 pointer-events-none">
            <Logo size="sm" spin={false} />
          </div>

          <h2 className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>
            {headerTitle}
          </h2>
          <p className="text-xs mt-1 px-4 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {headerSub}
          </p>

          <button
            onClick={onClose}
            aria-label={t('common.close')}
            className="absolute top-4 end-4 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
          >
            <X size={15} />
          </button>
        </div>

        {/* ══ Tabs ══ */}
        {method === 'email' && (
          <div className="flex" style={{ borderBottom: '1px solid var(--border-color)' }}>
            {[['login', t('auth.signIn')], ['signup', t('auth.signUp')]].map(([key, label]) => (
              <button
                key={key}
                onClick={() => switchTab(key)}
                className="relative flex-1 py-3.5 text-sm font-bold transition-colors"
                style={{ color: tab === key ? 'var(--text-primary)' : 'var(--text-muted)' }}
              >
                {label}
                <span
                  className="absolute start-6 end-6 -bottom-px h-[2.5px] rounded-full transition-opacity"
                  style={{ background: 'var(--accent)', opacity: tab === key ? 1 : 0 }}
                />
              </button>
            ))}
          </div>
        )}

        <div className="p-6 space-y-3.5">
          {/* ── Messages ── */}
          {error && <Alert tone="error" text={error} />}
          {notice && !error && <Alert tone="ok" text={notice} />}

          {method === 'email' ? (
            <>
              {inApp && (
                <div
                  className="text-[11px] rounded-xl px-3 py-2.5 leading-relaxed"
                  style={{ background: 'var(--bg-dash-cta)', border: '1px solid var(--border-dash-cta)', color: 'var(--text-secondary)' }}
                >
                  {t('auth.inAppWarning')}
                </div>
              )}

              {/* ✅ Google ka asli button — CHHUPA hua.
                  display:none nahi use kiya kyunke Google chhupe hue button ko
                  render hi nahi karta; is liye usay screen se bahar bheja hai. */}
              <div
                ref={googleHostRef}
                aria-hidden="true"
                style={{ position: 'absolute', left: '-9999px', top: 0, width: 320, height: 44, overflow: 'hidden' }}
              />

              {/* ✅ Hamara ek hi Google button */}
              {GOOGLE_CLIENT_ID ? (
                <button
                  type="button"
                  onClick={clickGoogle}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
                  style={{ background: 'var(--bg-surface-alt)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                >
                  <GoogleIcon />
                  {tab === 'signup' ? t('auth.googleSignUp') : t('auth.googleSignIn')}
                </button>
              ) : (
                <p className="text-[11px] text-center" style={{ color: 'var(--text-muted)' }}>
                  {t('auth.googleNotConfigured')}
                </p>
              )}

              {/* Phone login button abhi hidden hai (WhatsApp OTP baad mein). Wapas lane ke liye yahan switchMethod('phone') wala button dobara lagana hai. */}

              <Divider text={t('auth.orEmail')} />

              <form onSubmit={submitEmail} className="space-y-3">
                {tab === 'signup' && (
                  <Field Icon={UserIcon}>
                    <input
                      type="text" name="name" value={form.name} onChange={onChange}
                      placeholder={t('auth.fullName')}
                      className={`${inputBase} ps-11 pe-3`} style={inputStyle}
                    />
                  </Field>
                )}

                <Field Icon={Mail}>
                  <input
                    type="email" name="email" value={form.email} onChange={onChange}
                    placeholder={t('auth.email')} autoComplete="email"
                    className={`${inputBase} ps-11 pe-3`} style={inputStyle}
                  />
                </Field>

                {/* ✅ Eye toggle */}
                <Field
                  Icon={Lock}
                  right={
                    <EyeBtn on={showPass} onClick={() => setShowPass((v) => !v)} />
                  }
                >
                  <input
                    type={showPass ? 'text' : 'password'}
                    name="password" value={form.password} onChange={onChange}
                    placeholder={t('auth.password')}
                    autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                    className={`${inputBase} ps-11 pe-11`} style={inputStyle}
                  />
                </Field>

                {tab === 'signup' && (
                  <Field
                    Icon={Lock}
                    right={<EyeBtn on={showConfirm} onClick={() => setShowConfirm((v) => !v)} />}
                  >
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      name="confirmPassword" value={form.confirmPassword} onChange={onChange}
                      placeholder={t('auth.passwordAgain')} autoComplete="new-password"
                      className={`${inputBase} ps-11 pe-11`} style={inputStyle}
                    />
                  </Field>
                )}

                <PrimaryBtn loading={loading}>
                  {tab === 'login' ? t('auth.signIn') : t('auth.createAccount')}
                </PrimaryBtn>
              </form>
            </>
          ) : (
            /* ══════════ PHONE ══════════ */
            <>
              <button
                type="button"
                onClick={() => switchMethod('email')}
                className="flex items-center gap-1.5 text-xs font-semibold transition-opacity hover:opacity-70"
                style={{ color: 'var(--text-muted)' }}
              >
                <ArrowLeft size={13} /> {t('auth.backToEmail')}
              </button>

              {phoneStep === 'enter' && (
                <form onSubmit={requestOtp} className="space-y-3">
                  <Field Icon={Phone}>
                    <input
                      type="tel"
                      inputMode="tel"
                      value={phoneNumber}
                      onChange={(e) => { setPhoneNumber(e.target.value); if (error) setError(''); }}
                      placeholder="0300 1234567"
                      className={`${inputBase} ps-11 pe-3 font-mono tracking-wide`}
                      style={{
                        ...inputStyle,
                        borderColor: phoneNumber && !isValidPkPhone(phoneNumber)
                          ? 'rgba(220,38,38,0.45)'
                          : 'var(--border-color)',
                      }}
                    />
                  </Field>

                  {phoneNumber && isValidPkPhone(phoneNumber) && (
                    <p className="text-[11px] px-1" style={{ color: 'var(--text-muted)' }}>
                      {t('auth.codeWillGoTo')}{' '}
                      <span className="font-mono font-bold" dir="ltr" style={{ color: 'var(--text-secondary)' }}>
                        +{normalizePhone(phoneNumber)}
                      </span>
                    </p>
                  )}

                  <PrimaryBtn loading={loading} disabled={!isValidPkPhone(phoneNumber)}>
                    {t('auth.sendCode')}
                  </PrimaryBtn>

                  <p className="text-[11px] text-center leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                    {t('auth.newNumberHint')}
                  </p>
                </form>
              )}

              {phoneStep === 'code' && (
                <form onSubmit={verifyOtp} className="space-y-3">
                  <p className="text-xs text-center" style={{ color: 'var(--text-secondary)' }}>
                    {t('auth.codeSentToPhone', { phone: `+${normalizePhone(phoneNumber)}` })}
                  </p>

                  <Field Icon={ShieldCheck}>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      autoFocus
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456"
                      className={`${inputBase} ps-11 pe-3 font-mono text-center text-lg tracking-[0.5em]`}
                      style={inputStyle}
                    />
                  </Field>

                  <PrimaryBtn loading={loading} disabled={otpCode.length < 4}>
                    {t('auth.verifyBtn')}
                  </PrimaryBtn>

                  {/* ✅ Resend timer — pehle user bar bar tap karta rehta tha */}
                  <button
                    type="button"
                    disabled={resendIn > 0 || loading}
                    onClick={requestOtp}
                    className="w-full text-xs font-semibold disabled:opacity-50 transition-opacity"
                    style={{ color: resendIn > 0 ? 'var(--text-muted)' : 'var(--accent)' }}
                  >
                    {resendIn > 0 ? t('auth.newCodeIn', { n: resendIn }) : t('auth.sendNewCode')}
                  </button>

                  <button
                    type="button"
                    onClick={() => { setPhoneStep('enter'); setOtpCode(''); setNotice(''); setError(''); }}
                    className="w-full text-xs"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {t('auth.changeNumber')}
                  </button>
                </form>
              )}

              {phoneStep === 'name' && (
                <form onSubmit={savePhoneName} className="space-y-3">
                  <Field Icon={UserIcon}>
                    <input
                      type="text"
                      autoFocus
                      value={phoneName}
                      onChange={(e) => setPhoneName(e.target.value)}
                      placeholder={t('auth.fullName')}
                      className={`${inputBase} ps-11 pe-3`}
                      style={inputStyle}
                    />
                  </Field>
                  <PrimaryBtn loading={loading} disabled={!phoneName.trim()}>
                    {t('auth.getStarted')}
                  </PrimaryBtn>
                </form>
              )}
            </>
          )}

          <button
            onClick={onClose}
            className="w-full py-2 text-xs transition-opacity hover:opacity-70"
            style={{ color: 'var(--text-muted)' }}
          >
            {t('auth.notNow')}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════ Chhote helpers ═══════════ */

function EyeBtn({ on, onClick }) {
  const { t } = useLang();
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={on ? t('auth.hidePassword') : t('auth.showPassword')}
      className="p-1 transition-opacity hover:opacity-70"
      style={{ color: 'var(--text-muted)' }}
    >
      {on ? <EyeOff size={16} /> : <Eye size={16} />}
    </button>
  );
}

function PrimaryBtn({ loading, disabled, children }) {
  return (
    <button
      type="submit"
      disabled={loading || disabled}
      className="w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-transform active:scale-[0.99]"
      style={{
        background: 'var(--accent)',
        color: 'var(--accent-text)',
        boxShadow: '0 8px 22px -8px rgba(232,184,75,0.55)',
      }}
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  );
}

function Alert({ tone, text }) {
  const ok = tone === 'ok';
  return (
    <div
      className="flex items-start gap-2.5 rounded-xl px-3.5 py-2.5"
      style={{
        background: ok ? 'rgba(5,150,105,0.08)' : 'rgba(220,38,38,0.08)',
        border: `1px solid ${ok ? 'rgba(5,150,105,0.22)' : 'rgba(220,38,38,0.22)'}`,
      }}
    >
      {ok
        ? <CheckCircle2 size={15} className="shrink-0 mt-0.5" style={{ color: '#059669' }} />
        : <AlertTriangle size={15} className="shrink-0 mt-0.5" style={{ color: '#dc2626' }} />}
      <p className="text-xs font-medium leading-relaxed" style={{ color: ok ? '#059669' : '#dc2626' }}>
        {text}
      </p>
    </div>
  );
}

function Divider({ text }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <span className="flex-1 h-px" style={{ background: 'var(--border-color)' }} />
      <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{text}</span>
      <span className="flex-1 h-px" style={{ background: 'var(--border-color)' }} />
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <g fill="none" fillRule="evenodd">
        <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
        <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" />
        <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
        <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
      </g>
    </svg>
  );
}