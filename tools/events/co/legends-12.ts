// Catalog Overhaul Pack, legends: Whole Run Events 2 to 5 (expanded_notes/WHOLE_RUN_EVENTS.md sections 3 to 6), written up from the
// pack's outlines on the same skeleton as Guidance of Giratina (legends-11.ts): THE WEATHER WAR, THE MADE ONE, THE SEVEN DAYS,
// THE WEAPON AND THE FLOWER. The run draws at most one (core/legends/wholeRun.ts, flag `wre-<id>`). Beat 1 at Stage 2, 2-3 in the
// first region, 4-6 a region later, 7-9 the region after, Beat 10 in the last region before the Champion. Threads are run flags.
// Nothing ends a run: fights are friendly or pseudo, and losing the climax gives that story's worst ending. Same-run only.
import { $, br, ch, ev, fight, flag, flagAgo, flagAt, flagIs, forRegion, fr, heal, item, leadIs, out, party, room, trainer, wild, type Json } from '../dsl.ts';
import { gift } from './_legendsKit.ts';

export const CATEGORY = 'legends';

const R = { room: true, rarity: 'epic' as const };
const not = (key: string): Json => flagIs(key, 0, 0);
const moment = (text: string, importance = 90): Json => ({ kind: 'moment', text, importance });
const regionsLeft = (atMost: number): Json => ({ kind: 'regionsLeft', atMost });
const fl = (name: string, o: Json = {}): Json => ({ ...trainer(name, o as never), friendly: true });
const pwild = (species: string[], lv: number, win: Json[], lose: Json[], rule?: Json): Json => ({ ...wild({ species, lv, win }), pseudo: true, lose, ...(rule ? { rule } : {}) });
const card = (title: string, text: string): string => `${title}\n\n${text}`;

/** One story's helpers: its flag prefix `p`, the `wre-<id>` gate and the beat skeleton. */
function story(id: string, p: string) {
  const ON = [flagIs(`wre-${id}`), not(`${p}-done`)];
  return {
    first: [...ON, flagIs(`${p}-beat`, 0, 0)],
    beat: (n: number): Json[] => [...ON, flagIs(`${p}-beat`, n - 1, n - 1), ...(n >= 7 ? [flagAgo(`${p}-b1`, 2)] : n >= 4 ? [flagAgo(`${p}-b1`, 1)] : [])],
    climax: [...ON, flagIs(`${p}-b1`), regionsLeft(0)],
    step: (): Json => flag(`${p}-beat`),
    start: (): Json => flagAt(`${p}-b1`),
    t: (thread: string, n = 1): Json => flag(`${p}-${thread}`, n),
    has: (thread: string, atLeast = 1, atMost = 99): Json => flagIs(`${p}-${thread}`, atLeast, atMost),
    end: (name: string, label: string, ...mods: Json[]): Json[] => [flag(`${p}-done`), flag(`${p}-end-${name}`), ...(mods.length ? [forRegion(label, ...mods)] : [])],
  };
}

