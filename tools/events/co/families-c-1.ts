// Catalog Overhaul, families-c part 1: STORY_FAMILIES_9.md SF55 to SF59 (Things for Things, A Trainer in Trouble,
// The Trainer Who Wants to Stop, The Valley, The Taken Egg). Re-read log: docs/status/co-families-c.md.
import { $, again, ch, egg, ev, evil, fight, flag, flagAgo, flagIs, fr, good, item, join, leave, money, out, peace, room, takeNode, type Json } from '../dsl.ts';
import { apprenticeCopies, HEAL_ITEMS, bagHas, done, kindness, notYet, repDown, repUp, spend, stamped, tf, wf, against, keptGoods } from './_families-c-kit.ts';

export const CATEGORY = 'families-c';

type Tier = 'common' | 'uncommon' | 'rare';
const TIER: Record<Tier, string> = { common: 'a Common', uncommon: 'an Uncommon', rare: 'a Rare' };
const UP: Record<Tier, Tier | null> = { common: 'uncommon', uncommon: 'rare', rare: null };
const barterHas = (tier: Tier, berry = false): Json => ({ kind: 'barterHas', tier, berry });
const barter = (give: Tier | undefined, get: Tier, berry = false): Json => ({ kind: 'barter', ...(give ? { give } : {}), get, berry });
const NIX = { cast: ['trainer.hex_maniac'], tint: '#241f30', effect: 'flicker' };

// ---------- SF55 Things for Things ----------

/** What the player puts on the table, then what they ask for. Nix only takes a fair trade, either way. */
function tierRoom(give: Tier): Json {
  const choices: Json[] = (['common', 'uncommon', 'rare'] as Tier[]).map((get) => {
    const label = `Nix's ${get === 'common' ? 'Common' : get === 'uncommon' ? 'Uncommon' : 'Rare'}: {stock:${get}}.`;
    const order = { common: 0, uncommon: 1, rare: 2 };
    if (get === give) return ch(label, out(`Nix sets your {give:${give}} beside the {stock:${get}} and looks at them both for a long moment. "Fair. Both sides." The cloak nods once, and the trade is done.`, barter(give, get), flag('barter-traded')));
    if (order[get] < order[give]) return ch(label, out(`Nix pushes your {give:${give}} back across the table. "No. You'd be cheating yourself. That's ${TIER[give]} for ${TIER[get]}." A gloved hand taps the board. "Take this instead."`, room(`barter-fair-${give}`)));
    if (UP[give] === get) return ch(label, out(`Nix shakes their head slowly. "That's ${TIER[give]} for ${TIER[get]}. Add a Berry." It isn't greed. It's arithmetic, said gently.`, room(`barter-berry-${give}`)));
    return ch(label, out(`"That's ${TIER[give]} for ${TIER[get]}." Nix almost laughs. "No Berry closes a gap that wide. Pick again."`, room(`barter-${give}`)));
  });
  return ev(`barter-${give}`, 'The Barter Board', 'NPC Stories', { room: true, ...NIX },
    `Nix lays your {give:${give}} on the scarred table, under the lamp. "${TIER[give].replace(/^a/, 'A')} item. Good. Now, what do you want for it?"`,
    [...choices, ch('Take it back.', out('You slip it back into your bag. Nix doesn\'t mind. "Looking is free down here."', room('barter-table')))]);
}

