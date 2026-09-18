// frontend/lib/textCase.js
//
// ✅ NAYI FILE
//
// Aap ka note tha: "har jaga har form me model ka first name capital show
// hona chahiye". Ye file wahi ek jagah hai jahan se poori site ka naam
// capitalisation control hota hai — har page apni marzi se .toUpperCase()
// ya CSS capitalize na lagaye, warna kahin "COROLLA", kahin "corolla" aur
// kahin "Corolla" dikhta rehta hai.
//
// Kyun CSS `text-transform: capitalize` kaafi nahi:
//   • wo sirf dikhawe ka hai — value copy karo to lowercase hi milti hai
//   • wo "BR-V" ko "Br-v" bana deta hai, "MG HS" ko "Mg Hs"
//   • search/filter compare karte waqt kuch madad nahi karta
//
// Is liye yahan ek chhoti si acronym/brand dictionary rakhi hai jo un naamon
// ko unki asal shakal mein wapis laati hai.

/* Wo naam jo poore capital rehne chahiyein */
const ALL_CAPS = new Set([
  'MG', 'BMW', 'KIA', 'BYD', 'DFSK', 'FAW', 'JAC', 'JW', 'GMC',
  'HS', 'ZS', 'RS', 'GT', 'GLI', 'XLI', 'VTI', 'CVT', 'AT', 'MT',
  'CNG', 'LPG', 'EV', 'SUV', 'MPV', 'ABS', 'AC', 'PKR', 'CC', 'VVTI',
  'BRV', 'HRV', 'CRV', 'WRV', 'XL7', 'X70', 'X90', 'V2', 'S5',
]);

/* Wo naam jinki apni fixed spelling hai (dictionary jeet-ti hai) */
const EXACT = {
  'br-v': 'BR-V',
  'hr-v': 'HR-V',
  'cr-v': 'CR-V',
  'wagon r': 'Wagon R',
  'wagonr': 'Wagon R',
  'yaris sedan': 'Yaris Sedan',
  'land cruiser': 'Land Cruiser',
  'carry daba': 'Carry Daba',
  'e-tron': 'e-tron',
  'hi-roof': 'Hi-Roof',
  'mercedes-benz': 'Mercedes-Benz',
  'rolls-royce': 'Rolls-Royce',
  'range rover': 'Range Rover',
};

/**
 * Ek lafz ko theek karo — acronym, hyphen aur number+harf sab sambhal kar.
 *   "corolla"  → "Corolla"
 *   "mg"       → "MG"
 *   "br-v"     → "BR-V"
 *   "x70"      → "X70"
 */
function fixWord(word) {
  if (!word) return word;

  const upper = word.toUpperCase();
  if (ALL_CAPS.has(upper)) return upper;

  // Hyphen wale naam: har hissa alag se theek karo ("br-v" → "BR-V")
  if (word.includes('-')) {
    return word.split('-').map(fixWord).join('-');
  }

  // "x70", "v2", "s5" jaisay: harf + number = poora capital
  if (/^[a-z]{1,3}\d/i.test(word)) return upper;

  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

/**
 * Poore naam ko display ke liye theek karo.
 *
 *   toTitleCase('toyota corolla')  → 'Toyota Corolla'
 *   toTitleCase('MG HS')           → 'MG HS'
 *   toTitleCase('honda br-v')      → 'Honda BR-V'
 *   toTitleCase('  civic  ')       → 'Civic'
 *
 * @param {string} value
 * @returns {string}
 */
export function toTitleCase(value) {
  if (value === null || value === undefined) return '';
  const raw = String(value).trim().replace(/\s+/g, ' ');
  if (!raw) return '';

  const exact = EXACT[raw.toLowerCase()];
  if (exact) return exact;

  return raw.split(' ').map(fixWord).join(' ');
}

/**
 * Sirf pehla harf capital, baqi jaisa hai waisa hi (free-text ke liye —
 * jaise custom color jo user khud type karta hai).
 *
 *   sentenceCase('midnight purple')  → 'Midnight purple'
 */
export function sentenceCase(value) {
  if (!value) return '';
  const raw = String(value).trim();
  if (!raw) return '';
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

/**
 * Poori car ka display naam — brand + model + variant, sab theek shakal mein.
 *
 *   carTitle({ brand:'toyota', model:'corolla', variant:'gli' })
 *     → 'Toyota Corolla GLI'
 */
export function carTitle(car = {}) {
  return [car.brand, car.model, car.variant]
    .filter(Boolean)
    .map(toTitleCase)
    .join(' ')
    .trim();
}

/**
 * Insaan ka naam — "muneeb  ahmed" → "Muneeb Ahmed".
 * Dictionary/acronym ka jhamela nahi, sirf har lafz ka pehla harf.
 */
export function personName(value) {
  if (!value) return '';
  return String(value)
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(' ');
}

/**
 * ENUM ko parhne layak banao — 'CERTIFIED_PREOWNED' → 'Certified Preowned'.
 * Backend enums (BodyType, FuelType, Transmission) ke liye.
 */
export function humanizeEnum(value) {
  if (!value) return '';
  const upper = String(value).toUpperCase();
  if (ALL_CAPS.has(upper)) return upper;
  return String(value)
    .replace(/_/g, ' ')
    .toLowerCase()
    .split(' ')
    .map(fixWord)
    .join(' ');
}

export default toTitleCase;