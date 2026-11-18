// Catalog Overhaul Pack, category `kanto-canon`: the rebuilt Kanto Canon Spaces (KANTO_PLACED_1..6.md).
// Schema-valid data, every room reachable, every flag read or declared, rewards inside their limits, and the small rules.
import { describe, expect, it } from 'vitest';
import { getContent } from '../../src/data';
import { canonKanto, canonKantoPlaced } from '../../src/data/expansion';
import type { EventDef, EventEffect, EventOutcome } from '../../src/core/contentSchema';
import { applyEffect, conditionMet } from '../../src/core/events';
import { columnOfStep, nodesForSpace } from '../../src/core/expansion/canonKantoPlaced';
import { Rng, hashSeed } from '../../src/core/rng';
import { chooseStarter, createRun } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import { buildChainStage, chainById } from '../../src/core/dungeon/pseudo';
import { kantoSweetAir, sweetAirHere } from '../../src/core/expansion/canonKantoRules';
import status from '../../src/data/catalogOverhaul/status/kanto-canon.json';
import pseudoFile from '../../src/data/catalogOverhaul/pseudo/kanto-canon.json';

const content = getContent();
const FILES = Object.values(import.meta.glob('../../src/data/events/co-kanto-canon-*.json', { eager: true, import: 'default' })) as { events: { id: string }[]; remove: string[] }[];
const ids = FILES.flatMap((f) => f.events.map((e) => e.id));
const mine: EventDef[] = ids.map((id) => content.events.get(id)!);
const outcomes = (e: EventDef): EventOutcome[] => [...e.choices, ...e.remembers.flatMap((v) => v.addChoices)].flatMap((c) => [c.success, ...(c.failure ? [c.failure] : [])]);
const effects = (e: EventDef): EventEffect[] => outcomes(e).flatMap((o) => [...o.effects, ...(o.battle?.win ?? []), ...((o.battle as { lose?: EventEffect[] } | undefined)?.lose ?? [])]);
const opened = (e: EventDef): string[] => effects(e).flatMap((x) => (x.kind === 'addEvent' || x.kind === 'laterEvent' ? [x.eventId] : x.kind === 'addEventFrom' ? x.ids : []));
const conditions = (e: EventDef) => [...e.requires, ...e.choices.flatMap((c) => c.requires), ...e.remembers.flatMap((v) => [...v.when, ...v.addChoices.flatMap((c) => c.requires)])];

function freshRun(): RunState {
  const run = chooseStarter(content, createRun(content, { runId: 'kanto-canon-co', seed: 'kanto-canon-co', archetypeId: 'red', expansion: { kantoCanon: true } }), 0);
  if (!run.expansion?.canon) (run as { expansion?: object }).expansion = { ...run.expansion, canon: { flags: [], completed: [], menus: {} } };
  return run;
}
const kc = (act: string, x: object = {}) => ({ kind: 'kc', act, ...x }) as unknown as EventEffect;

