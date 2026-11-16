// Catalog Overhaul Pack, row 9 (evil-hoenn-sinnoh-unova): the inside routes' own maps, drawn like stages (Act 3's door, the
// four endings, the third options' climaxes). Run: node tools/events/co/_evil-hsu-maps.ts
// Each is a chain pseudo-stage entered on the room its choice opened (`start: 'opened'`), as row 8's Rocket maps are.
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

type Chain = { id: string; name: string; entry: string; themeId: string; tint: string; mood: string; team: string; start: 'opened'; layout: string[][] };
const chains: Chain[] = [];
const map = (team: string, id: string, name: string, entry: string, layout: string[][], mood: string, tint = '#1e2230'): void =>
  void chains.push({ id, name, entry, themeId: 'ghost-dark', tint, mood, team, start: 'opened', layout });

// Sinnoh, Team Galactic (TEAM_GALACTIC_SINNOH_FULL_1 Act 3, FULL_2 B to F).
map('galactic', 'ps_gx_lab', 'The Lab Under Veilstone', 'gx-act3', [['gx-act3-glass'], ['gx-act3-readout'], ['gx-act3-saturn', 'gx-act3-warden']], 'warm, and three lights in the dark', '#3a2418');
map('galactic', 'ps_gx_plan', `Spear Pillar: It's Very Quiet`, 'gx-final-choice', [['gx-plan-looker'], ['gx-plan-rival'], ['gx-plan-cynthia'], ['gx-plan-load'], ['gx-plan-fold'], ['gx-plan-nothing'], ['gx-plan-door'], ['gx-plan-after']], 'snow going sideways, then nothing at all', '#2a2e3e');
map('galactic', 'ps_gx_turn', 'Spear Pillar: Let Go', 'gx-final-choice', [['gx-turn-slack'], ['gx-turn-cyrus'], ['gx-turn-tear'], ['gx-turn-after']], 'two lines in the sky like kite strings', '#2a2e3e');
map('galactic', 'ps_gx_charon', 'Spear Pillar: The Licence', 'gx-final-choice', [['gx-charon-meeting'], ['gx-charon-repo'], ['gx-charon-bought'], ['gx-charon-confirm', 'gx-charon-unpaid']], 'a board meeting in a blizzard', '#2a2e3e');
map('galactic', 'ps_gx_own', 'Spear Pillar: Mind This One', 'gx-final-choice', [['gx-own-mars'], ['gx-own-mars-down'], ['gx-own-lines'], ['gx-own-d1'], ['gx-own-d2'], ['gx-own-d3'], ['gx-own-d4'], ['gx-own-title']], 'five hundred people on a stair, looking up', '#2a2e3e');
map('galactic', 'ps_lantern_families', 'Round 1: The Families', 'lantern-round-1', [['lantern-door-1'], ['lantern-door-2'], ['lantern-door-3']], 'a lamp, and three doors', '#3a2e1a');
map('galactic', 'ps_lantern_climax', 'Three Hundred Lanterns', 'lantern-climax', [['lantern-ridge'], ['lantern-saddle'], ['lantern-col'], ['lantern-summit'], ['lantern-dais'], ['lantern-question', 'lantern-cold']], 'a string of bulbs into the cloud', '#3a2e1a');

const file = join(import.meta.dirname, '../../../src/data/catalogOverhaul/pseudo/evil-hoenn-sinnoh-unova.json');
writeFileSync(file, JSON.stringify({ category: 'evil-hoenn-sinnoh-unova', note: 'Evil Teams Volume III inside routes for Galactic, Plasma, Magma, Aqua and Team Sky: Act doors, the endings and the third options. Written by tools/events/co/_evil-hsu-maps.ts.', chains }, null, 1) + '\n');
console.log(`pseudo/evil-hoenn-sinnoh-unova.json: ${chains.length} maps`);
