# miyensi — 웹 VN 최종 구현 설계 (SSOT)

프로젝트 가칭 **miyensi** · 테마 "기억과 상실" · 미디엄 데모 (30~60분, 1.5~3만자) · 자작 React/Next.js VN 런타임 · Vercel 배포
승인 게이트 4개: ①트리트먼트+네이밍 ②캐릭터 베이스 3인 ③UI 무드보드 ④알파 데모

---

## 1. 레포 구조 — `/mnt/d/miyensi`

원칙: **앱(배포 대상) / 파이프라인 작업장(비배포) / 기획 문서** 3분리. `pipeline/`과 `docs/`는 Vercel 빌드에서 제외(`.vercelignore`), 대용량 중간 산출물은 `.gitignore`.

```
/mnt/d/miyensi/
├── app/                          # Next.js 앱 (Vercel root directory로 지정)
│   ├── next.config.mjs
│   ├── package.json
│   ├── public/
│   │   └── assets/
│   │       ├── char/{aoi,haru,sena}/     # 스탠딩: base.webp + expr_*.webp (가칭 3인)
│   │       ├── sd/{aoi,haru,sena}/       # 전투: sheet.webp + manifest.json
│   │       ├── bg/                       # 배경 8~12장 .webp
│   │       ├── cg/                       # CG 루트별 2~3장 .webp
│   │       ├── ui/                       # 프레임·버튼·타이틀로고 .webp/.svg
│   │       └── audio/{bgm,sfx}/          # .ogg(+.m4a 폴백)
│   └── src/
│       ├── app/                          # App Router: / (타이틀), /play, /battle, /gallery
│       ├── engine/                       # VN 런타임 (React 비의존 코어 + React 바인딩)
│       │   ├── types.ts                  # 씬 스크립트 스키마 (§2)
│       │   ├── interpreter.ts            # 커맨드 실행기 (순수 함수)
│       │   ├── state.ts                  # zustand 스토어 (플래그·호감도·세이브)
│       │   ├── save.ts                   # localStorage 세이브/로드 (버전 마이그레이션)
│       │   ├── preload.ts                # 씬 단위 에셋 프리로더
│       │   └── audio.ts                  # Howler 래퍼 (BGM 크로스페이드/SFX)
│       ├── components/
│       │   ├── vn/                       # DialogueBox, CharacterStage, Backlog,
│       │   │                             #   ChoiceMenu, SaveLoadModal, QuickMenu, CGViewer
│       │   └── battle/                   # BattleScreen, SpritePlayer, CommandMenu,
│       │                                 #   HPBar, BattleLog, EffectLayer
│       ├── data/
│       │   ├── scenes/                   # ch01_common.ts, ch03_aoi_1.ts … (씬 스크립트)
│       │   ├── characters.ts             # 캐릭터 메타 (표정 목록, 색상, 스탠딩 오프셋)
│       │   ├── battles/                  # battle01.ts … (전투 정의)
│       │   └── flags.ts                  # 플래그·호감도 키 상수 (오타 방지 단일 소스)
│       └── styles/
├── pipeline/                     # 에셋 생산 작업장 (배포 제외)
│   ├── prompts/                  # persona-lock 블록, jsonl 배치 파일
│   │   ├── persona/{aoi,haru,sena}.txt   # [PERSONA_LOCK] 원본 블록 (수정 금지, 복붙 소스)
│   │   └── batches/*.jsonl
│   ├── raw/                      # codex-imagegen 원본 회수분 (gitignore)
│   ├── review/                   # 스왑 검수 대기/합격 격리 폴더
│   ├── sprite/                   # sprite-gen 입출력 (SD base → sheet + manifest)
│   └── scripts/
│       ├── postprocess.mjs       # 크롭·배경제거·webp 변환·app/public 적재
│       └── validate_scenes.mjs   # 씬 스크립트 정합성 검사기 (§7)
├── docs/
│   ├── STORY.md                  # 트리트먼트·루트 분기표 (게이트①)
│   ├── CHARACTERS.md             # 3인 설정·네이밍 확정본
│   ├── DESIGN-SYSTEM.md          # UI 토큰 고정본 (게이트③ 이후)
│   ├── moodboard/                # UI 레퍼런스·무드보드 (현재 ui-refs/)
│   └── SCRIPT/                   # 챕터별 대사 초고 (md → scenes/*.ts 변환 전 단계)
├── trailer/                      # reelforge 트레일러 작업장 (게이트④ 이후)
├── .vercelignore                 # pipeline/ docs/ trailer/
└── README.md
```

