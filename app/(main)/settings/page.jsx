//frontend/app/(main)/settings/page.jsx
'use client';

// ✅ PHASE 5 — "Settings" destination for the Navbar ProfileDropdown.
// Lives in the (main) route group (Navbar + Footer, no dashboard
// role-gating) for the same reason as Profile — every logged-in user
// should reach it, not just seller/showroom roles.
// Only wires up controls that already have a real, working backend/context
// behind them (theme, language, browser notification permission, logout).
// No fake "Change Password" etc. — backend has no endpoint for that yet,
// so it isn't listed here to avoid a dead-end control.

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Sun, Moon, Globe, Bell, LogOut, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useTheme } from '@/lib/themeContext';
import { useLang } from '@/lib/i18nContext';

const LANG_OPTIONS = [
  { code: 'roman', label: 'Roman Urdu' },
  { code: 'en', label: 'English' },
  { code: 'ur', label: 'اردو' },
];

export default function SettingsPage() {
  const router = useRouter();
  const { user, isAuthenticated, _hasHydrated, logout } = useAuthStore();
  const { theme, toggleTheme } = useTheme();
  const { lang, setLang, t } = useLang();
  const [notifPermission, setNotifPermission] = useState('default');

  // ✅ (main) layout doesn't auth-gate like dashboard/layout.jsx does —
  // this page needs its own guard.
  useEffect(() => {
    if (!_hasHydrated) return;
    if (!isAuthenticated || !user) router.replace('/login');
  }, [_hasHydrated, isAuthenticated, user, router]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotifPermission(window.Notification.permission);
    }
  }, []);

  const requestNotifPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    const result = await window.Notification.requestPermission();
    setNotifPermission(result);
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (!user) return null;

  const Row = ({ icon: Icon, title, desc, children }) => (
    <div
      className="flex items-center justify-between gap-4 py-4 border-b last:border-b-0"
      style={{ borderColor: 'var(--border-color)' }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'var(--bg-surface-alt)' }}
        >
          <Icon size={16} style={{ color: 'var(--text-primary)' }} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{title}</p>
          {desc && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{desc}</p>}
        </div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );

  return (
    <div className="min-h-screen py-10 px-4" style={{ background: 'var(--bg-page)' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto p-8 rounded-3xl border shadow-2xl"
        style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)' }}
      >
        <h1 className="text-2xl font-extrabold mb-1" style={{ color: 'var(--text-primary)' }}>{t('nav.settings')}</h1>
        <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
          App preferences aur account controls
        </p>

        {/* Appearance & Language */}
        <div className="mb-2">
          <Row icon={theme === 'light' ? Moon : Sun} title="Appearance" desc={theme === 'light' ? 'Currently Light mode' : 'Currently Dark mode'}>
            <button
              onClick={toggleTheme}
              className="px-4 py-2 rounded-lg text-xs font-bold border glass-card"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
            >
              Switch to {theme === 'light' ? 'Dark' : 'Light'}
            </button>
          </Row>

          <Row icon={Globe} title={t('nav.language')} desc={t('settings.languageDesc')}>
            <div className="flex gap-1">
              {LANG_OPTIONS.map((opt) => (
                <button
                  key={opt.code}
                  onClick={() => setLang(opt.code)}
                  className="px-2.5 py-1.5 rounded-full text-xs font-semibold border glass-card"
                  style={{
                    borderColor: 'var(--border-color)',
                    background: lang === opt.code ? 'var(--accent)' : 'transparent',
                    color: lang === opt.code ? 'var(--accent-text)' : 'var(--text-primary)',
                  }}
                >
                  {opt.code === 'roman' ? 'RU' : opt.code === 'en' ? 'EN' : 'اردو'}
                </button>
              ))}
            </div>
          </Row>

          <Row icon={Bell} title="Browser Notifications" desc={
            notifPermission === 'granted' ? 'Enabled — chat alerts on'
              : notifPermission === 'denied' ? 'Blocked in browser settings'
              : 'Not enabled yet'
          }>
            {notifPermission !== 'granted' && notifPermission !== 'denied' ? (
              <button
                onClick={requestNotifPermission}
                className="px-4 py-2 rounded-lg text-xs font-bold border glass-card"
                style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              >
                Enable
              </button>
            ) : (
              <span
                className="px-3 py-1.5 rounded-full text-xs font-semibold"
                style={{
                  background: notifPermission === 'granted' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                  color: notifPermission === 'granted' ? '#22c55e' : '#ef4444',
                }}
              >
                {notifPermission === 'granted' ? 'On' : 'Blocked'}
              </span>
            )}
          </Row>

          <Row icon={ShieldCheck} title="Account Status" desc={user.isVerified ? 'Verified account' : 'Not verified yet'}>
            <span
              className="px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{
                background: user.isVerified ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)',
                color: user.isVerified ? '#22c55e' : '#f59e0b',
              }}
            >
              {user.isVerified ? 'Verified' : 'Unverified'}
            </span>
          </Row>
        </div>

        <button
          onClick={handleLogout}
          className="w-full mt-6 py-3.5 font-bold rounded-xl text-sm border transition-colors flex items-center justify-center gap-2 text-red-500 hover:bg-red-500/10"
          style={{ borderColor: 'rgba(239,68,68,0.4)' }}
        >
          <LogOut size={16} />{t('nav.logout')}</button>
      </motion.div>
    </div>
  );
}
