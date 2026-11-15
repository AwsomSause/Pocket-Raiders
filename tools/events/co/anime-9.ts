// Anime questlines, module 9: AQ31-AQ38. Follows tools/events/co/anime-0.ts (the worked examples) and _animeKit.ts.
//   AQ31 The Bond Phenomenon            (Companion, farewell; script: QUESTLINES_ASH.md "AQ31")
//   AQ32 The Bird That Learned Fire     (Companion; script: QUESTLINES_DEEPENED_2.md "AQ32")
//   AQ33 The Luchador                   (Single; script: QUESTLINES_ASH.md "AQ33")
//   AQ34 The Goomy Who Went Home        (Companion, farewell; script: QUESTLINES_ASH.md "AQ34")
//   AQ35 The Egg in the Cave            (Companion; script: QUESTLINES_ASH.md "AQ35")
//   AQ36 The One Who Sleeps in the Bag  (Single; script: QUESTLINES_ASH.md "AQ36")
//   AQ37 The Old Guardian               (Companion, grief; script: QUESTLINES_ASH.md "AQ37")
//   AQ38 The Dusk Wolf                  (Companion; script: QUESTLINES_DEEPENED_2.md "AQ38")
// Build: npm run co:build -- anime-9
import { anyType, ch, ev, fight, flag, flagIs, fr, leave, out, room, type Json } from '../dsl.ts';
import { AQ, age, bondLine, duel, evolve, farewell, gain, hasMon, later, line, moment, monDuel, seen, stageOf, tagTypes, temp, type Place } from './_animeKit.ts';

export { CATEGORY } from './_animeKit.ts';

export const QUESTLINES: Record<string, string> = {
  AQ31: 'aq31-bond-phenomenon',
  AQ32: 'aq32-bird-learned-fire',
};

export const PLACEMENT: Record<string, Place> = {
  'aq31-bond-phenomenon': { shape: 'Companion', earliest: 'A6', home: 9, window: [6, 12], sits: 'optional', tags: ['water'], beats: ['aq31-after-the-bout', 'aq31-froakie-follows', 'aq31-froakie-test', 'aq31-as-one', 'aq31-the-roots'], note: 'Farewell. "Ask" ends its test a stage later; "Ignore" has it turn up two nodes on. The Bond Phenomenon plays once its Bond reaches maximum with a Greninja in the party; the roots farewell four stages after the meeting, Step 17.' },
  'aq32-bird-learned-fire': { shape: 'Companion', earliest: 'A2', home: 5, window: [3, 8], sits: 'optional', tags: ['hot'], beats: ['aq32-lights-the-fire', 'aq32-no-brakes', 'aq32-in-the-rain', 'aq32-the-ledge'], note: 'Small scenes at rests as its Bond rises. Turning point two stages on, Step 13.' },
};

/** Doc choices that are not buttons (questline -> label -> reason). */
export const NOT_A_BUTTON: Record<string, Record<string, string>> = {};

export const LIMITS: Record<string, string[]> = {
  AQ31: [
    'The Bond Phenomenon is its own scene and story fight, once per run, when its Bond reaches maximum (Bond 5) while a Greninja is in the party; the doc has the form change happen in whatever battle comes next.',
    'Its "+10% to all stats for that battle" is a one-battle boost to every Water-type party Pokémon (the game\'s stat boost picks by type, not one Pokémon). The Ash-Greninja look shows in the scene art only: the game\'s greninja-ash species carries its own, much higher stats, and the doc asks for a cosmetic change.',
    'The Zygarde-linked root crisis is told in the farewell scene only; no region crisis or Zygarde fight is built.',
    '"Go." returning in the Final Reunion sets flag reunion-guest-greninja and a Chronicle line; its form changing when it sees the player is for the Final Reunion to show.',
    '"Battle it.": the doc writes only the win ("it joins after losing narrowly"); a loss is friendly and it joins anyway, having won by a hair.',
  ],
  AQ32: [
    'The Final Reunion afterstory (two Talonflame on the roof, one of them old) sets flag reunion-guest-talonflame and a Chronicle line; the Final Reunion shows it.',
  ],
};