- Vercel 설정: Root Directory = `app`, GitHub 공개 레포 push 시 자동배포. (레포 생성·Vercel 연결은 게이트①에서 제목 확정 후 — 가칭으로 공개 레포를 만들지 않는다.)
- C드라이브 산출물 금지 → 모든 중간 파일도 `/mnt/d/miyensi/pipeline/` 하위. codex-imagegen `output_path`를 여기로 강제.

---

## 2. VN 런타임 아키텍처

### 2.1 씬 스크립트 스키마 (TS discriminated union)

```ts
// app/src/engine/types.ts
export type CharId = 'aoi' | 'haru' | 'sena' | 'mc' | 'mob';
export type Expr = 'neutral' | 'smile' | 'laugh' | 'blush' | 'sad' | 'angry'
                 | 'surprise' | 'worry' | 'serious' | 'cry';   // 캐릭터당 6~10종
export type StagePos = 'left' | 'center' | 'right' | 'offL' | 'offR';

export type Command =
  | { t: 'say';    who: CharId | null; text: string; expr?: Expr }        // who=null → 지문/모놀로그
  | { t: 'show';   who: CharId; expr: Expr; pos: StagePos;
      enter?: 'fadeIn' | 'slideL' | 'slideR' }
  | { t: 'expr';   who: CharId; expr: Expr }                              // 표정만 스왑
  | { t: 'move';   who: CharId; pos: StagePos }
  | { t: 'hide';   who: CharId; exit?: 'fadeOut' | 'slideL' | 'slideR' }
  | { t: 'bg';     src: string; fx?: 'fade' | 'cut' | 'whiteFlash' }
  | { t: 'cg';     src: string; unlock: string }                          // 갤러리 해금 키
  | { t: 'cgHide' }
  | { t: 'bgm';    src: string | null; fade?: number }                    // null = stop
  | { t: 'sfx';    src: string }
  | { t: 'fx';     kind: 'shake' | 'flash' | 'blurMemory' | 'wait'; dur?: number }
      // blurMemory = "기억" 연출용 화면 블러+탈색 (테마 전용 이펙트)
  | { t: 'choice'; items: { label: string; goto: string;
        set?: FlagOp[]; if?: Cond }[] }
  | { t: 'set';    ops: FlagOp[] }
  | { t: 'if';     cond: Cond; then: string; else?: string }              // 라벨 점프
  | { t: 'label';  id: string }
  | { t: 'jump';   scene: string; label?: string }                        // 씬 간 이동
  | { t: 'battle'; id: string; onWin: string; onLose: string }            // /battle 진입
  | { t: 'ending'; id: string };                                          // 엔딩 롤 → 타이틀

export type FlagOp = { key: string; op: 'set' | 'add'; value: number | boolean };
export type Cond   = { key: string; cmp: 'eq' | 'gte' | 'lte'; value: number | boolean }
                   | { all: Cond[] } | { any: Cond[] };

export interface Scene {
  id: string;                 // 'ch01_common'
  title: string;              // 백로그·세이브 표시용
  assets: { chars?: CharId[]; bgs?: string[]; cgs?: string[]; bgm?: string[] }; // 프리로드 힌트
  script: Command[];
}
```

분기 설계: 호감도 키 `aff_aoi / aff_haru / aff_sena`(number), 진행 플래그는 `flags.ts` 상수. 공통루트 말미 `if`로 최고 호감도 루트 진입. 트루엔딩은 3루트 클리어 메타 플래그(localStorage **글로벌 영속 슬롯** — 세이브 슬롯과 분리)로 해금.

