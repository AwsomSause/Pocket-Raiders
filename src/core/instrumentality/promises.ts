// Beta 0.7 M1: Mythical Promises (notes-pack/MYTHICAL_PROMISES.md), in-run only. Tellings (3 make it believed), the Visit
// (10% a region, +3% for each Telling past the third, to 25%; one Mythical per run), the Promise as a rule the game can check
// with a warning before it is broken, and the Guest (a companion outside the party). Pure helpers over `run.expansion.promise`;
// they use their own seeded streams (`mythical-telling`, `mythical-visit`) so no other roll moves. No Keepsakes, no Storybook,
// nothing that outlives the run. Only Mythicals whose status is `supported` (promisesData.ts) visit at random; every non-disabled one can be told of (Visit scenes handle the rest).

import type { Content } from '../contentSchema';
import { hashSeed, Rng } from '../rng';
import { getSpecies } from '../pokemon';
import type { PendingDecision, RunState } from '../state';
import { MYTHICALS, type MythicalDef, type PromiseRule } from './promisesData';

export { MYTHICALS };
export const TELLINGS_TO_BELIEVE = 3;
export const VISIT = { baseChance: 0.1, perExtraTelling: 0.03, maxChance: 0.25, declineGiftMoney: 500 } as const;

export type PromiseRun = NonNullable<NonNullable<RunState['expansion']>['promise']>;
type VisitDecision = Extract<PendingDecision, { kind: 'mythicalVisit' }>;

export const mythicalOf = (id: string): MythicalDef | undefined => MYTHICALS.find((m) => m.id === id);

export const promiseState = (run: Pick<RunState, 'expansion'>): PromiseRun => run.expansion?.promise ?? { tellings: {}, visited: null, guest: null, kept: [], left: [] };
const save = (run: RunState, p: PromiseRun): void => { run.expansion = { ...run.expansion, promise: p }; };

export const tellingsHeard = (run: Pick<RunState, 'expansion'>, id: string): number => promiseState(run).tellings[id] ?? 0;
export const believed = (run: Pick<RunState, 'expansion'>, id: string): boolean => tellingsHeard(run, id) >= TELLINGS_TO_BELIEVE;

/** Only supported Mythicals can visit at random (their Wonder is built). */
const visitors = (): MythicalDef[] => MYTHICALS.filter((m) => m.status === 'supported');
/** Every Mythical that is not disabled can be told of and believed: each has its own Visit scene (legends questlines), so the stage Telling no longer only ever names Zarude. */
const tellable = (): MythicalDef[] => MYTHICALS.filter((m) => m.status !== 'disabled');

/** What makes a visit possible this run ("Comes when"). Supported Mythicals only; the others have no trigger yet. */
const COMES_WHEN: Record<string, (content: Content, run: RunState) => boolean> = {
  zarude: (_c, run) => [...run.party, ...run.box].some((m) => m.hatched === true),
};
export const comesWhenMet = (content: Content, run: RunState, id: string): boolean => COMES_WHEN[id]?.(content, run) ?? false;

/** One Telling per new stage, about the Mythical already half-told, else a seeded pick. Returns the line, or null (nothing left, or off). */
export function hearTelling(run: RunState, stageKey: number): string | null {
  if (!run.expansion?.promises) return null;
  const p = promiseState(run);
  if (p.visited || p.guest) return null;
  const open = tellable().filter((m) => (p.tellings[m.id] ?? 0) < TELLINGS_TO_BELIEVE);
  if (open.length === 0) return null;
  const started = open.filter((m) => (p.tellings[m.id] ?? 0) > 0);
  const pool = started.length > 0 ? started : open;
  const def = pool[new Rng(hashSeed(`${run.seed}::mythical-telling::${stageKey}`)).int(0, pool.length - 1)]!;
  const n = p.tellings[def.id] ?? 0;
  save(run, { ...p, tellings: { ...p.tellings, [def.id]: n + 1 } });
  return `A Telling of ${def.title} (${n + 1}/${TELLINGS_TO_BELIEVE}): "${def.tellings[n]}"${n + 1 >= TELLINGS_TO_BELIEVE ? ' You begin to believe it.' : ''}`;
}

