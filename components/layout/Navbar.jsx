//frontend/components/layout/Navbar.jsx
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Globe2, Moon, Sun } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useTheme } from '@/lib/themeContext';
import { useLang } from '@/lib/i18nContext';
import { getSocket, connectSocket } from '@/lib/socket';
import { api } from '@/lib/api';
import Logo from './Logo';
import ProfileDropdown from './ProfileDropdown';
import AuthModal from '@/components/auth/AuthModal';
import WishlistButton from './WishlistButton';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, role, _hasHydrated } = useAuthStore();
  const { theme, toggleTheme } = useTheme();
  const { lang, setLang, t } = useLang();
  const [isClient, setIsClient] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [carsMenuOpen, setCarsMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authRedirect, setAuthRedirect] = useState('/');

  const openAuthModal = (redirectTo) => {
    setAuthRedirect(redirectTo || pathname || '/');
    setShowAuthModal(true);
  };

  const searchParams = useSearchParams();

  useEffect(() => {
    const mode = searchParams.get('auth');
    if (mode !== 'login' && mode !== 'signup') return;
    setAuthRedirect(searchParams.get('next') || null);
    setShowAuthModal(true);
    window.history.replaceState({}, '', window.location.pathname);
  }, [searchParams]);

  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const carsMenuRef = useRef(null);
  const notifRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const onClick = (e) => {
      if (carsMenuRef.current && !carsMenuRef.current.contains(e.target)) {
        setCarsMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const parseRoomId = (link) => {
    if (!link) return null;
    const idx = link.indexOf('roomId=');
    if (idx === -1) return null;
    // ✅ FIX: pehle poori remaining string le li jaati thi (agar link mein
    // roomId= ke baad koi aur query param, `&`, `#`, ya trailing slash ho
    // to woh bhi roomId ka hissa ban jata tha — jaise "68f2...&type=admin").
    // Ab sirf roomId ki actual value nikalte hain, agle delimiter tak.
    const rest = link.substring(idx + 'roomId='.length);
    const match = rest.match(/^[^&#/\s]+/);
    return match ? decodeURIComponent(match[0]) : null;
  };

  const fetchPersistedNotifications = useCallback(async () => {
    try {
      const res = await api.get('/notifications');
      const list = Array.isArray(res) ? res : (res?.data || []);
      const mapped = list.map((n) => ({
        id: n.id,
        type: n.type || 'NEW_MESSAGE',
        message: n.body,
        roomId: parseRoomId(n.link),
        senderName: n.title || t('common.user'),
        carTitle: '',
        timestamp: n.createdAt,
        read: !!n.isRead,
      }));
      setNotifications(mapped.slice(0, 20));
      setUnreadCount(mapped.filter((n) => !n.read).length);
    } catch (err) {
      console.error('Fetch notifications error:', err);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;

    fetchPersistedNotifications();

    connectSocket();
    socketRef.current = getSocket();
    socketRef.current.emit('join_user_room', user.id);

    socketRef.current.on('new_chat_notification', (notification) => {
      setNotifications(prev => [
        {
          id: Date.now(),
          type: notification.type || 'NEW_MESSAGE',
          message: notification.message,
          roomId: notification.roomId,
          senderName: notification.senderName || t('common.user'),
          carTitle: notification.carTitle || '',
          timestamp: notification.timestamp || new Date(),
          read: false,
        },
        ...prev.slice(0, 19),
      ]);
      setUnreadCount(prev => prev + 1);
      if (typeof window !== 'undefined' && 'Notification' in window && window.Notification.permission === 'granted') {
        new window.Notification(`AutoPK — ${t('notifications.newMessage')}`, {
          body: notification.message,
          icon: '/favicon.ico',
        });
      }
    });

    if (typeof window !== 'undefined' && 'Notification' in window && window.Notification.permission === 'default') {
      window.Notification.requestPermission();
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.off('new_chat_notification');
      }
    };
  }, [isAuthenticated, user?.id, role, fetchPersistedNotifications]);

  const handleNotifOpen = async () => {
    const opening = !notifOpen;
    setNotifOpen(opening);

    if (opening && unreadCount > 0) {
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      try {
        await api.put('/notifications/read-all');
      } catch (err) {
        console.error('Mark all read error:', err);
      }
    }
  };

  const handleNotifClick = (notif) => {
    setNotifOpen(false);
    if (notif.roomId) {
      router.push(`/chat?roomId=${notif.roomId}`);
    } else {
      router.push('/chat');
    }
  };

  // Notification ka waqt — teeno zabanon mein. `t` component scope se milta hai.
  const formatNotifTime = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    const now = new Date();
    const diff = Math.floor((now - d) / 1000);
    if (diff < 60) return t('common.justNow');
    if (diff < 3600) return `${t('common.minutes', { n: Math.floor(diff / 60) })} ${t('common.ago')}`;
    if (diff < 86400) return `${t('common.hours', { n: Math.floor(diff / 3600) })} ${t('common.ago')}`;
    return d.toLocaleDateString(lang === 'ur' ? 'ur-PK' : 'en-PK');
  };

  const isReady = isClient && _hasHydrated;
  const effectiveRole = (role || user?.role || '').toUpperCase();

  const LANG_OPTIONS = [
    { code: 'roman', label: 'Roman Urdu' },
    { code: 'en',    label: 'English' },
    { code: 'ur',    label: 'اردو' },
  ];

  const currentLangLabel = LANG_OPTIONS.find(l => l.code === lang)?.label || 'Roman Urdu';

  const NAV_LINK_CLS =
    'text-sm font-semibold px-3 py-2 rounded-lg transition-colors hover:bg-[var(--bg-surface-alt)]';

  return (
    <>
      <nav
        className="sticky top-0 z-50 border-b"
        style={{ background: 'var(--bg-header)', borderColor: 'var(--border-color)' }}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6">
          <div className="flex justify-between items-center h-16 sm:h-[72px]">
            <Logo />

            {/* ── Desktop menu ── */}
            <div className="hidden lg:flex items-center gap-1" style={{ color: 'var(--text-primary)' }}>
              <div
                className="relative group"
                ref={carsMenuRef}
                onMouseEnter={() => setCarsMenuOpen(true)}
                onMouseLeave={() => setCarsMenuOpen(false)}
              >
                <button
                  onClick={() => setCarsMenuOpen(v => !v)}
                  className={`${NAV_LINK_CLS} flex items-center gap-1`}
                  aria-expanded={carsMenuOpen}
                >
                  {t('nav.cars')}
                  <svg
                    className={`w-3.5 h-3.5 transition-transform ${carsMenuOpen ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div
                    className={`absolute left-0 top-full pt-2 w-48 z-50 transition-all duration-150 ${
                      carsMenuOpen
                        ? 'opacity-100 visible translate-y-0'
                        : 'opacity-0 invisible -translate-y-1 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0'
                    }`}
                  >
                  <div
                    className="rounded-xl border shadow-lg overflow-hidden py-1 glass-card"
                    style={{ borderColor: 'var(--border-color)' }}
                  >
                    <Link
                      href="/cars?condition=new"
                      onClick={() => setCarsMenuOpen(false)}
                      className="block px-4 py-2.5 text-sm font-medium hover:bg-[var(--bg-surface-alt)] transition-colors"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {t('nav.newCars')}
                    </Link>
                    <Link
                      href="/cars?condition=used"
                      onClick={() => setCarsMenuOpen(false)}
                      className="block px-4 py-2.5 text-sm font-medium hover:bg-[var(--bg-surface-alt)] transition-colors"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {t('nav.usedCars')}
                    </Link>
                    <Link
                      href="/cars?exchange=true"
                      onClick={() => setCarsMenuOpen(false)}
                      className="block px-4 py-2.5 text-sm font-medium hover:bg-[var(--bg-surface-alt)] transition-colors"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {/* ✅ FIX: hardcoded → t() */}
                      {t('nav.carExchange')}
                    </Link>
                  </div>
                </div>
              </div>

              <Link href="/stores" className={NAV_LINK_CLS}>
                {t('nav.verifiedDealers')}
              </Link>
              <Link href="/spare-parts" className={NAV_LINK_CLS}>
                {t('nav.parts')}
              </Link>
              <Link href="/blog" className={NAV_LINK_CLS}>
                {t('nav.blog')}
              </Link>
              <Link href="/privacy-policy" className={NAV_LINK_CLS}>
                {t('nav.privacyPolicy')}
              </Link>
            </div>

            {/* ── Right side ── */}
            <div className="flex gap-1.5 sm:gap-3 items-center">
              {isReady ? (
                <>
                  {/* Theme toggle */}
                  <button
                    onClick={toggleTheme}
                    aria-label={t('common.toggleTheme')}
                    title={theme === 'light' ? t('common.dark') : t('common.light')}
                    className="h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center rounded-full border text-sm shrink-0 glass-card"
                    style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  >
                    {theme === 'light' ? <Moon size={16} strokeWidth={2} /> : <Sun size={16} strokeWidth={2} />}
                  </button>

                  {/* ── Language switcher (desktop) ── */}
                  <div className="relative hidden sm:block">
                    <button
                      onClick={() => setLangMenuOpen(v => !v)}
                      className="h-9 px-3 flex items-center gap-1 rounded-full border text-xs font-semibold glass-card"
                      style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                    >
                      <Globe2 size={15} strokeWidth={2} aria-hidden="true" /> {currentLangLabel}
                    </button>
                    {langMenuOpen && (
                      <div
                        className="absolute right-0 mt-2 w-36 rounded-lg border shadow-lg z-50 overflow-hidden glass-card"
                        style={{ borderColor: 'var(--border-color)' }}
                      >
                        {LANG_OPTIONS.map(opt => (
                          <button
                            key={opt.code}
                            onClick={() => { setLang(opt.code); setLangMenuOpen(false); }}
                            className="w-full text-left px-3 py-2 text-sm hover:opacity-80"
                            style={{
                              color: 'var(--text-primary)',
                              background: lang === opt.code ? 'var(--bg-surface-alt)' : 'transparent',
                              fontWeight: lang === opt.code ? 700 : 400,
                            }}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {!isAuthenticated ? (
                    <>
                      <button
                        onClick={() => openAuthModal('/sell')}
                        className="hidden sm:inline-flex px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap border glow-hover"
                        style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}
                      >
                        {/* ✅ FIX: hardcoded → t() */}
                        {t('nav.startSelling')}
                      </button>
                      <button
                        onClick={() => openAuthModal(pathname)}
                        className="px-3 sm:px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap glow-hover"
                        style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
                      >
                        {t('nav.signIn')}
                      </button>
                    </>
                  ) : (
                    <>
                      {isAuthenticated && <WishlistButton />}

                      {/* ── Notifications ── */}
                      {isAuthenticated && (
                        <div className="relative" ref={notifRef}>
                          <button
                            onClick={handleNotifOpen}
                            aria-label={t('nav.notifications')}
                            className={`relative h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center rounded-full border transition-all ${
                              unreadCount > 0
                                ? 'bg-red-500/15 border-red-500/60 shadow-lg shadow-red-500/40 animate-pulse'
                                : 'hover:bg-[var(--bg-surface-alt)]'
                            } glass-card`}
                            style={{
                              borderColor: unreadCount > 0 ? undefined : 'var(--border-color)',
                              color: unreadCount > 0 ? '#ef4444' : 'var(--text-primary)',
                            }}
                          >
                            <svg width="16" height="16" className="sm:w-[18px] sm:h-[18px]" viewBox="0 0 24 24" fill={unreadCount > 0 ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                            </svg>
                            {unreadCount > 0 && (
                              <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold shadow-lg animate-pulse">
                                {unreadCount > 9 ? '9+' : unreadCount}
                              </span>
                            )}
                          </button>

                          {notifOpen && (
                            <div
                              className="absolute right-0 mt-2 w-[calc(100vw-2rem)] max-w-80 rounded-2xl border shadow-2xl z-50 overflow-hidden glass-card"
                              style={{ borderColor: 'var(--border-color)' }}
                            >
                              <div
                                className="px-4 py-3 border-b flex items-center justify-between"
                                style={{ borderColor: 'var(--border-color)' }}
                              >
                                {/* ✅ FIX: hardcoded → t() */}
                                <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                                  {t('nav.chatNotifications')}
                                </span>
                                {notifications.length > 0 && (
                                  <button
                                    onClick={() => { setNotifications([]); setUnreadCount(0); }}
                                    className="text-xs opacity-50 hover:opacity-100 transition-opacity"
                                    style={{ color: 'var(--text-primary)' }}
                                  >
                                    {/* ✅ FIX: hardcoded → t() */}
                                    {t('common.clearAll')}
                                  </button>
                                )}
                              </div>
                              <div className="max-h-[340px] overflow-y-auto">
                                {notifications.length === 0 ? (
                                  <div className="py-10 text-center">
                                    <svg className="mx-auto mb-2 opacity-30" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                                    </svg>
                                    {/* ✅ FIX: hardcoded → t() */}
                                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                      {t('nav.noNotifications')}
                                    </p>
                                  </div>
                                ) : (
                                  notifications.map((notif) => (
                                    <button
                                      key={notif.id}
                                      onClick={() => handleNotifClick(notif)}
                                      className="w-full text-left px-4 py-3 border-b transition-colors hover:bg-[var(--bg-surface-alt)] flex items-start gap-3"
                                      style={{
                                        borderColor: 'var(--border-color)',
                                        background: notif.read ? 'transparent' : 'rgba(59,130,246,0.06)',
                                      }}
                                    >
                                      <div className="mt-0.5 h-8 w-8 rounded-full bg-blue-500/15 flex items-center justify-center shrink-0">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2">
                                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                        </svg>
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                                          {notif.senderName}
                                          {notif.carTitle && (
                                            <span className="font-normal opacity-60"> — {notif.carTitle}</span>
                                          )}
                                        </p>
                                        <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--text-muted)' }}>
                                          {notif.message}
                                        </p>
                                        <p className="text-[10px] mt-1 opacity-50" style={{ color: 'var(--text-muted)' }}>
                                          {formatNotifTime(notif.timestamp)}
                                        </p>
                                      </div>
                                      {!notif.read && (
                                        <span className="mt-1.5 h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                                      )}
                                    </button>
                                  ))
                                )}
                              </div>
                              <div
                                className="border-t"
                                style={{ borderColor: 'var(--border-color)' }}
                              >
                                <button
                                  onClick={() => { setNotifOpen(false); router.push('/chat'); }}
                                  className="w-full py-3 text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors"
                                >
                                  {/* ✅ FIX: hardcoded → t() */}
                                  {t('nav.viewAllConversations')} →
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* ✅ FIX: hardcoded → t() */}
                      {isAuthenticated && (
                        <Link
                          href="/sell"
                          className="hidden sm:inline-flex px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap border glow-hover"
                          style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}
                        >
                          {t('nav.sellYourCar')}
                        </Link>
                      )}

                      <ProfileDropdown />
                    </>
                  )}

                  <button
                    onClick={() => setMobileOpen(v => !v)}
                    className="lg:hidden h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center rounded-full border shrink-0 glass-card"
                    style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                    aria-label={t('common.menu')}
                  >
                    {mobileOpen ? '✕' : '☰'}
                  </button>
                </>
              ) : (
                <div className="h-8 w-24 sm:h-9 bg-transparent" />
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ── Mobile menu ── */}
      {isReady && mobileOpen && (
        <div
          className="lg:hidden border-t px-4 py-3 flex flex-col gap-1"
          style={{ background: 'var(--bg-header)', borderColor: 'var(--border-color)' }}
        >
          <p className="text-[10px] font-bold uppercase tracking-wider px-3 pt-1 pb-1" style={{ color: 'var(--text-muted)' }}>
            {t('nav.cars')}
          </p>
          <Link href="/cars?condition=new" onClick={() => setMobileOpen(false)} className={NAV_LINK_CLS} style={{ color: 'var(--text-primary)' }}>
            {t('nav.newCars')}
          </Link>
          <Link href="/cars?condition=used" onClick={() => setMobileOpen(false)} className={NAV_LINK_CLS} style={{ color: 'var(--text-primary)' }}>
            {t('nav.usedCars')}
          </Link>
          {/* ✅ FIX: hardcoded → t() */}
          <Link href="/cars?exchange=true" onClick={() => setMobileOpen(false)} className={NAV_LINK_CLS} style={{ color: 'var(--text-primary)' }}>
            {t('nav.carExchange')}
          </Link>
          <Link href="/stores" onClick={() => setMobileOpen(false)} className={NAV_LINK_CLS} style={{ color: 'var(--text-primary)' }}>
            {t('nav.verifiedDealers')}
          </Link>
          <Link href="/spare-parts" onClick={() => setMobileOpen(false)} className={NAV_LINK_CLS} style={{ color: 'var(--text-primary)' }}>
            {t('nav.parts')}
          </Link>
          <Link href="/blog" onClick={() => setMobileOpen(false)} className={NAV_LINK_CLS} style={{ color: 'var(--text-primary)' }}>
            {t('nav.blog')}
          </Link>
          <Link href="/privacy-policy" onClick={() => setMobileOpen(false)} className={NAV_LINK_CLS} style={{ color: 'var(--text-primary)' }}>
            {t('nav.privacyPolicy')}
          </Link>

          <div className="h-px my-2" style={{ background: 'var(--border-color)' }} />

          {/* ✅ FIX: hardcoded → t() */}
          {isAuthenticated && (
            <Link
              href="/chat"
              onClick={() => setMobileOpen(false)}
              className={`${NAV_LINK_CLS} flex items-center justify-between`}
              style={{ color: 'var(--text-primary)' }}
            >
              <span>{t('nav.chatMessages')}</span>
              {unreadCount > 0 && (
                <span className="h-5 min-w-[20px] px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
          )}

          {/* ── Language switcher (mobile) ── */}
          <div className="flex items-center justify-between px-3">
            {/* ✅ FIX: hardcoded → t() */}
            <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
              {t('nav.language')}
            </span>
            <div className="flex gap-1">
              {LANG_OPTIONS.map(opt => (
                <button
                  key={opt.code}
                  onClick={() => { setLang(opt.code); setMobileOpen(false); }}
                  className="px-2.5 py-1 rounded-full text-xs font-semibold border glass-card"
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
          </div>

          {/* ✅ FIX: hardcoded → t() */}
          {isAuthenticated && (
            <Link
              href="/sell"
              onClick={() => setMobileOpen(false)}
              className="mt-2 text-center px-4 py-2.5 rounded-lg font-semibold text-sm border glow-hover glass-card"
              style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}
            >
              {t('nav.sellYourCar')}
            </Link>
          )}

          {!isAuthenticated && (
            <div className="flex flex-col gap-2 mt-2">
              {/* ✅ FIX: hardcoded → t() */}
              <button
                onClick={() => { openAuthModal('/sell'); setMobileOpen(false); }}
                className="text-center px-4 py-2.5 rounded-lg font-semibold text-sm border glow-hover glass-card"
                style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}
              >
                {t('nav.startSelling')}
              </button>
              <button
                onClick={() => { openAuthModal(pathname); setMobileOpen(false); }}
                className="text-center px-4 py-2.5 rounded-lg font-semibold text-sm glow-hover"
                style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
              >
                {t('nav.signIn')}
              </button>
            </div>
          )}
        </div>
      )}

      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          message={t('common.signInFirst')}
          redirectAfter={authRedirect}
        />
      )}
    </>
  );
}