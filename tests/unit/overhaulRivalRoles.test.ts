import { describe, expect, it } from 'vitest';
import { counterCap, DEFAULT_RIVAL_ROLES as CFG, rivalRole } from '../../src/core/overhaul/rivalRoles';

const rivals = [{ id: 'r1' }, { id: 'major', major: true }, { id: 'r2' }, { id: 'r3' }];

describe('rival roles', () => {
  it('major is the major rival; the first other is additional; the rest are friendly', () => {
    expect(rivalRole(CFG, rivals, rivals[1]!)).toBe('major');
    expect(rivalRole(CFG, rivals, rivals[0]!)).toBe('additional');
    expect(rivalRole(CFG, rivals, rivals[2]!)).toBe('friendly');
    expect(rivalRole(CFG, rivals, rivals[3]!)).toBe('friendly');
  });

  it('a lone rival without a major flag is additional, and switched off means everyone as before', () => {
    expect(rivalRole(CFG, [{ id: 'x' }], { id: 'x' })).toBe('additional');
    for (const r of rivals) expect(rivalRole({ ...CFG, enabled: false }, rivals, r)).toBe('major');
  });

  it('a rival the run does not list plays as before', () => {
    expect(rivalRole(CFG, rivals, { id: 'stranger' })).toBe('major');
  });

  it('caps counter-picks by role', () => {
    expect(counterCap(CFG, 'major', 3)).toBe(3);
    expect(counterCap(CFG, 'additional', 3)).toBe(1);
    expect(counterCap(CFG, 'additional', 0)).toBe(0);
    expect(counterCap(CFG, 'friendly', 3)).toBe(0);
  });
});
