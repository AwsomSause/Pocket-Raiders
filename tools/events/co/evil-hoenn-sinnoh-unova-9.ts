// Catalog Overhaul Pack, row 9: Hoenn, Team Sky, the secret third way (HOENN_TEAMS part 5). The Draconid at the fire, the
// Founding (emblem and creed; the first three come), Acts S2 to S4 played in person, the Sky's Choice and its four endings
// (ps_sky_* maps), and the Zenith. Team Sky's Renown and Loyalty are run flags (`sky-renown`, `sky-loyalty`); its hire,
// promote, assign and dispatch screens (parts 6 and 7) are not built in this row: they are Evil Mode's management, on hold.
// Which team is the region's doesn't matter here: both march, and the conditions read the region's team, whichever it is.
import { $, ch, ev, fight, flag, flagIs, hurt, inRegion, out, room, trainer, bondUp, type Json } from '../dsl.ts';
import { evil as story, kind, prompt, rivalTrust, STEALTH } from './_evil-story-kit.ts';
import { TEAMS, say } from './evil-hoenn-sinnoh-unova-7.ts';

export const CATEGORY = 'evil-hoenn-sinnoh-unova';

const ZINNIA = 'boss.zinnia';
const SKY = '#2a5a48';
const HILL = '#3a4a58';
const M = TEAMS.magma;
const A = TEAMS.aqua;
const anyOf = (...keys: string[]): Json => ({ kind: 'anyFlag', keys });
const once = (k: string): Json => flagIs(k, 0, 0);
const renown = (n: number): Json => flag('sky-renown', n);
const loyalty = (n: number): Json => flag('sky-loyalty', n);
/** Hoenn, the region's team (Magma or Aqua) at least `after` beats in, the player outside it. */
const hoenn = (o: Json = {}): Json[] => [{ kind: 'evil', anyRoute: true, ...o }, inRegion('hoenn')];
/** Team Sky is founded (mark `third` on the region's team hides its Hideout, as Lantern and Open Hand do). */
const sky = (after: number, o: Json = {}): Json[] => [...hoenn({ after, has: 'third', ...o })];
const ps = (b: Json): Json => ({ ...b, pseudo: true });
const step = (id: string, name: string, intro: string, choices: Json[], x: { cast?: string[]; pokemon?: string; tint?: string; effect?: string } = {}): Json =>
  ev(id, name, 'Evil Teams', { room: true, cast: x.cast ?? [ZINNIA], tint: x.tint ?? SKY, effect: x.effect ?? 'none', ...(x.pokemon ? { pokemon: x.pokemon } : {}) }, intro, choices);
const on = (text: string, next: string, ...fx: Json[]): Json => out(text, ...fx, room(next));

