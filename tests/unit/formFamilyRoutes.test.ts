// Spooky forms have their own clue chain and battle (not only a starter set). The Delta and Z routes were rebuilt by the
// Catalog Overhaul Pack (Linden's Delta Study, the Z sigils): tests/unit/coLegendsDelta.test.ts and coLegendsZ.test.ts.

import { describe, expect, it } from 'vitest';
import { eligibleEvents } from '../../src/core/events';
import { chooseStarter, createRun } from '../../src/core/run';
import { specialFamily } from '../../src/core/specialForms';
import { content } from './helpers';

// Catalog Overhaul (SF24 The Hollow Lantern): the Spooky route is a lantern chain now, not a clue counter.
// The first light shows in Autumn; once the lantern is lit, the Coven's detour battle (Spooky forms) waits, once.
function spooky(flags: Record<string, number>) {
  const run = chooseStarter(content, createRun(content, { runId: 'r', seed: 'form-family', archetypeId: 'red' }), 0);
  run.clock.day = content.balance.clock.seasonLength * 2 + 1; // Autumn
  run.stage!.index = 4;
  for (const [k, v] of Object.entries(flags)) run.story.flags[`ev:${k}`] = v;
  return eligibleEvents(content, run).map((e) => e.id).filter((id) => id.startsWith('spooky-light') || id.startsWith('spooky-detour'));
}

describe('spooky route', () => {
  it('shows the first light, then only the battle once the lantern is lit, once', () => {
    expect(spooky({})).toContain('spooky-light-one');
    expect(spooky({})).not.toContain('spooky-detour-battle');
    expect(spooky({ 'lantern-on': 1, 'lantern-held': 1 })).toEqual(['spooky-detour-battle']);
    expect(spooky({ 'lantern-on': 1, 'lantern-held': 1, 'lantern-coven1': 1 })).toEqual([]);
  });
  it('battle foes are all Spooky forms, and winning opens Spooky forms to eggs and trades', () => {
    const battle = content.events.get('spooky-detour-battle')!.choices[0]!.success.battle!;
    const team = (battle as { team?: string[] }).team ?? [];
    expect(team.length).toBeGreaterThan(4);
    for (const id of team) expect(specialFamily(content.species.get(id)!), id).toBe('spooky');
    expect(battle.win.some((e) => e.kind === 'flag' && e.key === 'spooky-met')).toBe(true);
  });
});
