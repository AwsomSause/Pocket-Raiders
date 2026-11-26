// DOMINION redesign R4: simple real rules for the pass-50 battle pages (Director 2026-11-21: "don't leave the 'needs a
// mechanic' pages out"). Power gear and Pick a power (mockups `gear`, `power`): the Boss carries one power's key item,
// opened by the main game's boss rule (one after Day 5 of the first region, one more each region); Gym Leaders and
// Bosses who face you get their own powers by the same rule. Phase two (`phase`): a rival Boss beaten at your door
// rallies once. The crew's help before a big fight (`teamup`, `crewin`): the foe's lead starts hurt. The Betrayal
// (`legend`): after the Boss falls for good, their admin turns and the team's Legendary has to be faced (catchable).
// Data: src/data/dominion/fights.json. No rolls: everything here is worked out from the block.

import { z } from 'zod';
import raw from '../../data/dominion/fights.json';
import { gimmickSlots, planBossGimmicks } from '../battle/bossGimmicks';
import type { Content } from '../contentSchema';
import { addItem, consumeItem, itemCount } from '../items';
import { maxHp } from '../pokemon';
import type { PokemonInstance, RunState } from '../state';
import { DOMINION_DATA } from './data';
import { addFightHook, addFightSettler, districtDef, foeOf, targetDef } from './field';
import { heroTeam } from './hero';
import { setPhaseHook } from './fightEnd';
import { jobxOf } from './jobs';
import { regionsInRun } from './regions';
import { rivalSide, teamDef } from './rivals';
import type { DominionBlock, FieldFight, Member } from './schema';
import { fill } from './worldTurn';

const S = z.string().min(1), I = z.number().int(), N0 = I.min(0);
const Lines = z.array(S).min(1);
const FightsFileSchema = z.object({
  _source: S,
  power: z.object({
    gear: z.array(z.object({ kind: z.enum(['mega', 'tera', 'dynamax', 'zmove']), item: S, gear: S, name: S, about: S, verb: S, pic: S }).strict()).length(4),
    rules: z.array(S).length(3), pick: S, picked: S, carried: S, locked: S, none: S,
  }).strict(),
  phase: z.object({
    word: S, sub: S, atk: I.min(1).max(6),
    changes: z.array(z.object({ tone: z.enum(['up', 'dn']), icon: S, title: S, text: S }).strict()).length(4),
    noCrew: S, lines: Lines, note: S,
  }).strict(),
  assist: z.object({
    teamup: z.object({ word: S, sub: S, per: N0, max: I.min(0).max(90), lines: Lines }).strict(),
    crewin: z.object({ head: S, cut: I.min(0).max(90), hurt: I.min(0).max(100), about: S, fresh: S, hurtWord: S }).strict(),
    used: S,
  }).strict(),
  betrayal: z.object({
    small: S, word: S, role: S, over: N0,
    teams: z.record(S, z.object({ admin: S, legend: S, level: I.min(1).max(100), line: S }).strict()),
    face: S, won: S, caught: S, lost: S,
  }).strict(),
  snap: z.object({ line: S, note: S, saved: S }).strict(),
}).strict();
export type FightsFile = z.infer<typeof FightsFileSchema>;
export const FIGHTS: FightsFile = FightsFileSchema.parse(raw);

type Mon = PokemonInstance;
const nice = (id: string): string => id.replace(/-/g, ' ').replace(/\b\w/g, (x) => x.toUpperCase());

// ---------- power gear (mockups `gear`, `power`) ----------

export type Gear = FightsFile['power']['gear'][number];
export const GEAR: readonly Gear[] = FIGHTS.power.gear;
const afterDay = (content: Pick<Content, 'balance'>): number => content.balance.transformations.bossGimmickAfterStage;

/** How many powers are open: the main game's boss rule, with the region's day as the stage. Doesn't change `b`. */
export function powerSlots(content: Pick<Content, 'balance'>, b: DominionBlock): number {
  const idx = Math.max(0, regionsInRun(b).indexOf(b.realm?.at ?? 'kanto'));
  return gimmickSlots(idx, b.day, afterDay(content));
}
/** The region (1-based) a gear opens in. */
export const gearRegion = (i: number): number => i + 1;
export const powerLines = (content: Pick<Content, 'balance'>): string[] => FIGHTS.power.rules.map((r) => fill(r, { after: afterDay(content) }));
export const noPowerLine = (content: Pick<Content, 'balance'>): string => fill(FIGHTS.power.none, { after: afterDay(content) });
export const carried = (b: DominionBlock): string | null => b.jobx?.power?.kind ?? null;

