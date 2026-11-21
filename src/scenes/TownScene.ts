// Pocket Town (W7, walkable since Appendix S.5): the Hub's second town. It runs on the Hub Town engine (ui/hubTown/townView.ts
// with the map in data/pocketTown.json, built by tools/hubtown/pocket_layout.py via build.py): you walk your Pokémon to a building door and press Z.
// The last run's weather and the time of day lie over the map as the sky and lighting; furniture, pets and the cursor trail stay.
// The old building list is the Town directory (Esc). Every rule is in core/town; presentation only: nothing here changes a result.

import Phaser from 'phaser';
import { buildingProblem, currentSeason, ownedSet, pets, townOf, townWeather, TOWN, type TownBuilding } from '../core/town';
import { POCKET_TOWN, type HubPlace } from '../core/hubTown/schema';
import { crowdWindow } from '../core/hubTown/roster';
import { hubPeriod } from '../core/hubTown/daylight';
import { districtAt, hubPokemon } from '../core/hubTown/world';
import { readyLine, townDirectory } from '../core/town/directory';
import { services } from '../game/services';
import { playMusicLazy, playSfx } from '../ui/audio';
import { overworldAssetIds, pokemonAssetIds } from '../assets/catalog';
import { preloadPokemon, queueAssets } from '../ui/lazyAssets';
import { Picker, type PickerRow } from '../ui/partyPanel';
import { HubTownView } from '../ui/hubTown/townView';
import { HubMinimap } from '../ui/hubTown/minimap';
import { drawDaylight, startTownSound } from '../ui/hubTown/townTime';
import type { StarterScout } from '../core/story2/starterScouts';
import { PocketFolk, folkAssets, pocketFolk, pocketScouts } from '../ui/hubTown/pocketFolk';
import { itemVisual, pokemonIcon } from '../ui/sprites';
import { onInputAction } from '../ui/input';
import { useLookFont } from '../ui/redux/canvasFont';
import { mountRedux, phantomOn, pocketOn, type ReduxView } from '../ui/redux/stage';
import { pkTownDoor, pkTownHud, pkTownMap, placeProp } from '../ui/pocket/screens/town';
import { gridStep } from '../ui/phantom/screens/dexbook';
import { phPocket, POCKET_COLS, type PocketModel } from '../ui/phantom/screens/townmap';
import type { TownPanelLike } from '../ui/townPanel';
import { openBuilding, openTown, townBusy, type TownHost } from '../ui/townMenu';
import { COLORS, GAME_HEIGHT, GAME_WIDTH, textStyle } from '../ui/theme';

const TRAIL_COLORS: Record<string, number[]> = {
  'tr-sparkle': [0xfff2a8, 0xffffff], 'tr-bubbles': [0x9ad8ff, 0xd6f0ff], 'tr-leaves': [0x7bd88f, 0xd9b26f], 'tr-fireflies': [0xf8f080, 0xc8ff9a], 'tr-rainbow': [0xff6b6b, 0xffd166, 0x6bd88f, 0x6bb5ff, 0xb78bff],
};
const T = POCKET_TOWN.tile;
/** The plaza fountain's tile (the sound of it follows how near you stand). */
const FOUNTAIN = { x: 36, y: 32 };

/** Phantom UI: where the Town directory's cursor was (the hamlet, then the place in it). */
const pocketSpot = { hamlet: 0, place: 0 };

/** What a starter scout says: the gift the first time, a reminder after. */
export function scoutTalk(session: ReturnType<typeof services>['session'], scout: StarterScout): string {
  const added = session.receiveScoutGift(scout.id);
  const species = session.content.species.get(session.content.storyData.remembrances.find((r) => r.id === scout.line)?.line[0] ?? '');
  const mon = species?.name ?? 'Pokémon';
  return (added.length > 0 ? `${scout.give} (${mon} joins your Remembrance Archive as a Story Run starter.)` : scout.again).replace('{mon}', mon);
}

