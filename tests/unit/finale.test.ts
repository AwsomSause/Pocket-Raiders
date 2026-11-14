// Beta 0.7 E10 Companions, E11 Citadark finale, D1 Region of Doom (in-run epilogue). No cross-run memory anywhere.

import { describe, expect, it } from 'vitest';
import { applyEffect } from '../../src/core/events';
import { chooseOption, cardOf, closeFormat } from '../../src/core/formats/registry';
import { currentFormat } from '../../src/core/formats/store';
import { companionEpilogue, companionsOf, postcards } from '../../src/core/grandArc/companions';
import { baseDoomLevel, doomDistricts, doomGyms, doomLedger, doomLevelNow, planDoom } from '../../src/core/grandArc/doom';
import { epilogueActive, epilogueBattleEnded, epilogueTick, startEpilogue } from '../../src/core/epilogue/director';
import { finaleAvailable, finaleCard, lostApproaches, planFinale, xd001Locks } from '../../src/core/grandArc/finale';
import { earnRom, grandArcOf } from '../../src/core/grandArc';
import { EpilogueStateSchema } from '../../src/core/grandArc/schema';
import { ExpansionRunSchema } from '../../src/core/expansion/schema';
import { chooseStarter, createRun } from '../../src/core/run';
import { buildEpilogue } from '../../src/core/ending';
import type { RunState } from '../../src/core/state';
import { content } from './helpers';

