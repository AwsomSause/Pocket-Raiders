// Catalog Overhaul, families-c part 3: STORY_FAMILIES_9.md SF64 to SF71 (The Statue Garden, The Lapras Who Waited,
// The Scarecrow, Starlit Cave, The Clock Tower, The Trubbish Nobody Wanted, The Veteran, The Janitor = GL2 in
// QUESTLINES_PAST_CHAMPIONS_AND_LEADERS.md). Re-read log: docs/status/co-families-c.md.
import { again, bondUp, ch, egg, ev, ferry, fight, flag, flagAgo, flagIs, fr, good, heal, item, join, leave, out, room, takeNode, takeNodeBack, type Json } from '../dsl.ts';
import { BERRY, HAS_BERRY, against, done, notYet, repUp, ruled, stamped, tf, wf } from './_families-c-kit.ts';

export const CATEGORY = 'families-c';

// ---------- SF64 The Statue Garden ----------
const STATUES = ['eevee', 'vulpix', 'snorunt', 'swinub', 'sneasel', 'spheal'];
const GARDEN = { pokemon: 'froslass', tint: '#1c2a3a', effect: 'snow' };
const thawFight = (text: string): Json =>
  fight(text, ruled(wf({ species: ['froslass'], lv: 1, win: [room('garden-thawed')] }, [room('garden-held')]), { surviveTurns: 3 }));

const SF64: Json[] = [
  ev('r116-frozen-statue-garden', 'The Statue Garden', 'Wild Scenes', GARDEN,
    'A garden of ice statues, each a Pokémon caught in a different pose. Some of them are breathing. A Froslass glides between them, adjusting a pose here, a tilt there. Froslass (a cold whisper): "My collection. Beautiful, aren\'t they. They hold still forever."',
    [
      ch('Thaw them.', thawFight('Your Fire-type breathes on the nearest statue. The ice weeps. The Froslass turns, and the air goes white. Hold on for three turns.'), { pick: { types: ['fire'] } }),
      ch('Battle the Froslass.', fight('"You would break my garden?" The Froslass rises, and every statue seems to watch.', wf({ species: ['froslass'], lv: 1, win: [room('garden-after')] }, [room('garden-held')]))),
      ch('Ask why.', out('The Froslass stops. For a long time it says nothing. Froslass: "Everyone leaves." It touches the cheek of an ice Eevee. "Not these."', room('garden-why'))),
    ]),
  ev('garden-thawed', 'The Statue Garden', 'Wild Scenes', { room: true, ...GARDEN },
    'Three turns, and the first statue cracks. Then the next, and the next. The Froslass shrieks and flees into the frost. One by one the thawed Pokémon shake off the cold and run for the trees.',
    [ch('Watch them go.', out('All but one. It stays at your feet, shivering, and looks up at you like you are the first warm thing it has seen in years.', join({ species: STATUES, lv: 0 }), fr(10, 'newest')))]),
  ev('garden-after', 'The Statue Garden', 'Wild Scenes', { room: true, ...GARDEN },
    'The Froslass flees into the frost. The garden is quiet. The statues stay frozen. Some of them are still breathing.',
    [
      ch('Thaw them now.', out('With no one to stop you, your Fire-type works down the rows. The thawed Pokémon run for the trees. One stays.', join({ species: STATUES, lv: 0 }), fr(10, 'newest')), { pick: { types: ['fire'] } }),
      ch('Leave them.', leave('You leave them as they are. Behind you, something in the ice is still breathing.')),
    ]),
  ev('garden-held', 'The Statue Garden', 'Wild Scenes', { room: true, ...GARDEN },
    'The cold drives you back to the gate. The Froslass straightens the statue you touched, very gently, and does not look at you.',
    [ch('Go.', leave('You go. Your team is shivering, but whole.'))]),
  ev('garden-why', 'The Statue Garden', 'Wild Scenes', { room: true, ...GARDEN },
    'Froslass: "They came to see me once. All of them. Then they went home." It looks at you. "You will go home too."',
    [
      ch('Stay a while.', out('You sit down in the snow. You stay. The light moves across the garden. When you finally stand, the Froslass lifts one hand and the ice lets go, all at once. Every statue breathes, and runs. The Froslass stays, and asks, very quietly, if it can come too.', join({ species: ['froslass'], lv: 0 }), fr(20, 'newest'), good(1))),
      ch('Thaw them.', thawFight('"So you are like the rest." Your Fire-type breathes on the nearest statue. Hold on for three turns.'), { pick: { types: ['fire'] } }),
      ch('Leave.', leave('You leave. The Froslass watches you all the way to the gate, and then turns back to its collection.')),
    ]),
];