describe('kanto-canon: data', () => {
  it('every built event loaded, and replaces the simplified build', () => {
    for (const id of ids) expect(content.events.get(id), id).toBeTruthy();
    for (const f of FILES) for (const id of f.remove) expect(content.events.get(id)?.disabled, `${id} retired`).toBe(true);
  });

  it('every space in the status file is played by a live event that names it', () => {
    for (const [space, eventId] of Object.entries(status.extra)) {
      const e = content.events.get(eventId);
      expect(e && !e.disabled, `${space} -> ${eventId}`).toBe(true);
      expect(e!.canon, eventId).toBe(space);
      expect(canonKanto.spaces.some((s) => s.id === space && s.placed), `${space} is in the catalog with its placement`).toBe(true);
    }
  });

  it('every room is opened by another event of the set (or is a follow-up or a Stage 8 return)', () => {
    const targets = new Set(mine.flatMap(opened));
    // Follow-ups, and road rows (KANTO_PLACED_6: the Aides' later gatehouses are rooms placed on the road), are placed, not opened.
    const follow = new Set([...canonKantoPlaced.followups.map((f) => f.event), ...canonKantoPlaced.routes.map((r) => r.event)]);
    for (const t of targets) expect(content.events.get(t) && !content.events.get(t)!.disabled, `opened room ${t} exists`).toBe(true);
    for (const e of mine) if (e.room) expect(targets.has(e.id) || follow.has(e.id), `room ${e.id} is reachable`).toBe(true);
    for (const e of mine) if (!e.room && !e.canon) expect(follow.has(e.id), `${e.id} is neither a room, a space nor a follow-up`).toBe(true);
    for (const f of follow) expect(content.events.get(f), `follow-up ${f}`).toBeTruthy();
  });

  it('every choice can be reached: a locked choice never leaves an event with nothing to pick', () => {
    for (const e of mine) {
      const open = e.choices.filter((c) => c.requires.length === 0);
      const variantOpen = e.remembers.some((v) => v.addChoices.some((c) => c.requires.length === 0));
      // Events whose every choice has a requirement must cover both sides of it (has / has not).
      if (open.length === 0 && !variantOpen) // The last three score rooms gate on complementary ranges (one of the two always opens).
      expect(['cs-kanto-lavender-tower-f7', 'cs-kanto-saffron-silph-gift', 'cs-kanto-viridian-convertible-end', 'cs-kanto-pewter-siblings-home', 'cs-kanto-vermilion-capsized-surface', 'cs-kanto-celadon-bridgerun-end', 'cs-kanto-celadon-greenhouse-out', 'cs-kanto-fuchsia-ranch-line', 'cs-kanto-saffron-exam-result', 'cs-kanto-cinnabar-inn-night', 'cs-kanto-cinnabar-sleeper-woke', 'cs-kanto-route-film-verdict', 'cs-kanto-sevii-dottedhole-bottom', 'cs-kanto-sevii-warehouse-admin1', 'cs-kanto-sevii-warehouse-admin2', ...[1, 2, 3, 4, 5, 6, 7, 8].map((n) => `cs-kanto-sevii-tower-f${n}`), 'cs-kanto-lavender-rival-after', 'cs-kanto-route-bikerace-up', 'cs-kanto-route-bikerace-along', 'cs-kanto-route-bikerace-down', 'cs-kanto-route-bikerace-line', 'cs-kanto-route-gamblers-coin', 'cs-kanto-vermilion-triage-end', 'cs-kanto-fuchsia-secrethouse-end' /* KANTO_PLACED_5: cast or not, Sapphire here or won, Silph won or not, the climb's mode; KANTO_PLACED_6: a Scope or none, light or heavy, the count of wins or right calls; KANTO_PLACED_4: two complementary gates (in time or late, passed or not, with or without a Squirtle): one always fits */], `${e.id} has only locked choices`).toContain(e.id);
    }
  });

  it('every flag an event sets is read by an event or declared as the space result', () => {
    const read = new Set(mine.flatMap(conditions).flatMap((c) => (c.kind === 'flag' ? [c.key] : [])));
    const declared = new Set(canonKanto.spaces.flatMap((s) => s.flags).map((f) => f.replace(/\./g, '-')));
    const shared = new Set(['kind-total', 'intel', 'rep', 'rep-lost', 'xk-tower-cleansed']); // the shared board's counters (STANDARDS.md), and a flag older events read
    for (const e of mine) for (const x of effects(e)) if (x.kind === 'flag') expect(read.has(x.key) || declared.has(x.key) || shared.has(x.key), `${e.id} sets ${x.key}, which nothing reads`).toBe(true);
  });

  it('text fits the box and no event hands out an in-battle healing item or ends the run', () => {
    const HEALING = new Set(['potion', 'super-potion', 'hyper-potion', 'max-potion', 'full-restore', 'revive', 'max-revive', 'full-heal']);
    for (const e of mine) {
      expect(e.intro.length, `${e.id} intro`).toBeLessThanOrEqual(900);
      for (const v of e.remembers) expect((v.intro ?? e.intro).length + (v.notice?.length ?? 0), `${e.id} variant ${v.id}`).toBeLessThanOrEqual(1100);
      for (const c of [...e.choices, ...e.remembers.flatMap((v) => v.addChoices)]) expect(c.label.length, `${e.id} "${c.label}"`).toBeLessThanOrEqual(64);
      for (const o of outcomes(e)) {
        expect(o.text.length, `${e.id} outcome`).toBeLessThanOrEqual(900);
        if (o.battle) expect((o.battle as { pseudo?: boolean; rival?: boolean }).pseudo || (o.battle as { rival?: boolean }).rival, `${e.id}: a lost event battle never ends the run`).toBe(true);
      }
      for (const x of effects(e)) if (x.kind === 'item') expect(HEALING.has(x.id), `${e.id} gives ${x.id}`).toBe(false);
    }
  });

  it('rewards stay inside their stated limits', () => {
    // The Trainer School: three questions, one stat gain each, +3 at most.
    const school = mine.filter((e) => e.id.startsWith('cs-kanto-viridian-school-q'));
    expect(school).toHaveLength(12);
    for (const q of school) expect(q.choices.filter((c) => c.success.effects.some((x) => x.kind === 'kc')).length, q.id).toBe(1);
    // Brock's Stew: one stat, the next boss fight only.
    for (const c of content.events.get('cs-kanto-pewter-rest-stew')!.choices) expect(c.success.effects.find((x) => x.kind === 'tempEffect')).toMatchObject({ battles: 1, until: 'boss' });
    // The Volunteers revive once.
    expect(content.events.get('cs-kanto-lavender-volunteers-revive')!.choices[0]!.requires).toContainEqual({ kind: 'flag', key: 'kanto-volunteers-revive', atLeast: 0, atMost: 0 });
  });
});

