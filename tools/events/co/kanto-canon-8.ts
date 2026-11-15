// Kanto Canon Spaces, KANTO_PLACED_6.md (Volume II, the second helping of 25): eight in the towns, twelve on the roads, five on
// the Sevii Islands. Lines kept word for word; the text around them is longer and warmer. Same-run memory only (Kice): the
// Building Site's bricks, the Professor's later visits and the Bicycle Race's "year of free food" stay inside this run.
import type { Json } from '../dsl.ts';
import { eid, road, followup, later, battle, c, cash, flag, foe, fr, heal, is, item, join, moment, not, o, space, teach, temp, wild } from './_kc.ts';

export const CATEGORY = 'kanto-canon';
export const EVENTS: Json[] = [];
const E = EVENTS;
const DOC = 'KANTO_PLACED_6';
const rep = (n = 1): Json => flag('rep', n);
const trio = (n: number): Json => flag('kanto-trio-rep', n);
const go = (sp: string, suffix = ''): Json => ({ kind: 'addEvent', eventId: eid(sp, suffix) });
const bond = (n: number, who: string): Json => ({ kind: 'friendship', amount: 0, bond: n, who });
const bondAt = (n: number, who = 'lead'): Json => ({ kind: 'bondLevel', atLeast: n, who });
const typed = (type: string): Json => ({ kind: 'partyType', type });
const species = (sp: string): Json => ({ kind: 'partyLine', species: sp });

// ============================================================ IN THE TOWNS

// ---------- The Kind Stranger (manga; Viridian Forest, Stage 1)
{
  const s = space(E, { id: 'cs.kanto.pewter.stranger', town: 'route', name: 'The Kind Stranger', kind: 'EV', appears: 'route', flags: ['kanto.pewter.stranger'], section: `${DOC}: The Kind Stranger`,
    placed: { stage: [1], home: 6, window: [4, 9], sits: 'optional', attaches: 'before', badge: 'None: he\'s met', level: null, often: 'Once per run', tags: ['forest'] } });
  road(s.id(), [1], 0.4);
  const gift = (lead: string) => o(`${lead} He asks about each of your Pokémon, with real interest, and listens to the answers: where it was met, what it's good at, what it's afraid of. Of whichever's weakest: "That one'll surprise you. The ones that start behind have further to go. I've always thought further was the point." He shows you the way out past the oak. He doesn't give his name.`,
    { kind: 'cure' }, { kind: 'skipAhead' }, temp('Make it move: Speed doubled against the next boss', [{ kind: 'statMultiplier', stat: 'spe', value: 2 }], 1, 'boss'), flag('kanto-pewter-stranger'), moment('Met a well-dressed man in Viridian Forest. He gave advice about Ground types, and no name.'));
  s.entry('The Kind Stranger',
    `The path's forked three times, and the third fork looks like the first. A man in a very good suit is coming the other way, with a walking stick, as if it's a park. The stranger: "You've gone round twice. So did I, the first time; it's the oak. Everybody turns at the oak. Is that one poisoned? Here." An Antidote, from an inside pocket. He crouches to give it himself, without minding the suit. "What's its name? ...And did it choose you, or you it? ...Ah. That's the better way round."`,
    [c('"Who are you?"', gift('"A man out for a walk." He smiles. It\'s a real one.')), c('"Which way\'s out?"', gift('"Left at the oak. Everybody goes right."')),
      c('"Do you train?"', gift('"I did. I keep a few. Ground types. People think they\'re slow. They\'re patient. If one\'s ever facing you, don\'t wait for it to make a mistake. It won\'t. Make it move."'))]);
}

// ---------- Visitors (anime; Stage 1, two parts)
{
  const s = space(E, { id: 'cs.kanto.pewter.visitors', town: 'route', name: 'Visitors', kind: 'EV', appears: 'route', flags: ['kanto.pewter.visitors'], section: `${DOC}: Visitors`,
    placed: { stage: [1], home: 10, window: [8, 13], sits: 'optional', attaches: 'after', badge: 'A kettle with stars round it', level: null, often: 'Once per run' } });
  road(s.id(), [1], 0.35);
  s.entry('Visitors',
    `A town with no clocks. No kettles. A bicycle with no bell. Your bag is one item lighter. Something's been taken. You'll get it back. A man in a hat made of foil, Mr. Oswald Peake: "It's them. I've said for years. They take metal. They take things that tick. Do you know what ticks? Ships. I'm not frightened. I'm thrilled."`,
    [c('Follow the trail.', o('Small round footprints. A dropped teaspoon. A cave, the next node on.', { kind: 'laterEvent', eventId: s.id('cave'), nodes: 1 }))]);
  const launch = (lead: string, ...x: Json[]) => c(lead, o('A sound like every kettle in town coming to the boil at once. It goes up. It really does. It comes down again, in the pond, gently. They climb out, wet, and look at the sky, and start collecting kettles. Your item comes back, and a Comet Shard, and a Clefairy that\'s decided to stay on the ground asks to come.',
    ...x, item('comet-shard'), join(['clefairy']), flag('kanto-pewter-visitors'), moment('Watched the Clefairy\'s kettle ship go up, and come down in the pond.')),
    { chance: 0.4, fail: o('A sound like every kettle in town coming to the boil at once. It goes up. It really does. It keeps going. It\'s a new star for about a minute, low in the west. Your item comes back, handed down politely, and a Comet Shard.', ...x, item('comet-shard'), flag('kanto-pewter-visitors'), moment('Watched a new star made of kettles, low in the west, for about a minute.')) });
  s.room('cave', 'Visitors: The Cave', 'Inside: Clefairy, dozens, in a chain, passing things hand to hand. In the middle, as high as a house: kettles, clocks, a weathervane, a bathtub, a bicycle bell at the very top, all fitted together into something with fins. One of them\'s holding your item up against a gap, to see if it fits. It doesn\'t. It hands it back, politely, and takes a doorknob instead. It launches whether or not you interfere.',
    [launch('"Stop them."'), launch('Help. (Hand up the next piece.)', fr(3, 'party')),
      launch('"Fetch Mr. Peake. He should see this."', moment('Mr. Peake: "They were here. The whole time. They weren\'t coming. They were leaving. ...I\'d have helped. I\'ve a very good kettle."'))], later());
}

