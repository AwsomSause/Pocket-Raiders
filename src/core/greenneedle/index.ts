// Greenneedle events (Catalog Overhaul Pack): the rules that only these events use. Pure functions; events.ts and run.ts call
// them at their hook points, the battle engine reads two tokens from `battle.storyEffects`. No random numbers anywhere, so
// previews, saves and replays agree. State is run flags (`ev:gn-*`) plus the optional `gn` marks on a Pokémon: no save change.

import type { Content } from '../contentSchema';
import type { PlayerAction } from '../battle/engine';
import type { BattleState, PokemonInstance, RunState } from '../state';
import type { GnCond, GnEffect } from './schema';
import { abilityOf, addLevels, calcStats, createPokemon, getSpecies, isUsableMove, maxHp } from '../pokemon';
import { levelScale } from '../encounters';
import { getCampaign } from '../regions';
import { addItem } from '../items';
import { typeEffectiveness } from '../battle/damage';
import type { TypeName } from '../contentSchema';
import { SLUDGE_TURNS } from './factory';
import { bondLevel, firstCatch } from '../co/who';
import { NATURE_IDS } from '../natures';
import { fnv1a } from '../expansion/hash';
import { crystalOp, golemStart } from './crystals';
import { tideOf } from '../clock';
import { lightning } from './ridge';
import { labCast, labForm } from './lab';
import { marketArrive, marketBuy, marketOffer, marketUndercut } from './market';
import { museumArrive } from './museum';
import { daycareLeave, daycareReturn, eggShape, parentAndChild } from './daycare';
import { eggMoveOptions, familyId } from '../mastery';
import { pairBondLevel } from '../bond';
import { borrowBattleStart, borrowEnd, borrowMeet, borrowStart, borrowTokens, rivalTrustAtLeast } from './borrowed';
import { draftAldhelm, draftBattleStart, draftEnd, draftFriend, draftLetter, draftPick, draftRecruit, draftStart, draftTokens, draftWon } from './draft';
import { exBack, exDraw, exKnown, nextMatchup, exResult, exStart, exTokens, exWatch } from './exhibition';
import { defectorBossStart, defectorClimax, defectorEnd, defectorMeet, defectorReturn, defectorStart, defectorTokens, defectorTrust, guestOf } from './defector';
import { taEnd, taLot, taRare, taStart } from './teamauction';
import { type DistrictId, sgAct, sgAssign, sgCommanderStart, sgEnd, sgHalf, sgHomes, sgJoin, sgRescue, sgStart, sgWhole, siegeTokens, waiting } from './citysiege';
import { karpTokens, kcArrive, kcEvolve, kcJump, mineRises, notchRises, quillfeatherStart, regularRises } from './karpcon';
import { bidoofJoin, bidoofStart } from './bidoof';
import { restsNeeded, smuggleCages, smuggleJoin, smugglePostcard, smuggleRehab, smuggleTokens } from './smuggling';
import { fluteReady, foodReady, snorlaxCaught, snorlaxFeed, snorlaxFollow, snorlaxFond, snorlaxStart } from './snorlax';
import { allstarChampion, allstarDraw, allstarReady, allstarStart, allstarTokens, allstarUnbeaten, rivalTrustMax } from './allstar';
import { lessonArrive, lessonBonus, lessonChampion, lessonEnd, lessonStart, lessonTeach } from './champion';
import { CHAMPION_NAME, onevoneChampion, onevoneEnd, onevoneEnter, onevoneStart, entrantOf } from './onevone';
import { GAVEL, auctionArrive, auctionOpen, auctionReturn, auctionRound, lotToken } from './auction';
import { aceHere, bagBack, bagLeave, bench, brainRecord, brainStart, bring, frontierClear, leadInitiative, palaceShape, rent, swapIn, unbench } from './frontier';

type Cue = { type: 'spectacle'; kind: 'arena'; side: 'player' | 'enemy'; text: string; uid?: string };
const cue = (side: 'player' | 'enemy', text: string, uid?: string): Cue => ({ type: 'spectacle', kind: 'arena', side, text, ...(uid ? { uid } : {}) });

const key = (k: string): string => `ev:${k}`;
export const gnFlag = (run: Pick<RunState, 'story'>, k: string): number => Number(run.story.flags[key(k)] ?? 0);
export const setGnFlag = (run: Pick<RunState, 'story'>, k: string, v: number): void => {
  run.story.flags[key(k)] = Math.max(0, v);
};

/** The main-series regions' generations (the region pool of a `cast`). */
const REGION_GENERATION: Record<string, number> = { kanto: 1, johto: 2, hoenn: 3, sinnoh: 4, unova: 5, kalos: 6, alola: 7, galar: 8, paldea: 9 };

const PET_NAMES = ['Dumpling', 'Biscuit', 'Pickle', 'Button', 'Pebble', 'Sprout', 'Mochi', 'Waffles', 'Bramble', 'Nugget', 'Toffee', 'Puddle', 'Crumpet', 'Bean', 'Muffin', 'Pip'];
/** gn.24: `{petname}` (the old name a past trainer gave it) and `{partner}` (its species) in event text, for the partner Pokémon. */
export function gnTokens(content: Content, run: RunState, text: string): string {
  if (!text.includes('{')) return text;
  // {cast:<name>}: the species a story Pokémon was cast as (gn.42: the ace a Brain remembers).
  text = text.replace(/\{cast:([a-z0-9-]+)\}/g, (_, name: string) => {
    const id = castOf(run, name) ?? '';
    return content.species.get(id)?.name ?? content.items.get(id)?.name ?? content.catalog.get(id)?.name ?? content.bosses.get(id)?.name ?? content.moves.get(id)?.name ?? 'that one';
  });
  // gn.43: the auction catalogue ({lot:<n>:prov}, {lot:<n>:photo}) and a sum of money ({money:<key>}).
  text = text.replace(/\{lot:([1-6]):([a-z]+)\}/g, (_, n: string, part: string) => lotToken(run, Number(n), part));
  text = text.replace(/\{money:([a-z0-9-]+)\}/g, (_, k: string) => `₽${gnFlag(run, k).toLocaleString('en-GB')}`);
  // gn.44: the reigning 1v1 champion, a different trainer each region.
  // gn.48: the Draft's table.
  if (text.includes('{draft:')) text = draftTokens(content, run, text);
  if (text.includes('{borrow:')) text = borrowTokens(content, run, text);
  // gn.50: the defector.
  if (text.includes('{defector:')) text = defectorTokens(content, run, text);
  // gn.51: the Smuggling Ring.
  if (text.includes('{smuggle:')) text = smuggleTokens(content, run, text);
  if (text.includes('{siege:')) text = siegeTokens(content, run, text);
  if (text.includes('{karp:')) text = karpTokens(run, text);
  // gn.47: the Exhibition.
  if (text.includes('{ex:')) text = exTokens(content, run, text);
  // gn.46: the All-Star bracket.
  if (text.includes('{allstar')) text = allstarTokens(run, text);
  // gn.45: the region's Champion, off duty (cast when the lesson starts).
  if (text.includes('{lesson-champion}')) text = text.replaceAll('{lesson-champion}', content.bosses.get(castOf(run, 'lesson-champion') ?? lessonChampion(content, run, run.regionOrder[run.regionIndex] ?? 'kanto'))?.name ?? 'The Champion');
  text = text.replaceAll('{onevone-champion}', CHAMPION_NAME[run.regionOrder[run.regionIndex] ?? 'kanto'] ?? CHAMPION_NAME.kanto!);
  // gn.44: what the next 1v1 opponent holds ({held:<n>}).
  text = text.replace(/\{held:([1-8])\}/g, (_, n: string) => {
    const id = castOf(run, `onevone-held-${n}`);
    const name = id ? (content.catalog.get(id)?.name ?? content.items.get(id)?.name) : undefined;
    return name ? `holding ${/^[AEIOU]/.test(name) ? 'an' : 'a'} ${name}` : 'holding nothing';
  });
  // {flag:<key>}: a run flag's number (gn.42: the marks the Arena's judge gave you).
  text = text.replace(/\{flag:([a-z0-9-]+)\}/g, (_, k: string) => String(gnFlag(run, k)));
  if (!text.includes('{')) return text;
  const mon = [...run.party, ...run.box].find((m) => m.gn?.includes('old-partner')) ?? firstCatch(run);
  if (!mon) return text.replaceAll('{petname}', 'Dumpling').replaceAll('{partner}', 'Pokémon');
  return text.replaceAll('{petname}', PET_NAMES[fnv1a(`petname:${mon.uid}`) % PET_NAMES.length]!).replaceAll('{partner}', content.species.get(mon.speciesId)?.name ?? 'Pokémon');
}

