// The walkable zones in the New UI (Greenneedle gn.18 Safari Land, gn.19 The Deep Savanna, gn.20 The Lush Jungle): the controller
// for the grid. It reads the visit's state, turns keys, clicks and taps into the rules' actions (core/greenneedle/safari.ts and
// zone.ts through the session) and redraws. Nothing here decides an outcome or rolls anything: the same actions give the same
// visit with or without this screen. The walk animation (a slide between tiles) is presentation only: the rules have already
// moved you, and a press made during a slide is kept and sent when the slide ends, once.

import type Phaser from 'phaser';
import { overworldSheetFiles } from '../assets/catalog';
import { AREAS, parkMonAt, parkRows, parkTile, photoWords, type SafariState } from '../core/greenneedle/safari';
import { SAVANNA_ID, ZONES, zoneNext, zoneRows, zoneStanding, type ZoneDef, type ZoneState } from '../core/greenneedle/zone';
import { OVERWORLD, type Facing } from '../core/hubTown/schema';
import { followerKey, trainerSheet } from '../core/hubTown/world';
import { minigameView, parkEventSide, parkWaiting } from '../core/minigame/flow';
import { services } from '../game/services';
import { playSfx } from '../ui/audio';
import { onInputAction } from '../ui/input';
import { monFile } from '../ui/redux/game';
import { onParkProps, safariView, type ParkLook, type ParkModel, type ParkSprite } from '../ui/redux/screens/safari';
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

const QUIET_WORD = (q: number): string => (q >= 8 ? 'Barely here' : q >= 4 ? 'Normal' : 'They bolt');
/** A slide between two tiles, in milliseconds (a run covers two in a little more). */
const STEP_MS = 140;
const RUN_MS = 220;
/** Presses kept while a slide plays (more than a person can type in one). */
const KEPT = 6;

export interface ParkHooks {
  title: string;
  /** The visit ended (its outcome is in the run): show it. */
  onDone(): void;
  /** An event inside the zone opened: play its stop. */
  onEvent(sideId: string): void;
  /** The zone is over and the run is somewhere else (gn.19, gn.20 end on the map). */
  onLeft?(): void;
}

/** The part of a visit's state every zone shares: where you stand and what the screen says. */
type Walker = Pick<SafariState, 'area' | 'x' | 'y' | 'facing' | 'mode' | 'msg'>;

