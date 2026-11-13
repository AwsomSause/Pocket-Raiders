// Beta 0.6 biome hazards (pack SF127), map stops (SF135) and new events NE76-NE80 (catalog overhaul pack 2).
// Hazards and stops REPLACE the older one-line events with the same id (src/data/events/*.json override, see src/data/index.ts);
// placement (stop, rarity, minStage, types, requires, scene) is copied from the old event by tools/build-hazard-events.ts.
// Every hazard has the same three buttons: Push on. / Wait. / Use a [type]-type. "A node lost" has no engine effect, so a risky push
// costs a little HP instead; "+1 Bond" is +5 friendship (+3 for the whole party). No cross-run memory: flags last one run.

import { $, any, attr, ch, cure, express, flag, lv, flagIs, fr, good, heal, hurtExcept, hurtLead, item, leave, money, out, ptype, moveFlag, rest, rp, scout, statusLead, stopHere, ev, type Json } from './dsl.ts';

const HZ = 'Biome Hazards';
const SPEED = (value: number): Json => ({ kind: 'statMultiplier', stat: 'spe', value });
const temp = (label: string, ...effects: Json[]): Json => ({ kind: 'tempEffect', label, effects, battles: 1, until: 'battle' });
const cap = (t: string) => t[0]!.toUpperCase() + t.slice(1);
const bond = (n = 1, who: 'lead' | 'party' = 'lead') => fr(n * (who === 'lead' ? 5 : 3), who);
const PUSH = 'Push on.';
const WAIT = 'Wait.';
const use = (type: string, text: string, ...effects: Json[]) => ch(`Use ${/^[aeiou]/.test(type) ? 'an' : 'a'} ${cap(type)}-type.`, out(text, ...effects), { requires: [ptype(type)] });
/** A gamble: through with a little Research, or the setback. */
const push = (ok: string, bad: string, setback: Json[], chance = 0.65) => ch(PUSH, out(ok, rp(8)), { chance, fail: out(bad, ...setback) });
const wait = (text: string) => ch(WAIT, leave(text));

interface Hazard { ids: string[]; intro: string; choices: Json[]; remembers?: Json[]; flags?: Record<string, never> }
const H = (ids: string[], intro: string, choices: Json[], remembers?: Json[]): Hazard => ({ ids, intro, choices, remembers });

