// Kanto Canon Spaces, KANTO_PLACED_4.md (Volume II): Celadon, Fuchsia, Saffron and Cinnabar additions, and the road to
// Indigo Plateau. Lines kept word for word; the text around them is longer and warmer. Same-run memory only: the lines
// that speak of "every later run of this save" stay inside this run. No Keepsakes (Kice's cut): a keepsake is a journal moment.
import type { Json } from '../dsl.ts';
import { EXTRA, SPACES, retired, road, later, intel, kind, battle, buy, c, cash, flag, foe, fr, has, heal, heat, is, item, join, kc, moment, not, o, space, teach, temp, wild } from './_kc.ts';

export const CATEGORY = 'kanto-canon';
export const EVENTS: Json[] = [];
const E = EVENTS;
const DOC = 'KANTO_PLACED_4';
const rep = (n = 1): Json => flag('rep', n);
const lose = (id: string, count = 1): Json => ({ kind: 'loseItem', id, count });
const rocket: Json = { kind: 'evil', team: 'rocket' };
const typed = (type: string): Json => ({ kind: 'partyType', type });
const types = (...t: string[]): Json => ({ kind: 'partyTypes', types: t });
const strength: Json = { kind: 'partyMove', move: 'strength' };
const cure: Json = { kind: 'cure' };
const status = (s: string): Json => ({ kind: 'status', status: s, who: 'lead' });

// ============================================================ CELADON CITY (Stage 4)

// ---------- Scissor Street (anime)
{
  const s = space(E, { id: 'cs.kanto.celadon.salon', town: 'celadon', name: 'Scissor Street', kind: 'SHOP', appears: 'roll', flags: ['kanto.celadon.salon'], section: `${DOC}: Scissor Street`,
    placed: { stage: [4], home: 11, sits: 'town', attaches: 'town', badge: 'A pair of scissors', level: 0, often: 'Once per run' } });
  s.entry('Scissor Street',
    'One street, two salons. On the left, a quiet shop with a brush in the window. On the right, mirrors, feathers, a queue round the corner, and a sign: SALON ROCKET: BEAUTY IS PAIN (YOURS). Suzie, in the quiet one: "They paint them. Glitter in the fur. It looks very fine, and it itches, and the Pokémon can\'t tell you it itches. I only do what they\'d ask for, if they could ask." From across the road, a stylist with remarkable hair: "Dated! Health is over, darling! It\'s all about the look!"',
    [c('Let Suzie groom one.', o('She works with her hands, and talks to it, and stops when it flinches. "There. That\'s where it was sore. You\'ve been leading with that shoulder." It takes no node.', fr(5, 'picked'), cure, s.open('styleoff')), { pick: {} }),
      c('Walk the street, and go.', o('The queue on the right doesn\'t move. Nobody in it looks happy, including the Pokémon.'))]);
  s.room('styleoff', 'Scissor Street: The Style-Off', 'The loud salon challenges anything she\'s groomed.',
    [c('"We\'ll take that."', battle('Their Pokémon are in ribbons and paint, slow and scratching. The crowd, slowly noticing: "...Why\'s that Ekans miserable? Mine never looks like that. Oh. Mine never looks like anything."',
      foe('The Stylists', { team: ['ekans', 'koffing'], size: 2, format: 'doubles', levelBonus: s.lv, win: [s.open('won')], lose: [flag('kanto-celadon-salon')] }), flag('kanto-trio-met'))),
      c('"We\'ve nothing to prove."', o('Suzie smiles at the brush in her hand.', flag('kanto-celadon-salon'))),
      c('"Who are you two?"', o('They start the motto. They\'re wearing curlers. It doesn\'t land.', s.open('styleoff2')))]);
  s.room('styleoff2', 'Scissor Street: The Style-Off', 'Curlers, a motto, and a challenge.',
    [c('"We\'ll take that."', battle('Ribbons, paint, and an itch.', foe('The Stylists', { team: ['ekans', 'koffing'], size: 2, format: 'doubles', levelBonus: s.lv, win: [s.open('won')], lose: [flag('kanto-celadon-salon')] }), flag('kanto-trio-met'))),
      c('"We\'ve nothing to prove."', o('Suzie smiles at the brush in her hand.', flag('kanto-celadon-salon')))]);
  s.room('won', 'Scissor Street: The Queue Crosses', 'The queue crosses the road.',
    [c('Shake Suzie\'s hand.', o('Suzie asks you to look after her Vulpix for a while: "She wants to see somewhere I can\'t take her. Bring her back if she asks. She won\'t ask."', join(['vulpix']), flag('kanto-celadon-salon'), moment('Won a style-off on Scissor Street with a Pokémon that only wanted brushing.')))]);
}

// ---------- The Diner (the games' Coin Case; always)
{
  const s = space(E, { id: 'cs.kanto.celadon.diner', town: 'celadon', name: 'The Diner', kind: 'EV', appears: 'always', flags: ['kanto.celadon.coincase'], section: `${DOC}: The Diner`,
    placed: { stage: [4], home: 13, sits: 'optional', attaches: 'after', badge: 'A coffee cup and a coin', level: null, often: 'Once per run' } });
  const take = o('The Coin Case. And his three tips, whether asked or not: "The machines by the door are loose. So people outside can hear them paying." "Never play the one somebody\'s just left. It\'s cold." "Third from the end, back row. I watched it all week. I never sat at it. I don\'t know why." Only one of those is true; you\'ll find out which by trying.',
    item('coin-case'), flag('kanto-celadon-coincase'), flag('kanto-coins', 10));
  s.entry('The Diner',
    'A counter. One man, one cold coffee, one empty leather case on the stool beside him. Mr. Desmond Skeffington: "Take it. The case. I can\'t throw it away; I\'d fish it out. If you\'ve got it, I\'d have to ask for it back, and I\'d be too ashamed. That\'s the only lock I\'ve got left."',
    [c('"I\'ll take it."', take), c('"How much did you lose?"', o('"All of what I had, and some of what I didn\'t."', s.open('talk'))), c('"Is there somebody at home?"', o('"There is. That\'s why I\'m in here and not in there."', s.open('talk')))],
    { remembers: [{ id: 'prize', when: [is('kanto-coins', 100)], notice: 'He looks at your coins, and nods, and orders a fresh coffee.' }] });
  s.room('talk', 'The Diner', 'The case, on the stool.', [c('"I\'ll take it."', take), c('Leave it.', o('He doesn\'t look at it after you go. He doesn\'t look at anything.'))]);
}

// ---------- The Poster (the games' switch; Trigger: the Game Corner was visited and Team Rocket's awake)
{
  const s = space(E, { id: 'cs.kanto.celadon.poster', town: 'celadon', name: 'The Poster', kind: 'EV', appears: 'trigger', requires: { spaces: ['cs.kanto.celadon.gamecorner'] }, flags: ['kanto.celadon.poster'], section: `${DOC}: The Poster`,
    placed: { stage: [4], home: 14, sits: 'optional', attaches: 'after', badge: 'None', level: 0, often: 'Once per run (inside the Game Corner\'s node)' } });
  const hideout = (n: number): Json => ({ kind: 'addEvent', eventId: `cs-kanto-celadon-hideout-${n}` });
  const waited = (...x: Json[]) => o('Four minutes. He looks at his watch. He goes for a sandwich. You go in one room further than anyone was meant to.', intel(), intel(), intel(), intel(), ...x, flag('kanto-celadon-poster'), hideout(2));
  s.entry('The Poster',
    'A poster of a Clefairy on the back wall. A man in black standing with his back flat against it. The Grunt: "I\'m admiring the machines." He\'s facing away from them. "From here. I admire them from here. It\'s the best angle."',
    [c('"I\'ll wait."', waited()), c('"Move."', battle('He moves, eventually, under protest.', foe('Rocket Grunt', { evil: 'grunt', evilTeam: 'rocket', size: 2, levelBonus: s.lv, win: [heat(3)] }), intel(), intel(), intel(), intel(), flag('kanto-celadon-poster'), hideout(2))),
      c('Reach past him and press it.', o('The wall slides. You\'re going in early.', flag('kanto-celadon-poster'), hideout(1))),
      c('"Nice poster."', o('"It\'s a perfectly ordinary poster! There\'s nothing behind it! Why would you say \'behind\'? I didn\'t say \'behind\'!"', s.open('nice')))], { requires: [rocket] });
  s.room('nice', 'The Poster', 'He is pressed very flat against the Clefairy.',
    [c('"I\'ll wait."', waited()), c('Reach past him and press it.', o('The wall slides. You\'re going in early.', flag('kanto-celadon-poster'), hideout(1)))]);
}

