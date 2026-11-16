// Greenneedle gn.58, Old Friend Returns (doc GREENNEEDLE_REWORKED_PLACED_12.md lines 369–450).
// Every Pokémon the player lets go at the catch screen keeps an identity: its nickname, where it was let go, and why (the release screen asks once).
// Two or more stages later it turns up again, in the same kind of place if the road allows, at this stage's level, evolved if it could have.
// Within one run only: the records live in the run's story flags (`oldfriend:rel:<n>`, a small JSON line each). Nothing here rolls a gameplay stream
// except the 50% for a new trainer, which uses the event stop's own seeded float.
import type { Content } from '../contentSchema';
import type { BattleState, PokemonInstance, RunState } from '../state';
import { getTheme } from '../themes';
import { getSpecies, maxHp } from '../pokemon';
import { careOf } from '../care';
import { BENCH, BRING } from './frontier';

/** The release screen's four answers; the number is the value of flag `of-why`. */
export const WHY = ['happier', 'room', 'weak', 'none'] as const;
export type ReleaseReason = 1 | 2 | 3 | 4;
export const WHY_LABELS = ['"It\'ll be happier here."', '"I\'ve no room."', '"It wasn\'t strong enough."', '(No reason.)'] as const;

/** At most this many releases are remembered in a run. */
const MAX_RECORDS = 24;
/** Bond 3 or more at the release (friendship 70 + 3 x 5): it comes back if asked. */
const FOND = 85;
/** "A great many": the first one met is followed by others. */
export const MANY = 5;
/** How many others follow the first when so many were let go. */
const FOLLOWERS = 3;
/** Stages that must pass after a release, and the stage count after which any place will do. */
const MIN_AWAY = 2;
const ANY_PLACE = 4;
/** The helper's one turn: this share of the hard fight's first foe, never the last of its HP. */
export const HELP_SHARE = 0.25;
export const GUEST = 'of-guest';
export const CAME_BACK = 'came-back';

export interface Release {
  /** Species, nickname (empty: the species name), where (the stage's theme), its types, why (1-4), the stage number and region index of the release, level, friendship, met (1). */
  s: string; n: string; w: string; t: string[]; y: number; a: number; r: number; l: number; f: number; m?: 1;
}

const flag = (run: Pick<RunState, 'story'>, k: string): number => Number(run.story.flags[`ev:${k}`] ?? 0);
const put = (run: Pick<RunState, 'story'>, k: string, n: number): void => {
  run.story.flags[`ev:${k}`] = n;
};
const slug = (text: string): string => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'none';

const count = (run: Pick<RunState, 'story'>): number => Number(run.story.flags['oldfriend:n'] ?? 0);
export function releases(run: Pick<RunState, 'story'>): Release[] {
  const out: Release[] = [];
  for (let i = 0; i < count(run); i++) {
    try {
      const raw = run.story.flags[`oldfriend:rel:${i}`];
      if (typeof raw === 'string') out.push(JSON.parse(raw) as Release);
    } catch {
      /* a damaged record is skipped, never a crash */
    }
  }
  return out;
}
const save = (run: Pick<RunState, 'story'>, i: number, rec: Release): void => {
  run.story.flags[`oldfriend:rel:${i}`] = JSON.stringify(rec);
};

/** A caught Pokémon was released at the catch screen: remember who, where and why (the doc's flag `released.<species>.<nickname>.<where>.<why>`). */
export function recordRelease(content: Content, run: RunState, mon: PokemonInstance, reason: ReleaseReason | undefined, stage: number): void {
  const n = count(run);
  if (n >= MAX_RECORDS) return;
  const theme = run.stage ? content.themes.get(run.stage.themeId) : undefined;
  const why = reason ?? 4;
  const where = theme?.name ?? 'the road';
  const nick = mon.care?.nickname ?? '';
  save(run, n, { s: mon.speciesId, n: nick, w: where, t: [...(theme?.types ?? [])], y: why, a: stage, r: run.regionIndex, l: mon.level, f: mon.friendship });
  run.story.flags['oldfriend:n'] = n + 1;
  run.story.flags[`released.${mon.speciesId}.${slug(nick)}.${slug(where)}.${WHY[why - 1]}`] = 1;
}

/** The oldest release that is due: two or more stages ago, not met yet, in the same kind of place (or long enough ago that any place will do). */
export function dueFriend(content: Content, run: RunState, stage: number): number {
  const types = run.stage ? [...(content.themes.get(run.stage.themeId)?.types ?? [])] : [];
  return releases(run).findIndex((r) => !r.m && stage - r.a >= MIN_AWAY && (stage - r.a >= ANY_PLACE || r.t.some((t) => types.includes(t as never))));
}

