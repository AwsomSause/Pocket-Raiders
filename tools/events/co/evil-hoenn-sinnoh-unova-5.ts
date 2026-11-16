// Catalog Overhaul Pack, row 9: Unova, Team Plasma from inside, the end (TEAM_PLASMA_UNOVA_FULL_2). The Coronation (the
// Final Choice), the four endings as chain pseudo-stages (ps_px_asking, ps_px_turn, ps_px_ghetsis, ps_px_own: written by
// _evil-hsu-maps.ts), Team Open Hand (the third option: founding, three Inspections and All Night) and Part G's "who ends up
// where", said as each ending closes, with Volume III D's squad fates. "Take it all" ends the team story here: Evil Mode is
// on hold (Kice), so its first hour's four decisions are flags only.
import { ch, ev, fight, flag, flagIs, out, room, trainer, bondUp, type Json } from '../dsl.ts';
import { evil as story, prompt, rivalTrust } from './_evil-story-kit.ts';
import { BOSS, GRUNT, KNIGHT, N, OLD, SAGE, px, say, mark, night, once } from './evil-hoenn-sinnoh-unova-4.ts';

export const CATEGORY = 'evil-hoenn-sinnoh-unova';

const ALDITH = 'boss.cast-aldith';
const DRAYDEN = 'boss.drayden';
const HUGH = 'boss.hugh';
const CONCORDIA = 'boss.cast-concordia';
const BALCONY = '#2a2a48';
const GHETSIS_TEAM = ['hydreigon', 'cofagrigus', 'seismitoad', 'eelektross', 'bouffalant'];
/** A fight inside an ending's own map: a loss walks the player back out, and the run goes on. */
const ps = (b: Json): Json => ({ ...b, pseudo: true });
const step = (id: string, name: string, intro: string, choices: Json[], o: { cast?: string[]; pokemon?: string; tint?: string; effect?: string } = {}): Json =>
  ev(id, name, 'Evil Teams', { room: true, cast: o.cast ?? [BOSS], tint: o.tint ?? BALCONY, effect: o.effect ?? 'snow', ...(o.pokemon ? { pokemon: o.pokemon } : {}) }, intro, choices);
const on = (text: string, next: string, ...fx: Json[]): Json => out(text, ...fx, room(next));

// Part G, who ends up where, and Volume III D's squad fates, said as each ending closes.
const EPILOGUE: Record<'n' | 'turn' | 'ghetsis' | 'own' | 'openhand', string> = {
  n: `N asks the hold; it takes a week. Ghetsis finished his sentence in front of ten thousand. The Likeness is with N; one's always a few steps behind. Yara kept her eyes open, and opens the gate: it walks through, it walks back, and it got back in the shirt. Emil shuts his Center, and opens it again a week later: wild ones get hurt too. Sister Ianthe reads the right-hand column to N, aloud, all of it. Gorm writes a new speech. It's four words: "I was wrong. Ask." Bronius pulled the red one, when told. Zinzolin is in cold storage, exactly cold enough. Rood's in Driftveil. The Triad took him somewhere quiet. Colress publishes. Hugh: somebody's Purrloin stops. The boy from the square: "You understood fine." The thirty-one fields: gates open.`,
  turn: `N walks out between the two halves. Ghetsis is beaten at the Chasm. The Likeness is with N. Yara keeps it. Nobody says a word. Emil's a nurse. The Lillipup's home. Sister Ianthe burns the apron and keeps the book. Gorm sat on the steps. Bronius counts the ones that come back. Zinzolin gave the keys: one warm thing. Rood has the chair; leave the dust. The Triad pulled a wedge, if named. Colress publishes. Hugh: the same. The boy from the square: the same, on the ice. The thirty-one fields: gates off their hinges.`,
  ghetsis: `N's a pretender, flying. Ghetsis is king, in all but the crown. The Likeness is on the balcony; it's forgetting which it is. Yara hides a dog under a floor. Emil's in a cell, for striking a Sage. He isn't sorry. Sister Ianthe burns nothing; she posts the daybook to Driftveil, and the House reads it aloud at supper. Gorm's still quoting. Bronius counts. Zinzolin's at Ghetsis's right hand, cold. Rood's in hiding, with the endowment's deeds. The Triad: "You." Colress is promoted; he hasn't read the letter. Hugh's still looking. Angrier. The boy from the square: his was in the hold. The thirty-one fields: fenced, and guarded.`,
  own: `N's gone to meet the next four hundred. He writes; it smells of smoke. Ghetsis was beaten on his own balcony. The Likeness is home. Yara's on the council: the line she won't cross is on her card in capitals. Emil runs your Infirmary. The Lillipup has the run of the castle. Sister Ianthe has a chair. Gorm isn't seated. Bronius counts, aloud. Zinzolin's offered a chair by the fire, and sits near it. Rood has a chair. The Triad stood, and didn't act. Colress tests you. Hugh gets a manifest, by post, unsigned. The boy from the square: his is the first name read. The thirty-one fields: your second decision.`,
  openhand: `N has a second column. Ghetsis wasn't looked at for six hours. The Likeness told N something first; he won't say what. Yara: "We're the ones who knocked." Emil said "Yes," from the square. The Lillipup goes first into every house. Sister Ianthe teaches looking. Gorm asks to carry cards. Bronius pulled it without being told. Zinzolin: a visit's made. Finding: "Wasn't. Is learning." Rood dries up. The Triad went to ask for names; N gave three. He'd had them ready. Colress: "The control group." Hugh knocks. The boy from the square explains it to other children. The thirty-one fields are walked, every Sunday.`,
};

