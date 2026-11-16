// Catalog Overhaul Pack, rival questlines R16 to R18 (QUESTLINES_RIVALS.md + RIVALS_PLACED.md).
// R16 I Have to Get Stronger (Kieran), R18 The Last Battle of the Year (31 December, real date).
// R17 The Pen Pal is SF6 in STORY_FAMILIES_1.md (another thread builds it); nothing of it lives here.
// Build: npm run co:build -- rivals-6
import { ch, fight, item, out, type Json } from '../dsl.ts';
import { beat, done, due, met, page, part, quest, R, rival, rq, RS, script, who, yes } from './_rivals.ts';

export const CATEGORY = 'rivals';

// ======================================================================================================
// R16. I HAVE TO GET STRONGER (Kieran, Bitter Challenger). Meeting 1 A4+ (Step 7, must-see, A+1); Meeting 2 S+1 (no battle);
// Meeting 3 S+2 (Step 13, optional, A+1); the finale S+3 (Step 17, A+2). Each helping choice adds one to kieran-helped.
// The finale's "stall" is the Wants to Stop meter (the `calm` battle rule): each turn his Pokémon takes no damage, it fills.
// ======================================================================================================
const K = 'Kieran';
const SPRITE = 'trainer.kieran';
const KIERAN = (lv: number, lineup: string[], o: { rule?: Json; win?: Json[]; lose?: Json[] } = {}): Json => ({
  kind: 'trainer', name: K, friendly: true, quest: { soft: true }, size: lineup.length, types: [], levelBonus: lv, classId: 'ace-trainer', sprite: SPRITE, lineup,
  ...(o.rule ? { rule: o.rule } : {}), win: o.win ?? [], lose: o.lose ?? [],
});
const helped = (): Json => ({ kind: 'flag', key: 'kieran-helped', amount: 1 });
const CAST = { cast: [SPRITE], tint: '#1d2430' };
const ENDINGS = { win: [quest({ openFirst: ['rq-r16-sat', 'rq-r16-swears'] })], lose: [quest({ openFirst: ['rq-r16-wander'] })] };
const FINAL_TEAM = ['dipplin', 'duraludon', 'poltchageist', 'bisharp'];

