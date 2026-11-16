// Catalog Overhaul, families-c part 7: STORY_FAMILIES_10.md Part 0, the ids whose scenes are scripted in other docs
// (the ledger owner builds them, from the fullest script): A1 The Noble Frenzy (QUESTLINES_ALPHAS_AND_ANOMALIES.md),
// L1 The Three Beasts and L16 The Tower of Legends (QUESTLINES_LEGENDARY.md), GL3's vault
// (QUESTLINES_PAST_CHAMPIONS_AND_LEADERS.md), FE1/FE4/FE5 (QUESTLINES_DEEPENED_1.md), FE2/FE3/FE6
// (QUESTLINES_PAST_ALLIES_AND_FUTURE.md), and "The other roamers" (STORY_FAMILIES_10 Part 0).
// Memory stays inside the run (Kice's rule): FE1's letter, FE2's "past save" and FE3's capsule are kept in this run.
// Re-read log: docs/status/co-families-c.md.
import { $, again, any, bondUp, ch, ev, fight, flag, flagAgo, flagIs, good, heal, hurt, item, leave, out, room, roomFrom, takeNode, type Json } from '../dsl.ts';
import { done, notYet, repUp, ruled, stamped, tf, wf } from './_families-c-kit.ts';

export const CATEGORY = 'families-c';

const blessed = (o: { species?: string; atLeast?: number; has?: boolean } = {}): Json => ({ kind: 'blessed', has: o.has ?? true, ...(o.species ? { species: o.species } : {}), atLeast: o.atLeast ?? 0 });
const sign = (species: string, amount = 1): Json => ({ kind: 'sign', species, amount });
const anyFlag = (...keys: string[]): Json => ({ kind: 'anyFlag', keys });
const forRegion = (label: string, stat: string, value: number): Json => ({ kind: 'tempEffect', label, effects: [{ kind: 'statMultiplier', stat, value }], until: 'region' });
const nextFight = (label: string, stat: string, value: number): Json => ({ kind: 'tempEffect', label, effects: [{ kind: 'statMultiplier', stat, value }], battles: 1, until: 'battle' });

// ---------- A1 The Noble Frenzy (eight Nobles; calm them, don't beat them) ----------
// The fight is a wild battle with a Calm meter (rule `calm`): every turn the Noble is not hurt fills it. Full, the
// red goes out of its eyes (`co-calm-done`, read by the room after). Knocking it out is "defeated, not calmed".
const NOBLES: { id: string; name: string; district: string; frenzy: string; boon: string; stat: string; statName: string }[] = [
  { id: 'kleavor', name: 'Kleavor', district: 'the quarry', frenzy: 'Rockfalls close the quarry paths', boon: 'The quarry paths are clear and quick', stat: 'spe', statName: 'Speed' },
  { id: 'lilligant', name: 'Lilligant', district: 'the meadow', frenzy: 'The meadow\'s Grass-types turn on travellers', boon: 'The meadow blooms for you', stat: 'spd', statName: 'Sp. Def' },
  { id: 'arcanine', name: 'Arcanine', district: 'the burnt ridge', frenzy: 'Fire smoulders on every path', boon: 'The ridge cools, and its warmth is yours', stat: 'def', statName: 'Defense' },
  { id: 'electrode', name: 'Electrode', district: 'the static field', frenzy: 'Static crackles at every step', boon: 'The static settles into a spark', stat: 'spa', statName: 'Sp. Atk' },
  { id: 'avalugg', name: 'Avalugg', district: 'the snowfield', frenzy: 'Thin ice over every crossing', boon: 'The ice holds firm under you', stat: 'spe', statName: 'Speed' },
  { id: 'braviary', name: 'Braviary', district: 'the cliffs', frenzy: 'The sky routes are closed by a furious wind', boon: 'The wind is at your back', stat: 'atk', statName: 'Attack' },
  { id: 'ursaluna', name: 'Ursaluna', district: 'the wetland', frenzy: 'The wetland\'s resting places are flooded', boon: 'The wetland gives you good rest', stat: 'def', statName: 'Defense' },
  { id: 'wyrdeer', name: 'Wyrdeer', district: 'the forest edge', frenzy: 'The forest edge hides its paths in illusion', boon: 'The forest shows you its paths', stat: 'spa', statName: 'Sp. Atk' },
];
const INE = { cast: [], tint: '#4a2a2a', effect: 'shake' };
const nobleFight = (n: (typeof NOBLES)[number], calm: number, text: string, ...more: Json[]): Json =>
  fight(text, ruled(wf({ species: [n.id], lv: 3, win: [room(`alpha-noble-${n.id}-after`)] }, [frenzy(n), flag('noble-shamed', -99)]), { calm }, { aura: true }), ...more);
