// Catalog Overhaul Pack: STORY_FAMILIES_3.md, part two. SF15 The Convoy, SF16 The Hollow Lantern, SF17 The Grunt School,
// SF18 The Heist. Build: npm run co:build -- families-a-5. Run memory is same-run only (Kice 2026-11-14): the lantern bears the
// name of a Pokémon released earlier in this run ({released}); Keepsakes are cut (Nov 13), so the lantern is not one.
import { any, anyType, br, ch, convoy, convoyHeal, fight, flag, fr, heal, item, join, lose, out, $, reveal, room, season, stopHere, takeNode, trainer, wild, BERRIES, type Json } from '../dsl.ts';
import { grunt, is, later, moment, not, safe, sub, v, withRooms } from './_fa.ts';
import { quest } from './_rivals.ts';

export const CATEGORY = 'families-a';
export const REMOVE: string[] = [];

/** "N nodes on": the event's stop opens beside the node reached after N more nodes (anime's laterEvent). */
const soon = (eventId: string, nodes: number): Json => ({ kind: 'laterEvent', eventId, nodes });
const inRegion = (...ids: string[]): Json => ({ kind: 'region', ids });
const clear = (key: string): Json => quest({ set: { key, value: 0 } });

// =====================================================================================================================
// SF15. THE CONVOY. The first escort starts the convoy (the existing escort: it can be struck on the road, and arrival at
// the gym pays out and sets `convoy-delivered`); the others join it (one more to guard). The shelter turns up the secret of
// whoever is in your care (Finch, then Tess, then Fen, first one present). Each person's ending is a stop after the gym.
// =====================================================================================================================
const ACTIVE: Json = { kind: 'convoy', active: true };
/** An escort event: starts the convoy when there is none, or joins the one on the road (the convoy needs more care). */
function escort(o: { id: string; name: string; hp: number; intro: string; choices: (start: Json) => Json[]; joinText: string; remembers?: Json[] }): Json {
  const base = o.choices(convoy(o.name, o.hp));
  const joining = o.choices(convoyHeal(1));
  return {
    id: o.id, requires: [], intro: o.intro, choices: base,
    remembers: [v('joining', [ACTIVE], { notice: o.joinText, hide: base.map((_, i) => i), add: joining }), ...(o.remembers ?? [])],
  };
}

