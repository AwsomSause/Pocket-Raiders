// Greenneedle gn.62, The Pokémon Prison (doc GREENNEEDLE_REWORKED_PLACED_13.md lines 290–386).
// The team is taken and kept in four wings; the player is alone, on foot, with a clock of six steps. Each wing is a short corridor with
// one watcher on a loop of three to six steps (a dog, a guard, a camera, a searchlight). Waiting shows the watcher's next step. Being seen
// costs the clock one step, not the run. Freed Pokémon follow and can fight; the warden waits at the gatehouse.
// The held team lives in the box (tag `pr-held`, `pr-wing:<n>`), like the Frontier's bench; every flag here is a run flag.
import type { Content } from '../contentSchema';
import type { BattleState, PokemonInstance, RunState } from '../state';
import { bondLevelFriendship } from '../co/who';

const f = (run: Pick<RunState, 'story'>, k: string): number => Number(run.story.flags[`ev:${k}`] ?? 0);
const set = (run: Pick<RunState, 'story'>, k: string, n: number): void => {
  run.story.flags[`ev:${k}`] = Math.max(0, n);
};

export const CLOCK = 6;
export const HELD = 'pr-held';
export const FREED = 'pr-freed';
const wingTag = (w: number): string => `pr-wing:${w}`;

interface Wing { name: string; room: string; len: number; strangers: number; loop: number[]; who: string }
/** Corridors: cell 0 is the door, cell `len` the cell. A loop is the watcher's cells, one per step (0 = nobody that step). */
export const WINGS: Record<number, Wing> = {
  1: { name: 'the Kennels', room: 'north', len: 5, strangers: 2, loop: [2, 3, 4, 3], who: 'The tracker-dog' },
  2: { name: 'the Tanks', room: 'east', len: 5, strangers: 2, loop: [2, 3, 4, 3, 2, 1], who: 'The guard' },
  3: { name: 'the Quiet Cells', room: 'south', len: 4, strangers: 1, loop: [3, 0, 0], who: 'The camera' },
  4: { name: 'the Yard', room: 'west', len: 5, strangers: 2, loop: [1, 2, 3, 4, 3, 2], who: 'The searchlight' },
};
export const wingName = (w: number): string => WINGS[w]?.name ?? 'the wing';

const nameOf = (content: Content, m: PokemonInstance): string => content.species.get(m.speciesId)?.name ?? 'Pokémon';
const wingOfMon = (m: PokemonInstance): number => Number(m.gn?.find((t) => t.startsWith('pr-wing:'))?.slice(8) ?? 0);
const held = (run: RunState): PokemonInstance[] => run.box.filter((m) => m.gn?.includes(HELD));
const syncLeft = (run: RunState): void => {
  const mine = held(run);
  set(run, 'pr-unfreed', mine.filter((m) => !m.gn?.includes(FREED)).length);
  set(run, 'pr-any', run.party.some((m) => m.gn?.includes(FREED)) ? 1 : 0);
};
const here = (run: RunState) => run.stage?.map.nodes.find((n) => n.id === run.stage!.current);

/** Opens a scene beside the node the player stands on (the same as the `scene` step, picked in code). */
function openScene(content: Content, run: RunState, id: string): void {
  const node = here(run);
  if (!node || !content.events.has(id)) return;
  node.sides.push({ id: `event-room-${node.sides.length + 1}-${node.id}`, kind: 'event', used: false, eventId: id });
  if (run.itemCounters) delete run.itemCounters[`event-seen:${id}`];
}

/** Which wing keeps whom: the flyers in the Yard, the water and ice Pokémon in the Tanks, the youngest and best bonded in the Quiet Cells, the strongest in the Kennels. */
export function assignWings(content: Content, team: PokemonInstance[]): Map<string, number> {
  const out = new Map<string, number>();
  const types = (m: PokemonInstance): string[] => content.species.get(m.speciesId)?.types ?? [];
  const bonded = bondLevelFriendship(content, 3);
  let rest = [...team];
  const take = (w: number, test: (m: PokemonInstance) => boolean): void => {
    for (const m of rest.filter(test)) out.set(m.uid, w);
    rest = rest.filter((m) => !out.has(m.uid));
  };
  take(4, (m) => types(m).includes('flying'));
  take(2, (m) => types(m).includes('water') || types(m).includes('ice'));
  take(3, (m) => m.friendship >= bonded || !!m.gn?.some((t) => t.startsWith('home:')));
  rest.sort((a, b) => b.level - a.level);
  const big = Math.ceil(rest.length / 2);
  rest.forEach((m, i) => out.set(m.uid, i < big ? 1 : 3));
  return out;
}