// ================================================================ THE WEATHER WAR (Kyogre, Groudon, Rayquaza)
const WW = 'Whole Run: The Weather War';
const w = story('weather', 'ww');
const weather: Json[] = [
  ev('co-wre-ww-1', 'The Harbour Wall', WW, { rarity: 'epic', requires: w.first, cast: ['trainer.aroma_lady'], tint: '#000000', effect: 'rain' },
    card('THE HARBOUR WALL', 'A woman on a harbour wall is measuring the tide with a stick. She has notches cut in it, one for every year.\n\n"Four fingers higher than last year. Four. Nobody listens to a meteorologist until it is raining in their kitchen."'),
    [
      ch('HELP HER MEASURE', out('You hold the stick steady while she reads it. She writes the number in a notebook already full of numbers, and underlines it twice. "Thank you. Now there are two of us who know."', w.start(), w.step(), w.t('trust'), flag('ww-measured'), moment('You helped a meteorologist measure a tide that should not be that high.'))),
      ch('WALK ON', out('You walk on. Behind you, the sea comes over the harbour wall for the first time in living memory, and nobody is measuring it.', w.start(), w.step(), w.t('sea'))),
    ]),
  ev('co-wre-ww-2', 'The Changed Coast', WW, { rarity: 'epic', requires: w.beat(2), cast: ['boss.archie-gen6', 'boss.maxie-gen6'], tint: '#000000', effect: 'rain' },
    card('THE CHANGED COAST', 'Half of this town is in the sea now. The other half is cracked and dry where a river used to run. Archie is helping people carry furniture out of the water. Maxie is a street away, helping people dig a well. Each of them asks you for one small, reasonable favour.'),
    [
      ch('Carry Archie\'s crates to the boats.', out('Archie claps you on the back. "The sea gives room to everyone, mate. Remember that." The tide is a little higher by evening.', w.step(), w.t('sea'), flag('ww-archie')),
        { branches: [br([leadIs('water')], 'Your Water-type swims the crates out two at a time. Archie laughs out loud. "Now that is a partner." The tide is a little higher by evening.', w.step(), w.t('sea', 2), flag('ww-archie'))] }),
      ch('Help Maxie dig his well.', out('Maxie wipes his glasses. "Land is what people stand on. Thank you." The ground is a little drier by evening.', w.step(), w.t('land'), flag('ww-maxie')),
        { branches: [br([leadIs('ground')], 'Your Ground-type finds the water table in three swings. Maxie looks at it for a long time. "Remarkable." The ground is a little drier by evening.', w.step(), w.t('land', 2), flag('ww-maxie'))] }),
      ch('Read the town the meteorologist\'s numbers.', out('You stand on a bench and read them out. Most people walk past. Three stop. One writes them down.', w.step(), w.t('trust'))),
    ]),
  ev('co-wre-ww-3', 'The Dam', WW, { rarity: 'epic', requires: w.beat(3), cast: ['boss.archie-gen6', 'boss.maxie-gen6'], tint: '#000000', effect: 'rain' },
    card('THE DAM', 'A dam above two towns. Open it, and the valley town floods to save the city below. Keep it shut, and the city\'s reservoir fails before the month is out. The lever is in your hand because nobody else would take it.'),
    [
      ch('Open the dam.', out('The valley town fills like a bowl. Everyone got out; you made sure of it. Nobody will live there again.', w.step(), w.t('sea'), moment('You opened the dam. The valley town is under water now.'))),
      ch('Keep it shut.', out('The city goes thirsty. Rationing, then queues, then the first fights over water. The valley town is safe.', w.step(), w.t('land'), moment('You kept the dam shut. The city went thirsty.'))),
      ch('Get both of them into one room.', out('It takes a whole night. Archie and Maxie sit across a table from each other for the first time in years, and argue, and halfway through the argument they both stop, because they have said the same sentence. The dam opens halfway. Nobody is happy. Nobody drowns and nobody goes thirsty.', w.step(), w.t('trust', 2), flag('ww-third'), moment('You got Archie and Maxie into one room, and the dam opened halfway.')),
        { requires: [flagIs('ww-archie'), flagIs('ww-maxie')] }),
    ]),
  ev('co-wre-ww-4', 'The Orbs', WW, { rarity: 'epic', requires: w.beat(4), cast: ['boss.steven-gen6'], tint: '#000000' },
    card('THE ORBS', 'Steven has two stones on a cloth in front of him: one blue, one red, both warm. "They are calling to something. Two somethings. Archie and Maxie each want one, and each of them is half right about what will happen if the other gets theirs."'),
    [
      ch('Take the Blue Orb to Archie.', out('Archie holds it up to the light like a child. The rain does not stop for three days.', w.step(), w.t('sea', 2))),
      ch('Take the Red Orb to Maxie.', out('Maxie does not hold it up. He puts it in his coat and says nothing. The sun does not set properly for three days.', w.step(), w.t('land', 2))),
      ch('Leave them both with Steven.', out('"Thank you," Steven says. "That was the hard one." He wraps them back up.', w.step(), w.t('trust'), flag('ww-steven'))),
    ]),
  ev('co-wre-ww-5', 'Where the Rain Meets the Sun', WW, { rarity: 'epic', requires: w.beat(5), cast: ['boss.archie-gen6', 'boss.maxie-gen6'], tint: '#000000', effect: 'rain' },
    card('WHERE THE RAIN MEETS THE SUN', 'A plain where a storm and a drought have met head on. Rain falls on one side of a line you could step over. On the other, the grass is burning. Aqua and Magma grunts are already fighting across it.'),
    [
      ch('Stop the Aqua side.', fight('You wade into the rain.', fl('Team Aqua', { format: 'doubles', size: 4, team: ['sharpedo', 'crawdaunt', 'mightyena', 'walrein'], lv: 1, win: [w.step(), w.t('land')], lose: [w.step(), w.t('sea')] }))),
      ch('Stop the Magma side.', fight('You walk into the heat.', fl('Team Magma', { format: 'doubles', size: 4, team: ['camerupt', 'torkoal', 'mightyena', 'claydol'], lv: 1, win: [w.step(), w.t('sea')], lose: [w.step(), w.t('land')] }))),
      ch('Stand on the line and stop both.', fight('You stand on the line, rain on one shoulder and sun on the other.', fl('Aqua and Magma', { format: 'doubles', size: 6, team: ['sharpedo', 'camerupt', 'crawdaunt', 'torkoal', 'walrein', 'claydol'], lv: 2, win: [w.step(), w.t('trust', 2), moment('You stood on the line between the rain and the sun, and both sides stopped.')], lose: [w.step()] }))),
    ]),
  ev('co-wre-ww-6', 'The Stolen Numbers', WW, { rarity: 'epic', requires: w.beat(6), cast: ['boss.wallace-gen6'], tint: '#000000' },
    card('THE STOLEN NUMBERS', 'Wallace shows you the morning paper. The meteorologist\'s measurements are on the front page, under Maxie\'s name. Nobody is listening to her now either; they are listening to him.'),
    [
      ch('Stand up for her in public.', out('You and Wallace go on the radio. Half the city believes you. She sends you a note with a single number on it: today\'s tide.', w.step(), w.t('trust', 2))),
      ch('Let it go: at least people are listening.', out('People are listening. To the wrong man, for the wrong reasons, but listening.', w.step(), w.t('land'))),
    ]),
  ev('co-wre-ww-7', 'Two Gifts', WW, { rarity: 'epic', requires: w.beat(7), cast: ['boss.archie-gen6', 'boss.maxie-gen6'], tint: '#000000' },
    card('TWO GIFTS', 'Archie and Maxie each come to you the same evening, separately, with the same offer: a Pokémon raised in the weather they want, and a place in the world they mean to make.'),
    [
      ch('Take Archie\'s Wailmer.', out('"Room for everyone," Archie says again, and means it.', gift('wailmer'), w.step(), w.t('sea', 2))),
      ch('Take Maxie\'s Numel.', out('"Somewhere to stand," Maxie says, and means it.', gift('numel'), w.step(), w.t('land', 2))),
      ch('Refuse both, and look up.', out('You refuse them both. That night you notice that the clouds above the city are moving in a circle, very high up.', w.step(), w.t('sky'))),
    ]),
  ev('co-wre-ww-8', 'The Sky Pillar', WW, { rarity: 'epic', requires: w.beat(8), cast: ['boss.steven-gen6'], pokemon: 'rayquaza', tint: '#000000', effect: 'sparkle' },
    card('THE SKY PILLAR', 'At the top of a tower older than either of them, something long and green is asleep in the wind. Steven, out of breath: "The third one. It stops them. It has always stopped them. It only has to be woken."'),
    [
      ch('Wake it.', out('You shout into the wind. It opens one eye. It does not move yet. But it is awake now.', w.step(), w.t('sky', 2), moment('You woke Rayquaza at the top of the Sky Pillar.'))),
      ch('Let it sleep.', out('You leave it sleeping. Whatever happens next, it will happen without it.', w.step())),
    ]),
  ev('co-wre-ww-9', 'The Last Measurement', WW, { rarity: 'epic', requires: w.beat(9), cast: ['trainer.aroma_lady'], tint: '#100808', effect: 'rain' },
    card('THE LAST MEASUREMENT', 'The meteorologist is on the League steps with her stick. The water is over the first step. "Tomorrow they both wake. I measured it."'),
    [
      ch('Measure it with her.', out('You hold the stick. She reads it, and writes it down, and does not underline it this time. "Two of us still know."', w.step(), w.t('trust'), heal())),
      ch('Rest.', out('You sleep to the sound of rain on one side of the tent and silence on the other.', w.step(), heal())),
    ]),
  ev('co-wre-ww-10', 'Both Wake', WW, { rarity: 'epic', requires: w.climax, pokemon: 'kyogre', tint: '#000000', effect: 'rain' },
    card('BOTH WAKE', 'Out at sea something blue rises, and inland something red climbs out of a crater. The map floods and dries, turn by turn. Your job is to keep both from winning until the sky answers. Or to choose a side, and live in that world.'),
    [
      ch('Keep both from winning.', fight('The arena floods. Then it dries. Then it floods.', pwild(['kyogre', 'groudon'], 4, [room('co-wre-ww-end')], w.end('storm', 'The Long Storm: every weather at once', { kind: 'bossDamageTakenMultiplier', value: 1.1 }), { surviveTurns: 8, weatherCycle: ['rain', 'sun'] }))),
      ch('Stand with the sea.', fight('You turn on the red one.', pwild(['groudon'], 4, [...w.end('drowned', 'The Drowned World', { kind: 'typeDamageMultiplier', type: 'water', value: 1.2 }), moment('The Weather War: the Drowned World. The Champion fights in the rain.', 100)], w.end('storm', 'The Long Storm: every weather at once', { kind: 'bossDamageTakenMultiplier', value: 1.1 })))),
      ch('Stand with the land.', fight('You turn on the blue one.', pwild(['kyogre'], 4, [...w.end('dry', 'The Dry World', { kind: 'typeDamageMultiplier', type: 'ground', value: 1.2 }), moment('The Weather War: the Dry World. The Champion fights in the sun.', 100)], w.end('storm', 'The Long Storm: every weather at once', { kind: 'bossDamageTakenMultiplier', value: 1.1 })))),
    ]),
  ev('co-wre-ww-end', 'The Weather War: The Sky Answers', WW, { ...R, pokemon: 'rayquaza', tint: '#202040', effect: 'sparkle' },
    'You held. The rain and the sun are both still there, and so are you.',
    [
      ch('Look up.', out('The sky answers. Something long and green comes down through the clouds, and both of them stop, and listen, and go back to sleep. Later, Archie and Maxie are seen building a sea wall together, arguing the whole time.', ...w.end('balance', 'Balance: the weather holds', { kind: 'healingMultiplier', value: 1.15 }), moment('The Weather War: Balance. Both of them sleep.', 100)), { requires: [w.has('sky', 2), w.has('trust', 2)] }),
      ch('Hold on.', out('Nobody comes. Neither of them sleeps. The Champion battle will be fought in every weather at once.', ...w.end('storm', 'The Long Storm: every weather at once', { kind: 'bossDamageTakenMultiplier', value: 1.1 }), moment('The Weather War: the Long Storm.', 100))),
    ]),
];

