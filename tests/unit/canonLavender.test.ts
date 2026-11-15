// Lavender Town canon spaces, as rebuilt from KANTO_PLACED_1.md (catalog overhaul, tools/events/co/kanto-canon-2.ts).
import { describe, expect, it } from 'vitest';
import { canonInterludeOf, addCanonStops } from '../../src/core/expansion/canonRun';
import { chooseEvent, conditionMet } from '../../src/core/events';
import { chooseStarter, createRun, debugForceEvent } from '../../src/core/run';
import { content } from './helpers';

const begin = (seed: string) => chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red', expansion: { kantoCanon: true } }), 0);
const room = (id: string) => content.events.get(id)!;
const P = 'cs-kanto-lavender-';
const targets = (id: string) => [...room(id).choices, ...room(id).remembers.flatMap((v) => v.addChoices)].flatMap((c) => [c.success, c.failure]).flatMap((o) => [...(o?.effects ?? []), ...(o?.battle?.win ?? [])]).flatMap((e) => (e.kind === 'addEvent' ? [e.eventId] : e.kind === 'addEventFrom' ? e.ids : []));
const play = (seed: string, id: string, choice: number, tweak?: (r: ReturnType<typeof begin>) => void) => {
  const base = begin(seed);
  tweak?.(base);
  const { run, sideId } = debugForceEvent(content, structuredClone(base), id);
  return chooseEvent(content, run, sideId, choice).run;
};
const heldCount = (run: ReturnType<typeof begin>, id: string) => (run.inventory[id] ?? 0) + (run.passives?.[id] ?? 0) + run.party.reduce((n, m) => n + (m.held?.[id] ?? 0), 0);
const joined = (run: ReturnType<typeof begin>, species: string) => run.party.find((m) => m.speciesId === species) ?? run.pending.flatMap((p) => (p.kind === 'caught' ? [p.mon] : [])).find((m) => m.speciesId === species);
const kantoSeeds = (() => { const out: string[] = []; for (let i = 0; out.length < 12 && i < 300; i++) if (begin(`LV${i}`).regionOrder[0] === 'kanto') out.push(`LV${i}`); return out; })();
const GATES = ['tower', 'fuji', 'fanclub', 'rocktunnel', 'powerplant', 'volunteers', 'prank'];

describe('Lavender canon: the event graph', () => {
  it('every room opens from a gate, and every target exists', () => {
    const ids = [...content.events.values()].filter((e) => e.id.startsWith(P) && !e.disabled).map((e) => e.id);
    for (const id of ids) for (const t of targets(id)) expect(content.events.has(t) && !content.events.get(t)!.disabled, `${id} -> ${t}`).toBe(true);
    const reach = new Set<string>(GATES.map((s) => `${P}${s}`));
    for (let again = true; again;) { again = false; for (const id of [...reach]) for (const t of targets(id)) if (!reach.has(t)) { reach.add(t); again = true; } }
    expect([...reach].sort()).toEqual(ids.sort());
  });
  it('the gates carry the catalog ids', () => {
    for (const s of GATES) expect(room(`${P}${s}`).canon).toBe(`cs.kanto.lavender.${s}`);
  });
  it('Pokémon Tower is seven floors: the graves, the unseen, the channelers, the wall, the prank (25%), the Marowak, the top', () => {
    expect(targets(`${P}tower`)).toEqual([`${P}tower-f1`]);
    expect(targets(`${P}tower-f1`)).toEqual([`${P}tower-f2`]);
    expect(targets(`${P}tower-f2`)).toEqual([`${P}tower-f3`, `${P}tower-f3`, `${P}tower-f3`]);
    expect(targets(`${P}tower-f3b`)).toEqual([`${P}tower-f4`]);
    // Floor 5 is a 25% draw (one Haunter among four), then the Marowak, then the top.
    const leave = room(`${P}tower-f4`).choices.at(-1)!.success.effects.find((e) => e.kind === 'addEventFrom') as { ids: string[] };
    expect(leave.ids.filter((x) => x === `${P}tower-f5`)).toHaveLength(1);
    expect(leave.ids).toHaveLength(4);
    expect(targets(`${P}tower-f5`)).toEqual([`${P}tower-f6`, `${P}tower-f6`]);
    expect(new Set(targets(`${P}tower-f6`))).toEqual(new Set([`${P}tower-f7`]));
  });
});

