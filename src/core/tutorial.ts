// The optional tutorial (nine professors, one per area) and the update log.
// Pure data and functions; no Phaser. The scenes (WelcomeScene, TutorialScene) draw it.
// Progress lives in Settings: `lastSeenUpdate`, `tutorialOffered`, `tutorialDone`.

import type { Settings } from './state';

/** The version whose patch notes are the newest. Bump it (and add an UPDATE_LOG entry) to show notes again. */
export const GAME_UPDATE_ID = 'beta-0.4';

export interface TutorialCategory {
  id: string;
  professor: string;
  title: string;
  /** One line shown in the picker. */
  blurb: string;
  /** Each string is one page of the professor's talk. */
  pages: string[];
}

export const TUTORIAL_CATEGORIES: readonly TutorialCategory[] = [
  {
    id: 'basics', professor: 'Prof. Oak', title: 'Welcome & Runs', blurb: 'What a run is and how the map works.',
    pages: [
      'Hello there! Pocket Raiders is a roguelike: you start a run with a starter, climb through regions, and every choice counts.',
      'The map shows your next stops: battles, shops, events, camps and trades. Pick a stop, resolve it, then pick the next one.',
      'Open the map menu and pick Run to see everything switched on for this run: rules, picks, time, tide, the stage bounty and events. When a run ends, press S to save a run card picture.',
      'If your team faints, the run ends, but your Legacy, badges and unlocks stay. Each new run is another chance.',
    ],
  },
  {
    id: 'bonds', professor: 'Prof. Elm', title: 'Care & Bonds', blurb: 'Petting, feeding, moods and friendship.',
    pages: [
      'Pokémon are partners, not tools! Pet, hug, feed, groom, cheer and train them to build a bond.',
      'Each Pokémon has a mood, fatigue and talents. Rest at camps, and check their journal to learn what they like.',
      'Strong bonds unlock party scenes, team dances, healing circles and sparring. Give nicknames to make them yours.',
    ],
  },
  {
    id: 'catching', professor: 'Prof. Birch', title: 'Wild Pokémon & Camps', blurb: 'Catching, expeditions and camp crafting.',
    pages: [
      'Out in the wild you can weaken and catch Pokémon. Better balls and lower HP mean better odds.',
      'Expeditions send you into riskier areas for bigger rewards. Pack healing items before you go.',
      'At camp you can cook, craft gadgets, use the bench and rummage for supplies. Camp is where a run is won quietly.',
    ],
  },
  {
    id: 'battle', professor: 'Prof. Rowan', title: 'Battle Basics', blurb: 'Types, moves, speed and doubles.',
    pages: [
      'Battles are turn based. Pick a move; the faster Pokémon usually goes first. Type matchups change damage a lot.',
      'Watch for status conditions, hazards and field effects. Type resonance and bleed add depth to long fights.',
      'Doubles put two Pokémon on each side. Auto-Battle can play single battles for you (Settings > Gameplay).',
    ],
  },
  {
    id: 'team', professor: 'Prof. Juniper', title: 'Building a Team', blurb: 'Starters, evolution and mastery.',
    pages: [
      'Your starter shapes the early game, but any Pokémon you recruit can become a star. Balance types and roles.',
      'Pokémon evolve as they level up. Preview an evolution before you commit; some forms change with the season.',
      'Mastery stars grow as each party member fights with you. Keep your favorites alive and they will repay you.',
    ],
  },
  {
    id: 'power', professor: 'Prof. Sycamore', title: 'Mega, Z, Dynamax & Tera', blurb: 'The big transformation moments.',
    pages: [
      'Mega Evolution, Z-Moves, Dynamax and Terastallization are one-time power moments in a battle.',
      'Each has its own cutscene. You can tune or skip them any time in Settings > Animations.',
      'Save your power moment for the toughest enemy: a boss, a raid, or a rival ace.',
    ],
  },
  {
    id: 'town', professor: 'Prof. Kukui', title: 'Hub Town & Shops', blurb: 'The walkable town, six shops, the Plaza.',
    pages: [
      'Your home is Hub Town. Walk the streets, enter buildings and chat with the crowd. Press M for the minimap.',
      'Six shops, six personalities: Poké Mart, Aero Boutique, Kecleon\'s Bazaar (haggle!), Supply Depot, PokéNet Web Store and the Night Market after dark.',
      'The Trainer Plaza is for trades and social play. Prefer the classic menu? Settings > Hub style switches to the Arena Lobby.',
    ],
  },
  {
    id: 'rivals', professor: 'Prof. Magnolia', title: 'Rivals, Raids & Legacy', blurb: 'Nemesis rivals, raids, Totems and what lasts.',
    pages: [
      'Rivals remember you. Beat them, lose to them, make promises: the rivalry carries across runs through your Legacy.',
      'Raids and Totem battles are boss fights with their own cards and phases. Bring a team that can take a beating.',
      'Run-end letters, the Memorial Wall and Legacy Eggs turn every run into something you keep.',
    ],
  },
  {
    id: 'modes', professor: 'Prof. Sada & Turo', title: 'Modes, Settings & Saves', blurb: 'Nuzlocke, modifiers, accessibility, saving.',
    pages: [
      'Want a challenge? Try Nuzlocke, Hardcore Nuzlocke, Modifier Runs or the Weekly Gauntlet.',
      'Settings has screen looks, animation switches, accessibility presets, hold-to-confirm and a gamepad remap. Nothing is locked.',
      'You can Save, Save & Quit, and Save & Hub during a run. Export your save from Settings > Save & Data to keep a backup.',
    ],
  },
];

