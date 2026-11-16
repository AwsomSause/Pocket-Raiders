// Catalog Overhaul Pack: STORY_FAMILIES_7.md, part two. SF46 The Borrowed Dog, SF47 Lost and Found, SF48 Three Cards,
// SF49 A Quiet Funeral, SF50 The Empty Shelf, SF51 Eve of the Gym, SF52 The Riolu on the Ledge, SF53 Honesty Tests,
// SF54 The Hospice. Build: npm run co:build -- families-a-10. Run memory is same-run only (Kice 2026-11-14).
import { $, any, anyType, bondUp, br, ch, fight, flag, flagAt, fr, gym, heal, hurt, item, join, moveFlag, out, room, takeNode, trainer, type Json } from '../dsl.ts';
import { grunt, is, kind, later, moment, not, region, safe, sly, sub, v, withRooms } from './_fa.ts';

export const CATEGORY = 'families-a';

const soon = (eventId: string, nodes: number): Json => ({ kind: 'laterEvent', eventId, nodes });
const money = (atLeast: number): Json => ({ kind: 'money', atLeast });
const hasItem = (id: string): Json => ({ kind: 'item', id, count: 1 });
const useItem = (id: string): Json => ({ kind: 'loseItem', id });
const line = (species: string, bond = 0, absent = false): Json => ({ kind: 'partyLine', species, bond, ...(absent ? { absent: true } : {}) });
const giveBack = (label: string, species: string[]): Json => ({ kind: 'tradeAway', want: { label, species } });
const forBoss = (label: string, effects: Json[]): Json => ({ kind: 'tempEffect', label, effects, battles: 1, until: 'boss' });
const rep = (n: number): Json => (n > 0 ? flag('rep', n) : flag('rep-lost', -n));
/** A rescue (SF47): `found-<species>` and the rescue count. */
const found = (species: string): Json[] => [flag(`found-${species}`), flag('found-count')];
/** A keep (SF47, SF53): the Apprentice copies it. */
const kept = (key: string, n: number): Json[] => [flag(`honest-kept-${key}`), flag('honest-kept'), rep(-n), ...sly(n)];
/** "Beaten this region's Lieutenant": the evil story's sixth beat has played (the Lieutenant's second meeting). */
const LT_BEATEN: Json = { kind: 'evil', after: 5 };

// =====================================================================================================================
// SF46. THE BORROWED DOG. Biscuit travels with you for three stages.
// =====================================================================================================================
const DOG: Json[] = [
  {
    id: 'dog-walker',
    intro: 'A woman in a crumpled work suit comes half-running down the street with a lead in one hand and a briefcase in the other, and at the end of the lead a Growlithe is trying to go in every direction at once. Della: "Please. Walk my Growlithe for a few stages? He needs the exercise." She pushes her hair out of her face. "I\'m working doubles. I can\'t, I just can\'t, and he\'s going stir crazy in the flat. I\'ll pay when you come back!" The Growlithe, Biscuit, sees your team and wags so hard he falls over.',
    choices: [
      ch('Of course.', out('You take the lead. Biscuit is at your side before you have even closed your hand, looking up at you as if you invented walks. Della watches you go, and you can see her shoulders come down for the first time. He will battle with your team, she says, he loves it, just bring him back in one piece.', join({ species: ['growlithe'] }), flagAt('dog-on'), moment('You took Della\'s Growlithe, Biscuit, out on the road for three stages', 55))),
      ch('What\'s the pay?', out('Della: "Five hundred. And a tip, if he\'s happy." Biscuit is already happy. Biscuit is the happiest anyone has ever been. You take the lead.', join({ species: ['growlithe'] }), flagAt('dog-on'), flag('dog-paid'))),
      ch('I can\'t.', out('Della nods, and her face does something brave. Biscuit howls as you leave, one long sad note, all the way to the end of the street.')),
    ],
  },
  {
    id: 'dog-walker-pays', requires: [is('dog-on'), later('dog-on', { stages: 3 }), not('dog-done')],
    intro: 'Three stages on. Della is waiting at the town gate in the same crumpled suit, and before you can wave, Biscuit has seen her. He goes off like a shot and hits her at the knees, and she sits down hard in the road laughing with her arms full of him. Della: "Look at you. Look at you!" She looks up. "Here\'s your payment, with a tip. He looks wonderful."',
    choices: [
      ch('Hand him back.', out('You hand over the lead. Biscuit licks your hand once, very thoroughly, and then trots off at Della\'s side, looking back every few steps until they turn the corner.', giveBack('Biscuit goes home', ['growlithe', 'arcanine']), $(600), flag('dog-home'), flag('dog-done'))),
    ],
    remembers: [
      v('gone', [line('growlithe', 0, true)], {
        intro: 'Three stages on. Della is waiting at the town gate in the same crumpled suit, looking past you, and past you again, for a small orange shape that is not there. Her face changes. Della: "...Where is he?"',
        hide: [0],
        add: [ch('Tell her the truth.', out('You tell her. All of it. She listens with both hands over her mouth. When you are done she does not shout. She does not say anything. She just turns and walks away up the street, and you stand there at the gate for a long time.', flag('dog-lost'), flag('dog-done')))],
      }),
      v('happy', [line('growlithe', 4)], {
        intro: 'Three stages on. Della is waiting at the town gate, and Biscuit hits her at the knees and she sits down in the road with her arms full of him. Then he wriggles free, and runs back to you, and sits at your feet, and looks up at her. Della goes very still. Della: "Look at him. He\'s… he\'s never been this happy." She is quiet for a long time. "Should he stay with you? I mean it. I\'m never home. He deserves someone who\'s home."',
        hide: [0],
        add: [
          ch('He\'s yours.', out('You put the lead in her hand and close her fingers round it. Della is crying. Biscuit licks you goodbye, all over your face, and goes home with her. The tip is enormous. You would give it back in a heartbeat.', giveBack('Biscuit goes home', ['growlithe', 'arcanine']), $(1000), flag('dog-home'), flag('dog-done'), moment('You gave Biscuit back to Della, though he would have stayed', 70))),
          ch('If you\'re sure.', out('She is sure. She kneels and holds Biscuit\'s face in her hands and tells him to be good, and he licks her nose, and she laughs and cries at the same time. Then she hugs you, briefly and fiercely, and walks away without looking back, because if she looks back she will not go.', flag('dog-kept'), flag('dog-done'), moment('Della let Biscuit stay with you, because he was happiest on the road', 75))),
          ch('Let him choose.', out('You both step back. Biscuit sits between you in the road, looking from one to the other. Then he goes to Della, and leans on her legs. Then he comes back to you. Then he goes to Della again. In the end he stays with you, and Della laughs through her tears and makes you promise to bring him to visit. You will.', flag('dog-chose'), flag('dog-done'), bondUp(1, { species: ['growlithe', 'arcanine'] }))),
        ],
      }),
    ],
  },
];

