// Catalog Overhaul Pack, legends: Mythical Visits MY1 to MY12 (QUESTLINES_MYTHICAL.md). Pack questlines: status `extra`.
// Each is the Visit scene of a believed Mythical (three Tellings): it opens when `believed-<id>` is set and no Mythical has visited this
// run, never forces a battle, and ends in the Promise room (_legendsKit.ts `promiseRoom`), which makes it the Guest. One per run.
// Cut by the run-memory rule: Keepsakes, the Parting, anything from a past run (Manaphy's later-run egg, Marshadow's save gate); MY11 Arceus is a same-run version.
import { $, at, better, br, ch, ev, fight, flag, flagIs, fr, good, heal, item, leave, lose, moveFlag, out, ptype, room, takeNode, wild, type Json } from '../dsl.ts';
import { promiseRoom, visitable } from './_legendsKit.ts';

export const CATEGORY = 'legends';

const G = 'Story: Mythical';
const R = { room: true, rarity: 'rare' as const };
const moment = (text: string, importance = 85): Json => ({ kind: 'moment', text, importance });
const not = (key: string): Json => flagIs(key, 0, 0);
const toPromise = (id: string): Json => room(`co-my-${id}-promise`);
/** A one-on-one with a Mythical: no items (so no balls), no switching, the foe at your lead's level, the first faint ends it. */
const duel = (species: string, win: Json[], lose: Json[]): Json => ({
  ...wild({ species: [species], win }),
  pseudo: true,
  lose,
  rule: { noItems: true, noSwitch: true, matchLead: true, suddenDeath: true },
});

// ---------------------------------------------------------------- MY1. Mew: The Playground
const my1: Json[] = [
  ev('co-my1-clearing', 'The Playground', G, { rarity: 'rare', requires: visitable('mew'), pokemon: 'mew', tint: '#f0a0c0', effect: 'sparkle' },
    'Something small and pink keeps darting behind your party, just out of sight. In a clearing, pebbles float in a ring. One is not a pebble.\n\nThe not-pebble opens one eye. For a second your lead turns into a Ditto-shaped blob, then back. Nobody did that.\n\nA sign, painted on a stump in a child\'s letters: PLAY WITH ME OR GO AWAY',
    [
      ch('"Play."', out('Three games. Hide-and-seek: it turns into one of your Pokémon and you have to spot which (you do, by the giggle). Tag: it transforms faster than you can run. Copy-me: it copies your last three moves in a mock battle, perfectly, and bows.', flag('mew-played'), fr(2), toPromise('mew'))),
      ch('"Go away."', out('It follows anyway, sulking, three steps behind. When you look in your bag, something is missing.', flag('mew-sulked'), lose(), toPromise('mew'))),
      ch('Sit and wait.', out('You sit. A minute passes. Then something light lands on your head and stays there, humming.', flag('mew-trusted'), toPromise('mew'))),
    ]),
  promiseRoom('mew', 'Mew floats at eye level and points at your party. Then at itself. Then at your party again.', 'Mew spins in the air, delighted, and settles in beside you. Your party counts their types, nervously.', '#f0a0c0', {
    remembers: [{ id: 'sulked', when: [flagIs('mew-sulked')], notice: 'Mew is still sulking a little. It points at you anyway.', addChoices: [] }],
  }),
];

// ---------------------------------------------------------------- MY2. Celebi: The Forest of Time
const sapling = (n: 2 | 3): Json =>
  ev(`co-my2-sapling-${n}`, 'The Forest of Time: A Sapling', G, { callback: true, rarity: 'rare', requires: [flagIs('celebi-planted', n - 1, n - 1), not('mythical-visited')], pokemon: 'celebi', tint: '#60c060' },
    n === 2 ? 'The second clearing the forester marked. The stump is old; the ground around it is soft.' : 'The last clearing. You plant the third sapling, and the air goes green.',
    [ch(n === 2 ? 'Plant the second sapling.' : 'Plant the last one.', n === 2 ? out('It takes. A little further on, a tree that was a sapling this morning is tall again.', flag('celebi-planted'), fr(1)) : out('Celebi is there, at the last sapling, as if it had always been.', flag('celebi-planted'), room('co-my2-visit'))),
      ch('Walk on.', leave('The clearing waits.'))]);
