// Kanto Canon Spaces, KANTO_PLACED_3.md (Volume II): the second set of town spaces for Viridian, Pewter, Cerulean, Vermilion
// and Lavender. Lines kept word for word; the text around them is longer and warmer. Anime-, manga- and game-inspired
// entries name their inspiration only. Same-run memory only (the Offering reads this run, never an earlier one).
import type { Json } from '../dsl.ts';
import { EXTRA, SPACES, retired, followup, later, intel, kind, battle, buy, c, cash, flag, foe, fr, has, heal, heat, is, item, join, kc, moment, not, o, relic, space, temp, wild } from './_kc.ts';

export const CATEGORY = 'kanto-canon';
export const EVENTS: Json[] = [];
const E = EVENTS;
const DOC = 'KANTO_PLACED_3';
const rep = (n = 1): Json => flag('rep', n);
const trio = (n: number): Json => flag('kanto-trio-rep', n);
const lose = (id: string, count = 1): Json => ({ kind: 'loseItem', id, count });
const rocket: Json = { kind: 'evil', team: 'rocket' };
const typed = (type: string): Json => ({ kind: 'partyType', type });
const moveType = (type: string): Json => ({ kind: 'partyMoveType', type });
const cure: Json = { kind: 'cure' };
const holdsAny = (...ids: string[]): Json => ({ kind: 'kc', act: 'holdsAny', ids });
const score = (n: number): Json => flag('kanto-siblings-score', n);

// ============================================================ VIRIDIAN CITY (Stage 1, and Stage 8)

// ---------- The Spearow Storm (anime, first episode)
{
  const s = space(E, { id: 'cs.kanto.viridian.spearow', town: 'viridian', name: 'The Spearow Storm', kind: 'EV', appears: 'trigger', flags: ['kanto.viridian.spearow', 'kanto.sighting.rainbow'], section: `${DOC}: The Spearow Storm`,
    placed: { stage: [1], home: 5, window: [2, 6], sits: 'optional', attaches: 'before', badge: 'A storm cloud', level: -1, often: 'Once per run (the first rainy node of Kanto; else Step 5 at dusk, and the rain comes with it)' } });
  const sighting = [flag('kanto-viridian-spearow'), flag('kanto-sighting-rainbow'), moment('Stood in front of a Spearow flock in the rain, and saw something gold cross the sky.')];
  const after = 'The rain stops as if it\'s been switched off. Something crosses the sky from one edge to the other. It\'s gold, and it\'s very large, and it leaves a colour behind it that you haven\'t got a word for. One feather comes down. It\'s gone before it lands.';
  s.entry('The Spearow Storm',
    'A Spearow on a branch. A stone on the path. Your lead looks at the stone, and at you, as if to say: don\'t. The battle before this one went badly, or went long. Somebody\'s thrown something, you or a child or nobody. It doesn\'t matter. The Spearow\'s seen who\'s standing nearest. It calls. The tree behind it empties into the air. Rain. Your most tired Pokémon is down in the mud, and when the Ball\'s held out, it turns its head away.',
    [
      c('"Stand in front of it."', battle('The flock dives. You don\'t move. The Pokémon behind you gets up, and it fights like nothing has ever been asked of it before.',
        wild(['spearow', 'spearow', 'fearow'], { levelBonus: s.lv, win: [s.open('after')], lose: [s.open('after')] }), fr(10, 'picked')), { pick: {} }),
      c('"Pick it up and run."', o('You run, and the mud tries to keep your shoes. Behind you the flock wheels once, and loses interest. Nothing lost.', flag('kanto-viridian-spearow')),
        { chance: 0.7, fail: battle('Caught at the treeline. Three Spearow, and nowhere left to run.', wild(['spearow'], { levelBonus: s.lv, chain: 3, win: [flag('kanto-viridian-spearow')] })) }),
      c('"Get in the Ball. Please."', o('It looks at you for a long moment. It goes in. Then you run, and the flock lets you.', fr(5, 'picked'), flag('kanto-viridian-spearow')), { pick: {} }),
    ], { scene: { pokemon: 'spearow' } });
  void after;
  s.room('after', 'The Spearow Storm: After', after, [c('Watch it go.', o('The flock has scattered. Nothing is given now but the Bond, and the colour, which you\'ll keep.', ...sighting))]);
}

// ---------- The Pokémon Center Siege (anime, second episode; Pseudo Stage, short)
{
  const s = space(E, { id: 'cs.kanto.viridian.center', town: 'viridian', name: 'The Pokémon Center Siege', kind: 'PS', appears: 'roll', flags: ['kanto.viridian.center.saved', 'kanto.trio.rep'], section: `${DOC}: The Pokémon Center Siege`,
    placed: { stage: [1], home: 2, window: [1, 4], sits: 'plus', attaches: 'plus', badge: 'A cross with a crack in it', level: -1, often: 'Once per run' },
    ps: { name: 'The Pokémon Center Siege', themeId: 'normal-poison', mood: 'glass on the floor, and the machine still humming in the dark' } });
  const saved = [flag('kanto-viridian-center-saved'), relic('kanto-nurse-thanks', "The Nurse's Thanks", [{ kind: 'healingMultiplier', value: 1.1 }]), moment('Held the Viridian Pokémon Center in the dark with three borrowed Poké Balls.')];
  s.entry('The Pokémon Center Siege',
    'The party\'s in the machine. The nurse is counting under her breath. The lights go out. Glass, from above. A rope. Two shapes and a smaller one, landing in a pose in the dark, where nobody can see it. Jessie: "Prepare for—" James: "They can\'t see us, Jess." Meowth: "Do it anyway. It\'s the principle." The nurse, low, pushing a tray at you: "Yours are mid-cycle. I can\'t pull them. These are from storage. People leave them. I don\'t know what\'s in them. Go."',
    [
      c('Take a Ball from the tray.', o('Three rental Poké Balls. One is always empty.', s.open('tray')), { chance: 2 / 3,
        fail: o('You throw it. It opens. Nothing. Meowth: "...Was that it? Was that the attack?" It costs the turn, and nothing else.', s.open('tray')) }),
    ]);
  s.room('tray', 'The Siege: In the Dark', 'In the dark, nobody can aim. Ekans and Koffing first, then Meowth himself.',
    [c('Fight.', battle('Accuracy is a guess for both sides. The rentals fight like they\'ve been waiting a long time to be asked.',
      foe('Jessie and James', { team: ['ekans', 'koffing'], size: 2, levelBonus: s.lv, win: [s.open('between')], lose: [s.open('fail')] })))]);
  s.room('between', 'The Siege: The Machine Chimes', 'The machine chimes. Your own lead\'s out of it, half-healed, and it\'s furious on the nurse\'s behalf.',
    [c('Send in your lead, at half HP.', battle('It knows whose Center this is.', foe('Meowth', { team: ['meowth'], size: 1, levelBonus: s.lv, win: [s.open('end')], lose: [s.open('fail')] }))),
      c('Keep the rentals in.', battle('The rentals again. One of them has decided it likes you.', foe('Meowth', { team: ['meowth'], size: 1, levelBonus: s.lv - 1, win: [s.open('end')], lose: [s.open('fail')] })))]);
  s.room('end', 'The Siege: The Ending', 'The lights come back one bank at a time. Three people, caught halfway up a rope.',
    [c('"Out. The way you came."', o('They climb. James needs a leg up; you give it. The Center heals easier for the rest of Kanto. One of the rentals fought well; the nurse says its owner never came back, and it may be kept.', trio(5), ...saved, join(['rattata'], { levelBonus: -2 }))),
      c('"Stay where you are."', o('You hold them for the police. Officer Jenny comes. They\'ve gone by then; they always have. The Center heals easier for the rest of Kanto.', rep(1), ...saved)),
      c('"You\'ve broken her skylight."', o('James: "...We could chip in." He means it. Jessie pays. It\'s four coins and a button. The Center heals easier for the rest of Kanto.', trio(5), cash(4), ...saved))]);
  s.room('fail', 'The Siege: Gone', 'The trio take one common thing from the counter and leave. The Pokémon in the machine aren\'t touched.',
    [c('Let the nurse turn the lights on.', o('Nothing of yours was taken. The nurse sweeps the glass, and doesn\'t say anything, and gives you a Poké Ball anyway.', item('poke-ball')))]);
}

// ---------- The Healer in the Straw Hat (manga; Stage 8)
{
  const s = space(E, { id: 'cs.kanto.viridian.healer', town: 'viridian', name: 'The Healer in the Straw Hat', kind: 'EV', appears: 'trigger', flags: ['kanto.viridian.healer'], section: `${DOC}: The Healer in the Straw Hat`,
    placed: { stage: [8], home: 3, window: [2, 6], sits: 'optional', attaches: 'after', badge: 'A straw hat', level: null, often: 'Once per run (only while a party Pokémon is fainted, hurt, statused or a Shadow)' } });
  const healed = (shadow: boolean) => o(`The child closes their eyes. The forest goes quiet the way a room does. When they open them, the Pokémon\'s standing, and the child\'s swaying. "There. It was mostly worried about you."${shadow ? ' And to the Shadow Pokémon: "Oh. Somebody shut a door in you. I can\'t open it. I can oil the hinge."' : ''} They\'re asleep on their feet before you\'ve said thank you. A Pikachu with a flower behind its ear leads them off by the sleeve.`,
    kc('reviveOne'), heal(1), cure, ...(shadow ? [{ kind: 'shadowHeart', amount: -10 }] : []), flag('kanto-viridian-healer'), moment('Let a child in a straw hat listen to where it hurt.'));
  s.entry('The Healer in the Straw Hat',
    'The forest\'s edge. A child in a straw hat too big for them, with a fishing rod they aren\'t using, watching your worst-off Pokémon. "That one\'s tired in a way sleeping won\'t fix. Can I hold it? I\'ll give it back." They don\'t wait long for an answer. They don\'t reach, either. They hold their arms out and leave it to the Pokémon.',
    [c('"Go on."', healed(false), { pick: {} }),
      c('"Go on." (your Shadow Pokémon)', healed(true), { requires: [{ kind: 'partyShadow' }], pick: {} }),
      c('"What are you going to do?"', o('"I don\'t know what it\'s called. I ask it where it hurts. Then I listen. It\'s the listening that does it."', s.open('ask'))),
      c('"No, thank you."', o('They nod, as if that was an answer too, and go back to not fishing. Coins left on the stump would still be there at the end of the region.'))]);
  s.room('ask', 'The Healer in the Straw Hat', 'They\'re still holding their arms out.',
    [c('"Go on."', healed(false), { pick: {} }), c('"No, thank you."', o('They nod, and go back to not fishing.'))]);
}

