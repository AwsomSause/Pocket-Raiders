// The Protégé system (Techno blueprint §4): a veteran can mentor a younger
// teammate. The player accepts or declines an offer; a mentorship is a
// "mentorship" relationship that ends when the protégé evolves or catches up.
// Paths shape the story and the memory text, not raw stats. Nothing here draws
// random numbers: an offer is decided from the Pokémon's histories.

import type { Content } from '../contentSchema';
import { openRelationship, closeRelationship, emit } from './record';
import type { PokemonInstance, RunState } from '../state';
import type { MentorType, PokemonHistory, RelationshipRecord } from './schema';
import { MENTOR_CFG, TYPE_NAMES, bondOfRel, ensureBond, mentorTypesFor, openBond } from './mentorBond';

export const MENTOR_PATHS = ['guardian', 'striker', 'strategist', 'survivor', 'challenger', 'bonded'] as const;
export type MentorPath = (typeof MENTOR_PATHS)[number];

const PATH_NAMES: Record<MentorPath, string> = {
  guardian: 'The Guardian',
  striker: 'The Striker',
  strategist: 'The Strategist',
  survivor: 'The Survivor',
  challenger: 'The Challenger',
  bonded: 'The Bonded',
};
export const pathName = (path: MentorPath) => PATH_NAMES[path];

const pathFlag = (id: string) => `mentor:path:${id}`;
const declinedFlag = (a: string, b: string) => `mentor:no:${a}:${b}`;

/** What the protégé learns from this veteran: the strongest thread of its history. */
export function pathFor(run: RunState, mentor: PokemonHistory): MentorPath {
  const bonded = run.story.relationships.some((r) => r.open && r.kind === 'bond' && (r.a.id === mentor.uid || r.b.id === mentor.uid));
  const scores: Record<MentorPath, number> = {
    challenger: mentor.bossesBeaten * 3,
    survivor: mentor.survivedFatal * 3 + mentor.closeCalls,
    striker: mentor.knockoutsDealt,
    guardian: Math.floor(mentor.longestLowHpStand * 2),
    strategist: Object.keys(mentor.foes).length * 2,
    bonded: bonded ? 100 : 0,
  };
  return MENTOR_PATHS.reduce((best, p) => (scores[p] > scores[best] ? p : best), 'challenger' as MentorPath);
}

/** The open mentorship this Pokémon is the protégé of. */
export function mentorshipOf(run: RunState, proteUid: string): RelationshipRecord | undefined {
  return run.story.relationships.find((r) => r.open && r.kind === 'mentorship' && r.b.id === proteUid);
}

export function mentorPathOf(run: RunState, rel: RelationshipRecord): MentorPath {
  const p = run.story.flags[pathFlag(rel.id)];
  return MENTOR_PATHS.find((x) => x === p) ?? 'challenger';
}

export interface MentorOffer {
  mentorUid: string;
  proteUid: string;
  path: MentorPath;
  /** Why these two fit (doc 2.1); a pair can have several reasons. */
  types: MentorType[];
}

const MAX_ACTIVE = 2;

/** After a win: is there a pair that would make a mentorship? Any of the ten mentorship types qualifies (Beta 0.5); the pair with the most reasons wins. */
export function planMentorship(content: Content, run: RunState): MentorOffer | null {
  const open = run.story.relationships.filter((r) => r.open && r.kind === 'mentorship');
  // A pair waiting for its graduation spar no longer takes up a place.
  const counted = open.filter((r) => !bondOfRel(run, r.id)?.ready);
  if (counted.length >= MAX_ACTIVE || run.pending.some((d) => d.kind === 'mentorship')) return null;
  const busy = new Set(open.flatMap((r) => [r.a.id, r.b.id]));
  const alive = run.party.filter((m) => m.hp > 0 && !busy.has(m.uid));
  let best: { offer: MentorOffer; score: number; gap: number } | null = null;
  for (const mentor of alive) {
    const h = run.story.histories[mentor.uid];
    if (!h) continue;
    for (const prote of alive) {
      if (prote.uid === mentor.uid || run.story.flags[declinedFlag(mentor.uid, prote.uid)]) continue;
      const types = mentorTypesFor(content, run, mentor, prote);
      if (types.length === 0) continue;
      const gap = mentor.level - prote.level;
      if (!best || types.length > best.score || (types.length === best.score && gap > best.gap)) best = { offer: { mentorUid: mentor.uid, proteUid: prote.uid, path: pathFor(run, h), types }, score: types.length, gap };
    }
  }
  return best?.offer ?? null;
}