/** Draws the zone and takes its input until the scene shuts down. Call only when the New UI is on and the visit is still going. */
export function openPark(scene: Phaser.Scene, hooks: ParkHooks): void {
  const { session } = services();
  let index = 0;
  let running = false;
  const zone: ZoneDef | undefined = ZONES[session.run!.minigame!.id];
  const walker = (): Walker => session.run!.minigame!.state as Walker;
  const state = (): SafariState => session.run!.minigame!.state as SafariState;
  const cellsNow = () => minigameView(session.content, session.run!).cells;
  const shift = scene.input.keyboard?.addKey('SHIFT', false);

  // ---------- the walk animation (presentation only) ----------
  let step: ParkModel['step'] = null;
  let stepNo = 0;
  let busyUntil = 0;
  let kept: (() => void)[] = [];
  let closed = false;
  /** Motion is on: the game's settings allow it and the device does not ask for less. */
  const moving = (): boolean => {
    const st = session.settings;
    return st.menuAnimations && !st.disableAllAnimations && st.battleAnimations === 'full' && !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  };
  const drain = (): void => {
    if (closed) return;
    while (kept.length > 0 && performance.now() >= busyUntil) kept.shift()!();
  };
  /** Runs an input now, or after the slide that is playing. `repeat`: a held key's repeat, dropped while a slide plays (the key will say so again). */
  const input = (fn: () => void, repeat = false): void => {
    drain();
    if (performance.now() < busyUntil) {
      if (!repeat && kept.length < KEPT) kept.push(fn);
      return;
    }
    fn();
  };
  scene.events.once('shutdown', () => {
    closed = true;
    kept = [];
  });

  const youAt = (s: Walker): ParkSprite => ({ x: s.x, y: s.y, file: YOU, size: 64, row: ROW[s.facing], frame: step ? 0 : moving() ? 0 : (s.x + s.y) % 2 ? 1 : 3 });
  const common = (s: Walker) => {
    const view = minigameView(session.content, session.run!);
    const walking = s.mode === 'walk';
    return {
      areaIndex: s.area,
      player: youAt(s),
      msg: s.msg,
      prompt: walking ? '' : view.prompt,
      walking,
      running,
      cells: walking ? [] : view.cells.map((c) => ({ id: c.id, label: c.label, detail: c.detail ?? '', off: Boolean(c.disabled) })),
      index,
      step,
    };
  };

  const zoneModel = (def: ZoneDef): ParkModel => {
    const s = session.run!.minigame!.state as ZoneState;
    const savanna = def.id === SAVANNA_ID;
    const next = zoneNext(def, s);
    const water = s.hud['savanna-water'] ?? 0;
    return {
      ...common(s),
      title: def.title,
      look: (savanna ? 'savanna' : 'jungle') satisfies ParkLook,
      area: def.areas[s.area]!.name,
      rows: zoneRows(def, s),
      sprites: zoneStanding(def, s).map((w) => wild(w.species, w.x, w.y, w.facing, w.waits ? { mark: '!' } : { dim: true })),
      dark: savanna && Boolean(s.hud['savanna-night']),
      tag: null,
      stats: savanna
        ? [['Time', s.hud['savanna-night'] ? 'Night' : 'Day'], ['Places', `${s.seen.length}`], ['Walked', s.walked]]
        : [['Unharmed', s.hud['jungle-unharmed'] ? 'Yes' : 'No'], ['Places', `${s.seen.length}`], ['Walked', s.walked]],
      meter: savanna ? { label: 'Water', value: Math.min(3, water), max: 3, word: water > 0 ? 'A dry crossing costs one' : 'Empty: fights start at 90% HP', tone: water > 1 ? 'on' : 'lo' } : null,
      note: { sheet: null, who: next ? `Ahead: ${next.name}` : def.title, text: next ? next.hint : def.areas[s.area]!.line },
      pad: { third: ['Look', 'look'], more: [], help: def.help },
      picture: null,
      hints: [['Arrows', 'walk'], ['Shift', 'run'], ['Enter', 'look around']],
    };
  };

  const model = (): ParkModel => {
    if (zone) return zoneModel(zone);
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
      ...common(s),
      title: 'Safari Land',
      look: 'park',
      area: AREAS[s.area]!,
      rows: parkRows(s),
      sprites: standing(s),
      dark: false,
      tag: s.area === 0 ? { text: 'Gatehouse', x: 6, y: 86 } : null,
      stats: [['Steps', s.steps], ['Safari Balls', s.balls], ['Caught', s.caught.length]],
      meter: { label: 'Quiet', value: s.quiet, max: 10, word: QUIET_WORD(s.quiet), tone: s.quiet >= 8 ? 'hi' : s.quiet <= 3 ? 'lo' : 'on' },
      note: { sheet: WARDEN, who: `Warden Baoba-Lin, under their breath${s.camera ? ` · camera: ${s.shots} shot${s.shots === 1 ? '' : 's'}` : ''}`, text: s.warden.replace(/^Warden: /, '') },
      pad: {
        third: ['Wait', 'wait'],
        more: [{ label: 'Use the binoculars', detail: '5 steps · Quiet +1', arg: 'look' }, { label: 'Head for the gate', detail: 'end the visit', arg: 'exit' }],
        help: `One tile is one step. Tall grass is where they are. Walking, waiting and watching raise Quiet; running, rocks and missed Balls lower it.${s.camera ? '' : ' The camera hangs by the gatehouse.'}`,
      },
      picture,
      hints: walking ? [['Arrows', 'walk'], ['Shift', 'run'], ['Enter', 'wait'], ['B', 'binoculars']] : [['Enter', 'choose'], ['Esc', 'back off']],
    };
  };

  const send = (id: string): void => {
    const before = walker();
    const from = { area: before.area, x: before.x, y: before.y };
    const after = session.minigameAct(id);
    if (parkWaiting(after)) return hooks.onEvent(parkEventSide(after)!);
    if (after.minigame?.outcome) return hooks.onDone();
    if (!after.minigame) return hooks.onLeft?.();
    const s = walker();
    // A step in the same area slides (a walk or a run in a straight line); a path to the next area, a blocked move and reduced motion redraw at once.
    const dx = from.x - s.x, dy = from.y - s.y;
    const tiles = Math.abs(dx) + Math.abs(dy);
    if (from.area === s.area && tiles > 0 && tiles <= 2 && (dx === 0 || dy === 0) && moving()) {
      const ms = tiles > 1 ? RUN_MS : STEP_MS;
      step = { key: `step-${++stepNo}`, dx, dy, ms };
      busyUntil = performance.now() + ms;
      window.setTimeout(() => {
        if (closed) return;
        // The slide is over: stand still again (unless a newer one has begun), then send what was pressed meanwhile.
        if (performance.now() >= busyUntil) {
          step = null;
          view.refresh();
        }
        drain();
      }, ms + 4);
    } else step = null;
    // A question at a gate or a spot opens on its "not now" answer, so a second press never leaves the park by accident.
    index = s.mode === 'spot' ? Math.max(0, cellsNow().length - 1) : 0;
    view.refresh();
  };
  const go = (facing: Facing): void => {
    if (walker().mode !== 'walk') return;
    send(`${running || shift?.isDown ? 'run' : 'go'}:${facing}`);
  };
  const pick = (i: number): void => {
    const cell = cellsNow()[i];
    if (!cell || cell.disabled || walker().mode === 'walk') return;
    playSfx(scene, 'ui.select');
    send(cell.id);
  };

  const view = mountRedux(scene, {
    render: (c) => safariView(c, model()),
    acts: {
      go: (dir) => input(() => go(dir as Facing)),
      run: () => { running = !running; view.refresh(); },
      do: (id) => input(() => { if (walker().mode === 'walk') send(id); }),
      pick: (i) => input(() => pick(Number(i))),
      tile: (arg) => input(() => {
        const s = walker();
        const [x, y] = arg.split(',').map(Number) as [number, number];
        const dx = x - s.x, dy = y - s.y;
        if (dx === 0 && dy === 0) return;
        go(Math.abs(dx) >= Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up');
      }),
    },
    overs: { over: (i) => { if (walker().mode !== 'walk' && !cellsNow()[Number(i)]?.disabled && index !== Number(i)) { index = Number(i); view.refresh(); } } },
  });
  onParkProps(() => view.refresh());

  // Whether the key press being handled is a held key repeating (read before the action handler below runs).
  let repeating = false;
  scene.input.keyboard?.on('keydown', (e: KeyboardEvent) => { repeating = e.repeat; });
  const onAction = (a: Parameters<Parameters<typeof onInputAction>[1]>[0]): void => {
    const s = walker();
    if (s.mode === 'walk') {
      if (a === 'confirm') send(zone ? 'look' : 'wait');
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
  };
  onInputAction(scene, (a) => input(() => onAction(a), repeating));
  scene.input.keyboard?.on('keydown-B', (e: KeyboardEvent) => input(() => { if (walker().mode === 'walk') send('look'); }, e.repeat));
  scene.input.keyboard?.on('keydown-R', () => { running = !running; view.refresh(); });
}
