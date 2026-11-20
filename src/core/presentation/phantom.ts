// The Phantom UI (Settings > Display > UI style > Phantom): the director's Persona / Metaphor: ReFantazio style look,
// built from the mock-ups in plans/ui-redesign-persona. It comes in five versions, each with its own colours, shapes
// and trainer on the menus. Pure data. Presentation only: a version never changes a rule or an outcome.

export const PHANTOM_VERSION_IDS = ['phantom', 'midnight', 'channel', 'fantasia', 'velvet'] as const;
export type PhantomVersionId = (typeof PHANTOM_VERSION_IDS)[number];

export interface PhantomVersion {
  id: PhantomVersionId;
  /** Name shown in Settings and on the Version page. */
  n: string;
  /** The colour the version is known by. */
  colour: string;
  /** The trainer drawn on its menus: sprite key under assets/images/bosses and the name shown. */
  hero: string;
  heroName: string;
  /** One line about the look. */
  about: string;
}

export const PHANTOM_VERSIONS: readonly PhantomVersion[] = [
  { id: 'phantom', n: 'Phantom', colour: 'Red', hero: 'red', heroName: 'Red', about: 'Red, black and white, everything cut on a slant.' },
  { id: 'midnight', n: 'Midnight', colour: 'Blue', hero: 'blue', heroName: 'Blue', about: 'Deep water blue and cyan light, with a moon over every run.' },
  { id: 'channel', n: 'Channel', colour: 'Yellow', hero: 'hilda', heroName: 'Hilda', about: 'TV yellow, colour bars and thick black outlines.' },
  { id: 'fantasia', n: 'Fantasia', colour: 'Green', hero: 'green', heroName: 'Green', about: 'Ink and verdigris paint, gilt lines and serif capitals.' },
  { id: 'velvet', n: 'Velvet', colour: 'Gold', hero: 'nate', heroName: 'Nate', about: 'Midnight blue velvet and gold thread.' },
];

export const phantomVersion = (id: string | undefined): PhantomVersion => PHANTOM_VERSIONS.find((v) => v.id === id) ?? PHANTOM_VERSIONS[0]!;
export const phantomVersionLabel = (id: string | undefined): string => { const v = phantomVersion(id); return `${v.colour} · ${v.n}`; };
export const nextPhantomVersion = (id: PhantomVersionId): PhantomVersionId => PHANTOM_VERSION_IDS[(PHANTOM_VERSION_IDS.indexOf(id) + 1) % PHANTOM_VERSION_IDS.length]!;