const BARTER_ROOMS: Json[] = [
  ev('barter-table', 'The Barter Board', 'NPC Stories', { room: true, ...NIX },
    'The board hangs over the table, each item with its tier chalked beside it. Common: {stock:common}. Uncommon: {stock:uncommon}. Rare: {stock:rare}. Nix waits. "What do you put on the table?"',
    [
      ch('A Common: your {give:common}.', out('You set it down.', room('barter-common')), { requires: [barterHas('common')] }),
      ch('An Uncommon: your {give:uncommon}.', out('You set it down.', room('barter-uncommon')), { requires: [barterHas('uncommon')] }),
      ch('A Rare: your {give:rare}.', out('You set it down, a little reluctantly.', room('barter-rare')), { requires: [barterHas('rare')] }),
      ch('Nothing, after all.', leave('You shake your head. Nix shrugs. "The board will still be here. So will I."')),
    ]),
  tierRoom('common'),
  tierRoom('uncommon'),
  tierRoom('rare'),
  ...(['common', 'uncommon'] as Tier[]).map((give) => ev(`barter-berry-${give}`, 'The Barter Board', 'NPC Stories', { room: true, ...NIX },
    `"Your {give:${give}} and a Berry, for my {stock:${UP[give]}}," Nix says. "Then both sides are worth the same, and nobody walks out of here poorer."`,
    [
      ch('Add a Berry.', out(`You put a Berry beside it. Nix weighs them in one palm, then nods. "Fair." The {stock:${UP[give]}} is yours.`, barter(give, UP[give]!, true), flag('barter-traded')), { requires: [barterHas(give, true)] }),
      ch('Keep the Berry.', out('"Then pick something else," Nix says, without any edge at all.', room(`barter-${give}`))),
    ])),
  ...(['uncommon', 'rare'] as Tier[]).map((give) => ev(`barter-fair-${give}`, 'The Barter Board', 'NPC Stories', { room: true, ...NIX },
    `Nix taps the {stock:${give}} on the board instead. "That's the fair match for what you're giving. I lost a friend's keepsake for a bag of nothing once. I won't watch anyone else do it."`,
    [
      ch(`Take the fair match: {stock:${give}}.`, out('Nix slides it across. "There. Now we can both sleep."', barter(give, give), flag('barter-traded'))),
      ch('Pick something else.', out('"Take your time."', room(`barter-${give}`))),
    ])),
];

const SF55: Json[] = [
  {
    id: 'secret-market-barter',
    intro: 'A cellar under a bakery, warm with the smell of bread. Nobody down here takes money. A chalk sign over the counter reads THINGS FOR THINGS. A figure in a cloak points one gloved finger at your bag. Nix: "Show me what you carry. I\'ll show you what I\'ve got. Every trade shows both sides\' worth." Nix: "I don\'t cheat. And I won\'t let you cheat yourself."',
    choices: [
      ch('Offer a trade.', out('Nix pulls the lamp closer and turns the board toward you. Every item has its tier printed beside it: Common, Uncommon, Rare.', room('barter-table'))),
      ch("Why won't you cheat me?", out('Nix is quiet for a while. "I got cheated once. Lost a friend\'s keepsake for a bag of nothing." The gloves tighten. "Never again. Not for me, not for you. Either way."', stamped('barter-asked'), room('secret-market-barter'))),
      ch('Leave.', leave('You climb back up into the bakery light. Behind you, the lamp goes on burning.')),
    ],
    remembers: [
      { id: 'kept-goods', when: [keptGoods], notice: 'Nix\'s eyes go to one corner of your bag and stay there. "That one\'s not yours to trade." It won\'t go on the table.', hide: [], addChoices: [] },
      { id: 'asked', when: [flagIs('barter-asked')], notice: 'Nix nods to you like an old customer.', hide: [1], addChoices: [] },
    ],
  },
  ev('barter-keepsake', 'The Keepsake', 'NPC Stories', { callback: true, minStage: 1, requires: [flagAgo('barter-asked', 1), notYet('barter-keepsake-done')], ...NIX },
    'A note is pinned to a post where the road forks, sealed with a chalk mark you know: THINGS FOR THINGS. Nix is waiting under the eaves, holding something small wrapped in cloth. "I found it. My friend\'s keepsake. After all these years." Nix\'s voice is rough. "She lives a road over. I can\'t face her. Will you take it?"',
    [
      ch('Deliver it (a node).', out('You walk the extra road. An old woman opens the door, sees the cloth, and sits down right there on the step. She holds it to her chest and cries without a sound. "Tell Nix," she says at last. "Tell Nix I forgave it years ago."', takeNode(), done('barter-keepsake-done'), flag('barter-delivered'), ...kindness(), room('barter-free'))),
      ch('Not now.', out('"It\'s waited this long," Nix says, and tucks it away. "It can wait for you."', again('barter-keepsake'))),
      ch("I can't.", leave('Nix nods. "No. It should be me." The cloak walks off toward that road, slowly.'), {}),
    ]),
  ev('barter-free', 'The Barter Board', 'NPC Stories', { room: true, ...NIX },
    'When you come back, Nix has been crying too, and isn\'t hiding it. "She said that? She said that." A long breath. "One trade. Any tier. Nothing on your side of the table. Don\'t argue."',
    [
      ch('A Common: {stock:common}.', out('"Modest," Nix says, smiling for the first time. "She\'d like you."', barter(undefined, 'common'))),
      ch('An Uncommon: {stock:uncommon}.', out('Nix wraps it in the same cloth the keepsake came in.', barter(undefined, 'uncommon'))),
      ch('A Rare: {stock:rare}.', out('"Good," Nix says. "You earned the best thing on the board."', barter(undefined, 'rare'))),
    ]),
];