/** The species a story Pokémon was cast as (gn op `cast`), or null before it is cast. */
export function castOf(run: Pick<RunState, 'story'>, name: string): string | null {
  const prefix = `${key(`cast-${name}`)}:`;
  const hit = Object.keys(run.story.flags).find((k) => k.startsWith(prefix) && Number(run.story.flags[k]) > 0);
  return hit ? hit.slice(prefix.length) : null;
}

/** An event's species list with each `@name` turned into the story Pokémon it was cast as (dropped while it is not cast yet). */
export function resolveCast(run: Pick<RunState, 'story'>, species: readonly string[]): string[] {
  if (!species.some((s) => s.startsWith('@'))) return [...species];
  return species.flatMap((s) => (s.startsWith('@') ? (castOf(run, s.slice(1)) ? [castOf(run, s.slice(1))!] : []) : [s]));
}

const nameOf = (content: Content, mon: PokemonInstance): string => content.species.get(mon.speciesId)?.name ?? mon.speciesId;

/** The party Pokémon carrying a mark (`duelist`), and the species it had when it was marked. */
export function markedMon(run: Pick<RunState, 'party'>, mark: string): { mon: PokemonInstance; was: string } | undefined {
  for (const mon of run.party) {
    const tag = mon.gn?.find((t) => t === mark || t.startsWith(`${mark}:`));
    if (tag) return { mon, was: tag.split(':')[1] ?? mon.speciesId };
  }
  return undefined;
}

/** Friendship at which a Pokémon counts as "Bond 3 or more" in the pack's words (STANDARDS.md: Bond +1 is friendship +5; the base is 70). */
export const BOND_THREE = 85;

/** Token on `battle.storyEffects`: the foe gives up its next attack, with this line (the battle engine reads and removes it). */
export const FOE_WAITS = 'gn-foe-waits:';
/** A `gn-you-wait:<line>` token costs your Pokémon its next move and shows the line (the jungle's vines). */
export const YOU_WAIT = 'gn-you-wait:';
/** The Lush Jungle: the uids already fainted when a fight began. */
export const JUNGLE_DOWN = 'gn-jungle-down:';

export const FOREST = { inside: 'gn-forest-in', battles: 'gn-forest-battles', fought: 'gn-forest-fought', rank: 'gn-forest-rank', evolved: 'gn-forest-evolved', fog: 'gn-forest-fog', duelist: 'gn-forest-duelist', big: 'gn-forest-big' } as const;

/** The newest conscious party Pokémon of the type becomes the forest's duelist (once; later calls do nothing). */
export function markDuelist(content: Content, run: RunState, type: string): string {
  if (markedMon(run, 'duelist')) return '';
  const fits = run.party.filter((m) => m.hp > 0 && (content.species.get(m.speciesId)?.types as string[] | undefined)?.includes(type));
  const mon = fits[fits.length - 1];
  if (!mon) return '';
  mon.gn = [...(mon.gn ?? []), `duelist:${mon.speciesId}`];
  for (const k of [FOREST.battles, FOREST.fought, FOREST.rank, FOREST.evolved]) setGnFlag(run, k, 0);
  setGnFlag(run, FOREST.duelist, 1);
  setGnFlag(run, FOREST.big, ['pinsir', 'scyther', 'heracross'].includes(mon.speciesId) ? 1 : 0);
  // The pack's own flag name for "a Bug-type walks with the player" (kanto.forest.bug).
  setGnFlag(run, 'kanto-forest-bug', 1);
  return `${nameOf(content, mon)} walks beside you now. It is your duelist.`;
}

/** What a step needs from events.ts: the stop's seeded stream and the ordinary effect applier (passed in, so this folder imports no engine code). */
export interface GnHost {
  float: () => number;
  apply: (effect: unknown) => string;
  /** The stage number counted from the start of the run (1 = the first stage). */
  stage: number;
  /** The run's current region id. */
  region: string;
  /** The Pokémon picked for this choice (a `pick` choice), if any. */
  picked?: string;
  /** Whether an ordinary event condition holds now (roll modifiers). */
  met?: (condition: unknown) => boolean;
}

/** A Greenneedle condition. */
export function gnConditionMet(content: Content, run: RunState, c: GnCond, stage: number): boolean {
  // gn.16: the fighter won from behind (the first Pokémon able to fight is at half its HP or less).
  // gn.33: the tide is low (the Sunken City's causeway is out of the water).
  if (c.test === 'lowTide') return tideOf(content, run) === 'low';
  if (c.test === 'highTide') return tideOf(content, run) === 'high';
  if (c.test === 'hurtLead') { const lead = run.party.find((m) => m.hp > 0); return !!lead && lead.hp * 2 <= maxHp(content, lead); }
  if (c.test === 'lookAtLevel') return run.party.some((m) => !!m.look && c.types!.includes(m.look) && m.level >= gnFlag(run, c.key!));
  if (c.test === 'notRegion') return !c.types!.includes(run.regionOrder[run.regionIndex] ?? '');
  if (c.test === 'holdsBerry') return run.party.some((m) => Object.entries(m.held ?? {}).some(([id, n]) => n > 0 && id.endsWith('-berry')));
  // gn.19: a large Pokémon (100 kg or more) in the party, standing, to give the Hippowdon shade.
  if (c.test === 'heavy') return run.party.some((m) => m.hp > 0 && (content.species.get(m.speciesId)?.weight ?? 50) >= 100);
  if (c.test === 'cutter') return run.party.some((m) => m.hp > 0 && m.moves.some((s) => { const mv = content.moves.get(s.id); return !!mv && mv.category !== 'status' && (mv.flags.includes('slicing') || s.id.includes('claw')); }));
  if (c.test === 'moveType') return run.party.some((m) => m.hp > 0 && m.moves.some((s) => { const mv = content.moves.get(s.id); return !!mv && mv.category !== 'status' && c.types!.includes(mv.type); }));
  if (c.test === 'noMoveType') return !run.party.some((m) => m.moves.some((s) => c.types!.includes(content.moves.get(s.id)?.type ?? '')));
  const stamped = gnFlag(run, c.key!);
  if (c.test === 'laterStage') return stamped > 0 && stamped < stage;
  if (c.test === 'sameStage') return stamped === stage;
  if (c.test === 'notThisStage') return stamped !== stage;
  if (c.test === 'notThisRegion') return stamped !== run.regionIndex + 1;
  if (c.test === 'thisRegion') return stamped === run.regionIndex + 1;
  // gn.22: the guest carrying mark `key` is down (fainted, or no longer in the party).
  if (c.test === 'oldCatch') return !!firstCatch(run);
  // gn.27: the party's best Attack beats `n`% of a `key` Pokémon's at this point of the stage (the Machamp uses two of its four arms).
  if (c.test === 'strength') {
    const column = run.stage?.map.nodes.find((x) => x.id === run.stage!.current)?.column ?? 1;
    const sc = levelScale(content, getCampaign(content, run.campaignId), run.regionIndex, run.stage?.index ?? 0, column);
    const level = Math.max(1, Math.round(sc.start + (sc.end - sc.start) * sc.t));
    const bar = (calcStats(content, createPokemon(content, c.key!, level, 'gn-bar')).atk * (c.n ?? 100)) / 100;
    return run.party.some((m) => m.hp > 0 && calcStats(content, m).atk > bar);
  }
  // gn.36: a party Pokémon holds item `key` (Safety Goggles see through a sandstorm); one has ability `key` (Desert Guide).
  if (c.test === 'holds') return run.party.some((m) => (m.held?.[c.key!] ?? 0) > 0);
  // gn.40, the Day-Care Village's board and Bronwen's pairs.
  if (c.test === 'parentAndChild') return parentAndChild(run);
  // gn.42: last time's ace is in the party (a Brain's answer has something to answer); the lead takes the initiative (SF161).
  if (c.test === 'aceHere') return aceHere(run, c.key!);
  if (c.test === 'leadInitiative') return leadInitiative(run);
  // gn.44: the 1v1 entrant is the Fighting Tournament's champion (gn.16); it is a Pokémon that came back (gn mark `came-back`).
  if (c.test === 'entrantChampion') return !!entrantOf(run)?.champion;
  if (c.test === 'entrantCameBack') return !!entrantOf(run)?.gn?.includes('came-back');
  // gn.45: a rival is well ahead of you (Lead +2 or more).
  if (c.test === 'allstarReady') return allstarReady(run);
  if (c.test === 'allstarUnbeaten') return allstarUnbeaten(run);
  if (c.test === 'rivalTrustMax') return rivalTrustMax(run);
  if (c.test === 'rivalTrustBelow') return !rivalTrustMax(run);
  if (c.test === 'exKnown') return exKnown(run);
  if (c.test === 'exLeft') return !!nextMatchup(run);
  if (c.test === 'rivalTrust') return rivalTrustAtLeast(run, c.n ?? 1);
  if (c.test === 'draftFriend') return !!draftFriend(run);
  // gn.49: a flute to play (or the Exploud you healed roars for you: that counts as music).
  if (c.test === 'fluteReady') return fluteReady(run, run.regionOrder[run.regionIndex] ?? '') || gnFlag(run, 'exploud-healed') > 0;
  if (c.test === 'foodReady') return foodReady(run);
  if (c.test === 'defectorGuest') return !!guestOf(run);
  // gn.51: rests of patience enough for it to climb in by itself.
  if (c.test === 'rehabDone') return gnFlag(run, 'smuggle-rehab') >= restsNeeded(run);
  if (c.test === 'kcNotch') return notchRises(run);
  if (c.test === 'kcMine') return mineRises(run);
  if (c.test === 'kcRegular') return regularRises(run);
  if (c.test === 'sgWaiting') return waiting(run) >= 0;
  if (c.test === 'sgOrdered') return waiting(run) < 0;
  if (c.test === 'rehabWaiting') return gnFlag(run, 'smuggle-rehab') > 0 && gnFlag(run, 'smuggle-rehab') < restsNeeded(run);
  if (c.test === 'rivalAhead') return run.story.rivals.some((r) => (r.world?.lead ?? 0) >= 2);
  if (c.test === 'eggMoveKnown') return run.party.some((m) => { const egg = new Set(eggMoveOptions(content, familyId(content, m.speciesId)).map((o) => o.id)); return m.moves.some((mv) => egg.has(mv.id)); });
  if (c.test === 'natureIs') return run.party.some((m) => m.nature === c.key);
  if (c.test === 'pairGetsOn') return run.party.some((a, i) => run.party.some((b, j) => j > i && pairBondLevel(run, a.uid, b.uid) >= 1));
  // Every Pokémon in the party at Bond level `n` or more (balance co.bondLevelStep friendship a level).
  if (c.test === 'partyBond') return run.party.length > 0 && run.party.every((m) => Math.floor(m.friendship / content.balance.co.bondLevelStep) >= (c.n ?? 1));
  if (c.test === 'hasAbility') return run.party.some((m) => m.fixedAbility === c.key || abilityOf(content, m) === c.key);
  if (c.test === 'holdsItem') return run.party.some((m) => Object.entries(m.held ?? {}).some(([id, n]) => n > 0 && !id.endsWith('-berry')));
  if (c.test === 'hasMark') return run.party.some((m) => m.gn?.includes(c.key!));
  if (c.test === 'markDown') return !run.party.some((m) => m.gn?.includes(c.key!) && m.hp > 0);
  return stamped > 0 && stamped < run.regionIndex + 1;
}