// ---------- Triage (anime; Stage 3, a sorting game of six)
{
  const s = space(E, { id: 'cs.kanto.vermilion.triage', town: 'vermilion', name: 'Triage', kind: 'EV', appears: 'roll', flags: ['kanto.vermilion.triage'], section: `${DOC}: Triage`,
    placed: { stage: [3], home: 12, window: [10, 14], sits: 'plus', attaches: 'plus', badge: 'A stethoscope', level: null, often: 'Once per run' } });
  type Call = 'First.' | 'Can wait.' | 'Only frightened.';
  const P: [string, Call][] = [
    ['A Dodrio, one head drooping. The other two heads are holding it up.', 'First.'],
    ['A Cubone, howling. The Chansey pats it and moves on.', 'Only frightened.'],
    ['A Weepinbell, very quiet. Its trainer: "It\'s fine, it\'s being good."', 'First.'],
    ['A Raticate with a split tooth. It\'s eating a chair.', 'Can wait.'],
    ['A Sandslash that won\'t uncurl. It uncurls for its trainer\'s voice.', 'Only frightened.'],
    ['A Voltorb, sparking. Everyone\'s backed away.', 'First.'],
  ];
  const ORDER: Call[] = ['First.', 'Can wait.', 'Only frightened.'];
  s.entry('Triage',
    `A lorry on its side on the coast road. Nobody's badly hurt; it's said at once. A queue of shaken Pokémon and their people outside a door marked DR. PROCTOR. HUMANS. Dr. Proctor: "The Center's full. They've sent them to me. I do people. I've a Chansey; she does the Pokémon in the waiting room for fun. I don't know which end of a Weepinbell is the front. You're a trainer. Stand there. Tell me who's first."`,
    [c('Stand there.', o('The first patient.', s.open('p1'))), c('"I\'m not a doctor."', o('"Nor am I, for these. Stand there."', s.open('p1')))]);
  P.forEach(([tell, right], i) => s.room(`p${i + 1}`, `Triage: Patient ${i + 1}`, tell,
    ORDER.map((call) => c(i === 5 && call === 'First.' ? 'First, and gently.' : call, o(call === right ? (i === 2 ? 'Dr. Proctor, at the Weepinbell: "The quiet one. Of course. It\'s the same with people. It\'s always the one in the corner saying \'I don\'t want to be a bother.\'"' : 'Right. That saves time for the next.') : 'It costs nobody anything but minutes.',
      ...(call === right ? [flag('kanto-triage-right')] : []), s.open(i < 5 ? `p${i + 2}` : 'end'))))));
  const done = flag('kanto-vermilion-triage');
  s.room('end', 'Triage: Everyone Treated', 'Everyone\'s treated in the end.',
    [c('Six right.', o('Medicine for the road, a bundle of Lum Berries, and the Chansey teaches one of yours Soft-Boiled, or the nearest thing it can learn.', heal(1), item('lum-berry', 3), teach('soft-boiled'), done, moment('Called all six right at Dr. Proctor\'s.')), { requires: [is('kanto-triage-right', 6)] }),
      c('Four or five right.', o('Medicine for the road, and a bundle of Lum Berries.', heal(1), item('lum-berry', 3), done), { requires: [is('kanto-triage-right', 4, 5)] }),
      c('One to three right.', o('Medicine for the road.', heal(0.5), done), { requires: [is('kanto-triage-right', 1, 3)] }),
      c('None right.', o('You\'re thanked, and handed a mop.', done), { requires: [is('kanto-triage-right', 0, 0)] })]);
}

// ---------- The Building Site (the games; Stage 3, and again at Stage 8)
{
  const s = space(E, { id: 'cs.kanto.vermilion.site', town: 'vermilion', name: 'The Building Site', kind: 'EV', appears: 'always', flags: ['kanto.vermilion.site'], section: `${DOC}: The Building Site`,
    placed: { stage: [3, 8], home: 3, sits: 'town', attaches: 'town', badge: 'A flat square of earth', level: null, often: 'Once per stage' } });
  const help = (text: string) => c('"Can one of mine help?"', o(`${text} It stamps beside the Machop. They don't speak. They fall into step. A little experience, and Bond +1.`, { kind: 'levels', amount: 1, who: 'picked' }, bond(1, 'picked'), flag('kanto-vermilion-site')), { requires: [typed('fighting')], pick: { types: ['fighting'] } });
  s.entry('The Building Site', 'An empty lot. An old man. A Machop, stamping. The old man: "I\'m getting my land ready for a building." Stamp. Stamp. The Machop moves one pace left. Stamp. Flat earth.',
    [c('"What sort of building?"', o('"A good one."', flag('kanto-vermilion-site'))), c('"How long\'s it been?"', o('"Not long. Since the war."', flag('kanto-vermilion-site'))), help('Your Fighting type goes over.')]);
  s.room('again', 'The Building Site: Nearly Ready', 'The same lot, in the same run, a long way on. Flat earth. The old man: "Nearly ready." Stamp. Stamp.',
    [c('"What sort of building?"', o('"A good one. Nearly."')), help('Your Fighting type remembers the step.')], later({ requires: [is('kanto-vermilion-site')] }));
  followup(s.id('again'), [8]);
}

// ---------- The Rival in the Tower (manga; Pokémon Tower floor 3)
{
  const s = space(E, { id: 'cs.kanto.lavender.rival', town: 'lavender', name: 'The Rival in the Tower', kind: 'EV', appears: 'always', parent: 'cs.kanto.lavender.tower', flags: ['kanto.lavender.rival'], section: `${DOC}: The Rival in the Tower`,
    placed: { stage: [4], home: 4, sits: 'must', attaches: 'instead', badge: 'None', level: 1, often: 'Once per run (Pokémon Tower, floor 3)' } });
  const AFTER = `Rival: "What... why are we... how long have I been up here?" They look at their Pokémon. They can see what state they're in. "...I did that. Didn't I. I was telling them to." They don't remember it clearly, and they're embarrassed anyway.`;
  const backFx = [{ kind: 'rivalChange', feelings: { trust: 1 }, lead: 1 }, flag('kanto-lavender-rival'), moment('Brought the rival back from among the stones on the third floor.')];
  const fight = battle('The rival\'s team, commanded by something that doesn\'t know them: it uses moves they\'d never pick. Beating it lets go.', foe('Rival', { rival: true, size: 6, levelBonus: s.lv, win: [s.open('after')], lose: [s.open('after')] }));
  s.entry('The Rival in the Tower',
    'The third floor. Somebody\'s standing among the stones with their back to the stairs. It\'s the rival. They don\'t turn round. Their eyes are open. Their Pokémon are out, all of them, fighting hard, at empty air. The rival\'s lips are moving. They\'re calling moves. Their voice isn\'t quite theirs. The rival\'s lead sees you. It\'s exhausted. It looks at you the way something looks when it\'s been waiting for anyone at all.',
    [c('(Say their name.) (Warm or better)', o('They blink. The air in front of their Pokémon\'s just air.', s.open('after')), { requires: [{ kind: 'rivalState', leadAtLeast: 1 }] }),
      c('(Say their name.)', o('They turn, slowly, and it isn\'t them looking.', s.open('fight')), { requires: [{ kind: 'rivalState', leadAtMost: 0 }] }),
      c('"Battle. Snap them out of it."', fight),
      c('(Go to their lead first.)', o('Your lead stands beside it. It\'s your lead\'s cry that reaches them.', s.open('after')), { requires: [bondAt(3)] })], { room: true });
  s.room('fight', 'The Rival in the Tower: Not Them', 'Something that doesn\'t know them is calling the moves.', [c('Battle.', fight)]);
  s.room('after', 'The Rival in the Tower: After', 'The cold goes out of the floor.',
    [c('Help them up.', o(`${AFTER} They hold out the Silph Scope they came in with: "Take it. I don't want to see what was standing next to me. You look."`, item('silph-scope'), ...backFx), { requires: [{ kind: 'kc', act: 'holdsNone', ids: ['silph-scope'] }] }),
      c('Help them up. (You have a Scope.)', o(`${AFTER} They look at your Scope, and put theirs away. "Good. You look."`, ...backFx), { requires: [{ kind: 'kc', act: 'holdsAny', ids: ['silph-scope'] }] })]);
}

