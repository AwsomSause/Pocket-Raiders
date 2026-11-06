// S502 Z-Trials: every island trial pays the right Z-Crystal and needs a Z-Ring to take.

import { describe, expect, it } from 'vitest';
import { content } from './helpers';

const trials = [...content.events.values()].filter((e) => e.id.startsWith('island-trial-'));

describe('Z-Trials', () => {
  it('there is one trial per type, each in the Z-Trials group', () => {
    expect(trials).toHaveLength(18);
    for (const e of trials) expect(e.group).toBe('Z-Trials');
  });
  it('the fight needs a Z-Ring and pays a real Z-Crystal of the trial type', () => {
    for (const e of trials) {
      const type = e.id.slice('island-trial-'.length);
      const take = e.choices[0]!;
      expect(JSON.stringify(take.requires)).toContain('z-ring');
      const win = JSON.stringify(take);
      const crystal = /"id":"([a-z]+-z)"/.exec(win)?.[1];
      expect(crystal, e.id).toBeTruthy();
      expect(content.items.has(crystal!), crystal).toBe(true);
      expect(content.items.get(crystal!)!.effect, crystal).toMatchObject({ type });
      expect(e.choices.length).toBeGreaterThanOrEqual(2);
    }
  });
});