// ---------- The Convertible (the anime rival's fan club; on Route 22, before the rival)
{
  const s = space(E, { id: 'cs.kanto.viridian.convertible', town: 'viridian', name: 'The Convertible', kind: 'EV', appears: 'roll', flags: ['kanto.viridian.convertible'], section: `${DOC}: The Convertible`,
    placed: { stage: [1, 8], home: 3, homes: { '8': 18 }, sits: 'optional', attaches: 'before', badge: 'A pom-pom', level: null, often: 'Once per run (Stage 1; or Stage 8 if not seen)' } });
  const right = (n: number) => flag('kanto-convertible-right', n);
  const q = (suffix: string, next: string, title: string, ask: string, truth: string, wrong: string[]) => s.room(suffix, `The Convertible: ${title}`, ask,
    [c(truth, o('Six pom-poms go up at once.', right(1), s.open(next))), ...wrong.map((w) => c(w, o('A sharp intake of breath from all six. Trixibelle writes something down.', s.open(next))))]);
  s.entry('The Convertible',
    'A red convertible, parked across the whole road. Six cheerleaders. Pom-poms in the rival\'s colours. Head cheerleader, Trixibelle: "Road\'s closed! Fan business! Unless you\'re a fan. Are you a fan?" A cheerleader at the back, quietly: "They\'re the other one. From the— you know. The other one." Trixibelle: "Oh! Then you\'ll know three things. Go on. Three things about them. True ones."',
    [c('"Ask away."', o('Trixibelle produces a clipboard. Of course she does.', s.open('q1'))), c('"I\'ll go round."', o('There isn\'t a round. They chant, for a full minute. It rhymes "best" with "best." Then they move the car anyway.', flag('kanto-viridian-convertible')))]);
  q('q1', 'q2', 'One', '"What did they pick first?"', '"Their starter. They didn\'t even hesitate."', ['"Whatever was nearest."', '"They let it pick them."']);
  q('q2', 'q3', 'Two', '"What do they do when they lose?"', '"Go quiet, then train till dark."', ['"Shout at the sky."', '"Blame the Pokémon."']);
  q('q3', 'end', 'Three', '"Who did they stop for?"', '"Whoever needed it. They\'d never say so."', ['"Nobody. Ever."', '"Me, obviously."']);
  s.room('end', 'The Convertible: The Verdict', 'Trixibelle counts on her fingers. The one at the back is already holding something folded.',
    [c('Three right.', o('They move the car. The one at the back hands over a folded note: "They talk about you. Don\'t tell them I said. They\'d be unbearable." Where the rival will be next is written underneath.', { kind: 'rivalChange', feelings: { respect: 1 } }, { kind: 'revealStops' }, flag('kanto-viridian-convertible')), { requires: [is('kanto-convertible-right', 3)] }),
      c('Fewer.', o('They chant, for a full minute. It rhymes "best" with "best." Then they move anyway.', flag('kanto-viridian-convertible')), { requires: [is('kanto-convertible-right', 0, 2)] })]);
}

// ---------- Viridian Night Market (Stage 8, the town)
{
  const s = space(E, { id: 'cs.kanto.viridian.nightmarket', town: 'viridian', name: 'Viridian Night Market', kind: 'SHOP', appears: 'always', flags: [], section: `${DOC}: Viridian Night Market`,
    placed: { stage: [8], home: 2, sits: 'plus', attaches: 'town', badge: 'A lantern', level: null, often: 'Once per run' } });
  const keeper = (seen: string, who: string, town: string) => `${town}'s stall is kept by ${who}${seen}`;
  void keeper;
  s.entry('Viridian Night Market',
    'The town the region began in. There wasn\'t a market. There is now: lanterns on strings from the Mart to the Gym, and every stall run by somebody you\'ve met. Where you saw nothing in a town, its stall\'s kept by a stranger, who says so: "I\'m just minding it."',
    [c('The town stalls (10% off).', o('Pewter\'s rocks, Cerulean\'s bait, Vermilion\'s fish, Celadon\'s everything. Each one sold by a face you know.', s.open('stalls'))),
      c('The lost-and-found stall.', o('Its keeper, a very small old woman under a very large umbrella: "Things come back, at the end. They get tired of being elsewhere."', s.open('lost'))),
      c('Walk the lanterns, and go.', o('You walk the whole length of it once, slowly. Everybody waves.'))]);
  s.room('stalls', 'Night Market: The Stalls', 'Every price is ten per cent under what it was the first time.',
    [buy('Hard Stone, from Pewter', 1800, 'One of Brock\'s sisters wraps it in newspaper.', item('hard-stone')), buy('Mystic Water, from Cerulean', 1800, 'Mr. Holloway pours it into a bottle with great care.', item('mystic-water')),
      buy('Great Ball, from Celadon', 540, 'Miss Stott announces her own stall, and then the sale.', item('great-ball')), c('Back to the lanterns.', o('Back.', s.open('main')))]);
  s.room('main', 'Viridian Night Market', 'Lanterns on strings from the Mart to the Gym.',
    [c('The town stalls.', o('Back to the stalls.', s.open('stalls'))), c('The lost-and-found stall.', o('The umbrella, and the small old woman under it.', s.open('lost'))), c('Go.', o('Everybody waves.'))]);
  s.room('lost', 'Night Market: Lost and Found', 'It sells back what you lost to an event in Kanto, at the price it went for.',
    [c('The chewed parcel.', o('It\'s here. It\'s still ticking. She won\'t take money for it: "It was always yours."', flag('kanto-parcel-found'), item('poke-ball', 5)), { requires: [is('kanto-parcel-lost'), not('kanto-parcel-found')] }),
      c('The perfume you let go.', o('A small bottle, wrapped in a gardener\'s scarf.', cash(-1000), item('perfume-vial')), { requires: [is('kanto-perfume-lost'), { kind: 'money', atLeast: 1000 }] }),
      c('Nothing, thank you.', o('"Then nothing\'s been lost. That happens too."'))]);
}

// ============================================================ PEWTER CITY (Stage 1)

// ---------- Ten Brothers and Sisters (anime)
{
  const s = space(E, { id: 'cs.kanto.pewter.siblings', town: 'pewter', name: 'Ten Brothers and Sisters', kind: 'EV', appears: 'roll', flags: ['kanto.pewter.siblings'], section: `${DOC}: Ten Brothers and Sisters`,
    placed: { stage: [1], home: 14, window: [12, 16], sits: 'optional', attaches: 'after', badge: 'A row of small faces', level: null, often: 'Once per run' } });
  s.entry('Ten Brothers and Sisters',
    'A roadside table. A sign: GENUINE ROCKS. PEWTER SOUVENIRS. A man in a hat pulled low, who looks like somebody. The rock seller, Flint: "You want a rock? No. Nobody does. Listen. I\'ve an errand. One hour. There\'s ten of them in that house, and my eldest\'s at work. Mind them. I\'ll pay in rocks, or in something better."',
    [c('"Go on, then."', o('Ten faces at the door. Ten opinions about lunch.', s.open('cook'))), c('"Not today."', o('He nods, and goes back to not selling rocks.'))],
    { remembers: [{ id: 'stew', when: [is('kanto-stew-perfect')], notice: 'Nine of them recognise you from the camp. "It\'s the stew one!"' }] });
  s.room('cook', 'The Ten: Cook', 'A pot, six ingredients, ten opinions. Each child says what they hate, once, fast. Pick the three that the most children will eat.',
    [c('Potato, carrot, cheese.', o('Eight empty bowls. Two that were licked.', score(4), s.open('mend'))), c('Potato, onion, cheese.', o('Seven bowls. Three with the onion picked out in a careful pile.', score(2), s.open('mend'))),
      c('Carrot, peas, fish.', o('Four bowls. Six polite faces.', score(1), s.open('mend'))), c('Everything.', o('Nobody eats it. Everybody says it\'s fine.', s.open('mend')))]);
  s.room('mend', 'The Ten: Mend', 'A torn shirt, a broken toy, a scraped knee. Match each to the right fix.',
    [c('Needle, glue, a plaster, and "you\'re brave."', o('The knee wants a plaster and being told it\'s brave. It gets both.', score(3), s.open('find'))),
      c('Needle, glue, a plaster.', o('The knee is fine. It wanted the other thing too.', score(2), s.open('find'))), c('A plaster for everything.', o('The shirt is now mostly plaster.', score(1), s.open('find')))]);
  s.room('find', 'The Ten: Find', 'Nine children at the table. A count. A recount. The tenth\'s hiding. Three places to look.',
    [c('The laundry basket.', o('The tenth, from inside the laundry basket: "I wasn\'t hiding. I was waiting to be noticed."', score(3), s.open('home'))), c('Under the stairs.', o('Two odd socks, and nobody. She turns up for pudding.', score(1), s.open('home'))),
      c('The wardrobe.', o('Coats. She turns up for pudding.', score(1), s.open('home'))), c('Let your lead sniff her out.', o('Your lead walks straight to the laundry basket and sits beside it. "I wasn\'t hiding. I was waiting to be noticed."', score(3), s.open('home')))]);
  s.room('home', 'The Ten: Home', 'The door. Flint, back from his errand, and someone behind him.',
    [c('Seven or more.', o('A home-cooked meal, and a Hard Stone. And Brock, home from work: "You got Suzie out of the basket? She doesn\'t come out for me." He tells you the road ahead.', heal(0.5), item('hard-stone'), { kind: 'revealStops' }, flag('kanto-pewter-siblings'), moment('Minded ten brothers and sisters for an hour, and found the tenth.')), { requires: [is('kanto-siblings-score', 7)] }),
      c('Fewer.', o('The meal only. It\'s slightly burnt. The children eat it anyway and tell you it\'s fine, in the voice people use for that.', heal(0.5), flag('kanto-pewter-siblings')), { requires: [is('kanto-siblings-score', 0, 6)] })]);
}