// ---------- The Festival of Dolls (anime; the Department Store's roof)
{
  const s = space(E, { id: 'cs.kanto.celadon.festival', town: 'celadon', name: 'The Festival of Dolls', kind: 'EV', appears: 'always', parent: 'cs.kanto.celadon.mart', flags: ['kanto.celadon.festival'], section: `${DOC}: The Festival of Dolls`,
    placed: { stage: [4], home: 11, sits: 'town', attaches: 'town', badge: 'A doll in a kimono', level: 0, often: 'Once per run (half of runs)' } });
  const round = (n: number, next: string, team: string[]) => c('Battle.', battle(`Round ${n}. No items.`, foe(`Festival Entrant ${n}`, { team, size: team.length, levelBonus: 0, win: [s.open(next)], lose: [s.open('jessie')] })));
  s.entry('The Festival of Dolls',
    `The Store, and a crowd that's all elbows. Banners: PRINCESS FESTIVAL. EVERYTHING NEARLY FREE. Miss Stott's lift is carrying nineteen people and a rug. Miss Stott: "Third! Discs! Mind the... madam, that's a person, not a step!" Shop prices are halved for this visit. On the roof: a four-battle knockout. The prize: a set of antique dolls on seven tiers. Jessie's entered. No disguise. Her own name. She's standing in front of the dolls, and she isn't scheming. James, to you, low: "She never had any. Not one. There was a year they ate snow. Don't... she'd hate that I said."`,
    [c('Enter the knockout.', o('Your name goes on the board, opposite hers.', temp('Princess Festival: shop prices halved', [{ kind: 'priceMultiplier', value: 0.5 }], 1), flag('kanto-trio-met'), s.open('r1'))),
      c('Just shop.', o('Everything nearly free.', temp('Princess Festival: shop prices halved', [{ kind: 'priceMultiplier', value: 0.5 }], 1), flag('kanto-celadon-festival')))], { room: true });
  s.room('r1', 'The Festival of Dolls: Round 1', 'A girl with a Clefairy and a lot of ribbon.', [round(1, 'r2', ['clefairy', 'jigglypuff'])]);
  s.room('r2', 'The Festival of Dolls: Round 2', 'A boy who has dressed his Machop as a samurai.', [round(2, 'r3', ['machop', 'mankey'])]);
  s.room('r3', 'The Festival of Dolls: Semi-final', 'A grandmother, very fast.', [round(3, 'final', ['persian', 'wigglytuff'])]);
  s.room('final', 'The Festival of Dolls: The Final', 'Both of you won through. It\'s the final. Jessie: "I\'m not stealing them. I want to have won them. There\'s a difference. I\'ve only just noticed there\'s a difference." She fights fair. Arbok doesn\'t use Poison Sting on the dolls\' side of the roof.',
    [c('Battle.', battle('The final.', foe('Jessie', { team: ['arbok', 'lickitung', 'seviper'], size: 3, levelBonus: 0, win: [s.open('won')], lose: [s.open('jessie')] })))]);
  s.room('won', 'The Festival of Dolls: The Dolls', 'You won. The dolls, on their seven tiers.',
    [c('"They\'re yours." (Give them to Jessie.)', o(`She doesn't take them. Then she does. She holds the smallest one in both hands. Jessie: "I don't... what do you want? ...Nothing. You want nothing. I don't know what face to do." Meowth: "That one, Jess. That one's fine."`,
      trio(10), flag('kanto-celadon-festival'), moment('Won the dolls at the Princess Festival, and gave them to Jessie.'))),
      c('"Good match." (Keep them.)', o('Seven tiers of dolls, in your journal.', flag('kanto-celadon-festival'), moment('Won a set of antique dolls on seven tiers at the Princess Festival.')))]);
  s.room('jessie', 'The Festival of Dolls: Jessie Wins', 'Jessie wins the final herself.',
    [c('Watch her go.', o('She\'s won them. She carries all seven tiers out on her back, and doesn\'t put them down for a week.', trio(5), flag('kanto-celadon-festival')))]);
}

// ---------- The Secret House (the games; the far end of Safari Land)
{
  const s = space(E, { id: 'cs.kanto.fuchsia.secrethouse', town: 'fuchsia', name: 'The Secret House', kind: 'EV', appears: 'trigger', requires: { spaces: ['cs.kanto.fuchsia.safari'] }, flags: ['kanto.fuchsia.secrethouse', 'kanto.gold.teeth.replica'], section: `${DOC}: The Secret House`,
    placed: { stage: [5], home: 14, sits: 'town', attaches: 'town', badge: 'A small roof, far off', level: 0, often: 'Once per run' } });
  const steps = (n: number): Json => flag('kanto-secret-steps', n);
  s.entry('The Secret House', 'From the gate, on a clear day: a roof, at the very back of the reserve. Mr. Lowe, at the gate: "There\'s a prize, if you get there on one ticket. Nobody does. They see a Chansey and that\'s that." Five hundred steps. Four hundred of them are just walking; the rest are what you spend them on.',
    [c('Start walking.', o('Steps: the count\'s on your ticket.', s.open('grass'))), c('"Not today."', o('"Nobody does," says Mr. Lowe, kindly.'))]);
  s.room('grass', 'The Secret House: Long Grass', 'Five patches of long grass across the path. Each costs five steps. Round them costs more.',
    [c('Straight through (25 steps).', o('Through. Something rustles in all five.', steps(25), s.open('rare1'))), c('Round (60 steps).', o('The long way round.', steps(60), s.open('rare1')))]);
  const rare = (key: string, next: string, mons: string[], what: string) => s.room(key, `The Secret House: ${what}`, `${what}, right by the path. Stopping to catch it costs twenty steps, and it's always something good.`,
    [c('Stop and catch it (20 steps).', battle('The rarest things in the reserve are on the way.', wild(mons, { levelBonus: 1, win: [s.open(next)], lose: [s.open(next)] }), steps(20))), c('Walk on.', o('You don\'t look back. Much.', s.open(next)))]);
  rare('rare1', 'rare2', ['chansey', 'kangaskhan', 'tauros'], 'Something pink and round');
  rare('rare2', 'pond', ['dratini', 'scyther', 'pinsir'], 'Something long, in the reeds');
  s.room('pond', 'The Secret House: The Pond', 'The pond. Without a Water type, it\'s forty steps to go round.',
    [c('Swim it (a Water type).', o('Straight across.', s.open('end')), { requires: [typed('water')] }), c('Go round (40 steps).', o('Round, and round.', steps(40), s.open('end')))]);
  const surf = { kind: 'partyMove', move: 'surf' };
  s.room('end', 'The Secret House: The Count', 'The count on your ticket.',
    [c('Reached.', o('The man inside: "You made it. I\'ve sat here eleven years. I\'ve a speech. ...I\'ve forgotten it. Here." HM Surf.', teach('surf', { type: 'water' }), flag('kanto-fuchsia-secrethouse'), moment('Reached the Secret House at the back of Safari Land on one ticket.')), { requires: [is('kanto-secret-steps', 0, 100)] }),
      c('Reached (and you know Surf).', o('"You made it." A replica of the Gold Teeth, in a velvet box. Shown to the Warden, he laughs so hard the real ones come out.', flag('kanto-gold-teeth-replica'), cash(3000), flag('kanto-fuchsia-secrethouse'), moment('Got a replica of the Gold Teeth from the Secret House.')), { requires: [is('kanto-secret-steps', 0, 100), surf] }),
      c('Time.', o('The loudspeaker calls time. You\'re walked back by a ranger. "How far? ...The pond. It\'s always the pond."', flag('kanto-fuchsia-secrethouse')), { requires: [is('kanto-secret-steps', 101)] })]);
}

