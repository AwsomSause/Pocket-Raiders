// Greenneedle gn.new.13, The Ones You Left (doc GREENNEEDLE_PLACED_1.md lines 479–506).
// Run memory only: "the ones you left" are Pokémon let go, boxed or lost EARLIER IN THIS RUN. Released catches are noted in the run flag
// `left:ledger` (`noteLeft`, called where a catch is released); the Nuzlocke memorial adds the fallen; the PC adds the boxed.
// At the door the team is frozen in `left:team` (up to six). You may take one back (mark `came-back`, one move it knew then) or bury the
// notebook. The others each decide by a seeded shuffle: one walks into the woods, the rest split between a passing trainer and the
// camp; a boxed one is still yours and goes on waiting. The script's lines are written from the count, so one Ball reads as one. Fates are kept in `left:fates` ("species:fate,...") so the Final Reunion (gn.61) can read them.
import type { Content } from '../contentSchema';
import { getSpecies, isUsableMove } from '../pokemon';
import { hashSeed, Rng } from '../rng';
import type { PokemonInstance, RunState } from '../state';

const f = (run: Pick<RunState, 'story'>, k: string): number => Number(run.story.flags[`ev:${k}`] ?? 0);
export const LEDGER = 'left:ledger';
export const TEAM = 'left:team';
export const FATES = 'left:fates';
export interface Left { speciesId: string; level: number; from: 'released' | 'fallen' | 'boxed'; uid?: string; nick?: string }

/** A caught Pokémon was released this run: remember it for the camp. */
export function noteLeft(run: Pick<RunState, 'story'>, mon: Pick<PokemonInstance, 'speciesId' | 'level'>): void {
  const old = typeof run.story.flags[LEDGER] === 'string' ? (run.story.flags[LEDGER] as string).split('|') : [];
  run.story.flags[LEDGER] = [...old, `${mon.speciesId}:${mon.level}`].slice(-12).join('|');
}

const clean = (s: string): string => s.replace(/[:|,]/g, ' ').trim();
/** Who is waiting: the frozen team once the door is opened, else the live list (released, fallen, boxed; the newest of each first). */
export function leftTeam(run: RunState): Left[] {
  const frozen = run.story.flags[TEAM];
  if (typeof frozen === 'string') {
    return frozen.split('|').flatMap((p) => {
      const [speciesId, level, from, uid, nick] = p.split(':');
      return speciesId && level && (from === 'released' || from === 'fallen' || from === 'boxed') ? [{ speciesId, level: Number(level), from, ...(uid ? { uid } : {}), ...(nick ? { nick } : {}) }] : [];
    });
  }
  const ledger = typeof run.story.flags[LEDGER] === 'string' ? (run.story.flags[LEDGER] as string).split('|').reverse() : [];
  const released: Left[] = ledger.flatMap((p) => {
    const [speciesId, level] = p.split(':');
    return speciesId && level ? [{ speciesId, level: Number(level), from: 'released' as const }] : [];
  });
  const fallen: Left[] = [...(run.nuzlocke?.memorial ?? [])].reverse().map((m) => ({ speciesId: m.speciesId, level: m.level, from: 'fallen' as const }));
  const boxed: Left[] = [...run.box].reverse().map((m) => ({ speciesId: m.speciesId, level: m.level, from: 'boxed' as const, uid: m.uid, ...(m.care?.nickname ? { nick: clean(m.care.nickname) } : {}) }));
  // Round-robin so one source cannot crowd out the others.
  const out: Left[] = [];
  const lists = [released, fallen, boxed];
  for (let i = 0; out.length < 6 && lists.some((l) => i < l.length); i++) for (const l of lists) if (out.length < 6 && l[i]) out.push(l[i]!);
  return out;
}

/** The n-th Ball (1..6) is still shut: it exists and nothing was taken. */
export const leftHas = (run: RunState, n: number): boolean => !!leftTeam(run)[n - 1] && f(run, 'left-took') === 0;

/** Freezes the team (once) so the Balls stay the same while you choose. */
export function leftFreeze(run: RunState): void {
  if (typeof run.story.flags[TEAM] === 'string') return;
  run.story.flags[TEAM] = leftTeam(run).map((m) => [m.speciesId, m.level, m.from, m.uid ?? '', m.nick ?? ''].join(':')).join('|');
}

