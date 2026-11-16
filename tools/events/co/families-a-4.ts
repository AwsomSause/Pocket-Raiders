// Catalog Overhaul Pack: STORY_FAMILIES_3.md, part one. SF13 The Circuit (rung events and set pieces) and SF14 The Contest Circuit.
// Build: npm run co:build -- families-a-4. The Circuit's frame is the rivals row's R1 (rivals-1.ts): the board, `circuit-rung`,
// `{rung}`, one match per stage (`circuit-at`). These rung events climb the same board. Run memory is same-run only (Kice).
import { again, ch, fight, flag, fr, heal, item, out, $, room, relic, stat, stopHere, trainer, bondUp, type Json } from '../dsl.ts';
import { is, not, safe, sub, v, withRooms } from './_fa.ts';
import { feel, foe, mark, quest, rival, rq, say } from './_rivals.ts';

export const CATEGORY = 'families-a';
export const REMOVE: string[] = [];

// =====================================================================================================================
// SF13. THE CIRCUIT. Each rung is one match. Win: one rung up. Lose: the rung stays and the match comes back at a later plaza.
// =====================================================================================================================
const ON = is('circuit-entered');
/** Your rung is in this tier, and you have not played a Circuit match this stage. */
const tier = (a: number, b: number): Json => rq({ circuit: { rungAtLeast: a, rungAtMost: b }, stale: 'circuit-at' });
const STAMP = quest({ stamp: 'circuit-at' });
const UP = quest({ circuit: 'win' });
/** A rung match: one stage stamp; a win climbs one rung, a loss brings this match back at a later plaza. */
const match = (id: string, text: string, battle: Json, win: Json[] = [], lose: Json[] = [], ...effects: Json[]): Json =>
  fight(text, safe({ ...battle, win: [UP, ...((battle.win as Json[]) ?? []), ...win] }, again(id), ...lose), STAMP, ...effects);
const notNow = (id: string, text: string): Json => out(text, again(id));