// ---------- The Water Wheel (anime)
{
  const s = space(E, { id: 'cs.kanto.pewter.wheel', town: 'pewter', name: 'The Water Wheel', kind: 'EV', appears: 'roll', flags: ['kanto.pewter.wheel'], section: `${DOC}: The Water Wheel`,
    placed: { stage: [1], home: 5, window: [3, 8], sits: 'optional', attaches: 'after', badge: 'A wheel', level: null, often: 'Once per run' } });
  s.entry('The Water Wheel',
    'A shed on the river. A wheel that isn\'t turning. A cable that goes nowhere. The keeper, a woman eating her lunch on the sluice gate: "Town doesn\'t need it since the new line. She still works. Put something on the cable if you like. Or put something in the wheel. I pay for the turning; the lights at the school run off it." Shown first: whoever works here starts its next battle at 80% HP. It worked hard.',
    [c('"Charge one." (an Electric type)', o('It\'s Charged: Special Attack up on entry for the rest of the stage.', temp('Charged at the Water Wheel: Special Attack +1 stage', [{ kind: 'statMultiplier', stat: 'spa', value: 1.5 }], 5, 'boss'), { kind: 'damage', share: 0.2, who: 'picked' }, flag('kanto-pewter-wheel')), { pick: { types: ['electric'] } }),
      c('"Turn the wheel." (a Rock or Ground type)', o('It turns the wheel. The lights at the school come on. Coins, by its Attack.', cash(600), { kind: 'damage', share: 0.2, who: 'picked' }, flag('kanto-pewter-wheel')), { pick: { types: ['rock', 'ground'] } }),
      c('Anything else, in the river.', o('It gets wet. It\'s quite pleased.', fr(5, 'picked'), flag('kanto-pewter-wheel')), { pick: {} }),
      c('"Just the lunch, thanks."', o('She shares it. A small heal.', heal(0.15), flag('kanto-pewter-wheel')))]);
}

// ---------- The Museum After Hours (manga; Pseudo Stage, short; Trigger: the Museum was visited and a fossil is held)
{
  const s = space(E, { id: 'cs.kanto.pewter.afterhours', town: 'pewter', name: 'The Museum After Hours', kind: 'PS', appears: 'trigger', requires: { spaces: ['cs.kanto.pewter.museum'] }, flags: ['kanto.pewter.afterhours', 'kanto.pewter.fossil-registered'], section: `${DOC}: The Museum After Hours`,
    placed: { stage: [1], home: 17, sits: 'door', attaches: 'town', badge: 'A bone, with eyes', level: 1, often: 'Once per run (at Night; dropped if not met by Step 17)' },
    ps: { name: 'The Museum After Hours', themeId: 'water-rock', mood: 'moonlight through the roof, and something old turning over' } });
  const fossil: Json = holdsAny('helix-fossil', 'dome-fossil', 'old-amber', 'root-fossil', 'claw-fossil', 'skull-fossil', 'armor-fossil', 'cover-fossil', 'plume-fossil', 'jaw-fossil', 'sail-fossil');
  s.entry('The Museum After Hours',
    'The museum\'s side door is open. The guard\'s asleep in his chair with a sandwich on his chest, going up and down. The fossil hall. Moonlight through the roof. Your own fossil\'s warm in the bag. Behind the glass of the third case, something turns over.',
    [c('Go in.', battle('An Omanyte, half-woken. Slow, and it hits hard, and it isn\'t angry. It\'s confused.', wild(['omanyte'], { levelBonus: s.lv, win: [s.open('n2')], lose: [s.open('fail')] })), { requires: [fossil] }),
      c('Shut the door.', o('You leave the guard to his sandwich.'))]);
  s.room('n2', 'After Hours: The Second Case', 'After the battle it lies down by your bag. It\'s found the only other thing in the room as old as it is. Then a Kabuto, the same.',
    [c('Hold still.', battle('Slow, hard-hitting, bewildered.', wild(['kabuto'], { levelBonus: s.lv, win: [s.open('amber')], lose: [s.open('fail')] })))]);
  s.room('amber', 'After Hours: The Amber Case', 'The Old Amber\'s glowing from the inside. The glass has a crack in it that wasn\'t there this afternoon.',
    [c('"Take it to someone who can wake it properly."', o('The Old Amber, to be revived at Cinnabar. A note\'s left on the guard\'s sandwich.', item('old-amber'), flag('kanto-pewter-afterhours'))),
      c('"Wake the guard. Report it."', o('Dr. Blackwood, in a dressing gown, within minutes: "Nine years I\'ve sat up with that stone, and it does it the one night I go home." He registers your fossils on the spot.', flag('kanto-pewter-fossil-registered'), flag('kanto-museum-registry'), intel(), flag('kanto-pewter-afterhours'))),
      c('"Leave it. Shut the door."', o('The glow goes down. In the morning, the crack\'s gone too.', flag('kanto-pewter-afterhours')))]);
  s.room('fail', 'After Hours: Shown Out', 'The guard wakes.',
    [c('Go quietly.', o('You\'re shown out, politely, still holding his sandwich by mistake. Nothing\'s lost.', flag('kanto-pewter-afterhours')))]);
}

// ---------- Route 3 Rematch Ladder (the games' Route 3)
{
  const s = space(E, { id: 'cs.kanto.pewter.ladder', town: 'pewter', name: 'Route 3 Rematch Ladder', kind: 'EV', appears: 'roll', flags: ['kanto.pewter.ladder'], section: `${DOC}: Route 3 Rematch Ladder`,
    placed: { stage: [1], home: 9, window: [7, 11], sits: 'optional', attaches: 'instead', badge: 'A ladder', level: -1, often: 'Once per run' } });
  const RUNG: [string, string, string[], number, string][] = [
    ['Youngster Benny', '"I like shorts! They\'re comfy and easy to wear!"', ['rattata'], -1, '"They\'re still comfy. JANICE!"'],
    ['Lass Janice', '"He always calls me. He always loses first. It\'s a system."', ['pidgey', 'nidoran-f'], 0, '"Robby! Bug boy! You\'re up!"'],
    ['Bug Catcher Robby', '"I\'ve got four. They\'re all the same one. I like that one."', ['caterpie', 'caterpie', 'caterpie', 'caterpie'], 1, '"MARCOS! ...He\'ll be a minute. He\'s big."'],
    ['Hiker Marcos', '"I let them think it\'s their ladder."', ['geodude', 'onix'], 1, '"Hah! Good. Top of it\'s yours. Found it up the mountain. Been waiting for somebody to get past Robby. Took a year."'],
  ];
  RUNG.forEach(([name, before, team, lv, after], i) => {
    const last = i === RUNG.length - 1;
    const win = [cash(150 * (i + 1)), ...(last ? [item('lucky-egg'), flag('kanto-pewter-ladder'), moment('Climbed the whole Route 3 ladder.')] : [s.open(`r${i + 2}`)])];
    const fight = c(`Battle ${name}.`, battle(`${name}: ${before}`, foe(name, { team, size: team.length, levelBonus: lv, win, lose: [flag('kanto-pewter-ladder')] })));
    const stop = c('Stop here.', o('You keep what you won. The rest of the ladder pretends not to be disappointed.', flag('kanto-pewter-ladder')));
    const intro = i === 0 ? 'Four trainers standing in a line along the path, a careful ten paces apart, pretending not to know one another. You may stop after any battle; coins for each.' : `${RUNG[i - 1]![0]}, after losing: ${RUNG[i - 1]![4]}`;
    if (i === 0) s.entry('Route 3 Rematch Ladder', intro, [fight, c('Walk past.', o('Four people pretend very hard not to watch you go.'))]);
    else s.room(`r${i + 1}`, `Route 3 Ladder: ${name}`, intro, [fight, stop]);
    void after;
  });
}

// ---------- The Scientist Who Stayed (anime; joined to Mt. Moon)
{
  const s = space(E, { id: 'cs.kanto.pewter.seymour', town: 'pewter', name: 'The Scientist Who Stayed', kind: 'EV', appears: 'roll', requires: { spaces: ['cs.kanto.pewter.moon'] }, flags: ['kanto.pewter.seymour'], section: `${DOC}: The Scientist Who Stayed`,
    placed: { stage: [1], home: 11, sits: 'optional', attaches: 'after', badge: 'A lab coat', level: null, often: 'Once per run' } });
  s.entry('The Scientist Who Stayed',
    'A thin man in a lab coat at the cave mouth, being mobbed by Zubat, and apologising to them. Seymour: "They\'re upset about the lamps. Somebody\'s strung lamps through the whole cave. They can\'t sleep. I can\'t sleep. I\'ve written a poem about it. Would you— no. Nobody ever does."',
    [c('"Go on. Read it."', o('"\'O Clefairy, of the Moon, / You came down in a— a— \' I hadn\'t a rhyme. I\'ve put \'spoon.\' It isn\'t right."', s.open('walk'))),
      c('"Who strung the lamps?"', o('"Men in black. Very tidy cable work. I\'ve been following it." He shows you where it goes.', intel(), s.open('walk')), { requires: [{ kind: 'evil', team: 'rocket' }] }),
      c('"Do you need walking somewhere?"', o('"I\'ll stand behind you and be encouraging." He\'s no use in a fight, and says so.', s.open('walk'))),
      c('Leave him to the Zubat.', o('He waves at you. The Zubat wave at you. It\'s hard to tell which is which.'))]);
  s.room('walk', 'Seymour: Through the Cave', 'He\'s walked through Mt. Moon\'s first two nodes, behind you, being encouraging.',
    [c('Walk on.', o('Nothing stirs. He reads you the poem again, quieter.', s.open('chamber')), { chance: 0.5,
      fail: battle('A Zubat that has had enough of the lamps.', wild(['zubat', 'paras', 'geodude'], { levelBonus: -1, win: [s.open('chamber')] })) })]);
  s.room('chamber', 'Seymour: The Moon Stone Chamber', 'He stops in the doorway. The Clefairy are in a ring round the great stone. One of them looks at him, and moves over to make a space. Seymour: "Oh. Oh, I see. I\'ve been writing about it from the outside."',
    [c('Leave him there.', o('A Moon Stone, pressed into your hand. He stays. He waves until you\'re out of sight.', item('moon-stone'), flag('kanto-pewter-seymour'), moment('Walked a poet to the Moon Stone, and left him in the ring.')))]);
}

