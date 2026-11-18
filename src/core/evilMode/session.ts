// Evil Mode on a run: founding writes `run.expansion.evilMode`, each beat steps it. Pure: a new run is returned and the
// input is never changed. The game session saves after each (design Part 30 section 6.3: saved at the end of every beat).

import type { RunState } from '../state';
import { step, type EvilAction, type EvilCue } from './day';
import { layDistrict } from './board';
import { EVIL_DATA } from './data';
import { makeHero } from './hero';
import { makeRoad } from './road';
import { monName } from './temper';
import { RivalSchema } from '../story/schema';
import { foundTeam, type FoundingChoice } from './start';
import { takeCharter } from './charters';
import type { EvilModeBlock, RunLength } from './schema';

/** The Run Setup mode id (src/data/runRules.json). */
export const EVIL_MODE_ID = 'evil-mode';

export const isEvilRun = (run: RunState | null | undefined): boolean => run?.rules.modeId === EVIL_MODE_ID;
export const evilBlock = (run: RunState | null | undefined): EvilModeBlock | undefined => run?.expansion?.evilMode;

/** Founds the team once. A run that already has a team keeps it (a double press, a replayed action: nothing twice). */
export function foundInRun(run: RunState, choice: FoundingChoice, length: RunLength, stage?: number, edges: { shadow?: boolean; incursions?: boolean } = {}): { run: RunState; problem: string | null } {
  if (!isEvilRun(run)) return { run, problem: 'This run is not an Evil Mode run.' };
  if (run.expansion?.evilMode) return { run, problem: null };
  const out = foundTeam(choice, { boss: run.archetypeId, length, seed: run.seed, ...(stage ? { stage } : {}), ...edges });
  if (!out.ok) return { run, problem: out.problem };
  return { run: ensureHero({ ...run, expansion: { ...(run.expansion ?? {}), evilMode: out.block } }), problem: null };
}

/** Slice 22: takes a Charter once (Part 28): pages 2 to 8 are the Charter's, the Boss and starter the player's. */
export function charterInRun(run: RunState, id: string, length: RunLength): { run: RunState; problem: string | null } {
  if (!isEvilRun(run)) return { run, problem: 'This run is not an Evil Mode run.' };
  if (run.expansion?.evilMode) return { run, problem: null };
  const out = takeCharter(id, { boss: run.archetypeId, length, seed: run.seed });
  if (!out.ok) return { run, problem: out.problem };
  return { run: ensureHero({ ...run, expansion: { ...(run.expansion ?? {}), evilMode: out.block } }), problem: null };
}

/** A block migrated from v1 has no district yet: lay it from the run's seed (the same seed lays the same district). */
export function ensureDistrict(run: RunState): RunState {
  const block = run.expansion?.evilMode;
  if (!block || block.district) return run;
  const district = layDistrict(run.seed, block.here.region, Math.max(1, block.here.stage - 1), block.team);
  return { ...run, expansion: { ...(run.expansion ?? {}), evilMode: { ...block, district } } };
}

/** One action on the day. Without a team, nothing happens. */
export function stepInRun(run0: RunState, action: EvilAction): { run: RunState; cues: EvilCue[]; ok: boolean } {
  const run = ensureEvil(run0);
  const block = run.expansion?.evilMode;
  if (!block) return { run: run0, cues: [], ok: false };
  const r = step(block, action);
  if (!r.ok) return { run: run0, cues: r.cues, ok: false };
  let out: RunState = { ...run, expansion: { ...(run.expansion ?? {}), evilMode: r.block } };
  // Slice 13: "Open the ball": the Legend goes, out of the party or the box, once.
  const nb = r.block.neighbour;
  if (nb?.legend === 'freed' && nb.legendUid) {
    const uid = nb.legendUid;
    out = { ...out, party: out.party.filter((m) => m.uid !== uid), box: (out.box ?? []).filter((m) => m.uid !== uid), expansion: { ...(out.expansion ?? {}), evilMode: { ...r.block, neighbour: { ...nb, legendUid: null } } } };
  }
  // Slice 21: a Beast that left in the night goes out of the party or the box, once.
  for (const a of r.block.applied) {
    if (!a.startsWith('beast-left:') || block.applied.includes(a)) continue;
    const uid = a.slice('beast-left:'.length);
    out = { ...out, party: out.party.filter((m) => m.uid !== uid), box: (out.box ?? []).filter((m) => m.uid !== uid) };
  }
  return { run: out, cues: r.cues, ok: true };
}

