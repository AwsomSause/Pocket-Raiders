// gn.new.12 The Cartographer: the image is drawn from the run's seed, it comes true, the Natu waits at the final rest.
import { describe, expect, it } from 'vitest';
import { gnTokens } from '../../src/core/greenneedle';
import { finalRest, xatuBlur, xatuKind, xatuTrue, xatuWildWeight } from '../../src/core/greenneedle/cartographer';
import { content } from './helpers';
import { choose, flagOf, gnRun, open, openSide, scene, setFlag } from './helpers/gnPlay';

const XATU = 'gn-new-12-xatu';
const played = (seed: string, label = 'Look and listen.') => {
  const run = gnRun(seed);
  open(run, XATU);
  const r = choose(run, XATU, label);
  return r.run;
};

describe('gn.new.12 The Cartographer', () => {
  it('offers the three scripted choices', () => {
    const run = gnRun('xatu-labels');
    expect(scene(run, XATU).labels).toEqual(['Look and listen.', 'Look, and refuse to listen.', 'Leave.']);
  });

  it('look and listen draws one image, the same one for the same seed, and opens the image scene', () => {
    const a = played('xatu-a');
    const b = played('xatu-a');
    expect(xatuKind(a)).toBeGreaterThanOrEqual(1);
    expect(xatuKind(a)).toBe(xatuKind(b));
    expect(flagOf(a, 'xatu-met')).toBe(1);
    expect(openSide(a)?.eventId).toBe('gn-new-12-image');
    const text = gnTokens(content, a, content.events.get('gn-new-12-image')!.intro);
    expect(text).not.toContain('{xatu:');
  });

  it('refusing shows the map but draws nothing; leaving changes nothing', () => {
    const refused = played('xatu-r', 'Look, and refuse to listen.');
    expect(xatuKind(refused)).toBe(0);
    // The whole map is on show, then it blurs: the fog is back and nothing else changed.
    expect(refused.stage!.peekFrom).toBeDefined();
    expect(refused.stage!.scoutedTo).toBe(refused.stage!.map.columns);
    const before = refused.stage!.peekFrom!;
    xatuBlur(refused);
    expect(refused.stage!.scoutedTo).toBe(before);
    expect(refused.stage!.peekFrom).toBeUndefined();
    const run = gnRun('xatu-l');
    open(run, XATU);
    const after = choose(run, XATU, 'Leave.').run;
    expect(flagOf(after, 'xatu-met')).toBe(0);
  });

  it('every kind of image comes true, and the silhouette turns up more often', () => {
    const kinds = new Set<number>();
    for (let i = 0; i < 40 && kinds.size < 3; i++) {
      const run = played(`xatu-kind-${i}`);
      const kind = xatuKind(run);
      kinds.add(kind);
      expect(xatuTrue(run)).toBe(false);
      if (kind === 1) run.regionIndex = Math.max(run.regionIndex, flagOf(run, 'xatu-region') - 1);
      if (kind === 2) {
        const sp = Object.keys(run.story.flags).find((k) => k.startsWith('ev:xatu-sp:'))!.slice('ev:xatu-sp:'.length);
        expect(xatuWildWeight(run, sp)).toBeGreaterThan(1);
        expect(xatuWildWeight(run, 'zzz-other')).toBe(1);
        run.log.speciesSeen.push(sp);
      }
      if (kind === 3) run.party[0]!.level = flagOf(run, 'xatu-number');
      expect(xatuTrue(run)).toBe(true);
    }
    expect([...kinds].sort()).toEqual([1, 2, 3]);
  });

  it('the Natu waits at the final rest only when it came true', () => {
    const run = played('xatu-natu');
    const NATU = 'gn-new-12-natu';
    const campaign = content.campaigns.get(run.campaignId)!;
    expect(finalRest(content, run, campaign.stagesPerRegion)).toBe(false);
    run.story.flags['ev:xatu-prophecy'] = 3;
    run.story.flags['ev:xatu-number'] = 100;
    run.regionIndex = run.regionOrder.length - 1;
    run.stage!.index = campaign.stagesPerRegion - 1;
    expect(finalRest(content, run, campaign.stagesPerRegion)).toBe(true);
    expect(xatuTrue(run)).toBe(false);
    run.party[0]!.level = 200;
    expect(xatuTrue(run)).toBe(true);
    const before = run.party.length + run.box.length + run.pending.length;
    open(run, NATU);
    const r = choose(run, NATU, 'Take the Natu.');
    expect(r.run.party.length + r.run.box.length + r.run.pending.length).toBeGreaterThan(before);
    expect(flagOf(r.run, 'xatu-natu')).toBe(1);
  });

  it('Communion draws a second, different image', () => {
    const run = played('xatu-comm');
    const first = xatuKind(run);
    setFlag(run, 'xatu-prophecy', first);
    run.expansion = { ...(run.expansion ?? {}), blessing: { ...(run.expansion?.blessing ?? { id: 'x', tier: 1, influence: 0, seen: false, ashRegions: [], riteUsed: false, stagesDone: [] }), communion: true } } as typeof run.expansion;
    open(run, 'gn-new-12-furious');
    const r = choose(run, 'gn-new-12-furious', 'Show it the Blessing.');
    expect(xatuKind(r.run)).not.toBe(first);
    expect(flagOf(r.run, 'xatu-changed')).toBe(1);
  });
});
