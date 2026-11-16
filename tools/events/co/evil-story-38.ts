// Catalog Overhaul Pack, Evil Teams Volume III: Galar, twelve scenes for any player, inside either route or out of both
// (MACRO_COSMOS_YELL_GALAR_FULL_3 part A, GA1 to GA12). Key Items are run flags (galar-plate-rubbing, galar-league-note,
// galar-ingleby-card): the inside routes and the endings read them, and the note and the card have a hand-over scene here
// (each on Rose's desk).
import { ch, ev, flag, flagIs, inRegion, out, room, type Json } from '../dsl.ts';
import { kind, prompt, STEALTH } from './_evil-story-kit.ts';

export const CATEGORY = 'evil-story';

const say = (who: string, line: string): string => `${who}: "${line}"`;
const G = inRegion('galar');
/** The run is in Galar and its story has reached this far (either route). */
const ga = (after: number): Json[] => [{ kind: 'evil', team: 'yell', after, anyRoute: true }, G];
const intel = (n: number): Json => flag('intel', n);
const SPIKE = '#1a141c';
const TOWER = '#1e2430';
const ROSE = 'trainer.pr/rose';
const YG = 'boss.drive/galarian-swsh-yell-grunt-man';
const OLDMAN = 'trainer.pr/veteran_m';