// ---------- SF65 The Lapras Who Waited (a chain pseudo-stage: three sea nodes) ----------
// "It visits the shore every run": within the run, once in every later region. Each visit re-stamps `lapras-chose` in
// this region and clears the seen mark, so the callback waits for the next region again.
const nextShore: Json[] = [flag('lapras-chose', -99), flag('lapras-chose-at', -99), stamped('lapras-chose'), again('lapras-shore')];
const SEA = { pokemon: 'lapras', tint: '#102838', effect: 'rain' };
const SF65: Json[] = [
  ev('r133-lapras-ferry', 'The Lapras Who Waited', 'Wild Scenes', { cast: ['trainer.youngster'], ...SEA },
    'A Lapras at the shore, singing softly. It looks at your Berry pouch, then at the water. A fisher\'s boy, Theo: "It\'s been there a month. Every pod that passes, it sings. None stop." Theo: "It\'s small for a Lapras. I think it\'s a baby."',
    [
      ch('Feed it.', out('It eats from your hand, slowly, like it forgot how. Then it nuzzles you, hard enough to knock you a step back, and sings one soft note just for you.', BERRY, bondUp(1, 'party')), { requires: [HAS_BERRY] }),
      ch('Ride it out to look for the pod.', out('You climb onto its shell. It is warm. It looks back at you once, and swims out into the grey.', room('lapras-sea-1'))),
      ch('Ask Theo what else he knows.', out('Theo lowers his voice. Theo: "Some men with nets came through. Before it showed up." He looks out at the water. "I don\'t think it got lost."', stamped('lapras-poachers'), again('r133-lapras-ferry'))),
    ]),
  ev('lapras-sea-1', 'Open Water', 'Wild Scenes', { room: true, ...SEA },
    'The shore is gone behind you. Only water, rain, and the Lapras singing every few strokes, listening for an answer that doesn\'t come.',
    [
      ch('Sing with it.', out('You hum along, badly. The Lapras turns its head and makes a sound that is almost a laugh. It swims faster.', room('lapras-sea-2'))),
      ch('Keep watch.', out('You watch the horizon. Far off, a shape. Then another. Then a boat.', room('lapras-sea-2'))),
    ]),
  ev('lapras-sea-2', 'The Nets', 'Wild Scenes', { room: true, cast: ['trainer.roughneck'], ...SEA },
    'A boat across the water, nets over the side. Men on deck. One of them points at your Lapras and grins. Poacher: "There\'s the one that got away."',
    [
      ch('Fight them off.', fight('The Lapras trembles under you. You put your hand on its shell. "Not this time."', { ...tf('Poachers', { cls: 'roughneck', size: 3, lv: 1, win: [room('lapras-pod'), repUp(1)] }, [room('lapras-pod')]), pseudo: true })),
    ]),
  ev('lapras-pod', 'The Pod', 'Wild Scenes', { room: true, ...SEA },
    'Beyond the boat, the sea is full of singing. A pod of Lapras, huge and slow, turning toward the little one. It stops beside you and doesn\'t move. It looks at them. Then it looks at you.',
    [
      ch('Let it go to them.', out('It swims to the pod. They close around it. Just before they dive, it turns and sings one long note back to you. Then it is gone. Something floats up where it was: a Mystic Water.', item('mystic-water'), good(1))),
      ch('Ask it to stay.', out('It stays. It swims beside you all the way back, and it does not sing. It will be sad for a long time. That is the price, and it is paying it for you.', join({ species: ['lapras'], lv: 0 }), fr(-40, 'newest'))),
      ch('Let it choose.', out('It swims to the pod. Then back to you. Then to the pod. It goes. At the edge of the pod it turns and sings, and you understand: it will come to the shore again.', stamped('lapras-chose'))),
    ]),
  ev('lapras-shore', 'A Song at the Shore', 'Wild Scenes', { callback: true, requires: [flagAgo('lapras-chose', 1)], ...SEA },
    'A shore, far from the first one. A song you know, out on the water. The little Lapras, a little bigger now, swims up to the rocks and puts its chin on your boots.',
    [
      ch('Sit with it a while.', out('You sit with it until the tide turns. Your team naps in the sound of it. When it swims off, it sings the whole way out.', heal(0.5), bondUp(1, 'party'), ...nextShore)),
    ]),
];
Object.assign(SF65[0]!, {
  remembers: [
    { id: 'warned', when: [flagIs('lapras-poachers')], notice: 'Theo\'s warning sits in your head. You count the nets on every boat you pass.', addChoices: [] },
  ],
});
Object.assign(SF65[2]!, {
  remembers: [
    {
      id: 'warned', when: [flagIs('lapras-poachers')], notice: 'Theo warned you. You see the nets before they see you.',
      addChoices: [ch('Cut their nets first.', out('You slip alongside in the rain and saw through the nets while they argue on deck. When they turn, there is nothing left to throw. You are already gone.', room('lapras-pod'), repUp(1)))],
    },
  ],
});
Object.assign(SF65[3]!, {
  remembers: [
    { id: 'hospice', when: [flagIs('hospice-stayed')], notice: 'The old Lapras at the hospice was this one\'s grandmother. When the pod sings, it sings for her too.', addChoices: [] },
  ],
});