// ---------- The Shell on the Tail (anime; Stage 7)
{
  const s = space(E, { id: 'cs.kanto.cinnabar.shellder', town: 'cinnabar', name: 'The Shell on the Tail', kind: 'EV', appears: 'roll', flags: ['kanto.cinnabar.shellder'], section: `${DOC}: The Shell on the Tail`,
    placed: { stage: [7], home: 13, window: [11, 15], sits: 'optional', attaches: 'after', badge: 'A spiral shell', level: null, often: 'Once per run', tags: ['water'] } });
  const watch = (lead: string) => c(lead[0] === '"' ? lead.split('|')[0]! : lead, o(`${lead.split('|')[1] ?? ''} The trio arrive, after the Slowpoke. A battle starts that isn't yours: Jessie's Shellder, thrown; the Slowpoke, slow; the professor on his feet. The Shellder misses. It lands on the tail. It bites, out of habit. Light. A Slowbro's standing in the pool. It's upright. It looks at its own hands. Professor Westwood: "It's the balance. The weight on the tail. It has to stand up to carry it. And standing... it thinks better standing. They help each other stand. It was never the bite. It's the..." He's stopped. He's looked at the notebook. He's looked at the portraits. "...Oh. That's it, then. That's all of it. What do I do on Monday?"`.trim(), flag('kanto-trio-met'), s.open('ask')));
  s.entry('The Shell on the Tail',
    `A rock pool. A Slowpoke with its tail in it. A professor on a camp stool, watching the tail, with a notebook open at a blank page. Professor Westwood the Fifth: "My great-great-grandfather asked: why does it evolve when the Shellder bites? He didn't find out. Nor did his son. Nor his. Nor my father. They're all on the wall at home. Looking at me." He's brought the portraits. They're propped along the rocks. Four men with the same nose, increasingly disappointed. "I've had this one's tail in that pool since April. The Shellder won't bite."`,
    [watch('"Maybe it\'s got to want to."|He writes that down, then crosses it out.'), watch('"Have you asked the Slowpoke?"|"...No."'), watch('"What happens if you find out?"|"...I don\'t know. Nobody in my family\'s ever got that far."')]);
  const q = (label: string, x: Json = {}) => c(label, o(`He writes it at the top of the blank page. For the rest of this run, whenever you pass, he's on the camp stool with that question, very happy. A King's Rock.`, item('kings-rock'), flag('kanto-cinnabar-shellder'), moment(`Gave Professor Westwood a new question: ${label}`)), x);
  s.room('ask', 'The Shell on the Tail: Monday', 'He asks you for a new question.',
    [q('"Why does a Magikarp jump?"', { requires: [species('magikarp')] }), q('"Why did the Clefairy want to leave?"', { requires: [is('kanto-pewter-visitors')] }),
      c('Other questions.', o('He turns the page.', s.open('ask2')))]);
  s.room('ask2', 'The Shell on the Tail: Other Questions', 'He waits, pencil up.',
    [q('"Why won\'t a Farfetch\'d put the leek down?"'), q('"What\'s a Ditto when nobody\'s looking?"'), q('"Whatever you like."')]);
}

// ============================================================ ON THE ROADS

// ---------- Where It Was Happy (anime)
{
  const s = space(E, { id: 'cs.kanto.route.goodbye', town: 'route', name: 'Where It Was Happy', kind: 'EV', appears: 'route', flags: ['kanto.route.goodbye'], section: `${DOC}: Where It Was Happy`,
    placed: { stage: [2, 3, 4, 5, 6, 7], home: 16, window: [13, 18], sits: 'door', attaches: 'instead', badge: 'A leaf with a heart-shaped hole', level: null, often: 'Once per run', tags: ['forest'] } });
  road(s.id(), [2, 3, 4, 5, 6, 7], 0.2);
  const stays = o('Nothing changes. Morning. It\'s on your bag, ready. It was never going to stay.', flag('kanto-route-goodbye'));
  s.entry('Where It Was Happy',
    `A wood. Movement in every tree. They come out, one at a time: thirty, forty, all of them the same kind as your lead. Your lead goes still. It's never seen another one. It's never seen this many of anything like itself. One comes forward. They touch noses. And then it's in among them, and it's gone, and it's all one sound. All day, you watch from a log. It's playing. It's teaching a small one something. It's never, in this whole run, looked like that. Evening. The fire. Your lead's asleep in a heap of its own kind. One of them's got an arm over it.`,
    [c('(Get up, quietly, and go.)', o(`The path. The trees thinning. You don't look back. You're doing very well at not looking back. Behind you: something running. Fast, and not stopping. It hits you in the chest and holds on. At the tree line, all of them have come out to see it off. They're cheering. They knew before you did.`,
      bond(5, 'lead'), flag('kanto-route-goodbye'), moment('Tried to leave your lead where it was happy. It came after you. It always will.'))),
      c('(Stay where you are.)', stays), c('"...You were happy here, weren\'t you."', stays)]);
}

// ---------- The Training Course (anime)
{
  const s = space(E, { id: 'cs.kanto.route.k9', town: 'route', name: 'The Training Course', kind: 'EV', appears: 'route', flags: ['kanto.route.k9'], section: `${DOC}: The Training Course`,
    placed: { stage: [2, 3, 4, 5, 6], home: 8, window: [5, 12], sits: 'optional', attaches: 'before', badge: 'A whistle', level: null, often: 'Once per run' } });
  road(s.id(), [2, 3, 4, 5, 6], 0.25);
  const sits = o('It does the first two and sits down at the third, puzzled. Jenny: "It\'s Bond, not brains. Come back when it\'s had longer with you."', flag('kanto-route-k9'));
  s.entry('The Training Course',
    `You're on the ground. Six Growlithe are sitting on you. It's very warm. Officer Jenny: "Hold! ...Oh. You're not him. He's got a moustache. I'm sorry. They go for the bag; you've a burglar's bag. Off. Off. All six. Let me make it up to you: want to run one of yours through the course?"`,
    [c('Run your lead through it.', o('The wall first.', s.open('wall'))), c('"I\'d rather just get up."', o('"Fair." She helps you up. The Growlithe help, too, mostly by licking.', flag('kanto-route-k9')))]);
  s.room('wall', 'The Training Course: The Wall', 'A timing jump.', [c('Jump.', o('Over.', s.open('tunnel')), { prompt: ['hurdle-rhythm', 'ok'], fail: o('Over, at the second go.', s.open('tunnel')) })]);
  s.room('tunnel', 'The Training Course: The Tunnel', 'A dark crawl: you call left and right.', [c('Call it through.', o('Out the far end, dusty.', s.open('voice')), { prompt: ['echo-rhythm', 'ok'], fail: o('Out the far end, eventually.', s.open('voice')) })]);
  s.room('voice', 'The Training Course: The Voice', 'You breathe helium and shout a command in a squeak. A Growlithe that only knows the voice wouldn\'t obey.',
    [c('Squeak.', o(`It tilts its head. It sniffs. It looks at you as if to say: I know it's you; why are you doing that? And it does it. Passed. An officer's whistle: the next police encounter in the region is friendly.`, rep(3), flag('kanto-police-tip'), flag('kanto-route-k9'), moment('Passed Officer Jenny\'s course with a squeak.')), { requires: [bondAt(2)] }),
      c('Squeak, and hope.', sits)]);
}

// ---------- The Old Street (anime; trio reputation +10)
{
  const s = space(E, { id: 'cs.kanto.route.oldstreet', town: 'route', name: 'The Old Street', kind: 'EV', appears: 'route', requires: { flags: ['kanto.trio.rep'] }, flags: ['kanto.route.oldstreet'], section: `${DOC}: The Old Street`,
    placed: { stage: [4, 5, 6, 7, 8], home: 11, window: [8, 15], sits: 'optional', attaches: 'after', badge: 'A crescent moon over a rooftop', level: null, often: 'Once per run' } });
  road(s.id(), [4, 5, 6, 7, 8], 0.3);
  const end = (lead: string) => o(`${lead} The Persian looks at you. It looks at Meowth. Nobody's ever stood there before. It gets down off the crate, and goes. In the window, the cat's watching. Meowth looks up at last. Meowth: "Nah. Y'know what? I talk. I'm the only one there is. She can keep the cushion." And then: "Don't tell them two I was here."`,
    trio(10), flag('kanto-route-oldstreet'), moment('Stood beside Meowth in the alley where he learned to talk.'));
  s.entry('The Old Street',
    `A film town: billboards, palm trees, a street of theatres. The trio's on it. Meowth's stopped walking. Jessie: "What?" Meowth: "Nothin'. Go on. I'll catch yous up." They go. He doesn't follow. He's looking down an alley. He's seen you. He doesn't run. Meowth: "...I used to eat outta that bin. That one. Best bin on the street."`,
    [c('Follow him into the alley.', o('He doesn\'t stop you.', s.open('alley')))], { requires: [is('kanto-trio-rep', 10)] });
  s.room('alley', 'The Old Street: The Alley', `The alley: a gang of street Meowth. A Persian on a crate. They know him. They circle him. They don't speak. One of them mimes walking on two legs, and falls about. A window above: a cat on a cushion, with a ribbon. Meowth, not looking up: "Meowzie. She said I wasn't good enough. Said she liked people. Rich ones, that talk nice. So I learned. Standin' up. Took a month; I fell down a lot. Then talkin'. Out of a picture book. First word I got was 'rocket.' That's the only reason I'm in this line o' work. I come back. On two feet. I said, 'Meowzie, I can speak, I can walk, I'm just like a person.' And she said that made me a freak."`,
    [c('(Stand beside him.)', end('You walk into the alley and stand at his shoulder. That\'s all.')), c('"You\'re not a freak."', end('You say it, and then you stand at his shoulder.')),
      c('"Do you want to leave?"', end('"...In a minute." You stand at his shoulder while he has the minute.'))]);
}