// ================================================================ THE MADE ONE (Mewtwo)
const MO = 'Whole Run: The Made One';
const m = story('made', 'mo');
const made: Json[] = [
  ev('co-wre-mo-1', 'What Are You For?', MO, { rarity: 'epic', requires: m.first, pokemon: 'mewtwo', tint: '#000000', effect: 'flicker' },
    card('WHAT ARE YOU FOR?', 'A Pokémon you do not recognise is sitting by the road in a torn cloak, looking at its own hands. It asks one question, directly into your head.\n\nWhat are you for?'),
    [
      ch('ANSWER', out('You try. It listens to all of it, very still.', m.start(), m.step(), room('co-wre-mo-1-answer'))),
      ch('SAY NOTHING', out('It waits. Then it gets up and walks away along the road, and you realise it is going the same way you are. It will decide what you are for by watching.', m.start(), m.step(), m.t('watch'))),
    ]),
  ev('co-wre-mo-1-answer', 'What Are You For? (Answer)', MO, { ...R, pokemon: 'mewtwo', tint: '#000000' }, 'What are you for?',
    [
      ch('"For them." (your Pokémon)', out('It looks at your party, one by one, as if counting them.', m.t('kindness'), m.t('purpose'))),
      ch('"For winning."', out('It nods slowly, as if that were a thing it already knew how to do.', m.t('tools'))),
      ch('"I don\'t know yet."', out('Something in its face changes. It is the first answer that has sounded like its own.', m.t('purpose', 2))),
    ]),
  ev('co-wre-mo-2', 'The Healed Town', MO, { rarity: 'epic', requires: m.beat(2), pokemon: 'mewtwo', tint: '#000000' },
    card('THE HEALED TOWN', 'Every Pokémon in this town woke up healed this morning, even the old ones, even the ones that were not sick. Nobody saw who did it. You know who did it. It is watching you from a roof, to see what you do when one of yours goes down.\n\nOne of yours goes down, in a training spar, badly.'),
    [
      ch('Carry it to the Pokémon Center yourself.', out('You carry it the whole way. On the roof, something tilts its head.', m.step(), m.t('kindness'), heal())),
      ch('Swap it out and keep going.', out('You swap it out. On the roof, something learns that this is what you do.', m.step(), m.t('tools'))),
    ]),
  ev('co-wre-mo-3', 'Before It Understands', MO, { rarity: 'epic', requires: m.beat(3), cast: ['trainer.psychic_m'], pokemon: 'mewtwo', tint: '#000000', effect: 'flicker' },
    card('BEFORE IT UNDERSTANDS', 'A geneticist who has stopped sleeping finds you. He has not shaved in weeks.\n\n"Please. Help me bring it back. Before it understands what was done to it."\n\nIt is standing right there. It has heard every word.'),
    [
      ch('Help him.', out('It lets itself be led a little way. Then it stops, and looks at you, and is gone.', m.step(), m.t('leash', 2))),
      ch('Refuse him.', out('The geneticist sits down in the road. The Made One walks a little closer to you than before.', m.step(), m.t('purpose'))),
      ch('Ask it what it wants.', out('Nobody has asked it that. It does not answer. But it stays to think about it, which is an answer.', m.step(), m.t('purpose', 2), moment('You asked the Made One what it wanted. Nobody had before.'))),
    ]),
  ev('co-wre-mo-4', 'The Mansion Notes', MO, { rarity: 'epic', requires: m.beat(4), cast: ['boss.blaine'], tint: '#000000', effect: 'fire' },
    card('THE MANSION NOTES', 'Blaine has the old notes from the burned mansion in a tin box. "I was there. I am not proud of it. These say what it is, and what it was made from, and how to make it obey."'),
    [
      ch('Burn them.', out('Blaine strikes the match himself. "Good," he says, and his voice cracks.', m.step(), m.t('leash', -1), m.t('kindness'))),
      ch('Keep them.', out('You keep them. They are heavier than paper should be.', m.step(), m.t('leash'))),
      ch('Give them to it.', out('It reads all of them in a second, standing very still, and hands them back. It knows now.', m.step(), m.t('purpose', 2))),
    ]),
  ev('co-wre-mo-5', 'The Collection', MO, { rarity: 'epic', requires: m.beat(5), cast: ['boss.giovanni-rocketboss'], pokemon: 'mewtwo', tint: '#000000', effect: 'shake' },
    card('THE COLLECTION', 'Giovanni\'s people come to collect it, with nets that hum and a truck with no windows. It has backed against a wall. It could flatten all of them, and it is looking at you to see if it should.'),
    [
      ch('Stand in front of it.', fight('You stand in front of it.', fl('Team Rocket', { boss: 'giovanni', format: 'doubles', size: 4, lv: 2, win: [m.step(), m.t('leash', -1), m.t('kindness'), moment('You stood between the Made One and Team Rocket.')], lose: [m.step(), m.t('leash')] }))),
      ch('Nod to it.', out('It flattens all of them. It is very quick, and very quiet, and afterwards it looks at you to see if that was right.', m.step(), m.t('tools'), m.t('leash', -1))),
    ]),
  ev('co-wre-mo-6', 'Who Called Them', MO, { rarity: 'epic', requires: m.beat(6), cast: ['trainer.psychic_m'], tint: '#000000' },
    card('WHO CALLED THEM', 'It was the geneticist who called Giovanni. He tells you himself, crying. He wanted it safe. He wanted it back. He did not know which.'),
    [
      ch('Forgive him.', out('He did not expect that. Neither did it. It watches you put a hand on his shoulder.', m.step(), m.t('kindness'))),
      ch('Tell it the truth about him.', out('It goes and stands in front of the geneticist for a long time. Then it leaves him alone, which is a choice.', m.step(), m.t('purpose'))),
    ]),
  ev('co-wre-mo-7', 'A Fair Price', MO, { rarity: 'epic', requires: m.beat(7), cast: ['boss.giovanni-rocketboss'], tint: '#000000' },
    card('A FAIR PRICE', 'Giovanni comes himself, with a case. "You have been taking care of my property. I will pay you for your trouble. Generously."'),
    [
      ch('Take the money.', out('₽20,000. He does not count it out; he knows you will. Somewhere, something hears the case close.', $(20000), m.step(), m.t('leash', 3), m.t('tools'), flag('mo-sold'))),
      ch('"It isn\'t yours."', out('"Everything is mine eventually," Giovanni says, and leaves the case on the ground for you to think about. You leave it there.', m.step(), m.t('purpose'))),
    ]),
  ev('co-wre-mo-8', 'The Child', MO, { rarity: 'epic', requires: m.beat(8), cast: ['trainer.fairy_tale_girl'], tint: '#000000', effect: 'flicker' },
    card('THE CHILD', 'A child who is not quite there walks beside you for an afternoon. She flickers at the edges. She is a recording the geneticist made of his daughter, and the Made One was made to bring her back, and could not, and does not know that yet.'),
    [
      ch('Tell it.', out('It already half knew. It sits down where the child was standing and does not get up until dark.', m.step(), m.t('purpose'))),
      ch('Spare it.', out('You say nothing. It is kinder today. It will not be kinder tomorrow.', m.step(), m.t('kindness'))),
    ]),
  ev('co-wre-mo-9', 'By the Fire', MO, { rarity: 'epic', requires: m.beat(9), pokemon: 'mewtwo', tint: '#100808', effect: 'fire' },
    card('BY THE FIRE', 'The night before the League it comes and sits at your fire for the first time. Your Pokémon make room.'),
    [
      ch('Ask it: what are you for?', out('It thinks about it for a long time. It does not answer. It does not need to; it is sitting at your fire.', m.step(), m.t('purpose'), heal())),
      ch('Just sit.', out('Nobody says anything. Your Pokémon fall asleep against it, one by one.', m.step(), m.t('kindness'), heal())),
    ]),
  ev('co-wre-mo-10', 'The Switch', MO, { rarity: 'epic', requires: m.climax, cast: ['boss.giovanni-rocketboss'], pokemon: 'mewtwo', tint: '#000000', effect: 'flicker' },
    card('THE SWITCH', 'Its makers arrive at the League with a way to switch it off: a small grey box, and a man who knows how to use it. It looks at you, and asks the first question again.\n\nWhat are you for?'),
    [
      ch('Stand between it and them.', fight('You stand between it and its makers.', fl('Its Makers', { boss: 'giovanni', format: 'doubles', size: 6, lv: 3, win: [room('co-wre-mo-end')], lose: [...m.end('obeys', 'It Obeys: the Champion has a new Pokémon', { kind: 'bossDamageTakenMultiplier', value: 1.1 }), moment('The Made One: It Obeys. It was taken back.', 100)] })), { requires: [m.has('tools', 0, 1)] }),
      ch('Face it.', fight('It has watched you use your Pokémon as tools all run. It learned. It is right to be angry.', pwild(['mewtwo'], 6, [...m.end('against', 'It Decides Against Us'), moment('The Made One decided against you. You beat it, and it was still right.', 100)], [...m.end('against', 'It Decides Against Us', { kind: 'bossDamageTakenMultiplier', value: 1.1 }), moment('The Made One decided against you.', 100)])), { requires: [m.has('tools', 2)] }),
    ]),
  ev('co-wre-mo-end', 'The Made One: Its Answer', MO, { ...R, pokemon: 'mewtwo', tint: '#202030' },
    'Its makers are gone. The grey box is broken on the steps. It is waiting to see what you will do, and what it will do.',
    [
      ch('Let it choose.', out('It chooses. It leaves, free, and at the top of the steps it turns and nods once.', ...m.end('chooses', 'It Chooses', { kind: 'bossDamageMultiplier', value: 1.1 }), moment('The Made One: It Chooses. It nodded once and left.', 100))),
      ch('Ask it to stay.', out('It stays. It never asks the question again.', gift('mewtwo'), ...m.end('stays', 'It Stays'), moment('The Made One: It Stays.', 100)), { requires: [m.has('kindness', 3), party(1)] }),
      ch('Let them have it.', out('You step aside. It looks at you once, and goes with them. The Champion has a new Pokémon.', ...m.end('obeys', 'It Obeys: the Champion has a new Pokémon', { kind: 'bossDamageTakenMultiplier', value: 1.1 }), moment('The Made One: It Obeys.', 100)), { requires: [m.has('leash', 4)] }),
    ]),
];