const my2: Json[] = [
  ev('co-my2-shrine', 'The Forest of Time', G, { rarity: 'rare', requires: visitable('celebi'), pokemon: 'celebi', tint: '#60c060' },
    'A tree you passed an hour ago is a sapling again. A green sparkle hangs where it used to be tall.\n\nA moss-covered shrine. Three bowls. An old forester sits by it, and you realise, slowly, that he is also the boy who carved his initials on that sapling.\n\nForester: "It takes things back. When it\'s sad. Someone cut the old wood down. It\'s been undoing it ever since. A tree at a time."',
    [
      ch('Fill the bowls.', out('Water, a seed, and a memory: you tell the bowls a story of your run so far. The third bowl fills with light.', flag('celebi-offered'), room('co-my2-visit'))),
      ch('Replant the wood.', out('The forester gives you three saplings and marks three clearings on your map, one far ahead of the next. You plant the first.', flag('celebi-planted'))),
      ch('Leave the forest alone.', leave('Behind you, another tree becomes a sapling.')),
    ]),
  sapling(2),
  sapling(3),
  ev('co-my2-visit', 'The Forest of Time: Celebi', G, { ...R, pokemon: 'celebi', tint: '#60c060', effect: 'sparkle' },
    'Celebi flickers. For a moment you see the forest as it was, and a younger forester, running between the trees, laughing.\n\nCelebi holds out its hands.',
    [ch('Take its hands.', out('The forest is quiet. Nothing more turns back.', toPromise('celebi')))]),
  promiseRoom('celebi', 'Celebi waits, very small, by your shoulder.', 'Celebi rests on your shoulder. Behind you, the old wood grows a little taller.', '#60c060'),
];

// ---------------------------------------------------------------- MY3. Jirachi: The Seven Nights
const my3: Json[] = [
  ev('co-my3-comet', 'The Seven Nights', G, { rarity: 'rare', requires: [...visitable('jirachi'), at('night')], pokemon: 'jirachi', tint: '#e0d060', effect: 'sparkle' },
    'A comet. A paper strip drifts down and lands in your hand. It says: "Wish."\n\nThat night, under the stars, a sleepy voice.\nJirachi: "I\'m awake for seven nights. Then I sleep for a thousand years. What do you wish for?"',
    [
      ch('"For my team."', out('Jirachi grants it: something better than you would have found. It frowns a little while it does.', flag('jirachi-wished-self'), better(1), toPromise('jirachi'))),
      ch('"For someone else."', out('You name someone you met this run. Far away, things go a little better for them. Jirachi looks at you properly for the first time.', flag('jirachi-wished-other'), good(1), toPromise('jirachi'))),
      ch('"Nothing."', out('Jirachi: "Nobody says that." It sits down next to you and stays.', flag('jirachi-nothing'), fr(1), toPromise('jirachi'))),
    ]),
  promiseRoom('jirachi', 'Jirachi yawns. "Seven nights. Will you keep me company?"', 'Jirachi tucks itself into your bag, the paper strip on its head, and falls asleep.', '#e0d060'),
];

// ---------------------------------------------------------------- MY4. Deoxys: The Signal
const tones = (n: number, right: number, next: Json): Json[] =>
  ['"Long, short, long."', '"Short, short, short."', '"Long, long, long."'].map((label, i) =>
    i === right ? ch(label, out(`The crater hums back, pleased.${n < 3 ? ' A new pattern starts.' : ''}`, next)) : ch(label, out('The crater goes quiet. It will try again later.', flag('deoxys-quiet'))));
