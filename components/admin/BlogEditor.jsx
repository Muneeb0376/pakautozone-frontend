'use client';
import { useLang } from '@/lib/i18nContext';
// frontend/components/admin/BlogEditor.jsx
//
// ✅ COMPLETE FILE — purani par seedha replace kar dein.
//
// Kya badla: save aur featured-image ke errors ab `getApiError()` se guzarte
// hain, is liye asal wajah dikhti hai (HTTP status + backend ka message) aur
// poora error console mein bhi jata hai.
//
// New aur Edit — dono pages yehi component use karte hain, bas `mode` aur
// `initialBlog` alag hote hain. Save ka logic bhi yahin hai, taake dono ka
// behaviour kabhi alag na ho jaye.

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Save, Send, ImagePlus, X, Loader2, ArrowLeft,
  ChevronDown, AlertCircle, CheckCircle2, Eye,
} from 'lucide-react';

import RichTextEditor from './RichTextEditor';
import { createBlog, updateBlog, uploadBlogImage, getApiError } from '@/lib/blogApi';
import { BLOG_CATEGORIES, wordCount } from '@/lib/blogHelpers';

/* Slug ka live preview — backend ka slugify isi rule par chalta hai */
const previewSlug = (title) =>
  String(title || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/['’"“”]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/g, '');

const LABEL = 'block text-xs font-bold mb-1.5';
const INPUT = 'w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-colors';

export default function BlogEditor({ mode = 'new', initialBlog = null }) {
  const { t } = useLang();
  const router = useRouter();
  const featuredInputRef = useRef(null);

  const [form, setForm] = useState({
    title: '',
    content: '',
    excerpt: '',
    featuredImage: '',
    category: '',
    tags: [],
    metaTitle: '',
    metaDescription: '',
    status: 'DRAFT',
  });

  const [tagDraft, setTagDraft] = useState('');
  const [seoOpen, setSeoOpen] = useState(false);
  const [saving, setSaving] = useState(null); // 'DRAFT' | 'PUBLISHED' | null
  const [uploadingCover, setUploadingCover] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const isCustomCategory = form.category && !BLOG_CATEGORIES.includes(form.category);

  /* Edit mode: aaya hua blog form mein bhar do */
  useEffect(() => {
    if (!initialBlog) return;
    setForm({
      title: initialBlog.title || '',
      content: initialBlog.content || '',
      excerpt: initialBlog.excerpt || '',
      featuredImage: initialBlog.featuredImage || '',
      category: initialBlog.category || '',
      tags: Array.isArray(initialBlog.tags) ? initialBlog.tags : [],
      metaTitle: initialBlog.metaTitle || '',
      metaDescription: initialBlog.metaDescription || '',
      status: initialBlog.status || 'DRAFT',
    });
  }, [initialBlog]);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  /* ── Tags ── */
  const addTag = () => {
    const tagValue = tagDraft.trim().replace(/,$/, '');
    if (!tagValue) return;
    if (form.tags.includes(tagValue)) { setTagDraft(''); return; }
    if (form.tags.length >= 20) { setError(`${t('common.max')} 20 tags.`); return; }
    set('tags', [...form.tags, tagValue]);
    setTagDraft('');
  };

  const onTagKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(); }
    if (e.key === 'Backspace' && !tagDraft && form.tags.length) {
      set('tags', form.tags.slice(0, -1));
    }
  };

  /* ── Featured image ── */
  const handleCoverFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError(t('common.imageRequirements'));
      return;
    }

    setUploadingCover(true);
    setError('');
    try {
      const url = await uploadBlogImage(file);
      set('featuredImage', url);
    } catch (err) {
      // ✅ Asal wajah dikhao
      setError(getApiError(err, t('common.uploading')));
      console.error('[blog] featured image fail:', err);
    } finally {
      setUploadingCover(false);
    }
  };

  /* ── Save ── */
  const handleSave = async (status) => {
    setError('');
    setSuccess('');

    if (!form.title.trim()) {
      setError(t('common.required'));
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!form.content.trim()) {
      setError(t('common.description'));
      return;
    }

    setSaving(status);
    const payload = { ...form, status };

    try {
      if (mode === 'edit' && initialBlog?.id) {
        await updateBlog(initialBlog.id, payload);
        setSuccess(status === 'PUBLISHED' ? t('admin.ui.live') : t('admin.ui.draft'));
      } else {
        await createBlog(payload);
        setSuccess(status === 'PUBLISHED' ? t('admin.ui.live') : t('common.saved'));
      }

      // Thoda ruk kar list par wapis — taake user message parh sake
      setTimeout(() => {
        router.push('/admin/blogs');
        router.refresh();
      }, 700);
    } catch (err) {
      // ✅ Asal wajah dikhao
      setError(getApiError(err, t('common.saveFailed')));
      console.error('[blog] save fail:', err);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSaving(null);
    }
  };

  const slug = initialBlog?.slug || previewSlug(form.title);
  const words = wordCount(form.content);
  const busy = saving !== null;

  const fieldStyle = {
    background: 'var(--bg-surface-alt)',
    border: '1px solid var(--border-color)',
    color: 'var(--text-primary)',
  };
  const cardStyle = {
    background: 'var(--card-bg)',
    border: '1px solid var(--border-color)',
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* ── Header ── */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <Link
          href="/admin/blogs"
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
          aria-label={t('common.back')}
        >
          <ArrowLeft size={16} />
        </Link>

        <div className="min-w-0">
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {mode === 'edit' ? t('admin.ui.blogEdit') : t('admin.ui.newBlog')}
          </h1>
          {slug && (
            <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
              /blog/{slug}
            </p>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {mode === 'edit' && initialBlog?.status === 'PUBLISHED' && (
            <a
              href={`/blog/${initialBlog.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="h-10 px-3 rounded-xl text-sm font-semibold flex items-center gap-1.5"
              style={{ border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
            >
              <Eye size={15} /> {t('admin.ui.livePage')}
            </a>
          )}

          <button
            type="button"
            onClick={() => handleSave('DRAFT')}
            disabled={busy}
            className="h-10 px-4 rounded-xl text-sm font-bold flex items-center gap-1.5 disabled:opacity-50"
            style={{ border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
          >
            {saving === 'DRAFT' ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            {t('common.save')} {t('common.draft')}
          </button>

          <button
            type="button"
            onClick={() => handleSave('PUBLISHED')}
            disabled={busy}
            className="h-10 px-5 rounded-xl text-sm font-bold flex items-center gap-1.5 disabled:opacity-50"
            style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
          >
            {saving === 'PUBLISHED' ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            {form.status === 'PUBLISHED' && mode === 'edit' ? t('common.update') : t('common.publish')}
          </button>
        </div>
      </div>

      {/* ── Messages — ab asal wajah ── */}
      {error && (
        <div
          className="flex items-start gap-3 px-4 py-3.5 rounded-xl mb-4"
          style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)' }}
        >
          <AlertCircle size={18} style={{ color: '#dc2626' }} className="shrink-0 mt-0.5" />
          <p className="text-sm flex-1 break-words" style={{ color: '#dc2626' }}>
            {error}
          </p>
          <button type="button" onClick={() => setError('')} aria-label={t('common.close')}
            style={{ color: '#dc2626' }}>
            <X size={15} />
          </button>
        </div>
      )}
      {success && (
        <div
          className="flex items-center gap-2 text-sm px-4 py-3 rounded-xl mb-4"
          style={{ background: 'rgba(22,163,74,0.10)', color: '#16a34a' }}
        >
          <CheckCircle2 size={16} /> {success}
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_320px] gap-6 items-start">
        {/* ══ MAIN COLUMN ══ */}
        <div className="space-y-4 min-w-0">
          <input
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder={t('blog.admin.titlePh')}
            className="w-full px-4 py-3.5 rounded-xl text-2xl font-bold outline-none"
            style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
            }}
          />

          <RichTextEditor value={form.content} onChange={(html) => set('content', html)} />

          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {t('admin.ui.tip', { words: words.toLocaleString() })}
          </p>
        </div>

        {/* ══ SIDEBAR ══ */}
        <aside className="space-y-4 lg:sticky lg:top-4">
          {/* Featured image */}
          <div className="rounded-2xl p-4" style={cardStyle}>
            <label className={LABEL} style={{ color: 'var(--text-primary)' }}>{t('blog.admin.featuredImage')}</label>

            {form.featuredImage ? (
              <div className="relative rounded-xl overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={form.featuredImage} alt={t('common.featured')} className="w-full aspect-video object-cover" />
                <button
                  type="button"
                  onClick={() => set('featuredImage', '')}
                  className="absolute top-2 right-2 w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(0,0,0,0.6)', color: '#fff' }}
                  aria-label={t('common.remove')}
                >
                  <X size={15} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => featuredInputRef.current?.click()}
                disabled={uploadingCover}
                className="w-full aspect-video rounded-xl flex flex-col items-center justify-center gap-1.5 text-xs"
                style={{ border: '1.5px dashed var(--border-color)', color: 'var(--text-muted)' }}
              >
                {uploadingCover ? <Loader2 size={20} className="animate-spin" /> : <ImagePlus size={20} />}
                {uploadingCover ? t('common.uploading') : t('admin.ui.chooseCover')}
              </button>
            )}

            <input
              ref={featuredInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleCoverFile}
              className="hidden"
            />
            <p className="text-[11px] mt-2" style={{ color: 'var(--text-muted)' }}>
              {t('admin.ui.coverHint')}
            </p>
          </div>

          {/* Category + Tags */}
          <div className="rounded-2xl p-4" style={cardStyle}>
            <label className={LABEL} style={{ color: 'var(--text-primary)' }}>{t('parts.category')}</label>
            <select
              value={isCustomCategory ? '__custom__' : form.category}
              onChange={(e) => set('category', e.target.value === '__custom__' ? '' : e.target.value)}
              className={INPUT}
              style={fieldStyle}
            >
              <option value="">{t('common.none')}</option>
              {BLOG_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
              <option value="__custom__">{t('admin.ui.addCategory')}</option>
            </select>
            {(isCustomCategory || form.category === '') && (
              <input
                value={isCustomCategory ? form.category : ''}
                onChange={(e) => set('category', e.target.value)}
                placeholder={t('admin.ui.categoryName')}
                className={`${INPUT} mt-2`}
                style={fieldStyle}
                maxLength={80}
              />
            )}

            <label className={`${LABEL} mt-4`} style={{ color: 'var(--text-primary)' }}>{t('blog.tags')}</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {form.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium"
                  style={{ background: 'var(--bg-surface-alt)', color: 'var(--text-secondary)' }}
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => set('tags', form.tags.filter((t) => t !== tag))}
                    aria-label={`${tag} hatao`}
                  >
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
            <input
              value={tagDraft}
              onChange={(e) => setTagDraft(e.target.value)}
              onKeyDown={onTagKeyDown}
              onBlur={addTag}
              placeholder={t('blog.admin.tagsHint')}
              className={INPUT}
              style={fieldStyle}
            />
            <p className="text-[11px] mt-1.5" style={{ color: 'var(--text-muted)' }}>
              {t('admin.ui.tagsHint')}
            </p>
          </div>

          {/* Excerpt */}
          <div className="rounded-2xl p-4" style={cardStyle}>
            <label className={LABEL} style={{ color: 'var(--text-primary)' }}>{t('blog.admin.excerpt')} <span style={{ color: 'var(--text-muted)' }}>{t('admin.ui.optional')}</span>
            </label>
            <textarea
              value={form.excerpt}
              onChange={(e) => set('excerpt', e.target.value)}
              rows={3}
              maxLength={300}
              placeholder={t('blog.admin.excerptHint')}
              className={`${INPUT} resize-none`}
              style={fieldStyle}
            />
            <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
              {form.excerpt.length}/300
            </p>
          </div>

          {/* SEO */}
          <div className="rounded-2xl overflow-hidden" style={cardStyle}>
            <button
              type="button"
              onClick={() => setSeoOpen((v) => !v)}
              className="w-full px-4 py-3 flex items-center justify-between text-xs font-bold"
              style={{ color: 'var(--text-primary)' }}
              aria-expanded={seoOpen}
            >{t('blog.admin.seo')}<ChevronDown
                size={15}
                className="transition-transform"
                style={{ transform: seoOpen ? 'rotate(180deg)' : 'none' }}
              />
            </button>

            {seoOpen && (
              <div className="px-4 pb-4 space-y-3">
                <div>
                  <label className={LABEL} style={{ color: 'var(--text-secondary)' }}>{t('blog.admin.metaTitle')}</label>
                  <input
                    value={form.metaTitle}
                    onChange={(e) => set('metaTitle', e.target.value)}
                    maxLength={70}
                    placeholder={t('admin.ui.emptyEqualsTitle')}
                    className={INPUT}
                    style={fieldStyle}
                  />
                  <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
                    {t('admin.ui.googleCount', { count: `${form.metaTitle.length}/70`, limit: 60 })}
                  </p>
                </div>

                <div>
                  <label className={LABEL} style={{ color: 'var(--text-secondary)' }}>{t('blog.admin.metaDescription')}</label>
                  <textarea
                    value={form.metaDescription}
                    onChange={(e) => set('metaDescription', e.target.value)}
                    rows={3}
                    maxLength={200}
                    placeholder={t('admin.ui.emptyEqualsExcerpt')}
                    className={`${INPUT} resize-none`}
                    style={fieldStyle}
                  />
                  <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
                    {t('admin.ui.googleCount', { count: `${form.metaDescription.length}/200`, limit: 155 })}
                  </p>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}