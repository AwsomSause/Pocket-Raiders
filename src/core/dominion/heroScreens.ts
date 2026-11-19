// DOMINION D11 view models: the Hero's file (mockup s9, the night screen with the file pinned up) and the Hero stepping
// into a job (mockup m11). Plain data for ui/redux/screens/dominion/heroViews.ts. Pure: no Phaser, no RNG.
// Disillusion is hidden (Part 9 A8): it never appears here.

import type { RunState } from '../state';
import { DOMINION_DATA } from './data';
import { actionDef, districtDef, wanted } from './field';
import { activeLegends, encounterOf, heroAt, heroDefOf, heroLevel, heroOf, heroTeam, reasonDef, regionId, stageIndex } from './hero';
import { topModel, type TopModel } from './screens';
import type { DominionBlock } from './schema';
import { fill } from './worldTurn';

const H = () => DOMINION_DATA.hero;
const dName = (id: string): string => districtDef(id)?.name ?? id;
const cap = (t: string): string => t[0]!.toUpperCase() + t.slice(1);

export interface LegendCard { id: string; name: string; dial: number; colour: string; rows: { text: string; ok: boolean }[]; out: boolean; canFight: boolean }
export interface MeetCard { id: string; title: string; text: string; choices: { label: string; note: string; battle: boolean }[]; night: boolean; open: boolean }

export interface HeroModel {
  top: TopModel;
  region: string;
  hero: {
    name: string; look: string; badges: number; level: string; allies: { name: string; look: string | null; species: string | null }[];
    threat: number; word: string; does: string; reason: string | null; week: string; met: boolean; at: string | null; place: string;
    archetype: string; taunt: string; counters: string[];
  };
  /** The Hero's card, then one card per Legendary of the region (mockup s9's four cards). */
  heroCard: { dial: number; rows: { text: string; ok: boolean }[] };
  legends: LegendCard[];
  rib: string;
  alerts: { tone: 'r' | 'y' | 'v'; title: string; text: string; look: string | null; species: string | null }[];
  meet: MeetCard | null;
  /** After the final stand: the two pills are live. */
  choose: boolean;
  outcome: string | null;
  cta: { label: string; act: 'legend' | 'back'; id: string | null } ;
}

const LEGEND_COLOURS = ['#ef4a3a', '#f2c230', '#4fd2ff', '#3fcf74'];

