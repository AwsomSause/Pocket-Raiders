// Catalog Overhaul Pack, Evil Teams Volume III: Paldea, the end (TEAM_STAR_PALDEA_FULL_2). The Final Choice in the
// schoolyard, the four endings as chain pseudo-stages (ps_st_plan, ps_st_turn, ps_st_academy, ps_st_own: written by
// _evil-story-sync.ts), the buyers who come whatever's chosen, Team Homeroom (the third option: the gate from outside,
// founding at the science fair, three Lunches and Pyjamas), the box after "By Post", and who ends up where (part G).
// "In Daylight" ends the team story here: Evil Mode is on hold (Kice); its four decisions are flags only.
// No ending ends the run. No child's hurt on screen, in any ending.
import { bondUp, ch, ev, fight, flag, flagIs, heal, inRegion, out, room, trainer, type Json } from '../dsl.ts';
import { evil as story, foe, kind, prompt, STEALTH } from './_evil-story-kit.ts';
import { VOLCANO } from './evil-story-39.ts';

export const CATEGORY = 'evil-story';

const GRUNT = 'trainer.pr/star_grunt_m';
const ODIN = GRUNT;
const GIACOMO = 'boss.giacomo';
const ORTEGA = 'boss.ortega';
const MELA = 'trainer.pr/mela';
const ATTICUS = 'trainer.pr/atticus';
const ERI = 'trainer.pr/eri';
const PENNY = 'trainer.penny';
const CLAVELL = 'trainer.gentleman';
const UPSHAW = 'boss.drive/paldean-sv-janitor';
const YUSUF = 'trainer.pr/school_kid_m';
const MATE = 'boss.drive/paldean-sv-youngster';
const ZEB = 'boss.drive/paldean-sv-worker';
const ARVEN = 'boss.arven-s';
const HARROW = 'boss.drive/paldean-sv-office-worker-man';
const NASCOUR = 'trainer.pr/rich_m';
const FIRSTYEAR = 'boss.drive/paldean-sv-schoolkid-girl';
const NURSE = 'trainer.pr/doctor_f';
const TULLY = 'trainer.roughneck';
const YARD = '#1a1a2a';
const SCHOOL = '#1c2038';
const STAR = '#241830';
const P = inRegion('paldea');
const say = (who: string, line: string): string => `${who}: "${line}"`;
const mark = (m: string): Json => story({ mark: m });
/** A fight inside an ending's own map: a loss walks the player back out, and the run goes on. */
const ps = (b: Json): Json => ({ ...b, pseudo: true });
const step = (id: string, name: string, intro: string, choices: Json[], o: { cast?: string[]; pokemon?: string; tint?: string; effect?: string } = {}): Json =>
  ev(id, name, 'Evil Teams', { room: true, cast: o.cast ?? [CLAVELL], tint: o.tint ?? YARD, effect: o.effect ?? 'none', ...(o.pokemon ? { pokemon: o.pokemon } : {}) }, intro, choices);
const on = (text: string, next: string, ...fx: Json[]): Json => out(text, ...fx, room(next));

// Part G. Who ends up where: said as each ending closes.
const EPILOGUE: Record<'plan' | 'turn' | 'academy' | 'own' | 'homeroom', string> = {
  plan: `Penny is at the gate. She doesn't come in. Giacomo: "I know how it goes now." He finishes the song. Mela: "I've been wanting somebody to make me sit down." Atticus: "I'll need to know where to put them." Ortega: "Torque was awful." Eri: "I'm so tired." Odin: full marks, eighteen months late. Yusuf does his volcano. It works. Mr. Upshaw: nobody asks him. The Director marks seventy-one Fridays himself. Harrow was beaten in the yard. The first-year is still in the stall. Arven: "I made too much." The box is on the Director's desk. The engines: up to three saved.`,
  turn: `Penny is abroad again. Giacomo writes nothing. Mela shouts at a letterbox. Atticus has forty helmets, in a cupboard. Ortega buys nothing. Still. Eri: "Somebody who stayed after." Odin posts it anyway. Yusuf does his volcano at home. Mr. Upshaw: still nobody asks. Until you do. The Director signs forty, with the last man's stationery. Harrow is "Head of Admissions," with receptive applicants. Tully recruits. The first-year gets a brochure. Arven makes forty; there's nowhere to take them. The box is in a cupboard, still. The engines are taken.`,
  academy: `Penny is in the yard. Hood down. Report no. 40's read aloud. She wrote it. Giacomo teaches double maths. In four-four. What Mela shouted is on the record. It was a receipt. Atticus makes the club's kit. Ortega has a permit for a truck. Eri stands at the front. Somebody stands next to her. Odin is back in class. In the helmet. Nobody says a word. Yusuf wins the fair. Star's in the front row, loud. Mr. Upshaw: two hours. And a box. The Director read it himself. In pencil. Harrow: "You wrote most of it." Tully gives a statement. Nobody made him. The first-year sits in 1-G. Arven is the club's cook, and denies it. The box is evidence. The engines are parked, with a permit.`,
  own: `Penny is your Executive. On the phone, mostly. Giacomo: Music and Sums. Mela: Fire. Atticus makes a forty-second. With a star. Ortega: Engines. Eri: the Front. Odin: your first Lead, and head boy. Yusuf: the Workshop's youngest. Never sent on a job. Mr. Upshaw: the Listening Post. The Director is nominally in charge. Harrow was beaten. Reasonably. Tully: not let in, not turned away. The first-year has a helmet two sizes too big. Arven: the Mess. He denies it. The box is in the base, on a shelf, labelled. The engines were asked. They rev.`,
  homeroom: `Penny is on a bonnet with five friends who always knew. Giacomo sat down in the canteen and took the helmet off. Mela: "It's a science fair." Atticus: forty hats at a party. Ortega lends the shed. Eri had her lunch. Odin walked in. Twice. Yusuf: a dressing gown. A volcano. Mr. Upshaw: "Is somebody going to ask me, then?" The Director stops counting. Harrow was beaten, alone. The first-year: "We thought we'd stand." Arven denies it. The box was fetched. The engines are in a yard with two hundred children round them.`,
};