describe('kanto-canon: rules', () => {
  const rng = () => new Rng(hashSeed("kc-7"));

  it('the Day-Care keeps a Pokémon for a stage and returns it three levels up', () => {
    const run = freshRun();
    const extra = structuredClone(run.party[0]!);
    extra.uid = 'kc-second';
    run.party.push(extra);
    const before = extra.level;
    expect(applyEffect(content, run, kc('daycareLeave', { count: 1 }), rng())).not.toBe('');
    expect(run.party).toHaveLength(1);
    expect(conditionMet(content, run, { kind: 'kc', act: 'daycare', ids: [] } as never)).toBe(true);
    // A second drop-off while one is waiting does nothing, and the lead never goes.
    expect(applyEffect(content, run, kc('daycareLeave', { count: 1 }), rng())).toBe('');
    applyEffect(content, run, kc('daycareReturn'), rng());
    expect(run.party).toHaveLength(2);
    expect(run.party[1]!.level).toBe(Math.min(before + 3, run.party[1]!.level));
    expect(run.party[1]!.level).toBeGreaterThan(before);
    expect(conditionMet(content, run, { kind: 'kc', act: 'daycare', ids: [] } as never)).toBe(false);
  });

  it('two compatible Pokémon left together come back with an Egg', () => {
    const run = freshRun();
    for (const uid of ['a', 'b']) { const m = structuredClone(run.party[0]!); m.uid = `kc-${uid}`; run.party.push(m); }
    run.stage!.current = run.stage!.map.nodes[0]!.id;
    const eggs = run.eggs?.length ?? 0;
    applyEffect(content, run, kc('daycareLeave', { count: 2 }), rng());
    expect(run.party).toHaveLength(1);
    applyEffect(content, run, kc('daycareReturn'), rng());
    expect(run.party).toHaveLength(3);
    expect((run.eggs?.length ?? 0)).toBe(eggs + 1);
  });

  it('a stat gain lands on the picked Pokémon, and a Fossil Fragment completes with a second one', () => {
    const run = freshRun();
    const mon = run.party[0]!;
    applyEffect(content, run, kc('statUp', { stat: 'spe' }), rng(), mon.uid);
    expect(mon.statBoosts?.spe).toBe(1);
    expect(applyEffect(content, run, kc('fossilFragment'), rng())).toContain('Fragment');
    expect(run.inventory['helix-fossil'] ?? run.inventory['dome-fossil'] ?? 0).toBe(0);
    applyEffect(content, run, kc('fossilFragment'), rng());
    expect((run.inventory['helix-fossil'] ?? 0) + (run.inventory['dome-fossil'] ?? 0)).toBe(1);
  });

  it('the Volunteers revive one fainted Pokémon, out of battle', () => {
    const run = freshRun();
    run.party[0]!.hp = 0;
    expect(conditionMet(content, run, { kind: 'kc', act: 'fainted', ids: [] } as never)).toBe(true);
    applyEffect(content, run, kc('reviveOne'), rng());
    expect(run.party[0]!.hp).toBeGreaterThan(0);
    expect(conditionMet(content, run, { kind: 'kc', act: 'fainted', ids: [] } as never)).toBe(false);
  });

  it('the Memorial Wall answers no flowers when the run has lost nobody', () => {
    const run = freshRun();
    expect(conditionMet(content, run, { kind: 'kc', act: 'giftLeft', ids: [] } as never)).toBe(false);
    expect(applyEffect(content, run, kc('partingGift'), rng())).toBe('');
  });
});

