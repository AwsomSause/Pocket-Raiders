// The 100 new events, Part 2 (NE26 to NE50): past Champions and Gym Leaders, past allies, rivals, future events, anime-inspired.
// Script: catalog_overhaul/NEW_EVENTS_2.md. Placement: NEW_EVENTS_PLACED.md, categories 6 to 10.
// Build: npm run co:build -- new-events-2
// NE36 to NE40 keep the ids of the older, simpler rival questline builds (rivalQuestlines.json); this file overrides them.
import { RARE_HELD, any, bondIs, bondUp, br, eggMove, fight, flag, flagAgo, flagAt, flagIs, flagThisRegion, heal, item, join, leadIs, lose as loseAny, lv, money, out, party, pickedIs, rest, room, takeNode, trainer, wild, type Json } from '../dsl.ts';
import { $ } from '../dsl.ts';
import { GROUP, L, P, after, anyFlag, ch, kind, ne, place, rep, step, teach, variant } from './_ne.ts';

export { CATEGORY } from './_ne.ts';
export const REMOVE: string[] = [];

// ---------- local helpers ----------
/** Rival Trust (the rivals thread's `rivalChange`). */
const trust = (n: number): Json => ({ kind: 'rivalChange', feelings: { trust: n }, lead: 0 });
const fondness = (n: number): Json => ({ kind: 'rivalChange', feelings: { friendship: n }, lead: 0 });
/** The rival's Lead (rival ahead is positive): "Lead +1 for them" = +1, the player pulling ahead = -1. */
const rivalLead = (n: number, feelings: Record<string, number> = {}): Json => ({ kind: 'rivalChange', feelings, lead: n });
/** A mark the rival holds (later rival scenes and lines read it). */
const mark = (m: string): Json => ({ kind: 'rivalChange', feelings: {}, lead: 0, mark: m });
const trustIs = (n: number): Json => ({ kind: 'rivalState', feeling: { key: 'trust', atLeast: n } });
const RIVAL: Json = { kind: 'rivalMet', atLeast: 1 };
/** The rival, as a story fight: a loss never ends the run. */
const rivalFight = (size: number, lvl: number, win: Json[] = [], lost: Json[] = []): Json => trainer('Your rival', { rival: true, friendly: true, size, lv: lvl, win, lose: lost });
const seen = (id: string): Json => ({ kind: 'eventSeen', id });
const age = (key: string, atLeast = 1, atMost = 99): Json => ({ kind: 'flagAge', key, atLeast, atMost });
const later = (eventId: string, nodes: number): Json => ({ kind: 'laterEvent', eventId, nodes });
/** Swap Day (NE39): the rival has a team to lend; the hand-back (also automatic before the Gym and at a new stage). */
const SWAP_READY: Json = { kind: 'swapReady' };
const BACK: Json = { kind: 'teamSwap', mode: 'back' };
const night: Json = { kind: 'period', in: ['evening', 'night'] };
const LEAGUE = (): Json => place({ lastRegion: true, regionEnd: true });

type Persona = 'champion-chaser' | 'bitter-challenger' | 'enthusiast' | 'idealist' | 'strategist' | 'protector' | 'prodigy' | 'underdog';
/** A [by personality] rival line: the rival dialogue bank fills it from the rival's personality. Kept short so the whole token stays on one line. */
const say = (context: string, lines: Record<Persona, string>): string => `{say ${context}||${Object.entries(lines).map(([k, v]) => `${k}::${v}`).join('||')}}`;

const BERRIES3 = (): Json[] => [item('oran-berry'), item('sitrus-berry'), item('pecha-berry')];
const TYPES = ['normal', 'fire', 'water', 'grass', 'electric', 'ice', 'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'];
const TMS = TYPES.map((t) => `tm-${t}`);
/** The held item for a Pokémon's type (a parcel "that suits your lead"). */
const TYPE_ITEM: Record<string, string> = {
  normal: 'silk-scarf', fighting: 'black-belt', flying: 'sharp-beak', poison: 'poison-barb', ground: 'soft-sand', rock: 'hard-stone', bug: 'silver-powder', ghost: 'spell-tag', steel: 'metal-coat',
  fire: 'charcoal', water: 'mystic-water', grass: 'miracle-seed', electric: 'magnet', psychic: 'twistedspoon', ice: 'nevermeltice', dragon: 'dragon-fang', dark: 'black-glasses', fairy: 'fairy-feather',
};
const suitsLead = (): Json => ({ kind: 'typeItem', who: 'lead', table: TYPE_ITEM });
/** One gift per club member (NE33). */
const GIFT = ['sitrus-berry', 'lum-berry', 'great-ball', 'ether', 'big-malasada', 'casteliacone'];
const gifts = (n: number): Json[] => Array.from({ length: n }, () => any(...GIFT));

/** A branch replaces an outcome's effects, so a once-per-run event's done flag is copied into each of its branches. */
/** NE36 to NE40 share the stage's one rival slot with the rival questlines: they need it free, and taking one marks it used. */
const RIVAL_SLOT = new Set(['rq-empty-slot', 'rq-help-wanted', 'rq-letter', 'rq-swap-day', 'rq-asks-you-to-lose']);
function rivalSlot(e: Json): Json {
  if (!RIVAL_SLOT.has(String(e.id))) return e;
  e.requires = [...((e.requires as Json[] | undefined) ?? []), { kind: 'rivalQuest', slotFree: true }];
  const choices = [...(e.choices as Json[]), ...((e.remembers as Json[] | undefined) ?? []).flatMap((v) => (v.addChoices as Json[] | undefined) ?? [])];
  for (const c of choices) {
    for (const o of [c.success, c.failure] as (Json | undefined)[]) if (o) (o.effects as Json[]).push({ kind: 'rivalQuest', takeSlot: true });
    for (const b of (c.branches as Json[] | undefined) ?? []) (b.effects as Json[]).push({ kind: 'rivalQuest', takeSlot: true });
  }
  return e;
}

// =====================================================================================================================
// CATEGORY 6. PAST CHAMPIONS AND PAST GYM LEADERS (none is the stage's Gym battle: they're met off duty)
// =====================================================================================================================

const SPAR_TEXT = P(
  `He laughs, actually laughs, and says yes before you have finished asking. "After class. Dusk. The sandbar. Don't tell the children, or they'll want to battle too."`,
  `At dusk the tide goes out and leaves a long silver strip of sand. He brings three Pokémon. He brings them the way you'd bring old friends to a party.`,
  `Win or lose, there's no cost to it. He just wants to play. And before you part, he teaches your lead a move of his choosing.`,
);

const NE26: Json[] = [
  ne(26, 'champion-who-teaches-swimming', 'The Champion Who Teaches Swimming', GROUP.champ, {
    place: { earliest: 'A4', home: 8, window: [5, 11], sits: 'optional', attaches: 'town', tags: ['water'], level: 'A+2 if asked, three on three', note: 'At the Town node; else step 8.' },
    tags: ['Story', 'Combat'], cast: ['boss.wallace-gen6'], pokemon: 'milotic', tint: '#103040', effect: 'none',
  },
  P(
    `The beach is loud with gulls and small voices. A man in a white cap stands waist-deep in the shallows, teaching six small children how to float.`,
    `He wears a whistle on a cord, and pinned under it, faded by salt, a Champion's ribbon. Nobody on the whole beach has noticed the ribbon. He seems to like it that way.`,
    L(`The instructor: "Chin up. The water holds you if you let it. Same as a Milotic."`, `A child: "What's a Milotic?"`, `The instructor, delighted: "Oh, you're going to have a good life."`),
    `His eyes drift up the beach and land on your badges. He knows exactly what they are. He smiles, and puts one finger to his lips.`,
  ), [
    ch(`Keep his secret.`, out(P(
      `You give him the smallest nod and look away, at the gulls, at anything else. The lesson goes on. One by one, the children let go of the shore.`,
      `When you come back to your bag, a beach towel is folded over it, still warm from the sun. Rolled up inside it is a Mystic Water.`,
      `Tucked under it, a note in wet ink: "Thank you. They don't need a Champion. They need a swimming teacher."`,
    ), item('mystic-water'), flag('champ-secret-kept'))),
    ch(`Ask for a battle after class.`, fight(SPAR_TEXT,
      trainer('The Instructor', { team: ['whiscash', 'ludicolo', 'milotic'], size: 3, lv: 2, friendly: true }),
      flag('champ-sparred'), teach('recover', 'lead'),
    ), { branches: [br([leadIs('water')], SPAR_TEXT, flag('champ-sparred'), teach('aqua-ring', 'lead'))] }),
    ch(`Help with the lesson.`, out(P(
      `Your Pokémon slides into the shallows, and six small faces go round with wonder. One by one the children climb on, and are carried out, and carried back, shrieking.`,
      `The smallest one has held the instructor's sleeve all morning. Your Pokémon waits beside her, very still, very patient, until she lets go of him and holds on to it instead.`,
      `Then she floats. On her own. She looks up at the sky as if she has never seen it before. The instructor turns away to wipe his face, and blames the salt.`,
      `Before you go, he kneels by your Pokémon and shows it something, quietly, the way you'd share a secret: Aqua Ring.`,
    ), bondUp(2, 'picked'), ...kind(1), teach('aqua-ring', 'picked')), { pick: { types: ['water'] } }),
  ]),
  after(26, 'ne26-white-cap-in-the-stands', 'A White Cap in the Stands', GROUP.champ, [flagIs('champ-secret-kept'), LEAGUE()], { minStage: 6, cast: ['boss.wallace-gen6'], tint: '#103040' },
    P(`The League stands are a wall of noise and colour. Halfway up, in the cheap seats, one man sits very still in a white cap, a whistle on a cord round his neck.`, `Nobody near him knows who he is. He catches your eye across the whole arena, touches one finger to his lips, and grins.`), [
      ch(`Touch a finger to your own lips.`, out(`He laughs, and claps once, loudly, and the people round him turn to stare. He doesn't mind. He came to watch you, and he's watching.`)),
    ]),
];

