import { describe, expect, it } from 'vitest';
import { chooseEvent, conditionMet, eventBattleLost } from '../../src/core/events';
import { addStageAttribute, expireStageMods } from '../../src/core/expansion/stageMods';
import { raidRecord, resolveStoryRaid } from '../../src/core/raid/storyRaids';
import { chooseStarter, createRun, debugForceEvent, takeTurn } from '../../src/core/run';
import { content, toBattle } from './helpers';

const begin = (seed: string) => chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red', expansion: { kantoCanon: true } }), 0);
const P = 'cs-kanto-celadon-';
const room = (id: string) => content.events.get(`${P}${id}`)!;
const pick = (id: string, choice: number, seed = 'CE', money = 20000) => {
  const base = structuredClone(begin(seed));
  base.money = money;
  const { run, sideId } = debugForceEvent(content, base, `${P}${id}`);
  return { before: base, out: chooseEvent(content, run, sideId, choice).run };
};
const pages = (id: string) => [...content.events.keys()].filter((k) => k === `${P}${id}` || k.startsWith(`${P}${id}-p`)).map((k) => content.events.get(k)!);
const choicesOf = (id: string) => pages(id).flatMap((e) => e.choices);
const count = (run: ReturnType<typeof begin>, id: string) => (run.inventory[id] ?? 0) + run.party.reduce((n, m) => n + (m.held?.[id] ?? 0), 0);

describe('Celadon canon: the event graph', () => {
  it('every catalog space has a gate, and every target exists and is reachable', () => {
    const gates = ['mart', 'gamecorner', 'mansion', 'eevee', 'tea', 'perfume', 'rooftop', 'salon', 'diner', 'poster', 'devroom', 'bridgerun', 'greenhouse', 'vee'];
    for (const g of gates) expect(room(g).canon).toBe(`cs.kanto.celadon.${g}`);
    const live = [...content.events.keys()].filter((id) => id.startsWith(P) && !content.events.get(id)!.disabled);
    const targets = (id: string) => { const e = content.events.get(id)!; return [...e.choices, ...e.remembers.flatMap((v) => v.addChoices)].flatMap((c) => [c.success, c.failure]).flatMap((o) => [...(o?.effects ?? []), ...(o?.battle?.win ?? [])]).flatMap((e) => (e.kind === 'addEvent' ? [e.eventId] : e.kind === 'addEventFrom' ? e.ids : [])); };
    // Follow-ups (the Mansion Key's roof, the thirsty guard) are placed at later stages, not opened.
    const reach = new Set<string>([...gates.map((g) => `${P}${g}`), `${P}mansion-key`, `${P}rooftop-guard`]);
    for (let again = true; again;) { again = false; for (const id of [...reach]) for (const t of targets(id)) { expect(content.events.has(t), `${id} -> ${t}`).toBe(true); if (!reach.has(t)) { reach.add(t); again = true; } } }
    expect(live.filter((id) => !reach.has(id))).toEqual([]);
  });
});

describe('Department Store (KANTO_PLACED_2)', () => {
  it('the service counter heals the party for free', () => {
    const base = structuredClone(begin('SV')); base.money = 500; base.party[0]!.hp = 1;
    const { run, sideId } = debugForceEvent(content, base, `${P}mart`);
    const out = chooseEvent(content, run, sideId, 0).run;
    expect(out.party[0]!.hp).toBeGreaterThan(1);
    expect(out.money).toBe(500);
  });
  it('a purchase is refused without the money (boundary)', () => {
    expect(room('mart-f5').choices[0]!.requires).toContainEqual({ kind: 'money', atLeast: 3000 });
  });
  it('the stone floor sells all five Kanto stones at 1.5x', () => {
    const ids = [...room('mart-f5').choices, ...room('mart-f5b').choices].flatMap((c) => c.success.effects.filter((e) => e.kind === 'item').map((e) => (e as { id: string }).id));
    expect(ids).toEqual(['fire-stone', 'water-stone', 'thunder-stone', 'leaf-stone', 'moon-stone']);
  });
  it('the Wise Man points at the gap in your six, at the same price as the rest', () => {
    const wise = room('mart-f4');
    expect(wise.remembers.map((v) => v.when[0])).toEqual([{ kind: 'partyType', type: 'fire', absent: true }, { kind: 'partyType', type: 'flying', absent: true }, { kind: 'partyType', type: 'ice', absent: true }]);
    const prices = wise.choices.slice(0, 3).map((c) => c.requires[0]);
    expect(new Set(prices.map((p) => JSON.stringify(p))).size).toBe(1);
  });
  it('the Doll Floor sells an escape doll, and the Clefairy is free', () => {
    const { before, out } = pick('mart-dolls', 0);
    expect(out.inventory['poke-doll-escape']).toBe((before.inventory['poke-doll-escape'] ?? 0) + 1);
    expect(room('mart-dolls').choices[1]!.requires).toEqual([]);
    expect(room('mart-dolls').choices[1]!.success.effects).toContainEqual(expect.objectContaining({ kind: 'join', species: ['clefairy'] }));
  });
});