// ---------- The Serum (manga; inside Mt. Moon; Trigger: Team Rocket's awake)
{
  const s = space(E, { id: 'cs.kanto.pewter.serum', town: 'pewter', name: 'The Serum', kind: 'EV', appears: 'trigger', requires: { spaces: ['cs.kanto.pewter.moon'] }, flags: ['kanto.pewter.serum', 'kanto.serum.calmed'], section: `${DOC}: The Serum`,
    placed: { stage: [1], home: 12, sits: 'optional', attaches: 'after', badge: 'None', level: 1, often: 'Once per run (inside Mt. Moon, while Team Rocket is awake)' } });
  s.entry('The Serum',
    'A side chamber. A portable lamp. A Grunt kneeling by a Rhyhorn, with a case open beside him. Grunt: "Hold still. It\'s a pinch. They said it\'s a pinch." The Rhyhorn\'s too young. It\'s looking at the case, and it\'s backed into the wall. What happens next is in the Grunt\'s face: he flinches, and looks away from it, and it\'s still happening. A Rhydon\'s standing where the Rhyhorn was. It\'s enormous. It\'s shaking.',
    [c('Stand between it and the wall.', battle('It attacks the Grunt\'s lamp, the wall and you, in turn. It isn\'t choosing. It loses strength every turn.',
      wild(['rhydon'], { levelBonus: s.lv, win: [intel(), intel(), s.open('after')], lose: [s.open('fail')] }))),
      c('Back away.', o('You back away. Behind you, the Grunt says "easy" over and over, and doesn\'t mean it.', heat(1)))], { requires: [rocket] });
  s.room('after', 'The Serum: After', 'The Grunt runs, leaving the case. The Rhydon\'s on its side, breathing hard.',
    [c('"Easy. Easy. It\'s over."', o('Your lead goes to it first. It quietens. It goes off into the dark, slowly, favouring one side.', rep(3), flag('kanto-pewter-serum'), flag('kanto-serum-calmed'), moment('Calmed a Rhydon that had been a Rhyhorn an hour before.'))),
      c('"It can\'t be left like this. Bring it in."', o('It comes with you. The game says plainly: it never has to be used in a battle.', join(['rhydon'], { levelBonus: -1 }), flag('kanto-pewter-serum')))]);
  s.room('fail', 'The Serum: Gone', 'The Grunt leaves with it.',
    [c('Pick up the case.', o('The case is still left behind, empty.', heat(3), flag('kanto-pewter-serum')))]);
}

// ============================================================ CERULEAN CITY (Stage 2)

// ---------- The Water Ballet (anime)
{
  const s = space(E, { id: 'cs.kanto.cerulean.ballet', town: 'cerulean', name: 'The Water Ballet', kind: 'EV', appears: 'roll', flags: ['kanto.cerulean.ballet', 'kanto.trio.rep'], section: `${DOC}: The Water Ballet`,
    placed: { stage: [2], home: 17, sits: 'town', attaches: 'town', badge: "A mermaid's tail", level: 0, often: 'Once per run' } });
  s.entry('The Water Ballet',
    'A theatre with a glass tank for a stage. A poster: THE MAGICAL MERMAID. Three sisters having one argument in three voices. Daisy: "She\'s got a cold. You can\'t have a mermaid who sneezes. The bubbles." Violet: "So we cancel." Lily: "We\'ve sold seats." All three look at your party. Daisy: "...Does that one swim?"',
    [c('"It swims." (a Water type)', o('Your Pokémon is the mermaid\'s companion.', s.open('dance')), { pick: { types: ['water'] } }),
      c('"I\'ll be the prince."', o('You\'re handed water wings. Lily: "The prince doesn\'t do much. He sinks, attractively."', s.open('dance'))),
      c('"Not tonight."', o('They cancel. Lily cries a bit. Daisy says she isn\'t.'))]);
  s.room('dance', 'The Water Ballet: Three Movements', 'The Pokémon follows the lead sister through hoops of bubbles. Bond makes the timing kinder.',
    [c('Follow her.', o('Three movements, and the bubbles hold.', s.open('finale')), { prompt: ['echo-rhythm', 'ok'], fail: o('A hoop missed. The audience claps anyway; they think it\'s the plan.', s.open('finale')) })]);
  s.room('finale', 'The Water Ballet: The Finale', 'A submarine shaped like a Gyarados comes through the back of the set. Jessie, by loudspeaker: "Prepare for trouble, and make it—" The audience applauds. They think it\'s the villain. James: "...They like us. Jess. They like us."',
    [c('Battle, in the pool.', battle('Water moves are stronger in here, and the audience cheers every hit.',
      foe('Jessie and James', { team: ['ekans', 'koffing', 'meowth'], size: 3, levelBonus: s.lv, weather: 'rain', win: [s.open('bow')], lose: [s.open('fail')] }), flag('kanto-trio-met')))]);
  s.room('bow', 'The Water Ballet: Curtain', 'When the submarine\'s blasted through the roof, it gets a standing ovation, and so does the hole.',
    [c('Take a bow.', o('A Mystic Water. And a Seel from the chorus that\'s taken to your Pokémon asks to come.', item('mystic-water'), rep(3), trio(1), join(['seel']), flag('kanto-cerulean-ballet'), moment('Saved the Magical Mermaid, and took a bow in water wings.')))]);
  s.room('fail', 'The Water Ballet: No Finale', 'The show goes on without a finale.',
    [c('Bow anyway.', o('The Mystic Water only.', item('mystic-water'), flag('kanto-cerulean-ballet')))]);
}

// ---------- Pokémon Tech (anime)
{
  const s = space(E, { id: 'cs.kanto.cerulean.tech', town: 'cerulean', name: 'Pokémon Tech', kind: 'EV', appears: 'roll', flags: ['kanto.cerulean.tech', 'kanto.tech.marks'], section: `${DOC}: Pokémon Tech`,
    placed: { stage: [2], home: 6, window: [4, 8], sits: 'door', attaches: 'instead', badge: 'A mortarboard', level: 1, often: 'Once per run' } });
  const mark = (n = 1) => flag('kanto-tech-marks', n);
  s.entry('Pokémon Tech',
    'Fog. A gate with a crest. A boy on a treadmill in the yard, holding a candle, being timed by four others. A student with a stopwatch: "He failed the Pidgey question. Level sixteen. Sixteen. Everybody knows eighteen." The boy, Joe: "I beat a Water type with a Grass type on the simulator. It doesn\'t count, they say. It only counts if it\'s the answer in the book."',
    [c('"Leave him alone."', o('The stopwatches stop. Joe gets off the treadmill. He looks at you as if nobody has said that before.', ...kind(), s.open('test'))),
      c('"Give me the test."', o('A desk, a pencil, and five questions.', s.open('test'))),
      c('"What\'s it for? The candle?"', o('"Nothing. That\'s why it\'s a punishment."', s.open('test')))]);
  const Q: [string, string, string, string][] = [
    ['One', 'Water against Fire?', 'Double.', 'Half.'], ['Two', 'Electric against Ground?', 'Nothing.', 'Double.'], ['Three', 'Grass against Flying?', 'Half.', 'Double.'],
    ['Four', 'Ghost against Normal?', 'Nothing.', 'Normal.'],
  ];
  Q.forEach(([n, ask, right, wrong], i) => s.room(`q${i + 1}`, `Pokémon Tech: Question ${n}`, ask, [c(right, o('A tick.', mark(), s.open(i === 3 ? 'q5' : `q${i + 2}`))), c(wrong, o('A cross.', s.open(i === 3 ? 'q5' : `q${i + 2}`)))]));
  s.room('test', 'Pokémon Tech: The Test', 'Five questions on types and levels. One has an answer that\'s right in the book and wrong on the road.', [c('Turn the page.', o('Question one.', s.open('q1')))]);
  s.room('q5', 'Pokémon Tech: Question Five', '"At what level does Pidgey evolve?"',
    [c('"Eighteen." (the book)', o('A tick.', mark(), s.open('giselle'))), c('"Whenever it\'s ready." (the road)', o('It loses the mark, and Joe laughs for the first time.', s.open('giselle')))]);
  s.room('giselle', 'Pokémon Tech: The Top Student', 'Giselle: "You\'ve badges. Real ones. I\'ve the equivalent of two, on paper. Shall we find out what paper\'s worth?" Her Pokémon are level-perfect, with ideal moves. They\'re badly bonded.',
    [c('Battle Giselle.', battle('Giselle, when one hesitates: "That isn\'t in the— why did it do that?"', foe('Giselle', { team: ['cubone', 'weepinbell', 'slowpoke'], size: 3, levelBonus: s.lv, win: [s.open('after')], lose: [s.open('after')] })))]);
  s.room('after', 'Pokémon Tech: After', 'Giselle: "It looked at me. Mid-match. As if I\'d know what to do. ...I\'ve never been looked at like that. I think I\'d like to be."',
    [c('Shake her hand.', o('Wise Glasses. And from Joe, a hand-drawn type chart, with corrections in three colours.', item('wise-glasses'), flag('kanto-cerulean-tech'), moment('Answered the Pidgey question the road\'s way at Pokémon Tech.')))]);
}

