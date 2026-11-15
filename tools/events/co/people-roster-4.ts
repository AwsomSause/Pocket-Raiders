// Catalog Overhaul Pack, people: THE ROAD ROSTER, RR22 to RR31 (ROAD_ROSTER.md lines 1134 to 1641). Pattern: people-roster-1.ts.
// Build: npm run co:build -- people-roster-4
import { $, ch, egg, fight, flagIs, forRegion, gym, has, heal, item, join, lose, money, out, ptype, room, stopHere, trade, type Json } from '../dsl.ts';
import { CATEGORY as CAT, moment, rosterKit, spar, variant, wildSpar } from './_people.ts';

export const CATEGORY = CAT;

// ---------- RR22. Juggler Pierre (morning, afternoon; Voltorb, Mr. Mime, Hypno) ----------
const P = rosterKit('pierre', 'npc-meet-juggler-pierre', 'Juggler Pierre');
const PIERRE = 'Juggler Pierre';
const pierreWin = moment('You beat Juggler Pierre in the town square');
const pierreLose = moment('Juggler Pierre\'s act beat you in the town square');

const pierre: Json[] = [
  P.meet(1, {
    title: 'Keep Your Eyes on the Ball',
    intro:
      'A town square on market morning, all striped awnings and fussing pigeons. In the middle of it a man in a patched velvet waistcoat is juggling five Poké Balls in one smooth, endless loop, and a little crowd has stopped with its shopping to watch. ' +
      'One of the balls is not quite like the others. It hums, and every so often it blinks: a Voltorb, spinning along with the rest and plainly having the time of its life. The man finds your eyes without missing a catch. ' +
      'Pierre: "Keep your eyes on the ball. And the Pokémon."',
    choices: [
      ch('"Battle."', fight('Pierre lets four balls drop into his coat pockets one after another, pop pop pop pop, and flicks the last one down onto the cobbles. The Voltorb lands, spins, and starts to glow far too brightly. The crowd takes one big step back. It opens with Self-Destruct.',
        spar(PIERRE, { team: ['voltorb', 'mr-mime'], size: 2, foeMoves: ['self-destruct'], win: [pierreWin], lose: [pierreLose] }), P.set('m1'))),
      ch('"Which is the Voltorb?"', fight('You keep your eyes on it, round and round, up and over, until you are sure, and you point. Pierre stops dead, catches all five, and bursts out laughing. The Voltorb, found out, sulks: there will be no exploding today. He lets it out anyway, with Mr. Mime behind it, and the battle is on.',
        spar(PIERRE, { team: ['voltorb', 'mr-mime'], size: 2, win: [pierreWin], lose: [pierreLose] }), P.set('m1')),
      { prompt: { id: 'aim-drag', needs: 'good' }, fail: fight('You point. Pierre shakes his head, smiling, and opens the ball: an empty one. The real Voltorb drops out of the air at your feet, already glowing far too brightly. It opens with Self-Destruct, and it is very pleased with itself.',
        spar(PIERRE, { team: ['voltorb', 'mr-mime'], size: 2, foeMoves: ['self-destruct'], win: [pierreWin], lose: [pierreLose] }), P.set('m1')) }),
      ch('"Applaud."', out('You clap, and the crowd claps with you. Pierre bows low without dropping a single ball, hooks a coin off the cobbles with the toe of his boot and kicks it up into his hat, then tosses 50 back to you with a wink. A juggler always pays his audience back a little.', $(50))),
    ],
  }),
  P.meet(2, {
    title: 'Dropped',
    intro:
      'A park bench across from a theatre whose posters have started to peel. Pierre sits on it alone, his right wrist strapped up in a white sling, one Poké Ball turning slowly in his good hand. ' +
      'Mr. Mime stands beside him miming a wall around the bench, very gently, as if to keep the world out for a while. Pierre does not look up when you sit down. Pierre: "Dropped one. On stage. In front of a thousand people."',
    choices: [
      ch('"Juggle with one hand."', out('Pierre stares at his good hand as if it belonged to somebody else. Then he tosses the ball up and catches it. Tosses two. Drops one, picks it up, tosses two again. He waves you on without looking away from them: come back this way later.', room(P.roomId('practice')))),
      ch('"Let your Pokémon juggle."', out('Pierre looks at Mr. Mime. Mr. Mime looks at Pierre. Then five Poké Balls lift off the bench on a soft shimmer of Psychic and begin to circle, slow at first, then faster, then in shapes no hands could make. A passer-by stops. Then ten. When the balls come down the whole park is clapping, and Pierre is laughing with tears on his face. It is a hit.', P.set('m2'), P.set('mime'))),
      ch('"Retire."', out('He nods, and keeps nodding for a long time. Then he takes the five Poké Balls out of his coat one by one, still warm from his pocket, and puts them into your hands as carefully as eggs. He folds your fingers over the last one and pats them, and does not say anything at all.', item('poke-ball', 5), P.set('m2'), P.set('retired'))),
    ],
  }),
  P.room('practice', {
    title: 'One Hand',
    intro:
      'Two bends of the road later you hear it before you see it: the soft slap of Poké Balls landing in a palm. Pierre has not left the bench. There are blisters on his good hand and three balls in the air, and he is grinning like a boy. ' +
      'Mr. Mime keeps count on its white fingers. Every time the count passes twenty it does a tiny bow.',
    choices: [
      ch('Toss him a fourth ball.', out('You throw it high and a little wide. Pierre\'s hand finds it anyway, and the pattern swallows it as if it had always been there: four balls, one hand, a lopsided rhythm nobody has ever seen. He catches them all and looks at his hand in wonder. It is a new act.', P.set('m2'), P.set('onehand'))),
      ch('Count with Mr. Mime.', out('You count out loud, and Mr. Mime counts on its fingers, and when you both reach one hundred Pierre is still going. He finishes with the ball rolling down his arm and into his sling like it is coming home. Pierre has a new act, built around the hand he has left.', P.set('m2'), P.set('onehand'))),
    ],
  }),
  P.meet(3, {
    title: 'Encore',
    intro:
      'A real stage this time, red curtains and a painted sky behind it, and every seat out front already full. Backstage, Pierre stands in a new waistcoat, the sling gone, his right hand still a little stiff when he flexes it. ' +
      'Pierre: "One hand, five balls, a Mr. Mime. They sold out." He swallows hard. Out front the lights go down and a thousand people go quiet. Pierre: "I\'m terrified. Stand at the front, would you?"',
    choices: [
      ch('"Watch."', out('You take a place right at the front, where he can see you. He looks for you once, finds you, and does not drop a single ball. When the curtain falls the noise is like rain on a roof. Afterwards he sends you home through the stage door with a basket of sandwiches and your whole team rested and warm.', heal(1), P.set('done'))),
      ch('"Join the act."', out('Pierre throws you a ball on the first beat, and you throw it back on the second, and somewhere in the middle you stop thinking and just keep time. The crowd goes wild. In the wings he presses a Light Clay into your hand, still dusty from his props box.', item('light-clay'), P.set('done')),
      { prompt: { id: 'echo-rhythm', needs: 'good' }, fail: out('You miss the third beat and a ball bounces off your head. Pierre catches it on the rebound and turns it into a bow, and the crowd roars, sure it was all part of the act. Only the two of you know better, and he winks at you all the way to the encore.', P.set('done')) }),
      ch('"Battle after."', fight('After the last bow, with the empty seats still warm, Pierre steps down off the stage and sends out Hypno and Mr. Mime. He is too happy to stand still. One more show, just for you.',
        spar(PIERRE, { team: ['hypno', 'mr-mime'], size: 2, win: [moment('You beat Juggler Pierre after his comeback show')], lose: [moment('Juggler Pierre beat you after his comeback show')] }), P.set('done'))),
    ],
  }),
];