export const HAZARDS: Hazard[] = [
  H(['abandoned-power-plant', 'power-plant-fault'], 'Sparks spit from a broken generator. A Voltorb rolls out of the dark.', [
    push('You duck the sparks and slip through.', 'A spark catches your lead.', [statusLead('paralysis')]),
    wait('You wait. The generator cools, and you cross in the quiet.'),
    use('ground', 'Your Ground-type walks straight through the arcing wires.', bond()),
    use('electric', 'Your Electric-type drains the generator. Your team crackles with it.', temp('+1 Speed next battle', SPEED(1.5))),
  ]),
  H(['ancient-forest'], 'Huge old trees. Time feels slower in here.', [
    push('You find the path by luck.', 'You wander in circles among the trunks, and it tires you.', [hurtLead(0.05)]),
    wait('You sit out the slow hours. The trees let you go.'),
    use('grass', 'The trees speak to it. It knows the way.', bond()),
    use('psychic', 'It feels the way out like a thread.', bond()),
  ]),
  H(['blizzard-pass'], 'A pass buried in snow. The wind bites.', [
    ch(PUSH, out('You push through. The cold takes a bite out of everyone who is not used to it.', hurtExcept(0.1, 'ice'), rp(8))),
    wait('You wait out the worst of the snow.'),
    use('fire', 'Your Fire-type melts a path, and the team follows the warmth.'),
  ]),
  H(['cherry-blossom'], 'Pink petals drift down. Somewhere, a festival has started. A kind place: nothing here hurts.', [
    ch('Join the festival.', out('Music, sweets and a long rest under the blossoms.', rest(), heal(0.3))),
    use('grass', 'Your Grass-type dances in the petals, and the whole team joins in.', bond(1, 'party')),
    use('fairy', 'Your Fairy-type dances in the petals, and the whole team joins in.', bond(1, 'party')),
  ]),
  H(['crystal-cave'], 'Glowing crystals line the walls. They hum.', [
    push('You keep to the main passage and come out the far side.', 'You lose the way in the glow and come out tired.', [hurtLead(0.05)]),
    use('rock', 'Your Rock-type follows the hum to a hollow. Inside is a Light Clay.', item('light-clay')),
    use('psychic', 'Your Psychic-type follows the hum to a hollow. Inside is a Light Clay.', item('light-clay')),
  ]),
  H(['desert-oasis'], 'Palm trees and a clear pool. A kind place: nothing here hurts.', [
    ch('Drink.', out('Cool water. The team feels better.', heal(0.25))),
    use('water', 'Your Water-type swims in the pool, delighted.', bond()),
  ]),
  H(['foggy-moor'], 'Thick fog. You cannot see your own feet.', [
    push('You feel your way across.', 'A dead end, and a long walk back.', [hurtLead(0.05)]),
    wait('You wait for the fog to thin.'),
    use('flying', 'Your Flying-type clears the fog with a gust.'),
  ], [{
    id: 'fog-named', when: [flagIs('fog-named')], notice: 'The fog says your name, softly, and lifts.', hide: [0, 1],
    addChoices: [ch('Walk on.', out('The fog parts all the way across the moor. It costs you nothing.', bond(1, 'party')))],
  }]),
  H(['heatwave'], 'The sun burns. The team pants.', [
    push('You make it to the shade.', 'The heat gets to your lead, and it comes out burned.', [hurtLead(0.1), statusLead('burn')], 0.55),
    wait('You rest in the shade and cross at dusk.'),
    use('water', 'Your Water-type mists the whole party. Everyone cools down.', cure()),
  ]),
  H(['moonlit-path'], 'A full moon. Fairy Pokémon dance in a ring. A kind place: nothing here hurts.', [
    ch('Join the ring.', out('You dance with them until the moon sets.', bond(1, 'party'))),
    use('fairy', 'Your Fairy-type joins the ring. The dancers leave a Moon Stone behind.', item('moon-stone')),
  ]),
  H(['rainbow-bridge'], 'A rainbow after the rain. A kind place: nothing here hurts.', [
    ch('Walk under it.', out('Everything smells of rain and grass. It feels like a good sign.', rp(10))),
    use('flying', 'Your Flying-type flies through the rainbow and comes back glowing.', bond()),
  ]),
  H(['sandstorm', 'r122-sandstorm-burrow'], 'Sand scours the route. A burrow shows in a dune.', [
    ch(PUSH, out('You push through. The sand scours everyone not built for it.', hurtExcept(0.1, 'rock', 'ground', 'steel'), rp(8))),
    ch('Shelter in the burrow.', out('You wait it out in the burrow. A young Sandile watches you from the back, and shares its corner.', hurtExcept(0))),
    use('ground', 'Your Ground-type leads the way through the sand.'),
    use('rock', 'Your Rock-type leads the way through the sand.'),
  ]),
  H(['volcano-rim'], 'A narrow rim. Lava glows below.', [
    push('You edge along the rim.', 'Heat and ash: your lead is burned.', [statusLead('burn')], 0.55),
    wait('You wait for the vents to quieten.'),
    use('fire', 'Your Fire-type walks the rim as if it were home.'),
    use('rock', 'Your Rock-type finds the cool ledges.'),
  ]),
  H(['cave-in', 'world-cave-in'], 'Rubble seals a chamber. Something metallic glints between the stones.', [
    ch('Dig by hand.', out('You dig it free, scraped and sore. A Metal Coat.', hurtLead(0.1), item('metal-coat'))),
    wait('You go round and leave the glint behind.'),
    use('fighting', 'Your Fighting-type clears the rubble. The glint is a Metal Coat.', item('metal-coat')),
    use('ground', 'Your Ground-type clears the rubble. The glint is a Metal Coat.', item('metal-coat')),
  ]),
  H(['frozen-lake', 'w4-winter-lake'], 'Something shines in the ice. Crossing is a shortcut.', [
    push('The ice holds. You cross.', 'The ice cracks under your lead, and it goes in.', [hurtLead(0.1)], 0.67),
    wait('You go round the long way.'),
    use('ice', 'Your Ice-type walks it easily. The shine is a Never-Melt Ice.', item('nevermeltice')),
  ]),
  H(['wx-floating-ice-floes'], 'Ice floes crowd a channel. A shiny object sits on the far one.', [
    push('You jump from floe to floe.', 'You slip between two floes.', [hurtLead(0.1)], 0.7),
    use('water', 'Your Water-type ferries the team across. The object is a Pearl.', item('pearl')),
  ]),
  H(['junkyard'], 'Piles of scrap metal in every direction.', [
    push('You climb over without a scratch.', 'A pile shifts and clips your lead.', [hurtLead(0.05)], 0.8),
    use('steel', 'Your Steel-type sorts the scrap, and turns up a held item.', any('leftovers', 'focus-sash', 'choice-band', 'life-orb')),
  ]),
  H(['toxic-swamp'], 'Purple bubbles rise from the swamp.', [
    push('You pick a dry line through.', 'Fumes get your lead: poisoned.', [statusLead('poison')], 0.55),
    wait('You wait for the bubbles to settle.'),
    use('poison', 'Your Poison-type leads you through. The fumes do not bother it.'),
    use('steel', 'Your Steel-type leads you through. The fumes do not reach it.'),
  ]),
  H(['w4-quicksand', 'wx-quicksand-flats'], 'A hiker is sinking in the sand, shouting. The more he struggles, the deeper he goes.', [
    ch('Pull with your hands.', out('You haul him out, scraped and filthy. He is Dale.', hurtLead(0.1), flag('quicksand-dale')), { prompt: { id: 'pull-hold', needs: 'ok' }, fail: out('You lose your grip. A passing Pokémon finally drags him free.', hurtLead(0.1)) }),
    use('ground', 'Your Ground-type firms the sand, and the hiker walks out. "Dale," he says. "I will not forget it."', flag('quicksand-dale')),
    use('grass', 'Your Grass-type lowers a vine, and the hiker climbs out. "Dale," he says. "I will not forget it."', flag('quicksand-dale')),
  ]),
  H(['w4-spring-flood'], 'A meadow has turned into a shallow lake, with flowers standing in the water.', [
    ch(PUSH, out('You wade across. Wet feet slow everyone down.', temp('-1 Speed next battle', SPEED(0.67)), rp(8))),
    wait('You wait for the water to drop.'),
    use('water', 'Your Water-type carries the team across.', bond()),
  ]),
  H(['wx-earthquake-tremor'], 'The ground rumbles, then shakes.', [
    push('You ride it out on your feet.', 'The ground jumps and your lead falls.', [hurtLead(0.1)], 0.6),
    wait('You crouch low and wait for it to pass.'),
    use('ground', 'Your Ground-type steadies the party.', bond(1, 'party')),
    use('rock', 'Your Rock-type steadies the party.', bond(1, 'party')),
  ]),
];

