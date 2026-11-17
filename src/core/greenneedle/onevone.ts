// Greenneedle gn.44, the 1v1 Championship: one Pokémon, eight opponents, each with one, all scaled to it.
//  - gn op `onevoneEnter` (the picked Pokémon): it is the entrant (the rest wait on the bench: frontier.ts bench/unbench). Draws the
//    eight (cast as `onevone-foe-<n>`, their held items as `onevone-held-<n>`) and remembers, for the two who are always there, whether
//    it's the same Pokémon as last time (within the run).
//  - Battle rule `onevone` (`ace` the slot): the foe's one Pokémon is the drawn one, at the entrant's level (the champion one higher).
//  - gn op `onevoneEnd` (`n` rounds won): the round reached, kept for next time.
//  - gn op `onevoneChampion`: the title ("Champion <name>") and the ability upgrade (a small star beside the ability):
//    entry abilities trigger a second time the first time it comes back in; pinch abilities start at half HP; guarding abilities also block
//    one secondary effect per battle; anything else, +5% to its best stat.
import type { Content, TypeName } from '../contentSchema';
import type { BattleState, PokemonInstance, RunState } from '../state';
import { abilityOf, getSpecies } from '../pokemon';
import { typeEffectiveness } from '../battle/damage';
import { PINCH } from '../battle/abilities';
import { heldPick } from '../bossGear';
import { fnv1a } from '../expansion/hash';
import { BRING } from './frontier';
import { trainerClassesFor } from '../themes';
import { logOf } from './allstar';
import { CareSchema } from '../care/mods';

const f = (run: Pick<RunState, 'story'>, k: string): number => Number(run.story.flags[`ev:${k}`] ?? 0);
const set = (run: Pick<RunState, 'story'>, k: string, n: number): void => {
  run.story.flags[`ev:${k}`] = n;
};
const cast = (run: RunState, name: string, id: string): void => {
  for (const k of Object.keys(run.story.flags)) if (k.startsWith(`ev:cast-${name}:`)) delete run.story.flags[k];
  if (id) run.story.flags[`ev:cast-${name}:${id}`] = 1;
};
const castOf = (run: Pick<RunState, 'story'>, name: string): string | undefined =>
  Object.keys(run.story.flags).find((k) => k.startsWith(`ev:cast-${name}:`))?.slice(`ev:cast-${name}:`.length);

/** Gideon Tolland, dock worker: a different Pokémon every year. */
export const GIDEON = ['machoke', 'krabby', 'wingull', 'quagsire', 'pelipper', 'gurdurr', 'timburr', 'wailmer', 'kingler'];
/** Señora Dolores Vantongeren: the same one for fifty years. */
export const DOLORES = 'xatu';
/** What the six fresh opponents may bring: for each type, a few Pokémon of different strengths. The one nearest the entrant's own strength is drawn. */
export const BY_TYPE: Record<string, string[]> = {
  normal: ['raticate', 'kangaskhan', 'snorlax'], fire: ['ponyta', 'magmar', 'arcanine'], water: ['seaking', 'starmie', 'gyarados'], electric: ['pikachu', 'electabuzz', 'jolteon'],
  grass: ['ivysaur', 'tangela', 'exeggutor'], ice: ['seel', 'cloyster', 'lapras'], fighting: ['machop', 'hitmonlee', 'machamp'], poison: ['arbok', 'weezing', 'muk'],
  ground: ['sandshrew', 'marowak', 'donphan'], flying: ['pidgeotto', 'fearow', 'pidgeot'], psychic: ['drowzee', 'hypno', 'alakazam'], bug: ['beedrill', 'pinsir', 'heracross'],
  rock: ['geodude', 'sudowoodo', 'golem'], ghost: ['gastly', 'haunter', 'dusknoir'], dragon: ['dratini', 'dragonair', 'haxorus'], dark: ['houndour', 'umbreon', 'tyranitar'],
  steel: ['magnemite', 'klinklang', 'metagross'], fairy: ['clefairy', 'granbull', 'clefable'],
};
const total = (content: Content, sp: string): number => Object.values(getSpecies(content, sp).baseStats).reduce((a, n) => a + n, 0);
/** "A similar strength": of these, the few nearest the entrant's base stat total; `pick` chooses among them. */
export function nearest(content: Content, pool: string[], entrant: string, pick: (n: number) => number): string | undefined {
  const want = total(content, entrant);
  const near = pool.filter((s) => content.species.has(s)).sort((a, b) => Math.abs(total(content, a) - want) - Math.abs(total(content, b) - want) || a.localeCompare(b)).slice(0, 3);
  return near[pick(near.length)];
}
/** Who the eight are this time (name and trainer class), kept for the board and the battles. */
export interface Opponent { n: string; c: string; met?: number }
const WHO = 'onevone:who';
export const opponentsOf = (run: Pick<RunState, 'story'>): Opponent[] => {
  try {
    const v = JSON.parse(String(run.story.flags[WHO] ?? '[]')) as unknown;
    return Array.isArray(v) ? (v as Opponent[]) : [];
  } catch {
    return [];
  }
};
/** The reigning champion's name, a different trainer each region (text token `{onevone-champion}`). */
export const CHAMPION_NAME: Record<string, string> = { kanto: 'Mireille Okafor', johto: 'Tadeo Valcourt', hoenn: 'Kaimana Reyes', sinnoh: 'Ottoline Brandt', unova: 'Desmond Achterberg', kalos: 'Solenne Duval', alola: 'Keoni Makoa', galar: 'Harriet Pembury', paldea: 'Inés Albarrán' };
/** The reigning champion, a different one each region. */
const CHAMPION: Record<string, string> = { kanto: 'charizard', johto: 'ampharos', hoenn: 'milotic', sinnoh: 'garchomp', unova: 'haxorus', kalos: 'greninja', alola: 'decidueye', galar: 'corviknight', paldea: 'kingambit' };

