import { describe, expect, it } from 'vitest';
import { CutsceneSchema, TRAINER_INTROS, cutsceneLength, planCutscene, skipCutscene, subtitleKeys, trainerIntro } from '../../src/core/story2/cutscene';
import { TEMPLATE_TOKENS, renderTemplate, tokensIn } from '../../src/core/story2/templates';
import { content } from './helpers';

const scene = CutsceneSchema.parse({
  id: 'demo', tier: 'A', template: 'reveal', recapKey: 'cutscene.recap.default',
  steps: [
    { at: 0, track: 'camera', kind: 'pan', ms: 800 },
    { at: 0, track: 'vfx', kind: 'rain', ms: 800, sets: ['rain_seen'] },
    { at: 900, track: 'dialogue', kind: 'say', textKey: 'intro.ally_join.1', args: { speaker: 'ch_vance' } },
    { at: 500, track: 'character', kind: 'walk', ms: 400 },
    { at: 1200, track: 'audio', kind: 'sting', sets: ['heard'] },
  ],
});

describe('cutscene plan', () => {
  it('orders steps by time and keeps authoring order on ties', () => {
    const p = planCutscene(scene, { reduceMotion: false, disableAnimations: false });
    expect(p.map((s) => s.kind)).toEqual(['pan', 'rain', 'walk', 'say', 'sting']);
    expect(cutsceneLength(p)).toBe(1200);
  });
  it('reduce motion drops camera, vfx and character steps but keeps the ones that set flags (with no duration)', () => {
    const p = planCutscene(scene, { reduceMotion: true, disableAnimations: false });
    expect(p.map((s) => s.kind)).toEqual(['rain', 'say', 'sting']);
    expect(p[0]!.ms).toBe(0);
    expect(p[0]!.sets).toEqual(['rain_seen']);
  });
  it('disabling all animations keeps dialogue, audio and flag steps only', () => {
    const p = planCutscene(scene, { reduceMotion: false, disableAnimations: true });
    expect(p.map((s) => s.kind)).toEqual(['rain', 'say', 'sting']);
  });
  it('skip gives the recap and still sets every flag; unskippable scenes cannot be skipped', () => {
    expect(skipCutscene(scene)).toEqual({ recapKey: 'cutscene.recap.default', flags: ['rain_seen', 'heard'] });
    expect(skipCutscene({ ...scene, skippable: false })).toBeNull();
  });
  it('subtitles are the dialogue texts in order', () => {
    expect(subtitleKeys(planCutscene(scene, { reduceMotion: false, disableAnimations: false }))).toEqual(['intro.ally_join.1']);
  });
});

describe('trainer introductions', () => {
  it('has the 10 templates, every text exists, and every token is known and fills', () => {
    expect(TRAINER_INTROS).toHaveLength(10);
    const text = content.storyData.text;
    const values = Object.fromEntries(TEMPLATE_TOKENS.map((t) => [t, 'X']));
    for (const t of TRAINER_INTROS) for (const k of [...t.lineKeys, ...(t.titleKey ? [t.titleKey] : [])]) {
      expect(text[k], k).toBeTruthy();
      for (const tok of tokensIn(text[k]!)) expect(TEMPLATE_TOKENS as readonly string[], k).toContain(tok);
      expect(renderTemplate(text[k]!, values)).not.toMatch(/\{\w+\}/);
    }
    expect(trainerIntro('leader_pose')?.titleKey).toBeTruthy();
    expect(trainerIntro('nope')).toBeUndefined();
  });
  it('the recap line exists', () => {
    expect(content.storyData.text['cutscene.recap.default']).toBeTruthy();
  });
});
