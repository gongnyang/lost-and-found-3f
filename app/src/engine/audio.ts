// Howler 래퍼 — BGM 크로스페이드/SFX. 브라우저 전용(SSR 가드 필수).

import { Howl } from 'howler';

/**
 * 오디오 키 → 실제 적재 파일 해석표.
 *
 * 씬 스크립트(`data/scenes/*.ts`, 컨버터 자동 생성)는 원고가 정한 역할 키(`bgm_daily` …)를 쓰고,
 * 실제 파일은 곡 단위로 적재되어 있다(`main-daily.ogg` …, 대장은 `pipeline/audio/LICENSES.md`).
 * 양쪽 다 수정 대상이 아니라 재생 직전에 여기서 해석한다. 표에 없는 경로는 그대로 통과.
 * P4 QA에서 BGM 8키 전부 404였던 결함의 수리 지점.
 */
const AUDIO_ALIASES: Record<string, string> = {
  '/assets/audio/bgm/bgm_daily.ogg': '/assets/audio/bgm/main-daily.ogg',
  '/assets/audio/bgm/bgm_sea.ogg': '/assets/audio/bgm/theme-sea.ogg',
  '/assets/audio/bgm/bgm_riwon.ogg': '/assets/audio/bgm/theme-riwon.ogg',
  '/assets/audio/bgm/bgm_yunseul.ogg': '/assets/audio/bgm/theme-yunseul.ogg',
  '/assets/audio/bgm/bgm_unease.ogg': '/assets/audio/bgm/tension.ogg',
  '/assets/audio/bgm/bgm_battle.ogg': '/assets/audio/bgm/battle.ogg',
  '/assets/audio/bgm/bgm_true.ogg': '/assets/audio/bgm/true-end.ogg',
  // 호명(트루엔딩) 전용 곡은 아직 미확보 — 같은 트루 루트 테마를 그대로 이어 쓴다.
  '/assets/audio/bgm/bgm_homyeong.ogg': '/assets/audio/bgm/true-end.ogg',
  // 전투 스킬 SFX도 같은 사유로 역할 키만 있고 파일은 카탈로그 이름으로 적재되어 있다.
  '/assets/audio/sfx/hit.ogg': '/assets/audio/sfx/hit-1.ogg',
  '/assets/audio/sfx/heavy.ogg': '/assets/audio/sfx/hit-2.ogg',
  '/assets/audio/sfx/heal.ogg': '/assets/audio/sfx/buff-heal.ogg',
  '/assets/audio/sfx/ultimate.ogg': '/assets/audio/sfx/battle-sting.ogg',
};

function resolveAudioSrc(src: string): string {
  return AUDIO_ALIASES[src] ?? src;
}

let currentBgm: Howl | null = null;
let currentBgmSrc: string | null = null;

const sfxCache = new Map<string, Howl>();

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

/** BGM 재생. 같은 src가 이미 재생 중이면 무시. src=null이면 정지와 동일. */
export function playBgm(rawSrc: string | null, volume = 0.7, fadeMs = 600): void {
  if (!isBrowser()) return;
  if (rawSrc === null) {
    stopBgm(fadeMs);
    return;
  }
  const src = resolveAudioSrc(rawSrc);
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

export function playSfx(rawSrc: string, volume = 0.8): void {
  if (!isBrowser() || !rawSrc) return;
  const src = resolveAudioSrc(rawSrc);
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
