// Greenneedle gn.21–gn.30 follow-ups (docs GREENNEEDLE_REWORKED_PLACED_5.md and _6.md): the small rules those ten events need
// beyond their text. No Phaser, no rolls: everything here follows from the run's flags and the party.
import type { Content } from '../contentSchema';
import type { BattleState, PokemonInstance, RunState } from '../state';
import { addLevels, calcStats, getSpecies } from '../pokemon';
import { calcDamage, typeEffectiveness } from '../battle/damage';
import { guestGrudge, isGuest, isTempAlly } from '../battle/guests';
import { runLevelCap } from '../regions';
import { eggMoveOptions, familyId } from '../mastery';

const flagOf = (run: Pick<RunState, 'story'>, k: string): number => Number(run.story.flags[`ev:${k}`] ?? 0);
const nameOf = (content: Content, mon: PokemonInstance): string => mon.care?.nickname || getSpecies(content, mon.speciesId).name;

/** Everyone the player owns or is about to (a Pokémon that "wants to join" waits in `pending` until it is accepted). */
function owned(run: RunState): PokemonInstance[] {
  const waiting = run.pending.flatMap((p) => (p.kind === 'caught' ? [p.mon] : []));
  return [...run.party, ...run.box, ...waiting];
}

/**
 * gn.23 "Level: 4 levels higher at each appearance". The notched Magikarp's level is kept in a run flag (`stampLevel` at the
 * first appearance, +4 at each later one). When it joins, it is raised to that level (never past the run's level cap).
 */
export function raiseMarked(content: Content, run: RunState, mark: string, levelFlag: string): string {
  const mon = owned(run).find((m) => m.gn?.includes(mark));
  const want = Math.min(runLevelCap(content, run), flagOf(run, levelFlag));
  if (!mon || want <= mon.level) return '';
  addLevels(content, mon, want - mon.level, runLevelCap(content, run));
  return `${nameOf(content, mon)} has grown with every jump: level ${mon.level}.`;
}

/** gn.24: an egg move of its line that it doesn't know (Rosabel's "move it used to know", when its level-up list has dropped nothing). */
export function oldEggMove(content: Content, mon: PokemonInstance): string | undefined {
  return eggMoveOptions(content, familyId(content, mon.speciesId)).find((o) => o.active && !mon.moves.some((m) => m.id === o.id) && content.moves.has(o.id))?.id;
}

// ---------- gn.30: pink is a colour that fades ----------
/** The history marks of a pink Pokémon, strongest first. Shade 0 is fresh from the island; after the last one the colour is gone. */
export const PINK_MARKS = ['pink from the island fruit', 'pale pink, the colour going', 'the faintest pink, nearly gone'] as const;
/** Tints for the sprite (multiplied over its own colours), by shade. */
const PINK_TINTS = [0xff9ec8, 0xffc4dd, 0xffe3ee] as const;

/** Which shade of pink this Pokémon is (0 strongest), or -1 when it is not pink. */
export function pinkShade(mon: Pick<PokemonInstance, 'marks'>): number {
  return PINK_MARKS.findIndex((m) => mon.marks?.includes(m));
}

/** The colour the screens multiply over a pink Pokémon's sprite (null: not pink). Cosmetic only. */
export function pinkTint(mon: Pick<PokemonInstance, 'marks'>): number | null {
  const shade = pinkShade(mon);
  return shade < 0 ? null : PINK_TINTS[shade]!;
}

/** A foe met on the Island of Pink Pokémon (any `gn-30-` fight) is an islander: pink, like everything that eats the fruit. */
export function islanderTint(eventId: string | undefined): number | null {
  return eventId?.startsWith('gn-30-') ? PINK_TINTS[0] : null;
}

/** gn.28 "with Bond +1 already": the Pokémon that joined last (a catch still waiting to be accepted first) gains `amount` friendship. */
export function bondNewest(content: Content, run: RunState, amount: number): string {
  const waiting = run.pending.flatMap((p) => (p.kind === 'caught' ? [p.mon] : []));
  const mon = waiting[waiting.length - 1] ?? run.party[run.party.length - 1];
  if (!mon) return '';
  mon.friendship = Math.min(content.balance.friendship.max, mon.friendship + amount);
  return `${nameOf(content, mon)} already knows your voice.`;
}

