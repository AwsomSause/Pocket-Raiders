// A small vocabulary for writing map events compactly (tools/build-events.ts
// turns the lists in tools/events/*.ts into src/data/events.json).

export type Json = Record<string, unknown>;

export interface EventOpts {
  stop?: string;
  rarity?: 'common' | 'uncommon' | 'rare' | 'epic';
  types?: string[];
  minStage?: number;
  requires?: Json[];
  keyItem?: string;
  cast?: string[];
  pokemon?: string;
  tint?: string;
  effect?: string;
  /** Only in runs started while this game event (gameEvents.json) is on. */
  gameEvent?: string;
  /** A follow-up scene: gets a stop on the first later stage where its `requires` hold. */
  callback?: boolean;
  /** A secret path: shows as "?" until one of these holds. */
  secret?: Json[];
  /** Never drawn on its own: code or another event places it (a room, a landmark, a wanderer's stop). */
  room?: boolean;
  /** Choice memory (Beta 0.6): up to 3 variants, see core/eventMemory.ts. */
  remembers?: Json[];
}

export function ev(id: string, name: string, group: string, o: EventOpts, intro: string, choices: Json[]): Json {
  const { cast = [], pokemon, tint, effect = 'none', ...rest } = o;
  return { id, name, group, ...rest, scene: { cast, ...(pokemon ? { pokemon } : {}), ...(tint ? { tint } : {}), effect }, intro, choices };
}

/** A choice. `fail` is required with a check or chance. */
export function ch(label: string, success: Json, o: { requires?: Json[]; check?: string; chance?: number; prompt?: { id: string; needs: 'ok' | 'good' | 'perfect' }; fail?: Json; branches?: Json[]; pick?: { types?: string[]; moveFlag?: string; bond?: number } } = {}): Json {
  return { label, ...(o.requires ? { requires: o.requires } : {}), ...(o.check ? { check: o.check } : {}), ...(o.chance !== undefined ? { chance: o.chance } : {}), ...(o.prompt ? { prompt: o.prompt } : {}), ...(o.pick ? { pick: o.pick } : {}), ...(o.branches ? { branches: o.branches } : {}), success, ...(o.fail ? { failure: o.fail } : {}) };
}
/** A branch of a choice (`ch(..., { branches: [...] })`): when every condition holds, these words and effects replace the outcome (its battle stays). First match wins. */
export const br = (when: Json[], text: string, ...effects: Json[]): Json => ({ when, text, effects });
/** You hold one of these items. */
export const hasAny = (...ids: string[]): Json => ({ kind: 'itemAny', ids });
/** One of these that you hold is given up. */
export const loseOne = (...ids: string[]): Json => ({ kind: 'loseItem', from: ids });
/** The lead (the first Pokémon able to fight) is of this type. */
export const leadIs = (type: string): Json => ({ kind: 'leadType', type });
/** The Pokémon the last pick choice named (remembered for the run) is one of these types / is the starter. */
export const pickedIs = (types: string[] = [], starter?: boolean): Json => ({ kind: 'picked', types, ...(starter === undefined ? {} : { starter }) });

export const out = (text: string, ...effects: Json[]): Json => ({ text, effects });
export const fight = (text: string, battle: Json, ...effects: Json[]): Json => ({ text, effects, battle });
export const leave = (text = 'You leave it be and walk on.'): Json => out(text);