// ---------- AJ's Tent (anime; optional, not a Gym)
{
  const s = space(E, { id: 'cs.kanto.cerulean.aj', town: 'cerulean', name: "AJ's Tent", kind: 'EV', appears: 'roll', flags: ['kanto.cerulean.aj', 'kanto.aj.lost'], section: `${DOC}: AJ's Tent`,
    placed: { stage: [2], home: 4, window: [3, 7], sits: 'optional', attaches: 'instead', badge: 'A tent with a number on it', level: 1, often: 'Once per run' } });
  const fight = c('"Let\'s go."', battle('His Sandshrew, standing in a tub of water, looking bored. Water moves do it normal damage, not double.',
    foe('AJ', { team: ['sandshrew'], size: 1, levelBonus: s.lv, win: [s.open('won')], lose: [s.open('lost')] })));
  s.entry("AJ's Tent",
    'A circus tent in a field. A board outside, on a nail: 98 WINS. 0 LOSSES. The 98\'s on a card that\'s been changed many times. AJ: "You\'re ninety-nine. Don\'t take it personal. At a hundred, I pack the tent and go to the League. I\'ve been promising them that since they were this high." A Sandshrew, a Butterfree, a Rattata, a Beedrill, all with weights tied on.',
    [fight, c('"Water? On a Sandshrew?"', o('"Took a year. It hated me for six months of it. Ask it now." The Sandshrew splashes him.', s.open('talk'))),
      c('"You\'re hard on them."', o('"I\'m in the tub at five every morning before it is. I don\'t ask what I don\'t do."', s.open('talk')))]);
  s.room('talk', "AJ's Tent", 'The weights clink. The Sandshrew is still splashing him.', [fight, c('Leave the tent.', o('He nods. The card stays at 98.'))]);
  s.room('won', "AJ's Tent: After", 'He looks at the board for a while.', [c('Shake hands.', o('"...Huh. So that\'s what it\'s like. It\'s not so bad." A Macho Brace.', item('macho-brace'), flag('kanto-cerulean-aj'), flag('kanto-aj-lost')))]);
  s.room('lost', "AJ's Tent: After", 'He changes the card to 99. "One more. Then they\'ve earned it."', [c('Take it.', o('A Soft Sand, for trying.', item('soft-sand'), flag('kanto-cerulean-aj')))]);
}

// ---------- The Bike in the Window (games and anime; always, the town)
{
  const s = space(E, { id: 'cs.kanto.cerulean.bike', town: 'cerulean', name: 'The Bike in the Window', kind: 'SHOP', appears: 'always', flags: ['kanto.cerulean.bike', 'kanto.cerulean.bike-debt'], section: `${DOC}: The Bike in the Window`,
    placed: { stage: [2], home: 2, sits: 'town', attaches: 'town', badge: 'A bicycle', level: null, often: 'Once per run; the joke at most once' } });
  s.entry('The Bike in the Window',
    'A shop with one bicycle in the window on a turning stand. The price is on a card: ₽1,000,000. The owner: "It\'s a very good bicycle."',
    [c('"A million?"', o('"It\'s a very, very good bicycle."', s.open('shop'))), c('"Do you take vouchers?"', o('He takes it without surprise. The Bicycle.', lose('bike-voucher'), item('bicycle'), flag('kanto-cerulean-bike')), { requires: [has('bike-voucher')] }),
      c('"Has anybody ever bought one?"', o('"No. But a great many people have looked. I count that."', s.open('shop')))],
    { remembers: [{ id: 'debt', when: [is('kanto-cerulean-bike-debt'), not('kanto-bike-paid')], addChoices: [c('Pay the girl back (₽3,000).', o('She\'s found she likes the road. She keeps going.', cash(-3000), rep(3), flag('kanto-bike-paid')), { requires: [{ kind: 'money', atLeast: 3000 }] })] }] });
  s.room('shop', 'The Bike in the Window', 'It turns on its stand. It is a very good bicycle.',
    [c('Look a while longer.', o('You count as one of the great many people who have looked.', flag('kanto-cerulean-bike'))),
      c('Ride past on someone else\'s.', o('A smell of burnt rubber. A girl\'s voice, from a long way off, getting nearer: "HEY!" A girl with a side ponytail and a very carrying voice: "I\'m not following you. I\'m going the same way. Until I\'ve got a bike."', flag('kanto-cerulean-bike-debt'), flag('kanto-cerulean-bike')), { requires: [moveType('electric')] })]);
}

// ---------- The Second Offer (Trigger: Bridge Crossing won, Team Rocket awake)
{
  const s = space(E, { id: 'cs.kanto.cerulean.recruiter', town: 'cerulean', name: 'The Second Offer', kind: 'EV', appears: 'trigger', requires: { spaces: ['cs.kanto.cerulean.bridge'] }, flags: ['kanto.cerulean.recruiter', 'kanto.recruiter.card', 'kanto.police.tip'], section: `${DOC}: The Second Offer`,
    placed: { stage: [2], home: 11, sits: 'optional', attaches: 'after', badge: 'A business card', level: null, often: 'Once per run' } });
  s.entry('The Second Offer',
    'The far end of the bridge. The man who stood there\'s back. No trainers this time. A better coat. The recruiter: "Five in a row. I told head office five in a row, and they said, \'Offer more.\' So. More. A salary. A territory. Your friends looked after. You wouldn\'t have to hurt anybody. You\'d just have to not look, on certain days." A card, held between two fingers. It\'s blank on one side.',
    [c('"I\'ll take the card."', o('The Inside Man route can be accepted here, early. It\'s the same offer the evil-team story makes later, and it follows that story\'s rules; nothing\'s hidden.', { kind: 'evil', heat: 1 }, flag('kanto-recruiter-card'), flag('kanto-cerulean-recruiter'))),
      c('"No."', o('He tips his hat. "Most say no. A few say it like that."', heat(2), intel(), intel(), flag('kanto-cerulean-recruiter'))),
      c('"I\'ll take the card." (and report it)', o('The police are told. Where the Kanto script checks for a police tip, this counts as one.', intel(), intel(), intel(), intel(), intel(), flag('kanto-police-tip'), flag('kanto-cerulean-recruiter'))),
      c('"What happens on those days?"', o('"If I told you, you\'d have to look. That\'s the whole product."', s.open('ask')))], { requires: [rocket] });
  s.room('ask', 'The Second Offer', 'The card, still held out.',
    [c('"No."', o('He tips his hat. "Most say no. A few say it like that."', heat(2), intel(), intel(), flag('kanto-cerulean-recruiter'))),
      c('"I\'ll take the card." (and report it)', o('The police are told.', intel(), intel(), intel(), intel(), intel(), flag('kanto-police-tip'), flag('kanto-cerulean-recruiter')))]);
}

// ---------- The Girl with the Stall (manga)
{
  const s = space(E, { id: 'cs.kanto.cerulean.stall', town: 'cerulean', name: 'The Girl with the Stall', kind: 'EV', appears: 'roll', flags: ['kanto.cerulean.stall', 'kanto.ally.stall-girl'], section: `${DOC}: The Girl with the Stall`,
    placed: { stage: [2], home: 14, window: [12, 16], sits: 'optional', attaches: 'after', badge: 'A price tag', level: null, often: 'Once per run; one return' } });
  s.entry('The Girl with the Stall',
    'A folding table. A cheerful girl in a wide hat. Rare Candy, Nuggets, a PP Max, a Master Ball, all at a third of the price. The Honest Trade Card\'s shown, and it\'s the joke: "Rare Candy (boiled sweet)." "Nugget (painted)." "Master Ball (a Poké Ball with an M drawn on)." The game never lies to you. She does. "Fell off a Silph lorry! Not literally. Legally. Fell off it legally."',
    [buy('"I\'ll take the Nugget."', 300, 'You own a boiled sweet. It\'s a nice one. It\'s strawberry.', flag('kanto-cerulean-stall')),
      buy('"Half that."', 150, 'She comes down, with great suffering, to a quarter. It\'s still a boiled sweet.', flag('kanto-cerulean-stall')),
      c('"These are fakes."', o('She laughs, properly. "Finally. I\'ve been here all day. Nobody looks." She packs up in six seconds, and leaves one real thing behind for the trouble.', item('rare-candy'), flag('kanto-cerulean-stall'), flag('kanto-ally-stall-girl')), { requires: [holdsAny('nugget', 'rare-candy', 'pp-max')] }),
      c('Walk on.', o('"Your loss! Legally!"'))]);
}