// ---------- The Developers' Room (the games)
{
  const s = space(E, { id: 'cs.kanto.celadon.devroom', town: 'celadon', name: "The Developers' Room", kind: 'EV', appears: 'roll', flags: ['kanto.celadon.devroom'], section: `${DOC}: The Developers' Room`,
    placed: { stage: [4], home: 12, sits: 'town', attaches: 'town', badge: 'A pencil', level: null, often: 'Once per run' } });
  const seen = (n: number): Json => ({ kind: 'dex', set: 'seen', atLeast: n });
  const bye = 'The fourth, as you leave, for the only time: "It was worth doing. Tell them."';
  s.entry("The Developers' Room",
    'A small office. Four desks. Four people who look as if they\'ve been here since before the building. The one who draws: "I did the pictures. All of them. The Pidgey took a week. Nobody notices the Pidgey." The one who writes: "I wrote what people say. I\'m sorry about some of it. It was late." The one who programs: "If something odd happened to you out there, that was me. It wasn\'t meant to. I\'ve left it in. I\'ve grown fond of it." The fourth, not looking up: "..." The one who writes: "We don\'t know what he does. He was here when we came." They ask how many kinds you\'ve met.',
    [c('Sixty or more.', o(`A hand-signed Diploma (four signatures, one of them a dot), and a Porygon "left over." ${bye}`, join(['porygon']), flag('kanto-celadon-devroom'), moment('Got a diploma from the people who drew the Pidgey: four signatures, one of them a dot.')), { requires: [seen(60)] }),
      c('Thirty or more.', o(`A PP Up. ${bye}`, item('pp-up'), flag('kanto-celadon-devroom')), { requires: [seen(30)] }),
      c('Fewer than thirty.', o(`A Rare Candy. "Go and meet more. We made a lot." ${bye}`, item('rare-candy'), flag('kanto-celadon-devroom')))]);
}

// ---------- The Bridge Run (anime; Pseudo Stage: a race in three parts)
{
  const s = space(E, { id: 'cs.kanto.celadon.bridgerun', town: 'celadon', name: 'The Bridge Run', kind: 'PS', appears: 'roll', flags: ['kanto.gang.patch', 'kanto.celadon.bridgerun'], section: `${DOC}: The Bridge Run`,
    placed: { stage: [4], home: 8, window: [6, 10], sits: 'door', attaches: 'plus', badge: 'A bicycle and a storm cloud', level: 0, often: 'Once per run' },
    ps: { name: 'The Bridge Run', themeId: 'normal-water', mood: 'twenty headlamps in the rain' } });
  const late = (n = 1) => flag('kanto-bridgerun-late', n);
  const patch = [heat(-2), flag('kanto-gang-patch'), flag('kanto-celadon-bridgerun')];
  s.entry('The Bridge Run',
    'A Pokémon Center with the phone ringing. A nurse with a parcel and no way to send it. The nurse: "There\'s a Shellder at Sunnytown that won\'t last the night without this. The road\'s eight hours. The bridge is one, and it isn\'t finished, and there\'s a storm due, and there are people on it who don\'t let anyone by." Without a bike of your own, she lends you hers. Twelve turns, three parts.',
    [c('Take the parcel.', o('The bag goes on your back. The rain starts on the first pedal stroke.', s.open('gang'))), c('"I can\'t."', o('She nods, and keeps dialling.'))]);
  s.room('gang', 'The Bridge Run: The Gang', 'Bikers across the bridge\'s mouth. Chopper: "Toll\'s a battle. Two if you\'re in a hurry."',
    [c('Battle, on the move.', battle('You pick moves while steering.', foe('Chopper', { team: ['grimer', 'koffing'], size: 2, levelBonus: s.lv, win: [s.open('reason')], lose: [late(), s.open('reason')] }))),
      c('Ride round them.', o('Off the road, through a hedge, back on. It costs time.', late(2), s.open('reason')))]);
  s.room('reason', 'The Bridge Run: The Reason', 'Tyra: "What\'s in the bag?"',
    [c('Tell them.', o('They look at each other. They kick their stands up. "Sunnytown. My nan\'s in Sunnytown. Move, you lot. Make a lane." With the escort: twenty headlamps in the rain, and you in the middle of them.', flag('kanto-bridgerun-escort'), s.open('drawbridge'))),
      c('Won\'t say.', battle('The second battle, and no escort.', foe('Tyra', { team: ['muk'], size: 1, levelBonus: s.lv, win: [s.open('drawbridge')], lose: [late(), s.open('drawbridge')] })))]);
  s.room('drawbridge', 'The Bridge Run: The Drawbridge', 'It\'s going up.',
    [c('Two bikes hold the lever.', o('The escort holds it, and you go over.', s.open('end')), { requires: [is('kanto-bridgerun-escort')] }),
      c('Jump it.', o('You clear the gap with a foot to spare.', s.open('end')), { prompt: ['hurdle-rhythm', 'ok'], fail: o('You land short and walk the last bit with the bike on your shoulder.', late(), s.open('end')) })]);
  s.room('end', 'The Bridge Run: Sunnytown', 'A child in pyjamas at the Center door, waiting.',
    [c('In time.', o('The gang\'s patch: bikers on the Cycling Road leave you be. From the Shellder\'s trainer, a child in pyjamas: a bundle of Sitrus Berries.', ...patch, item('sitrus-berry', 3), moment('Rode a parcel over an unfinished bridge in a storm, inside twenty headlamps.')), { requires: [is('kanto-bridgerun-late', 0, 1)] }),
      c('Late.', o('It\'s delivered anyway. The Shellder\'s poorly, and pulls through. The patch only. Chopper, after: "We got it there. You didn\'t. Don\'t feel bad. Feel a bit bad."', ...patch), { requires: [is('kanto-bridgerun-late', 2)] })]);
}

// ---------- The Greenhouse Fire (anime; Trigger: the Perfume Heist was played)
{
  const s = space(E, { id: 'cs.kanto.celadon.greenhouse', town: 'celadon', name: 'The Greenhouse Fire', kind: 'EV', appears: 'trigger', requires: { spaces: ['cs.kanto.celadon.perfume'] }, flags: ['kanto.erika.friend', 'kanto.celadon.greenhouse'], section: `${DOC}: The Greenhouse Fire`,
    placed: { stage: [4], home: 6, sits: 'must', attaches: 'before', badge: 'A flame over glass', level: null, often: 'Once per run' } });
  const turns = (n: number) => flag('kanto-greenhouse-turns', n);
  const room = (id: string, next: string, title: string) => s.room(id, `The Greenhouse Fire: ${title}`, 'Smoke, and the heat coming off the glass.',
    [c('Use a Water move.', o('The room\'s fire goes out with a hiss.', turns(1), s.open(next)), { requires: [{ kind: 'partyMoveType', type: 'water' }] }),
      c('Push through.', o('Two turns, and your lead takes a burn.', turns(2), status('burn'), s.open(next)))]);
  s.entry('The Greenhouse Fire',
    'Smoke over the rooftops. Glass breaking, a pane at a time. The perfume greenhouse. Staff with buckets. Erika, held back by two of her own gardeners, not shouting: saying one thing, over and over, quietly. "She won\'t leave. She thinks it\'s hers to mind. She\'s old. She won\'t leave." Six turns. Three rooms deep.',
    [c('Go in.', o('In.', s.open('r1')))],
    { remembers: [{ id: 'trio', when: [is('kanto-perfume-lost')], notice: 'It\'s the trio\'s dropped lamp. They\'re on the bucket chain, at the back, in the gardener scarves, saying nothing.' }] });
  room('r1', 'r2', 'The First Room');
  room('r2', 'last', 'The Second Room');
  s.room('last', 'The Greenhouse Fire: The Last Room', 'An old Gloom, in the middle of the oldest bed, with its leaves over the seedlings. A Poison or Grass type is immune to the smell; anything else is stunned a turn, because she\'s frightened, and it shows.',
    [c('"Carry her."', o('You carry her.', turns(2), s.open('out'))), c('"Carry the seedlings. She\'ll follow them."', o('She follows at once.', turns(1), s.open('out'))),
      c('"It\'s all right. You\'ve minded it. Come on."', o('She looks at you a long time, and comes.', turns(1), s.open('out')), { requires: [types('poison', 'grass')] })]);
  s.room('out', 'The Greenhouse Fire: Out', 'The door, and air.',
    [c('Out in time.', o('A Leaf Stone. Free perfume. A friend in Celadon for the rest of the run. Erika: "I once shut my door on somebody who said she smelled. I think about that. She\'d have gone in after them, too."',
      item('leaf-stone'), item('perfume-vial'), flag('kanto-erika-friend'), flag('kanto-celadon-greenhouse'), moment('Carried an old Gloom out of Erika\'s burning greenhouse.')), { requires: [is('kanto-greenhouse-turns', 0, 6)] }),
      c('Too slow.', o('The firefighters get her out a minute later, singed and cross. Erika thanks you for trying.', flag('kanto-celadon-greenhouse')), { requires: [is('kanto-greenhouse-turns', 7)] })]);
}

