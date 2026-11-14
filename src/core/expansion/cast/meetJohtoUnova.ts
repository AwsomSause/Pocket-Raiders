// Beta 0.7: where the Dossier fills in Johto and Unova (events and track steps). Before this, nothing put Johto's Commanders or
// Unova's Sages in the Dossier, so they never showed up. Ids are checked against the cast data by tests/unit/johtoUnovaCast.test.ts.
// Where a script gave a person no built scene, they are met at the track step whose rule is theirs (the step's own text names the place).

export const JOHTO_UNOVA_EVENT_MEETINGS: Record<string, readonly string[]> = {
  'xe.johto.false-director': ['sc.rocket-return.false-director'],
  'xe.johto.black-hour': ['sc.rocket-return.black-hour'],
  'xe.johto.dragon-tamer': ['sc.rocket-return.lance'],
  'xe.johto.olivine-arrival': ['sc.rocket-return.miror-b'],
  'xe.johto.heir': ['sc.rocket-return.heir'],
  'xe.johto.counterfeit-boss': ['sc.rocket-return.counterfeit-boss'],
  'xe.unova.truth-seeker': ['sc.plasma.boss-on-paper'],
  'xe.unova.candidate': ['sc.plasma.snattle'],
  'xe.unova.stolen-one': ['sc.plasma.aldith'],
  'xe.unova.kings-room': ['sc.plasma.kings-likeness'],
};

/** The person behind each step of Johto's and Unova's world-state tracks. */
export const JOHTO_UNOVA_TRACK_MEETINGS: Record<string, Record<number, readonly string[]>> = {
  // Static, Jingle (Sebastian's lab tech), Rage (Tyson's Lake of Rage project), Carrier Wave (the beast hunters), The Call (the Marauder).
  johto: { 1: ['sc.rocket-return.black-hour'], 2: ['sc.rocket-return.sebastian'], 3: ['sc.rocket-return.tyson'], 4: ['sc.rocket-return.attila', 'sc.rocket-return.hun'], 5: ['sc.rocket-return.marauder'] },
  // Pamphlets (the creed: Gorm), Let Go (the Sages' signal: Barret), The Frost Line (the Frigate: Bronius), The Bridges (the desert and castle: Ryoku), The Crown.
  unova: { 1: ['sc.plasma.gorm'], 2: ['sc.plasma.barret'], 3: ['sc.plasma.bronius'], 4: ['sc.plasma.ryoku'], 5: ['sc.plasma.kings-likeness'] },
};
