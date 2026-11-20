// The Rotom Phone of the Phantom UI (mock-up `phone`): the run read back as chats. Each chat is built from this run
// only: what a person said to you (the run log's own lines), a rival's standing (the Rival Report's own numbers) and
// Rotom's notes on where the run is. A reply is either a door to a real page (the rival's file, the run log, the
// Pokédex) or a short line of talk that is kept beside the chat and changes nothing. Pure, never saved, no rolls.

import type { ReportRow } from '../rivals/report';
import type { LogEntry } from './uiPrefs';

export interface PhoneMsg { from: 'them' | 'me' | 'rotom'; text: string }
/** `go`: 'send' keeps the line in the chat; the others open that page. */
export interface PhoneReply { label: string; small: string; go: 'send' | 'rivals' | 'log' | 'dex' | 'party' }
export interface PhoneChat {
  id: string;
  name: string;
  kind: 'rotom' | 'rival' | 'person';
  /** The line under the name in the list. */
  last: string;
  /** Lines of theirs that came in since the chat was last read. */
  unread: number;
  /** How many lines of theirs the run holds (what "read" is counted against). */
  heard: number;
  msgs: PhoneMsg[];
  replies: PhoneReply[];
}

export interface PhoneFacts {
  /** "Stage 14 of 30 · Johto". */
  where: string;
  levelCap: number;
  party: readonly { name: string; hp: number; max: number }[];
}

/** How many of a chat's lines fit the page. */
export const PHONE_LINES = 4;
/** How many people (beside Rotom and the rivals) the list holds. */
export const PHONE_PEOPLE = 3;

/** What the player has typed back and how far each chat was read. One run's worth: another run starts it empty. */
export class PhoneBook {
  private key = '';
  private sentLines: Record<string, string[]> = {};
  private readAt: Record<string, number> = {};
  scope(key: string): void {
    if (key === this.key) return;
    this.key = key;
    this.sentLines = {};
    this.readAt = {};
  }
  sent(chat: string): readonly string[] {
    return this.sentLines[chat] ?? [];
  }
  /** Keeps a reply (the last three of a chat), once: the same line twice in a row is not said again. */
  send(chat: string, text: string): boolean {
    const list = (this.sentLines[chat] ??= []);
    if (list[list.length - 1] === text) return false;
    list.push(text);
    if (list.length > 3) list.shift();
    return true;
  }
  read(chat: string): number {
    return this.readAt[chat] ?? 0;
  }
  markRead(chat: string, count: number): void {
    this.readAt[chat] = Math.max(this.readAt[chat] ?? 0, count);
  }
}
export const phoneBook = new PhoneBook();

const said = (log: readonly LogEntry[], is: (who: string) => boolean): string[] => log.filter((e) => e.kind === 'say' && !!e.who && is(e.who)).map((e) => e.text);
const isRival = (name: string) => (who: string): boolean => who === name || who.endsWith(` ${name}`);
const short = (t: string, n = 34): string => (t.length > n ? `${t.slice(0, n - 1).trimEnd()}…` : t);

/** The reply a rival gets: it follows who is ahead. */
export const rivalTalk = (lead: number): string => (lead > 0 ? 'I am catching up.' : lead < 0 ? 'Try to keep up.' : 'Bring it on.');

export function phoneChats(input: { facts: PhoneFacts; rivals: readonly ReportRow[]; log: readonly LogEntry[]; book: PhoneBook }): PhoneChat[] {
  const { facts, rivals, log, book } = input;
  const chats: PhoneChat[] = [];
  const withSent = (id: string, msgs: PhoneMsg[]): PhoneMsg[] => [...msgs, ...book.sent(id).map((text): PhoneMsg => ({ from: 'me', text }))];

  for (const r of rivals) {
    const id = `rival:${r.id}`, lines = said(log, isRival(r.name));
    const file = `Bzzt! ${r.name}: ${r.leadText.toLowerCase()}. ${r.personality}, ${r.meetings} ${r.meetings === 1 ? 'meeting' : 'meetings'} so far. Has seen ${r.seenMoves} of your moves and ${r.seenSpecies} of your Pokémon.`;
    chats.push({
      id,
      name: r.name,
      kind: 'rival',
      last: lines.length ? short(lines[lines.length - 1]!) : r.leadText,
      unread: Math.max(0, lines.length - book.read(id)),
      heard: lines.length,
      msgs: withSent(id, [...lines.slice(-2).map((text): PhoneMsg => ({ from: 'them', text })), { from: 'rotom', text: file }]),
      replies: [{ label: rivalTalk(r.lead), small: 'Send', go: 'send' }, { label: 'Rotom, show me their file.', small: 'Opens Rivals', go: 'rivals' }],
    });
  }

  // Everyone else who spoke to you this run, the latest first.
  const rivalNames = rivals.map((r) => isRival(r.name));
  const people: string[] = [];
  for (let i = log.length - 1; i >= 0 && people.length < PHONE_PEOPLE; i--) {
    const e = log[i]!;
    if (e.kind !== 'say' || !e.who || e.who === 'You' || people.includes(e.who) || rivalNames.some((is) => is(e.who!))) continue;
    people.push(e.who);
  }
  for (const who of people) {
    const id = `person:${who}`, lines = said(log, (w) => w === who);
    chats.push({
      id,
      name: who,
      kind: 'person',
      last: short(lines[lines.length - 1] ?? ''),
      unread: Math.max(0, lines.length - book.read(id)),
      heard: lines.length,
      msgs: withSent(id, lines.slice(-3).map((text): PhoneMsg => ({ from: 'them', text }))),
      replies: [{ label: 'Got it. Thanks.', small: 'Send', go: 'send' }, { label: 'Rotom, read that back.', small: 'Opens the run log', go: 'log' }],
    });
  }

  const down = facts.party.filter((m) => m.hp <= 0), hurt = facts.party.filter((m) => m.hp > 0 && m.hp * 2 < m.max);
  const team = down.length
    ? `${down.map((m) => m.name).join(', ')} ${down.length === 1 ? 'has' : 'have'} fainted. Heal before the next fight.`
    : hurt.length
      ? `${hurt.map((m) => m.name).join(', ')} ${hurt.length === 1 ? 'is' : 'are'} under half HP.`
      : 'Your team is in good shape.';
  const lines = log.filter((e) => e.kind !== undefined).length;
  chats.push({
    id: 'rotom',
    name: 'Rotom',
    kind: 'rotom',
    last: short(team),
    unread: 0,
    heard: 0,
    msgs: withSent('rotom', [
      { from: 'rotom', text: `Bzzt! ${facts.where}. Level cap ${facts.levelCap}.` },
      { from: 'rotom', text: team },
      { from: 'rotom', text: lines ? `I have ${lines} ${lines === 1 ? 'line' : 'lines'} of this run on record.` : 'Nothing said in this run yet.' },
    ]),
    replies: [{ label: 'Read the run back to me.', small: 'Opens the run log', go: 'log' }, { label: 'Open the Pokédex.', small: 'Opens the Pokédex', go: 'dex' }, { label: 'Show me my team.', small: 'Opens the Party', go: 'party' }],
  });
  // A chat shows its last lines; the list keeps the rivals first, then people, then Rotom.
  for (const c of chats) c.msgs = c.msgs.slice(-PHONE_LINES);
  return chats;
}
