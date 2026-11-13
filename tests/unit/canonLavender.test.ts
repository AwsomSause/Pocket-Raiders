import { describe, expect, it } from 'vitest';
import { canonInterludeOf, addCanonStops } from '../../src/core/expansion/canonRun';
import { chooseEvent, conditionMet } from '../../src/core/events';
import { chooseStarter, createRun, debugForceEvent } from '../../src/core/run';
import { content } from './helpers';

const begin = (seed: string) => chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red', expansion: { kantoCanon: true } }), 0);
const room = (id: string) => content.events.get(id)!;
const P = 'cs-kanto-lavender-';
const targets = (id: string) => room(id).choices.flatMap((c) => [c.success, c.failure]).flatMap((o) => [...(o?.effects ?? []), ...(o?.battle?.win ?? []), ...(o?.battle && 'lose' in o.battle ? o.battle.lose ?? [] : [])]).flatMap((e) => (e.kind === 'addEvent' ? [e.eventId] : e.kind === 'addEventFrom' ? e.ids : []));
const play = (seed: string, id: string, choice: number, tweak?: (r: ReturnType<typeof begin>) => void) => {
  const base = begin(seed);
  tweak?.(base);
  const { run, sideId } = debugForceEvent(content, structuredClone(base), id);
  return chooseEvent(content, run, sideId, choice).run;
};
const heldCount = (run: ReturnType<typeof begin>, id: string) => (run.inventory[id] ?? 0) + (run.passives?.[id] ?? 0) + run.party.reduce((n, m) => n + (m.held?.[id] ?? 0), 0);
/** A Pokémon that joined: in the party, or waiting in the "caught" decision. */
const joined = (run: ReturnType<typeof begin>, species: string) => run.party.find((m) => m.speciesId === species) ?? run.pending.flatMap((p) => (p.kind === 'caught' ? [p.mon] : [])).find((m) => m.speciesId === species);
const kantoSeeds = (() => { const out: string[] = []; for (let i = 0; out.length < 12 && i < 300; i++) if (begin(`LV${i}`).regionOrder[0] === 'kanto') out.push(`LV${i}`); return out; })();

describe('Lavender canon: the event graph', () => {
  it('every room opens from a gate, and every addEvent target exists', () => {
    const ids = [...content.events.keys()].filter((id) => id.startsWith(P));
    for (const id of ids) for (const t of targets(id)) expect(content.events.has(t), `${id} -> ${t}`).toBe(true);
    const gates = ['tower', 'fuji', 'fanclub', 'rocktunnel', 'powerplant', 'volunteers'].map((s) => `${P}${s}`);
    const reach = new Set<string>(gates);
    for (let again = true; again;) { again = false; for (const id of [...reach]) for (const t of targets(id)) if (!reach.has(t)) { reach.add(t); again = true; } }
    expect([...reach].sort()).toEqual(ids.sort());
  });
  it('the gates carry the catalog ids', () => {
    for (const s of ['tower', 'fuji', 'fanclub', 'rocktunnel', 'powerplant', 'volunteers']) expect(room(`${P}${s}`).canon).toBe(`cs.kanto.lavender.${s}`);
  });
  it('Pokémon Tower is seven floors: graves, graves, two channelers, the prank, the Marowak, the top', () => {
    const chain = ['tower-n1', 'tower-n2', 'tower-n3', 'tower-n4', 'tower-n5', 'tower-n6'].map((s) => `${P}${s}`);
    for (let i = 0; i < chain.length - 1; i++) expect(targets(chain[i]!)).toContain(chain[i + 1]);
    expect(targets(chain[5]!)).toContain(`${P}tower-memorial`);
    expect(targets(`${P}tower-memorial`)).toContain(`${P}tower-top`);
  });
});

