'use client';

// /gallery — CG 해금제 갤러리 + 엔딩 리스트. §2.3.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { loadGlobal } from '@/engine/save';
import { CG_CATALOG } from '@/data/cgCatalog';

export default function GalleryPage() {
  const [unlocked, setUnlocked] = useState<string[]>([]);
  const [endings, setEndings] = useState<string[]>([]);

  useEffect(() => {
    // 마운트 시 1회, localStorage(외부 시스템)를 읽어 클라이언트 전용으로 hydrate.
    const g = loadGlobal();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUnlocked(g.cgGallery);
    setEndings(g.endings);
  }, []);

  return (
    <div className="screen">
      <h1 className="screen-title">갤러리</h1>
      <p className="screen-subtitle">CG 해금 {unlocked.length} / {CG_CATALOG.length} · 엔딩 {endings.length}개 해금</p>

      <div className="gallery-grid">
        {CG_CATALOG.map((cg) => {
          const isUnlocked = unlocked.includes(cg.key);
          return (
            <div key={cg.key} className="gallery-tile">
              {isUnlocked ? <img src={cg.src} alt={cg.title} /> : <span>??? 잠김</span>}
            </div>
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
    </div>
  );
}