export class TownScene extends Phaser.Scene {
  private picker: TownPanelLike | null = null;
  private note!: Phaser.GameObjects.Text;
  private decorMode = false;
  private decorLayer: Phaser.GameObjects.Container | null = null;
  private petSprites: { obj: Phaser.GameObjects.GameObject & { x: number; y: number }; lag: number }[] = [];
  private trail: Phaser.GameObjects.Arc[] = [];
  private pointer = { x: GAME_WIDTH / 2, y: 300 };
  private host!: TownHost;
  private town!: HubTownView;
  private folk: PocketFolk | null = null;
  private folkList = pocketFolk();

  constructor() {
    super('Town');
  }

  preload(): void {
    const { session } = services();
    const list = pets(session.content, session.profile).slice(0, 3).map((x) => session.content.species.get(x.speciesId)!);
    preloadPokemon(this, list, { icon: true });
    this.folkList = [...pocketFolk(), ...pocketScouts(session.profile.profileId)];
    queueAssets(this, [overworldAssetIds.tiles, overworldAssetIds.props, overworldAssetIds.follower(hubPokemon(session.profile).follower), ...folkAssets(this.folkList)]);
  }

  create(): void {
    useLookFont(this);
    const { session } = services();
    const p = session.profile;
    const motion = session.settings.battleAnimations;
    this.picker = null;
    this.atDoor = false;
    this.decorMode = false;
    this.petSprites = [];
    this.trail = [];
    this.folk = null;
    playMusicLazy(this, 'bgm.hub');
    const now = new Date(Date.now());
    const period = hubPeriod(now);
    const night = period === 'night';
    const weather = townWeather(p);

    const host: TownHost = {
      scene: this,
      setPicker: (pk) => { this.picker = pk; if (!pk) this.town?.lockUntilRelease(); },
      refresh: (msg) => this.say(msg),
      setDecorMode: (on) => this.setDecorMode(on),
      enter: (b) => this.bounce(b),
      travel: (b) => this.travel(b),
      toHub: () => this.scene.start('Hub'),
    };
    this.host = host;
    host.home = () => { this.host.refresh(''); };

    this.town = new HubTownView(
      this,
      { onPlace: (pl) => this.openPlace(pl), onGate: (g) => this.askGate(g), busy: () => Boolean(this.picker) || townBusy.n > 0, onPrompt: () => this.pkHud?.refresh(), ownPrompt: () => pocketOn(), seeThrough: () => this.atDoor },
      { follower: hubPokemon(p).follower, motion, map: POCKET_TOWN, mapId: 'pocket' },
    );
    this.drawSigns();
    this.folk = new PocketFolk(this.town, this, session.content, p, this.folkList, { motion, window: crowdWindow(new Date(Date.now())), say: (line) => this.say(line), scout: (sc) => scoutTalk(session, sc) });

    // Sky and lighting over the map: the last run's weather, then the time of day (and the lamps after dark).
    const tint: Record<typeof weather, [number, number]> = { sun: [0xffd27a, 0.14], storm: [0x1d2447, 0.38], cloud: [0x8a93a6, 0.22], clear: [0x000000, 0] };
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, tint[weather][0], tint[weather][1]).setOrigin(0).setDepth(-49).setName('pocket-weather');
    drawDaylight(this.town, this, period, motion);
    startTownSound(this.town, this, period, FOUNTAIN);
    if (weather === 'storm' && motion !== 'off') this.rain(motion);
    this.season(now, motion);
    new HubMinimap(this, this.town, { motion, busy: () => Boolean(this.picker) || townBusy.n > 0, title: 'Pocket Town', own: () => phantomOn() || pocketOn() });
    // Phantom UI: the Town directory has its own keys (M opens it from the street).
    this.directory = null;
    const key = (name: string, fn: () => void): void => void this.input.keyboard?.on(`keydown-${name}`, fn);
    key('M', () => { if (this.directory) this.directory.walk(); else if (phantomOn() && !this.picker && townBusy.n === 0 && !this.decorMode) this.openDirectory(); else if (pocketOn()) this.openPocketMap(); });
    key('Q', () => this.directory?.hamlet(-1));
    key('E', () => this.directory?.hamlet(1));
    key('H', () => this.directory?.hub());

