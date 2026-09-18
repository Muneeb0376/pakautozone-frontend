'use client';

/**
 * ✅ FIXED frontend/app/(main)/page.jsx
 *
 * Changes:
 * 1. ✅ Brand logos — real logos via Clearbit API, fallback to text abbr
 * 2. ✅ Body Type cards — real Unsplash images + 3D mouse-tracking tilt (360° feel)
 * 3. ✅ Navigation already correct: /cars?brand=Toyota / /cars?bodyType=SEDAN
 *    (cars page now reads these — see cars-page-FIXED.jsx)
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, ChevronRight, ChevronLeft, MapPin, Gauge, ArrowRight,
  Car, Wrench, ShieldCheck, ArrowLeftRight, Sparkles,
} from 'lucide-react';
import { useLang } from '@/lib/i18nContext'; // ✅ FIX: language switch ke liye

const API  = process.env.NEXT_PUBLIC_API_URL || '/api';
const BASE = API.replace('/api', '');

const getImg = (raw) => {
  if (!raw) return null;
  const url = typeof raw === 'string' ? raw : raw.url;
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${BASE}${url.startsWith('/') ? '' : '/'}${url}`;
};

// ── BRANDS — domain added for Clearbit logo
const BRANDS = [
  { name: 'Toyota',   slug: 'toyota',   abbr: 'TOY', color: '#EB0A1E', bg: '#fff1f1', domain: 'toyota.com' },
  { name: 'Honda',    slug: 'honda',    abbr: 'HON', color: '#CC0000', bg: '#fff1f1', domain: 'honda.com' },
  { name: 'Suzuki',   slug: 'suzuki',   abbr: 'SUZ', color: '#003087', bg: '#eef3ff', domain: 'suzuki.com' },
  { name: 'Kia',      slug: 'kia',      abbr: 'KIA', color: '#05141F', bg: '#eef0f3', domain: 'kia.com' },
  { name: 'Hyundai',  slug: 'hyundai',  abbr: 'HYU', color: '#002C5F', bg: '#eef3ff', domain: 'hyundai.com' },
  { name: 'Changan',  slug: 'changan',  abbr: 'CHA', color: '#0066CC', bg: '#eef6ff', domain: 'changan.com.cn' },
  { name: 'MG',       slug: 'mg',       abbr: 'MG',  color: '#B22222', bg: '#fff1f1', domain: 'mgmotor.com' },
  { name: 'Daihatsu', slug: 'daihatsu', abbr: 'DAI', color: '#CC0000', bg: '#fff1f1', domain: 'daihatsu.com' },
  { name: 'Nissan',   slug: 'nissan',   abbr: 'NIS', color: '#C3002F', bg: '#fff1f1', domain: 'nissan.com' },
  { name: 'BMW',      slug: 'bmw',      abbr: 'BMW', color: '#0066B1', bg: '#eef6ff', domain: 'bmw.com' },
  { name: 'Mercedes', slug: 'mercedes', abbr: 'MER', color: '#222222', bg: '#f3f3f3', domain: 'mercedes-benz.com' },
  { name: 'Audi',     slug: 'audi',     abbr: 'AUD', color: '#BB0A21', bg: '#fff1f1', domain: 'audi.com' },
];

// ── BODY TYPE SVG SILHOUETTES — har type ka sahi aur distinct shape
const BODY_TYPE_SVGS = {
  // ─── SEDAN: classic 3-box — long hood, distinct trunk, smooth roofline
  SEDAN: (
    <svg viewBox="0 0 240 80" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <ellipse cx="120" cy="75" rx="95" ry="4" fill="currentColor" opacity="0.1"/>
      {/* Main body — long, low, 3-box */}
      <path d="M18 57 L18 48 Q20 40 32 38 Q42 36 52 37 L52 57 Z" fill="currentColor" opacity="0.9"/>
      <path d="M52 57 L52 37 L170 37 L178 40 Q192 44 208 52 L210 57 Z" fill="currentColor" opacity="0.95"/>
      {/* Trunk — distinct raised box */}
      <rect x="18" y="40" width="34" height="17" rx="2" fill="currentColor" opacity="0.85"/>
      {/* Cabin — sits on top of body, notched shape */}
      <path d="M68 37 Q72 22 90 17 Q108 13 138 13 Q158 13 168 20 Q176 26 178 37 Z" fill="currentColor" opacity="0.92"/>
      {/* Front windshield */}
      <path d="M168 20 Q176 26 178 37 L170 37 Q168 27 162 22 Z" fill="white" opacity="0.22"/>
      {/* Rear windshield */}
      <path d="M68 37 Q72 22 80 18 L76 37 Z" fill="white" opacity="0.18"/>
      {/* Side windows */}
      <path d="M83 36 Q86 20 106 16 Q126 13 142 14 L142 35 Q122 36 102 37 Z" fill="white" opacity="0.15"/>
      {/* B-pillar */}
      <rect x="120" y="14" width="3" height="23" rx="1" fill="currentColor" opacity="0.5"/>
      {/* Door line */}
      <line x1="120" y1="37" x2="120" y2="57" stroke="white" strokeWidth="0.8" opacity="0.2"/>
      {/* Headlight — long horizontal */}
      <rect x="200" y="44" width="12" height="5" rx="2.5" fill="white" opacity="0.55"/>
      <rect x="205" y="45" width="6" height="3" rx="1.5" fill="white" opacity="0.7"/>
      {/* Tail light */}
      <rect x="18" y="42" width="4" height="8" rx="2" fill="white" opacity="0.35"/>
      {/* Boot lip / trunk lid line */}
      <line x1="52" y1="37" x2="52" y2="57" stroke="white" strokeWidth="1.2" opacity="0.3"/>
      <g>
        <circle cx="53" cy="62" r="13" fill="white" opacity="0.07"/>
        <circle cx="53" cy="62" r="11" fill="none" stroke="currentColor" strokeWidth="2.5" opacity="0.95"/>
        <circle cx="53" cy="62" r="10" fill="currentColor" opacity="0.18"/>
        <circle cx="53" cy="62" r="8" fill="currentColor" opacity="0.72"/>
        <line x1="53" y1="55" x2="53" y2="69" stroke="white" strokeWidth="1" opacity="0.45"/>
        <line x1="46" y1="62" x2="60" y2="62" stroke="white" strokeWidth="1" opacity="0.45"/>
        <line x1="47" y1="56" x2="59" y2="68" stroke="white" strokeWidth="0.8" opacity="0.3"/>
        <line x1="59" y1="56" x2="47" y2="68" stroke="white" strokeWidth="0.8" opacity="0.3"/>
        <circle cx="53" cy="62" r="2.5" fill="white" opacity="0.7"/>
      </g>
      <g>
        <circle cx="178" cy="62" r="13" fill="white" opacity="0.07"/>
        <circle cx="178" cy="62" r="11" fill="none" stroke="currentColor" strokeWidth="2.5" opacity="0.95"/>
        <circle cx="178" cy="62" r="10" fill="currentColor" opacity="0.18"/>
        <circle cx="178" cy="62" r="8" fill="currentColor" opacity="0.72"/>
        <line x1="178" y1="55" x2="178" y2="69" stroke="white" strokeWidth="1" opacity="0.45"/>
        <line x1="171" y1="62" x2="185" y2="62" stroke="white" strokeWidth="1" opacity="0.45"/>
        <line x1="172" y1="56" x2="184" y2="68" stroke="white" strokeWidth="0.8" opacity="0.3"/>
        <line x1="184" y1="56" x2="172" y2="68" stroke="white" strokeWidth="0.8" opacity="0.3"/>
        <circle cx="178" cy="62" r="2.5" fill="white" opacity="0.7"/>
      </g>
    </svg>
  ),

  // ─── SUV: tall boxy body, short overhangs, vertical windshield, roof rails
  SUV: (
    <svg viewBox="0 0 240 80" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <ellipse cx="120" cy="75" rx="97" ry="4" fill="currentColor" opacity="0.1"/>
      {/* Roof rails */}
      <rect x="60" y="5" width="112" height="2.5" rx="1.2" fill="currentColor" opacity="0.5"/>
      <rect x="66" y="3" width="3" height="4" rx="1" fill="currentColor" opacity="0.4"/>
      <rect x="100" y="3" width="3" height="4" rx="1" fill="currentColor" opacity="0.4"/>
      <rect x="134" y="3" width="3" height="4" rx="1" fill="currentColor" opacity="0.4"/>
      <rect x="165" y="3" width="3" height="4" rx="1" fill="currentColor" opacity="0.4"/>
      {/* Main body — tall, boxy, high ride height */}
      <path d="M20 58 L20 28 Q22 20 38 18 L44 8 L172 8 Q184 8 196 20 L208 32 L212 58 Z" fill="currentColor" opacity="0.95"/>
      {/* Front face — near-vertical */}
      <path d="M196 20 L208 32 L208 58 L196 58 L196 20 Z" fill="currentColor" opacity="0.8"/>
      {/* Windshield — steep but not as raked as sedan */}
      <path d="M172 8 Q184 8 195 20 L188 22 Q180 12 172 10 Z" fill="white" opacity="0.22"/>
      {/* Side windows — tall & square */}
      <rect x="48" y="10" width="36" height="22" rx="3" fill="white" opacity="0.15"/>
      <rect x="88" y="9" width="38" height="23" rx="3" fill="white" opacity="0.15"/>
      <rect x="130" y="9" width="36" height="22" rx="3" fill="white" opacity="0.15"/>
      {/* Rear window (5th door) */}
      <rect x="170" y="10" width="18" height="20" rx="3" fill="white" opacity="0.12"/>
      {/* B and C pillars */}
      <rect x="86" y="8" width="4" height="50" rx="1.5" fill="currentColor" opacity="0.45"/>
      <rect x="128" y="8" width="4" height="50" rx="1.5" fill="currentColor" opacity="0.45"/>
      <rect x="168" y="8" width="4" height="50" rx="1.5" fill="currentColor" opacity="0.4"/>
      {/* Ground clearance — visible gap */}
      <line x1="20" y1="58" x2="212" y2="58" stroke="white" strokeWidth="0.7" opacity="0.2"/>
      {/* Headlight — square */}
      <rect x="200" y="32" width="14" height="10" rx="3" fill="white" opacity="0.5"/>
      <rect x="204" y="34" width="8" height="6" rx="2" fill="white" opacity="0.7"/>
      {/* Tail light */}
      <rect x="18" y="30" width="4" height="16" rx="2" fill="white" opacity="0.35"/>
      {/* Skid plate / bumper bottom */}
      <rect x="196" y="54" width="18" height="5" rx="2" fill="currentColor" opacity="0.5"/>
      <rect x="20" y="54" width="12" height="5" rx="2" fill="currentColor" opacity="0.45"/>
      <g>
        <circle cx="56" cy="64" r="15" fill="white" opacity="0.07"/>
        <circle cx="56" cy="64" r="13" fill="none" stroke="currentColor" strokeWidth="2.5" opacity="0.95"/>
        <circle cx="56" cy="64" r="12" fill="currentColor" opacity="0.18"/>
        <circle cx="56" cy="64" r="10" fill="currentColor" opacity="0.72"/>
        <line x1="56" y1="55" x2="56" y2="73" stroke="white" strokeWidth="1" opacity="0.45"/>
        <line x1="47" y1="64" x2="65" y2="64" stroke="white" strokeWidth="1" opacity="0.45"/>
        <line x1="48" y1="56" x2="64" y2="72" stroke="white" strokeWidth="0.8" opacity="0.3"/>
        <line x1="64" y1="56" x2="48" y2="72" stroke="white" strokeWidth="0.8" opacity="0.3"/>
        <circle cx="56" cy="64" r="2.5" fill="white" opacity="0.7"/>
      </g>
      <g>
        <circle cx="184" cy="64" r="15" fill="white" opacity="0.07"/>
        <circle cx="184" cy="64" r="13" fill="none" stroke="currentColor" strokeWidth="2.5" opacity="0.95"/>
        <circle cx="184" cy="64" r="12" fill="currentColor" opacity="0.18"/>
        <circle cx="184" cy="64" r="10" fill="currentColor" opacity="0.72"/>
        <line x1="184" y1="55" x2="184" y2="73" stroke="white" strokeWidth="1" opacity="0.45"/>
        <line x1="175" y1="64" x2="193" y2="64" stroke="white" strokeWidth="1" opacity="0.45"/>
        <line x1="176" y1="56" x2="192" y2="72" stroke="white" strokeWidth="0.8" opacity="0.3"/>
        <line x1="192" y1="56" x2="176" y2="72" stroke="white" strokeWidth="0.8" opacity="0.3"/>
        <circle cx="184" cy="64" r="2.5" fill="white" opacity="0.7"/>
      </g>
    </svg>
  ),

  // ─── HATCHBACK: compact, short, steep rear hatch, short trunk
  HATCHBACK: (
    <svg viewBox="0 0 240 80" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <ellipse cx="120" cy="75" rx="86" ry="4" fill="currentColor" opacity="0.1"/>
      {/* Main body — compact, short wheelbase */}
      <path d="M32 57 L32 44 Q34 38 46 36 L46 57 Z" fill="currentColor" opacity="0.88"/>
      <path d="M46 57 L46 36 L178 36 L185 40 Q196 46 200 54 L202 57 Z" fill="currentColor" opacity="0.95"/>
      {/* Cabin — short, nearly square, steep rear */}
      <path d="M60 36 Q64 20 84 15 Q104 11 138 11 Q158 11 166 18 Q173 24 176 36 Z" fill="currentColor" opacity="0.92"/>
      {/* STEEP HATCH — this is key: rear drops sharply at angle */}
      <path d="M166 18 Q174 24 176 36 L176 57 Q170 46 165 38 Z" fill="currentColor" opacity="0.7"/>
      {/* Front windshield */}
      <path d="M166 18 Q173 24 175 35 L168 35 Q166 26 162 20 Z" fill="white" opacity="0.2"/>
      {/* Rear hatch glass — steep angle */}
      <path d="M165 19 Q172 25 174 35 L164 35 Z" fill="white" opacity="0.16"/>
      {/* Side window — single large pane */}
      <path d="M66 35 Q69 21 88 16 Q108 12 138 12 Q156 12 164 19 L163 35 Z" fill="white" opacity="0.14"/>
      {/* B pillar */}
      <rect x="114" y="12" width="3" height="24" rx="1" fill="currentColor" opacity="0.5"/>
      {/* Door line */}
      <line x1="114" y1="36" x2="114" y2="57" stroke="white" strokeWidth="0.8" opacity="0.2"/>
      {/* Headlight */}
      <rect x="193" y="44" width="11" height="5" rx="2.5" fill="white" opacity="0.5"/>
      {/* Tail light */}
      <rect x="31" y="40" width="3" height="8" rx="1.5" fill="white" opacity="0.3"/>
      <g>
        <circle cx="60" cy="62" r="13" fill="white" opacity="0.07"/>
        <circle cx="60" cy="62" r="11" fill="none" stroke="currentColor" strokeWidth="2.5" opacity="0.95"/>
        <circle cx="60" cy="62" r="10" fill="currentColor" opacity="0.18"/>
        <circle cx="60" cy="62" r="8" fill="currentColor" opacity="0.72"/>
        <line x1="60" y1="55" x2="60" y2="69" stroke="white" strokeWidth="1" opacity="0.45"/>
        <line x1="53" y1="62" x2="67" y2="62" stroke="white" strokeWidth="1" opacity="0.45"/>
        <line x1="54" y1="56" x2="66" y2="68" stroke="white" strokeWidth="0.8" opacity="0.3"/>
        <line x1="66" y1="56" x2="54" y2="68" stroke="white" strokeWidth="0.8" opacity="0.3"/>
        <circle cx="60" cy="62" r="2.5" fill="white" opacity="0.7"/>
      </g>
      <g>
        <circle cx="172" cy="62" r="13" fill="white" opacity="0.07"/>
        <circle cx="172" cy="62" r="11" fill="none" stroke="currentColor" strokeWidth="2.5" opacity="0.95"/>
        <circle cx="172" cy="62" r="10" fill="currentColor" opacity="0.18"/>
        <circle cx="172" cy="62" r="8" fill="currentColor" opacity="0.72"/>
        <line x1="172" y1="55" x2="172" y2="69" stroke="white" strokeWidth="1" opacity="0.45"/>
        <line x1="165" y1="62" x2="179" y2="62" stroke="white" strokeWidth="1" opacity="0.45"/>
        <line x1="166" y1="56" x2="178" y2="68" stroke="white" strokeWidth="0.8" opacity="0.3"/>
        <line x1="178" y1="56" x2="166" y2="68" stroke="white" strokeWidth="0.8" opacity="0.3"/>
        <circle cx="172" cy="62" r="2.5" fill="white" opacity="0.7"/>
      </g>
    </svg>
  ),

  // ─── CROSSOVER: SUV height but with sloped rear like a station wagon / CUV
  CROSSOVER: (
    <svg viewBox="0 0 240 80" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <ellipse cx="120" cy="75" rx="93" ry="4" fill="currentColor" opacity="0.1"/>
      {/* Body — medium height, moderate ground clearance */}
      <path d="M24 58 L24 40 Q26 32 38 30 L38 58 Z" fill="currentColor" opacity="0.88"/>
      <path d="M38 58 L38 30 L178 30 L185 33 Q198 38 208 50 L210 58 Z" fill="currentColor" opacity="0.95"/>
      {/* Roof — higher than sedan, slopes gently at rear */}
      <path d="M56 30 Q60 14 84 10 Q110 7 148 7 Q170 7 180 16 Q188 23 190 30 Z" fill="currentColor" opacity="0.92"/>
      {/* Sloped rear — signature CUV shape, gentler than hatchback */}
      <path d="M180 16 Q188 23 190 30 L188 58 Q182 42 178 32 Z" fill="currentColor" opacity="0.68"/>
      {/* Front windshield — moderately raked */}
      <path d="M180 16 Q188 23 189 30 L182 30 Q180 23 176 18 Z" fill="white" opacity="0.2"/>
      {/* Rear slope window */}
      <path d="M178 17 Q186 24 187 30 L178 30 Z" fill="white" opacity="0.16"/>
      {/* Side windows — 3 panes */}
      <rect x="62" y="11" width="34" height="19" rx="3" fill="white" opacity="0.14"/>
      <rect x="100" y="10" width="36" height="20" rx="3" fill="white" opacity="0.14"/>
      <rect x="140" y="10" width="34" height="19" rx="3" fill="white" opacity="0.14"/>
      {/* B and C pillars */}
      <rect x="98" y="9" width="4" height="49" rx="1.5" fill="currentColor" opacity="0.42"/>
      <rect x="138" y="9" width="4" height="49" rx="1.5" fill="currentColor" opacity="0.42"/>
      {/* Ground clearance visible */}
      <line x1="24" y1="58" x2="210" y2="58" stroke="white" strokeWidth="0.6" opacity="0.2"/>
      {/* Roof rails (subtle) */}
      <rect x="64" y="6" width="108" height="2" rx="1" fill="currentColor" opacity="0.4"/>
      {/* Headlight */}
      <rect x="202" y="40" width="12" height="8" rx="3" fill="white" opacity="0.5"/>
      {/* Tail light */}
      <rect x="22" y="36" width="4" height="12" rx="2" fill="white" opacity="0.32"/>
      {/* Skid plate */}
      <rect x="198" y="54" width="14" height="5" rx="2" fill="currentColor" opacity="0.45"/>
      <g>
        <circle cx="58" cy="63" r="14" fill="white" opacity="0.07"/>
        <circle cx="58" cy="63" r="12" fill="none" stroke="currentColor" strokeWidth="2.5" opacity="0.95"/>
        <circle cx="58" cy="63" r="11" fill="currentColor" opacity="0.18"/>
        <circle cx="58" cy="63" r="9" fill="currentColor" opacity="0.72"/>
        <line x1="58" y1="55" x2="58" y2="71" stroke="white" strokeWidth="1" opacity="0.45"/>
        <line x1="50" y1="63" x2="66" y2="63" stroke="white" strokeWidth="1" opacity="0.45"/>
        <line x1="51" y1="56" x2="65" y2="70" stroke="white" strokeWidth="0.8" opacity="0.3"/>
        <line x1="65" y1="56" x2="51" y2="70" stroke="white" strokeWidth="0.8" opacity="0.3"/>
        <circle cx="58" cy="63" r="2.5" fill="white" opacity="0.7"/>
      </g>
      <g>
        <circle cx="180" cy="63" r="14" fill="white" opacity="0.07"/>
        <circle cx="180" cy="63" r="12" fill="none" stroke="currentColor" strokeWidth="2.5" opacity="0.95"/>
        <circle cx="180" cy="63" r="11" fill="currentColor" opacity="0.18"/>
        <circle cx="180" cy="63" r="9" fill="currentColor" opacity="0.72"/>
        <line x1="180" y1="55" x2="180" y2="71" stroke="white" strokeWidth="1" opacity="0.45"/>
        <line x1="172" y1="63" x2="188" y2="63" stroke="white" strokeWidth="1" opacity="0.45"/>
        <line x1="173" y1="56" x2="187" y2="70" stroke="white" strokeWidth="0.8" opacity="0.3"/>
        <line x1="187" y1="56" x2="173" y2="70" stroke="white" strokeWidth="0.8" opacity="0.3"/>
        <circle cx="180" cy="63" r="2.5" fill="white" opacity="0.7"/>
      </g>
    </svg>
  ),

  // ─── COUPE: low, very raked windshield, fastback, long hood, 2-door feel
  COUPE: (
    <svg viewBox="0 0 240 80" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <ellipse cx="120" cy="75" rx="97" ry="3.5" fill="currentColor" opacity="0.1"/>
      {/* Body — very low profile, long, sporty */}
      <path d="M14 57 L16 46 Q22 40 38 38 Q52 36 64 36 L64 57 Z" fill="currentColor" opacity="0.9"/>
      <path d="M64 57 L64 36 L178 36 L186 38 Q204 44 214 54 L216 57 Z" fill="currentColor" opacity="0.95"/>
      {/* Cabin — extremely long, very raked, roofline peaks early */}
      <path d="M74 36 Q80 15 106 10 Q130 6 158 8 Q176 10 183 20 Q188 27 188 36 Z" fill="currentColor" opacity="0.92"/>
      {/* FASTBACK rear — smooth long slope (key coupe trait) */}
      <path d="M158 8 Q176 10 183 20 Q188 27 188 36 L183 57 Q178 42 172 34 Z" fill="currentColor" opacity="0.7"/>
      {/* Very raked front windshield */}
      <path d="M158 8 Q176 10 182 19 L174 22 Q168 13 158 10 Z" fill="white" opacity="0.22"/>
      {/* Rear fastback glass */}
      <path d="M156 9 Q174 11 182 21 L172 22 Z" fill="white" opacity="0.18"/>
      {/* Long hood character line */}
      <path d="M64 36 Q80 33 98 33" stroke="white" strokeWidth="1" fill="none" opacity="0.25"/>
      {/* Side window — single sweep, long, low */}
      <path d="M80 35 Q85 17 110 11 Q134 7 156 9 Q173 11 180 20 L178 35 Z" fill="white" opacity="0.13"/>
      {/* Long rear quarter panel */}
      <path d="M64 36 Q74 25 82 15" stroke="white" strokeWidth="0.7" fill="none" opacity="0.15"/>
      {/* Headlight — sharp/angular */}
      <path d="M210 50 L218 44 L218 57 Z" fill="white" opacity="0.5"/>
      <rect x="206" y="48" width="10" height="5" rx="1.5" fill="white" opacity="0.45"/>
      {/* Tail light — thin horizontal */}
      <rect x="14" y="46" width="4" height="5" rx="2" fill="white" opacity="0.4"/>
      {/* Exhaust tips */}
      <rect x="18" y="53" width="7" height="3" rx="1.5" fill="white" opacity="0.35"/>
      <rect x="28" y="53" width="5" height="3" rx="1.5" fill="white" opacity="0.25"/>
      {/* Spoiler (subtle) */}
      <rect x="62" y="34" width="3" height="4" rx="1" fill="currentColor" opacity="0.6"/>
      <g>
        <circle cx="64" cy="62" r="13" fill="white" opacity="0.07"/>
        <circle cx="64" cy="62" r="11" fill="none" stroke="currentColor" strokeWidth="2.5" opacity="0.95"/>
        <circle cx="64" cy="62" r="10" fill="currentColor" opacity="0.18"/>
        <circle cx="64" cy="62" r="8" fill="currentColor" opacity="0.72"/>
        <line x1="64" y1="55" x2="64" y2="69" stroke="white" strokeWidth="1" opacity="0.45"/>
        <line x1="57" y1="62" x2="71" y2="62" stroke="white" strokeWidth="1" opacity="0.45"/>
        <line x1="58" y1="56" x2="70" y2="68" stroke="white" strokeWidth="0.8" opacity="0.3"/>
        <line x1="70" y1="56" x2="58" y2="68" stroke="white" strokeWidth="0.8" opacity="0.3"/>
        <circle cx="64" cy="62" r="2.5" fill="white" opacity="0.7"/>
      </g>
      <g>
        <circle cx="185" cy="62" r="13" fill="white" opacity="0.07"/>
        <circle cx="185" cy="62" r="11" fill="none" stroke="currentColor" strokeWidth="2.5" opacity="0.95"/>
        <circle cx="185" cy="62" r="10" fill="currentColor" opacity="0.18"/>
        <circle cx="185" cy="62" r="8" fill="currentColor" opacity="0.72"/>
        <line x1="185" y1="55" x2="185" y2="69" stroke="white" strokeWidth="1" opacity="0.45"/>
        <line x1="178" y1="62" x2="192" y2="62" stroke="white" strokeWidth="1" opacity="0.45"/>
        <line x1="179" y1="56" x2="191" y2="68" stroke="white" strokeWidth="0.8" opacity="0.3"/>
        <line x1="191" y1="56" x2="179" y2="68" stroke="white" strokeWidth="0.8" opacity="0.3"/>
        <circle cx="185" cy="62" r="2.5" fill="white" opacity="0.7"/>
      </g>
    </svg>
  ),

  // ─── PICKUP: open truck bed left side, enclosed cab right side, flat bed floor
  PICKUP: (
    <svg viewBox="0 0 240 80" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <ellipse cx="120" cy="75" rx="98" ry="4" fill="currentColor" opacity="0.1"/>
      {/* ── TRUCK BED (left/rear) — open top ── */}
      {/* Bed floor */}
      <rect x="14" y="46" width="84" height="11" rx="2" fill="currentColor" opacity="0.9"/>
      {/* Bed left wall */}
      <rect x="14" y="30" width="5" height="27" rx="2" fill="currentColor" opacity="0.85"/>
      {/* Bed right wall (cab side) */}
      <rect x="95" y="28" width="5" height="29" rx="2" fill="currentColor" opacity="0.85"/>
      {/* Bed inner floor */}
      <rect x="19" y="47" width="76" height="9" rx="1" fill="currentColor" opacity="0.5"/>
      {/* Bed side rail (top) */}
      <rect x="14" y="28" width="86" height="4" rx="2" fill="currentColor" opacity="0.65"/>
      {/* Bed inner slats */}
      <line x1="35" y1="47" x2="35" y2="56" stroke="white" strokeWidth="1" opacity="0.2"/>
      <line x1="55" y1="47" x2="55" y2="56" stroke="white" strokeWidth="1" opacity="0.2"/>
      <line x1="75" y1="47" x2="75" y2="56" stroke="white" strokeWidth="1" opacity="0.2"/>
      {/* Tail gate */}
      <rect x="14" y="28" width="4" height="29" rx="1.5" fill="currentColor" opacity="0.7"/>
      {/* ── CAB (right/front) ── */}
      <path d="M100 57 L100 30 Q102 20 120 15 Q140 11 164 13 Q186 15 204 28 L212 40 L214 57 Z" fill="currentColor" opacity="0.95"/>
      {/* Cab roof */}
      <path d="M102 29 Q108 17 122 14 Q142 10 164 13 Q184 15 202 27 L202 29 Z" fill="currentColor" opacity="0.85"/>
      {/* Windshield */}
      <path d="M164 13 Q184 15 201 27 L193 29 Q182 18 164 15 Z" fill="white" opacity="0.22"/>
      {/* Rear cab window */}
      <path d="M102 29 Q108 18 120 15 L118 29 Z" fill="white" opacity="0.16"/>
      {/* Side window */}
      <rect x="108" y="15" width="76" height="14" rx="3" fill="white" opacity="0.14"/>
      {/* Door line */}
      <line x1="156" y1="13" x2="156" y2="57" stroke="white" strokeWidth="1" opacity="0.18"/>
      {/* Headlight */}
      <rect x="205" y="38" width="12" height="9" rx="3" fill="white" opacity="0.5"/>
      <rect x="208" y="40" width="7" height="5" rx="2" fill="white" opacity="0.7"/>
      {/* Running board */}
      <rect x="100" y="55" width="114" height="3" rx="1.5" fill="currentColor" opacity="0.4"/>
      <g>
        <circle cx="44" cy="63" r="15" fill="white" opacity="0.07"/>
        <circle cx="44" cy="63" r="13" fill="none" stroke="currentColor" strokeWidth="2.5" opacity="0.95"/>
        <circle cx="44" cy="63" r="12" fill="currentColor" opacity="0.18"/>
        <circle cx="44" cy="63" r="10" fill="currentColor" opacity="0.72"/>
        <line x1="44" y1="54" x2="44" y2="72" stroke="white" strokeWidth="1" opacity="0.45"/>
        <line x1="35" y1="63" x2="53" y2="63" stroke="white" strokeWidth="1" opacity="0.45"/>
        <line x1="36" y1="55" x2="52" y2="71" stroke="white" strokeWidth="0.8" opacity="0.3"/>
        <line x1="52" y1="55" x2="36" y2="71" stroke="white" strokeWidth="0.8" opacity="0.3"/>
        <circle cx="44" cy="63" r="2.5" fill="white" opacity="0.7"/>
      </g>
      <g>
        <circle cx="184" cy="63" r="15" fill="white" opacity="0.07"/>
        <circle cx="184" cy="63" r="13" fill="none" stroke="currentColor" strokeWidth="2.5" opacity="0.95"/>
        <circle cx="184" cy="63" r="12" fill="currentColor" opacity="0.18"/>
        <circle cx="184" cy="63" r="10" fill="currentColor" opacity="0.72"/>
        <line x1="184" y1="54" x2="184" y2="72" stroke="white" strokeWidth="1" opacity="0.45"/>
        <line x1="175" y1="63" x2="193" y2="63" stroke="white" strokeWidth="1" opacity="0.45"/>
        <line x1="176" y1="55" x2="192" y2="71" stroke="white" strokeWidth="0.8" opacity="0.3"/>
        <line x1="192" y1="55" x2="176" y2="71" stroke="white" strokeWidth="0.8" opacity="0.3"/>
        <circle cx="184" cy="63" r="2.5" fill="white" opacity="0.7"/>
      </g>
    </svg>
  ),

  // ─── VAN: full-size cargo/passenger van — tall flat box, sliding door, vertical front
  VAN: (
    <svg viewBox="0 0 240 80" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <ellipse cx="120" cy="75" rx="98" ry="4" fill="currentColor" opacity="0.1"/>
      {/* ── MAIN BODY — full box, maximum interior height ── */}
      <rect x="18" y="12" width="192" height="46" rx="4" fill="currentColor" opacity="0.9"/>
      {/* Front face — near-vertical, flat nose */}
      <rect x="198" y="12" width="14" height="46" rx="4" fill="currentColor" opacity="0.75"/>
      {/* Windshield — upright, large */}
      <rect x="196" y="14" width="12" height="22" rx="3" fill="white" opacity="0.22"/>
      {/* Front grille strip */}
      <rect x="200" y="38" width="10" height="12" rx="2" fill="currentColor" opacity="0.5"/>
      <line x1="200" y1="40" x2="210" y2="40" stroke="white" strokeWidth="0.8" opacity="0.3"/>
      <line x1="200" y1="44" x2="210" y2="44" stroke="white" strokeWidth="0.8" opacity="0.3"/>
      <line x1="200" y1="48" x2="210" y2="48" stroke="white" strokeWidth="0.8" opacity="0.3"/>
      {/* Passenger windows — row of 4 */}
      <rect x="26" y="16" width="28" height="18" rx="3" fill="white" opacity="0.15"/>
      <rect x="60" y="16" width="28" height="18" rx="3" fill="white" opacity="0.15"/>
      <rect x="94" y="16" width="28" height="18" rx="3" fill="white" opacity="0.15"/>
      <rect x="128" y="16" width="28" height="18" rx="3" fill="white" opacity="0.15"/>
      {/* Driver cab window */}
      <rect x="162" y="16" width="30" height="18" rx="3" fill="white" opacity="0.15"/>
      {/* ── SLIDING DOOR — distinctive van feature ── */}
      {/* Sliding door outline (between windows 2 and 3) */}
      <rect x="92" y="12" width="4" height="46" rx="1.5" fill="white" opacity="0.2"/>
      {/* Sliding door handle */}
      <rect x="96" y="36" width="12" height="4" rx="2" fill="white" opacity="0.35"/>
      {/* Roof crease */}
      <line x1="18" y1="12" x2="198" y2="12" stroke="white" strokeWidth="1.5" opacity="0.2"/>
      {/* Headlight — square, positioned high */}
      <rect x="202" y="15" width="10" height="6" rx="2" fill="white" opacity="0.6"/>
      {/* Tail light */}
      <rect x="17" y="22" width="4" height="18" rx="2" fill="white" opacity="0.32"/>
      {/* Step under sliding door */}
      <rect x="94" y="56" width="36" height="4" rx="2" fill="currentColor" opacity="0.45"/>
      <g>
        <circle cx="52" cy="63" r="14" fill="white" opacity="0.07"/>
        <circle cx="52" cy="63" r="12" fill="none" stroke="currentColor" strokeWidth="2.5" opacity="0.95"/>
        <circle cx="52" cy="63" r="11" fill="currentColor" opacity="0.18"/>
        <circle cx="52" cy="63" r="9" fill="currentColor" opacity="0.72"/>
        <line x1="52" y1="55" x2="52" y2="71" stroke="white" strokeWidth="1" opacity="0.45"/>
        <line x1="44" y1="63" x2="60" y2="63" stroke="white" strokeWidth="1" opacity="0.45"/>
        <line x1="45" y1="56" x2="59" y2="70" stroke="white" strokeWidth="0.8" opacity="0.3"/>
        <line x1="59" y1="56" x2="45" y2="70" stroke="white" strokeWidth="0.8" opacity="0.3"/>
        <circle cx="52" cy="63" r="2.5" fill="white" opacity="0.7"/>
      </g>
      <g>
        <circle cx="176" cy="63" r="14" fill="white" opacity="0.07"/>
        <circle cx="176" cy="63" r="12" fill="none" stroke="currentColor" strokeWidth="2.5" opacity="0.95"/>
        <circle cx="176" cy="63" r="11" fill="currentColor" opacity="0.18"/>
        <circle cx="176" cy="63" r="9" fill="currentColor" opacity="0.72"/>
        <line x1="176" y1="55" x2="176" y2="71" stroke="white" strokeWidth="1" opacity="0.45"/>
        <line x1="168" y1="63" x2="184" y2="63" stroke="white" strokeWidth="1" opacity="0.45"/>
        <line x1="169" y1="56" x2="183" y2="70" stroke="white" strokeWidth="0.8" opacity="0.3"/>
        <line x1="183" y1="56" x2="169" y2="70" stroke="white" strokeWidth="0.8" opacity="0.3"/>
        <circle cx="176" cy="63" r="2.5" fill="white" opacity="0.7"/>
      </g>
    </svg>
  ),

  // ─── MINIVAN: tall rounded family van — lower hood, smooth roofline, seats 7-8
  MINIVAN: (
    <svg viewBox="0 0 240 80" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <ellipse cx="120" cy="75" rx="94" ry="4" fill="currentColor" opacity="0.1"/>
      {/* Main body — taller than crossover, rounded top, lower nose than van */}
      <path d="M22 58 L22 42 Q24 34 36 30 L36 58 Z" fill="currentColor" opacity="0.88"/>
      <path d="M36 58 L36 30 L188 30 L196 34 Q210 40 216 52 L218 58 Z" fill="currentColor" opacity="0.95"/>
      {/* Rounded tall roof — peak is forward, slopes to rear */}
      <path d="M48 30 Q52 10 80 7 Q108 4 152 5 Q178 6 192 14 Q200 20 202 30 Z" fill="currentColor" opacity="0.92"/>
      {/* Rear slope — minivan has mild slope, not as steep as hatchback */}
      <path d="M192 14 Q200 20 202 30 L200 58 Q194 44 190 32 Z" fill="currentColor" opacity="0.7"/>
      {/* Windshield — moderately raked */}
      <path d="M192 14 Q200 20 201 30 L194 30 Q192 21 188 16 Z" fill="white" opacity="0.2"/>
      {/* Rear window (mild slope) */}
      <path d="M190 15 Q198 21 200 30 L192 30 Z" fill="white" opacity="0.15"/>
      {/* Panoramic windows — hallmark of minivan */}
      <rect x="54" y="9" width="34" height="21" rx="3.5" fill="white" opacity="0.14"/>
      <rect x="93" y="8" width="38" height="22" rx="3.5" fill="white" opacity="0.14"/>
      <rect x="136" y="8" width="38" height="21" rx="3.5" fill="white" opacity="0.14"/>
      {/* ── SLIDING DOOR — minivan defining feature ── */}
      <rect x="91" y="8" width="4" height="50" rx="1.5" fill="currentColor" opacity="0.42"/>
      <rect x="134" y="8" width="4" height="50" rx="1.5" fill="currentColor" opacity="0.42"/>
      {/* Sliding door handle */}
      <rect x="110" y="36" width="14" height="4" rx="2" fill="white" opacity="0.3"/>
      {/* Low nose / hood */}
      <path d="M36 30 L36 38 Q38 32 52 30 Z" fill="currentColor" opacity="0.6"/>
      {/* Headlight */}
      <rect x="208" y="42" width="12" height="8" rx="3" fill="white" opacity="0.5"/>
      <rect x="211" y="43" width="7" height="5" rx="2" fill="white" opacity="0.65"/>
      {/* Tail light */}
      <rect x="21" y="38" width="4" height="14" rx="2" fill="white" opacity="0.32"/>
      {/* Step / rocker panel */}
      <rect x="36" y="55" width="180" height="4" rx="2" fill="currentColor" opacity="0.38"/>
      <g>
        <circle cx="60" cy="63" r="14" fill="white" opacity="0.07"/>
        <circle cx="60" cy="63" r="12" fill="none" stroke="currentColor" strokeWidth="2.5" opacity="0.95"/>
        <circle cx="60" cy="63" r="11" fill="currentColor" opacity="0.18"/>
        <circle cx="60" cy="63" r="9" fill="currentColor" opacity="0.72"/>
        <line x1="60" y1="55" x2="60" y2="71" stroke="white" strokeWidth="1" opacity="0.45"/>
        <line x1="52" y1="63" x2="68" y2="63" stroke="white" strokeWidth="1" opacity="0.45"/>
        <line x1="53" y1="56" x2="67" y2="70" stroke="white" strokeWidth="0.8" opacity="0.3"/>
        <line x1="67" y1="56" x2="53" y2="70" stroke="white" strokeWidth="0.8" opacity="0.3"/>
        <circle cx="60" cy="63" r="2.5" fill="white" opacity="0.7"/>
      </g>
      <g>
        <circle cx="188" cy="63" r="14" fill="white" opacity="0.07"/>
        <circle cx="188" cy="63" r="12" fill="none" stroke="currentColor" strokeWidth="2.5" opacity="0.95"/>
        <circle cx="188" cy="63" r="11" fill="currentColor" opacity="0.18"/>
        <circle cx="188" cy="63" r="9" fill="currentColor" opacity="0.72"/>
        <line x1="188" y1="55" x2="188" y2="71" stroke="white" strokeWidth="1" opacity="0.45"/>
        <line x1="180" y1="63" x2="196" y2="63" stroke="white" strokeWidth="1" opacity="0.45"/>
        <line x1="181" y1="56" x2="195" y2="70" stroke="white" strokeWidth="0.8" opacity="0.3"/>
        <line x1="195" y1="56" x2="181" y2="70" stroke="white" strokeWidth="0.8" opacity="0.3"/>
        <circle cx="188" cy="63" r="2.5" fill="white" opacity="0.7"/>
      </g>
    </svg>
  ),
};