const CONVOY: Json[] = [
  escort({
    id: 'convoy-lost-children', name: 'the lost children', hp: 3,
    intro: 'Three children on the verge of the road, all dust and scraped knees, sitting in a row like birds on a wire. The eldest stands up when she sees you and puts herself in front of the other two. Fen: "Our town\'s past the gym. We\'re not waiting here." The middle one, a girl with a stick, is looking past you at the trees. Juniper: "There was a Pokémon. A big one. We ran." The littlest has his face in his sleeve. Bo: "I want my mum."',
    joinText: 'You already have people in your care. Three more won\'t make it easier. Bo is holding out his arms anyway.',
    choices: (start) => [
      ch('Come with me.', out('Fen walks at the front, very straight, as if she is in charge. Juniper walks at the back, looking for the big Pokémon. Bo walks holding your hand and does not let go once.', start, flag('convoy-kids'), flag('convoy-on'))),
      ch('Wait here, I\'ll get help. (a node)', out('They will not wait. They follow anyway, at a distance, which is worse, and at the next crossroads Bo goes the wrong way and you have to go back for him. When you find him he is sitting under a hedge not crying, which is worse still.', start, takeNode(1), flag('convoy-kids'), flag('convoy-kids-follow'), flag('convoy-on'))),
      ch('What Pokémon?', out('Juniper\'s eyes light up. She describes it with her whole body: huge, scarred, older than the trees, and it looked right at her and did not do anything. An Alpha, you think, one of this region\'s great ones. Fen: "Don\'t encourage her."', start, flag('convoy-kids'), flag('convoy-alpha-hint'), flag('convoy-on'))),
    ],
  }),
  escort({
    id: 'convoy-lost-researcher', name: 'the researcher', hp: 4,
    intro: 'A researcher with a pack twice her size, standing at the edge of the road and staring down it as if it might bite. Dr. Finch: "It\'s not safe alone. If you\'d take me as far as the gym?" She pushes her glasses up her nose. "I study migration. I\'m very good with notebooks. I\'m very bad with everything else."',
    joinText: 'Finch looks at the people already walking with you, and you see her decide that one more won\'t be noticed.',
    choices: (start) => [
      ch('Come along.', out('She falls in beside you, writing while she walks, and only walks into one tree.', start, flag('convoy-finch'), flag('convoy-on'))),
      ch('What\'s in the pack?', out('Notebooks, a camera, a flask of cold tea, and, at the bottom, a small locked case she does not open. When you look at it she closes the pack, very quickly. Finch: "Equipment," she says. "Delicate."', start, flag('convoy-finch'), flag('convoy-case-seen'), flag('convoy-on'))),
      ch('Can\'t take you.', out('She nods as if she expected it, and sets off alone with her notebooks hugged to her chest.', soon('convoy-finch-robbed', 3))),
    ],
  }),
  escort({
    id: 'convoy-merchant-cart', name: 'the merchant\'s cart', hp: 5,
    intro: 'A merchant\'s cart at the roadside with no guards: five stout planks, a lot of stock under canvas, and one man sitting on the step with his hat in his hands. Garrow: "Take us to the gym and the cut is yours." He looks up the road and down it. "My guards quit. Said the road was haunted. Said a lot of things, actually."',
    joinText: 'A cart is slow, and you already have people to look after. Garrow sees you counting heads and says nothing, hopefully.',
    choices: (start) => [
      ch('Deal. (a node)', out('Garrow shakes your hand hard. The cart is slow; it costs you a node of road, and every rut in it.', start, takeNode(1), flag('convoy-cart'), flag('convoy-on'))),
      ch('What\'s the cut? (a node)', out('Garrow: "Ten percent of the stock\'s sale. Honest." He shows you the ledger, every line of it, and it is. The cart is slow; it costs you a node of road.', start, takeNode(1), flag('convoy-cart'), flag('convoy-cut-asked'), flag('convoy-on'))),
      ch('No.', out('Garrow puts his hat back on and goes back to waiting for someone braver.')),
    ],
  }),
  escort({
    id: 'convoy-wounded-ranger', name: 'the wounded ranger', hp: 3,
    intro: 'A ranger sitting with her back against a tree, her uniform torn at the shoulder and her Luxray lying across her legs, breathing shallow. Ranger Tess: "Get me to the gym. They\'ve a healer." She puts a hand on Luxray\'s mane. "It took a hit for me. Don\'t let it walk too much."',
    joinText: 'Tess looks at the people already in your care and gets up anyway, leaning on the tree. Tess: "I can walk at the back."',
    choices: (start) => [
      ch('Lean on me.', out('She leans. She is heavier than she looks, and lighter than she would like to be. Luxray limps at her heel.', start, flag('convoy-tess'), flag('convoy-on'))),
      ch('Where\'s your post?', out('Tess: "...Up north." She looks away, at nothing, for a long moment. Then she gets up and walks, and does not say anything else for a mile.', start, flag('convoy-tess'), flag('convoy-tess-asked'), flag('convoy-on'))),
      ch('Carry your Luxray.', out('Your strongest Pokémon lifts Luxray as carefully as anything you have ever seen it do. Tess watches, and her mouth works, and she says thank you three times before she gets it out properly.', start, fr(5, 'top'), flag('convoy-tess'), flag('convoy-luxray'), flag('convoy-on'))),
    ],
  }),
  sub('convoy-lost-researcher', 'convoy-finch-robbed', 'Found on the Road', 'Finch, the researcher you could not take, is sitting in a ditch with her pack slit open and her notebooks in the mud. Someone took the case. She is picking up pages one by one and wiping them on her coat. She does not look up.', [
    ch('Help her pick them up.', out('You kneel in the mud and pick up pages until there are none left. She looks at you, finally. Finch: "Thank you." She presses one dry page into your hand: a migration map, beautifully drawn.', reveal(), flag('convoy-finch-helped'))),
    ch('Walk on.', out('You walk on. Behind you, the sound of pages being wiped, one at a time.')),
  ], { callback: true, requires: [] }),
  {
    id: 'convoy-shelter', requires: [ACTIVE],
    intro: 'A roadside shelter with a roof and a well and a stove that still draws. A good place to stop. The convoy settles in. Garrow, if he is with you, counts his stock twice. The others find corners. Nobody talks much. At night, very late, you hear one of them get up and go outside.',
    choices: [
      ch('Follow them.', out('Outside, under the stars, it is only Garrow, counting the stars instead. He has nothing to hide. He is just bad at sleeping.', convoyHeal(1), flag('convoy-secret-none'))),
      ch('Stay inside.', out('You stay by the stove until it is light.', heal(0.5), convoyHeal(1), flag('convoy-stayed'))),
      ch('Ask in the morning.', out('Over breakfast you ask who was outside. Garrow puts his hand up, embarrassed. He couldn\'t sleep. That is all.', convoyHeal(1), flag('convoy-secret-none'))),
    ],
    remembers: [
      v('finch', [is('convoy-finch')], { notice: 'It is Finch. She takes her pack with her.', hide: [0, 1, 2], add: [
        ch('Follow her.', out('You follow her into the trees.', flag('convoy-secret'), room('convoy-secret-finch'))),
        ch('Stay inside.', out('You stay by the stove. She comes back an hour later and lies down without a sound.', heal(0.5), convoyHeal(1), flag('convoy-stayed'))),
        ch('Confront her in the morning.', out('Over breakfast, in front of everyone, you ask Finch what she was doing in the trees.', flag('convoy-secret'), flag('convoy-public'), room('convoy-secret-finch'))),
      ] }),
      v('tess', [is('convoy-tess')], { notice: 'It is Tess. She goes and stands at the edge of the light with Luxray, looking north.', hide: [0, 1, 2], add: [
        ch('Follow her.', out('You go out and stand beside her.', flag('convoy-secret'), room('convoy-secret-tess'))),
        ch('Stay inside.', out('You stay by the stove. When Tess comes back in, she lies down with her face to the wall.', heal(0.5), convoyHeal(1), flag('convoy-stayed'))),
        ch('Ask her in the morning.', out('Over breakfast, in front of everyone, you ask Tess what she was looking at.', flag('convoy-secret'), flag('convoy-public'), room('convoy-secret-tess'))),
      ] }),
      v('kids', [is('convoy-kids')], { notice: 'It is Fen. She walks out to the road and stands looking back the way you came, at a big house on the hill, far off.', hide: [0, 1, 2], add: [
        ch('Follow her.', out('You go out after her.', flag('convoy-secret'), room('convoy-secret-fen'))),
        ch('Stay with the children.', out('You stay. In the small hours Bo wakes up, scared of the dark, and your lead curls round him until he sleeps again. Fen comes back in and sees it and says nothing, but she sits closer after that.', heal(0.5), convoyHeal(1), fr(5, 'lead'), flag('convoy-stayed'))),
        ch('Ask her in the morning.', out('Over breakfast, in front of the others, you ask Fen about the house on the hill.', flag('convoy-secret'), flag('convoy-public'), room('convoy-secret-fen'))),
      ] }),
    ],
  },
  sub('convoy-shelter', 'convoy-secret-finch', 'The Locked Case', 'Finch has the locked case open on a stump. Inside is a transmitter, small and grey, with {evil}\'s mark scratched off the side, not very well. She has been reporting the gym\'s archive to them. She sees you, and her hands go still on the dial.', [
    ch('I\'m turning you in.', out('She does not argue. She closes the case and hands it to you and walks back to the shelter with her hands in her pockets, and at the gym you give the case to the guards.', flag('convoy-finch-turned-in'), { kind: 'evil', heat: -1 })),
    ch('Why?', out('Finch: "My family owes them," she says. "Not money. Worse than money. Every report is a week off what we owe." She laughs, horribly. "I study migration. I know exactly how far you have to go to get away from something. It\'s further than I can walk."', flag('convoy-finch-why'), room('convoy-secret-finch'))),
    ch('Smash it and you can go.', out('She looks at you for a long time. Then she puts the transmitter on the stump and brings a rock down on it, once, twice, until it is in pieces, and she is crying, and she keeps going after it is broken.', flag('convoy-finch-smashed'), { kind: 'evil', heat: -1 })),
  ], {
    remembers: [
      v('caught', [is('convoy-case-seen'), not('convoy-finch-why')], { notice: 'You saw that case on the road. You know what it is before she has finished opening it, and you are there before she can send a word.', add: [ch('Stop her before she sends it.', out('You put your hand flat on the case and close it. She lets you. Finch: "I was going to send it," she says. "I don\'t know if I was going to send it." Nothing reached {evil} tonight.', flag('convoy-finch-stopped'), flag('convoy-finch-smashed'), { kind: 'evil', heat: -2 }))] }),
    ],
  }),
  sub('convoy-shelter', 'convoy-secret-tess', 'Up North', 'Tess has her hand on Luxray\'s back, where the burn is. Tess: "There was a fire at my post. A big one. I ran." She says it flat, like reading a list. "Luxray didn\'t. It took the hit I ran from." Luxray leans against her legs. It does not seem to blame her at all, which is the worst thing.', [
    ch('Go back.', out('Tess: "...Yes." She says it as if it costs her everything. In the morning she turns north, and Luxray turns with her.', flag('convoy-tess-back'))),
    ch('Tell the gym.', out('Tess nods. Tess: "They\'ll ask anyway. Better from me." She is quiet the rest of the night, but she sleeps.', flag('convoy-tess-told'))),
    ch('You were scared. That\'s allowed.', out('Tess turns her face away. After a long time she says, very quietly, "Nobody\'s ever said that." Luxray puts its head in her lap.', flag('convoy-tess-allowed'), fr(5, 'party'))),
  ], {
    remembers: [
      v('told-first', [is('convoy-tess-asked')], { intro: 'Tess speaks before you can ask. Tess: "You asked where my post was. On the road. I lied." She has her hand on Luxray\'s back, where the burn is. "There was a fire at my post. A big one. I ran. Luxray didn\'t. It took the hit I ran from." Luxray leans against her legs. It does not seem to blame her at all, which is the worst thing.' }),
    ],
  }),
  sub('convoy-shelter', 'convoy-secret-fen', 'The House on the Hill', 'Fen does not turn round. Fen: "We\'re not brother and sister. Juniper and Bo." Her voice is very steady, like someone who has practised it. "That house is mine. My family\'s. I ran. And the orphanage down the valley was a bad place, so I took them with me." She turns. "Don\'t send them back. Please. Send me back if you want. Not them."', [
    ch('I\'ll take you home.', out('Fen: "...All of us?" You nod. She looks at the house on the hill for a long time. Fen: "They\'d have to take all of us."', flag('convoy-fen-home'))),
    ch('We\'ll find the orphanage inspector.', out('Fen\'s face does something complicated. Fen: "There\'s an inspector? Someone whose job it is?" She sits down on the step, suddenly, as if her legs have gone. "Nobody told us that."', flag('convoy-fen-inspector'))),
    ch('Keep going together.', out('Fen: "Together." She says it like she is trying the word for the first time. She goes back in and lies down between the other two and is asleep before you have closed the door.', flag('convoy-fen-together'))),
  ]),
  // ---------- Arrival: each person's ending, a stop after the gym ----------
  sub('convoy-lost-children', 'convoy-bye-kids', 'The Children\'s Town', 'The children\'s town, past the gym, at the end of a lane of lime trees. Bo sees a woman at a gate and runs. Juniper looks back, once, at the road and the trees and the big Pokémon somewhere in them. Fen stands with you.', [
    ch('Say goodbye.', out('The town gives you a bed and a hot meal and will not take a coin for either. In the morning someone has left a gift on your pack with a drawing of your team on it in crayon.', heal(1), item('soothe-bell'), flag('convoy-kids-bye'), moment('You walked three children home, and Bo didn\'t let go of your hand once', 65))),
  ], {
    callback: true, requires: [is('convoy-delivered'), is('convoy-kids'), not('convoy-kids-bye')],
    remembers: [
      v('home', [is('convoy-fen-home')], { notice: 'Later you walk Fen up the hill to the big house. Her mother opens the door, and does not say anything, and does not need to. All three of them go in.' }),
      v('inspector', [is('convoy-fen-inspector')], { notice: 'The inspector comes the next day: a tired woman with a kind mouth and a clipboard. She listens to Fen for an hour. The orphanage down the valley is closed by the end of the week.' }),
      v('together', [is('convoy-fen-together')], { notice: 'Fen and Juniper stay together, at the woman\'s gate with Bo. Fen looks back at you from the porch and lifts one hand, very straight, as if she is in charge.' }),
    ],
  }),
  sub('convoy-lost-researcher', 'convoy-bye-finch', 'The Archive', 'The gym\'s archive at last: shelves to the ceiling and a smell of paper. Finch puts down her pack and puts both hands flat on a reading table as if it is solid ground.', [
    ch('Say goodbye.', out('Finch copies every migration route she has into your map before you go: hours of work, in a fine fast hand. You will see where everything goes now.', reveal(), flag('convoy-finch-bye'))),
  ], {
    callback: true, requires: [is('convoy-delivered'), is('convoy-finch'), not('convoy-finch-bye')],
    remembers: [
      v('turned-in', [is('convoy-finch-turned-in')], { notice: 'Finch is not at the reading table. She is with the guards. She has left her notebooks for you on the archive steps, with a note: "Every route. I\'m sorry. Tell them it wasn\'t the birds\' fault."' }),
      v('smashed', [is('convoy-finch-smashed')], { notice: 'Finch walks into the archive with nothing in her pack that she has to hide, and you watch her shoulders come down for the first time.' }),
      v('why', [is('convoy-finch-why')], { notice: 'At the archive door Finch stops. Finch: "I told you why. You didn\'t say anything." She looks at you. "Thank you for that."' }),
    ],
  }),
  sub('convoy-wounded-ranger', 'convoy-bye-tess', 'The Healer', 'The gym\'s healer takes one look at Luxray and sends for hot water. Tess sits on a bench in the corridor with her hands between her knees. When the healer comes out and nods, she puts her face in her hands.', [
    ch('Say goodbye.', out('Before you go, Luxray comes out on its own four feet and puts something in your hand: an Electric Gem, warm from its mane. Tess: "It wants you to have that," she says. "It\'s decided. Don\'t argue with it."', item('electric-gem'), flag('convoy-tess-bye'))),
  ], {
    callback: true, requires: [is('convoy-delivered'), is('convoy-tess'), not('convoy-tess-bye')],
    remembers: [
      v('back', [is('convoy-tess-back')], { notice: 'Tess has her pack on already, facing north. Tess: "There\'s a post up there with nobody at it," she says. "I should do something about that."' }),
      v('told', [is('convoy-tess-told')], { notice: 'Tess has already told the gym. They listened. She does not say what they said, but she is standing up straight.' }),
      v('allowed', [is('convoy-tess-allowed')], { notice: 'Tess hugs you, quickly, awkwardly, like someone out of practice. Tess: "Scared is allowed," she says, into your shoulder. "I\'m going to keep saying it till I believe it."' }),
    ],
  }),
  sub('convoy-merchant-cart', 'convoy-bye-garrow', 'Garrow\'s Cut', 'At the gym\'s market Garrow sells his stock in an hour, every crate, and then sits down on the empty cart and counts the money twice, out loud, so you can hear that it is honest.', [
    ch('Take the cut.', out('Ten percent, to the coin. Garrow: "Told you," he says. "Honest." He shakes your hand so hard your arm aches.', $(700), flag('convoy-garrow-bye'))),
    ch('Keep it. Hire some guards.', out('Garrow stares at you. Then he laughs, and puts the money back in his own purse, and buys you dinner instead, which costs him almost nothing and is the best meal you have had in weeks.', heal(1), flag('convoy-garrow-bye'), flag('convoy-garrow-kept'))),
  ], { callback: true, requires: [is('convoy-delivered'), is('convoy-cart'), not('convoy-garrow-bye')] }),
];

