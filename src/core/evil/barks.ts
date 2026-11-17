// Barks (catalog row 9): the short lines the squad, the canteen, grunts in the field and the leader at your side say
// while you're inside Galactic or Plasma (each FULL_3 part D), and Hoenn's team Radio (HOENN_TEAMS 7.5) while you
// wear Magma's or Aqua's uniform. Which line plays is hashed from the run seed and the moment (never gameplay RNG);
// what can play is read from Standing, Suspicion and the story's own flags. Presentation only: nothing here changes state.

import { z } from 'zod';
import raw from '../../data/catalogOverhaul/barks/evil-hsu.json';
import type { Content } from '../contentSchema';
import { hashSeed, Rng } from '../rng';
import type { RunState } from '../state';
import { insideOn, standingOf, suspicionOf } from './inside';
import { evilTeam } from './teams';

const Band = z.array(z.string()).length(2);
const BarksSchema = z.object({
  status: z.enum(['supported', 'limited', 'disabled']),
  source: z.string(),
  squads: z.array(z.object({ team: z.string(), a: z.string(), b: z.string(), standing: z.object({ low: Band, mid: Band, high: Band }), suspicion: z.object({ mid: Band, high: Band }) })),
  lines: z.array(z.object({ team: z.string(), kind: z.enum(['rest', 'field', 'silent', 'hum', 'win', 'faint', 'heal']), who: z.string(), text: z.string(), flags: z.array(z.string()).default([]), seen: z.array(z.string()).default([]) })),
  radio: z.object({ teams: z.array(z.string()), chatter: z.record(z.string(), z.array(z.string()).min(1)), refused: z.string(), ops: z.record(z.string(), z.string()) }),
});
export const BARKS = BarksSchema.parse(raw);
export type BarkMoment = 'rest' | 'win' | 'faint' | 'heal';

const flag = (run: RunState, k: string): boolean => Number(run.story.flags[`ev:${k}`] ?? 0) > 0;
const seen = (run: RunState, id: string): boolean => (run.itemCounters?.[`event-seen:${id}`] ?? 0) > 0;

/** Every line that could play now for this moment, as "Who: line". */
export function barkPool(content: Content, run: RunState, moment: BarkMoment): string[] {
  const team = evilTeam(content, run);
  if (!team) return [];
  const out: string[] = [];
  const inside = insideOn(run, team.id);
  const kinds = moment === 'rest' ? ['rest', 'field', 'silent', 'hum'] : [moment];
  for (const l of BARKS.lines) {
    if (l.team !== team.id || !kinds.includes(l.kind)) continue;
    if (l.flags.every((f) => flag(run, f)) && l.seen.every((id) => seen(run, id)) && (inside || l.flags.length > 0)) out.push(`${l.who}: ${l.text}`);
  }
  if (moment === 'rest' && inside) {
    const sq = BARKS.squads.find((s) => s.team === team.id);
    if (sq) {
      const st = standingOf(run, team.id);
      const band = st >= 8 ? sq.standing.high : st >= 4 ? sq.standing.mid : sq.standing.low;
      out.push(`${sq.a}: "${band[0]}"`, `${sq.b}: "${band[1]}"`);
      const su = suspicionOf(run, team.id);
      if (su >= 4) {
        const sb = su >= 7 ? sq.suspicion.high : sq.suspicion.mid;
        out.push(`${sq.a}: "${sb[0]}"`, `${sq.b}: "${sb[1]}"`);
      }
    }
    // 7.5: the Radio can be muted (the run notes it: `hoenn-radio-muted`).
    if (BARKS.radio.teams.includes(team.id) && !flag(run, 'hoenn-radio-muted')) {
      out.push(...(BARKS.radio.chatter[team.id] ?? []).map((c) => `Radio: ${c}`));
      for (const [id, name] of Object.entries(BARKS.radio.ops)) if (flag(run, `hoenn-refused-${id}`)) out.push(BARKS.radio.refused.replace('{op}', name));
    }
  }
  return out;
}

/**
 * One bark for this moment, or null. `salt` names the moment (the node, the turn) so the same moment always gives the
 * same line. At rests about half the moments stay quiet, so the map's own news still shows.
 */
export function barkLine(content: Content, run: RunState, moment: BarkMoment, salt: string): string | null {
  const pool = barkPool(content, run, moment);
  if (pool.length === 0) return null;
  const r = new Rng(hashSeed(`${run.seed}::bark::${moment}::${salt}`));
  if (moment === 'rest' && r.float() < 0.5) return null;
  return r.pick(pool);
}