// ---------- Inside the Machine (anime; Pseudo Stage)
{
  const s = space(E, { id: 'cs.kanto.route.transfer', town: 'route', name: 'Inside the Machine', kind: 'PS', appears: 'route', flags: ['kanto.route.transfer'], section: `${DOC}: Inside the Machine`,
    placed: { stage: [3, 4, 5, 6, 7], home: 9, window: [9, 12], sits: 'plus', attaches: 'plus', badge: 'A grid', level: 1, often: 'Once per run' },
    ps: { name: 'Inside the Machine', themeId: 'electric-psychic', mood: 'corridors of steady light, and Poké Balls drifting along a rail like a slow river' } });
  road(s.id(), [3, 4, 5, 6, 7], 0.2);
  const ejected = o('Everyone\'s ejected, dizzy. The Balls arrive a day late.', flag('kanto-route-transfer'));
  s.entry('Inside the Machine',
    `A Center where the transfer machine eats Poké Balls. A queue of worried trainers. An engineer with a helmet that's all wires. Dr. Akihabara: "They go in. They don't come out the other end. Something's in the line. I can send a person in to look. It's quite safe. I think it's quite safe. I've a guide." A Porygon. It bobs. (Staged without flashing: steady colours, slow fades.)`,
    [c('Go in.', o('Corridors of steady light.', s.open('booth'))), c('"I think I\'ll wait out here."', o('The queue sighs.', flag('kanto-route-transfer')))]);
  s.room('booth', 'Inside the Machine: The Toll Booth', 'The trio, with a Porygon of their own and a roadblock made of stolen Balls. James: "It\'s a toll booth! In a telephone! It\'s the perfect crime!"',
    [c('Battle.', battle('The trio.', foe('Jessie and James', { team: ['porygon', 'arbok', 'weezing'], size: 3, levelBonus: s.lv, win: [s.open('virus')], lose: [s.open('out')] }), flag('kanto-trio-met')))]);
  s.room('virus', 'Inside the Machine: The Anti-Virus', 'A shape that can\'t tell thieves from visitors. It can\'t be beaten for long; it regrows.',
    [c('Battle.', battle('It comes apart, and starts to come back together.', wild(['porygon2'], { levelBonus: s.lv, win: [s.open('t1')], lose: [s.open('out')] })))]);
  s.room('t1', 'Inside the Machine: Run (1)', 'Four turns for the exit, with it behind.', [c('Run.', o('A turn.', s.open('t2')), { prompt: ['dodge-tap', 'ok'], fail: ejected })]);
  s.room('t2', 'Inside the Machine: Run (2)', 'It\'s regrown.', [c('Run.', o('Another.', s.open('t3')), { prompt: ['dodge-tap', 'ok'], fail: ejected })]);
  s.room('t3', 'Inside the Machine: Run (3)', 'The trio\'s Porygon\'s gone. They\'re on foot. The thing\'s nearly on them.',
    [c('"Keep running."', o('Out. The trio\'s ejected a minute later through a printer.', s.open('exit'))),
      c('"Go back for those three."', o('Your guide Porygon carries all four. It\'s slower. It makes it by a turn.', trio(10), s.open('exit')), { prompt: ['dodge-tap', 'good'], fail: ejected })]);
  s.room('exit', 'Inside the Machine: Out', 'The lost Balls go where they were sent.',
    [c('Thank the guide.', o('The guide Porygon asks to stay.', join(['porygon']), flag('kanto-route-transfer'), moment('Went inside the transfer machine, and came out with a Porygon.')))]);
  s.room('out', 'Inside the Machine: Ejected', 'Dizzy, on the Center floor.', [c('Sit up.', ejected)]);
}

// ---------- Snowed In (anime; must-see when rolled)
{
  const s = space(E, { id: 'cs.kanto.route.snow', town: 'route', name: 'Snowed In', kind: 'EV', appears: 'route', flags: ['kanto.route.snow'], section: `${DOC}: Snowed In`,
    placed: { stage: [1, 2, 3, 4, 5, 6, 7, 8], home: 14, window: [10, 17], sits: 'must', attaches: 'instead', badge: 'A snowdrift with a light in it', level: null, often: 'Once per run', tags: ['high'] } });
  road(s.id(), [1, 2, 3, 4, 5, 6, 7, 8], 0.15);
  const night = (lead: string) => o(`${lead} They're back, packed in round you, the big ones on the outside, your lead under your coat. Nobody's looking at you. It's been decided. Morning. Blue sky. The drift's a white dome with a hole at the top, and steam coming out of it.`,
    bond(1, 'party'), { kind: 'shadowHeart', amount: -5 }, flag('kanto-route-snow'), moment('Snowed in, and nobody would go in their Balls.'));
  s.entry('Snowed In',
    'A mountain road. Snow from the side. The path\'s gone, then the hill\'s gone, then your hand. A drift, hollowed out. A cave the size of a cupboard. The fire\'s lit, and it\'s small. The party\'s out, all of them, crowded in. They\'re shivering. It\'s warmer in the Balls. You know it.',
    [c('"In. All of you. That\'s not a request."', night('They go. One by one. The light of each Ball closing. The cave\'s very quiet. The fire\'s lower. A Ball opens by itself. Then another. Then all of them.')),
      c('"...Stay, then."', night('Nobody moves to go.')), c('(Hold the Balls out, and say nothing.)', night('They look at the Balls. They look at you. They stay.'))],
    { remembers: [{ id: 'fire', when: [typed('fire')], notice: 'Your Fire type lies across the door. The night\'s easy.' }] });
}