// =====================================================================================================================
// SF47. LOST AND FOUND. Each rescue is `found-<species>`; the Final Reunion (other row) reads them.
// =====================================================================================================================
const LOST: Json[] = [
  {
    id: 'ev-lost-pokemon',
    intro: 'A small Lillipup trembles under a signpost, soaked, too frightened to run. It has a collar with a brass tag, and on the tag, in a child\'s careful capitals: "IF FOUND, PLEASE RETURN." And an address, two stops on.',
    choices: [
      ch('Return it.', out('You scoop it up inside your coat and carry it. It stops shaking about a mile on, and goes to sleep against you.', soon('lost-pet-home', 2), flag('lost-pet-carried'))),
      ch('Feed it first.', out('You crouch and hold out a little food. It eats from your hand, slowly, and then climbs into your lap as if it has decided something. When you set off to find the address, it trots at your heel the whole way.', soon('lost-pet-home', 2), flag('lost-pet-carried'), fr(3, 'party'))),
      ch('Keep it.', out('It is someone\'s. You know it is someone\'s. You take it anyway. In every town after this one there is a poster on the noticeboard, in a child\'s handwriting: "HAVE YOU SEEN MY LILLIPUP." You stop looking at noticeboards.', join({ species: ['lillipup'] }), ...kept('lost', 1))),
    ],
  },
  sub('ev-lost-pokemon', 'lost-pet-home', 'Home', 'The address is a small house with a red door. Before you have reached the gate, the door flies open and a little boy is running down the path in his socks, and the Lillipup is out of your arms and into his, and the boy is sobbing with relief into its fur. His mother stands in the doorway with her hand over her mouth.', [
    ch('Give him a minute.', out('You wait at the gate. When the boy can talk again, he comes back with a Berry from the kitchen, held out in both hands, the most important thing he owns. You take it. You would not dream of not taking it.', item('oran-berry'), ...found('lillipup'), ...kind())),
  ], { requires: [is('lost-pet-carried')] }),
  {
    id: 'flooded-basement',
    intro: 'Water is pouring into a cellar through a broken wall, brown and fast, and from somewhere down in the dark comes a thin high crying. A woman at the top of the steps is holding a torch and cannot make herself go down. Woman: "The Rattata. The mother moved her nest down there last week. The pups can\'t swim."',
    choices: [
      ch('Go down.', out('You go down. The water is up to your chest and cold enough to stop your breath. You find the nest on a shelf by touch, three small wet bodies, and carry them up one by one, holding them over your head. The mother is waiting at the top. She looks at you for a long moment before she takes them.', hurt(0.1), ...found('rattata'), ...kind())),
      ch('Send a Water-type.', out('Your Water-type dives into the dark without hesitating. It comes back up with a pup in its mouth, and goes again, and again. Three pups, a mother, and an old Pidove nobody knew was down there. The woman hugs your Pokémon, wet as it is.', bondUp(1, { types: ['water'] }), ...found('rattata'), ...kind()), { requires: [anyType('water')] }),
      ch('Pump it out. (a node)', out('There is an old electric pump in the shed with a dead battery. Your Electric-type puts its paws on the terminals and holds them there for an hour, gritting its teeth, while the water goes down an inch at a time. It is slow. Every one of them is saved.', takeNode(1), bondUp(1, { types: ['electric'] }), ...found('rattata'), ...kind()), { requires: [anyType('electric')] }),
    ],
  },
  {
    id: 'midnight-lullaby',
    intro: 'Night, and you cannot sleep for crying. At the edge of camp a baby Pichu is wailing, and wailing, and its mother Pikachu is sitting beside it with her eyes closed, swaying, so tired she cannot lift her head. She has clearly been at this for days.',
    choices: [
      ch('Sing to it.', out('One of your team knows a song, the kind that is also a move, and it sings, very softly, and the Pichu hiccups and goes quiet and listens, and is asleep before the end. Its mother opens her eyes and looks at your Pokémon as if it has given her the moon.', ...found('pichu'), bondUp(1, 'party')), { requires: [moveFlag('sound')] }),
      ch('Let the parent sleep; hold the baby.', out('You pick up the Pichu and walk it round and round the camp, all night, while its mother sleeps for the first time in days. Somewhere before dawn it stops crying and starts sucking your thumb. At sunrise the mother wakes, comes over, and presses her nose into your hand. You are exhausted. It was worth it.', ...found('pichu'), ...kind())),
      ch('Give the parent a Berry.', out('You put a Berry down in front of the mother. She eats it slowly, and some colour comes back to her cheeks, and she picks up the Pichu and manages, somehow, the way parents do.', useItem('oran-berry'), ...found('pichu')), { requires: [hasItem('oran-berry')] }),
    ],
  },
  {
    id: 'missing-cat-poster',
    intro: 'A poster on a lamp post, hand-drawn, a little faded from rain. LOST: MEOWTH. ANSWERS TO COINS. VERY FRIENDLY (NOT TRUE). REWARD. Below it, a photo of a Meowth looking at the camera with deep contempt, and an address.',
    choices: [
      ch('Look for Coins. (two nodes)', out('You look for two days, roof to roof, alley to alley, and on the second evening you hear a very particular, very annoyed meow.', takeNode(2), room('coins-found'))),
      ch('Ask around.', out('A bin man leaning on his cart: "That one? Behind the fish shop. Has been for a week." He shrugs. "Wouldn\'t say friendly."', room('coins-found'))),
      ch('Check the bins.', out('You check the bins. Coins is in the third bin, sitting on a fish skeleton, entirely unashamed.', room('coins-found'))),
    ],
  },
  sub('missing-cat-poster', 'coins-found', 'Coins', 'Coins is on a roof behind the fish shop, or in a bin, or under a cart: it does not matter, because the important thing is that Coins is not alone. Three kittens, tiny, round, with Coins\'s exact expression of contempt, are tucked up against it. The owner, when you bring them home, sits down on her own doorstep. Owner: "Coins is a girl? Coins is a GIRL?" She laughs until she has to wipe her eyes. "Take one. Please. Take one. I\'ve no room for four."', [
    ch('Return them all.', out('You hand them all over. She pays the reward, every coin of it, honestly, and the kittens follow Coins inside in a line, tails up.', $(500), ...found('meowth'), ...kind())),
    ch('Keep a kitten.', out('You pick the smallest, the one that bit you. The owner pays the reward anyway, every coin, and waves until you are round the corner, holding Coins up to wave too. Coins does not wave.', $(500), join({ species: ['meowth'] }), ...found('meowth'))),
  ]),
  {
    id: 'stray-kitten',
    intro: 'A hungry little cat Pokémon follows you out of town, mewing at your heels, all ribs and eyes. It is not wearing a collar. It is not anyone\'s. When you stop, it stops, and sits, and looks at you with enormous hope.',
    choices: [
      ch('Feed it.', out('You feed it. It eats like it has never eaten, and then, full and round, washes its face, looks at you once, and trots off into the hedge. You hope it remembers where you were.')),
      ch('Take it to a shelter. (two nodes)', out('You carry it back two towns to a shelter with a kind volunteer. Two days later there is a letter at a Pokémon Center: it has been adopted by an old couple with a fireplace. There is a photo. It is asleep in front of the fire.', takeNode(2), ...found('purrloin'), ...kind())),
      ch('Let it follow.', out('You let it follow. It is scrawny, and nervous, and sleeps in your hood. It will grow. You will see to that.', join({ species: ['purrloin', 'skitty'] }), ...found('purrloin'))),
    ],
  },
  {
    id: 'stuck-pokemon',
    intro: 'A young Pokémon is caught in a wire fence at the edge of a field, wrapped up in it, crying with the hopeless thin sound of something that has been crying a while. The more it struggles the tighter it gets.',
    choices: [
      ch('Untangle it.', out('You do it slowly, a strand at a time, talking the whole time. It bites you once, hard, out of fear. You keep going. When the last wire comes away it stands for a moment, shaking, and then it pushes its head into your hand.', hurt(0.05), ...found('fence'), ...kind())),
      ch('Cut the fence. (₽100)', out('You cut it out, quick and clean. The farmer comes running across the field shouting, and when he sees what you did he stops shouting, but he still charges you for the fence, honestly, a hundred and not a coin more.', $(-100), ...found('fence')), { requires: [money(100)] }),
      ch('Call the farmer.', out('You run for the farmer. He comes, a big quiet man, and kneels in the mud and frees it with his hands. Then he fixes the fence, and leaves a gap at the bottom, just big enough. Farmer: "For them. They were here first."', ...found('fence'))),
    ],
  },
];

