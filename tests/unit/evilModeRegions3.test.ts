// Evil Mode slice 20, "the last three" (build plan section 3; design Part 26c, Part 08d, Part 15b sections 3 to 6).
// Proves: the Star enumeration (no action of any kind reaches a Star base but a Visit; nothing puts Star at War, in the
// Chair, under a Merger, at the Pen or in the person slot); Buy and Replace are shut in Alola and say who shut them;
// Galar's handshake; the Chairman's loan and its thirteenth field; a guardian's regard; the three regions' data; a run
// from each replays.

import { describe, expect, it } from 'vitest';
import { foundForPlay, playRegion, replay } from '../../src/core/evilMode/autoplay';
import { EVIL_DATA } from '../../src/core/evilMode/data';
import { canDo } from '../../src/core/evilMode/canDo';
import { BEAT_END, step, type EvilAction } from '../../src/core/evilMode/day';
import { methodsFor, stageRow } from '../../src/core/evilMode/board';
import { gymDoors } from '../../src/core/evilMode/gym';
import { ensureNeighbour, neighbourDef } from '../../src/core/evilMode/neighbour';
import { activeMods } from '../../src/core/evilMode/regionRule';
import { EMPTY_L3, STAR_NEVER, afterGym, l3Evening, l3Morning, loanCard, loanVested, regionActs, shrineTerms, stanceList, starLocks } from '../../src/core/evilMode/lastThree';
import { foundTeam, type FoundingChoice } from '../../src/core/evilMode/start';
import { EvilModeBlockSchema, firstCrew, type EvilModeBlock, type Holding } from '../../src/core/evilMode/schema';

const choice = (over: Partial<FoundingChoice> = {}): FoundingChoice => ({ name: 'Kettle', creed: 'profit', line: 'grey', doctrine: 'swarm', patron: 'executive', region: 'kanto', ...over });
/** A team founded straight into one of the three, at a given stage (1 the Arrival .. 8 the Reckoning). */
const at = (region: string, stage: number, seed = 'l3'): EvilModeBlock => {
  const r = foundTeam(choice({ region }), { boss: 'red', length: 'three', seed, stage });
  if (!r.ok) throw new Error(r.problem);
  return ensureNeighbour({ ...r.block, crew: firstCrew(6, 6), applicants: [] });
};
const go = (b: EvilModeBlock, a: EvilAction): EvilModeBlock => {
  const r = step(b, a);
  if (!r.ok) throw new Error(`${a.type}: ${JSON.stringify(r.cues)}`);
  return r.block;
};
const toBeat = (b: EvilModeBlock, beat: EvilModeBlock['here']['beat']): EvilModeBlock => {
  for (let i = 0; i < 12 && b.here.beat !== beat; i++) b = go(b, { type: BEAT_END[b.here.beat] });
  return b;
};
const reload = (b: EvilModeBlock) => EvilModeBlockSchema.parse(JSON.parse(JSON.stringify(b)));
const L3 = EVIL_DATA.region.lastThree!;
const NEW = ['alola', 'galar', 'paldea'] as const;

