// frontend/components/blog/BlogContent.jsx
//
// Blog ka asal article body render karta hai.
//
// ⚠️ NO 'use client' — ye jaan boojh kar Server Component hai. Article ka HTML
//    seedha server-rendered output mein jaata hai, isliye "View Page Source"
//    mein poora text nazar aata hai. SEO ka asal faida yahin hai.
//
// dangerouslySetInnerHTML kyun safe hai:
//   1. Content sirf ADMIN likhta hai (koi public submission nahi).
//   2. Save hone se PEHLE backend `blog.service.js` mein sanitize hota hai —
//      <script>, <iframe>, onerror= aur javascript: URLs sab wahin nikal
//      jaate hain. Yahan jo aa raha hai wo pehle se saaf hai.
//
// Typography (headings, paragraphs, images, lists) ki styling `.blog-prose`
// class se aati hai — wo app/globals.css mein add ki gayi hai.

export default function BlogContent({ html }) {
  if (!html) return null;

  // YouTube links are embeds, not files that an HTML5 video element can play.
  // Convert legacy video tags as well so already-published posts keep working.
  const renderHtml = html.replace(
    /<video\b([^>]*\bsrc=["']((?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)[^"']+)["'][^>]*)><\/video>/gi,
    (_, __, url) => {
      const match = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([\w-]+)/i);
      return match
        ? `<iframe src="https://www.youtube.com/embed/${match[1]}" title="Embedded video" loading="lazy" allowfullscreen frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"></iframe>`
        : _;
    },
  );

  return (
    <div
      className="blog-prose"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: renderHtml }}
    />
  );
}