// ---------- The Bicycle Race (manga; Pseudo Stage)
{
  const s = space(E, { id: 'cs.kanto.route.bikerace', town: 'route', name: 'The Bicycle Race', kind: 'PS', appears: 'route', requires: { flags: ['kanto.cerulean.bike'] }, flags: ['kanto.route.bikerace', 'kanto.bike.diner'], section: `${DOC}: The Bicycle Race`,
    placed: { stage: [4, 5, 6, 7], home: 9, window: [7, 12], sits: 'door', attaches: 'instead', badge: 'A bicycle with a bent frame', level: null, often: 'Once per run' },
    ps: { name: 'The Bicycle Race', themeId: 'normal-flying', mood: 'bunting, a start line, and a hill that goes on' } });
  road(s.id(), [4, 5, 6, 7], 0.2);
  const pass = flag('kanto-bike-place');
  const leg = (key: string, next: string, name: string, light: string, heavy: string) => s.room(key, `The Bicycle Race: ${name}`, `${name}.`,
    [c('Pedal. (A light passenger)', o(light, pass, s.open(next)), { requires: [not('kanto-bike-heavy')], prompt: ['hurdle-rhythm', 'ok'], fail: o('A wobble. You lose a place.', s.open(next)) }),
      c('Pedal. (A heavy passenger)', o(heavy, ...(key === 'down' ? [pass, pass] : []), s.open(next)), { requires: [is('kanto-bike-heavy')], prompt: ['brace-hold', 'ok'], fail: o('It wobbles. It holds.', s.open(next)) })]);
  s.entry('The Bicycle Race',
    `A town with bunting. A start line. A rule, on a board: THE RIDER'S LEAD POKÉMON MUST BE ON THE BICYCLE. Your lightest Pokémon hops up at once. Your heaviest looks at it. It looks at the bicycle. It looks at you, with hope.`,
    [c('The light one.', o('Light: fast uphill, twitchy downhill.', s.open('up'))), c('The heavy one.', o('Heavy: very slow uphill. Downhill, unstoppable. Literally: the brakes don\'t count.', flag('kanto-bike-heavy'), s.open('up'))),
      c('The Snorlax.', o('The front wheel\'s flat by the first corner. It\'s holding your shoulders. It\'s having the best day.', flag('kanto-bike-heavy'), flag('kanto-bike-snorlax'), s.open('up')), { requires: [species('snorlax')] })], { requires: [is('kanto-cerulean-bike')] });
  leg('up', 'along', 'Uphill', 'Up, fast.', 'Very slow. The crowd walks beside you.');
  leg('along', 'down', 'Along', 'Along, twitchy.', 'Along, ponderously.');
  leg('down', 'line', 'Downhill', 'Down, twitchy, and fast.', 'Down. Unstoppable.');
  s.room('line', 'The Bicycle Race: The Line', 'The finish line.',
    [c('The podium.', o('Leftovers, or a Soothe Bell.', { kind: 'itemFrom', ids: ['leftovers', 'soothe-bell'], count: 1 }, flag('kanto-route-bikerace'), moment('Made the podium in the Bicycle Race.')), { requires: [is('kanto-bike-place', 2)] }),
      c('Last place.', o('Last. They clap anyway.', flag('kanto-route-bikerace')), { requires: [is('kanto-bike-place', 0, 1), not('kanto-bike-snorlax')] }),
      c('Last place, with a Snorlax on the handlebars.', o('The crowd\'s favourite. They\'ve waited at the line. A year of free food at the finish-line diner: a full rest, now, and again whenever you pass this way this run.', heal(1), flag('kanto-bike-diner'), flag('kanto-route-bikerace'), moment('Came last in the Bicycle Race with a Snorlax on the handlebars. The crowd\'s favourite.')), { requires: [is('kanto-bike-place', 0, 1), is('kanto-bike-snorlax')] })]);
}

// ---------- The Gamblers (the games' Route 8)
{
  const s = space(E, { id: 'cs.kanto.route.gamblers', town: 'route', name: 'The Gamblers', kind: 'EV', appears: 'route', flags: ['kanto.route.gamblers'], section: `${DOC}: The Gamblers`,
    placed: { stage: [3, 4, 5, 6], home: 7, window: [5, 10], sits: 'optional', attaches: 'instead', badge: 'A coin, mid-flip', level: 0, often: 'Once per run' } });
  road(s.id(), [3, 4, 5, 6], 0.25);
  const G: [string, string, string[]][] = [['Rich', '"Heads, I fight. Tails, I fight worse."', ['growlithe', 'poliwhirl']], ['Stan', '"I flipped for breakfast. I\'d have liked eggs."', ['vulpix', 'pikachu']], ['Dirk', '"I flipped on whether to pay up if I lose. ...It came up \'pay.\' I flipped again. It\'s stubborn."', ['magnemite', 'voltorb']]];
  const next = (i: number) => (i < 2 ? s.open(`g${i + 2}`) : s.open('coin'));
  const game = (i: number) => {
    const [name, line, team] = G[i]!;
    const fight = (size: number) => battle(`The coin's fair, and it's said so. ${name}'s battle.`, foe(`Gambler ${name}`, { team: team.slice(0, size), size, levelBonus: 0, win: [cash(800), flag('kanto-gamblers-won'), next(i)], lose: [i < 2 ? next(i) : s.open('done')] }));
    return { name, line, choices: [c('Call it. (A right call picks his lead.)', fight(1), { chance: 0.5, fail: fight(2) }), c('Don\'t call it.', fight(2)), c('Walk on.', o('He flips for whether to be offended. It comes up "no."', flag('kanto-route-gamblers')))] };
  };
  const g1 = game(0);
  s.entry('The Gamblers', `Three men at a folding table by the road, each with a coin, none of them doing anything until it's landed. The coin decides his lead and his opening move. You may call it. Rich: ${g1.line}`, g1.choices);
  [1, 2].forEach((i) => { const g = game(i); s.room(`g${i + 1}`, `The Gamblers: ${g.name}`, `${g.name}: ${g.line}`, g.choices); });
  s.room('coin', 'The Gamblers: All Three', 'All three beaten.',
    [c('Collect.', o('Dirk: "It\'s the one I\'ve been flipping. It\'s lucky. Not for me." An Amulet Coin.', item('amulet-coin'), flag('kanto-route-gamblers'), moment('Beat all three gamblers on the road. Dirk paid up with his coin.')), { requires: [is('kanto-gamblers-won', 3)] }),
      c('Collect what you won.', o('Coins, doubled.', flag('kanto-route-gamblers')), { requires: [is('kanto-gamblers-won', 0, 2)] })]);
  s.room('done', 'The Gamblers: Done', 'Dirk pockets his coin.', [c('Walk on.', o('"Flip you for it next time."', flag('kanto-route-gamblers')))]);
}

// ---------- The Vs. Seeker and the Fame Checker (the games; Stage 3, the first + node)
{
  const s = space(E, { id: 'cs.kanto.route.seeker', town: 'vermilion', name: 'The Vs. Seeker', kind: 'EV', appears: 'always', flags: ['kanto.route.seeker'], section: `${DOC}: The Vs. Seeker and the Fame Checker`,
    placed: { stage: [3], home: 2, sits: 'plus', attaches: 'plus', badge: 'None', level: null, often: 'Once per run' } });
  space(E, { id: 'cs.kanto.route.fame', town: 'vermilion', name: 'The Fame Checker', kind: 'EV', appears: 'always', parent: 'cs.kanto.route.seeker', flags: ['kanto.route.fame'], section: `${DOC}: The Vs. Seeker and the Fame Checker`,
    placed: { stage: [3], home: 2, sits: 'plus', attaches: 'plus', badge: 'None', level: null, often: 'Once per run' } })
    .entry('The Fame Checker', 'It listens to what people say about people. "Brock? Cooks for ten. Never sits down himself." A Pewter grandmother. "Erika fell asleep judging the flower show. Gave first prize to a hedge." A Celadon gardener. "The man at Viridian\'s Gym is never in. Lovely suits, the once I saw him." The Old Man.',
      [c('Put it away.', o('Each remark fills a line in the Notebook.', item('fame-checker'), flag('kanto-route-fame'), moment('Got the Fame Checker from Miss Pennyfeather.')))], { room: true });
  s.entry('The Vs. Seeker',
    'A woman at the Center\'s counter, Miss Leonora Pennyfeather: "I don\'t use these now. I\'ve a shop. This one finds people who\'d like another go at you. This one listens to what people say about people. Mind what you do with the second."',
    [c('Take both.', o('The Vs. Seeker, and the Fame Checker. A rematched trainer, later: "You! I\'ve been practising. I\'ve been practising specifically you."', item('vs-seeker'), flag('kanto-route-seeker'), go('cs.kanto.route.fame')))]);
}

