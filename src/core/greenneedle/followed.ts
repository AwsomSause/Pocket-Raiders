// Greenneedle gn.60, The Pokémon That Followed You Home (doc GREENNEEDLE_REWORKED_PLACED_13.md lines 109–195).
// A small common Pokémon follows the run through the scenery. It has no node and no prompt: the game never points at it.
// Region by region the player sees a shape, a tail, a Berry, footprints, a shadow, a sleeper. Then it walks into the firelight and joins.
// State is run flags (`ev:followed-*`) and the mark `followed-home` on the Pokémon: no save change. Nothing here rolls: what it is comes from
// a hash of the run seed, so previews, reloads and replays agree and no gameplay stream is touched.
import type { Content } from '../contentSchema';
import type { PokemonInstance, RunState } from '../state';
import { careOf, displayName } from '../care';
import { maxHp } from '../pokemon';
import { periodOf } from '../clock';
import { stageBiome } from '../biomes';

const f = (run: Pick<RunState, 'story'>, k: string): number => Number(run.story.flags[`ev:${k}`] ?? 0);
const set = (run: Pick<RunState, 'story'>, k: string, n: number): void => {
  run.story.flags[`ev:${k}`] = n;
};
const hash = (s: string): number => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
};
const STATS = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'] as const;

export const FOLLOWED_MARK = 'followed-home';
/** Small, common Pokémon of the run's first region (an Eevee's too grand). */
export const FOLLOW_POOL: Record<string, string[]> = {
  kanto: ['rattata', 'pidgey', 'meowth'],
  johto: ['sentret', 'hoothoot', 'marill'],
  hoenn: ['zigzagoon', 'skitty', 'wurmple'],
  sinnoh: ['pachirisu', 'bidoof', 'shinx'],
  unova: ['patrat', 'lillipup', 'minccino'],
  kalos: ['fletchling', 'bunnelby', 'pancham'],
  alola: ['rockruff', 'yungoos', 'pikipek'],
  galar: ['yamper', 'skwovet', 'wooloo'],
  paldea: ['fidough', 'lechonk', 'tarountula'],
};
const FALLBACK = ['sentret', 'skitty', 'pachirisu', 'yamper', 'fidough', 'rockruff'];
/** One signature move per region it followed through (checked against the move list; the first that exists is used). */
const REGION_MOVE: Record<string, string[]> = {
  kanto: ['quick-attack', 'tackle'], johto: ['helping-hand', 'sweet-scent'], hoenn: ['covet', 'charm'], sinnoh: ['shadow-sneak', 'endure'],
  unova: ['copycat', 'tail-whip'], kalos: ['baby-doll-eyes', 'play-rough'], alola: ['wish', 'fake-tears'], galar: ['follow-me', 'last-resort'], paldea: ['hold-hands', 'return'],
};
const ANY_MOVE = ['quick-attack', 'helping-hand', 'covet', 'shadow-sneak', 'copycat', 'baby-doll-eyes', 'wish', 'follow-me', 'return'];

/** What it is: from the run seed and the first region, kept in flag `followed-species` (1-based into the pool). Idempotent. */
export function followedSpecies(content: Content, run: RunState): string {
  const pool = (FOLLOW_POOL[run.regionOrder[0] ?? ''] ?? FALLBACK).filter((id) => content.species.has(id));
  const list = pool.length ? pool : FALLBACK.filter((id) => content.species.has(id));
  if (!list.length) return '';
  const known = f(run, 'followed-species');
  if (known > 0) return list[(known - 1) % list.length]!;
  const i = hash(`${run.seed}:followed`) % list.length;
  set(run, 'followed-species', i + 1);
  return list[i]!;
}
const done = (run: RunState): boolean => f(run, 'followed-revealed') >= 2;
const stageNo = (run: RunState): number => run.regionIndex * 100 + (run.stage?.index ?? 0) + 1;