// ---------- SF66 The Scarecrow ----------
const CORN = { pokemon: 'trevenant', tint: '#2a2410', effect: 'shake' };
const CORN_BERRIES = ['cheri-berry', 'pecha-berry', 'rawst-berry', 'aspear-berry', 'persim-berry'].map((id) => item(id));
const harvest = (text: string, nodes: number): Json => out(text, takeNode(nodes), egg({ species: ['pumpkaboo'] }), ...CORN_BERRIES, good(1));
const SF66: Json[] = [
  ev('r140-scarecrow-cornfield', 'The Scarecrow', 'Wild Scenes', CORN,
    'A tall scarecrow in a cornfield turns its head to look at you. It isn\'t stuffed with straw. It\'s a Ghost: a Trevenant in an old coat. The Scarecrow: "Harvest. Someone has to bring in the harvest." The Scarecrow: "He died in spring. He\'d want the corn in."',
    [
      ch('Bring in the harvest (two nodes).', harvest('Two long days of work. Your team carries, cuts, and stacks. At sunset the corn is in. The Scarecrow stands in the empty field and finally rests. It leaves you a seed, and the corn.', 2)),
      ch('Battle it.', fight('It doesn\'t want to fight. It fights anyway. When it\'s over it flees into the corn, and by morning the whole field has rotted.', wf({ species: ['trevenant'], lv: 1, win: [] }))),
      ch('Who was he?', out('The Scarecrow: "Old Amos. Planted me when I was a stump." It looks at the corn. "He talked to me every morning. Nobody talks to me now."', room('scarecrow-amos'))),
    ]),
  ev('scarecrow-amos', 'The Scarecrow', 'Wild Scenes', { room: true, ...CORN },
    'The Scarecrow waits. The corn moves in the wind.',
    [
      ch('Bring in the harvest (two nodes).', harvest('You talk to it every morning while you work. On the second evening the corn is in. The Scarecrow rests, and it is smiling, you think.', 2)),
      ch('Leave it its field.', leave('You leave it standing in the corn. It watches you go, the way it watched Amos go.')),
    ]),
];
for (const e of SF66) Object.assign(e, {
  remembers: [
    {
      id: 'wynne', when: [flagIs('farmer-end')], notice: 'Amos was Abner\'s brother. Wynne comes up the lane with a basket on her arm. Wynne: "Uncle Amos would want it in. I\'ll help."',
      hide: [0], addChoices: [ch('Harvest with Wynne (a node).', harvest('With Wynne beside you it goes twice as fast. She tells you stories about Amos the whole time. When the corn is in, the Scarecrow puts one hand on her head, and rests.', 1))],
    },
  ],
});

