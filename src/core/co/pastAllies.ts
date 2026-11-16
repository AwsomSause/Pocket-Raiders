// Catalog Overhaul batch 5, row E: PAST ALLIES, rebuilt as SAME-RUN versions (Kice 2026-11-14: memory of past nodes, events,
// stages, fights and regions is allowed only inside the run it happened in). The pack's Past Allies read past runs; here every
// source is something from earlier in THIS run:
// - frames: the run's big-battle replays (`story.replays`: Gym, Elite Four, Champion, rival and nemesis fights, won or lost; your
//   team that day and theirs). The Hall rebuilds one, the Archive hangs them as frames, the stranger and the veteran read them.
// - echoes: the rival dialogue lines already said this run (`expansion.rival[*].bankUsed` keys, turned back into the words).
// - the item an event took from you this run (`co:pa-lost`), the Pokémon you left this run (greenneedle `leftTeam`).
// Pure and deterministic: no RNG of its own (the Ranch Egg uses the event's Rng, like every event Egg).

import type { Content } from '../contentSchema';
import type { BattleReplay } from '../memories/schema';
import type { RunState } from '../state';
import { BANK, speciesLines, type BankContext } from '../rivals/bank';
import { leftTeam } from '../greenneedle/left';

type Run = RunState;
export type PastPick = 'won' | 'fell' | 'earliest' | 'best' | 'rival' | 'second';
export type PastHas = PastPick | 'echoes' | 'lostItem' | 'left' | 'pedestal' | 'ranchReleased';

const LOST = 'co:pa-lost';
const PEDESTAL = 'co:pa-pedestal';
const TAG_SPECIES = 'co:tag-partner-species';
const TAG_BOOST = 'co:tag-partner-boost';
const TAG_REGION = 'co:tag-partner-region';
/** Which battles rank highest for "your best": a Champion win beats an Elite win beats a Gym win. */
const RANK: Record<BattleReplay['kind'], number> = { champion: 6, elite: 5, gym: 4, rival: 3, nemesis: 2, ghost: 1, gauntlet: 1, echo: 1 };
/** Battles that are themselves a memory (a ghost, the gauntlet, an echo) never become a new frame. */
const isFrame = (r: BattleReplay): boolean => r.kind !== 'ghost' && r.kind !== 'gauntlet' && r.kind !== 'echo' && r.team.length > 0;

/** This run's frames, oldest first. */
export function frames(run: Pick<Run, 'story'>): BattleReplay[] {
  return (run.story.replays ?? []).filter(isFrame);
}

/** The frame a Past Ally scene reads, or undefined when this run has none yet. */
export function pastReplay(run: Pick<Run, 'story'>, pick: PastPick): BattleReplay | undefined {
  const all = frames(run);
  const newest = (f: (r: BattleReplay) => boolean): BattleReplay | undefined => [...all].reverse().find(f);
  switch (pick) {
    case 'won': return newest((r) => r.outcome === 'win');
    case 'fell': return newest((r) => r.outcome === 'lose');
    case 'earliest': return all[0];
    case 'second': return all.length >= 2 ? all[1] : undefined;
    case 'rival': return newest((r) => r.kind === 'rival' && r.outcome === 'win' && r.foe.team.length > 0);
    case 'best': {
      const wins = all.filter((r) => r.outcome === 'win');
      return wins.reduce<BattleReplay | undefined>((b, r) => (!b || RANK[r.kind] > RANK[b.kind] || (RANK[r.kind] === RANK[b.kind] && r.team.length >= b.team.length) ? r : b), undefined);
    }
  }
}

/** The species the Hall sends out for a pick: your own team that day, or the rival's team for `rival`. */
export function pastTeam(run: Pick<Run, 'story'>, pick: PastPick): string[] {
  const r = pastReplay(run, pick);
  if (!r) return [];
  return (pick === 'rival' ? r.foe.team : r.team).slice(0, 6);
}

/** A Familiar Face Steps In: the ace of the trainer you beat most recently in a big battle (they owe you one), or undefined. */
export function pastAllyAce(run: Pick<Run, 'story'>): string | undefined {
  const r = pastReplay(run, 'won');
  return r?.foe.team[r.foe.team.length - 1];
}

// ---------- rival echoes (the Rival Archive of this run) ----------

