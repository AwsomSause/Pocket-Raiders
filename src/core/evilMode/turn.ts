// Evil Mode slice 22: the Turn (design Part 28 sections 14 and 15). A main-game run that joined a team from the inside
// and won the takeover battle after "Take it all" (the route sets `evil-start-<team>`) is offered one card: carry on as
// the Boss. Kice: "Yes but only if you succeed." The conversion is a table, not a roll: the same run Turns the same way
// every time, and no run RNG stream is touched. Pure: no Phaser.

import type { RunState } from '../state';
import type { Rival as RivalRecord } from '../story/schema';
import { CHARTERS, charterDef, takeCharter, type ChartersFile } from './charters';
import { EVIL_DATA, type EvilData } from './data';
import { appendLog } from './ledger';
import { ensureEvil, EVIL_MODE_ID } from './session';
import { EvilModeBlockSchema, PERSONALITIES, type EvilModeBlock, type TurnState } from './schema';

/** Flags a Turn leaves on the run: answered (taken or walked away from), so the card never shows twice. */
export const TURN_ANSWERED = 'ev:evil-turn-answered';

export interface TurnOffer {
  team: string;
  charter: string;
  title: string;
  fields: [string, string][];
  take: string;
  walk: string;
  confirm: string;
  /** The one line said when the Old look is selected (the New layer is mounted for the run; the setting isn't changed). */
  oldLookLine: string;
  /** How many regions the Evil Mode part of the run has. */
  regions: number;
}

/** Regions the main run has left after this one. */
export const regionsLeft = (run: Pick<RunState, 'regionOrder' | 'regionIndex'>): number => Math.max(0, run.regionOrder.length - run.regionIndex - 1);

/** The team whose takeover this run won (its `evil-start-<team>` flag is set), in charters.json's order, or null. */
export function wonTakeover(run: Pick<RunState, 'story'>, file: ChartersFile = CHARTERS): string | null {
  return Object.keys(file.teams).find((t) => Number(run.story.flags[`ev:evil-start-${t}`] ?? 0) >= 1) ?? null;
}

/**
 * The offer (Part 28 sections 14.1 and 14.2): only when `evil-start-<team>` is set in this run (the battle after "Take it
 * all" was won), a region remains, Evil Mode is shown in Settings, and the card hasn't been answered. Null otherwise:
 * the route ends as it does today.
 */
export function turnOffer(run: RunState, opts: { evilOn: boolean }, file: ChartersFile = CHARTERS): TurnOffer | null {
  if (!opts.evilOn || !file.on || run.rules.modeId === EVIL_MODE_ID || run.expansion?.evilMode || run.phase === 'over') return null;
  if (run.story.flags[TURN_ANSWERED]) return null;
  const team = wonTakeover(run, file);
  if (!team) return null;
  const c = charterDef(file.teams[team], file);
  if (!c || c.status === 'disabled') return null;
  const regions = regionsLeft(run);
  if (regions < 1) return null;
  const t = file.turn;
  const fields = t.fields.map(([k, v]) => [k, k === 'What changes' && c.id === 'staff-room' ? t.staffChanges : v] as [string, string]);
  return { team, charter: c.id, title: t.title, fields, take: t.take, walk: t.walk, confirm: t.confirm, oldLookLine: t.oldLookLine, regions };
}

/** "Take it all, and walk away": today's ending, unchanged. Only the answer is noted, so the card never comes back. */
export function walkAway(run: RunState): RunState {
  return { ...run, story: { ...run.story, flags: { ...run.story.flags, [TURN_ANSWERED]: 'walked' } } };
}

/**
 * The four rivals become the four on the road (Part 28 section 15): the Hero has the most meetings (ties: the higher
 * standing, then the lower id); the Rival's been beaten most; the Friend's the one who least wants to beat the player;
 * the Stray's the fourth. Every role is given once and no rival is discarded.
 */
export function assignRoles(rivals: readonly RivalRecord[]): Pick<TurnState, 'hero' | 'rival' | 'friend' | 'stray'> {
  const pool = rivals.filter((r) => r.state !== 'retired' && !r.classId.startsWith('evil-')).slice().sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)).slice(0, 4);
  const take = (cmp: (a: RivalRecord, b: RivalRecord) => number): string | null => {
    const left = pool.filter((r) => !used.has(r.id));
    if (!left.length) return null;
    const pick = left.slice().sort((a, b) => cmp(a, b) || (a.id < b.id ? -1 : 1))[0]!;
    used.add(pick.id);
    return pick.id;
  };
  const used = new Set<string>();
  const hero = take((a, b) => b.encounters - a.encounters || b.rivalPotential - a.rivalPotential);
  const rival = take((a, b) => b.setbacks - a.setbacks);
  const friend = take((a, b) => a.rivalPotential - b.rivalPotential);
  const stray = take(() => 0);
  return { hero, rival, friend, stray };
}

/**
 * How the inside route went (Part 28 section 14.3), read from the run's own flags, never rolled: Loyalty is 4, plus up to
 * 2 for the kind choices made inside and minus up to 2 for the run's turn towards evil; Dread is 2, plus 1 for each thing
 * done on the route that had a victim.
 */
