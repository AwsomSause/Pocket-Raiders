// Safari Land's park in the New UI (Greenneedle gn.18): the controller for the walkable grid. It reads the visit's state,
// turns keys, clicks and taps into the rules' actions (core/greenneedle/safari.ts through the session) and redraws.
// Nothing here decides an outcome or rolls anything: the same actions give the same visit with or without this screen.

import type Phaser from 'phaser';
import { overworldSheetFiles } from '../assets/catalog';
import { AREAS, parkMonAt, parkRows, parkTile, photoWords, type SafariState } from '../core/greenneedle/safari';
import { OVERWORLD, type Facing } from '../core/hubTown/schema';
import { followerKey, trainerSheet } from '../core/hubTown/world';
import { minigameView, parkEventSide, parkWaiting } from '../core/minigame/flow';
import { services } from '../game/services';
import { playSfx } from '../ui/audio';
import { onInputAction } from '../ui/input';
import { monFile } from '../ui/redux/game';
import { onParkProps, safariView, type ParkModel, type ParkSprite } from '../ui/redux/screens/safari';
import { mountRedux } from '../ui/redux/stage';

const ROW: Record<Facing, number> = { down: 0, left: 1, right: 2, up: 3 };
const TURNED: Record<Facing, Facing> = { up: 'down', down: 'up', left: 'right', right: 'left' };
const sheet = (name: string): string | null => (OVERWORLD.trainers.includes(name) ? overworldSheetFiles.trainer(name) : null);
const YOU = sheet('trainer_POKEMONTRAINER_Red') ?? overworldSheetFiles.trainer(trainerSheet('player'));
const WARDEN = sheet('NPC_B2W2_Pokemon_Ranger_Man') ?? overworldSheetFiles.trainer(trainerSheet('ranger'));

function wild(species: string, x: number, y: number, facing: Facing, more: Partial<ParkSprite> = {}): ParkSprite {
  const key = followerKey(species);
  return { x, y, file: key ? overworldSheetFiles.follower(key) : null, size: key ? OVERWORLD.followers[key]! : 64, row: ROW[facing], ...more };
}

/** Everything that stands in the area besides you, read from the visit's state. */
function standing(s: SafariState): ParkSprite[] {
  const out: ParkSprite[] = [];
  const rows = parkRows(s);
  rows.forEach((row, y) => [...row].forEach((ch, x) => {
    if (ch === 'S') out.push(wild('tauros', x, y, 'left', { mark: '!' }));
    if (ch === 'W') out.push({ x, y, file: WARDEN, size: 64, row: ROW.down, mark: '?' });
    if (ch === 'D' && s.quiet >= 8 && !s.dragonairSeen) out.push(wild('dragonair', x, y, 'down', { mark: 'z' }));
  }));
  if (s.area === 1 && s.herd !== 'none') {
    if (s.herd !== 'tauros') out.push(wild('rhyhorn', 5, 2, 'right'), wild('rhyhorn', 5, 4, 'right'));
    if (s.herd !== 'rhyhorn') out.push(wild('tauros', 9, 2, 'left'), wild('tauros', 9, 4, 'left'));
  }
  if (s.mode === 'migration') ['dratini', 'chansey', 'poliwag', 'wooper', 'dratini'].forEach((id, i) => out.push(wild(id, 4 + i * 2, i % 2 ? 2 : 3, 'left')));
  if (s.mode === 'family' && s.fam) out.push(wild('kangaskhan', s.fam.x, s.fam.y, 'left'), wild('kangaskhan', s.fam.x, s.fam.y, 'left', { scale: 0.55, dx: 0.5 }));
  const at = parkMonAt(s);
  if (at && s.mon) out.push(wild(s.mon.species, at.x, at.y, s.mon.noticed ? TURNED[s.facing] : s.facing, { mark: s.mon.behaviour === 'sleeping' ? 'z' : s.mon.noticed ? '!' : '' }));
  return out;
}

export interface ParkHooks {
  title: string;
  /** The visit ended (its outcome is in the run): show it. */
  onDone(): void;
  /** An event inside the park opened: play its stop. */
  onEvent(sideId: string): void;
}

