// Catalog Overhaul Pack, category "places": STORY_FAMILIES_15.md SF102 Standalone Choices, part 1 (the road and its people).
// Later-in-the-region scenes are callbacks gated on a region-stamped flag (people's `flagAt` / `flagThisRegion` / `flagAgo`);
// "(a node)" is takeNode; Pokémon left behind use the places `sendAway` / `bringBack` effects (src/core/co/placesRules.ts).
import { BERRIES, RARE_HELD, $, again, any, ch, ev, ferry, flag, flagAgo, flagAt, flagIs, flagThisRegion, fr, front, gym, has, heal, hurt, item, lose, money, out, ptype, relic, reveal, rp, scout, stopHere, takeNode, trainer, wild, type Json } from '../dsl.ts';
import { kind, moment, mtype, no, rep, variant } from './_delve.ts';

export const CATEGORY = 'places';

const intel = (n = 1): Json => flag('intel', n);
const friendlyWild = (o: Parameters<typeof wild>[0]): Json => ({ ...wild(o), friendly: true });
const fightIt = (text: string, battle: Json, ...fx: Json[]): Json => ({ text, effects: fx, battle });
const stopAt = (key: string): Json => flagThisRegion(key);
const anyOf = (...types: string[]): Json => ({ kind: 'partyTypes', types });
const moveFlag = (f: string): Json => ({ kind: 'partyMoveFlag', flag: f });
const sign = (key: string): Json => flag(key);
const age = (key: string, atLeast: number): Json => ({ kind: 'flagAge', key, atLeast, atMost: 99 });

// ---------- Swordbert and Shieldbert: three meetings ----------
const SWSH = 'swsh-met';
const SWORD_SHIELD: Json = {
  id: 'galar-swordbert-shieldbert',
  requires: [{ kind: 'region', ids: ['galar'] }, flagIs(SWSH, 0, 1)],
  intro: 'Two identical men in dramatic cloaks leap out from behind a rock. "We founded this town!" "And that bridge!" "And probably you!" They hold the pose until it gets awkward.',
  choices: [
    ch('"Sure you did."', out('"He believes us!" "Of course he does! History is on our side!" They sweep off in a swirl of cloak, arguing about which of them is history.', flag(SWSH), again('galar-swordbert-shieldbert'), rp(2))),
    ch('Battle.', fightIt('"A challenger! As we foresaw!" "We did not foresee this." "Hush!"', trainer('Swordbert & Shieldbert', { boss: 'sordward-shielbert', size: 3, lv: 1, friendly: true, win: [$(500), flag(SWSH), again('galar-swordbert-shieldbert')], lose: [flag(SWSH), again('galar-swordbert-shieldbert')] }))),
  ],
  remembers: [
    variant('second', [flagIs(SWSH, 1, 1)], {
      intro: 'The cloaks again, behind a different rock. "You! The witness to our greatness!" "We have founded several more things since." "A fountain, mostly."',
      hide: [0],
      add: [
        ch('"What else did you found?"', out('"The Gym Challenge." "The concept of lunch." "Wednesday." Somewhere under the nonsense, one of them says, quietly, "Our grandmother told us we were someone. We just never found out who."', flag(SWSH), rp(2))),
      ],
    }),
  ],
};

const SWORD_SHIELD_TRUTH = ev('galar-swordbert-shieldbert-truth', 'Swordbert and Shieldbert, Again', 'Galar', { stop: 'event', rarity: 'uncommon', types: ['fairy', 'fighting'], minStage: 2, callback: true, requires: [{ kind: 'region', ids: ['galar'] }, flagIs(SWSH, 2), no('swsh-truth')], tint: '#3b3550' },
  'Just the two of them this time, sitting on a rock, cloaks folded on their knees. No pose. "You keep finding us," says one. "Nobody keeps finding us."',
  [
    ch('"Who were you really?"', out('They show you a rusted thing wrapped in cloth: half a hilt. "Our family served a knight who served the hero of Galar. That\'s all. That\'s the whole of it." They press it into your hands. It is warm. It remembers a wolf with a sword in its jaws.', sign('sign-zacian'), flag('swsh-truth'), moment('Swordbert and Shieldbert told you who they really were.', 55)), { chance: 0.5, fail: out('They show you a rusted thing wrapped in cloth: a shield\'s rim. "Our family served a knight who served the hero of Galar. That\'s the whole of it." They press it into your hands. It is warm. It remembers a wolf with a shield on its back.', sign('sign-zamazenta'), flag('swsh-truth'), moment('Swordbert and Shieldbert told you who they really were.', 55)) }),
  ]);

