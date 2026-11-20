import { describe, expect, it } from 'vitest';
import { PHANTOM_VERSIONS } from '../../src/core/presentation/phantom';
import { PHONE_LINES, PHONE_PEOPLE, PhoneBook, phoneChats, rivalTalk, type PhoneFacts } from '../../src/core/presentation/phone';
import type { LogEntry } from '../../src/core/presentation/uiPrefs';
import type { ReportRow } from '../../src/core/rivals/report';
import { pageOf } from '../../src/ui/phantom/kit';
import { phPhone, type PhoneModel } from '../../src/ui/phantom/screens/phone';

const PH = PHANTOM_VERSIONS[0]!;
const facts = (over: Partial<PhoneFacts> = {}): PhoneFacts => ({ where: 'Stage 14 of 30 · Johto', levelCap: 150, party: [{ name: 'Gengar', hp: 80, max: 100 }, { name: 'Pidgeot', hp: 90, max: 120 }], ...over });
const rival = (over: Partial<ReportRow> = {}): ReportRow => ({ id: 'r1', name: 'Silver', role: 'rival', personality: 'Cold', lead: 2, leadText: 'You lead by 2', marks: [], feelings: [], meetings: 3, seenMoves: 5, seenSpecies: 2, ...over } as ReportRow);
const say = (who: string, text: string, at = 0): LogEntry => ({ at, who, text, kind: 'say' } as LogEntry);
const chats = (log: LogEntry[], rivals: ReportRow[] = [], book = new PhoneBook(), f = facts()) => phoneChats({ facts: f, rivals, log, book });

describe('the Rotom Phone: who is in it', () => {
  it('an empty run still has Rotom, with where the run is and three doors', () => {
    const list = chats([]);
    expect(list.map((c) => c.id)).toEqual(['rotom']);
    const r = list[0]!;
    expect(r.msgs[0]!.text).toBe('Bzzt! Stage 14 of 30 · Johto. Level cap 150.');
    expect(r.msgs[1]!.text).toBe('Your team is in good shape.');
    expect(r.msgs[2]!.text).toBe('Nothing said in this run yet.');
    expect(r.replies.map((x) => x.go)).toEqual(['log', 'dex', 'party']);
    expect(r.unread).toBe(0);
  });

  it('Rotom says who has fainted, or who is under half HP', () => {
    const down = chats([], [], new PhoneBook(), facts({ party: [{ name: 'Gengar', hp: 0, max: 100 }, { name: 'Pidgeot', hp: 10, max: 120 }] }));
    expect(down[0]!.msgs[1]!.text).toBe('Gengar has fainted. Heal before the next fight.');
    const hurt = chats([], [], new PhoneBook(), facts({ party: [{ name: 'Gengar', hp: 49, max: 100 }, { name: 'Pidgeot', hp: 10, max: 120 }] }));
    expect(hurt[0]!.msgs[1]!.text).toBe('Gengar, Pidgeot are under half HP.');
    // Exactly half is not "under half".
    expect(chats([], [], new PhoneBook(), facts({ party: [{ name: 'Gengar', hp: 50, max: 100 }] }))[0]!.msgs[1]!.text).toBe('Your team is in good shape.');
  });

  it('the rivals come first, then the people who spoke (the latest first), then Rotom', () => {
    const log = [say('Prof. Oak', 'Welcome!'), say('Rival Silver', 'Out of my way.'), say('Nurse Joy', 'All healed.'), say('You', 'Thanks.'), { at: 0, text: 'Stage 2', who: 'Stage 2', kind: 'stage' } as LogEntry];
    const list = chats(log, [rival()]);
    expect(list.map((c) => c.id)).toEqual(['rival:r1', 'person:Nurse Joy', 'person:Prof. Oak', 'rotom']);
    // A rival's lines are their own, with or without a title in front of the name.
    expect(list[0]!.msgs.filter((m) => m.from === 'them').map((m) => m.text)).toEqual(['Out of my way.']);
    expect(list[0]!.msgs.at(-1)!.text).toContain('Silver: you lead by 2. Cold, 3 meetings so far. Has seen 5 of your moves and 2 of your Pokémon.');
    expect(list[0]!.replies.map((x) => x.go)).toEqual(['send', 'rivals']);
    expect(list[1]!.replies.map((x) => x.go)).toEqual(['send', 'log']);
    expect(list[3]!.msgs[2]!.text).toBe('I have 5 lines of this run on record.');
  });

  it('holds three people at most, and a rival who has said nothing shows their standing', () => {
    const log = ['A', 'B', 'C', 'D', 'E'].map((w) => say(w, `I am ${w}.`));
    const list = chats(log, [rival({ meetings: 1 })]);
    expect(list.filter((c) => c.kind === 'person').map((c) => c.name)).toEqual(['E', 'D', 'C']);
    expect(list.filter((c) => c.kind === 'person')).toHaveLength(PHONE_PEOPLE);
    expect(list[0]!.last).toBe('You lead by 2');
    expect(list[0]!.msgs.at(-1)!.text).toContain('1 meeting so far');
  });

  it('a long line is cut in the list and a chat shows its last lines only', () => {
    const long = 'This is a very long line that will not fit the row under the name.';
    const list = chats([say('Oak', 'one'), say('Oak', 'two'), say('Oak', 'three'), say('Oak', long)]);
    expect(list[0]!.last.length).toBeLessThanOrEqual(34);
    expect(list[0]!.last.endsWith('…')).toBe(true);
    expect(list[0]!.msgs.map((m) => m.text)).toEqual(['two', 'three', long]);
    const book = new PhoneBook();
    book.send('person:Oak', 'Got it. Thanks.');
    book.send('person:Oak', 'Again.');
    const more = chats([say('Oak', 'one'), say('Oak', 'two'), say('Oak', 'three')], [], book);
    expect(more[0]!.msgs).toHaveLength(PHONE_LINES);
    expect(more[0]!.msgs.map((m) => m.from)).toEqual(['them', 'them', 'me', 'me']);
  });

  it('the reply to a rival follows who is ahead', () => {
    expect(rivalTalk(2)).toBe('I am catching up.');
    expect(rivalTalk(-1)).toBe('Try to keep up.');
    expect(rivalTalk(0)).toBe('Bring it on.');
  });
});

