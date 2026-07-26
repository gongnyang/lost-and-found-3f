#!/usr/bin/env node
// 씬 스크립트 정합성 검사기 — docs/ARCHITECTURE.md §7 "씬 정합성 붕괴" 완화책.
// 검사 항목: (1) 라벨 중복/도달성  (2) if.then/else, choice.goto, battle.onWin/onLose 참조 라벨
// 존재  (3) jump 대상 씬·라벨 존재  (4) 플래그 키가 flags.ts(FLAGS) 레지스트리에 등록돼 있는지
// (5) 표정 키가 Expr 유효값이면서 해당 캐릭터의 실제 exprs 목록에 있는지  (6) bg/cg/sfx 에셋
// 파일이 app/public에 실존하는지 — P3A부터 bg/cg 부재는 error가 아닌 warning(다른 워커가
// 에셋 생성 중이라 정상적으로 없을 수 있음).  (7) **커맨드 단위 도달성** — 어떤 경로로도
// 실행되지 않는 커맨드는 error. 라벨 단위 검사만으로는 battle/choice 뒤에 놓인 대사 블록이
// 통째로 스킵되는 사고(true1s04·sea2s01)를 못 잡아서 추가했다.
//
// app/src 아래 TS(경로 alias `@/*`) 를 그대로 import하므로 tsx로 실행한다:
//   npm run validate:scenes   (app/package.json에서 "tsx ../pipeline/scripts/validate_scenes.mjs")
//
// 도달성 시뮬레이션의 진입점은 커서 0 + "다른 씬의 jump가 label을 지정해 직접 진입하는 라벨"
// 전부다(예: sea2s02#win/#lose). 조건 분기는 참·거짓 양쪽을 모두 밟는 낙관적 탐색이라,
// "실제 플래그 조합으로는 못 가는 길"은 통과시킨다 — 구조적 고아만 잡는 게 목적이다.

import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP_ROOT = join(__dirname, '..', '..', 'app');
const PUBLIC_DIR = join(APP_ROOT, 'public');

const scenesIndexUrl = pathToFileURL(join(APP_ROOT, 'src', 'data', 'scenes', 'index.ts')).href;
const { SCENES } = await import(scenesIndexUrl);

const flagsUrl = pathToFileURL(join(APP_ROOT, 'src', 'data', 'flags.ts')).href;
const { FLAGS } = await import(flagsUrl);
const VALID_FLAG_KEYS = new Set(Object.values(FLAGS));

const charactersUrl = pathToFileURL(join(APP_ROOT, 'src', 'data', 'characters.ts')).href;
const { CHARACTERS } = await import(charactersUrl);

// types.ts의 Expr 유니언 타입을 그대로 미러(런타임에서 타입을 조회할 수 없어 리터럴 목록화).
const VALID_EXPRS = new Set([
  'neutral',
  'smile',
  'laugh',
  'blush',
  'sad',
  'angry',
  'surprise',
  'worry',
  'serious',
  'cry',
  'closed',
]);

/** g_cg_* 는 CG 카탈로그 키에 따라 동적으로 늘어나는 패턴 키라 FLAGS 상수 목록에 없다(flags.ts 주석). */
function isValidFlagKey(key) {
  return VALID_FLAG_KEYS.has(key) || /^g_cg_/.test(key);
}

const errors = [];
const warnings = [];

function labelIndexOf(script) {
  const map = {};
  script.forEach((c, i) => {
    if (c.t === 'label') map[c.id] = i;
  });
  return map;
}