/** `followed-cue` (what the scenery shows now): 1 a shape in a far layer, 2 a tail leaving, 4 a second line of footprints, 5 a shadow, 6 a sleeper. */
export const followedCue = (run: Pick<RunState, 'story'>): number => f(run, 'followed-cue');

/** A new stage starts: nothing carries over from the last one's scenery. */
export function followedStage(content: Content, run: RunState): void {
  if (!followedSpecies(content, run)) return;
  set(run, 'followed-cue', 0);
}

/** Entering a node: which cue the scenery shows (region 1 once per stage on a battle background; 2 a tail; 4 prints; 5 a shadow at dawn and dusk). */
export function followedStep(content: Content, run: RunState): void {
  if (!followedSpecies(content, run) || done(run) || !run.stage || run.stage.pseudo) return;
  const node = run.stage.map.nodes.find((n) => n.id === run.stage!.current);
  if (!node) return;
  const r = run.regionIndex;
  // The first stage's small kind act: it passed a wild Pokémon without battling (a wild node stood beside the way it took).
  if (r === 0 && run.stage.index === 0) {
    const sibling = run.stage.map.nodes.some((n) => n.column === node.column && n.id !== node.id && n.kind === 'wild');
    if (sibling && node.kind !== 'wild') set(run, 'followed-kind-act', 1);
  }
  let cue = 0;
  const n = stageNo(run);
  const rolled = hash(`${run.seed}:followed-cue:${n}:${node.id}`) % 100;
  if (r === 0) {
    if ((node.kind === 'wild' || node.kind === 'trainer') && f(run, 'followed-shape-stage') !== n && rolled < 60) {
      set(run, 'followed-shape-stage', n);
      cue = 1;
    }
  } else if (r === 1) cue = rolled < 45 ? 2 : 0;
  else if (r === 3) cue = ['desert', 'mountain', 'water'].includes(stageBiome(content, run)?.id ?? '') ? 4 : 0;
  else if (r === 4) cue = ['morning', 'evening'].includes(periodOf(run)) ? 5 : 0;
  set(run, 'followed-cue', cue);
  if (cue > 0) set(run, 'followed-regions', Math.max(f(run, 'followed-regions'), r + 1));
}

const NOTICE = [
  (name: string): string => `${name} looks at a bush for a long moment, then looks away, as if it had been told not to.`,
  (): string => 'One of your Pokémon leaves half its food at the edge of camp. In the morning, the bowl is clean.',
  (name: string): string => `For a second, one of your Pokémon is missing from camp. It comes back with a leaf on its head. ${name} pretends not to see.`,
];
const SHOPKEEPER = '**Shopkeeper:** "Yours wants to come in. No? Oh. I thought it was with you."';
const CHILD = '**A child:** "Your other one\'s shy."';
const RIVAL: Record<string, string> = {
  enthusiast: '**Rival:** "You know you\'ve got a— oh! Oh. Never mind. Never mind!"',
  strategist: '**Rival:** "You know you\'ve got a— no. Forget it. Not my business."',
  protector: '**Rival:** "You know you\'ve got a— it\'s fine. Keep it close, that\'s all."',
  idealist: '**Rival:** "You know you\'ve got a— ...never mind. It\'s nice. Never mind."',
  underdog: '**Rival:** "You know you\'ve got a— forget it. You wouldn\'t believe me anyway."',
  default: '**Rival:** "You know you\'ve got a— never mind."',
};
const said = (run: RunState, k: string): boolean => f(run, `followed-said-${k}`) > 0;
const say = (run: RunState, k: string): void => set(run, `followed-said-${k}`, 1);