const nameOf = (content: Content, id: string): string => content.species.get(id)?.name ?? id;
const called = (content: Content, m: Left): string => (m.nick ? `${m.nick} the ${nameOf(content, m.speciesId)}` : nameOf(content, m.speciesId));

const COUNT = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six'];
const listed = (xs: string[]): string => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);
const withLevel = (content: Content, m: Left): string => `${called(content, m)} (Lv ${m.level})`;

/** What the others did, in the morning: written from the fates, so it fits however many were left (one to six). */
export function leftMorning(content: Content, run: RunState): string {
  const fates = fatesOf(run);
  if (fates.length === 0) return 'There is nobody else left to decide. The log is bare, and the fire stays cold.';
  const of = (fate: string): string[] => fates.filter((x) => x.fate === fate).map((x) => nameOf(content, x.speciesId));
  const [trainer, stay, wait, woods] = [of('trainer'), of('camp'), of('wait'), of('woods')];
  const lines = [fates.length === 1 ? 'The other one decides for itself, and you do not get a vote. That is the whole of it.' : 'The others decide for themselves, and you do not get a vote. That is the whole of it.'];
  if (trainer.length === 1) lines.push(`${trainer[0]} goes with a passing trainer, who calls out, "A good one, this. I'll look after it."`);
  if (trainer.length > 1) lines.push(`${listed(trainer)} go with a passing trainer, who calls out, "Good ones, these. I'll look after them."`);
  if (stay.length === 1) lines.push(`${stay[0]} stays at the camp. It will keep the fire going.`);
  if (stay.length > 1) lines.push(`${listed(stay)} stay at the camp. They will keep the fire going.`);
  // A boxed Pokémon is still the player's: it goes on waiting where it was put.
  if (wait.length === 1) lines.push(`${wait[0]} goes back into its Ball by itself. It is still yours. It will go on waiting until you call.`);
  if (wait.length > 1) lines.push(`${listed(wait)} go back into their Balls by themselves. They are still yours. They will go on waiting until you call.`);
  if (woods.length > 0) lines.push(`One walks into the woods, ${woods[0]}, and does not look back. You watch the trees until you cannot tell which one it was.`);
  return lines.join('\n\n');
}

/**
 * `{left:1}`..`{left:6}` (name and old level), `{left:list}`, `{left:woods}`, `{left:took}`; and the lines that change with how many
 * were left: `{left:row}` (the Balls on the log), `{left:open}` (they open), `{left:first}` / `{left:others}` (the log's two halves),
 * `{left:morning}` (what the others did).
 */
export function leftTokens(content: Content, run: RunState, text: string): string {
  const team = leftTeam(run);
  const woods = fatesOf(run).find((x) => x.fate === 'woods');
  const took = team[f(run, 'left-took') - 1];
  const one = team.length === 1;
  return text
    .replace(/\{left:([1-6])\}/g, (_, n: string) => (team[Number(n) - 1] ? withLevel(content, team[Number(n) - 1]!) : 'an empty Ball'))
    .replaceAll('{left:list}', listed(team.map((m) => called(content, m))))
    .replaceAll('{left:row}', one ? 'One Poké Ball on a log, and beside it' : `${COUNT[team.length] ?? 'Six'} Poké Balls in a row on a log, and beside them`)
    .replaceAll('{left:open}', one
      ? 'The Ball opens by itself. It has been waiting. It looks at you the way a Pokémon looks at someone it remembers walking beside.'
      : 'The Balls open by themselves. They have been waiting. They look at you the way a Pokémon looks at someone it remembers walking beside.')
    .replaceAll('{left:first}', one ? `The only one on the log: ${withLevel(content, team[0]!)}.` : team.length <= 3 ? `On the log: ${listed(team.map((m) => withLevel(content, m)))}.` : `The first three, on the left of the log: ${listed(team.slice(0, 3).map((m) => withLevel(content, m)))}.`)
    .replaceAll('{left:others}', team.length === 4 ? `The last one, on the right of the log: ${withLevel(content, team[3]!)}.` : `The rest, on the right of the log: ${listed(team.slice(3).map((m) => withLevel(content, m)))}.`)
    .replaceAll('{left:morning}', leftMorning(content, run))
    .replaceAll('{left:woods}', woods ? nameOf(content, woods.speciesId) : 'the last one')
    .replaceAll('{left:took}', took ? called(content, took) : 'the one you took');
}

