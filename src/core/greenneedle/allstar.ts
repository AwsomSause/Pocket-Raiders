// Greenneedle gn.46, The All-Star Tournament (doc GREENNEEDLE_REWORKED_PLACED_10.md lines 194–270).
// A bracket of eight trainers the player has already met this run, with upgraded teams and a line about the last meeting.
// Every trainer fight this run is logged (finishBattle → allstarRecord); the bracket is drawn from that log. Pure rules: no RNG.
import type { Content } from '../contentSchema';
import type { BattleState, PokemonInstance, RunState } from '../state';
import { getSpecies } from '../pokemon';
import { fnv1a } from '../expansion/hash';
import { overhaulOf } from '../rivals/overhaul';
import { featuredRival } from '../rivals/living';
import { RIVAL_PROFILES } from '../rivals/schema';
import { RARITY, RARITY_TIERS, rarityOf } from '../rarity';

const set = (run: Pick<RunState, 'story'>, k: string, n: number): void => {
  run.story.flags[`ev:${k}`] = n;
};
const cast = (run: RunState, name: string, id: string): void => {
  for (const k of Object.keys(run.story.flags)) if (k.startsWith(`ev:cast-${name}:`)) delete run.story.flags[k];
  if (id) run.story.flags[`ev:cast-${name}:${id}`] = 1;
};

/** One trainer met this run, as last met. */
export interface Met {
  /** Name and trainer class (its sprite). */
  n: string;
  c: string;
  /** Their team then (species). */
  t: string[];
  /** The last result: `w` you won, `l` you lost, `d` you walked past the battle they offered. */
  r: 'w' | 'l' | 'd';
  /** Your Pokémon still standing at the end. */
  left: number;
  /** 1: they never got a move in. */
  sw: number;
  /** 1: they have beaten you at least once this run. */
  lost: number;
  /** Your Pokémon that finished it (species). */
  fin: string;
  /** Order met. */
  seq: number;
}
const LOG = 'allstar:log';
const MAX_LOG = 40;
export const logOf = (run: Pick<RunState, 'story'>): Met[] => {
  const raw = run.story.flags[LOG];
  if (typeof raw !== 'string') return [];
  try {
    const v = JSON.parse(raw) as unknown;
    return Array.isArray(v) ? (v as Met[]) : [];
  } catch {
    return [];
  }
};
const saveLog = (run: Pick<RunState, 'story'>, log: Met[]): void => {
  run.story.flags[LOG] = JSON.stringify(log.slice(-MAX_LOG));
};

const FOE_MOVED = 'allstar:foe-moved';
/** Each turn: did the foe get a move in? */
export function allstarTurn(battle: BattleState | null, events: readonly { type: string; side?: string }[]): void {
  if (!battle || battle.storyEffects.includes(FOE_MOVED)) return;
  if (events.some((e) => e.type === 'move' && e.side === 'enemy')) battle.storyEffects.push(FOE_MOVED);
}

const BOSS_CLASSES = new Set(['gym-leader', 'elite-four', 'champion']);
/** A trainer fight is over: remember who it was and how it went (bosses, rivals and the tournament itself are left out). */
export function allstarRecord(run: RunState): void {
  const b = run.battle;
  const tr = b?.trainer;
  if (!b || b.kind !== 'trainer' || !tr?.name || tr.leaderId || BOSS_CLASSES.has(tr.classId)) return;
  if (b.rival || b.rivalId || b.stepIn || b.eventRule?.gn?.startsWith('allstar')) return;
  if (b.outcome !== 'win' && b.outcome !== 'lose') return;
  const log = logOf(run);
  const was = log.find((m) => m.n === tr.name);
  const fin = run.party[b.activeIndex]?.speciesId ?? run.party.find((m) => m.hp > 0)?.speciesId ?? '';
  const met: Met = {
    n: tr.name, c: tr.classId, t: b.enemyTeam.map((m) => m.speciesId).slice(0, 6), r: b.outcome === 'win' ? 'w' : 'l',
    left: run.party.filter((m) => m.hp > 0).length, sw: b.outcome === 'win' && !b.storyEffects.includes(FOE_MOVED) ? 1 : 0,
    lost: b.outcome === 'lose' || was?.lost ? 1 : 0, fin, seq: (log.at(-1)?.seq ?? 0) + 1,
  };
  saveLog(run, [...log.filter((m) => m.n !== tr.name), met]);
}

