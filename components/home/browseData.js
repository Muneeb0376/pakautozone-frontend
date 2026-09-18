// frontend/components/home/browseData.js
//
// ✅ NAYI FILE — Issue 5 (main page ki categories, PakWheels jaisi)
//
// Ye file poori site ka EK source of truth hai. Homepage ka browse section,
// /cars ka filter sidebar, aur listing form — teenon yahin se data lete hain.
// Faida: agar kal koi nayi category ya shehar add karna ho to sirf yahan ek
// line likhni hai, teen jagah dhoondni nahi parti — aur teenon jagah ke
// options kabhi aapas mein mismatch nahi karte.
//
// ⚠️ AHEM — `query` object seedha URL ka querystring ban-ta hai. In keys ko
//    backend ke `buildCarFilter` (src/utils/filter.utils.js) ne pehchanna
//    hota hai. Filhal wo ye keys jaanta hai:
//        brand, model, city, bodyType, transmission, fuelType,
//        condition, minPrice, maxPrice, minYear, maxYear, isFeatured
//    Neeche kuch categories `tag` bhejti hain (jaise sports, luxury) — un
//    ke liye backend patch Phase 2 mein hai. Tab tak wo cars page khol kar
//    baqi filters laga deti hain, crash nahi karti.

/* ══════════════════════════════════════════════════
   1. CATEGORY — PakWheels ke "Browse Used Cars → Category" jaisa
   ══════════════════════════════════════════════════ */
export const BROWSE_CATEGORIES = [
  { label: 'Sports Cars',   query: { bodyType: 'COUPE' } },
  { label: 'Electric Cars', query: { fuelType: 'ELECTRIC' } },
  { label: 'Hybrid Cars',   query: { fuelType: 'HYBRID' } },
  { label: 'Luxury Cars',   query: { minPrice: '15000000' } },
  { label: 'Japanese Cars', query: { tag: 'japanese' } },
  { label: 'Automatic Cars', query: { transmission: 'AUTOMATIC' } },
  { label: 'Manual Cars',   query: { transmission: 'MANUAL' } },
  { label: 'Old Cars',      query: { maxYear: '2010' } },
  { label: 'New Cars',      query: { condition: 'NEW' } },
  { label: '7 Seater',      query: { bodyType: 'MINIVAN' } },
  { label: 'Carry Daba',    query: { bodyType: 'VAN' } },
  { label: 'Small Cars',    query: { bodyType: 'HATCHBACK' } },
  { label: 'Family Cars',   query: { bodyType: 'SEDAN' } },
  { label: 'Pickup / 4x4',  query: { bodyType: 'PICKUP' } },
  { label: 'CNG Cars',      query: { fuelType: 'CNG' } },
  { label: 'Diesel Cars',   query: { fuelType: 'DIESEL' } },
  { label: 'Modified Cars', query: { tag: 'modified' } },
  { label: 'Accidental',    query: { tag: 'accidental' } },
];

/* ══════════════════════════════════════════════════
   2. CITY — Pakistan ke wo shehar jahan gaari ki asal market hai
   ══════════════════════════════════════════════════ */
export const PK_CITIES = [
  'Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Peshawar',
  'Multan', 'Gujranwala', 'Sialkot', 'Sargodha', 'Hyderabad', 'Abbottabad',
  'Wah Cantt', 'Bahawalpur', 'Gujrat', 'Mardan', 'Quetta', 'Sahiwal',
  'Rahim Yar Khan', 'Jhelum', 'Sheikhupura', 'Attock', 'Okara', 'Chakwal',
  'Mansehra', 'Mandi Bahauddin', 'Swabi', 'Haripur', 'Jhang', 'Taxila',
  'Sukkur', 'Larkana', 'Nowshera', 'Kohat', 'Dera Ghazi Khan', 'Kasur',
];

/* ══════════════════════════════════════════════════
   3. MAKE — brand aur uske models. Listing form ka
      "Model" dropdown isi se bharta hai (brand chunne par).
   ══════════════════════════════════════════════════ */
