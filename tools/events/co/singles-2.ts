// Catalog Overhaul Pack, category "singles" (revised single events), batch 2.
// Doc: catalog_overhaul/STORY_FAMILIES_19.md, SF137 Rests and SF139 Comic Encounters.
// Each rest heals the party as the base Rest does, then asks its one small choice; the Bond goes to the Pokémon chosen.
// Known limits: docs/status/co-singles.md.
import { $, any, anyType, bondUp, ch, cure, fight, flag, heal, item, join, leave, out, trainer, wild, type Json } from '../dsl.ts';

export const CATEGORY = 'singles';

const moment = (text: string, importance = 40): Json => ({ kind: 'moment', text, importance });
const rest = (...more: Json[]): Json[] => [heal(1), ...more];
/** "+1 Bond" for the first Pokémon of these types (the shared one-Pokémon selector). */
const bondType = (...types: string[]): Json => ({ kind: 'friendship', amount: 5, who: { types } });
const prizes = (label: string): Json => ({ kind: 'tempEffect', label, effects: [{ kind: 'moneyMultiplier', value: 1.5 }], battles: 1, until: 'battle' });
const types = (...ts: string[]): Json => (ts.length === 1 ? { kind: 'partyType', type: ts[0] } : anyType(...ts));
const pick = { pick: {} };
const DELIBIRD = ['oran-berry', 'poke-ball', 'potion', 'nugget', 'rare-candy'];