    // The Pocket look draws the header, the "Z" line and the keys itself (mock-up `pt-town`).
    const own = pocketOn();
    const top = this.add.graphics().setVisible(!own);
    for (let i = 0; i < 12; i++) top.fillStyle(0x0e0b12, 0.45 * (1 - i / 12)).fillRect(0, i * 8, GAME_WIDTH, 8);
    this.add.text(16, 8, 'Pocket Town', textStyle(30, COLORS.gold, { stroke: '#10203a', strokeThickness: 4 })).setDepth(5).setVisible(!own);
    this.add.text(16, 44, `${{ sun: 'Sunny: your last run was a win.', storm: 'A storm hangs over the town after your last run.', cloud: 'Cloudy skies.', clear: 'A clear day.' }[weather]}${night ? ' It is night.' : ''}`, textStyle(15, COLORS.textLight, { stroke: '#10203a', strokeThickness: 4 })).setDepth(5).setVisible(!own);
    this.add.text(16, GAME_HEIGHT - 12, 'Arrows walk · Shift runs · Z talks and enters · M map · Esc Town directory', textStyle(14, COLORS.textLight, { stroke: '#10203a', strokeThickness: 4 })).setOrigin(0, 1).setName('pocket-help').setVisible(!own);
    this.pkHud = own ? mountRedux(this, {
      clear: true,
      render: (c) => (c.pk ? pkTownHud(this.hudModel()) : ''),
      acts: {
        townZ: () => { if (!this.picker && townBusy.n === 0) this.town.interact(); },
        townMap: () => this.openPocketMap(),
        townMenu: () => { if (!this.picker && townBusy.n === 0) openTown(this.host, () => this.host.refresh('')); },
      },
    }) : null;
    // The district pill follows where you walk.
    if (own) this.time.addEvent({ delay: 400, loop: true, callback: () => this.pkHud?.refresh() });
    this.note = this.add.text(GAME_WIDTH / 2, 80, '', textStyle(18, COLORS.gold, { align: 'center', wordWrap: { width: GAME_WIDTH - 160 }, stroke: '#10203a', strokeThickness: 4 })).setOrigin(0.5, 0).setDepth(2000);
    this.drawDecor();
    this.drawWall();
    this.addPets(motion);
    if (night) this.fireflies(motion);
    this.input.on('pointermove', (ptr: Phaser.Input.Pointer) => { this.pointer = { x: ptr.x, y: ptr.y }; });
    this.input.keyboard?.on('keydown-ESC', () => { if (this.decorMode) this.setDecorMode(false); });