const frenzy = (n: (typeof NOBLES)[number]): Json => forRegion(`${n.name}'s frenzy: ${n.frenzy} (your team's ${n.statName} -5% this region)`, n.stat, 0.95);
const NOBLE_EVENTS: Json[] = NOBLES.flatMap((n) => {
  const calmIt = (text: string, ...more: Json[]): Json => ch('Calm it.', nobleFight(n, 3, text, ...more));
  return [
    ev(`alpha-noble-${n.id}`, `Frenzied Noble: ${n.name}`, 'Alpha Nobles', { ...INE, pokemon: n.id, requires: [notYet(`noble-${n.id}-done`)],
      remembers: [
        { id: 'ine-silent', when: [flagIs('noble-shamed')], notice: `Ine is here. She doesn't look at you. She hands you the balms without a word.`, hide: [0, 1, 2],
          addChoices: [ch('Calm it, alone.', nobleFight(n, 3, `You go up alone. Behind you, Ine says one thing: "Gently, this time."`, flag('noble-shamed', -99))), ch('Leave it.', out(`You walk away. The frenzy spreads through ${n.district}.`, frenzy(n), flag('noble-shamed', -99), done(`noble-${n.id}-done`)))] },
        { id: 'sash', when: [flagIs('warden-sash')], notice: `Ine's Warden sash is around your shoulders. The balms smell stronger with it.`, hide: [0, 1],
          addChoices: [ch('Calm it.', nobleFight(n, 2, `Ine: "You know how now. Two balms, behind the ear." She stays back and lets you go.`))] },
        { id: 'ine-again', when: [flagIs('noble-ine')], notice: `Ine is waiting at the edge of ${n.district}, balms ready. Ine: "It's a piece of something from the sky. It shouldn't have fallen."`, hide: [0, 1],
          addChoices: [calmIt(`Ine: "Same as before. Don't hit it. Survive it. The shard's behind its ear."`)] },
      ] },
      `A streak of light crosses the day sky and breaks apart. That night a Warden runs into town. Ine, a retired frontier scout: "The Noble of ${n.district}'s gone mad. Eyes red. Tearing the hillside down." ` +
        `Ine: "Nobles aren't monsters. They're the oldest of their kind. Something's in it." Ine: "You can't beat a Noble. You calm it. I'll show you how to make the balms."`,
      [
        ch('Show me.', nobleFight(n, 3, `Ine's camp: Berries from ${n.district}, crushed and wrapped in leaves. Then the hill. Ine, mid-fight: "There! The shard, behind its ear! Hit the balm there!" (Don't hurt it: each turn it isn't hurt calms it.)`, flag('noble-ine'))),
        ch('Why not beat it?', nobleFight(n, 3, `Ine: "Shame a Noble and it leaves. Its district goes with it." Then the camp, the balms, the hill. Ine: "Survive it. Don't hurt it. Let it see you're not afraid."`, flag('noble-ine'))),
        ch('Not my problem.', out(`Ine looks at you for a long moment, then goes alone. By morning the frenzy has spread through ${n.district}.`, frenzy(n), done(`noble-${n.id}-done`))),
      ]),
    ev(`alpha-noble-${n.id}-after`, `${n.name}, After`, 'Alpha Nobles', { ...INE, room: true, pokemon: n.id, effect: 'none',
      remembers: [
        { id: 'calmed', when: [flagIs('co-calm-done')], notice: `It's calm. The red has gone out of its eyes. Something small and bright falls from behind its ear.`, hide: [0],
          addChoices: [{ ...ch('Sit with it.', out(`It lowers its great head beside you and breathes. Ine picks up the shard with a cloth. Ine: "It's a piece of something from the sky. It shouldn't have fallen." ${n.boon}.`,
            forRegion(`${n.name} calmed: ${n.boon} (your team's ${n.statName} +5% this region)`, n.stat, 1.05), flag('calmed-alpha'), flag('noble-calmed'), done(`noble-${n.id}-done`), good(1))),
          branches: [{ when: [flagIs('noble-calmed', 3)], text: `It lowers its head beside you and breathes. Ine lays the fourth shard with the others, and they all turn, like compass needles, towards the sky. Ine: "Whatever dropped these is still up there." She takes off her Warden sash and ties it around your shoulders. ${n.boon}.`,
            effects: [forRegion(`${n.name} calmed: ${n.boon} (your team's ${n.statName} +5% this region)`, n.stat, 1.05), flag('calmed-alpha'), flag('noble-calmed'), flag('warden-sash'), done(`noble-${n.id}-done`), good(1)] }] }] },
      ] },
      `It crashes down, beaten, and the shard behind its ear still burns. Before you can reach it, it drags itself up and flees deep into ${n.district}. Ine says nothing at all.`,
      [ch('Let it go.', out(`It's gone. The frenzy stays in ${n.district}, and Ine won't speak to you for a while.`, frenzy(n), stamped('noble-shamed'), done(`noble-${n.id}-done`)))]),
  ];
});