// ---------- Lost and Found (the games' Underground Paths)
{
  const s = space(E, { id: 'cs.kanto.route.underground', town: 'route', name: 'Lost and Found', kind: 'EV', appears: 'route', flags: ['kanto.route.underground'], section: `${DOC}: Lost and Found`,
    placed: { stage: [3, 4, 5, 6], home: 12, window: [9, 15], sits: 'door', attaches: 'instead', badge: 'A stairway down', level: null, often: 'Once per run' } });
  road(s.id(), [3, 4, 5, 6], 0.25);
  s.entry('Lost and Found', 'A gatehouse with a guard who won\'t let anyone through. Beside it, steps going down. A man coming up: "Long way. Dark. People drop things. I dropped a sandwich in \'94. If you find it, don\'t."',
    [c('Go down.', o('A long walk by the light of your lead. It stops twice: two things somebody dropped.', { kind: 'itemFrom', ids: ['nugget', 'star-piece', 'pearl'], count: 1 }, { kind: 'itemFrom', ids: ['rare-candy', 'big-pearl', 'stardust'], count: 1 }, s.open('end'))),
      c('Go down, with the Itemfinder.', o('It stops three times.', { kind: 'itemFrom', ids: ['nugget', 'star-piece', 'pearl'], count: 1 }, { kind: 'itemFrom', ids: ['rare-candy', 'big-pearl', 'stardust'], count: 1 }, { kind: 'itemFrom', ids: ['comet-shard', 'big-nugget'], count: 1 }, s.open('end')), { requires: [is('kanto-vermilion-itemfinder')] })]);
  s.room('end', 'Lost and Found: The Far End', 'A girl on the bottom step, Saige: "Are you a trade? I\'m waiting for a trade. Mum said wait here. That was a while ago. I\'ve a Nidoran. He\'s called Mr. Nido. I\'d like a girl one." The Honest Trade Card is shown.',
    [c('Trade her a Nidoran (female) for Mr. Nido.', o('Saige, after: "Be nice to Mr. Nido. He doesn\'t like the dark. That\'s why we waited where the light comes down." Bond grows half again as fast, as with every trade.',
      { kind: 'tradeFor', want: { label: 'a female Nidoran', species: ['nidoran-f'] }, table: { 'nidoran-f': 'nidoran-m' } }, flag('kanto-route-underground'), moment('Traded for Mr. Nido at the bottom of the Underground Path.')), { requires: [{ kind: 'partySpecies', species: 'nidoran-f' }] }),
      c('"I haven\'t one. I\'ll sit with you a bit."', o('You sit where the light comes down. Her mum comes, eventually, with chips.', fr(3, 'party'), flag('kanto-route-underground')))]);
}

// ---------- The Swimmers' Relay (the games' sea routes)
{
  const s = space(E, { id: 'cs.kanto.route.relay', town: 'route', name: 'The Swimmers\' Relay', kind: 'EV', appears: 'route', flags: ['kanto.route.relay'], section: `${DOC}: The Swimmers' Relay`,
    placed: { stage: [3, 4, 5, 6, 7], home: 10, window: [7, 14], sits: 'optional', attaches: 'instead', badge: 'A buoy', level: 0, often: 'Once per run', tags: ['water'] } });
  road(s.id(), [3, 4, 5, 6, 7], 0.2);
  const SW: string[][] = [['tentacool', 'goldeen'], ['seel', 'staryu'], ['poliwhirl', 'seaking'], ['tentacruel', 'starmie']];
  s.entry('The Swimmers\' Relay', 'Open water. Four buoys in a line to the horizon. Heads bobbing between them, shouting. A swimmer, treading water: "Buoy to buoy! Battle at each! Last one to four buys the chips! You\'ve got something that floats?"',
    [c('Ride one that can carry you.', o('Strokes, in rhythm, to the first buoy.', s.open('b1')), { requires: [typed('water')], pick: { types: ['water'] } }), c('"Not today."', o('"Chips are on you, then!"', flag('kanto-route-relay')))]);
  SW.forEach((team, i) => s.room(`b${i + 1}`, `The Swimmers' Relay: Buoy ${i + 1}`, i === 2 ? 'Buoy three. "I\'m not out of breath. I\'m pacing. ...Give me a second. Then battle."' : `Buoy ${i + 1}, and a swimmer hanging off it.`,
    [c('Battle.', battle('A battle at the buoy.', foe('Swimmer', { team, size: 2, levelBonus: 0, win: [cash(500), i < 3 ? s.open(`b${i + 2}`) : s.open('last')], lose: [flag('kanto-route-relay')] }))),
      c('Stop here.', o('Coins for each buoy. Chips, on the beach, after. Everybody\'s buying everybody\'s.', flag('kanto-route-relay')))]));
  s.room('last', 'The Swimmers\' Relay: The Last Buoy', 'First to the last buoy.',
    [c('Haul out.', o('A Mystic Water or a Wave Incense, and a tired, pleased Pokémon. Chips, on the beach, after. Everybody\'s buying everybody\'s.', { kind: 'itemFrom', ids: ['mystic-water', 'wave-incense'], count: 1 }, bond(1, 'picked'), flag('kanto-route-relay'), moment('First to the last buoy in the Swimmers\' Relay.')))]);
}

// ---------- The Aides (the games; Stages 2, 3, 5 and 6, before the Gym)
{
  const s = space(E, { id: 'cs.kanto.route.aides', town: 'route', name: 'The Aides', kind: 'EV', appears: 'route', flags: ['kanto.route.aides', 'kanto.aide.lamp'], section: `${DOC}: The Aides`,
    placed: { stage: [2], home: 18, sits: 'must', attaches: 'after', badge: 'A clipboard', level: null, often: 'Once each (Stages 2, 5 and 6; Stage 3\'s is the Itemfinder)' } });
  road(s.id(), [2], 1);
  const caught = (n: number): Json => ({ kind: 'dex', set: 'caught', atLeast: n });
  const aide = (n: number, gift: Json[], line: string) => [c(`Show the count (${n} caught).`, o(`${line}`, ...gift, flag('kanto-route-aides'), moment(`An Aide counted your ${n}.`)), { requires: [caught(n)] }),
    c('"Not yet."', o('"Come back with more. I\'ll be here. It\'s a gatehouse. Where would I go."'))];
  s.entry('The Aides: Miss Ione Tack', 'A gatehouse before the Gym\'s approach. A woman with a clipboard. She doesn\'t say who she works for, and doesn\'t send you anywhere.',
    aide(10, [flag('kanto-aide-lamp')], 'Miss Ione Tack: "Ten. That\'s the first hurdle. Most people have ten by accident." A lamp, for the dark routes.'));
  s.room('s5', 'The Aides: Mr. Humphrey Tack', 'Another gatehouse, another clipboard.', aide(20, [item('exp-share')], 'Mr. Humphrey Tack: "Twenty! My brother wanted thirty. He\'s always been unreasonable." An Exp. Share.'), later());
  s.room('s6', 'The Aides: Old Mrs. Tack', 'A gatehouse with a cushion on the chair.', aide(40, [item('amulet-coin')], 'Old Mrs. Tack: "Forty. I\'ve three children in gatehouses. None of them write. Count yours for me, dear." An Amulet Coin.'), later());
  road(s.id('s5'), [5], 1);
  road(s.id('s6'), [6], 1);
}

// ============================================================ ON THE SEVII ISLANDS (rooms of the Sevii map)

const NET = 'cs.kanto.sevii.network';
const dock = (n: string): Json => go(NET, n);
const isle = (id: string, name: string, flags: string[], badge: string) => space(E, { id, town: 'sevii', name, kind: 'EV', appears: 'always', parent: NET, flags, section: `${DOC}: ${name}`,
  placed: { stage: [7], home: 18, sits: 'plus', attaches: 'plus', badge, level: 0, often: 'On the Sevii map' } });