// ---------- 5.1 The Draconid at the Fire ----------
// 1.3: all three must be true. (1) Walked between the recruiters, or left a team before Act 4. (2) Seen both teams' damage:
// read here as the region's story four beats in. (3) Looked up: a Rayquaza Sign, Sky Pillar, the Windswept Spire, the Lightning
// Rod or a rainbow (one variant each; the first to fit plays).
const FIRE = `A rest on high ground. Somebody's already sitting at your fire, toasting something on a stick. A Whismur sleeps in her lap. ${say('Zinnia', `Hi. I let myself in. You don't own the hill.`)} ${say('Zinnia', `I've been watching you watch them. Red hats want more land. Blue hats want more sea. You walked straight down the middle like you'd smelled something.`)} ${say('Zinnia', `My people have a story. Land and sea fight. They always fight. And every time, what stops them comes from up there.`)} She points with the stick. The sky's very clear. ${say('Zinnia', `Nobody's on the sky's side. No hats. No boats. Funny, that.`)}`;
const fireChoices = (): Json[] => [
  ch('"Somebody should be."', out(`${say('Zinnia', `Mm. Somebody.`)} She hands over the stick. ${say('Zinnia', `It needs a name. And you'll need people. Good ones, for once.`)}`, flag('sky-draconid-met'), room('sky-emblem'))),
  ch('"You are. Why not you?"', out(say('Zinnia', `I'm the last of a lot of things. I'm not a joiner. But I'll come to the meetings and criticise.`), flag('sky-draconid-met'), flag('zinnia-trust'), room('sky-emblem'))),
  ch(`"I'm not starting a team."`, out(`${say('Zinnia', `Fair.`)} She finishes her snack and goes. She'll ask once more.`, flag('sky-draconid-met'), flag('sky-declined'))),
];
const LOOKED = [['sky-pillar', 'Sky Pillar'], ['windswept-spire-1', 'the Windswept Spire'], ['w4-lightning-rod', 'the Lightning Rod'], ['rainbow', 'a rainbow']] as const;
const draconid: Json[] = [
  ...[...LOOKED.map(([seen]) => ({ kind: 'eventSeen', id: seen }) as Json), flagIs('sign-rayquaza')].map((up, i) => ev(i === 0 ? 'sky-draconid' : `sky-draconid-${i + 1}`, 'The Draconid at the Fire', 'Evil Teams', {
    requires: [...hoenn({ after: 4, inside: false, ends: ['none'] }), anyOf('hoenn-side-none', 'hoenn-left-team'), up, once('sky-draconid-met')],
    cast: [ZINNIA], pokemon: 'whismur', tint: HILL, effect: 'none' }, FIRE, fireChoices())),
  // "The offer returns once more, after the next Operation the player witnesses."
  ev('sky-draconid-again', 'The Draconid at the Fire', 'Evil Teams', { requires: [...hoenn({ after: 5, inside: false, ends: ['none'] }), flagIs('sky-declined'), once('sky-again')], cast: [ZINNIA], pokemon: 'whismur', tint: HILL },
    `${say('Zinnia', `Me again. You saw that one too. Still not starting a team?`)}`, [
      ch('"Somebody should be."', out(say('Zinnia', `Mm. Somebody. It needs a name.`), flag('sky-again'), room('sky-emblem'))),
      ch(`"I'm not."`, out(`${say('Zinnia', `Fair.`)} She doesn't come back.`, flag('sky-again'))),
    ]),
];

// ---------- 5.2 The Founding: the emblem, the creed, the first three ----------
const SHAPES = ['a wing', 'a ring', 'a cloud', 'a star', 'a feather', 'an eye', 'a spire', 'a kite'];
const shape = (s: string, next: string): Json => ch(`${s[0]!.toUpperCase()}${s.slice(1)}.`, on(`${s[0]!.toUpperCase()}${s.slice(1)}, in green and gold.`, next, flag(`sky-emblem-${s.split(' ')[1]}`)));
const founding: Json[] = [
  step('sky-emblem', 'The Founding: the Emblem', `The emblem. Eight shapes; green and gold.`, [...SHAPES.slice(0, 3).map((s) => shape(s, 'sky-creed')), ch('(More shapes.)', on(`The stick draws in the ash.`, 'sky-emblem-2'))], { tint: HILL }),
  step('sky-emblem-2', 'The Founding: the Emblem', `The emblem.`, [...SHAPES.slice(3, 6).map((s) => shape(s, 'sky-creed')), ch('(More shapes.)', on(`The stick draws in the ash.`, 'sky-emblem-3'))], { tint: HILL }),
  step('sky-emblem-3', 'The Founding: the Emblem', `The emblem.`, SHAPES.slice(6).map((s) => shape(s, 'sky-creed')), { tint: HILL }),
  step('sky-creed', 'The Founding: the Creed', `The creed. It can't be changed later, and it changes the story.`, [
    ch('"Keep the Balance."', on(`Neither land nor sea should win. Missions that stop both teams equally pay more Renown. Zinnia approves.`, 'sky-first-three', flag('sky-creed-balance'))),
    ch('"Protect the Small."', on(`The towns and wild Pokémon in the way come first. Rescues pay more, and kindness counts double.`, 'sky-first-three', flag('sky-creed-small'))),
    ch('"Above It All."', on(`The sky should rule the other two. Raids pay more. Grunts are bolder and less loyal. Zinnia watches you closely.`, 'sky-first-three', flag('sky-creed-above'))),
  ], { tint: HILL }),
  step('sky-first-three', 'The First Three', `Your first recruits aren't hired. They come. ${say('Marlo, the Aqua diver', `I found the trench. I know what's in it. I've not slept right since. I'd like to work for someone who's scared of it.`)} ${say('Dr. Tuff, the Magma geologist', `My readings said it would kill everyone. He wouldn't look. Will you look?`)} The third is whoever you've been kindest to in Hoenn: the freed spy, if there is one; or, failing all else, a kid with a kite, Lowen, who heard there was a team with no hats.`, [
    ch('(Welcome them.)', out(`Team Sky has three, and Zinnia, who'll come to the meetings and criticise. It meets on hills.`, story({ mark: 'third' }), flag('sky-founded'), renown(1), loyalty(3))),
  ], { cast: ['boss.npc_swimmer_m', 'boss.npc_ruinmaniac', 'boss.npc_youngster'] }),
];

