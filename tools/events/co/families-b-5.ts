// Catalog Overhaul, families-b (STORY_FAMILIES_6.md, "Covers": the road chains): the 8 small trades made honest (TRADE)
// and the 9 single scenes (REVISE, "kept with one choice"). Each is one step: the chain timer is not started, nothing comes back.
// Honest trade: before you agree, the scene says plainly what you give and what you get (the Honest Trade Card view, from the
// markets thread, can show the same later). No trade takes a Pokémon without saying which one.
import { BERRIES, HELD, TREASURE, TYPE_ITEMS, VITAMINS, any, ch, egg, ferry, fight, flag, fr, good, has, hasAny, heal, item, join, leave, loseOne, money, out, peace, ptype, rp, scout, trade, trainer, wild, type Json } from '../dsl.ts';
import { moment, rem, seen } from './_fb.ts';

export const CATEGORY = 'families-b';

const cash = (amount: number): Json => ({ kind: 'money', amount });
/** One-step road scene: once per run, never a callback. */
const one = (id: string, name: string, o: { types?: string[]; pokemon?: string; tint?: string; fx?: string; remembers?: Json[] }, intro: string, choices: Json[]): Json => ({
  id: `ovc-${id}-s1`, name, ...(o.types ? { types: o.types } : {}),
  scene: { cast: [], ...(o.pokemon ? { pokemon: o.pokemon } : {}), ...(o.tint ? { tint: o.tint } : {}), effect: o.fx ?? 'none' },
  intro, choices, ...(o.remembers ? { remembers: o.remembers } : {}),
});
const SMALL_BERRIES = ['pecha-berry', 'cheri-berry', 'chesto-berry', 'rawst-berry', 'aspear-berry', 'leppa-berry'];