// ================================================================ THE SEVEN DAYS (Jirachi)
const SD = 'Whole Run: The Seven Days';
const s = story('seven', 'sd');
/** A wish offered: take it (a real effect, paid for by someone else) or let it pass. */
const wish = (n: number, title: string, text: string, take: string, effect: Json[], pass: string, who: string): Json =>
  ev(`co-wre-sd-${n}`, title, SD, { rarity: 'epic', requires: s.beat(n), pokemon: 'jirachi', tint: '#000010', effect: 'sparkle',
    remembers: [{ id: 'cost', when: [s.has('wishes', 2)], notice: 'You think, for a moment, about the last person whose wish did not come true so that yours could.' }] },
    card(title.toUpperCase(), text),
    [
      ch('Make the wish.', out(take, ...effect, s.step(), s.t('wishes'), s.t('cost'), flag(`sd-paid-${who}`))),
      ch('Let it pass.', out(pass, s.step(), s.t('kept'))),
    ]);
const seven: Json[] = [
  ev('co-wre-sd-1', 'The Paper Tag', SD, { rarity: 'epic', requires: s.first, cast: ['trainer.fairy_tale_girl'], pokemon: 'jirachi', tint: '#000010', effect: 'sparkle' },
    card('THE PAPER TAG', 'A comet is overhead. A child hands you a paper tag on a string. "You write a wish on it. You only get one. It is awake for seven days."'),
    [
      ch('WRITE ONE', out('You write it and tie it to the festival tree. In the morning your Pokémon are all a little stronger. In the next town, a girl is crying because the race she trained all year for was won by someone else.', { kind: 'levels', amount: 2, who: 'party' }, s.start(), s.step(), s.t('wishes'), s.t('cost'), flag('sd-paid-runner'))),
      ch('KEEP IT BLANK', out('You fold the blank tag and keep it in your pocket. The child looks at you as if you have done something very strange, and very good.', s.start(), s.step(), flag('sd-blank'))),
    ]),
  wish(2, 'The Second Day', 'The second day. A woman at a Pokémon Center tells you, without being asked, that she has been praying for a Revive for her Lillipup for a week. Then the comet passes over, and a Revive is in your bag, not hers.', 'You keep it. Later you see her leave the Center alone.', [item('max-revive')], 'You give her the Revive you found. She cannot speak.', 'lillipup'),
  ev('co-wre-sd-3', 'Two Wishes', SD, { rarity: 'epic', requires: s.beat(3), pokemon: 'jirachi', tint: '#000010', effect: 'sparkle' },
    card('TWO WISHES', 'Two people have wished for opposite things. A fisherman wished for rain for his river. A farmer, a valley away, wished for a dry harvest. You are holding the tag that decides it, because somehow it ended up in your pocket.'),
    [
      ch('Give it to the fisherman.', out('It rains. The river fills. The farmer\'s harvest rots in the field.', s.step(), s.t('cost'), flag('sd-paid-farmer'))),
      ch('Give it to the farmer.', out('It stays dry. The harvest comes in. The river is a line of stones.', s.step(), s.t('cost'), flag('sd-paid-fisherman'))),
      ch('Tear it in half.', out('You tear the tag. It rains a little, and dries a little, and neither of them gets what they wished for, and neither of them loses everything.', s.step(), s.t('kept'))),
    ]),
  ev('co-wre-sd-4', 'The Astronomer', SD, { rarity: 'epic', requires: s.beat(4), cast: ['trainer.hiker'], tint: '#000010', effect: 'sparkle' },
    card('THE ASTRONOMER', 'A travelling astronomer has a telescope set up on a hill. "Seven days. It wakes for seven days every thousand years and grants what it is asked. But a wish is not made of nothing. It is made of someone else\'s."'),
    [
      ch('"Whose?"', out('"Whoever was next in line." He shows you the comet\'s tail through the lens. It is made of paper tags.', s.step())),
      ch('"Then I won\'t wish."', out('"Most people say that," he says kindly. "On the first day."', s.step(), s.t('kept'))),
    ]),
  ev('co-wre-sd-5', 'The Festival', SD, { rarity: 'epic', requires: s.beat(5), pokemon: 'jirachi', tint: '#000010', effect: 'confetti' },
    card('THE FESTIVAL', 'The fifth day is a festival, and Jirachi comes down to it. It wants to play. It is very small and very strong and has not played with anyone for a thousand years.'),
    [
      ch('Play with it.', fight('It giggles the whole time.', pwild(['jirachi'], 3, [s.step(), fr(10), moment('Jirachi played with your party at the festival.')], [s.step()], { noItems: true }))),
      ch('Watch the lanterns with it.', out('It sits on your shoulder and watches the lanterns go up. Every lantern has a wish on it. It reads all of them.', s.step(), heal())),
    ]),
  wish(6, 'Your Rival\'s Wish', 'Your rival comes to you with a confession: they found a tag with your handwriting on it and made a wish with it. Now they want you to have one back. The comet is right overhead.', 'You wish. The next battle against your rival is easier than it should be, and they look at you strangely afterwards.', [{ kind: 'tempEffect', label: 'A wish on your rival', effects: [{ kind: 'rivalLevelOffset', value: -5 }], until: 'region' }], 'You tell them to keep it. They look relieved, and then ashamed of being relieved.', 'rival'),
  wish(7, 'The Skipped Road', 'The seventh-to-last night. A tag on the road reads, in your own writing, "I wish I were further along." You do not remember writing it.', 'The road folds. You are further along. Somewhere behind you, a family\'s wagon breaks down on that same road, and no one comes.', [{ kind: 'skipAhead' }], 'You leave the tag on the road. Someone else will find it.', 'wagon'),
  ev('co-wre-sd-8', 'The Ones Who Paid', SD, { rarity: 'epic', requires: s.beat(8), tint: '#000010', effect: 'sparkle',
    remembers: [{ id: 'none', when: [s.has('cost', 0, 0)], intro: card('THE ONES WHO PAID', 'You walk back along the road you came by. Everyone you met is still there. Nobody paid for anything of yours.') }] },
    card('THE ONES WHO PAID', 'You walk back along the road you came by, and you see them: the girl who lost the race, the woman with the Lillipup, the ones whose wishes did not come true so that yours could. They do not know it was you. You know.'),
    [
      ch('Tell them.', out('Some of them are angry. One of them thanks you for telling them. That one is worse.', s.step(), s.t('kept'))),
      ch('Walk on.', out('You walk on.', s.step())),
    ]),
  ev('co-wre-sd-9', 'The Sixth Night', SD, { rarity: 'epic', requires: s.beat(9), pokemon: 'jirachi', tint: '#100808', effect: 'fire' },
    card('THE SIXTH NIGHT', 'Jirachi is asleep in your hat. Tomorrow is the seventh day. It is already yawning.'),
    [ch('Let it sleep.', out('You let it sleep. Your party sleeps around you like a wall.', s.step(), heal()))]),
  ev('co-wre-sd-10', 'The Seventh Night', SD, { rarity: 'epic', requires: s.climax, pokemon: 'jirachi', tint: '#000010', effect: 'sparkle' },
    card('THE SEVENTH NIGHT', 'There is one wish left in the world, and everybody you met is on the hill. Jirachi floats in the middle of them, very tired, and asks you who should have it.'),
    [
      ch('Hold out your blank tag.', out('Jirachi smiles. The only wish that costs nobody anything is one nobody else wanted: it gives you its own. Your whole party is made whole, and stronger, and nobody on the hill is any poorer.', heal(), { kind: 'levels', amount: 3, who: 'party' }, ...s.end('blank', 'The Blank Tag: a wish that cost nobody', { kind: 'damageMultiplier', value: 1.1 }), moment('The Seven Days: the Blank Tag. A wish that cost nobody anything.', 100)), { requires: [flagIs('sd-blank'), s.has('wishes', 0, 0)] }),
      ch('Give it to someone else.', out('You point at the girl who lost the race. She does not know why. Her wish comes true, and you will find out a region from now what it was.', ...s.end('given', 'Given Away', { kind: 'healingMultiplier', value: 1.15 }), moment('The Seven Days: Given Away.', 100))),
      ch('Take it. Take all of it.', out('You take it. You have had everything you asked for. When you look round, the hill is empty.', item('rare-candy', 5), ...s.end('seven', 'Seven for One', { kind: 'damageMultiplier', value: 1.15 }, { kind: 'friendshipMultiplier', value: 0.7 }), moment('The Seven Days: Seven for One. The hill was empty.', 100)), { requires: [s.has('wishes', 3)] }),
      ch('Ask it to remember you.', out('It is not a wish. It does not cost anyone anything. Jirachi yawns, and nods, and goes to sleep for a thousand years, and remembers you.', heal(), ...s.end('goodnight', 'Goodnight'), moment('The Seven Days: Goodnight. Jirachi remembers you.', 100))),
    ]),
];