// ---------- The Unstable Eevee (manga; Trigger: Team Rocket's awake, inside the Game Corner's prize office)
{
  const s = space(E, { id: 'cs.kanto.celadon.vee', town: 'celadon', name: 'The Unstable Eevee', kind: 'EV', appears: 'trigger', requires: { spaces: ['cs.kanto.celadon.gamecorner'] }, flags: ['kanto.celadon.vee'], section: `${DOC}: The Unstable Eevee`,
    placed: { stage: [4], home: 15, sits: 'optional', attaches: 'after', badge: 'None', level: 0, often: 'Once per run' } });
  const stone = (id: string, mon: string) => c(`Offer the ${id.replace('-', ' ').replace(/\b\w/g, (m) => m.toUpperCase())}.`, o('It settles into that form for good, and joins. It breathes out, as if it\'s been holding it for months.', lose(id), join([mon]), flag('kanto-celadon-vee')), { requires: [has(id)] });
  s.entry('The Unstable Eevee',
    'Behind the prize counter, a door marked STOCK. From behind it, a sound that keeps changing: a splash, a crackle, a hiss. A cage. Inside, something blue with a fin. A guard drops his keys. It\'s yellow, and every hair\'s on end. You step forward. It\'s red. Between each, for half a second, it\'s small and brown, and it looks at you. The guard: "Don\'t startle it! It does a different one every time. The buyers love it. Three for the price of one."',
    [c('Battle the guard.', battle('He fights to keep the cage shut.', foe('Rocket Guard', { evil: 'grunt', evilTeam: 'rocket', size: 2, levelBonus: s.lv, win: [s.open('cage')] }))), c('Back out.', o('The sound goes on changing behind the door.'))], { requires: [rocket] });
  s.room('cage', 'The Unstable Eevee: The Cage', 'The cage is open. It\'s in the far corner, changing, changing. It isn\'t a Shadow Pokémon, and it\'s never forced to change.',
    [stone('water-stone', 'vaporeon'), stone('thunder-stone', 'jolteon'), stone('fire-stone', 'flareon'),
      c('"No stone. Take as long as you need."', o('It joins as an Eevee. It bonds slower, and it\'s worth it.', join(['eevee']), flag('kanto-celadon-vee'), moment('Waited for a frightened Eevee to stop changing, and let it stay an Eevee.')))],
    { remembers: [{ id: 'brothers', when: [is('kanto-eevee')], notice: 'Later, the Eeveelution Brothers go quiet when they hear. Mikey: "Somebody made it choose? All of them?" Pyro puts his stone in his pocket.' }] });
}

// ============================================================ FUCHSIA CITY (Stage 5)

// ---------- The Big P Ranch (anime; Pseudo Stage: a race in three legs)
{
  const s = space(E, { id: 'cs.kanto.fuchsia.ranch', town: 'fuchsia', name: 'The Big P Ranch', kind: 'PS', appears: 'roll', flags: ['kanto.fuchsia.ranch'], section: `${DOC}: The Big P Ranch`,
    placed: { stage: [5], home: 4, window: [3, 7], sits: 'door', attaches: 'instead', badge: 'A horseshoe', level: null, often: 'Once per run' },
    ps: { name: 'The Big P Ranch', themeId: 'normal-fire', mood: 'a herd of Tauros moving like weather' } });
  const trust = (n = 1) => flag('kanto-ranch-trust', n);
  const ahead = (n = 1) => flag('kanto-ranch-ahead', n);
  const leg = (id: string, next: string, title: string, text: string, gift?: [string, number]) => s.room(id, `The Big P Ranch: ${title}`, text,
    [c('Let her run her own race.', o(gift ? (gift[1] === 2 ? 'She jumps without being asked.' : 'The flames go white.') : 'Careful. She notices you didn\'t push.', trust(), ...(gift ? [ahead()] : []), s.open(next)), gift ? { requires: [is('kanto-ranch-trust', gift[1])] } : {}),
      c('Let her run her own race.', o('She does, carefully.', trust(), s.open(next)), gift ? { requires: [is('kanto-ranch-trust', 0, gift[1] - 1)] } : { requires: [not('kanto-ranch-trust')] }),
      c('Urge.', o('Faster, for one stride. She feels you ask, and she goes, and something between you goes the other way a little.', ahead(), s.open(next)))]);
  s.entry('The Big P Ranch',
    'Open grassland. A herd of Tauros moving like weather. A girl on a Ponyta, turning them with a whistle. Lara: "Race is tomorrow. The ranch that wins runs the reserve. We\'ve won nine years." That night: a spooked herd, a fall. Her arm\'s in a sling by morning. "It\'s not broken. It\'s not good. She won\'t take anyone but me. She burns them. You could try. You\'d need to mean it." You reach for the mane. It\'s hot. It isn\'t hot enough to stop you, quite. The Ponyta\'s watching to see what you\'ll do about that.',
    [c('"Hold on anyway."', o('It costs your pride and a blister; nobody\'s harmed.', trust(), s.open('hills'))), c('"Take my hand away. Wait. Try again."', o('The second time, it lets you.', trust(), s.open('hills'))),
      c('"Ask it."', o('You ask. It thinks about it. It lowers its head.', trust(), s.open('hills')))]);
  leg('hills', 'river', 'The Hills', 'Slow, careful. A rival rider on a Dodrio, Dario, who\'s very sure of himself, and whose friends have been at the fences.');
  leg('river', 'sprint', 'The River', 'Stepping stones. Ponyta hates water.', ['river', 2]);
  leg('sprint', 'line', 'The Sprint', 'Flat out against the Dodrio.', ['sprint', 3]);
  s.room('line', 'The Big P Ranch: The Line', 'The line.',
    [c('Over it.', o('The line. The Ponyta\'s gone over it as something taller. It\'s evolved in the last stride. Lara: "She never did that for me. ...No. She did it for her. You just didn\'t get in the way. That\'s the hard part." One of this year\'s foals: a Ponyta. And Charcoal.',
      join(['ponyta']), item('charcoal'), flag('kanto-fuchsia-ranch'), moment('Won the Big P race on a Ponyta that wouldn\'t take anyone, by not getting in her way.')), { requires: [is('kanto-ranch-ahead', 2)] }),
      c('Second.', o('The ranch is kept anyway: a neighbour\'s loan. The foal\'s still offered. "You rode her kind. That\'s what I\'m paying for."', join(['ponyta']), flag('kanto-fuchsia-ranch')), { requires: [is('kanto-ranch-ahead', 0, 1)] })]);
}

// ---------- The Child of the Herd (anime; inside Safari Land)
{
  const s = space(E, { id: 'cs.kanto.fuchsia.herd', town: 'fuchsia', name: 'The Child of the Herd', kind: 'EV', appears: 'trigger', requires: { spaces: ['cs.kanto.fuchsia.safari'] }, flags: ['kanto.fuchsia.herd'], section: `${DOC}: The Child of the Herd`,
    placed: { stage: [5], home: 12, sits: 'optional', attaches: 'after', badge: 'A boomerang', level: 0, often: 'Once per run (inside Safari Land)' } });
  s.entry('The Child of the Herd',
    'The long grass parts. Something small, fast and furious comes out of it, and it isn\'t a Pokémon. A boy of six or seven, in a fur wrap, with a boomerang. He throws it at your feet. It comes back to him. "Kanga! Kanga-kanga! Go!" Behind him, a Kangaskhan, very large, entirely calm. Overhead, as every evening for five years: a helicopter, going round. At the gate, a man and a woman in expensive, worn-out clothes. The mother: "He fell out. He was three. We\'ve flown over this place every day since. We see him, sometimes. He looks well. That\'s what I can\'t get past."',
    [c('Stay the night near the herd.', o('That night: poachers. A lorry, nets, a tranquilliser rig. A dart, a Kangaskhan going down slowly, the boy standing over her with the boomerang.', s.open('poachers'))), c('Leave them to it.', o('The helicopter goes round again.'))]);
  s.room('poachers', 'The Child of the Herd: Poachers', 'You fight beside a Kangaskhan you don\'t command; it does what\'s needed.',
    [c('Battle.', battle('The Kangaskhan takes the left; you take the right.', foe('Poachers', { team: ['arbok', 'golbat'], size: 2, levelBonus: s.lv, win: [s.open('after')], lose: [s.open('after')] })))]);
  s.room('after', 'The Child of the Herd: Morning', 'The helicopter\'s landed. The father\'s walking toward the herd with his hands open. The boy looks at him, and at the Kangaskhan, and back.',
    [c('Watch.', o('The boy, the only words he\'s got: "...Mama. Papa." And then, pointing at the herd: "Mama." The mother, after a while: "Well. We\'d better stay, then. Hadn\'t we."', rep(2), flag('kanto-fuchsia-herd'), moment('Stood with a Kangaskhan and a boy against poachers, and watched a family decide to stay.')))]);
}

