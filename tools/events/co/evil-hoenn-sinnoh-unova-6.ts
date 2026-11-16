// Catalog Overhaul Pack, row 9: Unova, Team Plasma (TEAM_PLASMA_UNOVA_FULL_3). Part B, four inside-only events (the Watch,
// Collections, Keeper of the King's Room, the Table); part C, the six Operations (the ordered way, Standing +1; the quiet way,
// Standing +1, Suspicion +1, Kindness +1); part A, the twelve events for any player (anyRoute: inside or outside). Keepsakes
// are cut (Kice), so the brass tag, the urn's tea, the Schedule, Three Names and the July Snowball are run flags.
import { ch, ev, fight, flag, flagIs, out, room, trainer, bondUp, heal, type Json } from '../dsl.ts';
import { kind, prompt } from './_evil-story-kit.ts';
import { COLRESS, GRUNT, KNIGHT, N, OLD, SAGE, TINT, CANDLE, inside, intel, mark, meters, night, once, say } from './evil-hoenn-sinnoh-unova-4.ts';

export const CATEGORY = 'evil-hoenn-sinnoh-unova';

const ALDITH = 'boss.cast-aldith';
const DRAYDEN = 'boss.drayden';
/** The quiet way of an Operation: Standing +1 either way, Suspicion +1, Kindness +1 (FULL_3 C). */
const quiet = (): Json[] => [meters(1, 1), ...kind(1)];
/** Any player, inside or outside, once Plasma's story has reached `after`, in Unova. */
const anyone = (after: number, o: Json = {}): Json[] => [{ kind: 'evil', team: 'plasma', after, anyRoute: true, ...o }, { kind: 'region', ids: ['unova'] }];
const inUnova = (after: number, o: Json = {}): Json[] => inside({ after, ends: ['none'], ...o });

// ---------- V1. The Watch (inside, every Unova stage from 3, at a rest) ----------
const watch = (n: number, after: number, who: string, line: string, choices: Json[], cast: string[] = [KNIGHT]): Json =>
  ev(`px-watch-${n}`, 'The Watch', 'Evil Teams', { requires: [...inUnova(after), once(`px-watch-${n}`)], cast, pokemon: 'chandelure', tint: CANDLE },
    `The Votive's never gone out. Somebody's always awake to see it doesn't. It's your turn on the Watch. ${who} ${line}`, choices.length ? choices : [ch('(Keep the Watch.)', out(`Dawn comes. It's still lit.`, flag(`px-watch-${n}`)))]);
const WATCH: Json[] = [
  watch(3, 2, `A Knight who joined last week shares it.`, say('The Knight', `I keep nearly calling her. My Snivy. I get as far as the first letter. Is that normal? When does it stop?`), []),
  watch(4, 3, `Emil shares it.`, say('Emil', `On a ward, the night watch is so somebody's there if one wakes frightened. I keep looking round for the beds.`), []),
  watch(5, 4, `Sage Gorm comes to light his own candle from it.`, `${say('Sage Gorm', `It's the same flame as the first night. Passed along. I find that moving. I wrote a line about it.`)} He stops. ${say('Gorm', `I can't recall if the line was mine.`)}`, [], [SAGE]),
  watch(6, 5, `Nobody shares it. The Knight on the rota's gone to Driftveil. You're alone with it.`, `It gutters once.`, [
    ch('(Shield it with a hand.)', out(`It steadies. Nobody sees.`, flag('px-watch-6'), flag('plasma-votive-kept'))),
    ch('(Let it go out.)', out(`Nothing happens. Nobody notices till dawn. Then six hundred people stand under a dark lamp and nobody says whose watch it was. It's relit from a Knight's candle. It's the same flame, passed along. Gorm was right about that part.`, flag('px-watch-6'), flag('plasma-votive-out'))),
  ], []),
  watch(7, 6, `Everyone shares it.`, `Six hundred awake. He's coming in the morning.`, [], [KNIGHT, KNIGHT]),
];