// ---------- L1 The Three Beasts (Thorne's lookout, three clues each, the Burned Tower) ----------
const THORNE = { cast: [], tint: '#1c2430', effect: 'glint' };
type Beast = { id: string; name: string; clue: string; clueName: string; scene: string; right: string; rightText: string; wrong: [string, string]; wrongText: [string, string]; tip: string };
const BEASTS: Beast[] = [
  { id: 'raikou', name: 'Raikou', clue: 'beast-clue-thunder', clueName: 'Thunder on a Clear Day', scene: 'Thunder rolls out of a perfectly clear sky. Once. Then nothing. The grass on the ridge is standing on end.',
    right: 'Wait.', rightText: 'You wait. The air hums. Far off, on a rock, something yellow and enormous turns its head towards you, and doesn\'t run. Then it\'s gone, and the grass lies down.',
    wrong: ['Throw a Ball.', 'Follow it.'], wrongText: ['The Ball hits empty rock. The sky is clear and silent again. It was never going to be that easy.', 'You run towards the sound. By the time you get there, there\'s only a scorched stone, still warm.'],
    tip: 'Thorne\'s tip, in the margin of her map: "Raikou wants you to wait."' },
  { id: 'entei', name: 'Entei', clue: 'beast-clue-ash', clueName: 'A Trail of Ash', scene: 'A trail of ash across the path. Strange: the grass under it is already growing back, green through grey.',
    right: 'Stand your ground.', rightText: 'Heat rolls over the hill. Something huge comes at you out of the smoke. You don\'t move. It stops an arm\'s length away, looks at you, and turns away. The grass is greener where it stood.',
    wrong: ['Run.', 'Hide.'], wrongText: ['You run. Behind you, a roar, and then the crackle of fire moving away. You never see it.', 'You hide behind a rock. The heat passes by, and keeps going. It didn\'t think you worth a look.'],
    tip: 'Thorne\'s tip, in the margin of her map: "Entei wants you to stand still while it comes at you."' },
  { id: 'suicune', name: 'Suicune', clue: 'beast-clue-ripple', clueName: 'Ripples on Still Water', scene: 'A pond without a breath of wind on it. And yet, in the middle, rings of ripples, spreading, as if something just stepped off the water.',
    right: 'Kneel at the water.', rightText: 'You kneel and put your hand in the water. It\'s very clear. On the far bank, something blue and white is watching you. It knows what you did yesterday. It stays a moment longer than it has to.',
    wrong: ['Call out.', 'Throw a Ball.'], wrongText: ['You call out across the water. The ripples stop. The pond is just a pond again.', 'The Ball splashes into the middle of the pond and sinks. The ripples stop.'],
    tip: 'Thorne\'s tip, in the margin of her map: "Suicune wants to know what you did yesterday."' },
];
const KIND_LATELY = anyFlag('cages-opened', 'kind-helped-stranger');
const BEAST_EVENTS: Json[] = [
  ev('beast-lookout', 'The Beasts\' Lookout', 'Legendary Beasts Chase', { ...THORNE, requires: [notYet('beast-lookout-met')] },
    'A hunter on a ridge with a telescope and a field journal swollen with thirty years of notes. Thorne, not looking away from the telescope: "All three are in the region. First time in eleven years. Want to know where?" ' +
      'Thorne: "Don\'t answer yet. Everyone says yes. Then they chase, and the beasts are gone." Thorne: "I\'ve never got close. I chase. That\'s my whole problem."',
    [
      ch('Show me where.', out('She marks three places on your map: thunder, ash, ripples. "Raikou wants you to wait. Entei wants you to stand still while it comes at you. Suicune wants to know what you did yesterday."', done('beast-lookout-met'))),
      ch('Why tell me?', out('Thorne: "Because you didn\'t run up here." She marks the map, and writes a tip beside each place in small, careful letters. Then she goes back to the telescope.', done('beast-lookout-met'), flag('beast-thorne-trust'))),
      ch('Keep your secrets.', out('Thorne shrugs. When she packs up and leaves, her field journal is still on the rock. Thirty years of notes. She hasn\'t noticed.', done('beast-lookout-met'), flag('beast-journal'))),
    ]),
  ...BEASTS.map((b) => {
    const regard = `beast-regard-${b.id}`;
    const driven = `beast-driven-${b.id}`;
    const wrong = (i: 0 | 1): Json => ({ ...ch(b.wrong[i], out(b.wrongText[i], flag(driven), again(b.clue))),
      branches: [{ when: [flagIs(driven, 2)], text: `${b.wrongText[i]} Thorne finds you later. Thorne: "Three times. It's left the region. I don't blame it."`, effects: [flag(driven)] }] });
    return ev(b.clue, b.clueName, 'Legendary Beasts Chase', { cast: [], pokemon: b.id, tint: '#14141f', effect: 'fog', requires: [flagIs(regard, 0, 2), flagIs(driven, 0, 2), notYet('beast-chosen')],
      remembers: [{ id: 'tip', when: [flagIs('beast-thorne-trust')], notice: b.tip }] },
      b.scene,
      [
        { ...ch(b.right, out(b.rightText, flag(regard), again(b.clue)), b.id === 'suicune' ? { requires: [KIND_LATELY] } : {}),
          branches: [{ when: [flagIs(regard, 2)], text: `${b.rightText} That's three. Somewhere, a tower is waiting.`, effects: [flag(regard)] }] },
        wrong(0),
        wrong(1),
      ]);
  }),
  ...BEASTS.map((b) => {
    const thorneFirst = nextFight('Thorne touched its mane: your lead starts the battle a step ahead (+1 Speed)', 'spe', 1.5);
    const battle = (text: string, ...more: Json[]): Json => fight(text, wf({ species: [b.id], lv: 3, win: [done('beast-chosen'), sign('raikou'), sign('entei'), sign('suicune')] }, [done('beast-chosen')]), ...more);
    return ev(`roamer-${b.id}`, `${b.name} Is Here`, 'Roaming Legendaries', { cast: [], pokemon: b.id, tint: '#14141f', effect: 'glint', callback: true, requires: [flagIs(`beast-regard-${b.id}`, 3), notYet('beast-chosen')],
      remembers: [
        { id: 'journal', when: [flagIs('beast-journal')], notice: 'Thorne\'s journal is still in your bag. You never opened it.',
          addChoices: [ch('Give Thorne her journal.', out('Thorne stares at it. Thorne: "You kept my notes and brought them up here. You could have used them." She turns to the last page, blank, and holds out the pen. You sign it. Then the beast looks at you, and the battle is offered.', room(`roamer-${b.id}-tower`), flag('beast-journal', -99)))] },
      ] },
      `The top floor of the Burned Tower. ${b.name} is waiting, as if it always knew you would come. Thorne, behind you, whispering: "Thirty years. Don't you dare throw anything until it looks at you." It looks at you. Then past you, at Thorne.`,
      [
        ch('Battle it.', battle(`A fair battle. ${b.name} lowers its head.`)),
        ch('Let Thorne go first.', out(`Thorne walks up to it. It lets her touch its mane. She cannot speak. Then it turns back to you.`, thorneFirst, room(`roamer-${b.id}-tower`))),
        ch('Step aside.', out(`It leaves, unhurried, down the stairs. Thorne doesn't understand why you did that. Then, slowly, she does. Word gets around.`, done('beast-chosen'), { kind: 'rivalChange', feelings: { admiration: 1 } }, repUp(1))),
      ]);
  }),
  ...BEASTS.map((b) => ev(`roamer-${b.id}-tower`, `${b.name}, Face to Face`, 'Roaming Legendaries', { cast: [], pokemon: b.id, tint: '#14141f', effect: 'glint', room: true },
    `${b.name} is still there. It's waiting for you now.`,
    [
      ch('Battle it.', fight(`A fair battle. It's what it came for.`, wf({ species: [b.id], lv: 3, win: [done('beast-chosen'), sign('raikou'), sign('entei'), sign('suicune')] }, [done('beast-chosen')]))),
      ch('Let it go.', out('It bows its head to Thorne, and to you, and goes.', done('beast-chosen'), repUp(1))),
    ])),
];