// ---------- The Lake Nobody Fishes (anime; inside Safari Land)
{
  const s = space(E, { id: 'cs.kanto.fuchsia.dragonlake', town: 'fuchsia', name: 'The Lake Nobody Fishes', kind: 'EV', appears: 'roll', requires: { spaces: ['cs.kanto.fuchsia.safari'] }, flags: ['kanto.dragonair.sighting', 'kanto.fuchsia.dragonlake'], section: `${DOC}: The Lake Nobody Fishes`,
    placed: { stage: [5], home: 12, sits: 'optional', attaches: 'after', badge: 'A still circle', level: null, often: 'Once per run (inside Safari Land)' } });
  const leave = o('He watches you walk off. He calls you back. At dusk, he shows you: the lake\'s surface, and under it, something long, turning over in its sleep. A Dragon Scale, from the shore. A Dragonair Sighting.', item('dragon-scale'), flag('kanto-dragonair-sighting'), flag('kanto-fuchsia-dragonlake'), moment('Was shown the nothing in the lake nobody fishes.'));
  const fish = c('"Then you won\'t mind if I fish." (10% a Dratini)', battle('A long blue shape takes the line. He doesn\'t watch.', wild(['dratini'], { levelBonus: 0, win: [flag('kanto-fuchsia-dragonlake')] })),
    { chance: 0.1, fail: o('"Told you. Nothing in it." He isn\'t triumphant. He\'d hoped better of you.', flag('kanto-fuchsia-dragonlake')) });
  s.entry('The Lake Nobody Fishes',
    'A lake with no ripples. A hut. An old warden on a chair, facing the water, with a rod across his knees that\'s got no line on it. Kaiser: "There\'s nothing in it. I\'ve guarded the nothing for thirty years. People used to come with nets for the nothing. Whole town came. They drained half of it looking. So: there\'s nothing in it. You understand me."',
    [c('"I understand. I\'ll leave it."', leave), fish, c('"What was it, the nothing?"', o('"Long. Blue. It looked at me once. I was a young fool with a net. I put the net down. I\'ve not picked up one since."', s.open('ask')))]);
  s.room('ask', 'The Lake Nobody Fishes', 'The rod with no line, across his knees.', [c('"I understand. I\'ll leave it."', leave), fish]);
}

// ---------- The Rod Brothers and the Move Deleter (the games; always)
{
  const s = space(E, { id: 'cs.kanto.fuchsia.gurus', town: 'fuchsia', name: 'The Rod Brothers and the Move Deleter', kind: 'EV', appears: 'always', flags: [], section: `${DOC}: The Rod Brothers and the Move Deleter`,
    placed: { stage: [5], home: 2, sits: 'town', attaches: 'town', badge: 'A rod and an eraser', level: null, often: 'Once per run' } });
  s.entry('The Rod Brothers and the Move Deleter',
    'Two doors. On one, a fish. On the other, an eraser. Mr. Barnabus Sprat, the Fishing Guru: "Do you like fishing?"',
    [c('"Yes."', o('"Good! Have a rod. My brother in Vermilion gives them to people who can\'t. I give them to people who want to. Mine\'s the higher standard."', item('good-rod'), s.open('deleter')), { requires: [not('kanto-good-rod')] }),
      c('"I\'ve never caught anything."', o('"That\'s not what I asked. I asked if you like it. Sitting there. Not catching."', s.open('ask'))),
      c('"No."', o('He looks at you as if you\'d said you didn\'t like breathing.', s.open('deleter'))),
      c('The Move Deleter, next door.', o('"Sit it down there. Which one\'s it tired of carrying?"', s.open('deleter')))]);
  s.room('ask', 'The Fishing Guru', '"Do you like it?"', [c('"Yes. I like it."', o('"Then have a rod."', item('good-rod'), s.open('deleter'))), c('"Not really."', o('"Honest. Next door, then."', s.open('deleter')))]);
  s.room('deleter', 'The Move Deleter', 'The Move Deleter: "Sit it down there. Which one\'s it tired of carrying?" He can also help a Pokémon forget a Shadow move it no longer wants, at no cost.',
    [c('A Shadow Pokémon.', o('He doesn\'t ask why. He puts a hand on its head, and waits, and the Pokémon\'s shoulders come down. "There. It didn\'t want that one. Somebody put it there."', { kind: 'shadowHeart', amount: -5 }, fr(5, 'picked')), { requires: [{ kind: 'partyShadow' }], pick: {} }),
      c('Any Pokémon.', o('He puts a hand on its head, and waits. "There." It looks lighter.', fr(3, 'picked')), { pick: {} }), c('Leave.', o('"Come back when it\'s tired."'))]);
}

// ---------- The Bird Keepers' Maze (the games' cliff routes)
{
  const s = space(E, { id: 'cs.kanto.fuchsia.birdmaze', town: 'fuchsia', name: "The Bird Keepers' Maze", kind: 'EV', appears: 'roll', flags: ['kanto.fuchsia.birdmaze'], section: `${DOC}: The Bird Keepers' Maze`,
    placed: { stage: [5], home: 10, window: [8, 12], sits: 'optional', attaches: 'instead', badge: 'A fence', level: 0, often: 'Once per run' } });
  const K: [string, string, string[]][] = [
    ['Wilton', '"They\'re not lost. You\'re lost. They know exactly where they are."', ['pidgeotto']], ['Edwina', '"Mine only flies left. We\'ve made a life of it."', ['spearow', 'fearow']],
    ['Chester', '"Don\'t look down. I say that to everyone. They all look down."', ['farfetchd']], ['Roland', '"I whistle, it comes. I don\'t whistle, it also comes. I\'ve stopped whistling."', ['doduo', 'pidgey']],
    ['Old Jacob', '"Forty years on this cliff. Never been up. They go up. I hold the lunch."', ['pidgeot']],
  ];
  K.forEach(([name, line, team], i) => {
    const last = i === K.length - 1;
    const win = last ? [item('sharp-beak'), teach('aerial-ace'), s.open('doduo')] : [s.open(`k${i + 2}`)];
    s.room(`k${i + 1}`, `The Bird Keepers' Maze: ${name}`, `${name}: ${line}`, [c('Battle.', battle(`${name}\'s bird comes down off the fence.`, foe(name, { team, size: team.length, levelBonus: s.lv, win, lose: [flag('kanto-fuchsia-birdmaze')] })))]);
  });
  s.entry("The Bird Keepers' Maze",
    'A cliff road fenced into a maze. At every corner, somebody with a bird on their arm and a whistle round their neck. A sign at the gate shows both ways: Short, two battles, coins. Long, five battles: a Sharp Beak, a hidden TM, and a Doduo.',
    [c('The short way (two battles).', battle('Two keepers, two birds.', foe('Bird Keepers', { team: ['pidgey', 'spearow'], size: 2, levelBonus: s.lv, win: [cash(800), flag('kanto-fuchsia-birdmaze')] }))),
      c('The long way (five battles).', o('Five corners, five whistles.', s.open('k1'))), c('Go round the cliff.', o('The birds watch you go the long way round the outside.'))]);
  s.room('doduo', "The Bird Keepers' Maze: The Way Out", 'A Doduo that\'s been in the maze since it was hatched, walking the long way. It follows you out, both heads arguing about the turnings.',
    [c('Let it come.', o('It joins of its own accord.', join(['doduo']), flag('kanto-fuchsia-birdmaze'), moment('Walked the long way through the Bird Keepers\' Maze, and came out with a Doduo.')))]);
}

// ---------- The Weakest Paras (anime; it can be tried again at the next + node)
{
  const s = space(E, { id: 'cs.kanto.fuchsia.paras', town: 'fuchsia', name: 'The Weakest Paras', kind: 'EV', appears: 'roll', flags: ['kanto.paras.confidence', 'kanto.fuchsia.paras'], section: `${DOC}: The Weakest Paras`,
    placed: { stage: [5], home: 6, window: [4, 8], sits: 'optional', attaches: 'instead', badge: 'A small mushroom', level: null, often: 'Once per run; it can be tried again' } });
  const conf = (n = 1) => flag('kanto-paras-confidence', n);
  const turn = (id: string, next: string, title: string) => s.room(id, `The Weakest Paras: ${title}`, 'It scratches. It wouldn\'t dent a leaf. Each of your moves is marked Safe or Too strong.',
    [c('Miss on purpose.', o('Your lead swings wide, very obviously. The Paras looks thrilled.', conf(), s.open(next))), c('Flinch dramatically.', o('Your lead reels. The Paras stands taller.', conf(), s.open(next))),
      c('A weak move.', o('A tap. It holds.', conf(), s.open(next))), c('A strong move.', o('Too strong. The Paras faints. She thanks you anyway. She\'ll follow you, hopefully, to the next rest.', { kind: 'laterEvent', eventId: s.id('again'), nodes: 3 }))]);
  const win = o('Your lead takes a Scratch that wouldn\'t dent a leaf, staggers three steps, looks at you to check it\'s doing it right, and keels over with one leg in the air. The Paras stares at its own claw. It\'s glowing before it\'s finished staring. The Miracle Potion: a full heal and cure, for one Pokémon, out of battle.',
    heal(1), cure, kc('reviveOne'), flag('kanto-fuchsia-paras'), moment('Lost, very convincingly, to the weakest Paras in Fuchsia.'));
  s.entry('The Weakest Paras',
    'A herbalist\'s shop. A shelf of empty jars labelled MIRACLE: AWAITING INGREDIENT. Cassandra: "The medicine wants the big mushroom. A Parasect\'s. Mine\'s a Paras. It needs to evolve. It needs to win to do that, and it\'s never won anything. It lost to a Caterpie. The Caterpie apologised." The Paras is behind her ankle. It waves a claw, and falls over. The task: lose convincingly. A disobedient Pokémon may hit for real; you\'re told before, and may bench it.',
    [c('"I\'ll lose to it."', o('Its Confidence starts at nothing.', s.open('t1'))), c('"Another time."', o('The Paras waves. It falls over.'))]);
  turn('t1', 't2', 'Turn One');
  turn('t2', 't3', 'Turn Two');
  s.room('t3', 'The Weakest Paras: The Last Hit', 'Its Confidence is full. It has to land the last hit.', [c('Fall over.', win)]);
  s.room('again', 'The Weakest Paras: Again', 'Cassandra, at the rest stop, holding the Paras up hopefully.', [c('"Again."', o('Again.', s.open('t1'))), c('"Not now."', o('She waits. She\'s good at waiting.'))], later());
}