// ---------------------------------------------------------------- TRADE: small trades made honest
const TRADES: Json[] = [
  one('swap-meet', 'The Swap Meet', { tint: '#4a4030', fx: 'confetti' },
    `Tables in a field, everyone selling everything. One trader has a tray of held items and a sign: SWAP, LIKE FOR LIKE. "No tricks," he says. "I tell you what mine does, you tell me what yours does. Then we decide."`,
    [
      ch('Swap a held item for a Quick Claw.', out(`He holds up his: "Quick Claw. Sometimes your Pokémon moves first. Sometimes. I won't promise more." You hand over yours and he names it back to you, correctly, before he takes it. Fair is fair.`, loseOne(...HELD), item('quick-claw')), { requires: [hasAny(...HELD)] }),
      ch('Swap a held item for a Scope Lens.', out(`"Scope Lens. Sharper eyes, more critical hits. Worth the same as yours, near enough." He weighs your item in one hand, his in the other. "Near enough. Deal?" Deal.`, loseOne(...HELD), item('scope-lens')), { requires: [hasAny(...HELD)] }),
      ch('Just browse.', out(`You look at everything and buy nothing. He doesn't mind. "Looking is free. Knowing what things are is the best part."`, rp(5))),
    ]),
  one('crowded-market', 'The Crowded Market', { tint: '#4a3428' },
    `A market so full you can hardly move, and in the middle of it, one stall with no one at all. An old woman behind a table of cracked, faded things. She isn't calling out. She has stopped expecting anyone.`,
    [
      ch('Visit her stall.', out(`Old balls, old charms, an old photo of this market full of people round her stall. "Everything here is worth exactly what it says," she says. "That's why nobody comes. No bargains." You buy a Friend Ball, honestly priced.`, cash(-200), item('friend-ball'), good(1)), { requires: [money(200)] }),
      ch('Trade her a berry for a story.', out(`She takes the berry, and in return tells you about the market when she was young. The stall was her mother's. It's the only story she has left to sell. You leave richer.`, loseOne(...BERRIES, ...SMALL_BERRIES), peace(1), rp(10)), { requires: [hasAny(...BERRIES, ...SMALL_BERRIES)] }),
      ch('Go where the crowd goes.', out(`You buy a snack at the busiest stall. It's fine. Behind you the old woman straightens a row of things nobody will look at.`)),
    ]),
  one('trading-card-kid', 'The Trading Card Kid', { tint: '#3a3a4a' },
    `A kid on a wall with a binder of trading cards, every one in a plastic sleeve. "Trade?" he asks, hopeful. "I'll tell you which ones are rare. Most kids lie about that. I don't."`,
    [
      ch('Trade him something from your bag.', out(`He looks at your item, then at you, then says: "That's worth more than my best card. I'll give you my best card AND this." He hands over a card and a Poké Ball. He insists.`, loseOne(...TREASURE), item('great-ball', 2), fr(3)), { requires: [hasAny(...TREASURE)] }),
      ch('Look through his binder.', out(`He talks you through every card: which Pokémon, where they live, what they're weak to. He's better than a Pokédex. You give him a Poké Ball for the lesson.`, rp(15)), { requires: [has('poke-ball')] }),
      ch('Tell him to keep them.', out(`"Good," he says, relieved. "I didn't really want to trade the shiny one."`)),
    ]),
  one('cracked-egg-stand', 'The Cracked Egg Stand', { tint: '#4a4430' },
    `A woman selling eggs from a cart, every one with fine cracks in the shell. "People think cracks mean bad," she says. "Cracks mean soon. These are hatching. A battle or two. I tell everyone. Most still walk off."`,
    [
      ch('Buy one (800).', out(`She picks one for you and holds it to her ear first. "This one's ready. A day, maybe less. Keep it warm, keep it with your team." It knocks back against your hand.`, cash(-800), egg({ left: 1 })), { requires: [money(800)] }),
      ch('Ask why they cracked.', out(`"Their parents left them at the wild nesting grounds and didn't come back. Storm. I bring them here so someone takes them before they hatch alone." She doesn't charge you for the answer.`, peace(1))),
      ch('Walk on.', leave(`You walk on. She sets the eggs straight on their straw and keeps them warm.`)),
    ]),
  one('old-ferry', 'The Old Ferry', { types: ['water'], tint: '#24384a', fx: 'fog' },
    `A river too wide to wade, and a ferryman on a flat old boat. "I don't take money," he says. "I take stories. A true one. And I always know if it isn't."`,
    [
      ch('Tell him something true from your run.', out(`You tell him about something that happened on this road, the real way it happened. He listens without a word, poling slowly. On the far side he nods. "That's a true one. Thank you." He takes you further downriver than you asked.`, ferry(), flag('ferry-truth'), moment('An old ferryman took a true story of your journey as his fare.', 45))),
      ch('Make up a good story.', out(`You tell him a grand tale. He listens, then turns the boat around and puts you back where you started, gently. "A good story," he says. "Not a true one. Come back with a true one." He isn't angry.`, flag('ferry-lie'))),
      ch('Find another way across.', out(`You walk an hour upstream to a bridge. The ferryman watches you go and lights a pipe, in no hurry.`)),
    ]),
  one('midnight-market', 'The Midnight Market', { tint: '#1a1830', fx: 'glint' },
    `Lanterns under the trees, stalls that weren't there by day. Ghost-types run half of them. A Mismagius behind a table of things that glow faintly. Every price is written on a tag, in ink that moves.`,
    [
      ch('Buy a Dusk Ball (300).', out(`The tag says: "Better at night, in caves. Nothing else." The Mismagius waits until you've read it all before it takes your money.`, cash(-300), item('dusk-ball', 2)), { requires: [money(300)] }),
      ch('Trade a treasure for something rare.', out(`The Mismagius shows you three things and tells you, in a voice like a cold draft, what each is worth to you and to it. You choose. It does not cheat. Ghosts are honest about things.`, loseOne(...TREASURE), any('spell-tag', 'never-melt-ice', 'black-belt', 'sharp-beak')), { requires: [hasAny(...TREASURE)] }),
      ch('Just walk the stalls.', out(`Music from nowhere, little lights, a Litwick that follows you for a while. When dawn comes the trees are just trees.`, peace(1), rp(5))),
    ]),
  one('kitchen-contest', 'The Kitchen Contest', { tint: '#4a3020', fx: 'fire' },
    `A chef with a Chef's hat taller than her Slurpuff waves you to a camp stove. "Cook-off! You and me, ten minutes, whatever's in your bag. Winner swaps one ingredient with the loser. Fair, yes?"`,
    [
      ch('Cook with your berries.', out(`You do your best. She tastes it and laughs, kindly. "Terrible! But honest." She won, so she swaps: your berry for her secret spice, which your team loves.`, loseOne(...BERRIES, ...SMALL_BERRIES), heal(0.5), fr(3)), { requires: [hasAny(...BERRIES, ...SMALL_BERRIES)] }),
      ch('Let a Fire-type cook.', out(`Your Fire-type does the heat and you do the stirring. The chef tastes it, goes quiet, and takes off her hat. "You win. Take your swap." She gives you her best: a Charcoal from her own stove.`, item('charcoal'), fr(5, { types: ['fire'] })), { requires: [ptype('fire')] }),
      ch('Just eat.', out(`She feeds your whole team for free, "as a judge's fee." You judge everything delicious.`, heal(0.4))),
    ]),
  one('bug-contest', 'The Bug Contest', { types: ['bug'], pokemon: 'scyther', tint: '#3a4a24' },
    `A park, a crowd, and a sign: BUG CONTEST TODAY. Best Bug-type wins. The judge has a list and reads it out to everyone before they start: what the prize is, and what the rules are. No surprises.`,
    [
      ch('Enter with a Bug-type.', out(`Your Bug-type is measured, admired, and placed. Not first, but a proud second. The prize is read out as promised: a Silver Powder and a big rosette.`, item('silver-powder'), fr(8, { types: ['bug'] })), { requires: [ptype('bug')] }),
      ch('Catch a Bug-type in the contest grounds.', fight(`You get one ball and one try, like everyone else. Something big rustles in the long grass.`, wild({ types: ['bug'], lv: 1, win: [rp(10)] }))),
      ch('Watch and cheer.', out(`You cheer for the smallest entrant, a Caterpie whose owner is about five. It wins nothing. They both look delighted.`, peace(1))),
    ]),
];

