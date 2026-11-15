// Beta 0.7: Pidgey's Resolve, the Rivalry of the Sky. The rules of the story: when each scene may appear, what each choice does to the
// state in `run.expansion.sky`, how the foes are built, and how the finale is decided. Scenes are data (data/events/sky-rivalry.json);
// they reach this file through the `sky` condition and the `sky` effect of the event system.
//
// Determinism: every roll here comes from a stream of its own (`::sky::...`), keyed by the run seed and the stage, so no other roll moves.
// The CPU fights are a pure replay from the seed (see sim.ts). Nothing here depends on animation or UI.

import type { Content, EventEffect } from '../contentSchema';
import { evolvedFormAt } from '../encounters';
import { addItem, itemCount } from '../items';
import { maxHp } from '../pokemon';
import { Rng, hashSeed } from '../rng';
import { getCampaign, levelCap } from '../regions';
import { newMon } from '../run';
import { stageKey } from '../mapItems';
import { count, discover } from '../progress';
import type { PokemonInstance, RunState } from '../state';
import { cpuDuel, type DuelResult, type Duelist } from './sim';
import { shapeSpectateFoe } from './spectate';
import { SkyStateSchema, freshSky, type SkyEnding, type SkySide, type SkyState } from './state';
import {
  ALONE_LINES, ANSWERS, CHEER_PIDGEOT_LINE, DUEL_HEADER, FEAROW_TRACK, FINALE_ASK, FINALE_SETUP, GIFT_LINES, OVERHEAD,
  SPAR_LOST, SPAR_WON, answerLine, backedLine, duelResult, endingLine, fearowGrowthLine, finaleEnd,
} from './text';

export const SKY_FLY_ITEM = 'hm-fly';

export type SkyEffect = Extract<EventEffect, { kind: 'sky' }>;
export type SkyWhen = Extract<import('../contentSchema').EventCondition, { kind: 'sky' }>['when'];

/** Balance numbers of the story. */
export const SKY_BALANCE = {
  /** The opening duel: both birds' level. */
  duelLevel: 5,
  /** Finale: Pidgeot's level above the party's average, before training; each spar and each gift adds one (cap 3 each). */
  pidgeotAbove: 0,
  trainingCap: 3,
  /** Finale: Fearow's level above Pidgeot's. Training eases it: 2 spars and gifts together take one level off, 4 or more take two. */
  fearowAbove: 6,
  fearowRelief: 2,
  /** Pidgeot is asked to be cheered when it is first under this share of its HP. */
  cheerThreshold: 0.35,
  /** Rematch (gn.02: at A+1): Pidgeot's level above the party's average. */
  rematchAbove: 1,
  /** gn.02: each spar adds this much (percent) to Pidgeot's stats in the finale, to the cap. */
  sparStatPct: 2,
  sparStatCap: 12,
  /** At most this many answers are carried at once. */
  maxAnswers: 2,
} as const;

export const skyOf = (run: Pick<RunState, 'expansion'>): SkyState | undefined => run.expansion?.sky;

const stagesPer = (content: Content, run: RunState): number => getCampaign(content, run.campaignId).stagesPerRegion;
const avgLevel = (run: RunState): number => (run.party.length ? Math.round(run.party.reduce((n, m) => n + m.level, 0) / run.party.length) : 5);
const clampLevel = (content: Content, run: RunState, level: number): number => Math.max(2, Math.min(levelCap(content, run.regionIndex), level));

/** True on the last stage of the region the story began in (the one before the Elite Four). */
export function isFinaleStage(content: Content, run: RunState): boolean {
  const sky = skyOf(run);
  return !!sky && !!run.stage && run.stage.kind === 'stage' && run.regionIndex === sky.region && run.stage.index + 1 >= stagesPer(content, run);
}

/** Whether this stage's meeting is the "found training alone" kind: gn.02 says two of the six stages, S3 and S6 of its region. */
export function meetingIsAlone(run: RunState, _sky: SkyState): boolean {
  const s = (run.stage?.index ?? 0) + 1;
  return s === 3 || s === 6;
}