/** Fossils by region (gn.04 Fossil Recovery). A region with none of its own digs up the Kanto three. */
export const REGION_FOSSILS: Record<string, string[]> = {
  kanto: ['helix-fossil', 'dome-fossil', 'old-amber'],
  hoenn: ['root-fossil', 'claw-fossil'],
  sinnoh: ['skull-fossil', 'armor-fossil'],
  unova: ['cover-fossil', 'plume-fossil'],
  kalos: ['jaw-fossil', 'sail-fossil'],
  galar: ['fossilized-bird', 'fossilized-fish', 'fossilized-drake', 'fossilized-dino'],
};
const fossilsOf = (region: string): string[] => REGION_FOSSILS[region] ?? REGION_FOSSILS.kanto!;
const fossilsElsewhere = (region: string): string[] => {
  const own = new Set(fossilsOf(region));
  return [...new Set(Object.values(REGION_FOSSILS).flat())].filter((id) => !own.has(id));
};

/** One Greenneedle story step. Returns the line the outcome shows (may be empty). */
/** gn.43: the auction's eggs, regional variants and unusual Pokémon (the lots are drawn from these). */
const AUCTION_EGGS = ['eevee', 'riolu', 'larvitar', 'dratini', 'togepi', 'bagon', 'gible', 'beldum'];
const AUCTION_VARIANTS = ['vulpix-alola', 'sandshrew-alola', 'meowth-galar', 'ponyta-galar', 'growlithe-hisui', 'zorua-hisui', 'wooper-paldea', 'slowpoke-galar', 'geodude-alola', 'corsola-galar'];
const AUCTION_ODD = ['spinda', 'kecleon', 'castform', 'smeargle', 'chimecho', 'ditto'];

/** A new Pokémon at full HP (the Frontier's rentals and its Brains' answers). */
const makeFull = (content: Content) => (speciesId: string, level: number, uid: string): PokemonInstance => {
  const mon = createPokemon(content, speciesId, level, uid);
  mon.hp = maxHp(content, mon);
  return mon;
};

