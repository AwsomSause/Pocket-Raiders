// DOMINION redesign R5: the simple rules behind seven Crew pages the pass-50 mockups drew before the game had them
// (Kice via the coordinator, 2026-11-26: "everything built"). Numbers live in crewPages.json.
//  - Evening off (`downtime`): one member, one place, once every few days: Morale/Loyalty, a little stat growth, Heat.
//  - Storm night (`shelter`): every few evenings a stray turns up at the door; three answers.
//  - Dressing room (`disguise`): outfits for the crew; each kind of outfit worn gives its effect once.
//  - Boss skills (`skills`): one point per Edge point the Boss has earned; three branches learned in order.
//  - Team tag (`graffiti`): pick a symbol, colour and slogan; spraying it on the districts you own (once a week) adds Dread.
//  - Bonds and the card binder are read from what the run already has (squads, shared tasks, personality clashes; who
//    you have met); full binder sets give a small effect.
// No RNG: every outcome is fixed by the state and the choice.

import { crewOf, growStat, rankN, rankWord, withCrew } from './crew';
import { titleWord } from './crewR50';
import { DOMINION_DATA } from './data';
import { addHeat, statusOf } from './field';
import { addFxHook, spend, type HqFx } from './hqFx';
import type { CrewPagesState, DominionBlock, Member, PageFxKey } from './schema';

const P = () => DOMINION_DATA.crewPages;
type Out = { ok: boolean; block: DominionBlock; notice: string | null };
const fail = (block: DominionBlock, notice: string): Out => ({ ok: false, block, notice });
const clamp = (n: number): number => Math.max(0, Math.min(100, n));
const money = (n: number): string => `₽${n.toLocaleString('en-US')}`;

export const freshPages = (): CrewPagesState => ({ off: {}, shelter: 0, outfits: {}, skills: [], tag: null, sprayed: 0 });
export const pagesOf = (b: DominionBlock): CrewPagesState => b.crewPages ?? freshPages();
function withPages(block: DominionBlock): DominionBlock & { crewPages: CrewPagesState } {
  const b = withCrew(block);
  b.crewPages ??= freshPages();
  return b as DominionBlock & { crewPages: CrewPagesState };
}
const hqDistrict = (): string => DOMINION_DATA.field.hq;
function addDread(b: DominionBlock, district: string, n: number): void {
  const d = b.field.districts[district];
  if (d) d.dread += n;
}

// ---------- Evening off ----------

/** Days until the member can take another evening off (0: now). */
export function offIn(b: DominionBlock, memberId: string): number {
  const last = pagesOf(b).off[memberId];
  return last ? Math.max(0, last.day + P().downtime.cooldown - b.day) : 0;
}

export function downtime(block: DominionBlock, memberId: string, placeId: string): Out {
  const place = P().downtime.places.find((p) => p.id === placeId);
  const m0 = block.members.find((m) => m.id === memberId);
  if (!place || !m0) return fail(block, 'Nobody to send.');
  if (block.phase !== 'evening') return fail(block, 'Evenings off start in the Evening.');
  if (crewOf(m0).out) return fail(block, `${m0.name} can’t go out right now.`);
  const wait = offIn(block, memberId);
  if (wait) return fail(block, `${m0.name} had an evening off lately. Again in ${wait} day${wait === 1 ? '' : 's'}.`);
  if (block.funds < place.cost) return fail(block, `Not enough money: ${money(place.cost)}.`);
  const b = withPages(block);
  const m = b.members.find((x) => x.id === memberId)!;
  spend(b, place.cost);
  m.morale = clamp(m.morale + place.morale);
  m.loyalty = clamp(m.loyalty + place.loyalty);
  const lines: string[] = [];
  if (place.stat && place.tenths) growStat(m, place.stat, place.tenths, lines);
  if (place.heat) addHeat(b, hqDistrict(), place.heat);
  b.crewPages.off[m.id] = { day: b.day, place: place.id };
  return { ok: true, block: b, notice: `${m.name} spends the evening at the ${place.name}.` };
}