// ---------- 5.3 Act S2. The First Flights ----------
const s2: Json[] = [
  ev('sky-drill-dig', 'The Drill and the Dig', 'Evil Teams', { requires: [...sky(4), once('sky-s2-1')], cast: ['boss.npc_ruinmaniac', 'boss.npc_swimmer_m'], tint: SKY },
    `Both teams are working the same coast, a mile apart: Magma's drill and Aqua's dig. ${say('Dr. Tuff', `If the drill reaches the vent, the dig floods with boiling water. Neither of them knows the other's there.`)} ${say('Marlo', `There are grunts in that trench. Kids, mostly.`)}`, [
      ch('Stop the drill.', fight(`The other team finishes its job.`, { ...trainer('Magma Grunts', { sprite: M.GRUNT, team: ['numel', 'mightyena', 'koffing'], size: 3, lv: 0, win: [renown(2), story({ heat: 2 }), flag('sky-s2-1')], lose: [flag('sky-s2-1')] }), pseudo: true })),
      ch('Stop the dig.', fight(`The other team finishes its job.`, { ...trainer('Aqua Grunts', { sprite: A.GRUNT, team: ['carvanha', 'poochyena', 'zubat'], size: 3, lv: 0, win: [renown(2), story({ heat: 2 }), flag('sky-s2-1')], lose: [flag('sky-s2-1')] }), pseudo: true })),
      ch('Warn both, in person.', out(`You walk into each camp in turn, in a green scarf, and tell them. Each lieutenant has to decide whether to believe an enemy. They do.`, renown(4), story({ heat: -1 }), flag('sky-warned-both'), flag('sky-s2-1'), ...kind(1)), { requires: [anyOf('hoenn-freed-spy', 'hoenn-same-story', 'hoenn-asked-both')] }),
      ch('Let them find out.', out(`The vent blows. Nobody dies. Twenty grunts in both colours crawl out scalded and furious at their own leaders. Six of them ask to join Sky. ${say('Zinnia', `That was cold.`)}`, renown(1), flag('sky-recruits', 6), flag('sky-s2-1'))),
    ]),
  ev('sky-name-wall', 'The Name on the Wall', 'Evil Teams', { requires: [...sky(4), flagIs('sky-s2-1'), once('sky-s2-2')], cast: ['boss.npc_gentleman'], tint: SKY },
    `Somebody has painted the Sky emblem on a town hall. It wasn't you. ${say('The mayor', `Are you a gang? We've got two. We can't afford three.`)} The painter is one of your own recruits, who wanted people to know.`, [
      ch(`"We're not a gang. Watch."`, out(`You say it to the painter too. Team Sky's public face is proud: recruits come faster.`, flag('sky-face-proud'), flag('sky-s2-2'), renown(1))),
      ch('"Find who painted it."', out(`You find them. You tell them quietly. Team Sky's public face is quiet: Heat rises slower.`, flag('sky-face-quiet'), flag('sky-s2-2'))),
      ch('"Paint over it."', out(`The painter helps. Team Sky's public face is quiet.`, flag('sky-face-quiet'), flag('sky-s2-2'))),
    ]),
  ev('sky-first-loss', 'The First Loss', 'Evil Teams', { requires: [...sky(4), flagIs('sky-s2-2'), once('sky-s2-3')], cast: ['boss.npc_youngster'], tint: SKY },
    `A mission goes wrong. A grunt is captured by one of the teams. The team looks at you. ${say('Lowen', `We go and get them. Right? That's what we are?`)}`, [
      ch('"We go tonight."', fight(`A Hideout raid, led by you.`, { ...trainer('Hideout Guards', { sprite: M.GRUNT, team: ['mightyena', 'golbat', 'camerupt'], size: 3, lv: 1, win: [loyalty(2), flag('sky-leaves-no-one'), flag('sky-s2-3')], lose: [flag('sky-s2-3')] }), pseudo: true })),
      ch('"We trade for them."', out(`You give up something for them. They come home.`, loyalty(1), flag('sky-s2-3'), $(-1000))),
      ch(`"We can't risk everyone for one."`, out(`The grunt is freed later, by Zinnia, who tells the team who came for them and who didn't.`, loyalty(-3), flag('sky-left-one'), flag('sky-s2-3'))),
    ]),
];

