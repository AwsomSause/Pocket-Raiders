// Evil Mode slice 18: knocks 41 to 130 (design Parts 24b and 24c) as data, in slice 7's knock shape. The schema here is
// a copy of slice 7's KnockDefSchema (#1443); when slice 7 lands, night.ts reads this file and this copy goes.
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import knocks2 from '../../src/data/evilMode/knocks2.json';

const NT = z.string().min(1);
const EchoSchema = z.discriminatedUnion('t', [
  z.object({ t: z.literal('mood'), by: z.union([z.literal(1), z.literal(-1)]) }).strict(),
  z.object({ t: z.literal('loyalty'), by: z.union([z.literal(1), z.literal(-1)]) }).strict(),
  z.object({ t: z.literal('team'), stat: z.enum(['regard', 'dread', 'heat']), by: z.union([z.literal(1), z.literal(-1)]) }).strict(),
  z.object({ t: z.literal('regardOrDread') }).strict(),
  z.object({ t: z.literal('localMood'), by: z.literal(-1) }).strict(),
  z.object({ t: z.literal('wall'), item: NT }).strict(),
  z.object({ t: z.literal('flag'), id: NT }).strict(),
  z.object({ t: z.literal('hush') }).strict(),
  z.object({ t: z.literal('leave'), how: z.enum(['handshake', 'coat']) }).strict(),
]);
const TALENTS = ['voice', 'hands', 'eyes', 'nerve', 'books', 'wheels', 'heart'] as const;
const FLAWS = ['talks', 'drinks', 'doubts', 'skims', 'freezes', 'loves', 'proud', 'kind'] as const;
const RANKS = ['grunt', 'lead', 'specialist', 'officer', 'executive'] as const;
const WhoSpecSchema = z.object({
  first: z.boolean().optional(), oldest: z.boolean().optional(), talent: z.enum(TALENTS).optional(), flaw: z.enum(FLAWS).optional(), rank: z.enum(RANKS).optional(),
  minLoyalty: z.number().int().min(0).max(10).optional(), maxLoyalty: z.number().int().min(0).max(10).optional(), maxAge: z.number().int().min(1).optional(), minor: z.boolean().optional(),
  outside: NT.optional(), nobody: z.boolean().optional(),
}).strict();
const KnockDefSchema = z.object({
  n: z.number().int().min(1), title: NT, sun: z.boolean(), who: WhoSpecSchema, needs: z.array(NT), shut: z.boolean(), report: z.boolean(), status: z.enum(['supported', 'limited', 'disabled', 'invalid']), says: NT,
  answers: z.array(z.object({ say: NT, reply: NT, needs: z.array(NT).optional(), echo: z.array(EchoSchema) }).strict()).length(3),
}).strict();
const FileSchema = z.object({
  note: NT,
  needs: z.array(z.object({ id: NT, live: z.boolean(), says: NT, waits: NT.optional() }).strict()),
  flags: z.array(z.object({ id: NT, shown: NT, readBy: NT }).strict()),
  knocks: z.array(KnockDefSchema).length(90),
}).strict();

