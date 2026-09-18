// frontend/components/home/bodyTypeData.jsx
// Body-type SVG silhouettes + labels — used by BodyTypeSection.
//
// ✅ REDESIGN v2 — purani SVGs flat cartoon thi (pehiye body par chipke, har
//    car ka apna paimana). Ab:
//      • saari cars EK geometry system se — same ground line (y=76), same
//        wheel size (r=18), same arch (r≈21). Isi liye grid mein ye ek set
//        lagti hain, aath alag drawings nahi.
//      • body par shading gradient (upar roshni, neeche saya) — flat rang
//        ki jagah asli depth.
//      • glass ka apna gradient (upar halka, neeche gehra) — sheeshe jaisa.
//      • alloy rims metallic radial gradient + 5 spokes ke sath.
//      • zameen par soft radial saya, sakht ellipse nahi.
//
//    Body ka rang `currentColor` se aata hai aur shading uske UPAR ek
//    transparent white→black gradient hai — isi liye BodyTypeSection.jsx ka
//    `color: bodyType.color` wrapper har rang ke sath theek kaam karta hai.
//
//    Har type ki gradient IDs ke aakhir mein uska naam laga hai (shSEDAN,
//    glSUV...) — ek hi page par aath cars hoti hain, IDs takraani nahi chahiye.

