// 갤러리 CG 카탈로그 — cg 커맨드의 unlock 키와 1:1 대응. 데모 씬은 아직 CG 커맨드를 쓰지
// 않아(플레이스홀더 범위가 실루엣 3인+배경 2장으로 한정) 전부 잠김 상태로 렌더된다.
// 실제 CG 원화가 들어오면 unlock 키를 씬 스크립트의 cg.unlock 값과 맞춰 채운다.

export interface CgCatalogEntry {
  key: string;
  title: string;
  src: string; // public/assets/cg/ 아래 최종 경로 (아직 파일 없음)
}

export const CG_CATALOG: CgCatalogEntry[] = [
  { key: 'aoi_route_1', title: 'Aoi · ???', src: '/assets/cg/aoi_route_1.webp' },
  { key: 'haru_route_1', title: 'Haru · ???', src: '/assets/cg/haru_route_1.webp' },
  { key: 'sena_route_1', title: 'Sena · ???', src: '/assets/cg/sena_route_1.webp' },
];