// ---------- Storm night ----------

/** A storm comes every `every` evenings from day `from`; it waits for an answer until the evening ends. */
export function stormTonight(b: DominionBlock): boolean {
  const s = P().shelter;
  return b.phase === 'evening' && b.day >= s.from && (b.day - s.from) % s.every === 0 && pagesOf(b).shelter !== b.day && b.members.length > 0;
}
/** The stray picks the newest member (the last to join). */
export function strayFriend(b: DominionBlock): Member | null {
  return b.members.reduce<Member | null>((best, m) => (!best || m.joinedDay >= best.joinedDay ? m : best), null);
}

export function shelter(block: DominionBlock, choiceId: string): Out {
  const c = P().shelter.choices.find((x) => x.id === choiceId);
  if (!c || !stormTonight(block)) return fail(block, 'No storm tonight.');
  if (block.funds < c.cost) return fail(block, `Not enough money: ${money(c.cost)}.`);
  const b = withPages(block);
  const m = strayFriend(b)!;
  spend(b, c.cost);
  m.loyalty = clamp(m.loyalty + c.loyalty);
  if (c.morale) for (const x of b.members) x.morale = clamp(x.morale + c.morale);
  if (c.dread) addDread(b, hqDistrict(), c.dread);
  b.crewPages.shelter = b.day;
  return { ok: true, block: b, notice: c.says.replace('{name}', m.name) };
}

// ---------- Dressing room ----------

export const outfitOf = (b: DominionBlock, memberId: string): string => pagesOf(b).outfits[memberId] ?? 'colours';

export function wear(block: DominionBlock, memberId: string, outfitId: string): Out {
  const o = P().outfits.find((x) => x.id === outfitId);
  const m = block.members.find((x) => x.id === memberId);
  if (!o || !m) return fail(block, 'No such outfit.');
  if (outfitOf(block, memberId) === outfitId) return fail(block, `${m.name} is already wearing that.`);
  if (block.funds < o.cost) return fail(block, `Not enough money: ${money(o.cost)}.`);
  const b = withPages(block);
  spend(b, o.cost);
  if (o.id === 'colours') delete b.crewPages.outfits[memberId];
  else b.crewPages.outfits[memberId] = o.id;
  return { ok: true, block: b, notice: o.id === 'colours' ? `${m.name} is back in team colours.` : `${m.name} goes out as a ${o.name}.` };
}

// ---------- Boss skills ----------

/** Edge points the Boss has earned since the start, one skill point each (`perPoint` Edge points per skill point). */
export function skillPoints(b: DominionBlock): { earned: number; spent: number; free: number } {
  const E = DOMINION_DATA.field.edge;
  const gained = Object.values(b.field.edge.stats).reduce((a, n) => a + n, 0) - E.start * 5;
  const earned = Math.max(0, Math.floor(gained / P().skills.perPoint));
  const spent = pagesOf(b).skills.length;
  return { earned, spent, free: Math.max(0, earned - spent) };
}
const nodeOf = (id: string) => {
  for (const br of P().skills.branches) {
    const k = br.nodes.findIndex((n) => n.id === id);
    if (k >= 0) return { br, k, node: br.nodes[k]! };
  }
  return null;
};
/** Why a skill can't be learned now (null: it can). */
export function cantLearn(b: DominionBlock, id: string): string | null {
  const x = nodeOf(id);
  if (!x) return 'No such skill.';
  const got = pagesOf(b).skills;
  if (got.includes(id)) return 'Learned.';
  const need = x.k > 0 ? x.br.nodes[x.k - 1]! : null;
  if (need && !got.includes(need.id)) return `Needs ${need.name}.`;
  if (!skillPoints(b).free) return 'No points left: the Boss earns one per Edge point.';
  return null;
}
export function learn(block: DominionBlock, id: string): Out {
  const why = cantLearn(block, id);
  if (why) return fail(block, why);
  const b = withPages(block);
  b.crewPages.skills.push(id);
  return { ok: true, block: b, notice: `Learned ${nodeOf(id)!.node.name}.` };
}