/** The species it is now: evolved as far as plain levelling allows at the stage's level (it never takes a stone or a trade on its own). */
export function evolvedBy(content: Content, speciesId: string, level: number): string {
  let id = speciesId;
  for (let i = 0; i < 3; i++) {
    const sp = content.species.get(id);
    const next = sp?.evolutions.find((e) => e.level !== undefined && e.level <= level && !e.item && !e.region && !e.gender && !e.condition && content.species.has(e.to));
    if (!next) break;
    id = next.to;
  }
  return id;
}

const FLAGS = ['of-why', 'of-trainer', 'of-fond', 'of-help', 'of-told', 'of-free', 'of-many'];

/** gn op `ofPick`: the friend that is due steps up. Its species is cast as `old-friend`; flags say why it went, whether it has a new trainer, whether it is fond. */
export function ofPick(content: Content, run: RunState, stage: number, float: () => number): string {
  const all = releases(run);
  const i = dueFriend(content, run, stage);
  const rec = all[i];
  if (!rec) return '';
  for (const k of FLAGS) put(run, k, 0);
  const avg = Math.round(run.party.reduce((s, m) => s + m.level, 0) / Math.max(1, run.party.length));
  const sp = evolvedBy(content, rec.s, Math.max(rec.l, avg));
  for (const k of Object.keys(run.story.flags)) if (k.startsWith('ev:cast-old-friend:')) delete run.story.flags[k];
  run.story.flags[`ev:cast-old-friend:${sp}`] = 1;
  put(run, 'of-index', i + 1);
  put(run, 'of-why', rec.y);
  // A new trainer: 50%, if a region or more has passed (the roll uses the stop's own float, so a reload gives the same answer).
  const trainer = run.regionIndex > rec.r && float() < 0.5;
  put(run, 'of-trainer', trainer ? 1 : 0);
  put(run, 'of-free', trainer ? 0 : 1);
  put(run, 'of-fond', rec.f >= FOND ? 1 : 0);
  put(run, 'of-help', rec.y === 1 || rec.y === 2 ? 1 : 0);
  put(run, 'of-many', all.length >= MANY ? 1 : 0);
  all[i] = { ...rec, m: 1 };
  save(run, i, all[i]!);
  // Many let go: three of the others are met with it, at a distance.
  let followers = 0;
  if (all.length >= MANY) {
    all.forEach((r, j) => {
      if (j === i || r.m || followers >= FOLLOWERS) return;
      all[j] = { ...r, m: 1 };
      save(run, j, all[j]!);
      followers++;
    });
  }
  // The doc's flags: `oldfriend.met.*` for the Final Reunion to read.
  put(run, 'oldfriend-met', flag(run, 'oldfriend-met') + 1 + followers);
  run.story.flags[`oldfriend.met.${rec.s}`] = 1;
  return '';
}

/** What the friend is called, and where it was let go (`{oldfriend:name}`, `{oldfriend:where}`, `{oldfriend:why}`). */
export function oldfriendTokens(content: Content, run: RunState, text: string): string {
  const rec = releases(run)[flag(run, 'of-index') - 1];
  const now = Object.keys(run.story.flags).find((k) => k.startsWith('ev:cast-old-friend:'))?.slice('ev:cast-old-friend:'.length) ?? rec?.s ?? '';
  const name = rec?.n || (content.species.get(now)?.name ?? 'the Pokémon');
  return text
    .replaceAll('{oldfriend:name}', name)
    .replaceAll('{oldfriend:where}', rec?.w ?? 'the road')
    .replaceAll('{oldfriend:why}', rec ? WHY_LABELS[rec.y - 1]! : '')
    .replaceAll('{oldfriend:species}', content.species.get(now)?.name ?? 'Pokémon');
}

const castNow = (run: Pick<RunState, 'story'>): string | undefined => Object.keys(run.story.flags).find((k) => k.startsWith('ev:cast-old-friend:'))?.slice('ev:cast-old-friend:'.length);

/** The party Pokémon that took its place: the newest one that shares a type with it, else the first able to fight. */
export function replacerOf(content: Content, run: RunState): PokemonInstance | undefined {
  const sp = castNow(run);
  const types = sp ? ((content.species.get(sp)?.types as string[] | undefined) ?? []) : [];
  const able = run.party.filter((m) => m.hp > 0);
  const same = able.filter((m) => ((content.species.get(m.speciesId)?.types as string[] | undefined) ?? []).some((t) => types.includes(t)));
  return [...(same.length > 0 ? same : able)].sort((a, b) => b.uid.localeCompare(a.uid, undefined, { numeric: true }))[0];
}