export const visitChance = (tellings: number): number => Math.min(VISIT.maxChance, VISIT.baseChance + Math.max(0, tellings - TELLINGS_TO_BELIEVE) * VISIT.perExtraTelling);

/** The visit offer for this region, or null. Once a Mythical has been offered (even declined) none comes again this run. */
export function rollVisit(content: Content, run: RunState, regionKey: number): VisitDecision | null {
  if (!run.expansion?.promises) return null;
  const p = promiseState(run);
  if (p.visited || p.guest) return null;
  const candidates = visitors().filter((m) => believed(run, m.id) && comesWhenMet(content, run, m.id));
  if (candidates.length === 0) return null;
  const rng = new Rng(hashSeed(`${run.seed}::mythical-visit::${regionKey}`));
  const def = candidates[rng.int(0, candidates.length - 1)]!;
  if (!rng.chance(visitChance(tellingsHeard(run, def.id)))) return null;
  save(run, { ...p, visited: def.id });
  return {
    kind: 'mythicalVisit',
    mythicalId: def.id,
    title: `${def.title} comes to you. It cannot be battled or caught.`,
    options: [
      { label: 'Make the promise', description: `${def.promise} ${def.forgivesOnce ? 'It forgives once.' : 'It does not forgive.'} Wonder: ${def.wonder}` },
      { label: 'Decline', description: 'It leaves a small gift and goes. No harm done.' },
    ],
  };
}

/** Option 0 accepts (it becomes the Guest); anything else declines (a small gift). Never throws on a stale choice. */
export function resolveVisit(run: RunState, decision: VisitDecision, optionIndex: number): string {
  const def = mythicalOf(decision.mythicalId);
  const p = promiseState(run);
  if (optionIndex === 0 && def && !p.guest) {
    save(run, { ...p, visited: def.id, guest: { id: def.id, forgiven: false } });
    return `${def.title} walks beside you now. ${def.promise}`;
  }
  run.money += VISIT.declineGiftMoney;
  return `${def?.title ?? 'It'} leaves a small gift (₽${VISIT.declineGiftMoney}) and goes.`;
}

// ---------- the Promise as a checkable rule ----------

export type PromiseEvent =
  | { kind: 'partyChanged' }
  | { kind: 'wildKo'; types: readonly string[] }
  | { kind: 'refuseRequest' }
  | { kind: 'lead'; uid: string; previousLead: string | null }
  | { kind: 'declineWaterPath' }
  | { kind: 'release' }
  | { kind: 'restUsed'; previousUsed: boolean }
  | { kind: 'ungenerousEnding' }
  | { kind: 'flee' }
  | { kind: 'acceptAssist' }
  | { kind: 'quitMinigame' }
  | { kind: 'useTm' }
  | { kind: 'sell' }
  | { kind: 'bagCount'; items: number }
  | { kind: 'abandonRescued' }
  | { kind: 'bouquetLost' }
  | { kind: 'retry' }
  | { kind: 'catch' }
  | { kind: 'stageEndNotFed' }
  | { kind: 'regionEndNotGiven' }
  | { kind: 'faint'; uid: string }
  | { kind: 'declineGift' };

/** The youngest party member: lowest level, a hatched one first on a tie, then by uid. */
export function youngestUid(run: Pick<RunState, 'party'>): string | null {
  const sorted = [...run.party].sort((a, b) => a.level - b.level || Number(b.hatched === true) - Number(a.hatched === true) || a.uid.localeCompare(b.uid));
  return sorted[0]?.uid ?? null;
}