// ---------- A. The Final Choice (the Academy's yard, Sunday night) ----------
const FINAL = ev('st-final-choice', 'The Final Choice', 'Evil Teams', { room: true, cast: [CLAVELL, MELA, GIACOMO], tint: YARD, effect: 'glint' },
  `The Academy's yard. Sunday night. Five trucks, in a row, engines idling. Forty helmets. The clock over the door. On five bonnets: Giacomo, Mela, Atticus, Ortega, Eri. In rows: forty, in helmets. Odin, eleventh. A gap, where a thirteen-year-old with a volcano was. At the gate: the Director. No wig. A folder. At the back, hood up: Penny. A laptop, shut. In the doorway, with a mop: Mr. Upshaw. In the dorm windows: faces. A great many. In pyjamas. On the road outside: a van with no plates. ${say('The Director', `I'm required to read this. It's dated Monday. I've read it to myself eleven times and I don't believe a word of it.`)} He holds up the notice. He doesn't read it. ${say('The Director', `I've a folder. It was empty. It's got one sheet in it now, and that sheet says you're the aggressors, and it's signed by a man who isn't here. I can't find anybody who was.`)} ${say('Mela, from the truck', `We were.`)} ${say('The Director', `Yes. I know. I believe you. I'm not allowed to believe you. I need it on paper.`)} At the back, a laptop opens. Shuts. ${say('Giacomo', `Rule five. Nobody's talked out of it. We're here. We're loud. Somebody beat us or somebody look.`)} Everybody turns to the squad of one. Fulu's the only one who's been on both sides of the gate.`,
  [
    ch(`Step into the yard. "By your rules, then. All five."`, on(`You step into the yard.`, 'st-plan-giacomo', flag('star-final-plan'))),
    ch('Walk to the gate. Hand the Director a map.', on(`You cross the yard. To the gate.`, 'st-turn-warn')),
    ch(`Walk to the doorway. "Mr. Upshaw. Would you tell him?"`, on(`You walk to the doorway.`, 'st-academy-mop', flag('star-final-academy')), { requires: [flagIs('upshaw-seen')] }),
    ch(`Climb onto a sixth bonnet: your own.`, on(`"You don't want it ended."`, 'st-own-bonnet', flag('star-final-own')), { requires: [{ kind: 'evil', rank: 5, has: 'confided' }] }),
  ]);
(FINAL as Json).remembers = [
  { id: 'penny', when: [flagIs('star-told-penny')], notice: `Penny's not at the back. She's on a bonnet, with the five. Hood down.` },
  { id: 'wants', when: [flagIs('star-told-wants')], notice: `The five know she wants it ended. They've not decided whether they do.` },
  { id: 'odin', when: [flagIs('odin-walked-in')], notice: `Odin's been in the building once. His legs know they can.` },
];

// The five bosses, one after another, in the yard, under the clock. Each Starmobile's the last of the team.
type Boss = { id: string; name: string; sprite: string; team: string[]; lv: number; going: string };
const FIVE: Boss[] = [
  { id: 'giacomo', name: 'Giacomo', sprite: GIACOMO, team: ['murkrow', 'pawniard', 'kingambit', 'revavroom'], lv: 0, going: `Segin Squad! Drop the beat!` },
  { id: 'mela', name: 'Mela', sprite: MELA, team: ['torkoal', 'houndoom', 'armarouge', 'revavroom'], lv: 1, going: `I was the one who shouted. So I go second. I'm not hiding behind anybody.` },
  { id: 'atticus', name: 'Atticus', sprite: ATTICUS, team: ['skuntank', 'muk', 'toxtricity', 'revavroom'], lv: 1, going: `Forty helmets. By hand. Don't scratch them.` },
  { id: 'ortega', name: 'Ortega', sprite: ORTEGA, team: ['azumarill', 'dachsbun', 'wigglytuff', 'revavroom'], lv: 1, going: `I could've bought this right! I never did! Remember that!` },
  { id: 'eri', name: 'Eri', sprite: ERI, team: ['toxicroak', 'passimian', 'lucario', 'annihilape', 'revavroom'], lv: 2, going: `I'm the big one. I stand at the front. Come on, then.` },
];
const BEATEN: Record<string, string> = {
  giacomo: `...That's the last verse, then. I know how it goes now.`,
  mela: `Good. Good. I've been wanting somebody to make me sit down for a year and a half.`,
  atticus: `I'll need to know where to put them.`,
  ortega: `Torque was awful.`,
  eri: `...I'm tired. Can I say that now? I'm so tired.`,
};
const bossFight = (b: Boss, next: string, text: string): Json =>
  fight(text, ps(trainer(b.name, { sprite: b.sprite, team: b.team, size: b.team.length, lv: b.lv, win: [heal(0.5), room(next)] })));

// ---------- B. Ending 1: "By Their Own Rules" (Carry it out; ps_st_plan) ----------
const ARVEN_REST = `Between each, a rest. Arven, at the wall, with foil parcels: ${say('Arven', `I'm not with them. I made too much.`)}`;
const plan: Json[] = FIVE.map((b, i) => {
  const next = i < 4 ? `st-plan-${FIVE[i + 1]!.id}` : 'st-plan-rule4';
  const before = i === 0 ? `One after another. In the yard. Under the clock. Each boss fights from the bonnet; each Starmobile's the last of the team.` : `${say(FIVE[i - 1]!.name + ', beaten', BEATEN[FIVE[i - 1]!.id]!)}${FIVE[i - 1]!.id === 'ortega' ? ` He's crying. He's fourteen-and-a-half.` : ''} ${ARVEN_REST}`;
  return step(`st-plan-${b.id}`, `Phase 1: ${b.name}`, `${before} ${say(b.name, b.going)}`, [ch(`Battle ${b.name}.`, bossFight(b, next, `${b.name}'s Starmobile idles behind.`))], { cast: [b.sprite], tint: YARD });
});
const PLAN_END = (lead: string): Json => out(`${lead} The bases come down. Tents, folded. A banner, rolled. Odin's homework's marked. At last. The Director does it himself, over a week, with Mr. Upshaw's box on his desk. Full marks. Eighteen months late. There's a comment: "See me. Not for a telling-off. — C." Paldea's quiet. The hills have no banners. The forty go back to class, in ones and twos, over a month. Not as a team. As forty first-years, a year and a half late. ${EPILOGUE.plan}`,
  story({ beat: true }), story({ end: 'allied' }), flag('star-ending-plan'), flag('star-dissolved'), flag('engines-saved', 3), flag('paldea-quiet'));
