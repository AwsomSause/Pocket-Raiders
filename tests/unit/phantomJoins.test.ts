import { describe, expect, it } from 'vitest';
import { JOIN_CARDS, JOIN_MOTIONS, joinGroup, joinKind, joinMotion, withJoinMotion } from '../../src/core/presentation/joins';
import { pageOf } from '../../src/ui/phantom/kit';
import { phReel } from '../../src/ui/phantom/screens/settings';

const base = { menuAnimations: true, disableAllAnimations: false, animationIntensity: 'normal' as const };

describe('Phantom UI page changes: which one plays', () => {
  it('a fight is cut open, and its first pages always are', () => {
    expect(joinKind('map', 'battle')).toBe('slash');
    expect(joinKind('event', 'vs')).toBe('slash');
    expect(joinKind('battle', 'send')).toBe('slash');
    expect(joinKind(null, 'wild')).toBe('slash');
  });

  it('big beats flare, whatever came before', () => {
    for (const to of ['tera', 'dmax', 'zmove', 'mega', 'ace', 'ko', 'phase', 'hit', 'win', 'evolve', 'capture', 'blessing']) expect(joinKind('battle', to)).toBe('iris');
    expect(joinKind('map', 'evolve')).toBe('iris');
    expect(joinKind('evolve', 'learn')).toBe('iris');
  });

  it('a menu drops in over another kind of page, and sweeps between its own pages', () => {
    expect(joinKind('map', 'pause')).toBe('drop');
    expect(joinKind('title', 'set')).toBe('drop');
    expect(joinKind('pause', 'set')).toBe('drop');
    expect(joinKind('pause', 'dex')).toBe('sweep');
    expect(joinKind('set', 'set-look')).toBe('sweep');
    expect(joinKind('set-look', 'reel')).toBe('sweep');
  });

  it('moving on to another kind of place turns the page', () => {
    expect(joinKind('map', 'town')).toBe('page');
    expect(joinKind('set', 'title')).toBe('page');
    expect(joinKind('battle', 'map')).toBe('page');
    expect(joinKind(null, 'title')).toBe('page');
    expect(joinKind('map', 'event')).toBe('sweep');
  });

  it('a page in no group sweeps after nothing or another such page, and turns after a grouped one', () => {
    expect(joinGroup('no-such-page')).toBe('');
    expect(joinGroup(null)).toBe('');
    expect(joinKind(null, 'no-such-page')).toBe('sweep');
    expect(joinKind('other-page', 'no-such-page')).toBe('sweep');
    expect(joinKind('map', 'no-such-page')).toBe('page');
  });
});

describe('Phantom UI page changes: how much they move', () => {
  it('reads the motion from the settings the game already has', () => {
    expect(joinMotion(base)).toBe('full');
    expect(joinMotion({ ...base, animationIntensity: 'enhanced' })).toBe('full');
    expect(joinMotion({ ...base, animationIntensity: 'reduced' })).toBe('reduced');
    expect(joinMotion({ ...base, menuAnimations: false })).toBe('off');
    expect(joinMotion({ ...base, disableAllAnimations: true })).toBe('off');
    expect(joinMotion({ ...base, animationIntensity: 'reduced', disableAllAnimations: true })).toBe('off');
  });

  it('every pick reads back as itself, from any start', () => {
    const starts = [base, { ...base, animationIntensity: 'reduced' as const }, { ...base, menuAnimations: false }, { ...base, disableAllAnimations: true }, { ...base, animationIntensity: 'enhanced' as const }];
    for (const s of starts) for (const m of JOIN_MOTIONS) expect(joinMotion(withJoinMotion(s, m.id))).toBe(m.id);
  });

  it('Off turns menu motion off and nothing else; Full keeps an Enhanced strength', () => {
    expect(withJoinMotion({ ...base, animationIntensity: 'enhanced' as const }, 'off')).toEqual({ menuAnimations: false, disableAllAnimations: false, animationIntensity: 'enhanced' });
    expect(withJoinMotion({ ...base, animationIntensity: 'enhanced' as const }, 'full').animationIntensity).toBe('enhanced');
    expect(withJoinMotion({ ...base, animationIntensity: 'reduced' as const }, 'full').animationIntensity).toBe('normal');
    // The master switch is turned back on, or picking Full would do nothing.
    expect(withJoinMotion({ ...base, disableAllAnimations: true }, 'reduced')).toEqual({ menuAnimations: true, disableAllAnimations: false, animationIntensity: 'reduced' });
    // Other settings ride along untouched.
    expect(withJoinMotion({ ...base, extra: 7 }, 'reduced').extra).toBe(7);
  });
});

describe('Phantom UI: the Page changes page', () => {
  const model = (over = {}) => ({ cards: JOIN_CARDS, index: 2, motions: JOIN_MOTIONS.map((m) => m.n), motion: 0, help: '', ...over });

  it('draws six cards with one lit, the three motions and the keys', () => {
    const html = phReel(model());
    expect(pageOf(html)).toBe('reel');
    expect(JOIN_CARDS.map((c) => c.n)).toEqual(['Slash', 'Flare', 'Drop', 'Turn', 'Sweep', 'Carry']);
    expect(html.match(/class="pn rr-c/g)).toHaveLength(6);
    expect(html.match(/class="pn rr-c lt"/g)).toHaveLength(1);
    expect(html).toContain('<div class="pn rr-c lt" style="--i:2" data-act="reelPick" data-arg="2" data-over="reelOver">');
    for (const f of ['rr-slash', 'rr-iris', 'rr-drop', 'rr-page', 'rr-sweep', 'rr-share']) expect(html).toContain(`class="rr-d ${f}"`);
    expect(html).toContain('<span class="on" data-act="reelMotion" data-arg="0">Full</span>');
    expect(html).toContain('data-arg="1">Reduced · fades only</span>');
    expect(html).toContain('data-arg="2">Off · instant</span>');
    expect(html).toContain('Play one');
    expect(html).not.toContain('ph-rr-say');
  });

  it('says what the last press did, escaped', () => {
    const html = phReel(model({ motion: 2, help: 'Pages <change> at once.' }));
    expect(html).toContain('<p class="ph-rr-say">Pages &lt;change&gt; at once.</p>');
    expect(html).toContain('<span class="on" data-act="reelMotion" data-arg="2">Off · instant</span>');
  });
});
