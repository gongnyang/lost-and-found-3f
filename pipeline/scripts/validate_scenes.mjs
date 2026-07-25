#!/usr/bin/env node
// 씬 스크립트 정합성 검사기 — docs/ARCHITECTURE.md §7 "씬 정합성 붕괴" 완화책.
// 검사 항목: (1) 라벨 중복/도달성  (2) if.then/else, choice.goto, battle.onWin/onLose 참조 라벨
// 존재  (3) jump 대상 씬·라벨 존재  (4) bg/cg 에셋 파일이 app/public에 실존하는지.
//
// app/src 아래 TS(경로 alias `@/*`) 를 그대로 import하므로 tsx로 실행한다:
//   npm run validate:scenes   (app/package.json에서 "tsx ../pipeline/scripts/validate_scenes.mjs")
//
// 알려진 한계(1차 구현): 라벨 도달성은 각 씬의 커서 0에서 시작하는 정적 시뮬레이션만 본다.
// "다른 씬의 jump가 label을 지정해 그 라벨로 바로 진입"하는 경우, 그 라벨 자체의 존재/씬
// 존재는 검사하지만, 진입 라벨 기준 하위 도달성 재계산은 하지 않는다.

import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP_ROOT = join(__dirname, '..', '..', 'app');
const PUBLIC_DIR = join(APP_ROOT, 'public');

const scenesIndexUrl = pathToFileURL(join(APP_ROOT, 'src', 'data', 'scenes', 'index.ts')).href;
const { SCENES } = await import(scenesIndexUrl);

const errors = [];
const warnings = [];

function labelIndexOf(script) {
  const map = {};
  script.forEach((c, i) => {
    if (c.t === 'label') map[c.id] = i;
  });
  return map;
}

function computeReachableLabels(script) {
  const labelIndex = labelIndexOf(script);
  const visited = new Set();
  const reachable = new Set();
  const stack = [0];

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
  return reachable;
}

function checkAsset(sceneId, src, list) {
  if (!src) return;
  const p = join(PUBLIC_DIR, src.replace(/^\//, ''));
  if (!existsSync(p)) list.push(`[${sceneId}] 에셋 파일 없음: ${src} (기대 경로: ${p})`);
}

const sceneIds = Object.keys(SCENES);
if (sceneIds.length === 0) {
  console.error('validate_scenes: SCENES 레지스트리가 비어 있음');
  process.exit(1);
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

  // 라벨 도달성 검사
  const reachable = computeReachableLabels(script);
  for (const label of seenLabels) {
    if (!reachable.has(label)) errors.push(`[${sceneId}] 도달 불가능한 라벨: ${label}`);
  }

  // 에셋 존재 검사
  for (const bg of scene.assets.bgs ?? []) checkAsset(sceneId, bg, errors);
  for (const cg of scene.assets.cgs ?? []) checkAsset(sceneId, cg, errors);
  for (const c of script) {
    if (c.t === 'bg') checkAsset(sceneId, c.src, errors);
    if (c.t === 'cg') checkAsset(sceneId, c.src, errors);
    if (c.t === 'sfx') checkAsset(sceneId, c.src, warnings); // 오디오는 아직 파이프라인 전이라 경고만
  }
}

for (const w of warnings) console.warn(`WARN  ${w}`);

if (errors.length > 0) {
  console.error(`\nvalidate_scenes: ${errors.length}개 오류\n`);
  for (const e of errors) console.error(`ERROR ${e}`);
  process.exit(1);
}

console.log(`validate_scenes: OK — ${sceneIds.length}개 씬, 경고 ${warnings.length}건, 오류 0건`);
