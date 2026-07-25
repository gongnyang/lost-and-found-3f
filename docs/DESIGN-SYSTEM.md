# DESIGN SYSTEM — 웹 미연시 UI (v1.0, 고정 baseline)

> 채택 시안: **나. 필름·폴라로이드 레트로** (그레인 완화 + 대사 텍스트는 크리스프 가독성 규칙 부분 도입)
> 근거: `docs/ui-refs/moodboard.html`, `docs/ui-refs/REFS.md`
> 이 문서는 UI 디자인 토큰의 단일 소스(source of truth)다. 변경 시 상단 버전을 올리고 변경 로그를 하단에 남긴다.

---

## ① 디자인 원칙 (3줄)

1. **모든 UI 표면은 "빛바랜 사진"이다** — 시간이 지날수록 색이 옅어지고 가장자리가 접히듯, 인터페이스의 채도·그레인 강도는 장면이 회상인지 현실인지에 따라 달라진다.
2. **감정은 종이 질감으로, 정보는 크리스프한 잉크로** — 대사창의 틀(프레임)은 따뜻한 필름 감성을 유지하지만, 실제로 읽는 대사 텍스트 자체는 최고 가독성의 크리스프 잉크 규칙을 따른다 (시안 다 부분 도입).
3. **전투와 반전의 순간, UI 스스로가 사건이 된다** — 전장에서는 시스템이 차가운 모노스페이스로 전환되고, 기억이 무너지는 반전 장면에서는 프레임 자체가 찢어지고 흔들리며 이야기의 균열을 UI가 함께 연기한다.

---

## ② 컬러 토큰

### 베이스 (배경 / 서피스 / 텍스트)

| 토큰 | Hex | 용도 |
|---|---|---|
| `--bg-void` | `#171310` | 게임 아트 바깥 최외곽 배경, 비네트 기준색 |
| `--bg-scene-present` | `#1C1712` | 퀵메뉴/백로그 등 시스템 크롬의 불투명 배경(현재 시제) |
| `--paper` | `#F1E6D2` | 대사창·세이브 슬롯의 "사진/종이" 기본색 |
| `--paper-inner` | `#F7EEDF` | 대사 텍스트가 놓이는 내부 플레이트(크리스프 규칙, 대비 강화용 밝은 톤) |
| `--ink-strong` | `#2A2119` | 대사 본문 잉크색 — 크리스프 가독성 규칙 전용, 대비비 ≥7:1 |
| `--ink-soft` | `#3B2E22` | 네임플레이트·세리프 캡션 잉크색 |
| `--muted` | `#7C6A55` | 3차 텍스트/라벨/빈 슬롯 안내 |
| `--line-hairline` | `rgba(59,46,34,.18)` | 종이 카드 보더 |
| `--cream-onDark` | `#D8C9AE` | 다크 크롬(퀵메뉴/백로그) 위 1차 텍스트·아이콘 |
| `--cream-onDark-dim` | `#A79A85` | 다크 크롬 위 2차 텍스트 |

### 시스템 액센트 (공용)

| 토큰 | Hex | 용도 |
|---|---|---|
| `--accent-terracotta` | `#C1633D` | 주 CTA, 선택된 선택지, 진행 표시 |
| `--accent-dustyrose` | `#C98A93` | 호감도/하트 보조 액센트 |
| `--accent-tealfaded` | `#5E7C74` | 중립/시스템 정상 상태 (HP 정상 등) |
| `--accent-washi` | `#E4C36B` | 하이라이트, 알림, 세이브 포인트(워시테이프) |
| `--accent-danger` | `#9C4A3A` | 파괴적 액션(삭제), HP 위험 경고 |

### 히로인 개인 컬러 (전용 페르소나 톤)

| 히로인 | 설정 | Hex | 네임플레이트 텍스트 |
|---|---|---|---|
| **세아** | 여동생 타입 — 밝고 발랄한 온기 | `--heroine-sea` `#E8916B` (웜 코랄피치) | `--ink-strong` (다크 잉크, 밝은 배경 대비) |
| **리원** | 동급생 — 담담한 "현재/일상"의 톤 | `--heroine-riwon` `#7C8FB0` (더스티 페리윙클블루) | `--ink-strong` (다크 잉크) |
| **윤슬** | 누나 타입 — 성숙하고 깊은 존재감 | `--heroine-yunseul` `#6B3A4B` (딥 와인플럼) | `--paper-inner` (크림, 어두운 배경 대비) |

