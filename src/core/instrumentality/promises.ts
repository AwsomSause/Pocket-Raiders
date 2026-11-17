// Beta 0.7 M1: Mythical Promises (notes-pack/MYTHICAL_PROMISES.md), in-run only. Tellings (3 make it believed), the Visit
// (10% a region, +3% for each Telling past the third, to 25%; one Mythical per run), the Promise as a rule the game can check
// with a warning before it is broken, and the Guest (a companion outside the party). Pure helpers over `run.expansion.promise`;
// they use their own seeded streams (`mythical-telling`, `mythical-visit`) so no other roll moves. No Keepsakes, no Storybook,
// nothing that outlives the run. Only Mythicals whose status is `supported` (promisesData.ts) visit at random; every non-disabled one can be told of (Visit scenes handle the rest).

import type { Content } from '../contentSchema';
import { hashSeed, Rng } from '../rng';
import { calcStats, getSpecies, maxHp } from '../pokemon';
import { calcDamage, typeEffectiveness } from '../battle/damage';
import { teachableMoves } from '../catalog';
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
const tellable = (): MythicalDef[] => MYTHICALS.filter((m) => m.status !== 'disabled' && m.id !== 'melmetal' && m.id !== 'manaphy'); // Melmetal and Manaphy come only through Meltan and Phione

/** Revived fossil Pokémon (and their evolutions): Genesect comes to those who have brought one back. */
const FOSSILS = new Set(['omanyte', 'omastar', 'kabuto', 'kabutops', 'aerodactyl', 'lileep', 'cradily', 'anorith', 'armaldo', 'cranidos', 'rampardos', 'shieldon', 'bastiodon', 'tirtouga', 'carracosta', 'archen', 'archeops', 'tyrunt', 'tyrantrum', 'amaura', 'aurorus', 'dracozolt', 'arctozolt', 'dracovish', 'arctovish']);

/** Items Meltan will eat (by name: metal, iron, steel, magnets and coins). Held items sit in the bag in this game. */
export const metalItems = (content: Content, run: Pick<RunState, 'inventory'>): string[] =>
  Object.keys(run.inventory).filter((id) => (run.inventory[id] ?? 0) > 0 && /metal|iron|steel|magnet|coin|nugget/i.test(content.items.get(id)?.name ?? '')).sort();
export const MELTAN_TO_MERGE = 8;
/** What an item is worth: its shop price (0 when no shop sells it). */
export const itemValue = (content: Content, id: string): number => content.shop.find((e) => e.item === id)?.price ?? 0;

/** What makes a visit possible this run ("Comes when"). Supported Mythicals only; the others have no trigger yet. */
const COMES_WHEN: Record<string, (content: Content, run: RunState) => boolean> = {
  zarude: (_c, run) => [...run.party, ...run.box].some((m) => m.hatched === true),
  mew: (_c, run) => Object.keys(promiseState(run).track ?? {}).filter((k) => k.startsWith('caught:')).length >= 20,
  darkrai: (_c, run) => trackOf(run, 'restsPassed') >= 2,
  meltan: (_c, run) => metalItems(_c, run).reduce((n, id) => n + (run.inventory[id] ?? 0), 0) >= 5,
  melmetal: (_c, run) => trackOf(run, 'fed') >= MELTAN_TO_MERGE && guestId(run) === null && promiseState(run).visited === null,
  phione: (c, run) => [...run.party, ...run.box].some((m) => m.friendship >= 200 && getSpecies(c, m.speciesId).types.includes('water' as never)),
  jirachi: (_c, run) => trackOf(run, 'declines') >= 3,
  deoxys: (_c, run) => trackOf(run, 'leadChanges') >= 4,
  victini: (_c, run) => trackOf(run, 'winStreak') >= 10,
  genesect: (_c, run) => [...run.party, ...run.box].some((m) => FOSSILS.has(m.speciesId)),
};
/** Small in-run counters (rests passed, species caught). */
export const trackOf = (run: Pick<RunState, 'expansion'>, key: string): number => promiseState(run).track?.[key] ?? 0;
export function bumpTrack(run: RunState, key: string, value: number | ((n: number) => number)): number {
  const p = promiseState(run);
  const next = typeof value === 'function' ? value(p.track?.[key] ?? 0) : value;
  save(run, { ...p, track: { ...p.track, [key]: next } });
  return next;
}
export const guestId = (run: Pick<RunState, 'expansion'>): string | null => promiseState(run).guest?.id ?? null;

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
  return visitDecision(def);
}