// ---------- effects ----------
export const $ = (amount: number): Json => ({ kind: 'money', amount });
export const item = (id: string, count = 1): Json => ({ kind: 'item', id, count });
export const any = (...ids: string[]): Json => ({ kind: 'itemFrom', ids });
export const lose = (id?: string): Json => ({ kind: 'loseItem', ...(id ? { id } : {}) });
/** A trade: the lowest-level party Pokémon fitting `want` leaves (put before the `join` that replaces it). */
export const trade = (label: string, want: { species?: string[]; type?: string; tag?: string; stage?: number; minWeight?: number; maxWeight?: number; generation?: number; minLevel?: number; eggGroup?: string; color?: string } = {}): Json => ({ kind: 'tradeAway', want: { label, ...want } });
export const heal = (share = 1): Json => ({ kind: 'heal', share });
export const hurt = (share: number): Json => ({ kind: 'damage', share });
/** Hits only the lead (the first Pokémon able to fight), sparing Pokémon of the `except` types. */
export const hurtLead = (share: number, except: string[] = []): Json => ({ kind: 'damage', share, who: 'lead', except });
/** Damage to every Pokémon except those of the given types. */
export const hurtExcept = (share: number, ...except: string[]): Json => ({ kind: 'damage', share, who: 'party', except });
export const statusLead = (s: 'poison' | 'burn' | 'paralysis' | 'sleep'): Json => ({ kind: 'status', status: s, who: 'lead' });
export const cure = (): Json => ({ kind: 'cure' });
export const status = (s: 'poison' | 'burn' | 'paralysis' | 'sleep'): Json => ({ kind: 'status', status: s });
/** Catalog Overhaul: which Pokémon an effect lands on (core/co/who.ts). An object is the first able Pokémon that fits. */
export type Who = 'lead' | 'party' | 'picked' | 'starter' | 'top' | 'firstCatch' | 'newest' | { types?: string[]; moveFlag?: string; species?: string[]; every?: boolean };
export const fr = (amount: number, who: Who = 'party'): Json => ({ kind: 'friendship', amount, who });
/** The pack's "+N Bond": +5 friendship per point on one Pokémon, +3 each for the whole party (balance.co). */
export const bondUp = (points = 1, who: Who = 'lead'): Json => fr(points * (who === 'party' ? 3 : 5), who);
/** "(a node)" as a cost: the next `nodes` ordinary nodes are spent on the work (no battle, no reward). */
export const takeNode = (nodes = 1): Json => ({ kind: 'takeNode', nodes });
/** "(a node back)": a step back along the road; nothing is refought, so it costs nothing. */
export const takeNodeBack = (): Json => ({ kind: 'takeNode', back: true });
/** A Bond-level condition: someone (or `who`) has Bond `atLeast` (1 to 5). `absent`: nobody has. */
export const bondIs = (atLeast: number, who: Who | 'any' = 'any', absent = false): Json => ({ kind: 'bondLevel', atLeast, who, ...(absent ? { absent: true } : {}) });
/** A party Pokémon of any of these types ("a Ground- or Water-type"). */
export const anyType = (...types: string[]): Json => ({ kind: 'partyTypes', types });
export const attr = (key: string, amount: number): Json => ({ kind: 'attribute', key, amount });
export const good = (n: number): Json => attr('goodEvil', n);
export const evil = (n: number): Json => attr('goodEvil', -n);
export const rage = (n: number): Json => attr('ragePeace', n);
export const peace = (n: number): Json => attr('ragePeace', -n);
export const rp = (amount: number): Json => ({ kind: 'research', amount });
export const lv = (amount: number, who: Who | 'weakest' = 'lead'): Json => ({ kind: 'levels', amount, who });
export const join = (o: { species?: string[]; types?: string[]; lv?: number; shiny?: number; shadow?: boolean; recall?: boolean; uncaught?: boolean } = {}): Json => ({
  kind: 'join',
  ...(o.recall ? { recall: true } : {}),
  ...(o.uncaught ? { uncaught: true } : {}),
  shadow: o.shadow ?? false,
  species: o.species ?? [],
  types: o.types ?? [],
  levelBonus: o.lv ?? 0,
  shinyMultiplier: o.shiny ?? 1,
});
export const egg = (o: { species?: string[]; types?: string[]; lv?: number; shiny?: number; left?: number; unit?: 'battle' | 'stage' } = {}): Json => ({
  kind: 'egg',
  species: o.species ?? [],
  types: o.types ?? [],
  levelBonus: o.lv ?? 0,
  shinyMultiplier: o.shiny ?? 1,
  left: o.left ?? 3,
  unit: o.unit ?? 'battle',
});
export const eggMove = (): Json => ({ kind: 'eggMove' });
export const better = (extra = 0): Json => ({ kind: 'betterDraft', extra });
export const gym = (): Json => ({ kind: 'gymPreview' });
export const flag = (key: string, amount = 1): Json => ({ kind: 'flag', key, amount });
export const reveal = (): Json => ({ kind: 'revealStops' });
/** Fog of war: the map shows this many more columns ahead for the rest of the stage. */
export const scout = (columns: number): Json => ({ kind: 'scout', columns });
/** Another event stop opens beside this node (the next room of a landmark). */
export const room = (eventId: string): Json => ({ kind: 'addEvent', eventId });
/** The next room is one of these, picked at random (a Mystery Dungeon floor). */
export const roomFrom = (...ids: string[]): Json => ({ kind: 'addEventFrom', ids });
/** A weather front rolls in over the columns ahead. */
export const front = (weather: string, columns = 3): Json => ({ kind: 'front', weather, columns });
/** Convoy Mode: take an escort to the gym. */
export const convoy = (name: string, hp = 4): Json => ({ kind: 'convoy', name, hp });
/** The escort recovers. */
export const convoyHeal = (amount: number): Json => ({ kind: 'convoyHeal', amount });
/** An escort is (or is not) under your care. */
export const escorting = (active = true): Json => ({ kind: 'convoy', active });
/** Ideas W4: a trainer tails you and challenges you after `nodes` nodes. */
export const tail = (nodes: number): Json => ({ kind: 'wanderer', nodes });
/** Ideas W4: a travelling companion for the next `stages` stages. */
export const companion = (stages: number): Json => ({ kind: 'wandererFriend', stages });
/** Ideas W4: the next move rides two columns ahead (express, zip-line, warp). */
export const express = (): Json => ({ kind: 'express' });
/** Ideas W4: the map shows the battles ahead for the rest of the stage. */
export const rift = (): Json => ({ kind: 'riftPreview' });
/** Ideas W4: the run calendar's season. */
export const season = (...seasons: string[]): Json => ({ kind: 'season', in: seasons });
/** Ideas W4: the run is in one of these regions. */
export const inRegion = (...ids: string[]): Json => ({ kind: 'region', ids });
/** A lasting effect for the rest of the run (once per id). */
export const relic = (id: string, name: string, effects: Json[]): Json => ({ kind: 'relic', id, name, effects });
/** A story flag condition: at least / at most. */
export const flagIs = (key: string, atLeast = 1, atMost = 99): Json => ({ kind: 'flag', key, atLeast, atMost });
/** A party Pokémon with one of these abilities. */
export const ability = (label: string, ...abilities: string[]): Json => ({ kind: 'partyAbility', abilities, label });