> 규칙: 네임플레이트 텍스트는 배경(히로인 컬러)의 명도로 결정 — 밝거나 중간 톤이면 `--ink-strong`, 어두운 톤이면 `--paper-inner`를 사용해 항상 대비비 4.5:1 이상을 유지한다.

---

## ③ 타이포그래피

**웹폰트 조합**: 본문 가독 산스 **Pretendard** + 감성 세리프 **Nanum Myeongjo** (둘 다 무료 배포·자체 호스팅 가능한 한글 폰트, 시스템 폴백 포함).

```
--font-sans:  "Pretendard","Apple SD Gothic Neo","Noto Sans KR",-apple-system,"Segoe UI",sans-serif;
--font-serif: "Nanum Myeongjo","Noto Serif KR","AppleMyungjo","Batang",serif;
--font-mono:  "JetBrains Mono","SF Mono",Consolas,ui-monospace,monospace;
```

- **세리프(Nanum Myeongjo)** — 네임플레이트, 챕터/타이틀 카드, 세이브 슬롯 캡션, 백로그 타임스탬프 등 "감성/기록" 영역.
- **산스(Pretendard)** — 대사 본문, 선택지, 퀵메뉴, 백로그 본문 등 "읽고 조작하는" 모든 영역. **대사 본문은 반드시 산스** (세리프로 긴 텍스트를 읽게 하지 않는다 — 크리스프 규칙).
- **모노(JetBrains Mono)** — 전투 수치, 세이브 슬롯 메타데이터(챕터 번호) 등 "시스템" 수치 전용.

### 크기 스케일 (rem, root 16px 기준)

| 토큰 | 크기 | 폰트 | line-height | letter-spacing | 용도 |
|---|---|---|---|---|---|
| `--text-display` | 2rem (32px) | 세리프 Bold | 1.25 | `--ls-serif` | 챕터/타이틀 카드 |
| `--text-h1` | 1.5rem (24px) | 세리프 SemiBold | 1.3 | `--ls-serif` | 씬 전환 타이틀(드묾) |
| `--text-dialogue` | clamp(0.9375rem, 1vw+0.7rem, 1.0625rem) (15~17px) | **산스 Medium** | 1.65 | `--ls-crisp` (-0.01em) | **대사 본문 — 크리스프 규칙 적용** |
| `--text-name` | 0.9375rem (15px) | 세리프 SemiBold | 1.2 | `--ls-serif` (+0.02em) | 네임플레이트 |
| `--text-choice` | 0.9375rem (15px) | 산스 Medium | 1.4 | `--ls-crisp` | 선택지 버튼 |
| `--text-ui` | 0.8125rem (13px) | 산스 Regular | 1.4 | 0 | 퀵메뉴/백로그 라벨 |
| `--text-caption` | 0.6875rem (11px) | 세리프 Italic 인상 | 1.3 | `--ls-serif` | 타임스탬프, 시스템 캡션 |
| `--text-battle-num` | 0.875rem (14px) | **모노** | 1.2 | 0 (tabular) | 전투 HP/데미지 수치 |

### 대사 텍스트 크리스프 규칙 (시안 다 부분 도입 — 반드시 지킬 것)

