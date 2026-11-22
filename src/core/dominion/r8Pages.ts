// DOMINION redesign R8 (pass 50 of plans/evil-mode-rework/redesign-50): the view models for the pages R8 adds where the
// game had the mechanic but no screen: the Chair's waiting room (`queue`) and favour ledger (`favours`), the Night
// (`night`), the Underworld (`underworld`) and the Gym case (`gymcase`). Plain data read from the block, no rolls.

import { cardById, cardText } from './chair';
import { face, type Face } from './chairScreens';
import { crewOf, rankWord, taskById } from './crew';
import { DOMINION_DATA } from './data';
import { statusOf } from './field';
import { ownedGyms } from './growth';
import { regionsInRun } from './regions';
import type { CourtCard, DominionBlock, Member } from './schema';

const SECT: Record<CourtCard['sect'], string> = { crew: 'Crew', town: 'Town', money: 'Money', law: 'The law', rival: 'Rival', hero: 'Hero', gyms: 'Gyms', pokemon: 'Pokémon', empire: 'Empire', regular: 'Regular', crisis: 'Crisis' };
const unquote = (t: string): string => t.replace(/^"|"$/g, '');

// ---------- the waiting room ----------

export interface QueueRow { face: Face; wants: string; mood: string; tag: Face['tag']; crisis: boolean; door: boolean }
export interface QueueModel { day: number; rows: QueueRow[]; count: number; left: number }

/** Who sits on the bench tonight: the visitor at the door first, then the rest of the docket, in order. */
export function queueModel(b: DominionBlock): QueueModel | null {
  const ch = b.chair;
  if (!ch?.open) return null;
  const rows: QueueRow[] = ch.docket.slice(ch.at).flatMap((d, i) => {
    const c = cardById(d.card);
    if (!c) return [];
    const f = face(b, c, d.member);
    return [{ face: f, wants: unquote(cardText(b, c.ask, d.member)), mood: f.tag === 'grudge' ? 'Grudge' : f.tag === 'favour' ? 'Favour' : c.crisis ? 'Crisis' : SECT[c.sect], tag: f.tag, crisis: !!c.crisis, door: i === 0 }];
  });
  return { day: b.day, rows, count: ch.docket.length, left: rows.length };
}

// ---------- the favour ledger ----------

export interface FavourRow { name: string; look: string; why: string; size: 'Favour' | 'Grudge' | 'Deal'; colour: string }
export interface FavoursModel { owe: FavourRow[]; owed: FavourRow[] }

/** The card a tag came from: the last one seen whose answers tag that person. */
function tagCard(b: DominionBlock, who: string, member: Member | undefined): { c: CourtCard; label: string } | null {
  let best: { c: CourtCard; label: string; day: number } | null = null;
  for (const [id, day] of Object.entries(b.chair?.seen ?? {})) {
    const c = cardById(Number(id));
    if (!c || (member ? c.who !== 'member' : c.who !== who)) continue;
    const ans = [c.a, c.b].find((a) => a.fx.some((e) => e.k === 'tag'));
    if (ans && (!best || day > best.day)) best = { c, label: cardText(b, ans.label, member?.id ?? null), day };
  }
  return best;
}

/** Who owes the Boss (Favours, and weekly deals that pay) and who the Boss owes (Grudges, deals that cost). */
export function favoursModel(b: DominionBlock): FavoursModel {
  const ch = b.chair;
  const owe: FavourRow[] = [], owed: FavourRow[] = [];
  for (const [who, tag] of Object.entries(ch?.tags ?? {})) {
    const m = b.members.find((x) => x.id === who);
    const src = tagCard(b, who, m);
    const f = m ? { name: m.name, look: m.look } : src ? face(b, src.c, null) : { name: who, look: '' };
    const row: FavourRow = {
      name: f.name, look: f.look, size: tag === 'favour' ? 'Favour' : 'Grudge', colour: tag === 'favour' ? '#4caf50' : '#9a4fd0',
      why: src ? `${tag === 'favour' ? 'You chose' : 'You said'}: ${unquote(src.label)}` : tag === 'favour' ? 'Owes you one' : 'Holds it against you',
    };
    (tag === 'favour' ? owe : owed).push(row);
  }
  for (const d of ch?.deals ?? []) {
    const c = cardById(d.card);
    if (!c || !d.n) continue;
    const f = face(b, c, null);
    const row: FavourRow = { name: f.name, look: f.look, size: 'Deal', colour: '#c9a24a', why: `${d.n > 0 ? 'Pays you' : 'You pay'} ₽${Math.abs(d.n).toLocaleString('en-US')} a week` };
    (d.n > 0 ? owe : owed).push(row);
  }
  return { owe, owed };
}

