import { describe, expect, it } from 'vitest';
import { scenery, seeded, type SceneryLook } from '../../src/ui/redux/eventScenery';

// The drawn scenery is a pure function from the director's look to HTML: the same look always draws the same
// picture, two events never share one, and with motion off it is a still picture.

const look = (over: Partial<SceneryLook> = {}): SceneryLook => ({ set: 'skyline', place: 'city', inside: false, time: 'day', mood: 'calm', weather: null, motes: 'dust', seed: 12345, pic: null, tint: null, still: false, ...over });
const count = (html: string, bit: string): number => html.split(bit).length - 1;
const SETS = ['wilds', 'skyline', 'room', 'hall', 'shop', 'ruins', 'snow', 'deck', 'fair', 'void', 'camp'] as const;

describe('event scenery', () => {
  it('draws every kind of place at every hour, with nothing broken in the markup', () => {
    for (const set of SETS) for (const time of ['day', 'eve', 'night'] as const) {
      const html = scenery(look({ set, time, inside: set === 'room' || set === 'hall' || set === 'shop' }));
      expect(html.length, `${set} ${time}`).toBeGreaterThan(800);
      expect(html).toContain('<svg');
      for (const bad of ['NaN', 'undefined', 'Infinity', 'null']) expect(html, `${set} ${time}`).not.toContain(bad);
      expect(count(html, '<svg')).toBe(count(html, '</svg>'));
      expect(count(html, '<div')).toBe(count(html, '</div>'));
    }
  });
  it('is the same picture for the same seed, and another picture for another seed', () => {
    for (const set of SETS) {
      expect(scenery(look({ set }))).toBe(scenery(look({ set })));
      expect(scenery(look({ set, seed: 1 }))).not.toBe(scenery(look({ set, seed: 2 })));
    }
    const a = seeded(7), b = seeded(7), c = seeded(8);
    const run = (r: () => number) => [r(), r(), r()];
    expect(run(a)).toEqual(run(b));
    expect(run(seeded(7))).not.toEqual(run(c));
    for (const n of run(seeded(99))) { expect(n).toBeGreaterThanOrEqual(0); expect(n).toBeLessThan(1); }
  });
  it('shows a place’s own picture when it has one, and draws the place when it has none', () => {
    const pic = scenery(look({ set: 'wilds', place: 'route', pic: 'arenas/uie/route_bg.png' }));
    expect(pic).toContain('assets/images/arenas/uie/route_bg.png');
    expect(pic).toContain('ev-pic');
    expect(scenery(look({ set: 'wilds', place: 'route' }))).not.toContain('ev-pic');
    // A night picture is already dark; a day picture shown at night gets the hour laid over it.
    expect(scenery(look({ set: 'wilds', place: 'lake', time: 'night', pic: 'arenas/uie/lake_night_bg.png' }))).not.toContain('#081238;opacity');
    expect(scenery(look({ set: 'wilds', place: 'route', time: 'night', pic: 'arenas/uie/route_bg.png' }))).toContain('#081238;opacity');
  });
  it('lights the windows and lamps only after dark', () => {
    expect(scenery(look({ time: 'day' }))).not.toContain('#ffd86a');
    expect(scenery(look({ time: 'night' }))).toMatch(/#ffd86a|#ffc04a|#fff0b0/);
  });
  it('weather and drifting things show only with motion on', () => {
    const moving = scenery(look({ weather: 'rain', motes: 'leaves' }));
    expect(moving).toContain('fx-rain');
    expect(count(moving, 'mt mt-leaves')).toBeGreaterThan(4);
    const still = scenery(look({ weather: 'rain', motes: 'leaves', still: true }));
    expect(still).not.toContain('fx-rain');
    expect(still).not.toContain('class="mt ');
    expect(still).toContain('still');
    // A sparkle is a handful of twinkles, not a sheet over the view.
    const glint = scenery(look({ weather: 'glint', motes: 'none' }));
    expect(count(glint, 'mt-glint')).toBe(11);
    expect(glint).not.toContain('fx-glint');
    expect(scenery(look({ weather: 'confetti', motes: 'none' }))).toContain('mt-confetti');
    expect(scenery(look({ weather: 'net', motes: 'none' }))).toContain('ev-net');
  });
  it('lays the event’s own tint and the mood’s light over the picture', () => {
    expect(scenery(look({ tint: '#4a5a2d' }))).toContain('background:#4a5a2d');
    expect(scenery(look())).not.toContain('ev-wash');
    for (const mood of ['warm', 'tense', 'eerie', 'sad', 'festive', 'grand', 'mystery', 'playful'] as const) expect(scenery(look({ mood })), mood).toContain('ev-wash');
  });
  it('a camp gets its fire, in front of the trees or drawn', () => {
    expect(scenery(look({ set: 'camp', place: 'camp', time: 'night', pic: 'arenas/uie/woodland_night_bg.png' }))).toContain('ev-flame');
    expect(scenery(look({ set: 'camp', place: 'camp', time: 'night' }))).toContain('ev-flame');
  });
});