1. 대사 텍스트는 종이 전체의 세피아 잉크(`--ink-soft`)가 아니라, 더 짙은 `--ink-strong` (#2A2119)을 밝은 내부 플레이트 `--paper-inner` (#F7EEDF) 위에 올린다 → 대비비 ≥ 7:1.
2. 폰트 굵기는 Medium(500) 이상, Thin/Light 금지 — 얇은 세리프 감성체를 본문에 쓰지 않는다.
3. 모바일 최소 폰트 크기 15px 미만 금지 (접근성).
4. 그레인 오버레이는 텍스트 플레이트 영역에서 마스킹되어 0에 가깝게 처리한다 (`--text-plate-grain-mask: 0.02`, ⑥ 참조) — 감성 텍스처가 가독성을 해치지 않도록.

---

## ④ 대사창 스펙 (폴라로이드/사진 프레임 모티프)

- **모티프**: 사진 앨범에 끼워진 인화지 한 장. 매 대사마다 워시테이프·모서리 접힘 같은 장식은 **쓰지 않는다** (과도한 장식은 장시간 독서 피로 유발) — 장식적 사진 플레이버는 세이브 모달(⑤)처럼 "기억을 넘겨보는" 메타 화면에만 남긴다. 인게임 대사창은 단순화된 종이 카드 + 미세 회전 + 그림자로 정체성만 유지.
- **크기/위치**
  - 데스크톱: `max-width: 920px`, 화면 하단 중앙, 하단 오프셋 `24px`, 최소 높이 `132px`, 패딩 `20px 24px`.
  - 모바일(≤640px): `width: calc(100% - 24px)`, 하단 오프셋 `max(12px, env(safe-area-inset-bottom))`, 최소 높이 `108px`, 패딩 `16px 18px`. 카드 전체가 탭 영역(진행) — 최소 탭 타깃 44px 보장.
- **반투명도 / 블러**: `background: rgba(241,230,210,.86)` (paper 86%) + `backdrop-filter: blur(3px) saturate(1.05)`. **주의**: 이 블러는 "가독성용 미세 분리"이지 시안 가의 유리질감 프로스트가 아니다 — 블러 반경 3~4px을 넘기지 않는다.
- **테두리/그림자**: `border: 1px solid rgba(59,46,34,.18)`, `box-shadow: 0 10px 24px rgba(0,0,0,.35)`, `border-radius: 6px` (사진 인화지 인상 — 큰 라운드 금지), `transform: rotate(-0.4deg)` (완화된 손맛, 초안의 -0.6deg보다 축소).
- **네임플레이트**: 카드 좌상단에 캡션 태그처럼 상단 경계를 10px 겹쳐 올라감(`margin-top:-10px`). 배경색 = 해당 씬 화자의 히로인 컬러(②), radius `4px`(각진 인상 유지, 필 아님), 패딩 `4px 12px`, 텍스트는 세리프 SemiBold + ②의 대비 규칙.
- **진행 표시**: 카드 우하단에 미세한 ▼ 점멸 인디케이터(다음 대사 대기 표시), `opacity` 점멸 주기 1.4s, `prefers-reduced-motion`이면 점멸 제거하고 정적 표시.
- **호감도 미니 바**(대사창 내 옵션 표시): 트랙 `--paper-inner` 배경 + `--accent-dustyrose` 채움, 높이 6px, radius 999px, 라벨은 `--text-ui` 세리프 아님(산스 소문자).

---

## ⑤ 선택지 · QuickMenu · 백로그 · 세이브모달

### 선택지 버튼

- 형태: "티켓 스텁" 인상 — 사각 라운드 `4px`, 왼쪽 3px 보더가 아이덴티티 라인.
- 기본: `background: rgba(247,238,223,.92)` (paper-inner 92%), `border-left: 3px solid transparent`, 텍스트 `--ink-strong` / `--text-choice`.
- 호버/포커스: `border-left-color: var(--accent-terracotta)`, `transform: translateY(-2px)`, `box-shadow: 0 6px 14px rgba(0,0,0,.28)`, 전환 `--dur-fast` / `--ease-settle`.
- 확정 시: 언더라인이 손글씨처럼 그려지는 짧은 스트로크 애니메이션(선택 확정 피드백), `--dur-base`.
- 배치: 대사창 위 또는 화면 중앙, 세로 스택, `gap: 10px`, `max-width`는 대사창과 동일(920px).
- **번호 라벨(01/02...) 은 내러티브 선택지에는 쓰지 않는다** — 인간적 톤 유지. 번호/모노 라벨은 전투 커맨드에만 사용(⑦) — 내러티브 vs 시스템의 어휘를 분리하는 게 이 시스템의 핵심 규칙.

### QuickMenu (세이브/로드/오토/스킵/로그/설정)

- 위치: 화면 우상단 도킹, 가로 아이콘 바.
- `background: rgba(23,19,16,.55)`, `backdrop-filter: blur(4px)`, `border-radius: 10px`, `padding: 8px`, 아이콘 간격 `6px`.
- 아이콘: 20px, stroke-width 1.5px, 색 `--cream-onDark` (기본) → `--accent-terracotta` (hover/active).
- 유휴 3초 후 `opacity: .35`로 감쇠, 포인터 이동/탭 시 `--dur-fast`로 복귀.

### 백로그 (대사 히스토리)

- 전체 화면 오버레이 또는 우측 드로어. **불투명** 배경 `--bg-scene-present` (#1C1712) — 대사창과 달리 반투명/사진 프레임 장식 없음(속독 목적의 유틸리티 모드).
- 그레인은 씬 상태와 무관하게 고정 `0.05` (⑥의 present 값과 동일, 항상 "현재" 취급).
- 각 항목: 세리프 네임 태그(작게) + 산스 본문, 텍스트는 `--cream-onDark`(다크 배경 대비 크리스프 규칙 적용), 항목 구분선 `1px dashed rgba(216,201,174,.25)` (천공/절취선 인상), 패딩 `10px 4px`.

### 세이브/로드 모달

- 배경 `rgba(10,8,6,.75)`, 모달 내부는 "앨범 페이지" 그리드: `grid-template-columns: repeat(auto-fill, minmax(160px,1fr))`, `gap: 16px`.
- 슬롯 카드: `--paper` 배경, radius `4px`, 썸네일(4:3) 위에 고정 세피아 그레인 `0.12` (기억 앨범이라는 맥락이므로 present/memory 구분 없이 항상 살짝 바랜 인상), 캡션은 세리프 + 날짜/챕터.
- 빈 슬롯: `border: 1px dashed var(--muted)`, "빈 페이지" 텍스트.
- 삭제(파괴적 액션): `--accent-danger` 텍스트 버튼, 호버 시에만 노출(오조작 방지).

---

## ⑥ 필름 그레인 오버레이 스펙 (CSS 구현 가능 수준)

**핵심 규칙: 기억(회상) 씬일수록 그레인·세피아·비네트가 강해지고, 현실 씬일수록 약해진다.** 씬 루트에 `data-scene="present" | "memory"` 속성을 부여해 아래 토큰을 스위칭한다.

```css
[data-scene="present"] {
  --grain-opacity: 0.05;   /* 완화됨 — 기존 초안(0.12~0.16 상당) 대비 대폭 축소 */
  --sepia-amount: 0.06;
  --vignette-amount: 0.16;
}
[data-scene="memory"] {
  --grain-opacity: 0.16;
  --sepia-amount: 0.26;
  --vignette-amount: 0.34;
}
```

- **적용 위치**: 게임 아트 위 전체 오버레이 레이어(대사창/UI 위에는 적용하지 않음). 텍스트 플레이트(`--paper-inner`) 영역만 별도로 `--text-plate-grain-mask: 0.02`를 곱해 거의 제거 — 가독성 보호.
- **구현 방법 A (경량, 에셋 없이)**: `repeating-linear-gradient` 다중 각도 + `mix-blend-mode: overlay`, opacity를 `--grain-opacity`에 바인딩. 프로토타입/저사양 폴백용.
  ```css
  .grain-overlay::before{
    content:"";position:absolute;inset:0;pointer-events:none;
    background-image:
      repeating-linear-gradient(0deg, rgba(255,255,255,.05) 0 1px, transparent 1px 3px),
      repeating-linear-gradient(90deg, rgba(0,0,0,.04) 0 1px, transparent 1px 4px);
    mix-blend-mode:overlay;
    opacity: var(--grain-opacity);
  }
  ```
- **구현 방법 B (권장, 프로덕션)**: 128×128 타일 노이즈 PNG(`/assets/noise/grain-128.png`)를 `background-repeat` 타일링, `opacity: var(--grain-opacity)`, `mix-blend-mode: overlay`. 유기적 플리커를 위해 `background-position`을 짧은 스텝 애니메이션으로 흔든다: 주기 `--grain-flicker-duration: 700ms`, `steps(4)` 이징, `prefers-reduced-motion: reduce`에서는 애니메이션 제거하고 정적 타일만 표시.
- **세피아/비네트**: `filter: sepia(var(--sepia-amount))` (아트 레이어), 비네트는 `radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,var(--vignette-amount)) 100%)` 오버레이.
- **전환**: 씬 전환 시 위 세 값은 `--dur-slow` (420ms) `--ease-settle`로 크로스페이드 — 급변 대신 "사진이 서서히 바래는" 인상.

---

## ⑦ 전투 UI 변주 (같은 토큰 위의 시스템 방언)

전투는 서사와 대비되는 **"차갑고 시스템적인" 톤**으로 의도적으로 튄다 — 같은 종이/필름 토큰 세계관 안에서, 전투 패널만 시안 다(크리스프 모던)의 다크 카드 언어를 그대로 가져온다. 이 대비 자체가 "감정 vs 계산"의 연출 장치다.

```css
--battle-panel-bg: #14161C;
--battle-panel-border: #2E323E;
--battle-hp-track: #20232B;
--battle-hp-fill-ok: var(--accent-tealfaded);      /* HP > 40% */
--battle-hp-fill-warn: var(--accent-washi);        /* 20~40% */
--battle-hp-fill-danger: var(--accent-danger);     /* < 20% */
--battle-hp-radius: 3px;
--battle-command-font: var(--font-mono);
--battle-command-bg: rgba(20,22,28,.9);
--battle-turn-highlight: var(--accent-terracotta); /* 현재 턴 캐릭터 하단 글로우 */
```

- HP 바: 트랙 3px radius, 채움 색은 임계값에 따라 `--battle-hp-fill-*` 3단 전환(크로스페이드 `--dur-base`), 수치는 `--text-battle-num` 모노스페이스 "128/150" 형식(tabular).
- 커맨드 메뉴(공격/스킬/아이템/방어): 선택지 버튼과 동일한 티켓 스텁 형태를 재사용하되, **폰트는 전부 산스→모노로 교체**하고 번호 라벨(01~04)을 붙인다 — 내러티브 선택지와 시각적으로 명확히 구분.
- 턴 순서 레일: 상단에 소형 초상 칩 스트립, 현재 턴 칩만 `--battle-turn-highlight` 글로우 + 살짝 확대(scale 1.06).

### 'UI가 해체되는' 반전 상태 — `[data-ui-state="unravel"]`

기억/정체성이 무너지는 반전 연출 전용 상태. 루트에 속성을 걸면 아래 토큰이 전역을 오버라이드한다.

```css
[data-ui-state="unravel"] {
  --grain-opacity: 0.55;              /* 그레인 급상승 */
  --unravel-desync-offset: 2px;       /* 색수차풍 고스트 오프셋 */
  --unravel-desaturate: 0.6;          /* 채도 이탈 */
  --unravel-contrast: 1.1;
  --unravel-jitter-deg: 3deg;         /* 요소별 랜덤 기울임 범위 */
  --unravel-stagger-step: 40ms;       /* 요소 간 붕괴 지연 간격 */
  --unravel-duration: 520ms;
  --unravel-ease: cubic-bezier(.7,0,.84,0); /* 가속하며 무너지는 느낌 */
  --unravel-accent-drain: var(--cream-onDark); /* 히로인 고유색이 이 값으로 대체 — "정체성 상실" */
}
```

- **색수차/디싱크**: 텍스트/패널에 `filter: drop-shadow(var(--unravel-desync-offset) 0 0 rgba(255,60,40,.5)) drop-shadow(calc(var(--unravel-desync-offset)*-1) 0 0 rgba(40,200,255,.5))` — 미세한 유령 이미지.
- **채도 이탈**: 전체 레이어 `filter: grayscale(var(--unravel-desaturate)) contrast(var(--unravel-contrast))` — 히로인 개인 컬러(②)가 `--unravel-accent-drain`(무채색 크림)으로 강제 대체되어 "그 사람다움이 지워진다"를 색으로 표현.
- **찢어짐**: 대사창/패널의 `clip-path`를 매끈한 라운드 사각형에서 지그재그 폴리곤으로 교체(예: `polygon(0 4%, 8% 0, 22% 6%, ... )` — 실제 구현 시 씬별 시드값으로 랜덤 생성), 동시에 각 UI 조각이 `transform: rotate(var(--unravel-jitter-deg)) translateY(12px)`로 개별 이탈.
- **타이밍**: 요소마다 `transition-delay: calc(var(--unravel-stagger-step) * var(--i))` (i = DOM 순서 인덱스)로 스태거, `duration/ease`는 위 토큰 사용 — 평상시의 부드러운 `--ease-settle`과 대비되는 날카로운 붕괴감.
- **해제**: 반전 시퀀스 종료 시 속성 제거 → 모든 값이 `--dur-slow` 크로스페이드로 원복(그레인/채도/기울임이 "다시 사진처럼 정리되며" 안정을 되찾는 인상).

---

## ⑧ 모션 규칙

| 토큰 | 값 | 용도 |
|---|---|---|
| `--dur-fast` | 120ms | 버튼 hover/press |
| `--dur-base` | 220ms | 패널 열림/닫힘, 선택지 등장, HP 크로스페이드 |
| `--dur-slow` | 420ms | 씬 크로스페이드, 그레인/세피아/비네트 전환 |
| `--ease-settle` | `cubic-bezier(.25,1,.5,1)` | 등장(사진을 살짝 내려놓는 느낌) — 기본 이징 |
| `--ease-exit` | `cubic-bezier(.5,0,.75,0)` | 퇴장/닫힘 |
| `--ease-unravel` | `cubic-bezier(.7,0,.84,0)` | 반전/붕괴 전용, 가속하며 무너짐 |

**타이핑(대사 출력) 속도**

| 토큰 | 값 | 설명 |
|---|---|---|
| `--typing-speed` | 32ms/글자 | 기본 속도(약 31자/초, 한국어 가독 기준) |
| `--typing-pause-punct` | +180ms | `.` `!` `?` 뒤 추가 정지 |
| `--typing-pause-ellipsis` | +320ms | `...` 뒤 추가 정지(회상의 여백감) |
| — | 2x / 즉시표시 | QuickMenu 스킵·오토 옵션으로 사용자 제어 가능 |

- `prefers-reduced-motion: reduce` 시: 그레인 플리커·지터·unravel 애니메이션은 정적 상태로 대체하고 opacity 트랜지션만 유지(모션 자체를 완전히 끄지 않고 "정보 전달 최소값"은 보존).

---

## ⑨ CSS 커스텀 프로퍼티 블록 (`:root` — 그대로 앱에 붙여넣기)

```css
:root{
  /* ---- base ---- */
  --bg-void: #171310;
  --bg-scene-present: #1C1712;
  --paper: #F1E6D2;
  --paper-inner: #F7EEDF;
  --ink-strong: #2A2119;
  --ink-soft: #3B2E22;
  --muted: #7C6A55;
  --line-hairline: rgba(59,46,34,.18);
  --cream-onDark: #D8C9AE;
  --cream-onDark-dim: #A79A85;

  /* ---- system accents ---- */
  --accent-terracotta: #C1633D;
  --accent-dustyrose: #C98A93;
  --accent-tealfaded: #5E7C74;
  --accent-washi: #E4C36B;
  --accent-danger: #9C4A3A;

  /* ---- heroine personal colors ---- */
  --heroine-sea: #E8916B;        /* 세아 · 여동생 */
  --heroine-riwon: #7C8FB0;      /* 리원 · 동급생 */
  --heroine-yunseul: #6B3A4B;    /* 윤슬 · 누나 */

  /* ---- typography ---- */
  --font-sans: "Pretendard","Apple SD Gothic Neo","Noto Sans KR",-apple-system,"Segoe UI",sans-serif;
  --font-serif: "Nanum Myeongjo","Noto Serif KR","AppleMyungjo","Batang",serif;
  --font-mono: "JetBrains Mono","SF Mono",Consolas,ui-monospace,monospace;
  --ls-crisp: -0.01em;
  --ls-serif: 0.02em;
  --text-display: 2rem;
  --text-h1: 1.5rem;
  --text-dialogue: clamp(0.9375rem, 1vw + 0.7rem, 1.0625rem);
  --text-name: 0.9375rem;
  --text-choice: 0.9375rem;
  --text-ui: 0.8125rem;
  --text-caption: 0.6875rem;
  --text-battle-num: 0.875rem;
  --text-plate-grain-mask: 0.02;

  /* ---- dialogue box ---- */
  --dialogue-maxw: 920px;
  --dialogue-minh: 132px;
  --dialogue-minh-mobile: 108px;
  --dialogue-bottom-offset: 24px;
  --dialogue-bg: rgba(241,230,210,.86);
  --dialogue-blur: 3px;
  --dialogue-border: 1px solid rgba(59,46,34,.18);
  --dialogue-shadow: 0 10px 24px rgba(0,0,0,.35);
  --dialogue-radius: 6px;
  --dialogue-rotate: -0.4deg;
  --dialogue-pad: 20px 24px;
  --dialogue-pad-mobile: 16px 18px;
  --nameplate-offset-y: -10px;
  --nameplate-radius: 4px;
  --nameplate-pad: 4px 12px;

  /* ---- choice buttons ---- */
  --choice-bg: rgba(247,238,223,.92);
  --choice-radius: 4px;
  --choice-pad: 12px 16px;
  --choice-gap: 10px;
  --choice-lift-hover: -2px;
  --choice-shadow-hover: 0 6px 14px rgba(0,0,0,.28);

  /* ---- quickmenu / backlog / save ---- */
  --qm-bg: rgba(23,19,16,.55);
  --qm-blur: 4px;
  --qm-radius: 10px;
  --qm-icon-size: 20px;
  --qm-gap: 6px;
  --qm-idle-opacity: 0.35;
  --qm-idle-delay: 3000ms;
  --backlog-bg: var(--bg-scene-present);
  --backlog-grain-opacity: 0.05;
  --backlog-divider: 1px dashed rgba(216,201,174,.25);
  --save-backdrop: rgba(10,8,6,.75);
  --save-slot-radius: 4px;
  --save-slot-grain: 0.12;
  --save-slot-gap: 16px;
  --save-slot-minw: 160px;

  /* ---- film grain / scene grade (default = present, overridden by [data-scene]) ---- */
  --grain-opacity: 0.05;
  --sepia-amount: 0.06;
  --vignette-amount: 0.16;
  --grain-flicker-duration: 700ms;

  /* ---- battle ---- */
  --battle-panel-bg: #14161C;
  --battle-panel-border: #2E323E;
  --battle-hp-track: #20232B;
  --battle-hp-fill-ok: var(--accent-tealfaded);
  --battle-hp-fill-warn: var(--accent-washi);
  --battle-hp-fill-danger: var(--accent-danger);
  --battle-hp-radius: 3px;
  --battle-turn-highlight: var(--accent-terracotta);

  /* ---- unravel (twist state, default = inactive baseline) ---- */
  --unravel-desync-offset: 0px;
  --unravel-desaturate: 0;
  --unravel-contrast: 1;
  --unravel-jitter-deg: 0deg;
  --unravel-stagger-step: 0ms;
  --unravel-duration: 520ms;
  --unravel-ease: cubic-bezier(.7,0,.84,0);
  --unravel-accent-drain: var(--cream-onDark);

  /* ---- motion ---- */
  --dur-fast: 120ms;
  --dur-base: 220ms;
  --dur-slow: 420ms;
  --ease-settle: cubic-bezier(.25,1,.5,1);
  --ease-exit: cubic-bezier(.5,0,.75,0);
  --typing-speed: 32ms;
  --typing-pause-punct: 180ms;
  --typing-pause-ellipsis: 320ms;
}

[data-scene="present"]{ --grain-opacity:0.05; --sepia-amount:0.06; --vignette-amount:0.16; }
[data-scene="memory"]{ --grain-opacity:0.16; --sepia-amount:0.26; --vignette-amount:0.34; }

[data-ui-state="unravel"]{
  --grain-opacity: 0.55;
  --unravel-desync-offset: 2px;
  --unravel-desaturate: 0.6;
  --unravel-contrast: 1.1;
  --unravel-jitter-deg: 3deg;
  --unravel-stagger-step: 40ms;
}

@media (prefers-reduced-motion: reduce){
  :root{ --grain-flicker-duration: 0ms; --unravel-jitter-deg: 0deg; }
}
```

---

## 변경 로그

- **v1.0 (2026-07-25)** — 시안 나(필름·폴라로이드 레트로) 채택 확정, 그레인 완화(present 0.05 / memory 0.16), 대사 텍스트 크리스프 규칙 도입, 히로인 3인 개인 컬러 확정(세아/리원/윤슬), 전투 UI 및 'UI 해체' 반전 상태 토큰 최초 정의. Baseline lock.