// ---------- RR23. Lady Cordelia (morning, afternoon; Persian, Delcatty, Primarina) ----------
const C = rosterKit('cordelia', 'npc-meet-lady-cordelia', 'Lady Cordelia');
const CORDELIA = 'Lady Cordelia';

const cordelia: Json[] = [
  C.meet(1, {
    title: 'The Finest',
    intro:
      'A white carriage waits at the side of the road, its two Ponyta dozing in their traces. Under a lace parasol beside it stands a girl in more lace than you have ever seen on one person, with a Persian at her feet brushed until it shines and a Delcatty wearing a little velvet bow. ' +
      'Cordelia: "My Pokémon are only the finest." She glances back at the carriage, then lowers the parasol with great care. Cordelia: "Mother says I mustn\'t battle common trainers. Mother isn\'t here."',
    choices: [
      ch('"Battle."', fight('Cordelia folds the parasol and hands it to the coachman without looking at him. Persian and Delcatty step forward together, perfectly in time, as if they have practised the walk more than the fighting.',
        spar(CORDELIA, { team: ['persian', 'delcatty'], size: 2, win: [moment('You beat Lady Cordelia\'s finest')], lose: [moment('Lady Cordelia\'s finest beat you')] }), C.set('m1'))),
      ch('"Common?"', fight('She goes pink right up to the ears and snaps the parasol shut. Her Persian\'s tail lashes. Whatever Mother taught her about manners, she has decided to forget it for the next few minutes, and she battles much harder than she meant to.',
        spar(CORDELIA, { team: ['persian', 'delcatty'], size: 2, lv: 1, win: [moment('You beat Lady Cordelia, who was trying very hard')], lose: [moment('Lady Cordelia beat you, and was a little sorry about "common"')] }), C.set('m1'))),
      ch('"Go home."', out('Cordelia sulks. She climbs back into the carriage, pulls the little curtain shut with a snap, and the Persian gives you one long, offended look through the window as the Ponyta clop away.')),
    ],
  }),
  C.meet(2, {
    title: 'Runaway',
    intro:
      'A campfire still smoking from the night, in a ditch by the road. Cordelia sits beside it in what used to be a lace dress and is now mostly mud, with twigs in her hair and a burnt pan in her lap. Her Persian is curled up nearby looking deeply appalled by everything. ' +
      'She lifts her chin when she sees you, the way she did beside the carriage. Cordelia: "I ran away. I want to do a gym challenge. Mother says no."',
    choices: [
      ch('"Go back."', out('She looks at the fire for a long time. Then she nods, and stands, and brushes at her skirt even though it will not help. She goes, crying, the Persian pressed against her legs, and she does not look back until the very last bend.', C.set('m2'), C.set('home'))),
      ch('"Come with me a while."', out('She tags along for a stretch of the road and is useless at camping: the tent goes up inside out, the porridge catches, and she tries to wash a pan in a stream with perfume. But in a fight she is fierce, and she laughs more each day. Her Persian, quietly, starts to like you.', { kind: 'wandererFriend', stages: 1 }, C.set('m2'), C.set('travelled'))),
      ch('"Write to your mother."', out('You write it together by the fire, Cordelia crossing out "Dear Mother" three times. A Pidgeotto takes it before noon. By evening it is back with the reply in a careful, shaky hand: one gym, if she comes home after. Cordelia reads it twice, then holds it against her chest.', C.set('m2'), C.set('letter'))),
    ],
  }),
  C.meet(3, {
    title: 'First Badge',
    intro:
      'The steps outside a gym, busy with trainers coming and going. Cordelia stands in the middle of them in a plain travelling coat, holding a badge up to the light as if it might fly away. Behind her a tall woman in a big hat is dabbing at her eyes with a lace handkerchief. ' +
      'Cordelia: "One. Mother came. She cried."',
    choices: [
      ch('"Battle."', fight('Cordelia tucks the badge away very carefully and lets out a Primarina, a new one, who sings a note so clear that people on the steps stop to listen. She is not fighting for Mother today. She is fighting because she wants to.',
        spar(CORDELIA, { team: ['primarina'], size: 1, win: [moment('You beat Lady Cordelia and her Primarina')], lose: [moment('Lady Cordelia\'s Primarina beat you')] }), C.set('done'))),
      ch('"Congratulate her mother."', out('Her mother turns, surprised, and then takes both your hands. She thanks you, her voice not quite steady, for being kind to her daughter when she needed someone to be. She presses a Silk Scarf into your hands, the softest thing you have ever held.', item('silk-scarf'), C.set('done'))),
      ch('"Ask what\'s next."', out('Cordelia: "Seven more." She grins, a real grin with mud-ditch in it, nothing like the girl under the parasol. Her mother sighs the sigh of a woman who already knows she will be coming to all seven.', C.set('done'))),
    ],
    remembers: [
      variant('stable', [C.is('home')], {
        intro:
          'A riding stable at the edge of a quiet town, all fresh hay and creaking gates. Cordelia is mucking out a stall in tall boots, with no badge anywhere on her. She is quieter than she was. ' +
          'But she runs this place now, every Ponyta and Rapidash in it, and when she leans on the paddock fence to watch them run, she looks free in a way the lace never let her. Her mother is there too, leaning on the same fence.',
        hide: [2],
        add: [ch('"Ask what\'s next."', out('Cordelia does not say "seven more." She looks out at the paddock, where a young Ponyta is learning to jump, and she grins anyway. Whatever is next, it is hers to choose.', C.set('done')))],
      }),
    ],
  }),
];

// ---------- RR24. Lass Janice (morning, afternoon; Clefairy, Jigglypuff, Togetic) ----------
const JA = rosterKit('janice', 'npc-meet-lass-janice', 'Lass Janice');
const JANICE = 'Lass Janice';