/** The words of every bank line a rival said this run, oldest first (at most `max`, the newest kept). */
export function rivalEchoes(content: Content, run: Pick<Run, 'expansion'>, max = 6): { rivalId: string; text: string }[] {
  const out: { rivalId: string; text: string }[] = [];
  for (const [rivalId, rec] of Object.entries(run.expansion?.rival ?? {})) {
    const p = BANK.personalities[rec.personality] as unknown as Record<BankContext, string[]> | undefined;
    if (!p) continue;
    for (const key of rec.bankUsed ?? []) {
      const [head, a, b] = key.split(':');
      if (head === 'mon' && a && b !== undefined) {
        const sp = content.species.get(a);
        const line = sp ? speciesLines(rec.personality, sp)[Number(b)] : undefined;
        if (line) out.push({ rivalId, text: line.text });
      } else if (head && a !== undefined) {
        const text = p[head as BankContext]?.[Number(a)];
        if (text) out.push({ rivalId, text });
      }
    }
  }
  return out.slice(-max);
}

// ---------- the Lost-and-Found Desk ----------

/** An event took a random item from the bag (loseItem without a named item): the desk remembers the newest. */
export function noteLostItem(run: Pick<Run, 'story'>, id: string): void {
  run.story.flags[LOST] = id;
}
export const lostItem = (run: Pick<Run, 'story'>): string | null => (typeof run.story.flags[LOST] === 'string' && run.story.flags[LOST] ? (run.story.flags[LOST] as string) : null);
/** The desk hands it back (once): returns the item id, or null. */
export function takeLostItem(run: Pick<Run, 'story'>): string | null {
  const id = lostItem(run);
  if (id) delete run.story.flags[LOST];
  return id;
}

// ---------- the Legacy Pedestal ----------

export const pedestalItem = (run: Pick<Run, 'story'>): string | null => (typeof run.story.flags[PEDESTAL] === 'string' && run.story.flags[PEDESTAL] ? (run.story.flags[PEDESTAL] as string) : null);
/** Leaves `id` on the pedestal (it must be in the bag). Returns false when it is not. */
export function leaveOnPedestal(run: Run, id: string): boolean {
  if ((run.inventory[id] ?? 0) <= 0 || pedestalItem(run)) return false;
  run.inventory[id] = (run.inventory[id] ?? 0) - 1;
  if (run.inventory[id] === 0) delete run.inventory[id];
  run.story.flags[PEDESTAL] = id;
  return true;
}
/** The one who took it pays it back: the item id (cleared), or null. */
export function pedestalThanks(run: Pick<Run, 'story'>): string | null {
  const id = pedestalItem(run);
  if (id) run.story.flags[PEDESTAL] = '';
  return id;
}

// ---------- the Ranch Keeper's Egg ----------

export interface RanchSource { speciesId: string; from: 'released' | 'fallen' | 'boxed'; move: string | null; nick?: string }
/** The Pokémon you left this run with the highest Bond (a boxed one with the most friendship; else the newest fallen, else released). */
export function ranchSource(run: Run): RanchSource | null {
  const left = leftTeam(run);
  const boxed = run.box.filter((m) => left.some((l) => l.uid === m.uid)).sort((a, b) => b.friendship - a.friendship || a.uid.localeCompare(b.uid))[0];
  if (boxed) {
    const counts = Object.entries(boxed.moveCounts ?? {}).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    const move = counts[0]?.[0] ?? boxed.moves[0]?.id ?? null;
    return { speciesId: boxed.speciesId, from: 'boxed', move, ...(boxed.care?.nickname ? { nick: boxed.care.nickname } : {}) };
  }
  const other = left.find((l) => l.from === 'fallen') ?? left.find((l) => l.from === 'released');
  return other ? { speciesId: other.speciesId, from: other.from, move: null } : null;
}

// ---------- a named tag partner (PA5, the Veteran) ----------

/** Remember the partner's own Pokémon for the owed tag battles (core/co/neRules owePartner counts them). */
export function setTagPartner(run: Pick<Run, 'story' | 'regionIndex'>, species: string, boost?: string, region?: boolean): void {
  run.story.flags[TAG_SPECIES] = species;
  if (boost) run.story.flags[TAG_BOOST] = boost;
  if (region) run.story.flags[TAG_REGION] = run.regionIndex + 1;
}
/** The named partner (species and stat boost), or null for the usual copy of your lead. */
export function tagPartnerOf(run: Pick<Run, 'story'>): { species: string; boost: string | null } | null {
  const species = run.story.flags[TAG_SPECIES];
  if (typeof species !== 'string' || !species) return null;
  const boost = run.story.flags[TAG_BOOST];
  return { species, boost: typeof boost === 'string' ? boost : null };
}
/** "For the rest of the region": the region the partner stays for (0: a set number of battles). */
export const tagPartnerRegion = (run: Pick<Run, 'story'>): number => Number(run.story.flags[TAG_REGION] ?? 0);
/** The partner went home: forget them (and any battles still owed to them; core/co/neRules counts those as `tag-partner`). */
export function clearTagPartner(run: Pick<Run, 'story' | 'itemCounters'>, owed = true): void {
  for (const k of [TAG_SPECIES, TAG_BOOST, TAG_REGION]) delete run.story.flags[k];
  if (owed && run.itemCounters?.['tag-partner']) run.itemCounters = { ...run.itemCounters, 'tag-partner': 0 };
}