/** gn op `ofReplacer`: the replacement is the one that fights (the rest wait on the bench: `bench` / `unbench`). */
export function ofReplacer(content: Content, run: RunState): string {
  const mon = replacerOf(content, run);
  if (!mon) return '';
  mon.gn = [...(mon.gn ?? []).filter((t) => t !== BRING), BRING];
  return '';
}

/** The Pokémon joins again as itself (A+0, evolved if it could have), a little fonder, carrying the mark `came-back`. */
export function ofJoin(content: Content, run: RunState, host: { apply: (e: unknown) => string }): string {
  const sp = castNow(run);
  const rec = releases(run)[flag(run, 'of-index') - 1];
  if (!sp || !rec) return '';
  const before = new Set([...run.party, ...run.box].map((m) => m.uid));
  const words = host.apply({ kind: 'join', recall: false, species: [sp], types: [], levelBonus: 0, shinyMultiplier: 1, shadow: false, blissful: false, hiddenAbility: false, moves: [], direct: true, alpha: false, starterType: false, asIs: true, friendship: 10, mark: CAME_BACK });
  const mon = [...run.party, ...run.box].find((m) => !before.has(m.uid) && m.speciesId === sp);
  if (mon && rec.n) careOf(mon).nickname = rec.n;
  put(run, 'of-help', 0);
  put(run, 'oldfriend-rejoined', flag(run, 'oldfriend-rejoined') + 1);
  return words;
}

/** "Walk with me a while": it is a guest for the rest of the stage (a mark, not a party slot of its own), and leaves at the Gym door. */
export function ofGuest(content: Content, run: RunState, host: { apply: (e: unknown) => string }): string {
  const sp = castNow(run);
  if (!sp) return '';
  const before = new Set([...run.party, ...run.box].map((m) => m.uid));
  const words = host.apply({ kind: 'join', recall: false, species: [sp], types: [], levelBonus: 0, shinyMultiplier: 1, shadow: false, blissful: false, hiddenAbility: false, moves: [], direct: true, alpha: false, starterType: false, asIs: true, mark: GUEST });
  const rec = releases(run)[flag(run, 'of-index') - 1];
  const mon = [...run.party, ...run.box].find((m) => !before.has(m.uid) && m.speciesId === sp);
  if (mon && rec?.n) careOf(mon).nickname = rec.n;
  return words;
}

/** The guest leaves at the Gym door, or when the stage ends. Never the last Pokémon in the party. Returns a line, or ''. */
export function ofGuestLeaves(content: Content, run: RunState): string {
  const guests = [...run.party, ...run.box].filter((m) => m.gn?.includes(GUEST));
  if (guests.length === 0) return '';
  const name = guests[0]!.care?.nickname || getSpecies(content, guests[0]!.speciesId).name;
  run.party = run.party.filter((m) => !m.gn?.includes(GUEST) || run.party.length <= 1 || m.uid === run.party[0]?.uid);
  run.box = run.box.filter((m) => !m.gn?.includes(GUEST));
  for (const m of run.party) m.gn = (m.gn ?? []).filter((t) => t !== GUEST);
  return `${name} stops at the Gym door. It looks at you once, and goes back the way it came.`;
}

/** A hard fight (a Gym, the Elite Four, a Champion) after a friend let go "for its own good" came back to help: it appears for one turn, uses its best move, and goes. Once. */
export function ofAssist(content: Content, run: RunState, battle: BattleState): string {
  if (flag(run, 'of-help') < 1 || flag(run, 'of-help-used') > 0) return '';
  const id = battle.trainer?.classId;
  if (id !== 'gym-leader' && id !== 'elite-four' && id !== 'champion') return '';
  const sp = castNow(run);
  const foe = battle.enemyTeam[battle.enemyIndex];
  if (!sp || !foe) return '';
  const species = getSpecies(content, sp);
  const rec = releases(run)[flag(run, 'of-index') - 1];
  const best = (species.learnset ?? [])
    .map((l: { move: string }) => content.moves.get(l.move))
    .filter((m): m is NonNullable<typeof m> => !!m && m.category !== 'status' && (m.power ?? 0) > 0)
    .sort((a, b) => (b.power ?? 0) - (a.power ?? 0) || a.id.localeCompare(b.id))[0];
  put(run, 'of-help-used', 1);
  foe.hp = Math.max(1, foe.hp - Math.floor(maxHp(content, foe) * HELP_SHARE));
  const name = rec?.n || species.name;
  return `A shape crosses the field. It's ${name}. It uses ${best?.name ?? 'its best move'}, once, hard, and is gone before anyone can say its name.`;
}

export const BENCH_MARK = BENCH;
