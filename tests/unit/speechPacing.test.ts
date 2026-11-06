import { describe, expect, it } from 'vitest';
import { planSpeech, stripSpeechTags, voicePitch } from '../../src/ui/dialogue/speechPacing';

describe('speech pacing (text box redesign)', () => {
  it('keeps the plain text and pauses on punctuation', () => {
    const p = planSpeech('Well, look at you. Ready?', 20);
    expect(p.plain).toBe('Well, look at you. Ready?');
    const comma = p.beats[4]!;
    const stop = p.beats[17]!;
    expect(comma.ch).toBe(',');
    expect(comma.wait).toBeGreaterThan(100);
    expect(stop.ch).toBe('.');
    expect(stop.wait).toBeGreaterThan(comma.wait);
    expect(p.mood).toBe('question');
    // The question rises on its last word.
    expect(p.beats[p.beats.length - 2]!.pitch).toBeGreaterThan(1);
    expect(p.beats[p.beats.length - 1]!.wait).toBe(0);
  });

  it('treats CAPS and [shake] as loud: faster, shakes, a shout', () => {
    const p = planSpeech('Now GO all out!', 20);
    expect(p.mood).toBe('shout');
    expect(p.shakeAt).toEqual([4]);
    const g = p.beats[4]!;
    expect(g.loud).toBe(true);
    expect(g.wait).toBeLessThan(p.beats[0]!.wait);
    const tagged = planSpeech('I will [shake]crush[/shake] you.', 20);
    expect(tagged.plain).toBe('I will crush you.');
    expect(tagged.shakeAt).toEqual([7]);
    expect(tagged.mood).toBe('shout');
  });

  it('shakes once on the last "!" of a plain shout', () => {
    const p = planSpeech('You can do it!', 20);
    expect(p.mood).toBe('shout');
    expect(p.shakeAt).toEqual([13]);
  });

  it('drags an ellipsis and honours [slow], [fast] and pause tags', () => {
    const trail = planSpeech('I see...', 20);
    expect(trail.mood).toBe('trail');
    expect(trail.beats[5]!.wait).toBeGreaterThan(200);
    const slow = planSpeech('[slow]ab[/slow][fast]cd[/fast]', 20);
    expect(slow.plain).toBe('abcd');
    expect(slow.beats[0]!.wait).toBeGreaterThan(slow.beats[2]!.wait * 3);
    const paused = planSpeech('Hm[pause] yes[p=900] ok', 20);
    expect(paused.plain).toBe('Hm yes ok');
    expect(paused.beats[1]!.wait).toBeGreaterThanOrEqual(450);
    expect(paused.beats[5]!.wait).toBeGreaterThanOrEqual(900);
  });

  it('is the same every time, handles empty text and caps huge pauses', () => {
    expect(planSpeech('Hello there!', 28, 'grim')).toEqual(planSpeech('Hello there!', 28, 'grim'));
    expect(planSpeech('Hello there', 28, 'grim').total).toBeGreaterThan(planSpeech('Hello there', 28, 'cheerful').total);
    const empty = planSpeech('', 28);
    expect(empty.beats).toEqual([]);
    expect(empty.mood).toBe('calm');
    expect(planSpeech('a[p=9999]b', 10).beats[0]!.wait).toBeLessThanOrEqual(2000);
    expect(stripSpeechTags('[fast]Go[/fast]!')).toBe('Go!');
    expect(voicePitch('Cynthia', 'calm')).toBe(voicePitch('Cynthia', 'calm'));
    expect(voicePitch('Grimsley', 'grim')).toBeLessThan(voicePitch('Grimsley', 'cheerful'));
  });
});