export function applyGnEffect(content: Content, run: RunState, e: GnEffect, host: GnHost): string {
  switch (e.op) {
    case 'duelist':
      return markDuelist(content, run, e.type ?? 'bug');
    case 'capFlag':
      if (gnFlag(run, e.key!) > e.n!) setGnFlag(run, e.key!, e.n!);
      return '';
    case 'setFlag':
      setGnFlag(run, e.key!, e.n!);
      return '';
    case 'unmark':
      if (e.key === 'duelist') setGnFlag(run, FOREST.duelist, 0);
      for (const mon of run.party) if (mon.gn) mon.gn = mon.gn.filter((t) => t !== e.key && !t.startsWith(`${e.key}:`));
      return '';
    case 'check':
      setGnFlag(run, e.key!, e.if!.every((c) => host.met?.(c) ?? false) ? 1 : 0);
      return '';
    case 'roll': {
      const odds = e.n! + (e.mods ?? []).filter((m) => m.when.every((c) => host.met?.(c) ?? false)).reduce((sum, m) => sum + m.n, 0);
      setGnFlag(run, e.key!, host.float() * 100 < odds ? 1 : 0);
      return '';
    }
    case 'pick': {
      const total = e.weights!.reduce((a, b) => a + b, 0);
      let at = host.float() * total;
      let index = e.weights!.length;
      for (let i = 0; i < e.weights!.length; i++) {
        at -= e.weights![i]!;
        if (at < 0) {
          index = i + 1;
          break;
        }
      }
      setGnFlag(run, e.key!, index);
      return '';
    }
    case 'when': {
      const v = gnFlag(run, e.key!);
      if (v < (e.min ?? 1) || v > (e.max ?? 99)) return '';
      const lines = (e.then ?? []).map((x) => host.apply(x)).filter(Boolean);
      return [e.text, ...lines].filter(Boolean).join(' · ');
    }
    case 'scene': {
      const here = run.stage?.map.nodes.find((n) => n.id === run.stage!.current);
      if (!here || !content.events.has(e.key!)) return '';
      here.sides.push({ id: `event-room-${here.sides.length + 1}-${here.id}`, kind: 'event', used: false, eventId: e.key! });
      if (run.itemCounters) delete run.itemCounters[`event-seen:${e.key!}`];
      return '';
    }
    case 'stampRegion':
      setGnFlag(run, e.key!, run.regionIndex + 1);
      return '';
    case 'stampStage':
      setGnFlag(run, e.key!, host.stage);
      return '';
    case 'leadBoost': {
      const lead = run.party.find((m) => m.hp > 0) ?? run.party[0];
      if (lead) lead.boosts = [...(lead.boosts ?? []), { kind: 'stage', stat: e.type as 'spe', stages: e.n!, turns: 99 }];
      return '';
    }
    // A Pokémon fights alone for a while (the rain's Fire-type, Flame 5): the team waits in the canon stash, and comes back after.
    // Unlike Flight North's restore, whoever stood in for them simply leaves; nothing is remembered.
    case 'stash': {
      const ex = (run.expansion ?? {}) as NonNullable<RunState['expansion']>;
      const canon = ex.canon ?? { flags: [], completed: [], menus: {} };
      if (canon.stash || run.party.length === 0) return '';
      (run as { expansion?: object }).expansion = { ...ex, canon: { ...canon, stash: structuredClone(run.party) } };
      run.party = [];
      return 'Your team steps back';
    }
    case 'unstash': {
      const canon = run.expansion?.canon;
      if (!canon?.stash || canon.solo) return '';
      run.party = canon.stash as PokemonInstance[];
      delete canon.stash;
      return 'Your team comes back';
    }
    case 'markLook':
      for (const mon of run.party) if (mon.look === e.type) mon.gn = [...(mon.gn ?? []).filter((t) => t !== e.key), e.key!];
      return '';
    case 'setLook':
      for (const mon of run.party) if (mon.gn?.includes(e.key!)) mon.look = e.type as PokemonInstance['look'];
      return '';
    case 'noFaint':
      if (run.party.every((m) => m.hp > 0)) setGnFlag(run, e.key!, gnFlag(run, e.key!) + e.n!);
      return '';
    case 'clampFlag':
      setGnFlag(run, e.key!, Math.max(e.min!, Math.min(e.max!, gnFlag(run, e.key!))));
      return '';
    case 'itemEach':
      addItem(run.inventory, e.key!, Math.max(1, run.party.length));
      return '';
    // gn.15: a side branch at the next step (the thieves' camp): a stop for the event on every node the path can go to next.
    case 'ahead': {
      const here = run.stage?.map.nodes.find((n) => n.id === run.stage!.current);
      if (!here || !content.events.has(e.key!)) return '';
      for (const next of run.stage!.map.nodes.filter((n) => here.next.includes(n.id))) {
        if (next.sides.some((x) => x.eventId === e.key && !x.used)) continue;
        next.sides.push({ id: `event-ahead-${next.sides.length + 1}-${next.id}`, kind: 'event', used: false, eventId: e.key! });
      }
      if (run.itemCounters) delete run.itemCounters[`event-seen:${e.key!}`];
      return '';
    }
    case 'payBerry': {
      // gn.12: one held Berry is handed over (the first party Pokémon holding one, the first Berry by name).
      for (const m of run.party) {
        const id = Object.keys(m.held ?? {}).sort().find((k) => k.endsWith('-berry') && (m.held![k] ?? 0) > 0);
        if (!id) continue;
        m.held![id]! -= 1;
        if (m.held![id] === 0) delete m.held![id];
        return `Paid a ${content.catalog.get(id)?.name ?? id}`;
      }
      return '';
    }
    case 'minigame': {
      const here = run.stage?.map.nodes.find((n) => n.id === run.stage!.current);
      if (!here || !content.minigames.games.some((g) => g.id === e.key)) return '';
      const id = `minigame-${e.key}-${here.sides.length + 1}`;
      here.sides.push({ id, kind: 'minigame', minigameId: e.key!, used: false });
      delete run.minigames.attempts[id];
      return '';
    }
    case 'releaseLast': {
      const all = [...run.party.map((m, i) => ({ m, where: 'party' as const, i })), ...run.box.map((m, i) => ({ m, where: 'box' as const, i }))].filter((x) => e.species!.includes(x.m.speciesId));
      const last = all.sort((a, b) => b.m.uid.localeCompare(a.m.uid, undefined, { numeric: true }))[0];
      if (!last || (last.where === 'party' && run.party.length <= 1)) return '';
      if (last.where === 'party') run.party.splice(last.i, 1);
      else run.box.splice(last.i, 1);
      return `Let go: ${getSpecies(content, last.m.speciesId).name}`;
    }
    case 'cast': {
      // Picked once: a later cast of the same story Pokémon keeps the first pick.
      if (castOf(run, e.key!)) return '';
      const gen = REGION_GENERATION[host.region];
      const local = e.n === 1 ? [...content.species.values()].filter((sp) => !sp.evolvesFrom && sp.evolutions.length > 0 && (gen === undefined || sp.generation === gen) && !sp.tags.includes('legendary') && !sp.tags.includes('mythical') && !e.species!.includes(sp.id)).map((sp) => sp.id).sort() : [];
      const known = e.species!.filter((id) => content.species.has(id));
      // The region's own Pokémon count as one more choice, not one each.
      const slot = Math.floor(host.float() * (known.length + (local.length > 0 ? 1 : 0)));
      const pick = slot < known.length ? known[slot]! : local[Math.floor(host.float() * local.length)]!;
      run.story.flags[`${key(`cast-${e.key}`)}:${pick}`] = 1;
      return '';
    }
    case 'markLast': {
      const last = run.party.filter((m) => e.species!.includes(m.speciesId)).sort((a, b) => b.uid.localeCompare(a.uid, undefined, { numeric: true }))[0];
      if (last) last.gn = [...(last.gn ?? []).filter((t) => t !== e.key), e.key!];
      return '';
    }
    case 'dropMarked': {
      const staying = run.party.filter((m) => !m.gn?.includes(e.key!));
      if (staying.length === 0) return '';
      run.party = staying;
      return '';
    }
    case 'lendHeld': {
      for (const m of run.party) {
        const id = Object.keys(m.held ?? {}).sort().find((k) => !k.endsWith('-berry') && (m.held![k] ?? 0) > 0);
        if (!id) continue;
        m.held![id]! -= 1;
        if (m.held![id] === 0) delete m.held![id];
        const k = `${key(`lent-${e.key}`)}:${id}`;
        run.story.flags[k] = Number(run.story.flags[k] ?? 0) + 1;
        return `Lent: ${content.catalog.get(id)?.name ?? id}`;
      }
      return '';
    }
    case 'returnLent': {
      const prefix = `${key(`lent-${e.key}`)}:`;
      const lines: string[] = [];
      for (const k of Object.keys(run.story.flags).filter((x) => x.startsWith(prefix)).sort()) {
        const n = Number(run.story.flags[k] ?? 0);
        run.story.flags[k] = 0;
        if (n > 0) lines.push(host.apply({ kind: 'item', id: k.slice(prefix.length), count: n }));
      }
      return lines.filter(Boolean).join(', ');
    }
    case 'partner': {
      const mon = firstCatch(run);
      if (!mon) return '';
      for (const m of [...run.party, ...run.box]) if (m.gn) m.gn = m.gn.filter((t) => t !== e.key);
      mon.gn = [...(mon.gn ?? []), e.key!];
      const nature = mon.nature ? NATURE_IDS.indexOf(mon.nature) : fnv1a(mon.uid);
      setGnFlag(run, 'partner-story', (Math.max(0, nature) % 3) + 1);
      setGnFlag(run, 'partner-bond', bondLevel(content, mon));
      // gn.new.03's Ball That Wouldn't Open marks its Pokémon `wouldnt-open`: if that is the partner, it has had three trainers.
      setGnFlag(run, 'partner-was-ball', mon.gn.includes('wouldnt-open') ? 1 : 0);
      return '';
    }
    case 'oldMove': {
      const mon = run.party.find((m) => m.gn?.includes(e.key!));
      if (!mon) return '';
      const known = new Set(mon.moves.map((m) => m.id));
      const dropped = getSpecies(content, mon.speciesId).learnset.filter((x) => x.level <= mon.level && !known.has(x.move) && isUsableMove(content, x.move)).map((x) => x.move);
      // The oldest move it has dropped: the one it used back then.
      const id = dropped[0];
      if (!id) return '';
      const slot = { id, pp: content.moves.get(id)!.pp };
      // A full moveset gives up its last move, never Two Trainers (taught just before, at high Bond).
      if (mon.moves.length < 4) mon.moves.push(slot);
      else mon.moves[mon.moves[3]!.id === 'two-trainers' ? 2 : 3] = slot;
      return `${nameOf(content, mon)} remembered ${content.moves.get(id)!.name}!`;
    }
    case 'crystal':
    case 'crystalDrop':
    case 'crystalMost':
      // gn.32: the Crystal Caverns' bag (core/greenneedle/crystals.ts).
      return crystalOp(content, run, e.op, e.key, e.type, host.picked ? run.party.find((m) => m.uid === host.picked) : undefined);
    case 'lightning':
      // gn.35: Thunderstorm Ridge's lightning, once per node.
      return lightning(content, run, e.n!, host.float());
    case 'labCast':
      // gn.38: the subject, from this region's pseudo-legendary line.
      labCast(content, run, host.region);
      return '';
    case 'labForm':
      return labForm(content, run, e.key ?? '', host.region);
    case 'marketArrive':
      return marketArrive(content, run, host.region, host.float());
    case 'marketBuy': {
      const paid = marketBuy(run, e.key!, e.n!);
      if (!paid) return 'You count it out twice. You\'re short.';
      return [paid.line, ...(e.then ?? []).map((x) => host.apply(x))].filter(Boolean).join(' · ');
    }
    case 'marketOffer': {
      const r = marketOffer(run, e.key!, e.n!, e.min!);
      // Refused (or short): back to the lot (`type`), still on the counter.
      if (r.price === null) return [r.line, e.type ? host.apply({ kind: 'gn', op: 'scene', key: e.type }) : ''].filter(Boolean).join(' · ');
      return [r.line, ...(e.then ?? []).map((x) => host.apply(x))].filter(Boolean).join(' · ');
    }
    case 'daycareLeave':
      return daycareLeave(content, run, host.picked, host.stage);
    case 'daycareReturn': {
      const r = daycareReturn(content, run, host.stage, (mon, n) => void addLevels(content, mon, n));
      if (!r.eggOf) return r.line;
      const laid = host.apply({ kind: 'egg', species: [familyId(content, r.eggOf.speciesId)], types: [], levelBonus: 0, shinyMultiplier: 1, left: 3, unit: 'battle' });
      eggShape(run, 'habit-daycare', r.parents);
      return [r.line, laid].filter(Boolean).join(' · ');
    }
    case 'eggShape':
      return eggShape(run, e.key!);
    case 'museumArrive':
      return museumArrive(run, host.region);
    // gn.42 The Battle Frontier (frontier.ts).
    case 'frontierClear':
      return frontierClear(run, e.key!, e.n!);
    case 'brainRecord':
      return brainRecord(run, e.key!, e.n!);
    case 'swapIn':
      return swapIn(content, run, host.picked, e.key!, makeFull(content));
    case 'rent': {
      const team = (run.expansion?.canon?.stash as PokemonInstance[] | undefined) ?? run.party;
      return rent(content, run, e.key!, Math.max(1, ...team.map((m) => m.level)), makeFull(content));
    }
    case 'bring':
      return bring(content, run, host.picked);
    case 'bench':
      return bench(run);
    case 'unbench':
      return unbench(run);
    case 'bagLeave':
      return bagLeave(run);
    case 'bagBack':
      return bagBack(run);
    // gn.43 The Pokémon Auction (auction.ts).
    case 'auctionArrive': {
      const lead = run.party.find((m) => m.hp > 0) ?? run.party[0];
      const pickOf = <T>(xs: readonly T[]): T => xs[Math.floor(host.float() * xs.length)]!;
      const quayleLot = [1, 2, 4][gnFlag(run, 'auction-visits') % 3];
      const leadSp = lead ? getSpecies(content, lead.speciesId) : undefined;
      const has = (id: string) => content.items.has(id) || content.catalog.has(id);
      const held = TYPE_HELD[leadSp?.types[0] ?? 'normal'] ?? 'silk-scarf';
      const stoneOf = (m: PokemonInstance) => getSpecies(content, m.speciesId).evolutions.find((x) => x.item && /-stone$/.test(x.item) && has(x.item))?.item;
      const stone = (lead && stoneOf(lead)) ?? run.party.map(stoneOf).find(Boolean) ?? 'moon-stone';
      const fossils = fossilsOf(host.region).filter(has);
      const eggs = AUCTION_EGGS.filter((sp) => content.species.has(sp));
      const egg = quayleLot === 4 && lead ? familyId(content, lead.speciesId) : pickOf(eggs);
      const variant = pickOf(AUCTION_VARIANTS.filter((sp) => content.species.has(sp)));
      const odd = pickOf(AUCTION_ODD.filter((sp) => content.species.has(sp)));
      return auctionArrive(run, [has(held) ? held : 'leftovers', stone, fossils.length ? pickOf(fossils) : 'helix-fossil', egg, variant, odd], host.float, 1 + Math.floor(host.float() * 3));
    }
    case 'auctionOpen':
      return auctionOpen(run, e.n!);
    case 'auctionRound':
      return auctionRound(run, e.key!);
    case 'auctionWin': {
      // The lot you won comes to your seat (or, bought to return, stays in its box).
      const n = gnFlag(run, 'auction-lot');
      if (gnFlag(run, 'auction-won') === 0 || gnFlag(run, 'auction-done') === 0) return '';
      if (gnFlag(run, 'auction-stolen') === n && gnFlag(run, 'auction-return-intent') > 0) return 'You don\'t open it. It isn\'t yours.';
      const thing = castOf(run, `auction-lot-${n}`);
      if (!thing) return '';
      if (n <= 3) return host.apply({ kind: 'item', id: thing, count: 1 });
      if (n === 4) return host.apply({ kind: 'egg', species: [thing], types: [], levelBonus: 0, shinyMultiplier: 1, left: 3, unit: 'battle' });
      const odd = n === 6 ? gnFlag(run, 'auction-odd') : 0;
      return host.apply({ kind: 'join', recall: false, species: [thing], types: [], levelBonus: 0, shinyMultiplier: odd === 2 ? 1e9 : 1, shadow: false, blissful: false, hiddenAbility: odd === 1, moves: [], direct: false, alpha: false, starterType: false, asIs: true,
        ...(odd === 3 ? { marks: ['sailed round the world twice with Captain Ferreira, and has the tattoo to prove it'] } : {}) });
    }
    case 'auctionReturn':
      return auctionReturn(run);
    // gn.44 The 1v1 Championship (onevone.ts).
    case 'onevoneEnter':
      return onevoneEnter(content, run, host.picked, host.region);
    case 'onevoneEnd':
      return onevoneEnd(run, e.n ?? 0);
    case 'onevoneChampion':
      return onevoneChampion(content, run);
    case 'borrowStart':
      return borrowStart(content, run, makeFull(content));
    case 'borrowEnd':
      return borrowEnd(content, run, e.n ?? 0);
    case 'draftStart':
      return draftStart(content, run);
    case 'draftPick':
      return draftPick(content, run, e.n ?? 1, makeFull(content));
    case 'draftWon':
      return draftWon(content, run);
    case 'draftRecruit':
      return draftRecruit(content, run, host.picked, host);
    case 'draftEnd':
      return draftEnd(run);
    case 'draftAldhelm':
      return draftAldhelm(content, run, host);
    case 'draftLetter':
      return draftLetter(content, run);
    case 'snorlaxFeed':
      return snorlaxFeed(content, run, e.n ?? 3, e.key === 'first');
    case 'snorlaxFond':
      return snorlaxFond(content, run);
    case 'snorlaxFollow':
      return snorlaxFollow(run, host.stage);
    case 'snorlaxCaught':
      return snorlaxCaught(run);
    case 'defectorStart':
      return defectorStart(content, run, e.n ?? 1, host);
    case 'defectorTrust':
      return defectorTrust(run, e.n ?? 0);
    case 'defectorMeet':
      return defectorMeet(run, e.n ?? 1);
    case 'defectorReturn':
      return defectorReturn(run, (e.n ?? 0) > 0);
    case 'defectorEnd':
      return defectorEnd(run);
    case 'smuggleCages':
      return smuggleCages(content, run, host.float);
    case 'smuggleRehab':
      return smuggleRehab(run, e.n ?? 1);
    case 'smuggleJoin':
      return smuggleJoin(content, run, host);
    case 'smugglePostcard':
      return smugglePostcard(run);
    case 'taStart':
      return taStart(content, run, e.n ?? 1, host.float);
    case 'taLot':
      return taLot(run, e.n ?? 0);
    case 'taRare':
      return taRare(run, e.n ?? 1, host.stage, host);
    case 'taEnd':
      return taEnd(run, host);
    case 'sgStart':
      return sgStart(content, run);
    case 'sgAssign':
      return sgAssign(run, e.n ?? 0);
    case 'sgAct':
      return sgAct(run, e.key as DistrictId, e.n ?? 3);
    case 'sgRescue':
      return sgRescue(run, e.key as DistrictId, host.float);
    case 'sgHomes':
      return sgHomes(run, e.n ?? 1);
    case 'sgHalf':
      return sgHalf(run, e.n ?? 1);
    case 'sgWhole':
      return sgWhole(run);
    case 'sgEnd':
      return sgEnd(content, run, e.n ?? 0, host.stage);
    case 'sgJoin':
      return sgJoin(run, host);
    case 'kcArrive':
      return kcArrive(run, host.float);
    case 'kcJump':
      return kcJump(run, e.n ?? 5);
    case 'kcEvolve':
      return kcEvolve(run);
    case 'bidoofJoin':
      return bidoofJoin(content, run, host);
    case 'exDraw':
      return exDraw(run);
    case 'exBack':
      return exBack(run, e.n ?? 0);
    case 'exWatch':
      return exWatch(content, run, e.n ?? 1, e.key ?? 'cheer');
    case 'exResult':
      return exResult(content, run);
    case 'allstarDraw':
      return allstarDraw(content, run);
    case 'allstarChampion':
      return allstarChampion(content, run, host.region);
    case 'lessonArrive':
      return lessonArrive(content, run, host.region);
    case 'lessonEnd':
      return lessonEnd(content, run);
    case 'lessonBonus':
      return lessonBonus(content, run);
    case 'lessonTeach':
      return lessonTeach(content, run);
    case 'onevonePrize': {
      // Rounds four to seven: a held item for the entrant's type.
      const mon = entrantOf(run);
      const id = mon ? TYPE_HELD[getSpecies(content, mon.speciesId).types[0] ?? 'normal'] : undefined;
      return id && content.catalog.has(id) ? host.apply({ kind: 'item', id, count: 1 }) : '';
    }
    case 'gavel': {
      // The secret lot's gavel goes to the picked Pokémon (a held thing: its first move each battle can't be interrupted).
      const mon = run.party.find((m) => m.uid === host.picked);
      if (!mon) return '';
      mon.gn = [...(mon.gn ?? []).filter((t) => t !== GAVEL), GAVEL];
      mon.marks = [...(mon.marks ?? []), 'carries Mr. Pryde\'s gavel, and means it'].slice(-8);
      return `${nameOf(content, mon)} takes the gavel. It holds it like it's always had one.`;
    }
    case 'marketUndercut':
      return marketUndercut(run, e.key!, e.n!);
    case 'markLead': {
      // gn.30: a history mark on the lead (the pink one that ate the island fruit for a day).
      const lead = run.party.find((m) => m.hp > 0) ?? run.party[0];
      if (!lead) return '';
      const mark = e.text ?? e.key!;
      lead.marks = [...(lead.marks ?? []).filter((m) => m !== mark), mark].slice(-8);
      return `${nameOf(content, lead)}: ${mark}`;
    }
    case 'natureLast': {
      // gn.12: Swap Alley's choice of nature, for the Pokémon that just arrived by an honest trade.
      const uid = run.story.flags['ev:last-trade-uid'];
      const mon = run.party.find((m) => m.uid === uid);
      if (!mon || !(NATURE_IDS as readonly string[]).includes(e.key!)) return '';
      mon.nature = e.key as (typeof NATURE_IDS)[number];
      return `${nameOf(content, mon)} is ${e.key![0]!.toUpperCase()}${e.key!.slice(1)} now.`;
    }
    case 'nextOp': {
      // gn.28: the turned scientist's note names the team's next operation (the one after those already drawn).
      const s = run.story.evil;
      const team = content.evilTeams.teams.find((t) => t.id === s?.teamId);
      if (!s || !team || team.ops.length === 0 || s.end !== 'none') return '';
      const def = team.ops[s.ops.length % team.ops.length]!;
      return `The note, in a careful scientist's hand: ${team.name}'s next operation is ${def.name}.`;
    }
    case 'castBase': {
      const mon = [...run.party, ...run.box].find((m) => m.gn?.includes(e.type!));
      if (!mon || castOf(run, e.key!)) return '';
      let base = getSpecies(content, mon.speciesId);
      for (let i = 0; i < 4 && base.evolvesFrom && content.species.has(base.evolvesFrom); i++) base = getSpecies(content, base.evolvesFrom);
      run.story.flags[`${key(`cast-${e.key}`)}:${base.id}`] = 1;
      return '';
    }
    case 'castItem': {
      const sp = castOf(run, e.key!);
      if (!sp || !content.species.has(sp)) return '';
      const stone = getSpecies(content, sp).evolutions.find((x) => x.item && (content.items.has(x.item) || content.catalog.has(x.item)))?.item;
      return host.apply({ kind: 'item', id: stone ?? 'rare-candy', count: 1 });
    }
    case 'hpCap': {
      const lead = run.party.find((m) => m.hp > 0);
      if (lead) lead.hp = Math.max(1, Math.min(lead.hp, Math.floor((maxHp(content, lead) * e.n!) / 100)));
      return '';
    }
    case 'addParty':
      setGnFlag(run, e.key!, gnFlag(run, e.key!) + run.party.filter((m) => m.hp > 0).length);
      return '';
    case 'markParty':
      for (const mon of [...run.party, ...run.box]) mon.gn = [...(mon.gn ?? []).filter((t) => t !== e.key), e.key!];
      return '';
    case 'dropUnmarked': {
      const kept = (m: PokemonInstance) => !!m.gn?.includes(e.key!);
      // Never an empty party: if nobody carries the mark (an old save), the party stays as it is.
      const lost = [...(run.party.some(kept) ? run.party : []), ...run.box].filter((m) => !kept(m));
      if (run.party.some(kept)) run.party = run.party.filter(kept);
      run.box = run.box.filter(kept);
      for (const mon of [...run.party, ...run.box]) if (mon.gn) mon.gn = mon.gn.filter((t) => t !== e.key);
      return lost.length ? `Lost: ${lost.map((m) => getSpecies(content, m.speciesId).name).join(', ')}` : '';
    }
    case 'partyHas':
      setGnFlag(run, e.key!, run.party.some((m) => e.species!.includes(m.speciesId)) ? 1 : 0);
      return '';
    case 'stageMod':
      setGnFlag(run, e.key!, host.stage % e.n!);
      return '';
    case 'fossil': {
      const far = e.key === 'far' || (e.key === 'local' && host.float() >= 0.7);
      const table = (far ? fossilsElsewhere(host.region) : fossilsOf(host.region)).filter((id) => content.catalog.has(id) || content.items.has(id));
      if (table.length === 0) return '';
      return host.apply({ kind: 'item', id: table[Math.min(table.length - 1, Math.floor(host.float() * table.length))]!, count: 1 });
    }
    case 'route': {
      const ids = e.to!.ids;
      return host.apply({ kind: 'addEvent', eventId: ids[Math.min(gnFlag(run, e.key!), ids.length - 1)]! });
    }
  }
}

