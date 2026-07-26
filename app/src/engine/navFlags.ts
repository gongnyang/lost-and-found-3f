// 화면 간 "어디서 왔는지" 힌트 — sessionStorage 1칸짜리 아주 얇은 계층.
//
// 용도: /play의 QuickMenu에서 갤러리로 나갈 때 표식을 남기고, /gallery가 그 표식을 보고
// 「게임으로 돌아가기」 버튼을 노출한다. 타이틀에서 들어온 갤러리에는 나오지 않는다.
//
// 왜 URL 쿼리(?from=play)가 아닌가: Next 16에서 useSearchParams()는 정적 렌더 페이지에
// Suspense 경계를 강제하고, 뷰어 상태와 얽혀 히스토리가 지저분해진다. 이 표식은 순수
// UI 힌트라 유실돼도(새 탭·시크릿) 버튼 하나가 안 보일 뿐이므로 sessionStorage로 충분하다.
//
// 진행 상태 자체는 zustand 스토어(메모리)가 클라이언트 네비게이션 동안 그대로 유지하고,
// 만약을 위해 QuickMenu가 이탈 직전 오토세이브(슬롯 0)를 한 번 굽는다.

const PLAY_RETURN_KEY = 'miyensi:nav:galleryFromPlay';

function hasSession(): boolean {
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined';
}

/** /play → /gallery 로 나갈 때 표식을 남긴다. */
export function markGalleryFromPlay(): void {
  if (!hasSession()) return;
  try {
    window.sessionStorage.setItem(PLAY_RETURN_KEY, '1');
  } catch {
    /* 시크릿 모드 등에서 쓰기 실패 — 힌트일 뿐이므로 조용히 무시 */
  }
}

/** 갤러리가 「게임으로 돌아가기」를 보여야 하는가. */
export function isGalleryFromPlay(): boolean {
  if (!hasSession()) return false;
  try {
    return window.sessionStorage.getItem(PLAY_RETURN_KEY) === '1';
  } catch {
    return false;
  }
}

/** 타이틀로 나가는 등 플레이 세션 맥락을 벗어날 때 표식을 지운다. */
export function clearGalleryFromPlay(): void {
  if (!hasSession()) return;
  try {
    window.sessionStorage.removeItem(PLAY_RETURN_KEY);
  } catch {
    /* noop */
  }
}
