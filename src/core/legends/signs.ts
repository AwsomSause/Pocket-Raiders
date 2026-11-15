// Catalog Overhaul Pack (legends): Signs and Tellings.
// Any event may set a run flag `sign-<legend>` (a Legendary Sign worth +N Influence) or `telling-<mythical>` (one Telling of a Mythical).
// The `flag` effect calls `legendFlag` here, which turns them into Influence on the run's blessing (LEGENDARY_BLESSINGS.md section 4:
// Influence never falls, and a Sign only counts for the Legendary that blesses this run) and into Telling counts (MYTHICAL_PROMISES.md).
// It also keeps a few read-only mirror flags current, so events of every category can read the run's blessing, Guest and Promise with a
// plain `flag` condition. Pure rules, no Phaser, no RNG. Shared contract: /mnt/project-files/plans/catalog-overhaul/LEGENDS_PIECES.md.

import { getBlessing } from '../blessings';
import { MYTHICALS } from '../instrumentality/promisesData';
import type { RunState } from '../state';

/** Groups a Sign may name instead of one Legendary (species ids). `own` is whichever Legendary blesses this run. */
export const SIGN_GROUPS: Readonly<Record<string, readonly string[]>> = {
  bird: ['articuno', 'zapdos', 'moltres', 'lugia', 'ho-oh'],
  beast: ['raikou', 'entei', 'suicune'],
  regi: ['regirock', 'regice', 'registeel', 'regieleki', 'regidrago', 'regigigas'],
  lake: ['uxie', 'mesprit', 'azelf'],
  tapu: ['tapu-koko', 'tapu-lele', 'tapu-bulu', 'tapu-fini'],
  weather: ['kyogre', 'groudon', 'rayquaza'],
  creation: ['dialga', 'palkia', 'giratina'],
  tao: ['reshiram', 'zekrom', 'kyurem'],
  swords: ['cobalion', 'terrakion', 'virizion'],
  forces: ['tornadus', 'thundurus', 'landorus', 'enamorus'],
  ruin: ['wo-chien', 'chien-pao', 'ting-lu', 'chi-yu'],
  loyal: ['okidogi', 'munkidori', 'fezandipiti', 'ogerpon'],
  eon: ['latias', 'latios'],
  hero: ['zacian', 'zamazenta'],
  fire: ['heatran', 'groudon', 'ho-oh', 'moltres', 'entei', 'reshiram'],
  aura: ['xerneas', 'yveltal', 'zygarde'],
  light: ['solgaleo', 'lunala', 'necrozma', 'cosmog', 'cosmoem'],
  crown: ['calyrex', 'glastrier', 'spectrier'],
  paradox: ['koraidon', 'miraidon'],
};

/** Groups whose Legendaries travel in company (a trio, a pair, a court). A Legendary in none of them is solitary (`blessing-company` 0). */
export const COMPANY_GROUPS: readonly string[] = ['bird', 'beast', 'regi', 'lake', 'tapu', 'swords', 'forces', 'tao', 'ruin', 'loyal', 'eon', 'hero', 'crown'];

/** The Influence ladder (LEGENDARY_BLESSINGS.md section 4). */
export const LADDER = [
  { at: 3, id: 'echoes', line: 'Echoes: its shadow, an inscription, someone changed by it. It has turned its head.' },
  { at: 5, id: 'trial', line: 'The Trial: its special challenge can appear now.' },
  { at: 7, id: 'recognition', line: 'Recognition: it knows you. It may offer a test instead of a battle.' },
  { at: 9, id: 'presence', line: 'The Presence: it may come to you.' },
] as const;
export type LadderStep = 'signs' | (typeof LADDER)[number]['id'];
export const ladderStep = (influence: number): LadderStep => [...LADDER].reverse().find((s) => influence >= s.at)?.id ?? 'signs';
/** Chance per region that the Legendary's own encounter is placed, by Influence. */
export const presenceChance = (influence: number): number => (influence >= 9 ? 0.65 : influence >= 7 ? 0.45 : influence >= 5 ? 0.25 : influence >= 3 ? 0.12 : 0.04);

const flags = (run: Pick<RunState, 'story'>) => run.story.flags;
const setFlag = (run: Pick<RunState, 'story'>, key: string, value: number): void => {
  if (value <= 0) delete flags(run)[`ev:${key}`];
  else flags(run)[`ev:${key}`] = value;
};