describe("Erika's tea", () => {
  it('restores PP and cures status for the team, free', () => {
    const base = structuredClone(begin('TEA')); base.money = 500;
    base.party[0]!.moves[0]!.pp = 0; base.party[0]!.status = { id: 'psn' };
    const { run, sideId } = debugForceEvent(content, base, `${P}tea`);
    const out = chooseEvent(content, run, sideId, 0).run;
    expect(out.party[0]!.moves[0]!.pp).toBeGreaterThan(0);
    expect(out.party[0]!.status).toBeNull();
    expect(out.money).toBe(500);
  });
});

describe('Rooftop Vending', () => {
  it('sells the three drinks as bag items at ₽200 / 300 / 350 that heal 30 / 50 / 70 HP, never in battle', () => {
    [['rooftop-fresh-water', 200, 30], ['rooftop-soda-pop', 300, 50], ['rooftop-lemonade', 350, 70]].forEach(([id, cost, hp], i) => {
      const { before, out } = pick('rooftop-machines', i, 'RF', 1000);
      expect(out.money).toBe(before.money - (cost as number));
      expect(out.inventory[id as string]).toBe(1);
      const it = content.items.get(id as string)!;
      expect((it.effect as { amount: number }).amount).toBe(hp);
      expect(it.usableInBattle).toBe(false);
    });
  });
  it('the thirsty guard at Saffron only comes while a drink is held, and trades it for a rare item', () => {
    const guard = room('rooftop-guard');
    const run = structuredClone(begin('GD'));
    expect(guard.requires.every((c) => conditionMet(content, run, c))).toBe(false);
    run.inventory['rooftop-lemonade'] = 1;
    expect(guard.requires.every((c) => conditionMet(content, run, c))).toBe(true);
    const { run: r, sideId } = debugForceEvent(content, run, `${P}rooftop-guard`);
    const out = chooseEvent(content, r, sideId, 2).run;
    expect(out.inventory['rooftop-lemonade'] ?? 0).toBe(0);
    expect(out.inventory['lucky-egg']).toBe((run.inventory['lucky-egg'] ?? 0) + 1);
  });
});

describe('Eeveelution Brothers', () => {
  it('the stone you pick decides the Eeveelution, and one of the other two brothers fights', () => {
    const want: [string, string[]][] = [['vaporeon', ['jolteon', 'flareon']], ['jolteon', ['vaporeon', 'flareon']], ['flareon', ['vaporeon', 'jolteon']]];
    want.forEach(([mon, angry], i) => {
      const c = room('eevee-stones').choices[i]!;
      expect(c.chance).toBe(0.5);
      for (const [o, foe] of [[c.success, angry[0]], [c.failure!, angry[1]]] as const) {
        const b = o.battle as { team: string[]; win: { kind: string; species?: string[] }[] };
        expect(b.team).toEqual([foe]);
        expect(b.win).toContainEqual(expect.objectContaining({ kind: 'join', species: [mon] }));
      }
    });
  });
  it('the cousin turns up 25% of the time with Leafeon and Glaceon', () => {
    const pickStone = room('eevee').choices[0]!;
    expect(pickStone.chance).toBe(0.75);
    const joins = room('eevee-cousin2').choices.flatMap((c) => (c.success.battle?.win ?? []).filter((e) => e.kind === 'join').flatMap((e) => (e as { species: string[] }).species));
    expect(joins).toEqual(['leafeon', 'glaceon']);
  });
  it('asking the Eevee or Mikey gives Kindness and no evolved Eevee', () => {
    for (const i of [1, 2]) {
      const fx = room('eevee').choices[i]!.success.effects;
      expect(fx).toContainEqual({ kind: 'attribute', key: 'goodEvil', amount: 1 });
      expect(fx.some((e) => e.kind === 'join')).toBe(false);
    }
  });
});