describe('the three regions\' data', () => {
  it('each is supported, with eight stages, eight locals, eight Leaders, a neighbour and its own holding', () => {
    const own = { alola: 'shrine', galar: 'awayEnd', paldea: 'canteen' } as const;
    for (const id of NEW) {
      const def = EVIL_DATA.region.regions.find((r) => r.id === id)!;
      expect(def.status, id).toBe('supported');
      expect(def.waits, id).toBeUndefined();
      for (let n = 0; n < 8; n++) expect(stageRow(def.index, n), `${id} ${n}`).toBeTruthy();
      expect(EVIL_DATA.district.locals.filter((l) => l.region === def.index), id).toHaveLength(8);
      const leaders = EVIL_DATA.gym.leaders.filter((l) => l.region === def.index);
      expect(new Set(leaders.map((l) => l.n)).size, id).toBe(8);
      expect(neighbourDef(def.index), id).toBeTruthy();
      const b = at(id, 2, `lay-${id}`);
      expect(b.district!.holdings).toHaveLength(20);
      expect(EVIL_DATA.district.districts.filter((r) => r.region === def.index).reduce((n, r) => n + (r.layout?.[own[id]] ?? 0), 0), id).toBeGreaterThan(0);
    }
    expect(neighbourDef(6)!.boss).toBe('Guzma');
    expect(neighbourDef(8)!.minors).toBe(true);
    expect(neighbourDef(8)!.noWar).toBe(true);
    // Galar's second clock, and nobody else's new one.
    expect(EVIL_DATA.region.clocks!.map((c) => c.region)).toContain('galar');
  });

  it('a shrine and a Star base can\'t be held by any method; a canteen table and an away end can', () => {
    const h = (kind: Holding['kind']): Holding => ({ id: 'x', step: 1, kind, ref: 'x', mood: null, scouted: 0, owner: 'nobody', holds: false, tried: [] });
    expect(methodsFor(h('shrine'))).toEqual([]);
    expect(methodsFor(h('starBase'))).toEqual([]);
    expect(methodsFor(h('canteen')).length).toBeGreaterThan(0);
    expect(methodsFor(h('awayEnd')).length).toBeGreaterThan(0);
  });
});

describe('Alola: Buy and Replace are shut, and say who shut them (Part 8d section A.1)', () => {
  it('at every district\'s Gym, whatever the Regard or the safe (the first and eighth are shut to every way anyway)', () => {
    for (let stage = 2; stage <= 7; stage++) {
      const b0 = at('alola', stage, `shut-${stage}`);
      const b = { ...b0, team: { ...b0.team, regard: 10, funds: 999999 } };
      for (const way of ['buy', 'replace'] as const) {
        const d = gymDoors(b).find((x) => x.way === way)!;
        expect(d.open, `${stage} ${way}`).toBe(false);
        expect(d.shutBy, `${stage} ${way}`).toBe('Shut by the island');
        expect(d.why).toBeTruthy();
      }
    }
  });

  it('Buy and Replace stay open to their own rules in Galar and Paldea (no island shut them)', () => {
    for (const id of ['galar', 'paldea']) {
      const b = at(id, 3, `open-${id}`);
      for (const way of ['buy', 'replace'] as const) expect(gymDoors(b).find((x) => x.way === way)!.shutBy).not.toBe('Shut by the island');
    }
  });
});

