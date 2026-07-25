// 갤러리 CG 카탈로그 — P4 전면 개편.
// story = /assets/cg/*.webp(9장, 씬 cg 커맨드의 unlock 키와 1:1 대응, 실제 파일 존재).
// special = /assets/cg/special/sp-{sea,riwon,yunseul}-{01..05}.webp(15장) — 별도 워커가
//   생성 중이라 파일이 아직 없을 수 있다. 갤러리 UI는 로드 실패 시 "준비중" 플레이스홀더로
//   우아하게 대체하므로, 파일이 없어도 카탈로그 등록 자체는 미리 해 둔다.
// 갤러리는 이제 해금 여부와 무관하게 전부 표시한다 — unlock 키 수집(save.ts cgGallery)은
// 계속 유지되지만 표시 조건에는 쓰지 않는다.
// 캡션 규칙: docs/SPECIAL-CG.md가 있으면 그 한줄 컨셉을 반영하고, 없으면 캐릭터명+번호로
// 채운다(작성 시점에 해당 문서 없음 → 캐릭터명+번호 적용).

export type CgTab = 'story' | 'special';
export type HeroineId = 'sea' | 'riwon' | 'yunseul';

export interface CgCatalogEntry {
  id: string;
  tab: CgTab;
  src: string;
  title: string;
  heroine?: HeroineId; // 풀스크린 뷰어 보더 힌트 — 특정 히로인에 귀속되지 않는 컷은 생략
}

const HEROINE_NAME: Record<HeroineId, string> = {
  sea: '문세아',
  riwon: '백리원',
  yunseul: '강윤슬',
};

function specialEntries(heroine: HeroineId): CgCatalogEntry[] {
  return Array.from({ length: 5 }, (_, i) => {
    const n = String(i + 1).padStart(2, '0');
    return {
      id: `sp-${heroine}-${n}`,
      tab: 'special' as const,
      src: `/assets/cg/special/sp-${heroine}-${n}.webp`,
      title: `${HEROINE_NAME[heroine]} ${n}`,
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
