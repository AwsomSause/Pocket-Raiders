// Anime questlines, module 12: AQ54-AQ60 (the rival stories, Team Rocket and Meowth). Follows tools/events/co/anime-0.ts (the worked examples) and _animeKit.ts.
//   AQ54 The Eevee Who Chose Night            (Stage-Three, rival slot; script: QUESTLINES_ASH.md "AQ54")
// Build: npm run co:build -- anime-12
import { ch, ev, fight, flag, flagIs, fr, leave, out, room, type Json } from '../dsl.ts';
import { AQ, bondLine, duel, evolve, gain, hasMon, later, line, moment, seen, stageOf, tagTypes, type Place } from './_animeKit.ts';

export { CATEGORY } from './_animeKit.ts';

export const QUESTLINES: Record<string, string> = {
  AQ54: 'aq54-eevee-chose-night',
};

const RIVAL_SLOT = 'rival slot (RIVALS_PLACED.md): one rival beat per stage, steps 3-18';

export const PLACEMENT: Record<string, Place> = {
  'aq54-eevee-chose-night': { shape: 'Stage-Three', earliest: 'A2', home: 6, sits: 'optional', tags: [], level: 'A+1',
    beats: ['aq54-gary-notes', 'aq54-eevee-dawn', 'aq54-eevee-noon', 'aq54-eevee-dusk', 'aq54-the-finding', 'aq54-lab-eevee', 'aq54-eevee-chooses'],
    note: `${RIVAL_SLOT}. It starts at Dusk. Steps 6, 12, 17: the meeting (the six-on-six is A+1); the research watches three nodes on and the finding at 12; the lab Eevee (12 or 17) or the kept Eevee choosing (17). The doc's A+1 and A+2 for steps 12 and 17 have no fight to apply to.` },
};

/** Doc choices that are not buttons (questline -> label -> reason). */
export const NOT_A_BUTTON: Record<string, Record<string, string>> = {};

export const LIMITS: Record<string, string[]> = {
  AQ54: [
    '"Publish it": the doc shows every Eevee the player catches its likely evolution in the summary (on this save). The game has no such summary hint; built as flag aq54-published and a Chronicle line. Nothing crosses runs.',
    'The kept Eevee "evolves into whatever the team lacks": built as choices that open only when the team lacks that type (Vaporeon for Water, Flareon for Fire, Jolteon for Electric); otherwise it chooses night and becomes an Umbreon. The other Eeveelutions are not offered (four buttons at most).',
    'Remembers "the player\'s rival has an Eeveelution" reads flag rival-has-eeveelution, which the rivals thread must set. "The next rival battle opens with Gary Oak looked at my Pokémon" needs the rivals thread to read aq54-gary-met for its next rival battle line.',
  ],
};

/** Questline -> the date its doc section was re-read line by line against these events. */
export const CHECKED: Record<string, string> = { AQ54: '2026-11-15' };

const lacks = (type: string): Json => ({ kind: 'partyType', type, absent: true });