// =====================================================================================================================
// SF48. THREE CARDS. A region-long modifier, every card's face shown before choosing.
// =====================================================================================================================
const CARDS: Json[] = [{
  id: 'fortune-three-cards',
  intro: 'A fortune teller\'s tent, purple and patched, smelling of incense and wet canvas. Three cards lie face down on black velvet. The woman behind them has rings on every finger and eyes that do not blink enough. Madame Ostra: "Pick one. It\'ll follow you a while, whether you like it or not." She turns them over, one, two, three. Every card\'s effect is printed plainly on its face. Madame Ostra: "No tricks. People always expect tricks."',
  choices: [
    ch('The Sun: every heal this region is stronger.', out('You pick the Sun. Ostra nods, as if you have confirmed something about yourself. The card is warm in your hand. For the rest of the region, every rest, every Berry, every kindness seems to mend a little more.', region('The Sun: healing is 10% stronger this region', { kind: 'healingMultiplier', value: 1.1 }), flag('cards-sun'))),
    ch('The Tower: every foe this region is two levels higher.', out('You pick the Tower, knowing exactly what it says. Ostra\'s eyebrows go up, very slightly. Madame Ostra: "Brave. Or foolish. I like both." She presses a Lucky Egg into your hand, warm, as if she had been holding it. "You\'ll want this."', region('The Tower: foes are two levels higher this region', { kind: 'enemyLevelOffset', value: 2 }), item('lucky-egg'), flag('cards-tower'))),
    ch('The Wheel: rare Pokémon come more often this region.', out('You pick the Wheel. Ostra spins it on the velvet with one finger. Madame Ostra: "Round and round. Luck turns." For the rest of the region, the long grass seems a little stranger, and a little kinder.', region('The Wheel: rare Pokémon are 20% more likely this region', { kind: 'encounterWeightMultiplier', group: 'rare', value: 1.2 }), flag('cards-wheel'))),
    ch('None.', out('Madame Ostra: "Clever. Or scared." She sweeps the cards back into the deck. "Same thing, most days."')),
  ],
}];