/** Draws the park and takes its input until the scene shuts down. Call only when the New UI is on and the visit is still going. */
export function openPark(scene: Phaser.Scene, hooks: ParkHooks): void {
  const { session } = services();
  let index = 0;
  let running = false;
  const state = (): SafariState => session.run!.minigame!.state as SafariState;
  const cellsNow = () => minigameView(session.content, session.run!).cells;
  const shift = scene.input.keyboard?.addKey('SHIFT', false);

  const model = (): ParkModel => {
    const run = session.run!;
    const view = minigameView(session.content, run);
    const s = state();
    const walking = s.mode === 'walk';
    const onWall = walking && parkTile(s, s.x, s.y) === 'B';
    const picture = s.shot
      ? { file: monFile(scene, s.shot.species, 'front'), title: `Click. A ${s.shot.score}-point shot.`, plate: photoWords(session.content, s.shot) }
      : onWall
        ? s.wall
          ? { file: monFile(scene, s.wall.species, 'front'), title: 'On the gatehouse wall: your photograph', plate: `${photoWords(session.content, s.wall)} · ${s.wall.score} points` }
          : { file: null, title: 'The gatehouse wall', plate: 'Nothing on the plate yet' }
        : null;
    return {
      title: 'Safari Land',
      area: AREAS[s.area]!,
      areaIndex: s.area,
      rows: parkRows(s),
      player: { x: s.x, y: s.y, file: YOU, size: 64, row: ROW[s.facing], frame: (s.x + s.y) % 2 ? 1 : 3 },
      sprites: standing(s),
      steps: s.steps,
      balls: s.balls,
      quiet: s.quiet,
      caught: s.caught.length,
      camera: s.camera,
      shots: s.shots,
      warden: s.warden.replace(/^Warden: /, ''),
      wardenSheet: WARDEN,
      msg: s.msg,
      prompt: walking ? '' : view.prompt,
      walking,
      running,
      cells: walking ? [] : view.cells.map((c) => ({ id: c.id, label: c.label, detail: c.detail ?? '', off: Boolean(c.disabled) })),
      index,
      picture,
      hints: walking ? [['Arrows', 'walk'], ['Shift', 'run'], ['Enter', 'wait'], ['B', 'binoculars']] : [['Enter', 'choose'], ['Esc', 'back off']],
    };
  };

  const send = (id: string): void => {
    const after = session.minigameAct(id);
    if (parkWaiting(after)) return hooks.onEvent(parkEventSide(after)!);
    if (after.minigame?.outcome) return hooks.onDone();
    const s = state();
    // A question at a gate or a spot opens on its "not now" answer, so a second press never leaves the park by accident.
    index = s.mode === 'spot' ? Math.max(0, cellsNow().length - 1) : 0;
    view.refresh();
  };
  const go = (facing: Facing): void => {
    if (state().mode !== 'walk') return;
    send(`${running || shift?.isDown ? 'run' : 'go'}:${facing}`);
  };
  const pick = (i: number): void => {
    const cell = cellsNow()[i];
    if (!cell || cell.disabled || state().mode === 'walk') return;
    playSfx(scene, 'ui.select');
    send(cell.id);
  };

  const view = mountRedux(scene, {
    render: (c) => safariView(c, model()),
    acts: {
      go: (dir) => go(dir as Facing),
      run: () => { running = !running; view.refresh(); },
      do: (id) => { if (state().mode === 'walk') send(id); },
      pick: (i) => pick(Number(i)),
      tile: (arg) => {
        const s = state();
        const [x, y] = arg.split(',').map(Number) as [number, number];
        const dx = x - s.x, dy = y - s.y;
        if (dx === 0 && dy === 0) return;
        go(Math.abs(dx) >= Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up');
      },
    },
    overs: { over: (i) => { if (state().mode !== 'walk' && !cellsNow()[Number(i)]?.disabled && index !== Number(i)) { index = Number(i); view.refresh(); } } },
  });
  onParkProps(() => view.refresh());

  onInputAction(scene, (a) => {
    const s = state();
    if (s.mode === 'walk') {
      if (a === 'confirm') send('wait');
      else if (a !== 'back') go(a);
      return;
    }
    const cells = cellsNow();
    const cols = 3;
    if (a === 'confirm') return pick(index);
    if (a === 'back') {
      const out = cells.findIndex((c) => c.id === 'stay' || c.id === 'leave');
      if (out >= 0) pick(out);
      return;
    }
    const next = a === 'left' ? index - 1 : a === 'right' ? index + 1 : a === 'up' ? index - cols : index + cols;
    if (next >= 0 && next < cells.length) {
      index = next;
      view.refresh();
    }
  });
  scene.input.keyboard?.on('keydown-B', () => { if (state().mode === 'walk') send('look'); });
  scene.input.keyboard?.on('keydown-R', () => { running = !running; view.refresh(); });
}