// ---------- The Carnival (anime)
{
  const s = space(E, { id: 'cs.kanto.fuchsia.carnival', town: 'fuchsia', name: 'The Carnival', kind: 'EV', appears: 'roll', flags: ['kanto.fuchsia.carnival'], section: `${DOC}: The Carnival`,
    placed: { stage: [5], home: 17, window: [15, 18], sits: 'optional', attaches: 'before', badge: 'A top hat', level: null, often: 'Once per run' } });
  const saved = (lead: string) => o(lead + ' The carnival\'s saved. He gives you his Exeggcute: "It deserves a better act than mine." A Miracle Seed. Melvin: "I\'ll do children\'s parties. They like the sprinkler."', join(['exeggcute']), item('miracle-seed'), flag('kanto-fuchsia-carnival'), moment('Turned thirty marching Exeggutor away from the carnival\'s fuel store.'));
  s.entry('The Carnival',
    'A carnival with nobody at it. One tent has a show on. The audience is you. Melvin the Magnificent: "And now! From this ordinary hat! A—" It\'s a sprinkler. It goes off. It puts out his own candles. "...It was that or the doves. The doves left." His one Exeggcute tries to help. It hypnotises your lead by accident, and looks mortified. That night: thirty Exeggutor, in step, eyes blank, marching at the carnival\'s fuel store. Melvin: "They\'ll stop when I say! Stop. ...They\'ll stop when it says. Tell them. ...It can\'t. It\'s hypnotised itself." Four turns.',
    [c('Fire: a small one.', saved('They\'re startled awake. Two turns.'), { requires: [{ kind: 'partyMoveType', type: 'fire' }] }),
      c('Sound: the carnival\'s organ.', saved('The organ, at full stops. Three turns. Just.')),
      c('"You wanted an audience. Look at what you\'ve got instead."', saved('He walks out in front of them, takes off the hat, and bows to nobody. The Exeggcute sees him do it, and blinks. One turn.'))]);
}

// ============================================================ SAFFRON CITY (Stage 6)

// ---------- Mr. Psychic (the games; always)
{
  const s = space(E, { id: 'cs.kanto.saffron.mrpsychic', town: 'saffron', name: 'Mr. Psychic', kind: 'EV', appears: 'always', flags: ['kanto.saffron.mrpsychic'], section: `${DOC}: Mr. Psychic`,
    placed: { stage: [6], home: 4, sits: 'town', attaches: 'town', badge: 'An eye', level: null, often: 'Once per run' } });
  const tm = [teach('psychic'), intel(), intel(), intel(), flag('kanto-saffron-mrpsychic')];
  s.entry('Mr. Psychic',
    'A house with the door already open. Mr. Psychic: "...Wait. Don\'t say a word. You wanted this." He hands over a TM. It\'s Psychic. He goes on looking at you. A little longer than is comfortable. Then a little longer than that. "The building with the fountain has more floors than it admits to."',
    [c('"How do you know that?"', o('"Because you were about to ask." He seems sorry about it.', ...tm)), c('"Thank you."', o('"You\'re welcome. You\'ll be back. No, you won\'t. Good."', ...tm)),
      c('Say nothing; think it.', o('"You\'re welcome. ...Yes, and that. No. I won\'t tell you how that ends. I like you."', ...tm))]);
}

// ---------- The House of Imitation (anime)
{
  const s = space(E, { id: 'cs.kanto.saffron.imite', town: 'saffron', name: 'The House of Imitation', kind: 'EV', appears: 'roll', flags: ['kanto.saffron.imite'], section: `${DOC}: The House of Imitation`,
    placed: { stage: [6], home: 9, window: [7, 11], sits: 'optional', attaches: 'instead', badge: 'A theatre mask with dot eyes', level: null, often: 'Once per run' } });
  const praise = (id: string, next: string, copy: string) => s.room(id, 'The House of Imitation', copy,
    [c('"That\'s good. That\'s really good."', o('It holds a little longer.', s.open(next))), c('Attack it.', battle('Attacking\'s allowed. It wins the battle and ends the event with nothing; you were told on the first turn.', foe('Duplica', { team: ['ditto'], size: 1, mirror: true, levelBonus: 0, win: [flag('kanto-saffron-imite')] })))]);
  s.entry('The House of Imitation',
    'A small theatre. CLOSED on the door, and under it, older, THE HOUSE OF IMITATION: SHE CAN BE ANYONE! Duplica, on the edge of the stage, in half a costume: "It can do everything. The shape, the size, the moves. Watch." Her Ditto becomes your lead. It\'s perfect. Then it turns round. Two dots and a line. "And they laugh. Right at the sad bit. So we stopped. It thinks it\'s its fault. It isn\'t. I don\'t know how to tell it that in a way it\'d believe."',
    [c('Battle the copy.', o('The Ditto copies your lead. Dot eyes.', s.open('p1'))), c('Leave her the stage.', o('She sits on the edge of it a while longer.'))]);
  praise('p1', 'p2', 'Dot eyes.');
  praise('p2', 'p3', 'The eyes are the right colour.');
  praise('p3', 'done', 'The right shape, held for a few seconds.');
  s.room('done', 'The House of Imitation: Complete', 'Complete. Your lead looks at it, and can\'t tell either. Duplica\'s standing up. She hasn\'t breathed.',
    [c('Applaud.', o('"...It was never that it couldn\'t. It was that it was watching their faces." She reopens. Front-row seats. And a second Ditto she\'s been training.', join(['ditto']), flag('kanto-saffron-imite'), moment('Watched a Ditto get the face right, in the front row, at the House of Imitation.')))]);
}

// ---------- The Admissions Exam (anime; no badge, no League entry)
{
  const s = space(E, { id: 'cs.kanto.saffron.exam', town: 'saffron', name: 'The Admissions Exam', kind: 'EV', appears: 'roll', flags: ['kanto.saffron.exam'], section: `${DOC}: The Admissions Exam`,
    placed: { stage: [6], home: 12, window: [10, 14], sits: 'door', attaches: 'instead', badge: 'A pencil and a tick', level: 0, often: 'Once per run' } });
  const mark = (n = 1) => flag('kanto-exam-marks', n);
  const Q: [string, string, string[]][] = [
    ['A circle, seen from above.', 'Jigglypuff.', ['Voltorb.', 'Poké Ball.']], ['Fire against Grass?', 'Double.', ['Half.', 'Normal.']],
    ['Psychic against Fighting?', 'Double.', ['Half.', 'Nothing.']], ['Water against Dragon?', 'Half.', ['Double.', 'Normal.']], ['Ghost against Psychic?', 'Double.', ['Nothing.', 'Half.']],
  ];
  Q.forEach(([ask, right, wrong], i) => s.room(`q${i + 1}`, `The Admissions Exam: Question ${i + 1}`, ask,
    [c(right, o('He makes a mark.', mark(), s.open(`q${i + 2}`))), ...wrong.map((w) => c(w, o('He makes a different mark.', s.open(`q${i + 2}`))))]));
  s.entry('The Admissions Exam',
    'A hall of desks. A clock. An instructor who\'s failed every candidate this year and takes no pleasure in it. Mr. Percival Wickham: "Pencils down means down. Nobody passes. I tell them that at the start, and they sit it anyway. I find that either very stupid or the entire point." Six questions.',
    [c('Sit it.', o('Pencils up.', s.open('q1'))), c('Walk out.', o('"Most do. The honest ones."'))]);
  s.room('q6', 'The Admissions Exam: The Trick Question', '"True or false: a Pokémon that\'s lost can\'t have been well trained."',
    [c('True.', o('Marked wrong.', s.open('practical'))), c('False.', o('Marked wrong.', s.open('practical'))), c('In the margin: "It depends on what it learned."', o('The only one he ticks.', mark(), s.open('practical')))]);
  s.room('practical', 'The Admissions Exam: The Practical', 'Three Pokémon you\'ve never used, against his three. Each has a quirk on its card: "Won\'t use its strongest move unless thanked first."',
    [c('Battle.', battle('His three, carefully chosen.', foe('Mr. Wickham', { team: ['alakazam', 'machoke', 'magneton'], size: 3, levelBonus: s.lv, win: [s.open('result')], lose: [s.open('fail')] })))]);
  s.room('result', 'The Admissions Exam: Results', 'He checks the paper twice.',
    [c('Pass.', o('A certificate. A bundle of candy. "First this year. Don\'t let it go to your head. It\'s already gone to mine."', item('rare-candy', 3), flag('kanto-saffron-exam'), moment('Passed the Admissions Exam: the first this year.')), { requires: [is('kanto-exam-marks', 4)] }),
      c('Not enough marks.', o('He goes through every wrong answer, and why.', intel(), flag('kanto-saffron-exam')), { requires: [is('kanto-exam-marks', 0, 3)] })]);
  s.room('fail', 'The Admissions Exam: Fail', 'He goes through every wrong answer, and why. Each one sticks.', [c('Listen.', o('It\'s the best lesson you\'ve had in Kanto.', intel(), intel(), flag('kanto-saffron-exam')))]);
}