describe('Lavender in a run (the interlude between Stage 3 and Stage 4)', () => {
  it('Stage 4 is the stage that opens interlude-3; no other early stage does', () => {
    const run = begin('LV1');
    expect(canonInterludeOf(run)).toBe('interlude-0');
    run.stage!.index = 3;
    expect(canonInterludeOf(run)).toBe('interlude-3');
    run.stage!.index = 4;
    expect(canonInterludeOf(run)).toBeNull();
  });
  it('the Tower is always there; at most two Pseudo Stages are offered; every offered space has an event', () => {
    for (const seed of kantoSeeds) {
      const run = begin(seed);
      run.stage!.index = 3;
      run.expansion!.canon!.menus = {};
      addCanonStops(content, run);
      const menu = run.expansion!.canon!.menus['interlude-3']!;
      expect(menu[0]).toBe('cs.kanto.lavender.tower');
      expect(menu.filter((id) => ['tower', 'rocktunnel', 'powerplant'].includes(id.split('.').pop()!)).length).toBeLessThanOrEqual(2);
      const placed = run.stage!.map.nodes.flatMap((n) => n.sides.map((s) => s.eventId)).filter((id) => id?.startsWith(P));
      expect(placed.length).toBe(menu.length);
    }
  });
});

describe('Pokémon Tower', () => {
  it('without the Silph Scope the first floor only offers a Channeler fight; with it, wild ghosts', () => {
    const run = begin('PT');
    const [scope, channeler] = room(`${P}tower-n1`).choices;
    expect(conditionMet(content, run, scope!.requires[0]!)).toBe(false);
    expect(channeler!.requires).toEqual([]);
    expect(scope!.success.battle!.kind).toBe('wild');
    expect(channeler!.success.battle!.kind).toBe('trainer');
  });
  it('the prank: a 25% roll on the stairs, and laughing along pays a Spell Tag', () => {
    expect(room(`${P}tower-n5`).choices[0]!.chance).toBe(0.25);
    expect(room(`${P}tower-prank`).choices[0]!.success.effects).toContainEqual({ kind: 'item', id: 'spell-tag', count: 1 });
  });
  it('the Marowak is a trainer (never catchable) and beating it sets the release flag', () => {
    const b = room(`${P}tower-n6`).choices[0]!.success.battle!;
    expect(b.kind).toBe('trainer');
    expect(b.win).toContainEqual({ kind: 'flag', key: 'kanto-tower-marowak', amount: 1 });
  });
  it('the Memorial Wall needs a Nuzlocke memorial entry; gifts are capped at three by three rooms', () => {
    const run = begin('MW');
    const gift = room(`${P}tower-memorial`).choices[0]!;
    expect(conditionMet(content, run, gift.requires[0]!)).toBe(false);
    run.nuzlocke = { areas: [], memorial: [{ uid: 'a', speciesId: 'rattata', level: 5, shiny: false, ace: false, area: 'x', cause: 'lost to Brock' }] };
    expect(conditionMet(content, run, gift.requires[0]!)).toBe(true);
    const wall3 = room(`${P}tower-memorial-3`).choices;
    expect(targets(`${P}tower-memorial-3`).every((t) => t === `${P}tower-top`)).toBe(true);
    expect(wall3.some((c) => c.label === 'Move on')).toBe(true);
    const out = play('MW', `${P}tower-memorial`, 0, (r) => { r.nuzlocke = run.nuzlocke; });
    expect(heldCount(out, 'spell-tag')).toBe(1);
    expect(out.story.flags['ev:kanto-tower-memorial']).toBe(1);
  });
  it('freeing Mr. Fuji pays the Silph Scope, the Tower Scroll and the story flags; a released Marowak adds Cubone with Lightning Rod and Bone Rush', () => {
    const plain = play('TF', `${P}tower-top`, 1);
    expect(heldCount(plain, 'silph-scope')).toBe(1);
    expect(plain.story.flags['ev:kanto-tower-cleared']).toBe(1);
    expect(plain.story.flags['ev:xk-tower-cleansed']).toBe(1);
    expect(joined(plain, 'cubone')).toBeUndefined();
    const kind = play('TF', `${P}tower-top`, 0, (r) => { r.story.flags['ev:kanto-tower-marowak'] = 1; });
    const cubone = joined(kind, 'cubone')!;
    expect(cubone.fixedAbility).toBe('lightning-rod');
    expect(cubone.moves.some((m) => m.id === 'bone-rush')).toBe(true);
  });
});

