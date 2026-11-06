// Story S12: every backstory passes the Module Validator, the parity audit and the ending-grid check (no gap, every ending reachable).
import { describe, expect, it } from 'vitest';
import { endingGridReport, parityAudit, pickEnding } from '../../src/core/story2/endingGrid';
import { validateModule } from '../../src/core/story2/moduleValidator';
import { content } from './helpers';

const data = content.storyData;
describe('backstory parity (S12)', () => {
  for (const b of data.backstories) {
    it(`${b.id} passes the validator and parity audit`, () => {
      expect(validateModule(data, b.id)).toEqual([]);
      expect(parityAudit(data, b.id)).toEqual([]);
    });
  }
  it('ending-grid check catches a gap and a dead ending', () => {
    const dead = [{ ending: 'a', when: [{ kind: 'flag', key: 'x', op: '>=', value: 5 }] }, { ending: 'b', when: [{ kind: 'flag', key: 'x', op: '>=', value: 9 }] }, { ending: 'c', when: [] }];
    expect(endingGridReport(dead).unreachable).toEqual(['b']);
    const gap = [{ ending: 'a', when: [{ kind: 'flag', key: 'x', op: '>=', value: 5 }] }];
    expect(endingGridReport(gap).gap).toBe(true);
    expect(pickEnding(dead, { 'flag:x': 6 })).toBe('a');
  });
});