/** A named trainer offered a battle in an event and the player chose something else that ended the scene: remembered, unless they have fought. */
export function allstarDeclined(run: RunState, choices: readonly { success: { battle?: unknown } }[], picked: { battle?: unknown; effects: readonly { kind: string }[] }): void {
  if (picked.battle || picked.effects.some((e) => e.kind === 'addEvent')) return;
  for (const c of choices) {
    const b = c.success.battle as { kind?: string; name?: string; classId?: string; rival?: boolean; bossId?: string; rule?: unknown; ghost?: boolean; friend?: boolean; pastAlly?: string; mirror?: boolean } | undefined;
    if (!b || b.kind !== 'trainer' || !b.name || b.rival || b.bossId || b.rule || b.ghost || b.friend || b.pastAlly || b.mirror || BOSS_CLASSES.has(b.classId ?? '')) continue;
    const log = logOf(run);
    if (log.some((m) => m.n === b.name)) continue;
    saveLog(run, [...log, { n: b.name, c: b.classId ?? '', t: [], r: 'd', left: 6, sw: 0, lost: 0, fin: '', seq: (log.at(-1)?.seq ?? 0) + 1 }]);
  }
}

/** Battled at least seven named trainers this run (ones only walked past don't count). */
export const allstarReady = (run: Pick<RunState, 'story'>): boolean => logOf(run).filter((m) => m.r !== 'd').length >= 7;
/** Nobody has beaten you this run. */
export const allstarUnbeaten = (run: Pick<RunState, 'story'>): boolean => logOf(run).every((m) => !m.lost);
/** The rival trusts you as far as it goes. */
export function rivalTrustMax(run: RunState): boolean {
  const r = featuredRival(run);
  return !!r && (overhaulOf(run, r.id)?.feelings.trust ?? 0) >= 10;
}

/** Trainers from finished events with an afterstory (doc order 3). */
const AFTERSTORY = ['Damian', 'Samurai', 'Dobbs-Leary', 'Tansy', 'Pax', 'Dace'];
const isAfterstory = (m: Met): boolean => AFTERSTORY.some((n) => m.n.includes(n));

/** Road Roster trainers by Trust: 2 when their arc ended (`roster-<key>-done`), 1 when met twice (`roster-<key>-m2`), else 0. */
export function rosterTrust(run: Pick<RunState, 'story'>, name: string): number {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const keys = Object.keys(run.story.flags).map((k) => /^ev:roster-([a-z0-9-]+)-m2$/.exec(k)?.[1]).filter((k): k is string => !!k && Number(run.story.flags[`ev:roster-${k}-m2`]) > 0);
  const key = keys.find((k) => slug === k || slug.endsWith(`-${k}`));
  return !key ? 0 : Number(run.story.flags[`ev:roster-${key}-done`] ?? 0) > 0 ? 2 : 1;
}

/** The seven, in seed order: lost to; won narrowly (one left); afterstory trainers; Road Roster trainers by Trust; then the rest, most recent first. */
export function allstarEntrants(run: Pick<RunState, 'story'>): Met[] {
  const log = logOf(run);
  const rank = (m: Met): number => (m.lost ? 0 : m.r === 'w' && m.left === 1 ? 1 : isAfterstory(m) ? 2 : rosterTrust(run, m.n) > 0 ? 4 - rosterTrust(run, m.n) : 4);
  return [...log].sort((a, b) => rank(a) - rank(b) || b.seq - a.seq).slice(0, 7);
}

/** One answer to each type (keyed by the type it answers): a species that hits it super-effectively. */
const COUNTER: Record<string, string> = {
  normal: 'machamp', fire: 'gyarados', water: 'jolteon', electric: 'rhydon', grass: 'arcanine', ice: 'magmar', fighting: 'alakazam', poison: 'hypno', ground: 'starmie',
  flying: 'electabuzz', psychic: 'houndoom', bug: 'charizard', rock: 'poliwrath', ghost: 'gengar', dragon: 'lapras', dark: 'heracross', steel: 'magcargo', fairy: 'muk',
};
/** The new Pokémon that answers how you beat them: one that hits your finisher's first type super-effectively. */
export function answerTo(content: Content, fin: string): string | null {
  if (!content.species.has(fin)) return null;
  const sp = COUNTER[getSpecies(content, fin).types[0] ?? ''];
  return sp && content.species.has(sp) ? sp : null;
}
const evolved = (content: Content, sp: string): string => {
  const to = content.species.get(sp)?.evolutions[0]?.to;
  return to && content.species.has(to) ? to : sp;
};