export const MAKES = {
  Toyota:  ['Corolla', 'Yaris Sedan', 'Vitz', 'Prius', 'Land Cruiser', 'Fortuner', 'Hilux', 'Passo', 'Aqua', 'Raize', 'Rush', 'Prado', 'Camry', 'Corolla Cross'],
  Honda:   ['Civic', 'City', 'BR-V', 'HR-V', 'Vezel', 'Accord', 'Fit', 'Freed', 'N Wgn', 'N Box'],
  Suzuki:  ['Alto', 'Cultus', 'Wagon R', 'Mehran', 'Swift', 'Bolan', 'Ravi', 'Every', 'Khyber', 'Kei', 'Jimny', 'Ciaz'],
  Kia:     ['Sportage', 'Picanto', 'Stonic', 'Sorento', 'Carnival', 'Pegas'],
  Hyundai: ['Tucson', 'Elantra', 'Sonata', 'Porter', 'Santro', 'Ioniq'],
  Changan: ['Alsvin', 'Oshan X7', 'Karvaan', 'M9', 'Deepal'],
  MG:      ['HS', 'ZS', 'ZS EV', 'MG 5', 'Marvel R'],
  Nissan:  ['Dayz', 'Note', 'Juke', 'Sunny', 'Clipper', 'Sakura'],
  Daihatsu: ['Mira', 'Cuore', 'Move', 'Hijet', 'Terios', 'Tanto'],
  Haval:   ['H6', 'Jolion', 'H6 HEV'],
  Prince:  ['Pearl', 'K07', 'Pentium'],
  BMW:     ['3 Series', '5 Series', 'X1', 'X5', 'i8'],
  Mercedes: ['C Class', 'E Class', 'S Class', 'GLC', 'A Class'],
  Audi:    ['A3', 'A4', 'A6', 'Q2', 'Q5', 'e-tron'],
  BYD:     ['Atto 3', 'Seal', 'Sealion 6'],
  Chery:   ['Tiggo 4 Pro', 'Tiggo 8 Pro'],
  DFSK:    ['Glory 580', 'Glory 500', 'C37'],
  FAW:     ['V2', 'X-PV', 'Carrier'],
  Other:   [],
};

export const MAKE_NAMES = Object.keys(MAKES);

/* Homepage ke "Model" tab ke liye — Pakistan ke sab se zyada bikne wale */
export const POPULAR_MODELS = [
  'Corolla', 'Civic', 'City', 'Mehran', 'Cultus', 'Alto',
  'Wagon R', 'Swift', 'Vitz', 'Sportage', 'Prado', 'Yaris Sedan',
  'Bolan', 'Land Cruiser', 'Cuore', 'Raize', 'Hilux', 'Santro',
  'H6', 'Fortuner', 'Mira', 'Passo', 'HS', 'Vezel',
  'Tucson', 'Khyber', 'Prius', 'Alsvin', 'Dayz', 'BR-V',
];

/* ══════════════════════════════════════════════════
   4. BUDGET — PakWheels jaise lakh/crore ke slabs
      (1 lakh = 100,000 · 1 crore = 10,000,000)
   ══════════════════════════════════════════════════ */
export const BUDGET_RANGES = [
  { label: 'Cars under 5 Lakhs',  query: { maxPrice: '500000' } },
  { label: 'Cars under 10 Lakhs', query: { maxPrice: '1000000' } },
  { label: 'Cars under 20 Lakhs', query: { maxPrice: '2000000' } },
  { label: 'Cars under 30 Lakhs', query: { maxPrice: '3000000' } },
  { label: 'Cars under 40 Lakhs', query: { maxPrice: '4000000' } },
  { label: 'Cars under 50 Lakhs', query: { maxPrice: '5000000' } },
  { label: 'Cars under 60 Lakhs', query: { maxPrice: '6000000' } },
  { label: 'Cars under 80 Lakhs', query: { maxPrice: '8000000' } },
  { label: 'Cars under 1 Crore',  query: { maxPrice: '10000000' } },
  { label: 'Cars under 1.5 Crore', query: { maxPrice: '15000000' } },
  { label: 'Cars under 2 Crore',  query: { maxPrice: '20000000' } },
  { label: 'Cars above 2 Crore',  query: { minPrice: '20000000' } },
];

/* ══════════════════════════════════════════════════
   5. BODY TYPE — value backend ke BodyType enum se
      BILKUL match karti hai (schema.prisma dekhein)
   ══════════════════════════════════════════════════ */