export const entrantOf = (run: Pick<RunState, 'party' | 'box'>): PokemonInstance | undefined => [...run.party, ...run.box].find((m) => m.gn?.includes(ENTRANT));
export const ENTRANT = 'onevone-entrant';

/** The entrant goes on the form; the other five wait on the bench. Draws the eight. */
export function onevoneEnter(content: Content, run: RunState, uid: string | undefined, region: string): string {
  const mon = run.party.find((m) => m.uid === uid);
  if (!mon) return '';
  const visits = f(run, 'onevone-visits') + 1;
  set(run, 'onevone-visits', visits);
  // The two who are always there remember the last entrant (this run), and the round it reached.
  const before = castOf(run, 'onevone-entrant');
  set(run, 'onevone-met', before ? 1 : 0);
  set(run, 'onevone-same', before === mon.speciesId ? 1 : 0);
  set(run, 'onevone-again', before === mon.speciesId && f(run, 'onevone-champion-at') === 0 && f(run, 'onevone-round') < 8 ? 1 : 0);
  cast(run, 'onevone-entrant', mon.speciesId);
  for (const m of run.party) m.gn = (m.gn ?? []).filter((t) => t !== ENTRANT && t !== BRING);
  mon.gn = [...(mon.gn ?? []), ENTRANT, BRING];
  set(run, 'onevone-talked', 0);
  // The eight. Gideon (3) and Dolores (6) are always there; the other six are drawn fresh each time, from trainers met on the
  // road this run and this region's trainer classes, each with one Pokémon of about the entrant's strength.
  const types = getSpecies(content, mon.speciesId).types as TypeName[];
  const all = Object.keys(content.typeChart) as TypeName[];
  const h = (salt: string, n: number): number => fnv1a(`${run.seed}::onevone::${visits}::${salt}`) % Math.max(1, n);
  const theme = run.stage ? content.themes.get(run.stage.themeId) : undefined;
  const local = (theme ? trainerClassesFor(content, theme) : [...content.trainers.values()]).filter((c) => c.names.length > 0);
  const everyClass = [...content.trainers.values()].filter((c) => c.names.length > 0);
  const taken = new Set<string>(['Gideon Tolland', 'Señora Dolores Vantongeren']);
  const fresh = (slot: number, wantType?: TypeName): Opponent => {
    const fit = wantType ? everyClass.filter((c) => c.types.includes(wantType)) : [];
    const classes = fit.length ? fit : local.length ? local : everyClass;
    for (let i = 0; i < 12; i++) {
      const cls = classes[h(`${slot}:class:${i}`, classes.length)];
      const name = cls ? `${cls.name} ${cls.names[h(`${slot}:name:${i}`, cls.names.length)]!}` : '';
      if (cls && !taken.has(name)) {
        taken.add(name);
        return { n: name, c: cls.id };
      }
    }
    return { n: `Trainer ${slot}`, c: classes[0]?.id ?? 'ace-trainer' };
  };
  const anyOf = (salt: string): string => nearest(content, Object.values(BY_TYPE).flat(), mon.speciesId, (n) => h(salt, n)) ?? 'kangaskhan';
  const beats = all.filter((t) => typeEffectiveness(content.typeChart, t, types) >= 2 && BY_TYPE[t]);
  const beaten = all.filter((t) => typeEffectiveness(content.typeChart, types[0]!, [t]) >= 2 && BY_TYPE[t]);
  const t4 = beats.length ? beats[h('4', beats.length)]! : ('normal' as TypeName);
  const t5 = beaten.length ? beaten[h('5', beaten.length)]! : ('normal' as TypeName);
  // Round two: a trainer the player has met and beaten on the road this run, with one of the Pokémon they had then.
  const roadMet = logOf(run).filter((m) => m.r === 'w' && m.t.some((s) => content.species.has(s)) && !m.n.includes('Gideon') && !m.n.includes('Dolores'));
  const road = roadMet.length ? roadMet[h('2:met', roadMet.length)] : undefined;
  if (road) taken.add(road.n);
  set(run, 'onevone-road-met', road ? 1 : 0);
  const who: Opponent[] = [
    fresh(1),
    road ? { n: road.n, c: road.c || 'hiker', met: 1 } : fresh(2),
    { n: 'Gideon Tolland', c: 'worker' },
    fresh(4, t4),
    fresh(5, t5),
    { n: 'Señora Dolores Vantongeren', c: 'veteran' },
    fresh(7),
    { n: CHAMPION_NAME[region] ?? CHAMPION_NAME.kanto!, c: 'ace-trainer' },
  ];
  run.story.flags[WHO] = JSON.stringify(who);
  const foes = [
    anyOf('1'),
    road ? (nearest(content, road.t, mon.speciesId, () => 0) ?? anyOf('2')) : anyOf('2'),
    GIDEON[(visits - 1) % GIDEON.length]!,
    nearest(content, BY_TYPE[t4] ?? [], mon.speciesId, () => 0) ?? 'kangaskhan',
    nearest(content, BY_TYPE[t5] ?? [], mon.speciesId, () => 0) ?? 'kangaskhan',
    DOLORES,
    anyOf('7'),
    CHAMPION[region] ?? CHAMPION.kanto!,
  ].map((sp) => (content.species.has(sp) ? sp : 'kangaskhan'));
  foes.forEach((sp, i) => {
    cast(run, `onevone-foe-${i + 1}`, sp);
    // From the specialist on, they carry an item that fits.
    const held = i >= 3 ? heldPick(content, { speciesId: sp, level: mon.level }, i === 7, i === 7) : undefined;
    cast(run, `onevone-held-${i + 1}`, held && content.catalog.has(held) ? held : '');
  });
  return `${content.species.get(mon.speciesId)?.name ?? mon.speciesId}, on the form.`;
}

