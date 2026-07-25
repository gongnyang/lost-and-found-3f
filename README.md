# miyensi

기억과 상실을 테마로 한 웹 비주얼노벨 데모. 자작 React/Next.js VN 런타임, Vercel 배포 예정.

설계 정본: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)

## 구조

- `app/` — Next.js 앱(Vercel Root Directory). VN 엔진 코어(`app/src/engine`), 데이터(`app/src/data`),
  컴포넌트(`app/src/components`), 라우트(`app/src/app`).
- `pipeline/` — 에셋 생산 작업장(비배포). 씬 정합성 검사기(`pipeline/scripts/validate_scenes.mjs`) 포함.
- `docs/` — 기획 문서(비배포). 스토리·캐릭터·디자인시스템 확정본이 여기 쌓인다.
- `trailer/` — 게이트④ 이후 트레일러 작업장.

## 개발

```bash
cd app
npm install
npm run dev        # http://localhost:3000
npm run test        # vitest — interpreter/save 유닛 테스트
npm run build       # prebuild에서 validate:scenes 자동 실행 후 next build
npm run validate:scenes  # 씬 스크립트 정합성 단독 검사
```

## 진행 단계

- [x] P0 — 레포 스캐폴드, Next.js(App Router/TS/ESLint) 초기화
- [x] P2D — VN 엔진 코어(`engine/*`) + vn 컴포넌트 + 더미 씬 2개(분기/플래그/세이브 테스트) + `/battle` SpritePlayer 스텁
- [ ] P1/P2A/P2B/P2C 이후 단계는 게이트①~③ 승인 후 진행