const NE27: Json[] = [
  ne(27, 'leader-who-failed-her-own-test', 'The Leader Who Failed Her Own Test', GROUP.champ, {
    place: { earliest: 'A3', home: 17, window: [15, 19], sits: 'optional', attaches: 'town', level: 'A+1', note: 'At the Town node; else step 17. She leads this stage\'s own Gym, met on its steps before Step 20. A Pokémon lent to her is her ace at Step 20 and is handed back straight after.' },
    tags: ['Story', 'Combat'], tint: '#2a2018', effect: 'none',
  },
  P(
    `The Gym doors are chained shut, and a sign hangs from the chain: CLOSED FOR INSPECTION. On the steps below it sits the Leader herself, a clipboard on her knees.`,
    `Across the top of the clipboard, in red, in somebody else's handwriting: FAIL.`,
    L(`Leader Caoimhe: "League inspector says I've got predictable. Same lead, same ace, four years."`, `Caoimhe: "He's right. I stopped being scared of losing. That's when you stop being good."`),
    L(`She stands, brushes off her knees, and looks at you the way a challenger looks at a Leader.`, `Caoimhe: "Battle me with a team I've never used. Tell me the truth after."`),
  ), [
    ch(`Battle her new team.`, fight(P(
      `She whistles, and three Pokémon you have never seen in any Gym tumble out of the back door. Wrong types, wrong sizes, nobody's idea of a Leader's team.`,
      L(`Caoimhe: "I don't know what they'll do. That's the point."`, `Caoimhe: "Come on, then. Make me scared."`),
    ), trainer('Leader Caoimhe', { size: 3, lv: 1, friendly: true, win: [room('ne27-the-truth-after')], lose: [room('ne27-the-truth-after')] }))),
    ch(`Tell her to keep the old one.`, out(P(
      `"Your old team got you this far," you tell her. "It isn't broken." She looks at the FAIL for a long moment. Then she nods, slowly, as if she wanted to be told.`,
      `She appeals, and passes on appeal. The chain comes off the doors. Inside, the same lead and the same ace wait where they have always waited. Nothing changes. She looks relieved, and a little sad.`,
    ))),
    ch(`Lend her one of mine.`, out(P(
      `You hold out a Poké Ball. Caoimhe stares at it, then at you. "You'd do that? For your own Gym battle?" She takes it in both hands, like something breakable.`,
      `It will stand as her ace when you face her for the badge, she promises, and come straight home after. All afternoon she trains with it, shouting, laughing, getting it wrong.`,
      `It comes back to you at dusk a level stronger, and walks like it owns the Gym. It is insufferable. It is very, very pleased with itself.`,
    ), flag('gym-caoimhe-loan'), lv(1, 'picked')), { pick: {} }),
  ]),
  step(27, 'ne27-the-truth-after', 'The Truth After', GROUP.champ, { tint: '#2a2018' },
    P(`Afterwards she sits on the steps again, out of breath, grinning like she hasn't in years. Her new team lies in a tired heap at her feet.`, `Caoimhe: "Well? The truth. You promised."`), [
      ch(`"Better."`, out(P(
        `Her whole face changes. She grabs the clipboard, scores out FAIL, and writes BETTER over it in letters far too big for the page.`,
        `Caoimhe: "Then I'm keeping them. And you get something I've never once handed a challenger."`,
        `She presses a TM into your hand, still in its wrapper. Her Gym will field the new team now: harder to beat, and so much more fun to lose to.`,
      ), flag('gym-caoimhe-better'), any(...TMS))),
      ch(`"Worse, but alive."`, out(P(
        `She laughs so hard she has to sit back down. "Worse, but alive. Put that on my headstone."`,
        `She keeps the new team anyway. She's going to lose more. She looks happier about that than anyone you have ever met.`,
      ), flagAt('gym-caoimhe-worse'))),
      ch(`"Go back."`, out(P(
        `She nods. It stings; you can see it sting. Then she scoops up her new Pokémon, one at a time, and thanks each of them out loud.`,
        `Caoimhe: "Back to the old team. But I'll remember I was scared today. That's the part I needed."`,
      ), flag('gym-caoimhe-back'))),
    ]),
  after(27, 'ne27-losing-happily', 'Caoimhe, Losing Happily', GROUP.champ, [flagAgo('gym-caoimhe-worse')], { minStage: 5, tint: '#2a2018' },
    P(
      `A Circuit bracket hangs outside a hall. One name on it was knocked out in the very first round: Leader Caoimhe.`,
      `She's on the steps outside with a sandwich, her new team asleep in a heap around her. She sees you and waves the sandwich.`,
      L(`Caoimhe: "Lost again! Second round last time, first round today. I've never had so much fun in my life."`, `Caoimhe: "Worse, but alive. Best advice I ever got."`),
    ), [
      ch(`Sit down with her.`, out(`She splits the sandwich with you. Her Pokémon wake up and crowd round, and for a whole hour nobody says a word about winning.`)),
      ch(`"Next time, the final."`, out(`She points the sandwich at you. "Next time, I lose in the final. That's the dream."`)),
    ]),
];

const NE28: Json[] = [
  ne(28, 'trophy-nobody-claimed', 'The Trophy Nobody Claimed', GROUP.champ, {
    place: { earliest: 'A9', home: 4, window: [2, 7], sits: 'optional', attaches: 'town', note: 'At the Town node; else step 4. Once per save, built once per run.' },
    tags: ['Story'], cast: ['boss.npc_lady'], tint: '#2a2414', effect: 'none',
  },
  P(
    `A pawn shop on a corner, its window crowded with old radios and odd shoes. In the middle of it all, on a velvet cloth gone bald, stands a Champion's trophy.`,
    `The name plate has been scratched out with something sharp. Taped over it, in marker: FOR SALE: ₽300.`,
    L(`Pawnbroker Ignacia: "He brought it in himself. Said it was heavy."`, `Ignacia: "He drives the bread van now. Ask him. He'll tell you. He's not ashamed."`),
    `Outside at the kerb, a bread van idles, warm, smelling of morning.`,
  ), [
    ch(`Buy it and give it back.`, out(P(
      `You pay the ₽300 and carry the trophy out to the van. It is heavy. The man at the wheel sees it, and goes very still.`,
      L(`The driver, Roderigo: "I sold it so I'd stop looking at it."`, `He is quiet a long time. Then he leans across and opens the passenger door.`, `Roderigo: "...Put it in the van."`),
      `He uses it as a doorstop, to hold the back door open on hot mornings. He drives off with the door propped wide, and he is humming.`,
    ), $(-300), flagAt('trophy-returned'), ...kind(1)), { requires: [money(300)] }),
    ch(`Ask him why.`, out(P(
      `You knock on the van window. He winds it down and looks at you, and he knows exactly why you've come.`,
      L(`Roderigo: "I won. Then nobody needed anything from me except to stay the same."`, `Roderigo: "Bread's different. People need it new every day."`),
      `He hands a warm loaf out of the window and won't take a coin for it. You share it with your team on the kerb. It is the best bread any of you have ever eaten.`,
    ), heal(1))),
    ch(`Buy it and keep it.`, out(P(
      `You pay the ₽300. Ignacia wraps the trophy in newspaper without a word. Outside, the bread van pulls away from the kerb.`,
      `It sits at the bottom of your bag. It is heavier than it looks. You find you don't want to take it out and look at it.`,
    ), $(-300), flag('trophy-kept')), { requires: [money(300)] }),
  ]),
  after(28, 'ne28-for-the-bread-money', 'For the Bread Money', GROUP.champ, [flagAgo('trophy-returned')], { minStage: 10, tint: '#2a2414' },
    P(
      `The Circuit hall is packed for the final. On the bracket board, one name has climbed all the way up from the bottom: Roderigo.`,
      `A bread van is parked crooked outside, its back door propped open with something that shines.`,
      L(`Roderigo, passing you in the corridor: "For the bread money. That's all. ...Mostly."`, `He's smiling the way people smile when nobody needs them to stay the same.`),
    ), [
      ch(`Cheer from the stands.`, out(`You cheer until your voice goes. Whatever happens out there, he walks into the arena with flour on his sleeves and his head up.`)),
      ch(`Wish him luck.`, out(`Roderigo: "Don't need luck. Need flour." He presses a bread roll into your hand on his way out to the arena.`)),
    ]),
];

const sideText = (leader: string, ally: string): string => P(
  `The ${leader}'s ${ally} pads up beside your lead and leans its warm weight against it. Across the grass, the other Leader is laughing, already rolling up both sleeves.`,
  `Both Gyms crowd the ribbons to watch. The winning side chooses the seating, and either way, both sides are already cheering.`,
);

const NE29: Json[] = [
  ne(29, 'two-leaders-wedding', 'The Two Leaders\' Wedding', GROUP.champ, {
    place: { earliest: 'A5', home: 10, window: [9, 11], sits: 'must-see', attaches: 'instead', level: 'A+1 if they battle for it', note: 'Must-see when drawn: it is across the road, between two Gym towns.' },
    tags: ['Story', 'Combat'], cast: ['trainer.firebreather', 'boss.npc_swimmer_f'], tint: '#2a1c24', effect: 'sparkle',
  },
  P(
    `The road between the two Gyms is hung end to end with ribbons, red and blue, red and blue, so many that the trees look dressed for a party.`,
    `The Fire Leader and the Water Leader are getting married. Both Gyms are here. Both Gyms are arguing about the seating, loudly, over a cake the size of a cart.`,
    L(`Best man, a Fire trainer: "Fire sits left. Tradition."`, `Maid of honour, a Water trainer: "There is no tradition. You invented it this morning."`),
    L(`The two Leaders, together, to you: "Please. You're neutral. Do the seating."`, `They look so tired. They look so happy. They're holding hands under the table.`),
  ), [
    ch(`Mix everyone.`, out(P(
      `You take the seating plan, tear it in half, and put a Fire trainer beside a Water trainer all the way down the table. Nobody speaks to anybody for ten long minutes.`,
      `Then a Fire trainer's Growlithe and a Water trainer's Psyduck end up nose to nose over the same plate. They share it. They share it very loudly.`,
      `Somebody laughs. Somebody passes the salt. By the speeches both Gyms are singing the same song, badly, in two keys. The cake is cut, and there's a gift for the one who did the seating.`,
    ), flag('wedding-mixed'), rep(2), heal(1), any('charcoal', 'mystic-water'))),
    ch(`Left and right, as asked.`, out(P(
      `Fire on the left, Water on the right, exactly as the best man wanted. Nobody argues. Nobody laughs much, either.`,
      `The vows are lovely. The cake is lovely. Both sides clap politely for each other's speeches, and you are thanked very correctly, and handed cake, and a small wrapped gift.`,
    ), heal(1), any('charcoal', 'mystic-water'))),
    ch(`Make them battle for it.`, out(P(
      `"Settle it the Gym way," you say. The two Leaders look at each other, and both grin at once. Tables are pushed back. A ring of ribbons is laid out on the grass.`,
      `A double battle: you beside one Leader, against the other. The winning side gets the seating. The Leaders insist that you choose which of them to stand beside.`,
    ), flag('wedding-battle'), room('ne29-pick-a-side'))),
  ]),
  step(29, 'ne29-pick-a-side', 'Pick a Side', GROUP.champ, { tint: '#2a1c24', effect: 'sparkle' },
    P(`The ring of ribbons, the cake on its cart, two Gyms holding their breath. Both Leaders are looking at you.`), [
      ch(`Stand with the Fire Leader.`, fight(sideText('Fire Leader', 'Arcanine'),
        trainer('The Water Leader', { format: 'doubles', size: 2, lv: 1, types: ['water'], ally: 'arcanine', friendly: true, win: [heal(1), item('charcoal')], lose: [heal(1), item('charcoal')] }))),
      ch(`Stand with the Water Leader.`, fight(sideText('Water Leader', 'Gyarados'),
        trainer('The Fire Leader', { format: 'doubles', size: 2, lv: 1, types: ['fire'], ally: 'gyarados', friendly: true, win: [heal(1), item('mystic-water')], lose: [heal(1), item('mystic-water')] }))),
    ]),
];

