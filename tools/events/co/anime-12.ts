// Anime questlines, module 12: AQ54-AQ60 (the rival stories, Team Rocket and Meowth). Follows tools/events/co/anime-0.ts (the worked examples) and _animeKit.ts.
//   AQ54 The Eevee Who Chose Night  (Stage-Three, rival slot)
//   AQ55 The Rival Who Changed      (Region, rival slot)
//   AQ56 The Mega Ace               (Trial, rival slot)
//   AQ57 The Beast Who Took Off Its Mask (Trial, rival slot)
//   AQ58 The Ones They Let Go        (Stage-Three, rival slot)
//   AQ59 The Meowth Who Learned to Talk (Single; not in Kanto)
//   AQ60 Sparky                      (Stage-Three, rival slot)
// Script for all seven: QUESTLINES_ASH.md "AQ54" to "AQ60".
// Build: npm run co:build -- anime-12
import { any, bondUp, ch, egg, ev, fight, flag, flagIs, heal, inRegion, item, out, rest, room, takeNode, type Json } from '../dsl.ts';
import { AQ, age, duel, evolve, gain, hasMon, later, line, moment, monDuel, noLine, notYet, seen, slotFree, stageOf, tagTypes, takeSlot, teach, type Place } from './_animeKit.ts';

export { CATEGORY } from './_animeKit.ts';

export const QUESTLINES: Record<string, string> = {
  AQ54: 'aq54-eevee-chose-night',
  AQ55: 'aq55-rival-who-changed',
  AQ56: 'aq56-mega-ace',
  AQ57: 'aq57-took-off-its-mask',
  AQ58: 'aq58-ones-they-let-go',
  AQ59: 'aq59-meowth-learned-to-talk',
  AQ60: 'aq60-sparky',
};

const RIVAL_SLOT = 'rival slot (RIVALS_PLACED.md): one rival beat per stage, steps 3-18';

export const PLACEMENT: Record<string, Place> = {
  'aq54-eevee-chose-night': { shape: 'Stage-Three', earliest: 'A2', home: 6, sits: 'optional', tags: [], level: 'A+1',
    beats: ['aq54-gary-notes', 'aq54-eevee-dawn', 'aq54-eevee-noon', 'aq54-eevee-dusk', 'aq54-the-finding', 'aq54-lab-eevee', 'aq54-eevee-chooses'],
    note: `${RIVAL_SLOT}. It starts at Dusk. Steps 6, 12, 17: the meeting (the six-on-six is A+1); the research watches three nodes on and the finding at 12; the lab Eevee (12 or 17) or the kept Eevee choosing (17). The doc's A+1 and A+2 for steps 12 and 17 have no fight to apply to.` },
  'aq55-rival-who-changed': { shape: 'Region', earliest: 'A6', home: 'Stage 2', sits: 'optional', tags: [], level: 'A+1', beats: ['aq55-after'],
    note: `${RIVAL_SLOT}. The doc scripts one meeting at a cold crossroads and its After (same node); it is built for Stage 2, and the three-on-three is A+1. Stages 5 and 8 (A+2) have no scene in the doc.` },
  'aq56-mega-ace': { shape: 'Trial', earliest: 'A9', home: 'S', sits: 'optional', tags: [], level: 'A+2', beats: ['aq56-listens', 'aq56-stops-listening', 'aq56-the-truth', 'aq56-mine-together'],
    note: `${RIVAL_SLOT}. S: the ridge and the one-on-one against Mega Charizard X (A+2); S+1: the truth; S+2: at the mine beside Alain (A+2), only after "Use it against them."` },
  'aq57-took-off-its-mask': { shape: 'Trial', earliest: 'A8', home: 'S', sits: 'optional', tags: [], level: 'A+1', beats: ['aq57-the-crack', 'aq57-not-yet', 'aq57-the-mask'],
    note: `${RIVAL_SLOT}. Night. S: the ruined lab and the fight (A+1); S+1: the mask. The doc has no S+2 scene (A+2): "That's your job" ends in a Chronicle line.` },
  'aq58-ones-they-let-go': { shape: 'Stage-Three', earliest: 'A5', home: 6, sits: 'optional', tags: [], beats: ['aq58-alone-at-the-nest', 'aq58-second-wave', 'aq58-third-wave', 'aq58-after-the-poachers', 'aq58-empty-nest'],
    note: `${RIVAL_SLOT}. Needs Trio reputation +10 (flag trio-rep at 10). No level offset. "Help.": the first wave at 6, the second at 12, the third at 17, then the After. "Arrest them." and "Leave them be." end at 6.` },
  'aq59-meowth-learned-to-talk': { shape: 'Single', earliest: 'A4', home: 11, window: [8, 15], sits: 'optional', tags: [], beats: ['aq59-gotta-go', 'aq59-tag-partner', 'aq59-empty-alley'],
    note: 'Night, an alley. In Kanto this is The Old Street (another thread\'s event); AQ59 is for every other region. The tag-partner fight comes back at a later stage after AQ58 "Help."; the empty alley replaces the meeting after AQ58 "Arrest them."' },
  'aq60-sparky': { shape: 'Stage-Three', earliest: 'A3', home: 'Town', sits: 'optional', attaches: 'town', tags: [], level: 'A+0', beats: ['aq60-stories', 'aq60-after', 'aq60-training-speed', 'aq60-training-move'],
    note: `${RIVAL_SLOT}. It starts at the Town node, after any tournament there; then steps 12 and 17. The battle with Ritchie's full team is A+0; "Train together." puts a spar with Sparky at 12 (A+1) and the lesson at 17.` },
};

/** Doc choices that are not buttons (questline -> label -> reason). */
export const NOT_A_BUTTON: Record<string, Record<string, string>> = {};

export const LIMITS: Record<string, string[]> = {
  AQ54: [
    '"Publish it": the doc shows every Eevee the player catches its likely evolution in the summary (on this save). The game has no such summary hint; built as flag aq54-published and a Chronicle line. Nothing crosses runs.',
    'The kept Eevee "evolves into whatever the team lacks": built as choices that open only when the team lacks that type (Vaporeon for Water, Flareon for Fire, Jolteon for Electric); otherwise it chooses night and becomes an Umbreon. The other Eeveelutions are not offered (four buttons at most).',
    'Remembers "the player\'s rival has an Eeveelution" reads flag rival-has-eeveelution, which the rivals thread must set. "The next rival battle opens with Gary Oak looked at my Pokémon" needs the rivals thread to read aq54-gary-met for its next rival battle line.',
  ],
  AQ55: [
    'The doc places Paul at Stages 2, 5 and 8 (A+1, A+2, A+2) but scripts one meeting; only that meeting and its After are built (Stage 2, A+1). No scenes are made up for Stages 5 and 8.',
    'Remembers "AQ23 ended with Controlled Blaze" reads flag aq23-blaze-controlled (set by AQ23). "Reggie appeared in an earlier event" reads flag reggie-met, which the thread with a Reggie scene must set.',
    '"Show him": the doc has the Chimchar line use its strongest Fire move on a boulder. No move is used in game terms; the scene is told in the text.',
  ],
  AQ56: [
    '"Show him the mine" needs the player to know of the Stone Harvest (M2): it opens on flag flare-mine-running (M2\'s "Leave it for now"), and the believe-at-once variant reads flare-mine-shut; the thread that builds M2 must set both. The two-node and three-node trips are node costs (takeNode 2 and 3).',
    '"M2\'s meter falls by 1" sets flag aq56-sponsor-stone-thrown, and "M2\'s finale becomes a double battle with Alain" sets aq56-alain-joins: the M2 thread must read them. Here Alain\'s help at the mine is its own double battle beside his Mega Charizard X one stage on.',
    '"Then we both stop": the player must give one stone back, but the game cannot tell which item came from the mine; it sets flag aq56-stone-given-back for the M2 thread and takes no item.',
    '"It\'s not your fault": "he is seen in the epilogue, at the mine, working" is a Chronicle line (moment), not a scene.',
    'Remembers "Mairin was helped in an earlier Ash questline" reads flag mairin-helped, which no thread sets yet (no questline names it).',
  ],
  AQ57: [
    'The reward "a Memory (Silvally type disc)" is one of the eighteen Memories, drawn by the run\'s seed. A Memory is held by a Silvally: with none in the party the game sells it at once, as it does any gift nobody can hold.',
    'Remembers "the Memory blessing is the run\'s" reads flag blessing-silvally (legends\' read-only blessing flags); "the Silvally evolution counts as a Rite" sets flag aq57-rite, which the legends thread must count as a Rite.',
    'Remembers "L12 (Nebby) or U2 (Lusamine) was done" reads flags l12-altars-done and u2-lusamine-done, which the threads that build L12 and U2 must set.',
    'Remembers "the player has a Pokémon that was once a Shadow" reads flag shadow-purified (the game keeps no "was once a Shadow" mark on a Pokémon); the Shadow thread must set it on a purification.',
    '"That\'s your job: in the epilogue, it is Silvally" is a Chronicle line (moment). The Trial\'s S+2 beat (A+2) has no scene in the doc, so none is built.',
  ],
  AQ58: [
    '"Needs Trio reputation +10": the game has no Trio reputation yet. The first event needs flag trio-rep at 10 or more; the thread that owns Team Rocket\'s trio (or families-c, owner of Reputation) must count it, and until then the questline is never drawn.',
    '"A three-wave battle, double battle alongside Jessie and James": built as three double battles at steps 6, 12 and 17 (the shape\'s three beats), with Jessie\'s Arbok as the ally (an event battle takes one ally Pokémon; James\'s Weezing is in the text).',
    'Reward "no more Team Rocket ambushes this run" sets flag aq58-trio-friends; the thread that builds Team Rocket ambushes must read it. Remembers "beat Team Rocket in three earlier ambushes" reads flag rocket-ambush-beaten at 3 or more, which that thread must count.',
  ],
  AQ59: [
    '"Teach me something": the doc lets the player see wild Pokémon\'s mood before encounters this run. The game shows no mood before an encounter; built as flag aq59-taught and the lesson in the text.',
    'Reward "it warns of every Team Rocket ambush this run" sets flag aq59-meowth-friend; the thread that builds Team Rocket ambushes must read it.',
    'Remembers "Team Rocket was helped in AQ58: it joins the next battle as a tag partner" is a follow-up at a later stage: a double battle with Meowth as the ally. It is the next story fight, not the very next node battle, and Meowth uses its own moves (Fury Swipes and the complaining are in the text).',
  ],
  AQ60: [
    '"Deal.": "in the next run, Ritchie is at the same grounds" and Remembers "aq60.promise in a past save" are not built (nothing crosses runs). "Deal." sets flag aq60-promise and a Chronicle line.',
    '"Trade stories.": "one rest node" is a full heal and a rest in this node. "Train together.": "a training stage" is a spar with Sparky at step 12 (A+1) and the lesson at step 17; the doc\'s A+1 at step 17 has no fight to apply to.',
    'It starts "after any tournament": the event cannot check that a tournament was played at the Town node; that is left to the placer (PLACEMENT note).',
  ],
};

