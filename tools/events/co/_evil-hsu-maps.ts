// Catalog Overhaul Pack, row 9 (evil-hoenn-sinnoh-unova): the inside routes' own maps, drawn like stages (Act 3's door, the
// four endings, the third options' climaxes). Run: node tools/events/co/_evil-hsu-maps.ts
// Each is a chain pseudo-stage entered on the room its choice opened (`start: 'opened'`), as row 8's Rocket maps are.
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

type Chain = { id: string; name: string; entry: string; themeId: string; tint: string; mood: string; team?: string; start: 'opened'; layout?: string[][] };
const chains: Chain[] = [];
// A room that ends its ending (opens nothing) must sit in the last column, or the map would wait on the next one. Without a
// layout (`null`), the map follows the rooms each choice opens. Team Sky's maps belong to no team: either may be Hoenn's.
const map = (team: string | null, id: string, name: string, entry: string, layout: string[][] | null, mood: string, tint = '#1e2230'): void =>
  void chains.push({ id, name, entry, themeId: 'ghost-dark', tint, mood, ...(team ? { team } : {}), start: 'opened', ...(layout ? { layout } : {}) });

// Sinnoh, Team Galactic (TEAM_GALACTIC_SINNOH_FULL_1 Act 3, FULL_2 B to F).
map('galactic', 'ps_gx_lab', 'The Lab Under Veilstone', 'gx-act3', [['gx-act3-glass'], ['gx-act3-readout'], ['gx-act3-saturn', 'gx-act3-warden']], 'warm, and three lights in the dark', '#3a2418');
map('galactic', 'ps_gx_plan', `Spear Pillar: It's Very Quiet`, 'gx-final-choice', [['gx-plan-looker'], ['gx-plan-rival'], ['gx-plan-cynthia'], ['gx-plan-load'], ['gx-plan-fold'], ['gx-plan-nothing'], ['gx-plan-door'], ['gx-plan-after']], 'snow going sideways, then nothing at all', '#2a2e3e');
map('galactic', 'ps_gx_turn', 'Spear Pillar: Let Go', 'gx-final-choice', [['gx-turn-slack'], ['gx-turn-cyrus'], ['gx-turn-tear'], ['gx-turn-after']], 'two lines in the sky like kite strings', '#2a2e3e');
map('galactic', 'ps_gx_charon', 'Spear Pillar: The Licence', 'gx-final-choice', [['gx-charon-meeting'], ['gx-charon-repo'], ['gx-charon-bought'], ['gx-charon-confirm', 'gx-charon-unpaid']], 'a board meeting in a blizzard', '#2a2e3e');
map('galactic', 'ps_gx_own', 'Spear Pillar: Mind This One', 'gx-final-choice', [['gx-own-mars'], ['gx-own-mars-down'], ['gx-own-lines'], ['gx-own-d1'], ['gx-own-d2'], ['gx-own-d3'], ['gx-own-d4'], ['gx-own-title']], 'five hundred people on a stair, looking up', '#2a2e3e');
map('galactic', 'ps_lantern_families', 'Round 1: The Families', 'lantern-round-1', [['lantern-door-1'], ['lantern-door-2'], ['lantern-door-3']], 'a lamp, and three doors', '#3a2e1a');
map('galactic', 'ps_lantern_climax', 'Three Hundred Lanterns', 'lantern-climax', [['lantern-ridge'], ['lantern-saddle'], ['lantern-col'], ['lantern-summit'], ['lantern-dais'], ['lantern-question', 'lantern-cold']], 'a string of bulbs into the cloud', '#3a2e1a');