const ALL = ['K', 'J', 'H', 'S', 'U', 'X', 'A', 'G', 'P'];
const fresh = (seed: string, o: { finale?: boolean; doom?: boolean; roms?: string[]; flags?: string[] } = {}): RunState => {
  const run = structuredClone(chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red', expansion: { grandArc: true, finale: o.finale ?? true, doomEpilogue: o.doom ?? false } }), 0));
  for (const r of o.roms ?? []) earnRom(run, r);
  for (const f of o.flags ?? []) run.story.flags[`ev:${f}`] = 1;
  run.victory = true;
  return run;
};
const ctx = (run: RunState) => ({ content, run });

/** Plays the open card by picking `pick` (or just continuing) and closes it, as the Format screen does. */
function answer(run: RunState, pick?: string): void {
  const card = cardOf(ctx(run));
  expect(card).not.toBeNull();
  if (pick && card!.options.length > 0) chooseOption(ctx(run), pick);
  closeFormat(ctx(run));
}

/** Drives the epilogue to its end: every fight is won (or lost at `loseAt`), every card takes `picks[id]` if it has that option. */
function drive(run: RunState, o: { lose?: string; picks?: Record<string, string> } = {}): string[] {
  const seen: string[] = [];
  for (let i = 0; i < 200; i++) {
    const t = epilogueTick(content, run);
    if (t === 'over') return seen;
    if (t === 'wait') {
      const card = cardOf(ctx(run));
      seen.push(`card:${card?.title}`);
      const wanted = Object.values(o.picks ?? {}).find((p) => card?.options.some((x) => x.id === p));
      answer(run, wanted ?? (card?.options.some((x) => x.id === 'refuse') ? 'refuse' : card?.options[0]?.id));
      continue;
    }
    if (t === 'battle') {
      const key = run.battle?.event?.sideId ?? run.battle?.raid?.id ?? 'x';
      seen.push(`battle:${key}`);
      run.battle = null;
      run.phase = 'map';
      epilogueBattleEnded(run, o.lose !== key);
      continue;
    }
    throw new Error(`stuck at ${t}`);
  }
  throw new Error('epilogue never ended');
}

describe('Companions (E10)', () => {
  it('a companion is with you once their run event was played; nobody otherwise', () => {
    const run = fresh('c1');
    expect(companionsOf(run)).toEqual([]);
    expect(postcards(run)).toEqual([]);
    expect(companionEpilogue(run)).toEqual([]);
    run.story.flags['ev:wes-met'] = 1;
    run.story.flags['ev:comp-rui'] = 1;
    expect(companionsOf(run).map((c) => c.id)).toEqual(['wes', 'rui']);
    expect(postcards(run).length).toBe(2);
    expect(postcards(run, 0)).not.toEqual(postcards(run, 1));
    expect(companionEpilogue(run)[0]).toContain('Wes, Rui were there');
  });
  it('the three new run events set their flags and exist in the content', () => {
    for (const [id, flag] of [['xc.chobin', 'comp-chobin'], ['xc.rui', 'comp-rui'], ['xc.krane', 'comp-krane']] as const) {
      const ev = content.events.get(id);
      expect(ev, id).toBeTruthy();
      const run = fresh(`c-${id}`);
      for (const e of ev!.choices[0]!.success!.effects) applyEffect(content, run, e, { rng: undefined as never } as never);
      expect(Number(run.story.flags[`ev:${flag}`])).toBe(1);
    }
  });
});

describe('XD001 locks (E11)', () => {
  it('locks = 9 - ROMs earned, plus the companion adjustments, never below 0', () => {
    expect(xd001Locks(fresh('l0'))).toBe(9);
    expect(xd001Locks(fresh('l3', { roms: ['K', 'J', 'H'] }))).toBe(6);
    expect(xd001Locks(fresh('l9', { roms: ALL }))).toBe(0);
    expect(xd001Locks(fresh('lk', { roms: ['K', 'J', 'H'], flags: ['comp-krane'] }))).toBe(5);
    // The Remnants' balloon breaks lock J, only if J is still standing.
    expect(xd001Locks(fresh('lr', { roms: ['K', 'H', 'S'], flags: ['rocket-trio-debt'] }))).toBe(5);
    expect(xd001Locks(fresh('lr2', { roms: ['K', 'J', 'H'], flags: ['rocket-trio-debt'] }))).toBe(6);
  });
  it('a ROM taken late opens no lock', () => {
    const run = fresh('late', { roms: ['K', 'J', 'H'] });
    earnRom(run, 'S', true);
    expect(xd001Locks(run)).toBe(6);
  });
});

describe('finale plan (E11)', () => {
  it('is offered only to a won run with the setting on and three ROMs', () => {
    expect(finaleAvailable(fresh('a0', { roms: ['K', 'J'] }))).toBe(false);
    expect(finaleAvailable(fresh('a1', { roms: ['K', 'J', 'H'] }))).toBe(true);
    expect(finaleAvailable(fresh('a2', { roms: ['K', 'J', 'H'], finale: false }))).toBe(false);
    const notWon = fresh('a3', { roms: ['K', 'J', 'H'] });
    notWon.victory = false;
    expect(finaleAvailable(notWon)).toBe(false);
  });
  it('the plan is deterministic, and approaches and companions change it', () => {
    const run = fresh('p1', { roms: ['K', 'J', 'H'] });
    expect(planFinale(run)).toEqual(planFinale(run));
    const steps = planFinale(run);
    const battles = (s: typeof steps, key: string) => s.find((x) => x.t === 'battles' && x.key === key) as { n: number } | undefined;
    expect(lostApproaches(run)).toEqual(['gate', 'flats', 'lift', 'stair']);
    expect(battles(steps, 'crossing')!.n).toBe(3);
    expect(steps.some((s) => s.t === 'battles' && s.key === 'gonzap')).toBe(true);
    expect(steps.filter((s) => s.t === 'battles' && s.rom).length).toBe(4); // admins: capped at four, plus Evice
    const allied = fresh('p1', { roms: ['K', 'J', 'H'], flags: ['comp-chobin', 'wes-met', 'looker-evidence'] });
    const s2 = planFinale(allied);
    expect(battles(s2, 'crossing')!.n).toBe(2);
    expect(s2.some((s) => s.t === 'battles' && s.key === 'gonzap')).toBe(false);
    expect(battles(s2, 'climb')!.n).toBe(battles(steps, 'climb')!.n - 1); // the stair is held: one wave fewer
  });
  it('the letter names the approaches and offers Go and Never', () => {
    const c = finaleCard(fresh('card', { roms: ['K', 'J', 'H'] }), 'letter');
    expect(c.options.map((o) => o.id)).toEqual(['go', 'never']);
    expect(c.lines.join(' ')).toContain('nobody holds it');
  });
  it('"Nine." is offered only with all nine ROMs earned in their regions', () => {
    expect(finaleCard(fresh('n3', { roms: ['K', 'J', 'H'] }), 'greevil').options.map((o) => o.id)).toEqual(['number', 'refuse']);
    expect(finaleCard(fresh('n9', { roms: ALL }), 'greevil').options.map((o) => o.id)).toEqual(['number', 'refuse', 'nine']);
  });
});

describe('epilogue director (E11 + D1)', () => {
  it('nothing changes for a run with the defaults: no epilogue starts', () => {
    const run = fresh('d0', { finale: false, doom: false, roms: ['K', 'J', 'H'] });
    expect(startEpilogue(run)).toBe(false);
    expect(epilogueActive(run)).toBe(false);
    const plain = structuredClone(chooseStarter(content, createRun(content, { runId: 'd0b', seed: 'd0b', archetypeId: 'red' }), 0));
    plain.victory = true;
    expect(startEpilogue(plain)).toBe(false);
    expect(plain.expansion?.epilogue).toBeUndefined();
  });
  it('plays the whole finale to a sung ending, and the run stays won', () => {
    const run = fresh('d1', { roms: ['K', 'J', 'H'] });
    expect(startEpilogue(run)).toBe(true);
    expect(run.phase).toBe('map');
    const seen = drive(run);
    expect(seen[0]).toBe('card:The Nine Locks');
    expect(seen.some((s) => s === 'battle:xd001' || s === 'battle:ss-cipher-xd001')).toBe(true);
    expect(run.expansion!.epilogue!.finaleResult).toBe('sung');
    expect(run.victory).toBe(true);
    expect(run.phase).toBe('over');
    expect(run.expansion!.epilogue!.rainbow).toBe('empty');
    expect(grandArcOf(run)!.late.length).toBeGreaterThan(0); // beaten liaisons gave their ROMs late
  });
  it('with all nine ROMs the last fight is not a fight', () => {
    const run = fresh('d9', { roms: ALL });
    startEpilogue(run);
    const seen = drive(run, { picks: { greevil: 'refuse' } });
    expect(seen.some((s) => s.includes('xd001'))).toBe(false);
    expect(run.expansion!.epilogue!.finaleResult).toBe('sung');
    expect(finaleCard(run, 'greevil-end').lines[0]).toContain('walk up to it');
  });
  it('"Never" at the letter, a sale to Greevil and a loss each end the finale without undoing the win', () => {
    const never = fresh('dn', { roms: ['K', 'J', 'H'] });
    startEpilogue(never);
    drive(never, { picks: { letter: 'never' } });
    expect(never.expansion!.epilogue!.finaleResult).toBe('declined');
    expect(never.victory).toBe(true);

    const sold = fresh('ds', { roms: ['K', 'J', 'H'] });
    startEpilogue(sold);
    drive(sold, { picks: { greevil: 'number' } });
    expect(sold.expansion!.epilogue!.finaleResult).toBe('sold');

    const lost = fresh('dl', { roms: ['K', 'J', 'H'] });
    startEpilogue(lost);
    const seen = drive(lost, { lose: 'crossing.0' });
    expect(lost.expansion!.epilogue!.finaleResult).toBe('silent');
    expect(seen.filter((s) => s.startsWith('battle:')).length).toBe(1);
    expect(lost.victory).toBe(true);
    expect(lost.phase).toBe('over');
  });
  it('save and reload in the middle (at a card and at a fight) continues where it was', () => {
    const run = fresh('sv', { roms: ['K', 'J', 'H'] });
    startEpilogue(run);
    expect(epilogueTick(content, run)).toBe('wait');
    const reloaded = JSON.parse(JSON.stringify(run)) as RunState;
    expect(currentFormat(reloaded)?.id).toBe('card');
    answer(reloaded, 'go');
    expect(epilogueTick(content, reloaded)).toBe('battle');
    const again = JSON.parse(JSON.stringify(reloaded)) as RunState;
    again.battle = null;
    again.phase = 'map';
    epilogueBattleEnded(again, true);
    expect(epilogueTick(content, again)).toBe('battle');
    expect(ExpansionRunSchema.safeParse(again.expansion).success).toBe(true);
  });
});

describe('Rainbow Door', () => {
  it('has no fight with no Apex lost, and one lane per taken Apex', () => {
    const none = planFinale(fresh('rd0', { roms: ['K', 'J', 'H'] })).find((s) => s.t === 'battles' && s.key === 'rainbow') as { n: number };
    expect(none.n).toBe(0);
    const run = fresh('rd1', { roms: ['K', 'J', 'H'] });
    run.story.flags['rocket.x.m2'] = 'taken';
    expect((planFinale(run).find((s) => s.t === 'battles' && s.key === 'rainbow') as { n: number }).n).toBe(1);
    startEpilogue(run);
    expect(drive(run).filter((x) => x.startsWith('battle:rainbow')).length).toBe(1);
    expect(run.expansion!.epilogue!.rainbow).toBe('open');
  });
});

describe('Region of Doom (D1)', () => {
  it('always has 14 districts and 8 gyms, with the fixed districts present', () => {
    const run = fresh('r0', { doom: true });
    const ds = doomDistricts(run);
    expect(ds.length).toBe(14);
    for (const id of ['black-market-mile', 'pale-garden', 'wire-row', 'crown-yard', 'undercroft']) expect(ds.some((d) => d.id === id)).toBe(true);
    expect(doomGyms(run).length).toBe(8);
    expect(planDoom(run).filter((s) => s.t === 'battles').length).toBe(8);
  });
  it('uses invented placeholder leaders when the run supplies none, and the run\'s own ranks when it does', () => {
    const empty = fresh('r1', { doom: true });
    expect(doomGyms(empty).every((g) => !g.spec.evil)).toBe(true);
    const withTeam = fresh('r2', { doom: true });
    withTeam.story.evil = { ...(withTeam.story.evil ?? ({} as never)), teamId: 'rocket', end: 'exposed', villains: {}, ops: [], heat: 0, beat: 7, defector: false } as never;
    const gyms = doomGyms(withTeam);
    expect(gyms[0]!.spec.evil).toBe('executive');
    expect(gyms[3]!.spec.evil).toBe('leader'); // exposed
    expect(gyms[2]!.spec.evil).toBeUndefined(); // not pardoned
    expect(doomLedger(withTeam).teams[0]).toEqual({ id: 'rocket', end: 'exposed' });
  });
  it('the Doom Level falls with every district taken back and never goes below 0', () => {
    let last = 5;
    for (let n = 0; n <= 8; n++) {
      const l = doomLevelNow(3, n);
      expect(l).toBeLessThanOrEqual(last);
      expect(l).toBeGreaterThanOrEqual(0);
      last = l;
    }
    expect(doomLevelNow(3, 2)).toBe(2.6);
    expect(baseDoomLevel({ teams: [], apexTaken: false, finale: 'unseen', defector: false })).toBe(1);
    expect(baseDoomLevel({ teams: [1, 2, 3, 4, 5, 6].map((i) => ({ id: `t${i}`, end: 'none' as const })), apexTaken: true, finale: 'silent', defector: false })).toBe(5);
  });
  it('plays through: eight gym wins clear it; a loss walks you out; the win is never undone', () => {
    const win = fresh('rw', { doom: true, finale: false });
    expect(startEpilogue(win)).toBe(true);
    const seen = drive(win);
    expect(seen.filter((s) => s.startsWith('battle:gym-')).length).toBe(8);
    expect(win.expansion!.epilogue!.marks).toBe(8);
    expect(win.expansion!.epilogue!.doomResult).toBe('cleared');
    expect(win.expansion!.epilogue!.taken.length).toBe(8);

    const lose = fresh('rl', { doom: true, finale: false });
    startEpilogue(lose);
    drive(lose, { lose: 'gym-3.0' });
    expect(lose.expansion!.epilogue!.doomResult).toBe('fled');
    expect(lose.expansion!.epilogue!.marks).toBe(2);
    expect(lose.victory).toBe(true);

    const leave = fresh('rv', { doom: true, finale: false });
    startEpilogue(leave);
    const s = drive(leave, { picks: { x: 'leave' } });
    expect(s.some((x) => x.startsWith('battle:'))).toBe(false);
    expect(leave.expansion!.epilogue!.doomResult).toBe('declined');
  });
  it('the finale leads into the Region of Doom when both are on', () => {
    const run = fresh('rb', { doom: true, roms: ['K', 'J', 'H'] });
    startEpilogue(run);
    const seen = drive(run);
    expect(run.expansion!.epilogue!.finaleResult).toBe('sung');
    expect(run.expansion!.epilogue!.doomResult).toBe('cleared');
    expect(seen.indexOf('card:The Region of Doom: the Margin')).toBeGreaterThan(seen.indexOf('battle:greevil.0'));
  });
  it('the victory text adds one line per chapter played and stays the same otherwise', () => {
    const plain = fresh('t0', { finale: false });
    const base = buildEpilogue(content, plain);
    const run = fresh('t1', { doom: true, roms: ['K', 'J', 'H'], flags: ['wes-met'] });
    startEpilogue(run);
    drive(run);
    const lines = buildEpilogue(content, run);
    expect(lines.some((l) => l.includes('XD001 found its song'))).toBe(true);
    expect(lines.some((l) => l.includes('Wes'))).toBe(true);
    expect(base.some((l) => l.includes('XD001'))).toBe(false);
  });
});

describe('saves', () => {
  it('an older run (no epilogue block) loads, and the block is optional with safe defaults', () => {
    expect(ExpansionRunSchema.safeParse({}).success).toBe(true);
    const e = EpilogueStateSchema.parse({});
    expect(e).toEqual({ finale: false, doom: false, picks: {}, marks: 0, taken: [] });
    expect(ExpansionRunSchema.safeParse({ epilogue: { finale: true, finaleResult: 'sung', marks: 3 } }).success).toBe(true);
    expect(ExpansionRunSchema.safeParse({ epilogue: { finaleResult: 'nonsense' } }).success).toBe(false);
  });
});
