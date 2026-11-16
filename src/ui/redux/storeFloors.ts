// New UI: the department stores that are told as a chain of event rooms (the mock-ups' `store` page). This only says
// which events are floors of which store, so the event screen can draw the floor directory; the rooms themselves, their
// goods and their prices stay in the event data.

export interface StoreFloor {
  tag: string;
  name: string;
  /** The event rooms on this floor. */
  events: readonly string[];
  /** A floor the directory leaves out until the player stands on it. */
  hidden?: boolean;
}
export interface Store {
  title: string;
  /** Who speaks in the text box when the page names nobody. */
  clerk: string;
  /** Top floor first. */
  floors: readonly StoreFloor[];
}

export const STORES: readonly Store[] = [
  {
    title: 'Celadon Dept. Store',
    clerk: 'Clerk',
    floors: [
      { tag: 'RF', name: 'Rooftop drinks', events: ['cs-kanto-celadon-rooftop'] },
      { tag: '5F', name: 'Evolution Stones', events: ['cs-kanto-celadon-mart-f5', 'cs-kanto-celadon-mart-f5b'] },
      { tag: '4½', name: 'The Doll Floor', events: ['cs-kanto-celadon-mart-dolls'], hidden: true },
      { tag: '4F', name: 'The Wise Man', events: ['cs-kanto-celadon-mart-f4'] },
      { tag: '3F', name: 'TM Counter', events: ['cs-kanto-celadon-mart-f3'] },
      { tag: '2F', name: 'Trainer’s Market', events: ['cs-kanto-celadon-mart-f2'] },
      { tag: '1F', name: 'Lift and service', events: ['cs-kanto-celadon-mart', 'cs-kanto-celadon-mart-lift', 'cs-kanto-celadon-mart-shops'] },
    ],
  },
];

export interface StoreHere {
  title: string;
  clerk: string;
  floors: { tag: string; name: string; on: boolean }[];
}

/** The store an event room belongs to, with the floor it is on lit; null for every other event. */
export function storeOf(eventId: string): StoreHere | null {
  for (const s of STORES) {
    if (!s.floors.some((f) => f.events.includes(eventId))) continue;
    return { title: s.title, clerk: s.clerk, floors: s.floors.filter((f) => !f.hidden || f.events.includes(eventId)).map((f) => ({ tag: f.tag, name: f.name, on: f.events.includes(eventId) })) };
  }
  return null;
}

/** A choice label that ends in a price, "Great Ball ×3 (₽1,800)", as the good and its price; null when it has none. */
export function priceOf(label: string): { name: string; price: string } | null {
  const m = /^(.*\S)\s*\(₽\s?([\d,]+)\)$/.exec(label);
  return m ? { name: m[1]!, price: `₽ ${m[2]!}` } : null;
}
