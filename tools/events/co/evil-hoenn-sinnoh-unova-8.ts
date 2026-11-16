// Catalog Overhaul Pack, row 9: Hoenn, the Final Choice in the Seafloor Cavern and its four endings (HOENN_TEAMS part 4),
// written once per team. Each ending is a chain pseudo-stage (ps_mg_* / ps_aq_*, written by _evil-hsu-maps.ts). The
// primal weather, the redrawn map and Reputation by town are said, and kept as run flags (`hoenn-weather-*`); Evil Mode
// is on hold (Kice), so "Take it all" ends the team story with flags only.
import { ch, ev, fight, flag, flagIs, out, room, trainer, type Json } from '../dsl.ts';
import { evil as story, rivalTrust } from './_evil-story-kit.ts';
import { TEAMS, say, type T } from './evil-hoenn-sinnoh-unova-7.ts';

export const CATEGORY = 'evil-hoenn-sinnoh-unova';

const CAVERN = '#14202e';
const anyOf = (...keys: string[]): Json => ({ kind: 'anyFlag', keys });
const ps = (b: Json): Json => ({ ...b, pseudo: true });
const MAXIE_TEAM = ['camerupt', 'mightyena', 'crobat', 'weezing', 'torkoal'];
const ARCHIE_TEAM = ['sharpedo', 'mightyena', 'crobat', 'muk', 'walrein'];

