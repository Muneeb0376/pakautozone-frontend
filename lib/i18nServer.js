// frontend/lib/i18nServer.js
//
// SERVER COMPONENTS ke liye translation.
//
// MASLA: Server Component mein React hooks (useLang / useContext) chalte hi
// nahi. Is liye `useLang()` sirf 'use client' files mein kaam karta hai.
// Server pages ka text pehle isi wajah se hardcoded reh jata tha aur
// language switch par nahi badalta tha.
//
// HAL: yahan se `getT()` lo — ye cookie (autopk_lang) server par padhta hai
// aur wahi `t(key, vars)` function deta hai jo client par milta hai.
//
// ISTEMAAL (server component):
//
//   import { getT } from '@/lib/i18nServer';
//
//   export default async function Page() {
//     const { t, lang, dir } = await getT();
//     return <h1>{t('nav.cars')}</h1>;
//   }
//
// NOTE: agar file mein 'use client' likha hai to ye NAHI, `useLang()` use karo.

import { cookies } from 'next/headers';
import { translate, DEFAULT_LANG, LANGS, getDir } from './i18n';

const COOKIE_KEY = 'autopk_lang';
const VALID = LANGS.map((l) => l.code);

/** Cookie se maujuda zaban nikalo (server side). */
export async function getLang() {
  try {
    const store = await cookies();
    const value = store.get(COOKIE_KEY)?.value ?? '';
    return VALID.includes(value) ? value : DEFAULT_LANG;
  } catch {
    // cookies() sirf request scope mein chalta hai. Static generation ya
    // build-time render mein fail ho sakta hai — tab default zaban.
    return DEFAULT_LANG;
  }
}

/**
 * Server component ke liye translator.
 * @returns {Promise<{ t: (key: string, vars?: object) => string, lang: string, dir: 'ltr'|'rtl' }>}
 */
export async function getT() {
  const lang = await getLang();
  return {
    lang,
    dir: getDir(lang),
    t: (key, vars) => translate(lang, key, vars),
  };
}

/**
 * Jab zaban pehle se maloom ho (e.g. parent ne prop mein di) —
 * bina cookie padhe seedha translator bana lo. Sync hai.
 */
export function makeT(lang) {
  const safe = VALID.includes(lang) ? lang : DEFAULT_LANG;
  return {
    lang: safe,
    dir: getDir(safe),
    t: (key, vars) => translate(safe, key, vars),
  };
}