// ---------- The Teleport Girl (a nod to the city's Abra; Stages 6 to 8)
{
  const s = space(E, { id: 'cs.kanto.saffron.teleport', town: 'saffron', name: 'The Teleport Girl', kind: 'SHOP', appears: 'always', flags: [], section: `${DOC}: The Teleport Girl`,
    placed: { stage: [6, 7, 8], home: 4, sits: 'plus', attaches: 'town', badge: 'A closed eye', level: null, often: 'As often as it\'s paid for' } });
  const trip = (label: string, text: string, ...x: Json[]) => buy(label, 1500, `${text} On return: the Abra hasn\'t moved. There\'s a souvenir sticker on its forehead. Winnie: "He does that. I don\'t know when."`, ...x);
  s.entry('The Teleport Girl',
    'Winnie: "Where to? He\'s been everywhere you\'ve been. He just hasn\'t been awake for any of it." The Abra on her shoulder is asleep. It stays asleep. Only shops; no events are replayed, and nothing\'s skipped. It takes no node.',
    [trip('Pewter\'s shop', 'Rocks, and a Hard Stone.', item('hard-stone')), trip('Cerulean\'s shop', 'Bait, and a Mystic Water.', item('mystic-water')),
      trip('Celadon\'s shop', 'Seven floors, and a Great Ball or two.', item('great-ball', 3)), c('"Not today."', o('The Abra sleeps on.'))]);
}

// ---------- The Seam (manga; Trigger: Team Rocket's awake)
{
  const s = space(E, { id: 'cs.kanto.saffron.seam', town: 'saffron', name: 'The Seam', kind: 'EV', appears: 'trigger', flags: ['kanto.seam.watched', 'kanto.seam.freed', 'kanto.seam.knocked', 'kanto.saffron.seam'], section: `${DOC}: The Seam`,
    placed: { stage: [6], home: 2, sits: 'must', attaches: 'before', badge: 'A bent line', level: 1, often: 'Once per run (it never blocks the stage)' } });
  s.entry('The Seam',
    'The road into the city, and then the road stops being where it is. The air\'s got a shimmer on it, like heat, in the cold. Your hand goes flat against nothing. Walking the edge: a place where the light bends at a corner. Behind it, a Mr. Mime, both hands up, shaking with the effort. Beside it, a scientist asleep in a folding chair with a clipboard on his chest. The Mr. Mime sees you. It doesn\'t lower its hands. Its eyes say: I can\'t.',
    [c('"Watch. Learn how it\'s done."', o('You learn what an anchor looks like. In the climax, you\'ll know them on sight. The wall thins enough to pass.', flag('kanto-seam-watched'), intel(), flag('kanto-saffron-seam'))),
      c('"Wake him."', battle('He wakes swinging.', foe('Silph Scientist', { team: ['magnemite', 'voltorb'], size: 2, levelBonus: s.lv, win: [heat(5), flag('kanto-seam-freed'), flag('kanto-saffron-seam')], lose: [flag('kanto-saffron-seam')] }))),
      c('Mime a door, and knock on it.', o('The Mr. Mime laughs, despite everything. The wall flickers. It\'s a small thing. It remembers it.', flag('kanto-seam-knocked'), ...kind(), flag('kanto-saffron-seam')))], { requires: [rocket] });
}

// ---------- Pidgey Post (an errand over three towns)
{
  const s = space(E, { id: 'cs.kanto.saffron.post', town: 'saffron', name: 'Pidgey Post', kind: 'EV', appears: 'roll', flags: ['kanto.saffron.post'], section: `${DOC}: Pidgey Post`,
    placed: { stage: [6], home: 5, sits: 'town', attaches: 'town', badge: 'An envelope with wings', level: null, often: 'Once per run' } });
  const post = (n: number, title: string, text: string, ...x: Json[]) => s.room(`l${n}`, `Pidgey Post: Letter ${n}`, title,
    [c('Hand it over.', o(text, ...x, flag('kanto-saffron-post'), ...(n < 3 ? [{ kind: 'laterEvent', eventId: s.id(`l${n + 1}`), nodes: 3 }] : [s.open('done')])))], later());
  s.entry('Pidgey Post',
    'A post office with forty Pidgey asleep on every surface, heads under wings. The postmaster, Mrs. Zenobia Finnegan: "The roads are shut, so it all goes by wing, and there\'s only so much wing. Three letters. You\'re going that way regardless. I can pay in gratitude, and the gratitude of strangers, which is better."',
    [c('Take the three letters.', o('Three envelopes, warm from a Pidgey.', { kind: 'laterEvent', eventId: s.id('l1'), nodes: 2 })), c('"Not this time."', o('Forty Pidgey go on sleeping.'))]);
  post(1, 'An old man.', '"\'I\'m sorry it\'s been so long. I didn\'t know how to start, so I\'ve started.\' ...Forty years. He\'s started." A Berry.', item('oran-berry'));
  post(2, 'A shopkeeper.', '"\'The cheque\'s in the post.\' It is the post. There\'s no cheque." A tip, out of spite.', cash(300));
  post(3, 'A child.', '"It\'s from my Pidgey. It\'s just a footprint. It\'s the right footprint." A rumour about the road ahead.', { kind: 'revealStops' });
  s.room('done', 'Pidgey Post: All Three', 'The postmaster\'s own Pidgeotto lands on your shoulder.',
    [c('Accept its offer.', o('It offers to carry one message for you, anywhere in Kanto: help will reach you a node early, once.', fr(3), moment('Delivered all three Pidgey Post letters.')))], later());
}

// ============================================================ CINNABAR ISLAND (Stage 7)

// ---------- The Riddle Inn (anime)
{
  const s = space(E, { id: 'cs.kanto.cinnabar.inn', town: 'cinnabar', name: 'The Riddle Inn', kind: 'EV', appears: 'roll', flags: ['kanto.inn.board', 'kanto.cinnabar.inn'], section: `${DOC}: The Riddle Inn`,
    placed: { stage: [7], home: 14, sits: 'town', attaches: 'town', badge: 'A question mark with a moustache', level: null, often: 'Once per run' } });
  const right = (n = 1) => flag('kanto-inn-riddles', n);
  const R: [string, string, string[], string][] = [
    ['"Where you\'d put a firefighter, to keep them busy."', 'The volcano.', ['The harbour.', 'The Gym.'], 'kanto-inn-hint-volcano'],
    ['"I\'m old, and stone, and I get up if you\'re kind to me."', 'A fossil.', ['A Geodude.', 'A gravestone.'], 'kanto-inn-hint-fossil'],
    ['"It burned down, and it\'s still got a cellar full of secrets."', 'The Mansion.', ['The Lab.', 'The inn.'], 'kanto-inn-hint-mansion'],
  ];
  R.forEach(([ask, ans, wrong], i) => s.room(`r${i + 1}`, `The Riddle Inn: Riddle ${i + 1}`, ask,
    [c(ans, o('"Correct!" The wig slips a little.', right(), intel(), s.open(i < 2 ? `r${i + 2}` : 'night'))), ...wrong.map((w) => c(w, o('"Hm. No." The wig stays put.', s.open(i < 2 ? `r${i + 2}` : 'night'))))]));
  s.entry('The Riddle Inn',
    'Every hotel has a sign: FULL. Tourists with cameras. A souvenir stall selling volcano-shaped hats. A bald man in a wig that\'s facing slightly the wrong way: "A room? There\'s one. Answer three, and it\'s free. My Gym\'s— I mean: my inn\'s where you put firefighters. What\'s my inn?" Behind him, a notice board: a map, with one building circled, and a note: "ANSWERS, IN CASE I FORGET."',
    [c('"Ask away."', o('He clears his throat.', s.open('r1'))), c('Read the notice board first.', o('All three answers, circled.', flag('kanto-inn-board'), s.open('r1'))), c('Sleep on the beach.', o('The stars are very good from the beach.'))]);
  s.room('night', 'The Riddle Inn: The Night', 'He counts on his fingers.',
    [c('All three.', o('A free night: a full rest. TM Fire Blast, "left by a previous guest." "He was a hot-headed man. Bald. Very handsome."', heal(1), teach('fire-blast'), flag('kanto-cinnabar-inn')), { requires: [is('kanto-inn-riddles', 3)] }),
      c('Fewer.', o('A room over the kitchen. Half a rest. The wig\'s fallen off by breakfast, and nobody mentions it.', heal(0.5), flag('kanto-cinnabar-inn')), { requires: [is('kanto-inn-riddles', 0, 2)] })]);
}

