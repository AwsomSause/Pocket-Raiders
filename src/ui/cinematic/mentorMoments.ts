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
import { reduxOn } from '../redux/stage';
import { playCutMoment } from '../redux/moment';
import { monFile } from '../redux/game';
import type { Art } from '../redux/templates';

export async function playMentorMoment(scene: Phaser.Scene, content: Content, kind: MentorMomentKind, mentor: PokemonInstance, prote: PokemonInstance, text: { title: string; subtitle: string; caption: string }): Promise<void> {
  const settings = services().session.settings;
  const spec = mentorMoment(kind);
  const plan = planMoment(spec, { reduceMotion: settings.battleAnimations === 'reduced', disableAnimations: settings.battleAnimations === 'off', seen: new Set() });
  const ms = content.species.get(mentor.speciesId);
  const ps = content.species.get(prote.speciesId);
  if (!ms || !ps) return;
  const mode = kind === 'mentorAssist' ? 'assist' : kind === 'mentorGraduation' ? 'graduation' : 'return';
  if (reduxOn()) {
    // New UI: the mock-ups' cutscene card, with the mentor beside its protégé.
    try {
      const art = (m: PokemonInstance): Art | null => { const f = monFile(scene, m.speciesId, 'front', !!m.shiny); return f ? { file: f, atlas: true } : null; };
      await playCutMoment(scene, plan, { name: text.subtitle, role: kind === 'mentorAssist' ? 'Mentor' : kind === 'mentorGraduation' ? 'Graduation' : 'Your Protégé', line: text.caption, cast: art(mentor), mon: art(prote), backdrop: null });
    } catch {
      /* presentation failure never blocks the game */
    }
    return;
  }
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
