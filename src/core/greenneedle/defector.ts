// Greenneedle gn.50, The Evil Team's Betrayal (doc GREENNEEDLE_REWORKED_PLACED_11.md lines 86–205).
// A rank-and-file member of the region's team wants out, and needs help stealing the documents that prove the bosses mean to
// blame their section. An offer, three meetings, a theft and an ending. Trust (0 to 5) decides the ending; exposing them makes
// them a boss at the climax, with a team built against yours.
import type { Content } from '../contentSchema';
import type { BattleState, PokemonInstance, RunState } from '../state';
import { evilTeam } from '../evil/teams';
import { makeDoubles } from '../battle/doubles';
import { fnv1a } from '../expansion/hash';
import { answerTo } from './allstar';

const f = (run: Pick<RunState, 'story'>, k: string): number => Number(run.story.flags[`ev:${k}`] ?? 0);
const set = (run: Pick<RunState, 'story'>, k: string, n: number): void => {
  run.story.flags[`ev:${k}`] = n;
};
export const DEFECTOR = 'Corin Bellweather';
/** Their job in the team, and the reason that goes with it (the doc's three). */
export const JOBS = [
  { job: 'payroll clerk', reason: 'I do the payroll. I\'ve seen who\'s paid. And who isn\'t going to be.' },
  { job: 'driver', reason: 'I drive the van. I\'ve seen what\'s in the crates.' },
  { job: 'radio operator', reason: 'I work the radio. Last week I heard my own name on a list.' },
] as const;
/** The guest Pokémon's mark (their one Pokémon, held until the job's done). */
export const GUEST = 'defector-guest';
const REGION_KEYS = ['defector', 'defector-trust', 'defector-m1', 'defector-m2', 'defector-docs', 'defector-envelope', 'defector-unasked', 'defector-files', 'defector-end', 'defector-followed'];

const jobOf = (run: RunState) => JOBS[fnv1a(`${run.story.evil?.teamId ?? 'team'}:defector`) % JOBS.length]!;
const everyone = (run: RunState): PokemonInstance[] => [...run.party, ...run.box];
export const guestOf = (run: RunState): PokemonInstance | undefined => everyone(run).find((m) => m.gn?.includes(GUEST));
export const trustOf = (run: Pick<RunState, 'story'>): number => f(run, 'defector-trust');

/** Trust moves, 0 to 5. */
export function defectorTrust(run: RunState, n: number): string {
  set(run, 'defector-trust', Math.max(0, Math.min(5, trustOf(run) + n)));
  return '';
}

/** The offer. `how` 1: "I'll help." (Trust 1); 2: "Why should I trust you?" (Trust 2, and their Pokémon to hold); 3: turned in. */
export function defectorStart(content: Content, run: RunState, how: number, host: { apply: (e: unknown) => string }): string {
  for (const k of REGION_KEYS) delete run.story.flags[`ev:${k}`];
  set(run, 'defector', how === 3 ? 2 : 1);
  if (how === 3) return '';
  set(run, 'defector-trust', how === 2 ? 2 : 1);
  if (how !== 2) return '';
  const sp = evilTeam(content, run)?.ranks.grunt.species.find((s) => content.species.has(s)) ?? 'rattata';
  return host.apply({ kind: 'join', recall: false, species: [sp], types: [], levelBonus: -1, shinyMultiplier: 1, shadow: false, blissful: false, hiddenAbility: false, moves: [], direct: true, alpha: false, starterType: false, mark: GUEST, ot: DEFECTOR });
}

/** Turning up at meeting `n` (1, 2, or 3 = the records room): +1 for the meetings, −1 for each one missed before it. */
export function defectorMeet(run: RunState, n: number): string {
  if (n === 2 && f(run, 'defector-m1') === 0) defectorTrust(run, -1);
  if (n === 3 && f(run, 'defector-m2') === 0) defectorTrust(run, -1);
  if (n === 1 || n === 2) {
    set(run, `defector-m${n}`, 1);
    defectorTrust(run, 1);
  }
  if (n === 3) set(run, 'defector-docs', 1);
  return '';
}

/** Their Pokémon goes back. `unasked`: given back before the theft, without being asked (+1). */
export function defectorReturn(run: RunState, unasked: boolean): string {
  const mon = guestOf(run);
  if (!mon) return '';
  run.party = run.party.filter((m) => m.uid !== mon.uid);
  run.box = run.box.filter((m) => m.uid !== mon.uid);
  if (unasked) {
    defectorTrust(run, 1);
    // A loan used well (gn.48 reads it: drafted Pokémon start at Bond 1).
    set(run, 'loan-used-well', 1);
  }
  return '';
}

