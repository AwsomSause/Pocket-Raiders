// DOMINION D16: Team Snagem and Team Cipher (Part 4 §9, Part 9 A23, A14), the Partnership page, the two Chair cards, the
// Charters (Part 0 §6.1 Q4: optional, locked until one finished Dominion run) and the Turn (a main-game run that won
// carries on with one Grunt). Normal, boundary and failure cases; save/reload; old blocks unchanged.
import { describe, expect, it } from 'vitest';
import { chairHookOf, freshChair } from '../../src/core/dominion/chair';
import { applyCharter, charterProblem, chartersOpen, dominionFinished, domTurnOffer, domTurnRun, TURN_FLAG } from '../../src/core/dominion/charters';
import { withCrew } from '../../src/core/dominion/crew';
import { DOMINION_DATA, setActiveRegion } from '../../src/core/dominion/data';
import { empireOf } from '../../src/core/dominion/book';
import { stepById } from '../../src/core/dominion/empire';
import { buyout, buyoutPrice, cancel, machineProblem, partnerSide, purge, settlePartners, shadowOne, sign, signProblem, snagsThisFight } from '../../src/core/dominion/partners';
import { partnersModel, partnersOpen } from '../../src/core/dominion/partnersScreens';
import { charterRows, openingLines } from '../../src/core/dominion/screens';
import { DominionBlockSchema, type DominionAction, type DominionBlock } from '../../src/core/dominion/schema';
import { dominionBlock, DOMINION_MODE_ID, startInRun, stepInRun } from '../../src/core/dominion/session';
import { runWorldTurn } from '../../src/core/dominion/worldTurn';
import { STANDARD_CHOICE } from '../../src/core/rules';
import { chooseStarter, createRun } from '../../src/core/run';
import { createProfile } from '../../src/core/profile';
import { ProfileSchema, type RunState } from '../../src/core/state';
import { SaveManager } from '../../src/save/saveManager';
import { MemoryStorageProvider } from '../../src/save/storage';
import { content } from './helpers';

const P = DOMINION_DATA.partners;
const domRun = (seed: string): RunState => chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red', rules: { ...STANDARD_CHOICE, modeId: DOMINION_MODE_ID } }), 0);
const started = (seed = 'd16'): RunState => {
  setActiveRegion('kanto');
  const out = startInRun(content, domRun(seed), { types: ['poison', 'dark'], member: 'grunt', look: 0 });
  expect(out.problem).toBeNull();
  const r = structuredClone(stepInRun(content, out.run, { t: 'open' }).run);
  r.expansion!.dominion!.chair = { ...freshChair(), opts: { length: 'off', numbers: 'arrows', speed: 'normal' } };
  return r;
};
const blk = (r: RunState): DominionBlock => r.expansion!.dominion!;
const edit = (r: RunState, f: (b: DominionBlock, r: RunState) => void): RunState => {
  const out = structuredClone(r);
  const b = withCrew(out.expansion!.dominion!);
  f(b, out);
  return { ...out, expansion: { ...out.expansion, dominion: DominionBlockSchema.parse(b) } };
};
/** A Syndicate (the peak that opens the deals), with money and a Reserve worth taking from. */
const syndicate = (seed = 'd16'): RunState => edit(started(seed), (b) => {
  empireOf(b).peak = stepById(P.opensAt);
  b.funds = 40000;
});
const go = (r: RunState, a: DominionAction): RunState => {
  const out = stepInRun(content, r, a);
  expect(out.ok, `${a.t}: ${out.notice}`).toBe(true);
  return out.run;
};

describe('D16 data', () => {
  it('two partners, fifteen actions with a status each, two deal rooms, nine Charters', () => {
    expect(P.order).toEqual(['snagem', 'cipher']);
    expect(Object.keys(P.play)).toHaveLength(15);
    for (const id of Object.keys(P.play)) expect(P.status[id], id).toBeDefined();
    expect(DOMINION_DATA.buildings.filter((x) => x.deal).map((x) => x.deal).sort()).toEqual(['cipher', 'snagem']);
    expect(DOMINION_DATA.charters.charters).toHaveLength(9);
    for (const c of DOMINION_DATA.charters.charters) expect(c.types.some((t) => t === 'dragon' || t === 'fairy'), c.id).toBe(false);
    expect(charterRows().every((c) => c.colours.every((h) => h.startsWith('#')))).toBe(true);
  });
});

