import { describe, expect, it } from 'vitest';
import {
  crossCheckCatalogs,
  loadOverhaulLines,
  overhaulCatalogs,
  OverhaulDataError,
  parseOverhaulCatalogs,
  RAW_OVERHAUL_CATALOGS,
} from '../../src/core/overhaul/catalogs';
import { content } from './helpers';

const catalogs = overhaulCatalogs();
const clone = () => structuredClone(RAW_OVERHAUL_CATALOGS) as Record<string, { entries: Record<string, unknown>[] }>;

describe('Overhaul pack: catalogs (slice 1, data only)', () => {
  it('every catalog passes its schema and keeps the pack counts', () => {
    expect(catalogs.milestones.entries).toHaveLength(135);
    expect(catalogs.titles.entries).toHaveLength(121);
    expect(catalogs.personalities.entries).toHaveLength(58);
    expect(catalogs.quirks.entries).toHaveLength(54);
    expect(catalogs.relationship_types.entries).toHaveLength(53);
    expect(catalogs.team_chemistry.entries).toHaveLength(185);
    expect(catalogs.battle_environments.entries).toHaveLength(70);
    expect(catalogs.battlefield_conditions.entries).toHaveLength(55);
    expect(catalogs.growth_paths.entries).toHaveLength(106);
    expect(catalogs.move_mastery_ideas.entries).toHaveLength(123);
    expect(catalogs.run_titles.entries).toHaveLength(59);
    expect(catalogs.trainer_archetypes.entries).toHaveLength(250);
    expect(catalogs.major_trainers.entries).toHaveLength(214);
    expect(catalogs.signature_moments_library.entries).toHaveLength(157);
    expect(catalogs.event_chains.entries).toHaveLength(180);
    // 456 in the pack, minus 2 fan-made items and 2 "Stick" pairings.
    expect(catalogs.item_synergies.entries).toHaveLength(452);
  });

  it('nothing is switched on yet: every file is "disabled" with a source', () => {
    for (const file of Object.values(catalogs)) {
      expect(file.status).toBe('disabled');
      expect(file.source).toMatch(/overhaul_content_pack_2\.zip/);
    }
  });

  it('event chains keep the 50/40/30/20/20/20 split and every stage has a real choice', () => {
    const by: Record<string, number> = {};
    for (const c of catalogs.event_chains.entries) by[c.rarity] = (by[c.rarity] ?? 0) + 1;
    expect(by).toEqual({ common: 50, uncommon: 40, rare: 30, very_rare: 20, unique: 20, legendary: 20 });
    for (const c of catalogs.event_chains.entries) for (const s of c.stages) expect(s.options.length).toBeGreaterThanOrEqual(2);
  });

  it('cross-run entries stay off (director decision C: no memory across runs)', () => {
    expect(catalogs.milestones.entries.find((m) => m.id === 'M-VETERAN')?.disabled).toMatch(/Cross-run/);
    expect(catalogs.signature_moments_library.entries.find((m) => m.id === 'legend-guest')?.disabled).toMatch(/Cross-run/);
  });

  it('the review fixes stay fixed', () => {
    const syn = catalogs.item_synergies.entries;
    // Z-Crystals are no longer described as Arceus plates.
    for (const s of syn.filter((x) => / Z$/.test(x.item))) expect(s.text, s.id).not.toMatch(/Arceus|20%/);
    expect(syn.some((s) => s.item === 'Stick' || s.item === 'Crucibellite' || s.item === 'Vile Vial')).toBe(false);
    const allText = JSON.stringify(catalogs);
    expect(allText).not.toMatch(/\ba [AEIOU](?!ni|nova|ltra|se)\w/);
    const ids = catalogs.trainer_archetypes.entries.map((a) => a.id);
    expect(ids).toContain('shadow-agent');
    expect(ids).toContain('spirit-caller');
    expect(ids).not.toContain('assassin');
    expect(ids).not.toContain('necromancer');
    expect(ids).toContain('warlord'); // the director kept this one
    expect(catalogs.signature_moments_library.entries.find((m) => m.id === 'champion-throne')?.scene).not.toMatch(/\b(her|his|she|he)\b/);
  });

  it('matched ids point at real game data', () => {
    for (const t of catalogs.major_trainers.entries) {
      if (t.bossId) expect(content.bosses.has(t.bossId), t.id).toBe(true);
      if (t.aceId) expect(content.species.has(t.aceId), t.ace).toBe(true);
    }
    for (const m of catalogs.move_mastery_ideas.entries) if (m.moveId) expect(content.moves.has(m.moveId), m.move).toBe(true);
    for (const c of catalogs.team_chemistry.entries) for (const s of c.speciesIds) expect(content.species.has(s), `${c.id}: ${s}`).toBe(true);
    // Most of the pack matches: these floors catch a broken name matcher.
    expect(catalogs.major_trainers.entries.filter((t) => t.bossId).length).toBeGreaterThanOrEqual(170);
    expect(catalogs.move_mastery_ideas.entries.filter((m) => m.moveId).length).toBeGreaterThanOrEqual(115);
    expect(catalogs.item_synergies.entries.filter((s) => s.usable).length).toBeGreaterThanOrEqual(300);
    expect(catalogs.team_chemistry.entries.filter((c) => c.complete).length).toBeGreaterThanOrEqual(170);
  });

  it('battle environments never move power by more than 10%', () => {
    for (const e of catalogs.battle_environments.entries) expect(e.mechanic).toMatch(/^(none|pow:[A-Za-z/]+:[+-]10)$/);
  });

  it('rejects a broken catalog with a readable error (failure case)', () => {
    const raw = clone();
    raw.titles!.entries[0]!.requires = 'M-NOT-REAL';
    expect(() => parseOverhaulCatalogs(raw as never)).toThrow(/unknown milestone "M-NOT-REAL"/);

    const raw2 = clone();
    raw2.battlefield_conditions!.entries[0]!.duration = 9;
    expect(() => parseOverhaulCatalogs(raw2 as never)).toThrow(OverhaulDataError);

    const raw3 = clone();
    raw3.milestones!.entries.push(structuredClone(raw3.milestones!.entries[0]!));
    expect(() => parseOverhaulCatalogs(raw3 as never)).toThrow(/duplicate id "M-FIRST"/);
  });

  it('cross-check finds a flag set twice and an empty pool (boundary)', () => {
    const c = structuredClone(catalogs);
    const opt = c.event_chains.entries[0]!.stages[0]!.options;
    opt[1]!.sets = [...opt[0]!.sets];
    c.run_titles.pools = {};
    const problems = crossCheckCatalogs(c);
    expect(problems.some((p) => p.includes('set by two options'))).toBe(true);
    expect(problems.some((p) => p.includes('missing pool'))).toBe(true);
  });
});