// ---------- SF137. RESTS ----------
const SF137: Json[] = [
  {
    id: 'hot-spring',
    intro: 'Steam rolls off a pool of water in the rocks, and the whole team is running before you can say a word. Someone is already in. Someone else is already splashing.',
    choices: [
      ch('Who soaks first?', out('You let the one you chose go in first. It sinks to its chin with a long, slow sigh, and every burn on the team fades in the warm water. Everyone is healed.', ...rest(cure(), bondUp(1, 'picked'))), pick),
    ],
  },
  {
    id: 'flower-field-rest',
    intro: 'Flowers run all the way to the horizon. Your lead throws itself into them and rolls, and comes up covered in petals, sneezing and happy.',
    choices: [
      ch('Who do you lie beside?', out('You lie down in the flowers next to the one you chose and watch the clouds go over. Nobody says anything for a long time. Everyone is healed, and there is a Pecha Berry in the grass by your hand.', ...rest(bondUp(1, 'picked'), item('pecha-berry'))), pick),
    ],
  },
  {
    id: 'starry-camp',
    intro: 'More stars than you have ever seen. Your lead curls up against your side without being asked, and the fire burns low and orange.',
    choices: [
      ch('Who keeps watch?', out('The one you chose sits up by the fire all night with its eyes on the dark, and every time you wake it is still there. Everyone is healed.', ...rest(bondUp(1, 'picked'))), pick),
    ],
  },
  {
    id: 'rest-field',
    intro: 'An open field, flat and green, with nothing in it but wind. A good place to practise, or a good place to lie down. Maybe both.',
    choices: [
      ch('Who practises with you?', out('You practise with the one you chose until the sun goes down: the same move, over and over, until it is not just good but its own. Everyone is healed.', ...rest(bondUp(1, 'picked'))), pick),
    ],
  },
  {
    id: 'rest-meadow',
    intro: 'A quiet meadow, with long grass and a stream at the bottom of it. Nobody needs anything from you here.',
    choices: [
      ch('Spend it with the lead.', out('You and your lead walk down to the stream together and sit with your feet in the water. It has been with you since the beginning, and it leans on you like it knows. Everyone is healed.', ...rest(bondUp(1, 'lead')))),
      ch('Spend it with the newest.', out('You sit with the one who joined last, the one still learning your voice. By the end of the afternoon it has its head in your lap. It is still new, so it catches up twice as fast. Everyone is healed.', ...rest(bondUp(2, 'newest')))),
    ],
  },
  {
    id: 'rest-photo',
    intro: 'Someone has left a camera on a stand at the side of the road, with a sign: "Take one. Leave the stand." The light is perfect.',
    choices: [
      ch('Team photo.', out('Everyone crowds in. Somebody blinks, somebody is facing the wrong way, and your lead is half out of the frame. It is perfect. It goes in the run\'s album. Everyone is healed.', ...rest(moment('A team photo at the side of the road. Somebody blinked.', 55)))),
      ch('Just you and one.', out('Just the two of you, in the good light. The one you chose leans into the frame like it has been waiting to be asked. It goes in the run\'s album. Everyone is healed.', ...rest(bondUp(1, 'picked'), moment('A photo of just the two of you, in the good light.', 55))), pick),
    ],
  },
  {
    id: 'street-performer',
    intro: 'A guitarist on a corner plays so slowly that the whole street slows down to match him. There is a hat on the ground in front of him with a few coins in it.',
    choices: [
      ch('Listen.', out('You stand and listen until the song ends. Your team sits in a row at your feet. Nobody claps; it does not feel like that kind of song. Everyone is rested.', ...rest())),
      ch('Put a coin in.', out('The coin clinks. He looks up, looks at your team for a long moment, and starts something new, and it is about them. You do not know how he knows. Everyone is rested.', ...rest($(-50)))),
      ch('Let a Pokémon sing along.', out('The one you chose starts to sing, badly and with total commitment. The guitarist laughs and follows it wherever it goes. A crowd gathers. Everyone is rested.', ...rest(bondUp(1, 'picked'))), pick),
    ],
  },
  {
    id: 'tale-festival-night',
    intro: 'Three camps share one big fire on the hillside, and somebody has started a song that the whole hill is singing. A blanket is held up for you to join.',
    choices: [
      ch('Sing.', out('You sing, and you do not know the words, and nobody minds. Your team howls along. The fire goes on late. Everyone is rested.', ...rest())),
      ch('Listen.', out('You sit with your back against a log and let the song go by you. Your team falls asleep in a heap. Everyone is rested.', ...rest())),
      ch('Tell a story about the run.', out('You tell them about the road so far. When you finish, an old man from the second camp asks about one of yours by name, the one you chose, and wants to hear everything. It sits up straight while you talk. Everyone is rested.', ...rest(bondUp(1, 'picked'), moment('Told the whole hillside a story about the run.', 45))), pick),
    ],
  },
  {
    id: 'chimecho-wind-rest',
    intro: 'A Chimecho hangs from a dead branch, ringing softly in the wind. The whole clearing is quiet around it, as if everything is listening.',
    choices: [
      ch('Sit.', out('You sit, and the ringing goes on, and something in your team untangles. Confusion and sleep lift like fog. Everyone is rested.', ...rest(cure()))),
      ch('Ring it back.', out('You tap a stone against a stone, and the Chimecho rings back, and you ring again. It follows you to the edge of the clearing, ringing, and then it stops, and looks back at its branch, and decides to stay. Confusion and sleep lift. Everyone is rested.', ...rest(cure(), moment('A Chimecho followed for a while, then chose to stay home.', 35)))),
    ],
  },
  {
    id: 'wx-aurora-night',
    intro: 'Green and violet light ripples across the sky from one horizon to the other. It makes no sound at all.',
    choices: [
      ch('Watch with the lead.', out('You and your lead lie back on the cold ground and watch it until your eyes water. Something that cold and that bright feels like it is watching back. Everyone is rested.', ...rest(bondUp(1, 'lead'), flag('sign-articuno')))),
      ch('Wake the team.', out('You wake them one by one. Nobody complains. The whole team sits in a row with their faces turned up, and the sky does not stop. Everyone is rested.', ...rest(bondUp(1, 'party'), flag('sign-articuno')))),
    ],
  },
  {
    id: 'wx-bioluminescent-bay',
    intro: 'The water in the bay glows blue-green wherever it moves. Every wave breaks in light.',
    choices: [
      ch('Wade in.', out('Every step leaves a trail of light behind you. The one you chose comes in after you and stands very still, lit up from below, and you both look out to where the glow goes deep. Something out there is very large and very kind. Everyone is rested.', ...rest(bondUp(1, 'picked'), flag('sign-lugia'), flag('telling-manaphy'))), pick),
      ch('Watch from the shore.', out('You sit on the sand with your team and watch the waves light and go dark, light and go dark, like breathing. Far out, something passes under the glow. Everyone is rested.', ...rest(bondUp(1, 'party'), flag('sign-lugia'), flag('telling-manaphy')))),
    ],
  },
  {
    id: 'wx-blossom-storm',
    intro: 'Pink petals come down so thick that you cannot see the road, or your own feet, or anything but pink.',
    choices: [
      ch('Stand still in it.', out('You stand still and let it bury you. The petals smell of something green and grateful. When it clears, the one you chose is right beside you, covered in pink, looking pleased. Everyone is rested.', ...rest(bondUp(1, 'picked'), flag('sign-shaymin'))), pick),
      ch('Find shelter.', out('You all cram under a rock ledge and watch the storm go by, pink and silent and endless. When it ends there is a little hedgehog-shaped hollow in the petals where something sat. Everyone is rested.', ...rest(bondUp(1, 'party'), flag('sign-shaymin')))),
    ],
  },
  {
    id: 'wx-rainbow-after-rain',
    intro: 'The rain stops all at once. The road is washed clean and shining, and there is a rainbow standing right over it, close enough to walk under.',
    choices: [
      ch('Point it out to the team.', out('You point, and they all turn. Your lead stares at it with its mouth open. For a moment there is a shape in the colours, wings, and then there is not. Everyone is rested.', ...rest(bondUp(1, 'party'), flag('sign-ho-oh')))),
      ch('Walk under it.', out('You walk under it with the one you chose, and the light falls across you both in every colour. It feels like being let into something. Everyone is rested.', ...rest(bondUp(1, 'picked'), flag('sign-ho-oh'))), pick),
    ],
  },
  {
    id: 'r134-ember-pool',
    intro: 'Slugma bask in hollows of warm stone, slow lava creeping between them. The air shimmers. It would be too hot for most of your team, but not all of it.',
    choices: [
      ch('Let the Fire-types in.', out('Your Fire-type wades into the warm stone and lies down among the Slugma like it has come home. Every burn on the team fades in the heat. Everyone is rested.', ...rest(cure(), bondType('fire'))), { requires: [types('fire')] }),
      ch('Sit at the edge.', out('You all sit at the edge where it is merely warm, and the heat draws the burns out of everyone. Everyone is rested.', ...rest(cure()))),
    ],
  },
  {
    id: 'r162-magma-bubble-pools',
    intro: 'Magcargo and Torkoal doze in pools of bubbling stone. Every so often one of them sighs, and a puff of smoke goes up.',
    choices: [
      ch('Let the Fire- and Rock-types in.', out('Your Fire- or Rock-type lowers itself into the bubbling stone between two Torkoal, who shuffle over to make room. It comes out glowing and fully mended. The rest of the team rests as usual.', ...rest(bondType('fire', 'rock'))), { requires: [types('fire', 'rock')] }),
      ch('Keep the rest back.', out('You keep everyone well back from the bubbling stone, and rest on the cooler rock nearby. Everyone is rested as usual.', ...rest())),
    ],
  },
  {
    id: 'r154-pokemon-parade-float',
    intro: 'A parade float has stopped by the road, garlanded and gleaming, with a little seat for every member of your team. The driver waves you up.',
    choices: [
      ch('Everyone rides.', out('Everyone climbs up. The crowd cheers each one by name as you pass, and your whole team waves back, badly, with great enthusiasm. Everyone is rested.', ...rest(bondUp(1, 'party')))),
      ch('Only the shy one.', out('You lift up the one who never pushes forward, and set it in the best seat on its own. The crowd cheers for it alone. It does not know what to do with its face. Everyone is rested.', ...rest(bondUp(2, 'picked'))), pick),
    ],
  },
];