// ---------- SF67 Starlit Cave ----------
const SF67: Json[] = [
  ev('r141-starlit-cave-loomians', 'Starlit Cave', 'Wild Scenes', { pokemon: 'minior', tint: '#14182a', effect: 'glint' },
    'Glowing shapes bob through a cave like stars, leading deep into the dark. They\'re Minior, still in their shells, slowly drifting. At the cave\'s heart: a colony, and a crater ceiling open to the sky.',
    [
      ch('Follow them.', out('You follow them into the colony. One drifts too low, crashes, and cracks its shell. For a second it lies still. Then it flies out, bright as a real star, and circles your head before it rises out of the crater.', bondUp(1, 'party'))),
      ch('Catch one.', out('One drifts into your hands like it wanted to. Its shell is warm.', join({ species: ['minior'], lv: 0 }))),
      ch('Look up.', out('Through the crater, the stars. One of them moves the wrong way. It stops. It looks back.', flag('telling-deoxys', 1))),
    ]),
];
Object.assign(SF67[0]!, {
  remembers: [
    { id: 'deoxys', when: [flagIs('promise-deoxys')], notice: 'The colony hums. Three tones, over and over. The same three tones as the crater signal.', addChoices: [] },
  ],
});

// ---------- SF68 The Clock Tower ----------
const CLOCK = { cast: ['trainer.lady'], pokemon: 'hoothoot', tint: '#14182a', effect: 'glint' };
const waitBell = (signs: number): Json => out('The hands meet. The bell rings, once, enormous. Everything skips. You are a little further down the road than you were, and the world did not notice.', ferry(), flag('sign-dialga', signs));
const SF68: Json[] = [
  ev('r169-hoothoot-clock-tower', 'The Clock Tower', 'Wild Scenes', CLOCK,
    'A clock tower in a field. A Hoothoot on every ledge. A great bell. The hands are almost at twelve. Keeper, Rosalie: "At twelve the bell rings and time skips. Just a little. Nobody believes me." Every Hoothoot turns its head at once.',
    [
      ch('Wait for twelve.', waitBell(1)),
      ch('Ring it early.', out('You pull the rope. The bell rings wrong, too soon. The clouds over the whole stage stop, and thin, and are gone. Rosalie: "Well. That\'s new."', { kind: 'clearSky' })),
      ch('Stop the clock.', out('You catch the big hand. Every Hoothoot screams. Rosalie goes white. Nothing happens. Then everything happens, and you are a step back down the road. Rosalie: "That\'s why we don\'t."', takeNodeBack())),
    ]),
];
Object.assign(SF68[0]!, {
  remembers: [
    { id: 'dialga', when: [flagIs('blessing-dialga')], notice: 'The bell hums at you before it rings. It knows whose blessing you carry.', hide: [0], addChoices: [ch('Wait for twelve.', waitBell(2))] },
  ],
});

// ---------- SF69 The Trubbish Nobody Wanted ----------
const SF69: Json[] = [
  ev('trash-to-treasure', 'The Trubbish Nobody Wanted', 'PokeRogue-style encounters', { pokemon: 'trubbish', tint: '#202818', effect: 'fog' },
    'A huge heap of junk. Something shiny pokes out of it: a Nugget. Something smelly guards it: a Trubbish on top of the heap, puffing itself up. It thinks the heap is its home.',
    [
      ch('Battle it for the Nugget.', fight('It puffs up as big as it can. It is not very big. When it\'s over you take the Nugget, and behind you the Trubbish sobs on its heap.', wf({ species: ['trubbish'], lv: 0, win: [item('nugget')] }))),
      ch('Clean the heap (two nodes).', out('Two days of sorting. The heap becomes a tidy pile, then a neat little house of crates. The Trubbish watches the whole time. When you leave, it follows you, and drops the Nugget at your feet like a gift.', takeNode(2), join({ species: ['trubbish'], lv: 0 }), flag('abandoned-mon'), { kind: 'boxBond', key: 'trubbish' }, item('nugget'), good(1))),
      ch('Leave it.', leave('You leave it on its heap. It watches you go, still puffed up, just in case.')),
    ]),
];