/** Map stops (SF135) that need only existing mechanics. The rest keep their old version (see docs/status/biome-hazards.md). */
interface Stop { id: string; intro: string; choices: Json[]; remembers?: Json[] }
const PELL = 'berrytree-left';
const NURSE = 'center-nurse-kept';
const TREASURE = ['nugget', 'big-pearl', 'pearl', 'star-piece', 'stardust', 'comet-shard', 'relic-gold', 'rare-bone', 'big-mushroom'];

export const STOPS: Stop[] = [
  { id: 'berry-tree', intro: 'A lone Berry tree, heavy with fruit.', choices: [
    ch('Strip it.', out('You strip every branch. Four Berries.', any('oran-berry', 'sitrus-berry', 'lum-berry'), any('oran-berry', 'sitrus-berry', 'lum-berry'), any('oran-berry', 'sitrus-berry', 'lum-berry'), any('oran-berry', 'sitrus-berry', 'lum-berry'))),
    ch('Take a few, leave the rest.', out('Two Berries, and plenty left for the next traveller.', any('oran-berry', 'sitrus-berry', 'lum-berry'), any('oran-berry', 'sitrus-berry', 'lum-berry'), flag(PELL), good(1))),
  ] },
  { id: 'pokemon-center', intro: 'A small Pokémon Center with a shop counter. The nurse is yawning.', choices: [
    ch('Heal.', out('Everyone is healed.', heal(1), cure())),
    ch('Heal, and ask how she is.', out('She has been on all night. Your lead keeps her company while the team rests.', heal(1), cure(), flag(NURSE), bond())),
    ch('Shop (₽500).', out('Supplies.', $(-500), item('super-potion', 2), item('great-ball', 2)), { requires: [money(500)] }),
  ], remembers: [{
    id: 'nurse-thanks', when: [flagIs(NURSE)], notice: 'It is the nurse you kept company. She slips you something from behind the counter.', hide: [],
    addChoices: [ch('Take the Revive.', out('"For next time. Do not tell my manager."', item('revive')))],
  }] },
  { id: 'treasure-cache', intro: 'A box sticks out of the dirt. A name is scratched on the lid: "R. Tanner."', choices: [
    ch('Open it.', out('Inside: one of the finds a cache like this holds.', any('leftovers', 'focus-sash', 'life-orb', 'choice-band', ...TREASURE)), { check: 'luck', fail: out('A trap! Poison gas.', statusLead('poison')) }),
    ch('Find R. Tanner.', out('Tanner is a kid who buried his savings. He lets you keep one thing, and tells everyone you were kind.', any(...TREASURE), good(1), rp(10))),
    ch('Leave it.', leave()),
  ] },
  { id: 'lookout-tower', intro: 'A leaning tower, a rope ladder and a rusted telescope. The top is above the fog.', choices: [
    ch('Climb.', out('The whole stage lies below you, haze and all.', scout(9), rp(10)), { check: 'strength', fail: out('The ladder gives halfway. You see a little, and fall a little.', scout(3), hurtLead(0.08)) }),
    ch('Send a Flying-type up.', out('It circles twice and comes back with a full report.', scout(8), bond(1, 'party')), { requires: [ptype('flying')] }),
    ch('Move on.', leave()),
  ] },
  { id: 'rare-sighting', intro: 'Fresh tracks lead to a Pokémon never seen on this route. It has noticed you.', choices: [
    ch('Approach.', out('It lets you close in, then squares up!', { kind: 'moment', text: 'Faced a rare sighting.', importance: 30 }), { check: 'luck', fail: out('A twig snaps and it bolts. Gone.') }),
    ch('Stay still.', out('You stay still. It comes closer, curious, and then squares up!'), { requires: [{ kind: 'attribute', key: 'luck', atLeast: 20 }] }),
    ch('Leave it be.', leave()),
  ] },
  { id: 'wx-sinkhole', intro: 'The ground opens and you fall into a cave below.', choices: [
    ch('Look for a way up.', out('You find a ledge and climb right back out.')),
    ch('Explore down.', out('Down here, the cave is full of old loot. The climb back is bruising.', any('revive', 'nugget', 'big-pearl', 'star-piece', 'max-ether'), hurtLead(0.05))),
  ] },
];

