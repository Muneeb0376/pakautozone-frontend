// frontend/lib/siteContact.js
//
// ✅ POORI FILE REPLACE — Phase 5 (Phase 3 wali file ki jagah)
//
// Kya badla:
//
// 1. AUQAAT — aap ne kaha "koi din bhi off nahi hai, sab din open
//    rakhna, aur Jummah ko kam time." Pehle Itwaar "Band" likha tha.
//    Ab saatoon din khule hain aur Jummah ka waqt chhota hai (Jumma ki
//    namaz ka waqfa).
//
// 2. LOCATION — "Attock, Punjab" ki jagah ab **Haripur, Pakistan**.
//
// 3. Naya `hoursNote` — Jummah ke waqfe ki wajah alag se likhi hai,
//    warna log samajhte hain ke aap kam kaam karte hain.

export const SITE = {
  name: 'Pak Auto Zone',
  tagline: 'Pakistan ka apna auto marketplace',
  email: 'pakautozone.inc@gmail.com',
};

/* ── Phone numbers ──
   `raw` = sirf hindse, country code ke saath (tel:/wa.me links ke liye).
   `display` = jo screen par dikhta hai.
   Dono alag rakhna zaroori hai — WhatsApp ka link space ya 0 se shuru
   hone wale number par kaam nahi karta. */
export const PHONES = [
  {
    labelKey: 'contactPage.phones.sales',
    display: '0313 076 0000',
    raw: '923130760000',
    whatsapp: true,
  },
  {
    labelKey: 'contactPage.phones.support',
    display: '0344 974 5264',
    raw: '923449745264',
    whatsapp: true,
  },
];

export const PRIMARY_PHONE = PHONES[0];

export const SOCIALS = [
  {
    key: 'facebook',
    label: 'Facebook',
    handle: 'Pak Auto Zone',
    href: 'https://www.facebook.com/share/1DR5vnQMnV/',
  },
  {
    key: 'instagram',
    label: 'Instagram',
    handle: '@paz_detailers',
    // ⚠️ Aap ke diye hue link se `?igsi=...` wala tracking parameter hata
    // diya hai — wo sirf ek session ke liye hota hai aur doosre device
    // par kaam nahi karta.
    href: 'https://www.instagram.com/paz_detailers',
  },
  {
    key: 'tiktok',
    label: 'TikTok',
    handle: '@pakautozone.inc',
    href: 'https://www.tiktok.com/@pakautozone.inc',
  },
];

/* ── Kaam ke auqaat ──
   ✅ Saatoon din khule. Jummah ko chhota waqt (namaz ka waqfa).
   ⚠️ `days`/`time` yahan sirf zaban ke liye keys hain — asli text
   i18n.js ke dictionary se t() ke zariye aata hai (page.jsx dekhein),
   isliye ye component ki lang ke saath khud badal jate hain. */
export const BUSINESS_HOURS = [
  { daysKey: 'contactPage.hours.monThu',   time: '9:00 AM – 9:00 PM' },
  { daysKey: 'contactPage.hours.friday',   time: '9:00 AM – 12:00 PM, 3:00 PM – 9:00 PM', short: true },
  { daysKey: 'contactPage.hours.saturday', time: '9:00 AM – 9:00 PM' },
  { daysKey: 'contactPage.hours.sunday',   time: '11:00 AM – 8:00 PM' },
];

// ⚠️ Raw string ki jagah ab translation key — page.jsx isay t() se guzarta hai.
export const HOURS_NOTE_KEY = 'contactPage.hours.note';

/* ✅ Haripur — city/country universal hain, sirf province ki Urdu
   translation chahiye thi isliye wo key ke tor par hai. */
export const ADDRESS = {
  city: 'Haripur',
  provinceKey: 'contactPage.address.province',
  countryKey: 'common.pakistan',
  line: 'Haripur, Pakistan',
};

/* ── Ready-made links ── */
export const mailto = (subject = '') =>
  `mailto:${SITE.email}${subject ? `?subject=${encodeURIComponent(subject)}` : ''}`;

// Browser-friendly compose link for users whose device has no mailto handler.
export const gmailCompose = (subject = '') =>
  `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(SITE.email)}${subject ? `&su=${encodeURIComponent(subject)}` : ''}`;

export const telLink = (phone) => `tel:+${phone.raw}`;

export const waLink = (phone, text = '') =>
  `https://wa.me/${phone.raw}${text ? `?text=${encodeURIComponent(text)}` : ''}`;