// 갤러리 CG 카탈로그 — P4 전면 개편.
// story = /assets/cg/*.webp(9장, 씬 cg 커맨드의 unlock 키와 1:1 대응, 실제 파일 존재).
// special = /assets/cg/special/sp-{sea,riwon,yunseul}-{01..05}.webp(15장) — 별도 워커가
//   생성 중이라 파일이 아직 없을 수 있다. 갤러리 UI는 로드 실패 시 "준비중" 플레이스홀더로
//   우아하게 대체하므로, 파일이 없어도 카탈로그 등록 자체는 미리 해 둔다.
// 갤러리는 이제 해금 여부와 무관하게 전부 표시한다 — unlock 키 수집(save.ts cgGallery)은
// 계속 유지되지만 표시 조건에는 쓰지 않는다.
// 캡션 규칙: docs/SPECIAL-CG.md의 한줄 컨셉을 그대로 쓴다(뷰어 하단 1행 표시).

export type CgTab = 'story' | 'special';
export type HeroineId = 'sea' | 'riwon' | 'yunseul';

export interface CgCatalogEntry {
  id: string;
  tab: CgTab;
  src: string;
  title: string;
  heroine?: HeroineId; // 풀스크린 뷰어 보더 힌트 — 특정 히로인에 귀속되지 않는 컷은 생략
}

// docs/SPECIAL-CG.md의 컨셉 한 줄 (01~05 순서)
const SPECIAL_TITLES: Record<HeroineId, readonly string[]> = {
  sea: [
    '봄 아침 · 벚꽃 등굣길 역광',
    '여름 밤 · 강변 불꽃놀이',
    '심야 · 방송실 네온',
    '여름 오후 · 비 갠 운동장',
    '가을 골든아워 · 은행나무 낙엽',
  ],
  riwon: [
    '늦가을 오후 · 도서관 먼지 빛기둥',
    '여름 장마 · 방과후 복도 창가',
    '겨울 밤 · 첫눈 골목 가로등',
    '골든아워 · 노을 학생회실',
    '이른 봄 아침 · 안개 낀 무인 교정',
  ],
  yunseul: [
    '골든아워 · 옥상 코코아',
    '겨울 오후 · 눈 내리는 상담실 창가',
    '가을 오후 · 코스모스 들판',
    '블루아워 · 바닷가',
    '초여름 오후 · 등나무 그늘',
  ],
};

function specialEntries(heroine: HeroineId): CgCatalogEntry[] {
  return SPECIAL_TITLES[heroine].map((title, i) => {
    const n = String(i + 1).padStart(2, '0');
    return {
      id: `sp-${heroine}-${n}`,
      tab: 'special' as const,
      src: `/assets/cg/special/sp-${heroine}-${n}.webp`,
      title,
      heroine,
    };
  });
}

export const CG_CATALOG: CgCatalogEntry[] = [
  // ---- 스토리 CG (9) ----
  { id: 'g_cg_common_01', tab: 'story', src: '/assets/cg/cg_common_01.webp', title: '창고, 그날 밤' },
  { id: 'g_cg_sea_01', tab: 'story', src: '/assets/cg/cg_sea_01.webp', title: '방송부, 노을', heroine: 'sea' },
  { id: 'g_cg_sea_02', tab: 'story', src: '/assets/cg/cg_sea_02.webp', title: '창고 안쪽', heroine: 'sea' },
  { id: 'g_cg_riw_01', tab: 'story', src: '/assets/cg/cg_riw_01.webp', title: '빗속 회랑', heroine: 'riwon' },
  { id: 'g_cg_riw_02', tab: 'story', src: '/assets/cg/cg_riw_02.webp', title: '기록보관소', heroine: 'riwon' },
  { id: 'g_cg_yun_01', tab: 'story', src: '/assets/cg/cg_yun_01.webp', title: '옥상, 노을', heroine: 'yunseul' },
  { id: 'g_cg_yun_02', tab: 'story', src: '/assets/cg/cg_yun_02.webp', title: '상담실', heroine: 'yunseul' },
  { id: 'g_cg_true_01', tab: 'story', src: '/assets/cg/cg_true_01.webp', title: '병동' },
  { id: 'g_cg_true_02', tab: 'story', src: '/assets/cg/cg_true_02.webp', title: '가장 깊은 창고' },

  // ---- 특별 일러스트 (15) ----
  ...specialEntries('sea'),
  ...specialEntries('riwon'),
  ...specialEntries('yunseul'),
];
