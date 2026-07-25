// 씬 스크립트 스키마 — docs/ARCHITECTURE.md §2.1 정본. 글자 그대로 구현, 임의 확장 금지.

export type CharId = 'haram' | 'sea' | 'riwon' | 'yunseul' | 'mob' | 'censor';
// 'haram' = 주인공(정하람). 네임플레이트는 flags.name_revealed===false 인 동안 「???」로 렌더,
// 스탠딩 이미지는 없음(대사 전용 화자). 'censor' = 검열자(전투/환각 화자), 네임플레이트 「검열자」,
// 스탠딩 이미지 없음. who: null = 지문/모놀로그(하람 1인칭 내레이션).
export type Expr =
  | 'neutral'
  | 'smile'
  | 'laugh'
  | 'blush'
  | 'sad'
  | 'angry'
  | 'surprise'
  | 'worry'
  | 'serious'
  | 'cry'
  | 'closed'; // 캐릭터당 6~10종 (closed=깜빡임용 눈감음 배리언트)
export type StagePos = 'left' | 'center' | 'right' | 'offL' | 'offR';

export type Command =
  | { t: 'say'; who: CharId | null; text: string; expr?: Expr } // who=null → 지문/모놀로그
  | {
      t: 'show';
      who: CharId;
      expr: Expr;
      pos: StagePos;
      enter?: 'fadeIn' | 'slideL' | 'slideR';
    }
  | { t: 'expr'; who: CharId; expr: Expr } // 표정만 스왑
  | { t: 'move'; who: CharId; pos: StagePos }
  | { t: 'hide'; who: CharId; exit?: 'fadeOut' | 'slideL' | 'slideR' }
  | { t: 'bg'; src: string; fx?: 'fade' | 'cut' | 'whiteFlash' }
  | { t: 'cg'; src: string; unlock: string } // 갤러리 해금 키
  | { t: 'cgHide' }
  | { t: 'bgm'; src: string | null; fade?: number } // null = stop
  | { t: 'sfx'; src: string }
  | { t: 'fx'; kind: 'shake' | 'flash' | 'blurMemory' | 'wait' | 'uiStrip'; dur?: number }
  // blurMemory = "기억" 연출용 화면 블러+탈색 (테마 전용 이펙트)
  // uiStrip = data-ui-state="unravel" 토글(전투3 UI 박리 연출). dur 후 해제, dur 없으면 유지,
  // dur:0은 즉시 해제 규약.
  | {
      t: 'choice';
      items: { label: string; goto: string; set?: FlagOp[]; if?: Cond }[];
    }
  | { t: 'set'; ops: FlagOp[] }
  | { t: 'nameInput' } // 이름 입력 오버레이 → 확정 시 mcName 저장 + name_revealed=true
  | { t: 'if'; cond: Cond; then: string; else?: string } // 라벨 점프
  | { t: 'label'; id: string }
  | { t: 'jump'; scene: string; label?: string } // 씬 간 이동
  | { t: 'battle'; id: string; onWin: string; onLose: string } // /battle 진입
  | { t: 'ending'; id: string }; // 엔딩 롤 → 타이틀

export type FlagOp = { key: string; op: 'set' | 'add'; value: number | boolean };
export type Cond =
  | { key: string; cmp: 'eq' | 'gte' | 'lte'; value: number | boolean }
  | { all: Cond[] }
  | { any: Cond[] };

export interface Scene {
  id: string; // 'ch01_common'
  title: string; // 백로그·세이브 표시용
  assets: { chars?: CharId[]; bgs?: string[]; cgs?: string[]; bgm?: string[] }; // 프리로드 힌트
  script: Command[];
}