// =====================================================================================================================
// SF49. A QUIET FUNERAL. No reward. Jory comes back next region.
// =====================================================================================================================
const FUNERAL: Json[] = [
  {
    id: 'funeral-respects',
    intro: 'A small funeral at the edge of a meadow. Candles in jam jars, a mound of fresh earth, a few words already said. A family: a mother, a father, and a child of about seven holding an empty Poké Ball against their chest with both hands. The family looks up as you stop. The father: "Would one of yours stand with us?" His voice catches. "She\'d have liked that. She liked company." The child, Jory, says nothing at all.',
    choices: [
      ch('Ask my starter to stand with them.', out('Your starter walks over without being told and stands beside Jory, close, not touching, the way you stand beside someone at a time like this. After a while Jory reaches out and takes its paw. They stand like that until the candles burn down. Someone at the back hums the old song, the one about the Jigglypuff that sang a whole stadium to sleep and then tucked every sleeper in.', flag('lore-last-lullaby'), bondUp(1, 'starter'), flagAt('funeral-stood'), moment('Your starter stood with a family at their Pokémon\'s funeral, and Jory held its paw', 75))),
      ch('Stand with them myself.', out('You stand with them. Nobody speaks. The wind moves the grass. It is enough. When you leave, the mother touches your arm, once, and you nod, and that is all. Afterwards an old woman at the gate tells you about a bell with no clapper in a ruined tower, that rings only when a trainer who has never lied walks beneath it. "It rang for her once," she says.', flag('lore-hollow-bell'), flagAt('funeral-stood'))),
      ch('Leave quietly.', out('You leave them to it, quietly, the way you would want to be left.')),
    ],
  },
  sub('funeral-respects', 'funeral-jory', 'Jory', 'A young trainer stops you on the road in a new region, and it takes you a moment. Older. Taller. But you know the eyes. Jory, with a Pokémon at their side, young and bright, of the same kind as the one in the empty Ball. Jory: "You stood with us." They swallow. "Her egg. Mum and Dad kept it. She hatched in the spring. I wanted you to meet her."', [
    ch('A battle.', fight('Jory grins, and for a moment looks seven again. Jory: "She\'s really good. You\'ll see."', safe(trainer('Jory', { cls: 'youngster', size: 2, lv: 0, win: [flag('funeral-jory'), fr(5, 'party'), moment('Jory battled you with the Pokémon hatched from their old friend\'s egg', 70)] }), flag('funeral-jory')))),
    ch('A handshake.', out('You shake hands. Jory\'s grip is very firm, as if they practised. Their Pokémon sniffs your starter, and then leans against it, the way the empty Ball\'s Pokémon might have once. Jory: "Thanks. For then. I never said."', flag('funeral-jory'))),
  ], { callback: true, requires: [is('funeral-stood'), later('funeral-stood', { regions: 1 }), not('funeral-jory')] }),
];