// ── BODY TYPES
const BODY_TYPES = [
  { type: 'SEDAN', labelKey: 'bodyType.SEDAN.label', descKey: 'bodyType.SEDAN.desc', color: '#3b82f6' },
  { type: 'SUV', labelKey: 'bodyType.SUV.label', descKey: 'bodyType.SUV.desc', color: '#10b981' },
  { type: 'HATCHBACK', labelKey: 'bodyType.HATCHBACK.label', descKey: 'bodyType.HATCHBACK.desc', color: '#f59e0b' },
  { type: 'CROSSOVER', labelKey: 'bodyType.CROSSOVER.label', descKey: 'bodyType.CROSSOVER.desc', color: '#8b5cf6' },
  { type: 'COUPE', labelKey: 'bodyType.COUPE.label', descKey: 'bodyType.COUPE.desc', color: '#ef4444' },
  { type: 'PICKUP', labelKey: 'bodyType.PICKUP.label', descKey: 'bodyType.PICKUP.desc', color: '#f97316' },
  { type: 'VAN', labelKey: 'bodyType.VAN.label', descKey: 'bodyType.VAN.desc', color: '#64748b' },
  { type: 'MINIVAN', labelKey: 'bodyType.MINIVAN.label', descKey: 'bodyType.MINIVAN.desc', color: '#0ea5e9' },
];

