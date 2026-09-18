// frontend/components/home/categories.js
//
// ✅ POORI FILE REPLACE
//
// Kya badla: `accent` ke rang.
//
// Pehle har card ka apna alag chamakdaar rang tha — amber, emerald, cyan,
// violet, red. Paanch alag alag saturated rang ek row mein = wahi
// "cartoonish" look jis ka aap ne zikr kiya. Brand ka apna palette
// (black / gold / orange) us mein doob jata tha.
//
// Ab sab kuch ek hi gold family mein hai, bas har card ki chamak thori si
// alag (dark bronze → bright gold). Nateeja: row ek premium showroom ki
// tarah lagti hai, bachon ki drawing ki tarah nahi — aur cards phir bhi ek
// dusre se alag pehchane jate hain.
//
// `img` ke URLs waise hi hain (asli photos hain, illustrations nahi) — lekin
// unmein `q=80` ke sath ab `auto=format&fit=crop` bhi hai, jis se Unsplash
// khud behtar/chhoti file bhejta hai.

import { Car, Wrench, ShieldCheck, ArrowLeftRight, Sparkles } from 'lucide-react';

export const CATEGORIES = [
  {
    key: 'newCars',
    title: 'New Cars',
    desc: 'Brand new, zero mileage',
    icon: Sparkles,
    img: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=80',
    href: '/cars?condition=NEW',
    accent: '#e8b84b',   // bright gold — brand ka asal accent
  },
  {
    key: 'usedCars',
    title: 'Used Cars',
    desc: 'Inspected aur trusted listings',
    icon: Car,
    img: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=900&q=80',
    href: '/cars?condition=USED',
    accent: '#c9a04b',   // halka mand gold
  },
  {
    key: 'spareParts',
    title: 'Spare Parts',
    desc: 'Original aur used parts',
    icon: Wrench,
    img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=900&q=80',
    href: '/spare-parts',
    accent: '#a17c33',   // bronze
  },
  {
    key: 'verifiedDealers',
    title: 'Verified Dealers',
    desc: 'Trusted showrooms Pakistan bhar se',
    icon: ShieldCheck,
    img: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=900&q=80',
    href: '/stores',
    accent: '#d4a949',
  },
  {
    key: 'carExchange',
    title: 'Car Exchange',
    desc: 'Apni purani car trade karein',
    icon: ArrowLeftRight,
    img: 'https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=900&q=80',
    href: '/cars?exchange=true',
    accent: '#8f6417',   // gehra bronze
  },
];

export default CATEGORIES;