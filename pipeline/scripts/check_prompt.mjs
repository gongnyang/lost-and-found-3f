#!/usr/bin/env node
// check_prompt.mjs — 배치 jsonl의 동결 페르소나 블록 무결성 검증기.
// 사용: node check_prompt.mjs <batch.jsonl>
// 규칙: 각 라인의 prompt 는 pipeline/prompts/persona/<char>.txt 전문을
//       글자 단위 그대로(verbatim) 포함해야 한다. 필수 필드/사이즈도 검사.
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PERSONA_DIR = resolve(ROOT, 'prompts/persona');
const VALID_SIZES = new Set(['1024x1024', '1536x1024', '1024x1536', '1792x1024', '1024x1792', '2048x2048']);

const file = process.argv[2];
if (!file) { console.error('usage: node check_prompt.mjs <batch.jsonl>'); process.exit(2); }

const personas = {};
for (const name of ['sea', 'riwon', 'yunseul']) {
  personas[name] = readFileSync(resolve(PERSONA_DIR, `${name}.txt`), 'utf8').trim();
}

let ok = 0, fail = 0;
const lines = readFileSync(file, 'utf8').split('\n').filter((l) => l.trim());
for (const [i, line] of lines.entries()) {
  const errs = [];
  let item;
  try { item = JSON.parse(line); } catch (e) { console.error(`[L${i + 1}] JSON parse fail: ${e.message}`); fail++; continue; }
  for (const f of ['id', 'prompt', 'size', 'output_path']) if (!item[f]) errs.push(`missing field: ${f}`);
  // id → 필요한 페르소나 목록. bg_* = 배경(페르소나 불요), cg_* = CG 매핑표, 그 외 = 기존 prefix 규칙.
  const requiredPersonas = (id) => {
    if (!id) return null;
    if (id.startsWith('sp-')) {
      if (id.startsWith('sp-sea-')) return ['sea'];
      if (id.startsWith('sp-riwon-')) return ['riwon'];
      if (id.startsWith('sp-yunseul-')) return ['yunseul'];
      return null;
    }
    if (id.startsWith('bg_')) return [];
    if (id.startsWith('cg_')) {
      if (id.startsWith('cg_sea')) return ['sea'];
      if (id.startsWith('cg_riw')) return ['riwon'];
      if (id.startsWith('cg_yun')) return ['yunseul'];
      if (id.startsWith('cg_true_02')) return ['sea', 'riwon', 'yunseul'];
      if (id.startsWith('cg_true_01') || id.startsWith('cg_common')) return []; // 오브젝트 CG
      if (id.startsWith('cg_signboard') || id.startsWith('cg_ledger_return')) return []; // 오브젝트 CG (갭픽스)
      return null;
    }
    const single = Object.keys(personas).find((n) => id.startsWith(n));
    return single ? [single] : null;
  };
  const need = requiredPersonas(item.id);
  const char = need && need.length ? need.join('+') : (need ? '(none)' : null);
  if (need === null) errs.push(`id "${item.id}" does not map to a persona rule (bg_|cg_|sea|riwon|yunseul prefix)`);
  else for (const n of need) if (!item.prompt.includes(personas[n])) errs.push(`frozen persona block for "${n}" NOT verbatim in prompt`);
  if (item.size && !VALID_SIZES.has(item.size)) errs.push(`invalid size ${item.size}`);
  if (item.output_path && !item.output_path.startsWith('/mnt/d/miyensi/')) errs.push(`output_path outside /mnt/d/miyensi: ${item.output_path}`);
  if (errs.length) { fail++; console.error(`[L${i + 1}] ${item.id ?? '?'}: ${errs.join(' | ')}`); }
  else { ok++; console.log(`[L${i + 1}] ${item.id}: OK (persona=${char}, size=${item.size})`); }
}
console.log(`\ncheck_prompt: ${ok} ok / ${fail} fail / ${lines.length} total`);
process.exit(fail === 0 ? 0 : 1);