// ---------- 5.4 Act S3. The Third Power ----------
const s3: Json[] = [
  ev('sky-invitations', 'Two Invitations', 'Evil Teams', { requires: [...sky(5), flagIs('sky-s2-3'), once('sky-s3-1')], cast: [A.LEADER], tint: SKY },
    `${say('Maxie, by letter', `Your organisation shows method. Ally with me against the sea, and I'll leave you the air. I've no use for it.`)} ${say('Archie, in person, on your hill, with a barrel', `A third crew! I love it! Sail with me against the hot-heads and I'll name a ship after you.`)}`, [
      ch('Ally with Magma.', out(`Maxie writes back within the hour. It's a very precise letter.`, flag('sky-ally-magma'), flag('sky-s3-1'))),
      ch('Ally with Aqua.', out(`Archie opens the barrel.`, flag('sky-ally-aqua'), flag('sky-s3-1'))),
      ch('Ally with neither.', out(`Both are offended in different ways.`, flag('sky-s3-1'))),
      ch(`Tell each about the other's offer.`, out(`They're furious at each other, and wary of you.`, story({ heat: 1 }), renown(3), flag('sky-told-each'), flag('sky-s3-1'))),
    ]),
  ev('sky-base', 'The Base', 'Evil Teams', { requires: [...sky(5), flagIs('sky-s3-1'), once('sky-s3-2')], cast: [ZINNIA], tint: SKY },
    `The team needs a home. Three sites, each with a cost.`, [
      ch(`The Weather Institute's roof.`, out(`Forecasts, and Dr. Cirra Hart as an ally. It's public. Everyone knows where Sky is.`, flag('sky-base-institute'), flag('sky-s3-2'))),
      ch('A ruined Draconid watchtower.', on(`Hidden, and a Rayquaza Sign site. It needs Zinnia's permission.`, 'sky-zinnia-wants', flag('sky-base-tower'), flag('sky-s3-2'))),
      ch(`A stolen ship.`, out(`It moves. Missions launch from anywhere. Heat +4 with the team it's stolen from.`, story({ heat: 4 }), flag('sky-base-ship'), flag('sky-s3-2'))),
    ]),
  step('sky-zinnia-wants', 'What Zinnia Wants', `${say('Zinnia', `The tower's my grandmother's. You can have it. One condition.`)} ${say('Zinnia', `When it comes to it, and it will, you don't call the dragon down for yourself. You call it for everyone, or not at all. Say it.`)}`, [
    ch('"I promise."', out(`She nods once. She'll know.`, flag('sky-promise-zinnia'))),
    ch(`"I can't promise that."`, out(`${say('Zinnia', `...Honest. I'll take honest.`)}`)),
    ch(`"What if it's the only way?"`, out(say('Zinnia', `Then it's the only way for everyone. Say it, or don't.`))),
  ], { tint: HILL }),
  ev('sky-lieutenant', 'The Lieutenant Who Wants More', 'Evil Teams', { requires: [...sky(5), flagIs('sky-s3-2'), once('sky-s3-4')], cast: ['boss.npc_cooltrainer_m'], tint: SKY },
    `One of your Admins has been reading the Draconid murals. ${say('The Admin', `They can each wake one. We could wake the one that beats both. Why are we playing referee when we could be the whistle?`)} ${say('The Admin', `You'd be the most powerful person in Hoenn. You'd never have to ask anybody anything again.`)}`, [
      ch(`"That's not what we're for."`, out(`They nod. If they're not loyal, they don't mean it.`, flag('sky-admin-warned'), flag('sky-s3-4'))),
      ch('"Tell me more."', out(`They show you how.`, flag('sky-admin-tempted'), flag('sky-s3-4'))),
      ch('"Step down."', out(`They're demoted. A third of the boldest grunts leave with them, and found a splinter: the Zenith.`, flag('sky-zenith'), flag('sky-s3-4'))),
    ]),
];