// ---------- The Final Choice: the Coronation (Unova stage 8, the balcony) ----------
const WARNING = `This is the darkest ending in the script. Unova will be sealed. People who trusted you will see you do it.`;
const finalChoice = ev('px-final-choice', 'The Coronation', 'Evil Teams', { room: true, cast: [BOSS, N], tint: BALCONY, effect: 'snow' },
  `The balcony of a castle that's finished coming out of the ground. Ten thousand candles below. The Frigate overhead, with frost on its keel. Snow, in summer. At the rail, a figure in a green cap, with a crown held over it, and Ghetsis's hand on its back. Below, six hundred of the Vigil, kneeling. Yara. Emil. ${say('Ghetsis, to the crowd', `Your king has returned! He's seen the world of men and judged it! Kneel, and be free!`)} The figure raises a hand. The wave's slightly wrong. A shadow over the candles. A dragon lands on the parapet, and stone cracks, and the real one steps down. ${say('N', `Father. Let him go. He's said it eleven times while you were talking.`)} Ten thousand people look from one green cap to the other. ${say('Ghetsis, and the smile doesn\'t move', `Two kings. How fortunate. The Seventh'll tell you which is true. The Seventh's sat in council. Speak, Sage.`)} He's handed it to you. He's sure of you. It's the only mistake he makes, and he's made it because the chair was warm.`,
  [
    ch('(Stand beside N.) "This one. Let him ask his question."', on(`${say('N, to the figure at the rail, in a voice that isn\'t speech', `...`)} The figure's face runs like wet paint. A Zoroark, in a green cap, shaking. It crosses the balcony and puts its head under his hand.`, 'px-asking-kings', flag('plasma-final-n'))),
    ch('(Hold up the ledger. Wind the box.) "Neither. Look what\'s under the stair."', on(`You wind the music box. The tune carries. Thin. A child's. The figure at the rail turns toward it, and its face runs, and there's a Zoroark in a green cap, listening, with its eyes shut. The crowd's silent.`, 'px-turn-box', flag('plasma-final-turn')), { requires: [flagIs('plasma-ledger')] }),
    ch(`(Bow to the figure at the rail.) "That one's the king."`, on(WARNING, 'px-ghetsis-warn', flag('plasma-final-ghetsis'))),
    ch(`(Step in front of the throne.) "Neither of them wants it. I'll have it."`, on(`You walk to the throne. You don't sit. You stand in front of it.`, 'px-own-throne', flag('plasma-final-own')), { requires: [{ kind: 'evil', team: 'plasma', rank: 5 }] }),
  ]);
// What the run is carrying changes what can be done (FULL_2 A).
(finalChoice as Json).remembers = [
  { id: 'daybook', when: [flagIs('plasma-daybook')], notice: `The daybook's in your coat. The right-hand column can be read out.` },
  { id: 'lillipup', when: [flagIs('plasma-lillipup')], notice: `Yara's in the crowd, with something under her tunic.` },
  { id: 'where', when: [flagIs('plasma-asked-where')], notice: `You've already asked it once, in a square. Somebody in the crowd remembers.` },
];