const NE30: Json[] = [
  ne(30, 'champions-mother', 'The Champion\'s Mother', GROUP.champ, {
    place: { earliest: 'A2', home: 6, window: [3, 9], sits: 'optional', attaches: 'town', note: 'At the Town node; else step 6. The letter is delivered at any later meeting with that Champion; with none in the run, it is posted from the last stage\'s Town node.' },
    tags: ['Story'], tint: '#2a2030', effect: 'none',
  },
  P(
    `A small house at the end of a small street. In its front window stands a shelf, and on the shelf, in order, every newspaper clipping ever printed about one Champion.`,
    `The first clippings are yellow and curling. The last is eleven years old. Nothing has been added since. The glass in front of them was dusted this morning.`,
    L(`An old woman, Perpetua, at the door: "They write to the League. Not to me. That's all right. They're busy."`, `She looks past you, at the hills, at the road you came in on.`, `Perpetua: "If you get that far, tell them the plum tree came back."`),
  ), [
    ch(`"I'll tell them."`, out(P(
      `Her face does something complicated, and then settles into a smile. She goes inside and comes back with a jar: heavy, dark, sealed with wax.`,
      L(`Perpetua: "From the tree. The first ones. It took nine years, you know. Everyone said it was dead."`, `Perpetua: "Tell them that part too. That everyone said it was dead."`),
    ), flag('champ-plums'), ...BERRIES3())),
    ch(`"Write a letter. I'll carry it."`, out(P(
      `She sits at her kitchen table a long time with the pen held over the paper. She writes very slowly. When she's done, it is one line.`,
      `She folds it twice and doesn't let you see it. She gives you a jar of plums for the road as well. "For carrying," she says.`,
    ), flag('champ-letter'), ...BERRIES3())),
    ch(`"They should come home."`, out(P(
      `Her hand tightens on the door frame, and for a moment she looks every one of her years.`,
      L(`Perpetua: "Don't you say that to them. Don't you dare."`, `Perpetua: "You tell them about the tree."`),
      `She presses the jar of plums into your hands anyway, and shuts the door gently, the way you'd close a door on someone sleeping.`,
    ), ...BERRIES3())),
  ]),
  after(30, 'ne30-the-plum-tree', 'The Plum Tree Came Back', GROUP.champ, [anyFlag('champ-plums', 'champ-letter'), LEAGUE()], { minStage: 6, tint: '#2a2030' },
    P(`The Champion's door is at the end of a long, cold corridor. Before it opens, the Champion is there in the anteroom, alone, checking their Poké Balls one last time.`, `You remember a small house, and a shelf of clippings, and an old woman at her door.`), [
      ch(`"The plum tree came back."`, out(P(
        `The Champion stops. Their hand stays on the Ball. They don't turn round for a long time.`,
        `Champion: "...Give me a minute."`,
        `They take the minute. They take two. When they turn, their eyes are red and their back is very straight, and they nod to you like an equal.`,
      ), flag('champ-told-plums')), { requires: [flagIs('champ-plums')] }),
      ch(`Give them the letter.`, out(P(
        `You hold out the folded paper. The Champion knows the handwriting before they've even taken it.`,
        L(`They read the one line. Then they read it again.`, `Champion: "...Give me a minute."`),
        `They fold it into their breast pocket, over the heart, and walk to the door beside you.`,
      ), flag('champ-letter-delivered')), { requires: [flagIs('champ-letter')] }),
    ]),
];

// =====================================================================================================================
// CATEGORY 7. PAST ALLIES
// =====================================================================================================================

const NE31: Json[] = [
  ne(31, 'ally-who-kept-your-seat', 'The Ally Who Kept Your Seat', GROUP.ally, {
    place: { earliest: 'A2', home: 14, window: [10, 18], sits: 'optional', attaches: 'rest', note: 'Needs one finished run. The inn\'s + node has a lit window from three steps away.' },
    tags: ['Story'], tint: '#2a2016', effect: 'none',
  },
  P(
    `The inn is warm and half empty. At a table by the window, two places are set. One chair has a coat hung on the back of it.`,
    `It isn't your coat. But it's your size, exactly, down to the length of the sleeves.`,
    L(`A trainer from the last run, sitting across from the empty chair: "I said I'd wait a year. It's been longer. I ate both dinners most nights."`, `They look up, and look you over, slowly.`, `Your old partner: "You look different. Same shoes."`),
  ), [
    ch(`Sit down.`, out(P(
      `You lift the coat off the chair and sit. They push a bowl across, still hot; they must have ordered it the moment you walked in.`,
      `They talk about the last run: how it really ended, who was really on the team, the things that never made it into anybody's story. Some of it, you almost remember.`,
      `They make sure you eat everything before you go up to bed. Your team sleeps by the fire as if they've slept there before.`,
    ), flag('ally-dinner'), heal(1))),
    ch(`"I'm not who you waited for."`, out(P(
      `They look at you a long time, and something in their face goes soft and tired and kind.`,
      L(`Your old partner: "No. But you're who came."`, `They push the plate over.`),
      `You eat. They watch you eat, the way people watch someone they've missed. When the bowl is empty, they fill it again.`,
    ), flag('ally-dinner'), heal(1))),
    ch(`"Come with me this time."`, out(P(
      `They stand so fast the chair goes over. Then they laugh at themselves, set it right, and shrug on the coat.`,
      `Your old partner: "I've been ready for a year. Longer."`,
      `They eat the second dinner standing up, and walk out of the inn beside you. For the rest of the stage there are two of you on the road again.`,
      `Their partner is the strangest part: it is the spitting image of your own lead, down to the scar. In the next fights it stands beside yours.`,
    ), flag('ally-travels'), heal(1), { kind: 'tagPartner', copy: 'lead', battles: 3 })),
  ]),
];

const NE32: Json[] = [
  ne(32, 'borrowed-pokemons-thank-you', 'The Borrowed Pokémon\'s Thank-You', GROUP.ally, {
    place: { earliest: 'A3', home: 9, window: [4, 16], sits: 'optional', attaches: 'after' },
    // Only after a Pokémon fought beside you on loan or in a tag battle this run.
    requires: [anyFlag('ditto-mirror', 'ally-travels', 'wedding-battle', 'rival-swap')],
    tags: ['Pokémon', 'Story'], tint: '#20281c', effect: 'none',
  },
  P(
    `A Pokémon is sitting in the middle of the path with a parcel tucked under its chin. Its feet are dusty. It has walked a very long way.`,
    `You know it. Once, for a fight, it stood beside you on loan. It knows you too. It gets up, and pushes the parcel toward you with its nose.`,
    L(`Its trainer, arriving behind it, out of breath: "It wouldn't stop. Three days. It remembered your team."`, `Its trainer: "I didn't know they did that."`),
  ), [
    ch(`Open it.`, out(P(
      `String, brown paper, more string. Inside, wrapped in a sock for safety, is a held item, exactly right for your lead, as if somebody had measured.`,
      `The Pokémon watches you open it with enormous seriousness. Then it sits down, satisfied. Its errand is done.`,
    ), suitsLead())),
    ch(`Greet it first.`, out(P(
      `You kneel and hold out a hand, and it forgets the parcel entirely. It barrels into you, then into your lead, then back into you, overjoyed.`,
      `The two of them roll about in the grass like old friends. Much later, somebody remembers the parcel. Inside is a held item, just right for your lead.`,
    ), bondUp(1, 'lead'), suitsLead())),
    ch(`Give it something back.`, out(P(
      `You take something from your own bag and tuck it into the empty paper for the Pokémon to carry home. Its trainer starts to protest, then stops.`,
      L(`Its trainer: "Then we're even."`, `Its trainer: "...No. Then we're friends."`),
      `You shake on it. The parcel holds a held item for your lead. The Pokémon carries your gift home in its mouth, very proudly, the whole way.`,
    ), loseAny(), suitsLead(), flag('ally-even'), rep(1))),
  ]),
];

const MEMBER_LINES = [
  `The chairperson goes first. Then she sits down, and finds she has nothing else to say, and laughs.`,
  `The second member stands, says one line about the road where you met, and sits down fast, red to the ears.`,
  `The third is funny. The fourth is not funny at all. The chairperson keeps the minutes in a school exercise book and cries a little on item four.`,
  `By the fifth, your Pokémon have eaten every biscuit in the shed. Nobody minds. It takes a long while, and nobody wants it to end.`,
];
const joinText = (n: number): string => P(
  `They make room on the bench. Then, one at a time round the table, each member stands up and says one line about what you did for them.`,
  ...MEMBER_LINES.slice(0, Math.max(1, n - 1)),
  `When you leave, the whole club walks you to the gate, and each of them presses something into your hands.`,
);
const whyText = (n: number): string => P(
  `"Why?" you ask. The chairperson pours you a cup of tea before she answers, the way people do when the answer matters.`,
  `Chairperson: "We kept meeting each other on the road, saying your name. Somebody said we should have a club. So we have a club."`,
  n > 1 ? `Before you go, each of the ${n} of them gives you something from their pockets. They've clearly been saving them.` : `Before you go, she gives you something from her pocket. She's clearly been saving it.`,
);
const tinText = (n: number): string => P(
  `At the rest stop there's a biscuit tin on your bag. Nobody saw who left it. On the lid, in crooked hand-painted letters: FROM THE CLUB.`,
  n > 1 ? `Inside, under a layer of biscuits, are ${n} small gifts, each wrapped in a different paper, each with a name on the tag.` : `Inside, under a layer of biscuits, is one small gift, wrapped carefully, with one name on the tag.`,
);
/** One gift per member, up to five: members are the strangers this run helped (the Kindness Ledger). */
const byMembers = (label: string, text: (n: number) => string, ...effects: Json[]): Json =>
  ch(label, out(text(1), ...effects, ...gifts(1)), { branches: [5, 4, 3, 2].map((n) => br([flagIs('kind-helped-stranger', n)], text(n), ...effects, ...gifts(n))) });

const NE33: Json[] = [
  ne(33, 'ones-who-formed-a-club', 'The Ones Who Formed a Club', GROUP.ally, {
    place: { earliest: 'A12', home: 5, window: [3, 8], sits: 'optional', attaches: 'town', note: 'At the Town node; else step 5. A late-run event: each member is somebody this run actually helped.' },
    requires: [flagIs('kind-helped-stranger')], tags: ['Story'], tint: '#28241a', effect: 'none',
  },
  P(
    `A hand-painted sign on a garden shed, the letters a little crooked, as if several people painted it at once: PEOPLE {player} HELPED. MEETINGS THURSDAYS.`,
    `It's Thursday. Through the window you can see them: the people you stopped for on the road this run, squeezed in round one table, drinking tea out of mismatched cups.`,
    L(`The chairperson, the first person you helped, bangs a spoon on a saucer: "Item one: they're here."`, `Chairperson: "Item two: somebody tell them about the biscuits."`),
  ), [
    byMembers(`Join the meeting.`, joinText, bondUp(1, 'party'), flag('club-formed')),
    byMembers(`Ask why they did this.`, whyText, flag('club-formed')),
    ch(`Slip away.`, out(P(
      `You back away from the window before anyone sees you, your face hot, your heart very full.`,
      `Behind you, through the glass, the meeting carries on without you. Somebody proposes a vote of thanks. Every hand goes up.`,
    ), flag('club-formed'), flag('club-slipped'))),
  ], [
    variant('one-member', [flagIs('kind-total', 0, 2)], {
      intro: P(
        `A hand-painted sign on a garden shed: PEOPLE {player} HELPED. MEETINGS THURSDAYS.`,
        `It's Thursday. Through the window you can see one person, sitting at a table set for twelve, with one cup of tea and a whole plate of biscuits.`,
        L(`She sees you and lights up. She bangs a spoon on her saucer anyway, for form.`, `The chairperson: "Item one: they're here. Item two: there's ever so many biscuits."`),
      ),
    }),
  ]),
  after(33, 'ne33-the-biscuit-tin', 'A Biscuit Tin', GROUP.ally, [flagIs('club-slipped')], { minStage: 12, stop: 'rest', tint: '#28241a' }, tinText(1), [
    byMembers(`Open the tin.`, (n) => `You eat a biscuit, and then another, and read every name on every tag twice. ${n > 1 ? 'Each gift is something useful, chosen with care.' : 'The gift is something useful, chosen with care.'}`),
  ]),
];

