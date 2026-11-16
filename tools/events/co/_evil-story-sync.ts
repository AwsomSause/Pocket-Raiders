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

// Volume III: the inside route's six rank titles, per region (core/evil/inside.ts).
const ROUTES: Record<string, { region: string; ranks: string[]; steps?: number[]; max?: number; test?: number; out?: number; pay?: number[] }[]> = {
  rocket: [
    { region: 'kanto', ranks: ['Recruit', 'Grunt', 'Field Agent', 'Section Chief', 'Executive', `The Boss's Right Hand`] },
    { region: 'johto', ranks: ['Hopeful', 'Grunt', 'Operative', 'Cell Leader', 'Executive (the fifth)', 'The Voice'] },
  ],
  // Row 9 (evil-hoenn-sinnoh-unova): Volume III A and B, HOENN_TEAMS 2.1 to 2.5.
  galactic: [{ region: 'sinnoh', ranks: ['Applicant', 'Grunt', 'Technician', 'Adjutant', 'Commander (the fifth)', 'Witness'] }],
  plasma: [{ region: 'unova', ranks: ['Listener', 'Knight', 'Liberator', 'The Seventh Seat', "Keeper of the King's Room", "The King's Friend"] }],
  magma: [{ region: 'hoenn', ranks: ['Recruit', 'Grunt', 'Surveyor', 'Foreman', 'Admin', 'The Right Hand'], steps: [3, 8, 15, 25], max: 60, test: 6, out: 9, pay: [100, 200, 300, 400, 500, 600] }],
  aqua: [{ region: 'hoenn', ranks: ['Deckhand', 'Grunt', 'Diver', 'Bosun', 'Admin', 'The First Mate'], steps: [3, 8, 15, 25], max: 60, test: 6, out: 9, pay: [100, 200, 300, 400, 500, 600] }],
  flare: [{ region: 'kalos', ranks: ['Subscriber', 'Member', 'Stylist', 'Patron', 'Chosen', 'The Last Guest'] }],
  skull: [{ region: 'alola', ranks: ['Numbskull', 'Grunt', 'Big Sib', 'Enforcer', 'Admin', `Guzma's Second`] }],
  aether: [{ region: 'alola', ranks: ['Volunteer', 'Employee', 'Researcher', 'Branch Deputy', 'Branch Chief', `The President's Favourite`] }],
  yell: [{ region: 'galar', ranks: ['Supporter', 'Yeller', 'Road Crew', 'Head of the Queue', `Marnie's Corner`, `Piers's Opening Act`] }],
  star: [{ region: 'paldea', ranks: ['New Kid', 'Grunt', 'Squad Second', 'Sixth Boss', `Cassiopeia's Voice`, 'The One She Meets'] }],
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
  team.routes = ROUTES[story.id] ?? [];
  for (const def of team.ops) {
    // The doc's own name for the Operation (Part D), so the map, the journal and the scene agree.
    const named = story.ops.find((o) => o.id === def.id);
    if (!named) throw new Error(`${story.id}: no Operation ${def.id} in Part D`);
    def.name = named.name;
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
// SF130 The Holding Camp (Team Plasma's pool): the gate opens the Yard, the Yard opens the Handler (drawn from the events' own links).
chains.push({ id: 'ps_plasma_camp', name: 'The Plasma Holding Camp', entry: 'plasma-substage-gate', themeId: 'ghost-dark', tint: '#1a2230', mood: 'quiet, crates breathing in the dark' } as never);
// Volume III, Kanto: Act 3's door of four rooms, the four endings (each opened by its own Final Choice answer) and Team
// Ledger's freighter and Read-Out. The player stands on the room the choice opened.
const inside = (id: string, name: string, entry: string, layout: string[][], mood: string, tint = '#1e2230', team = 'rocket'): void =>
  void chains.push({ id, name, entry, themeId: 'ghost-dark', tint, mood, team, start: 'opened', layout } as never);
inside('ps_rk_tower', 'Pokémon Tower, at Night', 'rk-act3', [['rk-tower-graves'], ['rk-tower-stair'], ['rk-tower-third'], ['rk-tower-down']], 'cold, and quiet on a Thursday', '#22142e');
inside('ps_rk_plan', 'Silph Co.: Under New Management', 'rk-final-choice', [['rk-plan-hold'], ['rk-plan-gate'], ['rk-plan-rival'], ['rk-plan-defender'], ['rk-plan-roof'], ['rk-plan-verdict']], 'sealed, humming, raining on the roof');
inside('ps_rk_turn', 'Silph Co.: The Long Ledger, From the Top', 'rk-final-choice', [['rk-turn-11'], ['rk-turn-10'], ['rk-turn-9'], ['rk-turn-7'], ['rk-turn-6'], ['rk-turn-b'], ['rk-turn-roof'], ['rk-turn-door']], 'floor by floor, downward');
inside('ps_rk_police', 'Silph Co.: Safekeeping', 'rk-final-choice', [['rk-police-cordon'], ['rk-police-arrests'], ['rk-police-roof'], ['rk-police-door']], 'forty officers on the stairs');
inside('ps_rk_own', 'Silph Co.: The Fourth Rule', 'rk-final-choice', [['rk-own-duel'], ['rk-own-matori'], ['rk-own-callers'], ['rk-own-list'], ['rk-own-rigs'], ['rk-own-roof'], ['rk-own-rule', 'rk-own-lost']], 'an office that is yours now');
// Volume III, Johto: Act 3's dress rehearsal, the four endings at Noon, and Team Static's car park and Two Frequencies.
// A lost duel's Verdict sits in the last column, so it is only reached by losing and walks straight back out.
inside('ps_neo_tower', 'The Radio Tower: Dress Rehearsal', 'neo-act3', [['neo-tower-basement'], ['neo-tower-studio'], ['neo-tower-library'], ['neo-tower-roof']], 'a building that hums at night', '#1e1e2e');
inside('ps_neo_plan', 'The Radio Tower: The Call', 'neo-final-choice', [['neo-plan-hold'], ['neo-plan-keys'], ['neo-plan-rival'], ['neo-plan-defender'], ['neo-plan-roof'], ['neo-plan-door'], ['neo-plan-verdict']], 'every radio in Johto on', '#1e1e2e');
inside('ps_neo_turn', 'The Radio Tower: Dead Air, From the Booth', 'neo-final-choice', [['neo-turn-air-1'], ['neo-turn-air-2'], ['neo-turn-studio'], ['neo-turn-corridor'], ['neo-turn-third'], ['neo-turn-library'], ['neo-turn-lobby'], ['neo-turn-basement'], ['neo-turn-roof'], ['neo-turn-after']], 'from the microphone, downward', '#1e1e2e');
inside('ps_neo_lance', `The Radio Tower: The Dragon's Order`, 'neo-final-choice', [['neo-lance-windows'], ['neo-lance-order'], ['neo-lance-roof'], ['neo-lance-ball']], 'a Dragonite at every window', '#1e1e2e');
inside('ps_neo_own', 'The Radio Tower: Standby No Longer', 'neo-final-choice', [['neo-own-duel'], ['neo-own-chair'], ['neo-own-hour'], ['neo-own-hour-2'], ['neo-own-signal'], ['neo-own-tails'], ['neo-own-celebi'], ['neo-own-call', 'neo-own-lost']], 'a microphone left on', '#1e1e2e');
inside('ps_static_mary', 'Broadcast 1: This Is Mary', 'static-broadcast-1', [['static-mary-roof'], ['static-mary-switch']], 'a suitcase on a car park roof, in the rain', '#1e2a2e');
inside('ps_static_air', 'Two Frequencies', 'static-two-frequencies', [['static-air-roof'], ['static-air-after']], 'a kettle whistling on every band', '#1e2a2e');
inside('ps_ledger_freighter', 'The Vermilion Freighter', 'ledger-audit-2', [['ledger-freighter-deck'], ['ledger-freighter-hold'], ['ledger-freighter-crane']], 'a clipboard on a wet deck', '#1a2230');
inside('ps_ledger_readout', 'Silph Co.: The Read-Out', 'ledger-readout', [['ledger-readout-floors'], ['ledger-readout-top']], 'six people and a tea towel');
// Volume III, Kalos (evil-story-30/31): Act 3's door on Route 10, the four endings under Geosenge, Team Ember's laundry.
const flare = (id: string, name: string, entry: string, layout: string[][], mood: string, tint = '#1e1418'): void =>
  void chains.push({ id, name, entry, themeId: 'ghost-dark', tint, mood, team: 'flare', start: 'opened', layout } as never);
flare('ps_fl_stones', 'Route 10: The Stones', 'fl-act3', [['fl-stones-rows'], ['fl-stones-wiring'], ['fl-stones-fourth'], ['fl-stones-last'], ['fl-stones-tag']], 'red cables humming between the stones', '#1e2418');
flare('ps_fl_plan', 'Geosenge: So Clean', 'fl-final-choice', [['fl-plan-lobby'], ['fl-plan-rival'], ['fl-plan-sycamore'], ['fl-plan-petals'], ['fl-plan-aim'], ['fl-plan-light'], ['fl-plan-last']], 'a table laid for forty, and a countdown');
flare('ps_fl_turn', 'Geosenge: No Refunds', 'fl-final-choice', [['fl-turn-key'], ['fl-turn-lysandre'], ['fl-turn-offer'], ['fl-turn-flower'], ['fl-turn-rubble']], 'a key, warm in your hand');
flare('ps_fl_az', 'Geosenge: Back', 'fl-final-choice', [['fl-az-door'], ['fl-az-four'], ['fl-az-four-2'], ['fl-az-back'], ['fl-az-hour']], 'a very tall man, stooping');
flare('ps_fl_own', 'Geosenge: A Bigger Well', 'fl-final-choice', [['fl-own-console'], ['fl-own-malva'], ['fl-own-clapping', 'fl-own-lost'], ['fl-own-list'], ['fl-own-fees'], ['fl-own-flower'], ['fl-own-staff'], ['fl-own-yarborough']], 'a coat, and a better question');
flare('ps_ember_laundry', `Thursday's Laundry`, 'ember-stop-1', [['ember-laundry-1'], ['ember-laundry-2'], ['ember-laundry-gala']], 'steam, starch and four hundred red suits', '#2a2420');

// Volume III, Alola (evil-story-33/34): the cold room for each side, then the five endings and Team Tidepool's walks. An ending
// both sides share is one chain per side (the entry is that side's Final Choice); the region's own team's chain wins.
const alola = (id: string, team: string, name: string, entry: string, layout: string[][], mood: string, tint = '#1a1a2e'): void =>
  void chains.push({ id, name, entry, themeId: 'ghost-dark', tint, mood, team, start: 'opened', layout } as never);
alola('ps_sk_cold', 'skull', 'Preserved', 'sk-act3', [['sk-cold-drain'], ['sk-cold-rows'], ['sk-cold-case'], ['sk-cold-last'], ['sk-cold-after']], 'B2, from below: a drain, rows of cases, a case your height.', '#1a2230');
alola('ps_ae_cold', 'aether', 'Preserved', 'ae-act3', [['ae-cold-rows'], ['ae-cold-tall'], ['ae-cold-case'], ['ae-cold-last'], ['ae-cold-after']], 'B2, from above: rows of cases, and something tall at the back.', '#1a2230');
const PLAN = [['al-plan-hau'], ['al-plan-rival'], ['al-plan-nanu'], ['al-plan-pylons'], ['al-plan-through-ae', 'al-plan-through-sk'], ['al-plan-stay']];
const TURN = [['al-turn-between'], ['al-turn-fight'], ['al-turn-lillie']];
const BOTH = [['al-both-deck'], ['al-both-guzma'], ['al-both-lusamine'], ['al-both-sign'], ['al-both-cold'], ['al-both-gate'], ['al-both-forty'], ['al-both-ladle']];
for (const [p, team] of [['sk', 'skull'], ['ae', 'aether']] as const) {
  alola(`ps_${p}_plan`, team, 'Where Nothing Leaves', `${p}-final-choice`, PLAN, 'The upper deck, and through: a sea with no water in it, and a hundred pale bells.', '#10101c');
  alola(`ps_${p}_turn`, team, 'Come Home, All of You', `${p}-final-choice`, TURN, 'Between Lusamine and the gate.');
  alola(`ps_${p}_both`, team, 'Both Halves', `${p}-final-choice`, BOTH, 'A deck, a dock, forty kids, two hundred staff, and a gate, open.');
}
alola('ps_ae_case', 'aether', 'Case by Case', 'ae-final-choice', [['al-case-key'], ['al-case-pua'], ['al-case-carry'], ['al-case-tale'], ['al-case-gate']], 'A key across the deck, sixty cases, a lift that holds four.', '#1a2230');
alola('ps_sk_placed', 'skull', 'Placed', 'sk-placed-warn-2', [['al-placed-list'], ['al-placed-plumeria'], ['al-placed-ledger'], ['al-placed-gate']], 'A list of forty names, a white boat, and a ledger.', '#3a3428');
alola('ps_tp_entries', undefined as never, 'Three Open Entries', 'tp-return-1', [['tp-r1-rockruff'], ['tp-r1-cutiefly'], ['tp-r1-mudbray']], 'The Borrow Book: three not brought back.', '#1e3a40');
alola('ps_tp_still', undefined as never, 'Still Here', 'tp-still-here', [['tp-still-two'], ['tp-still-corsola'], ['tp-still-pelago'], ['tp-still-close'], ['tp-still-faba']], 'The upper deck, the gate, and a lot of stairs.');

// Volume III, Galar (evil-story-36/37): Galar's team is Yell; both inside routes (Macro Cosmos, Yell) run on its meters.
const galar = (id: string, name: string, entry: string, layout: string[][], mood: string, tint = '#1e2430'): void =>
  void chains.push({ id, name, entry, themeId: 'ghost-dark', tint, mood, team: 'yell', start: 'opened', layout } as never);
galar('ps_mc_flicker', 'The Flicker', 'mc-act3', [['mc-flicker-plant'], ['mc-flicker-board'], ['mc-flicker-hollis']], 'Under Hammerlocke: a cage of light, and a board of feeders.', '#2a1420');
galar('ps_mc_plan', 'Launch Day', 'mc-final-choice', [['mc-plan-hop'], ['mc-plan-sonia'], ['mc-plan-leon'], ['mc-plan-relays'], ['mc-plan-switch'], ['mc-plan-roof']], 'Rose Tower, and a red wind on the roof.', '#3a1418');
galar('ps_mc_turn', `There's Time`, 'mc-final-choice', [['mc-turn-breaker'], ['mc-turn-ballguy'], ['mc-turn-hollis'], ['mc-turn-pryce'], ['mc-turn-thirtyone'], ['mc-turn-oleana'], ['mc-turn-fifty']], 'The Tower Climb, from the bottom, with a lanyard.');
galar('ps_mc_lift', 'Sixty in a Lift', 'mc-final-choice', [['mc-lift-feeder'], ['mc-lift-lift'], ['mc-lift-fifty']], 'A brass lever, and sixty people in a lift rated for twelve.');
galar('ps_mc_own', 'A Thousand Years', 'mc-final-choice', [['mc-own-roof'], ['gl-own-rose'], ['gl-own-mug'], ['gl-own-map'], ['gl-own-cage'], ['gl-own-yell'], ['gl-own-oleana']], 'The roof, the Chair, and the first hour.');
galar('ps_yl_plan', 'Is This On?', 'yl-final-choice', [['yl-plan-feed'], ['yl-plan-truck'], ['yl-plan-aux'], ['yl-plan-chant'], ['yl-plan-rounds'], ['yl-plan-above']], 'The stands, the concourse, the truck, and five stadiums chanting.', '#3a1418');
galar('ps_yl_turn', 'Go Home and Eat', 'yl-final-choice', [['yl-turn-coach'], ['yl-turn-final'], ['yl-turn-red'], ['yl-turn-after']], 'Block J, empty, and a towel on a seat.', '#3a1418');
galar('ps_yl_bought', 'Bought', 'yl-bought-warn-2', [['yl-bought-gate'], ['yl-bought-beck'], ['yl-bought-offer']], 'A key, a shutter, and a contract four lines long.', '#1a141c');
galar('ps_yl_own', 'A Thousand Years', 'yl-final-choice', [['yl-own-blockj'], ['gl-own-rose'], ['gl-own-mug'], ['gl-own-map'], ['gl-own-cage'], ['gl-own-yell'], ['gl-own-oleana']], 'Block J, the roof, the Chair, and the first hour.');
galar('ps_enc_quarry', 'Away Day: The Quarry', 'enc-away-1', [['enc-q-road'], ['enc-q-pitch'], ['enc-q-match']], 'A coach that does not fit, a generator, and floodlights that come on with a clunk.', '#2a2418');
galar('ps_enc_island', 'Away Day: The Island', 'enc-away-2', [['enc-i-beach'], ['enc-i-match']], 'An island with one house, and one trainer.', '#1e3a40');
galar('ps_enc_12k', 'Twelve Thousand', 'enc-twelve-thousand', [['enc-12k-street'], ['enc-12k-sky'], ['enc-12k-chairman'], ['enc-12k-brothers']], 'Spikemuth, with the shutters up.', '#1a141c');
// Volume III, Paldea (evil-story-39/40): Act 3's door into the Academy, the four endings in the yard, Team Homeroom's Lunches.
const paldea = (id: string, name: string, entry: string, layout: string[][], mood: string, tint = '#1a1a2a'): void =>
  void chains.push({ id, name, entry, themeId: 'ghost-dark', tint, mood, team: 'star', start: 'opened', layout } as never);
paldea('ps_st_file', 'Forty-One, One Friday', 'st-act3', [['st-file-corridor'], ['st-file-records'], ['st-file-torch']], 'The Academy at night: lockers, a records room, a torch.', '#1c2038');
paldea('ps_st_plan', 'By Their Own Rules', 'st-final-choice', [['st-plan-giacomo'], ['st-plan-mela'], ['st-plan-atticus'], ['st-plan-ortega'], ['st-plan-eri'], ['st-plan-rule4'], ['st-plan-buyers'], ['st-plan-engines']], 'Five bonnets, under the clock, one after another.');
paldea('ps_st_turn', 'By Post', 'st-turn-warn-2', [['st-turn-map'], ['st-turn-eri'], ['st-turn-post'], ['st-turn-buyers']], 'A folded map: five hills, five crosses.');
paldea('ps_st_academy', 'Read in the Yard', 'st-final-choice', [['st-academy-mop'], ['st-academy-hours'], ['st-academy-apology'], ['st-academy-buyers']], 'A mop, leaned on a wall, and a box of seventy-one Fridays.');
paldea('ps_st_own', 'In Daylight', 'st-final-choice', [['st-own-bonnet'], ['st-own-giacomo'], ['st-own-mela'], ['st-own-atticus'], ['st-own-ortega'], ['st-own-eri'], ['st-own-penny'], ['st-own-nascour'], ['st-own-rule5'], ['st-own-helmets'], ['st-own-engines'], ['st-own-building'], ['st-own-star']], 'A sixth bonnet, six battles, and the first hour.');
paldea('ps_hr_lunch1', 'Eleven Places', 'hr-lunch-1', [['hr-l1-stall'], ['hr-l1-boiler'], ['hr-l1-nurse']], 'A map of eleven places a person eats alone.', '#1c2038');
paldea('ps_hr_lunch2', 'Double Maths', 'hr-lunch-2', [['hr-l2-walk'], ['hr-l2-canteen']], 'A hill, a speaker, and a canteen at one o\'clock.', '#1c2038');
paldea('ps_hr_pyjamas', 'Pyjamas', 'hr-pyjamas', [['hr-pj-count'], ['hr-pj-mop'], ['hr-pj-buyers']], 'The yard, and two hundred children in dressing gowns.');
writeFileSync(pseudoFile, JSON.stringify({ category: 'evil-story', note: 'Evil Team Hideouts (STORY_FAMILIES_13 A8, STORY_FAMILIES_18 SF131 to SF133) and the Plasma Holding Camp (SF130). Written by tools/events/co/_evil-story-sync.ts.', chains }, null, 1) + '\n');
console.log(`pseudo/evil-story.json: ${chains.length} Hideouts`);
