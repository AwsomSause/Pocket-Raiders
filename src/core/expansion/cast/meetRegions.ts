// Beta 0.7 E9: Dossier meetings for the Alola and Paldea story events (`xe.alola.*`, `xe.paldea.*`). Ids are checked
// against the cast data by tests/unit/dossier.test.ts (it walks EVENT_MEETINGS).

export const ALOLA_PALDEA_MEETINGS: Record<string, readonly string[]> = {
  'xe.alola.yo': ['sc.skull.tupp', 'sc.skull.rapp', 'sc.skull.zipp'],
  'xe.alola.aether-house': ['sc.skull.kahuna-guzma'],
  'xe.alola.rent': ['sc.skull.nanu'],
  'xe.alola.guzmas-room': ['sc.skull.kahuna-guzma'],
  'xe.alola.gallery': ['sc.aether.heir-lillie', 'sc.aether.curator-pua'],
  'xe.alola.consultant': ['sc.aether.eldes'],
  'xe.alola.recon': ['sc.aether.dulse-zossie'],
  'xe.alola.pelago': ['sc.aether.mohn'],
  'xe.paldea.flyer': [],
  'xe.paldea.clive': ['sc.star.clive'],
  'xe.paldea.sandwich': ['sc.star.arven-cook'],
  'xe.paldea.read-receipts': ['sc.star.penny'],
  'xe.paldea.admissions': ['sc.star.nascour'],
  'xe.paldea.old-hallway': ['sc.star.peon-brask', 'sc.star.peon-odette', 'sc.star.peon-tully'],
  'xe.paldea.applicant': ['sc.star.applicant'],
  'xe.paldea.shop-class': ['sc.star.captain-zeb'],
};