/** Moves that turn a Pokémon away from the foe (the Samurai's Pinsir will not strike it that turn). */
const guards = (content: Content, mon: PokemonInstance, index: number): boolean => {
  const move = content.moves.get(mon.moves[index]?.id ?? '');
  return !!move && (move.effects.protect !== undefined || move.id === 'endure');
};

/** When an event fight begins: the forest's fog dulls everyone's aim, and a trusting duelist moves first on its first move (the token Kindness uses). */
export function gnBattleStart(content: Content, run: RunState): void {
  const battle = run.battle;
  if (!battle) return;
  if (gnFlag(run, FOREST.inside) > 0 && gnFlag(run, FOREST.fog) > 0) battle.accuracyMult = 0.9;
  // gn.42: a Frontier Brain brings the answer to the ace you brought last time.
  const rule = battle.eventRule?.gn;
  if (rule?.startsWith('brain-')) brainStart(content, run, battle, rule.slice('brain-'.length), makeFull(content));
  // gn.44: the 1v1 Championship's drawn opponent, at the entrant's level.
  if (rule === 'onevone' && battle.eventRule?.slot) onevoneStart(content, run, battle, battle.eventRule.slot, makeFull(content));
  // gn.45: the region's Champion, with their own team.
  if (rule === 'champlesson' || rule === 'champexam') lessonStart(content, run, battle, makeFull(content));
  // gn.46: the All-Star bracket. Their teams, upgraded; the final: shaking hands, and a Pokémon that remembers wearing your colours.
  if (rule === 'allstar-qf' || rule === 'allstar-sf') allstarStart(content, run, battle, rule === 'allstar-qf' ? 'qf' : 'sf', makeFull(content));
  // gn.47: the Exhibition's winner, with their own three.
  if (rule === 'exhibition') exStart(content, run, battle, makeFull(content));
  // gn.48: a draft battle (n on n), or the bracket against one of the other drafters (`slot`).
  // gn.50: the defector as a boss (each of theirs answers one of yours); at the team's climax, Corin beside you and the corridor held.
  if (rule === 'defector') defectorBossStart(content, run, battle, makeFull(content));
  defectorClimax(content, run, battle, makeFull(content));
  // gn.49: the Sleeping Snorlax, double HP and half asleep.
  if (rule === 'snorlax') snorlaxStart(content, battle);
  // gn.53: the siege's commander, as strong as the clock let them be.
  if (rule === 'siege-commander') sgCommanderStart(run, battle, FOE_WAITS);
  // gn.54: the serious man's six Magikarp (seven, once he's been beaten).
  // gn.55: the Angry Bidoof, tripled.
  if (rule === 'bidoof') bidoofStart(content, run, battle);
  if (rule === 'quillfeather') quillfeatherStart(content, run, battle, makeFull(content));
  if (rule === 'borrowed') borrowBattleStart(content, run, battle);
  borrowMeet(run, battle);
  if (rule === 'draft') draftBattleStart(content, run, battle, battle.eventRule?.slot, makeFull(content));
  if (rule === 'allstar-final') {
    if (gnFlag(run, 'allstar-shake') > 0) battle.storyEffects.push('allstar-shake');
    if (gnFlag(run, 'x-rival-swapped-teams') > 0 || gnFlag(run, 'rival-colours-kept') > 0) battle.storyEffects.push(`${FOE_WAITS}One of their Pokémon looks across at you, not at your Pokémon. It wore your colours once. It hesitates.`);
  }
  // gn.32: the Crystal Golem takes the type of the colour you carry most.
  if (battle.eventRule?.gn === 'golem') golemStart(run, battle);
  // gn.35: a friendly follower, drawn by a charged crystal: it walks alongside you, and is easier to catch (ridge.ts ridgeCatch).
  if (battle.eventRule?.gn === 'ridge' && gnFlag(run, 'ridge-friendly') > 0) battle.storyEffects.push('ridge:friendly');
  // A Weedle duelist: the swarm's Beedrill will not strike first at one of their own.
  if (battle.event?.eventId === 'gn-03-oak' && battle.kind === 'wild' && ['weedle', 'kakuna', 'beedrill'].includes(markedMon(run, 'duelist')?.was ?? '')) {
    battle.storyEffects.push(`${FOE_WAITS}The swarm hangs back. They will not strike first at one of their own.`);
  }
  // Damian's friends (gn.05): Tully uses Splash twice, on purpose; Bex spends a turn finding the attack button.
  if (battle.eventRule?.gn === 'tully') battle.storyEffects.push(`${FOE_WAITS}Tully's Pokémon uses Splash! On purpose.`, `${FOE_WAITS}Tully's Pokémon uses Splash again! Tully looks very pleased.`);
  // gn.30: three right answers, and the Pink Slowking fights "for the exercise": it uses only half its moves.
  if (battle.eventRule?.gn === 'slowking' && gnFlag(run, 'pink-quiz') >= 3) for (const foe of battle.enemyTeam) if (foe.speciesId === 'slowking') foe.moves = foe.moves.slice(0, Math.max(1, Math.ceil(foe.moves.length / 2)));
  if (battle.eventRule?.gn === 'bex') battle.storyEffects.push(`${FOE_WAITS}Bex is looking for the attack one. "TOP LEFT!" shouts Damian, from the back.`);
  if (battle.eventRule?.gn === 'damian') trainAce(content, battle.enemyTeam[battle.enemyTeam.length - 1], battle.eventRule.ace ?? 1);
  const lead = run.party[battle.activeIndex];
  // The Squirtle Squad (gn.08): the Leader's level is what a Lesser recruit has to reach before it may go back and challenge it.
  if (battle.event?.eventId === 'gn-08-leader' && battle.enemyTeam[0]) setGnFlag(run, 'squad-leader-level', battle.enemyTeam[0].level);
  // Cold Night's Rain (gn.07), Flame 5: the Fire-type fights the owner's last Pokémon itself, worn down already, with one move. It is enough.
  if (battle.eventRule?.gn === 'lastflame' && lead) {
    const foe = battle.enemyTeam[battle.enemyTeam.length - 1];
    if (foe) foe.hp = 1;
    const fire = lead.moves.find((m) => content.moves.get(m.id)?.type === 'fire' && (content.moves.get(m.id)?.power ?? 0) > 0);
    lead.moves = [fire ?? { id: 'ember', pp: content.moves.get('ember')?.pp ?? 25 }];
  }
  if (battle.eventRule?.gn === 'samurai' && lead && lead.friendship >= BOND_THREE) battle.storyEffects.push(`kind:${lead.uid}`);
  // The Fighting Tournament (gn.16): no potions in the ring, for either side.
  if (battle.event?.eventId.startsWith('gn-16-')) battle.enemyItemsUsed = 99;
  // The Fighting Tournament (gn.16). The Hawlucha poses and misses on purpose, twice; from its third turn it stops pretending.
  if (battle.eventRule?.gn === 'hawlucha') battle.storyEffects.push(`${FOE_WAITS}The Hawlucha poses for the front row. Its swing misses. On purpose.`, `${FOE_WAITS}The Hawlucha blows a kiss to the stands and misses again. On purpose. The crowd loves it.`);
  // The final: at Crowd 5 the hall chants its name, and its first move goes first.
  if (battle.eventRule?.gn === 'final' && lead && gnFlag(run, 'tournament-crowd') >= 5) battle.storyEffects.push(`kind:${lead.uid}`);
  // The Polluted Factory (gn.17).
  if (rule === 'pipes' || rule === 'sludge' || rule === 'furnace' || rule === 'core') factoryStart(content, run, battle, rule);
  // The Deep Savanna (gn.19): a sandstorm on the first turn; with no water left the party starts at 90% HP; a Donphan takes a blow.
  if (rule === 'savanna' || rule === 'herd') {
    battle.weather = { id: 'sand', turns: 1 };
    if (gnFlag(run, 'savanna-water') <= 0) for (const m of run.party) if (m.hp > 0) m.hp = Math.min(m.hp, Math.max(1, Math.floor(maxHp(content, m) * 0.9)));
    if (rule === 'herd') battle.storyEffects.push(`${FOE_WAITS}A Donphan from the herd steps in front of your Pokémon and takes the blow meant for it.`);
  }
  // The Great Desert (gn.36): with the water gone, the party enters each battle at 90% HP.
  if (rule === 'desert' && gnFlag(run, 'desert-water') <= 0) for (const m of run.party) if (m.hp > 0) m.hp = Math.min(m.hp, Math.max(1, Math.floor(maxHp(content, m) * 0.9)));
  // The Haunted Mansion (gn.37): every Ghost-type you battled on the way up joins the owner's side, one at a time.
  if (rule === 'mansion' && battle.enemyTeam[0]) {
    const level = battle.enemyTeam[0].level;
    for (const sp of ['gastly', 'shuppet', 'banette']) if (gnFlag(run, `mansion-fought-${sp}`) > 0 && content.species.has(sp)) battle.enemyTeam.push(createPokemon(content, sp, level, `e-mansion-${sp}`));
  }
  // The Overgrown Laboratory (gn.38): the escaped ones have abilities they shouldn't.
  if (rule === 'lab') for (const foe of battle.enemyTeam) if (LAB_ESCAPED[foe.speciesId]) foe.fixedAbility = LAB_ESCAPED[foe.speciesId];
  // The Lush Jungle's Tsareena (gn.20): Trop Kick, High Jump Kick, U-turn.
  if (rule === 'tsareena' && battle.enemyTeam[0]) setMoves(content, battle.enemyTeam[0], ['trop-kick', 'high-jump-kick', 'u-turn']);
  // The Lush Jungle (gn.20): who was already down when the fight began (only a knockout in this fight pulls the ladder up, run.ts).
  if (rule === 'jungle') battle.storyEffects.push(`${JUNGLE_DOWN}${run.party.filter((m) => m.hp <= 0).map((m) => m.uid).join(',')}`);
  // The vine tangle costs the lead its first move, unless it knows a slicing move.
  if (rule === 'jungle' && lead && gnFlag(run, 'jungle-vines') > 0) {
    setGnFlag(run, 'jungle-vines', 0);
    const cuts = lead.moves.some((m) => content.moves.get(m.id)?.flags.includes('slicing'));
    if (!cuts) battle.storyEffects.push(`${YOU_WAIT}Vines tangle round your Pokémon's legs. It can't move this turn.`);
  }
  // The last exchange: both fighters are under a quarter of their HP. "You choose." with Bond 3 or more: its first move goes first.
  if (battle.eventRule?.gn === 'lastExchange') {
    const foe = battle.enemyTeam[0];
    if (foe) foe.hp = Math.max(1, Math.floor(maxHp(content, foe) * 0.2));
    if (lead && gnFlag(run, 'tc-you-choose') > 0 && lead.friendship >= BOND_THREE) battle.storyEffects.push(`kind:${lead.uid}`);
  }
}