/** Everything a block saved by an earlier slice is missing, made once: the district, then the Hero. */
export const ensureEvil = (run: RunState): RunState => ensureRoad(ensureHero(ensureDistrict(run)));

/**
 * The Hero's record in the rival system (design Part 18 section 2), made once from the run's seed. Its state is never
 * `retired` and it has no discouraged ending: their loss never removes them.
 */
export function ensureHero(run: RunState, bossStarter: string | null = run.party[0]?.speciesId ?? null): RunState {
  const block = run.expansion?.evilMode;
  if (!block || block.hero || !block.district || !EVIL_DATA.hero.on) return run;
  const made = makeHero(run.seed, block.district, bossStarter);
  const rival = RivalSchema.parse({
    id: made.hero.rivalId, classId: 'evil-hero', name: made.hero.name, archetype: made.hero.personality, style: 'balanced',
    traits: made.traits, rivalPotential: 100, state: 'recurring', voice: made.hero.personality,
    origin: { eventId: 'evil-mode:hero', where: { region: block.here.region, stage: block.here.stage, level: made.hero.at, node: null, battle: null, turn: null }, path: 'evil-hero' },
    memory: { lastBattle: { eventId: 'evil-mode:hero', result: 'win', hpLeftShare: 1, turns: 0, team: made.team, foes: [] } },
  });
  const rivals = [...run.story.rivals.filter((r) => r.id !== rival.id), rival];
  return { ...run, story: { ...run.story, rivals }, expansion: { ...(run.expansion ?? {}), evilMode: { ...block, hero: made.hero } } };
}

/**
 * Slice 12: the other three on the road (design Part 20), made once from the run's seed after the Hero, each a record in
 * the rival system like the Hero's (four, always: none is ever removed; going home is a state on the road, not a delete).
 * A Hero made before slice 12 gets their starter's name read back from their record.
 */
export function ensureRoad(run: RunState): RunState {
  const block = run.expansion?.evilMode;
  if (!block?.hero || !block.district || !EVIL_DATA.road.on) return run;
  let b = block;
  if (!b.hero!.starter) {
    const rec = run.story.rivals.find((r) => r.id === b.hero!.rivalId);
    const starter = rec?.memory?.lastBattle?.team?.[0];
    if (starter) b = { ...b, hero: { ...b.hero!, starter: monName(starter) } };
  }
  if (b.road.length) return b === block ? run : { ...run, expansion: { ...(run.expansion ?? {}), evilMode: b } };
  const made = makeRoad(run.seed, b.hero!, b.district!, run.archetypeId);
  const recs = made.road.map((t, i) => RivalSchema.parse({
    id: t.id, classId: `evil-${t.role}`, name: t.name, archetype: t.personality, style: 'balanced',
    traits: made.traits[i], rivalPotential: 60, state: 'recurring', voice: t.personality,
    origin: { eventId: `evil-mode:${t.role}`, where: { region: b.here.region, stage: b.here.stage, level: 1, node: null, battle: null, turn: null }, path: `evil-${t.role}` },
    memory: { lastBattle: { eventId: `evil-mode:${t.role}`, result: 'win', hpLeftShare: 1, turns: 0, team: [], foes: [] } },
  }));
  const ids = new Set(recs.map((r) => r.id));
  const rivals = [...run.story.rivals.filter((r) => !ids.has(r.id)), ...recs];
  return { ...run, story: { ...run.story, rivals }, expansion: { ...(run.expansion ?? {}), evilMode: { ...b, road: made.road } } };
}

/**
 * Slice 15: the run ends once its ending's last scene is read (Part 23 section 1.4). Every ending ends the run the same
 * way (`victory` false for all six: no ending is ranked above another). Null when no ending is done.
 */
export function finishEvil(run: RunState): RunState | null {
  const b = run.expansion?.evilMode;
  if (!b?.ending?.done || run.phase === 'over' || run.battle) return null;
  const out = structuredClone(run);
  out.phase = 'over';
  out.victory = false;
  return out;
}