// ---------- Ending 1. "The Asking" (Carry it out; ps_px_asking) ----------
const asking: Json[] = [
  step('px-asking-kings', 'Phase 1: Two Kings', `${say('N', `He's my friend. He was made to be me. He's very tired. I'm sorry, everyone; that's what you've been kneeling to. It's not his fault.`)} Silence. Six hundred people, on their knees, working out whether to get up. ${say('Ghetsis, easily', `A touching reunion. By all means, boy. Ask them. Ask them all. I've waited two years to hear you say it again.`)} He wants N to ask. Every Pokémon let go tonight walks into the Frigate's signal. N knows. He looks up at the keel. ${say('N, to you', `I can't ask while that's listening. Whatever they let go, it takes. Can you make it deaf? I'll talk till you do. I'm good at talking. He made sure.`)}`, [
    ch('(Go up. A rope from the keel.)', on(`You climb. Below, N's started talking about trains.`, 'px-asking-aldith')),
    ch('(Go up on the dragon.)', on(`N can spare it. It doesn't like you. It takes you anyway.`, 'px-asking-aldith')),
  ], { cast: [N, BOSS], pokemon: 'zoroark' }),
  step('px-asking-aldith', 'Phase 2: The Cargo Deck', `The cargo deck. Commander Aldith, and on her shoulder, a Liepard with a notch in its left ear. ${say('Commander Aldith', `You're the candle. I'd a feeling. Back down the rope.`)}`, [
    ch('Battle.', fight(`${say('Aldith', `Somebody's Purrloin. Go.`)}`, ps(trainer('Commander Aldith', { sprite: ALDITH, team: ['liepard', 'scolipede', 'scrafty'], size: 3, lv: 1, win: [room('px-asking-bronius')] })))),
  ], { cast: [ALDITH], pokemon: 'liepard', effect: 'none' }),
  step('px-asking-bronius', 'Phase 2: The Relay', `The Relay room. ${say('Sage Bronius, at the breaker, dry', `I count. It's all I do. Four thousand and eleven in the hold. Three hundred on wages. One Relay. I've counted the tins that pay for it; I know whose tins. I've been waiting for somebody to come up here and make me stop counting.`)}`, [
    ch('Battle.', fight(`Excadrill first. It's been ice-breaking all summer.`, ps(trainer('Sage Bronius', { sprite: SAGE, team: ['excadrill', 'vanilluxe', 'magnezone'], size: 3, lv: 2, win: [room('px-asking-breaker')] })))),
  ], { cast: [SAGE], effect: 'none' }),
  step('px-asking-breaker', 'The Breaker', `${say('Bronius, beaten', `The breaker's the red one. I'd pull it myself, but I've never once done anything I wasn't told.`)}`, [
    ch('"Pull it."', on(`${say('Bronius', `...Thank you.`)} The Relay's dark.`, 'px-asking-question', flag('relay-dark'))),
  ], { cast: [SAGE], effect: 'none' }),
  step('px-asking-question', 'Phase 3: The Question', `On the balcony, N's been talking for a quarter of an hour, about trains. ${say('N', `—and that's why it only goes round one way. Oh. It's off? It's off.`)} To ten thousand people: ${say('N', `I'm going to ask you something. It isn't my father's question. His has one answer; he built it to. Mine's got as many as there are of you.`)} ${say('N', `I'm not asking you to let go. I'm asking you to ask. Tonight. Put it down in front of you. Open your hand; the old way, flat and low. And then don't walk away. That was the trick. You were told not to look back, so you'd never see it follow you. Look. If it comes, it's chosen. If it goes, let it. I'll take no for an answer. I'll take yes for one. I'm told I have to listen to that, too.`)} In the square below: ten thousand hands. A field of small lights, each going one way or the other. Most come straight to the hand. A great many look at the hand, look at the trees, and come to the hand. About one in nine go: into the dark, at their own pace. Nobody stops them. Nobody collects them. The Lillipup, mostly, sit down exactly where they were, and wait to see what this is about. Yara, in the crowd, takes a dog out of her shirt and sets it down and opens her hand and keeps her eyes open. It looks at the hand. It looks at her. It gets back in the shirt. ${say('Yara', `...Oh.`)} It's all she says. She says it for some time.`, [
    ch('(Open your own hand.)', on(`Your lead looks at it. It comes.`, 'px-asking-ghetsis', flag('unova-asked'))),
  ], { cast: [N, KNIGHT], pokemon: 'lillipup', effect: 'none' }),
  step('px-asking-ghetsis', 'Phase 4: Ghetsis', `${say('Ghetsis', `One in nine. One in nine. I had all of them. I'd a region with its hands open and a ship to catch what fell—`)} ${say('N', `I know. I heard the ship.`)} ${say('Ghetsis', `You were built to hear them! I built you! And you used it to listen!`)}`, [
    ch('Battle, with N beside you.', fight(`At half Hydreigon's health, the Second Half: he stops performing. ${say('Ghetsis', `Free. Yes. Free of you. One will, one hand, one winter.`)} Ten thousand people hear him finish the sentence.`, ps(trainer('Ghetsis', { sprite: BOSS, team: GHETSIS_TEAM, size: 5, lv: 2, format: 'doubles', ally: 'zoroark', win: [room('px-asking-after')] })))),
  ]),
  step('px-asking-after', 'A Unova That Was Asked', `He's beaten. The cane's a cane; he never gets to the Chasm. Fewer trainers, by about a ninth. The ones that stayed, stayed looking. The Ones Who Went are in the wild now: they don't flee, they don't fight first, and they won't join, but they'll walk beside a party for a node, if a hand's held out. Every Pokémon with you was asked, and came. Half the Centers are shut for a week; then they open again, Emil's first. Four thousand and eleven on the snow. N asks each one. It takes him a week. ${EPILOGUE.n}`, [
    ch('(Walk down into the square.)', out(`Somebody's Lillipup sits on your foot.`, bondUp(1, 'party'), story({ end: 'allied' }), flag('plasma-ending-n'), flag('unova-asked'), flag('plasma-ones-who-went'))),
  ], { cast: [N], effect: 'none' }),
];