const NE34: Json[] = [
  ne(34, 'apprentices-first-student', 'The Apprentice\'s First Student', GROUP.ally, {
    place: { earliest: 'A4', home: 11, window: [7, 15], sits: 'optional', attaches: 'after', note: 'Needs SF2 (the Apprentice) met this run.' },
    requires: [seen('apprentice-follows')], tags: ['Story'], cast: ['boss.npc_youngster'], tint: '#20281a', effect: 'none',
  },
  P(
    `On a patch of grass beside the road, Tib is teaching a smaller child how to throw a Poké Ball. Tib has a stick for pointing, and a very serious face.`,
    `Tib is getting every detail wrong. Wrong in exactly the way you got it wrong, the day Tib first watched you throw.`,
    L(`Tib: "No, you hold it like this. My teacher holds it like this."`, `The student, Pascoe: "Your teacher holds it wrong."`, `Tib, outraged: "My teacher's the best there is!"`),
    `Then Tib sees you, and goes the colour of a Cheri Berry.`,
  ), [
    ch(`Correct Tib.`, out(P(
      `You take the Ball and show them both, gently, how your fingers should have gone all along. Tib watches your hand, then their own, and goes redder still.`,
      `There is a terrible, mortified silence. Then Tib laughs, a big helpless laugh, and Pascoe laughs too, and the next throw sails clean.`,
      `Tib digs in a pocket and hands you a Great Ball, and then, shyly, a battered old cap. "I wore it when I followed you. You keep it."`,
    ), flag('tib-corrected'), item('great-ball'), flag('tib-cap'))),
    ch(`Let it be.`, out(P(
      `You say nothing. You just nod to Tib, teacher to teacher, and Tib stands a little taller.`,
      `Pascoe throws it the wrong way, and catches nothing, and throws again. The wrong grip is Tib's now, and soon it will be Pascoe's. Somewhere, a tradition is starting.`,
      `Tib presses a Great Ball and a battered old cap into your hands. "For my teacher. You'll need a spare."`,
    ), flag('tib-grip'), item('great-ball'), flag('tib-cap'))),
    ch(`Teach them both.`, out(P(
      `You sit down in the grass with both of them and teach until the light changes. It takes the whole next stretch of road. Neither of them notices the time.`,
      `Near sunset Pascoe throws, and the Ball wobbles, and wobbles, and clicks. A Rattata. Pascoe's first. Pascoe holds the Ball up to the sky and screams with joy.`,
      `Tib, very quietly, says it's the best day of their life. Then Tib hands you a Great Ball and their old cap, to remember it by.`,
    ), takeNode(), ...kind(1), item('great-ball'), flag('tib-cap'))),
  ], [
    variant('tib-patient', [seen('apprentice-kind')], { notice: `Tib is patient about it, endlessly patient, the way you were patient with strangers on the road. Tib explains it a fourth time without one sigh.` }),
    variant('tib-bossy', [seen('apprentice-sly')], { notice: `Tib is bossy about it. Tib smacks the stick into a palm and says "Again!" exactly the way you say it when you're in a hurry.` }),
  ]),
];

const rescueEffects = (): Json[] => [heal(1), rest(), item('sitrus-berry'), flag('wilhelmina-met')];

const NE35: Json[] = [
  ne(35, 'rescue-you-dont-remember', 'The Rescue You Don\'t Remember', GROUP.ally, {
    place: { earliest: 'A3', home: 13, window: [6, 17], sits: 'optional', attaches: 'after', note: 'Once per save, built once per run. Only with an earlier run on this save.' },
    tags: ['Story'], tint: '#1c2430', effect: 'none',
  },
  P(
    `A stranger comes running across the street, and before you can step aside she has thrown her arms around you, and she will not let go.`,
    L(`Stranger, Wilhelmina: "You pulled me out of the river. Last spring."`, `Wilhelmina: "You didn't even stop to give your name. You just went."`),
    `You have never seen her before in your life. She is crying into your shoulder anyway. Whatever she remembers, it happened on another road, to another you.`,
  ), [
    ch(`"I'm glad you're all right."`, out(P(
      `She cries harder, then laughs at herself for crying, then hugs you again for good measure.`,
      `She marches you into the inn on the corner and pays for your room before you can argue. "And breakfast. And theirs," she says, pointing at your team. She adds a Sitrus Berry for the road.`,
    ), ...rescueEffects())),
    ch(`"That wasn't me."`, out(P(
      `She steps back and holds your face in both hands and looks at it hard, the way you'd check a map.`,
      `Wilhelmina: "It was your face."`,
      `She pays for your room anyway, and a Sitrus Berry for the road, and won't hear another word about it.`,
    ), ...rescueEffects())),
    ch(`"Tell me what happened."`, out(P(
      `She sits you down on the inn step and tells it. The flood. The cold. A trainer and a Pokémon coming out of the brown water for her when nobody else would.`,
      `She tells it as someone on the bank saw it, with all the parts you'd have left out. It sounds like you. It sounds like someone you'd like to be.`,
      `Then she pays for your room, and presses a Sitrus Berry into your hand.`,
    ), ...rescueEffects(), flag('ally-told'))),
  ]),
  after(35, 'ne35-in-the-crowd', 'A Face in the Crowd', GROUP.ally, [flagIs('wilhelmina-met'), LEAGUE()], { minStage: 6, tint: '#1c2430' },
    P(`The League stands roar like surf. In the front row, leaning over the rail as far as she can, is a woman you met once on a street corner.`, `Wilhelmina has made a banner. It's a river, painted blue, and a stick figure in it, and an arrow, and one word: YOU.`), [
      ch(`Wave to her.`, out(`She waves back with both arms and nearly falls over the rail. The people round her ask who you are. She tells them. It takes a while.`)),
    ]),
];

// =====================================================================================================================
// CATEGORY 8. RIVALS (rival events share one slot per stage with the rival questlines)
// =====================================================================================================================

const NE36: Json[] = [
  ne(36, 'rivals-empty-slot', 'The Rival\'s Empty Slot', GROUP.rival, {
    id: 'rq-empty-slot',
    place: { earliest: 'A5', home: 10, window: [8, 13], sits: 'optional', attaches: 'rest', level: 'A+0, five on five, if the player asks', note: 'At the rival\'s camp. If the path misses this + node, the cracked Ball is seen on the rival\'s belt at the next meeting, and nothing is said.' },
    requires: [RIVAL], tags: ['Rival', 'Relationship', 'Story'], rarity: 'rare', tint: '#1c1a24', effect: 'glint',
  },
  P(
    `{rival} has made camp off the road. Five Pokémon are out around the fire, eating, sleeping, keeping close. The sixth Ball sits on the log beside {rival}, on its own. It's cracked right across.`,
    L(`{rival}: "${say('event', { 'champion-chaser': `Don't ask.`, 'bitter-challenger': `Just don't.`, enthusiast: `Please don't ask.`, idealist: `Don't ask. Please.`, strategist: `Don't. Not yet.`, protector: `Don't ask me.`, prodigy: `Don't ask.`, underdog: `Please, don't.` })}"`),
    `A long silence. The fire spits. One of the five lifts its head and looks at the cracked Ball, and puts its head down again.`,
    L(`{rival}: "...It was a wild battle. A stupid one. I pushed."`, `{rival}: "I keep the Ball. I don't know why."`),
  ), [
    ch(`Sit with them.`, out(P(
      `You sit down on the log, on the other side of the cracked Ball, and say nothing at all.`,
      `Nobody talks. The fire burns down. After a long while, {rival} leans, very slightly, until your shoulders touch. Neither of you mentions it in the morning.`,
    ), trust(2), flag('rival-grief-shared'))),
    ch(`Tell them about one I lost.`, out(P(
      `You tell them about yours. The name. The day. The thing you'd do differently, that you will never get to do.`,
      `{rival} listens without interrupting, staring into the fire. When you finish, they're quiet a long time.`,
      L(`{rival}: "...What was its name? Say it again."`, `You say it again. {rival} repeats it, carefully, as if putting it somewhere safe.`),
    ), trust(3), flag('rival-knows-lost')), { requires: [{ kind: 'memorial', atLeast: 1 }] }),
    ch(`Battle. It'll help.`, fight(P(
      `{rival} stands up too fast. "Fine." Five Balls. The sixth stays lying on the log, and their eyes keep going back to it.`,
      `They're somewhere else the whole fight. Their calls come late. Their Pokémon look round for orders that don't come.`,
      `When it's over, {rival} picks up the cracked Ball and turns it over in their hands. {rival}: "Not today."`,
    ), rivalFight(5, 0), trust(-1))),
  ], [
    variant('winning', [{ kind: 'rivalState', leadAtLeast: 2 }], { notice: `{rival}, to nobody: "I was winning. That's the stupid part."` }),
  ]),
];

const ARGUE_ASK = `Mr. Abernathy-Finch asks three questions. How many badges you've earned. Who in town would vouch for you. How many mouths you feed on the road.`;