/** True when `ev` breaks the rule. Every rule is a plain condition; none needs a roll. */
export function breaks(content: Content, run: Pick<RunState, 'party'>, rule: PromiseRule, ev: PromiseEvent): boolean {
  switch (rule) {
    case 'partyTypePairs': {
      if (ev.kind !== 'partyChanged') return false;
      const pairs = run.party.map((m) => [...getSpecies(content, m.speciesId).types].sort().join('/'));
      return new Set(pairs).size !== pairs.length;
    }
    case 'noWildGrassBugKo': return ev.kind === 'wildKo' && ev.types.some((t) => t === 'grass' || t === 'bug');
    case 'agreeAll': return ev.kind === 'refuseRequest';
    case 'newLeadEachStage': return ev.kind === 'lead' && ev.previousLead === ev.uid;
    case 'takeWaterPaths': return ev.kind === 'declineWaterPath';
    case 'noRelease': return ev.kind === 'release';
    case 'noConsecutiveRest': return ev.kind === 'restUsed' && ev.previousUsed;
    case 'generousEndings': return ev.kind === 'ungenerousEnding';
    case 'noFlee': return ev.kind === 'flee';
    case 'noAssist': return ev.kind === 'acceptAssist';
    case 'finishMinigames': return ev.kind === 'quitMinigame';
    case 'noTm': return ev.kind === 'useTm';
    case 'noSell': return ev.kind === 'sell';
    case 'bagThree': return ev.kind === 'bagCount' && ev.items < 3;
    case 'finishRescues': return ev.kind === 'abandonRescued';
    case 'carryBouquet': return ev.kind === 'bouquetLost';
    case 'noRetry': return ev.kind === 'retry';
    case 'noCatch': return ev.kind === 'catch';
    case 'feedEachStage': return ev.kind === 'stageEndNotFed';
    case 'giveEachRegion': return ev.kind === 'regionEndNotGiven';
    case 'youngestNeverFaints': return ev.kind === 'faint' && ev.uid === youngestUid(run);
    case 'acceptGifts': return ev.kind === 'declineGift';
    case 'judgment': return false;
  }
}

/** The mark shown before a breaking action is confirmed (null: the action is fine, or there is no Guest). */
export function promiseWarning(content: Content, run: RunState, ev: PromiseEvent): string | null {
  const guest = promiseState(run).guest;
  const def = guest && mythicalOf(guest.id);
  if (!def || !breaks(content, run, def.rule, ev)) return null;
  return `Careful: this breaks your promise to ${def.title}. ${guest.forgiven || !def.forgivesOnce ? 'It will leave.' : 'It forgives once.'}`;
}

/** Applies an event to the Guest's Promise. Breaking it forgives once (where allowed), else the Guest leaves. Returns the lines to show. */
export function noteEvent(content: Content, run: RunState, ev: PromiseEvent): string[] {
  const p = promiseState(run);
  const def = p.guest && mythicalOf(p.guest.id);
  if (!p.guest || !def || !breaks(content, run, def.rule, ev)) return [];
  if (def.forgivesOnce && !p.guest.forgiven) {
    save(run, { ...p, guest: { ...p.guest, forgiven: true } });
    return [`${def.title} saw you break the promise. It forgives you this once.`];
  }
  save(run, { ...p, guest: null, left: [...p.left, def.id] });
  return [`You broke your promise. ${def.title} leaves.`];
}

/** The Wonders that act in the run's flow. Zarude: after every won battle the party recovers 10% HP and is cured of status. */
export function wonderAfterBattle(content: Content, run: RunState, maxHpOf: (m: RunState['party'][number]) => number): string | null {
  if (promiseState(run).guest?.id !== 'zarude') return null;
  for (const m of run.party) {
    if (m.hp <= 0) continue;
    m.hp = Math.min(maxHpOf(m), m.hp + Math.ceil(maxHpOf(m) * 0.1));
    m.status = null;
  }
  return 'Zarude\'s vines bind your party\'s wounds.';
}
