'use client';
import { useLang } from '@/lib/i18nContext';
// frontend/components/admin/BlogTable.jsx
//
// ✅ COMPLETE FILE — purani par seedha replace kar dein.
//
// Kya badla: ab har error `getApiError()` se guzarta hai, is liye asal wajah
// dikhti hai (HTTP status + backend ka apna message) — na ke "Blogs load nahi
// ho sake" jaisa bekaar message. Har error console mein bhi jata hai.
//
// Features: search, status tabs, publish toggle, edit, delete confirm, pagination.

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Search, Plus, Pencil, Trash2, Eye, EyeOff, ExternalLink,
  Loader2, FileText, AlertCircle, RefreshCw,
} from 'lucide-react';

import { getAdminBlogs, setBlogStatus, deleteBlog, getApiError } from '@/lib/blogApi';
import { formatBlogDate } from '@/lib/blogHelpers';

const STATUS_TABS = [
  { key: '', labelKey: 'common.all' },
  { key: 'PUBLISHED', labelKey: 'blog.admin.status.live' },
  { key: 'DRAFT', labelKey: 'common.draft' },
];

export default function BlogTable() {
  const { t } = useLang();
  const [blogs, setBlogs] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [error, setError] = useState('');

  /* Search ko 400ms rukne do — har keystroke par API hit na ho */
  useEffect(() => {
    const id = setTimeout(() => { setDebounced(search); setPage(1); }, 400);
    return () => clearTimeout(id);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getAdminBlogs({
        page,
        limit: 10,
        ...(status ? { status } : {}),
        ...(debounced ? { search: debounced } : {}),
      });
      setBlogs(res?.data || []);
      setMeta(res?.meta || { page: 1, totalPages: 1, total: 0 });
    } catch (err) {
      setError(getApiError(err, t('admin.ui.blogLoadFailed')));
      console.error('[blog] list load fail:', err);
      setBlogs([]);
    } finally {
      setLoading(false);
    }
  }, [page, status, debounced]);

  useEffect(() => { load(); }, [load]);

  /* ── Actions ── */
  const toggleStatus = async (blog) => {
    setBusyId(blog.id);
    setError('');
    const next = blog.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    try {
      const res = await setBlogStatus(blog.id, next);
      setBlogs((prev) => prev.map((b) => (b.id === blog.id ? { ...b, ...res.data } : b)));
    } catch (err) {
      setError(getApiError(err, t('admin.ui.actionFailed')));
      console.error('[blog] status toggle fail:', err);
    } finally {
      setBusyId(null);
    }
  };

  const doDelete = async (id) => {
    setBusyId(id);
    setError('');
    try {
      await deleteBlog(id);
      setConfirmId(null);
      // Aakhri item delete hui aur page khali ho gaya → pichle page par jao
      if (blogs.length === 1 && page > 1) setPage((p) => p - 1);
      else load();
    } catch (err) {
      setError(getApiError(err, t('admin.ui.actionFailed')));
      console.error('[blog] delete fail:', err);
    } finally {
      setBusyId(null);
    }
  };

  const changeTab = (key) => { setStatus(key); setPage(1); };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* ── Header ── */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <FileText size={26} style={{ color: 'var(--accent)' }} />
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{t('nav.blog')}</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {meta.total} {t(meta.total === 1 ? 'admin.ui.post' : 'admin.ui.posts')}
          </p>
        </div>

        <Link
          href="/admin/blogs/new"
          className="ml-auto h-10 px-5 rounded-xl text-sm font-bold flex items-center gap-1.5"
          style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
        >
          <Plus size={16} /> {t('admin.ui.newBlog')}
        </Link>
      </div>

      {/* ── Error banner — ab asal wajah dikhati hai ── */}
      {error && (
        <div
          className="flex items-start gap-3 px-4 py-3.5 rounded-xl mb-4"
          style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)' }}
        >
          <AlertCircle size={18} style={{ color: '#dc2626' }} className="shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold" style={{ color: '#dc2626' }}>
              {t('admin.ui.problem')}
            </p>
            <p className="text-xs mt-1 break-words" style={{ color: '#dc2626', opacity: 0.85 }}>
              {error}
            </p>
          </div>
          <button
            type="button"
            onClick={load}
            className="shrink-0 h-8 px-3 rounded-lg text-xs font-bold flex items-center gap-1.5"
            style={{ border: '1px solid rgba(220,38,38,0.3)', color: '#dc2626' }}
          >
            <RefreshCw size={12} /> {t('admin.ui.retry')}
          </button>
        </div>
      )}

      {/* ── Tabs + search ── */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--bg-surface-alt)' }}>
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key || 'all'}
              type="button"
              onClick={() => changeTab(tab.key)}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors"
              style={
                status === tab.key
                  ? { background: 'var(--accent)', color: 'var(--accent-text)' }
                  : { color: 'var(--text-secondary)' }
              }
            >
              {t(tab.labelKey)}
            </button>
          ))}
        </div>

        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--text-muted)' }}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('admin.ui.searchTitle')}
            className="w-full h-10 pl-9 pr-3 rounded-xl text-sm outline-none"
            style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
            }}
          />
        </div>
      </div>

      {/* ── List ── */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}
      >
        {loading ? (
          <div className="p-5 space-y-3">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-16 rounded-xl animate-pulse"
                style={{ background: 'var(--skeleton-bg)' }}
              />
            ))}
          </div>
        ) : blogs.length === 0 ? (
          <div className="py-16 px-6 text-center">
            <FileText size={36} className="mx-auto mb-3" style={{ color: 'var(--border-color)' }} />
            <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
              {error
                ? t('admin.ui.listLoadFailed')
                : debounced || status
                ? t('common.noResults')
                : t('blog.admin.emptyTitle')}
            </p>
            <p className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>
              {error
                ? t('admin.ui.errorRead')
                : debounced || status
                ? t('admin.ui.changeFilter')
                : t('blog.admin.emptyHint')}
            </p>
            {!debounced && !status && !error && (
              <Link
                href="/admin/blogs/new"
                className="inline-flex h-10 px-5 rounded-xl text-sm font-bold items-center gap-1.5"
                style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
              >
                <Plus size={16} /> {t('admin.ui.newBlog')}
              </Link>
            )}
          </div>
        ) : (
          <div>
            {blogs.map((blog, i) => (
              <div
                key={blog.id}
                className="p-4 flex items-center gap-4 flex-wrap"
                style={{ borderTop: i === 0 ? 'none' : '1px solid var(--border-color)' }}
              >
                {/* Thumb */}
                <div
                  className="w-16 h-12 rounded-lg overflow-hidden shrink-0"
                  style={{ background: 'var(--bg-surface-alt)' }}
                >
                  {blog.featuredImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={blog.featuredImage} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FileText size={14} style={{ color: 'var(--text-muted)' }} />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p
                      className="font-semibold text-sm truncate max-w-[340px]"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {blog.title}
                    </p>
                    <span
                      className="text-[11px] px-2 py-0.5 rounded-full font-bold shrink-0"
                      style={
                        blog.status === 'PUBLISHED'
                          ? { background: 'rgba(22,163,74,0.12)', color: '#16a34a' }
                          : { background: 'var(--bg-surface-alt)', color: 'var(--text-muted)' }
                      }
                    >
                      {blog.status === 'PUBLISHED' ? t('admin.ui.live') : t('admin.ui.draft')}
                    </span>
                  </div>

                  <p
                    className="text-xs mt-1 flex items-center gap-2 flex-wrap"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {blog.category && <span>{blog.category}</span>}
                    {blog.category && <span>·</span>}
                    <span>{formatBlogDate(blog.publishedAt || blog.createdAt)}</span>
                    <span>·</span>
                    <span>{blog.viewCount ?? 0} views</span>
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {blog.status === 'PUBLISHED' && (
                    <a
                      href={`/blog/${blog.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={t('admin.ui.livePage')}
                      className="w-9 h-9 rounded-lg flex items-center justify-center"
                      style={{
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      <ExternalLink size={14} />
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() => toggleStatus(blog)}
                    disabled={busyId === blog.id}
                    title={blog.status === 'PUBLISHED' ? t('admin.ui.backToDraft') : t('admin.ui.publish')}
                    className="w-9 h-9 rounded-lg flex items-center justify-center disabled:opacity-40"
                    style={{
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {busyId === blog.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : blog.status === 'PUBLISHED' ? (
                      <EyeOff size={14} />
                    ) : (
                      <Eye size={14} />
                    )}
                  </button>

                  <Link
                    href={`/admin/blogs/${blog.id}/edit`}
                    title={t('admin.ui.edit')}
                    className="w-9 h-9 rounded-lg flex items-center justify-center"
                    style={{
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <Pencil size={14} />
                  </Link>

                  <button
                    type="button"
                    onClick={() => setConfirmId(blog.id)}
                    title={t('admin.ui.delete')}
                    className="w-9 h-9 rounded-lg flex items-center justify-center"
                    style={{ border: '1px solid rgba(220,38,38,0.3)', color: '#dc2626' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Delete confirm */}
                {confirmId === blog.id && (
                  <div
                    className="w-full mt-2 p-3 rounded-xl flex items-center gap-3 flex-wrap"
                    style={{ background: 'rgba(220,38,38,0.07)' }}
                  >
                    <p className="text-xs flex-1" style={{ color: '#dc2626' }}>
                      {t('admin.ui.deleteWarning', { title: blog.title })}
                    </p>
                    <button
                      type="button"
                      onClick={() => setConfirmId(null)}
                      className="h-8 px-3 rounded-lg text-xs font-bold"
                      style={{
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      {t('admin.ui.keep')}
                    </button>
                    <button
                      type="button"
                      onClick={() => doDelete(blog.id)}
                      disabled={busyId === blog.id}
                      className="h-8 px-3 rounded-lg text-xs font-bold text-white flex items-center gap-1.5 disabled:opacity-50"
                      style={{ background: '#dc2626' }}
                    >
                      {busyId === blog.id && <Loader2 size={12} className="animate-spin" />}
                      {t('admin.ui.delete')}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Pagination ── */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="h-9 px-4 rounded-xl text-xs font-bold disabled:opacity-35"
            style={{ border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
          >
            {t('admin.ui.previous')}
          </button>
          <span className="text-xs px-2" style={{ color: 'var(--text-muted)' }}>
            {meta.page} / {meta.totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
            disabled={page >= meta.totalPages}
            className="h-9 px-4 rounded-xl text-xs font-bold disabled:opacity-35"
            style={{ border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
          >
            {t('admin.ui.next')}
          </button>
        </div>
      )}
    </div>
  );
}