/** The cell: everything taken, the old man next door, the clock at zero. Trust 3 with the defector (gn.50) leaves the door unlatched and a guard's cap on the cot. */
export function prStart(content: Content, run: RunState): string {
  if (f(run, 'pr-in') > 0) return '';
  for (const k of Object.keys(run.story.flags)) if (k.startsWith('ev:pr-')) delete run.story.flags[k];
  const team = [...run.party];
  const wings = assignWings(content, team);
  for (const m of team) m.gn = [...(m.gn ?? []).filter((t) => t !== HELD && t !== FREED && !t.startsWith('pr-wing:')), HELD, wingTag(wings.get(m.uid) ?? 1)];
  run.box = [...run.box, ...team];
  run.party = [];
  set(run, 'pr-in', 1);
  for (const w of [1, 2, 3, 4]) {
    set(run, `pr-mine-${w}`, team.filter((m) => wings.get(m.uid) === w).length);
    set(run, `pr-str-${w}`, WINGS[w]!.strangers);
  }
  if (f(run, 'defector-trust') >= 3) { set(run, 'pr-disguise', 1); set(run, 'prison-door-open', 1); }
  set(run, 'prison-seen', 1);
  syncLeft(run);
  return '';
}

/** Walks into a wing: the door end of its corridor, time starts over. */
export function prEnter(run: RunState, wing: number): string {
  set(run, 'pr-loc', wing);
  set(run, 'pr-pos', 0);
  set(run, 'pr-t', 0);
  set(run, 'pr-peek', 0);
  set(run, 'pr-decoy', 0);
  set(run, 'pr-hide', 0);
  return '';
}

/** The cells the watcher covers at step `t`. */
export function watched(run: Pick<RunState, 'story'>, wing: number, t: number): number[] {
  const w = WINGS[wing];
  if (!w || f(run, 'pr-clear-' + wing) > 0) return [];
  const at = w.loop[((t % w.loop.length) + w.loop.length) % w.loop.length]!;
  if (at === 0) return [];
  const chaos = f(run, 'pr-chaos') > 0;
  const loud = f(run, 'pr-loud') > 0;
  // The dog tracks by scent unless water or the kitchen's smell covers it; a disguise fools a guard, but not a dog, a camera or a lamp.
  if (wing === 1) return !chaos && f(run, 'pr-smell') === 0 ? [at - 1, at, at + 1] : [at];
  if (wing === 2) return !chaos && (f(run, 'pr-disguise') === 0 || loud) ? [at - 1, at, at + 1] : [at];
  if (wing === 4) return loud ? [at, at + 1] : [at];
  return [at];
}

/** One step in a wing: `go` moves a cell on (the Tanks' wet floor is loud: the guard comes to the sound), `wait` stays and learns the next step. */
export function prStep(run: RunState, action: 'go' | 'wait'): string {
  const wing = f(run, 'pr-loc');
  const w = WINGS[wing];
  if (!w) return '';
  const pos = f(run, 'pr-pos') + (action === 'go' ? 1 : 0);
  const t = f(run, 'pr-t') + 1 + (wing === 2 && action === 'go' ? 1 : 0);
  set(run, 'pr-pos', Math.min(pos, w.len));
  set(run, 'pr-t', t);
  set(run, 'pr-peek', action === 'wait' ? 1 : 0);
  const safe = f(run, 'pr-decoy') > 0 || f(run, 'pr-hide') > 0;
  if (f(run, 'pr-decoy') > 0) set(run, 'pr-decoy', f(run, 'pr-decoy') - 1);
  if (f(run, 'pr-hide') > 0) set(run, 'pr-hide', f(run, 'pr-hide') - 1);
  if (!safe && pos > 0 && watched(run, wing, t).includes(Math.min(pos, w.len))) return prCaught(run);
  return '';
}