// =====================================================================================================================
// SF50. THE EMPTY SHELF. Mrs. Arden's son Kit joined the evil team.
// =====================================================================================================================
const SHELF: Json[] = [
  {
    id: 'gift-the-keeper',
    intro: 'A small shop, tidy, nearly empty of customers. Mrs. Arden, the shopkeeper, is polishing a shelf behind the counter. There is nothing on it. She polishes it anyway, slowly, all the way along. Mrs. Arden: "Someone\'s missing from this shelf." She does not look up. "My son kept his trophies here. He left a year ago. He sends money." The cloth stops. "He doesn\'t say from where." On the counter is an envelope. The stamp has a logo on it, faint, as if someone had tried to rub it off with a thumb. You know that logo.',
    choices: [
      ch('I\'ll look for him.', out('She stops polishing. She looks at you for a long time. Then she takes a photo from under the till and gives it to you: a boy of about sixteen with a lopsided grin, holding up a ribbon. On the back, in her handwriting: Kit Arden.', flag('shelf-kit'))),
      ch('Ask about the money.', out('Mrs. Arden: "Too much. Too often." She opens a drawer. It is full of envelopes, unopened. "I\'ve stopped spending it." She shows you a photo of him, a boy with a lopsided grin. Kit Arden. You remember the face.', flag('shelf-kit'))),
      ch('I\'m sorry.', out('She nods, and keeps polishing. As you leave, the shop bell rings, and she looks up at the door, quickly, the way she must have looked up every time it rang for a year.')),
    ],
  },
  sub('gift-the-keeper', 'shelf-kit-hideout', 'Kit', 'Deep in a hideout, in a corridor that smells of machine oil, a Grunt steps out to stop you, and stops. He has a lopsided face under the uniform cap. The same face as the photo, older, thinner, tireder. He looks at you, and at the way you are looking at him. Kit: "...You\'ve been to the shop."', [
    ch('Your mum\'s waiting.', out('Kit\'s hand shakes on his Poké Ball. Kit: "They\'d find me." He says it like a thing he has said to himself a thousand times. "They\'d find me, and then they\'d find the shop." He steps back into the shadows and is gone.', flag('shelf-kit-met')), {
      branches: [br([LT_BEATEN], 'Kit\'s hand shakes on his Poké Ball. He looks at you, and past you, at the way you came in, the way that should have been guarded by the one who commands this place, and is not, because you dealt with them. Kit: "You beat them." Slowly, he takes off the cap. "...Is she alright?" He walks out of the hideout at your side, and does not look back once.', flag('shelf-kit-met'), flag('shelf-kit-home'), ...kind(2), moment('Kit Arden walked out of the hideout beside you, to go home to his mother', 85))],
    }),
    ch('Battle.', fight('Kit: "Don\'t make me." But he sends it out anyway.', safe(grunt('Kit Arden', { size: 3, lv: 1, win: [flag('shelf-kit-met'), flag('shelf-kit-letter')] }), flag('shelf-kit-met')))),
    ch('Why?', out('Kit: "The shop was going under." He says it to the floor. "Mum would never have told you. Three months behind on the rent, the bank calling. They paid. They pay a lot." He looks up. "Is she… is she spending it?" You tell him about the drawer of envelopes. Kit: "...Mum." He turns, very fast, and walks away down the corridor.', flag('shelf-kit-met'))),
  ], { callback: true, requires: [is('shelf-kit'), later('shelf-kit', { stages: 3 }), { kind: 'evil', after: 2 }, not('shelf-kit-met')] }),
  sub('gift-the-keeper', 'shelf-home', 'The Shelf', 'You pass the shop again, later, and something makes you go in. Mrs. Arden is behind the counter. Kit is up a ladder, painting the ceiling, badly. The shelf is no longer empty. There is one thing on it: a photo in a frame, Kit and his mother, both grinning the same lopsided grin. In the corner of the frame, in her handwriting, is your name. Mrs. Arden: "Couldn\'t think what else to put."', [
    ch('It\'s perfect.', out('Kit comes down the ladder with paint in his hair and shakes your hand, and does not let go for a while. His mother pretends not to be watching. She is.', fr(5, 'party'), flag('shelf-home'))),
  ], { callback: true, requires: [is('shelf-kit-home'), later('shelf-kit-home', { stages: 2 }), not('shelf-home')] }),
];
// The letter instead of money (after the battle): a quiet coda on the shop's next visit.
SHELF.push(sub('gift-the-keeper', 'shelf-letter', 'A Letter', 'You pass Mrs. Arden\'s shop again. She is behind the counter, and there is a letter on the counter, unfolded, read so many times the creases have gone soft. Mrs. Arden: "No money this month." She touches the letter. "He wrote instead. First time in a year. He says he\'s thinking." She looks at the empty shelf. "That\'s something. Isn\'t it?"', [
  ch('It\'s something.', out('She nods. She keeps polishing the shelf, but slower, and once, you think, she smiles.', flag('shelf-letter-read'))),
], { callback: true, requires: [is('shelf-kit-letter'), later('shelf-kit-letter', { stages: 2 }), not('shelf-letter-read')] }));

// =====================================================================================================================
// SF51. EVE OF THE GYM. Wil, who walked in loud and never went back.
// =====================================================================================================================
const GYM_EVE: Json[] = [
  {
    id: 'gym-eve-tone',
    intro: 'The night before a Gym. You are sitting on the steps outside, not ready to go to sleep yet, when a stranger sits down beside you. A young man, older than you, with a badge case on his belt that has one badge in it. Just the one. Wil: "Nervous?" He does not wait for an answer. "You can walk in loud, or quiet, or ask for advice." He looks up at the Gym\'s dark doors. "I walked in loud. Lost in four turns. Never went back."',
    choices: [
      ch('Loud.', out('Wil: "Ha." He slaps your shoulder and gets up. "Good luck." You watch him go. He does not look back at the doors once. Tomorrow your lead is going to open with everything it has.', forBoss('Walking in loud: your first attack hits harder', [{ kind: 'firstAttackDamage', first: 1.1, later: 1 }]), flag('wil-loud'))),
      ch('Quiet.', out('Wil looks at you for a long moment. Wil: "Huh." He looks at the doors. "Maybe I should\'ve tried that." Tomorrow your team walks in calm, and nothing they do on turn one is going to rattle them.', forBoss('Walking in quiet: no flinching on turn one', [{ kind: 'noFlinchTurnOne' }]), flagAt('wil-tries'), flag('wil-quiet'))),
      ch('Ask advice.', out('You ask him. He blinks, then tells you everything he remembers about the Leader\'s ace, which is a lot, because he has been thinking about it for three years. At the end he goes quiet. Wil: "You asked." He laughs, shakily. "I never asked."', gym(), flagAt('wil-tries'), flag('wil-asked'))),
    ],
  },
  sub('gym-eve-tone', 'wil-badge', 'Wil, Again', 'Outside the next Gym, someone waves at you from the steps. Wil, grinning so hard it looks painful, holding up his badge case. Two badges. Wil: "I asked." He shakes his head, still not quite believing it. "I asked, and I listened, and I went back."', [
    ch('I knew you would.', out('You did not, but you say it anyway, and he hears that you are glad, and he walks you all the way to the Gym doors and slaps your shoulder there for luck.', fr(5, 'party'), flag('wil-badge'))),
  ], {
    callback: true, requires: [is('wil-tries'), later('wil-tries', { regions: 1 }), not('wil-badge')],
    remembers: [v('quiet', [is('wil-quiet')], { intro: 'Outside the next Gym, someone waves at you from the steps. Wil, grinning so hard it looks painful, holding up his badge case. Two badges. Wil: "Quiet." He shakes his head. "Like you said. I walked in quiet."' })],
  }),
];

