// DOMINION slice D7: the Founding and team colours (plans/evil-mode-rework BUILD_SLICES.md; Part 9 A15, Part 6 §8,
// Part 11). When the Founding opens, the six names from the record, what a draft may be, founding through the session,
// the team's colours on the top bar and cards, the colour swap and armband maths, and save/reload.
import { describe, expect, it } from 'vitest';
import { withCrew } from '../../src/core/dominion/crew';
import { morningModel } from '../../src/core/dominion/crewScreens';
import { DOMINION_DATA } from '../../src/core/dominion/data';
import { stepById } from '../../src/core/dominion/empire';
import { draftProblem, foundedLines, foundingOpen, initialOf, nameIdeas, newDraft, teamColours, type TeamColours } from '../../src/core/dominion/founding';
import { DominionBlockSchema, type ArmbandLook, type DominionAction, type DominionBlock, type TeamDraft } from '../../src/core/dominion/schema';
import { topModel } from '../../src/core/dominion/screens';
import { DOMINION_MODE_ID, startInRun, stepInRun } from '../../src/core/dominion/session';
import { bandColours, drawBand, hexRgb, hlsToRgb, paintTeam, recolour, rgbToHls, roleMap } from '../../src/core/dominion/teamLook';
import { STANDARD_CHOICE } from '../../src/core/rules';
import { chooseStarter, createRun } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import { SaveManager } from '../../src/save/saveManager';
import { MemoryStorageProvider } from '../../src/save/storage';
import { content } from './helpers';

const FD = DOMINION_DATA.founding;
const domRun = (seed: string): RunState => chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red', rules: { ...STANDARD_CHOICE, modeId: DOMINION_MODE_ID } }), 0);
const started = (seed = 'dm7', member: 'grunt' | 'admin' = 'grunt'): RunState => {
  const out = startInRun(content, domRun(seed), { types: ['poison', 'dark'], member, look: 0 });
  expect(out.problem).toBeNull();
  return stepInRun(content, out.run, { t: 'open' }).run;
};
const blk = (r: RunState): DominionBlock => r.expansion!.dominion!;
const edit = (r: RunState, f: (b: DominionBlock) => void): RunState => {
  const b = withCrew(structuredClone(blk(r)));
  f(b);
  return { ...r, expansion: { ...r.expansion, dominion: DominionBlockSchema.parse(b) } };
};
const allSteps = (b: DominionBlock): void => { b.stepsDone = DOMINION_DATA.start.firstSteps.map((s) => s.id); };
const streetGang = (b: DominionBlock): void => { b.empire!.peak = stepById('street-gang'); };
/** A run where the Founding is open. */
const ready = (seed = 'dm7', member: 'grunt' | 'admin' = 'grunt'): RunState => edit(started(seed, member), (b) => { allSteps(b); streetGang(b); });
const draft = (b: DominionBlock, over: Partial<TeamDraft> = {}): TeamDraft => ({ ...newDraft(b, 'Bulbasaur'), ...over });
const found = (r: RunState, d: TeamDraft) => stepInRun(content, r, { t: 'found', team: d } as DominionAction);