// =====================================================================================================================
// SF16. THE HOLLOW LANTERN. Autumn. The light leads, the Medium guides, the mirror shows, the Pale Visitor asks, the Hexed
// Keeper ends it. The name on the lantern is a Pokémon released earlier in this run ({released}); if none, the glass is blank.
// Each beat sets the next one on the road a little way on (soon). The festival stops are drawn while the lantern is carried.
// =====================================================================================================================
const RELEASED = is('released-count');
const CARRIED = [is('lantern-on'), not('lantern-done')];
const COVEN = (name: string, o: { size?: number; lv?: number; chain?: number; win?: Json[]; team?: string[] } = {}): Json =>
  safe(trainer(name, { cls: 'hex-maniac', size: o.size ?? 2, types: ['ghost'], lv: o.lv ?? 0, ...(o.chain ? { chain: o.chain } : {}), ...(o.team ? { team: o.team } : {}), win: o.win ?? [] }));
/** The Spooky-form family (core/specialForms): beating the Coven's Spooky team opens Spooky forms to eggs and trades (`spooky-met`). */
const SPOOKY_FORMS = ['litwick-spooky', 'timburr-spooky', 'emolga-spooky', 'snorunt-spooky', 'ponyta-spooky', 'sinistea-spooky', 'tangela-spooky'];