const kieran: Json[] = [
  // Meeting 1: angry.
  beat('rq-kieran-1', 'I Have to Get Stronger', { minStage: 4, requires: [due('R16.open')], ...CAST, effect: 'shake' },
    script(
      page('A boy is standing in the middle of the path, as if he has been waiting there all morning. He probably has.', 'His team is lined up behind him. They are strong. They are much too strong for this route, and they look tired in a way Pokémon should not.'),
      page(who(K, 'You. I\'ve heard about you.'), who(K, 'I\'ll get stronger than you. I have to.')),
      page(who(K, 'Someone beat me who didn\'t even care. Didn\'t even look at me.'), who(K, 'I\'m never losing like that again. Battle me. Properly.')),
    ),
    [
      ch('"Battle properly."', fight(script(page('You do not hold back. He notices. For a second, something in his face eases.', who(K, 'Good. Don\'t you dare go easy.'))), KIERAN(1, ['applin', 'pawniard', 'poltchageist']), helped(), done('R16.open'))),
      ch('"Fine. Let\'s get it over with."', fight(script(page(who(K, 'Get it over with?'), 'His jaw tightens. He sends out his first Pokémon before you have finished talking.')), KIERAN(1, ['applin', 'pawniard', 'poltchageist']), done('R16.open'))),
    ]),

  // Meeting 2: obsessed. A Pokémon Center, no battle.
  beat('rq-kieran-2', 'I Have to Get Stronger: The Screen', { minStage: 5, stop: 'heal', requires: [due('R16.watch')], ...CAST, effect: 'none' },
    script(
      page('A Pokémon Center. Kieran is at the big screen in the corner, watching a battle.', 'It is yours. It is all of yours. He has the whole region queued up, one after another.'),
      page(who(K, 'I\'ve watched every battle you\'ve had this region.'), who(K, 'You do a thing with your hand before you switch. I\'m going to work out what it means.')),
    ),
    [
      ch('"What do you actually like about battling?"', out(script(
        page('He opens his mouth. Nothing is there.', 'He closes it again. He looks at the screen, at you, at his own reflection in the glass.'),
        page(who(K, '...That\'s not a real question.'), 'He is still thinking about it when you leave. You can see him through the window, not watching the screen any more.'),
      ), helped(), done('R16.watch'))),
      ch('"It means I\'m about to switch."', out(script(page(who(K, 'Obviously. But WHY that one. Why then.'), 'He turns back to the screen and rewinds it. Again. Again.')), done('R16.watch'))),
    ]),

  // Meeting 3: exhausted. His Pokémon are afraid of him. Optional.
  beat('rq-kieran-3', 'I Have to Get Stronger: Again', { minStage: 6, requires: [due('R16.again')], ...CAST, effect: 'flicker' },
    script(
      page('His team is out on the grass. None of them are looking at him.', 'He lifts his arm to point at something. One of them flinches.'),
      page('He sees it flinch.', who(K, 'Again. Again!'), 'Quieter, to nobody: ' + who(K, '...Why did it do that?')),
    ),
    [
      ch('"Let them rest first."', out(script(
        page('He stares at you as if you have said something in another language.', 'Then, slowly, he sits down on the grass.'),
        page('His Pokémon do not come over. They stay where they are, watching him.', 'He notices that, too. He does not say anything for a long time.'),
      ), helped(), done('R16.again'))),
      ch('"Battle me, then."', fight(script(page(who(K, 'Finally. Someone who gets it.'), 'His Pokémon go out to fight. Every one of them looks back at him first.')), KIERAN(1, ['dipplin', 'pawniard', 'poltchageist', 'duraludon']), done('R16.again'))),
      ch('Walk on.', out('You leave him there, pointing. You hear "Again!" for a long way down the path.', done('R16.again'))),
    ]),

  // The finale.
  beat('rq-kieran-finale', 'I Have to Get Stronger: Don\'t You Dare', { minStage: 7, requires: [due('R16.finale')], ...CAST, effect: 'shake', priority: 70 },
    script(
      page('Kieran is waiting at the end of the stage. He has not slept. You can tell.', 'His ace is out already. It is swaying on its feet. It is ready to collapse, and it is still standing because he told it to.'),
      page(who(K, 'Last time. For real this time.'), who(K, 'Don\'t you dare go easy.')),
    ),
    [
      ch('"Win fast."', fight(script(page('You end it quickly. It is kinder than dragging it out.', 'It does not feel kind.')), KIERAN(2, FINAL_TEAM, { win: [quest({ openFirst: ['rq-r16-swears'] })], lose: ENDINGS.lose }))),
      ch('"Stall until his Pokémon want to stop."', fight(script(
        page('You do not attack. You defend, and wait, and watch his ace.', 'It is not watching you. It is watching him.'),
      ), KIERAN(2, FINAL_TEAM, { rule: { calm: 3 }, ...ENDINGS })), { requires: [yes('kieran-helped', 3)] }),
    ]),
  // Outcomes.
  part('rq-r16-sat', 'I Have to Get Stronger: Talked Down', { ...CAST, effect: 'sparkle', requires: [yes('rq-r16-calm')] },
    script(
      page('It sits. He shouts at it. It looks at him.', 'It does not get up.'),
      page(who(K, '...What am I doing?'), 'He laughs. It is not a good laugh, and then it is.'),
      page('He sits down next to it, in the dirt, and puts his forehead against its side.', who(K, 'Sorry. Sorry. I\'m sorry.'), 'One by one, the rest of his team comes over and sits with him.'),
    ),
    [ch('Sit with them for a while.', out(script(
      page('Nobody says anything. Nobody needs to.', 'When you finally stand up, each of his Pokémon brings you something: a thank-you, in the only way they have.'),
      page(who(K, 'They like you better than me.'), who(K, '...That\'s fair. I\'ll fix it.')),
    ), item('syrupy-apple'), item('metal-alloy'), item('unremarkable-teacup'), item('razor-claw'), done('R16.finale')))]),
  part('rq-r16-swears', 'I Have to Get Stronger: Again, Next Time', { ...CAST, effect: 'shake' },
    script(page('His last Pokémon goes down. He does not look at it. He looks at you.', who(K, 'Next region. I\'ll be stronger. I swear it.'), 'He walks away without recalling it. It gets up on its own and limps after him.')),
    [ch('Let him go.', out('You watch until they are both out of sight.', quest({ set: { key: 'kieran-swore', value: 1 } }), done('R16.finale')))]),
  part('rq-r16-wander', 'I Have to Get Stronger: Nothing', { ...CAST, effect: 'fog' },
    script(page('He wins. He stands there and waits for it to feel like something.', 'It does not. You can see it not feeling like anything.'), page(who(K, '...Huh.'), 'He wanders off without a word, not to anywhere in particular.')),
    [ch('Watch him go.', out('He does not look back. His Pokémon do.', quest({ set: { key: 'kieran-lost-to', value: 1 } }), done('R16.finale')))]),

  // Next region (same run): worse, or better.
  beat('rq-r16-again', 'I Have to Get Stronger: Worse', { minStage: 8, requires: [yes('kieran-swore'), due('R16.next')], ...CAST, effect: 'shake' },
    script(page('Kieran again. His team is bigger now. Stronger. More tired than before.', who(K, 'I told you. I swore it.'), 'He does not say hello.')),
    [ch('Battle him.', fight('His Pokémon go out without looking back at him this time. That is worse.', KIERAN(3, ['hydrapple', 'archaludon', 'sinistcha', 'kingambit', 'dragapult']), done('R16.next')))]),
  beat('rq-r16-better', 'I Have to Get Stronger: Better', { minStage: 8, requires: [yes('kieran-lost-to'), due('R16.better')], ...CAST, effect: 'glint' },
    script(page('Kieran is sitting on a fence with his team asleep around him in the sun.', 'He raises a hand. He does not get up. He does not have to.'), page(who(K, 'I\'ve been doing it differently.'), who(K, 'Slower. They seem to like it.'))),
    [ch('"They look happy."', out(script(page(who(K, 'Yeah.'), 'He looks down at them, surprised all over again.', who(K, 'Yeah, they do.'))), done('R16.better')))]),
];