### 2.2 상태 관리·세이브

- **zustand** 단일 스토어: `{ sceneId, cursor, flags, stage: {who,expr,pos}[], bg, bgm, backlog, settings }`.
- 세이브 = 스토어 스냅샷 직렬화. `miyensi:save:{0..9}` (0=오토세이브, 수동 9슬롯) + `miyensi:global` (엔딩 플래그·CG 해금·설정). 각 세이브에 `ver` 필드 → 마이그레이션 체인.
- 로드는 커서 리플레이 없이 스냅샷 hydrate + 에셋 재로드만.

### 2.3 핵심 컴포넌트

| 컴포넌트 | 스펙 |
|---|---|
| `DialogueBox` | 타이핑 이펙트(문자당 20~35ms 가변), 클릭 시 즉시 완성→다음, 화자 네임플레이트(캐릭터 컬러) |
| `CharacterStage` | 표정 배리언트 크로스페이드 스왑(120ms opacity), CSS 호흡 = translateY 사인파 1~2px/4s 무한, 깜빡임 = 눈감음 배리언트 있으면 랜덤 2~6s 인터벌 80ms 스왑, 발화자 강조(비발화자 brightness 0.75), 등장/퇴장 트랜지션 |
| `ChoiceMenu` | 선택지 버튼, `if` 조건 미충족 항목 숨김 |
| `Backlog` | 최근 200줄, 반투명 오버레이 |
| `QuickMenu` | AUTO(완성 후 1.5s+글자수 비례), SKIP(홀드/토글), 세이브/로드, 백로그, 설정(텍스트 속도·볼륨) |
| `SaveLoadModal` | 슬롯별 챕터명·일시·위치 |
| 타이틀/갤러리 | 새 게임·이어하기·갤러리(CG 해금제)·엔딩 리스트 |

인터프리터는 React 비의존 순수 함수 `step(state, cmd) → state'` — 유닛 테스트·SKIP 고속 진행 용이.

### 2.4 프리로드

- 씬 전환 시 `Scene.assets` 기반 프리로드, 로딩 오버레이는 800ms 초과 시만.
- 캐릭터 등장 시점에 그 캐릭터 전 표정 일괄 프리로드.
- `next/image` 미사용 — 사전 최적화 webp를 일반 `<img>`로.

---

## 3. 전투 시스템 (턴제 커맨드, 2~3회)

```ts
// app/src/data/battles/battle01.ts
interface BattleUnit {
  id: string; name: string; maxHp: number; spd: number;
  sheet: string;                       // /assets/sd/aoi/sheet.webp
  manifest: string;                    // sprite-gen frame_layout manifest 경로
  skills: Skill[];                     // 아군 4종 고정: 일반공격/강공격(게이지)/버프·힐/필살기
}
interface Skill {
  id: string; name: string; power: number;
  cost: number;                        // 파티 공유 게이지(0~100, 일반공격·피격 시 +10/+5)
  target: 'enemy' | 'ally' | 'allAllies';
  anim: 'attack' | 'skill';
  sfx: string; fx?: 'flash' | 'shake';
}
```

- 파티 = 히로인 3명(HP 개별) + 공유 게이지 1개. 적 1체(보스형). spd 내림차순 고정 로테이션. 적 AI 가중 랜덤(HP 최저 타깃 60%). 패배해도 `onLose` 분기로 스토리 계속(게임오버 없음).
- 연출: 커맨드 확정 → `attack` 애니 1루프 → 임팩트 프레임 SFX+피격 `hit`+HP바 트윈(300ms) → `idle` 복귀. `async/await` 직렬 시퀀서.
- **SpritePlayer** (~50줄): manifest `{ actions: { idle: { frames:[{x,y,w,h}], fps, loop } } }` 소비, `background-position` + rAF 누적시간 프레임 계산, `onComplete`로 시퀀서 연결.
- 액션 셋: `idle/attack/hit/victory`. stable은 idle/attack — hit=idle+CSS 백스텝+적색 플래시, victory=정지 1프레임+점프 트윈 폴백을 시퀀서에 처음부터 내장.