// ---------- SF56 A Trainer in Trouble ----------

const TOBIN = { cast: ['boss.npc_youngster'] };
const TOBIN_GEAR = 'tm-fighting';

const SF56: Json[] = [
  {
    id: 'stranded-trainer',
    intro: 'A young trainer kneels on the road beside three fainted Pokémon, shaking one of them gently by the shoulder. His name is Tobin. Tobin: "I pushed them too hard. I don\'t have any Potions left." His voice cracks. Tobin: "My Riolu\'s breathing funny. Please. Please, can you help?" His bag lies open beside him: ₽300 and a TM, all he has.',
    choices: [
      ch('Give them Potions (up to 3 healing items).', out('You kneel and work through them one by one. The Riolu opens its eyes last. Tobin thanks you with shaking hands, then can\'t stop thanking you, then just hugs his Riolu and cries into its fur.', spend(HEAL_ITEMS, 3), flag('trouble-helped'), flag('saved-trainer'), ...kindness()), { requires: [bagHas(HEAL_ITEMS, 1, 'a healing item')] }),
      ch('Walk them to a Center (a node).', out('You carry the Riolu. Tobin carries the other two. He talks the whole way, about how he\'ll never push them again, never, not once, until Nurse Joy takes the Riolu from your arms and the doors slide shut.', takeNode(), flag('trouble-helped'), flag('trouble-walked'), flag('saved-trainer'), ...kindness())),
      ch('Take their stuff.', out('You take the ₽300 and the TM out of his bag while he watches. He doesn\'t try to stop you. He just stares. Somewhere behind a fence, a kid who follows you around saw it too.', $(300), item(TOBIN_GEAR), flag('trouble-robbed'), flag('robbed-trainer'), repDown(2), evil(2), ...apprenticeCopies('robbed'))),
    ],
  },
  {
    id: 'stranded-trainer-friend',
    requires: [flagIs('trouble-helped')],
    intro: 'A raider steps out across the road at the worst moment, grinning, Poké Balls already in hand. Then a familiar voice shouts from the ridge. "Hey! That\'s the one who saved my team!" It\'s Tobin, taller somehow, with a Lucario at his side at full strength. Tobin: "My turn."',
    choices: [
      ch('Fight together.', fight('Tobin drops in beside you. His Lucario looks at your team, then at you, and nods once. "Ready when you are," Tobin says.', tf('Road Raider', { cls: 'roughneck', size: 3, lv: 2, ally: 'lucario', win: [fr(5, 'party'), flag('trouble-tag')] }, [flag('trouble-tag')]))),
      ch('Let him take it.', out('Tobin handles the raider alone, calm and careful, calling his Lucario back the moment it\'s tired. When it\'s over, the raider runs. Tobin turns around beaming like the sun just came up. "Did you see? Did you see that?"', flag('trouble-let-him'))),
      ch("Thanks, I've got it.", fight('Tobin steps back, grinning. "Okay. Show me how it\'s done." He and his Lucario watch from the ridge and cheer every hit.', tf('Road Raider', { cls: 'roughneck', size: 3, lv: 2, win: [item('black-belt'), flag('trouble-watched')] }))),
    ],
    remembers: [
      { id: 'walked', when: [flagIs('trouble-walked')], notice: 'Tobin\'s Lucario looks straight at {lead} and barks its name. It remembers the long walk to the Center, and who carried it.', hide: [], addChoices: [] },
    ],
  },
  {
    id: 'stranded-trainer-revenge',
    requires: [flagIs('trouble-robbed')],
    intro: 'A bridge in the wind. Tobin stands in the middle of it, older, harder, his team trained hard since. Tobin: "Remember me? I do." Tobin: "I made it to a Center on foot. Carried Riolu the whole way. It\'s a Lucario now." His Lucario steps forward. Tobin: "It remembers you too."',
    choices: [
      ch('Battle.', fight('"Good," Tobin says, and means it. He\'s built this team for one fight. For yours.', against(tf('Tobin', { cls: 'youngster', size: 3, lv: 4, win: [flag('trouble-revenge')] }, [flag('trouble-revenge')]), { against: 'lead' }))),
      ch("I'm sorry.", fight('Tobin looks at you for a long time. "...Okay." He sends out his Lucario anyway. "I still need to do this."', against(tf('Tobin', { cls: 'youngster', size: 3, lv: 4, win: [flag('trouble-apology'), room('stranded-trainer-handshake')] }, [flag('trouble-apology'), room('stranded-trainer-handshake')]), { against: 'lead' }))),
      ch('Give back what I took.', out('You hold out the ₽300 and the TM. Tobin stares at them, then at you. He takes them slowly. No battle. "That\'s all I wanted," he says quietly. "I just wanted you to know it mattered." He walks off the bridge, and doesn\'t look back, and doesn\'t need to.', $(-300), { kind: 'loseItem', id: TOBIN_GEAR }, flag('trouble-amends'), flag('trouble-robbed', -99), flag('rep-lost', -2), good(1)), { requires: [money(300), { kind: 'item', id: TOBIN_GEAR }] }),
      ch('Give back what I took, in money.', out('The TM is long gone, so you count out its worth on top of the ₽300. Tobin stares at the money, then at you. "That\'s all I wanted," he says quietly. He walks off the bridge, lighter.', $(-1300), flag('trouble-amends'), flag('trouble-robbed', -99), flag('rep-lost', -2), good(1)), { requires: [money(1300)] }),
    ],
    remembers: [
      // Only one way to give it back shows: the TM itself when it's still in the bag.
      { id: 'has-tm', when: [{ kind: 'item', id: TOBIN_GEAR }], hide: [3], addChoices: [] },
    ],
  },
  ev('stranded-trainer-handshake', 'The Trainer You Robbed', 'Lasting Choices', { room: true, ...TOBIN, tint: '#3a2a20' },
    'After the battle, Tobin walks across the bridge and holds out his hand. His Lucario watches you both. "We\'re done now," he says. "I mean it. We\'re done."',
    [ch('Shake his hand.', out('His grip is hard. He lets go first, and nods, and goes.', flag('trouble-handshake'), peace(1)))]),
];

