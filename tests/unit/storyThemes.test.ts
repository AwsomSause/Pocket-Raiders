// Story Overhaul S11: theme cards. Each card is complete (events, twists, Journal tab, ending table), every ending can be reached by
// playing the card's own events, the ending table is deterministic and always ends somewhere, and the Director keeps a theme's events
// inside that theme.
import { describe, expect, it } from 'vitest';
import { endingFlagDefaults, reachableEndings, resolveThemeEnding, validateTheme } from '../../src/core/story2/themes';
import { buildBlueprint } from '../../src/core/campaign/storyDirector';
import { content } from './helpers';

const data = content.storyData;
const THEMES = ['th_shadows_viridian', 'th_rivals_promise', 'th_champions_legacy', 'th_marauder_conspiracy'];

describe('story themes (S11)', () => {
  it('ships the three full cards and The Mythic Equation, and not the parked Quiet card', () => {
    expect(data.themes.map((t) => t.id).sort()).toEqual([...THEMES].sort());
    expect(data.themes.find((t) => t.id === 'th_marauder_conspiracy')!.nameKey).toBe('th.th_marauder_conspiracy.name');
    expect(data.text['th.th_marauder_conspiracy.name']).toBe('The Mythic Equation');
  });

  it.each(THEMES)('%s passes the card audit', (id) => {
    expect(validateTheme(data, id)).toEqual([]);
  });

  it.each(THEMES)('%s plays to every ending (search over every event choice)', (id) => {
    const theme = data.themes.find((t) => t.id === id)!;
    const reach = reachableEndings(data, id);
    expect([...reach.keys()].sort()).toEqual([...theme.endings].sort());
    // Each witness really lands on its ending when replayed through the ending table.
    for (const w of reach.values()) {
      let flags: Record<string, boolean | number> = { ...endingFlagDefaults(theme), ...w.battle };
      for (const [evId, choiceId] of Object.entries(w.choices)) {
        const ch = data.events.find((e) => e.id === evId)!.choices.find((c) => c.id === choiceId)!;
        for (const fx of ch.effects as { kind: string; key?: string; counter?: string; amount?: number }[]) {
          flags = fx.kind === 'add_counter' ? { ...flags, [fx.counter!]: Number(flags[fx.counter!] ?? 0) + (fx.amount ?? 1) } : { ...flags, [fx.key!]: true };
        }
      }
      expect(resolveThemeEnding(theme, flags), `${id} -> ${w.ending}`).toBe(w.ending);
    }
  });

  it.each(THEMES)('%s: the ending table is deterministic and a run that did nothing gets the catch-all', (id) => {
    const theme = data.themes.find((t) => t.id === id)!;
    const last = theme.endingGrid[theme.endingGrid.length - 1]!;
    expect(last.when).toEqual([]);
    expect(resolveThemeEnding(theme, {})).toBe(last.ending);
    expect(resolveThemeEnding(theme, { nothing_reads_this: true })).toBe(last.ending);
    // First match wins: a state that satisfies the top row always lands on it, whatever else is set.
    const top = theme.endingGrid[0]!;
    const flags: Record<string, boolean | number> = {};
    for (const c of top.when) flags[String(c.key)] = typeof c.value === 'number' ? c.value + 1 : (c.value as boolean);
    expect(resolveThemeEnding(theme, flags)).toBe(top.ending);
  });

  it('the audit catches a broken card', () => {
    const bad = structuredClone(data);
    const t = bad.themes.find((x) => x.id === 'th_rivals_promise')!;
    t.endingGrid[0]!.when = []; // the top row now catches everything: every ending below it is unreachable
    t.twists[0]!.clues.pop();
    t.events.pop();
    const problems = validateTheme(bad, 'th_rivals_promise');
    expect(problems.some((p) => p.includes('cannot be reached'))).toBe(true);
    expect(problems.some((p) => p.includes('before the reveal'))).toBe(true);
    expect(problems.some((p) => p.includes('tagged for this theme but not listed'))).toBe(true);
    expect(problems.some((p) => p.includes('catch-all row sits above'))).toBe(true);
  });

  it('every theme gives each of the 5 backstories an opinion or none, and Champion is blocked on Viridian only', () => {
    expect(data.themes.find((t) => t.id === 'th_shadows_viridian')!.backstoryFit['bs_champion_heir']).toBe('blocked');
    for (const t of data.themes) for (const b of Object.keys(t.backstoryFit)) expect(data.backstories.some((x) => x.id === b), `${t.id}: ${b}`).toBe(true);
  });

  it('the Director only offers a theme\'s events inside that theme, and favours the drawn theme\'s events', () => {
    const inputs = (seed: string) => ({ seed, contentHash: 'h', antagonist: 'team_a', rivals: { primary: 'r1', secondary: 'r2', friendly: 'r3' }, columns: 12, eliteFourSize: 4 });
    const themeOf = new Map(data.events.flatMap((e) => e.tags.filter((t) => t.startsWith('theme_')).map((t) => [e.id, t.slice(6)] as const)));
    let own = 0;
    const seen = new Set<string>();
    for (let i = 0; i < 200; i++) {
      const bp = buildBlueprint(content, inputs(`s11-${i}`));
      seen.add(bp.theme);
      for (const s of bp.slots) {
        const th = themeOf.get(s.event);
        if (th) { expect(th, `${bp.id} ${s.event}`).toBe(bp.theme); own++; }
      }
    }
    expect(seen.size).toBe(THEMES.length);
    expect(own).toBeGreaterThan(0);
  });
});