export const CHECKED: Record<string, string> = { AQ31: '2026-11-15' };

const SEA = tagTypes('water');
const HOT = tagTypes('hot');
/** No Fire type in the party (AQ32: "With no Fire type for Help"). */
const NO_FIRE: Json = { kind: 'partyType', type: 'fire', absent: true };

/** The Bond Phenomenon's "+10% to all stats", for one battle (Water types). */
const boost = (stats: string[]) => stats.map((stat) => ({ kind: 'statMultiplier', stat, type: 'water', value: 1.1 }));
/** A boost holds at most three modifiers, so the five stats come as two boosts for the same battle. */
const AS_ONE = [temp('The Bond Phenomenon', boost(['atk', 'spa', 'spe']), 1), temp('The Bond Phenomenon: guard', boost(['def', 'spd']), 1)];
const FROG_LINE = ['froakie', 'frogadier', 'greninja'];

export const EVENTS: Json[] = [
  // ---------------- AQ31. The Bond Phenomenon ----------------
  ev('aq31-bond-phenomenon', 'The Bond Phenomenon', AQ, { rarity: 'rare', minStage: stageOf('A6'), types: SEA, cast: ['trainer.pr/ace_trainer_m'], pokemon: 'froakie', tint: '#142a3a', effect: 'float' },
    'Evening on a jetty. You have just won a battle, and your Pokémon are shaking the water off their backs. Up in a dead tree over the water sits a Froakie, its frothy bubbles heaped round its neck like a scarf. It watched the whole fight without blinking. A young trainer on the jetty follows your eyes and sighs. "That one? It chose me last spring. It left in the autumn." He turns an empty Poké Ball over in his hands. "It just wasn\'t happy with me. It wanted something I couldn\'t give it, and I never found out what." He is the fourth trainer it has left, he says. It is looking for somebody, he thinks: somebody who matches it. The Froakie has not looked away from you once.',
    [
      ch('Ask it to come.', out('You walk to the foot of the tree and ask it plainly, the way you would ask a person. The Froakie looks at you for a long time. Then it drops into the water, comes up at your feet, and walks beside you. Not ahead, not behind: beside. It is not a yes. It is a "show me." The trainer on the jetty laughs, a little sadly. "It did that with me too. Good luck."', gain('froakie'), flag('aq-greninja-asked'), flag('aq31-met'))),
      ch('Battle it.', fight('You call up to the tree. The Froakie is down before you finish: it has been waiting for exactly this. It lands on the jetty in a crouch, foam bristling, and for the first time all evening it looks happy.', monDuel('Froakie', 'froakie', 0, { win: [flag('aq31-battled'), room('aq31-after-the-bout')], lose: [flag('aq31-battled'), flag('aq31-bout-lost'), room('aq31-after-the-bout')] }))),
      ch('Ignore it.', out('You pick up your bag and walk on. You do not look back at the tree. Behind you there is a small wet plop, and then, all afternoon, very quietly, the sound of something keeping pace with you in the reeds.', flag('aq-greninja-followed'), later('aq31-froakie-follows', 2))),
    ]),
  ev('aq31-after-the-bout', 'Closer Than Anyone', AQ, { room: true, pokemon: 'froakie', tint: '#142a3a', effect: 'float',
    remembers: [{ id: 'won-by-a-hair', when: [flagIs('aq31-bout-lost')], notice: 'It won, by a hair. It knows exactly how thin the hair was. It does not look like a winner. It looks like somebody who has finally been pushed as far as it can go, and liked it.' }] },
    'The Froakie sits in the shallows, breathing hard, its foam half gone. It was close. Closer than it has been with anyone, by the look on its face. It looks at your Pokémon one by one, and then at you, as if checking a sum it has been working on for a very long time.',
    [
      ch('Hold out your hand.', out('It looks at the hand. Then it slaps it, hard, a wet webbed high five that stings for an hour. It climbs up your arm and sits on your shoulder, dripping down your collar. The trainer on the jetty shakes his head, smiling. "Four of us, and it just wanted a fight it could lose."', gain('froakie', { bond: 10 }), flag('aq31-met'))),
      ch('Let it decide.', out('You sit down on the jetty and wait. It takes its time. It walks round you twice. Then it sits down next to you, close enough that its foam wets your sleeve, and looks out at the water the same way you are looking. That is the decision.', gain('froakie', { bond: 10 }), flag('aq31-met'))),
    ]),
  ev('aq31-froakie-follows', 'Something in the Reeds', AQ, { room: true, pokemon: 'froakie', tint: '#142a3a', effect: 'float' },
    'Two nodes on, you stop to make camp. There is a Froakie sitting on your bag. It is damp. It has clearly been there a while. It has the air of somebody who has been ignored before, many times, and has decided that this time it will not take the hint.',
    [
      ch('Let it come.', out('You move the bag. It moves with the bag. By the fire it sits exactly as far from you as you are from the flames, and in the morning it is a little closer. You ignored it, and it chose you anyway. You get the feeling that was the point.', gain('froakie', { bond: 5 }), flag('aq31-met'))),
      ch('Send it back to its tree.', leave('You point back the way you came. It looks where you point, and then at you, and does not move for a long time. In the morning the bag is dry and the Froakie is gone. You think you hear it once, in the reeds, and then not again.')),
    ]),
  ev('aq31-froakie-test', 'The Test', AQ, { callback: true, requires: [flagIs('aq-greninja-asked'), age('aq-greninja-asked', 1), line('froakie')], pokemon: 'froakie', tint: '#142a3a', effect: 'none' },
    'For a whole stage the Froakie has watched you. How you call a fight. How you treat the one who loses it for you. Who eats first at camp, and who gets the dry spot when it rains. Tonight it sits across the fire with its arms folded and its foam puffed up, and you understand that the test is over. It is about to tell you how you did.',
    [
      ch('Wait for its answer.', out('It gets up. It walks round the fire, slowly, the long way. Then it sits down again: on your side of the fire, against your knee. It does not do anything else. It does not need to. Four trainers asked it to come. You are the first one it has stayed for.', bondLine('froakie', 10), flag('aq31-test-passed'))),
      ch('Ask how you did.', out('It looks at you as if that were a very silly question. Then, very seriously, it holds up one webbed hand and wobbles it: so-so. Then it comes round the fire and goes to sleep on your foot, which is the opposite of so-so, and stays there all night.', bondLine('froakie', 10), flag('aq31-test-passed'))),
    ]),
  // Through the run: its Bond reaches maximum while it is a Greninja in the party. Once per run.
  ev('aq31-as-one', 'As One', AQ, { callback: true, requires: [flagIs('aq31-met'), line('froakie', 5), hasMon('greninja')], cast: ['trainer.pr/ace_trainer_f'], pokemon: 'greninja-ash', tint: '#1a2440', effect: 'float',
    remembers: [
      { id: 'tested', when: [flagIs('aq-greninja-asked')], notice: 'It sat across a fire from you once and weighed you up. You passed, then. You can feel it weighing you now, and you are passing again.' },
      { id: 'followed', when: [flagIs('aq-greninja-followed')], notice: 'You walked past it once, and it followed you anyway. You can feel, right now, exactly how glad it is that it did.' },
    ] },
    'A hard fight finds you on the road: an Ace Trainer who has heard about your Greninja and wants to see it for herself. Your Greninja steps out. Then something happens that has never happened before. Water rises off the ground and wraps round it like a cloak. The pattern on its face changes. A great spinning star of water builds on its back. And you can feel the wind on its face. You can see what it sees, the foe and the field and your own self standing behind it. You blink, and it blinks.',
    [
      ch('Fight as one.', fight('Every move you think of, it is already making. Every hit it takes, you flinch. The Ace Trainer takes one step back.', duel('Ace Trainer Odalys', { cls: 'ace-trainer', size: 3, types: ['water', 'psychic', 'dark'], win: [flag('aq31-bond-formed'), moment('Your Greninja changed in the middle of a fight, and for a while you saw with its eyes.', 75)] }, { lose: [flag('aq31-bond-formed'), moment('Your Greninja changed in the middle of a fight, and for a while you saw with its eyes.', 75)] }), ...AS_ONE)),
      ch('Hold on to the feeling.', fight('You stop thinking about the fight and think about it instead. The water star on its back spins faster. The Ace Trainer says, quietly, "I came to see that."', duel('Ace Trainer Odalys', { cls: 'ace-trainer', size: 3, types: ['water', 'psychic', 'dark'], win: [flag('aq31-bond-formed'), moment('Your Greninja changed in the middle of a fight, and for a while you saw with its eyes.', 75)] }, { lose: [flag('aq31-bond-formed'), moment('Your Greninja changed in the middle of a fight, and for a while you saw with its eyes.', 75)] }), ...AS_ONE)),
    ]),
  // The farewell: four stages after the meeting, while it is still in the party.
  ev('aq31-the-roots', 'The Roots', AQ, { callback: true, minStage: stageOf('A10'), requires: [flagIs('aq31-met'), age('aq31-met', 4), line('froakie')], types: SEA, pokemon: 'greninja', tint: '#16281a', effect: 'shake',
    remembers: [
      { id: 'as-one', when: [flagIs('aq31-bond-formed')], notice: 'It has worn your shape once, in a fight, and you have worn its. It knows you will understand without being told.' },
      { id: 'asked', when: [flagIs('aq-greninja-asked')], notice: 'You asked it to come, once, on a jetty. It came. Now it is the one who would have to ask, and it will not.' },
      { id: 'followed', when: [flagIs('aq-greninja-followed')], notice: 'You walked past it once and it followed you anyway. It has never needed permission. It is waiting for yours now.' },
    ] },
    'News comes up the road with the travellers. In a region not far off, roots are breaking through the ground: roots as thick as houses, choking the rivers, cracking the towns in half. Something old and green is waking under the earth and nobody knows how to calm it. They say there is a glow down in the cracks, like a single cell, watching. That night your partner stands at the edge of camp, facing the way the roots are. It has heard. It looks at you. It does not ask.',
    [
      ch('Go.', out('You say it before it has to. It stands very still. Then it crosses the camp and presses its forehead to yours, once, hard, the way it slapped your hand on the first day. When it goes, it goes fast: a ripple across the dark water, and then nothing. You stand there a long time. Somewhere north, a region is about to get a great deal of help.', farewell('It goes to fight the roots', FROG_LINE), flag('aq31-went'), flag('reunion-guest-greninja'), moment('Your Greninja went to save a region from the roots. It did not ask. You told it to go.', 80))),
      ch('Stay with me.', out('It looks north for a long, long moment. Then it sits down beside you, with its back to the roots. In the morning it is still there. It never mentions it again. Sometimes, late at night, you catch it facing that way, very still, and when it sees you watching it turns round and comes back to the fire.', bondLine('froakie', 10), flag('aq31-stayed'), moment('The roots were calling, and your Greninja stayed with you.', 60))),
    ]),
  // ---------------- AQ32. The Bird That Learned Fire ----------------
  ev('aq32-bird-learned-fire', 'The Bird That Learned Fire', AQ, { rarity: 'uncommon', minStage: stageOf('A2'), types: HOT, pokemon: 'fletchling', tint: '#3a1a10', effect: 'fire' },
    'A vent in the hillside, breathing heat. A small Fletchling goes into the shimmer over it, flat out. It comes out the other side smoking, tumbles, lands badly, and shakes itself. Then it walks back to the start. It comes out singed every time, and it tries again. Up the slope, on a ledge in the heat where nothing its size should be, an old Talonflame sleeps on a nest of warm stones. And you understand: the little bird is not trying to get through the heat. It is trying to get up there.',
    [
      ch('Stop it.', out('You catch it mid-run, in both hands, and it is furious. It is so small. It pecks your thumb, hard, and then sits in your palm glaring at you, the tips of its feathers still smoking. It comes with you because you are holding it. It will not forgive you for a long time. At every camp, it sits facing the volcano.', gain('fletchling'), bondLine('fletchling', -30), flag('aq32-met'), flag('aq32-stopped'))),
      ch('Help it.', out('Your Fire-type sits down beside the vent and does not show the bird the fire. It shows it the breathing. In on the cool. Out on the hot. The Fletchling watches the way only a very small bird can watch. First try: smoke. Second try: less smoke. Third try, it goes into the shimmer breathing the way it was shown, and comes out the other side lit, every feather edged with flame, bigger than it went in and astonished at itself: a Fletchinder. It lands on your Fire-type\'s head and stays there.', gain('fletchinder', { bond: 10 }), fr(5, 'picked'), flag('aq32-met'), flag('aq32-helped')), { requires: [anyType('fire')], pick: { types: ['fire'] } }),
      ch('Help it: fan it with your coat.', out('You have no fire to lend it, so you take off your coat and fan it as it goes in. It does nothing useful at all. It may make things worse. The Fletchling comes out singed, as always, and lands on your coat, and looks up at you, and you can see it has decided you are on its side. It does not get through today. It comes with you, to try again somewhere hotter.', gain('fletchling', { bond: 15 }), flag('aq32-met'), flag('aq32-fanned')), { requires: [NO_FIRE] }),
      ch('Watch.', out('You sit down on a warm rock and count. It goes in eleven more times. Eleven times it comes out smoking. Somewhere around the ninth you stop breathing. On the twelfth it does not come out smoking. It comes out lit, every feather edged with fire, bigger than it went in: a Fletchinder. It lands beside you, on fire, and looks at you as if you had doubted it. You had not. It does not believe you.', gain('fletchinder', { bond: 15 }), flag('aq32-met'), flag('aq32-watched'))),
    ]),
  // Small scenes: one each time its Bond rises a step, while it is in the party.
  ev('aq32-lights-the-fire', 'It Lights the Tent', AQ, { callback: true, requires: [flagIs('aq32-met'), line('fletchling', 1), age('aq32-met', 1)], pokemon: 'fletchling', tint: '#3a1a10', effect: 'fire',
    remembers: [{ id: 'facing-the-volcano', when: [flagIs('aq32-stopped')], notice: 'Every camp since you caught it, it has sat facing the volcano. Tonight, for the first time, it has turned round to face the fire instead.' }] },
    'Camp. You are still fumbling with the kindling when the bird sorts it out for you: one hot breath, and the campfire is lit. It looks extremely pleased with itself. Then, before anyone can stop it, it lights the tent.',
    [
      ch('Put the tent out.', out('You beat it out with a pan. The bird watches the whole thing with great interest, as if this were another kind of fire it could learn. There is a hole in the tent now, roughly its size. It sleeps by the hole all night, keeping the draught out, which you decide is an apology.', bondLine('fletchling', 5), flag('aq32-scene-1'))),
      ch('Laugh.', out('You laugh until your ribs hurt. The bird does not understand what is funny, but it understands that you are not angry, and that seems to be new to it. The tent smells of smoke for the rest of the run. You never once mind.', bondLine('fletchling', 5), flag('aq32-scene-1'))),
    ]),
  ev('aq32-no-brakes', 'No Brakes', AQ, { callback: true, requires: [seen('aq32-lights-the-fire'), line('fletchling', 2)], pokemon: 'fletchling', tint: '#3a2410', effect: 'none' },
    'It has started practising speed. Every rest, it goes up, and comes down faster than the time before: flat out, a streak of orange along the road, the air cracking behind it. It has not practised stopping. Today it stops against the back of your head.',
    [
      ch('Catch it next time.', out('You stand in the road with your arms out. It comes down like a thrown stone and hits you square in the chest instead of the head, which is progress. You both sit in the dust. It looks very proud. You have a bird-shaped bruise for a week.', bondLine('fletchling', 5), flag('aq32-scene-2'))),
      ch('Teach it to brake.', out('You show it, with your arms, how a bird spreads its tail. It watches. It goes up. It comes down. At the very last moment it spreads its tail and lands, wobbling, on your outstretched wrist. Then it looks back at its own tail as if it had never seen it before.', bondLine('fletchling', 5), flag('aq32-scene-2'))),
    ]),
  ev('aq32-in-the-rain', 'Steam', AQ, { callback: true, requires: [seen('aq32-no-brakes'), line('fletchling', 3)], pokemon: 'fletchling', tint: '#1c2430', effect: 'rain' },
    'Rain, all day. The bird hates it. It steams where the drops hit it, and it sulks, feathers clamped tight: a small, damp, hissing grudge on your shoulder. Then {lead} finds a big leaf by the road and, without being asked, holds it up over the bird, and walks like that, very carefully, mile after mile.',
    [
      ch('Let {lead} hold the leaf.', out('You leave them to it. {lead} holds the leaf. The bird stops hissing. By evening it has moved from your shoulder to {lead}\'s head, under the leaf, dry and smug, and the two of them come into camp together as if they had planned the whole thing.', bondLine('fletchling', 5), fr(5, 'lead'), flag('aq32-scene-3'))),
      ch('Hold your coat over them both.', out('You take off your coat and hold it over both of them, and all three of you walk the rest of the day in a little dry tent of your own. You are soaked through. The bird stops steaming and starts, very quietly, to sing.', bondLine('fletchling', 5), flag('aq32-scene-3'))),
    ]),
  // The turning point: two stages after the meeting, while it is still in the party.
  ev('aq32-the-ledge', 'The Ledge', AQ, { callback: true, minStage: stageOf('A4'), requires: [flagIs('aq32-met'), age('aq32-met', 2), line('fletchling')], types: HOT, pokemon: 'talonflame', tint: '#3a1a10', effect: 'fire',
    remembers: [
      { id: 'held-back', when: [flagIs('aq32-stopped')], notice: 'You held it back from this mountain once, in both hands. It sat facing it at every camp. You do not hold it now. It looks back at you once, to check that you will not.' },
      { id: 'breathing', when: [flagIs('aq32-helped')], notice: 'At the foot of the slope your Fire-type breathes with it, one last time, the way it taught it: in on the cool, out on the hot.' },
      { id: 'counting', when: [flagIs('aq32-watched')], notice: 'You catch yourself counting again, out of habit. You do not get past one.' },
    ] },
    'The volcano again, or one just like it. The vent. The ledge. And the old Talonflame is awake. Your bird goes up. Straight up, through the heat, through the shimmer that used to throw it down. It does not smoke now; it belongs in it. It lands on the ledge. The old one looks it over for a long time. It is a parent. It left it at the bottom on purpose. They all do. Most never come up. They touch beaks. Then the old one looks down at you, a long way below, and dips its head.',
    [
      ch('Wait at the bottom.', out('It could stay. You both know it could. It stands on the ledge with its parent for one more breath, and then it drops: straight down, wings folded, fire streaming off it. Halfway down it opens them and it is bigger, it is a Talonflame, and it lands beside you hard enough to scorch the stones. Up on the ledge the old one is still watching. It does not look disappointed. It looks like a parent.', evolve('fletchling', 'talonflame'), evolve('fletchinder', 'talonflame'), bondLine('fletchling', 10), flag('aq32-turned'), flag('reunion-guest-talonflame'), moment('Your bird flew up the volcano to the parent who left it there, and came back down to you a Talonflame.', 75))),
      ch('Call up to it.', out('You call to it once. Not to bring it down: just so it knows where you are. It hears. It looks at its parent, and its parent looks at you, and then it drops: straight down, wings folded, fire streaming off it. Halfway down it opens them and it is bigger, a Talonflame, and it pulls up a hand above your head and lands as gently as a leaf. It learned to brake.', evolve('fletchling', 'talonflame'), evolve('fletchinder', 'talonflame'), bondLine('fletchling', 10), flag('aq32-turned'), flag('reunion-guest-talonflame'), moment('Your bird flew up the volcano to the parent who left it there, and came back down to you a Talonflame.', 75))),
    ]),

];

export const REMOVE: string[] = [];