// ---------- battles ----------
export const wild = (o: { format?: 'doubles' | 'triples'; species?: string[]; types?: string[]; lv?: number; shiny?: number; win?: Json[]; recall?: boolean; chain?: number; shadow?: boolean; blissful?: boolean; special?: string } = {}): Json => ({
  kind: 'wild',
  ...(o.special ? { special: o.special } : {}),
  ...(o.format ? { format: o.format } : {}),
  ...(o.shadow ? { shadow: true } : {}),
  ...(o.blissful ? { blissful: true } : {}),
  ...(o.chain ? { chain: o.chain } : {}),
  ...(o.recall ? { recall: true } : {}),
  species: o.species ?? [],
  types: o.types ?? [],
  levelBonus: o.lv ?? 0,
  shinyMultiplier: o.shiny ?? 1,
  win: o.win ?? [],
});
export const trainer = (name: string, o: { format?: 'doubles' | 'triples'; cls?: string; boss?: string; size?: number; types?: string[]; lv?: number; win?: Json[]; ghost?: boolean; retired?: boolean; rival?: boolean; ally?: string; chain?: number; mirror?: boolean; team?: string[]; special?: string; uncaught?: boolean } = {}): Json => ({
  kind: 'trainer',
  ...(o.uncaught ? { uncaught: true } : {}),
  ...(o.team ? { team: o.team } : {}),
  ...(o.special ? { special: o.special } : {}),
  ...(o.format ? { format: o.format } : {}),
  ...(o.chain ? { chain: o.chain } : {}),
  name,
  ...(o.cls ? { classId: o.cls } : {}),
  ...(o.boss ? { bossId: o.boss } : {}),
  ...(o.ghost ? { ghost: true } : {}),
  ...(o.retired ? { retired: true } : {}),
  ...(o.rival ? { rival: true } : {}),
  ...(o.mirror ? { mirror: true } : {}),
  ...(o.ally ? { ally: o.ally } : {}),
  size: o.size ?? 2,
  types: o.types ?? [],
  levelBonus: o.lv ?? 0,
  win: o.win ?? [],
});

