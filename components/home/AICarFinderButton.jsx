'use client';
import { useLang } from '@/lib/i18nContext';
// frontend/components/home/AICarFinderButton.jsx
//
// ✅ MOBILE FIX — Pehle mobile par yeh navbar ke bohot qareeb / overlap
//    karta tha aur swing thoda zyada tha jo chhote screen par distracting
//    lagta tha. Ab: top offset navbar se safe fasla rakhta hai, swing
//    amplitude kam ki, branch/button thora chhota kiya, aur bohot chhoti
//    screens (<=380px) par label hide ho jata hai — sirf icon dikhta hai
//    taake button tang na lage.
import { useRouter } from 'next/navigation';
import { Sparkles } from 'lucide-react';

export default function AICarFinderButton() {
  const { t } = useLang();
  const router = useRouter();

  return (
    <>
      {/* ━━━━━━━━━━━━━━━━━━ AI CAR FINDER — hanging branch tab ━━━━━━━━━━━━━━━━━━ */}
      <div className="ai-finder-wrap">
        <div className="ai-finder-swing">
          {/* the "branch" — vine line with two small leaves */}
          <div className="ai-finder-branch">
            <span className="ai-finder-leaf ai-finder-leaf--1" />
            <span className="ai-finder-leaf ai-finder-leaf--2" />
          </div>
          {/* the dangling button itself */}
          <button
            onClick={() => router.push('/ai-recommend')}
            className="ai-finder-btn"
            aria-label={t('nav.aiCarFinder')}
          >
            <span className="ai-finder-ring" />
            <Sparkles size={18} className="shrink-0 ai-finder-icon" />
            <span className="ai-finder-label">{t('nav.aiCarFinder')}</span>
          </button>
        </div>
      </div>

      <style jsx global>{`
        /* ── AI Car Finder — hanging branch tab ───────────────── */
        .ai-finder-wrap {
          position: fixed;
          top: 96px;
          left: 0;
          z-index: 45;
          pointer-events: none;
        }
        .ai-finder-swing {
          transform-origin: top center;
          animation: aiSwing 4.5s ease-in-out infinite;
          pointer-events: auto;
        }
        @keyframes aiSwing {
          0%, 100% { transform: rotate(-3.5deg); }
          50%      { transform: rotate(3.5deg); }
        }
        /* vine/branch */
        .ai-finder-branch {
          position: relative;
          width: 3px;
          height: 46px;
          margin: 0 0 0 34px;
          background: linear-gradient(to bottom, #8a6d3b, #5c4a28);
          border-radius: 2px;
        }
        .ai-finder-leaf {
          position: absolute;
          width: 12px;
          height: 7px;
          background: #4d7c3a;
          border-radius: 60% 10% 60% 10%;
        }
        .ai-finder-leaf--1 { top: 10px; left: -9px; transform: rotate(-25deg); }
        .ai-finder-leaf--2 { top: 24px; left: 3px;  transform: rotate(150deg); }
        /* dangling button */
        .ai-finder-btn {
          position: relative;
          display: flex;
          align-items: center;
          gap: 7px;
          background: linear-gradient(135deg, #f59e0b, #ea580c);
          color: #fff;
          font-weight: 700;
          font-size: 12.5px;
          padding: 10px 14px 10px 12px;
          border-radius: 0 999px 999px 0;
          box-shadow: 0 10px 22px -6px rgba(234,88,12,0.55);
          border: none;
          cursor: pointer;
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }
        .ai-finder-btn:hover {
          transform: translateX(3px) scale(1.04);
          box-shadow: 0 14px 28px -6px rgba(234,88,12,0.65);
        }
        .ai-finder-ring {
          position: absolute;
          inset: -4px;
          border-radius: 999px;
          animation: aiBlink 1.8s ease-out infinite;
          pointer-events: none;
        }
        @keyframes aiBlink {
          0%   { box-shadow: 0 0 0 0 rgba(245,158,11,0.65); }
          70%  { box-shadow: 0 0 0 14px rgba(245,158,11,0); }
          100% { box-shadow: 0 0 0 0 rgba(245,158,11,0); }
        }
        .ai-finder-label { white-space: nowrap; }
        .ai-finder-icon { }

        /* ✅ Mobile-only — floating, compact, and out of the way.
           Desktop stays untouched. The button is moved to the lower-right,
           the branch is hidden, and the label collapses to a clean icon-only pill so
           it no longer overlaps content or blocks taps. */
        @media (max-width: 640px) {
          .ai-finder-wrap {
            top: auto;
            bottom: 88px;
            left: auto;
            right: 12px;
            z-index: 20;
          }
          .ai-finder-swing {
            animation: none;
            transform: none !important;
          }
          .ai-finder-branch {
            display: none;
          }
          .ai-finder-btn {
            padding: 10px;
            border-radius: 999px;
            min-width: 44px;
            min-height: 44px;
            justify-content: center;
            gap: 0;
            box-shadow: 0 10px 18px -8px rgba(234,88,12,0.6);
          }
          .ai-finder-label {
            display: none;
          }
          .ai-finder-icon {
            width: 16px;
            height: 16px;
          }
        }
      `}</style>
    </>
  );
}