/** Seen: walked back to the cell. The clock moves on one step; everything already unlocked stays unlocked. */
export function prCaught(run: RunState): string {
  set(run, 'pr-clock', Math.min(CLOCK, f(run, 'pr-clock') + 1));
  set(run, 'pr-caught', 1);
  set(run, 'pr-loc', 0);
  set(run, 'pr-pos', 0);
  set(run, 'prison-caught', f(run, 'prison-caught') + 1);
  return '';
}

const clockUp = (run: RunState, n = 1): void => set(run, 'pr-clock', Math.min(CLOCK, f(run, 'pr-clock') + n));

/** Frees the wing's own Pokémon: they follow and fight. Who goes first shapes the rest (a big one is loud, a small one fits the cart, a flyer sees ahead). */
export function prFree(run: RunState, wingArg: number): string {
  const wing = wingArg || f(run, 'pr-loc');
  const mine = held(run).filter((m) => wingOfMon(m) === wing && !m.gn?.includes(FREED));
  if (mine.length === 0) return '';
  const order = Object.keys(run.story.flags).filter((k) => k.startsWith('ev:prison-freed-')).length + 1;
  set(run, `prison-freed-${wing}`, order);
  if (order === 1) {
    if (wing === 1) set(run, 'pr-loud', 1);
    if (wing === 3) set(run, 'pr-small', 1);
    if (wing === 4) set(run, 'pr-sees', 1);
  }
  if (wing === 2) set(run, 'pr-smell', 1);
  for (const m of mine) m.gn = [...(m.gn ?? []), FREED];
  run.box = run.box.filter((m) => !mine.includes(m));
  run.party = [...run.party, ...mine].slice(0, 6);
  run.box = [...run.box, ...[...run.party, ...mine].slice(6)];
  set(run, `pr-done-own-${wing}`, 1);
  syncLeft(run);
  return '';
}

/** The strangers in this wing: 1 open them all (a step of the clock, a great deal for the guards to do), 2 just mine, 3 open and wait for the signal. */
export function prStranger(run: RunState, wingArg: number, mode: number): string {
  const wing = wingArg || f(run, 'pr-loc');
  const n = f(run, `pr-str-${wing}`);
  if (mode === 1) {
    clockUp(run, 1);
    set(run, 'pr-chaos', f(run, 'pr-chaos') + 1);
    set(run, 'prison-strangers-open', f(run, 'prison-strangers-open') + n);
    set(run, 'prison-freed-strangers', f(run, 'prison-freed-strangers') + n);
  } else if (mode === 3) {
    set(run, 'prison-signal', f(run, 'prison-signal') + n);
    set(run, 'prison-freed-strangers', f(run, 'prison-freed-strangers') + n);
  }
  set(run, `pr-done-${wing}`, 1);
  set(run, 'pr-loc', 0);
  set(run, 'pr-pos', 0);
  return '';
}

/** Where the player goes next: the warden when the clock is out (or the gatehouse chosen), the cell caught, the wing's corridor or cell, or the cell block. */
export function prNext(content: Content, run: RunState): string {
  const wing = f(run, 'pr-loc');
  let id = 'gn-62-hub';
  if (f(run, 'pr-clock') >= CLOCK || f(run, 'pr-goto') > 0) { set(run, 'pr-goto', 0); set(run, 'pr-out', f(run, 'pr-clock') >= CLOCK ? 1 : 0); id = f(run, 'pr-any') > 0 ? 'gn-62-warden' : 'gn-62-warden-bare'; }
  else if (f(run, 'pr-caught') > 0) { set(run, 'pr-caught', 0); id = 'gn-62-caught'; }
  else if (wing > 0) id = f(run, 'pr-pos') >= (WINGS[wing]?.len ?? 99) ? 'gn-62-cell-room' : 'gn-62-wing';
  openScene(content, run, id);
  return '';
}