describe('Lavender in a run (the interlude between Stage 3 and Stage 4)', () => {
  it('Stage 4 is the stage that opens interlude-3; Stage 1 leaves interlude-0 to the Viridian code', () => {
    const run = begin('LV1');
    expect(canonInterludeOf(run)).toBeNull();
    run.stage!.index = 3;
    expect(canonInterludeOf(run)).toBe('interlude-3');
    run.stage!.index = 4;
    expect(canonInterludeOf(run)).toBeNull();
  });
  it('the Tower is always there and on every route (must-see); Rock Tunnel or the Power Plant, never both; every offered space has an event', () => {
    for (const seed of kantoSeeds) {
      const run = begin(seed);
      run.stage!.index = 3;
      run.expansion!.canon!.menus = {};
      addCanonStops(content, run);
      const menu = run.expansion!.canon!.menus['interlude-3']!;
      expect(menu[0]).toBe('cs.kanto.lavender.tower');
      expect(menu.filter((id) => ['rocktunnel', 'powerplant'].includes(id.split('.').pop()!)).length).toBeLessThanOrEqual(1);
      const placed = new Set(run.stage!.map.nodes.flatMap((n) => n.sides.map((s) => s.eventId)).filter((id) => id?.startsWith(P)));
      expect(placed.size).toBe(menu.length);
      const towerCols = new Set(run.stage!.map.nodes.filter((n) => n.sides.some((s) => s.eventId === `${P}tower`)).map((n) => n.column));
      expect(towerCols.size).toBe(1);
      const col = [...towerCols][0]!;
      expect(run.stage!.map.nodes.filter((n) => n.column === col).every((n) => n.sides.some((s) => s.eventId === `${P}tower`))).toBe(true);
    }
  });
});

describe('Pokémon Tower', () => {
  it('without the Silph Scope the unseen can only be fled; with it (or the prank Haunter) it can be fought', () => {
    const run = begin('PT');
    const [flee, scope, haunter] = room(`${P}tower-f2`).choices;
    expect(flee!.requires).toEqual([]);
    expect(flee!.success.battle).toBeUndefined();
    expect(conditionMet(content, run, scope!.requires[0]!)).toBe(false);
    expect(conditionMet(content, run, haunter!.requires[0]!)).toBe(false);
    run.inventory['silph-scope'] = 1;
    expect(conditionMet(content, run, scope!.requires[0]!)).toBe(true);
    expect(scope!.success.battle!.kind).toBe('wild');
  });
  it('the Marowak is a trainer (never catchable); stepping back starts it at -1 Attack; Cubone can go to it instead', () => {
    const [fight, back, cubone] = room(`${P}tower-f6`).choices;
    expect(fight!.success.battle!.kind).toBe('trainer');
    expect(back!.success.battle!.kind).toBe('trainer');
    expect((back!.success.battle as { rule?: { stages?: object } }).rule?.stages).toEqual({ atk: -1 });
    expect(cubone!.requires).toEqual([{ kind: 'partySpecies', species: 'cubone' }]);
    expect(cubone!.success.battle).toBeUndefined();
    expect(cubone!.success.effects).toContainEqual({ kind: 'item', id: 'thick-club', count: 1 });
  });
  it('the Memorial Wall answers flowers only for names the run has lost, three at most', () => {
    const run = begin('MW');
    const wall = room(`${P}tower-f4`);
    expect(wall.remembers[0]!.when).toEqual([{ kind: 'memorial', atLeast: 1 }]);
    const flower = wall.remembers[0]!.addChoices[0]!;
    expect(conditionMet(content, run, flower.requires[0]!)).toBe(false);
    run.nuzlocke = { areas: [], memorial: [{ uid: 'a', speciesId: 'rattata', level: 5, shiny: false, ace: false, area: 'x', cause: 'lost to Brock' }] };
    expect(conditionMet(content, run, flower.requires[0]!)).toBe(true);
    // Three flowers lead f4b -> f4c -> f4d, and f4d offers only "Walk on".
    expect(room(`${P}tower-f4d`).choices.map((c) => c.label)).toEqual(['Walk on.']);
  });
  it('the top pays the Silph Scope, the Tower Scroll and the story flags; a released Marowak adds Cubone with Lightning Rod and Bone Rush', () => {
    const kind = play('TF', `${P}tower-f7`, 0, (r) => { r.story.flags['ev:kanto-tower-marowak'] = 1; });
    expect(heldCount(kind, 'silph-scope')).toBe(1);
    expect(kind.story.flags['ev:kanto-tower-cleared']).toBe(1);
    expect(kind.story.flags['ev:xk-tower-cleansed']).toBe(1);
    const cubone = joined(kind, 'cubone')!;
    expect(cubone.fixedAbility).toBe('lightning-rod');
    expect(cubone.moves.some((m) => m.id === 'bone-rush')).toBe(true);
  });
});