/** The species id of the Legendary that blesses this run, or null (Blessings off, old save). */
export function blessingLegend(run: Pick<RunState, 'expansion'>): string | null {
  const id = run.expansion?.blessing?.id;
  return (id && getBlessing(id)?.speciesId) || null;
}

/** Whether a Sign named `who` (a species id, a group, or `own`) is a Sign of this Legendary. */
export const signMatches = (who: string, legend: string): boolean => who === 'own' || who === legend || (SIGN_GROUPS[who]?.includes(legend) ?? false);

/**
 * Keeps the read-only mirror flags current: `blessing-<legend>`, `blessing-<group>`, `blessing-influence`, `blessing-communion`, `blessing-company`, `blessing-solitary`,
 * `guest-<mythical>`, `promise-<mythical>`, `promise-kept-<mythical>`, `promise-broken-<mythical>`. Cheap and idempotent; called at
 * every stage start and after every Sign or Telling.
 */
export function syncLegendFlags(run: Pick<RunState, 'story' | 'expansion'>): void {
  const legend = blessingLegend(run);
  const state = run.expansion?.blessing;
  if (legend && state) {
    setFlag(run, `blessing-${legend}`, 1);
    for (const [group, members] of Object.entries(SIGN_GROUPS)) if (members.includes(legend)) setFlag(run, `blessing-${group}`, 1);
    setFlag(run, 'blessing-influence', state.influence);
    setFlag(run, 'blessing-communion', state.communion ? 1 : 0);
    const company = COMPANY_GROUPS.some((g) => SIGN_GROUPS[g]!.includes(legend));
    setFlag(run, 'blessing-company', company ? 1 : 0);
    setFlag(run, 'blessing-solitary', company ? 0 : 1);
  }
  const p = run.expansion?.promise;
  if (p) {
    for (const m of MYTHICALS) {
      const guest = p.guest?.id === m.id;
      setFlag(run, `guest-${m.id}`, guest ? 1 : 0);
      setFlag(run, `promise-${m.id}`, guest ? 1 : 0);
      if (p.kept.includes(m.id)) setFlag(run, `promise-kept-${m.id}`, 1);
      if (p.left.includes(m.id)) setFlag(run, `promise-broken-${m.id}`, 1);
    }
  }
}

/** A Sign: +N Influence when it is a Sign of the run's own Legendary. Returns the journal lines for each ladder step newly reached. */
export function addSign(run: RunState, who: string, amount: number): string[] {
  const legend = blessingLegend(run);
  const state = run.expansion?.blessing;
  if (!legend || !state || amount <= 0 || !signMatches(who, legend)) return [];
  const before = state.influence;
  state.influence = before + amount; // Influence never falls.
  const name = getBlessing(state.id)!.legendary;
  const lines = LADDER.filter((s) => before < s.at && state.influence >= s.at).map((s) => `${name}: ${s.line}`);
  syncLegendFlags(run);
  return lines;
}

/** A Telling: one more story heard of this Mythical (any Mythical in the data; three make it believed). Returns the line to show. */
export function addTelling(run: RunState, mythical: string, amount: number): string | null {
  const def = MYTHICALS.find((m) => m.id === mythical);
  if (!def || amount <= 0 || !run.expansion?.promises) return null;
  const p = run.expansion.promise ?? { tellings: {}, visited: null, guest: null, kept: [], left: [] };
  const n = p.tellings[mythical] ?? 0;
  run.expansion = { ...run.expansion, promise: { ...p, tellings: { ...p.tellings, [mythical]: n + amount } } };
  syncLegendFlags(run);
  return n < 3 && n + amount >= 3 ? `You have heard enough of ${def.title} to believe it.` : null;
}

/** Called by the `flag` effect for every flag an event sets. Returns journal lines (may be empty). */
export function legendFlag(run: RunState, key: string, amount: number): string[] {
  if (key.startsWith('sign-')) return addSign(run, key.slice('sign-'.length), amount);
  if (key.startsWith('telling-')) {
    const line = addTelling(run, key.slice('telling-'.length), amount);
    return line ? [line] : [];
  }
  return [];
}