// ---------- The rest of the road ----------
const STANDALONE_A: Json[] = [
  SWORD_SHIELD,
  SWORD_SHIELD_TRUTH,
  {
    id: 'galar-dynamax-disturbance',
    intro: 'A red column of energy tears out of the ground at a Power Spot. Wild Pokémon nearby swell, huge and furious. A researcher with a humming meter skids up beside you. "Researcher Sonnet! It\'s erupting! It\'s actually erupting!"',
    choices: [
      ch('Fight the raid.', fightIt('"Shield first, then it surges, then the final push! I\'ve only ever read about this!" The giant turns its red eyes on you.', { kind: 'raid', raidId: 'power-spot-eruption', name: 'Power Spot Eruption', levelBonus: 0, pseudo: true, win: [{ kind: 'calmDisturbance' }, flag('power-spot-calmed'), moment('You fought a Power Spot eruption down to its last phase.', 60)] })),
      ch('Cap the Spot.', out('Your Pokémon sets itself on the vent and does not move while the red light hammers against it. Slowly the column narrows to a thread, and then to nothing. Sonnet is crying a little. "It held. It held."', { kind: 'calmDisturbance' }, flag('readings-capped'), fr(5, { types: ['rock', 'steel'] }), rp(3)), { requires: [anyOf('rock', 'steel')] }),
      ch('Run.', out('You run, and Sonnet runs with you, meter clutched to her chest. Behind you the column climbs into the clouds. "It won\'t stop," she pants. "Not now. Something will come out of that, later."', flag('readings-erupts'))),
    ],
  },
  {
    id: 'world-ranger-mission',
    intro: 'A park ranger waves you down, out of breath. "A wild Pokémon\'s tangled in a snare up the trail. Wire. It\'s been fighting it all night. I need a steady hand."',
    choices: [
      ch('Free it (capture-styler minigame).', out('She hands you her Styler. You circle, and circle, slow and patient, until the frightened thing stops fighting and lets you near. The wire falls away. It looks at you a long moment before it goes.', $(300), fr(3), rp(2), ...kind()), { prompt: { id: 'pull-hold', needs: 'ok' }, fail: out('The Styler\'s line snaps. The Pokémon tears free on its own, bleeding a little, and is gone into the trees. The ranger sighs. "Free is free. It\'ll heal."', $(150), ...kind()) }),
      ch('Cut it free.', out('You cut the wire. The Pokémon bolts the second it can, without looking back. "Freed, but scared of people now," says the ranger. "Can\'t blame it."', $(150), ...kind())),
      ch('Find who set it. (a node)', out('You follow the wire to a stake, the stake to boot prints, the prints to a road. Somebody sets these on purpose. The ranger marks the map. "Poachers. They\'ll be camped further on."', takeNode(), flagAt('ranger-poacher-trail'), ...kind())),
    ],
  },
  ev('ranger-poacher-camp', 'The Poacher Camp', 'World Events', { stop: 'event', rarity: 'uncommon', types: [], minStage: 1, callback: true, requires: [stopAt('ranger-poacher-trail'), no('ranger-poacher-done')], tint: '#3b3326' },
    'The boot prints end at a camp in a hollow. Cages under a tarp. Something inside them is crying, very quietly, the way animals cry when they have stopped expecting anyone to come.',
    [
      ch('Open the cages.', fightIt('Two poachers come out of the tent before the first latch is up. "That\'s our living, kid."', trainer('Poachers', { cls: 'roughneck', size: 3, lv: 2, friendly: true, win: [flag('ranger-poacher-done'), fr(5), ...kind(2), rep(1), moment('You opened the poachers\' cages.', 60)], lose: [flag('ranger-poacher-done')] }))),
      ch('Fetch the ranger.', out('You run back for the ranger. By the time you return with her, the camp is half packed, but the cages are still there. She opens them one by one, saying sorry to each.', flag('ranger-poacher-done'), $(500), ...kind(), rep(1))),
      ch('Leave it.', out('You back away from the hollow. The crying follows you a long way.', flag('ranger-poacher-done'), flag('kind-walked-past'))),
    ]),
  {
    id: 'rain-dance-ritual',
    intro: 'A parched village. The well rope hangs over a dry hole. Elders dance in the square and sing, and the sky stays hard and blue. "Help us," says the youngest of them. "The crops have a week."',
    choices: [
      ch('Use Rain Dance.', out('Your Pokémon dances with the elders, and the clouds come. Rain hammers the dust. Children run out into it. Far downstream, you think, the river will rise, and someone there does not know.', front('rain', 3), $(300), ...kind(), flagAt('raindance-flood'), fr(3, { types: ['water'] })), { requires: [{ kind: 'partyMove', move: 'rain-dance' }] }),
      ch('Warn the town downstream first. (a node)', out('You run the river road and knock on doors until everyone has moved up the hill. Then you come back and your Pokémon calls the rain. Both towns watch it fall: one dancing, one dry and safe.', takeNode(), front('rain', 3), $(300), ...kind(2), rep(1), moment('You saved two towns from one rain.', 60)), { requires: [{ kind: 'partyMove', move: 'rain-dance' }] }),
      ch('Coax the clouds with a Water-type.', out('It is not a dance, but your Water-type tries its hardest, again and again. A thin rain comes. Enough. The river barely rises.', front('rain', 2), $(200), ...kind(), fr(3, { types: ['water'] })), { requires: [mtype('water')] }),
      ch('Leave.', out('"Good luck," you say, and you mean it. The singing follows you down the road.')),
    ],
  },
  ev('rain-dance-flooded-town', 'The Flooded Town', 'Helpers, gifts and kindness', { stop: 'event', rarity: 'uncommon', types: ['water'], minStage: 1, callback: true, requires: [stopAt('raindance-flood'), no('raindance-flood-seen')], tint: '#2b3d4d' },
    'Downstream, a town stands in brown water to the knees. A man is carrying chairs out of his own front room. "Rain came out of nowhere," he says. "Up at the village they were dancing for it."',
    [
      ch('Help them bail out. (a node)', out('You bail until your arms stop working. Your Pokémon carry sandbags. By night the water is out of the houses. Nobody here knows it was your rain. You know.', takeNode(), flag('raindance-flood-seen'), ...kind(2), rep(1), fr(3))),
      ch('Tell them it was you.', out('The man listens. Then he hands you a bucket. "Then you know where the water goes." You bail till dark. At the end he shakes your hand, wet to the elbow.', flag('raindance-flood-seen'), ...kind(), rep(1), hurt(0.05))),
      ch('Walk on.', out('You keep to the high road and do not look at the water.', flag('raindance-flood-seen'), flag('kind-walked-past'))),
    ]),
  {
    id: 'absolute-avarice',
    intro: 'A huge Greedent sits on a hoard of Berries taller than you. It glares. A villager leaning on a fence says, "It\'s stocking up. Winter\'s early this year. Everything round here is hungry."',
    choices: [
      ch('Rob it.', fightIt('You reach for the hoard. The Greedent comes off the pile like a landslide.', friendlyWild({ species: ['greedent'], lv: 4, win: [item('oran-berry', 6), flagAt('greedent-famine')] }))),
      ch('Help it fill the store. (a node)', out('You spend the day shaking trees and carrying Berries to the hoard. At dusk the Greedent pushes one back toward you with its nose, then waddles after you when you leave. It holds its Berry the way it holds a grudge: forever.', takeNode(), { kind: 'join', species: ['greedent'], types: [], levelBonus: 0, shinyMultiplier: 1, ability: 'harvest' }, item('sitrus-berry'), flag('relic-growth-leaf'), ...kind())),
      ch('Leave it.', out('You leave the hoard where it is. The Greedent watches you all the way to the bend in the road.')),
    ],
  },
  ev('greedent-famine', 'The Hungry Verge', 'Wild Scenes', { stop: 'event', rarity: 'uncommon', types: ['normal'], minStage: 1, callback: true, requires: [stopAt('greedent-famine'), no('greedent-famine-seen')], tint: '#4a3b2a' },
    'Wild Pokémon line the verge, thin, watching your bag. The trees here are bare; the hoard that fed them all winter is in your pack.',
    [
      ch('Give back what you took.', out('You tip the Berries out onto the grass. They come forward one at a time, then all at once. A small one eats from your hand.', lose('oran-berry'), lose('oran-berry'), lose('oran-berry'), flag('greedent-famine-seen'), ...kind(2)), { requires: [has('oran-berry')] }),
      ch('Share a little.', out('You scatter what you can spare. It is not enough. It is something.', any(...BERRIES), flag('greedent-famine-seen'), ...kind())),
      ch('Walk on.', out('You walk on with a full bag past empty faces.', flag('greedent-famine-seen'), flag('kind-walked-past'))),
    ]),
  {
    id: 'r146-wailmer-whale-song',
    intro: 'Far out on the water a Wailmer pod is singing, low and rolling. You feel it in the boat\'s planks. One chord is missing, and they keep leaving a gap for it, waiting.',
    choices: [
      ch('Supply the chord (a sound move).', out('Your Pokémon finds the note and holds it. The pod answers all at once, and the sea under you goes warm with the sound. They turn and swim alongside, and they know a way across the water that no chart has.', fr(5, { moveFlag: 'sound' }), flag('wailmer-song'), flag('relic-growth-tide'), ferry(), moment('You finished the Wailmer pod\'s song.', 55)), { requires: [moveFlag('sound')] }),
      ch('Listen.', out('You ship the oars and drift. Nobody finishes the chord, and it is beautiful anyway, like a question you are allowed not to answer.', heal(0.2), rp(2))),
      ch('Row on.', out('You row on. The song follows the boat a long way, still waiting.')),
    ],
  },
  {
    id: 'clue-strange-move',
    intro: 'A wild Pokémon is practising a move its kind should never know, over and over, getting it a little wrong each time. It stops and stares at you, as if it wants to be asked.',
    choices: [
      ch('Ask who taught it.', out('It turns and trots off, looking back to see if you follow. It leads you to a hollow full of old tracks: a Pokémon you met on this road lives here, and has been teaching. You can see, now, where everything is.', reveal(), scout(3), rp(2))),
      ch('Battle it.', fightIt('It shows you the move, proudly, right in your face.', friendlyWild({ lv: 2, win: [rp(4), flag('legend-clue')] }))),
      ch('Watch.', out('You sit and watch until your lead starts copying it, badly, then less badly. By sundown it has the shape of something new.', { kind: 'train', what: 'learnMove' }, rp(1))),
    ],
  },
  {
    id: 'w4-beacon-fire',
    intro: 'An old beacon of stacked wood on a rise, dry and ready. Lit, it would show the whole road ahead. Anyone watching the hills would see it too.',
    choices: [
      ch('Light it.', out('The beacon roars up into the night. You can see the next stage laid out under you like a map. Somewhere out there, someone who wants to find you sees it too.', scout(8), reveal(), { kind: 'evil', heat: 1 }, flag('evil-ambush'), flag('relic-growth-ember'))),
      ch('Leave it.', out('You leave it dark. The road ahead stays a road you will have to walk to know.')),
    ],
  },
  {
    id: 'world-weather-tower',
    intro: 'A humming tower of coils and dishes. On a panel at its foot: three buttons and a hand-lettered sign. "Pick tomorrow\'s weather. It\'s for everyone. Think about that."',
    choices: [
      ch('Rain.', out('The dishes turn. Clouds come over the hills and stay. Everyone will be fighting in the wet tomorrow, your rivals too. Somewhere the region\'s trouble gets a little worse.', front('rain', 8), { kind: 'crisis', amount: 1 })),
      ch('Sun.', out('The dishes turn. The sky burns clear and hot, and it is going to stay that way, for everyone. Somewhere the region\'s trouble gets a little worse.', front('sun', 8), { kind: 'crisis', amount: 1 })),
      ch('Snow.', out('The dishes turn. Snow comes sideways out of a clear sky, and it will lie on every road tomorrow. Somewhere the region\'s trouble gets a little worse.', front('snow', 8), { kind: 'crisis', amount: 1 })),
      ch('Leave it.', out('You leave tomorrow to itself.')),
    ],
  },
  {
    id: 'beg-for-mercy',
    intro: 'A veteran blocks the path. Their team is clearly, plainly stronger than yours, and they know it. "You\'re in over your head, kid. Turn round."',
    choices: [
      ch('Fight.', fightIt('"Your funeral." They are not cruel about it. That is worse.', trainer('Veteran', { cls: 'veteran', size: 3, lv: 4, friendly: true, win: [$(1200), moment('You beat a veteran far stronger than you.', 60)] }))),
      ch('Yield and pay.', out('You hold out the money. They take it, step aside, and say nothing. You keep going, lighter.', $(-300)), { requires: [money(300)] }),
      ch('Talk.', out('You ask how they got this strong. They are surprised into answering, and talk for an hour: what they would do in your place, which leader to fear. Then they let you pass. "Don\'t waste it."', gym(), flag('mem-veteran-spared'), rp(2))),
    ],
  },
  {
    id: 'debt-collector',
    intro: 'Three big trainers block the road, arms folded. "Boss says time\'s up. A thousand. Or we settle it the other way."',
    choices: [
      ch('Pay.', out('They count it twice and go. The debt is cleared. It feels like taking off a wet coat.', $(-1000), flag('debt', -99)), { requires: [money(1000)] }),
      ch('Fight.', fightIt('"Wrong answer."', trainer('Debt Collectors', { cls: 'roughneck', size: 3, lv: 2, friendly: true, win: [flag('debt-collectors-angry'), $(300)] }))),
      ch('Work it off. (three nodes)', out('Three long errands for the lender: crates, letters, a dog to walk that bites. At the end he crosses your name out of his book himself.', takeNode(3), flag('debt', -99))),
    ],
    remembers: [variant('angry', [flagIs('debt-collectors-angry')], {
      intro: 'Bigger trainers this time, and more of them. "You beat the last lot. Boss took it personal. A thousand. Last chance."',
      hide: [1],
      add: [ch('Fight.', fightIt('"Told you."', trainer('Hard Collectors', { cls: 'roughneck', size: 4, lv: 4, friendly: true, win: [flag('debt', -99), $(500)] })))],
    })],
  },
  {
    id: 'quarrel-sides',
    intro: 'Two villagers are arguing over a Berry bush heavy with fruit. The Hollins say their grandfather planted it. The Barreys say it grows on their side. Both turn to you. "Well?"',
    choices: [
      ch('Side with the Hollins.', out('Old Mr Hollin shakes your hand with both of his. The Barreys go in and shut the door hard. "We won\'t forget this," says Mrs Hollin, and means it kindly.', flagAt('quarrel-hollins'), flag('quarrel-sided'))),
      ch('Side with the Barreys.', out('The Barrey girl whoops. The Hollins say nothing at all. "We look after our own," says Mr Barrey, "and you\'re our own now."', flagAt('quarrel-barreys'), flag('quarrel-sided'))),
      ch('Split the bush.', out('You draw a line down the middle of the bush with a stick. Both families grumble at you, together, for the first time in years. The bush, pruned at last, looks happier than any of them.', flagAt('quarrel-split'), rp(1))),
    ],
  },
  ev('quarrel-family-help', 'A Friend in the Village', 'NPC Stories', { stop: 'event', rarity: 'uncommon', types: [], minStage: 1, callback: true, requires: [flagIs('quarrel-sided'), no('quarrel-help-seen')], tint: '#3f4a2c' },
    'Someone is waving from a cart on the road: a face from the Berry-bush village. "You took our side. We don\'t forget."',
    [
      ch('Accept their help.', out('They make you sit, and feed your team, and patch what needs patching, and fill your bag with Berries from the famous bush.', heal(0.5), item('sitrus-berry', 2), flag('quarrel-help-seen'))),
      ch('Say you only told the truth.', out('"That\'s why," they say, and give you the Berries anyway.', item('sitrus-berry', 2), flag('quarrel-help-seen'))),
    ]),
  ev('quarrel-bush-thrives', 'The Shared Bush', 'NPC Stories', { stop: 'event', rarity: 'uncommon', types: ['grass'], minStage: 1, callback: true, requires: [flagAgo('quarrel-split', 1), no('quarrel-bush-seen')], tint: '#2f4a2c' },
    'You pass the village again. The Berry bush you split down the middle has grown so thick that nobody can tell where the line was. Both families are picking from it, not speaking, side by side.',
    [
      ch('Pick a few.', out('A Hollin hands you one Berry. A Barrey hands you another. They glare at each other over your head.', item('lum-berry'), item('sitrus-berry'), flag('quarrel-bush-seen'))),
      ch('Just look.', out('You watch them a while. It is the closest thing to peace the village has had in years.', heal(0.2), flag('quarrel-bush-seen'))),
    ]),
  {
    id: 'research-offer',
    intro: 'A researcher with ink on her sleeves blocks your way with a clipboard. "Dr. Ota. Prototype today, or fund my work and get the real thing in two stages. I\'m close. I\'m so close."',
    choices: [
      ch('Prototype.', out('She hands over something still warm from her bench. "It works! Mostly. Tell me if it explodes."', any('scope-lens', 'wide-lens', 'quick-claw', 'muscle-band', 'wise-glasses'), { kind: 'choice', id: 'research-offer', pick: 'now', text: 'Took Dr. Ota\'s prototype right away' })),
      ch('Fund (500).', out('Her eyes fill. "Nobody funds me. Nobody." She writes your name at the top of a page in big letters. "Two stages. I promise."', $(-500), flag('research-funded'), { kind: 'choice', id: 'research-offer', pick: 'funded', text: 'Funded Dr. Ota\'s work', weight: 2 }), { requires: [money(500)] }),
    ],
  },
  {
    id: 'research-offer-payoff',
    requires: [{ kind: 'choice', id: 'research-offer', pick: 'funded', made: true }, age('research-funded', 2)],
    intro: 'Dr. Ota finds you on the road, out of breath, clutching a box. "Two stages. I said two stages." She sets the box down between you and does not open it yet.',
    choices: [
      ch('Open it.', out('It is finished, and it is beautiful, and it works. She laughs and cries at once. "Your name is on the paper. First line."', any(...RARE_HELD), rp(5), moment('Dr. Ota\'s research worked, and your name is on it.', 55)), { chance: 0.7, fail: out('It is in pieces. "It failed," she says, plainly. "I\'m sorry. Here: half of it back. You believed in me. That counts." She means it.', $(250), rp(2)) }),
    ],
  },
  {
    id: 'road-fork',
    intro: 'Three roads, three towns, one signpost. The market town: every shop open. The Gym town: its leader\'s team written up on the gate. The healer\'s town: a Center that never closes. Choose one. The others fall behind for good.',
    choices: [
      ch('The market town.', out('You take the market road. Stalls on both sides, all the way in. The other two roads are gone behind you.', stopHere('shop'), relic('road-market', 'Market Road', [{ kind: 'priceMultiplier', group: 'all', value: 0.9 }]), { kind: 'choice', id: 'road-fork', pick: 'market', text: 'Took the market town road', weight: 3 })),
      ch('The Gym town.', out('You take the Gym road. The leader\'s team is chalked on the gate: you copy it all down. The other two roads are gone behind you.', gym(), relic('road-gym', 'Gym Road', [{ kind: 'xpMultiplier', value: 1.08 }]), { kind: 'choice', id: 'road-fork', pick: 'gym', text: 'Took the Gym town road', weight: 3 })),
      ch('The healer\'s town.', out('You take the healer\'s road. Somebody meets you at the gate with blankets. The other two roads are gone behind you.', heal(1), stopHere('heal'), relic('road-healer', 'Healer\'s Road', [{ kind: 'postBattleHeal', percent: 3 }]), { kind: 'choice', id: 'road-fork', pick: 'healer', text: 'Took the healer\'s town road', weight: 3 })),
    ],
  },
  {
    id: 'sick-trainer-rain',
    intro: 'Rain. A trainer sits shivering under a tree, flushed with fever, their Pokémon pressed close round them. "I just need to rest," they say. "Just a bit."',
    choices: [
      ch('Stay with them. (a node)', out('You stay through the night, and keep the fire going, and make them drink. By morning the fever breaks. "When it gets bad round here," they say, "I\'ll come. I\'ll bring everyone I know."', takeNode(), { kind: 'aid', amount: 1 }, ...kind(2), moment('You sat with a sick trainer through the rain.', 55))),
      ch('Leave them a Potion.', out('You press a Potion into their hand. "For your team, and you." They hold on to your sleeve a moment. "Thank you. Really."', lose('potion'), ...kind()), { requires: [has('potion')] }),
      ch('Walk on.', out('You walk on. Behind you the rain keeps falling on them. You will remember that.', flag('sick-trainer-left'), flag('kind-walked-past'))),
    ],
  },
  {
    id: 'spy-trade',
    intro: 'A masked figure falls into step beside you and never stops walking. "A secret for a secret. You first."',
    choices: [
      ch('Tell them my lead\'s weakness.', out('You tell the truth. The mask tilts. "Brave." Then, quietly: where the evil team will strike next, and when. They are gone before you can thank them.', intel(), flag('spy-told-truth'), moment('A masked stranger traded you the evil team\'s next plan.', 55))),
      ch('Tell a lie.', out('You make something up. The mask is silent for three steps. "No," they say, and turn off down an alley. No trade.')),
      ch('Refuse.', out('"Wise." The figure turns a corner, and when you follow it, there is no one there.')),
    ],
  },
  {
    id: 'r124-rival-pack-territory',
    intro: 'Two wild packs stand nose to nose across a clearing, hackles up: Mightyena on one side, Houndour on the other. Both turn to look at you. Whoever you stand with wins.',
    choices: [
      ch('Side with the Mightyena.', out('You step to the Mightyena side. The Houndour fall back, snarling, and the Mightyena lope round you, pleased. You have made friends and enemies in one step.', flagAt('pack-houndour-hostile'), flagAt('pack-hostile'), fr(3))),
      ch('Side with the Houndour.', out('You step to the Houndour side. The Mightyena melt into the grass, growling. The Houndour sit down round your feet, warm as coals. You have made friends and enemies in one step.', flagAt('pack-mightyena-hostile'), flagAt('pack-hostile'), fr(3))),
      ch('Refuse both.', fightIt('You step between them. Both packs decide you are the problem, and come to test you, one after the other.', friendlyWild({ species: ['mightyena', 'houndour'], chain: 2, win: [rp(3), ...kind()] }))),
    ],
  },
  ev('pack-territory-hostile', 'The Pack Remembers', 'Wild Scenes', { stop: 'ambush', rarity: 'uncommon', types: ['dark'], minStage: 1, callback: true, requires: [stopAt('pack-hostile'), no('pack-hostile-seen')], tint: '#2a2626' },
    'Eyes in the grass, low and red. The pack you stood against has followed you, and waited for you to be tired.',
    [
      ch('Stand your ground.', fightIt('They come from both sides at once.', friendlyWild({ species: ['mightyena', 'houndour', 'houndoom'], lv: 2, win: [flag('pack-hostile-seen'), rp(2)] }))),
      ch('Back away slowly.', out('You back away step by step, never turning. They let you go, this time. This time.', flag('pack-hostile-seen'), hurt(0.05))),
    ]),
  {
    id: 'r161-cursola-reef-grudge',
    intro: 'A Cursola clings to a dying reef, white as old bone. It hates the sea for what it took. In a cold voice inside your head it asks for a guard: one Water-type, to stay with the reef a while.',
    choices: [
      ch('Leave a Water-type here for a region.', out('You choose. Your Water-type looks at you for a long moment, then swims down to the reef and settles there. The Cursola goes quiet. You row away without looking back, because you would not go if you looked back.', { kind: 'sendAway', key: 'cursola-reef-guard', type: 'water', who: { types: ['water'] } }, flag('relic-growth-tide'), ...kind(2), moment('You left a Water-type to guard a dying reef.', 65)), { requires: [ptype('water'), { kind: 'partySize', atLeast: 2 }] }),
      ch('Battle it.', fightIt('The reef glows, and the grudge rises out of the coral at you.', friendlyWild({ species: ['cursola', 'corsola-galar'], lv: 1, win: [any('spell-tag', 'reaper-cloth')] }))),
      ch('Leave.', out('You leave the reef to its grudge. The cold voice follows you all the way to the shore.')),
    ],
  },
  ev('cursola-reef-healed', 'The Healed Reef', 'Wild Scenes', { stop: 'event', rarity: 'uncommon', types: ['water'], minStage: 1, callback: true, requires: [flagAgo('cursola-reef-guard', 1), no('cursola-reef-back')], tint: '#2a4f5c' },
    'You come back to the reef a region later. It is pink. It is alive. Fish everywhere. And out of the coral, faster than you have ever seen it swim, comes the Pokémon you left behind.',
    [
      ch('Welcome it home.', out('It crashes into you and does not let go. It is stronger: the reef taught it things. The Cursola, beside it, is the soft pink of a healthy Corsola now. It leaves a piece of the reef in your hand.', { kind: 'bringBack', key: 'cursola-reef-guard', levels: 3, friendship: 20 }, item('mystic-water'), flag('cursola-reef-back'), moment('Your Pokémon came home from the reef, stronger.', 70))),
    ]),
];

export const EVENTS: Json[] = STANDALONE_A;
export const REMOVE: string[] = [];
void [heal];
