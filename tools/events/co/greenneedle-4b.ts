// Greenneedle, part 4 (second half): gn.19 The Deep Savanna and gn.20 The Lush Jungle (doc GREENNEEDLE_REWORKED_PLACED_4.md).
// Both are reached from Safari Land's far gate (gn-19-far / gn-20-far, opened by core/greenneedle/safariEnd.ts) or found on their own step.
// Build: npm run co:build -- greenneedle-4b   then   npm run co:gn
import { anyType, ch, fight, flag, heal, hurt, hurtLead, item, join, leave, out, room, wild, type Json } from '../dsl.ts';
import { bond, chIf, eitherWay, fossil, gev, gn, inside, is, kindness, leavePseudo, moment, not, regionChanged, rm, roll, say, scene, setTo, stampRegion, stampStage, when, type Placement } from './_gn.ts';

export { CATEGORY } from './_gn.ts';

const clamp = (key: string, min: number, max: number): Json => gn('clampFlag', { key, min, max });

// =====================================================================================================================
// gn.19  THE DEEP SAVANNA  (Pseudo Stage: six nodes; needs hot or cave; step 13, optional, instead of the battle; once a run).
// Water flasks (start 3; a dry crossing costs 1; empty: the party starts each fight at 90% HP), day and night, migrations,
// a sandstorm on every fight's first turn (gnBattleStart, rule `savanna`), and the wounded Donphan.
// =====================================================================================================================
const SAVANNA_TINT = '#b08a3a';
const sav = (o: Json = {}): Json => ({ tint: SAVANNA_TINT, tags: ['Pokémon', 'Exploration', 'Story'], effect: 'none', pokemon: 'donphan', ...o });
const DAY_POOL = ['sandshrew', 'trapinch', 'hippopotas', 'diglett', 'cacnea', 'maractus', 'gible', 'larvitar', 'rhyhorn', 'tauros', 'helioptile', 'dunsparce', 'stunfisk', 'sandygast', 'phanpy'];
const NIGHT_POOL = ['sandile', 'krokorok'];
const WATER = 'savanna-water';
/** A dry crossing: one flask. When the flasks run dry, it says so. */
const DRINK = (n = 1): Json[] => [flag(WATER, -n), clamp(WATER, 0, 9), when(WATER, { min: 0, max: 0 }, [], 'Your flasks are empty. Until a refill, your party starts each fight at 90% HP.')];
const REFILL: Json[] = [setTo(WATER, 3)];
const hasWater = (n = 1): Json => is(WATER, n);
const savFight = (pool: string[], win: Json[], rule = 'savanna'): Json => inside(eitherWay({ ...wild({ species: pool, lv: 1, win }), rule: { gn: rule } }));
const night = (win: Json[]): Json => savFight(NIGHT_POOL, win);
const WATER_LEFT: Json[] = [
  { id: 'water-1', when: [is(WATER, 1)], notice: 'Water: {count:savanna-water} of 3 flasks.' },
  { id: 'water-0', when: [is(WATER, 0, 0)], notice: 'Water: none. Your party starts each fight at 90% HP.' },
];
const sroom = (id: string, name: string, o: Json, intro: string, choices: Json[]): Json => rm(id, name, sav({ remembers: WATER_LEFT, ...o }), intro, choices);

const EDGE = say(
  'The fence stops. The grass is the colour of straw, and it goes on to the edge of the world.',
  '*No warden\'s voice out here.*',
  'It hasn\'t rained. You carry three flasks of water. Every dry crossing costs one.',
);
const WALK_IN: Json[] = [
  ch('Walk in.', out('You step past the last fence post. Nobody is counting your steps now.',
    flag('savanna-entered'), stampStage('savanna-at'), stampRegion('savanna-region'), setTo(WATER, 3), setTo('savanna-night', 0),
    when('crowned-calf-calmed', { min: 1 }, [setTo('savanna-hippo', 1)]), when('alphas-second-channel', { min: 1 }, [setTo('savanna-hippo', 1)]),
    // The second channel dug at Two Alphas, One River sets `river-shared` (new-events-1.ts).
    when('river-shared', { min: 1 }, [setTo('savanna-hippo', 1)]),
    // The savanna is walked (core/greenneedle/zone.ts): the first room, gn-19-thirsty, waits at its place on the grid.
    gn('minigame', { key: 'gn-savanna', n: 1 }))),
  ch('Turn back.', leave('You turn back to the fence. The grass hisses behind you.')),
];
/** Migrations: herds cross the map. 35% that one is on the way ahead (the stop's own seeded roll): the herd's scene opens, else the way on. */
const MIGRATION = (herd: string, on: Json): Json[] => [roll('savanna-herd', 35), when('savanna-herd', { min: 1 }, [scene(herd)]), when('savanna-herd', { min: 0, max: 0 }, [on])];
/** A herd on the node by day: it blocks it for a turn. Wait, or go round (one flask). */
const herdByDay = (id: string, who: string, text: string, on: Json): Json => sroom(id, 'The Deep Savanna: A Herd Crossing', { pokemon: who }, say(text, 'The way ahead is blocked until they have gone by. You can wait, or go round them: the long way, in the sun, a flask\'s worth.'), [
  ch('Wait for the herd to pass.', out('You sit down in what shade your own shadow makes. They go by for most of an hour, calves in the middle, and the dust they raise hangs a long time after. Then the way is clear.', on)),
  chIf([hasWater()], 'Go round (one flask).', out('You go the long way round, with the herd a brown line on your left the whole time.', ...DRINK(), on)),
]);
/** A trade with a wild Pokémon: one flask. */
const trade = (label: string, text: string, ...effects: Json[]): Json => chIf([hasWater()], label, out(text, ...DRINK(), ...effects, ...MIGRATION('gn-19-herd-edge', scene('gn-19-cross'))));