/** gn.38's greenhouse: a Bellossom with Drought, a Raticate with Huge Power, a Pidgeotto that doesn't need to flap (Levitate). */
const LAB_ESCAPED: Record<string, string> = { bellossom: 'drought', raticate: 'huge-power', pidgeotto: 'levitate' };

/** The Magmuk's moves (doc gn.17), and the weak ones it is left with in its core. */
const MAGMUK_MOVES = ['earth-power', 'flamethrower', 'gunk-shot', 'sludge-wave'];
const CORE_MOVES = ['ember', 'mud-slap', 'acid'];
const setMoves = (content: Content, mon: PokemonInstance, ids: readonly string[]): void => {
  const moves = ids.filter((id) => content.moves.has(id)).map((id) => ({ id, pp: content.moves.get(id)!.pp }));
  if (moves.length) mon.moves = moves;
};

/**
 * The Polluted Factory raid (gn.17): the Muk that was helped takes one phase's first attack (the phase the player picked), the
 * Molten Sludge lasts six turns less one per Pokémon freed from the pits, the raid opens on Toxic Spikes unless all three valves
 * were closed, and in its core the Magmuk is small, at a third of its HP, with only weak moves.
 */
function factoryStart(content: Content, run: RunState, battle: BattleState, rule: 'pipes' | 'sludge' | 'furnace' | 'core'): void {
  if (rule === 'pipes') return;
  const boss = battle.enemyTeam[0];
  if (gnFlag(run, 'factory-muk-now') > 0) {
    battle.storyEffects.push(`${FOE_WAITS}Your Muk flows in front of the party and takes the first blow. It doesn't make a sound.`);
    setGnFlag(run, 'factory-muk-now', 0);
  }
  if (rule === 'core') {
    if (boss) {
      boss.hp = Math.max(1, Math.floor(maxHp(content, boss) / 3));
      setMoves(content, boss, CORE_MOVES);
    }
    return;
  }
  if (boss) setMoves(content, boss, MAGMUK_MOVES);
  battle.storyEffects.push(`${SLUDGE_TURNS}${Math.max(0, 6 - gnFlag(run, 'factory-freed'))}`);
  if (rule === 'sludge' && gnFlag(run, 'factory-valves') < 3) battle.sideEffects.player.toxicSpikes = 1;
}