/** A shop: the shopkeeper says it once (from the second region). */
export function followedShop(content: Content, run: RunState): string {
  if (!followedSpecies(content, run) || done(run) || run.regionIndex < 1 || said(run, 'shop')) return '';
  say(run, 'shop');
  return SHOPKEEPER;
}
/** A rival's battle begins: they almost say it, once (from the second region). */
export function followedRival(content: Content, run: RunState): string {
  const b = run.battle;
  if (!b?.rivalId || !followedSpecies(content, run) || done(run) || run.regionIndex < 1 || said(run, 'rival')) return '';
  say(run, 'rival');
  return RIVAL[b.rivalBrain?.personality ?? ''] ?? RIVAL.default!;
}

const berryOf = (run: RunState): { mon: PokemonInstance; id: string } | null => {
  for (const mon of run.party) {
    const id = Object.keys(mon.held ?? {}).sort().find((k) => k.endsWith('-berry') && (mon.held![k] ?? 0) > 0);
    if (id) return { mon, id };
  }
  return null;
};

/** The player is ready to meet it: four regions behind them (six if they never passed a wild Pokémon by), a bonded team, or a team on its last legs. */
export function followedReady(content: Content, run: RunState, before: number[]): boolean {
  if (done(run)) return false;
  const need = f(run, 'followed-kind-act') > 0 ? 4 : 5;
  if (run.regionIndex >= need) return true;
  if (run.party.length > 0 && run.party.every((m) => m.friendship >= content.balance.friendship.max * 0.75)) return true;
  return before.some((hp) => hp <= 0) && before.filter((hp) => hp > 0).length <= 1 && run.regionIndex >= 1;
}

/** At a rest (a Pokémon Center stop, after the party is healed): the small things, the Berry, the reveal scene. Returns what the camp notices. */
export function followedRest(content: Content, run: RunState, before: number[]): string {
  const species = followedSpecies(content, run);
  if (!species || done(run) || !run.stage) return '';
  const r = run.regionIndex;
  const lines: string[] = [];
  // From the third region: one more Berry than the player had, once a stage, with no message.
  if (r === 2 && f(run, 'followed-berry-stage') !== stageNo(run)) {
    set(run, 'followed-berry-stage', stageNo(run));
    const have = berryOf(run);
    const lead = run.party[0];
    if (have) have.mon.held![have.id]! += 1;
    else if (lead && content.catalog.has('oran-berry')) lead.held = { ...lead.held, 'oran-berry': (lead.held?.['oran-berry'] ?? 0) + 1 };
  }
  if (r >= 5) set(run, 'followed-cue', 6);
  if (r >= 1 && f(run, 'followed-notice-region') !== r + 1) {
    set(run, 'followed-notice-region', r + 1);
    const lead = run.party.find((m) => m.hp > 0) ?? run.party[0];
    if (lead) lines.push(NOTICE[(r - 1) % NOTICE.length]!(displayName(content, lead)));
  }
  if (r >= 2 && !said(run, 'child')) {
    say(run, 'child');
    lines.push(CHILD);
  }
  set(run, 'followed-regions', Math.max(f(run, 'followed-regions'), r + 1));
  // It walks out of the dark: the one and only prompt opens beside this rest.
  if (followedReady(content, run, before)) {
    const here = run.stage.map.nodes.find((n) => n.id === run.stage!.current);
    if (here && content.events.has('gn-60-reveal') && !here.sides.some((s) => s.kind === 'event' && !s.used && s.eventId === 'gn-60-reveal')) {
      here.sides.push({ id: `event-room-${here.sides.length + 1}-${here.id}`, kind: 'event', used: false, eventId: 'gn-60-reveal' });
      if (run.itemCounters) delete run.itemCounters['event-seen:gn-60-reveal'];
      set(run, 'followed-revealed', 1);
    }
  }
  return lines.join(' ');
}

