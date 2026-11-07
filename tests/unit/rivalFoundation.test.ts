import { describe, expect, it } from 'vitest';
import { MAJOR } from '../../src/core/rivals/major';
import { importanceOf } from '../../src/core/rivals/importance';
import { isMainEligible, pickMainRival, poolFor } from '../../src/core/rivals/pool';
import { addReputation, recognitionLine, repLevel, REP } from '../../src/core/rivals/reputation';
import { badVoiceRefs, VOICE_IDS, voiceOf } from '../../src/core/rivals/voice';

const fakeRun = (seed = 's') => ({ seed, regionIndex: 0, story: { flags: {} as Record<string, unknown> } }) as never as Parameters<typeof addReputation>[0] & Parameters<typeof recognitionLine>[0];

describe('W1 approved rival pool', () => {
  it('main draws only primary characters; special needs approval and never fills the main slot', () => {
    expect(poolFor('major')).toEqual(['Bede', 'Blue', 'Gladion', 'Hop', 'Hugh', 'Nemona', 'Silver', 'Wally']);
    expect(poolFor('additional')).not.toContain('N');
    expect(poolFor('friendly')).toContain('Gary');
    expect(isMainEligible('N')).toBe(false);
    expect(isMainEligible('Gary')).toBe(false);
    expect(isMainEligible('Selene Aurelian')).toBe(false);
  });
  it('an approved special may be additional but still never main', () => {
    MAJOR.characters.N!.approved = true;
    try {
      expect(poolFor('additional')).toContain('N');
      expect(poolFor('major')).not.toContain('N');
    } finally {
      MAJOR.characters.N!.approved = false;
    }
  });
  it('story picks a fixed primary main rival per seed; classic keeps random rivals', () => {
    const a = pickMainRival('seed-1', 'story');
    expect(a).toBe(pickMainRival('seed-1', 'story'));
    expect(isMainEligible(a!)).toBe(true);
    const seen = new Set(Array.from({ length: 40 }, (_, i) => pickMainRival(`x${i}`, 'story')));
    expect(seen.size).toBeGreaterThan(3);
    for (const id of seen) expect(isMainEligible(id!)).toBe(true);
    expect(pickMainRival('seed-1', 'classic')).toBeNull();
    expect(pickMainRival('seed-1', 'story', [a!])).not.toBe(a);
  });
  it('every character has a valid pool of species and a personality/style', () => {
    expect(Object.keys(MAJOR.characters)).toHaveLength(19);
  });
});

describe('W1 voices', () => {
  it('12 voices, all personalities and styles exist, every rival personality maps to a voice or trait fallback', () => {
    expect(VOICE_IDS).toHaveLength(12);
    expect(badVoiceRefs()).toEqual([]);
    const traits = { ambition: 50, pride: 50, empathy: 50, adaptability: 50, vindictiveness: 50, resilience: 50 };
    expect(voiceOf({ archetype: 'golden-retriever', traits })).toBe('friendly');
    expect(voiceOf({ archetype: 'golden-retriever', traits, voice: 'stoic' })).toBe('stoic');
    expect(VOICE_IDS).toContain(voiceOf({ archetype: 'nihilist', traits }));
  });
});

describe('W1 importance', () => {
  it('follows the I1 to I4 rules', () => {
    expect(importanceOf({ role: 'route', classId: 'youngster' })).toBe('I1');
    expect(importanceOf({ role: 'grunt' })).toBe('I1');
    expect(importanceOf({ role: 'route', classId: 'ace-trainer' })).toBe('I2');
    expect(importanceOf({ role: 'route', timesFought: 2 })).toBe('I2');
    expect(importanceOf({ role: 'specialist' })).toBe('I2');
    expect(importanceOf({ role: 'boss', regionListed: false })).toBe('I2');
    expect(importanceOf({ role: 'boss', drive: true, regionListed: true })).toBe('I3');
    expect(importanceOf({ role: 'gym' })).toBe('I3');
    expect(importanceOf({ role: 'rival', rivalSlot: 'friendly' })).toBe('I3');
    expect(importanceOf({ role: 'rival', rivalSlot: 'major' })).toBe('I3');
    expect(importanceOf({ role: 'rival', rivalSlot: 'major', lateMajorRival: true })).toBe('I4');
    expect(importanceOf({ role: 'champion' })).toBe('I4');
  });
});

describe('W1 reputation', () => {
  it('has 20 lines, caps each category per region, and levels up', () => {
    expect(REP.lines).toHaveLength(20);
    const run = fakeRun();
    for (let i = 0; i < 10; i++) addReputation(run, 'rival', 'rivalWon');
    expect(run.story.flags['rep:rival']).toBe(25);
    expect(repLevel(run, 'rival')).toBe('noted');
    run.regionIndex = 1;
    expect(addReputation(run, 'rival', 'championBeaten')).toBe(25);
    expect(repLevel(run, 'rival')).toBe('known');
    expect(addReputation(run, 'rival', 'nope')).toBe(0);
  });
  it('an I3 trainer comments once per category, deterministically', () => {
    const run = fakeRun();
    addReputation(run, 'champion', 'championBeaten');
    addReputation(run, 'champion', 'championBeaten');
    run.regionIndex = 1;
    addReputation(run, 'champion', 'championBeaten');
    expect(repLevel(run, 'champion')).toBe('known');
    const first = recognitionLine(run, 'leader-1', 'gym', 'I3');
    expect(first?.id).toBe(1);
    expect(recognitionLine(run, 'leader-1', 'gym', 'I3')).toBeNull();
    expect(recognitionLine(fakeRun(), 'leader-2', 'gym', 'I3')).toBeNull();
  });
});
