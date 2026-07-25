import { describe, expect, it } from 'vitest';
import type { Command } from './types';
import {
  DEFAULT_SETTINGS,
  advance,
  applyFlagOps,
  createInitialState,
  evalCond,
  resolveLabels,
  selectChoice,
  step,
  type VNState,
} from './interpreter';

function makeState(overrides: Partial<VNState> = {}): VNState {
  return {
    sceneId: 'test',
    sceneTitle: 'Test Scene',
    cursor: 0,
    flags: {},
    stage: [],
    speaker: null,
    dialogue: null,
    bg: null,
    bgm: null,
    cg: null,
    cgUnlocked: [],
    backlog: [],
    settings: DEFAULT_SETTINGS,
    choice: null,
    pendingJump: null,
    pendingBattle: null,
    ending: null,
    sfxEvents: [],
    fxEvent: null,
    done: false,
    ...overrides,
  };
}

describe('applyFlagOps', () => {
  it('set overwrites, add accumulates on numbers, missing key defaults to 0', () => {
    let flags = applyFlagOps({}, [{ key: 'a', op: 'set', value: 5 }]);
    expect(flags.a).toBe(5);
    flags = applyFlagOps(flags, [{ key: 'a', op: 'add', value: 3 }]);
    expect(flags.a).toBe(8);
    flags = applyFlagOps(flags, [{ key: 'b', op: 'add', value: -2 }]);
    expect(flags.b).toBe(-2);
  });

  it('set with boolean value works', () => {
    const flags = applyFlagOps({}, [{ key: 'seen', op: 'set', value: true }]);
    expect(flags.seen).toBe(true);
  });
});

describe('evalCond', () => {
  it('eq/gte/lte on numbers and booleans', () => {
    const flags = { aff: 3, seen: true };
    expect(evalCond({ key: 'aff', cmp: 'gte', value: 3 }, flags)).toBe(true);
    expect(evalCond({ key: 'aff', cmp: 'gte', value: 4 }, flags)).toBe(false);
    expect(evalCond({ key: 'aff', cmp: 'lte', value: 3 }, flags)).toBe(true);
    expect(evalCond({ key: 'seen', cmp: 'eq', value: true }, flags)).toBe(true);
  });

  it('all/any composition', () => {
    const flags = { a: 1, b: 2 };
    expect(
      evalCond({ all: [{ key: 'a', cmp: 'eq', value: 1 }, { key: 'b', cmp: 'eq', value: 2 }] }, flags),
    ).toBe(true);
    expect(
      evalCond({ all: [{ key: 'a', cmp: 'eq', value: 1 }, { key: 'b', cmp: 'eq', value: 9 }] }, flags),
    ).toBe(false);
    expect(evalCond({ any: [{ key: 'a', cmp: 'eq', value: 9 }, { key: 'b', cmp: 'eq', value: 2 }] }, flags)).toBe(
      true,
    );
  });
});

describe('resolveLabels', () => {
  it('maps label ids to their script index', () => {
    const script: Command[] = [
      { t: 'say', who: null, text: 'a' },
      { t: 'label', id: 'foo' },
      { t: 'say', who: null, text: 'b' },
      { t: 'label', id: 'bar' },
    ];
    expect(resolveLabels(script)).toEqual({ foo: 1, bar: 3 });
  });
});

describe('step — say/show/expr/move/hide/bg', () => {
  it('say sets dialogue, speaker, backlog and blocks', () => {
    const result = step(makeState(), { t: 'say', who: 'aoi', text: 'hi' });
    expect(result.blocking).toBe(true);
    expect(result.state.dialogue).toEqual({ who: 'aoi', text: 'hi', expr: undefined });
    expect(result.state.speaker).toBe('aoi');
    expect(result.state.backlog).toEqual([{ who: 'aoi', text: 'hi' }]);
  });

  it('show adds an actor to stage; expr/move update it in place', () => {
    let s = makeState();
    s = step(s, { t: 'show', who: 'aoi', expr: 'neutral', pos: 'center' }).state;
    expect(s.stage).toEqual([{ who: 'aoi', expr: 'neutral', pos: 'center' }]);
    s = step(s, { t: 'expr', who: 'aoi', expr: 'smile' }).state;
    expect(s.stage[0].expr).toBe('smile');
    s = step(s, { t: 'move', who: 'aoi', pos: 'left' }).state;
    expect(s.stage[0].pos).toBe('left');
  });

  it('hide removes the actor', () => {
    let s = makeState({ stage: [{ who: 'aoi', expr: 'neutral', pos: 'center' }] });
    s = step(s, { t: 'hide', who: 'aoi' }).state;
    expect(s.stage).toEqual([]);
  });

  it('bg sets the background src', () => {
    const s = step(makeState(), { t: 'bg', src: '/x.svg', fx: 'fade' }).state;
    expect(s.bg).toBe('/x.svg');
  });
});

