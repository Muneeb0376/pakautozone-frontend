'use client';
import { useLang } from '@/lib/i18nContext';
// frontend/components/admin/RichTextEditor.jsx
//
// ✅ POORI FILE REPLACE — Issue 1 ka pehla hissa
//
// Aap ka masla: "jab image lagao blog me to us ko bara ya chota karne ka
// option nahi hai".
//
// Ab teen tareeqon se size control hota hai:
//
//   1. DRAG — image par click karein, uske daayein neeche kone par ek chhota
//      gold handle aata hai. Usay pakad kar kheenchein, size live badalta hai.
//   2. PRESET BUTTONS — image select karte hi toolbar ke neeche ek dusri
//      patti khulti hai: 25% · 50% · 75% · 100%. Ek click, kaam khatam.
//   3. ALIGNMENT — usi patti mein left / center / right.
//
// ── YE KAAM KAISE KARTA HAI (taake baad mein samajh aaye) ──
// TipTap ka default Image node sirf `src`/`alt` jaanta hai. Hum ne usay
// `.extend()` kar ke do nayi attributes di hain:
//       width  → "60%" jaisi string, HTML mein style="width:60%" ban-ti hai
//       align  → "left" | "center" | "right", data-align attribute ban-ti hai
// Kyunki ye asli HTML attributes ban kar save hoti hain, is liye published
// blog page par bhi wahi size/alignment dikhta hai jo editor mein tha —
// koi alag "preview" logic likhne ki zarurat nahi.
//
// ⚠️ EK KAAM AUR ZAROORI HAI:
//    globals.css mein wo CSS block paste karna hai jo main ne alag file
//    (globals-additions.css) mein diya hai. Us ke bagair handle nazar nahi
//    aayega aur published page par alignment kaam nahi karega.
//
// INSTALL (agar pehle na kiya ho):
//   npm install @tiptap/react @tiptap/pm @tiptap/starter-kit @tiptap/extension-image

import { useEffect, useRef, useState, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import {
  Bold, Italic, Underline, Strikethrough,
  Heading2, Heading3, List, ListOrdered, Quote, Code,
  Minus, Link2, Link2Off, ImagePlus, Undo2, Redo2, Loader2, X,
  AlignLeft, AlignCenter, AlignRight, Type, Maximize2,
  Video,
} from 'lucide-react';

import { Node } from '@tiptap/core';
import { uploadBlogImage, uploadBlogVideo, getApiError } from '@/lib/blogApi';
import { wordCount, readingTime } from '@/lib/blogHelpers';

/* ═══════════════════════════════════════════════════════════
   RESIZABLE IMAGE — TipTap ke Image node ka barha hua version
   ═══════════════════════════════════════════════════════════ */
const ResizableImage = Image.extend({
  // Image ko selectable rakhna zaroori hai, warna click par toolbar ko
  // pata hi nahi chalega ke kaunsi image select hui hai.
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      ...this.parent?.(),

      /** "45%" jaisi string. null = poori chaurai (default). */
      width: {
        default: null,
        parseHTML: (el) => el.style.width || el.getAttribute('width') || null,
        renderHTML: (attrs) => (attrs.width ? { style: `width: ${attrs.width}` } : {}),
      },

      /** left | center | right */
      align: {
        default: 'center',
        parseHTML: (el) => el.getAttribute('data-align') || 'center',
        renderHTML: (attrs) => ({ 'data-align': attrs.align || 'center' }),
      },
    };
  },

  /* Editor ke andar ka apna DOM — is ke bagair drag handle nahi lag sakta */
  addNodeView() {
    return ({ node, editor, getPos }) => {
      const wrap = document.createElement('div');
      wrap.className = 'paz-img-wrap';
      wrap.setAttribute('data-align', node.attrs.align || 'center');
      if (node.attrs.width) wrap.style.width = node.attrs.width;

      const img = document.createElement('img');
      img.className = 'blog-inline-img';
      img.src = node.attrs.src || '';
      img.alt = node.attrs.alt || '';
      img.draggable = false;
      wrap.appendChild(img);

      // Gold handle — sirf hover/selection par nazar aata hai (CSS se)
      const handle = document.createElement('span');
      handle.className = 'paz-img-handle';
      handle.title = 'Drag to resize';
      wrap.appendChild(handle);

      let startX = 0;
      let startW = 0;
      let dragging = false;

      const containerWidth = () => {
        const p = wrap.parentElement;
        return (p && p.clientWidth) || 720;
      };

      const onMove = (e) => {
        if (!dragging) return;
        const delta = e.clientX - startX;
        const next = Math.max(60, startW + delta);
        const pct = Math.min(100, Math.max(10, Math.round((next / containerWidth()) * 100)));
        wrap.style.width = `${pct}%`;
      };

      const onUp = () => {
        if (!dragging) return;
        dragging = false;
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        document.body.style.userSelect = '';

        // Naya size document mein likh do, warna refresh par wapis purana
        const width = wrap.style.width || null;
        if (typeof getPos === 'function') {
          editor
            .chain()
            .focus()
            .setNodeSelection(getPos())
            .updateAttributes('image', { width })
            .run();
        }
      };

      const onDown = (e) => {
        e.preventDefault();
        e.stopPropagation();
        dragging = true;
        startX = e.clientX;
        startW = wrap.offsetWidth;
        document.body.style.userSelect = 'none';
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
      };

      handle.addEventListener('mousedown', onDown);

      return {
        dom: wrap,
        update(updated) {
          // Sirf isi node ki update qubool karo. Doosri qism ka node aaya
          // to `false` lauta dena ProseMirror ko batata hai ke node view
          // dobara banana parega.
          if (updated.type.name !== 'image') return false;
          img.src = updated.attrs.src || '';
          img.alt = updated.attrs.alt || '';
          wrap.setAttribute('data-align', updated.attrs.align || 'center');
          wrap.style.width = updated.attrs.width || '';
          return true;
        },
        selectNode() { wrap.classList.add('is-selected'); },
        deselectNode() { wrap.classList.remove('is-selected'); },
        // Image ek atom node hai — andar ka DOM ProseMirror ko dekhna nahi
        ignoreMutation: () => true,
        destroy() {
          handle.removeEventListener('mousedown', onDown);
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup', onUp);
        },
      };
    };
  },
});