export interface UpdateLogSection {
  heading: string;
  lines: string[];
}

export interface UpdateLogEntry {
  id: string;
  title: string;
  intro: string;
  sections: UpdateLogSection[];
}

/** Newest first. The first entry's id must equal GAME_UPDATE_ID. */
export const UPDATE_LOG: readonly UpdateLogEntry[] = [
  {
    id: 'beta-0.4',
    title: 'Beta 0.4: The Big Glow-Up',
    intro: 'Our biggest update yet: a walkable town, a new look for nearly every screen, cinematic battle moments, and hundreds of new things to discover.',
    sections: [
      { heading: 'Hub Town', lines: ['The Hub is a walkable Pokémon town with a day and night cycle, town sounds, a minimap (M) and touch controls.', 'Prefer the classic? Settings > Hub style switches to the Arena Lobby.', 'New Pocket Town buildings: gacha, Shrine cleanse, Memorial Wall, Corner Nook and more.'] },
      { heading: 'Shops', lines: ['Six shop types with their own stock, perk and look: Poké Mart, Aero Boutique, Kecleon\'s Bazaar, Supply Depot, PokéNet Web Store and the Night Market.'] },
      { heading: 'Run Events', lines: ['12 ways to tell a story: Diorama, Storybook, Visual Novel, Card Draw, Comic Panels and more.', '60 set-piece events, 72 NPC, shop and story events, and 122 live calendar events with weekly rules.'] },
      { heading: 'Trade Stops & Trainer Plaza', lines: ['A new anime Trade screen with 12 rotating styles.', 'A tile-map Plaza with four looks.'] },
      { heading: 'Battle', lines: ['Ten new battle styles rebuilt to match their mock-ups.', 'Z-Move, Tera, Dynamax and Mega cutscenes, animated boss sprites and Boss VS screens.', 'Type resonance, bleed, curse tags, hazard bursts, underdog XP, Scan, hotbar and more, now in doubles too.'] },
      { heading: 'Every screen, redesigned', lines: ['Title, Trainer Select, Starters, Map, Rewards, Party, Bag, Camp, Pokédex, Settings, Legacy gallery and more all have new looks. Set them in Settings or leave on Random.'] },
      { heading: 'Care & bonds, rivals', lines: ['Pet, hug, feed, groom, cheer and train your team; 18+ party scenes, mastery stars and a journal.', 'Nemesis rivals with a ledger, run-end letters, promises across runs and Legacy Eggs.'] },
      { heading: 'New ways to play', lines: ['Nuzlocke, Hardcore Nuzlocke, Modifier Runs, Weekly Gauntlet, local boards and ghost codes.', 'Camp crafting, Rummage, and Save, Save & Quit and Save & Hub during a run.', 'New: this tutorial with nine professors. Replay it any time from Settings > Save & Data.'] },
    ],
  },
];

export function latestUpdate(): UpdateLogEntry {
  return UPDATE_LOG[0]!;
}

/** True when this player has not yet seen the newest patch notes. */
export function updateLogPending(s: Pick<Settings, 'lastSeenUpdate'>): boolean {
  return s.lastSeenUpdate !== GAME_UPDATE_ID;
}

/** True when the tutorial has not yet been offered to this player. */
export function tutorialOfferPending(s: Pick<Settings, 'tutorialOffered'>): boolean {
  return !s.tutorialOffered;
}

export function markUpdateSeen(s: Settings): Settings {
  return s.lastSeenUpdate === GAME_UPDATE_ID ? s : { ...s, lastSeenUpdate: GAME_UPDATE_ID };
}

export function markTutorialOffered(s: Settings): Settings {
  return s.tutorialOffered ? s : { ...s, tutorialOffered: true };
}

export function markTutorialDone(s: Settings, categoryId: string): Settings {
  return s.tutorialDone.includes(categoryId) ? s : { ...s, tutorialDone: [...s.tutorialDone, categoryId] };
}
