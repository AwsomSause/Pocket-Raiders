// Catalog Overhaul Pack, STORY_FAMILIES_13: writes the storyline's team data into src/data/evilTeams.json.
// Run: node tools/events/co/_evil-story-sync.ts   (then npm run co:build -- evil-story-1 evil-story-2 evil-story-3)
// - home: a region's story goes to the team that calls it home (Part E: one team per region).
// - legendary: the creature each team hunts (Part B), used by A Legend Stirs and the betrayal fight.
// - inside: the Operation a defecting colleague stops (Part C).
// - lasting: what each Operation leaves on the region if it happens (Part D, last column). `effects` are run modifiers for
//   the rest of the region; `flags` are remembered keys other events and threads read (docs/status/co-evil-story.md lists them);
//   `crisis` raises the region's crisis (the strands of STORY_FAMILIES_1 read `crisis-<strand>-start`).
// - config.counters: the species a lieutenant who has studied you brings against your party's most common type (A4).
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { TEAMS } from './_evil-story-teams.ts';

type Json = Record<string, unknown>;
const file = join(import.meta.dirname, '../../../src/data/evilTeams.json');
const data = JSON.parse(readFileSync(file, 'utf8')) as { config: Json; teams: (Json & { id: string; ops: (Json & { id: string })[] })[] };

const HOME: Record<string, string[]> = { rocket: ['kanto', 'johto'], aqua: ['hoenn'], magma: ['hoenn'], galactic: ['sinnoh'], plasma: ['unova'], flare: ['kalos'], skull: ['alola'], aether: ['alola'], yell: ['galar'], star: ['paldea'] };

const gone = (...lines: string[]) => ({ kind: 'speciesEncounterWeight', lines, value: 0.001 });
const L = (text: string, effects: Json[] = [], flags: (string | { key: string; amount: number })[] = [], crisis?: number) => ({ text, effects, flags, ...(crisis ? { crisis } : {}) });