const my4: Json[] = [
  ev('co-my4-crater', 'The Signal', G, { rarity: 'rare', requires: visitable('deoxys'), pokemon: 'deoxys', tint: '#c05040' },
    'A faint repeating signal from a crater that was not there yesterday. It hums in three tones: long, short, long. A rock panel with three slots.\n\nA radio amateur, arriving breathless: "It\'s been sending that for six days. It\'s not random. It\'s waiting for an answer."',
    tones(1, 0, room('co-my4-round-2'))),
  ev('co-my4-again', 'The Signal: Again', G, { callback: true, rarity: 'rare', requires: [flagIs('deoxys-quiet'), not('deoxys-answered'), not('mythical-visited')], pokemon: 'deoxys', tint: '#c05040' },
    'The crater is humming again. Long, short, long. The amateur waves at you from the rim.',
    tones(1, 0, room('co-my4-round-2'))),
  ev('co-my4-round-2', 'The Signal: Round Two', G, { ...R, pokemon: 'deoxys', tint: '#c05040' },
    'A new pattern: short, short, short.', tones(2, 1, room('co-my4-round-3'))),
  ev('co-my4-round-3', 'The Signal: Round Three', G, { ...R, pokemon: 'deoxys', tint: '#c05040' },
    'The last pattern, slower: long, long, long.', tones(3, 2, room('co-my4-visit'))),
  ev('co-my4-visit', 'The Signal: Deoxys', G, { ...R, pokemon: 'deoxys', tint: '#c05040', effect: 'sparkle' },
    'Deoxys is in the crater, changing form every few seconds: arms, then armour, then speed.\n\nThe amateur: "It\'s trying on shapes to see which one we\'ll like."',
    [
      ch('"Stay as you are."', out('It settles into its Normal Forme, and seems relieved.', flag('deoxys-answered'), flag('deoxys-forme-normal'), toPromise('deoxys'))),
      ch('"Show us the fast one."', out('A blur, and it is behind you, and back.', flag('deoxys-answered'), flag('deoxys-forme-speed'), toPromise('deoxys'))),
      ch('"Show us the strong one."', out('Its arms thicken. The crater floor cracks.', flag('deoxys-answered'), flag('deoxys-forme-attack'), toPromise('deoxys'))),
    ]),
  promiseRoom('deoxys', 'The amateur lowers the radio. Deoxys is looking at you, not the sky.', 'Deoxys changes shape one more time, into something almost like your lead, and follows.', '#c05040'),
];

// ---------------------------------------------------------------- MY5. Phione: The Little Egg (the Manaphy half is a later run: cut)
const my5: Json[] = [
  ev('co-my5-tide', 'The Little Egg', G, { rarity: 'rare', types: ['water'], requires: visitable('phione'), pokemon: 'phione', tint: '#60a0e0' },
    'A tiny bubble-like Pokémon floats on the tide, bobbing along without a care. The tide is pulling it toward a rip current. It does not notice.\n\nA lifeguard, from a tower: "That\'s not a swimmer!"',
    [
      ch('"Swim for it."', out('Your Water-type is in the sea before you finish saying it, and back with the little one riding on its head.', flag('phione-saved'), fr(3, { types: ['water'] }), toPromise('phione')), { requires: [ptype('water')] }),
      ch('"Throw a line."', out('The lifeguard\'s float, a long throw, and a very wet Phione at your feet.', flag('phione-saved'), toPromise('phione'))),
      ch('"Let it go."', leave('The current takes it round the point. You hear it laugh, faintly, far out.')),
    ]),
  promiseRoom('phione', 'Phione shakes itself dry and looks along the coast, then up at you.', 'Phione bobs along beside you, always on the side nearer the water.', '#60a0e0'),
];

