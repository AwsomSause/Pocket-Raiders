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
  it('all six catalog spaces have a gate, and every target exists and is reachable', () => {
    const gates = ['mart', 'gamecorner', 'mansion', 'eevee', 'tea', 'perfume', 'rooftop'];
    for (const g of gates) expect(room(g).canon).toBe(`cs.kanto.celadon.${g === 'mart' ? 'mart' : g}`);
    const ids = [...content.events.keys()].filter((id) => id.startsWith(P));
    const targets = (id: string) => content.events.get(id)!.choices.flatMap((c) => [c.success, c.failure]).flatMap((o) => [...(o?.effects ?? []), ...(o?.battle?.win ?? [])]).flatMap((e) => (e.kind === 'addEvent' ? [e.eventId] : e.kind === 'addEventFrom' ? e.ids : []));
    const reach = new Set<string>(gates.map((g) => `${P}${g}`));
    for (let again = true; again;) { again = false; for (const id of [...reach]) for (const t of targets(id)) { expect(content.events.has(t), `${id} -> ${t}`).toBe(true); if (!reach.has(t)) { reach.add(t); again = true; } } }
    expect([...reach].sort()).toEqual(ids.sort());
  });
});

describe('Department Store', () => {
  it('the Trainer\'s Market sells Potions for money', () => {
    const { before, out } = pick('mart-f2', 0);
    expect(out.money).toBe(before.money - 540);
    expect(count(out, 'potion')).toBe(count(before, 'potion') + 3);
  });
  it('a purchase is refused without the money (boundary)', () => {
    expect(room('mart-f5').choices[0]!.requires).toContainEqual({ kind: 'money', atLeast: 4500 });
  });
  it('the stone floor sells all five Kanto stones at 1.5x the shop price', () => {
    const ids = choicesOf('mart-f5').flatMap((c) => c.success.effects.filter((e) => e.kind === 'item').map((e) => (e as { id: string }).id));
    expect(ids).toEqual(['fire-stone', 'water-stone', 'thunder-stone', 'leaf-stone', 'moon-stone']);
  });
  it('the TM counter rotates between shelves of five TMs each', () => {
    const from = room('mart-f3').choices[0]!.success.effects.find((e) => e.kind === 'addEventFrom') as { ids: string[] };
    expect(from.ids.length).toBeGreaterThan(1);
    for (const id of from.ids) expect(choicesOf(id.replace(P, '')).filter((c) => c.success.effects.some((e) => e.kind === 'item')).length).toBe(5);
  });
  it('the service counter heals the party', () => {
    const base = structuredClone(begin('SV')); base.money = 500; base.party[0]!.hp = 1;
    const { run, sideId } = debugForceEvent(content, base, `${P}mart-f1`);
    const out = chooseEvent(content, run, sideId, 0).run;
    expect(out.party[0]!.hp).toBeGreaterThan(1);
    expect(out.money).toBe(350);
  });
});

describe("Erika's tea (new restorePp effect)", () => {
  it('restores PP and cures status for the team', () => {
    const base = structuredClone(begin('TEA')); base.money = 500;
    base.party[0]!.moves[0]!.pp = 0; base.party[0]!.status = { id: 'psn' };
    const { run, sideId } = debugForceEvent(content, base, `${P}tea`);
    const out = chooseEvent(content, run, sideId, 0).run;
    expect(out.party[0]!.moves[0]!.pp).toBeGreaterThan(0);
    expect(out.party[0]!.status).toBeNull();
    expect(out.money).toBe(350);
  });
});

describe('Rooftop Vending', () => {
  it('sells the three drinks as real bag items at ₽200 / 275 / 350, healing 30 / 50 / 70 HP when used', () => {
    [['rooftop-fresh-water', 200, 30], ['rooftop-soda-pop', 275, 50], ['rooftop-lemonade', 350, 70]].forEach(([id, cost, hp], i) => {
      const { before, out } = pick('rooftop', i, 'RF', 1000);
      expect(out.money).toBe(before.money - (cost as number));
      expect(out.inventory[id as string]).toBe(1);
      expect((content.items.get(id as string)!.effect as { amount: number }).amount).toBe(hp);
    });
  });
});

