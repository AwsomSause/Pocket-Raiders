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
import { again, anyType, at, ch, ev, fight, flag, flagAgo, flagAt, flagIs, fr, has, item, leave, lose, out, room, takeNode, type Json } from '../dsl.ts';
import { AQ, age, bondLine, duel, evolve, farewell, gain, hasMon, later, line, moment, monDuel, notYet, seen, stageOf, tagTypes, temp, type Place } from './_animeKit.ts';

export { CATEGORY } from './_animeKit.ts';

export const QUESTLINES: Record<string, string> = {
  AQ31: 'aq31-bond-phenomenon',
  AQ32: 'aq32-bird-learned-fire',
  AQ33: 'aq33-luchador',
  AQ34: 'aq34-goomy-went-home',
  AQ35: 'aq35-egg-in-the-cave',
  AQ36: 'aq36-sleeps-in-the-bag',
  AQ37: 'aq37-old-guardian',
  AQ38: 'aq38-dusk-wolf',
};

export const PLACEMENT: Record<string, Place> = {
  'aq31-bond-phenomenon': { shape: 'Companion', earliest: 'A6', home: 9, window: [6, 12], sits: 'optional', tags: ['water'], beats: ['aq31-after-the-bout', 'aq31-froakie-follows', 'aq31-froakie-test', 'aq31-as-one', 'aq31-the-roots'], note: 'Farewell. "Ask" ends its test a stage later; "Ignore" has it turn up two nodes on. The Bond Phenomenon plays once its Bond reaches maximum with a Greninja in the party; the roots farewell four stages after the meeting, Step 17.' },
  'aq32-bird-learned-fire': { shape: 'Companion', earliest: 'A2', home: 5, window: [3, 8], sits: 'optional', tags: ['hot'], beats: ['aq32-lights-the-fire', 'aq32-no-brakes', 'aq32-in-the-rain', 'aq32-the-ledge'], note: 'Small scenes at rests as its Bond rises. Turning point two stages on, Step 13.' },
  'aq33-luchador': { shape: 'Single', earliest: 'A4', home: 12, window: [9, 15], sits: 'side-branch', tags: ['high', 'forest'], beats: ['aq33-luchador-again', 'aq33-after-the-match'] },
  'aq34-goomy-went-home': { shape: 'Companion', earliest: 'A5', home: 10, window: [7, 13], sits: 'optional', tags: ['hot'], beats: ['aq34-on-the-way', 'aq34-the-wetland', 'aq34-the-protector'], note: 'Farewell. Met in a desert; its home is a water node four nodes on (the way there opens 2 nodes on, the wetland 2 more).' },
  'aq35-egg-in-the-cave': { shape: 'Companion', earliest: 'A4', home: 11, window: [8, 14], sits: 'side-branch', tags: ['cave'], beats: ['aq35-it-attacks', 'aq35-second-chance', 'aq35-after-food', 'aq35-after-doctor', 'aq35-hatching'], note: 'The doctor costs two nodes.' },
  'aq36-sleeps-in-the-bag': { shape: 'Single', earliest: 'A1', home: 4, window: [2, 7], sits: 'optional', tags: ['forest'], beats: ['aq36-back-in-the-bag'], note: 'Then it is simply in the bag.' },
  'aq37-old-guardian': { shape: 'Companion', earliest: 'A3', home: 'the town; else 8', window: [5, 11], sits: 'optional', attaches: 'town', tags: ['city'], beats: ['aq37-waiting', 'aq37-ready'], note: 'The town; else 8 (5-11). The escalation a stage after the meeting; the Litten comes when it is ready, a stage after that. Its finished path sets aq37-guardian-done (read by AQ10).' },
  'aq38-dusk-wolf': { shape: 'Companion', earliest: 'A3', home: 16, window: [14, 18], sits: 'optional', tags: ['cave', 'high'], beats: ['aq38-the-sunset', 'aq38-sunset-hill', 'aq38-wolf-greeting', 'aq38-wolf-evenings', 'aq38-wolf-colour', 'aq38-wolf-evening', 'aq38-wolf-evening-day', 'aq38-wolf-evening-night', 'aq38-letter', 'aq38-letter-again'], note: 'The header reads Dusk. Turning point: the sunset, at a + node at Dusk (evening) on any later stage, unless it was watched at the meeting. Small scenes at rests. One letter scene in each of the next two regions.' },
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
  AQ33: [
    '"A battle with flair moves only" is a no-knockout show bout that you win by using three different moves (the game\'s contest rule); no rule limits which moves count as flair.',
    'Remembers reads a Hawlucha in the party plus flag fighting-tournament-hawlucha, which the thread that builds the Fighting Tournament (gn.16) must set when one of its competitor Hawlucha joins.',
  ],
  AQ34: [
    'Goodra\'s Slime: the doc\'s held effect (contact moves against the holder lower the attacker\'s Speed) has no held hook yet; built as the nearest real one, physical attackers that hit the holder lose 1/16 of their HP.',
    '"Take it home.": the wetland opens four nodes on (two, then two more) as the next stops beside the path; it cannot be pinned to a water node.',
    'The doc has it stay at the wetland; the Companion rule says the player always chooses at a farewell, so "Bring it with you." is offered beside "Let it stay.".',
    'Its place in the Final Reunion ("sticky") is flag reunion-guest-goodra and a Chronicle line; the Final Reunion shows it.',
  ],
  AQ36: [
    'It "lives in the bag" in the story only: it joins the party like any other Pokémon.',
    'Remembers "the player\'s bag has a berry in it" checks an Oran, Sitrus or Lum Berry (an event holds three variants at most); the berry it ate is taken from the bag.',
  ],
  AQ37: [
    'Remembers "completed AN6 (the Long-Lived Traveller)" reads flag an06-grave-visited, which the batch building AN6 must set at its finale.',
  ],
  AQ38: [
    'With the sunset watched, the Dusk form comes in its "evening it evolves" scene (Bond 3, at Dusk): that scene makes it a Dusk Lycanroc. If it reaches level 25 first, the game evolves it by its usual rule and the scene then turns it Dusk.',
    'Without the sunset it evolves by the game\'s usual rule at level 25, where the branch (Midday or Midnight) is fixed for each Pokémon, not chosen by the hour; the evening scene follows.',
    'Remembers "done AN6 (the Houndstone at the grave)" reads flag an06-grave-visited, which the batch building AN6 must set at its finale.',
    'Elowen\'s letter "every region" is built as one letter scene in each of the next two regions.',
  ],
};