const mine = (run: RunState): PokemonInstance[] => [...run.party, ...run.box];
/** Long Journey: every stat rises 3% for each region completed, to a cap of 12%. Idempotent (the part applied so far is kept in a mark). */
export function longJourney(run: Pick<RunState, 'regionIndex'>, mon: PokemonInstance): void {
  if (mon.fixedAbility !== 'long-journey') return;
  const want = Math.min(12, 3 * run.regionIndex);
  const have = Number(mon.gn?.find((t) => t.startsWith('lj:'))?.slice(3) ?? 0);
  if (want === have) return;
  const b = { ...mon.eventBoosts };
  for (const s of STATS) b[s] = (b[s] ?? 0) + (want - have);
  mon.eventBoosts = b;
  mon.gn = [...(mon.gn ?? []).filter((t) => !t.startsWith('lj:')), `lj:${want}`];
}

/** A one-syllable cry: the name the team's been calling it. */
export const cryOf = (name: string): string => {
  const m = /^[^aeiouy]*[aeiouy]+[^aeiouy]?/i.exec(name.replace(/[^a-z]/gi, ''));
  const s = (m?.[0] ?? name).slice(0, 4);
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
};

/** It joins: at the lead's level, Bond at its maximum, Long Journey, a move from each region it followed (the last four it can hold), named by its cry. */
export function followedJoin(content: Content, run: RunState, host: { apply: (e: unknown) => string }): string {
  if (done(run)) return '';
  const species = followedSpecies(content, run);
  if (!species) return '';
  set(run, 'followed-revealed', 2);
  const before = new Set(mine(run).map((m) => m.uid));
  const lead = run.party.find((m) => m.hp > 0) ?? run.party[0];
  const words = host.apply({ kind: 'join', recall: false, species: [species], types: [], levelBonus: 0, shinyMultiplier: 1, shadow: false, blissful: false, hiddenAbility: false, moves: [], direct: true, alpha: false, starterType: false, asIs: true, ability: 'long-journey', mark: FOLLOWED_MARK });
  const mon = mine(run).find((m) => !before.has(m.uid) && m.speciesId === species);
  if (!mon) return words;
  if (lead) mon.level = lead.level;
  mon.friendship = content.balance.friendship.max;
  const seen = Math.max(1, Math.min(f(run, 'followed-regions') || run.regionIndex + 1, run.regionOrder.length));
  const picks: string[] = [];
  for (let i = 0; i < seen; i++) {
    const id = (REGION_MOVE[run.regionOrder[i] ?? ''] ?? []).find((m) => content.moves.has(m)) ?? ANY_MOVE.find((m) => content.moves.has(m) && !picks.includes(m));
    if (id && !picks.includes(id)) picks.push(id);
  }
  const moves = picks.slice(-4);
  if (moves.length) mon.moves = moves.map((id) => ({ id, pp: content.moves.get(id)!.pp }));
  longJourney(run, mon);
  mon.hp = maxHp(content, mon);
  careOf(mon).nickname = cryOf(content.species.get(species)?.name ?? species);
  return words;
}

/** The run ended before it walked in: it's at the Road Home, on the step (NE100 reads `followed-at-road`). */
export function followedRoad(content: Content, run: RunState): void {
  if (followedSpecies(content, run) && !done(run)) set(run, 'followed-at-road', 1);
}

/**
 * Text tokens other events carry (each resolves to nothing unless it is following and has not walked in yet):
 * `{followed:seventh}`: the Storyteller's story has a seventh in the trainer's team (gn.new.35, in one telling);
 * `{followed:step}`: the run ended before the reveal, so it is at the Road Home, sitting on the step (NE100). It comes in.
 */
export function followedTokens(run: RunState, text: string): string {
  const near = f(run, 'followed-species') > 0 && !done(run);
  return text
    .replace(/\{followed:seventh\}/g, () => (near ? '\n\n*In her story, the trainer\'s team has a seventh. She doesn\'t explain.*' : ''))
    .replace(/\{followed:step\}/g, () => (near && run.phase === 'over' ? '\n\nOn the step, something small is sitting. It could be a rock. It has been on the same road as you the whole way. It gets up when it sees you, and it comes in.' : ''));
}