const LANTERN: Json[] = [
  {
    id: 'spooky-light-one', requires: [season('Autumn'), not('lantern-on')],
    intro: 'Dusk, and the road going blue. A pale light drifts between the trees on your left, low, about the height of a Pokémon\'s head. When you stop, it stops. When you take a step, it waits for you to take another. If you have any Ghost-types with you, they have all turned to look at it, and none of them are afraid.',
    choices: [
      ch('Follow it.', out('You step off the road. The light bobs, once, as if it is glad, and drifts on ahead of you into the trees.', flag('lantern-on'), soon('spooky-detour-battle', 1))),
      ch('Call to it.', out('You call out. Not a name; you don\'t know a name. Just "hello." The light flickers brighter, and then waits, very still, as if it is listening for more.', flag('lantern-on'), soon('spooky-detour-battle', 2))),
      ch('Keep to the road.', out('You keep to the road. The light keeps pace with you between the trees, at a distance, all the way to the next node. It does not seem to mind. It seems to have time.', flag('lantern-on'), soon('spooky-detour-battle', 2))),
    ],
  },
  {
    id: 'spooky-detour-battle', callback: true, requires: [is('lantern-on'), not('lantern-coven1')],
    intro: 'The light leads you off the path to a clearing, and stops. Something is waiting in the clearing in a long spooky coat with the hood up, and two shapes beside it in the dark. The thing in the coat turns out to be a young woman from the Hex Coven, with purple lipstick and a cold. Coven member: "You\'re following the light? Bad idea. Bad, bad idea." She sniffs. "Battle me, and I\'ll tell you why."',
    choices: [
      ch('Battle.', fight('Her team comes up out of the dark in lantern colours: Pokémon you know, in shapes you don\'t, orange-eyed and grinning. Spooky forms. She is better than her cold.', COVEN('Coven Member', { size: 2, lv: 1, team: SPOOKY_FORMS, win: [flag('lantern-coven1'), flag('spooky-met')] }), flag('lantern-coven1'), soon('spooky-light-two', 1))),
      ch('Tell me now.', out('Coven member: "Fine. Spoil it." She pulls her hood down. "It\'s looking for someone. Maybe you." She looks at the light, and something in her face goes soft. "The light\'s got a name. Ask the Medium."', flag('lantern-coven1'), soon('spooky-light-two', 1))),
      ch('Go back.', out('You go back to the road. The light comes out of the trees after you and waits on the verge, patiently, like a dog that knows you will come round.', soon('spooky-light-two', 2))),
    ],
  },
  {
    id: 'spooky-light-two', callback: true, requires: [is('lantern-on'), not('lantern-held')],
    intro: 'The light is back, nearer now, close enough that the air goes cold around it and your breath shows. Close up, it is a lantern: an old iron one, with glass sides. It hangs in the air with no hand holding it, swaying slightly, as if somebody invisible is walking with it.',
    choices: [
      ch('Reach for it.', out('You reach out. The lantern drifts into your hands, and the handle is warm, as if someone was holding it a moment ago.', flag('lantern-held'), room('spooky-hollow-lantern'))),
      ch('Wait for it.', out('You wait. It comes to you, slowly, the last little way, and settles into your hands like a bird.', flag('lantern-held'), room('spooky-hollow-lantern'))),
      ch('Back away.', out('You back away. It follows you, all the way to the next node, keeping exactly the same distance. When you stop there, it comes the rest of the way on its own.', flag('lantern-held'), soon('spooky-hollow-lantern', 1))),
    ],
  },
  {
    id: 'spooky-hollow-lantern', mode: null, callback: true, requires: [is('lantern-held'), not('lantern-named')],
    intro: 'The lantern in your hands. A name is scratched on the glass, small and careful, the way you would write on something you meant to keep. The name is {released}. The flame inside is the colour of a {releasedType}-type, and it turns towards you when you breathe.',
    choices: [
      ch('I know that name.', out('You say it. {released}. The flame steadies, all at once, like someone sitting down after a long time standing.', flag('lantern-named'), flag('lantern-known'), soon('spooky-lantern-festival', 2))),
      ch('I don\'t remember.', out('The flame flickers, low and hurt. You did not mean it to. It does not go out. It just burns smaller, as if it is trying not to take up room.', flag('lantern-named'), flag('lantern-forgot'), soon('spooky-lantern-festival', 2))),
      ch('Put it down.', out('You set it on the ground. It floats back up to the height of your hand and follows you, as it did before, as if putting it down was a thing you said and not a thing you meant.', flag('lantern-named'), soon('spooky-lantern-festival', 2))),
    ],
    remembers: [
      v('blank', [not('released-count')], {
        intro: 'The lantern in your hands. There is a place on the glass where a name should be, scratched smooth, as if someone tried to write one and could not. The flame inside is pale, no colour at all, and it turns towards you when you breathe.',
        hide: [0], add: [ch('Write a name.', out('You scratch a name into the glass with the edge of a coin. It is a name you have never said out loud. The flame takes it, and steadies, and turns the colour of evening.', flag('lantern-named'), flag('lantern-known'), flag('lantern-written'), soon('spooky-lantern-festival', 2)))],
      }),
    ],
  },
  {
    id: 'spooky-lantern-festival', mode: null, callback: true, requires: [is('lantern-named'), not('lantern-festival')],
    intro: 'Autumn in a village. Lanterns hung all along the path, hundreds of them, every colour, and people walking slowly under them, talking quietly or not at all. A woman in a fringed shawl is lighting them one by one from a taper. The Medium, Orla: "The veil is thin tonight. Light one for someone you\'ve lost." Then she sees the lantern in your hands, and stops. Orla: "Oh." She lowers the taper. "Someone\'s already lit one for you."',
    choices: [
      ch('Light another.', out('Orla gives you the taper. You light one for a Pokémon of yours that fell this run and got up again, and one for the ones that did not get up, wherever they were. She hangs them on the path among the others.', flag('lantern-festival'), flag('lantern-lit'), fr(3, 'party'), soon('spooky-medium', 1))),
      ch('Who lit this one?', out('Orla: "They did." She touches the glass, very gently, by the name. "The one whose name is on it. They lit it, and they came looking for you with it."', flag('lantern-festival'), flag('lantern-who'), soon('spooky-medium', 1))),
      ch('Hang this one up.', out('You lift it towards a hook. Orla puts her hand on your wrist and shakes her head. Orla: "It\'s not done with you." She lets go. "Come and see me. I\'ve a table."', flag('lantern-festival'), soon('spooky-medium', 1))),
    ],
  },
  {
    id: 'spooky-medium', mode: null, callback: true, requires: [is('lantern-festival'), not('lantern-asked')],
    intro: 'A small round table behind a single candle, in a room that smells of beeswax and rain. Orla is sitting there already, with her shawl round her shoulders and two cups of tea poured. She has been expecting you, or someone like you. Orla: "It\'s not angry. Most of them aren\'t." She turns the lantern so the name faces you. "It wants to know if you were sorry. Or if you were right." A pause. "Sometimes those are the same."',
    choices: [
      ch('I was sorry.', out('The lantern warms in your hands, all the way through, like a cup of tea.', flag('lantern-asked'), flag('lantern-sorry'), soon('spooky-hollow-mirror', 1))),
      ch('I was right.', out('The lantern brightens. Orla nods slowly. Orla: "That\'s allowed." She drinks her tea. "That\'s allowed too."', flag('lantern-asked'), flag('lantern-right'), soon('spooky-hollow-mirror', 1))),
      ch('I don\'t know.', out('Orla: "Then go to the mirror." She says it gently. "Most people don\'t know. The mirror does."', flag('lantern-asked'), flag('lantern-unsure'), soon('spooky-hollow-mirror', 1))),
    ],
  },
  {
    id: 'spooky-hollow-mirror', mode: null, callback: true, requires: [is('lantern-asked'), not('lantern-mirror')],
    intro: 'A mirror in a ruined house, the frame gone green, the glass still perfect. It shows your team behind you, exactly as they are. And one more shape behind them, at the back, where nobody is standing. It is {released}. It looks the way it did the day you let it go. Then, while you watch, it looks the way it would now: older, bigger, steadier, with a scar you have never seen.',
    choices: [
      ch('Touch the glass.', out('The glass is warm under your hand, warm as a living side. On the other side of it, the shape leans into your palm.', flag('lantern-mirror'), soon('spooky-whispering-grave', 1))),
      ch('Say its name.', out('You say it. {released}. In the mirror the shape turns its head and looks straight at you, and you know it knows you.', flag('lantern-mirror'), soon('spooky-whispering-grave', 1))),
      ch('Turn around.', out('You turn round. Nobody there. Only your team, looking at you, puzzled. When you look down, the lantern is brighter than it has ever been.', flag('lantern-mirror'), soon('spooky-whispering-grave', 1))),
    ],
  },
  {
    id: 'spooky-whispering-grave', mode: null, callback: true, requires: [is('lantern-mirror'), not('lantern-grave')],
    intro: 'A grave in the long grass, so old the mound has nearly gone, and it is whispering: almost too soft to hear. You kneel. The cry of the Pokémon on the lantern comes up out of the earth, once, small and clear. The headstone is blank.',
    choices: [
      ch('Carve the name.', out('You carve the name you wrote on the lantern into the stone, slowly, with whatever you have. The whispering stops, like a child that has finally been answered.', flag('lantern-grave'), flag('lantern-carved'), soon('spooky-pale-visitor', 1))),
      ch('Leave it blank.', out('You leave it. It keeps whispering behind you all the way to the road.', flag('lantern-grave'), soon('spooky-pale-visitor', 1))),
      ch('Listen longer.', out('You stay. It cries again, once. Then it is quiet. The lantern dims, all the way down to nearly nothing, and then glows back up, brighter.', flag('lantern-grave'), flag('lantern-listened'), soon('spooky-pale-visitor', 1))),
    ],
    remembers: [
      v('alive', [RELEASED], {
        intro: 'Where the light leads you, there is no grave. Only a soft patch of mud by a stream, and in it a fresh print. A {releasedType}-type\'s print, the size of {released} if {released} had kept growing. The lantern flares. It is alive. Of course it is alive. You let it go; you did not lose it.',
        hide: [0, 1, 2],
        add: [ch('Follow the prints.', out('You follow the prints along the stream, and up a bank, and into the trees, until you can see where they go: a den under the roots of an old oak, with the earth worn smooth at the door by a lot of coming and going.', flag('lantern-grave'), flag('lantern-den'), soon('spooky-pale-visitor', 1)))],
      }),
    ],
  },
  {
    id: 'spooky-pale-visitor', mode: null, callback: true, requires: [is('lantern-grave'), not('lantern-visited')],
    intro: 'A pale figure at a roadside table set for two, under a tree with no leaves. White cloth, two plates, two cups, two of everything. The Pale Visitor: "Sit. I\'ve laid two places." A long hand, smoothing the cloth. "Always two." Then: "I sit with travellers carrying lanterns. I ask one thing." The Visitor looks at the lantern, and then at you. "If you could have it back, would you?"',
    choices: [
      ch('Yes.', out('The Visitor: "Then it\'s not done with you either." The Visitor pours tea into the second cup, the empty place, and pushes it gently across the table to nobody. "The Keeper will offer it. Go to the end of the lane."', flag('lantern-visited'), flag('lantern-want'), soon('spooky-hexed-keeper', 1))),
      ch('No. It\'s free.', out('The Visitor: "Then it can rest." The Visitor turns the second cup upside down on its saucer, very carefully. "Go to the end of the lane, and say so."', flag('lantern-visited'), flag('lantern-release'), soon('spooky-hexed-keeper', 1))),
      ch('Only if it wants to.', out('The Visitor smiles, for the first time. It is not a frightening smile at all. The Visitor: "That\'s the answer." The Visitor leaves the second cup as it is. "Go to the end of the lane. Ask it."', flag('lantern-visited'), flag('lantern-ask'), soon('spooky-hexed-keeper', 1))),
    ],
  },
  {
    id: 'spooky-hexed-keeper', mode: null, callback: true, requires: [is('lantern-visited'), not('lantern-done')],
    intro: 'The end of the lane. The Keeper stands there under the last lamp: an old man in a long coat, with keys at his belt that do not open anything you can see. He is not sorry. He is only tired. The Keeper: "I keep the ones who were let go. Until someone comes for them." He looks at the lantern. "Most never do. You did." He steps aside, and behind him, at the mouth of a den under an old oak, {released} is standing in the lamplight, with a family of its own peering out from the dark behind it. It has seen you. It is not coming closer yet. The Keeper: "It\'s here. It\'s up to you, and it\'s up to it."',
    choices: [
      ch('Come back.', out('You say it. {released} looks back at the den, once, for a long time. Then it walks out into the lamplight and puts its head against your chest, exactly where it used to, and does not move for a long while.', { kind: 'rejoinReleased' }, flag('lantern-done'), flag('lantern-came-back'), moment('The one you let go came back to you, out of the lamplight', 85)), { requires: [is('lantern-want')] }),
      ch('Never mind. Stay.', out('You do not say it. {released} looks at you, and you look at it, and then it goes back to its den and lies down across the door with its family, and the lantern goes out softly in your hands, warm to the last.', flag('lantern-done'), flag('lantern-rested'), moment('You let the one you let go stay with its family', 75)), { requires: [is('lantern-want')] }),
      ch('Rest.', out('You say it: rest. {released} looks at you for a long moment. Then it lies down across the door of its den, with its family around it, and closes its eyes. The lantern goes out softly in your hands, the glass cold and clean.', flag('lantern-done'), flag('lantern-rested'), moment('The one you let go is free, and you told it so', 75))),
      ch('Do you want to come?', out('You ask it. {released} looks at you, and at its family, and at you. Then it stays. It is wild and happy, and you can see it is happy, and the Keeper says it will visit. It does: twice before you leave the region, a shape at the edge of the camp light, watching you sleep.', flag('lantern-done'), flag('lantern-visits'), fr(5, 'party')), {
        requires: [is('lantern-ask')],
        branches: [
          br([is('lantern-sorry')], 'You ask it. {released} looks at you, and at its family, and at you, and then it walks out of the lamplight to your side. Its family watches it go, and does not seem sad. They seem to have known.', { kind: 'rejoinReleased' }, flag('lantern-done'), flag('lantern-came-back'), moment('You asked the one you let go if it wanted to come back. It did.', 90)),
          br([is('lantern-known')], 'You ask it. {released} hears its name in your voice, the way you used to say it, and it comes to you, slowly, and then all at once.', { kind: 'rejoinReleased' }, flag('lantern-done'), flag('lantern-came-back'), moment('You asked the one you let go if it wanted to come back. It did.', 90)),
        ],
      }),
    ],
    remembers: [
      v('blank', [not('released-count')], {
        intro: 'The end of the lane. The Keeper stands under the last lamp, an old man in a long coat with keys at his belt. He is not sorry, only tired. The Keeper: "I keep the ones who were let go. Until someone comes for them. Most never do." He looks at the name you wrote on the glass. "This one was nobody\'s. You gave it a name. That\'s a kind of coming for it." Behind him, a small pale Ghost-type is hiding behind his coat.',
        hide: [0], add: [ch('Come back.', fight('The Keeper sighs and takes off his coat. He is tired; he fights like someone who would like to lose, and if you are kind about it, he does.', safe(trainer('The Keeper', { cls: 'hex-maniac', size: 2, types: ['ghost'], lv: 0, win: [join({ types: ['ghost'] }), flag('lantern-came-back')] }), join({ types: ['ghost'] }), flag('lantern-came-back')), flag('lantern-done')), { requires: [is('lantern-want')] })],
      }),
      v('forgot-right', [is('lantern-forgot'), is('lantern-right')], { notice: 'The Keeper, as you pass him: "You didn\'t remember it, and you weren\'t sorry." He jingles his keys. "It still came to you. Think about that."' }),
    ],
  },
  // ---------- SF16.10 The festival stops (drawn while the lantern is carried) ----------
  {
    id: 'spooky-costume-judge', requires: [...CARRIED, season('Autumn')],
    intro: 'A stage made of hay bales, a crowd in masks, and a judge in a tattered cloak with a scorecard and a very serious face. Judge: "Best costume wins the prize!" Somewhere in the crowd a Pikachu dressed as a Mimikyu dressed as a Pikachu is causing a lot of confusion.',
    choices: [
      ch('Dress my lead as a Ghost.', out('A sheet with eyeholes, a bit of chain, a lot of dignity. Your lead takes it very seriously. The judge takes it very seriously too, and gives it the prize: a Spell Tag, tied on with black ribbon.', item('spell-tag'), fr(3, 'lead'))),
      ch('Dress as my lead.', out('You come out dressed as your lead. The crowd loves it. Your lead comes out to look at you, and walks all the way round you, and then sits down and stares. The judge gives you a little carved pumpkin trophy, and your lead will not stop looking at it.', fr(6, 'lead'), flag('pumpkin-trophy'))),
      ch('No costume.', out('The judge looks at you over the scorecard and sighs. Judge: "Next year."')),
    ],
  },
  {
    id: 'spooky-pumpkin-patch', requires: [...CARRIED],
    intro: 'Rows and rows of carved pumpkins on a hillside, all of them lit, all of them grinning. You are halfway along the second row when one of them blinks.',
    choices: [
      ch('Pick the blinking one.', fight('You reach for it, and it hops back, and grins wider, and is a Pumpkaboo.', wild({ species: ['pumpkaboo'], lv: 0 }))),
      ch('Leave it.', out('You leave it. At the next stop, there is a pumpkin sitting on the path that was not there before. It blinks.', soon('spooky-pumpkin-patch', 1))),
      ch('Carve one.', out('You sit down in the patch with a knife and carve the name from your lantern into the biggest pumpkin you can find. When you light it, the blinking pumpkin hops over and climbs inside it and sits there, glowing, perfectly content. It is a Pumpkaboo. It does not want to leave the name. You carry them both.', join({ species: ['pumpkaboo'] }))),
    ],
  },
  {
    id: 'spooky-trick-or-treat', requires: [...CARRIED],
    intro: 'A pack of costumed kids on the road, pillowcases out, faces painted. A small Gengar, a medium Gengar, and a very tall Gengar who is clearly somebody\'s big brother. Kids: "Trick or treat!"',
    choices: [
      ch('Treat. (give a Berry)', out('You hand over a Berry. They confer. Then the tall one gives you a Rare Candy back from the bottom of his pillowcase, and they all run off giggling.', lose('oran-berry'), item('rare-candy')), { requires: [{ kind: 'item', id: 'oran-berry' }] }),
      ch('Trick.', out('Your Ghost-type rises up out of the dark behind them. They scream, all three, magnificently. Then they laugh so hard they have to sit down. The littlest one asks, very politely, to see it again.', fr(6, { types: ['ghost'] })), { requires: [anyType('ghost')] }),
      ch('Join them.', out('You join them. You are a very tall Gengar. By the end of the street you have a whole bag of sweets, and at the bottom of it, a Berry.', any(...BERRIES))),
    ],
  },
  {
    id: 'spooky-haunted-mansion', requires: [...CARRIED],
    intro: 'A big dark house at the top of a drive, every window black but one, which glows orange. As you come up the steps, something behind the front door giggles.',
    choices: [
      ch('Knock.', out('A Gourgeist opens the door, looks at you, looks at your lantern, and stands aside. Inside there is a fire, and tea, and a lot of very old armchairs, and it lets you all sleep until morning.', heal(1))),
      ch('Go in.', fight('Three rooms. Three sets of Ghost-types in the dark. At the end, on a table in the last room, a Reaper Cloth folded very neatly, as if someone left it for you.', safe(trainer('The Mansion', { cls: 'hex-maniac', size: 2, types: ['ghost'], lv: 1, chain: 3, win: [item('reaper-cloth')] })))),
      ch('Leave.', out('You go back down the steps. Behind the door, it giggles harder.')),
    ],
  },
  {
    id: 'spooky-graveyard-dig', requires: [...CARRIED],
    intro: 'Moonlight on the old graveyard. By the gate, someone is digging, with a little ghostly beam of light floating at her shoulder. She sees you and straightens up fast. A teenage girl in a Hex Coven scarf. Digger: "I\'m not grave robbing! I\'m looking for my Pokémon\'s Ball!"',
    choices: [
      ch('Help dig.', out('You dig together until your hands hurt. Then the spade hits something. A Poké Ball, old and dirty. She opens it with shaking hands, and a Duskull pops out and looks round, puzzled, and she sits down in the dirt and cries and cries.', fr(3, 'party'), flag('coven-ball-found'))),
      ch('Stop her.', out('She runs before you can say anything else. The Ball stays where it is, under the earth.')),
      ch('Ask about it.', out('She buried it there, she says, after it fainted, years ago. She thought it was gone. She came back because she heard it. Digger: "It\'s a Ghost now," she says. "It\'s been waiting." She goes back to digging, slower now, and you stay and hold the light.', flag('coven-ball-found'))),
    ],
  },
  {
    id: 'graveyard-vigil', requires: [...CARRIED],
    intro: 'Candles flicker over old graves, a hundred small lights in the grass. A groundskeeper sits on a bench by the gate with a flask and keeps watch. Groundskeeper: "Light one." He holds out a taper. "They like company."',
    choices: [
      ch('Light one.', out('You light a candle on the nearest grave. Your lantern brightens, all at once, as if it has been introduced to someone.', flag('lantern-bright'))),
      ch('Sit a while.', out('You sit on the bench next to him. He shares his flask. Neither of you says anything for an hour, and it is the most restful hour of the run.', heal(1))),
      ch('Move on.', out('You nod to the groundskeeper and move on. He lifts the flask.')),
    ],
  },
  {
    id: 'spooky-candle-vigil', requires: [...CARRIED],
    intro: 'A circle of candles burning in the dark, in a clearing, nobody tending them. All of them lean the same way in a wind you can\'t feel. One of them is watching you.',
    choices: [
      ch('Watch back.', out('You watch it back. It is a Litwick. It looks at your lantern, and at the flame in it, for a long time, and then it climbs up your arm and sits on your shoulder, as if the colours matched.', join({ species: ['litwick'] })), { requires: [is('lantern-known')] }),
      ch('Blow it out.', out('You blow it out. It relights itself immediately, very offended, and glares at you until you leave.')),
      ch('Sit in the circle.', out('You sit down in the middle. All the candles lean towards the lantern, every one of them, and stay like that, as if they are warming their hands.', fr(4, 'party'))),
    ],
  },
  {
    id: 'spooky-lost-spirit', requires: [...CARRIED],
    intro: 'A little teacup spirit floats in slow circles above the road, round and round, chipped at the rim. Lost.',
    choices: [
      ch('Follow it.', out('You walk under it until its circles straighten out into a line, and the line goes down a lane to a cottage with a lit window and an old woman at the gate looking up at the sky. It is a Sinistea. It hovers between you and her.', room('spooky-lost-spirit-home'))),
      ch('Give it the lantern\'s light.', out('You hold the lantern up. The Sinistea stops circling, and drifts down to it, and follows it. It follows you.', join({ species: ['sinistea'] }))),
      ch('Leave it.', out('You leave it. It keeps circling, slower and slower.')),
    ],
  },
  sub('spooky-lost-spirit', 'spooky-lost-spirit-home', 'The Teacup Comes Home', 'The old woman holds out her hands. The Sinistea looks at her, and at you, and back. It is up to you.', [
    ch('Go home.', out('You nod at it. It goes into her hands like tea into a cup. She thanks you with a kiss on both cheeks and a jar of honey.', item('sitrus-berry'), flag('sinistea-home'))),
    ch('Come with me?', out('The old woman laughs. "It always did like travelling," she says. "Go on, then." It comes to you.', join({ species: ['sinistea'] }))),
  ]),
  // ---------- SF16.12 The Pumpkin King and the Midnight Parade ----------
  {
    id: 'spooky-pumpkin-king', requires: [...CARRIED],
    intro: 'A towering figure with a lantern for a head blocks the road, arms out wide. Pumpkin King: "Only the brave pass my patch!" Then its lantern head turns, slowly, toward the lantern in your hands. It falters. Pumpkin King: "...Oh." Smaller. "You\'ve got one too."',
    choices: [
      ch('Battle.', fight('The Pumpkin King steps aside, and out of the patch behind him rises an enormous, ancient Gourgeist, an Alpha, grinning a grin as wide as a gate.', wild({ species: ['gourgeist'], lv: 3, win: [item('rare-candy')] }))),
      ch('Show it the lantern.', out('You hold it up. The Pumpkin King looks at the name for a long time. Then it bows, very low, and steps aside.')),
      ch('Who\'s in yours?', out('He takes the pumpkin head off. He is a man of about seventy with a wet face. Man: "My old Houndoom," he says. "Every year." You light your lanterns from each other and stand together for a while, two lights on the road.', fr(4, 'party'))),
    ],
  },
  {
    id: 'spooky-midnight-finale', requires: [...CARRIED],
    intro: 'Midnight. Down the road comes the Hex Coven, leading the last parade of the season: robes, drums, a hundred lanterns, and Ghost-types drifting above it all like smoke. At the front walks their leader, tall, grey-haired, with a Mismagius at her shoulder. Morwen: "Walk with us. Bring your lantern." She looks at it. "Everyone who walks tonight walks with someone."',
    choices: [
      ch('Battle Morwen.', fight('Morwen laughs and hands her lantern to someone. Her whole Coven team comes up out of the dark.', COVEN('Morwen', { size: 4, lv: 2, win: [item('reaper-cloth'), flag('coven-sash')] }))),
      ch('Walk.', out('You walk. Halfway down the street the parade passes the name on your lantern, and every Ghost-type in it turns, and bows to it, one after another, all the way down the line.', fr(5, 'party'), moment('The midnight parade bowed to the name on your lantern', 70))),
      ch('Watch.', out('You sit on a wall and watch the whole parade go by, every lantern, until the road is dark again. You feel rested, the way you do after a long cry.', heal(1))),
    ],
  },
];

