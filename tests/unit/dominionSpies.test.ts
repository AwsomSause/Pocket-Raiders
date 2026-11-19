// DOMINION slice D22: spies on the crew (CLAUDE_API_DRAFT.md §5.3 C; BUILD_SLICES.md D22; mockup a6/k6) and the
// Plant a Mole Boss action (BUILD_SLICES.md Follow-ups).
import { describe, expect, it } from 'vitest';
import { crewOf, withCrew } from '../../src/core/dominion/crew';
import { DOMINION_DATA } from '../../src/core/dominion/data';
import { actionDef, actionStatus, card as cardOf } from '../../src/core/dominion/field';
import { beginDominionFight } from '../../src/core/dominion/fight';
import { endDominionFight } from '../../src/core/dominion/fightEnd';
import { fileModel } from '../../src/core/dominion/crewScreens';
import { planSeen, rivalsOf, withRivals } from '../../src/core/dominion/rivals';
import { DOMINION_MODE_ID, startInRun, stepInRun } from '../../src/core/dominion/session';
import {
  accuse, askSpy, cantConfront, cleanTyped, dropTalk, endWeights, isDouble, isMole, moleCandidate, pickWeight, plantMole, spiesOf, spyStep,
  startConfront, syncMoles, talkRoll, withSpies,
} from '../../src/core/dominion/spies';
import { spyCallId, spyModel } from '../../src/core/dominion/spyScreens';
import { DominionBlockSchema, type Card, type DominionAction, type DominionBlock, type Member } from '../../src/core/dominion/schema';
import { spyView } from '../../src/ui/redux/screens/dominion/spy';
import { STANDARD_CHOICE } from '../../src/core/rules';
import { chooseStarter, createRun } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import { SaveManager } from '../../src/save/saveManager';
import { MemoryStorageProvider } from '../../src/save/storage';
import { content } from './helpers';

const SP = DOMINION_DATA.spies;
const T = 'rocket';
const domRun = (seed: string): RunState => chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red', rules: { ...STANDARD_CHOICE, modeId: DOMINION_MODE_ID } }), 0);
const started = (seed = 'd22'): RunState => {
  const out = startInRun(content, domRun(seed), { types: ['poison', 'dark'], member: 'grunt', look: 0 });
  expect(out.problem).toBeNull();
  return stepInRun(content, out.run, { t: 'open' }).run;
};
const blk = (r: RunState): DominionBlock => r.expansion!.dominion!;
const card = (a: string, b: string): Card => ({ t: [a, b], q: 'listen', w: 'a quiet life', f: 'Gyarados', h: 'Pallet Town' });
type Full = DominionBlock & { spies: NonNullable<DominionBlock['spies']>; rivals: NonNullable<DominionBlock['rivals']> };
/** The started block with a second member and the rivals and spies filled in. */
const base = (seed = 'd22'): Full => {
  const b = withSpies(withRivals(withCrew(structuredClone(blk(started(seed))))));
  addMember(b, 'm2');
  return b as Full;
};
const addMember = (b: DominionBlock, id: string, traits: [string, string] = ['joker', 'kind'], loyalty = 50): Member => {
  const m = structuredClone(b.members[0]!);
  m.id = id;
  m.name = `Rook ${id}`;
  m.loyalty = loyalty;
  m.joinedDay = 1;
  crewOf(m).card = card(...traits);
  crewOf(m).out = null;
  b.members.push(m);
  return m;
};
const mole = (b: Full, id: string, extra: Partial<Full['spies']['moles'][number]> = {}): void => {
  b.spies.moles.push({ member: id, team: T, day: b.day, turned: false, exposed: false, ...extra });
  b.rivals.teams[T]!.spies = b.spies.moles.filter((x) => !x.turned && !x.exposed).length;
};
const suspect = (b: Full, id: string, n = 60): void => void (b.spies.sus[id] = n);
const asRun = (r: RunState, b: DominionBlock): RunState => ({ ...r, expansion: { ...r.expansion, dominion: DominionBlockSchema.parse(b) } });
const ok = (out: { ok: boolean; notice: string | null; block: DominionBlock }): DominionBlock => {
  expect(out.ok, out.notice ?? '').toBe(true);
  return out.block;
};
const words = (o: unknown): string[] => (typeof o === 'string' ? [o] : Array.isArray(o) ? o.flatMap(words) : o && typeof o === 'object' ? Object.entries(o).filter(([k]) => k !== '_source' && k !== 'system').flatMap(([, v]) => words(v)) : []);