/** The line about the last meeting. */
export function lastLine(m: Met | undefined): string {
  if (!m) return '';
  if (m.r === 'd') return 'You walked past me. I thought about that. I think I\'d have walked past me, too.';
  if (m.r === 'l') return 'Oh, it\'s you. I was hoping. Don\'t take this wrong: you were my best day all year.';
  if (m.sw) return 'I didn\'t get a move in. I\'ve counted. I\'ve had a lot of time to count.';
  if (m.left === 1) return 'One Pokémon. You had *one* left. I\'ve been one better ever since.';
  return 'Last time, you won. I went home and changed everything. You\'ll see.';
}
const LINES = 'allstar:lines';
const ROBBED: Met = { n: 'The Trainer You Robbed', c: 'roughneck', t: [], r: 'w', left: 6, sw: 0, lost: 0, fin: '', seq: 0 };

/** Draws the bracket: the semi-final (lost to, else the closest win), the quarter-final (beaten easiest; the Trainer You Robbed if robbed), the rival in the final. */
export function allstarDraw(content: Content, run: RunState): string {
  const seven = allstarEntrants(run);
  const sf = seven.find((m) => m.lost) ?? [...seven].filter((m) => m.r === 'w').sort((a, b) => a.left - b.left || b.seq - a.seq)[0] ?? seven[0] ?? ROBBED;
  const rest = seven.filter((m) => m !== sf);
  const robbed = Number(run.story.flags['ev:robbed-trainer'] ?? 0) > 0;
  // Beaten easiest: a sweep first, then the most Pokémon left (one only walked past sits just under a clean win).
  const ease = (m: Met): number => (m.r === 'd' ? 5 : m.left);
  const qf = robbed ? ROBBED : [...rest].sort((a, b) => b.sw - a.sw || ease(b) - ease(a) || b.seq - a.seq)[0] ?? ROBBED;
  const lines = { qf: robbed ? 'You took what was mine. I haven\'t forgotten. I wrote it down, in case I did.' : lastLine(qf), sf: lastLine(sf) };
  run.story.flags[LINES] = JSON.stringify({ qf, sf, lines, names: [...seven.filter((m) => m !== qf && m !== sf).map((m) => m.n), qf.n, sf.n].slice(0, 7) });
  const answer = qf.fin ? answerTo(content, qf.fin) : null;
  cast(run, 'allstar-new-qf', answer ?? '');
  cast(run, 'allstar-new-sf', (sf.fin ? answerTo(content, sf.fin) : null) ?? '');
  set(run, 'allstar-round', 0);
  set(run, 'allstar-damian', [qf, sf].some((m) => m.n.includes('Damian')) ? 1 : 0);
  set(run, 'allstar-samurai', [qf, sf].some((m) => m.n.includes('Samurai')) ? 1 : 0);
  return '';
}
interface Drawn { qf: Met; sf: Met; lines: { qf: string; sf: string }; names: string[] }
export const drawnOf = (run: Pick<RunState, 'story'>): Drawn | null => {
  const raw = run.story.flags[LINES];
  try {
    return typeof raw === 'string' ? (JSON.parse(raw) as Drawn) : null;
  } catch {
    return null;
  }
};

/** How the rival talks, from their personality's traits: proud, warm, quiet, or plain. */
export type Voice = 'proud' | 'warm' | 'quiet' | 'plain';
export function rivalVoice(run: Pick<RunState, 'story'>): Voice {
  const r = featuredRival(run);
  const t = r ? RIVAL_PROFILES.personalities[r.archetype]?.traits : undefined;
  if (!t) return 'plain';
  return t.pride >= 70 ? 'proud' : t.empathy >= 70 ? 'warm' : t.empathy <= 30 ? 'quiet' : 'plain';
}
const FINAL_BASE = 'Everyone you\'ve ever fought is in those stands. And it\'s still us two at the end.';
/** The rival's line before the final, by personality. */
export const FINAL_OPEN: Record<Voice, string> = {
  plain: `"${FINAL_BASE} It's *always* us two."`,
  proud: `"${FINAL_BASE} It's *always* us two. Try to look surprised."`,
  warm: `"${FINAL_BASE} It's *always* us two. I'm glad it's you."`,
  quiet: `"${FINAL_BASE}" A breath. "It's *always* us two."`,
};

/** The rival's spoken line when the two of you swapped teams earlier this run (the Borrowed Team). */
export const SWAPPED_LINE = '"You\'ve fought with mine. I\'ve fought with yours. One of them still looks for you when it comes out. Don\'t you dare use that."';
const swapped = (run: Pick<RunState, 'story'>): boolean => Number(run.story.flags['ev:x-rival-swapped-teams'] ?? 0) > 0 || Number(run.story.flags['ev:rival-colours-kept'] ?? 0) > 0;

