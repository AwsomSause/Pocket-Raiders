import { describe, expect, it } from 'vitest';
import { allowedTemplates, bandFor, pickTemplate, recentTemplates, rememberTemplate, ROLE_IDS, speciesRoles, templateFit, TEAM_TEMPLATES } from '../../src/core/teamTemplates';
import { planTrainer } from '../../src/core/encounters';
import { getArchetype } from '../../src/core/archetypes';
import { Rng, hashSeed } from '../../src/core/rng';
import { content, scaleAt } from './helpers';

describe('trainer team templates', () => {
  it('has 17 templates and gives every species at least one role', () => {
    expect(TEAM_TEMPLATES.templates).toHaveLength(17);
    for (const s of content.species.values()) expect(speciesRoles(content, s.id).size, s.id).toBeGreaterThan(0);
  });
  it('finds species for every role', () => {
    const found = new Set<string>();
    for (const s of content.species.values()) for (const r of speciesRoles(content, s.id)) found.add(r);
    for (const r of ROLE_IDS) expect(found.has(r), r).toBe(true);
  });
  it('unlocks trickier templates later', () => {
    expect(bandFor(1)).toBe('early');
    expect(allowedTemplates(1).every((t) => t.from === 'early')).toBe(true);
    expect(allowedTemplates(1).length).toBeLessThan(allowedTemplates(4).length);
    expect(allowedTemplates(9)).toHaveLength(17);
  });
  it('picks repeatably, and turns down a template used just now', () => {
    expect(pickTemplate(5, 'x').id).toBe(pickTemplate(5, 'x').id);
    const base = TEAM_TEMPLATES.templates.find((t) => t.id === 'balanced')!;
    let hits = 0;
    for (let i = 0; i < 400; i++) if (pickTemplate(9, `s${i}`, [base.id]).id === base.id) hits++;
    let free = 0;
    for (let i = 0; i < 400; i++) if (pickTemplate(9, `s${i}`).id === base.id) free++;
    expect(hits).toBeLessThan(free);
  });
  it('remembers recent templates in order (shared variety history)', () => {
    const run = { history: {} as Record<string, string[]> };
    rememberTemplate(content, run, 'stall');
    rememberTemplate(content, run, 'weather');
    rememberTemplate(content, run, 'stall');
    expect(recentTemplates(run)).toEqual(['stall', 'weather', 'stall']);
  });
  it('keeps every fit above zero and monotype leans on the type', () => {
    const mono = TEAM_TEMPLATES.templates.find((t) => t.id === 'monotype')!;
    const fire = [...content.species.values()].find((s) => s.types.length === 1 && s.types[0] === 'fire')!;
    const grass = [...content.species.values()].find((s) => s.types.length === 1 && s.types[0] === 'grass')!;
    const ctx = { picked: [], types: ['fire'] };
    expect(templateFit(content, mono, fire.id, ctx)).toBeGreaterThan(templateFit(content, mono, grass.id, ctx));
    for (const t of TEAM_TEMPLATES.templates) expect(templateFit(content, t, fire.id, ctx)).toBeGreaterThan(0);
  });
  it('plans a trainer the same way every time, with a template and a valid team', () => {
    const archetype = getArchetype(content, 'red');
    const scale = scaleAt(0, 1);
    for (const theme of [...content.themes.values()].slice(0, 12)) {
      const plan = () => planTrainer(content, archetype, theme, 5, scale, new Rng(hashSeed(theme.id)), undefined, `seed::${theme.id}`, []);
      const a = plan();
      expect(plan()).toEqual(a);
      expect(a.templateId).toBeTruthy();
      expect(a.members.length).toBeGreaterThan(0);
      for (const m of a.members) expect(content.species.has(m.speciesId)).toBe(true);
    }
  });
  it('plans nothing new when the seed is not given', () => {
    const archetype = getArchetype(content, 'red');
    const theme = [...content.themes.values()][0]!;
    expect(planTrainer(content, archetype, theme, 5, scaleAt(0, 1), new Rng(hashSeed('z'))).templateId).toBeUndefined();
  });
});
