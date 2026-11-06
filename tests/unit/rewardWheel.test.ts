import { describe, expect, it } from 'vitest';
import { content } from './helpers';

describe('Free Reward Wheel (S83)', () => {
  const ev = content.events.get('reward-wheel')!;

  it('exists and never takes money to spin', () => {
    expect(ev).toBeDefined();
    for (const c of ev.choices) {
      expect(c.requires.some((r) => r.kind === 'money')).toBe(false);
      for (const o of [c.success, c.failure]) for (const f of o?.effects ?? []) if (f.kind === 'money') expect(f.amount).toBeGreaterThanOrEqual(0);
    }
  });

  it('paints the true odds on each wheel', () => {
    for (const c of ev.choices.filter((x) => x.chance !== undefined)) {
      const shown = Number(/(\d+)%/.exec(c.label)![1]);
      expect(shown).toBe(Math.round(c.chance! * 100));
    }
  });
});