describe('D16 deals', () => {
  it('no offer before Syndicate; an old block gets no partners object from the World Turn', () => {
    const r = started();
    const b = structuredClone(blk(r));
    expect(signProblem(b, 'snagem')).toMatch(/Syndicate/);
    runWorldTurn(b, r.seed);
    expect(b.partners).toBeUndefined();
    expect(partnersOpen(b)).toBe(false);
  });
  it('at Syndicate both are offered once in the Night Report', () => {
    const b = structuredClone(blk(syndicate()));
    const first = runWorldTurn(b, 'x');
    expect(first.filter((l) => l.includes('sends word'))).toHaveLength(2);
    expect(runWorldTurn(b, 'x').filter((l) => l.includes('sends word'))).toHaveLength(0);
    expect(b.partners!.offered).toEqual(['snagem', 'cipher']);
  });
  it('signing Snagem builds the Snag Desk and brings Snag Balls; signing twice fails', () => {
    let r = go(syndicate(), { t: 'partner', op: 'sign', id: 'snagem' });
    const b = blk(r);
    expect(b.partners!.deals.snagem!.cut).toBe(15);
    expect(b.hq!.rooms.some((x) => x.id === 'snag-desk')).toBe(true);
    expect(r.inventory['snag-ball']).toBe(P.teams.snagem.balls!.sign);
    const again = stepInRun(content, r, { t: 'partner', op: 'sign', id: 'snagem' });
    expect(again.ok).toBe(false);
    expect(again.notice).toMatch(/already/);
    r = go(r, { t: 'partner', op: 'sign', id: 'cipher' });
    expect(blk(r).hq!.rooms.some((x) => x.id === 'shadow-lab')).toBe(true);
  });
  it('payday takes the cut of the week income before wages, the best Pokémon weekly, and the feud rolls on its own stream', () => {
    const r = go(go(syndicate(), { t: 'partner', op: 'sign', id: 'snagem' }), { t: 'partner', op: 'sign', id: 'cipher' });
    const b = structuredClone(blk(r));
    b.day = 7;
    b.funds = 10000;
    empireOf(b).week = { jobs: 4000 };
    const boxBefore = b.reserve!.box.length;
    const lines = runWorldTurn(b, r.seed);
    expect(lines.some((l) => l.includes('Snagem took their 15%'))).toBe(true);
    expect(lines.some((l) => l.includes('Cipher took their 15%'))).toBe(true);
    expect(b.partners!.last.money).toEqual({ snagem: 600, cipher: 600 });
    expect(b.reserve!.box.length).toBeLessThan(boxBefore + 1);
    expect(b.partners!.last.feud).not.toBeNull();
    // Same seed and day, same feud.
    const b2 = structuredClone(blk(r));
    b2.day = 7;
    b2.funds = 10000;
    empireOf(b2).week = { jobs: 4000 };
    runWorldTurn(b2, r.seed);
    expect(b2.partners!.last.feud).toBe(b.partners!.last.feud);
  });
  it('the three ways out: buy-out (Snagem keeps the machine), cancel (loses it), purge starts a fight; no money fails', () => {
    const r = go(syndicate(), { t: 'partner', op: 'sign', id: 'snagem' });
    const poor = structuredClone(blk(r));
    poor.funds = 10;
    expect(buyout(poor, 'snagem').ok).toBe(false);
    const rich = structuredClone(blk(r));
    const price = buyoutPrice(rich, 'snagem');
    expect(price).toBe(P.teams.snagem.buyout.base);
    expect(buyout(rich, 'snagem').ok).toBe(true);
    expect(rich.partners!.kept).toEqual(['snagem']);
    expect(rich.hq!.rooms.some((x) => x.id === 'snag-desk')).toBe(true);
    expect(sign(rich, 'snagem').ok).toBe(false);
    const c = structuredClone(blk(r));
    expect(cancel(c, 'snagem').ok).toBe(true);
    expect(c.hq!.rooms.some((x) => x.id === 'snag-desk')).toBe(false);
    expect(c.partners!.inv['snag-ball']).toBeLessThan(0);
    const pg = structuredClone(blk(r));
    const out = purge(pg, 'snagem');
    expect(out.fight).toBe(true);
    expect(pg.field.fight?.why).toBe('partner');
    expect(partnerSide(pg, r)?.name).toBe('Snagem Thug');
    expect(cancel(structuredClone(blk(started())), 'cipher').ok).toBe(false);
  });
  it('the Shadow Machine closes a heart once a week (Trust 0), and only with Cipher', () => {
    const plain = structuredClone(started());
    expect(machineProblem(blk(plain))).toMatch(/Cipher/);
    const r = go(syndicate(), { t: 'partner', op: 'sign', id: 'cipher' });
    const uid = r.party[0]!.uid;
    const after = go(r, { t: 'partner', op: 'shadow', id: 'cipher', uid });
    expect(after.party[0]!.shadow).toBeTruthy();
    const twice = stepInRun(content, after, { t: 'partner', op: 'shadow', id: 'cipher', uid: after.party[1]!.uid });
    expect(twice.ok).toBe(false);
    expect(twice.notice).toMatch(/next week/);
  });
  it('the Snag Machine never reaches the Hero, a Legendary, the crew or a minor', () => {
    const r = go(syndicate(), { t: 'partner', op: 'sign', id: 'snagem' });
    const b = blk(r);
    expect(snagsThisFight(b, 'police', 'policeman')).toBe(true);
    for (const foe of ['hero', 'sidekick', 'legend', 'member'] as const) expect(snagsThisFight(b, foe, 'veteran'), foe).toBe(false);
    expect(snagsThisFight(b, 'police', DOMINION_DATA.snatch.minorClasses[0]!)).toBe(false);
    expect(snagsThisFight(blk(started()), 'police', 'policeman')).toBe(false);
  });
  it('Snag Balls the step moved reach the Bag and never go below zero', () => {
    const r = structuredClone(started());
    const b = blk(r);
    b.partners = { deals: {}, offered: [], ended: [], kept: [], met: {}, inv: { 'snag-ball': -5 }, used: 0, closed: false, purge: null, last: { day: 0, money: {}, mons: {}, feud: null }, due: [] };
    r.inventory = { ...r.inventory, 'snag-ball': 2 };
    settlePartners(content, r, b);
    expect(r.inventory['snag-ball']).toBeUndefined();
  });
  it("Looker's deal (Chair card 63) ends every deal for the run", () => {
    const r = go(syndicate(), { t: 'partner', op: 'sign', id: 'snagem' });
    const b = structuredClone(blk(r));
    chairHookOf('close-deals')!(b);
    expect(b.partners!.deals.snagem).toBeUndefined();
    expect(signProblem(b, 'cipher')).toMatch(/Looker/);
  });
  it('the Partnership page shows both terms, the rows and the both-deals warning', () => {
    const r = go(go(syndicate(), { t: 'partner', op: 'sign', id: 'snagem' }), { t: 'partner', op: 'sign', id: 'cipher' });
    const m = partnersModel(blk(r), r, 0, false);
    expect(m.cards.map((c) => c.state)).toEqual(['active', 'active']);
    expect(m.both).toMatch(/30%/);
    expect(m.rows.map((x) => x.id)).toContain('machine');
    expect(m.rows.map((x) => x.id)).toContain('purge-cipher');
    expect(partnersModel(blk(r), r, 0, true).rows.length).toBeGreaterThan(0);
  });
  it('saves and reloads with deals; a damaged deal fails the schema', () => {
    const r = go(syndicate(), { t: 'partner', op: 'sign', id: 'cipher' });
    const storage = new MemoryStorageProvider();
    new SaveManager(storage, content).saveRun(r);
    const loaded = new SaveManager(storage, content).loadRun();
    expect(loaded.status).toBe('ok');
    if (loaded.status !== 'ok') return;
    expect(dominionBlock(loaded.data)?.partners?.deals.cipher?.cut).toBe(15);
    const bad = structuredClone(blk(r)) as unknown as { partners: { deals: { cipher: { cut: number } } } };
    bad.partners.deals.cipher.cut = 400;
    expect(DominionBlockSchema.safeParse(bad).success).toBe(false);
  });
});

