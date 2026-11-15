// Anime questlines, module 7: AQ18-AQ23. Follows tools/events/co/anime-0.ts (the worked examples) and _animeKit.ts.
//   AQ18 Carried Home                          (Companion; script: QUESTLINES_ASH.md "AQ18")
//   AQ19 The One Who Lost Its Power for Love   (Companion; script: QUESTLINES_DEEPENED_2.md "AQ19")
//   AQ20 The Proud Crab                        (Single;    script: QUESTLINES_ASH.md "AQ20")
//   AQ21 The Ice That Wouldn't Break           (Companion; script: QUESTLINES_ASH.md "AQ21")
//   AQ22 The Aipom Who Wanted Contests         (Companion, trade; script: QUESTLINES_ASH.md "AQ22")
//   AQ23 The Abandoned Chimchar                (Companion, rival; script: QUESTLINES_ASH.md "AQ23")
// Build: npm run co:build -- anime-7
import { ch, ev, fight, flag, flagAgo, flagAt, flagIs, flagThisRegion, fr, heal, hurt, hurtLead, item, out, relic, room, type Json } from '../dsl.ts';
import { AQ, age, bondLine, duel, evolve, gain, hasMon, later, line, moment, monDuel, notYet, seen, stageOf, tagTypes, temp, type Place } from './_animeKit.ts';

export { CATEGORY } from './_animeKit.ts';

export const QUESTLINES: Record<string, string> = {
  AQ18: 'aq18-carried-home',
  AQ19: 'aq19-lost-its-power',
  AQ20: 'aq20-proud-crab',
  AQ21: 'aq21-ice-wouldnt-break',
  AQ22: 'aq22-aipom-contests',
  AQ23: 'aq23-abandoned-chimchar',
};

export const PLACEMENT: Record<string, Place> = {
  'aq18-carried-home': { shape: 'Companion', earliest: 'A5', home: 'a + node', sits: 'optional', tags: ['cave', 'high'], beats: ['aq18-climb-1', 'aq18-climb-2', 'aq18-climb-3', 'aq18-the-top', 'aq18-tyranitar-comes'], note: 'An egg at a + node. The turning point is a door: the climb, one scene on each of the next four nodes. The Tyranitar comes once, a region or more later.' },
  'aq19-lost-its-power': { shape: 'Companion', earliest: 'A4', home: 9, window: [6, 12], sits: 'optional', attaches: 'after', tags: ['forest'], level: 'A+1', beats: ['aq19-the-walk', 'aq19-twig-back', 'aq19-still-looks', 'aq19-sapling', 'aq19-treecko-twig', 'aq19-treecko-rock', 'aq19-grovyle-leaf'], note: 'It starts with somebody else\'s Sceptile. The meadow fight is A+1. "Let it be" comes back on a later stage of the same region.' },
  'aq20-proud-crab': { shape: 'Single', earliest: 'A2', home: 6, window: [4, 9], sits: 'optional', tags: ['water'], beats: ['aq20-drill-footwork', 'aq20-drill-brace', 'aq20-drill-crabhammer', 'aq20-crab-gloats', 'aq20-crab-asks'], note: 'Laughed and lost: it gloats two nodes on and asks to come on the next stage.' },
  'aq21-ice-wouldnt-break': { shape: 'Companion', earliest: 'A4', home: 9, window: [6, 12], sits: 'optional', tags: ['snow'], beats: ['aq21-drill-head', 'aq21-drill-post', 'aq21-drill-spar', 'aq21-proud'], note: 'The short script has the meeting only: no small scenes or turning point are written, so none are built.' },
  'aq22-aipom-contests': { shape: 'Companion', earliest: 'A3', home: 7, window: [4, 10], sits: 'optional', tags: ['forest'], beats: ['aq22-ribbon'], note: 'Companion story, trade: the Aipom comes to you through an honest trade. The short script has no small scenes or turning point.' },
  'aq23-abandoned-chimchar': { shape: 'Companion', earliest: 'A3', home: 8, window: [5, 11], sits: 'optional', beats: ['aq23-blaze', 'aq23-finale', 'aq23-after', 'aq23-controlled', 'aq23-seen-happy'], note: 'Tags: any. Companion story, rival: the finale (Paul, two stages after the meeting) uses the rival slot (RIVALS_PLACED.md): one rival beat per stage, steps 3-18. The Blaze scene is a stage after the meeting.' },
};

/** Doc choices that are not buttons (questline -> label -> reason). */
export const NOT_A_BUTTON: Record<string, Record<string, string>> = {};

export const LIMITS: Record<string, string[]> = {
  AQ18: [
    'The turning point "is a door": built as four scenes on the next four nodes of the map (the climb), not a chain pseudo-stage; this batch has no pseudo-stage file.',
    'The Tyranitar "comes once, in the last region": the game has no "last region" condition, so it comes once in any later region.',
    'The short script has no small scenes for the Larvitar; none are built.',
  ],
  AQ19: [
    'Its moves coming back one at a time in the fight (weak, then stronger, Leaf Blade by the fourth) are told in the text; the Sceptile fights beside you as a temporary ally with its ordinary moves.',
    'The doc\'s "a wild Pokémon" out of the long grass is two (a Pinsir and a Heracross): a temporary ally can only fight in a double battle.',
    '"Each takes a turn of the player\'s lead standing in front of it" is built as no switching in that fight: your lead holds the front the whole time.',
    'The Final Reunion table (the Sceptile, the Meganium and the Tropius) is the flag reunion-guest-sceptile and a Chronicle line.',
  ],
  AQ20: [
    'Afterstory "the cracked boulder is on the beach in later runs" is not built (nothing crosses runs).',
    '"It follows the player for a stage to gloat" is one gloating scene two nodes on, then it asks to come on the next stage.',
  ],
  AQ21: [
    'Remembers "a Pokémon with Unwavering (Part 8 event 21)" reads flag unwavering-joined, which the greenneedle thread must set when a Pokémon with Unwavering joins; the game cannot yet look for the trait itself.',
    'The "Ice Beam wins it" battle has the Snorunt fight beside you as a temporary ally in a double battle against a black belt.',
    'The short script has no small scenes or turning point; none are built.',
  ],
  AQ22: [
    'The honest trade uses the game\'s swap-in-place trade, not the Honest Trade Card (not in the engine yet): you pick the Pokémon you give, and the Aipom arrives at its level with its held item. Against a strong Pokémon it may come as an Ambipom.',
    'The contest is a no-knock-out contest fight (win after three different moves) with the Aipom beside you as a temporary ally.',
    'The honest trade is offered after the contest; on "Suggest a trade" the two trainers make the honest trade with each other instead.',
    'The short script has no small scenes or turning point; none are built.',
  ],
  AQ23: [
    'Controlled Blaze (its Blaze at 50% HP instead of 33%) is a run relic: your Pokémon below half HP deal 25% more damage. The game cannot change one Pokémon\'s Blaze threshold, so it is not limited to the Infernape.',
    'Paul has no sprite in the game: he is drawn as an Ace Trainer, with his own name on the fight.',
    'The finale is one on one against his Electivire; your first Fire-type leads, which is the Infernape unless another Fire-type stands ahead of it in the party.',
    '"If Calm it each time": the doc has its Blaze go out of control once, so there is one Blaze scene.',
  ],
};

/** Each questline, once its doc section has been re-read line by line against the events. */
export const CHECKED: Record<string, string> = { AQ18: '2026-11-15', AQ19: '2026-11-15', AQ20: '2026-11-15', AQ21: '2026-11-15', AQ22: '2026-11-15', AQ23: '2026-11-15' };

const PEAK = tagTypes('cave', 'high');
const WOOD = tagTypes('forest');
const SEA = tagTypes('water');
const SNOW = tagTypes('snow');

