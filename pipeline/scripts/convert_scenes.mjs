#!/usr/bin/env node
// 원고(docs/SCRIPT/raw/*.md) → 씬 스크립트(app/src/data/scenes/*.ts) 결정론 컨버터.
// docs/STORY.md §3(씬 구조표)·§4(분기 설계)·§7(전투 상세)·§8(CG/엔딩/에셋)을 코드화한다.
// 원고 마커 문법이 파일마다 살짝 다르다(괄호형/무괄호형, if 3종 방언 등) — 아래 파서가 전부 흡수한다.
//
// 실행: node pipeline/scripts/convert_scenes.mjs

import { readFileSync, writeFileSync, mkdirSync, existsSync, renameSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');
const RAW_DIR = join(ROOT, 'docs', 'SCRIPT', 'raw');
const OUT_DIR = join(ROOT, 'app', 'src', 'data', 'scenes');
const DEMO_DIR = join(OUT_DIR, '_demo');

// ---------------------------------------------------------------------------
// STORY.md §5 플래그 레지스트리 미러 — flags.ts의 FLAGS 상수와 반드시 동기화 유지.
// (컨버터는 app/src/data/flags.ts를 직접 import하지 않고 — .mjs에서 TS를 import하려면
//  tsx 런타임이 필요해 실행 경로가 늘어난다 — 여기 리터럴 미러로 값↔상수명 역매핑을 만든다.)
// ---------------------------------------------------------------------------
const FLAGS = {
  AFF_SEA: 'aff_sea',
  AFF_RIWON: 'aff_riwon',
  AFF_YUNSEUL: 'aff_yunseul',
  LAST_CHOICE: 'last_choice',
  ROUTE_ID: 'route_id',
  UI_STRIP_LEVEL: 'ui_strip_level',
  CH1_DONE: 'ch1_done',
  CH2_DONE: 'ch2_done',
  BATTLE01_WON: 'battle01_won',
  BATTLE02_WON: 'battle02_won',
  BATTLE03_DONE: 'battle03_done',
  ROUTE_CH1_DONE: 'route_ch1_done',
  ROUTE_CH2_DONE: 'route_ch2_done',
  OPENED_BOX_COMMON: 'opened_box_common',
  BOND_SEA: 'bond_sea',
  BOND_RIWON: 'bond_riwon',
  BOND_YUNSEUL: 'bond_yunseul',
  FRAG_SEA: 'frag_sea',
  FRAG_RIWON: 'frag_riwon',
  FRAG_YUNSEUL: 'frag_yunseul',
  CLUE_NOSEBLEED: 'clue_nosebleed',
  CLUE_NOSOUND: 'clue_nosound',
  CLUE_CCTV: 'clue_cctv',
  CLUE_HOSPITAL: 'clue_hospital',
  CLUE_CENSOR_LIMIT: 'clue_censor_limit',
  CLUE_LASTSECOND: 'clue_lastsecond',
  CLUE_NOMENTION: 'clue_nomention',
  CLUE_SCAR: 'clue_scar',
  CLUE_ALBUM: 'clue_album',
  CLUE_FLOWERBED: 'clue_flowerbed',
  CLUE_NO_RETURN: 'clue_no_return',
  CLUE_YS_SIGN: 'clue_ys_sign',
  CLUE_RECORDER_3Y: 'clue_recorder_3y',
  CLUE_NOTEBOOK: 'clue_notebook',
  CLUE_MINUTES_GAP: 'clue_minutes_gap',
  CLUE_BLANK_NAME: 'clue_blank_name',
  NAME_REVEALED: 'name_revealed',
  BGM_TRUE_THEME: 'bgm_true_theme',
  G_CLEAR_SEA: 'g_clear_sea',
  G_CLEAR_RIWON: 'g_clear_riwon',
  G_CLEAR_YUNSEUL: 'g_clear_yunseul',
  G_FRAG_SEA: 'g_frag_sea',
  G_FRAG_RIWON: 'g_frag_riwon',
  G_FRAG_YUNSEUL: 'g_frag_yunseul',
  G_TRUE_UNLOCKED: 'g_true_unlocked',
  G_TRUE_CLEARED: 'g_true_cleared',
  G_MC_NAME: 'g_mc_name',
  G_OPT_CALL_MODE: 'g_opt_call_mode',
};
const FLAG_REVERSE = Object.fromEntries(Object.entries(FLAGS).map(([k, v]) => [v, k]));

const SCENE_TITLES = {
  c1s01: '존재감 없는 놈',
  c1s02: '3층 D열',
  c1s03: '감사와 면담',
  c1s04: '손목시계의 주인',
  c1s05: '검열자 [전투1]',
  c1s06: '도시전설은 진짜였다',
  c2s01: '삼중 습격',
  c2s02: '점심의 삼국지',
  c2s03: '없는 사람',
  c2s04: '귀갓길',
  c2s05: 'D열 가장 안쪽',
  sea1s01: '목소리 수집가',
  sea1s02: '방과후 라디오',
  sea1s03: '3년 전 파일',
  sea2s01: '잡음',
  sea2s02: '부를 수 없는 이름',
  seaGE: '[굿엔딩] 오빠의 목소리',
  riw1s01: '감사관 백리원',
  riw1s02: '규정 제7조',
  riw1s03: '같은 문장',
  riw2s01: '결번',
  riw2s02: '매일 다시 쓰는 사람',
  riwGE: '[굿엔딩] 기록되지 않은 것',
  yun1s01: '오늘 이름 알려주실래요',
  yun1s02: '종이컵 두 개',
  yun1s03: 'YS',
  yun2s01: '도시전설의 저자',
  yun2s02: '돌아온 이유',
  yunGE: '[굿엔딩] 따뜻한 거짓말',
  true1s01: '조각 3/3',
  true1s02: '대조',
  true1s03: 'D열 최심부',
  true1s04: '검열자·본체 [전투3]',
  true1s05: '그럼 지금 불러줘',
  trueEnd: '[트루엔딩] 반환란',
};

const SCENE_IDS = Object.keys(SCENE_TITLES);
const SCENE_ID_SET = new Set(SCENE_IDS);
const DEMO_SCENE_IDS = ['ch01_common', 'ch02_branch'];

// STORY.md §3 구조표의 "다음 씬" 라우팅 — 원고가 명시적 [jump]로 끝나지 않는 씬들
// (c1s01/c1s02/c1s03/sea1s02/riw1s02/yun1s02, 전부 다음 씬으로 그냥 이어지는 평범한 챕터
// 내부 전환)에 한해, 컨버터가 씬 끝에 jump를 자동 부착한다. 이미 jump/ending/battle로
// 끝나는 씬은 건드리지 않는다.
const NEXT_SCENE = {
  c1s01: 'c1s02',
  c1s02: 'c1s03',
  c1s03: 'c1s04',
  sea1s02: 'sea1s03',
  riw1s02: 'riw1s03',
  yun1s02: 'yun1s03',
};

const STANDING = new Set(['sea', 'riwon', 'yunseul']);
const POS_ORDER = ['center', 'left', 'right'];
const ENTER_FOR_POS = { center: 'fadeIn', left: 'slideL', right: 'slideR' };

const FX_KIND_MAP = {
  blurMemory: 'blurMemory',
  whiteFlash: 'flash',
  white_flash: 'flash',
  ink_scatter: 'flash',
  censor_textbox: 'flash',
  curtainOverlay: 'flash',
  fadeout: 'flash',
  shake: 'shake',
  wait: 'wait',
  uiStrip: 'uiStrip',
};

const bgSrc = (key) => `/assets/bg/${key}.webp`;
const bgmSrc = (key) => `/assets/audio/bgm/${key}.ogg`;
const sfxSrc = (key) => `/assets/audio/sfx/${key}.ogg`;
const cgSrc = (key) => `/assets/cg/${key}.webp`;

function parseVal(v) {
  if (v === 'true') return true;
  if (v === 'false') return false;
  return Number(v);
}

function parseCond(raw) {
  let m = raw.match(/^([a-zA-Z_]\w*)\s*==\s*(true|false|-?\d+)$/);
  if (m) return { key: m[1], cmp: 'eq', value: parseVal(m[2]) };
  m = raw.match(/^([a-zA-Z_]\w*)\s+eq\s+(true|false|-?\d+)$/);
  if (m) return { key: m[1], cmp: 'eq', value: parseVal(m[2]) };
  throw new Error(`파싱 불가한 조건식: "${raw}"`);
}

function parseSetRaw(raw) {
  let s = raw.trim().replace(/^global\s+/, '');
  let m = s.match(/^([a-zA-Z_]\w*)\s*=\s*(true|false|-?\d+)$/);
  if (m) return [{ key: m[1], op: 'set', value: parseVal(m[2]) }];
  m = s.match(/^([a-zA-Z_]\w*)\s+(true|false|-?\d+)$/);
  if (m) return [{ key: m[1], op: 'set', value: parseVal(m[2]) }];
  throw new Error(`파싱 불가한 set 마커: "${raw}"`);
}

function parseChoiceLine(line) {
  const m = line.match(/^-\s*(.+?)\s*=>\s*(.+)$/);
  if (!m) throw new Error(`파싱 불가한 choice 항목: "${line}"`);
  let label = m[1].trim();
  if (label.startsWith('"') && label.endsWith('"')) label = label.slice(1, -1);
  const tokens = m[2]
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
  let gotoLabel = null;
  const ops = [];
  for (const tok of tokens) {
    let mm = tok.match(/^goto:?\s*(\S+)$/);
    if (mm) {
      gotoLabel = mm[1];
      continue;
    }
    mm = tok.match(/^([a-zA-Z_]\w*)\s*\+\s*(-?\d+)$/);
    if (mm) {
      ops.push({ key: mm[1], op: 'add', value: Number(mm[2]) });
      continue;
    }
    mm = tok.match(/^([a-zA-Z_]\w*)\s*=\s*(true|false|-?\d+)$/);
    if (mm) {
      ops.push({ key: mm[1], op: 'set', value: parseVal(mm[2]) });
      continue;
    }
    throw new Error(`파싱 불가한 choice 토큰: "${tok}" (라인: "${line}")`);
  }
  if (!gotoLabel) throw new Error(`choice 항목에 goto 없음: "${line}"`);
  return { label, goto: gotoLabel, ops };
}

/** [if COND then A else B] / [if COND => A else B] / [if COND] (블록형) 세 방언. */
function parseDirectiveInner(inner) {
  let m;
  if ((m = inner.match(/^bg\s+(\S+)$/))) return { type: 'bg', key: m[1] };
  if ((m = inner.match(/^bgm\s+(\S+)$/))) return { type: 'bgm', key: m[1] };
  if ((m = inner.match(/^sfx\s+(\S+)$/))) return { type: 'sfx', key: m[1] };
  if ((m = inner.match(/^fx\s+(\S+)(?:\s+(\d+))?$/)))
    return { type: 'fx', kind: m[1], dur: m[2] ? Number(m[2]) : undefined };
  if ((m = inner.match(/^cg\s+(\S+)$/))) return { type: 'cg', key: m[1] };
  if ((m = inner.match(/^battle\s+(\S+)(?:\s+onWin=(\S+))?(?:\s+onLose=(\S+))?$/)))
    return { type: 'battle', id: m[1], onWin: m[2], onLose: m[3] };
  if ((m = inner.match(/^label\s+(\S+)$/))) return { type: 'label', id: m[1] };
  if (inner === 'choice') return { type: 'choiceStart' };
  if (inner === '/choice') return { type: 'choiceEnd' };
  if ((m = inner.match(/^branch\s+(\S+)$/))) return { type: 'branchStart', id: m[1] };
  if (inner === '/branch') return { type: 'branchEnd' };
  if (inner === 'else') return { type: 'else' };
  if (inner === '/if') return { type: 'ifEnd' };
  if ((m = inner.match(/^ending\s+(\S+)$/))) return { type: 'ending', id: m[1] };
  if ((m = inner.match(/^jump\s+([^\s:]+)(?:[:\s]+(\S+))?$/))) return { type: 'jump', scene: m[1], label: m[2] };
  if ((m = inner.match(/^goto\s+(\S+)$/))) return { type: 'goto', label: m[1] };
  if ((m = inner.match(/^set\s+(.+)$/))) return { type: 'set', raw: m[1] };
  if ((m = inner.match(/^if\s+(.+?)\s+then\s+(\S+)(?:\s+else\s+(\S+))?$/)))
    return { type: 'ifInline', condRaw: m[1], then: m[2], else: m[3] };
  if ((m = inner.match(/^if\s+(.+?)\s*=>\s*(\S+)(?:\s+else\s+(\S+))?$/)))
    return { type: 'ifInline', condRaw: m[1], then: m[2], else: m[3] };
  if ((m = inner.match(/^if\s+(.+)$/))) return { type: 'ifBlockStart', condRaw: m[1] };
  return null;
}

const SAY_RE = /^(haram|sea|riwon|yunseul|mob|censor)\((\w+)\):\s*(.*)$/;
const NARR_RE = /^N:\s*(.*)$/;

function gotoCmd(label) {
  // 무조건 라벨 점프 에뮬레이션 — Command에 순수 goto가 없어 last_choice>=0(항상 참) if로 대체.
  return { t: 'if', cond: { key: FLAGS.LAST_CHOICE, cmp: 'gte', value: 0 }, then: label };
}

function convertScene(id, rawText) {
  const lines = rawText.split('\n').map((l) => l.trim());
  const script = [];
  const staged = new Set();
  const everShown = new Set();
  const bgs = new Set();
  const bgms = new Set();
  const cgs = new Set();
  let posCounter = 0;
  let choiceItems = null;
  const ifStack = [];
  let ifCounter = 0;
  let branchGroup = null;
  let branchJoinCounter = 0;
  let afterBranchEnd = false;

  function pushHideCleanup() {
    for (const who of everShown) script.push({ t: 'hide', who, exit: 'fadeOut' });
  }

  function ensureShown(who, expr) {
    if (!STANDING.has(who)) return;
    if (!staged.has(who)) {
      const pos = POS_ORDER[posCounter++] ?? 'center';
      script.push({ t: 'show', who, expr, pos, enter: ENTER_FOR_POS[pos] });
      staged.add(who);
      everShown.add(who);
    }
  }

  function dispatch(evt) {
    if (afterBranchEnd && evt.type !== 'branchStart') {
      script.push({ t: 'label', id: branchGroup.joinLabel });
      branchGroup = null;
      afterBranchEnd = false;
    }
    switch (evt.type) {
      case 'bg': {
        const src = bgSrc(evt.key);
        bgs.add(src);
        script.push({ t: 'bg', src, fx: 'fade' });
        break;
      }
      case 'bgm': {
        const src = evt.key === 'none' ? null : bgmSrc(evt.key);
        if (src) bgms.add(src);
        script.push({ t: 'bgm', src });
        break;
      }
      case 'sfx':
        script.push({ t: 'sfx', src: sfxSrc(evt.key) });
        break;
      case 'fx': {
        if (evt.kind === 'name_input') {
          script.push({ t: 'nameInput' });
          break;
        }
        const mapped = FX_KIND_MAP[evt.kind] ?? 'flash';
        const cmd = { t: 'fx', kind: mapped };
        if (evt.dur !== undefined) cmd.dur = evt.dur;
        script.push(cmd);
        break;
      }
      case 'cg': {
        const src = cgSrc(evt.key);
        cgs.add(src);
        script.push({ t: 'cg', src, unlock: `g_${evt.key}` });
        break;
      }
      case 'battle':
        script.push({ t: 'battle', id: evt.id, onWin: evt.onWin || 'win', onLose: evt.onLose || 'lose' });
        break;
      case 'label':
        script.push({ t: 'label', id: evt.id });
        break;
      case 'jump':
        // 원고에서 "[jump LABEL]"을 씬 간 이동이 아니라 "같은 씬 안의 라벨로 가라"는
        // 뜻으로 쓴 경우가 있다(예: [label win]...[jump joined]...[label lose]...[jump joined]).
        // scene 토큰이 알려진 35씬 id에 없고 label도 없으면 씬내 goto로 취급한다.
        if (!evt.label && !SCENE_ID_SET.has(evt.scene)) {
          script.push(gotoCmd(evt.scene));
        } else {
          pushHideCleanup();
          script.push({ t: 'jump', scene: evt.scene, ...(evt.label ? { label: evt.label } : {}) });
        }
        break;
      case 'goto':
        script.push(gotoCmd(evt.label));
        break;
      case 'set': {
        const ops = parseSetRaw(evt.raw);
        script.push({ t: 'set', ops });
        if (ops.some((o) => o.key === 'ui_strip_level')) script.push({ t: 'fx', kind: 'uiStrip' });
        break;
      }
      case 'ending':
        pushHideCleanup();
        script.push({ t: 'ending', id: evt.id });
        break;
      case 'ifInline':
        script.push({
          t: 'if',
          cond: parseCond(evt.condRaw),
          then: evt.then,
          ...(evt.else ? { else: evt.else } : {}),
        });
        break;
      case 'ifBlockStart': {
        const n = ifCounter++;
        const thenLabel = `if${n}_then`;
        const elseLabel = `if${n}_else`;
        const joinLabel = `if${n}_end`;
        script.push({ t: 'if', cond: parseCond(evt.condRaw), then: thenLabel, else: elseLabel });
        script.push({ t: 'label', id: thenLabel });
        ifStack.push({ elseLabel, joinLabel, sawElse: false });
        break;
      }
      case 'else': {
        const top = ifStack[ifStack.length - 1];
        script.push(gotoCmd(top.joinLabel));
        script.push({ t: 'label', id: top.elseLabel });
        top.sawElse = true;
        break;
      }
      case 'ifEnd': {
        const top = ifStack.pop();
        if (!top.sawElse) script.push({ t: 'label', id: top.elseLabel });
        script.push({ t: 'label', id: top.joinLabel });
        break;
      }
      case 'branchStart':
        afterBranchEnd = false;
        if (!branchGroup) branchGroup = { joinLabel: `branchjoin${branchJoinCounter++}` };
        script.push({ t: 'label', id: evt.id });
        break;
      case 'branchEnd':
        script.push(gotoCmd(branchGroup.joinLabel));
        afterBranchEnd = true;
        break;
      case 'choiceStart':
        choiceItems = [];
        break;
      case 'choiceEnd':
        script.push({
          t: 'choice',
          items: choiceItems.map((it) => ({
            label: it.label,
            goto: it.goto,
            ...(it.ops.length ? { set: it.ops } : {}),
          })),
        });
        choiceItems = null;
        break;
      case 'say': {
        if (evt.who && STANDING.has(evt.who)) ensureShown(evt.who, evt.expr || 'neutral');
        const cmd = { t: 'say', who: evt.who ?? null, text: evt.text };
        if (evt.expr) cmd.expr = evt.expr;
        script.push(cmd);
        break;
      }
      default:
        throw new Error(`처리 안 된 이벤트 타입: ${evt.type}`);
    }
  }

  for (const line of lines) {
    if (!line) continue;

    if (choiceItems !== null && line.startsWith('-')) {
      choiceItems.push(parseChoiceLine(line));
      continue;
    }

    if (/^\{.*t:\s*'?ending'?/.test(line)) {
      const m = line.match(/id:\s*'([^']+)'/);
      if (!m) throw new Error(`ending 리터럴 파싱 실패: "${line}"`);
      dispatch({ type: 'ending', id: m[1] });
      continue;
    }

    let inner = null;
    const bm = line.match(/^\[(.+)\]$/);
    if (bm) inner = bm[1].trim();
    else if (/^(label|goto|jump)\s+\S/.test(line)) inner = line;

    if (inner !== null) {
      const d = parseDirectiveInner(inner);
      if (!d) throw new Error(`[${id}] 인식 불가한 마커: "[${inner}]"`);
      dispatch(d);
      continue;
    }

    let m = line.match(SAY_RE);
    if (m) {
      dispatch({ type: 'say', who: m[1], expr: m[2], text: m[3] });
      continue;
    }
    m = line.match(NARR_RE);
    if (m) {
      dispatch({ type: 'say', who: null, text: m[1] });
      continue;
    }

    throw new Error(`[${id}] 인식 불가한 라인: "${line}"`);
  }

  if (afterBranchEnd) script.push({ t: 'label', id: branchGroup.joinLabel });
  if (ifStack.length) throw new Error(`[${id}] 닫히지 않은 if 블록: ${ifStack.length}개`);
  if (choiceItems !== null) throw new Error(`[${id}] 닫히지 않은 choice 블록`);

  // 라우팅 테이블 자동 부착 — 원고가 jump/ending 없이 그냥 끝나는 씬(NEXT_SCENE에 등록된
  // 것들)에는 여기서 다음 씬으로의 jump를 붙인다.
  const last = script[script.length - 1];
  const endsInExit = last && (last.t === 'jump' || last.t === 'ending');
  if (!endsInExit && NEXT_SCENE[id]) {
    pushHideCleanup();
    script.push({ t: 'jump', scene: NEXT_SCENE[id] });
  }

  const assets = {};
  if (everShown.size) assets.chars = Array.from(everShown);
  if (bgs.size) assets.bgs = Array.from(bgs);
  if (cgs.size) assets.cgs = Array.from(cgs);
  if (bgms.size) assets.bgm = Array.from(bgms);

  return { script, assets };
}

// ---------------------------------------------------------------------------
// 흐름 수리 패스 — 원고의 "쓰인 순서"와 인터프리터의 "실행 순서"가 어긋나 커맨드가 통째로
// 스킵되는 두 가지 구조적 버그를 컨버터 단계에서 고친다. (interpreter.step 기준: choice·battle은
// blocking이라 그 자리에서 낙하가 끊기고, 재개 지점은 오직 goto/onWin/onLose 라벨이다.)
// ---------------------------------------------------------------------------

/** 커서 0(또는 지정 진입점)에서 실제로 실행될 수 있는 커맨드 인덱스 집합. */
function reachableIndices(script, seeds = [0]) {
  const labelIndex = {};
  script.forEach((c, i) => {
    if (c.t === 'label') labelIndex[c.id] = i;
  });
  const visited = new Set();
  const stack = [...seeds];
  while (stack.length) {
    let idx = stack.pop();
    while (idx >= 0 && idx < script.length && !visited.has(idx)) {
      visited.add(idx);
      const c = script[idx];
      if (c.t === 'if') {
        if (labelIndex[c.then] !== undefined) stack.push(labelIndex[c.then]);
        if (c.else) {
          if (labelIndex[c.else] !== undefined) stack.push(labelIndex[c.else]);
        } else {
          stack.push(idx + 1);
        }
        break;
      }
      if (c.t === 'choice') {
        for (const it of c.items) if (labelIndex[it.goto] !== undefined) stack.push(labelIndex[it.goto]);
        break;
      }
      if (c.t === 'battle') {
        if (labelIndex[c.onWin] !== undefined) stack.push(labelIndex[c.onWin]);
        if (labelIndex[c.onLose] !== undefined) stack.push(labelIndex[c.onLose]);
        break;
      }
      if (c.t === 'jump' || c.t === 'ending') break;
      idx += 1;
    }
  }
  return visited;
}

/**
 * choice 뒤 고아 커맨드 재배치.
 * choice는 blocking이라 [/choice]와 다음 라벨 사이에 남은 연출 마커(예: true1s04의
 * `[fx whiteFlash]`)는 어떤 경로로도 실행되지 않는다. 선택지가 전부 같은 라벨로 간다면
 * 그 라벨 "바로 뒤"로 옮긴다 — 원고 의도인 "선택 직후 연출"이 그대로 복원된다.
 */
function relocateChoiceOrphans(id, script) {
  const out = [...script];
  for (let i = 0; i < out.length; i++) {
    if (out[i].t !== 'choice') continue;
    let j = i + 1;
    while (j < out.length && out[j].t !== 'label') j++;
    const orphanCount = j - (i + 1);
    if (orphanCount === 0) continue;
    const targets = new Set(out[i].items.map((it) => it.goto));
    if (j >= out.length || targets.size !== 1 || !targets.has(out[j].id)) {
      throw new Error(
        `[${id}] choice 뒤 도달 불가 커맨드 ${orphanCount}개 — 선택지 목표(${[...targets].join('/')})가 ` +
          `직후 라벨(${j < out.length ? out[j].id : '없음'})과 달라 자동 재배치 불가. 원고를 고칠 것.`,
      );
    }
    const orphans = out.splice(i + 1, orphanCount); // 고아 제거 → 라벨이 i+1로 당겨진다
    out.splice(i + 2, 0, ...orphans); // 라벨 바로 뒤로 재삽입
    i += 1 + orphanCount;
  }
  return out;
}

/**
 * 전투 복귀 라벨 배치.
 * 원고에서 [battle] 다음에 이어지는 줄들은 "전투에서 돌아온 뒤 재생될 대사"다. 그런데 onWin
 * 라벨이 그 줄들보다 뒤에 있으면(true1s04의 `after_win`, sea2s01의 `win`) 승리 경로가 그 줄을
 * 통째로 건너뛰어 도달 불가가 된다. 전투 커맨드 바로 뒤에 복귀 라벨을 만들고 onWin을 그리로
 * 돌리면, 복귀 줄을 재생한 뒤 원래 onWin 라벨로 자연 낙하한다.
 * onLose는 STORY.md §7 명세 라벨(`after_lose`·`lose`)을 우선하고, 그런 라벨이 아예 없을 때만
 * 복귀 라벨을 공유한다. 전투 직후가 이미 onWin 라벨이면(c1s05·riw2s01·yun2s01) 손대지 않는다.
 */
function relinkBattleReturns(id, script) {
  const out = [...script];
  for (let i = 0; i < out.length; i++) {
    const cmd = out[i];
    if (cmd.t !== 'battle') continue;
    const findLabel = (name) => out.findIndex((c) => c.t === 'label' && c.id === name);
    if (findLabel(cmd.onWin) === i + 1) continue;
    const returnId = findLabel('after_battle') < 0 ? 'after_battle' : `after_battle_${cmd.id}`;
    const loseExists = findLabel(cmd.onLose) >= 0;
    out[i] = { ...cmd, onWin: returnId, onLose: loseExists ? cmd.onLose : returnId };
    out.splice(i + 1, 0, { t: 'label', id: returnId });
    const winIdx = findLabel(cmd.onWin);
    if (winIdx >= 0 && !reachableIndices(out).has(winIdx)) {
      throw new Error(
        `[${id}] 전투 복귀 줄이 onWin 라벨(${cmd.onWin})로 이어지지 않는다 — 원고의 [battle] 뒤 블록 끝을 확인할 것.`,
      );
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// c2s05 전용 오버라이드 — STORY.md §4.2 "최고 호감도 판정" if 체인.
// Cond는 플래그-대-상수 비교만 지원(플래그 대 플래그 비교 불가)하므로, aff_sea+aff_riwon+
// aff_yunseul == 12(고정, CH-01~04 4choice 합산 불변식)를 이용해 aff_sea 값을 먼저 eq로
// 고정한 뒤(바깥 if), 그 안에서 aff_riwon을 gte/lte 상수 범위로 검사(안쪽 if)하는 2단 중첩으로
// "aff_sea>=aff_riwon && aff_sea>=aff_yunseul" 류의 관계식을 상수비교만으로 표현한다.
// ---------------------------------------------------------------------------
function achievableSums(parts) {
  let cur = new Set([0]);
  for (const p of parts) {
    const next = new Set(cur);
    for (const s of cur) next.add(s + p);
    cur = next;
  }
  return Array.from(cur).sort((a, b) => a - b);
}

function buildRouteDecision() {
  const TOTAL = 12; // CH-01(+2)+CH-02(+3)+CH-03(+3)+CH-04(+4) — 4choice 합산 불변식
  const achievable = achievableSums([2, 3, 3, 4]);
  const head = [];
  const tail = [];

  achievable.forEach((a, i) => {
    const isLast = i === achievable.length - 1;
    const seaLo = Math.max(0, TOTAL - 2 * a);
    const seaHi = Math.min(a, TOTAL - a);
    const seaPossible = seaLo <= seaHi;
    const riwonLo = Math.max(a + 1, Math.ceil((TOTAL - a) / 2));
    const riwonHi = TOTAL - a;
    const riwonPossible = riwonLo <= riwonHi;
    const branchLabel = `rt_a${a}`;

    if (!seaPossible && !riwonPossible) {
      head.push({
        t: 'if',
        cond: { key: FLAGS.AFF_SEA, cmp: 'eq', value: a },
        then: 'rt_yunseul',
        ...(isLast ? { else: 'rt_tiebreak' } : {}),
      });
      return;
    }

    head.push({
      t: 'if',
      cond: { key: FLAGS.AFF_SEA, cmp: 'eq', value: a },
      then: branchLabel,
      ...(isLast ? { else: 'rt_tiebreak' } : {}),
    });

    tail.push({ t: 'label', id: branchLabel });
    if (seaPossible) {
      tail.push({
        t: 'if',
        cond: { all: [{ key: FLAGS.AFF_RIWON, cmp: 'gte', value: seaLo }, { key: FLAGS.AFF_RIWON, cmp: 'lte', value: seaHi }] },
        then: 'rt_sea',
        ...(riwonPossible ? {} : { else: 'rt_yunseul' }),
      });
    }
    if (riwonPossible) {
      tail.push({
        t: 'if',
        cond: { key: FLAGS.AFF_RIWON, cmp: 'gte', value: riwonLo },
        then: 'rt_riwon',
        else: 'rt_yunseul',
      });
    }
  });

  return [...head, ...tail];
}

function applyC2s05Routing(script) {
  const idx = (id) => script.findIndex((c) => c.t === 'label' && c.id === id);
  const rtEvalIdx = idx('rt_eval');
  const rtSeaIdx = idx('rt_sea');
  const rtRiwonIdx = idx('rt_riwon');
  const rtYunIdx = idx('rt_yunseul');
  if (rtEvalIdx < 0 || rtSeaIdx < 0 || rtRiwonIdx < 0 || rtYunIdx < 0) {
    throw new Error('c2s05: rt_eval/rt_sea/rt_riwon/rt_yunseul 라벨 중 일부가 원고에 없음');
  }
  const boundaries = [rtEvalIdx, rtSeaIdx, rtRiwonIdx, rtYunIdx].sort((a, b) => a - b);
  function chunkAfter(labelIdx) {
    const next = boundaries.find((b) => b > labelIdx) ?? script.length;
    return script.slice(labelIdx + 1, next);
  }
  const seaContent = chunkAfter(rtSeaIdx);
  const riwonContent = chunkAfter(rtRiwonIdx);
  const yunContent = chunkAfter(rtYunIdx);
  const head = script.slice(0, rtEvalIdx);

  const tiebreak = [
    { t: 'label', id: 'rt_tiebreak' },
    { t: 'if', cond: { key: FLAGS.LAST_CHOICE, cmp: 'eq', value: 1 }, then: 'rt_sea' },
    { t: 'if', cond: { key: FLAGS.LAST_CHOICE, cmp: 'eq', value: 2 }, then: 'rt_riwon' },
    { t: 'if', cond: { key: FLAGS.LAST_CHOICE, cmp: 'eq', value: 3 }, then: 'rt_yunseul', else: 'rt_yunseul' },
  ];

  return [
    ...head,
    { t: 'label', id: 'rt_eval' },
    ...buildRouteDecision(),
    { t: 'label', id: 'rt_sea' },
    ...seaContent,
    { t: 'label', id: 'rt_riwon' },
    ...riwonContent,
    { t: 'label', id: 'rt_yunseul' },
    ...yunContent,
    ...tiebreak,
  ];
}

/** GE 3종 + trueEnd — STORY.md §4.3/§4.4 글로벌 해금 슬롯을 ending 커맨드 직전에 부착. */
function injectGlobalUnlock(id, script) {
  const key = { seaGE: FLAGS.G_CLEAR_SEA, riwGE: FLAGS.G_CLEAR_RIWON, yunGE: FLAGS.G_CLEAR_YUNSEUL, trueEnd: FLAGS.G_TRUE_CLEARED }[id];
  if (!key) return script;
  const endIdx = script.findIndex((c) => c.t === 'ending');
  if (endIdx < 0) throw new Error(`${id}: ending 커맨드를 찾을 수 없음`);
  const setCmd = { t: 'set', ops: [{ key, op: 'set', value: true }] };
  return [...script.slice(0, endIdx), setCmd, ...script.slice(endIdx)];
}

// ---------------------------------------------------------------------------
// TS 직렬화 — 플래그 키는 FLAGS.<상수명>으로, 그 외는 JSON 리터럴로.
// ---------------------------------------------------------------------------
function jsKeyRef(keyStr) {
  const constName = FLAG_REVERSE[keyStr];
  return constName ? `FLAGS.${constName}` : JSON.stringify(keyStr);
}

function serializeNode(node) {
  if (Array.isArray(node)) return `[${node.map(serializeNode).join(', ')}]`;
  if (node === null) return 'null';
  if (typeof node === 'object') {
    const parts = Object.entries(node).map(([k, v]) => {
      if (k === 'key' && typeof v === 'string') return `key: ${jsKeyRef(v)}`;
      return `${k}: ${serializeNode(v)}`;
    });
    return `{ ${parts.join(', ')} }`;
  }
  return JSON.stringify(node);
}

function writeSceneFile(id, title, assets, script) {
  const body = `// AUTO-GENERATED by pipeline/scripts/convert_scenes.mjs — 원본: docs/SCRIPT/raw/${id}.md
// 수동 편집 금지. 원고를 고치고 컨버터를 재실행할 것.

import type { Scene } from '@/engine/types';
import { FLAGS } from '@/data/flags';

export const ${id}: Scene = {
  id: ${JSON.stringify(id)},
  title: ${JSON.stringify(title)},
  assets: ${serializeNode(assets)},
  script: [
    ${script.map(serializeNode).join(',\n    ')},
  ],
};
`;
  writeFileSync(join(OUT_DIR, `${id}.ts`), body, 'utf8');
}

function writeIndexFile() {
  const imports = SCENE_IDS.map((id) => `import { ${id} } from './${id}';`).join('\n');
  const entries = SCENE_IDS.map((id) => `  ${id},`).join('\n');
  const body = `// 씬 레지스트리 — 씬 간 jump(cmd.t === 'jump')를 처리할 때 store가 조회하는 단일 소스.
// P3A: 35씬 전량 등록(docs/STORY.md §3). 데모 씬(ch01_common/ch02_branch)은 _demo/로 격리.

import type { Scene } from '@/engine/types';
${imports}

export const SCENES: Record<string, Scene> = {
${entries}
};

export const START_SCENE_ID = 'c1s01';

export function getScene(id: string): Scene | null {
  return SCENES[id] ?? null;
}
`;
  writeFileSync(join(OUT_DIR, 'index.ts'), body, 'utf8');
}

function moveDemoScenes() {
  mkdirSync(DEMO_DIR, { recursive: true });
  for (const id of DEMO_SCENE_IDS) {
    const from = join(OUT_DIR, `${id}.ts`);
    const to = join(DEMO_DIR, `${id}.ts`);
    if (existsSync(from)) renameSync(from, to);
  }
}

// c1s01(시작 씬) 맨 앞에 호감도/분기 플래그를 0으로 명시 초기화 — interpreter.evalCond의
// gte/lte 비교는 `typeof v === 'number'`를 요구해서, 한 번도 set/add된 적 없는 플래그(키
// 자체가 flags 객체에 없음)에 대해선 항상 false를 반환한다(0으로 취급되지 않음). c2s05의
// 최고 호감도 판정 if 체인이 aff_riwon 등을 gte/lte로 검사하므로, 초기화 누락 시 "아무도
// 선택하지 않은 히로인" 케이스가 전부 오판된다.
function prependFlagInit(script) {
  const initOps = [FLAGS.AFF_SEA, FLAGS.AFF_RIWON, FLAGS.AFF_YUNSEUL, FLAGS.LAST_CHOICE].map((key) => ({
    key,
    op: 'set',
    value: 0,
  }));
  return [{ t: 'set', ops: initOps }, ...script];
}

function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  moveDemoScenes();

  let totalCommands = 0;
  for (const id of SCENE_IDS) {
    const rawPath = join(RAW_DIR, `${id}.md`);
    const rawText = readFileSync(rawPath, 'utf8');
    let { script, assets } = convertScene(id, rawText);
    if (id === 'c1s01') script = prependFlagInit(script);
    if (id === 'c2s05') script = applyC2s05Routing(script);
    if (['seaGE', 'riwGE', 'yunGE', 'trueEnd'].includes(id)) script = injectGlobalUnlock(id, script);
    script = relocateChoiceOrphans(id, script);
    script = relinkBattleReturns(id, script);
    writeSceneFile(id, SCENE_TITLES[id], assets, script);
    totalCommands += script.length;
    console.log(`  ${id}: ${script.length} commands`);
  }
  writeIndexFile();
  console.log(`\nconvert_scenes: ${SCENE_IDS.length}개 씬 생성, 총 ${totalCommands}개 커맨드`);
}

main();