// ---------- Ending 2. "Where Do They Go" (Turn on the team; ps_px_turn) ----------
const LEDGER_UP = `You hold up the ledger. "Sixty Pokémon, freed at your fields. Collected on the Monday. Here's where each one went." They read the last column. One word. Sixty times. ${say('A voice, from the back', `...Where do they go?`)} Another. "Where do they go?" It's six hundred, then. Not shouting. Asking. The Knights have turned round, on their knees, and they're looking at the Sages.`;
const turn: Json[] = [
  step('px-turn-box', 'Phase 1: The Box and the Book', LEDGER_UP, [
    ch(`(Read the daybook out.) "'Not admitted. A Herdier. Content.' Two thousand, one hundred and nineteen."`, on(`${say('Sage Gorm, on the dais, who wrote the first speech', `...Five in six. He told me the boy'd seen it. He told me we'd a witness.`)} He sits down on the steps. He takes off the hood.`, 'px-turn-vigil', flag('gorm-sat')), { requires: [flagIs('plasma-daybook')] }),
    ch('(Let them ask.)', on(`You don't say anything else. You don't need to.`, 'px-turn-vigil')),
  ], { cast: [SAGE, KNIGHT], pokemon: 'zoroark' }),
  step('px-turn-vigil', 'Phase 2: The Vigil Stands Up', `Plasma breaks in two on the spot. Gorm sits on the steps. Rood was never on the dais: he's in the crowd, in a plain coat. He's been waiting two years for this, in Driftveil, washing up. Ryoku: "The desert keeps everything. I'll keep this." He takes the crown from over the Zoroark's head and puts it in his sleeve. And Giallo comes down the steps.`, [
    ch('Battle Sage Giallo.', fight(`He guards. It's all he's ever done.`, ps(trainer('Sage Giallo', { sprite: SAGE, team: ['conkeldurr', 'garbodor', 'bisharp'], size: 3, lv: 1, win: [room('px-turn-chasm')] }))), { requires: [flagIs('plasma-dreamyard-opened', 0, 0)] }),
    ch('(Giallo stands aside.)', on(`He's already been beaten once, in the Dreamyard. He stands aside.`, 'px-turn-chasm'), { requires: [flagIs('plasma-dreamyard-opened')] }),
  ], { cast: [SAGE, SAGE] }),
  step('px-turn-chasm', 'Phase 3: The Chasm, With Six Hundred Behind', `${say('Ghetsis, and the smile doesn\'t move', `A setback of staging. The weather is unaffected.`)} He lifts the cane. It isn't a cane. The Frigate turns north. The Giant Chasm, and this time all five bridges are down: the Vigil lowered them, by hand. Every old-uniform Grunt you meet holds out an open hand, and steps aside. Emil and Yara take a Frost Relay each. ${say('Emil', `I'm a nurse. I'm told this is a breaker. I'm going to treat it as a patient that needs to stop.`)} Then Ghetsis. The Speechwriter's first move fails: nobody's listening to speeches.`, [
    ch('Battle Ghetsis.', fight(`N holds a wedge loose.`, ps(trainer('Ghetsis', { sprite: BOSS, team: GHETSIS_TEAM, size: 5, lv: 2, win: [room('px-turn-where')] })))),
  ], { cast: [BOSS], effect: 'snow' }),
  step('px-turn-where', 'Phase 4: Where They Go', `Four thousand and eleven on the ice. You hold the list: sixty rows from the Dreamyard, and the Frigate's manifest gives the rest. Where do they go?`, [
    ch('Send out the lists.', on(`Every town gets its page. Every door that's still there is knocked on.`, 'px-turn-after', flag('plasma-where-lists'))),
    ch('Let them choose.', on(`The ice is wide. Most go somewhere. Some sit down.`, 'px-turn-after', flag('plasma-where-choose'))),
    ch('Ask N.', on(`${say('N', `Ask them. Not me. I'll help you hear.`)}`, 'px-turn-after', flag('plasma-where-n'))),
    ch('Walk the fences.', on(`The Vigil goes home by way of all thirty-one fields. At each: a gate's taken off its hinges. Every Release Field in Unova becomes a Gate: a rest where a released Pokémon may be waiting for your party to carry word home.`, 'px-turn-after', flag('fences-down'), flag('plasma-gates'))),
  ], { cast: [N], effect: 'snow' }),
  step('px-turn-after', 'Afterwards', `N walks out between the two halves. He takes the dragon and the Zoroark, and nothing else. The Society of the Open Gate has its name back. Rood's in the chair. It's got dust on it; he says leave the dust. ${EPILOGUE.turn}`, [
    ch('(Go home.)', out(`The hill's full of people walking down it.`, story({ end: 'defeated' }), flag('plasma-ending-turn'), flag('vigil-stood'))),
  ], { cast: [SAGE], effect: 'none' }),
];
(turn[1] as Json).remembers = [{ id: 'zinzolin', when: [flagIs('zinzolin-heard')], notice: say('Zinzolin', `There are four more. Yards. I'll give you the keys. I'm cold; I'd like to have done one warm thing.`) }];
(turn[2] as Json).remembers = [
  { id: 'colress', when: [flagIs('colress-published')], notice: `Colress has published. He has no machine to switch on.` },
  { id: 'triad', when: [flagIs('triad-names-true')], notice: `The Shadow Triad pull the second wedge themselves.` },
];

// ---------- Ending 3. "The Second Half" (Side with Ghetsis; ps_px_ghetsis). Warned, and confirmed twice ----------
const ghetsis: Json[] = [
  step('px-ghetsis-warn', 'Are You Sure?', WARNING, [
    ch('Bow.', on(`Your head's going down.`, 'px-ghetsis-warn-2')),
    // The hand can open: stepping back now plays "Where Do They Go," entered late and cold (as Lets go, below).
    ch('(Don\'t.)', on(`You straighten. Too late for the Vigil: they've seen the start of the bow.`, 'px-ghetsis-late')),
  ], { effect: 'none' }),
  step('px-ghetsis-warn-2', 'Are You Sure?', `${WARNING} Once more.`, [
    ch('Bow.', on(`You bow. To the figure at the rail.`, 'px-ghetsis-bow')),
    ch('(Don\'t.)', on(`You straighten. Too late for the Vigil: they've seen the start of the bow.`, 'px-ghetsis-late')),
  ], { effect: 'none' }),
  step('px-ghetsis-bow', 'Phase 1: The Bow', `"That one's the king." Six hundred people breathe out. It's what they dug a castle for. ${say('N', `...You've read the daybook. You stood in my room.`)} ${say('Ghetsis, softly', `The Seventh's spoken. Remove the pretender.`)} The Crew come up the stair, in black. N doesn't fight them. He looks at the Zoroark, which is looking at him, and can't move for the hand on its back. ${say('N', `I'll come back for you. I've said it in the voice he can't hear. You heard, though. Didn't you? You've been hearing all night.`)} The dragon takes him off the parapet. He isn't caught. He isn't meant to be. In the crowd: ${say('Emil', `You knew.`)} He's coming up the steps. He's a nurse. He's only ever been angry at things. He hits Sage Giallo, who's nearest, once, and is astonished at himself, and is taken away. Yara doesn't move. She's got both arms round something under her tunic.`, [
    ch('(Stand beside the throne.)', on(`${say('Ghetsis, to ten thousand', `Your king asks one thing. Open your hands.`)} They do. All of them. The Relay's listening. A field of small lights, and every one goes up.`, 'px-ghetsis-wedge', flag('plasma-crown'))),
  ], { cast: [BOSS, N] }),
  step('px-ghetsis-wedge', 'Phase 3: The Wedge', `The Giant Chasm. You're the Seventh Sage, and the third wedge is in your hand. ${say('Ghetsis', `The seventh seat. I dusted it myself. Hold the Seal. That's all a Sage is for.`)} The bridge is held; the Relays are lit. The defenders come: Drayden, Hugh, your rival, a Gym Leader. ${say('Drayden', `I kept those wedges forty years. I'd have broken them if I'd known whose hand they'd end in.`)} ${say('Hugh', `Five years. Five years. And there's people like you who knew where they went.`)}`, [
    ch('Battle Drayden.', fight(`He doesn't waste words after that.`, ps(trainer('Drayden', { sprite: DRAYDEN, team: ['haxorus', 'druddigon', 'flygon', 'altaria', 'salamence'], size: 5, lv: 2, win: [room('px-ghetsis-seal')] })), rivalTrust(-2))),
  ], { cast: [DRAYDEN, HUGH] }),
  step('px-ghetsis-seal', 'The Seal', `Absolute lifts its head. You're holding the last wedge in place. ${say('Ghetsis', `Now. Hold. And the bridges go up, and it's winter, and they're mine. Every one that was ever loved enough to be let go.`)} It's the same as Sinnoh's lines: the hand can open.`, [
    ch('Hold.', on(`The Chasm closes over. The bridges are up. Snow.`, 'px-ghetsis-sealed')),
    ch('Let go.', on(`The Seal doesn't close. ${say('Ghetsis', `You? I dusted the chair!`)}`, 'px-ghetsis-late')),
  ], { effect: 'snow' }),
  step('px-ghetsis-sealed', 'The Sealed Unova', `${say('Ghetsis', `A weapon that finishes its job is worth keeping. You'll have Castelia. I'd promised it to a man with a badge. He'll be so disappointed.`)} You leave Unova by the one bridge the Seventh has a key to. A Crew Grunt salutes. It's the worst salute in the game. Your party saw. You carry the Seventh's Ring: it opens any Plasma door, in any region, for the rest of the run. Nobody's glad to see it. ${EPILOGUE.ghetsis}`, [
    ch('(Cross the bridge.)', out(`On the next region's ferry, a child on the rail says: "They don't let anyone out of Unova now. My gran's there."`, bondUp(-1, 'party'), story({ end: 'exposed' }), flag('plasma-ending-ghetsis'), flag('unova-sealed'), flag('seventh-ring'))),
  ], { cast: [GRUNT] }),
  // "Where Do They Go," entered late and cold: no Vigil behind, Emil in a cell, N not there to hold a wedge. It can still be won.
  step('px-ghetsis-late', 'Where Do They Go, Late', `No Vigil behind you. Emil's in a cell. N's not there to hold a wedge. Just you, and the Chasm, and a man with a cane that isn't a cane.`, [
    ch('Battle Ghetsis.', fight(`It can still be won.`, ps(trainer('Ghetsis', { sprite: BOSS, team: GHETSIS_TEAM, size: 5, lv: 2, win: [room('px-ghetsis-late-after')] })))),
  ], { effect: 'snow' }),
  step('px-ghetsis-late-after', 'Afterwards', `The bridges come down, one at a time, with nobody to lower them but you. ${EPILOGUE.turn}`, [
    ch('(Go home.)', out(`It's a long walk, alone.`, story({ end: 'defeated' }), flag('plasma-ending-turn'), flag('plasma-turn-late'))),
  ], { cast: [SAGE], effect: 'none' }),
];