/** The Pokémon picked on the choice (else the lead) eats the fruit for a day: it carries the pink mark. */
export function markPink(content: Content, run: RunState, pickedUid: string | undefined): string {
  const mon = run.party.find((m) => m.uid === pickedUid) ?? run.party.find((m) => m.hp > 0) ?? run.party[0];
  if (!mon) return '';
  mon.marks = [...(mon.marks ?? []).filter((m) => !(PINK_MARKS as readonly string[]).includes(m)), PINK_MARKS[0]].slice(-8);
  return `${nameOf(content, mon)}: ${PINK_MARKS[0]}`;
}

/** A region of mainland food and no fruit: every pink Pokémon loses a shade. After the third, the colour is gone. */
export function pinkFade(content: Content, run: RunState): string {
  const lines: string[] = [];
  for (const mon of owned(run)) {
    const shade = pinkShade(mon);
    if (shade < 0) continue;
    const next = PINK_MARKS[shade + 1];
    mon.marks = [...(mon.marks ?? []).filter((m) => m !== PINK_MARKS[shade]), ...(next ? [next] : [])];
    lines.push(next ? `${nameOf(content, mon)}: ${next}` : `${nameOf(content, mon)} is its own colour again.`);
  }
  return lines.join('\n');
}

/** True while the player owns a Pokémon that is still pink (the fading scene has someone to be about). */
export const hasPink = (run: RunState): boolean => owned(run).some((m) => pinkShade(m) >= 0);

// ---------- gn.25: the pack fight. The pair cover each other. ----------
// One double battle against six Mightyena. The Zangoose stands beside you (the fight's ally) and the Seviper waits right behind,
// in your party for this fight only (mark `truce-guest`). The field has two places a side, so the pair take turns in theirs.

export const TRUCE_GUEST = 'truce-guest';
const COVER = 'truce-cover:';
const AVENGE = 'truce-avenge:';

const isPair = (battle: Pick<BattleState, 'loaner' | 'guests'>, mon: PokemonInstance): boolean => isTempAlly(battle, mon.uid) || !!mon.gn?.includes(TRUCE_GUEST);
/** The other one of the pair, if it can still fight. */
function partnerOf(battle: Pick<BattleState, 'loaner' | 'guests'>, party: readonly PokemonInstance[], mon: PokemonInstance): PokemonInstance | undefined {
  return party.find((m) => m !== mon && m.hp > 0 && isPair(battle, m));
}
const truceOn = (battle: Pick<BattleState, 'eventRule'>): boolean => battle.eventRule?.gn === 'truce';

/**
 * "When one's below a third, the other stands in front (it takes the next hit)." Called before a foe's damaging move lands on one
 * of the pair: returns the partner's name when it steps in (the hit is not taken), once a fight for each of the two.
 */
export function truceCover(content: Content, battle: BattleState, party: readonly PokemonInstance[], target: PokemonInstance, hit?: { user: PokemonInstance; moveId: string }): string {
  if (!truceOn(battle) || !isPair(battle, target) || target.hp <= 0) return '';
  if (target.hp * 3 >= calcStats(content, target).hp || battle.storyEffects.includes(`${COVER}${target.uid}`)) return '';
  const partner = partnerOf(battle, party, target);
  if (!partner) return '';
  battle.storyEffects.push(`${COVER}${target.uid}`);
  // On the field (an ally the game plays), the one in front really takes the hit: the move's damage against its own type and
  // stats (an average roll, no critical hit). It is left standing on 1 HP at worst: stepping in never knocks it out by itself.
  const move = hit ? content.moves.get(hit.moveId) : undefined;
  if (hit && move && (move.power ?? 0) > 0 && isGuest(battle, partner.uid)) {
    const mine = calcStats(content, partner);
    const theirs = calcStats(content, hit.user);
    const physical = move.category === 'physical';
    const damage = calcDamage(content.ruleset, {
      level: hit.user.level, power: move.power ?? 0, attack: physical ? theirs.atk : theirs.spa, defense: physical ? mine.def : mine.spd, attackStage: 0, defenseStage: 0,
      stab: getSpecies(content, hit.user.speciesId).types.includes(move.type), effectiveness: typeEffectiveness(content.typeChart, move.type, getSpecies(content, partner.speciesId).types), crit: false, burned: false, physical, randomFactor: 100,
    });
    partner.hp = Math.max(1, partner.hp - Math.max(0, damage));
  }
  return getSpecies(content, partner.speciesId).name;
}

