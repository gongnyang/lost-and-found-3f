// Howler 래퍼 — BGM 크로스페이드/SFX. 브라우저 전용(SSR 가드 필수).

import { Howl } from 'howler';

let currentBgm: Howl | null = null;
let currentBgmSrc: string | null = null;

const sfxCache = new Map<string, Howl>();

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

/** BGM 재생. 같은 src가 이미 재생 중이면 무시. src=null이면 정지와 동일. */
export function playBgm(src: string | null, volume = 0.7, fadeMs = 600): void {
  if (!isBrowser()) return;
  if (src === null) {
    stopBgm(fadeMs);
    return;
  }
  if (currentBgmSrc === src && currentBgm?.playing()) return;

  const prev = currentBgm;
  const next = new Howl({ src: [src], loop: true, volume: 0 });
  currentBgm = next;
  currentBgmSrc = src;
  next.play();
  next.fade(0, volume, fadeMs);

  if (prev) {
    prev.fade(prev.volume(), 0, fadeMs);
    setTimeout(() => prev.stop(), fadeMs + 50);
  }
}

export function stopBgm(fadeMs = 600): void {
  if (!isBrowser() || !currentBgm) return;
  const prev = currentBgm;
  prev.fade(prev.volume(), 0, fadeMs);
  setTimeout(() => prev.stop(), fadeMs + 50);
  currentBgm = null;
  currentBgmSrc = null;
}

export function setBgmVolume(volume: number): void {
  currentBgm?.volume(volume);
}

export function playSfx(src: string, volume = 0.8): void {
  if (!isBrowser() || !src) return;
  let howl = sfxCache.get(src);
  if (!howl) {
    howl = new Howl({ src: [src] });
    sfxCache.set(src, howl);
  }
  howl.volume(volume);
  howl.play();
}

export function stopAllAudio(): void {
  if (!isBrowser()) return;
  currentBgm?.stop();
  currentBgm = null;
  currentBgmSrc = null;
  sfxCache.forEach((h) => h.stop());
}