const planBranch = (when: Json[], lead: string): Json => { const o = PLAN_END(lead); return { when, text: o.text, effects: o.effects }; };
plan.push(
  step('st-plan-rule4', 'Phase 2: Rule Four', `${say('Eri, beaten', BEATEN.eri!)} Five bosses. Beaten. By the Code, each steps down. They take off their helmets. One at a time. Atticus last. ${say('Giacomo', `That's it. That's the rule. We're done.`)} Forty kids, in rows. Nobody's told them what to do next. There's never been a next. ${say('Odin', `...Do we go in?`)} ${say('The Director, at the gate, with a notice he\'s not read', `If you'd like to. It's your school.`)} ${say('Odin', `Is it?`)} They go home. Not in. Home. They aren't happy. They're done. It's forty children walking out of a yard in the dark, carrying helmets. At the gate: a girl in a hood. She watches every one of them go past. She doesn't come in. ${say('Penny, to you, very low', `I got what I planned. They're safe. They've stopped.`)} A pause. ${say('Penny', `I didn't plan for what it'd look like.`)}`,
    [ch('Turn round.', on(`The engines are in the yard. Unattended.`, 'st-plan-buyers'))], { cast: [PENNY, GIACOMO, ODIN] }),
  step('st-plan-buyers', 'Phase 3: The Buyers', `The engines are in the yard. Unattended. A van's waiting for exactly this. ${say('Nascour, stepping through the gate, unhurried', `Thank you. You've done what I couldn't: you've parted them from their engines, by their own consent. I'd offered to buy. This is cleaner.`)} Harrow first. Nascour doesn't fight. He doesn't need to.`,
    [ch('Hold the yard.', fight(`You hold the yard alone. Five trucks; one of you.`, ps(trainer('Harrow', { sprite: HARROW, team: ['oranguru', 'farigiraf', 'kingambit'], size: 3, lv: 2, win: [room('st-plan-engines')] }))))], { cast: [HARROW, NASCOUR] }),
  step('st-plan-engines', 'Phase 3: The Engines', `Up to three Starmobiles: yours to save, in the time there is. The rest: whoever comes back.`,
    [ch('Save what you can.', PLAN_END(`You get three. Captain Zeb, fourteen, comes over the wall with a spanner; he never went home, because he lives in the garage.`), {
      branches: [
        planBranch([flagIs('mela-thanked'), flagIs('eri-asked')], `You get three. Mela's first over the wall. Eri's second.`),
        planBranch([flagIs('mela-thanked')], `You get three. Mela's first over the wall.`),
        planBranch([flagIs('eri-asked')], `You get three. Eri comes back over the wall.`),
      ],
    })], { cast: [ZEB], pokemon: 'revavroom' }),
);
(plan[plan.length - 2] as Json).remembers = [
  { id: 'boots', when: [flagIs('star-boots')], notice: `Thirty pairs of the wrong boots, at the gate. You can tell them at a glance: there's a Q inside every heel. Nothing in a Star helmet can surprise you tonight.` },
  { id: 'file', when: [{ kind: 'anyFlag', keys: ['unova-sealed', 'spikemuth-bought', 'potown-empty'] }], notice: say('Harrow, to you, pleasantly', `I've read your file. You understand institutions. We should talk.`) },
];
(plan[plan.length - 1] as Json).remembers = [{ id: 'asked', when: [flagIs('star-engine-asked')], notice: `Ortega's Revavroom won't be linked against her will. The Cassiopeia Engine's a ring of four, at most.` }];
(plan[5] as Json).remembers = [{ id: 'rang', when: [flagIs('penny-rang')], notice: `Mela's the first to reach her. At the gate. She doesn't make her come in.` }];

