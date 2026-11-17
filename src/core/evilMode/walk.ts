// "Walk it" (design Part 17 section 4): the player plays their own base as the intruder, with a borrowed party at the
// Hero's level. It's a pseudo-stage: it plays like a stage inside the day (rooms in order, a battle at each door that's
// held) and adds to no count: the region's stage and day don't move. Every piece and every person is real, and they
// don't know it's the Boss: what they do is by their Loyalty and their flaw (section 2.4). It costs the day's in-person
// slot and gives nothing on any number. The game records one thing: what the player changed in the Night after.

import { EVIL_DATA, type EvilData } from './data';
import { gridOf, isEdge, roomName, routeOf } from './baseGrid';
import { roomDef, roomOpen } from './baseFx';
import { layoutOf, pieceDef } from './base';
import { appendLog, fill } from './ledger';
import { hashSeed, Rng } from '../rng';
import type { BaseState, Crew, EvilModeBlock } from './schema';

export interface WalkOut { block: EvilModeBlock; problem: string | null; lines: string[]; fight: boolean }
const no = (block: EvilModeBlock, problem: string): WalkOut => ({ block, problem, lines: [], fight: false });

/** The band a Loyalty falls in (Part 17 section 2.4): Devoted, Easy, Steady, Distant, Leaving. */
export const bandOf = (loyalty: number, data: EvilData = EVIL_DATA) => data.base.people.bands.find((b) => loyalty >= b.min) ?? data.base.people.bands.at(-1)!;

/** Who's in this square: whoever's posted, then the room's Specialist (always there; it's theirs). */
export function peopleAt(block: EvilModeBlock, b: BaseState, sq: string, data: EvilData = EVIL_DATA): Crew[] {
  const ids: string[] = [];
  for (const p of b.posts) if (p.at === sq) ids.push(p.id);
  const r = b.rooms.find((x) => x.at === sq);
  if (r?.staff && roomOpen(block, r, data) && !b.posts.some((p) => p.id === r.staff && p.at !== sq) && !ids.includes(r.staff)) ids.push(r.staff);
  return ids.map((id) => block.crew.find((c) => c.id === id && c.where === 'in')).filter((c): c is Crew => !!c);
}

/** A Freezes on a bad night doesn't fight (one in three, hashed from the seed and the day: no gameplay stream moves). */
const freezes = (block: EvilModeBlock, c: Crew) => c.flaw === 'freezes' && new Rng(hashSeed(`${block.district?.seed ?? ''}::evil-walk::${block.here.day}::${c.id}`)).int(1, 3) === 1;

/** Start the walk at the In person beat. */
export function walkIt(block: EvilModeBlock, data: EvilData = EVIL_DATA): WalkOut {
  const b = block.base;
  if (!b) return no(block, 'There is no base yet.');
  if (block.here.beat !== 'inPerson') return no(block, 'Walking it takes the in-person slot: at the In person beat.');
  if (block.inPerson?.day === block.here.day) return no(block, 'The Boss has already been out today.');
  if (block.fight) return no(block, 'A battle is waiting.');
  if (!block.hero) return no(block, data.base.walk.noHero!);
  const route = routeOf(layoutOf(b), data);
  if (route.length < 2) return no(block, 'There is no way through.');
  const walk = { day: block.here.day, route, at: 0, beaten: [], lines: [data.base.walk.door!] };
  const out: EvilModeBlock = { ...block, inPerson: { day: block.here.day, holdingId: 'base' }, base: { ...b, walk } };
  return advance(out, data);
}

/** What's written on entering a square: the door crossed, the floor, the room. */
function squareLines(block: EvilModeBlock, b: BaseState, i: number, data: EvilData): string[] {
  const route = b.walk!.route;
  const sq = route[i]!;
  const out: string[] = [];
  if (i > 0) {
    const door = b.pieces.find((p) => isEdge(p.at) && p.at.split('|').includes(sq) && p.at.split('|').includes(route[i - 1]!));
    if (door) {
      const d = pieceDef(door.type, data);
      const ask = door.quiz ? data.base.quiz.find((q) => q.id === door.quiz![0])?.ask ?? '' : '';
      out.push(fill(d.writes, { ask }));
    }
  }
  const floor = b.pieces.find((p) => p.at === sq);
  if (floor) out.push(pieceDef(floor.type, data).writes);
  const r = b.rooms.find((x) => x.at === sq);
  if (r && r.type !== 'office' && roomOpen(block, r, data)) out.push(`${roomDef(r.type, data).name}. ${roomDef(r.type, data).says}`);
  return out;
}