export function fatesOf(run: Pick<RunState, 'story'>): { speciesId: string; fate: string }[] {
  const raw = run.story.flags[FATES];
  if (typeof raw !== 'string') return [];
  return raw.split(',').flatMap((p) => {
    const [speciesId, fate] = p.split(':');
    return speciesId && fate ? [{ speciesId, fate }] : [];
  });
}

/**
 * After the choice: the Pokémon not taken decide. Of the ones that are really gone (released, or fallen), one walks into the woods; of the
 * rest, the first half go with a passing trainer and the others stay at the camp. A boxed Pokémon is still the player's: it waits (`wait`).
 */
export function leftFates(run: RunState): string {
  if (run.story.flags[FATES] !== undefined) return '';
  const took = f(run, 'left-took');
  const rest = leftTeam(run).filter((_, i) => i + 1 !== took);
  if (rest.length === 0) return '';
  const rng = new Rng(hashSeed(`${run.seed}::the-ones-you-left`));
  const gone = rest.filter((m) => m.from !== 'boxed');
  const order = gone.map((m, i) => ({ m, k: rng.float(), i })).sort((a, b) => a.k - b.k || a.i - b.i).map((x) => x.m);
  const walkers = Math.ceil((order.length - 1) / 2);
  run.story.flags[FATES] = [
    ...order.map((m, i) => `${m.speciesId}:${i === 0 ? 'woods' : i <= walkers ? 'trainer' : 'camp'}`),
    ...rest.filter((m) => m.from === 'boxed').map((m) => `${m.speciesId}:wait`),
  ].join(',');
  return '';
}

/** Take the n-th Ball: it comes back marked `came-back`, with one move it knew then. A boxed one leaves the PC for the party (when there is room). */
export function leftTake(content: Content, run: RunState, n: number, host: { apply: (e: unknown) => string }): string {
  const slot = leftTeam(run)[n - 1];
  if (!slot || f(run, 'left-took') > 0 || !content.species.has(slot.speciesId)) return '';
  run.story.flags['ev:left-took'] = n;
  if (slot.from === 'boxed') {
    const at = run.box.findIndex((m) => m.uid === slot.uid);
    const mon = run.box[at];
    if (!mon) return '';
    mon.gn = [...(mon.gn ?? []), 'came-back'];
    knewThen(content, mon);
    if (run.party.length >= 6) return `${called(content, slot)} is out of the PC again, and waits in the box for a place beside you.`;
    run.box.splice(at, 1);
    run.party.push(mon);
    return `${called(content, slot)} stays by your side!`;
  }
  const before = new Set([...run.party, ...run.box].map((m) => m.uid));
  const words = host.apply({ kind: 'join', recall: false, species: [slot.speciesId], types: [], levelBonus: 0, shinyMultiplier: 1, shadow: false, blissful: false, hiddenAbility: false, moves: [], direct: true, alpha: false, starterType: false, asIs: true, mark: 'came-back' });
  const mon = [...run.party, ...run.box].find((m) => !before.has(m.uid) && m.speciesId === slot.speciesId);
  if (mon) knewThen(content, mon);
  return words;
}

/** The latest move of its line it could have learned by then, if it does not know it already. */
function knewThen(content: Content, mon: PokemonInstance): void {
  const known = new Set(mon.moves.map((m) => m.id));
  const old = getSpecies(content, mon.speciesId).learnset.filter((x) => x.level <= mon.level && !known.has(x.move) && isUsableMove(content, x.move)).map((x) => x.move);
  const id = old[old.length - 1];
  if (!id) return;
  const slot = { id, pp: content.moves.get(id)!.pp };
  if (mon.moves.length < 4) mon.moves.push(slot);
  else mon.moves[3] = slot;
}