describe('Paldea: the Star enumeration (Part 15b section 5.1)', () => {
  // District 1 has a Star base (Part 26c section 3.2).
  const b0 = toBeat(at('paldea', 2, 'star-1'), 'inPerson');
  const base = b0.district!.holdings.find((h) => h.kind === 'starBase')!;
  const crewId = b0.crew[0]!.id;
  const job = { holdingId: base.id, method: 'scout' as const, squad: [crewId] };

  it('every action that names a Star base is refused, by the one guard, before any step', () => {
    expect(base).toBeTruthy();
    const refused = L3.star.refused;
    const acts: EvilAction[] = [
      ...(['scout', 'persuade', 'pay', 'take', 'lean', 'outplay', 'rig'] as const).flatMap((method) => [
        { type: 'queueJob', job: { ...job, method } } as EvilAction,
        { type: 'confirmCard', job: { ...job, method } } as EvilAction,
        { type: 'askAnyway', job: { ...job, method } } as EvilAction,
      ]),
      { type: 'waive', holdingId: base.id }, { type: 'halve', holdingId: base.id }, { type: 'askAbout', holdingId: base.id }, { type: 'clearJob', holdingId: base.id },
      { type: 'post', holdingId: base.id, id: crewId }, { type: 'unpost', holdingId: base.id }, { type: 'goYourself', holdingId: base.id },
      { type: 'trade', req: { cardId: 'any', holdingId: base.id } } as EvilAction,
      { type: 'schemeWay', part: 'p1', key: 'a', holdingId: base.id } as unknown as EvilAction,
      { type: 'dig', id: 'any', holdingId: base.id }, { type: 'digEnd', holdingId: base.id, back: false },
      { type: 'place', piece: { holdingId: base.id } } as unknown as EvilAction,
      { type: 'regionAct', code: `loan:${base.id}` },
    ];
    for (const a of acts) {
      const c = canDo(b0, a);
      expect(c.ok, a.type).toBe(false);
      expect(!c.ok && c.why, a.type).toBe(refused);
      expect(step(b0, a).ok, a.type).toBe(false);
    }
  });

  it('no Chair, no Pen, no person slot; the stance list has no War, Rivals, Front or Merger', () => {
    expect(canDo(b0, { type: 'chair' }).ok).toBe(false);
    expect(canDo(b0, { type: 'table', thing: 'person', personId: crewId }).ok).toBe(false);
    expect(canDo(b0, { type: 'table', thing: 'pen' }).ok).toBe(false);
    const list = stanceList(b0);
    for (const s of STAR_NEVER) expect(list).not.toContain(s);
    expect(list).toContain('service');
    // A stance forced in from outside is pulled back by the step's last guard.
    for (const s of STAR_NEVER) expect(starLocks({ ...b0, neighbour: { ...b0.neighbour!, stance: s } }).neighbour!.stance).toBe('wary');
  });

  it('the third answer at a Sit-Down is Service, never War', () => {
    let b = go(b0, { type: 'sitDown' });
    b = go(b, { type: 'sitAnswer', i: 2 });
    expect(b.neighbour!.stance).toBe('service');
  });

  it('a Visit is the one thing that reaches a base: in person, once a day, once a base', () => {
    const acts = regionActs(b0).filter((r) => r.code.startsWith('visit:'));
    expect(acts.map((r) => r.code)).toContain(`visit:${base.id}`);
    const r = step(b0, { type: 'regionAct', code: `visit:${base.id}` });
    expect(r.ok).toBe(true);
    expect(r.block.region.l3!.visited).toContain(base.id);
    expect(r.block.neighbour!.opinion).toBe(Math.min(3, b0.neighbour!.opinion + L3.star.opinion));
    expect(step(r.block, { type: 'regionAct', code: `visit:${base.id}` }).ok).toBe(false);
    expect(reload(r.block).region.l3).toEqual(r.block.region.l3);
  });

  it('a whole Paldea played by the autoplayer: no Star base is ever the team\'s, and Star never stands where it can\'t', () => {
    const p = playRegion(foundForPlay('star-run', choice({ region: 'paldea' })), 'mix');
    const b = p.block;
    expect(b.district?.holdings.filter((h) => h.kind === 'starBase' && h.owner === 'team') ?? []).toEqual([]);
    if (b.neighbour) expect(STAR_NEVER).not.toContain(b.neighbour.stance);
    let x = foundForPlay('star-run', choice({ region: 'paldea' }));
    for (const a of p.actions) {
      x = step(x, a).block;
      if (x.neighbour && x.here.region === 8) expect(STAR_NEVER, a.type).not.toContain(x.neighbour.stance);
    }
  });
});

describe('Galar: on television (Part 8d section G.1)', () => {
  it('a won Gym waits on the handshake; shaking turns the Dread into Regard; only in Galar, only a win', () => {
    const b0 = toBeat(at('galar', 3, 'pitch'), 'inPerson');
    const fought = { ...b0, fight: { kind: 'gym' } } as unknown as EvilModeBlock;
    const after = { ...b0, team: { ...b0.team, dread: 4, regard: 2 } };
    const won = afterGym(fought, after, true);
    expect(won.lines).toEqual([L3.pitch.ask]);
    expect(afterGym(fought, after, false).lines).toEqual([]);
    expect(afterGym({ ...fought, region: { ...fought.region, id: 'kanto' } }, after, true).lines).toEqual([]);
    const codes = regionActs(won.block).map((r) => r.code);
    expect(codes).toEqual(expect.arrayContaining(['shake:yes', 'shake:no']));
    const yes = go(won.block, { type: 'regionAct', code: 'shake:yes' });
    expect([yes.team.dread, yes.team.regard]).toEqual([3, 3]);
    const no = go(won.block, { type: 'regionAct', code: 'shake:no' });
    expect([no.team.dread, no.team.regard]).toEqual([4, 2]);
    expect(step(yes, { type: 'regionAct', code: 'shake:yes' }).ok).toBe(false);
  });
});