// ---------- The other roamers (Influence decides the chance; with Influence it can be met again) ----------
const ROAMERS: { id: string; name: string; sign: string }[] = [
  { id: 'cresselia', name: 'Cresselia', sign: 'A crescent of silver light on the dew, fading as you look at it.' },
  { id: 'landorus', name: 'Landorus', sign: 'A field ploughed overnight, furrows straight as a ruler, by nobody.' },
  { id: 'latias', name: 'Latias', sign: 'A red streak low over the water, and a girl\'s laugh where no girl is.' },
  { id: 'latios', name: 'Latios', sign: 'A blue streak high over the trees, and a feeling of being looked after.' },
  { id: 'mesprit', name: 'Mesprit', sign: 'Everyone on the road feels, for one moment, like crying, and then like laughing.' },
  { id: 'thundurus', name: 'Thundurus', sign: 'A scorched leaf, and thunder from a single cloud that\'s moving against the wind.' },
  { id: 'tornadus', name: 'Tornadus', sign: 'A cry in the air, and every weathervane in the village spinning the wrong way.' },
];
const ROAMER_EVENTS: Json[] = ROAMERS.flatMap((r) => [
  ev(`roamer-${r.id}`, `${r.name} Is Here`, 'Roaming Legendaries', { cast: [], pokemon: r.id, tint: '#14141f', effect: 'glint' },
    `Fresh tracks. ${r.sign} A Legendary has been seen here, and it won't stay. A local, pointing: "It went that way. You'll never catch it. Nobody does."`,
    [
      ch(`Follow the trail ({roam:${r.id}} chance).`, out('You follow it all day, through places the map doesn\'t know.', takeNode(), { kind: 'roamChase', species: r.id, found: `roamer-${r.id}-found` }, again(`roamer-${r.id}`))),
      { ...ch('Wait where it was.', out('You sit where the tracks end and rest. Nothing comes. But the waiting does you good.', heal(0.3), again(`roamer-${r.id}`), ...(r.id === 'mesprit' ? [sign('mesprit')] : []))),
        branches: [{ when: [blessed({ species: r.id })], text: `You sit where the tracks end and rest. At dusk, it comes back, and looks at you the way it looks at nobody else. A Sign.`, effects: [heal(0.3), sign(r.id), room(`roamer-${r.id}-found`)] }] },
      ch('Leave it be.', out('You let it go. You\'ll remember the way it went: next time, you\'ll be a little closer.', flag(`roam-${r.id}-left`), again(`roamer-${r.id}`))),
    ]),
  ev(`roamer-${r.id}-found`, `${r.name}, Found`, 'Roaming Legendaries', { cast: [], pokemon: r.id, tint: '#14141f', effect: 'glint', room: true },
    `There. ${r.name}, right in front of you, close enough to touch. It hasn't decided yet whether to run.`,
    [
      ch('Battle it.', fight(`It turns to face you.`, wf({ species: [r.id], lv: 3 }))),
      ch('Watch it go.', out(`You watch. It holds your eye a moment, then it's gone. You'll see it again.`, good(1))),
    ]),
]);

// ---------- L16 The Tower of Legends (five floors; Tower Week opens it to everyone) ----------
const TOWER = { cast: [], tint: '#14141f', effect: 'glint' };
const tRoom = (id: string, name: string, intro: string, choices: Json[], o: Json = {}): Json => ev(id, name, 'Tower of Legends', { ...TOWER, room: true, ...o }, intro, choices);
const SHAPES = ['articuno', 'zapdos', 'moltres', 'regirock', 'regice', 'registeel', 'uxie', 'azelf', 'heatran'];
const LEGENDS = ['articuno', 'zapdos', 'moltres', 'raikou', 'entei', 'suicune', 'lugia', 'ho-oh', 'latias', 'latios', 'kyogre', 'groudon', 'rayquaza', 'dialga', 'palkia', 'giratina', 'reshiram', 'zekrom', 'xerneas', 'yveltal', 'solgaleo', 'lunala', 'zacian', 'zamazenta', 'koraidon', 'miraidon'];
const gauntlet = (n: number): Json => ch('Face them.', fight(`${n === 1 ? 'A shape' : n === 2 ? 'Two shapes' : 'Three shapes'} of light step down the stairs: Legendaries, or their echoes. One for each time a Legendary has looked your way.`,
  tf('The Echoes', { size: n, lv: 2, team: SHAPES.slice(0, n), win: [room('tower-4')] }, [room('tower-4')])));
