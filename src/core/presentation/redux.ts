// The twenty looks of the New UI (Settings > Display > UI theme), taken as they are from the director's mock-ups
// (pocket-raiders-mockups, source/redux-lib.js SKINS). Pure data: colours, the band/button/window shapes and the font.
// Presentation only: a look never changes a rule or an outcome.

export const REDUX_SKIN_IDS = ['raiders', 'platinumPaper', 'unovaSlate', 'unovaWhite', 'alolaSun', 'alolaMoon', 'roguePlum', 'rogueNight', 'stadiumGold', 'stadiumArena', 'fateNight', 'fatePaper', 'dispatchBoard', 'dispatchDay', 'telltaleNoir', 'telltaleComic', 'poketch', 'cGear', 'rotomDex', 'trophyHall'] as const;
export type ReduxSkinId = (typeof REDUX_SKIN_IDS)[number];

export interface ReduxSkin {
  id: ReduxSkinId;
  /** Name shown in Settings. */
  n: string;
  /** The game the look is modelled on. */
  ref: string;
  /** ground, panel, panel 2, line, frame, accent, paper, paper ink, text-box frame. */
  g: string; p: string; p2: string; l: string; f: string; acc: string; pa: string; pai: string; tf: string;
  band: 'slant' | 'tab' | 'pill' | 'flat' | 'letter';
  btn: 'bevel' | 'block' | 'plate' | 'pill' | 'outline';
  win: 'double' | 'cut' | 'flat' | 'card' | 'plum';
  font: string;
  /** Window ink, stage ink (default #f8f8f8), font size (default 18), font weight (default 400). */
  wink?: string; ink?: string; fs?: number; fw?: number;
  caps?: 1; dots?: 1; grid?: 1;
}

