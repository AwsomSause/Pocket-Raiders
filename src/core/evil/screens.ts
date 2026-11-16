// HOENN_TEAMS part 7: the looks the New UI gives the team's own moments. This file only reads the run and the event
// data and says what to draw: the Mission Briefing (7.3) and its Result (7.4), the Rank-Up (7.2), the Leader's Table
// (7.6) and the two Final Choice screens (7.7, 7.14). The choices, rolls and effects stay the event's own.

import type { Content, EventDef } from '../contentSchema';
import type { RunState } from '../state';
import { teamSkyOf } from './teamSky';

export type Reaction = '' | 'down' | 'hard' | 'lean' | 'away';
export interface Face { name: string; sprite: string; react: Reaction[]; apart?: boolean }
export interface FinalLook { kind: 'final'; centre: 'red' | 'blue' | 'sky'; says: string[]; faces: Face[] }
export interface BriefingLook { kind: 'briefing'; team: 'magma' | 'aqua'; order: number; title: string; by: string; quote: string; numbers: string[][]; withYou: string | null; tip: number | null }
export interface TableLook { kind: 'table'; team: 'magma' | 'aqua'; seats: { name: string; sprite: string }[]; pins: { label: string; x: number; y: number }[] }
export type EvilLook = FinalLook | BriefingLook | TableLook;
export interface RankUpLook { team: string; color: string; title: string; rank: number; office: boolean; byLeader: boolean; unlocks: string[]; bunkFront: boolean; leader: string; lt: string; grunt: string }
export interface ResultLook { team: 'magma' | 'aqua'; done: string; changed: string[]; voice: string | null }

const HOENN = { mg: 'magma', aq: 'aqua' } as const;
const BUDDY = { magma: 'Ottoway', aqua: 'Marisca' } as const;
/** The Admin on the table's other side (no trainer picture yet, so a silhouette). */
const ADMIN = { magma: 'Admin Courtney', aqua: 'Admin Matt' } as const;
const flag = (run: RunState, k: string): boolean => Number(run.story.flags[`ev:${k}`] ?? 0) > 0;
const teamOf = (content: Content, id: string) => content.evilTeams.teams.find((t) => t.id === id);
const hoennTeam = (eventId: string): 'magma' | 'aqua' | null => HOENN[eventId.slice(0, 2) as 'mg' | 'aq'] ?? null;
/** The orders, in the order they come (the briefing's number). */
const ORDERS = ['errand', 'act2', 'prize', 'spy', 'weather', 'op-weather-vane', 'op-dive-bell', 'op-ash-round', 'op-ferry-dues', 'op-meteor-shard', 'op-recruiting'];
/** 7.4: the one line of consequence, in a human voice, for each Operation's three ways (By the Book, Quietly, Refuse). */
const VOICE: Record<string, [string, string, string]> = {
  'weather-vane': [`A harbourmaster, after: "Nobody said it'd blow like that. Nobody said."`, `A fisherman: "Forecast said batten down. So we did. Glad we did."`, `A Castform on the vane turns, and turns back.`],
  'dive-bell': [`A widow at the dock: "That was his boat. That was his."`, `A diver, later: "Somebody's left flowers on the buoy."`, `The wreck stays where it is.`],
  'ash-round': [`The glassblower: "No ash, no glass. No glass, no shop."`, `The glassblower: "A full sack! Who do I thank?"`, `The ash keeps falling, for everybody.`],
  'ferry-dues': [`A ferry captain: "Five hundred. I'll have to stop the school run."`, `A ferry captain: "Someone mended my rail. In the night. Like elves."`, `The boats sail. Somebody else collects.`],
  'meteor-shard': [`A Lunatone in the falls goes dim, and stays dim.`, `A ranger: "Funny. The falls are glowing again."`, `The shard stays in the falls.`],
  'recruiting': [`A mother: "He signed up. He's fifteen. He signed up."`, `A boy on the pier: "There's a last page? Nobody said there was a last page."`, `Lilycove stays bored, and safe.`],
};
/** 7.2: what each rank unlocks, as three labels. */
const UNLOCKS: Record<number, [string, string, string]> = {
  2: ['Missions', 'Team shop', 'The radio'],
  3: ['Better pay', 'Hard missions', 'The bunkmate asks more'],
  4: ['Lead a squad', 'The Counter-Offer', 'The Weather Institute'],
  5: ["The Leader's Table", 'Mt. Pyre', 'The orbs'],
  6: ['The leader confides', 'The Final Choice', 'Take it all'],
};

function numbersOf(ev: EventDef): string[][] {
  return ev.choices.map((c) => {
    const out: string[] = [];
    for (const e of c.success?.effects ?? []) {
      if (e.kind === 'evil') {
        if (e.standing) out.push(`Standing ${e.standing > 0 ? '+' : '−'}${Math.abs(e.standing)}`);
        if (e.suspicion) out.push(`Suspicion ${e.suspicion > 0 ? '+' : '−'}${Math.abs(e.suspicion)}`);
        if (e.side) out.push(`Joins ${e.side}`);
      }
      if (e.kind === 'money') out.push(`Pay ₽${e.amount}`);
      if (e.kind === 'attribute' && e.key === 'goodEvil') out.push(`Kindness ${e.amount > 0 ? '+' : '−'}${Math.abs(e.amount)}`);
    }
    if (c.chance !== undefined && c.chance < 1) out.push(`Noticed? ${Math.round((1 - c.chance) * 100)}%`);
    if (out.length === 0) out.push('No change');
    return out;
  });
}