const janice: Json[] = [
  JA.meet(1, {
    title: 'Gentle',
    intro:
      'A meadow so full of clover that it smells sweet. A girl sits cross-legged in the middle of it, braiding daisies into a Clefairy\'s ears while a Jigglypuff waits its turn with a flower already tucked behind one ear. ' +
      'She sees your Poké Balls and holds the Clefairy a little closer. Janice: "Be gentle, okay? They\'re my friends."',
    choices: [
      ch('"I will."', fight('Janice smiles, all teeth, and sets them down in the clover. You promise yourself to win without ever hitting harder than you need to. If you can manage it, she is going to be thrilled.',
        spar(JANICE, { team: ['clefairy', 'jigglypuff'], size: 2, win: [JA.set('gentle'), moment('You beat Lass Janice gently, as you promised')], lose: [moment('Lass Janice\'s friends beat you')] }), JA.set('m1'))),
      ch('"Battle normally."', fight('Janice nods bravely and sets them down. You battle her the way you battle anyone. Afterwards she cries a little into Clefairy\'s fur, and you are not sure she knows she is doing it.',
        spar(JANICE, { team: ['clefairy', 'jigglypuff'], size: 2, win: [moment('You beat Lass Janice, and she cried a little after')], lose: [moment('Lass Janice\'s friends beat you')] }), JA.set('m1'))),
      ch('"Can I just watch?"', out('Janice beams. You sit in the clover and watch her finish the braids, and the Jigglypuff falls asleep in your lap. When you go, she gives you a Pecha Berry from her pocket, a little squashed, for free.', item('pecha-berry'))),
    ],
  }),
  JA.meet(2, {
    title: 'The Bully',
    intro:
      'Behind a schoolhouse, by the bins. A boy a head taller than Janice is shoving her backwards, one hand on her shoulder, while her Clefairy hides behind her legs. Kent is the school bully, and he knows it. ' +
      'Kent: "Fairy-types are for babies."',
    choices: [
      ch('"Battle Kent."', fight('You step between them. Kent sneers and throws out a Machop, which flexes. Janice holds her breath behind you.',
        spar('Bully Kent', { team: ['machop'], size: 1, win: [moment('You beat Bully Kent and stood up for Janice')], lose: [moment('Bully Kent\'s Machop beat you, but you stood up for Janice')] }), JA.set('m2'), JA.set('protected'))),
      ch('"Let Janice battle him."', out('Janice shakes, but she steps forward. Her Clefairy wags a finger, Metronome, and out of nowhere comes a move nobody has ever seen a Clefairy use. Kent\'s Machop falls flat. Janice stares at her Clefairy, then at Kent, then at you, amazed.', JA.set('m2'), JA.set('won'))),
      ch('"Talk to Kent."', out('It takes a while. Then it comes out, all in a rush: Kent\'s little sister has a Fairy-type, and everyone at home fusses over it, and nobody fusses over him. He is jealous. He kicks a bin, and then he says sorry to Janice, very quietly, to the ground.', JA.set('m2'), JA.set('kent'))),
    ],
    remembers: [
      variant('gentle', [JA.is('gentle')], { notice: 'Janice wipes her nose and stands up straighter when she sees you. Janice: "You were gentle. So I\'ll be brave."' }),
    ],
  }),
  JA.meet(3, {
    title: 'Clefable',
    intro:
      'The clover meadow again, on a bright Saturday. Janice and Kent sit on the same blanket, her Clefairy beside his new Snubbull, with a scoreboard scratched on a slate between them. It is very long. ' +
      'Janice: "Kent and me battle every Saturday now. He still loses." Kent goes red at once. Kent: "I don\'t always lose!"',
    choices: [
      ch('"Battle them both."', fight('They look at each other and grin. Janice and Kent stand side by side, and four Pokémon step forward, two by two. Afterwards Janice gives you a Pixie Plate, which she says is for being the best Saturday ever.',
        spar('Janice and Kent', { format: 'doubles', team: ['clefairy', 'machop', 'togetic', 'snubbull'], size: 4, win: [moment('You beat Janice and Kent together')], lose: [moment('Janice and Kent beat you together')] }), item('pixie-plate'), JA.set('done'))),
      ch('"Watch them battle."', out('You sit on the blanket and keep score. It goes back and forth all afternoon, and in the end both of their Pokémon fall over at the very same moment. They tie. Kent cheers like he has won. Janice gives you a Pixie Plate for being the judge.', item('pixie-plate'), JA.set('done'))),
      ch('"Give them a Moon Stone."', out('You hold out the Moon Stone. Clefairy touches it, very gently, and the light takes her. The Clefable that sits up in the clover is tall and pale as the moon, and she still has a daisy in one ear. Janice cries happy tears and gives you a Pixie Plate.', lose('moon-stone'), item('pixie-plate'), JA.set('done')), { requires: [has('moon-stone')] }),
    ],
  }),
];

// ---------- RR25. Painter Vera (morning, afternoon; Smeargle) ----------
const V = rosterKit('vera', 'npc-meet-painter-vera', 'Painter Vera');
const VERA = 'Painter Vera';
const veraReward = (what: string): Json[] => [moment(`Vera's painting: ${what}`), egg({ species: ['smeargle'] })];

const vera: Json[] = [
  V.meet(1, {
    title: 'Canvas',
    intro:
      'An easel on the edge of a windy cliff, its legs weighed down with rocks. A painter in a paint-stiff smock stands at it, and beside her a Smeargle whose tail is dripping blue onto the grass in fat, happy drops. The sea below is the same blue. ' +
      'She turns, brush between her teeth, and takes it out to speak. Vera: "Every battle is a canvas. Let\'s paint."',
    choices: [
      ch('"Battle."', fight('Vera wipes her brush on her smock and nods to Smeargle. It flicks its tail and watches you very closely. Whatever your first move is, it is going to Sketch it.',
        spar(VERA, { team: ['smeargle'], size: 1, foeMoves: ['sketch'], win: [moment('You beat Painter Vera on the cliff')], lose: [moment('Painter Vera\'s Smeargle beat you with your own move')] }), V.set('m1'))),
      ch('"Paint me."', out('Vera sits your whole team down on the rocks and paints fast, squinting, while Smeargle adds the sky with its tail. It takes an hour. When she turns the canvas round, it is all of you, a little windswept, looking braver than you feel. She says it will hang somewhere you can see it.', moment('Painter Vera painted your team on a cliff top'), V.set('m1'), V.set('portrait'))),
      ch('"Leave."', out('You leave her to the wind and the sea. When you look back from the path, she has already started something new, and it is mostly blue.')),
    ],
  }),
  V.meet(2, {
    title: 'Blank',
    intro:
      'Vera\'s studio, up three flights of stairs. A hundred canvases lean against the walls, and every single one is blank. The paints have dried in their pots. Smeargle lies on the floor with its tail tucked under its chin, not dripping anything. ' +
      'Vera: "I can\'t paint anything. Not since my show was panned."',
    choices: [
      ch('"Paint what you see."', out('She looks up, and what she sees is you, standing in her doorway. She picks up a brush. Then another. She paints you, quickly and then slowly, and doesn\'t stop until the window has gone gold. Smeargle\'s tail starts to drip again.', V.set('m2'), V.set('see'))),
      ch('"Paint a battle."', fight('Vera props a canvas against the wall and stands back. Smeargle gets up. Every hit it lands leaves a stroke of colour on the canvas behind it, red, gold, a long swoop of green.',
        spar(VERA, { team: ['smeargle'], size: 1, win: [moment('You battled Painter Vera\'s Smeargle onto a canvas')], lose: [moment('Painter Vera\'s Smeargle beat you and painted the whole thing')] }), V.set('m2'), V.set('battle'))),
      ch('"Burn the reviews."', out('You carry the bundle of newspapers down to the yard together and light them. The bonfire is small and smells of ink. Vera starts to laugh, really laugh, and she is still laughing when she runs back up the stairs and starts.', V.set('m2'), V.set('burnt'))),
    ],
  }),
  V.meet(3, {
    title: 'The Gallery',
    intro:
      'A gallery opening, white walls, clinking glasses, Smeargle in a bow tie. Vera\'s paintings are everywhere, bright and alive. One of them, in the place of honour, is of you. ' +
      'Vera: "The critic came back. He bought the one of you." She snorts into her drink. Vera: "I told him it wasn\'t for sale. Then I sold it to him anyway. Rent."',
    choices: [
      ch('"Buy it."', out('The critic, overhearing, turns out to be a reasonable man. For 500 he lets the painting go home with the person in it. Vera promises it will hang where you can see it, and she slips you one of Smeargle\'s eggs as well, wrapped in a paint rag.', $(-500), ...veraReward('your portrait from the gallery'), V.set('done')), { requires: [money(500)] }),
      ch('"Battle."', fight('Vera grins and nods to Smeargle. It has been busy: its tail carries a whole palette of moves, every one Sketched from somebody. Afterwards she gives you a small painting of the fight and one of Smeargle\'s eggs.',
        spar(VERA, { team: ['smeargle'], size: 1, foeMoves: ['spore', 'flamethrower'], win: [moment('You beat Painter Vera\'s fully Sketched Smeargle')], lose: [moment('Painter Vera\'s fully Sketched Smeargle beat you')] }), ...veraReward('the battle at the gallery'), V.set('done'))),
      ch('"Ask for one of my starter."', out('Vera sits your starter on a stool in the middle of the opening, and everyone watches her paint it. It sits so still and proud that it nearly bursts. When you take the portrait home, your starter keeps looking at it, and at you. Vera tucks a Smeargle egg in with it.', { kind: 'friendship', amount: 5, who: 'picked' }, ...veraReward('a portrait of your starter'), V.set('done'))),
    ],
  }),
];

