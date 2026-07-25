'use client';

// /gallery — 전체 해금 CG 갤러리(스토리 CG / 특별 일러스트 탭) + 엔딩 리스트. §2.3 개편(P4).
// CG는 처음부터 전부 열람 가능하다 — 해금 여부는 표시 조건에 쓰지 않는다.

import { useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type TouchEvent } from 'react';
import Link from 'next/link';
import { loadGlobal } from '@/engine/save';
import { CG_CATALOG, type CgTab, type HeroineId } from '@/data/cgCatalog';

const TABS: { key: CgTab; label: string }[] = [
  { key: 'story', label: '스토리 CG' },
  { key: 'special', label: '특별 일러스트' },
];

const HEROINE_ACCENT: Record<HeroineId, string> = {
  sea: '#E8916B',
  riwon: '#7C8FB0',
  yunseul: '#6B3A4B',
};

const SWIPE_THRESHOLD = 40;

export default function GalleryPage() {
  const [endings, setEndings] = useState<string[]>([]);
  const [tab, setTab] = useState<CgTab>('story');
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [failed, setFailed] = useState<Record<string, boolean>>({});
  const viewerRef = useRef<HTMLDivElement | null>(null);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    // 마운트 시 1회, localStorage(외부 시스템)를 읽어 클라이언트 전용으로 hydrate.
    const g = loadGlobal();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEndings(g.endings);
  }, []);

  const items = useMemo(() => CG_CATALOG.filter((cg) => cg.tab === tab), [tab]);

  useEffect(() => {
    if (viewerIndex !== null) viewerRef.current?.focus();
  }, [viewerIndex]);

  function handleTabChange(next: CgTab) {
    setTab(next);
    setViewerIndex(null);
  }

  function markFailed(id: string) {
    setFailed((f) => (f[id] ? f : { ...f, [id]: true }));
  }

  function step(delta: number) {
    setViewerIndex((cur) => {
      if (cur === null || items.length === 0) return cur;
      return (cur + delta + items.length) % items.length;
    });
  }

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Escape') setViewerIndex(null);
    else if (e.key === 'ArrowRight') step(1);
    else if (e.key === 'ArrowLeft') step(-1);
  }

  function handleTouchStart(e: TouchEvent<HTMLDivElement>) {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  }

  function handleTouchEnd(e: TouchEvent<HTMLDivElement>) {
    const start = touchStartX.current;
    touchStartX.current = null;
    if (start === null) return;
    const end = e.changedTouches[0]?.clientX ?? start;
    const dx = end - start;
    if (Math.abs(dx) < SWIPE_THRESHOLD) return;
    step(dx < 0 ? 1 : -1);
  }

  const active = viewerIndex !== null ? items[viewerIndex] : null;

  return (
    <div className="screen">
      <h1 className="screen-title">갤러리</h1>
      <p className="screen-subtitle">엔딩 {endings.length}개 해금</p>

      <div className="gallery-tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            className={`gallery-tab${tab === t.key ? ' gallery-tab-active' : ''}`}
            onClick={() => handleTabChange(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="gallery-grid">
        {items.map((cg, i) => {
          const accent = cg.heroine ? HEROINE_ACCENT[cg.heroine] : undefined;
          return (
            <button
              key={cg.id}
              type="button"
              className="gallery-tile"
              style={accent ? ({ '--gallery-tile-accent': accent } as CSSProperties) : undefined}
              onClick={() => setViewerIndex(i)}
            >
              {failed[cg.id] ? (
                <span className="gallery-tile-pending">준비중</span>
              ) : (
                <img
                  src={cg.src}
                  alt={cg.title}
                  loading="lazy"
                  onError={() => markFailed(cg.id)}
                />
              )}
            </button>
          );
        })}
      </div>

      {endings.length > 0 && (
        <div className="menu-col">
          <p className="screen-subtitle">해금된 엔딩</p>
          {endings.map((id) => (
            <div key={id} className="menu-btn">
              {id}
            </div>
          ))}
        </div>
      )}

      <Link className="menu-btn-link" href="/">
        타이틀로
      </Link>

      {active && (
        <div
          className="gallery-viewer"
          role="dialog"
          aria-modal="true"
          aria-label={active.title}
          tabIndex={-1}
          ref={viewerRef}
          onClick={() => setViewerIndex(null)}
          onKeyDown={handleKeyDown}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {items.length > 1 && (
            <button
              type="button"
              className="gallery-viewer-nav gallery-viewer-prev"
              aria-label="이전 컷"
              onClick={(e) => {
                e.stopPropagation();
                step(-1);
              }}
            >
              ‹
            </button>
          )}

          <div
            className="gallery-viewer-frame"
            style={
              active.heroine
                ? ({ '--gallery-viewer-accent': HEROINE_ACCENT[active.heroine] } as CSSProperties)
                : undefined
            }
            onClick={(e) => e.stopPropagation()}
          >
            {failed[active.id] ? (
              <div className="gallery-viewer-pending">이미지 준비중</div>
            ) : (
              <img
                className="gallery-viewer-img"
                src={active.src}
                alt={active.title}
                onError={() => markFailed(active.id)}
              />
            )}
            <p className="gallery-viewer-caption">{active.title}</p>
          </div>

          {items.length > 1 && (
            <button
              type="button"
              className="gallery-viewer-nav gallery-viewer-next"
              aria-label="다음 컷"
              onClick={(e) => {
                e.stopPropagation();
                step(1);
              }}
            >
              ›
            </button>
          )}
        </div>
      )}
    </div>
  );
}