describe('DOMINION D22: the data', () => {
  it('parses; four quick questions plus typed; three tells; four endings; no "Claude" or "AI" for the player', () => {
    expect(SP.questions.map((q) => q.id)).toEqual(['evidence', 'probe', 'bribe', 'threaten', 'typed']);
    expect(Object.keys(SP.tells).sort()).toEqual(['contradiction', 'nervous', 'rehearsed']);
    expect(Object.keys(SP.ends).sort()).toEqual(['battle', 'confess', 'double', 'run']);
    expect(SP.pool.length).toBeGreaterThanOrEqual(15);
    for (const s of words(SP)) {
      expect(s).not.toMatch(/Claude/);
      expect(s).not.toMatch(/\bAI\b|\bAi\b/);
    }
  });
  it('the D19 spy effects are live now (Loyal, Greedy, Gossip)', () => {
    const fx = DOMINION_DATA.personality.traits.flatMap((t) => t.effects.filter((e) => e.spy).map((e) => [t.id, e.spy, e.needs ?? null]));
    expect(fx).toEqual([['loyal', 'noBribe', null], ['greedy', 'bribe', null], ['gossip', 'leak', null]]);
  });
});

describe('DOMINION D22: who a rival buys', () => {
  it('Loyal is never picked; Greedy is the easiest; low Loyalty and new faces add (boundary at 40)', () => {
    const b = base();
    const m = b.members[1]!;
    crewOf(m).card = card('loyal', 'joker');
    expect(pickWeight(b, m)).toBe(0);
    crewOf(m).card = card('joker', 'kind');
    m.loyalty = 40;
    const plain = pickWeight(b, m);
    m.loyalty = 39;
    expect(pickWeight(b, m)).toBe(plain + SP.pick.lowLoyalty);
    crewOf(m).card = card('greedy', 'kind');
    m.loyalty = 40;
    expect(pickWeight(b, m)).toBe(plain + SP.pick.traits.greedy!);
  });
  it('a new rival spy buys a member (same seed, same pick); none to buy leaves the count abstract', () => {
    const pick = (): string => {
      const b = base('pick');
      addMember(b, 'm3', ['greedy', 'joker']);
      b.rivals.teams[T]!.spies = 1;
      const out: string[] = [];
      syncMoles(b, 'pick', out);
      expect(out[0]).toContain('Team Rocket');
      expect(b.spies.moles).toHaveLength(1);
      return b.spies.moles[0]!.member;
    };
    expect(pick()).toBe(pick());
    const b = base();
    for (const m of b.members) crewOf(m).card = card('loyal', 'kind');
    b.rivals.teams[T]!.spies = 2;
    syncMoles(b, 'x', []);
    expect(b.spies.moles).toHaveLength(0);
  });
  it('a counter-spy taking their count down exposes the most suspected mole at Suspicion 100', () => {
    const b = base();
    addMember(b, 'm3');
    mole(b, 'm2');
    mole(b, 'm3');
    suspect(b, 'm2', 20);
    suspect(b, 'm3', 55);
    b.rivals.teams[T]!.spies = 1;
    const out: string[] = [];
    syncMoles(b, 's', out);
    expect(b.spies.moles.find((x) => x.member === 'm3')!.exposed).toBe(true);
    expect(b.spies.sus.m3).toBe(100);
    expect(out[0]).toContain('Rook m3');
  });
});