// ---------- C. Ending 2: "By Post" (Turn on the team; ps_st_turn). Warned, and confirmed twice. ----------
const WARNING = `Forty children will be expelled, by post. It's the ending the man who deleted the reports would've wanted. The file stays empty.`;
const turn: Json[] = [
  step('st-turn-warn', 'By Post', WARNING, [
    ch('Go on.', on(`You read it again.`, 'st-turn-warn-2')),
    ch('Go back.', on(`You put the map back in your pocket.`, 'st-final-choice')),
  ]),
  step('st-turn-warn-2', 'By Post', `${WARNING} Are you sure?`, [
    ch(`I'm sure.`, on(`A folded map: five hills, five crosses.`, 'st-turn-map', flag('star-final-turn'))),
    ch('Go back.', on(`You put the map back in your pocket.`, 'st-final-choice')),
  ]),
  step('st-turn-map', 'Phase 1: The Map', `You cross the yard. To the gate. A folded map: five hills, five crosses. ${say('The Director', `What's this.`)} "Where they are." ${say('The Director', `I didn't ask for—`)} He looks at it. ${say('The Director', `With this, the notices can be served. That's what's been stopping it; there was no address.`)} He looks at you. ${say('The Director', `You were in there. Six weeks. They gave you a helmet.`)} From the trucks: ${say('Mela', `...Fulu?`)}`,
    [ch('Turn round.', on(`She's the one who comes down.`, 'st-turn-eri'))]),
  step('st-turn-eri', 'Phase 2: Eri', `She's the one who comes down. She stands at the front. That's what she's for. ${say('Eri', `Somebody took our stuff. For a year. Rule one. And you've just handed him the only thing we had that was ours. Where we are.`)}`,
    [ch('Battle her.', fight(`She's frightened. She's always frightened. She's very good.`, ps(trainer('Eri', { sprite: ERI, team: ['toxicroak', 'passimian', 'lucario', 'annihilape', 'revavroom'], size: 5, lv: 2, win: [room('st-turn-post')] }))))], { cast: [ERI] }),
  step('st-turn-post', 'Phase 3: By Post', `${say('Eri, beaten', `...I thought you were somebody who stayed after.`)} A letterbox. Forty of them. A white envelope through each. "The Academy regrets to inform you that, following the incident of [DATE] and continued non-attendance—" It's a form letter. It's the one Harrow drafted, eighteen months ago, and left in a drawer. The Director signs them. He has to. There's a record; there's an address; there's no evidence on the other side. He signs forty, and then he sits with the pen in his hand for a long time. ${say('The Director', `I came here to find out what happened. I've just finished what the last man started. With his stationery.`)}`,
    [ch('Go to the gate.', on(`The bases are known.`, 'st-turn-buyers'))]),
  step('st-turn-buyers', 'Phase 4: The Buyers', `The bases are known. The engines are in them. The children have been sent home. ${say('Nascour, at the Director\'s shoulder, with a brochure', `A full scholarship. For each. My organisation prizes exactly the initiative your school's just punished. I believe I'll find them receptive.`)} Some are. One in three. The game doesn't say which.`,
    [ch('(Say nothing.)', out(`The forty are out for good. The file stays empty. Odin keeps doing the work. He posts it anyway, under a door he's not allowed through. Your Pokémon are each a step less sure of you, for now; it recovers. You've a Spare Helmet: "For whoever's next. — A." It was yours. Atticus doesn't ask for it back. The Cassiopeia Engine's in the Region of Doom, whole. It was built from all five. ${EPILOGUE.turn}`,
      bondUp(-1, 'party'), story({ beat: true }), story({ end: 'defeated' }), flag('star-ending-turn'), flag('star-expelled'), flag('spare-helmet')))], { cast: [NASCOUR, CLAVELL] }),
];
// One way back: the box. At any Town node in Paldea, after.
const RESCIND = ev('st-box-rescind', 'The Box', 'Evil Teams', { requires: [P, flagIs('star-ending-turn'), flagIs('star-rescinded', 0, 0)], cast: [UPSHAW, CLAVELL], tint: SCHOOL },
  `A janitor's cupboard. Mr. Upshaw still has the box. He still hasn't been asked.`,
  [ch('Ask him.', out(`${say('Mr. Upshaw', `Eighteen months. I thought somebody'd come. I'd it all in order.`)} He lifts the box. ${say('Mr. Upshaw', `It's schoolwork. It's got their names on. Top right. Every sheet, every Friday. That's attendance. They never missed a week.`)} ${say('The Director, with the box, reading the dates', `They weren't absent. They were outside.`)} He rescinds forty letters. By hand. He takes each one himself.`, ...kind(2), flag('star-rescinded'), flag('upshaw-asked')))]);
(RESCIND as Json).remembers = [{ id: 'door', when: [flagIs('star-door')], notice: say('The Director', `They're on my staff's mark sheets. You can't expel someone you gave a seven.`) }];

// ---------- D. Ending 3: "Read in the Yard" (Side with the Academy, and its new Director; ps_st_academy) ----------
/** Mr. Upshaw talks, for two hours. Pyjamas (Team Homeroom) plays it too. */
const TWO_HOURS = `He talks. It's the longest speech there is, and it isn't shortened. You may sit. ${say('Mr. Upshaw', `I do the east corridor at eight. So I saw the bags. Every morning, a bag in the bin by 1-G. Different bag. I'd fish it out and put it on the peg.`)} ${say('Mr. Upshaw', `I do the canteen at one. So I saw who wasn't in it. There's a lad ate in the boiler room for a term. I left the light on for him.`)} ${say('Mr. Upshaw', `I do the hall on Fridays, late. So I was outside Mr. Harrow's door, the night. The light was on. I looked in, to say I'd lock up. He'd the reports up. I know the form; it's green. He was going down them. Click. Click. Nineteen minutes. I counted, 'cause the buffer's on a timer.`)} ${say('Mr. Upshaw', `And I was in the yard. The day. Emptying the bins. Forty of 'em, in rows. They never touched those three. The little one with the big boots said one thing.`)} ${say('The Director', `What did she say?`)} He looks at Mela. She nods. ${say('Mr. Upshaw', `She said: 'We told the school. We're telling you. That's everybody told.'`)} Silence. ${say('Mr. Upshaw', `That's all it was. It wasn't a threat. It was a receipt.`)} And then he fetches the box. ${say('Mr. Upshaw', `Seventy-one Fridays. Under the staffroom door. I'd nowhere to send it. It's got names on.`)}`;
const academy: Json[] = [
  step('st-academy-mop', 'Phase 1: The Mop', `"Mr. Upshaw. Would you tell him?" The yard's silent. Forty helmets turn. ${say('Mr. Upshaw', `...Tell him what.`)} "What you saw." ${say('Mr. Upshaw', `Nobody's asked.`)} ${say('The Director, from the gate', `I'm asking. I didn't know there was anyone to ask. I'm so sorry. I've walked past you every morning for a year. I said 'good morning.' I never said 'were you here.'`)} He leans the mop on the wall. Carefully. It's a good mop.`,
    [ch('Sit down.', on(`He talks.`, 'st-academy-hours'))], { cast: [UPSHAW, CLAVELL] }),
  step('st-academy-hours', 'Phase 2: Two Hours', TWO_HOURS, [ch('Listen.', on(`The Director takes the box.`, 'st-academy-apology'))], { cast: [UPSHAW, CLAVELL, MELA] }),
  step('st-academy-apology', 'Phase 3: The Apology', `${say('The Director', `That's a record. A witness, and seventy-one weeks of dated work. I can act on that.`)} He tears the notice in half. He doesn't make a show of it. He reads it himself, to the yard. He's written it on the back of the notice, in pencil, just now: "On behalf of this Academy. You told us forty-one times. We deleted it. You warned us what you'd do. We deleted that. You did it, and harmed nobody, and we wrote you down as the ones at fault. Every part of that was ours. None of it was yours. You're reinstated. All of you. As of eighteen months ago." He looks up. ${say('The Director', `And you may keep the helmets. I'd not ask you to pretend it didn't happen.`)} ${say('Odin', `...As us?`)} ${say('The Director', `As you.`)}`,
    [ch('The gate.', on(`They come anyway.`, 'st-academy-buyers'))], { cast: [CLAVELL, ODIN] }),
  step('st-academy-buyers', 'Phase 4: The Buyers', `They come anyway. The engines are in the yard. But the yard's not empty. ${say('Nascour', `A touching scene. I'd hoped to arrive after it.`)} ${say('The Director, taking off his cardigan', `You're on school grounds without a visitor's badge. Sup.`)} The five bosses hold the trucks. They fight beside you. ${say('Harrow, to the Director, reasonably', `You'll understand, as a head. One protects the reputation.`)} ${say('The Director', `I've just read out the school's reputation in a yard. It was two paragraphs. You wrote most of it.`)}`,
    [ch('Battle beside the Director.', fight(`You and the Director, side by side. It's won. Team Star's a school club. It's got a room: the old 1-G. It's got a budget. It's got a truck in the car park, with a permit. The five bases stay up as field classrooms. Giacomo's maths is on the timetable; he teaches it, to the Academy's first-years, in four-four. Mr. Upshaw is asked. For two hours. And then for his opinion on the new anti-bullying form, which he gives: "Make it paper. So there's a copy." The forty-one are restored from Penny's copies and the server's originals. They're read. Each one's answered. In writing. Eighteen months late. ${EPILOGUE.academy}`, ps(trainer(`Harrow, and Nascour's lead`, { sprite: HARROW, format: 'doubles', ally: 'oranguru', team: ['farigiraf', 'kingambit', 'gardevoir', 'metagross'], size: 4, lv: 2, win: [] })),
      ...kind(2), story({ beat: true }), story({ end: 'exposed' }), flag('star-ending-academy'), flag('star-reinstated'), flag('upshaw-asked'), flag('star-club')))], { cast: [CLAVELL, HARROW, NASCOUR] }),
];
(academy[2] as Json).remembers = [{ id: 'seventh', when: [flagIs('star-seventh')], notice: `Penny's hood comes down. Atticus hands her a helmet. It's the forty-second. It's got Achird on.` }];
(academy[3] as Json).remembers = [{ id: 'boots', when: [flagIs('star-boots')], notice: `Thirty pairs of the wrong boots, at the gate. You can tell them at a glance: there's a Q inside every heel. Nothing in a Star helmet can surprise you tonight.` }];