describe('Eeveelution Brothers', () => {
  it('the stone you take decides the Eeveelution, and the other brother fights', () => {
    const want: [string, string][] = [['vaporeon', 'flareon'], ['jolteon', 'vaporeon'], ['flareon', 'jolteon']];
    want.forEach(([mon, angry], i) => {
      const b = room('eevee-3').choices[i]!.success.battle as { team: string[]; win: { kind: string; species?: string[] }[] };
      expect(b.team).toEqual([angry]);
      expect(b.win).toContainEqual(expect.objectContaining({ kind: 'join', species: [mon] }));
    });
  });
  it('the fourth brother adds Leafeon and Glaceon', () => {
    const joins = choicesOf('eevee-4').flatMap((c) => (c.success.battle?.win ?? []).filter((e) => e.kind === 'join').flatMap((e) => (e as { species: string[] }).species));
    expect(joins).toEqual(expect.arrayContaining(['leafeon', 'glaceon']));
  });
  it('the fourth brother turns up about 25% of the time', () => {
    let four = 0;
    for (let i = 0; i < 80; i++) {
      const base = structuredClone(begin('EV')); base.seed = `EV${i}`;
      const { run, sideId } = debugForceEvent(content, base, `${P}eevee`);
      const out = chooseEvent(content, run, sideId, 0).run;
      if (JSON.stringify(out.stage).includes('eevee-4')) four++;
    }
    expect(four).toBeGreaterThan(5); expect(four).toBeLessThan(40);
  });
});

describe('Mansion, Game Corner, Perfume', () => {
  it('the mansion lobby gives an Eevee', () => {
    const { before, out } = pick('mansion-1', 0);
    expect(out.party.length + (out.box?.length ?? 0) + out.pending.length).toBe(before.party.length + (before.box?.length ?? 0) + before.pending.length + 1);
  });
  it('the Perfume Heist is a double fight against Rocket Remnants paying a Perfume Vial', () => {
    const b = room('perfume').choices[0]!.success.battle as { format: string; evilTeam: string; win: { kind: string; id?: string }[] };
    expect(b.format).toBe('doubles');
    expect(b.evilTeam).toBe('rocket-remnants');
    expect(b.win).toContainEqual(expect.objectContaining({ kind: 'item', id: 'perfume-vial' }));
    expect(content.catalog.has('perfume-vial')).toBe(true);
  });
  it('the slots cost the stake, and the big machine loses Luck on a bust', () => {
    const e = room('gamecorner').choices[2]!;
    expect(e.requires).toContainEqual({ kind: 'money', atLeast: 400 });
    expect(e.failure!.effects).toContainEqual({ kind: 'stageAttribute', key: 'luck', amount: -1 });
  });
  it('the prize counter has five tiers in both stocks', () => {
    for (const k of ['a', 'b']) expect(choicesOf(`prizes-${k}`).filter((c) => c.success.effects.some((e) => e.kind === 'join')).length).toBe(5);
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
  it('the Doll Floor puts it in the bag', () => {
    const { before, out } = pick('mart-f6', 0);
    expect(out.inventory['poke-doll-escape']).toBe((before.inventory['poke-doll-escape'] ?? 0) + 1);
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
  it('a bust at the big machine uses it', () => {
    const e = room('gamecorner').choices[2]!;
    expect(e.failure!.effects).toContainEqual({ kind: 'stageAttribute', key: 'luck', amount: -1 });
  });
});

describe('Diploma from the Pokédex', () => {
  const at = (seen: number) => { const run = structuredClone(begin('DEX')); run.log.speciesSeen = Array.from({ length: seen }, (_, i) => `sp${i}`); return run; };
  it('the dex condition counts species seen this run (boundary 11 / 12)', () => {
    expect(conditionMet(content, at(11), { kind: 'dex', set: 'seen', atLeast: 12 })).toBe(false);
    expect(conditionMet(content, at(12), { kind: 'dex', set: 'seen', atLeast: 12 })).toBe(true);
  });
  it('the Game Freak room offers the Diploma at 12 seen and the Gold Diploma at 25 seen', () => {
    const [gold, plain] = room('mansion-2').choices;
    expect(gold!.requires).toContainEqual({ kind: 'dex', set: 'seen', atLeast: 25 });
    expect(plain!.requires).toContainEqual({ kind: 'dex', set: 'seen', atLeast: 12 });
    const base = at(12);
    const { run, sideId } = debugForceEvent(content, base, `${P}mansion-2`);
    const out = chooseEvent(content, run, sideId, 1).run;
    expect(out.story.flags['relic:celadon-diploma']).toBeTruthy();
  });
});

describe('The Celadon Hideout (Story Raid 2)', () => {
  const gate = () => room('gamecorner-p2').choices.find((c) => c.label.startsWith('Try the machine in the back'))!;
  it('the back machine needs a Rocket run and an unresolved Raid 2', () => {
    expect(gate().requires).toEqual([{ kind: 'evil', team: 'rocket' }, { kind: 'storyRaid', n: 2 }]);
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