// ---------- RR26. Picnicker Gina (morning, afternoon; Bellsprout, Skiploom, Shroomish) ----------
const G = rosterKit('gina', 'npc-meet-picnicker-gina', 'Picnicker Gina');
const GINA = 'Picnicker Gina';
const ginaMeal = stopHere('heal');

const gina: Json[] = [
  G.meet(1, {
    title: 'Sandwiches',
    intro:
      'A red-checked blanket spread out in a field of buttercups, a wicker basket with its lid propped open, and a girl in a sunhat waving both arms at you like you are late. Her Bellsprout is already holding a sandwich. ' +
      'Gina: "We packed sandwiches for the whole team!"',
    choices: [
      ch('"Eat."', out('You sit down, and Gina hands out sandwiches to everyone, one each, cut into triangles with the crusts off. Your team eats in the sun until their bellies are round. It does them a little good.', heal(0.1), G.set('m1'))),
      ch('"Battle."', fight('Gina claps and jumps up, brushing crumbs off her skirt. Bellsprout and Skiploom bounce out onto the grass.',
        spar(GINA, { team: ['bellsprout', 'skiploom'], size: 2, win: [moment('You beat Picnicker Gina in a buttercup field')], lose: [moment('Picnicker Gina beat you in a buttercup field')] }), G.set('m1'))),
      ch('"Both."', fight('Gina: "Battle first, then eat?" You nod. She already has a sandwich ready for after, wrapped in a napkin, set aside for the winner and the loser both.',
        spar(GINA, { team: ['bellsprout', 'skiploom'], size: 2, win: [heal(0.1), moment('You beat Picnicker Gina, then shared her sandwiches')], lose: [heal(0.1), moment('Picnicker Gina beat you, then shared her sandwiches')] }), G.set('m1'))),
    ],
  }),
  G.meet(2, {
    title: 'Rain',
    intro:
      'Rain coming down in sheets. Gina stands under a dripping tree with her checked blanket held over the basket like a tent, but it is far too late. Bellsprout droops. ' +
      'Gina: "The sandwiches are soup now." Her voice wobbles. Gina: "I planned this for a week. It\'s my mum\'s birthday picnic and she\'s on her way."',
    choices: [
      ch('"Picnic in the rain."', out('You spread the soggy blanket right out in the open and sit down on it. Gina stares at you, then sits down too. Out of the puddles come Water-types, a Psyduck, a Wooper, a line of Lotad, all delighted, and they join the picnic. When her mum arrives, soaked, she says it is the best picnic she has ever had.', G.set('m2'), G.set('rain'))),
      ch('"Find shelter."', out('You find a shallow cave in the hillside and carry the basket in between you. Something is already in there: a wild Shroomish, sheltering from the rain too, blinking at you. It shuffles over to make room. When Gina\'s mum finds them, there is a little fire going and the Shroomish is asleep on Gina\'s foot.', G.set('m2'), G.set('cave'))),
      ch('"Share mine."', out('You give her a Berry from your bag, the best one you have, and Gina cuts it into a birthday shape with a butter knife. In return she writes out a recipe on a damp napkin: her mum\'s own sandwich, the one that never goes soggy. She makes you promise not to tell.', moment('Gina gave you her mum\'s secret sandwich recipe'), G.set('m2'), G.set('shared'))),
    ],
  }),
  G.meet(3, {
    title: 'Café',
    intro:
      'A little café with blue shutters, a hand-painted sign over the door that says GINA\'S, and the smell of fresh bread drifting halfway down the road. Inside, Gina wears an apron instead of a sunhat. A Jumpluff floats about the ceiling and a Breloom is washing up. ' +
      'Gina: "Mum said I should cook for people who aren\'t on a blanket." She waves her spoon at the tables. Gina: "Sit anywhere. Your team eats free." A corner by the window is kept for travellers to rest.',
    choices: [
      ch('"Eat."', out('She feeds your whole team until they cannot move. Soup, bread, a cake with a candle in it for no reason at all. Everyone comes out of GINA\'S full, warm and fully healed, and she tells you the corner table is yours whenever you pass.', heal(1), ginaMeal, G.set('done'))),
      ch('"Battle."', fight('Gina takes off her apron and folds it very neatly. Jumpluff drifts down from the ceiling; Breloom dries its hands. Gina: "After, you eat."',
        spar(GINA, { team: ['jumpluff', 'breloom'], size: 2, win: [moment('You beat Gina at her own café')], lose: [moment('Gina beat you at her own café')] }), ginaMeal, G.set('done'))),
      ch('"Cook with her."', out('You get the heat just right. Gina tastes it, closes her eyes, and calls it the dish of the day. Whoever eats it will fight a little stronger in the next battle.',
        { kind: 'tempEffect', label: 'Gina\'s dish of the day: your team hits a little harder in the next battle', effects: [{ kind: 'statMultiplier', stat: 'atk', value: 1.05 }], battles: 1, until: 'battle' }, ginaMeal, G.set('done')),
      { prompt: { id: 'gauge-hold', needs: 'good' }, fail: out('The pan smokes and the dish comes out a bit black on one side. Gina laughs so hard she has to sit down, then eats the burnt half herself so you can have the good half. It is still delicious.', ginaMeal, G.set('done')) }),
    ],
  }),
];

// ---------- RR27. Poké Maniac Rex (afternoon, evening; Kangaskhan, Rhydon, Lickitung) ----------
const RX = rosterKit('rex', 'npc-meet-poke-maniac-rex', 'Poké Maniac Rex');
const REX = 'Poké Maniac Rex';

