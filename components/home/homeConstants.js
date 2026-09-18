// frontend/components/home/homeConstants.js
// Shared image helper + brand list — used by BrandsCarousel, HomepageCarCard, StoreCard.

export const API  = process.env.NEXT_PUBLIC_API_URL || '/api';
export const BASE = API.replace('/api', '');

export const getImg = (raw) => {
  if (!raw) return null;
  const url = typeof raw === 'string' ? raw : raw.url;
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${BASE}${url.startsWith('/') ? '' : '/'}${url}`;
};

// ── BRANDS — domain added for Clearbit logo
export const BRANDS = [
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