/** Follow-up scenes (afterstories): they get a stop on the first later stage where their flag holds. */
export const CALLBACKS: Json[] = [
  ev('hz-pell-junior', 'Pell Junior', 'Map stops', { callback: true, rarity: 'common', minStage: 2, requires: [flagIs(PELL)], effect: 'sparkle', tint: '#1c2a14', types: ['grass'] },
    'A hiker flags you down on the road. "Pell Junior. My father says you left him a tree with fruit on it. Take this."', [
      ch('Take the Rare Berry.', out('A Berry you do not see every day. "Pass it on."', any('lum-berry', 'sitrus-berry'), item('leppa-berry'), good(1))),
    ]),
  ev('hz-dale-guide', 'Dale, the Free Guide', 'Biome Hazards', { callback: true, rarity: 'common', minStage: 2, requires: [flagIs('quicksand-dale')], effect: 'none', tint: '#2a2418', types: ['ground'] },
    'Dale the hiker waves from a ridge. "You pulled me out of the sand. Let me show you the good path. No charge."', [
      ch('Follow Dale.', out('Dale knows every shortcut on this stage. He shows you ahead and heads home.', scout(6), rp(10))),
    ]),
];

const sound = moveFlag('sound');
const mem = (e: Json, remembers: Json[]): Json => ({ ...e, remembers });
/** NE76-NE80 (pack 2). Flags are run-only. */
export const NEW_EVENTS: Json[] = [
  mem(ev('ne76-bridge-that-sings', 'The Bridge That Sings', HZ, { rarity: 'uncommon', minStage: 2, types: ['flying', 'normal'], effect: 'float', tint: '#14243a' },
    'A rope bridge hums in the wind over a gorge. Each plank is a different note, and some are missing. The tune has gaps. A mender, Winifred, looks up: "Walk it right and it plays her song. Walk it wrong and it throws you."', [
      ch('Walk by ear.', out('The notes come up through your boots. You hit them all, and the bridge plays. A Metronome hangs on the last post.', item('metronome'), rp(8)), { prompt: { id: 'echo-rhythm', needs: 'ok' }, fail: out('A wrong step. The bridge bucks and your lead takes a bump. You make it across.', hurtLead(0.1)) }),
      ch('Send a sound-move Pokémon first.', out('It sings the missing notes. The path lights up plank by plank.', bond()), { requires: [sound] }),
      ch('Help her tune the new planks.', out('Your Pokémon gives Winifred each pitch. The bridge is whole, and it plays her song. She presses a Metronome on you.', item('metronome'), flag('bridge-tuned'), good(1)), { requires: [sound] }),
    ]), [{ id: 'bridge-song', when: [flagIs('bridge-tuned')], notice: 'Travellers whistle the bridge\'s song now.', hide: [2], addChoices: [ch('Cross, whistling.', out('The bridge plays your tune back to you.', bond(1, 'party')))] }]),
  ev('ne77-fog-that-asks', 'The Fog That Asks Questions', HZ, { rarity: 'uncommon', minStage: 2, types: ['ghost', 'dark'], effect: 'fog', tint: '#202428' },
    'The fog here has a voice, and it is polite. "Excuse me. Who goes there? I ask everybody. Nobody answers properly." Shapes move in it: a Froslass, perhaps, or only weather.', [
      ch('Give my name.', out('"Thank you." The fog parts. It will remember.', flag('fog-named'), good(1))),
      ch('Give a false name.', out('The fog parts, but its voice has gone small. It will not forget the lie.', flag('honest-lied'), hurtLead(0.05))),
      ch('Ask who it is.', out('"I have forgotten. I was hoping one of you would know." You call it Mistral. It is delighted.', flag('fog-named'), bond(1, 'party'))),
    ]),
  mem(ev('ne78-orchard-after-fire', 'The Orchard After the Fire', HZ, { rarity: 'uncommon', minStage: 2, types: ['grass', 'bug', 'fire'], effect: 'glint', tint: '#2a1c10' },
    'Black trunks stand in rows. One tree in the middle is green, with a Leavanny sitting in it, sewing leaves onto its neighbours. Cuthbert the orchardist sighs: "Fire took the lot. I have not the heart to stop it."', [
      ch('Help it.', out('You sew with it all afternoon. The orchard looks alive from the road. It is not, but it is kind.', item('miracle-seed'), bond()), { requires: [ptype('bug')] }),
      ch('Help it (Grass-type).', out('You sew with it all afternoon. The orchard looks alive from the road. It is not, but it is kind.', item('miracle-seed'), bond()), { requires: [ptype('grass')] }),
      ch('Plant new trees (three Berries).', out('Three Berries go into the ground. The Leavanny stops sewing and starts watering.', flag('orchard-planted'), good(2), item('miracle-seed')), { requires: [{ kind: 'item', id: 'oran-berry' }] }),
      ch('Tell it gently.', out('It listens. It sews one more leaf, and stops. You say nothing more.', item('miracle-seed'))),
    ]), [{ id: 'orchard-green', when: [flagIs('orchard-planted')], notice: 'A green row of young trees stands where the orchard burned. Your Berries are in it.', hide: [0, 1, 2], addChoices: [ch('Pick the Berries.', out('The trees have fruited already. Three times what you planted.', any('oran-berry', 'sitrus-berry', 'lum-berry'), any('oran-berry', 'sitrus-berry', 'lum-berry'), any('oran-berry', 'sitrus-berry', 'lum-berry')))] }]),
  ev('ne79-lighthouse-two-keepers', 'The Lighthouse With Two Keepers', HZ, { rarity: 'uncommon', minStage: 2, types: ['water', 'electric', 'flying'], effect: 'glint', tint: '#0c1c30' },
    'The lighthouse flashes twice as fast as it should. Inside, two keepers each turn the lamp their own way. Aloysius: "Slow and steady. Ships expect it." Benedicta: "Fast! There is a wreck on the shoal." Out at sea, a ship\'s lights.', [
      ch('Slow.', out('The ship reads the light and misses the shoal by luck. No thanks.')),
      ch('Fast.', out('The ship is confused, and stops. It is safe, and a little cross.', rp(5))),
      ch('Send a Pokémon out with a light.', out('Your Pokémon marks the wreck itself. The ship steers round. The captain gives you a Rare item, and the keepers name a small lamp after your Pokémon.', any('leftovers', 'focus-sash', 'choice-band', 'life-orb'), flag('lighthouse-marked'), rp(10)), { requires: [ptype('water')] }),
      ch('Send a Flying-type out with a light.', out('Your Pokémon marks the wreck itself. The ship steers round. The captain gives you a Rare item, and the keepers name a small lamp after your Pokémon.', any('leftovers', 'focus-sash', 'choice-band', 'life-orb'), flag('lighthouse-marked'), rp(10)), { requires: [ptype('flying')] }),
    ]),
  ev('ne80-snow-that-wont-stop', 'The Snow That Won\'t Stop', HZ, { rarity: 'rare', minStage: 3, types: ['ice'], effect: 'snow', tint: '#1c2a3a' },
    'It has been snowing on this pass for a month. At the top, a Vanilluxe is crying, and every tear is a blizzard. Guide Halden Vey: "Its trainer left it at the summit to toughen it. He did not come back. It thinks enough snow will keep him stuck up here, and bring him back."', [
      ch('Climb to it.', out('You climb through the whistling white. At the top: "Come down with me." It does, sniffling, and it stops snowing.', { kind: 'join', species: ['vanilluxe'], lv: 1, shadow: false }, flag('snow-stopped'), hurtExcept(0.1, 'ice', 'fire')), { prompt: { id: 'dodge-tap', needs: 'ok' }, fail: out('The blizzard turns you back at the last ridge. You rest in a hut below.', hurtExcept(0.1, 'ice', 'fire')) }),
      ch('Find the trainer.', out('He is in the valley inn, ashamed. You say "Go up yourself." He does, and you watch the snow stop from below. Halden gives you a Never-Melt Ice.', flag('snow-trainer-climbed'), good(2), item('nevermeltice'))),
      ch('Wait for it to tire.', out('Three long hours. The snow stops. The Vanilluxe is alone on the summit, and you are not sure you did right by it.')),
    ]),
];