// ---------- The Sleeper on the Beach (anime)
{
  const s = space(E, { id: 'cs.kanto.cinnabar.sleeper', town: 'cinnabar', name: 'The Sleeper on the Beach', kind: 'EV', appears: 'roll', flags: ['kanto.cinnabar.sleeper'], section: `${DOC}: The Sleeper on the Beach`,
    placed: { stage: [7], home: 5, window: [3, 7], sits: 'door', attaches: 'instead', badge: 'A shell with "Zzz"', level: null, often: 'Once per run' } });
  const pop = (lead: string, ...x: Json[]) => o(lead + ' Pop. A Jigglypuff, furious, with a marker pen. It looks at forty sleeping faces. It\'s the best day of its life. The Blastoise wakes, with a moustache drawn on.', ...x, s.open('woke'));
  s.entry('The Sleeper on the Beach',
    'A sandbar. Forty Squirtle and Wartortle, asleep in heaps. In the middle, a Blastoise on its back, snoring out of one cannon. The other cannon\'s blocked by something round and pink. A Wartortle, the only one awake, pulls at your sleeve. It points. It mimes: singing. Then: falling over. From inside the cannon, muffled, a song. Getting close puts things to sleep.',
    [c('Send one that can\'t sleep.', pop('It walks up and pulls. Done.'), { requires: [{ kind: 'partyAbility', abilities: ['insomnia', 'vital-spirit', 'soundproof'], label: 'Insomnia, Vital Spirit or Soundproof' }] }),
      c('Send anything else (three attempts).', pop('One step nearer each time, and a turn asleep on the sand each time. On the third, it\'s close enough.')),
      c('Go yourself, fingers in your ears.', pop('It works. Your lead is very impressed.', fr(3, 'lead')))], { remembers: [{ id: 'song', when: [is('kanto-song-missed'), not('kanto-song-awake')], notice: 'In the background, on a rock with its marker pen: the Jigglypuff from the road. It has seen you.', addChoices: [c('Sit down in front of the Jigglypuff. Stay awake this time.', o('It clears its throat, very slowly, watching you.', { kind: 'addEvent', eventId: 'cs-kanto-route-song-v1' }))] }] });
  s.room('woke', 'The Sleeper on the Beach: Awake', 'The Blastoise sits up, and forty Squirtle and Wartortle wake round it.',
    [c('Say goodbye.', o('A Wartortle from the island asks to come.', join(['wartortle']), flag('kanto-cinnabar-sleeper'), moment('Pulled a Jigglypuff out of a Blastoise\'s cannon.')), { requires: [{ kind: 'partyLine', species: 'squirtle', absent: true }] }),
      c('Say goodbye.', o('The Wartortle that was awake has sunglasses in its shell. It puts them on.', flag('kanto-cinnabar-sleeper')), { requires: [{ kind: 'partyLine', species: 'squirtle' }] })]);
}

// ---------- The Backlog (in Cinnabar Lab; always)
{
  const s = space(E, { id: 'cs.kanto.cinnabar.backlog', town: 'cinnabar', name: 'The Backlog', kind: 'EV', appears: 'always', parent: 'cs.kanto.cinnabar.lab', flags: ['kanto.cinnabar.backlog'], section: `${DOC}: The Backlog`,
    placed: { stage: [7], home: 10, sits: 'plus', attaches: 'plus', badge: 'None', level: null, often: 'Once per run (a room of Cinnabar Lab)' } });
  const home = (label: string, mon: string[]) => c(label, o('He does it now. It wakes to a face it doesn\'t know, and decides it\'ll do.', join(mon, { levelBonus: -2 }), flag('kanto-cinnabar-backlog'), moment('Gave an unclaimed fossil a home, from the Cinnabar Lab\'s shelf.')));
  s.entry('The Backlog',
    'Dr. Yarrow: "I had four assistants. One left for the sea, two for the volcano, and one I think I may have revived by mistake. So there\'s a queue." A shelf. Three fossils, each with a paper tag: "UNCLAIMED." "Their finders never came back. I can wake them. I can\'t keep them. I\'ve a flat. If you\'d give one a home, I\'ll do it now."',
    [home('The Omanyte.', ['omanyte']), home('The Kabuto.', ['kabuto']),
      c('The one with no label.', o('"No idea. Could be anything. That\'s the charm. That\'s also the risk."', join(['lileep', 'anorith', 'cranidos', 'shieldon', 'tirtouga', 'archen', 'tyrunt', 'amaura', 'aerodactyl'], { levelBonus: -2 }), flag('kanto-cinnabar-backlog'))),
      c('Back to the hall.', o('The shelf waits.', { kind: 'addEvent', eventId: 'cs-kanto-cinnabar-lab-hall' }))]);
}

// ---------- The Trade Wing (in Cinnabar Lab; always; replaces Lab Trades)
{
  const s = space(E, { id: 'cs.kanto.cinnabar.trades', town: 'cinnabar', name: 'The Trade Wing', kind: 'SHOP', appears: 'always', parent: 'cs.kanto.cinnabar.lab', flags: ['kanto.cinnabar.trades'], section: `${DOC}: The Trade Wing`,
    placed: { stage: [7], home: 10, sits: 'plus', attaches: 'plus', badge: 'None', level: null, often: 'Once per run (a room of Cinnabar Lab)' } });
  const swap = (who: string, wants: string, gets: string, nick: string, held: string, line = '') => c(`${who}: a ${wants[0]!.toUpperCase()}${wants.slice(1)} for "${nick}".`,
    o(`A ${gets[0]!.toUpperCase()}${gets.slice(1)} called "${nick}", holding a ${held.replace('-', ' ')}. ${line}`.trim(), { kind: 'tradeFor', want: { label: `a ${wants}`, species: [wants] }, table: { [wants]: gets } }, item(held), flag('kanto-cinnabar-trades')),
    { requires: [{ kind: 'partySpecies', species: wants }] });
  s.entry('The Trade Wing',
    'Three researchers; each wants one common Pokémon and offers one uncommon one. The Honest Trade Card is shown for each. A traded Pokémon arrives with its nickname and its item.',
    [swap('Dr. Lettice Larkspur', 'raticate', 'electrode', 'Doris', 'magnet'), swap('Mr. Erasmus Plumb', 'venonat', 'tangela', 'Crinkles', 'miracle-seed', 'Mr. Plumb: "He\'s called Crinkles. You can\'t change it. Well. You can. He\'ll know."'),
      swap('Miss Millicent Roe', 'ponyta', 'seel', 'Seelor', 'mystic-water'), c('Back to the hall.', o('The researchers go back to their notes.', { kind: 'addEvent', eventId: 'cs-kanto-cinnabar-lab-hall' }))]);
}

// ---------- The Big Wave (anime; Pseudo Stage: three sets)
{
  const s = space(E, { id: 'cs.kanto.cinnabar.wave', town: 'cinnabar', name: 'The Big Wave', kind: 'PS', appears: 'roll', flags: ['kanto.cinnabar.wave'], section: `${DOC}: The Big Wave`,
    placed: { stage: [7], home: 11, window: [9, 13], sits: 'door', attaches: 'instead', badge: 'A wave and a flag', level: null, often: 'Once per run' },
    ps: { name: 'The Big Wave', themeId: 'water-ice', mood: 'the sea going back a long way, and then standing up' } });
  const set = (id: string, next: string, title: string, text: string) => s.room(id, `The Big Wave: ${title}`, text,
    [c('Ride it (a Water type as the board).', o('A Water type forgives one mistake.', s.open(next)), { pick: { types: ['water'] } }),
      c('Ride it.', o('You stay up.', s.open(next)), { prompt: ['tilt-drag', 'ok'], pick: {}, fail: o('You\'re fished out by the collar. "There\'s always another wave." This run, there isn\'t.', flag('kanto-cinnabar-wave')) })]);
  s.entry('The Big Wave',
    'A beach on the Seafoam side. A rock offshore with two flags on it. An old man waxing a board, and a Pikachu with blue eyes standing at the waterline with its ears up. Victor: "She feels them. Before they stand up. She\'s been twitchy since Tuesday. Twenty years ago, a fellow put that first flag there. Forty years ago, the fellow who taught him. I\'ve been out every big day since, and come back on my face." You ride it with one of your own Pokémon as the board.',
    [c('Paddle out.', o('Small waves first. Learn to lean.', s.open('s1'))), c('Watch from the beach.', o('The Pikachu calls every rise a beat early. Nobody goes out.'))]);
  set('s1', 's2', 'Set One', 'Small waves. Learn to lean.');
  set('s2', 's3', 'Set Two', 'The reef. Lean, and duck.');
  set('s3', 'flag', 'The Wave', 'The sea goes back. A long way back. Then it stands up. The blue-eyed Pikachu rides on the nose and calls each rise a beat early, if you listen.');
  s.room('flag', 'The Big Wave: The Flag', 'The top. The whole island\'s below. The rock, and the two flags, coming up fast.',
    [c('Plant it.', o('Victor plants your flag on the rock beside the two others. He does it himself; he\'s waded out. "Wasn\'t ever going to be mine. I worked that out about ten years back. I just wanted to see who."', teach('surf', { species: 'pikachu' }), fr(10, 'picked'), flag('kanto-cinnabar-wave'), moment('Rode the twenty-year wave, and Victor planted the flag.')))]);
}