const rex: Json[] = [
  RX.meet(1, {
    title: 'All of Them',
    intro:
      'A man in a rubber Kangaskhan costume comes puffing down the road, the head pushed back like a hood so you can see his red, happy face. Under one arm he carries a binder so stuffed with cards that it is held shut with a belt. ' +
      'Rex: "I collect them all, and I mean all!"',
    choices: [
      ch('"Battle."', fight('Rex sets the binder down very carefully on a dry rock before anything else. Then he lets out a real Kangaskhan, which looks at his costume with deep suspicion, and a Rhydon.',
        spar(REX, { team: ['kangaskhan', 'rhydon'], size: 2, win: [moment('You beat Poké Maniac Rex')], lose: [moment('Poké Maniac Rex beat you')] }), RX.set('m1'))),
      ch('"Show me the binder."', out('He unbuckles it with shaking fingers and shows you every page. Hundreds of cards, each in its own sleeve, each with a story he tells you whether you ask or not. One of them is rare, truly rare, and he lets you hold it for exactly three seconds.', RX.set('m1'))),
      ch('"Trade?"', out('Rex\'s eyes go huge. He checks his binder against your party, muttering, and finds one he has never had. He trades you for it on the spot, any Pokémon he has for the one he lacks, and shakes your hand for a full minute.', trade('a Pokémon Rex does not have yet'), join({}), RX.set('traded'))),
    ],
  }),
  RX.meet(2, {
    title: 'Missing Page',
    intro:
      'Rex is on his knees at the side of the road with the binder open in front of him, turning pages back and forth, back and forth. The costume\'s head has come off and rolled into the ditch. He does not notice. ' +
      'Rex: "Page forty-two. Gone. The one card I\'d never trade."',
    choices: [
      ch('"Search."', out('You get him on his feet and look at the ground together. There, in the dust beside the binder: small, five-toed pawprints, and the torn corner of a card sleeve, heading off the road.', room(RX.roomId('search')))),
      ch('"Who took it?"', out('Rex goes very still. Then he remembers a face at the last town, a quick pair of hands. He finds Burglar Quinn by the fountain, and Quinn, looking at the empty sleeve, does not argue. Quinn gives it back, and even says sorry.', RX.set('m2'), RX.set('quinn')), { requires: [flagIs('roster-quinn-m1')] }),
      ch('"It\'s just a card."', out('Rex stops turning pages. He does not look up. Rex: "It was my dad\'s." He closes the binder very gently and holds it on his knees, and you wish you could take the words back.', RX.set('m2'), RX.set('cold'))),
    ],
  }),
  RX.room('search', {
    title: 'The Trail',
    intro:
      'The pawprints lead off the road and into the trees. Rex follows close behind you in his costume, squeaking. A banana peel. Another. A second torn corner of plastic, caught on a thorn. Somewhere ahead, something is chattering to itself.',
    choices: [
      ch('Follow the pawprints.', out('You follow them over a stream and up a bank. The chattering gets louder.', room(RX.roomId('thief')))),
      ch('Follow the banana peels.', out('The peels lead in a straight, greedy line. Rex picks each one up and puts it in his costume pouch, because he cannot stand litter.', room(RX.roomId('thief')))),
    ],
  }),
  RX.room('thief', {
    title: 'The Thief',
    intro:
      'One more bend, and there it is: a Mankey sitting high in a tree, turning page forty-two over in its paws, sniffing it, holding it up to the light. It has no idea what it is. It just knows it was shiny and somebody loved it. Rex makes a small sound like a kettle.',
    choices: [
      ch('"Battle it."', fight('The Mankey shrieks and drops out of the tree, the card clamped in its teeth.',
        wildSpar({ species: ['mankey'], win: [moment('You got page forty-two back from a Mankey')], lose: [moment('A Mankey beat you, but dropped page forty-two in the scuffle')] }), RX.set('m2'), RX.set('found'))),
      ch('"Offer it a snack."', out('You hold out a Berry. The Mankey thinks about it for a long time. Then it trades: card down, Berry up. Rex holds page forty-two against his chest and cries into his rubber costume, and the Mankey watches him, puzzled, eating.', RX.set('m2'), RX.set('found'))),
    ],
  }),
  RX.meet(3, {
    title: 'Exhibition',
    intro:
      'A small museum, cool and quiet, with one room full of Rex: cards in frames, costumes on stands, a Kangaskhan suit worn thin at the knees. Rex stands in the doorway in a borrowed tie. ' +
      'Rex: "Forty years of cards and costumes. The museum gave me a whole room." He leads you to the middle, where one card sits alone under a light. Rex: "Page forty-two has its own glass case."',
    choices: [
      ch('"Battle."', fight('Rex grins and opens a case marked DO NOT TOUCH. Out come six of the oddest Pokémon you have ever seen in one team, each of them a collector\'s piece.',
        spar(REX, { team: ['kangaskhan', 'rhydon', 'lickitung', 'sudowoodo', 'spinda', 'unown'], size: 6, win: [moment('You beat Poké Maniac Rex\'s six odd Pokémon')], lose: [moment('Poké Maniac Rex\'s six odd Pokémon beat you')] }), RX.set('done'))),
      ch('"Donate something."', out('You give him something from your bag for the collection, and Rex looks at it as though it were treasure. He writes your name on a little card beside it. His thanks is a Rare Candy, taken from his own pocket.', lose(), item('rare-candy'), RX.set('done'))),
      ch('"See page forty-two."', out('Rex lifts the glass. On the card, in faded ink in the corner, is a signature: Professor Oak\'s father. Rex\'s dad got it signed as a boy. Rex lets you hold it, and this time it is a lot longer than three seconds.', moment('You held page forty-two, signed by Professor Oak\'s father'), RX.set('done'))),
    ],
  }),
];

// ---------- RR28. Pokémon Breeder Delia (afternoon, evening; Chansey, Miltank, Audino) ----------
const D = rosterKit('delia', 'npc-meet-pokemon-breeder-delia', 'Pokémon Breeder Delia');
const DELIA = 'Pokémon Breeder Delia';

const delia: Json[] = [
  D.meet(1, {
    title: 'Since the Egg',
    intro:
      'A ranch fence, white paint flaking, with Miltank grazing in the field behind it. A woman in a flour-dusted apron leans on the gate, a Chansey at her side carrying an egg in its pouch as carefully as a held breath. ' +
      'Delia: "Raised with love since the egg."',
    choices: [
      ch('"Battle."', fight('Delia unties her apron and hangs it on the gatepost. Chansey sets its egg down in the grass, very gently, and then turns around ready to fight. A Miltank ambles over to join it.',
        spar(DELIA, { team: ['chansey', 'miltank'], size: 2, win: [moment('You beat Pokémon Breeder Delia at her ranch')], lose: [moment('Pokémon Breeder Delia beat you at her ranch')] }), D.set('m1'))),
      ch('"How do you raise them?"', out('Delia talks for an hour, leaning on the gate: warm straw, a radio playing low at night, a hand on the shell every morning so it knows you. You come away with one tip you will never forget. The next egg you carry should hatch a stage sooner.', D.set('m1'), D.set('hatch-sooner'))),
      ch('"Can I see the eggs?"', out('She takes you to the warm barn. One egg in the straw is wobbling. As you watch, it cracks, and out pops an Audino, damp and blinking, who looks at you first. Delia laughs. That settles it: it is yours.', join({ species: ['audino'] }), D.set('m1'))),
    ],
  }),
  D.meet(2, {
    title: 'Sick Ranch',
    intro:
      'The ranch, but quiet. Too quiet: no lowing, no bells. The Miltank lie in the barn straw with their eyes half shut. Delia sits on an upturned bucket among them, grey with tiredness, a cold cup of tea forgotten in her hands. ' +
      'Delia: "Something\'s in the water. The Miltank are sick."',
    choices: [
      ch('"Find the source."', out('You fill a jar from the trough and hold it to the light. There is a faint, oily rainbow on top. You head upstream.', room(D.roomId('upstream')))),
      ch('"Bring a doctor."', out('You run to the nearest Pokémon Center, and Nurse Joy comes back with you in a trap with a Chansey at the reins. It takes a stage of nights and mornings, and drips, and bitter medicine, but one by one the Miltank get up again. Delia sleeps for a whole day.', D.set('m2'), D.set('doctor'))),
      ch('"Help her nurse them."', out('You stay. You carry water from the well, hold the medicine bottles, sit up with the worst of them through the night. Your own team curls up in the warm straw and rests too. In the morning Delia presses three bottles of Moomoo Milk on you, from the first Miltank to get better.', heal(0.5), item('moomoo-milk', 3), D.set('m2'), D.set('nursed'))),
    ],
  }),
  D.room('upstream', {
    title: 'Upstream',
    intro:
      'The stream runs clear for a long way, and then it doesn\'t. Two bends of the road on, the water turns cloudy. A Magikarp lies on its side in the shallows, gasping. Further up, you can hear voices, and the clank of metal on metal.',
    choices: [
      ch('Keep following the stream.', out('You stay low and keep going, toward the voices.', room(D.roomId('dumping')))),
      ch('Carry the Magikarp to clean water first.', out('You scoop it into your arms and run it back down to where the water is clear. It flips once and swims away. Then you go back up toward the voices.', room(D.roomId('dumping')))),
    ],
  }),
  D.room('dumping', {
    title: 'The Dumping',
    intro:
      'A clearing by the bank. Grunts from an evil team in matching uniforms are rolling rusty barrels down to the water and tipping them in, one after another. The stream below them runs green.',
    choices: [
      ch('"Stop them."', fight('You walk out into the clearing. The grunts drop the barrel they are holding and reach for their Poké Balls.',
        spar('Evil team grunts', { types: ['poison'], size: 2, win: [moment('You stopped the dumping upstream of Delia\'s ranch')], lose: [moment('The grunts beat you, but they ran before they could dump any more')] }), D.set('m2'), D.set('source'))),
      ch('Count the barrels for Delia.', out('You stay hidden and note every barrel, every uniform, every word. When you bring it all back, Delia goes straight to the town with it, white with anger. By the end of the week the barrels are gone and the stream is clearing.', D.set('m2'), D.set('source'))),
    ],
  }),
  D.meet(3, {
    title: 'Calving',
    intro:
      'The barn at night, one lamp hung from a beam. A Miltank lies in the straw, breathing hard; she is giving birth, and too early. Delia kneels beside her with her sleeves rolled up. ' +
      'Delia: "She\'s early. Of course she\'s early. Hold the lamp, please." You hold it. Delia does not look up. Delia: "If anything goes wrong, you\'re the only one here with a Pokémon that knows Heal Pulse. Or anything like it."',
    choices: [
      ch('"Help."', out('You kneel in the straw, and your team presses in close and warm, and everything goes right. The calf comes into the world all legs and wet ears. By morning it has decided you are its mother, and Delia says it would be cruel to argue: the Miltank calf joins you.', join({ species: ['miltank'] }), D.set('done'))),
      ch('"Watch."', out('You hold the lamp steady through the whole long night and do not say a word. The calf is born just before dawn. Delia sits back in the straw and laughs, and laughs, and gives you the Lucky Egg from her apron pocket.', item('lucky-egg'), D.set('done'))),
      ch('"Battle after."', fight('Mother and calf are asleep in the straw. Delia washes her hands, rolls her sleeves down, and leads you out into the yard, where a Blissey is waiting under the stars. Delia is too happy to sleep.',
        spar(DELIA, { team: ['blissey'], size: 1, win: [moment('You beat Pokémon Breeder Delia\'s Blissey under the stars')], lose: [moment('Pokémon Breeder Delia\'s Blissey beat you')] }), D.set('done'))),
    ],
  }),
];