describe('step — if', () => {
  it('jumps to then when cond true, else when false', () => {
    const trueRes = step(makeState({ flags: { a: 1 } }), {
      t: 'if',
      cond: { key: 'a', cmp: 'eq', value: 1 },
      then: 'L1',
      else: 'L2',
    });
    expect(trueRes.jumpToLabel).toBe('L1');

    const falseRes = step(makeState({ flags: { a: 0 } }), {
      t: 'if',
      cond: { key: 'a', cmp: 'eq', value: 1 },
      then: 'L1',
      else: 'L2',
    });
    expect(falseRes.jumpToLabel).toBe('L2');
  });
});

describe('advance — 라벨 점프·분기 통합', () => {
  const script: Command[] = [
    {
      t: 'if',
      cond: { key: 'aff', cmp: 'gte', value: 1 },
      then: 'warm',
      else: 'cold',
    },
    { t: 'label', id: 'cold' },
    { t: 'say', who: null, text: 'cold path' },
    { t: 'label', id: 'warm' },
    { t: 'say', who: null, text: 'warm path' },
  ];

  it('follows the else branch and stops at the first say', () => {
    const s = advance(makeState(), script);
    // cold(false) -> falls through into 'cold' say, THEN continues into warm's say too
    // because there is no jump skipping the warm block after cold — advance stops at the
    // first blocking command it hits, which is the 'cold path' say.
    expect(s.dialogue?.text).toBe('cold path');
    expect(s.cursor).toBeGreaterThan(0);
  });

  it('follows the then branch straight to warm when aff>=1', () => {
    const s = advance(makeState({ flags: { aff: 1 } }), script);
    expect(s.dialogue?.text).toBe('warm path');
  });

  it('marks done when the script is exhausted', () => {
    const linear: Command[] = [{ t: 'set', ops: [{ key: 'x', op: 'set', value: 1 }] }];
    const s = advance(makeState(), linear);
    expect(s.done).toBe(true);
  });
});

describe('choice — visibility, flag application, goto resolution', () => {
  const script: Command[] = [
    {
      t: 'choice',
      items: [
        { label: 'kind', goto: 'kindLabel', set: [{ key: 'aff', op: 'add', value: 2 }] },
        { label: 'hidden', goto: 'kindLabel', if: { key: 'unlocked', cmp: 'eq', value: true } },
        { label: 'cold', goto: 'coldLabel' },
      ],
    },
    { t: 'label', id: 'coldLabel' },
    { t: 'say', who: null, text: 'cold end' },
    { t: 'label', id: 'kindLabel' },
    { t: 'say', who: null, text: 'kind end' },
  ];

  it('hides items whose if-condition is unmet', () => {
    const s = advance(makeState(), script);
    expect(s.choice).not.toBeNull();
    expect(s.choice?.[0].visible).toBe(true);
    expect(s.choice?.[1].visible).toBe(false); // unlocked flag missing → false
    expect(s.choice?.[2].visible).toBe(true);
  });

  it('selecting an item applies flag ops and jumps to its goto label', () => {
    const afterChoice = advance(makeState(), script);
    const afterSelect = selectChoice(afterChoice, script, 0); // 'kind'
    expect(afterSelect.flags.aff).toBe(2);
    expect(afterSelect.dialogue?.text).toBe('kind end');
  });

  it('selecting the cold option skips straight to coldLabel', () => {
    const afterChoice = advance(makeState(), script);
    const afterSelect = selectChoice(afterChoice, script, 2); // 'cold'
    expect(afterSelect.dialogue?.text).toBe('cold end');
  });

  it('selecting a hidden (unmet-if) item is a no-op', () => {
    const afterChoice = advance(makeState(), script);
    const afterSelect = selectChoice(afterChoice, script, 1); // hidden
    expect(afterSelect).toBe(afterChoice);
  });
});

describe('battle/ending signalling', () => {
  it('battle command sets pendingBattle and blocks', () => {
    const r = step(makeState(), { t: 'battle', id: 'b1', onWin: 'winL', onLose: 'loseL' });
    expect(r.blocking).toBe(true);
    expect(r.state.pendingBattle).toEqual({ id: 'b1', onWin: 'winL', onLose: 'loseL' });
  });

  it('ending command sets ending id and blocks', () => {
    const r = step(makeState(), { t: 'ending', id: 'demo_end' });
    expect(r.blocking).toBe(true);
    expect(r.state.ending).toBe('demo_end');
  });

  it('jump command signals jumpToScene and blocks', () => {
    const r = step(makeState(), { t: 'jump', scene: 'ch02', label: 'start' });
    expect(r.blocking).toBe(true);
    expect(r.jumpToScene).toEqual({ scene: 'ch02', label: 'start' });
  });
});

describe('createInitialState', () => {
  it('builds a clean state from a Scene', () => {
    const scene = { id: 's1', title: 'Scene 1', assets: {}, script: [] as Command[] };
    const s = createInitialState(scene);
    expect(s.sceneId).toBe('s1');
    expect(s.cursor).toBe(0);
    expect(s.flags).toEqual({});
    expect(s.settings).toEqual(DEFAULT_SETTINGS);
  });
});
