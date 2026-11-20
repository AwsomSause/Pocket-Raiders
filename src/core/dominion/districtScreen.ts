// DOMINION slice D29: the District file page (round-4 mockup m4), split out of the Region Map's side panel. Plain data
// for ui/redux/screens/dominion/district.ts, built from D2's map model and D6's district state (Control, Heat, the rival's
// grip, Regard and Dread). The scene keeps the same MapCursor, so the Card and `act` are D2's, unchanged. Pure.

import type { RunState } from '../state';
import { DOMINION_DATA } from './data';
import { actionDef } from './field';
import { cardModel, gridPages, mapModel, type MapCursor } from './fieldScreens';
import { heroAt, heroDefOf } from './hero';
import type { DominionBlock } from './schema';
import { fill } from './worldTurn';
import type { TopModel } from './screens';

const F = () => DOMINION_DATA.field;
const FL = () => F().file.lines;
export type GroupId = 'money' | 'muscle' | 'shadow';

export interface DistrictAct { slot: number; key: number; id: string; label: string; icon: string; on: boolean; dim: boolean; night: boolean }
export interface DistrictModel {
  top: TopModel;
  id: string; name: string;
  stamp: { word: string; colour: string };
  control: number; heat: number; rival: number; rivalName: string; regard: number; dread: number;
  /** The line under the dials: how far to Held, or how to keep it. */
  goal: string;
  /** The red banner across the top (the Hero in town, a patrol, a checkpoint), or null. */
  banner: { text: string; look: string | null } | null;
  targets: { id: string; name: string; look: string; pays: string; note: string; on: boolean }[];
  /** The page's actions as three columns of three, each headed by its group (Money, Muscle, Shadow). */
  columns: { group: GroupId; name: string; colour: string; acts: DistrictAct[] }[];
  /** Display order (number keys 1-9) to the grid slot the cursor keeps. */
  order: number[];
  section: string; page: number; pages: number;
  left: string;
  cta: string | null;
  hint: string;
}

/** The group an action sits in: its own override, else its list section's. */
export function groupOf(id: string): GroupId {
  const f = F().file;
  const own = f.byAction[id];
  if (own) return own;
  const sec = actionDef(id)?.section;
  return (sec && f.sections[sec]) || 'shadow';
}

const GROUP_ORDER: GroupId[] = ['money', 'muscle', 'shadow'];
/** The page's grid slots in the order the page shows them: Money first, then Muscle, then Shadow (stable). */
export function districtOrder(b: DominionBlock, page: number): number[] {
  const ids = gridPages(b)[page] ?? [];
  return ids.map((id, slot) => ({ slot, g: GROUP_ORDER.indexOf(groupOf(id)) })).sort((x, y) => x.g - y.g || x.slot - y.slot).map((x) => x.slot);
}

const strip = (s: string): string => s.replace(/<[^>]+>/g, '');

export function districtModel(b: DominionBlock, run: Pick<RunState, 'party'>, c: MapCursor): DistrictModel {
  const m = mapModel(b, run, { ...c, focus: 'grid' });
  const d = F().districts.find((x) => x.id === c.district) ?? F().districts.find((x) => x.id === F().hq)!;
  const ids = gridPages(b)[m.page] ?? [];
  const order = districtOrder(b, m.page);
  const groups = F().file.groups;
  const acts: DistrictAct[] = order.map((slot, k) => {
    const g = m.grid[slot]!;
    return { slot, key: k + 1, id: g.id, label: g.label, icon: F().file.icons[g.id] ?? groups.find((x) => x.id === groupOf(g.id))!.icon, on: slot === c.at, dim: g.dim, night: g.night };
  });
  const columns: DistrictModel['columns'] = [];
  for (let i = 0; i < acts.length; i += 3) {
    const chunk = acts.slice(i, i + 3);
    const gid = groupOf(chunk[0]!.id);
    const g = groups.find((x) => x.id === gid)!;
    columns.push({ group: gid, name: g.name, colour: g.colour, acts: chunk });
  }
  const sel = ids[c.at];
  const cf = F().control;
  const st = m.file.stamp.word;
  const goal = st === 'HELD' || st === 'OWNED'
    ? fill(FL().isHeld!, { district: d.name, n: cf.held })
    : fill(FL().toHeld!, { district: d.name, n: cf.held });
  let banner: DistrictModel['banner'] = null;
  if (b.hero && (b.hero.met || b.hero.intel >= b.day) && heroAt(b) === d.id) {
    const h = heroDefOf(b.hero.id);
    banner = { text: fill(FL().hero!, { name: h.name.toUpperCase(), district: d.name.toUpperCase() }), look: h.look };
  } else if (b.field.closed === d.id) banner = { text: fill(FL().closed!, { district: d.name.toUpperCase() }), look: 'dominion/t-policeman.png' };
  else if (b.field.patrol === d.id) banner = { text: fill(FL().patrol!, { district: d.name.toUpperCase() }), look: 'dominion/t-policeman.png' };
  const targets = d.targets.map((t, i) => {
    const card = sel ? cardModel(b, run, sel, t.id, d.id) : null;
    const trait = t.trait?.word ?? FL().noTrait!;
    const guard = t.foe ? fill(FL().guard!, { name: t.foe.name }) : FL().noGuard!;
    return {
      id: t.id, name: t.name, look: t.owner.look || `dominion/${F().file.kindIcons[t.kind] ?? 'g-relic-gold'}.png`,
      pays: card ? strip(card.pays) : '', note: fill(FL().owner!, { trait, guard }), on: i === c.target,
    };
  });
  const left = b.phase === 'day' ? fill(FL().left!, { n: b.actions, s: b.actions === 1 ? '' : 's' }) : m.note;
  return {
    top: { ...m.top, regionLabel: 'YOU ARE HERE', region: `Map › ${d.name}` },
    id: d.id, name: d.name, stamp: m.file.stamp,
    control: m.file.control, heat: m.file.heat, rival: m.file.rival, rivalName: m.file.rivalName, regard: m.file.regard, dread: m.file.dread,
    goal, banner, targets, columns, order,
    section: m.section, page: m.page, pages: m.pages,
    left, cta: m.cta, hint: FL().cardFirst!,
  };
}