const CIRCUIT: Json[] = [
  {
    id: 'ranked-ladder-1', requires: [ON, tier(1, 4)],
    intro: 'A Pokémon Center lobby, warm and loud, and against the far wall a bulletin board with a ranked ladder chalked across it. Names in neat columns, some rubbed out and written higher, some rubbed out and never written again. Yours is at the bottom. The ladder clerk, an old man called Benn with chalk dust in the creases of his knuckles, taps it. Benn: "Climb it. Every win unlocks a tougher opponent further down the road." He looks at you over his glasses. "Bronze is where everybody starts. Even the Champion. Especially the Champion." Across the lobby a girl with a Bronze badge pinned to her bag is sitting very straight on a bench, and shaking.',
    choices: [
      ch('Challenge the kid.', match('ranked-ladder-1', 'Her name is Pell, and it is her first ranked match, and she bows so low her bag slides over her head. She fights like someone running down a hill, all feet and no brakes, and she is better than she thinks. Win or lose, at the end she walks across the field and shakes your hand with both of hers, and her hands have stopped shaking.', trainer('Pell', { cls: 'picnicker', size: 2, lv: 0 }), [flag('circuit-bronze')], [flag('circuit-bronze'), flag('circuit-pell-beat-you')])),
      ch('Challenge whoever\'s next.', match('ranked-ladder-1', 'Next is a man in a Bronze badge so old the paint has worn off it. Bronze Veteran Holt: "A year," he says. "A year I\'ve been stuck on this rung. You know what that does to you?" He fights like a locked door: nothing clever, nothing given.', trainer('Holt', { cls: 'veteran', size: 3, lv: 1 }), [flag('circuit-bronze')], [flag('circuit-bronze')])),
      ch('Ask the kid if she\'s okay.', out('You sit down next to her. Pell: "First match," she says, to her knees. "I\'m going to throw up." Her Pokémon is pressed against her ankle, trying to be brave for both of them.', flag('circuit-bronze'), flag('circuit-pell'), room('circuit-pell'))),
    ],
    remembers: [
      v('pell-again', [is('gl7-pell-helped')], { notice: 'The girl on the bench is Pell. The same Pell, with her badge back on her bag where it belongs. She sees you and stands up so fast she knocks the bench. Pell: "You! You\'re here! Thank you, again, for, you know. Everything."' }),
    ],
  },
  sub('ranked-ladder-1', 'circuit-pell', 'Bronze Match: Pell', 'Pell is still looking at her knees. Her Pokémon is looking at you, as if you might know what to do.', [
    ch('Breathe with me. In, and out.', match('circuit-pell', 'You breathe together until her shoulders come down. Then she stands up, and walks onto the field, and plays the best match of her life. It is a much better match than she was ever going to play shaking. Afterwards she hugs you, very quickly, and runs off before either of you can be embarrassed.', trainer('Pell', { cls: 'picnicker', size: 2, lv: 1 }), [flag('circuit-pell-calm')], [flag('circuit-pell-calm')])),
    ch('Everyone throws up their first time. Let\'s go.', match('circuit-pell', 'Pell laughs, which surprises her, and she does not throw up, and the match is ragged and brave.', trainer('Pell', { cls: 'picnicker', size: 2, lv: 0 }))),
  ]),
  {
    id: 'battle-tower-floor', requires: [ON, tier(1, 4)],
    intro: 'A tower of glass, so clean the clouds go up the side of it. At the foot of it two conductors in matching caps stand at a lift door, one tall and one short, both with the same moustache. Conductor Ike: "All aboard for the next floor!" Conductor Ume: "Seven floors. One battle each. You may stop between floors." Ike: "But if you get off, you start again." Ume: "From the bottom." Ike: "From the very bottom."',
    choices: [
      ch('Ride all seven.', fight('The doors close. The lift hums. Seven floors, seven trainers, and no nurse between them: your team gets what you can give it on the stairs and nothing else. The first three go by in a blur.', safe(trainer('Tower Trainers', { cls: 'ace-trainer', size: 2, lv: 1, chain: 3, chainHeal: 0, win: [UP, room('tower-upper')] }), again('battle-tower-floor')), STAMP)),
      ch('Stop at three.', fight('Three floors. Three trainers. You get off at the third, and Ike looks sad about it, and Ume looks as if she expected it.', safe(trainer('Tower Trainers', { cls: 'ace-trainer', size: 2, lv: 0, chain: 3, chainHeal: 0, win: [UP, flag('circuit-tower3'), $(600), stopHere('shop')] }), again('battle-tower-floor')), STAMP)),
      ch('What\'s at the top?', out('Ike: "A view." Ume: "And a Tower Pass." Ike: "Mostly the view." They both look up the long glass side of the tower at the same moment, and for a second they look very young.', flag('circuit-tower-asked'), room('battle-tower-floor'))),
    ],
    remembers: [
      v('three-again', [is('circuit-tower3')], { intro: 'The glass tower again, a region on, and the same two conductors at the same lift door. Ume sees you and raises one eyebrow under her cap. Ume: "Three again?" Ike: "Or seven this time?" Ume: "Seven floors. One battle each. You know the rules." Ike: "From the very bottom."' }),
    ],
  },
  sub('battle-tower-floor', 'tower-upper', 'All Aboard: Floor Four', 'Floor three. The doors open on an empty landing with a bench and a window. Ume is there, somehow. Ume: "You may get off here." Ike, also somehow: "But if you get off, you start again." Your team is breathing hard. Nobody has healed them. Up the shaft, four more floors of light.', [
    ch('Keep riding.', fight('Floors four, five, six. By the fifth your hands are cold. By the sixth you are laughing for no reason at all.', safe(trainer('Tower Trainers', { cls: 'ace-trainer', size: 2, lv: 2, chain: 3, chainHeal: 0, win: [room('tower-top')] }), flag('circuit-tower3')))),
    ch('Get off here.', out('You get off at the third floor. Ike looks sad about it. Ume looks as if she expected it, and presses some Battle Points into your hand anyway, and points you at the Tower shop.', flag('circuit-tower3'), $(600), stopHere('shop'))),
  ]),
  sub('battle-tower-floor', 'tower-top', 'All Aboard: The Seventh Floor', 'The seventh floor is all glass, and the whole region is under it, small and blue. One trainer waits there, alone, with the sun behind her. She has watched every floor you climbed on a little screen. She bows.', [
    ch('Last floor.', fight('The last floor. Everything you have left.', safe(trainer('Tower Tycoon', { cls: 'ace-trainer', size: 3, lv: 3, win: [UP, flag('circuit-tower7'), flag('circuit-pass'), $(1500)] }), flag('circuit-tower3'))), { }),
  ]),
  {
    id: 'ranked-ladder-2', callback: false, requires: [ON, tier(5, 8)],
    intro: 'The same kind of board in a different town, a region on, and the same old man beside it. Benn travels with the board; nobody has ever seen him without it. Your name has moved. It is not at the bottom any more. Benn: "Silver tier. Win again and you\'re close to the top." He taps a slip of paper pinned beside your name. "Your opponent asked for you. By name."',
    choices: [
      ch('Who?', match('ranked-ladder-2', 'Benn points. Across the plaza is a trainer you know from the road, someone you have stood across from before, and their team has grown since. They lift a hand. "Rematch," they say. "With history, this time."', trainer('A Face from the Road', { cls: 'ace-trainer', size: 4, lv: 1 }), [flag('circuit-silver')], [flag('circuit-silver')])),
      ch('Fine.', match('ranked-ladder-2', 'You do not ask. You walk out, and they walk out, and you both know each other\'s faces, and nobody says anything. That says plenty.', trainer('A Face from the Road', { cls: 'ace-trainer', size: 4, lv: 1 }), [flag('circuit-silver')], [flag('circuit-silver')])),
      ch('Tell them no.', match('ranked-ladder-2', 'Benn sighs through his nose, the way grandfathers do. He gives you a random Silver instead, a stranger with good manners and a very fast team. Benn: "They\'ll be disappointed," he says. "I\'m disappointed."', trainer('Silver Challenger', { cls: 'ace-trainer', size: 4, lv: 0 }), [flag('circuit-silver')], [flag('circuit-silver')])),
    ],
    remembers: [
      v('pell', [is('circuit-pell')], { notice: 'The name on the slip is Pell. She is across the plaza, with a Silver badge on her bag now, and she is not shaking at all. She waves both arms over her head. She is much, much better now.' }),
    ],
  },
  {
    id: 'fan-club-tournament', requires: [ON, tier(5, 8)],
    intro: 'A stadium full of fans, painted faces, foam hands, and a roar that goes round the stands like a wave and comes back. They chant for whoever just scored a knockout, and change sides without shame. The announcer\'s voice comes down from everywhere at once. Announcer: "Take the crowd, take the match! Every knockout gets a cheer. Every cheer fills the meter. Fill it and the judges give you the round!"',
    choices: [
      ch('Play to the crowd.', match('fan-club-tournament', 'You play it big. Every move a little higher, a little brighter than it needs to be. The crowd loves you for it, and the crowd\'s love is a thing you can feel in your teeth.', trainer('Fan Favourite', { cls: 'ace-trainer', size: 3, lv: 0, rule: { fanClub: true } }), [flag('circuit-fan-crowd'), flag('fan-sash'), flag('rep')])),
      ch('Play to win.', match('fan-club-tournament', 'A normal battle, and a good one. The crowd cheers the knockouts and nothing else, and that is fair.', trainer('Fan Favourite', { cls: 'ace-trainer', size: 3, lv: 0 }), [flag('circuit-fan'), flag('fan-sash')])),
      ch('Ignore the crowd.', match('fan-club-tournament', 'The crowd notices. The crowd boos. Every knockout your opponent scores is louder than the last one, and their side of the field is lifted by it.', trainer('Fan Favourite', { cls: 'ace-trainer', size: 3, lv: 1, rule: { fanClub: true } }), [flag('circuit-fan'), flag('fan-sash')])),
    ],
    remembers: [
      v('axel', [is('roster-axel-done')], { notice: 'Up in the stands, in the front row, is Rocker Axel, holding a sign over his head. It has your name on it, spelled wrong, in glitter.' }),
    ],
  },
  {
    id: 'ranked-ladder-3', callback: false, requires: [ON, tier(9, 12)],
    intro: 'The top of the ladder. The lobby goes quiet when you walk in, which has never happened before. Benn is waiting at the board with the chalk already in his hand. Benn: "Gold tier. The best of the best." He looks at your name for a long moment. "I\'ve done this board twenty years. I\'ve never seen anyone climb it faster than you." A pause. "Or slower than you on the first rung." He nearly smiles.',
    choices: [
      ch('Thanks?', match('ranked-ladder-3', 'Benn: "It was a compliment. Mostly." Your opponent is an Ace Trainer with a full team and no smile at all.', trainer('Gold Ace', { cls: 'ace-trainer', size: 6, lv: 2 }), [flag('circuit-gold')], [flag('circuit-gold')])),
      ch('Who\'s my opponent?', match('ranked-ladder-3', 'Benn points with the chalk. An Ace Trainer, sitting perfectly still, with six Balls on her belt and the look of someone who has never lost at Gold.', trainer('Gold Ace', { cls: 'ace-trainer', size: 6, lv: 2 }), [flag('circuit-gold')], [flag('circuit-gold')])),
      ch('Let\'s go.', match('ranked-ladder-3', 'You do not wait for the chalk to stop squeaking. The Ace Trainer is already on the field.', trainer('Gold Ace', { cls: 'ace-trainer', size: 6, lv: 2 }), [flag('circuit-gold')], [flag('circuit-gold')])),
    ],
    remembers: [
      v('rival', [rq({ circuit: { gapAtLeast: 0, gapAtMost: 0 } })], {
        intro: 'The top of the ladder. Two names on the Gold rung, side by side in the same chalk: yours, and {rival}\'s. Benn looks from one of you to the other. Benn: "Gold tier. The best of the best." {rival} is already on the field. {rival}: "This isn\'t the final." A beat. "But I want to know."',
        hide: [0, 1, 2],
        add: [ch('This isn\'t the final.', match('ranked-ladder-3', 'It is a preview, and you both know it. You both hold something back. You both see the other one holding it back. It is still the best match of the day.', rival({ lv: 2, size: 6 }), [flag('circuit-gold'), flag('circuit-gold-rival'), feel({ respect: 1 })], [flag('circuit-gold'), feel({ respect: 1 })]))],
      }),
    ],
  },
  {
    id: 'ev-trainer-tournament', requires: [ON, tier(9, 12)],
    intro: 'Banners over an arena: BATTLE FRONTIER, FOUR ROUNDS. Flags of every region snap in the wind. At a little desk under the banners, a clerk with a stamp. Frontier clerk: "Four rounds. Win four, or lose one and you\'re out." She stamps something without looking at it. "No items in battle. Your Pokémon heal between rounds. That\'s the only kindness we do here."',
    choices: [
      ch('Enter.', fight('Four rounds. No bag. Your team comes back to you whole between each one, and goes out again, and comes back. Win all four and the clerk stamps a Frontier Symbol into your card, heavier than it looks, and your lead stands a little taller for the rest of the run.', safe({ ...trainer('Frontier Brains', { cls: 'ace-trainer', size: 3, lv: 2, chain: 3, chainHeal: 1, rule: { noItems: true } }), win: [heal(1), room('frontier-final')] }, again('ev-trainer-tournament')), STAMP)),
      ch('Watch a round first.', fight('You sit in the stands for one round. You see the bracket\'s ace, and you see the one move it opens with every time, and you write it on the back of your hand. Then you enter.', safe({ ...trainer('Frontier Brains', { cls: 'ace-trainer', size: 3, lv: 1, chain: 3, chainHeal: 1, rule: { noItems: true } }), win: [heal(1), flag('circuit-scouted'), room('frontier-final')] }, again('ev-trainer-tournament')), STAMP)),
      ch('Not now.', notNow('ev-trainer-tournament', 'The clerk shrugs and stamps a form that says NOT NOW. Frontier clerk: "We\'re here next region. We\'re always here."')),
    ],
  },
  sub('ev-trainer-tournament', 'frontier-final', 'Win Four: The Last Round', 'Three rounds won. Your team is healed and standing, and the clerk stamps a third square on your card, and looks at the fourth. Frontier clerk: "Last round. Same rules. No bag." The fourth opponent is already waiting, and has not watched any of your matches, on purpose.', [
    ch('Fourth round.', fight('One more. No bag. Everything you have.', safe(trainer('Frontier Brain', { cls: 'ace-trainer', size: 4, lv: 3, rule: { noItems: true }, win: [UP, flag('circuit-frontier'), flag('frontier-symbol'), stat('best', { who: 'lead' })] })))),
  ]),
  // ---------- The Exhibition Bracket (ps_fa_exhibition: one pseudo-stage of four rooms) ----------
  {
    id: 'story-tour-registration', requires: [{ kind: 'storyRun' }, ON, tier(9, 12)],
    intro: 'Banners over the arena: THE EXHIBITION BRACKET. Eight trainers, single elimination, tonight only. Inside, the lights buzz, flicker, steady. At the desk, a clerk with a cardigan and a kind face. Desk clerk Moira: "Entry\'s free. It\'s an exhibition. Bragging rights." The lights flicker again. She does not look up. "The power\'s been flickering all week. Don\'t worry about it."',
    choices: [
      ch('Sign me up.', out('Moira writes your name in the eighth slot, in pencil, and then, after a moment, goes over it in pen.', flag('exhibit-in'), room('story-tour-opening'))),
      ch('Who else is in?', out('Moira turns the sheet round. Eight names: yours; {rival}\'s, in big letters; three names you know from the road; and three strangers, one of them written in a hand so careful it looks printed.', flag('exhibit-in'), room('story-tour-opening'))),
      ch('Flickering?', out('Moira: "Old building. Old wires." Behind her, a maintenance man in grey overalls is standing by the fuse box with a toolbag, and when he sees you looking, he looks away too fast.', flag('exhibit-in'), flag('exhibit-wires'), room('story-tour-opening'))),
    ],
  },
  sub('story-tour-registration', 'story-tour-opening', 'Round of Eight', 'The parade of entrants, one by one into the light. The crowd claps for everyone, even the strangers. Announcer: "Round of eight. Make it a good one." Your first opponent bows. He is a young man with a travelling coat and a Pokémon from the region you just left. Sergei: "I came a long way for this. Please don\'t go easy."', [
    ch('I won\'t.', fight('You don\'t. Neither does he. He has a Pokémon from your last region, and it fights like it remembers the same roads.', safe(trainer('Sergei', { cls: 'ace-trainer', size: 3, lv: 1, win: [flag('exhibit-r8'), room('story-tour-semi')] }), flag('exhibit-out')))),
    ch('Bow back.', fight('You bow back, just as low. The crowd likes it. A girl in the front row does it too, to her Pokémon, who does it back.', safe(trainer('Sergei', { cls: 'ace-trainer', size: 3, lv: 1, win: [flag('exhibit-r8'), room('story-tour-semi')] }), flag('exhibit-out')), flag('exhibit-bowed'), flag('rep'))),
    ch('Where from?', fight('Sergei: "Your last region," he says. "I saw you there. I thought: I want to fight that one, properly, somewhere with lights." He sends out a Pokémon from home.', safe(trainer('Sergei', { cls: 'ace-trainer', size: 3, lv: 1, win: [flag('exhibit-r8'), room('story-tour-semi')] }), flag('exhibit-out')))),
  ], { requires: [{ kind: 'storyRun' }] }),
  sub('story-tour-registration', 'story-tour-semi', 'The Lights Die', 'The semifinal. Turn three, and every light in the arena dies at once. Gasps. Somebody laughs, too loud. In the dark, your opponent\'s voice, very close: "Do we keep going?" A child in the stands starts to cry.', [
    ch('Keep going.', fight('You fight on by sound and memory. Nobody can see where anything lands, and then, after three long turns, the lights come back on in a rush and everyone blinks.', safe(trainer('Semifinalist', { cls: 'ace-trainer', size: 4, lv: 1, rule: { accuracyMult: 0.8, accuracyTurns: 3 }, win: [flag('exhibit-semi'), room('story-tour-final')] }), flag('exhibit-out')), flag('exhibit-dark-fought'))),
    ch('Wait.', fight('You wait. The dark is very big. Then, from high in the stands, one pair of hands clapping slowly. Steady. A second pair joins. A third. The crying child stops to listen. When the lights come back, {rival} is sitting down again, looking at the ceiling, as if it was nobody.', safe(trainer('Semifinalist', { cls: 'ace-trainer', size: 4, lv: 1, win: [flag('exhibit-semi'), room('story-tour-final')] }), flag('exhibit-out')), flag('exhibit-waited'), feel({ trust: 1 }))),
    ch('Call to the crowd.', fight('You call up into the dark. One phone lights. Then forty. Then the whole arena is a field of small cold stars, and the child in the stands is holding one up too, and you finish the match by their light.', safe(trainer('Semifinalist', { cls: 'ace-trainer', size: 4, lv: 1, win: [flag('exhibit-semi'), room('story-tour-final')] }), flag('exhibit-out')), flag('exhibit-crowd'), flag('rep'))),
  ], {
    requires: [{ kind: 'storyRun' }],
    remembers: [
      v('wires', [is('exhibit-wires'), not('exhibit-found')], {
        notice: 'In the dark, by the emergency light, you see the maintenance man from the fuse box. He is not fixing anything. He is leaving.',
        add: [ch('Find him.', fight('You catch him at the fire door with his toolbag. Inside it: wire cutters, and an envelope of cash with {evil}\'s mark on it. He was paid to cut the lights. Maintenance Man: "They said nobody\'d get hurt! They said it was a test!" He fights rather than talk any more. In his pocket, folded small, is a list of dates and places. One of them is somewhere you are going.', safe(trainer('Maintenance Man', { cls: 'worker', size: 2, lv: 1, win: [flag('exhibit-found'), { kind: 'evil', heat: -1, mark: 'plan-seen' }, room('story-tour-semi')] }), flag('exhibit-found'), room('story-tour-semi'))))],
      }),
    ],
  }),
  sub('story-tour-registration', 'story-tour-final', 'Of Course It\'s You', 'The lights are back, and steady. One name left on the board across from yours. {rival} walks out of the far tunnel and stops on the line. {rival}: "Of course it\'s you." Then: {rival}: "{say champion||bitter-challenger::Exhibition my foot. This counts.||protector::Let\'s give them a show.||enthusiast::Let\'s give them a show!||strategist::I\'ve prepared for this specific outcome.||champion-chaser::Smile for the cameras.}"', [
    ch('Give them a show.', fight('You both play it high and bright. Every move is a little bigger than it needs to be, and the crowd comes up out of its seats.', rival({ lv: 1, size: 6, win: [UP, flag('exhibit-final'), flag('exhibit-trophy'), flag('rep'), flag('rep')], lose: [flag('exhibit-final'), flag('rep')] }))),
    ch('This counts.', fight('Full strength. No show. {rival} hears it in your voice and their face goes very still, and then very glad.', rival({ lv: 2, size: 6, win: [UP, flag('exhibit-final'), flag('exhibit-trophy'), mark('outplayed-by-you')], lose: [flag('exhibit-final')] }))),
    ch('Exhibition. No pressure.', fight('{rival} laughs out loud. They relax, and play odd, fun choices they would never risk in a real match, and so do you, and halfway through you are both grinning like children.', rival({ lv: 0, size: 6, win: [UP, flag('exhibit-final'), flag('exhibit-trophy'), feel({ friendship: 1 })], lose: [flag('exhibit-final'), feel({ friendship: 1 })] }))),
  ], {
    requires: [{ kind: 'storyRun' }],
    remembers: [
      v('stranger', [rq({ circuit: { gapAtLeast: 3 } })], {
        intro: 'The lights are back, and steady. One name left on the board across from yours, and it is not {rival}\'s. It is the stranger with the careful handwriting. {rival} lost in the round before. They are in the stands now, red-eyed, cheering for you anyway, louder than anyone.',
        hide: [0, 1, 2],
        add: [ch('Play for both of you.', fight('The stranger is very, very good. You can hear {rival} over the whole crowd.', safe(trainer('The Careful Stranger', { cls: 'ace-trainer', size: 5, lv: 2, win: [UP, flag('exhibit-final'), flag('exhibit-trophy'), feel({ friendship: 1 })] }), flag('exhibit-final'))))],
      }),
    ],
  }),
  {
    id: 'champion-cup', requires: [ON, rq({ circuit: { rungAtLeast: 13, rungAtMost: 15 }, stale: 'circuit-at' }), not('circuit-qualified')],
    intro: 'A qualifier for the big tournament, in a hall with too much marble. Only strong teams enter; you can see it in the way people stand. An official with a clipboard checks your card. Official: "You need fifteen rungs to qualify. You have {rung}." She looks up. "If you\'re short, you can fight for it here. Three in a row, no healing."',
    choices: [
      ch('Fight for it.', fight('Three hard battles, one after another, and nobody comes to heal your team between them. By the third, your lead is fighting on will alone, and so are you. Win all three and the official writes your name on the Champion Cup list, her pen pressing hard.', safe(trainer('Qualifier Gauntlet', { cls: 'ace-trainer', size: 3, lv: 2, chain: 3, chainHeal: 0, win: [UP, flag('circuit-qualified')] }), again('champion-cup')), STAMP)),
      ch('Show my rungs.', out('You hand over your card. Fifteen rungs. The official counts them twice, and stamps it, and for the first time she smiles. Official: "Qualified."', flag('circuit-qualified'), STAMP), { requires: [rq({ circuit: { rungAtLeast: 15 } })] }),
      ch('Not ready.', out('Official: "It comes back once more before the League." She does not say it unkindly. "Most people aren\'t, the first time."', again('champion-cup'))),
    ],
  },
  // ---------- The Rival Circuit (the existing round tracker; prize money shown up front) ----------
  {
    id: 'tournament-entry', requires: [{ kind: 'rivalMet', atLeast: 1 }, { kind: 'tournament', round: 0 }, is('circuit-qualified')],
    intro: 'A banner across the whole plaza: THE RIVAL CIRCUIT. Trainers you have crossed paths with are queueing to sign up, and every one of them looks round when you arrive. The clerk has a cash box and a list. Clerk: "Entry\'s ₽300. The bracket runs over the next stages. Prize money each round: ₽300, ₽600, ₽1,200." He lowers his voice. "Everyone here has met you. Odd, that. Like it was arranged." On the list, {rival} has signed the line above yours, and left it blank for you.',
    choices: [
      ch('Pay ₽300.', out('You sign the blank line. The clerk drops your coins in the box one by one, counting aloud, so you can hear that it is honest.', $(-300), { kind: 'tournament', round: 1 }, flag('rcircuit-in')), { requires: [{ kind: 'money', atLeast: 300 }] }),
      ch('Who arranged it? (₽300)', out('Clerk: "The Champion. She likes stories." He takes your ₽300 and writes your name under {rival}\'s. Somewhere above the plaza, a window has its curtain drawn back an inch.', $(-300), { kind: 'tournament', round: 1 }, flag('rcircuit-in'), flag('rcircuit-asked')), { requires: [{ kind: 'money', atLeast: 300 }] }),
      ch('Not this one.', out('You step out of the queue. {rival} sees you go. They do not say anything. They do not need to.', { kind: 'tournament', round: 9 }, feel({ trust: -1 }))),
    ],
  },
  {
    id: 'tournament-quarter',
    intro: 'The first match, under a lively crowd. Across the field is the trainer from the road you have met most often, the one who keeps turning up at the same crossroads at the same time. Their team has grown since last time. They grin. "We keep running into each other. Might as well make it official."',
    choices: [
      ch('Make it official.', fight('It is official. It is also fun, which nobody expected.', trainer('Familiar Face', { cls: 'ace-trainer', size: 4, lv: 1, win: [$(300), { kind: 'tournament', round: 2 }], friendly: true, lose: [{ kind: 'tournament', round: 9 }] }))),
      ch('No hard feelings.', fight('"Never," they say, and mean it, and then try very hard to beat you.', trainer('Familiar Face', { cls: 'ace-trainer', size: 4, lv: 1, win: [$(300), { kind: 'tournament', round: 2 }], friendly: true, lose: [{ kind: 'tournament', round: 9 }] }))),
      ch('Let\'s give them a show.', fight('You both play to the stands, and the stands pay you back.', trainer('Familiar Face', { cls: 'ace-trainer', size: 4, lv: 1, win: [$(300), { kind: 'tournament', round: 2 }, flag('rep')], friendly: true, lose: [{ kind: 'tournament', round: 9 }] }))),
      ch('Withdraw from the bracket.', out('You hand back your number. The bracket carries on without you.', { kind: 'tournament', round: 9 })),
    ],
  },
  {
    id: 'tournament-semi',
    intro: 'The field has thinned. Your opponent is a stranger in a neat jacket with a notebook under her arm, and she has clearly studied your last match. Clementine: "You lead with the same Pokémon nine times out of ten." She taps the notebook. "Let\'s see about the tenth."',
    choices: [
      ch('Lead with something new.', fight('Her counters are wasted on the first turn. She frowns, flips a page, and adapts by the third. She is very good.', trainer('Clementine', { cls: 'ace-trainer', size: 4, lv: 1, win: [$(600), { kind: 'tournament', round: 3 }, flag('rcircuit-semi')], friendly: true, lose: [{ kind: 'tournament', round: 9 }] }))),
      ch('Lead the same.', fight('She is ready. Her lead is a hard counter to yours, and she knew it would be, and so did you.', trainer('Clementine', { cls: 'ace-trainer', size: 4, lv: 2, win: [$(600), { kind: 'tournament', round: 3 }, flag('rcircuit-semi')], friendly: true, lose: [{ kind: 'tournament', round: 9 }] }))),
      ch('Show me your notes.', fight('She blinks. Then she hands them over. They are good: careful, fair, a little in awe of you. She is flattered that you asked, and plays you honestly, with no tricks at all.', trainer('Clementine', { cls: 'ace-trainer', size: 4, lv: 0, win: [$(600), { kind: 'tournament', round: 3 }, flag('rcircuit-semi')], friendly: true, lose: [{ kind: 'tournament', round: 9 }] }))),
      ch('Withdraw from the bracket.', out('You hand back your number. The bracket carries on without you.', { kind: 'tournament', round: 9 })),
    ],
    remembers: [
      v('selene', [is('roster-selene-done')], { notice: 'Clementine is Cooltrainer Selene\'s student. Selene is in the front row of the stands, making faces at both of you, and Clementine is trying very hard not to laugh.' }),
    ],
  },
  {
    id: 'tournament-final',
    intro: 'The final. The best of the circuit stands across the field from you, and the whole plaza has gone quiet. Then the Champion herself walks out between you, and the quiet gets deeper. The Champion: "I arranged this circuit because I wanted to see who you\'d all become." She looks from one of you to the other. "Thank you for showing me."',
    choices: [
      ch('Thank you.', out('She smiles, and steps back, and the final purse of ₽1,200 is set on the table between the two tunnels, for whoever walks out last.', $(1200), { kind: 'tournament', round: 9 }, flag('rcircuit-final'), room('rq-circuit-final'))),
      ch('Let\'s begin.', out('The Champion nods once and steps back. The purse is on the table. The crowd leans in.', $(1200), { kind: 'tournament', round: 9 }, flag('rcircuit-final'), room('rq-circuit-final'))),
      ch('Why us?', out('The Champion: "Because you kept meeting each other," she says. "That\'s how rivals are made." She steps back, and the purse of ₽1,200 is on the table, and it does not seem very important any more.', $(1200), { kind: 'tournament', round: 9 }, flag('rcircuit-final'), room('rq-circuit-final'))),
    ],
  },
];