/** The ending, read at the team's climax: 1 partner (Trust 5), 2 map (3–4: one Hideout room skipped), 3 postcard (0–2), 4 boss (exposed). */
export function defectorEnd(run: RunState): string {
  if (f(run, 'defector-end') > 0) return '';
  const t = trustOf(run);
  const end = f(run, 'defector') === 2 ? 4 : t >= 5 ? 1 : t >= 3 ? 2 : 3;
  set(run, 'defector-end', end);
  // Their map: one room of the Hideout is skipped (a Hideout key, SF132).
  if (end === 2) run.story.flags['ev:hideout-key'] = f(run, 'hideout-key') + 1;
  return '';
}
export const endingOf = (run: Pick<RunState, 'story'>): number => f(run, 'defector-end') || (f(run, 'defector') === 2 ? 4 : trustOf(run) >= 5 ? 1 : trustOf(run) >= 3 ? 2 : 3);

const ENDINGS: Record<number, string> = {
  1: 'At the gate, someone falls into step beside you. Ordinary clothes, no hat. Corin. "I said I\'d see it through." Their Pokémon sniffs the air. It knows this building.',
  2: 'An envelope under your door that morning, in Corin\'s small, careful hand. A map of the Hideout, one corridor marked: *this way, nobody guards it.* No note. They\'ve already gone.',
  3: 'Corin isn\'t here. Nobody\'s seen them since the records room. They got out alone. You don\'t know if you\'re hurt by that, or proud of them.',
  4: '**Corin, as a boss, in the doorway of the climax, hat off at last:** "I asked you for one thing. In a doorway. With my hat off, practically. And you looked me in the eye."',
};

/** Tokens: {defector:job}, {defector:reason}, {defector:team}, {defector:boss}, {defector:pokemon}, {defector:ending}. */
export function defectorTokens(content: Content, run: RunState, text: string): string {
  const team = evilTeam(content, run);
  const job = jobOf(run);
  const guest = guestOf(run);
  return text
    .replaceAll('{defector:job}', job.job)
    .replaceAll('{defector:reason}', job.reason)
    .replaceAll('{defector:team}', team?.name ?? 'the team')
    .replaceAll('{defector:boss}', team?.ranks.leader.name ?? 'the boss')
    .replaceAll('{defector:pokemon}', guest ? (content.species.get(guest.speciesId)?.name ?? 'Pokémon') : 'Pokémon')
    .replaceAll('{defector:ending}', ENDINGS[endingOf(run)] ?? '');
}

/** gn rule `defector`: Corin as a boss. Each of their Pokémon answers one of yours. */
export function defectorBossStart(content: Content, run: RunState, battle: BattleState, make: (speciesId: string, level: number, uid: string) => PokemonInstance): void {
  if (battle.trainer) battle.trainer = { ...battle.trainer, name: DEFECTOR };
  const level = battle.enemyTeam[0]?.level ?? 5;
  const team = run.party.filter((m) => m.hp > 0).map((m) => answerTo(content, m.speciesId) ?? m.speciesId).slice(0, 6);
  if (team.length === 0) return;
  battle.enemyTeam = team.map((sp, i) => make(sp, level, battle.enemyTeam[i]?.uid ?? `defector-${i}`));
  battle.enemyIndex = 0;
}

/** At the team's climax (the battle with its leader, this region): Corin beside you (Trust 5), and the fourteen ex-Grunts holding the corridor. */
export function defectorClimax(content: Content, run: RunState, battle: BattleState, make: (speciesId: string, level: number, uid: string) => PokemonInstance): void {
  const team = evilTeam(content, run);
  if (!team || battle.trainer?.name !== team.ranks.leader.name) return;
  if (f(run, 'defector-at') !== run.regionIndex + 1 || f(run, 'defector') !== 1) return;
  if (f(run, 'defector-files') === 2 && battle.enemyVolatile) {
    // The side door opens: fourteen ex-Grunts hold the corridor behind you for three turns (nobody comes in to swap places).
    battle.enemyVolatile.trapped = true;
    battle.storyEffects.push(`untrap:enemy:${battle.turn + 2}`, 'defector-corridor');
  }
  if (endingOf(run) !== 1 || battle.doubles || battle.loaner || battle.enemyTeam.length < 2) return;
  const sp = team.ranks.grunt.species.find((s) => content.species.has(s));
  const lead = run.party[battle.activeIndex];
  if (!sp || !lead) return;
  const ally = make(sp, lead.level, `defector-ally-${run.regionIndex}`);
  run.party.push(ally);
  makeDoubles(battle, run.party);
  battle.doubles!.player.index = run.party.length - 1;
  battle.participants = [lead.uid, ally.uid];
  battle.loaner = ally.uid;
  battle.storyEffects.push('defector-partner');
}
