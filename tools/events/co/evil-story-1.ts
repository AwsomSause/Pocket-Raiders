// Catalog Overhaul Pack, STORY_FAMILIES_13 Part A (A1 to A7, A9) for all sixteen teams: The Whisper, The Files, Known and the
// Ambushes, The Lieutenant (both meetings, with the Grunt in the back), Trouble Inside, The Plan, and A Legend Stirs.
// The Operations, the Hideout and the Holding Pen are in evil-story-2.ts and evil-story-3.ts. Each team's own lines are in
// _evil-story-teams.ts (Parts B, C and D, word for word). Team marks (`team-<id>-<mark>`) are listed in docs/status/co-evil-story.md.
import { readFileSync } from 'node:fs';
import { join as joinPath } from 'node:path';
import { $, ch, ev, fight, flag, flagIs, out, room, wild, type Json } from '../dsl.ts';
import { evil as story, foe, kind, node, prompt, rivalTrust, STEALTH } from './_evil-story-kit.ts';
import { TEAMS, type TeamStory } from './_evil-story-teams.ts';

export const CATEGORY = 'evil-story';

interface Rank { name: string; sprite: string; species: string[] }
interface TeamJson { id: string; name: string; color: string; ranks: Record<'grunt' | 'specialist' | 'executive' | 'leader', Rank>; ops: { id: string; name: string }[] }
const DATA = JSON.parse(readFileSync(joinPath(import.meta.dirname, '../../../src/data/evilTeams.json'), 'utf8')) as { teams: TeamJson[] };
export const teamJson = (id: string): TeamJson => DATA.teams.find((t) => t.id === id)!;

const say = (who: string, line: string): string => `${who}: "${line}"`;
/** Teams with a Volume III inside route (their Offer comes after The Files). */
const OFFERS = ['rocket', 'galactic', 'plasma', 'magma', 'aqua', 'flare', 'skull', 'aether', 'yell', 'star'];
const gate = (t: TeamStory, o: Json): Json => ({ kind: 'evil', team: t.id, ...o });
const mark = (m: string): Json => story({ mark: m });
const has = (m: string): Json => ({ kind: 'evil', has: m });
/** The Sign a sighting gives (STORY_FAMILIES_13 A9). The legends hook turns it into Influence only for the run's blessing. */
const sign = (species: string, n = 1): Json => flag(`sign-${species}`, n);

