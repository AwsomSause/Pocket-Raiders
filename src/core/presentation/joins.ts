// The Phantom UI's page changes (mock-ups pass 20, "the joins"): which of five ways one page turns into the next,
// and how much they move. Presentation only: nothing here touches a run, and no gameplay roll reads it.
import type { Settings } from '../state';

export type JoinKind = 'slash' | 'iris' | 'drop' | 'page' | 'sweep';
/** How much a page change moves: all of it, a short fade, or nothing. */
export type JoinMotion = 'full' | 'reduced' | 'off';

/** The six cards of Settings > Look > Page changes, in the mock-up's order. `share` (Carry) rides on every change. */
export const JOIN_CARDS: { id: JoinKind | 'share'; n: string; when: string; about: string }[] = [
  { id: 'slash', n: 'Slash', when: 'Into a fight', about: 'The screen is cut open on a slant.' },
  { id: 'iris', n: 'Flare', when: 'Cut-ins and big moments', about: 'Opens from the middle like a flashbulb.' },
  { id: 'drop', n: 'Drop', when: 'Opening a menu', about: 'The menu drops in and the game dims behind.' },
  { id: 'page', n: 'Turn', when: 'Moving on: map, town, events', about: 'The next place pushes the last one away.' },
  { id: 'sweep', n: 'Sweep', when: 'Between pages of one menu', about: 'A quick slanted wipe across the page.' },
  { id: 'share', n: 'Carry', when: 'On every change', about: 'The title, your Pokémon and the key hints glide to their new spots.' },
];

export const JOIN_MOTIONS: { id: JoinMotion; n: string }[] = [
  { id: 'full', n: 'Full' },
  { id: 'reduced', n: 'Reduced · fades only' },
  { id: 'off', n: 'Off · instant' },
];

/** The mock-ups' page groups, by page id (ui/phantom `page(id, …)`). A page not listed is in no group. */
const GROUPS: Record<string, string[]> = {
  start: ['title', 'menu', 'version', 'quiz', 'starter', 'setup', 'seed', 'plan'],
  run: ['event', 'map', 'choice', 'reward', 'shop', 'log', 'runover', 'side', 'sy-reward', 'trade', 'roll'],
  town: ['town', 'place', 'pocket', 'heal', 'dock'],
  menus: ['pause', 'summary', 'dex', 'card', 'save', 'box', 'dexentry', 'types', 'party', 'bag', 'list', 'opts', 'tiles', 'wall', 'board', 'ask', 'notes', 'track'],
  settings: ['set', 'set-look', 'set-list', 'reel'],
  people: ['rivals', 'rankup', 'phone', 'dossier', 'bracket'],
  battle: ['battle', 'blist', 'vs', 'scout', 'ace', 'boss', 'gimmick', 'result', 'rloss', 'wild', 'send', 'win', 'hit', 'mega', 'tera', 'dmax', 'zmove', 'ko', 'phase'],
  moments: ['evolve', 'learn', 'capture', 'blessing', 'nick'],
  finale: ['hall', 'record', 'credits', 'travel', 'forms'],
  teams: ['brief', 'filed', 'final', 'table'],
  guide: ['index'],
};
const GROUP_OF = new Map<string, string>(Object.entries(GROUPS).flatMap(([g, ids]) => ids.map((id): [string, string] => [id, g])));
export const joinGroup = (pageId: string | null): string => (pageId ? GROUP_OF.get(pageId) ?? '' : '');

/** The big beats that open like a flashbulb, whatever came before. */
const FLARES = new Set(['tera', 'dmax', 'zmove', 'mega', 'ace', 'ko', 'phase', 'hit', 'win']);
/** The first pages of a fight. */
const CUTS = new Set(['vs', 'wild', 'boss', 'send']);

/**
 * How page `to` comes in after page `from` (null: nothing was showing). The mock-ups' rule: big beats flare, a fight
 * is cut open, a menu drops, another kind of place turns the page, and two pages of one group sweep.
 */
export function joinKind(from: string | null, to: string): JoinKind {
  const F = joinGroup(from), G = joinGroup(to);
  if (FLARES.has(to) || G === 'moments') return 'iris';
  if (CUTS.has(to) || (G === 'battle' && F !== 'battle')) return 'slash';
  if ((G === 'menus' || G === 'settings') && F !== G) return 'drop';
  if (G !== F) return 'page';
  return 'sweep';
}

type MotionKeys = Pick<Settings, 'menuAnimations' | 'disableAllAnimations' | 'animationIntensity'>;

/** Read from the settings the game already has: menu motion off (or every animation off) is Off, a reduced strength is Reduced. */
export function joinMotion(s: MotionKeys): JoinMotion {
  if (!s.menuAnimations || s.disableAllAnimations) return 'off';
  return s.animationIntensity === 'reduced' ? 'reduced' : 'full';
}

/**
 * The settings after the player picks a motion on the Page changes page. Off turns menu motion off and nothing else;
 * Reduced and Full turn it on (and the master animation switch back on, or the pick would do nothing) and set the
 * strength. An Enhanced strength is kept when Full is picked.
 */
export function withJoinMotion<S extends MotionKeys>(s: S, m: JoinMotion): S {
  if (m === 'off') return { ...s, menuAnimations: false };
  const animationIntensity: Settings['animationIntensity'] = m === 'reduced' ? 'reduced' : s.animationIntensity === 'reduced' ? 'normal' : s.animationIntensity;
  return { ...s, menuAnimations: true, disableAllAnimations: false, animationIntensity };
}