describe('D16 Charters', () => {
  it('locked until one finished Dominion run; the profile field defaults to none', () => {
    expect(chartersOpen(0)).toBe(false);
    expect(chartersOpen(1)).toBe(true);
    expect(charterProblem('rocket', 0)).toBe(DOMINION_DATA.charters.lockLine);
    expect(charterProblem('rocket', 1)).toBeNull();
    expect(charterProblem('nobody', 1)).toMatch(/closed/);
    const fresh = createProfile(content, 'p') as Record<string, unknown>;
    expect(fresh.dominionDone).toEqual([]);
    delete fresh.dominionDone;
    expect(ProfileSchema.parse(fresh).dominionDone).toEqual([]);
  });
  it('a Charter starts founded: its types, Patron, crew, money, HQ level and HQ district', () => {
    setActiveRegion('kanto');
    const c = DOMINION_DATA.charters.charters.find((x) => x.id === 'rocket')!;
    const out = startInRun(content, domRun('charter'), { types: ['fire', 'water'], member: 'grunt', look: 0, charter: 'rocket' });
    expect(out.problem).toBeNull();
    const b = blk(out.run);
    expect(b.types).toEqual(c.types);
    expect(b.team?.name).toBe(c.team);
    expect(b.members[0]!.name).toBe(c.patron.name);
    expect(b.members).toHaveLength(1 + c.grunts);
    expect(b.funds).toBe(c.funds);
    expect(b.hqLevel).toBe(c.hqLevel);
    expect(b.field.districts[DOMINION_DATA.field.hq]!.dread).toBe(c.dread);
    expect(b.origin).toEqual({ kind: 'charter', id: 'rocket' });
    expect(openingLines(b)).toEqual(c.opening);
    // Same seed, same crew.
    const again = blk(startInRun(content, domRun('charter'), { types: ['fire', 'water'], member: 'grunt', look: 0, charter: 'rocket' }).run);
    expect(again.members.map((m) => m.name)).toEqual(b.members.map((m) => m.name));
    expect(startInRun(content, domRun('charter'), { types: ['fire', 'water'], member: 'grunt', look: 0, charter: 'nobody' }).problem).toMatch(/closed/);
  });
  it('the normal start is unchanged (no origin, the warehouse opening)', () => {
    const b = blk(started());
    expect(b.origin).toBeUndefined();
    expect(openingLines(b)).toEqual(DOMINION_DATA.start.opening);
    expect(dominionFinished(b)).toBe(false);
  });
  it('applyCharter mutates a fresh block only by its own fields', () => {
    const r = started();
    const b = structuredClone(blk(r));
    applyCharter(content, r, b, DOMINION_DATA.charters.charters[8]!);
    expect(b.teamName).toBe(DOMINION_DATA.charters.charters[8]!.team);
  });
});