/** The player's answer. Accepting opens the relationship and its first memory ("It Looks Up to Its Teammate"). */
export function answerMentorship(content: Content, run: RunState, offer: MentorOffer, accept: boolean): string {
  const mentor = run.party.find((m) => m.uid === offer.mentorUid);
  const prote = run.party.find((m) => m.uid === offer.proteUid);
  if (!mentor || !prote) return '';
  const nm = (m: PokemonInstance) => content.species.get(m.speciesId)?.name ?? m.speciesId;
  if (!accept) {
    run.story.flags[declinedFlag(offer.mentorUid, offer.proteUid)] = true;
    return `${nm(prote)} will find its own way.`;
  }
  const cause = emit(content, run, 'storyMoment', {
    actors: [mentor.uid, prote.uid],
    data: { def: 'looks-up', suppressed: false },
    importance: 70,
    text: `${nm(prote)} began to look up to ${nm(mentor)} (${pathName(offer.path)})`,
    emotions: ['kindness'],
  });
  const rel = openRelationship(content, run, 'mentorship', { kind: 'pokemon', id: mentor.uid }, { kind: 'pokemon', id: prote.uid }, cause);
  if (rel) {
    run.story.flags[pathFlag(rel.id)] = offer.path;
    openBond(content, run, rel, offer.types.length ? offer.types : mentorTypesFor(content, run, mentor, prote), mentor, prote);
  }
  return `${nm(prote)} looks up to ${nm(mentor)}: ${pathName(offer.path)}${offer.types.length ? ` (${offer.types.map((t) => TYPE_NAMES[t]).join(', ')})` : ''}.`;
}

/**
 * Ends mentorships whose protégé has grown (evolved, or is within a level of the mentor).
 * "The Student Becomes the Teacher": the protégé gets a title and may mentor others.
 */
/**
 * The move a mentor hands down at graduation (Techno §4: mentor-taught move variants, mastery sharing): the
 * mentor's most-used move that the protégé could learn and doesn't know. The path picks the kind: striker and
 * challenger pass on an attack, the others a support move (or an attack when none fits).
 */
export function mentorTaughtMove(content: Content, run: RunState, rel: RelationshipRecord, mentor: PokemonInstance, prote: PokemonInstance): string | null {
  const used = Object.entries(run.story.histories[mentor.uid]?.moves ?? {}).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const species = content.species.get(prote.speciesId);
  if (!species) return null;
  const pool = new Set([...(content.learnables.get(species.id) ?? (species.form ? content.learnables.get(species.form.base) : undefined) ?? []), ...species.learnset.map((e) => e.move)]);
  const fits = used.map(([id]) => content.moves.get(id)).filter((m) => m && m.supported === true && pool.has(m.id) && !prote.moves.some((k) => k.id === m.id));
  if (fits.length === 0) return null;
  const wantsAttack = ['striker', 'challenger'].includes(mentorPathOf(run, rel));
  return (fits.find((m) => (m!.category !== 'status') === wantsAttack) ?? fits[0])!.id;
}

export function graduateMentorships(content: Content, run: RunState, evolved?: string): string[] {
  const done: string[] = [];
  for (const rel of run.story.relationships) {
    if (!rel.open || rel.kind !== 'mentorship') continue;
    const mentor = run.party.find((m) => m.uid === rel.a.id);
    const prote = run.party.find((m) => m.uid === rel.b.id);
    if (!prote) continue;
    const caughtUp = !mentor || prote.uid === evolved || prote.level >= mentor.level - content.story.mentorship.graduateGap;
    if (!caughtUp) continue;
    // Beta 0.5: with the mentor still in the party, the protégé is "ready" and the pair may hold the graduation spar (camp menu).
    const bond = mentor ? ensureBond(content, run, rel) : undefined;
    if (mentor && bond) {
      const retry = (bond.events.spar ?? 0) > 0 && bond.battlesTogether < 3;
      if (!bond.ready && !retry) {
        bond.ready = true;
        const nm0 = content.species.get(prote.speciesId)?.name ?? prote.speciesId;
        emit(content, run, 'storyMoment', { actors: [prote.uid], data: { def: 'ready-to-graduate', suppressed: false }, importance: 70, text: `${nm0} is ready for a graduation spar (${MENTOR_CFG.graduation.readyGap > 0 ? 'Camp > Mentor' : ''})`, emotions: ['perseverance'] });
      }
      continue;
    }
    closeRelationship(rel);
    const taught = mentor ? mentorTaughtMove(content, run, rel, mentor, prote) : null;
    if (taught && !run.pending.some((p) => p.kind === 'learnMove' && p.uid === prote.uid && p.moveId === taught)) run.pending.push({ kind: 'learnMove', uid: prote.uid, moveId: taught });
    const history = run.story.histories[prote.uid];
    if (history && !history.titles.includes('Former Protégé')) history.titles.push('Former Protégé');
    const nm = content.species.get(prote.speciesId)?.name ?? prote.speciesId;
    emit(content, run, 'storyMoment', {
      actors: [prote.uid],
      data: { def: 'student-teacher', suppressed: false },
      importance: 85,
      text: `The Student Becomes the Teacher: ${nm} finished its mentorship${taught ? ` and was taught ${content.moves.get(taught)?.name ?? taught}` : ''}`,
      emotions: ['perseverance'],
    });
    done.push(prote.uid);
  }
  return done;
}