/** A type's own boosting item: what a trainer who thought about it would give the ace to hold. */
const TYPE_HELD: Record<string, string> = {
  normal: 'silk-scarf', fighting: 'black-belt', flying: 'sharp-beak', poison: 'poison-barb', ground: 'soft-sand', rock: 'hard-stone', bug: 'silver-powder',
  ghost: 'spell-tag', steel: 'metal-coat', fire: 'charcoal', water: 'mystic-water', grass: 'miracle-seed', electric: 'magnet', psychic: 'twistedspoon',
  ice: 'nevermeltice', dragon: 'dragon-fang', dark: 'blackglasses', fairy: 'fairy-feather',
};

/**
 * Damian's ace (gn.05): "This one I actually trained." It stands `plus` levels above the team, holds its type's booster, and keeps its first two
 * moves while the last two answer its two worst weaknesses (the strongest damaging move it can learn of a type that hits each one hard).
 */
/** Every move the species can learn (level-up, TM/tutor, egg), as rivals/coverage.ts counts it (not imported: it would load rivals before events). */
function learnPool(content: Content, speciesId: string): string[] {
  const sp = content.species.get(speciesId);
  if (!sp) return [];
  const base = sp.form?.base;
  return [...new Set([...sp.learnset.map((e) => e.move), ...(content.learnables.get(speciesId) ?? (base ? content.learnables.get(base) : undefined) ?? []), ...(content.eggMoves.get(speciesId) ?? [])])];
}

