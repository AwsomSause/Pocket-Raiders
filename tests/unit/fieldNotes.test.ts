// Beta 0.6 Field Notes: recording (special Pokémon, Shadow hints), the view per tab, the save shape and the event effect.

import { describe, expect, it } from 'vitest';
import { FIELD_TABS, fieldNotesView, noteBattle, noteShadow, noteSpecial, syncFieldNotes } from '../../src/core/expansion/fieldNotes';
import { ExpansionRunSchema } from '../../src/core/expansion/schema';
import { earnRom, startGrandArc } from '../../src/core/grandArc';
import { makeNamedShadow } from '../../src/core/shadow2/grant';
import { chooseStarter, createRun } from '../../src/core/run';
import { content } from './helpers';

const run = (seed: string) => {
  const r = chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red' }), 0);
  r.regionOrder[r.regionIndex] = 'kanto';
  return r;
};

describe('noteSpecial', () => {
  it('records a special Pokémon once, ignores unknown ids, and shows its trait only after it is met', () => {
    const r = run('fn-special');
    expect(fieldNotesView(content, r).tabs.special.find((e) => e.id === 'sv.rocket.roadblock')).toMatchObject({ name: '???', known: false });
    expect(noteSpecial(r, 'sv.rocket.roadblock')).toBe(true);
    expect(noteSpecial(r, 'sv.rocket.roadblock')).toBe(false);
    expect(noteSpecial(r, 'sv.nope.nothing')).toBe(false);
    const e = fieldNotesView(content, r).tabs.special.find((x) => x.id === 'sv.rocket.roadblock')!;
    expect(e.known).toBe(true);
    expect(e.name).toBe('The Roadblock');
    expect(e.lines[0]).toMatch(/^Trait:/);
    expect(r.expansion?.fieldNotes?.special).toEqual(['sv.rocket.roadblock']);
  });

  it('shows unmet entries only for the region the run is in, and a met one from any region', () => {
    const r = run('fn-region');
    const kanto = fieldNotesView(content, r).tabs.special.length;
    expect(kanto).toBe(9);
    r.regionOrder[r.regionIndex] = 'johto';
    const johto = fieldNotesView(content, r).tabs.special;
    expect(johto.every((e) => e.id.startsWith('sv.'))).toBe(true);
    expect(johto.find((e) => e.id === 'sv.rocket.roadblock')).toBeUndefined();
    noteSpecial(r, 'sv.rocket.roadblock');
    expect(fieldNotesView(content, r).tabs.special.find((e) => e.id === 'sv.rocket.roadblock')?.known).toBe(true);
  });
});

describe('Shadow hints', () => {
  it('only ever goes up, and shows the key type after hint 1, a clue after 2 and the whole key after 3', () => {
    const r = run('fn-shadow');
    const id = 'ss.rocket.amberjack';
    expect(noteShadow(r, id, 1)).toBe(true);
    expect(noteShadow(r, id, 1)).toBe(false);
    let e = fieldNotesView(content, r).tabs.shadow.find((x) => x.id === id)!;
    expect(e.pips).toBe(1);
    expect(e.lines).toHaveLength(2);
    expect(noteShadow(r, id, 3)).toBe(true);
    expect(noteShadow(r, id, 2)).toBe(false);
    e = fieldNotesView(content, r).tabs.shadow.find((x) => x.id === id)!;
    expect(e.pips).toBe(3);
    expect(e.lines).toHaveLength(4);
    expect(fieldNotesView(content, r).tabs.key.find((x) => x.id === `key.${id}`)?.badge).toBe('Known');
  });

  it('a Shadow in the party is noted at the hints it has earned, and the note survives it leaving', () => {
    const r = run('fn-sync');
    const mon = makeNamedShadow(content, r, 'ss.rocket.amberjack', 20)!;
    mon.shadow = { ...mon.shadow!, hints: 2 };
    r.party.push(mon);
    syncFieldNotes(r);
    r.party.pop();
    const e = fieldNotesView(content, r).tabs.shadow.find((x) => x.id === 'ss.rocket.amberjack')!;
    expect(e.pips).toBe(2);
    expect(e.name).toBe('Amberjack');
  });
});

describe('Data ROMs', () => {
  it('lists nothing when the Grand Arc is off, and shows a held ROM in full while the rest stay hidden', () => {
    const r = run('fn-rom');
    expect(fieldNotesView(content, r).tabs.rom).toEqual([]);
    expect(fieldNotesView(content, r).grandArcOn).toBe(false);
    startGrandArc(r);
    earnRom(r, 'K');
    const v = fieldNotesView(content, r);
    expect(v.counts.rom).toEqual({ have: 1, total: 9 });
    expect(v.tabs.rom.find((e) => e.id === 'rom.K')).toMatchObject({ known: true, badge: 'Held' });
    expect(v.tabs.rom.find((e) => e.id === 'rom.J')).toMatchObject({ known: false, name: 'ROM J · ???' });
  });
});

describe('save shape', () => {
  it('is optional (an old run has none), validates, and the view never throws on any tab', () => {
    expect(ExpansionRunSchema.safeParse({}).success).toBe(true);
    expect(ExpansionRunSchema.safeParse({ fieldNotes: { special: ['sv.rocket.ledger'], shadow: { 'ss.rocket.m2': 1 } } }).success).toBe(true);
    expect(ExpansionRunSchema.safeParse({ fieldNotes: { shadow: { x: 9 } } }).success).toBe(false);
    const v = fieldNotesView(content, run('fn-empty'));
    for (const t of FIELD_TABS) expect(v.tabs[t]).toBeDefined();
  });
});

describe('noteBattle (a normal Kanto run fills the tabs)', () => {
  const withBattle = (seed: string, battle: unknown) => {
    const r = run(seed);
    (r as { battle: unknown }).battle = battle;
    return r;
  };
  const foe = (speciesId: string, uid = 'e1') => ({ uid, speciesId });

  it('notes a Black-Label Pokémon of a listed species, and not a plain one or one of another line', () => {
    const r = withBattle('fn-b1', { enemyTeam: [foe('raticate', 'a'), foe('persian', 'b'), foe('rhydon', 'c')], extra: { variants: { a: { line: 'tagged' }, c: { line: 'dark-ball' } } } });
    noteBattle(content, r);
    expect(r.expansion?.fieldNotes?.special).toEqual(['sv.rocket.big-tab']);
  });

  it('notes a Named Shadow on the foe side at its hints, and a Colossus Apex', () => {
    const r = withBattle('fn-b2', { enemyTeam: [{ ...foe('aerodactyl'), shadow: { heart: 60, named: 'ss.rocket.amberjack', hints: 2 } }], extra: { variants: {} }, colossus: { id: 'ss.rocket.m2' } });
    noteBattle(content, r);
    expect(r.expansion?.fieldNotes?.shadow).toEqual({ 'ss.rocket.amberjack': 2, 'ss.rocket.m2': 1 });
  });

  it('a won or joined Convoy ledger notes LEDGER; a lost one does not', () => {
    const r = run('fn-ledger');
    r.expansion = { ...r.expansion, cut: { ledger: 'none' } };
    syncFieldNotes(r);
    expect(r.expansion?.fieldNotes).toBeUndefined();
    r.expansion = { ...r.expansion, cut: { ledger: 'won' } };
    syncFieldNotes(r);
    expect(r.expansion?.fieldNotes?.special).toEqual(['sv.rocket.ledger']);
  });

  it('every Kanto special Pokémon with a team line can be reached by some variant rule', () => {
    const kanto = fieldNotesView(content, run('fn-all')).tabs.special;
    expect(kanto.length).toBe(9);
  });
});