// ---------- SF57 The Trainer Who Wants to Stop ----------

const RENNY = { cast: ['boss.npc_cooltrainer_m'], tint: '#283848', effect: 'none' };
const SF57: Json[] = [
  {
    id: 'trainers-therapy',
    intro: 'A bench by a lake. A trainer in a battered jacket sits alone, six Poké Balls lined up on the bench beside them like they\'re waiting for a bus. Renny has grey in their hair. Renny: "I don\'t know why I keep going." Renny: "Eight badges. Two Leagues. I don\'t feel anything when I win anymore." Renny isn\'t asking for advice. Just someone to sit there.',
    choices: [
      ch('Just listen.', out('You sit. Renny talks for a long time: the first badge, the friend who quit, the night in the rain at the second League, the silence after. You say nothing at all. At the end: "Thanks. I think I needed to say it out loud." Then, very small: "Is it alright to stop?"', flag('renny-listened'), room('renny-question'))),
      ch('Maybe you need a break.', out('Renny turns the word over like a stone. "Maybe." The lake laps at the shore. "Is it alright to stop?"', flag('renny-listened'), room('renny-question'))),
      ch('You should keep going.', out('"That\'s what everyone says." Renny nods, gathers the six Balls, and keeps going, down the road, the same as before.', stamped('renny-pushed'))),
    ],
  },
  ev('renny-question', "Trainer's Therapy", 'Helpers, gifts and kindness', { room: true, ...RENNY },
    'Renny looks at the six Balls, then at the water, then at you. "Is it alright to stop?"',
    [
      ch('Yes.', out('Renny opens each Ball and lets each Pokémon choose. Most of them walk down to the lake and lie in the grass like they\'ve been waiting years to. One, though, comes over to you and sits at your feet and will not leave. Renny laughs and wipes their eyes. "Will you? It wants to keep going. I don\'t."', join({ species: ['lapras', 'noivern', 'arcanine'], lv: 0 }), fr(150, 'newest'), flag('renny-stopped'))),
      ch('Only you know.', out('"...Yeah." Renny clips the Balls back on, one by one. "Yeah. Only me." They stay a trainer, for now. You leave them on the bench, looking at the lake.', stamped('renny-postcard'))),
    ]),
  ev('renny-postcard', 'A Postcard', 'Helpers, gifts and kindness', { callback: true, requires: [flagAgo('renny-postcard', 1), notYet('renny-postcard-read')], ...RENNY },
    'A postcard is waiting for you at the Pokémon Center counter. On the front, a lake. On the back, in careful handwriting: "Stopped. Good choice. — R." There\'s a small paw print beside the signature.',
    [ch('Keep it.', out('You tuck it into your bag. It feels like more than paper.', done('renny-postcard-read')))]),
  ev('renny-still', 'The Tired Trainer', 'Helpers, gifts and kindness', { callback: true, requires: [flagAgo('renny-pushed', 1), notYet('renny-still-seen')], ...RENNY },
    'You pass Renny at a crossroads in a new region, still going. Another badge on the jacket. The same look in the eyes as by the lake, only further away. Renny lifts a hand to you and doesn\'t smile.',
    [ch('Wave back.', out('Renny keeps walking. You watch them go until the road bends.', done('renny-still-seen')))]),
];