export const CHECKED: Record<string, string> = { AQ31: '2026-11-15', AQ32: '2026-11-15', AQ33: '2026-11-15', AQ34: '2026-11-15', AQ35: '2026-11-15', AQ36: '2026-11-15', AQ37: '2026-11-15', AQ38: '2026-11-15' };

const SEA = tagTypes('water');
const HOT = tagTypes('hot');
const CAVE = tagTypes('cave');
const WOOD = tagTypes('forest');
const CITY = tagTypes('city');
/** AQ38: Elowen asks before it goes with you. */
const ELOWEN = 'Elowen watches, bandaged hands pressed together. "Will you write? It can\'t write. Will you write for it?" You promise.';
const SUNSET_SCENE = 'The top of the hill, and the sun going down over the rim of the world, huge and red. The Rockruff sits. It watches the sun go down. For a long time. It does not fidget, it does not bite, it does not so much as twitch an ear. It is the stillest it has ever been. The last of it. And then, on the rim of the world, a green flash: a thing that happens one evening in a thousand. Its eyes have it.';
const SUNSET_AFTER = 'You sit beside it until the sky is dark blue and the first stars are out, and it does not move, and neither do you. When at last it turns to you, its eyes are still holding a little of that green. You know, without knowing how, what it will be when it is grown.';
const SUNSET = [flag('aq38-sunset-watched'), bondLine('rockruff', 5), moment('A Rockruff watched the sun go down with you until it saw the green flash.', 60)];
/** AQ38: the evening it evolves, as one scene for each form it can take. */
const wolfEvening = (id: string, requires: Json[], form: string, look: string, change: Json[]): Json => {
  const done = [...change, bondLine('rockruff', 10), flag('aq38-evolved')];
  return ev(id, 'The Evening It Evolves', AQ, { callback: true, requires: [...requires, notYet('aq38-evolved')], pokemon: form, tint: '#3a2014', effect: 'none' },
    `It is gone from camp. You find it out on a rock against the last of the light: bigger, the wrong shape for the dog it was, all mane and long legs, ${look}, with its back turned to you. It does not know whether it is still liked.`,
    [
      ch('Hold out a sleeve.', out('It looks at the sleeve. It looks at you. It takes it, very, very gently, the way it learned to, and holds on. Behind it, slowly, its tail begins to go, the way it did on the first day.', ...done, moment('Your wolf grew up on a rock at sundown, and took your sleeve, very gently.', 70))),
      ch('Come here.', out('It comes. Slowly, head low, unsure, too big for your lap now and trying to fit in it anyway. It does not fit. You do not let that stop either of you.', ...done, moment('Your wolf grew up on a rock at sundown, and came when you called.', 70))),
      ch('Sit down beside it.', out('You climb up and sit beside it, shoulder to shoulder, and look where it is looking. After a while it leans. It is a great deal heavier than it used to be. You do not mind at all.', ...done, moment('Your wolf grew up on a rock at sundown, and you sat beside it.', 70))),
    ]);
};
/** AQ36 Remembers: the berries it can have come for (three variants at most). */
const BERRIES_IN_BAG = ['oran-berry', 'sitrus-berry', 'lum-berry'];
/** AQ36's three choices; with a berry in the bag, it ate it (the variant swaps these in, each taking that berry). */
const bagChoices = (berry?: string): Json[] => {
  const ate = berry ? [lose(berry)] : [];
  const full = berry ? ' It is so full of berry that it does not even wake up for this.' : '';
  return [
    ch('Let it stay.', out(`You zip the bag most of the way, leaving it a gap to breathe, and carry it all day. Every so often the bag hoots.${full} When you make camp, it does not come out. It lives there now. You are just the bag\'s legs.`, ...ate, gain('rowlet', { bond: 10 }), flag('aq36-in-the-bag'))),
    ch('Wake it and send it home.', out(`You lift it out, gently, and it wakes all the way up, deeply offended. You point at the trees. It goes, flapping heavily up to the flock, and you zip the bag shut.${full ? ' It flies a little low, being so full.' : ''} The flock stops calling.`, ...ate, flag('aq36-sent-home'), room('aq36-back-in-the-bag'))),
    ch('Carry the bag to the flock.', out(`You carry the whole bag, Rowlet and all, to the foot of the flock\'s tree. An old Decidueye drops down, the elder, and looks into the bag for a long time. The Rowlet snores.${full} The elder looks at you. Then it nods, once, and goes back up. The flock stops calling. The matter, it seems, is settled.`, ...ate, gain('rowlet', { bond: 20 }), flag('aq36-elder-nodded'))),
  ];
};
const FED_TEXT = 'You set food down where it can reach without standing: berries, and everything soft you have. It does not trust it. Then hunger wins. It eats, slowly, coughing between mouthfuls. All night, every time you open your eyes, its eyes are open too, watching you over the egg.';
const DOCTOR_TEXT = 'The researcher has a number. The doctor comes down the long way, two nodes of cave, with a heavy bag and a great deal of patience, and it takes all of that time. By the end the Noivern\'s cough is a wheeze, then a sigh, then nothing. It stands up, for the first time in a week, and stretches its wings as far as the cave allows.';
/** No Fire type in the party (AQ32: "With no Fire type for Help"). */
const NO_FIRE: Json = { kind: 'partyType', type: 'fire', absent: true };