// =====================================================================================================================
// SF52. THE RIOLU ON THE LEDGE. It watches how you treat your team (`riolu-watch`), and comes along only if it chooses you.
// =====================================================================================================================
const RIOLU: Json[] = [
  {
    id: 'ledge-riolu',
    intro: 'A crumbling ledge above a fast brown river, and on it, pressed back against the cliff, a small Riolu crying for help. Every time it moves, a bit more of the ledge breaks away and falls, and falls, and is swallowed by the water a long way down.',
    choices: [
      ch('Climb down.', out('You climb down. Your fingers find holds you did not know were there. You reach it, and it grabs your arm with both paws, and the ledge goes out from under you both. For one long second there is nothing. Then your lead has your wrist, and is pulling, and you are up, all three of you, lying on the grass. The Riolu looks at you, and at your lead, and runs off into the trees.', bondUp(1, 'lead'), flag('riolu-saved'))),
      ch('Send a Flying-type.', out('Your Flying-type drops off the cliff edge and comes back up with the Riolu held carefully in its feet, and sets it down in the grass. It stares at your Pokémon, and at you, for a long moment. Then it runs off into the trees.', bondUp(1, { types: ['flying'] }), flag('riolu-saved')), { requires: [anyType('flying')] }),
      ch('Tell it to jump.', out('You hold your arms out and tell it to jump. It looks at you, and at the drop, and at you. Then it jumps. You catch it, and the weight carries you both straight over the edge and into the river. You come up gasping, still holding it. On the bank it shakes itself off, looks at you very hard, and runs off into the trees.', hurt(0.1), flag('riolu-saved'), flag('riolu-splash'), flag('riolu-watch'))),
    ],
  },
  sub('ledge-riolu', 'riolu-watch-1', 'Something in the Branches', 'After a hard battle, your team is battered and you are tending to them by the fire. You feel eyes on you. Up in a tree above the camp, on a branch, the Riolu from the ledge is sitting very still, watching how you treat them.', [
    ch('Wave.', out('You wave. It ducks behind the trunk. Then, slowly, a paw comes round and waves back.', flag('riolu-seen-1'), flag('riolu-watch')), { branches: [br([is('kind-total', 3)], 'You wave. It ducks behind the trunk. Then, slowly, a paw comes round and waves back. It watched you look after every one of them. It saw.', flag('riolu-seen-1'), flag('riolu-watch', 2))] }),
    ch('Ignore it.', out('You ignore it and go on with your team. When you look up again, the branch is empty.', flag('riolu-seen-1')), { branches: [br([is('kind-total', 3)], 'You ignore it and go on with your team, one by one, gently. When you look up again, the branch is empty, but it watched every moment.', flag('riolu-seen-1'), flag('riolu-watch'))] }),
    ch('Leave it a Berry.', out('You put a Berry on a flat stone at the foot of the tree and go back to the fire. In the morning the Berry is gone, and in its place is a smooth white pebble.', flag('riolu-seen-1'), flag('riolu-watch')), { branches: [br([is('kind-total', 3)], 'You put a Berry on a flat stone at the foot of the tree and go back to the fire. In the morning the Berry is gone, and in its place is a smooth white pebble. It saw how you are with them.', flag('riolu-seen-1'), flag('riolu-watch', 2))] }),
  ], { callback: true, requires: [is('riolu-saved'), later('riolu-saved', { stages: 1 }), not('riolu-seen-1')] }),
  sub('ledge-riolu', 'riolu-watch-2', 'At the Edge of the Fight', 'Mid-battle, you catch a movement at the edge of your eye. The Riolu, at the edge of the clearing, half-hidden in the ferns. It is standing exactly the way your lead is standing: the feet, the shoulders, the tilt of the head. Copying every move.', [
    ch('Show it a move.', out('After the battle you have your lead show it one move, slowly, again and again. The Riolu copies it, badly, and then better, and then nearly right. It is so pleased with itself it falls over.', flag('riolu-seen-2'), flag('riolu-watch'))),
    ch('Let it watch.', out('You let it watch, and fight the rest of the battle a little more carefully, a little more kindly, knowing you are being seen. When you look round, it is gone, but the ferns are still moving.', flag('riolu-seen-2'), flag('riolu-watch'))),
    ch('Shoo it.', out('You wave it away. It flinches, and goes, and you feel something you did not expect to feel.', flag('riolu-seen-2'), flag('riolu-watch', -1))),
  ], { callback: true, requires: [is('riolu-seen-1'), later('riolu-seen-1', { stages: 1 }), not('riolu-seen-2')] }),
  {
    id: 'ledge-riolu-return', requires: [is('riolu-seen-2'), later('riolu-seen-2', { stages: 1 }), not('riolu-done')],
    intro: 'Something small drops out of a tree and lands in front of you on the path, light as a leaf. The Riolu from the ledge. Bigger now. It stands in front of you the way your lead stands: feet planted, shoulders square, chin up. Then, very seriously, it holds out a paw.',
    choices: [
      ch('Come with me.', out('It takes your hand. Its paw is warm. It walks beside you the rest of the day, copying your stride.', join({ species: ['riolu'] }), flag('riolu-done'), flag('riolu-joined')), {
        branches: [br([is('riolu-watch', 2)], 'It takes your hand, and as it does, you feel something: a warmth that runs up your arm and settles somewhere behind your ribs. Aura. It has been learning it, watching you with your team. It already knows how to throw it. It walks beside you, and every so often looks up at you, and you can feel that it is glad.', join({ species: ['riolu'] }), { kind: 'teachMove', move: 'aura-sphere', species: 'riolu' }, flag('riolu-done'), flag('riolu-joined'), moment('The Riolu from the ledge chose you, and already knew Aura Sphere from watching you', 85))],
      }),
      ch('Are you sure?', out('It nods, very seriously, once. Then it takes your hand.', join({ species: ['riolu'] }), flag('riolu-done'), flag('riolu-joined')), {
        branches: [br([is('riolu-watch', 2)], 'It nods, very seriously, once. Then it takes your hand, and you feel the warmth of its aura run up your arm. It has been learning, watching you with your team. It already knows how to throw it.', join({ species: ['riolu'] }), { kind: 'teachMove', move: 'aura-sphere', species: 'riolu' }, flag('riolu-done'), flag('riolu-joined'), moment('The Riolu from the ledge chose you, and already knew Aura Sphere from watching you', 85))],
      }),
      ch('Go home.', out('It looks at you for a long moment, and it looks hurt, and then it nods, and goes. You will wonder about it. Somewhere, a long way from here, it is going to grow up.', flag('riolu-done'), flag('riolu-home'))),
    ],
  },
];