// =====================================================================================================================
// SF17. THE GRUNT SCHOOL. Comic, then serious. `grunt-school-active` is set while Dilly is still a Grunt (the markets row
// reads it) and cleared when her story ends.
// =====================================================================================================================
const SCHOOL_ON = [flag('grunt-school-active'), flag('grunt-taught')];
const DILLY_DONE = [flag('grunt-dilly-done'), clear('grunt-school-active'), flag('dilly-cap')];
const SCHOOL: Json[] = [
  {
    id: 'vt-grunt-school',
    intro: 'A rented room above a laundry, smelling of soap. A class of nervous rookies in uniforms two sizes too big sit round a whiteboard, holding their Poké Balls like hot potatoes. The teacher, a tired ex-Admin with a bad tooth, looks up as you pass the door. Mr. Pask: "Can you substitute? I\'ve got a dentist." He is already putting his coat on. "Lesson plan\'s on the board. HOW TO MENACE." He looks at the class. "They\'re very bad at it." A rookie at the front with a Wooper badge on her cap puts her hand up. Dilly: "Do we have to be mean? I\'m not very mean."',
    choices: [
      ch('Teach them to menace.', out('You demonstrate a scary pose. Two of the rookies get quite good at it, and one of them frightens himself. Dilly tries the pose, and wobbles, and bursts into tears, and the whole class comforts her.', ...SCHOOL_ON, flag('grunt-taught-menace'))),
      ch('Teach them to battle.', fight('You run three practice battles at the front of the room. By the third they understand type matchups. By the end Dilly is drawing a type chart on the board from memory, with her tongue between her teeth.', safe(grunt('Rookie Grunts', { size: 2, lv: -1, chain: 3 })), ...SCHOOL_ON, flag('grunt-taught-battle'))),
      ch('Teach them to quit.', out('You write the word QUIT on the board, and under it, HOW. You get as far as "you can just walk out" when Mr. Pask comes back early, furious, with his face numb. He throws you out. On your way down the stairs, Dilly runs after you and writes your name on the back of her hand in biro.', ...SCHOOL_ON, flag('grunt-taught-quit'))),
    ],
  },
  {
    id: 'vt-grunt-union-strike', requires: [is('grunt-taught')],
    intro: 'Grunts on the road, a whole line of them, in uniform, holding painted signs: FAIR PAY FOR VILLAINY. DENTAL NOW. THEY TAKE OUR POKÉMON. They refuse to battle anyone. A Grunt with a clipboard and a sensible haircut steps out. Union rep Hobbs: "Sign the petition. We want dental. We want weekends." He lowers his voice. "And we want our Pokémon back on Sundays." Halfway down the line, Dilly is waving at you with both arms.',
    choices: [
      ch('Sign.', out('You sign. Hobbs shakes your hand. The whole line cheers. For a while after this, {evil} is short of Grunts: half of them are on the picket.', flag('grunt-signed'), { kind: 'evil', heat: -1 })),
      ch('Cross the line.', out('You cross. The line boos, long and loud. Nobody fights you; they won\'t, it\'s a strike. The road is clear. Dilly is not waving any more. She is just looking at you.', flag('grunt-crossed'))),
      ch('Ask about the Pokémon.', out('Hobbs: "They take them Monday to Friday. Lock them in the kennels. Give them back at weekends." He looks at his clipboard. "Some come back hurt. Some come back quiet." Behind him, Dilly has stopped waving.', flag('grunt-asked'))),
    ],
  },
  {
    id: 'vt-grunt-favor', callback: true, requires: [is('grunt-taught'), later('grunt-taught', { stages: 1 }), not('grunt-dilly-done')],
    intro: 'The rookies from the school are waiting at the roadside, waving, with a gift basket wrapped in cellophane. Rookies: "We remembered your lesson!" They push the basket into your arms: Berries, and a little bottle of berry juice, and a card everyone has signed. Then they go. Dilly hangs back. Dilly, quietly: "Can I talk to you?" She looks over her shoulder. "They want me on a real job tonight. A nest raid. I can\'t. I can\'t do it." Her voice cracks. "They keep my Wooper till Friday. If I quit, they keep it."',
    choices: [
      ch('Help you quit. (two nodes)', out('You go in that night, the two of you, through the kennel\'s back fence and along the rows of cages in the dark, and it takes two nodes of creeping and waiting and holding your breath. At the end there is a Wooper, asleep with its face against the bars. Dilly opens the cage with shaking hands. In the morning she hands in her uniform, folded, with the cap on top. She keeps the cap.', item('oran-berry', 2), item('sweet-berry-juice'), takeNode(2), flag('grunt-dilly-out'), ...DILLY_DONE, moment('You helped Dilly get her Wooper back and walk out', 75))),
      ch('Do the job and sabotage it.', out('Dilly goes on the raid. You follow. In the dark you loosen a net, scatter a scent, kick over a lantern at the right moment. The raid fails, and nobody knows why. Dilly finds you afterwards and does not say anything, and squeezes your hand. In the mess afterwards you pick up a dropped order sheet with one of {evil}\'s plans on it.', item('oran-berry', 2), item('sweet-berry-juice'), flag('grunt-dilly-inside'), { kind: 'evil', heat: -1, mark: 'plan-seen' }, ...DILLY_DONE)),
      ch('Tell the union.', out('You find Hobbs. He listens, and then he goes and gets everyone. In the morning the whole picket line walks Dilly to the kennels together, signs up, and stands there until somebody brings her Wooper out. {evil} lets her go. It would rather not have the photographs.', item('oran-berry', 2), item('sweet-berry-juice'), flag('grunt-dilly-union'), ...DILLY_DONE), { chance: 0.6, fail: out('Hobbs listens, and shakes his head. Not tonight; half the line has gone home. You do it the hard way instead: two nodes in the dark, the back fence, the rows of cages, and a Wooper asleep against the bars.', item('oran-berry', 2), item('sweet-berry-juice'), takeNode(2), flag('grunt-dilly-out'), ...DILLY_DONE) }),
    ],
    remembers: [
      v('quit', [is('grunt-taught-quit')], { notice: 'Dilly holds up the back of her hand. Your name is still on it, gone over in fresh biro. Dilly: "You said I could. I wrote it on my hand."', hide: [0], add: [ch('Help you quit. (a node)', out('Dilly already knows the way. She has walked it in her head every night since the lesson. One node of creeping, and there is the Wooper, asleep against the bars. In the morning she hands in her uniform with the cap on top. She keeps the cap.', item('oran-berry', 2), item('sweet-berry-juice'), takeNode(1), flag('grunt-dilly-out'), ...DILLY_DONE, moment('You helped Dilly get her Wooper back and walk out', 75)))] }),
      v('signed', [is('grunt-signed')], { notice: 'Dilly: "The union still talks about you. The one who signed."', hide: [2], add: [ch('Tell the union.', out('Hobbs does not even let you finish. In the morning the whole picket line walks Dilly to the kennels, signs up, and stands there until somebody brings her Wooper out. {evil} lets her go.', item('oran-berry', 2), item('sweet-berry-juice'), flag('grunt-dilly-union'), ...DILLY_DONE))] }),
      v('crossed', [is('grunt-crossed')], { notice: 'Dilly does not mention the picket line. She does not have to. The union will not help you now.', hide: [2] }),
    ],
  },
];

