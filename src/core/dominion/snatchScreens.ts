// DOMINION slice D23: plain data for the Holding Cell's questioning room (Rotom mockup a7, round 4 #k7). The view in
// ui/redux/screens/dominion/snatch.ts only draws what this hands it.

import { DOMINION_DATA } from './data';
import { wanted } from './field';
import { sheet } from './personality';
import { checkRisk, inRoom, multOf, pipsOf, prizeLabel, prizesOf, recruitOdds, talkOdds } from './snatch';
import { APPROACHES, type Approach, type DominionBlock, type SnatchEnd, type SnatchGoal } from './schema';
import { fill } from './worldTurn';

const D = () => DOMINION_DATA.snatch;

export interface RoomModel {
  n: number;
  title: string;
  name: string;
  sprite: string;
  phase: 'goal' | 'talk' | 'end';
  resolve: number;
  start: number;
  /** The last line's Resolve change (positive = broke that much; negative = they dug in). */
  hit: number;
  goal: SnatchGoal | null;
  goals: { id: SnatchGoal; label: string; sub: string; on: boolean }[];
  traits: { name: string; tone: string }[];
  blurb: string;
  pips: { approach: Approach; label: string; n: number; key: string; tone: string }[];
  /** −100 fear … +100 trust; the gauge's needle angle in degrees (−90 … +90). */
  needle: number;
  angle: number;
  exchange: { said: string; approach: string; tone: string; strength: number; hit: number; fear: number } | null;
  reply: string;
  chip: string;
  rotom: boolean;
  banner: { title: string; sub: string } | null;
  ends: { how: SnatchEnd; label: string; sub: string; key: string; tone: string }[];
  heat: number;
  risk: number;
  turn: number;
  turns: number;
  got: number;
}

const GOAL_SUBS: Record<SnatchGoal, string> = { info: '', extortion: '₽, a favour, silence, a site' };

/** "Folds to threats and bribes. Logic barely moves them." from the multipliers. */
function blurbOf(ms: { a: Approach; m: number }[]): string {
  const name = (a: Approach): string => D().approaches[a].label.toLowerCase();
  const and = (xs: string[]): string => (xs.length > 1 ? `${xs.slice(0, -1).join(', ')} and ${xs.at(-1)}` : xs[0] ?? '');
  const strong = ms.filter((x) => pipsOf(x.m) >= 4).map((x) => name(x.a));
  const weak = ms.filter((x) => pipsOf(x.m) <= 1).map((x) => name(x.a));
  const s1 = strong.length ? `Folds to ${and(strong)}.` : 'Nothing breaks them easily.';
  const s2 = weak.length ? ` ${and(weak).replace(/^./, (c) => c.toUpperCase())} barely ${weak.length > 1 ? 'move' : 'moves'} them.` : '';
  return s1 + s2;
}

export function roomModel(b: DominionBlock): RoomModel | null {
  const c = inRoom(b);
  if (!c) return null;
  const sh = sheet(c.card);
  const last = c.turns.at(-1) ?? null;
  const ms = APPROACHES.map((a) => ({ a, m: multOf(c, a) }));
  const goalSub = (g: SnatchGoal): string => {
    if (g === 'extortion') return GOAL_SUBS.extortion;
    const next = prizesOf(c, 'info')[Math.min(c.goal === 'info' ? c.got : 0, 2)]!;
    return prizeLabel(c, next);
  };
  const lastPrize = [...c.turns].reverse().find((t) => t.prize)?.prize ?? null;
  const prize = lastPrize ?? (c.got > 0 && c.goal ? prizeLabel(c, prizesOf(c, c.goal)[c.got - 1]!) : null);
  const L = D().lines;
  return {
    n: c.n,
    title: `${c.name}, ${c.title}`,
    name: c.name,
    sprite: c.sprite,
    phase: c.phase,
    resolve: c.resolve,
    start: c.start,
    hit: last?.hit ?? 0,
    goal: c.goal,
    goals: (['info', 'extortion'] as const).map((g) => ({ id: g, label: g === 'info' ? 'INFO' : 'EXTORTION', sub: goalSub(g), on: c.goal ? c.goal === g : g === 'info' })),
    traits: sh.traits.map((t) => ({ name: t.name, tone: t.tone })),
    blurb: blurbOf(ms),
    pips: ms.map(({ a, m }, i) => ({ approach: a, label: D().approaches[a].label, n: pipsOf(m), key: String(i + 1), tone: D().approaches[a].tone })),
    needle: c.needle,
    angle: Math.round((c.needle / 100) * 90),
    exchange: last ? { said: last.text, approach: D().approaches[last.approach].label.toUpperCase(), tone: D().approaches[last.approach].tone, strength: last.strength, hit: last.hit, fear: last.fear } : null,
    reply: last ? last.reply : c.needle < 0 ? L.startFear ?? '' : L.start ?? '',
    chip: last ? fill(last.rotom ? L.chipOn! : L.chipOff!, { approach: last.approach, n: last.strength }) : '',
    rotom: !!last?.rotom,
    banner: prize ? { title: c.goal === 'extortion' ? 'LEVERAGE GAINED' : 'INFO UNLOCKED', sub: prize } : null,
    ends: [
      { how: 'release', label: 'Release', sub: `Heat +${D().release.heat} · may talk (${talkOdds(c)}%)`, key: '1', tone: '#43cf78' },
      { how: 'recruit', label: 'Recruit', sub: `Charm check · ${recruitOdds(b, c)}%`, key: '2', tone: '#a678ff' },
      { how: 'ransom', label: 'Ransom', sub: `₽${c.ransom.toLocaleString('en-US')} from ${c.payer}`, key: '3', tone: '#ffb238' },
    ],
    heat: wanted(b.field),
    risk: checkRisk(b),
    turn: c.turns.length,
    turns: D().turns,
    got: c.got,
  };
}
