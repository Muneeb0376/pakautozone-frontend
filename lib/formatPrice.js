// lib/formatPrice.js
//
// Pakistani style price formatting — poori site par ek hi jagah se.
//
//        850          -> PKR 850
//      85,000         -> PKR 85,000        (1 lakh se kam = poora number)
//     4,50,000        -> PKR 4.5 lacs
//    44,55,555        -> PKR 44.56 lacs
//   1,00,00,000       -> PKR 1 crore
//   2,35,00,000       -> PKR 2.35 crore

const LAKH  = 100000;
const CRORE = 10000000;

/** 44.55555 -> "44.55", 4.50 -> "4.5", 2.00 -> "2" (truncate, phir trailing zeros hatao) */
function truncate2(num) {
  return String(Math.floor(num * 100) / 100);
}

/**
 * @param {number|string} value
 * @param {object}  opts
 * @param {boolean} opts.withCurrency  "PKR " prefix lagana hai ya nahi (default: true)
 * @param {string}  opts.fallback      value invalid ho to kya dikhana hai
 * @returns {string}
 */
export function formatPrice(value, opts = {}) {
  const { withCurrency = true, fallback = '—' } = opts;

  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return fallback;

  const prefix = withCurrency ? 'PKR ' : '';

  // NOTE: round ki jagah truncate (2 decimals tak) karte hain — is se
  // price kabhi asal se ZYADA nahi dikhti. Round karne par 99,999 ko
  // "1 lac" aur 99,99,999 ko "100 lacs" bana deta tha, dono ghalat thay.
  if (n >= CRORE) {
    return `${prefix}${truncate2(n / CRORE)} crore`;
  }

  if (n >= LAKH) {
    const v = truncate2(n / LAKH);
    return `${prefix}${v} ${v === '1' ? 'lac' : 'lacs'}`;
  }

  // 1 lakh se kam — poora number, comma ke sath
  return `${prefix}${n.toLocaleString('en-US')}`;
}

/** Exact price, bina short kiye — e.g. tooltip ya "Asking Price" ke neeche. */
export function formatPriceExact(value, opts = {}) {
  const { withCurrency = true, fallback = '—' } = opts;
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return `${withCurrency ? 'PKR ' : ''}${n.toLocaleString('en-US')}`;
}

export default formatPrice;