export function visitDecision(def: MythicalDef): VisitDecision {
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

// ---------- Stage 2: Promise events from the game's actions, and Wonders that act in the run's flow ----------

/** A caught Pokémon: counts the species (Mew's trigger), checks the Promise (Zeraora's No Cages), and Mew teaches it one extra move (seeded by its uid). */
export function onCaught(content: Content, run: RunState, mon: RunState['party'][number]): string[] {
  if (!run.expansion?.promises) return [];
  bumpTrack(run, `caught:${mon.speciesId}`, 1);
  const lines = noteEvent(content, run, { kind: 'catch' });
  if (guestId(run) === 'manaphy') {
    mon.friendship = Math.min(255, mon.friendship + 40);
    lines.push("Manaphy's tide: the new Pokémon starts with more Bond.");
  }
  if (guestId(run) === 'mew' && mon.moves.length < 8) {
    const options = teachableMoves(content, mon);
    const pick = options.length > 0 ? options[new Rng(hashSeed(`${run.seed}::mew-gift::${mon.uid}`)).int(0, options.length - 1)] : undefined;
    const move = pick ? content.moves.get(pick) : undefined;
    if (move) {
      mon.moves.push({ id: move.id, pp: move.pp });
      lines.push(`Mew's gift: ${getSpecies(content, mon.speciesId).name} knows ${move.name}.`);
    }
  }
  return lines;
}

/** After the party changed (a join, a deposit, a withdraw): Mew's Promise (no two with the same pair of types). */
export const onPartyChanged = (content: Content, run: RunState): string[] => (run.expansion?.promises ? [...noteEvent(content, run, { kind: 'partyChanged' }), ...onBouquetCheck(content, run)] : []);

/** A rest used (a Center or camp heal). Darkrai: at most every second rest. */
export function onRestUsed(content: Content, run: RunState): string[] {
  if (!run.expansion?.promises) return [];
  const previousUsed = trackOf(run, 'restPrevUsed') === 1;
  const lines = noteEvent(content, run, { kind: 'restUsed', previousUsed });
  bumpTrack(run, 'restPrevUsed', 1);
  bumpTrack(run, 'restsPassed', 0);
  bumpTrack(run, 'restsUsed', (n) => n + 1); // Deoxys: a new rest, a new stance
  return lines;
}

/** On entering a stage: rests the last stage offered and the player never used count as passed (Darkrai's trigger). */
export function onStageEntered(run: RunState, previous: { heals: number; used: number; fish?: number; fishUsed?: number } | null, content?: Content): string[] {
  if (!run.expansion?.promises || !previous) return [];
  const water = content && (previous.fish ?? 0) > (previous.fishUsed ?? 0) ? noteEvent(content, run, { kind: 'declineWaterPath' }) : []; // Phione: a fishing spot offered and passed
  if (previous.heals === 0) return water;
  if (previous.used > 0) return water;
  bumpTrack(run, 'restsPassed', (n) => n + 1);
  bumpTrack(run, 'restPrevUsed', 0);
  return water;
}

/** A TM or technical item used (Genesect: No more machines). */
export const onTmUsed = (content: Content, run: RunState): string[] => (run.expansion?.promises ? noteEvent(content, run, { kind: 'useTm' }) : []);

export const STANCE_NAME: Record<string, string> = { atk: 'Attack', def: 'Defense', spe: 'Speed', norm: 'Normal' };

/** The opposing lead at battle start. Darkrai: it loses 1/8 of its HP. Genesect: a free boost to the lead's stronger attacking stat. */
export function wonderAtBattleStart(content: Content, run: RunState): string[] {
  const id = guestId(run);
  const battle = run.battle;
  if (!id || !battle) return [];
  const lines: string[] = [];
  if (id === 'darkrai') {
    const foe = battle.enemyTeam[battle.enemyIndex];
    if (foe && foe.hp > 1) {
      foe.hp = Math.max(1, foe.hp - Math.max(1, Math.floor(maxHp(content, foe) / 8)));
      lines.push('The Nightmare presses in: the opposing lead loses 1/8 of its HP.');
    }
  }
  if (id === 'victini') {
    const key = (run.regionIndex + 1) * 1000 + (run.stage?.index ?? 0) + 1;
    if (trackOf(run, 'victiniStage') !== key) {
      bumpTrack(run, 'victiniStage', key);
      battle.storyEffects.push('promise:sure-hit');
      lines.push("The Victory Star shines: your moves cannot miss in this stage's first battle.");
    }
  }
  if (id === 'zeraora') {
    battle.storyEffects.push('promise:zeraora');
    lines.push("Zeraora crackles: your lead's next attack becomes Electric and hits 20% harder.");
  }
  if (id === 'keldeo') {
    battle.storyEffects.push('promise:keldeo');
    lines.push('Keldeo steadies you: once this battle a move strikes the weaker of the foe\'s defenses.');
  }
  if (id === 'deoxys') {
    const stance = ['', 'atk', 'def', 'spe', 'norm'][trackOf(run, 'stance')] ?? '';
    if (stance) {
      battle.storyEffects.push(`promise:stance-${stance}`);
      lines.push(`Deoxys holds its ${STANCE_NAME[stance]} stance.`);
    }
  }
  if (id === 'meltan' && trackOf(run, 'fed') > 0) {
    battle.storyEffects.push(`promise:meltan:${trackOf(run, 'fed')}`);
    lines.push(`${trackOf(run, 'fed')} Meltan ride behind you: +${trackOf(run, 'fed') * 2}% Defense.`);
  }
  if (id === 'melmetal') {
    battle.storyEffects.push('promise:melmetal');
    lines.push('Melmetal rumbles: your first contact move strikes twice (the second blow at 60%).');
  }
  if (id === 'pecharunt') lines.push(...mochiAlly(content, run));
  if (id === 'genesect') {
    const lead = run.party[battle.activeIndex];
    if (lead) {
      const base = getSpecies(content, lead.speciesId).baseStats;
      const stat = (base.spa ?? 0) > (base.atk ?? 0) ? 'spa' : 'atk';
      battle.playerStages[stat] = Math.min(6, battle.playerStages[stat] + 1);
      lines.push(`Genesect's Drive charges ${getSpecies(content, lead.speciesId).name}: +1 ${stat === 'spa' ? 'Sp. Atk' : 'Attack'}.`);
    }
  }
  return lines;
}

/** A won battle extends the streak (Victini's trigger: ten wins in a row without a faint). */
export const onBattleWon = (run: RunState): void => { if (run.expansion?.promises) bumpTrack(run, 'winStreak', (n) => n + 1); };
/** A faint of the player's ends the streak. */
export const onPlayerFaint = (run: RunState): void => { if (run.expansion?.promises && trackOf(run, 'winStreak') > 0) bumpTrack(run, 'winStreak', 0); };

const bagSize = (run: Pick<RunState, 'inventory'>): number => Object.values(run.inventory).reduce((a, b) => a + b, 0);

/** Stage start, Hoopa: it takes one random item (its own stream, one a stage); the Promise needs at least three left. */
export function hoopaStage(content: Content, run: RunState, stageKey: number): string[] {
  if (guestId(run) !== 'hoopa') return [];
  const lines: string[] = [];
  const ids = Object.keys(run.inventory).filter((id) => (run.inventory[id] ?? 0) > 0).sort();
  if (ids.length > 0) {
    const id = ids[new Rng(hashSeed(`${run.seed}::hoopa-takes::${stageKey}`)).int(0, ids.length - 1)]!;
    run.inventory[id] = (run.inventory[id] ?? 1) - 1;
    if (run.inventory[id] === 0) delete run.inventory[id];
    lines.push(`Hoopa's ring takes one ${content.items.get(id)?.name ?? id} and is gone.`);
  }
  lines.push(...noteEvent(content, run, { kind: 'bagCount', items: bagSize(run) }));
  return lines;
}

/** Hoopa, once a region: its ring brings a strong Pokémon (a wild one that has not been seen to fight, base stats 480+, never a legendary or mythical) of a type the party carries. */
export function hoopaRing(content: Content, run: RunState, regionKey: number): { speciesId: string; level: number; type: string } | null {
  if (guestId(run) !== 'hoopa' || run.party.length === 0) return null;
  const rng = new Rng(hashSeed(`${run.seed}::hoopa-ring::${regionKey}`));
  const types = [...new Set(run.party.flatMap((m) => getSpecies(content, m.speciesId).types as string[]))].sort();
  const type = types[rng.int(0, types.length - 1)]!;
  const pool = [...content.species.values()]
    .filter((sp) => sp.types.includes(type as never) && !sp.form && !sp.tags.some((t) => t === 'legendary' || t === 'mythical' || t === 'baby') && Object.values(sp.baseStats).reduce((a, b) => a + b, 0) >= 480)
    .map((sp) => sp.id).sort();
  if (pool.length === 0) return null;
  const level = Math.max(...run.party.map((m) => m.level));
  return { speciesId: pool[rng.int(0, pool.length - 1)]!, level, type };
}

/** An assist taken (a friend or shadow steps in; a rival's step-in help): Keldeo's Promise, Fight your own battles. */
export const onAssistAccepted = (content: Content, run: RunState): string[] => (run.expansion?.promises ? noteEvent(content, run, { kind: 'acceptAssist' }) : []);

const uidNumber = (uid: string): number => Number(uid.replace(/\D/g, '')) || 0;
/** The player moved a different Pokémon to the front (Deoxys's trigger counts these). */
export const onLeadChanged = (run: RunState): void => { if (run.expansion?.promises) bumpTrack(run, 'leadChanges', (n) => n + 1); };
/** A new stage begins: Deoxys's Promise, never lead with the same Pokémon two stages running. */
export function onLeadAtStage(content: Content, run: RunState): string[] {
  if (!run.expansion?.promises || !run.party[0]) return [];
  const now = uidNumber(run.party[0].uid);
  const before = trackOf(run, 'lastLead');
  const lines = noteEvent(content, run, { kind: 'lead', uid: String(now), previousLead: before > 0 ? String(before) : null });
  bumpTrack(run, 'lastLead', now);
  return lines;
}

export const WISHES = 3;
/** Jirachi's three Wishes for the run. */
export const wishesLeft = (run: RunState): number => (guestId(run) === 'jirachi' ? Math.max(0, WISHES - trackOf(run, 'wishesUsed')) : 0);

/** A choice made in an event. Plain refusals ("Decline", "Refuse", "No, thanks") count as declined requests and gifts: Jirachi's trigger and Promise, Pecharunt's Promise. Judged by the label's first words. */
const REFUSAL = /^(decline|refuse|say no(?![a-z])|no\.?$|no,? thanks|turn (it|that|the offer|them|him|her) down|reject)/i;
export const isRefusal = (label: string): boolean => REFUSAL.test(label.trim());
export function onEventChoice(content: Content, run: RunState, label: string): string[] {
  if (!run.expansion?.promises || !isRefusal(label)) return [];
  bumpTrack(run, 'declines', (n) => n + 1);
  return [...noteEvent(content, run, { kind: 'refuseRequest' }), ...noteEvent(content, run, { kind: 'declineGift' })];
}

/** Selling or cashing in an item (Diancie: Sell nothing). */
export const onSold = (content: Content, run: RunState): string[] => (run.expansion?.promises ? noteEvent(content, run, { kind: 'sell' }) : []);

/** A stage ends (the next one starts): Meltan wants one item a stage. `previousKey` is the stage just left. */
export function onStageLeft(content: Content, run: RunState, previousKey: number | null): string[] {
  if (!run.expansion?.promises || previousKey === null || guestId(run) !== 'meltan') return [];
  return trackOf(run, 'fedKey') === previousKey + 1 ? [] : noteEvent(content, run, { kind: 'stageEndNotFed' });
}
/** A new region begins: Melmetal wants one item given away at the end of each region. */
export function onRegionStarted(content: Content, run: RunState): string[] {
  if (!run.expansion?.promises || run.regionIndex === 0 || guestId(run) !== 'melmetal') return [];
  return trackOf(run, 'gaveRegion') === run.regionIndex ? [] : noteEvent(content, run, { kind: 'regionEndNotGiven' });
}
export const stageKeyOf = (run: Pick<RunState, 'regionIndex' | 'stage'>): number => run.regionIndex * 100 + (run.stage?.index ?? 0);

/** A Pokémon left the party for good (released): Manaphy's Promise, Leave no one. */
export const onReleased = (content: Content, run: RunState): string[] => (run.expansion?.promises ? noteEvent(content, run, { kind: 'release' }) : []);

/** Phione parts at the first region after its Promise was kept; Manaphy, its kin, then comes (same run; the kept Promise counts as two Tellings of it). Null when it does not apply. */
export function manaphyVisit(run: RunState): VisitDecision | null {
  const p = promiseState(run);
  if (!run.expansion?.promises || run.regionIndex === 0 || p.guest?.id !== 'phione') return null;
  const manaphy = mythicalOf('manaphy');
  if (!manaphy) return null;
  save(run, { ...p, guest: null, kept: [...p.kept, 'phione'], visited: 'manaphy', tellings: { ...p.tellings, manaphy: (p.tellings.manaphy ?? 0) + 2 } });
  return visitDecision(manaphy);
}

/** Magearna's bouquet: the party member that carries it (a uid number kept in the run's counters), 0 when no one does yet. */
export const bouquetHolder = (run: RunState): RunState['party'][number] | undefined => {
  const n = trackOf(run, 'bouquet');
  return n > 0 ? [...run.party].find((m) => uidNumber(m.uid) === n) : undefined;
};
/** After the party changed: the bouquet's carrier is gone (Magearna's Promise). */
export function onBouquetCheck(content: Content, run: RunState): string[] {
  if (!run.expansion?.promises || guestId(run) !== 'magearna' || trackOf(run, 'bouquet') <= 0 || bouquetHolder(run)) return [];
  bumpTrack(run, 'bouquet', 0);
  return noteEvent(content, run, { kind: 'bouquetLost' });
}
/** Magearna's Wonder: when a party member faints, the active Pokémon gains +1 Sp. Atk (at most +2 a battle). */
export function magearnaOnFaint(run: RunState): string | null {
  const battle = run.battle;
  if (guestId(run) !== 'magearna' || !battle) return null;
  const used = battle.storyEffects.filter((e) => e === 'promise:magearna-boost').length;
  if (used >= 2 || battle.playerStages.spa >= 6) return null;
  battle.storyEffects.push('promise:magearna-boost');
  battle.playerStages.spa += 1;
  return "Magearna's heart answers the fall: +1 Sp. Atk.";
}

/** Leaving a minigame that is not over (Meloetta: Finish the song). */
export const onMinigameQuit = (content: Content, run: RunState): string[] => (run.expansion?.promises ? noteEvent(content, run, { kind: 'quitMinigame' }) : []);

/** Pecharunt's mochi, once a region: the trainer you face is turned into an ally for this battle. Their strongest member (the last on their team) strikes the Pokémon in front, once, with its best move; nothing else about the battle changes. */
export function mochiAlly(content: Content, run: RunState): string[] {
  const battle = run.battle;
  if (guestId(run) !== 'pecharunt' || !battle?.trainer || trackOf(run, 'mochiRegion') === run.regionIndex + 1) return [];
  const foe = battle.enemyTeam[battle.enemyIndex];
  const friend = battle.enemyTeam[battle.enemyTeam.length - 1];
  if (!foe || !friend || battle.enemyTeam.length < 2 || friend.uid === foe.uid) return [];
  const mine = calcStats(content, friend);
  const theirs = calcStats(content, foe);
  const foeTypes = getSpecies(content, foe.speciesId).types;
  const best = friend.moves
    .map((m) => content.moves.get(m.id))
    .filter((m): m is NonNullable<typeof m> => !!m && m.category !== 'status' && (m.power ?? 0) > 0)
    .map((move) => {
      const physical = move.category === 'physical';
      const effectiveness = typeEffectiveness(content.typeChart, move.type, foeTypes);
      const damage = calcDamage(content.ruleset, { level: friend.level, power: move.power ?? 0, attack: physical ? mine.atk : mine.spa, defense: physical ? theirs.def : theirs.spd, attackStage: 0, defenseStage: 0, stab: getSpecies(content, friend.speciesId).types.includes(move.type), effectiveness, crit: false, randomFactor: 100, burned: false, physical });
      return { move, damage };
    })
    .sort((a, b) => b.damage - a.damage || a.move.id.localeCompare(b.move.id))[0];
  if (!best) return [];
  bumpTrack(run, 'mochiRegion', run.regionIndex + 1);
  foe.hp = Math.max(1, foe.hp - best.damage);
  return [`Pecharunt's mochi makes a friend: ${battle.trainer.name}'s ${getSpecies(content, friend.speciesId).name} turns on its own side and uses ${best.move.name}.`];
}
