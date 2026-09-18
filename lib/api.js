// frontend/lib/api.js

import axios from 'axios';

// ✅ FIX: Ab sab kuch same-origin proxy (next.config.ts rewrites) se hota
// hai — isliye request hamesha relative '/api' per jaani chahiye, chahe
// site localhost per khuli ho ya ngrok domain per. window.location.hostname
// wali purani logic ngrok ke sath conflict karti thi (backend port 5000
// tunnel nahi hota), isliye hata di gayi hai.
const getBaseURL = () => process.env.NEXT_PUBLIC_API_URL || '/api';

const axiosInstance = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true,
});

const getToken = () => {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem('auth-storage');
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    return parsed?.state?.token || null;
  } catch {
    return null;
  }
};

axiosInstance.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const PUBLIC_AUTH_PATHS = ['/auth/login', '/auth/register', '/auth/google'];

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || '';
    const isPublicAuthCall = PUBLIC_AUTH_PATHS.some((p) => url.includes(p));

    if (
      typeof window !== 'undefined' &&
      error.response?.status === 401 &&
      !isPublicAuthCall
    ) {
      localStorage.removeItem('auth-storage');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const api = {
  get: async (endpoint, config = {}) => {
    const response = await axiosInstance.get(endpoint, config);
    return response.data;
  },
  post: async (endpoint, data = {}, config = {}) => {
    const response = await axiosInstance.post(endpoint, data, config);
    return response.data;
  },
  put: async (endpoint, data = {}, config = {}) => {
    const response = await axiosInstance.put(endpoint, data, config);
    return response.data;
  },
  patch: async (endpoint, data = {}, config = {}) => {
    const response = await axiosInstance.patch(endpoint, data, config);
    return response.data;
  },
  delete: async (endpoint, config = {}) => {
    const response = await axiosInstance.delete(endpoint, config);
    return response.data;
  },
  postForm: async (endpoint, formData) => {
    const token = getToken();
    const response = await axiosInstance.post(endpoint, formData, {
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });
    return response.data;
  },
  putForm: async (endpoint, formData) => {
    const token = getToken();
    const response = await axiosInstance.put(endpoint, formData, {
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });
    return response.data;
  },
};

export default axiosInstance;