// ✅ Pakistan provinces + major cities mapping
// Used for dependent Province → City dropdowns across the app
// File path: frontend/lib/pakistanLocations.js

export const PAKISTAN_LOCATIONS = {
  Punjab: [
    'Lahore', 'Faisalabad', 'Rawalpindi', 'Multan', 'Gujranwala',
    'Sialkot', 'Sargodha', 'Bahawalpur', 'Sahiwal', 'Gujrat',
    'Rahim Yar Khan', 'Sheikhupura', 'Jhang', 'Kasur', 'Okara',
  ],
  Sindh: [
    'Karachi', 'Hyderabad', 'Sukkur', 'Larkana',
    'Mirpurkhas', 'Nawabshah', 'Thatta', 'Jacobabad',
  ],
  'Khyber Pakhtunkhwa': [
    'Peshawar', 'Abbottabad', 'Mardan', 'Swat', 'Kohat',
    'Mingora', 'Bannu', 'Haripur', 'Nowshera', 'Mansehra', 'Charsadda',
  ],
  Balochistan: [
    'Quetta', 'Gwadar', 'Turbat', 'Khuzdar', 'Sibi', 'Zhob', 'Chaman',
  ],
  'Islamabad Capital Territory': [
    'Islamabad',
  ],
  'Azad Kashmir': [
    'Muzaffarabad', 'Mirpur', 'Rawalakot', 'Kotli', 'Bagh',
  ],
  'Gilgit-Baltistan': [
    'Gilgit', 'Skardu', 'Hunza', 'Chilas', 'Ghizer',
  ],
};

export const PROVINCES = Object.keys(PAKISTAN_LOCATIONS);

export const getCitiesByProvince = (province) =>
  PAKISTAN_LOCATIONS[province] || [];

// Helper: get all cities (flat list) — useful for city-only dropdowns
export const ALL_CITIES = Object.values(PAKISTAN_LOCATIONS).flat();

// Helper: find which province a city belongs to
export const getProvinceByCity = (city) => {
  for (const [province, cities] of Object.entries(PAKISTAN_LOCATIONS)) {
    if (cities.includes(city)) return province;
  }
  return null;
};