// Slice 7's night.json (#1443): its flags, needs and Wall items.
const NIGHT_FLAGS = ['firstLie', 'cameAfter', 'creedAtDoors', 'headlineGuess', 'ferryFree', 'ledgerNames', 'ledgerAmounts', 'waiverOffered', 'garageFirst', 'courtLine', 'frozeStory', 'notHouseCall', 'neverFreeze', 'pitchTrue', 'doubtsSooner', 'moleSlip', 'eyesQuest', 'frontMum', 'mumLetter', 'birthdays', 'squadNames', 'squadDoor', 'squadFile', 'mapTable', 'askAgainSeventeen', 'tobiFriend', 'localNamed', 'notebookBlank', 'listDelayed', 'stationOnBoard', 'summonsDiary', 'handshake', 'asked31', 'voteCustom', 'ballotTin', 'catLedger', 'lookedDown', 'keptFor', 'cantDismiss', 'oathShort', 'heroReason', 'potionShelf', 'fileLine', 'penCards', 'penSendHome', 'penFirstCard', 'collarHome', 'patronStops', 'patronAsks', 'messSecond', 'whereBossEats', 'flawAsks', 'offTheMoney', 'bottleDrawer', 'coveredLedger', 'doubtsHeard', 'heatArrow', 'pubList', 'constableWarns', 'standingPair', 'kindTalent', 'canneryWork', 'motherSeen', 'motherWalk', 'childTaken', 'vaultKey', 'labClose', 'windowSeen', 'heroMark', 'heroCat', 'neighbourNote', 'officeLead', 'backAgain'];
const NIGHT_NEEDS = ['voicePersuaded', 'lead', 'minor', 'heldLocal', 'heat5', 'heat6', 'regard4', 'loyalty9', 'flag:handshake', 'pen', 'lab', 'front', 'school', 'messLarge', 'officer', 'patron', 'take', 'flawFired', 'metHero', 'lostToHero', 'heroInMess', 'neighbour', 'region2', 'mole', 'moleFound', 'pokemonLead'];
const NIGHT_LIVE = ['voicePersuaded', 'lead', 'minor', 'heldLocal', 'heat5', 'heat6', 'regard4', 'loyalty9', 'flag:handshake'];
const NIGHT_WALL = ['mug', 'bottle', 'coat', 'birthdayCard', 'crayon', 'bigHat', 'summons', 'ledgerPage', 'basketCard'];

const file = FileSchema.parse(knocks2);
const flagIds = new Set([...NIGHT_FLAGS, ...file.flags.map((f) => f.id)]);
const needIds = new Set([...NIGHT_NEEDS, ...file.needs.map((n) => n.id)]);
const live = new Set([...NIGHT_LIVE, ...file.needs.filter((n) => n.live).map((n) => n.id)]);

describe('Evil Mode knocks 41 to 130 (slice 18)', () => {
  it('has ninety knocks, numbered 41 to 130 in order, each with three answers', () => {
    expect(file.knocks.map((k) => k.n)).toEqual(Array.from({ length: 90 }, (_, i) => i + 41));
    for (const k of file.knocks) expect(k.answers).toHaveLength(3);
  });

  it('has no empty text anywhere', () => {
    const texts = file.knocks.flatMap((k) => [k.title, k.says, ...k.answers.flatMap((a) => [a.say, a.reply])]);
    for (const t of texts) expect(t.trim().length).toBeGreaterThan(0);
  });

  it('defines every flag an echo sets, every Wall item and every need, once', () => {
    for (const k of file.knocks) {
      for (const id of k.needs) expect(needIds.has(id), `${k.n} needs ${id}`).toBe(true);
      for (const a of k.answers) for (const e of a.echo) {
        if (e.t === 'flag') expect(flagIds.has(e.id), `${k.n} sets ${e.id}`).toBe(true);
        if (e.t === 'wall') expect(NIGHT_WALL).toContain(e.item);
      }
    }
    expect(new Set(file.flags.map((f) => f.id)).size).toBe(file.flags.length);
    for (const f of file.flags) expect(NIGHT_FLAGS).not.toContain(f.id);
    for (const n of file.needs) expect(NIGHT_NEEDS).not.toContain(n.id);
  });

  it('marks a knock disabled exactly when one of its needs waits on a later build, and says what for', () => {
    for (const k of file.knocks) expect(k.status, String(k.n)).toBe(k.needs.every((id) => live.has(id)) ? 'supported' : 'disabled');
    for (const n of file.needs) expect(n.live ? n.id.startsWith('flag:') && flagIds.has(n.id.slice(5)) : !!n.waits, n.id).toBe(true);
  });

  it('moves no number by more than one (Part 24a rules)', () => {
    for (const k of file.knocks) for (const a of k.answers) for (const e of a.echo) if ('by' in e) expect(Math.abs(e.by)).toBe(1);
  });

  it('keeps the seventh-day marks (☼) from the design', () => {
    expect(file.knocks.filter((k) => k.sun).map((k) => k.n)).toEqual([47, 50, 53, 57, 64, 66, 69, 71, 86, 88, 95, 115, 122, 124, 125, 126, 129]);
  });

  it('never offers an answer that hires the boy in the hood (knock 101)', () => {
    const k = file.knocks.find((x) => x.n === 101)!;
    for (const a of k.answers) expect(a.echo.some((e) => e.t === 'flag' && /hire/i.test(e.id))).toBe(false);
  });
});