---

## 4. 에셋 파이프라인

공통: **생성(codex-imagegen) → 스왑 검수(오귀속 대조, `pipeline/review/`) → 후처리(`postprocess.mjs`: 배경 제거·크롭·webp) → `app/public/assets/` 적재.**

### 4.1 캐릭터 3인 (크리티컬 패스)

1. **베이스 확정** (게이트②): image-prompt로 `[PERSONA_LOCK]` 블록 작성(soft cel shading, 웹툰 S07 근접) → 캐릭터당 시안 4~6장 → 사용자 선택 → 선택본 프롬프트를 `pipeline/prompts/persona/*.txt`에 **동결**.
2. **표정 배리언트 6~10종/인**: 동결 블록 + 표정 지시만 교체한 jsonl(3인×8표정, 여유 ×2 생성 후 픽). check_prompt.mjs로 블록 무결성 검증 후 스폰.
3. **검수**: 스왑 대조 + 얼굴 일관성 몽타주 그리드 육안. 불합격분만 재생성.
4. **후처리**: 단색 배경 지정 생성 → 배경 제거 → 동일 캔버스(1024×1536) **눈 위치 기준 정렬** 크롭(크로스페이드 성립 조건).
5. **SD 베이스 1장/인**(2~3등신, persona 유지) → sprite-gen: idle(호흡 recipe 1px 18f@4fps)+attack → 알파 언믹스 → 큐레이션 웹뷰 선별 → 적재.

### 4.2 배경·CG·UI·오디오

- 배경 8~12장(학교·교실·복도·귀갓길·방·옥상·병원·추상 기억공간): 스타일 앵커 공통 프리픽스, 1920×1080 → webp q80.
- CG 루트별 2~3장(총 7~9): persona 블록 + 씬 묘사, 장당 3후보 생성 후 픽.
- UI: 게이트③ 승인 → DESIGN-SYSTEM.md 고정 → 프레임·버튼·로고 CSS/SVG 우선, 장식 텍스처만 생성.
- 오디오: media-use로 BGM 6~8곡(일상/히로인 테마×3/긴장/전투/트루) + SFX 10~15종, ogg.

---

## 5. 워커·모델 분배