// ---------------------------------------------------------------- REVISE: single scenes
const SINGLES: Json[] = [
  one('rain-shelter', 'The Shelter in the Rain', { tint: '#2a3440', fx: 'rain' },
    `A sudden downpour, cold and hard. One little roadside shelter, a roof and three walls, and there is room in it for exactly one. You, or your lead, who is already soaked and shivering.`,
    [
      ch('Put your lead inside.', out(`It looks at you, then at the shelter, then goes in and curls up. You stand in the rain with your hand on the roof. It keeps its eyes on you the whole time. It doesn't forget this.`, fr(10, 'lead'), { kind: 'damage', share: 0.05, who: 'party', except: ['water'] })),
      ch('Take the shelter yourself.', out(`You squeeze in. Your lead sits outside, pressed against the wall, rain pouring off it. When it stops, you are dry and it is miserable, and it doesn't quite look at you.`, fr(-5, 'lead'))),
      ch('Neither. Walk through it together.', out(`You give up on staying dry and walk on in the rain, side by side. By the time it stops you are both soaked and both laughing.`, fr(5, 'lead'), peace(1))),
    ]),
  one('backyard-battle', 'The Backyard Battle', { tint: '#3a4a2a' },
    `Two kids in a backyard, a Pidgey and a Rattata facing off, both kids shouting "No fair!" at once. They see you. "You're a real trainer! Be referee!"`,
    [
      ch('Referee fairly.', out(`You set rules, count turns, and call it honestly: a draw. Both kids are furious for exactly ten seconds, then demand a rematch. You leave them battling properly.`, good(1), rp(10))),
      ch('Show them a real battle instead.', fight(`"Two on one!" they shout. "Real trainer versus us!"`, trainer('Backyard Kids', { format: 'doubles', size: 2, lv: -4, win: [cash(150), fr(3)] }))),
      ch('Let their Pokémon decide.', out(`You ask the Pidgey and the Rattata. They look at each other and go off together to eat seeds. The kids stare, then follow. Battle over.`, peace(1))),
    ]),
  one('strange-footprints', 'The Strange Footprints', { tint: '#3a3428', fx: 'shake' },
    `Footprints across the path, each one as big as a cart wheel, pressed deep in the mud. Fresh. Broken branches lead off into the trees, high up. Your team has gone very quiet.`,
    [
      ch('Follow them.', fight(`At the end of the trail, in a clearing, it is waiting. Huge, ancient, eyes like lamps. An Alpha, a Pokémon grown past what it should be. It has been watching you follow.`, wild({ lv: 4, win: [rp(25), flag('alpha-faced'), moment('You followed giant footprints to an Alpha and stood your ground.', 60)] }))),
      ch('Measure them and note them down.', out(`You measure, sketch, and note the direction. A Ranger will want this. Somewhere off in the trees, something large stops moving, and listens to you write.`, rp(15))),
      ch('Go round.', out(`You take the long way. All afternoon, you have the feeling of being watched from very high up.`)),
    ]),
  one('ancient-puzzle', 'The Ancient Puzzle', { types: ['psychic', 'rock'], pokemon: 'unown', tint: '#3a3448' },
    `A stone door across a ravine path, carved with glyphs. Unown symbols, in rows. One row has a gap. Under it, smaller marks, almost worn away. The door won't move.`,
    [
      ch('Work out the missing glyph.', out(`You trace the rows for an hour. The pattern clicks: it's a word, and the missing letter is obvious once you see it. You press the stone. The door groans open onto a short cut, and a little treasure left long ago.`, any(...TREASURE), scout(1))),
      ch('Let a Psychic-type feel for it.', out(`Your Psychic-type puts its head to the stone, and every glyph glows for a moment. The door swings open by itself. Inside, something small and old waits.`, any(...TREASURE), fr(5, { types: ['psychic'] })), { requires: [ptype('psychic')] }),
      ch('Climb around it.', out(`It's a hard climb and your team grumbles the whole way. Behind you, the glyphs keep their word to themselves.`)),
    ]),
  one('berry-thief', 'The Berry Thief', { tint: '#3a4a2a' },
    `You put your bag down for one moment. When you turn back, a small wild Pokémon is sitting on it, a berry in its mouth, looking you right in the eye. It does not run.`,
    [
      ch('Let it keep the berry.', out(`It eats it slowly, never looking away. Then it takes one step closer, and another. It wants to see what else you have. Mostly, it wants to come along.`, join({ lv: -1 }))),
      ch('Chase it off.', fight(`It drops the berry and squares up. It is very small and very sure of itself.`, wild({ lv: -1 }))),
      ch('Trade it a different berry.', out(`You hold out a different berry. It weighs them both, considers, and takes the one you offered. It leaves the first one on your bag, very politely. Then it's gone.`, peace(1), fr(3))),
    ]),
  one('wandering-bard', 'The Wandering Bard', {
    tint: '#3a3048', fx: 'sparkle',
    remembers: [
      rem('bard-child', [seen('ovc-lost-child-s1')], { intro: `A bard with a lute and a Kricketune is singing at a crossroads. As you come near, the song changes: it's about a trainer who met a lost child on this very road. It's about you.` }),
      rem('bard-ferry', [{ kind: 'flag', key: 'ferry-truth', atLeast: 1, atMost: 99 }], { intro: `A bard with a lute and a Kricketune is singing at a crossroads. The song changes as you come near: a ferryman, a river, and a traveller who paid in a true story.` }),
      rem('bard-wreck', [seen('ovc-shipwreck-find-s1')], { intro: `A bard with a lute and a Kricketune is singing at a crossroads. As you come near, the song turns to a wreck on a beach, and a bell, and a traveller who found it.` }),
    ],
  },
    `A bard with a lute and a Kricketune is singing at a crossroads. As you come near, the song changes. It's about a trainer on this road, and the last fight they won. It's about you.`,
    [
      ch('Listen to the end.', out(`The verses get it nearly right, and the parts they get wrong they get wrong kindly. Your team listens, ears up, when the song names them. When it ends, people who were passing clap.`, fr(3), peace(1))),
      ch('Pay the bard.', out(`You drop coins in the hat. The bard bows, and the Kricketune plays a last little flourish just for your lead.`, cash(-100), fr(5, 'lead'), good(1)), { requires: [money(100)] }),
      ch('Ask how they know.', out(`"Songs travel faster than trainers," the bard says. "The road tells me. I just sing it back." The Kricketune chirps once, as if that settles it.`, rp(5))),
    ]),
  one('old-photographer', 'The Old Photographer', { tint: '#40382a' },
    `An old man with a wooden box camera on a tripod. "Portraits," he says. "One plate left. I'd like it to be a team that looks like they belong together. You look like that."`,
    [
      ch('Pose for him.', out(`It takes forever to set up. Your team won't stay still. Then, for one second, everyone looks at the camera, and the shutter clicks. He hands you the plate. You'll keep it.`, fr(5), moment('An old photographer used his last plate on your team.', 55))),
      ch('Ask him to take one of himself.', out(`He laughs. "Nobody ever asks." You set the timer, he stands in front of his own camera for the first time in forty years. He gives you a pass to his studio, and his old lens.`, item('wide-lens'), good(1))),
      ch('Say no thanks.', out(`He nods and folds the tripod up slowly. "Someone, someday," he says.`)),
    ]),
  one('guarded-item', 'The Guarded Item', { tint: '#30304a', fx: 'glint' },
    `On a rock in a clearing, something glows. Curled around the rock, a wild Pokémon, wide awake, watching you. It has been guarding that glow a long time.`,
    [
      ch('Battle it for the item.', fight(`It uncurls, and it is bigger than you thought.`, wild({ lv: 2, win: [any(...TYPE_ITEMS, ...VITAMINS)] }))),
      ch('Leave it something in exchange.', out(`You put a berry down slowly, then back away. The Pokémon sniffs it, considers, and nudges the glowing thing off the rock, toward you. A trade, of a kind.`, loseOne(...BERRIES, ...SMALL_BERRIES), any(...TYPE_ITEMS, ...VITAMINS)), { requires: [hasAny(...BERRIES, ...SMALL_BERRIES)] }),
      ch('Leave it to its treasure.', out(`It watches you go all the way to the trees. It looked tired. You hope it has someone.`, peace(1))),
    ]),
  one('broken-machine', 'The Broken Machine', { types: ['electric', 'steel'], tint: '#30383a' },
    `An old vending machine by the road, humming, lights flickering, giving nothing. A dent in the side where someone kicked it. From inside, very faintly, a crackle that sounds almost like a voice.`,
    [
      ch('Let an Electric-type look.', out(`Your Electric-type touches the panel and the machine jolts awake. Something flies out of it with a happy buzz: a Rotom, which had been stuck inside. It circles your head and then, after a moment's thought, stays.`, join({ species: ['rotom'] })), { requires: [ptype('electric')] }),
      ch('Fix it the old way.', out(`You thump it in the right spot. Three cans and a Poké Ball drop out, and a little spark escapes into the air and is gone, laughing.`, item('poke-ball'), heal(0.2))),
      ch('Leave it humming.', out(`It hums to itself as you walk away. You could swear it sounds disappointed.`)),
    ]),
];

export const EVENTS: Json[] = [...TRADES, ...SINGLES];
export const REMOVE: string[] = [];