// =====================================================================================================================
// SF18. THE HEIST. The informant is fixed by region (Ruth, Kip, or Vesna); the clues in the plan point at them.
// =====================================================================================================================
const RUTH = inRegion('kanto', 'sinnoh', 'kalos', 'paldea', 'frontier-isles', 'cairnmoor');
const KIP = inRegion('johto', 'unova', 'alola', 'torren', 'grand', 'orrery-basin');
const admin = (o: { lv?: number; ally?: boolean; win?: Json[] } = {}): Json =>
  safe({ ...trainer('The Admin', { cls: 'ace-trainer', size: 4, lv: o.lv ?? 2, ...(o.ally ? { format: 'doubles', ally: 'kingambit' } : {}), win: o.win ?? [] }), evil: 'executive' });

/** The approach (the informant, fixed by region, is noted here so the scenes after can read it). */
const approach = (...tag: Json[]): Json[] => [
  ch('Quiet. Night, and stealth.', out('Night, soft shoes, no lights. The crew moves like one animal.', flag('heist-quiet'), ...tag, room('heist-go'))),
  ch('Loud. A distraction.', fight('You start a fight at the front gate with a pair of Grunts, loud enough that the whole building comes to watch.', safe(grunt('Gate Grunts', { size: 2, lv: 0, chain: 2 })), flag('heist-loud'), ...tag, room('heist-go'))),
  ch('Inside. One of us poses as a Grunt.', out('Kip borrows a uniform, two sizes too big, and walks in through the front door, whistling.', flag('heist-inside'), ...tag, room('heist-go'))),
];
// The three roles, offered again after you ask about the vault (heist-plan-again).
const HEIST_ROLES = [
      ch('I\'ll be the lookout.', out('You will watch the corridors: three guard patrols to spot and send the wrong way.', flag('heist-role-look'), room('heist-approach'))),
      ch('I\'ll crack the safe.', out('Ruth hands you her stethoscope like it is a sacred object. A dial lock, and a Psychic-type or a Steel-type of yours to feel the tumblers.', flag('heist-role-safe'), room('heist-approach')), { requires: [anyType('psychic', 'steel')] }),
      ch('I\'ll drive.', out('Kip throws you the keys, reluctantly. After the job, there will be a chase, and fast Pokémon and flying ones will be worth their weight.', flag('heist-role-drive'), room('heist-approach'))),
];
const HEIST: Json[] = [
  {
    id: 'heist-plan',
    intro: 'A back room under a bar, one bulb, a table covered in a blueprint held down at the corners with glasses. A crew of three. The boss, a woman with a scar through one eyebrow and a calm voice: Vesna: "We need a lookout, a safecracker and a driver. You pick the plan. We execute." She taps the vault on the blueprint. "The vault\'s {evil}\'s. Everything in it was stolen first. We\'re just stealing it back." The safecracker, an older woman cleaning her glasses: Ruth: "Mostly back. A cut for us." The driver, young, jiggling one knee: Kip: "And for me. I have expenses." The cut is on the blueprint in pencil, for honesty: a quarter of the cash, yours.',
    choices: [
      ...HEIST_ROLES,
      ch('Who\'s in the vault?', out('Vesna: "Stolen Poké Balls. Cash. And a ledger." She looks at you, very steady. "The ledger\'s mine. Non-negotiable."', flag('heist-asked'), room('heist-plan-again'))),
    ],
    remembers: [
      v('ruth', [RUTH], { notice: 'Ruth checks her watch. Then again. Then again, as if the time might have changed its mind.' }),
      v('kip', [KIP], { notice: 'Kip has a little radio clipped inside his jacket. When he sees you notice it, he zips the jacket up.' }),
      v('vesna', [not('heist-informant-ruth'), not('heist-informant-kip')], { notice: 'Every time anyone says the word "ledger", Vesna\'s hand goes still on the table. She wants it very badly.' }),
    ],
  },
  sub('heist-plan', 'heist-plan-again', 'The Heist: Your Part', 'Vesna lets the word ledger sit on the table a moment longer. Then she smooths the blueprint flat again with both hands. Vesna: "So. Which part is yours?"', HEIST_ROLES),
  sub('heist-plan', 'heist-approach', 'The Heist: The Approach', 'The crew looks at you. Vesna: "And the approach?"', approach(), {
    remembers: [v('ruth', [RUTH], { hide: [0, 1, 2], add: approach(flag('heist-informant-ruth')) }), v('kip', [KIP], { hide: [0, 1, 2], add: approach(flag('heist-informant-kip')) })],
  }),
  {
    id: 'heist-go',
    intro: 'Everyone in position. The corridor is quiet; the vault door is at the end of it, and it is a little ajar. Ruth: "Ajar. It\'s never ajar." Vesna: "Then someone opened it." Footsteps. Out of the dark beside the vault steps {lieutenant}, {evil}\'s Admin, smiling. Admin: "Thank you for the tip." A nod past you, to the crew. "Vesna. Well done." Vesna does not look at any of you.',
    choices: [
      ch('Fight our way out.', fight('You fight side by side with what is left of the crew: two of them, not three.', admin({ ally: true, win: [flag('heist-won')] }), flag('heist-fought'), room('heist-ledger'))),
      ch('Grab the Balls and run. (a node)', out('You sweep the stolen Poké Balls into a sack and run, and the chase costs you a node of road, and at the end of it, on a hill, you open every Ball. The Pokémon go home. One of them does not go. It sits down by your feet and looks up at you. The cash stays in the vault.', takeNode(1), flag('heist-freed'), { kind: 'evil', pen: true }, join({}), room('heist-ledger'))),
      ch('Turn on the informant.', out('You turn round to face your own crew.', room('heist-name'))),
    ],
    remembers: [
      v('ruth', [RUTH], { intro: 'Everyone in position. The vault door is at the end of the corridor, and it is a little ajar. Ruth: "Ajar. It\'s never ajar." She checks her watch. Vesna: "Then someone opened it." Footsteps. Out of the dark beside the vault steps {lieutenant}, {evil}\'s Admin, smiling. Admin: "Thank you for the tip. Ruth. Well done." Ruth puts her watch away.' }),
      v('kip', [KIP], { intro: 'Everyone in position. The vault door is at the end of the corridor, and it is a little ajar. Ruth: "Ajar. It\'s never ajar." Vesna: "Then someone opened it." Footsteps. Out of the dark beside the vault steps {lieutenant}, {evil}\'s Admin, smiling, and holding a little radio. Admin: "Thank you for the tip. Kip. Well done." Kip goes white.' }),
    ],
  },
  sub('heist-plan', 'heist-name', 'The Informant', 'Three faces. One of them sold you. The clues were all there.', [
    ch('Ruth.', fight('Ruth: "Me?" She is so hurt she can\'t finish. She walks out. Behind you, Vesna has already gone, with the ledger in her coat. You fight the Admin with Kip, and only Kip.', admin({ ally: true }), flag('heist-named-wrong'), room('heist-ledger'))),
    ch('Kip.', fight('Kip: "I\'ve never even--" He walks out, white. Behind you, Vesna has already gone. You fight the Admin with Ruth, and only Ruth.', admin({ ally: true }), flag('heist-named-wrong'), room('heist-ledger'))),
    ch('Vesna. You wanted the ledger too badly.', fight('Vesna looks at you for a long time. Then she laughs, tiredly, and turns round, and stands beside you instead. Vesna: "They have my brother." The Admin is alone now, and knows it.', admin({ lv: 0, ally: true }), flag('heist-named-right'), flag('heist-vesna-flipped'), room('heist-ledger'))),
  ], {
    remembers: [
      v('ruth', [RUTH], { hide: [0, 1, 2], add: [
        ch('Ruth. You kept checking the time.', fight('Ruth takes her glasses off and folds them. Ruth: "They said nobody would be hurt." She turns round and stands beside you. The Admin is alone now.', admin({ lv: 0, ally: true }), flag('heist-named-right'), room('heist-ledger'))),
        ch('Kip.', fight('Kip walks out, white. Ruth slips away in the noise. You fight the Admin with Vesna.', admin({ ally: true }), flag('heist-named-wrong'), room('heist-ledger'))),
        ch('Vesna.', fight('Vesna stares at you, then walks out without a word. Ruth slips away behind her. You fight the Admin with Kip.', admin({ ally: true }), flag('heist-named-wrong'), room('heist-ledger'))),
      ] }),
      v('kip', [KIP], { hide: [0, 1, 2], add: [
        ch('Ruth.', fight('Ruth walks out, hurt past speaking. Kip slips away in the noise. You fight the Admin with Vesna.', admin({ ally: true }), flag('heist-named-wrong'), room('heist-ledger'))),
        ch('Kip. The radio.', fight('Kip: "They said they\'d forget my debts." He takes the radio out and drops it and stamps on it, and then he is standing beside you. The Admin is alone now.', admin({ lv: 0, ally: true }), flag('heist-named-right'), room('heist-ledger'))),
        ch('Vesna.', fight('Vesna walks out without a word. Kip slips away in the noise. You fight the Admin with Ruth.', admin({ ally: true }), flag('heist-named-wrong'), room('heist-ledger'))),
      ] }),
    ],
  }),
  sub('heist-plan', 'heist-ledger', 'The Ledger', 'Afterwards, in the back room again, with the bulb swinging. On the table, the ledger: every name {evil} has squeezed, every Pokémon it has taken, in a neat hand. And the cash, counted into piles. Vesna: "The ledger." She does not reach for it. "Who has it?"', [
    ch('Vesna, take it.', out('She takes it, and holds it against her chest with both arms. Vesna: "Three of them are still in their kennels. Not for long." Your quarter of the cash, counted out in front of you.', $(1000), { kind: 'evil', pen: true }, flag('heist-ledger-vesna'))),
    ch('It goes to the police.', out('Officer Jenny reads it twice. Two of {evil}\'s plans are in there, laid out plain. The crew is furious; there is no cut. Ruth won\'t look at you. Kip kicks a chair.', { kind: 'evil', heat: -2, mark: 'plan-seen' }, flag('heist-ledger-police'))),
    ch('I\'ll keep it.', out('You put it in your pack. Vesna watches it go and says nothing at all. For the rest of this region you know {evil}\'s movements before they make them. Your quarter of the cash, counted out.', $(1000), { kind: 'evil', mark: 'ledger-kept' }, flag('heist-ledger-kept'))),
  ], {
    remembers: [
      v('vesna-informant', [not('heist-named-right'), not('heist-informant-ruth'), not('heist-informant-kip')], { notice: 'Vesna has been watching the ledger the whole time.', hide: [0], add: [ch('Vesna, take it.', out('She takes it. And then she is gone, out of the back door, into the night, with the ledger, straight to {evil}. Ruth puts her face in her hands. Your quarter of the cash is still on the table. It is not worth much, now.', $(1000), { kind: 'evil', heat: 1 }, flag('heist-ledger-lost')))] }),
      v('asked', [is('heist-asked')], { notice: 'You remember Vesna\'s "non-negotiable." You knew about the ledger before any of this. That was a clue too.' }),
    ],
  }),
];