// ---------------------------------------------------------------- MY6. Victini: The Empty Arena
const my6: Json[] = [
  ev('co-my6-arena', 'The Empty Arena', G, { rarity: 'rare', requires: visitable('victini'), pokemon: 'victini', tint: '#e08040' },
    'A ruined arena. An old trophy case is warm to the touch, and a flame flickers inside where no fire could be. The empty stadium cheers. For nobody.\n\nA voice from the stands: "Do you win for glory, or for them?"',
    [
      ch('"Glory."', fight('Victini appears, unimpressed, and challenges your lead to a one-on-one.', duel('victini', [flag('victini-glory'), toPromise('victini')], [room('co-my6-again')]))),
      ch('"Them."', out('Victini appears on your shoulder.', flag('victini-them'), fr(1), toPromise('victini'))),
      ch('"I just like winning."', out('Victini laughs. Under it, a subtitle: "Honest." It appears.', flag('victini-honest'), toPromise('victini'))),
    ]),
  ev('co-my6-again', 'The Empty Arena: Again', G, { ...R, pokemon: 'victini', tint: '#e08040' },
    'Victini, hovering over your lead: "Again."',
    [
      ch('"Again."', fight('One more time.', duel('victini', [flag('victini-glory'), toPromise('victini')], [flag('victini-lost')]))),
      ch('Walk away.', leave('The stadium stops cheering.')),
    ]),
  promiseRoom('victini', 'The stadium is roaring now. Victini holds up two fingers in a V.', 'Victini rides on your lead\'s head out of the arena. The cheering follows you a long way.', '#e08040'),
];

// ---------------------------------------------------------------- MY7. Shaymin: The Gratitude Garden
const my7: Json[] = [
  ev('co-my7-field', 'The Gratitude Garden', G, { rarity: 'rare', requires: visitable('shaymin'), pokemon: 'shaymin', tint: '#80d080' },
    'A field blooms out of season. One hedgehog-shaped bush is suspiciously round. In the afternoon heat the flowers wilt, one by one, and the round bush trembles.\n\nA farmer\'s daughter: "They come back every year if someone says thank you to them. Nobody\'s said it for ages."',
    [
      ch('"Thank you." (to the field)', out('The field un-wilts, all of it, at once. The bush unrolls. It is Shaymin.', flag('shaymin-thanked'), toPromise('shaymin'))),
      ch('Carry it to water.', out('Two long stretches of road with a heavy, prickly bush in your arms. At the spring it drinks, revives, and for a moment is something with wings.', flag('shaymin-carried'), takeNode(2), toPromise('shaymin'))),
      ch('Pick a flower.', out('Shaymin wakes, deeply offended, and runs. You will have to find it again.', flag('shaymin-offended'))),
    ]),
  ev('co-my7-again', 'The Gratitude Garden: Again', G, { callback: true, rarity: 'rare', requires: [flagIs('shaymin-offended'), not('mythical-visited')], pokemon: 'shaymin', tint: '#80d080' },
    'Another field, another round bush, very still, pretending to be a bush.',
    [
      ch('"Sorry. And thank you."', out('The bush unrolls a little. Then all the way.', toPromise('shaymin'))),
      ch('Leave it be.', leave('The flowers close behind you.')),
    ]),
  promiseRoom('shaymin', 'Shaymin sniffs your hand, then the field, then you.', 'Shaymin rides in a pocket of flowers, and wherever you rest, something blooms.', '#80d080'),
];

// ---------------------------------------------------------------- MY8. Meloetta: The Unfinished Song
const NOTES = ['Hum low.', 'Hum high.', 'Let your Pokémon sing.'];
const note = (n: 1 | 2 | 3, right: number, intro: string): Json =>
  ev(n === 1 ? 'co-my8-stall' : `co-my8-note-${n}`, n === 1 ? 'The Unfinished Song' : `The Unfinished Song: Note ${n}`, G,
    n === 1 ? { rarity: 'rare', requires: visitable('meloetta'), pokemon: 'meloetta', tint: '#80c0a0' } : { ...R, pokemon: 'meloetta', tint: '#80c0a0' },
    intro,
    NOTES.map((label, i) => ch(label, out(i === right ? 'The voice sings it with you.' : 'The voice waits, then sings the note you did not.', ...(i === right ? [flag('meloetta-notes')] : []), room(n < 3 ? `co-my8-note-${n + 1}` : 'co-my8-song')), i === 2 ? { requires: [moveFlag('sound')] } : {})));
