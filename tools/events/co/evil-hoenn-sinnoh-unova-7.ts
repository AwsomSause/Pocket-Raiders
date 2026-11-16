// Catalog Overhaul Pack, row 9: Hoenn, Team Magma and Team Aqua from inside (HOENN_TEAMS parts 1 to 4; EVIL_TEAMS_VOLUME_3_C
// "Hoenn", its six new Operations). One region, two teams: the run draws one of them (core/evil/teams.ts regionTeamId), and
// the Offer puts both recruiters on the road. Taking the other team's uniform switches the region's team (`side`), so
// everything here is written twice, once per team, from one generator. The player's codename is their rank.
// The ladder: Standing 3, 8, 15 and 25 for ranks 2 to 5 (evilTeams.json routes); the sixth is the Leader Confides.
// Suspicion: the Direct Question at 6, Marked at 9. Team Sky (the secret third way) is in -8.
import { $, br, ch, ev, fight, flag, flagIs, inRegion, out, room, trainer, type Json } from '../dsl.ts';
import { evil as story, kind, rivalTrust } from './_evil-story-kit.ts';
import { teamJson } from './evil-story-1.ts';

export const CATEGORY = 'evil-hoenn-sinnoh-unova';

type Side = 'magma' | 'aqua';
export const say = (who: string, line: string): string => `${who}: "${line}"`;
const mark = (m: string): Json => story({ mark: m });
const meters = (standing: number, suspicion = 0, rank?: number): Json => story({ ...(standing ? { standing } : {}), ...(suspicion ? { suspicion } : {}), ...(rank ? { rank } : {}) });
const beat = story({ beat: true });
const once = (k: string): Json => flagIs(k, 0, 0);
/** A Quiet way's chance of being noticed, shown on the button (Part 0, rule 6). */
const quietly = (label: string, odds: number, text: string, fx: Json[], caught: string, ...after: Json[]): Json =>
  ch(`${label} (${Math.round(odds * 100)}% chance it's noticed)`, out(text, ...fx, ...after), { chance: 1 - odds, fail: out(`${text} ${caught}`, ...fx.filter((x) => (x as { kind?: string }).kind !== 'evil'), meters(0, 2), ...after) });

/** Everything the two teams write differently. */
type T = {
  id: Side; p: string; name: string; other: Side; otherName: string;
  leader: string; lt: string; otherLt: string; admin: string; otherLeader: string;
  LEADER: string; LT: string; OTHER_LT: string; OTHER_LEADER: string; GRUNT: string; OTHER_GRUNT: string;
  tint: string; legend: string; otherLegend: string; primal: string; weather: string; fails: string;
  buddy: string; buddyMon: string; spy: string; place: string; home: string;
};
const M = teamJson('magma');
const A = teamJson('aqua');
const TEAMS: Record<Side, T> = {
  magma: { id: 'magma', p: 'mg', name: 'Team Magma', other: 'aqua', otherName: 'Team Aqua', leader: 'Maxie', lt: 'Tabitha', otherLt: 'Shelly', admin: 'Courtney', otherLeader: 'Archie',
    LEADER: M.ranks.leader.sprite, LT: M.ranks.executive.sprite, OTHER_LT: A.ranks.executive.sprite, OTHER_LEADER: A.ranks.leader.sprite, GRUNT: M.ranks.grunt.sprite, OTHER_GRUNT: A.ranks.grunt.sprite,
    tint: M.color, legend: 'Groudon', otherLegend: 'Kyogre', primal: 'groudon', weather: 'Desolate Land: harsh sun, and Water moves fail', fails: 'the coast dries to salt flats',
    buddy: 'Ottoway', buddyMon: 'numel', spy: 'Tolliver', place: 'valley', home: 'the hideout under Mt. Chimney' },
  aqua: { id: 'aqua', p: 'aq', name: 'Team Aqua', other: 'magma', otherName: 'Team Magma', leader: 'Archie', lt: 'Shelly', otherLt: 'Tabitha', admin: 'Matt', otherLeader: 'Maxie',
    LEADER: A.ranks.leader.sprite, LT: A.ranks.executive.sprite, OTHER_LT: M.ranks.executive.sprite, OTHER_LEADER: M.ranks.leader.sprite, GRUNT: A.ranks.grunt.sprite, OTHER_GRUNT: M.ranks.grunt.sprite,
    tint: A.color, legend: 'Kyogre', otherLegend: 'Groudon', primal: 'kyogre', weather: 'Primordial Sea: heavy rain, and Fire moves fail', fails: 'the lowlands go under',
    buddy: 'Marisca', buddyMon: 'carvanha', spy: 'Ashlyn', place: 'harbour', home: 'the ship moored at Lilycove' },
};
/** The run is in Hoenn and this is the region's team. */
export const hn = (team: Side, o: Json = {}): Json[] => [{ kind: 'evil', team, ...o }, inRegion('hoenn')];
const inside = (t: T, o: Json = {}): Json[] => hn(t.id, { inside: true, ...o });

