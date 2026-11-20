// DOMINION slice D9 view models: the Rival File (key R; built from the round-4 mockups' classes), the Morning's Tension
// badge (mockup 2) and the threat row "TENSION 83 · Giovanni will raid your HQ within 3 nights." (mockup 9). Plain data
// for ui/redux/screens/dominion/rival.ts. Pure: no Phaser, no RNG.

import { DOMINION_DATA } from './data';
import { districtDef } from './field';
import { cardChoices, planSeen, rivalsOf, stageDef, stageIndex, streetRow, teamsHere, tribute } from './rivals';
import type { DominionAction, DominionBlock, RivalCard } from './schema';
import { topModel, type TopModel } from './screens';

const RV = () => DOMINION_DATA.rivals;
const money = (n: number): string => `₽${n.toLocaleString('en-US')}`;
const nights = (n: number): string => `${n} night${n === 1 ? '' : 's'}`;

export interface Badge { label: string; word: string; hot: boolean }
export interface Threat { tag: string; text: string; look: string; tension: number; hot: boolean }
export interface RivalRow { id: string; label: string; sub: string; act: DominionAction; on: boolean }
export interface RivalFileModel {
  top: TopModel;
  name: string; tag: string; colour: string; boss: string; look: string; admins: { name: string; gone: boolean }[];
  tension: number; stage: string; word: string; does: string; next: string | null;
  plan: string; seen: boolean;
  raid: string | null;
  truce: string | null;
  spies: string;
  sites: { name: string; where: string; state: 'theirs' | 'yours' | 'gone'; hq: boolean }[];
  log: { day: number; text: string }[];
  rows: RivalRow[];
  notice: string | null;
}

/** The region's first rival team (Kanto: Team Rocket), or null when none is on. */
const firstTeam = () => teamsHere()[0] ?? null;

/** Mockup 2's badge: the rival team's Tension word ("Tension: RISING"), or the region's Heat when no team is on. */
export function rivalBadge(b: DominionBlock): Badge {
  const team = firstTeam();
  if (!team) return { label: 'Heat', word: b.heat >= 60 ? 'HOT' : b.heat >= 25 ? 'RISING' : 'LOW', hot: b.heat >= 25 };
  const s = stageIndex(rivalsOf(b).teams[team.id]?.tension ?? 0);
  return { label: 'Tension', word: stageDef(s).word, hot: s >= 2 };
}

/** The tag on the Morning's rival alerts ("ROCKET"). */
export const rivalTag = (): string => firstTeam()?.tag ?? 'RIVALS';

/** Mockup 9's threat row: the Boss raid when it's coming, else what this stage of Tension means. Null while Unaware. */
export function threatRow(b: DominionBlock): Threat | null {
  const team = firstTeam();
  if (!team) return null;
  const t = rivalsOf(b).teams[team.id];
  if (!t) return null;
  const s = stageIndex(t.tension);
  const base = { tag: `TENSION ${t.tension}`, look: team.boss.look ?? 'g-meteorite.png', tension: t.tension };
  if (t.raid !== null) {
    const n = Math.max(0, t.raid - b.day);
    return { ...base, hot: true, text: n ? `${team.boss.name} will raid your HQ within ${nights(n)}.` : `${team.boss.name} is at your door.` };
  }
  if (t.truce) return { ...base, hot: false, text: `A truce with ${team.name} holds.` };
  if (s === 0) return null;
  return { ...base, hot: s >= 3, text: `${team.name}: ${stageDef(s).name}. ${stageDef(s).does}` };
}

function cardText(c: RivalCard): string {
  const team = DOMINION_DATA.rivals.teams.find((x) => x.id === c.team);
  const where = c.district ? ` in ${districtDef(c.district)?.name ?? c.district}` : '';
  switch (c.kind) {
    case 'fight': return `${c.who} wants a battle${where}.`;
    case 'demand': return `${c.who} wants ${money(c.amount)}.`;
    case 'deal': return `${c.who} will sell ${team?.name ?? 'their'} plan for the week for ${money(c.amount)}.`;
    case 'defect': return `${c.who} wants out of ${team?.name ?? 'the team'} for ${money(c.amount)}.`;
    case 'truce': return `${c.who} offers a truce.`;
    case 'street': return `${streetRow(c.ref)?.what ?? 'A meeting on the street'}${where}.`;
  }
}