/** Questline -> the date its doc section was re-read line by line against these events. */
export const CHECKED: Record<string, string> = { AQ54: '2026-11-15', AQ55: '2026-11-16', AQ56: '2026-11-16', AQ57: '2026-11-16', AQ58: '2026-11-16', AQ59: '2026-11-16', AQ60: '2026-11-16' };

/** The eighteen Memories (Silvally's type discs). */
const MEMORIES = ['normal', 'fighting', 'flying', 'poison', 'ground', 'rock', 'bug', 'ghost', 'steel', 'fire', 'water', 'grass', 'electric', 'psychic', 'ice', 'dragon', 'dark', 'fairy'].map((t) => `${t}-memory`);

/** AQ59 is The Old Street in Kanto (another thread); it plays in every other region. */
const NOT_KANTO = ['johto', 'hoenn', 'sinnoh', 'unova', 'kalos', 'alola', 'galar', 'paldea', 'torren', 'frontier-isles', 'trial-archipelago', 'grand', 'cairnmoor', 'tidewrack-reaches', 'orrery-basin'];

const lacks = (type: string): Json => ({ kind: 'partyType', type, absent: true });

export const EVENTS: Json[] = [
  // ---------------- AQ54. The Eevee Who Chose Night ----------------
  ev('aq54-eevee-chose-night', 'The Eevee Who Chose Night', AQ, { rarity: 'rare', minStage: stageOf('A2'), types: tagTypes(), requires: [slotFree()], cast: ['trainer.pr/scientist_m'], pokemon: 'umbreon', tint: '#1c1a30', effect: 'glint',
    remembers: [
      { id: 'couldnt-choose', when: [seen('evo-eevee-couldnt-choose')], notice: 'You mention the stream, and the three stones, and your Eevee that could not pick. Gary drops his pencil. "You were THERE for that? Every detail. Now. Forget the road; you already saw my answer."',
        hide: [1], addChoices: [ch('Tell him every detail.', out('You tell him all of it: the three stones, the circling, the way your Eevee kept looking back at you instead of at them. Gary does not write until you stop. Then he writes for a long time. "It wasn\'t choosing a stone," he says quietly. "It was checking on you." He lays your story beside three years of his notes, and his whole face changes.', takeSlot(), flag('aq54-research'), flag('aq54-research-skipped'), flag('aq54-gary-met'), room('aq54-the-finding')))] },
      { id: 'rival-eevee', when: [flagIs('rival-has-eeveelution')], notice: 'Then he looks past you, down the road. "That trainer who keeps turning up behind you. That\'s an Eeveelution with them, isn\'t it? I have to meet it." He is gone for twenty minutes and comes back with a page of notes, grinning.' },
    ] },
    'A research tent at the edge of the road, with dusk coming down. Notebooks are everywhere: stacked on crates, pinned under stones, one balanced on a sleeping Pokémon. A young researcher sits outside with an Umbreon, and as the light fades, the rings on its body glow one by one. "Don\'t step on the notes. Some of those are three years old." He scratches the Umbreon behind one ear. "I wanted a Vaporeon. Had the Water Stone ready in my pocket. It waited for a night and chose this instead." The Umbreon leans into his hand. "It was right. I wasn\'t. So now I study why they choose." He looks at you properly. "Want to help? Or are you here to battle me? You\'ve got that look."',
    [
      ch('Battle him.', fight('Gary closes the notebook on his knee, carefully, and stands up. The Umbreon walks out ahead of him without being asked, rings burning bright in the dusk. "Six on six. I want the whole picture of you."', duel('Researcher Gary', { cls: 'rival', size: 6, team: ['umbreon', 'blastoise', 'arcanine', 'scizor', 'electivire', 'nidoqueen'], lv: 1, win: [flag('aq54-battled'), flag('aq54-won'), flag('aq54-gary-met'), room('aq54-gary-notes')] }, { lose: [flag('aq54-battled'), flag('aq54-gary-met'), room('aq54-gary-notes')] }), takeSlot())),
      ch('Help the research.', out('"Really?" He is already pulling a spare notebook from a crate and a pencil from behind his ear. "Three wild Eevee live along this road. Watch one at dawn, one at noon, one at dusk. Write down what each one does, and who it does it next to." He presses the notebook into your hands. "Everything. Even the boring parts. Especially the boring parts." The Umbreon walks you to the edge of the lamplight and sits down there, as if to say: from here, you go on your own.', takeSlot(), flag('aq54-research'), flag('aq54-gary-met'), later('aq54-eevee-dawn', 1))),
      ch('Tell him about your Eevee.', out('You tell him: where you met it, what it did on the first night, the way it looks at you before a hard fight. Gary does not open a notebook. He does not even reach for his pencil. He listens with his chin on his fist, and once he laughs out loud. When you finish, he is quiet. Then he grabs three notebooks at once and writes everything, fast, the pencil squeaking. "Sorry. That was too good to keep in my head." He tears out one page for you: a drawing of your Eevee, and not a bad one. "I\'ll send you something from the lab. Give me a few days."', takeSlot(), flag('aq54-told'), flag('aq54-gary-met'), later('aq54-lab-eevee', 5)), { requires: [line('eevee')] }),
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
  ev('aq54-the-finding', 'The Research Finding', AQ, { room: true, requires: [slotFree()], cast: ['trainer.pr/scientist_m'], pokemon: 'umbreon', tint: '#1c1a30', effect: 'sparkle',
    remembers: [{ id: 'skipped', when: [flagIs('aq54-research-skipped')], intro: 'Gary lays your story beside three years of notes, the stream, the three stones, the Eevee that kept looking back at you, and reads it all twice by lamplight. Then he sits back. "They pick what the person next to them needs. Not what they want. Needs." He taps the page where your Eevee looked back. "That\'s not a paper. That\'s a guess. But it\'s a good one." The Umbreon lies down across his boots. He does not seem to notice that it has.' }] },
    'Gary lays your three pages beside his own on a crate and reads them twice, moving the lamp closer. The fisherman. The girl. The watchman. Then he sits back. "They pick what the person next to them needs. Not what they want. Needs." He taps the page with the watchman on it, and then, without looking, the Umbreon beside him. "That\'s not a paper. That\'s a guess. But it\'s a good one." The Umbreon lies down across his boots. He does not seem to notice that it has.',
    [
      ch('Publish it.', out('"Then it goes out with your name next to mine." He writes them at the top of the first page, his and yours, and a title he crosses out three times before he likes it. "Every trainer with an Eevee should read this. They\'ll look at it differently after." He shakes your hand like a colleague, firmly, and a little too long. "The lab will send you something for your trouble. Watch the road."', takeSlot(), flag('aq54-published'), moment('Your name went into Gary Oak\'s paper on why an Eevee chooses.', 60), later('aq54-lab-eevee', 5))),
      ch('Keep it a guess.', out('Gary looks at the pages for a long time. Then he folds them once and puts them inside his coat, not in a crate. "Yeah. Some things shouldn\'t be proven." He whistles, and an Eevee comes out of the tent, small and very curious. "She\'s from my lab. I was saving her for the paper." He sets her down in front of you. "Don\'t pick for her. Just stand next to her, and need something." His Umbreon walks you both out to the road, rings glowing, and turns back only at the last lamp.', takeSlot(), gain('eevee', { bond: 20 }), flag('aq54-kept-guess'), flag('aq54-eevee-given'), later('aq54-eevee-chooses', 5))),
    ]),
  ev('aq54-lab-eevee', 'From Gary\'s Lab', AQ, { room: true, requires: [slotFree()], pokemon: 'eevee', tint: '#2a2c3c', effect: 'sparkle',
    remembers: [
      { id: 'published', when: [flagIs('aq54-published')], notice: 'Folded under the note is a printed copy of the paper. On the first page, next to his name, is yours.' },
      { id: 'told', when: [flagIs('aq54-told')], notice: 'On the back of the note: "Your Eevee story is pinned over my desk. It\'s the only page I don\'t move."' },
      { id: 'notes', when: [flagIs('aq54-notes')], notice: 'On the back of the note, in smaller writing: "Read your team notes again. I was right about your lead."' },
    ] },
    'Gary\'s Umbreon is waiting at the side of the road, its rings faint in the daylight, a basket set down at its feet. In the basket is an Eevee, wide awake, and a note in hurried handwriting: "From the lab. She picked you out of everyone I described. Look after her. G." The Eevee climbs out of the basket on her own and sits down beside you, the way the ones on the road sat beside their people.',
    [
      ch('Take her with you.', out('She walks under your feet for the first mile, then beside them. The Umbreon watches until you are out of sight, then turns for home, rings brightening as the evening comes on. Somewhere behind you, a researcher is writing down what she does next.', takeSlot(), gain('eevee', { bond: 10 }), flag('aq54-eevee-given'), moment('Gary Oak sent you an Eevee from his lab. She chose you.', 55))),
      ch('Send her back with the Umbreon.', out('You crouch and tell her that Gary needs her more, and she seems to understand: she climbs back into the basket. The Umbreon dips its head, takes the handle in its teeth, and carries her home. You hope the next note says she is fine. You suspect it will.', takeSlot())),
    ]),
  ev('aq54-eevee-chooses', 'What the Team Needs', AQ, { room: true, requires: [slotFree()], pokemon: 'eevee', tint: '#1c1a30', effect: 'glint' },
    'Night, at camp. Gary\'s Eevee will not settle. She walks along your sleeping team one by one, sniffing each, and stops at the gaps between them, the places where nobody is. She is not choosing for herself. She is looking at what you are missing. Then she comes and sits down next to you, and waits.',
    [
      ch('It needs water.', out('She goes down to the stream and does not come back for a long time. When she does, she is sleek and blue and finned, and she lies down beside the team in the space nobody was filling. You think of Gary, and the Water Stone in his pocket that he never used.', takeSlot(), evolve('eevee', 'vaporeon'), moment('Gary\'s Eevee chose what your team needed. It became a Vaporeon.', 60)), { requires: [hasMon('eevee'), lacks('water')] }),
      ch('It needs fire.', out('She sits by the embers of the campfire until they flare up around her, and when the sparks settle she is wrapped in a thick ruff of flame-coloured fur. The camp is warm all night for the first time in weeks.', takeSlot(), evolve('eevee', 'flareon'), moment('Gary\'s Eevee chose what your team needed. It became a Flareon.', 60)), { requires: [hasMon('eevee'), lacks('fire')] }),
      ch('It needs lightning.', out('A storm passes over in the night, and she runs out into it. You find her at dawn, spiky and crackling and very pleased with herself, standing guard over the team.', takeSlot(), evolve('eevee', 'jolteon'), moment('Gary\'s Eevee chose what your team needed. It became a Jolteon.', 60)), { requires: [hasMon('eevee'), lacks('electric')] }),
      ch('Let it choose for itself.', out('She looks at the team, then at the dark beyond the fire, and she goes and sits facing it, upright, the way the Eevee at the watchman\'s side did. By the time the moon is high, there are rings on her coat, glowing. Just like his.', takeSlot(), evolve('eevee', 'umbreon'), moment('Gary\'s Eevee watched the dark for your team. It became an Umbreon.', 60))),
    ]),

  // ---------------- AQ55. The Rival Who Changed ----------------
  ev('aq55-rival-who-changed', 'The Rival Who Changed', AQ, { rarity: 'rare', minStage: stageOf('A6'), types: tagTypes(), requires: [slotFree()], cast: ['trainer.pr/ace_trainer_m'], pokemon: 'torterra', tint: '#1e2630', effect: 'snow',
    remembers: [
      { id: 'no-chimchar', when: [noLine('chimchar')], intro: `A crossroads in cold weather, the signposts white with frost. A young man stands where the roads meet, arms folded, collar up, older and harder around the eyes than his voice. The frost on his shoulders says he has been here a while. Behind him a Torterra stands enormous and very calm. His eyes go over your belt, one Ball at a time, looking for something. It is not there. "No Chimchar." He frowns, as if you have wasted his morning. "Then why did you come?"`,
        hide: [1, 2], addChoices: [
          ch('To see you.', out(`He looks at you for a long moment, as if nobody has said that to him in years and he is not sure it is allowed. "Hm." He reaches into his coat and takes out an egg, olive-green and warm from being carried close. He puts it in your hands. "Somebody should raise this one properly." Then he turns up his collar and walks away down the cold road, the Torterra shaking the ground softly behind him.`, takeSlot(), egg({ species: ['turtwig'] }), flag('aq55-came-to-see'), flag('aq55-paul-respect'), moment('Paul waited at a cold crossroads, and gave you an egg because you came to see him.', 55))),
          ch('Wrong crossroads.', out(`"Clearly." He does not move out of your way, and he does not look at you again. You walk round him and his Torterra, and the frost crunches under your feet, and he goes on waiting for somebody else.`, takeSlot(), flag('aq55-wrong-crossroads'))),
        ] },
      { id: 'controlled-blaze', when: [flagIs('aq23-blaze-controlled'), line('chimchar')], notice: 'Then his eyes find your Infernape, and stay there. He watches it breathe, watches the flame on its head burn low and steady and exactly as high as it chooses. Whatever he came to say, he does not say it. "Good."' },
      { id: 'reggie', when: [flagIs('reggie-met')], notice: '"Reggie said you\'d come." He says his brother\'s name like a stone in his shoe. "He was very pleased about it. He\'s always pleased about things."' },
    ] },
    `A crossroads in cold weather, the signposts white with frost. A young man stands where the roads meet, arms folded, collar up, older than you expected and harder around the eyes. The frost on his shoulders says he has been here a while. Behind him a Torterra stands enormous and very calm, the little tree on its back dusted with snow. "You took a Chimchar I gave up on and made it strong. I heard." His eyes go to your belt and stay there. "I don't need you to explain how. I want to see."`,
    [
      ch('Battle.', fight(`He unfolds his arms. That is all the answer he gives. The Torterra steps forward and the frost cracks under it. All through the battle you notice where Paul is looking: not at his own Pokémon, which he trusts to know their work, but at yours. At the one that used to be his.`, duel('Paul', { cls: 'ace-trainer', size: 3, team: ['torterra', 'electivire', 'ursaring'], lv: 1, win: [flag('aq55-battled'), flag('aq55-won'), room('aq55-after')] }, { lose: [flag('aq55-battled'), room('aq55-after')] }), takeSlot())),
      ch('Ask why it matters.', out(`He takes a long time to answer, long enough that the Torterra shifts its weight and the ground creaks. "Because I was wrong about it." He says it flatly, like reading out a score. "I'm not wrong about much." Then he waits, arms folded, as if the rest of the answer is your job.`, takeSlot(), flag('aq55-asked'), room('aq55-after'))),
      ch('Show him.', out(`You call it out. Your old Chimchar, whatever shape it wears now, looks at Paul and does not look away. There is a boulder at the edge of the crossroads, waist-high and white with frost. It takes one breath, and puts everything it has into its strongest fire. The boulder glows, then cracks, then splits down the middle and steams in the cold. Paul watches the whole thing. He does not blink once.`, takeSlot(), flag('aq55-shown'), room('aq55-after')), { requires: [line('chimchar')] }),
    ]),
  ev('aq55-after', 'What Paul Doesn\'t Say', AQ, { room: true, cast: ['trainer.pr/ace_trainer_m'], pokemon: 'torterra', tint: '#1e2630', effect: 'snow' },
    'Afterwards, nobody says anything. The wind moves the frost off the signposts. The Torterra shifts its weight, very slowly, and the ground creaks under it. Paul opens his mouth once, and closes it again. He looks at your Pokémon, then at his own hands, then at the road. "..."',
    [
      ch('Say something.', out(`You say his name, or start to. He cuts across it, quietly. "It wasn't weak." He looks at your Pokémon, or at the field, or at nothing. "I was impatient." That is all. He turns up his collar and walks off down the cold road, and the Torterra follows him, and the ground shakes softly with each step for a long time after they are gone.`, flag('aq55-said'), flag('aq55-paul-respect'), moment('Paul told you the Chimchar was never weak. He was impatient.', 60))),
      ch('Wait.', out(`You wait. So does he. The cold gets into your fingers. At last he nods, once, a short hard nod like a door closing. He reaches into his coat and takes out an egg, olive-green and warm from being carried close, and puts it in your hands. Then he leaves, without a word, without looking back. The egg is very warm. He must have carried it a long way.`, egg({ species: ['turtwig'] }), flag('aq55-waited'), flag('aq55-paul-respect'), moment('Paul said nothing at all, and gave you an egg with a Turtwig in it.', 60))),
    ]),

  // ---------------- AQ56. The Mega Ace ----------------
  ev('aq56-mega-ace', 'The Mega Ace', AQ, { rarity: 'rare', minStage: stageOf('A9'), types: tagTypes(), requires: [slotFree()], cast: ['boss.alain'], pokemon: 'charizard-mega-x', tint: '#1a1a24', effect: 'fire',
    remembers: [
      { id: 'mine-shut', when: [flagIs('flare-mine-shut')], notice: 'You tell him the mine is already shut: the drills, the seam, the stones pressed back into the rock. You tell him how. He goes very still. "I know that seam," he says. "I know exactly where it is." He does not need to see it.',
        addChoices: [ch('Tell him the mine is shut.', out(`He hears it all without interrupting once. Then he takes off his glove and looks at the Key Stone set in it, a long time, the way you look at a photograph of someone who lied to you. "Then I don't need a trip. I need a word with my sponsor." The Charizard lets its Mega form go in a rush of heat, and stands beside him, ordinary and black and loyal.`, takeSlot(), flag('aq56-believed'), flag('aq56-convinced')))] },
      { id: 'mairin', when: [flagIs('mairin-helped')], notice: 'A girl with a Chespin on her head runs up the ridge behind him, out of breath. "Alain! Listen to them! Please. Just this once, listen before you fight." He sighs. He has clearly heard this before. But he lowers his arm.',
        addChoices: [ch('Let Mairin talk to him.', out(`She does most of the talking, fast and fierce, with the Chespin nodding along. He argues, then argues less, then stops. "Show me," he says at last, to both of you. It takes a single node to walk down to where you can see the valley clearly. He looks for a long time.`, takeSlot(), takeNode(1), flag('aq56-mairin'), flag('aq56-convinced')))] },
    ] },
    `A ridge above an industrial valley, the air tasting of metal. Down below, drills chew at a hillside under floodlights. A young man in a long dark coat stands at the edge, and the black Charizard beside him turns its head to you and Mega Evolves on the spot, in a blaze of blue fire, as if you were a threat it had been told about. "Mega Evolution is how I protect what matters." His voice is quiet and very sure. "You've been asking about the energy I use. You think it's stolen." He turns. "Prove it. Or battle me, and I'll stop listening."`,
    [
      ch('Battle.', fight(`He does not even nod. The Mega Charizard X drops off the ridge edge and comes back up in a spiral of blue flame, and the heat of it presses you back a step. One against one, and Alain is very, very good.`, duel('Alain', { cls: 'ace-trainer', size: 1, team: ['charizard-mega-x'], lv: 2, win: [flag('aq56-battled'), flag('aq56-won'), room('aq56-listens')] }, { sprite: 'alain', lose: [flag('aq56-battled'), flag('aq56-lost'), room('aq56-stops-listening')] }), takeSlot())),
      ch('Show him the mine.', out(`You lead him down off the ridge and along the valley floor, the long way, out of sight of the floodlights. It takes two nodes of hard walking. Then you stop at a fence and point. In the field beyond the mine a Pokémon staggers, its Mega form flickering on and off, on and off, like a bad bulb. Its trainer is crying. Alain watches it for a long time, and the Charizard at his side makes a low, unhappy sound.`, takeSlot(), takeNode(2), flag('aq56-shown'), flag('aq56-convinced')), { requires: [flagIs('flare-mine-running')] }),
      ch('Help him find out.', out(`"Fine. Show me with paper." For three nodes you follow his sponsor's shipments together: a crate number in a depot, a driver who will not meet your eye, a ledger in a site office with one page torn out and the next page still pressed with its writing. Alain reads every line twice. By the end he has stopped arguing. He is only reading.`, takeSlot(), takeNode(3), flag('aq56-traced'), flag('aq56-convinced'))),
    ]),
  ev('aq56-listens', 'He Listens Anyway', AQ, { room: true, cast: ['boss.alain'], pokemon: 'charizard', tint: '#1a1a24', effect: 'none' },
    'The Charizard lets go of its Mega form all at once, panting, and Alain kneels to put a hand on its neck. When he stands up, he does not look at you. "I said I would stop listening." A pause, as long as a held breath. "I didn\'t say I would stop thinking." He folds his arms, grudging. "So. Show me."',
    [
      ch('Show him the mine.', out(`Two nodes down off the ridge and along the valley floor. At the fence, you point. In the field a Pokémon staggers, its Mega form flickering on and off like a bad bulb, and its trainer is crying. Alain watches it for a long time without a word.`, takeNode(2), flag('aq56-shown'), flag('aq56-convinced')), { requires: [flagIs('flare-mine-running')] }),
      ch('Help him find out.', out(`Three nodes of following paper: a crate number, a nervous driver, a ledger with a page torn out and the next page still holding the dent of the writing. Alain reads every line twice. He beat nobody to get here, and he knows it. By the end he is only reading.`, takeNode(3), flag('aq56-traced'), flag('aq56-convinced'))),
    ]),
  ev('aq56-stops-listening', 'He Stops Listening', AQ, { room: true, cast: ['boss.alain'], pokemon: 'charizard-mega-x', tint: '#1a1a24', effect: 'none' },
    'The Mega Charizard X stands over your fallen Pokémon, blue flame guttering at its jaws, and does not press the attack. Alain looks at you as if you have confirmed something he hoped was not true. "Then it was only talk." He turns back to the valley, and the floodlights, and the drills.',
    [
      ch('Let him go.', out(`You do. As you leave, you look back once. He is still standing at the edge of the ridge, looking down at the mine, and he has not moved. Maybe he stopped listening. He has not stopped looking.`, flag('aq56-walked-away'))),
    ]),
  ev('aq56-the-truth', 'The Truth', AQ, { callback: true, minStage: stageOf('A10'), requires: [slotFree(), flagIs('aq56-convinced'), age('aq56-convinced', 1, 1)], cast: ['boss.alain'], pokemon: 'charizard', tint: '#20141a', effect: 'none',
    remembers: [
      { id: 'stones-taken', when: [flagIs('flare-stones-taken')], notice: 'His eyes go to your bag. He knows the glow. "And you kept some." It is not an accusation, quite. "We\'re not so different."',
        hide: [0], addChoices: [ch('Then we both stop.', out(`You take one of the stones you took from that seam out of your bag and put it in his hand. He looks at it, and then at you, and something in his face loosens. He unclips his sponsor's Key Stone, weighs the two together, and throws them both off the ridge as far as he can. The one on the cord round his neck, his own, from before all this, he keeps. Then he takes a Charizardite from his coat. "This one's from my teacher. Clean. Better with you than in a drawer."`, takeSlot(), item('charizardite-x'), flag('aq56-truth'), flag('aq56-stopped'), flag('aq56-sponsor-stone-thrown'), flag('aq56-stone-given-back'), moment('You and Alain both gave back what the mine had given you.', 70)))] },
      { id: 'mairin-there', when: [flagIs('aq56-mairin')], notice: 'Mairin stands a step behind him, the Chespin very quiet on her head. She has one hand on his sleeve. He lets it stay there.' },
    ] },
    `A stage on, the same ridge, or one very like it. Alain is waiting, coat collar up. His Charizard sits beside him in its ordinary form, quiet, its tail-flame low. He looks as if he has not slept. "It's the same mine. They told me it was a natural seam." He holds up his hand, the Key Stone in his glove catching the grey light. "I've been using it for a year." For a moment he looks much younger than his coat. "Every battle. Every time I said it was to protect something."`,
    [
      ch('Then stop.', out(`He looks at the stone for a long moment. Then he unclips his sponsor's Key Stone from the glove and throws it off the ridge, as far as he can. It flashes once and is gone into the valley. The stone on the cord round his neck, his own, from before all this, he keeps. He takes a Charizardite from his coat and puts it in your hand. "This one's from my teacher. Clean. Better with you than in a drawer."`, takeSlot(), item('charizardite-x'), flag('aq56-truth'), flag('aq56-stopped'), flag('aq56-sponsor-stone-thrown'), moment('Alain threw his sponsor\'s Key Stone off a ridge, and kept his own.', 65))),
      ch('Use it against them.', out(`He looks down at the floodlights for a long time. "They taught me that power protects what matters." His hand closes on the Key Stone. "Fine. Then it protects that valley." He takes a Charizardite from his coat and gives it to you, a clean one, from his teacher. "So you're not fighting them with their own stones. Next stage, at the mine. I'll be there."`, takeSlot(), item('charizardite-x'), flag('aq56-truth'), flag('aq56-alain-joins'), moment('Alain turned the power his sponsor gave him against the mine that made it.', 65))),
      ch('It\'s not your fault.', out(`"Maybe not." He pulls his glove back on. "But it's mine to fix." He gives you a Charizardite from his coat, a clean one, from his teacher, as if paying a debt. Then he walks down off the ridge alone, toward the floodlights, his Charizard beside him, and does not ask you to come.`, takeSlot(), item('charizardite-x'), flag('aq56-truth'), flag('aq56-alone'), moment('Alain went down to the mine alone. Long after, he was still there, working, putting back what had been taken.', 65))),
    ]),
  ev('aq56-mine-together', 'At the Mine, Together', AQ, { callback: true, minStage: stageOf('A11'), requires: [slotFree(), flagIs('aq56-alain-joins'), age('aq56-alain-joins', 1, 1)], cast: ['boss.alain', 'trainer.pr/flare_grunt_m'], pokemon: 'charizard-mega-x', tint: '#2a1414', effect: 'fire' },
    'The mine at night. Red uniforms at the gate, floodlights, the drills still chewing the hillside. Alain is already there, leaning on the fence as if he has been waiting all day. "You came." His Charizard Mega Evolves in a roar of blue fire, and for once it does not look like a threat. It looks like a promise. The guards see you both, and reach for their Balls.',
    [
      ch('Go down together.', fight('You go through the gate side by side. Alain says only one thing, without looking at you: "Left one\'s mine."', duel('Mine Guards', { cls: 'worker', size: 2, format: 'doubles', types: ['fire', 'dark'], lv: 2, win: [flag('aq56-mine-fought'), moment('You and Alain took the gate of the mine together, his Mega Charizard X beside you.', 70)] }, { ally: 'charizard-mega-x', lose: [flag('aq56-mine-fought'), flag('aq56-mine-lost')] }), takeSlot())),
    ]),

  // ---------------- AQ57. The Beast Who Took Off Its Mask ----------------
  ev('aq57-took-off-its-mask', 'The Beast Who Took Off Its Mask', AQ, { rarity: 'rare', minStage: stageOf('A8'), types: tagTypes(), requires: [slotFree()], cast: ['boss.gladion-stance'], pokemon: 'type-null', tint: '#1c1420', effect: 'none',
    remembers: [
      { id: 'lillie', when: [flagIs('l12-altars-done')], notice: 'He looks at you again, properly this time, and his shoulders drop a little. "I know who you are. You helped my mother. And Lillie." He says it to the ground. "I owe you."' },
      { id: 'mother', when: [flagIs('u2-lusamine-done')], notice: 'He looks at you again, properly this time, and his shoulders drop a little. "I know who you are. You helped my mother. And Lillie." He says it to the ground. "I owe you."' },
    ] },
    `A ruined lab on a cliff at night, half its roof gone, the sea loud below. A boy in a torn hoodie sits on a fallen beam. Beside him crouches a heavy Pokémon in an iron helmet, the mask chained shut across its face. "Don't come closer. It doesn't like people." He does not look up. "They built it to kill gods. Tested it. It went wild, so they locked it up and forgot it." His hand rests on the chain. "I took it. It's mine to fix." The Type: Null makes a low sound, deep in its chest. Through the slits in the mask, it is looking at you.`,
    [
      ch('Battle.', fight(`He stands, and the Type: Null stands with him, chains clanking. "Fine. You'll see what it is." He fights hard, harder than he needs to, as if he is fighting something else.`, duel('Gladion', { cls: 'ace-trainer', size: 3, team: ['type-null', 'zoroark', 'lucario'], lv: 1, win: [flag('aq57-battled'), flag('aq57-cracked'), flag('aq57-mask-ready'), room('aq57-the-crack')] }, { sprite: 'gladion', lose: [flag('aq57-battled'), room('aq57-not-yet')] }), takeSlot())),
      ch('Talk to it.', out(`You do not go closer. You sit down on the broken floor where you are, in front of it, and talk: about the road, about your team, about nothing much. Gladion says "Don't" once, and then says nothing. It does not attack. It watches you for a long time through the slits. The sea comes in and goes out. Then, very slowly, the Type: Null lowers its heavy head until the iron touches the ground in front of you.`, takeSlot(), flag('aq57-talked'), flag('aq57-mask-ready'))),
      ch('Ask about his sister.', fight(`"Lillie?" He looks up at last, startled. "She's better than me. She's not afraid of anything she can see." He looks away, at the sea, for a long moment. Then he stands, too fast. "That's enough talking." The Type: Null rises with him.`, duel('Gladion', { cls: 'ace-trainer', size: 3, team: ['type-null', 'zoroark', 'lucario'], lv: 1, win: [flag('aq57-asked'), flag('aq57-battled'), flag('aq57-cracked'), flag('aq57-mask-ready'), room('aq57-the-crack')] }, { sprite: 'gladion', lose: [flag('aq57-asked'), flag('aq57-battled'), room('aq57-not-yet')] }), takeSlot())),
    ]),
  ev('aq57-the-crack', 'A Crack in the Iron', AQ, { room: true, cast: ['boss.gladion-stance'], pokemon: 'type-null', tint: '#1c1420', effect: 'shake' },
    'The last blow lands on the mask itself. There is a sound like ice on a pond, and a thin bright line runs across the iron, from one eye-slit to the other. The Type: Null goes completely still. So does Gladion. Neither of them breathes. Then the Type: Null shakes its head, slowly, as if something that has been pressing on it for years weighs a little less.',
    [
      ch('Let it breathe.', out(`You step back and give it room. Gladion kneels beside it and puts his hand flat on the crack, very gently, as if checking a wound. "It's never cracked," he whispers. "Not once. Not for me." When he looks up at you, he does not tell you to stay back.`, flag('aq57-crack-seen'))),
    ]),
  ev('aq57-not-yet', 'Not Ready', AQ, { room: true, cast: ['boss.gladion-stance'], pokemon: 'type-null', tint: '#1c1420', effect: 'none' },
    'The Type: Null stands over your last Pokémon, chains swinging, the mask whole and blank. Gladion calls it back with one word, and it comes, which seems to surprise him a little. "It isn\'t ready." He sits back down on the beam. "Neither am I."',
    [
      ch('Walk on.', out(`You leave them there, the boy and the masked beast, sitting side by side on a broken beam while the sea comes in below. At the door you look back. He has his hand on the chain again. Not holding it. Just resting there.`, flag('aq57-left-alone'))),
    ]),
  ev('aq57-the-mask', 'The Mask', AQ, { callback: true, minStage: stageOf('A9'), requires: [slotFree(), flagIs('aq57-mask-ready'), age('aq57-mask-ready', 1, 1)], cast: ['boss.gladion-stance'], pokemon: 'type-null', tint: '#1c1420', effect: 'glint',
    remembers: [
      { id: 'blessing', when: [flagIs('blessing-silvally')], notice: 'The air around the Type: Null hums faintly, the way the air hums near a shrine. The Memory that blessed your run is close, and it knows this creature.',
        hide: [0], addChoices: [ch('Take the mask off together.', out(`You take one side of the chain; Gladion takes the other. It is heavier than it looks. Together you lift, and the old locks give, and the chains fall away ringing onto the stone, and the mask comes off in your hands. Underneath is a face nobody has seen. Then the light comes, every colour at once, and where the Type: Null stood a Silvally shakes out a crest like a flag. The hum in the air rises to a chord. This is a Rite, and you were part of it. Gladion has to sit down.`, takeSlot(), any(...MEMORIES), bondUp(1, 'party'), flag('aq57-together'), flag('aq57-rite'), moment('You and Gladion took off the mask together, and it became a Silvally. The Memory blessing sang.', 80)))] },
      { id: 'shadow', when: [flagIs('aq57-talked'), flagIs('shadow-purified')], notice: 'Before Gladion can speak, the Type: Null walks past you both, to one of your Pokémon: the one that was once a Shadow. They stand nose to mask a long time. Something passes between them that nobody else can hear.' },
    ] },
    `A stage on, the ruined lab again, at night. Gladion is waiting, and so is the Type: Null, and this time it gets up when it sees you. It walks three steps toward you, chains dragging, and stops, and lowers its head for you to touch the iron. Gladion watches it go to you. His voice is rough. "It trusts you." He laughs, short and unhappy. "It took me a year."`,
    [
      ch('Take the mask off together.', out(`You take one side of the chain; Gladion takes the other. It is heavier than it looks. Together you lift, and the old locks give, and the chains fall away ringing onto the stone, and the mask comes off in your hands. Underneath is a face nobody has ever seen. Then the light comes, every colour at once, and where the Type: Null stood a Silvally shakes out a crest like a flag. Gladion has to sit down. He puts a disc in your hand without looking at it. "For you. For this."`, takeSlot(), any(...MEMORIES), bondUp(1, 'party'), flag('aq57-together'), moment('You and Gladion took off the mask together, and it became a Silvally in front of you both.', 75))),
      ch('Leave it on.', out(`Gladion breathes out, and it sounds like relief. "Yeah. Not yet." He rests his hand on the mask, and the Type: Null leans into it. "When it's ready. Not when I am." He gives you a disc from his pocket, one of the Memories he has been carrying for the day it can use them. "Thanks. For not pushing."`, takeSlot(), any(...MEMORIES), flag('aq57-left-on'))),
      ch('That\'s your job.', out(`He looks at you for a long moment. Then he nods, slowly, as if you have given him something heavier than the chain. "Yeah. It is." He presses a disc into your hand, a Memory, for later. "Thanks." When you go, he is sitting beside it, working at the first lock with his bare fingers.`, takeSlot(), any(...MEMORIES), flag('aq57-his-job'), moment('Long after you left, Gladion took the mask off himself. The last anyone saw of them, it was a Silvally, and it walked beside him.', 65))),
    ]),

  // ---------------- AQ58. The Ones They Let Go ----------------
  ev('aq58-ones-they-let-go', 'The Ones They Let Go', AQ, { rarity: 'rare', minStage: stageOf('A5'), types: tagTypes(), requires: [slotFree(), flagIs('trio-rep', 10)], cast: ['boss.teamrocket'], pokemon: 'arbok', tint: '#1e2a1a', effect: 'none' },
    `A forest edge. Jessie and James, two very familiar faces, out of uniform for once, in brand-new hiking gear with the price tags still on. An Arbok and a Weezing are coiled around a nest of Seviper eggs, and down the track, engines idle: poachers' trucks, waiting. "Don't look at us like that," the woman snaps. "We're not stealing them." The man's voice is softer. "We left them in the wild. Arbok and Weezing. Years ago. To protect a nest just like this one." He swallows. "We came back to see if they'd remember us. They did. And there were the trucks." The woman squares up. "So. Help, or get out of the way."`,
    [
      ch('Help.', fight(`Jessie stares at you. James's mouth falls open. Then the first truck door bangs and there is no time to be surprised. You take your place beside them, your Pokémon next to Arbok, the Weezing hovering over the nest like a storm cloud. "Don't you dare get the eggs scratched!"`, duel('Poachers, First Wave', { cls: 'roughneck', size: 2, format: 'doubles', types: ['dark', 'steel'], win: [flag('aq58-helped'), flag('aq58-wave-1'), later('aq58-second-wave', 5)] }, { ally: 'arbok', lose: [flag('aq58-helped'), flag('aq58-wave-1'), flag('aq58-wave-lost'), later('aq58-second-wave', 5)] }), takeSlot())),
      ch('Arrest them.', out(`The moment you say it, they are gone: into the trees, the way only two people with a great deal of practice can be gone. The Arbok and the Weezing do not follow them. They stay exactly where they are, coiled round the eggs, watching their trainers run. Down the track the truck doors are opening. The poachers have seen that the people have left, and only the Pokémon are left to stop them.`, takeSlot(), flag('aq58-arrested'), room('aq58-alone-at-the-nest'))),
      ch('Leave them be.', out(`You step back off the track. They look at you as if you have done something nobody has ever done for them. "You're... just letting us?" Jessie says. "Thank you," James says, very fast, before she can spoil it. Then the trucks come, and they hold the nest themselves: the Arbok's hood flared, the Weezing's smoke rolling across the path, the two of them shouting orders over each other. It is loud and messy and brave. When it is over, two of the eggs are gone.`, takeSlot(), flag('aq58-left'), room('aq58-after-the-poachers'))),
    ]),
  ev('aq58-alone-at-the-nest', 'The Two Who Stayed', AQ, { room: true, pokemon: 'weezing', tint: '#1e2a1a', effect: 'fog' },
    'The poachers walk up the track, unhurried, nets over their shoulders. Arbok flares its hood. Weezing pours smoke over the eggs to hide them. They are not young any more, either of them, and there are a lot of poachers. Somewhere in the trees, two people are watching and not coming back. The Arbok glances at you, once.',
    [
      ch('Help Arbok and Weezing.', fight('You step in beside the Arbok. It hisses at you, then decides you are on its side, and turns its hood to the trucks.', duel('Poachers', { cls: 'roughneck', size: 2, format: 'doubles', types: ['dark', 'steel'], win: [flag('aq58-nest-saved'), room('aq58-after-the-poachers')] }, { ally: 'arbok', lose: [flag('aq58-eggs-taken'), room('aq58-empty-nest')] }))),
      ch('Watch from the track.', out(`You do not move. The Arbok and the Weezing fight for a long time, and they are very brave, and there are too many poachers. The nets come down. When the trucks pull away, the nest is empty, and the two old Pokémon lie beside it, breathing hard.`, flag('aq58-eggs-taken'), room('aq58-empty-nest'))),
    ]),
  ev('aq58-second-wave', 'The Second Truck', AQ, { room: true, requires: [slotFree()], cast: ['boss.teamrocket'], pokemon: 'weezing', tint: '#1e2a1a', effect: 'none' },
    'Back at the forest edge, the trucks have come back, and there are more of them. Jessie and James have not left the nest since you did; they have the look of people who have slept sitting up. "They brought a net gun," James whispers. "Who brings a net gun to a nest?" Jessie does not whisper. "You came back. Good. Get in line."',
    [
      ch('Hold the line.', fight('The net gun coughs. The Weezing gets in front of it and takes the net full in the face, and does not move from the nest.', duel('Poachers, Second Wave', { cls: 'roughneck', size: 3, format: 'doubles', types: ['dark', 'steel'], win: [flag('aq58-wave-2'), later('aq58-third-wave', 5)] }, { ally: 'arbok', lose: [flag('aq58-wave-2'), flag('aq58-wave-lost'), later('aq58-third-wave', 5)] }), takeSlot())),
    ]),
  ev('aq58-third-wave', 'The Last Wave', AQ, { room: true, requires: [slotFree()], cast: ['boss.teamrocket', 'trainer.roughneck'], pokemon: 'arbok', tint: '#241a14', effect: 'none' },
    'The last of them come up the track at dusk: every truck, and the man who owns them, in a clean coat, looking bored. "Three days for one nest. Do you know what eggs like these fetch?" Jessie steps in front of the nest. "Do you know what WE fetch?" James stands next to her. His knees are shaking. He does not move either.',
    [
      ch('Finish it.', fight('Arbok, Weezing, your team, and two people in hiking gear who are trying very hard to be brave. It is enough. It has to be.', duel('The Poachers\' Boss', { cls: 'roughneck', size: 3, format: 'doubles', types: ['dark', 'steel', 'poison'], win: [flag('aq58-wave-3'), room('aq58-after-the-poachers')] }, { ally: 'arbok', lose: [flag('aq58-wave-3'), flag('aq58-wave-lost'), room('aq58-after-the-poachers')] }), takeSlot())),
    ]),
  ev('aq58-after-the-poachers', 'After the Poachers', AQ, { room: true, cast: ['boss.teamrocket'], pokemon: 'arbok', tint: '#1e2a1a', effect: 'sparkle',
    remembers: [
      { id: 'ambushes', when: [flagIs('rocket-ambush-beaten', 3)], notice: 'James looks at you and laughs, a little helplessly. "We\'re always losing to you. Every time. Three times!" He wipes his face. "This was better."' },
      { id: 'arrested', when: [flagIs('aq58-arrested')], notice: 'Two people creep out of the trees, ashamed, scratched by brambles. They ran. Their Pokémon did not. They cannot look at you, and they cannot look at the nest, so they look at their boots.' },
      { id: 'left', when: [flagIs('aq58-left')], notice: 'There are two hollows in the nest where eggs used to be. Jessie keeps touching the edge of one of them.' },
    ] },
    'The trucks are gone. The forest is quiet, the way a place is quiet after shouting. Arbok and Weezing lie curled around the nest, tired and scuffed and very pleased with themselves. Jessie sits down hard on a log. "That\'s twice they\'ve saved something." Her voice cracks on it. "That\'s more than us." James kneels in front of them. "Do you want to come home?" Arbok and Weezing look at the nest. Then they look at their trainers.',
    [
      ch('Let them choose.', out(`They choose. Arbok lays its head in Jessie's lap, just for a moment, and then goes back to the nest and coils round it. Weezing bumps James gently in the chest and floats back to its post. They stay. Jessie cries, loudly and without any dignity. James pretends he isn't crying, and fails. Before they go, Jessie presses a warm egg into your hands: one of the nest's own, an Ekans. "From them. Not from us. Don't make it weird."`, egg({ species: ['ekans'] }), flag('aq58-let-choose'), flag('aq58-trio-friends'), moment('Jessie and James let Arbok and Weezing choose. They chose the nest.', 70))),
      ch('They belong here.', out(`"We know," Jessie says, a little angrily, as if you have said something she has been not-saying for years. "We KNOW." James puts his hand on her arm. Arbok and Weezing go back to the nest, and stay. Before the two of them leave, James gives you a warm egg from the nest: an Ekans. "They'd want it to see the world. Like they did."`, egg({ species: ['ekans'] }), flag('aq58-belong-here'), flag('aq58-trio-friends'), moment('Jessie and James left Arbok and Weezing where they belonged. Again.', 65))),
      ch('Take them home.', out(`Jessie stands up so fast the log rolls. "No." She looks at the nest, at the eggs, at her old Arbok curled round them. "Not if it means the nest goes." James nods, miserable and certain. Arbok and Weezing stay. Jessie hands you a warm egg, an Ekans, without a word, and walks off into the trees with her chin very high.`, egg({ species: ['ekans'] }), flag('aq58-take-home'), flag('aq58-trio-friends'), moment('Jessie and James would not take their Pokémon home if it cost the nest.', 65))),
    ]),
  ev('aq58-empty-nest', 'The Empty Nest', AQ, { room: true, cast: ['boss.teamrocket'], pokemon: 'arbok', tint: '#1a1a1a', effect: 'rain' },
    'The trucks are gone, and the eggs with them. Two people come slowly out of the trees and stop at the edge of the empty nest. Arbok and Weezing are lying beside it, beaten and tired, still guarding nothing. Jessie sits down hard on a log. "They stayed. We ran, and they stayed." James kneels in front of them. "Do you want to come home?" Arbok and Weezing look at the empty nest. Then they look at their trainers.',
    [
      ch('Let them choose.', out(`For a long time nobody moves. Then Arbok uncoils, slowly, lays its head in Jessie's lap for one moment, and goes back to the empty nest and curls round it again. Weezing bumps James in the chest and floats back to its post. There will be another clutch in spring, and somebody has to be here. They stay. Jessie cries, loudly. James pretends he isn't, and fails completely.`, flag('aq58-let-choose'), flag('aq58-trio-friends'), moment('The eggs were taken, and still Arbok and Weezing chose to stay and guard the forest.', 55))),
      ch('They belong here.', out(`"We know," Jessie says, a little angrily, as if you have said something she has spent years not saying. "We KNOW." Arbok and Weezing coil round the empty nest as if the next clutch might come tonight. James leaves them half his sandwich. The two of them walk away without looking back, which is how you know how much they want to.`, flag('aq58-belong-here'), flag('aq58-trio-friends'))),
      ch('Take them home.', out(`Jessie looks at the empty nest for a long time. "No." Her voice shakes. "Not if it means the next nest goes too." James nods, miserable and certain. Arbok and Weezing stay. Jessie walks off into the trees with her chin very high, and James follows, and neither of them says a word for a long way.`, flag('aq58-take-home'), flag('aq58-trio-friends'))),
    ]),

  // ---------------- AQ59. The Meowth Who Learned to Talk ----------------
  ev('aq59-meowth-learned-to-talk', 'The Meowth Who Learned to Talk', AQ, { rarity: 'uncommon', minStage: stageOf('A4'), types: tagTypes(), requires: [inRegion(...NOT_KANTO), notYet('aq58-arrested')], pokemon: 'meowth', tint: '#1a1c28', effect: 'none',
    remembers: [{ id: 'helped', when: [flagIs('aq58-helped')], notice: 'It squints at you. Then its whole face changes. "Hang on. I know you. You helped my two idiots with the eggs." It sniffs. "You\'re alright. For a twerp."' }] },
    `An alley at night, one lamp buzzing. A Meowth sits on a bin with its back to the street, its tail hanging down. It is talking, quite clearly, in words, to nobody. "Learned to walk on two legs for a girl. Learned to talk for her too." It picks at the lid of the bin. "She said it was weird. Said a Meowth talking was creepy." A long pause. "Now I can't stop. That's the joke, see. Ain't it funny." It looks over its shoulder at you, and it is not laughing.`,
    [
      ch('That\'s sad.', out(`"Don't." It holds up a paw. "Don't, or I'll start." It does start: big ugly sobs, its whiskers shaking, its face in both paws, for a whole minute. Then, in the middle of a sob, it hears itself, and snorts, and starts laughing at itself instead, and cannot stop that either. "Look at me. Cryin' on a bin. Some tough guy."`, flag('aq59-sad'), room('aq59-gotta-go'))),
      ch('That\'s amazing.', out(`It puffs up to twice its size. "It IS, ain't it?" It counts on its claws. "Three things a Meowth knows that people don't. One: the warm spot on a roof moves, and you gotta move with it. Two: every kitchen drops somethin' at closing time. Three." It hesitates. "Three: if they don't wanna hear you, talkin' louder don't help." It deflates a little. Then it puffs up again, on purpose.`, flag('aq59-amazed'), room('aq59-gotta-go'))),
      ch('Teach me something.', out(`It hops down and walks round your team, very serious. "Tail. Always the tail. Mouth can lie. Tail can't." It shows you: a twitch at the tip is thinking, a puffed tail is scared, a slow sweep is getting ready to pounce, and a tail held straight up with a little hook at the end is happy. "That one's rare. Treasure it." From now on you watch tails. You start to see things.`, flag('aq59-taught'), room('aq59-gotta-go'))),
    ]),
  ev('aq59-gotta-go', 'My Lot', AQ, { room: true, pokemon: 'meowth', tint: '#1a1c28', effect: 'none' },
    'The Meowth hops down off the bin and brushes off its fur. Somewhere a few streets over, there is a crash, and a voice that is definitely a woman shouting at a man. Its ears go flat. "I gotta go. My lot get into trouble if I\'m not there." It says it like a complaint, but it is already walking toward the noise.',
    [
      ch('Your lot?', out(`"Two humans. Couple of idiots. They've been in trouble since the day I met 'em." It stops at the mouth of the alley. "They're my family. Ain't sorry about it, either." It flicks something at you over its shoulder: a gold coin, worn smooth. "For listenin'." Then it is gone, running on two legs toward the shouting.`, item('amulet-coin'), flag('aq59-your-lot'), flag('aq59-meowth-friend'))),
      ch('Come with me instead.', out(`It actually stops and thinks about it, which surprises both of you. "Nah." It shakes its head slowly. "They need me more." It digs in its fur and comes up with a gold coin, old and shiny, and presses it into your hand. "Here. For luck. Don't spend it on nothin' stupid." It runs off toward the noise before you can thank it.`, item('amulet-coin'), flag('aq59-come-with-me'), flag('aq59-meowth-friend'))),
      ch('Good luck.', out(`It nods, once, like a person, and goes. At the end of the alley it turns back, flips you a coin with a flick of its tail, gold and spinning under the lamp, and then it is gone into the dark. The coin lands in your palm, warm.`, item('amulet-coin'), flag('aq59-good-luck'), flag('aq59-meowth-friend'))),
    ]),
  ev('aq59-tag-partner', 'Meowth, Tag Partner', AQ, { callback: true, requires: [flagIs('aq59-meowth-friend'), flagIs('aq58-helped')], pokemon: 'meowth', tint: '#1a1c28', effect: 'none' },
    'Two road toughs block the path, grinning, and before you can call your first Pokémon a Meowth drops off a wall and lands beside you on two feet. "Told ya. You helped my two idiots, so you get me for one scrap." It cracks its claws. "Don\'t tell \'em. They get jealous."',
    [
      ch('Fight together.', fight('The Meowth goes in claws first, all Fury Swipes and no plan, and spends the rest of the fight complaining about it: the dirt, the noise, the size of the other guy.', duel('Road Toughs', { cls: 'roughneck', size: 2, format: 'doubles', types: ['normal', 'dark'], win: [flag('aq59-tagged')] }, { ally: 'meowth', lose: [flag('aq59-tagged')] }))),
      ch('Let it go home.', out(`"Suit yourself." It looks a bit hurt, then hides it. It sends the toughs running with one hiss anyway, and walks off with its tail held straight up, with a little hook at the end.`, flag('aq59-sent-home'))),
    ]),
  ev('aq59-empty-alley', 'The Empty Alley', AQ, { callback: true, minStage: stageOf('A4'), requires: [flagIs('aq58-arrested'), inRegion(...NOT_KANTO)], tint: '#1a1c28', effect: 'none' },
    'An alley at night, one lamp buzzing. There is a bin with a dent on the lid the shape of something that used to sit there a lot. Claw marks on the wall. A little pile of bottle caps, sorted by colour. Whoever lives here is out, or does not want to be found by you. Somewhere a few streets over, nobody is shouting.',
    [
      ch('Walk on.', out(`You walk on. At the end of the alley you look back, and for a moment there is a shape on the wall: two pointed ears, a curling tail. It does not say anything. It does not need to.`, flag('aq59-alley-empty'))),
    ]),

  // ---------------- AQ60. Sparky ----------------
  ev('aq60-sparky', 'Sparky', AQ, { rarity: 'uncommon', minStage: stageOf('A3'), types: tagTypes(), requires: [slotFree()], cast: ['trainer.pr/camper_m'], pokemon: 'pikachu', tint: '#2a2a1a', effect: 'none',
    remembers: [{ id: 'pikachu', when: [hasMon('pikachu')], notice: 'Your Pikachu hops down too. The two of them walk round each other once, very seriously, cheeks sparking. Then they turn and touch tails, tip to tip, and something small and bright jumps between them.' }] },
    `A tournament grounds after the crowds have gone home. Paper cups roll across the empty bleachers, and somebody has left a flag tied to the railing. A trainer about your age sits up near the top with his elbows on his knees, and next to him sits a Pikachu with a tuft of hair sticking up on its head like a little flame. "You remind me of someone." He grins down at you. "Had a cap like yours. Got to the quarter-finals, then lost to me." He looks out over the empty field. "Best battle I ever had. We didn't even mind who won." The Pikachu hops down the bleachers, one row at a time, and looks your party over with great interest.`,
    [
      ch('Battle.', fight(`"Really? Yes!" He is down the bleachers in three jumps. "Sparky, Butterfree, Charizard, Lapras, everybody up!" He is cheerful the whole time: cheering your good moves as loudly as his own, laughing when Sparky gets knocked flat, shouting "Again!" when it gets back up.`, duel('Ritchie', { cls: 'ace-trainer', size: 4, team: ['pikachu', 'butterfree', 'charizard', 'lapras'], win: [flag('aq60-battled'), flag('aq60-won'), room('aq60-after')] }, { lose: [flag('aq60-battled'), room('aq60-after')] }), takeSlot())),
      ch('Trade stories.', out(`He makes room for you on the bench. The sun goes down. Your Pokémon fall asleep in a heap on the warm boards, Sparky on top, and nobody goes anywhere for a long time. It is as good as a night at a Center, and better company.`, takeSlot(), heal(1), rest(), flag('aq60-stories'), room('aq60-stories'))),
      ch('Train together.', out(`"Oh, yes. Sparky loves a training partner." He jumps up. "Same road as you for a bit. We'll work on it as we go: speed first, then the good stuff." Sparky does three laps of the field to show you what speed means, and comes back looking smug.`, takeSlot(), flag('aq60-trained'), later('aq60-training-speed', 5))),
    ]),
  ev('aq60-stories', 'The Quarter-Final', AQ, { room: true, cast: ['trainer.pr/camper_m'], pokemon: 'pikachu', tint: '#2a2a1a', effect: 'none' },
    'He tells you about the quarter-final: the boy in the cap, the Pikachu that would not quit, the rain that started halfway through so that nobody could tell who was crying. "I won. Barely. Then I lost the next round, because I was still thinking about that one." He laughs. "Worth it." He turns to you. "Your turn. What\'s the story of your road so far?"',
    [
      ch('Tell him about {starter}.', out(`You tell him about the very first day: the first Ball, the first battle, the first night on the road, and {starter} beside you through all of it. He listens like it is the best story he has ever heard. Sparky has climbed into your lap by the end. "That's the good stuff," Ritchie says quietly. "Don't ever forget that bit."`, flag('aq60-told-starter'), moment('You told Ritchie the story of your first day on the road.', 50), room('aq60-after'))),
      ch('Tell him about your rival.', out(`You tell him about the trainer who keeps turning up on your road: every battle, every sharp word, every time they were right. He nods all the way through. "You've got one too, then." He looks out at the empty field. "Hang on to them. They're how you find out how far you've come."`, flag('aq60-told-rival'), moment('You told Ritchie about your rival, and he understood.', 50), room('aq60-after')), { requires: [{ kind: 'rivalMet', atLeast: 1 }] }),
      ch('Tell him about the one you lost.', out(`You tell him about the one who is not on your team any more. It is hard to start, and then hard to stop. Ritchie does not say anything clever. He just sits close, and Sparky puts its small warm paw on your hand and leaves it there until you have finished.`, flag('aq60-told-loss'), moment('You told Ritchie about the Pokémon you lost, and he listened all the way to the end.', 60), room('aq60-after')), { requires: [{ kind: 'memorial', atLeast: 1 }] }),
    ]),
  ev('aq60-training-speed', 'Sparky\'s Training: Speed', AQ, { room: true, requires: [slotFree()], cast: ['trainer.pr/camper_m'], pokemon: 'pikachu', tint: '#2a2a1a', effect: 'none' },
    'Ritchie has been on your road for days now, and Sparky has been on your shoulder for most of it. Today he stops in a field and stretches. "Right. Speed. The only way to learn it is to try to catch something faster than you." Sparky bounces on its toes, sparks popping off its tuft. "One on one. Sparky against your lead. Don\'t go easy; it hates that."',
    [
      ch('Spar with Sparky.', fight('Sparky is gone before your lead has finished moving. It is everywhere at once, a yellow streak with a tuft on top. Ritchie shouts encouragement at both sides.', monDuel('Sparky', 'pikachu', 1, { win: [flag('aq60-spar-won'), later('aq60-training-move', 5)], lose: [flag('aq60-spar-lost'), later('aq60-training-move', 5)] }), takeSlot())),
    ]),
  ev('aq60-training-move', 'Sparky\'s Training: The Good Stuff', AQ, { room: true, requires: [slotFree()], cast: ['trainer.pr/camper_m'], pokemon: 'pikachu', tint: '#2a2a1a', effect: 'sparkle' },
    'The last day on the road together. Ritchie sits your lead down in front of Sparky like a teacher with a very small, very bossy assistant. "Sparky\'s got three moves it\'s proud of. It\'ll teach one. Pick." Sparky stands up straight and waits, cheeks crackling.',
    [
      ch('Learn Thunder.', out(`Sparky takes your lead out under the open sky and shows it how to call the lightning down instead of throwing it. It takes all afternoon and one singed tree. Then the sky answers.`, takeSlot(), teach('thunder'), flag('aq60-learned-thunder'), room('aq60-after'))),
      ch('Learn Agility.', out(`Sparky makes your lead run until it stops thinking about running, and then it is suddenly, gloriously fast, faster than it has ever been. Sparky nods, satisfied, like a coach.`, takeSlot(), teach('agility'), flag('aq60-learned-agility'), room('aq60-after'))),
      ch('Learn Quick Attack.', out(`"First move it ever learned," Ritchie says, and Sparky shows it over and over: the push-off, the dart, the hit before anyone has seen it go. By evening your lead is doing it too.`, takeSlot(), teach('quick-attack'), flag('aq60-learned-quick-attack'), room('aq60-after'))),
    ]),
  ev('aq60-after', 'Same Place, Next Year', AQ, { room: true, cast: ['trainer.pr/camper_m'], pokemon: 'pikachu', tint: '#2a2a1a', effect: 'sparkle' },
    'Ritchie stands up and stretches, and Sparky climbs to his shoulder, tuft first. He looks at you, then at the empty grounds, the flag still tied to the railing. "We should do this again." He says it like it has only just occurred to him and it is the best idea he has ever had. "Same place. Next year."',
    [
      ch('Deal.', out(`"Deal!" He shakes your hand hard enough to rattle your Balls. Sparky slaps your palm with its tail, which seems to be its version. "Same bleachers. I'll save you a seat." He walks off whistling, and you are fairly sure he will be here a year from now, whatever happens, waiting.`, flag('aq60-promise'), flag('aq60-ritchie-friend'), moment('You and Ritchie promised to meet at the same grounds next year.', 60))),
      ch('I might not be here.', out(`He looks at you for a second, properly. Then he grins anyway. "Then I'll come find you." He says it like a fact, like the weather. "Sparky never forgets a face. Neither do I." He waves all the way to the gate.`, flag('reunion-guest-ritchie'), flag('aq60-ritchie-friend'), moment('Ritchie said that if you were not there, he would come and find you.', 65))),
    ]),
];

export const REMOVE: string[] = [];