// ---------- GA1. R. & B. ----------
const GA1 = ev('ga-r-and-b', 'R. & B.', 'Evil Teams', { requires: ga(2), cast: [OLDMAN], tint: SPIKE },
  `A green steel box at the end of a Spikemuth street, humming, under eight years of fly-posters. An old man with a scraper and a tin of polish. ${say('Mr. Talbot Oldroyd', `Substation. I ran it thirty year. I'm retired. Nobody's come to replace me, so I keep an eye. There's a plate under this lot. I do it every spring.`)} He scrapes. Gig posters. A lost-Meowth notice. Under them: brass. R. & B., LAMPS. LAID BY HAND. ${say('Mr. Oldroyd', `I never knew who they were. Two lads with a winch, me dad said. Come down the coast wi' a drum o' cable on a cart. Lit the whole street in a week and wouldn't take owt but their dinner.`)} ${say('Mr. Oldroyd', `Oldest live cable in Galar, that. It's not on the modern map; they draw the map from Power Spots now. So far as Wyndon's concerned, this box doesn't exist. It only works.`)}`,
  [
    ch(`"Why's it flicker?"`, out(`${say('Mr. Oldroyd', `Somebody upstream's drawin' hard. Nights. Tuesdays, mostly. Oldest line goes first; it's the thinnest. I've rung. They've no record of a customer at this address.`)} He gives you a rubbing of the plate, on the back of a gig poster.`, intel(3), flag('yell-spur-known'), flag('galar-plate-rubbing'))),
    ch(`"Who'd know who R and B were?"`, out(`${say('Mr. Oldroyd', `Somebody old. Somebody who were there. There's not many left as were.`)} He gives you a rubbing of the plate, on the back of a gig poster.`, intel(3), flag('yell-spur-known'), flag('galar-plate-rubbing'))),
    ch('"Can I polish it?"', out(`A cloth, a circle. The brass comes up. There's a second line, smaller, under the first, that even he's not seen: "SO NOBODY'S LEFT DARK." ${say('Mr. Oldroyd', `...Well. They meant it, whoever they were.`)} He gives you a rubbing of the plate, on the back of a gig poster.`, intel(3), flag('yell-spur-known'), flag('galar-plate-rubbing'), flag('galar-plate-polished')), {
      prompt: prompt(STEALTH), fail: out(`A cloth, a circle. It takes a while. The brass comes up, and there's a second line, smaller, under the first: "SO NOBODY'S LEFT DARK." ${say('Mr. Oldroyd', `...Well. They meant it, whoever they were.`)} He gives you a rubbing of the plate.`, intel(3), flag('yell-spur-known'), flag('galar-plate-rubbing'), flag('galar-plate-polished')),
    }),
  ]);

// ---------- GA2. Who's the League ----------
const GA2 = [
  ev('ga-whos-the-league', `Who's the League`, 'Evil Teams', { requires: ga(2), cast: ['boss.drive/galarian-swsh-office-worker-woman'], tint: TOWER },
    `Rose Tower's lobby. A reception desk a cricket pitch long. A young woman with a headset. A sticky note on her monitor, curled with age: "WHO'S THE LEAGUE? — man w/ towel, 4 hrs, v. polite." ${say('Miss Enid Fairbairn', `Welcome to Macro Cosmos! How can I direct you?`)} She sees you reading the note. ${say('Miss Fairbairn', `Oh. That. I keep meaning to bin it. A gentleman came, two years back. Black and pink scarf. He wanted to know who'd decided his town couldn't be on television. I said it's in the League's contract. He said, 'Who's the League?'`)} ${say('Miss Fairbairn', `I didn't know. I work here. I rang up. Legal said Sponsorship. Sponsorship said Energy. Energy said it's a League matter. I went round three times. He waited four hours. I gave him a leaflet.`)} ${say('Miss Fairbairn', `I've asked since. On my own time. I've got as far as floor forty-four. Nobody decided. There's a clause, and everybody thinks it's somebody else's clause.`)}`,
    [
      ch('"What was on the leaflet?"', out(`${say('Miss Fairbairn', `'Macro Cosmos: We're Everywhere You Are.'`)} She hears it. ${say('Miss Fairbairn', `I gave that to a man from a town we'd cut off.`)}`, flag('galar-lore-lobby'))),
      ch('"How far up does it go?"', out(say('Miss Fairbairn', `Fifty. Everything does. But I don't think he knows either. That's what I can't get past. I think if you asked the Chairman who the League is, he'd have to stop and think.`), flag('galar-lore-lobby'))),
      ch(`"I'll take the note."`, out(`She peels it off the monitor and gives it to you. ${say('Miss Fairbairn', `Mind it doesn't curl.`)}`, flag('galar-lore-lobby'), flag('galar-league-note'))),
    ]),
  ev('ga-league-note-rose', `"Who's the League?"`, 'Evil Teams', { requires: [...ga(3), flagIs('galar-league-note'), flagIs('galar-league-note-given', 0, 0)], cast: [ROSE], tint: TOWER },
    `Rose's desk, for a moment unattended. You've a curled sticky note in your pocket.`,
    [
      ch('Put the note on his desk.', out(`${say('Rose', `'Who's the League.'`)} He reads it twice. ${say('Rose', `...It's Sponsorship. Which is Energy. Which is—`)} He stops. ${say('Rose', `It's me. Four hours. He waited four hours and it was me.`)}`, flag('galar-league-note-given'), flag('rose-knows-league'))),
      ch('Keep it.', out(`You keep it.`)),
    ]),
];

// ---------- GA3. Hook Forty-One ----------
const GA3 = ev('ga-hook-forty-one', 'Hook Forty-One', 'Evil Teams', { requires: ga(2), cast: ['boss.drive/galarian-swsh-mom'], tint: '#2a2418' },
  `A small museum by the old pit line in Motostoke. A lamp room, rebuilt behind glass. A wall of numbered hooks. Forty brass lamps. One hook empty. ${say('Mrs. Mavis Arkwright', `Number Two's lamp room, as it was. The company gave us the lot; the Chairman's own. He was most particular: 'Every one on its own hook. They knew their own.'`)} ${say('Mrs. Arkwright', `A man took his lamp down, he hung a brass tally in its place. Came up, swapped them back. End of shift, you looked at the wall. Any tally still up: a man still down.`)} ${say('Mrs. Arkwright', `Forty-one's never been here. I asked. He said, 'That one's out on loan.' I said, to whom? He said, 'To the last man up.' I don't know what he meant. I've put a card: 'On loan.'`)}`,
  [
    ch('"Is there a tally on the hook?"', out(`There is. Brass. A number, and a name punched in by hand: THACKRAY. ${say('Mrs. Arkwright', `It's still up. By the rule of the room, that means he's not come back. It's been up forty-five years.`)} A pause. ${say('Mrs. Arkwright', `He's alive, you know. Mr. Thackray. He comes in Thursdays. He stands and looks at his own tally and he laughs.`)}`, flag('galar-lore-lamps'))),
    ch('"Who was forty-one?"', out(`${say('Mrs. Arkwright', `A lad called Thackray. He's not a lad now.`)}`, flag('galar-lore-lamps'))),
    ch('"What happened on the last day?"', out(say('Mrs. Arkwright', `They came up at four. The lad who counted them counted forty, and then stood. Four minutes. They say he'd gone grey by the time the forty-first came up the cage. He'd stopped for a pit pony.`), flag('galar-lore-lamps'))),
  ]);

// ---------- GA4. Never on Charity ----------
const GA4 = ev('ga-never-on-charity', 'Never on Charity', 'Evil Teams', { requires: ga(2), cast: ['boss.drive/galarian-swsh-mom', 'boss.drive/galarian-swsh-office-worker-man'], tint: '#2a2428' },
  `A front room on a terrace in a mill town. Curtains half drawn. A woman in black. A man in a grey suit with a briefcase, standing, because he's not been asked to sit. ${say('Mr. Cedric Lomax, of Macro Cosmos Life', `Mrs. Illingworth. I'm so sorry. I'll not keep you. It's all in order. Mr. Illingworth never missed a week. Forty years.`)} He puts an envelope on the mantelpiece. He doesn't hand it to her. It's done that way. ${say('Mrs. Illingworth', `I've not filled in owt.`)} ${say('Mr. Lomax', `There's nothing to fill in. That's the Chairman's rule. It's the oldest one in the firm. 'No forms at a funeral. Nobody's put in the ground on charity.' We pay on the day and we sort the paper after.`)} Mrs. Illingworth, to you, when he's gone: "Everybody's got a word to say against that company. Too big. Into everything. Aye. And they've buried every man on this street decent for forty year and never once quibbled. You tell me which is true."`,
  [
    ch('"Both."', out(say('Mrs. Illingworth', `Aye. That's what I think. Both.`), intel(2), flag('galar-lore-club'))),
    ch('"What was he like? Mr. Illingworth."', out(`She tells you. It takes a while, and she smiles twice.`, intel(2), ...kind(1), flag('galar-lore-club'))),
    ch(`"Where'd the rule come from?"`, out(`${say('Mrs. Illingworth', `A pit village. The club went bust the year the seam did. There were a man buried by the parish. The Chairman were a lad; he carried the box. He said never again.`)} She straightens the envelope. ${say('Mrs. Illingworth', `He's kept that one. I'll say that for him. He's kept that one.`)}`, intel(2), flag('galar-lore-club'))),
  ]);

// ---------- GA5. Which One's Dad ----------
const GA5 = [
  ev('ga-which-ones-dad', `Which One's Dad`, 'Evil Teams', { requires: ga(2), cast: ['boss.ballguy', 'trainer.pr/youngster_f'], tint: '#3a3a44' },
    `A city square, at lunchtime. Three Ball Guys, on a break, on a bench, heads on. A girl of six in a school coat, standing in front of them with a lunchbox, frowning. ${say('The girl', `I've brought Dad's sandwiches. He forgot. Mum says he's the one in the middle. But they moved.`)} ${say('Ball Guy, left', `Heya, kiddo! Have a ball!`)} ${say('Ball Guy, middle', `Heya, kiddo! Have a ball!`)} ${say('Ball Guy, right', `Heya, kiddo! Have a ball!`)} Same voice. Same pitch. They're not allowed to break it. It's in the contract. ${say('The girl, to you', `They all say that. Can you tell?`)}`,
    [ch('Watch the three.', out(`One taps a foot. One sits very straight. One's got a hand flat on the bench, and the thumb's going: tap, tap-tap, tap.`, room('ga-which-ones-dad-2')))]),
  ev('ga-which-ones-dad-2', `Which One's Dad`, 'Evil Teams', { room: true, cast: ['boss.ballguy', 'trainer.pr/youngster_f'], tint: '#3a3a44' },
    `${say('The girl', `That's how he does the door. When he's home late. So I know it's him.`)} She walks up to the one on the right. She holds out the lunchbox. The head tilts. A hand takes it. Very carefully. The thumb goes: tap, tap-tap, tap. ${say('Ball Guy, right, same pitch, same cheer', `Heya, kiddo! Thanks!`)} It's the only word in six years that wasn't in the script.`,
    [
      ch('(Say nothing.)', out(`She goes back to school.`, flag('ballguy-derek'))),
      ch('"Does he ever take it off?"', out(`${say('The girl', `At home.`)} As if it were obvious.`, flag('ballguy-derek'))),
      ch(`"What's his name?"`, out(`${say('The girl', `Dad.`)} Then, as to someone slow: ${say('The girl', `Derek.`)}`, ...kind(1), flag('ballguy-derek'))),
    ]),
];

// ---------- GA6. Four Lines ----------
const GA6 = ev('ga-four-lines', 'Four Lines', 'Evil Teams', { requires: ga(2), cast: ['boss.drive/galarian-swsh-gentleman'], tint: TOWER },
  `The League's offices in Wyndon. A small tidy office. A man with a fountain pen and a contract the thickness of a brick. ${say('Mr. Wilfred Ackroyd, the League\'s solicitor', `Clause thirty-one? Good heavens. Nobody asks about thirty-one. It's a safety clause.`)} He finds it. "Televised fixtures shall take place at venues with Dynamax capability." ${say('Mr. Ackroyd', `The sponsor wanted the bands on screen; fair enough; they'd paid. I thought: if we're to show Dynamax, we'd better show it somewhere it's contained. A Power Spot's stable. So: capability. Four lines. I was rather pleased with it.`)} ${say('Mr. Ackroyd', `Why? Has there been a difficulty?`)}`,
  [
    ch(`"There's a Gym with no Power Spot."`, out(`${say('Mr. Ackroyd', `Is there? I'd understood they all— which?`)} "Spikemuth." He looks it up. He goes quite still. ${say('Mr. Ackroyd', `It's a League Gym. It's on the roll. It's— I've drafted a town off the air. I never saw it. I'd a list of stadiums. Spikemuth's not a stadium. It's a street.`)} He drafts an amendment. One line: "or at venues of historic standing." It needs a sponsor's signature. It's on Oleana's desk by the next stage; she's not signed it; she's not binned it.`, intel(3), flag('galar-clause'))),
    ch(`"Did you check which venues it'd cut?"`, out(`${say('Mr. Ackroyd', `I— no. I checked which it'd keep.`)} He drafts an amendment. One line: "or at venues of historic standing." It's on Oleana's desk by the next stage; she's not signed it; she's not binned it.`, intel(3), flag('galar-clause'))),
    ch(`"What's a 'fixture'?"`, out(`${say('Mr. Ackroyd', `A League match, naturally. It doesn't say that, I grant. It's undefined.`)} A pause. He's a lawyer; he sees it at once. ${say('Mr. Ackroyd', `...It's undefined. Anything could be a fixture. Or nothing need be.`)} He drafts an amendment anyway. It's on Oleana's desk by the next stage.`, intel(3), flag('galar-clause'), flag('galar-fixture'))),
  ]);

// ---------- GA7. Never Not Arrived ----------
const GA7 = ev('ga-never-not-arrived', 'Never Not Arrived', 'Evil Teams', { requires: ga(3), cast: [YG], tint: '#2a2a34' },
  `A hill on a Galar road. A coach, black and pink, steam coming out of it. Forty people on the verge. A very large man with his head in the engine. ${say('Big Daz', `She does this. Every hill. She's forty-one years old. She were a works bus. I'll have her goin' in ten minutes or two hours.`)} ${say('Gaz', `We've a match at three!`)} ${say('Big Daz', `An' we'll be at it. We've never once been on time an' we've never once not got there.`)} On the dash: a logbook. Every away day for eight years. Destination. Miles. "Arrived:" a time, always late. And a last column, in a different hand each week: "Worth it?" Every entry says the same. Aye.`,
  [
    ch('(Push.)', out(`Forty people and you, a coach, a hill. Your party helps. Something large leans on the back. Something small sits on the bonnet and encourages. She catches. A bang. Black smoke. A cheer that's heard in the next valley. ${say('Shaz', `One, two, three—`)} Forty people: "BIG DAZ! BIG DAZ!" Big Daz, crimson: ${say('Big Daz', `Give over.`)} They give you a lift. This week, the logbook's last column is yours to fill in.`, ...kind(1), flag('yell-coach'))),
    ch(`"Where'd she come from?"`, out(`${say('Big Daz', `Pit bus. Number Two. Took the day shift up from Motostoke. When it shut, she sat in a field twenty year. I bought her for the scrap price an' a crate o' ale.`)} He pats the wing. ${say('Big Daz', `She's still got the hooks inside. For lamps.`)}`, flag('yell-coach-history'))),
    ch(`"Who writes 'aye'?"`, out(say('Big Daz', `Whoever's in seat one. Different every week. It's the only rule: you can't write it till you're on the way home.`))),
  ]);

// ---------- GA8. A Bedsheet ----------
const GA8 = [
  ev('ga-a-bedsheet', 'A Bedsheet', 'Evil Teams', { requires: ga(3), cast: [YG], tint: SPIKE },
    `A shut chip shop in Spikemuth. A dark window. A fryer under a cloth. On the back wall, pinned up, a bedsheet with letters in emulsion paint: SPIKEMUTH'S STILL HERE. The S's are backwards. A Yeller, with a key: "First banner. Night the cameras went. Seven of us in here. Somebody said, well, that's that. Somebody else said, is it. An' Gaz's mam took the sheet off her own bed." Seven names, in biro, in the corner. Six are crossed through with a little pink star: still going. "That one's not. Moved to Wyndon. Got a job at the stadium. Home end. We don't— we've not fallen out. She just had to eat."`,
    [
      ch('"Does she still come?"', out(`"She's in the home end. In the uniform. She can't cheer; she's staff." A pause. "Every match we've been to at Wyndon, there's a steward by block J who looks the wrong way for ninety minutes. We've never been searched. We've never been moved. I've never seen her face. I know it's her."`, flag('yell-seventh'))),
      ch(`"Why's it in a shut shop?"`, out(`"Where else? It were the last place open."`, flag('yell-seventh'))),
      ch(`"Who painted the S's?"`, out(`"Gaz. He were nine."`, flag('yell-seventh'))),
    ]),
  ev('ga-a-bedsheet-steward', 'Block J', 'Evil Teams', { requires: [...ga(4), flagIs('yell-seventh'), flagIs('yell-seventh-met', 0, 0)], cast: ['boss.drive/galarian-swsh-leaguestaff-man'], tint: '#2a2a34' },
    `Wyndon Stadium. A steward, by block J. She's got a pink star, very small, pinned inside her lapel. Miss Beryl Dearden, not looking at you: "I can't talk. I'm working. Tell Beck his banner's too long for the rail. He wants to fold the last foot under. I've been wanting to say for six years."`,
    [ch(`"I'll tell him."`, out(`She looks the wrong way, very carefully.`, flag('yell-seventh-met')))]),
];

// ---------- GA9. They Forget Who They Are ----------
const GA9 = ev('ga-forget-who-they-are', 'They Forget Who They Are', 'Evil Teams', { requires: ga(3), cast: ['boss.marnie-masters4'], pokemon: 'morpeko', tint: SPIKE },
  `A yard behind the Spikemuth Gym. A chalk square. A girl in a leather jacket, practising, alone, very quietly. She doesn't shout moves. She says a name first. Every time. ${say('Marnie', `Hangry. Bullet Seed.`)} It goes. ${say('Marnie', `Grim. Snarl.`)} It goes. ${say('Marnie, not turning', `You're wonderin' why I say it. Everybody does. Wastes half a second.`)} ${say('Marnie', `They get lost. In a big match. All that noise; none of it for them. They stop bein' Hangry an' start bein' 'the Morpeko.' An' 'the Morpeko' doesn't know what I want. Hangry does.`)} ${say('Marnie', `It's worse when they go big. Dynamax. I'll not do it. He gets up there an' he doesn't know which way's down. I've seen 'em. They forget who they are when they're that big.`)}`,
  [
    ch('"Teach me."', out(`A short drill: you say each of your Pokémon's names before a move, in time. Your lead knows who it is now.`, flag('galar-x-chant'), flag('galar-lead-knows')), {
      prompt: prompt('echo-rhythm'), fail: out(`A short drill: you say each name before a move. You're slow; she makes you do it again, and again, until it's in time. Your lead knows who it is now.`, flag('galar-x-chant'), flag('galar-lead-knows')),
    }),
    ch('"Is that why Yell knows the names?"', out(`${say('Marnie', `That were me. I were eight. I made 'em learn. I'd not let anybody shout 'come on, Linoone' at our Stripes. It's rude.`)} One eyebrow. ${say('Marnie', `I didn't know it did owt. I just thought it were manners.`)}`, flag('marnie-names'))),
    ch(`"What d'you say when it's you that's lost?"`, out(`A long pause. ${say('Marnie', `...Me brother says it. From the side. 'Marnie.' Just that. Flat. Like he's askin' me to pass the salt.`)}`, ...kind(1))),
  ]);

// ---------- GA10. A Very Nice Site ----------
const GA10 = ev('ga-very-nice-site', 'A Very Nice Site', 'Evil Teams', { requires: ga(4), cast: ['boss.drive/galarian-swsh-leaguestaff-man'], tint: TOWER },
  `A planning office in Wyndon. A model, under perspex. A stadium. Tiny trees. A tiny car park. A label: WYNDON EAST — PROPOSED. A League development officer, Mr. Clarence Midgley, very pleased: "It's a lovely site. Power Spot; rail link; forty thousand seats. And it's his, if he'll take it. The singer. We've offered three times. I went up myself. I thought I was bringing good news." ${say('Mr. Midgley', `He looked at the model. He said, 'Where's the chip shop?' I said, there'll be concessions. He said, 'Where's Mrs. Gallowglass's front step?' I didn't follow. I said, it's a new build; there aren't steps.`)} ${say('Mr. Midgley', `He said no. Three times. I can't fathom it. We're offering him everything Spikemuth hasn't got.`)}`,
  [
    ch(`"That's why."`, out(`He looks at the model a long time.`, intel(4), flag('galar-wyndon-east'), flag('midgley-went'))),
    ch('"Did you go to Spikemuth?"', out(`${say('Mr. Midgley', `To the gate. It was shut. I rang him from outside.`)} A pause. ${say('Mr. Midgley', `I've been trying to give a man a new town and I've never been in the old one.`)} He goes. To Spikemuth. He's let in. He has chips. He comes back and takes the tiny trees off the model, one at a time, and can't say why.`, intel(4), flag('galar-wyndon-east'), flag('midgley-went'))),
    ch(`"What happens to the site if he won't?"`, out(`${say('Mr. Midgley', `It'll be built regardless. The Chairman likes it. It only wants a tenant.`)} He taps the perspex. ${say('Mr. Midgley', `Somebody suggested— not seriously— that if the Gym won't come to the site, one might bring the site to the Gym. There's a Power Spot under Spikemuth, apparently. Capped. Nobody's looked.`)}`, intel(4), flag('galar-wyndon-east'))),
  ]);

// ---------- GA11. Send Him Home ----------
const GA11 = [
  ev('ga-send-him-home', 'Send Him Home', 'Evil Teams', { requires: [...ga(3), flagIs('ally-zane')], cast: ['boss.drive/galarian-swsh-mom'], tint: '#3a3428' },
    `A sitting room in a Galar suburb. Flowers on every surface: a great many, some past their best. A woman in a dressing gown with a card in her hand. ${say('Mrs. Muriel Ingleby', `He sends them himself. The Chairman. Every fortnight since I was ill. Look: it's his own writing. 'With every good wish for your recovery. — R.' I'm recovered. I've been recovered a year. I've not the heart to tell him.`)} ${say('Mrs. Ingleby', `It's kind. I'll not say it isn't. He rang, once. Himself. He asked after my chest. He knew which hospital.`)} ${say('Mrs. Ingleby', `I've not seen my son in daylight in three years. He comes Sundays, and sleeps on that sofa, sitting up, with his shoes on. I'd swap every flower in this room for one Tuesday.`)}`,
    [
      ch('"Shall I tell the Chairman?"', out(`${say('Mrs. Ingleby', `Would you? Only— nicely. He means well.`)} She writes it on a card. She uses one of his. "Dear Chairman. Thank you for the flowers. Please send my son instead. — M. Ingleby (Mrs.)"`, flag('galar-ingleby-card'))),
      ch(`"What's Zane like, when he's rested?"`, out(say('Mrs. Ingleby', `Funny. He's funny. He does voices. He did the whole of the news as a Wooloo once. I've not heard a voice since he got the mug.`))),
      ch('"Write it on a card."', out(`She does. She uses one of his. "Dear Chairman. Thank you for the flowers. Please send my son instead. — M. Ingleby (Mrs.)"`, flag('galar-ingleby-card'))),
    ]),
  ev('ga-ingleby-card-rose', 'A Card', 'Evil Teams', { requires: [...ga(3), flagIs('galar-ingleby-card'), flagIs('zane-home', 0, 0)], cast: [ROSE], tint: TOWER },
    `Rose's desk. The lamp on it. You've a card in your pocket, in his own stationery.`,
    [
      ch('Put the card on his desk.', out(`${say('Rose', `...Ingleby's mother.`)} He reads it again. ${say('Rose', `I sent flowers. Every fortnight. I thought that was—`)} He puts it down, very carefully, next to the lamp. ${say('Rose', `I kept him till midnight and sent his mother flowers to make up for it. That's a pit owner's trick. I've had that done to me.`)} Zane's sent home at five, from the next stage. He doesn't know what to do. He goes home. He does the news as a Wooloo.`, ...kind(2), flag('zane-home'))),
      ch('Keep it.', out(`You keep it.`)),
    ]),
];

// ---------- GA12. The Other Chip Shop (a Visit: the same Town node, three times) ----------
const GA12 = [
  ev('ga-other-chip-shop-1', 'The Other Chip Shop', 'Evil Teams', { requires: ga(4), cast: [YG], tint: SPIKE },
    `When a town goes, the chip shops go third. When one comes back, they're first. The shut shop. The fryer under a cloth. Kaya: "It works. I tried it. There's no leccy for it; it'd take the whole street's."`,
    [
      ch(`Find a generator.`, out(`Mrs. Sowerby's, from the Hammerlocke road. It comes on the back of a coach.`, flag('spikemuth-chips-1'))),
      ch('Use the wall socket.', out(`The spur's been rerouted. The fryer hums.`, flag('spikemuth-chips-1')), { requires: [flagIs('spur-live')] }),
    ]),
  ev('ga-other-chip-shop-2', 'The Other Chip Shop', 'Evil Teams', { requires: [...ga(4), flagIs('spikemuth-chips-1')], cast: ['boss.drive/galarian-swsh-pokemon-breeder-man'], tint: SPIKE },
    `The fryer's hot. There's nothing to fry. Beck: "Nearest spuds are a farm past Route 9. He stopped deliverin' when we stopped orderin'."`,
    [ch('Fetch them.', out(`A sack. It's heavy. The farmer: "Spikemuth? I thought you'd all gone."`, flag('spikemuth-chips-2')))]),
  ev('ga-other-chip-shop-3', 'The Other Chip Shop', 'Evil Teams', { requires: [...ga(5), flagIs('spikemuth-chips-2')], cast: ['boss.piers', 'boss.drive/galarian-swsh-mom'], tint: SPIKE },
    `A queue. Eleven people. Then twenty. The window's steamed. Somebody's chalked a board: OPEN. Piers, in the queue, with his hood up, as if nobody'd know him: ${say('Piers', `I've not had chips on this street in five year.`)} Gaz's mam, behind the counter, who took the sheet off her own bed: "Salt an' vinegar, love?" ${say('Piers', `...Aye.`)}`,
    [ch('Have chips.', out(`He eats them on the Gym step. He doesn't say anything. He writes a song. It's the first one in eight years that's in a major key, and he's furious about it. The first away coach in five years turns up the following week. Eleven people from Circhester. They'd heard there were chips.`, ...kind(1), flag('spikemuth-chips'), flag('galar-power-east')))]),
];

export const EVENTS: Json[] = [GA1, ...GA2, GA3, GA4, ...GA5, GA6, GA7, ...GA8, GA9, GA10, ...GA11, ...GA12];
export const REMOVE: string[] = [];