// ================================================================ THE WEAPON AND THE FLOWER (AZ, Lysandre, Xerneas, Yveltal)
const WF = 'Whole Run: The Weapon and the Flower';
const f = story('flower', 'wf');
const flower: Json[] = [
  ev('co-wre-wf-1', 'The Man Under the Tree', WF, { rarity: 'epic', requires: f.first, cast: ['boss.az'], tint: '#000000', effect: 'fog' },
    card('THE MAN UNDER THE TREE', 'A giant of a man is sitting under a tree far too small for him. He asks if you have seen a Floette with a red flower. He has been asking for three thousand years.'),
    [
      ch('SIT WITH HIM', out('You sit. He does not say anything else for an hour. Then he tells you her name. Then he gets up and walks the same road as you, a little behind.', f.start(), f.step(), f.t('grief'), flag('wf-sat'), moment('You sat with a very tall, very old man under a small tree.'))),
      ch('KEEP WALKING', out('You keep walking. A while later you notice him on the road behind you, a little behind, always.', f.start(), f.step())),
    ]),
  ev('co-wre-wf-2', 'The Garden', WF, { rarity: 'epic', requires: f.beat(2), cast: ['boss.lysandre'], tint: '#000000', effect: 'sparkle' },
    card('THE GARDEN', 'Every flower in this valley bloomed overnight, all at once, around a black stone that hums. A man with a mane of red hair is buying the whole valley. Lysandre.\n\n"Look at it. Perfect, for one morning. It cannot be shared; the moment it is shared, it is trampled."'),
    [
      ch('"He has a point."', out('He smiles at you as if you were a student who had got the answer right.', f.step(), f.t('beauty'))),
      ch('"Then don\'t share it. Leave it alone."', out('"You understand nothing," he says, and walks away, and you think he is not sure.', f.step())),
      ch('Help the old man search the flowers.', out('There is no Floette with a red flower. But there is a red petal, pressed into the black stone, three thousand years old.', f.step(), f.t('flower'))),
    ]),
  ev('co-wre-wf-3', 'What the Machine Eats', WF, { rarity: 'epic', requires: f.beat(3), cast: ['boss.az'], tint: '#000000', effect: 'flicker' },
    card('WHAT THE MACHINE EATS', 'One of your Pokémon is lost in this story: it goes into the black stone in the garden after a petal, and does not come out. The old man tells you, without being asked, that the machine could return it.\n\nThen he tells you what the machine eats.'),
    [
      ch('"I want it back."', out('He nods. He wanted his back too.', { kind: 'tradeAway', want: { label: 'a Pokémon' } }, f.step(), f.t('key'), flag('wf-want'), moment('One of your Pokémon was lost in the black stone. You want it back.', 95)), { requires: [party(2)] }),
      ch('"No machine."', out('He closes his eyes. "No. No machine." It is the first time in three thousand years he has said it to someone else.', { kind: 'tradeAway', want: { label: 'a Pokémon' } }, f.step(), f.t('grief'), f.t('flower'), moment('One of your Pokémon was lost in the black stone. You would not feed the machine for it.', 95)), { requires: [party(2)] }),
      ch('Pull it out yourself.', out('You reach into the stone up to the shoulder. It is very cold. Your Pokémon comes out with you, shaking. The old man stares at you as if you had done something impossible.', f.step(), f.t('flower'), fr(10)), { requires: [flagIs('wf-sat')] }),
    ]),
  ev('co-wre-wf-4', 'The Professor', WF, { rarity: 'epic', requires: f.beat(4), cast: ['boss.sycamore'], tint: '#000000' },
    card('THE PROFESSOR', 'Professor Sycamore has the history spread across three tables. "A war. A king who loved a Pokémon. A machine that gave life, and then took it, from everyone at once. Lysandre is a friend of mine. I should have seen this."'),
    [
      ch('"Help me find the key."', out('"There is a key. Lysandre has the lock." He gives you the address of a café.', f.step(), f.t('key'))),
      ch('"Tell me about the king."', out('He tells you. When he is finished, the old man, who has been standing at the back of the room the whole time, has gone.', f.step(), f.t('grief'))),
    ]),
  ev('co-wre-wf-5', 'The Café', WF, { rarity: 'epic', requires: f.beat(5), cast: ['boss.lysandre'], tint: '#000000', effect: 'fire' },
    card('THE CAFÉ', 'A red café, with a lift behind the counter that only goes down. Team Flare is guarding the key to the lock that Lysandre found.'),
    [
      ch('Take the key.', fight('You go down.', fl('Team Flare', { boss: 'lysandre', format: 'doubles', size: 4, lv: 2, win: [f.step(), f.t('key'), flag('wf-key'), moment('You took the key to the ultimate weapon from Team Flare.')], lose: [f.step()] }))),
      ch('Let Lysandre explain.', out('He makes you tea. He explains. He is not a cultist. He is a man who loves the world and has concluded it cannot be shared. He is very persuasive.', f.step(), f.t('beauty', 2))),
    ]),
  ev('co-wre-wf-6', 'What He Did With It', WF, { rarity: 'epic', requires: f.beat(6), cast: ['boss.az'], tint: '#000000' },
    card('WHAT HE DID WITH IT', 'The old man tells you the last piece. He built the machine to bring her back, and it did. Then the war took his brother, and he used it again: as a weapon. It ended the war. She saw what it had taken, and left him.'),
    [
      ch('"You are still allowed to grieve."', out('He looks at you for a long time, and something in his face lets go.', f.step(), f.t('grief'), f.t('flower'))),
      ch('"You should have known."', out('"Yes," he says. "I should have."', f.step(), f.t('grief'))),
    ]),
  ev('co-wre-wf-7', 'The Seat Beside Him', WF, { rarity: 'epic', requires: f.beat(7), cast: ['boss.lysandre'], tint: '#000000', effect: 'fire' },
    card('THE SEAT BESIDE HIM', 'Lysandre offers you a seat beside him in the world that comes after. "Not everyone. Just the ones who can see it. You can see it."'),
    [
      ch('Accept.', out('He is genuinely happy. It is the strangest thing you have seen all run.', f.step(), f.t('beauty', 3), flag('wf-seat'))),
      ch('Refuse.', out('He is genuinely sad. "Then you will be trampled with the rest."', f.step())),
    ]),
  ev('co-wre-wf-8', 'Behind the Weapon', WF, { rarity: 'epic', requires: f.beat(8), cast: ['boss.diantha'], pokemon: 'xerneas', tint: '#000000', effect: 'sparkle',
    remembers: [{ id: 'found', when: [f.has('flower', 2)], notice: 'At the edge of the field, very small, there is a Floette with a red flower. She is watching the old man. She has been watching him for a long time.' }] },
    card('BEHIND THE WEAPON', 'Diantha takes you to a field where a great tree stands on one side and a great cocoon on the other. "This is what powers it. Life, and the end of life. Lysandre means to use both."'),
    [
      ch('Look for the Floette.', out('You look. If she is here, she is not ready to be found.', f.step(), f.t('flower'))),
      ch('Stay with Diantha.', out('She tells you she will be at the League tomorrow, whatever happens, and that she will remember who stood where.', f.step(), heal())),
    ]),
  ev('co-wre-wf-9', 'Still Walking', WF, { rarity: 'epic', requires: f.beat(9), cast: ['boss.az'], tint: '#100808', effect: 'fire' },
    card('STILL WALKING', 'The night before the League, the old man sits at your fire for the first time. He does not ask about the Floette. He asks about your Pokémon, one by one, by name.'),
    [ch('Tell him.', out('You tell him. He listens to every one.', f.step(), f.t('grief'), heal(), fr(10)))]),
  ev('co-wre-wf-10', 'The Weapon Is Charged', WF, { rarity: 'epic', requires: f.climax, cast: ['boss.lysandre', 'boss.az'], pokemon: 'yveltal', tint: '#000000', effect: 'fire' },
    card('THE WEAPON IS CHARGED', 'Under the League the weapon is charged. Lysandre is waiting beside it, and the seat beside him is still empty. The old man asks you for the key. You are holding it.'),
    [ch('Face Lysandre.', fight('"You could have seen it," he says.', fl('Lysandre', { boss: 'lysandre', format: 'doubles', size: 6, lv: 3, win: [room('co-wre-wf-end')], lose: [...f.end('beautiful', 'The Beautiful World: a silent, perfect garden', { kind: 'bossDamageTakenMultiplier', value: 1.15 }), moment('The Weapon and the Flower: the Beautiful World. Lysandre won.', 100)] })))]),
  ev('co-wre-wf-end', 'The Weapon and the Flower: The Key', WF, { ...R, cast: ['boss.az'], tint: '#202020', effect: 'sparkle' },
    'Lysandre is beaten. The weapon is still charged. The old man holds out his hand for the key.',
    [
      ch('Give him the key.', out('He breaks it over his knee. The weapon goes dark. At the edge of the room, very small, a Floette with a red flower comes out from behind a pillar, by her own choice, which is the only way she ever would. He does not move. She comes all the way to him.', ...f.end('buried', 'Buried: the weapon is broken', { kind: 'healingMultiplier', value: 1.2 }), moment('The Weapon and the Flower: Buried. She came back by her own choice.', 100)), { requires: [f.has('flower', 2)] }),
      ch('Use it once more.', out('You fire it once, to bring one life back. It does. The game shows you, in full, what it took: every flower in the garden valley, and the tree, and the old man, who smiles, because he understands.', gift('floette'), ...f.end('fired', 'Fired Once More', { kind: 'damageMultiplier', value: 1.1 }), moment('The Weapon and the Flower: Fired Once More. You saw what it took.', 100)), { requires: [flagIs('wf-want')] }),
      ch('Take the seat.', out('You sit beside the empty chair. The weapon fires. The Champion battle will take place in a silent, perfect garden.', ...f.end('beautiful', 'The Beautiful World: a silent, perfect garden', { kind: 'bossDamageTakenMultiplier', value: 1.15 }), moment('The Weapon and the Flower: the Beautiful World.', 100)), { requires: [flagIs('wf-seat')] }),
      ch('Keep the key and walk.', out('Nobody wins. The weapon stays charged and unfired. The old man goes on down the road, and you walk with him a while.', ...f.end('walking', 'Still Walking'), moment('The Weapon and the Flower: Still Walking.', 100))),
    ]),
];

export const EVENTS: Json[] = [...weather, ...made, ...seven, ...flower];
export const REMOVE: string[] = [];