/**
 * Pack SF135 stops that keep their old mechanics and change only what the pack changes (follow-up PR).
 * Each patch takes the old event JSON and returns the new one. Choices keep their effects unless stated.
 */
type Raw = Json & { intro: string; choices: Json[] };
const relabel = (e: Raw, from: string, to: string, text?: string): void => {
  const c = e.choices.find((x) => x.label === from);
  if (!c) throw new Error(`${e.id}: no choice "${from}"`);
  c.label = to;
  if (text) (c.success as Json).text = text;
};
export const PATCHES: Record<string, (e: Raw) => Raw> = {
  'villain-hideout': (e) => {
    e.intro = 'A poster on the wall hums. Behind it, a base. Voices, boots, a door that is not quite shut.';
    relabel(e, 'Storm it', 'Go in and fight.');
    relabel(e, 'Sneak in for loot', 'Sneak in for loot.');
    const leave = e.choices.find((c) => c.label === 'Leave')!;
    leave.label = 'Note it and leave.';
    leave.success = out('You mark the hideout on your map and slip away. Someone will want to know where it is.', flag('hideout-noted'), rp(10));
    return e;
  },
  'ev-hidden-dungeon': (e) => {
    e.intro = 'Behind a curtain of vines, a stone door hangs ajar. Your Key Charm hums against it.';
    relabel(e, 'Step through', 'Use the Key Charm.', 'The charm fits the lock. The door opens onto a place no map shows.');
    relabel(e, 'Leave it', 'Leave it.');
    return e;
  },
  'ev-regional-festival': (e) => {
    e.intro = 'Lanterns, stalls, games, and a gift swap by the fountain. Everybody is smiling.';
    relabel(e, 'Join the gift swap', 'Join the swap.', 'You show your gift, and so does the stranger. You both look at each other\'s, and swap. Theirs is better.');
    relabel(e, 'Play the games', 'Play the games.');
    relabel(e, 'Rest on a bench', 'Watch.');
    return e;
  },
  'galar-gigantamax-sighting': (e) => {
    e.intro = 'The ground shakes. Over the ridge, a Pokémon towers into the clouds, swirling red: a Gigantamax form. Copperajah, Centiskorch, Rillaboom, Corviknight or Drednaw; you cannot tell which from here.';
    relabel(e, 'Face the giant', 'Follow it.');
    relabel(e, 'Observe from a safe distance', 'Observe from a distance.');
    relabel(e, 'Run!', 'Let it go.');
    return e;
  },
  'galar-runaway-wooloo': () => ev('galar-runaway-wooloo', 'Runaway Wooloo', 'Galar', { stop: 'event', rarity: 'common', requires: [{ kind: 'region', ids: ['galar'] }], effect: 'float', tint: '#d8d0c0', pokemon: 'wooloo' },
    'A Wooloo rolls down the route, scattering a fence. The shepherd chases it, out of breath: "Please! It does this every Tuesday!"', [
      ch('Stop it (a Rock-type).', out('Your Rock-type plants itself and the Wooloo bounces off. The shepherd gives you Wooloo Wool to sell.', $(200), flag('galar-wooloo-saved')), { requires: [ptype('rock')] }),
      ch('Stop it (a Steel-type).', out('Your Steel-type plants itself and the Wooloo bounces off. The shepherd gives you Wooloo Wool to sell.', $(200), flag('galar-wooloo-saved')), { requires: [ptype('steel')] }),
      ch('Roll with it.', out('You hop on and roll along with the Wooloo. It carries you a long way, and sets you down laughing.', express())),
      ch('Let it go.', leave('The Wooloo rolls over the horizon. The shepherd sighs.')),
    ]) as Raw,
  'training-ground': (e) => {
    e.intro = 'Tracks, weights and targets. A coach waves you over.';
    e.choices = [
      ch('Train the lead.', out('One session, all on your lead. It gains a level.', lv(1, 'lead'))),
      ch('Train the weakest.', out('The coach takes your lowest-level Pokémon aside and works it hard. It gains two levels to catch up.', lv(2, 'weakest' as 'lead'))),
      ch('Run laps.', out('You and the team run until dusk. Faster, and tired.', attr('speed', 3), hurtLead(0.1))),
    ];
    return e;
  },
};

export type { Hazard, Stop };
export { HZ };
