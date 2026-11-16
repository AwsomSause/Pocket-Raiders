// Catalog Overhaul batch 5, row E: PAST ALLIES, same-run versions (QUESTLINES_PAST_ALLIES_AND_FUTURE.md PA1-PA10 + the ledger lines).
// Kice's run memory rule: nothing comes from an earlier run. Every "past" here is earlier in THIS run (core/co/pastAllies.ts):
// the run's big battles (frames: your team that day, won or lost, and the foe's), the rival lines said, the item an event took,
// the Pokémon you left behind. Tokens: {pa:won} {pa:fell-where} {pa:best-team} {pa:frames} {pa:lost} {pa:ranch} {pa:starter} ...
// ghost-trainer-reunion is PA1 The Ones You Left, already built same-run by Greenneedle (gn-new-13-door): merged there.
// Status note: docs/status/co-legends-rules-de.md. Build: npm run co:build -- legends-pastallies
import { $, any, ch, companion, ev, fight, flag, flagAgo, flagAt, flagIs, fr, item, out, room, rp, trainer, type Json } from '../dsl.ts';
import { note, page, script, who } from './_rivals.ts';

export const CATEGORY = 'legends';

const PA = 'Past Allies';
const has = (h: string, atLeast = 1): Json => ({ kind: 'pastAlly', has: h, atLeast });
const no = (key: string): Json => ({ kind: 'flag', key, atLeast: 0, atMost: 0 });
const moment = (text: string, importance = 60): Json => ({ kind: 'moment', text, importance });
const attr = (key: string, amount: number): Json => ({ kind: 'attribute', key, amount });
const hall = (name: string, pick: string, win: Json[], lv = 0, size = 6): Json => ({ ...trainer(name, { size, lv, win, friendly: true, cls: 'ace-trainer' }), pastAlly: pick, lose: [] });
const tag = (species: string, o: { battles?: number; region?: boolean; boost?: string } = {}): Json => ({ kind: 'tagPartner', copy: 'lead', battles: o.battles ?? 3, species, ...(o.region ? { region: true } : {}), ...(o.boost ? { boost: o.boost } : {}) });