/** What a small action does: supplies, tools, the old man, the guard's key ring. */
export function prDo(run: RunState, what: string, host: { float: () => number }): string {
  switch (what) {
    case 'cap': set(run, 'pr-disguise', 1); return '';
    case 'cart': set(run, 'pr-cart', 1); return '';
    case 'smell': set(run, 'pr-smell', 1); set(run, 'pr-scraps', 1); return '';
    case 'torch': set(run, 'pr-torch', 1); return '';
    case 'whistle': set(run, 'pr-whistle', 1); return '';
    case 'osei-talk': set(run, 'pr-intel', 1); return '';
    case 'osei': set(run, 'prison-osei', 1); return '';
    case 'snore': set(run, 'pr-snore', (f(run, 'pr-snore') + 1) % 3); return '';
    case 'ring':
      // The ring rises and falls with his breathing: only in the pause does it come away.
      if (f(run, 'pr-snore') === 2) { set(run, 'pr-keys', 1); return ''; }
      return prCaught(run);
    case 'use-whistle': set(run, 'pr-decoy', 2); set(run, 'pr-whistle', 0); return '';
    case 'use-cart': set(run, 'pr-hide', f(run, 'pr-small') > 0 ? 5 : 3); set(run, 'pr-cart', 0); return '';
    case 'clear': set(run, `pr-clear-${f(run, 'pr-loc')}`, 1); return '';
    case 'back': set(run, 'pr-loc', 0); set(run, 'pr-pos', 0); return '';
    case 'gate': set(run, 'pr-goto', 1); return '';
    case 'signal': set(run, 'pr-signaled', 1); return '';
    case 'return': return prReturn(run);
    case 'roll': set(run, 'pr-roll', host.float() < 0.5 ? 1 : 2); return '';
    default: return '';
  }
}

/** Going back for the ones left behind costs the clock's last step, and is always possible. */
export function prReturn(run: RunState): string {
  const left = held(run).filter((m) => !m.gn?.includes(FREED));
  if (left.length === 0) return '';
  for (const m of left) m.gn = [...(m.gn ?? []), FREED];
  run.box = run.box.filter((m) => !left.includes(m));
  run.party = [...run.party, ...left].slice(0, 6);
  run.box = [...run.box, ...[...run.party, ...left].slice(6)];
  clockUp(run, 1);
  set(run, 'prison-went-back', 1);
  syncLeft(run);
  return '';
}

/** The warden's battle: if the strangers were told to wait and the player gave the signal, they pour in and his first two Pokémon don't get to act. */
export function prWardenStart(run: RunState, battle: BattleState, waits: string): void {
  if (f(run, 'pr-signaled') === 0 || f(run, 'prison-signal') === 0) return;
  battle.storyEffects.push(`${waits}Every stranger's Pokémon in the building pours into the gatehouse. The warden's first Pokémon is surrounded and can't move.`);
  battle.storyEffects.push(`${waits}The second is buried under them before the warden finishes saying its name.`);
}

/** After the warden: everyone comes home (any the player didn't reach noticed: Bond -1); `won` 1 won, 2 lost. */
export function prEnd(content: Content, run: RunState, won: number): string {
  syncLeft(run);
  const left = held(run).filter((m) => !m.gn?.includes(FREED));
  for (const m of left) m.friendship = Math.max(0, m.friendship - 5);
  set(run, 'prison-left', left.length);
  const all = [...run.party, ...held(run)];
  for (const m of all) m.gn = (m.gn ?? []).filter((t) => t !== HELD && t !== FREED && !t.startsWith('pr-wing:'));
  run.box = run.box.filter((m) => !all.includes(m));
  run.party = all.slice(0, 6);
  run.box = [...run.box, ...all.slice(6)];
  const mode = f(run, 'prison-signal') > 0 ? 3 : f(run, 'prison-strangers-open') > 0 ? 1 : 2;
  set(run, 'prison-strangers', mode);
  set(run, 'prison-warden', won === 1 ? 1 : 2);
  set(run, 'prison-reunions', f(run, 'prison-freed-strangers'));
  set(run, 'pr-in', 0);
  void content;
  return '';
}