// ---------- The Joyful Game Corner (Two Island, once Lostelle's home)
{
  const s = isle('cs.kanto.sevii.joyful', 'The Joyful Game Corner', ['kanto.sevii.joyful'], 'Chalked squares');
  const played = (text: string, need: Json[]) => c(text.split('|')[0]!, o(`${text.split('|')[1]} Lostelle: "Yours is good. Mine's better. Mine's imaginary. It never trips." Berries, by score. Bond +1, once.`, item('oran-berry', 3), bond(1, 'picked'), flag('kanto-sevii-joyful'), dock('two')), { pick: {}, requires: [not('kanto-sevii-joyful'), ...need] });
  s.entry('The Joyful Game Corner', 'The three machines are pushed back against the wall. The floor\'s chalked with squares. The owner: "She said they were boring. The machines. She\'s six. She\'s right. So: these."',
    [played('Jumping (a small Pokémon).|A rope, turned by a Machop. A rhythm; it speeds up. Lostelle counts, wrongly.', []),
      played('Berry-picking (a Doduo or Dodrio: more than one head).|A tree, three heads, three baskets. Each head\'s steered separately. They argue.', [species('doduo')]),
      c('Play again, for Berries.', o('No coins. No prizes but Berries, by score.', item('oran-berry', 2), dock('two')), { requires: [is('kanto-sevii-joyful')] }),
      c('Back to Two Island\'s dock.', o('Back along the jetty.', dock('two')))], { room: true });
}

// ---------- Treasure Beach (One Island, at low tide)
{
  const s = isle('cs.kanto.sevii.treasure', 'Treasure Beach', ['kanto.sevii.treasure'], 'A shell');
  const finds = [{ kind: 'itemFrom', ids: ['pearl', 'big-pearl', 'star-piece', 'stardust'], count: 1 }];
  s.entry('Treasure Beach', 'A beach nobody\'s on. The sea\'s gone out a long way, and left things. Your lead digs. It\'s found something. It brings it over very carefully, as if it knows.',
    [c('Dig. (Three finds)', o('Pearls, a Star Piece, shells.', ...finds, ...finds, ...finds, flag('kanto-sevii-treasure'), dock('knot'))),
      c('Dig, with the Itemfinder. (Five finds)', o('Pearls, a Star Piece, shells, and two more.', ...finds, ...finds, ...finds, ...finds, ...finds, flag('kanto-sevii-treasure'), dock('knot')), { requires: [is('kanto-vermilion-itemfinder')] }),
      c('Back to One Island\'s dock.', o('Back along the jetty.', dock('knot')))], { room: true });
}

// ---------- The Lady of the Resort (Five Island, after the Lost Cave; repeatable)
{
  const s = isle('cs.kanto.sevii.resort', 'The Lady of the Resort', ['kanto.sevii.resort'], 'A parasol');
  const wish = (mon: string, name: string) => c(`Show her a ${name}.`, o(`She claps, once, properly. Selphy: "Yes. Look at it. It's exactly as ridiculous as I'd hoped. Sebastian! My bag." She's no idea what any of it's worth.`,
    { kind: 'itemFrom', ids: ['nugget', 'rare-candy', 'big-nugget'], count: 1 }, flag('kanto-sevii-resort'), flag(`kanto-resort-${mon}`), dock('five')), { requires: [species(mon), not(`kanto-resort-${mon}`)] });
  s.entry('The Lady of the Resort', 'A veranda. A parasol. A young lady who\'s seen everything on the island twice. Selphy: "I\'m bored. It\'s a medical condition; I\'ve had it since birth. I should like to see a..." (a different one each time) "...Have you one? Don\'t fetch one. Either you have, or the wish passes."',
    [c('Hear her wish.', o('She names one, then another, then a third, in case.', s.open('wish'))),
      c('Let her look at your lead.', o('She doesn\'t clap. She looks at it for a while. "That one I shan\'t get bored of. Odd." From the bottom of the bag: a Master Ball, "a sort of paperweight."', item('master-ball'), flag('kanto-resort-master'), dock('five')), { requires: [is('kanto-sevii-resort', 3), not('kanto-resort-master')] }),
      c('Back to Five Island\'s dock.', o('She waves you off with the parasol.', dock('five')))], { room: true });
  s.room('wish', 'The Lady of the Resort: The Wish', 'Selphy, waiting, the parasol tilted.',
    [wish('psyduck', 'Psyduck'), wish('slowpoke', 'Slowpoke'), wish('farfetchd', 'Farfetch\'d'), c('"I haven\'t one."', o('"Then the wish passes."', dock('five')))]);
}

// ---------- The Water Labyrinth (on any ferry crossing)
{
  const s = isle('cs.kanto.sevii.labyrinth', 'The Water Labyrinth', ['kanto.sevii.labyrinth'], 'A reef with one hut');
  s.entry('The Water Labyrinth', 'A reef with one hut. Captain Tidewell slows without being asked. "He\'ll want to look at yours. Let him. Don\'t talk. He hates talk." A man on the rock. He looks at your lead. Not at you. A long time. The sea goes in and out. Your lead looks back at him, and then, checking, up at you.',
    [c('(Say nothing.)', o('He nods. He goes into the hut. He comes out with something wrapped in his own coat: an Egg he\'s been keeping warm. "It looked up at you. To see if you were all right with me. That\'s all I check."',
      { kind: 'egg', species: ['pichu', 'cleffa', 'igglybuff', 'togepi', 'tyrogue', 'smoochum', 'elekid', 'magby'], types: [], levelBonus: 0, shinyMultiplier: 1, left: 3, unit: 'battle' }, flag('kanto-sevii-labyrinth'), moment('The man on the reef gave you an Egg, because your lead looked up at you.'), dock('knot')), { requires: [bondAt(2)] }),
      c('(Say nothing, and wait.)', o('"Come back when it looks at you differently." He means it: on any later crossing, he looks again.', dock('knot')))], { room: true });
}

// ---------- The Last Ferry (on leaving the islands for good)
{
  const s = isle('cs.kanto.sevii.ferry', 'The Last Ferry', ['kanto.sevii.done'], 'The mainland');
  const home = (label: string) => c(label, o('Captain Tidewell: "Aye. That\'s how it gets you." A full rest. The Notebook gains a page: every island visited, and one line for each person helped.',
    heal(1), flag('kanto-sevii-done'), moment('Took the last ferry back from the Sevii Islands, with sand in everything.'), { kind: 'leavePseudo' }));
  s.entry('The Last Ferry', 'The ferry back. Who\'s on the dock depends on what was done.',
    [c('Look along the dock.', o('Faces, and the haze behind them.', s.open('dock'))), c('"Not yet."', o('He turns the boat round without a word.', dock('knot')))],
    { room: true, remembers: [
      { id: 'wall', when: [is('kanto-sevii-wall')], notice: 'On the dock: Celio, with a cable still round his neck, waving with both arms.' },
      { id: 'girl', when: [is('kanto-sevii-berryforest')], notice: 'Lostelle, on her father\'s shoulders. He\'s got both hands on her ankles. He isn\'t wiping anything.' },
      { id: 'quiet', when: [is('kanto-sevii-places', 0, 0)], notice: 'The dock\'s empty. Captain Tidewell: "Quiet trip. Nothing wrong with quiet."' }] });
  s.room('dock', 'The Last Ferry: The Dock', 'Further along.',
    [c('The end of the dock.', o('The rope comes in.', s.open('away')))],
    { remembers: [
      { id: 'winter', when: [is('kanto-sevii-icefall')], notice: 'Old Winter. She doesn\'t wave. She\'s there. The Dewgong waves for her.' },
      { id: 'boy', when: [is('kanto-sevii-pillar')], notice: 'The boy from the Pillar, with a bottle.' },
      { id: 'selphy', when: [is('kanto-sevii-lostcave')], notice: 'A parasol, at the back, pretending to be passing.' }] });
  s.room('away', 'The Last Ferry: Away', 'The islands go down into the haze, one at a time, last first. The mainland comes up out of it. Captain Tidewell: "Sand in everything?"',
    [home('"Everything."'), home('"I\'ll be back."')],
    { remembers: [{ id: 'stall', when: [is('kanto-sevii-places', 12)], notice: 'Miss Quoyle\'s shut the shop to come. There\'s a sign on it: BACK IN TEN. SEEING OFF A REASON.' }] });
}