const TOWER_EVENTS: Json[] = [
  ev('tower-entrance', 'The Tower of Legends', 'Tower of Legends', { ...TOWER, requires: [notYet('tower-climbed')] },
    'A tower older than any map. Five floors. The door is open. Nobody is guarding it, which is somehow worse.',
    [
      ch('Go in.', out('The door doesn\'t close behind you. It doesn\'t need to.', done('tower-climbed'), room('tower-1'))),
      ch('Not yet.', out('You walk past. The door stays open. It will wait.', again('tower-entrance'))),
    ]),
  ev('tower-week-entrance', 'The Tower of Legends', 'Tower of Legends', { ...TOWER, callback: true, requires: [notYet('tower-climbed')] },
    'It\'s Tower Week. The Tower of Legends has opened its door to everyone, blessed or not. Travellers queue at the bottom, whispering about what waits at the top.',
    [
      ch('Join the climb.', out('You go in with the crowd. By the second floor, you\'re alone.', done('tower-climbed'), flag('tower-week'), room('tower-1'))),
      ch('Not this year.', leave('You leave the queue to the others.')),
    ]),
  tRoom('tower-1', 'Floor 1: The Offering', 'An inscription: "Give, and be answered." A stone bowl, worn smooth by hands.', [
    ch('Give something ordinary.', out('You place it in the bowl. A voice, very kind, from nowhere: "Thank you." It\'s enough to climb on.', { kind: 'offer', tier: 'common' }, room('tower-2')), { requires: [{ kind: 'barterHas', tier: 'common', berry: false }] }),
    ch('Give something rare.', out('You place it in the bowl. When you look again, there\'s a feather in its place, warm, and coloured like no bird you know.', { kind: 'offer', tier: 'uncommon' }, item('pretty-feather'), room('tower-2')), { requires: [{ kind: 'barterHas', tier: 'uncommon', berry: false }] }),
    ch('Give your most precious thing.', out('You place it in the bowl and don\'t look back. Above you, all the way up, every stair lights up at once.', { kind: 'offer', tier: 'rare' }, flag('tower-lit'), room('tower-2')), { requires: [{ kind: 'barterHas', tier: 'rare', berry: false }] }),
    ch('Give nothing.', out('The bowl stays dark. The stairs are there anyway. Nobody said you had to.', room('tower-2'))),
  ]),
  tRoom('tower-2', 'Floor 2: Two Doors', 'Two doors. Door A: "For those who travel with Legendary blood." Door B: "For those who travel with a friend."', [
    ch('Door A.', out('It opens at a touch. Your Legendary goes through first, as if it knows the way.', room('tower-3')), { requires: [{ kind: 'partyTag', tag: 'legendary' }] }),
    ch('Door B.', out('It opens when you put your hand on your lead\'s head. You both go through together.', flag('tower-door-b'), bondUp(1), room('tower-3'))),
  ]),
  tRoom('tower-3', 'Floor 3: The Gauntlet of Echoes', 'The Gauntlet of Echoes. A great empty hall, and stairs down from somewhere above. Nothing steps down. No Legendary has looked your way yet.',
    [ch('Cross the hall.', out('Your footsteps echo all the way across. The far stairs go up into the dark.', room('tower-4')))],
    { remembers: [
      { id: 'three', when: [blessed({ atLeast: 3 })], hide: [0], notice: 'The hall is full of light.', addChoices: [gauntlet(3)] },
      { id: 'two', when: [blessed({ atLeast: 2 })], hide: [0], notice: 'Something moves at the top of the stairs.', addChoices: [gauntlet(2)] },
      { id: 'one', when: [blessed({ atLeast: 1 })], hide: [0], notice: 'Something moves at the top of the stairs.', addChoices: [gauntlet(1)] },
    ] }),
  tRoom('tower-4', 'Floor 4: The Long Dark', 'The Long Dark. A staircase with no light. Each step costs something. You can hear your Pokémon breathing beside you.', [
    ch('Climb.', out('You climb, step after step, until your legs shake. Then there\'s light above.', hurt(0.15), room('tower-5'))),
    ch('Rest, then climb.', out('You sit on the stairs in the dark and rest, all of you together. It makes the climb one step longer.', heal(0.2), hurt(0.2), room('tower-5'))),
  ], { remembers: [{ id: 'lit', when: [flagIs('tower-lit')], hide: [0, 1], notice: 'The stairs are lit, every one, all the way up.', addChoices: [ch('Climb.', out('You climb in the light. It costs nothing at all.', room('tower-5')))] }] }),
  tRoom('tower-5', 'Floor 5: The Summit of Legends', 'The summit. Wind, and stars, and an empty stone dais. Whatever waits here isn\'t waiting for you. Not yet.',
    [ch('Sit a while.', out('You sit at the top of the world. When you climb down, you feel taller.', heal(0.5), good(1)))],
    { remembers: [
      { id: 'week', when: [flagIs('tower-week')], hide: [0], notice: 'Tower Week: a Legendary has come to the summit, a different one every year. It turns to look at you.',
        addChoices: [ch('Battle it.', fight('It cries out. Every climber below hears it.', wf({ species: LEGENDS, lv: 3 }))), ch('Bow, and go down.', out('It bows back. You will never forget that.', good(1)))] },
      { id: 'empty', when: [blessed({ has: false })], hide: [0], notice: 'Nobody waits for you. But on the wall, freshly carved, there\'s a Telling: a figure with a golden wheel, and a thousand arms.',
        addChoices: [ch('Read the Telling.', out('"Before all of them, one. After all of them, one." You trace the carving with a finger. Arceus has been here.', good(1)))] },
      { id: 'blessed', when: [blessed({ atLeast: 9 })], hide: [0], notice: 'It\'s here. Your blessed Legendary, waiting at the top. A subtitle under its cry: "I have watched every one who climbed. You came up the stairs."',
        addChoices: [
          ch('Battle it.', fight('It spreads itself across the summit. The Presence.', { ...wf({ species: LEGENDS, lv: 4 }), blessed: true })),
          ch('Hold out your hand.', out('It comes down the stairs and stands beside you. No battle. It was never going to need one.', { kind: 'joinBlessed', levelBonus: 3 }), { requires: [flagIs('tower-door-b')] }),
        ] },
    ] }),
];