/** The cheapest held-type item of the Bag, berries first or everything else, by catalog rarity then id. */
export function giftCandidate(content: Content, run: RunState, kind: 'berry' | 'item'): string | null {
  const rank: Record<string, number> = { common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4 };
  const ids = Object.keys(run.inventory)
    .filter((id) => itemCount(run.inventory, id) > 0)
    .filter((id) => {
      const entry = content.catalog.get(id);
      return entry?.how === 'held' && entry.status === 'supported' && id.endsWith('-berry') === (kind === 'berry');
    })
    .sort((a, b) => (rank[content.catalog.get(a)?.rarity ?? 'common'] ?? 0) - (rank[content.catalog.get(b)?.rarity ?? 'common'] ?? 0) || a.localeCompare(b));
  return ids[0] ?? null;
}

/** The `sky` condition of the event system. */
export function skyCondition(content: Content, run: RunState, when: SkyWhen): boolean {
  const sky = skyOf(run);
  switch (when) {
    case 'opening':
      return !sky && run.stage?.kind === 'stage';
    case 'meet':
      return !!sky && sky.phase === 'rivalry' && run.regionIndex === sky.region && !isFinaleStage(content, run) && !sky.metStages.includes(stageKey(run) ?? '') && !meetingIsAlone(run, sky);
    case 'alone':
      return !!sky && sky.phase === 'rivalry' && run.regionIndex === sky.region && !isFinaleStage(content, run) && !sky.metStages.includes(stageKey(run) ?? '') && meetingIsAlone(run, sky);
    case 'finale':
      return !!sky && sky.phase === 'rivalry' && sky.meets >= 1 && isFinaleStage(content, run) && sky.finale.winner === undefined;
    case 'giftBerry':
      return !!sky && sky.phase === 'rivalry' && giftCandidate(content, run, 'berry') !== null;
    case 'giftItem':
      return !!sky && sky.phase === 'rivalry' && giftCandidate(content, run, 'item') !== null;
    case 'giftAny':
      return !!sky && sky.phase === 'rivalry' && (giftCandidate(content, run, 'berry') ?? giftCandidate(content, run, 'item')) !== null;
    case 'nest':
      return !!sky && sky.phase === 'rivalry' && (run.stage?.index ?? 0) + 1 === 7 && sky.gifts.length >= 4;
    case 'overhead':
      return !!sky && sky.phase === 'done' && !sky.afterDone && run.regionIndex > sky.region && (sky.ending === 'pidgeot-alone' || sky.ending === 'pidgeot-free' || sky.ending === 'fearow-free' || sky.ending === 'fearow-alone');
    case 'rematch':
      return !!sky && sky.phase === 'done' && !sky.afterDone && run.regionIndex > sky.region && sky.ending === 'pidgeot-left';
  }
}

export function skyConditionText(when: SkyWhen): string {
  switch (when) {
    case 'giftBerry': return 'Needs a berry to give';
    case 'giftItem': return 'Needs something it can hold';
    case 'giftAny': return 'Needs a Berry or something it can hold';
    default: return 'Not now';
  }
}

// ---- building the birds ----

/** Moves Pidgey carries: its own, with the answers it learned put over the last slots. */
function pidgeyMoves(content: Content, run: RunState, sky: SkyState, species: string): string[] {
  const own = ['gust', 'quick-attack', 'wing-attack', 'sand-attack'];
  const base = species === 'pidgey' ? own : ['wing-attack', 'quick-attack', 'air-slash', 'agility'];
  const out = [...base];
  sky.answers.slice(0, SKY_BALANCE.maxAnswers).forEach((id, i) => {
    if (content.moves.has(id)) out[out.length - 1 - i] = id;
  });
  return out;
}

const heldOf = (gifts: readonly string[]): Record<string, number> => {
  const held: Record<string, number> = {};
  for (const id of gifts) held[id] = (held[id] ?? 0) + 1;
  return held;
};