const BlogVideo = Node.create({
  name: 'video',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      src: { default: null },
      controls: { default: true },
      preload: { default: 'metadata' },
    };
  },

  parseHTML() {
    return [{ tag: 'video' }];
  },

  renderHTML({ HTMLAttributes }) {
    const src = HTMLAttributes.src || '';
    const youtube = src.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([\w-]+)/i);
    if (youtube) {
      return ['iframe', {
        src: `https://www.youtube.com/embed/${youtube[1]}`,
        title: 'Embedded video',
        loading: 'lazy',
        allowfullscreen: 'true',
        frameborder: '0',
        allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share',
      }];
    }
    return ['video', HTMLAttributes];
  },
});

/* ─── Toolbar button ─── */
function TbButton({ onClick, active, disabled, title, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      aria-pressed={!!active}
      className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors disabled:opacity-35 disabled:cursor-not-allowed"
      style={{
        background: active ? 'var(--accent)' : 'transparent',
        color: active ? 'var(--accent-text)' : 'var(--text-secondary)',
      }}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="w-px h-6 mx-1 self-center shrink-0" style={{ background: 'var(--border-color)' }} />;
}

/* ─── Chhoti sized pill (25% / 50% ...) ─── */
function SizePill({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-7 px-2.5 rounded-md text-[11px] font-bold transition-colors"
      style={{
        background: active ? 'var(--accent)' : 'transparent',
        color: active ? 'var(--accent-text)' : 'var(--text-secondary)',
        border: '1px solid var(--border-color)',
      }}
    >
      {label}
    </button>
  );
}

export default function RichTextEditor({ value = '', onChange }) {
  const { t } = useLang();
  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const seededRef = useRef(false);

  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: true, // image select hote hi size patti dikhne ke liye lazmi

    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        link: {
          openOnClick: false,
          autolink: true,
          HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
        },
      }),
      ResizableImage.configure({
        inline: false,
        allowBase64: false,
        HTMLAttributes: { class: 'blog-inline-img', loading: 'lazy' },
      }),
      BlogVideo,
    ],

    content: value || '',

    editorProps: {
      attributes: {
        class: 'blog-editor-body focus:outline-none',
        spellcheck: 'false',
      },
    },

    onUpdate: ({ editor: ed }) => {
      const html = ed.getHTML();
      onChange?.(html === '<p></p>' ? '' : html);
    },
  });

  useEffect(() => {
    if (!editor || seededRef.current) return;
    if (value && value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false });
      seededRef.current = true;
    } else if (value) {
      seededRef.current = true;
    }
  }, [editor, value]);

  /* ── Inline image upload ── */
  const pickImage = () => {
    setUploadError('');
    fileInputRef.current?.click();
  };

  const handleImageFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !editor) return;

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image 5MB se kam honi chahiye.');
      return;
    }

    setUploading(true);
    setUploadError('');
    try {
      const url = await uploadBlogImage(file);
      editor
        .chain()
        .focus()
        .setImage({ src: url, alt: file.name.replace(/\.[^.]+$/, ''), width: '100%', align: 'center' })
        .run();
    } catch (err) {
      setUploadError(getApiError(err, 'Image upload nahi ho saki.'));
      console.error('[blog] inline image upload fail:', err);
    } finally {
      setUploading(false);
    }
  };

  const pickVideo = () => {
    setUploadError('');
    videoInputRef.current?.click();
  };

  const handleVideoFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !editor) return;

    if (!['video/mp4', 'video/webm', 'video/quicktime', 'video/x-m4v'].includes(file.type)) {
      setUploadError('Sirf MP4, WebM, MOV ya M4V video upload karein.');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setUploadError('Video 50MB se kam honi chahiye.');
      return;
    }

    setUploadingVideo(true);
    setUploadError('');
    try {
      const url = await uploadBlogVideo(file);
      editor.chain().focus().insertContent({
        type: 'video',
        attrs: { src: url, controls: true, preload: 'metadata' },
      }).run();
    } catch (err) {
      setUploadError(getApiError(err, 'Video upload nahi ho saki.'));
      console.error('[blog] video upload fail:', err);
    } finally {
      setUploadingVideo(false);
    }
  };

  const insertVideoUrl = () => {
    if (!editor) return;
    const input = window.prompt(t('admin.ui.videoUrl'));
    if (input === null) return;

    const url = input.trim();
    if (!/^https?:\/\/\S+$/i.test(url)) {
      setUploadError(t('admin.ui.videoUrlInvalid'));
      return;
    }

    setUploadError('');
    editor.chain().focus().insertContent({
      type: 'video',
      attrs: { src: url, controls: true, preload: 'metadata' },
    }).run();
  };

  /* ── Link ── */
  const toggleLink = useCallback(() => {
    if (!editor) return;
    if (editor.isActive('link')) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    const previous = editor.getAttributes('link')?.href || 'https://';
    const url = window.prompt(t('admin.ui.linkUrl'), previous);
    if (url === null) return;
    if (url.trim() === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run();
  }, [editor]);

  /* ── Image ki settings ── */
  const imgActive = editor?.isActive('image');
  const imgAttrs = imgActive ? editor.getAttributes('image') : {};

  const setImgWidth = (w) => editor?.chain().focus().updateAttributes('image', { width: w }).run();
  const setImgAlign = (a) => editor?.chain().focus().updateAttributes('image', { align: a }).run();

  const editAlt = () => {
    const next = window.prompt(t('admin.ui.altText'), imgAttrs.alt || '');
    if (next === null) return;
    editor?.chain().focus().updateAttributes('image', { alt: next.trim() }).run();
  };

  if (!editor) {
    return <div className="h-72 rounded-xl animate-pulse" style={{ background: 'var(--skeleton-bg)' }} />;
  }

  const words = wordCount(value);

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: '1px solid var(--border-color)', background: 'var(--card-bg)' }}
    >
      {/* ═══ Main toolbar ═══ */}
      <div
        className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 sticky top-0 z-10"
        style={{ background: 'var(--bg-surface-alt)', borderBottom: '1px solid var(--border-color)' }}
      >
        <TbButton title={t('admin.ui.bold')} active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold size={16} />
        </TbButton>
        <TbButton title={t('admin.ui.italic')} active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic size={16} />
        </TbButton>
        <TbButton title={t('admin.ui.underline')} active={editor.isActive('underline')}
          onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <Underline size={16} />
        </TbButton>
        <TbButton title={t('admin.ui.strikethrough')} active={editor.isActive('strike')}
          onClick={() => editor.chain().focus().toggleStrike().run()}>
          <Strikethrough size={16} />
        </TbButton>

        <Divider />

        <TbButton title={t('admin.ui.headingLarge')} active={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          <Heading2 size={16} />
        </TbButton>
        <TbButton title={t('admin.ui.headingSmall')} active={editor.isActive('heading', { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
          <Heading3 size={16} />
        </TbButton>

        <Divider />

        <TbButton title={t('admin.ui.bulletList')} active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List size={16} />
        </TbButton>
        <TbButton title={t('admin.ui.numberedList')} active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered size={16} />
        </TbButton>
        <TbButton title={t('admin.ui.quote')} active={editor.isActive('blockquote')}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          <Quote size={16} />
        </TbButton>
        <TbButton title={t('admin.ui.codeBlock')} active={editor.isActive('codeBlock')}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
          <Code size={16} />
        </TbButton>
        <TbButton title={t('admin.ui.lineDivider')}
          onClick={() => editor.chain().focus().setHorizontalRule().run()}>
          <Minus size={16} />
        </TbButton>

        <Divider />

        <TbButton
          title={editor.isActive('link') ? t('common.remove') : t('common.add')}
          active={editor.isActive('link')}
          onClick={toggleLink}
        >
          {editor.isActive('link') ? <Link2Off size={16} /> : <Link2 size={16} />}
        </TbButton>
        <TbButton title={t('admin.ui.addImage')} onClick={pickImage} disabled={uploading || uploadingVideo} active={imgActive}>
          {uploading ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}
        </TbButton>
        <TbButton title={t('admin.ui.addVideo')} onClick={pickVideo} disabled={uploading || uploadingVideo}>
          {uploadingVideo ? <Loader2 size={16} className="animate-spin" /> : <Video size={16} />}
        </TbButton>
        <TbButton title={t('admin.ui.addVideoLink')} onClick={insertVideoUrl} disabled={uploading || uploadingVideo}>
          <Link2 size={16} />
        </TbButton>

        <Divider />

        <TbButton title={t('admin.ui.undo')}
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}>
          <Undo2 size={16} />
        </TbButton>
        <TbButton title={t('admin.ui.redo')}
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}>
          <Redo2 size={16} />
        </TbButton>

        <span className="ml-auto text-xs px-2 tabular-nums" style={{ color: 'var(--text-muted)' }}>
          {t('admin.ui.wordsRead', { words: words.toLocaleString(), minutes: readingTime(value) })}
        </span>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleImageFile}
        className="hidden"
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime,video/x-m4v"
        onChange={handleVideoFile}
        className="hidden"
      />

      {/* ═══ IMAGE PATTI — sirf tab jab koi image select ho ═══ */}
      {imgActive && (
        <div
          className="flex flex-wrap items-center gap-2 px-3 py-2"
          style={{ background: 'rgba(232,184,75,0.08)', borderBottom: '1px solid var(--border-color)' }}
        >
          <span
            className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider mr-1"
            style={{ color: 'var(--accent)' }}
          >
            <Maximize2 size={12} />
            {t('admin.ui.addImage')}
          </span>

          {/* Size presets */}
          <div className="flex items-center gap-1">
            {['25%', '50%', '75%', '100%'].map((w) => (
              <SizePill
                key={w}
                label={w}
                active={(imgAttrs.width || '100%') === w}
                onClick={() => setImgWidth(w)}
              />
            ))}
          </div>

          <Divider />

          {/* Alignment */}
          <div className="flex items-center gap-0.5">
            <TbButton title={t('admin.ui.left')} active={imgAttrs.align === 'left'} onClick={() => setImgAlign('left')}>
              <AlignLeft size={15} />
            </TbButton>
            <TbButton title={t('admin.ui.center')} active={(imgAttrs.align || 'center') === 'center'} onClick={() => setImgAlign('center')}>
              <AlignCenter size={15} />
            </TbButton>
            <TbButton title={t('admin.ui.right')} active={imgAttrs.align === 'right'} onClick={() => setImgAlign('right')}>
              <AlignRight size={15} />
            </TbButton>
          </div>

          <Divider />

          <TbButton title={t('admin.ui.alt')} onClick={editAlt}>
            <Type size={15} />
          </TbButton>

          <span className="ml-auto text-[11px] hidden sm:block" style={{ color: 'var(--text-muted)' }}>
            {t('admin.ui.dragImage')}
          </span>
        </div>
      )}

      {/* ═══ Upload error ═══ */}
      {uploadError && (
        <div className="flex items-start gap-2 px-4 py-2.5" style={{ background: 'rgba(220,38,38,0.07)' }}>
          <p className="text-xs flex-1 break-words" style={{ color: '#dc2626' }}>{uploadError}</p>
          <button type="button" onClick={() => setUploadError('')} aria-label={t('common.close')} style={{ color: '#dc2626' }}>
            <X size={13} />
          </button>
        </div>
      )}

      {/* ═══ Likhne ki jagah ═══ */}
      <EditorContent editor={editor} />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleImageFile}
        className="hidden"
      />
    </div>
  );
}