const NE37: Json[] = [
  ne(37, 'rival-applies-for-your-job', 'The Rival Applies for Your Job', GROUP.rival, {
    id: 'rq-help-wanted',
    place: { earliest: 'A2', home: 6, window: [3, 9], sits: 'optional', attaches: 'town', note: 'At the Town node; else step 6.' },
    requires: [RIVAL], tags: ['Rival', 'Relationship', 'Story'], cast: ['trainer.worker_m'], tint: '#2a2418', effect: 'glint',
  },
  P(
    `A corner shop with a HELP WANTED sign in the window. You reach for the sign, and another hand reaches for it at exactly the same moment. {rival}'s.`,
    `You both hold on. Neither of you lets go. The sign tears a little at the corner.`,
    L(`Shopkeeper, Mr. Abernathy-Finch: "One position. A day's work. ₽600. Convince me."`, `{rival}: "${say('event', { 'champion-chaser': `I'm faster.`, 'bitter-challenger': `I'm faster. Obviously.`, enthusiast: `I'm faster! Watch!`, idealist: `I'm faster. Honestly.`, strategist: `I'm faster. Measurably.`, protector: `I'm faster. And careful.`, prodigy: `I'm faster. Always.`, underdog: `I'm faster. I think.` })}"`),
  ), [
    // The player's real run stats decide: two of the three answers have to hold (badges, standing in town, a full team).
    ch(`Out-argue them.`, out(P(
      ARGUE_ASK,
      `You answer honestly. {rival} answers louder. The numbers don't fall your way.`,
      L(`Mr. Abernathy-Finch: "The other one. Apron's on the hook."`, `{rival} takes the apron with a look you'll be hearing about for the rest of the run.`),
    ), rivalLead(1)), {
      branches: [[{ kind: 'badges', atLeast: 2 }, flagIs('rep')], [{ kind: 'badges', atLeast: 2 }, party(4)], [flagIs('rep'), party(4)]].map((when) => br(when, P(
        ARGUE_ASK,
        `Your answers are real, and they hold. {rival} starts strong and runs out of road.`,
        L(`Mr. Abernathy-Finch: "You. Apron's on the hook."`, `You work the day. It's hard, honest work, and at closing he counts ₽600 into your hand.`),
      ), $(600), rivalLead(-1))),
    }),
    ch(`Let them have it.`, out(P(
      `You let go of the sign. {rival} nearly falls over backwards.`,
      L(`{rival}: "...What's the catch?"`, `There isn't one. They look at you a long time: suspicious, then less suspicious, then something else.`),
      `{rival}: "Thanks. I mean it. Don't tell anyone I meant it."`,
    ), trust(1))),
    ch(`Split it.`, out(P(
      `"Half each," you say. Mr. Abernathy-Finch sighs the sigh of a man making a terrible mistake, and hands out two aprons.`,
      `You both work. You're both very bad at it. You argue about the shelving, the till, and the right way to fold a paper bag.`,
      `At closing he pays ₽300 each, and pins a customer's complaint to the board: "THE TWO SHOUTING ONES." {rival} is grinning. So are you.`,
    ), $(300), trust(2), flag('rival-split-job'))),
  ], [
    variant('rival-broke', [seen('rq-emptied-shelves')], {
      notice: `{rival}'s pockets are turned out. Since the day they emptied a shop's shelves, they haven't had a coin to their name.`,
      hide: [1],
      addChoices: [ch(`Let them have it.`, out(P(
        `You let go of the sign. {rival} stares at you, then at the sign, then at their own empty hands.`,
        L(`{rival}: "...You know I'm broke. Don't you."`, `You don't say anything. You don't have to.`),
        `{rival} ties on the apron, and works the whole day without one complaint, and at closing buys you a drink with the first coin they've had in weeks.`,
      ), trust(3)))],
    }),
  ]),
  after(37, 'rq-old-man-sign', 'The Sign Changes', GROUP.rival, [RIVAL, age('rq-help-wanted-done')], { minStage: 3, cast: ['trainer.worker_m'], tint: '#2a2418', effect: 'glint' },
    P(`Mr. Abernathy-Finch's shop again. He has rehung his sign, and repainted it, and underlined it twice.`, `It reads: NO RIVALS.`), [
      ch(`Smile and move on.`, out(`Some jobs you only do once.`, fondness(1)), {
        branches: [br([flagIs('rival-split-job')], P(`Under it, in smaller letters: "Except the two shouting ones. They know why."`, `You laugh all the way down the street. Some jobs you only do once.`), fondness(1))],
      }),
    ]),
];

const sendText = P(
  `{rival} pulls the letter back from the coals and blows on the browned edge until it's cool.`,
  `In the morning they post it at the first town, and stand in front of the post box a long time after it's gone.`,
);
const burnText = P(
  `{rival} opens their fingers. The letter drops, curls, catches, and goes up in one bright breath.`,
  `They watch it go until there's nothing left to watch. Then they lie back and look at the stars, and their shoulders come down, slowly, for the first time in a long time.`,
);

const NE38: Json[] = [
  ne(38, 'thing-they-never-said', 'The Thing They Never Said', GROUP.rival, {
    id: 'rq-letter',
    place: { earliest: 'A6', home: 15, window: [11, 18], sits: 'optional', attaches: 'rest', tags: ['night'], note: 'Night camp; Trust 4 or more.' },
    requires: [RIVAL, trustIs(4)], tags: ['Rival', 'Relationship', 'Story'], rarity: 'rare', tint: '#1a1424', effect: 'glint',
  },
  P(
    `Night camp. The fire is low and red. {rival} sits on the far side of it with a folded letter in one hand, holding it out over the coals.`,
    `Not quite in the flames. Not quite out of them. The edge of the paper is starting to brown.`,
    L(`{rival}: "It's to my dad. He wanted me to win a League. I want to."`, `{rival}: "I don't know if it's mine or his."`),
    L(`They look at you across the fire.`, `{rival}: "Burn it or send it?"`),
  ), [
    ch(`Send it.`, out(sendText, flag('rival-letter-sent'))),
    ch(`Burn it.`, out(burnText, flag('rival-letter-burnt'), mark('letter-burnt'))),
    ch(`Read it to me first.`, out(P(
      `{rival} hesitates. Then they unfold it and read it to you in a quiet, flat voice, as if it were somebody else's. It's short.`,
      `It ends: "I met someone who makes me want to be good at this for me."`,
      `They don't look up. The fire pops. {rival}: "...So. Send it or burn it?"`,
    ), trust(3), flag('rival-read-letter'), room('rq-letter-read'))),
  ], [
    variant('mentor-named', [seen('rq-mentor')], { notice: `On the outside of the letter, under their dad's name, there's a second name, written smaller. Their old mentor's.` }),
  ]),
  step(38, 'rq-letter-read', 'Send It or Burn It', GROUP.rival, { tint: '#1a1424', effect: 'glint' },
    P(`The letter is folded again in {rival}'s hand, over the fire. You know what it says now. So do they.`), [
      ch(`Send it.`, out(sendText, flag('rival-letter-sent'))),
      ch(`Burn it.`, out(burnText, flag('rival-letter-burnt'), mark('letter-burnt'))),
    ]),
  after(38, 'rq-old-man-stands', 'The Man in the Stands', GROUP.rival, [RIVAL, flagIs('rival-letter-sent'), LEAGUE()], { minStage: 6, tint: '#1a1424', effect: 'glint' },
    P(`The League stands are full. At the edge of them an older man stands alone, hat in his hands, watching {rival} warm up below.`, `He has {rival}'s way of standing. Exactly. He sees you looking, and nods to you once, as if he knows who you are.`), [
      ch(`Nod back.`, out(`Whatever the letter said, it arrived. {rival} hasn't seen him yet. You don't spoil it.`, fondness(1))),
    ]),
];