// ---------- conditions ----------
export const money = (atLeast: number): Json => ({ kind: 'money', atLeast });
export const party = (atLeast: number): Json => ({ kind: 'partySize', atLeast });
export const att = (key: string, atLeast: number): Json => ({ kind: 'attribute', key, atLeast });
export const isGood = (atLeast: number): Json => ({ kind: 'meter', key: 'goodEvil', side: 'positive', atLeast });
export const isEvil = (atLeast: number): Json => ({ kind: 'meter', key: 'goodEvil', side: 'negative', atLeast });
export const isRage = (atLeast: number): Json => ({ kind: 'meter', key: 'ragePeace', side: 'positive', atLeast });
export const isPeace = (atLeast: number): Json => ({ kind: 'meter', key: 'ragePeace', side: 'negative', atLeast });
export const has = (id: string): Json => ({ kind: 'item', id });
export const feels = (id: string): Json => ({ kind: 'emotion', id });
/** The run clock: the time of day is one of these. */
export const at = (...periods: string[]): Json => ({ kind: 'period', in: periods });
/** The run clock: today is an uncelebrated milestone day. */
export const milestone: Json = { kind: 'milestone' };
/** §11/§29 Pokémon rival state: open, carried (a trainer caught it), sacrificed, or any of them. */
export const monRival = (state: 'open' | 'carried' | 'sacrificed' | 'any'): Json => ({ kind: 'monRival', state });
/** Camp time together: pair chemistry up, tension down, optionally old grudges settled. */
export const bond = (chemistry: number, calm = 3, settle = false): Json => ({ kind: 'campBond', chemistry, calm, settle });
/** Sleep until the next morning (a new day begins). */
export const rest = (): Json => ({ kind: 'rest' });
/** Today's milestone celebration is held (pays once per milestone). */
export const celebrate = (): Json => ({ kind: 'celebrate' });
export const moveFlag = (flag: string): Json => ({ kind: 'partyMoveFlag', flag });
export const ptype = (type: string): Json => ({ kind: 'partyType', type });
/** Aggressive choices N (tag "pacifist") won't make. */
export const fierce: Json = { kind: 'noTrainerTag', tag: 'pacifist' };

// ---------- item groups ----------
export const HEALING = ['potion', 'super-potion', 'hyper-potion', 'full-heal', 'revive'];
export const BALLS = ['poke-ball', 'great-ball', 'ultra-ball'];
export const VITAMINS = ['protein', 'calcium', 'carbos', 'hp-up', 'iron', 'zinc'];
export const STONES = ['fire-stone', 'water-stone', 'thunder-stone', 'leaf-stone', 'moon-stone', 'sun-stone', 'dusk-stone', 'dawn-stone', 'shiny-stone', 'ice-stone'];
export const TREASURE = ['nugget', 'big-pearl', 'pearl', 'star-piece', 'stardust', 'comet-shard', 'relic-gold', 'rare-bone', 'big-mushroom'];
export const HELD = ['leftovers', 'focus-sash', 'life-orb', 'choice-band', 'lucky-punch', 'macho-brace', 'smoke-ball'];
export const BERRIES = ['oran-berry', 'sitrus-berry', 'lum-berry'];
export const FOSSILS = ['old-amber', 'helix-fossil', 'dome-fossil'];

// ---------- map changes ----------
export const stopHere = (stop: 'heal' | 'shop' | 'fish'): Json => ({ kind: 'addStop', stop });
export const ferry = (): Json => ({ kind: 'skipAhead' });
export const RARE_HELD = ['leftovers', 'focus-sash', 'choice-band', 'choice-specs', 'choice-scarf', 'life-orb', 'eviolite', 'rocky-helmet'];
export const TYPE_ITEMS = ['silk-scarf', 'black-belt', 'sharp-beak', 'soft-sand', 'hard-stone', 'spell-tag', 'metal-coat', 'charcoal', 'mystic-water', 'miracle-seed', 'magnet', 'dragon-fang'];
export const SNACKS = ['fresh-water', 'soda-pop', 'lemonade', 'moomoo-milk', 'lava-cookie', 'old-gateau', 'casteliacone', 'sweet-heart'];
