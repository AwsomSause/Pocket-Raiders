// Evil Mode slice 18, "the voice" (build plan section 3; design Part 25a, Part 25b). Proves: one piece of post a day,
// the older first; steamed (a day late and opened) at Heat 7; the Radio reports only yesterday and never guesses, and the
// Hero hears the same item; the paper never names the team below standing 5; barks draw from no gameplay stream and
// change nothing (a whole run hashes the same with every bark asked for); a Shut person never barks, nothing barks at a
// fire, no line twice in a district; every letter fits one screen; replies move nothing by more than one, once each;
// the empty envelope at most once and only at Dread 7; Giovanni's card by the region's number, none at War; the
// notebook's last line never blank; a coldly let-go leaver never writes; the v15 and v20 -> v21 migration; the drawer keeps the save small.

import { describe, expect, it } from 'vitest';
import { foundForPlay, playRegion, playRun, replay } from '../../src/core/evilMode/autoplay';
import { step } from '../../src/core/evilMode/day';
import { EvilModeBlockSchema, type EvilModeBlock } from '../../src/core/evilMode/schema';
import type { FoundingChoice } from '../../src/core/evilMode/start';
import { applyFx, bark, barkPool, heroHeard, notebookLine, officerLetter, paperText, pickPaper, pickRadio, pieceChoices, pieceText, postAct, postMorning, radioText, todaysPost, todaysRadio, VOICE, voiceMorning, yesterday } from '../../src/core/evilMode/voice';
import { postAction, postModel, voiceBlocks } from '../../src/core/evilMode/voiceScreens';
import { emptyVoice } from '../../src/core/evilMode/voiceSchema';

const choice = (over: Partial<FoundingChoice> = {}): FoundingChoice => ({ name: 'Kettle', creed: 'profit', line: 'grey', doctrine: 'swarm', patron: 'executive', region: 'kanto', ...over });
const fresh = (seed = 'voice-1', over: Partial<FoundingChoice> = {}): EvilModeBlock => foundForPlay(seed, choice(over));

/** A block a few days into a district with one person left holding the district behind (an Officer away). */
function withOfficer(b0: EvilModeBlock, over: Partial<EvilModeBlock['crew'][number]> = {}): EvilModeBlock {
  const c = b0.crew.find((x) => x.where === 'in')!;
  const past = { district: { ...b0.district!, n: Math.max(1, b0.district!.n - 1) }, leftWith: c.id };
  return { ...b0, crew: b0.crew.map((x) => (x.id === c.id ? { ...x, where: 'away' as const, ...over } : x)), region: { ...b0.region, past: [...b0.region.past, past] }, here: { ...b0.here, stage: 3, day: (b0.district!.from ?? 1) + 2 } };
}

describe('the data', () => {
  it('has forty Officer letters, fourteen with three answers, nothing moving more than one', () => {
    expect(VOICE.officer.map((l) => l.n)).toEqual(Array.from({ length: 40 }, (_, i) => i + 1));
    expect(VOICE.officer.filter((l) => l.choices)).toHaveLength(14);
    for (const l of VOICE.officer) for (const c of l.choices ?? []) {
      for (const k of ['loyalty', 'teamLoyalty', 'heat', 'regard', 'dread', 'opinion'] as const) expect(Math.abs(c.fx[k] ?? 0)).toBeLessThanOrEqual(1);
    }
  });

  it('every letter fits one screen (480 characters or fewer)', () => {
    const texts = [...VOICE.officer.map((l) => l.text), ...VOICE.garrison.map((g) => g.text), ...VOICE.cells.holds, ...VOICE.cells.slow, ...VOICE.cells.aside, ...Object.values(VOICE.cells.flaw),
      ...Object.values(VOICE.leavers).filter((x): x is string => typeof x === 'string'), ...Object.values(VOICE.mothers.told), ...VOICE.mothers.unprompted.map((m) => m.text), ...Object.values(VOICE.town)];
    for (const t of texts) expect(t.length, t).toBeLessThanOrEqual(480);
  });

  it('has a presenter for each of nine regions, and a Radio line for every neighbour tick', () => {
    expect(Object.keys(VOICE.radio.presenters)).toHaveLength(9);
    for (const id of ['giovanni', 'archer', 'archie', 'maxie']) {
      expect(VOICE.radio.ticks[id]).toHaveLength(5);
      expect(VOICE.radio.stopped[id]).toHaveLength(5);
    }
  });
});