/** Pidgeot's strength at the finale: the party's level, plus a level for each spar and each gift (cap 3 each). */
export function pidgeotLevel(content: Content, run: RunState, sky: SkyState): number {
  const trained = Math.min(SKY_BALANCE.trainingCap, sky.spars) + Math.min(SKY_BALANCE.trainingCap, sky.gifts.length);
  return clampLevel(content, run, avgLevel(run) + SKY_BALANCE.pidgeotAbove + trained + sky.wiser);
}

export function fearowLevel(content: Content, run: RunState, sky: SkyState): number {
  const trained = Math.min(SKY_BALANCE.trainingCap, sky.spars) + Math.min(SKY_BALANCE.trainingCap, sky.gifts.length);
  const relief = Math.min(SKY_BALANCE.fearowRelief, Math.floor(trained / 2));
  return clampLevel(content, run, pidgeotLevel(content, run, sky) + SKY_BALANCE.fearowAbove - relief);
}

/** The moves Fearow has learned by this stage of its region (gn.02: one per stage from S2), its four newest. */
export function fearowMoves(stageInRegion: number): string[] {
  const known = [...FEAROW_START, ...FEAROW_BY_STAGE.slice(0, Math.max(0, Math.min(FEAROW_BY_STAGE.length, stageInRegion - 1)))];
  return known.slice(-4);
}

/** Pidgeot's finale stats: +2% per spar, to a cap of 12%. */
export const sparBoost = (sky: SkyState): number => Math.min(SKY_BALANCE.sparStatCap, SKY_BALANCE.sparStatPct * sky.spars);

const pidgeotDuelist = (content: Content, run: RunState, sky: SkyState): Duelist => ({
  speciesId: 'pidgeot', level: pidgeotLevel(content, run, sky), moves: ['wing-attack', 'quick-attack', 'air-slash', 'agility'], ability: 'scrappy', held: heldOf(sky.gifts),
});
const fearowDuelist = (content: Content, run: RunState, sky: SkyState): Duelist => ({ speciesId: 'fearow', level: fearowLevel(content, run, sky), moves: fearowMoves((run.stage?.index ?? 0) + 1) });

/** The finale as the engine plays it, with the player's cheer (or none yet). Replayable: the same inputs are always the same fight. */
export function playFinale(content: Content, run: RunState, sky: SkyState, cheer: 'pidgeot' | 'fearow' | 'ask' | 'none'): DuelResult {
  return cpuDuel(content, run.seed, 'finale', pidgeotDuelist(content, run, sky), fearowDuelist(content, run, sky), {
    names: ['Pidgeot', 'Fearow'],
    threshold: SKY_BALANCE.cheerThreshold,
    atThreshold: cheer === 'ask' ? undefined : cheer === 'pidgeot' ? 'cheerA' : cheer === 'fearow' ? 'cheerB' : 'none',
  });
}

/** Rebuilds the sparring foe (and the rematch Pidgeot) when an event battle starts. */
export function shapeSkyFoe(content: Content, run: RunState, eventId: string): void {
  const sky = skyOf(run);
  const battle = run.battle;
  if (!sky || !battle || battle.enemyTeam.length === 0) return;
  if (eventId === 'sky.opening' || eventId === 'sky.finale') return shapeSpectateFoe(content, run, sky, eventId);
  const rematch = eventId === 'sky.rematch';
  const level = rematch
    ? clampLevel(content, run, avgLevel(run) + SKY_BALANCE.rematchAbove)
    : clampLevel(content, run, Math.max(battle.enemyTeam[0]!.level, avgLevel(run) + Math.min(SKY_BALANCE.trainingCap, sky.spars)));
  const speciesId = rematch ? 'pidgeot' : evolvedFormAt(content, 'pidgey', level);
  const mon = newMon(content, run, speciesId, level, 'e');
  mon.moves = pidgeyMoves(content, run, sky, speciesId).filter((id) => content.moves.has(id)).map((id) => ({ id, pp: content.moves.get(id)!.pp }));
  if (rematch) mon.fixedAbility = 'scrappy';
  mon.held = heldOf(sky.gifts);
  mon.hp = maxHp(content, mon);
  battle.enemyTeam[0] = mon;
}