// ---------- Ending 4. "The Other Four Hundred" (Take it all; ps_px_own) ----------
const decision = (id: string, next: string, intro: string, opts: [string, string, string][]): Json =>
  step(id, 'Phase 3: The First Hour', intro, opts.map(([label, text, f]) => ch(label, on(text, next, flag(f)))), { cast: [KNIGHT, GRUNT], effect: 'none' });
const own: Json[] = [
  step('px-own-throne', 'Phase 1: The Throne', `"Neither of them wants it." To N: "You don't want a throne. You want to go and meet the other four hundred. And the four hundred after that." ${say('N', `...I do. I do. Is that allowed?`)} "I'm allowing it." He laughs. Nobody on that balcony's heard it before; Sister Ianthe has, once, when he was four. ${say('N', `Then I'm going. I'll write. It'll smell of smoke.`)} To the Zoroark: "And you. Home." It doesn't need telling twice. To Ghetsis: "And you never wanted a king. You wanted a hold. That's mine now, too." ${say('Ghetsis', `You'd rule? I offered you a chair. I dusted it.`)} ${say('Ghetsis', `Then stand where I stand. And see how long ten thousand soft-hearted amateurs stay grateful.`)}`, [
    ch('Battle Ghetsis.', fight(`Nobody helps him. Not a Sage. Not the Crew, who're waiting to see who pays on Friday. At half Hydreigon's health, he says the second half, aloud, as in every ending. This time it's you who answers: "I heard. So did they."`, ps(trainer('Ghetsis', { sprite: BOSS, team: [...GHETSIS_TEAM.slice(0, 4), 'drapion', 'bouffalant'], size: 6, lv: 2, win: [room('px-own-d1')] })))),
  ], { cast: [BOSS, N] }),
  decision('px-own-d1', 'px-own-d2', `Ten thousand candles. Six hundred Knights. Three hundred Crew, with their hands in their pockets. Four decisions, each one line, said from the balcony. The first: the oath.`, [
    ['Keep it as he taught it.', `"I'll not hold what hasn't chosen me." Nobody looks up.`, 'plasma-oath-his'],
    ['Give it back its first meaning.', `"It's a promise you make about yourself." Loyalty can't be bought, and can't be lost by anything but a lie.`, 'plasma-oath-first'],
    ['Your own line.', `You say it. They say it back.`, 'plasma-oath-own'],
  ]),
  decision('px-own-d2', 'px-own-d3', `The second: the hold.`, [
    ['Read out the lists.', `It takes a month of ships.`, 'plasma-hold-read'],
    ['Open the doors.', `The hold empties onto the snow.`, 'plasma-hold-opened'],
    ['Keep them.', `An army on day one. Yara's line is crossed: she leaves, tonight.`, 'plasma-hold-kept'],
  ]),
  decision('px-own-d3', 'px-own-d4', `The third: the two uniforms.`, [
    ['One team, in white.', `The Crew take their coats off. Some of them leave.`, 'plasma-uniform-white'],
    ['One team, in black.', `The Vigil take their hoods off. Some of them leave.`, 'plasma-uniform-black'],
    ['Both, and each knows what the other\'s for.', `The Vigil asks, the Crew lifts, and no Knight's lied to about which is which.`, 'plasma-uniform-both'],
  ]),
  decision('px-own-d4', 'px-own-bronius', `The fourth: the seven chairs.`, [
    ['Seat the six Sages.', `They sit under you without being asked.`, 'plasma-chairs-six'],
    ['Empty the Hall.', `Seven chairs. All with dust.`, 'plasma-chairs-none'],
    ['Seat seven who\'ve never sat.', `Emil, Yara, Sister Ianthe, Rood, a Crew quartermaster, the boy from the square's mother, and one left empty, with dust on it, on purpose.`, 'plasma-chairs-new'],
  ]),
  step('px-own-bronius', 'Phase 3: The First Hour', `${say('Sage Bronius, with a ledger', `I count. What am I counting, under you?`)}`, [
    ch('"The same."', out(`He counts. ${EPILOGUE.own}`, story({ end: 'allied' }), flag('plasma-ending-own'), flag('evil-start-plasma'), flag('bronius-same'))),
    ch('"The tins: and you tell them where it goes."', out(`He looks up from the ledger for the first time in years. ${EPILOGUE.own}`, story({ end: 'allied' }), flag('plasma-ending-own'), flag('evil-start-plasma'), flag('bronius-tins'))),
    ch('"The ones that come back."', out(`${say('Bronius', `...That's a short column. I'll start it.`)} ${EPILOGUE.own}`, story({ end: 'allied' }), flag('plasma-ending-own'), flag('evil-start-plasma'), flag('bronius-back'))),
  ], { cast: [SAGE], effect: 'none' }),
];
(own[0] as Json).remembers = [{ id: 'triad', when: [flagIs('triad-names-true', 0, 0)], notice: `The Triad stand behind him and don't act. "We believe that he found us. We don't believe he'd find us again."` }];