function storyline(t: TeamStory): Json[] {
  const j = teamJson(t.id);
  const g = j.ranks.grunt.name;
  const lt = t.lt.name;
  const col = t.col.name;
  const id = (x: string) => `evil-${t.id}-${x}`;
  const events: Json[] = [];

  // ---------- A1. The Whisper ----------
  events.push({
    id: id('suspicious'),
    name: 'The Whisper',
    intro: `${t.place} One of them is talking low, and not low enough. ${say(`${g} 1`, t.whisper)} ${say(`${g} 2`, `Shh. Someone's there.`)} They both turn round at once, far too fast, and the first one says, very loudly, to nobody at all: "Lovely weather!"`,
    choices: [
      ch('Follow them.', out(`You let them get a street ahead and keep to the far side. They never look back; they are too busy arguing about who forgot the paperwork. They stop at a narrow door with a brass plate that says ${t.front}, and go up. A light comes on on the second floor. You have a name now, and you know where it keeps its office.`, story({ beat: true }), mark('front'), ...node())),
      ch('Report them to Officer Jenny.', out(`Officer Jenny listens with her pen moving and thanks you twice. "We've had our eye on ${t.front} for a while. Leave it with us." Across the road a curtain moves and falls still. By tonight ${t.name} will know what you look like.`, story({ beat: true, heat: 2 }), mark('known'))),
      ch('Walk past.', out(`You walk on as if you heard nothing. Behind you the whispering starts again, quicker now. Whatever they are shipping, it is going ahead, and sooner or later it will be standing in your way.`, story({ beat: true }))),
    ],
    remembers: [{
      id: 'booth', when: [flagIs('front-exposed')],
      notice: `${say(`${g} 2`, `That's the one from the booth.`)} Neither of them bothers with the weather.`,
      hide: [0, 1, 2],
      addChoices: [ch('Stand your ground.', out(`"You cost us a whole stall," the first one says, already on his radio. Nobody in ${t.name} needs to be told who you are any more. Whatever came between here and that, you have skipped it.`, story({ beat: true }), story({ beat: true, heat: 2 }), mark('known')))],
    }],
  });

  // ---------- A2. The Files ----------
  const keep = (extra: Json[] = [], words = '') => out(`You fold the folder under your jacket before he looks up. He searches the verge, then the ditch, and swears at both. Somebody in ${t.name} is going to be in trouble tonight, and you are carrying the reason.${words} One door of their Hideout will open for you without a fight.`, story({ beat: true }), mark('files'), flag('team-files-kept'), ...extra);
  events.push({
    id: id('evidence'),
    name: 'The Files',
    intro: `A folder lies open by the path, its pages lifting in the wind: shipping lists, Pokémon names, and the ${t.name} stamp at the top of every sheet. ${t.file}. Up the path a ${g} is hurrying back, bent nearly double, scanning the ground. He hasn't seen you yet.`,
    choices: [
      ch('Keep the files.', keep()),
      ch('Take them to Jenny.', out(`Officer Jenny reads the first page and the second and is reaching for her radio before she gets to the third. "This is enough for a warrant on one of their jobs. Not all of it. One." Whatever ${t.name} meant to do next will happen a stage late, if it happens at all.`, story({ beat: true }), mark('files-jenny'), flag('team-files-given'))),
      ch('Sell them back to the Grunt. (₽1,000)', out(`"You found it? You found it!" He counts ₽1,000 into your hand, fingers shaking, and very nearly hugs you. He'll keep his job. Word travels, though, and by evening your rival has heard who sold ${t.name} its papers back. They don't say anything about it. They don't have to.`, story({ beat: true }), $(1000), mark('files-sold'), flag('team-files-sold'), rivalTrust(-1))),
    ],
    remembers: [{
      id: 'kit', when: [flagIs('shelf-kit')],
      notice: `Halfway down the second list is a name you know: Kit Arden. There is an address after it, in pencil.`,
      hide: [0],
      addChoices: [ch(`Keep the files, and Kit's address.`, keep([flag('shelf-kit-address')], ` You read Kit's line three times. Now you know where they took him.`))],
    }],
  });
  // Volume III: a team with an inside route makes its Offer here, once, in the regions it has one (`evil-<team>-offer-<region>`).
  if (OFFERS.includes(t.id)) {
    const files = events[events.length - 1] as { choices: { success: Json }[]; remembers: { addChoices: { success: Json }[] }[] };
    for (const c of [...files.choices, ...files.remembers.flatMap((r) => r.addChoices)]) c.success = { ...c.success, effects: [...(c.success.effects as Json[]), room(`evil-${t.id}-offer-{region}`)] };
  }

  // ---------- A3. Known ----------
  events.push({
    id: id('recognized'),
    name: `${t.name} Knows Your Face`,
    intro: `Market day, and the square is packed shoulder to shoulder. Across the stalls a ${g} has stopped dead with a skewer halfway to his mouth, and he is staring straight at you. He doesn't look away. He fumbles a radio off his belt and turns his back to talk into it. ${say(`${g}, into the radio`, t.known)}`,
    choices: [
      ch('Confront them.', fight(`You go straight through the crowd before he can finish the call. He drops the skewer and reaches for a Poké Ball instead.`, foe('grunt', g, 2, { win: [{ kind: 'money', amount: 600 }] }), story({ beat: true, heat: 4 }), mark('known'), mark('ambush-skip'))),
      ch('Lose them in the crowd.', out(`You duck under an awning, behind a cart of melons, through a café and out its back door. When you look round, he is turning in a slow circle in the middle of the square with the radio at his ear, saying "I had them. I HAD them."`, story({ beat: true, heat: 2 }), mark('known')), {
        prompt: prompt(STEALTH),
        fail: out(`You try to slip behind a cart, but a child points at you and shouts "Mum, that's the trainer from the poster!" He hears. Everyone hears.`, story({ beat: true, heat: 4 }), mark('known')),
      }),
      ch('Wave.', out(`You wave. He looks at his radio, then at you, and then, slowly and completely baffled, he waves back. Then he finishes the call. ${t.name} has your face now, and they will be looking for it.`, story({ beat: true, heat: 4 }), mark('known'))),
    ],
  });

  // ---------- A3. An Ambush ----------
  const talk = (lead: string) => out(`${lead} The taller one lowers his Ball. "...Oh. You're that one." He looks at his partner, and his partner looks at the ground. "Go on. We never saw you." They step back into the gap and let you pass.`);
  const squad = t.id === 'skull' ? { when: 'skull-recruited', notice: `Three more step out behind them, new jackets still creased from the bag. Skull's recruiting worked.`, battle: foe('grunt', g, 4, { format: 'doubles', chain: 2, win: [$(900)] }) }
    : t.id === 'star' ? { when: 'star-recruited', notice: `There's a third one now, a new face in a shiny jacket that doesn't fit yet.`, battle: foe('grunt', g, 5, { format: 'doubles', win: [$(700)] }) }
    : t.id === 'yell' ? { when: 'yell-fans-recruited', notice: `Then six more, all in brand-new scarves, all holding Poké Balls the wrong way up. Twice as many of them, and half as much trouble.`, battle: foe('grunt', g, 4, { format: 'doubles', chain: 2, lv: -4, win: [$(500)] }) }
    : null;
  events.push({
    id: id('ambush'),
    name: `${t.name} Ambush`,
    intro: `Two ${g}s step out of a gap between two buildings at the worst possible moment: your team is tired and the road is narrow. ${say(g, t.ambush)}`,
    choices: [
      ch('Battle.', fight(`"Two on two. Let's go."`, foe('grunt', g, 4, { format: 'doubles', win: [$(700)] }))),
      ch('Run. (a node)', out(`You turn and go the long way round, through back gardens and over a wall, and lose them. It costs you time you didn't have.`, ...node())),
      ch('Talk them down.', talk(`You say a name: the one who told you to say it.`), { requires: [flagIs('evil-talk-down')] }),
    ],
    remembers: [
      { id: 'radio', when: [{ kind: 'evil', has: 'ambush-skip', lacks: 'ambush-skipped' }], notice: `But theirs is the radio you smashed in the market. Nobody told them which road you'd take, and they are watching the other one.`, hide: [0, 1, 2], addChoices: [ch('Slip past behind them.', out(`You walk by close enough to read the names on their badges. Neither of them turns round.`, mark('ambush-skipped')))] },
      { id: 'inside', when: [{ kind: 'evil', defector: true }], hide: [2], addChoices: [ch('Talk them down.', talk(`You tell them who's been talking to you from inside their own team.`))] },
      ...(squad ? [{ id: 'squad', when: [flagIs(squad.when)], notice: squad.notice, hide: [0], addChoices: [ch('Battle.', fight(`"All of us. Now."`, squad.battle))] }] : []),
    ],
  });

  // ---------- A4. The Lieutenant, first meeting ----------
  const ltFight = (text: string, ...fx: Json[]) => fight(text, foe('executive', lt, 3, { study: true, win: [$(1500)] }), story({ beat: true, heat: 1 }), mark('lt1'), ...fx);
  events.push({
    id: id('rising-star'),
    name: lt,
    intro: `A long black car pulls up beside you and doesn't switch its engine off. The back door opens and ${lt} steps out, two ${g}s at their shoulders, and looks you up and down like a bill they don't intend to pay. ${say(lt, t.lt.first)} They hold your eyes a moment longer than they need to. ${say(lt, t.lt.hint)}`,
    choices: [
      ch('Battle.', ltFight(`${lt} doesn't smile. "Fine. Show me what everyone's so worried about." They watch every move you make, and you can see them remembering it.`)),
      ch('Why are you with them?', ltFight(`${lt} is quiet for long enough that one of the Grunts glances at them. Then, plainly, as if it cost nothing: ${say(lt, t.lt.reason)} They take a Poké Ball from their coat. "That's all you get. Now."`, mark('lt-asked'))),
      ch('Leave me alone.', ltFight(`${say(lt, `That's not how this works.`)}`)),
    ],
  });

  // ---------- A5. Trouble Inside ----------
  events.push({
    id: id('infighting'),
    name: `Trouble Inside ${t.name}`,
    callback: true,
    requires: [gate(t, { beat: 4, trouble: false })],
    intro: `Raised voices in an alley. ${lt} and ${col}, ${t.col.role}, are nose to nose by the bins, and neither of them has noticed you. ${say(lt, t.col.ltGrievance)} ${say(col, t.col.grievance)} Then both of them, at once, at full volume: "${t.boss} promised ME that lab!"`,
    choices: [
      ch(`Side with ${lt}.`, out(`You step out of the shadow and say ${lt} is right. ${col} stares at the two of you, then turns and runs for the street: straight to ${t.boss}, you'd guess. ${lt} doesn't thank you. They look at you for a long time instead, and something in their face comes unstuck. "Nobody in this team has ever taken my side." From now on, ${lt} is someone you can call.`, story({ defect: true }), mark('defector-lt'), mark('trouble'), flag('evil-talk-down'))),
      ch(`Side with ${col}.`, out(`You say ${col} is right, and ${col} lets out a breath they seem to have been holding for a year. ${t.col.defects}. ${lt} doesn't shout. That is worse. "Next time," they say, very quietly, "I won't hold anything back."`, story({ defect: true }), mark('defector-colleague'), mark('trouble'), mark('lt-furious'), flag('evil-talk-down'))),
      ch('Slip away.', out(`You back out the way you came. The shouting follows you two streets. By the next Rival Report everybody seems to know that ${t.name} is coming apart at the seams.`, mark('trouble'), flag('rival-report-feud'))),
    ],
  });

  // ---------- A6. The Lieutenant, second meeting ----------
  const nemesisFight = (lv: number, size: number) => foe('executive', lt, size, { lv, study: true, win: [$(2000), room(id('nemesis-after'))] });
  events.push({
    id: id('nemesis'),
    name: `${lt} Returns`,
    requires: [gate(t, { beat: 4, trouble: true })],
    intro: `${lt} again, and this time they came ready: a stronger team on their belt, no car to hide behind, and nobody to show off for. In the back, a young ${g} keeps glancing at you, then at the road, like someone who wants out. ${say(lt, t.lt.second)}`,
    choices: [ch('Battle.', fight(`They have been practising against the way you fight. It shows.`, nemesisFight(1, 4), story({ beat: true, heat: 1 })))],
    remembers: [{ id: 'furious', when: [has('lt-furious')], notice: `${lt} hasn't forgiven the alley. They have brought everything they own.`, hide: [0], addChoices: [ch('Battle.', fight(`There is nothing left of the professional calm. They want to win this one personally.`, nemesisFight(3, 5), story({ beat: true, heat: 1 })))] }],
  });
  const grunt = room(id('nemesis-grunt'));
  const comeWithMe = (why: string) => ch('Come with me.', out(`${why} ${lt} looks at your outstretched hand for a long time. "They'll call me a traitor." "Yes." "...All right." For the rest of this region ${lt} walks with you. When you reach the Hideout, they will fight at your side.`, mark('lieutenant-recruited'), mark('lt-gone'), mark('lt-out'), grunt));
  events.push(ev(id('nemesis-after'), `${lt}, Beaten`, 'Evil Teams', { room: true, cast: [j.ranks.executive.sprite], tint: j.color },
    `${lt} recalls their last Pokémon and stands there with the empty Ball in their hand, not looking at it. ${say(lt, t.lt.last)}`,
    [
      ch(`You're under arrest.`, out(`You call it in. ${lt} doesn't run. When Officer Jenny's car comes round the corner they hold out their wrists before she asks. With ${lt} gone, one of ${t.name}'s Operations will be guarded by half as many.`, mark('lieutenant-arrested'), mark('lt-gone'), mark('lt-out'), grunt)),
      comeWithMe(`You hold out your hand.`),
      ch('Go.', out(`"Go," you say. ${lt} nods once, like a person who has been expecting the opposite for years, and walks away down the road without looking back. You have a feeling you'll see them again one day, somewhere quieter.`, mark('lieutenant-free'), mark('lt-gone'), grunt)),
    ].map((c, i) => (i === 1 ? { ...c, requires: [has('lt-asked')] } : c))));
  (events.at(-1) as Json).remembers = [{ id: 'defector', when: [has('defector-lt')], hide: [1], addChoices: [comeWithMe(`You took their side once, in an alley. You hold out your hand again.`)] }];
  events.push(ev(id('nemesis-grunt'), 'The Grunt in the Back', 'Evil Teams', { room: true, cast: [j.ranks.grunt.sprite], tint: j.color },
    `Before ${lt} is quite out of sight, the young ${g} from the back steps forward, cap held in both hands, knuckles white. "Please. I don't... I don't want to do this any more. I never did."`,
    [
      ch('You can come too.', out(`"Really?" They say it like nobody has ever said yes to them before. They walk out with you and don't look back once. A month from now you'll see them behind the counter of a Pokémon Center in a pink apron, holding an Egg like it is made of glass.`, flag('grunt-quit'), flag('grunt-center-worker'), flag('evil-talk-down'), ...kind(1))),
      ch('Go home.', out(`They nod hard, three times, and then they are running, cap and all. Weeks later a postcard finds you: a farmhouse, a field, a blurry Pokémon. "Mum cried. In the good way. Thank you."`, flag('grunt-quit'), flag('grunt-went-home'), flag('evil-talk-down'), ...kind(1))),
      ch('Say nothing.', out(`You don't say anything. They wait for an answer that doesn't come, then put their cap back on and follow ${lt}. You'll see them again, inside.`, mark('grunt-inside'))),
    ]));

  // ---------- A7. The Plan ----------
  const opNames = t.ops.map((o) => o.name);
  const lightest = t.ops.find((o) => !o.way.requires && !o.way.prompt && !o.way.fight) ?? t.ops[0];
  const trap = t.ops[3];
  events.push({
    id: id('the-plan'),
    name: `${t.name}'s Plan`,
    intro: `Behind a door marked "${t.front}: staff only", the whole of one wall is a whiteboard. Across the top, in thick capitals: ${t.plan.toUpperCase()}. Under it, four boxes with dates: ${opNames.slice(0, 3).join(', ')} and ${opNames[3]}. And under those, in ${t.boss}'s own handwriting, underlined twice: "${t.note}" Four things are going to happen to this region. You can be first to one of them.`,
    choices: t.ops.map((o) => ch(`Stop ${o.name} first.`, out(`You photograph the board and circle ${o.name} on your map. That one you stop first. The other three will go ahead on their dates unless you reach them in time.`, story({ beat: true }), story({ planFirst: o.id })))),
    remembers: [
      { id: 'trap', when: [{ kind: 'evil', defector: true }], notice: `Your friend from inside taps one box with a fingernail. "That one's a trap." It is ${trap.name}. There is an Admin waiting there for you.` },
      { id: 'files', when: [has('files')], notice: `Your stolen files fill in one more box: the guard rota. ${lightest.name} has the fewest people on it.` },
    ],
  });

  // ---------- A9. A Legend Stirs ----------
  const L = t.legend;
  const name = L.name;
  // After the region the team is archived, so the legend's own flags name the team (not a mark of the current one).
  const seenIt = flag(`team-${t.id}-legend-seen`);
  const callFight = (lv: number) => fight(`It turns its head, and then, without hurry, it comes.`, wild({ species: L.species, lv, win: [flag(`team-${t.id}-legend-called`)] }), seenIt);
  const watched = L.species.map((s) => flag(`reunion-sky-${s}`));
  const legend: Json = {
    id: id('legend'),
    name: 'A Legend Stirs',
    callback: true,
    requires: [flagIs(`team-${t.id}-beaten`), flagIs(`team-${t.id}-legend-seen`, 0, 0), flagIs(`team-${t.id}-legend-met`, 0, 0)],
    intro: `With ${t.name} gone, the Pokémon they hunted has no more reason to hide. ${L.sight}`,
    choices: L.original
      ? [
        ch('Bow.', out(`You bow, low, and stay bowed until the air changes. When you straighten up, ${name} is already a long way off. That was all. It was enough.`, seenIt)),
        ch('Call to it.', callFight(5)),
        ch('Watch it go.', out(`You stand still and watch ${name} until there is nothing left to watch. Somewhere, you think, it will remember a trainer who didn't reach for a Ball.`, seenIt, ...watched)),
      ]
      : [
        ch('Bow.', out(`You bow, low, and stay bowed until the air changes. When you straighten up, ${name} is already a long way off. Something passed between you, small and certain.`, seenIt, ...L.species.map((s) => sign(s)))),
        ch('Call to it.', out(`You call to it, not loudly. It turns its head toward you and holds there, listening, for one long breath. Then it goes on its way.`, seenIt, ...L.species.map((s) => sign(s)))),
        ch('Watch it go.', out(`You stand still and watch ${name} until there is nothing left to watch. It will be in the sky again, at the very end. You're sure of it.`, seenIt, ...L.species.map((s) => sign(s)), ...watched)),
      ],
  };
  if (!L.original) {
    const bow2 = (s: string) => ch('Bow.', out(`You bow, low. When you straighten up, ${name} has not moved, and it is looking at you the way it looked at nobody else. The bond between you and the Legendary that blesses this run grows deeper.`, seenIt, sign(s, 2)));
    legend.remembers = [
      { id: 'close', when: [flagIs(`blessing-${L.species[0]}`), flagIs('blessing-influence', 5)], hide: [0, 1], addChoices: [bow2(L.species[0]!), ch('Call to it.', callFight(5))] },
      ...L.species.map((s) => ({ id: `blessed-${s}`, when: [flagIs(`blessing-${s}`)], hide: [0], addChoices: [bow2(s)] })),
    ].slice(0, 3);
  }
  events.push(legend);
  return events;
}

export const EVENTS: Json[] = TEAMS.flatMap(storyline);
export const REMOVE: string[] = [];