// ---------- SF58 The Valley ----------

const IVY = 'boss.npc_pokemonranger_f';
const GAULT = 'boss.npc_engineer';
const SF58: Json[] = [
  {
    id: 'valley-dispute',
    intro: 'A green valley with survey stakes hammered into it. Pokémon Rangers stand on one side of a rope, a mining crew on the other, and between them a herd of Tauros calves grazes, not knowing anything. Ranger Captain Ivy: "This valley\'s the last calving ground for the region\'s Tauros." Foreman Gault: "And under it\'s the ore that keeps three towns working. My crew\'s got kids." Both of them turn to you. "You\'re a trainer. People listen to trainers. Whose side?"',
    choices: [
      ch('The Rangers.', out('Ivy closes her eyes for a second, relieved. Gault doesn\'t say anything. He just pulls up the first survey stake and throws it down the hill. The valley is protected.', stamped('valley-rangers'), flag('valley-trusted'))),
      ch('The miners.', out('Gault claps you on the back. Ivy looks at the calves, and then at you, and walks away without a word. The mine opens.', stamped('valley-miners'))),
      ch('Broker a plan (a node).', out('You walk the valley with both of them for a whole afternoon, until their boots are muddy and their voices are hoarse. In the end they agree: the north slope only, and only after calving season. Both sides grumble. Both sides shake on it. And both of them, later, remember you fondly.', takeNode(), stamped('valley-shared'), flag('valley-trusted'), repUp(1)), { requires: [flagIs('rep', 3)] }),
    ],
  },
  {
    id: 'valley-miners-dividend',
    requires: [flagIs('valley-miners'), notYet('valley-dividend-done')],
    intro: 'A cart rattles down the road and stops beside you. Foreman Gault leans out, soot on his face, grinning. "Your share, partner. And our shop\'s open to friends." He holds out a fat envelope.',
    choices: [
      ch('Take it.', out('"Spend it on something good," Gault says. The mining shop will give you 20% off for the rest of the region.', $(1000), { kind: 'tempEffect', label: "Gault's discount", effects: [{ kind: 'priceMultiplier', value: 0.8 }], until: 'region' }, done('valley-dividend-done'))),
      ch('Give it to the Rangers.', out('Gault stares at you. Then he shrugs and hands it over. Weeks later, a stiff note from Ivy finds you: the money funds a new calving ground, three valleys east. "Thank you," it says, and nothing else.', done('valley-dividend-done'), flag('valley-funded'), ...kindness())),
      ch('Ask about the Tauros.', out('Gault\'s grin goes. "Moved east. Some didn\'t make it." He doesn\'t look away from you when he says it. You have to give him that.', done('valley-dividend-done'), flag('valley-asked'))),
    ],
  },
  {
    id: 'valley-miners-grudge',
    requires: [flagIs('valley-rangers'), notYet('valley-grudge-done')],
    intro: 'Gault and his crew block the road, arms folded, the whole sullen line of them. Gault: "You cost us the valley. My men have been out of work since." He spits. "Now you pay."',
    choices: [
      ch('Battle.', fight('"Three of us," Gault says. "One after another. Let\'s see how you like losing."', tf('Miner', { cls: 'hiker', size: 2, lv: 2, chain: 3, win: [done('valley-grudge-done')] }, [done('valley-grudge-done')]))),
      ch('Find you work (two nodes).', out('You spend two days on it, asking at every gate and every office, until a road crew on the next ridge takes the whole lot of them on. Gault shakes your hand at the end, hard. "That\'s that, then." The grudge is over.', takeNode(2), done('valley-grudge-done'), flag('valley-grudge-ended'), ...kindness())),
      ch('Pay (₽500).', out('You hand over ₽500 for the crew\'s fund. Gault takes it, embarrassed, and won\'t meet your eye. "For the kids," he mutters.', $(-500), done('valley-grudge-done')), { requires: [money(500)] }),
    ],
    remembers: [
      { id: 'quarry', when: [flagIs('quarry-in')], notice: 'Gault has heard about the old quarry you went into. "You know a quarry foreman, don\'t you?"', hide: [1], addChoices: [ch('Find you work at the old quarry (two nodes).', out('You take them to the old quarry, and the ex-foreman there looks Gault up and down and hires the whole crew on the spot. Gault shakes your hand, hard. The grudge is over.', takeNode(2), done('valley-grudge-done'), flag('valley-grudge-ended'), ...kindness()))] },
    ],
  },
  {
    id: 'valley-rangers-grudge',
    requires: [flagIs('valley-miners'), notYet('valley-ivy-done')],
    intro: 'Ivy stops you on the road. She doesn\'t raise her voice. She doesn\'t have to. Ivy: "You sold out the valley." Ivy: "The wild Pokémon know your face now."',
    choices: [
      ch('Battle.', fight('Ivy sends out her team without another word.', tf('Ranger Captain Ivy', { cls: 'ranger', size: 3, lv: 3, win: [done('valley-ivy-done')] }, [done('valley-ivy-done')]))),
      ch('Help relocate them (two nodes).', out('Two days walking Tauros calves east, through rivers, over ridges, in the rain. Ivy says nothing the whole way. At the end, when the last calf is through the gate of the new ground, she says: "Thank you." Just that.', takeNode(2), done('valley-ivy-done'), flag('valley-relocated'), ...kindness())),
      ch("I'd do it again.", out('Ivy nods slowly. "Then they\'ll remember you." For the rest of this region, wild Pokémon here start every battle at +1 Attack.', done('valley-ivy-done'), stamped('valley-wild-angry'))),
    ],
  },
  {
    id: 'valley-rangers-rescue',
    requires: [flagIs('valley-trusted'), notYet('valley-rescue-done')],
    intro: 'A Ranger waves you down from a ridge, out of breath. Ivy is at the slide itself, sleeves rolled up, hands bloody from the rocks. Ivy: "A landslide trapped wild Pokémon, calves mostly. You stood with us. We trust you." Below, the herd is stamping, panicked, close to stampeding over the trapped ones.',
    choices: [
      ch('Dig.', out('Your Pokémon digs for three hard turns, stone by stone, until a small wet nose pushes through. One by one the calves come out, shaking. Ivy sits down in the mud and laughs.', fr(5, 'picked'), done('valley-rescue-done'), ...kindness()), { pick: { types: ['ground', 'fighting'] } }),
      ch('Calm the herd.', out('You walk into the middle of the herd with your Pokémon, slow and low, until the stamping stops. Nobody is crushed. The Rangers dig the calves out by hand.', done('valley-rescue-done'), ...kindness()), { prompt: { id: 'brace-hold', needs: 'ok' }, fail: out('The herd stamps again and again before it settles. Nobody is crushed, but it was close, and your team is shaken.', { kind: 'damage', share: 0.1 }, done('valley-rescue-done')) }),
      ch('Both.', out('One of your Pokémon digs while you hold the herd still, and it works, all of it, at once. Every calf comes out. One of them, the smallest, won\'t leave your side. Ivy watches it follow you. "Take care of her," she says.', join({ species: ['tauros'], lv: -3 }), done('valley-rescue-done'), ...kindness(), repUp(1)), { pick: { types: ['ground', 'fighting'] }, prompt: { id: 'brace-hold', needs: 'good' }, fail: out('You try to do both and can\'t hold the herd. Your Pokémon digs the calves out anyway, just in time, with the herd thundering past.', { kind: 'damage', share: 0.1 }, done('valley-rescue-done'), ...kindness()) }),
    ],
  },
];