describe('a Standard run with the voice', () => {
  const b0 = fresh('voice-run');
  const run = playRun(b0, 'mix');
  const v = run.block.voice;

  it('delivers at most one piece of post a day, never before it is due', () => {
    const days = v.inbox.filter((p) => p.day !== null).map((p) => p.day!);
    expect(new Set(days).size).toBe(days.length);
    for (const p of v.inbox.filter((x) => x.day !== null)) expect(p.day!).toBeGreaterThanOrEqual(p.due);
    expect(v.inbox.length).toBeGreaterThan(0);
  });

  it('a run with every bark asked for hashes the same, and replays', () => {
    const before = JSON.stringify(run.block);
    for (const m of ['board', 'dispatchGo', 'dispatchStay', 'jobWon', 'jobLost', 'mess', 'door', 'heroNear', 'raidNear', 'crossing'] as const) bark(run.block, m);
    expect(JSON.stringify(run.block)).toBe(before);
    expect(JSON.stringify(replay(b0, run.actions))).toBe(before);
  });

  it('a three-region save with the voice is still under the 300 KB budget, and reloads whole', () => {
    const json = JSON.stringify(run.block);
    expect(json.length).toBeLessThan(300_000);
    expect(EvilModeBlockSchema.parse(JSON.parse(json))).toEqual(JSON.parse(json));
  });

  it('keeps a week of Radio items and headlines', () => {
    expect(v.radio.length).toBeGreaterThan(0);
    expect(v.radio.length).toBeLessThanOrEqual(7);
    expect(v.paper.length).toBeLessThanOrEqual(8);
  });
});

describe('the Radio', () => {
  const b = playRegion(fresh('voice-radio'), 'mix', undefined, 60).block;

  it('says one thing each Morning after the first, and the Hero hears the same item', () => {
    const t = todaysRadio(b);
    if (b.here.beat === 'morning' && b.here.day > 1) expect(t).toBeTruthy();
    if (t) expect(heroHeard(b)).toContain(t);
  });

  it('never guesses: with nothing happened yesterday it gives the weather', () => {
    const quiet = { ...b, voice: { ...b.voice, mark: { day: b.here.day - 1, heat: b.team.heat, regard: b.team.regard, dread: b.team.dread, log: b.log.length, stance: b.neighbour?.stance ?? null, nb: b.neighbour?.id ?? null, counts: { badges: 99, works: 99, fronts: 99, fired: 99, stopped: 99, heists: 99, digs: 99 } } }, team: { ...b.team, heat: 0 }, economy: { ...b.economy, running: [] }, hero: b.hero ? { ...b.hero, badges: [] } : null, neighbour: b.neighbour ? { ...b.neighbour, ticks: b.neighbour.ticks.map((t) => ({ ...t, state: 'waiting' as const })) } : null };
    const r = pickRadio(quiet);
    expect(r.id.startsWith('quiet:') || r.id.startsWith('request:')).toBe(true);
    expect(radioText(r, quiet)).toContain(VOICE.radio.presenters.kanto!.says);
  });

  it('reports a Badge won yesterday, with the Leader\'s words', () => {
    const hero = b.hero!;
    const y = { ...b, hero: { ...hero, badges: [{ region: 0, district: 0, how: 'full' as const, day: b.here.day - 1 }] }, voice: { ...b.voice, mark: { ...b.voice.mark!, counts: { ...b.voice.mark!.counts, badges: 0 } } }, neighbour: null };
    const r = pickRadio(y);
    expect(r.id).toBe('badge:brock');
    expect(radioText(r, y)).toContain('Boulder Badge');
    expect(yesterday(y).some((e) => e.id === 'badge:brock')).toBe(true);
  });

  it('the set can be switched off at Night, once a run; Hortense switches it back on', () => {
    let x: EvilModeBlock = { ...b, here: { ...b.here, beat: 'night' } };
    const off = step(x, { type: 'radio', on: false });
    expect(off.ok).toBe(true);
    expect(off.block.voice.radioOff).toBe(true);
    x = { ...off.block, voice: { ...off.block.voice, radioOff: false } };
    expect(step(x, { type: 'radio', on: false }).ok).toBe(false);
    expect(step({ ...b, here: { ...b.here, beat: 'dispatch' } }, { type: 'radio', on: false }).ok).toBe(false);
  });
});

