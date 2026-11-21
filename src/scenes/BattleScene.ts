// The battle screen, for wild and trainer battles. All rules run in the core
// battle engine; this scene only shows the state, collects the player's
// choice (Fight / Bag / Pokémon) and plays back the events each turn produces.

import { falseSlotFor } from '../core/expansion/labyrinth';
import { waitOffered } from '../core/greenneedle/fifth';
import { askButtons, askDue, askOf, askPassing, type AskView } from '../core/greenneedle/ask';
import { lastResortOffer, useLastResort } from '../core/battle/lastResort';
import { mentorMoment } from '../core/story/mentorMoments';
import { mentorScene } from '../ui/battleFx/mentorScene';
import { riskLine } from '../core/battleRisk';
import { gimmickContext } from '../core/gimmicks';
import { aeroMood, autoInterruption, cameraFocus, capFlash, hapticPattern, interactionLog, TOOLTIP_DELAY_MS } from '../core/presentation/uiPrefs';
import { fitBlock, fitLine } from '../ui/fitText';
import { cheerDue } from '../core/sky/spectate';
import { helperButtons } from '../core/greenneedle/reunion';
import { FINALE_ASK, chunkLines } from '../core/sky/text';
import { HazardFloor, bossCinematic, critFreeze, critLetterbox, runScan, tossArc, weaknessesOf } from '../ui/battleFx/skillMoments';
import { defaultMoveIndex } from '../core/battle/rememberChoice';
import { isEnemyAce } from '../core/battle/ace';
import { aimable, dealOffer, foeStake, type SkillInput } from '../core/battle/w1Play';
import { promptById } from '../core/interaction/prompt';
import { runInteractionPrompt } from '../ui/interactionPrompt';
import { filterLog, LOG_TABS, type LogTab } from '../ui/logFilter';
import { modeBattleLine } from '../core/modeObjectives';
import { isUltimateBattle, ULTIMATE_EMBLEM } from '../core/rivals/ultimate';
import { buildEpilogue } from '../core/ending';
import { battleStartContext, ensureNarration, partyNarration } from '../core/overhaul/partyNarration';
import { ensureTrainerLines } from '../core/overhaul/trainerLines';
import { materialName } from '../core/crafting';
import { genderSign } from '../core/gender';
import { hasPerk } from '../core/mapItems';
import Phaser from 'phaser';
import { wildBehavior } from '../core/wildBehavior';
import { enemyIntent, foePreviewIntent, trainerTaunt } from '../core/battle/intent';
import { nextSwitchLine } from '../core/rivals/questlines';
import { winConditionLine } from '../core/rivals/tier5';
import { explainMoment, explanationText, FAMILY_NAMES, unseenKeys } from '../core/story/hyperRules';
import { bondScoreOf, momentumMax, rallyProblem } from '../core/battle/spectacle';
import { armFeat, featCharged } from '../core/story2/feats';
import { signatureDisplay } from '../core/story2/signature';
import { introForBattle, introText, trainerIntro } from '../core/story2/cutscene';
import { forcedMoveId, forcedMoveIndex, itemProblem, switchProblem, telegraphedAttack, type PlayerAction, type Side, type SlotCommand } from '../core/battle/engine';
import { doublesSwitchProblem, indexAt, monAt, needsTarget, primarySpot, spotsOf, type Spot } from '../core/battle/doubles';
import { isGuest } from '../core/battle/guests';
import { commandPlan, shiftOptionProblem, targetChoices } from '../core/battle/fieldMenu';
/** This screen draws double battles: spot 0 left, 1 right (triple battles get their own layout in Beta 0.6 T2). */
import { canDynamax, hasKeyItem, maxMoveOptions, megaOption, ownedZCrystal, permanentForm, stoneForms, teraOption, transformProblem, zMoveFor, zMoveOptions, type TransformRequest } from '../core/battle/transform';
import { runPerks } from '../core/archetypes';
import { abilityOf, calcStats, maxHp, getSpecies, lookSpecies, maxPp, xpForLevel } from '../core/pokemon';
import { heartStage } from '../core/shadow';
import { shadowPreviewLine } from '../core/shadow2';
import { foresightOn } from '../core/battle/foresight';
import { foresightRule, keepsCallout, rallyLine, shadowLines, traitLine, type CalloutEvent } from '../ui/redux/battleCallouts';
import { formIntro } from '../core/presentation/sceneEffects';
import { finalRivalArenaTheme } from '../core/story/highHype';
import { ultimateRival } from '../core/rivals/ultimate';
import { bossRoleForClass } from '../core/encounters';
import { findNode } from '../core/map';
import { bossInfo, currentRegion, runCampaign, runLevelCap, type BossInfo } from '../core/regions';
import { isPseudoBattle } from '../core/events';
import { isFinalBoss, type RunEvent, type TurnResult } from '../core/run';
import { secondShotNotice, type ShotNotice } from '../core/arc/climaxExtended';
import { battleContent, noBattleItems, tagPilot } from '../core/rules';
import { isHardcore, nuzlockeCatchProblem } from '../core/nuzlocke';
import type { PresentationCue } from '../core/story/queue';
import { currentEnemy, type BattleState, type PokemonInstance, type RunState } from '../core/state';
import { isBossClass } from '../core/trainerPerks';
import { arenaFor, getTheme } from '../core/themes';
import { shinyCatchBurst, targetReticle } from '../ui/battleFx/arenaLife';
import { addFollowedCue } from '../ui/battleFx/followedCue';
import { followedCue } from '../core/greenneedle/followed';
import { addContactShadows, addParallax, addVignette, ArenaLight, dressArena, type ShadowTarget } from '../ui/battleFx/arenaLife';
import { pickUieArena } from '../core/arenaStyle';
import { zTitleAssetId, pokemonAssetIds, bossAnimId, bossBackId, uieArenaId, VS_SHARED, vsCardFor } from '../assets/catalog';
import { vsScreen, vsScreenReady } from '../ui/battleFx/vsScreens';
import { services } from '../game/services';
import { launcherReady } from '../core/camp';
import { moveBlockReason } from '../core/battle/moveBlock';
import { cheerProblem, coopOwner, exposedWeakSpot, puzzlePattern, raidBot, raidDef, raidRole } from '../core/raid/raid';
import { RETURN_MUSIC } from '../core/instrumentality/flightNorth';
import { DexInfo } from '../ui/dexInfo';
import { liveDexProfile } from '../core/presentation/dexInfo';
import { playCry, playMusic, playMusicLazy, playSfx, playSfxLazy, setMusicIntensity, storyOr, playCue } from '../ui/audio';
import { storyTeamTrack } from '../core/presentation/storyMusic';
import { isStoryCampaign } from '../core/campaign/circuit';
import { storyAssetId } from '../core/storyAudio';
import { evilTeam } from '../core/evil/teams';
import { barkLine } from '../core/evil/barks';
import { setAmbience, setMusicState, setRegionKey, playMotif, stopProceduralAudio } from '../ui/procAudio';
import { regionIdentity } from '../core/presentation/regionIdentity';
import { GALAR_STADIUM, galarGymNumber, galarHost, galarPerformance, hostLine, isGalarStadiumBattle } from '../core/galarStadium';
import { bracketView, currentTournamentRound } from '../core/galarTournament';
import { StadiumDirector, type StadiumHooks } from '../ui/galar/stadiumDirector';
import { INTERVIEWERS_SPRITE, CROWD_SPRITES } from '../ui/galar/cutArt';
import { crowdFavor, galarScope, type HypeSpeaker } from '../core/galarCrowd';
import { ambienceFor, musicState } from '../core/presentation/musicLayers';
import { eventText, fixedDamageLabel, type Names } from '../ui/battleText';
import { onInputAction, type InputAction } from '../ui/input';
import { bagRow, partyRows, Picker } from '../ui/partyPanel';
import { BAG_POCKETS, itemPocket, POCKET_NAMES } from '../core/bag';
import { itemCard, itemFooter } from '../core/itemPreview';
import { battleOpening, runHealMultiplier } from '../core/run';
import { rewindTurnsAvailable } from '../core/rewind';
import { reverseSideProblem } from '../core/legends/reverseSide';
import { calmProblem } from '../core/blessings';
import { partyPreviews, quickSummaryText } from '../ui/itemScreen';
import { animationStrength, animationTimeScale, animSettingsFrom } from '../core/accessibility';
import { transformAnimId } from '../core/presentation/transformAnims';
import { resolveAnim } from '../core/presentation/animRegistry';
import '../core/presentation/storyAnims';
import { rivalIntro } from '../ui/battleFx/storyFx';
import { poseMoment } from '../ui/dialogue/poseMoment';
import { poseForMoments } from '../core/presentation/poses';
import { zMoveSky } from '../ui/battleFx/zMoveSky';
import { bossIntroMoment, defaultMoment, planMoment, rivalMoment, type MomentKind } from '../core/cinematic/moments';
import { playMoment } from '../ui/cinematic/momentPlayer';
/** Moments already played this session (repeatable ones play shorter next time). Not saved: presentation only. */
const SEEN_MOMENTS = new Set<string>();
import { pokemonHeightM, trainerHeightM } from '../core/heights';
import { teraJewel } from '../ui/battleFx/teraJewel';
import { megaGlass } from '../ui/battleFx/megaGlass';
import { drawnBox, type GimmickPage } from '../ui/battleFx/gimmickStage';
import { HIT_RUN, stand, standStill, sway, twitch } from '../ui/battleFx/stance';
import { bubblePicture, chevronPicture, ConditionLook, DizzyStars, flagPicture, flamePicture, glarePicture, pipPicture, putAbove, titlePicture } from '../ui/battleFx/conditionLook';
import { BUBBLE_W, chevronWaves, condArriveClip, FLAG_HOLD, intimidateClip, condKind, condTickClip, FLAME_W, CONFUSE, endTurnParade, confusionHitClip, gustLeanClip, parCantClip, protectedClip, RECOIL, recoilClip, DRAIN, drainClip, SHIELD, SLUMP, STAT_COLOR, STAT_DOWN_STAMP, statClip, thawClip, wakeClip, type CondKind, type CondSpot } from '../core/presentation/motionConditions';
import { CHEER_RING, cheerFace, cheerParts, cheerWordPicture, GLOW_SIZE, glowPicture, PICTURE_SCALE, plusPicture, shinyChipPicture, stampPicture, starPicture } from '../ui/battleFx/cheerChip';
import { dynamaxPan } from '../ui/battleFx/dynamaxPan';
import { keyItemFor } from '../ui/battleFx/cineLook';
import { ballOpenEffect, ballVisual, preloadBallFx } from '../ui/ballArt';
import { cameraTo, dropIn, fitTrainer, foeBallThrow, openingReveal, partyBallRow, type BallRow } from '../ui/battleFx/opening';
import { DEFAULT_BALL } from '../core/ballLook';
import type { ClipLevel, MotionClip } from '../core/presentation/motionClip';
import { aceLandClip, HEAL_PLUS_SIZE, HEAL_PLUSES, healClip, COMBO, comboPlan, comboScale, type ComboStep, CRIT_FREEZE, critFreezeClip, HIT_LIGHT, HIT_STAMPS, hitStampSpot, hitClip, hitPower, levelUpClip, wildEntranceClip, WILD_BARS, bigHit, shinyClip, standKind, missClip, foeHand, foeThrowClip, CHEER_GAP, cheerClip, cheerWord, type CheerMoment, expLightsClip, faintClip, recallBallSpot, recallClip, sendClip, throwFromSpot, type Point } from '../core/presentation/motionBasics';
import { playClip, type ClipHost, type ClipPart, type ClipRun } from '../ui/battleFx/motionPlayer';
import { throwKind, throwTint } from '../core/archetypeTint';
import { islanderTint, pinkTint } from '../core/greenneedle/part3';
import type { PlayerTrainerActor } from '../ui/playerTrainer';
import { addMarks } from '../ui/battleFx/markAura';
import { itemVisual, pokemonIcon, pokemonVisual, trainerBackVisual, trainerVisual, type Visual } from '../ui/sprites';
import { bossVictory } from '../ui/battleFx/victoryLook';
import { COLORS, FONT_FAMILY, GAME_HEIGHT, GAME_WIDTH, PIXEL_SCALE, STATUS_LABELS, TYPE_COLORS, mixColor, textStyle } from '../ui/theme';
import { Bar, badge, drawPanel, Menu } from '../ui/widgets';
import { sceneForRun } from './routing';
import { battleSkinFor, type BattleFrameInfo, type BattleHud, type BattleSkin, type BoxSpec, type MenuLayout, type MenuSpec, type Rect } from '../ui/battleStyles';
import { fallbackFoeArt } from '../core/presentation/foeArt';
import { reduxLayout, reduxSkinIndex } from '../core/presentation/redux';
import { useLookFont } from '../ui/redux/canvasFont';
import { mountRedux, phantomOn, reduxOn, type ReduxView } from '../ui/redux/stage';
import { phGimmick, type GimmickCard } from '../ui/phantom/screens/cutin';
import { gimmickSlots } from '../core/battle/bossGimmicks';
import { phTravel } from '../ui/phantom/screens/travel';
import { phGimmickPick, phHit, phKo, phPhase, phResult, phRivalLoss, phSend, phSide, phWild, phWin, type GimmickSlot, type ResultRow, type SendSide } from '../ui/phantom/screens/moments';
import type { PhantomVersion } from '../core/presentation/phantom';
import { playEvolution } from '../ui/evolutionScene';
import { battleView, panelOf, splitChoice, type BattleBox, type BattleEvolve, type BattleLevel, type BattleModel, type BattlePanel } from '../ui/redux/screens/battle';
import { artOf, monFile } from '../ui/redux/game';
import { moveTipOf, ownAbilityCard, seenFact } from '../ui/redux/tips';
import { versusView, type VersusModel } from '../ui/redux/screens/versus';
import { shortestSentence, type CutModel } from '../ui/redux/screens/cut';
import type { Art } from '../ui/redux/templates';
import { playCutMoment } from '../ui/redux/moment';
import { rxFileOf } from '../ui/redux/assets';
import type { AssetManifest } from '../assets/catalog';
import { screenStyleOf } from '../core/presentation/screenStyles';
import { KIT_LAYOUTS, KitBar, kitTexturesReady, type GaugeLike } from '../ui/battleUiStyles';
import { loadAssets, partySpecies, pokemonArtIds, preloadPokemon, queueAssets } from '../ui/lazyAssets';
import { pickWipe, wipeAssetId } from '../ui/battleFx/ruleWipe';
import { sosEntry } from '../core/battle/sos';
import { WEATHER_ASSET_IDS, WeatherLayer } from '../ui/battleFx/weather';
import { WeatherLook, WX_KINDS, type WxKind } from '../ui/battleFx/weatherLook';
import { TerrainLook } from '../ui/battleFx/terrainLook';
import { EndTurnParade } from '../ui/battleFx/endTurnLook';
import { TERRAIN_KINDS, type TerrainKind } from '../core/presentation/motionWeather';
import { battleTrack, storyBattleMusic, lowHpTrack, raidMusic, victoryTrack, type BattleRole } from '../core/presentation/battleMusic';
import { itemCount } from '../core/items';
import { planCues, STAT_WORDS } from '../core/presentation/cues';
import { applyCueHooks } from '../core/presentation/hooks';
import { DRAMA_LIBRARY, type DramaLine } from '../core/drama';
import { wouldRefuse } from '../core/bond';
import { autoBattleProblem, autoProfile, chooseAutoAction, STANCES, STANCE_INFO, stanceOf, type Stance } from '../core/battle/autoBattle';
import { battleConditions, type FoeReveals } from '../core/battle/conditions';
import { moveFlagLabels, moveFullDescription } from '../core/battle/moveText';
import { BattleTabs, type BattlePage, type TabsPlace } from '../ui/battleTabs';
import { animChoice, presentationFor } from '../core/presentation/moveAnims';
import { moveAnims } from '../data/presentation';
import { BattleFx } from '../ui/battleFx/battleFx';
import { championGlow, platformEdgeLight } from '../ui/battleFx/transitions';
import { addAmbience, arenaType } from '../ui/battleFx/ambience';
import { addEnvironment } from '../ui/battleFx/environment';
import { environmentStory } from '../core/presentation/environmentStory';
import { crisisLevel } from '../core/story/crisis';
import { moveRank } from '../core/moveMastery';
import { chargeUp, cinematic, prefetchCinematics, type CineKind } from '../ui/battleFx/cinematics';
import { actionTab, type ActionTab } from '../ui/actionTab';
import { DYNAMAX_SCALE } from '../ui/battleFx/cineLook';
import { dynamaxPatternKey, STATUS_PULSE, statusPatternKey, TERA_ICON_ROW, teraPatternKey } from '../ui/battleFx/formLook';
import { dropPattern, wearPattern, wornPattern } from '../ui/battleFx/formPattern';
import { tweenDone } from '../ui/tweenDone';
import { legendMusic } from '../core/legendary/identity';
import { legendKit, legendLook } from '../core/legendary/visuals';
import { addLegendLook } from '../ui/legendFx';
import { portraitChip, type PortraitChip } from '../ui/battleFx/portrait';
import { expressionFor } from '../core/presentation/expressions';
import { cameraShot } from '../core/presentation/camera';
import { addStickerRow } from '../ui/battleFx/stickers';
import { victoryPoseFor } from '../core/presentation/victoryPose';
import { introRecap } from '../core/presentation/skipRecap';
import { aceBurst, legendFlash, rivalCatch, rivalEntrance, rivalExit } from '../ui/battleFx/rivalStepIn';
import { victoryPose, showRecapBanner, bossVictoryCard, burstReveal, exitWipe, hop, introTransition, stamp, titleCard, type Beat, type IntroKind, phaseBanner, cameoBeat, glassCrack } from '../ui/battleFx/spectacle';
import { LETTER_MS, storyBar, storyLine, typeSpeech, type StoryBar } from '../ui/dialogue/storyDialogue';
import { planSpeech, stripSpeechTags, type SpeechVoice } from '../ui/dialogue/speechPacing';
import { AERO, moveFlagNames, bounceIn, breathe, categoryIcon, drawGlass, effectivenessIcon, effectivenessWord, slideIn, statusIcon, typeLabel, type MotionLevel } from '../ui/aero';
import { typeEffectiveness } from '../core/battle/damage';
import type { Move, TypeName, Weather } from '../core/contentSchema';
import { rivalBossFor } from '../core/rivals/major';

const MESSAGE_AUTO_ADVANCE_MS = 1400;
const MESSAGE_DELAYS = { short: 700, normal: 1400, long: 2400 } as const;
/** Milliseconds per character for the typewriter text speeds. */
const TEXT_MS = { faster: 6, fast: 12, normal: 28, slow: 50 } as const;
/** Battle events whose lines advance on their own; everything else waits for a confirm press. */
const AUTO_EVENTS = new Set<string>(['move', 'noPp', 'miss', 'damage', 'noEffect', 'fail']);
// Where the Pokémon stand: on the arena's ground patches (PokeRogue's layout). The foe's feet rest a little in front of its
// platform's middle (the patch art spans x 456-840, y 174-270); your Pokémon stands low in the foreground, its feet and
// platform tucked behind the message bar (MESSAGE_Y; about 30 px of its feet are hidden), so it is nearer the camera than the foe.
const ENEMY_POS = { x: 648, y: 240 };
/** Where your trainer waits off screen between throws. */
const TRAINER_OFF_X = -260;
/** Your trainer is drawn large in the foreground, its lower legs behind the message bar (the reference's N). */
const PLAYER_TRAINER_HEIGHT = 330;
const PLAYER_TRAINER_FEET = 560;
const PLAYER_POS = { x: 312, y: 428 };
/** Where your trainer and the sticker row stand (just above the message bar, not under it). */
const TRAINER_POS = { x: 312, y: 400 };
/** How far a floating foe (Flying type or Levitate) hovers over its platform. */
const FLOAT_LIFT = 14;
/** The bottom message bar, and the command window on its right. */
const MESSAGE_Y = 396;
/** The wild entrance's dark bars cover everything on the screen, the menus too (pass 5). */
const WILD_DEPTH = 4600;
/** How long the first-time Hyper/Overdrive explanation ignores Continue, so it can't be skipped by accident. */
const EXPLAIN_LOCK_MS = 1200;
const COMMAND_X = 588;
/** How long Auto-Battle's chosen action stays on screen before it is played (Back cancels). */
const AUTO_PICK_MS = 1100;
/** gn.47: the pause before each turn of the watched Exhibition match. */
const EXHIBITION_PICK_MS = 300;
/** Double battles: where each spot stands (left, right) and the databox spots. */
const DUO_POS = {
  player: [
    { x: 206, y: 430 },
    { x: 416, y: 422 },
  ],
  // Both foes stand on the one enemy platform: the left one a little further back.
  enemy: [
    { x: 572, y: 228 },
    { x: 726, y: 244 },
  ],
} as const;
const DUO_SCALE = { player: 0.72, enemy: 0.85 } as const;
/** A weather's turns for its chip: null when it lasts (a primal or a set field's weather). */
const wxTurns = (turns: number): number | null => (turns >= 99 ? null : turns);

const DUO_BOX = { scale: 0.6, enemy: [{ x: 4, y: 6 }, { x: 4, y: 72 }], player: [{ x: GAME_WIDTH - 236, y: 236 }, { x: GAME_WIDTH - 236, y: 316 }] } as const;
/**
 * Triple battles (Kice's pick: Triple 2, the Essentials Kit with the long foe box): left, centre, right. Foe boxes stack down
 * the top left, yours down the right, above the message bar; the Pokémon stand a little smaller than in doubles.
 */
const TRIO_POS = {
  player: [
    { x: 150, y: 434 },
    { x: 352, y: 426 },
    { x: 554, y: 434 },
  ],
  enemy: [
    { x: 440, y: 216 },
    { x: 572, y: 234 },
    { x: 704, y: 212 },
  ],
} as const;
const TRIO_SCALE = { player: 0.6, enemy: 0.72 } as const;
const TRIO_BOX = {
  scale: 0.6,
  enemy: [{ x: 4, y: 4 }, { x: 4, y: 68 }, { x: 4, y: 132 }],
  player: [{ x: GAME_WIDTH - 236, y: 156 }, { x: GAME_WIDTH - 236, y: 236 }, { x: GAME_WIDTH - 236, y: 316 }],
} as const;

/** The spot the screen isn't focused on in a double battle (see battle/doubles.ts: focus). */
interface DuoOther {
  sprite: Visual | null;
  box: InfoBox;
  mon: PokemonInstance | null;
}

/** Databox and title-card rim colour for each kind of opponent. */
const ROLE_RIMS = { wild: 0xff4fd8, trainer: 0xff8a3c, rival: 0xff3048, ultimate: 0xff6a20, gym: 0xffc840, elite: 0xb070ff, champion: 0xfff4a0 } as const;

interface InfoBox {
  container: Phaser.GameObjects.Container;
  /** The Pokémon the box last showed (the shown copy, so a disguise holds). */
  mon?: PokemonInstance;
  isPlayer: boolean;
  name: Phaser.GameObjects.Text;
  level: Phaser.GameObjects.Text;
  /** Where a status badge goes inside the box. */
  statusAt: { x: number; y: number };
  hpBar: GaugeLike;
  hpText?: Phaser.GameObjects.Text;
  xpBar?: GaugeLike;
  teamText?: Phaser.GameObjects.Text;
  statusBadge?: Phaser.GameObjects.Container;
  /** The "SHINY" chip pinned to the plate of a shiny foe (pass 11). */
  shinyChip?: Phaser.GameObjects.Image;
  /** "TERA WATER" while the Pokémon is Terastallized. */
  teraBadge?: Phaser.GameObjects.Container;
  /** Raid role (Tank / Striker / Support) of your Pokémon in front. */
  roleBadge?: Phaser.GameObjects.Container;
  rageBadge?: Phaser.GameObjects.Container;
  /** EBDX's Mega / Dynamax symbol beside the name. */
  formIcon?: Phaser.GameObjects.Image;
  /** A soft red glow behind the box while HP is low. */
  danger?: Phaser.GameObjects.Graphics;
  /** The HP share the bar last showed (a drop jolts the plate). */
  ratio?: number;
  /** A battle style's layout for this box (screens redesign); absent for the original look. */
  spec?: BoxSpec;
  /** What the New UI draws for this box; `hp` is the bar on screen, which follows the real HP as the canvas bar does. */
  rx?: BattleBox;
  typesText?: Phaser.GameObjects.Text;
  teamRow?: Phaser.GameObjects.Container;
  portrait?: { species: string; obj: Phaser.GameObjects.GameObject };
}

const sleep = (scene: Phaser.Scene, ms: number) => new Promise<void>((resolve) => scene.time.delayedCall(ms, resolve));
// Always settles, even when another effect kills the tween (a killed tween never calls onComplete).
const tween = tweenDone;

export class BattleScene extends Phaser.Scene {
  private message!: Phaser.GameObjects.Text;
  /** The Story Portrait message bar (default look only): its stripe and type tag follow the move being used. */
  private storyBar: StoryBar | null = null;
  /** Battle log (catalog #115): the last lines said, reopened with the H key. Presentation only. */
  private weatherLayer: WeatherLayer | null = null;
  /** The redesign's rain, sun, sand and snow (pass 8); hail stays on the older layer. */
  private wxLook: WeatherLook | null = null;
  /** The redesign's terrain carpet and chip (pass 8). */
  private trLook: TerrainLook | null = null;
  /** The sandstorm gusts once a turn, however many Pokémon it hurts. */
  private gustShown = false;
  /** A move's weather boost stamps once, on its first hit. */
  private boostShown = false;
  private history: string[] = [];
  private historyView: Phaser.GameObjects.Container | null = null;
  private menu: Menu | null = null;
  /** The Attack · Party · Item · Auto tab strip (spec §23). */
  private tabs!: BattleTabs;
  /** Auto-Battle (spec §32): its pick is on screen for a moment; Back cancels it. */
  private autoRunning = false;
  private autoCancel = false;
  /** The expanded move details (on the Attack page) or battle Info panel. */
  private infoOpen = false;
  private infoPanel: Phaser.GameObjects.Container | null = null;
  private note!: Phaser.GameObjects.Text;
  private panelClose: (() => void) | null = null;
  /** The move highlighted on the Attack page (for the details panel). */
  private focusedMove = 0;
  private picker: Picker | null = null;
  private moveInfo!: Phaser.GameObjects.Text;
  /** The focused move's type label and category icon (Essentials art). */
  private typing: { stop(): boolean; typing(): boolean } | null = null;
  private moveBadges: Phaser.GameObjects.Container | null = null;
  private commandWindow!: Phaser.GameObjects.Graphics;
  /** Screens redesign: the battle style for this battle (null = the original look). Presentation only. */
  private skin: BattleSkin | null = null;
  private skinId = 'original';
  private skinHud: BattleHud | null = null;
  /** New UI: the mock-ups' HUD drawn over the canvas (default look only). The canvas HUD stays built but is not drawn. */
  private rx: ReduxView | null = null;
  /** New UI: the foe Trainer's picture for cutscene cards, kept from the intro. */
  private rxCast: Art | null = null;
  private rxData: BattleModel | null = null;
  private rxSig = '';
  private rxHidden = new WeakSet<object>();
  /** The focused move in words, for the New UI's text box. */
  private rxInfo = '';
  /** New UI: the open info panel's sections, and whether it shows as a move's tooltip. */
  private rxPanels: BattlePanel[] = [];
  private rxPanelAt: 'left' | 'tip' = 'left';
  /** New UI: the transformations the move menu offers now (the mock-ups' row of buttons). */
  private rxGim: { choices: TransformRequest[]; tera: string } | null = null;
  /** Phantom UI: the move menu is the open menu (the gimmick page opens from it), and that page while it is up. */
  private rxMoves = false;
  private phGimView: ReduxView | null = null;
  /** The full-screen Phantom card that is up now (a card is drawn once; a change of version asks it to draw again). */
  private phMomentView: ReduxView | null = null;
  /** Phantom UI: the wild card's Pokédex key, while that card is up, and the page it opened. */
  private phWildKey: (() => void) | null = null;
  private phWildDex: DexInfo | null = null;
  private phGimInput: ((action: InputAction) => void) | null = null;
  /** New UI: the callout of the event being played (a boss's Rally brace, a signature trait going off). */
  private rxCall: { rally?: string; trait?: { file: string; name: string; text: string } } | null = null;
  /** New UI: the Shadow line of the Pokémon that is choosing (its tier, and what the shadow will do this turn). */
  private rxShadow: { head: string; plan: string } | null = null;
  /** New UI: foes whose variant ring was already pointed out, and the one being pointed out at this prompt. */
  private rxRingTold = new Set<string>();
  private rxRing: string | null = null;
  /** New UI: the open Item window (the item budget shows beside it). */
  private rxBag: Picker | null = null;
  /** New UI: where the target menu is aiming (the mock-ups' TARGET tag), and the Exp each Pokémon just earned. */
  private rxAim: { x: number; y: number } | null = null;
  /** New UI: what the pointer rests on ("move:1", "foe:0", "mine:0") and since when; and the box whose card is pinned. */
  private rxHover: { key: string; at: number } | null = null;
  private rxPin: string | null = null;
  private rxExp = new Map<string, { amount: number; level: number | null; was?: PokemonInstance }>();
  /** New UI: the level-up window and the evolution picture now showing. */
  private rxLevel: BattleLevel | null = null;
  /** Phantom UI: what each party member earned over this battle, for the result page. Presentation only; never saved. */
  private phTally = new Map<string, { gain: number; from: number; fromLevel: number; toLevel: number }>();
  /** Phantom UI: the last move used, and how many hits the foe in front has taken, for the hit and knock-out cards. */
  private phLast: { side: Side; by: string; move: string } | null = null;
  private phHits = 0;
  private phTallyKey = '';
  private rxLevels = new Map<string, number>();
  private rxEvolve: BattleEvolve | null = null;
  /** New UI: a notice box over the field that waits for an input (the Second Shot). */
  private rxNotice: ShotNotice | null = null;
  /** New UI: the Item window's open pocket. */
  private rxPocket = 0;
  private playerBox!: InfoBox;
  private enemyBox!: InfoBox;
  private playerSprite: Visual | null = null;
  private enemySprite: Visual | null = null;
  private header!: Phaser.GameObjects.Text;
  /** The arena and both Pokémon: what move animations draw among and screen shake moves (the menus stay still). */
  private field!: Phaser.GameObjects.Container;
  /** The battle arena's backdrop texture (the Z-Move scene reuses it as its stage). */
  private arenaBgKey: string | null = null;
  private msgBaseSize: string | undefined;
  /** Shadow aura and variant marks drawn with each side's sprite. */
  private markObjs: Record<'player' | 'enemy', Phaser.GameObjects.GameObject[]> = { player: [], enemy: [] };
  /** Index in `field` just above the arena art. */
  private fieldBase = 0;
  /** The player's trainer on the field (Overhaul P2): null in doubles and for trainers that keep their own throwing sprite. */
  private trainerActor: PlayerTrainerActor | null = null;
  private trainerHomeX = 0;
  private trainerAway: Phaser.Time.TimerEvent | null = null;
  /** Animation redesign: a fainted side's base stays dark until its next Pokémon lands. */
  private baseShade: Partial<Record<Side, Phaser.GameObjects.Ellipse>> = {};
  /** Where the last foe fell this turn: its experience leaves from there as lights. */
  private fellAt: Point | null = null;
  private trainerReady: Promise<void> = Promise.resolve();
  /** The doubles target picker's marker on the highlighted Pokémon. */
  private reticle: Phaser.GameObjects.Graphics | null = null;
  /** Triple battles: "OUT OF REACH" tags over the foes the move being aimed can't reach (cleared with the menus). */
  private reachTags: Phaser.GameObjects.Container[] = [];
  private arenaLight: ArenaLight | null = null;
  private arenaPhase = 0;
  /** The stage's types, for the ambience and the intro. */
  private arenaTypes: readonly string[] = [];
  /** Raid / Totem status line (shield, phases, ally calls). */
  private status!: Phaser.GameObjects.Text;
  private fx!: BattleFx;
  /** S254: the foe trainer's portrait chip (Settings > Trainer expressions). */
  private portrait: PortraitChip | undefined;
  private advance: (() => void) | null = null;
  private busy = false;
  /** What an assisting rival says after a win (set when it stepped in). */
  private assistAfter: string | null = null;
  /** The transformation the player chose to do with their next move (null = off). */
  private transformChoice: TransformRequest | null = null;
  private actionTabUi: ActionTab | null = null;
  private teraJewels: Partial<Record<Side, Phaser.GameObjects.Image>> = {};
  /** The Rally toggle in the command menu (spends a full Momentum Meter on the next attack). */
  private rallyChoice = false;
  private momentumText!: Phaser.GameObjects.Text;
  /** What the screen currently shows for each side (may lag the real state during playback). */
  private shown!: { player: PokemonInstance; enemy: PokemonInstance };
  /** The status look each side's Pokémon wears (pass 8), or none. */
  private conds: Record<Side, ConditionLook | null> = { player: null, enemy: null };
  /** Confusion's circling stars, by side (pass 8). */
  private dizzy: Record<Side, DizzyStars | null> = { player: null, enemy: null };
  /** The multi-hit combo counter on screen (pass 12). */
  private comboText: Phaser.GameObjects.Text | null = null;
  /** The first drawn row of each sprite frame (for where a head is). */
  private readonly bodyTops = new Map<string, number>();
  /** Each side's stat stages as the screen has shown them (for the pips; reset when a Pokémon comes in or Haze). */
  private statStages: Record<Side, Record<string, number>> = { player: {}, enemy: {} };
  /** The opposing Pokémon shown as riled up (warned, not yet unleashed or calmed). Presentation only. */
  private riledUid: string | null = null;
  /**
   * Double battles: which spot each side's focused Pokémon stands in (the one in playerSprite /
   * playerBox / shown.player), and the other spot's sprite, box and Pokémon. Null in singles.
   */
  /**
   * Double and triple battles: the focused spot of each side is drawn by playerSprite/enemySprite and playerBox/enemyBox; every
   * other spot has its own entry in `slots` (null at the focused spot). Focus follows the engine (battle/doubles.ts: focus).
   */
  private duo: { size: 2 | 3; focus: Record<Side, Spot>; slots: Record<Side, (DuoOther | null)[]> } | null = null;
  /** Double battles: the spot being given a command, and the commands so far this turn. */
  private cmdSpot: Spot = 0;
  private commands: (SlotCommand | null)[] = [];

  constructor() {
    super('Battle');
  }

  preload(): void {
    // Every party member (switching), the whole enemy team, and the cries.
    const { session } = services();
    const { content } = session;
    const run = session.run;
    const enemies = (run?.battle?.enemyTeam ?? []).flatMap((m) => content.species.get(m.speciesId) ?? []);
    const uie = this.uieArena();
    if (uie) queueAssets(this, [uie, `${uie}.player`, `${uie}.enemy`]);
    preloadPokemon(this, partySpecies(), { back: true, shiny: true, icon: true, cry: true });
    preloadPokemon(this, enemies, { front: true, shiny: true, cry: true });
    // A wild Pokémon may call a friend (SOS): have its art ready.
    if (run?.battle?.kind === 'wild' && !run.battle.raid && !run.battle.totem && !run.battle.doubles) {
      const friends = enemies.flatMap((e) => (sosEntry(e.id) ? [...(sosEntry(e.id)!.allies ?? [e.id])] : [])).flatMap((id) => content.species.get(id) ?? []);
      preloadPokemon(this, friends.filter((f) => !enemies.includes(f)), { front: true, shiny: true, cry: true });
    }
    // Forms they might transform into this battle (Megas for stones you own; any Mega or Primal for the enemy).
    const formsOf = (ids: string[]) => ids.flatMap((id) => content.species.get(id) ?? []);
    const partyForms = (run?.party ?? []).flatMap((m) => [
      ...stoneForms(content, m.speciesId, true).map((o) => o.formId),
      ...[permanentForm(content, run!.inventory, m)?.option.formId ?? []].flat(),
    ]);
    const enemyForms = (run?.battle?.enemyTeam ?? []).flatMap((m) => [...stoneForms(content, m.speciesId, false), ...stoneForms(content, m.speciesId, true)].map((o) => o.formId));
    preloadPokemon(this, formsOf(partyForms), { back: true, shiny: true, cry: true });
    preloadPokemon(this, formsOf(enemyForms), { front: true, shiny: true, cry: true });
    // The opposing trainer's animated sprite and the player's throwing pose (Pokémon Memories), when they have one.
    if (run?.battle) {
      const foeArt = this.trainerArt();
      const mine = this.playerArt();
      const vs = foeArt && this.boss() ? vsCardFor(foeArt.assetId) : null;
      const vsArt = vs ? [vs.card, vs.bar, ...VS_SHARED.map((n) => `vs.shared.${n}`)] : [];
      queueAssets(this, [foeArt ? bossAnimId(foeArt.assetId) : null, mine ? bossBackId(mine) : null, ...vsArt].filter((id): id is string => !!id));
    }
    // Lazy music: the GB Sounds loop if owned, and the victory fanfare this battle would end with.
    if (run?.battle) {
      const gb = itemCount(run.inventory, 'gb-sounds') > 0 ? ['bgm.battle_gb'] : [];
      const raid = this.raidTrack(run.battle);
      const wipe = this.wipeMask();
      queueAssets(this, [...WEATHER_ASSET_IDS, ...(wipe ? [wipeAssetId(wipe)] : []), ...gb, ...(raid ? [raid] : []), victoryTrack({ trainer: run.battle.kind === 'trainer', boss: Boolean(this.boss()), role: this.battleRole() }), ...(this.battleRole() ? [battleTrack({ raidTrack: null, trainer: true, gbSounds: false, role: this.battleRole(), regionId: run.regionOrder.length > 0 ? currentRegion(services().session.content, run).id : undefined })] : [])]);
    }
  }

  create(): void {
    const { session, assets } = services();
    const run = session.run!;
    const battle = run.battle!;
    this.history = [];
    this.historyView = null;
    this.startCameraWatchdog();
    this.input.keyboard?.on('keydown-H', () => this.toggleHistory());
    this.input.keyboard?.on('keydown-P', () => {
      const id = this.bagIds[(this.picker as Picker | null)?.current ?? -1];
      if (id) this.toggleHotbar(id);
    });
    LOG_TABS.forEach((t, i) => this.input.keyboard?.on(`keydown-${i + 1}`, () => this.setLogTab(t.id)));
    // Presentation only: faster tweens and timers; the battle itself is unchanged.
    const speed = { showcase: 0.75, normal: 1, fast: 2, quick: 3 }[session.settings.battleSpeed];
    this.tweens.timeScale = speed;
    this.time.timeScale = speed;
    this.role = this.battleRole();
    this.stadium = this.makeStadium();
    // The same battle always gets the same look (salted by the run and how far it has come), so a reload never changes it.
    this.skinId = screenStyleOf('battle', session.settings.screenStyles, `${run.seed}:${run.log.battlesWon}:${run.log.rewardsTaken.length}`);
    this.skin = battleSkinFor(this.skinId);
    // New look with the mock-up battle screen: the words that pop up over a Pokémon (stat changes, damage) use the skin's font too.
    if (!this.skin) useLookFont(this);
    const gameTrack = battleTrack({
      raidTrack: this.raidTrack(battle),
      trainer: battle.kind === 'trainer',
      role: this.role,
      gbSounds: itemCount(run.inventory, 'gb-sounds') > 0,
      variantKey: `${run.seed}:${run.log.battlesWon}`,
      regionId: run.regionOrder.length > 0 ? currentRegion(services().session.content, run).id : undefined,
    });
    // A made story song (rival, leader, Elite Four, champion) replaces the shared song once its file exists; raids and GB Sounds keep theirs.
    this.baseTrack = this.raidTrack(battle) || itemCount(run.inventory, 'gb-sounds') > 0 ? gameTrack : storyOr(storyBattleMusic(this.role, `${run.seed}:${run.log.battlesWon}`), gameTrack);
    // Story Runs: an Evil Team battle plays that team's own song (Part AD), the leader its final arrangement.
    const teamSong = this.storyTeamSong();
    if (teamSong) this.baseTrack = teamSong;
    // Galar's stadium: gym and League fights play the Galar gym song (it builds turn by turn); the Champion plays the finale song.
    if (this.stadium && !teamSong && services().assets.has(GALAR_STADIUM.music.battle)) this.baseTrack = this.role === 'champion' ? GALAR_STADIUM.music.finalMon : GALAR_STADIUM.music.buildUp;
    // Beta 0.7 Flight North: the Bug-type's return has its own song (the usual song plays until a composed file exists).
    if (battle.flightNorth) this.baseTrack = RETURN_MUSIC;
    this.playingTrack = this.baseTrack;
    // Extra songs load on demand; the default song plays until they arrive.
    const fallback = battleTrack({ raidTrack: null, trainer: battle.kind === 'trainer', role: this.role, gbSounds: false });
    playMusicLazy(this, this.baseTrack, fallback);
    this.startProceduralAudio(battle);
    // S256: emote stickers (Settings > Sticker reactions).
    if (services().session.settings.stickers) addStickerRow(this, () => TRAINER_POS, this.motion);
    this.menu = null;
    this.rxNotice = null;
    this.picker = null;
    this.rxCall = null;
    this.rxShadow = null;
    this.rxRing = null;
    this.rxBag = null;
    this.rxRingTold = new Set();
    this.phWildKey = null;
    this.phWildDex = null;
    this.advance = null;
    this.busy = true;
    this.riledUid = Object.entries(battle.hyper?.rage ?? {}).find(([, r]) => r.state === 'warned')?.[0] ?? null;
    this.playerSprite = null;
    this.enemySprite = null;

    // The stage theme's arena (its first type), or the default field. Elite Four
    // members and champions with a speciality fight in their own type's arena.
    const boss = this.boss();
    const bossType = boss && boss.role !== 'gym' ? boss.types[0] : undefined;
    // The Final Rival fights in the arena of the stage where you first met (rebuilt from the run's stage themes).
    const metTheme = finalRivalArenaTheme(session.content, run, battle.rivalId, ultimateRival(run)?.id === battle.rivalId);
    const arena = bossType ? session.content.arenas[bossType] : metTheme ? arenaFor(session.content, getTheme(session.content, metTheme)) : run.stage ? arenaFor(session.content, getTheme(session.content, run.stage.themeId)) : undefined;
    const legendArena = this.legendArenaOn();
    const raidArena = legendArena ? null : this.raidArena(battle);
    const uie = raidArena || (metTheme && !legendArena) ? null : this.uieArena();
    const bg = raidArena ?? (uie && this.textures.exists(uie) ? uie : arena && assets.has(arena) && this.textures.exists(arena) ? arena : 'bg.battle');
    this.arenaBgKey = assets.has(bg) && this.textures.exists(bg) ? bg : null;
    this.field = this.add.container(0, 0);
    const backLayers: Phaser.GameObjects.Image[] = [];
    const groundLayers: Phaser.GameObjects.Image[] = [];
    if (assets.has(bg)) this.field.add(backLayers[backLayers.push(this.add.image(0, 0, bg).setOrigin(0).setScale(PIXEL_SCALE)) - 1]!);
    else this.field.add(this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x88c070).setOrigin(0));
    // The ground patches each side stands on.
    for (const side of ['enemy', 'player']) {
      const key = `${bg}.${side}`;
      if (assets.has(key) && this.textures.exists(key)) this.field.add(groundLayers[groundLayers.push(this.add.image(0, 0, key).setOrigin(0).setScale(PIXEL_SCALE)) - 1]!);
    }
    addParallax(this, backLayers, groundLayers, this.motion);
    this.arenaLayers = [...backLayers, ...groundLayers];
    // League arenas build up with light: gym beams, Elite Four pillars, the champion's sunburst.
    if (boss) dressArena(this, this.field, this.field.length, boss.role, TYPE_COLORS[boss.types[0] ?? 'normal'] ?? 0xffffff, this.motion);
    // Drifting clouds, bubbles, snow or embers over the arena (EBDX scenery).
    // One preset per type: the stage theme's types (the second adds accents), a specialist's type, or the arena's.
    const stageTypes = bossType ? [bossType] : run.stage ? getTheme(session.content, run.stage.themeId).types : [arenaType(bg)];
    this.arenaTypes = stageTypes.length > 0 ? stageTypes : [arenaType(bg)];
    addAmbience(this, this.field, this.field.length, this.arenaTypes, this.motion);
    // A Legendary world event's own look over its fights (colour wash and drifting particles).
    const legendDef = run.battle?.expedition && run.expedition ? session.content.expeditions.expeditions.find((e) => e.id === run.expedition!.id) : undefined;
    if (legendDef?.legendary) {
      const layer = run.expedition!.node ? run.expedition!.nodes.find((n) => n.id === run.expedition!.node)?.layer ?? 0 : 0;
      const kit = legendKit(session.content, legendDef, layer);
      if (kit) addLegendLook(this, kit, this.motion, 0, this.field);
    }
    if (this.motion !== 'off' && !battle.doubles) {
      const edge = TYPE_COLORS[this.arenaTypes[0] ?? 'normal'] ?? 0xffffff;
      for (const at of [ENEMY_POS, PLAYER_POS]) {
        platformEdgeLight(this, this.field, at.x, at.y + 6, edge, this.motion);
      }
    }
    // Environmental storytelling (catalog 67): crisis weather, villain banners, ruins, lab panels, Shadow miasma.
    const envEvent = run.battle?.event ? session.content.events.get(run.battle.event.eventId) : undefined;
    const envFoe = run.battle ? run.battle.enemyTeam[run.battle.enemyIndex] : undefined;
    addEnvironment(this, this.field, this.field.length, environmentStory({
      crisis: crisisLevel(run),
      legendClues: Number(run.story.flags['ev:legend-clue'] ?? 0),
      themeName: run.stage ? getTheme(session.content, run.stage.themeId).name : '',
      event: envEvent ? { id: envEvent.id, group: envEvent.group } : null,
      shadowFoe: Boolean(envFoe?.shadow),
    }), this.motion);
    if (boss?.role === 'champion') championGlow(this, this.field, this.motion);
    this.weatherLayer = new WeatherLayer(this, this.field, this.motion);
    const groundCount = backLayers.length + groundLayers.length || 1;
    this.wxLook = new WeatherLook({
      scene: this,
      field: this.field,
      under: () => groundCount,
      graded: () => [...backLayers, ...groundLayers],
      level: () => this.clipLevel(),
      shake: (px) => {
        const st = services().session.settings;
        if (st.battleScreenEffects) this.cameras.main.shake(300, (px / GAME_WIDTH) * capFlash(st.shakeIntensity, st.reducedFlash));
      },
      flash: (color, alpha, ms) => this.wxFlash(color, alpha, ms),
    });
    void this.setWeather(run.battle?.weather ?? null, false);
    this.trLook = new TerrainLook({
      scene: this,
      field: this.field,
      under: () => groundCount,
      level: () => this.clipLevel(),
      fxOpts: () => { const h = this.clipHost({}); return { flash: h.flash ?? 1, particles: h.particles ?? true, rate: h.rate ?? 1 }; },
    });
    void this.setTerrain(run.battle?.terrain ?? null, false);
    this.arenaLight = new ArenaLight(this, this.field, this.field.length, this.motion);
    this.arenaPhase = 0;
    // A battle style's floor, tint or whole backdrop, under the Pokémon.
    this.skin?.backdrop?.(this, this.field, this.frameInfo());
    // Greenneedle gn.60: what follows the player shows in the scenery, if it shows at all.
    addFollowedCue(this, this.field, followedCue(run), this.motion, PLAYER_POS);
    addContactShadows(this, this.field, () => this.shadowTargets());
    this.fieldBase = this.field.length;
    this.setupTrainerActor(Boolean(battle.doubles));
    addVignette(this);
    this.fx = new BattleFx(this, {
      field: this.field,
      backgroundIndex: () => this.fieldBase,
      sprite: (side) => (side === 'player' ? this.playerSprite : this.enemySprite),
      mastery: (moveId) => moveRank(session.profile.moveUses?.[moveId] ?? 0),
      fullScreen: (on) => this.rx?.visible(!on),
      numbers: () => ({ show: services().session.settings.damageNumbers, scale: services().session.settings.popupScale }),
      recoil: (side, cue) => this.hitMoment(side, cue),
      stamp: (side, kind) => this.hitStamp(side, kind),
      heal: (side) => this.healMoment(side),
      condition: (side, status, at) => this.condition(side, status, at),
      stat: (side, stat, change) => this.statMoment(side, stat, change),
      ability: (side, ability, label) => this.abilityMoment(side, ability, label),
    });

    this.shown = { player: structuredClone(run.party[battle.activeIndex]!), enemy: structuredClone(currentEnemy(battle)) };
    this.duo = null;
    this.conds = { player: null, enemy: null };
    this.statStages = { player: {}, enemy: {} };
    this.cmdSpot = 0;
    this.commands = [];
    if (battle.doubles) {
      // Two databoxes a side, smaller; the focused spot's box is enemyBox / playerBox.
      const d = battle.doubles;
      // Triple battles always use the Essentials Kit boxes with the long foe box (Kice's pick, Triple 2).
      const trio = Boolean(d.trio);
      const box = (side: Side, spot: Spot) => {
        if (trio) {
          const b = this.makeInfoBox(TRIO_BOX[side][spot]!.x, TRIO_BOX[side][spot]!.y, side === 'player', 'kitLong');
          b.container.setScale(TRIO_BOX.scale);
          return b;
        }
        if (this.skin) return this.makeDuoSkinBox(side, spot);
        const b = this.makeInfoBox(DUO_BOX[side][spot as 0 | 1].x, DUO_BOX[side][spot as 0 | 1].y, side === 'player');
        b.container.setScale(DUO_BOX.scale);
        return b;
      };
      const focus = { player: primarySpot(d, 'player'), enemy: primarySpot(d, 'enemy') };
      this.playerBox = box('player', focus.player);
      this.enemyBox = box('enemy', focus.enemy);
      const slotsOf = (side: Side) =>
        spotsOf(battle).map((spot): DuoOther | null => {
          if (spot === focus[side]) return null;
          const m = monAt({ battle, party: run.party }, side, spot);
          return { sprite: null, box: box(side, spot), mon: m ? structuredClone(m) : null };
        });
      this.duo = { size: trio ? 3 : 2, focus, slots: { player: slotsOf('player'), enemy: slotsOf('enemy') } };
    } else {
      this.enemyBox = this.skin ? this.makeSkinBox(this.skin.layout.foe, false) : this.makeInfoBox(0, 30, false);
      this.playerBox = this.skin ? this.makeSkinBox(this.skin.layout.player, true) : this.makeInfoBox(GAME_WIDTH - 390, MESSAGE_Y - 132, true);
    }
    this.header = this.add.text(GAME_WIDTH - 16, 10, '', textStyle(20, COLORS.textLight, { stroke: '#181818', strokeThickness: 4 })).setOrigin(1, 0);
    // Raid and Totem status sits under the enemy's box, away from the boss sprite.
    this.momentumText = this.add.text(GAME_WIDTH - 16, MESSAGE_Y - 160, '', textStyle(18, COLORS.textLight, { stroke: '#181818', strokeThickness: 4 })).setOrigin(1, 0);
    this.status = this.add.text(12, 186, '', textStyle(18, COLORS.textLight, { stroke: '#181818', strokeThickness: 4, wordWrap: { width: 470 } }));
    this.updateHeader();

    // PokeRogue's message bar along the bottom, with the command window on its right.
    // A glossy glass message bar (Aero), with the command window on its right.
    const L = this.skin?.layout;
    const barRect: Rect | null = L ? L.bar : null;
    this.storyBar = null;
    if (!L) {
      // Kice's pick (text box mockup #5): the Story Portrait bar, full width along the bottom.
      this.storyBar = storyBar(this, 0, MESSAGE_Y + 6, GAME_WIDTH, GAME_HEIGHT - MESSAGE_Y - 6, this.motion);
      slideIn(this, this.storyBar.container, 0, 60, this.motion);
    } else if (barRect) {
      const bar = this.skin?.messageBar ? (this.skin.messageBar(this, barRect) as Phaser.GameObjects.Graphics) : drawGlass(this, barRect[0], barRect[1], barRect[2], barRect[3], { radius: 22 });
      slideIn(this, bar, 0, 60, this.motion);
    }
    const cw: Rect | null = L ? L.command : [COMMAND_X, MESSAGE_Y + 14, GAME_WIDTH - COMMAND_X - 16, GAME_HEIGHT - MESSAGE_Y - 28];
    this.commandWindow = (cw && this.skin?.commandWindow ? this.skin.commandWindow(this, cw) : cw && !this.skin ? drawGlass(this, cw[0], cw[1], cw[2], cw[3], { tint: AERO.glassLow, rim: AERO.sky, glow: false, radius: 18 }) : this.add.graphics()).setVisible(false);
    const msg = L?.message ?? { x: 36, y: MESSAGE_Y + 40, w: 520, size: 30 };
    this.message = this.add.text(msg.align === 'center' ? msg.x + msg.w / 2 : msg.x, msg.y, '', this.skinText(msg.size, this.panelText, { wordWrap: { width: msg.w }, lineSpacing: 6, align: msg.align ?? 'left' })).setOrigin(msg.align === 'center' ? 0.5 : 0, 0);
    this.msgBaseSize = undefined;
    const info = L?.moveInfo ?? { x: COMMAND_X + 30, y: MESSAGE_Y + 24 };
    this.moveInfo = this.add.text(info.x, info.y, '', this.skinText(L ? Math.min(20, msg.size) : 24, this.panelText, { lineSpacing: 8 })).setVisible(false);
    this.skinHud = this.skin?.frame?.(this, this.frameInfo()) ?? null;
    if (L?.header) this.header.setPosition(L.header.x, L.header.y);
    // Style overlays (letterbox, scanlines) sit under the run header.
    if (this.skin?.frame) this.header.setDepth(8);

    this.autoRunning = false;
    this.autoCancel = false;
    this.infoOpen = false;
    this.infoPanel = null;
    this.tabs = new BattleTabs(this, { motion: this.motion, onPage: (p) => this.gotoPage(p), onAuto: () => this.toggleAuto(), onInfo: () => this.toggleInfo() }, this.tabsAt.x, this.tabsAt.y);
    this.tabs.show(false);
    this.note = this.add.text(12, 6, '', textStyle(18, COLORS.textLight, { stroke: '#181818', strokeThickness: 4, wordWrap: { width: 560 } })).setOrigin(0, 0).setDepth(130).setAlpha(0);
    this.input.keyboard?.on('keydown-Q', () => (this.phWildKey ? this.phWildKey() : this.gotoPage(this.tabs.neighbour(-1))));
    this.input.keyboard?.on('keydown-E', () => this.gotoPage(this.tabs.neighbour(1)));
    this.input.keyboard?.on('keydown-I', () => this.toggleInfo());
    this.input.keyboard?.on('keydown-T', () => this.toggleAuto());
    this.input.keyboard?.on('keydown-G', () => this.phOpenGimmicks());
    onInputAction(this, (a) => this.handleInput(a));
    this.input.on('pointerdown', () => this.advance?.());
    this.rx = null;
    this.rxCast = null;
    this.rxData = null;
    this.rxSig = '';
    this.rxInfo = '';
    if (reduxOn() && !this.skin) this.mountRx();

    void this.intro();
  }

  /** Text colour on the message bar and command window (the battle style's, else light). */
  private get panelText(): string {
    return this.skin?.text ?? COLORS.textLight;
  }

  /** Text colour on menu buttons. */
  private get btnText(): string {
    return this.skin?.buttonText ?? COLORS.textLight;
  }

  /** Where the page tabs sit (the battle style's place, else over the command window). */
  private get tabsAt(): { x: number; y: number } {
    return this.skin?.layout.tabs ?? { x: COMMAND_X + 8, y: MESSAGE_Y + 1 };
  }

  /** A text style in the battle style's font (the pixel font when it has none). */
  private skinText(size: number, color: string | undefined, extra: Phaser.Types.GameObjects.Text.TextStyle = {}): Phaser.Types.GameObjects.Text.TextStyle {
    const base = textStyle(size, color, extra);
    return this.skin?.font ? { ...base, fontFamily: this.skin.font, fontSize: `${size}px`, shadow: undefined } : base;
  }

  /** A battle style's menu settings for Menu (position, grid, placement, tilt). */
  private specOf(layout: MenuLayout, n: number, moves = 0): MenuSpec {
    return typeof layout === 'function' ? layout(n, moves) : layout;
  }

  private menuSpec(layout: MenuLayout, n: number, moves = 0) {
    const spec = this.specOf(layout, n, moves);
    return {
      focusColor: spec.focusColor,
      x: spec.x,
      y: spec.y,
      columns: spec.columns,
      itemWidth: spec.itemWidth,
      itemHeight: spec.itemHeight,
      fontSize: spec.fontSize,
      align: spec.align,
      middle: true,
      inset: spec.inset,
      lift: spec.lift,
      cursor: spec.bare ? ('none' as const) : ('default' as const),
      place: spec.place ? (i: number) => spec.place!(i, n) : undefined,
      angle: spec.angle ? (i: number) => spec.angle!(i, n) : undefined,
    };
  }

  /** What a battle style may show around the arena. */
  private frameInfo(): BattleFrameInfo {
    const { content, settings } = services().session;
    const battle = this.run.battle!;
    const foe = currentEnemy(battle);
    const mine = this.run.party[battle.activeIndex];
    return {
      player: mine ? this.speciesName(mine) : '',
      foe: foe ? this.speciesName(foe) : '',
      trainer: this.trainerTitle(),
      turn: battle.turn,
      region: this.run.regionOrder.length > 0 ? currentRegion(content, this.run).name : '',
      motion: this.motion,
      reducedFlash: settings.reducedFlash,
      party: this.run.party.map((m) => ({ speciesId: m.speciesId, fainted: m.hp <= 0 })),
    };
  }

  /**
   * How a transformation cutscene plays, from the animation registry (core/presentation/transformAnims.ts):
   * its own switch (Mega/Z/Dynamax/Tera cutscenes, or Evolution animations), reduced motion, speed and strength.
   * Off just swaps the form. Presentation only.
   */
  private cineFeel(kind: CineKind): { motion: MotionLevel; speed: number; intensity: number; shake: number } {
    const s = services().session.settings;
    const plan = resolveAnim(transformAnimId(kind), animSettingsFrom(s));
    if (!plan?.play) return { motion: 'off', speed: 1, intensity: 0, shake: 0 };
    // The scene's clock already runs at the battle speed; the animation speed setting stretches or shortens it.
    const speed = 1 / animationTimeScale(s);
    if (plan.reduced) return { motion: 'reduced', speed, intensity: 0, shake: 0 };
    return { motion: 'full', speed, intensity: plan.flash, shake: plan.shake };
  }

  /** How much motion the player allows (the battle animation setting). */
  private get motion(): MotionLevel {
    return services().session.settings.battleAnimations;
  }

  private get run(): RunState {
    return services().session.run!;
  }

  /** Tag Team: "Player 1: " in front of the prompt, or nothing. */
  private pilotTag(mon: PokemonInstance): string {
    const pilot = tagPilot(this.run.rules, this.run.party.indexOf(mon));
    return pilot ? `${pilot}: ` : '';
  }

  private activeMon(): PokemonInstance {
    const run = this.run;
    if (run.battle?.doubles) return monAt({ battle: run.battle, party: run.party }, 'player', this.cmdSpot) ?? run.party[run.battle.activeIndex]!;
    return run.party[run.battle!.activeIndex]!;
  }

  // ---------- double battles ----------

  /** Where a side's focused Pokémon stands. */
  private spotXY(side: Side): { x: number; y: number } {
    if (!this.duo) return side === 'player' ? PLAYER_POS : ENEMY_POS;
    return this.posOf(side, this.duo.focus[side]);
  }

  /** Where a spot stands in a double or triple battle. */
  private posOf(side: Side, spot: Spot): { x: number; y: number } {
    return this.duo?.size === 3 ? TRIO_POS[side][spot]! : DUO_POS[side][spot as 0 | 1];
  }

  /** The unfocused spots of a side that have a box (with or without a Pokémon in them), left to right. */
  private otherSlots(side: Side): { spot: Spot; o: DuoOther }[] {
    return (this.duo?.slots[side] ?? []).flatMap((o, spot) => (o ? [{ spot: spot as Spot, o }] : []));
  }

  /** The Pokémon in the other spots of a side, left to right (for "sent out X and Y" lines). */
  private otherMons(side: Side): PokemonInstance[] {
    return this.otherSlots(side).flatMap(({ o }) => (o.mon ? [o.mon] : []));
  }

  /** "A", "A and B", "A, B and C". */
  private nameList(mons: PokemonInstance[]): string {
    const names = mons.map((m) => this.speciesName(m));
    return names.length <= 1 ? (names[0] ?? '') : `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`;
  }

  /** The sprites the contact shadows follow, with the y each stands at (flyers and levitators float). */
  /** Re-applies the battle style's sprite look (Ink's white silhouettes) after move flashes clear the tint. */
  private reskin(): void {
    const look = this.skin?.sprite;
    if (!look) return;
    for (const t of this.shadowTargets()) if (t.visual?.active) look(t.visual);
  }

  private frontEdgeMask?: Phaser.Display.Masks.GeometryMask;

  /**
   * Whether your Pokémon is cut at the arena's front edge. Only where a bar hides the cut: the Old bar, a battle style with a bar, and the
   * New look's two layouts whose text box reaches up to that edge. The New look's top-bar and side-menu layouts leave the field open there.
   */
  private standClipped(): boolean {
    if (this.skin) return Boolean(this.skin.layout.bar);
    return !reduxOn() || reduxLayout(reduxSkinIndex(services().session.settings.reduxSkin), 4) < 2;
  }

  /** Clips your Pokémon at the arena's front edge (the top of the message bar). Built once per battle. */
  private standMask(): Phaser.Display.Masks.GeometryMask {
    if (!this.frontEdgeMask?.geometryMask?.scene) {
      const shape = this.make.graphics({}, false).fillStyle(0xffffff).fillRect(-GAME_WIDTH, -GAME_HEIGHT, GAME_WIDTH * 3, GAME_HEIGHT + MESSAGE_Y);
      this.frontEdgeMask = shape.createGeometryMask();
    }
    return this.frontEdgeMask;
  }

  /** Flying types and levitators hover over their platform (presentation only). */
  private floats(mon: PokemonInstance | null | undefined): boolean {
    if (!mon) return false;
    const content = services().session.content;
    const sp = content.species.get(mon.speciesId);
    return Boolean(sp?.types.includes('flying') || ['levitate', 'eelevate'].includes(abilityOf(content, mon) ?? ''));
  }

  private shadowTargets(): ShadowTarget[] {
    const floats = (mon: PokemonInstance | null | undefined) => this.floats(mon);
    const list: ShadowTarget[] = [];
    for (const side of ['player', 'enemy'] as const) {
      const sprite = side === 'player' ? this.playerSprite : this.enemySprite;
      list.push({ visual: sprite, homeY: this.spotXY(side).y, flyer: floats(this.shown[side]) });
      for (const { spot, o } of this.otherSlots(side)) list.push({ visual: o.sprite, homeY: this.posOf(side, spot).y, flyer: floats(o.mon) });
    }
    return list;
  }

  /** Follows the engine's focus: the events after this are about `uid` (battle/doubles.ts). */
  private focusOn(side: Side, uid: string): void {
    const duo = this.duo;
    if (!duo || this.shown[side].uid === uid) return;
    let spot = this.otherSlots(side).find(({ o }) => o.mon?.uid === uid)?.spot;
    if (spot === undefined) {
      // Someone new in another spot (sent in while the screen looked elsewhere): adopt it where the battle has it.
      const real = this.findLive(side, uid);
      const battle = this.run.battle;
      if (!real || !battle?.doubles) return;
      const view = { battle, party: this.run.party };
      spot = spotsOf(battle).find((s) => s !== duo.focus[side] && monAt(view, side, s)?.uid === uid) ?? (duo.size === 2 ? this.otherSlots(side)[0]?.spot : undefined);
      if (spot === undefined) return;
      duo.slots[side][spot]!.mon = structuredClone(real);
    }
    const o = duo.slots[side][spot]!;
    const from = duo.focus[side];
    if (side === 'player') {
      [this.playerSprite, o.sprite] = [o.sprite, this.playerSprite];
      [this.playerBox, o.box] = [o.box, this.playerBox];
    } else {
      [this.enemySprite, o.sprite] = [o.sprite, this.enemySprite];
      [this.enemyBox, o.box] = [o.box, this.enemyBox];
    }
    const mon = o.mon!;
    o.mon = this.shown[side];
    this.shown[side] = mon;
    duo.slots[side][from] = o;
    duo.slots[side][spot] = null;
    duo.focus[side] = spot;
  }

  /** The spot where the screen draws a Pokémon (double and triple battles), or null. */
  private shownSpot(side: Side, uid: string): Spot | null {
    if (!this.duo) return null;
    if (this.shown[side].uid === uid) return this.duo.focus[side];
    return this.otherSlots(side).find(({ o }) => o.mon?.uid === uid)?.spot ?? null;
  }

  /** Ally Switch: in doubles the two Pokémon trade spots; in triples the two edges do (the user is the focused one). */
  private async allySwitch(side: Side): Promise<void> {
    const duo = this.duo;
    if (!duo) return;
    const from = duo.focus[side];
    const to: Spot = duo.size === 3 ? ((2 - from) as Spot) : from === 0 ? 1 : 0;
    if (to !== from) await this.exchangeSpots(side, from, to);
  }

  /** Two spots of a side trade Pokémon (Ally Switch, Shift, centring), with a little hop. Boxes follow their Pokémon. */
  private async exchangeSpots(side: Side, a: Spot, b: Spot): Promise<void> {
    const duo = this.duo;
    if (!duo || a === b) return;
    type Entry = { sprite: Visual | null; box: InfoBox; main: boolean; o: DuoOther | null };
    const at = (spot: Spot): Entry => {
      const o = duo.slots[side][spot];
      if (o) return { sprite: o.sprite, box: o.box, main: false, o };
      return side === 'player' ? { sprite: this.playerSprite, box: this.playerBox, main: true, o: null } : { sprite: this.enemySprite, box: this.enemyBox, main: true, o: null };
    };
    const ea = at(a);
    const eb = at(b);
    const moves: Promise<void>[] = [];
    const glide = (v: Visual | null, p: { x: number; y: number }) => {
      if (!v) return;
      this.tweens.killTweensOf(v);
      if (this.motion === 'off') v.setPosition(p.x, p.y);
      else moves.push(tween(this, { targets: v, x: p.x, y: p.y, duration: 380, ease: 'Back.easeInOut' }));
    };
    glide(ea.sprite, this.posOf(side, b));
    glide(eb.sprite, this.posOf(side, a));
    const pa = { x: ea.box.container.x, y: ea.box.container.y };
    ea.box.container.setPosition(eb.box.container.x, eb.box.container.y);
    eb.box.container.setPosition(pa.x, pa.y);
    // The entries change places; the focused one keeps being drawn by the main fields.
    duo.slots[side][a] = eb.o;
    duo.slots[side][b] = ea.o;
    if (ea.main) duo.focus[side] = b;
    else if (eb.main) duo.focus[side] = a;
    await Promise.all(moves);
    for (const v of [ea.sprite, eb.sprite]) if (v) breathe(this, v, this.motion, 0);
  }

  /** Loads a species' front art (and cry) now, for a Pokémon that was not known when the battle started (the Champion's last stand). */
  private async ensureArt(speciesId: string, back = false): Promise<void> {
    try {
      const sp = services().session.content.species.get(speciesId);
      if (sp) await loadAssets(this, pokemonArtIds([sp], { front: !back, back, shiny: true, cry: true }));
    } catch {
      /* the picture just stays a placeholder */
    }
  }

  /** Brings both spots' boxes and sprites in line with the battle after a turn. */
  private async syncDuo(): Promise<void> {
    const duo = this.duo;
    const battle = this.run.battle;
    if (!duo || !battle?.doubles) return;
    const view = { battle, party: this.run.party };
    for (const side of ['player', 'enemy'] as const) {
      const focused = primarySpot(battle.doubles, side);
      const want = monAt(view, side, focused);
      if (want) this.focusOn(side, want.uid);
      for (const { spot: otherSpot, o } of this.otherSlots(side)) {
      const real = monAt(view, side, otherSpot);
      if (!real) {
        o.box.container.setVisible(false);
        this.dropSprite(o.sprite);
        o.sprite = null;
        o.mon = null;
      } else {
        o.mon = structuredClone(real);
        this.disguise(side, o.mon);
        // A Pokémon that came into the other spot mid-battle gets its picture too (it used to show a box and nothing else).
        if (o.mon.hp > 0 && !o.sprite && side === 'enemy') {
          await this.ensureArt(o.mon.speciesId);
          const keep = this.shown[side].uid;
          this.focusOn(side, o.mon.uid);
          this.showSprite(side, this.shown[side], true);
          this.focusOn(side, keep);
        }
        if (o.mon.hp > 0) await this.refreshInfoBox(o.box, o.mon, false);
      }
      }
      const cur = monAt(view, side, duo.focus[side]);
      if (cur) {
        this.shown[side] = structuredClone(cur);
        this.disguise(side, this.shown[side]);
        await this.refreshInfoBox(side === 'player' ? this.playerBox : this.enemyBox, this.shown[side], false);
      }
    }
  }

  /** Shows both spots of a side (the battle's start or a reload). */
  private async showDuoSide(side: Side, cry: boolean): Promise<void> {
    // Draw the other spots first: swap focus in, draw, swap back.
    const uid = this.shown[side].uid;
    for (const mon of this.otherMons(side)) {
      this.focusOn(side, mon.uid);
      if (this.shown[side].hp > 0) {
        this.showSprite(side, this.shown[side], cry);
        await this.refreshInfoBox(side === 'player' ? this.playerBox : this.enemyBox, this.shown[side], false);
      }
      this.focusOn(side, uid);
    }
    if (this.shown[side].hp > 0) {
      this.showSprite(side, this.shown[side], cry);
      await this.refreshInfoBox(side === 'player' ? this.playerBox : this.enemyBox, this.shown[side], false);
    }
  }

  /** Remembers what the foe has shown (display only; no battle state is touched). */
  private noteFoeReveal(what: { ability?: string; item?: string }): void {
    const uid = this.run.battle ? currentEnemy(this.run.battle).uid : null;
    if (!uid) return;
    const r = this.foeReveals.get(uid) ?? {};
    if (what.ability) r.ability = what.ability;
    if (what.item) r.items = [...new Set([...(r.items ?? []), what.item])];
    this.foeReveals.set(uid, r);
  }

  /** Illusion: the shown copy keeps looking like the species it copies until the disguise breaks. */
  private disguise(side: 'player' | 'enemy', mon: PokemonInstance): void {
    const vol = side === 'player' ? this.run.battle?.playerVolatile : this.run.battle?.enemyVolatile;
    if (vol?.illusion) mon.speciesId = vol.illusion;
  }

  /** Blindfold Bout: the foe is hidden (a silhouette called ???) until it has used a move. Display only. */
  private foeHidden(mon: PokemonInstance): boolean {
    const b = this.run?.battle;
    return Boolean(b?.eventRule?.hiddenFoe && !b.enemyVolatile?.lastMove && b.enemyTeam[b.enemyIndex]?.uid === mon.uid);
  }

  /** Magician's Misdirection: the species name shown for the foe until it has used a move. */
  private decoyName(mon: PokemonInstance): string | null {
    const b = this.run?.battle;
    const decoy = b?.eventRule?.decoyFoe;
    if (!decoy || b.enemyVolatile?.lastMove || b.enemyTeam[b.enemyIndex]?.uid !== mon.uid) return null;
    return services().session.content.species.get(decoy)?.name ?? null;
  }

  private speciesName(mon: PokemonInstance): string {
    if (this.foeHidden(mon)) return '???';
    const decoy = this.decoyName(mon);
    if (decoy) return decoy;
    return getSpecies(services().session.content, mon.speciesId).name;
  }

  /** The gym leader, Elite Four member or champion in this battle (null for anyone else). */
  private boss(): BossInfo | null {
    const trainer = this.run.battle?.trainer;
    const role = trainer ? bossRoleForClass(trainer.classId) : null;
    return trainer?.leaderId && role ? bossInfo(services().session.content, role, trainer.leaderId) : null;
  }

  /** Set in `create`: the battle can be cleared from the run before the win song plays. */
  private role: BattleRole | undefined;
  /** Galar Gym Challenge stadium presentation (crowd, camera cuts, Champion host); null elsewhere. */
  private stadium: StadiumDirector | null = null;
  /** The battle's normal song, and the one playing now (the low-HP song swaps in while the lead is in danger). */
  private baseTrack = '';
  private playingTrack = '';

  /** The catalog song for a Story Run Evil Team battle (the trainer's name is the team rank's name), or null. Music only. */
  private storyTeamSong(): string | null {
    const { content } = services().session;
    const name = this.run.battle?.trainer?.name;
    if (!name || !isStoryCampaign(content, this.run.campaignId)) return null;
    const team = evilTeam(content, this.run);
    const rank = team ? Object.entries(team.ranks).find(([, r]) => r.name === name)?.[0] : undefined;
    const id = team && rank ? storyTeamTrack(team.id, rank) : null;
    return id ? storyAssetId(id, (a) => services().assets.has(a)) : null;
  }

  /** Rival, gym leader, Elite Four, champion or final boss (null for wild and ordinary trainer fights). Music only. */
  private battleRole(): BattleRole | undefined {
    const battle = this.run.battle;
    if (!battle?.trainer) return undefined;
    const boss = this.boss();
    if (boss) return boss.role === 'champion' && isFinalBoss(services().session.content, this.run) ? 'final' : boss.role === 'elite' ? 'elite' : boss.role === 'champion' ? 'champion' : 'gym';
    return battle.rivalId || battle.rival ? 'rival' : undefined;
  }

  private trainerTitle(): string | null {
    const trainer = this.run.battle?.trainer;
    if (!trainer) return null;
    const boss = this.boss();
    // A rival standing in for this boss (left-out 5.5) keeps the role's title with its own name.
    if (boss && this.run.battle?.rivalId) return `${boss.title.replace(boss.name, '').trim()} ${trainer.name}`.trim();
    if (boss) return boss.title;
    const cls = services().session.content.trainers.get(trainer.classId);
    return cls ? `${cls.name} ${trainer.name}` : trainer.name;
  }

  /** The player's own trainer picture (the chosen trainer), for the throwing pose. */
  private playerArt(): string | null {
    return services().session.content.archetypes.get(this.run.archetypeId)?.spriteAssetId ?? null;
  }

  // ---------- animation redesign: battle basics (plans/animation-redesign, core/presentation/motionBasics) ----------

  /** How much a motion clip may do: the battle animation setting, or nothing with Disable all animations. */
  private clipLevel(): ClipLevel {
    const st = services().session.settings;
    return st.disableAllAnimations ? 'off' : st.battleAnimations;
  }

  /** What every motion clip gets from the settings: flash strength, particles and the animation speed. */
  private clipHost(parts: Record<string, ClipPart>, more: Pick<ClipHost, 'cue' | 'dim'> = {}): ClipHost {
    const st = services().session.settings;
    const look = animSettingsFrom(st);
    return { parts, ...more, flash: st.reducedFlash || !st.battleScreenEffects ? 0 : look.intensity, particles: !st.reduceParticles, rate: 1 / animationTimeScale(st) };
  }

  /** Your trainer steps in and throws. Resolves with the hand's place the moment the ball leaves it (null: no trainer, or nothing may move). */
  private async throwMoment(): Promise<Point | null> {
    const actor = await this.trainerIn();
    if (!actor) return null;
    return new Promise<Point | null>((resolve) => {
      void actor.play('sendOut', { onRelease: (from) => resolve(from) }).then(() => {
        resolve(null);
        this.trainerOut();
      });
    });
  }

  /**
   * Send-out (redesign pass 2): the ball arcs in from the hand, lands, bounces once and bursts; the Pokémon
   * pops out white, stretches up, lands flat and wide, and settles. Reduced: a short throw and a ring. Off: it is just there.
   */
  private async sendMoment(side: Side, mon: PokemonInstance, from: Point | null, onPlate?: () => void): Promise<void> {
    const level = this.clipLevel();
    const at = this.spotXY(side);
    const start = from ?? throwFromSpot(side);
    const ballId = side === 'player' ? mon.caughtBall ?? DEFAULT_BALL : DEFAULT_BALL;
    const ball = level === 'off' ? null : ballVisual(this, ballId, start.x, start.y).setDepth(31).setAlpha(0);
    let visual: Visual | null = null;
    const show = (): void => {
      if (visual) return;
      visual = this.showSprite(side, mon, true, false);
      ballOpenEffect(this, ballId, at.x, at.y - 50, this.motion);
    };
    const run = playClip(this, sendClip({ x: at.x, y: at.y, h: 0, side }, start, level), this.clipHost({ mon: { kind: 'mon', get: () => visual }, ball: { kind: 'free', get: () => ball } }, {
      cue: (name) => {
        if (name === 'throw') playSfx(this, 'se.ball_throw');
        if (name === 'open') show();
        if (name === 'plate') onPlate?.();
      },
    }));
    await run.done;
    ball?.destroy();
    show();
    const shown = visual as Visual | null;
    if (shown?.active) this.standUp(shown, mon);
  }

  /**
   * The info bar tucks away during a switch (redesign pass 2): yours drops below the screen, the foe's slides off
   * to the left, and it is hidden in its own place, so the next refresh brings it back with the new name. Singles
   * only (in doubles the bars belong to several Pokémon). Presentation only.
   */
  private tuckBox(side: Side): void {
    if (this.duo) return;
    const box = side === 'player' ? this.playerBox : this.enemyBox;
    const c = box?.container;
    if (!c?.visible) return;
    const home = { x: c.x, y: c.y };
    const hide = (): void => {
      if (!c.active) return;
      c.setVisible(false).setPosition(home.x, home.y);
    };
    if (this.clipLevel() === 'off') return hide();
    this.tweens.add({ targets: c, ...(side === 'player' ? { y: home.y + 140 } : { x: home.x - 460 }), duration: 160 * animationTimeScale(services().session.settings), ease: 'Quad.easeIn', onComplete: hide });
  }

  /**
   * Recall (redesign pass 2 + 4): the ball is held out, the Pokémon turns red, braces, is pulled thin up the
   * beam and the ball jolts as it catches. Reduced: red, the beam, a plain shrink. Off: it is just gone.
   */
  private async recallMoment(side: Side, sprite: Visual, hand: Point | null): Promise<void> {
    if (sprite instanceof Phaser.GameObjects.Sprite) standStill(this, sprite);
    const level = this.clipLevel();
    const at = hand ?? recallBallSpot(side);
    const mon = this.shown[side];
    const ball = level === 'off' ? null : ballVisual(this, (side === 'player' ? mon?.caughtBall : null) ?? DEFAULT_BALL, at.x, at.y).setDepth(31).setAlpha(0);
    const h = sprite instanceof Phaser.GameObjects.Sprite ? sprite.displayHeight * sprite.originY : 120;
    const run = playClip(this, recallClip({ x: sprite.x, y: sprite.y, h, side }, at, level), this.clipHost({ mon: { kind: 'mon', get: () => sprite }, ball: { kind: 'free', get: () => ball } }, {
      cue: (name) => {
        if (name === 'catch') playSfx(this, 'se.ball_catch', 0.6);
        if (name === 'tuck') this.tuckBox(side);
      },
    }));
    await run.done;
    ball?.destroy();
    if (sprite.active) sprite.setAlpha(0);
    run.rest('mon');
  }

  /**
   * Faint (redesign passes 11, 2 and 7): a stagger back, a sway, the knees give, then it sinks into the
   * ground with dust and its base goes dark. Reduced: it only sinks. Off: it is just gone.
   */
  private async faintMoment(side: Side, sprite: Visual): Promise<void> {
    // It falls from where it stands, not from the top of a hover or breath.
    if (sprite instanceof Phaser.GameObjects.Sprite) standStill(this, sprite);
    this.tweens.killTweensOf(sprite);
    const ground = this.spotXY(side).y;
    const run = playClip(this, faintClip({ x: sprite.x, y: ground, h: 0, side }, this.clipLevel()), this.clipHost({ mon: { kind: 'mon', get: () => sprite } }, { dim: (fx) => this.dimBase(side, fx.d) }));
    await run.done;
    if (sprite.active) sprite.setAlpha(0);
    run.rest('mon');
  }

  /** The fainted side's base goes dark (redesign pass 7) until its next Pokémon is shown. */
  private dimBase(side: Side, ms: number): void {
    this.liftBaseShade(side);
    if (this.duo) return;
    const at = this.spotXY(side);
    const shade = this.add.ellipse(at.x, at.y + 4, 200, 46, 0x000000, 0);
    this.field.addAt(shade, this.fieldBase);
    this.baseShade[side] = shade;
    if (ms <= 0) shade.setFillStyle(0x000000, 0.4);
    else this.tweens.add({ targets: shade, fillAlpha: 0.4, duration: ms });
  }

  private liftBaseShade(side: Side): void {
    const shade = this.baseShade[side];
    delete this.baseShade[side];
    if (!shade?.active) return;
    this.tweens.killTweensOf(shade);
    if (this.motion === 'off') shade.destroy();
    else this.tweens.add({ targets: shade, fillAlpha: 0, duration: 200, onComplete: () => shade.destroy() });
  }

  /** Where exp lights fly to: the end of your Exp bar, or the mockup's place when another look draws the bar. */
  private expBarPoint(): Point {
    const c = this.playerBox?.container;
    return c?.active && c.visible && c.alpha > 0.5 ? { x: c.x + 250, y: c.y + 118 } : { x: 860, y: 506 };
  }

  /**
   * Your trainer only shows for throws, recalls and the end of the battle (Kice 2026-11-06): it slides back in
   * from the left for the moment, then steps off again (trainerOut). Presentation only.
   */
  private async trainerIn(): Promise<PlayerTrainerActor | null> {
    const actor = this.trainerActor;
    if (!actor) return null;
    this.trainerAway?.remove();
    this.trainerAway = null;
    const s = actor.sprite;
    this.tweens.killTweensOf(s);
    s.setVisible(true).setAlpha(1);
    if (s.x === this.trainerHomeX) return actor;
    if (this.motion === 'off') s.x = this.trainerHomeX;
    else await tween(this, { targets: s, x: this.trainerHomeX, duration: 520, ease: 'Sine.easeOut' });
    return actor;
  }

  /** The trainer steps off screen a moment after a throw (a following recall or throw cancels it). */
  private trainerOut(delay = 400): void {
    const actor = this.trainerActor;
    if (!actor) return;
    this.trainerAway?.remove();
    this.trainerAway = this.time.delayedCall(delay, () => {
      this.trainerAway = null;
      const s = actor.sprite;
      if (!s.active) return;
      const hide = () => s.setVisible(false).setX(TRAINER_OFF_X).setAlpha(1);
      // As in the reference, your trainer fades out and drifts off rather than sliding away at full strength.
      if (this.motion === 'off') hide();
      else this.tweens.add({ targets: s, x: s.x - 60, alpha: 0, duration: 380, ease: 'Quad.easeIn', onComplete: hide });
    });
  }

  /**
   * Draws the player trainer (Look A, Overhaul P2) at the left of the player's platform for the opening throw; it then leaves (trainerOut). Trainers with their own
   * throwing sprite keep the older opening throw; in doubles the same trainer throws both balls. Skip: Enter, Space or a tap.
   */
  private setupTrainerActor(_doubles: boolean): void {
    // Kice 2026-11-17: the custom Look A trainer no longer shows in battle. Trainers with their own back sprite throw with it, the rest borrow Hilda's (ownBackThrow).
    this.trainerActor = null;
    this.trainerReady = Promise.resolve();
  }

  /** Doubles opening: your trainer throws one ball to each of your two spots, then steps off. Presentation only. */
  private async duoThrowPose(): Promise<void> {
    if (this.trainerReady) await this.trainerReady;
    const duo = this.duo;
    if (!duo) return;
    if (!this.trainerActor) return this.ownBackThrow();
    const actor = await this.trainerIn();
    if (!actor) return;
    const focus = duo.focus.player;
    const throws: Array<{ mon: PokemonInstance; spot: Spot }> = [{ mon: this.shown.player, spot: focus }];
    for (const { spot, o } of this.otherSlots('player')) if (o.mon) throws.push({ mon: o.mon, spot });
    throws.sort((a, b) => a.spot - b.spot);
    for (const t of throws) {
      if (t.mon.hp <= 0) continue;
      const ball = t.mon.caughtBall ?? DEFAULT_BALL;
      const at = this.posOf('player', t.spot);
      await actor.play('sendOut', {
        target: { x: at.x, y: at.y - 50 },
        makeBall: (x, y) => ballVisual(this, ball, x, y),
        onLand: (p) => ballOpenEffect(this, ball, p.x, p.y, this.motion),
      });
    }
    this.trainerOut();
  }

  /**
   * The player's trainer throws out the first Pokémon (Gen 4/5 back sprite, Pokémon Memories), then slides away.
   * Presentation only: skipped when motion is off or the trainer has no back sprite.
   */
  private async throwPose(): Promise<Point | null> {
    if (this.trainerReady) await this.trainerReady;
    if (this.trainerActor) return this.throwMoment();
    await this.ownBackThrow();
    return null;
  }

  /** Trainers with their own throwing sprite: it shows at the left for a beat, then slides away (singles and doubles). */
  private async ownBackThrow(): Promise<void> {
    const mine = this.playerArt();
    if (!mine || this.motion === 'off') return;
    const art = throwKind(mine) === 'own' ? mine : 'boss.hilda';
    const back = trainerBackVisual(this, art, TRAINER_POS.x - 90, MESSAGE_Y + 4, 260);
    if (!back) return;
    back.setDepth(5);
    await new Promise<void>((done) => this.time.delayedCall(this.motion === 'full' ? 520 : 200, done));
    await tween(this, { targets: back, x: -200, alpha: 0, duration: 320, ease: 'Quad.easeIn' });
    back.destroy();
  }

  /** The opposing trainer's sprite asset and a fallback label. */
  private trainerArt(): { assetId: string; label: string } | null {
    const trainer = this.run.battle?.trainer;
    if (!trainer) return null;
    const content = services().session.content;
    const boss = this.boss();
    const standIn = boss && this.run.battle?.rivalId ? this.run.story.rivals.find((r) => r.id === this.run.battle?.rivalId) : undefined;
    const standInClass = standIn ? content.trainers.get(standIn.classId) : undefined;
    if (standInClass) return { assetId: standInClass.spriteAssetId, label: trainer.name };
    if (boss) return { assetId: boss.spriteAssetId, label: boss.name };
    // Beta 0.6: a format's named foe (Oracle Sabrina, Giovanni) is drawn as that character, not as the class stand-in.
    const named = trainer.spriteBoss ? content.bosses.get(trainer.spriteBoss) : undefined;
    if (named) return { assetId: named.sprites.default, label: trainer.name };
    // Poli-Pond: the bully "trainer" is a Pokémon, drawn with its own front sprite.
    const mon = trainer.spritePokemon ? content.species.get(trainer.spritePokemon) : undefined;
    if (mon) return { assetId: pokemonAssetIds(mon.assets).front, label: trainer.name };
    const cls = content.trainers.get(trainer.classId);
    // Beta 4.4: a rival is drawn as its own character (Silver, Hop, Nemona...), not always as Blue.
    const character = trainer.classId === 'rival' ? rivalBossFor(content, trainer.name) : undefined;
    if (cls && character) return { assetId: character.sprites.default, label: trainer.name };
    if (cls) return { assetId: cls.spriteAssetId, label: cls.name };
    // A boss's ace back as a nemesis: drawn as that boss (the battle itself is not a boss fight).
    const nemesisBoss = this.run.story.nemeses.find((n) => n.id === this.run.battle?.nemesis)?.trainer;
    const nemesisRole = nemesisBoss?.leaderId ? bossRoleForClass(nemesisBoss.classId) : null;
    if (nemesisBoss?.leaderId && nemesisRole) {
      const info = bossInfo(content, nemesisRole, nemesisBoss.leaderId);
      return { assetId: info.spriteAssetId, label: info.name };
    }
    // A map event's trainer is drawn with the event's first cast member.
    const eventId = this.run.battle?.event?.eventId;
    const cast = eventId ? content.events.get(eventId)?.scene.cast[0] : undefined;
    if (cast && rxFileOf(this.cache.json.get('manifest') as AssetManifest | undefined, cast)) return { assetId: cast, label: trainer.name };
    // An event that names nobody to draw (or names something that is not a picture): a stand-in read from the Trainer's name.
    const stand = fallbackFoeArt(content, trainer.name, evilTeam(content, this.run)?.ranks.grunt.sprite);
    if (!stand) return cast ? { assetId: cast, label: trainer.name } : null;
    if ('assetId' in stand) return { assetId: stand.assetId, label: trainer.name };
    const sp = content.species.get(stand.speciesId);
    return sp ? { assetId: pokemonAssetIds(sp.assets).front, label: trainer.name } : null;
  }

  private names(trainer: string | null): Names {
    const party = this.run.party;
    return {
      player: this.speciesName(this.shown.player),
      enemy: this.speciesName(this.shown.enemy),
      trainer,
      nameOf: (uid) => {
        const mon = party.find((p) => p.uid === uid);
        return mon ? this.speciesName(mon) : '???';
      },
      moveName: (id) => signatureDisplay(this.run, id),
    };
  }

  // ---------- sprites and info boxes ----------

  private showSprite(side: 'player' | 'enemy', mon: PokemonInstance, cry = true, lively = true): Visual {
    const species = getSpecies(services().session.content, mon.speciesId);
    if (cry) playCry(this, species, side === 'player' ? mon.care?.cryVolume ?? 100 : 100);
    // Gigantamax art is already drawn huge, so only a plain Dynamax grows.
    const grow = mon.dynamaxed && species.form?.kind !== 'gigantamax' ? DYNAMAX_SCALE : 1;
    this.markObjs[side].forEach((o) => o.destroy());
    this.markObjs[side] = [];
    this.liftBaseShade(side);
    const visual = this.showSpriteBody(side, mon, lookSpecies(services().session.content, mon), cry, grow, lively);
    try {
      const vs = this.run.battle?.extra?.variants?.[mon.uid];
      this.markObjs[side] = addMarks(this, this.field, visual, { shadow: Boolean(mon.shadow), variant: vs?.line ?? null, motion: this.motion });
    } catch {
      /* presentation only */
    }
    return visual;
  }

  /** Greenneedle gn.30: a pink Pokémon (the island's fruit) is drawn pink; the colour is cosmetic and fades by shade. */
  private wearPink(visual: Visual, tint: number | null): void {
    if (tint !== null && visual instanceof Phaser.GameObjects.Sprite) visual.setTint(tint);
  }

  private showSpriteBody(side: 'player' | 'enemy', mon: PokemonInstance, species: ReturnType<typeof getSpecies>, cry: boolean, grow: number, lively = true): Visual {
    if (side === 'player') {
      this.dropSprite(this.playerSprite);
      const at = this.spotXY('player');
      // Anchored on its feet too, so the same amount of every Pokémon (big or small) is hidden behind the message bar.
      this.playerSprite = pokemonVisual(this, species, 'back', at.x, at.y, (PIXEL_SCALE + 1) * grow * (this.duo ? (this.duo.size === 3 ? TRIO_SCALE : DUO_SCALE).player : 1), mon.shiny, {});
      this.field.add(this.playerSprite);
      // It stands in the foreground, so its lower part is hidden at the arena's front edge (where the message bar starts),
      // never drawn over the bar, even a see-through one. Styles with no bar (Ring, Cinematic, Ink) show it whole.
      if (this.standClipped()) this.playerSprite.setMask(this.standMask());
      this.skin?.sprite?.(this.playerSprite);
      this.wearPink(this.playerSprite, pinkTint(mon));
      this.prefetchMoves(mon);
      if (lively) this.liven(this.playerSprite, mon, cry);
      return this.playerSprite;
    }
    this.dropSprite(this.enemySprite);
    const at = this.spotXY('enemy');
    const scale = PIXEL_SCALE * grow * (this.duo ? (this.duo.size === 3 ? TRIO_SCALE : DUO_SCALE).enemy : 1);
    // The foe stands on its feet in the platform (not on its padded frame edge); floaters hover a little above it.
    this.enemySprite = pokemonVisual(this, species, 'front', at.x, at.y, scale, mon.shiny, { lift: this.floats(mon) ? FLOAT_LIFT : 0 });
    // The foe stands behind the player's Pokémon.
    this.field.addAt(this.enemySprite, this.fieldBase);
    this.fitFoeInFrame(this.enemySprite);
    this.skin?.sprite?.(this.enemySprite);
    this.wearPink(this.enemySprite, pinkTint(mon) ?? islanderTint(this.run.battle?.event?.eventId));
    // A boss's last Pokémon turns the arena light a warning red.
    const b = this.run.battle;
    if (b && this.boss() && b.enemyTeam.length > 1 && b.enemyIndex >= b.enemyTeam.length - 1) this.arenaLight?.set(Math.max(this.arenaPhase, 1), 0xff5030);
    this.prefetchMoves(mon);
    if (lively) this.liven(this.enemySprite, mon, cry);
    return this.enemySprite;
  }

  /** A sent-out foe is always whole on the screen: a very tall one is scaled down so its top stays below the header, never cropped by the frame. */
  private fitFoeInFrame(visual: Visual): void {
    try {
      const o = visual as unknown as { y: number; displayHeight?: number; scaleX: number; setScale: (n: number) => unknown };
      const h = o.displayHeight ?? 0;
      const room = o.y - 28;
      if (h > room && room > 40) o.setScale((o.scaleX * room) / h);
    } catch {
      /* presentation only */
    }
  }

  private dropSprite(visual: Visual | null): void {
    if (!visual) return;
    this.tweens.killTweensOf(visual);
    visual.destroy();
  }

  /** A bouncy entrance (when it is sent out) and then its own way of standing. */
  private liven(visual: Visual, mon: PokemonInstance, entering: boolean): void {
    if (entering) bounceIn(this, visual, this.motion);
    this.standUp(visual, mon, entering ? 450 : 0);
  }

  /** Standing (redesign pass 11): the Pokémon breathes and moves in place its own way (hover, float, heavy, twitch, sway). */
  private standUp(visual: Visual, mon: PokemonInstance, delay = 0): void {
    const sp = getSpecies(services().session.content, mon.speciesId);
    // It stands on its own spot (the entrance may still be settling it there).
    const restY = visual === this.playerSprite ? this.spotXY('player').y : visual === this.enemySprite ? this.spotXY('enemy').y : undefined;
    // A status changes how it stands (pass 8): paralysis locks it up and it twitches, ice holds it still, sleep slumps it.
    const side: Side | null = visual === this.playerSprite ? 'player' : visual === this.enemySprite ? 'enemy' : null;
    const look = side ? this.conds[side] : null;
    const kind = look && look.sprite === visual ? look.kind : null;
    this.condPose(visual, kind);
    if (side && visual instanceof Phaser.GameObjects.Sprite && (kind === 'par' || kind === 'frz' || kind === 'slp')) {
      if (kind === 'frz') return standStill(this, visual);
      if (kind === 'par') return twitch(this, visual, this.motion === 'full', this.spotXY(side).x);
      standStill(this, visual);
      this.slump(visual, side);
      return stand(this, visual, 'steady', this.motion === 'full', delay, 2600, (restY ?? visual.y) + SLUMP.dy);
    }
    // Confused: it sways under its stars.
    const dz = side ? this.dizzy[side] : null;
    if (side && dz && dz.sprite === visual && this.motion === 'full') return sway(this, visual, true, this.spotXY(side).x, CONFUSE.sway.rot, CONFUSE.sway.dx, CONFUSE.sway.ms);
    // A Pokémon in danger keeps its sag and its fast, shallow breath.
    if (visual.getData('sag')) return stand(this, visual, 'steady', this.motion === 'full', delay, 750, restY);
    stand(this, visual, standKind(sp.dex, sp.types, !!mon.dynamaxed), this.motion === 'full', delay, undefined, restY);
  }

  /** Starts loading the animations of a Pokémon's moves while the player reads. */
  private prefetchMoves(mon: PokemonInstance): void {
    prefetchCinematics(this);
    const data = moveAnims();
    this.fx.prefetch(
      mon.moves.map((m) => animChoice(presentationFor(data, m.id)).anim),
      mon.moves.flatMap((m) => presentationFor(data, m.id).script ?? []),
    );
  }

  /** The Deluxe Battle Kit icon (Tera Type jewel, Dynamax mark) at a badge's left end, once its art has loaded. */
  private badgeIcon(holder: Phaser.GameObjects.Container, key: string, frame?: number): void {
    const place = () => {
      if (!holder.active || !this.textures.exists(key)) return;
      const icon = this.add.image(-holder.width / 2 - 2, 0, key, frame).setDisplaySize(22, 22);
      holder.add(icon);
    };
    if (this.textures.exists(key)) place();
    else if (services().assets.has(key)) void loadAssets(this, [key]).then(place).catch(() => undefined);
  }

  /**
   * A Terastallized Pokémon wears its Tera Type's crystal pattern and a
   * Dynamaxed one the red Dynamax energy (Deluxe Battle Kit art, `formPattern`).
   * The old type-coloured tint stays as the stand-in until the pattern is on
   * (and on the Canvas renderer, where there is none).
   */
  private applyTeraTint(side: 'player' | 'enemy', mon: PokemonInstance): void {
    const type = this.run.battle?.transform.teraTypes[mon.uid];
    const visual = side === 'player' ? this.playerSprite : this.enemySprite;
    this.teraJewels[side]?.destroy();
    delete this.teraJewels[side];
    if (!visual || (!type && !mon.dynamaxed)) return;
    // The Tera Type's jewel floats over the head, bobbing slowly (still when motion is reduced). Stellar adds the crown: a pink star over a rainbow-lit jewel.
    if (type && !mon.dynamaxed && this.textures.exists('ui.tera.types')) {
      const stellar = mon.speciesId.startsWith('terapagos');
      const jewel = this.add.image(0, 0, 'ui.tera.types', TERA_ICON_ROW[stellar ? 'stellar' : type]).setScale(1.1).setDepth(visual.depth + 5);
      const star = stellar ? this.add.star(0, 0, 5, 6, 14, 0xff7ac8).setStrokeStyle(2, 0xffffff).setDepth(visual.depth + 6) : null;
      // Follows the sprite's head every frame (it scales in after a swap), bobbing when motion is full.
      const follow = () => {
        if (!visual.active) return;
        // A container's own bounds can be empty, so measure the picture parts inside it.
        const parts = ('list' in visual ? (visual as Phaser.GameObjects.Container).list : [visual]).filter((p): p is Phaser.GameObjects.Sprite => !!(p as Phaser.GameObjects.Sprite).texture && (p as Phaser.GameObjects.Sprite).visible && (p as Phaser.GameObjects.Sprite).alpha > 0.2);
        const top = parts.length ? parts[0]!.getBounds() : new Phaser.Geom.Rectangle(this.spotXY(side).x, this.spotXY(side).y - 120, 0, 0);
        const bob = this.motion === 'full' ? Math.sin(this.time.now / 300) * 4 : 0;
        const y = Math.max(top.top, 40);
        jewel.setPosition(top.centerX, y + 14 + bob);
        star?.setPosition(top.centerX, y - 14 + bob);
        if (star && this.motion === 'full') star.angle = (this.time.now / 12) % 360;
        if (stellar && this.motion === 'full') jewel.setTint(Phaser.Display.Color.HSVToRGB((this.time.now / 2500) % 1, 0.45, 1).color);
      };
      follow();
      this.events.on('update', follow);
      jewel.once('destroy', () => {
        this.events.off('update', follow);
        star?.destroy();
      });
      this.teraJewels[side] = jewel;
    }
    const color = mon.dynamaxed ? 0xff3060 : (TYPE_COLORS[type!] ?? 0xffffff);
    const tint = Phaser.Display.Color.Interpolate.ColorWithColor(Phaser.Display.Color.ValueToColor(0xffffff), Phaser.Display.Color.ValueToColor(color), 100, 30);
    const value = Phaser.Display.Color.GetColor(tint.r, tint.g, tint.b);
    const parts = 'list' in visual ? (visual as Phaser.GameObjects.Container).list : [visual];
    for (const part of parts) (part as Partial<Phaser.GameObjects.Sprite>).setTint?.(value);
    const key = mon.dynamaxed ? dynamaxPatternKey(mon.speciesId) : teraPatternKey(mon.speciesId.startsWith('terapagos') ? 'stellar' : type!);
    wearPattern(this, visual, key, this.motion, () => (visual as Phaser.GameObjects.Sprite).clearTint());
  }

  /**
   * A burned, frozen, paralysed or poisoned Pokémon wears that status's pulsing pattern (Deluxe Battle Kit,
   * via Pokémon Memories) in doubles and triples; singles show the condition look instead. It comes off when the status is cured. Tera and Dynamax patterns take precedence.
   * Presentation only.
   */
  private syncStatusPattern(side: 'player' | 'enemy', mon: PokemonInstance): void {
    const visual = side === 'player' ? this.playerSprite : this.enemySprite;
    if (!visual || mon.dynamaxed || mon.shadow || this.run.battle?.transform.teraTypes[mon.uid]) return;
    // In singles the redesign's own condition look (pass 8: the wash, embers, ice, slump) replaces the old pattern.
    const ownLook = !this.duo && this.clipLevel() !== 'off' && condKind(mon.status?.id) !== null;
    const want = this.motion === 'off' || ownLook ? null : statusPatternKey(mon.status?.id);
    const worn = wornPattern(visual);
    if (worn === want || (worn && !worn.startsWith('fx.status.'))) return;
    if (want) wearPattern(this, visual, want, this.motion, () => undefined, { pulse: STATUS_PULSE });
    else dropPattern(visual);
  }

  /** `force` draws a set style's boxes whatever the settings say (triple battles always use the Essentials Kit, long foe box). */
  private makeInfoBox(x: number, y: number, isPlayer: boolean, force?: 'kitLong'): InfoBox {
    const container = this.add.container(x, y);
    const style = force ?? services().session.settings.battleUi;
    const kit = (force || !this.skin) && style !== 'aero' && kitTexturesReady(this) ? KIT_LAYOUTS[style][isPlayer ? 'player' : 'foe'] : null;
    // A glossy glass databox (Aero), cyan-rimmed for you and pink-rimmed for the foe; or the Deluxe Battle Kit's databox art.
    if (kit) container.add(this.add.image(kit.x, kit.y, kit.box).setOrigin(0, 0).setScale(kit.scale));
    else if (this.skin) container.add(this.skin.databox(this, isPlayer, isPlayer ? [16, 2, 366, 128] : [6, 4, 360, 100]));
    else
      container.add(
        isPlayer
          ? drawGlass(this, 16, 2, 366, 128, { rim: AERO.rim, radius: 20 })
          : drawGlass(this, 6, 4, 360, 100, { rim: this.foeRim(), tint: 0x2a1240, radius: 20 }),
      );
    // Text and bar positions follow the old art's slots (art pixel × 3).
    const left = isPlayer ? 48 : 24;
    const right = isPlayer ? 366 : 342;
    // The kit art has no name or level plates, so the kit styles get small dark glass plates of our own behind the text.
    if (kit) {
      const plates = this.add.graphics();
      plates.fillStyle(0x10202c, 0.72).fillRoundedRect(left - 10, 8, right - left - 74, 40, 12).fillRoundedRect(right - 82, 8, 92, 40, 12);
      plates.lineStyle(2, 0xbfe9ff, 0.55).strokeRoundedRect(left - 10, 8, right - left - 74, 40, 12).strokeRoundedRect(right - 82, 8, 92, 40, 12);
      container.add(plates);
    }
    const ink = kit ? undefined : this.skin?.text;
    const name = this.add.text(left, 14, '', textStyle(26, ink));
    const level = this.add.text(right, 14, '', textStyle(24, ink)).setOrigin(1, 0);
    container.add([name, level]);
    const hpX = isPlayer ? 210 : 177;
    let hpBar: GaugeLike;
    if (kit) {
      const bx = kit.x + kit.hp.artX * kit.scale;
      const by = kit.y + kit.hp.artY * kit.scale;
      container.add(this.add.text(bx - 8, by + (kit.hp.rowH * kit.scale) / 2, 'HP', textStyle(15, '#f8a030', { shadow: undefined })).setOrigin(1, 0.5));
      hpBar = new KitBar(this, bx, by, kit.hp.tex, 3, kit.hp.rowH, kit.scale, 'hp');
    } else {
      // B2W2 "HP" tag: a small dark pill with orange letters, sitting against the gauge.
      const tag = this.add.graphics();
      tag.fillStyle(0x303838, 1).fillRoundedRect(hpX - 40, 54, 34, 18, 9);
      tag.lineStyle(1, 0xf0f0e8, 0.9).strokeRoundedRect(hpX - 40, 54, 34, 18, 9);
      container.add(tag);
      container.add(this.add.text(hpX - 23, 63, 'HP', textStyle(13, '#f8a030', { shadow: undefined })).setOrigin(0.5));
      hpBar = new Bar(this, hpX, 63, 144, 10, 'hp');
    }
    hpBar.addTo(container);
    const box: InfoBox = { container, isPlayer, name, level, hpBar, statusAt: { x: left, y: isPlayer ? 80 : 80 } };
    if (isPlayer) {
      box.hpText = this.add.text(right, 76, '', textStyle(24, ink)).setOrigin(1, 0);
      container.add(box.hpText);
      if (kit) box.xpBar = new KitBar(this, 123, 104, 'pack.dbk.box.basicExp', 1, 6, 2.7, 'xp');
      else box.xpBar = new Bar(this, 123, 120, 255, 6, 'xp');
      box.xpBar.addTo(container);
    } else {
      box.teamText = this.add.text(right, 80, '', textStyle(18, '#f8f8f8', { stroke: '#181818', strokeThickness: 4 })).setOrigin(1, 0);
      container.add(box.teamText);
    }
    container.setVisible(false);
    return box;
  }

  /** A databox laid out by the battle style (its mock-up's shape and parts). */
  /**
   * A battle style's databox in a double battle: the style's own box, shrunk, at the style's spot for that side,
   * with the second box stacked below it (or above, when below would run into the message bar).
   */
  private makeDuoSkinBox(side: Side, spot: Spot): InfoBox {
    const L = this.skin!.layout;
    const spec = side === 'player' ? L.player : L.foe;
    const [px, py, pw, ph] = spec.panel;
    const tall = Math.min(ph, 110);
    const scale = Math.min(DUO_BOX.scale, 300 / (px + pw), 70 / tall);
    const step = Math.max(40, Math.round((py + tall) * scale + 8));
    const floor = L.bar ? L.bar[1] : MESSAGE_Y + 20;
    const below = spec.y + step + (py + tall) * scale <= floor;
    const y = spec.y + spot * (below ? step : -step);
    // Boxes on the right keep their right edge; boxes on the left keep their left edge.
    const right = spec.x + (px + pw) / 2 > GAME_WIDTH / 2;
    const x = right ? spec.x + (px + pw) * (1 - scale) : spec.x;
    const b = this.makeSkinBox(spec, side === 'player');
    b.container.setPosition(x, y).setScale(scale);
    return b;
  }

  private makeSkinBox(spec: BoxSpec, isPlayer: boolean): InfoBox {
    const skin = this.skin!;
    const container = this.add.container(spec.x, spec.y);
    container.add(skin.databox(this, isPlayer, spec.panel));
    const ink = skin.text;
    const name = this.add.text(spec.name[0], spec.name[1], '', this.skinText(spec.name[2] ?? 22, ink));
    const lv = spec.level === 'inline' ? null : spec.level;
    const level = this.add.text(lv ? lv[0] : 0, lv ? lv[1] : 0, '', this.skinText(lv?.[2] ?? 20, ink)).setOrigin(1, 0).setVisible(!!lv);
    container.add([name, level]);
    const [hx, hy, hw, hh] = spec.hp;
    if (spec.hpTag) {
      const tag = this.add.graphics();
      tag.fillStyle(0x303838, 1).fillRoundedRect(hx - 40, hy - 9, 34, 18, 9);
      tag.lineStyle(1, 0xf0f0e8, 0.9).strokeRoundedRect(hx - 40, hy - 9, 34, 18, 9);
      container.add([tag, this.add.text(hx - 23, hy, 'HP', textStyle(13, '#f8a030', { shadow: undefined })).setOrigin(0.5)]);
    }
    const hpBar = new Bar(this, hx, hy, hw, hh ?? 10, 'hp', spec.hpLook);
    hpBar.addTo(container);
    const box: InfoBox = { container, isPlayer, name, level, hpBar, statusAt: { x: spec.status[0], y: spec.status[1] }, spec };
    if (spec.hpText) {
      const t = spec.hpText.at;
      box.hpText = this.add.text(t[0], t[1], '', this.skinText(t[2] ?? 18, ink)).setOrigin(spec.hpText.align === 'left' ? 0 : 1, 0);
      container.add(box.hpText);
    }
    if (spec.xp && isPlayer) {
      box.xpBar = new Bar(this, spec.xp[0], spec.xp[1], spec.xp[2], 4, 'xp');
      box.xpBar.addTo(container);
    }
    if (spec.types) {
      box.typesText = this.add.text(spec.types[0], spec.types[1], '', this.skinText(spec.types[2] ?? 14, ink));
      container.add(box.typesText);
    }
    if (spec.team && !isPlayer) {
      box.teamRow = this.add.container(spec.team[0], spec.team[1]);
      container.add(box.teamRow);
    }
    container.setVisible(false);
    return box;
  }

  /** A style box's extras: types, the trainer's ball row, the portrait. */
  private refreshSkinParts(box: InfoBox, mon: PokemonInstance): void {
    const spec = box.spec!;
    const content = services().session.content;
    const species = getSpecies(content, mon.speciesId);
    const up = (t: string) => t.toUpperCase();
    if (box.typesText) {
      const tera = this.run.battle?.transform.teraTypes[mon.uid];
      box.typesText.setText((tera ? [tera] : species.types).map(up).join(' · '));
    }
    if (box.teamRow) {
      box.teamRow.removeAll(true);
      const team = this.run.battle?.trainer ? this.run.battle.enemyTeam : [];
      const size = spec.team![2] ?? 30;
      team.forEach((m, i) => {
        const key = m.hp > 0 ? 'pack.memories.battle.ball' : 'pack.memories.battle.ballFaint';
        const icon = this.textures.exists(key)
          ? this.add.image(i * (size + 4), 0, key).setOrigin(0).setDisplaySize(size, size)
          : this.add.text(i * (size + 4), 0, m.hp > 0 ? '●' : '○', textStyle(size * 0.7, '#f8f8f8', { stroke: '#181818', strokeThickness: 4 }));
        box.teamRow!.add(icon);
      });
    }
    if (spec.portrait && box.portrait?.species !== mon.speciesId) {
      box.portrait?.obj.destroy();
      const [px, py, ps] = spec.portrait;
      const obj = pokemonIcon(this, species, px, py, ps ?? 1);
      box.container.add(obj);
      box.portrait = { species: mon.speciesId, obj };
    }
  }

  private refreshInfoBox(box: InfoBox, mon: PokemonInstance, animate: boolean): Promise<void> {
    const content = services().session.content;
    if (box === this.playerBox || box === this.enemyBox) this.syncStatusPattern(box.isPlayer ? 'player' : 'enemy', mon);
    const max = calcStats(content, mon).hp;
    // It flies back in the way it left (redesign pass 5): yours up from below, the foe's in from the left.
    if (!box.container.visible) slideIn(this, box.container, box.isPlayer ? 0 : -460, box.isPlayer ? 140 : 0, this.motion);
    box.container.setVisible(true);
    const spec = box.spec;
    const shown = `${this.speciesName(mon)}${genderSign(content, mon)}${mon.shiny ? ' ★' : ''}`;
    box.name.setText(spec ? `${spec.namePrefix ?? ''}${spec.upper ? shown.toUpperCase() : shown}${spec.level === 'inline' ? ` · Lv${mon.level}` : ''}` : shown);
    box.level.setText(this.foeHidden(mon) ? 'Lv?' : `Lv${mon.level}`);
    if (box === this.enemyBox && this.enemySprite instanceof Phaser.GameObjects.Sprite) {
      if (this.foeHidden(mon)) this.enemySprite.setTintFill(0x000000);
      else {
        this.enemySprite.clearTint();
        this.wearPink(this.enemySprite, pinkTint(mon) ?? islanderTint(this.run.battle?.event?.eventId));
      }
    }
    // A long name stops short of the level and the form symbol instead of running under them.
    if (!spec || spec.level !== 'inline') fitLine(box.name, box.level.x - box.level.width - box.name.x - (spec ? 12 : 40));
    const pct = Math.ceil((Math.max(0, mon.hp) / max) * 100);
    box.hpText?.setText(spec?.hpText ? `${spec.hpText.prefix ?? ''}${spec.hpText.pct ? `${pct}%` : `${Math.max(0, mon.hp)}/${max}`}` : `${Math.max(0, mon.hp)}/${max}`);
    if (spec) this.refreshSkinParts(box, mon);
    if (!mon.shiny) {
      box.shinyChip?.destroy();
      box.shinyChip = undefined;
    }
    box.statusBadge?.destroy();
    box.statusBadge = undefined;
    if (mon.status) {
      const s = STATUS_LABELS[mon.status.id]!;
      // Essentials' status icon when the art is there, else a coloured label.
      const icon = statusIcon(this, 0, 0, mon.status.id, 1.75);
      box.statusBadge = icon ? this.add.container(box.statusAt.x, box.statusAt.y - 2, [icon]) : badge(this, box.statusAt.x, box.statusAt.y, s.label, s.color, 16);
      box.container.add(box.statusBadge);
    }
    box.teraBadge?.destroy();
    box.teraBadge = undefined;
    const tera = this.run.battle?.transform.teraTypes[mon.uid];
    if (tera) {
      box.teraBadge = badge(this, box.statusAt.x + (box.statusBadge ? 76 : 0), box.statusAt.y, `Tera ${tera}`, TYPE_COLORS[tera] ?? 0xffffff, 16);
      this.badgeIcon(box.teraBadge, 'ui.tera.types', TERA_ICON_ROW[tera]);
      box.container.add(box.teraBadge);
    } else if (mon.dynamaxed) {
      box.teraBadge = badge(this, box.statusAt.x + (box.statusBadge ? 76 : 0), box.statusAt.y, 'Dynamax', 0xff3060, 16);
      this.badgeIcon(box.teraBadge, 'ui.dynamax.icon');
      box.container.add(box.teraBadge);
    }
    // S391: in a raid your Pokémon in front shows its role.
    box.roleBadge?.destroy();
    box.roleBadge = undefined;
    if (box.isPlayer && this.run.battle?.raid) {
      const role = raidRole(content, mon);
      const look = { tank: { text: 'TANK', color: 0x2c8ad8 }, striker: { text: 'STRIKER', color: 0xc8303c }, support: { text: 'SUPPORT', color: 0x1f9a52 } }[role];
      box.roleBadge = badge(this, box.statusAt.x + (box.statusBadge ? 76 : 0) + (box.teraBadge ? 120 : 0), box.statusAt.y + 22, look.text + (this.run.battle.raid.coop ? ` P${coopOwner(this.run.battle.raid, mon.uid) + 1}` : ''), look.color, 14);
      box.container.add(box.roleBadge);
    } else if (box.isPlayer && isGuest(this.run.battle, mon.uid)) {
      // An ally the game plays (core/battle/guests.ts): its box says so, in both looks.
      box.roleBadge = badge(this, box.statusAt.x + (box.statusBadge ? 76 : 0) + (box.teraBadge ? 120 : 0), box.statusAt.y + 22, 'ALLY', 0x1f9a52, 14);
      box.container.add(box.roleBadge);
    }
    this.dangerGlow(box, mon.hp / max);
    box.formIcon?.destroy();
    box.formIcon = undefined;
    const formKind = getSpecies(content, mon.speciesId).form?.kind;
    const sym = mon.dynamaxed ? 'pack.ebdx.symDynamax' : formKind === 'mega' || formKind === 'primal' ? 'pack.ebdx.symMega' : null;
    if (sym && this.textures.exists(sym)) {
      box.formIcon = this.add.image(box.name.x + box.name.width + 10, box.name.y + 14, sym).setOrigin(0, 0.5);
      box.container.add(box.formIcon);
    }
    let xpShown: number | null = null;
    box.rageBadge?.destroy();
    box.rageBadge = undefined;
    if (!box.isPlayer && mon.uid === this.riledUid) {
      // The warning stays on screen until the rage is unleashed or calmed.
      box.rageBadge = badge(this, box.statusAt.x + (box.statusBadge ? 76 : 0) + (box.teraBadge ? 120 : 0), box.statusAt.y, 'Riled up!', 0xff5a3c, 16);
      box.container.add(box.rageBadge);
    }
    if (box.xpBar) {
      const species = getSpecies(content, mon.speciesId);
      const { maxLevel, highLevelXp } = content.balance.difficulty;
      const lo = xpForLevel(species.growthRate, mon.level, highLevelXp);
      const hi = xpForLevel(species.growthRate, mon.level + 1, highLevelXp);
      xpShown = mon.level >= maxLevel ? 1 : Phaser.Math.Clamp((mon.xp - lo) / Math.max(1, hi - lo), 0, 1);
      void box.xpBar.set(xpShown, animate);
    }
    if (box.teamText && !spec) {
      const battle = this.run.battle;
      if (battle?.trainer) {
        box.teamText.setText(battle.enemyTeam.map((m) => (m.hp > 0 ? '●' : '○')).join(' '));
      }
    }
    box.mon = mon;
    if (this.rx) {
      const battle = this.run.battle;
      const word = (c?: Phaser.GameObjects.Container): string => (c?.list.find((o): o is Phaser.GameObjects.Text => o instanceof Phaser.GameObjects.Text)?.text ?? '').trim();
      const to = Phaser.Math.Clamp(mon.hp / max, 0, 1);
      const from = box.rx?.hp ?? to;
      box.rx = {
        name: shown,
        level: this.foeHidden(mon) ? 'Lv ?' : `Lv ${mon.level}`,
        hp: animate ? from : to,
        hpText: box.isPlayer ? `${Math.max(0, mon.hp)} / ${max}` : '',
        xp: box.isPlayer ? xpShown : null,
        tags: [mon.status ? STATUS_LABELS[mon.status.id]?.label ?? '' : '', word(box.teraBadge), word(box.roleBadge), word(box.rageBadge)].filter(Boolean),
        team: !box.isPlayer && battle?.trainer ? { n: battle.enemyTeam.length, out: battle.enemyTeam.filter((m) => m.hp <= 0).length } : null,
      };
      this.tweens.killTweensOf(box.rx);
      // The same drain the canvas bar plays, so the two never disagree about when the HP has settled.
      if (animate && from !== to) this.tweens.add({ targets: box.rx, hp: to, duration: to < from ? 280 : 800, ease: to < from ? 'Quad.easeOut' : 'Sine.easeInOut' });
    }
    // A hit jolts the plate (pass 2): down 5 px and back with a spring.
    const ratio = Math.max(0, mon.hp) / max;
    const c = box.container;
    if (animate && ratio < (box.ratio ?? ratio) && this.motion === 'full' && c.visible && !this.tweens.isTweening(c)) {
      const y = c.y;
      this.tweens.chain({ targets: c, tweens: [{ y: y + 5, duration: 40 }, { y, duration: 250, ease: 'Elastic.easeOut', easeParams: [1, 0.4] }], onStop: () => c.setY(y) });
    }
    box.ratio = ratio;
    if (!this.duo) this.condSync(box === this.playerBox ? 'player' : 'enemy');
    return box.hpBar.set(ratio, animate);
  }

  /** New UI: mounts the mock-ups' battle HUD over the canvas and stops the canvas drawing its own. */
  private mountRx(): void {
    this.rx = mountRedux(this, {
      clear: true,
      render: (c) => (this.rxData ? battleView(c, this.rxData) : ''),
      acts: {
        pick: (i) => { if (!this.picker && !this.infoPanel && !this.autoRunning) this.menu?.press(Number(i)); },
        confirm: () => { if (this.rxNotice) this.advance?.(); },
        tab: (i) => this.tabs.press(Number(i)),
        auto: () => this.toggleAuto(),
        info: () => { if (this.infoPanel) this.closePanel(); },
        gims: () => this.phOpenGimmicks(),
        gim: (i) => {
          const pick = this.rxGim?.choices[Number(i)];
          if (!pick || !this.menu || this.picker || this.infoPanel || this.busy) return;
          this.transformChoice = this.transformChoice?.kind === pick.kind ? null : pick;
          this.showMoveMenu();
        },
        log: (i) => this.setLogTab(LOG_TABS[Number(i)]?.id),
        // A click on a data box pins its card; a second click (or one on the card) lets it go.
        pin: (key) => { this.rxPin = !key || this.rxPin === key ? null : key; },
      },
      tip: (key) => { this.rxHover = key ? { key, at: this.time.now } : null; },
      overs: { over: (i) => { const k = Number(i); if (this.menu && !this.picker && this.menu.index !== k && !this.menu.options[k]?.disabled) this.menu.focus(k); } },
    });
    const tick = (): void => this.rxTick();
    this.events.on('update', tick);
    this.events.once('shutdown', () => this.events.off('update', tick));
  }

  /** New UI: the battle's lists (Party, Item, a target for an item) show as the mock-ups' small window, under the foes' boxes. */
  private rxWindow(): { top?: number } | undefined {
    if (!this.rx) return undefined;
    return { top: this.duo ? 28 + Math.max(1, this.duo.slots.enemy.length) * 58 : undefined };
  }

  /** New UI: reads what the battle shows right now and redraws the HUD when any of it changed. */
  private rxTick(): void {
    if (!this.rx) return;
    const cam = this.cameras.main;
    const side = (s: Side, main: InfoBox): InfoBox[] => (this.duo ? this.duo.slots[s].map((o) => (o ? o.box : main)) : [main]);
    const foes = side('enemy', this.enemyBox), mine = side('player', this.playerBox);
    // The canvas keeps building its HUD (the scene's logic reads and moves it); it is only left out of the picture.
    for (const o of [...foes.map((b) => b.container), ...mine.map((b) => b.container), this.header, this.momentumText, this.status, this.storyBar?.container, this.commandWindow, this.message, this.moveInfo, this.moveBadges, this.tabs.root, this.note, this.menu?.container, this.infoPanel, this.historyView, this.actionTabUi?.container, ...this.reachTags]) {
      if (o && !this.rxHidden.has(o)) {
        cam.ignore(o);
        this.rxHidden.add(o);
      }
    }
    const boxes = (list: InfoBox[], key: string): BattleBox[] => list.flatMap((b, k) => (b.container.visible && b.rx ? [{ ...b.rx, hp: Math.round(b.rx.hp * 200) / 200, tip: `${key}:${k}` }] : []));
    const moves = this.tabs.current === 'attack' && !!this.menu && !this.picker;
    const menu = this.menu && this.menu.container.visible ? { options: this.menu.options.map((o, k) => ({ ...(o.rx?.sub ?? o.detail ? { label: o.label, sub: o.rx?.sub ?? o.detail } : splitChoice(o.label)), type: o.rx?.type, off: !!o.disabled, ...(moves && this.activeMon().moves[k] ? { tip: `move:${k}` } : {}) })), index: this.menu.index } : null;
    // A tooltip shows once the pointer has rested for the Tooltip delay setting (Off shows none); a pinned card stays.
    const wait = TOOLTIP_DELAY_MS[services().session.settings.tooltipDelay];
    const hot = this.rxHover && wait !== null && this.time.now - this.rxHover.at >= wait ? this.rxHover.key : null;
    const boxOf = (key: string | null): InfoBox | undefined => {
      const m = /^(foe|mine):(\d+)$/.exec(key ?? '');
      const b = m ? (m[1] === 'foe' ? foes : mine)[Number(m[2])] : undefined;
      return b?.container.visible ? b : undefined;
    };
    // Party, Item, Auto or the info page cover the field: the Ability card closes instead of sitting half under them.
    const covered = !!this.picker || !!this.infoPanel || (this.tabs.current !== null && this.tabs.current !== 'attack');
    if (this.rxPin && (covered || !boxOf(this.rxPin))) this.rxPin = null;
    const shownBox = covered ? undefined : boxOf(this.rxPin) ?? boxOf(hot);
    const card = shownBox?.mon ? { ...this.rxCard(shownBox.mon, shownBox.isPlayer), pinned: !!this.rxPin } : null;
    const tip = moves && hot?.startsWith('move:') && !this.infoPanel ? this.moveTip(Number(hot.slice(5))) : null;
    const content = services().session.content;
    const exp = [...this.rxExp].flatMap(([uid, g]) => {
      const m = this.run.party.find((x) => x.uid === uid);
      if (!m) return [];
      const { maxLevel, highLevelXp } = content.balance.difficulty;
      const rate = getSpecies(content, m.speciesId).growthRate;
      const lo = xpForLevel(rate, m.level, highLevelXp), hi = xpForLevel(rate, m.level + 1, highLevelXp);
      // The state is already past the battle's end: the row shows the Pokémon as it was when it earned the Exp (before an evolution).
      const look = g.was ?? m;
      return [{ name: this.speciesName(look), file: monFile(this, look.speciesId, 'front', !!look.shiny), text: g.level ? `Level up! ${g.level}` : `+${g.amount} Exp`, xp: m.level >= maxLevel ? 1 : Phaser.Math.Clamp((m.xp - lo) / Math.max(1, hi - lo), 0, 1), up: g.level !== null }];
    });
    const tabs = this.tabs.view;
    const list = this.picker;
    const data: BattleModel = {
      foes: boxes(foes, 'foe'),
      mine: boxes(mine, 'mine'),
      // An open list (Party, Item) says what the focused row does in the text box.
      text: list ? list.note || (this.message.visible ? this.message.text : '') : this.message.visible ? this.message.text : this.moveInfo.visible ? this.rxInfo || this.moveInfo.text : '',
      menu,
      tabs: tabs.shown ? { labels: tabs.labels, index: tabs.index, auto: tabs.auto, autoOff: tabs.autoOff } : null,
      me: tabs.shown ? { ...this.spotXY('player') } : null,
      header: this.header.visible ? this.header.text : '',
      status: this.status.visible && !list ? this.status.text : '',
      momentum: this.momentumText.visible ? this.momentumText.text : '',
      note: this.note.alpha > 0.05 ? this.note.text : '',
      auto: this.autoRunning,
      party: { n: this.run.party.length, out: this.run.party.filter((m) => m.hp <= 0).length },
      gimPage: this.rxMoves && !!menu && phantomOn(),
      gim: this.rxGim && menu ? this.rxGim.choices.map((c) => ({ kind: c.kind, on: this.transformChoice?.kind === c.kind, ...(c.kind === 'tera' ? { row: TERA_ICON_ROW[this.rxGim!.tera] ?? 0 } : {}) })) : null,
      marks: [...(this.rxAim && menu ? [{ ...this.rxAim, text: 'TARGET' }] : []), ...this.reachTags.filter((t) => t.active).map((t) => ({ x: t.x, y: t.y - 10, text: 'OUT OF REACH' }))],
      shadow: !!menu && !!this.run.battle && !this.duo && !!this.activeMon().shadow,
      exp: exp.length && !menu && !list ? exp : null,
      level: this.rxLevel && !menu && !list ? this.rxLevel : null,
      evolve: this.rxEvolve,
      panels: this.infoPanel ? this.rxPanels : null,
      panelAt: this.rxPanelAt,
      tip,
      card,
      log: this.historyView ? { tabs: LOG_TABS.map((t) => t.label), index: LOG_TABS.findIndex((t) => t.id === this.logTab), lines: filterLog(this.history, this.logTab).slice(-12) } : null,
      fx: this.rxFx(!!menu, list),
      notice: this.rxNotice,
    };
    const sig = JSON.stringify(data);
    if (sig === this.rxSig) return;
    this.rxSig = sig;
    this.rxData = data;
    this.rx.refresh();
  }

  /** New UI: the Beta 0.6 pieces over the field (item budget, Rally, Foresight Tax, variant hint, signature trait, Shadow line). */
  private rxFx(menu: boolean, list: Picker | null): BattleModel['fx'] {
    const battle = this.run.battle;
    if (!battle || battle.outcome) return null;
    const caps = services().session.content.balance.itemCaps;
    const choosing = menu && !list;
    const fx: NonNullable<BattleModel['fx']> = {
      // The Item window: what this battle still allows.
      ...(list && list === this.rxBag ? { budget: { heals: [battle.healsUsed ?? 0, caps.healsPerBattle] as const, revives: [battle.revivesUsed ?? 0, caps.revivesPerBattle] as const } } : {}),
      ...(!menu && !list && this.rxCall?.rally ? { rally: this.rxCall.rally } : {}),
      ...(!menu && !list && this.rxCall?.trait ? { trait: this.rxCall.trait } : {}),
      ...(choosing && foresightOn(battle) ? { rule: foresightRule(true, battle.trainer?.name)! } : {}),
      ...(choosing && this.rxRing && this.rxRing === this.shown.enemy.uid && !this.infoPanel ? { variant: true } : {}),
      ...(choosing && this.rxShadow && !this.duo && this.activeMon().shadow ? { shadow: this.rxShadow } : {}),
    };
    return Object.keys(fx).length ? fx : null;
  }

  /** New UI: the callout for one of the turn's events, or null. Reads the finished turn only. */
  private calloutOf(events: readonly RunEvent[], index: number): BattleScene['rxCall'] {
    const e = events[index]!;
    const rally = rallyLine(events as readonly CalloutEvent[], index);
    if (rally) return { rally };
    if (e.type !== 'raid') return null;
    const trait = traitLine(e.text);
    if (!trait) return null;
    // The trait belongs to a foe: the one on the field carries it (your own freed special Pokémon keep theirs too).
    const traits = this.run.battle?.extra?.traits ?? {};
    const holder = traits[this.shown.enemy.uid] ? this.shown.enemy : traits[this.shown.player.uid] ? this.shown.player : this.shown.enemy;
    return { trait: { file: monFile(this, holder.speciesId, 'front', !!holder.shiny) ?? '', ...trait } };
  }

  /** At a quarter of its HP or less, a box gets a gentle red pulse behind it (still with reduced motion). */
  /**
   * Danger (redesign pass 5): under a fifth of its HP the plate glows red in a slow 1 s pulse, the HP bar pulses
   * brighter every half second, and the Pokémon sags and breathes faster. All of it stops the moment it is healed.
   */
  private dangerGlow(box: InfoBox, ratio: number): void {
    const low = ratio > 0 && ratio <= 0.2;
    const side: Side = box.isPlayer ? 'player' : 'enemy';
    if (!low) {
      if (box.danger) {
        box.danger.destroy();
        box.danger = undefined;
        box.hpBar.pulse?.(false);
        if (box === this.playerBox || box === this.enemyBox) this.dangerSag(side, false);
      }
      return;
    }
    if (box.danger) {
      // A new Pokémon came in already in danger: it sags too.
      if (this.motion === 'full' && (box === this.playerBox || box === this.enemyBox)) this.dangerSag(side, true);
      return;
    }
    const isPlayer = box.isPlayer;
    const g = this.add.graphics();
    // A soft red glow about 14 px wide around the plate (the mockup's box-shadow), in rings that fade outward.
    const [px, py, pw, ph, rad] = box.spec ? [...box.spec.panel, 8] : isPlayer ? [16, 2, 366, 128, 18] : [6, 2, 360, 100, 18];
    for (const [grow, a] of [[16, 0.12], [12, 0.22], [8, 0.34], [4, 0.5]] as const) g.fillStyle(0xff3b30, a).fillRoundedRect(px! - grow, py! - grow, pw! + grow * 2, ph! + grow * 2, rad! + grow);
    box.container.addAt(g, 0);
    box.danger = g;
    if (this.motion === 'full') {
      g.setAlpha(0);
      this.tweens.add({ targets: g, alpha: 1, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      box.hpBar.pulse?.(true);
      if (box === this.playerBox || box === this.enemyBox) this.dangerSag(side, true);
    }
  }

  /**
   * The Pokémon in danger sags (a little shorter and wider) and breathes in 0.75 s instead of 1.8 s; `false` stands
   * it back up with its usual breath. Its looping breath is reset to the start first, so its size never drifts.
   */
  private dangerSag(side: Side, on: boolean): void {
    const v = side === 'player' ? this.playerSprite : this.enemySprite;
    const mon = this.shown[side];
    if (!(v instanceof Phaser.GameObjects.Sprite) || !v.active || !mon) return;
    const sagged = v.getData('sag') as { sx: number; sy: number } | undefined;
    if (on === Boolean(sagged)) return;
    standStill(this, v);
    if (on) {
      v.setData('sag', { sx: v.scaleX, sy: v.scaleY });
      v.setScale(v.scaleX * 1.03, v.scaleY * 0.95);
      stand(this, v, 'steady', this.motion === 'full', 0, 750);
    } else {
      v.setScale(sagged!.sx, sagged!.sy);
      v.setData('sag', undefined);
      this.standUp(v, mon);
    }
  }

  /** The event's own song, key and ambience when this fight belongs to a Legendary world event. */
  private legendMusicOn(): ReturnType<typeof legendMusic> {
    const { session } = services();
    const run = session.run;
    const def = run?.battle?.expedition && run.expedition ? session.content.expeditions.expeditions.find((e) => e.id === run.expedition!.id) : undefined;
    return def?.legendary ? legendMusic(session.content, def) : null;
  }

  /** True when this fight belongs to a Legendary world event (it then uses the event's own battleback). */
  private legendArenaOn(): boolean {
    const { session } = services();
    const run = session.run;
    const def = run?.battle?.expedition && run.expedition ? session.content.expeditions.expeditions.find((e) => e.id === run.expedition!.id) : undefined;
    return Boolean(def?.legendary && legendLook(session.content, def));
  }

  /** The UIE battleback for this fight (league halls, evening/night fields, distortion), or null for the type's own arena. */
  private uieArena(): string | null {
    const { session } = services();
    const run = session.run;
    const battle = run?.battle;
    if (!run || !battle) return null;
    // A Legendary world event's fights (finale included) take place in that event's own battleback.
    const legendDef = battle.expedition && run.expedition ? session.content.expeditions.expeditions.find((e) => e.id === run.expedition!.id) : undefined;
    const look = legendDef?.legendary ? legendLook(session.content, legendDef) : null;
    if (look) return uieArenaId(look.arena);
    if (battle.raid || battle.totem) return null;
    const boss = this.boss();
    const foe = battle.enemyTeam[battle.enemyIndex];
    const type = boss ? boss.types[0] : run.stage ? getTheme(session.content, run.stage.themeId).types[0] : undefined;
    if (!type) return null;
    const name = pickUieArena({
      seed: run.seed,
      stageIndex: run.stage?.index ?? 0,
      type,
      boss: boss ? { role: boss.role, eliteIndex: Math.max(0, run.stage?.eliteFour.indexOf(battle.trainer?.leaderId ?? '') ?? 0), final: isFinalBoss(session.content, run) } : null,
      shadowFoe: Boolean(foe?.shadow),
    });
    return name ? uieArenaId(name) : null;
  }

  /** Raids and Totems fight in the Raid Battles pack's arenas (weaker raids in the Ultra one, stronger in Max, the hardest in Tera). */
  /** The screen wipe this battle ends with (UIE rule masks; null = glass shutters). Stable per battle, presentation only. */
  private wipeMask() {
    const run = services().session.run;
    const foe = run?.battle?.enemyTeam[0];
    return run?.battle && foe ? pickWipe(`${run.seed}:${foe.uid}`) : null;
  }

  /** The raid or Totem song (presentation only). */
  private raidTrack(battle: RunState['battle'] & object): string | null {
    const legend = this.legendMusicOn();
    if (legend) return legend.fight;
    const { content } = services().session;
    const tier = battle.raid ? content.raids.raids.find((r) => r.id === battle.raid!.id)?.tier ?? 1 : null;
    return raidMusic(tier, Boolean(battle.totem), battle.raid?.id ?? 'totem');
  }

  private raidArena(battle: RunState['battle'] & object): string | null {
    const { content } = services().session;
    let key: string | null = null;
    if (battle.raid) {
      const tier = content.raids.raids.find((r) => r.id === battle.raid!.id)?.tier ?? 1;
      key = tier <= 2 ? 'ultra' : tier <= 4 ? 'max' : 'tera';
    } else if (battle.totem) key = 'tera2';
    const id = key ? `bg.raid.${key}` : null;
    return id && this.textures.exists(id) ? id : null;
  }

  /** The normal header, plus a raid status line (shield, phase count, charged attack, timer). */
  private updateHeader(): void {
    if (this.skinHud?.update && this.run.battle) this.skinHud.update(this.frameInfo());
    this.updateHeaderBase();
    this.status.setText('');
    this.updateSpectacleHud();
    const totem = this.run.battle?.totem;
    if (totem) {
      const tdef = services().session.content.totems.totems.find((x) => x.id === totem.id);
      const out = currentEnemy(this.run.battle!).uid !== totem.uid;
      const bits = ['TOTEM', tdef?.aura.text ?? ''];
      if (tdef?.ally) bits.push(out ? 'ALLY ON FIELD: defeat it' : totem.callsUsed >= tdef.ally.maxCalls ? 'no more ally calls' : `ally calls ${totem.callsUsed}/${tdef.ally.maxCalls}`);
      if (tdef && tdef.phases.length > 0) bits.push(`phase ${totem.phasesDone.length}/${tdef.phases.length}`);
      this.status.setText(bits.join('  ·  '));
      return;
    }
    const raid = this.run.battle?.raid;
    if (!raid) return;
    const content = services().session.content;
    const def = content.raids.raids.find((r) => r.id === raid.id);
    const parts = [`RAID T${def?.tier ?? '?'}`];
    parts.push(raid.shieldHp > 0 ? `SHIELD ${raid.shieldHp}/${raid.shieldMax}` : raid.pendingShields.length > 0 ? `${raid.pendingShields.length} shield${raid.pendingShields.length > 1 ? 's' : ''} to come` : 'no shield');
    if (def && def.phases.length > 0) parts.push(`phase ${raid.phasesDone.length}/${def.phases.length}`);
    if (raid.charging) parts.push('!! CHARGED ATTACK !!');
    if (raid.timerLeft !== null) parts.push(`${raid.timerLeft} turns left`);
    // S403 crowd, S411 puzzle, S397 weak spot, S393 bot, S407 gauntlet.
    parts.push(`CROWD ${Math.round(raid.crowd)}%`);
    const cur = raidDef(content, raid);
    const puzzle = cur.modifiers.puzzle;
    if (puzzle) parts.push(raid.puzzleSolved ? 'PUZZLE SOLVED' : `PUZZLE ${raid.puzzleStep}/${puzzlePattern(content, this.run.battle!).length} (${puzzle.pool.join('/')})`);
    const spot = exposedWeakSpot(content, this.run.battle!);
    if (spot) parts.push(`${spot.zone.toUpperCase()} EXPOSED${raid.aim ? ` · aiming ${raid.aim}` : ''}`);
    if (raid.coop) parts.push(`CO-OP P1 ${raid.coop.cheers[0]} cheers · P2 ${raid.coop.cheers[1]} cheers`);
    const bot = raidBot(content, raid);
    if (bot) parts.push(`ally: ${bot.label.split(' (')[0]}`);
    if (cur.gauntlet) parts.push(`form ${raid.formIndex + 1}/${cur.gauntlet.forms.length + 1}`);
    this.status.setText(parts.join('  ·  '));
  }

  /** Momentum Meter (yours; battle/spectacle.ts): plain text, always readable. */
  private hazards: HazardFloor | null = null;
  private bagIds: string[] = [];
  private lastTransformTap = -10000;
  private updateSpectacleHud(): void {
    const battle = this.run.battle;
    if (battle && !this.hazards) this.hazards = new HazardFloor(this);
    if (battle) this.hazards?.draw(battle.sideEffects, { player: PLAYER_POS, enemy: ENEMY_POS });
    this.adaptMusic();
    const spec = battle?.spectacle;
    if (!battle || !spec || battle.doubles) {
      this.momentumText.setText('');
      return;
    }
    const max = momentumMax(services().session.content);
    const filled = Math.round((spec.momentum / max) * 10);
    this.momentumText.setText(spec.momentum >= max ? 'MOMENTUM [==========]  RALLY READY!' : `MOMENTUM [${'='.repeat(filled)}${'-'.repeat(10 - filled)}]`);
  }

  private updateHeaderBase(): void {
    const run = this.run;
    const stage = run.stage;
    if (!stage) {
      this.header.setText(`Encounter ${run.encountersCompleted + 1}  ·  ₽${run.money}`);
      return;
    }
    const column = stage.current ? findNode(stage.map, stage.current).column : 0;
    const content = services().session.content;
    if (stage.kind === 'league') {
      const region = run.regionOrder.length > 0 ? currentRegion(content, run).name : '';
      this.header.setText(`${region} League · Battle ${column}/${stage.map.columns}  ·  ₽${run.money}`);
      return;
    }
    const theme = getTheme(content, stage.themeId);
    this.header.setText(`Stage ${stage.index + 1} · ${theme.name} · Level ${column}/${stage.map.columns}  ·  ₽${run.money}`);
  }

  // ---------- input and messages ----------

  private handleInput(action: InputAction): void {
    if (this.explainWait) {
      this.explainWait(action);
      return;
    }
    if (this.autoRunning) {
      if (action === 'back') this.autoCancel = true;
      return;
    }
    if (this.phGimInput) {
      this.phGimInput(action);
      return;
    }
    if (this.phWildDex) {
      if (action === 'confirm' || action === 'back') this.phWildDex.close();
      else if (action === 'left' || action === 'right') this.phWildDex.flip();
      return;
    }
    if (this.infoPanel) {
      if (action === 'back' || action === 'confirm') this.closePanel();
      return;
    }
    if (this.fx.busy && (action === 'confirm' || action === 'back')) {
      this.fx.skip();
      return;
    }
    if (this.picker) {
      this.picker.handle(action);
      return;
    }
    if (this.advance && (action === 'confirm' || action === 'back')) {
      this.advance();
      return;
    }
    this.menu?.handle(action);
  }

  /** Shows one message. Move and damage lines (`auto`) move on after a short delay; every other line waits for a confirm press. */
  private say(text: string, autoLine = false): Promise<void> {
    if (this.run?.battle?.eventRule?.silent) {
      text = '…';
      autoLine = true;
    }
    const settings = services().session.settings;
    // Only move and damage lines advance by themselves, unless Settings > Auto-advance is on.
    const auto = autoLine || settings.autoAdvance;
    const delay = settings.autoAdvance ? MESSAGE_DELAYS[settings.messageDelay] : MESSAGE_AUTO_ADVANCE_MS;
    const typingMs = this.typeText(auto ? text : `${text} ▼`, settings.textSpeed);
    this.history.push(text);
    if (this.history.length > 60) this.history.shift();
    return new Promise((resolve) => {
      const timer = auto ? this.time.delayedCall(delay + typingMs, () => done()) : null;
      const done = () => {
        timer?.remove(false);
        this.advance = null;
        resolve();
      };
      // Ignore the key press that opened this message.
      // While the text is still being typed, the first press shows the rest of it.
      this.time.delayedCall(120, () => (this.advance = () => (this.finishTyping() ? undefined : done())));
    });
  }

  /** A notice that waits for an input: the mock-ups' confirm box over the field in the New look, two text lines in the Old one. */
  private async tellNotice(n: ShotNotice): Promise<void> {
    if (!this.rx) {
      await this.say(`${n.title}.`);
      await this.say(n.body);
      return;
    }
    this.rxNotice = n;
    await new Promise<void>((resolve) => {
      // Ignore the key press that closed the last message.
      this.time.delayedCall(250, () => (this.advance = () => {
        this.advance = null;
        resolve();
      }));
    });
    this.rxNotice = null;
  }

  /** A damage number that floats up from the Pokémon that was hit (Settings > Damage numbers). */
  private moodTint: Phaser.GameObjects.Rectangle | null = null;

  /** Aero panel mood (M120): a faint weather tint over the battle UI. Cosmetic; off with animations off. */
  /** Whether the redesign's weather look draws this weather (rain, sun, sand, snow, with animations on). */
  private wxHandles(id: string | null | undefined): id is WxKind {
    return !!id && (WX_KINDS as readonly string[]).includes(id) && this.clipLevel() !== 'off' && !!this.wxLook;
  }

  /** A water move in rain or a fire move in sun (the 1.5x the engine gives them). */
  private wxBoosts(type: string): boolean {
    const k = this.wxLook?.current;
    return (k === 'rain' && type === 'water') || (k === 'sun' && type === 'fire');
  }

  /** The weather now: the redesign's look for rain, sun, sand and snow (with its entrance when `arrive`), the older layer for hail. */
  private async setWeather(w: { id: Weather; turns: number } | null, arrive: boolean): Promise<void> {
    const id = w?.id ?? null;
    const own = this.wxHandles(id);
    this.weatherLayer?.set(own ? null : id);
    this.applyMood(own ? null : id);
    if (!own || !w) {
      if (this.wxLook?.current) this.wxLook.clearNow();
      this.trLook?.chipAt(48);
      return;
    }
    const turns = wxTurns(w.turns);
    this.trLook?.chipAt(84);
    if (arrive) await this.wxLook!.arrive(id, turns);
    else this.wxLook!.show(id, turns);
  }

  /** Whether the redesign's terrain carpet draws this terrain (with animations on). */
  private trHandles(id: string | null | undefined): id is TerrainKind {
    return !!id && (TERRAIN_KINDS as readonly string[]).includes(id) && this.clipLevel() !== 'off' && !!this.trLook;
  }

  /** The terrain now: its carpet and chip (rolled out from the last mover's feet when `arrive`). */
  private async setTerrain(t: { id: string; turns: number } | null, arrive: boolean): Promise<void> {
    if (!t || !this.trHandles(t.id)) {
      if (this.trLook?.current) this.trLook.clearNow();
      return;
    }
    this.trLook!.chipAt(this.wxLook?.current ? 84 : 48);
    const turns = wxTurns(t.turns);
    if (arrive) await this.trLook!.arrive(t.id, turns, this.spotXY(this.phLast?.side === 'enemy' ? 'enemy' : 'player'));
    else this.trLook!.show(t.id, turns);
  }

  /** How many turns the terrain that just started has (the turn's end state; 5 when it has already moved on). */
  private trTurnsNow(id: string): number {
    const t = this.run.battle?.terrain;
    return t && t.id === id ? t.turns : 5;
  }

  /** How many turns the weather that just started has (the turn's end state; 5 when it has already moved on). */
  private wxTurnsNow(id: string): number {
    const w = this.run.battle?.weather;
    return w && w.id === id ? w.turns : 5;
  }

  /** The lightning flash of rain arriving: a sheet over the arena (under the boxes), softened by the flash settings. */
  private wxFlash(color: number, alpha: number, ms: number): void {
    const st = services().session.settings;
    const k = st.reducedFlash || !st.battleScreenEffects ? 0 : capFlash(st.effectIntensity, st.reducedFlash);
    if (k <= 0) return;
    const sheet = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, color, alpha * Math.min(1, k)).setOrigin(0).setDepth(860);
    this.tweens.add({ targets: sheet, alpha: 0, duration: ms, onComplete: () => sheet.destroy() });
  }

  /** A stamp at a fixed spot, as the mockups slam them: hard ones drop in big and tilted and shake the screen, soft ones
   *  (the weather boost) grow in; both hold 750 ms and lift away. */
  private wxStamp(word: string, fill: string, ink: string, x: number, y: number, soft = true): void {
    const key = stampPicture(this, word, fill, ink);
    if (!key) return;
    const full = this.clipLevel() === 'full';
    const st = this.add.image(x, y, key).setScale(PICTURE_SCALE * (full ? (soft ? 0.8 : 2.2) : 1)).setAngle(full && !soft ? -7 : 0).setDepth(4000);
    this.tweens.chain({
      targets: st,
      tweens: [
        { scale: PICTURE_SCALE, duration: full ? (soft ? 200 : 120) : 1, ease: soft ? 'Quad.easeOut' : 'Cubic.easeIn' },
        { y: y - 14, alpha: 0, duration: 200, delay: 750 },
      ],
      onComplete: () => st.destroy(),
    });
    if (full && !soft) this.time.delayedCall(120, () => this.wxShake(4, 120));
  }

  /** A short screen shake (px), if screen effects are on. */
  private wxShake(px: number, ms: number): void {
    const st = services().session.settings;
    if (st.battleScreenEffects) this.cameras.main.shake(ms, (px / GAME_WIDTH) * capFlash(st.shakeIntensity, st.reducedFlash));
  }

  /** An attack meets Protect (pass 8): rings where it lands, a shake, the PROTECTED stamp, the attacker pushed back. */
  private protectedMoment(side: Side): void {
    const level = this.clipLevel();
    if (level === 'off' || this.duo) return;
    const other: Side = side === 'enemy' ? 'player' : 'enemy';
    const guard = this.condSprite(side);
    const hitter = this.condSprite(other);
    if (!guard || !hitter) return;
    try {
      const spot = (sd: Side, sp: Phaser.GameObjects.Sprite): CondSpot => ({ ...this.spotXY(sd), w: sp.displayWidth, h: sp.displayHeight * sp.originY, side: sd });
      const g = spot(side, guard);
      const a = spot(other, hitter);
      const clip = protectedClip(a, g, level);
      const toward = side === 'enemy' ? -1 : 1;
      const cue = (name: string): void => {
        if (name === 'shake') this.wxShake(5, 200);
        // In front of the shield and up, clear of the info boxes (the mockup's spot sits where the game has your box).
        if (name === 'stamp') this.wxStamp('PROTECTED', '#3ec46d', '#131c36', Phaser.Math.Clamp(g.x + toward * (SHIELD.ahead + 60), side === 'enemy' ? 470 : 110, 520), Math.max(60, g.y - g.h / 2 - SHIELD.up - 66), false);
      };
      const mon = this.shown[other];
      if (!hitter.visible) return void playClip(this, clip, this.clipHost({}, { cue }));
      this.condPlay(hitter, clip, { attacker: { kind: 'mon', get: () => hitter } }, (cut) => {
        if (cut || !hitter.active) return;
        this.restAt(hitter, other);
        if (hitter.visible) this.standUp(hitter, mon);
      }, cue);
    } catch (err) {
      console.warn('Protect moment failed', err);
    }
  }

  /** The sandstorm's end-of-turn gust (pass 8): grit sweeps across and both Pokémon lean into it. */
  private sandGust(): void {
    if (this.wxLook?.current !== 'sand') return;
    const level = this.clipLevel();
    if (level === 'off') return;
    this.wxLook.gust();
    if (this.duo) return;
    for (const side of ['player', 'enemy'] as const) {
      const sprite = this.condSprite(side);
      if (!sprite || !sprite.visible) continue;
      const mon = this.shown[side];
      this.condPlay(sprite, gustLeanClip(level), {}, (cut) => {
        if (cut || !sprite.active) return;
        this.restAt(sprite, side);
        if (sprite.visible) this.standUp(sprite, mon);
      });
    }
  }

  private applyMood(weather: string | null): void {
    const st = services().session.settings;
    const mood = aeroMood(weather, null);
    if (st.disableAllAnimations || !st.battleScreenEffects || this.motion === 'off' || mood.strength === 0) {
      this.moodTint?.setAlpha(0);
      return;
    }
    this.moodTint ??= this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0xffffff, 0).setOrigin(0).setDepth(850).setData('noJuice', true).setName('aero-mood');
    this.moodTint.setFillStyle(mood.tint, 1);
    this.tweens.add({ targets: this.moodTint, alpha: mood.strength * 0.5, duration: 600 });
  }

  private lastMoveType = 'normal';
  /** Overhaul slice 6: the move each of your Pokémon used last this battle (uid -> move id), for the menu cursor. */
  private readonly lastMoves = new Map<string, string>();
  /** Overhaul slice 8: what you have seen each foe show (an ability that triggered, a held item that acted), by foe uid. The Info panel tells nothing else. */
  private readonly foeReveals = new Map<string, FoeReveals>();
  /** Overhaul slice 9: set while a first-time Hyper/Overdrive explanation waits for Continue; it takes every input. */
  private explainWait: ((action: InputAction) => void) | null = null;

  /** Presentation only: a short vibration pattern by move type (Settings > Haptic buzz), and a camera push-in on a KO. */
  private buzz(type: string, strong = false): void {
    if (!services().session.settings.haptics) return;
    try {
      navigator.vibrate?.(hapticPattern(type, strong));
    } catch {
      /* unsupported device */
    }
  }

  private camBusy = false;
  /** When the last critical-hit freeze played (pass 12): the old letterbox and camera push stay away for it. */
  private critFrozeAt = -1e9;
  /** The arena's back and ground pictures (the critical hit drains their colour). */
  private arenaLayers: Phaser.GameObjects.Image[] = [];
  /** The foe trainer's name, picture and title, kept for the closing lines after the battle is over. */
  private lastFoe: { name: string; art: { assetId: string; label: string }; title: string | null; role?: string } | null = null;
  /** Real-clock time the camera has sat off the wide view with no move running (for the watchdog below); 0 = on the wide view or moving. */
  private camOffSince = 0;
  /** While set (a scene that holds the camera on purpose, such as the opening), the watchdog leaves it alone. */
  private camPinned = false;

  /**
   * The camera bug (every version): a push-in whose pull-back timer never fired (scene time paused, a move cut short by another move) left the
   * battle zoomed in for good. This watchdog, on the real clock, eases the camera back to the wide view whenever it has sat off it with no move
   * running for a couple of seconds. Presentation only; it never touches the battle.
   */
  private startCameraWatchdog(): void {
    this.camOffSince = 0;
    this.camPinned = false;
    const check = (): void => {
      try {
        const cam = this.cameras.main;
        const moving = cam.zoomEffect.isRunning || cam.panEffect.isRunning || this.tweens.getTweensOf(cam).length > 0;
        const off = Math.abs(cam.zoom - 1) > 0.01 || Math.abs((cam as unknown as { rotation: number }).rotation) > 0.002 || Math.abs(cam.midPoint.x - GAME_WIDTH / 2) > 2 || Math.abs(cam.midPoint.y - GAME_HEIGHT / 2) > 2;
        if (!off || moving || this.camPinned) {
          this.camOffSince = 0;
          return;
        }
        const now = performance.now();
        if (this.camOffSince === 0) this.camOffSince = now;
        else if (now - this.camOffSince > 2200) {
          this.camOffSince = 0;
          this.camBusy = false;
          this.restoreCamera(450);
        }
      } catch {
        /* presentation only */
      }
    };
    const timer = window.setInterval(check, 400);
    this.events.once('shutdown', () => {
      window.clearInterval(timer);
      try {
        this.restoreCamera(0);
      } catch {
        /* scene already gone */
      }
    });
  }

  /** Eases the camera back to the whole arena (instantly for 0 ms). */
  private restoreCamera(ms: number): void {
    const cam = this.cameras.main;
    this.tweens.killTweensOf(cam);
    cam.zoomEffect.reset();
    cam.panEffect.reset();
    cam.setRotation(0);
    if (ms <= 0) {
      cam.setZoom(1);
      cam.centerOn(GAME_WIDTH / 2, GAME_HEIGHT / 2);
      return;
    }
    cam.pan(GAME_WIDTH / 2, GAME_HEIGHT / 2, ms, 'Sine.easeInOut', true);
    cam.zoomTo(1, ms, 'Sine.easeInOut', true);
  }

  /** S240: a short push-in toward the target of a big moment, then back. Presentation only; one shot at a time. */
  private cameraMove(e: RunEvent): boolean {
    try {
      const st = services().session.settings;
      if (st.battleCamera === 'off' || st.disableAllAnimations || !st.battleScreenEffects || this.camBusy) return false;
      const side = 'side' in e ? e.side : undefined;
      const bossAce = Boolean(this.boss()) && side === 'enemy' && e.type === 'faint' && this.run.battle ? this.run.battle.enemyIndex >= this.run.battle.enemyTeam.length - 1 : false;
      const shot = cameraShot(st.battleCamera, { type: e.type, side, crit: e.type === 'damage' ? e.crit : undefined, effectiveness: e.type === 'damage' ? e.effectiveness : undefined, bossAce }, this.motion);
      if (!shot || !side) return false;
      const at = side === 'enemy' ? ENEMY_POS : PLAYER_POS;
      const cam = this.cameras.main;
      this.camBusy = true;
      cam.pan(at.x, at.y - shot.lift, shot.moveMs, 'Sine.easeInOut');
      cam.zoomTo(shot.zoom, shot.moveMs);
      this.time.delayedCall(shot.moveMs + shot.holdMs, () => {
        cam.pan(GAME_WIDTH / 2, GAME_HEIGHT / 2, shot.moveMs, 'Sine.easeInOut');
        cam.zoomTo(1, shot.moveMs);
        this.time.delayedCall(shot.moveMs, () => { this.camBusy = false; });
      });
      // The scene clock can pause (dialogue, scene changes): the real clock brings the camera back anyway.
      window.setTimeout(() => {
        if (!this.sys?.isActive()) return;
        this.camBusy = false;
      }, shot.moveMs * 2 + shot.holdMs + 300);
      return true;
    } catch {
      this.camBusy = false;
      return false;
    }
  }

  private focusPush(kind: 'ko' | 'phase'): void {
    const st = services().session.settings;
    if (this.motion !== 'full' || st.disableAllAnimations || !st.battleScreenEffects) return;
    if (kind === 'ko' && st.battleCamera !== 'off') return;
    const f = cameraFocus(kind, animationStrength(st));
    const cam = this.cameras.main;
    this.tweens.add({ targets: cam, zoom: 1 + f.zoom, duration: f.ms / 2, yoyo: true, ease: 'Sine.easeInOut' });
  }


  /** Completes a message that is still being typed. Returns true when it was (the press is used up). */
  private finishTyping(): boolean {
    const t = this.typing;
    this.typing = null;
    return t ? t.stop() : false;
  }

  /**
   * Shows a message at once, or types it out (Settings > Text speed) with speech pacing: short
   * pauses at commas and full stops, a drag on "...". Returns the typing time in ms. The full
   * text is always the message's text.
   */
  private typeText(text: string, speed: 'instant' | 'faster' | 'fast' | 'normal' | 'slow'): number {
    this.typing?.stop();
    this.typing = null;
    if (speed === 'instant' || this.motion === 'off') {
      this.message.setText(text);
      return 0;
    }
    const plan = planSpeech(text, TEXT_MS[speed]);
    const handle = typeSpeech(this, this.message, { ...plan, shakeAt: [] }, { speed: 'normal', motion: this.motion, onDone: () => {
      if (this.typing && !this.typing.typing()) this.typing = null;
    } });
    this.typing = handle.typing() ? handle : null;
    return plan.total;
  }

  /** The open battle log switches to another filter (keys 1-5, or a click on a tab). */
  private setLogTab(id: LogTab | undefined): void {
    if (!this.historyView || !id) return;
    this.logTab = id;
    this.historyView.destroy();
    this.historyView = null;
    this.toggleHistory();
  }

  /** H: show or hide the last battle messages, with filter tabs (ideas W1 F3). */
  private logTab: LogTab = 'all';
  private toggleHistory(): void {
    if (this.historyView) {
      this.historyView.destroy();
      this.historyView = null;
      return;
    }
    const bg = this.add.rectangle(0, 0, GAME_WIDTH - 80, 360, 0x0b1a2e, 0.92).setOrigin(0).setStrokeStyle(2, 0xbfe9ff);
    const title = this.add.text(16, 8, 'Battle log (H to close, 1-5 or tabs to filter)', textStyle(18, '#bfe9ff'));
    const body = this.add.text(16, 66, '', textStyle(16, COLORS.textLight, { lineSpacing: 4, wordWrap: { width: GAME_WIDTH - 112 } }));
    const view = this.add.container(40, 60, [bg, title, body]).setDepth(2000);
    this.historyView = view;
    const buttons: Phaser.GameObjects.Text[] = [];
    const refresh = () => {
      const lines = filterLog(this.history, this.logTab).slice(-12);
      body.setText(lines.length ? lines.join('\n') : 'Nothing here yet.');
      buttons.forEach((b, i) => b.setColor(LOG_TABS[i]!.id === this.logTab ? '#ffe060' : '#bfe9ff'));
    };
    LOG_TABS.forEach((t, i) => {
      const b = this.add.text(16 + i * 120, 36, `${i + 1} ${t.label}`, textStyle(18, '#bfe9ff', { backgroundColor: '#14304f', padding: { x: 8, y: 3 } })).setInteractive({ useHandCursor: true });
      b.on('pointerdown', () => {
        this.logTab = t.id;
        refresh();
      });
      buttons.push(b);
      view.add(b);
    });
    refresh();
  }

  /** Adaptive music (ideas W1): faster as your lead's HP drops. */
  private adaptMusic(): void {
    const settings = services().session.settings;
    const mon = this.run.party[this.run.battle?.activeIndex ?? 0];
    if (!settings.adaptiveMusic || !mon) return setMusicIntensity(1);
    const share = mon.hp / Math.max(1, maxHp(services().session.content, mon));
    const track = this.baseTrack ? lowHpTrack(this.baseTrack, share) : '';
    if (track && track !== this.playingTrack) {
      this.playingTrack = track;
      playMusicLazy(this, track, this.baseTrack);
    }
    setMusicIntensity(share < 0.25 ? 1.1 : share < 0.5 ? 1.05 : 1);
  }

  /** The skill prompt for a move, if the player turned skill prompts on: aim drag or a signature shout. */
  private async moveSkill(moveId: string, signature: boolean): Promise<SkillInput | undefined> {
    const { session } = services();
    if (!session.settings.skillPrompts) return undefined;
    const content = session.content;
    const kind = aimable(content, moveId) ? 'aim' : signature ? 'shout' : null;
    if (!kind) return undefined;
    const result = await runInteractionPrompt(this, promptById(kind === 'aim' ? 'aim-drag' : 'shout-tap'), { motion: this.motion });
    return { kind, grade: result.grade };
  }

  /** Pidgey's Resolve: one step of a watched fight: the cheer question (finale, first time Pidgeot is low), otherwise the next turn by itself. */
  private async spectateStep(): Promise<void> {
    const { session } = services();
    if (cheerDue(session.content, this.run)) {
      this.showSkyCheerMenu();
      return;
    }
    // gn.47 the Exhibition: three times in the match the player is asked what they do (cheer, watch closely, look at the crowd).
    const moment = session.exhibitionMoment();
    if (moment) {
      this.showExhibitionMenu(moment);
      return;
    }
    this.autoRunning = true;
    this.clearMenus();
    this.tabs.show(false);
    // (The Exhibition is a long match, six on six: a short breath between turns keeps it near the doc's minute; Battle speed shortens it further.)
    await new Promise<void>((done) => this.time.delayedCall(session.exhibitionOn() ? EXHIBITION_PICK_MS : AUTO_PICK_MS, () => done()));
    this.autoRunning = false;
    const battle = this.run.battle;
    if (!battle) return;
    const forced = forcedMoveIndex(battle, this.run.party);
    if (forced !== null && !session.exhibitionOn()) await this.act({ kind: 'move', index: forced });
    else await this.act({ kind: 'move', index: 0 }, true);
  }

  /** gn.47: one of the Exhibition's three moments. The lines are read, then the three choices; the answer is read, and the match goes on. */
  private showExhibitionMenu(moment: { lines: string[]; ask: string; choices: readonly { key: string; label: string }[] }): void {
    this.clearMenus();
    this.tabs.show(false);
    void this.readAloud(moment.lines).then(() => {
      this.commandWindow.setVisible(true);
      this.message.setText(moment.ask);
      this.menu = new Menu(this, {
        x: COMMAND_X + 24,
        y: MESSAGE_Y + 18,
        options: moment.choices.map((c) => ({ label: c.label })),
        columns: 1,
        itemWidth: 300,
        itemHeight: 36,
        fontSize: 22,
        color: this.btnText,
        glass: { paint: this.skin?.pill, tints: [0x1f9a52, 0x2a6fc8, 0xc8303c], motion: this.motion },
        onSelect: (i) => {
          this.clearMenus();
          const lines = services().session.exhibitionAnswer(moment.choices[i]!.key);
          void this.readAloud(lines).then(() => this.nextPrompt());
        },
      });
    });
  }

  /** The finale's one question: who to cheer for. Cheering is the only thing the player does in a watched fight. */
  private showSkyCheerMenu(): void {
    this.clearMenus();
    this.tabs.show(false);
    this.message.setText(chunkLines([FINALE_ASK])[0] ?? '');
    void this.readAloud([FINALE_ASK]).then(() => {
      this.commandWindow.setVisible(true);
      this.message.setText('Who are you cheering for?');
      this.menu = new Menu(this, {
        x: COMMAND_X + 24,
        y: MESSAGE_Y + 26,
        options: [{ label: 'Pidgeot!' }, { label: 'Fearow!' }],
        columns: 1,
        itemWidth: 300,
        itemHeight: 50,
        fontSize: 24,
        color: this.btnText,
        glass: { paint: this.skin?.pill, tints: [0x1f9a52, 0xc8303c], motion: this.motion },
        onSelect: (i) => {
          this.clearMenus();
          const line = services().session.skyCheer(i === 0 ? 'pidgeot' : 'fearow');
          void this.readAloud([line]).then(() => this.nextPrompt());
        },
      });
    });
  }

  /**
   * A choice in the middle of the battle (core/greenneedle/ask.ts): the question in the text box, its 2 to 4 answers as buttons.
   * The answer is one action (no turn used); the fight goes on from there. `back`: opened from a menu button, so Back returns to the menu.
   */
  private showAskMenu(ask: AskView, back = false): void {
    this.clearMenus();
    this.tabs.show(false);
    // A long question is read first, piece by piece; its short prompt stays beside the answers.
    const pieces = ask.text === ask.prompt ? [] : chunkLines([ask.text]);
    const last = ask.prompt;
    const open = (): void => {
      const n = ask.options.length;
      this.commandWindow.setVisible(true);
      this.message.setText(last);
      this.menu = new Menu(this, {
        x: COMMAND_X + 24,
        y: MESSAGE_Y + (n >= 4 ? 8 : n === 3 ? 14 : 26),
        options: ask.options.map((o) => ({ label: o.label })),
        columns: 1,
        itemWidth: 320,
        itemHeight: n >= 4 ? 32 : n === 3 ? 38 : 50,
        fontSize: n >= 4 ? 18 : n === 3 ? 20 : 22,
        color: this.btnText,
        glass: { paint: this.skin?.pill, tints: [0x1f9a52, 0x2c6ad8, 0xc08a10, 0xc8303c], motion: this.motion },
        onSelect: (i) => {
          this.commands = [];
          void this.act({ kind: 'answer', ask: ask.id, option: ask.options[i]!.index });
        },
        onBack: back ? () => this.showRootMenu() : undefined,
      });
    };
    if (pieces.length === 0) open();
    else void (async () => { for (const piece of pieces) await this.say(piece); })().then(open);
  }

  /** Reads story lines in the message box, cut so each piece fits, one confirm press per piece (nothing disappears by itself). */
  private async readAloud(lines: readonly string[]): Promise<void> {
    for (const piece of chunkLines(lines)) await this.say(piece);
  }

  /** The trainer's deal: accept (the fight ends, bigger prize, no EXP) or refuse (no turn used). */
  private showDealMenu(): void {
    const battle = this.run.battle!;
    const money = Math.round(services().session.content.balance.w1.play.deal.money * 100);
    this.clearMenus();
    this.message.setText(`${battle.trainer?.name ?? 'The trainer'} is nearly beaten and offers a deal: end the fight now for ${money}% prize money, but no EXP. Accept?`);
    this.commandWindow.setVisible(true);
    this.menu = new Menu(this, {
      x: COMMAND_X + 24,
      y: MESSAGE_Y + 26,
      options: [{ label: 'Accept the deal' }, { label: 'Keep fighting' }],
      columns: 2,
      itemWidth: 170,
      itemHeight: 50,
      fontSize: 24,
      color: this.btnText,
      glass: { paint: this.skin?.pill, tints: [0x1f9a52, 0xc8303c], motion: this.motion },
      onSelect: (i) => {
        this.commands = [];
        void this.act({ kind: 'deal', accept: i === 0 });
      },
      onBack: () => this.showRootMenu(),
    });
  }

  /** Greenneedle gn.59: the Leader's weight has shifted. Will they switch? (No turn used.) */
  private showPredictMenu(): void {
    this.clearMenus();
    this.message.setText('Their weight has gone onto the back foot. Are they about to switch?');
    this.commandWindow.setVisible(true);
    this.menu = new Menu(this, {
      x: COMMAND_X + 24,
      y: MESSAGE_Y + 26,
      options: [{ label: 'They\'re switching' }, { label: 'They\'re staying' }],
      columns: 2,
      itemWidth: 170,
      itemHeight: 50,
      fontSize: 22,
      color: this.btnText,
      glass: { paint: this.skin?.pill, tints: [0x1f9a52, 0xc8303c], motion: this.motion },
      onSelect: (i) => {
        this.commands = [];
        void this.act({ kind: 'predict', yes: i === 0 });
      },
      onBack: () => this.showRootMenu(),
    });
  }

  /** The Pokédex scan mini-game: a right guess lists the foe's weaknesses in the info panel. */
  private async scanFoe(): Promise<void> {
    const content = services().session.content;
    const battle = this.run.battle!;
    const foe = this.duo ? (this.shown.enemy ?? currentEnemy(battle)) : currentEnemy(battle);
    const species = getSpecies(content, foe.speciesId);
    this.clearMenus();
    const ok = await runScan(this, content, species.name, species.types, `${foe.uid}:${battle.turn}`);
    battle.scanned = ok ? 'ok' : 'fail';
    await this.say(ok ? `Scan complete! ${species.name} is weak to ${weaknessesOf(content, species.types).join(', ') || 'nothing in particular'}.` : `The scan came back unclear.`);
    this.showRootMenu();
  }

  /** A Bag item with no target: a ball gets the optional skill throw once the foe is weakened; a berry toss arcs to the ally. */
  private async useBagItem(itemId: string): Promise<void> {
    const content = services().session.content;
    const item = content.items.get(itemId);
    const battle = this.run.battle!;
    let skill: SkillInput | undefined;
    if (item?.effect.kind === 'catch' && services().session.settings.skillPrompts && battle.kind === 'wild') {
      const foe = currentEnemy(battle);
      if (foe.hp / Math.max(1, maxHp(content, foe)) <= content.balance.w1.play.throw.weakenedBelow || foe.status) {
        const result = await runInteractionPrompt(this, promptById('throw-ring'), { motion: this.motion });
        skill = { kind: 'throw', grade: result.grade };
      }
    }
    this.submit(skill ? { kind: 'item', itemId, throwSkill: skill } : { kind: 'item', itemId });
  }

  /** Pin or unpin the highlighted Bag item on the hotbar (P). */
  private toggleHotbar(itemId: string): void {
    const settings = services().session.settings;
    const has = settings.hotbar.includes(itemId);
    const next = has ? settings.hotbar.filter((x) => x !== itemId) : [...settings.hotbar, itemId].slice(-4);
    services().session.saveSettings({ ...settings, hotbar: next });
  }

  private clearMenus(): void {
    this.storyBar?.accent(null);
    this.tweens.killTweensOf(this.reticle ?? []);
    this.reticle?.destroy();
    this.reticle = null;
    for (const t of this.reachTags) t.destroy();
    this.reachTags = [];
    this.rxAim = null;
    this.menu?.destroy();
    this.menu = null;
    this.picker?.close();
    this.picker = null;
    this.moveInfo.setVisible(false);
    this.moveBadges?.destroy();
    this.moveBadges = null;
    this.actionTabUi?.destroy();
    this.actionTabUi = null;
    this.rxGim = null;
    this.rxMoves = false;
    this.commandWindow.setVisible(false);
    this.message.setVisible(true);
    this.tabs?.show(false);
    this.infoPanel?.destroy();
    this.infoPanel = null;
  }

  // ---------- intro ----------

  /** Plays the opening; if any part of the show fails, the Pokémon and boxes still appear and the battle goes on. */
  private async intro(): Promise<void> {
    await this.flightNorthEntrance();
    if (await this.rivalStepInScene()) return;
    try {
      await this.introShow();
    } catch (e) {
      console.warn('Battle intro failed; showing the fighters anyway', e);
      await this.recoverIntro().catch((e2) => console.warn('Battle intro recovery failed', e2));
      this.busy = false;
      this.nextPrompt();
    }
  }

  /** Beta 0.7 Flight North: the Bug-type's return swoops in (Mega Beedrill or Gigantamax-sized Butterfree) before its fight begins. Presentation only. */
  private async flightNorthEntrance(): Promise<void> {
    const assist = this.run.battle?.finaleAssist;
    if (!this.run.battle?.flightNorth || !assist || assist.id !== 'flight-north' || assist.strikesLeft < 6) return;
    try {
      const sp = services().session.content.species.get(assist.speciesId);
      if (!sp) return;
      await loadAssets(this, pokemonArtIds([sp], { front: true, back: false, shiny: false, cry: false })).catch(() => undefined);
      const at = this.spotXY('player');
      const vis = pokemonVisual(this, sp, 'front', at.x + 90, at.y, PIXEL_SCALE * 1.3, false, {});
      await this.playBeat(cameoBeat(this, vis, { x: at.x + 90, y: at.y - 40 }, 'return', this.motion));
    } catch (e) {
      console.warn('Flight North entrance failed', e);
    }
  }

  /** The rival's picture: its own character if it has one, else its trainer class. */
  private rivalArt(rival: { classId: string; name: string }): { assetId: string; label: string } | null {
    const content = services().session.content;
    const character = rival.classId === 'rival' ? rivalBossFor(content, rival.name) : undefined;
    if (character) return { assetId: character.sprites.default, label: rival.name };
    const cls = content.trainers.get(rival.classId);
    return cls ? { assetId: cls.spriteAssetId, label: rival.name } : null;
  }

  /**
   * A rival may step into this battle before it starts (core/rivals/stepIn.ts): help (the battle goes on), battle you first,
   * or throw a ball at the wild Pokémon. Returns true when the scene was left for another one. Presentation only: the outcome
   * is already decided in the core, so a failing animation never changes it.
   */
  private async rivalStepInScene(): Promise<boolean> {
    const { session } = services();
    let res: ReturnType<typeof session.rivalStepIn> = null;
    try {
      res = session.rivalStepIn();
    } catch (e) {
      console.warn('Rival step-in failed', e);
      return false;
    }
    if (!res) return false;
    const motion = this.motion;
    let visual: Awaited<ReturnType<typeof rivalEntrance>> = null;
    try {
      const art = this.rivalArt(res.rival);
      const st = session.settings;
      const home = { x: 200, y: 400 };
      if (res.kind === 'catch') {
        const foe = this.shown.enemy;
        const sprite = foe ? this.showSprite('enemy', foe, false) : null;
        visual = await rivalEntrance(this, motion, art, 'left', home);
        await this.playBeat(stamp(this, res.legend ? (res.legend === 'mythical' ? 'MYTHICAL!' : 'LEGENDARY!') : 'RIVAL!', `${res.rival.name} throws first`, this.foeRim(), motion));
        await rivalCatch(this, motion, { x: home.x + 40, y: home.y - 150 }, { x: ENEMY_POS.x, y: ENEMY_POS.y - 20 }, sprite);
        if (res.legend) await legendFlash(this, motion, capFlash(st.effectIntensity, st.reducedFlash));
      } else {
        visual = await rivalEntrance(this, motion, art, res.kind === 'assist' ? 'left' : 'right', res.kind === 'assist' ? home : { x: 560, y: 400 });
        await this.playBeat(stamp(this, res.kind === 'assist' ? 'RIVAL ASSIST!' : 'RIVAL BATTLE!', res.kind === 'assist' ? `${res.rival.name} joins in` : `${res.rival.name} blocks the way`, this.foeRim(), motion));
        if (res.kind === 'assist' && visual) aceBurst(this, motion, visual.x + 70, visual.y - 40);
      }
    } catch (e) {
      console.warn('Rival step-in animation failed', e);
    }
    for (const line of res.lines) await this.say(line);
    try {
      await rivalExit(this, motion, visual, res.kind === 'duel' ? 'right' : 'left');
    } catch (e) {
      console.warn('Rival step-in exit failed', e);
    }
    this.assistAfter = res.afterLine ?? null;
    if (res.next === 'continue') return false;
    await exitWipe(this, motion, this.wipeMask());
    this.scene.start(sceneForRun(res.run));
    return true;
  }

  /** The rival's duel is over: say what happens next, then go to the real battle (win) or on with the run (loss). */
  private async finishStepInDuel(end: NonNullable<TurnResult['stepIn']>, run: RunState): Promise<void> {
    const motion = this.motion;
    const st = services().session.settings;
    if (end.won) {
      await this.playBeat(stamp(this, 'YOU WON!', `${end.rival.name} heals your team`, this.foeRim(), motion));
    } else if (end.legend) {
      await legendFlash(this, motion, capFlash(st.effectIntensity, st.reducedFlash));
      await this.playBeat(stamp(this, end.legend === 'mythical' ? 'MYTHICAL!' : 'LEGENDARY!', `${end.rival.name} takes it`, this.foeRim(), motion));
    }
    for (const line of end.lines) await this.say(line);
    await exitWipe(this, motion, this.wipeMask());
    this.scene.start(sceneForRun(run));
  }

  /** After a failed opening: the arena must never stay empty. Draws whoever is not on screen yet (presentation only). */
  private async recoverIntro(): Promise<void> {
    const battle = this.run.battle!;
    if (this.duo) {
      await this.showDuoSide('enemy', false);
      await this.showDuoSide('player', false);
      return;
    }
    if (!this.enemySprite?.active) this.showSprite('enemy', this.shown.enemy, false);
    await this.refreshInfoBox(this.enemyBox, this.shown.enemy, false);
    if (!battle.needsSwitch) {
      if (!this.playerSprite?.active) this.showSprite('player', this.shown.player, false);
      await this.refreshInfoBox(this.playerBox, this.shown.player, false);
    }
  }

  private async introShow(): Promise<void> {
    const battle = this.run.battle!;
    const title = this.trainerTitle();
    if (battle.turn === 1 && !battle.needsSwitch) {
      this.phTally.clear();
      this.phTallyKey = battle.enemyTeam[0]?.uid ?? '';
      this.phHits = 0;
      this.phLast = null;
      interactionLog.tell('stage', battle.trainer ? (title ?? battle.trainer.name) : `Wild ${this.speciesName(battle.enemyTeam[0]!)}`, 'Battle');
      await this.playIntro();
      // A lone wild Pokémon gets the redesign's own entrance (pass 5); its bars stand in for the opening sweep.
      const wildIn = !battle.trainer && !this.duo && !battle.raid && !battle.totem && !this.phCards();
      // The foe trainer waits on the platform (a black shape at first) while the camera sweeps over the arena.
      const openArt = this.trainerArt();
      const openTitle = this.trainerTitle();
      const foeTrainer = openTitle && openArt ? trainerVisual(this, openArt.assetId, openArt.label, ENEMY_POS.x, ENEMY_POS.y, 2.5) : null;
      // Every foe trainer stands the same height on the platform (the reference's Red and N are the yardstick).
      if (foeTrainer) fitTrainer(this, foeTrainer, ENEMY_POS.y);
      if (!(wildIn && this.clipLevel() === 'full')) await this.playBeat(openingReveal(this, this.motion, ENEMY_POS, foeTrainer));
      await this.skin?.intro?.(this, this.frameInfo());
      const modeLine = modeBattleLine(this.run.rules.modeId, !!battle.trainer && isBossClass(battle.trainer.classId));
      if (modeLine) await this.say(modeLine);
      const art = this.trainerArt();
      let foeRow: BallRow | null = null;
      if (title && art && foeTrainer) {
        const trainerSprite = foeTrainer;
        foeRow = partyBallRow(this, 'foe', battle.enemyTeam.map((m) => m.hp > 0), this.motion, 150);
        await this.say(isUltimateBattle(this.run) ? `${title}, your Ultimate Rival, blocks the way!` : battle.rivalId ? `${title} is back to beat you!` : battle.returning ? `${title} is back for a rematch!` : battle.nemesis ? `${title} is back, and so is your nemesis!` : battle.hunted ? `${title} came hunting for you!` : battle.rival ? `${title} challenges you to a rival battle!` : `${title} would like to battle!`, true);
        const classLine = !battle.rival && !battle.rivalId && !battle.returning && !battle.nemesis && !battle.hunted ? services().session.content.trainers.get(battle.trainer?.classId ?? '')?.lines?.intro : undefined;
        if (classLine) await this.speak(battle.trainer?.name ?? title, classLine);
        await this.storyIntro();
        // The trainer throws a ball up over the platform; the Pokémon appears in the burst and drops in.
        // The camera swings over to the foe's side while the ball is thrown, then settles back as the Pokémon lands.
        this.camPinned = true;
        cameraTo(this, this.motion, { x: 560, y: ENEMY_POS.y - 20 }, 1.15, 500);
        await foeBallThrow(this, this.motion, { x: trainerSprite.x - 30, y: trainerSprite.y - 110 }, { x: ENEMY_POS.x, y: ENEMY_POS.y - 130 }, trainerSprite);
        if (this.duo) {
          cameraTo(this, this.motion, null, 1, 300);
          this.camPinned = false;
          await this.playBeat(stamp(this, this.duo.size === 3 ? 'TRIPLE BATTLE!' : 'DOUBLE BATTLE!', title, this.foeRim(), this.motion));
          await this.showDuoSide('enemy', true);
          foeRow?.out();
          await this.say(`${title} sent out ${this.nameList([this.shown.enemy, ...this.otherMons('enemy')])}!`);
        } else {
          const dropped = this.showSprite('enemy', this.shown.enemy);
          dropIn(this, this.motion, dropped);
          // The foe's box slides in a beat after it lands (the reference).
          if (this.motion === 'full') await sleep(this, 550);
          cameraTo(this, this.motion, null, 1, 450);
          this.camPinned = false;
          await this.refreshInfoBox(this.enemyBox, this.shown.enemy, false);
          foeRow?.out();
          if (battle.rivalNote) await this.say(battle.rivalNote);
          const riskText = riskLine(services().session.content, battle, this.run.party);
          if (riskText) await this.say(riskText);
          if (battle.nemesisNote) await this.say(battle.nemesisNote);
          if (battle.memory?.note) await this.say(battle.memory.note);
          if (battle.memoryNote) await this.say(battle.memoryNote);
          await this.say(`${title} sent out ${this.speciesName(this.shown.enemy)}!`, true);
        }
      } else if (this.duo) {
        // Wild Pokémon in a pair.
        await this.showDuoSide('enemy', true);
        await this.say(`Wild ${this.nameList([this.shown.enemy, ...this.otherMons('enemy')])} appeared!`);
      } else {
        if (wildIn) await this.wildEntranceMoment(this.shown.enemy);
        else {
          this.showSprite('enemy', this.shown.enemy);
          await this.refreshInfoBox(this.enemyBox, this.shown.enemy, false);
        }
        await this.say(battle.nemesis ? `Your nemesis, ${this.speciesName(this.shown.enemy)}, appeared!` : battle.monRival ? `Your ${this.speciesName(this.shown.enemy)} rival appeared!` : `A wild ${this.speciesName(this.shown.enemy)} appeared!`);
        // Shadow and Blissful foes announce themselves (a dark haze / soft motes) before the fight.
        if (this.shown.enemy.blissful) {
          const aura = services().session.content.shadowWorld.auras.find((x) => x.id === this.shown.enemy!.blissful!.aura);
          await burstReveal(this, ENEMY_POS.x, ENEMY_POS.y - 60, Number.parseInt((aura?.color ?? '#ffe9a8').slice(1), 16), this.motion).done;
          await this.say('It glows with a soft, serene light. It does not seem to want a fight.');
        } else if (this.shown.enemy.shadow) await this.say('A dark aura clings to it, and its eyes are empty.');
        if (battle.nemesisNote) await this.say(battle.nemesisNote);
        // §11 a Pokémon rival (or the memory of one that is gone).
        if (battle.monRival) await this.playBeat(stamp(this, 'RIVAL!', 'It remembers', this.foeRim(), this.motion));
        if (battle.rivalNote) await this.say(battle.rivalNote);
      }
      if (this.shown.enemy.shiny) await this.shinySparkle();
      await this.formIntroBeat(this.shown.enemy);
      if (this.duo) {
        await this.phSendCard();
        await this.duoThrowPose();
        await this.showDuoSide('player', true);
        await this.say(`Go! ${this.nameList([this.shown.player, ...this.otherMons('player')])}!`);
      } else {
        await this.phSendCard();
        // The camera looks across to your side while your trainer throws.
        const playerRow = partyBallRow(this, 'player', this.run.party.map((m) => m.hp > 0), this.motion, MESSAGE_Y - 46);
        this.camPinned = true;
        cameraTo(this, this.motion, { x: 400, y: PLAYER_POS.y - 100 }, 1.2, 600);
        const goLine = this.say(`Go! ${this.speciesName(this.shown.player)}!`, true);
        // The ball leaves the hand, lands, bounces and bursts; your Pokémon pops out and settles (redesign send-out).
        await this.sendMoment('player', this.shown.player, await this.throwPose());
        // The camera pulls back and your box slides in a beat after your Pokémon lands.
        cameraTo(this, this.motion, null, 1, 450);
        this.camPinned = false;
        await this.refreshInfoBox(this.playerBox, this.shown.player, false);
        playerRow.out();
        await goLine;
      }
    } else if (this.duo) {
      await this.showDuoSide('enemy', false);
      await this.showDuoSide('player', false);
      await this.say(`The ${this.duo.size === 3 ? 'triple' : 'double'} battle continues! (turn ${battle.turn})`);
    } else {
      this.showSprite('enemy', this.shown.enemy, false);
      await this.refreshInfoBox(this.enemyBox, this.shown.enemy, false);
      if (!battle.needsSwitch) {
        this.showSprite('player', this.shown.player, false);
        await this.refreshInfoBox(this.playerBox, this.shown.player, false);
      }
      await this.say(`The battle continues! (turn ${battle.turn})`);
    }
    // Entry abilities (Intimidate, Drizzle) of the first two Pokémon.
    const { session } = services();
    // A wild Pokémon's first impression (presentation only; a reload may show it again).
    const framing = battle.kind === 'wild' && battle.turn === 1 ? wildBehavior(session.content, session.run!) : null;
    if (framing) {
      await this.say(framing.sign);
      await this.say(framing.line);
    }
    // The pack's party narration for a shiny, a legend or the weather at the start of a wild fight (text only).
    if (battle.kind === 'wild' && battle.turn === 1) {
      const foe = currentEnemy(battle);
      const sp = session.content.species.get(foe.speciesId);
      const ctx = battleStartContext({ shiny: foe.shiny, tags: sp?.tags ?? [] }, battle.weather?.id);
      const party = session.run!.party;
      const nameOf = (m: { speciesId: string }) => session.content.species.get(m.speciesId)?.name ?? m.speciesId;
      const line = ctx ? partyNarration(party, ctx, `${session.run!.runId}:${session.run!.encountersCompleted}:${ctx}`, nameOf, (m) => session.content.species.get(m.speciesId)?.types ?? []) : null;
      if (line) await this.say(line);
    }
    void ensureNarration().catch(() => undefined);
    if (battle.kind === 'trainer') await ensureTrainerLines().catch(() => undefined);
    for (const line of session.battleOpening()) await this.sayTrainer(line);
    if ((battle.pendingEntry ?? []).length > 0 && !battle.needsSwitch) {
      const before = structuredClone(session.run!);
      const events = session.beginBattle();
      await this.playEvents(events, before, title);
    }
    this.busy = false;
    this.nextPrompt();
  }

  /** S16 Trainer Introductions in a Story Run: a rival, Gym Leader, Elite Four or Champion says the intro lines (presentation only). */
  private async storyIntro(): Promise<void> {
    const v2 = this.run.story.v2;
    const battle = this.run.battle!;
    const pick = v2 ? introForBattle(battle) : null;
    const intro = pick ? trainerIntro(pick.id) : undefined;
    if (!pick || !intro || !battle.trainer) return;
    const { content } = services().session;
    const lead = this.run.party.find((m) => m.hp > 0) ?? this.run.party[0];
    const values = { speaker: battle.trainer.name, title: pick.title, player: v2?.protagonist?.name || 'Trainer', pokemon: lead ? this.speciesName(lead) : 'your partner', team: '', region: '', town: '' };
    const out = introText(intro, (k) => content.storyData.text[k], values);
    if (out.title) await this.say(out.title);
    for (const line of out.lines) {
      // Narration (no quotes) goes in the message bar; quoted speech is the trainer's line.
      if (line.startsWith('"')) await this.speak(battle.trainer.name, line.replace(/^"|"$/g, ''));
      else await this.say(line);
    }
  }

  /** New UI: what the level-up window shows for this Pokémon reaching `level` (its stats then, and the step from the level before). */
  private levelWindow(uid: string, from: number, level: number, old?: PokemonInstance): BattleLevel | null {
    const { content } = services().session;
    // As it was before the battle's end changed it (an evolution comes after the level).
    const now0 = this.run.party.find((m) => m.uid === uid);
    const real = now0 ? { ...now0, speciesId: old?.speciesId ?? now0.speciesId } : undefined;
    if (!real) return null;
    const now = calcStats(content, { ...real, level }), was = calcStats(content, { ...real, level: Math.max(1, from) });
    const names: [keyof typeof now, string][] = [['hp', 'HP'], ['atk', 'Attack'], ['def', 'Defense'], ['spa', 'Sp. Atk'], ['spd', 'Sp. Def'], ['spe', 'Speed']];
    return { name: this.speciesName(real), file: monFile(this, real.speciesId, 'front', !!real.shiny), from: Math.max(1, from), to: level, stats: names.map(([k, label]) => [label, now[k], now[k] - was[k]] as const) };
  }

  /** New UI: the versus card as a beat (a key or a click moves on). Null when motion is off for an ordinary Trainer. */
  private rxVersus(plain: boolean): Beat | null {
    const battle = this.run.battle!;
    const trainer = battle.trainer;
    if (!trainer || (plain && this.motion === 'off')) return null;
    const { content, settings } = services().session;
    const boss = this.boss();
    const standIn = !!boss && !!battle.rivalId;
    const cls = content.trainers.get(trainer.classId);
    const team = evilTeam(content, this.run);
    const lead = battle.enemyTeam[0];
    const v2 = this.run.story.v2;
    let line = '';
    try {
      line = battleOpening(content, this.run, settings.dialogueFrequency).drama[0]?.text ?? '';
    } catch {
      line = '';
    }
    const model: VersusModel = {
      name: boss && !standIn ? boss.name : trainer.name,
      // A tier-5 rival names its win condition before the fight (the mock-up's "Rival · plans to sweep").
      role: boss ? boss.title.replace(boss.name, '').trim() : battle.rivalId || battle.rival ? (battle.rivalBrain ? `Rival · ${winConditionLine(battle.rivalBrain.winCondition)}` : 'Rival') : cls?.name ?? '',
      cast: artOf(this, this.trainerArt()?.assetId),
      line,
      evil: !!team && Object.values(team.ranks).some((r) => r.name === trainer.name),
      team: battle.enemyTeam.length,
      lead: lead ? monFile(this, lead.speciesId, 'front', !!lead.shiny) : null,
      player: artOf(this, content.archetypes.get(this.run.archetypeId)?.spriteAssetId),
      playerName: v2?.protagonist?.name || content.archetypes.get(this.run.archetypeId)?.name || 'You',
      party: this.run.party.map((m) => monFile(this, m.speciesId, 'front', !!m.shiny)),
      backdrop: this.arenaBgKey ? rxFileOf(this.cache.json.get('manifest') as AssetManifest | undefined, this.arenaBgKey)?.file ?? null : null,
      where: this.header.text.split('\n')[0]!.replace(/\s+·\s+₽.*$/, '').split(/\s+·\s+/).slice(0, 2).join(' · '),
      // Kice's rule: a loss to a rival never ends the run.
      stake: battle.rivalId || battle.rival ? 'Win and the rivalry grows. Lose and the run goes on: a loss to a rival never ends it.' : '',
    };
    let over = false;
    let finish!: () => void;
    const done = new Promise<void>((r) => (finish = r));
    const end = (): void => {
      if (over) return;
      over = true;
      view.destroy();
      finish();
    };
    const view = mountRedux(this, { render: (c) => versusView(c, model), acts: { next: end }, card: true });
    // The Phantom card has more on it to read (the line, the stake), so it stays a little longer.
    this.time.delayedCall(plain ? 1500 : this.motion === 'off' ? 1500 : phantomOn() ? 3400 : 2600, end);
    return { done, skip: end };
  }

  /** The opening wipe or VS screen (EBDX transitions); any key skips it. */
  private async playIntro(): Promise<void> {
    const battle = this.run.battle!;
    const art = this.trainerArt();
    const darkArena = ['ghost', 'dark', 'rock', 'poison'].includes(this.arenaTypes[0] ?? '');
    const kind: IntroKind = !battle.trainer ? (darkArena ? 'wild-dark' : 'wild') : this.boss() ? 'boss' : battle.rivalId || battle.rival ? 'rival' : 'trainer';
    // A boss with its own VS card (Pokémon Memories) gets that VS screen when its art has loaded.
    const vs = kind === 'boss' && art ? vsCardFor(art.assetId) : null;
    const st = services().session.settings;
    const foeName = this.boss()?.title ?? this.trainerTitle() ?? (battle.trainer ? 'The trainer' : this.speciesName(battle.enemyTeam[0]!));
    const recap = introRecap(kind, foeName);
    // New UI: every Trainer fight opens on the mock-ups' versus card (it stands in for the wipe and the VS screen).
    // Kept for the moments after the battle (a win clears the battle from the run before its last scenes play).
    this.rxCast = this.rx && art ? artOf(this, art.assetId) : null;
    const rxBoss = this.rx && battle.trainer ? this.boss() : null;
    if (rxBoss && !st.skippedIntros.includes(rxBoss.title)) {
      // New UI: a boss enters on the mock-ups' cutscene card (Gym Leader, Elite Four or Champion intro), then the
      // versus card. It stands in for the canvas entrance and title cards; skipping it once is remembered for this boss.
      const intro = bossIntroMoment({ role: rxBoss.role === 'elite' ? 'e4' : rxBoss.role });
      const plate = rxBoss.role === 'champion' ? 'Champion' : rxBoss.role === 'elite' ? 'Elite Four' : 'Gym Leader';
      const types = rxBoss.types.map((t) => t[0]!.toUpperCase() + t.slice(1)).join(' / ');
      await this.bigMoment(intro, `${intro}.${rxBoss.title}`, plate, rxBoss.title, false, { name: battle.rivalId ? battle.trainer!.name : rxBoss.name, role: plate, line: this.openingLine() || (types ? `${types} specialist.` : '') }, () => {
        const s = services().session.settings;
        if (!s.skippedIntros.includes(rxBoss.title)) services().session.saveSettings({ ...s, skippedIntros: [...s.skippedIntros, rxBoss.title] });
      });
    }
    // Phantom UI: a fight inside an event says first that it is a side stage (it stands in for the wild card).
    const sideCard = await this.phSideCard();
    const card = this.rx && battle.trainer ? this.rxVersus(kind === 'trainer') : null;
    if (card) await this.playBeat(card, recap);
    if (kind === 'trainer' || kind === 'wild' || kind === 'wild-dark') {
      // Phantom UI: a wild Pokémon steps out on its own card.
      if (!battle.trainer && !sideCard) await this.phWildCard();
      await this.playContextMoment();
      return;
    }
    if (card) { /* the card was the opening */ } else if (vs && vsScreenReady(this, vs)) await this.playBeat(vsScreen(this, vs, this.motion, capFlash(st.effectIntensity, st.reducedFlash)), recap);
    else await this.playBeat(introTransition(this, kind, this.motion, art ? (x, y) => trainerVisual(this, art.assetId, art.label, x, y, 2.5) : undefined), recap);
    // Bosses and rivals get a title card: who they are and what they specialise in.
    const boss = this.boss();
    const title = this.trainerTitle();
    if (rxBoss) {
      // New UI: the cutscene card and the versus card already named the boss.
      await this.playContextMoment();
      await this.stadiumIntro();
      return;
    }
    const cinematic = !!boss && !!battle.trainer && this.motion !== 'off' && !services().session.settings.skippedIntros.includes(boss.title);
    if (boss && battle.trainer && !services().session.settings.skippedIntros.includes(boss.title)) {
      // A genuine boss entrance; skipping it once remembers the choice for this boss.
      const aceId = (battle.aceUid ? battle.enemyTeam.find((m) => m.uid === battle.aceUid) : battle.enemyTeam[battle.enemyTeam.length - 1])?.speciesId;
      await bossCinematic(
        this,
        { name: boss.title, subtitle: boss.types.length ? `${boss.types.map((t) => t[0]!.toUpperCase() + t.slice(1)).join(' / ')} specialist` : '', ace: aceId ? getSpecies(services().session.content, aceId).name : '', at: { x: ENEMY_POS.x, y: ENEMY_POS.y }, motion: this.motion, figure: art ? (x, y) => trainerVisual(this, art.assetId, art.label, x, y, 2.5) : undefined },
        () => {
          const s = services().session.settings;
          if (!s.skippedIntros.includes(boss.title)) services().session.saveSettings({ ...s, skippedIntros: [...s.skippedIntros, boss.title] });
        },
      );
    }
    // M7: the Champion gets the big presentation (long tier S card) before the usual title card.
    if (boss && battle.trainer && boss.role === 'champion') await this.bigMoment(bossIntroMoment({ role: 'champion' }), `championIntro.${boss.title}`, 'THE CHAMPION', boss.title);
    // The entrance already named the boss; the title card is for when it was skipped.
    if (boss && !cinematic) {
      const types = boss.types.map((t) => t[0]!.toUpperCase() + t.slice(1)).join(' / ');
      await this.playBeat(titleCard(this, boss.title, types ? `${types} specialist` : '', ROLE_RIMS[boss.role], this.motion));
    } else if (title && this.rx && battle.trainer && (isUltimateBattle(this.run) || battle.rivalId || battle.rival)) {
      // New UI: a rival's entrance is the cutscene card. The Ultimate Rival gets the long one; a first meeting gets
      // the "Rival" card here, and a later meeting gets its rematch / revenge / reunion card just below.
      const rid = battle.rivalId ?? 'rival';
      if (isUltimateBattle(this.run)) await this.bigMoment('rivalRevenge', `ultimate.${rid}`, 'Final Rival Battle', title, true, { name: battle.trainer.name, role: 'Final Rival Battle', line: this.openingLine() });
      else if (!battle.rivalId || this.rivalMomentKind(battle.rivalId) === 'rivalFirst') await this.bigMoment('rivalFirst', `rivalFirst.${rid}`, 'Rival', title, false, { name: battle.trainer.name, role: 'Rival', line: this.openingLine() });
    } else if (title && isUltimateBattle(this.run)) {
      await this.playBeat(titleCard(this, `${ULTIMATE_EMBLEM} ULTIMATE RIVAL ${ULTIMATE_EMBLEM}`, title, ROLE_RIMS.ultimate, this.motion));
    } else if (title && (battle.rivalId || battle.rival)) {
      // The rival's own entrance (6.5) comes before the usual title card.
      await this.playBeat(rivalIntro(this, resolveAnim('rival.intro', animSettingsFrom(services().session.settings)), `${title.toUpperCase()} CHALLENGES YOU`, art ? (x, y) => trainerVisual(this, art.assetId, art.label, x, y, 2.5) : undefined, ROLE_RIMS.rival));
      await this.playBeat(titleCard(this, 'RIVAL', title, ROLE_RIMS.rival, this.motion));
    }
    await this.playContextMoment();
    await this.stadiumIntro();
  }

  /** Beta 0.5 M7: a big-moment card through the cinematic framework. Presentation only; any failure is ignored. */
  private async bigMoment(kind: MomentKind, id: string, title: string, subtitle: string, longer = false, cut: Partial<CutModel> = {}, onSkip?: () => void): Promise<void> {
    try {
      const st = services().session.settings;
      const spec = defaultMoment(kind, id, 'enemy');
      if (longer) spec.phases = { situation: 400, anticipation: 700, moment: 900, reaction: 500, transition: 400 };
      const plan = planMoment(spec, { reduceMotion: this.motion === 'reduced', disableAnimations: this.motion === 'off' || st.disableAllAnimations, seen: SEEN_MOMENTS });
      // New UI: the moment is the mock-ups' cutscene card (who, their plate, what is said, the five-beat strip).
      if (this.rx) await playCutMoment(this, plan, this.rxCut(kind, title, subtitle, cut), { onSkip });
      else await playMoment(this, spec, plan, { title, subtitle, onSkip });
      SEEN_MOMENTS.add(id);
    } catch {
      // never block the battle
    }
  }

  /** The foe Trainer's opening line (the same one the battle text and the versus card use), or '' when there is none. */
  private openingLine(): string {
    try {
      const { content, settings } = services().session;
      return battleOpening(content, this.run, settings.dialogueFrequency).drama[0]?.text ?? '';
    } catch {
      return '';
    }
  }

  /**
   * New UI: what a moment's cutscene card shows. By default the card names the moment's subject (`subtitle`) under
   * the moment's own words (`title`) as the plate, with the foe Trainer's picture; `cut` overrides any part.
   */
  private rxCut(kind: MomentKind, title: string, subtitle: string, cut: Partial<CutModel>): Omit<CutModel, 'beat' | 'skip'> {
    const { content } = services().session;
    const battle = this.run.battle;
    const words = title.toLowerCase().replace(/(^|[\s-])\S/g, (c) => c.toUpperCase());
    const foe = this.shown.enemy ?? battle?.enemyTeam[0];
    const showsMon = kind === 'aceEntrance' || kind === 'raidIntro' || kind === 'raidDefeat';
    const intro = kind === 'gymIntro' || kind === 'e4Intro' || kind === 'championIntro' || kind === 'evilTeam' || kind === 'rivalFirst' || kind === 'rivalRematch' || kind === 'rivalRevenge' || kind === 'rivalReunion';
    return {
      name: subtitle,
      role: words,
      line: '',
      cast: battle?.trainer ? artOf(this, this.trainerArt()?.assetId) : this.rxCast,
      mon: showsMon && foe ? ((f) => (f ? { file: f, atlas: true } : null))(monFile(this, foe.speciesId, 'front', !!foe.shiny)) : null,
      player: artOf(this, content.archetypes.get(this.run.archetypeId)?.spriteAssetId),
      backdrop: this.arenaBgKey ? rxFileOf(this.cache.json.get('manifest') as AssetManifest | undefined, this.arenaBgKey)?.file ?? null : null,
      evil: kind === 'evilTeam' || kind === 'evilBetrayal',
      kind,
      tag: title,
      where: this.header.text.split('\n')[0]!.replace(/\s+·\s+₽.*$/, '').split(/\s+·\s+/).slice(0, 2).join(' · '),
      // A Trainer's entrance says what they bring (the Phantom card's panel); only what is true of this fight.
      brings: intro && battle?.trainer ? { team: battle.enemyTeam.length, notes: [...(battle.enemyTeam.some((m) => Object.keys(m.held ?? {}).length > 0) ? ['Their Pokémon hold items.'] : []), ...(this.boss() ? ['The ace is announced when it enters.'] : [])] } : null,
      ...cut,
    };
  }

  /** True when the trainer just beaten is the Evil Team's leader (the Betrayal scene follows). */
  private evilLeaderBeaten(name: string | undefined): boolean {
    const team = evilTeam(services().session.content, this.run);
    return Boolean(team && name && team.ranks.leader.name === name);
  }

  /** New UI: the player's own picture for a cutscene card: the back view when the Trainer has one (as the mock-ups draw it), else the usual picture. */
  private rxMe(): Art | null {
    const id = this.playerArt();
    return id ? artOf(this, bossBackId(id)) ?? artOf(this, id) : null;
  }

  /** Which rival scene fits this meeting, from the wins and losses against them so far this run. */
  private rivalMomentKind(rid: string): ReturnType<typeof rivalMoment> {
    const w = Number(this.run.story.flags[`rivalW:${rid}`] ?? 0);
    const l = Number(this.run.story.flags[`rivalL:${rid}`] ?? 0);
    return rivalMoment({ fights: w + l, lastResult: w + l === 0 ? undefined : l > 0 && w === 0 ? 'playerLost' : 'playerWon', playerStreak: l > 0 ? 0 : w });
  }

  /** Raid, evil-team and returning-rival scenes picked from the battle and the encounter history. */
  private async playContextMoment(): Promise<void> {
    const battle = this.run.battle!;
    const { content } = services().session;
    if (battle.raid) {
      // A Colossus raid (`ss-<team>-<apex>`) is an Apex: the team's leader stands with it on the card, as on the mock-up's Apex record.
      const apexTeam = battle.raid.id.startsWith('ss-') ? content.evilTeams.teams.find((t) => t.id === battle.raid!.id.split('-')[1]) : undefined;
      const apexDef = apexTeam ? content.raids.raids.find((r) => r.id === battle.raid!.id) : undefined;
      if (apexTeam && apexDef) {
        const leader = artOf(this, apexTeam.ranks.leader.sprite);
        await this.bigMoment(bossIntroMoment({ role: 'raid' }), `raid.${battle.enemyTeam[0]?.speciesId ?? 'boss'}`, 'APEX', apexDef.name, false, { cast: leader ?? this.rxMe(), role: `Apex · ${apexTeam.name}`, line: shortestSentence(apexDef.blurb), evil: true });
        return;
      }
      await this.bigMoment(bossIntroMoment({ role: 'raid' }), `raid.${battle.enemyTeam[0]?.speciesId ?? 'boss'}`, 'RAID BOSS', this.speciesName(battle.enemyTeam[0]!), false, { cast: this.rxMe(), role: 'Raid Boss', line: 'The den glows red.' });
      return;
    }
    if (battle.totem) {
      // New UI: a Totem Pokémon is revealed on the cutscene card (the mock-up's Totem boss card), with its aura as the line.
      if (this.rx) {
        const tdef = content.totems.totems.find((x) => x.id === battle.totem!.id);
        const calls = tdef?.ally ? ' It calls for help.' : '';
        await this.bigMoment(bossIntroMoment({ role: 'raid' }), `totem.${battle.totem.id}`, 'TOTEM POKÉMON', tdef?.name ?? `Totem ${this.speciesName(battle.enemyTeam[0]!)}`, false, { cast: this.rxMe(), role: 'Totem Pokémon', line: `${(tdef?.aura?.text ?? 'Its aura flares.').split(/(?<=\.)\s/)[0]}${calls}` });
      }
      return;
    }
    if (!battle.trainer) {
      // New UI: a wild Legendary or Mythical Pokémon is revealed on the cutscene card.
      const foe = battle.enemyTeam[0];
      const tags = foe ? content.species.get(foe.speciesId)?.tags ?? [] : [];
      const rank = tags.includes('mythical') ? 'Mythical' : tags.includes('legendary') ? 'Legendary' : null;
      if (this.rx && foe && rank) {
        const legend = this.run.expedition && battle.expedition ? content.expeditions.expeditions.find((e) => e.id === this.run.expedition!.id)?.legendary : undefined;
        const epithet = legend && legend.species === foe.speciesId ? legend.epithet : '';
        await this.bigMoment('aceEntrance', `legend.${foe.speciesId}`, `${rank} Pokémon`, this.speciesName(foe), true, { cast: this.rxMe(), role: epithet || `${rank} Pokémon`, line: `A ${rank} Pokémon stands before you.` });
      }
      return;
    }
    const rid = battle.rivalId;
    if (rid) {
      const w = Number(this.run.story.flags[`rivalW:${rid}`] ?? 0);
      const l = Number(this.run.story.flags[`rivalL:${rid}`] ?? 0);
      const kind = this.rivalMomentKind(rid);
      // The Ultimate Rival's card already played (New UI); a first meeting has no returning scene.
      if (kind === 'rivalFirst' || (this.rx && isUltimateBattle(this.run))) return;
      const label = kind === 'rivalRevenge' ? 'REVENGE' : kind === 'rivalReunion' ? 'REUNION' : 'REMATCH';
      await this.bigMoment(kind, `${kind}.${rid}.${w}.${l}`, label, this.trainerTitle() ?? battle.trainer.name, false, { name: battle.trainer.name, role: 'Rival', line: this.openingLine() });
      return;
    }
    const team = evilTeam(content, this.run);
    if (team && Object.values(team.ranks).some((r) => r.name === battle.trainer!.name)) await this.bigMoment(bossIntroMoment({ role: 'evil' }), `evil.${team.id}.${battle.trainer.name}`, team.name ?? battle.trainer.name, battle.trainer.name, false, { role: team.name ?? 'Evil Team', line: this.openingLine() });
  }

  /** Galar Gym Challenge: the stadium director for this battle (null in every other battle). */
  private makeStadium(): StadiumDirector | null {
    try {
      const { session } = services();
      const content = session.content;
      if (!isGalarStadiumBattle(content, this.run)) return null;
      const st = session.settings;
      const alive = (team: readonly { hp: number }[]): number => team.filter((m) => m.hp > 0).length;
      return new StadiumDirector(this, {
        runSeed: this.run.seed,
        battleId: `${this.run.seed}:${this.run.badges.length}:${this.run.log.battlesWon}`,
        host: galarHost(content, this.run).name,
        impressive: galarPerformance(content, this.run).lastWasImpressive,
        rivalWatching: this.run.story.rivals.length > 0,
        disableAnimations: () => st.disableAllAnimations || st.battleAnimations === 'off',
        reduceMotion: () => st.battleAnimations === 'reduced',
        setIntensity: (n) => setMusicIntensity(n),
        crowdSound: (cue, intensity) => {
          const v = Math.min(1, 0.3 + intensity * 0.12);
          if (cue === 'crowd.roar') {
            playSfxLazy(this, 'se.crowd_applause', v);
            if (intensity >= 4) playSfxLazy(this, 'se.crowd_uproar', v * 0.8);
          } else if (cue === 'crowd.swell') playSfxLazy(this, 'se.crowd_applause', 0.5);
          else if (cue === 'crowd.murmur') playSfxLazy(this, 'se.crowd_murmur', 0.3);
        },
        finalMusic: (track) => {
          if (!services().assets.has(track)) return;
          this.baseTrack = track;
          this.playingTrack = track;
          playMusicLazy(this, track, track);
        },
        alive: () => ({ player: alive(this.run.party), foe: alive(this.run.battle?.enemyTeam ?? []) }),
        say: (text) => this.say(text),
        announce: (text) => this.speakWithArt('Reporter', INTERVIEWERS_SPRITE, text, 'crowd'),
        opponentSays: (name, assetId, text) => this.speakWithArt(name, assetId, text, 'crowd'),
        tag: (text) => { this.rxAirTag = text; },
        portrait: (id, x, y) => {
          // Fit the picture to the card so no character is cropped, whatever size its sprite is.
          const v = trainerVisual(this, id, 'Trainer', x, y, 2) as unknown as { height: number; setScale: (n: number) => unknown };
          if (v.height > 0) v.setScale(Math.min(340 / v.height, 6));
          return v as unknown as Phaser.GameObjects.GameObject;
        },
        hype: ((): StadiumHooks['hype'] => {
          const scope = galarScope(content, this.run);
          if (!scope) return undefined;
          return {
            scope,
            favor: () => crowdFavor(content, this.run),
            facts: () => this.hypeFacts(),
            flags: () => this.hypeFlags(),
            available: () => this.hypeSpeakers(),
            cast: (speaker, seed) => this.hypeCast(speaker, seed),
            say: (name, assetId, text, look) => this.speakWithArt(name, assetId, text, look),
            foeShare: () => {
              const f = this.shown?.enemy ?? this.run.battle?.enemyTeam[this.run.battle.enemyIndex];
              return f ? f.hp / Math.max(1, maxHp(content, f)) : 1;
            },
          };
        })(),
        art: {
          sprite: (id, x, y, scale) => (this.textures.exists(id) ? trainerVisual(this, id, 'Trainer', x, y, scale) : null),
          preload: (ids) => loadAssets(this, ids),
          cast: () => {
            const host = content.bosses.get(galarHost(content, this.run).id)?.sprites.default ?? '';
            const rival = this.run.story.rivals[0];
            return { host, opponent: this.trainerArt()?.assetId ?? '', rival: (rival && this.rivalArt(rival)?.assetId) || '' };
          },
        },
        bandArt: (x, y) => itemVisual(this, services().session.content.items.get('dynamax-band')?.iconAssetId ?? 'item.dynamax_band', x, y, 3),
      });
    } catch (e) {
      console.warn('Galar stadium presentation unavailable', e);
      return null;
    }
  }

  /** Galar gym entrance: the Champion's one-time Dynamax Band scene (first gym), then a line for this gym. Presentation; the Band itself is granted by the core. */
  private async stadiumIntro(): Promise<void> {
    if (!this.stadium) return;
    try {
      const { session } = services();
      const content = session.content;
      const host = galarHost(content, this.run).name;
      // League battles of the Champion Tournament: round card, the opponent's introduction and a crowd line; the final is a bigger moment.
      const round = currentTournamentRound(content, this.run);
      if (round) {
        await this.stadium.tournamentIntro(round);
        return;
      }
      if (this.boss()?.role !== 'gym') return; // Story-run League fights get the crowd and cuts, not the gym host
      const band = session.claimGalarBandIntro();
      // The news reporter opens the match (trainer text with the reporter's own sprite), then the Champion host speaks.
      const leader = this.run.battle?.trainer?.name ?? 'the Gym Leader';
      const who = content.archetypes.get(this.run.archetypeId)?.name ?? 'the challenger';
      await this.speakWithArt('Reporter', INTERVIEWERS_SPRITE, `Welcome, everyone, to gym match number ${galarGymNumber(this.run)} of the Gym Challenge! ${who} steps onto the field to face ${leader}!`);
      await this.stadium.interview('pre');
      if (band) {
        if (band.grantsItem) await this.stadium.bandScene();
        for (const line of band.lines) await this.speak(host, line);
      }
      else {
        const line = hostLine(this.run.seed, galarGymNumber(this.run), galarPerformance(content, this.run), host);
        await this.speak(host, line.text);
      }
    } catch (e) {
      console.warn('Galar stadium intro failed', e);
    }
  }

  /** The foe's rim: neon pink for wild Pokémon, orange for trainers, red for rivals, gold / violet / pale gold for bosses. */
  private foeRim(): number {
    const battle = this.run.battle;
    const boss = this.boss();
    if (boss) return ROLE_RIMS[boss.role];
    if (!battle?.trainer) return ROLE_RIMS.wild;
    return isUltimateBattle(this.run) ? ROLE_RIMS.ultimate : battle.rivalId || battle.rival ? ROLE_RIMS.rival : ROLE_RIMS.trainer;
  }

  /** S254: the foe trainer's portrait reacts to an event. Presentation only; any failure is ignored. */
  private reactPortrait(e: RunEvent): void {
    try {
      const st = services().session.settings;
      const art = this.trainerArt();
      if (!st.trainerExpressions || !art || st.disableAllAnimations) return;
      this.portrait ??= portraitChip(this, art.assetId, art.label, this.motion);
      const foe = this.shown.enemy;
      const share = e.type === 'damage' && e.side === 'enemy' && foe ? e.hpAfter / Math.max(1, maxHp(services().session.content, foe)) : undefined;
      const expr = expressionFor({ type: e.type, side: 'side' in e ? e.side : undefined, crit: e.type === 'damage' ? e.crit : undefined, effectiveness: e.type === 'damage' ? e.effectiveness : undefined }, share);
      if (expr) this.portrait.set(expr);
    } catch {
      // A portrait failure never matters to the fight.
    }
  }

  /** Waits for a presentation beat; confirm/back skips it. */
  /** Steps the whole HUD aside (New look layer; Old look boxes incl. doubles, text bar, header) and returns what puts it back. */
  private hudAside(): () => void {
    type V = Phaser.GameObjects.Components.Visible & Phaser.GameObjects.GameObject;
    const duoBoxes = this.duo ? [...this.duo.slots.player, ...this.duo.slots.enemy].map((o) => o?.box.container) : [];
    const parts = ([this.playerBox?.container, this.enemyBox?.container, ...duoBoxes, this.message, this.storyBar?.container, this.header] as (V | undefined)[]).filter((o): o is V => !!o);
    const was = parts.map((o) => o.visible);
    parts.forEach((o) => o.setVisible(false));
    this.rx?.visible(false);
    return () => {
      parts.forEach((o, i) => { if (o.active && was[i]) o.setVisible(true); });
      this.rx?.visible(true);
    };
  }

  /** A Mega / Tera / Dynamax / Z cutscene takes the whole screen: the HUD steps aside, then returns. */
  /**
   * Phantom UI: one full-screen card over the battle. It ends on a click or a key, or after `ms` (null: it waits for an
   * input, unless Settings > Auto-advance is on). Presentation only: a card that fails to draw is skipped.
   */
  private async phMoment(draw: (ph: PhantomVersion) => string, ms: number | null, more?: { acts: Record<string, () => void>; held: () => boolean }): Promise<void> {
    if (!this.rx || !phantomOn()) return;
    try {
      const st = services().session.settings;
      const wait = ms ?? (st.autoAdvance ? 2600 + MESSAGE_DELAYS[st.messageDelay] : null);
      let over = false;
      let finish!: () => void;
      const done = new Promise<void>((r) => (finish = r));
      const end = (force = false): void => {
        // A page that is open over the card (the Pokédex) keeps it up: it then waits for an input.
        if (over || (!force && more?.held())) return;
        over = true;
        if (this.phMomentView === view) this.phMomentView = null;
        try {
          view.destroy();
        } catch {
          // the scene may already be gone
        }
        finish();
      };
      const view = mountRedux(this, { render: (c) => (c.ph ? draw(c.ph) : ''), acts: { ...more?.acts, next: () => end() }, card: true });
      this.phMomentView = view;
      if (wait !== null) this.time.delayedCall(wait, () => end());
      this.events.once('shutdown', () => end(true));
      await this.playBeat({ done, skip: () => end() });
    } catch (e) {
      console.warn('Phantom card failed', e);
    }
  }

  /**
   * Phantom UI: a region's Champion fell and another region waits. The mock-ups' Next region page: the ticket the run
   * holds (a run's regions are fixed when it starts), the road so far and what changes there. Waits for an input.
   */
  private async phTravelCard(run: RunState, cleared: string): Promise<boolean> {
    if (!this.phCards()) return false;
    const { content } = services().session;
    const at = run.regionOrder.indexOf(cleared), id = at < 0 ? undefined : run.regionOrder[at + 1];
    const region = id ? content.regions.get(id) : undefined;
    if (!id || !region) return false;
    const cap = (i: number): number => runLevelCap(content, { regionIndex: i, rules: run.rules });
    const slots = gimmickSlots(at + 1, null, content.balance.transformations.bossGimmickAfterStage);
    await this.phMoment((ph) => phTravel(ph, {
      region: region.name,
      no: at + 2,
      road: run.regionOrder.map((r, i) => ({ name: content.regions.get(r)?.name ?? r, done: i <= at, next: i === at + 1 })),
      tagline: region.tagline ?? '',
      forms: [...content.species.values()].filter((sp) => sp.form?.kind === 'regional' && sp.form.region === id).length,
      facts: [['Level cap', cap(at) === cap(at + 1) ? `${cap(at + 1)}` : `${cap(at)} → ${cap(at + 1)}`], ['Boss gimmicks', slots > 0 ? `up to ${slots}` : 'none'], ['Stages', `${runCampaign(content, run).stagesPerRegion}`], ['Your team', 'comes with you']],
      backdrop: this.phBackdrop(),
    }), null);
    return true;
  }

  /** Phantom UI: a fight inside an event opens on the side-stage card (mock-up `side`). Returns whether it showed. */
  private async phSideCard(): Promise<boolean> {
    const battle = this.run.battle;
    const foe = battle?.enemyTeam[0];
    if (!battle || !foe || !battle.event || !this.phCards()) return false;
    const { content } = services().session;
    try {
      if (!isPseudoBattle(content, battle.event)) return false;
    } catch {
      return false;
    }
    const stage = this.run.stage;
    const sp = getSpecies(content, foe.speciesId);
    const cast = battle.trainer ? this.rxCast : null;
    const balls = Object.keys(this.run.inventory).some((id) => (this.run.inventory[id] ?? 0) > 0 && content.items.get(id)?.category === 'ball');
    let cant = '';
    try {
      const ball = Object.keys(this.run.inventory).find((id) => (this.run.inventory[id] ?? 0) > 0 && content.items.get(id)?.category === 'ball');
      cant = ball ? itemProblem(this.battleCtx(), ball) ?? '' : '';
    } catch {
      cant = '';
    }
    const name = content.events.get(battle.event.eventId)?.name ?? stage?.pseudo?.name ?? (battle.event.eventId.startsWith('rescue:') ? 'The rescue' : 'This event');
    await this.phMoment((ph) => phSide(ph, {
      event: name,
      backdrop: this.phBackdrop(),
      mon: cast ?? this.phArt(foe),
      person: !!cast,
      foe: battle.trainer
        ? { name: this.trainerTitle() ?? battle.trainer.name, level: null, types: [], tag: `${battle.enemyTeam.length} Pokémon` }
        : { name: this.speciesName(foe), level: foe.level, types: sp.types, tag: balls && !cant ? 'Catchable' : '' },
      stage: stage ? { no: stage.index + 1, of: Math.max(stage.index + 1, runCampaign(content, this.run).stagesPerRegion) } : null,
    }), null);
    return true;
  }

  /** Phantom UI: a fight changes gear (mock-up `phase`): a boss's last stand, a raid's or a Totem's next phase. Returns whether it showed. */
  private async phPhaseCard(line: string, go: string | null = null, fixed: { word: string; meter: { at: number; of: number } } | null = null): Promise<boolean> {
    const battle = this.run.battle;
    if (!battle || !this.phCards()) return false;
    const { content } = services().session;
    const foe = currentEnemy(battle);
    const rdef = battle.raid ? content.raids.raids.find((r) => r.id === battle.raid!.id) : undefined;
    const tdef = battle.totem ? content.totems.totems.find((x) => x.id === battle.totem!.id) : undefined;
    const meter = fixed ? fixed.meter : battle.raid && rdef && rdef.phases.length > 0 ? { at: Math.max(1, battle.raid.phasesDone.length), of: rdef.phases.length }
      : battle.totem && tdef && tdef.phases.length > 0 ? { at: Math.max(1, battle.totem.phasesDone.length), of: tdef.phases.length } : null;
    const alive = battle.enemyTeam.filter((m) => m.hp > 0).length;
    const t = battle.transform;
    const left = t.enemyMechanics.filter((k) => !t.used.enemy.includes(k)).length;
    const who = battle.trainer ? this.trainerTitle() ?? battle.trainer.name : this.speciesName(foe);
    await this.phMoment((ph) => phPhase(ph, {
      lab: [who, battle.raid ? 'Raid' : battle.totem ? 'Totem' : this.phWhere().split(' · ')[0]].filter(Boolean).join(' · '),
      word: fixed ? fixed.word : battle.trainer && alive <= 1 ? 'LAST STAND' : meter ? `PHASE ${meter.at}` : 'IT CHANGES',
      line,
      face: battle.trainer ? this.rxCast : null,
      mon: this.phArt(foe)?.file ?? null,
      meter,
      left: battle.trainer ? { alive, total: battle.enemyTeam.length } : null,
      chips: battle.trainer && t.enemyMechanics.length > 0 ? [left > 0 ? `${left} gimmick${left === 1 ? '' : 's'} not used yet` : 'No gimmick left'] : [],
      go,
    }), go ? null : 2600);
    return true;
  }

  /** Phantom UI: the four gimmicks of the Pokémon choosing, which are ready, and why the others are not. */
  private phGimmickSlots(): GimmickSlot[] {
    const { content } = services().session;
    const ctx = this.battleCtx();
    const mon = this.activeMon();
    const why = (kind: TransformRequest['kind'], at = -1): string => {
      try {
        return transformProblem(ctx, { kind }, at) ?? '';
      } catch {
        return 'Not available now.';
      }
    };
    const mega = megaOption(ctx);
    const megaWhy = (): string => {
      if (ctx.battle.transform.used.player.includes('mega')) return 'You have already Mega Evolved this battle.';
      if (!hasKeyItem(content, this.run.inventory, 'mega') && !mon.skyMega) return 'You need a Mega Ring to Mega Evolve.';
      if (stoneForms(content, mon.speciesId, false).length === 0) return `${this.speciesName(mon)} has no Mega form.`;
      if (!permanentForm(content, this.run.inventory, mon)) return `You need ${this.speciesName(mon)}'s Mega Stone.`;
      return why('mega');
    };
    const tera = teraOption(ctx);
    const zs = zMoveOptions(ctx).filter((z) => z !== null).length;
    const zWhy = (): string => {
      const general = why('zmove');
      if (general !== 'Choose a move for the Z-Move.') return general;
      return mon.moves.map((_, i) => why('zmove', i)).find((x) => x && !/has no PP/.test(x)) ?? 'No move can become a Z-Move now.';
    };
    const dmax = canDynamax(ctx);
    const on = this.transformChoice?.kind;
    const up = (t: string): string => t[0]!.toUpperCase() + t.slice(1);
    return [
      { kind: 'mega', ready: !!mega, armed: on === 'mega', foot: mega ? `READY · ${mega.itemId ? content.items.get(mega.itemId)?.name ?? 'Mega Stone' : 'its own resolve'}` : megaWhy() },
      { kind: 'tera', ready: !!tera, armed: on === 'tera', foot: tera ? `READY · Tera type: ${up(tera)}` : why('tera'), row: TERA_ICON_ROW[tera ?? 'normal'] ?? 0 },
      { kind: 'dynamax', ready: dmax, armed: on === 'dynamax', foot: dmax ? `READY · ${content.balance.transformations.dynamaxTurns} turns` : why('dynamax') },
      { kind: 'zmove', ready: zs > 0, armed: on === 'zmove', foot: zs > 0 ? `READY · ${zs} move${zs === 1 ? '' : 's'} can become a Z-Move` : zWhy() },
    ];
  }

  /** Phantom UI: the gimmick picker (mock-up `gimmick`), opened from the move menu with G. Picking one arms it for this turn's move. */
  private phOpenGimmicks(): void {
    if (this.phGimView) {
      this.phGimInput?.('back');
      return;
    }
    if (!this.rx || !phantomOn() || !this.rxMoves || !this.menu || this.picker || this.infoPanel || this.busy || this.autoRunning || this.advance) return;
    const battle = this.run.battle;
    if (!battle) return;
    let slots: GimmickSlot[];
    try {
      slots = this.phGimmickSlots();
    } catch (e) {
      console.warn('Phantom gimmick page failed', e);
      return;
    }
    let index = Math.max(0, slots.findIndex((g) => g.armed));
    if (!slots[index]?.armed) index = Math.max(0, slots.findIndex((g) => g.ready));
    const t = battle.transform;
    const left = t.enemyMechanics.filter((k) => !t.used.enemy.includes(k)).length;
    const who = battle.trainer ? this.trainerTitle() ?? battle.trainer.name : '';
    const other = !who ? 'A wild Pokémon uses no gimmick of its own.'
      : left > 0 ? `${who} has ${left} gimmick${left === 1 ? '' : 's'} left${t.used.enemy.length ? ` and has used ${t.used.enemy.length}` : ' and has not used one yet'}.`
        : t.used.enemy.length ? `${who} has used every gimmick it had.` : `${who} has no gimmick in this battle.`;
    const name = this.speciesName(this.activeMon());
    const backdrop = this.phBackdrop();
    this.clearMenus();
    const close = (): void => {
      if (!this.phGimView) return;
      this.phGimInput = null;
      try {
        this.phGimView.destroy();
      } catch {
        // the scene may already be gone
      }
      this.phGimView = null;
    };
    const back = (): void => {
      close();
      playSfx(this, 'ui.select');
      this.showMoveMenu();
    };
    const move = (by: number): void => {
      index = (index + by + slots.length) % slots.length;
      playSfx(this, 'ui.cursor');
      view.refresh();
    };
    const use = (): void => {
      const g = slots[index];
      if (!g?.ready) {
        playSfx(this, 'ui.error');
        return;
      }
      this.transformChoice = g.armed ? null : { kind: g.kind };
      back();
    };
    const view = mountRedux(this, {
      render: (c) => (c.ph ? phGimmickPick(c.ph, { name, slots, index, other, backdrop }) : ''),
      acts: { pick: (i) => { if (Number(i) === index) use(); else { index = Number(i); view.refresh(); } }, use, back },
      overs: { over: (i) => { if (Number(i) !== index) { index = Number(i); view.refresh(); } } },
      card: true,
    });
    this.phGimView = view;
    this.phGimInput = (a) => (a === 'left' || a === 'up' ? move(-1) : a === 'right' || a === 'down' ? move(1) : a === 'confirm' ? use() : a === 'back' ? back() : undefined);
    this.events.once('shutdown', close);
  }

  /** Whether the Phantom look plays its short battle cards now (never with motion reduced or off). */
  private phCards(): boolean {
    return !!this.rx && phantomOn() && this.motion === 'full';
  }

  /** The splash cards inside a turn (a hard hit, a knock-out): left out while Auto-Battle plays or the battle speed is Fast or Quick. */
  private phTurnCards(): boolean {
    const st = services().session.settings;
    return this.phCards() && !st.autoBattle && st.battleSpeed !== 'fast' && st.battleSpeed !== 'quick';
  }

  private phArt(mon: PokemonInstance | null | undefined, side: 'front' | 'back' = 'front'): Art | null {
    if (!mon) return null;
    const f = monFile(this, mon.speciesId, side, !!mon.shiny) ?? monFile(this, mon.speciesId, 'front', !!mon.shiny);
    return f ? { file: f, atlas: true } : null;
  }

  private phBackdrop(): string | null {
    return this.arenaBgKey ? rxFileOf(this.cache.json.get('manifest') as AssetManifest | undefined, this.arenaBgKey)?.file ?? null : null;
  }

  /** "Stage 14 · Route 22": the first two parts of the header, without the money. */
  private phWhere(): string {
    return this.header.text.split('\n')[0]!.replace(/\s+·\s+₽.*$/, '').split(/\s+·\s+/).slice(0, 2).join(' · ');
  }

  private phPlayerName(): string {
    const { content } = services().session;
    return this.run.story.v2?.protagonist?.name || content.archetypes.get(this.run.archetypeId)?.name || 'You';
  }

  /** How full a Pokémon's Exp bar is, in percent of its level. */
  private xpPct(m: PokemonInstance): number {
    const { content } = services().session;
    const { maxLevel, highLevelXp } = content.balance.difficulty;
    if (m.level >= maxLevel) return 100;
    const rate = getSpecies(content, m.speciesId).growthRate;
    const lo = xpForLevel(rate, m.level, highLevelXp), hi = xpForLevel(rate, m.level + 1, highLevelXp);
    return Phaser.Math.Clamp(((m.xp - lo) / Math.max(1, hi - lo)) * 100, 0, 100);
  }

  /** Phantom UI: notes Exp or a level a party member earned, for the result page after the battle. */
  private phTallyAdd(uid: string, before: RunState, amount: number, level: number | null): void {
    // One tally per battle: another foe's team starts it again.
    const key = before.battle?.enemyTeam[0]?.uid ?? '';
    if (key !== this.phTallyKey) {
      this.phTally.clear();
      this.phTallyKey = key;
    }
    const was = before.party.find((m) => m.uid === uid);
    const t = this.phTally.get(uid) ?? { gain: 0, from: was ? this.xpPct(was) : 0, fromLevel: was?.level ?? level ?? 0, toLevel: was?.level ?? level ?? 0 };
    this.phTally.set(uid, { ...t, gain: t.gain + amount, toLevel: level ?? t.toLevel });
  }

  /** Phantom UI: a hit that lands hard (the mock-up's `hit` splash): the words, the damage, the bar draining. */
  private async phHitCard(mon: PokemonInstance, hpAfter: number, strong: boolean, crit: boolean): Promise<void> {
    const max = Math.max(1, calcStats(services().session.content, mon).hp);
    const last = this.phLast?.side === 'player' ? this.phLast : null;
    await this.phMoment((ph) => phHit(ph, {
      words: strong ? ['SUPER', 'EFFECTIVE!'] : ['CRITICAL', 'HIT!'],
      victim: this.phArt(mon),
      name: this.speciesName(mon),
      damage: mon.hp - hpAfter,
      from: (mon.hp / max) * 100,
      to: (hpAfter / max) * 100,
      by: last?.by ?? '',
      move: last?.move ?? '',
    }), crit && strong ? 1250 : 1050);
  }

  /** Phantom UI: a foe goes down (the mock-up's `ko` card): who did it, and how many the Trainer has left. */
  private async phKoCard(foe: PokemonInstance, before: RunState, trainer: string | null, faints: number): Promise<void> {
    const team = before.battle?.enemyTeam ?? [];
    const alive = Math.max(0, team.filter((m) => m.hp > 0).length - faints);
    const last = this.phLast?.side === 'player' ? this.phLast : null;
    const name = this.speciesName(foe);
    await this.phMoment((ph) => phKo(ph, {
      by: this.phArt(this.shown.player),
      tag: !last?.move ? `${name} is down.` : this.phHits <= 1 ? `One ${last.move} was all it took.` : `${last.move} finished it.`,
      foe: { name, file: monFile(this, foe.speciesId, 'front', !!foe.shiny) },
      left: trainer && before.battle?.trainer ? { owner: trainer, alive, total: team.length } : null,
    }), 1700);
  }

  /** Phantom UI: the win (the mock-up's `win` card), with what the foe says as they lose. */
  private async phWinCard(trainer: string, before: RunState | undefined): Promise<void> {
    const { content } = services().session;
    const foe = before?.battle?.trainer;
    const rival = !!before?.battle && !!(before.battle.rivalId || before.battle.rival);
    const line = foe && !rival ? content.trainers.get(foe.classId)?.lines?.lose ?? '' : '';
    await this.phMoment((ph) => phWin(ph, {
      words: 'YOU WIN',
      hero: artOf(this, content.archetypes.get(this.run.archetypeId)?.spriteAssetId),
      mon: this.phArt(this.shown.player),
      line,
      by: line ? trainer : '',
      sub: `${trainer} is out of Pokémon`,
    }), 2800);
  }

  /** Phantom UI: the tally after a win (the mock-up's `result` page). True when it was shown: its lines need not be said again. */
  private async phResultCard(result: TurnResult, before: RunState | undefined, boss: boolean): Promise<boolean> {
    const end = result.end;
    if (!end || !this.rx || !phantomOn()) return false;
    const { content } = services().session;
    if ((before?.battle?.enemyTeam[0]?.uid ?? '') !== this.phTallyKey) this.phTally.clear();
    const rows: ResultRow[] = result.run.party.slice(0, 6).map((m) => {
      const t = this.phTally.get(m.uid);
      // The row shows the Pokémon as it fought (an evolution it earned plays on the next screen).
      return { file: monFile(this, m.speciesId, 'front', !!m.shiny), name: this.speciesName(m), from: t ? t.from : this.xpPct(m), to: this.xpPct(m), gain: t && t.gain > 0 ? t.gain : null, level: t && t.toLevel > t.fromLevel ? [t.fromLevel, t.toLevel] : null, fainted: m.hp <= 0 };
    });
    const turns = before?.battle?.turn ?? 1;
    const down = result.run.party.filter((m) => m.hp <= 0).length;
    const gains: [string, string][] = [];
    if (end.moneyGained > 0) gains.push([`+₽${end.moneyGained.toLocaleString('en-US')}`, 'prize money']);
    gains.push([`${turns} TURN${turns === 1 ? '' : 'S'}`, down ? `${down} fainted` : 'no one fainted']);
    if (end.itemsFound.length) gains.push([`${end.itemsFound.length} ITEM${end.itemsFound.length === 1 ? '' : 'S'}`, end.itemsFound.map((id) => content.items.get(id)?.name ?? id).join(', ')]);
    if (result.run.phase === 'reward') gains.push(['REWARD PICK', 'coming up next']);
    else if (end.outcome === 'caught') gains.push(['CAUGHT', 'it joins you next']);
    const kind = !before?.battle?.trainer ? 'Wild battle' : this.role === 'rival' ? 'Rival battle' : boss ? 'Boss battle' : 'Trainer battle';
    let shown = false;
    await this.phMoment((ph) => {
      shown = true;
      return phResult(ph, { where: `${this.phWhere().split(' · ')[0]} · ${kind}`, rows, gains });
    }, null);
    return shown;
  }

  /** Phantom UI: lost to a rival (the mock-up's `rloss` page). Kice's rule: a loss to a rival never ends the run. */
  private async phRivalLossCard(before: RunState, after: RunState): Promise<boolean> {
    const battle = before.battle;
    if (!battle?.trainer || !(battle.rivalId || battle.rival) || !this.rx || !phantomOn()) return false;
    const { content } = services().session;
    const name = battle.trainer.name;
    const win = content.trainers.get(battle.trainer.classId)?.lines?.win ?? '';
    let shown = false;
    await this.phMoment((ph) => {
      shown = true;
      return phRivalLoss(ph, {
        name,
        cast: this.rxCast ?? artOf(this, this.lastFoe?.art.assetId),
        where: `${this.phWhere().split(' · ')[0]} · Rival battle lost`,
        line: win,
        text: `Losing to a rival never ends a run. Your team is patched up, the story goes on, and ${name} will be waiting again further down the road.`,
        party: after.party.map((m) => monFile(this, m.speciesId, 'front', !!m.shiny)),
      });
    }, null);
    return shown;
  }

  /** Phantom UI: a wild Pokémon steps out (the mock-up's `wild` card). Raids, Totems and Legendaries have their own cards. */
  private async phWildCard(): Promise<void> {
    const battle = this.run.battle;
    const foe = battle?.enemyTeam[0];
    if (!battle || !foe || battle.trainer || battle.raid || battle.totem || !this.phCards()) return;
    const { content, profile } = services().session;
    const sp = getSpecies(content, foe.speciesId);
    if (sp.tags?.includes('legendary') || sp.tags?.includes('mythical')) return;
    const ballIds = Object.keys(this.run.inventory).filter((id) => (this.run.inventory[id] ?? 0) > 0 && content.items.get(id)?.category === 'ball');
    // The same check the Bag makes: the first ball's problem, if any, is why none can be thrown.
    let cant = '';
    try {
      cant = ballIds.length ? itemProblem(this.battleCtx(), ballIds[0]!) ?? '' : '';
    } catch {
      cant = '';
    }
    const others = battle.doubles ? battle.enemyTeam.slice(1, battle.doubles.trio ? 3 : 2).map((m) => this.speciesName(m)) : [];
    const isNew = !profile.speciesCaught.includes(foe.speciesId);
    // The mock-up's Pokédex key: the species' page opens over the card (it only reads), and the card waits under it.
    const openDex = (): void => {
      if (this.phWildDex) return;
      playSfx(this, 'ui.select', 0.5);
      this.phWildDex = new DexInfo(this, content, liveDexProfile(profile, this.run.log), foe.speciesId, () => (this.phWildDex = null), true);
    };
    this.phWildKey = openDex;
    await this.phMoment((ph) => phWild(ph, {
      name: this.speciesName(foe),
      mon: this.phArt(foe),
      level: foe.level,
      types: sp.types,
      where: this.phWhere(),
      lead: battle.nemesis ? 'Your nemesis,' : battle.monRival ? 'Your rival' : 'A wild',
      tail: others.length ? `and ${others.join(' and ')} appeared!` : 'appeared!',
      tag: battle.nemesis ? 'Nemesis' : 'Wild',
      note: foe.shiny ? 'Shiny' : isNew ? 'New · not in your Pokédex' : '',
      catchable: !cant,
      cant,
      balls: ballIds.map((id) => ({ name: content.items.get(id)!.name, n: this.run.inventory[id] ?? 0 })).sort((a, b) => b.n - a.n),
      backdrop: this.phBackdrop(),
      grass: ['grass', 'bug'].includes(this.arenaTypes[0] ?? ''),
    }), 3000, { acts: { dex: openDex }, held: () => this.phWildDex !== null });
    this.phWildKey = null;
    this.phWildDex?.close();
  }

  /** Phantom UI: both sides send out (the mock-up's `send` card), just before the throw. */
  private async phSendCard(): Promise<void> {
    const battle = this.run.battle;
    const me = this.shown.player, foe = this.shown.enemy;
    if (!battle || !me || !this.phCards()) return;
    const { content } = services().session;
    const side = (m: PokemonInstance, by: string, pic: 'front' | 'back'): SendSide => ({ by, name: this.speciesName(m), level: m.level, types: getSpecies(content, m.speciesId).types, mon: this.phArt(m, pic) });
    await this.phMoment((ph) => phSend(ph, {
      me: side(me, this.phPlayerName(), 'back'),
      foe: foe ? side(foe, battle.trainer ? this.trainerTitle() ?? battle.trainer.name : '', 'front') : null,
      order: this.run.party.map((m) => ({ file: monFile(this, m.speciesId, 'front', !!m.shiny), on: m.uid === me.uid, ko: m.hp <= 0 })),
      backdrop: this.phBackdrop(),
    }), 1900);
  }

  /**
   * Phantom UI: a transformation's cut-in card. Presentation only: it reads the battle, changes nothing, and any
   * failure (or a skip) just ends it. It stays about two and a half seconds; any key or a click moves on.
   */
  private async phGimmickCard(side: Side, mon: PokemonInstance, kind: GimmickCard['kind'], x: { to: string; itemId: string | null; teraType: string | null; zBase: Move | null; zMoveId: string | null }): Promise<void> {
    try {
      const { content } = services().session;
      const battle = this.run.battle;
      const mine = side === 'player';
      const art = (id: string, shiny: boolean): Art | null => ((f) => (f ? { file: f, atlas: true } : null))(monFile(this, id, 'front', shiny));
      const changes = kind === 'mega' || kind === 'primal' || kind === 'gigantamax';
      const zMove = kind === 'zmove' ? (x.zMoveId ? (content.moves.get(x.zMoveId) ?? null) : x.zBase ? zMoveFor(content, x.zBase) : null) : null;
      const crystal = kind === 'zmove' ? x.itemId ?? (x.zBase && mine ? ownedZCrystal(content, this.run.inventory, x.zBase.type) : null) : x.itemId;
      const max = calcStats(content, mon).hp;
      const big = kind === 'dynamax' || kind === 'gigantamax' ? calcStats(content, { ...mon, speciesId: x.to, dynamaxed: true }).hp : max;
      const other = this.shown[mine ? 'enemy' : 'player'];
      const v2 = this.run.story.v2;
      const model: GimmickCard = {
        kind,
        name: this.speciesName(mon),
        mon: art(changes ? x.to : mon.speciesId, !!mon.shiny),
        trainer: mine ? v2?.protagonist?.name || content.archetypes.get(this.run.archetypeId)?.name || 'You' : battle?.trainer?.name ?? '',
        cast: mine ? this.rxMe() : battle?.trainer ? artOf(this, this.trainerArt()?.assetId) : null,
        item: crystal ? content.items.get(crystal)?.name : undefined,
        type: kind === 'tera' ? x.teraType ?? undefined : kind === 'zmove' ? (zMove ?? x.zBase)?.type : undefined,
        move: zMove ? { name: zMove.name, power: zMove.power ?? null } : undefined,
        hp: big !== max && mon.hp > 0 ? [mon.hp, Math.max(1, Math.round((mon.hp * big) / max))] : undefined,
        turns: kind === 'dynamax' || kind === 'gigantamax' ? battle?.transform.dynamax[mon.uid] ?? content.balance.transformations.dynamaxTurns : undefined,
        foe: other ? art(other.speciesId, !!other.shiny) : null,
      };
      let over = false;
      let finish!: () => void;
      const done = new Promise<void>((r) => (finish = r));
      const end = (): void => {
        if (over) return;
        over = true;
        try {
          view.destroy();
        } catch {
          // the scene may already be gone
        }
        finish();
      };
      const view = mountRedux(this, { render: (c) => (c.ph ? phGimmick(c.ph, model) : ''), acts: { next: end }, card: true });
      this.time.delayedCall(3200, end);
      this.events.once('shutdown', end);
      await this.gimmickBeat({ done, skip: end });
    } catch {
      // A presentation failure must never block the battle.
    }
  }

  /** The ace's card: the long boss sequence (Champion), a boss's band, or the ACE! stamp. Presentation only. */
  private async aceCall(): Promise<void> {
    if (!this.shown.enemy) return;
    const bossNow = this.boss();
    if (bossNow?.role === 'champion') {
      // M7: the Champion's final Pokémon changes the music and gets the long ace sequence.
      const finalTrack = 'bgm.raid.tera3';
      if (services().assets.has(finalTrack) && !this.stadium) {
        this.baseTrack = finalTrack;
        this.playingTrack = finalTrack;
        playMusicLazy(this, finalTrack, finalTrack);
      }
      await this.bigMoment('aceEntrance', `ace.${bossNow.title}`, 'FINAL POKÉMON', this.speciesName(this.shown.enemy), true, { name: bossNow.name, role: 'Final Battle', line: 'Last Pokémon. Make it count.' });
    } else if (bossNow) await this.bigMoment('aceEntrance', `ace.${bossNow.title}`, 'ACE!', `${bossNow.title}: ${this.speciesName(this.shown.enemy)}`, false, { name: this.speciesName(this.shown.enemy), role: `${bossNow.role === 'elite' ? 'Elite Four' : 'Gym Leader'}’s Ace`, line: `${this.speciesName(this.shown.enemy)}. It is time.` });
    else await this.playBeat(stamp(this, 'ACE!', this.speciesName(this.shown.enemy), this.foeRim(), this.motion));
  }

  /**
   * The ace lands (redesign pass 15): after its card it leaps onto its spot, squashes, and the ground answers with
   * dust, a gold ring and a star. Reduced: it appears with the squash and the ring. Off: it is simply there.
   */
  private async aceLandMoment(mon: PokemonInstance): Promise<void> {
    const level = this.clipLevel();
    const at = this.spotXY('enemy');
    const visual = this.showSprite('enemy', mon, true, false);
    const h = visual instanceof Phaser.GameObjects.Sprite ? visual.displayHeight * visual.originY : 120;
    const st = services().session.settings;
    const run = playClip(this, aceLandClip({ x: at.x, y: at.y, h, side: 'enemy' }, level), this.clipHost({ mon: { kind: 'mon', get: () => visual } }, {
      cue: (name) => {
        if (name !== 'land') return;
        playSfx(this, 'se.ball_catch', 0.4);
        if (level === 'full' && st.battleScreenEffects) this.cameras.main.shake(350, 0.012 * st.shakeIntensity);
      },
    }));
    await run.done;
    if (visual.active) this.standUp(visual, mon);
  }

  /**
   * Hit (pass 2): the target goes white, squashes, is thrown back away from the attacker (further for a super effective
   * or critical hit) and springs home with dust. Full animations only; false when it can't play (the plain hit-stop shows).
   */
  private hitMoment(side: Side, cue: { amount: number; crit: boolean; effectiveness: number; color?: string }): boolean | { shake: number; heavy: boolean; hold?: number } {
    const sprite = side === 'player' ? this.playerSprite : this.enemySprite;
    if (!(sprite instanceof Phaser.GameObjects.Sprite) || !sprite.active || !sprite.visible || this.clipLevel() !== 'full') return false;
    const at = this.spotXY(side);
    // Something else is moving it (a move's own animation): leave it to that.
    if (Math.abs(sprite.x - at.x) > 1) return false;
    standStill(this, sprite);
    const mon = this.shown[side];
    const max = Math.max(1, maxHp(services().session.content, mon));
    // Big: super effective, critical or 40% of its HP (pass 16, 18). Sharp: critical, super effective or 60% (pass 17).
    const big = bigHit(cue.amount, max, cue.effectiveness, cue.crit);
    const sharp = cue.crit || cue.effectiveness > 1 || cue.amount >= max * 0.6;
    // Power tiers (pass 12): the more of its HP the hit takes, the further it throws the Pokémon and the harder it shakes.
    const power = hitPower(cue.amount, max, cue.crit || cue.effectiveness > 1);
    const h = sprite.displayHeight * sprite.originY;
    const color = cue.color ? Phaser.Display.Color.HexStringToColor(cue.color).color : 0xffffff;
    // The light: a glow on the body and a flat pool on the floor, in the move's colour, added over the arena.
    const key = glowPicture(this);
    const r = big ? HIT_LIGHT.bodyBig : HIT_LIGHT.body;
    const rf = big ? HIT_LIGHT.floorBig : HIT_LIGHT.floor;
    let cut = false;
    const land = (): void => {
      if (cut || !sprite.active) return;
      const light = key ? this.add.image(at.x, at.y - h / 2, key).setScale((r * 2) / GLOW_SIZE).setTint(color).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0) : null;
      const floor = key ? this.add.image(at.x, at.y - 4, key).setScale((rf * 2) / GLOW_SIZE, (rf * 2 * 0.26) / GLOW_SIZE).setTint(color).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0) : null;
      if (floor) this.field.addAt(floor, this.fieldBase);
      if (light) this.field.add(light);
      const other = side === 'player' ? this.enemySprite : this.playerSprite;
      const run = playClip(this, hitClip({ x: sprite.x, y: at.y, h }, side === 'enemy' ? 1 : -1, { big, sharp, p: power.p }, 'full'), {
        ...this.clipHost({ mon: { kind: 'mon', get: () => sprite }, light: { kind: 'free', get: () => light }, floor: { kind: 'free', get: () => floor } }, {
          cue: (name) => {
            // A big hit lights the other Pokémon too: a wash of the colour over it that fades in half a second.
            if (name !== 'glow' || !(other instanceof Phaser.GameObjects.Sprite) || !other.active || !other.visible) return;
            const lit = this.add.sprite(other.x, other.y, other.texture.key, other.frame.name).setOrigin(other.originX, other.originY).setScale(other.scaleX, other.scaleY).setFlip(other.flipX, other.flipY).setTintFill(color).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.6);
            if (other.parentContainer) other.parentContainer.addAt(lit, other.parentContainer.getIndex(other) + 1);
            if (other.mask) lit.setMask(other.mask);
            this.tweens.add({ targets: lit, alpha: 0, duration: 500, onComplete: () => lit.destroy() });
          },
        }),
      });
      sprite.setData(HIT_RUN, { stop: () => ((cut = true), run.stop()) });
      void run.done.then(() => {
        light?.destroy();
        floor?.destroy();
        if (cut || !sprite.active) return;
        sprite.setData(HIT_RUN, undefined);
        run.rest('mon');
        if (sprite === (side === 'player' ? this.playerSprite : this.enemySprite)) this.standUp(sprite, mon);
      });
    };
    // The critical hit (pass 12): everything stops for a moment first, then the hit lands.
    const freeze = cue.crit ? this.critFreeze(sprite, { x: at.x, y: at.y - h / 2 }) : null;
    if (freeze) {
      sprite.setData(HIT_RUN, { stop: () => ((cut = true), freeze.stop()) });
      void freeze.done.then(() => {
        if (!cut && sprite.active) freeze.rest('mon');
        land();
      });
    } else land();
    const st = services().session.settings;
    return {
      shake: st.battleScreenEffects ? Math.round(power.shake * Math.min(1, Math.max(0, st.shakeIntensity))) : 0,
      heavy: power.tier === 'heavy',
      ...(freeze ? { hold: CRIT_FREEZE.ms } : {}),
    };
  }

  /** The target's middle, for things drawn beside it. */
  private midOf(side: Side): Point {
    const at = this.spotXY(side);
    const sprite = side === 'player' ? this.playerSprite : this.enemySprite;
    const h = sprite?.active ? sprite.displayHeight * sprite.originY : 100;
    return { x: at.x, y: at.y - h / 2 };
  }

  /** Multi-hit (pass 12): hit `k` lands; the combo counter beside the target ticks up, pops and grows. */
  private comboTick(side: Side, k: number): void {
    const level = this.clipLevel();
    const feet = this.spotXY(side);
    const x = Phaser.Math.Clamp(feet.x + COMBO.dx, 50, GAME_WIDTH - 50);
    const y = Phaser.Math.Clamp(feet.y + COMBO.dy, 50, GAME_HEIGHT - 50);
    if (k === 1 || !this.comboText?.active) {
      this.comboText?.destroy();
      this.comboText = this.add
        .text(x, y, '', { fontFamily: `"Jersey 15", ${FONT_FAMILY}`, fontSize: `${COMBO.size}px`, color: '#ffcb05', stroke: '#131c36', strokeThickness: 6, shadow: { offsetX: 3, offsetY: 3, color: '#131c36', fill: true, stroke: true, blur: 0 } })
        .setOrigin(0.5)
        .setDepth(3000)
        .setAlpha(0);
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => (this.comboText = null));
    }
    const t = this.comboText;
    const size = comboScale(k);
    this.time.delayedCall(level === 'full' ? 60 : 0, () => {
      if (!t.active) return;
      this.tweens.killTweensOf(t);
      t.setText(`×${k}`).setAlpha(1).setPosition(x, y);
      if (level !== 'full') return void t.setScale(size.rest);
      t.setScale(size.rest);
      this.tweens.chain({ targets: t, tweens: [{ scale: size.pop, duration: COMBO.upMs }, { scale: size.rest, duration: COMBO.downMs, ease: 'Quad.easeOut' }] });
      this.wxShake(COMBO.shake + k - 1, 80);
    });
  }

  /** The multi-hit ends: the counter lifts away, HIT N TIMES! slams on and the total slams in as one number. */
  private comboEnd(side: Side, count: number, total: number): void {
    const t = this.comboText;
    this.comboText = null;
    if (t?.active) {
      this.tweens.killTweensOf(t);
      this.tweens.add({ targets: t, alpha: 0, y: t.y - COMBO.lift, duration: COMBO.outMs, onComplete: () => t.destroy() });
    }
    const mid = this.midOf(side);
    const spot = side === 'enemy' ? { x: mid.x + COMBO.stampDx, y: COMBO.stampY } : hitStampSpot(side, mid);
    this.wxStamp(`HIT ${count} TIMES!`, '#ffcb05', '#131c36', spot.x, spot.y, false);
    if (total > 0) void this.fx.play([{ kind: 'number', side, amount: total, tone: 'crit', motion: this.clipLevel() === 'full' }]);
  }

  /** A hit's word stamp (pass 5): CRITICAL HIT!, SUPER EFFECTIVE!, Not very effective… or NO EFFECT beside the target. */
  private hitStamp(side: Side, kind: string): boolean {
    const look = HIT_STAMPS[kind];
    const sprite = side === 'player' ? this.playerSprite : this.enemySprite;
    if (!look || !sprite?.active || !sprite.visible) return false;
    const at = this.spotXY(side);
    const spot = hitStampSpot(side, { x: at.x, y: at.y - (sprite.displayHeight * sprite.originY) / 2 });
    const show = (): void => this.wxStamp(look.word, look.fill, look.ink, spot.x, spot.y + look.dy, look.soft);
    if (look.at > 0) this.time.delayedCall(look.at, show);
    else show();
    return true;
  }

  /**
   * The critical hit's freeze (pass 12): the target goes white with a star and yellow rays, black bars close in from
   * top and bottom, the camera jumps to it and the arena's colour drains for a moment.
   */
  private critFreeze(sprite: Phaser.GameObjects.Sprite, mid: Point): ClipRun {
    const F = CRIT_FREEZE;
    const st = services().session.settings;
    this.critFrozeAt = this.time.now;
    return playClip(this, critFreezeClip(mid, 'full'), {
      ...this.clipHost({ mon: { kind: 'mon', get: () => sprite } }, {
        cue: (name) => {
          if (name !== 'freeze') return;
          // The bars hold to the screen's edges while the camera jumps in (drawn in the world, so placed each frame).
          const bars = [0, 1].map(() => this.add.rectangle(0, 0, GAME_WIDTH, F.bar, 0x05070f).setOrigin(0).setDepth(1400));
          const slide = { k: 0 };
          const place = (): void => {
            const cam = this.cameras.main;
            const v = cam.worldView;
            const h = F.bar / cam.zoom;
            bars.forEach((b, i) => b.active && b.setPosition(v.x - 2, i ? v.bottom - h * slide.k : v.y - h * (1 - slide.k)).setSize(v.width + 4, h));
          };
          place();
          this.events.on(Phaser.Scenes.Events.POST_UPDATE, place);
          this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.events.off(Phaser.Scenes.Events.POST_UPDATE, place));
          this.tweens.chain({
            targets: slide,
            tweens: [
              { k: 1, duration: F.barIn, ease: 'Cubic.easeOut' },
              { k: 0, duration: F.barOut, delay: F.barHold, ease: 'Quad.easeIn' },
            ],
            onComplete: () => {
              this.events.off(Phaser.Scenes.Events.POST_UPDATE, place);
              bars.forEach((b) => b.destroy());
            },
          });
          if (st.battleScreenEffects && !this.camBusy) {
            const cam = this.cameras.main;
            this.camBusy = true;
            cam.pan(mid.x, mid.y, F.camIn, 'Cubic.easeOut', true);
            cam.zoomTo(F.zoom, F.camIn, 'Cubic.easeOut', true);
            this.time.delayedCall(F.camIn + F.camHold, () => {
              cam.pan(GAME_WIDTH / 2, GAME_HEIGHT / 2, F.camOut, 'Sine.easeInOut', true);
              cam.zoomTo(1, F.camOut, 'Sine.easeInOut', true);
              this.time.delayedCall(F.camOut, () => (this.camBusy = false));
            });
          }
          // The arena's colour drains to grey and dims, then comes back.
          const drains = this.arenaLayers.filter((img) => img.active && img.preFX).map((img) => ({ img, cm: img.preFX!.addColorMatrix() }));
          if (!drains.length) return;
          const paint = (k: number) => drains.forEach(({ img, cm }) => img.active && (cm.reset(), cm.brightness(1 - (1 - F.dim) * k, true), cm.saturate(-k, true)));
          this.tweens.chain({
            targets: { k: 0 },
            tweens: [
              { k: 1, duration: F.drainIn, onUpdate: (tw) => paint(Number(tw.getValue()) || 0) },
              { k: 0, duration: F.drainOut, delay: F.drainHold, onUpdate: (tw) => paint(Number(tw.getValue()) || 0) },
            ],
            onComplete: () => drains.forEach(({ img, cm }) => img.active && img.preFX?.remove(cm as unknown as Phaser.FX.Controller)),
          });
        },
      }),
    });
  }

  // ---------- conditions (redesign pass 8): each status arrives, stays on the Pokémon and ticks each turn ----------

  /** Where a side's Pokémon stands and how big it is drawn, for the condition clips. */
  private condSpot(side: Side, sprite: Phaser.GameObjects.Sprite): CondSpot {
    const at = this.spotXY(side);
    return { x: at.x, y: at.y, w: Math.max(60, sprite.displayWidth * 0.6), h: Math.max(60, sprite.displayHeight * sprite.originY), side };
  }

  /** How far the top of the Pokémon's drawn body is above its feet (the frame's empty rows left out), px on screen. */
  private headHeight(sprite: Phaser.GameObjects.Sprite): number {
    const full = sprite.displayHeight * sprite.originY;
    try {
      const f = sprite.frame;
      const key = `${sprite.texture.key}|${f.name}`;
      let top = this.bodyTops.get(key);
      if (top === undefined) {
        top = 0;
        scan: for (let y = 0; y < f.height; y++) {
          for (let x = 0; x < f.width; x += 2) {
            if (this.textures.getPixelAlpha(x, y, sprite.texture.key, f.name) > 40) {
              top = y;
              break scan;
            }
          }
        }
        this.bodyTops.set(key, top);
      }
      return Math.max(30, full - top * Math.abs(sprite.scaleY));
    } catch {
      return full;
    }
  }

  /** The side's Pokémon, when it is one picture on the field that a look can sit on. */
  private condSprite(side: Side): Phaser.GameObjects.Sprite | null {
    const v = side === 'player' ? this.playerSprite : this.enemySprite;
    return !this.duo && v instanceof Phaser.GameObjects.Sprite && v.active ? v : null;
  }

  /** Locked statuses stop its own picture moving; sleep slows it to a third and dims it. */
  private condPose(visual: Visual, kind: CondKind | null): void {
    if (!(visual instanceof Phaser.GameObjects.Sprite)) return;
    const rate = kind === 'par' || kind === 'frz' ? 0 : kind === 'slp' ? 0.3 : 1;
    if (rate !== 1 || visual.getData('condRate')) {
      visual.anims.timeScale = rate;
      visual.setData('condRate', rate !== 1);
    }
    const dim = kind === 'slp';
    if (dim && !visual.getData('dimmed') && !visual.isTinted) {
      visual.setTint(0xb8b8b8);
      visual.setData('dimmed', true);
    } else if (!dim && visual.getData('dimmed')) {
      visual.clearTint();
      visual.setData('dimmed', false);
    }
  }

  /** Sleep's slump: it leans away from the other side, sinks 12 px and gets shorter. Once; `unslump` undoes it. */
  private slump(sprite: Phaser.GameObjects.Sprite, side: Side): void {
    if (sprite.getData('slumped')) return;
    sprite.setAngle(SLUMP.rot * (side === 'enemy' ? 1 : -1)).setY(this.spotXY(side).y + SLUMP.dy).setScale(sprite.scaleX, sprite.scaleY * SLUMP.sy);
    sprite.setData('slumped', true);
  }

  private unslump(sprite: Phaser.GameObjects.Sprite, side: Side): void {
    if (!sprite.getData('slumped')) return;
    standStill(this, sprite);
    sprite.setAngle(0).setY(this.spotXY(side).y).setScale(sprite.scaleX, sprite.scaleY / SLUMP.sy);
    sprite.setData('slumped', false);
  }

  /** Keeps the side's look in step with its status: a switch-in already burned wears it at once; a cure takes it off. */
  private condSync(side: Side): void {
    try {
      const dz = this.dizzy[side];
      if (dz && (dz.sprite !== this.condSprite(side) || this.clipLevel() === 'off')) this.dizzyOff(side, 0);
      const sprite = this.condSprite(side);
      const kind = condKind(this.shown[side]?.status?.id);
      const level = this.clipLevel();
      const cur = this.conds[side];
      if (cur && (cur.sprite !== sprite || cur.kind !== kind || level === 'off')) {
        cur.destroy(cur.sprite === sprite ? 250 : 0);
        this.conds[side] = null;
        if (sprite && cur.sprite === sprite) {
          if (cur.kind === 'slp') this.unslump(sprite, side);
          this.condPose(sprite, null);
          if (sprite.visible) this.standUp(sprite, this.shown[side]);
        }
      }
      if (!kind || !sprite || this.conds[side] || level === 'off' || !sprite.visible) return;
      const look = new ConditionLook(this, sprite, kind, this.condSpot(side, sprite), level, false);
      this.conds[side] = look;
      look.start();
      this.standUp(sprite, this.shown[side]);
    } catch {
      /* presentation only */
    }
  }

  /** BattleFx asks: show our own look for this status moment instead of the pack's animation? */
  private condition(side: Side, status: string, at: 'arrive' | 'tick' | 'cant'): boolean {
    if (status === 'cnf') return this.confusionMoment(side, at);
    const kind = condKind(status);
    const sprite = this.condSprite(side);
    if (!kind || !sprite || !sprite.visible || this.clipLevel() === 'off') return false;
    try {
      if (at === 'arrive') return this.condArrive(side, kind, sprite);
      const look = this.conds[side];
      if (!look || look.sprite !== sprite || look.kind !== kind) return false;
      if (at === 'tick') return kind === 'brn' || kind === 'psn' ? this.condTick(side, kind, sprite, look) : false;
      if (kind === 'par') return this.parCant(side, sprite, look);
      // Asleep or frozen: the look already says it.
      return kind === 'slp' || kind === 'frz';
    } catch {
      return false;
    }
  }

  /** Confusion (pass 8): stars arrive and circle its head while it sways; hurting itself swings, bonks and shakes. */
  /** Recoil (pass 12): a crack runs back from the target, the user flashes the move's colour, winces, RECOIL. */
  private recoilMoment(side: Side): void {
    const sprite = this.condSprite(side);
    const level = this.clipLevel();
    if (!sprite || !sprite.visible || level === 'off' || this.duo) return;
    try {
      const otherSide: Side = side === 'player' ? 'enemy' : 'player';
      const other = this.condSprite(otherSide);
      const user = this.condSpot(side, sprite);
      const target = other ? this.condSpot(otherSide, other) : { ...user, ...this.spotXY(otherSide), side: otherSide };
      const color = TYPE_COLORS[this.lastMoveType] ?? 0xffffff;
      const mon = this.shown[side];
      const mid = this.midOf(side);
      this.condPlay(sprite, recoilClip(user, target, color, level), {}, (cut) => {
        if (cut || !sprite.active) return;
        this.restAt(sprite, side);
        if (sprite.visible) this.standUp(sprite, mon);
      }, (name) => {
        if (name === 'stamp') this.wxStamp('RECOIL', '#131c36', '#ffffff', Phaser.Math.Clamp(mid.x + (side === 'player' ? 1 : -1) * RECOIL.stampDx, 110, GAME_WIDTH - 110), Math.max(60, mid.y + RECOIL.stampDy), true);
        if (name === 'tint') this.washSprite(sprite, color, RECOIL.tint, RECOIL.tintHold, RECOIL.tintOut);
      });
    } catch {
      /* presentation only */
    }
  }

  /** Drain (pass 12): green lights cross from the target into the user, which glows; resolves when the last lands. */
  private async drainMoment(side: Side): Promise<boolean> {
    const sprite = this.condSprite(side);
    if (!sprite || !sprite.visible || this.clipLevel() !== 'full' || this.duo) return false;
    try {
      const otherSide: Side = side === 'player' ? 'enemy' : 'player';
      const other = this.condSprite(otherSide);
      const user = this.condSpot(side, sprite);
      const target = other ? this.condSpot(otherSide, other) : { ...user, ...this.spotXY(otherSide), side: otherSide };
      const run = playClip(this, drainClip(user, target, 'full'), this.clipHost({}, { cue: (name) => name === 'tint' && this.washSprite(sprite, DRAIN.glow, DRAIN.tint, DRAIN.tintHold, DRAIN.tintOut) }));
      await run.done;
      return true;
    } catch {
      return false;
    }
  }

  /** A wash of one colour over a Pokémon (a solid copy on top of it) that holds, then fades. */
  private washSprite(sprite: Phaser.GameObjects.Sprite, color: number, alpha: number, holdMs: number, outMs: number): void {
    if (!sprite.active) return;
    const lit = this.add.sprite(sprite.x, sprite.y, sprite.texture.key, sprite.frame.name).setOrigin(sprite.originX, sprite.originY).setScale(sprite.scaleX, sprite.scaleY).setFlip(sprite.flipX, sprite.flipY).setTintFill(color).setAlpha(alpha);
    if (sprite.parentContainer) sprite.parentContainer.addAt(lit, sprite.parentContainer.getIndex(sprite) + 1);
    if (sprite.mask) lit.setMask(sprite.mask);
    const follow = (): void => {
      if (!sprite.active || !lit.active) return;
      lit.setPosition(sprite.x, sprite.y).setScale(sprite.scaleX, sprite.scaleY).setFrame(sprite.frame.name);
    };
    this.events.on(Phaser.Scenes.Events.POST_UPDATE, follow);
    this.tweens.add({ targets: lit, alpha: 0, delay: holdMs, duration: outMs, onComplete: () => (this.events.off(Phaser.Scenes.Events.POST_UPDATE, follow), lit.destroy()) });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.events.off(Phaser.Scenes.Events.POST_UPDATE, follow));
  }

  private confusionMoment(side: Side, at: 'arrive' | 'tick' | 'cant'): boolean {
    const sprite = this.condSprite(side);
    const level = this.clipLevel();
    if (!sprite || !sprite.visible || level === 'off' || this.duo) return false;
    try {
      if (at === 'arrive') return this.dizzyOn(side, true);
      // The "is confused!" check: the circling stars already say it.
      if (at === 'cant') return this.dizzyOn(side, false);
      if (!this.dizzy[side]) this.dizzyOn(side, false);
      const mon = this.shown[side];
      this.condPlay(sprite, confusionHitClip({ ...this.condSpot(side, sprite), h: this.headHeight(sprite) }, level), {}, (cut) => {
        if (cut || !sprite.active) return;
        this.restAt(sprite, side);
        if (sprite.visible) this.standUp(sprite, mon);
      }, (name) => name === 'shake' && this.wxShake(5, 150));
      return true;
    } catch {
      return false;
    }
  }

  /** Puts confusion's stars on the side's Pokémon (popping in when `pop`) and starts its sway. */
  private dizzyOn(side: Side, pop: boolean): boolean {
    const sprite = this.condSprite(side);
    const level = this.clipLevel();
    if (!sprite || level === 'off' || this.duo) return false;
    if (this.dizzy[side]?.sprite === sprite) return true;
    this.dizzy[side]?.destroy();
    this.dizzy[side] = new DizzyStars(this, sprite, this.headHeight(sprite), level === 'full' ? 'full' : 'reduced', pop && level === 'full');
    if (sprite.visible && this.shown[side]) this.standUp(sprite, this.shown[side]);
    return true;
  }

  /** It snaps out of confusion (or leaves): the stars go and it stands as before. */
  private dizzyOff(side: Side, fadeMs = 200): void {
    const dz = this.dizzy[side];
    if (!dz) return;
    this.dizzy[side] = null;
    dz.destroy(fadeMs);
    const sprite = dz.sprite;
    if (sprite.active && sprite === this.condSprite(side) && sprite.visible && this.shown[side]) {
      standStill(this, sprite);
      this.restAt(sprite, side);
      this.standUp(sprite, this.shown[side]);
    }
  }

  /** Plays a condition clip on the Pokémon; `after` runs when it ends (or is cut short by another moment). */
  private condPlay(sprite: Phaser.GameObjects.Sprite, clip: MotionClip, parts: Record<string, ClipPart>, after: (cut: boolean) => void, cue?: (name: string) => void): void {
    standStill(this, sprite);
    const run = playClip(this, clip, this.clipHost({ mon: { kind: 'mon', get: () => sprite }, ...parts }, cue ? { cue } : {}));
    let cut = false;
    sprite.setData(HIT_RUN, { stop: () => ((cut = true), run.stop()) });
    void run.done.then(() => {
      if (!cut) sprite.setData(HIT_RUN, undefined);
      after(cut);
    });
  }

  /** A status arrives (pass 8): flames climb, bubbles rise, bolts crawl, rings close in, ice grows. */
  private condArrive(side: Side, kind: CondKind, sprite: Phaser.GameObjects.Sprite): boolean {
    this.conds[side]?.destroy();
    const level = this.clipLevel() === 'full' ? 'full' : 'reduced';
    const spot = this.condSpot(side, sprite);
    const look = new ConditionLook(this, sprite, kind, spot, level, true);
    this.conds[side] = look;
    const temps: Phaser.GameObjects.Image[] = [];
    const parts: Record<string, ClipPart> = { tint: { kind: 'free', get: () => look.wash }, ice: { kind: 'free', get: () => look.ice } };
    const key = level === 'full' ? (kind === 'brn' ? flamePicture(this) : kind === 'psn' ? bubblePicture(this) : null) : null;
    if (key) {
      for (let i = 0; i < 9; i++) {
        const img = putAbove(sprite, this.add.image(spot.x, spot.y, key).setOrigin(0.5, kind === 'brn' ? 1 : 0.5).setScale(PICTURE_SCALE));
        temps.push(img);
        parts[`${kind === 'brn' ? 'f' : 'b'}${i}`] = { kind: 'free', get: () => img };
      }
    }
    const mon = this.shown[side];
    this.condPlay(sprite, condArriveClip(kind, spot, level), parts, () => {
      temps.forEach((t) => t.destroy());
      if (!sprite.active || this.conds[side] !== look) return;
      // The slump is the clip's end state: it stays.
      if (kind === 'slp') sprite.setData('slumped', true);
      else this.restAt(sprite, side);
      look.start();
      if (sprite.visible) this.standUp(sprite, mon);
    });
    return true;
  }

  /** Puts a Pokémon back on its own spot, upright, at its own size (after a condition clip moved it). */
  private restAt(sprite: Phaser.GameObjects.Sprite, side: Side): void {
    const at = this.spotXY(side);
    sprite.setPosition(at.x, sprite.getData('slumped') ? at.y + SLUMP.dy : at.y);
  }

  /** The turn's tick: burn's embers flare and it flinches white; poison swells a bubble over its head that bursts. */
  private condTick(side: Side, kind: 'brn' | 'psn', sprite: Phaser.GameObjects.Sprite, look: ConditionLook): boolean {
    look.hold();
    const spot = this.condSpot(side, sprite);
    const parts: Record<string, ClipPart> = {};
    look.embers.forEach((e, i) => (parts[`e${i}`] = { kind: 'free', get: () => e }));
    const key = kind === 'psn' && this.clipLevel() === 'full' ? bubblePicture(this) : null;
    const big = key ? putAbove(sprite, this.add.image(spot.x, spot.y - spot.h - 16, key).setScale(40 / BUBBLE_W / 2)) : null;
    if (big) parts.big = { kind: 'free', get: () => big };
    const mon = this.shown[side];
    this.condPlay(sprite, condTickClip(kind, spot, this.clipLevel()), parts, () => {
      big?.destroy();
      if (!sprite.active || this.conds[side] !== look) return;
      this.restAt(sprite, side);
      look.start();
      if (sprite.visible) this.standUp(sprite, mon);
    });
    return true;
  }

  /** Paralysis stops it: a short lunge that locks up, a spark, and a dark CAN'T MOVE stamp. */
  private parCant(side: Side, sprite: Phaser.GameObjects.Sprite, look: ConditionLook): boolean {
    const spot = this.condSpot(side, sprite);
    const level = this.clipLevel();
    const mon = this.shown[side];
    this.condPlay(sprite, parCantClip(spot, level), { tint: { kind: 'free', get: () => look.wash } }, () => {
      if (!sprite.active) return;
      this.restAt(sprite, side);
      if (sprite.visible) this.standUp(sprite, mon);
    });
    const key = level === 'full' ? stampPicture(this, "CAN'T MOVE", '#131c36', '#ffffff') : null;
    if (key) {
      const y = Math.max(40, spot.y - spot.h - 30);
      const st = this.add.image(spot.x, y, key).setScale(PICTURE_SCALE * 0.4).setAlpha(0).setDepth(4000);
      this.tweens.chain({
        targets: st,
        tweens: [
          { alpha: 1, duration: 1, delay: 350 },
          { scale: PICTURE_SCALE, duration: 140, ease: 'Back.easeOut' },
          { y: y - 40, alpha: 0, duration: 300, delay: 1000, ease: 'Quad.easeIn' },
        ],
        onComplete: () => st.destroy(),
      });
    }
    return true;
  }

  /**
   * A stat change (pass 8): chevrons in the stat's colour sweep its body (up for a boost, down for a drop; a wave a
   * stage), the colour washes over it, it stretches or squashes; a stamp ("ATTACK ▲", "DEFENSE ▼▼") pops beside it
   * and a row of six pips shows where the stat now stands. False when it can't play here (the pack's arrows show).
   */
  private statMoment(side: Side, stat: string, change: number): boolean {
    const sprite = this.condSprite(side);
    const level = this.clipLevel();
    if (!sprite || !sprite.visible || level === 'off') return false;
    try {
      const at = this.spotXY(side);
      const h = sprite.displayHeight * sprite.originY;
      const spot: CondSpot = { x: at.x, y: at.y, w: sprite.displayWidth, h, side };
      const color = STAT_COLOR[stat] ?? 0xffffff;
      const up = change > 0;
      const n = chevronWaves(change);
      const clip = statClip(spot, change, color, level);
      const mon = this.shown[side];
      // The Pokémon's part (the stretch and the wash) may be cut short by the next moment; the chevrons fly on.
      this.condPlay(sprite, clip, {}, (cut) => {
        if (cut || !sprite.active) return;
        this.restAt(sprite, side);
        if (sprite.visible) this.standUp(sprite, mon);
      });
      const key = level === 'full' ? chevronPicture(this, n) : null;
      if (key) {
        const parts: Record<string, ClipPart> = {};
        const chevs = Array.from({ length: n * 5 }, (_, j) => {
          const c = putAbove(sprite, this.add.image(spot.x, spot.y, key).setScale(PICTURE_SCALE).setTint(color).setFlipY(!up).setAlpha(0));
          parts[`c${j}`] = { kind: 'free', get: () => c };
          return c;
        });
        void playClip(this, clip, this.clipHost(parts)).done.then(() => chevs.forEach((c) => c.destroy()));
      }
      // The stamp: the stat's word and an arrow a stage, in the stat's colour (a drop: sky blue), beside it.
      const word = `${STAT_WORDS[stat] ?? stat.toUpperCase()} ${(up ? '▲' : '▼').repeat(n)}`;
      const fill = `#${(up ? color : STAT_DOWN_STAMP).toString(16).padStart(6, '0')}`;
      const sk = stampPicture(this, word, fill, '#ffffff');
      const mid = spot.y - h / 2;
      const sx = Phaser.Math.Clamp(spot.x + (side === 'enemy' ? -150 : 190), 90, this.scale.width - 90);
      const sy = Math.max(40, mid - (side === 'enemy' ? 20 : 90));
      const objs: Phaser.GameObjects.Image[] = [];
      if (sk) {
        const st = this.add.image(sx, sy, sk).setScale(PICTURE_SCALE * 0.4).setAlpha(0).setDepth(4000);
        objs.push(st);
        this.tweens.chain({
          targets: st,
          tweens: [
            { alpha: 1, duration: 1, delay: level === 'full' ? 150 : 0 },
            { scale: PICTURE_SCALE, duration: 140, ease: 'Back.easeOut' },
            { y: sy - 40, alpha: 0, duration: 300, delay: 800, ease: 'Quad.easeIn' },
          ],
          onComplete: () => st.destroy(),
        });
      }
      // Six pips under the stamp: one filled for each stage it now stands above (or below) normal.
      const stage = Phaser.Math.Clamp((this.statStages[side][stat] ?? 0) + change, -6, 6);
      const pk = pipPicture(this);
      if (pk) {
        for (let i = 0; i < 6; i++) {
          const lit = stage > 0 ? i < stage : stage < 0 ? i >= 6 + stage : false;
          const p = this.add.image(sx - 32.5 + i * 13, sy + 32, pk).setScale(0).setDepth(4000);
          if (lit) p.setTint(stage > 0 ? color : STAT_DOWN_STAMP);
          else p.setAlpha(0.2);
          this.tweens.chain({
            targets: p,
            tweens: [
              { scale: PICTURE_SCALE, duration: 200, delay: (level === 'full' ? 100 : 0) + i * 30, ease: 'Back.easeOut' },
              { alpha: 0, duration: 200, delay: 1300 - i * 30 },
            ],
            onComplete: () => p.destroy(),
          });
        }
      }
      return true;
    } catch {
      return false;
    }
  }

  /**
   * An ability (pass 8): a flag unrolls from its owner's side of the screen (the foe's from the left under its box, yours
   * from the right over yours), holds 2 s and folds away. Intimidate is acted out too: it leans in, the field dims
   * around it, its glare crosses the field and the other Pokémon shrinks back. Singles; null when it can't show here.
   */
  private abilityMoment(side: Side, ability: string, label: string): { shown: 'all' | 'flag'; ms: number } | null {
    const level = this.clipLevel();
    const sprite = this.condSprite(side);
    if (this.duo || level === 'off' || !sprite || !sprite.visible) return null;
    try {
      const fromLeft = side === 'enemy';
      const key = flagPicture(this, this.speciesName(this.shown[side]), label, fromLeft);
      if (!key) return null;
      const box = (side === 'enemy' ? this.enemyBox : this.playerBox)?.container.getBounds();
      const flag = this.add.image(fromLeft ? 0 : this.scale.width, 0, key).setOrigin(fromLeft ? 0 : 1, 0).setScale(0, PICTURE_SCALE).setDepth(3900);
      flag.setY(fromLeft ? (box ? box.bottom + 8 : 140) : Math.max(8, (box ? box.top : 270) - flag.displayHeight - 10));
      this.tweens.chain({
        targets: flag,
        tweens: [
          { scaleX: PICTURE_SCALE, duration: level === 'full' ? 250 : 1, ease: 'Back.easeOut' },
          { scaleX: 0, duration: 200, delay: FLAG_HOLD, ease: 'Quad.easeIn' },
        ],
        onComplete: () => flag.destroy(),
      });
      const other = this.condSprite(side === 'player' ? 'enemy' : 'player');
      if (ability !== 'intimidate' || level !== 'full' || !other || !other.visible) return { shown: 'flag', ms: 0 };
      const spot = (s: Side, v: Phaser.GameObjects.Sprite): CondSpot => ({ ...this.spotXY(s), w: v.displayWidth, h: v.displayHeight * v.originY, side: s });
      const otherSide: Side = side === 'player' ? 'enemy' : 'player';
      const clip = intimidateClip(spot(side, sprite), spot(otherSide, other), level);
      const gk = glarePicture(this);
      // The glare points from its eyes at the other Pokémon's middle (the mockup's 24 degree tilt is that line on its stage).
      const eyes = { x: clip.base.cone!.x!, y: clip.base.cone!.y! };
      const aim = Phaser.Math.RadToDeg(Math.atan2(this.spotXY(otherSide).y - other.displayHeight * other.originY * 0.5 - eyes.y, this.spotXY(otherSide).x - eyes.x));
      const cone = gk ? putAbove(sprite, this.add.image(0, 0, gk).setOrigin(1, 0.5).setAngle(aim - 180).setAlpha(0)) : null;
      // The dim: a dark sheet over the field with the owner lifted above it while it lasts.
      const field = this.field;
      let sheet: Phaser.GameObjects.Rectangle | null = null;
      let place = -1;
      const undim = (): void => {
        if (!sheet) return;
        const sh = sheet;
        sheet = null;
        this.tweens.add({ targets: sh, alpha: 0, duration: 200, onComplete: () => sh.destroy() });
        if (sprite.active && place >= 0 && sprite.parentContainer === field) field.moveTo(sprite, Math.min(place, field.list.length - 1));
      };
      const mon = this.shown[side];
      const otherMon = this.shown[otherSide];
      standStill(this, other);
      const both = playClip(this, clip, this.clipHost({ cone: { kind: 'free', get: () => cone } }, {
        cue: (name) => {
          if (name === 'dim' && !sheet) {
            sheet = this.add.rectangle(this.scale.width / 2, this.scale.height / 2, this.scale.width * 1.2, this.scale.height * 1.2, 0x000000, 0);
            field.add(sheet);
            if (sprite.parentContainer === field) {
              place = field.getIndex(sprite);
              field.bringToTop(sprite);
            }
            this.tweens.add({ targets: sheet, fillAlpha: 0.55, duration: 200 });
          } else if (name === 'undim') undim();
        },
      }));
      // Each Pokémon's own part, so a later moment can stop one without the other.
      this.condPlay(sprite, clip, { owner: { kind: 'mon', get: () => sprite } }, (cut) => {
        if (cut || !sprite.active) return;
        this.restAt(sprite, side);
        if (sprite.visible) this.standUp(sprite, mon);
      });
      const otherRun = playClip(this, clip, this.clipHost({ target: { kind: 'mon', get: () => other } }));
      void otherRun.done.then(() => {
        if (!other.active) return;
        otherRun.rest('target');
        this.restAt(other, otherSide);
        if (other.visible) this.standUp(other, otherMon);
      });
      void both.done.then(() => {
        undim();
        cone?.destroy();
      });
      // The battle goes on ("Its Attack fell!") once the other Pokémon is back on its spot.
      return { shown: 'all', ms: clip.length };
    } catch {
      return null;
    }
  }

  /** Waking (it jumps up, the Z's pop, a "!") and thawing (cracks, the ice shatters): the look comes off. */
  private condEnd(side: Side, how: 'wake' | 'thaw'): void {
    const look = this.conds[side];
    const sprite = this.condSprite(side);
    if (!look || !sprite || look.sprite !== sprite || look.kind !== (how === 'wake' ? 'slp' : 'frz') || !sprite.visible) return;
    const spot = this.condSpot(side, sprite);
    const level = this.clipLevel();
    const mon = this.shown[side];
    const done = (): void => {
      if (!sprite.active) return;
      this.restAt(sprite, side);
      this.condPose(sprite, null);
      if (sprite.visible) this.standUp(sprite, mon);
    };
    if (how === 'wake') {
      look.destroy();
      this.conds[side] = null;
      this.unslump(sprite, side);
      this.condPlay(sprite, wakeClip(spot, level), {}, done, (name) => {
        const key = name === 'bang' ? titlePicture(this, '!', 64, '#ffcb05') : null;
        if (!key) return;
        const y = spot.y - spot.h - 30;
        const bang = this.add.image(spot.x + 20, y, key).setScale(PICTURE_SCALE * 0.4).setDepth(4000);
        this.tweens.chain({ targets: bang, tweens: [{ scale: PICTURE_SCALE, duration: 140, ease: 'Back.easeOut' }, { y: y - 40, alpha: 0, delay: 500, duration: 300, ease: 'Quad.easeIn' }], onComplete: () => bang.destroy() });
      });
      return;
    }
    look.hold();
    // The look is the clip's now: the cure that follows must not take it off mid-shatter.
    this.conds[side] = null;
    this.condPlay(sprite, thawClip(spot, level), { ice: { kind: 'free', get: () => look.ice }, tint: { kind: 'free', get: () => look.wash } }, () => {
      look.destroy();
      done();
    });
  }

  /**
   * Healing (pass 3): green plus-signs rise through the Pokémon, it glows green and hops once, a green ring on the
   * ground. Plays by itself while the bar climbs. False when it can't play here (the pack's heal shows instead).
   */
  private healMoment(side: Side): boolean {
    const sprite = side === 'player' ? this.playerSprite : this.enemySprite;
    const lv = this.clipLevel();
    if (!(sprite instanceof Phaser.GameObjects.Sprite) || !sprite.active || !sprite.visible || lv === 'off') return false;
    const at = this.spotXY(side);
    if (Math.abs(sprite.x - at.x) > 1) return false;
    standStill(this, sprite);
    const mon = this.shown[side];
    const key = lv === 'full' ? plusPicture(this, HEAL_PLUS_SIZE) : null;
    const pluses = key ? HEAL_PLUSES.map(() => this.add.image(at.x, at.y, key).setScale(PICTURE_SCALE).setAlpha(0).setDepth(3000)) : [];
    const parts: Record<string, ClipPart> = { mon: { kind: 'mon', get: () => sprite } };
    pluses.forEach((p, i) => (parts[`plus${i}`] = { kind: 'free', get: () => p }));
    const run = playClip(this, healClip({ x: at.x, y: at.y }, lv), this.clipHost(parts));
    let cut = false;
    sprite.setData(HIT_RUN, { stop: () => ((cut = true), run.stop()) });
    void run.done.then(() => {
      pluses.forEach((p) => p.destroy());
      if (cut || !sprite.active) return;
      sprite.setData(HIT_RUN, undefined);
      run.rest('mon');
      if (sprite === (side === 'player' ? this.playerSprite : this.enemySprite)) this.standUp(sprite, mon);
    });
    return true;
  }

  /**
   * Level up (pass 2, EXP and Level Up): a pale blue flash, the plate jolts as the level ticks over, your Pokémon does
   * two happy hops with dust, and a yellow LEVEL stamp springs out over it. It plays on while the battle goes on.
   */
  private levelUpMoment(level: number): void {
    const sprite = this.playerSprite;
    const mon = this.shown.player;
    if (!sprite?.active || this.duo) return;
    const lv = this.clipLevel();
    const at = this.spotXY('player');
    const h = sprite instanceof Phaser.GameObjects.Sprite ? sprite.displayHeight * sprite.originY : 120;
    const key = lv === 'off' ? null : stampPicture(this, `LEVEL ${level}`);
    const stamp = key ? this.add.image(at.x + 40, at.y - h / 2 - 120, key).setScale(PICTURE_SCALE).setAlpha(0).setDepth(4000) : null;
    if (stamp) stamp.name = 'level-stamp';
    if (sprite instanceof Phaser.GameObjects.Sprite) standStill(this, sprite);
    const run = playClip(this, levelUpClip({ x: at.x, y: at.y, h }, lv), this.clipHost({ mon: { kind: 'mon', get: () => sprite }, stamp: { kind: 'free', get: () => stamp } }, {
      cue: (name) => {
        if (name !== 'tick' || lv !== 'full') return;
        // The plate takes the level with a jolt: up 6 px and back with a spring.
        const c = this.playerBox.container;
        if (!c.visible || this.tweens.isTweening(c)) return;
        const y = c.y;
        this.tweens.chain({ targets: c, tweens: [{ y: y - 6, duration: 50 }, { y, duration: 300, ease: 'Elastic.easeOut', easeParams: [1, 0.4] }], onStop: () => c.setY(y) });
      },
    }));
    void run.done.then(() => {
      stamp?.destroy();
      if (sprite.active && sprite === this.playerSprite) {
        run.rest('mon');
        this.standUp(sprite, mon);
      }
    });
  }

  /**
   * A wild Pokémon appears (pass 5, Wild Encounter): two flashes, the screen splits into nine dark bars that pull
   * apart, the Pokémon slides in as a dark shape, its colour floods in with its cry and a hop, then its plate flies in.
   * Resolves when the plate is in (the clip's last beats play on while the line is read).
   */
  private async wildEntranceMoment(mon: PokemonInstance): Promise<void> {
    const level = this.clipLevel();
    const at = this.spotXY('enemy');
    const visual = this.showSprite('enemy', mon, false, false);
    const bars: Phaser.GameObjects.Image[] = [];
    if (level === 'full') {
      const key = 'wild.bar';
      if (!this.textures.exists(key)) {
        const g = this.make.graphics({ x: 0, y: 0 }, false);
        g.fillStyle(0x0b0d14, 1).fillRect(0, 0, 980, 61);
        g.generateTexture(key, 980, 61);
        g.destroy();
      }
      for (let i = 0; i < WILD_BARS; i++) bars.push(this.add.image(480, 30 + i * 60, key).setDepth(WILD_DEPTH).setScrollFactor(0));
    }
    const parts: Record<string, ClipPart> = { foe: { kind: 'mon', get: () => visual } };
    bars.forEach((bar, i) => (parts[`bar${i}`] = { kind: 'free', get: () => bar }));
    let plateIn: () => void = () => undefined;
    const plate = new Promise<void>((resolve) => (plateIn = resolve));
    const species = getSpecies(services().session.content, mon.speciesId);
    const host = this.clipHost(parts, {
      cue: (name) => {
        if (name === 'cry') playCry(this, species, 100);
        if (name === 'plate') plateIn();
      },
    });
    const h = visual instanceof Phaser.GameObjects.Sprite ? visual.displayHeight * visual.originY : 120;
    const run = playClip(this, wildEntranceClip({ x: at.x, y: at.y, h }, level), { ...host, depth: WILD_DEPTH + 1 });
    void run.done.then(() => {
      bars.forEach((bar) => bar.destroy());
      plateIn();
      if (visual.active) this.standUp(visual, mon);
    });
    await plate;
    await this.refreshInfoBox(this.enemyBox, mon, false);
  }

  /**
   * The foe trainer steps in to throw (pass 4): only in a trainer battle, in singles, with full animations. Resolves
   * with the hand's place the moment the ball leaves it (null: no trainer here, and the ball comes from its usual spot).
   * The trainer leaves by itself while the ball flies.
   */
  private async foeThrowMoment(): Promise<Point | null> {
    const art = this.trainerArt();
    if (!art || this.duo || this.clipLevel() !== 'full') return null;
    const at = this.spotXY('enemy');
    const v = trainerVisual(this, art.assetId, art.label, 1090, at.y + 8, 2);
    if (!(v instanceof Phaser.GameObjects.Sprite)) {
      v.destroy();
      return null;
    }
    // Sized and stood by what is drawn (the frames carry empty borders), feet on the spot: at most 208 px tall and
    // 176 px wide, the mockup's standing trainer (a crouching or wide pose comes out lower, not bigger).
    const box = drawnBox(v);
    v.setOrigin((box.x + box.w / 2) / Math.max(1, v.frame.cutWidth), (box.y + box.h) / Math.max(1, v.frame.cutHeight));
    const k = Math.min(208 / Math.max(1, box.h), 176 / Math.max(1, box.w));
    v.setScale(k);
    const h = box.h * k;
    this.field.addAt(v, this.fieldBase);
    return new Promise<Point | null>((resolve) => {
      const run = playClip(this, foeThrowClip(at, 'full'), this.clipHost({ tr: { kind: 'free', get: () => v } }, {
        cue: (name) => {
          if (name === 'release') resolve(foeHand(at, h));
        },
      }));
      void run.done.then(() => {
        v.destroy();
        resolve(null);
      });
    });
  }

  /** Miss (pass 2): the attacker dashes and overshoots, the target side-steps, both spring back to their spots. */
  private async missMoment(side: Side): Promise<void> {
    const other: Side = side === 'player' ? 'enemy' : 'player';
    const atk = side === 'player' ? this.playerSprite : this.enemySprite;
    const tgt = other === 'player' ? this.playerSprite : this.enemySprite;
    const level = this.clipLevel();
    if (tgt && level !== 'off') {
      // They stop standing their own way while they move (back at their resting place), and start again after.
      for (const v of [atk, tgt]) if (v instanceof Phaser.GameObjects.Sprite) standStill(this, v);
      // Feet below the message bar's top (your Pokémon stands in the foreground) count as standing on its edge, so the
      // dust and the dash stay on the field.
      const onField = (p: Point): Point => ({ x: p.x, y: Math.min(p.y, MESSAGE_Y - 8) });
      const run = playClip(this, missClip(this.spotXY(side), onField(this.spotXY(other)), level), this.clipHost({ atk: { kind: 'mon', get: () => atk }, tgt: { kind: 'mon', get: () => tgt } }));
      await run.done;
      run.rest('atk');
      run.rest('tgt');
      if (atk && this.shown[side]) this.standUp(atk, this.shown[side]!);
      if (this.shown[other]) this.standUp(tgt, this.shown[other]!);
    }
  }

  /** When the last trainer face chip went up (scene clock); chips stay at least `CHEER_GAP` apart. */
  private cheerAt = -Infinity;

  /**
   * Trainer face chip (pass 19): your trainer's face pops in at the bottom right with a word ("Nice hit!", "We did it!")
   * and hops away again. Never waits on anything; nothing at all with animations off, in the Phantom look (its own
   * cards speak), or without your trainer's art.
   */
  private cheer(m: CheerMoment, delay: number): void {
    const level = this.clipLevel();
    if (level === 'off' || this.phCards()) return;
    const now = this.time.now;
    if (now < this.cheerAt + CHEER_GAP) return;
    this.cheerAt = now;
    const art = this.playerArt();
    if (!art) return;
    const color = CHEER_RING[art] ?? throwTint(art);
    const faceKey = cheerFace(this, art, color);
    const wordKey = faceKey ? cheerWordPicture(this, cheerWord(m), color) : null;
    if (!faceKey || !wordKey) return;
    this.time.delayedCall(delay * animationTimeScale(services().session.settings), () => {
      if (!this.sys.isActive()) return;
      const spot = { x: 902, y: 424 };
      const parts = cheerParts(this, spot, faceKey, wordKey, 4000);
      const run = playClip(this, cheerClip(spot, level), this.clipHost({ face: { kind: 'free', get: () => parts.face }, word: { kind: 'free', get: () => parts.word } }));
      void run.done.then(() => {
        parts.face.destroy();
        parts.word.destroy();
      });
    });
  }

  /** The words the Mega Evolution cutscene locks on: stone and ring, the new type and ability, which stats rose. */
  private megaPage(mon: PokemonInstance, toId: string, itemId: string | null): GimmickPage {
    const { content } = services().session;
    const from = getSpecies(content, mon.speciesId);
    const to = content.species.get(toId) ?? from;
    const stone = itemId ? content.items.get(itemId)?.name : undefined;
    const cap = (t: string): string => t.charAt(0).toUpperCase() + t.slice(1);
    const ability = content.abilities.get(abilityOf(content, { ...mon, speciesId: to.id }) ?? '')?.name;
    const STAT: Record<string, string> = { hp: 'HP', atk: 'Attack', def: 'Defense', spa: 'Sp. Atk', spd: 'Sp. Def', spe: 'Speed' };
    const up = (Object.keys(STAT) as (keyof typeof to.baseStats)[])
      .filter((k) => to.baseStats[k] > from.baseStats[k])
      .sort((a, b) => to.baseStats[b] - from.baseStats[b] - (to.baseStats[a] - from.baseStats[a]))
      .slice(0, 3)
      .map((k) => STAT[k]!);
    const name = this.speciesName(mon);
    return {
      tag: stone ? `${stone} · Mega Ring` : 'Mega Evolution',
      title: ['Mega', 'Evolution'],
      facts: [`Type: ${to.types.map(cap).join(' / ')}`, ...(ability ? [`Ability: ${ability}`] : []), ...(up.length ? [`${up.join(', ')} up`] : []), 'Stays until the battle ends'],
      line: stone ? `The ${stone} answers the Mega Ring. ${name} Mega Evolved!` : `${name} Mega Evolved!`,
      accent: 0xff8a3c,
    };
  }

  /** Loads Pokémon front pictures a cutscene draws (the battle itself only has the back of yours). Never throws. */
  private async loadFronts(list: [string, boolean][]): Promise<void> {
    const { content } = services().session;
    const ids = list.flatMap(([id, shiny]) => {
      const sp = content.species.get(id);
      if (!sp) return [];
      const a = pokemonAssetIds(sp.assets);
      return shiny ? [a.front, a.shinyFront] : [a.front];
    });
    await loadAssets(this, ids.filter((id) => services().assets.has(id))).catch(() => undefined);
  }

  /** The words the Tera, Dynamax and Z-Move cutscenes lock on (the Mega one is `megaPage`). Read from the battle; nothing is decided here. */
  private gimmickPage(kind: 'tera' | 'dynamax' | 'gigantamax' | 'zmove', mon: PokemonInstance, x: { type?: string; item?: string; from?: string; move?: string; hp?: [number, number]; turns?: number; gmax?: string }): GimmickPage {
    const name = this.speciesName(mon);
    const cap = (t: string): string => t.charAt(0).toUpperCase() + t.slice(1);
    if (kind === 'tera') {
      const type = cap(x.type ?? 'normal');
      return {
        tag: `Tera Orb · Tera Type ${type}`,
        title: ['Terastallize'],
        facts: [`Now a ${type} type`, `${type} moves hit harder`, 'Old weaknesses are replaced', 'Stays until the battle ends'],
        line: `${name} Terastallized into the ${type} type!`,
        accent: 0x3fc8e8,
      };
    }
    if (kind === 'zmove') {
      return {
        tag: x.item ? `Z-Ring · ${x.item}` : 'Z-Ring',
        title: ['Z-Move'],
        facts: [...(x.from && x.move ? [`${x.from} becomes ${x.move}`] : []), 'One all-out hit', 'The Z-Ring rests after this'],
        line: `${name} unleashes its full-force Z-Move!`,
        accent: 0xffb300,
      };
    }
    const turns = x.turns ?? 3;
    return {
      tag: `Dynamax Band · ${turns} turn${turns === 1 ? '' : 's'}`,
      title: [kind === 'gigantamax' ? 'Gigantamax' : 'Dynamax'],
      facts: [...(x.hp && x.hp[1] !== x.hp[0] ? [`HP doubles: ${x.hp[0]} to ${x.hp[1]}`] : []), kind === 'gigantamax' && x.gmax ? `Its moves become G-Max ${x.gmax}'s` : 'Moves become Max Moves', `Lasts ${turns} turn${turns === 1 ? '' : 's'}`],
      line: kind === 'gigantamax' ? `${name} grew enormous! It Gigantamaxed.` : `${name} grew huge with Dynamax energy!`,
      accent: 0xff2d8a,
    };
  }

  private async gimmickBeat(b: Beat, recap?: string): Promise<void> {
    const back = this.hudAside();
    try {
      await this.playBeat(b, recap);
    } finally {
      back();
    }
  }

  private async playBeat(b: Beat, recap?: string): Promise<void> {
    let over = false;
    this.time.delayedCall(150, () => {
      // S257: when the player skips and Skip recap is on, a text line says what the cutscene showed.
      if (!over) this.advance = recap && services().session.settings.skipRecap ? () => { b.skip(); interactionLog.add(recap); showRecapBanner(this, recap, 2600, this.rx ? MESSAGE_Y - 34 : undefined); } : b.skip;
    });
    await b.done;
    over = true;
    this.advance = null;
  }

  /** Delta, Z, Spooky and regional forms get a tinted burst and a line from sceneEffects.json (presentation only). */
  private async formIntroBeat(mon: PokemonInstance): Promise<void> {
    const { content } = services().session;
    const intro = formIntro(getSpecies(content, mon.speciesId), this.speciesName(mon));
    if (!intro) return;
    await burstReveal(this, ENEMY_POS.x, ENEMY_POS.y - 80, intro.tint, this.motion).done;
    await this.say(intro.line);
  }

  /**
   * Shiny entrance (redesign pass 11): six stars circle in and collapse onto the foe, a glint runs across it, the
   * arena brightens for a beat, and a "SHINY" chip springs up and flies to its name plate, where it stays.
   */
  private async shinySparkle(): Promise<void> {
    playSfx(this, 'se.shiny');
    const v = this.enemySprite;
    const box = this.enemyBox;
    const level = this.clipLevel();
    const h = v instanceof Phaser.GameObjects.Sprite ? v.displayHeight * v.originY : 120;
    const mid = { x: v?.x ?? ENEMY_POS.x, y: (v?.y ?? ENEMY_POS.y) - h / 2 };
    const starKey = starPicture(this);
    const stars = starKey && level === 'full' ? Array.from({ length: 6 }, () => this.add.image(mid.x, mid.y, starKey).setScale(PICTURE_SCALE).setAlpha(0).setDepth(32)) : [];
    const parts = Object.fromEntries(stars.map((st, i) => [`star${i}`, { kind: 'free' as const, get: () => st }]));
    let chipFlight: Promise<void> = Promise.resolve();
    const run = playClip(this, shinyClip(mid, level), this.clipHost(parts, {
      cue: (name) => {
        if (name === 'glint' && v instanceof Phaser.GameObjects.Sprite) this.shinyGlint(v);
        if (name === 'chip' && box) chipFlight = this.shinyChip(box, mid, level);
      },
    }));
    await run.done;
    stars.forEach((st) => st.destroy());
    await chipFlight;
    await this.say(`It's a shiny ${this.speciesName(this.shown.enemy)}!`);
  }

  /** The shiny's glint: a white band sweeps across the sprite while the arena behind it brightens and settles. */
  private shinyGlint(v: Phaser.GameObjects.Sprite): void {
    const copy = this.add.sprite(v.x, v.y, v.texture.key, v.frame.name).setOrigin(v.originX, v.originY).setScale(v.scaleX, v.scaleY).setFlipX(v.flipX).setTintFill(0xffffff).setBlendMode(Phaser.BlendModes.ADD);
    if (v.parentContainer) v.parentContainer.addAt(copy, v.parentContainer.getIndex(v) + 1);
    else copy.setDepth(v.depth + 0.5);
    const band = { u: -0.3 };
    const w = copy.width;
    this.tweens.add({
      targets: band,
      u: 1.1,
      duration: 500,
      ease: 'Sine.easeInOut',
      onUpdate: () => copy.setCrop(Math.max(0, band.u * w), 0, w * 0.22, copy.height),
      onComplete: () => copy.destroy(),
    });
    const lit = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH * 1.4, GAME_HEIGHT * 1.4, 0xffffff, 0).setBlendMode(Phaser.BlendModes.ADD);
    this.field.addAt(lit, this.fieldBase);
    this.tweens.chain({ targets: lit, tweens: [{ alpha: 0.3, duration: 100 }, { alpha: 0, duration: 600 }], onComplete: () => lit.destroy() });
  }

  /** The "SHINY" chip springs up over the foe, then flies to the top of its name plate and stays on it. */
  private shinyChip(box: InfoBox, from: Point, level: ClipLevel): Promise<void> {
    box.shinyChip?.destroy();
    const key = shinyChipPicture(this);
    if (!key) return Promise.resolve();
    const c = box.container;
    const [px, py, pw] = box.spec ? box.spec.panel : [6, 2, 360];
    const local = { x: px! + pw! * 0.55, y: py! + 4 };
    // The plate may be drawn smaller than 1:1; the chip keeps the mockup's own size on screen.
    const k = Math.abs(c.scaleX) || 1;
    const size = PICTURE_SCALE / k;
    const chip = this.add.image(local.x, local.y, key).setScale(size);
    c.add(chip);
    box.shinyChip = chip;
    if (level !== 'full') return Promise.resolve();
    // It starts over the Pokémon (in the plate's own coordinates) at nothing and springs to twice its size.
    chip.setPosition((from.x - c.x) / k, (Math.max(40, from.y - 150) - c.y) / k).setScale(0);
    return new Promise((resolve) => {
      this.tweens.chain({
        targets: chip,
        tweens: [
          { scale: size * 2, duration: 200, ease: 'Back.easeOut', easeParams: [3.2] },
          { x: local.x, y: local.y, scale: size, delay: 500, duration: 300, ease: 'Cubic.easeInOut' },
        ],
        onComplete: () => {
          // The plate takes it with a little bump.
          if (c.active) this.tweens.chain({ targets: c, tweens: [{ scale: k * 1.04, duration: 50 }, { scale: k, duration: 250, ease: 'Elastic.easeOut' }] });
          resolve();
        },
      });
    });
  }

  /** Shows the right prompt for the current state: forced switch or the action menu. */
  /** Layers, motif and arena bed on top of the base track (catalog #126-130). Presentation only. */
  private startProceduralAudio(battle: BattleState): void {
    const { session } = services();
    const types = battle.trainer && isBossClass(battle.trainer.classId) ? session.content.species.get(currentEnemy(battle).speciesId)?.types : this.run.stage ? getTheme(session.content, this.run.stage.themeId).types : undefined;
    const lm = this.legendMusicOn();
    setAmbience(this, lm?.ambience ?? ambienceFor(types?.[0]));
    if (battle.trainer && (isBossClass(battle.trainer.classId) || battle.trainer.classId === 'rival')) playMotif(this, battle.trainer.leaderId ?? battle.trainer.classId);
    this.refreshMusicState();
    this.events.once('shutdown', () => {
      this.trainerActor = null;
      stopProceduralAudio();
      this.portrait = undefined;
    });
  }

  private refreshMusicState(): void {
    const battle = this.run.battle;
    if (!battle) return;
    const foe = currentEnemy(battle);
    const me = this.activeMon();
    const share = (m: PokemonInstance) => m.hp / Math.max(1, calcStats(services().session.content, m).hp);
    setRegionKey(this.legendMusicOn()?.key ?? regionIdentity(this.run.regionOrder[this.run.regionIndex]).key);
    setMusicState(this, musicState({
      boss: Boolean(battle.raid || battle.totem || (battle.trainer && isBossClass(battle.trainer.classId))),
      lastFoe: battle.enemyIndex >= battle.enemyTeam.length - 1 && battle.enemyTeam.length > 1,
      playerHpShare: share(me),
      enemyHpShare: share(foe),
    }));
  }

  private nextPrompt(): void {
    this.refreshMusicState();
    // Pidgey's Resolve: a watched CPU-versus-CPU fight. No menu is ever shown; every turn plays by itself.
    if (this.run.battle?.spectate) {
      void this.spectateStep();
      return;
    }
    if (!this.camBusy && !this.camPinned) this.restoreCamera(250); // a new turn always starts on the whole arena
    // A choice in the middle of the battle (core/greenneedle/ask.ts): the question comes before any command, Auto-Battle or not.
    const ask = askDue(services().session.content, this.run);
    if (ask) {
      this.showAskMenu(ask);
      return;
    }
    // After "Stop attacking." the turns pass by themselves.
    if (!this.duo && askPassing(this.run.battle)) {
      void this.act({ kind: 'idle' });
      return;
    }
    if (this.duo) {
      if (this.autoOn && !autoBattleProblem(this.run)) void this.runAuto();
      else if (this.run.battle?.needsSwitch) this.openPartyPicker(true);
      else {
        this.commands = [];
        this.promptSpot(0);
      }
      return;
    }
    if (this.run.battle?.needsSwitch) {
      if (this.autoOn && !autoBattleProblem(this.run)) void this.runAuto();
      else this.openPartyPicker(true);
      return;
    }
    // In the middle of a two-turn move or Thrash, the Pokémon carries on by itself.
    const forced = this.run.battle ? forcedMoveIndex(this.run.battle, this.run.party) : null;
    if (forced !== null) void this.act({ kind: 'move', index: forced });
    else if (this.autoOn && !autoBattleProblem(this.run)) void this.runAuto();
    else this.showRootMenu();
  }

  /** Double battles: asks for the command of the Pokémon in `spot` (or fills it in), then the next (core/battle/fieldMenu.ts: commandPlan). */
  private promptSpot(spot: number): void {
    const battle = this.run.battle!;
    const step = commandPlan({ battle, party: this.run.party })[spot];
    if (!step) {
      void this.act({ kind: 'double', commands: this.commands });
      return;
    }
    if (step.kind === 'skip') {
      this.commands[spot] = null;
      this.promptSpot(spot + 1);
    } else if (step.kind === 'forced') {
      this.commands[spot] = { action: { kind: 'move', index: step.index } };
      this.promptSpot(spot + 1);
    } else {
      this.cmdSpot = spot as Spot;
      this.showRootMenu();
    }
  }

  /** The spot before this one whose command the player chose (Back returns to it), or null. */
  private backSpot(): Spot | null {
    const battle = this.run.battle;
    if (!this.duo || !battle) return null;
    const plan = commandPlan({ battle, party: this.run.party });
    for (let s = this.cmdSpot - 1; s >= 0; s--) if (plan[s]?.kind === 'ask' && this.commands[s]) return s as Spot;
    return null;
  }

  /** A command is ready: in singles the turn starts; in doubles it is stored and the next spot is asked. */
  private submit(action: SlotCommand['action'], target?: SlotCommand['target']): void {
    if (!this.duo) {
      if (action.kind !== 'shift') void this.act(action);
      return;
    }
    this.commands[this.cmdSpot] = { action, ...(target ? { target } : {}) };
    this.promptSpot(this.cmdSpot + 1);
  }

  /** Double battles: which Pokémon the move is aimed at (foes, and the partner for moves meant for it). */
  private openTargetPicker(action: Exclude<PlayerAction, { kind: 'double' }>, move: Move): void {
    const battle = this.run.battle!;
    const view = { battle, party: this.run.party };
    // Foes in reach and partners for ally moves, with the smart-target arrow (ideas W1) on the foe this move hits hardest by type.
    // Triple battles name the spot too ("Wynaut (Left)"), since three of a kind can stand side by side.
    const where = (spot: number) => (this.duo?.size === 3 ? ` (${['Left', 'Centre', 'Right'][spot]})` : '');
    const choices = targetChoices(view, services().session.content, this.cmdSpot, move).map((c) => ({
      label: c.ally ? `${this.speciesName(c.mon)} (ally${this.duo?.size === 3 ? `, ${['left', 'centre', 'right'][c.target.spot]}` : ''})` : `${c.best ? '▶ ' : ''}${this.speciesName(c.mon)}${c.best ? ' (best)' : where(c.target.spot)}`,
      target: c.target,
      tint: c.ally ? AERO.sky : ROLE_RIMS.trainer,
    }));
    if (choices.length <= 1) {
      this.submit(action, choices[0]?.target);
      return;
    }
    this.clearMenus();
    // A reticle follows the highlighted foe (or the partner).
    const reticle = targetReticle(this, 0xffe070, this.motion);
    const aim = (i: number) => {
      const t = choices[i]!.target;
      const at = this.posOf(t.side, t.spot as Spot);
      reticle.aimAt(at.x, at.y - 50);
      this.rxAim = { x: at.x, y: at.y - 150 };
    };
    aim(0);
    this.reticle = reticle;
    // Triple battles: foes this move can't reach from here get a red tag (the mockup's "OUT OF REACH").
    if (this.duo?.size === 3) {
      for (const spot of spotsOf(battle)) {
        const foe = monAt(view, 'enemy', spot);
        if (!foe || foe.hp <= 0 || choices.some((c) => c.target.side === 'enemy' && c.target.spot === spot)) continue;
        const at = this.posOf('enemy', spot);
        const label = this.add.text(0, 0, 'OUT OF REACH', textStyle(13, '#ffffff', { shadow: undefined })).setOrigin(0.5);
        const pill = this.add.graphics().fillStyle(0xc02828, 0.92).fillRoundedRect(-label.width / 2 - 8, -11, label.width + 16, 22, 11);
        this.reachTags.push(this.add.container(at.x, at.y - 120, [pill, label]).setDepth(50));
      }
    }
    const far = this.duo?.size === 3 ? this.reachTags.length : 0;
    this.message.setText(`Use ${move.name} on which Pokémon?${far ? `\n(${far === 1 ? 'one foe is' : 'some foes are'} out of reach)` : ''}`);
    this.commandWindow.setVisible(true);
    this.menu = new Menu(this, {
      x: COMMAND_X + 24,
      y: MESSAGE_Y + 26,
      // New UI: the mock-up's target picker ends on a Back button (Esc does the same in both looks).
      options: [...choices.map((c) => ({ label: c.label })), ...(this.rx ? [{ label: 'Back' }] : [])],
      columns: 1,
      itemWidth: 340,
      itemHeight: 46,
      fontSize: 26,
      color: this.btnText,
      glass: { paint: this.skin?.pill, tints: [...choices.map((c) => mixColor(c.tint, 0x000000, 0.3)), ...(this.rx ? [0x303848] : [])], motion: this.motion },
      onFocus: (i) => { if (i < choices.length) aim(i); },
      onSelect: (i) => (i < choices.length ? this.submit(action, choices[i]!.target) : this.showMoveMenu()),
      onBack: () => this.showMoveMenu(),
    });
  }

  // ---------- pages, Auto-Battle and the info panels (spec §23, §32) ----------

  private get autoOn(): boolean {
    return services().session.settings.autoBattle;
  }

  /** Shows the tab strip for the page being viewed (null: the main choice menu). */
  private showTabs(page: BattlePage | null, where: TabsPlace = 'bar'): void {
    this.tabs.place(where, this.tabsAt.x, this.tabsAt.y);
    this.tabs.setPage(page);
    this.tabs.setAuto(this.autoOn && !autoBattleProblem(this.run), Boolean(autoBattleProblem(this.run)));
    this.tabs.show(true);
  }

  /** A short line at the top of the screen that fades by itself. */
  private flash(text: string): void {
    this.tweens.killTweensOf(this.note);
    this.note.setText(text).setAlpha(1);
    this.tweens.add({ targets: this.note, alpha: 0, delay: 2600, duration: 500 });
  }

  /** Jumps to a page (tab click, Q / E). Only while a page is up and the player is choosing. */
  private gotoPage(page: BattlePage): void {
    if (this.busy || this.autoRunning || !this.tabs.root.visible || this.advance) return;
    if (this.infoPanel) this.closePanel();
    if (page === this.tabs.current) return;
    if (page === 'attack') this.showMoveMenu();
    else if (page === 'party') this.openPartyPicker(false);
    else this.openBag();
  }

  /** The Auto tab / T key: turn Auto-Battle on (after saying what it costs) or back to manual. */
  private toggleAuto(): void {
    if (this.autoRunning) {
      this.autoCancel = true;
      return;
    }
    if (this.busy || !this.tabs.root.visible || this.advance) return;
    const problem = autoBattleProblem(this.run);
    if (this.autoOn) {
      this.setAuto(false);
      this.flash('Manual control: you choose every action again.');
      this.showTabs(this.tabs.current, this.tabs.current === 'party' || this.tabs.current === 'item' ? 'band' : 'bar');
      return;
    }
    if (problem) {
      this.flash(problem);
      return;
    }
    if (this.run.battle?.autoUsed) {
      this.setAuto(true);
      this.nextPrompt();
      return;
    }
    this.askAuto();
  }

  private setAuto(on: boolean): void {
    const { session } = services();
    session.saveSettings({ ...session.settings, autoBattle: on });
  }

  /** Says what Auto-Battle costs before it starts, and waits for a yes. */
  private askAuto(): void {
    const exp = Math.round((1 - services().session.content.balance.difficulty.autoBattleXp) * 100);
    this.clearMenus();
    this.message.setText(`Auto-Battle: your Pokémon choose their own actions from their nature, mood and training.\nEXP from this battle drops by ${exp}%, even if you take back control.`);
    this.commandWindow.setVisible(true);
    this.menu = new Menu(this, {
      x: COMMAND_X + 24,
      y: MESSAGE_Y + 40,
      options: [{ label: 'Turn on' }, { label: 'Not now' }],
      columns: 2,
      itemWidth: 160,
      itemHeight: 46,
      fontSize: 26,
      color: this.btnText,
      glass: { paint: this.skin?.pill, tints: [0x9a2cc8, 0x2c3a58], motion: this.motion },
      onSelect: (i) => {
        if (i === 0) {
          this.setAuto(true);
          this.nextPrompt();
        } else this.showRootMenu();
      },
      onBack: () => this.showRootMenu(),
    });
    this.showTabs(null);
  }

  /** The Auto-Battle turn: shows what the Pokémon will do (and why), waits a beat (Back takes control), then plays it. */
  private autoPrompted = '';

  private async runAuto(): Promise<void> {
    const { session } = services();
    const pick = chooseAutoAction(session.content, this.run, session.settings.autoRules);
    if (!pick) {
      this.showRootMenu();
      return;
    }
    const stop = autoInterruption(this.activeMon().hp, maxHp(session.content, this.activeMon()), Boolean(this.run.battle?.trainer && isBossClass(this.run.battle.trainer.classId)), Boolean(this.run.battle?.raid));
    if (stop && this.autoPrompted !== this.activeMon().uid + stop) {
      // Interruption prompt: pause once for this moment; pressing Auto again carries on.
      this.autoPrompted = this.activeMon().uid + stop;
      this.setAuto(false);
      this.flash(`Auto-Battle paused: ${stop}`);
      this.showRootMenu();
      return;
    }
    this.autoRunning = true;
    this.autoCancel = false;
    this.clearMenus();
    this.showTabs(null);
    const mon = this.activeMon();
    const style = autoProfile(session.content, this.run, mon).style;
    this.message.setText(`AUTO · ${style}\n${pick.intent}${session.settings.autoExplain ? `\n${pick.reason}` : ''}`);
    this.flash(`Auto-Battle${this.run.battle?.autoUsed ? '' : ` · EXP -${Math.round((1 - session.content.balance.difficulty.autoBattleXp) * 100)}% this battle`} · Esc: take control`);
    await new Promise<void>((done) => {
      const timer = this.time.delayedCall(AUTO_PICK_MS, () => done());
      const poll = this.time.addEvent({ delay: 60, loop: true, callback: () => {
        if (this.autoCancel) {
          timer.remove(false);
          poll.remove(false);
          done();
        }
      } });
      this.time.delayedCall(AUTO_PICK_MS + 50, () => poll.remove(false));
    });
    this.autoRunning = false;
    if (this.autoCancel) {
      this.autoCancel = false;
      this.setAuto(false);
      this.flash('Manual control: you choose every action again.');
      if (this.duo) {
        this.commands = [];
        this.promptSpot(0);
      } else this.showRootMenu();
      return;
    }
    await this.act(pick.action, true);
  }

  /**
   * Overhaul slice 9: the first-time Hyper/Overdrive explanation. Normal battle progress and every battle action wait
   * (the event loop awaits this), Esc and held keys do nothing, and the Continue button only works after a short read
   * lock so rapid clicking can't skip it. Each explanation shows once (profile.hyperExplained); later moments use the short banner.
   */
  private async explainHyper(defId: string): Promise<void> {
    const { session } = services();
    const def = session.content.story.definitions.find((d) => d.id === defId);
    const x = def ? explainMoment(session.content, def) : null;
    if (!x || unseenKeys(session.profile.hyperExplained, x).length === 0) return;
    // The HUD (New look layer, Old look boxes and bar) would cover this panel, so it steps aside until Continue.
    const hudBack = this.hudAside();
    await new Promise<void>((resolve) => {
      const dim = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.7).setOrigin(0).setInteractive();
      const panel = drawGlass(this, 90, 36, GAME_WIDTH - 180, GAME_HEIGHT - 72, { radius: 22 });
      const color = x.family === 'overdrive' ? '#ffb070' : '#8fd8ff';
      const head = this.add.text(GAME_WIDTH / 2, 62, `${FAMILY_NAMES[x.family].toUpperCase()}: ${x.title}`, textStyle(30, color)).setOrigin(0.5);
      const body = this.add.text(116, 96, '', textStyle(17, COLORS.textLight, { lineSpacing: 4, wordWrap: { width: GAME_WIDTH - 232 } }));
      fitBlock(body, GAME_WIDTH - 232, GAME_HEIGHT - 96 - 90, explanationText(x));
      const button = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 52, 'Read on...', textStyle(26, COLORS.textMuted)).setOrigin(0.5).setName('hyper-continue').setInteractive({ useHandCursor: true });
      const root = this.add.container(0, 0, [dim, panel, head, body, button]).setDepth(160).setName('hyper-explain');
      let ready = false;
      this.time.delayedCall(EXPLAIN_LOCK_MS, () => {
        ready = true;
        button.setText('Continue  (Enter)').setColor(COLORS.gold);
      });
      const finish = (): void => {
        if (!ready) return;
        ready = false;
        this.explainWait = null;
        root.destroy();
        hudBack();
        session.markHyperExplained(x.keys);
        resolve();
      };
      this.explainWait = (action) => {
        if (action === 'confirm') finish();
      };
      button.on('pointerdown', finish);
    });
  }

  /** A glass panel across the bar with up to three text columns (battle Info, move details, party summary). */
  private openPanel(columns: { head: string; text: string }[], onClose?: () => void, tip?: BattlePanel): void {
    this.panelClose = onClose ?? null;
    // New UI: the same words as the mock-ups' windows (one move's details as its tooltip).
    this.rxPanels = tip ? [tip] : columns.map((c) => panelOf(c.head, c.text));
    this.rxPanelAt = tip ? 'tip' : 'left';
    this.infoPanel?.destroy();
    const w = (GAME_WIDTH - 56) / columns.length;
    // The panel grows upwards over the arena when a column has more lines than the bar holds (Info stays readable).
    const texts = columns.map((c) => this.add.text(0, 0, c.text, textStyle(15, COLORS.textLight, { wordWrap: { width: w - 20 }, lineSpacing: 3 })));
    const need = Math.max(...texts.map((t) => t.height)) + 70;
    const top = Math.max(60, Math.min(MESSAGE_Y + 6, GAME_HEIGHT - 6 - need));
    // An opaque backing, so the menu underneath never shows through the text.
    const backing = this.add.graphics().fillStyle(0x061528, 1).fillRoundedRect(8, top, GAME_WIDTH - 16, GAME_HEIGHT - top - 6, 18);
    const items: Phaser.GameObjects.GameObject[] = [backing, drawGlass(this, 8, top, GAME_WIDTH - 16, GAME_HEIGHT - top - 6, { tint: AERO.glassLow, rim: AERO.sky, radius: 18 })];
    columns.forEach((c, i) => {
      const x = 24 + i * w;
      items.push(this.add.text(x, top + 24, c.head, textStyle(16, COLORS.gold)));
      items.push(texts[i]!.setPosition(x, top + 46));
    });
    items.push(this.add.text(GAME_WIDTH - 20, top + 6, 'Esc / I: close', textStyle(13, COLORS.textMuted)).setOrigin(1, 0));
    this.infoPanel = this.add.container(0, 0, items).setDepth(125);
    bounceIn(this, this.infoPanel, this.motion);
  }

  private closePanel(): void {
    this.infoPanel?.destroy();
    this.infoPanel = null;
    const done = this.panelClose;
    this.panelClose = null;
    done?.();
  }

  /** New UI: one move of the Pokémon choosing, as the mock-ups' tooltip (the I key and a rest of the pointer both show it). */
  private moveTip(i: number): BattlePanel | null {
    const content = services().session.content;
    const slot = this.activeMon().moves[i];
    const move = slot ? content.moves.get(slot.id) : undefined;
    if (!move) return null;
    const foeTypes = getSpecies(content, this.shown.enemy.speciesId).types as TypeName[];
    const hint = move.category === 'status' ? null : effectivenessWord(typeEffectiveness(content.typeChart, move.type as TypeName, foeTypes));
    return moveTipOf(slot, hint ? [[`Against ${this.speciesName(this.shown.enemy)}`, hint.text]] : [], this.transformChoice ? [`Special action ready: ${this.transformChoice.kind}`] : []);
  }

  /** New UI: a Pokémon's Ability card. A foe's Ability shows only once it has come into play; a hidden foe shows nothing. */
  private rxCard(mon: PokemonInstance, own: boolean): BattlePanel {
    // With several Pokémon on the field the card says whose it is.
    const who = this.duo ? this.speciesName(mon) : undefined;
    if (own) return ownAbilityCard(mon, who);
    if (this.foeHidden(mon)) return { head: '???', chips: [], facts: [], lines: ['This foe has not shown itself yet.'] };
    const id = this.foeReveals.get(mon.uid)?.ability;
    const ability = id ? services().session.content.abilities.get(id) : undefined;
    return { head: ability ? ability.name : 'Ability not seen yet', ...(who ? { tag: who } : {}), chips: [], facts: [seenFact(mon.speciesId)], lines: [ability ? ability.description : 'It shows here once it comes into play.'] };
  }

  /** I key / the ⓘ tab: details of the focused move on the Attack page, otherwise what is going on in the battle. */
  private toggleInfo(): void {
    if (this.infoPanel) {
      this.closePanel();
      return;
    }
    if (this.busy || this.autoRunning || !this.tabs.root.visible || this.advance) return;
    const content = services().session.content;
    if (this.tabs.current === 'attack' && this.menu) {
      const mon = this.activeMon();
      const slot = mon.moves[this.focusedMove];
      const move = slot ? content.moves.get(slot.id) : undefined;
      if (move) {
        const foeTypes = getSpecies(content, this.shown.enemy.speciesId).types as TypeName[];
        const hint = move.category === 'status' ? null : effectivenessWord(typeEffectiveness(content.typeChart, move.type as TypeName, foeTypes));
        const flags = moveFlagLabels(move);
        const power = move.power ? (slot!.hyper ? `${move.power + content.balance.hyperMove.powerBonus} (Hyper +${content.balance.hyperMove.powerBonus})` : move.power) : fixedDamageLabel(move.effects.fixedDamage);
        this.openPanel([
          { head: move.name, text: `${move.type.toUpperCase()} · ${move.category}\nPower ${power} · Accuracy ${move.accuracy ?? '—'} · PP ${slot!.pp}/${maxPp(content, slot!)}\nPriority ${move.priority > 0 ? '+' : ''}${move.priority}${hint ? `\nAgainst ${this.speciesName(this.shown.enemy)}: ${hint.text}` : ''}` },
          { head: 'What it does', text: moveFullDescription(move) },
          { head: 'Notes', text: `${flags.length ? flags.join('\n') : 'No special properties.'}${this.transformChoice ? `\nSpecial action ready: ${this.transformChoice.kind}` : ''}` },
        ], undefined, this.moveTip(this.focusedMove) ?? undefined);
        return;
      }
    }
    const c = battleConditions(content, this.run, this.foeReveals.get(currentEnemy(this.run.battle!).uid));
    this.openPanel([
      { head: 'Battlefield', text: c.field.join('\n') },
      { head: 'Your Pokémon', text: c.yours.join('\n') },
      { head: 'Opposing Pokémon', text: c.foe.join('\n') },
      ...(c.moves.length ? [{ head: 'Your moves vs the foe', text: c.moves.join('\n') }] : []),
    ]);
  }

  /** Party page: what the selected Pokémon is like and what can be done with it (send out, summary, Auto-Battle stance). */
  private showPartyActions(i: number): void {
    const { session } = services();
    const content = session.content;
    const run = this.run;
    const mon = run.party[i]!;
    const problem = switchProblem(this.battleCtx(), i);
    const profile = autoProfile(content, run, mon);
    const { stance, taught } = stanceOf(run, mon.uid);
    const stats = calcStats(content, mon);
    this.clearMenus();
    this.message.setText(`${this.speciesName(mon)} Lv.${mon.level}  HP ${mon.hp}/${stats.hp}${mon.status ? `  ${mon.status.id.toUpperCase()}` : ''}\n${profile.style} · Stance: ${STANCE_INFO[stance].name}${taught ? ' (taught)' : ''}${problem ? `\n${problem}` : ''}`);
    this.commandWindow.setVisible(true);
    this.menu = new Menu(this, {
      x: COMMAND_X + 20,
      y: MESSAGE_Y + 34,
      options: [{ label: 'Send out', disabled: problem !== null }, { label: 'Summary' }, { label: `Stance: ${STANCE_INFO[stance].name}` }, { label: 'Back' }],
      columns: 2,
      itemWidth: 170,
      itemHeight: 38,
      fontSize: 22,
      color: this.btnText,
      glass: { paint: this.skin?.pill, tints: [0x1f9a52, 0x2c6ad8, 0x9a2cc8, 0x2c3a58], motion: this.motion },
      onSelect: (n) => {
        if (n === 0) void this.act({ kind: 'switch', partyIndex: i });
        else if (n === 1) this.showPartySummary(i);
        else if (n === 2) {
          session.teachStance(mon.uid, STANCES[(STANCES.indexOf(stance) + 1) % STANCES.length]!);
          this.showPartyActions(i);
        } else this.openPartyPicker(false);
      },
      onFocus: () => undefined,
      onBack: () => this.openPartyPicker(false),
    });
    this.showTabs('party');
  }

  /** A Pokémon's summary during battle: stats, moves, held items and how it fights. */
  private showPartySummary(i: number): void {
    const content = services().session.content;
    const run = this.run;
    const mon = run.party[i]!;
    const species = getSpecies(content, mon.speciesId);
    const stats = calcStats(content, mon);
    const profile = autoProfile(content, run, mon);
    const held = Object.entries(mon.held ?? {}).map(([id, n]) => `${content.items.get(id)?.name ?? id}${n > 1 ? ` ×${n}` : ''}`);
    const ability = abilityOf(content, mon);
    const moves = mon.moves.map((m) => {
      const d = content.moves.get(m.id);
      return d ? `${d.name} (${d.type}, ${d.category}) ${m.pp}/${maxPp(content, m)}` : m.id;
    });
    this.openPanel(
      [
        { head: `${species.name} Lv.${mon.level}`, text: `${species.types.join(' / ')}${mon.nature ? ` · ${mon.nature}` : ''}\nHP ${mon.hp}/${stats.hp}  Atk ${stats.atk}  Def ${stats.def}\nSpA ${stats.spa}  SpD ${stats.spd}  Spe ${stats.spe}\n${ability ? `Ability: ${content.abilities.get(ability)?.name ?? ability}${mon.gn?.includes('ability-star') ? ' ★' : ''}` : ''}` },
        { head: 'Moves', text: moves.join('\n') },
        { head: 'How it fights', text: `${profile.style}\n${profile.notes.slice(0, 3).join('\n')}${held.length ? `\nHolding: ${held.join(', ')}` : ''}` },
      ],
      () => this.showPartyActions(i),
    );
  }

  // ---------- menus ----------

  private showRootMenu(): void {
    this.clearMenus();
    this.rxExp.clear();
    this.rxLevel = null;
    const content = services().session.content;
    // Transformations: a fourth option that cycles off -> Mega -> Tera -> Z-Move -> Dynamax -> off. (Gigantamax happens by itself.)
    const ctx = this.battleCtx();
    // In a double battle either Pokémon can transform (the context looks at the one being commanded).
    const tera = teraOption(ctx);
    const zMove = zMoveOptions(ctx).some((z) => z !== null);
    const choices: TransformRequest[] = [
      ...(megaOption(ctx) ? [{ kind: 'mega' as const }] : []),
      ...(tera ? [{ kind: 'tera' as const }] : []),
      ...(zMove ? [{ kind: 'zmove' as const }] : []),
      ...(canDynamax(ctx) ? [{ kind: 'dynamax' as const }] : []),
    ];
    const same = (a: TransformRequest | null, b: TransformRequest) => a?.kind === b.kind;
    if (!choices.some((c) => same(this.transformChoice, c))) this.transformChoice = null;
    const choice = this.transformChoice;
    const ready =
      choice?.kind === 'tera'
          ? ` It will Terastallize into the ${tera![0]!.toUpperCase()}${tera!.slice(1)} type!`
          : choice?.kind === 'zmove'
            ? ' Pick a move to unleash as a Z-Move!'
            : choice?.kind === 'dynamax'
              ? ' It will Dynamax!'
              : choice?.kind === 'mega'
                ? ' It will Mega Evolve!'
                : '';
    // Boss intent (#117): bosses, raids and totems telegraph the move they value most.
    // Mentor lesson Foe Move Preview: on turn one the foe's chosen move is shown instead.
    const intent = this.run.battle && !this.run.battle.doubles ? (foePreviewIntent(content, this.run.battle) ?? enemyIntent(content, this.run.battle, this.activeMon(), this.run.party) ?? trainerTaunt(content, this.run.battle, this.activeMon(), this.run.party)) : null;
    // R5 the mentor's lesson: "look at the one that's waiting" (the enemy Pokémon that comes in next, for the rest of the region).
    const waiting = this.run.battle ? nextSwitchLine(content, this.run, this.run.battle) : null;
    const battleNow = this.run.battle!;
    const canRally = !this.duo && rallyProblem(content, battleNow) === null;
    if (!canRally) this.rallyChoice = false;
    const shadow = this.activeMon().shadow;
    // S7: the Resolve spark (a banked Impossible Feat). Prompt mode adds a "Memory stirs" button that arms it.
    const featV2 = this.run.story.v2;
    const featReady = !this.duo && featCharged(this.run) && featV2?.heartbond.partner === this.activeMon().uid;
    const featLine = featReady ? (featV2!.feats.armed ? 'Memory stirs: the Feat is armed.\n' : 'Memory stirs: a Feat is charged.\n') : '';
    const coopRaid = this.run.battle?.raid?.coop ? coopOwner(this.run.battle.raid, this.activeMon().uid) + 1 : 0;
    // A Shadow's preview adds lines: shrink the text so the box never clips (restored for every other prompt).
    this.msgBaseSize ??= String(this.message.style.fontSize);
    const preview = shadow ? shadowPreviewLine((id) => content.moves.get(id)?.name ?? id, this.activeMon(), battleNow.turn, this.run.rng.battle, heartStage(content, shadow.heart)) : null;
    // New UI: the Shadow line has its own window over the text box (the mock-up's), so the prompt keeps its size and words.
    this.rxShadow = this.rx ? shadowLines(preview) : null;
    this.message.setFontSize(shadow && !this.rx ? '20px' : this.msgBaseSize);
    // New UI: a foe's variant ring is pointed out once, at the first prompt it is on the field for.
    const ringed = this.rx && !this.duo && battleNow.extra?.variants?.[this.shown.enemy.uid] ? this.shown.enemy.uid : null;
    this.rxRing = ringed && !this.rxRingTold.has(ringed) ? ringed : null;
    if (ringed) this.rxRingTold.add(ringed);
    this.message.setText(`${coopRaid ? `PLAYER ${coopRaid}: you're up! Pass the controller.\n` : ''}${intent ? `${intent.text}\n` : ''}${waiting ? `${waiting}\n` : ''}${this.rallyChoice ? 'Rally ON: your next attack is a Surge Strike!\n' : ''}${featLine}${preview && !this.rx ? `${preview}\n` : ''}${this.pilotTag(this.activeMon())}What will ${this.speciesName(this.activeMon())} do?${ready}`);
    const options = [{ label: 'Fight' }, { label: 'Bag' }, { label: 'Pokémon' }];
    const label = (c: TransformRequest) => ({ tera: 'Tera', zmove: 'Z', dynamax: 'Max', mega: 'Mega' })[c.kind];
    const onLabel = (c: TransformRequest) => ({ tera: 'Tera', zmove: 'Z-Move', dynamax: 'Dynamax', mega: 'Mega Evolution' })[c.kind];
    const kinds = [...new Set(choices.map(label))];
    if (choices.length > 0) options.push({ label: choice ? `${onLabel(choice)}: ON` : `${kinds.join('/')}: OFF` });
    // Raid cheers (Raid Battles pack) sit after the transformation toggle.
    const raid = this.run.battle?.raid;
    const cheerAt = raid && raid.cheersLeft > 0 && !this.duo ? options.length : -1;
    if (cheerAt >= 0) options.push({ label: `Cheer ×${raid!.coop ? raid!.coop.cheers[coopOwner(raid!, this.activeMon().uid)] : raid!.cheersLeft}` });
    // S397 Boss Weak Spots: choose where to aim (the exposed zone takes the bonus).
    // Greenneedle gn.61: each helper from the Final Reunion, once ("[Name]!").
    const helperAt = options.length;
    const helpers = this.duo ? [] : helperButtons(this.run.battle!);
    for (const h of helpers) options.push({ label: `${h.name}!` });
    const aimAt = raid && !this.duo && raidDef(content, raid).modifiers.weakSpots ? options.length : -1;
    if (aimAt >= 0) options.push({ label: `Aim: ${(raid!.aim ?? 'auto').toUpperCase()}` });
    const rallyAt = canRally ? options.length : -1;
    if (canRally) options.push({ label: this.rallyChoice ? 'Rally: ON' : 'Rally: OFF' });
    const featAt = featReady && featV2!.dramatic === 'prompt' && !featV2!.feats.armed ? options.length : -1;
    if (featAt >= 0) options.push({ label: 'Memory stirs' });
    // Ideas W1: a surrender deal, smashing the arena, the Pokédex scan and the item hotbar.
    const foeNow = currentEnemy(battleNow);
    const stake = foeStake(content, battleNow);
    const dealAt = (!this.duo || this.cmdSpot === 0) && dealOffer(content, battleNow, stake.hp, stake.max) ? options.length : -1;
    if (dealAt >= 0) options.push({ label: 'Deal?' });
    const predictAt = !this.duo && battleNow.storyEffects.includes('ferris-ask') ? options.length : -1;
    if (predictAt >= 0) options.push({ label: 'Predict' });
    // Triple battles: an edge Pokémon can Shift to the centre (it uses the turn and goes before any move).
    const shiftAt = this.duo?.size === 3 && shiftOptionProblem(battleNow, this.cmdSpot, this.commands) === null ? options.length : -1;
    if (shiftAt >= 0) options.push({ label: 'Shift' });
    const smashAt = battleNow.arena && !battleNow.arena.spent && !this.commands.some((c) => c?.action.kind === 'arena') ? options.length : -1;
    if (smashAt >= 0) options.push({ label: `Smash ${battleNow.arena!.kind}` });
    const scanAt = services().session.settings.skillPrompts && !battleNow.scanned && !battleNow.raid ? options.length : -1;
    if (scanAt >= 0) options.push({ label: 'Scan' });
    const hotbar = services().session.settings.hotbar.filter((id) => (this.run.inventory[id] ?? 0) > 0 && content.items.get(id) && content.items.get(id)!.target !== 'party' && content.items.get(id)!.target !== 'fainted' && itemProblem(this.battleCtx(), id) === null).slice(0, 4);
    const hotbarAt = options.length;
    for (const id of hotbar) options.push({ label: `Quick: ${content.items.get(id)!.name}` });
    // Beta 0.5 (M4): Mentor's Last Resort, once per battle, when a protégé at half HP has its mentor in the party.
    const lastResortOffered = lastResortOffer(content, this.run, this.activeMon());
    const lastResortAt = lastResortOffered ? options.length : -1;
    if (lastResortAt >= 0) options.push({ label: "Mentor ♥" });
    // Greenneedle gn.15: the fifth Mankey only stands there: "Wait." lets the turn pass without an attack.
    const waitAt = !this.duo && waitOffered(this.run.battle) ? options.length : -1;
    if (waitAt >= 0) options.push({ label: 'Wait.' });
    // A new button an event fight adds ("Give it the crystals.", "Stop attacking."): core/greenneedle/ask.ts.
    const askBtns = this.duo ? [] : askButtons(content, this.run);
    const askAt = options.length;
    for (const b of askBtns) options.push({ label: b.label });
    // Beta 0.7 L3: the Time Keeper's rewind (once per stage, up to 5 turns back).
    const rewindMax = this.duo ? 0 : rewindTurnsAvailable(content, this.run);
    const rewindAt = rewindMax > 0 ? options.length : -1;
    if (rewindAt >= 0) options.push({ label: 'Rewind' });
    // Catalog Overhaul (legends row B): The Renegade's Reverse Side, once per stage, out of a battle that is not a boss's.
    const reverseAt = (!this.duo || this.cmdSpot === 0) && reverseSideProblem(this.run) === null ? options.length : -1;
    if (reverseAt >= 0) options.push({ label: 'Reverse Side' });
    // Lugia's blessing: the Calm, once per stage (single battles; it does not take the turn).
    const calmAt = !this.duo && calmProblem(this.run) === null ? options.length : -1;
    if (calmAt >= 0) options.push({ label: 'Calm' });
    // A combined style (Wii channel grid) puts the moves in place of Fight: picking one opens the move menu and uses it.
    const combined = this.skin?.layout.combined && !this.duo ? this.combinedMoves() : [];
    const k = combined.length;
    if (k > 0) options.splice(0, 1, ...combined);
    if (this.skin && this.specOf(this.skin.layout.root, options.length, k).upper) for (const o of options) o.label = o.label.toUpperCase();
    this.commandWindow.setVisible(true);
    this.menu = new Menu(this, {
      x: COMMAND_X + 24,
      y: MESSAGE_Y + 26,
      options,
      columns: options.length > 4 ? 3 : 2,
      itemWidth: options.length > 4 ? 114 : 170,
      itemHeight: options.length > 4 ? 36 : 50,
      fontSize: options.length > 4 ? 20 : 30,
      ...(this.skin ? this.menuSpec(this.skin.layout.root, options.length, k) : {}),
      // An event's own button has a whole sentence on it ("Give it the crystals."): the canvas menu goes to one wide column so it is not cut short.
      ...(askBtns.length > 0 && options.length <= 4 ? { columns: 1, itemWidth: 320, itemHeight: 32, fontSize: 18, y: MESSAGE_Y + 8 } : {}),
      color: this.btnText,
      // Wii-style glossy buttons: Fight red, Bag gold, Pokémon green, transformations neon.
      glass: { paint: this.skin?.pill, tints: k > 0 ? [...combined.map((m) => m.tint), ...(this.skin!.rootTints ?? []).slice(1)] : this.skin?.rootTints ?? [0xc8303c, 0xc08a10, 0x1f9a52, 0x9a2cc8, 0x2c8ad8, 0x2cb8c8, 0xd8a020], motion: this.motion },
      onSelect: (pick) => {
        if (pick < k) {
          this.showMoveMenu();
          if (this.menu && this.menu.optionCount() === k) {
            this.menu.focus(pick, false);
            this.menu.confirm();
          }
          return;
        }
        const i = k > 0 ? pick - k + 1 : pick;
        if (i === predictAt) this.showPredictMenu();
        else if (i === dealAt) this.showDealMenu();
        else if (i === aimAt) {
          const r = this.run.battle!.raid!;
          r.aim = r.aim === null ? 'body' : r.aim === 'body' ? 'core' : null;
          this.updateHeader();
          this.showRootMenu();
        } else if (i === smashAt) this.submit({ kind: 'arena' });
        else if (i === shiftAt) this.submit({ kind: 'shift' });
        else if (i === scanAt) void this.scanFoe();
        else if (i === waitAt) this.submit({ kind: 'idle' });
        else if (i >= askAt && i < askAt + askBtns.length) {
          const view = askOf(content, this.run, askBtns[i - askAt]!.id);
          if (!view) this.showRootMenu();
          else if (askBtns[i - askAt]!.direct) void this.act({ kind: 'answer', ask: view.id, option: view.options[0]!.index });
          else this.showAskMenu(view, true);
        }
        else if (i === rewindAt) this.showRewindMenu(rewindMax);
        else if (i === reverseAt) void this.stepToReverseSide();
        else if (i === calmAt) void this.callCalm();
        else if (i === lastResortAt) {
          void this.playLastResort();
        } else if (i >= hotbarAt && i < hotbarAt + hotbar.length) this.submit({ kind: 'item', itemId: hotbar[i - hotbarAt]! });
        else if (i === rallyAt) {
          this.rallyChoice = !this.rallyChoice;
          this.showRootMenu();
        } else if (i === featAt) {
          armFeat(this.run);
          this.showRootMenu();
        } else if (helpers.length > 0 && i >= helperAt && i < helperAt + helpers.length) this.submit({ kind: 'helper', slot: helpers[i - helperAt]!.slot });
        else if (i === cheerAt) this.showCheerMenu();
        else if (i === 0) this.showMoveMenu();
        else if (i === 1) this.openBag();
        else if (i === 2) this.openPartyPicker(false);
        else {
          const at = choices.findIndex((c) => same(this.transformChoice, c));
          const next = choices[at + 1] ?? null;
          // Ideas W1 gesture trigger: with skill prompts on, switching a transformation ON takes a quick double-tap, with a flashy confirm.
          if (next && services().session.settings.skillPrompts && this.time.now - this.lastTransformTap > 700) {
            this.lastTransformTap = this.time.now;
            this.message.setText(`Tap again to confirm ${onLabel(next)}!`);
            return;
          }
          this.transformChoice = next;
          if (next && this.motion !== 'off') this.cameras.main.flash(180, 255, 240, 160);
          this.showRootMenu();
        }
      },
      // Double and triple battles: back goes to the menu of the last Pokémon you gave a command to.
      onBack: this.backSpot() !== null ? () => this.promptSpot(this.backSpot()!) : undefined,
    });
    this.showTabs(null);
  }

  /** Mentor's Last Resort (Beta 0.5 §2.4): the lend happens first (state), then the mentor scene plays over it (presentation only). */
  private async playLastResort(): Promise<void> {
    const content = services().session.content;
    const mon = this.activeMon();
    const offer = lastResortOffer(content, this.run, mon);
    if (!offer) return;
    const mentor = this.run.party.find((m) => m.uid === offer.mentorUid)!;
    const lines = useLastResort(content, this.run, mon).map((e) => (e.type === 'spectacle' ? e.text : ''));
    this.clearMenus();
    this.message.setVisible(true);
    this.message.setText(lines[0] ?? '');
    const spec = mentorMoment('mentorAssist');
    const plan = planMoment(spec, { reduceMotion: this.motion === 'reduced', disableAnimations: this.motion === 'off', seen: new Set() });
    const ms = content.species.get(mentor.speciesId)!;
    const ps = content.species.get(mon.speciesId)!;
    const move = content.moves.get(offer.moveId)!;
    try {
      // New UI: the mentor's help is the mock-ups' cutscene card, the mentor beside the Pokémon it helps.
      if (this.rx) {
        const art = (m: PokemonInstance): Art | null => { const f = monFile(this, m.speciesId, 'front', !!m.shiny); return f ? { file: f, atlas: true } : null; };
        await playCutMoment(this, plan, { name: ms.name, role: 'Mentor', line: `${ms.name} lends ${ps.name} ${move.name}.`, cast: art(mentor), mon: art(mon), backdrop: null });
      } else await playMoment(this, spec, plan, {
        title: "Mentor's help",
        subtitle: `${ms.name} lends ${ps.name} ${move.name}`,
        inner: () => this.playBeat(mentorScene(this, { mode: 'assist', makeMentor: (x, y) => pokemonVisual(this, ms, 'front', x, y, PIXEL_SCALE * 1.4, mentor.shiny), makeProte: (x, y) => pokemonVisual(this, ps, 'front', x, y, PIXEL_SCALE * 1.4, mon.shiny), caption: lines[1] ?? '', speed: 1 / animationTimeScale(services().session.settings) })),
      });
    } catch {
      /* presentation failure never corrupts the battle */
    }
    this.message.setText(lines.slice(1).join('\n'));
    this.time.delayedCall(this.motion === 'off' ? 300 : 900, () => this.showMoveMenu());
  }

  /** The three raid cheers: Offense, Defense, Healing (each costs one of three cheers and the turn). */
  /** Lugia's Calm: clears weather, terrain and stat changes (core/blessings callCalm), then the screen redraws from the run. */
  private async callCalm(): Promise<void> {
    this.menu?.destroy();
    this.menu = null;
    const message = services().session.callCalm();
    if (!message) return this.showRootMenu();
    await this.say(message);
    this.scene.start(sceneForRun(services().session.run!));
  }

  /** The Renegade's Reverse Side: the battle ends with nothing won or lost, and the map shows the node's other side. */
  private async stepToReverseSide(): Promise<void> {
    this.menu?.destroy();
    this.menu = null;
    const message = services().session.reverseSide();
    if (!message) return this.showRootMenu();
    await this.say(message);
    await exitWipe(this, this.motion, this.wipeMask());
    this.scene.start(sceneForRun(services().session.run!));
  }

  /** L3 Rewinds: pick how many turns to go back (the state comes back exactly; the turns then play out afresh). */
  private showRewindMenu(most: number): void {
    this.clearMenus();
    this.message.setText('The hourglass turns... How far back? (Once this stage.)');
    const options = Array.from({ length: most }, (_, i) => ({ label: `${i + 1} turn${i ? 's' : ''}` }));
    this.menu = new Menu(this, {
      x: COMMAND_X + 24,
      y: MESSAGE_Y + 26,
      options,
      columns: options.length > 4 ? 3 : 2,
      itemWidth: options.length > 4 ? 114 : 170,
      itemHeight: options.length > 4 ? 36 : 50,
      fontSize: options.length > 4 ? 20 : 26,
      color: this.btnText,
      glass: { paint: this.skin?.pill, tints: options.map(() => 0x2c6ad8), motion: this.motion },
      onSelect: (i) => {
        if (!services().session.rewindBattle(i + 1)) return this.showRootMenu();
        this.clearMenus();
        void this.say(`Time bends... the battle goes back ${i + 1} turn${i ? 's' : ''}.`).then(() => this.scene.start(sceneForRun(services().session.run!)));
      },
      onBack: () => this.showRootMenu(),
    });
  }

  private showCheerMenu(): void {
    const battle = this.run.battle!;
    const content = services().session.content;
    const cheers = [
      { cheer: 'offense', label: 'Go all-out!', tint: 0xc8303c },
      { cheer: 'defense', label: 'Hang tough!', tint: 0x2c6ad8 },
      { cheer: 'healing', label: 'Heal up!', tint: 0x1f9a52 },
      { cheer: 'counter', label: 'Turn the tables!', tint: 0x9a2cc8 },
    ] as const;
    this.clearMenus();
    const blocked = cheers.map((c) => cheerProblem(content, battle, c.cheer, this.run.party[battle.activeIndex]?.uid));
    this.message.setText(blocked.find((b) => b) ?? `Cheer Lv.${battle.raid!.cheerLevel}: cheer your team on! Offense and Defense last 3 turns; Heal restores some HP; Turn the tables reverses all stat changes.`);
    this.menu = new Menu(this, {
      x: COMMAND_X + 24,
      y: MESSAGE_Y + 26,
      options: cheers.map((c, i) => ({ label: c.label, disabled: blocked[i] !== null })),
      columns: 2,
      itemWidth: 170,
      itemHeight: 50,
      fontSize: 26,
      color: this.btnText,
      glass: { paint: this.skin?.pill, tints: cheers.map((c) => c.tint), motion: this.motion },
      onSelect: (i) => this.submit({ kind: 'cheer', cheer: cheers[i]!.cheer }),
      onBack: () => this.showRootMenu(),
    });
  }

  /** The moves as root-menu tiles for a combined style; none while a Z-Move is chosen or no move has PP (Fight then leads to Struggle). */
  private combinedMoves(): { label: string; detail?: string; disabled: boolean; tint: number }[] {
    const content = services().session.content;
    const mon = this.activeMon();
    if (this.transformChoice?.kind === 'zmove' || !mon.moves.some((m) => m.pp > 0)) return [];
    return mon.moves.map((slot) => {
      const move = content.moves.get(slot.id)!;
      const styled = this.skin?.moveText?.({ name: move.name, type: move.type, category: move.category, power: String(move.power ?? fixedDamageLabel(move.effects.fixedDamage)), accuracy: move.accuracy === null || move.accuracy === undefined ? '-' : String(move.accuracy), pp: slot.pp, maxPp: maxPp(content, slot) });
      return { label: styled?.label ?? move.name, detail: styled?.detail, disabled: slot.pp <= 0, tint: TYPE_COLORS[move.type] ?? 0x8a96a0 };
    });
  }

  private showMoveMenu(): void {
    const content = services().session.content;
    const mon = this.activeMon();
    const anyPp = mon.moves.some((m) => m.pp > 0);
    this.clearMenus();
    this.message.setText(`${this.pilotTag(mon)}What will ${this.speciesName(mon)} do?`);
    // With Z-Move on, each move shows the Z-Move it becomes; moves without one can't be picked.
    const zMoves = this.transformChoice?.kind === 'zmove' ? zMoveOptions(this.battleCtx()) : null;
    // Dynamaxed (or about to): every move shows the Max Move it becomes.
    const dynamaxed = this.transformChoice?.kind === 'dynamax' || this.run.battle?.transform.dynamax[mon.uid] !== undefined;
    const maxMoves = dynamaxed ? maxMoveOptions(this.battleCtx()) : null;
    const zLabel = (i: number, name: string) => {
      const z = zMoves?.[i];
      if (maxMoves?.[i]) return maxMoves[i]!.name;
      return z ? (z.category === 'status' ? `Z-${name}` : z.name) : name;
    };
    const options = anyPp
      ? mon.moves.map((slot, i) => {
          const why = moveBlockReason(content, this.run.battle!, mon, i);
          // Beta 4.4: the Hyper slot's move is starred, a Mega signature move has a diamond.
          const lie = this.run.battle!.eventRule?.falseSlot ? falseSlotFor(this.run.battle!.turn, mon.uid, mon.moves.length, mon.moves.map((m) => m.pp > 0)) : null;
          const seenLie = lie?.seen && lie.slot === i ? lie : null;
          const name = (seenLie ? '⚠ ' : '') + (slot.lent ? '♥ ' : slot.hyper ? '★ ' : slot.megaSig ? '◆ ' : slot.storySig ? '✦ ' : '') + zLabel(i, (slot.storySig ? signatureDisplay(this.run, slot.id) : undefined) ?? content.moves.get(slot.id)!.name) + (wouldRefuse(content, this.run, mon, slot.id) ? ' (may refuse)' : '') + (seenLie ? ` (false: really ${content.moves.get(mon.moves[seenLie.to]!.id)!.name})` : '') + (why ? ` (${why})` : '');
          const disabled = slot.pp <= 0 || why === 'Choice lock' || (zMoves !== null && !zMoves[i]);
          const move = zMoves?.[i] ?? maxMoves?.[i] ?? content.moves.get(slot.id)!;
          // A battle style may label its buttons its own way (PP, power, type).
          const styled = this.skin?.moveText?.({ name, type: move.type, category: move.category, power: String(move.power ?? fixedDamageLabel(move.effects.fixedDamage)), accuracy: move.accuracy === null || move.accuracy === undefined ? '-' : String(move.accuracy), pp: slot.pp, maxPp: maxPp(content, slot) });
          return { label: styled?.label ?? name, detail: styled?.detail, disabled, rx: { type: move.type, sub: `PP ${slot.pp}/${maxPp(content, slot)}` } };
        })
      : [{ label: 'Struggle' }];
    // Moves fill the message bar; the command window shows the focused move's details.
    this.message.setVisible(false);
    this.commandWindow.setVisible(true);
    this.menu = new Menu(this, {
      x: 30,
      y: MESSAGE_Y + 26,
      options,
      columns: 2,
      itemWidth: 270,
      // A fifth move (the Hyper slot) needs a third row: smaller buttons then.
      // Story signature moves can make it 7 or 8 (a fourth row).
      itemHeight: options.length > 6 ? 27 : options.length > 4 ? 36 : 50,
      fontSize: options.length > 6 ? 18 : options.length > 4 ? 22 : 28,
      // A battle style may fan the moves out as cards or ring them around your Pokémon.
      ...(this.skin ? this.menuSpec(this.skin.layout.moves, options.length) : {}),
      color: this.btnText,
      // Each move sits on a glass pill in its type's colour.
      glass: {
        paint: this.skin?.pill,
        tints: options.map((_, i) => {
          const slot = mon.moves[i];
          const move = slot ? (zMoves?.[i] ?? maxMoves?.[i] ?? content.moves.get(slot.id)) : undefined;
          if (maxMoves?.[i]) return maxMoves[i]!.name.startsWith('G-Max') ? 0x3f9bbd : 0x6a5c9e;
          return move ? mixColor(TYPE_COLORS[move.type] ?? 0x888888, 0x000000, 0.35) : undefined;
        }),
        motion: this.motion,
      },
      initialIndex: anyPp && services().session.settings.rememberChoices ? defaultMoveIndex(mon.moves.map((m) => m.id), options.map((o) => !('disabled' in o && o.disabled)), this.lastMoves.get(mon.uid)) ?? undefined : undefined,
      onFocus: (i) => {
        this.focusedMove = i;
        this.moveBadges?.destroy();
        this.moveBadges = null;
        const slot = mon.moves[i];
        if (!anyPp || !slot) {
          this.moveInfo.setText('Your Pokémon has no PP left').setY(this.skin ? this.skin.layout.moveInfo.y : MESSAGE_Y + 30);
          return;
        }
        const move = zMoves?.[i] ?? maxMoves?.[i] ?? content.moves.get(slot.id)!;
        const hyperBoost = slot.hyper && !zMoves?.[i] && !maxMoves?.[i] && move.power ? content.balance.hyperMove.powerBonus : 0;
        const power = move.power ? (hyperBoost ? `${move.power + hyperBoost} (+${hyperBoost})` : move.power) : fixedDamageLabel(move.effects.fixedDamage);
        // Type label and category icon from Essentials; plain text if the art is missing.
        const type = typeLabel(this, 0, 0, move.type, 1.5);
        const cat = categoryIcon(this, 120, 0, move.category, 1.5);
        const art = [type, cat].filter((o): o is Phaser.GameObjects.Image => o !== null);
        const label = art.length === 2 ? '' : `${move.type.toUpperCase()}  ·  ${move.category}\n`;
        const at = this.skin?.layout.moveInfo;
        this.rxInfo = `${move.name} · ${move.type.charAt(0).toUpperCase()}${move.type.slice(1)} · ${move.category.charAt(0).toUpperCase()}${move.category.slice(1)} · Power ${power} · Acc ${move.accuracy === null || move.accuracy === undefined ? '-' : move.accuracy}\nPP ${slot.pp}/${maxPp(content, slot)}`;
        this.moveInfo.setText(`${label}${services().session.settings.typeMarkers ? `${move.type.toUpperCase()} ${move.category}  ·  ` : ''}PP  ${slot.pp}/${maxPp(content, slot)}  ·  Power ${power}`);
        if (at?.inline) this.moveInfo.setY(at.y);
        else this.moveInfo.setY(at ? (art.length === 2 ? at.y + 40 : at.y + 6) : art.length === 2 ? MESSAGE_Y + 64 : MESSAGE_Y + 30);
        if (art.length === 2) {
          // Inline: the badges follow the words on the same line.
          const bx = at ? (at.inline ? at.x + this.moveInfo.width + 16 : at.x - 2) : COMMAND_X + 28;
          const by = at ? (at.inline ? at.y + 10 : at.y + 16) : MESSAGE_Y + 40;
          this.moveBadges = this.add.container(bx, by, [...art, ...this.moveExtras(move, !!at?.inline)]);
          if (at?.inline) this.fitInlineHint(this.moveBadges, at);
          bounceIn(this, this.moveBadges, this.motion);
        } else art.forEach((o) => o.destroy());
        this.moveInfo.setColor(this.panelText);
      },
      onSelect: (i) => {
        if (anyPp && mon.moves[i]) this.lastMoves.set(mon.uid, mon.moves[i]!.id);
        const transform = this.transformChoice;
        this.transformChoice = null;
        const rally = this.rallyChoice;
        this.rallyChoice = false;
        const action = { kind: 'move' as const, index: anyPp ? i : -1, ...(transform ? { transform } : {}), ...(rally ? { rally: true } : {}) };
        const slot = anyPp ? mon.moves[i] : undefined;
        const move = slot ? (zMoves?.[i] ?? content.moves.get(slot.id)) : undefined;
        const sig = !!slot && !!mon.awakened?.includes(slot.id);
        const withSkill = async () => {
          const skill = slot ? await this.moveSkill(slot.id, sig) : undefined;
          const chosen = skill ? { ...action, skill } : action;
          if (this.duo && move && needsTarget(move)) this.openTargetPicker(chosen, move);
          else this.submit(chosen);
        };
        // Story Run: a Pokémon that would refuse offers a choice first. Insisting always works and costs Heartbond.
        if (slot && this.run.story.v2 && wouldRefuse(content, this.run, mon, slot.id)) {
          this.openRefusalOffer(action, mon, slot.id, () => void withSkill());
          return;
        }
        void withSkill();
      },
      onBack: () => this.showRootMenu(),
    });
    this.moveInfo.setVisible(true);
    this.showTabs('attack');
    this.rxMoves = true;
    this.showActionTab();
  }

  /** A Story Run offer: the Pokémon is unsure about a reckless move. Insist (costs Heartbond), let it decline, or pick again. */
  private openRefusalOffer(action: Extract<PlayerAction, { kind: 'move' }>, mon: PokemonInstance, moveId: string, goOn: () => void): void {
    const content = services().session.content;
    const name = mon.care?.nickname || (content.species.get(mon.speciesId)?.name ?? mon.speciesId);
    const moveName = content.moves.get(moveId)?.name ?? moveId;
    this.menu?.destroy();
    this.message.setVisible(true).setText(`${name} is not sure about ${moveName}. Insisting will cost some Heartbond.`);
    this.commandWindow.setVisible(true);
    const choices = ['Insist', 'Let it decline', 'Pick another move'];
    this.menu = new Menu(this, {
      x: COMMAND_X + 24,
      y: MESSAGE_Y + 26,
      options: choices.map((label) => ({ label })),
      columns: 1,
      itemWidth: 340,
      itemHeight: 46,
      fontSize: 26,
      color: this.btnText,
      onSelect: (i) => {
        if (i === 0) { Object.assign(action, { override: true }); goOn(); } else if (i === 1) goOn(); else this.showMoveMenu();
      },
      onBack: () => this.showMoveMenu(),
    });
  }

  /** The ACTION tab over the move menu: click to cycle Mega / Tera / Z-Move / Dynamax on and off; red-orange while one is on. */
  private showActionTab(): void {
    const ctx = this.battleCtx();
    const choices: TransformRequest[] = [
      ...(megaOption(ctx) ? [{ kind: 'mega' as const }] : []),
      ...(teraOption(ctx) ? [{ kind: 'tera' as const }] : []),
      ...(zMoveOptions(ctx).some((z) => z !== null) ? [{ kind: 'zmove' as const }] : []),
      ...(canDynamax(ctx) ? [{ kind: 'dynamax' as const }] : []),
    ];
    if (choices.length === 0) return;
    const on = this.transformChoice;
    this.rxGim = { choices, tera: teraOption(ctx) ?? 'normal' };
    this.actionTabUi = actionTab(this, 20, MESSAGE_Y - 26, {
      on: !!on,
      icon: on?.kind === 'dynamax' ? { key: 'ui.dynamax.icon' } : on?.kind === 'mega' ? { key: 'pack.ebdx.symMega' } : { key: 'ui.tera.types', frame: TERA_ICON_ROW[teraOption(ctx) ?? 'normal'] },
      onClick: () => {
        const at = choices.findIndex((c) => c.kind === this.transformChoice?.kind);
        this.transformChoice = choices[at + 1] ?? null;
        this.showMoveMenu();
      },
    });
  }

  /**
   * Enhanced Battle UI extras for the move panel: up to four flag icons
   * (contact, sound, punch…) and how well the move hits the foe's visible
   * types, as a tag plus words. Only what the player can already see.
   */
  /** `inline`: the badges sit on the message bar's own row, so the effectiveness hint goes above them instead of down onto the party icons. */
  /**
   * An inline style's effectiveness hint that would run past its message bar drops to a second row inside the bar;
   * when the bar has no room for that, only the icon stays (the words show in the plain styles).
   */
  private fitInlineHint(box: Phaser.GameObjects.Container, at: { x: number; y: number }): void {
    const bar = this.skin?.layout.bar;
    const parts = box.list.filter((o) => o.getData('hint')) as (Phaser.GameObjects.Image | Phaser.GameObjects.Text)[];
    const text = parts.find((o) => o.getData('hint') === 'text') as Phaser.GameObjects.Text | undefined;
    if (!bar || !text) return;
    const right = bar[0] + bar[2] - 8;
    if (box.x + text.x + text.width <= right) return;
    const rowY = 30;
    if (box.y + rowY + 12 <= bar[1] + bar[3]) {
      const shift = at.x - box.x - (parts[0]?.x ?? 0);
      parts.forEach((o) => o.setPosition(o.x + shift, rowY));
    } else text.setVisible(false);
  }

  private moveExtras(move: Move, inline = false): Phaser.GameObjects.GameObject[] {
    const out: Phaser.GameObjects.GameObject[] = [];
    const flags = moveFlagNames(move);
    flags.slice(0, 4).forEach((name, n) => {
      const key = `pack.ebui.flag.${name}`;
      if (this.textures.exists(key)) out.push(this.add.image(192 + n * 32, 0, key).setOrigin(0, 0.5).setScale(1.1));
    });
    if (move.category === 'status') return out;
    const content = services().session.content;
    const foe = this.shown.enemy;
    const tera = this.run.battle?.transform.teraTypes[foe.uid];
    const types = (tera ? [tera] : getSpecies(content, foe.speciesId).types) as TypeName[];
    const hint = effectivenessWord(typeEffectiveness(content.typeChart, move.type as TypeName, types));
    // Inline styles keep the hint on the badge row (after the flags), so it never floats over the field.
    const hx = inline ? 192 + Math.min(flags.length, 4) * 32 + 8 : 0;
    const hy = inline ? 0 : 72;
    const icon = effectivenessIcon(this, hx, hy, hint.frame, 0.36);
    if (icon) out.push(icon.setData('hint', 'icon'));
    out.push(this.add.text(hx + (icon ? 32 : 0), hy, hint.text, this.skinText(inline ? 18 : 20, this.panelText)).setOrigin(0, 0.5).setData('hint', 'text'));
    return out;
  }

  private battleCtx() {
    const run = this.run;
    // Double battles: the helpers read the party's "active" Pokémon, so point them at the one being commanded.
    const doubles = run.battle?.doubles;
    const idx = doubles ? run.party.indexOf(this.activeMon()) : -1;
    const battle = doubles && idx >= 0 && idx !== run.battle!.activeIndex ? { ...run.battle!, activeIndex: idx } : run.battle!;
    return { content: battleContent(services().session.content, run.rules, run.regionOrder[run.regionIndex]), battle, party: run.party, inventory: run.inventory, disabledMechanics: run.disabledMechanics, perks: runPerks(services().session.content, run), gimmicks: gimmickContext(services().session.content, run), noBattleItems: noBattleItems(run.rules), setStyle: isHardcore(run.rules), catchBlocked: nuzlockeCatchProblem(battle), bondScore: (uid: string) => bondScoreOf(run.story.histories[uid]?.bond) };
  }

  private openBag(pocket = this.rxPocket): void {
    const content = services().session.content;
    const run = this.run;
    const all = Object.keys(run.inventory).filter((id) => content.items.get(id)?.usableInBattle && run.inventory[id]! > 0);
    // New UI: the Item window sorts the Bag into pockets (tabs), as in the mock-up. The other looks list everything.
    const pocketOf = (id: string): string => itemPocket(content.items.get(id)!.category);
    const pockets = this.rx ? BAG_POCKETS.filter((p) => all.some((id) => pocketOf(id) === p)) : [];
    const at = Math.max(0, Math.min(pockets.length - 1, pocket));
    this.rxPocket = at;
    const ids = pockets.length ? all.filter((id) => pocketOf(id) === pockets[at]) : all;
    this.bagIds = ids;
    // A Pokémon-targeted item is usable if it works on at least one party member.
    const problem = (id: string): string | null => {
      const item = content.items.get(id)!;
      if (item.target === 'party' || item.target === 'fainted') {
        const reasons = run.party.map((_, i) => itemProblem(this.battleCtx(), id, i));
        return reasons.some((r) => r === null) ? null : `No Pokémon can use the ${item.name} right now.`;
      }
      return itemProblem(this.battleCtx(), id);
    };
    this.clearMenus();
    this.picker = new Picker(this, {
      glass: true,
      dock: true,
      title: 'Bag  (P pins to the hotbar)',
      window: this.rxWindow(),
      tabs: pockets.length ? { labels: pockets.map((p) => (p === 'balls' ? 'Balls' : POCKET_NAMES[p])), index: at, onChange: (i) => this.openBag(i) } : undefined,
      columns: 2,
      rowHeight: 34,
      rows: ids.map((id) => bagRow(content, run.inventory, id, problem(id))),
      onSelect: (i) => {
        const id = ids[i]!;
        const item = content.items.get(id)!;
        if (item.target === 'party' || item.target === 'fainted') this.openItemTarget(id);
        else if (item.category === 'ball' && !this.duo && launcherReady(services().session.run!)) void this.skillThrow(id);
        else void this.useBagItem(id);
      },
      onBack: () => this.showRootMenu(),
    });
    this.rxBag = this.picker;
    this.showTabs('item');
  }

  private openItemTarget(itemId: string): void {
    const content = services().session.content;
    const run = this.run;
    const item = content.items.get(itemId)!;
    // Overhaul slice 7: every party member shows whether and how the item would work on it (the engine's own reasons win).
    const previews = partyPreviews(content, item, run.party, { regionId: undefined, healMultiplier: runHealMultiplier(content, run), problemFor: (i) => itemProblem(this.battleCtx(), itemId, i) });
    const card = itemCard(content, item, run.inventory[itemId] ?? 0, previews);
    this.clearMenus();
    this.picker = new Picker(this, {
      glass: true,
      dock: true,
      title: `Use ${item.name} on which Pokémon?`,
      window: this.rxWindow(),
      columns: 3,
      rowHeight: 70,
      rows: partyRows(content, run.party, (i) => itemProblem(this.battleCtx(), itemId, i), (i) => (i === run.battle!.activeIndex ? 'IN BATTLE' : undefined), (i) => `${itemFooter(card, previews[i]!)}`, (i) => previews[i]),
      inspect: (i) => quickSummaryText(content, run, run.party[i]!),
      onSelect: (i) => {
        const content = services().session.content;
        const toss = content.catalog.get(itemId)?.family.includes('Berr') ?? false;
        if (toss && this.playerSprite) void tossArc(this, { x: 90, y: 440 }, { x: this.playerSprite.x, y: this.playerSprite.y - 30 }, this.motion).then(() => this.submit({ kind: 'item', itemId, targetIndex: i }));
        else this.submit({ kind: 'item', itemId, targetIndex: i });
      },
      onBack: () => this.openBag(),
    });
  }

  /** Party list for switching. `forced` after a faint: a choice must be made and it costs no turn. */
  private openPartyPicker(forced: boolean): void {
    const content = services().session.content;
    const run = this.run;
    this.clearMenus();
    const faintBark = forced ? barkLine(content, run, 'faint', `${run.regionIndex}-${run.stage?.current ?? ''}-${run.battle?.turn ?? 0}`) : null;
    this.message.setText(forced ? `${faintBark ? `${faintBark} ` : ''}Choose a Pokémon to send out.` : '');
    if (this.duo) {
      // Double battles: neither Pokémon in battle, nor one the other spot is already sending out.
      const view = { battle: run.battle!, party: run.party };
      const onField = spotsOf(view.battle).map((s) => indexAt(view, 'player', s));
      const taken = this.commands.flatMap((c) => (c?.action.kind === 'switch' ? [c.action.partyIndex] : []));
      this.picker = new Picker(this, {
        dock: true,
        title: forced ? 'Send out which Pokémon?' : `Switch ${this.speciesName(this.activeMon())} for which Pokémon?`,
        window: this.rxWindow(),
        columns: 3,
        rowHeight: 70,
        rows: partyRows(content, run.party, (i) => doublesSwitchProblem(view, i, taken), (i) => (onField.includes(i) ? 'IN BATTLE' : isGuest(view.battle, run.party[i]?.uid) ? 'ALLY' : undefined)),
        onSelect: (i) => (forced ? void this.act({ kind: 'switch', partyIndex: i }) : this.submit({ kind: 'switch', partyIndex: i })),
        onBack: forced ? undefined : () => this.showRootMenu(),
      });
      return;
    }
    this.picker = new Picker(this, {
      glass: true,
      dock: true,
      title: forced ? 'Send out which Pokémon?' : this.rx ? 'Switch to…' : 'Party',
      window: this.rxWindow(),
      columns: 3,
      rowHeight: 70,
      rows: partyRows(content, run.party, (i) => (forced ? switchProblem(this.battleCtx(), i) : null), (i) => (i === run.battle!.activeIndex && !forced ? 'IN BATTLE' : undefined)),
      // The cursor starts on the first Pokémon that can switch in.
      start: forced ? undefined : Math.max(0, run.party.findIndex((_, i) => switchProblem(this.battleCtx(), i) === null)),
      onSelect: (i) => (forced ? void this.act({ kind: 'switch', partyIndex: i }) : this.showPartyActions(i)),
      onBack: forced ? undefined : () => this.showRootMenu(),
    });
    if (!forced) this.showTabs('party');
  }

  // ---------- taking a turn ----------

  /** The Ball Launcher (camp gadget): a timing ring decides how well the ball is thrown; the grade scales the catch rate. */
  private async skillThrow(itemId: string): Promise<void> {
    const { session } = services();
    this.clearMenus();
    const result = await runInteractionPrompt(this, promptById('throw-ring'), { motion: session.settings.battleAnimations });
    session.useLauncher();
    this.submit({ kind: 'item', itemId, skill: result.grade });
  }

  private async act(action: PlayerAction, auto = false): Promise<void> {
    if (this.busy) return;
    this.busy = true;
    this.clearMenus();

    const { session } = services();
    const before = structuredClone(session.run!);
    const trainer = this.trainerTitle();
    // Who the boss was, read before the turn ends the battle (catalog 91 victory card).
    const bossWin = this.boss() ? { boss: this.boss()!, art: this.trainerArt(), turn: before.battle?.turn ?? 1, active: before.battle?.activeIndex ?? 0 } : null;
    let result: TurnResult;
    try {
      if (auto) {
        // gn.47: a watched Exhibition is played by its own AI for both sides (no setting of the player's is read).
        const watched = session.exhibitionTurn();
        const taken = watched ? null : session.takeAutoTurn();
        if (!watched && !taken) throw new Error('Auto-Battle could not choose an action.');
        result = watched ?? taken!.result;
      } else result = session.takeTurn(action);
    } catch (err) {
      // The menus only offer legal choices, so this means a bug; show it rather than freeze.
      await this.say(String(err instanceof Error ? err.message : err));
      this.busy = false;
      this.nextPrompt();
      return;
    }
    this.stadium?.startTurn(before.battle?.turn ?? 1);
    await this.playEvents(result.events, before, trainer, result.cues, result.drama);
    await this.stadium?.afterTurn();

    if (result.spectated) {
      await this.readAloud(result.spectated.lines);
      await exitWipe(this, this.motion, this.wipeMask());
      this.scene.start(sceneForRun(result.run));
      return;
    }
    if (result.end) {
      await this.finish(result, trainer, bossWin, before);
      return;
    }
    if (result.escaped) {
      await exitWipe(this, this.motion, this.wipeMask());
      this.scene.start(sceneForRun(result.run));
      return;
    }
    if (result.raidFailed) {
      await this.say('The fight is over... your Pokémon were pulled back to safety.');
      await exitWipe(this, this.motion, this.wipeMask());
      this.scene.start(sceneForRun(result.run));
      return;
    }
    if (result.stepIn) {
      await this.finishStepInDuel(result.stepIn, result.run);
      return;
    }
    if (result.clubLost) {
      await this.say('The match is over. Your team is patched up: no hard feelings.');
      await exitWipe(this, this.motion, this.wipeMask());
      this.scene.start(sceneForRun(result.run));
      return;
    }
    if (this.role === 'rival' && (result.narrativeDefeat || result.wiped || result.defeated)) await this.fx.flourish('enemy', 'rival.win', ENEMY_POS);
    if (result.storyLoss) {
      // Phantom UI: a loss to a rival gets its own page, which says the same thing.
      if (!(await this.phRivalLossCard(before, result.run))) await this.say('You lost this one, but the story goes on. Your team is patched up.');
      interactionLog.tell('gain', 'Lost the battle. The run goes on.');
      // Extended Cut: a lost climax battle spends the Second Shot; the player is told what that means before the screen leaves.
      const shot = secondShotNotice(before, result.run);
      if (shot) await this.tellNotice(shot);
      await exitWipe(this, this.motion, this.wipeMask());
      this.scene.start(sceneForRun(result.run));
      return;
    }
    if (result.narrativeDefeat) {
      // The story loss: a heavy shake (skipped when battle animations are off), then the rival's words.
      if (this.motion !== 'off') {
        this.cameras.main.shake(500, 0.008 * services().session.settings.shakeStory * capFlash(services().session.settings.shakeIntensity, services().session.settings.reducedFlash));
        await new Promise<void>((done) => this.time.delayedCall(600, () => done()));
      }
      await this.say(result.narrativeDefeat.defeatLine);
      await this.say(result.narrativeDefeat.victoryLine);
      await exitWipe(this, this.motion, this.wipeMask());
      this.scene.start(sceneForRun(result.run));
      return;
    }
    if (result.flightNorth) {
      // Beta 0.7 Flight North: the game-over screen cracks, cracks again and shatters; its own music (falls back to the boss track until composed).
      const shake = 0.012 * services().session.settings.shakeStory * capFlash(services().session.settings.shakeIntensity, services().session.settings.reducedFlash);
      // The glass is drawn over everything; a failed drawing only loses the picture, never the return.
      let glass: ReturnType<typeof glassCrack> | null = null;
      try {
        glass = glassCrack(this, this.motion, capFlash(1, services().session.settings.reducedFlash));
      } catch (e) {
        console.warn('Flight North glass failed', e);
      }
      for (let i = 0; i < 3; i++) {
        this.cameras.main.shake(260 + i * 160, shake * (i + 1));
        try {
          if (i < 2) glass?.crack();
          else await glass?.shatter();
        } catch (e) {
          console.warn('Flight North glass failed', e);
        }
        await this.say(result.flightNorth.lines[i] ?? '');
      }
      glass?.destroy();
      for (const line of result.flightNorth.lines.slice(3)) await this.say(line);
      this.scene.start(sceneForRun(result.run));
      return;
    }
    if (result.secondChance) {
      // Beta 0.7 S1: the six lines, then back into the same fight with the partner beside you (the scene reloads from the saved battle).
      for (const line of result.secondChance.lines) await this.say(line);
      await this.say(result.secondChance.silhouette ? 'A silhouette you do not recognise stands beside you.' : `${result.secondChance.partner} stands beside you!`);
      this.scene.start(sceneForRun(result.run));
      return;
    }
    if (this.stadium && (result.wiped || result.defeated)) await this.stadium.interview('post', false);
    if (result.wiped || result.defeated) void this.trainerIn().then((a) => a?.play('defeat'));
    if (result.rewound) {
      await this.say(`Your team fell... but the Time Keeper remembers. The battle goes back ${result.rewound} turn${result.rewound > 1 ? 's' : ''}!`);
      this.scene.start(sceneForRun(result.run));
      return;
    }
    if (result.wiped) {
      await this.say(result.run.phase === 'battle' ? 'The VS Recorder rewinds the tape... the battle starts again!' : result.run.rules.modeId === 'adventure' ? 'Your party fainted... you return to the start of the stage, healed.' : 'Death-Block! You return to the start of the stage with your party healed.');
      this.scene.start(sceneForRun(result.run));
      return;
    }
    if (result.defeated) {
      await this.say('You have no Pokémon that can fight!');
      await exitWipe(this, this.motion, this.wipeMask());
      this.scene.start('GameOver');
      return;
    }
    // Safety net: a turn that cleared the battle without an end must never leave the screen waiting for a command (the post-battle freeze).
    if (!result.run.battle) {
      await exitWipe(this, this.motion, this.wipeMask());
      this.scene.start(sceneForRun(result.run));
      return;
    }
    // Allies the game controls walked onto the field or left it (core/battle/guests.ts): the field has more or fewer places now,
    // so the screen is laid out again from the battle as it stands (the same way a reloaded battle opens).
    const places = !result.run.battle.doubles ? 1 : result.run.battle.doubles.trio ? 3 : 2;
    if (places !== (this.duo?.size ?? 1)) {
      this.scene.start(sceneForRun(result.run));
      return;
    }
    this.busy = false;
    this.nextPrompt();
  }

  private async finish(result: TurnResult, trainer: string | null, bossWin: { boss: BossInfo; art: { assetId: string; label: string } | null; turn: number; active: number } | null = null, before?: RunState): Promise<void> {
    const content = services().session.content;
    const end = result.end!;
    if (end.outcome === 'win') {
      stopProceduralAudio();
      playMusic(this, victoryTrack({ trainer: Boolean(trainer), boss: Boolean(bossWin), role: this.role }));
    }
    if (end.outcome === 'win') void this.trainerIn().then((a) => a?.play('win'));
    if (end.outcome === 'win' && this.playerSprite) {
      if (services().session.settings.victoryPoses) {
        // The battle is already cleared from the run here, so activeMon() would read null: use the Pokémon the screen shows.
        const sp = getSpecies(content, (this.run.party.find((m) => m.uid === this.shown.player.uid) ?? this.shown.player).speciesId);
        void victoryPose(this, this.playerSprite, victoryPoseFor(sp.types, sp.weight), this.motion);
      } else void hop(this, this.playerSprite, this.motion);
    }
    // The rival's victory and defeat poses (6.5); pure decoration after the battle is decided.
    if (this.role === 'rival' && end.outcome === 'win') void this.fx.flourish('enemy', 'rival.lose', ENEMY_POS);
    if (end.outcome === 'win' && trainer) {
      // Phantom UI: the win is its own card (it stands in for the stamp).
      if (this.rx && phantomOn()) await this.phWinCard(trainer, before);
      else await this.playBeat(stamp(this, 'VICTORY!', trainer, this.foeRim(), this.motion));
      if (bossWin) {
        const party = result.run.party;
        const v = bossVictory(content, bossWin.boss, party, bossWin.turn, party[bossWin.active] ?? null);
        const art = bossWin.art;
        await this.playBeat(
          bossVictoryCard(this, v, TYPE_COLORS[v.accentType] ?? ROLE_RIMS[bossWin.boss.role], this.motion, art ? (x, y) => trainerVisual(this, art.assetId, art.label, x, y, 2.5) : null, (i, x, y) =>
            pokemonIcon(this, getSpecies(content, v.lineup[i]!.speciesId), x, y, 1.6),
          ),
        );
      }
      await this.say(`You defeated ${trainer}!`);
    }
    // M7: a raid boss falling and a Champion's defeat each get a framework card (presentation only).
    if (end.outcome === 'win' && this.run.battle?.raid) await this.bigMoment('raidDefeat', `raidDefeat.${this.run.battle.enemyTeam[0]?.speciesId ?? 'boss'}`, 'RAID CLEARED', this.speciesName(this.run.battle.enemyTeam[0]!), false, { cast: this.rxMe(), role: 'Raid cleared', line: 'The storm above the den breaks apart.' });
    else if (end.outcome === 'win' && !bossWin && this.evilLeaderBeaten(trainer ?? undefined)) {
      // The Betrayal: with the leader beaten, the Legendary they chased turns on them. The catch is the team's 'A Legend Stirs' stop.
      const team = evilTeam(services().session.content, this.run);
      await this.bigMoment('evilBetrayal', `evilBetrayal.${team?.id ?? 'team'}`, 'THE BETRAYAL', `The Legendary turns on ${trainer}`, true, { name: trainer ?? 'The Leader', role: 'The Betrayal', line: `The Legendary turns on ${trainer}.` });
    }
    else if (end.outcome === 'win' && bossWin) await this.bigMoment('bossDefeat', `bossDefeat.${bossWin.boss.title}`, bossWin.boss.role === 'champion' ? 'CHAMPION DEFEATED' : bossWin.boss.role === 'elite' ? 'ELITE FOUR DEFEATED' : 'LEADER DEFEATED', bossWin.boss.title, false, { name: bossWin.boss.name, role: 'Defeated', cast: artOf(this, bossWin.art?.assetId), line: [...(result.drama ?? [])].reverse().find((d) => d.category === 'defeat')?.text ?? '' });
    // New UI: beating a Champion puts the player in the Hall of Fame (the mock-ups' last important moment).
    if (this.rx && end.outcome === 'win' && bossWin?.boss.role === 'champion') {
      const { content } = services().session;
      const v2 = this.run.story.v2;
      const me = content.archetypes.get(this.run.archetypeId);
      await this.bigMoment('bossDefeat', `hallOfFame.${this.run.seed}.${this.run.regionIndex}`, 'Champion', 'Hall of Fame', true, { name: v2?.protagonist?.name || me?.name || 'You', role: 'Champion', line: 'Your name goes on the wall.', cast: this.rxMe() });
    }
    // Barks (catalog row 9): the leader beside you on the inside route says one line after a win.
    if (end.outcome === 'win') {
      const bark = barkLine(content, this.run, 'win', `${this.run.regionIndex}-${this.run.stage?.index ?? 0}-${this.run.stage?.current ?? ''}`);
      if (bark) await this.say(bark);
    }
    if (end.outcome === 'win' && this.assistAfter) {
      await this.say(this.assistAfter);
      this.assistAfter = null;
    }
    // Galar: a reporter interviews a different random character about how the match went.
    if (this.stadium && end.outcome === 'win') await this.stadium.interview('post', true);
    // Phantom UI: the result page carries the Exp, the prize money and what was found; the Old and New looks say them.
    const tallied = await this.phResultCard(result, before, !!bossWin);
    if (end.moneyGained > 0 && !tallied) await this.say(`You got ₽${end.moneyGained}!`);
    if (!tallied) for (const id of end.itemsFound) await this.say(`You found a ${content.items.get(id)?.name ?? id}!`);
    interactionLog.tell('gain', `${end.outcome === 'caught' ? 'Caught it' : trainer ? `Beat ${trainer}` : 'Won the battle'}${end.moneyGained > 0 ? ` · +₽${end.moneyGained}` : ''}${end.itemsFound.length ? ` · ${end.itemsFound.map((id) => content.items.get(id)?.name ?? id).join(', ')}` : ''}`);
    const mats = Object.entries(end.materials ?? {});
    if (mats.length > 0) await this.say(`Materials: ${mats.map(([id, n]) => `${n} ${materialName(id)}`).join(', ')}.`);
    for (const reward of end.eventRewards) await this.say(`Event prize: ${reward}!`);
    for (const n of end.rescued ?? []) await this.say(`You snagged ${n} out of enemy hands. It flinches from you; show it care.`);
    for (const line of end.shadowStages ?? []) await this.say(line);
    for (const n of end.shadowPurified) await this.say(`The Shadow haze lifts from ${n}! It is purified!`);
    if ((end.blissfulHealed ?? []).length > 0) await this.say(`A soft Blissful light mends ${end.blissfulHealed.join(', ')}.`);
    for (const line of end.aftermath ?? []) await this.say(line);
    if (end.voiceJoined) await this.say(`${content.species.get(end.voiceJoined)?.name ?? 'The Pokémon'} heard your voice. It wants to come with you!`);
    if (end.badge) {
      playCue(this, 'st_badge_circuit', `me.${services().session.settings.victoryJingle}`);
      const leaderName = content.bosses.get(end.badge)?.name ?? end.badge;
      await this.playBeat(stamp(this, 'BADGE GET!', `${leaderName}'s badge`, ROLE_RIMS.gym, this.motion));
      await this.say(`You earned ${leaderName}'s badge! (${result.run.badges.length} total)`);
      const campaign = content.campaigns.get(result.run.campaignId);
      const leagueNext = result.run.stage?.kind === 'stage' && campaign && result.run.stage.index + 1 >= campaign.stagesPerRegion;
      await this.say(leagueNext ? 'The Pokémon League awaits…' : 'The next stage awaits…');
    }
    if (end.finale && !(await this.phPhaseCard('It is not over! The final boss rises for a second phase. Your party was restored.', 'Face the champion', { word: 'LAST STAND', meter: { at: 2, of: 2 } }))) {
      await this.say('It is not over! The final boss rises for a second phase…');
      await this.say('Your party was restored. Face the champion once more.');
    }
    if (end.regionCleared) {
      playSfx(this, 'se.level_up');
      const region = content.regions.get(end.regionCleared)?.name ?? end.regionCleared;
      await this.playBeat(stamp(this, 'CHAMPION!', region, ROLE_RIMS.champion, this.motion));
      await this.say(end.regionCleared === 'grand' ? `You beat the final boss and are the ${region} Champion!` : `You are the ${region} Champion!`);
      if (end.victory) for (const line of buildEpilogue(content, result.run)) await this.say(line);
      if (end.victory || !(await this.phTravelCard(result.run, end.regionCleared))) await this.say(end.victory ? 'You have conquered every region!' : 'A new region awaits…');
    }
    this.updateHeader();
    // Evolutions this battle earned wait as decisions: the evolution scene plays on the next screen (B can stop it).
    for (const t of end.bondTaught ?? []) {
      const mon = result.run.party.find((m) => m.uid === t.uid);
      if (mon) await this.say(`Close to you, ${getSpecies(content, mon.speciesId).name} learned ${content.moves.get(t.moveId)!.name}!`);
    }
    for (const line of end.recap ?? []) await this.say(line);
    await exitWipe(this, this.motion, this.wipeMask());
    this.scene.start(sceneForRun(result.run));
  }

  /** The charge-up an event shows, if it is a real charge (and what it does, from the rules). */
  private chargeFor(e: RunEvent, cue: PresentationCue | undefined): { side: Side; tint: number; label: string } | null {
    const content = services().session.content;
    if (e.type === 'charge') {
      const move = content.moves.get(e.moveId);
      return move ? { side: e.side, tint: TYPE_COLORS[move.type] ?? 0xffffff, label: `${move.name} strikes next turn` } : null;
    }
    const raid = this.run.battle?.raid;
    if (e.type === 'raid' && e.tone === 'warn' && raid?.charging) {
      const tele = raidDef(content, raid).telegraph;
      if (tele && tele.text === e.text) return { side: 'enemy', tint: 0xff4fd8, label: `Charged attack: next hit ×${tele.boost}` };
    }
    if (cue?.ids?.includes('gathering-everything')) return { side: cue.side, tint: 0xffb040, label: 'Next attack: Attack +2 (a status breaks it)' };
    return null;
  }

  /** The Pokémon as the run has it now (after the turn), for statuses an item gave. */
  private findLive(side: 'player' | 'enemy', uid: string): PokemonInstance | undefined {
    const run = services().session.run;
    return side === 'player' ? run?.party.find((m) => m.uid === uid) : run?.battle?.enemyTeam.find((m) => m.uid === uid);
  }

  private findMon(before: RunState, uid: string): PokemonInstance | undefined {
    // A Pokémon that joined mid-turn (a called SOS friend or Totem ally) is only in the state after the turn.
    return before.party.find((m) => m.uid === uid) ?? before.battle?.enemyTeam.find((m) => m.uid === uid) ?? this.run.battle?.enemyTeam.find((m) => m.uid === uid);
  }

  /** A line of trainer dialogue: "Joey: \"Crush them!\"". */
  private async sayTrainer(line: DramaLine): Promise<void> {
    const { session } = services();
    const { battleAnimations } = session.settings;
    const effectIntensity = capFlash(session.settings.effectIntensity, session.settings.reducedFlash);
    // Signature attacks and rare events get a short banner; reduced motion keeps the banner without movement, "off" skips it.
    const title = line.category === 'signature' && line.cue?.moveId ? (session.content.moves.get(line.cue.moveId)?.name ?? null) : line.cue?.event && !line.cue.event.startsWith('memory:') ? (DRAMA_LIBRARY.events.find((e) => e.id === line.cue!.event)?.name ?? null) : null;
    if (title && battleAnimations !== 'off') {
      this.showMoment({ at: -1, side: 'enemy', title, messages: [], color: line.category === 'signature' ? '#ffb020' : '#7a5cff', sound: 'se.shiny', music: null, major: true, cutIn: false, shake: false }, battleAnimations === 'full' && effectIntensity > 0);
    }
    await this.speak(line.speaker, line.text, line.voice, line.category === 'signature');
  }

  /**
   * A trainer talks (text box mockup #5): the screen dims, the trainer slides in big with the
   * Story Portrait box, and the line types like speech. A shouted line shakes the box, the trainer
   * jumps and their Pokémon cries. Presentation only; the line also goes to the battle log.
   */
  /** Galar hype moments: a line as trainer text with this person's own picture (loaded first). Never throws. */
  private async speakWithArt(name: string, assetId: string, text: string, look?: 'crowd' | 'champion'): Promise<void> {
    try {
      if (assetId) await loadAssets(this, [assetId]).catch(() => undefined);
    } catch {
      /* the line shows without a picture */
    }
    await this.speak(name, text, 'calm', false, assetId ? { assetId, look } : undefined);
  }

  /** The people who can speak in a hype moment right now. */
  private hypeSpeakers(): ReadonlySet<HypeSpeaker> {
    const out = new Set<HypeSpeaker>(['reporter', 'crowdTrainer', 'host']);
    try {
      const content = services().session.content;
      const rival = this.run.story.rivals[0];
      if (rival && this.rivalArt(rival)) out.add('rival');
      const scope = galarScope(content, this.run);
      if ((scope === 'gym' || scope === 'champion') && this.futureFoe('gym')) out.add('futureLeader');
      if (scope === 'tournament' && this.futureFoe('tournament')) out.add('futureOpponent');
    } catch {
      /* the basic cast is enough */
    }
    return out;
  }

  /** The next gym leader (gym battles) or the next opponent in the bracket (tournament): someone this player will face later. */
  private futureFoe(kind: 'gym' | 'tournament'): { name: string; assetId: string } | null {
    const content = services().session.content;
    let id: string | undefined;
    if (kind === 'gym') {
      const current = this.run.battle?.trainer?.leaderId;
      id = this.run.roleCast
        .filter((c) => c.role === 'gym' && c.regionIndex === this.run.regionIndex && c.id !== current && !this.run.badges.includes(c.id))
        .sort((a, b) => a.slot - b.slot)[0]?.id;
      // In the Champion battle every leader is behind you: one of the leaders you beat comes to watch.
      if (!id) id = this.run.roleCast.filter((c) => c.role === 'gym' && c.regionIndex === this.run.regionIndex && this.run.badges.includes(c.id)).sort((a, b) => b.slot - a.slot)[0]?.id;
    } else {
      id = bracketView(content, this.run).rounds.find((r) => r.state === 'later')?.opponent.id;
    }
    const boss = id ? content.bosses.get(id) : undefined;
    return boss ? { name: boss.name, assetId: boss.sprites.default } : null;
  }

  /** Who a speaker is for one moment: a name and a picture id. Crowd members are a seeded pick of everyday trainers. */
  private hypeCast(speaker: HypeSpeaker, seed: string): { name: string; assetId: string } {
    const content = services().session.content;
    try {
      if (speaker === 'reporter') return { name: 'Reporter', assetId: INTERVIEWERS_SPRITE };
      if (speaker === 'host') {
        const host = galarHost(content, this.run);
        return { name: host.name, assetId: content.bosses.get(host.id)?.sprites.default ?? '' };
      }
      if (speaker === 'rival') {
        const rival = this.run.story.rivals[0];
        const art = rival ? this.rivalArt(rival) : null;
        if (art) return { name: rival!.name, assetId: art.assetId };
      }
      if (speaker === 'futureLeader' || speaker === 'futureOpponent') {
        const f = this.futureFoe(speaker === 'futureLeader' ? 'gym' : 'tournament');
        if (f) return f;
      }
    } catch {
      /* fall back to a crowd member */
    }
    let h = 0;
    for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    const id = CROWD_SPRITES[h % CROWD_SPRITES.length]!;
    const names = ['Joey', 'Mia', 'Ken', 'Lily', 'Sam', 'Rhea', 'Tom', 'Ava', 'Nico', 'Ivy', 'Hana', 'Leo', 'Zoe', 'Max', 'Nora', 'Kai', 'Ella', 'Owen', 'Piper', 'Ravi', 'Tess', 'Finn', 'Cleo', 'Jonah', 'Wren', 'Theo', 'Mara', 'Dex', 'Luna', 'Ollie'];
    const first = names[(h >>> 5) % names.length]!;
    const cls = id.split('/')[1]!.replace(/_(m|f|2)$/, '').split('_').map((w) => w[0]!.toUpperCase() + w.slice(1)).join(' ');
    return { name: `${cls} ${first}`, assetId: id };
  }

  /** The names that fill a hype moment's line. */
  private hypeFacts(): Record<string, string> {
    const content = services().session.content;
    const battle = this.run.battle;
    // What is on the screen now, not the battle state: the turn is already worked out before it is shown, so the state is ahead of the picture.
    const foeMon = this.shown?.enemy ?? battle?.enemyTeam[battle.enemyIndex];
    const myMon = this.shown?.player ?? this.run.party[battle?.activeIndex ?? 0];
    const rival = this.run.story.rivals[0];
    return {
      player: content.archetypes.get(this.run.archetypeId)?.name ?? 'the challenger',
      foe: battle?.trainer?.name ?? this.lastFoe?.name ?? 'the opponent',
      foeMon: foeMon ? this.speciesName(foeMon) : 'their Pokémon',
      myMon: myMon ? this.speciesName(myMon) : 'your Pokémon',
      host: galarHost(content, this.run).name,
      rival: rival?.name ?? 'your rival',
      leader: this.futureFoe('gym')?.name ?? 'the next leader',
      ...this.journeyFacts(),
    };
  }

  /** The player's road through the run, as words for the Champion's lines: starter, strongest Pokémon, badges, wins, rival. */
  private journeyFacts(): Record<string, string> {
    const run = this.run;
    const starter = run.party.find((m) => m.uid === run.log.starterUid);
    const ace = [...run.party].sort((a, b) => b.level - a.level)[0];
    const rival = run.story.rivals[0];
    return {
      starter: starter ? this.speciesName(starter) : 'your first partner',
      ace: ace ? this.speciesName(ace) : 'your strongest Pokémon',
      badges: String(run.badges.length),
      wins: String(run.log.battlesWon),
      rivalName: rival?.name ?? 'your rival',
    };
  }

  private flagsSeen: ReadonlySet<string> = new Set();

  /** What is true of the fight right now, plus the player's journey: lines that need one of these only play when it holds. The last picture is kept for after the battle. */
  private hypeFlags(): ReadonlySet<string> {
    const out = new Set(this.journeyFlags());
    try {
      const content = services().session.content;
      const battle = this.run.battle;
      if (!battle) return this.flagsSeen.size > 0 ? this.flagsSeen : out;
      const foe = this.shown?.enemy ?? battle.enemyTeam[battle.enemyIndex];
      const me = this.shown?.player ?? this.run.party[battle.activeIndex];
      const favor = crowdFavor(content, this.run) ?? 50;
      if (favor >= 58) out.add('ahead');
      else if (favor <= 42) out.add('behind');
      else out.add('even');
      if (foe && foe.hp / Math.max(1, maxHp(content, foe)) < 0.3) out.add('foeLow');
      if (me && me.hp / Math.max(1, maxHp(content, me)) < 0.3) out.add('meLow');
      const turn = battle.turn ?? 1;
      if (turn <= 3) out.add('early');
      if (turn >= 8) out.add('late');
      const foesAlive = battle.enemyTeam.filter((m) => m.hp > 0).length;
      if (battle.enemyTeam.length > 1 && foesAlive === 1) out.add('foeAce');
      if (foe && me) {
        const mine = getSpecies(content, me.speciesId).types;
        const theirs = getSpecies(content, foe.speciesId).types;
        const adv = mine.some((t) => typeEffectiveness(content.typeChart, t as TypeName, theirs as TypeName[]) > 1);
        const dis = theirs.some((t) => typeEffectiveness(content.typeChart, t as TypeName, mine as TypeName[]) > 1);
        if (adv && !dis) out.add('typeAdv');
        else if (dis && !adv) out.add('typeDis');
      }
      this.flagsSeen = out;
    } catch {
      /* only the plain lines play */
    }
    return out;
  }

  /** True things about the player's journey; the Champion's lines that need one only play when it holds. */
  private journeyFlags(): ReadonlySet<string> {
    const out = new Set<string>();
    try {
      const run = this.run;
      const starter = run.party.find((m) => m.uid === run.log.starterUid);
      if (starter && starter.hp > 0) out.add('starterAlive');
      else if (run.log.starterUid) out.add('starterGone');
      if ((run.story.rivals[0]?.encounters ?? 0) > 0) out.add('rivalMet');
      if (run.badges.length >= 8) out.add('badges8');
      if (run.log.battlesWon >= 30) out.add('manyWins');
      if (run.party.length >= 5) out.add('bigParty');
      if (run.party.length <= 3) out.add('smallParty');
      const top = Math.max(0, ...run.party.map((m) => m.level));
      const foeTop = Math.max(0, ...(run.battle?.enemyTeam ?? []).map((m) => m.level));
      if (top >= foeTop) out.add('aceHigh');
    } catch {
      /* no flags: only the plain lines play */
    }
    return out;
  }

  /** The Champion host's own picture when the Galar host is the one speaking (null for anyone else). */
  private hostArtFor(speaker: string): string | null {
    try {
      if (!this.stadium) return null;
      const content = services().session.content;
      const host = galarHost(content, this.run);
      return host.name === speaker ? content.bosses.get(host.id)?.sprites.default ?? null : null;
    } catch {
      return null;
    }
  }

  /** New UI: the broadcast page's tag while an interview plays (set by the stadium director), else null. */
  private rxAirTag: string | null = null;


  private async speak(speaker: string, text: string, voice: SpeechVoice = 'calm', shout = false, artOverride?: { assetId: string; look?: 'crowd' | 'champion' }): Promise<void> {
    const settings = services().session.settings;
    const content = services().session.content;
    interactionLog.tell('say', text, speaker);
    // After the last blow the run's battle is gone: the foe's name and picture are kept from while it lasted, so the leader's closing lines still show them.
    const live = this.run.battle?.trainer;
    const liveArt = this.trainerArt();
    if (live && liveArt) { const b = this.boss(); this.lastFoe = { name: live.name, art: liveArt, title: this.trainerTitle(), role: b ? b.title.replace(b.name, '').trim() || undefined : content.trainers.get(live.classId)?.name }; }
    const trainer = live ?? (this.lastFoe ? { name: this.lastFoe.name, classId: '' } : undefined);
    const art = liveArt ?? this.lastFoe?.art ?? null;
    const isFoe = Boolean(trainer && (speaker === trainer.name || speaker === art?.label || (this.trainerTitle() ?? this.lastFoe?.title)?.endsWith(speaker)));
    const boss = this.boss();
    const role = !isFoe ? undefined : !live && this.lastFoe ? this.lastFoe.role : boss ? (boss.title.replace(boss.name, '').trim() || undefined) : content.trainers.get(trainer?.classId ?? '')?.name;
    const plain = stripSpeechTags(text);
    this.history.push(`${speaker}: “${plain}”`);
    if (this.history.length > 60) this.history.shift();
    const cry = (): void => {
      const mon = this.shown.enemy;
      const species = mon ? content.species.get(mon.speciesId) : undefined;
      if (!isFoe || !this.enemySprite) return;
      if (species) playCry(this, species);
      void hop(this, this.enemySprite, this.motion);
    };
    const look = artOverride?.look ?? (this.stadium && (isFoe ? boss?.role === 'champion' : Boolean(this.hostArtFor(speaker))) ? 'champion' : undefined);
    // New UI: the cut-in is drawn on the canvas, under the HUD layer; the HUD steps aside so nothing covers the words.
    this.rx?.visible(false);
    const line = storyLine(this, {
      speaker,
      role,
      text: shout && !/\[shake\]/.test(text) ? `[shake]${text}[/shake]` : text,
      voice,
      artId: artOverride?.assetId ?? (isFoe ? art?.assetId ?? null : this.hostArtFor(speaker)),
      rim: look === 'champion' ? 0xe0503c : look === 'crowd' ? 0x4ad0e8 : this.foeRim(),
      look,
      dim: look === 'crowd' ? false : undefined,
      motion: this.motion,
      speed: settings.speechSpeed,
      onShout: cry,
    });
    // The bar keeps the line too while the cut-in is up, then gets its own text back.
    const before = this.message.text;
    this.message.setText('');
    await new Promise<void>((resolve) => {
      const auto = settings.autoAdvance ? this.time.delayedCall(MESSAGE_DELAYS[settings.messageDelay] + plain.length * LETTER_MS[settings.speechSpeed] * 1.4, () => line.advance()) : null;
      this.time.delayedCall(120, () => (this.advance = () => line.advance()));
      void line.done.then(() => {
        auto?.remove(false);
        this.advance = null;
        if (this.message.active) this.message.setText(before);
        this.rx?.visible(true);
        resolve();
      });
    });
  }

  private async playEvents(events: RunEvent[], before: RunState, trainer: string | null, storyCues: PresentationCue[] = [], drama: DramaLine[] = []): Promise<void> {
    const { session } = services();
    const content = session.content;
    const { battleAnimations } = session.settings;
    const effectIntensity = capFlash(session.settings.effectIntensity, session.settings.reducedFlash);
    // What the screen shows for each event; worked out from the finished turn, so it can't change it.
    const planned = planCues(events, content, moveAnims(), { mode: battleAnimations, intensity: effectIntensity, shake: session.settings.shakeIntensity, animPack: session.settings.moveAnimPack }, (side) => (this.shown[side] ? abilityOf(content, this.shown[side]) : null));
    // Plugin hooks (S344) may reshape the cues; skipped when animations are off. Presentation only.
    const cues = battleAnimations === 'off' ? planned : applyCueHooks(planned, events);
    // New UI: a pinned card steps aside for the turn's pictures.
    this.rxPin = null;

    this.fellAt = null;
    this.gustShown = false;
    // Pass 8 "End of Turn": the turn's end-of-turn effects as a row of chips that light as each plays.
    const parade = this.clipLevel() !== 'off' && !this.duo ? endTurnParade(events as unknown as ({ type: string } & Record<string, unknown>)[], (id) => content.items.get(id)?.name ?? id.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())) : null;
    const eotAt = parade && parade.chips.length > 0 ? [...parade.at.keys()] : [];
    const eotFirst = eotAt.length ? Math.min(...eotAt) : -1;
    const eotLast = eotAt.length ? Math.max(...eotAt) : -1;
    let eot: EndTurnParade | null = null;
    // Pass 12 "Multi-Hit": a combo counter for each multi-hit move, the total slammed in at the end.
    const combo = this.clipLevel() !== 'off' ? comboPlan(events as unknown as ({ type: string } & Record<string, unknown>)[]) : new Map<number, ComboStep>();
    for (const [index, e] of events.entries()) {
      if (index === eotFirst && parade) {
        try {
          eot = new EndTurnParade(this, parade.chips, 48 + 36 * ((this.wxLook?.current ? 1 : 0) + (this.trLook?.current ? 1 : 0)), this.clipLevel());
          this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => eot?.destroy());
          await eot.open();
        } catch {
          eot = null;
        }
      }
      const chipAt = parade?.at.get(index);
      if (eot && chipAt !== undefined) eot.light(chipAt);
      // New UI: a Rally brace or a signature trait gets its callout for its own line and the stat lines that belong to it.
      if (this.rx) this.rxCall = this.calloutOf(events, index) ?? (keepsCallout(e) ? this.rxCall : null);
      // New UI: the level-up window stays through that Pokémon's level and move lines, then leaves.
      if (this.rxLevel && e.type !== 'levelUp' && e.type !== 'learnedMove' && e.type !== 'wantsMove') this.rxLevel = null;
      // "Charmander used Ember!" goes up before its animation; other messages follow theirs.
      if (e.type === 'move') {
        this.message.setText(eventText(content, this.names(trainer), e) ?? '');
        this.lastMoveType = content.moves.get(e.moveId)?.type ?? 'normal';
        this.phLast = { side: e.side, by: this.shown[e.side] ? this.speciesName(this.shown[e.side]!) : '', move: content.moves.get(e.moveId)?.name ?? '' };
        this.storyBar?.accent(this.lastMoveType);
      }
      // Pass 8 weather: the redesign's entrance replaces the pack's weather picture; a sandstorm gusts once a turn;
      // a move the rain or sun powers up gets its stamp as it hits.
      if ((e.type === 'weather' && this.wxHandles(e.weather)) || (e.type === 'terrain' && this.trHandles(e.terrain))) cues[index] = (cues[index] ?? []).filter((c) => c.kind !== 'commonAnim');
      if (e.type === 'move') this.boostShown = false;
      if (e.type === 'damage' && !this.boostShown && this.wxBoosts(this.lastMoveType)) {
        this.boostShown = true;
        this.wxLook!.boost((word, fill, ink, x, y) => this.wxStamp(word, fill, ink, x, y));
      }
      if (e.type === 'weatherDamage' && e.weather === 'sand' && !this.gustShown) {
        this.gustShown = true;
        this.sandGust();
      }
      if (e.type === 'recoil') this.recoilMoment(e.side);
      // Drain: the lights carry the HP across; they take the pack's heal sparkle's place.
      if (e.type === 'drain' && e.amount > 0 && (await this.drainMoment(e.side))) cues[index] = (cues[index] ?? []).filter((c) => c.kind !== 'commonAnim');
      const step = combo.get(index);
      if (step && 'k' in step) {
        cues[index] = (cues[index] ?? []).filter((c) => c.kind !== 'number');
        this.comboTick(step.side, step.k);
      } else if (step) this.comboEnd(step.side, step.count, step.total);
      await this.fx.play(cues[index] ?? []);
      this.reactPortrait(e);
      await this.stadium?.onEvent(e);
      const side = 'side' in e ? e.side : null;
      if (side === 'enemy' && (e.type === 'ability' || (e.type === 'held' && e.itemId !== 'poke-doll'))) this.noteFoeReveal(e.type === 'ability' ? { ability: e.ability } : { item: e.itemId });
      const box = side === 'enemy' ? this.enemyBox : this.playerBox;
      const sprite = side === 'enemy' ? this.enemySprite : this.playerSprite;
      const mon = side ? this.shown[side] : null;
      let preText: string | null = null;
      if (e.type === 'stat') playSfxLazy(this, e.change > 0 ? 'se.stat_up' : 'se.stat_down', 0.7);
      else if (e.type === 'status') playSfxLazy(this, `se.${e.status}`, 0.7);
      switch (e.type) {
        case 'weather':
          await this.setWeather({ id: e.weather, turns: this.wxTurnsNow(e.weather) }, true);
          break;
        case 'weatherEnd':
          if (this.wxLook?.current) await this.wxLook.end();
          await this.setWeather(null, false);
          break;
        case 'protected':
          this.protectedMoment(e.side);
          break;
        case 'confused':
          // Reduced (no picture cue): the stars still come.
          if (!this.dizzy[e.side]) this.dizzyOn(e.side, false);
          break;
        case 'confusionEnd':
          this.dizzyOff(e.side);
          break;
        case 'terrain':
          await this.setTerrain({ id: e.terrain, turns: this.trTurnsNow(e.terrain) }, true);
          break;
        case 'terrainEnd':
          if (this.trLook?.current) await this.trLook.end();
          await this.setTerrain(null, false);
          break;
        case 'focus':
          this.focusOn(e.side, e.uid);
          break;
        case 'allySwitch':
          await this.allySwitch(e.side);
          break;
        case 'shift':
          // Triple battles: the engine reports both Pokémon that trade places; the first report moves both on screen.
          if (this.shownSpot(e.side, e.uid) === e.from) await this.exchangeSpots(e.side, e.from as Spot, e.to as Spot);
          break;
        case 'damage':
        case 'residual':
        case 'recoil':
        case 'drain':
        case 'heal':
        case 'confusionHit':
        case 'bindDamage':
        case 'seedDamage':
        case 'weatherDamage':
        case 'seaOfFireDamage':
          if (e.type === 'damage' && e.side === 'enemy' && e.hpAfter < mon!.hp) {
            this.phHits++;
            // Phantom UI: a hit that lands hard gets its splash (the knock-out card speaks for a hit that ends it).
            if ((e.effectiveness >= 2 || e.crit) && e.hpAfter > 0 && this.phTurnCards()) await this.phHitCard(mon!, e.hpAfter, e.effectiveness >= 2, !!e.crit);
          }
          if (e.type === 'damage' && e.hpAfter > 0 && e.hpAfter < mon!.hp && bigHit(mon!.hp - e.hpAfter, maxHp(services().session.content, mon!), e.effectiveness, !!e.crit)) {
            this.cheer({ kind: 'hit', on: e.side === 'enemy' ? 'foe' : 'you', superEffective: e.effectiveness >= 2 }, 120);
          }
          // The number itself comes from the event's cue (BattleFx, one per hit: pass 5); this used to float a second one.
          if (e.type === 'damage' && e.hpAfter < mon!.hp) this.buzz(this.lastMoveType, e.effectiveness > 1);
          if (e.type === 'damage' && e.side === 'player' && (e.crit || e.effectiveness >= 2) && e.hpAfter < mon!.hp && this.trainerActor?.sprite.visible) void this.trainerActor.play('hit');
          const froze = this.time.now - this.critFrozeAt < 1500;
          if (e.type === 'damage' && e.crit && !froze) critLetterbox(this, session.settings.critLetterbox, this.motion);
          if (e.type === 'damage' && (e.crit || e.effectiveness >= 2) && !(e.crit && (froze || (e.side === 'enemy' && session.settings.skillPrompts)))) this.cameraMove(e);
          if (e.type === 'damage' && e.crit && e.side === 'enemy' && session.settings.skillPrompts && sprite) await critFreeze(this, { x: sprite.x, y: sprite.y }, this.motion);
          mon!.hp = e.hpAfter;
          if (e.type !== 'drain' && e.type !== 'heal') {
            playSfx(this, e.type === 'damage' && e.effectiveness > 1 ? 'se.hit_strong' : e.type === 'damage' && e.effectiveness < 1 ? 'se.hit_weak' : 'se.hit');
            // Damage from moves blinks in its impact cue; residual damage blinks here.
            if (sprite && e.type !== 'damage' && battleAnimations !== 'off') this.tweens.add({ targets: sprite, alpha: 0.2, yoyo: true, repeat: 2, duration: 70 });
          }
          await this.refreshInfoBox(box, mon!, true);
          break;
        case 'status':
          mon!.status = { id: e.status };
          void this.refreshInfoBox(box, mon!, false);
          break;
        case 'stat':
          // The screen's own count, for the stage pips (pass 8); the engine applied `change` exactly.
          this.statStages[e.side][e.stat] = Phaser.Math.Clamp((this.statStages[e.side][e.stat] ?? 0) + e.change, -6, 6);
          break;
        case 'statsReset':
          this.statStages[e.side] = {};
          break;
        case 'wake':
        case 'thaw':
        case 'cured':
          if (e.type !== 'cured' && !this.duo) this.condEnd(e.side, e.type);
          mon!.status = null;
          void this.refreshInfoBox(box, mon!, false);
          break;
        case 'sacrifice':
          // §29: its rival took the blow; yours is restored, cured and enraged (a red burst, a pause, then the line).
          mon!.hp = e.hpAfter;
          mon!.status = null;
          playSfx(this, 'se.faint');
          if (sprite) await burstReveal(this, sprite.x, sprite.y - 40, 0xff3030, this.motion).done;
          await this.refreshInfoBox(box, mon!, true);
          break;
        case 'lastStand':
          mon!.hp = 1;
          if (sprite) this.tweens.add({ targets: sprite, x: sprite.x + 8, yoyo: true, repeat: 3, duration: 50 });
          await this.refreshInfoBox(box, mon!, true);
          break;
        case 'pmoment': {
          // A revived Pokémon stands back up on the field (the full-screen scene, if any, has already played).
          const live = this.findLive(e.side, e.uid) ?? mon;
          if (e.trigger !== 'lethal' && e.trigger !== 'runEnd') {
            // A small edge (battle start, switch-in, low HP, a KO or a hit taken): only the bars need refreshing (HP, status).
            const fresh = this.findLive('player', e.uid);
            if (fresh && this.shown.player.uid === fresh.uid) {
              this.shown.player.hp = fresh.hp;
              await this.refreshInfoBox(this.playerBox, this.shown.player, true);
            }
            const foe = this.run.battle?.enemyTeam[this.run.battle.enemyIndex];
            if (foe && this.shown.enemy.uid === foe.uid) {
              this.shown.enemy.hp = foe.hp;
              this.shown.enemy.status = foe.status;
              await this.refreshInfoBox(this.enemyBox, this.shown.enemy, true);
            }
          } else if (live && e.side === 'player') {
            live.hp = e.hpAfter;
            this.shown.player = structuredClone(live);
            this.showSprite('player', this.shown.player, false);
            await this.refreshInfoBox(this.playerBox, this.shown.player, true);
          } else if (mon && mon.uid === e.uid) {
            mon.hp = e.hpAfter;
            if (sprite && sprite.alpha < 1) sprite.setAlpha(1);
            await this.refreshInfoBox(box, mon, true);
          }
          break;
        }
        case 'hyper':
          // The first time a Hyper or Overdrive state happens, the battle stops and explains it (why, what it does, what it costs).
          if (e.side === 'player') await this.explainHyper(e.defId);
          // A Hyper moment: hung on, got back up, shook off its status or dug in (or the foe's rage).
          if (e.side === 'enemy') this.riledUid = e.variant === null || e.variant === 'uncontrollable' ? e.uid : null;
          // Beta 4.4: a moment for a Pokémon that isn't on the field never borrows the active Pokémon's HP bar.
          if (mon && e.uid && e.uid !== mon.uid) {
            const live = this.findLive(e.side, e.uid);
            if (live && e.cured) live.status = null;
            break;
          }
          mon!.hp = e.hpAfter;
          if (e.cured) mon!.status = null;
          if (sprite && sprite.alpha < 1) sprite.setAlpha(1);
          await this.refreshInfoBox(box, mon!, true);
          // Defiance struck the foe back; Protective Instinct hurt the teammate that stepped in.
          if (e.foeHpAfter !== undefined && this.shown.enemy && (!e.foeUid || e.foeUid === this.shown.enemy.uid)) {
            this.shown.enemy.hp = e.foeHpAfter;
            await this.refreshInfoBox(this.enemyBox, this.shown.enemy, true);
          }
          if (e.proxy) {
            const mate = this.run.party.find((p) => p.uid === e.proxy!.uid);
            if (mate) mate.hp = e.proxy.hpAfter;
          }
          break;
        case 'selfKo':
          mon!.hp = 0;
          await this.refreshInfoBox(box, mon!, true);
          break;
        case 'faint':
          mon!.hp = 0;
          playSfx(this, 'se.faint');
          this.cheer({ kind: 'faint', on: e.side === 'enemy' ? 'foe' : 'you' }, 250);
          if (!this.cameraMove(e)) this.focusPush('ko');
          if (sprite) {
            if (e.side === 'enemy') this.fellAt = { x: sprite.x, y: this.spotXY('enemy').y };
            await this.faintMoment(e.side, sprite);
          }
          if (e.side === 'enemy' && mon && this.phTurnCards()) await this.phKoCard(mon, before, trainer, events.slice(0, index + 1).filter((x) => x.type === 'faint' && x.side === 'enemy').length);
          break;
        case 'miss':
          // The target sees it coming (redesign pass 2). Presentation only; the miss itself is already decided.
          await this.missMoment(e.side);
          break;
        case 'switchOut': {
          if (sprite) this.tweens.killTweensOf(sprite);
          // Your trainer leans in holding the ball out, takes the Pokémon back and steps away.
          const actor = e.side === 'player' && this.trainerActor ? await this.trainerIn() : null;
          const pose = actor?.play('recall');
          if (sprite) await this.recallMoment(e.side, sprite, actor ? actor.hand() : null);
          await pose;
          if (actor) this.trainerOut();
          break;
        }
        case 'evolved': {
          // The Pokémon evolves between turns (a foe in a drama, or a story moment): the full evolution scene plays
          // over the battle (the rules already decided it), then the battle shows the new form and its HP.
          const shiny = !!mon?.shiny;
          if (this.rx) {
            this.rxEvolve = { from: monFile(this, e.from, 'front', shiny), to: monFile(this, e.to, 'front', shiny), done: false };
            this.rx.refresh();
          }
          await playEvolution(this, { from: e.from, to: e.to, shiny, foe: e.side === 'enemy' });
          this.rxEvolve = null;
          if (mon) {
            mon.speciesId = e.to;
            mon.hp = e.hpAfter;
            if (e.side === 'enemy') await this.ensureArt(e.to);
            this.showSprite(e.side, mon);
            this.rx?.refresh();
            await this.refreshInfoBox(box, mon, false);
          }
          break;
        }
        case 'switchIn': {
          const incoming = this.findMon(before, e.uid);
          if (incoming) {
            this.shown[e.side] = structuredClone(incoming);
            this.statStages[e.side] = {};
            if (e.side === 'enemy') this.phHits = 0;
            const ace = e.side === 'enemy' && !!this.run.battle?.trainer && isEnemyAce(this.run.battle, e.uid);
            const hand = e.side === 'player' && this.trainerActor ? await this.throwMoment() : null;
            const lookAt = e.side === 'enemy' ? { x: 560, y: ENEMY_POS.y - 20 } : { x: 400, y: PLAYER_POS.y - 100 };
            if (!this.camBusy && !this.camPinned) {
              this.camPinned = true;
              cameraTo(this, this.motion, lookAt, 1.12, 350);
            }
            if (e.side === 'enemy') await this.ensureArt(this.shown.enemy!.speciesId);
            // A trainer's designated ace (battle.aceUid, not the last slot) is announced BEFORE it lands (Kice: an ace
            // must be announced when sent out; animation redesign pass 15, Ace Call): the trainer speaks, the ace's
            // card plays, and then the ace leaps onto the field. Presentation only.
            if (ace) {
              await this.say(`${this.trainerTitle() ?? this.run.battle!.trainer!.name} sends out their ace, ${this.speciesName(this.shown.enemy!)}!`);
              await this.aceCall();
              await this.aceLandMoment(this.shown.enemy!);
              if (this.role === 'rival') void this.fx.flourish('enemy', 'rival.ace');
            } else {
              const sentMon = this.shown[e.side]!;
              const from = e.side === 'enemy' ? await this.foeThrowMoment() : hand;
              await this.sendMoment(e.side, sentMon, from, () => void this.refreshInfoBox(e.side === 'enemy' ? this.enemyBox : this.playerBox, sentMon, false));
            }
            this.applyTeraTint(e.side, this.shown[e.side]);
            if (this.camPinned) {
              cameraTo(this, this.motion, null, 1, 350);
              this.camPinned = false;
            }
            await this.refreshInfoBox(e.side === 'enemy' ? this.enemyBox : this.playerBox, this.shown[e.side], false);
          }
          break;
        }
        case 'item': {
          playSfxLazy(this, 'ui.use_item', 0.8);
          // The trainer's own item (a Hyper Potion) says so, and fills the foe's box rather than yours.
          const foeItem = this.shown.enemy && e.targetUid === this.shown.enemy.uid;
          preText = foeItem ? e.message : `You used the ${content.items.get(e.itemId)?.name ?? 'item'}!`;
          if (foeItem && this.shown.enemy) {
            this.shown.enemy.hp = e.hpAfter;
            await this.refreshInfoBox(this.enemyBox, this.shown.enemy, true);
          }
          break;
        }
        case 'held': {
          // A held item did something: show its HP, status and held items as they are now.
          if (mon) {
            if (e.hpAfter !== undefined) mon.hp = e.hpAfter;
            if (e.what === 'cure') mon.status = null;
            if (e.what === 'orb') mon.status = this.findLive(side!, mon.uid)?.status ?? mon.status;
            await this.refreshInfoBox(box, mon, e.hpAfter !== undefined);
          }
          break;
        }
        case 'transform': {
          if (e.kind === 'ability') await this.ensureArt(e.to, e.side === 'player');
          // Presentation only: a cinematic for the big moments (battleFx/cinematics.ts), then the new form's sprite.
          if (e.kind === 'mega' && e.itemId) await this.say(`${this.speciesName(mon!)}'s ${content.items.get(e.itemId)?.name ?? 'Mega Stone'} is reacting to your Mega Ring!`);
          // A Z-Move flashes in its type's colour.
          const zBase = e.kind === 'zmove' && e.moveId ? content.moves.get(e.moveId) : undefined;
          const zType = zBase?.type;
          const teraType = e.kind === 'tera' ? this.run.battle?.transform.teraTypes[mon!.uid] : undefined;
          const isMax = e.kind === 'dynamax' || e.kind === 'gigantamax' || e.kind === 'dynamaxEnd';
          const glowColor = zType ? (TYPE_COLORS[zType] ?? 0xffffff) : teraType ? (TYPE_COLORS[teraType] ?? 0xffffff) : isMax ? 0xff3060 : e.kind === 'primal' ? (e.to.includes('kyogre') ? 0x3a7bff : 0xff4a2a) : 0xd070ff;
          const swapForm = () => {
            if (e.kind === 'tera' || e.kind === 'zmove') return;
            // Dynamax doubles HP (and its end halves it again), the same way the battle rules do.
            const before = calcStats(content, mon!).hp;
            mon!.speciesId = e.to;
            if (e.kind === 'dynamaxEnd') delete mon!.dynamaxed;
            else if (isMax) mon!.dynamaxed = true;
            if ((isMax || e.kind === 'ability') && mon!.hp > 0) mon!.hp = Math.max(1, Math.round((mon!.hp * calcStats(content, mon!).hp) / before));
            return this.showSprite(e.side, mon!, e.kind !== 'dynamaxEnd');
          };
          const at = this.spotXY(e.side);
          const cine: CineKind | null = e.kind === 'mega' || e.kind === 'primal' || e.kind === 'dynamax' || e.kind === 'gigantamax' || e.kind === 'dynamaxEnd' || e.kind === 'zmove' || e.kind === 'tera' ? e.kind : null;
          // Phantom UI: the transformation's own cut-in card (the mock-ups' mega / tera / dmax / zmove pages) stands in
          // for the long reference scene; the short cinematic under it then swaps the form. The Fast settings skip it too.
          const st0 = services().session.settings;
          const quick = cine === 'zmove' ? st0.fastZMove : cine === 'tera' ? st0.fastTera : cine === 'dynamax' || cine === 'gigantamax' ? st0.fastDynamax : st0.fastMega;
          const phCard = !!this.rx && phantomOn() && this.motion === 'full' && !!mon && !!cine && cine !== 'dynamaxEnd' && !quick;
          if (phCard) await this.phGimmickCard(e.side, mon!, cine as GimmickCard['kind'], { to: e.to, itemId: e.itemId ?? null, teraType: teraType ?? null, zBase: zBase ?? null, zMoveId: e.zMoveId ?? null });
          if (!phCard && cine === 'zmove' && this.motion === 'full' && !services().session.settings.fastZMove && mon) {
            // The remade scene (Fast Z-Move off), animation redesign pass 20: the Z rises, the Pokémon leaves the top of the
            // screen, the sky looks down on the target as it arrives, the damage is counted out, and the title and facts hold.
            const zMove = e.zMoveId ? (content.moves.get(e.zMoveId) ?? null) : zBase ? zMoveFor(content, zBase) : null;
            const sp = content.species.get(mon.speciesId)!;
            const mine = e.side === 'player';
            const other = this.shown[mine ? 'enemy' : 'player'];
            const otherSp = other ? content.species.get(other.speciesId) : null;
            const crystalId = e.itemId ?? (zBase ? ownedZCrystal(content, this.run.inventory, zBase.type) : null);
            const feel = this.cineFeel('zmove');
            const titleKey = zMove ? zTitleAssetId(zMove.id) : null;
            if (titleKey && !this.textures.exists(titleKey) && services().assets.has(titleKey)) await loadAssets(this, [titleKey]).catch(() => undefined);
            await this.loadFronts([[sp.id, !!mon.shiny], ...(other ? [[other.speciesId, !!other.shiny] as [string, boolean]] : [])]);
            // What the hit did is already decided by the rules: the first damage to the other side before anyone else moves.
            let hit: { damage: number; effectiveness: number } | null = null;
            for (const later of events.slice(index + 1)) {
              if (later.type === 'move' && later.side !== e.side) break;
              if (later.type === 'damage' && later.side !== e.side) {
                hit = { damage: later.amount, effectiveness: later.effectiveness };
                break;
              }
            }
            await this.gimmickBeat(
              zMoveSky(this, {
                field: () => (mine ? this.playerSprite : this.enemySprite),
                makeFront: (x, y) => pokemonVisual(this, sp, 'front', x, y, PIXEL_SCALE, mon.shiny),
                makeTarget: other && otherSp ? (x, y) => pokemonVisual(this, otherSp, 'front', x, y, PIXEL_SCALE, other.shiny) : null,
                opposes: !mine,
                tint: glowColor,
                page: this.gimmickPage('zmove', mon, { item: crystalId ? content.items.get(crystalId)?.name : undefined, from: zBase?.name, move: zMove?.name }),
                itemKey: 'cine.key.zmove',
                titleKey,
                title: zMove?.name ?? null,
                hit,
                intensity: feel.intensity,
                shake: feel.shake,
                speed: feel.speed,
                particles: !services().session.settings.reduceParticles,
              }),
            );
            playSfx(this, 'se.level_up');
          } else if (!phCard && cine === 'tera' && this.motion === 'full' && !services().session.settings.fastTera && mon && teraType) {
            // The remade scene (Fast Tera off), animation redesign pass 20: one crystal closes over it, the camera goes inside,
            // twelve mirrored slices turn like a kaleidoscope and fold into the crown, and the crystal breaks on the field.
            const sp = content.species.get(mon.speciesId)!;
            const mine = e.side === 'player';
            const feel = this.cineFeel('tera');
            const stellar = mon.speciesId.startsWith('terapagos');
            await this.loadFronts([[sp.id, !!mon.shiny]]);
            await this.gimmickBeat(
              teraJewel(this, {
                field: () => (mine ? this.playerSprite : this.enemySprite),
                makeFront: (x, y) => pokemonVisual(this, sp, 'front', x, y, PIXEL_SCALE, mon.shiny),
                opposes: !mine,
                tint: glowColor,
                onReveal: () => this.applyTeraTint(e.side, mon),
                page: this.gimmickPage('tera', mon, { type: teraType }),
                itemKey: 'cine.key.tera',
                jewel: this.textures.exists('ui.tera.types') ? { key: 'ui.tera.types', frame: TERA_ICON_ROW[stellar ? 'stellar' : teraType] ?? 0 } : null,
                intensity: feel.intensity,
                shake: feel.shake,
                speed: feel.speed,
                particles: !services().session.settings.reduceParticles,
              }),
            );
            playSfx(this, 'se.level_up');
          } else if (!phCard && cine === 'mega' && this.motion === 'full' && !services().session.settings.fastMega && mon) {
            // The remade scene (Fast Mega off), animation redesign pass 20: a helix of colour, cracks to every edge,
            // the new picture slams together from glass shards, locks with its title and facts, and shatters back to the field.
            const to = content.species.get(e.to) ?? content.species.get(mon.speciesId)!;
            const mine = e.side === 'player';
            const feel = this.cineFeel('mega');
            const ids = pokemonAssetIds(to.assets);
            await loadAssets(this, (mon.shiny ? [ids.front, ids.shinyFront] : [ids.front]).filter((id) => services().assets.has(id))).catch(() => undefined);
            const plate = (mine ? this.playerBox : this.enemyBox).container;
            await this.gimmickBeat(
              megaGlass(this, {
                field: () => (mine ? this.playerSprite : this.enemySprite),
                makeMegaFront: (x, y) => pokemonVisual(this, to, 'front', x, y, PIXEL_SCALE, mon.shiny),
                opposes: !mine,
                onSwap: () => void swapForm(),
                page: this.megaPage(mon, e.to, e.itemId ?? null),
                itemKey: 'cine.key.mega',
                plate: plate ? { x: plate.x + 60, y: plate.y + 20 } : null,
                intensity: feel.intensity,
                shake: feel.shake,
                speed: feel.speed,
                particles: !services().session.settings.reduceParticles,
              }),
            );
          } else if (!phCard && (cine === 'dynamax' || cine === 'gigantamax') && this.motion === 'full' && !services().session.settings.fastDynamax && mon && (e.side === 'player' ? this.playerArt() : this.run.battle?.trainer ? this.trainerArt() : null)) {
            // The remade scene (Fast Dynamax off), animation redesign pass 20: recalled, the ball swells and is thrown out of
            // the top of the screen, then one long camera climb from the trainer's shoes to the giant's face above the storm.
            const from = content.species.get(mon.speciesId)!;
            const to = content.species.get(e.to) ?? from;
            const mine = e.side === 'player';
            const feel = this.cineFeel(cine);
            const fronts = [from, to].flatMap((sp) => { const ids = pokemonAssetIds(sp.assets); return mon.shiny ? [ids.front, ids.shinyFront] : [ids.front]; });
            await loadAssets(this, fronts.filter((id) => services().assets.has(id))).catch(() => undefined);
            const pArt = mine ? this.playerArt() : null;
            const fArt = mine ? null : this.trainerArt();
            const other = this.shown[mine ? 'enemy' : 'player'];
            const otherSp = other ? content.species.get(other.speciesId) : null;
            if (other) await this.loadFronts([[other.speciesId, !!other.shiny]]);
            const hpNow = mon.hp;
            const hpBig = Math.max(1, Math.round((mon.hp * calcStats(content, { ...mon, speciesId: e.to, dynamaxed: true }).hp) / Math.max(1, calcStats(content, mon).hp)));
            await this.gimmickBeat(
              dynamaxPan(this, {
                kind: cine,
                field: () => (mine ? this.playerSprite : this.enemySprite),
                makeGiantFront: (x, y) => pokemonVisual(this, to, 'front', x, y, PIXEL_SCALE, mon.shiny),
                makeTrainer: pArt ? (x, y) => trainerVisual(this, pArt, 'Trainer', x, y, 2) : fArt ? (x, y) => trainerVisual(this, fArt.assetId, fArt.label, x, y, 2) : null,
                makeOther: other && otherSp ? (x, y) => pokemonVisual(this, otherSp, 'front', x, y, PIXEL_SCALE, other.shiny) : null,
                ballItem: mon.caughtBall ?? DEFAULT_BALL,
                opposes: !mine,
                onSwap: () => void swapForm(),
                page: this.gimmickPage(cine, mon, { hp: [hpNow, hpBig], turns: this.run.battle?.transform.dynamax[mon.uid] ?? content.balance.transformations.dynamaxTurns, gmax: cine === 'gigantamax' ? to.name.replace(/^Gigantamax /i, '') : undefined }),
                itemKey: keyItemFor(cine),
                cloudKey: dynamaxPatternKey(mon.speciesId),
                intensity: feel.intensity,
                shake: feel.shake,
                speed: feel.speed,
                particles: !services().session.settings.reduceParticles,
              }),
            );
          } else if (cine) {
            const zMove = e.zMoveId ? (content.moves.get(e.zMoveId) ?? null) : zBase ? zMoveFor(content, zBase) : null;
            await this.gimmickBeat(
              cinematic(this, {
                kind: cine,
                x: at.x,
                y: at.y - 80,
                sprite: e.side === 'player' ? this.playerSprite : this.enemySprite,
                tint: glowColor,
                ...(mon?.caughtBall ? { ball: mon.caughtBall } : {}),
                ...(cine === 'gigantamax' ? { accent: TYPE_COLORS[content.species.get(e.to)?.types[0] ?? ''] ?? 0xffd24a, gmaxName: `G-MAX ${(content.species.get(e.to)?.name ?? '').replace(/^Gigantamax /i, '').toUpperCase()}`.trim() } : {}),
                crystal: e.kind === 'primal' ? (e.to.includes('kyogre') ? 'alpha' : 'omega') : 'mega',
                title: zMove?.name,
                titleId: zMove?.id,
                ...this.cineFeel(cine),
                trainer: e.side === 'player' ? () => { const art = this.playerArt(); return art ? trainerBackVisual(this, art, at.x - 170, at.y + 10, 260) : null; } : undefined,
                fast: services().session.settings.fastDynamax,
                enemySide: e.side === 'enemy',
                calyrex: mon!.speciesId.startsWith('calyrex'),
                trainerFront: e.side === 'player'
                  ? () => { const art = this.playerArt(); return art ? trainerVisual(this, art, 'Trainer', at.x - 190, at.y + 10, 2) : null; }
                  : !this.run.battle?.trainer
                    ? undefined
                    : () => { const art = this.trainerArt(); return art ? trainerVisual(this, art.assetId, art.label, at.x + 190, at.y + 10, 2) : null; },
                onSwap: swapForm,
              }),
            );
            if (e.kind === 'tera' || e.kind === 'zmove') playSfx(this, 'se.level_up');
          } else {
            if (e.kind !== 'illusion') await burstReveal(this, at.x, at.y - 80, glowColor, this.motion).done;
            swapForm();
          }
          this.applyTeraTint(e.side, mon!);
          await this.refreshInfoBox(box, mon!, false);
          // New UI: the player's first Mega Evolution of the run gets the mock-ups' cutscene card.
          if (this.rx && e.kind === 'mega' && e.side === 'player' && mon && !SEEN_MOMENTS.has(`megaFirst.${this.run.seed}`)) {
            const file = monFile(this, e.to, 'front', !!mon.shiny);
            await this.bigMoment('mega', `megaFirst.${this.run.seed}`, 'Mega Evolution', content.species.get(e.to)?.name ?? this.speciesName(mon), false, { role: 'Mega Evolution', line: 'The stone answers the bracelet.', cast: this.rxMe(), mon: file ? { file, atlas: true } : null });
          }
          break;
        }
        case 'ball':
          await this.say(`You threw a ${content.items.get(e.itemId)?.name ?? 'ball'}!`);
          await this.animateBall(e.itemId, e.shakes, e.caught);
          if (e.caught) await this.fx.flourish('enemy', 'interaction.catch', ENEMY_POS);
          break;
        case 'xp':
          this.phTallyAdd(e.uid, before, e.amount, null);
          if (this.rx) this.rxExp.set(e.uid, { amount: (this.rxExp.get(e.uid)?.amount ?? 0) + e.amount, level: this.rxExp.get(e.uid)?.level ?? null, was: this.rxExp.get(e.uid)?.was ?? before.party.find((m) => m.uid === e.uid) });
          if (e.uid === this.shown.player.uid) {
            this.shown.player.xp += e.amount;
            // A fallen foe's experience leaves it as lights and flies to your bar (redesign pass 23); the bar fills as they arrive.
            const fell = this.fellAt;
            this.fellAt = null;
            if (fell && !this.duo) await new Promise<void>((arrive) => void playClip(this, expLightsClip(fell, this.expBarPoint(), this.clipLevel()), this.clipHost({}, { cue: () => arrive() })).done.then(arrive));
            playSfx(this, 'se.exp', 0.6);
            void this.refreshInfoBox(this.playerBox, this.shown.player, true);
          }
          break;
        case 'levelUp':
          playSfx(this, 'se.level_up');
          this.phTallyAdd(e.uid, before, 0, e.level);
          if (this.rx) this.rxExp.set(e.uid, { amount: this.rxExp.get(e.uid)?.amount ?? 0, level: e.level, was: this.rxExp.get(e.uid)?.was ?? before.party.find((m) => m.uid === e.uid) });
          if (this.rx) {
            // The step shown starts at the level it had before this Exp (several levels can come at once).
            const was = this.rxLevels.get(e.uid) ?? before.party.find((m) => m.uid === e.uid)?.level ?? e.level - 1;
            this.rxLevel = this.levelWindow(e.uid, Math.min(was, e.level - 1), e.level, before.party.find((m) => m.uid === e.uid));
            this.rxLevels.set(e.uid, e.level);
          }
          if (e.uid === this.shown.player.uid) {
            const real = this.run.party.find((m) => m.uid === e.uid);
            this.shown.player.level = e.level;
            if (real && real.level === e.level) this.shown.player.hp = real.hp;
            void this.refreshInfoBox(this.playerBox, this.shown.player, false);
            this.levelUpMoment(e.level);
          }
          break;
        default:
          break;
      }
      if (preText) await this.say(preText);
      if (e.type === 'item' && e.targetUid === this.shown.player.uid) {
        this.shown.player.hp = e.hpAfter;
        const real = this.run.party.find((m) => m.uid === e.targetUid);
        if (real) this.shown.player.status = real.status;
        await this.refreshInfoBox(this.playerBox, this.shown.player, true);
      }
      // Signature charge-ups (catalog 21), only where a mechanic really charges: a two-turn move,
      // a raid boss's telegraphed attack, a boss gathering everything it has.
      const charge = this.chargeFor(e, storyCues.find((c) => c.at === index));
      if (charge) {
        const at = this.spotXY(charge.side);
        await this.playBeat(chargeUp(this, { x: at.x, y: at.y - 80, tint: charge.tint, label: charge.label, motion: this.motion, intensity: effectIntensity }));
      }
      // A raid/totem phase change gets a banner with its written rule.
      if (e.type === 'raid' && e.tone === 'phase') this.focusPush('phase');
      if (e.type === 'raid' && e.tone === 'phase') this.arenaLight?.set(++this.arenaPhase, 0xff4fd8);
      // Phantom UI: the phase card (a boss's last stand, a raid's next phase) stands in for the banner.
      if (e.type === 'raid' && e.tone === 'phase' && !(this.phTurnCards() && (await this.phPhaseCard(e.text)))) await this.playBeat(phaseBanner(this, e.text, 0xff4fd8, this.motion));
      // Beta 0.7 Flight North: the shiny rescuer, or the Bug-type's return, swoops onto the field. A failed load only skips the picture.
      if (e.type === 'raid' && e.cameo) {
        try {
          const sp = content.species.get(e.cameo.speciesId);
          if (sp) {
            await loadAssets(this, pokemonArtIds([sp], { front: true, back: false, shiny: e.cameo.shiny, cry: false })).catch(() => undefined);
            const at = this.spotXY('player');
            const vis = pokemonVisual(this, sp, 'front', at.x + 90, at.y, PIXEL_SCALE * 1.3, e.cameo.shiny, {});
            await this.playBeat(cameoBeat(this, vis, { x: at.x + 90, y: at.y - 40 }, e.cameo.kind, this.motion));
          }
        } catch (err) {
          console.warn('Cameo failed', err);
        }
      }
      // A story moment replaces the event's own line with its own (and a banner when it is a major one).
      const cue = storyCues.find((c) => c.at === index);
      if (cue) {
        this.showMoment(cue, battleAnimations === 'full' && effectIntensity > 0);
        for (const line of cue.messages) await this.say(line);
      } else {
        const text = eventText(content, this.names(trainer), e, session.settings.damageDetails);
        if (text) await this.say(text, AUTO_EVENTS.has(e.type));
      }
      // What the trainer says about it (spoken lines, after the event's own text).
      for (const line of drama.filter((d) => d.at === index)) await this.sayTrainer(line);
      this.reskin();
      if (eot && index === eotLast) {
        const turn = this.run.battle?.turn;
        if (turn) await eot.close(Math.max(1, turn - 1), turn);
        else eot.destroy();
        eot = null;
      }
    }
    eot?.destroy();
    this.comboText?.destroy();
    this.comboText = null;
    // Make sure the boxes match the real state at the end of the turn.
    const run = this.run;
    if (run.battle?.doubles && this.duo) await this.syncDuo();
    else if (run.battle) {
      const active = run.party[run.battle.activeIndex];
      if (active && active.uid === this.shown.player.uid) {
        this.shown.player = structuredClone(active);
        this.disguise('player', this.shown.player);
        await this.refreshInfoBox(this.playerBox, this.shown.player, false);
      }
      this.shown.enemy = structuredClone(currentEnemy(run.battle));
      this.disguise('enemy', this.shown.enemy);
      await this.refreshInfoBox(this.enemyBox, this.shown.enemy, false);
    } else {
      const active = run.party.find((m) => m.uid === this.shown.player.uid);
      if (active) await this.refreshInfoBox(this.playerBox, active, false);
    }
    this.reskin();
    this.updateHeader();
    // The weather chip counts down with the turns.
    const wx = run.battle?.weather;
    if (wx && this.wxLook?.current === wx.id) this.wxLook.chip(wxTurns(wx.turns));
    const tr = run.battle?.terrain;
    if (tr && this.trLook?.current === tr.id) this.trLook.chip(wxTurns(tr.turns));
  }

  /**
   * A story moment's banner and aura. Presentation only: it never touches the
   * run, and if it fails the battle carries on with just the text.
   */
  /** `motion` is false under reduced motion or no animations: the banner still shows, without shake or aura. */
  private showMoment(cue: PresentationCue, motion: boolean): void {
    this.poseForCue(cue);
    if (!cue.major) return;
    try {
      const color = Phaser.Display.Color.HexStringToColor(cue.color).color;
      if (cue.sound) playSfx(this, cue.sound);
      if (cue.shake && motion) this.cameras.main.shake(220, 0.006 * services().session.settings.shakeIntensity * services().session.settings.shakeHits);
      const band = this.add.rectangle(GAME_WIDTH / 2, 132, GAME_WIDTH, 54, color, 0.85).setDepth(50).setAlpha(0);
      const title = this.add.text(GAME_WIDTH / 2, 132, cue.title, textStyle(30, '#ffffff', { stroke: '#202030', strokeThickness: 4 })).setOrigin(0.5).setDepth(51).setAlpha(0);
      // A bouncy pop-in (no movement when motion is reduced).
      if (motion) {
        title.setScale(0.5);
        this.tweens.add({ targets: title, scale: 1, duration: 320, ease: 'Back.easeOut' });
      }
      this.tweens.add({ targets: [band, title], alpha: 1, duration: 180, hold: 1300, yoyo: true, onComplete: () => { band.destroy(); title.destroy(); } });
      if (motion) {
        const at = cue.side === 'enemy' ? ENEMY_POS : PLAYER_POS;
        const aura = this.add.circle(at.x, at.y - 40, 90, color, 0.35).setDepth(1).setScale(0.6);
        this.tweens.add({ targets: aura, scale: 1.3, alpha: 0, duration: 900, onComplete: () => aura.destroy() });
      }
    } catch (err) {
      console.warn('Story moment could not be shown', err);
    }
  }

  /** A moment's pose and emote bubble on the Pokémon it is about (cue ids -> story.json category). Presentation only. */
  private poseForCue(cue: PresentationCue): void {
    const { battleAnimations } = services().session.settings;
    if (battleAnimations === 'off' || !cue.ids?.length) return;
    const defs = services().session.content.story.definitions;
    const look = poseForMoments(cue.ids.flatMap((id) => defs.filter((d) => d.id === id)));
    if (look) poseMoment(this, cue.side === 'enemy' ? this.enemySprite : this.playerSprite, look, this.motion);
  }

  /** Throw, wobble, and either click shut or burst open. */
  private async animateBall(itemId: string, shakes: number, caught: boolean): Promise<void> {
    const item = services().session.content.items.get(itemId);
    // The trainer throws it (Overhaul P2/P3): the ball leaves the hand on the release frame; without a trainer it starts at the left edge.
    let hand = { x: 200, y: 380 };
    const actor = await this.trainerIn();
    if (actor) {
      this.trainerOut(1200);
      let release: (() => void) | undefined;
      const released = new Promise<void>((resolve) => (release = resolve));
      const played = actor.play('sendOut', { onRelease: (h) => { hand = h; release?.(); } });
      await Promise.race([released, played]);
    }
    const ball = ballVisual(this, itemId, hand.x, hand.y, 3);
    playSfx(this, 'se.ball_throw');
    const targetY = ENEMY_POS.y - 60;
    await tween(this, { targets: ball, x: ENEMY_POS.x, y: targetY, duration: 450, ease: 'Quad.easeOut' });
    if (this.enemySprite) this.tweens.killTweensOf(this.enemySprite);
    if (this.enemySprite) await tween(this, { targets: this.enemySprite, scale: 0.01, alpha: 0, duration: 250 });
    await tween(this, { targets: ball, y: ENEMY_POS.y - 20, duration: 250, ease: 'Bounce.easeOut' });
    for (let i = 0; i < shakes; i++) {
      await sleep(this, 250);
      playSfx(this, 'se.ball_shake');
      await tween(this, { targets: ball, angle: i % 2 === 0 ? 20 : -20, duration: 120, yoyo: true });
    }
    await sleep(this, 250);
    if (caught) {
      playSfx(this, 'se.ball_catch');
      const reveal = burstReveal(this, ball.x, ball.y, 0xfff0a0, this.motion);
      // Seal Case: a ring of coloured bursts around the ball.
      if (hasPerk(services().session.content, this.run, 'sealCase')) {
        for (const [i, colour] of [0xff80c0, 0x80d0ff, 0xa0ff90, 0xffd060].entries()) burstReveal(this, ball.x + (i - 1.5) * 34, ball.y - 24 + (i % 2) * 36, colour, this.motion);
      }
      await tween(this, { targets: ball, alpha: 0.6, duration: 150, yoyo: true });
      // A shiny catch gets its own gold ring and sparkles.
      if (this.shown.enemy.shiny) {
        playSfx(this, 'se.shiny');
        await shinyCatchBurst(this, ball.x, ball.y, this.motion);
      }
      await reveal.done;
      return;
    }
    playSfx(this, 'se.ball_release');
    ball.destroy();
    this.showSprite('enemy', this.shown.enemy);
  }
}