const CATEGORIES = [
  {
    titleKey: 'nav.newCars', descKey: 'home.newUsedCarsSub', icon: Sparkles,
    img: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=900&q=80',
    href: '/cars?condition=NEW', accent: '#f59e0b',
  },
  {
    titleKey: 'nav.usedCars', descKey: 'home.verifiedShowroomsSub', icon: Car,
    img: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=900&q=80',
    href: '/cars?condition=USED', accent: '#10b981',
  },
  {
    titleKey: 'nav.parts', descKey: 'home.genuinePartsSub', icon: Wrench,
    img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&q=80',
    href: '/spare-parts', accent: '#06b6d4',
  },
  {
    titleKey: 'nav.verifiedDealers', descKey: 'stores.subtitle', icon: ShieldCheck,
    img: 'https://images.unsplash.com/photo-1568542756575-a1f5a2c2b9a3?w=900&q=80',
    href: '/stores', accent: '#8b5cf6',
  },
  {
    titleKey: 'nav.carExchange', descKey: 'tradeIn.subtitle', icon: ArrowLeftRight,
    img: 'https://images.unsplash.com/photo-1542362567-b07e54358753?w=900&q=80',
    href: '/cars?exchange=true', accent: '#ef4444',
  },
];

export default function HomePage() {
  const router = useRouter();
  const { t } = useLang(); // ✅ FIX: language switch ke liye
  const [search, setSearch]       = useState('');
  const [city, setCity]           = useState('');
  const [stores, setStores]       = useState([]);
  const [cars, setCars]           = useState([]);
  const [loadingCars, setLoadingCars] = useState(true);
  const [brandIdx, setBrandIdx]   = useState(0);
  const BRANDS_PER_VIEW = 5;

  useEffect(() => {
    fetch(`${API}/stores?limit=4`)
      .then(r => r.json())
      .then(d => setStores(Array.isArray(d) ? d : (d.data || d.stores || [])))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoadingCars(true);
    fetch(`${API}/cars?limit=8`)
      .then(r => r.json())
      .then(d => {
        const arr = Array.isArray(d) ? d : (d.data || []);
        setCars(arr);
      })
      .catch(() => setCars([]))
      .finally(() => setLoadingCars(false));
  }, []);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (city)   params.set('city', city);
    router.push(`/cars?${params.toString()}`);
  };

  const visibleBrands = BRANDS.slice(brandIdx, brandIdx + BRANDS_PER_VIEW);

  return (
    <div className="min-h-screen bg-white">

      {/* ━━━━━━━━━━━━━━━━━━ AI CAR FINDER — hanging branch tab ━━━━━━━━━━━━━━━━━━ */}
      <div className="ai-finder-wrap">
        <div className="ai-finder-swing">
          {/* the "branch" — vine line with two small leaves */}
          <div className="ai-finder-branch">
            <span className="ai-finder-leaf ai-finder-leaf--1" />
            <span className="ai-finder-leaf ai-finder-leaf--2" />
          </div>
          {/* the dangling button itself */}
          <button
            onClick={() => router.push('/ai-recommend')}
            className="ai-finder-btn"
            aria-label={t('nav.aiCarFinder')}
          >
            <span className="ai-finder-ring" />
            <Sparkles size={18} className="shrink-0" />
            <span className="ai-finder-label">{t('nav.aiCarFinder')}</span>
          </button>
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━ HERO ━━━━━━━━━━━━━━━━━━ */}
      <section className="bg-gray-950 relative overflow-hidden pt-16 pb-20 px-4">
        <div className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)',
            backgroundSize: '40px 40px',
          }} />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <span className="inline-flex items-center gap-2 bg-white/10 text-amber-400 text-xs font-bold px-4 py-2 rounded-full mb-6 border border-amber-400/20">
            🚗 {t('home.tagline')}
          </span>
          <h1 className="text-4xl sm:text-5xl font-black text-white leading-tight">
            {t('home.heroTitle1')}<br />
            <span className="text-amber-400">{t('home.heroTitle2')}</span>
          </h1>
          <p className="text-gray-400 mt-4 text-base">
            {t('home.heroSub')}
          </p>

          <div className="mt-8 flex flex-wrap gap-3 bg-white/5 border border-white/10 p-3 rounded-2xl max-w-2xl mx-auto">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder={t('home.searchPlaceholder')}
              className="flex-1 min-w-[180px] bg-transparent text-white placeholder-gray-500 px-3 py-2 text-sm focus:outline-none"
            />
            <input
              type="text"
              value={city}
              onChange={e => setCity(e.target.value)}
              placeholder={t('common.city')}
              className="w-44 bg-transparent text-white placeholder-gray-500 px-3 py-2 text-sm border-l border-white/10 focus:outline-none"
            />
            <button
              onClick={handleSearch}
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors"
            >
              <Search size={15} /> {t('home.search')}
            </button>
          </div>

          <div className="flex gap-3 justify-center mt-6">
            <button
              onClick={() => router.push('/cars')}
              className="bg-amber-500 hover:bg-amber-400 text-white font-bold px-6 py-3 rounded-xl text-sm transition-colors flex items-center gap-2"
            >
              {t('home.carsDekho')} <ArrowRight size={15} />
            </button>
            <button
              onClick={() => router.push('/cars?exchange=true')}
              className="border border-white/20 text-white hover:bg-white/10 font-semibold px-6 py-3 rounded-xl text-sm transition-colors"
            >
              {t('home.carExchange')}
            </button>
          </div>
        </div>
      </section>

      {/* ━━━━━━ KYA DHUNDH RAHE HO ━━━━━━ */}
      <section className="py-16 px-4 bg-gray-950">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-black text-white text-center mb-2">{t('home.whatLookingFor')}</h2>
          <p className="text-gray-500 text-sm text-center mb-10">{t('home.whatLookingForSub')}</p>
          <CategoryCarousel categories={CATEGORIES} onSelect={(href) => router.push(href)} />
        </div>
      </section>

      {/* ━━━━━━ BRAND SE TALASH KAREIN ━━━━━━ */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-black text-gray-900">{t('home.brandSearch')}</h2>
              <p className="text-gray-400 text-sm mt-1">{t('home.brandSearchSub')}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setBrandIdx(Math.max(0, brandIdx - 1))}
                disabled={brandIdx === 0}
                className="w-11 h-11 rounded-full border-2 border-gray-200 flex items-center justify-center hover:bg-amber-500 hover:border-amber-500 hover:text-white disabled:opacity-30 transition-all"
              >
                <ChevronLeft size={19} />
              </button>
              <button
                onClick={() => setBrandIdx(Math.min(BRANDS.length - BRANDS_PER_VIEW, brandIdx + 1))}
                disabled={brandIdx >= BRANDS.length - BRANDS_PER_VIEW}
                className="w-11 h-11 rounded-full border-2 border-gray-200 flex items-center justify-center hover:bg-amber-500 hover:border-amber-500 hover:text-white disabled:opacity-30 transition-all"
              >
                <ChevronRight size={19} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {visibleBrands.map((brand) => (
              <BrandCard
                key={brand.name}
                brand={brand}
                onClick={() => router.push(`/cars?brand=${brand.name}`)}
              />
            ))}
          </div>

          <div className="flex justify-center gap-1.5 mt-6">
            {Array.from({ length: BRANDS.length - BRANDS_PER_VIEW + 1 }).map((_, i) => (
              <button
                key={i}
                onClick={() => setBrandIdx(i)}
                className={`h-1.5 rounded-full transition-all ${i === brandIdx ? 'w-6 bg-amber-500' : 'w-1.5 bg-gray-200'}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ━━━━━━ BODY TYPE SE TALASH ━━━━━━ */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h2 className="text-2xl font-black text-gray-900">{t('home.bodyTypeSearch')}</h2>
            <p className="text-gray-400 text-sm mt-1">{t('home.bodyTypeSearchSub')}</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
            {BODY_TYPES.map((bt) => (
              <BodyTypeCard
                key={bt.type}
                bodyType={bt}
                onClick={() => router.push(`/cars?bodyType=${bt.type}`)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ━━━━━━ VERIFIED DEALERS ━━━━━━ */}
      {stores.length > 0 && (
        <section className="py-16 px-4 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-black text-gray-900">{t('home.verifiedDealersHeading')}</h2>
                <p className="text-gray-400 text-sm mt-1">{t('home.verifiedDealersSub')}</p>
              </div>
              <button
                onClick={() => router.push('/stores')}
                className="text-amber-500 hover:text-amber-400 text-sm font-semibold flex items-center gap-1 transition-colors"
              >
                {t('home.viewAllDealers')} <ArrowRight size={14} />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {stores.map(store => (
                <StoreCard
                  key={store.id}
                  store={store}
                  onClick={() => router.push(`/stores/${store.slug}`)}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ━━━━━━ TAMAM CARS ━━━━━━ */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-black text-gray-900">{t('home.allCarsHeading')}</h2>
              <p className="text-gray-400 text-sm mt-1">{t('home.latestListings')}</p>
            </div>
            <button
              onClick={() => router.push('/cars')}
              className="text-amber-500 hover:text-amber-400 text-sm font-semibold flex items-center gap-1 transition-colors"
            >
              {t('home.advancedFilters')} <ArrowRight size={14} />
            </button>
          </div>

          {loadingCars ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm animate-pulse">
                  <div className="h-40 bg-gray-200" />
                  <div className="p-3 space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-3/4" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : cars.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p>{t('home.noCars')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
              {cars.map(car => (
                <HomepageCarCard
                  key={car.id}
                  car={car}
                  onClick={() => router.push(`/cars/${car.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ━━━━━━ GLOBAL CSS ━━━━━━ */}
      <style jsx global>{`
        /* ── AI Car Finder — hanging branch tab ───────────────── */
        .ai-finder-wrap {
          position: fixed;
          top: 96px;
          left: 0;
          z-index: 45;
          pointer-events: none;
        }
        .ai-finder-swing {
          transform-origin: top center;
          animation: aiSwing 4.5s ease-in-out infinite;
          pointer-events: auto;
        }
        @keyframes aiSwing {
          0%, 100% { transform: rotate(-3.5deg); }
          50%      { transform: rotate(3.5deg); }
        }
        /* vine/branch */
        .ai-finder-branch {
          position: relative;
          width: 3px;
          height: 46px;
          margin: 0 0 0 34px;
          background: linear-gradient(to bottom, #8a6d3b, #5c4a28);
          border-radius: 2px;
        }
        .ai-finder-leaf {
          position: absolute;
          width: 12px;
          height: 7px;
          background: #4d7c3a;
          border-radius: 60% 10% 60% 10%;
        }
        .ai-finder-leaf--1 { top: 10px; left: -9px; transform: rotate(-25deg); }
        .ai-finder-leaf--2 { top: 24px; left: 3px;  transform: rotate(150deg); }
        /* dangling button */
        .ai-finder-btn {
          position: relative;
          display: flex;
          align-items: center;
          gap: 7px;
          background: linear-gradient(135deg, #f59e0b, #ea580c);
          color: #fff;
          font-weight: 700;
          font-size: 12.5px;
          padding: 10px 14px 10px 12px;
          border-radius: 0 999px 999px 0;
          box-shadow: 0 10px 22px -6px rgba(234,88,12,0.55);
          border: none;
          cursor: pointer;
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }
        .ai-finder-btn:hover {
          transform: translateX(3px) scale(1.04);
          box-shadow: 0 14px 28px -6px rgba(234,88,12,0.65);
        }
        .ai-finder-ring {
          position: absolute;
          inset: -4px;
          border-radius: 999px;
          animation: aiBlink 1.8s ease-out infinite;
          pointer-events: none;
        }
        @keyframes aiBlink {
          0%   { box-shadow: 0 0 0 0 rgba(245,158,11,0.65); }
          70%  { box-shadow: 0 0 0 14px rgba(245,158,11,0); }
          100% { box-shadow: 0 0 0 0 rgba(245,158,11,0); }
        }
        .ai-finder-label { white-space: nowrap; }
        @media (max-width: 640px) {
          .ai-finder-wrap { top: 84px; }
          .ai-finder-branch { margin-left: 22px; height: 36px; }
          .ai-finder-btn { padding: 8px 12px 8px 10px; font-size: 11.5px; }
        }

        /* Brand card — 3D lift + shimmer */
        .brand-card-3d {
          position: relative; overflow: hidden;
          transform-style: preserve-3d;
          transition: transform 0.35s cubic-bezier(0.23,1,0.32,1), box-shadow 0.35s ease;
        }
        .brand-card-3d:hover {
          transform: translateY(-8px) rotateX(6deg) scale(1.05);
          box-shadow: 0 24px 48px -12px rgba(0,0,0,0.2);
        }
        .brand-card-3d::before {
          content: ''; position: absolute; top: 0; left: -75%; width: 50%; height: 100%;
          background: linear-gradient(120deg, transparent, rgba(255,255,255,0.55), transparent);
          transform: skewX(-20deg); transition: left 0.6s ease;
        }
        .brand-card-3d:hover::before { left: 125%; }

        /* Mirror card */
        .mirror-card {
          transform-style: preserve-3d;
          transition: transform 0.4s cubic-bezier(0.23,1,0.32,1), box-shadow 0.4s ease;
        }
      `}</style>
    </div>
  );
}

// ─── CATEGORY CAROUSEL ────────────────────────────────────
function CategoryCarousel({ categories, onSelect }) {
  const { t } = useLang();
  const [idx, setIdx]       = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef            = useRef(null);

  const next = useCallback(() => setIdx(i => (i + 1) % categories.length), [categories.length]);
  const prev = () => setIdx(i => (i - 1 + categories.length) % categories.length);

  useEffect(() => {
    if (paused) return;
    timerRef.current = setInterval(next, 4500);
    return () => clearInterval(timerRef.current);
  }, [paused, next]);

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <button
        onClick={prev}
        className="absolute left-1 sm:-left-5 lg:-left-16 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/10 border border-white/20 text-white flex items-center justify-center hover:bg-amber-500 hover:border-amber-500 transition-all backdrop-blur-sm"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        onClick={next}
        className="absolute right-1 sm:-right-5 lg:-right-16 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/10 border border-white/20 text-white flex items-center justify-center hover:bg-amber-500 hover:border-amber-500 transition-all backdrop-blur-sm"
      >
        <ChevronRight size={20} />
      </button>

      <div className="overflow-hidden rounded-3xl">
        <div
          className="flex transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]"
          style={{ transform: `translateX(-${idx * 100}%)` }}
        >
          {categories.map((cat) => (
            <div key={cat.titleKey} className="w-full shrink-0">
              <MirrorCard cat={cat} onClick={() => onSelect(cat.href)} />
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-center gap-2 mt-6">
        {categories.map((cat, i) => (
          <button
            key={cat.titleKey}
            onClick={() => setIdx(i)}
            className="h-2 rounded-full transition-all"
            style={{
              width: i === idx ? 24 : 8,
              backgroundColor: i === idx ? cat.accent : 'rgba(255,255,255,0.2)',
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── MIRROR CARD ─────────────────────────────────────────
function MirrorCard({ cat, onClick }) {
  const { t } = useLang();
  const cardRef = useRef(null);
  const [tilt, setTilt]       = useState({ x: 0, y: 0 });
  const [glowPos, setGlowPos] = useState({ x: 50, y: 50 });
  const [hovered, setHovered] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const Icon = cat.icon || Car;

  const handleMouseMove = (e) => {
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top)  / rect.height;
    setTilt({ x: (y - 0.5) * 14, y: (x - 0.5) * -14 });
    setGlowPos({ x: x * 100, y: y * 100 });
  };

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setTilt({ x: 0, y: 0 }); setGlowPos({ x: 50, y: 50 }); setHovered(false); }}
      className="mirror-card relative rounded-3xl overflow-hidden cursor-pointer h-[300px] sm:h-[360px] md:h-[400px]"
      style={{
        transform: hovered
          ? `perspective(900px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(1.02)`
          : 'perspective(900px) rotateX(0deg) rotateY(0deg) scale(1)',
        boxShadow: hovered
          ? `0 30px 60px -15px rgba(0,0,0,0.55), 0 0 0 1px ${cat.accent}50`
          : '0 6px 20px rgba(0,0,0,0.45)',
      }}
    >
      {!imgFailed ? (
        <img
          src={cat.img}
          alt={t(cat.titleKey)}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: 'brightness(0.5)' }}
          onError={() => setImgFailed(true)}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center"
          style={{ background: `linear-gradient(135deg, ${cat.accent}55, #0b0b14)` }}>
          <Icon size={64} className="opacity-25" color="#fff" />
        </div>
      )}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.1) 55%, transparent 100%)' }} />
      <div className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 65% 65% at ${glowPos.x}% ${glowPos.y}%, ${cat.accent}30 0%, transparent 65%)`,
          transition: 'background 0.1s ease',
        }} />
      <div className="absolute inset-0 rounded-3xl pointer-events-none"
        style={{
          border: `1px solid ${hovered ? cat.accent + '70' : 'rgba(255,255,255,0.12)'}`,
          background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 50%, rgba(0,0,0,0.08) 100%)',
          transition: 'border-color 0.3s ease',
        }} />
      <div className="absolute top-5 left-5 w-12 h-12 rounded-2xl flex items-center justify-center backdrop-blur-md"
        style={{ background: `${cat.accent}25`, border: `1px solid ${cat.accent}50` }}>
        <Icon size={22} color={cat.accent} />
      </div>
      <div className="absolute inset-0 flex flex-col justify-end p-7">
        <h3 className="text-white text-2xl sm:text-3xl font-black mb-1"
          style={{ textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}>
          {t(cat.titleKey)}
        </h3>
        <p className="text-white/70 text-sm">{t(cat.descKey)}</p>
        <div className="mt-4 flex items-center gap-1.5" style={{ color: cat.accent }}>
          <span className="text-xs font-bold uppercase tracking-wider">{t('home.explore')}</span>
          <ArrowRight size={14} />
        </div>
      </div>
    </div>
  );
}

// ─── BRAND CARD — real logos via Clearbit ─────────────────
function BrandCard({ brand, onClick }) {
  const [imgFailed, setImgFailed] = useState(false);
  const logoUrl = `https://www.google.com/s2/favicons?domain=${brand.domain}&sz=128`;
  return (
    <div
      onClick={onClick}
      className="brand-card-3d bg-white border border-gray-100 rounded-2xl p-6 flex flex-col items-center gap-3 cursor-pointer"
    >
      <div
        className="w-20 h-20 rounded-2xl flex items-center justify-center overflow-hidden relative"
        style={{ background: brand.bg }}
      >
        {!imgFailed ? (
          <img
            src={logoUrl}
            alt={brand.name}
            className="w-14 h-14 object-contain"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <>
            <span
              className="absolute rounded-full border-2"
              style={{ width: 52, height: 52, borderColor: brand.color, opacity: 0.35 }}
            />
            <span className="font-black text-xl tracking-tight relative" style={{ color: brand.color }}>
              {brand.abbr}
            </span>
          </>
        )}
      </div>
      <span className="text-gray-700 font-semibold text-sm">{brand.name}</span>
    </div>
  );
}

// ─── BODY TYPE CARD — SVG silhouette + 3D mouse-tracking ──────
function BodyTypeCard({ bodyType, onClick }) {
  const { t } = useLang();
  const cardRef = useRef(null);
  const [tilt, setTilt]       = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });

  const svgEl = BODY_TYPE_SVGS[bodyType.type] || BODY_TYPE_SVGS['SEDAN'];

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top)  / rect.height;
    setTilt({ x: (y - 0.5) * 18, y: (x - 0.5) * -18 });
    setMousePos({ x: x * 100, y: y * 100 });
  };

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setTilt({ x: 0, y: 0 }); setMousePos({ x: 50, y: 50 }); setHovered(false); }}
      className="rounded-2xl overflow-hidden cursor-pointer"
      style={{
        transform: hovered
          ? `perspective(700px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(1.06)`
          : 'perspective(700px) rotateX(0deg) rotateY(0deg) scale(1)',
        transition: hovered
          ? 'transform 0.08s linear, box-shadow 0.3s ease'
          : 'transform 0.55s cubic-bezier(0.23,1,0.32,1), box-shadow 0.55s ease',
        boxShadow: hovered
          ? `0 28px 52px -12px ${bodyType.color}55, 0 0 0 1.5px ${bodyType.color}50`
          : `0 1px 6px rgba(0,0,0,0.09)`,
        background: hovered
          ? `linear-gradient(135deg, ${bodyType.color}18 0%, ${bodyType.color}08 100%)`
          : 'white',
        border: `1.5px solid ${hovered ? bodyType.color + '40' : '#f1f5f9'}`,
      }}
    >
      {/* ── SVG silhouette area ── */}
      <div
        className="relative overflow-hidden"
        style={{
          height: 120,
          background: hovered
            ? `radial-gradient(ellipse 80% 80% at ${mousePos.x}% ${mousePos.y}%, ${bodyType.color}22 0%, ${bodyType.color}08 60%, transparent 100%)`
            : `${bodyType.color}08`,
          transition: 'background 0.2s ease',
        }}
      >
        {/* Background mesh dots */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle, ${bodyType.color}20 1px, transparent 1px)`,
            backgroundSize: '18px 18px',
            opacity: hovered ? 0.8 : 0.4,
            transition: 'opacity 0.3s ease',
          }}
        />

        {/* SVG car silhouette — scales and floats on hover */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            color: bodyType.color,
            transform: hovered ? 'scale(1.12) translateY(-3px)' : 'scale(1) translateY(0)',
            transition: 'transform 0.45s cubic-bezier(0.23,1,0.32,1)',
            filter: hovered ? `drop-shadow(0 8px 16px ${bodyType.color}60)` : 'none',
            padding: '8px 12px',
          }}
        >
          {svgEl}
        </div>

        {/* Shine sweep on hover */}
        <div
          className="absolute inset-0 pointer-events-none rounded-t-2xl"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.35) 0%, transparent 50%)',
            opacity: hovered ? 1 : 0,
            transition: 'opacity 0.35s ease',
          }}
        />

        {/* Bottom fade */}
        <div
          className="absolute bottom-0 left-0 right-0 h-8 pointer-events-none"
          style={{
            background: `linear-gradient(to top, ${hovered ? bodyType.color + '18' : 'white'}00, transparent)`,
          }}
        />
      </div>

      {/* ── Label + desc area ── */}
      <div
        className="px-3 pt-2.5 pb-3 flex items-center justify-between"
        style={{
          borderTop: `2px solid ${hovered ? bodyType.color + '35' : bodyType.color + '18'}`,
          transition: 'border-color 0.3s ease',
        }}
      >
        <div>
          <h3
            className="font-black text-sm leading-tight"
            style={{
              color: hovered ? bodyType.color : '#111827',
              transition: 'color 0.25s ease',
            }}
          >
            {t(bodyType.labelKey)}
          </h3>
          <p className="text-gray-400 text-xs leading-snug mt-0.5">{t(bodyType.descKey)}</p>
        </div>
        <ArrowRight
          size={15}
          style={{
            color: bodyType.color,
            transform: hovered ? 'translateX(4px) scale(1.1)' : 'translateX(0) scale(1)',
            transition: 'transform 0.25s ease',
            flexShrink: 0,
            marginLeft: 8,
            opacity: hovered ? 1 : 0.6,
          }}
        />
      </div>
    </div>
  );
}

// ─── STORE CARD ───────────────────────────────────────────
function StoreCard({ store, onClick }) {
  const { t } = useLang();
  const logoUrl = getImg(store.logo);
  const initial = (store.name || 'S')[0].toUpperCase();

  return (
    <div
      onClick={onClick}
      className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-3 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all group"
    >
      <div className="w-12 h-12 rounded-xl overflow-hidden bg-gradient-to-br from-amber-50 to-gray-100 flex items-center justify-center shrink-0">
        {logoUrl ? (
          <img src={logoUrl} alt={store.name} className="w-full h-full object-cover"
            onError={e => { e.target.style.display = 'none'; }} />
        ) : (
          <span className="font-black text-gray-500 text-lg">{initial}</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <p className="font-bold text-gray-900 text-sm truncate">{store.name}</p>
          {store.isVerified && <span className="text-emerald-500 text-xs">✓</span>}
        </div>
        <p className="text-xs text-gray-400 flex items-center gap-0.5 mt-0.5">
          <MapPin size={10} /> {store.city || t('common.pakistan')}
          <span className="ml-1">· {store._count?.cars ?? store.carCount ?? 0} {t('common.cars')}</span>
        </p>
      </div>
    </div>
  );
}

// ─── HOMEPAGE CAR CARD ────────────────────────────────────
function HomepageCarCard({ car, onClick }) {
  const { t } = useLang();
  const [imgErr, setImgErr] = useState(false);
  const images = car.carImages || car.images || [];
  const rawUrl = images[0] || null;
  const imgSrc = imgErr ? null : getImg(rawUrl);

  // ✅ Condition badge labels & colors — HEX values direct use kiye (Tailwind
  // classes ki jagah), taake build/purge config se bilkul independent ho aur
  // guaranteed render ho (is project mein Tailwind classes fail hone ka
  // pehle se history raha hai — car detail page mein bhi isi wajah se
  // inline-style fallback use hua tha).
  const CONDITION_LABELS = { NEW: 'car.new', USED: 'car.used', CERTIFIED_PREOWNED: 'car.certified' };
  const CONDITION_HEX    = { NEW: '#10b981', USED: '#475569', CERTIFIED_PREOWNED: '#f59e0b' };
  const conditionLabel = CONDITION_LABELS[car.condition] ? t(CONDITION_LABELS[car.condition]) : car.condition;
  const conditionHex   = CONDITION_HEX[car.condition] || '#374151';
  const showExchangeBadge = car.isForExchange === true;
  const hasBadges = Boolean(car.condition || showExchangeBadge);

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group w-full"
    >
      {/* ✅ FIX: image box + object-fit ab 100% inline style se control hota hai —
          Tailwind class purge/JIT config se bilkul independent, guaranteed chalega */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: 'clamp(112px, 24vw, 176px)',
          background: 'linear-gradient(135deg, #f3f4f6, #f9fafb)',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={car.title || car.model}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              display: 'block',
            }}
            className="group-hover:scale-105 transition-transform duration-300"
            onError={() => setImgErr(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <Car size={28} className="sm:w-8 sm:h-8" />
          </div>
        )}

        {/* ✅ Gradient scrim — badges hamesha readable rahein, image content kuch bhi ho */}
        {hasBadges && (
          <div
            style={{
              position: 'absolute',
              top: 0, left: 0, right: 0,
              height: '56px',
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.35), transparent)',
              pointerEvents: 'none',
            }}
          />
        )}

        {/* ✅ Badges: top-left, stacked */}
        <div style={{ position: 'absolute', top: '6px', left: '6px', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
          {car.condition && (
            <span style={{
              backgroundColor: conditionHex, color: '#fff', fontSize: '10px', fontWeight: 700,
              padding: '2px 8px', borderRadius: '999px', whiteSpace: 'nowrap',
              boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
            }}>
              {conditionLabel}
            </span>
          )}
          {showExchangeBadge && (
            <span style={{
              backgroundColor: '#9333ea', color: '#fff', fontSize: '10px', fontWeight: 700,
              padding: '2px 8px', borderRadius: '999px', whiteSpace: 'nowrap',
              boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
            }}>{t('car.exchange')}</span>
          )}
        </div>
      </div>
      {/* ✅ Mobile pe kam padding */}
      <div className="p-2 sm:p-3">
        <p className="font-bold text-gray-900 text-[11px] sm:text-xs leading-tight line-clamp-2 group-hover:text-amber-600 transition-colors min-h-[28px] sm:min-h-[32px]">
          {car.title || `${car.year} ${car.brand} ${car.model}`}
        </p>
        <p className="text-amber-600 font-extrabold text-xs sm:text-sm mt-0.5 sm:mt-1">
          PKR {Number(car.price).toLocaleString()}
        </p>
        {/* ✅ FIX: flex-wrap add kiya taake chhoti screen (2-column grid) pe
            city + mileage overlap na hon — ab zaroorat pade to doosri line pe wrap ho jayenge.
            City ko truncate kiya taake lamba naam mileage ko push out na kare. */}
        <div className="text-gray-400 text-[9px] sm:text-[10px] mt-1 flex items-center flex-wrap gap-x-1 gap-y-0.5">
          <span className="flex items-center gap-0.5 max-w-full min-w-0">
            <MapPin size={9} className="shrink-0" />
            <span className="truncate">{car.city || car.store?.city || t('common.pakistan')}</span>
          </span>
          {car.mileage > 0 && (
            <span className="flex items-center gap-0.5 shrink-0">
              <Gauge size={9} className="shrink-0" />
              {Number(car.mileage).toLocaleString()} {t('common.km')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}