/** At a round's start: the drawn Pokémon, at the entrant's level (the champion's one higher), with its item. */
export function onevoneStart(content: Content, run: RunState, battle: BattleState, slot: number, make: (speciesId: string, level: number, uid: string) => PokemonInstance): void {
  const entrant = entrantOf(run);
  const sp = castOf(run, `onevone-foe-${slot}`);
  const foe = battle.enemyTeam[0];
  if (!entrant || !sp || !foe || !content.species.has(sp)) return;
  const mon = make(sp, Math.min(500, entrant.level + (slot === 8 ? 1 : 0)), foe.uid);
  const held = castOf(run, `onevone-held-${slot}`);
  if (held) mon.held = { [held]: 1 };
  battle.enemyTeam = [mon];
  battle.enemyIndex = 0;
  // Who it is this time: the drawn name and trainer class.
  const who = opponentsOf(run)[slot - 1];
  if (who && battle.trainer) battle.trainer = { ...battle.trainer, name: who.n, classId: content.trainers.has(who.c) ? who.c : battle.trainer.classId };
}

/** It's over (lost, or won the final): the round reached, remembered. */
export function onevoneEnd(run: RunState, won: number): string {
  set(run, 'onevone-round', won);
  if (won >= 8) set(run, 'onevone-champion-at', f(run, 'onevone-visits'));
  for (const m of [...run.party, ...run.box]) m.gn = (m.gn ?? []).filter((t) => t !== ENTRANT);
  return '';
}