describe('DOMINION D7: the data', () => {
  it('has the fourteen Goals of Part 35 plus Rule, the colours, the marks and the motto ideas', () => {
    expect(FD.goals.map((g) => g.name)).toEqual(['Total Takeover', 'Land Preservation', 'A New Perfect Order', 'Herald of Legends', 'Ultra Divinity', 'Spores of Creation', 'Pure Hate', 'Every Ball Opened', 'Endless Energy', 'Everlasting', 'Every Window', 'The Rightful Crown', 'Apex', 'Clean Slate']);
    expect(FD.noGoal.name).toBe('Rule');
    expect(FD.colours.length).toBeGreaterThanOrEqual(12);
    expect(new Set(FD.colours.map((c) => c.id)).size).toBe(FD.colours.length);
    expect(FD.logos.length).toBe(6);
  });
  it('every crew picture the Dominion can give has colour roles; the armbands sit inside the picture', () => {
    const looks = new Set<string>();
    JSON.stringify([DOMINION_DATA.start, DOMINION_DATA.crew], (k, v) => {
      if ((k === 'look' || k === 'file') && typeof v === 'string' && (v.endsWith('.png') || v.startsWith('trainer/'))) looks.add(v);
      return v;
    });
    expect(looks.size).toBeGreaterThan(20);
    for (const l of looks) {
      const e = DOMINION_DATA.armbands[l];
      expect(e, l).toBeDefined();
      expect(e!.primary.length, l).toBeGreaterThan(0);
      if (!e!.anchor) continue;
      expect(e!.anchor.y + 7).toBeLessThanOrEqual(e!.h);
      for (const [x0, x1] of e!.anchor.rows) {
        expect(x0).toBeLessThanOrEqual(x1);
        expect(x1).toBeLessThan(e!.w);
      }
    }
    // Rook (every hired Grunt wears his picture) has a hand-checked band.
    expect(DOMINION_DATA.armbands['dominion/c-rook0.png']!.anchor).not.toBeNull();
  });
});

describe('DOMINION D7: when the Founding opens (A15)', () => {
  it('is shut on Day 1, with only the First Steps, or with only Street Gang; open with both (boundary)', () => {
    const r = started();
    expect(foundingOpen(blk(r))).toBe(false);
    expect(foundingOpen(blk(edit(r, allSteps)))).toBe(false);
    expect(foundingOpen(blk(edit(r, streetGang)))).toBe(false);
    expect(foundingOpen(blk(edit(r, (b) => { allSteps(b); b.empire!.peak = stepById('street-gang') - 1; })))).toBe(false);
    expect(foundingOpen(blk(ready()))).toBe(true);
    expect(topModel(blk(ready())).founding).toBe(true);
  });
  it('the step that finishes the last First Step at Street Gang says so, once', () => {
    let r = edit(started(), (b) => {
      b.stepsDone = ['contact'];
      b.earned = 500; // "Earn your first ₽500" is marked at the end of the Day
      b.phase = 'day';
      for (const d of Object.values(b.field.districts)) d.regard = 3;
    });
    expect(foundingOpen(blk(r))).toBe(false);
    const out = stepInRun(content, r, { t: 'endDay' });
    expect(out.ok).toBe(true);
    expect(out.notice).toContain(FD.lines.ready);
    r = out.run;
    expect(foundingOpen(blk(r))).toBe(true);
    const again = stepInRun(content, r, { t: 'toNight' });
    expect(again.notice ?? '').not.toContain(FD.lines.ready);
  });
  it('founding before it opens is refused with the reason (failure)', () => {
    const r = started();
    const out = found(r, draft(blk(r)));
    expect(out.ok).toBe(false);
    expect(out.notice).toBe(FD.lines.notYet);
    expect(blk(out.run).team).toBeUndefined();
  });
});