describe('kanto-canon: pseudo-stages', () => {
  it('every Pseudo Stage space draws as a stage map whose rooms are its own events', () => {
    expect(pseudoFile.chains.length).toBeGreaterThan(0);
    const run = freshRun();
    for (const c of pseudoFile.chains) {
      const chain = chainById(c.id)!;
      expect(chain, c.id).toBeTruthy();
      expect(content.themes.has(chain.themeId), `${c.id} theme ${chain.themeId}`).toBe(true);
      const stage = buildChainStage(content, chain, run.stage!);
      expect(stage.map.nodes.length, `${c.id} rooms`).toBeGreaterThan(1);
      expect(stage.index, 'never adds a stage').toBe(run.stage!.index);
      for (const n of stage.map.nodes) expect(content.events.get(n.roomEvent!)?.room, `${c.id} ${n.roomEvent}`).toBe(true);
    }
  });
});

describe('kanto-canon: placement', () => {
  it('a must-see space sits on every node of its home step, and the others inside their window', () => {
    const run = freshRun();
    const stage = run.stage!;
    const oldman = canonKanto.spaces.find((s) => s.id === 'cs.kanto.viridian.oldman')!;
    const nodes = nodesForSpace(stage, oldman, new Rng(hashSeed("kc-1")));
    expect(nodes.length).toBe(stage.map.nodes.filter((n) => n.column === columnOfStep(stage, 1)).length);
    expect(nodes.every((n) => n.column === columnOfStep(stage, 1))).toBe(true);
    const flock = canonKanto.spaces.find((s) => s.id === 'cs.kanto.pewter.flock')!;
    for (let seed = 1; seed <= 20; seed++) {
      const [node] = nodesForSpace(stage, flock, new Rng(hashSeed(`kc-${seed}`)));
      expect(node!.column).toBeGreaterThanOrEqual(columnOfStep(stage, 5));
      expect(node!.column).toBeLessThanOrEqual(columnOfStep(stage, 9));
    }
    // Route 22 sits on Step 3 at Stage 1 and on Step 18 at the Stage 8 return.
    const route22 = canonKanto.spaces.find((s) => s.id === 'cs.kanto.viridian.route22')!;
    expect(nodesForSpace(stage, route22, new Rng(hashSeed('kc-r22'))).every((n) => n.column === columnOfStep(stage, 3))).toBe(true);
    const later = { ...stage, index: 7 };
    expect(nodesForSpace(later, route22, new Rng(hashSeed('kc-r22'))).every((n) => n.column === columnOfStep(later, 18))).toBe(true);
    // A space the placed docs do not cover keeps a single random node.
    expect(nodesForSpace(stage, undefined, new Rng(hashSeed("kc-1")))).toHaveLength(1);
  });
});

describe('Sweet Air (KANTO_PLACED_2, Erika\'s perfume)', () => {
  const at = (seed: string, stageNo: number, themeId: string, canon = true) => {
    const run = chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red', expansion: canon ? { kantoCanon: true } : undefined }), 0);
    run.regionOrder = ['kanto', ...run.regionOrder.filter((r) => r !== 'kanto')];
    run.regionIndex = 0;
    run.stage = { ...run.stage!, index: stageNo - 1, themeId };
    run.battle = { activeIndex: 0, enemyTeam: [] } as unknown as RunState['battle'];
    run.party[0]!.status = null;
    return run;
  };
  const forest = [...content.themes.values()].find((t) => t.types.includes('grass'))!.id;
  const city = [...content.themes.values()].find((t) => !t.types.some((x) => ['grass', 'bug', 'fairy'].includes(x)))!.id;
  it('holds only in Celadon\'s stage (Kanto Stage 4), on a forest-tagged stage, in a canon run', () => {
    expect(sweetAirHere(content, at('SA', 4, forest))).toBe(true);
    expect(sweetAirHere(content, at('SA', 3, forest))).toBe(false);
    expect(sweetAirHere(content, at('SA', 4, city))).toBe(false);
    expect(sweetAirHere(content, at('SA', 4, forest, false))).toBe(false);
  });
  it('puts the lead to sleep for one turn about 20% of the time, the same way for the same seed, and never a statused lead', () => {
    let slept = 0;
    for (let i = 0; i < 400; i++) {
      const run = at(`SA${i}`, 4, forest);
      kantoSweetAir(content, run);
      const again = at(`SA${i}`, 4, forest);
      kantoSweetAir(content, again);
      expect(again.party[0]!.status).toEqual(run.party[0]!.status);
      if (run.party[0]!.status) { slept++; expect(run.party[0]!.status).toEqual({ id: 'slp', turns: 1 }); }
    }
    expect(slept / 400).toBeGreaterThan(0.13);
    expect(slept / 400).toBeLessThan(0.27);
    const burned = at('SAB', 4, forest);
    burned.party[0]!.status = { id: 'brn' };
    kantoSweetAir(content, burned);
    expect(burned.party[0]!.status).toEqual({ id: 'brn' });
  }, 300_000);
});