// ---------- SF70 The Veteran (Hargrove) ----------
// Hargrove "remembers previous runs". Runs never remember each other (Kice, 2026-11-14), so he remembers this run:
// the pack's own "no past run" line is used, and Vengeance needs a win over him in an earlier region of this run.
const HARGROVE = { cast: ['trainer.marshal'], tint: '#2e1a1a', effect: 'none' };
const hargrove = (o: Json, lose: Json[] = []): Json => tf('Hargrove', { cls: 'veteran', ...o }, lose);
const SF70: Json[] = [
  ev('ev-trainer-reunion', 'I Remember You', 'Trainer, Relationship', { ...HARGROVE, requires: [notYet('hargrove-met')] },
    'A crossroads. An old trainer with an eyepatch stands in the middle of it, arms folded, a Golem asleep at his feet. Hargrove: "I remember you. I never forget a trainer worth remembering." He squints. "I remember your face from somewhere. I\'ll work it out."',
    [
      ch('Battle.', fight('"Good." The Golem wakes up all at once.', hargrove({ size: 4, lv: 1, team: ['golem', 'machoke', 'onix', 'graveler'], win: [stamped('hargrove-met')] }, [stamped('hargrove-met')]))),
      ch('From where?', out('Hargrove looks at your {starter} for a long time. Hargrove: "It\'s that one. I knew it small." He nods, satisfied, and walks off before you can ask what he means.', stamped('hargrove-met'))),
      ch('Not today.', out('Hargrove: "Then I\'ll be at the next crossroads." He doesn\'t move. He doesn\'t need to.', again('ev-trainer-reunion'))),
    ]),
  ev('ev-unexpected-challenge', "I've Been Watching", 'Trainers and challenges', { ...HARGROVE, requires: [flagAgo('hargrove-met', 1), notYet('hargrove-watched')] },
    'Hargrove steps out of the grass. Hargrove: "I\'ve been watching your team. You lean on the same one too much. Battle me."',
    [
      ch('Battle.', fight('Every one of his Pokémon is built to beat {most}.', against(hargrove({ size: 4, lv: 1, win: [done('hargrove-watched')] }, [done('hargrove-watched')]), { against: 'most' }))),
      ch('Who do I lean on?', out('Hargrove: "{most}." He says it without looking. He is right. "It\'s a good one. It\'s also tired."', done('hargrove-watched'))),
      ch('Lead with someone else.', fight('You put another Pokémon in front. Hargrove raises one eyebrow.', hargrove({ size: 4, lv: 1, win: [done('hargrove-watched'), bondUp(1, 'picked')] }, [done('hargrove-watched')]), { kind: 'leadPicked' }), { pick: {} }),
    ]),
  ev('veteran-challenge', 'Show Me', 'Trainers and challenges', { ...HARGROVE, requires: [flagIs('hargrove-met'), notYet('hargrove-shown')] },
    'Late in the region, Hargrove is waiting at the top of a hill, the Golem beside him. Hargrove: "Show me what you\'ve learned."',
    [
      ch('Battle.', fight('"All of it," Hargrove says. "Don\'t hold back for an old man."', hargrove({ size: 5, lv: 2, team: ['golem', 'machamp', 'steelix', 'rhydon', 'skarmory'], win: [item('hard-stone'), stamped('hargrove-beaten'), done('hargrove-shown')] }, [done('hargrove-shown')]))),
      ch('Teach me first.', out('Hargrove sits on a rock. Hargrove: "The Leader ahead leans on {gymType}. Everyone brings the obvious answer. Bring two of it, and a third that can take a hit." He stands. "That\'s the lesson."', done('hargrove-shown'))),
    ]),
  ev('veterans-vengeance', 'Vengeance', 'Trainer Challenges', { ...HARGROVE, requires: [flagAgo('hargrove-beaten', 1), notYet('hargrove-avenged')] },
    'Hargrove, scarred now, harder. The Golem has a new crack across its shell. Hargrove: "I remember a fight that fell short. Mine. I\'ve trained since."',
    [
      ch('Battle.', fight('His strongest team. He has not slept much.', hargrove({ size: 6, lv: 3, team: ['golem', 'machamp', 'steelix', 'rhyperior', 'skarmory', 'tyranitar'], win: [done('hargrove-avenged')] }, [done('hargrove-avenged')]))),
      ch('Was it worth it?', fight('Hargrove: "Ask me after." Then he sends out the Golem.', hargrove({ size: 6, lv: 3, team: ['golem', 'machamp', 'steelix', 'rhyperior', 'skarmory', 'tyranitar'], win: [done('hargrove-avenged'), room('hargrove-after')] }, [done('hargrove-avenged')]))),
      ch("Let's call it even.", fight('Hargrove: "Not yet." The Golem steps forward.', hargrove({ size: 6, lv: 3, team: ['golem', 'machamp', 'steelix', 'rhyperior', 'skarmory', 'tyranitar'], win: [done('hargrove-avenged'), room('hargrove-now')] }, [done('hargrove-avenged')]))),
    ]),
  ev('hargrove-after', 'Vengeance', 'Trainer Challenges', { room: true, ...HARGROVE },
    'Hargrove sits down heavily on a rock. The Golem leans against him.',
    [ch('So? Was it worth it?', out('Hargrove: "Yes." He laughs, once, like it surprised him. "Lost again. Still yes."'))]),
  ev('hargrove-now', 'Vengeance', 'Trainer Challenges', { room: true, ...HARGROVE },
    'Hargrove puts out his hand. It is shaking a little.',
    [ch('Shake it.', out('Hargrove: "Now." He grips your hand hard. "Now we\'re even."'))]),
];