describe('DOMINION D7: the name and the draft', () => {
  it('six names from the record: the Team Types, best Edge stat, the lead Pokémon, the HQ town, Dread or Regard', () => {
    const b = blk(ready());
    const ideas = nameIdeas(b, 'Bulbasaur');
    expect(ideas).toHaveLength(6);
    expect(ideas.slice(0, 2)).toEqual(['Team Venom', 'Team Shade']);
    expect(ideas).toContain('Team Bulbasaur');
    expect(ideas).toContain('Pewter Lot');
    for (const n of ideas) expect(draftProblem(draft(b, { name: n }))).toBeNull();
    expect(nameIdeas(b, 'Bulbasaur')).toEqual(ideas);
    // Too long or taken names drop out and the fallback fills to six.
    const long = nameIdeas(b, 'Crabominable-Extra');
    expect(long).toHaveLength(6);
    expect(long.some((n) => n.includes('Crabominable'))).toBe(false);
  });
  it('the initial skips "Team" and "The"', () => {
    expect(initialOf('Team Venom')).toBe('V');
    expect(initialOf('The Harbour')).toBe('H');
    expect(initialOf('Lamplight')).toBe('L');
    expect(initialOf('Team')).toBe('T');
    expect(initialOf("'")).toBe('');
  });
  it('a draft must have a fair name, two different colours, a letter, a mark, a short motto and a real Goal (failure)', () => {
    const b = blk(ready());
    const L = FD.lines;
    expect(draftProblem(draft(b))).toBeNull();
    expect(draftProblem(draft(b, { name: 'A' }))).toBe(L.short);
    expect(draftProblem(draft(b, { name: 'Ab' }))).toBeNull();
    expect(draftProblem(draft(b, { name: 'x'.repeat(FD.name.max) }))).toBeNull();
    expect(draftProblem(draft(b, { name: 'x'.repeat(FD.name.max + 1) }))).toContain(String(FD.name.max));
    expect(draftProblem(draft(b, { name: 'Team 7' }))).toBe(L.chars);
    expect(draftProblem(draft(b, { name: 'Rocket' }))).toContain('already a team');
    expect(draftProblem(draft(b, { name: 'team galactic' }))).toContain('already a team');
    expect(draftProblem(draft(b, { secondary: 'purple' }))).toBe(L.same);
    expect(draftProblem(draft(b, { primary: 'beige' }))).toBe(L.same);
    expect(draftProblem(draft(b, { initial: 'ab' }))).not.toBeNull();
    expect(draftProblem(draft(b, { logo: 'skull' }))).not.toBeNull();
    expect(draftProblem(draft(b, { motto: 'x'.repeat(FD.motto.max) }))).toBeNull();
    expect(draftProblem(draft(b, { motto: 'x'.repeat(FD.motto.max + 1) }))).toContain(String(FD.motto.max));
    expect(draftProblem(draft(b, { goal: 'apex' }))).toBeNull();
    expect(draftProblem(draft(b, { goal: 'world-peace' }))).not.toBeNull();
  });
});

describe('DOMINION D7: the sign goes up', () => {
  it('founding sets the team, the name on the top bar, the emblem and every armband; only once', () => {
    const r0 = ready();
    const out = found(r0, draft(blk(r0), { name: 'Team Venom', primary: 'crimson', secondary: 'charcoal', initial: 'V', logo: 'fang', motto: 'We keep what we take.', goal: 'total-takeover' }));
    expect(out.ok).toBe(true);
    expect(out.notice).toContain('The sign goes up: Team Venom.');
    const b = blk(out.run);
    expect(b.team).toEqual({ name: 'Team Venom', primary: 'crimson', secondary: 'charcoal', initial: 'V', logo: 'fang', motto: 'We keep what we take.', goal: 'total-takeover', day: b.day });
    expect(b.teamName).toBe('Team Venom');
    expect(foundingOpen(b)).toBe(false);
    const top = topModel(b);
    expect(top.team).toBe('TEAM VENOM');
    expect(top.initial).toBe('V');
    expect(top.colours).toEqual<TeamColours>({ primary: '#c0392b', secondary: '#2b2b33', initial: 'V', logo: 'fang' });
    expect(top.founding).toBe(false);
    expect(morningModel(b, 0, 0, false).member.armband).toBe('Team Venom armband');
    const twice = found(out.run, draft(b, { name: 'Team Again' }));
    expect(twice.ok).toBe(false);
    expect(blk(twice.run).team!.name).toBe('Team Venom');
  });
  it('a bad draft is refused and changes nothing (failure)', () => {
    const r0 = ready();
    const out = found(r0, draft(blk(r0), { name: 'Rocket' }));
    expect(out.ok).toBe(false);
    expect(out.notice).toContain('already a team');
    expect(blk(out.run).team).toBeUndefined();
  });
  it('the scene: the door, the armband tied on, Rook\'s line (an Admin says theirs)', () => {
    const r = found(ready(), draft(blk(ready()), { name: 'Team Shade', primary: 'navy', secondary: 'gold' })).run;
    const lines = foundedLines(blk(r));
    expect(lines[0]).toContain('Team Shade');
    expect(lines[1]).toContain('Navy and Gold');
    expect(lines[2]).toBe(`Rook: “${FD.lines.said.grunt}”`);
    const ra = ready('dm7a', 'admin');
    const a = found(ra, draft(blk(ra))).run;
    expect(foundedLines(blk(a))[2]).toContain(FD.lines.said.admin);
  });
  it('before the Founding there are no team colours (grey band, own outfit)', () => {
    expect(teamColours(blk(started()))).toBeNull();
    expect(topModel(blk(started())).colours).toBeNull();
  });
});