// ---------- V2. Collections (inside, stage 4 or 5, a + node) ----------
const COLL: Json[] = [
  ev('px-collections', 'Collections', 'Evil Teams', { requires: [...inUnova(3), once('plasma-collections')], cast: [ALDITH], pokemon: 'liepard', tint: '#2a2a30', effect: 'none' },
    `A black van. A woman with a clipboard and no patience. ${say('Commander Aldith', `You're the candle they've lent me. Short-handed; half my lot are on the Frigate. You'll ride. You'll carry. You'll not pray in my van.`)} On the dash: a Liepard, asleep. A notch in its left ear. ${say('Aldith', `Monday round. Three fields. They'll be at the fence; they always are. Carrier, tag, in the back. Don't talk to them. They think you're their person coming back; if you talk it takes twice as long.`)}`,
    [ch('(The first field.)', out(`Six, at the fence. They see a white hood. They think it's a Knight come back. They're so pleased.`, room('px-collections-1')))]),
  ev('px-collections-1', 'Collections: Field 1', 'Evil Teams', { room: true, cast: [ALDITH], tint: '#4a5a38' }, `Six at the fence, so pleased.`, [
    ch('Carry them.', out(`Carrier, tag, in the back.`, room('px-collections-2'))),
    ch('(Read each collar\'s town aloud as it goes in.)', out(`${say('Aldith', `What're you doing?`)} "Checking the tags." It's the first time anyone in that van's heard where they're from.`, flag('plasma-tags-read'), room('px-collections-2'))),
  ]),
  ev('px-collections-2', 'Collections: Field 2', 'Evil Teams', { room: true, cast: [ALDITH], pokemon: 'tepig', tint: '#4a5a38' }, `A Tepig, nose through the fence.`, [
    ch('Carry it.', out(`Carrier, tag, in the back.`, room('px-collections-3'))),
    ch('"This one\'s hurt. It\'ll need a Center."', out(`It isn't. ${say('Aldith', `Fine. Drop it at the next one.`)} It's at Sister Redfern's by dark.`, flag('plasma-tepig-center'), room('px-collections-3'))),
  ]),
  ev('px-collections-3', 'Collections: Field 3', 'Evil Teams', { room: true, cast: [ALDITH, KNIGHT], tint: '#4a5a38' }, `Nine. And a Knight behind a tree.`, [
    ch('Carry them.', out(`Carrier, tag, in the back. The Knight behind the tree doesn't move.`, room('px-collections-drive'))),
    ch('"There\'s a witness."', out(`${say('Aldith', `Then we come back Tuesday.`)} The Knight's got till Tuesday.`, flag('plasma-tuesday'), room('px-collections-drive'))),
  ]),
  ev('px-collections-drive', 'Collections', 'Evil Teams', { room: true, cast: [ALDITH], pokemon: 'liepard', tint: '#2a2a30' },
    `${say('Aldith, driving, not unkindly', `You lot think we're the villains. I'm a driver. I had the Purrloin off a job five years back; it was in a girl's arms; I didn't like it. It's a job. It's grown on me, the cat. I think it's forgotten.`)} The Liepard's ear turns. It hasn't.`,
    [ch('(Look at the ear.)', out(`A notch, in the left one. You'll know it again.`, flag('plasma-collections'), flag('plasma-x-notch'), meters(1)))]),
];
(COLL[1] as Json).remembers = [{ id: 'fence', when: [flagIs('plasma-saw-fence')], notice: `You watched one at a fence, in Act 1. These are the same shape.` }];
(COLL[2] as Json).remembers = [{ id: 'tepig', when: [flagIs('plasma-saw-fence')], notice: `It's the Tepig you watched, in Act 1. It puts its nose through again.` }];

// ---------- V3. Keeper of the King's Room (inside, stage 6 or 7, a + node at night; Rank 5) ----------
const KING: Json[] = [
  ev('px-kings-room', 'Keeper of the King\'s Room', 'Evil Teams', { requires: [...inUnova(5, { rank: 5 }), night, once('px-kings-room')], cast: [N], pokemon: 'zoroark', tint: '#2a2440', effect: 'none' },
    `The duty: dust the toys. Wind the train. Leave everything as it was. You're alone. The train goes round. The music box is on the shelf. A sound, at the gap in the wall. Somebody comes in. Green cap. The face is right. He sits on the floor by the track, knees up, exactly as N did. He watches it go round. He doesn't look at you. His eyes are a fox's.`,
    [
      ch('(Say nothing. Go on dusting.)', out(`He stays an hour. He goes. He's back the next night, if you are.`, flag('px-kings-room'))),
      ch('(Wind the music box.)', out(`His shoulders drop. For the length of the tune, it's a Zoroark on a child's floor, with its chin on the rail of a toy train.`, flag('px-kings-room'), flag('plasma-x-likeness-seen'))),
      ch('"You don\'t have to be him in here."', out(`He looks at you. The face runs, and settles, and runs. It's forgotten how to stop.`, flag('px-kings-room'), room('px-kings-room-ball'))),
    ]),
  ev('px-kings-room-ball', 'Keeper of the King\'s Room', 'Evil Teams', { room: true, cast: [], pokemon: 'zoroark', tint: '#2a2440' }, `The face runs, and settles, and runs. On the shelf: the Zorua's old ball.`, [
    ch('(Hold up the Zorua\'s old ball.)', out(`It knows the ball. It was its ball. It takes it in its mouth, very gently, and is entirely itself, and leaves with it. On the balcony, it's got something to hold on to.`, flag('likeness-ball'), flag('plasma-x-likeness-seen'))),
    ch('(Leave it.)', out(`It goes back through the gap in the wall, wearing his face.`)),
  ]),
];

// ---------- V4. The Table (inside, stage 6 or 7, a Visit; needs the Seventh Seat) ----------
const SAGES: [string, string][] = [
  ['Rood', `Two years. I assumed they'd gone on without me. I'd been difficult.`],
  ['Gorm', `They meet, surely. I'm simply not summoned. A speechwriter isn't policy.`],
  ['Bronius', `I'm on a ship. I supposed it met on land.`],
  ['Giallo', `Not my business. I guard." A pause. "They don't? None of them?`],
  ['Ryoku', `I've kept that, too. I'm very full.`],
  ['Zinzolin', `I'd thought I was left out for being cold.`],
];
const asked = (s: string): Json => flagIs(`px-table-${s.toLowerCase()}`, 0, 0);
const TABLE_ASK = (): Json[] => [
  ...SAGES.slice(0, 3).map(([s, line]) => ch(`(Ask Sage ${s}.)`, out(`"When did the table last meet?" ${say(`Sage ${s}`, line)}`, flag(`px-table-${s.toLowerCase()}`), flag('px-table-asked'), room('px-table')), { requires: [asked(s)] })),
  ch('(The other three.)', out(`Three more doors.`, room('px-table-2'))),
];
const TABLE: Json[] = [
  ev('px-table-start', 'The Table', 'Evil Teams', { requires: [...inUnova(5), flagIs('plasma-seat-sat'), once('sages-met')], cast: [SAGE], tint: '#2a2a40', effect: 'none' },
    `As the Seventh, you get orders on paper. So does every Sage. You may carry one question to each: "When did the table last meet?"`,
    [ch('(Start with the nearest door.)', out(`Six Sages. Six doors.`, room('px-table')))]),
  ev('px-table', 'The Table', 'Evil Teams', { room: true, cast: [SAGE], tint: '#2a2a40' }, `Six Sages. Six doors.`, TABLE_ASK()),
  ev('px-table-2', 'The Table', 'Evil Teams', { room: true, cast: [SAGE], tint: '#2a2a40' }, `Three more doors.`, [
    ...SAGES.slice(3).map(([s, line]) => ch(`(Ask Sage ${s}.)`, out(`"When did the table last meet?" ${say(`Sage ${s}`, line)}`, flag(`px-table-${s.toLowerCase()}`), flag('px-table-asked'), room('px-table-2')), { requires: [asked(s)] })),
    ch('(Call it.)', out(`Six men, each sure the other five still meet without him. The Seventh has the right; it's in Mother Merrow's rules, which nobody's read in twenty years.`, room('px-table-hall')), { requires: [flagIs('px-table-rood'), flagIs('px-table-zinzolin')] }),
  ]),
  ev('px-table-hall', 'The Hall', 'Evil Teams', { room: true, cast: [SAGE, SAGE, SAGE], tint: '#2a2a40' },
    `The Hall. Six chairs with dust. Six old men, coming in one at a time, each stopping in the door when he sees the others. ${say('Rood', `...You as well?`)} ${say('Bronius', `I've counted. That's all of us.`)} ${say('Gorm', `Then who's been—`)} They all look at the seventh chair. It's polished. You're standing behind it. ${say('Zinzolin', `He's been running it from behind the furniture.`)}`,
    [ch('(Let them sit.)', out(`It doesn't end Ghetsis. They're old; they're implicated; they're frightened. But in every ending, no Sage but Giallo fights for him.`, flag('sages-met')))]),
];
(TABLE[1] as Json).remembers = [{ id: 'more', when: [flagIs('px-table-asked')], notice: `The Sages you've asked are each sure the others still meet.` }];

// ---------- C. The six Operations (one per Unova stage from 3, optional) ----------
const op = (id: string, name: string, after: number, intro: string, choices: Json[], o: Json = {}): Json =>
  ev(`px-op-${id}`, `Operation: ${name}`, 'Evil Teams', { requires: inUnova(after), cast: [GRUNT], tint: TINT, ...o }, intro, choices);
const OPS: Json[] = [
  op('speech', 'The Speech', 2, `The order: hold the crowd's edge while a Sage speaks. Keep it quiet. Keep it from leaving.`, [
    ch('Hold the edge.', out(`The crowd stays. Gorm's voice carries. Nobody leaves till it's done.`, meters(1))),
    ch('(Ask the crowd\'s Pokémon. Out loud. One by one.)', out(`${say('Sage Gorm, from the step', `—did it choose this? Did anyone ask it?`)} You, at the edge, to a man's Stoutland: "Do you want to go?" It looks at you. It looks at the man. It leans its whole weight on his leg. He staggers. To a girl's Petilil: "Do you?" It hides behind her ankle. ${say('A woman', `Ask mine.`)} A Swadloon. It yawns. ${say('Gorm, losing the thread', `—the, ah. The cage with the kind—`)} ${say('A child', `Ask mine!`)} Nobody lets go in that square. ${say('Gorm, after, not angry', `You did what the Speech says. I'd never seen it done. It takes much longer.`)}`, ...quiet(), flag('plasma-op-speech-asked'))),
  ], { cast: [SAGE], pokemon: 'stoutland' }),
  op('sunday-round', 'The Sunday Round', 3, `The order: inspect three Release Fields. Report: "Content. Ranging freely."`, [
    ch('Write "Content. Ranging freely."', out(`Three reports, the approved words. Filed.`, meters(1))),
    ch('(Count the fences. Count who\'s at them.)', out(`North: fourteen, along the fence. None in the field. Mill: nine. One's worn a path, post to post. Hill: empty. Tyre tracks. It was Monday yesterday. You write what you saw. The report goes to a Sage. It's Rood who reads it.`, ...quiet(), flag('plasma-op-round-true'))),
  ], { tint: '#4a5a38' }),
  op('rare-order', 'The Rare Order', 4, `The order: a list from Zinzolin. Six addresses. Six "priority" Pokémon: a gold-sheened Vanillite, an Axew, an Eevee.`, [
    ch('Collect them.', out(`Six houses. Six carriers. Zinzolin signs for them without looking up.`, meters(1))),
    ch('(Deliver the list to N instead.)', out(`A hilltop. A dragon's shadow. A young man reading a sheet of paper as if it were in a language he hoped he'd got wrong. ${say('N', `"Priority." "Unusual colouring." "Exceptionally large."`)} He turns it over. Nothing. ${say('N', `It doesn't say hurt. Any of them. He used to at least say hurt.`)} ${say('N', `I'll go to each. Tonight. I'll ask them. If any says "take me," I'll take it, and I'll owe him an apology.`)} A pause. ${say('N', `I'm not going to owe him an apology, am I.`)} None does. At the sixth house, the Eevee tells him something that makes him sit down on the step for a long time. He doesn't say what. It's in the notebook, under "Don't."`, ...quiet(), flag('plasma-op-rare-n'))),
  ], { cast: [N], pokemon: 'eevee' }),
  op('cold-storage', 'The Cold Storage', 5, `The order: guard a refrigerated lorry at Driftveil. Don't open it. Don't read the manifest.`, [
    ch('Guard it.', out(`It hums all night. In the morning, it drives north.`, meters(1))),
    ch('(Read the manifest.)', out(`A clipboard on the cab door. "Item 1: housing, splicer, 3 off. Item 2: collars, red, blank: 4,000. Item 3: tags, pre-printed." The tags are in a crate with a loose lid. Each has a town on it. And a date. The dates haven't happened yet. It's the Speech's schedule: every square he means to stand in, for the next two months, and how many he expects each to yield. ${say('Emil, reading over your shoulder', `Anville: forty. Lacunosa: sixty-five. He's got a yield. He's worked out how many kind people there are in Lacunosa.`)}`, ...quiet(), room('px-op-cold-sheet'))),
  ], { tint: '#2a3440', ...{ requires: [...inUnova(5), night] } }),
  ev('px-op-cold-sheet', 'The Schedule', 'Evil Teams', { room: true, cast: [KNIGHT], tint: '#2a3440' }, `The crate's open. One sheet would never be missed.`, [
    ch('(Take one sheet.)', out(`The Schedule. With it, the next Speech's square is warned a node early. The yield's nought.`, flag('plasma-schedule'), intel(2))),
    ch('(Put the lid back.)', out(`You put the lid back. The dates stay where they are.`)),
  ]),
  op('bridge-toll', 'The Bridge Toll', 5, `The order: stop trainers on Skyarrow. Deliver the Speech, one to one. Turn back any who won't hear it.`, [
    ch('Deliver the Speech.', out(`Forty stopped. Some turned back.`, meters(1))),
    ch('(Stop them, and look their Pokémon over. Like a clinic.)', out(`${say('Emil, who\'s brought his old bag', `If we're to stand on a bridge stopping people, we'll be useful. Next.`)} A queue forms. It's a nuisance for six people. By the seventh, somebody's joined on purpose. A hiker and a Boldore: a cracked ear-crystal. "That's a week old. You've been walking on it. Rest it." A girl and a Deerling: nothing. "She's perfect. Who told you she wasn't?" ${say('The girl', `A man in a square.`)} A boy and a Scraggy: it's been fighting too much. "He's keen. You're keener. He's the one with the bruises. Halve it." A man and a Herdier: Emil knows this dog. He goes white. Then he looks at the man. It's not the same man. It's a different Herdier. "...Sorry. I thought— he's in lovely condition. Well done." It takes him a minute. Nobody's turned back. The report says: "Forty stopped. Forty heard." It's true. They heard a nurse.`, ...quiet(), heal(0.2))),
  ], { cast: [KNIGHT], pokemon: 'herdier' }),
  op('kings-errand', 'The King\'s Errand', 6, `It's N's order, not a Sage's. "Bring me one that's happy. I need to see it close. I'll know if it's lying." There's no quiet way. It's the hardest one. You bring your lead. ${say('N', `Hello. I'm going to listen to you. You don't have to say anything in particular.`)} A long time. You can't hear. You can only watch his face.`, [
    ch('(Wait.)', out(say('N', `It says it's waiting to see about you. That's fair. That's honest. I've not heard one say that; it's usually yes or no.`), meters(1), flag('n-heard-yours')), { requires: [{ kind: 'bondLevel', atLeast: 2, who: 'lead', absent: true }, flagIs('plasma-released-came-back', 0, 0)] }),
    ch('(Wait.)', out(say('N', `It says you forget its supper sometimes and it's forgiven you. It listed the occasions.`), meters(1), flag('n-heard-yours')), { requires: [{ kind: 'bondLevel', atLeast: 2, who: 'lead' }, { kind: 'bondLevel', atLeast: 4, who: 'lead', absent: true }, flagIs('plasma-released-came-back', 0, 0)] }),
    ch('(Wait.)', out(`${say('N', `It's told me a joke. About you. I didn't know they made— it's quite a rude joke.`)} He's laughing. ${say('N', `I thought the happy ones were lying. They're just busy.`)}`, meters(1), bondUp(1), flag('n-heard-yours')), { requires: [{ kind: 'bondLevel', atLeast: 4, who: 'lead' }, flagIs('plasma-released-came-back', 0, 0)] }),
    ch('(Wait.)', out(`${say('N', `It says you opened your hand and it didn't know what you wanted, so it came to ask.`)} He writes that down in full.`, meters(1), flag('n-heard-yours')), { requires: [flagIs('plasma-released-came-back')] }),
  ], { cast: [N] }),
];

// ---------- A. Twelve events for any player ----------
const U: Json[] = [
  ev('px-kennel-row', 'The Kennel Row', 'Lore', { requires: anyone(2), cast: [OLD], tint: '#3a3428' },
    `A long shed on the quay. Forty stalls, swept, empty. A brass plate over the door: THE OPEN GATE. FOUNDED BY F. MERROW. ${say('The kennelmaid, Mrs. Ardith Brightwell, seventy, with a broom', `Society kennels. I came at fifteen. We'd forty here, the year I started: whatever the ferry left. Nobody's brought one in three years. They go to the fields now.`)} ${say('Mrs. Brightwell', `I was here the day he came. The donor. Lovely coat. He walked the whole row, slow, and at every stall he asked the one thing: "And whose was this one?"`)} ${say('Mrs. Brightwell', `I thought: what a kind man, to care where they'd come from. I told him. Every one. Names, streets. He'd a little book.`)} ${say('Mrs. Brightwell', `It was years before I saw it. He wasn't asking where they'd come from. He was asking who lets go. He was making a list of the sort of person.`)}`,
    [
      ch('"What sort of person lets go?"', out(say('Mrs. Brightwell', `The ones who think about it. A hard man doesn't leave his Herdier on a quay; he sells it. It's the ones who can't afford the fare, and can't bear to drag it along hungry, and tell themselves it'll do better with someone else. He looked at forty stalls of that, and saw a method.`), flag('plasma-lore-kennels'), intel(3))),
      ch('"What was the Society for?"', out(say('Mrs. Brightwell', `For the ones the ferry left. You took them in, you fed them, you kept the gate open. Somebody nearly always came back.`), flag('plasma-lore-kennels'), intel(3))),
      ch('"Can I see the stalls?"', out(`Each has a hook, and on each hook a card, brown with age. A name. A date in. Most have a second date: COLLECTED. Somebody came back. ${say('Mrs. Brightwell', `Thirty-one of that forty. That's what the gate was open for.`)} She gives you a brass tag, blank, off an empty hook. A released wild Pokémon will always come to it.`, flag('plasma-lore-kennels'), flag('plasma-brass-tag'), intel(3))),
    ]),
  ev('px-walking-fence', 'Walking the Fence', 'Evil Teams', { requires: anyone(3), cast: [KNIGHT], pokemon: 'watchog', tint: '#4a5a38', effect: 'none' },
    `A field. A fence. Nine Pokémon along it, all facing the road. A man in a white hood, twenty yards back, behind a tree, where they can't see him. ${say('The Knight, Kendrick Lockwood, whispering', `Don't let him see you looking at me. The Watchog. Third from the left. If he sees me he'll think I've come.`)} ${say('Kendrick', `It's not allowed. It's not forbidden. We call it walking the fence. I do it from behind a tree, so it doesn't count.`)} ${say('Kendrick', `He's free. Look at him. All that field. He's had six weeks of it. He's not moved from that post.`)}`,
    [
      ch('"Why the tree?"', out(say('Kendrick', `Because if I go to him I'll have taken it back. And if I stay away I'll have meant it. So I come, and I don't go to him. I've found the exact spot where I'm doing neither.`), room('px-walking-fence-2'))),
      ch('"What are the collars for?"', out(`${say('Kendrick', `Safety. So they can be found if—`)} He stops. ${say('Kendrick', `I've never asked "if."`)}`, room('px-walking-fence-2'))),
      ch(`"What's he waiting for?"`, out(`Kendrick doesn't answer. He knows.`, room('px-walking-fence-2'))),
    ]),
  ev('px-walking-fence-2', 'Walking the Fence', 'Evil Teams', { room: true, cast: [KNIGHT], pokemon: 'watchog', tint: '#4a5a38' }, `The Watchog's still at its post.`, [
    ch('(Read a collar.)', out(`A number. A town. A day of the week: MON.`, intel(3), flag('plasma-fence-monday'))),
    ch('(Hold out an open hand to the Watchog.)', out(`It looks. It doesn't come. It's not waiting for a hand. It's waiting for a person.`)),
    ch('"Go to him."', out(`${say('Kendrick', `And say what?`)} "Nothing. Stand where he can see." He comes out from behind the tree. He doesn't go to the fence. He just stands in the open. The Watchog's up on its hind legs. It doesn't leave the post. It's seen him. That's enough for today. He'll come nearer next Sunday.`, flag('plasma-kendrick-open'))),
  ]),
  ev('px-forty-chairs', 'Forty Chairs', 'Lore', { requires: anyone(2), cast: ['boss.npc_gentleman'], pokemon: 'pidove', tint: '#3a3428' },
    `A hall with a stage the height of a step. Forty wooden chairs, still set out in rows. A tea urn. ${say('The caretaker, Mr. Cormac Oldfield', `First one he ever gave was in here. Twenty years back. Forty came; I put out forty. I've not stacked them since. I couldn't say why. It felt like something'd been said in here and I oughtn't move the furniture.`)} ${say('Mr. Oldfield', `He was good. I'll not pretend he wasn't. He didn't shout. He asked. "How do you know it's happy?" I'd a Pidove. I went home and I looked at it for an hour.`)} ${say('Mr. Oldfield', `I opened the window. It went. I shut the window and I went to bed feeling like a saint.`)} ${say('Mr. Oldfield', `It was on the sill in the morning. Outside. It'd been there all night. It wanted its breakfast.`)} A pause. ${say('Mr. Oldfield', `I've left that window open twenty years. It comes and goes. That's all it ever wanted: for the window to be up to it.`)}`,
    [
      ch('"What did the others do?"', out(`${say('Mr. Oldfield', `Thirty-nine. I've asked round, over the years. Eleven let go that night. Nine got theirs back the way I did; they'd not gone far. Two didn't.`)} He straightens a chair that was straight. ${say('Mr. Oldfield', `There was a van, even then. Smaller.`)} He pours you a cup from the urn. It's been on twenty years. He's proud of it.`, flag('plasma-lore-hall'), flag('plasma-urn-tea'))),
      ch('"Did he say where they\'d go?"', out(`${say('Mr. Oldfield', `"Wherever they wish." I thought that was lovely.`)} He pours you a cup from the urn. It's been on twenty years. He's proud of it.`, flag('plasma-lore-hall'), flag('plasma-urn-tea'))),
      ch('"Why keep the chairs?"', out(`${say('Mr. Oldfield', `In case they're wanted.`)} He pours you a cup from the urn. It's been on twenty years. He's proud of it.`, flag('plasma-lore-hall'), flag('plasma-urn-tea'))),
    ]),
  ev('px-twelfth-draft', 'The Twelfth Draft', 'Evil Teams', { requires: anyone(3), cast: [SAGE], tint: '#3a3428', effect: 'none' },
    `A reading room. A Sage in a white robe at a long table, with twelve sheets laid out in a row, and a pen he isn't using. ${say('Sage Gorm, sonorous even at a whisper', `You'll forgive me. I'm at work. The Lord Ghetsis has asked for a new peroration and I find I can't— I've mislaid the thread.`)} ${say('Gorm', `I wrote the Speech. People don't know that. The first of these is entirely mine. "Some Pokémon are kept by people who shouldn't keep them." I stand by that. I'd say it in any hall.`)} He touches the fifth. ${say('Gorm', `"How do you know yours isn't one?" Mine, with his hand in it. A fair question.`)} He touches the twelfth, and takes his finger away. ${say('Gorm', `And this is what we say now. I've been reading them in order. I can't find where it stopped being mine.`)} Twelve lines, in order. Pick the one where it turned.`,
    [
      ch('(One of the first eight.)', out(say('Gorm', `No. That's still mine. I'd defend that.`))),
      ch(`(The ninth: "A good trainer would want to know.")`, out(`He reads it twice. ${say('Gorm', `..."A good trainer would." Yes. That's— it stops asking and starts sorting. If you keep yours, you're not a good one. I didn't write "good." That's his word, in my sentence.`)} ${say('Gorm', `One word. Eleven years ago. And I've said it in every square since, in my best voice.`)} He puts the cap on the pen. ${say('Gorm', `I'll not write him his peroration. I'll tell him I've mislaid the thread. It's true.`)}`, flag('gorm-ninth'), intel(2)), { prompt: prompt('aim-drag'), fail: out(`Your finger lands on the tenth. ${say('Gorm', `No. Nearer. It's nearer than that.`)} He finds the ninth himself, in the end, and reads it twice. ${say('Gorm', `..."A good trainer would." That's his word, in my sentence.`)}`, flag('gorm-ninth'), intel(1)) }),
      ch('(The twelfth.)', out(say('Gorm', `That's the end of the road. I'm looking for the fork.`))),
    ]),
  ev('px-a-tenth', 'A Tenth', 'Town', { requires: anyone(2), cast: [KNIGHT, GRUNT], tint: '#3a3428' },
    `A pier. A girl in a white hood with a collecting tin. Three yards off, a man in black at a noodle stall, counting out coins. ${say('The Knight, Gwendolen Hartley, eighteen', `For the freed! A tenth of what you can spare!`)} To you, lower: ${say('Gwendolen', `I've given a tenth of mine since spring. I do the tin on my day off. It's for their keep. The resettled ones. Feed, and so on.`)} ${say('The Crew Grunt, at the stall, to the cook', `Large. Extra egg. Friday, innit.`)}`,
    [
      ch('(Put a coin in the tin.)', out(`It rattles. Gwendolen beams.`)),
      ch(`"Where's the tin go?"`, out(say('Gwendolen', `To the Sage's office. Then— to the freed. I've not seen the next part. You don't need to see a thing to know it.`))),
      ch('(Watch the coin.)', out(`You follow one marked coin. In the tin. On a Sage's desk, in a stack. In an envelope: WAGES — COLLECTIONS. In the Crew Grunt's hand. On the noodle stall's counter, three yards from the tin it started in. "That's the same coin." ${say('Gwendolen', `...That's— no. That's for feed.`)} ${say('The Crew Grunt, mouth full', `Is it? I get mine Fridays. I never asked what from.`)} He looks at the tin. He looks at his bowl. "Extra egg," he says, to nobody, and puts the spoon down. Gwendolen keeps the tin. She writes on it, in pen: I will carry this one to the freed myself. She doesn't know where they are. It's the first time she's wanted to.`, flag('plasma-tin'), flag('plasma-coin-watched'), intel(3)), { prompt: prompt('aim-drag'), fail: out(`You lose the coin somewhere between the Sage's desk and the envelope. Gwendolen rattles the tin. It sounds full.`) }),
    ]),
  ev('px-too-clean', 'Too Clean', 'Lore', { requires: anyone(3), cast: ['boss.npc_lass'], pokemon: 'cinccino', tint: '#3a3448', effect: 'sparkle' },
    `A grooming parlour. A woman of about twenty with a Cinccino on her shoulder, both immaculate. ${say('The groomer, Ophelia Varley', `I'd a strange afternoon, when I was four. I've never known what to do with it.`)} ${say('Ophelia', `My father delivered stone. There was a big house being built, underground; he'd a contract. He took me once. I'd my Minccino. And there was a boy, at a window, low down, at ground level. My age. Green hair. I waved. He waved.`)} ${say('Ophelia', `I said, can I go and show him? And a nurse took me to a door. And a tall man looked at my Minccino; just looked; and he said: "Not that one. Too clean." And I was walked back to the cart.`)} ${say('Ophelia', `I thought I'd done something wrong. I washed her less, for a year.`)}`,
    [
      ch('"The boy waved back?"', out(say('Ophelia', `He did. Both hands. As if he'd never had anyone to wave at.`), flag('plasma-lore-wave'))),
      ch('"What did the nurse do?"', out(say('Ophelia', `She gave me a biscuit. She was crying. I thought that was about the biscuit.`), flag('plasma-lore-wave'))),
      ch(`"He's called N."`, out(say('Ophelia', `Is he. The one on the posters? I never put it together; the posters don't wave.`), flag('plasma-lore-wave'), flag('plasma-ophelia-named'))),
    ]),
  ev('px-wick-snuff-tallow', 'Wick, Snuff and Tallow', 'Lore', { requires: [...anyone(3), night], cast: ['boss.npc_sailor'], tint: '#1e2a38', effect: 'fog' },
    `A harbourmaster's hut. A logbook on a slope. A man with a pipe he's not allowed to light indoors. ${say('The harbourmaster, Mr. Ulysses Mossop', `Sixteen winters back. Three children on Pier Nine, living under a tarpaulin. I logged it; you log everything. "Three juveniles, no names given." I took them soup. They'd not say who they were. I wrote down what they called each other.`)} He turns the book. "The tall one: Wick. The quick one: Snuff. The little one, who was always cold: Tallow." ${say('Mr. Mossop', `Candle-ends. They'd been sleeping in a chandler's doorway before the pier. That's all they had to name each other out of.`)} ${say('Mr. Mossop', `A gentleman came. Cane. He said he'd a place for them. I was glad. I logged that too: "Taken into care." I've looked at that entry a good few times since I started seeing three in black on the rooftops.`)}`,
    [
      ch('"Did they go willingly?"', out(say('Mr. Mossop', `The little one held his coat. I remember thinking: he's good with children.`))),
      ch('"Would they know those names now?"', out(say('Mr. Mossop', `I'd like to think a name keeps. Soup does, in a way.`))),
      ch('(Copy the entry.)', out(`Three Names, copied out in your own hand.`, flag('plasma-three-names'))),
    ]),
  ev('px-man-thirsty', 'A Man Gets Thirsty', 'Evil Teams', { requires: anyone(4), cast: [SAGE], pokemon: 'krookodile', tint: '#6a5028', effect: 'none' },
    `A dune. A Sage sitting on it, in the sun, with a Krookodile asleep beside him and an empty flask upside down in the sand. ${say('Sage Ryoku, unhurried', `The desert keeps everything and judges nothing. I came out here to learn to be like it. A castle goes under the sand; the sand doesn't mind. I thought: that's how to serve a man like him. Keep. Don't judge.`)} ${say('Ryoku', `Two years. I've kept a great deal. Then, this morning, I finished my water, and I found I minded.`)}`,
    [
      ch('(Give him water.)', out(`He drinks. All of it. ${say('Ryoku', `...Judgment's a kind of thirst. I'd not known.`)} He tells you the castle's stair, and which doors are warded.`, intel(4), room('px-man-thirsty-2'))),
      ch('"What have you kept?"', out(say('Ryoku', `A king that's a fox. Four thousand in a hold. The fact that the table doesn't meet. I'm very full.`), room('px-man-thirsty-2'))),
      ch('"And the seventh chair?"', out(say('Ryoku', `It's yours, if you want it. He's said so. I'm to offer. I wouldn't sit in it. It's the only one he's ever dusted himself.`), room('px-man-thirsty-2'))),
    ]),
  ev('px-man-thirsty-2', 'A Man Gets Thirsty', 'Evil Teams', { room: true, cast: [SAGE], pokemon: 'krookodile', tint: '#6a5028' }, `The seventh chair. He's to offer it.`, [
    ch('Refuse the chair.', out(say('Ryoku', `Good. The sand'll have it.`), flag('plasma-seat-refused'))),
    ch('Accept it.', out(`From outside the Vigil, it opens the inside route late, at Rank 4, with Suspicion 5: nobody trusts a Sage who's never held a candle.`, mark('inside'), meters(0, 5, 4), flag('plasma-seat-accepted')), { requires: [{ kind: 'evil', team: 'plasma', inside: false }] }),
    ch('(Leave it with him.)', out(`He turns the empty flask the right way up, and waits.`)),
  ]),
  ev('px-three-mouths', 'Three Mouths', 'Lore', { requires: anyone(4), cast: [COLRESS], pokemon: 'hydreigon', tint: '#2a3440', effect: 'none' },
    `A lab bench. A notebook open at a page with a coffee ring on it. A man with a remarkable curl of hair, not delighted, for once. ${say('Colress', `Oh! Good. Somebody to say it to. I've an entry I don't care for.`)} He reads. ${say('Colress', `"Subject R. Hydreigon. Owner's own; volunteered by owner to establish safety. Procedure tolerated. Output +31%. Note: prior to procedure, the three heads disagreed. Frequently. Left wanted to eat; right wanted to sleep; centre arbitrated. Post-procedure: no disagreement observed."`)} ${say('Colress', `I wrote "tolerated." I've been looking at "tolerated." I'd a scale for it. Vocalisation, withdrawal, so on. It scored a four. Four's "tolerated."`)} ${say('Colress', `But it used to argue with itself! I'd watch it at feeding; it was the most interesting thing in the building! And now it's one opinion with three mouths, and that's— I've got it down as an improvement. Thirty-one per cent.`)}`,
    [
      ch('"Did you ask it?"', out(`He opens his mouth. He shuts it. ${say('Colress', `...I had a scale.`)}`, flag('colress-four'))),
      ch('"Did he mind?"', out(`${say('Colress', `He watched. He said, "Continue." I said, sir, it's at a four. He said, "I asked whether it worked, not whether it hurt."`)} A pause. ${say('Colress', `I'd never had those separated for me before. I'd thought they were the same reading.`)}`, flag('colress-four'))),
      ch('"Can it be undone?"', out(`${say('Colress', `In principle! One would need the subject to want something. Any small thing. Left to want dinner again.`)} He looks at your team. ${say('Colress', `Yours want things constantly. It's very noisy data. I envy it.`)}`, flag('colress-four'))),
    ]),
  ev('px-came-back', 'The Ones Who Came Back', 'Town', { requires: anyone(3), cast: ['boss.npc_lady'], pokemon: 'herdier', tint: '#3a3448' },
    `A Center lobby. It's full. Not of trainers. Thirty Pokémon, on the chairs, under the chairs, in the pot plant. No Balls. No people. ${say('The nurse, Sister Jocasta Redfern, at the end of her shift and the one before it', `They walk in. Since the Speeches. They're let go, and they don't know where to go, and this is the last place anyone was kind to them. So they come and sit.`)} ${say('Sister Redfern', `I can't treat them; there's nothing wrong. I can't release them; they're released. I can't ring the trainer; the trainer's been told it's a sin. So I've a waiting room of patients who are waiting for nothing I can give.`)} By the desk: a Herdier with grey on its muzzle, lying with its chin on the bell. ${say('Sister Redfern', `That one's a regular. From before. Three times in with "falls." I'd an orderly here who used to go white when he saw it carried in. He left. Joined them, I heard.`)}`,
    [
      ch('"The orderly. Emil?"', out(say('Sister Redfern', `You know him? Tell him: the Herdier's man let it go. At a Speech. Not for its sake; to look well in front of the neighbours. And it walked nine miles and came here. Tell Emil it's safe. Tell him it's on the bell.`), flag('plasma-herdier-message'))),
      ch('"What do they need?"', out(say('Sister Redfern', `Somebody to come for them. Or somebody to tell them nobody will. I can't do either.`))),
      ch('(Sit with them.)', out(`Your party sits too. By the end, a Purrloin's on your lead's back. One of the thirty follows you out, to the door, and watches you go, and goes back in.`, heal(), bondUp(1))),
    ]),
  ev('px-tell-emil', 'On the Bell', 'Evil Teams', { requires: [...anyone(3), flagIs('plasma-herdier-message'), flagIs('ally-emil'), once('emil-herdier')], cast: [KNIGHT], tint: CANDLE },
    `Emil's on his pallet, mending a tabard badly. You tell him: the Herdier's man let it go. It walked nine miles. It's on the bell.`,
    [ch('"It\'s safe."', out(`${say('Emil', `It's— on the bell.`)} He sits down. ${say('Emil', `Nineteen years I wanted that one out of that house. And he did it for me. For the wrong reason. And it went to Jocasta.`)} He's laughing. It isn't quite.`, flag('emil-herdier')))]),
  ev('px-snow-in-july', 'Snow in July', 'Town', { requires: anyone(4), cast: [DRAYDEN], tint: '#c8d0e0', effect: 'snow' },
    `A street with the bunting still up from a summer fête. A foot of snow on it. Children in sandals and coats, building something. ${say('A child', `It's a snow Haxorus. The Mayor said it wasn't to scale. We said he could do the tail, then.`)} An enormous man with a beard like a snowplough, on his knees, doing the tail, badly. ${say('Drayden', `I kept two pieces of metal in a vault for forty years so that this wouldn't happen. A man walked in and asked for them in such a reasonable voice that I'd have felt rude.`)} He pats the tail. It falls off. ${say('Drayden', `I'm building a snow dragon with nine-year-olds. It's the only thing I've done right since.`)}`,
    [
      ch('"What did he say, to get them?"', out(`${say('Drayden', `"Surely a man of your standing doesn't need a lock to keep his word." I opened it to show him I didn't.`)}`, room('px-snow-in-july-2'))),
      ch('(Help with the tail.)', out(`It stays on. The children cheer. Drayden pretends not to.`, room('px-snow-in-july-2'))),
      ch(`"Aren't they cold?"`, out(`${say('The child', `Yes. It's brilliant.`)}`, room('px-snow-in-july-2'))),
    ]),
  ev('px-snow-in-july-2', 'Snow in July', 'Town', { room: true, cast: [SAGE], tint: '#c8d0e0', effect: 'snow' },
    `At the end of the street, alone, in furs, with his face turned up and his eyes shut: an old man the children give a wide berth. ${say('Zinzolin', `Don't speak. It's exactly right. For once the outside's the same as the in.`)} A snowball hits him in the ear. He opens one eye. ${say('A child, appalled at herself', `Sorry!`)} ${say('Zinzolin', `...Do that again.`)} She does. He's not smiling. Something's happening to his face that's adjacent.`,
    [ch('(Make a snowball.)', out(`It doesn't melt. You keep it.`, flag('unova-july')))]),
  ev('px-gate-1', 'The Gate', 'Town', { requires: [...anyone(4), once('px-gate-1')], cast: [OLD], tint: '#3a3428' },
    `Mother Merrow's gate, on the quay. Iron. It's been open a hundred and ten years. The hinges have rusted that way. ${say('Mrs. Brightwell, with an oil can', `I do the hinges every spring. Not so it'll shut. So it could. An open gate's only open if it's a choice.`)}`,
    [ch('(Oil the other hinge.)', out(`She nods.`, flag('px-gate-1')))]),
  ev('px-gate-2', 'The Gate', 'Town', { requires: [...anyone(5), flagIs('px-gate-1'), once('px-gate-2')], cast: [OLD, GRUNT], tint: '#3a3428' },
    `A notice, nailed up: BY ORDER OF THE SAGES, THIS PREMISES IS CLOSED. Two of the Crew with a chain. ${say('A Crew Grunt', `It's just a gate, love.`)} ${say('Mrs. Brightwell', `Then you'll not mind leaving it.`)}`,
    [
      ch('Battle.', fight(`They put the chain down first.`, { ...trainer('Crew Grunts', { sprite: GRUNT, team: ['liepard', 'scrafty', 'watchog'], size: 3, lv: 0, format: 'doubles', win: [flag('px-gate-2')], lose: [flag('px-gate-2')] }) })),
      ch('(Stand in the gate.)', out(`You stand in an open gate. The Crew look at the chain. They look at an old woman and a stranger. "...It's not on the urgent list." They go.`, flag('px-gate-2'))),
    ]),
  ev('px-gate-3', 'The Gate', 'Town', { requires: [...anyone(6), flagIs('px-gate-2'), once('gate-open')], cast: [OLD], pokemon: 'lillipup', tint: '#3a3428' },
    `Something's sitting in the gateway. Red collar. It's walked here. It's heard there's a gate.`,
    [ch('(Take the collar off.)', out(`Mrs. Brightwell hangs it on a hook in the row, with a card: a date in. The second date's left blank, for now. In every ending, the gate's open.`, flag('gate-open')))]),
];
// U7's Three Names add "You had them already" to the Triad (Volume III D); the triad scene is in -4.
(U[7] as Json).remembers = [{ id: 'named', when: [flagIs('plasma-three-names')], notice: `You've the copied entry in your pocket.` }];
// U6: if the player's on a route that meets N, it can be told.
(U[6] as Json).remembers = [{ id: 'n', when: [flagIs('plasma-ophelia-named'), { kind: 'evil', team: 'plasma', inside: true }], notice: `You tell N, later. ${say('N', `...A girl. At the low window. With something white on her shoulder that was laughing. I thought I'd dreamed that. I thought I'd made up one happy one, to see what it'd be like.`)} He writes it down. It isn't in the count of four hundred. He starts a new page.` }];
(U[1] as Json).remembers = [{ id: 'monday', when: [flagIs('plasma-collections')], notice: `You've ridden the Monday van. You know what the tyre tracks are.` }];

export const EVENTS: Json[] = [...WATCH, ...COLL, ...KING, ...TABLE, ...OPS, ...U];
export const REMOVE: string[] = [];