describe('Fuji, Fan Club, Rock Tunnel, Power Plant, Volunteers', () => {
  it("Mr. Fuji's house: adopt one of three babies and get the Poké Flute and +1 friendship", () => {
    const labels = room(`${P}fuji`).choices.map((c) => c.label);
    expect(labels.filter((l) => l.startsWith('Adopt')).length).toBe(3);
    const out = play('FJ', `${P}fuji`, 0);
    expect(joined(out, 'pichu')).toBeDefined();
    expect(heldCount(out, 'poke-flute')).toBe(1);
  });
  it('Fan Club: listening pays a Bike Voucher, interrupting pays a Poké Doll', () => {
    const c = room(`${P}fanclub`).choices;
    expect(c[0]!.success.effects).toContainEqual({ kind: 'item', id: 'bike-voucher', count: 1 });
    expect(c[1]!.success.effects).toContainEqual({ kind: 'item', id: 'poke-doll', count: 1 });
  });
  it('Rock Tunnel is five nodes, needs a light to choose, and cuts accuracy by a tenth', () => {
    const chain = [1, 2, 3, 4, 5].map((n) => `${P}rocktunnel-n${n}`);
    for (let i = 0; i < 4; i++) expect(targets(chain[i]!)).toContain(chain[i + 1]);
    const run = begin('RT');
    expect(conditionMet(content, run, room(chain[0]!).choices[0]!.requires[0]!)).toBe(false);
    expect(room(chain[0]!).choices.at(-1)!.requires).toEqual([]);
    const end = play('RT', chain[4]!, 0);
    expect(joined(end, 'onix')!.fixedAbility).toBe('sturdy');
    expect(heldCount(end, 'flashlight')).toBe(1);
  });
  it('Power Plant is six nodes ending in a 40% Zapdos, else an Electrode horde, then a Magnet and a Thunder Stone', () => {
    const boss = room(`${P}powerplant-n5`).choices[0]!;
    expect(boss.chance).toBe(0.4);
    expect((boss.success.battle as { species: string[] }).species).toEqual(['zapdos']);
    expect((boss.failure!.battle as { species: string[] }).species).toEqual(['electrode']);
    const out = play('PP', `${P}powerplant-n6`, 0);
    expect(heldCount(out, 'magnet')).toBe(1);
    // The Thunder Stone is a reward item: it goes to a Pokémon that can use it, and is sold if nobody can.
    expect(room(`${P}powerplant-n6`).choices[0]!.success.effects).toContainEqual({ kind: 'item', id: 'thunderstone', count: 1 });
  });
  it('Volunteers: sells ghost goods for coins, and the Revive can be bought only once', () => {
    const before = begin('VL');
    before.money = 5000;
    const run = play('VL', `${P}volunteers-revive`, 0, (r) => { r.money = 5000; });
    expect(run.money).toBe(4500);
    expect(heldCount(run, 'revive')).toBeGreaterThanOrEqual(1);
    expect(run.story.flags['ev:kanto-volunteers-revive']).toBe(1);
    expect(conditionMet(content, run, room(`${P}volunteers-revive`).choices[0]!.requires[1]!)).toBe(false);
    const spell = play('VL', `${P}volunteers`, 0, (r) => { r.money = 5000; });
    expect(spell.money).toBe(4400);
    expect(heldCount(spell, 'spell-tag')).toBe(1);
    const poor = begin('VP');
    poor.money = 100;
    expect(conditionMet(content, poor, room(`${P}volunteers`).choices[0]!.requires[0]!)).toBe(false);
  });
});
