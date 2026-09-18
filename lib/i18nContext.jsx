'use client';
// lib/i18nContext.jsx
//
// FIX SUMMARY:
//   1. useEffect mein stale closure bug fix — applyToDocument lang state se
//      sync rahti hai, old value se nahi
//   2. Cookie se milne wali lang bhi DOM par apply hoti hai immediately
//   3. initialLang prop — server se aata hai, koi flash nahi
//   4. setLang par router.refresh() — server re-render ke liye

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  useCallback,
} from 'react';
import { useRouter } from 'next/navigation';
import {
  useTranslation,
  LANGS,
  DEFAULT_LANG,
  getDir,
  syncDomTranslations,
  observeDomTranslations,
} from './i18n';

const COOKIE_KEY = 'autopk_lang';
const ONE_YEAR   = 60 * 60 * 24 * 365;
const VALID      = LANGS.map((l) => l.code);

// ── Cookie helpers ────────────────────────────────────────────────────────
function getCookie() {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(
    new RegExp('(?:^|;\\s*)' + COOKIE_KEY + '=([^;]*)')
  );
  return match ? decodeURIComponent(match[1]) : null;
}

function setCookie(lang) {
  if (typeof document === 'undefined') return;
  document.cookie = [
    `${COOKIE_KEY}=${encodeURIComponent(lang)}`,
    `max-age=${ONE_YEAR}`,
    'path=/',
    'SameSite=Lax',
  ].join('; ');
}

// ── DOM sync ──────────────────────────────────────────────────────────────
function applyToDocument(lang) {
  if (typeof document === 'undefined') return;
  const el = document.documentElement;
  el.setAttribute('lang', lang === 'ur' ? 'ur' : 'en');
  el.setAttribute('dir', getDir(lang));
  // lang-ur class — Nastaliq font aur line-height ke liye
  el.classList.toggle('lang-ur', lang === 'ur');
}

// ── Context defaults ──────────────────────────────────────────────────────
const LangContext = createContext({
  lang   : DEFAULT_LANG,
  dir    : 'ltr',
  setLang: () => {},
  t      : (key) => key,
  mounted: false,
  langs  : LANGS,
});

// ── Provider ──────────────────────────────────────────────────────────────
export function LangProvider({ children, initialLang = DEFAULT_LANG }) {
  const router = useRouter();

  // Server se jo lang aayi wahi initial state — koi flash nahi
  const [lang, setLangState] = useState(
    VALID.includes(initialLang) ? initialLang : DEFAULT_LANG
  );
  const [mounted, setMounted] = useState(false);

  // Mount hone par:
  //   1. DOM ko current lang se sync karo
  //   2. Cookie se compare karo — agar mismatch hai to update karo
  useEffect(() => {
    setMounted(true);

    const cookieLang = getCookie();
    const resolvedLang =
      cookieLang && VALID.includes(cookieLang) ? cookieLang : lang;

    // ✅ FIX: DOM hamesha resolvedLang se apply hoti hai — stale closure nahi
    applyToDocument(resolvedLang);

    // Agar cookie server-lang se alag thi to state bhi sync karo
    if (resolvedLang !== lang) {
      setLangState(resolvedLang);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // lang state change hone par DOM bhi update ho (client-side switch)
  useEffect(() => {
    if (mounted) {
      applyToDocument(lang);
      syncDomTranslations(lang);
    }
  }, [lang, mounted]);

  useEffect(() => {
    if (!mounted) return undefined;
    return observeDomTranslations(() => lang);
  }, [mounted, lang]);

  const setLang = useCallback(
    (next) => {
      if (!VALID.includes(next) || next === lang) return;

      // 1. Cookie set karo
      setCookie(next);

      // 2. State aur DOM turant update — user ko foran change dikhe
      setLangState(next);
      applyToDocument(next);

      // 3. Server components refresh karo (layout RTL/LTR sahi set kare)
      router.refresh();
    },
    [router, lang]
  );

  const { t } = useTranslation(lang);

  const value = useMemo(
    () => ({ lang, dir: getDir(lang), setLang, t, mounted, langs: LANGS }),
    [lang, setLang, t, mounted]
  );

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export const useLang = () => useContext(LangContext);