describe('DOMINION D7: the colour swap and the armband (Part 11)', () => {
  it('HLS conversions match Python colorsys and round-trip', () => {
    for (const hex of ['#7b3fa0', '#e8e2ff', '#c0392b', '#2b2b33', '#ffffff', '#000000', '#1f7a5c']) {
      const [h, l, s] = rgbToHls(hexRgb(hex));
      expect(hlsToRgb(h, l, s)).toEqual(hexRgb(hex));
    }
    const [h, l, s] = rgbToHls([255, 0, 0]);
    expect([h, l, s]).toEqual([0, 0.5, 1]);
  });
  it('a role keeps its shading order in the team colour', () => {
    const m = roleMap(['#202020', '#606060', '#a0a0a0'], '#7b3fa0');
    const ls = [...m.values()].map((c) => rgbToHls(c)[1]);
    expect(ls[0]!).toBeLessThan(ls[1]!);
    expect(ls[1]!).toBeLessThan(ls[2]!);
    for (const c of m.values()) expect(Math.abs(rgbToHls(c)[0] - rgbToHls(hexRgb('#7b3fa0'))[0])).toBeLessThan(0.02);
  });

  // A 6x12 test sprite: a hair blob (role colour) at the top, a coat (role colour) below, one skin pixel.
  const W = 6, H = 12;
  const coat = '#606060', skin = '#ffd5bd';
  const look: ArmbandLook = { w: W, h: H, headY: 4, primary: [coat], secondary: [], anchor: { side: 'right', y: 4, rows: [[1, 5], [1, 5], [1, 5], [1, 5], [1, 5], [1, 5], [1, 5]] } };
  const sprite = (): Uint8ClampedArray => {
    const px = new Uint8ClampedArray(W * H * 4);
    const put = (x: number, y: number, hex: string): void => { const [r, g, b] = hexRgb(hex); px.set([r, g, b, 255], (y * W + x) * 4); };
    for (let y = 0; y < 2; y++) for (let x = 0; x < W; x++) put(x, y, coat); // hair: same colour, above the shoulder line
    put(0, 2, skin);
    for (let y = 3; y < H; y++) for (let x = 0; x < W; x++) put(x, y, coat);
    return px;
  };
  const at = (px: Uint8ClampedArray, x: number, y: number): number[] => [...px.slice((y * W + x) * 4, (y * W + x) * 4 + 3)];
  const team: TeamColours = { primary: '#c0392b', secondary: '#f2d34a', initial: 'T', logo: 'shield' };

  it('swaps the coat, keeps hair above the shoulder line and skin as drawn', () => {
    const px = sprite();
    recolour(px, W, H, look, team);
    expect(at(px, 0, 0)).toEqual([...hexRgb(coat)]);
    expect(at(px, 0, 2)).toEqual([...hexRgb(skin)]);
    expect(at(px, 0, 10)).not.toEqual([...hexRgb(coat)]);
    expect(Math.abs(rgbToHls(at(px, 0, 10) as [number, number, number])[0] - rgbToHls(hexRgb(team.primary))[0])).toBeLessThan(0.02);
  });
  it('before the Founding the band is plain grey with no letter', () => {
    const px = sprite();
    paintTeam(px, W, H, look, null, FD.band);
    const grey = [...hexRgb(FD.band.grey)], dark = [...hexRgb(FD.band.greyDark)];
    expect(at(px, 0, 10)).toEqual([...hexRgb(coat)]);
    for (let r = 0; r < 7; r++) for (let x = 1; x <= 5; x++) expect([grey, dark]).toContainEqual(at(px, x, 4 + r));
    expect(at(px, 3, 7)).toEqual(grey);
  });
  it('after it: the band carries the initial; it flips to the secondary when the sleeve is already the primary', () => {
    const px = sprite();
    paintTeam(px, W, H, look, team, FD.band);
    const cols = new Set<string>();
    for (let r = 1; r < 6; r++) for (let x = 2; x <= 4; x++) cols.add(at(px, x, 4 + r).join());
    expect(cols.size).toBeGreaterThanOrEqual(2); // band + letter
    const flipped = bandColours(hexRgb(team.primary), team, FD.band);
    expect(flipped.band).toEqual(hexRgb(team.secondary));
    const plain = bandColours([20, 200, 20], team, FD.band);
    expect(plain.band).toEqual(hexRgb(team.primary));
    // A letter that wouldn't show on its band turns white or near-black.
    const low = bandColours([20, 200, 20], { ...team, secondary: '#c2392c' }, FD.band);
    expect([hexRgb(FD.band.white), hexRgb(FD.band.ink)]).toContainEqual(low.ink);
  });
  it('a picture with no anchor gets no band; the result is a pure function of its inputs', () => {
    const px = sprite();
    drawBand(px, W, { ...look, anchor: null }, team, FD.band);
    expect(px).toEqual(sprite());
    const a = sprite(), b = sprite();
    paintTeam(a, W, H, look, team, FD.band);
    paintTeam(b, W, H, look, team, FD.band);
    expect(a).toEqual(b);
  });
});