const gn19: Json[] = [
  gev('gn-19-door', 'The Deep Savanna', sav({ stop: 'event', rarity: 'rare', types: ['ground'], requires: [not('savanna-entered')] }), EDGE, WALK_IN),
  gev('gn-19-far', 'The Deep Savanna', sav({ stop: 'event', rarity: 'rare', types: ['ground'], requires: [not('savanna-entered')] }), say(
    '**Warden:** "Beyond here, it isn\'t a park. Nobody\'s counting your steps. Nobody\'s coming to fetch you, either."',
    EDGE,
  ), WALK_IN),
  sroom('gn-19-thirsty', 'The Deep Savanna: The Edge', { pokemon: 'sandile' }, say(
    'A Sandile has followed you since the fence. It isn\'t hunting. It\'s looking at your flask.',
    'Out here, water is worth more than anything you carry.',
  ), [
    trade('Trade a flask for what it\'s carrying.', 'It drinks, and drops a smooth stone at your feet. It was carrying it in its mouth all this way.', item('smooth-rock')),
    trade('Trade a flask, and let it come along.', 'It drinks, then trots at your heel as if it always had.', join({ species: ['sandile'] })),
    trade('Trade a flask for the way.', 'It drinks, then leads you a little way and stops, nose pointing: round the dust, not through it.', setTo('savanna-path', 1)),
    ch('Keep your water.', out('You keep your flask. The Sandile watches you go.', ...MIGRATION('gn-19-herd-edge', scene('gn-19-cross')))),
  ]),
  sroom('gn-19-cross', 'The Deep Savanna: The Edge', { pokemon: 'trapinch' }, say(
    'Dry ground between here and the first waterhole. The sun is a hand on the back of your neck.',
  ), [
    ch('Cross (one flask).', fight('Halfway across, the sand opens.', savFight(DAY_POOL, [room('gn-19-waterhole')]), ...DRINK())),
    // The water trade with a wild Pokémon, again: the thing in the pit will take a flask instead of a fight.
    chIf([hasWater(2)], 'Cross, and pour a flask into the pit that opens (two flasks).', out(
      'Halfway across, the sand opens. You pour before it can spring. A Trapinch drinks with its whole head under, and when it comes up it shoves a pouch of fine sand out of the pit toward you, and sinks, and lets you by.',
      ...DRINK(2), item('soft-sand'), room('gn-19-waterhole'),
    )),
    chIf([hasWater(2)], 'Cross, pour it a flask, and wait by the pit (two flasks).', out(
      'Halfway across, the sand opens. You pour, and you wait. A Trapinch drinks, and looks at the flask, and at you, and climbs out of its pit, and does not go back.',
      ...DRINK(2), join({ species: ['trapinch'] }), room('gn-19-waterhole'),
    )),
  ]),
  herdByDay('gn-19-herd-edge', 'tauros', 'Tauros. A hundred of them, crossing your path at a walk, heads down, following the smell of water somewhere you cannot see.', scene('gn-19-cross')),
  herdByDay('gn-19-herd-ridge', 'rhyhorn', 'Rhyhorn, in a long grey file between the waterhole and the ridge, nose to tail, and not one of them looks at you.', room('gn-19-watch')),
  sroom('gn-19-waterhole', 'The Deep Savanna: The First Waterhole', { pokemon: 'hippowdon' }, say(
    'The first waterhole. A Hippowdon lies in the middle of it, and doesn\'t move.',
    'It isn\'t guarding the water from you. It\'s guarding it from the sun.',
  ), [
    chIf([is('savanna-hippo')], 'Walk to the water.', out('The Hippowdon shifts over without being asked, as if it had heard about you.', ...REFILL, heal(0.3), ...MIGRATION('gn-19-herd-ridge', room('gn-19-watch')))),
    ch('Wait until it sleeps.', out('You wait. The sun moves. At last its eyes close, and you fill your flasks without a sound.', ...REFILL, heal(0.3), ...MIGRATION('gn-19-herd-ridge', room('gn-19-watch')))),
    { ...ch('Offer it shade (a large Pokémon stands by it).', out('Your biggest Pokémon stands between it and the sun. The Hippowdon sighs, a long, sandy sigh, and lets you drink.', ...REFILL, heal(0.3), kindness(1), ...MIGRATION('gn-19-herd-ridge', room('gn-19-watch'))), { requires: [{ kind: 'gn', test: 'heavy' }] }) },
    ch('Battle.', fight('It heaves itself up, streaming water.', savFight(['hippowdon'], [...REFILL, ...MIGRATION('gn-19-herd-ridge', room('gn-19-watch'))]))),
  ]),
  sroom('gn-19-watch', 'The Deep Savanna: The Watching Place', { pokemon: 'phanpy' }, say(
    'A ridge over a plain. Nothing attacks here.',
    'Below, a herd of Phanpy and Donphan moves slowly, in a line, trunk to tail.',
  ), [
    ch('Watch.', out(say(
      'You sit. Your team sits with you. You watch for a long time.',
      'Then you see it: the herd has stopped moving.',
    ), heal(1), bond(1), setTo('savanna-night', 1), room('gn-19-herd'))),
    ch('Move on.', out('You move on. The sun goes down behind you, fast, the way it does out here.', setTo('savanna-night', 1), room('gn-19-herd'))),
  ]),
  sroom('gn-19-herd', 'The Deep Savanna: Night', { pokemon: 'krokorok' }, say(
    'It\'s night. The predators come out: Sandile and Krokorok hunt, and the grazers bunch up.',
    'A herd is crossing your path, nose to tail. It will take a while.',
  ), [
    ch('Wait for the herd to pass.', fight('You wait in the dark. Something else is waiting too.', night([scene('gn-19-devil')]))),
    chIf([hasWater()], 'Go round (one flask).', out('You go the long way round the herd, in the dark.', ...DRINK(), scene('gn-19-devil'))),
    chIf([hasWater(), not('savanna-path')], 'Hold a flask out to the eyes in the dark.', out(
      'One pair of eyes comes closer. A Krokorok, alone, thinner than the others. It drinks. Then it walks you through the herd by a gap you would never have seen, and stops, and points with its snout at the dust ahead: round it, not through it.',
      ...DRINK(), setTo('savanna-path', 1), scene('gn-19-devil'),
    )),
  ]),
  sroom('gn-19-devil', 'The Deep Savanna: The Dust Devil', { pokemon: 'diglett' }, say(
    'A dust devil, spinning across the path. It doesn\'t go away. It doesn\'t go anywhere.',
    'Through it, the lead will lose an eighth of its HP and a step of Speed. A Ground-type would walk through untouched.',
  ), [
    chIf([is('savanna-path')], 'Go the way the Sandile showed you.', out('Round the dust, not through it. Exactly as it pointed.', roll('savanna-oasis', 10), when('savanna-oasis', { min: 1 }, [scene('gn-19-oasis')]), when('savanna-oasis', { min: 0, max: 0 }, [scene('gn-19-on')]))),
    ch('Walk through it.', out('You put your head down and go through.',
      hurtLead(0.125, ['ground']), gn('check', { key: 'savanna-ground-lead', if: [{ kind: 'leadType', type: 'ground' }] }),
      when('savanna-ground-lead', { min: 0, max: 0 }, [gn('leadBoost', { type: 'spe', n: -1 })], 'Your lead comes out coughing, slower for it.'),
      when('savanna-ground-lead', { min: 1 }, [], 'Your Ground-type walks through as if it were a breeze.'),
      roll('savanna-oasis', 10), when('savanna-oasis', { min: 1 }, [scene('gn-19-oasis')]), when('savanna-oasis', { min: 0, max: 0 }, [scene('gn-19-on')]))),
  ]),
  sroom('gn-19-oasis', 'The Deep Savanna: An Oasis', { pokemon: 'diglett' }, say(
    'Behind the dust devil: an oasis. Palms, and clear water, and a ring of little heads.',
    'A Diglett group lives here. The sand slides off them like water.',
  ), [
    ch('Fill your flasks.', out('Cold water. You drink until it hurts.', ...REFILL, scene('gn-19-on'))),
    ch('Let a Diglett come along.', out('One of them pops up by your boot and doesn\'t go back down.', ...REFILL, { ...join({ species: ['diglett'] }), ability: 'sand-veil' }, scene('gn-19-on'))),
  ]),
  sroom('gn-19-on', 'The Deep Savanna: The Dust Devil', { pokemon: 'donphan' }, say('Beyond the dust, a dry stretch, and then a sound: a herd, calling, not moving.'), [
    ch('Cross (one flask).', out('You follow the sound across the dark.', ...DRINK(), room('gn-19-ring'))),
  ]),
  sroom('gn-19-ring', 'The Deep Savanna: The Wounded Leader', { pokemon: 'donphan' }, say(
    '*The herd\'s in a ring. In the middle, the biggest Donphan you have seen, lying on its side. One leg\'s wrong.*',
    '*The herd won\'t leave it. They haven\'t drunk in two days.*',
    '*On the ridge, eyes. A lot of them.*',
  ), [
    ch('Guard it through the night.', GUARD()),
    chIf([hasWater(2)], 'Treat it.', out('You kneel by the leg. It will take two flasks, and one more thing.', scene('gn-19-treat'))),
    ch('Lead the herd on without it.', out(say(
      'Your lead walks to the front. The herd looks at the leader.',
      'The leader lifts its trunk, once, and puts it down.',
      'They follow you to water. It stays.',
    ), flag('savanna-led-on'), room('gn-19-dawn'))),
    ch('Walk past.', out('You walk round the ring and on. Behind you, nobody moves.', flag('savanna-walked-past'), room('gn-19-dawn'))),
  ]),
  sroom('gn-19-ring-2', 'The Deep Savanna: The Wounded Leader', { pokemon: 'donphan' }, say(
    'The herd stays in its ring round the leader. The eyes on the ridge are still there, but fewer.',
  ), [
    chIf([not('savanna-guarded')], 'Guard it through the night.', GUARD()),
    chIf([not('savanna-treated'), hasWater(2)], 'Treat it.', out('You kneel by the leg. It will take two flasks, and one more thing.', scene('gn-19-treat'))),
    ch('Go on to the water.', out('At first light the herd moves, slowly, all together, and the leader with it.', room('gn-19-dawn'))),
  ]),
  sroom('gn-19-guard2', 'The Deep Savanna: The Second Wave', { pokemon: 'krokorok' }, say('They come again, low and fast. A Donphan swings round to stand by your lead.'), [
    ch('Hold.', fight('Teeth in the dark.', savFight(NIGHT_POOL, [scene('gn-19-guard3')], 'herd'))),
  ]),
  sroom('gn-19-guard3', 'The Deep Savanna: The Third Wave', { pokemon: 'krokorok' }, say('The last of them, and the biggest. Behind you, the herd stamps the ground.'), [
    ch('Hold.', fight('It goes for your lead. A trunk swings out of the dark.', savFight(['krokorok'], [flag('savanna-guarded'), flag('savanna-helped'), moment('You stood guard over a wounded Donphan all night, and the herd stood with you.', 75), scene('gn-19-ring-2')], 'herd'))),
  ]),
  sroom('gn-19-treat', 'The Deep Savanna: Treating It', { pokemon: 'donphan' }, say(
    'Two flasks to clean it and cool it. And one of: a Grass-type\'s help, a Berry, or your own time.',
  ), [
    { ...ch('With a Grass-type\'s help.', out('Your Grass-type binds the leg with vines, tight and careful. By dawn it stands, on three legs and stubbornness.', ...DRINK(2), ...TREATED()), { requires: [anyType('grass')] }) },
    { ...ch('With a Berry.', out('You crush a Berry into the wound. It flinches, then leans on you. By dawn it stands, on three legs and stubbornness.', gn('payBerry'), ...DRINK(2), ...TREATED()), { requires: [{ kind: 'gn', test: 'holdsBerry' }] }) },
    ch('With your own time.', out('You sit with it, hour after hour, and keep the flies off. The clock moves on into the night. By dawn it stands, on three legs and stubbornness.', setTo('savanna-night', 1), ...DRINK(2), ...TREATED())),
  ]),
  sroom('gn-19-dawn', 'The Deep Savanna: The Second Waterhole', { pokemon: 'phanpy', remembers: [...WATER_LEFT, { id: 'led-on', when: [is('savanna-led-on')], notice: '*At the second waterhole, the herd drinks. A calf keeps looking back the way they came.*' }] }, say(
    'Dawn, at the second waterhole. Nothing attacks here.',
    '*Predators and grazers, side by side, for the length of one sunrise. Nobody explains it.*',
  ), [
    chIf([is('savanna-helped')], 'Take the calf.', out('The leader pushes a Phanpy forward with its trunk. It stumbles to you and stays.',
      join({ species: ['phanpy'] }), item('soft-sand'), gn('check', { key: 'savanna-both', if: [is('savanna-guarded'), is('savanna-treated')] }),
      when('savanna-both', { min: 1 }, [fossil('local')], 'Then the whole herd turns and leads you to a place where the ground is soft. Buried there: a fossil.'),
      ...REFILL, scene('gn-19-prize'))),
    chIf([is('savanna-led-on')], 'Follow the herd.', out('The herd leads you away from the water to a place where the ground is soft. Buried there: a fossil.', fossil('local'), ...REFILL, scene('gn-19-prize'))),
    chIf([is('savanna-walked-past')], 'Watch them drink.', out('Nothing but a long look, across the water, from the herd you walked past.', ...REFILL, scene('gn-19-prize'))),
  ]),
  sroom('gn-19-prize', 'The Deep Savanna: Out', { pokemon: 'gible' }, say('The savanna\'s edge, and a fence post. Something to take with you.'), [
    ch('Soft Sand', out('A pouch of fine, warm sand.', item('soft-sand'), ...OUT19())),
    ch('A Smooth Rock', out('A rock worn smooth by a thousand sandstorms.', item('smooth-rock'), ...OUT19())),
    ch('A Gible with Rough Skin', out('A Gible chews on your boot, then decides to stay.', { ...join({ species: ['gible'] }), ability: 'rough-skin' }, ...OUT19())),
    ch('A Trapinch', out('A Trapinch follows you out of its pit.', join({ species: ['trapinch'] }), ...OUT19())),
  ]),
  gev('gn-19-lone', 'A Lone Donphan', sav({ stop: 'event', rarity: 'uncommon', tags: ['Pokémon', 'Story'], requires: [is('savanna-led-on'), regionChanged('savanna-region'), not('savanna-lone-seen')] }), say(
    'On a hill, a lone Donphan. It\'s limping. It\'s alive.',
    'It lifts its trunk, once, and puts it down.',
  ), [ch('Lift a hand.', out('You lift your hand. It watches you go, from the top of its hill.', flag('savanna-lone-seen'), moment('The Donphan you left behind is alive, on a hill, a region later.', 70)))]),
];
function GUARD(): Json {
  return fight('You stand at the edge of the ring, facing out. The herd closes up behind you.', savFight(NIGHT_POOL, [scene('gn-19-guard2')], 'herd'));
}
function TREATED(): Json[] {
  return [flag('savanna-treated'), flag('savanna-helped'), moment('You treated the herd leader\'s leg, and by dawn it stood.', 70), scene('gn-19-ring-2')];
}
function OUT19(): Json[] {
  return [setTo(WATER, 0), leavePseudo()];
}