// ---------- 5.5 Act S4. Mt. Pyre, from the other side ----------
const s4: Json[] = [
  ev('sky-pyre', 'Mt. Pyre, From the Other Side', 'Evil Teams', { requires: [...sky(5), once('sky-s4')], cast: ['boss.npc_gentleman', 'boss.npc_lady'], tint: '#3a3a48', effect: 'fog' },
    `The summit bench. The old couple. And below, climbing from two sides, a red column and a blue one. ${say('The old man', `You're new. No hat.`)} ${say('The old woman', `A scarf. That's a hat for your neck.`)} ${say('The old man', `They're coming for these. We can't stop two. Can you?`)}`, [
      ch('Hold the summit.', on(`Two battles, uphill, against both lieutenants.`, 'sky-pyre-tabitha')),
      ch('Take the orbs somewhere safe.', out(`Sky now holds both orbs. Every faction in Hoenn is after you.`, story({ heat: 6 }), flag('sky-has-orbs'), flag('sky-s4'))),
      ch('Give each team the wrong orb.', out(`The swap, on purpose, to both. In the cavern, each legend will turn on the team that woke it.`, flag('sky-swapped'), flag('sky-s4'))),
      ch('Let them have them. We stop it at the cavern.', out(say('The old woman', `That's a gamble with other people's coast.`), flag('sky-gambled'), flag('sky-s4'))),
    ]),
  step('sky-pyre-tabitha', 'The Red Column', `Tabitha, at the head of the red column. ${say('Tabitha', `Hoo... a scarf. Out of the way.`)}`, [
    ch('Battle.', fight(`Uphill.`, ps(trainer('Tabitha', { sprite: M.LT, team: ['camerupt', 'mightyena', 'golbat'], size: 3, lv: 1, win: [room('sky-pyre-shelly')] })))),
  ], { cast: [M.LT], effect: 'fog' }),
  step('sky-pyre-shelly', 'The Blue Column', `Shelly, at the head of the blue column. ${say('Shelly', `Ahaha! A third colour. How sweet. Move.`)}`, [
    ch('Battle.', fight(`Uphill.`, ps(trainer('Shelly', { sprite: A.LT, team: ['sharpedo', 'mightyena', 'crobat'], size: 3, lv: 1, win: [room('sky-pyre-held')] })))),
  ], { cast: [A.LT], effect: 'fog' }),
  step('sky-pyre-held', 'The Summit Held', `Your squads held the paths. The orbs stay in two laps.`, [
    ch('(Sit on the bench.)', out(`The old man offers you a sweet.`, renown(6), flag('sky-held-pyre'), flag('sky-s4'))),
  ], { cast: ['boss.npc_gentleman', 'boss.npc_lady'], effect: 'fog' }),
];