// ---------- RR29. Pokémon Ranger Hal (afternoon, evening; Arcanine, Staraptor) ----------
const H = rosterKit('hal', 'npc-meet-pokemon-ranger-hal', 'Pokémon Ranger Hal');
const HAL = 'Pokémon Ranger Hal';
const halReward = [moment('Ranger Hal gave you a Ranger\'s Styler'), item('charcoal')];

const hal: Json[] = [
  H.meet(1, {
    title: 'Keep the Wild Safe',
    intro:
      'A forest checkpoint: a striped barrier pole, a hut with a tin roof, a noticeboard of lost-Pokémon posters. A ranger in a green uniform stands at a map pinned to the hut wall, tracing paths with one finger. An Arcanine lies across the doorway like a draught excluder. ' +
      'Hal: "Keep the wild safe, and the wild keeps us safe."',
    choices: [
      ch('"Battle."', fight('Hal clicks his tongue once. The Arcanine rises, stretches, and steps out onto the path, and the air around it goes warm.',
        spar(HAL, { team: ['arcanine'], size: 1, win: [moment('You beat Pokémon Ranger Hal\'s Arcanine')], lose: [moment('Pokémon Ranger Hal\'s Arcanine beat you')] }), H.set('m1'))),
      ch('"Any trouble?"', out('Hal taps the map, hard. There is a poacher camp nearby, close enough to smell their fire. He has been waiting for a second pair of hands. He marks the way for you.', H.set('m1'), H.set('poachers'), room(H.roomId('poachers')))),
      ch('"Leave."', out('Hal nods and goes back to his map. As you walk away, the Arcanine lifts its head and watches you all the way to the trees.')),
    ],
  }),
  H.room('poachers', {
    title: 'The Poacher Camp',
    intro:
      'A side path, then a clearing: a smoky fire, a tarpaulin, nets drying on a line, and a row of cages. In the cages, wild Pokémon pressed against the bars, too frightened to cry. Two poachers are arguing over a map.',
    choices: [
      ch('"Battle the poachers."', fight('You step out of the trees. The poachers jump up, knocking over their tea, and reach for their Poké Balls.',
        spar('Poachers', { size: 2, win: [moment('You beat the poachers near Hal\'s checkpoint and opened their cages')], lose: [moment('The poachers beat you, but Hal arrived in time to open their cages')] }))),
      ch('Open the cages quietly.', out('You creep along the row and pull the pins out one by one. The cage doors swing open. Not one of the wild Pokémon makes a sound as they slip away into the trees. By the time the poachers look round, the cages are empty.', moment('You quietly freed the poachers\' cages near Hal\'s checkpoint')),
      { prompt: { id: 'pull-hold', needs: 'ok' }, fail: fight('The last pin sticks, and squeals. The poachers look round. The wild Pokémon are already running, but now you have to deal with the poachers.',
        spar('Poachers', { size: 2, win: [moment('You freed the poachers\' cages, then beat the poachers')], lose: [moment('You freed the poachers\' cages, but the poachers beat you')] })) }),
    ],
  }),
  H.meet(2, {
    title: 'The Fire',
    intro:
      'Smoke over the trees, thick and yellow. The sky has gone the colour of tea. Hal stands at a fire line with a shovel, his face black with soot, Arcanine beside him growling at the flames as if they were an enemy. ' +
      'Hal: "Need Water-types. Now."',
    choices: [
      ch('"Fight the fire."', out('Your Water-types step up to the line. For three long turns they pour out every Water move they have, Hal shouting where to aim, until the steam is thicker than the smoke and the front line hisses and dies. Hal leans on his shovel and closes his eyes.', H.set('m2'), H.set('fire')), { requires: [ptype('water')] }),
      ch('"Evacuate the wild."', out('You go in where the smoke is thinnest and come out carrying them: a singed Pidgey, a baby Ponyta too young to run fast, a Bidoof frozen with fear. Three wild Pokémon, carried out one at a time. Hal counts them as you set them down, and his hands shake.', H.set('m2'), H.set('evac'))),
      ch('"Find who started it."', out('You follow the line of the fire back to where it began. Poachers, clearing ground: stumps soaked in fuel, cut wire, a dropped lighter. You bring Hal everything you found. His face goes very still.', H.set('m2'), H.set('arson'))),
    ],
  }),
  H.meet(3, {
    title: 'After',
    intro:
      'The burnt forest, black trunks standing in rows. But between them, everywhere, there are green shoots coming through the ash. A Bidoof is building a dam out of charcoal sticks. Hal crouches by a seedling, touching it like it might break. ' +
      'Hal: "It\'s growing back. Faster than I thought." He stands, dusting off his knees. Hal: "The poachers who set it are in court next week. I\'m the witness."',
    choices: [
      ch('"Plant."', out('You plant until your hands are black, a row of acorns and berry seeds, Hal working beside you without talking. When you stop, the row runs all the way to the stream. Hal gives you his old Ranger\'s Styler to remember it by, and a lump of Charcoal from the burn.', ...halReward, H.set('done'))),
      ch('"Battle."', fight('Hal whistles. Arcanine and Staraptor come down out of the green, and they are much, much stronger than before. The fire changed them too.',
        spar(HAL, { team: ['arcanine', 'staraptor'], size: 2, lv: 2, win: [moment('You beat Pokémon Ranger Hal in the regrowing forest')], lose: [moment('Pokémon Ranger Hal beat you in the regrowing forest')] }), ...halReward, H.set('done'))),
      ch('"Ride patrol."', out('You ride the patrol with Hal, Arcanine loping ahead. He shows you every hollow log, every bird\'s nest, every place the wild hides what it wants to keep. For the rest of the region, you will know where to look for hidden things. He gives you a spare Ranger\'s Styler and a lump of Charcoal.',
        forRegion('Ranger patrol: you know where things are hidden', { kind: 'hiddenItemChance', chance: 1 }), ...halReward, H.set('done'))),
    ],
  }),
];

// ---------- RR30. Pokémon Ranger Willa (afternoon, evening; Pachirisu, Lopunny) ----------
const W = rosterKit('willa', 'npc-meet-pokemon-ranger-willa', 'Pokémon Ranger Willa');
const WILLA = 'Pokémon Ranger Willa';
const willaBuneary = join({ species: ['buneary'] });

