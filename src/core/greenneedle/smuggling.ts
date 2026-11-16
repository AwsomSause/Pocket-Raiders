// Greenneedle gn.51, The Pokémon Smuggling Ring (doc GREENNEEDLE_REWORKED_PLACED_11.md lines 206–288).
// Regional forms moved by night, to be sold where they're rare. The freed go home (a list, ticked as postcards come);
// one stays by the door, afraid of Poké Balls, and climbs in by itself after three rests of patience.
import type { Content } from '../contentSchema';
import type { PokemonInstance, RunState } from '../state';
import { bondLevelFriendship } from '../co/who';

const f = (run: Pick<RunState, 'story'>, k: string): number => Number(run.story.flags[`ev:${k}`] ?? 0);
const set = (run: Pick<RunState, 'story'>, k: string, n: number): void => {
  run.story.flags[`ev:${k}`] = n;
};
const castOf = (run: Pick<RunState, 'story'>, name: string): string | null => {
  const hit = Object.keys(run.story.flags).find((k) => k.startsWith(`ev:cast-${name}:`) && Number(run.story.flags[k]) > 0);
  return hit ? hit.slice(`ev:cast-${name}:`.length) : null;
};
const cast = (run: RunState, name: string, id: string | null): void => {
  for (const k of Object.keys(run.story.flags)) if (k.startsWith(`ev:cast-${name}:`)) delete run.story.flags[k];
  if (id) run.story.flags[`ev:cast-${name}:${id}`] = 1;
};

/** The forms in the cages, by their home region. */
export const CARGO = [
  'vulpix-alola', 'sandshrew-alola', 'meowth-alola', 'diglett-alola', 'geodude-alola', 'grimer-alola',
  'meowth-galar', 'ponyta-galar', 'slowpoke-galar', 'corsola-galar', 'zigzagoon-galar', 'farfetchd-galar',
  'growlithe-hisui', 'zorua-hisui', 'voltorb-hisui', 'qwilfish-hisui', 'sneasel-hisui',
  'wooper-paldea', 'tauros-paldea-combat',
];
/** Where a form lives (Hisui is old Sinnoh). */
export function homeOf(speciesId: string): string {
  if (speciesId.includes('-alola')) return 'alola';
  if (speciesId.includes('-galar')) return 'galar';
  if (speciesId.includes('-hisui')) return 'sinnoh';
  if (speciesId.includes('-paldea')) return 'paldea';
  return '';
}
const REGION_NAME: Record<string, string> = { alola: 'Alola', galar: 'Galar', sinnoh: 'Hisui (Sinnoh)', paldea: 'Paldea' };
export const SPECIAL = ['far-from-home', 'wary', 'remembers-the-cage'] as const;
const FREED = 4;

/** The cages: four that go home, and the one that stays (each a form from another region than this one). */
export function smuggleCages(content: Content, run: RunState, float: () => number): string {
  const here = run.regionOrder[run.regionIndex] ?? '';
  const pool = CARGO.filter((s) => content.species.has(s) && homeOf(s) !== here);
  const picked: string[] = [];
  while (picked.length < FREED + 1 && pool.length > 0) picked.push(pool.splice(Math.floor(float() * pool.length), 1)[0]!);
  picked.forEach((sp, i) => cast(run, i === FREED ? 'smuggle-rescue' : `smuggle-freed-${i + 1}`, sp));
  set(run, 'smuggle-ability', 1 + Math.floor(float() * SPECIAL.length));
  set(run, 'smuggle-freed', 1);
  set(run, 'smuggle-cards', 0);
  // The S.S. Anne's engine-room crates (gn.10), the Ring Under the Bridge (gn.new.28) and this: the ring's finished for the run.
  if (f(run, 'ssanne-engine-opened') > 0 && f(run, 'bridge-ring-stopped') > 0) set(run, 'ring-finished', 1);
  return '';
}

const rescueAbility = (run: Pick<RunState, 'story'>) => SPECIAL[Math.max(0, f(run, 'smuggle-ability') - 1)] ?? 'wary';
/** Rests of patience it needs (two if you once waited out a Ball that wouldn't open, gn.new.03). */
export const restsNeeded = (run: Pick<RunState, 'story'>): number => (f(run, 'ball-waited') > 0 ? 2 : 3);

/** It walks beside you. `smuggle-rehab` counts rests of patience (from 1). */
export function smuggleRehab(run: RunState, step: number): string {
  if (step === 0) set(run, 'smuggle-rehab', 1);
  else if (step < 0) set(run, 'smuggle-rehab', Math.max(1, f(run, 'smuggle-rehab') - 1));
  else set(run, 'smuggle-rehab', Math.min(restsNeeded(run), f(run, 'smuggle-rehab') + 1));
  return '';
}
const walking = (run: Pick<RunState, 'story'>): boolean => f(run, 'smuggle-rehab') > 0 && f(run, 'smuggle-joined') === 0;

