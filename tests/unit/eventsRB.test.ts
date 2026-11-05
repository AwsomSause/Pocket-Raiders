import { describe, expect, it } from 'vitest';
import { buildContent } from '../../src/data';
import { RB_EVENTS } from '../../tools/events/trainerB.ts';
import { RB2_EVENTS } from '../../tools/events/trainerB2.ts';

describe('Run events B (trainer battles)', () => {
  const content = buildContent();
  it('every event is in the content and has a way out', () => {
    for (const e of [...RB_EVENTS, ...RB2_EVENTS]) {
      const found = content.events.get(String(e.id));
      expect(found, String(e.id)).toBeDefined();
      expect(found!.choices.length).toBeGreaterThanOrEqual(2);
    }
  });
  it('keeps the weather and chain-heal extras on the battle', () => {
    const umbrella = content.events.get('umbrella-squad')!.choices[0]!.success.battle!;
    expect(umbrella.kind === 'trainer' && umbrella.weather).toBe('rain');
    const relay = content.events.get('relay-battle')!.choices[0]!.success.battle!;
    expect(relay.kind === 'trainer' && relay.chainHeal).toBe(0.1);
    expect(relay.chain).toBe(3);
  });
  it('batch 2 uses the next-fight modifiers and a three-rung ladder', () => {
    const bike = JSON.stringify(content.events.get('trainer-on-a-bike')!.choices[0]!.success);
    expect(bike).toContain('tempEffect');
    expect(bike).toContain('firstStrike');
    expect(content.events.get('ranked-ladder-3')!.requires.length).toBeGreaterThan(0);
  });
});