/** Carry a power: its key item goes in the Bag (the one Dominion gave before goes back). Mutates `b` and `run`. */
function carry(content: Pick<Content, 'balance'>, b: DominionBlock, run: RunState, kind: string): { ok: boolean; notice: string | null } {
  const i = GEAR.findIndex((g) => g.kind === kind);
  const g = GEAR[i];
  if (!g) return { ok: false, notice: null };
  if (i >= powerSlots(content, b)) return { ok: false, notice: powerSlots(content, b) === 0 ? noPowerLine(content) : fill(FIGHTS.power.locked, { n: gearRegion(i) }) };
  const x = jobxOf(b);
  if (x.power?.kind === kind) return { ok: true, notice: fill(FIGHTS.power.carried, { gear: g.gear }) };
  if (x.power?.given && itemCount(run.inventory, x.power.item) > 0) consumeItem(run.inventory, x.power.item);
  const given = itemCount(run.inventory, g.item) === 0;
  if (given) addItem(run.inventory, g.item, 1);
  x.power = { kind, item: g.item, given };
  return { ok: true, notice: fill(FIGHTS.power.picked, { gear: g.gear, name: g.name }) };
}

// ---------- the crew's help before a fight (mockups `teamup`, `crewin`) ----------

export type AssistKind = 'teamup' | 'crewin';
const AWAY: readonly FieldFight['why'][] = ['rival', 'hero', 'stand', 'takeover', 'growth', 'realm'];
const HOME: readonly FieldFight['why'][] = ['raid', 'heroRaid'];

/** Which help the fight waiting at the door can have: crew step in at the HQ, a team-up away from it. */
export function assistKind(f: FieldFight | null | undefined): AssistKind | null {
  if (!f || f.begun) return null;
  if (f.why === 'rival' && f.action === 'boss-raid') return f.phase === 2 ? 'teamup' : 'crewin';
  if (HOME.includes(f.why)) return 'crewin';
  return AWAY.includes(f.why) ? 'teamup' : null;
}
export interface Helper { m: Member; mon: Mon }
/** Members free to help (not hurt, jailed or held) with a Pokémon standing, three at most. */
export function helpers(b: DominionBlock): Helper[] {
  const out: Helper[] = [];
  for (const m of b.members) {
    const mon = m.crew?.out ? undefined : m.team.find((x) => x.hp > 0);
    if (mon) out.push({ m, mon });
  }
  return out.slice(0, 3);
}
/** The help is offered once a fight (phase two offers a team-up again if the first was turned down). */
export const assistDue = (b: DominionBlock): AssistKind | null => {
  const f = b.field.fight, k = assistKind(f);
  return k && f!.assist === undefined && helpers(b).length ? k : null;
};
/** How much of the foe lead's HP the help takes. */
export function assistCut(content: Content | null, kind: AssistKind, hs: readonly Helper[]): number {
  if (kind === 'teamup') return Math.min(FIGHTS.assist.teamup.max, FIGHTS.assist.teamup.per * hs.length);
  const h = hs[0];
  if (!h) return 0;
  const top = content ? maxHp(content, h.mon) : Math.max(1, h.mon.hp);
  return Math.round((FIGHTS.assist.crewin.cut * Math.min(1, h.mon.hp / Math.max(1, top))));
}
function assist(content: Content | null, b: DominionBlock, by: readonly string[]): { ok: boolean; notice: string | null } {
  const f = b.field.fight, kind = assistDue(b);
  if (!f || !kind) return { ok: false, notice: null };
  if (!by.length) {
    f.assist = null;
    return { ok: true, notice: null };
  }
  const all = helpers(b);
  const hs = kind === 'teamup' ? all : all.filter((h) => h.m.id === by[0]).slice(0, 1);
  if (!hs.length) return { ok: false, notice: null };
  f.assist = { by: hs.map((h) => h.m.id), cut: assistCut(content, kind, hs) };
  if (kind === 'crewin') {
    // Stepping in costs the member's Pokémon some HP (it fought first).
    const mon = hs[0]!.mon, top = content ? maxHp(content, mon) : mon.hp;
    mon.hp = Math.max(1, mon.hp - Math.round((top * FIGHTS.assist.crewin.hurt) / 100));
  }
  return { ok: true, notice: null };
}

/** Who waits at the door, for the page before the fight (its first Pokémon and how many). Doesn't change `b`. */
export function foePreview(b: DominionBlock, run: Pick<RunState, 'party'>): { name: string; species: string; level: number; count: number; cls: string | null; leaderId: string | null } | null {
  const f = b.field.fight;
  if (!f) return null;
  const c = structuredClone(b);
  if (f.foe === 'rival') {
    const s = rivalSide(c, run, f);
    return s.species[0] ? { name: s.name, species: s.species[0], level: s.level, count: s.species.length, cls: s.classId, leaderId: s.leaderId } : null;
  }
  if (f.foe === 'hero' || f.foe === 'sidekick') {
    const t = heroTeam(c, run, f.foe, f.why);
    return t.team[0] ? { name: t.name, species: t.team[0].species, level: t.team[0].level, count: t.team.length, cls: t.cls, leaderId: null } : null;
  }
  const d = districtDef(f.district);
  if (!d) return null;
  const x = foeOf(c, run, f.foe, d, targetDef(f.target)?.target ?? null, f.target);
  return { name: x.name, species: x.species, level: x.level, count: 1, cls: null, leaderId: null };
}

// ---------- phase two (mockup `phase`) ----------