// =====================================================================================================================
// SF14. THE CONTEST CIRCUIT. One Contest Partner, five ribbons, the Grand Festival. Nobody faints: contests are the
// `contest` rule (damage leaves the foe at 1 HP; you win once you have used N different moves).
// =====================================================================================================================
const RIBBON = flag('contest-ribbons');
/** The Contest Partner: picked at the first contest (remembered for the run; the scenes after read it as `picked`). */
const PARTNER = { pick: { types: [] } };
const STARTER_PARTNER: Json = { kind: 'picked', types: [], starter: true };
const show = (name: string, moves: number, o: { lv?: number; win?: Json[]; format?: 'doubles'; cls?: string } = {}): Json =>
  safe(trainer(name, { cls: o.cls ?? 'aroma-lady', size: 3, lv: o.lv ?? 0, rule: { contest: moves }, ...(o.format ? { format: o.format } : {}), win: o.win ?? [] }));

const CONTESTS: Json[] = [
  {
    id: 'contest-hall',
    intro: 'Spotlights sweep a stage the colour of a sweet. Glitter hangs in the air and does not seem to fall. A host in sequins sweeps out of the wings with her arms wide. Host Vivienne: "Beauty, Cool or Cute? Pick your category and your partner!" She leans down to the front row, to you. "Your partner stays your partner all season, darling. Choose with your heart."',
    choices: [
      ch('Beauty.', fight('You choose your partner, and it walks into the spotlight like it was born there. Three moves, judged on grace. Nobody faints. Everybody watches. Win, and a pale blue ribbon is pinned to your partner, and it keeps looking down at it.', show('Beauty Rival', 3, { win: [RIBBON, fr(4, 'picked')] }), flag('contest-partner'), flag('contest-cat-beauty'), again('contest-hall')), PARTNER),
      ch('Cool.', fight('You choose your partner, and it walks into the spotlight without looking at the crowd at all, which makes the crowd look harder. Three moves, judged on nerve. Win, and it gets a deep red ribbon, and pretends not to care, and checks it is still there every few steps.', show('Cool Rival', 3, { win: [RIBBON, fr(4, 'picked')] }), flag('contest-partner'), flag('contest-cat-cool'), again('contest-hall')), PARTNER),
      ch('Cute.', fight('You choose your partner, and it trips on the way into the spotlight, and the whole hall goes "aww", and that is half the round won already. Three moves, judged on charm. Win, and the ribbon is pink with a little bell, and your partner rings it on purpose.', show('Cute Rival', 3, { win: [RIBBON, fr(4, 'picked')] }), flag('contest-partner'), flag('contest-cat-cute'), again('contest-hall')), PARTNER),
    ],
    remembers: [
      v('starter', [STARTER_PARTNER], { notice: 'Vivienne reads your card and stops. She whispers to the judges. Vivienne: "Your partner is the first one, isn\'t it? The one you started with." The judges nod, and write something down, and score it a point higher for history.' }),
    ],
  },
  {
    id: 'beauty-pageant',
    intro: 'A stage, three judges, lights so hot you can feel them on your face. An organiser with a headset and an enormous clipboard rushes over, glowing. Organiser: "I saw your lead and I just KNEW. It\'s already on the list!" She is beaming. "You don\'t mind?"',
    choices: [
      ch('Go along with it.', fight('Your lead performs. It is not your Contest Partner, and it does not know the steps, and it does them anyway, with great seriousness.', show('Pageant Rival', 3, { win: [$(800), fr(5, 'lead')] }), flag('contest-pageant'))),
      ch('Swap in my Contest Partner.', fight('The organiser crosses out a name and writes another, smiling hard. Your partner takes the stage like it has been waiting all week.', show('Pageant Rival', 3, { win: [RIBBON, $(400)] }), flag('contest-pageant')), { requires: [is('contest-partner')] }),
      ch('Withdraw.', out('The organiser\'s face folds. She says it\'s fine. She says it\'s totally fine. She is crying before you reach the door. You will see her again.', flag('contest-organiser-hurt'))),
    ],
  },
  {
    id: 'contest-judges-challenge',
    intro: 'A judge in a black turtleneck sits alone at a long table, tapping a clipboard with a pen. He does not look up. Judge Marcel: "Show me style, not just strength." Tap. "Four different moves and the judges will be impressed. Repeat one and we\'ll be bored." Tap. "We are very easily bored."',
    choices: [
      ch('Four moves.', fight('A judged round. Four different moves, no repeats, and Marcel does not blink once.', show('Marcel\'s Test', 4, { cls: 'veteran', win: [RIBBON] }), flag('contest-styled'))),
      ch('Ask for tips.', fight('Marcel looks up for the first time. Marcel: "Open small. End big. Never the same type twice in a row." He goes back to tapping. You listen, and it helps.', show('Marcel\'s Test', 4, { cls: 'veteran', lv: -1, win: [RIBBON] }), flag('contest-styled'), flag('contest-tips'))),
      ch('Strength is style.', fight('Marcel sighs, the sigh of a man who has heard it before. Your strongest move scores nothing at all this round; the judges cross it out. Everything else has to carry you.', show('Marcel\'s Test', 5, { cls: 'veteran', lv: 1, win: [RIBBON] }), flag('contest-styled'))),
    ],
  },
  {
    id: 'contest-pass-hall',
    intro: 'Your Contest Pass gets you through a gold door onto the biggest stage you have seen, and the crowd is already there, waiting, in the hush before something. Vivienne sweeps out in a new set of sequins. Vivienne: "Super Contest! An appeal round, then a battle round where nobody faints, darling. We only score."',
    choices: [
      ch('Go.', fight('Two rounds: appeal, then battle. Your partner leads both.', show('Super Contest', 4, { lv: 1, win: [RIBBON, $(600)] }), flag('contest-super'))),
      ch('Calm my partner first.', fight('You crouch down in the wings and put your forehead to your partner\'s, and stay there until you are both breathing the same. The appeal round goes better for it.', show('Super Contest', 4, { lv: 0, win: [RIBBON, $(600)] }), flag('contest-super'), bondUp(1, 'picked'))),
      ch('Look for a familiar face.', fight('You scan the crowd. If Beauty Bianca came, she is out there somewhere in the dark, watching you; if her story is done, she is at the judges\' table, and she winks.', show('Super Contest', 4, { lv: 1, win: [RIBBON, $(600)] }), flag('contest-super'))),
    ],
    remembers: [
      v('organiser', [is('contest-organiser-hurt'), not('contest-sorry')], {
        notice: 'At the judges\' table, in the third seat, is the organiser from the pageant. She sees you and her pen goes very still. She is going to score you one lower. She probably doesn\'t even know she is going to.',
        add: [ch('I\'m sorry about the pageant.', out('You go to the table before it starts. She looks at you for a long time. Then she laughs, wetly, and blows her nose. Organiser: "I was so excited," she says. "I get so excited." She scores you fairly. She scores you, actually, a little high.', flag('contest-sorry'), room('contest-pass-hall')))],
      }),
    ],
  },
  {
    id: 'grand-festival', name: 'The Grand Festival', group: 'Trainer Challenges', stop: 'contest', rarity: 'epic', types: [], callback: true,
    scene: { cast: ['trainer.fairy_tale_girl'], tint: '#402040', effect: 'confetti' },
    requires: [is('contest-ribbons', 5), not('festival-done')],
    intro: 'The biggest hall in the region. Every seat full, every aisle full, people standing on the stairs. Vivienne is hosting, in her best sequins, the ones she only wears once a year. Vivienne: "Five ribbons! Look at you both." She lowers the microphone and says it again, just to you. "Look at you." Then: "Three rounds tonight. Appeal. Double performance. And the final stage, which is just you two and the light." In the green room your Contest Partner looks at you, and looks at the door, and will not settle.',
    choices: [
      ch('We\'ve got this.', out('You say it like it is already true. Your partner settles against your leg. Steady, every round.', flag('festival-steady'), room('festival-appeal'))),
      ch('Just have fun.', out('Your partner\'s ears come up. Something in it lets go. It may surprise you out there; it may do a move you did not pick. Whatever it improvises, the judges will love it.', flag('festival-fun'), room('festival-appeal'))),
      ch('Win it for us.', out('Your partner squares up. The appeal round will be electric. The last round, alone in the light, might be harder.', flag('festival-pressure'), room('festival-appeal'))),
    ],
    remembers: [
      v('starter', [STARTER_PARTNER], { notice: 'Your partner is the first Pokémon you ever had. Somewhere in the crowd, you are sure of it, the Professor from home is watching.' }),
      v('organiser', [is('contest-organiser-hurt'), not('contest-sorry')], { notice: 'Up in the balcony is the pageant organiser, the one you made cry. She is clapping anyway. She is clapping hardest of anyone.' }),
      v('aipom', [is('aq22-ribbon')], { notice: 'In the third row, an Aipom is sitting on its trainer\'s head, holding up its own ribbon for you to see.' }),
    ],
  },
  sub('contest-hall', 'festival-appeal', 'Grand Festival: Appeal', 'Round one. Four moves, no repeats, judged on variety. The lights come up so bright you can\'t see the crowd at all, only hear it, like the sea.', [
    ch('Begin the appeal.', fight('Your partner moves through four moves like four words in a sentence.', show('Festival Appeal', 4, { lv: 1, win: [flag('festival-score')] }), room('festival-double'))),
  ], { remembers: [v('pressure', [is('festival-pressure')], { hide: [0], add: [ch('Begin the appeal.', fight('Your partner goes out like it is carrying something for both of you. The appeal round is electric.', show('Festival Appeal', 4, { lv: -1, win: [flag('festival-score'), flag('festival-score')] }), room('festival-double')))] }), v('steady', [is('festival-steady')], { hide: [0], add: [ch('Begin the appeal.', fight('Steady. Every move exactly where you both meant it.', show('Festival Appeal', 4, { lv: 0, win: [flag('festival-score')] }), room('festival-double')))] })] }),
  sub('contest-hall', 'festival-double', 'Grand Festival: Double Performance', 'Round two. Your partner and one more of your team, side by side, two moves each, judged on how the moves combine. A Water move and then an Ice move, the judges whisper to each other, would be very pretty.', [
    ch('Perform together.', fight('Two of your team, moving like one.', show('Festival Pairs', 4, { lv: 1, format: 'doubles', win: [flag('festival-score')] }), room('festival-final'))),
  ], { remembers: [v('steady', [is('festival-steady')], { hide: [0], add: [ch('Perform together.', fight('Steady again. They catch each other\'s moves like a ball thrown underarm.', show('Festival Pairs', 4, { lv: 0, format: 'doubles', win: [flag('festival-score')] }), room('festival-final')))] })] }),
  sub('contest-hall', 'festival-final', 'Grand Festival: The Final Stage', 'Round three. The lights go down to one. Your partner walks into it alone, and the whole hall stops breathing. Across the stage, in the dark, is the last coordinator: Beauty Bianca with her Milotic if her story is done, or else a stranger called Sorrel-Ann, with a Ninetales whose tails move like smoke. The judges will score how it looks, not how hard it hits.', [
    ch('One move, in the light.', fight('One move. You pick it. Your partner does it in the light, and for a moment there is nothing else in the world.', show('Sorrel-Ann', 2, { lv: 2, win: [room('festival-won')] }), room('festival-lost'))),
  ], {
    remembers: [
      v('fun', [is('festival-fun')], { hide: [0], add: [ch('One move, in the light.', fight('You pick a move. Your partner does a different one, one you never taught it, and it is perfect, and the judges are on their feet.', show('Sorrel-Ann', 2, { lv: 1, win: [room('festival-won')] }), room('festival-lost')))] }),
      v('pressure', [is('festival-pressure')], { hide: [0], add: [ch('One move, in the light.', fight('Your partner walks into the light carrying everything you asked it to carry, and its legs are shaking.', show('Sorrel-Ann', 2, { lv: 3, win: [room('festival-won')] }), room('festival-lost')))] }),
    ],
  }),
  sub('contest-hall', 'festival-won', 'And the Ribbon Cup Goes To', 'Vivienne: "And the Ribbon Cup goes to..." She does not finish. She does not have to. The whole hall is already on its feet.', [
    ch('Hold it up together.', out('You lift the Cup together, you and your partner, and the roar is so big it is almost silent.', relic('ribbon-cup', 'The Ribbon Cup', [{ kind: 'firstAttackDamage', first: 1.1, later: 1 }]), flag('festival-done'), flag('festival-won'), flag('rep'), flag('rep'), bondUp(1, 'picked'))),
    ch('Give the partner the ribbon.', out('You pin the champion\'s ribbon to your partner, carefully, with Vivienne holding the light so you can see. It will wear it for the rest of the run.', relic('ribbon-cup', 'The Ribbon Cup', [{ kind: 'firstAttackDamage', first: 1.1, later: 1 }]), flag('festival-done'), flag('festival-won'), bondUp(2, 'picked'))),
    ch('Thank the crowd.', out('You turn to the crowd and bow, and Vivienne starts crying into her microphone, which the whole hall hears. Afterwards she hugs you in the corridor and gives you her own spare sequins, which are not useful, and a voucher for the hall\'s shop, which is.', relic('ribbon-cup', 'The Ribbon Cup', [{ kind: 'firstAttackDamage', first: 1.1, later: 1 }]), flag('festival-done'), flag('festival-won'), stopHere('shop'), $(500))),
  ]),
  sub('contest-hall', 'festival-lost', 'Second Place', 'Second place. Vivienne puts the silver ribbon in your hand, and squeezes it closed, and says something you will not remember. Your partner is looking at you. It is trying to read your face.', [
    ch('You were wonderful.', out('It was. You tell it so, and keep telling it, all the way out of the hall.', bondUp(2, 'picked'), item('silk-scarf'), flag('festival-done'), flag('festival-second'))),
    ch('Next year.', out('Your partner leans its whole weight against your leg. Next year. It has decided.', bondUp(2, 'picked'), item('silk-scarf'), flag('festival-done'), flag('festival-second'))),
    ch('Say nothing and hug it.', out('You say nothing. You just hold on. After a while, it holds on back.', bondUp(2, 'picked'), item('silk-scarf'), flag('festival-done'), flag('festival-second'))),
  ]),
];

/** Battles inside a chain pseudo-stage's rooms are pseudo-stage fights. */
function pseudoAll(o: unknown): void {
  if (Array.isArray(o)) { for (const x of o) pseudoAll(x); return; }
  if (!o || typeof o !== 'object') return;
  const r = o as Json;
  if ((r.kind === 'trainer' || r.kind === 'wild') && ('win' in r || 'friendly' in r)) r.pseudo = true;
  for (const val of Object.values(r)) pseudoAll(val);
}
for (const e of CIRCUIT) if (['story-tour-opening', 'story-tour-semi', 'story-tour-final'].includes(e.id as string)) pseudoAll(e);

export const EVENTS: Json[] = withRooms([...CIRCUIT, ...CONTESTS]);
