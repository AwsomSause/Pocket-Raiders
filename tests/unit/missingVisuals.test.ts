import { describe, expect, it } from 'vitest';
import '../../src/core/run';
import { ghostScareFor } from '../../src/core/presentation/ghostScare';

describe('The Ghost Returns: black screen, then the face', () => {
  it('darkens the first two pages and shows the face on the third', () => {
    expect([0, 1, 2, 3].map((p) => ghostScareFor('gn-14-return', true, p))).toEqual(['dark', 'dark', 'face', null]);
  });
  it('leaves the outcome text and every other event alone', () => {
    expect(ghostScareFor('gn-14-return', false, 0)).toBeNull();
    expect(ghostScareFor('gn-14-goodbye', true, 0)).toBeNull();
    expect(ghostScareFor('gn-14-return', true, -1)).toBeNull();
  });
});