// =====================================================================================================================
// SF53. HONESTY TESTS. Keeping gives money now and costs Reputation; the Apprentice copies it.
// =====================================================================================================================
const HONEST: Json[] = [
  {
    id: 'lost-child',
    intro: 'Two preschoolers are crying outside a shop, holding hands so tight their knuckles are white. The older one, maybe five, is trying very hard to be brave for the younger one and failing. The older one: "We lost Dad." A hiccup. "He\'s got a hat."',
    choices: [
      ch('Find Dad.', out('You hold their hands and walk them up the street, looking for a hat. There are a lot of hats. Then a man comes running out of a side street with his hat in his hand and his face white, and the children let go of you and run, and he goes down on his knees in the road and holds them both. He looks up at you over their heads and cannot say anything at all.', flag('honest-child'), ...kind())),
      ch('Take them to a guard.', out('You take them to the guard at the town hall, who gives them a sweet each and sits them on the desk. Their dad arrives ten minutes later, at a run. He shakes your hand so hard it hurts.', flag('honest-child'), ...kind())),
      ch('Buy them ice cream and wait. (₽50)', out('You buy them each an ice cream and sit on the kerb with them, right where they were, because that is where Dad will come back to. He does. He sees you, and the ice creams, and his face crumples. Afterwards he buys you a Lemonade and will not hear a word against it.', $(-50), item('lemonade'), flag('honest-child'), ...kind()), { requires: [money(50)] }),
    ],
  },
  {
    id: 'lost-ring',
    intro: 'A ring glimmers in the grass of the park, gold, old, worn thin on one side. You pick it up, and four people are suddenly very close. A: "My engagement ring!" B: "My grandmother\'s!" C: "It fell off at lunch!" And D, a young man standing a little apart, quietly: "It\'s mine." He looks at the others, and back at the ring. "But I think he needs it more."',
    choices: [
      ch('Ask what\'s engraved inside.', out('You hold it up. Nobody says anything. Then D, quietly: "For Lise, from J." You look. It is. A, B and C slink off in three directions. D takes the ring and holds it in his fist against his chest. D: "She\'s gone. It\'s all I\'ve got." You did not need to hear that to know.', flag('honest-ring'), flag('honest-returned-wallet'), ...kind())),
      ch('Give it to D.', out('You hold it out to D. He stares at you. D: "How did you…" You do not know how. You just did. He looks inside the ring, and his face breaks, and he puts it on a chain round his neck, and walks away very fast.', flag('honest-ring'), flag('honest-returned-wallet'), ...kind())),
      ch('Keep it.', out('You put it in your pocket and walk away from all four of them. You sell it in the next town for two thousand. The money feels heavier than it should.', $(2000), flag('honest-kept-wallet'), ...kept('ring', 2))),
    ],
  },
  {
    id: 'lost-umbrella',
    intro: 'Rain again, and on a bench, a big black umbrella, soaked, with a paper name tag tied to the handle. Across the road a woman is huddled under a shop awning, wet through, watching the rain like it has done something to her personally.',
    choices: [
      ch('Take it to her.', out('You take it across. It is hers. She thanks you, and opens it, and holds it over both of you all the way to the station, telling you about her day, which was a bad one, and is now slightly less bad.', flag('honest-umbrella'), ...kind())),
      ch('Check the tag first.', out('You check the tag. It is not her name on it. You take it to her anyway, because she is the only person in the street, and she reads the tag, and puts her hand over her mouth. It is her husband\'s name. He died in the spring. She thought she had lost it on the train. She holds the umbrella like it is him.', flag('honest-umbrella'), ...kind())),
      ch('Use it myself.', out('You put it up and walk on, dry. Across the road, she watches you go.', ...kept('umbrella', 1))),
    ],
  },
  {
    id: 'lost-wallet',
    intro: 'A wallet on the path, fat with cash. You open it. An ID card: a nurse, two towns on, smiling in her photo the way people smile when the photographer has told a bad joke. There is a picture of two children in the back.',
    choices: [
      ch('Return it. (two towns on)', out('You put it in your inside pocket and go. Two towns on, you find the hospital.', soon('wallet-nurse', 2), flag('honest-returned-wallet'), flag('honest-wallet'))),
      ch('Hand it in.', out('You hand it in at the next guard post. The guard writes your name down. Weeks later a thank-you letter finds you at a Pokémon Center, with a drawing from each of the two children in the photograph.', flag('honest-returned-wallet'), flag('honest-wallet'), ...kind())),
      ch('Keep the cash.', out('You take the cash and drop the wallet back on the path. A thousand. It does not feel like a thousand.', $(1000), flag('honest-kept-wallet'), ...kept('wallet', 2))),
    ],
  },
  sub('lost-wallet', 'wallet-nurse', 'The Nurse', 'The hospital, two towns on. The nurse from the photo is at the desk, and when you put the wallet down in front of her she stares at it and then bursts into tears. Nurse: "That\'s the rent." She laughs, and wipes her eyes, and laughs again. "That\'s the rent. I\'ve been sick about it all week." She pulls two notes out and pushes them across the desk. "Please. Take something."', [
    ch('Refuse.', out('You push it back. She looks at you for a long moment and then comes round the desk and hugs you, hard, in front of the whole waiting room. Word gets around.', rep(1), ...kind())),
    ch('Accept. (₽200)', out('You take it, because she needs you to. She smiles properly for the first time, the way she did in her ID photo.', $(200), ...kind())),
  ]),
];