const my8: Json[] = [
  note(1, 0, 'A music box in a roadside stall plays half a song. A soft voice finishes the next bar, from nowhere.\n\nThe stall owner: "It does that. I\'ve had three customers faint."\nMeloetta, unseen: "Three notes left. Do you know them?"\n\nThe music box\'s last bar went down, down, down.'),
  note(2, 1, 'The second note. The bar before it climbed, like a bird taking off.'),
  note(3, 2, 'The last note. The box falls silent, as if it wants a voice that is not yours.'),
  ev('co-my8-song', 'The Unfinished Song: Meloetta', G, { ...R, pokemon: 'meloetta', tint: '#80c0a0' },
    'The song is finished, one way or another.',
    [ch('Listen.', out('Meloetta laughs, somewhere, and is gone. Next time the music box plays one extra bar.', flag('meloetta-missed')), {
      branches: [
        br([flagIs('meloetta-notes', 3)], 'Meloetta appears, finishes the song and dances. The whole street stops to watch.', flag('meloetta-danced'), fr(1), toPromise('meloetta')),
        br([flagIs('meloetta-notes', 1, 2)], 'Meloetta appears and corrects you, kindly, humming the right notes until you have them.', toPromise('meloetta')),
      ],
    })]),
  promiseRoom('meloetta', 'Meloetta sits on the music box, swinging her feet.', 'Meloetta hums the finished song as you walk. Your party walks in step.', '#80c0a0'),
];

// ---------------------------------------------------------------- MY9. Hoopa: Rings of Mischief (three rings over three stages)
const my9: Json[] = [
  ev('co-my9-ring-1', 'Rings of Mischief', G, { rarity: 'rare', requires: visitable('hoopa'), pokemon: 'hoopa', tint: '#c0a040' },
    'A gold ring hangs in the air over the path. Giggling comes from inside it.',
    [
      ch('Reach in.', out('Your hand comes out holding a coin that was never yours. The ring shrinks to nothing, still giggling.', $(150), flag('hoopa-rings'))),
      ch('Walk around it.', out('It follows you for a step or two, sulks, and pops.', flag('hoopa-rings'))),
    ]),
  ev('co-my9-ring-2', 'Rings of Mischief: The Second Ring', G, { callback: true, rarity: 'rare', requires: [flagIs('hoopa-rings', 1, 1), not('mythical-visited')], pokemon: 'hoopa', tint: '#c0a040' },
    'The ring is back, over your bag this time.',
    [
      ch('Let it take something.', out('Something goes in. Something else comes out: a berry, still warm from wherever it was.', lose(), item('sitrus-berry'), flag('hoopa-rings'))),
      ch('Hold on to your bag.', out('A tug-of-war with thin air. The ring gives up, laughing, and goes.', flag('hoopa-rings'))),
    ]),
  ev('co-my9-ring-3', 'Rings of Mischief: Hoopa', G, { callback: true, rarity: 'rare', requires: [flagIs('hoopa-rings', 2, 2), not('mythical-visited')], pokemon: 'hoopa', tint: '#c0a040', effect: 'sparkle' },
    'A gold ring hangs in the air. Your hand goes through and comes out holding someone else\'s sandwich. Three rings float side by side, giggling.\n\nA shopkeeper, furious, running up: "That was my sandwich!"',
    [
      ch('"Give it back."', out('Hoopa pops out, disappointed that you are no fun, and hands you the shopkeeper\'s other sandwich.', heal(0.2), flag('hoopa-fair'), toPromise('hoopa'))),
      ch('Go through a ring.', out('You come out further down the road, holding a coin of your own you lost three stages ago.', takeNode(1), $(300), toPromise('hoopa'))),
      ch('Grab the ring.', out('Hoopa is pulled out by its own ring, upside down, laughing so hard it cannot float.', flag('hoopa-grabbed'), toPromise('hoopa'))),
    ]),
  promiseRoom('hoopa', 'Hoopa juggles its rings and grins at your bag.', 'Hoopa hangs a ring on your bag strap, and peeks out of it from time to time.', '#c0a040'),
];