// ---------- the Night ----------

export interface NightRow { name: string; look: string; task: string; does: string }

/** Tonight's crew at work (the first four): their task and what it does, or why they are out. */
export function nightRows(b: DominionBlock): NightRow[] {
  return b.members.slice(0, 4).map((m) => {
    const c = crewOf(m);
    const t = taskById(c.task);
    const out = c.out ? { hurt: 'Hurt, resting', jail: 'In a cell', held: 'Held by the rivals' }[c.out.why] : null;
    return { name: m.name, look: m.look, task: out ? rankWord(m.rank) : t?.name ?? rankWord(m.rank), does: out ? `${out} · ${c.out!.days} day${c.out!.days === 1 ? '' : 's'}` : t?.does ?? 'Off tonight' };
  });
}

// ---------- the Underworld ----------

export interface UnderTeam { id: string; name: string; sprite: string; where: string; line: string; state: 'met' | 'next' | 'lock'; here: boolean }
export interface UnderworldModel { teams: UnderTeam[]; met: number }

const SPRITE: Record<string, string> = { 'rocket-remnants': 'zg-rocket', 'skull-aether': 'zg-skull' };

/** Every evil team, one per column (Team Rocket's two regions read as one), and how far the run has come to each. */
export function underworldModel(b: DominionBlock): UnderworldModel {
  const RG = DOMINION_DATA.regions;
  const here = b.realm?.at ?? 'kanto';
  const seen = new Set([here, ...(b.realm?.held ?? []).map((h) => h.id)]);
  const inRun = regionsInRun(b);
  const out: UnderTeam[] = [];
  for (const t of DOMINION_DATA.rivals.teams) {
    const prev = out.find((x) => x.name === t.name || (t.id.startsWith('rocket') && x.id.startsWith('rocket')));
    const rname = RG.regions[t.region]?.name ?? t.region;
    const state: UnderTeam['state'] = seen.has(t.region) ? 'met' : inRun.includes(t.region) ? 'next' : 'lock';
    if (prev) {
      prev.where = `${prev.where} · ${rname}`;
      if (t.region === here) { prev.line = `${t.boss.name} runs it now`; prev.here = true; }
      if (state === 'met') prev.state = 'met';
      continue;
    }
    out.push({
      id: t.id, name: t.name, sprite: SPRITE[t.id] ?? `zg-${t.id.split('-')[0]}`, where: rname, state, here: t.region === here,
      line: t.region === here ? `${t.boss.name} runs it now` : state === 'lock' ? 'Later' : `${t.boss.name} leads it`,
    });
  }
  const teams = out.slice(0, 7);
  return { teams, met: teams.filter((t) => t.state === 'met').length };
}

// ---------- the Gym case ----------

export interface GymSlot { id: string; town: string; district: string; leader: string; type: string; who: 'nova' | 'rival' | 'next' | 'free'; word: string }
export interface GymCaseModel { gyms: GymSlot[]; mine: number; rival: string }

/** The region's eight Gyms: yours (bought, broken, blackmailed or converted), the rival team's (their district), free. */
export function gymCaseModel(b: DominionBlock): GymCaseModel {
  const owned = ownedGyms(b);
  const rival = DOMINION_DATA.field.rivalTeam.replace(/^Team /, '');
  const team = (b.teamName ?? 'Yours').replace(/^Team /, '');
  let next = false;
  const gyms = DOMINION_DATA.growth.gyms.filter((g) => b.field.districts[g.district]).map((g): GymSlot => {
    const d = b.field.districts[g.district]!;
    const town = DOMINION_DATA.field.districts.find((x) => x.id === g.district)?.name ?? g.district;
    let who: GymSlot['who'] = owned.includes(g.id) ? 'nova' : statusOf(d) === 'rival' ? 'rival' : 'free';
    if (who === 'free' && !next) { who = 'next'; next = true; }
    return { id: g.id, town, district: g.district, leader: g.leader, type: g.type, who, word: who === 'nova' ? team : who === 'rival' ? rival : who === 'next' ? 'Next' : 'Free' };
  });
  return { gyms, mine: gyms.filter((g) => g.who === 'nova').length, rival };
}