// ---------- E. Ending 4: "In Daylight" (Take it all; ps_st_own). Evil Mode on hold: the four decisions are flags. ----------
const OWN_END = (lead: string, ...fx: Json[]): Json => out(`${lead} Team Star's yours: the smallest team in the game, and the one that'd follow anywhere. Funds: Ortega's allowance and a sandwich fund. Heat: almost none; they're children, and nobody raids a school. Loyalty: the highest there is. They don't follow orders. They follow whoever stayed after. Five bases; one room in a school; a car park. And the flaw: they're kids. There's homework. There's a bedtime. It's the oddest team there's ever been: one that can't lie, won't steal, and has to be back by nine. ${EPILOGUE.own}`,
  story({ beat: true }), story({ end: 'allied' }), flag('star-ending-own'), flag('evil-start-paldea'), ...fx);
const own: Json[] = [
  step('st-own-bonnet', 'Phase 1: A Sixth Bonnet', `"You don't want it ended." To the back of the yard. To a hood. "You want it kept. You just can't be the one who keeps it. Give it to me. I'll be the one in the building." ${say('Penny', `...You'd be Big Boss? In daylight?`)} ${say('Giacomo', `Hang on. Rule four. Nobody's Big Boss unless they've—`)} "Then I'll earn it. By your rules. All five. And her."`,
    [ch('Step down off the bonnet.', on(`The five. But they're not fighting to lose. They're fighting to see.`, 'st-own-giacomo'))], { cast: [PENNY, GIACOMO] }),
  ...FIVE.map((b, i) => step(`st-own-${b.id}`, `Phase 2: ${b.name}`, b.id === 'mela' ? say('Mela', `If you're going to stand in front of us, I want to know you can.`) : say(b.name, b.going),
    [ch(`Battle ${b.name}.`, bossFight(b, i < 4 ? `st-own-${FIVE[i + 1]!.id}` : 'st-own-penny', `They're not fighting to lose. They're fighting to see.`))], { cast: [b.sprite] })),
  step('st-own-penny', 'Phase 2: Penny', `And then the sixth. Penny, coming forward. Hood down. No voice changer. A laptop under one arm, and she puts it on the ground: ${say('Penny', `I'm not good at this part. I wrote a speech. It was eleven pages. Giacomo said cut it to one line. So: we were here first, and you looked away.`)} ${say('Penny', `I'm going to battle you now. I've planned for you to be better than me.`)}`,
    [ch('Battle Penny.', fight(`Her Sylveon's last.`, ps(trainer('Penny', { sprite: PENNY, team: ['umbreon', 'vaporeon', 'jolteon', 'flareon', 'leafeon', 'sylveon'], size: 6, lv: 2, win: [room('st-own-nascour')] }))))], { cast: [PENNY], pokemon: 'sylveon' }),
  step('st-own-nascour', 'Phase 3: The Buyers', `${say('Penny, beaten', `Okay. Yeah. Okay.`)} She's smiling at the ground. ${say('Penny', `I've wanted to give this to someone since the ferry.`)} ${say('Nascour, at the gate', `A change of management. I've a standing offer. It transfers.`)} "They're not for sale." ${say('Nascour', `The last one who told me that was fourteen and shouting. I'd hoped you'd have a different answer.`)} Forty kids. Five bosses. One Director, in a cardigan, who's just worked out which side of the gate he's on: they stand behind you. It's the one battle in the nine regions where he fights himself.`,
    [ch('Battle Nascour.', fight(`He doesn't hurry.`, ps(trainer('Nascour', { sprite: NASCOUR, team: ['gardevoir', 'xatu', 'dusclops', 'walrein', 'blaziken', 'metagross'], size: 6, lv: 2, win: [room('st-own-rule5')] }))))], { cast: [NASCOUR] }),
  step('st-own-rule5', 'Phase 4: The First Hour', `${say('Nascour, beaten, unhurried', `I'm not angry. I said that. I find I'm something. I'll have to look up the word.`)} A yard. Forty kids. Five trucks. A school with its doors open. Four decisions. The first: rule five.`, [
    ch('Keep it.', on(`Nobody gets talked out of it.`, 'st-own-helmets', flag('star-rule5-kept'))),
    ch('Strike it.', on(`It comes off the permission slip. Penny watches it go.`, 'st-own-helmets', flag('star-rule5-struck'))),
    ch(`Rewrite it: "Nobody gets talked out of it. Anybody can be asked."`, on(`No member can be ordered. Every Operation's put to a vote of the squad that'd do it. It's slow. It's never once betrayed.`, 'st-own-helmets', flag('star-rule5-asked'))),
  ], { cast: [PENNY] }),
  step('st-own-helmets', 'Phase 4: The First Hour', `The second: the helmets.`, [
    ch('On.', on(`On.`, 'st-own-engines', flag('star-helmets-on'))),
    ch('Off.', on(`Off.`, 'st-own-engines', flag('star-helmets-off'))),
    ch('Whoever wants.', on(`Each one's got a "legs" meter now: how near the building they can get. The team's judged on whether it goes up.`, 'st-own-engines', flag('star-helmets-whoever'))),
  ], { cast: [ATTICUS] }),
  step('st-own-engines', 'Phase 4: The First Hour', `The third: the engines.`, [
    ch('Keep them linked.', on(`The ring holds.`, 'st-own-building', flag('star-engines-linked'))),
    ch('Unlink them. Ask the five Revavroom if they want to keep going.', on(`They rev. Five Revavroom that chose it.`, 'st-own-building', flag('star-engines-asked'))),
    ch('Sell one.', on(`Funds for a long time. Ortega never speaks to you again.`, 'st-own-building', flag('star-engines-sold'))),
  ], { cast: [ORTEGA, ZEB], pokemon: 'revavroom' }),
  step('st-own-building', 'Phase 4: The First Hour', `The fourth: the building.`, [
    ch('Stay out.', on(`The hills.`, 'st-own-star', flag('star-building-out'))),
    ch('Go back in.', on(`The old 1-G.`, 'st-own-star', flag('star-building-in'))),
    ch('Both: a school with tents, and tents with a school.', on(`The only headquarters there is with a bell, a timetable, and a Director who's nominally in charge of it.`, 'st-own-star', flag('star-building-both'))),
  ], { cast: [CLAVELL] }),
  step('st-own-star', 'Phase 4: The First Hour', `${say('Atticus, with a tape measure', `I'll need your head again. The forty-first was a spare. A Big Boss's wants a star on.`)}`, [
    ch('"Same as theirs."', OWN_END(`He nods. He's pleased. He'd have made it the same anyway.`)),
    ch('"No star."', OWN_END(`He nods, and puts the tape measure away.`)),
    ch('"You choose."', OWN_END(`He looks at you a long time. He doesn't say what he's chosen.`)),
  ], { cast: [ATTICUS] }),
];
(own[6] as Json).remembers = [{ id: 'seventh', when: [flagIs('star-seventh')], notice: `Penny's hood's down. Atticus hands her a helmet. It's the forty-second. It's got Achird on.` }, { id: 'rang', when: [flagIs('penny-rang')], notice: `Mela's the first to reach her.` }];
(own[7] as Json).remembers = [{ id: 'boots', when: [flagIs('star-boots')], notice: `Thirty pairs of the wrong boots, at the gate. You can tell them at a glance: there's a Q inside every heel. Nothing in a Star helmet can surprise you tonight.` }];