| 단계 | 담당 |
|---|---|
| 스토리 구조·반전 설계·네이밍 시안 | opus |
| 챕터별 대사 집필 | gn-voice 계열 에이전트(chat/reply=대사, wm-prose=지문, essay=모놀로그) 씬 단위 격리 분산 + verify_style.py |
| 대사 일관성·복선 검수 | opus critic + gn-voice-judge (fresh-context) |
| md 대본 → scenes/*.ts 변환 | codex-spawn 챕터별 병렬 + validate_scenes.mjs 필수 통과 |
| VN 엔진 코어 | **sonnet executor 1명 단독** (응집 필요 — 분산 금지) |
| UI 컴포넌트·전투 화면·타이틀 | codex-spawn/sonnet 컴포넌트 단위 격리 병렬 |
| 코드 리뷰 | code-reviewer (엔진 코어·세이브 마이그레이션 중점) |
| 이미지 프롬프트/양산 | image-prompt(본 세션) / codex-imagegen(PARALLEL auto) |
| 스프라이트 | sprite-gen CLI + 큐레이션 웹뷰(사용자) |
| BGM/SFX | media-use resolve |
| 무드보드·디자인시스템 | designer(sonnet) + firecrawl |
| 전투 밸런싱 | sonnet — 1000회 자동전투 시뮬레이터 |
| 트레일러 | reelforge (게이트④ 이후) |

Workflow 오케스트레이션 구간: ⑴ 집필 체인(씬 집필→judge→ts 변환→validate 파이프라인) ⑵ 에셋 체인(프롬프트→생성→검수→후처리→적재) ⑶ 알파 QA 루프. 오케스트레이터는 게이트 판단·통합만, 대량 토큰 작업은 워커로.

**집필 컨텍스트 격리(필수)**: STORY-BIBLE/브리프 동결 → 워커 1명=씬 1개, 바이블 슬라이스+자기 브리프만 읽음, 다른 씬 원고 읽기 금지 → 산출 경로 1:1 고정 → 연속성은 별도 fresh-context 검수 패스 → 오케스트레이터는 원고 본문을 컨텍스트에 들이지 않음.

---

## 6. 페이즈 DAG

```
P0 부트스트랩 ─┬─ P1 스토리 ──[게이트①]──┬─ P2A 대본 집필(씬 병렬)
               │                          ├─ P2B 캐릭터 베이스 시안 ──[게이트②]── P3B 표정·SD·CG 양산
               │                          └─ P2C UI 레퍼런스·무드보드 ──[게이트③]── DESIGN-SYSTEM.md
               └─ P2D VN 엔진 코어 (P1과 병렬 — 스토리 비의존)
P3A 대본→씬 변환 (P2A 후 챕터별 롤링)
P3C 전투 시스템 (P2D 후, P3B SD 시트 합류)
P3D 배경·오디오 (게이트① 후 병렬)
P4 통합·알파 ── QA ──[게이트④]
P5 폴리시·최적화 → 공개 배포 + reelforge 트레일러
```

| 페이즈 | 산출물 | 검증 |
|---|---|---|
| P0 | 레포 스캐폴드, Next.js 초기화, "Hello VN" 로컬 구동 | dev 서버 + 빌드 통과 |
| P1 | STORY.md, 제목/네이밍 시안 3종 | **게이트①** |
| P2A | docs/SCRIPT/*.md 전 챕터 초고 | verify_style.py + judge |
| P2B | 3인 베이스 시안 각 4~6장 | **게이트②** |
| P2C | 무드보드 | **게이트③** |
| P2D | engine/* + vn 컴포넌트, 더미 씬 플레이 | interpreter 유닛 테스트 + 세이브/로드 왕복 |
| P3A | data/scenes/*.ts 전량 | validate_scenes.mjs |
| P3B | 표정 24종+SD 시트 3종+CG 7~9장 | 스왑 검수 + 정렬 그리드 |
| P3C | 전투 2~3전 | 시뮬레이터 승률 60~85% 밴드 |
| P4 | 전 엔딩 도달 가능 알파 | 전 루트 자동 완주 스크립트 + 수동 플레이 → **게이트④** |
| P5 | 공개 배포 + 60초 트레일러 | Lighthouse, 총 전송량 < 40MB |

크리티컬 패스: P1 → 게이트② → P3B(SD) → P3C → P4. 게이트② 승인을 최우선으로 당길 것.

---

## 7. 리스크·완화

| 리스크 | 완화 |
|---|---|
| 표정 배리언트 얼굴 불일치(참조 이미지 불가) | PERSONA_LOCK 동결 파일 단일 소스, 표정당 2배 생성 후 픽, 몽타주 그리드 검수, 최후엔 얼굴부 로컬 편집 배리언트 |
| 표정 스왑 위치 어긋남 | 눈 좌표 기준 정렬을 파이프라인 필수 단계로, 큰 어긋남은 재생성 |
| sprite-gen hit/victory 불안정 | idle/attack만 필수, hit/victory는 CSS 폴백을 시퀀서에 내장 |
| 대사량 대비 컨텍스트 | 씬 단위 워커 격리 + 복선 대장 주입, 오케스트레이터는 judge 리포트만 |
| 씬 정합성 붕괴 | flags.ts 상수 강제 + validate_scenes.mjs(라벨 도달성·에셋 존재·키 검사) 빌드 프리스텝 |
| Vercel 용량 | 전 이미지 webp, 총 40MB 상한을 P3B부터 계측 |
| 전투 밸런싱 | 수치 외부화 + 1000회 시뮬레이터 밴드 검증 |
| 배치 오귀속(스왑) | 회수 직후 id-파일 대조 패스, review/ 통과분만 적재 |
| 세이브 스키마 파손 | ver+마이그레이션 체인, 알파 후 additive만 |