// ---------- Team Open Hand: the third option (FULL_2 F) ----------
const OH = { cast: [KNIGHT, CONCORDIA, OLD], tint: '#4a3a28' };
const OHq = (o: Json = {}): Json[] => px({ has: 'third', ...o });
const LOOK = `Open Hand can't hear Pokémon. It reads them: where it sleeps; what it does when the trainer's hand comes up; the bowl; what it does when the door opens; whether it'll come to an open hand, flat and low, and then whether it goes back. It takes nobody's Pokémon.`;
const house = (id: string, next: string, intro: string, right: 'fine' | 'teach', fine: string, teach: string, know: string): Json =>
  step(id, 'Inspection 1: Number Nine', `${intro} ${LOOK}`, [
    ch('"It\'s fine."', on(fine, next, ...(right === 'fine' ? [flag(`${id}-right`)] : []))),
    ch('"It isn\'t, and you don\'t know how."', on(teach, next, ...(right === 'teach' ? [flag(`${id}-right`)] : []))),
    ch('"It isn\'t, and you know."', on(know, next)),
  ], { cast: [KNIGHT], tint: '#4a3a28', effect: 'none' });
const openHand: Json[] = [
  ev('openhand-founding', 'Team Open Hand', 'Evil Teams', { callback: true, requires: [...px({ after: 4, ends: ['none'], inside: false }), flagIs('plasma-offer-refused'), flagIs('plasma-seat-refused'), flagIs('plasma-asked-where')], ...OH, pokemon: 'lillipup' },
    `A kitchen in the House in Driftveil. Soup for forty. Two people in white with the hoods down, and a dog under the table. ${say('Emil Hawksmoor, drying a pan', `You're the one who asked where. In front of him. We heard. We walked out the week after; her with that under her shirt.`)} ${say('Yara Fairchild', `I took it back. I'm someone who took it back. I've decided I can be that.`)} ${say('Emil', `Here's what I've got. Nineteen years, I handed them back to people who shouldn't have had them. He's right about those people; that's what I can't get round. Then two years of his answer, which is: take them all, from everyone, and put them in a box. Neither's it.`)} ${say('Emil', `There's a job between those. Somebody goes and looks. House by house. And asks the one it's about.`)} ${say('Concordia', `N would've been good at it.`)} ${say('Emil', `N can hear them. We can't. So we'll have to look. I can teach looking. It's all an orderly's got.`)} The creed, on a tea towel, in marker: ASK THE ONE IT'S ABOUT.`,
    [
      ch('(Take a tea towel.)', out(`Team Open Hand: Emil, with nineteen years of telling from outside; Yara, who's stood at a fence and knows what it looks like from both sides; the Lillipup with the red collar, who goes first into every house; Anthea and Concordia and a kitchen ("We don't ask them to say it. We give them something to carry."); Hugh, whose "I'm about to unleash my rage" has become, lately, "I'm about to knock on a door"; the boy from the square, seven, who explains it to other children; Sister Ianthe, with the daybook; and a faithful Grunt from Liberty Garden, who stood aside from a door once and would like to do it on purpose.`, mark('third'), flag('openhand-founded'))),
      ch('"Who else?"', out(`${say('Emil', `Anyone who can look. Colress keeps writing to ask if he can observe.`)} ${say('Colress, in the letter', `The control group! May I observe? I'll not touch anything. I've stopped touching things.`)}`, mark('third'), flag('openhand-founded'), flag('openhand-colress'))),
    ]),
  ev('openhand-insp1', 'Inspection 1: Number Nine', 'Evil Teams', { requires: [...OHq({ after: 5 }), once('openhand-insp1')], cast: [KNIGHT], tint: '#4a3a28' },
    `A city. Three doors. Emil's brought his old bag. ${say('Emil', `Look first. Talk after. We take nobody's Pokémon.`)}`,
    [ch('(Knock on the first door.)', on(`A flat over a shop.`, 'openhand-house-1'))]),
  house('openhand-house-1', 'openhand-house-2', `A flat over a shop. A mess. A Trubbish on a heap of laundry. A harassed man. It sleeps on the laundry because it smells of him. The bowl's licked clean. It looks at him when the door opens.`, 'fine',
    `A tea towel's left. It says so. ${say('The man', `They came, the white ones. They said look at the state of it. I nearly—`)} He's got the carrier out, by the door, still. He puts it away.`,
    `${say('Emil', `...No. Look at it. Look where it's looking.`)} You leave a tea towel anyway.`,
    `The door stays open. It doesn't go anywhere. It goes back to the laundry.`),
  house('openhand-house-2', 'openhand-house-3', `A very clean house. A Minccino on a cushion. A ribbon. A woman who's proud. It doesn't move when her hand comes up. Not away. Not toward. The bowl's full, and untouched.`, 'teach',
    `A tea towel's left. Emil looks at it for a long time on the way out.`,
    `She brushes it nine times a day. It hates being brushed. Nobody's ever told her. Emil stays. ${say('Emil', `You're not cruel. You're loud. It's got ears like dinner plates.`)}`,
    `You sit in the kitchen, with the door open, and the hand out. It doesn't choose. It doesn't know it's allowed.`),
  step('openhand-house-3', 'Number Nine, Striaton', `A Pansage on a sill. A child's drawing. It's the house from the order. And a van at the end of the lane.`, [
    ch('"It\'s fine." (And stand in the gate.)', fight(`The Crew, again. They've a key.`, ps(trainer('Crew Grunts', { sprite: GRUNT, team: ['liepard', 'scrafty', 'watchog'], size: 3, lv: 1, format: 'doubles', win: [room('openhand-house-3-after')] })))),
  ], { cast: [GRUNT], pokemon: 'pansage', effect: 'none' }),
  step('openhand-house-3-after', 'Number Nine, Striaton', `The child, after, through the letterbox: "Are you the good ones or the other ones?" ${say('Yara', `...We're the ones who knocked.`)} A hundred tea towels are printed.`, [
    ch('(Go home.)', out(`Open Hand has its first three findings.`, flag('openhand-insp1'))),
  ], { cast: [KNIGHT], pokemon: 'pansage', effect: 'none' }),
  ev('openhand-insp2', 'Inspection 2: The Sunday Round', 'Evil Teams', { requires: [...OHq({ after: 6 }), flagIs('openhand-insp1'), once('openhand-insp2')], cast: [KNIGHT, HUGH], pokemon: 'lillipup', tint: '#4a4a30', effect: 'none' },
    `Thirty-one fences. Open Hand walks three. A field. A fence. Eleven Pokémon sitting along it, facing the road. Each with a red collar. ${say('Yara', `That's what I looked like to her. For six months. A person walking off.`)} ${say('Hugh, very quiet for him', `They're all facing the same way.`)} The collars have numbers. The Dreamyard Ledger, or a Crew manifest, has the towns.`,
    [
      ch('(Match each collar to a town with the ledger.)', out(`All eleven. Open Hand walks them home. Eleven doors. Nine open. Two people have moved away, and didn't leave word, because they were told it was free. The two come to the House. One's a Herdier. A woman's been washing dishes there for a year, every day, in case it turned up. She doesn't look round when the door opens. She's stopped looking round. It crosses the kitchen and sits on her foot.`, flag('openhand-insp2'), flag('emil-herdier')), { requires: [flagIs('plasma-ledger')], prompt: prompt('aim-drag'), fail: out(`Two collars don't match a town. Open Hand walks the other nine home, and carries the two to the House. One's a Herdier. A woman's been washing dishes there for a year, every day, in case it turned up. It crosses the kitchen and sits on her foot.`, flag('openhand-insp2'), flag('emil-herdier')) }),
      ch('(Win a Crew manifest at the gate.)', fight(`The Crew don't like being asked for paperwork.`, { ...trainer('Crew Grunts', { sprite: GRUNT, team: ['liepard', 'watchog', 'scolipede'], size: 3, lv: 1,
        win: [flag('openhand-insp2'), flag('emil-herdier'), flag('openhand-manifest')], lose: [] }), pseudo: true })),
    ]),
  ev('openhand-insp3', 'Inspection 3: A Thousand Answers', 'Evil Teams', { requires: [...OHq({ after: 6 }), flagIs('openhand-insp2'), once('openhand-insp3'), night], cast: [KNIGHT], tint: '#2a2418', effect: 'none' },
    `${say('Emil', `He's going to ask the whole region a question from that balcony. And they'll answer the way a crowd answers. I want him to have the other answer. The one you get in a kitchen.`)} Open Hand's visited a thousand houses. Each finding's on a card: "Sleeps on his chest. He's got a bad heart. It listens." "Was fine. Left a tea towel. She cried." "Wasn't. Stayed nine days. Is now." "Wasn't. It chose to go. He comes Tuesdays. He's getting better at the soup." "It bit me. Good. It's got opinions." "Number nine. BEST FREND." You sort them into what N should hear first. There's no wrong order.`,
    [
      ch('The fine ones first.', out(`So he knows it's most of them.`, flag('openhand-insp3'), flag('openhand-order-fine'))),
      ch('The ones who chose to go, first.', out(`So he knows going's allowed, and nobody's lost.`, flag('openhand-insp3'), flag('openhand-order-go'))),
      ch('"Number nine. BEST FREND." first.', out(`So he starts with a drawing.`, flag('openhand-insp3'), flag('openhand-order-nine'))),
    ]),
  ev('openhand-climax', 'All Night', 'Evil Teams', { callback: true, requires: [...px({ beat: 6, has: 'third', inside: false })], cast: [BOSS, KNIGHT], tint: BALCONY, effect: 'none' },
    `The square under the balcony. Ten thousand candles. And, coming up the hill from Driftveil, a thousand people, each walking beside a Pokémon. None in a Ball. ${say('Ghetsis, from the rail', `—ask yourself: did it choose this? Did anyone ask it?`)} ${say('Emil, from the square, in a voice that\'s called down nineteen years of wards', `Yes.`)} Silence. ${say('Emil', `We did. A thousand houses. D'you want the figures? Nine hundred and four are fine. Sixty-one are learning. Thirty-five chose to go, and went, and we know where each one is, because we walked them there.`)} ${say('The boy from the square', `Mine sat down! I said go and he sat down!`)} ${say('Ghetsis', `Anecdote.`)} The smile arrives a moment late.`,
    [ch('(Wait for the dragon.)', on(`N lands. He's heard it from the air.`, 'openhand-dragon'))]),
  step('openhand-dragon', 'Phase 2: The Dragon', `${say('N', `You asked them. Without being able to hear.`)} ${say('Emil', `We looked. It's slower.`)} ${say('N', `Will they tell me? Themselves? I'd like— I've only ever heard the ones in his room. And then strangers', one at a time, in passing. I've never had anyone bring me an answer.`)}`, [
    ch('(Hold the lamp for him.)', on(`He sits on the steps. They come up one at a time. A Trubbish. A Minccino that's stopped being brushed. A fat Pansage with a ribbon. He listens to every one. He writes each down. You're holding the lamp, and there's nothing to press. It takes all night. The crowd doesn't leave. Somebody brings soup. At dawn, to nobody: ${say('N', `"I'm not afraid." Six hundred and twelve. I'd eleven.`)} He shuts the notebook. ${say('N', `I'd the wrong room.`)}`, 'openhand-dawn', flag('n-wrong-room'))),
  ], { cast: [N], pokemon: 'pansage', effect: 'none' }),
  step('openhand-dawn', 'Phase 4: Ghetsis', `He's still at the rail. Nobody's looked at him for six hours. ${say('Ghetsis', `The weather—`)} ${say('Sage Bronius, by radio, from the Frigate', `Is off. The Relay. I've pulled the red one. Nobody told me to. I've a thousand cards up here; the Knights brought them aboard. I've been counting. They add up.`)}`, [
    ch('Battle him.', fight(`Ghetsis, alone, with half a team; the Triad have gone to ask for names.`, ps(trainer('Ghetsis', { sprite: BOSS, team: ['hydreigon', 'cofagrigus', 'seismitoad'], size: 3, lv: 1, win: [room('openhand-after')] })))),
    ch('(Hold out an open hand.)', on(`He looks at it for a long time. He doesn't come. That's allowed. It's the creed.`, 'openhand-after', flag('openhand-ghetsis-hand'))),
  ]),
  step('openhand-after', 'After Open Hand', `It doesn't disband. It becomes a thing Unova has: at any town in the region, a tea towel in a window means a visit can be asked for. Your party's looked over, and told what it's doing well. N goes on with the list. It's got a second column now. ${EPILOGUE.openhand}`, [
    ch('(Take a tea towel.)', out(`ASK THE ONE IT'S ABOUT.`, story({ end: 'defeated' }), flag('plasma-ending-openhand'), flag('relay-dark'))),
  ], { cast: [KNIGHT], effect: 'none' }),
];
(openHand[8] as Json).remembers = [{ id: 'colress', when: [flagIs('openhand-colress')], notice: say('Colress, delighted', `A thousand's a sample! I've checked their method! It's better than mine!`) }];

export const EVENTS: Json[] = [finalChoice, ...asking, ...turn, ...ghetsis, ...own, ...openHand];
export const REMOVE: string[] = [];