// ---- effects ----

function setEnding(sky: SkyState, ending: SkyEnding): void {
  sky.ending = ending;
  sky.phase = 'done';
}

export function pushRoom(run: RunState, eventId: string): void {
  const here = run.stage!.map.nodes.find((n) => n.id === run.stage!.current)!;
  here.sides.push({ id: `event-room-${here.sides.length + 1}-${here.id}`, kind: 'event', used: false, eventId });
  if (run.itemCounters) delete run.itemCounters[`event-seen:${eventId}`];
}

/** A meeting comes back on the next stage: events are once per run, so the "seen" mark of the per-stage scenes is cleared. */
function reopen(run: RunState): void {
  if (!run.itemCounters) return;
  delete run.itemCounters['event-seen:sky.meet'];
  delete run.itemCounters['event-seen:sky.alone'];
}

function markMeet(run: RunState, sky: SkyState): void {
  reopen(run);
  const key = stageKey(run) ?? '';
  if (!sky.metStages.includes(key)) {
    sky.metStages.push(key);
    sky.meets += 1;
  }
}

/** The mon a recruited bird becomes. Pidgeot is stoneless-Mega capable with Scrappy and holds what it was given; Fearow has Sniper and Drill Run. */
export function recruitMon(content: Content, run: RunState, sky: SkyState, bird: 'pidgeot' | 'fearow'): PokemonInstance {
  const level = bird === 'pidgeot' ? pidgeotLevel(content, run, sky) : fearowLevel(content, run, sky);
  const mon = newMon(content, run, bird, clampLevel(content, run, level), 'p');
  if (bird === 'pidgeot') {
    mon.fixedAbility = 'scrappy';
    mon.skyMega = true;
    mon.moves = ['wing-attack', 'quick-attack', 'air-slash', 'agility'].filter((id) => content.moves.has(id)).map((id) => ({ id, pp: content.moves.get(id)!.pp }));
    // "It holds a normal item": the first thing it was given, as it was given (the rest are kept in its feathers).
    const first = sky.gifts[0];
    if (first) mon.held = { [first]: 1 };
  } else {
    mon.fixedAbility = 'sniper';
    const drill = content.moves.get('drill-run');
    if (drill && !mon.moves.some((m) => m.id === 'drill-run')) {
      if (mon.moves.length < 4) mon.moves.push({ id: 'drill-run', pp: drill.pp });
      else mon.moves[3] = { id: 'drill-run', pp: drill.pp };
    }
  }
  // "Leave quietly": the Bond it never knew about (+5 friendship each), and only Pidgey has it.
  mon.friendship = Math.min(255, mon.friendship + 40 + (bird === 'pidgeot' ? 5 * sky.bond : 0));
  mon.hp = maxHp(content, mon);
  return mon;
}

function giveGift(content: Content, run: RunState, sky: SkyState, kind: 'berry' | 'item'): string {
  const id = giftCandidate(content, run, kind);
  if (!id) return '';
  addItem(run.inventory, id, -1);
  if (run.inventory[id] !== undefined && run.inventory[id]! <= 0) delete run.inventory[id];
  sky.gifts.push(id);
  sky.boosts += 1;
  run.story.flags['ev:pidgey-gifts'] = sky.gifts.length;
  const lines = GIFT_LINES[kind];
  const rng = new Rng(hashSeed(`${run.seed}::sky::gift-line::${sky.gifts.length}`));
  return `${rng.pick([...lines])} (${content.catalog.get(id)?.name ?? id} given: ${sky.gifts.length} so far.)`;
}

function leadTypes(content: Content, run: RunState): string[] {
  const lead = run.party[run.battle?.activeIndex ?? 0] ?? run.party[0];
  return lead ? [...(content.species.get(lead.speciesId)?.types ?? [])] : [];
}