export const BODY_TYPES = [
  { label: 'Sedan',     value: 'SEDAN' },
  { label: 'SUV',       value: 'SUV' },
  { label: 'Hatchback', value: 'HATCHBACK' },
  { label: 'Crossover', value: 'CROSSOVER' },
  { label: 'Coupe',     value: 'COUPE' },
  { label: 'Pickup',    value: 'PICKUP' },
  { label: 'Van',       value: 'VAN' },
  { label: 'Mini Van',  value: 'MINIVAN' },
];

/* ══════════════════════════════════════════════════
   6. Listing form ke baqi dropdowns — yahin se, taake
      form aur filter kabhi alag na hon
   ══════════════════════════════════════════════════ */
export const TRANSMISSIONS = [
  { label: 'Manual', value: 'MANUAL' },
  { label: 'Automatic', value: 'AUTOMATIC' },
  { label: 'CVT', value: 'CVT' },
];

export const FUEL_TYPES = [
  { label: 'Petrol', value: 'PETROL' },
  { label: 'Diesel', value: 'DIESEL' },
  { label: 'Hybrid', value: 'HYBRID' },
  { label: 'Electric', value: 'ELECTRIC' },
  { label: 'CNG', value: 'CNG' },
];

export const CONDITIONS = [
  { label: 'New Car', value: 'NEW' },
  { label: 'Used', value: 'USED' },
  { label: 'Certified Pre-Owned', value: 'CERTIFIED_PREOWNED' },
];

/* Exterior colors — `hex` sirf swatch dikhane ke liye hai, database mein
   naam (`name`) jata hai. User apna color type bhi kar sakta hai — us
   soorat mein `Other` chun kar text box bhar dete hain. */
export const EXTERIOR_COLORS = [
  { name: 'White',      hex: '#ffffff' },
  { name: 'Black',      hex: '#0b0b0b' },
  { name: 'Silver',     hex: '#c9ccd1' },
  { name: 'Grey',       hex: '#6b7280' },
  { name: 'Red',        hex: '#c0271f' },
  { name: 'Blue',       hex: '#1d4ed8' },
  { name: 'Navy Blue',  hex: '#12224f' },
  { name: 'Green',      hex: '#15803d' },
  { name: 'Beige',      hex: '#ded4bc' },
  { name: 'Brown',      hex: '#6b4527' },
  { name: 'Gold',       hex: '#c9a227' },
  { name: 'Maroon',     hex: '#5f1220' },
  { name: 'Orange',     hex: '#d4650f' },
  { name: 'Yellow',     hex: '#e2c113' },
  { name: 'Bronze',     hex: '#8c6239' },
  { name: 'Purple',     hex: '#5b21b6' },
];

/* Features — listing form ke checkboxes. `group` se form khud
   khaanay bana leta hai, alag list maintain nahi karni parti. */
export const CAR_FEATURES = [
  { group: 'Comfort', items: ['Air Conditioning', 'Climate Control', 'Heated Seats', 'Power Steering', 'Power Windows', 'Power Mirrors', 'Keyless Entry', 'Push Start', 'Cruise Control', 'Sunroof', 'Leather Seats'] },
  { group: 'Safety',  items: ['ABS Brakes', 'Airbags', 'Immobilizer Key', 'Rear Camera', 'Parking Sensors', 'Traction Control', 'Lane Assist', 'Child Lock'] },
  { group: 'Exterior', items: ['Alloy Wheels', 'Fog Lights', 'LED Headlights', 'Rear Spoiler', 'Roof Rails', 'Tinted Glass'] },
  { group: 'Infotainment', items: ['Touch Screen', 'Navigation System', 'Bluetooth', 'Apple CarPlay', 'Android Auto', 'USB / AUX', 'Rear Speakers'] },
];

/* Registration ke liye — Pakistan mein "registered in" har ad par poocha jata hai */
export const REGISTRATION_CITIES = ['Un-Registered', ...PK_CITIES, 'Punjab', 'Sindh', 'KPK', 'Balochistan', 'Islamabad Capital', 'Azad Kashmir'];

export const ASSEMBLY_TYPES = ['Local', 'Imported'];

export const SELLER_TYPES = [
  { label: 'Private Seller', value: 'PRIVATE' },
  { label: 'Dealer / Showroom', value: 'DEALER' },
];

/** Query object → URL string. `/cars?bodyType=SUV` */
export const toCarsHref = (query = {}) => {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') params.set(k, String(v));
  });
  const q = params.toString();
  return q ? `/cars?${q}` : '/cars';
};