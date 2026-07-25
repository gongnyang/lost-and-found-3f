// 데모 씬 2 — 씬 간 jump로 넘어온 플래그(ch01의 aff_haru/DEMO_ROOFTOP_UNLOCKED/
// DEMO_MET_HARU)가 그대로 유지되는지, choice.if 조건부 항목 숨김, ending 커맨드까지 검증.

import type { Scene } from '@/engine/types';
import { FLAGS } from '@/data/flags';

export const ch02_branch: Scene = {
  id: 'ch02_branch',
  title: '2장 · 기억의 파편',
  assets: {
    chars: ['aoi', 'sena'],
    bgs: ['/assets/bg/rooftop.svg'],
  },
  script: [
    { t: 'bg', src: '/assets/bg/rooftop.svg', fx: 'cut' },
    { t: 'show', who: 'sena', expr: 'neutral', pos: 'center', enter: 'fadeIn' },
    { t: 'show', who: 'aoi', expr: 'neutral', pos: 'left', enter: 'slideL' },
    { t: 'say', who: null, text: '옥상에는 아직 두 사람의 그림자만 남아 있었다.' },
    { t: 'say', who: 'sena', text: '...아오이, 나 뭔가 물어봐도 돼?' },
    { t: 'say', who: 'aoi', text: '응, 뭔데?' },
    {
      t: 'choice',
      items: [
        {
          label: '천천히 다 얘기해 줘.',
          goto: 'ch02_open',
          set: [{ key: FLAGS.DEMO_REMEMBERED, op: 'set', value: true }],
        },
        {
          label: '(하루 얘기를 슬쩍 꺼내 본다)',
          goto: 'ch02_open',
          if: { key: FLAGS.DEMO_MET_HARU, cmp: 'eq', value: true },
        },
        { label: '...지금은 아니야.', goto: 'ch02_closed' },
      ],
    },

    { t: 'label', id: 'ch02_open' },
    { t: 'say', who: 'sena', expr: 'smile', text: '고마워... 사실 나도, 요즘 뭔가 이상한 기분이 들어.' },
    { t: 'say', who: 'aoi', expr: 'surprise', text: '나도 비슷해. 뭔가 자꾸 빠진 기분이 들어.' },
    {
      t: 'if',
      cond: { key: FLAGS.DEMO_ROOFTOP_UNLOCKED, cmp: 'eq', value: true },
      then: 'ch02_endWarm',
      else: 'ch02_endPlain',
    },

    { t: 'label', id: 'ch02_closed' },
    { t: 'say', who: 'sena', expr: 'sad', text: '...그래, 억지로 안 물을게.' },

    { t: 'label', id: 'ch02_endPlain' },
    { t: 'say', who: 'sena', expr: 'neutral', text: '...그래도 괜찮아. 천천히 기억해내면 되니까.' },
    { t: 'ending', id: 'demo_ending_plain' },

    { t: 'label', id: 'ch02_endWarm' },
    { t: 'say', who: 'sena', expr: 'smile', text: '...그래도, 네가 있어서 다행이야.' },
    { t: 'ending', id: 'demo_ending_warm' },
  ],
};
