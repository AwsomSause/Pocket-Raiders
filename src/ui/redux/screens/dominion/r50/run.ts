// DOMINION redesign R0: what the pass-50 chrome shows (R5Run), read from the run's Dominion block. Display only:
// nothing here changes the block or rolls anything.

import { bossMenuModel } from '../../../../../core/dominion/bossMenu';
import { DOMINION_DATA } from '../../../../../core/dominion/data';
import { dirtyOf } from '../../../../../core/dominion/hqFx';
import { threatRow } from '../../../../../core/dominion/rivalScreens';
import { rivalsOf, teamsHere } from '../../../../../core/dominion/rivals';
import type { DominionBlock } from '../../../../../core/dominion/schema';
import type { R5Run, R5Tod } from './kit';

const TOD_OF: Record<string, R5Tod> = { morning: 'morn', day: 'noon', evening: 'eve', night: 'night' };

/** The run's party for the key strip (the scene draws each picture: it knows the art manifest). */
export interface R5PartyMon { html: string; hp: number }

export function r5RunOf(b: DominionBlock, party: readonly R5PartyMon[], o: { open?: readonly number[] } = {}): R5Run {
  const clock = DOMINION_DATA.start.clock;
  const g = bossMenuModel(b, 0, { card: null, slot: 1 }).glance;
  const team = teamsHere()[0];
  const tension = team ? rivalsOf(b).teams[team.id]?.tension ?? 0 : 0;
  const mine = g.goalPct;
  // The tug of war: even at the start, leaning to whoever is ahead (district control against the rival's tension).
  const war = Math.max(5, Math.min(95, Math.round(50 + (mine - tension) / 2)));
  const t = threatRow(b);
  const raid = team ? rivalsOf(b).teams[team.id]?.raid ?? null : null;
  const coming = raid !== null ? (raid - b.day > 0 ? `Raid in ${raid - b.day}` : 'Raid tonight') : undefined;
  const dirty = dirtyOf(b);
  const used = b.phase === 'day' ? Math.max(0, clock.dayActions - b.actions) : 0;
  const held = b.realm?.held.length ?? 0;
  const talks = b.crew?.talks.length ?? 0;
  const week = b.voices?.week ?? [];
  const news = week.slice(-4).map((x) => x.l);
  return {
    funds: `₽${b.funds.toLocaleString('en-US')}`,
    cleanPct: b.funds > 0 ? Math.round((100 * (b.funds - dirty)) / b.funds) : 100,
    heat: b.heat,
    day: b.day,
    orders: [Math.min(used, clock.dayActions), clock.dayActions],
    goalPct: g.goalPct,
    regions: [held > 0, held > 1, held > 2, held > 3],
    level: b.hqLevel,
    xpPct: g.goalPct,
    war,
    foe: team?.name ?? 'Rivals',
    coming,
    hero: g.hero ? { k: 't-redbig', where: `Hero · threat ${g.hero.threat}` } : undefined,
    news: news.length ? news : ['All quiet in Kanto'],
    newsToday: week.some((x) => x.d === b.day),
    tod: TOD_OF[b.phase],
    party,
    startBadge: talks,
    tabBadges: ['', '', '', '', '', ''],
    wantWord: [],
    tip: t?.text,
    tabsOpen: o.open,
    side: b.teamName ?? 'Your crew',
    initial: b.team?.initial ?? (b.teamName ? b.teamName[0]!.toUpperCase() : 'N'),
    phase: DOMINION_DATA.start.clock.phases.find((p) => p.id === b.phase)?.word,
    roster: `${b.members.length}/${b.rosterCap}`,
  };
}
