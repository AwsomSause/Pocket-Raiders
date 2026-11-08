// Plays a mentor moment (core/story/mentorMoments.ts) with the mentor scene inside the cinematic player. Presentation only:
// a drawing failure resolves quietly and the caller carries on. Used by the camp (graduation spar) and the decision scene (returns).
import type Phaser from 'phaser';
import type { Content } from '../../core/contentSchema';
import { planMoment } from '../../core/cinematic/moments';
import type { PokemonInstance } from '../../core/state';
import { mentorMoment, type MentorMomentKind } from '../../core/story/mentorMoments';
import { services } from '../../game/services';
import { mentorScene } from '../battleFx/mentorScene';
import { PIXEL_SCALE } from '../theme';
import { pokemonVisual } from '../sprites';
import { animationTimeScale } from '../../core/accessibility';
import { playMoment } from './momentPlayer';

export async function playMentorMoment(scene: Phaser.Scene, content: Content, kind: MentorMomentKind, mentor: PokemonInstance, prote: PokemonInstance, text: { title: string; subtitle: string; caption: string }): Promise<void> {
  const settings = services().session.settings;
  const spec = mentorMoment(kind);
  const plan = planMoment(spec, { reduceMotion: settings.battleAnimations === 'reduced', disableAnimations: settings.battleAnimations === 'off', seen: new Set() });
  const ms = content.species.get(mentor.speciesId);
  const ps = content.species.get(prote.speciesId);
  if (!ms || !ps) return;
  const mode = kind === 'mentorAssist' ? 'assist' : kind === 'mentorGraduation' ? 'graduation' : 'return';
  try {
    await playMoment(scene, spec, plan, {
      title: text.title,
      subtitle: text.subtitle,
      inner: () => mentorScene(scene, { mode, makeMentor: (x, y) => pokemonVisual(scene, ms, 'front', x, y, PIXEL_SCALE * 1.4, mentor.shiny), makeProte: (x, y) => pokemonVisual(scene, ps, 'front', x, y, PIXEL_SCALE * 1.4, prote.shiny), caption: text.caption, speed: 1 / animationTimeScale(settings) }).done,
    });
  } catch {
    /* presentation failure never blocks the game */
  }
}