export const BODY_TYPE_SVGS = {
  // ─── SEDAN: 3-box — lamba hood, alag notchback trunk, neechi chhat
  SEDAN: (
    <svg viewBox="0 0 266 104" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
      <linearGradient id="shSEDAN" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#ffffff" stopOpacity="0.30"/>
      <stop offset="0.30" stopColor="#ffffff" stopOpacity="0.10"/>
      <stop offset="0.52" stopColor="#ffffff" stopOpacity="0.00"/>
      <stop offset="0.70" stopColor="#000000" stopOpacity="0.10"/>
      <stop offset="1" stopColor="#000000" stopOpacity="0.34"/>
      </linearGradient>
      <linearGradient id="glSEDAN" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#2b3b52" stopOpacity="1"/>
      <stop offset="0.55" stopColor="#141d2b" stopOpacity="1"/>
      <stop offset="1" stopColor="#0b1220" stopOpacity="1"/>
      </linearGradient>
      <radialGradient id="gsSEDAN">
      <stop offset="0" stopColor="#000000" stopOpacity="0.34"/>
      <stop offset="0.6" stopColor="#000000" stopOpacity="0.16"/>
      <stop offset="1" stopColor="#000000" stopOpacity="0"/>
      </radialGradient>
      <radialGradient id="rmSEDAN">
      <stop offset="0" stopColor="#cfd4db" stopOpacity="1"/>
      <stop offset="1" stopColor="#7b818b" stopOpacity="1"/>
      </radialGradient>
      </defs>
      <ellipse cx="130" cy="95" rx="126" ry="8" fill="url(#gsSEDAN)"/>
      <path d="M14,76 C14,62 16,54 24,50 C34,45 48,43 66,41 L96,25 C100,22 105,21 111,21 L154,21 C161,21 166,23 169,28 L184,43 L232,46 C241,48 246,53 246,61 L246,76 L217.0,76.0 C217.0,64.4 207.6,55.0 196.0,55.0 C184.4,55.0 175.0,64.4 175.0,76.0 L91.0,76.0 C91.0,64.4 81.6,55.0 70.0,55.0 C58.4,55.0 49.0,64.4 49.0,76.0 L14,76 Z" fill="currentColor"/>
      <path d="M14,76 C14,62 16,54 24,50 C34,45 48,43 66,41 L96,25 C100,22 105,21 111,21 L154,21 C161,21 166,23 169,28 L184,43 L232,46 C241,48 246,53 246,61 L246,76 L217.0,76.0 C217.0,64.4 207.6,55.0 196.0,55.0 C184.4,55.0 175.0,64.4 175.0,76.0 L91.0,76.0 C91.0,64.4 81.6,55.0 70.0,55.0 C58.4,55.0 49.0,64.4 49.0,76.0 L14,76 Z" fill="url(#shSEDAN)"/>
      <path d="M103,27 L124,27 L124,41 L92,41 Z" fill="url(#glSEDAN)"/>
      <path d="M130,27 L152,27 L166,41 L130,41 Z" fill="url(#glSEDAN)"/>
      <path d="M24,50 C60,44 120,43 184,45 L232,47" fill="none" stroke="#ffffff" strokeOpacity=".22" strokeWidth="1.6"/>
      <circle cx="70" cy="74" r="18" fill="#141419"/>
      <circle cx="70" cy="74" r="13.5" fill="#26282f"/>
      <ellipse cx="70" cy="74" rx="8.5" ry="8.5" fill="url(#rmSEDAN)"/>
      <path d="M72.0,71.2 L71.4,66.4 L68.6,66.4 L68.0,71.2 Z" fill="#3f444d"/>
      <path d="M73.3,75.0 L77.7,73.0 L76.8,70.3 L72.0,71.2 Z" fill="#3f444d"/>
      <path d="M70.0,77.4 L73.3,81.0 L75.6,79.3 L73.3,75.1 Z" fill="#3f444d"/>
      <path d="M66.7,75.1 L64.4,79.3 L66.7,81.0 L70.0,77.4 Z" fill="#3f444d"/>
      <path d="M68.0,71.2 L63.2,70.3 L62.3,73.0 L66.7,75.0 Z" fill="#3f444d"/>
      <circle cx="70" cy="74" r="2.6" fill="#4a4f58"/>
      <circle cx="196" cy="74" r="18" fill="#141419"/>
      <circle cx="196" cy="74" r="13.5" fill="#26282f"/>
      <ellipse cx="196" cy="74" rx="8.5" ry="8.5" fill="url(#rmSEDAN)"/>
      <path d="M198.0,71.2 L197.4,66.4 L194.6,66.4 L194.0,71.2 Z" fill="#3f444d"/>
      <path d="M199.3,75.0 L203.7,73.0 L202.8,70.3 L198.0,71.2 Z" fill="#3f444d"/>
      <path d="M196.0,77.4 L199.3,81.0 L201.6,79.3 L199.3,75.1 Z" fill="#3f444d"/>
      <path d="M192.7,75.1 L190.4,79.3 L192.7,81.0 L196.0,77.4 Z" fill="#3f444d"/>
      <path d="M194.0,71.2 L189.2,70.3 L188.3,73.0 L192.7,75.0 Z" fill="#3f444d"/>
      <circle cx="196" cy="74" r="2.6" fill="#4a4f58"/>
    </svg>
  ),

  // ─── SUV: sabse ooncha aur boxy, seedha khara rear, roof rails
  SUV: (
    <svg viewBox="0 0 266 104" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
      <linearGradient id="shSUV" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#ffffff" stopOpacity="0.30"/>
      <stop offset="0.30" stopColor="#ffffff" stopOpacity="0.10"/>
      <stop offset="0.52" stopColor="#ffffff" stopOpacity="0.00"/>
      <stop offset="0.70" stopColor="#000000" stopOpacity="0.10"/>
      <stop offset="1" stopColor="#000000" stopOpacity="0.34"/>
      </linearGradient>
      <linearGradient id="glSUV" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#2b3b52" stopOpacity="1"/>
      <stop offset="0.55" stopColor="#141d2b" stopOpacity="1"/>
      <stop offset="1" stopColor="#0b1220" stopOpacity="1"/>
      </linearGradient>
      <radialGradient id="gsSUV">
      <stop offset="0" stopColor="#000000" stopOpacity="0.34"/>
      <stop offset="0.6" stopColor="#000000" stopOpacity="0.16"/>
      <stop offset="1" stopColor="#000000" stopOpacity="0"/>
      </radialGradient>
      <radialGradient id="rmSUV">
      <stop offset="0" stopColor="#cfd4db" stopOpacity="1"/>
      <stop offset="1" stopColor="#7b818b" stopOpacity="1"/>
      </radialGradient>
      </defs>
      <ellipse cx="130" cy="95" rx="124" ry="8" fill="url(#gsSUV)"/>
      <path d="M16,76 C16,54 18,44 26,40 C36,35 46,33 58,31 L74,15 C77,12 81,11 87,11 L206,11 C215,11 221,14 224,21 L234,34 C241,37 244,42 244,50 L244,76 L221.0,76.0 C221.0,63.3 210.7,53.0 198.0,53.0 C185.3,53.0 175.0,63.3 175.0,76.0 L91.0,76.0 C91.0,63.3 80.7,53.0 68.0,53.0 C55.3,53.0 45.0,63.3 45.0,76.0 L16,76 Z" fill="currentColor"/>
      <path d="M16,76 C16,54 18,44 26,40 C36,35 46,33 58,31 L74,15 C77,12 81,11 87,11 L206,11 C215,11 221,14 224,21 L234,34 C241,37 244,42 244,50 L244,76 L221.0,76.0 C221.0,63.3 210.7,53.0 198.0,53.0 C185.3,53.0 175.0,63.3 175.0,76.0 L91.0,76.0 C91.0,63.3 80.7,53.0 68.0,53.0 C55.3,53.0 45.0,63.3 45.0,76.0 L16,76 Z" fill="url(#shSUV)"/>
      <rect x="92" y="7" width="106" height="3" rx="1.5" fill="#000" opacity=".3"/>
      <path d="M81,17 L108,17 L108,33 L70,33 Z" fill="url(#glSUV)"/>
      <path d="M114,17 L148,17 L148,33 L114,33 Z" fill="url(#glSUV)"/>
      <path d="M154,17 L204,17 L216,33 L154,33 Z" fill="url(#glSUV)"/>
      <path d="M26,40 C70,34 150,33 234,35" fill="none" stroke="#ffffff" strokeOpacity=".22" strokeWidth="1.6"/>
      <circle cx="68" cy="74" r="18" fill="#141419"/>
      <circle cx="68" cy="74" r="13.5" fill="#26282f"/>
      <ellipse cx="68" cy="74" rx="8.5" ry="8.5" fill="url(#rmSUV)"/>
      <path d="M70.0,71.2 L69.4,66.4 L66.6,66.4 L66.0,71.2 Z" fill="#3f444d"/>
      <path d="M71.3,75.0 L75.7,73.0 L74.8,70.3 L70.0,71.2 Z" fill="#3f444d"/>
      <path d="M68.0,77.4 L71.3,81.0 L73.6,79.3 L71.3,75.1 Z" fill="#3f444d"/>
      <path d="M64.7,75.1 L62.4,79.3 L64.7,81.0 L68.0,77.4 Z" fill="#3f444d"/>
      <path d="M66.0,71.2 L61.2,70.3 L60.3,73.0 L64.7,75.0 Z" fill="#3f444d"/>
      <circle cx="68" cy="74" r="2.6" fill="#4a4f58"/>
      <circle cx="198" cy="74" r="18" fill="#141419"/>
      <circle cx="198" cy="74" r="13.5" fill="#26282f"/>
      <ellipse cx="198" cy="74" rx="8.5" ry="8.5" fill="url(#rmSUV)"/>
      <path d="M200.0,71.2 L199.4,66.4 L196.6,66.4 L196.0,71.2 Z" fill="#3f444d"/>
      <path d="M201.3,75.0 L205.7,73.0 L204.8,70.3 L200.0,71.2 Z" fill="#3f444d"/>
      <path d="M198.0,77.4 L201.3,81.0 L203.6,79.3 L201.3,75.1 Z" fill="#3f444d"/>
      <path d="M194.7,75.1 L192.4,79.3 L194.7,81.0 L198.0,77.4 Z" fill="#3f444d"/>
      <path d="M196.0,71.2 L191.2,70.3 L190.3,73.0 L194.7,75.0 Z" fill="#3f444d"/>
      <circle cx="198" cy="74" r="2.6" fill="#4a4f58"/>
    </svg>
  ),

  // ─── HATCHBACK: chhoti, koi trunk nahi, tez dhalwan tailgate
  HATCHBACK: (
    <svg viewBox="0 0 266 104" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
      <linearGradient id="shHATCHBACK" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#ffffff" stopOpacity="0.30"/>
      <stop offset="0.30" stopColor="#ffffff" stopOpacity="0.10"/>
      <stop offset="0.52" stopColor="#ffffff" stopOpacity="0.00"/>
      <stop offset="0.70" stopColor="#000000" stopOpacity="0.10"/>
      <stop offset="1" stopColor="#000000" stopOpacity="0.34"/>
      </linearGradient>
      <linearGradient id="glHATCHBACK" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#2b3b52" stopOpacity="1"/>
      <stop offset="0.55" stopColor="#141d2b" stopOpacity="1"/>
      <stop offset="1" stopColor="#0b1220" stopOpacity="1"/>
      </linearGradient>
      <radialGradient id="gsHATCHBACK">
      <stop offset="0" stopColor="#000000" stopOpacity="0.34"/>
      <stop offset="0.6" stopColor="#000000" stopOpacity="0.16"/>
      <stop offset="1" stopColor="#000000" stopOpacity="0"/>
      </radialGradient>
      <radialGradient id="rmHATCHBACK">
      <stop offset="0" stopColor="#cfd4db" stopOpacity="1"/>
      <stop offset="1" stopColor="#7b818b" stopOpacity="1"/>
      </radialGradient>
      </defs>
      <ellipse cx="127" cy="95" rx="111" ry="8" fill="url(#gsHATCHBACK)"/>
      <path d="M26,76 C26,60 28,52 36,48 C46,43 58,41 74,39 L98,23 C102,20 107,19 113,19 L178,19 C186,19 192,22 196,29 L210,48 C218,51 228,56 228,64 L228,76 L206.0,76.0 C206.0,65.0 197.0,56.0 186.0,56.0 C175.0,56.0 166.0,65.0 166.0,76.0 L96.0,76.0 C96.0,65.0 87.0,56.0 76.0,56.0 C65.0,56.0 56.0,65.0 56.0,76.0 L26,76 Z" fill="currentColor"/>
      <path d="M26,76 C26,60 28,52 36,48 C46,43 58,41 74,39 L98,23 C102,20 107,19 113,19 L178,19 C186,19 192,22 196,29 L210,48 C218,51 228,56 228,64 L228,76 L206.0,76.0 C206.0,65.0 197.0,56.0 186.0,56.0 C175.0,56.0 166.0,65.0 166.0,76.0 L96.0,76.0 C96.0,65.0 87.0,56.0 76.0,56.0 C65.0,56.0 56.0,65.0 56.0,76.0 L26,76 Z" fill="url(#shHATCHBACK)"/>
      <path d="M105,25 L128,25 L128,39 L94,39 Z" fill="url(#glHATCHBACK)"/>
      <path d="M134,25 L176,25 L190,39 L134,39 Z" fill="url(#glHATCHBACK)"/>
      <path d="M36,48 C70,42 140,41 210,48" fill="none" stroke="#ffffff" strokeOpacity=".22" strokeWidth="1.6"/>
      <circle cx="76" cy="74" r="18" fill="#141419"/>
      <circle cx="76" cy="74" r="13.5" fill="#26282f"/>
      <ellipse cx="76" cy="74" rx="8.5" ry="8.5" fill="url(#rmHATCHBACK)"/>
      <path d="M78.0,71.2 L77.4,66.4 L74.6,66.4 L74.0,71.2 Z" fill="#3f444d"/>
      <path d="M79.3,75.0 L83.7,73.0 L82.8,70.3 L78.0,71.2 Z" fill="#3f444d"/>
      <path d="M76.0,77.4 L79.3,81.0 L81.6,79.3 L79.3,75.1 Z" fill="#3f444d"/>
      <path d="M72.7,75.1 L70.4,79.3 L72.7,81.0 L76.0,77.4 Z" fill="#3f444d"/>
      <path d="M74.0,71.2 L69.2,70.3 L68.3,73.0 L72.7,75.0 Z" fill="#3f444d"/>
      <circle cx="76" cy="74" r="2.6" fill="#4a4f58"/>
      <circle cx="186" cy="74" r="18" fill="#141419"/>
      <circle cx="186" cy="74" r="13.5" fill="#26282f"/>
      <ellipse cx="186" cy="74" rx="8.5" ry="8.5" fill="url(#rmHATCHBACK)"/>
      <path d="M188.0,71.2 L187.4,66.4 L184.6,66.4 L184.0,71.2 Z" fill="#3f444d"/>
      <path d="M189.3,75.0 L193.7,73.0 L192.8,70.3 L188.0,71.2 Z" fill="#3f444d"/>
      <path d="M186.0,77.4 L189.3,81.0 L191.6,79.3 L189.3,75.1 Z" fill="#3f444d"/>
      <path d="M182.7,75.1 L180.4,79.3 L182.7,81.0 L186.0,77.4 Z" fill="#3f444d"/>
      <path d="M184.0,71.2 L179.2,70.3 L178.3,73.0 L182.7,75.0 Z" fill="#3f444d"/>
      <circle cx="186" cy="74" r="2.6" fill="#4a4f58"/>
    </svg>
  ),

  // ─── CROSSOVER: sedan aur SUV ka darmiyan — uthi hui, chhoti chhat, dhalwan rear
  CROSSOVER: (
    <svg viewBox="0 0 266 104" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
      <linearGradient id="shCROSSOVER" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#ffffff" stopOpacity="0.30"/>
      <stop offset="0.30" stopColor="#ffffff" stopOpacity="0.10"/>
      <stop offset="0.52" stopColor="#ffffff" stopOpacity="0.00"/>
      <stop offset="0.70" stopColor="#000000" stopOpacity="0.10"/>
      <stop offset="1" stopColor="#000000" stopOpacity="0.34"/>
      </linearGradient>
      <linearGradient id="glCROSSOVER" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#2b3b52" stopOpacity="1"/>
      <stop offset="0.55" stopColor="#141d2b" stopOpacity="1"/>
      <stop offset="1" stopColor="#0b1220" stopOpacity="1"/>
      </linearGradient>
      <radialGradient id="gsCROSSOVER">
      <stop offset="0" stopColor="#000000" stopOpacity="0.34"/>
      <stop offset="0.6" stopColor="#000000" stopOpacity="0.16"/>
      <stop offset="1" stopColor="#000000" stopOpacity="0"/>
      </radialGradient>
      <radialGradient id="rmCROSSOVER">
      <stop offset="0" stopColor="#cfd4db" stopOpacity="1"/>
      <stop offset="1" stopColor="#7b818b" stopOpacity="1"/>
      </radialGradient>
      </defs>
      <ellipse cx="129" cy="95" rx="121" ry="8" fill="url(#gsCROSSOVER)"/>
      <path d="M18,76 C18,58 20,48 28,44 C38,39 50,37 64,35 L86,19 C90,16 95,15 101,15 L172,15 C181,15 187,18 191,25 L216,44 C226,47 240,51 240,59 L240,76 L214.0,76.0 C214.0,63.8 204.2,54.0 192.0,54.0 C179.8,54.0 170.0,63.8 170.0,76.0 L92.0,76.0 C92.0,63.8 82.2,54.0 70.0,54.0 C57.8,54.0 48.0,63.8 48.0,76.0 L18,76 Z" fill="currentColor"/>
      <path d="M18,76 C18,58 20,48 28,44 C38,39 50,37 64,35 L86,19 C90,16 95,15 101,15 L172,15 C181,15 187,18 191,25 L216,44 C226,47 240,51 240,59 L240,76 L214.0,76.0 C214.0,63.8 204.2,54.0 192.0,54.0 C179.8,54.0 170.0,63.8 170.0,76.0 L92.0,76.0 C92.0,63.8 82.2,54.0 70.0,54.0 C57.8,54.0 48.0,63.8 48.0,76.0 L18,76 Z" fill="url(#shCROSSOVER)"/>
      <path d="M93,21 L116,21 L116,37 L82,37 Z" fill="url(#glCROSSOVER)"/>
      <path d="M122,21 L148,21 L148,37 L122,37 Z" fill="url(#glCROSSOVER)"/>
      <path d="M154,21 L170,21 L186,37 L154,37 Z" fill="url(#glCROSSOVER)"/>
      <path d="M28,44 C70,38 150,37 216,44" fill="none" stroke="#ffffff" strokeOpacity=".22" strokeWidth="1.6"/>
      <circle cx="70" cy="74" r="18" fill="#141419"/>
      <circle cx="70" cy="74" r="13.5" fill="#26282f"/>
      <ellipse cx="70" cy="74" rx="8.5" ry="8.5" fill="url(#rmCROSSOVER)"/>
      <path d="M72.0,71.2 L71.4,66.4 L68.6,66.4 L68.0,71.2 Z" fill="#3f444d"/>
      <path d="M73.3,75.0 L77.7,73.0 L76.8,70.3 L72.0,71.2 Z" fill="#3f444d"/>
      <path d="M70.0,77.4 L73.3,81.0 L75.6,79.3 L73.3,75.1 Z" fill="#3f444d"/>
      <path d="M66.7,75.1 L64.4,79.3 L66.7,81.0 L70.0,77.4 Z" fill="#3f444d"/>
      <path d="M68.0,71.2 L63.2,70.3 L62.3,73.0 L66.7,75.0 Z" fill="#3f444d"/>
      <circle cx="70" cy="74" r="2.6" fill="#4a4f58"/>
      <circle cx="192" cy="74" r="18" fill="#141419"/>
      <circle cx="192" cy="74" r="13.5" fill="#26282f"/>
      <ellipse cx="192" cy="74" rx="8.5" ry="8.5" fill="url(#rmCROSSOVER)"/>
      <path d="M194.0,71.2 L193.4,66.4 L190.6,66.4 L190.0,71.2 Z" fill="#3f444d"/>
      <path d="M195.3,75.0 L199.7,73.0 L198.8,70.3 L194.0,71.2 Z" fill="#3f444d"/>
      <path d="M192.0,77.4 L195.3,81.0 L197.6,79.3 L195.3,75.1 Z" fill="#3f444d"/>
      <path d="M188.7,75.1 L186.4,79.3 L188.7,81.0 L192.0,77.4 Z" fill="#3f444d"/>
      <path d="M190.0,71.2 L185.2,70.3 L184.3,73.0 L188.7,75.0 Z" fill="#3f444d"/>
      <circle cx="192" cy="74" r="2.6" fill="#4a4f58"/>
    </svg>
  ),

  // ─── COUPE: neechi chhat jiska peak aage, fastback rear, ek lambi window
  COUPE: (
    <svg viewBox="0 0 266 104" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
      <linearGradient id="shCOUPE" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#ffffff" stopOpacity="0.30"/>
      <stop offset="0.30" stopColor="#ffffff" stopOpacity="0.10"/>
      <stop offset="0.52" stopColor="#ffffff" stopOpacity="0.00"/>
      <stop offset="0.70" stopColor="#000000" stopOpacity="0.10"/>
      <stop offset="1" stopColor="#000000" stopOpacity="0.34"/>
      </linearGradient>
      <linearGradient id="glCOUPE" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#2b3b52" stopOpacity="1"/>
      <stop offset="0.55" stopColor="#141d2b" stopOpacity="1"/>
      <stop offset="1" stopColor="#0b1220" stopOpacity="1"/>
      </linearGradient>
      <radialGradient id="gsCOUPE">
      <stop offset="0" stopColor="#000000" stopOpacity="0.34"/>
      <stop offset="0.6" stopColor="#000000" stopOpacity="0.16"/>
      <stop offset="1" stopColor="#000000" stopOpacity="0"/>
      </radialGradient>
      <radialGradient id="rmCOUPE">
      <stop offset="0" stopColor="#cfd4db" stopOpacity="1"/>
      <stop offset="1" stopColor="#7b818b" stopOpacity="1"/>
      </radialGradient>
      </defs>
      <ellipse cx="130" cy="95" rx="128" ry="8" fill="url(#gsCOUPE)"/>
      <path d="M12,76 C12,64 14,56 22,52 C33,46 48,43 68,41 L94,27 C99,23 105,22 112,22 L138,22 C147,22 153,25 158,31 L196,50 L236,54 C244,56 248,60 248,67 L248,76 L221.0,76.0 C221.0,64.4 211.6,55.0 200.0,55.0 C188.4,55.0 179.0,64.4 179.0,76.0 L91.0,76.0 C91.0,64.4 81.6,55.0 70.0,55.0 C58.4,55.0 49.0,64.4 49.0,76.0 L12,76 Z" fill="currentColor"/>
      <path d="M12,76 C12,64 14,56 22,52 C33,46 48,43 68,41 L94,27 C99,23 105,22 112,22 L138,22 C147,22 153,25 158,31 L196,50 L236,54 C244,56 248,60 248,67 L248,76 L221.0,76.0 C221.0,64.4 211.6,55.0 200.0,55.0 C188.4,55.0 179.0,64.4 179.0,76.0 L91.0,76.0 C91.0,64.4 81.6,55.0 70.0,55.0 C58.4,55.0 49.0,64.4 49.0,76.0 L12,76 Z" fill="url(#shCOUPE)"/>
      <path d="M101,28 L136,28 L150,42 L90,42 Z" fill="url(#glCOUPE)"/>
      <path d="M22,52 C60,45 130,44 196,50 L236,55" fill="none" stroke="#ffffff" strokeOpacity=".22" strokeWidth="1.6"/>
      <circle cx="70" cy="74" r="18" fill="#141419"/>
      <circle cx="70" cy="74" r="13.5" fill="#26282f"/>
      <ellipse cx="70" cy="74" rx="8.5" ry="8.5" fill="url(#rmCOUPE)"/>
      <path d="M72.0,71.2 L71.4,66.4 L68.6,66.4 L68.0,71.2 Z" fill="#3f444d"/>
      <path d="M73.3,75.0 L77.7,73.0 L76.8,70.3 L72.0,71.2 Z" fill="#3f444d"/>
      <path d="M70.0,77.4 L73.3,81.0 L75.6,79.3 L73.3,75.1 Z" fill="#3f444d"/>
      <path d="M66.7,75.1 L64.4,79.3 L66.7,81.0 L70.0,77.4 Z" fill="#3f444d"/>
      <path d="M68.0,71.2 L63.2,70.3 L62.3,73.0 L66.7,75.0 Z" fill="#3f444d"/>
      <circle cx="70" cy="74" r="2.6" fill="#4a4f58"/>
      <circle cx="200" cy="74" r="18" fill="#141419"/>
      <circle cx="200" cy="74" r="13.5" fill="#26282f"/>
      <ellipse cx="200" cy="74" rx="8.5" ry="8.5" fill="url(#rmCOUPE)"/>
      <path d="M202.0,71.2 L201.4,66.4 L198.6,66.4 L198.0,71.2 Z" fill="#3f444d"/>
      <path d="M203.3,75.0 L207.7,73.0 L206.8,70.3 L202.0,71.2 Z" fill="#3f444d"/>
      <path d="M200.0,77.4 L203.3,81.0 L205.6,79.3 L203.3,75.1 Z" fill="#3f444d"/>
      <path d="M196.7,75.1 L194.4,79.3 L196.7,81.0 L200.0,77.4 Z" fill="#3f444d"/>
      <path d="M198.0,71.2 L193.2,70.3 L192.3,73.0 L196.7,75.0 Z" fill="#3f444d"/>
      <circle cx="200" cy="74" r="2.6" fill="#4a4f58"/>
    </svg>
  ),

  // ─── PICKUP: cab + khuli bed, sabse lamba wheelbase
  PICKUP: (
    <svg viewBox="0 0 266 104" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
      <linearGradient id="shPICKUP" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#ffffff" stopOpacity="0.30"/>
      <stop offset="0.30" stopColor="#ffffff" stopOpacity="0.10"/>
      <stop offset="0.52" stopColor="#ffffff" stopOpacity="0.00"/>
      <stop offset="0.70" stopColor="#000000" stopOpacity="0.10"/>
      <stop offset="1" stopColor="#000000" stopOpacity="0.34"/>
      </linearGradient>
      <linearGradient id="glPICKUP" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#2b3b52" stopOpacity="1"/>
      <stop offset="0.55" stopColor="#141d2b" stopOpacity="1"/>
      <stop offset="1" stopColor="#0b1220" stopOpacity="1"/>
      </linearGradient>
      <radialGradient id="gsPICKUP">
      <stop offset="0" stopColor="#000000" stopOpacity="0.34"/>
      <stop offset="0.6" stopColor="#000000" stopOpacity="0.16"/>
      <stop offset="1" stopColor="#000000" stopOpacity="0"/>
      </radialGradient>
      <radialGradient id="rmPICKUP">
      <stop offset="0" stopColor="#cfd4db" stopOpacity="1"/>
      <stop offset="1" stopColor="#7b818b" stopOpacity="1"/>
      </radialGradient>
      </defs>
      <ellipse cx="133" cy="95" rx="129" ry="8" fill="url(#gsPICKUP)"/>
      <path d="M14,76 C14,54 16,44 24,40 C33,36 42,34 52,32 L68,16 C71,13 75,12 81,12 L134,12 C143,12 149,15 152,22 L158,34 L158,38 L168,38 L168,34 L246,34 C250,34 252,36 252,40 L252,76 L227.0,76.0 C227.0,63.3 216.7,53.0 204.0,53.0 C191.3,53.0 181.0,63.3 181.0,76.0 L87.0,76.0 C87.0,63.3 76.7,53.0 64.0,53.0 C51.3,53.0 41.0,63.3 41.0,76.0 L14,76 Z" fill="currentColor"/>
      <path d="M14,76 C14,54 16,44 24,40 C33,36 42,34 52,32 L68,16 C71,13 75,12 81,12 L134,12 C143,12 149,15 152,22 L158,34 L158,38 L168,38 L168,34 L246,34 C250,34 252,36 252,40 L252,76 L227.0,76.0 C227.0,63.3 216.7,53.0 204.0,53.0 C191.3,53.0 181.0,63.3 181.0,76.0 L87.0,76.0 C87.0,63.3 76.7,53.0 64.0,53.0 C51.3,53.0 41.0,63.3 41.0,76.0 L14,76 Z" fill="url(#shPICKUP)"/>
      <path d="M168,40 L246,40 L246,60 L168,60 Z" fill="#000" opacity=".42"/>
      <path d="M75,18 L102,18 L102,34 L64,34 Z" fill="url(#glPICKUP)"/>
      <path d="M108,18 L132,18 L144,34 L108,34 Z" fill="url(#glPICKUP)"/>
      <path d="M24,40 C50,35 110,34 158,36" fill="none" stroke="#ffffff" strokeOpacity=".22" strokeWidth="1.6"/>
      <circle cx="64" cy="74" r="18" fill="#141419"/>
      <circle cx="64" cy="74" r="13.5" fill="#26282f"/>
      <ellipse cx="64" cy="74" rx="8.5" ry="8.5" fill="url(#rmPICKUP)"/>
      <path d="M66.0,71.2 L65.4,66.4 L62.6,66.4 L62.0,71.2 Z" fill="#3f444d"/>
      <path d="M67.3,75.0 L71.7,73.0 L70.8,70.3 L66.0,71.2 Z" fill="#3f444d"/>
      <path d="M64.0,77.4 L67.3,81.0 L69.6,79.3 L67.3,75.1 Z" fill="#3f444d"/>
      <path d="M60.7,75.1 L58.4,79.3 L60.7,81.0 L64.0,77.4 Z" fill="#3f444d"/>
      <path d="M62.0,71.2 L57.2,70.3 L56.3,73.0 L60.7,75.0 Z" fill="#3f444d"/>
      <circle cx="64" cy="74" r="2.6" fill="#4a4f58"/>
      <circle cx="204" cy="74" r="18" fill="#141419"/>
      <circle cx="204" cy="74" r="13.5" fill="#26282f"/>
      <ellipse cx="204" cy="74" rx="8.5" ry="8.5" fill="url(#rmPICKUP)"/>
      <path d="M206.0,71.2 L205.4,66.4 L202.6,66.4 L202.0,71.2 Z" fill="#3f444d"/>
      <path d="M207.3,75.0 L211.7,73.0 L210.8,70.3 L206.0,71.2 Z" fill="#3f444d"/>
      <path d="M204.0,77.4 L207.3,81.0 L209.6,79.3 L207.3,75.1 Z" fill="#3f444d"/>
      <path d="M200.7,75.1 L198.4,79.3 L200.7,81.0 L204.0,77.4 Z" fill="#3f444d"/>
      <path d="M202.0,71.2 L197.2,70.3 L196.3,73.0 L200.7,75.0 Z" fill="#3f444d"/>
      <circle cx="204" cy="74" r="2.6" fill="#4a4f58"/>
    </svg>
  ),

  // ─── VAN: chhota bonnet phir bara cargo box, door seams
  VAN: (
    <svg viewBox="0 0 266 104" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
      <linearGradient id="shVAN" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#ffffff" stopOpacity="0.30"/>
      <stop offset="0.30" stopColor="#ffffff" stopOpacity="0.10"/>
      <stop offset="0.52" stopColor="#ffffff" stopOpacity="0.00"/>
      <stop offset="0.70" stopColor="#000000" stopOpacity="0.10"/>
      <stop offset="1" stopColor="#000000" stopOpacity="0.34"/>
      </linearGradient>
      <linearGradient id="glVAN" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#2b3b52" stopOpacity="1"/>
      <stop offset="0.55" stopColor="#141d2b" stopOpacity="1"/>
      <stop offset="1" stopColor="#0b1220" stopOpacity="1"/>
      </linearGradient>
      <radialGradient id="gsVAN">
      <stop offset="0" stopColor="#000000" stopOpacity="0.34"/>
      <stop offset="0.6" stopColor="#000000" stopOpacity="0.16"/>
      <stop offset="1" stopColor="#000000" stopOpacity="0"/>
      </radialGradient>
      <radialGradient id="rmVAN">
      <stop offset="0" stopColor="#cfd4db" stopOpacity="1"/>
      <stop offset="1" stopColor="#7b818b" stopOpacity="1"/>
      </radialGradient>
      </defs>
      <ellipse cx="132" cy="95" rx="128" ry="8" fill="url(#gsVAN)"/>
      <path d="M14,76 C14,52 15,38 20,33 C24,29 29,28 36,27 L50,13 C53,10 57,9 63,9 L228,9 C240,9 248,14 250,24 L250,76 L228.0,76.0 C228.0,63.8 218.2,54.0 206.0,54.0 C193.8,54.0 184.0,63.8 184.0,76.0 L86.0,76.0 C86.0,63.8 76.2,54.0 64.0,54.0 C51.8,54.0 42.0,63.8 42.0,76.0 L14,76 Z" fill="currentColor"/>
      <path d="M14,76 C14,52 15,38 20,33 C24,29 29,28 36,27 L50,13 C53,10 57,9 63,9 L228,9 C240,9 248,14 250,24 L250,76 L228.0,76.0 C228.0,63.8 218.2,54.0 206.0,54.0 C193.8,54.0 184.0,63.8 184.0,76.0 L86.0,76.0 C86.0,63.8 76.2,54.0 64.0,54.0 C51.8,54.0 42.0,63.8 42.0,76.0 L14,76 Z" fill="url(#shVAN)"/>
      <path d="M132,15 L133.6,15 L133.6,45 L132,45 Z" fill="#000" opacity=".22"/>
      <path d="M186,15 L187.6,15 L187.6,45 L186,45 Z" fill="#000" opacity=".22"/>
      <path d="M57,15 L84,15 L84,33 L46,33 Z" fill="url(#glVAN)"/>
      <path d="M90,15 L120,15 L120,33 L90,33 Z" fill="url(#glVAN)"/>
      <path d="M20,52 L250,52" fill="none" stroke="#ffffff" strokeOpacity=".22" strokeWidth="1.6"/>
      <circle cx="64" cy="74" r="18" fill="#141419"/>
      <circle cx="64" cy="74" r="13.5" fill="#26282f"/>
      <ellipse cx="64" cy="74" rx="8.5" ry="8.5" fill="url(#rmVAN)"/>
      <path d="M66.0,71.2 L65.4,66.4 L62.6,66.4 L62.0,71.2 Z" fill="#3f444d"/>
      <path d="M67.3,75.0 L71.7,73.0 L70.8,70.3 L66.0,71.2 Z" fill="#3f444d"/>
      <path d="M64.0,77.4 L67.3,81.0 L69.6,79.3 L67.3,75.1 Z" fill="#3f444d"/>
      <path d="M60.7,75.1 L58.4,79.3 L60.7,81.0 L64.0,77.4 Z" fill="#3f444d"/>
      <path d="M62.0,71.2 L57.2,70.3 L56.3,73.0 L60.7,75.0 Z" fill="#3f444d"/>
      <circle cx="64" cy="74" r="2.6" fill="#4a4f58"/>
      <circle cx="206" cy="74" r="18" fill="#141419"/>
      <circle cx="206" cy="74" r="13.5" fill="#26282f"/>
      <ellipse cx="206" cy="74" rx="8.5" ry="8.5" fill="url(#rmVAN)"/>
      <path d="M208.0,71.2 L207.4,66.4 L204.6,66.4 L204.0,71.2 Z" fill="#3f444d"/>
      <path d="M209.3,75.0 L213.7,73.0 L212.8,70.3 L208.0,71.2 Z" fill="#3f444d"/>
      <path d="M206.0,77.4 L209.3,81.0 L211.6,79.3 L209.3,75.1 Z" fill="#3f444d"/>
      <path d="M202.7,75.1 L200.4,79.3 L202.7,81.0 L206.0,77.4 Z" fill="#3f444d"/>
      <path d="M204.0,71.2 L199.2,70.3 L198.3,73.0 L202.7,75.0 Z" fill="#3f444d"/>
      <circle cx="206" cy="74" r="2.6" fill="#4a4f58"/>
    </svg>
  ),

  // ─── MINIVAN: goal dhalwan nose, ooncha, lamba glasshouse
  MINIVAN: (
    <svg viewBox="0 0 266 104" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
      <linearGradient id="shMINIVAN" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#ffffff" stopOpacity="0.30"/>
      <stop offset="0.30" stopColor="#ffffff" stopOpacity="0.10"/>
      <stop offset="0.52" stopColor="#ffffff" stopOpacity="0.00"/>
      <stop offset="0.70" stopColor="#000000" stopOpacity="0.10"/>
      <stop offset="1" stopColor="#000000" stopOpacity="0.34"/>
      </linearGradient>
      <linearGradient id="glMINIVAN" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#2b3b52" stopOpacity="1"/>
      <stop offset="0.55" stopColor="#141d2b" stopOpacity="1"/>
      <stop offset="1" stopColor="#0b1220" stopOpacity="1"/>
      </linearGradient>
      <radialGradient id="gsMINIVAN">
      <stop offset="0" stopColor="#000000" stopOpacity="0.34"/>
      <stop offset="0.6" stopColor="#000000" stopOpacity="0.16"/>
      <stop offset="1" stopColor="#000000" stopOpacity="0"/>
      </radialGradient>
      <radialGradient id="rmMINIVAN">
      <stop offset="0" stopColor="#cfd4db" stopOpacity="1"/>
      <stop offset="1" stopColor="#7b818b" stopOpacity="1"/>
      </radialGradient>
      </defs>
      <ellipse cx="131" cy="95" rx="125" ry="8" fill="url(#gsMINIVAN)"/>
      <path d="M16,76 C16,52 18,40 26,35 C34,30 42,28 50,26 L68,14 C72,11 77,10 84,10 L202,10 C214,10 222,14 227,23 L238,40 C244,43 246,48 246,55 L246,76 L222.0,76.0 C222.0,63.8 212.2,54.0 200.0,54.0 C187.8,54.0 178.0,63.8 178.0,76.0 L88.0,76.0 C88.0,63.8 78.2,54.0 66.0,54.0 C53.8,54.0 44.0,63.8 44.0,76.0 L16,76 Z" fill="currentColor"/>
      <path d="M16,76 C16,52 18,40 26,35 C34,30 42,28 50,26 L68,14 C72,11 77,10 84,10 L202,10 C214,10 222,14 227,23 L238,40 C244,43 246,48 246,55 L246,76 L222.0,76.0 C222.0,63.8 212.2,54.0 200.0,54.0 C187.8,54.0 178.0,63.8 178.0,76.0 L88.0,76.0 C88.0,63.8 78.2,54.0 66.0,54.0 C53.8,54.0 44.0,63.8 44.0,76.0 L16,76 Z" fill="url(#shMINIVAN)"/>
      <path d="M78,16 L106,16 L106,32 L64,32 Z" fill="url(#glMINIVAN)"/>
      <path d="M112,16 L148,16 L148,32 L112,32 Z" fill="url(#glMINIVAN)"/>
      <path d="M154,16 L200,16 L214,32 L154,32 Z" fill="url(#glMINIVAN)"/>
      <path d="M26,35 C70,29 160,28 238,40" fill="none" stroke="#ffffff" strokeOpacity=".22" strokeWidth="1.6"/>
      <circle cx="66" cy="74" r="18" fill="#141419"/>
      <circle cx="66" cy="74" r="13.5" fill="#26282f"/>
      <ellipse cx="66" cy="74" rx="8.5" ry="8.5" fill="url(#rmMINIVAN)"/>
      <path d="M68.0,71.2 L67.4,66.4 L64.6,66.4 L64.0,71.2 Z" fill="#3f444d"/>
      <path d="M69.3,75.0 L73.7,73.0 L72.8,70.3 L68.0,71.2 Z" fill="#3f444d"/>
      <path d="M66.0,77.4 L69.3,81.0 L71.6,79.3 L69.3,75.1 Z" fill="#3f444d"/>
      <path d="M62.7,75.1 L60.4,79.3 L62.7,81.0 L66.0,77.4 Z" fill="#3f444d"/>
      <path d="M64.0,71.2 L59.2,70.3 L58.3,73.0 L62.7,75.0 Z" fill="#3f444d"/>
      <circle cx="66" cy="74" r="2.6" fill="#4a4f58"/>
      <circle cx="200" cy="74" r="18" fill="#141419"/>
      <circle cx="200" cy="74" r="13.5" fill="#26282f"/>
      <ellipse cx="200" cy="74" rx="8.5" ry="8.5" fill="url(#rmMINIVAN)"/>
      <path d="M202.0,71.2 L201.4,66.4 L198.6,66.4 L198.0,71.2 Z" fill="#3f444d"/>
      <path d="M203.3,75.0 L207.7,73.0 L206.8,70.3 L202.0,71.2 Z" fill="#3f444d"/>
      <path d="M200.0,77.4 L203.3,81.0 L205.6,79.3 L203.3,75.1 Z" fill="#3f444d"/>
      <path d="M196.7,75.1 L194.4,79.3 L196.7,81.0 L200.0,77.4 Z" fill="#3f444d"/>
      <path d="M198.0,71.2 L193.2,70.3 L192.3,73.0 L196.7,75.0 Z" fill="#3f444d"/>
      <circle cx="200" cy="74" r="2.6" fill="#4a4f58"/>
    </svg>
  ),
};

// ── BODY TYPES
export const BODY_TYPES = [
  { type: 'SEDAN',     label: 'Sedan',     desc: 'Family favourite, smooth ride',   color: '#3b82f6' },
  { type: 'SUV',       label: 'SUV',       desc: 'Road ki badshah, high ground',     color: '#10b981' },
  { type: 'HATCHBACK', label: 'Hatchback', desc: 'City mein perfect, parking easy',  color: '#f59e0b' },
  { type: 'CROSSOVER', label: 'Crossover', desc: 'Best of both worlds',              color: '#8b5cf6' },
  { type: 'COUPE',     label: 'Coupe',     desc: 'Sports look, thrill pakad lo',     color: '#ef4444' },
  { type: 'PICKUP',    label: 'Pickup',    desc: 'Kaam ka saathi, mazboot',          color: '#f97316' },
  { type: 'VAN',       label: 'Van',       desc: 'Zyada sawari, zyada saman',        color: '#64748b' },
  { type: 'MINIVAN',   label: 'Minivan',   desc: 'Family trips ke liye ideal',       color: '#0ea5e9' },
];