describe('DOMINION D22: the World Turn', () => {
  it('a mole leaves clues far more often than an innocent member; the same seed gives the same night', () => {
    const b = base('clue');
    addMember(b, 'm3');
    mole(b, 'm2');
    for (let d = 0; d < 20; d++) {
      b.day += 1;
      spyStep(b, 'clue');
    }
    expect(b.spies.sus.m2 ?? 0).toBeGreaterThan(b.spies.sus.m3 ?? 0);
    expect(b.spies.clues.some((c) => c.member === 'm2')).toBe(true);
    expect(b.spies.sus.m2).toBeGreaterThanOrEqual(SP.suspicion.confrontAt);
    const again = base('clue');
    addMember(again, 'm3');
    mole(again as Full, 'm2');
    for (let d = 0; d < 20; d++) {
      again.day += 1;
      spyStep(again, 'clue');
    }
    expect(again.spies).toEqual(b.spies);
  });
  it('the clue raises the Morning alert once Suspicion reaches 40', () => {
    const b = base('alert');
    mole(b, 'm2');
    suspect(b, 'm2', 39);
    for (let d = 0; d < 10 && (b.spies.sus.m2 ?? 0) < 40; d++) {
      b.day += 1;
      spyStep(b, 'alert');
    }
    expect(b.crew!.alerts.some((a) => a.text.includes('Rook m2') && a.text.includes('F on the Crew File'))).toBe(true);
  });
  it('a Gossip leaks to a live mole\'s team; a double agent feeds them fake plans', () => {
    const b = base();
    addMember(b, 'm3', ['gossip', 'joker']);
    mole(b, 'm2');
    const t = b.rivals.teams[T]!;
    t.intel = 10;
    const lines = spyStep(b, 'g');
    expect(t.intel).toBe(10 + SP.clues.gossipIntel);
    expect(lines.some((l) => l.includes('Rook m3 talks too much'))).toBe(true);
    b.spies.moles[0]!.turned = true;
    const before = t.intel;
    spyStep(b, 'g2');
    expect(t.intel).toBe(before - SP.effects.doubleIntel);
  });
});

describe('DOMINION D22: the Confront talk', () => {
  it('only at Suspicion 40+, once a day, not while out or already turned', () => {
    const b = base();
    suspect(b, 'm2', 39);
    expect(cantConfront(b, 'm2')).toContain('40');
    suspect(b, 'm2', 40);
    expect(cantConfront(b, 'm2')).toBeNull();
    crewOf(b.members[1]!).out = { why: 'hurt', days: 2 };
    expect(cantConfront(b, 'm2')).toContain('is out');
    crewOf(b.members[1]!).out = null;
    b.spies.done.push({ member: 'x', name: 'X', day: b.day, end: 'dropped' });
    expect(cantConfront(b, 'm2')).toContain('One confront a day');
    expect(startConfront(b, 'm2').ok).toBe(false);
  });
  it('questions add pressure; a bribe costs ₽ once; a threat costs Loyalty; four turns, then no more', () => {
    let b: DominionBlock = base();
    suspect(b as Full, 'm2');
    b.funds = 1000;
    b = ok(startConfront(b, 'm2'));
    b = ok(askSpy(b, 'bribe', 's'));
    expect(b.funds).toBe(1000 - SP.talk.bribe);
    expect(askSpy(b, 'bribe', 's').notice).toBe(SP.lines.bribedOnce);
    const loy = b.members[1]!.loyalty;
    b = ok(askSpy(b, 'threaten', 's'));
    expect(b.members[1]!.loyalty).toBe(loy + SP.talk.threatLoyalty);
    b = ok(askSpy(b, 'evidence', 's'));
    b = ok(askSpy(b, 'typed', 's', '  Where were you\u0007 on Day 9?  '));
    const t = spiesOf(b).talk!;
    expect(t.turns.map((x) => x.q)).toEqual(['bribe', 'threaten', 'evidence', 'typed']);
    expect(t.turns[3]!.said).toBe('Where were you on Day 9?');
    expect(t.pressure).toBe(6 + 25 + 20 + 10);
    expect(askSpy(b, 'probe', 's').notice).toBe(SP.lines.noTurns);
  });
  it('failure cases: no talk, an empty typed line, no money for the bribe', () => {
    const b0 = base();
    expect(askSpy(b0, 'probe', 's').ok).toBe(false);
    suspect(b0, 'm2');
    let b = ok(startConfront(b0, 'm2'));
    expect(askSpy(b, 'typed', 's', '   ').ok).toBe(false);
    b = { ...b, funds: SP.talk.bribe - 1 };
    expect(askSpy(b, 'bribe', 's').notice).toContain(String(SP.talk.bribe));
    expect(cleanTyped('x'.repeat(500))).toHaveLength(SP.talk.typedMax);
  });
  it('replies and tells come from the rules: same seed, same reply; an innocent only ever looks nervous', () => {
    const b = base();
    expect(talkRoll(b, 's', 'm2', 'probe', 0)).toEqual(talkRoll(b, 's', 'm2', 'probe', 0));
    for (let i = 0; i < 40; i++) {
      const r = talkRoll(b, `s${i}`, 'm2', 'threaten', i);
      if (r.tell) expect(SP.innocentTells).toContain(r.tell);
      expect(SP.questions.find((q) => q.id === 'threaten')!.lines.innocent.some((l) => r.reply.toLowerCase().includes(l.slice(1, 12).toLowerCase()))).toBe(true);
    }
    mole(b, 'm2');
    const tells = new Set(Array.from({ length: 60 }, (_, i) => talkRoll(b, `m${i}`, 'm2', 'threaten', i).tell));
    expect(tells.has('rehearsed') || tells.has('contradiction')).toBe(true);
  });
  it('walking out before asking costs nothing; letting it go after asking lowers Suspicion by 15', () => {
    const b0 = base();
    suspect(b0, 'm2', 60);
    let b = ok(startConfront(b0, 'm2'));
    b = ok(dropTalk(b));
    expect(spiesOf(b).talk).toBeNull();
    expect(spiesOf(b).done).toHaveLength(0);
    b = ok(startConfront(b, 'm2'));
    b = ok(askSpy(b, 'probe', 's'));
    const out = dropTalk(b);
    expect(out.notice).toContain('15');
    expect(spiesOf(out.block).sus.m2).toBe(45);
  });
});