export function heroModel(b: DominionBlock, run: Pick<RunState, 'party'>): HeroModel {
  const h = heroOf(b), def = heroDefOf(h.id), S = H().threat.stages;
  const st = S[stageIndex(h.threat)]!;
  const region = H().regions[regionId()]!;
  const team = heroTeam(b, run, 'hero');
  const lv = heroLevel(b, run);
  const lvTop = Math.max(...team.team.map((t) => t.level), lv);
  const known = h.met || h.intel >= b.day;
  const allies = h.allies.map((a) => {
    const ally = region.allies?.find((x) => x.id === a);
    if (ally) return { name: ally.name, look: ally.look, species: null };
    const lg = region.legends.find((l) => l.id === a);
    return { name: lg?.name ?? a, look: null, species: lg?.id ?? null };
  });
  const reason = reasonDef(h.reason);
  const active = activeLegends(b);
  const stir = Math.max(wanted(b.field), ...Object.values(b.field.districts).map((d) => d.dread));
  const legends: LegendCard[] = region.legends.map((l, i) => {
    const s = h.legends[l.id] ?? { seen: false, next: 0, away: 0, beaten: 0 };
    const out = active.includes(l.id);
    const away = s.away > b.day;
    const dial = out ? 100 : away ? 0 : Math.min(99, Math.round((stir * 100) / H().legends.wakeAt));
    const rows = [
      out ? { text: `Seen over ${l.over ?? dName(l.home ?? '')}`, ok: false } : away ? { text: `Driven off till Day ${s.away}`, ok: true } : { text: 'Asleep', ok: true },
      out ? { text: `Strikes Day ${Math.max(b.day, s.next)}`, ok: false } : { text: `Wakes at ${H().legends.wakeAt} Wanted or Dread`, ok: !away },
      ...(s.beaten ? [{ text: `Beaten ${s.beaten}×`, ok: true }] : []),
    ];
    return { id: l.id, name: l.name.toUpperCase(), dial, colour: LEGEND_COLOURS[i % LEGEND_COLOURS.length]!, rows, out, canFight: out && b.phase === 'day' && b.actions > 0 && !b.field.fight };
  });
  const heroRows = [
    { text: `${h.badges} of 8 badges`, ok: h.badges < 8 },
    { text: h.met ? 'You have met' : 'Not met yet', ok: h.met },
    { text: reason ? `Wants to ${reason.text}` : 'No reason yet', ok: !reason },
  ];
  const alerts: HeroModel['alerts'] = [];
  for (const id of active) {
    const l = region.legends.find((x) => x.id === id)!;
    alerts.push({ tone: 'y', title: 'LEGENDARY', text: `${l.name} was seen over ${l.over ?? dName(l.home ?? '')}. It strikes from outside.`, look: null, species: l.id });
  }
  if (h.week.length) alerts.push({ tone: 'r', title: `THREAT ${h.threat}`, text: h.week.at(-1)!, look: def.look, species: null });
  if (h.counters.length) alerts.push({ tone: 'v', title: 'ADAPTS', text: fill(H().adapt.line, { type: cap(h.counters.at(-1)!) }), look: def.look, species: null });
  const e = h.meet ? encounterOf(h.meet.id) : undefined;
  const v = { hero: def.name, district: h.meet ? dName(h.meet.district) : '', badges: h.badges, mentor: region.mentor ?? 'An old professor', parent: region.parent ?? "The Hero's family", sidekick: region.sidekick ?? 'A kid', rival: DOMINION_DATA.field.rivalTeam };
  const meet: MeetCard | null = e
    ? {
      id: e.id, title: fill(e.title, v), text: fill(e.text, v), night: !!e.night, open: !e.night || b.phase === 'night',
      choices: e.choices.map((c) => ({ label: c.label, battle: !!c.battle, note: noteOf(c) })),
    }
    : null;
  const choose = h.stand?.state === 'choose';
  const outcome = h.stand?.state === 'done' && h.stand.outcome ? { leave: 'Left in their shame', joined: 'Joined your crew', refused: 'Refused, head up' }[h.stand.outcome] : null;
  const fightable = legends.find((l) => l.canFight);
  return {
    top: topModel(b, 'THE HERO'),
    region: cap(regionId()),
    hero: {
      name: def.name.toUpperCase(), look: def.look, badges: h.badges, level: known ? (lvTop > lv ? `${lv}–${lvTop}` : `${lv}`) : '??', allies,
      threat: h.threat, word: st.word, does: st.does, reason: reason?.text ?? null, week: h.week.at(-1) ?? 'Nothing yet. Keep it that way.',
      met: h.met, at: known ? dName(heroAt(b)) : null, place: def.place,
      archetype: H().archetypes.find((a) => a.id === def.archetype)?.name ?? def.archetype, taunt: H().archetypes.find((a) => a.id === def.archetype)?.taunt ?? '',
      counters: h.counters.map(cap),
    },
    heroCard: { dial: h.threat, rows: heroRows },
    legends,
    rib: `${def.name} walks ${cap(regionId())}'s story path. They can't be touched outside a battle.`,
    alerts: alerts.slice(0, 2),
    meet,
    choose,
    outcome,
    cta: fightable ? { label: `Fight ${fightable.name[0]}${fightable.name.slice(1).toLowerCase()} ▶`, act: 'legend', id: fightable.id } : { label: 'Back to the HQ ◀', act: 'back', id: null },
  };
}

function noteOf(c: { regard?: number; dread?: number; heat?: number; harm?: number; delay?: number; intel?: number; funds?: number; battle?: string; tension?: string }): string {
  const bits: string[] = [];
  if (c.battle) bits.push('Battle · no stakes');
  if (c.regard) bits.push(`Regard ${c.regard > 0 ? '+' : ''}${c.regard}`);
  if (c.dread) bits.push(`Dread +${c.dread}`);
  if (c.heat) bits.push(`Heat +${c.heat}`);
  if (c.harm) bits.push(`Hero Threat +${c.harm}`);
  if (c.delay) bits.push(`Hero loses ${c.delay} day${c.delay > 1 ? 's' : ''}`);
  if (c.intel) bits.push(`Route known ${c.intel} days`);
  if (c.funds) bits.push(`₽${c.funds}`);
  if (c.tension) bits.push(`Tension with the rival team (${c.tension})`);
  return bits.join(' · ') || 'Nothing changes';
}

// ---------- m11: the Hero steps into a job ----------

export interface InterruptModel {
  hero: string; look: string; threat: number; member: string; job: string; smoke: number; smokeChance: number; runHeat: number;
}

export function interruptModel(b: DominionBlock, inventory: Record<string, number>): InterruptModel | null {
  const f = b.field.fight;
  if (!f || f.why !== 'hero' || f.begun) return null;
  const h = heroOf(b), def = heroDefOf(h.id), F = H().foil;
  return {
    hero: def.name, look: def.look, threat: h.threat, member: b.members[0]?.name ?? 'You', job: actionDef(f.action ?? '')?.name ?? 'the job',
    smoke: inventory[F.smokeItem] ?? 0, smokeChance: F.smokeChance, runHeat: F.runHeat,
  };
}
