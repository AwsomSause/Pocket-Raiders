// Regional (EN-120 to EN-131): one Street-scale scene per primary team's plan (nine regions), the second team's opinion,
// an ally for the Siege Map, and the choice of cut at the Last Rest. EN-130 and EN-131 need the Extended climax.
import { $, ch, flag, heat, leave, out, X, xr, type Json } from './common.ts';
import { good } from '../dsl.ts';

const at = (...ids: string[]): Json => ({ kind: 'region', ids });
const scene = (n: number, region: string, name: string, cast: string, intro: string, a: [string, string, Json[]], b: [string, string, Json[]]): Json =>
  xr(`en-${n}`, name, false, { req: [at(region)], rarity: 'uncommon', cast: [cast] }, intro, [
    ch(a[0], out(a[1], ...a[2])), ch(b[0], out(b[1], ...b[2])), ch('Walk on', leave()),
  ]);

export const REGIONAL_EVENTS: Json[] = [
  scene(120, 'kanto', 'The Quiet Collector', 'trainer.roughneck', 'A man with a receipt book sits on a bench in the market. He is not asking for anything yet. He is writing down the names of the shops.', ['Sit beside him and talk', 'He tells you which shops he has been told to "insure" and why. You write them down.', [flag('kanto-shops-noted'), { kind: 'research', amount: 4 }]], ['Warn the shops', 'You tell three shopkeepers. They thank you and put up a sign.', [good(2)]]),
  scene(121, 'johto', 'The Hum Under the Tower', 'trainer.worker_m', 'A hum, low and steady, from the radio tower\'s base. Pokémon in the yard look up all at once.', ['Trace the cable', 'It runs under the road to a grey box with a Rocket logo and a lock. You note the lock.', [flag('johto-hum-traced'), { kind: 'research', amount: 4 }]], ['Cover the Pokémon\'s ears', 'A bit of cloth and a calm voice. They settle.', [good(2), { kind: 'friendship', amount: 2, who: 'party' }]]),
  scene(122, 'hoenn', 'Two Hoods, One Cave', 'trainer.hiker', 'Two grunts in different coloured hoods share a cave mouth and a cold lunch. They are not talking about it.', ['Ask about the weather', 'They both say it is going to be a strange one. They both say it quietly.', [flag('hoenn-hoods-heard'), { kind: 'research', amount: 4 }]], ['Offer them lunch', 'One of them takes a sandwich. The other pretends not to notice.', [good(1)]]),
  scene(123, 'sinnoh', 'The Quiet Machines', 'trainer.worker_m', 'A row of machines on a hillside, humming in unison. A technician in a hard hat is writing numbers in a notebook.', ['Watch the technician', 'He is counting something. You count with him.', [flag('sinnoh-machines-counted'), { kind: 'research', amount: 4 }]], ['Ask for a tour', 'He gives you a short one. He is proud of the machines.', [{ kind: 'friendship', amount: 1, who: 'party' }]]),
  scene(124, 'unova', 'The Speaker in the Square', 'trainer.gentleman', 'A man on a crate speaks about freedom to a growing crowd. Everyone is nodding. You are not sure why you are uneasy.', ['Listen to the whole thing', 'It is beautiful. It does not once say what the Pokémon want.', [flag('unova-speaker-heard'), { kind: 'research', amount: 4 }]], ['Ask a question', 'The crowd turns. He answers. It is still beautiful.', [heat(1)]]),
  scene(125, 'kalos', 'The Fashion Show', 'trainer.guitarist', 'A runway in a plaza. A model walks past in a cloak that looks very much like a team uniform.', ['Look closer at the cloak', 'The tag reads FLARE COUTURE, SEASON ONE.', [flag('kalos-couture-seen'), { kind: 'research', amount: 4 }]], ['Applaud', 'Everyone does. It is a lovely show.', [good(1)]]),
  scene(126, 'alola', 'A Slow Afternoon', 'trainer.hiker', 'A beach, a stall, and two members of rival crews trading stickers. One says: "I am only here for the free coconut."', ['Join them', 'A good afternoon. You leave with a sticker.', [{ kind: 'friendship', amount: 2, who: 'party' }]], ['Ask them about the boss', 'They both look away and say, very softly, that he is nice.', [flag('alola-boss-asked')]]),
  scene(127, 'galar', 'The Crowd Cheers', 'trainer.guitarist', 'A stadium lot, loud with supporters. A man hands out free flags. The flag has a very small logo in the corner.', ['Read the logo', 'It is a sponsor. The sponsor is not who you think.', [flag('galar-flag-read'), { kind: 'research', amount: 4 }]], ['Wave one', 'Why not? It is a good atmosphere.', [good(1)]]),
  scene(128, 'paldea', 'The Study Hall', 'trainer.youngster_m', 'A class of students argues cheerfully about homework. One of them has a Team Star pin and has never been in a fight.', ['Ask about the pin', 'He shrugs: "It is a club. We have snacks."', [flag('paldea-pin-asked'), { kind: 'research', amount: 4 }]], ['Join the homework', 'Three hours later you know more about fractions. Your party is entertained.', [{ kind: 'friendship', amount: 2, who: 'party' }]]),
  xr('en-129', 'The Second Team\'s Opinion', false, { rarity: 'rare', cast: ['trainer.roughneck'] }, 'A grunt from the other team in the region, off duty, offers you his view of things. "The big ones think they are the main show. We are in the second row."', [
    ch('Listen', out('He tells you where he thinks his own team will go wrong.', flag('second-team-heard'), { kind: 'research', amount: 5 })),
    ch('Ask whose side he is on', out('"My own."', heat(1))),
    ch('Walk on', leave()),
  ]),
  xr('en-130', 'A District Worth Holding', false, { req: [X.extendedCut], rarity: 'rare', cast: ['trainer.gentleman'] }, 'A district council asks whether you will stand with them. They have a plan, and a flag, and a very good map.', [
    ch('Stand with them', out('They will hold one district for you when the time comes.', flag('district-ally'), good(3))),
    ch('Ask what they need first', out('A list of five things. You can do two of them today.', flag('district-asked'), good(1))),
    ch('Not this time', leave()),
  ]),
  xr('en-131', 'Standard or Extended', false, { req: [X.extendedCut], rarity: 'rare', minStage: 4, cast: ['trainer.psychic_m'], tint: '#14182c' }, 'The Last Rest before the end: a room, a lamp, a long table. The keeper of the house asks you, plainly, how you want the last night to go: the short version, or the long one with everything in it. You can say either.', [
    ch('The short version', out('A single long night, and a clear morning.', flag('cut-standard'))),
    ch('The long version, with everything in it', out('You ask for all of it. The keeper nods.', flag('cut-extended'))),
  ]),
] as Json[];