/** 진입점 집합에서 출발해 실제로 실행될 수 있는 커맨드 인덱스와 라벨을 함께 돌려준다. */
function computeReachable(script, seeds) {
  const labelIndex = labelIndexOf(script);
  const visited = new Set();
  const reachable = new Set();
  const stack = [...seeds];

  while (stack.length) {
    let idx = stack.pop();
    while (idx >= 0 && idx < script.length && !visited.has(idx)) {
      visited.add(idx);
      const c = script[idx];

      if (c.t === 'label') reachable.add(c.id);

      if (c.t === 'if') {
        if (labelIndex[c.then] !== undefined) stack.push(labelIndex[c.then]);
        if (c.else) {
          if (labelIndex[c.else] !== undefined) stack.push(labelIndex[c.else]);
        } else {
          stack.push(idx + 1); // else 없음 → cond false 시 자연 낙하
        }
        break;
      }
      if (c.t === 'choice') {
        for (const item of c.items) {
          if (labelIndex[item.goto] !== undefined) stack.push(labelIndex[item.goto]);
        }
        break;
      }
      if (c.t === 'battle') {
        if (labelIndex[c.onWin] !== undefined) stack.push(labelIndex[c.onWin]);
        if (labelIndex[c.onLose] !== undefined) stack.push(labelIndex[c.onLose]);
        break;
      }
      if (c.t === 'jump' || c.t === 'ending') break; // 씬 이탈/종료 — 이 씬 내부 흐름은 끝

      idx += 1;
    }
  }
  return { visited, reachable };
}

/** 커맨드를 한 줄로 요약 — 도달 불가 리포트에서 어느 대사가 죽었는지 바로 보이게. */
function describeCommand(c) {
  if (c.t === 'say') return `say(${c.who ?? 'N'}): "${c.text.slice(0, 30)}"`;
  if (c.t === 'label') return `label ${c.id}`;
  if (c.t === 'fx') return `fx ${c.kind}`;
  if (c.t === 'jump') return `jump ${c.scene}${c.label ? `#${c.label}` : ''}`;
  if (c.t === 'battle') return `battle ${c.id}`;
  return c.t;
}

