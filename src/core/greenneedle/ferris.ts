// Greenneedle gn.59, The Former Champion (doc GREENNEEDLE_REWORKED_PLACED_13.md lines 9–108).
// Old Ferris Hawthorne, a retired Champion who travels: one meeting a region, a story and a piece of advice that pays off in that
// same region, an optional battle (five Pokémon, no items, no switching), and in the last region the request. Pure rules: no RNG.
import type { Content } from '../contentSchema';
import type { BattleState, RunState } from '../state';
import { calcStats, maxHp } from '../pokemon';
import { changeFriendship } from '../friendship';

type Cue = { type: 'spectacle'; kind: 'arena'; side: 'player' | 'enemy'; text: string; uid?: string };
const cue = (side: 'player' | 'enemy', text: string, uid?: string): Cue => ({ type: 'spectacle', kind: 'arena', side, text, ...(uid ? { uid } : {}) });

const f = (run: Pick<RunState, 'story'>, k: string): number => Number(run.story.flags[`ev:${k}`] ?? 0);
const set = (run: Pick<RunState, 'story'>, k: string, n: number): void => {
  run.story.flags[`ev:${k}`] = n;
};

/** Ferris's five (the sixth clip is empty), in the order of the doc's table. */
export const FERRIS_FIVE = ['arcanine', 'noctowl', 'tyranitar', 'lanturn', 'clefable'] as const;
/** The most common first-route Pokémon of the region the run began in. */
export const FIRST_CATCH: Record<string, string> = { kanto: 'rattata', johto: 'sentret', hoenn: 'zigzagoon', sinnoh: 'bidoof', unova: 'lillipup', kalos: 'bunnelby', alola: 'yungoos', galar: 'skwovet', paldea: 'lechonk' };
/** A tutor move from each of the five (the prize for beating them), and the old move one of them brings when it goes on travelling. */
export const TUTOR_MOVES = { arcanine: 'flare-blitz', noctowl: 'air-slash', tyranitar: 'rock-slide', lanturn: 'surf', clefable: 'moonblast' } as const;
export const OLD_MOVES = { arcanine: 'inferno', noctowl: 'razor-wind', tyranitar: 'submission', lanturn: 'zap-cannon', clefable: 'teeter-dance' } as const;

/** Which region of the run this is (1 = the first), and the story for it (the sixth and on share the last). */
export const regionNo = (run: Pick<RunState, 'regionIndex'>): number => run.regionIndex + 1;
export const lastRegion = (run: Pick<RunState, 'regionIndex' | 'regionOrder'>): boolean => run.regionIndex >= run.regionOrder.length - 1;

const castFlag = (run: RunState, name: string, id: string): void => {
  for (const k of Object.keys(run.story.flags)) if (k.startsWith(`ev:cast-${name}:`)) delete run.story.flags[k];
  run.story.flags[`ev:cast-${name}:${id}`] = 1;
};

/** Sits at the fire: counts the meeting, picks this region's story and advice, and casts the first Pokémon they ever lost. */
export function ferrisArrive(content: Content, run: RunState): string {
  const no = Math.min(regionNo(run), 6);
  set(run, 'ferris-meetings', f(run, 'ferris-meetings') + 1);
  set(run, 'ferris-story', no - 1);
  set(run, `ferris-advice-${no}`, 1);
  set(run, 'ferris-last', lastRegion(run) ? 1 : 0);
  const first = FIRST_CATCH[run.regionOrder[0] ?? 'kanto'] ?? 'rattata';
  castFlag(run, 'ferris-first', content.species.has(first) ? first : 'rattata');
  return '';
}

/** After the battle: the one of the five that you faced longest is the one you "battled best against". */
export function ferrisBest(run: RunState): string {
  let best = 0;
  let most = 0;
  FERRIS_FIVE.forEach((id, i) => {
    const n = f(run, `ferris-t-${id}`);
    if (n > most) {
      most = n;
      best = i + 1;
    }
  });
  set(run, 'ferris-best', best);
  castFlag(run, 'ferris-best', FERRIS_FIVE[(best || 3) - 1]!);
  return '';
}