export const REDUX_SKINS: readonly ReduxSkin[] = [
  { id: 'raiders', n: 'Raiders', ref: 'Black 2 + Platinum', g: '#161d2b', p: '#222c40', p2: '#2e3a54', l: '#0a0d14', f: '#a9bfe8', acc: '#f8d030', pa: '#f8f9fc', pai: '#39424f', tf: '#7088b8', band: 'slant', btn: 'bevel', win: 'double', font: 'Pixelify Sans' },
  { id: 'platinumPaper', n: 'Platinum Paper', ref: 'Pokémon Platinum', g: '#3a5a8c', p: '#f4f6fb', p2: '#dfe6f2', l: '#22304c', f: '#7088b8', acc: '#e8443a', pa: '#ffffff', pai: '#39424f', tf: '#7088b8', band: 'tab', btn: 'block', win: 'double', wink: '#2c3a52', font: 'Jersey 15', fs: 21 },
  { id: 'unovaSlate', n: 'Unova Slate', ref: 'Black 2', g: '#0e1418', p: '#1c2830', p2: '#2a3a44', l: '#05080a', f: '#30c0d0', acc: '#30e0f0', pa: '#e8f4f6', pai: '#12333a', tf: '#30c0d0', band: 'slant', btn: 'plate', win: 'cut', font: 'Pixelify Sans' },
  { id: 'unovaWhite', n: 'Unova White', ref: 'White 2', g: '#c8d0d8', p: '#f6f8fa', p2: '#e2e8ee', l: '#5a6672', f: '#f08a30', acc: '#f08a30', pa: '#ffffff', pai: '#2a3038', tf: '#f08a30', band: 'slant', btn: 'plate', win: 'flat', wink: '#2a3038', ink: '#20262e', font: 'Pixelify Sans' },
  { id: 'alolaSun', n: 'Alola Sun', ref: 'Ultra Sun', g: '#f08a2a', p: '#1f4a58', p2: '#2c6474', l: '#0e2a34', f: '#ffe9a8', acc: '#ffe060', pa: '#fff8e6', pai: '#5a3410', tf: '#f0a030', band: 'pill', btn: 'pill', win: 'card', font: 'M PLUS Rounded 1c', fw: 800, fs: 16 },
  { id: 'alolaMoon', n: 'Alola Moon', ref: 'Ultra Moon', g: '#141a3c', p: '#232c5c', p2: '#33407c', l: '#080b1c', f: '#70e0e8', acc: '#ff78b8', pa: '#eef6ff', pai: '#1c2450', tf: '#70e0e8', band: 'pill', btn: 'pill', win: 'card', font: 'M PLUS Rounded 1c', fw: 800, fs: 16 },
  { id: 'roguePlum', n: 'Rogue Plum', ref: 'PokeRogue', g: '#1d1a24', p: '#362d3e', p2: '#463a52', l: '#141218', f: '#c73625', acc: '#ffb745', pa: '#362d3e', pai: '#f8f8f8', tf: '#c73625', band: 'flat', btn: 'block', win: 'plum', font: 'PRMain', fs: 17 },
  { id: 'rogueNight', n: 'Rogue Night', ref: 'PokeRogue, dark mode', g: '#0c0c12', p: '#1c1c28', p2: '#2a2a3a', l: '#000000', f: '#f8c030', acc: '#f8c030', pa: '#1c1c28', pai: '#f8f8f8', tf: '#f8c030', band: 'flat', btn: 'outline', win: 'plum', font: 'PRMain', fs: 17 },
  { id: 'stadiumGold', n: 'Stadium Gold', ref: 'Pokémon Stadium', g: '#1a2a6a', p: '#2a3e94', p2: '#3c54b8', l: '#0a1238', f: '#f0c040', acc: '#f0c040', pa: '#f0c040', pai: '#1a1a2a', tf: '#b88010', band: 'flat', btn: 'bevel', win: 'double', font: 'Rajdhani', fw: 700, fs: 19, caps: 1 },
  { id: 'stadiumArena', n: 'Stadium Arena', ref: 'Pokémon Stadium 2', g: '#0c4a34', p: '#126a48', p2: '#1a8a5c', l: '#062418', f: '#f8e060', acc: '#f8e060', pa: '#f8f4d0', pai: '#1a3a24', tf: '#e0a020', band: 'tab', btn: 'pill', win: 'card', font: 'Rajdhani', fw: 700, fs: 19, caps: 1 },
  { id: 'fateNight', n: 'Fate Night', ref: 'Fate/stay night', g: '#070b20', p: '#101a44', p2: '#1a2a64', l: '#02040c', f: '#c8d4ff', acc: '#ffffff', pa: '#101a44', pai: '#eef2ff', tf: '#c8d4ff', band: 'letter', btn: 'outline', win: 'flat', font: 'Cinzel', fw: 600, fs: 16 },
  { id: 'fatePaper', n: 'Fate Paper', ref: 'Fate, daytime', g: '#b8b0a4', p: '#f2ede4', p2: '#e2dacc', l: '#3a3028', f: '#a01828', acc: '#a01828', pa: '#fbf8f2', pai: '#2a2420', tf: '#a01828', band: 'letter', btn: 'outline', win: 'flat', wink: '#2a2420', ink: '#2a2420', font: 'Cinzel', fw: 600, fs: 16 },
  { id: 'dispatchBoard', n: 'Dispatch Board', ref: 'Dispatch', g: '#0e1830', p: '#16233f', p2: '#2c4478', l: '#070c18', f: '#ff6a58', acc: '#3ee0c8', pa: '#f8f8f8', pai: '#16233f', tf: '#ff6a58', band: 'tab', btn: 'plate', win: 'cut', font: 'Oswald', fw: 600, fs: 17, caps: 1, dots: 1 },
  { id: 'dispatchDay', n: 'Dispatch Day', ref: 'Dispatch, day shift', g: '#f0c838', p: '#1c3a8c', p2: '#2a52b8', l: '#0c1a44', f: '#ffffff', acc: '#f0c838', pa: '#ffffff', pai: '#1c3a8c', tf: '#1c3a8c', band: 'tab', btn: 'plate', win: 'cut', ink: '#10204c', font: 'Oswald', fw: 600, fs: 17, caps: 1 },
  { id: 'telltaleNoir', n: 'Telltale Noir', ref: 'Telltale games', g: '#08080a', p: '#18181c', p2: '#2a2a30', l: '#000000', f: '#f8f8f8', acc: '#f8d030', pa: '#f8f8f8', pai: '#101014', tf: '#101014', band: 'letter', btn: 'outline', win: 'flat', font: 'Oswald', fw: 500, fs: 17 },
  { id: 'telltaleComic', n: 'Telltale Comic', ref: 'Telltale, cel-shaded', g: '#e8d8a0', p: '#fffbe8', p2: '#f4e8b8', l: '#101010', f: '#101010', acc: '#e8206a', pa: '#ffffff', pai: '#101010', tf: '#101010', band: 'tab', btn: 'block', win: 'card', wink: '#101010', ink: '#101010', font: 'Oswald', fw: 600, fs: 17, caps: 1 },
  { id: 'poketch', n: 'Pokétch', ref: 'Platinum Pokétch', g: '#30482c', p: '#8cb070', p2: '#a8c890', l: '#182818', f: '#182818', acc: '#f8f8d0', pa: '#c8dcae', pai: '#182818', tf: '#182818', band: 'flat', btn: 'block', win: 'flat', wink: '#182818', ink: '#e8f4d0', font: 'Tiny5', fs: 17 },
  { id: 'cGear', n: 'C-Gear', ref: 'Black 2 C-Gear', g: '#04060c', p: '#0c1424', p2: '#14223c', l: '#000000', f: '#00e8ff', acc: '#ff3cc8', pa: '#0c1424', pai: '#c8f8ff', tf: '#00e8ff', band: 'slant', btn: 'outline', win: 'cut', font: 'Tiny5', fs: 17, grid: 1 },
  { id: 'rotomDex', n: 'Rotom Dex', ref: 'Ultra Sun Rotom Dex', g: '#e84830', p: '#2a2e3c', p2: '#3c4254', l: '#16181e', f: '#ffd0a0', acc: '#58d8f8', pa: '#eef8ff', pai: '#20303c', tf: '#58d8f8', band: 'pill', btn: 'pill', win: 'card', font: 'M PLUS Rounded 1c', fw: 800, fs: 16 },
  { id: 'trophyHall', n: 'Trophy Hall', ref: 'Stadium trophies', g: '#2a1a10', p: '#4a3020', p2: '#644430', l: '#140c06', f: '#d8a850', acc: '#f8d878', pa: '#f4e8c8', pai: '#3a2410', tf: '#b08030', band: 'flat', btn: 'bevel', win: 'double', font: 'Cinzel', fw: 700, fs: 16 },
];

export const reduxSkin = (id: string | undefined): ReduxSkin => REDUX_SKINS.find((s) => s.id === id) ?? REDUX_SKINS[0]!;
export const reduxSkinIndex = (id: string | undefined): number => Math.max(0, REDUX_SKINS.findIndex((s) => s.id === id));
/** The mock-ups give each screen up to four layouts and deal them out by look: look k of a screen with n layouts uses this one. */
export const reduxLayout = (skinIndex: number, layouts: number): number => (skinIndex + (skinIndex >> 2)) % Math.max(1, layouts);
export const nextReduxSkin = (id: ReduxSkinId): ReduxSkinId => REDUX_SKIN_IDS[(REDUX_SKIN_IDS.indexOf(id) + 1) % REDUX_SKIN_IDS.length]!;