export const phaseDue = (f: FieldFight | null | undefined): boolean => !!f && f.why === 'rival' && f.action === 'boss-raid' && f.phase !== 2;
/** A rival Boss beaten at the door rallies once: the same fight waits again, phase two. Mutates `b`; null if not. */
export function phaseTwo(b: DominionBlock): string[] | null {
  const f = b.field.fight;
  if (!phaseDue(f)) return null;
  f!.phase = 2;
  f!.begun = false;
  if (f!.assist === null) delete f!.assist;
  const team = teamDef(f!.racket ?? '');
  return [fill(FIGHTS.phase.note, { boss: team?.boss.name ?? 'The Boss' })];
}
setPhaseHook(phaseTwo);

/** Phase two waits on its page (the fight is set up again and not begun). */
export const phaseWaiting = (b: DominionBlock): boolean => b.field.fight?.phase === 2 && !b.field.fight.begun && b.field.fight.assist === undefined;

// ---------- the Betrayal (mockup `legend`) ----------

export type BetrayalDef = FightsFile['betrayal']['teams'][string];
export const betrayalOf = (team: string | null | undefined): BetrayalDef | null => (team ? FIGHTS.betrayal.teams[team] ?? null : null);
export const betrayalLevel = (e: BetrayalDef, party: readonly Mon[]): number => Math.min(e.level, Math.max(1, ...party.map((m) => m.level)) + FIGHTS.betrayal.over);
export const betrayalWaiting = (b: DominionBlock): boolean => b.field.fight?.why === 'betrayal' && !b.field.fight.begun;

// The Boss falls for good (phase two won): their admin turns, and the Legendary waits at the door. Once a team.
addFightHook((b, _run, fight, outcome) => {
  if (outcome !== 'win' || fight.why !== 'rival' || fight.action !== 'boss-raid' || b.field.fight) return [];
  const e = betrayalOf(fight.racket);
  const x = jobxOf(b);
  if (!e || (x.betrayed ?? []).includes(fight.racket!)) return [];
  x.betrayed = [...(x.betrayed ?? []), fight.racket!];
  b.field.fight = { why: 'betrayal', foe: 'betrayal', begun: false, action: null, target: e.legend, district: DOMINION_DATA.field.hq, pass: false, big: false, wager: 0, racket: fight.racket };
  return [];
});
addFightSettler('betrayal', (_content, _b, run, fight, outcome) => {
  const e = betrayalOf(fight.racket);
  const team = teamDef(fight.racket ?? '');
  const admin = team?.admins.find((a) => a.id === e?.admin)?.name ?? 'The admin';
  const legend = nice(e?.legend ?? 'it');
  const got = outcome === 'win' && !!e && [...run.party, ...(run.box ?? [])].some((m) => m.speciesId === e.legend);
  const line = got ? FIGHTS.betrayal.caught : outcome === 'lose' ? FIGHTS.betrayal.lost : FIGHTS.betrayal.won;
  return [fill(line, { legend, admin })];
});

// ---------- setting up the battle (fight.ts calls this once the teams are made) ----------

/** The Boss's powers by the same rule, phase two's rally, the crew's help. Mutates `run.battle`. */
export function setUpFight(content: Content, b: DominionBlock, run: RunState, leaderId: string | null): void {
  const f = b.field.fight, battle = run.battle;
  if (!f || !battle) return;
  if (leaderId) {
    const plan = planBossGimmicks(content, leaderId, battle.enemyTeam, powerSlots(content, b), run.disabledMechanics);
    battle.transform.bossPlan = plan;
    battle.transform.enemyMechanics = [...new Set(Object.values(plan))];
  }
  if (f.phase === 2) battle.enemyStages.atk = Math.min(6, (battle.enemyStages.atk ?? 0) + FIGHTS.phase.atk);
  const lead = battle.enemyTeam[battle.enemyIndex];
  if (f.assist?.cut && lead) lead.hp = Math.max(1, Math.floor((lead.hp * (100 - f.assist.cut)) / 100));
}
/** The help's line for the page after it (who hit which Pokémon, its HP left). */
export function assistLine(content: Content, b: DominionBlock, run: RunState): string | null {
  const f = b.field.fight, lead = run.battle?.enemyTeam[run.battle.enemyIndex];
  if (!f?.assist?.cut || !lead) return null;
  const who = f.assist.by.map((id) => b.members.find((m) => m.id === id)?.name ?? id).join(', ');
  return fill(FIGHTS.assist.used, { who, mon: content.species.get(lead.speciesId)?.name ?? nice(lead.speciesId), hp: Math.round((100 * lead.hp) / Math.max(1, maxHp(content, lead))) });
}

// ---------- the steps (session.ts sends them here) ----------

export function fightsStep(content: Content, run: RunState, a: { t: 'power'; kind: string } | { t: 'assist'; by: string[] }): { ok: boolean; block: DominionBlock; notice: string | null } {
  const b = structuredClone(run.expansion!.dominion!);
  const out = a.t === 'power' ? carry(content, b, run, a.kind) : assist(content, b, a.by);
  return { ok: out.ok, block: b, notice: out.notice };
}