describe('the paper', () => {
  const b = fresh('voice-paper');

  it('below standing 5 it prints a guess and never the team\'s name; it moves nothing', () => {
    const low = { ...b, team: { ...b.team, regard: 4, dread: 4 }, voice: { ...b.voice, mark: { ...b.voice.mark!, day: b.here.day } } };
    const p = pickPaper(low);
    expect(p.id.startsWith('guess:')).toBe(true);
    expect(paperText(p)).not.toContain(b.team.name.toUpperCase());
    const after = voiceMorning({ ...low, here: { ...low.here, day: low.here.day + 1 } });
    expect(after.team).toEqual(low.team);
  });

  it('"BOTH." needs both standings at 5 or more (and the interview); without it, the twelve neighbours', () => {
    const both = { ...b, team: { ...b.team, regard: 5, dread: 5 } };
    expect(paperText(pickPaper(both))).toBe(VOICE.paper.bothNoInterview);
    const one = { ...b, team: { ...b.team, regard: 8, dread: 2 } };
    expect(pickPaper(one).id.startsWith('regard:high')).toBe(true);
  });
});

describe('the post', () => {
  const b = fresh('voice-post');

  it('an Officer away writes once a district, by talent; a flaw letter only once the flaw is found', () => {
    const o = withOfficer(b, { talent: 'books', flaw: 'skims', flawFound: false });
    const c = o.crew.find((x) => x.where === 'away')!;
    expect(officerLetter(o, c, 2)?.talent).toBe('books');
    const f = withOfficer(b, { talent: 'books', flaw: 'skims', flawFound: true });
    expect(officerLetter(f, f.crew.find((x) => x.where === 'away')!, 2)?.flaw).toBe('skims');
    const sent = postMorning(o);
    expect(sent.voice.inbox.filter((p) => p.what.startsWith('officer:'))).toHaveLength(1);
    expect(postMorning(sent).voice.inbox.filter((p) => p.what.startsWith('officer:'))).toHaveLength(1);
  });

  it('one piece a day: two due, the older waits', () => {
    const o = withOfficer(b, { talent: 'heart' });
    const two = { ...o, voice: { ...emptyVoice(), inbox: [1, 2].map((n) => ({ id: `P${n}`, what: 'town:easy', who: null, args: {}, made: 1, due: 1, day: null, opened: false, steamed: false, pinned: false, answer: null, left: false })) } };
    const m = postMorning(two);
    expect(m.voice.inbox.filter((p) => p.day === m.here.day).map((p) => p.id)).toEqual(['P1']);
    expect(todaysPost(m)?.id).toBe('P1');
  });

  it('at Heat 7 or more a letter is a day late and has been opened', () => {
    const o = withOfficer({ ...b, team: { ...b.team, heat: 7 } }, { talent: 'voice' });
    const m = postMorning(o);
    const p = m.voice.inbox.find((x) => x.what.startsWith('officer:'))!;
    expect(p.steamed).toBe(true);
    expect(p.due).toBe(o.here.day + 1);
    expect(p.day).toBeNull();
    const next = postMorning({ ...m, here: { ...m.here, day: m.here.day + 1 } });
    expect(todaysPost(next)?.id).toBe(p.id);
  });

  it('a reply moves one number by one, once; only after opening', () => {
    const o = withOfficer(b, { talent: 'nerve', loyalty: 5 });
    const id = o.crew.find((x) => x.where === 'away')!.id;
    const piece = { id: 'P1', what: 'officer:15', who: id, args: { name: 'X', town: 'Y' }, made: o.here.day, due: o.here.day, day: o.here.day, opened: false, steamed: false, pinned: false, answer: null, left: false };
    const x = { ...o, voice: { ...emptyVoice(), inbox: [piece] } };
    expect(postAct(x, 'P1', { what: 'answer', i: 0 }).problem).toBeTruthy();
    const opened = postAct(x, 'P1', { what: 'open' }).block;
    const r = postAct(opened, 'P1', { what: 'answer', i: 0 });
    expect(r.problem).toBeNull();
    expect(r.block.crew.find((c) => c.id === id)!.loyalty).toBe(6);
    expect(postAct(r.block, 'P1', { what: 'answer', i: 1 }).problem).toBeTruthy();
    // Through `step`, at any beat, like any action.
    expect(step(opened, { type: 'postAct', id: 'P1', act: { what: 'answer', i: 2 } }).block.voice.flags).toContain('trainedLad');
  });

  it('applyFx clamps and recalls', () => {
    const o = withOfficer({ ...b, team: { ...b.team, heat: 10 } });
    const id = o.crew.find((x) => x.where === 'away')!.id;
    const r = applyFx(o, { heat: 1, recall: true }, id);
    expect(r.block.team.heat).toBe(10);
    expect(r.block.crew.find((c) => c.id === id)!.where).toBe('in');
    expect(r.block.region.past.some((p) => p.leftWith === id)).toBe(false);
  });

  it('the empty envelope comes at most once a run, and only at Dread 7 or more', () => {
    const d = b.district!;
    const shut = { ...d, holdings: d.holdings.map((h, i) => (i === 0 ? { ...h, owner: 'team' as const, mood: 'shut' as const } : h)) };
    const base = { ...b, district: shut, here: { ...b.here, stage: 3, day: (d.from ?? 1) + 2 } };
    expect(postMorning({ ...base, team: { ...b.team, dread: 6 } }).voice.inbox.some((p) => p.what === 'town:empty')).toBe(false);
    const once = postMorning({ ...base, team: { ...b.team, dread: 7 } });
    expect(once.voice.inbox.filter((p) => p.what === 'town:empty')).toHaveLength(1);
    expect(postMorning(once).voice.inbox.filter((p) => p.what === 'town:empty')).toHaveLength(1);
  });

  it("Giovanni's card follows the region's number, and none comes at War", () => {
    const truce = { ...b, here: { ...b.here, stage: 3 }, voice: { ...b.voice, giovanni: 'truce' } };
    const p = postMorning(truce).voice.inbox.find((x) => x.what.startsWith('basket:'))!;
    expect(pieceText(p)).toContain(VOICE.baskets.cards[0]!);
    expect(postMorning({ ...truce, voice: { ...truce.voice, giovanni: 'war' } }).voice.inbox.some((x) => x.what.startsWith('basket:'))).toBe(false);
  });

  it('a coldly let-go leaver never writes to the Boss; the paper prints their letter instead', () => {
    const c = b.crew[0]!;
    const gone = { ...b, crew: b.crew.map((x) => (x.id === c.id ? { ...x, where: 'left' as const, left: { day: 1, how: 'letGo' as const, kindly: false } } : x)), district: { ...b.district!, from: 3 }, here: { ...b.here, day: 4 } };
    expect(postMorning(gone).voice.inbox.some((p) => p.who === c.id)).toBe(false);
    const m = voiceMorning(gone);
    expect(m.voice.paper.some((s) => s.id === 'coldly')).toBe(true);
    const kindly = { ...gone, crew: gone.crew.map((x) => (x.id === c.id ? { ...x, left: { day: 1, how: 'letGo' as const, kindly: true } } : x)) };
    expect(postMorning(kindly).voice.inbox.find((p) => p.who === c.id)?.what).toBe('leaver:letGoKindly');
  });

  it('a Kind in the cells asks the Boss to write to a stranger', () => {
    expect(pieceChoices({ what: 'cell:flaw:kind' })).toHaveLength(3);
    expect(pieceChoices({ what: 'cell:flaw:proud' })).toHaveLength(0);
  });

  it('the screen: Morning shows the envelope; the post page opens it, answers it and closes', () => {
    const o = withOfficer(b, { talent: 'nerve' });
    const piece = { id: 'P1', what: 'officer:15', who: o.crew.find((x) => x.where === 'away')!.id, args: { name: 'Otis', town: 'Pewter' }, made: o.here.day, due: o.here.day, day: o.here.day, opened: false, steamed: false, pinned: false, answer: null, left: false };
    const x = { ...o, voice: { ...emptyVoice(), inbox: [piece] } };
    expect(voiceBlocks(x).some((s) => s.lines.some((l) => l.includes('Otis, from Pewter')))).toBe(true);
    const m = postModel(x);
    expect(m.acts.map((a) => a.code)).toEqual(['open:P1', 'leave:P1', 'close']);
    const opened = step(x, postAction('open:P1')!).block;
    const m2 = postModel(opened);
    expect(m2.today?.text).toBe(VOICE.officer[14]!.text);
    expect(m2.acts.filter((a) => a.code.startsWith('answer:'))).toHaveLength(3);
    expect(postAction('close')).toBeNull();
  });
});