describe('Mansion, Game Corner, Perfume', () => {
  it('the back room gives an Eevee and the Mansion Key', () => {
    const { before, out } = pick('mansion-back', 0);
    expect(out.party.length + (out.box?.length ?? 0) + out.pending.length).toBe(before.party.length + (before.box?.length ?? 0) + before.pending.length + 1);
    expect(out.story.flags['ev:kanto-mansion-key']).toBe(1);
  });
  it('the Perfume Heist: unmask them for a double battle, or push the barrow; both pay the Vial and Reputation +2', () => {
    const b = room('perfume').choices[1]!.success.battle as { format: string; win: { kind: string; id?: string; key?: string; amount?: number }[] };
    expect(b.format).toBe('doubles');
    expect(b.win).toContainEqual(expect.objectContaining({ kind: 'item', id: 'perfume-vial' }));
    expect(b.win).toContainEqual({ kind: 'flag', key: 'rep', amount: 2 });
    const barrow = room('perfume').choices[3]!.success;
    expect(barrow.battle).toBeUndefined();
    expect(barrow.effects).toContainEqual(expect.objectContaining({ kind: 'item', id: 'perfume-vial' }));
    expect(content.catalog.has('perfume-vial')).toBe(true);
  });
  it('coins cost ₽10 each, every machine shows its odds, and going broke hands over the Bad Luck Charm (Luck −1 this stage)', () => {
    expect(room('gamecorner').choices[0]!.requires).toContainEqual({ kind: 'money', atLeast: 500 });
    for (const c of room('gamecorner-floor').choices.slice(0, 2)) expect(c.label).toMatch(/\d+% on its face/);
    expect(room('gamecorner-floor').choices[3]!.success.effects).toContainEqual({ kind: 'stageAttribute', key: 'luck', amount: -1 });
  });
  it('the prize counter has all five tiers', () => {
    const joins = [...room('gamecorner-prizes').choices, ...room('gamecorner-top').choices].flatMap((c) => c.success.effects.filter((e) => e.kind === 'join').flatMap((e) => (e as { species: string[] }).species));
    expect(joins).toEqual(['abra', 'scyther', 'porygon', 'dratini']);
  });
});

describe('Poké Doll (escape item)', () => {
  const wild = (seed: string) => {
    let run = structuredClone(begin(seed));
    for (let i = 0; i < 6 && run.phase === 'map' && !run.battle; i++) run = toBattle(run);
    return run;
  };
  it('slips out of an ordinary wild battle: used up, no money, no experience, map next', () => {
    const run = wild('DOLL');
    expect(run.battle?.kind).toBe('wild');
    run.inventory['poke-doll-escape'] = 2;
    const xp = run.party.map((m) => m.xp);
    const res = takeTurn(content, run, { kind: 'item', itemId: 'poke-doll-escape' });
    expect(res.escaped).toBe(true);
    expect(res.run.phase).toBe('map');
    expect(res.run.battle).toBeNull();
    expect(res.run.inventory['poke-doll-escape']).toBe(1);
    expect(res.run.money).toBe(run.money);
    expect(res.run.party.map((m) => m.xp)).toEqual(xp);
    expect(res.end).toBeNull();
  });
  it('cannot be used against a trainer (failure case)', () => {
    const run = wild('DOLL2');
    run.battle!.kind = 'trainer';
    run.inventory['poke-doll-escape'] = 1;
    expect(() => takeTurn(content, run, { kind: 'item', itemId: 'poke-doll-escape' })).toThrow(/slip away/);
    expect(run.inventory['poke-doll-escape']).toBe(1);
  });
});

describe('Luck −1 lasts one stage', () => {
  it('stageAttribute lowers Luck now and gives it back when the next stage starts', () => {
    const run = structuredClone(begin('LUCK'));
    const luck = run.attributeModifiers.luck ?? 0;
    addStageAttribute(run, 'luck', -1);
    expect(run.attributeModifiers.luck).toBe(luck - 1);
    expireStageMods(run); // same stage: kept
    expect(run.attributeModifiers.luck).toBe(luck - 1);
    run.stage = { ...run.stage!, index: run.stage!.index + 1 };
    expireStageMods(run);
    expect(run.attributeModifiers.luck).toBe(luck);
    expireStageMods(run); // nothing left to undo
    expect(run.attributeModifiers.luck).toBe(luck);
  });
});