/** The Bond Phenomenon's "+10% to all stats", for one battle (Water types). */
const boost = (stats: string[]) => stats.map((stat) => ({ kind: 'statMultiplier', stat, type: 'water', value: 1.1 }));
/** A boost holds at most three modifiers, so the five stats come as two boosts for the same battle. */
const AS_ONE = [temp('The Bond Phenomenon', boost(['atk', 'spa', 'spe']), 1), temp('The Bond Phenomenon: guard', boost(['def', 'spd']), 1)];
const FROG_LINE = ['froakie', 'frogadier', 'greninja'];
/** AQ33: both of its matches open the same aftermath, win or lose. */
const AFTER_MATCH = (key: string) => ({ win: [flag(key), room('aq33-after-the-match')], lose: [flag(key), flag('aq33-match-lost'), room('aq33-after-the-match')] });
const WRESTLE = monDuel('Hawlucha', 'hawlucha', 0, { rule: { noSwitch: true }, ...AFTER_MATCH('aq33-wrestled') });
const FLAIR = monDuel('Hawlucha', 'hawlucha', 0, { rule: { contest: 3 }, ...AFTER_MATCH('aq33-flair-match') });

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

  // ---------------- AQ33. The Luchador ----------------
  ev('aq33-luchador', 'The Luchador', AQ, { rarity: 'uncommon', minStage: stageOf('A4'), types: tagTypes('high', 'forest'), cast: ['trainer.pr/school_kid_m'], pokemon: 'hawlucha', tint: '#1e2a18', effect: 'none',
    remembers: [{ id: 'tournament', when: [hasMon('hawlucha'), flagIs('fighting-tournament-hawlucha')], notice: 'Your own Hawlucha stops dead. It knows this one: they stood across the ring from each other at the Fighting Tournament. The two of them strike the same pose at the same moment, mirror images, and neither will be the first to stop.' }] },
    'A tall rock above a forest path. On top of it, a Hawlucha strikes a pose: wings wide, chest out, one foot planted like a statue. Below it, three bullies come tearing out of the trees, running for their lives, one of them missing a shoe. The Hawlucha watches them go without moving a feather. Then it turns, sees you, and poses again, just for you. A small forest kid peeks out from behind a trunk. "It protects the little ones. Every single day. It won\'t let anyone thank it, though. It just poses and goes."',
    [
      ch('Pose back.', fight('You plant a foot and throw your arms wide. It is a terrible pose. The Hawlucha is visibly moved. It leaps down, bows deeply, and points to a flat patch of grass: a ring. It wants a wrestling match. One on one, nobody tagging out.', WRESTLE)),
      ch('Thank it.', out('You call up a thank-you. The Hawlucha turns its back on you, slowly, dramatically, wings folded round it like a cape, and holds that pose too. The forest kid sighs. "Told you." But it does not leave. It is watching you over its shoulder, and it is, you think, a little bit pleased.', flag('aq33-thanked'), room('aq33-luchador-again'))),
      ch('Challenge it to a match.', fight('It accepts before you finish the sentence. But this is a show, not a brawl: it wants style. No knockouts. Show it your moves, three different ones, and make every one of them count.', FLAIR)),
    ]),
  ev('aq33-luchador-again', 'Still Posing', AQ, { room: true, cast: ['trainer.pr/school_kid_m'], pokemon: 'hawlucha', tint: '#1e2a18', effect: 'none' },
    'The Hawlucha is still on its rock, back half turned, peeking at you over one wing. The forest kid tugs your sleeve and whispers. "It likes you. It just can\'t ever say so. You have to do something it understands."',
    [
      ch('Pose back.', fight('You strike the worst pose of your life. The Hawlucha spins round, delighted, leaps down and points at the ring. One on one, nobody tagging out.', WRESTLE)),
      ch('Challenge it to a match.', fight('It is off the rock in one bound. A show, not a brawl: no knockouts, three different moves, all style.', FLAIR)),
      ch('Leave it to its forest.', leave('You bow to it, the way it bowed to nobody. It holds its pose until you are out of sight. You hear the little ones cheering it behind you.')),
    ]),
  ev('aq33-after-the-match', 'The Champion of the Little Ones', AQ, { room: true, cast: ['trainer.pr/school_kid_m'], pokemon: 'hawlucha', tint: '#2a3418', effect: 'confetti',
    remembers: [{ id: 'it-won', when: [flagIs('aq33-match-lost')], notice: 'It won. It does not seem to care about that at all. It keeps looking at you as if you had won something better.' }] },
    'The match is over. The forest kids have come out of the trees to watch, a whole row of them. The Hawlucha climbs back onto its rock and strikes the biggest pose yet, at the sky, for nobody. Then it hops down and stands in front of you, waiting. The first kid tugs your sleeve. "It wants to come with you. It will never say it. You have to say it."',
    [
      ch('Say it.', out('You say it. The Hawlucha turns its back on you, very dramatically, so that nobody can see its face. The kids can see its face. They all start giggling. Then it marches to your side and stays there, posing at everything you pass for the rest of the day.', gain('hawlucha', { bond: 15 }), flag('aq33-joined'))),
      ch('Leave it to guard the forest.', leave('It nods, once, gravely, as one champion to another. Then it climbs back up its rock and poses for the little ones, who cheer. When you look back from the end of the path it is posing at you, and holding it.')),
    ]),

  // ---------------- AQ34. The Goomy Who Went Home ----------------
  ev('aq34-goomy-went-home', 'The Goomy Who Went Home', AQ, { rarity: 'uncommon', minStage: stageOf('A5'), types: HOT, pokemon: 'goomy', tint: '#3a2c14', effect: 'none' },
    'Sand and heat, and in the middle of it the last thing you expect: a Goomy, crying. It is drying out. Its skin has gone tacky and dull, and the little wet trail it leaves behind it vanishes in the sun almost at once. It sees you, and lights up, and slides straight over and hugs your boot. It is very sticky. It loves you at once. Someone has written a phone number on a tag round its horn. You call it. A tired voice answers: a wetland keeper. "The wetland\'s being drained. That Goomy was the only one that got out. It must have walked for days."',
    [
      ch('Take it home.', out('The keeper gives you the way, voice cracking. "Four nodes from you. Please hurry. They\'re nearly done." You wrap the Goomy in a wet shirt and it hums against your neck the whole way, damp and pleased, as if going home with you were the best idea anyone ever had.', gain('goomy', { bond: 20 }), flag('aq34-met'), flag('aq34-going-home'), later('aq34-on-the-way', 2))),
      ch('Raise it.', out('You keep it. You keep it wet: a water bottle, then two, then a hat full of puddle. It is happy. It is very, very happy, and very sticky, and by evening there is Goomy on everything you own. The keeper sighs down the phone, then laughs. "Look after it, then. It picked you."', gain('goomy', { bond: 20 }), flag('aq34-met'), flag('aq34-raised'))),
      ch('Find it a wetland nearby.', out('There is a marsh an hour off the road: small and cool and full of reeds. You carry the Goomy there and set it down in the mud. It sighs all the way down to its feelers. It is home, or near enough. When you leave, it slides to the edge of the water and watches you go, and it does not stop watching until the reeds close behind you. It misses you already. On your sleeve it has left a great shining smear of slime that will never quite wash out.', item('goodra-slime'), flag('aq34-nearby'))),
    ]),
  ev('aq34-on-the-way', 'The First Rain', AQ, { room: true, pokemon: 'sliggoo', tint: '#1c2a30', effect: 'rain' },
    'Halfway home, rain comes in off the hills: the first rain the Goomy has felt in days. It slides off your shoulder into the biggest puddle on the road and just lies there, soaking, getting bigger. Then it really does get bigger. It stretches, and swells, and stands up out of the puddle taller than it was, shining and soft: a Sliggoo. It looks at its new self in the water, and then at you, and then down the road toward home.',
    [
      ch('Hurry on.', out('It slides ahead of you now, leaving a broad wet track you could follow in the dark. It does not need carrying any more. It knows the way. Two nodes to go.', evolve('goomy', 'sliggoo'), bondLine('goomy', 5), flag('aq34-sliggoo'), later('aq34-the-wetland', 2))),
    ]),
  ev('aq34-the-wetland', 'The Draining Crew', AQ, { room: true, cast: ['trainer.pr/worker_f'], pokemon: 'goodra', tint: '#2a2418', effect: 'shake' },
    'The wetland. Or what is left of it: pumps chugging on the bank, pipes running off over the hill, mud cracking where the water stood. A crew in hard hats is clearing the last of the reeds. Your Sliggoo goes very quiet. Then it grows. It stands up taller than you, shining, horns sweeping back, and it is a Goodra, and it is furious, and it is home.',
    [
      ch('Stand with it.', fight('Goodra plants itself between the crew and the last of the water, and you stand beside it.', duel('The Draining Crew', { cls: 'worker', size: 3, types: ['ground', 'steel'], win: [flag('aq34-wetland-saved'), room('aq34-the-protector')] }, { lose: [flag('aq34-wetland-saved'), flag('aq34-crew-fight-lost'), room('aq34-the-protector')] }), evolve('goomy', 'goodra'), evolve('sliggoo', 'goodra'))),
    ]),
  ev('aq34-the-protector', 'The Wetland\'s Protector', AQ, { room: true, pokemon: 'goodra', tint: '#1c3024', effect: 'rain',
    remembers: [{ id: 'crew-gave-up', when: [flagIs('aq34-crew-fight-lost')], notice: 'You lost the fight. It did not matter. The crew took one look at a Goodra standing in the last of the water, crying, and turned the pumps off themselves.' }] },
    'The pumps are off. Water is already creeping back across the mud, slow and brown and certain. Goodra wades out into it up to its chest and stands there with its eyes shut. Little Goomy are coming out of the reeds, the ones that hid, one by one, and gathering round its feet. The keeper is crying down the phone. Goodra turns and looks at you. It does not want to leave you. It does not want to leave them.',
    [
      ch('Let it stay.', out('You say it before it has to. It wades back and hugs you: all of you, sticky, for a very long time. When you go, the whole wetland is watching, and the slime it left on your coat shines all the way to the next node. It is the wetland\'s protector now. It always was going to be.', farewell('It stays to guard its wetland', ['goomy', 'sliggoo', 'goodra']), item('goodra-slime'), flag('aq34-stayed-home'), flag('reunion-guest-goodra'), moment('Your Goodra walked home across a desert and saved its wetland. It stayed to guard it. It is still sticky.', 75))),
      ch('Bring it with you.', out('It looks at the little ones in the reeds, and then at you, and comes. It cries a bit, the first night. The keeper promises to send news, and the wetland will be fine now the crew is gone. Goodra is less sure it will be fine without them. It is completely sure about you.', bondLine('goomy', 10), flag('aq34-came-away'), moment('Your Goodra saved its wetland, and then chose the road with you.', 60))),
    ]),

  // ---------------- AQ35. The Egg in the Cave ----------------
  ev('aq35-egg-in-the-cave', 'The Egg in the Cave', AQ, { rarity: 'uncommon', minStage: stageOf('A4'), types: CAVE, cast: ['trainer.pr/scientist_f'], pokemon: 'noivern', tint: '#16141e', effect: 'none' },
    'Deep in a cave, where the light from the entrance gives out, something huge is curled round an egg: a Noivern, wings wrapped tight. It growls when it hears you, a sound that fills the whole cave. Then it coughs, and coughs again, and cannot stop. It tries to rise, and its wings will not hold it. It cannot fly. A researcher with a headlamp is sitting a careful distance away. "It\'s been sick a week. It hasn\'t left that egg once, not even to eat."',
    [
      ch('Bring it food.', out(FED_TEXT, flag('aq-noibat-fed'), room('aq35-after-food'))),
      ch('Take the egg somewhere safe.', out('You take one step toward the egg. That is all it takes. The Noivern comes up off the ground on wings that should not hold it, screaming, and the sound slams you back against the rock. It lands between you and the egg, shaking, coughing, and still screaming.', flag('aq35-egg-grabbed'), room('aq35-it-attacks'))),
      ch('Call a doctor.', out(DOCTOR_TEXT, takeNode(2), flag('aq-noibat-doctor'), room('aq35-after-doctor'))),
    ]),
  ev('aq35-it-attacks', 'The Scream', AQ, { room: true, pokemon: 'noivern', tint: '#16141e', effect: 'rattle' },
    'The Noivern is between you and the egg, wings spread as wide as the cave allows, the sound coming off it so loud the walls ring. It is shaking. It cannot keep this up for long. It is going to try anyway.',
    [
      ch('Retreat.', leave('You back away, hands up, all the way to the light. The screaming stops the moment you reach the cave mouth. Behind you, in the dark, the coughing starts again.')),
      ch('Explain.', out('You crouch down, as small as you can make yourself, and you talk. You hardly know what you are saying. It does not matter: it is the voice that matters, low and steady. The sound stops. The Noivern sinks back round its egg, spent, and watches you. It has not decided you are a friend. It has decided you can stay.', flag('aq35-explained'), room('aq35-second-chance'))),
    ]),
  ev('aq35-second-chance', 'You Can Stay', AQ, { room: true, cast: ['trainer.pr/scientist_f'], pokemon: 'noivern', tint: '#16141e', effect: 'none' },
    'The Noivern is curled round its egg again, coughing, one eye fixed on you. The researcher lets out a breath she has been holding for a long time. "I thought that was the end of you. All right. Now what?"',
    [
      ch('Bring it food.', out(FED_TEXT, flag('aq-noibat-fed'), room('aq35-after-food'))),
      ch('Call a doctor.', out(DOCTOR_TEXT, takeNode(2), flag('aq-noibat-doctor'), room('aq35-after-doctor'))),
    ]),
  ev('aq35-after-food', 'Watched All Night', AQ, { room: true, cast: ['trainer.pr/scientist_f'], pokemon: 'noivern', tint: '#16141e', effect: 'none' },
    'Morning, or what passes for it in a cave. The Noivern ate. It is still coughing, and it still cannot fly, but it watches you differently now. Under its wing, the egg rocks, once. The researcher looks at the cough, and then at you. "Food helps. It won\'t fix that chest."',
    [
      ch('Call a doctor.', out(DOCTOR_TEXT, takeNode(2), flag('aq-noibat-doctor'), room('aq35-hatching'))),
      ch('Let them rest.', leave('You leave the rest of your food where it can reach, and go. All the way to the cave mouth you can feel it watching you. You hope the cough eases. You will never know.')),
    ]),
  ev('aq35-after-doctor', 'Well, and Hungry', AQ, { room: true, cast: ['trainer.pr/doctor_m'], pokemon: 'noivern', tint: '#16141e', effect: 'none' },
    'The Noivern is well. It is also starving: a week without food, and even now, well again, it will not leave the egg to hunt. It looks at the cave mouth, then at the egg, then at you. The doctor packs his bag. "Medicine\'s done its part. It needs feeding now, and it won\'t go."',
    [
      ch('Bring it food.', out(FED_TEXT, flag('aq-noibat-fed'), room('aq35-hatching'))),
      ch('Leave them be.', leave('You go. It is well now; it will hunt in the end, when it has to. At the cave mouth you look back. It is still looking at the light, and still not moving.')),
    ]),
  // Fed and doctored: the egg hatches in the player's arms while the parent watches.
  ev('aq35-hatching', 'In Your Arms', AQ, { room: true, requires: [flagIs('aq-noibat-fed'), flagIs('aq-noibat-doctor')], pokemon: 'noibat', tint: '#221c2e', effect: 'sparkle' },
    'The Noivern has eaten. It is well. For the first time in more than a week it lifts its wing off the egg. Then it does a thing you did not expect: it nudges the egg toward you, slowly, with its nose. You pick it up. It is warm. It is moving. It cracks in your arms, and a Noibat tumbles out, all ears, and screams at you with its whole tiny body. The parent watches. It does not take it back.',
    [
      ch('Hold it close.', out('The Noibat stops screaming. It sniffs you, all over, very loudly. Then it climbs your coat and hangs off your collar upside down, satisfied. The Noivern looks at the two of you for a long time, and then it folds its wings and settles down to sleep, properly, for the first time in a week. It has let it go with you.', gain('noibat', { bond: 30 }), flag('aq35-hatched'), moment('A Noibat hatched in your arms in a cave, and its parent let it go with you.', 70))),
      ch('Give it back to its parent.', leave('You set the Noibat down by the great wing. The parent looks at it, and at you, and then gathers it in, very gently. The researcher is crying, quietly, behind her headlamp. You walk out into the light with empty arms and a warm feeling where the egg was.')),
    ]),

  // ---------------- AQ36. The One Who Sleeps in the Bag ----------------
  ev('aq36-sleeps-in-the-bag', 'The One Who Sleeps in the Bag', AQ, { rarity: 'common', minStage: stageOf('A1'), types: WOOD, pokemon: 'rowlet', tint: '#1a2a18', effect: 'none',
    remembers: BERRIES_IN_BAG.map((berry) => ({ id: berry, when: [has(berry)], notice: 'There is a berry missing from your bag, and juice all over the Rowlet\'s face. It was here for the berry. It is now very full, and very, very asleep.', hide: [0, 1, 2], addChoices: bagChoices(berry) })) },
    'You open your bag for a snack, and somebody is already in it: a Rowlet, round as a bun, asleep on top of your spare socks. It opens one eye. It looks at you. It looks at you a while longer, as if you were the one who had climbed into its bag. Then it closes the eye and goes back to sleep. From the trees overhead, a whole flock of Rowlet start calling, round and round, the way you would call a child in for dinner.',
    bagChoices()),
  ev('aq36-back-in-the-bag', 'Back Again', AQ, { room: true, pokemon: 'rowlet', tint: '#141c24', effect: 'none' },
    'That night, by your fire, you hear a scratching. The zip of your bag is open. There is a Rowlet in the bag, on the socks, asleep, exactly where it was this morning. It has brought a leaf with it, as a pillow.',
    [
      ch('Let it stay.', out('You zip the bag most of the way, leaving it a gap to breathe. It hoots once in its sleep. In the morning the flock calls, and it does not answer, and the flock, after a while, stops calling. It has decided. It lives in the bag now.', gain('rowlet', { bond: 15 }), flag('aq36-in-the-bag'))),
      ch('Carry it back to the flock.', leave('You carry it to the trees in the dark and set it on a branch. It does not wake up. In the morning, you check your bag twice. It is empty, and somehow that is the saddest thing you have seen all week.')),
    ]),

  // ---------------- AQ37. The Old Guardian ----------------
  ev('aq37-old-guardian', 'The Old Guardian', AQ, { rarity: 'uncommon', minStage: stageOf('A3'), types: CITY, cast: ['trainer.pr/pokefan_f'], pokemon: 'litten', tint: '#241c1c', effect: 'none' },
    'An empty building at the end of a street: broken windows, a door hanging off one hinge. A Litten slips out from under a market stall with a bun in its mouth and runs for it. Inside, on a heap of old coats, lies a Stoutland. It is very old. Its great moustache has gone white and thin. The Litten sets the bun down by its nose and sits back to watch it eat. It brings it everything. A neighbour leaning on her gate shakes her head. "That dog\'s been dying for months. The cat won\'t let it."',
    [
      ch('Help them.', out('You buy food and carry it in. The Litten puffs itself up to twice its size and spits at you. Then, when you set the food down and step back, it lets you. Barely. It stands over the Stoutland the whole time, watching your hands. The old dog eats a little and thumps its tail, once, on the coats. The Litten looks at the tail as if it were a miracle.', flag('aq37-met'), flag('aq37-helped'))),
      ch('Bring a doctor.', out('The doctor kneels by the coats a long time, gentle hands, quiet voice. Then she sits back on her heels. "There\'s nothing to do. He\'s just old. He\'s very, very old." The Litten does not understand the words. It understands the voice. It lies down along the Stoutland\'s side, and does not move again while you are there. It is staying.', flag('aq37-met'), flag('aq37-doctor'))),
      ch('Leave them be.', out('You walk on. It is not your street. Behind you the Litten is already out again, hunting the market for something the old dog might eat. That night, in the building at the end of the street, the Stoutland dies, with nobody there but the Litten.', flag('aq37-met'), flag('aq37-left'))),
    ]),
  // Escalation: the next stage. The Stoutland has died; the Litten waits for it to come back.
  ev('aq37-waiting', 'Waiting at the Door', AQ, { callback: true, requires: [flagIs('aq37-met'), age('aq37-met', 1)], types: CITY, cast: ['trainer.pr/pokefan_f'], pokemon: 'litten', tint: '#1c1820', effect: 'none',
    remembers: [
      { id: 'traveller', when: [flagIs('an06-grave-visited')], notice: 'Footsteps behind you: the long-lived traveller, staff in hand. She says nothing. She sits down on the floor beside the Litten, the way someone sits who has done this many times, for many friends. She has.' },
      { id: 'alone', when: [flagIs('aq37-left')], notice: 'You walked past this door a stage ago. Nobody was here when it happened, nobody but the Litten. It does not know you. It does not need to.' },
      { id: 'the-food', when: [flagIs('aq37-helped')], notice: 'It remembers the food you carried in. It does not spit at you this time. It only looks.' },
    ] },
    'You pass back by the building at the end of the street. The neighbour tells you over her gate, very quietly: the old Stoutland died. Inside, the coats are still shaped like the dog. The Litten sits beside them, upright, watching the door. Every so often it goes out, and comes back with food, and sets it down where the nose used to be. Then it sits again and watches the door. It is waiting for it to come back.',
    [
      ch('Sit with it.', out('You sit down on the floor, not too close. You do not say anything. It does not look at you. The light goes across the room, and up the wall, and out. Some time in the dark the Litten moves along the coats until its back is against your leg. It is still watching the door. But it is leaning.', flag('aq37-grieved'), flag('aq37-sat'))),
      ch('Take it away.', out('You pick it up. It fights you, all claws, yowling, and you hold on and carry it out into the street, and then it goes completely still in your arms, which is worse. It comes with you, because you are carrying it. It looks back at the door until the street turns. It was not ready. You both know it was not ready.', gain('litten'), bondLine('litten', -30), flag('aq37-taken-away'), flag('aq37-guardian-done'))),
      ch('Wait.', out('You do not go in. You sit on the step outside, every day you are in town, where it can see you. The Litten carries its food past you, in and out, in and out. On the third day it stops in front of you, and drops a bun at your feet, and goes back inside to the door.', flag('aq37-grieved'), flag('aq37-waited'))),
    ]),
  // When it is ready: a stage after the player stayed with it.
  ev('aq37-ready', 'When It Is Ready', AQ, { callback: true, requires: [flagIs('aq37-grieved'), age('aq37-grieved', 1)], pokemon: 'litten', tint: '#2a1c18', effect: 'none',
    remembers: [
      { id: 'leaned', when: [flagIs('aq37-sat')], notice: 'It leaned on you once, in the dark, while it watched a door. It is not watching any door now. It is watching you.' },
      { id: 'step', when: [flagIs('aq37-waited')], notice: 'You sat on its step for three days. Now it has come and sat on yours.' },
    ] },
    'On the road there is a Litten sitting in the middle of the path in front of you. It is thinner than it was. It has a bun in its mouth. It walks up and sets the bun down at your feet, the way it used to set them by the old dog\'s nose, and sits back, and watches you, to see if you will eat.',
    [
      ch('Eat it.', out('You eat it. It is squashed and very stale, and it is the best thing you have eaten all run. The Litten watches every bite. When you finish, it gets up and walks beside you, close, and that is that. It has somebody to look after again.', gain('litten', { bond: 30 }), flag('aq37-guardian-done'), moment('A Litten looked after an old Stoutland until the very end. When it was ready, it came to look after you.', 75))),
      ch('Share it with it.', out('You break the bun in half and hold one half out. It looks at the half for a long moment, as if nobody had ever thought to feed it back. Then it eats, beside you, shoulder to your knee. When you stand up, it stands up too.', gain('litten', { bond: 30 }), flag('aq37-guardian-done'), moment('A Litten looked after an old Stoutland until the very end. When it was ready, it came to look after you.', 75))),
      ch('Tell it to go home.', leave('You tell it, gently, that it does not have to look after anyone. It looks at you for a long time. Then it picks the bun back up and goes, back down the road toward the town, and you never quite know whether that was right.')),
    ]),

  // ---------------- AQ38. The Dusk Wolf ----------------
  ev('aq38-dusk-wolf', 'The Dusk Wolf', AQ, { rarity: 'rare', minStage: stageOf('A3'), types: tagTypes('cave', 'high'), cast: ['trainer.pr/school_kid_f'], pokemon: 'rockruff', tint: '#3a2418', effect: 'none' },
    'Evening at the foot of a rocky hill, the sky going orange. A girl comes down the path beaming, a Rockruff trotting at her heels. Both her hands are bandaged. Up to the elbow on the left. "I\'m Elowen. Elowen Stanhope. It likes me a lot." She holds up the bandages, as proof. "Mum says it\'s got to go. It bit the postman. It loves the postman." The Rockruff trots over to you. It bites your sleeve, then sits, tail going, holding on.',
    [
      ch('Let it.', out(`You do not pull away. You do not flinch. It holds on, and holds on, and then, puzzled, lets go, and licks the wet patch it left. Over the next stage it bites less, and then less again. It needed somebody not to flinch. ${ELOWEN}`, gain('rockruff', { bond: 10 }), flagAt('aq38-met'), flag('aq38-let-it'))),
      ch('Train it.', out(`It bites. You go still, perfectly still, and wait. It lets go, confused. The next time it only mouths, gently, and you praise it to the skies. By sundown it has worked out the difference, and it is so proud of it that it runs to {lead} and demonstrates: chomp, gentle, chomp, gentle. ${ELOWEN}`, gain('rockruff', { bond: 15 }), flagAt('aq38-met'), flag('aq38-play-bite')),
        { prompt: { id: 'brace-hold', needs: 'ok' }, fail: out(`It bites. You flinch, you cannot help it, and it holds on tighter, delighted with the game. You try again, and again. By sundown your sleeve is in rags and it has the idea, mostly: it only bites hard now when it is very excited, which is often. ${ELOWEN}`, gain('rockruff', { bond: 10 }), flagAt('aq38-met'), flag('aq38-play-bite')) }),
      ch('Take it to see the sunset.', out(`The sun is already low. You take it up the hill with Elowen, the Rockruff tugging your sleeve the whole way, as if it knows where you are going. ${ELOWEN}`, gain('rockruff', { bond: 10 }), flagAt('aq38-met'), room('aq38-the-sunset'))),
      ch('Leave it with Elowen.', leave('You give her back her Rockruff. She hugs it, bandages and all, and it bites her hair, lovingly. "Mum will come round," she says, not at all sure. You hope so, all the way down the road.')),
    ]),
  ev('aq38-the-sunset', 'The Green Flash', AQ, { room: true, pokemon: 'rockruff', tint: '#4a2414', effect: 'sparkle' }, SUNSET_SCENE,
    [
      ch('Watch with it.', out(SUNSET_AFTER, ...SUNSET)),
    ]),
  // The turning point if the sunset was not watched at the meeting: any later stage, at Dusk, while it is still a Rockruff.
  ev('aq38-sunset-hill', 'A Hill Facing West', AQ, { callback: true, requires: [flagIs('aq38-met'), age('aq38-met', 1), notYet('aq38-sunset-watched'), hasMon('rockruff'), at('evening')], types: tagTypes('cave', 'high'), pokemon: 'rockruff', tint: '#4a2414', effect: 'none' },
    'Evening comes on, red and gold. Beside the road there is a hill with a clear view to the west. The Rockruff has stopped walking. It is looking at the light. It looks at the hill. Then it looks at you, and does not bite anything at all.',
    [
      ch('Take it up the hill.', out(`You climb together. ${SUNSET_SCENE} ${SUNSET_AFTER}`, ...SUNSET)),
      ch('Not tonight.', out('You walk on. It walks on beside you, looking back over its shoulder at the light until the road turns. There will be other evenings, and other hills.', again('aq38-sunset-hill'))),
    ]),
  // Small scenes: one each time its Bond rises a step, while it is in the party.
  ev('aq38-wolf-greeting', 'Rocks on Its Neck', AQ, { callback: true, requires: [flagIs('aq38-met'), line('rockruff', 1), age('aq38-met', 1)], pokemon: 'rockruff', tint: '#2a2018', effect: 'none' },
    'At camp the Rockruff comes and leans on your leg, and rubs the rocks round its neck up and down against your shin, hard. It is a greeting. It is, you discover, also quite sore.',
    [
      ch('Rub its neck.', out('You rub the soft fur at the base of the rocks, where it itches. It groans like an old door and falls over sideways, legs in the air. From then on it greets you the same way every evening, and you keep a hand ready.', bondLine('rockruff', 5), flag('aq38-scene-1'))),
      ch('Let it lean.', out('You stand still and let it lean, bruises and all. It leans harder. It is a small dog with a lot of rock on it and a great deal to say, and this is how it says it.', bondLine('rockruff', 5), flag('aq38-scene-1'))),
    ]),
  ev('aq38-wolf-evenings', 'Cross in the Evenings', AQ, { callback: true, requires: [seen('aq38-wolf-greeting'), line('rockruff', 2)], pokemon: 'rockruff', tint: '#2a1c18', effect: 'none',
    remembers: [{ id: 'the-grave', when: [flagIs('an06-grave-visited')], notice: 'Tonight it goes further than usual. You find it on the hill, at the old grave where the long-lived traveller stood, howling. Something under the ground howls back, pleased.' }] },
    'Evenings, it gets cross. No reason you can see. Its fur goes up, it snaps at nothing, and then it goes off alone for an hour, out past the firelight. It always comes back. It always comes back sorry, head low, and lies down with its chin on your boot.',
    [
      ch('Wait up for it.', out('You keep the fire going until it comes in. It looks surprised to find you awake, and then very relieved, and lies down a little closer than usual. You do not ask where it went. It would not be able to tell you.', bondLine('rockruff', 5), flag('aq38-scene-2'))),
      ch('Follow it out.', out('You follow at a distance. It sits on a rock and stares at the last of the light, growling softly at nothing. When it notices you, it comes straight back, tail low, sorry, and walks home pressed against your legs.', bondLine('rockruff', 5), flag('aq38-scene-2'))),
    ]),
  ev('aq38-wolf-colour', 'At the Turn of the Light', AQ, { callback: true, requires: [seen('aq38-wolf-evenings'), line('rockruff', 3)], pokemon: 'rockruff', tint: '#3a2418', effect: 'glint',
    remembers: [{ id: 'green', when: [flagIs('aq38-sunset-watched')], notice: 'The colour is green. The exact green of the flash you saw together on the hill.' }] },
    'The evenings are worse now. It paces. And at the turn of the light, just for a second, as the sun touches the edge of the world, its eyes go a colour you have never seen on it. Then it blinks, and they are its own again, and it looks at you as if to ask whether you saw.',
    [
      ch('Tell it you saw.', out('You tell it. It looks at you for a long time. Then it lies down with its chin on your knee, and stays there until it is fully dark, as if it is glad that somebody else knows.', bondLine('rockruff', 5), flag('aq38-scene-3'))),
      ch('Hold it until it passes.', out('You put your arms round it, rocks and all, and hold on until the light is gone. It shakes a little. Then it stops. Whatever is coming, it will not meet it alone.', bondLine('rockruff', 5), flag('aq38-scene-3'))),
    ]),
  // The evening it evolves. With the sunset watched it is a Dusk Lycanroc; without, it evolved by the game's usual rule.
  wolfEvening('aq38-wolf-evening', [flagIs('aq38-sunset-watched'), age('aq38-sunset-watched', 1), line('rockruff', 3), at('evening')], 'lycanroc-dusk', 'orange as the last of the day, and in its eyes, still, a little of that green', [evolve('rockruff', 'lycanroc-dusk'), evolve('lycanroc', 'lycanroc-dusk'), evolve('lycanroc-midnight', 'lycanroc-dusk')]),
  wolfEvening('aq38-wolf-evening-day', [flagIs('aq38-met'), notYet('aq38-sunset-watched'), hasMon('lycanroc')], 'lycanroc', 'the colour of noon, eyes clear and bright', []),
  wolfEvening('aq38-wolf-evening-night', [flagIs('aq38-met'), notYet('aq38-sunset-watched'), hasMon('lycanroc-midnight')], 'lycanroc-midnight', 'red as a fire gone low, eyes like the middle of the night', []),
  // Afterstory: a letter to Elowen in each of the next two regions, with a tooth mark for a signature.
  ev('aq38-letter', 'A Letter for Elowen', AQ, { callback: true, requires: [flagAgo('aq38-met', 1), line('rockruff')], cast: ['trainer.pr/school_kid_f'], pokemon: 'rockruff', tint: '#2a2418', effect: 'none' },
    'A new region, and you owe Elowen a letter. You sit down with paper at the next rest. Your wolf sits down with you, very interested in the pen, and slightly less interested in not eating it.',
    [
      ch('Write it together.', out('You write about the road, the evenings, the biting (less). At the bottom, where you would sign, it leans over and bites the corner of the page, very carefully: a tooth mark, by way of signature. You post it at the next town. Somewhere, a girl with healing hands is going to laugh out loud.', bondLine('rockruff', 5), flag('aq38-letter-1'), moment('You wrote to Elowen. Your wolf signed it with a tooth mark.', 50))),
    ]),
  ev('aq38-letter-again', 'Another Letter', AQ, { callback: true, requires: [seen('aq38-letter'), flagAgo('aq38-met', 2), line('rockruff')], cast: ['trainer.pr/school_kid_f'], pokemon: 'rockruff', tint: '#2a2418', effect: 'none' },
    'Another region, another letter for Elowen. This time there is one waiting for you too, forwarded twice and very creased. In big careful writing she says her hands have healed, her mum has stopped being cross, and the postman asks after it every single day.',
    [
      ch('Write back.', out('You read her letter out loud. At the word postman, its ears go straight up. You write back, a long one this time, and at the bottom it signs again: one tooth mark, very neat, a little deeper than last time. It has grown.', bondLine('rockruff', 5), flag('aq38-letter-2'))),
    ]),

];

export const REMOVE: string[] = [];