// =====================================================================================================================
// SF54. THE HOSPICE. No battle; the old Lapras sings once at the sea.
// =====================================================================================================================
const HOSPICE: Json[] = [
  {
    id: 'pokemon-hospice',
    intro: 'A quiet stone house on a cliff, with a sign by the gate in faded paint: A REST FOR OLD FRIENDS. Inside, it is warm and smells of hay and clean water, and in every room there is an old Pokémon sleeping. The caretaker, Ruthanne, a small woman with enormous hands, invites you to stay the night. Ruthanne: "Old ones. Very old. They like visitors." She shows you the last room. An ancient Lapras, her shell grey and cracked, in a pool far too small for her, and in a chair beside the pool an old man asleep with his hand resting on her neck. Ruthanne, very softly: "He comes every day. She\'s near the end." She looks at them for a long time. "She used to carry him across the bay when he was a boy."',
    choices: [
      ch('Stay the night.', out('You stay. You sit in the corridor outside the last room with your team asleep in a heap around you, and listen to the house breathe. In the night you get up once and look in. The old man is still asleep. The Lapras is awake, watching him. In the morning she is still here. Nothing else happens. That is the whole of it, and it is enough.', flag('hospice-stayed'))),
      ch('Bring her outside to see the sea.', out('You ask Ruthanne. She thinks about it for a long time, and then she fetches a cart.', flag('hospice-sea'), room('hospice-ned')), { requires: [anyType('water', 'psychic')] }),
      ch('Leave them be.', out('You leave them be, quietly, and close the door behind you. Ruthanne nods, as if that was right too.')),
    ],
  },
  sub('pokemon-hospice', 'hospice-ned', 'She Sings', 'It takes all of you. Your Water-type carries the pool\'s water in, a wave at a time, to keep her wet. Ruthanne\'s old cart, a borrowed horse, the long slow path to the cliff above the bay. The Lapras is so light. At the top, you set her down where she can see the water, and she looks at the sea for a long time. Then she lifts her head, and she sings. One long note, out over the bay. Her trainer wakes up in the cart behind you, and sees her, and hears it. Old Ned: "She hasn\'t sung in ten years." He climbs down, slowly, and stands beside her with his hand on her neck. Later he presses something into your hand: a Mystic Water, worn smooth as a sea stone. Old Ned: "Take this. She\'d want it to go somewhere."', [
    ch('Thank you.', out('You take it. It is warm from his hand. He nods, and turns back to her, and the two of them watch the sea until the sun goes down.', item('mystic-water'), moment('An old Lapras sang once more at the sea, and her trainer heard it', 85))),
    ch('Keep it for her.', out('You fold his fingers back over it. Old Ned looks at you, and his eyes fill, and he nods. He puts it back round her neck. You get nothing, and that is the right answer too.', moment('An old Lapras sang once more at the sea, and you let her keep her Mystic Water', 85), bondUp(1, 'party'))),
    ch('Ask about the bay.', out('Old Ned tells it. How she found him, a boy who could not swim, clinging to a log a mile out. How she carried him in. How she carried him across every summer after that, until he was too big, and then kept on anyway. He talks until it is dark. Then he gives you the Mystic Water.', item('mystic-water'), moment('An old Lapras sang once more at the sea, and Old Ned told you how she saved him', 85))),
  ], { remembers: [v('lapras-answers', [line('lapras')], { notice: 'From your belt, a Poké Ball shakes. Your own Lapras comes out on its own, and looks at the old one, and lifts its head, and sings back. Two notes over the bay, one old, one young.' })] }),
];

export const EVENTS: Json[] = withRooms([...DOG, ...LOST, ...CARDS, ...FUNERAL, ...SHELF, ...GYM_EVE, ...RIOLU, ...HONEST, ...HOSPICE]);
