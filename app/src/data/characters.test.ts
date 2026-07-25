import { describe, expect, it } from 'vitest';
import { getCharacterMeta, resolveNameplate } from './characters';

describe('resolveNameplate — 화자 네임플레이트 표기 규칙 (STORY.md §0/§2)', () => {
  it('renders ??? for haram while name_revealed is false', () => {
    expect(resolveNameplate('haram', { nameRevealed: false, mcName: null })).toBe('???');
    // 확정 전엔 mcName이 우연히 채워져 있어도(방어적 상태) ???를 유지한다.
    expect(resolveNameplate('haram', { nameRevealed: false, mcName: '정하람' })).toBe('???');
  });

  it('renders the confirmed mcName for haram once name_revealed is true', () => {
    expect(resolveNameplate('haram', { nameRevealed: true, mcName: '정하람' })).toBe('정하람');
  });

  it('falls back to ??? for haram if name_revealed is true but mcName is somehow missing', () => {
    expect(resolveNameplate('haram', { nameRevealed: true, mcName: null })).toBe('???');
  });

  it('always renders 검열자 for censor regardless of name_revealed', () => {
    expect(resolveNameplate('censor', { nameRevealed: false, mcName: null })).toBe('검열자');
    expect(resolveNameplate('censor', { nameRevealed: true, mcName: '정하람' })).toBe('검열자');
  });

  it('renders the heroine name for sea/riwon/yunseul from CHARACTERS meta', () => {
    expect(resolveNameplate('sea', { nameRevealed: false, mcName: null })).toBe('문세아');
    expect(resolveNameplate('riwon', { nameRevealed: false, mcName: null })).toBe('백리원');
    expect(resolveNameplate('yunseul', { nameRevealed: false, mcName: null })).toBe('강윤슬');
  });

  it('returns null for narration (who=null) and for mob (no static meta)', () => {
    expect(resolveNameplate(null, { nameRevealed: false, mcName: null })).toBeNull();
    expect(resolveNameplate('mob', { nameRevealed: false, mcName: null })).toBeNull();
  });
});

describe('getCharacterMeta — haram/censor/mob have no standing art', () => {
  it('returns null for haram, censor, and mob', () => {
    expect(getCharacterMeta('haram')).toBeNull();
    expect(getCharacterMeta('censor')).toBeNull();
    expect(getCharacterMeta('mob')).toBeNull();
  });
});
