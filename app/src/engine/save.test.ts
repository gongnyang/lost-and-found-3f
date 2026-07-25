import { beforeEach, describe, expect, it } from 'vitest';

// vitest 기본 environment는 'node'라 window/localStorage가 없다. save.ts의 hasStorage()가
// window.localStorage 존재 여부로 분기하므로, 테스트 전용 인메모리 localStorage를 주입한다.
class MemoryStorage {
  private store = new Map<string, string>();
  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null;
  }
  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
  clear(): void {
    this.store.clear();
  }
}

beforeEach(() => {
  // @ts-expect-error — 테스트 환경에 전역 window를 주입
  globalThis.window = { localStorage: new MemoryStorage() };
});

describe('saveSlot / loadSlot — 스냅샷 왕복', () => {
  it('round-trips a full VN snapshot byte-for-byte (deep equal)', async () => {
    const { saveSlot, loadSlot, SAVE_VERSION } = await import('./save');
    const { DEFAULT_SETTINGS } = await import('./interpreter');

    const snapshot = {
      sceneId: 'ch01_common',
      sceneTitle: '1장 · 소리 없는 아침',
      cursor: 12,
      flags: { aff_haru: 2, demo_met_haru: true },
      stage: [{ who: 'sea' as const, expr: 'smile' as const, pos: 'center' as const }],
      speaker: 'sea' as const,
      dialogue: { who: 'sea' as const, text: '...고마워, 리원.', expr: 'smile' as const },
      choice: null,
      bg: '/assets/bg/classroom.svg',
      bgm: null,
      cg: null,
      cgUnlocked: [],
      settings: DEFAULT_SETTINGS,
    };

    saveSlot(3, snapshot);
    const loaded = loadSlot(3);

    expect(loaded).not.toBeNull();
    expect(loaded?.ver).toBe(SAVE_VERSION);
    expect(loaded?.sceneId).toBe(snapshot.sceneId);
    expect(loaded?.cursor).toBe(snapshot.cursor);
    expect(loaded?.flags).toEqual(snapshot.flags);
    expect(loaded?.stage).toEqual(snapshot.stage);
    expect(loaded?.dialogue).toEqual(snapshot.dialogue);
    expect(loaded?.bg).toBe(snapshot.bg);
    expect(loaded?.settings).toEqual(snapshot.settings);
    expect(typeof loaded?.savedAt).toBe('string');
  });

  it('slot 0 is the autosave slot and is independent from manual slots', async () => {
    const { saveSlot, loadSlot } = await import('./save');
    const { DEFAULT_SETTINGS } = await import('./interpreter');
    const base = {
      sceneId: 'a',
      sceneTitle: 'A',
      cursor: 0,
      flags: {},
      stage: [],
      speaker: null,
      dialogue: null,
      choice: null,
      bg: null,
      bgm: null,
      cg: null,
      cgUnlocked: [],
      settings: DEFAULT_SETTINGS,
    };
    saveSlot(0, { ...base, sceneId: 'auto' });
    saveSlot(1, { ...base, sceneId: 'manual' });
    expect(loadSlot(0)?.sceneId).toBe('auto');
    expect(loadSlot(1)?.sceneId).toBe('manual');
  });

  it('rejects out-of-range slots', async () => {
    const { saveSlot } = await import('./save');
    const { DEFAULT_SETTINGS } = await import('./interpreter');
    const base = {
      sceneId: 'a',
      sceneTitle: 'A',
      cursor: 0,
      flags: {},
      stage: [],
      speaker: null,
      dialogue: null,
      choice: null,
      bg: null,
      bgm: null,
      cg: null,
      cgUnlocked: [],
      settings: DEFAULT_SETTINGS,
    };
    expect(() => saveSlot(10, base)).toThrow();
    expect(() => saveSlot(-1, base)).toThrow();
  });

  it('returns null for an empty slot', async () => {
    const { loadSlot } = await import('./save');
    expect(loadSlot(7)).toBeNull();
  });
});

describe('global data — endings/CG gallery persist independently of save slots', () => {
  it('unlockEnding accumulates without duplicates', async () => {
    const { unlockEnding, loadGlobal } = await import('./save');
    unlockEnding('demo_ending_plain');
    unlockEnding('demo_ending_plain');
    unlockEnding('demo_ending_warm');
    const g = loadGlobal();
    expect(g.endings.sort()).toEqual(['demo_ending_plain', 'demo_ending_warm']);
  });

  it('unlockCgGallery merges keys across calls', async () => {
    const { unlockCgGallery, loadGlobal } = await import('./save');
    unlockCgGallery(['aoi_route_1']);
    unlockCgGallery(['aoi_route_1', 'haru_route_1']);
    const g = loadGlobal();
    expect(g.cgGallery.sort()).toEqual(['aoi_route_1', 'haru_route_1']);
  });
});