const willa: Json[] = [
  W.meet(1, {
    title: 'Capture On',
    intro:
      'A clearing, and a ranger in a red jacket spinning a capture disc in tight, glowing circles around a wild Pokémon. The loops close in, softer and softer, until the Pokémon stops running and just sits, calm, in the middle. She whoops. ' +
      'Willa: "Capture on, ranger style!"',
    choices: [
      ch('"Battle."', fight('Willa catches the disc out of the air and grins. A Pachirisu scrambles up onto her shoulder, crackling, and a Lopunny drops down out of a tree beside her.',
        spar(WILLA, { team: ['pachirisu', 'lopunny'], size: 2, win: [moment('You beat Pokémon Ranger Willa')], lose: [moment('Pokémon Ranger Willa beat you')] }), W.set('m1'))),
      ch('"Try the disc."', out('Willa shows you the grip. You draw your circles around a wild Pokémon in the long grass, slow and steady, and the loops hold. It stops, looks up at you, and walks over of its own accord. Befriended. Willa whoops loud enough for both of you.', join({}), W.set('m1')),
      { prompt: { id: 'tilt-drag', needs: 'good' }, fail: out('Your loops wobble and break, and the wild Pokémon bolts into the trees. Willa claps you on the back anyway. Willa: "First try, I hit myself in the face."', W.set('m1')) }),
      ch('"Leave."', out('You leave her to it. Behind you, the disc hums and the clearing fills with soft light.')),
    ],
  }),
  W.meet(2, {
    title: 'The Failed Capture',
    intro:
      'Rain on a muddy path. Willa sits on a stump in it with her hood down, getting soaked, turning her capture disc over in her hands. It is cracked right across. Her Pachirisu is huddled inside her jacket. ' +
      'Willa: "A Pokémon panicked. Hurt itself running from me."',
    choices: [
      ch('"Find it."', out('You search the brambles together until your sleeves are torn. Under a fallen log you find it: a Buneary with a hurt leg, shivering, ears flat. Willa takes off her jacket and wraps it up, and talks to it very softly all the way back to the Center.', W.set('m2'), W.set('found'))),
      ch('"Fix the disc."', out('You sit under a tree with the disc between you, and a wild Magnemite, drawn by the hum, drifts down to help. It welds the crack with a tiny blue spark. When Willa spins the disc, it is smoother than it was before. Better.', W.set('m2'), W.set('fixed'))),
      ch('"Rest."', out('You make her come in out of the rain. She sleeps for a whole afternoon by a fire, with Pachirisu on her chest. When she wakes she looks younger. She will be better next time, and she knows it.', W.set('m2'), W.set('rested'))),
    ],
  }),
  W.meet(3, {
    title: 'Partner',
    intro:
      'Willa coming down the path on patrol, and hopping at her heel, a Buneary with one ear that never quite stands up. Behind it, trying very hard not to be noticed, hops a second, smaller Buneary. ' +
      'Willa: "She wouldn\'t leave once her leg healed. Kept following me on patrol." She scoops the Buneary up. Willa: "First partner I didn\'t capture. She captured me." The little one has been following too, she says. It seems to like the look of you.',
    choices: [
      ch('"Battle."', fight('Willa sets her Buneary down beside Lopunny. The little one watches from the grass, ears up, taking notes. Afterwards it hops straight over to you.',
        spar(WILLA, { team: ['lopunny', 'buneary'], size: 2, win: [moment('You beat Pokémon Ranger Willa and her partner Buneary')], lose: [moment('Pokémon Ranger Willa and her partner Buneary beat you')] }), willaBuneary, W.set('done'))),
      ch('"Ride along."', out('You ride the patrol with Willa, taking the ranger trails that cut straight through the forest. You skip a whole stretch of the road ahead. At the end of it, the little Buneary is riding on your shoulder and will not get off.', { kind: 'skipAhead' }, willaBuneary, W.set('done'))),
      ch('"Train her."', out('You train with Buneary all afternoon, the little one copying every move from the grass. By sunset they have both learned Jump Kick, and the little one does it right into your arms. It goes with you.', willaBuneary, { kind: 'teachMove', move: 'jump-kick', species: 'buneary' }, W.set('done'))),
    ],
  }),
];

// ---------- RR31. Psychic Edmund (night; Kadabra, Xatu, Bronzong) ----------
const E = rosterKit('edmund', 'npc-meet-psychic-edmund', 'Psychic Edmund');
const EDMUND = 'Psychic Edmund';
const edmundSpoon = item('twistedspoon');

const edmund: Json[] = [
  E.meet(1, {
    title: 'Knew You Were Coming',
    intro:
      'A crossroads at midnight, under a signpost with all its arms pointing the wrong way. A thin man in a cape stands in the middle of it, and he is already looking straight at you, as if he has been waiting for hours. Perhaps he has. ' +
      'Edmund: "I knew you were coming." He smiles thinly. Edmund: "I also know you\'ll pick the middle button."',
    choices: [
      ch('"Wrong."', fight('Edmund blinks. He looks shaken, really shaken, and his cape suddenly seems too big for him. He battles badly, his Kadabra glancing back at him for orders that come a beat too late.',
        spar(EDMUND, { team: ['kadabra', 'xatu'], size: 2, lv: -1, win: [moment('You broke Psychic Edmund\'s trick, and beat him')], lose: [moment('Psychic Edmund beat you, even shaken')] }), E.set('m1'), E.set('shaken'))),
      ch('"Battle."', fight('Edmund: "See?" He sweeps his cape back. Kadabra and Xatu are out before you have finished reaching for your Poké Ball.',
        spar(EDMUND, { team: ['kadabra', 'xatu'], size: 2, win: [moment('You beat Psychic Edmund at the midnight crossroads')], lose: [moment('Psychic Edmund saw it coming and beat you')] }), E.set('m1'))),
      ch('"How?"', fight('Edmund: "Most people pick the middle." He shrugs, a little embarrassed at being asked. Then Kadabra and Xatu step out of the dark, and the battle is on.',
        spar(EDMUND, { team: ['kadabra', 'xatu'], size: 2, win: [moment('You beat Psychic Edmund at the midnight crossroads')], lose: [moment('Psychic Edmund beat you at the midnight crossroads')] }), E.set('m1'))),
    ],
  }),
  E.meet(2, {
    title: 'The Vision',
    intro:
      'A kerb outside a closed shop, at night. Edmund sits on it with his cape bunched around his knees, pale as paper. His Xatu stands beside him staring at nothing, unblinking. ' +
      'Edmund: "I saw something real. Not a guess. A bridge falling." He laughs, but it is not a laugh. Edmund: "Nobody believes a Psychic who\'s been guessing for twenty years."',
    choices: [
      ch('"I believe you."', out('He looks at you as if nobody has said that to him in his life. He leads you there, running, cape flying. As you reach the middle, the bridge groans and starts to fall, and your whole team throws itself against the beams and holds it, holds it, until the last cart is across.', E.set('m2'), E.set('believed')),
      { prompt: { id: 'brace-hold', needs: 'ok' }, fail: out('He leads you there, running. The bridge groans and starts to fall. Your team holds it, barely, shaking, a long and terrible minute, until the last cart rolls off and the beams settle with a crack. Nobody falls. Edmund sits down in the road and cries.', E.set('m2'), E.set('believed')) }),
      ch('"Prove it."', out('Edmund closes his eyes. He names the next three wild Pokémon you will meet, one, two, three, and writes them on the back of your hand in pen. He is right. For your next three wild encounters, you will see them coming.',
        { kind: 'tempEffect', label: 'Edmund named them: you see the wild Pokémon ahead', effects: [{ kind: 'preview', what: 'wild' }], battles: 3, until: 'wild' }, E.set('m2'), E.set('proved'))),
      ch('"Find the bridge."', out('You do not wait for a vision. You ask the way, and he follows you through the dark streets, holding his cape up out of the puddles.', room(E.roomId('bridge')))),
    ],
    remembers: [
      variant('shaken', [E.is('shaken')], { notice: 'Edmund looks up at you, and something in his face loosens. Edmund: "You broke my trick. Then I started seeing for real."' }),
    ],
  }),
  E.room('bridge', {
    title: 'The Cracked Bridge',
    intro:
      'One node on, the bridge: old stone, a river running fast below. In the light of your lamp you see it at once. A crack runs right through the middle span, and every time a cart goes over, a little dust falls into the water. Edmund goes white.',
    choices: [
      ch('Wake the town.', out('You bang on doors until the lights come on. By dawn there is a rope across both ends and a sign that says CLOSED, and a builder is already shaking his head at the crack. The town closes it. Edmund watches the sign go up and does not say a word.', E.set('m2'), E.set('found'))),
      ch('Stand guard until morning.', out('You and Edmund stand at the end of the bridge all night, turning back every cart. In the morning the town closes it properly, with rope and a sign. A woman with a baby on her hip stops to thank Edmund. He does not know what to do with his hands.', E.set('m2'), E.set('found'))),
    ],
  }),
  E.meet(3, {
    title: 'Real Sight',
    intro:
      'A quiet shop with one lamp in the window and no crystal ball anywhere. A hand-lettered sign hangs on the door: NO FORTUNES. ADVICE ONLY. Edmund sits behind a plain table in a plain jumper, the cape on a hook. His Bronzong hums softly in the corner. ' +
      'Edmund: "I stopped telling people what will happen. Now I tell them what might."',
    choices: [
      ch('"Advise me."', out('Edmund looks at you for a long time. Then he tells you one thing about the next boss you will face, quietly, like a friend would. It is not a prophecy. It is just good advice. He gives you a Twisted Spoon on your way out.', gym(), edmundSpoon, E.set('done'))),
      ch('"Battle."', fight('Edmund takes the cape down off its hook, for old times\' sake. Bronzong rises from the corner, and an Alakazam steps out from behind the curtain.',
        spar(EDMUND, { team: ['bronzong', 'alakazam'], size: 2, win: [moment('You beat Psychic Edmund in his advice shop')], lose: [moment('Psychic Edmund beat you in his advice shop')] }), edmundSpoon, E.set('done'))),
      ch('"What do you see for me?"', out('Edmund takes your hand and turns it over. Edmund: "Something you lose and get back." He will not say more. He gives you a Twisted Spoon. Somewhere later in this run, something you lose is meant to come back to you.', E.set('lost-returns'), edmundSpoon, E.set('done'))),
    ],
  }),
];