// ---------- The River Gyarados (manga; Trigger: Team Rocket's awake)
{
  const s = space(E, { id: 'cs.kanto.cerulean.gyarados', town: 'cerulean', name: 'The River Gyarados', kind: 'EV', appears: 'trigger', flags: ['kanto.cerulean.gyarados'], section: `${DOC}: The River Gyarados`,
    placed: { stage: [2], home: 12, window: [10, 14], sits: 'optional', attaches: 'instead', badge: 'A harness', level: 2, often: 'Once per run (one more try at the Vermilion docks)' } });
  const freed = [rep(5), item('dragon-scale'), flag('kanto-cerulean-gyarados'), moment('Broke the harness off Margaret the Gyarados, and gave her back to the bank.')];
  s.entry('The River Gyarados',
    'The river\'s the wrong colour and going the wrong way. Something\'s tearing up the bank. A Gyarados, thrashing. Behind its head, bolted on, a grey collar with a light on it. A fisherman on the bank, hoarse, Mr. Alaric Dunmow: "MARGARET! Margaret, it\'s me! ...She was a Magikarp eleven years. She evolved the day they took her. She did it to get away." Shown before you accept: she is far stronger than the road.',
    [c('"I\'ll get that thing off her."', battle('The harness is a second target. Three clean hits on it, and the light should go out.', wild(['gyarados'], { levelBonus: s.lv, win: [s.open('harness')], lose: [s.open('away')] }))),
      c('"Stand back. I\'ll stop her."', battle('No aiming at the harness. Just her.', wild(['gyarados'], { levelBonus: s.lv, win: [s.open('stopped')], lose: [s.open('away')] }))),
      c('"It\'s too strong. I\'m sorry."', o('Mr. Dunmow doesn\'t argue. He doesn\'t look away from the river, either.'))], { requires: [rocket] });
  s.room('harness', 'The River Gyarados: The Light Goes Out', 'It cracks. The light goes out. She stops, and looks at the bank.',
    [c('Let her go to him.', o('Mr. Dunmow: "There you are. There\'s my girl. Look at the size of you." She\'s shed a Dragon Scale on the bank.', ...freed)), c('Wait a moment longer.', o('She lays her head on the bank, and he puts both arms round as much of it as he can.', ...freed))]);
  s.room('stopped', 'The River Gyarados: Stopped', 'She\'s stopped. The harness is whole.',
    [c('Leave her with him.', o('Rocket comes for it that night. Mr. Dunmow thanks you anyway, and doesn\'t look at you.', heat(3), flag('kanto-cerulean-gyarados')))]);
  s.room('away', 'The River Gyarados: Downstream', 'She goes downstream.',
    [c('Follow the river.', o('She\'s met again at the Vermilion docks, where the harness can be tried for once more.', { kind: 'laterEvent', eventId: s.id('docks'), nodes: 6 }))]);
  s.room('docks', 'The River Gyarados: The Vermilion Docks', 'The harness light, blinking between the pilings.',
    [c('Try for the harness again.', battle('Weaker now, and tired. So are you.', wild(['gyarados'], { levelBonus: s.lv - 1, win: [s.open('harness')], lose: [flag('kanto-cerulean-gyarados')] }))),
      c('Let her be.', o('The light goes under the water, and doesn\'t come up.', flag('kanto-cerulean-gyarados')))], later());
}

// ============================================================ VERMILION CITY (Stage 3)

// ---------- The Capsized Liner (anime; Pseudo Stage: three rooms; Trigger: the S.S. Anne went down)
{
  const s = space(E, { id: 'cs.kanto.vermilion.capsized', town: 'vermilion', name: 'The Capsized Liner', kind: 'PS', appears: 'trigger', requires: { spaces: ['cs.kanto.vermilion.ssanne'] }, flags: ['kanto.vermilion.capsized', 'kanto.trio.rep'], section: `${DOC}: The Capsized Liner`,
    placed: { stage: [3], home: 6, sits: 'must', attaches: 'instead', badge: 'A ship, upside down', level: 0, often: 'Once per run (follows the S.S. Anne at once)' },
    ps: { name: 'The Capsized Liner', themeId: 'water-dark', mood: 'the chandelier standing up out of the floor, and water at every porthole' } });
  const air = (n: number) => flag('kanto-capsized-air', n);
  const done = [trio(10), flag('kanto-vermilion-capsized'), moment('Climbed out through the bottom of an upside-down ship with Team Rocket, under a truce.')];
  const ROOMS: [string, string, string, [string, Json[]], [string, Json[]], string][] = [
    ['stairs', 'The Stairs', 'The staircase is overhead.', ['A ladder of Pokémon.', [{ kind: 'partyTypes', types: ['grass', 'bug', 'fighting'] }]], ['A Flying type carries a rope.', [typed('flying')]], 'The trio\'s Ekans and Weezing make the ladder. One extra turn of air.'],
    ['door', 'The Fire Door', 'Shut, and warped.', ['Cut it.', [moveType('steel')]], ['Freeze the hinges and break them.', [moveType('ice')]], 'Meowth picks it with a claw. One extra turn. "I\'ve had practice. Don\'t ask where."'],
    ['hull', 'The Hull', 'The way out\'s through the bottom, which is the top.', ['Burn through.', [moveType('fire')]], ['An Electric move on the rivet line.', [moveType('electric')]], 'Koffing and a match. One extra turn, and everybody\'s eyebrows.'],
  ];
  s.entry('The Capsized Liner',
    'You wake on the ceiling. The chandelier\'s standing up out of the floor. Water at every porthole. James: "Is this the afterlife? It\'s very like the ballroom." Meowth: "It is the ballroom. We\'re on the roof of it. The ship\'s the wrong way up, the sea\'s the right way up, and there\'s air for about three rooms." Jessie: "Truce."',
    [c('"Truce."', o('The truce is real for the length of the stage. They don\'t steal. They don\'t run. Meowth counts the air: nine turns.', s.open('stairs'))),
      c('"Why should I trust you?"', o('Jessie: "Because I\'d rather be arrested than drowned. It\'s a low bar. I\'m clearing it."', s.open('stairs')))]);
  ROOMS.forEach(([id, name, problem, [a, ra], [b, rb], neither], i) => {
    const next = i < ROOMS.length - 1 ? s.open(ROOMS[i + 1]![0]) : s.open('surface');
    const keep = [item(['poke-ball', 'ether', 'escape-rope'][i]!)];
    s.room(id, `The Capsized Liner: ${name}`, `${problem} One item may be carried from each room.`,
      [c(a, o('It takes one turn of air.', air(1), ...keep, next), { requires: ra }), c(b, o('It takes one turn of air.', air(1), ...keep, next), { requires: rb }),
        c('Let the trio do it.', o(neither, air(3), ...keep, next))]);
  });
  s.room('surface', 'The Capsized Liner: The Surface', 'Meowth checks the count.',
    [c('Up.', o('Daylight. Everybody\'s on a piece of hull. Nobody says anything for a bit. James: "We should do the motto." Jessie: "We should. In a minute." They don\'t.', ...done), { requires: [is('kanto-capsized-air', 0, 9)] }),
      c('Up, in the dark.', o('Dark. Then: sand. You\'re washed ashore at 1 HP. One room\'s item is lost. The trio are further up the beach, alive, arguing about whose fault the sea is.', { kind: 'damage', share: 0.99 }, lose('escape-rope'), flag('kanto-vermilion-capsized')), { requires: [is('kanto-capsized-air', 10)] })]);
}

// ---------- Porta Vista (anime; small hub with one event)
{
  const s = space(E, { id: 'cs.kanto.vermilion.portavista', town: 'vermilion', name: 'Porta Vista', kind: 'HUB', appears: 'roll', flags: ['kanto.vermilion.portavista', 'kanto.moe.takings'], section: `${DOC}: Porta Vista`,
    placed: { stage: [3], home: 13, window: [11, 15], sits: 'door', attaches: 'plus', badge: 'A beach umbrella', level: null, often: 'Once per run; it can be returned to' } });
  const take = (n = 1) => flag('kanto-moe-takings', n);
  const hub = [
    c('Rest at Moe\'s.', o('The party\'s fed, on a table for sixty with three customers.', heal(0.3), s.open('hub'))),
    c('Work Moe\'s tables.', o('Three small jobs: wait on them, call customers in, fix the sign.', s.open('jobs'))),
    c('Enter the Beach Pokémon Talent Contest.', o('One of your Pokémon enters. It\'s judged on Bond, not level.', s.open('contest')), { pick: {} }),
    c('Leave the beach.', o('Moe waves a tea towel.')),
  ];
  s.entry('Porta Vista',
    'A beach. A restaurant on stilts with three customers and room for sixty. Next door, a newer one, full, with a loudspeaker. Moe, an old sailor: "Forty years at sea. I bought her to stop moving. Now I owe on her till the end of the week, and I\'ve a boat I was going to sail round the world, and I can\'t do both." Mrs. Brunhilde Oxley, from her veranda: "He can\'t do either. I\'m not the villain, dear. I\'m the arithmetic."',
    hub, { remembers: [{ id: 'paid', when: [is('kanto-vermilion-portavista')], notice: 'Moe\'s is full. He feeds your party free.' }] });
  s.room('hub', 'Porta Vista', 'The beach, Moe\'s stilts, and the loudspeaker next door.', hub);
  s.room('jobs', "Porta Vista: Moe's Tables", 'Each job adds to the takings; together they pay a third of the debt.',
    [c('Wait on them.', o('A memory game: six orders, nobody writes them down, you get them all to the right table.', take(), s.open('hub')), { prompt: ['tilt-drag', 'ok'], fail: o('One soup to the wrong table. They eat it anyway.', s.open('hub')) }),
      c('Call customers in.', o('Your most appealing Pokémon stands at the top of the steps. Eleven people come up them.', take(), s.open('hub'))),
      c('Fix the sign.', o('MOE\'S, again, with the S facing the right way.', take(), s.open('hub'))), c('Back.', o('Back to the beach.', s.open('hub')))]);
  s.room('contest', 'The Beach Talent Contest', 'Three rounds: an entrance, a talent, a moment with its trainer.',
    [c('A moment with its trainer.', o('Judge: "We\'ve seen bigger. We\'ve seen shinier. We haven\'t seen one look at its trainer like that since— well. Since Moe\'s old Tentacool." The prize. The debt\'s paid.', cash(2000), flag('kanto-vermilion-portavista'), moment('Won the Beach Pokémon Talent Contest, and paid off Moe\'s.')), { requires: [{ kind: 'bondLevel', atLeast: 2, who: 'picked' }] }),
      c('Do your best.', o('Not this time. The end of the week. Moe\'s packing. An envelope under the door: the whole sum, no name. He keeps the place. Mrs. Oxley is seen walking away down the beach without her handbag. "I\'ve no idea what you mean. Arithmetic doesn\'t have favourites."', flag('kanto-vermilion-portavista')))]);
}