// ---------- The Vial (manga; Trigger: Team Rocket's awake)
{
  const s = space(E, { id: 'cs.kanto.cinnabar.vial', town: 'cinnabar', name: 'The Vial', kind: 'EV', appears: 'trigger', flags: ['kanto.m2.vial', 'kanto.cinnabar.vial'], section: `${DOC}: The Vial`,
    placed: { stage: [7], home: 17, window: [15, 18], sits: 'optional', attaches: 'after', badge: 'A stoppered tube', level: null, often: 'Once per run' } });
  const carry = [intel(), intel(), intel(), intel(), intel(), flag('kanto-m2-vial'), flag('kanto-cinnabar-vial'), moment('Carried a sealed vial for an old man who couldn\'t take the boat.')];
  s.entry('The Vial',
    'The lip of the crater road. An old man sitting on the wall, with one sleeve rolled down in the heat. "You\'re going back across. I\'m not. They watch the boats for me. Would you carry something? It\'s small. It\'s the heaviest thing I own." A sealed vial. Something in it that moves toward his hand when he holds it. "I made a thing for them, once. I was clever, and I was flattered, and I didn\'t ask what for. This is a piece of what I put in. It\'s the only thing it still answers to."',
    [c('"I\'ll carry it."', o('It\'s warm. It leans toward him as you walk away.', ...carry)),
      c('"What did you make?"', o('"Something that asks questions. I\'d have liked it, if I\'d met it another way."', ...carry)),
      c('"Why not destroy it?"', o('"Because one day somebody will need it to listen. I\'d rather that was possible."', ...carry))],
    { requires: [rocket], remembers: [{ id: 'inn', when: [is('kanto-cinnabar-inn')], notice: 'It\'s the innkeeper, without the wig. He doesn\'t do a riddle. Your lead notices before you do.' },
      { id: 'diary', when: [is('kanto-mansion-diary')], notice: 'The handwriting on the label is the handwriting on page 3 of the Mansion diary.' }] });
}

// ============================================================ THE ROAD TO INDIGO PLATEAU

// ---------- The Torch (anime; a road space at Stage 8)
{
  const s = space(E, { id: 'cs.kanto.indigo.torch', town: 'route', name: 'The Torch', kind: 'EV', appears: 'route', flags: ['kanto.indigo.torch'], section: `${DOC}: The Torch`,
    placed: { stage: [8], home: 17, sits: 'optional', attaches: 'before', badge: 'A torch', level: 1, often: 'Once per run' } });
  road(s.id(), [8], 0.6);
  s.entry('The Torch',
    'A runner, bent double at the roadside, holding a lit torch at arm\'s length as if it might notice she\'s stopped. "It\'s from the bird\'s own fire. It\'s gone hand to hand from the mountain. My handover\'s not here. It can\'t stop. Take it. To the next marker. Don\'t let it go out, and don\'t let it think you\'re frightened." The trio want it. Jessie: "It\'s a priceless relic!" James: "It\'s a very good lighter." Meowth: "The boss likes a candle. Look, we want it. Stop askin\' why."',
    [c('Take the torch.', battle('One battle, with the torch in one hand. The flame leans the way the battle\'s going.',
      foe('Jessie and James', { team: ['arbok', 'weezing', 'meowth'], size: 3, levelBonus: s.lv, win: [s.open('marker')], lose: [s.open('out')] }), flag('kanto-trio-met'))),
      c('"Keep running. I\'ll walk beside you."', o('She keeps running. You keep up for a mile. The trio don\'t try it with two of you.', fr(3), flag('kanto-indigo-torch')))]);
  s.room('marker', 'The Torch: The Marker', 'The next marker, and the next runner, hands out.',
    [c('Hand it over.', o('Delivered. A charm on a cord, still warm from the handle: Fire moves burn a little brighter.', item('charcoal'), flag('kanto-indigo-torch'), moment('Carried the bird\'s fire one marker nearer the Plateau.')))]);
  s.room('out', 'The Torch: It Goes Out', 'It goes out.',
    [c('Stand there.', o('A very old man relights it from a lantern he\'s been carrying for this exact purpose. "Every year. Somebody drops it every year. I\'ve stopped saying."', flag('kanto-indigo-torch')))]);
}

// ---------- The Boulder Hall (the games' Strength puzzles; Victory Road's three boulder rooms in full)
{
  const s = space(E, { id: 'cs.kanto.indigo.boulders', town: 'indigo', name: 'The Boulder Hall', kind: 'EV', appears: 'always', parent: 'cs.kanto.indigo.road', flags: ['kanto.moltres.sighting', 'kanto.indigo.boulders'], section: `${DOC}: The Boulder Hall`,
    placed: { stage: [8], home: 20, sits: 'door', attaches: 'after', badge: 'None', level: null, often: 'Once per run (Victory Road\'s nodes 2, 4 and 6)' } });
  const road8 = (n: string): Json => ({ kind: 'addEvent', eventId: `cs-kanto-indigo-road-${n}` });
  const pushed = fr(5, 'picked');
  s.entry('The Boulder Hall: Room 1', 'Both boulders, both plates: a second door. Whoever does the pushing enjoys it more than it should.',
    [c('Push both.', o('A second door, and behind it a Star Piece someone hid and forgot.', item('star-piece'), pushed, road8('n3')), { requires: [strength], pick: {} }),
      c('Two smaller ones push together.', o('An extra move per boulder. A second door, and a Star Piece.', item('star-piece'), fr(3, 'party'), road8('n3')))], { room: true }); // a room of Victory Road's map: the hall's boulders sit beside the plates
  s.room('r2', 'The Boulder Hall: Room 2', 'Dropped through the hole, then pushed again downstairs.',
    [c('Push it twice.', o('Downstairs, behind where it was, a TM: Earthquake.', teach('earthquake'), pushed, road8('n5')), { requires: [strength], pick: {} }),
      c('Two smaller ones push together.', o('Slowly. Downstairs, a TM: Earthquake.', teach('earthquake'), fr(3, 'party'), road8('n5')))]);
  s.room('r3', 'The Boulder Hall: Room 3', 'All three, in the order the scratches on the floor show.',
    [c('Follow the scratches.', o('A side door. A ledge. A nest of scorched stones, big enough to lie down in. One feather in it, still warm. A Moltres Sighting.', flag('kanto-moltres-sighting'), flag('kanto-indigo-boulders'), pushed, road8('n6b')), { requires: [strength], pick: {} }),
      c('Two smaller ones push together.', o('Three boulders, slowly. The nest, and one warm feather.', flag('kanto-moltres-sighting'), flag('kanto-indigo-boulders'), fr(3, 'party'), road8('n6b')))]);
}

// ---------- The Village at the Gate (the finale's Town node: on the League's second fight, after Victory Road on the first)
{
  const s = space(E, { id: 'cs.kanto.indigo.village', town: 'indigo', name: 'The Village at the Gate', kind: 'HUB', appears: 'always', flags: ['kanto.indigo.village'], section: `${DOC}: The Village at the Gate`,
    placed: { stage: [8], home: 20, sits: 'hub', attaches: 'town', badge: 'A gate', level: null, often: 'Once per run' } });
  const hub = [
    c('The noodle cart.', o('A full rest. The cook\'s got eight flavours, one for each Badge; he gives you the one for the stage you found hardest. He\'s right.', heal(1), s.open('hub'))),
    c('The badge painter.', o('He paints your eight on the back of your jacket. He paints a ninth circle, empty. "For the next one. There\'s always a next one."', s.open('hub'))),
    c('The board.', o('Cork, by the gate. Hundreds of things pinned to it. A ribbon. A ticket. Half a fossil. A photograph of three stars in a daytime sky. A drawing of a Pidgey with the ears wrong.', s.open('board'))),
    c('Go in.', o('The great gate.', flag('kanto-indigo-village'))),
  ];
  s.entry('The Village at the Gate', 'Outside the great gate, a fair that never quite packs up. Souvenir stalls, a noodle cart, a badge painter, a little stage where a Jigglypuff sometimes sings, benches of trainers comparing routes, and a board. On the benches, people this run has met.',
    hub, { remembers: [{ id: 'aj', when: [is('kanto-cerulean-aj')], notice: 'AJ is on a bench with his board. It says 98 WINS, and something else under it.' }, { id: 'giselle', when: [is('kanto-cerulean-tech')], notice: 'Giselle, with her blister, delighted about it.' }] });
  s.room('hub', 'The Village at the Gate', 'The fair, and the gate behind it.', hub);
  s.room('board', 'The Village at the Gate: The Board', 'You may pin one thing from the journey.',
    [c('Pin a moment from this run.', o('You pin it at eye level. It\'ll be there as long as this journey is.', fr(3), flag('kanto-indigo-village'), moment('Pinned something from the journey to the board by the Indigo gate.'), s.open('hub'))),
      c('"Not yet."', o('The board waits.', s.open('hub'))), c('Read the board.', o('A hundred trainers\' journeys, one line each. Some got further than you. Some didn\'t get this far.', s.open('hub')))], { remembers: [{ id: 'song', when: [is('kanto-song-missed'), not('kanto-song-awake')], notice: 'In the background, on a rock with its marker pen: the Jigglypuff from the road. It has seen you.', addChoices: [c('Sit down in front of the Jigglypuff. Stay awake this time.', o('It clears its throat, very slowly, watching you.', { kind: 'addEvent', eventId: 'cs-kanto-route-song-v1' }))] }] });
}

export const REMOVE: string[] = retired(EVENTS);
void [EXTRA, SPACES, buy, typed, temp, kc, has, not, wild];