// ======================================================================================================
// R18. THE LAST BATTLE OF THE YEAR (31 December, the real date the host passes in). The first rest node reached that day.
// Go: six on six, no counter-picks, timed to midnight (the `clock` rule): whoever is ahead when it runs out wins the year.
// ======================================================================================================
const YEAR_CAST = { tint: '#14182a', effect: 'sparkle' as const };
const FIRST_FIGHT = { kind: 'tempEffect', label: 'Your lead starts the next battle a step faster (+1 Speed).', effects: [{ kind: 'statMultiplier', stat: 'spe', value: 1.5 }], battles: 1, until: 'battle' };

const year: Json[] = [
  beat('rq-r18-year', 'The Last Battle of the Year', { minStage: 2, stop: 'heal', requires: [met(1), rq({ date: '12-31' })], ...YEAR_CAST, priority: 90 },
    script(
      page('{rival} is on the hill above the rest stop, with a flask and two cups.', 'Down in the town, people are setting out fireworks along the river. Nobody has lit one yet.'),
      page(R('One last battle of the year.'), R('Ends at midnight, whatever the score.')),
      page(RS('event', { protector: '...I\'m glad it\'s you.' })),
    ),
    [
      ch('"Go."', fight(script(page('Six on six. No counter-picks: you both send out what you would have sent anyway.', 'Somewhere below, a clock tower starts its long count to midnight.')),
        rival({ lv: 0, size: 6, quest: { counter: 'none' }, rule: { clock: 8 }, win: [FIRST_FIGHT], lose: [FIRST_FIGHT] }))),
      ch('"Let\'s just watch the fireworks."', out(script(
        page('{rival} looks at you for a moment. Then they pour the second cup and hand it over.', 'It is still warm.'),
        page('The first firework goes up over the river. Then all of them.', R('...Happy new year, {called}.')),
      ), FIRST_FIGHT)),
      ch('"Make it a draw."', out(script(
        page('You both send out one Pokémon each, and neither of you gives an order.', 'They stand on the hill, side by side, and look up.'),
        page('The fireworks go up over a tie.', R('Best result all year, honestly.')),
      ), FIRST_FIGHT)),
    ]),
];

export const EVENTS: Json[] = [...kieran, ...year];
export const REMOVE: string[] = ['rq-echo-kieran-fast', 'rq-echo-kieran-talked-down'];
