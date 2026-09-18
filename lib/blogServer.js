// frontend/lib/blogServer.js
//
// ✅ UPDATED (v2) — ab errors chupate nahi hain.
//
// PURANA MASLA: fetch fail hone par ye null return karta tha, aur page usay
// "koi post nahi" dikha deta tha. Yani "backend band hai" aur "abhi koi blog
// nahi likha" bilkul ek jaise lagte thay — debug karna namumkin.
//
// AB: har list function `{ blogs, meta, error }` deta hai. `error` null ho to
// sab theek; warna us mein asal wajah hoti hai jo page par red banner mein
// dikhti hai.
//
// SERVER COMPONENTS ke liye. Client components `lib/blogApi.js` use karein.

const BACKEND_ORIGIN =
  process.env.BACKEND_ORIGIN ||
  process.env.NEXT_PUBLIC_BACKEND_ORIGIN ||
  'http://localhost:5000';

const API = `${BACKEND_ORIGIN}/api`;

/**
 * @returns {{ json: any|null, error: string|null }}
 */
async function getJson(path, { revalidate = 60 } = {}) {
  const url = `${API}${path}`;

  try {
    const res = await fetch(url, {
      next: { revalidate },
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      // Backend ka apna message nikaalne ki koshish
      let detail = '';
      try {
        const body = await res.json();
        detail = body?.message || '';
      } catch {
        detail = res.statusText;
      }

      const error = `[${res.status}] ${detail || 'Backend ne error diya'}`;
      console.error(`[blogServer] ${url} → ${error}`);
      return { json: null, error };
    }

    return { json: await res.json(), error: null };
  } catch (err) {
    // Yahan aana matlab request backend tak pohanchi hi nahi
    const error =
      `Backend se raabta nahi ho saka (${err.message}). ` +
      `Kya ${BACKEND_ORIGIN} par server chal raha hai?`;
    console.error(`[blogServer] ${url} → ${error}`);
    return { json: null, error };
  }
}

const qs = (params = {}) => {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') sp.set(k, String(v));
  });
  const s = sp.toString();
  return s ? `?${s}` : '';
};

/** Published posts ki list → { blogs, meta, error } */
export async function fetchPublishedBlogs(params = {}) {
  const { json, error } = await getJson(`/blogs${qs(params)}`, { revalidate: 60 });

  return {
    blogs: json?.data || [],
    meta: json?.meta || { total: 0, page: 1, limit: 9, totalPages: 0 },
    error,
  };
}

/** Filter bar ke liye categories → { categories, error } */
export async function fetchBlogCategories() {
  const { json, error } = await getJson('/blogs/meta/categories', { revalidate: 300 });
  return { categories: json?.data || [], error };
}

/** Ek published post (null agar na mile) */
export async function fetchBlogBySlug(slug) {
  const { json } = await getJson(`/blogs/${encodeURIComponent(slug)}`, {
    revalidate: 0, // viewCount har visit par barhna chahiye
  });
  return json?.data || null;
}

/** Related posts */
export async function fetchRelatedBlogs(slug, limit = 4) {
  const { json } = await getJson(
    `/blogs/${encodeURIComponent(slug)}/related?limit=${limit}`,
    { revalidate: 300 }
  );
  return json?.data || [];
}

/** sitemap.js ke liye sab published slugs */
export async function fetchAllBlogSlugs() {
  const { json } = await getJson('/blogs/meta/sitemap', { revalidate: 3600 });
  return json?.data || [];
}