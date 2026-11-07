import { describe, expect, it } from 'vitest';
import { buildContent } from '../../src/data';
import { planFirstRival } from '../../src/core/encounters';
import { homeStarters, signatureOf } from '../../src/core/rivals/home';
import { canonPlan } from '../../src/core/rivals/major';
import { familyId } from '../../src/core/mastery';
import { maybeSpark } from '../../src/core/rivals/manager';
import { RIVAL_CONFIG } from '../../src/core/rivals/schema';

const content = buildContent();
const names = content.trainers.get('rival')!.names;

describe('first rival: home region and signature Pokémon (Kice 2026-11-07)', () => {
  it('the rival class lists Hugh, Brendan, May, N and Lillie', () => {
    for (const n of ['Hugh', 'Brendan', 'May', 'N', 'Lillie']) expect(names).toContain(n);
  });
  it('the ace comes from the rival\'s home region and the opener is a regional starter or the signature', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 400; i++) {
      const plan = planFirstRival(content, `home${i}`);
      const starters = homeStarters(plan.name)!;
      expect(starters, plan.name).toBeTruthy();
      expect(starters).toContain(plan.members[1]!.speciesId);
      const sig = signatureOf(plan.name);
      if (sig) expect(plan.members[0]!.speciesId).toBe(sig.species);
      else expect(starters).toContain(plan.members[0]!.speciesId);
      seen.add(plan.name);
    }
    expect([...seen].sort()).toEqual([...names].sort());
  });
  it('N has Zorua, Wally Ralts, Gladion Type: Null, Lillie Cosmog and Hop Wooloo', () => {
    const want: Record<string, string> = { N: 'zorua', Wally: 'ralts', Gladion: 'type-null', Lillie: 'cosmog', Hop: 'wooloo' };
    const found: Record<string, string> = {};
    for (let i = 0; i < 600 && Object.keys(found).length < 5; i++) {
      const plan = planFirstRival(content, `sig${i}`);
      if (want[plan.name]) found[plan.name] = plan.members[0]!.speciesId;
    }
    expect(found).toEqual(want);
  });
  it('later meetings keep the signature Pokémon, except Hop\'s Wooloo', () => {
    const base = planFirstRival(content, 'ret');
    const rival = (name: string, ace: string) => ({ major: true, name, canon: name, ace }) as never;
    for (const [name, sp, keeps] of [['N', 'zorua', true], ['Wally', 'ralts', true], ['Gladion', 'type-null', true], ['Lillie', 'cosmog', true], ['Hop', 'wooloo', false]] as const) {
      const plan = canonPlan(content, rival(name, 'grookey'), { ...base, members: [{ speciesId: 'rattata', level: 12 }, { speciesId: 'pidgey', level: 12 }, { speciesId: 'grookey', level: 12 }] });
      const families = plan.members.map((m) => familyId(content, m.speciesId));
      expect(families.includes(familyId(content, sp)), name).toBe(keeps);
    }
  });
});

describe('a run keeps four live rivals', () => {
  it('forces a spark from an ordinary win when fewer than the target are still rivals', () => {
    expect(RIVAL_CONFIG.activeTarget).toBe(4);
    const run = { seed: 's', story: { rivals: [{ id: 'rival-major', major: true, state: 'recurring', origin: { where: { region: 0, stage: 0 } } }] } } as never;
    const input = { where: { region: 0, stage: 0 }, classId: 'youngster', name: 'Joey', team: ['rattata'], ended: { id: 'e1' }, hpLeftShare: 1, turns: 9, flawless: false, returning: false } as never;
    const rival = maybeSpark(run, input);
    expect(rival?.name).toBe('Joey');
  });
});