describe('D16 the Turn', () => {
  const won = (): RunState => {
    const r = chooseStarter(content, createRun(content, { runId: 'turn', seed: 'turn', archetypeId: 'red', rules: { ...STANDARD_CHOICE } }), 0);
    return { ...r, phase: 'over', victory: true, money: 9000, badges: ['boulder', 'cascade', 'thunder'] as never };
  };
  it('offered only for a main-game run that won, with Evil Mode shown, once', () => {
    expect(domTurnOffer(won(), false, DOMINION_MODE_ID)).toBeNull();
    expect(domTurnOffer({ ...won(), victory: false }, true, DOMINION_MODE_ID)).toBeNull();
    const o = domTurnOffer(won(), true, DOMINION_MODE_ID)!;
    expect(o.funds).toBe(DOMINION_DATA.charters.turn.fundsCap);
    expect(o.regard).toBe(3 * DOMINION_DATA.charters.turn.regardPerBadge);
  });
  it('taking it makes a Dominion run at setup; Begin gives one Grunt, the money and the Regard', () => {
    setActiveRegion('kanto');
    const t = domTurnRun(content, won(), DOMINION_MODE_ID)!;
    expect(t.rules.modeId).toBe(DOMINION_MODE_ID);
    expect(t.phase).toBe('map');
    expect(t.party).toHaveLength(1);
    expect(t.party[0]!.level).toBe(DOMINION_DATA.charters.turn.aceLevel);
    expect(domTurnOffer(t, true, DOMINION_MODE_ID)).toBeNull();
    const out = startInRun(content, t, { types: ['poison', 'dark'], member: 'admin', look: 2 });
    expect(out.problem).toBeNull();
    const b = blk(out.run);
    expect(b.members).toHaveLength(1);
    expect(b.members[0]!.rank).toBe('grunt');
    expect(b.funds).toBe(DOMINION_DATA.charters.turn.fundsCap);
    expect(b.field.districts[DOMINION_DATA.field.hq]!.regard).toBe(9);
    expect(out.run.story.flags[TURN_FLAG]).toBe('taken');
    expect(openingLines(b)).toEqual(DOMINION_DATA.charters.turn.opening);
  });
});