describe('Galar: the Chairman\'s loan (Part 26c section 2.1)', () => {
  const offered = (): EvilModeBlock => {
    let b = at('galar', 1, 'loan');
    for (let i = 0; i < 30 && b.region.l3?.offered !== 'open'; i++) b = go(b, { type: BEAT_END[b.here.beat] });
    return toBeat(b, 'inPerson');
  };

  it('rings on the Arrival\'s second day with a thirteen-field Card, the clause in the thirteenth', () => {
    const card = loanCard();
    expect(card).toHaveLength(13);
    expect(card[12]![1]).toMatch(/Heat reaches 8/);
    expect(card[12]![1]).toMatch(/Fronts?/);
    const b = offered();
    expect(b.here.day - (b.district!.from ?? 1) + 1).toBeGreaterThanOrEqual(L3.loan.offerDay);
    expect(b.region.notes).toContain(L3.loan.rings);
    expect(regionActs(b).map((r) => r.code)).toEqual(expect.arrayContaining(['loan:take', 'loan:no']));
  });

  it('taken: the money\'s in the safe; Heat 8 vests every Front, and Going Straight shuts', () => {
    const b = offered();
    const t = go(b, { type: 'regionAct', code: 'loan:take' });
    expect(t.team.funds).toBe(b.team.funds + L3.loan.amount);
    const front = { id: 'f1', kind: 'front', cardId: 'x' } as unknown as EvilModeBlock['economy']['running'][number];
    const hot = { ...t, team: { ...t.team, heat: L3.loan.heat }, economy: { ...t.economy, running: [front] }, evening: [] };
    const v = l3Evening(hot);
    expect(loanVested(v)).toBe(true);
    expect(v.economy.running).toEqual([]);
    expect(l3Evening({ ...hot, team: { ...hot.team, heat: L3.loan.heat - 1 } }).economy.running).toHaveLength(1);
    // Asking what "reasonable" means is answered, once.
    const asked = go(t, { type: 'regionAct', code: 'loan:ask' });
    expect(regionActs(asked).map((r) => r.code)).not.toContain('loan:ask');
  });

  it('repaid: nothing vests, at Heat 8 or on the Reckoning\'s first morning', () => {
    const t = go(offered(), { type: 'regionAct', code: 'loan:take' });
    const paid = go(t, { type: 'regionAct', code: 'loan:repay' });
    expect(paid.region.l3!.loan!.repaid).toBe(true);
    const front = { id: 'f1', kind: 'front', cardId: 'x' } as unknown as EvilModeBlock['economy']['running'][number];
    const hot = { ...paid, team: { ...paid.team, heat: 10 }, economy: { ...paid.economy, running: [front] }, evening: [] };
    expect(loanVested(l3Evening(hot))).toBe(false);
    const reck = { ...hot, here: { ...hot.here, stage: 8, beat: 'morning' as const }, district: { ...hot.district!, from: hot.here.day } };
    expect(loanVested(l3Morning(reck))).toBe(false);
    // Still owed on the Reckoning's first morning: called in that day.
    const owing = { ...t, economy: { ...t.economy, running: [front] }, here: { ...t.here, stage: 8, beat: 'morning' as const }, district: { ...t.district!, from: t.here.day } };
    expect(loanVested(l3Morning(owing))).toBe(true);
  });

  it('declined, or outside Galar, nothing rings', () => {
    const no = go(offered(), { type: 'regionAct', code: 'loan:no' });
    expect(no.region.l3!.offered).toBe('declined');
    expect(regionActs(no).map((r) => r.code)).not.toContain('loan:take');
    let k = at('kanto', 1, 'loan-k');
    for (let i = 0; i < 12; i++) k = go(k, { type: BEAT_END[k.here.beat] });
    expect(k.region.l3?.offered ?? null).toBeNull();
  });
});