describe('DOMINION D22: the endings', () => {
  it('accusing an innocent member: cleared, Loyalty −15, Morale −10, the crew −2, Suspicion 0', () => {
    const b0 = base();
    suspect(b0, 'm2');
    const m = b0.members[1]!;
    const [loy, mor, other] = [m.loyalty, m.morale, b0.members[0]!.morale];
    const out = accuse(ok(startConfront(b0, 'm2')), 's');
    const b = out.block;
    expect(out.notice).toContain('was clean');
    expect(b.members[1]!.loyalty).toBe(loy - 15);
    expect(b.members[1]!.morale).toBe(Math.max(0, mor - 10));
    expect(b.members[0]!.morale).toBe(Math.max(0, other - 2));
    expect(spiesOf(b).sus.m2).toBe(0);
    expect(spiesOf(b).done.at(-1)!.end).toBe('cleared');
  });
  it('weights: a Coward under pressure confesses; a bribe to a Greedy mole buys a double agent; no Pokémon, no battle', () => {
    const b = base();
    mole(b, 'm2');
    const m = b.members[1]!;
    crewOf(m).card = card('coward', 'kind');
    b.spies.talk = { member: 'm2', day: b.day, turns: [], pressure: 80, bribed: false };
    const w = endWeights(b, m);
    expect(w.confess).toBeGreaterThan(w.battle + w.double);
    crewOf(m).card = card('greedy', 'joker');
    b.spies.talk.bribed = true;
    const g = endWeights(b, m);
    crewOf(m).card = card('joker', 'kind');
    expect(g.double).toBe(endWeights(b, m).double + SP.traitEnds.greedy!.double! - SP.traitEnds.joker!.double! + SP.bribeDouble + SP.traitEnds.joker!.double!);
    m.team = [];
    expect(endWeights(b, m).battle).toBe(0);
  });
  it('every ending happens and does what it says', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 80 && seen.size < 4; i++) {
      const b0 = base(`end${i}`);
      mole(b0, 'm2');
      suspect(b0, 'm2');
      b0.rivals.teams[T]!.intel = 30;
      const out = accuse(ok(startConfront(b0, 'm2')), `end${i}`);
      const b = out.block;
      const end = spiesOf(b).done.at(-1)!.end;
      seen.add(end);
      const t = rivalsOf(b).teams[T]!;
      if (end === 'confess') {
        expect(t.spies).toBe(0);
        expect(t.intel).toBe(30 - SP.effects.confessIntel);
        expect(planSeen(b, T)).toBe(true);
        expect(isMole(b, 'm2')).toBe(false);
      } else if (end === 'double') {
        expect(isDouble(b, 'm2')).toBe(true);
        expect(rivalsOf(b).mySpies.some((x) => x.member === 'm2')).toBe(true);
        expect(t.spies).toBe(0);
      } else if (end === 'run') {
        expect(b.members.some((x) => x.id === 'm2')).toBe(false);
        expect(t.intel).toBe(30 + SP.effects.runIntel);
      } else {
        expect(out.fight).toBe(true);
        expect(b.field.fight).toMatchObject({ why: 'spy', foe: 'member', target: 'm2', racket: T });
      }
    }
    expect([...seen].sort()).toEqual(['battle', 'confess', 'double', 'run']);
  });
  it('the battle: their own team; win and they are thrown out, lose and they get away', () => {
    let found: RunState | null = null;
    for (let i = 0; i < 80 && !found; i++) {
      const r = started(`bat${i}`);
      const b0 = base(`bat${i}`);
      mole(b0, 'm2');
      suspect(b0, 'm2');
      const out = accuse(ok(startConfront(b0, 'm2')), `bat${i}`);
      if (out.fight) found = asRun(r, out.block);
    }
    expect(found).not.toBeNull();
    const fight = beginDominionFight(content, found!)!;
    expect(fight.battle!.trainer).toMatchObject({ name: 'Rook m2' });
    const won = structuredClone(fight);
    const lines = endDominionFight(content, won, 'win');
    expect(lines.join(' ')).toContain('thrown out');
    expect(blk(won).members.some((x) => x.id === 'm2')).toBe(false);
    expect(rivalsOf(blk(won)).teams[T]!.spies).toBe(0);
    const lost = structuredClone(fight);
    const intel = rivalsOf(blk(lost)).teams[T]!.intel;
    endDominionFight(content, lost, 'lose');
    expect(blk(lost).members.some((x) => x.id === 'm2')).toBe(false);
    expect(rivalsOf(blk(lost)).teams[T]!.intel).toBe(Math.min(100, intel + SP.effects.runIntel));
  });
});