export function trainAce(content: Content, ace: PokemonInstance | undefined, plus: number): void {
  if (!ace) return;
  if (plus > 0) {
    addLevels(content, ace, plus);
    ace.hp = maxHp(content, ace);
  }
  const species = content.species.get(ace.speciesId);
  const held = species?.types[0] ? TYPE_HELD[species.types[0]] : undefined;
  if (held && content.catalog.get(held)?.status === 'supported') ace.held = { [held]: 1 };
  const pool = learnPool(content, ace.speciesId).filter((id) => isUsableMove(content, id) && (content.moves.get(id)?.power ?? 0) > 0);
  const types = Object.keys(content.typeChart) as TypeName[];
  const hits = (moveId: string, target: TypeName): boolean => typeEffectiveness(content.typeChart, content.moves.get(moveId)!.type as TypeName, [target]) >= 2;
  const weak = species ? types.filter((t) => typeEffectiveness(content.typeChart, t, species.types as TypeName[]) >= 2) : [];
  const picked: string[] = [];
  for (const w of weak) {
    if (picked.length >= 2) break;
    const best = pool
      .filter((id) => !picked.includes(id) && !ace.moves.slice(0, 2).some((m) => m.id === id) && hits(id, w))
      .sort((a, b) => (content.moves.get(b)!.power ?? 0) - (content.moves.get(a)!.power ?? 0) || a.localeCompare(b))[0];
    if (best) picked.push(best);
  }
  if (picked.length === 0) return;
  const kept = ace.moves.slice(0, 4 - picked.length);
  ace.moves = [...kept, ...picked.map((id) => ({ id, pp: content.moves.get(id)!.pp }))];
}

/** Before the player's command is played: a Greenneedle rule may answer it. Returns the action to play and lines to show first. */
export function gnShape(content: Content, run: RunState, action: PlayerAction): { action: PlayerAction; events: Cue[] } {
  const battle = run.battle;
  const rule = battle?.eventRule?.gn;
  const mon = battle ? run.party[battle.activeIndex] : undefined;
  if (!battle || !rule || !mon || battle.needsSwitch) return { action, events: [] };
  const foe = battle.enemyTeam[battle.enemyIndex];
  // gn.35: earthing the overcharged one. Your Ground-type won't strike it: it stands there, because it's needed there.
  if (rule === 'earthing' && action.kind === 'move' && action.index >= 0 && (content.moves.get(mon.moves[action.index]?.id ?? '')?.category ?? 'status') !== 'status') {
    return { action: { kind: 'idle' }, events: [cue('player', `${nameOf(content, mon)} doesn't strike. It plants its feet, and stands there. It's needed there.`, mon.uid)] };
  }
  // gn.42: the Palace. Your Pokémon choose their own moves, by nature; a Bond 4 one (or a lead that takes the initiative) picks well.
  if ((rule === 'palace' || rule === 'brain-palace') && action.kind === 'move') {
    const types = foe ? (content.species.get(foe.speciesId)?.types ?? []) as TypeName[] : [];
    const r = palaceShape(content, run, battle, action, (t) => (types.length ? typeEffectiveness(content.typeChart, t as TypeName, types) : 1), leadInitiative(run));
    return { action: r.action, events: r.line ? [cue('player', r.line, mon.uid)] : [] };
  }
  if (rule === 'samurai' && foe?.speciesId === 'pinsir' && foe.hp > 0 && action.kind === 'move' && guards(content, mon, action.index)) {
    battle.storyEffects.push(`${FOE_WAITS}Pinsir lowers its horns. It will not strike a foe that is not looking at it.`);
  }
  return { action, events: [] };
}

/** The forest counts (gn.03): battles won inside, and how many of them the duelist fought in; 2 = most, 1 = some, 0 = none. */
function countForest(content: Content, run: RunState, battle: BattleState): void {
  if (gnFlag(run, FOREST.inside) < 1) return;
  // A Bug-type caught in the last room has joined by now: it is marked before this fight is counted.
  markDuelist(content, run, 'bug');
  const duelist = markedMon(run, 'duelist');
  if (!duelist) return;
  const battles = gnFlag(run, FOREST.battles) + 1;
  const fought = gnFlag(run, FOREST.fought) + (battle.participants.includes(duelist.mon.uid) ? 1 : 0);
  setGnFlag(run, FOREST.battles, battles);
  setGnFlag(run, FOREST.fought, fought);
  setGnFlag(run, FOREST.rank, fought * 2 > battles ? 2 : fought > 0 ? 1 : 0);
  if (duelist.mon.speciesId !== duelist.was) setGnFlag(run, FOREST.evolved, 1);
}

/** After a turn: once a fight is won, the stories that count fights take their count (once per fight). */
export function gnAfterTurn(content: Content, run: RunState): Cue[] {
  const battle = run.battle;
  if (!battle || (battle.outcome !== 'win' && battle.outcome !== 'caught') || battle.storyEffects.includes('gn-counted')) return [];
  battle.storyEffects.push('gn-counted');
  countForest(content, run, battle);
  return [];
}

export { cue as gnCue };
