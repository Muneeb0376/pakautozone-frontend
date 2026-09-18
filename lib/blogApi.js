// frontend/lib/blogApi.js
//
// ✅ UPDATED (v2) — ab `getApiError()` bhi export hoti hai.
//
// PURANA MASLA: har component apna generic message dikhata tha
// ("Blogs load nahi ho sake"), jis se pata hi nahi chalta tha ke asal wajah
// kya hai — backend band hai? role galat hai? table nahi bani?
//
// AB: `getApiError(err)` asal HTTP status aur backend ka apna message nikaal
// kar deti hai, jaise:
//     "Backend se jawab nahi aaya (Network Error) — kya backend chal raha hai?"
//     "[403] Access denied. Required role: ADMIN. Your role: SELLER"
//     "[500] Blog table nahi mili"
//
// Ye `@/lib/api` ke axios instance par chalti hai — JWT token
// (localStorage 'auth-storage' → state.token) khud lag jata hai.
//
// SERVER COMPONENTS ye file use NA karein — un ke liye `lib/blogServer.js`.

import { api } from '@/lib/api';

/**
 * Axios error se insaan ke parhne laiq message banati hai.
 * Har blog component isi ko use karta hai taake message hamesha ek jaisa ho.
 */
export const getApiError = (err, fallback = 'Kuch ghalat ho gaya.') => {
  // Request bheji gayi lekin jawab aaya hi nahi → backend down / proxy fail
  if (err?.request && !err?.response) {
    return `Backend se jawab nahi aaya (${err.message}). Kya backend server chal raha hai?`;
  }

  const status = err?.response?.status;
  const msg = err?.response?.data?.message;

  if (status && msg) return `[${status}] ${msg}`;
  if (status === 403) return '[403] Ye kaam sirf ADMIN kar sakta hai. Apna role check karein.';
  if (status === 401) return '[401] Login khatam ho gaya. Dobara login karein.';
  if (status === 404) return '[404] Ye endpoint nahi mila — kya backend par blog routes mount hain?';
  if (status) return `[${status}] ${err.message}`;

  return msg || err?.message || fallback;
};

// ══════════════════════════════════════════════════════════════
// ADMIN — sirf ADMIN role, warna backend 403 dega
// ══════════════════════════════════════════════════════════════

/** Naya blog. status: 'DRAFT' | 'PUBLISHED' */
export const createBlog = (payload) => api.post('/blogs/admin', payload);

/** Admin table. params: { page, limit, status, search, category } */
export const getAdminBlogs = (params = {}) => api.get('/blogs/admin/all', { params });

/** Edit form ke liye ek blog (draft bhi) */
export const getAdminBlogById = (id) => api.get(`/blogs/admin/${id}`);

/** Blog update */
export const updateBlog = (id, payload) => api.put(`/blogs/admin/${id}`, payload);

/** Sirf status toggle */
export const setBlogStatus = (id, status) =>
  api.patch(`/blogs/admin/${id}/status`, { status });

/** Blog delete */
export const deleteBlog = (id) => api.delete(`/blogs/admin/${id}`);

/**
 * Ek image Cloudinary par → URL wapas.
 * Featured image picker AUR editor ka inline image, dono yehi use karte hain.
 *
 * @param {File} file
 * @returns {Promise<string>} Cloudinary URL
 */
export const uploadBlogImage = async (file) => {
  const formData = new FormData();
  formData.append('image', file); // ⚠️ field ka naam `image` hi hona chahiye

  const res = await api.postForm('/blogs/admin/upload-image', formData);
  const url = res?.data?.url || res?.url;

  if (!url) {
    throw new Error(
      'Image upload ho gayi lekin backend ne URL wapas nahi kiya. ' +
      'Cloudinary env variables check karein.'
    );
  }
  return url;
};

export const uploadBlogVideo = async (file) => {
  const formData = new FormData();
  formData.append('video', file);

  const res = await api.postForm('/blogs/admin/upload-video', formData);
  const url = res?.data?.url || res?.url;

  if (!url) {
    throw new Error('Video upload ho gayi lekin backend ne URL wapas nahi kiya.');
  }
  return url;
};

// ══════════════════════════════════════════════════════════════
// PUBLIC — auth ki zaroorat nahi
// ══════════════════════════════════════════════════════════════

export const getPublishedBlogs = (params = {}) => api.get('/blogs', { params });
export const getBlogCategories = () => api.get('/blogs/meta/categories');
export const getBlogBySlug = (slug) => api.get(`/blogs/${slug}`);
export const getRelatedBlogs = (slug, limit = 4) =>
  api.get(`/blogs/${slug}/related`, { params: { limit } });