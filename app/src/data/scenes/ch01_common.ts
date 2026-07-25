// 데모 씬 1 — 선택지 분기, 플래그 add/set, 표정 스왑, bg 전환, 씬 간 jump를 모두 검증.
// "if(cond)-then/else 양쪽 지정"을 무조건 분기(goto 대체)로 활용해 씬 내 라벨 합류를 구현한다.

import type { Scene } from '@/engine/types';
import { FLAGS } from '@/data/flags';

export const ch01_common: Scene = {
  id: 'ch01_common',
  title: '1장 · 소리 없는 아침',
  assets: {
    chars: ['aoi', 'haru', 'sena'],
    bgs: ['/assets/bg/classroom.svg', '/assets/bg/rooftop.svg'],
  },
  script: [
    { t: 'bg', src: '/assets/bg/classroom.svg', fx: 'fade' },
    { t: 'show', who: 'aoi', expr: 'neutral', pos: 'center', enter: 'fadeIn' },
    { t: 'say', who: 'aoi', text: '...또, 같은 꿈을 꿨어.' },
    { t: 'say', who: null, text: '창밖의 빛이 유리에 부딪혀 조용히 흩어진다.' },
    { t: 'show', who: 'haru', expr: 'neutral', pos: 'right', enter: 'slideR' },
    { t: 'say', who: 'haru', text: '아오이, 여기 있었네. 아침부터 혼자 뭐 해?' },
    { t: 'say', who: 'aoi', expr: 'sad', text: '...아무것도. 그냥 잠깐 멍하니 있었어.' },
    {
      t: 'choice',
      items: [
        {
          label: '괜찮아? 무슨 일 있었어?',
          goto: 'ch01_kind',
          set: [
            { key: FLAGS.DEMO_CHOSE_KIND, op: 'set', value: true },
            { key: FLAGS.AFF_HARU, op: 'add', value: 2 },
          ],
        },
        {
          label: '...그냥 신경 쓰지 마.',
          goto: 'ch01_cold',
          set: [{ key: FLAGS.AFF_HARU, op: 'add', value: -1 }],
        },
      ],
    },

    { t: 'label', id: 'ch01_kind' },
    { t: 'say', who: 'haru', expr: 'smile', text: '그렇구나. 무슨 일이든 나한테 말해도 돼.' },
    { t: 'say', who: 'aoi', expr: 'smile', text: '...고마워, 하루.' },
    { t: 'set', ops: [{ key: FLAGS.DEMO_MET_HARU, op: 'set', value: true }] },
    {
      t: 'if',
      cond: { key: FLAGS.DEMO_CHOSE_KIND, cmp: 'eq', value: true },
      then: 'ch01_continue',
      else: 'ch01_cold',
    },

    { t: 'label', id: 'ch01_cold' },
    { t: 'say', who: 'haru', expr: 'sad', text: '...그래, 알겠어.' },
    { t: 'say', who: 'aoi', expr: 'neutral', text: '(마음이 조금 무거워졌다.)' },

    { t: 'label', id: 'ch01_continue' },
    { t: 'bg', src: '/assets/bg/rooftop.svg', fx: 'cut' },
    { t: 'hide', who: 'haru', exit: 'fadeOut' },
    { t: 'show', who: 'sena', expr: 'neutral', pos: 'left', enter: 'slideL' },
    { t: 'say', who: 'sena', text: '...여기 왜 혼자 있어?' },
    { t: 'say', who: 'aoi', text: '그냥 바람 좀 쐬려고. 너는?' },
    {
      t: 'if',
      cond: { key: FLAGS.AFF_HARU, cmp: 'gte', value: 2 },
      then: 'ch01_warm',
      else: 'ch01_neutral',
    },

    { t: 'label', id: 'ch01_warm' },
    { t: 'say', who: 'sena', expr: 'smile', text: '...오늘은 다들 좀 다정하네.' },
    { t: 'set', ops: [{ key: FLAGS.DEMO_ROOFTOP_UNLOCKED, op: 'set', value: true }] },
    {
      t: 'if',
      cond: { key: FLAGS.DEMO_ROOFTOP_UNLOCKED, cmp: 'eq', value: true },
      then: 'ch01_finale',
      else: 'ch01_neutral',
    },

    { t: 'label', id: 'ch01_neutral' },
    { t: 'say', who: 'sena', expr: 'neutral', text: '...그렇구나.' },

    { t: 'label', id: 'ch01_finale' },
    { t: 'fx', kind: 'blurMemory', dur: 800 },
    { t: 'say', who: null, text: '기억은 조용히, 다시 접힌다.' },
    { t: 'jump', scene: 'ch02_branch' },
  ],
};