describe('Diploma from the Pokédex', () => {
  const at = (seen: number) => { const run = structuredClone(begin('DEX')); run.log.speciesSeen = Array.from({ length: seen }, (_, i) => `sp${i}`); return run; };
  it('the dex condition counts species seen this run (boundary 11 / 12)', () => {
    expect(conditionMet(content, at(11), { kind: 'dex', set: 'seen', atLeast: 12 })).toBe(false);
    expect(conditionMet(content, at(12), { kind: 'dex', set: 'seen', atLeast: 12 })).toBe(true);
  });
  it('the Study gives a Diploma at 30, 60 and 100 seen', () => {
    const [d100, d60, d30] = room('mansion-study').choices;
    expect(d100!.requires).toContainEqual({ kind: 'dex', set: 'seen', atLeast: 100 });
    expect(d60!.requires).toContainEqual({ kind: 'dex', set: 'seen', atLeast: 60 });
    expect(d30!.requires).toContainEqual({ kind: 'dex', set: 'seen', atLeast: 30 });
    const { run, sideId } = debugForceEvent(content, at(30), `${P}mansion-study`);
    const out = chooseEvent(content, run, sideId, 2).run;
    expect(out.story.flags['relic:kanto-diploma-1']).toBeTruthy();
  });
});

describe('The Celadon Hideout (Story Raid 2)', () => {
  const gate = () => room('gamecorner').choices.find((c) => c.label.startsWith('The machine at the back'))!;
  it('the back machine needs a Rocket run and an unresolved Raid 2, and its stairway opens the Hideout', () => {
    expect(gate().requires).toEqual([{ kind: 'evil', team: 'rocket' }, { kind: 'storyRaid', n: 2 }]);
    expect((room('gamecorner-stairs').choices[0]!.success.battle as { win: unknown[] }).win).toContainEqual({ kind: 'addEvent', eventId: `${P}hideout-1` });
  });
  it('turning back records the raid as declined, and the raid is then closed', () => {
    const base = structuredClone(begin('HIDE'));
    expect(conditionMet(content, base, { kind: 'storyRaid', n: 2 })).toBe(true);
    const { run, sideId } = debugForceEvent(content, base, `${P}hideout-1`);
    const out = chooseEvent(content, run, sideId, 1).run;
    expect(raidRecord(out, 2)?.result).toBe('declined');
    expect(conditionMet(content, out, { kind: 'storyRaid', n: 2 })).toBe(false);
  });
  it('every floor loss records a failure, the retreat a partial, and the boss win a triumph (fast) or success (slow)', () => {
    const fail = { kind: 'storyRaid', n: 2, result: 'failure' };
    for (const f of ['hideout-1', 'hideout-2', 'hideout-3']) expect((room(f).choices[0]!.success.battle as { lose: unknown[] }).lose).toContainEqual(fail);
    expect(room('hideout-2').choices[1]!.success.effects).toContainEqual({ kind: 'storyRaid', n: 2, result: 'partial' });
    const boss = room('hideout-3').choices[0]!.success.battle as { win: unknown[]; slowWin: unknown[] };
    expect(boss.win).toContainEqual({ kind: 'storyRaid', n: 2, result: 'triumph' });
    expect(boss.slowWin).toContainEqual({ kind: 'storyRaid', n: 2, result: 'success' });
  });
  it('losing a floor fight records a failed raid (the loss effects run)', () => {
    const { run, sideId } = debugForceEvent(content, structuredClone(begin('HIDE3')), `${P}hideout-1`);
    const fought = chooseEvent(content, run, sideId, 0).run;
    expect(fought.battle?.event?.eventId).toBe(`${P}hideout-1`);
    eventBattleLost(content, fought, fought.battle!.event!);
    expect(raidRecord(fought, 2)?.result).toBe('failure');
  });
  it('a result applies once (the second call changes nothing)', () => {
    const run = structuredClone(begin('HIDE2'));
    resolveStoryRaid(content, run, 2, 'success');
    const first = JSON.stringify(run.expansion);
    expect(resolveStoryRaid(content, run, 2, 'failure').alreadyResolved).toBe(true);
    expect(JSON.stringify(run.expansion)).toBe(first);
  });
});