export const EVENTS: Json[] = [
  // ---------------- AQ54. The Eevee Who Chose Night ----------------
  ev('aq54-eevee-chose-night', 'The Eevee Who Chose Night', AQ, { rarity: 'rare', minStage: stageOf('A2'), types: tagTypes(), cast: ['trainer.pr/scientist_m'], pokemon: 'umbreon', tint: '#1c1a30', effect: 'glint',
    remembers: [
      { id: 'couldnt-choose', when: [seen('evo-eevee-couldnt-choose')], notice: 'You mention the stream, and the three stones, and your Eevee that could not pick. Gary drops his pencil. "You were THERE for that? Every detail. Now. Forget the road; you already saw my answer."',
        hide: [1], addChoices: [ch('Tell him every detail.', out('You tell him all of it: the three stones, the circling, the way your Eevee kept looking back at you instead of at them. Gary does not write until you stop. Then he writes for a long time. "It wasn\'t choosing a stone," he says quietly. "It was checking on you." He lays your story beside three years of his notes, and his whole face changes.', flag('aq54-research'), flag('aq54-research-skipped'), flag('aq54-gary-met'), room('aq54-the-finding')))] },
      { id: 'rival-eevee', when: [flagIs('rival-has-eeveelution')], notice: 'Then he looks past you, down the road. "That trainer who keeps turning up behind you. That\'s an Eeveelution with them, isn\'t it? I have to meet it." He is gone for twenty minutes and comes back with a page of notes, grinning.' },
    ] },
    'A research tent at the edge of the road, with dusk coming down. Notebooks are everywhere: stacked on crates, pinned under stones, one balanced on a sleeping Pokémon. A young researcher sits outside with an Umbreon, and as the light fades, the rings on its body glow one by one. "Don\'t step on the notes. Some of those are three years old." He scratches the Umbreon behind one ear. "I wanted a Vaporeon. Had the Water Stone ready in my pocket. It waited for a night and chose this instead." The Umbreon leans into his hand. "It was right. I wasn\'t. So now I study why they choose." He looks at you properly. "Want to help? Or are you here to battle me? You\'ve got that look."',
    [
      ch('Battle him.', fight('Gary closes the notebook on his knee, carefully, and stands up. The Umbreon walks out ahead of him without being asked, rings burning bright in the dusk. "Six on six. I want the whole picture of you."', duel('Researcher Gary', { cls: 'rival', size: 6, team: ['umbreon', 'blastoise', 'arcanine', 'scizor', 'electivire', 'nidoqueen'], lv: 1, win: [flag('aq54-battled'), flag('aq54-won'), flag('aq54-gary-met'), room('aq54-gary-notes')] }, { lose: [flag('aq54-battled'), flag('aq54-gary-met'), room('aq54-gary-notes')] }))),
      ch('Help the research.', out('"Really?" He is already pulling a spare notebook from a crate and a pencil from behind his ear. "Three wild Eevee live along this road. Watch one at dawn, one at noon, one at dusk. Write down what each one does, and who it does it next to." He presses the notebook into your hands. "Everything. Even the boring parts. Especially the boring parts." The Umbreon walks you to the edge of the lamplight and sits down there, as if to say: from here, you go on your own.', flag('aq54-research'), flag('aq54-gary-met'), later('aq54-eevee-dawn', 1))),
      ch('Tell him about your Eevee.', out('You tell him: where you met it, what it did on the first night, the way it looks at you before a hard fight. Gary does not open a notebook. He does not even reach for his pencil. He listens with his chin on his fist, and once he laughs out loud. When you finish, he is quiet. Then he grabs three notebooks at once and writes everything, fast, the pencil squeaking. "Sorry. That was too good to keep in my head." He tears out one page for you: a drawing of your Eevee, and not a bad one. "I\'ll send you something from the lab. Give me a few days."', flag('aq54-told'), flag('aq54-gary-met'), later('aq54-lab-eevee', 5)), { requires: [line('eevee')] }),
    ]),
  ev('aq54-gary-notes', 'Notes on Your Team', AQ, { room: true, cast: ['trainer.pr/scientist_m'], pokemon: 'umbreon', tint: '#1c1a30', effect: 'none',
    remembers: [{ id: 'won', when: [flagIs('aq54-won')], notice: 'He glances up, grinning, and it slips out. "Smell ya..." He stops. Shakes his head at himself. "No. I grew out of that. Good battle. Really good."' }] },
    'Win or lose, Gary is sitting down again before the dust settles, a notebook on his knee, writing fast. He looks at each of your Pokémon in turn, the way a doctor reads a chart. "Hold still. You too. Especially you." The Umbreon lies down by your feet and watches the pencil go. He fills four pages, and then a fifth.',
    [
      ch('Read the notes.', out('He tears the pages out and hands them over. Your team is all there, one Pokémon to a paragraph, written the way he sees them. It is kinder than you expected, and sharper. Beside your lead he has written: "Fights for the trainer, not the win. Rare." At the bottom: "I\'ll send you something from the lab. Watch the road."', flag('aq54-notes'), later('aq54-lab-eevee', 5))),
    ]),
  ev('aq54-eevee-dawn', 'Dawn: The Jetty', AQ, { room: true, requires: [flagIs('aq54-research')], pokemon: 'eevee', tint: '#2a2c3c', effect: 'fog' },
    'Dawn, grey and cold. The first Eevee lives under a fishing jetty. Every morning an old fisherman comes down alone, his hands stiff with cold, to sort his lines. Today the Eevee is not hunting and it is not playing. It is lying across the old man\'s boots, keeping his feet warm while he works. He does not look surprised. It has done this before, every cold morning, for as long as he has been coming here alone.',
    [
      ch('Write down what it did.', out('You write it all: the cold, the old man\'s hands, the Eevee draped over his boots like a scarf. He never thanks it out loud. When the first fish comes up, though, he cuts the best piece and sets it down without a word. The Eevee eats it slowly, still lying on his feet.', flag('aq54-watch-dawn'), later('aq54-eevee-noon', 1))),
    ]),
  ev('aq54-eevee-noon', 'Noon: The Market', AQ, { room: true, requires: [flagIs('aq54-watch-dawn')], pokemon: 'eevee', tint: '#3a3424', effect: 'none' },
    'Noon, loud and bright. The second Eevee lives behind a fruit stall in a market square. A small girl sits on an upturned crate, crying the quiet way children cry when they have been crying a long time. Her big brother left on his journey this morning. The Eevee comes out from under the stall with a ribbon in its mouth and drops it in her lap. Then a bottle cap. Then a flower, slightly chewed.',
    [
      ch('Write down what it did.', out('Seven presents in all. On the seventh, a single shiny button, the girl laughs, and then she cannot stop. The Eevee sits in her lap as if that had been the plan all along. You write it down, and then you write, underneath and underlined: "It did not stop until she laughed."', flag('aq54-watch-noon'), later('aq54-eevee-dusk', 1))),
    ]),
  ev('aq54-eevee-dusk', 'Dusk: The Watchman', AQ, { room: true, requires: [flagIs('aq54-watch-noon')], pokemon: 'eevee', tint: '#1c1a30', effect: 'none' },
    'Dusk again, the light going. The third Eevee lives at the edge of a small town, where a night watchman starts his rounds. His lantern keeps guttering out. He is old, and he does not like the dark, and he does not say so. The Eevee walks beside him into it. It does not play or wander. It keeps to the dark side of the road, sitting up straight whenever he stops, watching the shadows so that he does not have to.',
    [
      ch('Write down what it did.', out('You follow them as far as the last house. Each time the lantern goes out, the Eevee stays exactly where it is, and the watchman finds it by touch and keeps walking. You write it down, close the notebook, and walk back to Gary in the dark. It does not feel as dark as it did.', flag('aq54-watch-dusk'), later('aq54-the-finding', 3))),
    ]),
  ev('aq54-the-finding', 'The Research Finding', AQ, { room: true, cast: ['trainer.pr/scientist_m'], pokemon: 'umbreon', tint: '#1c1a30', effect: 'sparkle',
    remembers: [{ id: 'skipped', when: [flagIs('aq54-research-skipped')], intro: 'Gary lays your story beside three years of notes, the stream, the three stones, the Eevee that kept looking back at you, and reads it all twice by lamplight. Then he sits back. "They pick what the person next to them needs. Not what they want. Needs." He taps the page where your Eevee looked back. "That\'s not a paper. That\'s a guess. But it\'s a good one." The Umbreon lies down across his boots. He does not seem to notice that it has.' }] },
    'Gary lays your three pages beside his own on a crate and reads them twice, moving the lamp closer. The fisherman. The girl. The watchman. Then he sits back. "They pick what the person next to them needs. Not what they want. Needs." He taps the page with the watchman on it, and then, without looking, the Umbreon beside him. "That\'s not a paper. That\'s a guess. But it\'s a good one." The Umbreon lies down across his boots. He does not seem to notice that it has.',
    [
      ch('Publish it.', out('"Then it goes out with your name next to mine." He writes them at the top of the first page, his and yours, and a title he crosses out three times before he likes it. "Every trainer with an Eevee should read this. They\'ll look at it differently after." He shakes your hand like a colleague, firmly, and a little too long. "The lab will send you something for your trouble. Watch the road."', flag('aq54-published'), moment('Your name went into Gary Oak\'s paper on why an Eevee chooses.', 60), later('aq54-lab-eevee', 5))),
      ch('Keep it a guess.', out('Gary looks at the pages for a long time. Then he folds them once and puts them inside his coat, not in a crate. "Yeah. Some things shouldn\'t be proven." He whistles, and an Eevee comes out of the tent, small and very curious. "She\'s from my lab. I was saving her for the paper." He sets her down in front of you. "Don\'t pick for her. Just stand next to her, and need something." His Umbreon walks you both out to the road, rings glowing, and turns back only at the last lamp.', gain('eevee', { bond: 20 }), flag('aq54-kept-guess'), flag('aq54-eevee-given'), later('aq54-eevee-chooses', 5))),
    ]),
  ev('aq54-lab-eevee', 'From Gary\'s Lab', AQ, { room: true, pokemon: 'eevee', tint: '#2a2c3c', effect: 'sparkle',
    remembers: [
      { id: 'published', when: [flagIs('aq54-published')], notice: 'Folded under the note is a printed copy of the paper. On the first page, next to his name, is yours.' },
      { id: 'told', when: [flagIs('aq54-told')], notice: 'On the back of the note: "Your Eevee story is pinned over my desk. It\'s the only page I don\'t move."' },
      { id: 'notes', when: [flagIs('aq54-notes')], notice: 'On the back of the note, in smaller writing: "Read your team notes again. I was right about your lead."' },
    ] },
    'Gary\'s Umbreon is waiting at the side of the road, its rings faint in the daylight, a basket set down at its feet. In the basket is an Eevee, wide awake, and a note in hurried handwriting: "From the lab. She picked you out of everyone I described. Look after her. G." The Eevee climbs out of the basket on her own and sits down beside you, the way the ones on the road sat beside their people.',
    [
      ch('Take her with you.', out('She walks under your feet for the first mile, then beside them. The Umbreon watches until you are out of sight, then turns for home, rings brightening as the evening comes on. Somewhere behind you, a researcher is writing down what she does next.', gain('eevee', { bond: 10 }), flag('aq54-eevee-given'), moment('Gary Oak sent you an Eevee from his lab. She chose you.', 55))),
      ch('Send her back with the Umbreon.', leave('You crouch and tell her that Gary needs her more, and she seems to understand: she climbs back into the basket. The Umbreon dips its head, takes the handle in its teeth, and carries her home. You hope the next note says she is fine. You suspect it will.')),
    ]),
  ev('aq54-eevee-chooses', 'What the Team Needs', AQ, { room: true, pokemon: 'eevee', tint: '#1c1a30', effect: 'glint' },
    'Night, at camp. Gary\'s Eevee will not settle. She walks along your sleeping team one by one, sniffing each, and stops at the gaps between them, the places where nobody is. She is not choosing for herself. She is looking at what you are missing. Then she comes and sits down next to you, and waits.',
    [
      ch('It needs water.', out('She goes down to the stream and does not come back for a long time. When she does, she is sleek and blue and finned, and she lies down beside the team in the space nobody was filling. You think of Gary, and the Water Stone in his pocket that he never used.', evolve('eevee', 'vaporeon'), moment('Gary\'s Eevee chose what your team needed. It became a Vaporeon.', 60)), { requires: [hasMon('eevee'), lacks('water')] }),
      ch('It needs fire.', out('She sits by the embers of the campfire until they flare up around her, and when the sparks settle she is wrapped in a thick ruff of flame-coloured fur. The camp is warm all night for the first time in weeks.', evolve('eevee', 'flareon'), moment('Gary\'s Eevee chose what your team needed. It became a Flareon.', 60)), { requires: [hasMon('eevee'), lacks('fire')] }),
      ch('It needs lightning.', out('A storm passes over in the night, and she runs out into it. You find her at dawn, spiky and crackling and very pleased with herself, standing guard over the team.', evolve('eevee', 'jolteon'), moment('Gary\'s Eevee chose what your team needed. It became a Jolteon.', 60)), { requires: [hasMon('eevee'), lacks('electric')] }),
      ch('Let it choose for itself.', out('She looks at the team, then at the dark beyond the fire, and she goes and sits facing it, upright, the way the Eevee at the watchman\'s side did. By the time the moon is high, there are rings on her coat, glowing. Just like his.', evolve('eevee', 'umbreon'), moment('Gary\'s Eevee watched the dark for your team. It became an Umbreon.', 60))),
    ]),
];

export const REMOVE: string[] = [];