const NE39: Json[] = [
  ne(39, 'swap-day', 'Swap Day', GROUP.rival, {
    id: 'rq-swap-day',
    place: { earliest: 'A4', home: 9, window: [7, 12], sits: 'optional', attaches: 'before', level: 'The swapped teams, A+0', note: 'The swap lasts from its node to Step 19. The Gym is not fought swapped: the teams are handed back at Step 19, with a short scene.' },
    requires: [RIVAL], tags: ['Rival', 'Relationship', 'Story'], tint: '#1c2430', effect: 'glint',
  },
  P(
    `{rival} is waiting in the middle of the path. Before you can say hello, they unclip their whole belt and hold it out to you. Six Balls, swinging.`,
    L(`{rival}: "One stage. You take mine. I take yours."`, `{rival}: "You always say mine are badly trained."`),
    `{rival}: "${say('event', { 'champion-chaser': `Prove it.`, 'bitter-challenger': `Go on. Prove it.`, enthusiast: `Prove it! Please!`, idealist: `Prove it, fairly.`, strategist: `Prove it. With data.`, protector: `Prove it. Gently.`, prodigy: `Prove it. You can't.`, underdog: `Prove it. Or don't.` })}"`,
  ), [
    ch(`Swap.`, out(P(
      `You unclip your own belt and hold it out. For a second neither of you lets go. Then the trade is made, and your team is in {rival}'s hands, looking back at you over their shoulders.`,
      `{rival}'s team looks up at you, baffled and wary. Six strangers who know your face.`,
      `Until the stage's last road you fight with theirs: their levels, their moves. Then the belts go back.`,
    ), flag('rival-swap'), { kind: 'teamSwap', mode: 'all' }, later('rq-swap-day-handback', 8)), { requires: [SWAP_READY] }),
    ch(`Swap one each.`, out(P(
      `You each pick one. {rival} takes yours like a borrowed jacket, carefully, checking the pockets. You take theirs.`,
      `For a while one stranger walks with your team, and one of yours walks with theirs. Both come home with stories.`,
    ), trust(1), flag('rival-swap'), { kind: 'teamSwap', mode: 'one' }, later('rq-swap-day-handback', 8)), { requires: [SWAP_READY], pick: {} }),
    ch(`No.`, out(P(`{rival} snorts and clips the belt back on.`, `{rival}: "Scared."`, `They're grinning when they say it, though. Mostly.`))),
  ]),
  step(39, 'rq-swap-day-handback', 'Swap Day: Handing Back', GROUP.rival, { tint: '#1c2430', effect: 'glint' },
    P(
      `At the stage's last road {rival} is waiting with your belt, and you hand back theirs. Both teams pour out of their Balls at once and run to their own trainers.`,
      L(`{rival}: "Yours argued with me the whole way. I've no idea how you get anything done."`, `{rival}: "${say('event', { 'champion-chaser': `No idea how you win.`, 'bitter-challenger': `Yours never listen.`, enthusiast: `They're amazing! And loud!`, idealist: `They argued. Fairly.`, strategist: `Zero discipline.`, protector: `They missed you.`, prodigy: `Chaotic. Effective.`, underdog: `They argued. I lost.` })}"`),
    ), [
      ch(`Take them back.`, out(P(
        `Your team checks you over as if you've been away a year. Every one of them picked something up on the road with a stranger.`,
        `One of them shows off a brand-new move it learned from {rival}'s ace, very pleased with itself. {rival} pretends not to notice, and fails.`,
        `{rival} counts their own team twice, then a third time. Not one of them so much as fainted. {rival}'s ace walks over and leans its whole weight against your legs.`,
      ), BACK, bondUp(1, 'party'), eggMove(), mark('swap-day'), trust(2), mark('swap-ace-fond')), {
        branches: [br([flagIs('swap-fainted')], P(
          `Your team checks you over as if you've been away a year. Every one of them picked something up on the road with a stranger.`,
          `One of them shows off a brand-new move it learned from {rival}'s ace, very pleased with itself.`,
          `{rival} counts their own team, and stops at the one that fainted in your care. They don't say anything. They don't have to.`,
        ), BACK, bondUp(1, 'party'), eggMove(), mark('swap-day'), trust(-1))],
      }),
    ]),
];

const NE40: Json[] = [
  ne(40, 'rival-asks-you-to-lose', 'The Rival Asks You to Lose', GROUP.rival, {
    id: 'rq-asks-you-to-lose',
    place: { earliest: 'A6', home: 17, window: [16, 18], sits: 'must-see', attaches: 'before', level: 'A+2', note: 'Trust 3 or more. Only drawn in a stage that has a Circuit or League round: one node to think on before the match at 18 or 19.' },
    requires: [RIVAL, trustIs(3)], tags: ['Rival', 'Relationship', 'Story'], rarity: 'rare', tint: '#201820', effect: 'glint',
  },
  P(
    `The tunnel under the stands is cold and echoing. The crowd is a far-off roar. {rival} is waiting by the gate before your match, back to the wall. They don't have their usual face on.`,
    L(`{rival}: "If I lose this, my sponsor drops me. I go home. That's it."`, `A breath. They look at the floor, then at you.`, `{rival}: "I'm not asking. ...I'm asking."`),
  ), [
    ch(`"I'll fight you properly."`, fight(P(
      `You hold their eyes and say it plainly. Something in {rival}'s face breaks, and then sets again, harder and cleaner than before.`,
      `{rival}: "...Good. Then don't you dare go easy."`,
      `The gate opens. The roar comes down the tunnel like weather.`,
    ), rivalFight(6, 2, [flag('rival-honest-won'), mark('sponsor-dropped')], []), trust(2), flag('rival-honest-match'))),
    ch(`"I'll throw it."`, out(P(
      `You walk out into the light and lose. You do it carefully, the way you'd do anything you were ashamed of. The crowd doesn't notice. The round is gone.`,
      `{rival} notices. They stand in the middle of the field afterwards with their sponsor clapping them on the back, and they cannot look at you. Not once.`,
    ), flag('rival-thrown'), rivalLead(1, { trust: -2 }))),
    ch(`"Let's tell the sponsor to watch a real match."`, fight(P(
      `You find the sponsor in her box, a sharp woman with a clipboard, and tell her what you want. She raises an eyebrow, and sits forward.`,
      `Then the two of you fight flat out, everything you have, in front of her and the whole roaring stand.`,
    ), rivalFight(6, 2, [], []), trust(3), flag('rival-real-match'))),
  ]),
  after(40, 'rq-dont-you-dare', 'Don\'t You Dare', GROUP.rival, [RIVAL, flagIs('rival-thrown'), LEAGUE()], { minStage: 7, tint: '#201820', effect: 'glint' },
    P(`The last battle of the run is close. {rival} catches you in the corridor and grabs your sleeve, hard.`, `{rival}: "Don't you dare do that again."`, `They don't say anything else. They don't have to.`), [
      ch(`"I won't."`, out(`{rival} lets go of your sleeve, one finger at a time. "Good," they say, and walk off, and don't look back.`)),
    ]),
  after(40, 'rq-hand-sewn-jersey', 'A Hand-Sewn Jersey', GROUP.rival, [RIVAL, flagIs('rival-honest-won'), age('rival-honest-won', 2)], { minStage: 8, tint: '#201820', effect: 'glint' },
    P(
      `{rival} is back. They come up the road toward you in a jersey nobody bought them: hand-sewn, a little crooked at the seams, no logo anywhere on it.`,
      `They look lighter. They look like someone who lost something and found out they didn't need it.`,
      `{rival}: "My mum made it. Don't laugh. ...I'm better now. You'll see."`,
    ), [
      ch(`"It suits you."`, out(`{rival} pretends not to be pleased, and fails completely.`)),
    ]),
];

// =====================================================================================================================
// CATEGORY 9. FUTURE
// =====================================================================================================================

const NE41: Json[] = [
  ne(41, 'museum-of-you', 'The Museum of You', GROUP.future, {
    place: { earliest: 'A25', home: 9, window: [6, 12], sits: 'optional', attaches: 'town', note: 'At the Town node; else step 9. Once per save, built once per run.' },
    tags: ['Story', 'Mystery'], rarity: 'rare', tint: '#24202c', effect: 'sparkle',
  },
  P(
    `A small museum where yesterday there was an empty lot. Over its door, a banner: THE {player} EXHIBIT. 100 YEARS ON.`,
    `It hasn't happened yet. None of it has happened yet. The door is open anyway, and there's a smell of floor polish and old paper.`,
    `Curator, a woman in odd clothes, Seraphine: "You're early. That's all right; so is the building."`,
    `Inside, glass cases. Your hat. Your first Poké Ball, scuffed exactly where yours is scuffed. A small card in careful handwriting: "Lost, in a region not yet walked."`,
  ), [
    ch(`Read the cards.`, out(P(
      `You go case by case. Every card is a real thing you did on this road, and every one is written kindly. More kindly than you would have written it.`,
      L(`"{lead}, who stayed in front." "{starter}, the first of them."`, `"Kindnesses done on the road: {flag:kind-total}." "Alphas calmed, not beaten: {flag:calmed-alpha}."`),
      `Seraphine: "We had to guess at some. We guessed generously." She tears you a ticket stub on your way out.`,
    ), flag('future-museum-read'), flag('museum-stub'))),
    ch(`Ask what's in the last case.`, out(P(
      `The last case stands by the far door, lit like all the others. It is empty. The card beneath it is blank.`,
      L(`Seraphine: "We're waiting to see."`, `She glances, just once, toward the far door and the road beyond it, as if she knows exactly where it goes.`),
      L(`Seraphine: "The last room is about {finalRegion}. That's all I'll say. Go gently there."`, `She tears you a ticket stub on your way out.`),
    ), flag('museum-last-case'), flag('museum-stub'))),
    ch(`Leave before I see too much.`, out(P(
      `You back out of the door before your eyes can land on anything else. Seraphine doesn't stop you.`,
      `Seraphine: "Sensible." She tears a ticket from a roll and tucks the stub into your pocket. "For when you're ready."`,
    ), flag('museum-stub'))),
  ]),
  after(41, 'ne41-the-last-card', 'The Last Card', GROUP.future, [flagIs('museum-stub'), LEAGUE()], { minStage: 26, tint: '#24202c', effect: 'sparkle' },
    P(`Near the end of everything, you find the museum ticket stub in your pocket. You haven't thought about it in a long time.`, `On the back, in handwriting that wasn't there before, someone has written the last case's card. It is about this. About now. About you, getting here.`), [
      ch(`Keep it.`, out(`You don't read it twice. You don't need to.`)),
    ]),
];

const NE42: Json[] = [
  ne(42, 'your-pokemon-old', 'Your Pokémon, Old', GROUP.future, {
    place: { earliest: 'A4', home: 13, window: [9, 17], sits: 'optional', attaches: 'rest' },
    tags: ['Pokémon', 'Story'], tint: '#141a24', effect: 'none',
  },
  P(
    `Something wakes you in the night: {lead}, nosing at your hand, quiet and urgent.`,
    `At the very edge of the firelight sits another one. The same kind as {lead}, exactly. But grey at the muzzle, thin in the shoulders, slow in the way it settles. Watching.`,
    `The old one looks at the young one for a long time. The young one sniffs the air, and then, without being told, sits down beside you.`,
    `The old one looks at you. And its tail moves.`,
  ), [
    ch(`Say hello.`, out(P(
      `You say hello, softly, the way you'd say it to {lead}. The old one gets up, stiff in every joint, and comes round the fire to you.`,
      `It leans its whole weight against your leg. Exactly the way {lead} does. Exactly. {lead} watches, then leans on your other leg, and you sit propped between them until the fire is ash.`,
    ), bondUp(2, 'lead'))),
    ch(`Ask if it was a good life.`, out(P(
      `You ask it, very quietly. It can't answer, of course. It only looks at you with old, clouded eyes.`,
      `Then it lies down where it is, and closes its eyes, and lets out a long breath. The most contented sound you have ever heard.`,
    ), flag('future-good-life'))),
    ch(`Say nothing.`, out(P(
      `You don't say anything. Nobody does. The three of you sit, the old one, the young one and you, while the stars turn over.`,
      `At first light you blink, and the place at the edge of the firelight is empty. Only a flattened patch of grass. {lead} sniffs at it for a long time.`,
    ), bondUp(1, 'lead'))),
  ], [
    variant('sits-far-off', [bondIs(2, 'lead', true)], { notice: `The old one sits farther off than it wants to, you think. It looks at the young one, not at you, as if it's the young one it came all this way to see.` }),
  ]),
  after(42, 'ne42-sleeps-closer', 'Closer', GROUP.future, [age('ne42-your-pokemon-old-done')], { minStage: 5, stop: 'rest', tint: '#141a24' },
    P(`Camp again. You lie down, and {lead} lies down, and in the night you wake to find it has crept right up against your back, the way it never used to.`, `It stays there till morning. It stays there every night after.`), [
      ch(`Let it stay.`, out(`You fall asleep to the sound of its breathing.`)),
    ]),
];

const toldText = (line: string): string => P(
  `You tell them: ${line}`,
  `They say it back to you, under their breath, twice, to be sure they have it. Then they write it on the inside of their new hat, in pen, and put the hat back on.`,
);

const NE43: Json[] = [
  ne(43, 'kid-from-the-next-run', 'The Kid From the Next Run', GROUP.future, {
    place: { earliest: 'A6', home: 3, window: [1, 5], sits: 'optional', attaches: 'after', note: 'At the very start of a stage: the kid stands where the player once stood. Once per save, built once per run.' },
    tags: ['Story'], cast: ['boss.npc_youngster'], tint: '#1c2830', effect: 'none',
  },
  P(
    `A child is standing at the start of the road, right where you stood once. A brand-new hat, still with the shop crease in it. At their heels, a starter. Not the one you chose this run. One of the others.`,
    L(`The child: "Are you them? The one before? The professor said someone went this way."`, `They look past you, up the long road, all the way to where it bends out of sight.`, `The child: "What's it like, further on?"`),
  ), [
    ch(`"It's hard. Go anyway."`, out(P(
      `You don't dress it up. They listen to every word, chin up, the starter pressed against their ankle.`,
      `When you finish, they nod, once, very seriously. Then they straighten their new hat and step out onto the road.`,
    ), flag('future-kid-brave'))),
    ch(`Tell them one true thing.`, out(`You think about what's true. There's a lot of it. You try to choose the one they'll need.`, room('ne43-one-true-thing'))),
    ch(`Give them something.`, out(P(
      `You dig in your bag and press something into their hands. They hold it like treasure, because it is.`,
      `"I'll keep it forever," they say, and run off up the road before you can tell them that's the whole point of giving it.`,
    ), loseAny(), flag('future-kid-gift'))),
  ]),
  // "A list built from this run's events": each line needs the thing it is about to have happened this run.
  step(43, 'ne43-one-true-thing', 'One True Thing', GROUP.future, { cast: ['boss.npc_youngster'], tint: '#1c2830' },
    P(`The child waits, very still, the way you'd wait for a Pokémon to decide whether to trust you.`), [
      ch(`"Some Alphas only want to be heard."`, out(toldText(`some Alphas only want to be heard.`), flag('future-kid-told-alpha')), { requires: [flagIs('calmed-alpha')] }),
      ch(`"Stop for strangers. They remember."`, out(toldText(`stop for strangers. They remember.`), flag('future-kid-told-kind')), { requires: [flagIs('kind-helped-stranger')] }),
      ch(`"Your rival is the best thing that will happen to you."`, out(toldText(`your rival is the best thing that will happen to you.`), flag('future-kid-told-rival')), { requires: [RIVAL] }),
      ch(`"Your starter will be braver than you. Let it."`, out(toldText(`your starter will be braver than you. Let it.`), flag('future-kid-told-starter'))),
    ]),
];

const BADGE_LINE = `Then she draws you a chalk badge on a flat stone, her very first, and gives it to you with both hands.`;
const typeText = (t: string): string => P(
  `You point to one of your team. Calliope studies it from every side, very seriously, the way an inspector would.`,
  `Then she uncaps a pen and writes ${t} on the back of her hand, big, in capitals, and checks the spelling with you twice. ${BADGE_LINE}`,
);

const NE44: Json[] = [
  ne(44, 'gym-that-isnt-built-yet', 'The Gym That Isn\'t Built Yet', GROUP.future, {
    place: { earliest: 'A3', home: 19, window: [18, 19], sits: 'optional', attaches: 'after', level: 'A+0, practice', note: 'On the Gym\'s own approach, in an empty lot beside it: the next Gym, not yet built, beside the one that is.' },
    tags: ['Story', 'Combat'], cast: ['boss.npc_picnicker'], pokemon: 'bidoof', tint: '#242818', effect: 'none',
  },
  P(
    `A patch of weeds beside the Gym, with string pegged out in a neat rectangle. In the middle of the rectangle a girl stands very straight, practising a speech to nobody.`,
    L(`The girl, Calliope: "'Welcome, challenger, to the... the...'"`, `She stops. She scowls at her shoes. A Bidoof sits at her feet and scowls with her.`),
    L(`Calliope: "I don't have a type yet."`, `Calliope: "I'm going to be a Leader. Here. When I'm big. What type should it be?"`),
  ), [
    ch(`Name a type: point to one of mine.`, out(typeText('its type'), flag('calliope-badge')), { pick: {} }),
    ch(`"The one you love."`, out(P(
      `She looks down at her feet, at the Bidoof, who looks back up at her with total devotion and a bit of grass in its teeth.`,
      L(`Calliope: "...Normal, then."`, `She says it like it's the easiest thing in the world, and writes NORMAL on her hand.`),
      BADGE_LINE,
    ), flag('future-gym-normal'), flag('calliope-badge'))),
    ch(`"Battle me for practice."`, fight(P(
      `She squeaks, nearly drops her notebook, then sets it down very carefully on the grass, open to a fresh page.`,
      `Calliope: "A proper battle. Like a real Leader. Bidoof, positions!"`,
      `Win or lose, she'll write down every single thing you do. ${BADGE_LINE}`,
    ), trainer('Future Leader Calliope', { team: ['bidoof'], size: 1, friendly: true }), ...kind(1), flag('calliope-badge'))),
  ]),
];

const replyText = (line: string): string => P(
  `You write: ${line}`,
  `You pin it to the tree just under the first note, the two hands side by side. They match. Of course they match.`,
);

const NE45: Json[] = [
  ne(45, 'message-in-your-own-handwriting', 'A Message in Your Own Handwriting', GROUP.future, {
    place: { earliest: 'A3', home: 10, window: [7, 14], sits: 'must-see', attaches: 'before', level: 'A+1 on the left road', note: 'At a fork: the last node before the paths split. The right road and the left road are the two real paths.' },
    tags: ['Story', 'Mystery', 'Combat'], tint: '#20201c', effect: 'none',
  },
  P(
    `A note is pinned to a tree beside the path, at exactly your eye level. You know the handwriting before you've read a word. It's yours.`,
    `The ink is old. The paper is soft from rain and sun. Someone pinned it here a long time ago. Or a long time from now.`,
    `"Don't take the left road after the bridge. I did. — You."`,
    `Past the tree there is a bridge. After the bridge, the road forks.`,
  ), [
    ch(`Take the right road.`, out(P(
      `You take the right road. It's an ordinary road, with ordinary trainers and ordinary weather, and nothing whatsoever happens on it.`,
      `You find you're grateful. Somebody made sure of that.`,
    ))),
    ch(`Take the left road anyway.`, fight(P(
      `You take the left road. Of course you do. The note-writer would have known that about you. They knew it about themselves.`,
      `The road narrows and climbs. At the top waits the hardest fight you've seen in a while. Behind it, something wrapped in oilcloth, waiting for exactly you.`,
    ), trainer('A Trainer on the Left Road', { size: 3, lv: 1, win: [any(...RARE_HELD)] }), flag('future-left-road'))),
    ch(`Write a reply.`, out(`You find a pencil stub in your bag and smooth a scrap of paper flat against the bark.`, room('ne45-the-reply'))),
  ]),
  step(45, 'ne45-the-reply', 'The Reply', GROUP.future, { tint: '#20201c' },
    P(`The pencil hovers. There's room for one line.`), [
      ch(`"I took it anyway. — Also you."`, out(replyText(`"I took it anyway. — Also you."`), flag('future-note-anyway'))),
      ch(`"Thank you."`, out(replyText(`"Thank you."`), flag('future-note-thanks'))),
      ch(`"We made it. — You, later."`, out(replyText(`"We made it. — You, later."`), flag('future-note-made-it'))),
    ]),
];

// =====================================================================================================================
// CATEGORY 10. ANIME-INSPIRED (each names its inspiration only; characters, places and lines are original)
// =====================================================================================================================

const NE46: Json[] = [
  // Inspired by Natsume's Book of Friends.
  ne(46, 'night-clinic-for-spirits', 'The Night Clinic for Spirits', GROUP.anime, {
    place: { earliest: 'A3', home: 12, window: [9, 15], sits: 'side-branch', attaches: 'instead', tags: ['forest', 'eerie', 'night'], note: '"Give back" takes the branch\'s next node, the whole night. The clinic\'s lamp is seen from the main path.' },
    tags: ['Pokémon', 'Story'], pokemon: 'shiftry', tint: '#141a2c', effect: 'none',
  },
  P(
    `A paper lantern sits on a tree stump in the dark, burning low and blue. In front of it, a queue: Ghost-types and Grass-types, one behind the other, patient as stones.`,
    `Each one holds a single leaf, and on each leaf there's a mark. They're waiting in front of nobody.`,
    `A Shiftry at the front of the queue sees you, steps forward, and holds out its leaf. On it is a name, written by a human hand, long, long ago.`,
    L(`An old Noctowl on a branch above, in your head: "A girl took their names to keep them company. She's gone."`, `The Noctowl: "They'd like them back."`),
  ), [
    ch(`Read each name aloud and give it back.`, out(P(
      `You sit on the stump by the lantern and take the first leaf. You read the name aloud. The Shiftry closes its eyes as it hears it, and bows, very low, and goes.`,
      `It takes the whole night. One name, one bow, one leaf, over and over. Your voice goes hoarse. You don't stop.`,
      `The last in the queue is a tiny Ghost-type with no leaf at all. It never had a name to take back. It only wanted to hear the others said out loud.`,
      `At dawn it's still there. It asks, without words, to come with you. The Noctowl drops a Spell Tag at your feet. No Ghost-type in these parts will ambush you again.`,
    ), takeNode(), flag('spirits-named'), ...kind(2), item('spell-tag'), join({ types: ['ghost'] }), { kind: 'quietWild', span: 'region', types: ['ghost'] })),
    ch(`Keep the names.`, out(P(
      `You close your hand round the Shiftry's leaf, and don't give it back. The queue doesn't protest. It only turns, all together, and follows you.`,
      `For a whole stage they trail behind you through the trees at a distance, sadly, holding out their empty hands. Then, one by one, they stop.`,
      `In the morning there's a Spell Tag tied to your bag. Nobody saw who left it.`,
    ), flag('spirits-kept'), item('spell-tag'))),
    ch(`Ask about the girl.`, out(P(
      L(`The Noctowl turns its head all the way round and back, thinking.`, `The Noctowl: "She was lonely. So were they."`, `The Noctowl: "It was a fair trade, then."`),
      `You don't know what to say to that. The Shiftry seems to understand. It presses a Spell Tag into your hand.`,
      `A small Ghost-type from the back of the queue drifts over and settles on your shoulder, as if it has decided something.`,
    ), item('spell-tag'), join({ types: ['ghost'] }))),
  ]),
];

const NE47: Json[] = [
  // Inspired by Kiki's Delivery Service.
  ne(47, 'smallest-delivery-service', 'The Smallest Delivery Service', GROUP.anime, {
    place: { earliest: 'A2', home: 4, window: [2, 7], sits: 'optional', attaches: 'town', note: 'At the Town node; else step 4. The delivery ends at a node four steps on: "Fly with it" follows the parcel across four steps as a shadow over the path.' },
    tags: ['Pokémon', 'Story'], cast: ['boss.npc_picnicker'], pokemon: 'drifloon', tint: '#24283a', effect: 'none',
  },
  P(
    `A Drifloon with a parcel tied under it bumps along the rooftops, badly. It knocks a chimney pot sideways. It apologises to the chimney.`,
    `Underneath it, running along the street with one arm up, a girl is shouting directions.`,
    L(`The girl, Henrietta: "Left! Your other left! It's our first day!"`, `She skids to a stop beside you, out of breath.`, `Henrietta: "It's lost its nerve. It dropped one in the river yesterday. Now it won't fly high."`),
  ), [
    ch(`Fly with it.`, out(P(
      `Your Pokémon lifts off and takes up a place beside the Drifloon, a little below it, where it could catch anything that fell.`,
      `The Drifloon looks down, sees it there, and rises. A foot. Two. Over the rooftops and on, two shapes crossing the sky together toward the edge of town.`,
      `You follow their shadow along the road below. Henrietta runs beside you, waving both arms.`,
    ), bondUp(2, 'picked'), flag('delivery-flew'), later('ne47-delivered', 4)), { pick: { types: ['flying'] } }),
    ch(`Take the parcel myself.`, out(P(
      `You untie the parcel and tuck it under your arm. It isn't heavy. You find the address, knock, hand it over. Done.`,
      `When you look back, the Drifloon is sitting on a chimney with its string trailing, watching you go. It doesn't come down for a long time.`,
    ))),
    ch(`Tell it everyone drops one.`, out(P(
      `You look up at the Drifloon and tell it, loud enough to carry: everybody drops one. Everybody.`,
      L(`Henrietta, at once: "I dropped six."`, `The Drifloon stares at her.`, `Henrietta: "Six! One was a cake!"`),
      `The Drifloon goes up a foot. Just one. But it goes up.`,
    ), ...kind(1))),
  ]),
  step(47, 'ne47-delivered', 'The Parcel Lands', GROUP.anime, { pokemon: 'drifloon', tint: '#24283a' },
    P(`Four roads on, a shadow crosses your path, and then another. The Drifloon comes down out of the sky in a long, slow spiral, with your Pokémon right beside it.`, `The parcel is delivered to a door with a brass knocker. The Drifloon bobs, enormously pleased. Henrietta, arriving at a run, bursts into tears.`), [
      ch(`Wave them off.`, out(`The two of them go back up together, higher this time. Your Pokémon comes down last, and lands beside you very proud of itself.`)),
    ]),
  after(47, 'ne47-three-parcels', 'Three Parcels', GROUP.anime, [age('ne47-smallest-delivery-service-done', 2)], { minStage: 4, pokemon: 'drifloon', tint: '#24283a' },
    P(`A shadow crosses the road. You look up. High above, a Drifloon is flying steady and straight, and under it hang three parcels, neatly tied.`, `It sees you. It dips, once, the way a ship dips its flag. Then it carries on, over the hills.`), [
      ch(`Wave.`, out(`Somewhere behind you, faintly, someone is shouting "Left!" And it is going left.`)),
    ]),
];

const DINER_AGAIN = (n: string): string => P(
  `Midnight, and a narrow doorway with a cloth curtain you know. Six stools. The pot steaming. Master, with his scar, nodding to you ${n}.`,
  `The same three are at the counter. The Officer laughs at something. The clown has his nose back on. The Grunt's uniform is down to a quarter. They're all slightly happier.`,
);

const NE48: Json[] = [
  // Inspired by Midnight Diner.
  ne(48, 'inn-that-feeds-you-what-you-miss', 'The Inn That Feeds You What You Miss', GROUP.anime, {
    place: { earliest: 'A3', home: 16, window: [12, 18], sits: 'optional', attaches: 'rest', tags: ['night'], note: 'The inn only exists at night. In daylight its + node is an ordinary rest, with an empty lot where the inn was.' },
    tags: ['Story'], tint: '#2a1a14', effect: 'none',
  },
  P(
    `A narrow doorway with a cloth curtain, open midnight to dawn. Inside, a counter with six stools, a pot steaming, and a cook with a scar across one eye. There's no menu anywhere.`,
    `The cook, known as Master: "I make what you ask for, if I've got it."`,
    `Along the counter, three strangers eat without looking at each other. A tired Officer. A clown, his red nose off and set beside his bowl. A Grunt in half a uniform, the other half nowhere.`,
  ), [
    ch(`"What my mum made."`, out(P(
      `Master nods as if that's a perfectly normal order, and here it is. He doesn't ask what it was. He cooks a long time.`,
      `He sets down the bowl, and you breathe in, and it's right. It's exactly right. You don't know how. You eat it all, slowly, and then sit with your hands round the empty bowl.`,
      `Your team is fed and rested and dozing on the floor by the time you go.`,
    ), heal(1), flag('diner-home'), flagAt('diner-visited'))),
    ch(`"What my starter likes."`, out(P(
      `Master looks at {starter} for a long moment. Then he fetches a second stool and sets it at the counter.`,
      `{starter} climbs up and eats like a person, elbows and all, very seriously, one careful mouthful at a time. The clown laughs for the first time all night.`,
      `Your whole team is fed by the end of it, and dozing, and warm.`,
    ), heal(1), bondUp(2, 'starter'), flagAt('diner-visited'))),
    ch(`"Whatever he's having." (the Grunt)`, out(P(
      `Master puts a bowl of plain rice in front of you. Nothing else. The Grunt looks at it, then at you, then at his own.`,
      `He talks. Not to you, exactly. To the rice. He joined because his brother did. He wants out. He doesn't know how anybody gets out.`,
      `Master refills both your bowls without being asked, and feeds your team at the back door.`,
    ), heal(1), flag('diner-grunt'), flagAt('diner-visited'))),
  ]),
  after(48, 'ne48-home-mentioned', 'Someone Knows Your Town', GROUP.anime, [flagIs('diner-home'), age('diner-home')], { minStage: 4, tint: '#2a1a14' },
    P(`In the next town, a woman at a market stall hears you speak, and looks up sharply.`, `Market woman: "You're from home! I can hear it. Is the bakery on the corner still there?"`), [
      ch(`Tell her about home.`, out(`You talk about home for far longer than you meant to. She sends you off with an apple, and the taste of it is the taste of somewhere a long way back.`)),
    ]),
  after(48, 'ne48-the-counter-again', 'The Counter Again', GROUP.anime, [flagAgo('diner-visited'), night], { minStage: 5, stop: 'rest', tint: '#2a1a14' },
    DINER_AGAIN('as if you were here last night'), [
      ch(`Sit down.`, out(`Master puts a bowl in front of you without asking. He remembers. Your team curls up by the stove.`, heal(1))),
    ]),
  after(48, 'ne48-the-counter-once-more', 'The Counter, Once More', GROUP.anime, [flagAgo('diner-visited', 2), flagIs('ne48-the-counter-again-done'), night], { minStage: 7, stop: 'rest', tint: '#2a1a14' },
    DINER_AGAIN('like an old regular'), [
      ch(`Sit down.`, out(`Your stool is free. It's always free. Master sets down your bowl, and the clown passes you the salt.`, heal(1))),
    ]),
];

const NE49: Json[] = [
  // Inspired by Castle in the Sky.
  ne(49, 'giants-garden', 'The Giant\'s Garden', GROUP.anime, {
    place: { earliest: 'A5', home: 14, window: [11, 17], sits: 'side-branch', attaches: 'instead', tags: ['high'] },
    tags: ['Pokémon', 'Story'], cast: ['boss.npc_youngster'], pokemon: 'golurk', tint: '#1c2a20', effect: 'none',
  },
  P(
    `Ruins on a hilltop, open to the wind. A Golurk covered in moss is walking away from a wall that is falling down, very, very slowly.`,
    `In its two huge hands it carries a bird's nest. It doesn't hurry. It has done this before. It has done this for a long time.`,
    `Nearby there's a grave, and on the grave there are flowers. Fresh ones.`,
    L(`A boy with a trumpet, Tiberio: "It doesn't guard anything any more."`, `Tiberio: "It just looks after things."`),
  ), [
    ch(`Help it move the nest.`, out(P(
      `You hold out your hands. The Golurk stops, and looks at you a long moment with its round, lit eyes.`,
      `Then it lowers the nest into your hands, as gently as anything has ever been given to you, and turns to the wall to clear the falling stones.`,
      `You stand very still, holding three warm eggs and one cross bird. When the stones are cleared it takes the nest back, and leaves a Light Clay where it was.`,
    ), flag('giant-helped'), item('light-clay'), flagAt('giant-met'))),
    ch(`Ask who's buried there.`, out(P(
      `Tiberio looks at the grave a while before he answers.`,
      L(`Tiberio: "The others like it. All of them. It's the last one."`, `Tiberio: "It put the flowers."`),
      `Before you go, the Golurk sets a lump of Light Clay at your feet, the way it set the flowers.`,
    ), item('light-clay'), flagAt('giant-met'))),
    ch(`Leave it to its work.`, out(P(
      `You step back and leave it to its slow work. It isn't the kind of work you interrupt.`,
      `As you turn to go, a great shadow falls over you. The Golurk is holding out one flower, very carefully, between two enormous fingers. You take it. Wrapped round the stem is a Light Clay.`,
    ), flag('giant-flower'), item('light-clay'), flagAt('giant-met'))),
  ], [
    variant('golett-line', [{ kind: 'partyLine', species: 'golett', bond: 0 }], { notice: `Your own Golett line steps forward without being told. The two of them stand facing each other in the wind for a long time, the old one and the young one.` }),
  ]),
  after(49, 'ne49-trumpet-at-dawn', 'A Trumpet at Dawn', GROUP.anime, [flagThisRegion('giant-met'), { kind: 'period', in: ['morning'] }], { minStage: 6, stop: 'rest', tint: '#1c2a20' },
    P(`Dawn. From far off, from the hill with the ruins on it, a trumpet is playing. Thin and bright and a little out of tune.`, `It's Tiberio. He plays to the morning, and somewhere up there a Golurk lifts its head to listen.`), [
      ch(`Listen till it ends.`, out(`You lie still and listen until the last note goes. Your team is awake and listening too.`)),
    ]),
];

const NE50: Json[] = [
  // Inspired by Assassination Classroom.
  ne(50, 'class-with-one-seat-left', 'The Class With One Seat Left', GROUP.anime, {
    place: { earliest: 'A4', home: 8, window: [5, 11], sits: 'side-branch', attaches: 'instead', tags: ['high', 'forest'], level: 'A+1, a lesson, not a fight' },
    tags: ['Pokémon', 'Story', 'Mystery'], cast: ['boss.npc_lass'], pokemon: 'alakazam', tint: '#2a2418', effect: 'none',
  },
  P(
    `A run-down schoolhouse at the top of a hill, half its windows patched with card. Inside, the worst class in the district sits at scarred desks.`,
    `At the front of the room, an Alakazam is marking homework. It's using six spoons at once, one per exercise book, and it hasn't looked up.`,
    `A student, Sunniva: "They put us up here to forget us. Then it turned up. It won't say why."`,
    L(`The Alakazam, in everyone's head at once: "A guest. Good."`, `The Alakazam: "Today's lesson: beat me. Anyone. Any way."`),
  ), [
    ch(`Take the lesson.`, fight(P(
      `You step up. So does the whole class, all at once, chairs scraping. The Alakazam looks almost pleased.`,
      `It can't be beaten by force. Every blow stops short, held in the air. The only way through is together: a different trick from every corner of the room, until it runs out of answers.`,
      `Win or lose, Sunniva hands you a TwistedSpoon on the way out. "It said you'd earned the spoon either way."`,
    ), { ...wild({ species: ['alakazam'], lv: 1, win: [flag('class-won'), teach('helping-hand', 'lead')] }), friendly: true, rule: { contest: 4 }, lose: [] }, item('twistedspoon'), flagAt('class-met'))),
    ch(`Teach a lesson myself.`, out(P(
      `The Alakazam sets down five of its spoons and gestures to the front of the room. Yours, then.`,
      `You teach them one real thing you learned on this road, the hard way. You don't make it sound easy. Twenty pencils scratch at once.`,
      `When you finish, the Alakazam hands you its sixth spoon, a TwistedSpoon, bent just so. "Good lesson," it says, in everyone's head.`,
    ), ...kind(1), item('twistedspoon'), flagAt('class-met'))),
    ch(`Ask it why it's here.`, out(P(
      `The six spoons stop moving. The whole class goes quiet; nobody has ever dared ask it straight out.`,
      L(`The Alakazam: "Someone taught me once, when nobody would."`, `The Alakazam: "I'm paying it on."`),
      `It goes back to its marking. On your way out, Sunniva runs after you with a TwistedSpoon. "It said to give you this. It said you'd understand."`,
    ), item('twistedspoon'), flagAt('class-met'))),
  ]),
  after(50, 'ne50-the-hill-school-team', 'The Hill School Team', GROUP.anime, [flagAgo('class-met')], { minStage: 6, cast: ['boss.npc_lass'], tint: '#2a2418' },
    P(`A Circuit draw board, and on it a team name you don't recognise: THE HILL SCHOOL. Then you see who's under the banner. Sunniva, and the whole worst class in the district.`, `They're good. They're very good. They're winning, and they're doing it together, calling to each other across the field.`), [
      ch(`Ask them for a match.`, fight(`Sunniva grins. "We were hoping you'd ask. Lesson one: beat you. Anyone. Any way."`, trainer('The Hill School Class', { size: 4, lv: 1, types: ['psychic'], friendly: true }))),
      ch(`Cheer them on.`, out(`You cheer from the rail. Every single one of them looks round to see who's shouting, and waves.`)),
    ]),
];

export const EVENTS: Json[] = [
  ...NE26, ...NE27, ...NE28, ...NE29, ...NE30, ...NE31, ...NE32, ...NE33, ...NE34, ...NE35,
  ...NE36, ...NE37, ...NE38, ...NE39, ...NE40, ...NE41, ...NE42, ...NE43, ...NE44, ...NE45,
  ...NE46, ...NE47, ...NE48, ...NE49, ...NE50,
].map(rivalSlot);