// ---------- PA5 The Veteran Returns: Arlen, with a Garchomp (cameo-veteran-garchomp) or a Lucario (cameo-veteran-lucario) ----------
// Same run: Arlen saw you go down earlier in this run ({pa:fell-where}) and tells it back without knowing it was you.
function veteran(id: string, mon: string, line: string, cast: string): Json[] {
  const A = (w: string): string => who('Arlen', w);
  const tell = `${id}-tell`;
  const joins = `${id}-joins`;
  const MON = mon === 'garchomp' ? 'Garchomp' : 'Lucario';
  const base = mon === 'garchomp' ? 'gible' : 'riolu';
  return [
    {
      id,
      requires: [has('fell'), no('arlen-met')],
      scene: { cast: [cast], pokemon: mon, tint: '#2a2428', effect: 'none' },
      intro: script(
        page('A dusty road. A hardened veteran in a battered cap falls into step beside you without asking.', `A ${MON} walks with them. Scarred, quiet, and watching you very closely.`),
        page(A('Heard you were in trouble.'), A('I fought beside someone like you once. Not long ago. Not far from here.')),
        page(A('They went down. I kept going.'), A('I\'ve been trying to work out why ever since.')),
      ),
      choices: [
        ch('"Fight with me."', out(script(page(A('Thought you\'d say that.'), `The ${MON} moves to your side like it has stood there before.`)), tag(mon), flag('arlen-met'), flag('arlen-fought'))),
        ch('"Tell me about them."', out(script(page('Arlen is quiet for three steps. Four.'), page(A('They had a {pa:starter}. Stubborn little thing.'), A('They went down at {pa:fell-where}.'), A('I keep thinking, if I\'d been faster...'))), flag('arlen-met'), flag('arlen-told'), room(tell))),
        ch('"Go home."', out(script(page(A('Haven\'t got one.'), `They touch the brim of the cap. The ${MON} looks back at you once, and then they are gone.`)), flag('arlen-met'))),
      ],
      remembers: [
        { id: 'line', when: [{ kind: 'partyLine', species: base }], notice: note(page(`Your own ${MON} line steps out of its Ball by itself.`, `It and Arlen's ${MON} stand nose to nose for a long moment. Neither looks away.`)) },
        { id: 'since', when: [has('won')], notice: note(page(A('Heard they got back up, in the end. Won at {pa:won}.'), 'Arlen does not say the line about being faster. Not this time.')) },
      ],
    },
    ev(tell, `${line}: Whose Fault`, PA, { room: true, stop: 'event', rarity: 'rare', types: [], cast: [cast], pokemon: mon, tint: '#2a2428', effect: 'none' },
      script(page('Arlen is waiting for you to say something. The road is very quiet.', `The ${MON} sits down in the dust between you.`)),
      [
        ch('"It wasn\'t your fault."', out(script(page('Arlen is quiet for a long time.', 'Then they nod, once, and walk on beside you, closer than before.')), tag(mon))),
        ch('"It was mine."', out(script(page('Arlen looks at you for a long, long time.', A('...Huh.')), page(`They do not ask. They just stay. The ${MON} stays too, for the rest of the region.`)), tag(mon, { region: true }), flagAt('arlen-mine'))),
        ch('"Then be faster now."', out(script(page('Arlen grins for the first time.', A('Yeah. Yeah, all right.'), `The ${MON} is already moving.`)), tag(mon, { boost: 'spe' }))),
      ]),
    // "It was mine": the partner may join after the region ends.
    ev(joins, `${line}: Left Behind`, PA, { callback: true, stop: 'event', rarity: 'rare', types: [], minStage: 1, requires: [flagAgo('arlen-mine', 1), no(`${id}-joined`)], cast: [], pokemon: mon, tint: '#2a2428', effect: 'hearts' },
      script(
        page(`Arlen is gone. The ${MON} is not.`, 'It is sitting by the road at the start of the new region, as if it was told to wait here.'),
        page('There is a note tied to its arm, in square handwriting.', who('Note', 'It picked you. Don\'t make me come back for it.')),
      ),
      [
        ch(`Take the ${MON} with you.`, out(`The ${MON} falls in beside you without a sound.`, { kind: 'join', species: [mon], types: [], levelBonus: 0, shinyMultiplier: 1, asIs: true }, flag(`${id}-joined`))),
        ch('Send it after Arlen.', out('It looks at you for a long time. Then it goes, quickly, the way Arlen went.', flag(`${id}-joined`), attr('goodEvil', 1))),
      ]),
  ];
}

