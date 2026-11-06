// The stage map: 20 numbered levels in columns, ending at the gym leader.
// The player picks one of the next nodes to fight, can stop at a healing spot
// or shop beside the node they're on, and can use the Party and Bag menus.
// After a region's last stage the same screen shows its Pokémon League: one
// straight line of Elite Four members, then the champion. The League climbs:
// columns spread across the screen, each battle sits higher on a taller glass
// pillar with a bigger token, and the champion stands in turning gold rays
// (Visual Bible: "a deliberate escalation from normal stages").

import { mapOmens, type Omen, type OmenTier } from '../core/omens';
import { wealthTaxNotice } from '../core/priceSwing';
import { nookOf, renameNode } from '../core/hubNook';
import { habitatList } from '../core/habitat';
import { crossingHint, obstacleAt, towerClimb, TRAVERSAL } from '../core/traversal';
import { realSeason, SEASON_SKIN } from '../ui/seasonSkin';
import { clockLabel, periodOf, PERIOD_LOOK, tideLabel } from '../core/clock';
import { modeObjectives, objectivesLine } from '../core/modeObjectives';
import { bountyObjective } from '../core/bounties';
import { fieldHintId, licenseName, licenseNote } from '../core/license';
import { SERVICES } from '../core/services/schema';
import { stopIsHidden } from '../core/events';
import { leadChatter } from '../core/leadChatter';
import { forecast, foggedAt, frontAt, isFogged, sightRange, visibleColumn } from '../core/world';
import Phaser from 'phaser';
import { pinnedObjective } from '../core/objectives';
import { rerollRunQuest } from '../core/quests';
import { regionDim } from '../ui/battleFx/transitions';
import { regionIdentity } from '../core/presentation/regionIdentity';
import { FRAME_ASSET_IDS, headerBar } from '../ui/frames';
import { currentColumn, findNode } from '../core/map';
import { runPerks } from '../core/archetypes';
import { frontRunner, isFalseProtagonist, rivalTitle, TIMELINE } from '../core/timeline/frontRunner';
import { bondOf } from '../core/bond';
import { boxCapacity } from '../core/trainerPerks';
import { hiddenItemNode, mapItemSummary, repelActive } from '../core/mapItems';
import { expeditionPreview } from '../core/expedition/flow';
import { minigamePreview } from '../core/minigame/flow';
import { ROUTE_LABELS, routeKind } from '../core/campaign/director';
import { anomalyLine, stageAnomaly } from '../core/story/anomaly';
import { StopCard, type StopLook } from '../ui/stopLooks';
import { fishingOffer, raidPreview, totemPreview, mapActions, wipeStatus, mapChoices, mapPreviews, bossLootPreview, nextGymLeaders, type MapActionKind, type NodePreview } from '../core/run';
import { bossInfo, currentRegion, getCampaign, runLevelCap } from '../core/regions';
import { blindMap } from '../core/rules';
import { regionRules } from '../core/battle/typeRules';
import { arenaFor, getTheme } from '../core/themes';
import { stageModifier } from '../core/runModifiers';
import type { MapNode, SideStop } from '../core/state';
import { services } from '../game/services';
import { device } from '../game/deviceTools';
import { flagOn } from '../core/tools/featureFlags';
import { commentaryLine } from '../core/tools/commentary';
import { maxHp } from '../core/pokemon';
import { newSplits, parseSplits, formatMs, updateSplits } from '../core/tools/speedrun';
import { tradeSalt, useTradeScreen } from '../core/presentation/tradeStyles';
import { playCry, playMusic, playSfx, playSfxLazy, playMusicLazy } from '../ui/audio';
import { notify } from '../ui/overlays';
import { mapTrack } from '../core/presentation/battleMusic';
import { openBondMenu } from '../ui/bondMenu';
import { openPartyScene, openScrapbook } from '../ui/partyLifeUi';
import { openPokemonMenu } from '../ui/pokemonMenu';
import { openCampMenu } from '../ui/campMenu';
import { openBagMenu, openBoxMenu, openRivalNotebook, openSaveMenu, openStoryMenu, type FieldMenuHost } from '../ui/fieldMenus';
import { hasRelationships, openRelationshipsMenu } from '../ui/relationshipsMenu';
import { hasJournal, openJournalMenu } from '../ui/journalMenu';
import { onInputAction } from '../ui/input';
import { Picker, speciesRow, type PickerLike } from '../ui/partyPanel';
import { STOP_STYLES, stopStyle } from '../ui/stopIcons';
import { itemVisual, pokemonIcon, trainerVisual } from '../ui/sprites';
import { showAchievementToasts } from '../ui/achievementToast';
import { COLORS, GAME_HEIGHT, GAME_WIDTH, PIXEL_SCALE, TYPE_COLORS, mixColor, textStyle } from '../ui/theme';
import { badge, focusFrame } from '../ui/widgets';
import { fitBlock, fitLine } from '../ui/fitText';
import { AERO, drawGlass, floatIdle, glassPanel as drawPanel, typeLabel, type MotionLevel } from '../ui/aero';
import { uiTiming } from '../ui/wiiMotion';
import { addAmbience } from '../ui/battleFx/ambience';
import { PARALLAX_RANGE, parallaxOffset, pointerShare, type ParallaxLayer } from '../core/presentation/parallax';
import { sceneForRun } from './routing';
import { partySpecies, preloadPokemon, queueAssets } from '../ui/lazyAssets';
import { screenStyleOf } from '../core/presentation/screenStyles';
import { MAP_SKINS } from '../ui/mapStyles';
import { drawNextStop } from '../ui/mapStyles/nextstopCards';
import { HUB_LIGHT, hubPeriod } from '../core/hubTown/daylight';
import { eggLabel, eggRevealed, eggTier } from '../core/eggs';
import { protagonistTitle, topHeadline } from '../core/rivals/recognition';
import { mentorHudLine } from '../core/mentors';
import { ensureNarration } from '../core/overhaul/partyNarration';

const COL_SPACING = 104;
const ROW_SPACING = 92;
const MAP_LEFT = 70;
const MAP_MID_Y = 245;
const PIGGYBACK_WEIGHT = 8;
const PIGGYBACK_AFFECTION = 60;
const IDLE_NAP_MS = 20000;
const NODE_RADIUS = 24;
/** How far the League's last battle sits above its first. */
const LEAGUE_RISE = 120;
const TOWER_RISE = 80;

const KIND_STYLE: Record<MapNode['kind'], { color: number; glyph: string; label: string }> = {
  wild: { color: 0x48a860, glyph: 'W', label: 'Wild Pokémon' },
  trainer: { color: 0xd08030, glyph: 'T', label: 'Trainer battle' },
  gym: { color: 0xc03838, glyph: 'G', label: 'Gym Leader' },
  elite: { color: 0x6848b0, glyph: 'E', label: 'Elite Four' },
  champion: { color: 0xd8a020, glyph: 'C', label: 'Champion' },
};
const BOSS_KINDS: readonly MapNode['kind'][] = ['gym', 'elite', 'champion'];
const HARDER_COLOR = 0x9048c8;
const SIDE_STYLE: Record<SideStop['kind'], { color: number; glyph: string }> = {
  heal: { color: 0xe06890, glyph: '+' },
  shop: { color: 0x4878d0, glyph: '$' },
  fish: { color: 0x30a0b8, glyph: '~' },
  raid: { color: 0xd04040, glyph: 'R' },
  totem: { color: 0xe8a020, glyph: 'T' },
  event: { color: 0xd89830, glyph: '!' },
  expedition: { color: 0x38b878, glyph: 'E' },
  minigame: { color: 0x58c0e8, glyph: 'G' },
  service: { color: 0xa878e0, glyph: 'S' },
  plaza: { color: 0xf0c040, glyph: 'P' },
};
const SIDE_LABEL: Record<SideStop['kind'], string> = { heal: 'Heal', shop: 'Shop', fish: 'Fish', raid: 'Raid', totem: 'Totem', event: 'Event', expedition: 'Expedition', minigame: 'Minigame', service: 'Service', plaza: 'Plaza' };
/** A node in the fog: a grey token with a "?" until you scout, see further or get close. */
const FOG_STYLE = { color: 0x56607a, glyph: '?', label: 'Fog' };
/** A Legendary world event's gate (an expedition gate whose expedition has a `legendary` block). */
const LEGEND_STYLE = { color: 0xf0c030, glyph: '✦' };
const legendOf = (expeditionId: string | undefined) => (expeditionId ? services().session.content.expeditions.expeditions.find((e) => e.id === expeditionId && e.legendary) : undefined);
/** A roaming Legendary's stop and a checkpoint camp. */
const ROAMER_STYLE = { color: 0xf0c030, glyph: '★' };
const CAMP_STYLE = { color: 0x58a860, glyph: '▲' };
const FRONT_LABEL: Record<string, string> = { rain: 'Rain', sun: 'Harsh sun', sand: 'Sandstorm', snow: 'Snow', hail: 'Hail' };
const FRONT_COLOR: Record<string, number> = { rain: 0x4878d0, sun: 0xe8a020, sand: 0xc8a050, snow: 0xe0f0ff, hail: 0x90c0e0 };
/** A hidden event stop: a grey "?" until you reach it. */
const HIDDEN_STYLE = { color: 0x6b5a73, glyph: '?' };

const serviceReusable = (side: SideStop): boolean => SERVICES.services.find((x) => x.id === side.serviceId)?.reusable === true;

/** Something the cursor can land on. */
type Option =
  | { kind: 'node'; node: MapNode }
  | { kind: 'side'; side: SideStop }
  | { kind: 'party' }
  | { kind: 'bag' }
  | { kind: 'camp' }
  | { kind: 'story' }
  | { kind: 'relationships' }
  | { kind: 'journal' }
  | { kind: 'notebook' }
  | { kind: 'bond' }
  | { kind: 'scrapbook' }
  | { kind: 'box' }
  | { kind: 'save' }
  | { kind: 'endRun' };

const PING_ICONS = ['⚑', '★', '❗', '?'];

export class MapScene extends Phaser.Scene {
  private options: Option[] = [];
  private cursors: Phaser.GameObjects.Graphics[] = [];
  private index = 0;
  private picker: PickerLike | null = null;
  private info: Phaser.GameObjects.Text | null = null;
  private notice: Phaser.GameObjects.Text | null = null;
  private omens: Record<string, Omen> = {};
  private endArmed = false;
  private busy = false;
  private colSpacing = COL_SPACING;
  private accent: number = COLORS.border;
  /** What map items show about nodes (Devon Scope, Town Map, Rule Book, Orange Mail). */
  private previews: Record<string, NodePreview> = {};
  /** Where each node is drawn inside the scrolling map layer (for the travel animation). */
  private nodePos = new Map<string, { x: number; y: number }>();
  private mapLayer: Phaser.GameObjects.Container | null = null;

  constructor() {
    super('Map');
  }