// ---------- 1.1 The Offer (both recruiters; hooked to The Files of whichever team the run drew) ----------
const OFFER = `Rain on one side of the road and ash on the other. Two recruiters have set up on opposite verges. Both have seen you battle. ${say('Magma recruiter, Foreman Varrick', `You fight like someone who plans. We need planners. The land's running out, and nobody's doing the maths.`)} ${say('Aqua recruiter, Bosun Calla', `You fight like someone with a heart. The sea made every living thing. We're just giving it room.`)} ${say('Varrick', `Pay's weekly. The hood's warm.`)} ${say('Calla', `Ours comes with a boat.`)} Both hold out a uniform. Between them, the road goes on, empty.`;
const offerChoices = (id: string): Json[] => [
  ch('Take the red hood.', out(`You join Team Magma as a Recruit. Calla spits. ${say('Calla', `We'll remember your face.`)}`, story({ side: 'magma' }), mark('inside'), flag('hoenn-side-magma'), flag('hoenn-offered'), $(300))),
  ch('Take the blue bandana.', out(`You join Team Aqua as a Deckhand. Varrick writes something down.`, story({ side: 'aqua' }), mark('inside'), flag('hoenn-side-aqua'), flag('hoenn-offered'), $(300))),
  ch('Walk between them.', out(`Both watch you go. The road goes on, and so does Hoenn's story, from the outside.`, flag('hoenn-side-none'), flag('hoenn-offered'))),
  ch('Ask each of them one question.', out(`To Varrick: "What happens to the people on the coast?" ${say('Varrick', `Relocation. It's costed.`)} To Calla: "What happens to the people inland?" ${say('Calla', `They'll learn to swim.`)} Both recruiters are a little less sure of themselves.`, flag('hoenn-asked-both'), room(`${id}-2`)), { requires: [once('hoenn-asked-both')] }),
];
const offerFor = (team: Side): Json[] => {
  const id = `evil-${team}-offer-hoenn`;
  const first = ev(id, 'The Offer', 'Evil Teams', { room: true, cast: [TEAMS.magma.GRUNT, TEAMS.aqua.GRUNT], tint: '#4a3a40', effect: 'none' }, OFFER, offerChoices(id));
  (first as Json).remembers = [{ id: 'rep', when: [{ kind: 'rep', category: 'champion', atLeast: 'known' }], notice: `Both use your name. "The League likes you. That's worth something to us."` }, { id: 'rival', when: [{ kind: 'rivalState', feeling: { key: 'trust', atLeast: 3 } }], notice: `Your rival watches from the trees, and says nothing yet.` }];
  // Asked both: the player starts with +1 Standing on either side, for asking good questions.
  const again = ev(`${id}-2`, 'The Offer', 'Evil Teams', { room: true, cast: [TEAMS.magma.GRUNT, TEAMS.aqua.GRUNT], tint: '#4a3a40' }, `Both uniforms are still held out.`, [
    ch('Take the red hood.', out(`You join Team Magma as a Recruit, for asking good questions.`, story({ side: 'magma' }), mark('inside'), meters(1), flag('hoenn-side-magma'), flag('hoenn-offered'), $(300))),
    ch('Take the blue bandana.', out(`You join Team Aqua as a Deckhand, for asking good questions.`, story({ side: 'aqua' }), mark('inside'), meters(1), flag('hoenn-side-aqua'), flag('hoenn-offered'), $(300))),
    ch('Walk between them.', out(`Both watch you go.`, flag('hoenn-side-none'), flag('hoenn-offered'))),
  ]);
  return [first, again];
};

// ---------- Parts 2 and 3, written once per team ----------
function teamEvents(t: T): Json[] {
  const P = t.p;
  const E = (id: string, name: string, o: Json, intro: string, choices: Json[]): Json => ev(`${P}-${id}`, name, 'Evil Teams', { tint: t.tint, ...o }, intro, choices);
  const R = (id: string, name: string, intro: string, choices: Json[], o: Json = {}): Json => E(id, name, { room: true, cast: [t.GRUNT], ...o }, intro, choices);
  const go = (id: string) => room(`${P}-${id}`);
  const buddyLine = t.id === 'magma'
    ? say('Ottoway', `I don't hate water. I hate what it did. Mr. Maxie says there's a difference.`)
    : say('Marisca', `My dad's nets came up empty for three years. Archie's the first who said it wasn't our fault.`);
  const buddyWho = t.id === 'magma'
    ? `Grunt Ottoway: a farm boy from a flooded valley. He joined after the river took his family's land. He carries a Numel he's had since it was tiny.`
    : `Grunt Marisca: a fisherman's daughter from a harbour the factories poisoned. She joined to get the sea back. She carries a Carvanha that bites everyone but her.`;

  // Act 1. The Hood.
  const INIT = t.id === 'magma'
    ? `The base smells of hot stone. A hundred people in the same colour turn round at once. ${say('Tabitha', `Hoo hah! Fresh one. Line up. The leader speaks.`)} ${say('Maxie, on a gantry, with a pointer', `Sixty-one per cent of this region is water. Useless to anything with feet. I intend to correct the figure.`)} ${say('Maxie', `You are not here to believe me. You are here to check my working. Then you'll believe me.`)} He looks at you a moment longer than the rest.`
    : `The base smells of brine. A hundred people in the same colour turn round at once. ${say('Shelly', `Ahaha! New fish. Stand up straight; you're on a deck.`)} ${say('Archie, on the prow of a moored ship, arms wide', `Every one of you came out of the sea! Your blood's salt! And what did we do? Paved the shore and called it progress!`)} ${say('Archie', `I don't want followers. I want a crew. A crew pulls together or it drowns together.`)} He points at you. ${say('Archie', `You. You've got sea eyes. I like you already.`)}`;
  const askLeader = t.id === 'magma'
    ? ch('Ask a question.', out(`"What's the margin of error?" Maxie is delighted.`, meters(1), flag('hoenn-asked-leader'), go('bunkmate')))
    : ch('Ask a question.', out(`"What about the people on land?" Archie laughs, a second too long.`, meters(0, 1), flag('hoenn-asked-leader'), go('bunkmate')));
  const CASE = t.id === 'magma' ? `core samples, and a heartbeat graph from under Mt. Chimney` : `tide charts, and a sonar picture of something enormous, asleep`;
  const act1: Json[] = [
    E('act1', 'Initiation', { callback: true, requires: inside(t, { beat: 2 }), cast: [t.LEADER, t.LT], effect: 'none' }, INIT, [
      ch('Salute.', out(`You salute.`, meters(1), go('bunkmate'))),
      askLeader,
      ch('Say nothing.', out(`The grunt beside you whispers: "First day's the worst. Stick with me."`, flag('hoenn-bunkmate'), go('bunkmate'))),
    ]),
    R('bunkmate', 'The Bunkmate', `Every recruit gets one. Yours is ${buddyWho} ${buddyLine}`, [
      ch('(Shake hands.)', out(`The ${t.buddyMon === 'numel' ? 'Numel' : 'Carvanha'} watches you do it.`, flag('hoenn-bunkmate'), go('errand'))),
    ], { pokemon: t.buddyMon }),
    R('errand', 'First Mission: The Errand', `The briefing: carry a sealed case across one stage to a team site. Don't open it.`, [
      ch('By the Book: deliver it.', out(`Delivered, sealed. A stamp on your card.`, meters(3), flag(`hoenn-inside-act1`), beat)),
      quietly('Quietly: open it at a rest, then reseal it.', 0.2, `Inside: ${CASE}. You reseal it.`, [meters(3), flag('hoenn-saw-case'), flag('intel', 1)], `The seal's crooked. Somebody notices.`, flag('hoenn-inside-act1'), beat),
      ch(`Refuse: "I don't carry what I can't see."`, out(`Somebody else carries it.`, meters(-2), flag('hoenn-refused-1'), flag('hoenn-inside-act1'), beat)),
    ]),
  ];

  // Act 2. The Work.
  const FENCE = t.id === 'magma'
    ? `The briefing: close the Lavaridge hot spring to the public. Magma needs the heat readings. ${say('An old woman at the gate, Granny Sato-Brennan', `I've bathed my knees here fifty years. You going to stop me, dear? In that hat?`)} ${say('Ottoway, quietly', `My gran's knees were bad too.`)}`
    : `The briefing: collect "the sea's tax" from every boat in Slateport harbour. ${say('A ferry captain, Mo', `Five hundred? I carry schoolchildren. I'll have to stop the run.`)} ${say('Marisca, quietly', `That's what the factories did to us. Charged us out.`)}`;
  const FENCE_Q = t.id === 'magma' ? `The fence has a gate, and Granny gets the key.` : `You pay the school ferry's toll out of your own wages and write it up as collected.`;
  const PRIZE = t.id === 'magma'
    ? `The briefing: take the meteorite from Professor Cozmo at Meteor Falls. ${say('Professor Cozmo, holding it to his chest', `It isn't a fuel cell! It's four billion years old! It's the oldest thing any of us will ever touch!`)} ${say('Courtney, flat', `Analysing. He's stalling. Take it.`)}`
    : `The briefing: take the submarine Explorer 1 from Captain Stern's dock. ${say('Captain Stern', `She's a research vessel. Thirty years of my life. You'll take her to wake a monster.`)} ${say('Matt, grinning', `Bro! It's got a periscope! Grab the keys!`)}`;
  const PRIZE_Q = t.id === 'magma' ? `You swap it for a painted rock, and give Cozmo the real one to hide.` : `You take the sub, but leave Stern the depth-lock key, so it can't dive past the trench without him.`;
  const PRIZE_FOE = t.id === 'magma' ? trainer(`Cozmo's assistant`, { sprite: 'boss.npc_scientist', team: ['solrock', 'lunatone', 'bagon'], size: 3, lv: 0 }) : trainer(`Stern's crew`, { sprite: 'boss.npc_sailor', team: ['wingull', 'wailmer', 'machoke'], size: 3, lv: 0 });
  const otherGrunt = t.id === 'magma' ? `Aqua's Grunt Tolliver` : `Magma's Grunt Ashlyn`;
  const sameStory = t.id === 'magma' ? `a dead harbour` : `a flooded farm`;
  const act2: Json[] = [
    E('act2', t.id === 'magma' ? 'The Hot Spring Fence' : 'The Harbour Toll', { callback: true, requires: inside(t, { beat: 3 }), cast: [t.GRUNT], pokemon: t.buddyMon, effect: 'none' }, FENCE, [
      ch('By the Book.', out(`The ${t.id === 'magma' ? 'fence goes up' : 'toll is taken'}. ${t.buddy} goes quiet.`, meters(4), $(500), flag('hoenn-buddy-quiet'), go('prize'))),
      quietly('Quietly.', 0.25, FENCE_Q, [meters(3), ...kind(1), flag('hoenn-bunkmate-trust')], `Somebody counts the takings.`, go('prize')),
      ch(`Refuse: "Find someone else."`, out(`${t.buddy} does it instead, badly, and is ashamed.`, meters(-2), flag('hoenn-buddy-ashamed'), go('prize'))),
    ]),
    R('prize', t.id === 'magma' ? 'The Meteorite' : 'The Submarine', PRIZE, [
      ch('By the Book.', fight(`The prize is taken.`, { ...PRIZE_FOE, win: [meters(5), flag('hoenn-prize-taken'), go('spy')], lose: [meters(3), flag('hoenn-prize-taken'), go('spy')] } as Json)),
      quietly('Quietly.', 0.3, PRIZE_Q, [meters(4), flag('hoenn-prize-quiet')], `The paint's still wet.`, go('spy')),
      ch('Refuse.', out(`${t.admin} does it, and hurts someone. You hear about it after.`, meters(-2), go('spy'))),
    ], { cast: [t.GRUNT] }),
    R('spy', `The Other Side's Grunt`, `The briefing: a grunt from the opposing team has been caught spying. Interrogate them. A storeroom. A grunt in the wrong colour, tied to a chair, very young, trying to look brave. ${say(otherGrunt, `I won't talk. ...Is there water? I mean, I don't need it.`)} ${say(t.lt + ', at the door', `Find out where they're digging. I don't care how.`)}`, [
      ch('Scare them.', out(`They talk. They cry after. ${t.buddy} leaves the room.`, meters(4), flag('hoenn-cruel'), go('promote-2'))),
      ch('Give them the water, and talk.', out(`They tell you half. It's enough.`, meters(3), go('promote-2'))),
      ch('Let them go.', out(`A window, a nod. You blame a broken lock.`, meters(0, 2), flag('hoenn-freed-spy'), go('promote-2'))),
      ch('Ask why they joined.', out(`It's ${t.buddy}'s story, in the other colour. ${sameStory}.`, flag('hoenn-same-story'), go('promote-2'))),
    ], { cast: [t.OTHER_GRUNT, t.LT] }),
    R('promote-2', 'Promotion', t.id === 'magma' ? say('Maxie', `Your results are within tolerance. Surveyor. Don't thank me; thank the data.`) : say('Archie', `Ha! You'll do. Diver's stripes. First round's on Matt.`), [
      ch('(Take the stripes.)', out(`Rank 3.`, meters(0, 0, 3), flag('hoenn-inside-act2'), beat)),
    ], { cast: [t.LEADER] }),
  ];

  // Act 3. The Cost.
  const act3: Json[] = [
    E('act3', 'The Rival Finds Out', { callback: true, requires: inside(t, { beat: 4 }), cast: [t.GRUNT], effect: 'none' },
      `You come round a corner in uniform. Your rival is standing there with a sandwich. ${say('Your rival', `...No.`)} ${say('Your rival', `That's a costume. Tell me that's a costume.`)} ${t.buddy} steps back to give you room.`, [
        ch(`"I'm on the inside. Trust me."`, out(say('Your rival', `Sure you are.`), rivalTrust(-1), go('norman')), { branches: [br([{ kind: 'rivalState', feeling: { key: 'trust', atLeast: 3 } }], `${say('Your rival', `...Fine. But I'm watching you.`)} They're your contact outside now.`, flag('hoenn-rival-contact'), go('norman'))] }),
        ch(`"They're not wrong about everything."`, out(`They listen to the whole case. ${say('Your rival', `And the people in the way?`)} They think about it.`, rivalTrust(-1), flag('hoenn-rival-heard'), go('norman'))),
        ch(`"It's none of your business."`, fight(`They fight angry.`, { ...trainer('Your rival', { rival: true, size: 6, lv: 2, win: [flag('hoenn-rival-broken'), go('norman')], lose: [flag('hoenn-rival-broken'), go('norman')] }), pseudo: true }, rivalTrust(-3))),
      ]),
    R('norman', 'Norman', `The Petalburg Gym. You walk in wearing the colours. The trainers stop mid-battle. ${say('Norman', `Take the hood off or leave it on. I'll battle you either way. That's my job.`)} ${say('Norman', `But I'll ask what I'd ask my own kid. Is it what you believe, or is it somewhere to belong?`)}`, [
      ch('"I believe it."', out(say('Norman', `Then be ready to see what it costs.`), flag('hoenn-norman-believe'), go('counter'))),
      ch(`"It's somewhere to belong."`, out(`${say('Norman', `Then come to dinner. That's somewhere too.`)} There's a free rest at Petalburg for you, for the run.`, flag('hoenn-norman-belong'), go('counter'))),
      ch(`"I'm still working it out."`, out(say('Norman', `Honest. Good. Don't take too long.`), flag('hoenn-norman-honest'), go('counter'))),
    ], { cast: ['boss.norman'] }),
    R('counter', 'The Counter-Offer', t.id === 'magma'
      ? `A note in your locker in the wrong colour ink. A meeting place. Shelly is waiting alone. ${say('Shelly', `Tolliver says you gave him water. Or let him go. Depends who's telling it.`)} ${say('Shelly', `Maxie's going to boil the sea. You've seen the graph. Come over. Or stay, and tell me things.`)}`
      : `A note in your locker in the wrong colour ink. A meeting place. Tabitha is waiting alone. ${say('Tabitha', `Hoo... Ashlyn says you're decent. I don't meet many.`)} ${say('Tabitha', `Archie's going to drown half the map. Cross over. Or stay put, and pass me what you hear.`)}`, [
      ch(`"I'll cross."`, out(`You change teams, one rank lower. ${t.name} is hostile now. ${t.buddy} watches you go.`, story({ side: t.other, demote: true }), flag('hoenn-turncoat'), flag(`hoenn-side-${t.other}`), flag('hoenn-counter-heard'), room(`${TEAMS[t.other].p}-weather`))),
      ch(`"I'll stay, and report to you."`, out(`Each mission now has a fourth way: tip them off. Suspicion will come faster.`, flag('hoenn-double-agent'), flag('hoenn-counter-heard'), go('weather'))),
      ch(`"I'll stay, and report you."`, out(`${t.otherLt} is nearly caught, and knows who did it.`, meters(5), flag('hoenn-reported-lt'), flag('hoenn-counter-heard'), go('weather'))),
      ch('"No."', out(`Nothing.`, go('weather'))),
    ], { cast: [t.OTHER_LT] }),
    R('weather', 'The Weather Institute', `The briefing: the Weather Institute has a Castform and thirty years of climate records. The leader wants both. ${say('The director, Dr. Cirra Hart', `You want the records? Read them. Every model ends the same. You can't hold the weather still at one setting. It breaks.`)} ${say('Your leader, by radio', `Bring the data. Leave the opinions.`)}`, [
      ch('By the Book: take both.', out(`The Castform cries in its case.`, meters(5), go('promote-4'))),
      quietly('Quietly: take the records, leave the Castform, read the last page.', 0.2, `The Castform stays under a desk. On the way back you read the last page. The plan fails. Every model says so.`, [meters(4), flag('hoenn-read-models')], `Somebody saw the empty case.`, go('promote-4')),
      ch('Refuse.', out(`Somebody else goes.`, meters(-2), go('promote-4'))),
    ], { pokemon: 'castform', cast: ['boss.npc_scientist'] }),
    R('promote-4', 'Promotion', `You get a squad: ${t.buddy} and two grunts, Corwen and Quince. They look at you the way you looked at ${t.lt} on day one.`, [
      ch('(Take the squad.)', out(`Rank 4: ${t.id === 'magma' ? 'Foreman' : 'Bosun'}.`, meters(0, 0, 4), go('squad'))),
    ], { cast: [t.GRUNT, t.GRUNT, t.GRUNT] }),
    R('squad', 'The Squad Goes Too Far', `Your own squad has done a job without orders, to impress you. ${t.id === 'magma' ? say('Quince, proud', `We got the spring shut like you didn't. Proper this time. No gate.`) : say('Quince, proud', `We collected from the school ferry. Double. For the back pay.`)} ${say(`${t.buddy}, not looking up`, `I told them not to.`)}`, [
      ch('"Undo it. Now."', out(`They do, confused. ${t.buddy} looks at you properly for the first time in a while.`, meters(0, 1), flag('hoenn-squad-decent'), flag('hoenn-inside-act3'), beat)),
      ch('"Well done."', out(`The squad learns what you reward.`, meters(2), flag('hoenn-squad-hard'), flag('hoenn-inside-act3'), beat)),
      ch('"Why did you think I wanted that?"', out(`${say('Quince', `Because that's what gets people promoted.`)} You have no answer.`, flag('hoenn-squad-asked'), flag('hoenn-inside-act3'), beat)),
    ], { cast: [t.GRUNT, t.GRUNT] }),
  ];

  // Act 4. The Orbs. Mt. Pyre (beat 5); the Leader Confides (40 Standing); the Bunkmate's Request (beat 6) and the Final Choice.
  const ORB = t.id === 'magma' ? 'the Red Orb' : 'the Blue Orb';
  const act4: Json[] = [
    E('act4', 'Mt. Pyre', { callback: true, requires: inside(t, { beat: 5 }), cast: ['boss.npc_gentleman', 'boss.npc_lady'], effect: 'fog' },
      `The briefing: two orbs sit at the top of Mt. Pyre, guarded by an old couple. The leader needs one. Fog, gravestones, and Pokémon mourning at them. The climb goes past people leaving flowers. At the summit, two very old people sit on a bench with a table between them, and an orb in each lap. ${say('The old man', `Sixty years on this bench. We've turned away kings.`)} ${say('The old woman', `You've a kind face under that. They always send a kind face.`)} ${say('The old man', `Take one orb and you wake one. Then somebody has to take the other, to stop it. That's the trick of it. They come as a pair, like us.`)}`, [
        ch('Take the orb.', out(`They don't fight. The old woman wraps ${ORB} in her scarf, "so it doesn't get cold."`, meters(6, 0, 5), flag('hoenn-orb-taken'), flag('hoenn-inside-act4'), beat)),
        ch('Take the wrong orb on purpose.', out(`${t.id === 'magma' ? `The Blue Orb, in a red hood's hands.` : `The Red Orb, in a blue bandana's hands.`} The plan will go wrong in the leader's hands, and somebody will be hurt by it.`, meters(6, 0, 5), flag('hoenn-orb-wrong'), flag('hoenn-orb-taken'), flag('hoenn-inside-act4'), beat)),
        ch('Sit with them a while first.', out(`They tell you what the last awakening did, from the stories. ${say('The old man', `Whatever you pick, come back and tell us.`)}`, flag('hoenn-pyre-story'), go('act4-2'))),
        ch('Refuse.', out(`${t.lt} takes it instead, roughly. The old man falls. He's all right; you hear it after.`, meters(-3, 0, 5), flag('hoenn-orb-refused'), flag('hoenn-inside-act4'), beat)),
      ]),
    R('act4-2', 'Mt. Pyre', `The fog's thinner. The orbs are still in their laps.`, [
      ch('Take the orb.', out(`The old woman wraps ${ORB} in her scarf, "so it doesn't get cold."`, meters(6, 0, 5), flag('hoenn-orb-taken'), flag('hoenn-inside-act4'), beat)),
      ch('Take the wrong orb on purpose.', out(`The plan will go wrong in the leader's hands.`, meters(6, 0, 5), flag('hoenn-orb-wrong'), flag('hoenn-orb-taken'), flag('hoenn-inside-act4'), beat)),
      ch('Refuse.', out(`${t.lt} takes it instead, roughly. The old man falls. He's all right; you hear it after.`, meters(-3, 0, 5), flag('hoenn-orb-refused'), flag('hoenn-inside-act4'), beat)),
    ], { cast: ['boss.npc_gentleman', 'boss.npc_lady'], effect: 'fog' }),
    E('confides', 'The Leader Confides', { requires: [...inside(t, { after: 5, standing: 40, lacks: 'confided', ends: ['none'] })], cast: [t.LEADER], effect: 'none' },
      t.id === 'magma'
        ? `His office. Maps. A cold cup of tea. For once, no pointer. ${say('Maxie', `I grew up in Lilycove. A wave took my street when I was nine. I was told it was nobody's fault.`)} ${say('Maxie', `I decided it would be somebody's fault if it happened again. Mine, if I did nothing.`)} ${say('Maxie', `I've checked the working four hundred times. Tell me you've checked it too. Tell me it holds.`)}`
        : `The ship's cabin. A bottle. A photograph turned face down. ${say('Archie', `There was a kid. Lilycove. I couldn't save a Pokémon she loved, because some suit wanted his launch on schedule.`)} ${say('Archie', `I made her a promise the world'd be different. The sea'd be let back in, where people can't wreck it.`)} ${say('Archie', `You're the only one who doesn't just say "aye." So say it straight. Am I right?`)}`, [
        ch(`"You're right."`, out(`He breathes out. You're ${t.id === 'magma' ? 'the Right Hand' : 'the First Mate'}.`, meters(0, 0, 6), mark('confided'), flag('hoenn-leader-reassured'))),
        ch(`"You're wrong, and here's why."`, out(`He listens. He doesn't change the plan. He promotes you anyway: "I need one person who'll say that."`, meters(0, 0, 6), mark('confided'), flag('hoenn-leader-warned')), { requires: [flagIs('hoenn-read-models')] }),
        ch(`"I don't know. Neither do you."`, out(`A long silence. "...No. I suppose I don't." He promotes you. He doesn't sleep that night.`, meters(0, 0, 6), mark('confided'), flag('hoenn-leader-doubt'))),
      ]),
    E('request', `The Bunkmate's Request`, { callback: true, requires: inside(t, { beat: 6 }), cast: [t.GRUNT], pokemon: t.buddyMon, effect: 'none' },
      `The night before the awakening. ${t.buddy} is packing, then unpacking. ${t.id === 'magma' ? say('Ottoway', `If the sea boils, the valley floods first. My valley. Nobody's told me that. I worked it out.`) : say('Marisca', `If the sea rises, our harbour's forty feet down. Dad's boat. The house. Was that always the plan?`)} ${say(t.buddy, `You're ${t.id === 'magma' ? 'the Right Hand' : 'the First Mate'} now. Tell me to stay and I'll stay.`)}`, [
        ch('"Stay."', out(`They do.`, flag('hoenn-bunkmate-stayed'), room(`${P}-final-choice`))),
        ch('"Go home tonight."', out(`They leave the hood on the bunk. They're safe, whatever happens.`, flag('hoenn-bunkmate-left'), room(`${P}-final-choice`))),
        ch('"Stay near me tomorrow, and do what I do."', out(`They nod.`, flag('hoenn-bunkmate-follows'), room(`${P}-final-choice`))),
      ]),
  ];
  // "You're wrong, and here's why" needs the models or Mt. Pyre's story.
  const confides = act4[2] as Json;
  confides.remembers = [{ id: 'pyre', when: [flagIs('hoenn-pyre-story'), flagIs('hoenn-read-models', 0, 0)], notice: `You've Mt. Pyre's story in your head, and you can say why.`, addChoices: [
    ch(`"You're wrong, and here's why."`, out(`He listens. He doesn't change the plan. He promotes you anyway: "I need one person who'll say that."`, meters(0, 0, 6), mark('confided'), flag('hoenn-leader-warned'))),
  ] }];

  // 2.4 The Direct Question (Suspicion 6) and 2.5 Marked (Suspicion 9).
  const tests: Json[] = [
    E('direct-question', 'The Direct Question', { callback: true, requires: inside(t, { suspicion: 6, suspicionBelow: 9, lacks: 'loyalty-test' }), cast: [t.LT], effect: 'none' },
      t.id === 'magma' ? say('Tabitha', `Hoo... I'll ask once. That drill didn't jam by itself. Did it?`) : say('Shelly', `Look at me. The nests got moved before the dig. Who moved them?`), [
        ch('"I did."', out(`A long silence. Then: ${say(t.lt, `...Good. Don't tell me again.`)}`, meters(0, -3), mark('loyalty-test'), flag('hoenn-lt-knows')), { requires: [{ kind: 'evil', team: t.id, trouble: true }] }),
        ch('"I did."', out(`A long silence. ${t.lt} writes it down. You're a step lower in the morning.`, meters(-5, 2), mark('loyalty-test'), flag('hoenn-lt-knows')), { requires: [{ kind: 'evil', team: t.id, trouble: false }] }),
        ch(`"I don't know what you mean."`, out(`Suspicion stays where it is. The lie is recorded.`, mark('loyalty-test'), flag('honest-lied'))),
        ch('"Would you have left them?"', out(`${t.lt} doesn't answer. Their doubts move forward a step.`, mark('loyalty-test'), flag('hoenn-lt-doubt'))),
      ]),
    E('marked', 'Marked', { callback: true, requires: inside(t, { suspicion: 9, lacks: 'found-out' }), cast: [t.LEADER, t.LT], effect: 'glint' },
      t.id === 'magma' ? say('Maxie', `I calculated a use for you. I was wrong. Leave the hood.`) : say('Archie', `The sea's got no room for half-hearts. Off my boat.`), [
        ch('(Leave the uniform.)', out(`You're out. You keep your Pokémon and your money. ${t.name} is hostile from now on, and Hoenn's story goes on from the outside.`, story({ leave: true }), flag('hoenn-left-team'), flag('hoenn-marked'))),
      ]),
    // 2.5: "Hand in the uniform" before Act 4. Leaving satisfies Team Sky's first condition.
    E('hand-in', 'Hand In the Uniform', { requires: [...inside(t, { after: 3, suspicionBelow: 9, ends: ['none'] }), flagIs('hoenn-inside-act4', 0, 0), once(`${P}-hand-in`)], cast: [t.LEADER] },
      `Your locker. The uniform's folded on the shelf. You could hand it in today, before the orbs.`, [
        ch('Hand it in.', out(`${t.id === 'magma' ? say('Maxie', `I calculated a use for you. I was wrong. Leave the hood.`) : say('Archie', `The sea's got no room for half-hearts. Off my boat.`)} You're out. Hoenn's story goes on from the outside.`, story({ leave: true }), flag('hoenn-left-team'), flag(`${P}-hand-in`))),
        ch('Keep it on.', out(`You put it back on.`, flag(`${P}-hand-in`))),
      ]),
  ];
  return [...act1, ...act2, ...act3, ...act4, ...tests];
}

// ---------- Volume III C: six new Operations (one per Hoenn stage from 3, optional; both teams) ----------
function opsFor(t: T): Json[] {
  const op = (id: string, name: string, after: number, intro: string, book: string, quiet: string, o: Json = {}): Json =>
    ev(`${t.p}-op-${id}`, `Operation: ${name}`, 'Evil Teams', { requires: inside(t, { after, ends: ['none'] }), cast: [t.GRUNT], tint: t.tint, ...o }, intro, [
      ch(`By the Book: ${book}`, out(`It's done the team's way.`, meters(3, -1), flag(`hoenn-saw-${t.id}`))),
      quietly(`Quietly: ${quiet}`, 0.25, `The job looks done. The harm isn't.`, [meters(2), ...kind(1), flag(`hoenn-saw-${t.id}`)], `Somebody checks.`),
      ch('Refuse.', out(`You say no.`, meters(-2))),
    ]);
  return [
    op('weather-vane', 'The Weather Vane', 2, `The order: misreport a forecast, so a town doesn't batten down.`, 'misreport it.', 'correct it.', { pokemon: 'castform' }),
    op('dive-bell', 'The Dive Bell', 3, `The order: salvage a wreck off Route 124.`, 'salvage it.', 'mark it as a grave.', { pokemon: 'relicanth' }),
    op('ash-round', 'The Ash Round', 3, `The order: sweep Fallarbor's ash, by the sack, for the team.`, 'sweep it for the team.', 'sweep it for the glassblower.', { pokemon: 'spinda' }),
    op('ferry-dues', 'The Ferry Dues', 4, `The order: collect the dues from Slateport's boats.`, 'collect them.', 'mend one instead.', { pokemon: 'wingull' }),
    op('meteor-shard', 'The Meteor Shard', 4, `The order: carry a shard from Meteor Falls to the base.`, 'carry it.', 'drop it back in the falls.', { pokemon: 'lunatone' }),
    op('recruiting', 'The Recruiting Drive', 5, `The order: sign up Lilycove's bored.`, 'sign them up.', 'tell them the last page.'),
  ];
}

export const EVENTS: Json[] = [
  ...offerFor('magma'), ...offerFor('aqua'),
  ...teamEvents(TEAMS.magma), ...teamEvents(TEAMS.aqua),
  ...opsFor(TEAMS.magma), ...opsFor(TEAMS.aqua),
];
export const REMOVE: string[] = [];
export { TEAMS, type T, type Side };