// ---------- Team tag ----------

/** Days until the tag can be sprayed again (0: now). */
export const sprayIn = (b: DominionBlock): number => {
  const s = pagesOf(b).sprayed;
  return s ? Math.max(0, s + P().graffiti.every - b.day) : 0;
};
export const ownedDistricts = (b: DominionBlock): string[] => Object.entries(b.field.districts).filter(([, d]) => statusOf(d) === 'owned').map(([id]) => id).sort();

export function spray(block: DominionBlock, symbol: string, colour: string, slogan: string): Out {
  const G = P().graffiti;
  if (!G.symbols.some((s) => s.id === symbol) || !/^#[0-9a-f]{6}$/i.test(colour) || !slogan.trim() || slogan.length > 40) return fail(block, 'Pick a symbol, a colour and a slogan.');
  const wait = sprayIn(block);
  if (wait) return fail(block, `The tag went up lately. Again in ${wait} day${wait === 1 ? '' : 's'}.`);
  const where = ownedDistricts(block);
  const cost = where.length * G.costPer;
  if (block.funds < cost) return fail(block, `Not enough money: ${money(cost)} for the paint.`);
  const b = withPages(block);
  b.crewPages.tag = { symbol, colour, slogan: slogan.trim() };
  if (!where.length) return { ok: true, block: b, notice: 'Tag saved. Take a district and it goes up there.' };
  spend(b, cost);
  for (const d of where) {
    addDread(b, d, G.dread);
    if (G.heat) addHeat(b, d, G.heat);
  }
  b.crewPages.sprayed = b.day;
  return { ok: true, block: b, notice: `The tag goes up in ${where.length} district${where.length === 1 ? '' : 's'}: Dread +${G.dread} each.` };
}

// ---------- Bonds (read only) ----------

export interface Bond { a: string; b: string; n: number; kind: 'best' | 'good' | 'clash' }

/** Squad mates share their squad's Cohesion; members on the same task today get on; members whose formed traits are a
 *  personality clash (personality.json `clash`) clash. The strongest reason wins. */
export function bondsOf(b: DominionBlock): Bond[] {
  const B = P().bonds;
  const out: Bond[] = [];
  const ms = b.members;
  const traits = (m: Member): string[] => crewOf(m).formed;
  const clashes = DOMINION_DATA.personality.clash;
  for (let i = 0; i < ms.length; i++) for (let j = i + 1; j < ms.length; j++) {
    const x = ms[i]!, y = ms[j]!;
    let n = 0;
    for (const s of b.squads?.list ?? []) if (s.members.includes(x.id) && s.members.includes(y.id)) n = Math.max(n, s.cohesion);
    const tx = crewOf(x).task, ty = crewOf(y).task;
    if (tx && tx === ty && tx !== 'rest') n = Math.max(n, B.sameTask);
    const ax = traits(x), ay = traits(y);
    const clash = clashes.some(([p, q]) => (ax.includes(p!) && ay.includes(q!)) || (ax.includes(q!) && ay.includes(p!)));
    if (clash && n < B.bestAt) out.push({ a: x.id, b: y.id, n: -1, kind: 'clash' });
    else if (n >= B.bestAt) out.push({ a: x.id, b: y.id, n, kind: 'best' });
    else if (n >= B.squadAt || (n && n === B.sameTask)) out.push({ a: x.id, b: y.id, n, kind: 'good' });
  }
  return out;
}

// ---------- Card binder (read only, plus set bonuses) ----------

export interface BinderCard { id: string; name: string; sub: string; sprite: string; met: boolean; member: number | null; lv: number | null; stars: number }
export interface BinderPage { id: string; title: string; cards: BinderCard[]; set: { label: string; says: string; done: boolean } | null }

const SPRITES: Record<string, string> = { giovanni: 't-gio', archer: 'c-archer', petrel: 't-petrel', proton: 't-proton', red: 't-redbig', blue: 't-blue', silver: 't-silver', ethan: 't-ethan', may: 't-may' };

export function binderOf(b: DominionBlock): BinderPage[] {
  const K = P().binder;
  const set = (id: 'rival-team' | 'law', done: boolean) => {
    const s = K.sets.find((x) => x.id === id);
    return s ? { label: s.label, says: s.says, done } : null;
  };
  const crew: BinderPage = {
    id: 'crew', title: 'Crew', set: null,
    cards: [
      ...b.members.map((m, i) => ({ id: m.id, name: m.name, sub: titleWord(rankWord(m.rank)), sprite: m.look, met: true, member: i, lv: m.level, stars: rankN(m.rank) <= 5 ? 1 : rankN(m.rank) <= 10 ? 2 : 3 })),
      ...(b.crew?.gone ?? []).map((g) => ({ id: g.id, name: g.name, sub: `Gone · ${g.why}`, sprite: '', met: true, member: null, lv: null, stars: 1 })),
    ],
  };
  const rivals = DOMINION_DATA.rivals.teams.filter((t) => t.on).map((t): BinderPage => {
    const stage = b.rivals?.teams[t.id]?.stage ?? 0;
    const cards: BinderCard[] = [
      { id: t.boss.id, name: t.boss.name, sub: `${t.tag} Boss`, sprite: SPRITES[t.boss.id] ?? '', met: stage >= K.bossAt, member: null, lv: null, stars: 2 },
      ...t.admins.map((a) => ({ id: a.id, name: a.name, sub: `${t.tag} Admin`, sprite: SPRITES[a.id] ?? '', met: stage >= K.adminAt, member: null, lv: null, stars: 2 })),
      { id: `${t.id}-grunt`, name: t.grunt.name, sub: `${t.tag} Grunt`, sprite: t.id === 'rocket' ? 't-grunt' : '', met: stage >= K.gruntAt, member: null, lv: null, stars: 1 },
    ];
    return { id: t.id, title: t.name, cards, set: set('rival-team', cards.length > 0 && cards.every((c) => c.met)) };
  });
  const ids = DOMINION_DATA.hero.regions[DOMINION_DATA.rivals.region]?.heroes ?? [];
  const heroes: BinderPage = {
    id: 'heroes', title: 'Heroes', set: null,
    cards: ids.map((id) => {
      const h = DOMINION_DATA.hero.heroes.find((x) => x.id === id);
      return { id, name: h?.name ?? id, sub: 'The Hero', sprite: SPRITES[id] ?? '', met: b.hero?.id === id, member: null, lv: null, stars: 2 };
    }),
  };
  const lawCards = DOMINION_DATA.police.officers.map((o) => ({ id: o.id, name: o.name, sub: o.kind, sprite: o.sprite, met: (b.police?.n ?? 0) > 0 && b.heat >= o.minHeat, member: null, lv: null, stars: 1 }));
  const law: BinderPage = { id: 'law', title: 'Town', cards: lawCards, set: set('law', lawCards.length > 0 && lawCards.every((c) => c.met)) };
  return [crew, ...rivals, heroes, law];
}

// ---------- What it all adds (outfits, skills, binder sets) ----------

function add(out: HqFx, k: PageFxKey, n: number): void {
  (out as unknown as Record<PageFxKey, number>)[k] += n;
}
addFxHook((b, out) => {
  const st = b.crewPages;
  if (st) {
    // Each kind of outfit counts once, however many wear it.
    for (const id of new Set(b.members.map((m) => st.outfits[m.id]).filter((x): x is string => !!x))) {
      const o = P().outfits.find((x) => x.id === id);
      if (o?.fx) add(out, o.fx, o.n);
    }
    for (const id of st.skills) {
      const x = nodeOf(id);
      if (x) add(out, x.node.fx, x.node.n);
    }
  }
  for (const pg of binderOf(b)) {
    if (!pg.set?.done) continue;
    const s = P().binder.sets.find((x) => x.label === pg.set!.label);
    if (s) add(out, s.fx, s.n);
  }
});
