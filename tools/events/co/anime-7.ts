// Anime questlines, module 7: AQ18-AQ23. Follows tools/events/co/anime-0.ts (the worked examples) and _animeKit.ts.
//   AQ18 Carried Home                          (Companion; script: QUESTLINES_ASH.md "AQ18")
//   AQ19 The One Who Lost Its Power for Love   (Companion; script: QUESTLINES_DEEPENED_2.md "AQ19")
//   AQ20 The Proud Crab                        (Single;    script: QUESTLINES_ASH.md "AQ20")
//   AQ21 The Ice That Wouldn't Break           (Companion; script: QUESTLINES_ASH.md "AQ21")
//   AQ22 The Aipom Who Wanted Contests         (Companion, trade; script: QUESTLINES_ASH.md "AQ22")
//   AQ23 The Abandoned Chimchar                (Companion, rival; script: QUESTLINES_ASH.md "AQ23")
// Build: npm run co:build -- anime-7
import { ch, ev, fight, flag, flagAgo, flagAt, flagIs, flagThisRegion, fr, heal, hurt, hurtLead, item, leave, out, room, type Json } from '../dsl.ts';
import { AQ, age, beast, bondLine, duel, evolve, gain, hasMon, later, line, moment, monDuel, notYet, seen, stageOf, tagTypes, temp, type Place } from './_animeKit.ts';

export { CATEGORY } from './_animeKit.ts';

export const QUESTLINES: Record<string, string> = {
  AQ18: 'aq18-carried-home',
  AQ19: 'aq19-lost-its-power',
  AQ20: 'aq20-proud-crab',
};

export const PLACEMENT: Record<string, Place> = {
  'aq18-carried-home': { shape: 'Companion', earliest: 'A5', home: 'a + node', sits: 'optional', tags: ['cave', 'high'], beats: ['aq18-climb-1', 'aq18-climb-2', 'aq18-climb-3', 'aq18-the-top', 'aq18-tyranitar-comes'], note: 'An egg at a + node. The turning point is a door: the climb, one scene on each of the next four nodes. The Tyranitar comes once, a region or more later.' },
  'aq19-lost-its-power': { shape: 'Companion', earliest: 'A4', home: 9, window: [6, 12], sits: 'optional', attaches: 'after', tags: ['forest'], level: 'A+1', beats: ['aq19-the-walk', 'aq19-twig-back', 'aq19-still-looks', 'aq19-sapling', 'aq19-treecko-twig', 'aq19-treecko-rock', 'aq19-grovyle-leaf'], note: 'It starts with somebody else\'s Sceptile. The meadow fight is A+1. "Let it be" comes back on a later stage of the same region.' },
  'aq20-proud-crab': { shape: 'Single', earliest: 'A2', home: 6, window: [4, 9], sits: 'optional', tags: ['water'], beats: ['aq20-drill-footwork', 'aq20-drill-brace', 'aq20-drill-crabhammer', 'aq20-crab-gloats', 'aq20-crab-asks'], note: 'Laughed and lost: it gloats two nodes on and asks to come on the next stage.' },
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
};

/** Each questline, once its doc section has been re-read line by line against the events. */
export const CHECKED: Record<string, string> = {};

const PEAK = tagTypes('cave', 'high');
const WOOD = tagTypes('forest');
const SEA = tagTypes('water');

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
];

export const REMOVE: string[] = [];