function checkAsset(sceneId, src, list) {
  if (!src) return;
  const p = join(PUBLIC_DIR, src.replace(/^\//, ''));
  if (!existsSync(p)) list.push(`[${sceneId}] 에셋 파일 없음: ${src} (기대 경로: ${p})`);
}

/** Cond(단일/all/any 재귀)에 등장하는 모든 플래그 키를 콜백에 넘긴다. */
function walkCondKeys(cond, cb) {
  if (!cond) return;
  if ('all' in cond) return cond.all.forEach((c) => walkCondKeys(c, cb));
  if ('any' in cond) return cond.any.forEach((c) => walkCondKeys(c, cb));
  if ('key' in cond) cb(cond.key);
}

function checkFlagKey(sceneId, key, where) {
  if (!isValidFlagKey(key)) errors.push(`[${sceneId}] flags.ts에 없는 플래그 키: "${key}" (${where})`);
}

function checkExpr(sceneId, who, expr, where) {
  if (!expr) return;
  if (!VALID_EXPRS.has(expr)) {
    errors.push(`[${sceneId}] 유효하지 않은 표정 키: "${expr}" (${where})`);
    return;
  }
  const meta = CHARACTERS[who];
  if (meta && !meta.exprs.includes(expr)) {
    errors.push(`[${sceneId}] ${who}에게 없는 표정: "${expr}" (${where}, 보유: ${meta.exprs.join('/')})`);
  }
}

const sceneIds = Object.keys(SCENES);
if (sceneIds.length === 0) {
  console.error('validate_scenes: SCENES 레지스트리가 비어 있음');
  process.exit(1);
}

// 씬 간 jump가 지정하는 진입 라벨 — 해당 씬의 커서 0에서 못 닿아도 정상 진입점이다.
const entryLabels = {};
for (const sceneId of sceneIds) {
  for (const c of SCENES[sceneId].script) {
    if (c.t === 'jump' && c.label) (entryLabels[c.scene] ??= new Set()).add(c.label);
  }
}

for (const sceneId of sceneIds) {
  const scene = SCENES[sceneId];
  const script = scene.script;

  if (scene.id !== sceneId) {
    errors.push(`[${sceneId}] Scene.id(${scene.id})가 레지스트리 키와 다름`);
  }

  // 라벨 중복 검사
  const seenLabels = new Set();
  for (const c of script) {
    if (c.t === 'label') {
      if (seenLabels.has(c.id)) errors.push(`[${sceneId}] 라벨 중복: ${c.id}`);
      seenLabels.add(c.id);
    }
  }

  // 참조 라벨 존재 검사
  for (const c of script) {
    if (c.t === 'if') {
      if (!seenLabels.has(c.then)) errors.push(`[${sceneId}] if.then 라벨 없음: ${c.then}`);
      if (c.else && !seenLabels.has(c.else)) errors.push(`[${sceneId}] if.else 라벨 없음: ${c.else}`);
    }
    if (c.t === 'choice') {
      for (const item of c.items) {
        if (!seenLabels.has(item.goto)) {
          errors.push(`[${sceneId}] choice.goto 라벨 없음: "${item.label}" → ${item.goto}`);
        }
      }
    }
    if (c.t === 'battle') {
      if (!seenLabels.has(c.onWin)) errors.push(`[${sceneId}] battle.onWin 라벨 없음: ${c.onWin}`);
      if (!seenLabels.has(c.onLose)) errors.push(`[${sceneId}] battle.onLose 라벨 없음: ${c.onLose}`);
    }
    if (c.t === 'jump') {
      const target = SCENES[c.scene];
      if (!target) {
        errors.push(`[${sceneId}] jump 대상 씬 없음: ${c.scene}`);
      } else if (c.label) {
        const targetLabels = new Set(target.script.filter((cc) => cc.t === 'label').map((cc) => cc.id));
        if (!targetLabels.has(c.label)) {
          errors.push(`[${sceneId}] jump 대상 라벨 없음: ${c.scene}#${c.label}`);
        }
      }
    }
  }

  // 도달성 검사 — 라벨 단위 + 커맨드 단위(전투/선택지 뒤 대사 블록 유실 방지).
  const labelIndex = labelIndexOf(script);
  const seeds = [0];
  for (const label of entryLabels[sceneId] ?? []) {
    if (labelIndex[label] !== undefined) seeds.push(labelIndex[label]);
  }
  const { visited, reachable } = computeReachable(script, seeds);
  for (const label of seenLabels) {
    if (!reachable.has(label)) errors.push(`[${sceneId}] 도달 불가능한 라벨: ${label}`);
  }
  script.forEach((c, i) => {
    if (!visited.has(i)) errors.push(`[${sceneId}] 도달 불가능한 커맨드 #${i}: ${describeCommand(c)}`);
  });

  // 플래그 키 검사 — flags.ts(FLAGS) 레지스트리 대비. set/if(재귀)/choice.set/choice.if 전부.
  for (const c of script) {
    if (c.t === 'set') {
      for (const op of c.ops) checkFlagKey(sceneId, op.key, 'set');
    }
    if (c.t === 'if') {
      walkCondKeys(c.cond, (key) => checkFlagKey(sceneId, key, 'if.cond'));
    }
    if (c.t === 'choice') {
      for (const item of c.items) {
        for (const op of item.set ?? []) checkFlagKey(sceneId, op.key, `choice("${item.label}").set`);
        if (item.if) walkCondKeys(item.if, (key) => checkFlagKey(sceneId, key, `choice("${item.label}").if`));
      }
    }
  }

  // 표정 키 검사 — Expr 유효값 + 캐릭터별 실제 exprs 보유 여부.
  for (const c of script) {
    if (c.t === 'say' && c.who) checkExpr(sceneId, c.who, c.expr, `say(${c.who})`);
    if (c.t === 'show') checkExpr(sceneId, c.who, c.expr, `show(${c.who})`);
    if (c.t === 'expr') checkExpr(sceneId, c.who, c.expr, `expr(${c.who})`);
  }

  // 에셋 존재 검사 — bg/cg는 다른 워커가 만드는 중일 수 있어 error가 아닌 warning으로만 낸다.
  for (const bg of scene.assets.bgs ?? []) checkAsset(sceneId, bg, warnings);
  for (const cg of scene.assets.cgs ?? []) checkAsset(sceneId, cg, warnings);
  for (const c of script) {
    if (c.t === 'bg') checkAsset(sceneId, c.src, warnings);
    if (c.t === 'cg') checkAsset(sceneId, c.src, warnings);
    if (c.t === 'sfx') checkAsset(sceneId, c.src, warnings); // 오디오도 아직 파이프라인 전이라 경고만
  }
}

for (const w of warnings) console.warn(`WARN  ${w}`);

if (errors.length > 0) {
  console.error(`\nvalidate_scenes: ${errors.length}개 오류\n`);
  for (const e of errors) console.error(`ERROR ${e}`);
  process.exit(1);
}

console.log(`validate_scenes: OK — ${sceneIds.length}개 씬, 경고 ${warnings.length}건, 오류 0건`);