// ---------- Naptime (anime)
{
  const s = space(E, { id: 'cs.kanto.vermilion.naptime', town: 'vermilion', name: 'Naptime', kind: 'EV', appears: 'roll', flags: ['kanto.vermilion.naptime'], section: `${DOC}: Naptime`,
    placed: { stage: [3], home: 11, window: [9, 13], sits: 'optional', attaches: 'after', badge: 'A swinging pendulum', level: 0, often: 'Once per run' } });
  const cured = (text: string, ...x: Json[]) => o(`${text} The Hypno turns its waves round. The children wake, on the grass, puzzled, hungry. The one from the sandpit: "I had a tail. Mum. I had a tail." A Drowzee the club kept as a spare asks to leave with you.`,
    ...x, join(['drowzee']), temp('A headache lifted: Special Attack doubled', [{ kind: 'statMultiplier', stat: 'spa', value: 2 }], 1), flag('kanto-vermilion-naptime'), moment('Woke the children of the harbour street who thought they were Pokémon.'));
  s.entry('Naptime',
    'A harbour street with posters on every pole. Children\'s faces. All from the last three days. A mother: "He was in the garden. I looked away to hang a sheet." The park. They\'re all here. They\'re all fine. One\'s on all fours in the sandpit, digging. One\'s on a branch, cooing. One\'s saying "Psy?" and holding its head. Officer Jenny: "They don\'t know their names. They\'re happy as anything. We can\'t get them home; they keep going back to the grass."',
    [c('Follow the trail.', o('A door with a brass plate: THE POKÉMON LOVERS\' CLUB. MEMBERS ONLY.', s.open('club')))]);
  s.room('club', "Naptime: The Pokémon Lovers' Club", 'Velvet chairs, tired people in good suits, and a Hypno with its pendulum going. The chairman, Mr. Horatio Favell: "We don\'t sleep. Any of us. Business. He gives us an hour a night. It\'s the only hour we have. You\'d take it away?"',
    [c('"The waves carry. Come and see the park."', cured('He comes. He stands at the park railings a long time. "...Mine\'s eleven. She\'s at school. She might have been—" He goes back and stops it himself.', ...kind())),
      c('"Switch it off, or I will."', battle('The members watch, too tired to object.', foe('Mr. Favell', { team: ['hypno'], size: 1, levelBonus: s.lv, win: [s.open('after')], lose: [s.open('after')] }))),
      c('"Does the Hypno want to be doing this?"', cured('It doesn\'t. It\'s been at it nine nights without rest. It puts the pendulum down the moment somebody asks.', fr(5, 'lead')))]);
  s.room('after', 'Naptime: After', 'The pendulum on the carpet.', [c('Pick it up.', cured('Mr. Favell doesn\'t argue.'))]);
}

// ---------- The Dam (anime)
{
  const s = space(E, { id: 'cs.kanto.vermilion.dam', town: 'vermilion', name: 'The Dam', kind: 'EV', appears: 'roll', flags: ['kanto.vermilion.dam'], section: `${DOC}: The Dam`,
    placed: { stage: [3], home: 8, window: [6, 10], sits: 'optional', attaches: 'instead', badge: 'A hard hat on a molehill', level: null, often: 'Once per run' } });
  s.entry('The Dam',
    'A valley. Diggers on their sides. A queue of trainers at a table, and a foreman with a bag of money and no voice left. Foreman Callahan: "Diglett! Every night! Holes under the lorries! A fortune to whoever clears them off. I\'ve had forty trainers. Not one\'s so much as thrown a Ball. Cowards, the lot." The site. A row of Diglett, watching. You reach for a Poké Ball. It won\'t open. None of them will. From inside each one: a small, firm no.',
    [c('"...Why won\'t you come out?"', o('Your party\'s out of its Balls now, of its own accord, looking up the valley.', s.open('valley'))), c('"Come on."', o('The Balls stay shut. Nothing\'s lost. The foreman pays somebody else, who has the same trouble.', flag('kanto-vermilion-dam'))),
      c('"What\'s up the valley?"', o('A forest the Diglett planted, and tend, tree by tree.', s.open('valley')))],
    { remembers: [{ id: 'cave', when: [is('kanto-diglett-waited')], notice: 'One Diglett comes up, looks at you, and nods. These Diglett know.' }] });
  s.room('valley', 'The Dam: Up the Valley', 'Dugtrio turning the soil, Diglett carrying seedlings. The dam would put it under forty feet of water. Your party\'s looking at the trees, and then at you.',
    [c('Side with the Diglett.', o('You take the foreman up the valley. He looks. He sits down on a stump. "...Nobody told me there was a forest. It\'s not on the plan. It\'s a blank on the plan." The dam\'s moved. By morning there\'s a new line of saplings down the road, and a Soft Sand on your bag.', item('soft-sand'), ...kind(), flag('kanto-vermilion-dam'), s.open('ask'))),
      c('Insist.', o('The Balls stay shut. Nothing\'s lost. The foreman pays somebody else, who has the same trouble.', flag('kanto-vermilion-dam')))]);
  s.room('ask', 'The Dam: The Saplings', 'A Diglett is standing by your bag, very still, the way they do when they\'ve decided something.',
    [c('Ask it along.', o('It comes.', join(['diglett']))), c('Leave it with its trees.', o('It goes back down. A sapling, a little straighter than the others.'))]);
}

// ---------- The Photographer (anime; stage-long: he joins at Step 1, the album later in the stage)
{
  const s = space(E, { id: 'cs.kanto.vermilion.photographer', town: 'vermilion', name: 'The Photographer', kind: 'EV', appears: 'roll', flags: ['kanto.vermilion.photographer', 'kanto.photographer.on'], section: `${DOC}: The Photographer`,
    placed: { stage: [3], home: 1, sits: 'optional', attaches: 'after', badge: 'A camera', level: null, often: 'Once per run (the album near the stage\'s end)' } });
  s.entry('The Photographer',
    'A bush with a lens in it. A click. Your lead looks round. Another click. Todd, falling out of the bush: "Don\'t move! No, do. Do what you were doing. I\'ve been hired. A magazine. Two very elegant editors and their cat. They said: \'Capture that one\'s Pokémon.\' So!" He pats the camera. He means: on film. He\'s no idea they meant anything else.',
    [c('"Follow along, then."', o('He\'s at the edge of every node from now on. Each thing that happens is a photograph.', flag('kanto-photographer-on'), { kind: 'laterEvent', eventId: s.id('album'), nodes: 12 })),
      c('"Who hired you, exactly?"', o('"Two editors and a cat. Very elegant. One of them had a rose." He follows along anyway.', intel(), flag('kanto-photographer-on'), { kind: 'laterEvent', eventId: s.id('album'), nodes: 12 })),
      c('"No pictures."', o('He\'s crushed, and goes. Nothing happens.', flag('kanto-vermilion-photographer')))]);
  s.room('album', 'The Photographer: The Album', 'Jessie, earlier, somewhere: "Where is it? The Pokémon?" Todd: "Here! Sixty exposures!" Meowth: "...He took pictures. Of course he did. We said \'capture.\' We deserve this." Now he hands the album over, and won\'t be paid. "I take them of Pokémon. I don\'t do people. ...There\'s a few of you in the corners. You kept being where they were looking."',
    [c('"Clean Sweep" and "Asleep, All Six."', o('Coins for one, and a keepsake for the other.', cash(500), fr(3), flag('kanto-vermilion-photographer'), moment('Got an album from Todd: sixty exposures, and you in the corners.'))),
      c('"Nobody Was Looking (I Was)."', o('The kindness you didn\'t think anybody saw.', ...kind(), flag('kanto-vermilion-photographer')), { requires: [is('kind-total')] }),
      c('"Three Stars, Daytime."', o('The trio, blasting off, in focus.', trio(1), flag('kanto-vermilion-photographer')), { requires: [is('kanto-trio-met')] })], later());
}

// ---------- The Itemfinder (games; always)
{
  const s = space(E, { id: 'cs.kanto.vermilion.itemfinder', town: 'vermilion', name: 'The Itemfinder', kind: 'EV', appears: 'always', flags: ['kanto.vermilion.itemfinder'], section: `${DOC}: The Itemfinder`,
    placed: { stage: [3], home: 18, sits: 'optional', attaches: 'after', badge: 'A small antenna', level: null, often: 'Once per run; it can be come back to' } });
  const thirty: Json = { kind: 'dex', set: 'caught', atLeast: 30 };
  const give = o('"Thirty-four! Thirty-four. I can go home. I can\'t remember where it is. I\'ll find it. I\'ve a device." The Itemfinder: hidden items will beep for the rest of the run.', item('itemfinder'), flag('kanto-vermilion-itemfinder'));
  s.entry('The Itemfinder',
    'A gatehouse with an upstairs. A young man at a desk with a ledger, who\'s been waiting for anybody at all. The assistant, Mr. Ambrose Tack: "The professor sent me to give this to a trainer who\'s seen thirty kinds. That was four months ago. May I count yours? I\'ve counted the gulls. There\'s nine."',
    [c('"Count away." (thirty or more)', give, { requires: [thirty] }),
      c('"Count away."', o('"Twenty-two. Eight more. I\'ll be here." He is.', { kind: 'laterEvent', eventId: s.id('again'), nodes: 3 })),
      c('"Another time."', o('He goes back to the gulls.'))]);
  s.room('again', 'The Itemfinder: Again', 'A Pidgey lands on your shoulder with a note from Mr. Tack: "Count again?"',
    [c('"Count away."', give, { requires: [thirty] }), c('Not yet.', o('The Pidgey waits, then goes home.'))], later());
}

// ============================================================ LAVENDER TOWN (the start of Stage 4)

