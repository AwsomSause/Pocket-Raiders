// Beta 0.7 E9: where the Dossier fills in Sinnoh and Hoenn (events and track steps). Ids are checked against the cast data by tests/unit/sinnohHoennSaga.test.ts.

type Meeting = string | [id: string, status: 'met' | 'beaten' | 'turned'] | readonly [string, string];

export const SINNOH_HOENN_EVENT_MEETINGS: Record<string, readonly string[]> = {
  'xe.sinnoh.clinic': ['sc.galactic.orderly-vance'],
  'xe.sinnoh.grunt-836': ['sc.galactic.grunt-836'],
  'xe.sinnoh.grandfather': ['sc.galactic.grandfather'],
  'xe.sinnoh.marsh-test': ['sc.galactic.hunter-j'],
  'xe.sinnoh.celestic-wall': ['sc.galactic.cynthia'],
  'xe.sinnoh.ribbon': ['sc.galactic.lovrina'],
  'xe.hoenn.stern-and-cozmo': ['sc.aqua.navigator-stern', 'sc.magma.geologist-cozmo'],
  'xe.hoenn.two-hoods': ['sc.aqua.zinnia-blue-hood', 'sc.magma.zinnia-red-hood'],
  'xe.hoenn.arms-dealer': ['sc.aqua.dakim'],
  'xe.hoenn.steven-letter': ['sc.aqua.steven'],
};

/** The person behind each step of Sinnoh's and Hoenn's world-state tracks. */
export const SINNOH_HOENN_TRACK_MEETINGS: Record<string, Record<number, readonly string[]>> = {
  sinnoh: { 1: ['sc.galactic.orderly-vance'], 2: ['sc.galactic.engineer-volkner'], 3: ['sc.galactic.warden-pell'], 4: ['sc.galactic.hunter-j'], 5: ['sc.galactic.sird'] },
  hoenn: { 1: ['sc.aqua.bosun-quill'], 2: ['sc.magma.brodie'], 3: ['sc.aqua.amber'], 4: ['sc.magma.blaise'], 5: ['sc.aqua.dakim'] },
};

/** Boss and leader battles (game ids) that are also cast characters. */
export const SINNOH_HOENN_BOSS_CAST: Record<string, string> = {
  volkner: 'sc.galactic.engineer-volkner',
  wallace: 'sc.aqua.wallace',
  steven: 'sc.aqua.steven',
  cynthia: 'sc.galactic.cynthia',
};
export type { Meeting };