// ---------- Spooky Mode and the Spooky Season: the lantern finds you (no Autumn needed) ----------
const LANTERN_FINDS = (id: string, o: Json): Json => sub('spooky-hollow-lantern', id, 'The Lantern Finds You', 'Dusk, and the road is quiet in the way roads are only in the season of ghosts. A light comes down the verge towards you, low, bobbing, unhurried: an old paper lantern with nobody holding it. It stops a step away and waits, the way a dog waits to be noticed. There is a name scratched on the glass.', [
  ch('Take it.', out('You take the handle. It is warm, as if someone was holding it a moment ago. The flame inside turns towards you.', flag('lantern-on'), flag('lantern-held'), room('spooky-hollow-lantern'))),
  ch('Let it follow you.', out('You walk on. It follows at your shoulder, patient, all the way to the next node, and when you stop there it settles into your hand by itself.', flag('lantern-on'), flag('lantern-held'), room('spooky-hollow-lantern'))),
], { room: false, callback: false, requires: [not('lantern-on')], ...o });
LANTERN.push(LANTERN_FINDS('spooky-lantern-finds-you', { mode: 'spooky', modeStop: true }), LANTERN_FINDS('spooky-season-lantern', { gameEvent: 'spooky-season', mode: null }));

// ---------- Spooky objectives (Spooky Mode and the Spooky Season count clues, a boss and a finale) ----------
const clue = (amount = 1): Json => ({ kind: 'count', counter: 'eventClues', amount });
const BOSS: Json = { kind: 'count', counter: 'eventBossesWon', amount: 1 };
const FINALE: Json = { kind: 'count', counter: 'eventFinalesWon', amount: 1 };
const COUNTS: Record<string, (Json | null)[]> = {
  'spooky-hollow-lantern': [clue(), clue(), clue()],
  'spooky-lantern-festival': [clue(), clue(), clue()],
  'spooky-medium': [clue(), clue(), clue()],
  'spooky-whispering-grave': [clue(), clue(), clue()],
  'spooky-pale-visitor': [clue(), clue(), clue()],
  'spooky-hexed-keeper': [BOSS, BOSS, BOSS],
  'spooky-hollow-mirror': [FINALE, FINALE, FINALE],
  'spooky-haunted-mansion': [clue(), clue(), null],
  'spooky-pumpkin-patch': [clue(), clue(), null],
  'spooky-candle-vigil': [clue(), clue(), clue(2)],
  'spooky-lost-spirit': [clue(2), clue(), null],
  'spooky-trick-or-treat': [clue(), clue(), null],
  'spooky-graveyard-dig': [clue(), clue(), null],
  'spooky-pumpkin-king': [BOSS, clue(), clue()],
  'spooky-midnight-finale': [FINALE, clue(), clue()],
};
for (const e of LANTERN) {
  const adds = COUNTS[e.id as string];
  if (!adds) continue;
  const addTo = (c: Json, fx: Json) => {
    const out = (c.success ?? {}) as Json;
    if (out.battle) ((out.battle as Json).win as Json[]).push(fx);
    else (out.effects as Json[]).push(fx);
  };
  (e.choices as Json[]).forEach((c, i) => { const fx = adds[i]; if (fx) addTo(c, fx); });
  for (const r of (e.remembers as Json[] | undefined) ?? []) for (const c of ((r.addChoices as Json[] | undefined) ?? [])) addTo(c, adds[0]!);
}

export const EVENTS: Json[] = withRooms([...CONVOY, ...LANTERN, ...SCHOOL, ...HEIST]);