// ---------- The title and the ability upgrade ----------
export const STAR = 'ability-star';
const ENTRY = new Set(['intimidate', 'drizzle', 'drought', 'sand-stream', 'snow-warning', 'electric-surge', 'psychic-surge', 'grassy-surge', 'misty-surge', 'download', 'unnerve', 'frisk', 'anticipation', 'forewarn', 'trace', 'pressure', 'mold-breaker', 'air-lock', 'cloud-nine', 'intrepid-sword', 'dauntless-shield', 'screen-cleaner', 'curious-medicine', 'neutralizing-gas', 'hadron-engine', 'orichalcum-pulse']);
const GUARD = new Set(['sturdy', 'levitate', 'shield-dust', 'inner-focus', 'own-tempo', 'oblivious', 'limber', 'insomnia', 'vital-spirit', 'immunity', 'water-veil', 'magma-armor', 'keen-eye', 'hyper-cutter', 'clear-body', 'white-smoke', 'flash-fire', 'volt-absorb', 'water-absorb', 'battle-armor', 'shell-armor', 'wonder-guard', 'overcoat', 'magic-guard', 'leaf-guard', 'sweet-veil', 'pastel-veil', 'full-metal-body', 'big-pecks', 'suction-cups', 'sap-sipper', 'storm-drain', 'lightning-rod', 'motor-drive', 'thick-fat', 'heatproof']);
export type StarKind = 'entry' | 'pinch' | 'guard' | 'other';
export const starKindOf = (ability: string | null | undefined): StarKind => (!ability ? 'other' : ENTRY.has(ability) ? 'entry' : PINCH[ability] ? 'pinch' : GUARD.has(ability) ? 'guard' : 'other');
const starred = (content: Content, mon: PokemonInstance, kind: StarKind): boolean => !!mon.gn?.includes(STAR) && starKindOf(abilityOf(content, mon)) === kind;
/** A starred pinch ability starts at half HP, not a third. */
export const starPinch = (content: Content, mon: PokemonInstance): boolean => starred(content, mon, 'pinch');
/** A starred guarding ability also blocks one secondary effect per battle. */
export const starGuard = (content: Content, mon: PokemonInstance): boolean => starred(content, mon, 'guard');
/** A starred entry ability triggers a second time the first time it comes back in, each battle. */
export const starEntry = (content: Content, mon: PokemonInstance): boolean => starred(content, mon, 'entry');

const STATS = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'] as const;
/** Champion: the title ("Champion <name>", its name in the game) and the star. "Champion, the second time of asking" for one that lost here last time with the same Pokémon. */
export function onevoneChampion(content: Content, run: RunState): string {
  const mon = entrantOf(run);
  if (!mon) return '';
  const name = mon.care?.nickname || (content.species.get(mon.speciesId)?.name ?? mon.speciesId);
  const again = f(run, 'onevone-again') > 0;
  const title = `Champion ${name}`;
  mon.care = mon.care ? { ...mon.care, nickname: title.slice(0, 24) } : CareSchema.parse({ nickname: title.slice(0, 24) });
  mon.marks = [...(mon.marks ?? []), again ? 'Champion of the 1v1 Championship, the second time of asking' : 'Champion of the 1v1 Championship'].slice(-8);
  const said = again ? `${title}: Champion, the second time of asking.` : `${title}.`;
  if (mon.gn?.includes(STAR)) return said;
  mon.gn = [...(mon.gn ?? []), STAR];
  const kind = starKindOf(abilityOf(content, mon));
  if (kind === 'other') {
    const base = getSpecies(content, mon.speciesId).baseStats;
    const best = STATS.reduce((a, k) => (base[k] > base[a] ? k : a), 'hp' as (typeof STATS)[number]);
    mon.eventBoosts = { ...mon.eventBoosts, [best]: (mon.eventBoosts?.[best] ?? 0) + 5 };
  }
  const ability = content.abilities.get(abilityOf(content, mon) ?? '')?.name ?? 'its ability';
  const how = kind === 'entry' ? 'it triggers again the first time it comes back in, each battle' : kind === 'pinch' ? 'it starts at half HP, not a third' : kind === 'guard' ? 'it also blocks one secondary effect per battle' : 'its best stat, five percent more';
  return `${said} A small star beside ${ability}: ${how}.`;
}