describe('DOMINION D22: Plant a Mole (Boss action 54)', () => {
  it('is played now; needs a free member of rank 2+; puts the best Charm + Stealth inside the rival team', () => {
    expect(actionStatus(actionDef('plant-a-mole')!).play).toBe(true);
    const b = base();
    const best = b.members[1]!;
    best.stats.charm += 5;
    expect(moleCandidate(b)!.id).toBe(best.id);
    for (const m of b.members) m.rank = 'hopeful';
    expect(moleCandidate(b)).toBeNull();
  });
  it('the Card opens it; a won action puts them inside (a big one reads the plan); the gate says why when nobody can go', () => {
    const r0 = started('plant');
    let b = base('plant');
    const r = asRun(r0, b);
    const c = cardOf(blk(r), r, 'plant-a-mole', null, blk(r).field.at);
    expect(c).toBeTruthy();
    expect(JSON.stringify(c)).not.toContain(SP.lines.noMole!);
    const id = moleCandidate(b)!.id;
    expect(plantMole(b, false)[0]).toContain('inside Team Rocket');
    expect(rivalsOf(b).mySpies.map((x) => x.member)).toEqual([id]);
    expect(planSeen(b, T)).toBe(true); // a spy inside shows the plan (D9)
    b = base('plant');
    expect(plantMole(b, true)[0]).toContain('this week\'s plan');
    expect(b.flags.some((f) => f.startsWith(`plan:${T}:`))).toBe(true);
    for (const m of b.members) m.rank = 'hopeful';
    expect(plantMole(b, false)).toEqual([]);
    b.phase = 'night';
    b.nightActions = 1;
    const shut = asRun(r0, b);
    expect(JSON.stringify(cardOf(blk(shut), shut, 'plant-a-mole', null, blk(shut).field.at))).toContain(SP.lines.noMole!);
  });
});