// ---------- SF59 The Taken Egg ----------

const EGG_SPECIES = 'starly';
const HAS_EGG: Json = { kind: 'hasEgg', species: EGG_SPECIES };
const GIVE_EGG: Json = { kind: 'returnEgg', species: EGG_SPECIES };
const SF59: Json[] = [
  {
    id: 'abandoned-nest',
    intro: 'A big nest in the branches, left alone, built from feathers the size of your hand. There is one egg in it. It\'s warm. The parent could be anywhere, hunting, or watching you right now.',
    choices: [
      ch('Take it.', out('You lift the egg out of the nest. It\'s heavy, and warm, and when you hold it against you, something inside it moves.', { ...egg({ species: [EGG_SPECIES] }), left: 30, unit: 'battle' }, stamped('egg-taken'), flag('took-egg'), { kind: 'flag', key: 'ovt-egg-hunt', amount: 0 })),
      ch('Leave it.', leave('You leave it in the feathers, where it belongs.')),
      ch('Wait for the parent (a node).', out('You sit under the tree for a long time. At dusk a huge Staraptor drops out of the sky, sees you, sees that you haven\'t touched the egg, and settles down on the nest. Later, while it watches you, the egg cracks, and a damp little Starly blinks up at the world.', takeNode(), flag('egg-watched'), fr(5, 'party'), peace(1))),
    ],
  },
  {
    id: 'ovc-abandoned-egg-s2',
    requires: [{ kind: 'flag', key: 'ovt-egg-hunt', atLeast: 3, atMost: 99 }, notYet('egg-breeder-met')],
    intro: 'A worried Breeder hurries up the road toward you, apron still on. Pom: "Has anyone seen an egg? A big one. I left it in the nest to keep warm." Pom: "Its mother\'s my Staraptor. She\'s been screaming since morning."',
    choices: [
      ch('I have it.', out('Pom\'s whole body sags with relief. She takes the egg in both hands, presses her cheek to it, and whistles. Far off, a Staraptor answers. The hunt is over.', done('egg-breeder-met'), flag('egg-returned'), GIVE_EGG, flag('egg-taken', -99), ...kindness()), { requires: [HAS_EGG] }),
      ch('No.', out('"Oh." Pom nods, and swallows, and goes on looking, calling the egg like it can hear her.', done('egg-breeder-met'), flag('egg-lied'), flag('honest-lied'))),
      ch('I saw a nest.', out('Pom runs to the nest. You hear her from the road when she finds it empty. She cries, alone under the tree, for a long time.', done('egg-breeder-met'), flag('egg-pom-cried'))),
    ],
    remembers: [
      { id: 'no-egg', when: [flagIs('egg-taken', 0, 0)], intro: 'A worried Breeder hurries up the road. Pom: "Has anyone seen an egg? A big one. I left it in the nest to keep warm. Its mother\'s my Staraptor." You haven\'t got it.', hide: [0, 1], addChoices: [ch('No, sorry.', out('"Thank you anyway." Pom goes on looking.', done('egg-breeder-met')))] },
    ],
  },
  {
    id: 'abandoned-nest-pursuit',
    requires: [flagIs('egg-taken'), flagIs('egg-returned', 0, 0), { kind: 'flag', key: 'ovt-egg-hunt', atLeast: 6, atMost: 99 }, notYet('egg-hunt-done')],
    intro: 'A shadow crosses the road, then again, lower. The parent has followed you for a whole stage. A huge Staraptor lands in front of you, wings out, feathers raised, furious, its eyes on your bag.',
    choices: [
      ch('Give the egg back.', out('You hold it out. The Staraptor takes it in its talons, so gently it barely touches the shell. It looks at you for a long moment. Then it flies with you: for your next battle, it guards you, and strikes first.', GIVE_EGG, done('egg-hunt-done'), flag('egg-returned'), flag('egg-taken', -99), { kind: 'tempEffect', label: "The Staraptor's guard", effects: [{ kind: 'firstStrike' }], battles: 1, until: 'battle' }, ...kindness()), { requires: [HAS_EGG] }),
      ch('Battle it.', fight('It screams and dives. This is a parent fighting for its child, and it fights like it.', wf({ species: ['staraptor'], lv: 5, win: [done('egg-hunt-done'), flag('egg-kept')] }, [done('egg-hunt-done'), stamped('egg-hunt-again')]))),
      ch('Run.', out('You run. Behind you, the wingbeats never quite stop.', stamped('egg-hunt-again'))),
    ],
  },
  ev('abandoned-nest-strikes', 'Wings Over the Road', 'Emergent Stories', { callback: true, requires: [flagIs('egg-hunt-again'), flagIs('egg-hunt-done', 0, 0)], tint: '#301c1c', effect: 'fog' },
    'It was waiting at the next bend. The Staraptor drops out of the sky without a sound and hits hard.',
    [
      ch('Give the egg back.', out('You hold it out, breathing hard. The Staraptor takes it gently, and is gone.', GIVE_EGG, done('egg-hunt-done'), flag('egg-returned'), flag('egg-taken', -99)), { requires: [HAS_EGG] }),
      ch('Fight.', fight('There is no running this time.', wf({ species: ['staraptor'], lv: 5, win: [done('egg-hunt-done'), flag('egg-kept')] }, [GIVE_EGG, done('egg-hunt-done'), flag('egg-returned'), flag('egg-taken', -99)]))),
    ]),
  {
    id: 'ovc-abandoned-egg-s3',
    requires: [{ kind: 'flag', key: 'ovt-egg-hunt', atLeast: 10, atMost: 99 }, notYet('egg-end-done')],
    intro: 'The road is quiet. Then the egg in your bag starts to rock.',
    choices: [
      ch('Watch it hatch.', out('It hatches into a Starly, damp and furious and small. It shakes itself off and then just looks up at the sky, and keeps looking, like it\'s listening for someone.', { ...GIVE_EGG, hatch: true }, done('egg-end-done'), flag('egg-kept')), { requires: [HAS_EGG] }),
      ch('Take the Starly.', out('A tiny Starly hops from her hands onto your arm and grips tight.', join({ species: ['starly'], lv: -2 }), done('egg-end-done')), { requires: [flagIs('egg-returned')] }),
      ch('Take the Oval Stone.', out('She presses a smooth, warm stone into your palm. "It sat under them both."', item('oval-stone'), done('egg-end-done')), { requires: [flagIs('egg-returned')] }),
      ch('Keep walking.', leave('You keep walking. You can still hear her calling for a long time.'), { requires: [flagIs('egg-lied')] }),
    ],
    remembers: [
      { id: 'returned', when: [flagIs('egg-returned')], intro: 'Pom is waiting for you at a fence by the road, the Staraptor on her shoulder like a cat. Pom: "Thank you. You don\'t know what you did." She holds out her hands. Pom: "Here. From the same clutch."', hide: [0, 3], addChoices: [] },
      { id: 'lied', when: [flagIs('egg-lied')], intro: 'Far off, you hear someone calling an egg like it can hear her. Pom is still looking.', hide: [0, 1, 2], addChoices: [] },
      { id: 'kept', when: [HAS_EGG], hide: [1, 2, 3], addChoices: [] },
    ],
  },
];

export const EVENTS: Json[] = [...SF55, ...BARTER_ROOMS, ...SF56, ...SF57, ...SF58, ...SF59];

// MERGE verdicts: these old ids now play as part of the event named in the status file.
export const REMOVE: string[] = ['ovc-abandoned-egg-s1'];