export function routeMoods(run: Pick<RunState, 'story' | 'attributeModifiers'>, file: ChartersFile = CHARTERS): { loyalty: number; dread: number } {
  const t = file.turn;
  const R = t.route;
  const flag = (k: string) => Number(run.story.flags[`ev:${k}`] ?? run.story.flags[k] ?? 0);
  const up = Math.min(R.swing, Math.floor(Math.max(0, flag(R.kindFlag)) / R.kindPer));
  const down = Math.min(R.swing, Math.floor(Math.max(0, -(run.attributeModifiers?.[R.evilAttribute] ?? 0)) / R.evilPer));
  const loyalty = Math.max(0, Math.min(10, t.loyalty + Math.max(-R.swing, Math.min(R.swing, up - down))));
  const dread = Math.min(10, t.dread + R.victims.filter((v) => flag(v) >= 1).length);
  return { loyalty, dread };
}

/** The first Evil Mode region: the next on the main run's map if it's written, else the Charter's own. */
function firstRegion(run: RunState, charterRegion: string, data: EvilData): string {
  const next = run.regionOrder[run.regionIndex + 1];
  const r = data.region.regions.find((x) => x.id === next && x.status !== 'disabled' && x.status !== 'invalid');
  return r?.id ?? charterRegion;
}

/**
 * The conversion (Part 28 section 14.3): run in, an Evil Mode run out. Money becomes Funds up to the cap (the rest stays
 * the Boss's own); badges become Regard; party, bag, Blessings and the region count are kept; pages 2 to 8 are the
 * matching Charter's; the Ledger's first page is the inside route; the run's rivals are given the four roles.
 */
export function turnRun(run: RunState, data: EvilData = EVIL_DATA, file: ChartersFile = CHARTERS): RunState | null {
  const offer = turnOffer(run, { evilOn: true }, file);
  if (!offer) return null;
  const c = charterDef(offer.charter, file)!;
  const t = file.turn;
  const regionId = firstRegion(run, c.region, data);
  const made = takeCharter(c.id, { boss: run.archetypeId, length: offer.regions > 3 ? 'six' : 'three', seed: run.seed }, { ...data }, { ...file, charters: file.charters.map((x) => (x.id === c.id ? { ...x, region: regionId } : x)) });
  if (!made.ok) return null;
  const funds = Math.min(run.money, t.fundsCap);
  const regard = Math.min(t.regardCeiling, Math.floor(run.badges.length / t.regardPerBadges));
  const roles = assignRoles(run.story.rivals);
  const moods = routeMoods(run, file);
  let block: EvilModeBlock = {
    ...made.block,
    from: 'turn',
    settings: { ...made.block.settings, regions: Math.min(6, offer.regions) },
    team: { ...made.block.team, funds, regard, dread: c.dreadFixed ? 0 : moods.dread },
    crew: made.block.crew.map((p) => ({ ...p, loyalty: moods.loyalty, lineHeard: p.line !== null })),
    turn: { team: offer.team, ...roles, pocket: Math.max(0, run.money - funds), met: null },
  };
  block = appendLog(block, { kind: 'charter', who: [], text: `Day 1. ${t.ledgerFirst}` });
  block = appendLog(block, { kind: 'charter', who: [], text: `Day 1. ${c.oldGuard.turnLine}` });
  const flags = { ...run.story.flags, [TURN_ANSWERED]: 'taken' };
  const out: RunState = {
    ...run,
    money: run.money - funds,
    rules: { ...run.rules, modeId: EVIL_MODE_ID },
    phase: 'map',
    story: { ...run.story, flags },
    expansion: { ...(run.expansion ?? {}), evilMode: EvilModeBlockSchema.parse(block) },
  };
  return castRoles(ensureEvil(out));
}

/** The Hero and the other three take the names and natures of the run's own rivals (their records are kept, not replaced). */
function castRoles(run: RunState): RunState {
  const b = run.expansion?.evilMode;
  if (!b?.turn) return run;
  const rec = (id: string | null) => (id ? run.story.rivals.find((r) => r.id === id) : undefined);
  const nature = (r: RivalRecord | undefined, fallback: (typeof PERSONALITIES)[number]) => ((PERSONALITIES as readonly string[]).includes(r?.archetype ?? '') ? (r!.archetype as (typeof PERSONALITIES)[number]) : fallback);
  let block = b;
  const h = rec(b.turn.hero);
  if (block.hero && h) block = { ...block, hero: { ...block.hero, name: h.name, personality: nature(h, block.hero.personality), marks: Math.min(5, h.encounters), temper: Math.max(1, block.hero.temper) } };
  const byRole = { rival: rec(b.turn.rival), friend: rec(b.turn.friend), stray: rec(b.turn.stray) } as const;
  block = { ...block, road: block.road.map((k) => { const r = byRole[k.role]; return r ? { ...k, name: r.name, personality: nature(r, k.personality) } : k; }) };
  // The rival records made for the road carry the same names (the battle screen reads them).
  const names = new Map<string, string>([...(block.hero ? [[block.hero.rivalId, block.hero.name] as [string, string]] : []), ...block.road.map((k) => [k.id, k.name] as [string, string])]);
  const rivals = run.story.rivals.map((r) => (names.has(r.id) ? { ...r, name: names.get(r.id)! } : r));
  return { ...run, story: { ...run.story, rivals }, expansion: { ...(run.expansion ?? {}), evilMode: EvilModeBlockSchema.parse(block) } };
}