describe('barks', () => {
  const b = fresh('voice-bark');

  it('draw from no gameplay stream and change nothing', () => {
    const before = JSON.stringify(b);
    const one = bark(b, 'board');
    expect(JSON.stringify(b)).toBe(before);
    expect(bark(b, 'board')).toEqual(one);
  });

  it('a Shut person never barks; nothing barks at a fire', () => {
    const shut = { ...b, crew: b.crew.map((c) => ({ ...c, mood: 'shut' })) } as unknown as EvilModeBlock;
    expect(barkPool(shut, shut.crew[0]!, 'mess')).toEqual([]);
    expect(bark(shut, 'mess')).toBeNull();
    expect(bark({ ...b, fire: { n: 1 } as never }, 'board')).toBeNull();
  });

  it('never says a line twice in a district', () => {
    const said = new Set<string>();
    for (let i = 0; i < 40; i++) {
      const x = bark({ ...b, here: { ...b.here, day: b.here.day + i } }, 'board', said);
      if (!x) break;
      expect(said.has(x.line)).toBe(false);
      said.add(x.line);
    }
  });

  it('a Heat under 8 has no raid bark', () => {
    expect(bark({ ...b, team: { ...b.team, heat: 7 } }, 'raidNear')).toBeNull();
    expect(bark({ ...b, team: { ...b.team, heat: 9 } }, 'raidNear')?.line).toBeTruthy();
  });
});