const LASTING: Record<string, Json> = {
  // Rocket
  'pokemon-heist': L('Every Center in the region has fewer Pokémon to trade, and your rival was robbed too: their team is weaker.', [{ kind: 'rivalLevelOffset', value: -2 }], ['centers-fewer-trades']),
  'black-market': L('Pokémon with no papers turn up wild all over the region, and they are afraid of Balls.', [{ kind: 'captureMultiplier', value: 0.9 }], ['wild-no-papers']),
  'radio-tower': L('The signal forces evolutions: wild Pokémon in the region are evolved, stronger and angry.', [{ kind: 'speciesEncounterWeight', trait: 'fullyEvolved', value: 3 }, { kind: 'catchLevelOffset', value: 3 }], ['wild-forced-evolved']),
  'evolution-signal': L('Pokémon forced to evolve in this region are hurting: 10% lower in every stat.', [], ['forced-evo-hurt']),
  // Aqua
  'coastal-dig': L('The beach floods, and the turtles that nested there are gone from the region.', [gone('squirtle')], ['beach-flooded']),
  'submarine-theft': L('The deep trench is open to Aqua. Kyogre\'s Sign is harder to earn (one more needed).', [], [{ key: 'sign-need-kyogre', amount: 1 }]),
  'deep-sea-study': L('Aqua knows where Kyogre sleeps: at the Hideout it is half-awake, and the sea comes in.', [], ['team-aqua-legend-stirring']),
  'harbor-control': L('Ferries cost ₽500 for the rest of the region, and the sea roads are guarded.', [], [{ key: 'ferry-toll', amount: 500 }]),
  // Magma
  'volcano-drill': L('Fire hazards on every node of the region: burns come easier.', [{ kind: 'statusChanceMultiplier', status: 'brn', value: 1.5 }], ['fire-hazards']),
  'meteorite-heist': L('Magma can wake Groudon early: the Hideout climax is harder.', [], ['team-magma-climax-harder']),
  'magma-survey': L('The heartbeat under the mountain quickens: the Quake strand rises.', [], ['crisis-quake-raise'], 1),
  'hot-spring-closure': L('The hot springs are fenced: no hot-spring rests this region.', [], ['no-hot-springs']),
  // Galactic
  'lake-raid': L('The lake guardian is taken. Its Sign is lost for this run.', [], ['sign-lost-lake-guardian']),
  'energy-plant': L('Lights out across the region: the Blackout starts at Severity 2.', [], [{ key: 'crisis-blackout-start', amount: 2 }], 2),
  'spirit-lab': L('The Pokémon of the spirit lab, freed later, are listless: Bond grows slower.', [{ kind: 'friendshipMultiplier', value: 0.9 }], ['spirit-lab-listless']),
  'veilstone-warehouse': L('The fossils are shipped away: no fossil revival this region.', [], ['no-fossil-revival']),
  // Plasma
  'liberation-rally': L('One in five Roster trainers in this region releases their team.', [], ['roster-released']),
  'pokemon-confiscation': L('The checkpoints stay up: your Pokémon can be confiscated in town. Anything taken is in the Hideout\'s Holding Pen.', [], ['plasma-checkpoints']),
  'frigate-build': L('The ice cannon fires: it hails in every battle this region.', [{ kind: 'battleStart', weather: 'hail', turns: 5 }], ['region-hail']),
  'genesect-project': L('A rebuilt Genesect is loose, and hostile. It will come for you before the region is out.', [], ['genesect-loose']),
  // Flare
  'power-plant': L('The power is gone from the towns: the Blackout starts at Severity 1.', [], [{ key: 'crisis-blackout-start', amount: 1 }], 1),
  'stone-mining': L('The mine keeps running: Mega-capable Pokémon flicker in battle, and the Mega meter rises each stage.', [], ['flare-mine-running']),
  'ultimate-weapon': L('The land is drained: every rest in this region heals 10% less.', [{ kind: 'healingMultiplier', value: 0.9 }], ['land-drained']),
  'flare-tickets': L('The rich of the region leave with their tickets: shop prices rise 10%.', [{ kind: 'priceMultiplier', group: 'all', value: 1.1 }], ['region-rich-gone']),
  // Skull
  'pokemon-snatch': L('The daycare is closed for the rest of the region.', [], ['daycare-closed']),
  'trial-crash': L('The Island Trial is crashed: it is closed for this run.', [], ['trial-closed']),
  'town-takeover': L('The town\'s rest is Skull-run now: it heals only half.', [], ['rest-skull-run']),
  'skull-recruit': L('Skull has new members: three more Grunts in every ambush.', [], ['skull-recruited']),
  // Aether
  'preservation-lab': L('The frozen Pokémon are lost for this run.', [], ['frozen-lost']),
  'beast-research': L('The crack widens into a Tear: Ultra Beast rules in this region.', [], ['tear-open']),
  'type-null-project': L('Type: Null is Faba\'s weapon now. It will be sent after you before the region is out.', [], ['type-null-loose']),
  'sanctuary-closure': L('A rare species is fenced off: rare Pokémon are scarcer in the wild here.', [{ kind: 'encounterWeightMultiplier', group: 'rare', value: 0.6 }], ['sanctuary-fenced']),
  // Yell
  'stadium-block': L('The stadium\'s exhibition is cancelled.', [], ['exhibition-cancelled']),
  'route-chant': L('The chanting never stops: that route takes two nodes.', [], ['route-chant']),
  'ticket-scalp': L('Circuit rung entry costs ₽100 more this region.', [], [{ key: 'circuit-fee', amount: 100 }]),
  'fan-recruit': L('Twice the ambushes, but every one of them is a scarf-waving new fan.', [], ['yell-fans-recruited']),
  // Star
  'base-blockade': L('A road is closed for the rest of the region.', [], ['road-closed']),
  'class-crash': L('The trainer school is closed: fewer young Roster trainers.', [], ['school-closed']),
  'star-recruit': L('Star has a new member: one more in every ambush squad.', [], ['star-recruited']),
  'ruins-claim': L('The ruins are Star\'s: their Legendary\'s Sign is lost for this run.', [], ['sign-lost-ruins']),
  // Marauders
  'lineage-raids': L('Dratini, Larvitar and Beldum are taken: none can be found in this region.', [gone('dratini', 'larvitar', 'beldum')], ['lineage-taken']),
  'choir-sermons': L('One in five townsfolk joins the Marauders. Shops close early.', [{ kind: 'shopRefreshMultiplier', value: 0.8 }], ['shops-close-early']),
  'ferry-runs': L('The sea routes carry Marauder ambushes.', [], ['sea-ambush']),
  'engine-works': L('The Hideout\'s Engine is complete. At the climax it binds one of your Pokémon until you win.', [], ['team-marauders-engine']),
  // Choir
  'tolling-bells': L('The bells ring all night: no rest heals fully this region.', [{ kind: 'healingMultiplier', value: 0.85 }], ['bells-tolling']),
  'counting-stones': L('The Long Night: wild Pokémon are Ghost-touched for the region.', [{ kind: 'typeEncounterWeight', type: 'ghost', value: 3 }], ['long-night']),
  'quiet-recruits': L('The town is drowsy: fewer people stop you with something to say.', [], ['town-drowsy']),
  'shepherd-rites': L('The prophecy is complete: the Hideout climax is fought at night, and Dark and Ghost moves hit 10% harder.', [{ kind: 'damageTakenMultiplier', moveType: 'dark', value: 1.1 }, { kind: 'damageTakenMultiplier', moveType: 'ghost', value: 1.1 }], ['team-choir-night']),
  // Ironvein
  'veinheart-drill': L('The drill reaches the deep seam: the Quake starts, and Veinheart\'s Sign is harder.', [], [{ key: 'crisis-quake-start', amount: 1 }, { key: 'sign-need-veinheart', amount: 1 }], 1),
  'power-buyout': L('Every generator is the Combine\'s: shop prices rise 10%.', [{ kind: 'priceMultiplier', group: 'all', value: 1.1 }], ['power-bought']),
  'greenwall-cutting': L('A forest\'s wild nests are lost: Broken Habitat starts.', [], ['habitat-broken']),
  'seam-survey': L('The Combine finds Veinheart: at the Hideout it is in chains (freed by winning).', [], ['team-ironvein-veinheart-chained']),
  // Cartographers
  'relic-dig': L('The ruin is emptied: a fossil kind is gone from the region.', [], ['fossil-gone']),
  'map-theft': L('The old maps are gone: hidden places don\'t show on the map this region.', [], ['hidden-off-map']),
  'deep-charting': L('The Society has Brinecrown\'s bearings: its Sign is lost for this run.', [], ['sign-lost-brinecrown']),
  'local-guides': L('Every guide in the region works for the Society now: a friendly guide always betrays you.', [], ['guides-betray']),
  // Wildfire
  'pylon-strike': L('The lines are cut: the Blackout starts at Severity 2.', [], [{ key: 'crisis-blackout-start', amount: 2 }], 2),
  'pipeline-sabotage': L('The small fires grow: the Wildfire starts.', [], [{ key: 'crisis-wildfire-start', amount: 1 }], 1),
  'wild-release': L('The routes flood with displaced Pokémon: twice as many wild Pokémon, all of them scared.', [{ kind: 'captureMultiplier', value: 0.9 }], ['wild-displaced']),
  'manifesto-drive': L('The townsfolk side with the Accord, and the Rangers think less of you.', [], ['rangers-lost']),
  // Gilt
  'match-fixing': L('One Gym\'s results are bought: its Leader\'s team is 3 levels higher.', [], [{ key: 'gym-fixed', amount: 3 }]),
  'betting-ring': L('Gym battles in the region have hecklers: your Speed drops on turn one.', [], ['gym-hecklers']),
  'referee-bribes': L('Close calls go to the Circle: ties lose.', [], ['ties-lose']),
  'laurel-donations': L('Young Roster trainers owe the Circle, and one of them throws a match against you.', [], ['roster-throws']),
};