/** Applies one `sky` effect and says what happened (it may be several lines). */
export function applySky(content: Content, run: RunState, e: SkyEffect): string {
  let sky = skyOf(run);
  const say = (...lines: string[]): string => lines.filter(Boolean).join('\n');
  switch (e.act) {
    case 'duel': {
      // The fight itself is watched on the battle scene (spectate.ts); this only records which bird was backed.
      if (sky) return '';
      const side = e.side ?? 'pidgey';
      sky = freshSky(run.regionIndex, side);
      run.expansion = { ...run.expansion, sky };
      discover(run, 'pidgey', false);
      discover(run, 'spearow', false);
      return say(...DUEL_HEADER);
    }
    case 'watch': {
      if (!sky) return '';
      markMeet(run, sky);
      sky.watched += 1;
      return say('It preens, taking its time, as if you were not there. Then it flies a loop it could not fly last stage, tight and clean, and lands, and pretends that was nothing.', fearowGrowthLine(2 + sky.meets), backedLine(sky.backed));
    }
    case 'giftAny': {
      if (!sky) return '';
      markMeet(run, sky);
      const kind = giftCandidate(content, run, 'berry') ? 'berry' : 'item';
      const gift = giveGift(content, run, sky, kind);
      return say(gift, 'It will keep it to the end, tied to its leg or tucked in its nest.', fearowGrowthLine(2 + sky.meets), backedLine(sky.backed));
    }
    case 'aloneLeave': {
      if (!sky) return '';
      markMeet(run, sky);
      sky.alone += 1;
      sky.bond += 1;
      return say('You leave as quietly as you came. It never knows you were there. But the next time it sees you, it lands a little closer than it has to, and it does not know why.');
    }
    case 'aloneCall': {
      if (!sky) return '';
      markMeet(run, sky);
      sky.alone += 1;
      return say('You call out. It pulls up out of the dive so hard it nearly hits the rock, and lands, and glares at you, and puffs up every feather it has. It was not doing anything. It was definitely not aiming at that feather.');
    }
    case 'passBy': {
      reopen(run);
      return say('You tip two fingers to it and keep walking. It watches you go with its head on one side, and the wind picks up behind you, as if it were saying something. You will meet it again.');
    }
    case 'meetSpar': {
      if (!sky) return '';
      markMeet(run, sky);
      sky.spars += 1;
      return say(fearowGrowthLine(2 + sky.meets), backedLine(sky.backed));
    }
    case 'sparWon': {
      if (!sky) return '';
      const rng = new Rng(hashSeed(`${run.seed}::sky::spar-line::${sky.spars}`));
      const types = leadTypes(content, run);
      const learned = types.map((t) => ANSWERS[t]).find((m) => m && content.moves.has(m) && !sky!.answers.includes(m));
      let extra = '';
      if (learned) {
        sky.answers = [learned, ...sky.answers].slice(0, SKY_BALANCE.maxAnswers);
        extra = answerLine(types[0] ?? 'normal', learned);
      }
      return say(rng.pick([...SPAR_WON]), extra);
    }
    case 'sparLost': {
      if (!sky) return '';
      return say(new Rng(hashSeed(`${run.seed}::sky::spar-line::${sky.spars}`)).pick([...SPAR_LOST]));
    }
    case 'giftBerry':
    case 'giftItem': {
      if (!sky) return '';
      markMeet(run, sky);
      const gift = giveGift(content, run, sky, e.act === 'giftBerry' ? 'berry' : 'item');
      return say(gift, fearowGrowthLine(2 + sky.meets), backedLine(sky.backed));
    }
    case 'finaleGiftBerry':
    case 'finaleGiftItem': {
      if (!sky) return '';
      return giveGift(content, run, sky, e.act === 'finaleGiftBerry' ? 'berry' : 'item');
    }
    case 'meetAlone': {
      if (!sky) return '';
      markMeet(run, sky);
      sky.alone += 1;
      return say(ALONE_LINES[(sky.alone - 1) % ALONE_LINES.length]!, fearowGrowthLine(2 + sky.meets));
    }
    case 'aloneGift': {
      if (!sky) return '';
      markMeet(run, sky);
      sky.alone += 1;
      const gift = giveGift(content, run, sky, 'berry');
      return say('You set it down where the grass is flat and walk away without a word. Later you see the Pidgey find it, and look around for who left it, and not find you. It does not eat it. It tucks it into its feathers.', gift && `(The berry is given: ${sky.gifts.length} so far.)`);
    }
    case 'joinBird': {
      if (!sky || sky.joinedUid) return '';
      const bird = e.bird ?? 'pidgeot';
      const mon = recruitMon(content, run, sky, bird);
      sky.joinedUid = mon.uid;
      setEnding(sky, bird === 'pidgeot' ? 'pidgeot-joined' : 'fearow-joined');
      sky.afterDone = true;
      discover(run, mon.speciesId, true);
      count(run, 'pokemonCaught');
      run.pending.push({ kind: 'caught', mon });
      return say(bird === 'pidgeot' ? 'Pidgeot may Mega Evolve from resolve alone. It holds a normal item. Its Mega ability is Sky\'s Resolve: its Normal-type moves become Flying and gain 20%, and its moves cannot miss. Moves used against it cannot miss either.' : 'Fearow comes with Sniper and Drill Run.', `${bird === 'pidgeot' ? 'Pidgeot' : 'Fearow'} wants to join you!`);
    }
    case 'freeBird': {
      if (!sky) return '';
      const bird = e.bird ?? 'pidgeot';
      setEnding(sky, bird === 'pidgeot' ? 'pidgeot-free' : 'fearow-free');
      return say(bird === 'pidgeot' ? 'You tell it to go where the wind is. It does, and does not look back, and you know it is only because it cannot bear to.' : 'You tell it to go. It looks at you for the length of a breath. Then it is only a shape.', endingLine(sky.ending!));
    }
    case 'overhead': {
      if (!sky) return '';
      sky.afterDone = true;
      // The bird that did not join: Fearow only when it was freed; otherwise it is Pidgeot who is still training.
      const bird = sky.ending === 'fearow-free' ? 'fearow' : 'pidgeot';
      return say(new Rng(hashSeed(`${run.seed}::sky::overhead`)).pick([...OVERHEAD[bird]]));
    }
    case 'rematchWon': {
      // gn.02: "Win that, and it'll listen": Pidgeot lands, and asks to come.
      if (!sky) return '';
      sky.afterDone = true;
      pushRoom(run, 'sky.join.pidgeot');
      return say('You beat it, and it does not fly off. It lands on the road in front of you, and lowers its head, and listens.');
    }
    case 'rematchLost': {
      if (!sky) return '';
      sky.afterDone = true;
      setEnding(sky, 'rematch-done');
      return say(e.act === 'rematchWon' ? 'You beat it, and it does not run. It stays on the road. It looks at you for a long time, and it nods once: the nod you give to someone you had a quarrel with and have decided is over.' : 'It beats you, and it does not gloat. It lands beside you on the road and just stands there, the way you stand next to someone after a fight you both wish had gone differently.', endingLine('rematch-done'));
    }
  }
}

/** Closes a story that was left hanging: the cheer was never answered, or the finale stage passed without the scene. Called when the Elite Four or the next region begins. */
export function settleSky(content: Content, run: RunState): void {
  const sky = skyOf(run);
  if (!sky || sky.phase !== 'rivalry') return;
  if (run.regionIndex === sky.region && run.stage?.kind === 'stage') return;
  // The fight is decided but the join was never answered: the bird goes its own way.
  if (sky.finale.winner !== undefined) {
    setEnding(sky, sky.finale.winner === 'pidgeot' ? 'pidgeot-free' : 'fearow-free');
    return;
  }
  const result = playFinale(content, run, sky, 'none');
  const winner = result.winner === 0 ? 'pidgeot' : 'fearow';
  sky.finale.winner = winner;
  setEnding(sky, winner === 'pidgeot' ? 'pidgeot-alone' : 'fearow-alone');
  run.journal.push(`Somewhere past the cliffs a Pidgeot and a Fearow settled their rivalry without you. ${winner === 'pidgeot' ? 'Pidgeot' : 'Fearow'} won.`);
}

export const parseSky = (raw: unknown): SkyState => SkyStateSchema.parse(raw);