describe('Overhaul pack: generated lines (loaded on demand)', () => {
  it('every line file passes its schema and links to the catalogs', async () => {
    const [arch, trainer, reactions, moments] = await Promise.all([
      loadOverhaulLines('archetype_lines'),
      loadOverhaulLines('major_trainer_lines'),
      loadOverhaulLines('contextual_reactions'),
      loadOverhaulLines('species_signature_moments'),
    ]);
    const archetypeIds = new Set(catalogs.trainer_archetypes.entries.map((a) => a.id));
    for (const l of arch.entries) expect(archetypeIds.has(l.archetype), l.id).toBe(true);
    const trainerIds = new Set(catalogs.major_trainers.entries.map((t) => t.id));
    for (const l of trainer.entries) expect(trainerIds.has(l.trainer), l.id).toBe(true);
    const personalityIds = new Set(catalogs.personalities.entries.map((p) => p.id));
    const quirkIds = new Set(catalogs.quirks.entries.map((q) => q.id));
    for (const r of reactions.entries) {
      if (r.personality) expect(personalityIds.has(r.personality), r.id).toBe(true);
      if (r.quirk) expect(quirkIds.has(r.quirk), r.id).toBe(true);
    }
    // Every species moment names a species the game has.
    for (const m of moments.entries) expect(m.speciesId && content.species.has(m.speciesId), m.species).toBeTruthy();
    expect(arch.entries.length).toBeGreaterThanOrEqual(6000);
    expect(trainer.entries.length).toBeGreaterThanOrEqual(11000);
    expect(reactions.entries.length).toBeGreaterThanOrEqual(2000);
    expect(moments.entries.length).toBeGreaterThanOrEqual(8000);
  });

  it('broken template lines, "a Electric" and his/her are gone', async () => {
    const trainer = await loadOverhaulLines('major_trainer_lines');
    const moments = await loadOverhaulLines('species_signature_moments');
    for (const l of trainer.entries) {
      expect(l.text, l.id).not.toMatch(/even if I am just |dreams are made of/);
      expect(l.text, l.id).not.toMatch(/\b(his|her)\b/);
    }
    for (const l of [...trainer.entries.map((x) => x.text), ...moments.entries.map((x) => x.scene)]) expect(l).not.toMatch(/\ba [AEIOU](?!ni|nova|ltra|se)\w/);
    // No line in a trainer's own list repeats.
    const seen = new Set<string>();
    for (const l of trainer.entries) {
      const key = `${l.trainer}|${l.text}`;
      expect(seen.has(key), key).toBe(false);
      seen.add(key);
    }
  });
});