    onInputAction(this, (a) => {
      if (this.picker) { this.picker.handle(a); return; }
      if (townBusy.n > 0) return;
      if (this.decorMode) return;
      if (a === 'up' || a === 'down' || a === 'left' || a === 'right') this.town.step(a);
      else if (a === 'confirm') this.town.interact();
      else if (a === 'back') { playSfx(this, 'ui.select', 0.6); if (phantomOn()) this.openDirectory(); else openTown(host, () => this.host.refresh('')); }
    });
  }

  /** Pocket look: the street's header, "Z" line and keys over the canvas. */
  private pkHud: ReduxView | null = null;
  /** Pocket look: the door card is open (the town stays drawn, dimmed, under it). */
  private atDoor = false;

  /** Pocket look: the time, the district you stand in and what you face. */
  private hudModel(): Parameters<typeof pkTownHud>[0] {
    const f = this.town.facingNow, pl = f ? POCKET_TOWN.places.find((x) => x.id === f.id) : undefined;
    const period = hubPeriod(new Date(Date.now()));
    return {
      time: period.charAt(0).toUpperCase() + period.slice(1),
      district: districtAt(this.town.tile(), POCKET_TOWN)?.name ?? '',
      prompt: f ? { verb: f.verb, name: f.name, text: pl?.blurb ?? `${f.verb} to ${f.name}.` } : null,
    };
  }

  /** Pocket look: the Town Map (mock-up `pt-map`), a card per district; Enter walks you to its first door. */
  private openPocketMap(): void {
    if (this.picker || townBusy.n > 0 || this.decorMode) return;
    const { session } = services();
    const dir = townDirectory(session.content, session.profile, new Date(Date.now()));
    const here = districtAt(this.town.tile(), POCKET_TOWN)?.id;
    const districts = POCKET_TOWN.districts.map((d) => {
      const names = dir.hamlets.find((h) => h.id === d.id)?.places.map((pl) => pl.name) ?? [];
      return { id: d.id, name: d.name, color: d.color, text: names.length ? names.slice(0, 3).join(', ') : d.blurb };
    });
    const hereAt = districts.findIndex((d) => d.id === here);
    let index = Math.max(0, hereAt);
    const view = mountRedux(this, {
      render: (c) => (c.pk ? pkTownMap({ districts, index, here: hereAt }) : ''),
      acts: { mapPick: (i) => { index = Number(i); walk(); }, mapBack: () => back() },
      overs: { mapOver: (i) => { if (Number(i) !== index) { index = Number(i); view.refresh(); } } },
    });
    const close = (): void => { if (this.picker === panel) { panel.close(); this.host.setPicker(null); } };
    const back = (): void => { playSfx(this, 'ui.select', 0.6); close(); };
    const walk = (): void => {
      const id = districts[index]?.id;
      const pl = POCKET_TOWN.places.find((x) => x.kind === 'building' && districtAt(x.door, POCKET_TOWN)?.id === id) ?? POCKET_TOWN.places.find((x) => districtAt(x.stand, POCKET_TOWN)?.id === id);
      close();
      playSfx(this, 'ui.select');
      if (pl) this.town.moveTo(pl.stand);
    };
    const panel: TownPanelLike = {
      handle: (a) => {
        if (a === 'back') return back();
        if (a === 'confirm') return walk();
        if (a === 'left' || a === 'right') { index = (index + (a === 'left' ? -1 : 1) + districts.length) % districts.length; playSfx(this, 'ui.move'); view.refresh(); }
      },
      close: () => view.destroy(),
    };
    playSfx(this, 'ui.select', 0.6);
    this.host.setPicker(panel);
  }

  /** Pocket look: at a door (mock-up `pt-door`), the building and its line, then Go in or Keep walking. */
  private askDoor(pl: HubPlace, b: TownBuilding): void {
    const { session } = services();
    const shut = b.hidden ? buildingProblem(session.profile, b) : null;
    const view = mountRedux(this, {
      clear: true,
      render: (c) => (c.pk ? pkTownDoor({ district: districtAt(pl.door, POCKET_TOWN)?.name ?? '', name: pl.name, text: pl.blurb, prop: placeProp(POCKET_TOWN, pl.door), shut }) : ''),
      acts: { doorGo: () => go(), doorBack: () => back() },
    });
    const close = (): void => { this.atDoor = false; if (this.picker === panel) { panel.close(); this.host.setPicker(null); } };
    const back = (): void => { playSfx(this, 'ui.select', 0.6); close(); };
    const go = (): void => { close(); this.enterBuilding(b); };
    const panel: TownPanelLike = { handle: (a) => { if (a === 'confirm') go(); else if (a === 'back') back(); }, close: () => view.destroy() };
    playSfx(this, 'ui.select', 0.6);
    this.atDoor = true;
    this.host.setPicker(panel);
  }

  /** Phantom UI: the Town directory while it is open (its own keys: Q and E, M, H). */
  private directory: { hamlet(by: number): void; walk(): void; hub(): void } | null = null;

  /** Phantom UI: the Town directory (mock-up `pocket`): the hamlets, their places and what is ready today. */
  private openDirectory(): void {
    if (this.directory || this.picker) return;
    const { session } = services();
    const read = () => townDirectory(session.content, session.profile, new Date(Date.now()));
    let dir = read();
    // It opens on the hamlet you stand in.
    const here = districtAt(this.town.tile(), POCKET_TOWN)?.id;
    const at = dir.hamlets.findIndex((h) => h.id === here);
    if (at >= 0 && at !== pocketSpot.hamlet) { pocketSpot.hamlet = at; pocketSpot.place = 0; }
    const clamp = (): void => {
      pocketSpot.hamlet = Phaser.Math.Clamp(pocketSpot.hamlet, 0, Math.max(0, dir.hamlets.length - 1));
      pocketSpot.place = Phaser.Math.Clamp(pocketSpot.place, 0, Math.max(0, (dir.hamlets[pocketSpot.hamlet]?.places.length ?? 1) - 1));
    };
    clamp();
    const model = (): PocketModel => {
      dir = read();
      clamp();
      const h = dir.hamlets[pocketSpot.hamlet];
      return {
        town: 'Pocket Town',
        hamlets: dir.hamlets.map((x) => ({ name: x.name, count: x.places.length })),
        hamlet: pocketSpot.hamlet,
        places: (h?.places ?? []).map((pl) => ({ name: pl.name, text: (pl.problem ?? pl.blurb).replace(/\s*\(S\d+\)/g, ''), tag: pl.tag === 'ready' ? 'READY' : pl.tag === 'locked' ? 'SHUT' : '', off: pl.tag === 'locked' })),
        place: pocketSpot.place,
        today: readyLine(dir.ready),
        hub: true,
      };
    };
    const shut = (): void => { if (this.picker === panel) { panel.close(); this.host.setPicker(null); } };
    const point = (hamlet: number, place: number): void => {
      const n = dir.hamlets.length;
      const hTo = ((hamlet % n) + n) % n;
      const count = dir.hamlets[hTo]?.places.length ?? 0;
      const pTo = Phaser.Math.Clamp(place, 0, Math.max(0, count - 1));
      if (hTo === pocketSpot.hamlet && pTo === pocketSpot.place) return;
      pocketSpot.hamlet = hTo;
      pocketSpot.place = pTo;
      playSfx(this, 'ui.select', 0.4);
      view.refresh();
    };
    const lit = () => dir.hamlets[pocketSpot.hamlet]?.places[pocketSpot.place];
    const visit = (): void => {
      const pl = lit(), b = pl && TOWN.buildings.find((x) => x.id === pl.id);
      if (!pl || !b) return void playSfx(this, 'ui.error', 0.5);
      shut();
      if (pl.problem) return this.say(`${b.name}: ${pl.problem}`);
      playSfx(this, 'ui.select');
      this.travel(b);
    };
    const walk = (): void => {
      const pl = lit(), door = pl && this.doorFor(pl.id);
      shut();
      playSfx(this, 'ui.select', 0.6);
      if (door) this.town.moveTo(door.stand);
    };
    const view = mountRedux(this, {
      render: (c) => (c.ph ? phPocket(c.ph, model()) : ''),
      acts: {
        pocketHamlet: (i) => point(Number(i), 0),
        pocketPlace: (i) => { if (Number(i) === pocketSpot.place) visit(); else point(pocketSpot.hamlet, Number(i)); },
        pocketWalk: walk,
        pocketHub: () => { shut(); this.scene.start('Hub'); },
        pocketBack: () => { playSfx(this, 'ui.select', 0.6); shut(); },
      },
      overs: { pocketOver: (i) => point(pocketSpot.hamlet, Number(i)) },
    });
    const panel: TownPanelLike = {
      handle: (a) => {
        if (a === 'back') { playSfx(this, 'ui.select', 0.6); return shut(); }
        if (a === 'confirm') return visit();
        point(pocketSpot.hamlet, gridStep(pocketSpot.place, dir.hamlets[pocketSpot.hamlet]?.places.length ?? 0, POCKET_COLS, a));
      },
      close: () => { view.destroy(); this.directory = null; },
    };
    this.directory = { hamlet: (by) => point(pocketSpot.hamlet + by, 0), walk, hub: () => { shut(); this.scene.start('Hub'); } };
    this.host.setPicker(panel);
  }

  /** The people and doors you can face in Pocket Town (for tests and touch shortcuts). */
  doorFor(id: string): HubPlace | null {
    return POCKET_TOWN.places.find((pl) => pl.id === id) ?? null;
  }

  /** Teleport next to a place and open it (the Town directory's fast travel). */
  private travel(b: TownBuilding): void {
    const place = this.doorFor(b.id);
    if (place) this.town.moveTo(place.stand);
    this.enterBuilding(b);
  }

  /** You faced a door or sign and pressed Z (or walked into the door). */
  private openPlace(pl: HubPlace): void {
    if (this.picker || townBusy.n > 0) return;
    const room = pl.rooms[0] ?? '';
    if (room.startsWith('dist:')) { playSfx(this, 'ui.select', 0.6); return this.say(`${pl.name}: ${pl.blurb}`); }
    const b = TOWN.buildings.find((x) => x.id === room);
    if (!b) return;
    if (pocketOn()) return this.askDoor(pl, b);
    playSfx(this, 'ui.select');
    this.enterBuilding(b);
  }

  private enterBuilding(b: TownBuilding): void {
    const { session } = services();
    const problem = b.hidden ? buildingProblem(session.profile, b) : null;
    if (problem) return this.say(`${b.name}: ${problem}`);
    session.visitTown(b.id);
    this.bounce(b);
    openBuilding(this.host, b, () => this.host.refresh(''), () => this.host.refresh(''));
  }

  /** Stepping into the south arch asks first; "Not yet" steps you back into town. */
  private askGate(g: HubPlace): void {
    if (this.picker) return;
    const rows: PickerRow[] = ['Go back to Hub Town', 'Not yet'].map((label, i) => ({
      problem: null,
      hint: i === 0 ? g.blurb : 'Stay in Pocket Town.',
      draw: (scene, box, _w, h) => { box.add(scene.add.text(20, h / 2, label, textStyle(24, i === 0 ? COLORS.gold : COLORS.textLight)).setOrigin(0, 0.5)); },
    }));
    const close = (): void => { this.picker?.close(); this.host.setPicker(null); };
    const picker: Picker = new Picker(this, {
      glass: true, title: g.name, rows, columns: 1, rowHeight: 64, start: 1,
      onSelect: (n) => { close(); if (n === 0) this.scene.start('Hub'); else this.town.stepBack(); },
      onBack: () => { close(); this.town.stepBack(); },
      backLabel: 'stay in town',
    });
    this.host.setPicker(picker);
  }

  /** A name plaque over every building door (in the world, so it scrolls with the map). */
  private drawSigns(): void {
    for (const pl of POCKET_TOWN.places) {
      if (pl.kind !== 'building') continue;
      this.town.world(() => {
        this.add
          .text(pl.door.x * T + T / 2, pl.door.y * T - 10, pl.name, textStyle(11, '#ffffff', { stroke: '#10203a', strokeThickness: 3, align: 'center' }))
          .setOrigin(0.5, 1)
          .setDepth(10 + (pl.door.y + 1) * T + 2)
          .setName(`pocket-sign-${pl.id}`);
      });
    }
  }

  override update(_t: number, dt: number): void {
    const { session } = services();
    if (session.settings.battleAnimations === 'off') return;
    for (const pet of this.petSprites) {
      const k = 1 - Math.exp(-dt / (pet.lag * 16));
      pet.obj.x += (this.pointer.x - 30 - pet.obj.x) * k;
      pet.obj.y += (this.pointer.y + 24 - pet.obj.y) * k;
    }
    const colors = TRAIL_COLORS[townOf(session.profile).equipped.trail ?? ''];
    if (colors) {
      const dot = this.add.circle(this.pointer.x, this.pointer.y, 5, colors[Math.floor(Math.random() * colors.length)]!, 0.9).setDepth(3000);
      this.trail.push(dot);
      this.tweens.add({ targets: dot, alpha: 0, scale: 0.2, duration: 500, onComplete: () => dot.destroy() });
      if (this.trail.length > 40) this.trail.shift();
    }
  }

  /** The Wall of Fame: the signatures (stamps and freehand drawings) in the corner of the screen. */
  private drawWall(): void {
    const { session } = services();
    const wall = townOf(session.profile).wall;
    if (wall.length === 0) return;
    const g = this.add.graphics().setScrollFactor(0).setDepth(-4);
    g.fillStyle(0x2b2236, 0.7).fillRect(16, 90, 150, 100);
    wall.slice(-8).forEach((sig, i) => {
      const [color, what] = sig.split('|');
      const col = Phaser.Display.Color.HexStringToColor(color ?? '#ffffff').color;
      const ox = 20 + (i % 4) * 36, oy = 94 + Math.floor(i / 4) * 48;
      g.lineStyle(2, col, 1);
      if (what?.startsWith('d:')) {
        for (const stroke of what.slice(2).split(':')) {
          const pts = stroke.split(';').map((q) => q.split(',').map(Number) as [number, number]);
          g.beginPath();
          pts.forEach(([x, y], k) => (k === 0 ? g.moveTo(ox + (x! / 100) * 32, oy + (y! / 100) * 42) : g.lineTo(ox + (x! / 100) * 32, oy + (y! / 100) * 42)));
          g.strokePath();
        }
      } else {
        g.fillStyle(col, 1).fillCircle(ox + 16, oy + 20, 10);
      }
    });
  }

  private say(msg: string): void {
    this.note.setText(msg).setAlpha(1);
    this.tweens.killTweensOf(this.note);
    this.tweens.add({ targets: this.note, alpha: 0, delay: 5000, duration: 800 });
    this.drawDecor();
  }

  /** The entry bounce: the building's icon pops up and settles. */
  private bounce(b: TownBuilding): void {
    const { session } = services();
    const icon = itemVisual(this, b.icon, GAME_WIDTH / 2, 160, 4) as Phaser.GameObjects.GameObject & { setScale(s: number): void; setDepth(d: number): unknown; setAlpha(a: number): unknown };
    icon.setDepth(1500);
    if (session.settings.battleAnimations === 'off') { this.time.delayedCall(350, () => icon.destroy()); return; }
    icon.setScale(1);
    this.tweens.add({ targets: icon, scale: 5, duration: 220, ease: 'Back.easeOut', yoyo: true, hold: 160, onComplete: () => icon.destroy() });
  }

  private rain(motion: string): void {
    const drops = Array.from({ length: motion === 'full' ? 60 : 24 }, () => this.add.rectangle(Math.random() * GAME_WIDTH, Math.random() * GAME_HEIGHT, 2, 14, 0xaed6ff, 0.5).setDepth(-16));
    this.time.addEvent({ delay: 30, loop: true, callback: () => drops.forEach((d) => { d.y += 16; d.x -= 3; if (d.y > GAME_HEIGHT) { d.y = -10; d.x = Math.random() * GAME_WIDTH; } }) });
  }

  private season(now: Date, motion: string): void {
    const s = currentSeason(now);
    const spots: Record<string, string> = { snowman: '⛄', blossom: '🌸', sunflower: '🌻', leaves: '🍂', pumpkin: '🎃' };
    // The season's prop stands in the plaza, with the town.
    this.town.world(() => {
      const prop = this.add.text(39 * T, 34 * T - 10, spots[s.prop] ?? '✨', { fontSize: '44px' }).setDepth(10 + 35 * T);
      this.add.text(39 * T, 35 * T + 4, s.name, textStyle(12, '#ffffff', { stroke: '#10203a', strokeThickness: 3 })).setDepth(10 + 35 * T);
      if (motion === 'full') this.tweens.add({ targets: prop, y: prop.y - 8, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    });
  }

  private addPets(motion: string): void {
    if (motion === 'off') return;
    const { session } = services();
    for (const [i, x] of pets(session.content, session.profile).slice(0, 3).entries()) {
      const sp = session.content.species.get(x.speciesId)!;
      if (!this.textures.exists(pokemonAssetIds(sp.assets).icon)) continue;
      const obj = pokemonIcon(this, sp, 200 + i * 40, 420, 1.2) as unknown as Phaser.GameObjects.GameObject & { x: number; y: number; setDepth(d: number): unknown };
      obj.setDepth(1000);
      this.petSprites.push({ obj, lag: 4 + i * 3 });
    }
  }

  private fireflies(motion: string): void {
    const { session } = services();
    for (let i = 0; i < 6; i++) {
      const fly = this.add.circle(80 + Math.random() * (GAME_WIDTH - 160), 140 + Math.random() * 260, 5, 0xf8f080, 0.9).setDepth(900).setInteractive({ useHandCursor: true });
      if (motion !== 'off') this.tweens.add({ targets: fly, x: fly.x + (Math.random() - 0.5) * 120, y: fly.y + (Math.random() - 0.5) * 80, alpha: 0.35, duration: 1800 + Math.random() * 1500, yoyo: true, repeat: -1 });
      fly.on('pointerdown', () => {
        const r = session.town('night-firefly', { grade: 'good' });
        this.say(r.message);
        if (r.ok) fly.destroy();
      });
    }
  }

  private setDecorMode(on: boolean): void {
    this.decorMode = on;
    this.drawDecor();
    if (on) this.say('Decor mode: drag your furniture. Esc to finish.');
  }

  /** Placed furniture. In decor mode each piece drags; a drop saves its position (a fraction of the screen). */
  private drawDecor(): void {
    const { session } = services();
    this.decorLayer?.destroy();
    const t = townOf(session.profile);
    const layer = this.add.container(0, 0).setDepth(this.decorMode ? 1800 : -5);
    this.decorLayer = layer;
    const owned = new Set(ownedSet(session.profile, 'decor'));
    for (const [id, pos] of Object.entries(t.placed)) {
      if (!owned.has(id)) continue;
      const w = 96, h = 56;
      const box = this.add.container(pos[0] * GAME_WIDTH, pos[1] * GAME_HEIGHT);
      box.add([this.add.rectangle(0, 0, w, h, 0x5a4a6a, 0.9).setStrokeStyle(2, this.decorMode ? 0xffb745 : 0x9b88b0), this.add.text(0, 0, id.replace(/^dc-/, ''), textStyle(14, '#f8f8f8')).setOrigin(0.5)]);
      box.setSize(w, h);
      if (this.decorMode) {
        box.setInteractive({ draggable: true, useHandCursor: true });
        this.input.setDraggable(box);
        box.on('drag', (_p: Phaser.Input.Pointer, x: number, y: number) => { box.setPosition(Phaser.Math.Clamp(x, 40, GAME_WIDTH - 40), Phaser.Math.Clamp(y, 100, GAME_HEIGHT - 40)); });
        box.on('dragend', () => { services().session.town('furniture-place', { choice: `${id}|${(box.x / GAME_WIDTH).toFixed(3)}|${(box.y / GAME_HEIGHT).toFixed(3)}` }); });
      }
      layer.add(box);
    }
    void TOWN;
  }
}