// ---------- The Name Rater (games; always)
{
  const s = space(E, { id: 'cs.kanto.lavender.namerater', town: 'lavender', name: 'The Name Rater', kind: 'EV', appears: 'always', flags: [], section: `${DOC}: The Name Rater`,
    placed: { stage: [4], home: 1, sits: 'town', attaches: 'town', badge: 'A name tag', level: null, often: 'Once per Pokémon' } });
  s.entry('The Name Rater',
    'A front room with a desk, a ledger of every name he\'s ever rated, and a man who\'s been rating them out loud to himself. The Name Rater: "Names are my trade. I don\'t sell them. I assess them. Show me one. I\'ll tell you what I think, and you won\'t thank me."',
    [c('Show him one with its species\' own name.', o('"You\'ve called your Pidgey \'Pidgey.\' I call my wife \'Wife.\' She\'s left." He gives it a name of its own. "There. See its ears? It likes having one. They all do. It\'s the difference between being a thing and being the thing."', fr(5, 'picked')), { pick: {} }),
      c('Show him one with a short name.', o('"Serviceable. It\'ll come when it\'s called. Most don\'t."', fr(2, 'picked')), { pick: {} }),
      c('Show him one with a very long name.', o('"It\'s a sentence. You\'ve named it a sentence. By the time you\'ve shouted it, the battle\'s over."', fr(2, 'picked')), { pick: {} }),
      c('"Not today."', o('"Nobody ever thanks me. I\'ve stopped minding. I\'ve not stopped noticing."'))]);
}

// ---------- The Listening Post (a nod to the later Radio Tower)
{
  const s = space(E, { id: 'cs.kanto.lavender.radio', town: 'lavender', name: 'The Listening Post', kind: 'EV', appears: 'roll', flags: ['kanto.lavender.pulse'], section: `${DOC}: The Listening Post`,
    placed: { stage: [4], home: 2, sits: 'town', attaches: 'town', badge: 'A radio mast', level: null, often: 'Once per run' } });
  const pulse = flag('kanto-lavender-pulse');
  s.entry('The Listening Post',
    'A hill above the town. A shed. An aerial made of fence wire and a coat hanger. The volunteer, Miss Cordelia Wray: "I built it for the music. There\'s a station from Goldenrod, on a good night. Only there\'s this, now. Under the music. It isn\'t music." She turns a dial. A pulse. Short, short, long. A gap. Again. "From the west. Every forty seconds. I\'ve written it down." A notebook: pages of dots. "It never changes. Things that never change, somebody\'s keeping them that way."',
    [c('"I\'ve heard that before."', o('It\'s the same pulse. She goes white. "It\'s talking to them?" She gives you the gap between pulses: that\'s when a rigged Pokémon is weakest.', pulse, intel(), temp('The gap between pulses: the next rigged Pokémon is easier', [{ kind: 'captureMultiplier', value: 1.25 }], 1, 'wild')), { requires: [is('capture-rig-seen')] }),
      c('"Could it be a lighthouse? A buoy?"', o('"A lighthouse doesn\'t stop when you listen." The notebook\'s a File.', pulse, intel(), intel(), intel())),
      c('"How long has it been going?"', o('"Since the spring. It got louder the week the Tower had its trouble." The notebook\'s a File.', pulse, intel(), intel(), intel()))]);
}

// ---------- The Channelers' Vigil (games)
{
  const s = space(E, { id: 'cs.kanto.lavender.vigil', town: 'lavender', name: "The Channelers' Vigil", kind: 'EV', appears: 'roll', flags: ['kanto.lavender.vigil', 'kanto.tower.escort'], section: `${DOC}: The Channelers' Vigil`,
    placed: { stage: [4], home: 3, sits: 'optional', attaches: 'before', badge: 'Three candles', level: 0, often: 'Once per run' } });
  const calm = (n = 1) => flag('kanto-vigil-calm', n);
  const W: [string, string, string, string][] = [
    ['first', 'The first: "Give... me... your... all..."', 'Pippin. Raticate. Eleven years.', '"Pippin." The candle goes upright. Something small and quick runs out of her, across the grass, and through a headstone as if it\'s a door. The Channeler: "Oh. He only wanted somebody to say it. They stop saying it, you see. After a while."'],
    ['second', 'The second: "Zombies!" (She\'s the only one who seems to be enjoying it.)', 'Bramble. Growlithe. A good boy.', '"Bramble." She stops enjoying it, and sits down on the grass, and laughs, and cries a bit.'],
    ['third', 'The third says a name. It isn\'t hers.', 'Mabel. Clefairy. Sang.', '"Mabel." Something hums, very quietly, in the key of a lullaby, and stops.'],
  ];
  W.forEach(([id, line, stone, said], i) => {
    const next = i < W.length - 1 ? s.open(W[i + 1]![0]) : s.open('done');
    const pick = [
      c('A Cleanse Tag.', o('It works at once.', lose('cleanse-tag'), calm(), item('spell-tag'), next), { requires: [has('cleanse-tag')] }),
      c('Read the stone, and say the name.', o(`The stone: "${stone}" ${said}`, calm(), item('spell-tag'), next)),
      c('Battle.', battle('Something comes out of her that isn\'t her.', wild([i === 2 ? 'haunter' : 'gastly'], { levelBonus: s.lv, win: [next], lose: [next] }))),
    ];
    if (i === 0) s.entry("The Channelers' Vigil", `Three women in white at the Tower's door, with candles. They aren't blinking. The candles are burning sideways. ${line} Each stands by a stone, and the stone can be read first.`, [...pick, c('Go round them.', o('The candles turn to follow you.'))]);
    else s.room(id, `The Channelers' Vigil: The ${id[0]!.toUpperCase()}${id.slice(1)}`, line, pick);
  });
  s.room('done', "The Channelers' Vigil: The Door", 'Three candles, burning upright.',
    [c('All three calmed.', o('They walk you up the Tower\'s first two floors. Those floors have no wild encounters, and the unseen things stand aside.', flag('kanto-tower-escort'), flag('kanto-lavender-vigil'), moment('Said three names at the Tower door, and three candles stood up.')), { requires: [is('kanto-vigil-calm', 3)] }),
      c('Go on in.', o('The door\'s open. The candles stay lit behind you.', flag('kanto-lavender-vigil')))]);
}

// ---------- The Orphan (games; always, inside Mr. Fuji's House)
{
  const s = space(E, { id: 'cs.kanto.lavender.orphan', town: 'lavender', name: 'The Orphan', kind: 'EV', appears: 'always', flags: ['kanto.lavender.orphan', 'kanto.orphan.cubone'], section: `${DOC}: The Orphan`,
    placed: { stage: [4], home: 1, sits: 'town', attaches: 'town', badge: 'None', level: null, often: 'Once per run' } });
  const leave = c('"Leave it be."', o('You leave it be. It doesn\'t look round. It might have.'));
  s.entry('The Orphan',
    'Under Mr. Fuji\'s kitchen table, in the furthest corner, something with a skull on its head and its back to the room. A volunteer: "It came from the Tower. It won\'t eat with the others. Don\'t try and pull it out. People try. It\'s worse after."',
    [c('"Sit down on the floor."', o('You sit. Nothing happens. The clock in the hall. The Psyduck doorstop sighs. The Cubone\'s turned its head a little.', flag('kanto-lavender-orphan'), s.open('w2'))), leave],
    { remembers: [{ id: 'lonely', when: [is('kanto-tower-marowak')], notice: 'Mr. Fuji: "Ah. You\'ve met it already, I think. It came back to wait for you."' }] });
  s.room('w2', 'The Orphan: Waiting', 'Longer. A volunteer steps over your legs without comment.',
    [c('"Sit down on the floor."', o('It\'s a foot nearer. It\'s holding its club in both hands.', flag('kanto-lavender-orphan'), s.open('w3'))), leave]);
  s.room('w3', 'The Orphan: Waiting', 'The light\'s moved across the floor.',
    [c('"Sit down on the floor."', o('It\'s against your knee. It isn\'t looking at you. It\'s shaking, and then it isn\'t. It follows you to the Tower. It isn\'t a party member, and it doesn\'t battle.', flag('kanto-lavender-orphan'), flag('kanto-orphan-cubone'), moment('Sat on Mr. Fuji\'s floor until a Cubone came out from under the table.'))), leave]);
}

// ---------- The Offering (Trigger: this run has lost a Pokémon in battle, or released one)
{
  const s = space(E, { id: 'cs.kanto.lavender.offering', town: 'lavender', name: 'The Offering', kind: 'EV', appears: 'trigger', flags: ['kanto.lavender.offering'], section: `${DOC}: The Offering`,
    placed: { stage: [4], home: 1, sits: 'town', attaches: 'town', badge: 'A folded cloth', level: null, often: 'Once per run' } });
  const leaveOne = (label: string, id: string) => c(label, o('He wraps it in a cloth, writes the name on a tag, and puts it on a shelf with a great many others. "It\'ll get there. I couldn\'t tell you how. I\'ve stopped asking how."', lose(id), flag('kanto-lavender-offering'), moment('Left something at the House of Memories, for one who didn\'t get this far.')), { requires: [has(id)] });
  s.entry('The Offering',
    'A small building beside the Tower. THE HOUSE OF MEMORIES. A man sweeping a floor that\'s already clean. The grave-keeper, Mr. Tobias Merriman: "We keep a book. Not only the ones buried here. The ones who didn\'t get that far, too. The ones who were set down somewhere and left. Is there anybody you\'d like to leave something for?" The book is open at this journey\'s page.',
    [leaveOne('Leave a Potion.', 'potion'), leaveOne('Leave a Poké Ball.', 'poke-ball'),
      c('"All of them."', o('"One thing, for one. That\'s the rule. It isn\'t my rule. If it were for everybody, it\'d be for nobody."', s.open('one'))), c('"Not today."', o('He goes back to sweeping. "The book\'s always open."'))],
    { requires: [{ kind: 'memberFainted', within: 30 }] });
  s.room('one', 'The House of Memories', 'One thing, for one.', [leaveOne('Leave a Potion.', 'potion'), leaveOne('Leave a Poké Ball.', 'poke-ball'), c('"Not today."', o('"The book\'s always open."'))]);
}

export const REMOVE: string[] = retired(EVENTS);
void [EXTRA, SPACES, followup, kc, not, is, has];
