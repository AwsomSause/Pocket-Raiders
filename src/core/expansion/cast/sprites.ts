// Dossier portraits (Beta 0.7). Each cast id lists sprite ids to try in order; the first one the game has wins. Ids the art
// pack does not hold yet are listed first, so when Kice adds the file it shows with no code change.
// Cipher's cast still needs art (see docs/updates/beta-0.7/cast-sprites.md); until then it shows the silhouette.

const SAGE = 'trainer.pr/zinzolin';
/** Existing art reused for Johto's Rocket Commanders (placeholders until their own art exists). */
export const CAST_SPRITES: Record<string, readonly string[]> = {
  // Team Plasma's Sages all share the one Sage sprite.
  'sc.plasma.gorm': [SAGE],
  'sc.plasma.bronius': [SAGE],
  'sc.plasma.ryoku': [SAGE],
  // Johto's Rocket Commanders: their own art first, then a stand-in.
  'sc.rocket-return.marauder': ['trainer.cipher/marauder', 'boss.drive/executive3'],
  'sc.rocket-return.attila': ['trainer.rocket-return/attila', 'boss.drive/executive'],
  'sc.rocket-return.hun': ['trainer.rocket-return/hun', 'boss.drive/executive2'],
  'sc.rocket-return.sebastian': ['trainer.rocket-return/sebastian', 'boss.drive/johtoian-hgss-scientist'],
  'sc.rocket-return.tyson': ['trainer.rocket-return/tyson', 'boss.drive/teamrocket-m'],
  // Cipher: no art yet. Drop trainer.cipher/<name>.png into public/assets/images/trainer/cipher/ and it appears.
  'sc.cipher.greevil': ['trainer.cipher/greevil'],
  'sc.cipher.evice': ['trainer.cipher/evice'],
  'sc.cipher.gorigan': ['trainer.cipher/gorigan'],
  'sc.cipher.hexagon': ['trainer.cipher/hexagon'],
  'sc.cipher.trudly-folly': ['trainer.cipher/trudly-folly'],
  'sc.cipher.es-cade': ['trainer.cipher/es-cade'],
  'sc.cipher.verich': ['trainer.cipher/verich'],
};