// Unova, Team Plasma (TEAM_PLASMA_UNOVA_FULL_1 Act 3, FULL_2 B to F).
map('plasma', 'ps_px_dreamyard', 'The Dreamyard', 'px-act3', [['px-act3-floor'], ['px-act3-ledger'], ['px-act3-giallo', 'px-act3-mist']], 'pink mist at ankle height', '#5a3a50');
map('plasma', 'ps_px_asking', 'The Coronation: The Asking', 'px-final-choice', [['px-asking-kings'], ['px-asking-aldith'], ['px-asking-bronius'], ['px-asking-breaker'], ['px-asking-question'], ['px-asking-ghetsis'], ['px-asking-after']], 'ten thousand candles, and a ship overhead', '#2a2a48');
map('plasma', 'ps_px_turn', 'The Coronation: Where Do They Go', 'px-final-choice', [['px-turn-box'], ['px-turn-vigil'], ['px-turn-chasm'], ['px-turn-where'], ['px-turn-after']], 'a thin tune, and six hundred people asking', '#2a2a48');
map('plasma', 'ps_px_ghetsis', 'The Coronation: The Second Half', 'px-final-choice', [['px-ghetsis-warn'], ['px-ghetsis-warn-2'], ['px-ghetsis-bow'], ['px-ghetsis-wedge'], ['px-ghetsis-seal'], ['px-ghetsis-late'], ['px-ghetsis-sealed', 'px-ghetsis-late-after']], 'snow in summer, and every light going up', '#2a2a48');
map('plasma', 'ps_px_own', 'The Coronation: The Other Four Hundred', 'px-final-choice', [['px-own-throne'], ['px-own-d1'], ['px-own-d2'], ['px-own-d3'], ['px-own-d4'], ['px-own-bronius']], 'a throne nobody sits on', '#2a2a48');
map('plasma', 'ps_openhand_insp1', 'Inspection 1: Number Nine', 'openhand-insp1', [['openhand-house-1'], ['openhand-house-2'], ['openhand-house-3'], ['openhand-house-3-after']], 'three doors, and a tea towel in each', '#4a3a28');
map('plasma', 'ps_openhand_night', 'All Night', 'openhand-climax', [['openhand-dragon'], ['openhand-dawn'], ['openhand-after']], 'a lamp on the castle steps till dawn', '#2a2a48');

// Hoenn, Magma and Aqua (HOENN_TEAMS part 4), and Team Sky (part 5).
for (const [team, p] of [['magma', 'mg'], ['aqua', 'aq']] as const) {
  map(team, `ps_${p}_plan`, 'The Seafloor Cavern: Carry Out the Plan', `${p}-final-choice`, [[`${p}-plan-wake`], [`${p}-plan-cost`], [`${p}-plan-after`]], 'black water, and a wall that breathes', '#14202e');
  map(team, `ps_${p}_turn`, 'The Seafloor Cavern: Turn On the Team', `${p}-final-choice`, [[`${p}-turn-lines`], [`${p}-turn-battle`], [`${p}-turn-other`], [`${p}-turn-pyre`]], 'two orbs, and a long climb home', '#14202e');
  map(team, `ps_${p}_cross`, 'The Seafloor Cavern: Side With the Other Team', `${p}-final-choice`, [[`${p}-cross-run`], [`${p}-cross-after`]], 'the other colour, all the way up', '#14202e');
  map(team, `ps_${p}_all`, 'The Seafloor Cavern: Take It All', `${p}-final-choice`, [[`${p}-all-battle`], [`${p}-all-gantry`]], 'both colours, looking up', '#14202e');
}
map(null, 'ps_sky_pyre', 'Mt. Pyre, From the Other Side', 'sky-pyre', [['sky-pyre-tabitha'], ['sky-pyre-shelly'], ['sky-pyre-held']], 'fog, and two columns climbing', '#3a3a48');
map(null, 'ps_sky_choice', "The Sky's Choice", 'sky-climax', null, 'a sky the colour of a bruise', '#3a2a48');

const file = join(import.meta.dirname, '../../../src/data/catalogOverhaul/pseudo/evil-hoenn-sinnoh-unova.json');
writeFileSync(file, JSON.stringify({ category: 'evil-hoenn-sinnoh-unova', note: 'Evil Teams Volume III inside routes for Galactic, Plasma, Magma, Aqua and Team Sky: Act doors, the endings and the third options. Written by tools/events/co/_evil-hsu-maps.ts.', chains }, null, 1) + '\n');
console.log(`pseudo/evil-hoenn-sinnoh-unova.json: ${chains.length} maps`);