const COUNTERS: Record<string, string> = {
  normal: 'machamp', fire: 'swampert', water: 'jolteon', electric: 'golem', grass: 'arcanine', ice: 'magmortar', fighting: 'alakazam', poison: 'hippowdon', ground: 'gyarados',
  flying: 'electivire', psychic: 'houndoom', bug: 'talonflame', rock: 'poliwrath', ghost: 'mightyena', dragon: 'mamoswine', dark: 'lucario', steel: 'infernape', fairy: 'scizor',
};

for (const story of TEAMS) {
  const team = data.teams.find((t) => t.id === story.id);
  if (!team) throw new Error(`no team ${story.id} in evilTeams.json`);
  team.home = HOME[story.id] ?? [];
  team.legendary = story.legend.species;
  const op = story.ops[story.col.freeOp - 1];
  if (!op) throw new Error(`${story.id}: colleague's Operation ${story.col.freeOp} missing`);
  team.inside = { op: op.id, half: story.col.half === true };
  for (const def of team.ops) {
    const lasting = LASTING[def.id];
    if (!lasting) throw new Error(`no lasting effect for ${def.id}`);
    def.lasting = lasting;
  }
}
data.config.counters = COUNTERS;
writeFileSync(file, JSON.stringify(data, null, 1) + '\n');
console.log(`evilTeams.json: ${TEAMS.length} teams synced`);