/** AQ23's finale when its Blaze was calmed: the fight with its Blaze under control. */
const CALM_FIGHT = fight('It steps forward, and its body grows round its fire as it walks: an Infernape, crown of flame and all. Its tail flame does not flare. It burns low and steady and waits to be asked.', duel('Paul', { cls: 'ace-trainer', size: 1, team: ['electivire'], rule: { leadType: 'fire' }, win: [flag('aq23-paul-beaten'), room('aq23-controlled')] }, { lose: [flag('aq23-paul-lost'), room('aq23-controlled')] }), evolve('chimchar', 'infernape'), evolve('monferno', 'infernape'), temp('Its Blaze, under control', [{ kind: 'lowHpDamageMultiplier', below: 0.5, value: 1.25 }], 1));

export const EVENTS: Json[] = [
  // ---------------- AQ18. Carried Home ----------------
  ev('aq18-carried-home', 'Carried Home', AQ, { rarity: 'rare', minStage: stageOf('A5'), types: PEAK, cast: ['trainer.pr/ranger_m'], pokemon: 'larvitar', tint: '#2a2620', effect: 'rattle' },
    'At the foot of a mountain a Ranger sits on a rock with one boot off and his ankle swelling. In his lap, wrapped in his own jacket, is an egg: green-grey, warm, and rocking a little by itself. Above you the slope is scored and split, boulders thrown about like toys. Down the path, lanterns gather: the poachers who took it, regrouping at the bottom. "The mother\'s been tearing the mountain apart looking for it," the Ranger says. He looks at the egg, not at you. "If it hatches away from her, it\'ll be scared of everything." His ankle is not going up any mountain today.',
    [
      ch('Carry the egg back up.', out('You take the egg in both arms. It is heavier than it looks, and it is warm the way a sleeping animal is warm. The Ranger draws the path in the dirt with a stick: four ridges, the nest at the top. "She\'ll know it by the smell. Whatever hatches goes home to her, not with you. You understand that?" You understand it. You start to climb.', flag('aq-larv-carried'), later('aq18-climb-1', 1))),
      ch('Hatch it here.', out('You sit down beside the Ranger and hold the egg against you, and it does not take long. A crack. A grey head. Two eyes that open, find your face, and stay there. The Larvitar looks at nothing else: not the Ranger, not the lanterns, not the mountain its mother is somewhere on. Only you. "Well," the Ranger says softly. "That\'s you, then. You\'re the first thing it ever saw." It grips your thumb with its whole small body and will not let go.', gain('larvitar', { bond: 30 }), flag('aq-larv-imprinted'), flag('aq18-larv-met'), moment('A Larvitar hatched in your arms at the foot of its mother\'s mountain, and the first face it saw was yours.', 60))),
      ch('Fight the poachers first.', fight('You set the egg in the Ranger\'s lap and go down the path toward the lanterns. They see you coming and stand up slowly, the way people do who have done this before. Behind them, under a tarp that does not quite reach the ground, something enormous is breathing.', duel('The Poachers', { cls: 'roughneck', size: 2, types: ['dark', 'ground'], win: [flag('aq18-poachers-beaten'), room('aq18-the-cage')] }, { lose: [flag('aq18-poachers-fled'), room('aq18-the-cage')] }))),
    ]),
  ev('aq18-the-cage', 'Under the Tarp', AQ, { room: true, cast: ['trainer.pr/ranger_m'], pokemon: 'tyranitar', tint: '#2a2620', effect: 'shake' },
    'The poachers are gone, running down the valley with whatever they could carry, and they did not stop for the tarp. You pull it back. Under it is a cage of welded bars, and in the cage is a Tyranitar, chained at the neck, hoarse from roaring. They caught her last night when she came down the mountain looking for her egg. She sees you and throws herself at the bars so hard the whole cage walks a foot. Then she stops. She can smell the egg on your hands.',
    [
      ch('Open the cage.', out('The bolt is rusted solid. You pull until your arms shake and it gives all at once. The door swings wide. She does not come for you. She stands in the open for one long breath, nose up, and then she is gone up the mountain in a roar of stones, toward the nest, the only place she knows to look.', flag('aq-larv-mother'), room('aq18-egg-again')),
        { prompt: { id: 'pull-hold', needs: 'ok' }, fail: out('The bolt will not give. You brace a foot on the bars and haul, and it tears free with your skin on it. The door swings. She shoulders past you, not unkindly, and your lead takes a knock it did not expect. Then she is gone up the mountain in a roar of stones, toward the nest.', hurtLead(0.2), flag('aq-larv-mother'), room('aq18-egg-again')) }),
    ]),
  ev('aq18-egg-again', 'The Egg in the Ranger\'s Lap', AQ, { room: true, cast: ['trainer.pr/ranger_m'], pokemon: 'larvitar', tint: '#2a2620', effect: 'none' },
    'You come back up the path with your hands still shaking. The Ranger has heard her go. Everyone in the valley heard her go. "She\'s free. She\'ll go to the nest; they always go back to the nest." He holds the egg out to you. It knocks once against his palm, from the inside. "So. Up, or here?"',
    [
      ch('Carry the egg back up.', out('You take it. The Ranger draws the path in the dirt: four ridges, the nest at the top, and a mother waiting there now. "Whatever hatches goes home to her. Not with you." You know. You start to climb.', flag('aq-larv-carried'), later('aq18-climb-1', 1))),
      ch('Hatch it here.', out('You sit with it until it cracks. A grey head, two eyes that open and find your face, and stay there. Far up the mountain its mother roars once, still searching. The Larvitar does not look toward the sound. It looks at you. "That\'s you, then," the Ranger says, very quietly. "You\'re the first thing it ever saw."', gain('larvitar', { bond: 30 }), flag('aq-larv-imprinted'), flag('aq18-larv-met'), moment('A Larvitar hatched in your arms at the foot of its mother\'s mountain, and the first face it saw was yours.', 60))),
    ]),
  // The climb: one scene on each of the next four nodes.
  ev('aq18-climb-1', 'The First Ridge', AQ, { room: true, requires: [flagIs('aq-larv-carried')], pokemon: 'larvitar', tint: '#2a2620', effect: 'none' },
    'The first ridge. The path is loose scree, and every step slides back half a step. The egg is heavier than it was at the bottom; eggs do not get heavier, so it is your arms. The wind comes over the top cold enough to make your eyes run. Inside the shell, something turns over.',
    [
      ch('Keep climbing.', out('You tuck it inside your coat, against your chest, where it is warmest. It knocks twice. You knock back, once, on the shell, and keep going. Three ridges to go.', later('aq18-climb-2', 1))),
    ]),
  ev('aq18-climb-2', 'It Hatches on the Way', AQ, { room: true, requires: [flagIs('aq-larv-carried')], pokemon: 'larvitar', tint: '#2a2620', effect: 'rattle' },
    'Halfway up, it will not wait any longer. The shell cracks inside your coat and you feel it before you see it: a hard little head pushing against your ribs. Out comes a Larvitar, eyes screwed shut. It opens them. The first thing it ever sees is the drop below the path, and the wind, and a stranger. It screams. It is scared of everything, all at once, exactly as the Ranger said.',
    [
      ch('Hold it close.', out('You fold your arms round it and turn your back to the drop so it cannot see. It screams into your coat until it runs out of scream. Then it only shakes, and holds a fold of your sleeve in its mouth, and lets itself be carried.', flag('aq18-held-close'), later('aq18-climb-3', 1))),
      ch('Let it look at the mountain.', out('You hold it up, slowly, so it can see where it is. It goes rigid. It stares at the peaks, the sky, the long fall of stone, every bit of it too big. But it looks. It does not close its eyes again. When you tuck it back in your coat it keeps its head out, watching the path go by.', flag('aq18-saw-mountain'), later('aq18-climb-3', 1))),
    ]),
  ev('aq18-climb-3', 'The Narrow Ledge', AQ, { room: true, requires: [flagIs('aq-larv-carried')], pokemon: 'larvitar', tint: '#2a2620', effect: 'shake' },
    'The third ridge is a ledge with a wall on one side and nothing on the other. A rumble starts somewhere above, and small stones begin to come down, then bigger ones. The Larvitar presses itself flat against you, shaking so hard you can feel its heartbeat through your coat. There is no going back down with it now.',
    [
      ch('Brace and cross.', out('You put your back to the wall and edge across with your arms round it while the stones go past like rain. Not one touches it. On the far side it looks up at you, and for the first time it is not screaming. One ridge left.', later('aq18-the-top', 1)),
        { prompt: { id: 'brace-hold', needs: 'ok' }, fail: out('A stone catches your shoulder, then another. You curl round it and take every one. Your Pokémon scramble across after you, bruised. On the far side the Larvitar looks up at you with its whole face, and for the first time it is not screaming. One ridge left.', hurt(0.15), later('aq18-the-top', 1)) }),
    ]),
  ev('aq18-the-top', 'Carried Home', AQ, { room: true, requires: [flagIs('aq-larv-carried')], cast: ['trainer.pr/ranger_m'], pokemon: 'larvitar', tint: '#2a2620', effect: 'none',
    remembers: [
      { id: 'reunion', when: [flagIs('aq-larv-carried'), flagIs('aq-larv-mother')], notice: 'She knows you. She remembers the hands that opened the cage.', hide: [2] },
      { id: 'empty-nest', when: [notYet('aq-larv-mother')], hide: [0, 1],
        intro: 'The top. The nest is a ring of broken stone, and it is empty. The ground is scraped bare where something huge searched it again and again. The Larvitar, scared of everything, is scared of this too. Behind you the Ranger comes limping up the goat path the long way round, radio in hand. "We raided their camp. They had her caged, the mother. My team\'s bringing her up. It\'ll take days."' },
    ] },
    'The top. The nest is a ring of broken stone, and standing in it is the mother you let out of the cage, battered, chain still hanging from her neck. She has been waiting. She smells it before she sees it, and she makes a sound nobody in the valley has heard her make: low, cracked, nothing like a roar. The Larvitar is scared of her, too. It is scared of everything. It looks at her. It looks up at you, the one who carried it.',
    [
      ch('Leave it with her.', out('You kneel and set it down on the stones. It does not move. Then the mother lowers her great head, very slowly, all the way to the ground, and breathes on it, and it walks to her: one step, and another, and then all at once. She curls round it like a wall. You go back down the mountain alone, and you do not look back more than three times. It was carried home.', flagAt('aq18-larv-home'), flag('aq18-reunion'), fr(3), moment('You carried a Larvitar up a mountain and gave it back to its mother. It was the hardest thing to set down.', 75))),
      ch('Keep it.', out('You kneel to set it down and it will not let go of your sleeve. The mother watches for a long time. Then she lowers her head and breathes on it once, the way you would tuck a blanket round someone, and steps back out of the nest. She is letting it choose. It has chosen. You carry it back down the mountain, and behind you she watches until you are out of sight.', gain('larvitar', { bond: 40 }), flag('aq18-larv-met'), flag('aq18-larv-kept'), moment('A Tyranitar breathed on her child once and let it go down the mountain with you.', 75))),
      ch('Leave it in the nest.', out('You set it down in the hollow its mother made. It cries for you, then for the wind, then for nothing, and curls up small. The Ranger sits down beside the nest with his bad ankle out in front of him. "I\'ll stay till she comes. It won\'t be alone." You go back down with your arms aching from the shape of it. It was carried home, even if home was empty for a while.', flagAt('aq18-larv-home'), fr(2), moment('You carried a Larvitar up a mountain to an empty nest, and a Ranger stayed with it until its mother came.', 70))),
    ]),
  // Not imprinted: a Tyranitar comes once, a region or more later.
  ev('aq18-tyranitar-comes', 'A Tyranitar on the Ridge', AQ, { callback: true, requires: [flagAgo('aq18-larv-home', 1)], types: PEAK, pokemon: 'tyranitar', tint: '#2a2620', effect: 'shake',
    remembers: [
      { id: 'reunion-two', when: [flagIs('aq18-reunion')], notice: 'Behind it on the ridge stands a second Tyranitar, older, with a length of broken chain still round her neck. She stays back. She is letting her child do this.' },
    ] },
    'Far from that mountain, the ground starts to shake on a quiet road. Stones come down off a ridge. On top of it stands a Tyranitar, young and enormous, and it is looking at you. It comes down the ridge in three strides. It stops in front of you and, very carefully for something its size, lowers its head until its nose is level with your coat: the exact place it rode, once, up a mountain.',
    [
      ch('Walk with it a while.', out('It falls in beside you. Nothing on the road will come near you for a long time. When it finally turns back toward the hills, it does it slowly, the way you leave a place you mean to remember.', temp('A Tyranitar walked with you', [{ kind: 'damageTakenMultiplier', value: 0.85 }, { kind: 'damageMultiplier', value: 1.1 }], 3), flag('aq18-tyranitar-walked'), moment('A Tyranitar came down a ridge to find the one who carried it.', 70))),
      ch('Send it home.', out('You put your hand on its nose. It breathes out, warm, smelling of stone. Then it digs one claw into the ridge and leaves something at your feet: a stone from its own mountain, worn smooth. It goes back up the way it came, and the ground shakes less and less and then not at all.', item('hard-stone'), flag('aq18-tyranitar-home'), moment('A Tyranitar came down a ridge to find the one who carried it, and left a stone from home.', 70))),
    ]),

  // ---------------- AQ19. The One Who Lost Its Power for Love ----------------
  ev('aq19-lost-its-power', 'The One Who Lost Its Power for Love', AQ, { rarity: 'uncommon', minStage: stageOf('A4'), types: WOOD, cast: ['boss.npc_gentleman'], pokemon: 'sceptile', tint: '#1e2a18', effect: 'none' },
    'A Sceptile sits under a tree at the edge of a meadow with a twig in its mouth. In the meadow a Meganium is eating flowers, one at a time, in no hurry. The Sceptile has not blinked. An old man in a tweed cap sits beside it: Mr. Torvald Greenhalgh. "It hasn\'t battled in a month. It evolved in the middle of a fight, right in front of her. Big moment. Light everywhere." He sighs. "Then it looked across to see if she\'d noticed. She was looking at a Tropius." He rubs his face. "Nothing since. Not a Leaf Blade. Not a Pound. It lifts its arm and nothing comes. I\'ve had three doctors. One said heartbreak. I paid him." In the meadow, the Meganium walks away. The twig droops.',
    [
      ch('Help it confess.', out('You crouch beside the Sceptile. It looks at you, then at the meadow, then at you. {lead} sits down on its other side without being asked. Nobody says anything for a while. Then the Sceptile gets up, slowly, the way you get up when you have decided something and do not want to give yourself time to undecide it. Mr. Greenhalgh takes off his cap and holds it in both hands.', fr(5, 'lead'), flag('aq19-confess'), room('aq19-the-walk'))),
      ch('Help it battle.', fight('No confession. You lead it to the long grass, where there is always something looking for a fight, and something is. {lead} steps out in front of the Sceptile and stays there. Its moves come back one at a time, and each one takes a turn of {lead} standing in front of it, holding the line, so it can try again.', duel('Wild Pinsir', { size: 2, lv: 1, ally: 'sceptile', rule: { noSwitch: true }, win: [flag('aq19-battled'), fr(5, 'lead'), room('aq19-still-looks')] }, { lineup: ['pinsir', 'heracross'], spritePokemon: 'pinsir', lose: [flag('aq19-battled'), flag('aq19-battle-lost'), room('aq19-still-looks')] }))),
      ch('Let it be.', out('You sit down on the grass beside it and say nothing at all. After a long time Mr. Greenhalgh puts his cap back on. "...Aye. Maybe. Maybe that\'s the doctor it wants." Nothing happens. The Sceptile watches the empty meadow. You leave it watching. If you come this way again in the region, you might see how that turned out.', flagAt('aq19-let-be'))),
    ]),
  ev('aq19-the-walk', 'The Longest Walk in the Region', AQ, { room: true, cast: ['boss.npc_gentleman'], pokemon: 'meganium', tint: '#1e2a18', effect: 'none' },
    '{lead} walks beside it, for moral support. They cross the meadow together, and it is the longest walk in the region. The Sceptile holds out a flower. It picked it very carefully: you watched it reject eleven. The Meganium looks at the flower. She looks at the Sceptile. She is kind about it. She touches its arm with a vine, gently, and then she goes back to the Tropius. The Sceptile stands there. Then it comes back, and sits, and takes the twig out of its mouth, and looks at it. "Oh, no," Mr. Greenhalgh says. "Oh, you poor old thing." And at exactly the wrong moment, something comes crashing out of the long grass.',
    [
      ch('Stand with it.', fight('The Sceptile is on its feet before it knows it. It lifts its arm. Something comes: a Pound, weak as a slap. Next turn, something more. By the fourth it is Leaf Blade, and it is furious, and it is glorious.', duel('Wild Pinsir', { size: 2, lv: 1, ally: 'sceptile', win: [flag('aq19-moves-back'), room('aq19-twig-back')] }, { lineup: ['pinsir', 'heracross'], spritePokemon: 'pinsir', lose: [flag('aq19-moves-back'), flag('aq19-walk-lost'), room('aq19-twig-back')] }))),
    ]),
  ev('aq19-twig-back', 'The Twig Goes Back In', AQ, { room: true, cast: ['boss.npc_gentleman'], pokemon: 'sceptile', tint: '#1e2a18', effect: 'sparkle' },
    'After. The long grass is still. The Sceptile is breathing hard. It looks at the meadow, where the Meganium and the Tropius are eating flowers side by side. It looks at its own arms, which work again, all of them, every move it ever had. Then it puts the twig back in. Mr. Greenhalgh blows his nose very loudly. "Right. Right. I owe you." He whistles, and a Treecko drops out of the tree. "Its nephew. Sensible lad. No interest in flowers."',
    [
      ch('Take the Treecko.', out('The Treecko looks at you, looks at its uncle, and climbs up your arm to sit on your shoulder as if it had read the paperwork. The Sceptile lifts one hand to it as you go: a small wave, with all its power in it.', gain('treecko'), flag('aq19-treecko-met'), flag('reunion-guest-sceptile'), moment('A Sceptile walked across a meadow with a flower, was told no kindly, and got every move back in one fight.', 70))),
      ch('Leave the lad with his uncle.', out('"Suit yourself. He\'ll keep." The Treecko climbs back up the tree. Below it the Sceptile sits with its twig, and every few minutes it lifts an arm and lets a Leaf Blade hum in the air, just to be sure.', fr(3), flag('reunion-guest-sceptile'), moment('A Sceptile walked across a meadow with a flower, was told no kindly, and got every move back in one fight.', 70))),
    ]),
  ev('aq19-still-looks', 'It Hasn\'t Said It', AQ, { room: true, cast: ['boss.npc_gentleman'], pokemon: 'sceptile', tint: '#1e2a18', effect: 'none' },
    'It gets them all back: Pound, then Quick Attack, then Bullet Seed, then Leaf Blade, one at a time behind {lead}. After, it still looks at the meadow. It hasn\'t said it, and it knows it hasn\'t. Mr. Greenhalgh claps you on the back anyway. "Moves first. The rest can wait." He whistles, and a Treecko drops out of the tree. "Its nephew. Sensible lad. No interest in flowers."',
    [
      ch('Take the Treecko.', out('The Treecko climbs up your arm to your shoulder as if it had been told to. Behind you, the Sceptile is still looking at the meadow. But it is standing up to do it.', gain('treecko'), flag('aq19-treecko-met'), flag('reunion-guest-sceptile'), moment('A Sceptile got its moves back one at a time, with your lead standing in front of it.', 65))),
      ch('Leave the lad with his uncle.', out('"Suit yourself. He\'ll keep." The Treecko climbs back up the tree, and the Sceptile goes on looking at the meadow, standing up.', fr(3), flag('reunion-guest-sceptile'), moment('A Sceptile got its moves back one at a time, with your lead standing in front of it.', 65))),
    ]),
  ev('aq19-sapling', 'Sparring With a Sapling', AQ, { callback: true, requires: [flagIs('aq19-let-be'), age('aq19-let-be', 1), flagThisRegion('aq19-let-be')], types: WOOD, cast: ['boss.npc_gentleman'], pokemon: 'sceptile', tint: '#1e2a18', effect: 'none' },
    'The same meadow, a stage later. The Sceptile is not under the tree. It is in the middle of the grass, sparring with a sapling about its own height. It swings. The sapling shakes. Pound is back. Mr. Greenhalgh is sitting where it used to sit, eating a sandwich. "Didn\'t do a thing. It just got up one morning." He whistles, and a Treecko drops out of the tree. "Its nephew. Sensible lad. No interest in flowers."',
    [
      ch('Take the Treecko.', out('The Treecko climbs up your arm to your shoulder. Out in the meadow, the sapling takes another Pound, and the Sceptile, very nearly, looks pleased with itself.', gain('treecko'), flag('aq19-treecko-met'), flag('reunion-guest-sceptile'), moment('A Sceptile nobody pushed got up one morning and started sparring with a sapling.', 60))),
      ch('Leave the lad with his uncle.', out('"Suit yourself." You sit with Mr. Greenhalgh and watch the sparring for a while. He shares the sandwich. It is a good sandwich.', heal(0.25), flag('reunion-guest-sceptile'), moment('A Sceptile nobody pushed got up one morning and started sparring with a sapling.', 60))),
    ]),
  // The Treecko's own small scenes: one each time its Bond rises a step, while it is in the party.
  ev('aq19-treecko-twig', 'A Twig of Its Own', AQ, { callback: true, requires: [flagIs('aq19-treecko-met'), line('treecko', 1), age('aq19-treecko-met', 1)], pokemon: 'treecko', tint: '#1e2a18', effect: 'none' },
    'At a rest, the Treecko finds a twig. It turns it over. It puts it in its mouth, the way its uncle does, and sits very still, facing nothing in particular. Then it looks sideways at you, to see if it is doing it right.',
    [
      ch('Nod, seriously.', out('You nod, as seriously as you have ever nodded. It nods back and keeps the twig in for the whole of the next road, chewing the end flat.', bondLine('treecko', 5), flag('aq19-scene-1'))),
      ch('Find a twig of your own.', out('You pick a grass stalk and put it in your mouth and sit beside it, facing the same nothing. It looks at you for a long time. Then it shuffles closer, until your arms touch.', bondLine('treecko', 5), flag('aq19-scene-1'))),
    ]),
  ev('aq19-treecko-rock', 'Behind a Rock', AQ, { callback: true, requires: [seen('aq19-treecko-twig'), line('treecko', 2)], pokemon: 'treecko', tint: '#1e2a18', effect: 'glint' },
    'It is glowing. Faintly, at the edges, the way its uncle glowed in front of a Meganium once. The Treecko notices, looks round at everyone looking at it, and walks very fast behind the nearest rock. It will not evolve in front of anybody. Nobody in your family is going to make that mistake twice.',
    [
      ch('Turn your back.', out('You turn round and make the whole party turn round too. There is a light behind you, quite a big one, and then a long silence. When you look, a Grovyle is standing by the rock, pretending it has been there all along.', evolve('treecko', 'grovyle'), bondLine('treecko', 5), flag('aq19-scene-2'))),
      ch('Keep everyone away from the rock.', out('You stand guard with your arms folded while the light comes and goes. Your own Pokémon sit in a row and look carefully at the sky. A Grovyle steps out, checks that nobody saw, and stands beside you as if it has always been this tall.', evolve('treecko', 'grovyle'), bondLine('treecko', 5), fr(1), flag('aq19-scene-2'))),
    ]),
  ev('aq19-grovyle-leaf', 'The Something Takes the Leaf', AQ, { callback: true, requires: [seen('aq19-treecko-rock'), line('treecko', 3), hasMon('grovyle')], pokemon: 'chikorita', tint: '#1e2a18', effect: 'hearts' },
    'At a camp, a wild Chikorita wanders in to sit by the fire. The Grovyle sees it and goes completely still. Then it gets up, picks a leaf, a very good leaf, and walks across the camp and holds it out. The Chikorita takes the leaf. Nobody, least of all the Grovyle, had planned for this part.',
    [
      ch('Look away politely.', out('You look at the fire. Everyone looks at the fire. Out of the corner of your eye the two of them sit side by side, the Chikorita holding the leaf, the Grovyle holding nothing at all and not knowing what to do with its hands. In the morning the Chikorita is gone. The Grovyle has its twig back in, and it is chewing it in a new way.', bondLine('treecko', 5), flag('aq19-scene-3'), moment('Your Grovyle offered a Chikorita a leaf, and she took it, and nobody knew what to do next.', 60))),
      ch('Hand it another leaf.', out('You pass it another leaf, in case. It looks at the leaf, at you, at the Chikorita, and gives her that one too. She takes it. It comes back and sits down hard beside you, stunned, and leans on your shoulder for the rest of the night.', bondLine('treecko', 5), fr(2), flag('aq19-scene-3'), moment('Your Grovyle offered a Chikorita a leaf, and she took it, and nobody knew what to do next.', 60))),
    ]),

  // ---------------- AQ20. The Proud Crab ----------------
  ev('aq20-proud-crab', 'The Proud Crab', AQ, { rarity: 'common', minStage: stageOf('A2'), types: SEA, cast: ['trainer.fisherman'], pokemon: 'corphish', tint: '#1c2a3c', effect: 'none' },
    'On a beach, a Corphish is challenging a boulder. It has been losing to the boulder since sunrise. The boulder has not moved. A fisherman sitting on an upturned bucket nods at it without taking his eyes off his line. "It thinks the rock insulted it." The Corphish backs up, raises both claws, charges, snaps at the boulder with everything it has, bounces off, and lands on its back. Its legs wave. It rights itself with enormous dignity. Then it turns and looks straight at you, as if daring you to laugh.',
    [
      ch('Laugh.', fight('It is a very small laugh. It is enough. The Corphish goes still. It turns its back on the boulder, which can wait, and squares up to you. It clacks both claws, once, like a glove across the face. It takes this very seriously. "Oh, now you\'ve done it," the fisherman says.', monDuel('The Proud Corphish', 'corphish', 0, { win: [flag('aq-corphish-laughed'), flag('aq20-crab-beaten'), room('aq20-crab-bows')], lose: [flag('aq-corphish-laughed'), flag('aq20-crab-won'), later('aq20-crab-gloats', 2)] }))),
      ch('Help it train.', out('You kneel down at its level and tap the boulder. You tap your own arm. You point at the Corphish. It squints at you for a long time, deciding whether this is an insult. It decides it is not. It clacks once, and takes up a stance. "Training," the fisherman says. "Now I\'ve seen everything."', flag('aq20-training'), room('aq20-drill-footwork'))),
      ch('Move the boulder.', out('{lead} puts its shoulder to the boulder and heaves, and it rolls, slow and grinding, down into the surf. The beach is clear. The Corphish stares at the empty sand. It stares at {lead}. It is not grateful. It is furious: someone else has beaten its boulder, and now it never can. It snaps at your boot, turns its back, and stalks into the sea with its claws held high. "Wouldn\'t have done that," says the fisherman.', flag('aq20-boulder-moved'))),
    ]),
  ev('aq20-crab-bows', 'Beaten Fair', AQ, { room: true, cast: ['trainer.fisherman'], pokemon: 'corphish', tint: '#1c2a3c', effect: 'none' },
    'The Corphish lies on its back on the sand for a while, legs folded, looking at the sky. Then it rights itself. It walks up to you, lowers both claws all the way to the ground, and holds them there: the deepest bow a crab can make. Then it walks back to its boulder and starts again from the beginning.',
    [
      ch('Bow back.', out('You bow, all the way down. It holds its bow a moment longer than you, so that it can say it won that part. The fisherman laughs into his collar. "It\'ll be at that rock till the tide comes. Rock\'s got no chance."', fr(2))),
    ]),
  // Three drills; on the third, it cracks the boulder with Crabhammer.
  ev('aq20-drill-footwork', 'Drill One: Footwork', AQ, { room: true, pokemon: 'corphish', tint: '#1c2a3c', effect: 'none' },
    'Drill one. Every charge it has made since sunrise has gone in a straight line and ended on its back. You draw a zigzag in the wet sand. It looks at the zigzag with deep suspicion. Then it gets on the line, sideways, the way crabs were meant to go.',
    [
      ch('Call the steps.', out('Left, left, right, in. It follows your voice down the zigzag and arrives at the boulder from the side, upright, claws ready. It looks back at you, surprised at itself.', fr(2), room('aq20-drill-brace')),
        { prompt: { id: 'dodge-tap', needs: 'ok' }, fail: out('You call one step late and it trips over its own leg, rolls, and lands on its back again. It rights itself, glares at the zigzag as if the zigzag did it, and goes back to the start. The second time it gets there upright.', room('aq20-drill-brace')) }),
    ]),
  ev('aq20-drill-brace', 'Drill Two: Brace', AQ, { room: true, pokemon: 'corphish', tint: '#1c2a3c', effect: 'none' },
    'Drill two. It bounces off the boulder because it hits it and lets go. You plant your feet in the sand and show it: weight low, everything behind the hit, nothing given back. The Corphish digs all six legs into the sand. It looks like a very small, very angry table.',
    [
      ch('Hold the stance with it.', out('You hold the stance together until your legs burn. It does not move once. When the next wave comes in round its legs, it does not even notice. The boulder, you feel, should be starting to worry.', fr(2), room('aq20-drill-crabhammer')),
        { prompt: { id: 'brace-hold', needs: 'ok' }, fail: out('Your foot slips in the wet sand and you sit down hard. The Corphish does not slip. It looks at you, sitting in the surf, for a long and unforgivable moment. Then it goes back to its stance, and you get up and join it.', room('aq20-drill-crabhammer')) }),
    ]),
  ev('aq20-drill-crabhammer', 'Drill Three: The Boulder', AQ, { room: true, cast: ['trainer.fisherman'], pokemon: 'corphish', tint: '#1c2a3c', effect: 'shake' },
    'Drill three. The boulder. The Corphish walks up to it sideways, along the zigzag, and sets its legs. It raises one claw, higher than it has ever raised it. The claw starts to glow. The fisherman puts his rod down.',
    [
      ch('Count it in.', out('"One. Two." On three, the claw comes down like a hammer: Crabhammer, the real thing. There is a crack like a door slamming. A line runs across the boulder, and then another, and a piece the size of your head falls off into the sand. The Corphish stands in front of what it did, breathing hard. Then it turns round, climbs into your bag without asking, and closes the flap. "Reckon that\'s yours now," says the fisherman.', gain('corphish', { moves: ['crabhammer'], bond: 20 }), flag('aq-corphish-trained'), moment('A Corphish cracked the boulder that had beaten it since sunrise, and climbed into your bag.', 60))),
    ]),
  // Laughed, and lost: it follows you for a stage to gloat, then asks to come.
  ev('aq20-crab-gloats', 'It Is Still Gloating', AQ, { room: true, requires: [flagIs('aq20-crab-won')], pokemon: 'corphish', tint: '#1c2a3c', effect: 'none' },
    'Two stops on from the beach there is a Corphish sitting on a rock beside the path. It is the Corphish. It has been waiting. As you pass, it acts out the whole battle again, both sides, with sound effects, and the ending is very clear about who won.',
    [
      ch('Applaud.', out('You clap. It bows to each side of an invisible crowd and follows you to the next stop, still clacking the highlights.', flag('aq20-applauded'))),
      ch('Walk on.', out('You walk on. It follows you anyway, a few steps behind, clacking quietly to itself about how you laughed, and how that went for you.')),
    ]),
  ev('aq20-crab-asks', 'The Corphish Asks', AQ, { callback: true, requires: [flagIs('aq20-crab-won'), age('aq20-crab-won', 1)], pokemon: 'corphish', tint: '#1c2a3c', effect: 'none',
    remembers: [{ id: 'applauded', when: [flagIs('aq20-applauded')], notice: 'It has not forgotten that you applauded. It brought its own rock to stand on.' }] },
    'It has followed you for a whole stage, gloating the whole way. Tonight it walks into your camp and sits down in front of you. It does not gloat. It lowers its claws. It looks at your Poké Balls, then at you, then at the Poké Balls again. It is asking. It would rather not have to say so.',
    [
      ch('Take it with you.', out('You hold out a Ball. It taps the button with one claw, very precisely, the way you would sign something important. Whoever it is going to fight next, it will be fighting them with you.', gain('corphish', { bond: 20 }), moment('A Corphish you laughed at beat you fair, gloated for a whole stage, and then asked to come.', 60))),
      ch('Send it back to its boulder.', out('You point back the way you came. It looks, for one second, hurt. Then it remembers it has a boulder to beat, clacks once in farewell, and goes.', fr(1))),
    ]),

  // ---------------- AQ21. The Ice That Wouldn't Break ----------------
  ev('aq21-ice-wouldnt-break', 'The Ice That Wouldn\'t Break', AQ, { rarity: 'uncommon', minStage: stageOf('A4'), types: SNOW, cast: ['trainer.pr/snow_ace_trainer_m'], pokemon: 'snorunt', tint: '#1c2836', effect: 'snow',
    remembers: [
      { id: 'unwavering', when: [flagIs('unwavering-joined')], notice: 'The Snorunt sees your Pokémon with Unwavering: one that never evolved, and never needed to. It looks for a long time. Then it plants its feet. It has decided to stay as it is.', hide: [2],
        addChoices: [ch('Let it stay as it is.', out('You crouch beside it, and so does your Pokémon with Unwavering. The Snorunt looks from one of you to the other and stands a little straighter, exactly the size it is. "Stay small, then," its trainer says, and he is smiling. "Stay you. Go with them." It hops to your side and does not look back at what it might have been.', gain('snorunt', { moves: ['ice-beam'], bond: 20 }), flag('aq21-snorunt-met'), flag('aq21-stays'), moment('A Snorunt saw a Pokémon that never evolved, and decided to stay exactly as it was.', 60)))] },
    ] },
    'A trainer in a thick coat is sparring in the snow behind a lodge. His Snorunt lowers its head, digs in, and charges: a Headbutt, clear as day. Halfway there its mouth opens and an Ice Beam comes out instead, and the target post freezes solid. The Snorunt stops. It looks at the frozen post as if it had betrayed it. "It wants to be a fighter," the trainer says, very tired. "It\'s an ice-thrower. It won\'t accept it." He has the look of someone who has watched this a hundred times. The Snorunt stares at its own feet.',
    [
      ch('Teach it Headbutt.', out('You get down in the snow beside it and tap your own forehead. It looks up. For the first time today, somebody is on its side. It lowers its head and copies you. "Go on, then," its trainer says. "Three goes. I\'ll make tea."', flag('aq21-headbutt'), room('aq21-drill-head'))),
      ch('Teach it to love Ice Beam.', fight('You do not teach it anything about heads. You find it a real opponent instead: a black belt from the lodge who has been laughing at the frozen posts all morning. "Go on," you tell it. "Do the thing you hate." It looks at you as if you have lost your mind.', duel('Black Belt Torsten', { cls: 'black-belt', size: 2, types: ['fighting'], ally: 'snorunt', win: [flag('aq-snorunt-ice'), room('aq21-proud')] }, { lose: [flag('aq21-ice-lost'), room('aq21-proud')] }))),
      ch('Let it evolve.', out('Its trainer looks at you, then at the Snorunt. "If it can\'t be a fighter, let it be bigger, then." The Snorunt has been ready for weeks, holding it in out of stubbornness. It lets go. It glows, and grows, and the glow hardens into a great round face of ice: a Glalie. It tries a Headbutt. Its mouth opens. The Ice Beam that comes out freezes the post, the fence, the woodpile and a good part of the lodge roof. The Glalie looks at all of it, pleased and very confused. "Well," says the trainer. "It\'s yours if you want it. I can\'t afford the roof."', gain('glalie', { moves: ['ice-beam'], bond: 10 }), flag('aq-snorunt-evolved'), flag('aq21-snorunt-met'), moment('A Snorunt that wanted to be a fighter became a Glalie, and froze half a lodge, and was delighted.', 60))),
    ]),
  // Three drills; it learns Headbutt and uses Ice Beam in battle anyway, out of habit.
  ev('aq21-drill-head', 'Drill One: Head Down', AQ, { room: true, pokemon: 'snorunt', tint: '#1c2836', effect: 'snow' },
    'Drill one. Head down, eyes up. The Snorunt has been charging with its eyes shut, and its mouth open, which is where the Ice Beam comes from. You show it: chin tucked, mouth closed, look at what you mean to hit.',
    [
      ch('Run it at a snowbank.', out('It charges the snowbank with its mouth clamped shut and its eyes open. It goes in head first and comes out the other side, covered in snow, with no ice anywhere. It looks back at the hole it made as if it were a medal.', room('aq21-drill-post')),
        { prompt: { id: 'dodge-tap', needs: 'ok' }, fail: out('It opens its mouth on the last step, out of habit, and the snowbank freezes into a wall. It bounces off. It sits in the snow for a while with its eyes shut. Then it gets up and tries again, mouth closed, and goes through.', room('aq21-drill-post')) }),
    ]),
  ev('aq21-drill-post', 'Drill Two: The Post', AQ, { room: true, pokemon: 'snorunt', tint: '#1c2836', effect: 'snow' },
    'Drill two. The target post, the same one it has frozen a hundred times. You stand behind it and hold it steady. The Snorunt lowers its head. Its trainer comes out of the lodge with two mugs and stops in the doorway to watch.',
    [
      ch('Hold the post.', out('It hits the post. A real Headbutt, with a sound like a door knocker. The post rocks, and you rock with it, and nothing freezes. The Snorunt stares at the post. Then it stares at its trainer, who has spilled one of the teas.', room('aq21-drill-spar')),
        { prompt: { id: 'brace-hold', needs: 'ok' }, fail: out('It hits the post and the post hits you. You sit down in the snow. Nothing froze, though. The Snorunt runs round the post to check you are all right, then runs back round to look at the place it hit, very proud.', hurt(0.05), room('aq21-drill-spar')) }),
    ]),
  ev('aq21-drill-spar', 'Drill Three: A Real Spar', AQ, { room: true, cast: ['trainer.pr/snow_ace_trainer_m'], pokemon: 'snorunt', tint: '#1c2836', effect: 'snow' },
    'Drill three: a practice spar against its trainer\'s other Pokémon. The Snorunt knows Headbutt now; it has hit a post and a snowbank and very nearly you. It lowers its head. It charges. And at the last moment, out of pure habit, its mouth opens.',
    [
      ch('Let it finish the spar.', out('Ice Beam. Of course. The spar is over in one move, and its trainer\'s other Pokémon is a statue. The Snorunt looks at the statue, then at you, appalled. Its trainer laughs until he has to sit down. "It knows Headbutt now. It just doesn\'t need it." He wipes his eyes. "Take it with you. It listens to you. Maybe one day it\'ll even use it."', gain('snorunt', { moves: ['headbutt', 'ice-beam'], bond: 15 }), flag('aq21-snorunt-met'), moment('A Snorunt learned Headbutt from you, and then used Ice Beam anyway.', 55))),
    ]),
  ev('aq21-proud', 'Proud', AQ, { room: true, cast: ['trainer.pr/snow_ace_trainer_m'], pokemon: 'snorunt', tint: '#1c2836', effect: 'sparkle',
    remembers: [{ id: 'ice-lost', when: [flagIs('aq21-ice-lost')], notice: 'You lost the fight. It does not seem to have noticed. The last thing it did was freeze the black belt\'s last Pokémon to the knees, and that is all it can think about.' }] },
    'The Snorunt is standing in the middle of the yard. Every move it made was an Ice Beam, because that is what it has, and every one of them landed. The black belt is chipping his Pokémon out of the ice with a spoon. The Snorunt is not staring at its feet. It is looking at what it did, and then at its trainer, and it is proud.',
    [
      ch('Tell it it was brilliant.', out('You tell it. Its trainer tells it too, kneeling in the snow. "That\'s you. That\'s what you are." Then he looks up at you. "It\'ll never forgive me if it doesn\'t see more of the world than this yard. Take it." The Snorunt hops to your side and fires a small, perfect Ice Beam at the sky, just for the joy of it.', gain('snorunt', { moves: ['ice-beam'], bond: 25 }), flag('aq21-snorunt-met'), moment('A Snorunt stopped wishing it were a fighter and found out it was brilliant.', 65))),
      ch('Let it stay with its trainer.', out('You put its trainer\'s hand on its head. "It was always good," you tell him. "It just needed to see it." He nods, and the Snorunt leans into his glove. It fires a small Ice Beam at the sky as you go, and the flakes come down glittering behind you.', fr(3), moment('A Snorunt stopped wishing it were a fighter and found out it was brilliant.', 60))),
    ]),

  // ---------------- AQ22. The Aipom Who Wanted Contests ----------------
  ev('aq22-aipom-contests', 'The Aipom Who Wanted Contests', AQ, { rarity: 'uncommon', minStage: stageOf('A3'), types: WOOD, cast: ['trainer.pr/ace_trainer_m', 'trainer.fairy_tale_girl'], pokemon: 'aipom', tint: '#2a1c30', effect: 'none' },
    'Outside a Contest Hall in a forest town, a trainer is trying to coax an Aipom down from the roof. It has been up there all afternoon, hanging by its tail from the gutter, watching the contest through a skylight. Every time the crowd claps, its tail claps too. "It loves contests," the trainer says, and he sounds like he has lost an argument. "I\'m a battler. I don\'t know what to do." On the steps, a coordinator in a sequinned jacket is holding a Buizel by the scruff. It is soaking wet and trying to get back to a battle across the street. She sighs. "I have the opposite problem."',
    [
      ch('Suggest a trade.', out('They look at you. They look at each other. They look at the Aipom on the roof and the Buizel in her arms, who has gone very still, listening. "That\'s..." the battler says. "That\'s not stupid." They swap Balls on the steps of the Contest Hall like two people swapping coats that never fit. The Buizel is across the street and into the battle before anyone can stop it, and it wins. The Aipom swings down off the gutter onto the coordinator\'s shoulder and strikes a pose. Both trainers turn to you at the same moment. Neither of them knows what to say. Both of them are grinning.', flag('aq22-swapped'), fr(3), moment('You talked two trainers into swapping, and an Aipom got its contests and a Buizel got its battles.', 60))),
      ch('Enter the Aipom in a contest.', fight('You whistle the Aipom down from the roof and walk it in through the front door. The battler follows, holding his hat. The judges look up. The Aipom looks at the stage, at the lights, at the crowd, and its tail goes completely still, the way your breath does before something you have wanted for a very long time.', duel('Contest Judges', { cls: 'psychic', size: 2, ally: 'aipom', rule: { contest: 3 }, win: [flag('aq22-ribbon'), room('aq22-ribbon')] }, { lose: [flag('aq22-no-ribbon'), room('aq22-ribbon')] }))),
      ch('Keep them as they are.', out('"Give it time," you say. "They\'ll settle." The battler nods slowly. The coordinator nods slowly. Neither of them believes it. The Aipom stays on the roof, and the Buizel stays wet, and as you leave you can hear the crowd clapping inside and one small tail on the gutter clapping along. Both of them are a bit unhappy. Maybe it will pass.', flag('aq22-kept'))),
    ]),
  ev('aq22-ribbon', 'A Ribbon', AQ, { room: true, cast: ['trainer.pr/ace_trainer_m'], pokemon: 'aipom', tint: '#2a1c30', effect: 'confetti',
    remembers: [{ id: 'no-ribbon', when: [flagIs('aq22-no-ribbon')], intro: 'No ribbon this time. The Aipom comes off the stage anyway as if it had won the whole world, tail held high, still bowing to people who stopped clapping a minute ago. Its trainer is crying. He did not know it could look like that. "I\'ve never seen it that happy," he says. "Not once. Not in a hundred battles." He looks at the Aipom, and then at you, and then at the Poké Balls on your belt.' }] },
    'It wins a ribbon. A real one, red and gold, pinned to its ear by a judge who is laughing. The Aipom does not know what to do with its hands, so it does everything with its tail: bows, waves, catches the ribbon, holds it up to the lights. Its trainer is crying in the front row and not hiding it at all. "I\'ve never seen it that happy," he says. "Not once. Not in a hundred battles." He looks at the Aipom, and then at you, and then at the Poké Balls on your belt.',
    [
      ch('Trade a battler for the Aipom.', out('"It should be with someone who\'ll take it to contests," he says. "And I could use someone who wants to fight." You both say exactly what you are giving and getting before anyone touches a Ball. Then you swap. Your Pokémon squares up beside him as if it has found the trainer it was always meant for. The Aipom climbs onto your shoulder, ribbon first. Two Pokémon, both happy: an honest trade.', { kind: 'tradeFor', want: { label: 'a Pokémon to trade' }, similar: { pool: ['aipom', 'ambipom'], bst: 200 } }, flag('aq22-traded'), moment('You traded a battler for an Aipom that wanted contests, and both of them were happy.', 65))),
      ch('Let him keep it.', out('"Then I\'ll learn," he says, wiping his face with his sleeve. "Contests. How hard can it be?" The Aipom puts its ribbon on his head. You leave them in the lobby reading the entry rules together, his finger on the page and its tail on his shoulder.', fr(2), flag('aq22-he-learns'))),
    ]),

  // ---------------- AQ23. The Abandoned Chimchar ----------------
  ev('aq23-abandoned-chimchar', 'The Abandoned Chimchar', AQ, { rarity: 'rare', minStage: stageOf('A3'), cast: ['trainer.pr/ace_trainer_m'], pokemon: 'chimchar', tint: '#2a1a14', effect: 'none' },
    'At the side of a road, a boy in a purple jacket is standing over a Chimchar. It is scraped and tired from a battle it lost. The flame on its tail is very small. The boy is Paul, and he does not raise his voice. "It\'s useless. Its Blaze only comes out when it\'s losing." He looks at the Ball in his hand. "I want it when I want it." He throws the Ball on the ground. It bounces once. He walks off without looking back. The Chimchar sits there, in the dust, looking at the Ball that used to be its home.',
    [
      ch('Take it.', out('You crouch down and hold out your hand. It flinches. Then it takes a finger, very carefully, and you feel how hot its palm is. When you pick up its old Ball, a spark jumps from its tail and it leaps away from its own flame as if something had bitten it. It is terrified of its own Blaze. You tell it that is all right. You will both have to learn what it is.', gain('chimchar', { bond: 15 }), flag('aq-chimchar-taken'), flag('aq23-chimchar-met'))),
      ch('Go after him.', out('You catch him up on the road. He stops and looks at you as if you were weather. You tell him a Blaze that only comes when it is losing is a Blaze that never gives up. He hears it. He does not agree. "Then you take it." He means it, every word, and he walks on. When you go back, the Chimchar is still sitting by its Ball. You pick them both up. It is terrified of its own Blaze, and it has watched you argue for it.', gain('chimchar', { bond: 20 }), flag('aq-chimchar-taken'), flag('aq-paul-met'), flag('aq23-chimchar-met'))),
      ch('Leave it.', out('You walk on. It is not your Chimchar. Behind you, after a while, you hear a small girl\'s voice, very excited, and a Ball clicking open. You do not look back. Someone else has taken it.', flag('aq23-left'))),
    ]),
  // Through the region: its Blaze comes out of control once.
  ev('aq23-blaze', 'The Field on Fire', AQ, { callback: true, requires: [flagIs('aq-chimchar-taken'), age('aq-chimchar-taken', 1), line('chimchar')], pokemon: 'chimchar', tint: '#3a1a0c', effect: 'fire' },
    'A hard fight, and the Pokémon Paul threw away by the roadside is losing it. Then it is not. Its Blaze comes out all at once, the way it never would for Paul, and it does not stop when the fight does. The flame runs off its tail and into the dry grass, and the whole field goes up. In the middle of it your Pokémon is screaming at its own fire, terrified, and the fire is only getting bigger.',
    [
      ch('Calm it.', out('You walk into the field. It is hot enough to take your breath. You kneel in front of it and put both hands round its face, and you breathe, slowly, until it breathes with you. The fire on its tail shrinks to a flame, then to a candle. The field smoulders out around the two of you. It looks at its tail, and at you, and for the first time it does not look afraid of either.', hurt(0.1), bondLine('chimchar', 10), flag('aq23-blaze-calmed'), moment('Its Blaze burned a field, and you walked in and calmed it.', 65))),
      ch('Let it burn out.', out('You pull your Pokémon back to the road and wait. The fire runs until it has nothing left to eat, and then it runs out of itself. When it is over the field is black, and your Pokémon is lying in the ash, empty, its tail flame no bigger than a match. It is not afraid now. It is too tired to be. It never did learn where the edge was.', bondLine('chimchar', 5), flag('aq23-blaze-burned'), moment('Its Blaze burned a whole field until there was nothing left to burn.', 55))),
    ]),
  // The finale: Paul again, two stages after the meeting.
  ev('aq23-finale', 'Paul Again', AQ, { callback: true, requires: [flagIs('aq-chimchar-taken'), seen('aq23-blaze'), age('aq-chimchar-taken', 2), line('chimchar')], cast: ['trainer.pr/ace_trainer_m'], pokemon: 'electivire', tint: '#2a1a14', effect: 'flicker',
    remembers: [
      { id: 'calmed-met', when: [flagIs('aq23-blaze-calmed'), flagIs('aq-paul-met')], notice: '"You," Paul says. "You argued for it." He looks at it for longer than he needs to. It is not shaking.', hide: [0], addChoices: [ch('Send it out.', CALM_FIGHT)] },
      { id: 'calmed', when: [flagIs('aq23-blaze-calmed')], notice: 'It stands in front of the Electivire with its tail flame low and steady. It is not shaking.', hide: [0], addChoices: [ch('Send it out.', CALM_FIGHT)] },
      { id: 'met', when: [flagIs('aq-paul-met')], notice: '"You," Paul says. "You argued for it." Nothing in his face moves. "Show me."' },
    ] },
    'A gate at the edge of a town, and Paul is leaning on it, the way he leans on everything. Beside him stands an Electivire, huge and crackling, cables twitching. Paul looks at your party. He finds the one he gave away. It is not a Chimchar now: it is an Infernape, or it will be by the end of this. "One on one," he says. "Let\'s see if it still only works when it\'s losing."',
    [
      ch('Send it out.', fight('It steps forward. Its body grows round its fire as it walks, and by the time it reaches the line it is an Infernape, crown of flame and all. The Electivire\'s cables rise. Paul folds his arms.', duel('Paul', { cls: 'ace-trainer', size: 1, team: ['electivire'], rule: { leadType: 'fire' }, win: [flag('aq23-paul-beaten'), room('aq23-after')] }, { lose: [flag('aq23-paul-lost'), room('aq23-after')] }), evolve('chimchar', 'infernape'), evolve('monferno', 'infernape'))),
      ch('Walk past him.', out('You keep walking. Your Pokémon looks back at the Electivire, and at Paul, and then follows you. "Thought so," Paul says to nobody. That is the last you see of him. Whatever he wanted to know about it, he will have to go on not knowing.', flag('aq23-walked-past'))),
    ]),
  ev('aq23-after', 'Only When It\'s Losing', AQ, { room: true, cast: ['trainer.pr/ace_trainer_m'], pokemon: 'infernape', tint: '#2a1a14', effect: 'fire' },
    'The Blaze came, in the end, when it was losing. It came the way it always does, all at once and too much, and it nearly took the gatepost with it. Paul watches it burn down. "Same as ever," he says, without much in it either way. He calls the Electivire back and goes. Your Infernape stands in the scorch marks, breathing hard, still a little afraid of what it is.',
    [
      ch('Stand with it.', out('You stand next to it until its flame settles. It is yours. It always was, from the moment that Ball hit the ground. One day it may learn where the edge of the fire is. Today it leans on you, and that is enough.', bondLine('chimchar', 5), moment('Your Infernape faced the trainer who threw it away.', 65))),
    ]),
  ev('aq23-controlled', 'Paul Nods, Once', AQ, { room: true, cast: ['trainer.pr/ace_trainer_m'], pokemon: 'infernape', tint: '#2a1a14', effect: 'sparkle' },
    'Halfway through the fight its Blaze comes: not at the edge of losing, but at half strength, exactly when it chose. It comes in like a tide, held, aimed, all of it going where it was sent and none of it into the grass. The field does not burn. The Infernape stands in the middle of its own fire, and it is not afraid of it. Across the line, Paul watches it for a long moment. Then he nods, once.',
    [
      ch('Nod back.', out('You nod back. He turns away and goes, his Electivire behind him. Your Infernape lets its fire down slowly, the way you taught it in a burning field, and comes to stand beside you, warm as a hearth.', relic('controlled-blaze', 'Controlled Blaze', [{ kind: 'lowHpDamageMultiplier', below: 0.5, value: 1.25 }]), bondLine('chimchar', 10), flag('aq23-blaze-controlled'), flag('reunion-guest-infernape'), moment('Your Infernape held its Blaze when it chose, and Paul nodded, once.', 80))),
    ]),
  // Left: someone else takes it; it is seen later, happy, small.
  ev('aq23-seen-happy', 'A Small Flame, Happy', AQ, { callback: true, requires: [flagIs('aq23-left'), age('aq23-left', 1)], pokemon: 'chimchar', tint: '#2a1a14', effect: 'none' },
    'In a town square, a little girl is practising with a Chimchar. It is still small. It misses more than it hits. Every time it misses, she cheers anyway, and every time she cheers, its tail flame jumps a little higher. It looks over at you once, the way you look at a face you half remember, and then it goes back to her.',
    [
      ch('Wave and walk on.', out('The girl waves back with both arms. The Chimchar waves too, because she did. It is happy, and it is small, and nobody is waiting for it to be anything else.', fr(1), moment('A Chimchar someone threw away was happy, and small, with somebody else.', 50))),
    ]),
];

export const REMOVE: string[] = [];