/** The Ball goes to Ferris: the Pokémon you just caught leaves your party (or box) with it. */
export function ferrisHand(content: Content, run: RunState): string {
  const id = Object.keys(run.story.flags).find((k) => k.startsWith('ev:cast-ferris-first:'))?.slice('ev:cast-ferris-first:'.length);
  if (!id) return '';
  const all = [...run.party.map((m, i) => ({ m, where: 'party' as const, i })), ...run.box.map((m, i) => ({ m, where: 'box' as const, i }))].filter((x) => x.m.speciesId === id);
  const last = all.sort((a, b) => b.m.uid.localeCompare(a.m.uid, undefined, { numeric: true }))[0];
  if (!last || (last.where === 'party' && run.party.length <= 1)) return '';
  if (last.where === 'party') run.party.splice(last.i, 1);
  else run.box.splice(last.i, 1);
  set(run, 'ferris-handed', 1);
  return `Gave it to Ferris: ${content.species.get(id)?.name ?? id}`;
}

// ---------- the advice, paid off in the same region ----------
/** Advice `n` was given this region and has not been spent. */
const live = (run: RunState, n: number): boolean => regionNo(run) === n && f(run, `ferris-advice-${n}`) > 0 && f(run, `ferris-advice-${n}-used`) === 0;

/** At a new fight with a boss (run.ts, where the node is known): the Gym Leader's feet (1st region) and the hardest battle (4th). */
export function ferrisBossMark(run: RunState, role: string): void {
  const b = run.battle;
  if (!b) return;
  if (role === 'gym' && live(run, 1)) b.storyEffects.push('ferris-feet');
  if (role === 'champion' && live(run, 4)) b.storyEffects.push('ferris-free');
}

/** 4th region: "Win as if nobody's watching. Lose the same way." The marked battle, if lost, costs nothing. */
export const ferrisFree = (battle: Pick<BattleState, 'storyEffects'>): boolean => battle.storyEffects.includes('ferris-free');
export function ferrisFreeEnd(run: RunState): void {
  set(run, 'ferris-advice-4-used', 1);
}

/** 3rd region: "The ones that bite are the ones that stay." A wild Pokémon that attacks first (it outruns your lead) is caught at double the chance. */
export function ferrisCatch(content: Content, run: RunState, battle: BattleState): number {
  // One Pokémon, once: the advice is spent when the first of them is caught.
  if (regionNo(run) !== 3 || f(run, 'ferris-advice-3') === 0 || f(run, 'ferris-advice-3-used') > 0 || battle.kind !== 'wild' || battle.trainer) return 1;
  const foe = battle.enemyTeam[battle.enemyIndex];
  const lead = run.party[battle.activeIndex];
  if (!foe || !lead) return 1;
  return calcStats(content, foe).spe > calcStats(content, lead).spe ? 2 : 1;
}

const WAITS = 'gn-foe-waits:';
const tally = (b: BattleState, k: string): number => b.storyEffects.filter((s) => s === k).length;

/** Ferris's five each fight the way the table says (before each turn: a line, a wait, a boost or a heal). */
function ferrisStyle(content: Content, run: RunState, b: BattleState): Cue[] {
  const foe = b.enemyTeam[b.enemyIndex];
  if (!foe || foe.hp <= 0) return [];
  const max = maxHp(content, foe);
  const mine = run.party[b.activeIndex];
  const out: Cue[] = [];
  switch (foe.speciesId) {
    case 'arcanine': {
      // Lies down in battle: every other turn it rests (a little HP back). Still wins: it starts with +1 Attack.
      const turns = tally(b, 'ferris-arc');
      b.storyEffects.push('ferris-arc');
      if (turns === 0) b.enemyStages.atk = Math.min(6, b.enemyStages.atk + 1);
      if (turns % 2 === 1) {
        foe.hp = Math.min(max, foe.hp + Math.floor(max / 8));
        b.storyEffects.push(`${WAITS}The grey-muzzled Arcanine lies down, chin on its paws, and gets some of its breath back. It never stops watching you.`);
      }
      break;
    }
    case 'tyranitar':
      // Gentle with children: it won't strike a Pokémon that is nearly down. It sits, and waits.
      if (mine && mine.hp > 0 && mine.hp * 4 <= maxHp(content, mine)) b.storyEffects.push(`${WAITS}The Tyranitar looks at yours, hurt and small. It sits down, very carefully, and waits.`);
      break;
    case 'lanturn':
      // Its light has gone dim, but it flares once, when it matters.
      if (foe.hp * 2 <= max && !b.storyEffects.includes('ferris-lan')) {
        b.storyEffects.push('ferris-lan');
        b.enemyStages.spa = Math.min(6, b.enemyStages.spa + 1);
        out.push(cue('enemy', 'The Lanturn\'s dim light flares, once, the way it did for three ships. Its Sp. Atk rises.', foe.uid));
      }
      break;
    case 'clefable':
      // Has opinions about tea: once, hurt, it stops for a cup.
      if (foe.hp * 2 <= max && !b.storyEffects.includes('ferris-tea')) {
        b.storyEffects.push('ferris-tea');
        foe.hp = Math.min(max, foe.hp + Math.floor(max / 4));
        b.storyEffects.push(`${WAITS}The Clefable pauses, in the middle of everything, for tea. It has opinions about the tea. It feels better.`);
      }
      break;
    default:
  }
  return out;
}