// The Hideouts (SF13 A8, SF131): one chain pseudo-stage per team, drawn like a stage. The Warehouse Door, then one room per
// column chosen by the player, the boss, the boss's last words, the Holding Pen (SF133) and the Way Out. Each team draws its
// own infiltration rooms from the SF131 list, so no two Hideouts look the same and every room is used somewhere.
const ROOMS: Record<string, [string[], string]> = {
  rocket: [['vt-laser-maze', 'vt-password-lock'], 'vt-locked-chest'],
  aqua: [['vt-vent-crawl', 'vt-laser-maze'], 'vt-cargo-ship-ransack'],
  magma: [['vt-vent-crawl', 'vt-password-lock'], 'vt-safehouse-raid'],
  galactic: [['vt-laser-maze', 'vt-password-lock'], 'vt-prison-break'],
  plasma: [['vt-vent-crawl', 'vt-password-lock'], 'vt-cargo-ship-ransack'],
  flare: [['vt-laser-maze', 'vt-vent-crawl'], 'vt-locked-chest'],
  skull: [['vt-vent-crawl', 'vt-password-lock'], 'vt-safehouse-raid'],
  aether: [['vt-laser-maze', 'vt-password-lock'], 'vt-prison-break'],
  yell: [['vt-vent-crawl', 'vt-laser-maze'], 'vt-fake-gym-front'],
  star: [['vt-password-lock', 'vt-vent-crawl'], 'vt-fake-gym-front'],
  marauders: [['vt-laser-maze', 'vt-vent-crawl'], 'vt-cargo-ship-ransack'],
  choir: [['vt-vent-crawl', 'vt-password-lock'], 'vt-prison-break'],
  ironvein: [['vt-laser-maze', 'vt-password-lock'], 'vt-safehouse-raid'],
  cartographers: [['vt-vent-crawl', 'vt-laser-maze'], 'vt-cargo-ship-ransack'],
  wildfire: [['vt-password-lock', 'vt-vent-crawl'], 'vt-safehouse-raid'],
  gilt: [['vt-laser-maze', 'vt-password-lock'], 'vt-fake-gym-front'],
};
const chains = TEAMS.map((t) => {
  const [middle, last] = ROOMS[t.id]!;
  return {
    id: `ps_evil_hideout_${t.id}`, name: `${t.name} Hideout`, entry: `evil-${t.id}-hideout`, themeId: 'ghost-dark', tint: '#161a22', mood: 'dark and cold', team: t.id,
    layout: [['ps-evil-hideout-gate'], ['ps-evil-hideout-a', 'ps-evil-hideout-b', 'vt-camera-swap'], ['ps-evil-hideout-c', ...middle], ['ps-evil-hideout-d', last], ['evil-{teamId}-hideout-boss'], ['evil-{teamId}-hideout-after'], ['evil-{teamId}-rescue'], ['ps-evil-hideout-e']],
  };
});
const pseudoFile = join(import.meta.dirname, '../../../src/data/catalogOverhaul/pseudo/evil-story.json');
writeFileSync(pseudoFile, JSON.stringify({ category: 'evil-story', note: 'Evil Team Hideouts (STORY_FAMILIES_13 A8, STORY_FAMILIES_18 SF131 to SF133). Written by tools/events/co/_evil-story-sync.ts.', chains }, null, 1) + '\n');
console.log(`pseudo/evil-story.json: ${chains.length} Hideouts`);
