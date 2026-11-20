// DOMINION slice D27: the Boss Menu (v4 mockup m1), the pause page Esc opens from the HQ. Pure view model: no Phaser,
// no RNG, nothing changed. The blades lead to pages that already exist (tabs 1, 3, 4, 5, 6, Rotom and Settings).

import { DOMINION_DATA } from './data';
import { goalDef } from './founding';
import { heroDefOf } from './hero';
import { threatRow, type Threat } from './rivalScreens';
import { quoteFor } from './rules';
import { topModel, type TopModel } from './screens';
import type { DominionBlock } from './schema';

export type BladeId = 'back' | 'hq' | 'roster' | 'reserve' | 'ops' | 'ledger' | 'rotom' | 'settings' | 'hide';

export interface Blade { id: BladeId; icon: string; label: string; sub: string | null; key: string; dim?: boolean }

export interface BossMenuModel {
  top: TopModel;
  blades: Blade[];
  at: number;
  glance: {
    when: string;
    funds: string;
    heat: number;
    regard: number;
    dread: number;
    goal: string;
    goalPct: number;
    hero: { name: string; look: string; threat: number } | null;
    alert: Threat | null;
  };
  slot: { line: string; sub: string };
  quote: string;
  notice: string | null;
}

/** The blade order (keys: Esc, 1, 3, 4, 5, 6, R, S, End: mockup m1). */
export const BLADES: readonly BladeId[] = ['back', 'hq', 'roster', 'reserve', 'ops', 'ledger', 'rotom', 'settings', 'hide'];

/** The region's name as a word (start.json keeps it in capitals for the top bar). */
export const regionName = (): string => { const r = DOMINION_DATA.start.start.region; return r[0]! + r.slice(1).toLowerCase(); };

const avg = (xs: number[]): number => (xs.length ? Math.round(xs.reduce((a, n) => a + n, 0) / xs.length) : 0);

export interface MenuExtras {
  /** The Key-Card line under Rotom ("Key-Card: Pearl · $3.20 of $10"), or null without a card. */
  card: string | null;
  slot: number;
  notice?: string | null;
}

export function bossMenuModel(b: DominionBlock, at: number, x: MenuExtras): BossMenuModel {
  const top = topModel(b, 'BOSS MENU');
  const talks = b.crew?.talks.length ?? 0;
  const morningNote = b.phase === 'morning' ? 'the Morning is waiting' : b.phase === 'day' ? `${b.actions} action${b.actions === 1 ? '' : 's'} left today` : b.phase === 'evening' ? 'the Evening is waiting' : 'the Night is waiting';
  const blades: Blade[] = [
    { id: 'back', icon: 'g-vs-seeker', label: 'Back to work', sub: morningNote, key: 'Esc' },
    { id: 'hq', icon: 'g-card-key', label: 'Empire · HQ', sub: null, key: '1' },
    { id: 'roster', icon: 'g-fame-checker', label: 'Crew Roster', sub: `${b.members.length} member${b.members.length === 1 ? '' : 's'}${talks ? ` · ${talks} want${talks === 1 ? 's' : ''} a word` : ''}`, key: '3' },
    { id: 'reserve', icon: 'g-ball', label: 'Pokémon Reserve', sub: null, key: '4' },
    { id: 'ops', icon: 'g-machine-part', label: 'Operations', sub: null, key: '5' },
    { id: 'ledger', icon: 'g-journal', label: 'Ledger', sub: null, key: '6' },
    { id: 'rotom', icon: 'p-rotom', label: 'Rotom', sub: x.card ?? 'no Key-Card · offline', key: 'R' },
    { id: 'settings', icon: 'g-scope-lens', label: 'Settings', sub: null, key: 'S' },
    { id: 'hide', icon: 'g-letter', label: 'Go into hiding', sub: 'save and quit to title', key: 'End', dim: true },
  ];
  const ds = Object.values(b.field.districts);
  const goal = goalDef(b.team?.goal ?? null);
  const hero = b.hero ? heroDefOf(b.hero.id) : null;
  const ph = DOMINION_DATA.start.clock.phases.find((p) => p.id === b.phase);
  return {
    top,
    blades,
    at: Math.max(0, Math.min(at, blades.length - 1)),
    glance: {
      when: `Day ${b.day} · ${ph ? ph.word[0]! + ph.word.slice(1).toLowerCase() : b.phase}`,
      funds: top.funds,
      heat: b.heat,
      regard: avg(ds.map((d) => d.regard)),
      dread: avg(ds.map((d) => d.dread)),
      goal: goal ? `Goal · ${goal.name}` : 'Goal · Takeover',
      goalPct: avg(ds.map((d) => d.control)),
      hero: b.hero && hero ? { name: hero.name, look: hero.look, threat: b.hero.threat } : null,
      alert: threatRow(b),
    },
    slot: { line: `Slot ${x.slot} · ${b.teamName ?? 'Unnamed Crew'}`, sub: `${regionName()} · Day ${b.day} · saved every step` },
    quote: quoteFor(b.day),
    notice: x.notice ?? null,
  };
}