/** The Gym Leader's heel: the next turn they switch. A right call (yes) hits what arrives. Used by the engine. */
export function ferrisPredicted(content: Content, battle: BattleState): string | null {
  const incoming = battle.enemyTeam[battle.enemyIndex];
  if (!battle.storyEffects.includes('ferris-pred:yes') || !incoming || incoming.hp <= 0) return null;
  incoming.hp = Math.max(1, incoming.hp - Math.floor(maxHp(content, incoming) * 0.25));
  return 'You called it. Your Pokémon was already moving, and what arrives takes the hit.';
}

/** At the end of each turn: the 1st region's feet (a tell, and the question), the 5th region's look, and which of Ferris's five you faced longest. */
export function ferrisTurn(content: Content, run: RunState): Cue[] {
  const b = run.battle;
  if (!b) return [];
  const out: Cue[] = [];
  const foe = b.enemyTeam[b.enemyIndex];
  if (b.eventRule?.gn === 'ferris' && foe && foe.hp > 0 && (FERRIS_FIVE as readonly string[]).includes(foe.speciesId)) set(run, `ferris-t-${foe.speciesId}`, f(run, `ferris-t-${foe.speciesId}`) + 1);
  // 3rd region: the double chance was used when something that bit first was caught.
  if (b.outcome === 'caught' && ferrisCatch(content, run, b) === 2) set(run, 'ferris-advice-3-used', 1);
  // 1st region: after the first full turn the Leader's weight shifts onto the back foot. You were watching: you are asked, once, if they will switch.
  const spare = b.enemyTeam.some((m, i) => i !== b.enemyIndex && m.hp > 0);
  if (b.storyEffects.includes('ferris-feet') && !b.storyEffects.includes('ferris-feet-done') && !b.outcome && b.enemySwitches === 0 && foe && foe.hp > 0 && spare) {
    b.storyEffects.push('ferris-feet-done', 'ferris-ask', 'ferris-tell');
    set(run, 'ferris-advice-1-used', 1);
    out.push(cue('enemy', 'Their weight shifts onto the back foot. You were watching their feet, not their face.', foe.uid));
  }
  // 5th region: a Pokémon at low HP gives a look, once.
  const mine = run.party[b.activeIndex];
  if (live(run, 5) && mine && mine.hp > 0 && mine.hp * 4 <= maxHp(content, mine) && !b.storyEffects.some((s) => s.startsWith('ferris-look:'))) {
    b.storyEffects.push(`ferris-look:${mine.uid}`);
    out.push(cue('player', 'Your Pokémon looks back at you. Just for a moment. *Know when it\'s asking you to stop.*', mine.uid));
  }
  return out;
}

/** Before a command is played: Ferris's styles; switching out the Pokémon that gave the look (5th region) is Bond +2. */
export function ferrisShape(content: Content, run: RunState, action: { kind: string }): Cue[] {
  const b = run.battle;
  const mine = b ? run.party[b.activeIndex] : undefined;
  if (!b || action.kind === 'predict') return [];
  const out = b.eventRule?.gn === 'ferris' && !b.needsSwitch ? ferrisStyle(content, run, b) : [];
  if (!mine || action.kind !== 'switch' || !b.storyEffects.includes(`ferris-look:${mine.uid}`) || !live(run, 5)) return out;
  set(run, 'ferris-advice-5-used', 1);
  changeFriendship(content, mine, 10);
  return [...out, cue('player', 'You pull it out. It leans into your hand on the way past. Bond +2.', mine.uid)];
}

/** gn rule `ferris`: they don't use items, and they don't switch. */
export function ferrisStart(battle: BattleState): void {
  battle.enemySwitches = 99;
  battle.enemyItemsUsed = 99;
  battle.trainerKit = { cure: 0, boost: 0, restore: 0, boostStat: 'atk' };
  // Noctowl never misses with the eye that's left.
  battle.storyEffects.push('ferris-eye');
}