/** The look the New UI gives this event while its choices are up, or null for the ordinary look. */
export function evilLook(content: Content, run: RunState, eventId: string): EvilLook | null {
  const ev = content.events.get(eventId);
  if (!ev) return null;
  const side = hoennTeam(eventId);
  if (eventId === 'sky-climax') {
    const s = teamSkyOf(run);
    const crew = (s?.grunts ?? []).slice(0, 10).map((g, i): Face => ({ name: g.name, sprite: ['boss.npc_swimmer_m', 'boss.npc_ruinmaniac', 'boss.npc_youngster', 'boss.npc_lass', 'boss.npc_hiker'][i % 5]!, react: ['', g.loyalty <= 4 ? 'lean' : 'down', g.loyalty >= 8 ? 'lean' : '', ''], apart: g.cracked > 0 || g.loyalty <= 2 }));
    return { kind: 'final', centre: 'sky', says: ['"For everyone."', '"For us."', '"Between them."', '"Talk."'], faces: [{ name: 'Zinnia', sprite: 'boss.zinnia', react: ['lean', 'away', '', ''] }, ...crew] };
  }
  if (!side) return null;
  const team = teamOf(content, side)!;
  const other = teamOf(content, side === 'magma' ? 'aqua' : 'magma')!;
  const p = eventId.slice(0, 3);
  const rest = eventId.slice(3);
  if (rest === 'final-choice') {
    const faces: Face[] = [
      { name: team.ranks.leader.name, sprite: team.ranks.leader.sprite, react: ['', 'hard', 'hard', 'hard'] },
      { name: team.ranks.executive.name, sprite: team.ranks.executive.sprite, react: ['', 'down', 'hard', ''] },
      { name: BUDDY[side], sprite: team.ranks.grunt.sprite, react: ['down', '', '', ''] },
      { name: 'Quince', sprite: team.ranks.grunt.sprite, react: ['', '', '', 'lean'] },
      { name: other.ranks.leader.name, sprite: other.ranks.leader.sprite, react: ['hard', '', 'lean', 'hard'] },
    ];
    if (flag(run, 'hoenn-freed-spy')) faces.push({ name: 'The freed spy', sprite: other.ranks.grunt.sprite, react: ['', 'lean', 'lean', ''] });
    return { kind: 'final', centre: side === 'magma' ? 'red' : 'blue', says: ['"Wake it."', '"No."', '"Give it to them."', '"Neither of you."'], faces };
  }
  if (rest === 'table') {
    return {
      kind: 'table', team: side,
      seats: [{ name: team.ranks.leader.name, sprite: team.ranks.leader.sprite }, { name: team.ranks.executive.name, sprite: team.ranks.executive.sprite }, { name: ADMIN[side], sprite: '' }],
      pins: [{ label: 'Fallarbor', x: 22, y: 18 }, { label: 'Slateport', x: 34, y: 72 }, { label: 'Lilycove', x: 74, y: 30 }],
    };
  }
  const order = ORDERS.indexOf(rest);
  if (order >= 0 || /^The (briefing|order):/.test(ev.intro)) {
    const quote = /(?:briefing|order): ([^.]+\.)/.exec(ev.intro)?.[1] ?? ev.name;
    const along = new RegExp(`${BUDDY[side]}[^:]*: "([^"]+)"`).exec(ev.intro)?.[1] ?? null;
    const tipAt = flag(run, 'hoenn-double-agent') && rest.startsWith('op-') ? ev.choices.length : null;
    return { kind: 'briefing', team: side, order: (order >= 0 ? order : ORDERS.length) + 1, title: ev.name.replace(/^Operation: /, '').toUpperCase(), by: team.ranks.executive.name, quote, numbers: numbersOf(ev), withYou: along ? `${BUDDY[side]}: "${along}"` : null, tip: tipAt };
  }
  void p;
  return null;
}

/** 7.4: the Result form for an order, once a choice is made. */
export function resultLook(content: Content, eventId: string, choice: number, label: string, changes: string[], text: string): ResultLook | null {
  const side = hoennTeam(eventId);
  const look = side ? content.events.get(eventId) : null;
  if (!side || !look) return null;
  const rest = eventId.slice(3);
  if (!(ORDERS.includes(rest) || /^The (briefing|order):/.test(look.intro))) return null;
  const op = rest.startsWith('op-') ? VOICE[rest.slice(3)] : undefined;
  const way = /^Refuse/.test(label) ? 2 : /^(Quiet|Tip)/.test(label) ? 1 : 0;
  const voice = op?.[way] ?? /([A-Z][^:"]{2,40}): "([^"]+)"/.exec(text)?.slice(1).join(': "').concat('"') ?? null;
  void choice;
  return { team: side, done: label, changed: changes, voice };
}

/** 7.2: the Rank-Up screen, when an event's changes say the rank went up. */
export function rankUpLook(content: Content, run: RunState, changes: string[]): RankUpLook | null {
  const m = changes.map((c) => /you are (.+) now \(Rank (\d)\)/.exec(c)).find(Boolean);
  const s = run.story.evil;
  if (!m || !s?.teamId) return null;
  const team = teamOf(content, s.teamId);
  if (!team) return null;
  const rank = Number(m[2]);
  return {
    team: team.name, color: team.color, title: m[1]!, rank,
    office: rank >= 6, byLeader: rank >= 5,
    unlocks: [...(UNLOCKS[rank] ?? ['A new title', 'More trust', 'Harder work'])],
    bunkFront: Number(run.story.flags['ev:hoenn-bunkmate-trust'] ?? 0) >= 2,
    leader: team.ranks.leader.sprite, lt: team.ranks.executive.sprite, grunt: team.ranks.grunt.sprite,
  };
}