// ---------- F. Team Homeroom: refused the helmet, refused the Academy, and sent Yusuf to his volcano ----------
const outside = (o: Json = {}): Json[] => [{ kind: 'evil', team: 'star', inside: false, ends: ['none'], ...o }, P];
const HR = { tint: SCHOOL, effect: 'none' };
const homeroom: Json[] = [
  // From outside Star, the gate's reached as its own event: the player's the "challenger", and the casserole arrives behind them.
  ev('st-gate-outside', 'The Thing with the Beans', 'Evil Teams', { requires: [...outside({ after: 3 }), flagIs('star-offer-refused'), flagIs('star-volcano', 0, 0)], cast: [YUSUF, MATE], tint: STAR },
    `Schedar base. A truck on a rise. A gate. You're the "challenger." On the gate: a boy of thirteen, with a helmet under his arm and a shoebox under the other. "Who goes— um. Who goes there?" Then, up the path behind you: a boy in Academy uniform, by himself, carrying a casserole dish with a tea towel over it. "I'm not here to fight. Yusuf, your mum's asking. She's made the thing with the beans." He holds it out. It's still warm. He's walked it up a hill. Yusuf's looking at his shoes. "And Mr. Jacq says the science fair's Thursday and there's still a table with your name on. He's not taken the card off."`,
    [
      ch('"Yusuf. What do you want?"', out(VOLCANO, ...kind(1), flag('star-volcano'), flag('star-yusuf-home'))),
      ch('Battle the gate.', fight(`"Who goes there." A battle. You go through. Behind you, the schoolmate puts the dish down on the path and goes.`, foe('grunt', 'Yusuf Lightfoot', 2, { lv: -1 }))),
    ]),
  // F1. Founding (stage 5): the Academy's science fair, in the hall
  ev('hr-founding', 'Team Homeroom', 'Evil Teams', { callback: true, requires: [...outside({ after: 3 }), flagIs('star-offer-refused'), flagIs('star-clive-friend', 0, 0), flagIs('star-volcano')], cast: [YUSUF, FIRSTYEAR, MELA], tint: SCHOOL },
    `The Academy's science fair, in the hall. Trestle tables. Card. A table at the end with a name on it, and a volcano, and a village with little flags. ${say('Yusuf Lightfoot', `You came! It erupts at half past. I've done it nine times in the sink.`)} Round his table: four kids who aren't looking at the volcano. A first-year who eats in a toilet stall. A girl with her bag held in front of her like a shield. Two more. ${say('Yusuf', `These are— I don't know all their names. They just come and stand at my table. I think 'cause I was in Star. They think I know how.`)} ${say('Yusuf', `There's more of us. Who it's happening to now. Not like before; not three big ones. Just— nobody sits. Star's out there. We're still in here.`)} ${say('The first-year', `I got a flyer. 'You can sit with us.' I can't. It's on a hill. I've got double maths.`)} At half past, it erupts. It's a very good volcano. From the back of the hall: a noise like a football crowd. ${say('Mela, on a chair, in boots', `GO ON, YUSUF!`)} Five bosses. In the hall. In the building. They said they'd come and watch. Loudly. ${say('Mela, to the room, defiant, terrified', `What? It's a science fair. It's open to the public.`)} The creed, on the back of Yusuf's display card, in felt tip: SOMEBODY SITS WITH YOU AT LUNCH.`,
    [
      ch('Pull up a chair.', out(`Team Homeroom: Yusuf, who's been out and come back; he's the only one who knows both doors. The first-year, who knows every place in the building a person can eat alone. There are eleven. It's got no trucks. It's got a table.`, mark('third'), flag('homeroom-founded'))),
      ch('"Who else?"', out(`The schoolmate with the casserole: he walks things up hills. Mr. Jacq: a table; he never took the card off. Mr. Upshaw: keys, a box, the light in the boiler room. Arven: "I'm not with you. I've made too much." Miriam, the nurse: her office has been where they go. She's kept a list. It isn't of injuries. It's of who comes in at lunch with "a headache." And "Clive": "Sup. I should like to 'join.' As a fellow student." They let him. Nobody has the heart.`, mark('third'), flag('homeroom-founded'))),
    ]),
  // F3. Lunch 1: Eleven Places (stage 6; a door of three nodes, ps_hr_lunch1)
  ev('hr-lunch-1', 'Lunch 1: Eleven Places', 'Evil Teams', { requires: [...outside({ after: 4, has: 'third' })], cast: [FIRSTYEAR], ...HR },
    `Homeroom's got no trucks. It's got a table. Each Lunch is one lunch hour, in the canteen, in daylight. The game: get somebody to it. The first-year's map. Eleven places a person eats alone. You go round them.`,
    [ch('A toilet stall.', on(`A second-year. Crisps, quietly.`, 'hr-l1-stall'))]),
  ev('hr-l1-stall', 'A Toilet Stall', 'Evil Teams', { room: true, cast: [], ...HR },
    `A toilet stall. A second-year. Crisps, quietly.`,
    [ch('Sit down outside. Wait.', on(`A sandwich comes under the door. Then the door.`, 'hr-l1-boiler'))]),
  ev('hr-l1-boiler', 'The Boiler Room', 'Evil Teams', { room: true, cast: [], ...HR },
    `The boiler room. A lad. The light's on. Then the library's far end: a girl, with a book held up.`,
    [ch(`"Mr. Upshaw leaves that on for you."`, on(`"...He knows?" "He's always known." And the girl with the book: you ask what it is. She'll tell you. For twenty minutes. She walks to the canteen still telling.`, 'hr-l1-nurse'))]),
  ev('hr-l1-nurse', `The Nurse's Office`, 'Evil Teams', { room: true, cast: [NURSE], ...HR },
    `The nurse's office. Four, with "headaches." Miriam: "They're not ill. I've nothing for what they've got. You might." And then the roof. Nobody. A lunchbox, old. A name inside the lid. It's Eri's. From two years ago. She ate up here a term.`,
    [ch('Go down to the canteen.', out(`A table of nine. It's by the bins. It's the worst table. It's theirs.`, ...kind(1), flag('homeroom-lunch1')))]),
  // Lunch 2: Double Maths (stage 7; a door of three nodes, ps_hr_lunch2)
  ev('hr-lunch-2', 'Lunch 2: Double Maths', 'Evil Teams', { requires: [...outside({ after: 5, has: 'third' }), flagIs('homeroom-lunch1')], cast: [YUSUF, GIACOMO], ...HR },
    `The flyer said "you can sit with us." Us is on a hill. Homeroom brings the hill down. ${say('Yusuf, at the Segin gate, with the first-year behind him', `Giacomo. There's nine kids in the canteen who got your flyer and can't come. They've got double maths.`)} ${say('Giacomo', `...I teach double maths.`)} ${say('Yusuf', `I know. Come and do it there.`)} ${say('Giacomo', `In the building?`)} ${say('Yusuf', `You came for my volcano.`)}`,
    [ch('Walk down with him.', on(`It's a walk.`, 'hr-l2-walk'))]),
  ev('hr-l2-walk', 'The Walk', 'Evil Teams', { room: true, cast: [GIACOMO], ...HR },
    `It's a walk. Giacomo, from a hill to a canteen, with a speaker under his arm. His legs. You don't push. You walk beside.`,
    [ch('Walk beside.', on(`The canteen doors.`, 'hr-l2-canteen'), { prompt: prompt(STEALTH), fail: on(`He stops twice. You stop with him. The canteen doors.`, 'hr-l2-canteen') })]),
  ev('hr-l2-canteen', 'The Canteen', 'Evil Teams', { room: true, cast: [GIACOMO], ...HR },
    `The canteen. One o'clock. Four hundred students. A table by the bins. A boy in a star helmet sits down at it. He takes the helmet off. He puts a speaker on the table. ${say('Giacomo, to nine first-years, very quietly, in four-four', `Negative b—`)}`,
    [ch('Sit down.', out(`By the end of the hour it's a table of thirty, and a maths teacher's standing at the back with her arms folded, taking notes. One boss has been in the building, at lunch, in daylight, and nothing happened.`, ...kind(1), flag('homeroom-lunch2')))]),
  // Lunch 3: Her Face (stage 7, a + node). Tully's note, if he left one; if not, this Lunch is Atticus's.
  ev('hr-lunch-3', 'Lunch 3: Her Face', 'Evil Teams', { requires: [...outside({ after: 5, has: 'third' }), flagIs('homeroom-lunch2'), flagIs('tully-note')], cast: [ERI], ...HR },
    `Tully's note. Homeroom carries it. ${say('Eri, reading it, in the dojo', `'I'll say it to her face if she'll let me.'`)} ${say('Eri', `I'm the big one. I stand at the front. D'you know why? 'Cause he'd pick whoever looked most scared, and I thought: if I'm at the front, I'll be the one he looks at. I did that every day for a year. I was eleven.`)}`,
    [
      ch(`"You don't have to."`, on(`${say('Eri', `I know.`)} She folds the note. ${say('Eri', `I'm going anyway.`)}`, 'hr-l3-canteen')),
      ch('"What do you want?"', on(say('Eri', `...I want him to see I'm still frightened. And I came anyway. I want him to know it didn't work.`), 'hr-l3-canteen')),
      ch(`"I'll come with you."`, on(`She nods. She doesn't say anything.`, 'hr-l3-canteen')),
    ]),
  ev('hr-l3-canteen', 'The Table by the Bins', 'Evil Teams', { room: true, cast: [ERI, TULLY], ...HR },
    `The canteen. The table by the bins. It's thirty, now. A boy in a Cipher Peon's uniform with the badge torn off, who can't look up. ${say('Tully', `I went along with it. That's all I— no. That's not 'all.' That's the thing. I went along with it. Every day. I could've not.`)} Eri, a long time: ${say('Eri', `Yeah. You could've.`)} ${say('Tully', `I'm sorry.`)} ${say('Eri', `I know. I'm not saying it's all right.`)} She pulls out a chair. Not for him. For herself. She sits. At a table. In the canteen. ${say('Eri', `I'm saying I'm having my lunch.`)}`,
    [ch('Sit with her.', out(`He doesn't sit. He's not asked to. He goes. It's the first time he's walked out of that room without the other two.`, ...kind(1), flag('homeroom-lunch3')))]),
  ev('hr-lunch-3-helmets', 'Lunch 3: Forty Hats', 'Evil Teams', { requires: [...outside({ after: 5, has: 'third' }), flagIs('homeroom-lunch2'), flagIs('tully-note', 0, 0)], cast: [ATTICUS], ...HR },
    `There was no note. This Lunch is Atticus's instead. He brings forty helmets to the canteen and puts them on the tables, one each, like hats at a party.`,
    [ch('Sit down.', out(`Nobody has to wear one. Everybody does.`, ...kind(1), flag('homeroom-lunch3')))]),
  // F4. The climax: Pyjamas (replaces the Final Choice and the outside climax; ps_hr_pyjamas)
  ev('hr-pyjamas', 'Pyjamas', 'Evil Teams', { callback: true, requires: [...outside({ beat: 6, has: 'third' })], cast: [CLAVELL, FIRSTYEAR], tint: YARD, effect: 'glint' },
    `The yard. Sunday night. Five trucks. Forty helmets. The Director, with a notice. ${say('The Director', `I'm required to read this.`)} A door. Behind him. The dormitory's. A first-year in pyjamas. With a torch. Then another. Then the table by the bins: thirty of them, in dressing gowns and odd socks. Then the ones from the eleven places. Then people nobody's counted: the ones who watched, eighteen months ago, and said nothing, and have thought about it since. They walk out into the yard. They don't go to the Director. They go and stand with Star. In the rows. In the gaps. ${say('The first-year, to Mela, in a whisper that carries', `You said we could sit with you. We can't get up the hill. So we thought we'd stand.`)}`,
    [ch('Stand with them.', on(`The Director starts counting.`, 'hr-pj-count'))]),
  ev('hr-pj-count', 'The Count', 'Evil Teams', { room: true, cast: [CLAVELL, YUSUF], tint: YARD },
    `${say('The Director', `One. Two. ...Eleven. ...Thirty.`)} He's counting pyjamas. ${say('The Director', `Forty. Forty-one.`)} He stops counting. ${say('The Director', `That's every first-year I've got.`)} ${say('Yusuf, in a dressing gown, holding a volcano, because he couldn\'t think what else to bring', `It's not just them it happened to, sir. It's just them that said.`)} ${say('The Director', `I've a notice to expel forty children for standing in a yard. There are now two hundred children standing in a yard.`)} He folds it. He puts it in his cardigan pocket. ${say('The Director', `I find I've a staffing problem.`)}`,
    [ch('The doorway.', on(`A man with a mop.`, 'hr-pj-mop'))]),
  ev('hr-pj-mop', 'The Mop', 'Evil Teams', { room: true, cast: [UPSHAW, CLAVELL], tint: YARD },
    `${say('Mr. Upshaw, in the doorway', `Is somebody going to ask me, then?`)} ${TWO_HOURS}`,
    [ch('The gate.', on(`A man at the gate.`, 'hr-pj-buyers'))]),
  ev('hr-pj-buyers', 'The Buyers', 'Evil Teams', { room: true, cast: [NASCOUR, HARROW, MELA], tint: YARD },
    `${say('Nascour, at the gate', `I'd understood there were forty.`)} Two hundred children in pyjamas turn round. ${say('Mela', `Oi. Shampoo advert.`)} ${say('Nascour', `...I see.`)} ${say('Nascour', `Not here. In front of children. I have some standards.`)} He leaves. There are too many children. He's got no brochure for two hundred. Harrow stays.`,
    [ch('Battle Harrow.', fight(`Harrow, alone. Beaten. Homeroom doesn't disband. It becomes a thing the Academy has: a table by the bins. It's the worst table. There's a waiting list. ${EPILOGUE.homeroom}`, ps(trainer('Harrow', { sprite: HARROW, team: ['oranguru', 'farigiraf', 'kingambit'], size: 3, lv: 1, win: [] })),
      ...kind(2), story({ beat: true }), story({ end: 'exposed' }), flag('star-ending-homeroom'), flag('two-hundred')))]),
  // F5. After Homeroom: a chair pulled out
  ev('hr-chair', 'A Chair Pulled Out', 'Evil Teams', { requires: [P, flagIs('star-ending-homeroom')], cast: [], tint: SCHOOL },
    `Homeroom doesn't disband. It becomes a thing the Academy has: a table by the bins. It's the worst table. There's a waiting list. Here, a chair pulled out, at a café table.`,
    [ch('Sit.', out(`Your party sits. Somebody sat with each of them.`, bondUp(1, 'party')))]),
];
(homeroom[1] as Json).remembers = [{ id: 'tully', when: [flagIs('tully-note')], notice: `Tully doesn't join. He leaves a note in a locker: "I was one of the three. I'm sorry. I know a note's not much. I'll say it to her face if she'll let me."` }];

export const EVENTS: Json[] = [FINAL, ...plan, ...turn, RESCIND, ...academy, ...own, ...homeroom];
export const REMOVE: string[] = [];