// ---------------------------------------------------------------- MY10. Marshadow: The Shadow That Punches (its Promise needs a past run: no Promise)
const my10: Json[] = [
  ev('co-my10-shadow', 'The Shadow That Punches', G, { rarity: 'rare', types: ['ghost', 'fighting'], requires: visitable('marshadow'), pokemon: 'marshadow', tint: '#404040' },
    'All stage your shadow has been throwing punches you did not throw. At dusk it stands apart from you, takes a stance, and waits. Nobody else can see it.',
    [
      ch('Take the stance.', fight('A sparring match with your own shadow.', duel('marshadow', [flag('marshadow-sparred'), moment('Your shadow sparred with you once, and bowed.')], [flag('marshadow-sparred')]))),
      ch('"What do you want?"', out('No answer. It points, and in the dark you see your last lost battle, played over again in shadow. Then it is just your shadow.', flag('marshadow-asked'), fr(1))),
      ch('Look away.', leave('When you look back, it is just a shadow, sulking.')),
    ]),
];

// ---------------------------------------------------------------- MY11. Arceus: The Sixteen Pedestals (same-run version)
// The pack's Arceus needs ten Promises kept across past runs and judges the NEXT run; both are cut by the run-memory rule. Here it
// comes at the last rest before the League to a run whose Guest still walks beside it with the Promise never broken (`guest-true`),
// and its Judgment covers the rest of this run: three commandments for the League, a Plate for the starter, and one rule rewritten.
// The Plate's power for the starter's type: the team-wide catalog Plate where one exists, else that type's own charm (the items.json
// Plates of the same names are Rage items and would win the lookup in giveItem, so those seven types use the charm).
const PLATES: Json = { normal: 'silk-scarf', fighting: 'black-belt', flying: 'sky-plate', poison: 'toxic-plate', ground: 'earth-plate', rock: 'stone-plate', bug: 'insect-plate', ghost: 'spooky-plate', steel: 'iron-plate', fire: 'charcoal', water: 'splash-plate', grass: 'miracle-seed', electric: 'magnet', psychic: 'twistedspoon', ice: 'icicle-plate', dragon: 'draco-plate', dark: 'dark-ribbon', fairy: 'fairy-feather' };
const regionsLeft = (atMost: number): Json => ({ kind: 'regionsLeft', atMost });
const COMMANDMENTS = (n: 2 | 3): Json => ({ kind: 'tempEffect', label: n === 3 ? 'The Judgment: three commandments' : 'The Judgment: two commandments', until: 'region',
  effects: [{ kind: 'healingMultiplier', value: 0.85 }, { kind: 'priceMultiplier', value: 1.2 }, ...(n === 3 ? [{ kind: 'captureMultiplier', value: 0.8 }] : [])] });
const judgment = (id: string, n: 2 | 3): Json => ev(id, 'Arceus: The Judgment', G, { ...R, pokemon: 'arceus', tint: '#f0e8c0', effect: 'sparkle' },
  `The voice: "Then hear the Judgment. ${n === 3 ? 'Three' : 'Two'} commandments, for the rest of your road: ${n === 3 ? 'heal less, pay more, and hold fewer' : 'heal less, and pay more'}. Keep them to the end, as you kept your word."\n\nThe sixteenth pedestal is empty. A Plate rises from it, and its power goes to your first partner's type. Then the voice asks you to change one rule of the world. Only one.`,
  [
    ch('"Let revival be as common as it used to be."', out('Your bag is heavier.', COMMANDMENTS(n), { kind: 'typeItem', who: 'starter', table: PLATES }, item('revive', 3), item('max-revive'), flag('arceus-judged'), moment('Arceus judged you at the sixteen pedestals. You asked for revival to be common again.', 95))),
    ch('"Raise them."', out('Your whole party feels it: three levels, all at once.', COMMANDMENTS(n), { kind: 'typeItem', who: 'starter', table: PLATES }, { kind: 'levels', amount: 3, who: 'party' }, flag('arceus-judged'), moment('Arceus judged you at the sixteen pedestals. You asked for your Pokémon to be raised.', 95))),
    ch('"Set every rival back to the start."', out('Somewhere, every rival you have feels the ground move under them.', COMMANDMENTS(n), { kind: 'typeItem', who: 'starter', table: PLATES }, { kind: 'tempEffect', label: 'Arceus set the rivals back', until: 'region', effects: [{ kind: 'rivalLevelOffset', value: -5 }] }, flag('arceus-judged'), moment('Arceus judged you at the sixteen pedestals. You asked for every rival to be set back.', 95))),
  ]);