/** Tokens: {allstar:qf}, {allstar:sf} (names), {allstar-line:qf|sf}, {allstar-bracket}, {allstar-rival}, {allstar-open}. */
export function allstarTokens(run: RunState, text: string): string {
  const d = drawnOf(run);
  const rival = featuredRival(run)?.name ?? 'your rival';
  return text
    .replace(/\{allstar:(qf|sf)\}/g, (_, k: 'qf' | 'sf') => d?.[k].n ?? 'a trainer')
    .replace(/\{allstar-line:(qf|sf)\}/g, (_, k: 'qf' | 'sf') => d?.lines[k] ?? '')
    .replaceAll('{allstar-bracket}', d ? [...d.names, rival].join(', ') : '')
    .replaceAll('{allstar-open}', FINAL_OPEN[rivalVoice(run)] + (swapped(run) ? ` ${SWAPPED_LINE}` : ''))
    .replaceAll('{allstar-rival}', rival);
}

/** gn rules `allstar-qf` and `allstar-sf`: their team. Each has what they had before, evolved, with one new Pokémon that answers
 *  how you beat them (the semi-finalist says they haven't changed; their team has). All at the event's level (`A+1`). */
export function allstarStart(content: Content, run: RunState, battle: BattleState, round: 'qf' | 'sf', make: (speciesId: string, level: number, uid: string) => PokemonInstance): void {
  const d = drawnOf(run);
  const m = d?.[round];
  if (!m) return;
  if (battle.trainer) battle.trainer = { ...battle.trainer, name: m.n, classId: m.c || battle.trainer.classId };
  if (m.t.length === 0) return;
  const team = m.t.map((sp) => evolved(content, sp));
  const answer = m.fin ? answerTo(content, m.fin) : null;
  if (answer && !team.includes(answer)) team.push(answer);
  const level = battle.enemyTeam[0]?.level ?? 5;
  battle.enemyTeam = team.slice(0, 6).filter((sp) => content.species.has(sp)).map((sp, i) => make(sp, level, battle.enemyTeam[i]?.uid ?? `allstar-${round}-${i}`));
  battle.enemyIndex = 0;
}

/** The champion's rare visitor: from this region's rarest pool, chosen by the run (no roll). */
export const RARE: Record<string, string[]> = {
  kanto: ['dratini', 'lapras', 'chansey', 'snorlax'], johto: ['larvitar', 'dunsparce', 'skarmory', 'miltank'], hoenn: ['bagon', 'beldum', 'feebas', 'absol'],
  sinnoh: ['gible', 'riolu', 'spiritomb', 'munchlax'], unova: ['deino', 'larvesta', 'axew', 'emolga'], kalos: ['goomy', 'noibat', 'honedge', 'tyrunt'],
  alola: ['jangmo-o', 'mimikyu', 'comfey', 'dhelmise'], galar: ['dreepy', 'duraludon', 'toxel', 'falinks'], paldea: ['frigibax', 'tatsugiri', 'cyclizar', 'finizen'],
};
/** This region's rarest pool: its own generations' wild Pokémon (first stage, no forms, nothing Legendary) of the rarest tiers the wild allows. */
export function regionRarest(content: Content, region: string): string[] {
  const gens = content.regions.get(region)?.generations ?? [];
  if (gens.length === 0) return [];
  const blocked = new Set<string>(RARITY.wildBlocked);
  const wild = [...content.species.values()].filter((s) => gens.includes(s.generation) && s.evolutionStage === 1 && !s.form && s.tags.length === 0 && !blocked.has(rarityOf(content, s.id)));
  const tier = (id: string): number => RARITY_TIERS.indexOf(rarityOf(content, id));
  // Very Rare and above; a region with none of those gives its own rarest tier.
  const floor = Math.min(RARITY_TIERS.indexOf('veryRare'), Math.max(-1, ...wild.map((s) => tier(s.id))));
  return wild.filter((s) => tier(s.id) >= floor).map((s) => s.id).sort();
}
export function allstarChampion(content: Content, run: RunState, region: string): string {
  set(run, 'allstar-champion', 1);
  set(run, 'allstar-round', 3);
  const real = regionRarest(content, region);
  const pool = real.length ? real : (RARE[region] ?? RARE.kanto!).filter((s) => content.species.has(s));
  const sp = pool[fnv1a(`allstar-rare:${run.seed}`) % Math.max(1, pool.length)] ?? 'dratini';
  cast(run, 'allstar-rare', sp);
  return '';
}
