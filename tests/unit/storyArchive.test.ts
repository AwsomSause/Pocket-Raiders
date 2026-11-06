import { describe, expect, it } from 'vitest';
import { archiveEntries, archiveHint } from '../../src/core/story2/archiveView';

const snap = (event: string, text: string, extra: object = {}) => ({ event, stop: null, act: 2, text, choice: null, runId: 'r1', backstory: 'bs_old_friend', ...extra });

describe('story archive view', () => {
  it('lists scenes newest first with readable titles', () => {
    const out = archiveEntries([snap('ev_first_meeting', 'One.'), snap('scene_the_storm', 'Two.', { choice: 'stay_put' })]);
    expect(out.map((e) => e.title)).toEqual(['The storm', 'First meeting']);
    expect(out[0]).toMatchObject({ backstory: 'Bs old friend', act: 2, choice: 'Stay put', runId: 'r1' });
  });
  it('skips broken or empty records instead of throwing', () => {
    expect(archiveEntries([null, 5, {}, { event: 'x', text: '   ' }, { event: 3, text: 'a' }, snap('ok', 'Fine.')])).toHaveLength(1);
    expect(archiveEntries([])).toEqual([]);
  });
  it('trims a long hint and adds the choice', () => {
    const e = archiveEntries([snap('long', 'a'.repeat(400), { choice: 'go' })])[0]!;
    const h = archiveHint(e, 100);
    expect(h.startsWith('a'.repeat(99) + '…')).toBe(true);
    expect(h.endsWith('You chose: Go')).toBe(true);
  });
});