// =====================================================================================================================
// gn.20  THE LUSH JUNGLE  (Pseudo Stage: six nodes; needs forest; step 14, optional, instead of the battle; once a run).
// Humid (Grass +10%, Fire -10%: rule `jungle`), careless plants, nests, pairs, storms, the colony, the Tsareena, and the canopy village
// that lowers its ladder only if nothing fainted on the way in (run.ts sets `jungle-harmed` after a knockout).
// =====================================================================================================================
const JUNGLE_TINT = '#1e5a2a';
const jun = (o: Json = {}): Json => ({ tint: JUNGLE_TINT, tags: ['Pokémon', 'Exploration', 'Story'], effect: 'fog', pokemon: 'bounsweet', ...o });
const JUNGLE_POOL = ['oddish', 'bellsprout', 'paras', 'exeggcute', 'tangela', 'venonat', 'ledian', 'foongus', 'bounsweet', 'roselia', 'budew', 'seedot', 'lotad', 'petilil', 'spinarak'];
const RARER = ['tangela', 'foongus', 'petilil', 'bounsweet', 'ledian', 'roselia'];
const UNHARMED: Json[] = [
  { id: 'unharmed-yes', when: [is('jungle-unharmed')], notice: 'Unharmed: yes.' },
  { id: 'unharmed-no', when: [not('jungle-unharmed')], notice: 'Unharmed: no.' },
];
/** After any fight in here: a knockout (yours or theirs) pulls the ladder up. */
const HARM: Json = when('jungle-harmed', { min: 1 }, [when('jungle-unharmed', { min: 1 }, [setTo('jungle-unharmed', 0)], '*Somewhere above, a ladder is pulled up.*'), setTo('jungle-harmed', 0)]);
const jungleFight = (pool: string[], next: Json[], lv = 1): Json => inside(eitherWay({ ...wild({ species: pool, lv, win: [HARM, ...next] }), rule: { gn: 'jungle' } }));
const jroom = (id: string, name: string, o: Json, intro: string, choices: Json[]): Json => rm(id, name, jun({ remembers: UNHARMED, ...o }), intro, choices);
/** A pair that won't be separated: they fight together (a double battle). If one is caught, the flag is set and the other follows. */
const pairFight = (species: string, caughtFlag: string, next: Json): Json => inside({
  ...wild({ species: [species], format: 'doubles', lv: 1, win: [HARM, next] }), rule: { gn: 'jungle' }, caught: [HARM, flag(caughtFlag), next],
});
/** Nests in every tree: looking up shows them; disturbing one is a fight with a parent at A+1. */
const nest = (id: string, back: Json, text: string): Json => jroom(id, 'The Lush Jungle: Nests', { pokemon: 'spinarak' }, text, [
  ch('Disturb a nest.', fight('The parent comes back. Fast.', jungleFight(JUNGLE_POOL, [back]))),
  ch('Leave them be.', out('You leave the nests to their owners.', back)),
]);
const LOOK_UP = (n: number): Json => chIf([not('jungle-watched'), not(`jungle-looked-${n}`)], 'Look up.', out('Nests in every tree, here too: woven, stuck, hung. One is close enough to touch.', flag(`jungle-looked-${n}`), scene(`gn-20-nest-${n}`)));
/** A careless plant: push through (the lead is poisoned), go round, or send a Poison- or Grass-type first. */
const plant = (id: string, next: Json, text: string): Json => jroom(id, 'The Lush Jungle: The Bright Path', { pokemon: 'oddish' }, text, [
  ch('Push through.', out('You push through. The bright leaves brush your lead, and it starts to shiver.', { kind: 'status', status: 'poison', who: 'lead', except: ['poison', 'steel'] }, next)),
  ch('Go round (the long way).', out('The long way: roots, mud, and a lot of ducking. Everyone is tired by the end of it.', hurt(0.05), next)),
  { ...ch('Send a Poison- or Grass-type first.', out('It walks through the bright plants as if they were grass. The plants don\'t even notice.', next), { requires: [anyType('poison', 'grass')] }) },
]);
/** A storm turns the path into a river: a Water-type carries the party; otherwise the long way. */
const river = (id: string, wet: Json, dry: Json, text: string): Json => jroom(id, 'The Lush Jungle: The Storm', { pokemon: 'lotad', effect: 'rain' }, text, [
  { ...ch('Ride across on a Water-type.', out('Your Water-type swims the new river with everyone hanging on.', wet), { requires: [anyType('water')] }) },
  ch('Take the long way.', out('Round, and round, and up, and down, and wet to the knees.', hurt(0.05), dry)),
]);
const DOOR20 = say(
  'The fence ends in leaves.',
  '*It\'s darker in here than it should be at noon.*',
  'The air is thick and wet. Grass moves hit harder in here; fire comes out weak.',
);
const GO_IN: Json[] = [
  ch('Go in.', out('You part the leaves. They close behind you.',
    flag('jungle-entered'), stampStage('jungle-at'), setTo('jungle-unharmed', 1), setTo('jungle-harmed', 0),
    when('safari-quiet', { min: 8 }, [setTo('jungle-ladder-sent', 1)]),
    gn('check', { key: 'jungle-watched', if: [is('egg-taken'), not('egg-returned')] }),
    // The jungle is walked (core/greenneedle/zone.ts): the first room, gn-20-wall, waits at its place on the grid.
    gn('minigame', { key: 'gn-jungle', n: 1 }))),
  ch('Turn back.', leave('You let the leaves fall back. The dark stays where it is.')),
];
const NODE6: Json[] = [
  when('jungle-unharmed', { min: 1 }, [room('gn-20-ladder')]),
  when('jungle-unharmed', { min: 0, max: 0 }, [when('jungle-ladder-sent', { min: 1 }, [room('gn-20-ladder')]), when('jungle-ladder-sent', { min: 0, max: 0 }, [room('gn-20-treehouse')])]),
];
/** Between the clearing and node 6: 15% a Venusaur asleep at the heart of the jungle. */
const ONWARD: Json[] = [roll('jungle-venusaur', 15), when('jungle-venusaur', { min: 1 }, [scene('gn-20-venusaur')]), when('jungle-venusaur', { min: 0, max: 0 }, NODE6)];
/** The stepping stones: the right answer at each, by the hum. A slip brings three waves. */
const stone = (id: string, text: string, rightNow: boolean, next: Json): Json => jroom(id, 'The Lush Jungle: The Hill That Hums', { pokemon: 'spinarak' }, text, [
  ch('Step now.', rightNow ? out('Your foot lands. The hum doesn\'t change.', next) : out('Your foot comes down on a trail. The hum stops. Then the hill gets up.', flag('jungle-slipped'), scene('gn-20-wave1'))),
  ch('Wait for the hum to drop.', rightNow ? out('You wait. The hum rises instead, and the stone you were standing on tips. You slip onto a trail.', flag('jungle-slipped'), scene('gn-20-wave1')) : out('You wait. The hum drops low, and you step across in the quiet.', next)),
]);
const wave = (id: string, n: number, next: Json[]): Json => jroom(id, `The Lush Jungle: The Colony (wave ${n} of 3)`, { pokemon: 'venonat' }, say(n === 1 ? 'Bug-types pour off the hill, thousands of them, and some of them are big.' : n === 2 ? 'Another wave. The hill is still humming.' : 'The last wave. Behind it, the hum is settling again.'), [
  ch('Fight them off.', fight('They come at you out of the leaves.', jungleFight(['venonat', 'spinarak', 'paras', 'ledian'], next, -1))),
]);