export const EVENTS: Json[] = [...pierre, ...cordelia, ...janice, ...vera, ...gina, ...rex, ...delia, ...hal, ...willa, ...edmund];
export const REMOVE: string[] = [];

/** Where each event is scripted. */
export const DOC: Record<string, string> = {
  'npc-meet-juggler-pierre': 'RR22 M1', 'npc-meet-juggler-pierre-m2': 'RR22 M2', 'npc-meet-juggler-pierre-practice': 'RR22 M2 (One hand)', 'npc-meet-juggler-pierre-m3': 'RR22 M3',
  'npc-meet-lady-cordelia': 'RR23 M1', 'npc-meet-lady-cordelia-m2': 'RR23 M2', 'npc-meet-lady-cordelia-m3': 'RR23 M3',
  'npc-meet-lass-janice': 'RR24 M1', 'npc-meet-lass-janice-m2': 'RR24 M2', 'npc-meet-lass-janice-m3': 'RR24 M3',
  'npc-meet-painter-vera': 'RR25 M1', 'npc-meet-painter-vera-m2': 'RR25 M2', 'npc-meet-painter-vera-m3': 'RR25 M3',
  'npc-meet-picnicker-gina': 'RR26 M1', 'npc-meet-picnicker-gina-m2': 'RR26 M2', 'npc-meet-picnicker-gina-m3': 'RR26 M3',
  'npc-meet-poke-maniac-rex': 'RR27 M1', 'npc-meet-poke-maniac-rex-m2': 'RR27 M2', 'npc-meet-poke-maniac-rex-search': 'RR27 M2 (Search)', 'npc-meet-poke-maniac-rex-thief': 'RR27 M2 (Search)', 'npc-meet-poke-maniac-rex-m3': 'RR27 M3',
  'npc-meet-pokemon-breeder-delia': 'RR28 M1', 'npc-meet-pokemon-breeder-delia-m2': 'RR28 M2', 'npc-meet-pokemon-breeder-delia-upstream': 'RR28 M2 (Source)', 'npc-meet-pokemon-breeder-delia-dumping': 'RR28 M2 (Source)', 'npc-meet-pokemon-breeder-delia-m3': 'RR28 M3',
  'npc-meet-pokemon-ranger-hal': 'RR29 M1', 'npc-meet-pokemon-ranger-hal-poachers': 'RR29 M1 (Trouble)', 'npc-meet-pokemon-ranger-hal-m2': 'RR29 M2', 'npc-meet-pokemon-ranger-hal-m3': 'RR29 M3',
  'npc-meet-pokemon-ranger-willa': 'RR30 M1', 'npc-meet-pokemon-ranger-willa-m2': 'RR30 M2', 'npc-meet-pokemon-ranger-willa-m3': 'RR30 M3',
  'npc-meet-psychic-edmund': 'RR31 M1', 'npc-meet-psychic-edmund-m2': 'RR31 M2', 'npc-meet-psychic-edmund-bridge': 'RR31 M2 (Find)', 'npc-meet-psychic-edmund-m3': 'RR31 M3',
};

const REUNION = 'The All-Star Tournament and Final Reunion (ROAD_ROSTER.md, How the Roster runs); no later scene in the doc reads it';

/** Flags nothing in this file reads: where the doc says they come back. */
export const AFTERSTORY: { match: string; readBy: string }[] = [
  { match: 'roster-pierre-(onehand|mime|retired)', readBy: `RR22 Meeting 2 ending: ${REUNION}` },
  { match: 'roster-cordelia-(travelled|letter)', readBy: `RR23 Meeting 2 ending: ${REUNION}` },
  { match: 'roster-janice-(protected|won|kent)', readBy: `RR24 Meeting 2 ending: ${REUNION}` },
  { match: 'roster-vera-(portrait|see|battle|burnt)', readBy: `RR25: the portrait is a hub cosmetic (needs engine); Meeting 2 endings: ${REUNION}` },
  { match: 'roster-gina-(rain|cave|shared)', readBy: `RR26 Meeting 2 ending: ${REUNION}` },
  { match: 'roster-rex-(traded|found|quinn|cold)', readBy: `RR27: traded (Meeting 1, ends the arc) and Meeting 2 endings; Quinn and Rex crossover (Roster crossovers table): ${REUNION}` },
  { match: 'roster-delia-(hatch-sooner|source|doctor|nursed)', readBy: 'RR28: hatch-sooner needs engine (the next egg hatches a stage sooner); source links D5 (evil-team dumping); Meeting 2 endings for the All-Star Tournament and Final Reunion' },
  { match: 'roster-hal-(poachers|fire|evac|arson)', readBy: `RR29 Meeting 1 and 2 endings; Hal and Willa crossover (Roster crossovers table): ${REUNION}` },
  { match: 'roster-willa-(found|fixed|rested)', readBy: `RR30 Meeting 2 ending ("she's better next time"); Hal and Willa crossover: ${REUNION}` },
  { match: 'roster-edmund-(believed|proved|found|lost-returns)', readBy: 'RR31: lost-returns needs engine (one item lost later in the run returns); Meeting 2 endings for the All-Star Tournament and Final Reunion' },
];

/** Flags this file reads that another file sets. */
export const EXTERNAL: string[] = [];
