// Title screen layouts (screens redesign group C): where the logo, menu and Pokémon stand for each
// built look, matching its mock-up in redesign/title/. Pure data; MainMenuScene draws from it.
export interface TitleLayout {
  logo: { x: number; y: number; size: number; origin: number };
  menu: { x: number; y: number; columns: number; itemWidth: number; itemHeight: number; fontSize: number; color: string };
  /** The panel behind the menu, or `tiles` for one glass tile per option (Wii channels). */
  panel?: { x: number; y: number; w: number; h: number; style: 'glass' | 'dark' | 'ds' | 'paper' };
  tiles?: boolean;
  mon: { x: number; y: number; size: number };
  /** The menu stays hidden behind a blinking "PRESS START" until confirm. */
  press?: boolean;
  /** Three save slot cards in a row instead of a lone Pokémon. */
  carousel?: boolean;
  tagline?: { x: number; y: number; color: string };
  /** A caption the look adds (manga volume tag, flyover region line). */
  caption?: (runs: number) => string;
  captionAt?: { x: number; y: number; color: string };
}

export const TITLE_LAYOUTS: Record<string, TitleLayout> = {
  classic: { logo: { x: 480, y: 14, size: 60, origin: 0.5 }, menu: { x: 340, y: 380, columns: 1, itemWidth: 280, itemHeight: 40, fontSize: 26, color: '#ffffff' }, mon: { x: 480, y: 330, size: 210 }, press: true },
  wii: { logo: { x: 28, y: 440, size: 26, origin: 0 }, menu: { x: 60, y: 92, columns: 3, itemWidth: 280, itemHeight: 140, fontSize: 24, color: '#33404c' }, tiles: true, mon: { x: 880, y: 440, size: 90 }, captionAt: { x: 900, y: 500, color: '#5a6672' }, caption: () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
  ds: { logo: { x: 60, y: 20, size: 34, origin: 0 }, menu: { x: 584, y: 60, columns: 1, itemWidth: 340, itemHeight: 84, fontSize: 28, color: '#1a2a40' }, panel: { x: 44, y: 14, w: 480, h: 510, style: 'ds' }, mon: { x: 284, y: 410, size: 300 } },
  anime: { logo: { x: 48, y: 18, size: 60, origin: 0 }, menu: { x: 700, y: 330, columns: 1, itemWidth: 230, itemHeight: 34, fontSize: 22, color: '#ffffff' }, mon: { x: 600, y: 330, size: 380 } },
  manga: { logo: { x: 40, y: 22, size: 48, origin: 0 }, menu: { x: 60, y: 250, columns: 1, itemWidth: 300, itemHeight: 46, fontSize: 28, color: '#111111' }, mon: { x: 720, y: 460, size: 360 }, captionAt: { x: 62, y: 214, color: '#111111' }, caption: (n) => `VOL. ${n + 1} — THE BADLANDS` },
  carousel: { logo: { x: 40, y: 12, size: 36, origin: 0 }, menu: { x: 24, y: 466, columns: 6, itemWidth: 156, itemHeight: 40, fontSize: 15, color: '#33404c' }, mon: { x: -200, y: -200, size: 10 }, carousel: true },
  flyover: { logo: { x: 40, y: 20, size: 48, origin: 0 }, menu: { x: 60, y: 210, columns: 1, itemWidth: 300, itemHeight: 38, fontSize: 24, color: '#ffffff' }, mon: { x: -200, y: -200, size: 10 }, captionAt: { x: 62, y: 500, color: '#cfe6ff' }, caption: () => 'Next region: Trial Archipelago · 10 regions to the League' },
};