describe('DOMINION D7: saves', () => {
  it('saves and reloads with the team; a save from before D7 (no `team`) loads and can still found', () => {
    const r0 = ready('dm7s');
    const r = found(r0, draft(blk(r0), { name: 'Team Shroud', initial: 'S' })).run;
    const storage = new MemoryStorageProvider();
    new SaveManager(storage, content).saveRun(r);
    const loaded = new SaveManager(storage, content).loadRun();
    expect(loaded.status).toBe('ok');
    if (loaded.status !== 'ok') return;
    expect(loaded.data).toEqual(r);
    expect(blk(loaded.data).team!.initial).toBe('S');
    new SaveManager(storage, content).saveRun(r0);
    const old = new SaveManager(storage, content).loadRun();
    expect(old.status).toBe('ok');
    if (old.status !== 'ok') return;
    expect(blk(old.data).team).toBeUndefined();
    expect(found(old.data, draft(blk(old.data))).ok).toBe(true);
  });
  it('a damaged team does not pass the schema (failure)', () => {
    const r0 = ready();
    const b = structuredClone(blk(found(r0, draft(blk(r0))).run));
    expect(DominionBlockSchema.safeParse(b).success).toBe(true);
    const bad = structuredClone(b);
    bad.team!.initial = 'ab';
    expect(DominionBlockSchema.safeParse(bad).success).toBe(false);
    const bad2 = structuredClone(b) as unknown as { team: Record<string, unknown> };
    delete bad2.team.goal;
    expect(DominionBlockSchema.safeParse(bad2).success).toBe(false);
  });
  it('is deterministic: same block, same ideas and same founding', () => {
    const play = () => {
      const r = ready('det7');
      return blk(found(r, newDraft(blk(r), 'Bulbasaur')).run);
    };
    expect(play()).toEqual(play());
  });
});