  /** The healing stop: a soft green glow and rising sparkles over the screen, then `done` (straight away with animations Off). */
  private healFx(done: () => void): void {
    if (this.motion === 'off') return done();
    const full = this.motion === 'full';
    const wash = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x7dffb0, 0).setOrigin(0).setDepth(300);
    this.tweens.add({ targets: wash, alpha: full ? 0.32 : 0.15, duration: 260, yoyo: true, ease: 'Sine.easeInOut' });
    if (full) {
      for (let i = 0; i < 14; i++) {
        const spark = this.add.text(120 + i * 55, GAME_HEIGHT - 60, i % 3 === 0 ? '+' : '✦', textStyle(i % 3 === 0 ? 30 : 22, '#c8ffd8')).setOrigin(0.5).setDepth(301).setAlpha(0);
        this.tweens.add({ targets: spark, y: GAME_HEIGHT - 60 - (150 + (i % 4) * 40), alpha: { from: 1, to: 0 }, scale: { from: 0.6, to: 1.3 }, duration: 800, delay: i * 30, ease: 'Sine.easeOut' });
      }
    }
    this.time.delayedCall(full ? 760 : 320, done);
  }

  private get motion(): MotionLevel {
    return services().session.settings.battleAnimations;
  }

  preload(): void {
    const { session } = services();
    this.previews = session.run?.phase === 'map' ? mapPreviews(session.content, session.run) : {};
    this.omens = session.run?.phase === 'map' ? mapOmens(session.content, session.run) : {};
    const shown = Object.values(this.previews).flatMap((p) => p.team.flatMap((m) => session.content.species.get(m.speciesId) ?? []));
    // Fishing spots beside the current node: their Pokémon are shown in the picker.
    const run = session.run;
    const here = run?.phase === 'map' && run.stage?.current ? run.stage.map.nodes.find((n) => n.id === run.stage!.current) : undefined;
    for (const side of here?.sides ?? []) {
      if (side.kind === 'fish' && !side.used) shown.push(...fishingOffer(session.content, run!, side.id).flatMap((o) => session.content.species.get(o.speciesId) ?? []));
    }
    preloadPokemon(this, [...partySpecies(), ...shown], { icon: true });
    queueAssets(this, [...FRAME_ASSET_IDS, 'ui.party.icon_box', 'ui.party.icon_box_faint', 'ui.party.statuses', 'ui.party.icon_item', 'ui.bag.bg', ...(run?.eggs.length ? ['pack.ebdx.egg'] : [])]);
  }

  create(data: { notice?: string; focus?: number } = {}): void {
    this.endArmed = false;
    this.legend = null;
    void ensureNarration().catch(() => undefined);
    const { session } = services();
    const run = session.run!;
    // S5: a backstory scene waiting (the intro at the start, or one a Story Stop queued) plays before the map shows.
    if (session.storyScene()) {
      this.scene.start('Story', { next: 'Map' });
      return;
    }
    // W10 (I496/I507/I497): C hears a cry, H holds the lead's paw, N names the node. Keys and touch buttons share one handler each.
    const stageKey = (nodeId: string): string => {
      const n = run.stage?.map.nodes.find((x) => x.id === nodeId);
      return `${run.regionOrder[run.regionIndex]}:${run.stage?.themeId}:${n?.column}:${n?.row}`;
    };
    // Names given in earlier runs come back on the same spots (same region, theme, column and row).
    const known = session.profile.nook?.nodeNames ?? {};
    for (const n of run.stage?.map.nodes ?? []) if (!n.name && known[stageKey(n.id)]) n.name = known[stageKey(n.id)];
    const doCry = (): void => {
      const names = habitatList(content, run);
      if (names.length === 0) return;
      const pick = names[Math.floor(Math.random() * names.length)]!; // presentation only, never gameplay RNG
      const sp = [...content.species.values()].find((x) => x.name === pick);
      if (sp) playCry(this, sp);
    };
    const doHand = (): void => {
      const lead = run.party[0];
      const cur = run.stage?.current;
      if (!lead || !cur) return;
      const key = `hand:${cur}`;
      if (run.story.flags[key]) return void notify('You are already holding paws here.');
      run.story.flags[key] = 1;
      lead.friendship = Math.min(255, (lead.friendship ?? 0) + 2);
      session.saveRunNow();
      notify(`${content.species.get(lead.speciesId)?.name ?? 'Your lead'} squeezes your hand. It feels braver.`);
    };
    const doName = (): void => {
      const cur = run.stage?.current;
      const node = run.stage?.map.nodes.find((x) => x.id === cur);
      if (!node || typeof window === 'undefined' || typeof window.prompt !== 'function') return;
      const text = window.prompt('Name this place (up to 24 letters, empty clears):', node.name ?? '');
      if (text === null) return;
      const renamed = renameNode(run, node.id, text);
      node.name = renamed.stage!.map.nodes.find((x) => x.id === node.id)!.name;
      const names = { ...(session.profile.nook?.nodeNames ?? {}) };
      if (node.name) names[stageKey(node.id)] = node.name; else delete names[stageKey(node.id)];
      session.changeProfile((pr) => ({ ...pr, nook: { ...nookOf(pr), nodeNames: names } }));
      session.saveRunNow();
      this.scene.restart({ notice: node.name ? `You named this place "${node.name}".` : 'The name is cleared.', focus: this.index });
    };
    this.input.keyboard?.on('keydown-C', doCry);
    this.input.keyboard?.on('keydown-H', doHand);
    this.input.keyboard?.on('keydown-N', doName);
    [['Cry (C)', doCry], ['Hold paw (H)', doHand], ['Name place (N)', doName]].forEach(([label, fn], i) => {
      const btn = this.add.text(16 + i * 150, GAME_HEIGHT - 28, label as string, textStyle(14, COLORS.textMuted)).setDepth(50).setInteractive({ useHandCursor: true });
      btn.on('pointerover', () => btn.setColor(COLORS.textLight));
      btn.on('pointerout', () => btn.setColor(COLORS.textMuted));
      btn.on('pointerdown', fn as () => void);
    });
    const content = session.content;
    const stage = run.stage!;
    const theme = getTheme(content, stage.themeId);
    const league = stage.kind === 'league';
    const leader = bossInfo(content, league ? 'champion' : 'gym', stage.leaderId);
    const region = currentRegion(content, run);
    const identity = regionIdentity(region.id);
    this.accent = identity.accent;
    const cap = runLevelCap(content, run);
    this.options = [];
    this.pings.clear();
    this.cursors = [];
    this.index = 0;
    this.picker = null;
    this.busy = false;
    playMusicLazy(this, mapTrack(region.id));

    // ---------- backdrop: the stage's own arena, dimmed ----------
    const arena = league ? undefined : arenaFor(content, theme);
    const bg = arena && this.textures.exists(arena) ? arena : this.textures.exists('bg.battle') ? 'bg.battle' : null;
    let backImg: Phaser.GameObjects.Image | undefined;
    if (bg) {
      const back = this.add.image(0, 0, bg).setOrigin(0).setScale(PIXEL_SCALE).setDepth(-60);
      backImg = back;
      // Parallax: the scenery drifts slowly behind the map (presentation only).
      if (this.motion === 'full' && back.displayWidth > GAME_WIDTH && !session.settings.mapParallax) {
        this.tweens.add({ targets: back, x: GAME_WIDTH - back.displayWidth, duration: 40_000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      }
      this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, regionDim(identity.sky), 0.58).setOrigin(0).setDepth(-55);
    }
    // Screens redesign (Group B): a picked map look repaints the backdrop, routes and stop tokens (core/presentation/screenStyles.ts).
    const skinId = screenStyleOf('map', session.settings.screenStyles, `${run.seed}:${stage.index}`);
    const mapSkin = skinId === 'original' ? null : MAP_SKINS[skinId];
    if (mapSkin) {
      mapSkin.backdrop(this, this.motion);
      mapSkin.frame?.(this, this.motion, { title: theme.name, types: theme.types });
    }
    // The stage's types drift over it (leaves, embers, bubbles...), like the battle arena.
    const air = this.add.container(0, 0).setDepth(-50);
    addAmbience(this, air, 0, league || blindMap(run.rules) ? ['dragon'] : theme.types, this.motion);
    // Layers in front of the scenery: a far landmark (the stage's lead type, big and faint) and a dark ground band that
    // fades up from the bottom edge, so the map nodes sit between sky and ground.
    if (!league && !blindMap(run.rules) && theme.types[0]) {
      const mark = typeLabel(this, GAME_WIDTH - 150, 150, theme.types[0], 7);
      if (mark) {
        mark.setAlpha(0.22).setDepth(-52);
        floatIdle(this, mark, this.motion, 6, 3200);
      }
    }
    const ground = this.add.graphics().setDepth(-49);
    for (let i = 0; i < 8; i++) {
      ground.fillStyle(0x0a0a18, 0.05 + i * 0.03);
      ground.fillRect(-PARALLAX_RANGE, GAME_HEIGHT - 120 + i * 15, GAME_WIDTH + PARALLAX_RANGE * 2, 15);
    }
    // S242: the layers slide at different speeds with the pointer (Settings > Map parallax). Presentation only.
    if (session.settings.mapParallax && this.motion === 'full') {
      const layers: { obj: Phaser.GameObjects.Components.Transform; layer: ParallaxLayer; x0: number }[] = [
        { obj: air, layer: 'air', x0: air.x },
        { obj: ground, layer: 'ground', x0: ground.x },
      ];
      {
        const back = backImg;
        if (back && back.displayWidth > GAME_WIDTH + PARALLAX_RANGE * 2) {
          back.x = -(back.displayWidth - GAME_WIDTH) / 2;
          layers.push({ obj: back, layer: 'scenery', x0: back.x });
        }
      }
      this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
        const share = pointerShare(p.x, GAME_WIDTH);
        for (const l of layers) this.tweens.add({ targets: l.obj, x: l.x0 + parallaxOffset(true, this.motion, share, l.layer), duration: 180, ease: 'Sine.easeOut' });
      });
    }

    // ---------- header ----------
    const chrome = mapSkin?.chrome;
    const hInk = chrome?.header.ink ?? COLORS.textLight;
    const hSub = chrome?.header.sub ?? '#d8d0e0';
    const bInk = chrome?.bottom.ink ?? COLORS.textLight;
    if (chrome) drawGlass(this, 8, 6, GAME_WIDTH - 16, 64, { tint: chrome.header.fill, rim: chrome.header.border, alpha: chrome.header.alpha, glow: false, radius: chrome.button.radius > 12 ? 18 : 8 });
    else drawPanel(this, 8, 6, GAME_WIDTH - 16, 64, { fill: COLORS.panelDark, border: COLORS.borderMuted, thin: true, alpha: 0.92 });
    const column = currentColumn(stage);
    if (!chrome) headerBar(this, identity.accent, this.motion, 8, 6, GAME_WIDTH - 16, 64); // UIE pause-menu strip in the region's colour
    // The region's accent stripe under the header (catalog 62).
    this.add.rectangle(20, 67, GAME_WIDTH - 40, 3, identity.accent, 0.9).setOrigin(0).setName('region-accent');
    if (league) {
      this.add.text(24, 12, `${region.name} Pokémon League`, textStyle(28, hInk));
      this.add.text(26, 44, `Elite Four, then ${leader.title}  ·  Healed after every battle`, textStyle(16, hSub));
    } else {
      const blind = blindMap(run.rules);
      this.add.text(24, 12, `Stage ${stage.index + 1}: ${blind ? '???' : theme.name}`, textStyle(28, hInk));
      const stageMod = stageModifier(run);
      if (stageMod) this.add.text(24 + 560, 14, stageMod.name, textStyle(18, hSub));
      let bx = 26;
      for (const type of blind ? [] : theme.types) {
        const b = badge(this, bx, 44, type, TYPE_COLORS[type] ?? 0x808080, 14);
        bx += b.width + 6;
      }
      this.add.text(bx + 8, 44, leader.title, textStyle(16, hSub));
    }
    this.add
      .text(GAME_WIDTH - 24, 14, `${region.name}  ·  ${league ? 'Battle' : 'Level'} ${column}/${stage.map.columns}`, textStyle(24, hInk))
      .setOrigin(1, 0);
    this.add
      .text(GAME_WIDTH - 24, 44, `${clockLabel(run)}  ·  ${tideLabel(content, run)}  ·  ₽${run.money}  ·  Badges ${run.badges.length}  ·  Level cap ${cap}${wipeStatus(run) ? `  ·  Wipes ${wipeStatus(run)!.wipes}${wipeStatus(run)!.max ? `/${wipeStatus(run)!.max}` : ''}` : ''}`, textStyle(16, hSub))
      .setOrigin(1, 0);
    // S156: this region's own type-chart rules, if it has any.
    const localRules = regionRules(content, run.regionOrder[run.regionIndex]);
    if (localRules.length > 0) {
      const cap = (t: string): string => t[0]!.toUpperCase() + t.slice(1);
      this.add
        .text(GAME_WIDTH - 24, 66, `${region.name} type rules: ${localRules.map((r) => `${cap(r.attack)}→${cap(r.defend)} ×${r.mult}`).join('  ·  ')}`, textStyle(14, hSub))
        .setOrigin(1, 0)
        .setName('region-type-rules');
    }
    // Speedrun timer (core/tools/speedrun.ts, off by default; Hub > Tools): splits per badge kept on this device only.
    if (device.speedrunOn()) {
      const now = Date.now();
      const old = parseSplits(device.splits());
      const sp = updateSplits(old && old.runId === run.runId ? old : newSplits(run.runId, now), now, run.badges.length, false);
      device.setSplits(JSON.stringify(sp));
      this.add.text(GAME_WIDTH - 24, 68, `Run time ${formatMs(now - sp.startedAt)}${sp.splits.length ? `  ·  last split ${formatMs(sp.splits[sp.splits.length - 1]!.ms)}` : ''}`, textStyle(13, hSub)).setOrigin(1, 0).setName('speedrun-hud');
    }
    // Run Commentary Bot (S213, off unless the "commentary" feature flag is on): one narrator line, text only.
    if (flagOn(device, 'commentary')) {
      const lead = run.party[0];
      const text = commentaryLine({ seed: run.seed, encounters: run.encountersCompleted, badges: run.badges.length, leadHp: lead ? lead.hp / Math.max(1, maxHp(content, lead)) : 1, partySize: run.party.length, fainted: run.party.filter((p) => p.hp <= 0).length });
      this.add.text(GAME_WIDTH / 2, 92, `“${text}”`, textStyle(13, '#e8e0c8', { stroke: '#1a1a2a', strokeThickness: 3 })).setOrigin(0.5, 0).setName('commentary');
    }
    // Mentors: who trains you, how far the bond has come and where you stand against the fellow apprentice.
    const mentorLine = league ? null : mentorHudLine(run);
    if (mentorLine) this.add.text(24, 68, mentorLine, textStyle(13, '#d8c8f0', { stroke: '#2a1a4a', strokeThickness: 3 })).setName('mentor-hud');
    // Time of day: a light wash over the map (presentation only).
    const look = PERIOD_LOOK[periodOf(run)];
    if (look.alpha > 0) this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, look.tint, look.alpha * 0.5).setOrigin(0).setDepth(900).setName('time-wash');
    // Seasonal map skin from the real-world date (ideas W4, presentation only): a tint and drifting petals, sun motes,
    // leaves or snow behind the map.
    const skin = SEASON_SKIN[realSeason(new Date())];
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, skin.tint, 0.08).setOrigin(0).setDepth(-48).setName(`season-${skin.name}`);
    if (!league) addAmbience(this, this.add.container(0, 0).setDepth(-47), 0, [skin.ambience], this.motion);
    // S252: the light of the local time of day over the backdrop (presentation only, off by default).
    if (session.settings.mapDayNight) {
      const light = HUB_LIGHT[hubPeriod(new Date())];
      if (light.alpha > 0) this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, light.tint, light.alpha * 0.8).setOrigin(0).setDepth(-46).setName('map-daylight');
    }
    // Weather forecast: a front ahead, or the one you are in, and fog.
    const fc = league ? null : forecast(content, run);
    if (fc) {
      const where = fc.startsIn === 0 ? `now over levels ${fc.front.from}–${fc.front.to}` : `in ${fc.startsIn} level${fc.startsIn === 1 ? '' : 's'} (levels ${fc.front.from}–${fc.front.to})`;
      const band = fc.front.band === 'all' ? '' : fc.front.band === 'high' ? ', top route only' : ', lower routes only';
      this.add.text(GAME_WIDTH / 2, 71, `Forecast: ${FRONT_LABEL[fc.front.weather] ?? fc.front.weather} ${where}${band}`, textStyle(13, '#bfe4ff', { stroke: '#0b2a4a', strokeThickness: 3 })).setOrigin(0.5, 0).setName('forecast');
    }
    // Convoy Mode: the escort's health, as hearts.
    const convoy = league ? null : run.stage?.convoy;
    if (convoy) this.add.text(GAME_WIDTH / 2, 88, `Escort: ${convoy.name}  ${'♥'.repeat(convoy.hp)}${'♡'.repeat(convoy.maxHp - convoy.hp)}`, textStyle(13, '#ffd0d8', { stroke: '#4a0b1a', strokeThickness: 3 })).setOrigin(0.5, 0).setName('convoy');
    const chatter = league ? null : leadChatter(content, run);
    if (chatter) this.add.text(GAME_WIDTH / 2, 105, chatter, textStyle(12, '#e8e0c8', { stroke: '#2a2418', strokeThickness: 3 })).setOrigin(0.5, 0).setName('lead-chatter');
    const bounty = league ? null : bountyObjective(content, run);
    const objectives = [...modeObjectives(run), ...(bounty ? [bounty] : [])];
    // The pinned quest line sits at y=66 on the right, so the objectives (mode steps and the stage bounty) go one row lower when it is shown.
    const pinned = pinnedObjective(content, run);
    if (objectives.length > 0) this.add.text(GAME_WIDTH - 24, pinned ? 86 : 68, objectivesLine(objectives), textStyle(14, '#f0e0a0')).setOrigin(1, 0).setName('objectives-line');

    // Revisit This Timeline: the False Protagonist's title, and who is ahead of you now.
    if (isFalseProtagonist(run)) {
      const fr = frontRunner(run);
      const ahead = fr?.rank ? `  ·  ${rivalTitle(content, fr)} is ahead (${fr.rank === 'gymLeader' ? 'Gym Leader' : fr.rank === 'finalist' ? 'finalist' : 'Champion'})` : '';
      const tag = this.add.text(26, 68, `${TIMELINE.title}${ahead}`, textStyle(14, '#ff9fe0', { stroke: '#2a0a2a', strokeThickness: 4 }));
      if (services().session.settings.battleAnimations === 'full') this.tweens.add({ targets: tag, alpha: 0.55, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    if (pinned) {
      const pinText = this.add.text(GAME_WIDTH - 24, 66, `★ ${pinned.text} (${pinned.current}/${pinned.target})`, textStyle(14, '#f0e0a0')).setOrigin(1, 0).setName('pinned-quest');
      // Reroll Points: tap the Run Quest line to swap it for ₽100 (+₽100 each time).
      if (pinned.kind === 'runQuest') {
        pinText.setInteractive({ useHandCursor: true }).on('pointerup', () => {
          const r = rerollRunQuest(content, run);
          if (r.ok) services().session.saveRunNow();
          this.scene.restart({ notice: r.ok ? r.line : r.line, focus: this.index });
        });
      }
    }

    // ---------- the map (scrolls sideways) ----------
    // A bike chosen from the Items menu changes where the player can go.
    const choices = mapChoices(content, run);
    const hidden = hiddenItemNode(content, run);
    const choiceIds = new Set(choices.map((n) => n.id));
    const mapLayer = this.add.container(0, 0);
    this.mapLayer = mapLayer;
    this.nodePos = new Map();
    const colSpacing = league ? Math.min(200, (GAME_WIDTH - MAP_LEFT * 2 - 40) / Math.max(1, stage.map.columns - 1)) : COL_SPACING;
    this.colSpacing = colSpacing;
    const totalWidth = MAP_LEFT * 2 + (stage.map.columns - 1) * colSpacing;
    const focusCol = Math.max(column, 1);
    const scroll = Phaser.Math.Clamp(MAP_LEFT + (focusCol - 1) * colSpacing - 300, 0, Math.max(0, totalWidth - GAME_WIDTH));
    mapLayer.x = -scroll;
    const maskShape = this.make.graphics({}, false).fillRect(0, 74, GAME_WIDTH, 346);
    mapLayer.setMask(maskShape.createGeometryMask());

    const widthOf = (col: number) => stage.map.nodes.filter((n) => n.column === col).length;
    // In the League each battle sits a step higher than the last.
    // In a Sky Tower week the whole map climbs upward too, a little less steeply.
    const totalRise = league ? LEAGUE_RISE : towerClimb(content, run) ? TOWER_RISE : 0;
    const rise = totalRise / Math.max(1, stage.map.columns - 1);
    const pos = (n: MapNode) => ({
      x: MAP_LEFT + (n.column - 1) * colSpacing,
      y: MAP_MID_Y + (n.row - (widthOf(n.column) - 1) / 2) * ROW_SPACING + (totalRise ? totalRise / 2 - (n.column - 1) * rise : 0),
    });

    const lines = this.add.graphics();
    mapLayer.add(lines);
    const openPaths: [{ x: number; y: number }, { x: number; y: number }][] = [];
    // The boss column: a glowing band behind the gym leader (or each League battle).
    for (const n of stage.map.nodes.filter((m) => BOSS_KINDS.includes(m.kind))) {
      const { x: bx, y: by } = pos(n);
      const top = league ? by - 56 : 98;
      const band = drawGlass(this, bx - 46, top, 92, 398 - top, { tint: KIND_STYLE[n.kind].color, rim: mixColor(KIND_STYLE[n.kind].color, 0xffffff, 0.4), alpha: 0.28, radius: 24 });
      mapLayer.addAt(band, 0);
      if (league) band.setName('league-step');
      if (n.kind === 'champion') {
        const rays = this.add.star(bx, by, 12, 18, 96, 0xf8d050, 0.32).setBlendMode('ADD').setName('league-rays');
        mapLayer.addAt(rays, 1);
        if (this.motion === 'full') this.tweens.add({ targets: rays, angle: 360, duration: 14000, repeat: -1 });
        if (this.motion !== 'off') this.tweens.add({ targets: rays, scale: 1.12, alpha: 0.5, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      }
      if (this.motion === 'full') this.tweens.add({ targets: band, alpha: 0.6, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    for (const n of stage.map.nodes) {
      const a = pos(n);
      for (const id of n.next) {
        const b = pos(findNode(stage.map, id));
        const walked = stage.visited.includes(n.id) && stage.visited.includes(id);
        const open = n.id === stage.current && choiceIds.has(id);
        if (mapSkin) mapSkin.edge(lines, a, b, { open, walked });
        else {
          // A dark edge under each path, like a drawn route on a town map.
          lines.lineStyle(open ? 11 : 9, 0x181818, 0.9);
          lines.lineBetween(a.x, a.y, b.x, b.y);
          lines.lineStyle(open ? 5 : 3, walked ? 0xf8c030 : open ? 0xf8f8f8 : 0x5a6f8a, 1);
          lines.lineBetween(a.x, a.y, b.x, b.y);
        }
        if (open) openPaths.push([a, b]);
      }
    }
    // Open paths glow, and little lights travel along them toward the choices.
    const glow = this.add.graphics().setBlendMode('ADD');
    mapLayer.add(glow);
    for (const [a, b] of openPaths) {
      glow.lineStyle(12, AERO.rim, 0.18);
      glow.lineBetween(a.x, a.y, b.x, b.y);
      if (this.motion !== 'full') continue;
      for (let k = 0; k < 2; k++) {
        const spark = this.add.circle(a.x, a.y, 4, AERO.white, 0.95).setBlendMode('ADD');
        mapLayer.add(spark);
        this.tweens.add({ targets: spark, x: b.x, y: b.y, alpha: { from: 1, to: 0.2 }, duration: 1300, delay: k * 650, repeat: -1, ease: 'Sine.easeIn' });
      }
    }

    // Trainer column markers along the bottom.
    for (const col of stage.map.trainerColumns) {
      const x = MAP_LEFT + (col - 1) * colSpacing;
      mapLayer.add(this.add.text(x, 402, 'Trainers', textStyle(14, '#f8a850')).setOrigin(0.5));
    }

    const cardNodes: MapNode[] = [];
    const seenColumn = league ? 99 : visibleColumn(content, run);
    for (const n of stage.map.nodes) {
      const { x, y } = pos(n);
      this.nodePos.set(n.id, { x, y });
      const fog = foggedAt(stage, seenColumn, n);
      const style = fog ? FOG_STYLE : KIND_STYLE[n.kind];
      const visited = stage.visited.includes(n.id);
      const isCurrent = n.id === stage.current;
      const reachable = choiceIds.has(n.id);
      const dim = !visited && !reachable && n.column <= column;
      const isBoss = BOSS_KINDS.includes(n.kind);
      const r = (isBoss ? NODE_RADIUS + 6 : NODE_RADIUS) + (league ? (n.column - 1) * 2 : 0);
      const alpha = dim ? 0.35 : visited && !isCurrent ? 0.6 : 1;
      // A pixel token: dark rim, the kind's colour, a lighter top and a darker bottom.
      const g = this.add.graphics();
      if (mapSkin) mapSkin.token(g, x, y, r, { color: style.color, alpha, boss: isBoss, current: isCurrent, reachable });
      else {
        g.fillStyle(0x181818, alpha);
        g.fillCircle(x, y + 2, r + 3);
        g.fillStyle(mixColor(style.color, 0x000000, 0.35), alpha);
        g.fillCircle(x, y, r);
        g.fillStyle(style.color, alpha);
        g.fillCircle(x, y - 2, r - 3);
        g.fillStyle(mixColor(style.color, 0xffffff, 0.35), alpha);
        g.fillEllipse(x, y - r * 0.45, r * 1.1, r * 0.5);
      }
      if (n.harder && !fog) {
        g.lineStyle(5, HARDER_COLOR, dim ? 0.4 : 1);
        g.strokeCircle(x, y, r + 6);
      }
      mapLayer.add(g);
      if (isCurrent) this.addFollower(mapLayer, x, y, r);
      if (reachable) {
        // A soft halo that breathes under each node you can travel to.
        const halo = this.add.circle(x, y, r + 8, AERO.sky, 0.35).setBlendMode('ADD');
        mapLayer.addAt(halo, mapLayer.getIndex(g));
        if (this.motion === 'full') this.tweens.add({ targets: halo, scale: 1.25, alpha: 0.1, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: n.row * 150 });
      }
      if (visited && !isCurrent) mapLayer.add(this.add.text(x + r - 4, y + r - 6, '✓', textStyle(18, '#8cf070', { stroke: '#0b2a4a', strokeThickness: 4 })).setOrigin(0.5));
      if (isCurrent) {
        const ring = this.add.graphics();
        ring.lineStyle(4, 0xffffff, 1);
        ring.strokeCircle(x, y, r + 11);
        mapLayer.add(ring);
        this.tweens.add({ targets: ring, alpha: 0.35, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      }
      // What waits there: a Poké Ball for wild Pokémon, the boss's portrait, or a letter.
      const boss = this.bossFor(n);
      if (!fog && n.kind === 'wild' && this.textures.exists('ball.pb')) {
        mapLayer.add(this.add.image(x, y - 1, 'ball.pb').setScale(2).setAlpha(alpha));
      } else if (boss) {
        const art = trainerVisual(this, boss.spriteAssetId, boss.name, x, y + r - 4, 1);
        if (art instanceof Phaser.GameObjects.Sprite) art.setScale(Math.min(1, (r * 2.2) / art.height));
        art.setAlpha(alpha);
        mapLayer.add(art);
      } else {
        mapLayer.add(this.add.text(x, y, style.glyph, textStyle(26, '#ffffff', { stroke: '#181818', strokeThickness: 4 })).setOrigin(0.5).setAlpha(alpha));
      }
      if (n.harder && !fog) mapLayer.add(this.add.text(x + r - 2, y - r + 2, '!', textStyle(22, '#f8f8f8', { stroke: '#5a2890', strokeThickness: 5 })).setOrigin(0.5));
      // Story Run (S4): a Story Stop still to play here.
      if (!fog && n.storyStops?.some((id) => !run.story.v2?.stops.done.includes(id))) mapLayer.add(this.add.text(x + r - 2, y + r - 4, '★', textStyle(20, '#ffd860', { stroke: '#3a1850', strokeThickness: 4 })).setOrigin(0.5));
      // Itemfinder: the stop hiding an item.
      if (n.id === hidden && !visited) mapLayer.add(this.add.text(x - r + 2, y - r + 2, '✦', textStyle(22, '#f8e070', { stroke: '#181818', strokeThickness: 4 })).setOrigin(0.5));
      if (!fog) this.drawPreview(mapLayer, n, x, y, r);
      const omen = fog ? null : this.omens[n.id];
      if (omen) mapLayer.add(this.add.text(x - r + 2, y + r - 12, '●', textStyle(20, OMEN_COLOR[omen.tier], { stroke: '#181818', strokeThickness: 4 })).setOrigin(0.5));
      // A weather front over this node: a small badge in the front's colour.
      const front = fog ? null : frontAt(content, run, n);
      if (front) {
        const fb = this.add.graphics();
        fb.fillStyle(0x181818, 1);
        fb.fillRoundedRect(x - r - 6, y + r - 6, 46, 16, 4);
        fb.fillStyle(FRONT_COLOR[front.weather] ?? 0xffffff, 1);
        fb.fillRoundedRect(x - r - 4, y + r - 4, 42, 12, 3);
        mapLayer.add(fb);
        mapLayer.add(this.add.text(x - r + 17, y + r + 2, FRONT_LABEL[front.weather] ?? front.weather, textStyle(10, '#101820')).setOrigin(0.5));
      }
      // A traversal obstacle (ideas W4): a round badge with its icon at the node's top-left.
      const obstacle = fog ? null : obstacleAt(stage, n.id);
      if (obstacle) {
        const col = Phaser.Display.Color.HexStringToColor(obstacle.color).color;
        const ob = this.add.graphics().setName('obstacle');
        ob.fillStyle(0x181818, 1).fillCircle(x - r + 2, y - r + 2, 13);
        ob.fillStyle(col, alpha).fillCircle(x - r + 2, y - r + 2, 11);
        mapLayer.add(ob);
        mapLayer.add(this.add.text(x - r + 2, y - r + 2, obstacle.icon, textStyle(14, '#101018', { stroke: '#ffffff', strokeThickness: 2 })).setOrigin(0.5).setAlpha(alpha));
      }
      if (n.row === 0) mapLayer.add(this.add.text(x, 84, String(n.column), textStyle(14, '#a69cb4')).setOrigin(0.5, 0));
      if (league && boss) mapLayer.add(this.add.text(x, y + r + 12, n.kind === 'champion' ? `★ ${boss.name} ★` : boss.name, textStyle(n.kind === 'champion' ? 17 : 15, n.kind === 'champion' ? '#ffe080' : COLORS.textLight)).setOrigin(0.5, 0));
      n.sides.forEach((side, i) => {
        const sx = x + NODE_RADIUS + 4 + i * 22;
        const sy = y - NODE_RADIUS - 2;
        const s = fog ? HIDDEN_STYLE : side.kind === 'expedition' && legendOf(side.expeditionId) ? LEGEND_STYLE : side.roamer ? ROAMER_STYLE : side.eventId === 'camp-checkpoint' ? CAMP_STYLE : side.kind === 'event' ? (stopIsHidden(content, run, n, side) ? HIDDEN_STYLE : stopStyle(content.events.get(side.eventId ?? '')?.stop)) : SIDE_STYLE[side.kind];
        const sg = this.add.graphics();
        sg.fillStyle(0x181818, side.used ? 0.3 : 1);
        sg.fillRect(sx - 11, sy - 11, 22, 22);
        sg.fillStyle(s.color, side.used ? 0.3 : 1);
        sg.fillRect(sx - 9, sy - 9, 18, 18);
        mapLayer.add(sg);
        mapLayer.add(this.add.text(sx, sy, s.glyph, textStyle(18, '#ffffff', { stroke: '#181818', strokeThickness: 3 })).setOrigin(0.5).setAlpha(side.used ? 0.4 : 1));
      });
      if (mapSkin?.labels && !fog) mapLayer.add(this.add.text(x, y + r * 0.95 + 9, KIND_STYLE[n.kind].label.split(' ')[0]!, textStyle(10, '#33475f')).setOrigin(0.5, 0));
      if (reachable && mapSkin?.cards) cardNodes.push(n);
      else if (reachable) {
        this.addOption({ kind: 'node', node: n }, () => this.ringCursor(mapLayer, x, y, r + (isBoss ? 8 : 10)), {
          x: x - scroll - NODE_RADIUS,
          y: y - NODE_RADIUS,
          w: NODE_RADIUS * 2,
          h: NODE_RADIUS * 2,
        });
      }
    }

    if (mapSkin?.cards) {
      // Next-Stop Cards: the node web gives way to big cards for the choices and a strip of what comes after.
      mapLayer.setVisible(false);
      const kindOf = (n: MapNode) => KIND_STYLE[n.kind];
      const rects = drawNextStop(this, {
        motion: this.motion,
        lines: [`Stage ${stage.index + 1}: ${theme.name}`, clockLabel(run), `₽${run.money} · Badges ${run.badges.length}`, `Level cap ${cap}`, `${leader.title} in ${Math.max(0, stage.map.columns - column)} stops`],
        cards: cardNodes.map((n) => ({
          title: kindOf(n).label,
          color: kindOf(n).color,
          glyph: kindOf(n).glyph,
          text: this.describe({ kind: 'node', node: n }).replace(/\n/g, '  ·  '),
          art: (sc, into, w, h) => {
            const boss = this.bossFor(n);
            if (boss) {
              const art = trainerVisual(sc, boss.spriteAssetId, boss.name, 0, h / 2, 1);
              if (art instanceof Phaser.GameObjects.Sprite) art.setScale(Math.min(1, h / art.height));
              into.add(art);
            } else if (n.kind === 'wild' && sc.textures.exists('ball.pb')) into.add(sc.add.image(0, 0, 'ball.pb').setScale(3));
            else into.add(sc.add.text(0, 0, kindOf(n).glyph, textStyle(44, '#ffffff', { stroke: '#181818', strokeThickness: 5 })).setOrigin(0.5));
          },
        })),
        ahead: [...new Set(stage.map.nodes.filter((m) => m.column > column + 1 || (m.column === column + 1 && !choiceIds.has(m.id))).sort((a, b) => a.column - b.column || a.row - b.row).map((m) => m.id))]
          .slice(0, 6)
          .map((id) => findNode(stage.map, id))
          .map((m) => (foggedAt(stage, seenColumn, m) ? { label: 'Fog', color: FOG_STYLE.color, glyph: '?' } : { label: kindOf(m).label.split(' ')[0]!, color: kindOf(m).color, glyph: kindOf(m).glyph })),
      });
      cardNodes.forEach((n, i) => this.addOption({ kind: 'node', node: n }, () => this.boxCursor(rects[i]!.x - 4, rects[i]!.y - 4, rects[i]!.w + 8, rects[i]!.h + 8), rects[i]!));
    }

    // ---------- bottom panel: info, side stops, party, bag ----------
    if (chrome) drawGlass(this, 8, 420, GAME_WIDTH - 16, 116, { tint: chrome.bottom.fill, rim: chrome.bottom.border, alpha: chrome.bottom.alpha, glow: false, radius: chrome.button.radius > 12 ? 18 : 8 });
    else drawPanel(this, 8, 420, GAME_WIDTH - 16, 116, { fill: COLORS.panelDark, border: COLORS.borderMuted, thin: true, alpha: 0.94 });
    mapSkin?.bar?.(this, { clock: clockLabel(run), money: run.money, cap });
    // Layout (spec 3): row one holds the party and eggs on the left and the buttons in whatever width is left;
    // row two is the info line and the notice. Nothing is placed over anything else.
    const slots = run.party.length + run.eggs.length;
    const step = Math.min(46, Math.floor(420 / Math.max(1, slots)));
    run.party.forEach((mon, i) => {
      const species = content.species.get(mon.speciesId)!;
      const x = 40 + i * step;
      pokemonIcon(this, species, x, 444, 1);
      this.add.text(x, 458, mon.hp <= 0 ? 'FNT' : `Lv${mon.level}`, textStyle(13, mon.hp <= 0 ? '#f08080' : bInk)).setOrigin(0.5, 0);
    });
    // Eggs ride along after the party, rocking gently; the soonest-to-hatch one wobbles hardest.
    run.eggs.forEach((egg, i) => {
      const x = 40 + (run.party.length + i) * step;
      if (this.textures.exists('pack.ebdx.egg')) {
        const icon = this.add.image(x, 446, 'pack.ebdx.egg').setScale(1.2).setOrigin(0.5, 0.8);
        if (eggRevealed(egg) && egg.tier !== 'ordinary') icon.setTint(Phaser.Display.Color.HexStringToColor(eggTier(egg.tier).color).color);
        this.tweens.add({ targets: icon, angle: { from: -4 - (egg.left <= 1 ? 8 : 0), to: 4 + (egg.left <= 1 ? 8 : 0) }, duration: egg.left <= 1 ? 260 : 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: i * 120 });
      }
      this.add.text(x, 458, `${egg.left}${egg.unit === 'battle' ? 'B' : 'S'}`, textStyle(13, '#fff2b0')).setOrigin(0.5, 0);
    });
    this.info = this.add.text(24, 480, '', textStyle(17, bInk, { wordWrap: { width: 580 } }));

    const buttons: { option: Option; label: string; color: number }[] = [];
    const currentNode = stage.current ? findNode(stage.map, stage.current) : null;
    for (const side of currentNode?.sides ?? []) {
      if (side.kind !== 'shop' && side.used && !(side.kind === 'service' && serviceReusable(side))) continue;
      buttons.push({ option: { kind: 'side', side }, label: side.kind === 'expedition' && legendOf(side.expeditionId) ? 'Legendary' : SIDE_LABEL[side.kind], color: side.kind === 'expedition' && legendOf(side.expeditionId) ? LEGEND_STYLE.color : side.kind === 'event' && !stopIsHidden(content, run, currentNode!, side) ? stopStyle(content.events.get(side.eventId ?? '')?.stop).color : SIDE_STYLE[side.kind].color });
    }
    if (boxCapacity(runPerks(content, services().session.run!)) > 0) buttons.push({ option: { kind: 'box' }, label: 'PC', color: COLORS.panel });
    buttons.push({ option: { kind: 'party' }, label: 'Party', color: COLORS.panel }, { option: { kind: 'bag' }, label: 'Bag', color: COLORS.panel }, { option: { kind: 'camp' }, label: 'Camp', color: COLORS.panel }, { option: { kind: 'bond' }, label: 'Bonds', color: COLORS.panel }, { option: { kind: 'scrapbook' }, label: 'Album', color: COLORS.panel }, { option: { kind: 'story' }, label: 'Story', color: COLORS.panel }, ...(services().session.run!.story.rivals.length > 0 ? [{ option: { kind: 'notebook' as const }, label: 'Rivals', color: COLORS.panel }] : []), ...(hasRelationships() ? [{ option: { kind: 'relationships' as const }, label: 'People', color: COLORS.panel }] : []), ...(hasJournal() ? [{ option: { kind: 'journal' as const }, label: 'Notes', color: COLORS.panel }] : []), { option: { kind: 'save' }, label: 'Save', color: COLORS.panel });
    if (wipeStatus(services().session.run!)) buttons.push({ option: { kind: 'endRun' }, label: 'End run', color: 0x6a2a38 });
    // Buttons share the width right of the party: one tall row when they fit, else two short rows.
    const areaX = 40 + slots * step + 4;
    const areaW = GAME_WIDTH - 24 - areaX;
    const n = buttons.length;
    const oneRow = areaW / n - 8 >= 84;
    const cols = oneRow ? n : Math.ceil(n / 2);
    const bw = Math.min(100, Math.floor(areaW / cols) - 8);
    const bh = oneRow ? 44 : 22;
    buttons.forEach((b, i) => {
      const bxPos = GAME_WIDTH - 24 - (cols - (i % cols)) * (bw + 8) + 8;
      const byPos = 428 + (oneRow ? 0 : Math.floor(i / cols) * (bh + 4));
      drawGlass(this, bxPos, byPos, bw, bh, { tint: b.color === COLORS.panel ? (chrome?.button.tint ?? AERO.glass) : mixColor(b.color, 0x000000, 0.25), rim: b.color === COLORS.panel ? (chrome?.button.rim ?? AERO.rim) : mixColor(b.color, 0xffffff, 0.45), radius: chrome ? (oneRow ? chrome.button.radius : Math.min(chrome.button.radius, 11)) : oneRow ? 16 : 9, alpha: chrome?.button.alpha ?? 0.95 });
      const label = this.add.text(bxPos + bw / 2, byPos + bh / 2, b.label, textStyle(oneRow && b.label.length <= 6 && bw >= 92 ? 22 : 16, b.color === COLORS.panel ? (chrome?.button.ink ?? '#ffffff') : '#ffffff')).setOrigin(0.5);
      fitLine(label, bw - 12);
      this.addOption(b.option, () => this.boxCursor(bxPos, byPos, bw, bh), { x: bxPos, y: byPos, w: bw, h: bh });
    });

    // Without a notice, the corner shows the map items that are working (Repel ×2 · Black Flute...).
    const riding = run.moveMode ? mapActions(content, run).find((a) => a.on) : undefined;
    const working = [riding ? `Riding the ${content.catalog.get(riding.itemId)!.name}` : '', mapItemSummary(content, run)].filter(Boolean).join(' · ');
    this.notice = this.add
      .text(GAME_WIDTH - 24, 482, data.notice ?? wealthTaxNotice(run) ?? (working ? `Working: ${working}` : newsLine(content, run)), textStyle(15, chrome?.bottom.sub ?? '#f0e0a0', { align: 'right', wordWrap: { width: 300 } }))
      .setOrigin(1, 0);
    fitBlock(this.notice, 300, 48);
    this.focus(Math.min(data.focus ?? 0, this.options.length - 1), false);
    showAchievementToasts(this, session.takeAchievementToasts(), this.motion);

    onInputAction(this, (action) => {
      if (this.legend) {
        if (action === 'back' || action === 'confirm') this.toggleLegend();
        return;
      }
      if (this.picker) {
        this.picker.handle(action);
        return;
      }
      if (this.busy) return;
      const n = this.options.length;
      if (action === 'up' || action === 'left') this.focus((this.index - 1 + n) % n);
      if (action === 'down' || action === 'right') this.focus((this.index + 1) % n);
      if (action === 'confirm') this.activate(this.index);
    });

    // Party scenes: what the team did on the way here (a conversation, a gathering, a huddle before a boss).
    const partyScene = stage.current !== null ? session.ensureScene() : null;
    if (partyScene) {
      this.time.delayedCall(350, () => {
        if (this.picker) return;
        openPartyScene(this.fieldHost(), partyScene, (lines) => this.scene.restart({ notice: lines.join(' '), focus: this.index }));
      });
    }

    // Ideas W4: Legend (L) explains every icon on the map.
    this.input.keyboard?.on('keydown-L', () => this.toggleLegend());
    const legendTag = this.add.text(GAME_WIDTH - 24, 402, 'L: map legend', textStyle(12, '#a69cb4')).setOrigin(1, 0).setInteractive({ useHandCursor: true }).setName('legend-tag');
    legendTag.on('pointerdown', () => this.toggleLegend());
    // A run continued from a save (ideas W4): a gentle welcome back, and the map glides to where you stand.
    if (session.takeResumed() && !data.notice) {
      const target = mapLayer.x;
      if (this.motion === 'full' && target < 0) {
        mapLayer.x = 0;
        this.tweens.add({ targets: mapLayer, x: target, duration: 900, delay: 200, ease: 'Cubic.easeInOut' });
      }
      this.showBanner('Welcome back', league ? `${region.name} League` : `Stage ${stage.index + 1}`, `Resumed at ${league ? 'battle' : 'level'} ${Math.max(1, column)} of ${stage.map.columns}  ·  Day ${run.clock.day}  ·  Your run was saved here`);
    } else if (stage.current === null && !data.notice) {
      const regions = run.regionOrder.length;
      if (league) {
        const size = getCampaign(content, run.campaignId).eliteFourSize;
        this.showBanner(region.name, 'Pokémon League', `Elite Four ×${size}, then ${leader.title}  ·  Healed after every battle`);
      } else if (stage.index === 0) {
        this.showBanner(`Region ${run.regionIndex + 1} of ${regions}  ·  ${identity.motif}`, region.name, `${region.tagline ? `${region.tagline}  ·  ` : ''}Level cap ${cap}  ·  Stage 1: ${blindMap(run.rules) ? '???' : theme.name}  ·  ${leader.title}`);
      } else {
        this.showBanner(`Stage ${stage.index + 1}`, blindMap(run.rules) ? '???' : theme.name, `${blindMap(run.rules) ? 'Blind Research' : theme.types.map((t) => t.toUpperCase()).join(' / ')}  ·  ${leader.title}`, run.stagePlan?.lines ?? []);
      }
    }
  }

  /** The gym leader, Elite Four member or champion waiting at a node (null for other nodes). */
  private bossFor(n: MapNode) {
    const { session } = services();
    const stage = session.run!.stage!;
    if (n.kind === 'gym') return bossInfo(session.content, 'gym', stage.leaderId);
    if (n.kind === 'champion') return bossInfo(session.content, 'champion', stage.leaderId);
    const id = n.kind === 'elite' ? stage.eliteFour[n.column - 1] : undefined;
    return id ? bossInfo(session.content, 'elite', id) : null;
  }

  /**
   * The travelling highlight: a glowing token hops from where you stand to the chosen node.
   * Presentation only (the choice is already made). Returns how long to wait before leaving.
   */
  private travel(node: MapNode): number {
    const layer = this.mapLayer;
    const to = this.nodePos.get(node.id);
    if (this.motion !== 'full' || !layer || !to) return 0;
    const stage = services().session.run!.stage!;
    const from = (stage.current && this.nodePos.get(stage.current)) || { x: to.x - this.colSpacing, y: to.y };
    const orb = this.add.circle(from.x, from.y, 9, AERO.white, 1).setBlendMode('ADD');
    const aura = this.add.circle(from.x, from.y, 16, AERO.rim, 0.45).setBlendMode('ADD');
    layer.add([aura, orb]);
    const hop = { t: 0 };
    this.tweens.add({
      targets: hop,
      t: 1,
      duration: 380,
      ease: 'Sine.easeInOut',
      onUpdate: () => {
        const x = from.x + (to.x - from.x) * hop.t;
        const y = from.y + (to.y - from.y) * hop.t - Math.sin(hop.t * Math.PI) * 34;
        orb.setPosition(x, y);
        aura.setPosition(x, y);
      },
      onComplete: () => {
        const ring = this.add.circle(to.x, to.y, NODE_RADIUS, AERO.rim, 0).setStrokeStyle(4, AERO.white, 1);
        layer.add(ring);
        this.tweens.add({ targets: ring, scale: 1.8, alpha: 0, duration: 260, ease: 'Quad.easeOut' });
      },
    });
    return 420;
  }

  /** Your lead Pokémon walks beside the current stop; a small bonded friend rides on its back and it dozes off when you idle (W2 I9, I20, F57). Presentation only. */
  private addFollower(layer: Phaser.GameObjects.Container, x: number, y: number, r: number): void {
    const { session } = services();
    const run = session.run!;
    const lead = run.party.find((m) => m.hp > 0);
    const species = lead && session.content.species.get(lead.speciesId);
    if (!lead || !species) return;
    const fx = x - r - 20;
    const icon = pokemonIcon(this, species, fx, y + 4, 1.1) as Phaser.GameObjects.Sprite;
    layer.add(icon);
    const rider = run.party.find((m) => m.uid !== lead.uid && m.hp > 0 && (session.content.species.get(m.speciesId)?.weight ?? 99) <= PIGGYBACK_WEIGHT && bondOf(run, m.uid).affection >= PIGGYBACK_AFFECTION);
    const riderSpecies = rider && session.content.species.get(rider.speciesId);
    const riderIcon = riderSpecies ? (pokemonIcon(this, riderSpecies, fx, y - 14, 0.7) as Phaser.GameObjects.Sprite) : null;
    if (riderIcon) layer.add(riderIcon);
    if (this.motion === 'off') return;
    const bob = [icon, ...(riderIcon ? [riderIcon] : [])];
    this.tweens.add({ targets: bob, y: '-=3', duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    // After a while with no input the lead nods off with a floating "z".
    const zzz = this.add.text(fx + 12, y - 16, 'z', textStyle(16, '#e8f6ff', { stroke: '#0b2a4a', strokeThickness: 3 })).setAlpha(0);
    layer.add(zzz);
    this.time.delayedCall(IDLE_NAP_MS, () => {
      if (!zzz.active) return;
      icon.setAlpha(0.8);
      this.tweens.add({ targets: zzz, alpha: 1, y: '-=18', duration: 1400, repeat: -1, ease: 'Sine.easeOut' });
    });
    this.input.once('pointermove', () => zzz.active && (zzz.destroy(), icon.setAlpha(1)));
    this.input.keyboard?.once('keydown', () => zzz.active && (zzz.destroy(), icon.setAlpha(1)));
  }

  private addOption(option: Option, makeCursor: () => Phaser.GameObjects.Graphics, hit: { x: number; y: number; w: number; h: number }): void {
    const index = this.options.length;
    this.options.push(option);
    this.cursors.push(makeCursor());
    const zone = this.add.zone(hit.x, hit.y, hit.w, hit.h).setOrigin(0).setInteractive({ useHandCursor: true });
    zone.on('pointerover', () => !this.picker && !this.busy && this.focus(index));
    zone.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (p.rightButtonDown()) return this.pingNode(index, hit);
      if (this.picker || this.busy) return;
      this.focus(index);
      this.activate(index);
    });
  }

  /** Mini-map ping (I473): right-click a stop to mark it with an icon (flag, star, warning, question), again to change, then clear. Presentation only. */
  private pings = new Map<number, { at: number; text: Phaser.GameObjects.Text }>();
  private pingNode(index: number, hit: { x: number; y: number; w: number; h: number }): void {
    const icons = PING_ICONS;
    const prev = this.pings.get(index);
    const next = (prev?.at ?? -1) + 1;
    prev?.text.destroy();
    if (next >= icons.length) {
      this.pings.delete(index);
      return;
    }
    const text = this.add.text(hit.x + hit.w / 2, hit.y - 6, icons[next]!, textStyle(24, '#ffe9a8')).setOrigin(0.5, 1).setDepth(500).setName('node-ping');
    this.tweens.add({ targets: text, y: text.y - 6, yoyo: true, repeat: 2, duration: 160, ease: 'Sine.easeOut' });
    this.pings.set(index, { at: next, text });
  }

  private ringCursor(layer: Phaser.GameObjects.Container, x: number, y: number, r: number): Phaser.GameObjects.Graphics {
    const g = this.add.graphics({ x, y }).setData('home', { x, y });
    g.lineStyle(10, AERO.rim, 0.3);
    g.strokeCircle(0, 0, r + 2);
    g.lineStyle(4, AERO.white, 1);
    g.strokeCircle(0, 0, r);
    layer.add(g);
    if (this.motion === 'full') this.tweens.add({ targets: g, scale: 1.1, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    return g;
  }

  private boxCursor(x: number, y: number, w: number, h: number): Phaser.GameObjects.Graphics {
    return focusFrame(this, x, y, w, h);
  }

  private describe(option: Option): string {
    const content = services().session.content;
    switch (option.kind) {
      case 'node': {
        const n = option.node;
        const runNow = services().session.run!;
        if (isFogged(content, runNow, n)) return `Level ${n.column}: lost in fog. You see ${sightRange(content, runNow)} columns ahead; Intelligence, a keen-eyed or Flying Pokémon and scouting see further.`;
        const frontHere = frontAt(content, runNow, n);
        const frontNote = frontHere ? `${FRONT_LABEL[frontHere.weather] ?? frontHere.weather} front: battles here start in ${frontHere.weather}.\n` : '';
        const crossing = crossingHint(content, runNow, n);
        const crossNote = crossing ? `Obstacle: ${crossing}\n` : '';
        const boss = this.bossFor(n);
        const types = boss && boss.types.length > 0 && n.kind !== 'gym' ? ` (${boss.types.join('/')})` : '';
        const named = n.name ? `"${n.name}"  ·  ` : '';
        const kind = boss ? `${boss.title}${types}` : KIND_STYLE[n.kind].label;
        const risk = n.harder ? '  ·  Risk: high (better rewards)' : boss ? '  ·  Risk: boss' : '';
        const sides = n.sides.map((s) => (s.kind === 'heal' ? 'healing spot' : s.kind === 'fish' ? 'fishing spot' : s.kind === 'raid' ? 'raid den' : s.kind === 'totem' ? 'Totem territory' : s.kind === 'expedition' ? 'expedition gate' : s.kind === 'service' ? (SERVICES.services.find((x) => x.id === s.serviceId)?.name ?? 'service') : s.kind === 'event' ? (stopIsHidden(content, services().session.run!, n, s) ? 'mystery "?" stop' : `${content.events.get(s.eventId ?? '')?.name ?? 'event'} stop`) : s.kind === 'plaza' ? 'Trainer Plaza' : 'shop'));
        const seen = this.previewText(n) || this.omens[n.id]?.text || (n.kind === 'wild' ? `Habitat: likely ${habitatList(services().session.content, services().session.run!).join(', ')}` : '');
        const route = routeKind(services().session.run!, n);
        const storyStops = (n.storyStops ?? []).map((id) => runNow.story.v2?.blueprint?.stops.find((x) => x.id === id)).filter((x) => !!x && !runNow.story.v2!.stops.done.includes(x.id));
        const storyNote = storyStops.length ? `\n★ Story Stop: ${storyStops.map((x) => x!.category).join(', ')}` : '';
        const anomaly = stageAnomaly(services().session.content, services().session.run!);
        return `${named}${frontNote}${crossNote}${anomaly ? `${anomalyLine(anomaly)}\n` : ''}${route ? `[${ROUTE_LABELS[route]}]\n` : ''}${n.kind === 'elite' || n.kind === 'champion' ? 'Battle' : 'Level'} ${n.column}: ${kind}${risk}${sides.length ? `  ·  Has a ${sides.join(' and ')}` : ''}${storyNote}${seen ? `\n${seen}` : ''}`;
      }
      case 'side':
        if (option.side.kind === 'plaza') return 'Trainer Plaza: the middle of the stage. Stalls, traders, a Battle Club, errands and gossip. Rest, shop and plan before you go on.';
        if (option.side.kind === 'service') {
          const def = SERVICES.services.find((x) => x.id === option.side.serviceId);
          return `${def?.name ?? 'Service'}: ${def?.blurb ?? ''}`;
        }
        if (option.side.kind === 'expedition' && legendOf(option.side.expeditionId)) return option.side.used ? 'Legendary event: already visited.' : `Legendary event: ${legendOf(option.side.expeditionId)!.legendary!.omen} Temporary: it is gone when you leave this stage.`;
        if (option.side.kind === 'expedition') return option.side.used ? 'Expedition gate: already used.' : 'Expedition gate: a branching adventure with its own party rules. Loot is kept when you extract. You never lose your own Pokémon.';
        if (option.side.kind === 'totem') return option.side.used ? 'Totem territory: already fought.' : 'Totem territory: a guardian with an aura, allies and phases. Losing never ends your run.';
        if (option.side.kind === 'raid') return option.side.used ? 'Raid den: already fought.' : 'Raid den: a boss with shields and phases. See its tier and rewards before you commit.';
        if (option.side.kind === 'fish') return 'Fishing spot: pick a Water Pokémon to battle and catch (once, no reward draft).';
        if (option.side.kind === 'event') {
          const e = content.events.get(option.side.eventId ?? '');
          return `${e?.name ?? 'Event'}: ${e?.intro ?? ''}`;
        }
        return option.side.kind === 'heal' ? 'Healing spot: fully heals your party and restores PP (once).' : 'Shop: buy Poké Balls and medicine with your money.';
      case 'party':
        return ['Your Pokémon: rearrange the party, make one lead, and read stats, moves, held items, bonds and history.', ...services().session.run!.eggs.map((e) => `${eggLabel(e)}.`)].join(' ');
      case 'bag':
        return 'Everything you own in one place: medicine, balls, held items (and who holds them), passive items and map items.';
      case 'camp':
        return 'Camp: gadgets, cooking pot, bench and forge, market, wishing well, time capsule and more.';
      case 'bond':
        return 'See how each Pokémon feels about you: trust, affection, sync and more, plus its personality and friendships.';
      case 'scrapbook':
        return 'Your team scrapbook: photos and small moments from the road. Take a team photo here.';
      case 'notebook':
        return 'Rival Notebook: what each rival has learned about you this run.';
      case 'story':
        return `Read the story of your run so far, with the feelings each moment left. People call you ${protagonistTitle(services().session.run!).name}.`;
      case 'journal':
        return 'Field Notebook: your route so far, the story arcs you are in and the scenes you have seen.';
      case 'relationships':
        return 'The people you have met in this story: how they feel about you and what they remember.';
      case 'save':
        return 'Save the run, or save and leave: Save & Quit goes to the title, Save & go back to Hub visits the Hub. Continue resumes the run.';
      case 'endRun':
        return 'Give up this Adventure run. Press it twice to confirm; what you earned so far still counts.';
      case 'box':
        return 'Store spare Pokémon in the PC, or bring them back into the party.';
    }
  }

  private focus(i: number, sound = true): void {
    if (i < 0) return;
    if (sound && i !== this.index) playSfx(this, 'ui.cursor', 0.5);
    const from = this.cursors[this.index];
    this.index = i;
    this.cursors.forEach((c, n) => c.setVisible(n === i));
    // Wii-style (spec §24): the node ring glides over from the node it left instead of jumping.
    const to = this.cursors[i];
    const home = to?.getData('home') as { x: number; y: number } | undefined;
    const tm = uiTiming('cursor');
    if (to && home && from && from !== to && from.getData('home') && sound && tm.ms) {
      (to.getData('glide') as Phaser.Tweens.Tween | undefined)?.stop();
      to.setPosition(from.x, from.y);
      to.setData('glide', this.tweens.add({ targets: to, x: home.x, y: home.y, duration: tm.ms * 1.3, ease: tm.bounce ? 'Back.easeOut' : tm.ease }));
    } else if (to && home) to.setPosition(home.x, home.y);
    const option = this.options[i];
    if (option && this.info) fitBlock(this.info, 580, 52, this.describe(option).replace(/\n/g, '  ·  '));
  }

  private fieldHost(): FieldMenuHost {
    return {
      scene: this,
      setPicker: (p) => (this.picker = p),
      changed: (notice) => this.scene.restart({ notice, focus: this.index }),
      mapItems: { rows: () => this.itemRows(), use: (row) => this.useMapItem(row.action as MapActionKind) },
    };
  }

  private activate(i: number): void {
    const option = this.options[i];
    if (!option) return;
    const { session } = services();
    switch (option.kind) {
      case 'node': {
        this.busy = true;
        playSfx(this, 'ui.select');
        const repelled = option.node.kind === 'wild' && repelActive(session.content, session.run!);
        let run: ReturnType<typeof session.chooseNode>;
        try {
          run = session.chooseNode(option.node.id);
        } catch (err) {
          // Beta 4.4 "battles won't load": a failed start used to leave the map frozen (busy) with no word why.
          console.error('Could not start that stop', err);
          this.scene.restart({ notice: 'That stop could not start. Try again, or pick another route.', focus: i });
          break;
        }
        if (repelled && run.phase === 'map') {
          this.scene.restart({ notice: 'The Repel kept wild Pokémon away!', focus: 0 });
          break;
        }
        // The Circuit's Fork Gate stops the walk at the gym door: the player has not moved yet.
        let delay = run.phase === 'decision' && run.pending[0]?.kind === 'circuit' ? 0 : this.travel(option.node);
        // An obstacle crossed (or gone round) on the way: say what happened before the battle (ideas W4).
        if (session.lastCrossing) {
          if (this.notice) fitBlock(this.notice, 300, 48, session.lastCrossing);
          if (this.info) fitBlock(this.info, 580, 52, session.lastCrossing);
          delay += 1400;
        }
        this.time.delayedCall(delay, () => this.cameras.main.fadeOut(250));
        this.time.delayedCall(delay + 260, () => (session.storyScene() ? this.scene.start('Story', { next: sceneForRun(run) }) : this.scene.start(sceneForRun(run))));
        break;
      }
      case 'side': {
        const cut = session.rivalChallenge(option.side.id);
        if (cut) {
          this.busy = true;
          playSfx(this, 'ui.select');
          this.cameras.main.fadeOut(250);
          this.time.delayedCall(260, () => this.scene.start(sceneForRun(cut)));
          break;
        }
        if (option.side.kind === 'fish') {
          this.openFishing(option.side.id);
          break;
        }
        if (option.side.kind === 'raid') {
          if (!option.side.used) this.openRaid(option.side.id);
          break;
        }
        if (option.side.kind === 'totem') {
          if (!option.side.used) this.openTotem(option.side.id);
          break;
        }
        if (option.side.kind === 'event') {
          this.busy = true;
          this.cameras.main.fadeOut(220);
          const sideId = option.side.id;
          this.time.delayedCall(230, () => this.scene.start('Event', { sideId }));
          break;
        }
        if (option.side.kind === 'expedition') {
          if (!option.side.used) this.openExpedition(option.side.id);
          break;
        }
        if (option.side.kind === 'service') {
          this.openService(option.side.id);
          break;
        }
        if (option.side.kind === 'plaza') {
          this.openPlaza(option.side.id);
          break;
        }
        if (option.side.kind === 'minigame') {
          if (!option.side.used) this.openMinigame(option.side.id);
          break;
        }
        const message = session.visitSide(option.side.id);
        if (option.side.kind === 'heal') {
          playSfxLazy(this, 'me.heal');
          this.busy = true;
          this.healFx(() => this.scene.restart({ notice: message, focus: 0 }));
        } else {
          this.busy = true;
          this.scene.start(sceneForRun(session.run!));
        }
        break;
      }
      case 'party':
        openPokemonMenu(this.fieldHost());
        break;
      case 'bag':
        openBagMenu(this.fieldHost());
        break;
      case 'camp':
        openCampMenu(this.fieldHost());
        break;
      case 'bond':
        openBondMenu(this.fieldHost());
        break;
      case 'scrapbook':
        openScrapbook(this.fieldHost());
        break;
      case 'story':
        openStoryMenu(this.fieldHost());
        break;
      case 'relationships':
        openRelationshipsMenu(this.fieldHost());
        break;
      case 'journal':
        openJournalMenu(this.fieldHost());
        break;
      case 'notebook':
        openRivalNotebook(this.fieldHost());
        break;
      case 'box':
        openBoxMenu(this.fieldHost());
        break;
      case 'save':
        openSaveMenu(this.fieldHost(), (to) => {
          this.busy = true;
          this.scene.start(to);
        });
        break;
      case 'endRun':
        if (!this.endArmed) {
          this.endArmed = true;
          if (this.notice) fitBlock(this.notice, 300, 48, 'Press End run again to end this Adventure run.');
          break;
        }
        services().session.endRunEarly();
        this.scene.start('GameOver');
        break;
    }
  }

  /**
   * A small preview beside a node: the wild Pokémon with its level (Devon Scope),
   * the trainer's lead and team size (Town Map), or the gym team (Rule Book, Orange Mail)
   * in a little grid. It sits to the lower right, clear of the cursor ring and the paths.
   */
  private drawPreview(layer: Phaser.GameObjects.Container, n: MapNode, x: number, y: number, r: number): void {
    const preview = this.previews[n.id];
    if (!preview) return;
    const content = services().session.content;
    const label = (lx: number, ly: number, text: string) =>
      layer.add(this.add.text(lx, ly, text, textStyle(13, '#f0e0a0', { stroke: '#181818', strokeThickness: 3 })).setOrigin(0.5, 0));
    if (n.kind === 'gym') {
      // Up to six icons, two columns of three, to the right of the gym leader.
      const team = preview.team.slice(0, 6);
      const rows = Math.min(3, team.length);
      team.forEach((m, i) => {
        const species = content.species.get(m.speciesId);
        if (species) layer.add(pokemonIcon(this, species, x + r + 18 + Math.floor(i / 3) * 30, y + (i % 3 - (rows - 1) / 2) * 30, 0.9));
      });
      return;
    }
    const first = preview.team[0];
    const species = first ? content.species.get(first.speciesId) : undefined;
    if (!first || !species) return;
    const px = x + r + 18;
    layer.add(pokemonIcon(this, species, px, y + 4, 1.2));
    if (n.kind !== 'wild') label(px, y + 24, `×${preview.team.length}`);
  }

  /** The preview of a node in words, for the info line. */
  private previewText(n: MapNode, withLevels = false): string {
    const preview = this.previews[n.id];
    if (!preview) return '';
    const content = services().session.content;
    const item = preview.source;
    const names = preview.team.map((m) => `${content.species.get(m.speciesId)?.name ?? m.speciesId}${withLevels && m.level ? ` Lv${m.level}` : ''}`).join(', ');
    if (n.kind === 'gym') return `${item}: ${preview.team.length === 1 ? 'the ace is' : 'the team is'} ${names}`;
    return `${item}: ${preview.trainerName ? `${preview.trainerName} with ` : ''}${names}`;
  }

  /** Rows of the map Items menu: items to use, then what the Fame Checker and gym previews show. */
  private itemRows(): { action: MapActionKind | null; itemId: string; title: string; text: string; problem: string | null }[] {
    const { session } = services();
    const run = session.run!;
    const content = session.content;
    const rows: { action: MapActionKind | null; itemId: string; title: string; text: string; problem: string | null }[] = mapActions(content, run).map((a) => ({
      action: a.kind,
      itemId: a.itemId,
      title: `${content.catalog.get(a.itemId)!.name}${a.on ? ' (riding)' : ''}`,
      text: a.on ? 'Choose it again to get off.' : a.text,
      problem: a.on ? null : a.problem,
    }));
    const leaders = nextGymLeaders(content, run);
    if (leaders.length > 0) {
      const text = leaders.map((l) => `${bossInfo(content, 'gym', l.leaderId).name} (${l.types.map((t) => t.toUpperCase()).join('/')})`).join(', ');
      rows.push({ action: null, itemId: 'fame-checker', title: 'Fame Checker', text: `Gym leaders still in this region: ${text}`, problem: `Gym leaders still in this region: ${text}` });
    }
    if (run.stage?.map.nodes.some((n) => n.kind === 'gym')) {
      const text = `Gym leader reward draft: ${bossLootPreview(content, run).map((l) => `${l.rarity} ${l.percent}%`).join(', ')}`;
      rows.push({ action: null, itemId: 'loot-preview', title: 'Loot Preview', text, problem: text });
    }
    const plan = run.stagePlan?.lines ?? [];
    if (plan.length > 0) rows.push({ action: null, itemId: '', title: 'Route plan', text: plan.join(' '), problem: plan.join(' ') });
    const licenseText = licenseNote(content, run);
    if (licenseText) rows.push({ action: null, itemId: '', title: `${run.prep.license ? 'Field License' : 'Intel'}: ${licenseName(fieldHintId(content, run)!)}`, text: licenseText, problem: licenseText });
    const gym = run.stage!.map.nodes.find((n) => n.kind === 'gym');
    const gymText = gym ? this.previewText(gym, true) : '';
    if (gym && gymText) {
      const { itemId, source } = this.previews[gym.id]!;
      const text = `Gym leader ${bossInfo(content, 'gym', run.stage!.leaderId).name}: ${gymText.slice(gymText.indexOf(':') + 2)}`;
      rows.push({ action: null, itemId: itemId ?? '', title: source, text, problem: text });
    }
    return rows;
  }

  /** A minigame stop: shows the rules and the attempts left, and the pick of a difficulty starts the game. */
  private openMinigame(sideId: string): void {
    const { session } = services();
    const pv = minigamePreview(session.content, session.run!, sideId);
    const picker: Picker = new Picker(this, {
      title: `${pv.name} - ${pv.attemptsLeft} attempt${pv.attemptsLeft === 1 ? '' : 's'} left`,
      columns: 1,
      rowHeight: 120,
      rows: pv.tiers.map((t) => ({
        problem: pv.attemptsLeft > 0 ? null : 'No attempts left',
        hint: `${pv.instructions} ${pv.scoring}`,
        draw: (scene, box, w) => {
          box.add(scene.add.text(16, 8, `${pv.name}  ·  ${t.label}`, textStyle(22)));
          box.add(scene.add.text(16, 40, `${pv.instructions} ${pv.scoring}`, textStyle(15, '#ffd0a0', { wordWrap: { width: w - 32 } })));
          box.add(scene.add.text(16, 92, `${pv.medals}  ·  Best: ${pv.best}`, textStyle(14, '#a0d0ff', { wordWrap: { width: w - 32 } })));
        },
      })),
      onSelect: (i) => {
        picker.close();
        this.picker = null;
        this.busy = true;
        playSfx(this, 'ui.select');
        const run = session.beginMinigame(sideId, i);
        this.cameras.main.fadeOut(250);
        this.time.delayedCall(260, () => this.scene.start(sceneForRun(run)));
      },
      onBack: () => {
        picker.close();
        this.picker = null;
      },
    });
    this.picker = picker;
  }

  /** An expedition gate: shows the briefing (party rules, route length, finale, rewards), then asks to commit. */
  private openExpedition(sideId: string): void {
    const { session } = services();
    const pv = expeditionPreview(session.content, session.run!, sideId);
    const picker: Picker = new Picker(this, {
      glass: true,
      title: pv.legendary ? `Legendary Event - ${pv.legendary.epithet}` : `Expedition - Tier ${pv.tier}: ${pv.name}`,
      columns: 1,
      rowHeight: 190,
      rows: [
        {
          problem: null,
          hint: pv.legendary ? `${pv.legendary.omen} ${pv.legendary.lore.join(' ')} ${pv.legendary.temporaryNote} Stage: ${pv.legendary.stage.join(' ')} ${pv.legendary.modifiers.join('; ')}. Finale: ${pv.finale}. Rewards: ${pv.rewards.join(', ')}. You are never forced to enter.` : `${pv.blurb} ${pv.partyText} ${pv.nodes}. Finale: ${pv.finale}. Rewards: ${pv.rewards.join(', ')}. ${pv.rules.join(' ')}`,
          draw: (scene, box, w) => {
            box.add(scene.add.text(16, 8, pv.legendary ? `LEGENDARY EVENT  ·  ${pv.name}  ·  ${pv.nodes}` : `${pv.name}  ·  ${pv.nodes}  ·  ${pv.partyMode} party`, textStyle(pv.legendary ? 20 : 22, pv.legendary?.accent)));
            box.add(scene.add.text(16, 42, pv.legendary ? `${pv.legendary.omen} ${pv.legendary.lore[0]}` : `${pv.blurb} ${pv.partyText}`, textStyle(16, '#ffd0a0', { wordWrap: { width: w - 32 } })));
            box.add(scene.add.text(16, 96, `Finale: ${pv.finale}`, textStyle(16, '#a0d0ff', { wordWrap: { width: w - 32 } })));
            box.add(scene.add.text(16, 124, `Rewards: ${pv.rewards.join(' · ')}`, textStyle(16, '#c0f0c0', { wordWrap: { width: w - 32 } })));
            box.add(scene.add.text(16, 152, pv.legendary ? `${pv.legendary.temporaryNote} ${pv.legendary.stage.join(' ')}` : pv.rules.join(' '), textStyle(14, '#d8d0e0', { wordWrap: { width: w - 32 } })));
          },
        },
      ],
      onSelect: () => {
        picker.close();
        this.picker = null;
        this.busy = true;
        playSfx(this, 'ui.select');
        const run = session.beginExpedition(sideId);
        this.cameras.main.fadeOut(250);
        this.time.delayedCall(260, () => this.scene.start(sceneForRun(run)));
      },
      onBack: () => {
        picker.close();
        this.picker = null;
      },
    });
    this.picker = picker;
  }

  /** Totem territory: shows the Totem, its aura, ally and rewards, then asks to commit. */
  private openTotem(sideId: string): void {
    const { session } = services();
    const content = session.content;
    const pv = totemPreview(content, session.run!, sideId);
    const species = content.species.get(pv.speciesId)!;
    // Screens redesign: the Ink Ruler look draws the totem card like its mock-up.
    const totemLook = screenStyleOf('totem', session.settings.screenStyles, `${session.run!.seed}:${sideId}`);
    if (totemLook !== 'original') {
      const leave = (): void => {
        this.picker?.close();
        this.picker = null;
      };
      this.picker = new StopCard(this, totemLook as StopLook, {
        kicker: 'TOTEM',
        title: `${pv.name} · ${pv.tier}`,
        species,
        level: pv.level,
        info: [`Aura: ${pv.aura}${pv.environment ? ` ${pv.environment}` : ''}`, pv.ally ? `Ally calls: ${pv.ally}` : 'No allies.', `Rewards: ${pv.rewards.join(' · ')}`],
        options: [{ label: 'Face the Totem', detail: `${pv.blurb} Losing never ends your run.`, problem: null }],
      }, session.settings.battleAnimations, {
        onSelect: () => {
          leave();
          this.busy = true;
          playSfx(this, 'ui.select');
          const run = session.enterTotem(sideId);
          this.cameras.main.fadeOut(250);
          this.time.delayedCall(260, () => this.scene.start(sceneForRun(run)));
        },
        onBack: leave,
      });
      return;
    }
    const picker: Picker = new Picker(this, {
      glass: true,
      title: `Totem - ${pv.name}`,
      columns: 1,
      rowHeight: 170,
      rows: [
        {
          ...speciesRow(species),
          problem: null,
          hint: `${pv.blurb} Aura: ${pv.aura}${pv.environment ? ` ${pv.environment}` : ''}${pv.ally ? ` Ally: ${pv.ally}.` : ''} Rewards: ${pv.rewards.join(', ')}. Losing never ends your run.`,
          draw: (scene, box, w) => {
            if (scene.textures.exists('ui.raid.den_entry')) box.add(scene.add.image(0, 0, 'ui.raid.den_entry').setOrigin(0).setDisplaySize(w, 150).setAlpha(0.35));
            box.add(scene.add.text(16, 8, `${species.name}  Lv${pv.level}   ·   ${pv.tier} Totem   ·   ${pv.phases} phase${pv.phases === 1 ? '' : 's'}`, textStyle(22)));
            box.add(scene.add.text(16, 42, `Aura: ${pv.aura}${pv.environment ? `  ${pv.environment}` : ''}`, textStyle(16, '#ffd0a0', { wordWrap: { width: w - 32 } })));
            box.add(scene.add.text(16, 88, pv.ally ? `Ally calls: ${pv.ally}` : 'No allies.', textStyle(16, '#a0d0ff', { wordWrap: { width: w - 32 } })));
            box.add(scene.add.text(16, 128, `Rewards: ${pv.rewards.join(' · ')}`, textStyle(16, '#c0f0c0', { wordWrap: { width: w - 32 } })));
          },
        },
      ],
      onSelect: () => {
        picker.close();
        this.picker = null;
        this.busy = true;
        playSfx(this, 'ui.select');
        const run = session.enterTotem(sideId);
        this.cameras.main.fadeOut(250);
        this.time.delayedCall(260, () => this.scene.start(sceneForRun(run)));
      },
      onBack: () => {
        picker.close();
        this.picker = null;
      },
    });
    this.picker = picker;
  }

  /** A raid den: shows the boss, its tier, mechanics and rewards, then asks to commit. */
  private openRaid(sideId: string): void {
    const { session } = services();
    const content = session.content;
    const pv = raidPreview(content, session.run!, sideId);
    const species = content.species.get(pv.speciesId)!;
    const money = session.run!.money;
    // Regional and rival raids offer approaches (one row each); other raids are a single "fight" row.
    const choices = pv.approaches.length > 0 ? [...pv.approaches] : [{ id: '', label: '', text: '', cost: 0, leave: false }];
    // S400 Boss Training Mode: a free practice fight (cost nets out the entry price shown on the other rows).
    if (!pv.noPractice) choices.push({ id: 'practice', label: 'PRACTICE', text: 'No stakes: no cost, no rewards, nothing lost. Your team is restored afterwards.', cost: -pv.entryCost, leave: false });
    const kindName = { wild: 'Raid', regional: 'Regional Raid', rival: 'Rival Raid', anomaly: 'Anomaly Raid' }[pv.kind];
    // Screens redesign: a picked raid look draws the boss card the way its mock-up does.
    const raidLook = screenStyleOf('raid', session.settings.screenStyles, `${session.run!.seed}:${sideId}`);
    if (raidLook !== 'original') {
      const leave = (): void => {
        this.picker?.close();
        this.picker = null;
      };
      this.picker = new StopCard(this, (raidLook === 'maxden' ? 'maxden' : raidLook === 'shonen' ? 'shonen' : 'tera') as StopLook, {
        kicker: `${kindName.toUpperCase()} · TIER ${pv.tier}`,
        title: `${pv.name}${pv.returning ? ' (it came back!)' : ''}`,
        species,
        level: pv.level,
        info: [`Mechanics: ${pv.mechanics.join(' · ')}`, `Rewards: ${pv.rewards.join(' · ')}`, 'Losing never ends your run.'],
        options: choices.map((a) => {
          const cost = pv.entryCost + a.cost;
          return { label: a.label ? `${a.label} · ${a.leave ? 'free' : `₽${cost}`}` : `JOIN RAID · ₽${cost}`, detail: a.text || pv.blurb, problem: !a.leave && money < cost ? `You need ₽${cost} to enter.` : null };
        }),
      }, session.settings.battleAnimations, {
        onSelect: (i) => {
          const choice = choices[i]!;
          leave();
          this.startRaid(sideId, choice, pv);
        },
        onBack: leave,
      }, );
      return;
    }
    const picker: Picker = new Picker(this, {
      glass: true,
      title: `${kindName} - Tier ${pv.tier}: ${pv.name}${pv.returning ? ' (it came back!)' : ''}`,
      columns: 1,
      rowHeight: 150,
      rows: choices.map((a) => {
        const cost = pv.entryCost + a.cost;
        return {
          ...speciesRow(species),
          problem: !a.leave && money < cost ? `You need ₽${cost} to enter.` : null,
          hint: `${pv.blurb}  Mechanics: ${pv.mechanics.join(', ')}.  Rewards: ${pv.rewards.join(', ')}.  Entry: ₽${cost}. Losing never ends your run.`,
          draw: (scene: Phaser.Scene, box: Phaser.GameObjects.Container, w: number) => {
            if (scene.textures.exists('ui.raid.den_entry')) box.add(scene.add.image(0, 0, 'ui.raid.den_entry').setOrigin(0).setDisplaySize(w, 150).setAlpha(0.35));
            box.add(scene.add.text(16, 8, a.label ? `${a.label}  ·  ${a.leave ? 'free' : `₽${cost}`}` : `${species.name}  Lv${pv.level}   ·   Tier ${pv.tier}   ·   Entry ₽${cost}`, textStyle(22)));
            if (a.text) box.add(scene.add.text(16, 36, `${species.name} Lv${pv.level}: ${a.text}`, textStyle(16, '#ffe0a0', { wordWrap: { width: w - 32 } })));
            box.add(scene.add.text(16, a.text ? 62 : 42, `Mechanics: ${pv.mechanics.join(' · ')}`, textStyle(16, '#ffd0a0', { wordWrap: { width: w - 32 } })));
            box.add(scene.add.text(16, 104, `Rewards: ${pv.rewards.join(' · ')}`, textStyle(16, '#c0f0c0', { wordWrap: { width: w - 32 } })));
          },
        };
      }),
      onSelect: (i) => {
        const choice = choices[i]!;
        picker.close();
        this.picker = null;
        this.startRaid(sideId, choice, pv);
      },
      onBack: () => {
        picker.close();
        this.picker = null;
      },
    });
    this.picker = picker;
  }

  /** After the approach: offer the preparations (S401 cards, S393 bots, S402 talk) when the den has any, else go in. */
  private startRaid(sideId: string, choice: { id: string; leave: boolean }, pv: ReturnType<typeof raidPreview>): void {
    const prepable = !choice.leave && choice.id !== 'practice' && (pv.cards.length > 0 || pv.bots.length > 0 || pv.talk !== null);
    if (!prepable) this.enterRaidNow(sideId, choice.id || undefined);
    else this.openRaidPrep(sideId, choice.id || undefined, pv);
  }

  private enterRaidNow(sideId: string, approachId: string | undefined, prep?: string): void {
    const { session } = services();
    this.busy = true;
    playSfx(this, 'ui.select');
    const run = session.enterRaid(sideId, approachId, prep);
    this.cameras.main.fadeOut(250);
    this.time.delayedCall(260, () => this.scene.start(sceneForRun(run)));
  }

  /** "Before you go in": a gimmick card, a lobby bot, or a talk with the boss (one of them), or none. */
  private openRaidPrep(sideId: string, approachId: string | undefined, pv: ReturnType<typeof raidPreview>, coop = false): void {
    const { session } = services();
    const money = session.run!.money;
    const approachCost = approachId ? pv.approaches.find((a) => a.id === approachId)?.cost ?? 0 : pv.approaches[0]?.cost ?? 0;
    const base = pv.entryCost + approachCost;
    type Row = { label: string; hint: string; cost: number; go: () => void };
    // S410: with co-op on, every choice below also brings a second player (they share the party, taking turns).
    const withCoop = (p?: string): string | undefined => (coop ? (p ? `coop+${p}` : 'coop') : p);
    const rows: Row[] = [{ label: coop ? 'Go in together' : 'Go in as you are', hint: coop ? 'Two players, no extra rules.' : 'No extra rules, no help.', cost: 0, go: () => this.enterRaidNow(sideId, approachId, withCoop()) }];
    for (const c of pv.cards) rows.push({ label: `Card: ${c.label}`, hint: c.text, cost: 0, go: () => this.enterRaidNow(sideId, approachId, withCoop(`card:${c.id}`)) });
    for (const b of pv.bots) rows.push({ label: `Ally: ${b.label} · ₽${b.cost}`, hint: b.text, cost: b.cost, go: () => this.enterRaidNow(sideId, approachId, withCoop(`bot:${b.id}`)) });
    if (pv.talk) rows.push({ label: 'Talk to it first...', hint: 'What you say changes how both sides start the fight.', cost: 0, go: () => this.openRaidTalk(sideId, approachId, pv.talk!.prompt, pv.talk!.choices, [], coop) });
    rows.push({ label: coop ? 'Co-op: ON (tap to turn off)' : 'Co-op: OFF (2 players, one device)', hint: 'A friend plays half your team and you pass the controller each turn. The boss is tougher, the crowd louder, the prize bigger.', cost: 0, go: () => this.openRaidPrep(sideId, approachId, pv, !coop) });
    const picker: Picker = new Picker(this, {
      glass: true,
      title: `Before you go in: ${pv.name}${coop ? ' (co-op)' : ''}`,
      columns: 1,
      rowHeight: 74,
      rows: rows.map((r) => ({
        problem: money < base + r.cost ? `You need ₽${base + r.cost} to enter.` : null,
        hint: r.hint,
        draw: (scene: Phaser.Scene, box: Phaser.GameObjects.Container, w: number) => {
          box.add(scene.add.text(16, 8, r.label, textStyle(22)));
          box.add(scene.add.text(16, 38, r.hint, textStyle(16, '#ffe0a0', { wordWrap: { width: w - 32 } })));
        },
      })),
      onSelect: (i) => {
        picker.close();
        this.picker = null;
        rows[i]!.go();
      },
      onBack: () => {
        picker.close();
        this.picker = null;
      },
    });
    this.picker = picker;
  }

  /** S402 Boss Dialogue Trees: pick a line; some lead to a second set of lines. */
  private openRaidTalk(sideId: string, approachId: string | undefined, prompt: string, choices: { id: string; label: string; reply: string; next?: unknown[] }[], path: string[], coop = false): void {
    const picker: Picker = new Picker(this, {
      glass: true,
      title: prompt,
      columns: 1,
      rowHeight: 74,
      rows: choices.map((c) => ({
        problem: null,
        hint: c.reply,
        draw: (scene: Phaser.Scene, box: Phaser.GameObjects.Container, w: number) => {
          box.add(scene.add.text(16, 8, c.label, textStyle(22)));
          box.add(scene.add.text(16, 38, c.next ? 'It may answer back...' : 'Say it and go in.', textStyle(16, '#ffe0a0', { wordWrap: { width: w - 32 } })));
        },
      })),
      onSelect: (i) => {
        const c = choices[i]!;
        picker.close();
        this.picker = null;
        const next = [...path, c.id];
        if (c.next && c.next.length > 0) this.openRaidTalk(sideId, approachId, c.reply, c.next as typeof choices, next, coop);
        else this.enterRaidNow(sideId, approachId, coop ? `coop+talk:${next.join('>')}` : `talk:${next.join('>')}`);
      },
      onBack: () => {
        picker.close();
        this.picker = null;
      },
    });
    this.picker = picker;
  }

  /** A fishing spot: pick one of the Pokémon on the line, then battle it. */
  private openFishing(sideId: string): void {
    const { session } = services();
    const content = session.content;
    const offer = fishingOffer(content, session.run!, sideId);
    const picker: Picker = new Picker(this, {
      glass: true,
      title: 'Something is biting! Which one?',
      columns: 1,
      rowHeight: 64,
      rows: offer.map((o) => {
        const species = content.species.get(o.speciesId)!;
        const row = speciesRow(species);
        return {
          ...row,
          hint: `${row.hint}  ·  Lv${o.level}`,
          draw: (scene, box, w, h) => {
            row.draw(scene, box, w, h);
            box.add(scene.add.text(w - 16, h / 2, `Lv${o.level}`, textStyle(22)).setOrigin(1, 0.5));
          },
        };
      }),
      onSelect: (i) => {
        picker.close();
        this.picker = null;
        this.busy = true;
        playSfx(this, 'ui.select');
        const run = session.fish(sideId, i);
        this.cameras.main.fadeOut(250);
        this.time.delayedCall(260, () => this.scene.start(sceneForRun(run)));
      },
      onBack: () => {
        picker.close();
        this.picker = null;
      },
    });
    this.picker = picker;
  }

  /** The Trainer Plaza has its own scene (districts, crowd, per-stage look). */
  private openPlaza(sideId: string, notice?: string): void {
    this.busy = true;
    this.scene.start('Plaza', { sideId, notice, focus: 0 });
  }

  private openService(sideId: string): void {
    const { session } = services();
    const view = session.serviceView(sideId);
    // Trade Posts have their own anime-styled screen (trade stops redesign).
    const run = session.run!;
    if (view.service.id === 'trade' && view.options.length > 0 && useTradeScreen(session.settings.screenStyles, tradeSalt(run.seed, sideId, run.log.counters.tradesMade ?? 0))) {
      this.busy = true;
      this.scene.start('Trade', { source: 'service', sideId, back: { scene: 'Map' } });
      return;
    }
    const rows = view.options;
    if (rows.length === 0) return playSfx(this, 'ui.error', 0.5);
    const picker: Picker = new Picker(this, {
      glass: true,
      title: `${view.service.name}  ·  ₽${view.money}`,
      columns: 1,
      rowHeight: 78,
      rows: rows.map((row) => ({
        problem: row.problem,
        hint: row.text,
        draw: (scene, box, w) => {
          box.add(scene.add.text(16, 6, `${row.title}${row.cost > 0 ? `   ₽${row.cost}` : ''}`, textStyle(22)));
          box.add(scene.add.text(16, 34, row.text, textStyle(15, '#d8d0e0', { wordWrap: { width: w - 32 } })));
        },
      })),
      onSelect: (i) => {
        picker.close();
        this.picker = null;
        playSfx(this, 'ui.select');
        this.scene.restart({ notice: session.useService(sideId, rows[i]!.id), focus: 0 });
      },
      onBack: () => {
        picker.close();
        this.picker = null;
      },
    });
    this.picker = picker;
  }

  /** Runs a map item action picked in the Bag (bike, Escape Rope, VS Seeker...). */
  private useMapItem(action: MapActionKind): void {
    const { session } = services();
    playSfx(this, 'ui.select');
    const notice = session.useMapAction(action);
    const run = session.run!;
    if (run.phase !== 'map') {
      this.busy = true;
      this.cameras.main.fadeOut(250);
      this.time.delayedCall(260, () => this.scene.start(sceneForRun(run)));
      return;
    }
    this.scene.restart({ notice, focus: 0 });
  }

  private legend: Phaser.GameObjects.Container | null = null;

  /** The map legend (ideas W4, key L): what every node, stop, badge and obstacle icon means. Esc or L closes it. */
  private toggleLegend(): void {
    if (this.legend) {
      this.legend.destroy();
      this.legend = null;
      this.busy = false;
      return;
    }
    if (this.busy || this.picker) return;
    const layer = this.add.container(0, 0).setDepth(85).setName('map-legend');
    layer.add(this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.6).setOrigin(0).setInteractive().on('pointerdown', () => this.toggleLegend()));
    layer.add(drawGlass(this, 40, 40, GAME_WIDTH - 80, GAME_HEIGHT - 80, { tint: AERO.glassLow, rim: AERO.rim, radius: 18, alpha: 0.97 }));
    layer.add(this.add.text(GAME_WIDTH / 2, 56, 'Map legend  (L or click to close)', textStyle(22, COLORS.gold)).setOrigin(0.5, 0));
    const rows: { glyph: string; color: number; text: string }[] = [
      ...Object.values(KIND_STYLE).map((k) => ({ glyph: k.glyph, color: k.color, text: k.label })),
      { glyph: '!', color: HARDER_COLOR, text: 'Harder route: stronger foes, better rewards' },
      { glyph: '?', color: FOG_STYLE.color, text: 'In the fog: not seen yet' },
      { glyph: '✓', color: 0x48a860, text: 'Visited' },
      { glyph: '✦', color: 0xf8e070, text: 'Itemfinder: an item hides here' },
      { glyph: '☂', color: FRONT_COLOR.rain!, text: 'Weather front: battles start in that weather' },
      ...(Object.keys(SIDE_STYLE) as SideStop['kind'][]).map((k) => ({ glyph: SIDE_STYLE[k].glyph, color: SIDE_STYLE[k].color, text: `${SIDE_LABEL[k]} stop` })),
      ...Object.values(STOP_STYLES).map((st) => ({ glyph: st.glyph, color: st.color, text: st.label })),
      { glyph: ROAMER_STYLE.glyph, color: ROAMER_STYLE.color, text: 'Roaming Legendary or Legendary event' },
      { glyph: CAMP_STYLE.glyph, color: CAMP_STYLE.color, text: 'Checkpoint camp' },
    ];
    const obstacles = TRAVERSAL.obstacles.map((o) => ({ glyph: o.icon, color: Phaser.Display.Color.HexStringToColor(o.color).color, text: `${o.name}: ${o.types.map((t) => t[0]!.toUpperCase() + t.slice(1)).join('/')}` }));
    const all = [...rows, ...obstacles];
    const perCol = Math.ceil(all.length / 3);
    const colW = (GAME_WIDTH - 120) / 3;
    const rowH = Math.min(18, Math.floor((GAME_HEIGHT - 170) / perCol));
    all.forEach((row, i) => {
      const cx = 64 + Math.floor(i / perCol) * colW;
      const cy = 96 + (i % perCol) * rowH;
      const dot = this.add.graphics();
      dot.fillStyle(0x181818, 1).fillCircle(cx + 7, cy + 7, 8);
      dot.fillStyle(row.color, 1).fillCircle(cx + 7, cy + 7, 7);
      layer.add(dot);
      layer.add(this.add.text(cx + 7, cy + 7, row.glyph, textStyle(10, '#101018', { stroke: '#ffffff', strokeThickness: 2 })).setOrigin(0.5));
      layer.add(fitLine(this.add.text(cx + 20, cy, row.text, textStyle(12, COLORS.textLight)), colW - 26));
    });
    this.legend = layer;
    this.busy = true;
  }

  private showBanner(top: string, title: string, sub: string, plan: readonly string[] = []): void {
    const layer = this.add.container(0, 0).setDepth(80);
    layer.add(this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.55).setOrigin(0));
    // A banner band across the screen, like a Pokémon game's location sign.
    const band = this.add.graphics();
    band.fillStyle(0x181818, 0.95).fillRect(0, 168, GAME_WIDTH, 168);
    band.fillStyle(this.accent, 1).fillRect(0, 174, GAME_WIDTH, 6).fillRect(0, 324, GAME_WIDTH, 6);
    layer.add(band);
    layer.add(this.add.text(GAME_WIDTH / 2, 208, top, textStyle(26, COLORS.gold)).setOrigin(0.5));
    layer.add(this.add.text(GAME_WIDTH / 2, 254, title, textStyle(56, COLORS.textLight)).setOrigin(0.5));
    layer.add(this.add.text(GAME_WIDTH / 2, 302, sub, textStyle(20, '#d8d0e0')).setOrigin(0.5));
    // Beta 4.4: why this stage was built the way it was (core/stagePlan.ts).
    if (plan.length > 0) {
      const box = this.add.text(GAME_WIDTH / 2, 346, `Built from your last stage:\n${plan.join('\n')}`, { ...textStyle(18, COLORS.textLight), align: 'center', wordWrap: { width: GAME_WIDTH - 80 } }).setOrigin(0.5, 0);
      layer.add(this.add.rectangle(GAME_WIDTH / 2, 338, box.width + 32, box.height + 16, 0x181818, 0.92).setOrigin(0.5, 0));
      layer.add(box);
    }
    band.x = -GAME_WIDTH;
    this.tweens.add({ targets: band, x: 0, duration: 260, ease: 'Cubic.easeOut' });
    this.busy = true;
    this.tweens.add({ targets: layer, alpha: 0, delay: plan.length > 0 ? 3200 : 1400, duration: 400, onComplete: () => {
      layer.destroy();
      this.busy = false;
    } });
  }
}

/** The newest rival headline for the map's notice corner (world recognition), or ''. */
const OMEN_COLOR: Record<OmenTier, string> = { calm: '#70e070', uneasy: '#f0d060', dire: '#f06060' };

function newsLine(content: Parameters<typeof topHeadline>[0], run: Parameters<typeof topHeadline>[1]): string {
  const h = topHeadline(content, run);
  return h ? `News: ${h}` : '';
}
