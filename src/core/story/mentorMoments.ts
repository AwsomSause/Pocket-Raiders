// Beta 0.5 (§2): the three mentor cinematics as moment specs for the shared framework (core/cinematic/moments.ts).
// Mentor's Last Resort (a skippable battle moment), the graduation spar and a defeated Pokémon's return (mandatory,
// so it cannot be skipped). Pure; the UI draws them (ui/battleFx/mentorScene.ts).

import { MomentSpecSchema, type MomentSpec } from '../cinematic/moments';

export type MentorMomentKind = 'mentorAssist' | 'mentorGraduation' | 'protegeReturn';

export function mentorMoment(kind: MentorMomentKind, side: 'player' | 'enemy' = 'player'): MomentSpec {
  switch (kind) {
    case 'mentorAssist':
      return MomentSpecSchema.parse({ id: `mentor-assist-${side}`, kind, side, tier: 'A', repeatable: true, phases: { situation: 250, anticipation: 450, moment: 1100, reaction: 450, transition: 250 } });
    case 'mentorGraduation':
      return MomentSpecSchema.parse({ id: 'mentor-graduation', kind, side, tier: 'A', phases: { situation: 350, anticipation: 600, moment: 1500, reaction: 600, transition: 300 } });
    case 'protegeReturn':
      return MomentSpecSchema.parse({ id: 'protege-return', kind, side, tier: 'S', mandatory: true, phases: { situation: 400, anticipation: 700, moment: 900, reaction: 600, transition: 300 } });
  }
}