function endings(t: T): Json[] {
  const P = t.p;
  const o = TEAMS[t.other];
  const step = (id: string, name: string, intro: string, choices: Json[], x: { cast?: string[]; pokemon?: string; effect?: string } = {}): Json =>
    ev(`${P}-${id}`, name, 'Evil Teams', { room: true, cast: x.cast ?? [t.LEADER], tint: CAVERN, effect: x.effect ?? 'none', ...(x.pokemon ? { pokemon: x.pokemon } : {}) }, intro, choices);
  const on = (text: string, next: string, ...fx: Json[]): Json => out(text, ...fx, room(`${P}-${next}`));
  const LEADER_TEAM = t.id === 'magma' ? MAXIE_TEAM : ARCHIE_TEAM;
  const OTHER_TEAM = t.id === 'magma' ? ARCHIE_TEAM : MAXIE_TEAM;
  const RANK6 = t.id === 'magma' ? 'Right Hand' : 'First Mate';

  const choice = ev(`${P}-final-choice`, 'The Seafloor Cavern', 'Evil Teams', { room: true, cast: [t.LEADER, o.LEADER], tint: CAVERN, effect: 'none' },
    `The Seafloor Cavern, in the stolen submarine. Both teams arrive at once: Magma for Groudon, Aqua for Kyogre. Black water. The sub's lamp finds a wall of ${t.id === 'magma' ? 'red' : 'blue'} stone that is breathing. From the next chamber, a second, slower breath. The leader stands at the edge with the orb. Across the cavern, the other leader, with the other team, has just walked in. ${say('Maxie', `Archie. You're late.`)} ${say('Archie', `Maxie. You're wrong.`)} Your leader holds the orb out, to you. ${say(t.leader, `My hands aren't steady. Yours are. Wake it.`)} Everything stops. ${t.buddy}, ${t.lt}, the squad, the other team: all of them look at you.`,
    [
      ch('Carry out the plan.', on(`You lift the orb. It's warm, and then it's hot. ${say(`${t.leader}, very quietly`, `Thank you.`)} The wall opens its eyes.`, 'plan-wake', flag('hoenn-final-plan'))),
      ch('Turn on the team.', on(`You close your hand over the orb, and step back from the edge. ${say(t.leader, `...What are you doing?`)}`, 'turn-lines', flag('hoenn-final-turn'))),
      ch('Side with the other team.', on(`You walk across the cavern with the orb, and put it in ${o.leader}'s hand. ${say(t.leader, `After everything I told you.`)} ${say(`${o.leader}, astonished`, `...Well. I didn't see that in the tide.`)}`, 'cross-run', flag('hoenn-final-cross')), { requires: [anyOf('hoenn-double-agent', 'hoenn-freed-spy', 'hoenn-counter-heard')] }),
      ch('Take it all.', on(`You take the orb. And don't wake anything. And don't give it back. "Neither of you. Give me the other one." Nobody moves. ${say('Quince, from the back', `...You heard the boss.`)} The squad steps forward. Then grunts in both colours, who've watched their leaders nearly end the world, and are looking for someone who looks sure.`, 'all-battle', flag('hoenn-final-all')), { requires: [{ kind: 'evil', team: t.id, rank: 6 }, anyOf('hoenn-squad-hard', 'hoenn-lt-knows')] }),
    ]);
  (choice as Json).remembers = [{ id: 'same', when: [flagIs('hoenn-same-story')], notice: `The ${t.id === 'magma' ? 'Aqua' : 'Magma'} grunt you asked, in the storeroom, is in the other line. It's the same story, in the other colour.` }];

  // Ending One: Carry out the plan.
  const plan: Json[] = [
    step('plan-wake', 'The Awakening', `${t.legend} wakes in its Primal form and leaves through the cavern roof. Within one node, the region's weather is fixed: ${t.weather}. It stays until the story ends.`, [
      ch('(Surface.)', on(`The region map redraws: ${t.fails}. Towns you've visited are named as they go.`, 'plan-cost', flag(`hoenn-weather-${t.id}`))),
    ], { pokemon: t.primal, effect: t.id === 'magma' ? 'fire' : 'rain' }),
    step('plan-cost', 'The Cost', t.id === 'magma'
      ? `${say('Maxie, watching the sea steam', `The margin of error. I had it at four per cent. ...It was never four per cent.`)} Then the second leader uses the second orb, in desperation. The two meet at Sootopolis.`
      : `${say('Archie, watching Slateport\'s roofs go under', `It was meant to stop at the shoreline. I told it to stop. It's not listening.`)} Then the second leader uses the second orb, in desperation. The two meet at Sootopolis.`, [
      ch('(Climb Sky Pillar.)', on(`With both leaders, both teams, and whoever is left, you climb. Rayquaza descends, and the two go back to sleep.`, 'plan-after')),
    ], { cast: [t.LEADER, o.LEADER], effect: 'rain' }),
    step('plan-after', 'Carry Out the Plan', `Hoenn's Reputation drops to nothing. The team disbands. You keep the rank title as a scar: people in Hoenn use it for the rest of the run.`, [
      ch(`(Answer to "${RANK6}.")`, out(`It sticks.`, story({ end: 'allied' }), flag('hoenn-end-plan'), flag('hoenn-title-scar'))),
    ], { cast: [t.GRUNT] }),
  ];
  (plan[0] as Json).remembers = [{ id: 'wrong', when: [flagIs('hoenn-orb-wrong')], notice: `The orb doesn't control what ${t.leader} woke. It turns on the team first. ${t.lt} is hurt shielding grunts; they recover. The awakening is shorter by one stage, and everyone knows what you did, and that it didn't help.` }];
  (plan[1] as Json).remembers = [{ id: 'warned', when: [flagIs('hoenn-leader-warned')], notice: say(t.leader, `You told me.`) + ` They're the first to climb Sky Pillar.` }];
  (plan[2] as Json).remembers = [{ id: 'stayed', when: [flagIs('hoenn-bunkmate-stayed')], notice: `${t.buddy}'s ${t.place} was among the towns. They don't speak to you again until the very end, where they say one thing: "You could've said no."` }];

  // Ending Two: Turn on the team.
  const allies = `Whoever stands with you fights beside you: ${t.buddy}, if they follow; ${t.lt}, if their doubts have run their course; the squad, if you kept it decent; your rival, if they were your contact, who comes down the sub's hatch at the worst possible moment with a sandwich.`;
  const turn: Json[] = [
    step('turn-lines', 'Turn On the Team', `${t.lt}, if their doubts have run their course: "I'm with them."`, [
      ch(`"Checking your working."`, on(allies, 'turn-battle')),
      ch(`"Keeping my promise to the crew."`, on(allies, 'turn-battle')),
      ch(`"Saying no."`, on(allies, 'turn-battle')),
    ], { cast: [t.LEADER, t.LT] }),
    step('turn-battle', 'The Battle', `You against ${t.leader}, in the cavern.`, [
      ch('Battle, with a partner.', fight(`They're beside you.`, ps(trainer(t.leader, { sprite: t.LEADER, team: LEADER_TEAM, size: 5, lv: 2, format: 'doubles', ally: t.buddyMon, win: [room(`${P}-turn-other`)] }))), { requires: [anyOf('hoenn-bunkmate-follows', 'hoenn-squad-decent', 'hoenn-rival-contact', 'hoenn-lt-knows')] }),
      ch('Battle, alone.', fight(`Nobody stands with you. It's one against ${t.leader} and two Admins in a row.`, ps(trainer(t.leader, { sprite: t.LEADER, team: LEADER_TEAM, size: 6, lv: 2, win: [room(`${P}-turn-other`)] })))),
    ]),
    step('turn-other', 'The Other Orb', `${o.name} still has its orb. ${o.leader} raises it. ${say(`${t.leader}, on the ground`, `Don't. ...Look at me. Look at what it's done to me, and I didn't even use it.`)}`, [
      ch(`(Let ${o.leader} decide.)`, on(`${o.leader} lowers it. You showed their team a kindness once, and they remember it.`, 'turn-pyre'), { requires: [anyOf('hoenn-freed-spy', 'hoenn-same-story')] }),
      ch(`Battle ${o.leader}.`, fight(`${o.leader} doesn't lower it.`, ps(trainer(o.leader, { sprite: o.LEADER, team: OTHER_TEAM, size: 5, lv: 2, win: [room(`${P}-turn-pyre`)] })))),
    ], { cast: [o.LEADER, t.LEADER] }),
    step('turn-pyre', 'The Orbs Go Home', `You carry both orbs back up Mt. Pyre. ${say('The old woman', `You came back and told us. Nobody ever does.`)} Both teams disband into what they become: Maxie teaches geology; Archie runs a sea-rescue crew. ${t.buddy} goes home with a job to do.`, [
      ch('(Sit on the bench a while.)', out(`Two Signs: Groudon's and Kyogre's.`, story({ end: 'defeated' }), flag('hoenn-end-turned'), flag('hoenn-orbs-safe'))),
    ], { cast: ['boss.npc_gentleman', 'boss.npc_lady'], effect: 'fog' }),
  ];

  // Ending Three: Side with the other team.
  const cross: Json[] = [
    step('cross-run', 'The Other Plan', `The other plan runs instead. ${o.legend} wakes. Everything happens, in the other colour. Sootopolis, and Sky Pillar, follow. ${o.name}'s leader doesn't trust a turncoat: your rank is honorary. ${o.id === 'magma' ? 'Right Hand' : 'First Mate'} in name; no squad; no vote.`, [
      ch('(Climb Sky Pillar.)', on(`Rayquaza descends. The two go back to sleep.`, 'cross-after', flag(`hoenn-weather-${o.id}`))),
    ], { cast: [o.LEADER], pokemon: o.primal, effect: 'rain' }),
    step('cross-after', 'Side With the Other Team', `You're a hero to one team and a traitor to the other. ${t.name} hunts you for the rest of Hoenn, led by ${t.lt}. ${say(`${t.buddy}, across a battlefield`, `I'd have followed you anywhere. You went somewhere I couldn't.`)}`, [
      ch('(Keep walking.)', out(`Reputation: nothing on one side of the map, good on the other.`, story({ end: 'exposed' }), flag('hoenn-end-crossed'), flag(`hoenn-hunted-${t.id}`))),
    ], { cast: [t.LT, t.GRUNT] }),
  ];
  (cross[1] as Json).remembers = [{ id: 'double', when: [flagIs('hoenn-double-agent')], notice: `${o.lt}: "You were ours from the day you gave ${t.spy} that water." ${o.name} trusts you fully, and ${t.name}'s ambushes are led by someone who is crying.` }];

  // Ending Four: Take it all.
  const all: Json[] = [
    step('all-battle', 'Two Leaders', `Maxie and Archie, who've hated each other for twenty years, stand side by side against you. ${say('Maxie', `Archie. I find I prefer you.`)} ${say('Archie', `Ha! Don't make it weird.`)} The squad holds off the Admins.`, [
      ch('Battle both.', fight(`A double battle against both leaders.`, ps(trainer('Maxie and Archie', { sprite: t.LEADER, team: ['camerupt', 'sharpedo', 'crobat', 'mightyena', 'torkoal', 'walrein'], size: 6, lv: 2, format: 'doubles', win: [room(`${P}-all-gantry`)] })))),
    ], { cast: [t.LEADER, o.LEADER] }),
    step('all-gantry', 'The Gantry', `You hold both orbs. Both legends stir, and wait. You can feel them: one in each hand, heavy as a held breath. Both teams are yours. Red and blue, in one hall, looking up at the gantry where Maxie stood on day one. You're standing on it now. What is the team for?`, [
      ch('"Put the orbs back. We guard them now."', out(`The merged team becomes a watch on Mt. Pyre and the cavern. The old couple get their first day off in sixty years.`, story({ end: 'allied' }), flag('hoenn-end-took-all'), flag('hoenn-end-guard'), flag('evil-start-hoenn'))),
      ch('"We keep them. Nobody wakes anything unless I say."', out(`You rule Hoenn's weather by threat. Every town pays "weather insurance." Nobody looks you in the eye. Your rival's last battle of the run is fought to take the orbs away.`, story({ end: 'allied' }), flag('hoenn-end-took-all'), flag('hoenn-end-rule'), flag('evil-start-hoenn'), rivalTrust(-2))),
      ch(`"Look up. There's a third one."`, out(`The merged team becomes Team Sky, with every grunt of both teams in it. A hundred recruits instead of three.`, story({ end: 'allied' }), flag('hoenn-end-took-all'), flag('hoenn-end-sky'), flag('sky-founded'), flag('sky-from-all')), { requires: [flagIs('sky-draconid-met')] }),
    ], { cast: [t.GRUNT, o.GRUNT] }),
  ];
  (all[1] as Json).remembers = [
    { id: 'buddy', when: [flagIs('hoenn-bunkmate-follows')], notice: say(t.buddy, `So what do we do? ...Boss.`) },
    { id: 'rival', when: [flagIs('hoenn-rival-contact')], notice: `Your rival, from the door: "I liked you better with the sandwich."` },
    { id: 'norman', when: [flagIs('hoenn-norman-belong')], notice: say('Norman', `Dinner's still on. Come as you are, or not at all.`) },
  ];
  return [choice, ...plan, ...turn, ...cross, ...all];
}

export const EVENTS: Json[] = [...endings(TEAMS.magma), ...endings(TEAMS.aqua)];
export const REMOVE: string[] = [];