// ---------- SF71 The Janitor (GL2) ----------
const JANITOR = { cast: ['trainer.worker_m'], tint: '#2a2518', effect: 'none' };
const SF71: Json[] = [
  ev('gym-janitor-challenge', 'The Janitor', 'Trainer Challenges', JANITOR,
    'A Gym\'s floor is filthy. An old janitor leans on his mop. Janitor: "Sweep it for me and the leader\'s apprentice\'ll give you a fair fight." While you sweep, you see the scuff marks: thousands of them. Janitor: "Every challenger leaves one. That one\'s mine." Janitor: "I was the Leader here. Forty years ago."',
    [
      ch('Battle me.', fight('He puts the mop down. Three old Pokémon, past their prime, and very, very clever.', tf('The Janitor', { cls: 'veteran', size: 3, lv: 1, win: [{ kind: 'gymTypeItem', prefix: 'old-badge' }] }))),
      ch('Why the mop?', out('Janitor: "I like to know who\'s been here." He looks across the floor, at every mark. "All of them. Every one."')),
      ch('Which mark was yours?', out('He points. It is the deepest one on the floor, worn smooth by forty years of feet. He stands looking at it for a while.')),
    ]),
];
Object.assign(SF71[0]!, {
  remembers: [
    {
      id: 'whistles', when: [{ kind: 'eventSeen', id: 'evil-gilt-op-referee-bribes' }], notice: 'Janitor (lower): "The referee\'s bought. I hear him on the phone at night. Prove it, and I\'ll owe you."',
      addChoices: [ch('Prove the referee is bought.', fight('You find the referee in the back with an envelope. He calls his "friends".', tf('Bought Referee', { cls: 'worker', size: 3, lv: 1, win: [{ kind: 'gymTypeItem', prefix: 'old-badge' }, flag('reported-crime'), repUp(1)] })))],
    },
    { id: 'mine', when: [{ kind: 'gymHere' }], notice: 'He takes you by the arm to a fresh mark near the Leader\'s line. Janitor: "That one\'s yours. I watched you make it."', addChoices: [] },
  ],
});

export const EVENTS: Json[] = [...SF64, ...SF65, ...SF66, ...SF67, ...SF68, ...SF69, ...SF70, ...SF71];
export const REMOVE: string[] = [];