/** Tokens: {prison:clock}, {prison:wing}, {prison:cell}, {prison:strangers}, {prison:snore}, {prison:left}, {prison:status}, {prison:gear}, {prison:reunion}. */
export function prisonTokens(content: Content, run: RunState, text: string): string {
  const wing = f(run, 'pr-loc');
  const w = WINGS[wing];
  const clock = f(run, 'pr-clock');
  const bar = '▮'.repeat(clock) + '▯'.repeat(CLOCK - clock);
  const lines: string[] = [];
  if (w) {
    const pos = f(run, 'pr-pos');
    const t = f(run, 'pr-t');
    const now = new Set(watched(run, wing, t));
    const cells = Array.from({ length: w.len + 1 }, (_, i) => (i === pos ? '@' : now.has(i) && i > 0 ? '▲' : i === 0 ? '▭' : i === w.len ? '▣' : '·'));
    lines.push(`${cells.join(' ')}\n(@ you, ▲ ${w.who.toLowerCase()}'s reach, ▭ the door, ▣ the cell)`);
    if (f(run, 'pr-peek') > 0 || f(run, 'pr-torch') > 0 || f(run, 'pr-intel') > 0 || f(run, 'pr-sees') > 0) {
      const next = watched(run, wing, t + 1).filter((c) => c > 0);
      lines.push(next.length ? `Next step: ${w.who.toLowerCase()} reaches cell ${next.join(', ')}.` : `Next step: ${w.who.toLowerCase()} looks away.`);
    }
    if (f(run, 'pr-decoy') > 0) lines.push('The whistle still rings in the wrong corridor. Nobody is watching here.');
    if (f(run, 'pr-hide') > 0) lines.push('You\'re under the laundry in the cart. Nobody sees a cart.');
  }
  const mine = w ? held(run).filter((m) => wingOfMon(m) === wing && !m.gn?.includes(FREED)).map((m) => nameOf(content, m)) : [];
  const unfreed = held(run).filter((m) => !m.gn?.includes(FREED));
  const gear = [f(run, 'pr-keys') ? 'the key ring' : '', f(run, 'pr-disguise') ? 'a guard\'s cap and jacket' : '', f(run, 'pr-cart') ? 'the laundry cart' : '', f(run, 'pr-whistle') ? 'a whistle' : '', f(run, 'pr-torch') ? 'a torch' : '', f(run, 'pr-scraps') ? 'the kitchen\'s scraps' : ''].filter(Boolean);
  const done = [1, 2, 3, 4].filter((i) => f(run, `pr-done-${i}`) > 0).map(wingName);
  const snore = ['He breathes in. The key ring rises on his chest.', 'He breathes out. The ring settles with a small clink.', 'A pause. Nothing moves, and the ring lies still.'][f(run, 'pr-snore') % 3]!;
  return text
    .replaceAll('{prison:clock}', `The clock: ${bar} (${clock} of ${CLOCK})`)
    .replaceAll('{prison:wing}', lines.join('\n\n'))
    .replaceAll('{prison:cell}', mine.length ? `${mine.join(' and ')} ${mine.length > 1 ? 'are' : 'is'} here, in the cells at the back.` : 'None of yours are kept here. Only strangers\'.')
    .replaceAll('{prison:strangers}', `${f(run, `pr-str-${wing}`)} strangers' Pokémon, taken the same way, in the cells beside`)
    .replaceAll('{prison:snore}', snore)
    .replaceAll('{prison:left}', unfreed.length ? unfreed.map((m) => `${nameOf(content, m)} is still in ${wingName(wingOfMon(m))}. It'll know.`).join('\n\n') : 'Nobody is left behind.')
    .replaceAll('{prison:status}', `${done.length ? `Done: ${done.join(', ')}.` : 'No wing done yet.'} ${gear.length ? `You have: ${gear.join(', ')}.` : 'You have nothing yet.'}`)
    .replaceAll('{prison:gear}', gear.join(', ') || 'nothing');
}

/** The player works for a team: any run flag `team-<id>-inside` is set (the Evil Team inside route; true or false whether or not it has merged). */
export function insideTeam(run: Pick<RunState, 'story'>): boolean {
  return Object.keys(run.story.flags).some((k) => /^ev:team-[a-z0-9-]+-inside$/.test(k) && Number(run.story.flags[k]) > 0);
}

/**
 * Lost to a team's lieutenant or boss: the prison comes instead of the loss's usual road (once per run; never inside a team, after Flight North's
 * theft, or while a prison is running). Returns true when the cell was opened beside the node the player stands on.
 */
export function prisonOnLoss(content: Content, run: RunState, rank: string | undefined): boolean {
  if (rank !== 'executive' && rank !== 'leader') return false;
  if (f(run, 'prison-seen') > 0 || f(run, 'prison-offered') > 0 || f(run, 'pr-in') > 0 || f(run, 'kanto-flight-stolen') > 0 || insideTeam(run)) return false;
  if (!content.events.has('gn-62-cell') || !here(run)) return false;
  set(run, 'prison-offered', 1);
  openScene(content, run, 'gn-62-cell');
  return true;
}
