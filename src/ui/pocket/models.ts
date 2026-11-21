// Pocket look: gathers what its pages show from the game's own state (the session, the saved run, the profile).
// Read only: nothing here changes a run, a save or a random stream.

import type Phaser from 'phaser';
import { activeGameEvents } from '../../core/gameEvents';
import { followerKey } from '../../core/hubTown/world';
import { prestigeRank } from '../../core/legacy';
import { clockLabel } from '../../core/clock';
import { maxHp } from '../../core/pokemon';
import { pocketRoad, roadNext, roadStop, rotomNews, rotomTip, trainerId } from '../../core/presentation/pocket';
import type { RunState } from '../../core/state';
import { services } from '../../game/services';
import { artOf, monFile } from '../redux/game';
import type { ConfirmModel } from '../redux/screens/saves';
import { monArt } from './art';
import type { PkPause } from './screens/pause';
import type { Art } from '../redux/templates';
import type { PkTitle } from './screens/title';
import { pkArtOf } from './templates';

/** The Trainer of a run as a picture (null: no run, or a Trainer without one). */
export function pkTrainerArt(scene: Phaser.Scene, run: RunState | null | undefined): Art | null {
  return run ? artOf(scene, services().session.content.archetypes.get(run.archetypeId)?.spriteAssetId) ?? null : null;
}

const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

/** The name of the region a run is in. */
export function pkRegion(run: RunState): string {
  return services().session.content.regions.get(run.regionOrder[run.regionIndex] ?? '')?.name ?? cap(run.regionOrder[run.regionIndex] ?? '');
}
/** "Gym in 3 stops" for a run ("Champion" in the League). Empty between stages. */
const pkAhead = (run: RunState): string => { const road = pocketRoad(run.stage); return road ? roadNext(road, run.stage?.kind === 'league' ? 'Champion' : 'Gym') : ''; };

/** "Kanto · Stop 12 of 30 · Gym in 3 stops" for a run. */
export function pkWhere(run: RunState): string {
  const region = pkRegion(run);
  const road = pocketRoad(run.stage);
  if (!road) return `${region} · Between stages`;
  return [region, roadStop(road), roadNext(road, run.stage?.kind === 'league' ? 'Champion' : 'Gym')].filter(Boolean).join(' · ');
}

/** The Title's trainer, saved run, party and news. `run` is the newest saved run (null: none). */
export function pkTitleModel(scene: Phaser.Scene, run: RunState | null): PkTitle {
  const { session } = services();
  const who = run ? session.content.archetypes.get(run.archetypeId) : undefined;
  const best = session.profile.stats.bestEncounters;
  return {
    hero: {
      art: pkArtOf(artOf(scene, who?.spriteAssetId)) ?? { file: 'trainer/red', atlas: true },
      name: who?.name ?? 'Trainer',
      tag: `Rank ${prestigeRank(session.profile)} · ID ${trainerId(run?.seed ?? `slot-${session.slot}`)}`,
    },
    road: run ? pocketRoad(run.stage) : null,
    where: run ? pkWhere(run) : '',
    walkers: run ? [...run.party].reverse().flatMap((p) => { const sheet = followerKey(p.speciesId); return sheet ? [{ sheet, ko: p.hp <= 0 }] : []; }) : [],
    rotom: rotomNews(activeGameEvents(session.content, new Date())),
    best: best > 0 ? { top: 'Best', text: `${best} battles` } : null,
    slot: `Slot ${session.slot} of 3`,
  };
}

/** The Pause menu's phone, Trainer chip, party and run card. `names`: what the map calls each Pokémon of the party. */
export function pkPauseModel(scene: Phaser.Scene, run: RunState, o: { apps: PkPause['apps']; index: number; next: string; names: readonly string[]; ask: ConfirmModel | null; /** Said by Rotom in place of its tip (why the lit app is switched off). */ why?: string }): PkPause {
  const { session } = services(), content = session.content;
  const who = content.archetypes.get(run.archetypeId);
  const road = pocketRoad(run.stage), ahead = pkAhead(run);
  const hp = run.party.map((m) => Math.round((m.hp / Math.max(1, maxHp(content, m))) * 100));
  const badges = run.badges.length;
  return {
    when: clockLabel(run),
    where: [pkRegion(run), road ? roadStop(road) : ''].filter(Boolean).join(' · '),
    money: `₽ ${run.money.toLocaleString('en-US')}`,
    saved: 'Auto-save on',
    road,
    next: o.next,
    apps: o.apps,
    index: o.index,
    rotom: o.why ? `"Bzzt! ${o.why}"` : rotomTip({ next: ahead, fainted: hp.filter((p) => p <= 0).length, hurt: hp.filter((p) => p > 0 && p <= 30).length, size: run.party.length }),
    hero: { art: pkArtOf(pkTrainerArt(scene, run)), name: who?.name ?? 'Trainer', chips: [`Rank ${prestigeRank(session.profile)}`, `${badges} ${badges === 1 ? 'badge' : 'badges'}`] },
    party: run.party.map((m, i) => { const file = monFile(scene, m.speciesId, 'front', !!m.shiny); return { art: file ? monArt(file) : null, name: o.names[i] ?? '', level: m.level, hp: hp[i]!, type: content.species.get(m.speciesId)?.types[0] ?? 'normal' }; }),
    run: [[road ? roadStop(road) : 'Between stages', ahead].filter(Boolean).join(' · '), `${run.log.battlesWon} ${run.log.battlesWon === 1 ? 'battle' : 'battles'} won · ${new Set(run.log.speciesSeen).size} Pokémon met`],
    ask: o.ask,
  };
}