/** "When one's hit hard": a foe's move took a third or more of one of the pair's HP. The partner will answer it (truceAnswers). */
export function truceHurt(content: Content, battle: BattleState, party: readonly PokemonInstance[], foeUid: string, target: PokemonInstance, damage: number): void {
  if (!truceOn(battle) || !isPair(battle, target) || damage * 3 < calcStats(content, target).hp) return;
  const partner = partnerOf(battle, party, target);
  if (!partner) return;
  // The pair stand on the field and the game plays them: the partner's next real move goes at that foe (battle/doubles.ts).
  if (isGuest(battle, partner.uid)) return guestGrudge(battle, partner.uid, foeUid);
  const tag = `${AVENGE}${foeUid}:${target.uid}`;
  if (!battle.storyEffects.includes(tag)) battle.storyEffects.push(tag);
}

/**
 * "...the other uses its next move on whatever did it." After the turn, the partner strikes each foe that hit its friend hard: its
 * best damaging move through the game's damage formula (its own stats, the foe's type and stats, an average roll). It never
 * takes the last HP: the knock-out is the player's.
 */
export function truceAnswers(content: Content, battle: BattleState, party: readonly PokemonInstance[]): string[] {
  // (With the pair on the field as allies the game plays, the answer is the partner's own next move: truceHurt.)
  if (!truceOn(battle)) return [];
  const lines: string[] = [];
  for (const tag of battle.storyEffects.filter((t) => t.startsWith(AVENGE))) {
    battle.storyEffects.splice(battle.storyEffects.indexOf(tag), 1);
    const [foeUid, hurtUid] = tag.slice(AVENGE.length).split(':');
    const hurt = party.find((m) => m.uid === hurtUid);
    const foe = battle.enemyTeam.find((m) => m.uid === foeUid);
    const partner = hurt ? partnerOf(battle, party, hurt) : undefined;
    if (!hurt || !partner || !foe || foe.hp <= 1 || battle.outcome) continue;
    const mine = calcStats(content, partner);
    const theirs = calcStats(content, foe);
    const foeTypes = getSpecies(content, foe.speciesId).types;
    const best = partner.moves
      .map((m) => content.moves.get(m.id))
      .filter((m): m is NonNullable<typeof m> => !!m && m.category !== 'status' && (m.power ?? 0) > 0)
      .map((move) => {
        const physical = move.category === 'physical';
        const effectiveness = typeEffectiveness(content.typeChart, move.type, foeTypes);
        const damage = calcDamage(content.ruleset, {
          level: partner.level, power: move.power ?? 0, attack: physical ? mine.atk : mine.spa, defense: physical ? theirs.def : theirs.spd, attackStage: 0, defenseStage: 0,
          stab: getSpecies(content, partner.speciesId).types.includes(move.type), effectiveness, crit: false, burned: false, physical, randomFactor: 100,
        });
        return { move, damage };
      })
      .sort((a, b) => b.damage - a.damage || a.move.id.localeCompare(b.move.id))[0];
    if (!best || best.damage <= 0) continue;
    foe.hp = Math.max(1, foe.hp - best.damage);
    lines.push(`${getSpecies(content, partner.speciesId).name} goes straight for the ${getSpecies(content, foe.speciesId).name} that hurt ${getSpecies(content, hurt.speciesId).name}: ${best.move.name}.`);
  }
  return lines;
}