// ---------- GL3 The First Gym: the vault (three forgotten badges open it) ----------
const VAULT: Json[] = [
  ev('mr-ancient-gym-vault', 'The Forgotten Badges', 'Mysteries & Ruins', { cast: [], tint: '#2a2418', effect: 'glint', callback: true, requires: [flagIs('forgotten-badge', 3), notYet('first-gym-vault')],
    remembers: [{ id: 'keepers', when: [flagIs('first-gym-keepers-moved')], notice: 'The three old keepers have followed you down. They lie by the grave, one on each side, and one at its foot.' }] },
    'The three forgotten badges grow warm in your bag, and a hidden door opens in the back of the central hall. Inside: the first Leader\'s grave, and a letter. The letter: "To whoever comes. I made the Gym so they would stop fighting in the streets. Did it work?"',
    [
      ch('Yes.', out('You say it out loud, to the grave. "Yes. Mostly. They fight in Gyms now, with rules, and shake hands after." It feels true when you say it.', done('first-gym-vault'), good(1))),
      ch('No.', out('"No. Not all of it." The honest answer. You fold the letter and put it back. Somebody has to keep trying. It might as well be you.', done('first-gym-vault'), bondUp(1))),
      ch('Leave the badges.', out('You lay the three badges on the grave. They were hers. The stone warms under your hand, and a Telling appears in the dust on the wall: a figure with a golden wheel. (The badges\' bonus stays with your team: the Gym remembers who came.)', done('first-gym-vault'), good(1))),
    ]),
];

// ---------- FE1 The Letter to Future You (three stages, inside this run) ----------
const LETTER = { cast: [], tint: '#2a2418', effect: 'none' };
const FE1: Json[] = [
  ev('ovc-the-letter-to-future-you-s1', 'The Letter to Future You', 'Overhaul chains', { ...LETTER, requires: [notYet('letter-read')] },
    'A mailbox holds a letter addressed to you, in your own handwriting: "Don\'t trust the guide with the free shortcut. Feed the Poochyena. You\'ll know when. Don\'t sell the thing you\'re thinking of selling. You\'ll want it at the bridge." It\'s signed with your name, and dated one region from now.',
    [
      ch('Follow the advice.', out('You fold it into your pocket. The t\'s are crossed the way you cross them. You\'ll be careful.', done('letter-read'), stamped('letter-followed'))),
      ch('Ignore it.', out('Somebody\'s joke. You leave it in the box. But you remember every word.', done('letter-read'), flag('letter-ignored'))),
      ch('Write back.', out('There\'s a pen on a string. You write one line under it: "I\'ll try." You post it back into the same box.', done('letter-read'), stamped('letter-followed'), stamped('letter-wrote'))),
    ]),
  ev('ovc-the-letter-to-future-you-s2', 'The Bridge Toll', 'Overhaul chains', { ...LETTER, callback: true, minStage: 2, requires: [anyFlag('letter-followed', 'letter-ignored'), notYet('letter-bridge')],
    remembers: [{ id: 'thanks', when: [flagAgo('letter-wrote', 1)], notice: 'Tucked under the toll-keeper\'s stool, a second letter, in your hand: "Thanks for writing. It helped. I\'d forgotten I was ever that worried."' }] },
    'A toll-keeper at a narrow bridge. "One item to cross. Any item. Rules is rules." You remember a letter: "You\'ll want it at the bridge."',
    [
      { ...ch('Pay the toll.', out('You hand something over. The keeper waves you across. The letter was right, and you were ready.', { kind: 'offer', tier: 'common' }, done('letter-bridge'), flag('letter-came-true')), { requires: [{ kind: 'barterHas', tier: 'common', berry: false }] }) },
      ch('Find another way.', out('There\'s a free way round, through the reeds. It takes a whole step longer.', takeNode(), done('letter-bridge'))),
    ]),
  ev('ovc-the-letter-to-future-you-s3', 'The Letter You Write', 'Overhaul chains', { ...LETTER, callback: true, minStage: 4, requires: [flagIs('letter-came-true'), flagIs('letter-followed'), notYet('letter-sent')] },
    'A mailbox. A blank sheet. A pen on a string. You know, without being told, that you\'re meant to write the letter now. Three warnings, from things that really happened on this road.',
    [
      ch('Warn about the guide.', out('"Don\'t trust the guide with the free shortcut." You post it. The slot is dark, and deeper than a mailbox should be.', done('letter-sent'), good(1)), { requires: [flagIs('guide-met')] }),
      ch('Warn about the one you walked past.', out('"Stop for the one on their knees. You\'ll be in a hurry. Stop anyway." You post it. The slot is dark, and very deep.', done('letter-sent'), good(1)), { requires: [flagIs('kind-walked-past')] }),
      ch('Warn about the fight you lost.', out('"The one who beats you knows your lead. Change it." You post it. The slot is dark, and very deep.', done('letter-sent'), good(1)), { requires: [flagIs('left-fainted')] }),
      ch('Write: "Keep going."', out('Just that. "Keep going. You make it further than you think." The slot takes it gently.', done('letter-sent'), bondUp(1, 'party'))),
    ]),
];