export const EVENTS: Json[] = [
  // ---------- A Familiar Face Steps In: the trainer you beat in this run's newest big win owes you one ----------
  {
    id: 'cameo-ally-assist',
    requires: [has('won'), no('cameo-used')],
    intro: script(
      page('Two trainers have been eyeing your party for a while. They are not subtle about it.', 'Then a third shadow falls across the road.'),
      page(who('A familiar face', 'Remember me? {pa:won}.'), who('A familiar face', 'You beat me fair. Figured I owed you. Need a hand?')),
    ),
    choices: [
      ch('Accept their help.', fight(script(page('They step up beside you. Their ace comes out of its Ball already looking for a fight.', 'The two trainers exchange a look. Too late to back out now.')),
        { ...trainer('Road Duo', { cls: 'ace-trainer', size: 2, lv: 1, win: [$(500), fr(3, 'party')], friendly: true }), ally: 'past', lose: [] }, flag('cameo-used'))),
      ch('Decline politely.', out(script(page('"Thank you. I\'ve got this."', who('A familiar face', 'Figured you\'d say that.'), 'They stay anyway, leaning on a fence, until the two trainers lose interest and leave.')), flag('cameo-used'), attr('charisma', 1))),
    ],
  },

  // ---------- Old Friends, New Run: the stranger read about you, earlier in this run (the run's own record) ----------
  {
    id: 'ng-plus-old-friends',
    requires: [has('won')],
    intro: script(
      page('A stranger stops you in the road with a newspaper folded under their arm.', 'They smile like they know you.'),
      page(who('Stranger', 'I read about you. {pa:won}.'), who('Stranger', 'That was really you? You really did that?')),
    ),
    choices: [
      ch('Tell the tale.', out(script(page('You tell it. Your team keeps interrupting with their own parts.', 'By the end there is a small crowd. Someone claps.')), fr(3, 'party'), rp(4), $(300))),
      ch('Deny everything.', out(script(page('"Never heard of them."', who('Stranger', 'Right. Of course.'), 'They wink. They tell everyone anyway.')), attr('charisma', 1))),
      ch('"What did they write about my team?"', out(script(page(who('Stranger', 'Just the names. {pa:won-team}.'), 'You hear them read aloud by someone else. They sound like a legend. They sound like yours.')), fr(5, 'party'), moment('A stranger read my team\'s names out of the paper.', 50))),
    ],
    remembers: [
      { id: 'fell', when: [has('fell')], intro: script(
        page('A stranger stops you in the road with a newspaper folded under their arm.', 'They smile like they know you.'),
        page(who('Stranger', 'I read about the last time. {pa:fell}, at {pa:fell-where}.'), who('Stranger', 'Everyone said that was the end of you. And here you are.')),
      ) },
    ],
  },

  // ---------- The Champion Who Came Before: the Hall rebuilds your best team of this run (won) ----------
  {
    id: 'champion-defense',
    requires: [has('best')],
    intro: script(
      page('A banner hangs over the Hall\'s field. It bears a name you know: yours, from {pa:best}.', 'Today the Hall has rebuilt that team and put it on the field.'),
      page('{pa:best-team}. The same Pokémon, as strong as the road has made you since.', 'It is not a replay of how you won. It is the team, asking to be beaten by what you are now.'),
    ),
    choices: [
      ch('Defend your name.', fight('You take the field opposite yourself. The crowd does not know who to cheer for. Neither do you.', hall('The Team That Won', 'best', [$(3000), any('nugget', 'big-nugget', 'pp-up'), rp(15), attr('strength', 1)]))),
      ch('Salute and walk on.', out(script(page('You salute the banner. Down on the field, the old team turns to watch you go.', 'You wonder if they were proud. You decide they were.')), rp(10))),
    ],
  },

  // ---------- The Team That Fell Short: the Hall rebuilds your team from the big battle you lost this run ----------
  {
    id: 'retired-team',
    requires: [has('fell')],
    intro: script(
      page('A weathered banner hangs over an empty field. It names a team that fell short: yours, at {pa:fell-where}.', '{pa:fell}.'),
      page('Today the Hall has set that team out again. {pa:fell-team}. Same Pokémon, same hearts.', 'They have something to prove. So, it turns out, do you.'),
    ),
    choices: [
      ch('Give them the rematch.', fight('They fight the way you fought that day: too brave, a little desperate. You know every one of their mistakes. You made them.', hall('The Team That Fell Short', 'fell', [$(2000), any('nugget', 'pearl', 'big-pearl'), rp(15), attr('strength', 1)]))),
      ch('Let them rest.', out(script(page('You stand at the edge of the field until the banner stops moving.', 'Then you tell your team, quietly, that you are proud of that day too.')), rp(10), fr(3, 'party'))),
    ],
  },

  // ---------- Rival's Friend: the rival's team from the last time you beat them, brought by a friend ----------
  {
    id: 'rivals-friend',
    requires: [has('rival')],
    intro: script(
      page('A stranger steps in front of you. They have a Pokédex open to a page they have clearly read many times.'),
      page(who('Stranger', 'My friend says you\'re the one to beat. {rival}. You know them.'), who('Stranger', 'I borrowed their team from that day. {pa:rival-team}. I want to see for myself.')),
    ),
    choices: [
      ch('Accept the challenge.', fight('Every Pokémon on their side looks at you like it remembers. It does.', hall('Rival\'s Friend', 'rival', [$(800), any('nugget', 'pearl', 'big-pearl'), rp(5)], 1))),
      ch('Decline.', out(script(page(who('Stranger', 'Huh. They said you\'d never turn down a fight.'), 'They write something in the Pokédex margin. You feel judged.')))),
    ],
  },

  // ---------- PA7 The Archive: frames of the teams you raised on this road; they step out ----------
  {
    id: 'archive-gauntlet-entry',
    requires: [has('second', 2)],
    intro: script(
      page('A dusty archive hall. Frames on the wall show the teams you have raised on this road, one big battle each.', 'One by one, they begin to move.'),
      page(who('Caretaker', 'They\'re not ghosts. They\'re records. They just like to stretch.'), who('Caretaker', 'You can fight any of them. Or you can just look.')),
    ),
    choices: [
      ch('Fight the earliest.', fight('Your earliest team steps down out of its frame. It is smaller than you remember. It is braver than you remember, too.', hall('Your Earliest Team', 'earliest', [$(800), rp(10), fr(3, 'party'), moment('Fought my earliest team in the Archive.')], 0, 4), flag('archive-visited'))),
      ch('Fight the best.', fight('Your best team steps down out of its frame, and the whole hall goes quiet.', hall('Your Best Team', 'best', [$(1500), any('nugget', 'pp-up'), rp(15), moment('Fought my best team in the Archive.')], 1), flag('archive-visited'))),
      ch('Just look.', out(script(page('You walk the wall slowly. Each frame has a caption, in a hand that looks a lot like yours.'), page('{pa:frames}')), fr(2, 'party'), rp(5), flag('archive-visited'))),
    ],
    remembers: [{ id: 'frame', when: [flagIs('archive-visited')], notice: note(page('There is a new, empty frame at the end of the wall. Its little brass plate already has your name on it.')) }],
  },

  // ---------- The Lost-and-Found Desk: the item an event took from you this run ----------
  {
    id: 'lost-and-found-desk',
    requires: [has('lostItem')],
    intro: script(
      page('A clerk behind a cluttered desk looks up as you come in.', who('Clerk', 'Something turned up that has your journey written all over it.')),
      page(who('Clerk', 'Handed in a while back. Somebody found it on the road you came by.'), 'It is your {pa:lost}. The one you lost.'),
    ),
    choices: [
      ch('Claim it.', out(script(page('The clerk slides it over and stamps a form that says RETURNED in red.', 'It is a little scuffed. It is very much yours.')), { kind: 'pastAlly', action: 'returnItem' })),
      ch('Leave it for someone who needs it more.', out(script(page(who('Clerk', 'You\'re sure?'), 'You are. The clerk writes FOR WHOEVER on a tag and ties it on, carefully.')), attr('goodEvil', 1), rp(5))),
    ],
  },

  // ---------- A Friend for the Road: a companion walks this stage with you (patches your partner once per fight) ----------
  {
    id: 'companion-recruit',
    requires: [no('companion-recruited')],
    intro: script(
      page('A capable traveler with a first-aid satchel falls into step beside you.', who('Traveler', 'You look like you could use a medic.')),
      page(who('Traveler', 'I\'m going your way for a while. When your partner\'s in trouble, I can patch it up. Once per fight.')),
    ),
    choices: [
      ch('Welcome them aboard.', out(script(page('They walk with you. They hum. They know the names of every plant on the road.', 'When the stage ends, they will go their own way. You find you are already a little sad about that.')), companion(1), flag('companion-recruited'))),
      ch('Travel alone.', out('You thank them. They nod, unoffended, and take the other fork.', flag('companion-recruited'))),
    ],
  },

  // ---------- The Archive rooms (rk-*): the places in the run where this run's own records are visible ----------
  {
    id: 'rk-anniversary-archive',
    intro: script(
      page('A hidden archive opens only for runs that have come this far.', 'Shelves of photos and trinkets. You recognise them: all of them are from this journey.'),
      page('{pa:frames}'),
    ),
    choices: [
      ch('Read the journal.', out(script(page('The journal is in your handwriting. You do not remember writing it.', 'You read every page. Some of them you would write differently now. You would not change a single one.')), rp(20), attr('goodEvil', 1), moment('Read my own journal in the Anniversary Archive.', 55))),
      ch('Take a trinket from the shelf.', out('You take one small thing from the shelf. The archive does not mind. It was always going to be yours.', any('nugget', 'big-pearl', 'pearl', 'star-piece', 'stardust', 'comet-shard', 'relic-gold', 'rare-bone', 'big-mushroom'), item('rare-candy'))),
      ch('Leave a note for the end of the road.', out(script(page('You write a note to whoever you will be when this run ends.', 'You fold it twice and leave it in the Hall of Records\' box. Someone will put it in a case.')), flag('rk-archive-note'), rp(10))),
    ],
  },
  {
    id: 'rk-coin-vault',
    intro: script(
      page('A round vault door with a coin slot, polished by a lot of hopeful hands.', who('Brass plate', 'What goes in turns into research that outlasts your run.')),
      page('Behind the door, faintly, a machine counts and counts.'),
    ),
    choices: [
      ch('Deposit ₽200.', out('The coins rattle down a long way. The counting gets slightly louder.', $(-200), rp(12)), { requires: [{ kind: 'money', atLeast: 200 }] }),
      ch('Deposit ₽600.', out('The coins rattle down. A light above the door blinks, once, pleased.', $(-600), rp(45)), { requires: [{ kind: 'money', atLeast: 600 }] }),
      ch('Deposit ₽1500.', out('The vault hums. Somewhere a little bell rings, as if somebody important just got some good news.', $(-1500), rp(130)), { requires: [{ kind: 'money', atLeast: 1500 }] }),
      ch('Keep your coins.', out('You keep them. The machine keeps counting anyway.')),
    ],
  },
  {
    id: 'rk-hall-of-records',
    intro: script(
      page('Glass cases line the walls: your best moments on this road, wins and wild ones.', 'The biggest case holds {pa:best}. {pa:best-team}, in little brass figures.'),
      page('A plaque offers a challenge. Under it, in smaller print: "Records are for breaking."'),
    ),
    choices: [
      ch('Study the records.', out('You study every case. You find a mistake you made back then, and you understand it now.', rp(15), attr('intelligence', 1))),
      ch('Take the plaque\'s challenge: no healing stops.', out(script(page('You sign the plaque. The ink is still wet when your team looks at you like you have lost your mind.', 'Then they look determined.')), { kind: 'relic', id: 'rk-records-challenge', name: 'Record Challenge', effects: [{ kind: 'runRule', id: 'no-heal-stops' }, { kind: 'xpMultiplier', value: 1.3 }] })),
      ch('Admire and go.', out('You look at the cases one last time. Then you go and make some more.')),
    ],
    remembers: [{ id: 'note', when: [flagIs('rk-archive-note')], notice: note(page('In the last case, under glass, is a folded note in your handwriting.', 'You do not open it. You know what it says. It says keep going.')) }],
  },
  {
    id: 'rk-legacy-pedestal',
    intro: script(
      page('A stone pedestal waits by the road with room for one thing.', 'Trainers leave things here for whoever comes after them. Whoever takes one, pays it forward.'),
      page('It is empty today. It looks like it is waiting for you.'),
    ),
    choices: [
      ch('Leave a Potion for whoever comes next.', out('You set it down. It looks very small on the big stone. It might be exactly enough for somebody.', { kind: 'pastAlly', action: 'pedestal', item: 'potion' }, flagAt('pedestal-left'), rp(10)), { requires: [{ kind: 'item', id: 'potion' }] }),
      ch('Leave a Poké Ball for whoever comes next.', out('You leave a Poké Ball. Somebody\'s first catch, maybe. You hope it is a good one.', { kind: 'pastAlly', action: 'pedestal', item: 'poke-ball' }, flagAt('pedestal-left'), rp(5)), { requires: [{ kind: 'item', id: 'poke-ball' }] }),
      ch('Walk on.', out('You walk on. Maybe next time.')),
    ],
  },
  ev('rk-legacy-pedestal-thanks', 'The Legacy Pedestal: Paid Forward', PA, { callback: true, stop: 'event', rarity: 'uncommon', types: [], minStage: 1, requires: [has('pedestal'), flagAgo('pedestal-left', 1)], cast: ['trainer.youngster_m'], tint: '#2a2410', effect: 'sparkle' },
    script(
      page('A young trainer runs up to you, out of breath, holding something out with both hands.', who('Young trainer', 'It was you, wasn\'t it? At the pedestal? The lady said it was you.')),
      page(who('Young trainer', 'It got me through. I don\'t need it now.'), who('Young trainer', 'So I\'m paying it forward. Back. Whichever.')),
    ),
    [ch('Thank them.', out('They grin, wave, and run off to wherever they are going next. It is a long way from here, and they are not afraid of it.', { kind: 'pastAlly', action: 'pedestalThanks' }, attr('goodEvil', 1), rp(20)))]),
  {
    id: 'rk-memory-lane',
    intro: script(
      page('A path of lanterns. Each one holds a scene from this road, small and bright.', 'Nothing here changes. But it is lovely to see.'),
      page('The first lantern holds {pa:earliest}. The team in it is so young.'),
    ),
    choices: [
      ch('Walk the whole lane.', out(script(page('You walk every lantern, slowly. Your team walks with you. They stop at the ones they remember.'), page('{pa:frames}')), moment('Walked Memory Lane.', 60), fr(2, 'party'), attr('goodEvil', 1))),
      ch('Stop at the first lantern.', out(script(page('{pa:earliest-team}. That was all of you, once.', 'You stay until the lantern flickers, then thank it, and go.')), moment('Stopped at the first lantern on Memory Lane.', 50), rp(2))),
    ],
  },

  // ---------- PA5 The Veteran Returns ----------
  ...veteran('cameo-veteran-garchomp', 'garchomp', 'A Veteran Returns', 'trainer.black_belt_m'),
  ...veteran('cameo-veteran-lucario', 'lucario', 'A Familiar Trainer', 'trainer.black_belt_m'),

  // ---------- PA8 The Ranch Keeper: an Egg from a Pokémon you left this run, with the highest Bond ----------
  {
    id: 'legacy-ranch',
    requires: [has('left'), no('ranch-done')],
    intro: script(
      page('A ranch at dusk. A rancher in big boots walks out to the fence with a blanket bundle in her arms.', who('Mags', 'Somebody left this with me. Said you\'d come by.')),
      page('An Egg. A paper tag on it with your name, in ink that has already started to fade.', who('Mags', 'It\'s from one of yours. Didn\'t say which. I\'ve kept it warm.')),
    ),
    choices: [
      ch('Take it.', out(script(page('It is warmer than you expected. Something inside it shifts, as if it knows your voice.', who('Mags', 'Three stages, give or take. Talk to it.'))), { kind: 'pastAlly', action: 'egg' }, flag('ranch-taken'), flag('ranch-done'))),
      ch('"Which one?"', out(script(page('Mags turns the tag over. On the back, a photo: {pa:ranch}. Looking straight at the camera, the way it used to look at you.'), page(who('Mags', 'That one. Thought so.'))), flag('ranch-asked'), room('legacy-ranch-photo'))),
      ch('Keep it here for now.', out(script(page(who('Mags', 'Suits me. It likes the barn.'), who('Mags', 'Come back when you\'ve crossed into new country. It\'ll be waiting at the fence.'))), flagAt('ranch-kept'), flag('ranch-done'))),
    ],
    remembers: [{ id: 'released', when: [has('ranchReleased')], notice: note(page(who('Mags', 'They brought it themselves, you know.'), who('Mags', 'Said they\'d been let go, and wanted you to have something.'))) }],
  },
  ev('legacy-ranch-photo', 'The Ranch Keeper: The Photo', PA, { room: true, stop: 'event', rarity: 'rare', types: [], cast: ['trainer.hiker'], tint: '#283018', effect: 'hearts' },
    script(page('You hold the photo for a long time. Mags does not hurry you.')),
    [
      ch('Take the Egg.', out('You tuck the photo into your bag, beside the Egg. They belong together.', { kind: 'pastAlly', action: 'egg' }, flag('ranch-taken'), flag('ranch-done'))),
      ch('Leave it with Mags a while.', out(script(page(who('Mags', 'I\'ll keep it by the stove.'), who('Mags', 'New country, then. It\'ll be waiting.'))), flagAt('ranch-kept'), flag('ranch-done'))),
    ]),
  ev('legacy-ranch-waiting', 'The Ranch Keeper: At the Fence', PA, { callback: true, stop: 'event', rarity: 'rare', types: [], minStage: 1, requires: [flagAgo('ranch-kept', 1), has('left'), no('ranch-collected')], cast: ['trainer.hiker'], tint: '#283018', effect: 'hearts' },
    script(
      page('Another ranch, another fence, and somehow the same Mags, waving both arms.', who('Mags', 'Told you it\'d wait. It\'s nearly out. Listen.')),
      page('Tap. Tap. A crack runs across the shell the moment you touch it.'),
    ),
    [ch('Hold it while it hatches.', out('It is warm, and impatient, and very nearly here.', { kind: 'pastAlly', action: 'egg', now: true }, flag('ranch-collected')))]),
];

export const REMOVE: string[] = ['ghost-trainer-reunion'];