describe('the notebook and the endings', () => {
  const b = fresh('voice-end');

  it('the last line is chosen by detective and ending and is never blank', () => {
    for (const id of ['scheme', 'lastRoom', 'straight', 'handOff', 'recruit', 'caught'] as const) {
      const x = { ...b, ending: { id, sub: null, via: 'test', day: 1, region: 0, step: 0, picks: {}, heir: null, done: true } };
      const l = notebookLine(x);
      expect(l.line.length).toBeGreaterThan(0);
      if (id === 'straight') expect(l.line).toBe(VOICE.notebook.straight);
      if (id === 'caught') expect(l.line).toBe((VOICE.notebook.kanto as { caught: string }).caught);
    }
  });
});

describe('saves', () => {
  it('a v15 block (slice 16) and a v20 block (slice 7) migrate to v21 with nothing heard and no post', () => {
    const b = fresh('voice-mig');
    const { voice: _v, ...rest } = b;
    for (const v of [15, 20]) {
      const out0 = EvilModeBlockSchema.parse(JSON.parse(JSON.stringify({ ...rest, v })));
      expect(out0).toMatchObject({ v: 21, voice: { mark: null, radio: [], paper: [], inbox: [], radioOff: false } });
    }
    // A block that already has its voice keeps it.
    expect(EvilModeBlockSchema.parse(JSON.parse(JSON.stringify({ ...b, v: 20 }))).voice).toEqual(b.voice);
    const out = EvilModeBlockSchema.parse(JSON.parse(JSON.stringify({ ...rest, v: 15 })));
    // The next Morning marks; the one after it speaks.
    const m1 = voiceMorning({ ...out, here: { ...out.here, day: out.here.day + 1 } });
    expect(m1.voice.mark).not.toBeNull();
    expect(m1.voice.radio).toHaveLength(0);
  });

  it('a block with the voice reloads whole', () => {
    const b = playRegion(fresh('voice-reload'), 'mix', undefined, 40).block;
    const json = JSON.stringify(b);
    expect(EvilModeBlockSchema.parse(JSON.parse(json))).toEqual(JSON.parse(json));
  });
});

describe('the save stays small', () => {
  it('the drawer keeps the last dozen letters and any on the Wall; ids never repeat', () => {
    const b = fresh('voice-drawer');
    const piece = (i: number, pinned = false) => ({ id: `P${i}`, what: 'town:quiet', who: null, args: {}, made: 1, due: 1, day: 1, opened: true, steamed: false, pinned, answer: null, left: false });
    const inbox = [piece(1, true), ...Array.from({ length: 19 }, (_, i) => piece(i + 2))];
    const out = voiceMorning({ ...b, voice: { ...b.voice, inbox }, here: { ...b.here, day: b.here.day + 1 } });
    const kept = out.voice.inbox.filter((p) => p.day !== null);
    expect(kept.filter((p) => !p.pinned)).toHaveLength(VOICE.rules.drawer);
    expect(kept.some((p) => p.id === 'P1')).toBe(true);
    expect(kept.at(-1)!.id).toBe(out.voice.inbox.filter((p) => p.day !== null).at(-1)!.id);
    const ids = out.voice.inbox.map((p) => Number(p.id.slice(1)));
    expect(new Set(ids).size).toBe(ids.length);
    expect(Math.max(...ids)).toBeGreaterThanOrEqual(20);
  });
});
