// frontend/lib/partHelpers.js

const API = process.env.NEXT_PUBLIC_API_URL || '/api';
const BASE_URL = API.replace('/api', '');

// ✅ Robust image URL builder
export const getImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};

// ✅ Phone masking - shows first 4 digits + last 3 digits
export const maskPhone = (phone) => {
  if (!phone) return null;
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length < 7) return phone;
  return `${cleaned.slice(0, 4)}-****-${cleaned.slice(-3)}`;
};

// ✅ WhatsApp link builder with proper Pakistani number formatting
export const getWhatsAppLink = (phone) => {
  if (!phone) return null;
  const cleaned = phone.replace(/\D/g, '');
  let whatsappNumber = cleaned;
  if (cleaned.startsWith('0')) {
    whatsappNumber = '92' + cleaned.slice(1);
  }
  const message = 'Assalam o Alaikum! Mujhe ye part chahiye.';
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
};

export { API, BASE_URL };