// ---------- FE2 The Sealed Letter ----------
const COURIER = { cast: [], tint: '#2a2418', effect: 'none' };
const FE2: Json[] = [
  ev('rk-sealed-letter', 'The Sealed Letter', 'Run-Wide Modifiers', { ...COURIER, requires: [notYet('letter-sealed-met')],
    remembers: [{ id: 'yours', when: [flagIs('letter-wrote')], notice: 'The address is in your own handwriting.' }] },
    'A courier on a bicycle skids to a stop and hands you an envelope sealed with wax. Courier: "Don\'t open it yet. That\'s the instruction. Wait until the road gets hard." Courier: "Who\'s it from? No idea. Paid in advance. A long time in advance."',
    [
      ch('Open it now.', out('One line: "Too soon." And, inside, a small flask of spring water. You feel a little foolish.', item('spring-water'), done('letter-sealed-met'))),
      ch('I\'ll wait.', out('It goes in the bottom of your bag. Some nights you can feel it there.', done('letter-sealed-met'), flag('letter-kept'))),
      ch('Give it back.', out('Courier: "Can\'t. It\'s been paid." They leave it on a rock and ride off. You pick it up. Of course you do.', done('letter-sealed-met'), flag('letter-kept'))),
    ]),
  ev('rk-sealed-letter-open', 'The Letter, Opened', 'Run-Wide Modifiers', { ...COURIER, effect: 'sparkle', callback: true, requires: [flagIs('letter-kept'), { kind: 'partyHpBelow', share: 0.25 }, notYet('letter-opened')] },
    'Your party is hurt, all of them, worse than ever. And in the bottom of your bag, the sealed letter is glowing.',
    [
      ch('Open it.', out('"I knew you would need this. Keep going. You make it further than you think." Behind the old signpost, just where it said, something is waiting.', any('life-orb', 'leftovers', 'expert-belt', 'focus-sash', 'choice-scarf'), heal(0.25), done('letter-opened'))),
    ]),
];

// ---------- FE3 The Capsule (buried and dug up inside this run) ----------
const CAPSULE = { cast: [], tint: '#302418', effect: 'rattle' };
const FE3: Json[] = [
  ev('time-capsule', 'Time Capsule', 'Mysteries and story', { ...CAPSULE, requires: [notYet('capsule-found')] },
    'A shovel left in a meadow next to a marker stone. Under it, a box labelled "Open in 20 years." It has been 30. Inside: an old trainer\'s Poké Ball, empty, and a note: "If you\'re reading this, you started again. Good."',
    [
      ch('Take it.', out('You take what\'s in it. The note says one more thing, at the bottom: "Here\'s what I wish I\'d known: everyone gets tired. Rest anyway."', any('nugget', 'star-piece', 'rare-candy'), done('capsule-found'))),
      ch('Add something and rebury it.', out('You put something of your own in, and a line in your own hand, and fill in the hole. You mark the stone. One day, further down this road, you\'ll come back.', { kind: 'offer', tier: 'common' }, stamped('capsule-added'), done('capsule-found')), { requires: [{ kind: 'barterHas', tier: 'common', berry: false }] }),
      ch('Leave it.', out('You put it all back. On the note, you add one line: "Not yet."', done('capsule-found'))),
    ]),
  ev('time-capsule-dig', 'The Capsule, Again', 'Mysteries and story', { ...CAPSULE, callback: true, requires: [flagAgo('capsule-added', 1), notYet('capsule-dug')] },
    'You know this meadow. The marker stone, the one you scratched a sign into, a whole region ago. The earth is soft.',
    [ch('Dig it up.', out('Your line is there, in your own hand. It feels like a letter from someone younger. Beside it, what you left has been joined by something else, as if the box had been busy.', any('nugget', 'star-piece', 'rare-candy'), any('silk-scarf', 'charcoal', 'mystic-water', 'miracle-seed'), done('capsule-dug')))]),
];

// ---------- FE4 The Professor's Time Machine ----------
const LAB = { cast: [], tint: '#182030', effect: 'spin' };
const testFight = (era: 'past' | 'future', text: string): Json => fight(text,
  tf('Lab Assistant', { cls: 'ace-trainer', size: 2, lv: 1, win: [bondUp(1)] }, [bondUp(1)]), { kind: 'timeMachine', era }, done('machine-used'));
const FE4: Json[] = [
  ev('turo-machine', "Professor's Time Machine", 'Famous faces', { ...LAB, requires: [notYet('machine-used')],
    remembers: [
      { id: 'koraidon', when: [blessed({ species: 'koraidon' })], notice: 'The ring knows you. It opens wider, all on its own, and the air inside smells of the deep past.', addChoices: [ch('Listen to it.', out('Professor: "It\'s never done that." Something old roars, very far away. A Sign.', sign('koraidon'), done('machine-used')))] },
      { id: 'miraidon', when: [blessed({ species: 'miraidon' })], notice: 'The ring knows you. It opens wider, all on its own, and the air inside hums like a circuit.', addChoices: [ch('Listen to it.', out('Professor: "It\'s never done that." Something hums, very far ahead. A Sign.', sign('miraidon'), done('machine-used')))] },
    ] },
    'A humming machine in a lab: a ring of brass and glass, the height of a door. Inside it, the air\'s the wrong season. Professor Ignatia Sandoval-Reyes, in two pairs of glasses: "It doesn\'t move you. It moves a Pokémon. Sideways, really. Just for a battle." "It has to want to. I\'ve a Jigglypuff that\'s declined eleven times."',
    [
      ch('The past.', testFight('past', 'Your lead looks at the ring. At you. It steps in. A snap like a sheet being shaken, and it comes out older than anything. Then a test, in the yard.'),),
      ch('The future.', testFight('future', 'Your lead looks at the ring. At you. It steps in. A hum, and it comes out strange and bright. Then a test, in the yard.')),
      ch('Neither.', out('Professor: "Wise. I\'ve never been in it either."', done('machine-used'))),
    ]),
];