/** At a rest stop while it walks beside you: its scene opens beside the stop. */
export function smuggleRest(content: Content, run: RunState): void {
  if (!walking(run) || !content.events.has('gn-51-rest')) return;
  const here = run.stage?.map.nodes.find((n) => n.id === run.stage!.current);
  if (!here || here.sides.some((s) => s.kind === 'event' && !s.used && s.eventId === 'gn-51-rest')) return;
  here.sides.push({ id: `gn-51-rest-${here.sides.length + 1}`, kind: 'event', used: false, eventId: 'gn-51-rest' });
}

/** It climbs in by itself: Bond starts at 3, with its special ability, and it remembers the cage. */
export function smuggleJoin(content: Content, run: RunState, host: { apply: (e: unknown) => string }): string {
  const sp = castOf(run, 'smuggle-rescue');
  if (!sp || f(run, 'smuggle-joined') > 0) return '';
  set(run, 'smuggle-joined', 1);
  const before = new Set([...run.party, ...run.box].map((m) => m.uid));
  const words = host.apply({ kind: 'join', recall: false, species: [sp], types: [], levelBonus: 0, shinyMultiplier: 1, shadow: false, blissful: false, hiddenAbility: false, moves: [], direct: true, alpha: false, starterType: false, asIs: true, ability: rescueAbility(run), mark: 'freed-caged' });
  const mon = [...run.party, ...run.box].find((m) => !before.has(m.uid) && m.speciesId === sp);
  if (mon) {
    mon.friendship = Math.max(mon.friendship, bondLevelFriendship(content, 3));
    mon.gn = [...(mon.gn ?? []), `home:${homeOf(sp)}`];
    farFromHome(run, mon);
  }
  return words;
}

/** Far From Home: +10% to every stat in any region that isn't its own (kept up to date at each new region). */
export function farFromHome(run: Pick<RunState, 'regionOrder' | 'regionIndex'>, mon: PokemonInstance): void {
  if (mon.fixedAbility !== 'far-from-home') return;
  const home = mon.gn?.find((t) => t.startsWith('home:'))?.slice(5) ?? '';
  const want = (run.regionOrder[run.regionIndex] ?? '') !== home;
  const has = !!mon.gn?.includes('far-boosted');
  if (want === has) return;
  const d = want ? 10 : -10;
  const b = { ...mon.eventBoosts };
  for (const stat of ['hp', 'atk', 'def', 'spa', 'spd', 'spe'] as const) b[stat] = (b[stat] ?? 0) + d;
  mon.eventBoosts = b;
  mon.gn = want ? [...(mon.gn ?? []), 'far-boosted'] : (mon.gn ?? []).filter((t) => t !== 'far-boosted');
}

/** A postcard from a region one of them went home to (one a region, until all four are home). */
export function smugglePostcard(run: RunState): string {
  set(run, 'smuggle-cards', Math.min(FREED, f(run, 'smuggle-cards') + 1));
  return '';
}

/** Tokens: {smuggle:list} (each one's region, ticked once its postcard has come), {smuggle:rescue}, {smuggle:ability}, {smuggle:card}, {smuggle:rest}. */
export function smuggleTokens(content: Content, run: RunState, text: string): string {
  const name = (sp: string | null) => (sp ? (content.species.get(sp)?.name ?? sp) : 'Pokémon');
  const cards = f(run, 'smuggle-cards');
  const list = Array.from({ length: FREED }, (_, i) => castOf(run, `smuggle-freed-${i + 1}`))
    .map((sp, i) => `${i < cards ? '☑' : '☐'} ${name(sp)}, home to ${REGION_NAME[homeOf(sp ?? '')] ?? 'its region'}`).join('\n\n');
  const card = castOf(run, `smuggle-freed-${Math.min(FREED, cards + 1)}`);
  const ability = rescueAbility(run);
  const rest = f(run, 'smuggle-rehab');
  const scene = rest >= restsNeeded(run)
    ? 'It\'s asleep beside your lead, pressed against its side. In the morning, the open Ball\'s shut, and it\'s warm.'
    : rest === 2
      ? 'It sleeps at the edge of the light. The open Ball\'s been sniffed; it\'s been rolled a few inches, and left.'
      : 'It sleeps outside the firelight, facing away. When you move, one ear follows you. The rest of it doesn\'t.';
  return text
    .replaceAll('{smuggle:list}', list)
    .replaceAll('{smuggle:rescue}', name(castOf(run, 'smuggle-rescue')))
    .replaceAll('{smuggle:ability}', ability === 'far-from-home' ? 'Far From Home' : ability === 'wary' ? 'Wary' : 'Remembers the Cage')
    .replaceAll('{smuggle:card}', `${name(card)}, in ${REGION_NAME[homeOf(card ?? '')] ?? 'its region'}`)
    .replaceAll('{smuggle:rest}', scene);
}