describe('Alola: a guardian\'s regard (Part 26c section 1.3)', () => {
  const withShrine = (mood: Holding['mood'], seed = 'shrine'): EvilModeBlock => {
    const b = toBeat(at('alola', 2, seed), 'evening');
    const d = b.district!;
    return { ...b, district: { ...d, holdings: d.holdings.map((h) => (h.kind === 'shrine' ? { ...h, mood } : h)) } };
  };

  it('Sullen puts −10% on every job on the island and says why; Easy and Warm put nothing', () => {
    const s = withShrine('sullen');
    expect(shrineTerms(s)).toEqual([{ label: L3.shrine.odds, value: L3.shrine.sullenOdds }]);
    expect(activeMods(s).some((m) => m.from === 'The island' && m.mod.add === -10)).toBe(true);
    expect(shrineTerms(withShrine('easy'))).toEqual([]);
    expect(shrineTerms(withShrine('warm'))).toEqual([]);
  });

  it('a Take on the island cools it; at Shut the guardian comes, once an island, and the regard is Wary', () => {
    const s = withShrine('sullen');
    const took = { ...s, evening: [], log: [...s.log, { id: 'Lx', day: s.here.day, kind: 'job', method: 'take', result: 'went', region: s.district!.region, district: s.district!.n, who: [], text: 'took' }] } as unknown as EvilModeBlock;
    const e = l3Evening(took);
    expect(e.district!.holdings.find((h) => h.kind === 'shrine')!.mood).toBe('wary');
    expect(e.evening).toEqual(expect.arrayContaining([L3.shrine.comes, L3.shrine.after]));
    const island = L3.shrine.islands[s.district!.n]!;
    expect(e.region.l3!.guardian).toEqual([island]);
    // The same island again: it doesn't come twice.
    const again = l3Evening({ ...took, region: { ...took.region, l3: { ...EMPTY_L3, guardian: [island] } } });
    expect(again.evening).not.toContain(L3.shrine.comes);
    expect(again.district!.holdings.find((h) => h.kind === 'shrine')!.mood).toBe('shut');
  });
});

describe('Alola: Aether and the girl with the bag', () => {
  it('Aether is one conversation with three words; telling Lusamine asks if you\'re sure, and costs every Kind one', () => {
    const b = toBeat(at('alola', L3.aether.stage + 1, 'aether'), 'inPerson');
    expect(regionActs(b).filter((r) => r.code.startsWith('aether:'))).toHaveLength(3);
    const a = go(b, { type: 'regionAct', code: 'aether:1' });
    expect(a.region.l3!.aether).toBe('apart');
    expect(regionActs(a).some((r) => r.code.startsWith('aether:'))).toBe(false);
    const g = toBeat(at('alola', L3.bag.stage + 1, 'bag'), 'inPerson');
    const kind = { ...g, crew: g.crew.map((c, i) => (i === 0 ? { ...c, flaw: 'kind' as const, loyalty: 6 } : c)) };
    const ask = go(kind, { type: 'regionAct', code: 'bag:tell' });
    expect(ask.region.l3!.bag).toBeNull();
    expect(regionActs(ask).map((r) => r.code)).toEqual(expect.arrayContaining(['bag:sure', 'bag:back']));
    const told = go(ask, { type: 'regionAct', code: 'bag:sure' });
    expect(told.region.l3!.bag).toBe('told');
    expect(told.crew[0]!.loyalty).toBeLessThan(6);
    const bridge = go(kind, { type: 'regionAct', code: 'bag:bridge' });
    expect(bridge.region.l3!.bag).toBe('bridge');
    expect(bridge.crew[0]!.loyalty).toBe(6);
  });
});

describe('a region of each, played and replayed', () => {
  for (const id of NEW) {
    it(`${id}: the autoplayer plays it to its end; the actions replay to the same block; the save reloads`, () => {
      const b0 = foundForPlay(`play-${id}`, choice({ region: id }));
      const p = playRegion(b0, 'mix');
      expect(p.block.region.phase).toBe('over');
      expect(replay(b0, p.actions)).toEqual(p.block);
      expect(reload(p.block)).toEqual(p.block);
    });
  }
});