// ---------- FE5 The Oracle (the three beats are SF86, families-c-6) ----------
const FE5: Json[] = [
  ev('oracle', 'The Oracle of the Road', 'Set Pieces', { requires: [flagIs('prophecy-friend', 0, 0), flagIs('prophecy-loss', 0, 0), flagIs('prophecy-win', 0, 0), notYet('oracle-met')] },
    'A room with no window and a bowl of water. A woman of no particular age opens her eyes. The Oracle: "I will speak one thing. You may carry it or leave it. I see what\'s likely, and say it aloud, and then it\'s a little more likely. Knowing changes the shape."',
    [
      ch('A friend in need.', out('The Oracle: "Someone who\'s been kind to you will be on their knees in the road. You\'ll be in a hurry." She closes her eyes. "Stop."', flag('prophecy-friend'), done('oracle-met'))),
      ch('A loss.', out('The Oracle: "You\'ll lose something you thought was yours. Not for good. It\'ll feel like for good."', flag('prophecy-loss'), done('oracle-met'))),
      ch('A win that matters.', out('The Oracle: "You\'ll win one that you\'d have thrown away, if you hadn\'t known it counted."', flag('prophecy-win'), done('oracle-met'))),
      ch('Tell me nothing.', out('She smiles. "Then all three will surprise you. That\'s a gift, too."', done('oracle-met'))),
    ]),
];

// ---------- FE6 Rainbow Rocket (and the bosses who come after him) ----------
const ROCKET = { cast: ['boss.teamrocket'], tint: '#281040', effect: 'spin' };
const ECHOES: { id: string; name: string; line: string }[] = [
  { id: 'maxie', name: 'Maxie', line: 'In my world, the land swallowed the sea. I\'ve come to see a world where someone stopped me.' },
  { id: 'archie', name: 'Archie', line: 'In my world, the sea came over everything. Somebody here stopped it. Was that you?' },
  { id: 'cyrus', name: 'Cyrus', line: 'In my world, there is no spirit. Show me what it is that stopped me here.' },
  { id: 'ghetsis', name: 'Ghetsis', line: 'In my world, I rule. Every Pokémon is mine. And here? Here, someone said no.' },
  { id: 'lysandre', name: 'Lysandre', line: 'In my world, the beautiful few are all that\'s left. Show me the ugly many who stopped me.' },
];
const FE6: Json[] = [
  ev('rainbow-rocket', 'Rainbow Rocket', 'Tricksters, villains and teams', { ...ROCKET, requires: [notYet('rainbow-met')],
    remembers: [{ id: 'stood', when: [{ kind: 'standWith', joined: true }], notice: 'Giovanni sees the badge on your collar, and laughs. "So you\'re mine here too."' }] },
    'A portal crackles open in the middle of the road. Giovanni steps through. Not this world\'s Giovanni. Giovanni: "In my world, I won. Everyone you know works for me." Giovanni: "I\'ve come to see what a world looks like where someone stopped me."',
    [
      ch('Battle.', fight('Giovanni: "My winning team, then. Let\'s see if it wins here."', tf('Giovanni', { boss: 'giovanni', size: 6, lv: 3, win: [$(3000), repUp(1)] }), stamped('rainbow-met'))),
      ch('Show him.', out('You walk him through the town. Children playing. A Gym with its doors open. He doesn\'t say a word the whole way. At the portal, he looks back once.', stamped('rainbow-met'), good(1))),
      ch('Close the portal.', fight('The portal fights back. Rainbow Rocket grunts pour through, wave after wave, while you push it shut.', tf('Rainbow Rocket Grunt', { cls: 'roughneck', size: 3, lv: 2, chain: 3, win: [repUp(2)] }), stamped('rainbow-met'))),
    ]),
  ev('rainbow-rocket-echo', 'Another Portal', 'Tricksters, villains and teams', { ...ROCKET, callback: true, requires: [flagAgo('rainbow-met', 1), notYet('rainbow-echo')] },
    'Another portal, crackling in the road where there was none. Someone else is coming through, with the same question in their eyes.',
    [ch('Wait for them.', out('The light steadies. A figure steps out.', done('rainbow-echo'), roomFrom(...ECHOES.map((e) => `rainbow-rocket-${e.id}`))))]),
  ...ECHOES.map((e) => ev(`rainbow-rocket-${e.id}`, `Rainbow Rocket: ${e.name}`, 'Tricksters, villains and teams', { ...ROCKET, room: true },
    `${e.name}, from another world. ${e.name}: "${e.line}"`,
    [
      ch('Battle.', fight(`${e.name}: "Then show me."`, tf(e.name, { boss: e.id, size: 6, lv: 3, win: [$(2500), repUp(1)] }))),
      ch('Show them.', out(`You walk them through the town. They don't say a word. At the portal, they look back once.`, good(1))),
    ])),
];

export const EVENTS: Json[] = [...NOBLE_EVENTS, ...BEAST_EVENTS, ...ROAMER_EVENTS, ...TOWER_EVENTS, ...VAULT, ...FE1, ...FE2, ...FE3, ...FE4, ...FE5, ...FE6];

export const REMOVE: string[] = [];