const gn20: Json[] = [
  gev('gn-20-door', 'The Lush Jungle', jun({ stop: 'event', rarity: 'rare', types: ['grass'], requires: [not('jungle-entered')] }), DOOR20, GO_IN),
  gev('gn-20-far', 'The Lush Jungle', jun({ stop: 'event', rarity: 'rare', types: ['grass'], requires: [not('jungle-entered')] }), say(
    '**Warden:** "Beyond here, it isn\'t a park. Nobody\'s counting your steps. Nobody\'s coming to fetch you, either."',
    DOOR20,
  ), GO_IN),
  jroom('gn-20-wall', 'The Lush Jungle: The Green Wall', { pokemon: 'bellsprout', remembers: [...UNHARMED, { id: 'watched', when: [is('jungle-watched')], notice: 'The nests in these trees can\'t be looked at. The parents are already watching you. They know about the egg.' }] }, say(
    'The Green Wall. Every tree has a nest in it, if you look up.',
    'Nothing here has fainted yet. Somewhere above, someone is keeping count.',
  ), [
    chIf([not('jungle-watched')], 'Look up.', out('Nests in every tree: woven, stuck, hung, and one made entirely of string.', scene('gn-20-nest'))),
    ch('Walk on.', out('You keep your eyes on the path.', room('gn-20-bright'))),
  ]),
  jroom('gn-20-nest', 'The Lush Jungle: Nests', { pokemon: 'spinarak' }, say('A nest at arm\'s height, with something in it. A parent is out hunting. For now.'), [
    ch('Disturb a nest.', fight('The parent comes back. Fast.', jungleFight(JUNGLE_POOL, [room('gn-20-bright')]))),
    ch('Leave them be.', out('You leave the nests to their owners.', room('gn-20-bright'))),
  ]),
  plant('gn-20-bright', scene('gn-20-bright-2'), say('The Bright Path. The plants along it are lovely colours, and careless with what they spray.', 'The first one leans across the path.')),
  plant('gn-20-bright-2', scene('gn-20-bright-3'), 'A second bright plant, bigger, its leaves beaded with something that isn\'t water.'),
  plant('gn-20-bright-3', scene('gn-20-vines'), 'The third: a whole bank of them, either side of the path.'),
  jroom('gn-20-vines', 'The Lush Jungle: The Vine Tangle', { pokemon: 'tangela' }, say(
    'A vine tangle across the path, waist-high, alive. It will catch your lead\'s legs in the next fight.',
    'A slicing move would clear it.',
  ), [
    ch('Push on.', out('You push into the vines. They let you through, and follow.', setTo('jungle-vines', 1), room('gn-20-flooded'))),
    LOOK_UP(2),
  ]),
  nest('gn-20-nest-2', scene('gn-20-vines'), 'Above the vine tangle, a nest of moss and spider-silk, slung between two creepers. Something small is breathing in it.'),
  nest('gn-20-nest-4', scene('gn-20-hill'), 'In the tree that leans over the humming hill, a nest lined with shed wing-cases. The parent is down on the hill, with the others. For now.'),
  jroom('gn-20-flooded', 'The Lush Jungle: The Flooded Trail', { pokemon: 'ledian', effect: 'rain' }, say(
    'The first storm. Rain like a dropped bucket. The path is a river now.',
    'Under one big leaf, two Ledian are sheltering, pressed together. There is room for one more.',
  ), [
    ch('Share the shelter.', out('You duck in beside them. They shuffle over. When the rain stops, they lead you a little way, round a bright plant you would have walked into.', setTo('jungle-guided', 1), kindness(1), scene('gn-20-river'))),
    ch('Catch one.', fight('They fight together, the two of them, side by side.', pairFight('ledian', 'jungle-pair-caught', scene('gn-20-river')))),
  ]),
  river('gn-20-river', room('gn-20-hill'), scene('gn-20-longway'), 'The river where the path was. It\'s fast and brown, and it wasn\'t here an hour ago.'),
  jroom('gn-20-longway', 'The Lush Jungle: The Long Way', { pokemon: 'oddish' }, say('The long way goes past another bright plant.'), [
    chIf([is('jungle-guided')], 'Follow the Ledian.', out('The two Ledian you sheltered with zip ahead and lead you round it.', room('gn-20-hill'))),
    chIf([not('jungle-guided')], 'Push through.', out('You push through. Your lead starts to shiver.', { kind: 'status', status: 'poison', who: 'lead', except: ['poison', 'steel'] }, room('gn-20-hill'))),
    chIf([not('jungle-guided')], 'Go round it.', out('Round again. Everyone is very tired of round.', hurt(0.05), room('gn-20-hill'))),
  ]),
  jroom('gn-20-hill', 'The Lush Jungle: The Hill That Hums', { pokemon: 'venonat' }, say(
    'A hill that hums. It\'s a Bug-type colony, thousands strong. It isn\'t hostile, unless you step on the trails.',
    'A path of stepping stones crosses it. Listen to the hum before each step.',
  ), [
    ch('Start across.', out('You put one foot on the first stone.', scene('gn-20-stone1'))),
    LOOK_UP(4),
    chIf([is('jungle-pair-caught'), not('jungle-pair-done')], 'Turn to the other Ledian.', out('The other Ledian has followed you all this way. It won\'t leave its pair.', scene('gn-20-pair'))),
  ]),
  jroom('gn-20-pair', 'The Lush Jungle: The Other One', { pokemon: 'ledian' }, say('It hovers at your shoulder, looking at the Ball its pair went into. It will follow you until it\'s caught too, or the first is let go.'), [
    ch('Catch it too.', out('It goes into a Ball of its own without a fight. The two Balls click together in your bag.', join({ species: ['ledian'] }), flag('jungle-pair-done'), scene('gn-20-hill'))),
    ch('Let the first one go.', out('You open the first Ball. The two of them fly off together, and don\'t look back.', gn('releaseLast', { species: ['ledian'] }), flag('jungle-pair-done'), scene('gn-20-hill'))),
  ]),
  stone('gn-20-stone1', say('The first stone. The hum is rising, louder and louder.'), false, scene('gn-20-stone2')),
  stone('gn-20-stone2', say('The second stone. The hum drops away to almost nothing.'), true, scene('gn-20-stone3')),
  stone('gn-20-stone3', say('The last stone. The hum is climbing again, fast.'), false, scene('gn-20-roses')),
  wave('gn-20-wave1', 1, [scene('gn-20-wave2')]),
  wave('gn-20-wave2', 2, [scene('gn-20-wave3')]),
  wave('gn-20-wave3', 3, [scene('gn-20-roses')]),
  // The second pair: two Roselia, on the far side of the hill.
  jroom('gn-20-roses', 'The Lush Jungle: Two Roselia', { pokemon: 'roselia' }, say(
    'On the far side of the hill, two Roselia are standing in the one patch of light, turned toward each other, a rose of each touching.',
    'They come in twos here. They will fight as two. And whatever happens to one of them, the other will not be left behind.',
  ), [
    ch('Walk round them.', out('You go round the patch of light. Neither of them looks up.', scene('gn-20-river2'))),
    ch('Catch one.', fight('They turn together, the two of them, side by side.', pairFight('roselia', 'jungle-rose-caught', scene('gn-20-rose-pair')))),
  ]),
  jroom('gn-20-rose-pair', 'The Lush Jungle: The Other One', { pokemon: 'roselia' }, say('The other Roselia has not run. It stands at your boot, looking at the Ball its pair went into. It will follow you until it\'s caught too, or the first is let go.'), [
    chIf([is('jungle-rose-caught')], 'Catch it too.', out('It goes into a Ball of its own without a fight. The two Balls click together in your bag.', join({ species: ['roselia'] }), setTo('jungle-rose-caught', 0), scene('gn-20-river2'))),
    chIf([is('jungle-rose-caught')], 'Let the first one go.', out('You open the first Ball. They find each other\'s roses again, and walk back into the patch of light.', gn('releaseLast', { species: ['roselia'] }), setTo('jungle-rose-caught', 0), scene('gn-20-river2'))),
    chIf([not('jungle-rose-caught')], 'Walk on.', out('The patch of light is empty. You walk on.', scene('gn-20-river2'))),
  ]),
  river('gn-20-river2', room('gn-20-clearing'), room('gn-20-clearing'), 'The second storm. The stream below the hill has burst its banks.'),
  jroom('gn-20-clearing', 'The Lush Jungle: The Clearing', { pokemon: 'tsareena' }, say(
    '*A clearing. In the middle, a Bounsweet, fast asleep in a patch of sun.*',
    '*At the edge, a Tsareena, standing on one leg, with the other drawn back.*',
    '*It isn\'t looking at you. It\'s looking at the space between you and the Bounsweet.*',
  ), [
    ch('Back out.', out('You back out the way you came. It lowers its leg. The long way round, to the far side.', setTo('jungle-tsareena', 1), ...ONWARD)),
    ch('Walk round the edge.', out('You walk round the edge of the clearing. It turns to keep itself between you and the Bounsweet.',
      gn('check', { key: 'jungle-bond3', if: [{ kind: 'bondLevel', atLeast: 3, who: 'lead' }] }),
      when('jungle-bond3', { min: 1 }, [setTo('jungle-tsareena', 2), ...ONWARD], say(
        'Your lead walks on the far side of you, away from the Bounsweet. The Tsareena allows it.',
        '*The Bounsweet wakes. It sees you. It waves. The Tsareena closes its eyes, the way a parent does.*',
      )),
      when('jungle-bond3', { min: 0, max: 0 }, [scene('gn-20-standoff')], 'Its leg stays drawn back. It won\'t let you pass on that side.'))),
    ch('Step forward.', fight('You step forward. The leg comes down like an axe.', inside({ ...wild({ species: ['tsareena'], lv: 2, win: [setTo('jungle-tsareena', 3), ...ONWARD] }), rule: { gn: 'tsareena', spare: true, noCatch: true } }),
      when('jungle-unharmed', { min: 1 }, [setTo('jungle-unharmed', 0)], '*Somewhere above, a ladder is pulled up.*'))),
  ]),
  jroom('gn-20-standoff', 'The Lush Jungle: The Clearing', { pokemon: 'tsareena' }, say('The Tsareena hasn\'t moved. The Bounsweet sleeps on.'), [
    ch('Back out.', out('You back out. It lowers its leg.', setTo('jungle-tsareena', 1), ...ONWARD)),
    ch('Step forward.', fight('You step forward. The leg comes down.', inside({ ...wild({ species: ['tsareena'], lv: 2, win: [setTo('jungle-tsareena', 3), ...ONWARD] }), rule: { gn: 'tsareena', spare: true, noCatch: true } }),
      when('jungle-unharmed', { min: 1 }, [setTo('jungle-unharmed', 0)], '*Somewhere above, a ladder is pulled up.*'))),
  ]),
  jroom('gn-20-venusaur', 'The Lush Jungle: The Heart', { pokemon: 'venusaur' }, say('At the heart of the jungle, under the biggest tree: a Venusaur, asleep. The flower on its back opens and closes as it breathes.'), [
    ch('Battle it.', fight('It wakes slowly, and it is very large.', jungleFight(['venusaur'], NODE6, 2))),
    ch('Leave it.', out('You leave it sleeping. You walk very quietly for a long way.', ...NODE6)),
  ]),
  jroom('gn-20-ladder', 'The Lush Jungle: The Ladder', { pokemon: 'bounsweet', remembers: [...UNHARMED, { id: 'sent', when: [is('jungle-ladder-sent')], notice: '**Old Liana:** "The warden sent word. By bird."' }] }, say(
    '*A rope ladder comes down out of the leaves, without a sound, and stops at the height of your hand.*',
    'Walkways. Lanterns in gourds. People who\'ve never seen the ground.',
    '**Village elder, Old Liana:** "You came through without hurting anything. We watch. We\'ve watched people for two hundred years. You\'re the ninth."',
  ), [ch('Climb up.', out('A hammock, and a full heal. Somebody brings you tea in a nutshell.', heal(1), flag('jungle-village'), moment('A village in the canopy lowered its ladder for you.', 80), scene('gn-20-tutor')))]),
  jroom('gn-20-tutor', 'The Lush Jungle: The Canopy Village', { pokemon: 'bounsweet' }, say('**Old Liana:** "We teach one thing, to one Pokémon, free. Grass, or Poison. The jungle\'s two tongues."'), [
    ch('A Grass move.', out('An old woman hanging upside down from a branch teaches it to you, to pass on to one Pokémon of your choice.', item('hm-grass'), scene('gn-20-nestling'))),
    ch('A Poison move.', out('A child who is very proud of knowing it teaches it to you, to pass on to one Pokémon of your choice.', item('hm-poison'), scene('gn-20-nestling'))),
  ]),
  jroom('gn-20-nestling', 'The Lush Jungle: The Nest-Fallen', { pokemon: 'petilil' }, say(
    'A Pokémon the village has raised since it fell out of a nest. It has never been on the ground.',
    'It looks at you, and at the ladder, and at you again.',
  ), [
    ch('Take it down with me.', out('It holds your sleeve the whole way down the ladder.', join({ species: RARER }), flag('jungle-nestling'), ...OUT20())),
    ch('It belongs up here.', out('It waves you off from the top of the ladder, holding on with both hands.', ...OUT20())),
  ]),
  jroom('gn-20-treehouse', 'The Lush Jungle: The Treehouse', { pokemon: 'bellsprout' }, say(
    'No ladder comes down. Instead: a ruined treehouse, low enough to climb. A rest.',
    'Carved in the wall: three seeds, a sun, a raindrop, and a missing fourth picture.',
  ), [
    ch('A sun.', out('You carve a sun. Wrong: there is one already. Nothing happens.', heal(0.5), scene('gn-20-treehouse-2'))),
    ch('A seedling.', out('Seed, sun, rain, seedling. A panel slides open. Inside: a Miracle Seed.', heal(0.5), item('miracle-seed'), scene('gn-20-treehouse-2'))),
    ch('A raindrop.', out('You carve a raindrop. Nothing happens, except that you feel a bit silly.', heal(0.5), scene('gn-20-treehouse-2'))),
  ]),
  jroom('gn-20-treehouse-2', 'The Lush Jungle: The Treehouse', { pokemon: 'foongus' }, say('Before you go, something from the jungle to take with you.'), [
    ch('Miracle Seed', out('A seed that hums faintly.', item('miracle-seed'), ...OUT20())),
    ch('Black Sludge', out('A lump of it, sealed in a leaf.', item('black-sludge'), ...OUT20())),
    ch('A Tangela with Chlorophyll', out('A Tangela unwinds from a branch and drops onto your shoulder.', { ...join({ species: ['tangela'] }), ability: 'chlorophyll' }, ...OUT20())),
    ch('A Foongus with Regenerator', out('A Foongus that was pretending to be a Poké Ball follows you out.', { ...join({ species: ['foongus'] }), ability: 'regenerator' }, ...OUT20())),
  ]),
];
/** Afterstory: "A gourd lantern is in the player's bag at the next rest. Nobody put it there." */
const LANTERN: Json = gev('gn-20-lantern', 'A Gourd Lantern', jun({
  stop: 'event', rarity: 'uncommon', pokemon: 'bounsweet', effect: 'glint', tags: ['Story'],
  requires: [is('jungle-lantern'), not('jungle-lantern-found'), { kind: 'gn', test: 'laterStage', key: 'jungle-at' }],
}), say(
  'You stop to rest, and go through your bag for something to eat, and your hand closes on a thing that was not there this morning.',
  'A gourd lantern. Dried, hollowed, cut with a pattern of leaves. There is a stub of candle in it, never lit.',
  'Nobody put it there.',
), [
  ch('Light it.', out('It burns green at the edges, the way light looks under leaves. Your Pokémon come and sit round it without being called. Somewhere a long way behind you, you are fairly sure, somebody who has never seen the ground is pleased.', item('gourd-lantern'), bond(1), flag('jungle-lantern-found'), moment('A gourd lantern from the Lush Jungle turned up in your bag. Nobody put it there.', 55))),
  ch('Put it back, carefully.', out('You put it back where it was not, and it sits among your things as if it always had.', item('gourd-lantern'), flag('jungle-lantern-found'))),
]);
function OUT20(): Json[] {
  return [flag('jungle-lantern'), leavePseudo()];
}