/** The Rival File (key R): Tension, the stage, the plan (when seen), sites, held members, cards to answer, the truce. */
export function rivalFileModel(b: DominionBlock, at: number, notice: string | null = null): RivalFileModel | null {
  const team = firstTeam();
  if (!team) return null;
  const r = rivalsOf(b);
  const t = r.teams[team.id]!;
  const s = stageIndex(t.tension);
  const st = stageDef(s);
  const nextStage = RV().stages[s + 1];
  const seen = planSeen(b, team.id);
  const planNames = t.plan.map((p) => RV().plan.priorities.find((x) => x.id === p)?.name ?? p);
  const rows: Omit<RivalRow, 'on'>[] = [];
  r.cards.forEach((c, i) => {
    if (c.team !== team.id) return;
    const text = `${cardText(c)} Answer by Day ${c.until}.`;
    cardChoices(c).forEach((label, j) => rows.push({ id: `card-${i}-${j}`, label, sub: text, act: { t: 'card', index: i, choice: j } }));
  });
  for (const h of r.held) {
    const m = b.members.find((x) => x.id === h.member);
    rows.push({ id: `ransom-${h.member}`, label: `Pay ${money(h.ransom)} for ${m?.name ?? 'your member'}`, sub: `Held since Day ${h.day}. Let go on Day ${h.day + RV().held.days} anyway, or rescue them (crew task).`, act: { t: 'ransom', member: h.member } });
  }
  if (t.truce) rows.push({ id: 'break', label: 'Break the truce', sub: `Tension +${RV().tension.breakTruce} at once.`, act: { t: 'breakTruce', team: team.id } });
  else if (t.tension >= RV().truce.minTension) rows.push({ id: 'truce', label: `Offer a truce (${money(tribute(b))} a week)`, sub: `Tension −${RV().tension.truceWeek} now and every week it's paid. No raids while it holds.`, act: { t: 'truce', team: team.id } });
  const k = rows.length ? Math.max(0, Math.min(at, rows.length - 1)) : -1;
  const mine = r.mySpies.filter((x) => x.team === team.id).map((x) => b.members.find((m) => m.id === x.member)?.name).filter(Boolean);
  return {
    top: topModel(b, 'RIVAL FILE'),
    name: team.name, tag: team.tag, colour: team.colour, boss: team.boss.name, look: team.boss.look ?? 'g-meteorite.png',
    admins: team.admins.map((a) => ({ name: a.name, gone: !t.admins.includes(a.id) })),
    tension: t.tension, stage: st.name, word: st.word, does: st.does,
    next: nextStage ? `${nextStage.name} at ${nextStage.min}` : null,
    plan: s === 0 ? 'They have no plan for you yet.' : seen ? (planNames.join(' · ') || 'Not set yet.') : `Hidden. A spy inside (crew task Spy), a deal, or an Operations Room at HQ Lv. ${RV().plan.seeHq} shows it.`,
    seen,
    raid: t.raid === null ? null : t.raid > b.day ? `${team.boss.name} will raid your HQ within ${nights(t.raid - b.day)}.` : `${team.boss.name} is at your door.`,
    truce: t.truce ? (t.truce.tribute ? `Truce since Day ${t.truce.since}: ${money(t.truce.tribute)} a week.` : `Truce until Day ${t.truce.until ?? '?'}.`) : null,
    spies: `${mine.length ? `Inside for you: ${mine.join(', ')}.` : 'Nobody of yours inside.'} ${t.spies ? `Moles in your crew: ${t.spies} (Counter-spy finds them).` : 'No moles found.'}`,
    sites: team.sites.map((x) => ({ name: x.name, where: districtDef(x.district)?.name ?? x.district, state: t.sites[x.id] ?? 'theirs', hq: !!x.hq })),
    log: [...t.log].reverse().slice(0, 5),
    rows: rows.map((x, i) => ({ ...x, on: i === k })),
    notice,
  };
}