describe('Fuji, Fan Club, Rock Tunnel, Power Plant, Volunteers, the Prank', () => {
  it("Mr. Fuji's house: adopt one of three, with the Poké Flute and Fuji's Blessing for the whole party", () => {
    expect(room(`${P}fuji`).choices.filter((c) => c.label.startsWith('"')).length).toBe(3);
    const out = play('FJ', `${P}fuji`, 1);
    expect(heldCount(out, 'poke-flute')).toBe(1);
    expect(out.pending.some((p) => p.kind === 'caught') || out.party.length > 1).toBe(true);
    expect(out.story.flags['ev:kanto-fuji-adopted']).toBe(1);
  });
  it('Fan Club: four times "Interrupt." beside "Keep listening."; listening to the end pays a Bike Voucher, interrupting a Poké Doll', () => {
    for (const n of [1, 2, 3, 4]) expect(room(`${P}fanclub-t${n}`).choices.map((c) => c.label)).toEqual(['Interrupt.', 'Keep listening.']);
    expect(room(`${P}fanclub-t4`).choices[1]!.success.effects).toContainEqual({ kind: 'item', id: 'bike-voucher', count: 1 });
    expect(room(`${P}fanclub-t2`).choices[0]!.success.effects).toContainEqual({ kind: 'item', id: 'poke-doll', count: 1 });
  });
  it('Rock Tunnel is five nodes; without light fights are blind (accuracy x0.9, hidden foe) and cannot be avoided', () => {
    const chain = [1, 2, 3, 4, 5].map((n) => `${P}rocktunnel-n${n}`);
    for (let i = 0; i < 4; i++) expect(targets(chain[i]!)).toContain(chain[i + 1]);
    const dark = room(chain[1]!).choices.at(-1)!;
    expect(dark.requires).toEqual([]);
    expect((dark.success.battle as { rule?: object }).rule).toEqual({ accuracyMult: 0.9, hiddenFoe: true });
    const run = begin('RT');
    expect(conditionMet(content, run, room(chain[1]!).choices[0]!.requires[0]!)).toBe(false);
    const end = play('RT', chain[4]!, 0, (r) => { r.story.flags['ev:kanto-rocktunnel-onix'] = 1; });
    expect(joined(end, 'onix')!.fixedAbility).toBe('sturdy');
  });
  it('Power Plant: five halls where a rocking item ball is a Voltorb or Electrode, then 40% Zapdos, 60% an Electrode horde', () => {
    for (const n of [1, 2, 3, 4, 5]) {
      expect(room(`${P}powerplant-c${n}r`).choices[0]!.success.battle).toBeUndefined();
      expect(room(`${P}powerplant-c${n}f`).choices[0]!.success.battle!.kind).toBe('wild');
    }
    const end = room(`${P}powerplant-c5r`).choices[0]!.success.effects.find((e) => e.kind === 'addEventFrom') as { ids: string[] };
    expect(end.ids.filter((x) => x.endsWith('zapdos'))).toHaveLength(2);
    expect(end.ids.filter((x) => x.endsWith('horde'))).toHaveLength(3);
    expect((room(`${P}powerplant-zapdos`).choices[0]!.success.battle as { species: string[]; levelBonus: number }).species).toEqual(['zapdos']);
    const out = play('PP', `${P}powerplant-spoils`, 0);
    expect(heldCount(out, 'magnet')).toBe(1);
  });
  it('Volunteers: ghost goods for coins, and one revive of a fainted Pokémon for ₽500, out of battle', () => {
    const spell = play('VL', `${P}volunteers`, 0, (r) => { r.money = 5000; });
    expect(spell.money).toBe(4400);
    expect(heldCount(spell, 'spell-tag')).toBe(1);
    const run = play('VL', `${P}volunteers-revive`, 0, (r) => { r.money = 5000; r.party[0]!.hp = 0; r.party.push({ ...structuredClone(r.party[0]!), uid: 'second', hp: 10 }); });
    expect(run.money).toBe(4500);
    expect(run.party[0]!.hp).toBeGreaterThan(0);
    expect(run.story.flags['ev:kanto-volunteers-revive']).toBe(1);
    expect(conditionMet(content, run, room(`${P}volunteers-revive`).choices[0]!.requires[2]!)).toBe(false);
  });
  it("Haunter's Prank: laughing pays a Spell Tag; winning the face-off makes the Tower's unseen visible", () => {
    expect(room(`${P}prank`).choices[0]!.success.effects).toContainEqual({ kind: 'item', id: 'spell-tag', count: 1 });
    expect(room(`${P}prank-r3`).choices[0]!.success.effects).toContainEqual({ kind: 'flag', key: 'kanto-prank-friend', amount: 1 });
    expect(room(`${P}tower-f2`).choices[2]!.requires).toEqual([{ kind: 'flag', key: 'kanto-prank-friend', atLeast: 1, atMost: 99 }]);
  });
});
