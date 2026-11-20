// The Phantom UI's page directory (mock-up `index`, "Every page"): every page the look has, in the mock-ups' ten
// groups, with where the player finds each one. Presentation only.

export type PhantomPageEntry = {
  id: string;
  n: string;
  /** Where the page is found in the game, as one short line. */
  where: string;
  /** A page Settings can open straight from the directory: a Settings page id, 'home' or 'version'. */
  open?: string;
};
export type PhantomPageGroup = { n: string; pages: PhantomPageEntry[] };

const EVIL = 'Comes with the Evil Mode update.';

export const PHANTOM_PAGE_GROUPS: PhantomPageGroup[] = [
  { n: 'Start', pages: [
    { id: 'title', n: 'Title', where: 'The first screen when the game opens.' },
    { id: 'menu', n: 'Main menu', where: 'Press any button on the title.' },
    { id: 'version', n: 'Version select', where: 'V on the title, or Settings > Save > Version Select.', open: 'version' },
    { id: 'quiz', n: 'Partner quiz', where: 'A new run: the quiz that offers you three partners.' },
    { id: 'starter', n: 'Choose partner', where: 'A new run: right after the quiz.' },
    { id: 'setup', n: 'Run rules', where: 'A new run: before the first stage.' },
  ] },
  { n: 'Battle', pages: [
    { id: 'battle', n: 'Command', where: 'Every fight, on your turn.' },
    { id: 'moves', n: 'Moves', where: 'Fight, on your turn.' },
    { id: 'party', n: 'Party', where: 'Pokémon in a fight, or Party in the pause menu.' },
    { id: 'bag', n: 'Bag', where: 'Bag in a fight, or in the pause menu.' },
    { id: 'hit', n: 'Hit', where: 'A big hit in a fight.' },
    { id: 'mega', n: 'Mega cut-in', where: 'When a Pokémon Mega Evolves.' },
    { id: 'win', n: 'Win splash', where: 'When you win a fight.' },
    { id: 'result', n: 'Result', where: 'After a fight: what your team earned.' },
    { id: 'vs', n: 'Versus', where: 'The start of a Trainer fight.' },
    { id: 'scout', n: 'Scout the team', where: 'Before a Trainer fight: a look at their team.' },
    { id: 'ace', n: 'Ace announcement', where: 'When a Trainer sends out their ace.' },
    { id: 'boss', n: 'Boss title card', where: 'The start of a boss fight.' },
    { id: 'binfo', n: 'Battle info', where: 'Info in a fight.' },
    { id: 'blog', n: 'Battle log', where: 'The log in a fight.' },
    { id: 'gimmick', n: 'Choose a gimmick', where: 'When your team can use more than one of Mega, Tera, Dynamax and Z-Moves.' },
    { id: 'tera', n: 'Terastallize cut-in', where: 'When a Pokémon Terastallizes.' },
    { id: 'dmax', n: 'Dynamax cut-in', where: 'When a Pokémon Dynamaxes.' },
    { id: 'zmove', n: 'Z-Move cut-in', where: 'When a Pokémon uses a Z-Move.' },
    { id: 'ko', n: 'Knockout splash', where: 'When a Pokémon is knocked out.' },
    { id: 'phase', n: 'Boss last stand', where: 'When a boss makes its last stand.' },
    { id: 'rloss', n: 'Rival loss', where: 'After you lose to a rival. The run goes on.' },
    { id: 'wild', n: 'Wild Pokémon appears', where: 'The start of a wild fight.' },
    { id: 'send', n: 'Send out', where: 'The start of a fight, when both sides send out.' },
  ] },
  { n: 'Run', pages: [
    { id: 'event', n: 'Event', where: 'An event stage on the map.' },
    { id: 'map', n: 'Route map', where: 'Between the stages of a run.' },
    { id: 'choice', n: 'Event · choice', where: 'An event that asks you to choose.' },
    { id: 'reward', n: 'Reward', where: 'After a stage, when you pick a reward.' },
    { id: 'shop', n: 'Poké Mart', where: 'A shop stage on the map.' },
    { id: 'wheel', n: 'Quick wheel', where: 'Tab on the map.' },
    { id: 'log', n: 'Text log', where: 'Rotom on the phone reads the run back to you.' },
    { id: 'runover', n: 'Run over', where: 'When a run ends.' },
    { id: 'side', n: 'Side stage', where: 'A side stage that an event leads to.' },
    { id: 'sy-result', n: 'Event · outcome', where: 'After you choose in an event.' },
    { id: 'sy-reward', n: 'Event · reward', where: 'After an event’s text, when it gives you something.' },
  ] },
  { n: 'Menus', pages: [
    { id: 'pause', n: 'Pause menu', where: 'Esc on the map.' },
    { id: 'set', n: 'Settings', where: 'The title, the Hub and the pause menu.', open: 'home' },
    { id: 'summary', n: 'Pokémon summary', where: 'Pick a Pokémon in the Party.' },
    { id: 'dex', n: 'Pokédex', where: 'The pause menu or the quick wheel.' },
    { id: 'card', n: 'Trainer card', where: 'The pause menu.' },
    { id: 'save', n: 'Save', where: 'The pause menu or the quick wheel.' },
    { id: 'box', n: 'Reserve', where: 'The quick wheel, or a PC.' },
    { id: 'dexentry', n: 'Pokédex entry', where: 'Pick a Pokémon in the Pokédex.' },
    { id: 'types', n: 'Type chart', where: 'From the Pokédex.' },
  ] },
  { n: 'Settings', pages: [
    { id: 'set-game', n: 'Game', where: 'Settings > Game.', open: 'gameplay' },
    { id: 'set-battle', n: 'Battle', where: 'Settings > Battle.', open: 'animations' },
    { id: 'set-look', n: 'Look', where: 'Settings > Look.', open: 'display' },
    { id: 'set-sound', n: 'Sound', where: 'Settings > Sound.', open: 'audio' },
    { id: 'set-controls', n: 'Controls', where: 'Settings > Controls.', open: 'controls' },
    { id: 'set-access', n: 'Access', where: 'Settings > Access.', open: 'accessibility' },
    { id: 'reel', n: 'Page changes', where: 'Settings > Look > Page changes.', open: 'reel' },
    { id: 'set-text', n: 'Text', where: 'Settings > Text.', open: 'text' },
    { id: 'set-touch', n: 'Phone', where: 'Settings > Phone.', open: 'phone' },
    { id: 'set-story', n: 'Story', where: 'Settings > Story.', open: 'story' },
    { id: 'set-save', n: 'Save and data', where: 'Settings > Save.', open: 'data' },
  ] },
  { n: 'Town', pages: [
    { id: 'town', n: 'Hub Town map', where: 'Town on the Hub, or M while you walk in Hub Town.' },
    { id: 'place', n: 'Inside a place', where: 'Go to a place from the Town Map.' },
    { id: 'pocket', n: 'Pocket Town', where: 'Your own town: its directory.' },
    { id: 'heal', n: 'Pokémon Center', where: 'A Pokémon Center stage on the map.' },
  ] },
  { n: 'People', pages: [
    { id: 'rivals', n: 'Rivals', where: 'The quick wheel on the map.' },
    { id: 'rankup', n: 'Rank up', where: 'When a rival’s standing with you changes.' },
    { id: 'phone', n: 'Rotom Phone', where: 'The quick wheel on the map.' },
  ] },
  { n: 'Moments', pages: [
    { id: 'evolve', n: 'Evolution', where: 'When a Pokémon evolves.' },
    { id: 'learn', n: 'New move', where: 'When a Pokémon wants to learn a fifth move.' },
    { id: 'capture', n: 'Capture', where: 'When you catch a Pokémon.' },
    { id: 'blessing', n: 'Legendary Blessing', where: 'The start of a run, with Blessings on.' },
    { id: 'nick', n: 'Nickname', where: 'After a catch.' },
  ] },
  { n: 'Evil Mode', pages: [
    { id: 'dm-title', n: 'Dominion · begin', where: EVIL },
    { id: 'dm-hq', n: 'Dominion · HQ', where: EVIL },
    { id: 'dm-crew', n: 'Dominion · Crew File', where: EVIL },
    { id: 'dm-map', n: 'Dominion · Region Map', where: EVIL },
    { id: 'dm-debate', n: 'Dominion · Debate', where: EVIL },
    { id: 'dm-hero', n: 'Dominion · Hero interrupt', where: EVIL },
    { id: 'dm-paper', n: 'Dominion · morning paper', where: EVIL },
  ] },
  { n: 'Finale', pages: [
    { id: 'hall', n: 'Hall of Fame', where: 'After you beat a Champion.' },
    { id: 'record', n: 'Run record', where: 'After the Hall of Fame.' },
    { id: 'credits', n: 'Credits', where: 'After a run is won.' },
    { id: 'travel', n: 'Next region', where: 'After a region’s Champion, when the run goes on.' },
    { id: 'forms', n: 'Regional forms', where: 'On entering a region whose Pokémon have their own forms.' },
  ] },
];

/** Every page in reading order, with the index of its group. */
export const PHANTOM_PAGE_LIST: (PhantomPageEntry & { group: number })[] = PHANTOM_PAGE_GROUPS.flatMap((g, gi) => g.pages.map((p) => ({ ...p, group: gi })));

/** The entry `by` groups away from entry `at` (the first page of that group); it wraps round. */
export function pageGroupStep(at: number, by: number): number {
  const n = PHANTOM_PAGE_GROUPS.length, g = PHANTOM_PAGE_LIST[at]?.group ?? 0;
  const to = (((g + by) % n) + n) % n;
  return PHANTOM_PAGE_LIST.findIndex((p) => p.group === to);
}