const PEDESTALS = 'A dark hall. Sixteen pedestals. Each has a Plate on it except one.\n\nA voice from everywhere: "You have kept your word. To one of mine, all the way here."\nThe voice: "What do you bring to the seventeenth?"';
const my11: Json[] = [
  ev('co-my11-pedestals', 'The Sixteen Pedestals', G, { rarity: 'rare', requires: [flagIs('promises-on'), flagIs('guest-true'), regionsLeft(0), not('arceus-judged')], pokemon: 'arceus', tint: '#f0e8c0', effect: 'sparkle' },
    `At the last rest before the League, a plate of stone lies half-buried, carved with a circle of sixteen. You brush the dirt off it, and the rest is gone.\n\n${PEDESTALS}`,
    [
      ch('"Myself."', out('The voice is silent for a long time.', room('co-my11-judgment'))),
      ch('"My Pokémon."', out('The voice: "They are not yours to bring." It waits for another answer.', room('co-my11-again'))),
      ch('"Nothing."', out('The voice: "Good."', room('co-my11-judgment-light'))),
    ]),
  ev('co-my11-again', 'The Sixteen Pedestals', G, { ...R, pokemon: 'arceus', tint: '#f0e8c0', effect: 'sparkle' }, `${PEDESTALS}\n\nIt is still waiting.`,
    [
      ch('"Myself."', out('The voice is silent for a long time.', room('co-my11-judgment'))),
      ch('"Nothing."', out('The voice: "Good."', room('co-my11-judgment-light'))),
    ]),
  judgment('co-my11-judgment', 3),
  judgment('co-my11-judgment-light', 2),
];

// ---------------------------------------------------------------- MY12. Pecharunt: Three Wishes for a Small Favour
const my12: Json[] = [
  ev('co-my12-shrine', 'Three Wishes for a Small Favour', G, {
    rarity: 'rare', requires: visitable('pecharunt'), pokemon: 'pecharunt', tint: '#a060c0',
    remembers: [{ id: 'loyal', when: [flagIs('blessing-loyal')], notice: 'The voice: "Ah. One of mine."', addChoices: [] }],
  },
    'A sweet-smelling peach on a roadside shrine. A thin purple ribbon trails from it into the grass.\n\nA soft voice: "You look tired. I could help. Three wishes. For a small favour. Just take what I give you. That\'s all."',
    [
      ch('"What\'s the favour?"', out('The voice: "Just accept my gifts. Every one." It says it plainly, as if that settles it.', toPromise('pecharunt'))),
      ch('"Yes."', out('Pecharunt rolls out of the peach, delighted.', flag('pecharunt-yes'), toPromise('pecharunt'))),
      ch('"No."', out('The voice: "You\'ll come back."', flag('pecharunt-refused'))),
    ]),
  ev('co-my12-again', 'Three Wishes: You Came Back', G, { callback: true, rarity: 'rare', requires: [flagIs('pecharunt-refused'), not('mythical-visited')], pokemon: 'pecharunt', tint: '#a060c0' },
    'The same peach, on a different shrine. The voice: "You came back. I said you would."',
    [
      ch('Listen.', out('It was right.', toPromise('pecharunt'))),
      ch('Walk past.', leave('The ribbon twitches in the grass behind you.')),
    ]),
  promiseRoom('pecharunt', 'Pecharunt holds out a mochi, glistening. It is very sweet. It smells like a promise.', 'Pecharunt climbs onto your bag. "Every gift," it says. "Every one."', '#a060c0'),
];

export const EVENTS: Json[] = [...my1, ...my2, ...my3, ...my4, ...my5, ...my6, ...my7, ...my8, ...my9, ...my10, ...my11, ...my12];
export const REMOVE: string[] = [];
