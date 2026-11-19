// DOMINION slice D19, personality cards (Claude API draft §5.3 A; mockup a3). Every crew member, enemy grunt and
// applicant gets a card the first time the game needs it: two traits from a fixed list, a speech quirk, a want, a fear
// and a home town. The card is rolled from the run seed and the person's name on its own stream (`dominion-card`), so
// the same person always gets the same card and no other roll moves. Bosses use their canon sheet instead.
// The card is game data: offline lines read it (voice, cardLine) and its traits are live rules (crew.ts modsOf and
// cardRules.ts). Rotom only ever voices it (cardPrompt is the character sheet a Rotom call starts with).
// Pure; never imports crew.ts (crew.ts reads this file).

import { hashSeed, Rng } from '../rng';
import { DOMINION_DATA } from './data';
import type { Card, DominionBlock, LineKind, MemberCrew, Quirk } from './schema';

const P = () => DOMINION_DATA.personality;

export type Trait = ReturnType<typeof P>['traits'][number];
export const traitById = (id: string): Trait | undefined => P().traits.find((t) => t.id === id);

/** The run's region, for home towns (Kanto until the Crossing slices). */
const regionKey = (): string => DOMINION_DATA.start.start.region.toLowerCase();

/** Rolls the card for `who` (a person's name, unique in a run). Same seed + name = same card. */
export function rollCard(seed: string, who: string, region = regionKey()): Card {
  const r = new Rng(hashSeed([seed, 'dominion-card', who].join('::')));
  const p = P();
  const first = r.pick(p.traits);
  const clash = (a: string, b: string) => a === b || p.clash.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
  const second = r.pick(p.traits.filter((t) => !clash(first.id, t.id)));
  const towns = p.towns[region] ?? p.towns.kanto!;
  return { t: [first.id, second.id], q: r.pick(p.quirks).id, w: r.pick(p.wants), f: r.pick(p.fears), h: r.pick(towns) };
}

/** A canon Boss's card (their sheet in personality.json), or null if there is no sheet. */
export function canonCard(id: string): Card | null {
  return P().canon[id] ? { canon: id } : null;
}

export interface Sheet {
  traits: Trait[];
  quirk: Quirk;
  want: string;
  fear: string;
  home: string;
  canon: { id: string; name: string; team: string } | null;
}

/** The card with every id looked up. A trait or quirk id no longer in the data falls back to the first (never throws). */
export function sheet(card: Card): Sheet {
  const p = P();
  if ('canon' in card) {
    const c = p.canon[card.canon]!;
    return { traits: c.traits.map((t) => traitById(t) ?? p.traits[0]!), quirk: c.quirk, want: c.want, fear: c.fear, home: c.home, canon: { id: card.canon, name: c.name, team: c.team } };
  }
  return {
    traits: card.t.map((t) => traitById(t) ?? p.traits[0]!),
    quirk: p.quirks.find((q) => q.id === card.q) ?? p.quirks[0]!,
    want: card.w, fear: card.f, home: card.h, canon: null,
  };
}

/** "Greedy · Joker". */
export const traitWords = (card: Card): string => sheet(card).traits.map((t) => t.name).join(' · ');

/** A plain line said with the quirk. */
export function voice(q: Quirk, line: string): string {
  let s = line;
  if (q.swap) s = s.split(q.swap[0]).join(q.swap[1]);
  // After a comma the line goes on in lower case ("Listen, job's done"), but "I" stays "I".
  if (q.pre) s = q.pre + (q.pre.trimEnd().endsWith(',') && !/^I\b/.test(s) ? s[0]!.toLowerCase() : s[0]!) + s.slice(1);
  if (q.end) s = `${s} ${q.end}`;
  if (q.upper) s = s.toUpperCase();
  return s;
}

/** What the member's last night was, as a line kind. */
export function lineKind(last: MemberCrew['last'] | 'pay'): LineKind {
  if (last === 'pay') return 'pay';
  if (last === 'success' || last === 'big') return 'done';
  if (last === 'fail' || last === 'refused' || last === 'skipped' || last === 'wandered') return 'fail';
  if (last === 'caught' || last === 'arrested') return 'scared';
  return 'hello';
}

/** An offline line from the card: the traits take turns by day, the quirk colours it. */
export function cardLine(card: Card, kind: LineKind, day: number): string {
  const s = sheet(card);
  const t = s.traits[day % 2]!;
  const bank = P().lines[t.id]?.[kind] ?? P().lines[s.traits[0]!.id]![kind];
  return voice(s.quirk, bank[Math.floor(day / 2) % bank.length]!);
}

/** The card a person has: the stored one, or the one they will get (same roll). */
export function cardFor(seed: string, who: { name: string; crew?: MemberCrew | undefined }): Card {
  return who.crew?.card ?? rollCard(seed, who.name);
}

/** Gives every member without a card theirs. Changes `block` in place; returns it. */
export function fillCards(block: DominionBlock, seed: string): DominionBlock {
  for (const m of block.members) if (m.crew && !m.crew.card) m.crew.card = rollCard(seed, m.name);
  return block;
}

/** The character sheet a Rotom call starts with (the same text every time for the same person, so it caches). */
export function cardPrompt(name: string, role: string, card: Card): string {
  const s = sheet(card);
  return [
    `Character: ${s.canon?.name ?? name}, ${s.canon ? `Boss of ${s.canon.team}` : role}.`,
    `Traits: ${s.traits.map((t) => `${t.name} (${t.effects.map((e) => e.text).join('; ')})`).join(', ')}.`,
    `Speech quirk: ${s.quirk.text}.`,
    `Wants: ${s.want}. Fears: ${s.fear}. Home town: ${s.home}.`,
  ].join('\n');
}