export const EVENTS: Json[] = [...gn19, ...gn20, LANTERN];

export const REMOVE: string[] = [];

export const PLACEMENT: Record<string, Placement> = {
  'gn-19-door': {
    gn: 'gn.19', shape: 'Door', earliest: 'A6', home: 13, window: [11, 16], sits: 'optional', attaches: 'instead', tags: ['Pseudo Stage'], needs: ['hot', 'cave'],
    level: 'A+1', often: 'run', badge: 'own', dressing: { kanto: 'The Deep Savanna', kantoStage: 'Beyond Safari Land\'s far gate', elsewhere: 'The Deep Savanna' },
    note: 'Badge: a sun. Six nodes. Also opened from Safari Land\'s far gate (gn-19-far).',
  },
  'gn-19-lone': { gn: 'gn.19', shape: 'Single', earliest: 'A6', home: 8, window: [1, 20], sits: 'optional', tags: ['Afterstory'], level: 'A+0', often: 'run', note: 'A later region, after the herd was led on without its leader.' },
  'gn-20-lantern': { gn: 'gn.20', shape: 'Single', earliest: 'A7', home: 4, window: [1, 12], sits: 'optional', attaches: 'rest', tags: ['Afterstory'], level: 'None', often: 'run', note: 'At the next rest after the jungle: a gourd lantern is in the bag. Nobody put it there.' },
  'gn-20-door': {
    gn: 'gn.20', shape: 'Door', earliest: 'A6', home: 14, window: [12, 17], sits: 'optional', attaches: 'instead', tags: ['Pseudo Stage'], needs: ['forest'],
    level: 'A+1; the Tsareena at A+2', often: 'run', badge: 'own', dressing: { kanto: 'The Lush Jungle', kantoStage: 'Beyond Safari Land\'s far gate', elsewhere: 'The Lush Jungle' },
    note: 'Badge: a leaf. Six nodes. Also opened from Safari Land\'s far gate (gn-20-far).',
  },
};

export const CHAINS: Json[] = [
  { id: 'ps_gn_savanna', name: 'The Deep Savanna', entry: 'gn-19-door', themeId: 'ground-fire', tint: SAVANNA_TINT, mood: 'dry heat', start: 'opened' },
  { id: 'ps_gn_jungle', name: 'The Lush Jungle', entry: 'gn-20-door', themeId: 'grass-poison', tint: JUNGLE_TINT, mood: 'humid green', start: 'opened' },
];