/** Walk on until a battle or the Office. */
export function advance(block: EvilModeBlock, data: EvilData = EVIL_DATA): WalkOut {
  let b = block.base!;
  let w = b.walk!;
  const W = data.base.walk;
  const g = gridOf(b.site, data);
  const lines: string[] = [];
  for (let guard = 0; guard < 200; guard++) {
    const sq = w.route[w.at]!;
    if (!w.beaten.includes(`${sq}|enter`)) {
      lines.push(...squareLines(block, b, w.at, data));
      w = { ...w, beaten: [...w.beaten, `${sq}|enter`] };
    }
    if (sq === g.office) {
      lines.push(w.beaten.some((x) => !x.endsWith('|enter')) ? W.office! : W.nobody!, W.office!);
      const end = [...new Set(lines)];
      w = { ...w, end: 'office', lines: [...w.lines, ...end] };
      b = { ...b, walk: w, walked: { day: block.here.day, what: [] } };
      return { block: { ...block, base: b }, problem: null, lines: end, fight: false };
    }
    for (const c of peopleAt(block, b, sq, data)) {
      const k = `${sq}|${c.id}`;
      const band = bandOf(c.loyalty, data);
      const rounds = band.does === 'again' ? 2 : 1;
      const done = w.beaten.filter((x) => x.startsWith(`${k}|`)).length;
      if (done >= rounds) continue;
      if (band.does === 'opened' || band.does === 'aside' || freezes(block, c)) {
        lines.push(fill(band.does === 'opened' ? W.opened! : band.does === 'aside' ? W.aside! : W.freezes!, { name: c.name }), ...(band.does === 'aside' ? [`"${band.says}"`] : []));
        w = { ...w, beaten: [...w.beaten, `${k}|x`] };
        continue;
      }
      if (done === 0) {
        lines.push(`${c.name}: "${band.says}"`);
        if (c.flaw === 'kind') lines.push(fill(W.kind!, { name: c.name }));
        if (c.flaw === 'talks') {
          const next = w.route[w.at + 1];
          if (next) lines.push(fill(W.talks!, { name: c.name, next: roomName(g, b, next, data).replace(/^The /, 'the ') }));
        }
      } else lines.push(fill(W.again!, { name: c.name }));
      w = { ...w, lines: [...w.lines, ...lines] };
      const out: EvilModeBlock = { ...block, base: { ...b, walk: w }, fight: { kind: 'walk', holdingId: 'base', personId: c.id, begun: false } };
      return { block: out, problem: null, lines, fight: true };
    }
    w = { ...w, at: w.at + 1 };
  }
  return { block: { ...block, base: { ...b, walk: w } }, problem: null, lines, fight: false };
}

/** How many times this person's been fought on this walk (a Devoted Grunt's second fight is one Pokémon at 1 HP). */
export function walkRound(block: EvilModeBlock, personId: string): number {
  const w = block.base?.walk;
  if (!w) return 1;
  const sq = w.route[w.at]!;
  return w.beaten.filter((x) => x.startsWith(`${sq}|${personId}|`)).length + 1;
}

/** A walk battle's over. Won: on to the next door. Lost: the borrowed party's done, and so's the walk. Nobody's hurt. */
export function walkResult(block: EvilModeBlock, won: boolean, data: EvilData = EVIL_DATA): WalkOut {
  const b = block.base;
  const f = block.fight;
  if (!b?.walk || !f || f.kind !== 'walk') return no(block, 'No walk is waiting.');
  const sq = b.walk.route[b.walk.at]!;
  const cleared: EvilModeBlock = { ...block, fight: null };
  if (!won) {
    const w = { ...b.walk, end: 'lost' as const, lines: [...b.walk.lines, data.base.walk.lost!] };
    return { block: { ...cleared, base: { ...b, walk: w, walked: { day: block.here.day, what: [] } } }, problem: null, lines: [data.base.walk.lost!], fight: false };
  }
  const n = walkRound(block, f.personId!);
  const w = { ...b.walk, beaten: [...b.walk.beaten, `${sq}|${f.personId}|${n}`] };
  return advance({ ...cleared, base: { ...b, walk: w } }, data);
}

/** Put the walk away (the pseudo-stage closes; the day goes on where it was). */
export function closeWalk(block: EvilModeBlock): WalkOut {
  const b = block.base;
  if (!b?.walk) return no(block, 'No walk to close.');
  if (!b.walk.end) return no(block, 'The walk is still going.');
  return { block: { ...block, base: { ...b, walk: null } }, problem: null, lines: [], fight: false };
}

/** At Morning: yesterday's walk, and what the Night after it changed, go in the Ledger (Part 17 section 4). */
export function walkedLine(block: EvilModeBlock, data: EvilData = EVIL_DATA): EvilModeBlock {
  const b = block.base;
  if (!b?.walked || b.walked.day >= block.here.day) return b?.walk && b.walk.day < block.here.day ? { ...block, base: { ...b, walk: null } } : block;
  const W = data.base.walk;
  const text = b.walked.what.length ? fill(W.then!, { what: b.walked.what.join('; ') }) : W.same!;
  const out: EvilModeBlock = { ...block, base: { ...b, walked: null, walk: null } };
  return appendLog(out, { kind: 'base', who: [], text: `Day ${b.walked.day}. ${text}` });
}