// ---------- 5.7 The Zenith (before the cavern) and 5.6 Act S5, the Sky's Choice ----------
const ZENITH = ev('sky-zenith-pillar', 'The Zenith', 'Evil Teams', { requires: [...sky(6), flagIs('sky-zenith'), once('sky-zenith-done')], cast: ['boss.npc_cooltrainer_m'], tint: '#1a2a20', effect: 'glint' },
  `A splinter team in black-green, on Sky Pillar, trying to call it down for themselves. At the front: your own old lieutenant.`, [
    ch('Battle.', fight(`${say('The Admin', `I learned it from watching you. I just didn't stop where you stopped.`)}`, { ...trainer('The Zenith', { sprite: 'boss.npc_cooltrainer_m', team: ['salamence', 'altaria', 'flygon', 'tropius'], size: 4, lv: 2, win: [flag('sky-zenith-done')], lose: [flag('sky-zenith-done'), flag('sky-zenith-won')] }), pseudo: true })),
  ]);
const climax = ev('sky-climax', `The Sky's Choice`, 'Evil Teams', { callback: true, requires: [...hoenn({ beat: 6, has: 'third', inside: false })], cast: [M.LEADER, A.LEADER, ZINNIA], tint: '#3a2a48', effect: 'rain' },
  `The Seafloor Cavern. Both leaders. Both legends, waking. And a green-scarfed line between them. ${say('Maxie', `You. The referee.`)} ${say('Archie', `The kite club! You've got some nerve!`)} ${say('Zinnia, behind you, quietly', `Here it is. This is the bit in the story.`)} The sky above the cavern roof has gone the colour of a bruise. Something up there is listening.`, [
    ch('Call it for everyone.', on(`You don't use an orb. You ask.`, 'sky-everyone'), { requires: [flagIs('sky-promise-zinnia')] }),
    ch('Call it for us.', on(`You raise a hand, and it comes, and it isn't asking.`, 'sky-ours'), { requires: [anyOf('sky-admin-tempted', 'sky-creed-above')] }),
    ch('Stand between them.', on(`You walk out onto the rock between two waking legends, with the whole team behind, and no orb, and no dragon.`, 'sky-between')),
    ch('Make them talk.', on(`"Lilycove. Both of you. Say it."`, 'sky-talk'), { requires: [anyOf('sky-warned-both', 'hoenn-lt-doubt')] }),
  ]);
const SKY_END: Json[] = [
  step('sky-everyone', 'Call It for Everyone', `Rayquaza comes down through the storm like a line being drawn. It looks at the two below. It looks at you. It waits to be told, and isn't. ${say('Zinnia', `You didn't order it. ...It noticed.`)} Both legends sleep. Rayquaza leaves. Team Sky becomes a standing watch: a hut on every high place in Hoenn, a kite flying when the weather's wrong.`, [
    ch('(Fly a kite.)', out(`Zinnia's trust is at its highest.`, story({ end: 'defeated' }), flag('sky-end-everyone'), flag('zinnia-trust', 3))),
  ], { pokemon: 'rayquaza', effect: 'sparkle' }),
  step('sky-ours', 'Call It for Us', `${say('The Admin', `Yes. Yes.`)} ${say('Zinnia', `You said it. You said it to my face.`)} Rayquaza ends the fight in a single turn, and stays. Hoenn's sky belongs to you. Both old teams kneel or flee. Every town flies the emblem, because it must. Zinnia leaves, and takes the Draconid tower with her.`, [
    ch(`(Look up.)`, on(`It's still there.`, 'sky-ours-after'), { requires: [flagIs('sky-promise-zinnia', 0, 0)] }),
    ch('(She stops in the door.)', on(`The Promise is broken. She'll battle you, now.`, 'sky-zinnia-fight'), { requires: [flagIs('sky-promise-zinnia')] }),
  ], { pokemon: 'rayquaza', effect: 'glint' }),
  step('sky-ours-after', 'Call It for Us', `Hoenn's sky is yours. Your rival's last battle of the run will be fought on Sky Pillar, to make you let it go.`, [
    ch('(Keep it.)', out(`Every town flies the emblem.`, story({ end: 'allied' }), flag('sky-end-ours'), flag('evil-start-hoenn'), rivalTrust(-3))),
  ], { pokemon: 'rayquaza', effect: 'glint' }),
  step('sky-zinnia-fight', 'A Broken Promise', `Her Salamence, and a fury the game hasn't shown before.`, [
    ch('Battle.', fight(`Whatever the result, she doesn't come back.`, { ...trainer('Zinnia', { sprite: ZINNIA, team: ['salamence', 'goodra', 'noivern', 'altaria', 'tyrantrum', 'whismur'], size: 6, lv: 2, win: [story({ end: 'allied' }), flag('sky-end-ours'), flag('evil-start-hoenn'), flag('zinnia-gone'), rivalTrust(-3)], lose: [story({ end: 'allied' }), flag('sky-end-ours'), flag('evil-start-hoenn'), flag('zinnia-gone'), rivalTrust(-3)] }), pseudo: true })),
  ], { cast: [ZINNIA], effect: 'glint' }),
  step('sky-between', 'Stand Between Them', `${say('Lowen, voice cracking', `This is so stupid. I'm staying.`)} Five turns between Primal Groudon and Primal Kyogre, taking hits meant for each other. Every Sky grunt who's loyal enough stands one turn in your place.`, [
    ch('(Hold the line.)', on(`It holds for five turns. Both leaders are looking at a hundred people in green who are willing to be the thing in the way, and it's that, not force, that stops them. ${say('Maxie', `...Stand down. All units. Stand down.`)} ${say('Archie', `Drop anchor. Drop it! I said drop it!`)}`, 'sky-between-after'), { prompt: prompt(STEALTH, 'good'), fail: on(`It bends, and doesn't break. Your party takes the hits nobody else could. Nobody faints from it. It holds for five turns. ${say('Maxie', `...Stand down. All units. Stand down.`)} ${say('Archie', `Drop anchor. Drop it! I said drop it!`)}`, 'sky-between-after', hurt(0.3)) }),
  ], { cast: [M.LEADER, A.LEADER], effect: 'rain' }),
  step('sky-between-after', 'Stand Between Them', `Nobody dies. Renown at its highest.`, [
    ch('(Let go of the breath.)', out(`Every Pokémon that held the line is closer to you for it.`, bondUp(3, 'party'), renown(10), story({ end: 'defeated' }), flag('sky-end-between'))),
  ], { cast: [ZINNIA] }),
  step('sky-talk', 'Make Them Talk', `Maxie and Archie look at each other. Something they've spent twenty years not saying is in the room. ${say('Archie', `...You were on that street.`)} ${say('Maxie', `You were on that pier.`)} They grew up three streets apart. The same wave, the same year. One blamed the sea; one blamed the people who built on it. Shelly and Tabitha, who've both walked out by now, stand at the back with their arms folded, like parents at a school play. The orbs go back up Mt. Pyre in two hands that have never touched before.`, [
    ch('Dissolve Team Sky.', out(`It's dissolved by its own success. Nothing woke at all.`, story({ end: 'defeated' }), flag('sky-end-talk'), flag('sky-dissolved'))),
    ch('Keep it, as the Hoenn Weather Watch.', out(`A red wing and a blue wing. Nothing woke at all.`, story({ end: 'defeated' }), flag('sky-end-talk'), flag('sky-weather-watch'))),
  ], { cast: [M.LEADER, A.LEADER] }),
];

export const EVENTS: Json[] = [...draconid, ...founding, ...s2, ...s3, ...s4, ZENITH, climax, ...SKY_END];
export const REMOVE: string[] = [];