// ---------- conditions and text ----------

export function pastAllyHas(content: Content, run: Run, has: PastHas, atLeast = 1): boolean {
  switch (has) {
    case 'echoes': return rivalEchoes(content, run).length >= atLeast;
    case 'lostItem': return lostItem(run) !== null;
    case 'left': return leftTeam(run).length >= atLeast;
    case 'pedestal': return pedestalItem(run) !== null;
    case 'ranchReleased': return ranchSource(run)?.from === 'released';
    default: return pastReplay(run, has) !== undefined && (has === 'second' ? frames(run).length >= Math.max(2, atLeast) : frames(run).length >= atLeast);
  }
}

export function pastAllyNeeds(has: PastHas): string {
  return {
    won: 'Needs a big battle won this run', fell: 'Needs a big battle lost this run', earliest: 'Needs a big battle this run', best: 'Needs a big battle won this run',
    rival: 'Needs a rival beaten this run', second: 'Needs two big battles this run', echoes: 'Needs a rival who has spoken to you this run',
    lostItem: 'Needs an item lost this run', left: 'Needs a Pokémon you left behind this run', pedestal: 'Needs an item on the pedestal', ranchReleased: 'Needs a Pokémon you let go this run',
  }[has];
}

const nameOf = (content: Content, id: string): string => content.species.get(id)?.name ?? id;
const list = (names: string[]): string => (names.length <= 1 ? names[0] ?? '' : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`);
const placeOf = (content: Content, run: Pick<Run, 'regionOrder'>, r: BattleReplay): string => `${content.regions.get(run.regionOrder[r.region] ?? '')?.name ?? 'the first region'}, stage ${r.stage + 1}`;

/**
 * Fills the Past Allies tokens: `{pa:<pick>}` (the battle's title), `{pa:<pick>-team}` (the species, in order), `{pa:<pick>-where}`,
 * `{pa:<pick>-foe}`, `{pa:frames}` (one caption a frame), `{pa:echo1}`..`{pa:echo3}` (rival lines said this run, newest last),
 * `{pa:lost}` (the lost item), `{pa:pedestal}`, `{pa:ranch}` (the Egg's Pokémon), `{pa:starter}`. Missing records read as plain words.
 */
export function fillPastAlliesText(content: Content, run: Run, text: string): string {
  if (!text.includes('{pa:')) return text;
  const item = (id: string | null, none: string): string => (id ? content.items.get(id)?.name ?? content.catalog.get(id)?.name ?? id : none);
  return text.replace(/\{pa:([a-z0-9-]+)\}/g, (_m, key: string) => {
    const [pick, part] = key.split('-') as [string, string | undefined];
    if (['won', 'fell', 'earliest', 'best', 'rival', 'second'].includes(pick)) {
      const r = pastReplay(run, pick as PastPick);
      if (!r) return part === 'team' ? 'a team you cannot quite place' : part === 'where' ? 'somewhere back down the road' : 'a battle you half remember';
      if (part === 'team') return list(pastTeam(run, pick as PastPick).map((id) => nameOf(content, id)));
      if (part === 'where') return placeOf(content, run, r);
      if (part === 'foe') return r.foe.name;
      return r.title;
    }
    if (key === 'frames') {
      const f = frames(run);
      return f.length === 0 ? 'Empty frames, waiting.' : f.map((r) => `${placeOf(content, run, r)}: ${r.title}. ${list(r.team.map((id) => nameOf(content, id)))}. ${r.outcome === 'win' ? 'Won.' : 'Lost, and kept going.'}`).join('\n');
    }
    const echo = /^echo([1-3])$/.exec(key);
    if (echo) {
      const all = rivalEchoes(content, run);
      const line = all[all.length - Number(echo[1])];
      return line ? line.text : '...';
    }
    if (key === 'lost') return item(lostItem(run), 'something of yours');
    if (key === 'pedestal') return item(pedestalItem(run), 'nothing yet');
    if (key === 'ranch') {
      const src = ranchSource(run);
      return src ? src.nick || nameOf(content, src.speciesId) : 'one of yours';
    }
    if (key === 'starter') {
      const s = run.party.find((m) => m.uid === run.log.starterUid) ?? run.box.find((m) => m.uid === run.log.starterUid);
      return s ? nameOf(content, s.speciesId) : 'a stubborn little thing';
    }
    return _m;
  });
}