describe('DOMINION D22: screens, saves and the whole run', () => {
  it('the Crew File shows Suspicion and the F key at 40+', () => {
    const b = base();
    suspect(b, 'm2', 72);
    const f = fileModel(b, 1);
    expect(f.suspicion).toBe(72);
    expect(f.keys[0]).toEqual({ key: 'F', label: 'Confront' });
    suspect(b, 'm2', 10);
    expect(fileModel(b, 1).keys.some((k) => k.key === 'F')).toBe(false);
  });
  it('the Confront model: offline reply and the rules\' tell; a stored Rotom reply replaces a typed turn\'s reply', () => {
    const b0 = base();
    suspect(b0, 'm2', 78);
    let b = ok(startConfront(b0, 'm2'));
    b = ok(askSpy(b, 'typed', 's', "Who's R?"));
    const turn = spiesOf(b).talk!.turns[0]!;
    const off = spyModel(b, {})!;
    expect(off.turns[0]).toMatchObject({ you: "Who's R?", them: turn.reply, rotom: false });
    expect(off.level).toBe('high');
    expect(off.ends.map((e) => e.id)).toEqual(['confess', 'double', 'run', 'battle']);
    const on = spyModel(b, { [spyCallId('m2', b.day, 0)]: { s: 'ai', v: { reply: 'R? Could be anyone.' }, m: 'haiku' } })!;
    expect(on.turns[0]).toMatchObject({ them: 'R? Could be anyone.', rotom: true });
    expect(on.chip).toMatch(/^Quick · tell: /);
    const html = spyView(on, '', 0, null);
    for (const id of ['dom-spy-sus', 'dom-spy-talk', 'dom-spy-type', 'dom-spy-accuse', 'dom-spy-end-double', 'dom-spy-chip']) expect(html).toContain(id);
    const text = html.replace(/<[^>]+>/g, ' ');
    expect(text).not.toMatch(/Claude|\bAI\b/);
  });
  it('save and reload mid-talk and with moles: the same block; an old block without `spies` loads', () => {
    const r = started('save');
    const b0 = base('save');
    mole(b0, 'm2');
    suspect(b0, 'm2');
    let b = ok(startConfront(b0, 'm2'));
    b = ok(askSpy(b, 'probe', 'save'));
    const run = asRun(r, b);
    const storage = new MemoryStorageProvider();
    new SaveManager(storage, content).saveRun(run);
    const loaded = new SaveManager(storage, content).loadRun();
    expect(loaded.status).toBe('ok');
    if (loaded.status !== 'ok') return;
    expect(loaded.data).toEqual(run);
    const old = structuredClone(blk(r));
    delete old.spies;
    expect(DominionBlockSchema.safeParse(old).success).toBe(true);
    const bad = structuredClone(b) as DominionBlock;
    bad.spies!.sus.m2 = 140;
    expect(DominionBlockSchema.safeParse(bad).success).toBe(false);
  });
  it('through the session: a rival spy comes, nights pass, the player confronts and accuses (deterministic)', () => {
    const play = (): DominionBlock => {
      let r = started('whole');
      const b = base('whole');
      b.rivals.teams[T]!.spies = 1;
      r = asRun(r, b);
      const go = (a: DominionAction): void => {
        const out = stepInRun(content, r, a);
        if (out.ok) r = out.run;
      };
      for (let i = 0; i < 12; i++) {
        go({ t: 'toNight' });
        go({ t: 'rest' });
        while (blk(r).crew?.talks.length) go({ t: 'talk', choice: 0 });
        go({ t: 'toDay' });
        go({ t: 'endDay' });
      }
      const top = Object.entries(spiesOf(blk(r)).sus).sort((x, y) => y[1] - x[1])[0];
      if (top && top[1] >= 40) {
        go({ t: 'spyStart', member: top[0] });
        go({ t: 'spyAsk', q: 'evidence' });
        go({ t: 'spyAccuse' });
      }
      return blk(r);
    };
    const a = play();
    expect(spiesOf(a).moles.length + spiesOf(a).done.length).toBeGreaterThan(0);
    expect(play()).toEqual(a);
  });
});