// ---------- SF139. COMIC ENCOUNTERS (the reward is shown before the player accepts) ----------
const SF139: Json[] = [
  {
    id: 'bug-superfan',
    intro: '**Superfan, in a homemade antenna hat:** "Bugs are the BEST!" Prize on offer: a Silver Powder to anyone who shows him a good Bug-type, or prize money ×1.5 for a battle.',
    choices: [
      ch('Show a Bug-type.', out('He gets down on his knees in front of your Bug-type and gazes. "Perfect. Perfect." He presses a Silver Powder into your hand without looking away from it.', item('silver-powder')), { requires: [types('bug')] }),
      ch('Battle.', fight('"Oh, YES." He sends out everything he owns, and all of it is a Bug-type.', trainer('Bug Superfan', { cls: 'bug-catcher', types: ['bug'], size: 3, win: [$(400)] }), prizes('Superfan prize ×1.5'))),
    ],
  },
  {
    id: 'clowning-around',
    intro: 'A clown and his Mr. Mime are blocking the road, the Mr. Mime pressing its hands against a wall that is not there. **Clown:** "Laugh, or battle!" Laugh, and you pass. Battle, and you win a prize.',
    choices: [
      ch('Laugh.', out('You laugh, and it turns out you mean it. The Mr. Mime bows, folds up its invisible wall and tucks it under its arm, and the two of them wave you through.')),
      ch('Battle.', fight('"A critic!" The clown honks his nose. When it is over, the Mr. Mime mimes giving up its spot, steps aside, and holds the invisible door open for you.', trainer('Clown', { team: ['mr-mime', 'mime-jr'], size: 2, win: [$(500)] }))),
    ],
  },
  {
    id: 'dancing-lessons',
    intro: 'An Oricorio is dancing alone by the side of the road, wings out, turning and turning. It stops and looks at you. It wants a partner. If you keep up, it will come with you, in whatever style it is dancing today.',
    choices: [
      ch('Dance.', out('You do not know the steps. You do it anyway. By the end the Oricorio is laughing, and it lands on your shoulder and stays there. It joins you in the style it was dancing.', join({ species: ['oricorio', 'oricorio-pom-pom', 'oricorio-pau', 'oricorio-sensu'] }))),
      ch('Let a Pokémon dance.', out('The one you chose steps forward and dances with it, and the two of them go round and round in the dust. When the music in its head stops, the Oricorio decides it would rather not be alone after all, and joins you.', join({ species: ['oricorio', 'oricorio-pom-pom', 'oricorio-pau', 'oricorio-sensu'] })), pick),
    ],
  },
  {
    id: 'delibird-y',
    intro: 'Three Delibird waddle up with their sacks and look at you expectantly. They want a present first. Then each will give one back: a Berry, a Poké Ball, a Potion, a Nugget or a Rare Candy, at random.',
    choices: [
      ch('Give a Berry.', out('You give them an Oran Berry to share. Each Delibird rummages in its sack and hands you something without looking, very seriously.', { kind: 'loseItem', id: 'oran-berry' }, any(...DELIBIRD), any(...DELIBIRD), any(...DELIBIRD)), { requires: [{ kind: 'item', id: 'oran-berry' }] }),
      ch('Give an item.', out('You give them something from your bag. They pass it round, approve, and each one hands you something back from its sack.', { kind: 'loseItem' }, any(...DELIBIRD), any(...DELIBIRD), any(...DELIBIRD))),
    ],
  },
  {
    id: 'field-trip',
    intro: 'A teacher and a line of children with clipboards stop you on the road. "Could they see a move? A real one?" Twenty faces turn up to you.',
    choices: [
      ch('Show a strong move.', out('Your Pokémon lets loose, and the ground shakes, and twenty children scream with joy. The teacher writes your name down. You will be talked about at that school for years.', flag('rep'))),
      ch('Show a pretty move.', out('Your Pokémon makes something beautiful, and twenty children go completely silent, and then one of them starts to cry for no reason she can explain. The teacher writes your name down.', flag('rep'))),
    ],
  },
  {
    id: 'fun-and-games',
    intro: 'A carnival stall: knock out the Wobbuffet in three turns, win a prize. **Attendant:** "One go for ₽100! One in four wins a Lucky Egg; everyone else gets a Nugget."',
    choices: [
      ch('Play (₽100).', fight('The Wobbuffet salutes. You have three turns; a slower win pays nothing.', { ...trainer('Game Attendant', { team: ['wobbuffet'], size: 1, win: [any('lucky-egg', 'nugget', 'nugget', 'nugget')] }), rule: { turnLimit: 3 }, slowWin: [] }, $(-100)), { requires: [{ kind: 'money', atLeast: 100 }] }),
      ch('No.', leave('The attendant shrugs. The Wobbuffet salutes you anyway.')),
    ],
  },
  {
    id: 'fight-or-flight-2',
    intro: 'A strong Pokémon stands over something that glows. It is not guarding treasure. Behind it, in a scrape in the ground, there is a nest.',
    choices: [
      ch('Look at the nest.', out('You crouch down where it can see you, and look, and do not reach. After a long moment it steps aside from the glowing thing and stands over the nest instead. It is letting you take it, as long as you leave the eggs alone. You do.', any('fire-stone', 'water-stone', 'thunder-stone', 'leaf-stone', 'moon-stone', 'leftovers', 'focus-sash'))),
      ch('Battle.', fight('It roars, and the nest disappears behind it.', wild({ lv: 4, win: [any('fire-stone', 'water-stone', 'thunder-stone', 'leaf-stone', 'moon-stone', 'leftovers', 'focus-sash')] }))),
      ch('Leave.', leave('You back away. It does not take its eyes off you until you are out of sight.')),
    ],
  },
];

export const EVENTS: Json[] = [...SF137, ...SF139];
export const REMOVE: string[] = [];