describe('the Rotom Phone: what the player sent and read', () => {
  it('a sent line is kept once in a row, three at most, and only for this run', () => {
    const book = new PhoneBook();
    book.scope('seed#1');
    expect(book.send('rotom', 'a')).toBe(true);
    expect(book.send('rotom', 'a')).toBe(false);
    expect(book.send('rotom', 'b')).toBe(true);
    expect(book.send('rotom', 'a')).toBe(true);
    expect(book.send('rotom', 'c')).toBe(true);
    expect(book.sent('rotom')).toEqual(['b', 'a', 'c']);
    expect(book.sent('person:Oak')).toEqual([]);
    book.scope('seed#1');
    expect(book.sent('rotom')).toHaveLength(3);
    book.scope('seed#2');
    expect(book.sent('rotom')).toEqual([]);
  });

  it('unread counts their lines since the chat was read, and reading never goes back', () => {
    const book = new PhoneBook();
    const log = [say('Oak', 'one'), say('Oak', 'two')];
    expect(chats(log, [], book)[0]!.unread).toBe(2);
    book.markRead('person:Oak', 2);
    expect(chats(log, [], book)[0]!.unread).toBe(0);
    book.markRead('person:Oak', 1);
    expect(book.read('person:Oak')).toBe(2);
    expect(chats([...log, say('Oak', 'three')], [], book)[0]!.unread).toBe(1);
  });
});

describe('Phantom UI: the Rotom Phone page', () => {
  const model = (over: Partial<PhoneModel> = {}): PhoneModel => ({
    where: 'Stage 14 of 30 · Johto',
    chats: [{ name: 'Silver', last: 'Out of my way.', unread: 2, art: null, rotom: false }, { name: 'Rotom', last: 'Your team is in good shape.', unread: 0, art: null, rotom: true }],
    chat: 0,
    msgs: [{ from: 'them', text: 'Out of my way.' }, { from: 'rotom', text: 'Bzzt! Silver: you lead by 2.' }, { from: 'me', text: 'I am catching up.' }],
    replies: [{ label: 'I am catching up.', small: 'Send' }, { label: 'Rotom, show me their file.', small: 'Opens Rivals' }],
    reply: 0, me: null, ...over,
  });

  it('draws the chats, the lines of the picked one and the replies', () => {
    const html = phPhone(PH, model());
    expect(pageOf(html)).toBe('phone');
    expect(html).toContain('Rotom Phone · Stage 14 of 30 · Johto');
    expect(html.match(/data-act="phoneChat" data-arg="\d"/g)!.length).toBeGreaterThanOrEqual(2);
    expect(html).toContain('<em>2</em>');
    expect(html.match(/class="im"/g)).toHaveLength(1);
    expect(html.match(/class="im sys"/g)).toHaveLength(1);
    expect(html.match(/class="im me"/g)).toHaveLength(1);
    expect(html.match(/class="ch on"/g)).toHaveLength(1);
    expect(html).toContain('data-act="phoneReply" data-arg="1" data-over="phoneOver"');
    expect(html).toContain('A line you send is only talk: it changes nothing in the run.');
    expect(html).toContain('>Send<');
    // A person with no picture shows the first letter; Rotom shows its bolt.
    expect(html).toContain('<i>S</i>');
    expect(html).toContain('<i>⚡</i>');
  });

  it('names the key by what the lit reply does, and has no chat key with one chat', () => {
    const html = phPhone(PH, model({ reply: 1 }));
    expect(html).toContain('>Open<');
    const one = phPhone(PH, model({ chats: [{ name: 'Rotom', last: '', unread: 0, art: null, rotom: true }], chat: 0 }));
    expect(one).not.toContain('Q E');
  });

  it('escapes what people said, caps the unread mark and tightens a long chat', () => {
    const html = phPhone(PH, model({ msgs: [{ from: 'them', text: '<b>hi</b>' }], chats: [{ name: 'Silver', last: 'x', unread: 14, art: null, rotom: false }] }));
    expect(html).toContain('&lt;b&gt;hi&lt;/b&gt;');
    expect(html).toContain('<em>9</em>');
    expect(phPhone(PH, model({ msgs: [{ from: 'them', text: 'a'.repeat(300) }] }))).toContain('ph-ph-chat sm');
    expect(phPhone(PH, model({ msgs: [{ from: 'them', text: 'a'.repeat(500) }] }))).toContain('ph-ph-chat xs');
  });
});
