// Catalog Overhaul Pack, people: The Trivia Mentor (`mentor-quiz`, CATALOG_LEDGER.md: REVISE, STORY_FAMILIES_5.md family).
// The ledger's revise: "Questions come from the player's own run (what knocked out your starter?), and the move is a real forgotten tutor move."
// Three questions, each a room, each answer checked against this run (choice branches); two right answers or more earn the tutor move.
// Build: npm run co:build -- people-trivia
import { ch, flag, out, room, type Json } from '../dsl.ts';
import { CATEGORY as CAT, is, moment, oldOf } from './_people.ts';

export const CATEGORY = CAT;

const ID = 'mentor-quiz';
const RIGHT = 'mentor-quiz-right';
const old = oldOf(ID);
const base = { group: old.group ?? 'NPC Stories', rarity: 'uncommon', scene: old.scene ?? { cast: ['trainer.psychic_m'], effect: 'none' } };
const roomOf = (name: string, title: string, intro: string, choices: Json[], remembers?: Json[]): Json => ({
  id: `${ID}-${name}`, name: `The Trivia Mentor: ${title}`, ...base, room: true, requires: [], intro, choices, ...(remembers ? { remembers } : {}),
});
const right = flag(RIGHT);
const teach = (move: string, name: string): Json =>
  ch(`"${name}."`, out(`She rests two fingers on your lead's brow and hums a few notes of something very old. When she steps back, your lead knows ${name}, a move tutors stopped teaching before you were born. She: "Nobody remembers it. Now somebody does."`, { kind: 'teachMove', move }, moment(`The Trivia Mentor taught your lead ${name}`)));

const EVENTS_LIST: Json[] = [
  {
    id: ID, name: 'The Trivia Mentor', ...base, stop: old.stop ?? 'tutor', rarity: old.rarity ?? 'rare', minStage: 1, types: [], requires: [],
    intro:
      'A silver-haired woman sits on a folding stool by the path, a thermos of tea at her feet and a notebook open on her knee, every page full of tiny handwriting about moves. She closes it and folds her hands on top. ' +
      'She: "Answer three questions and I will teach you a move nobody remembers." She looks at your team, one by one, and something in her face softens. She: "Not questions from a book. Questions about you."',
    choices: [
      ch('"Ask."', out('She pours herself a cup of tea and does not offer you one yet. She: "First question, then."', room(`${ID}-q1`))),
      ch('"Not today."', out('She shrugs and opens the notebook again. She: "The move will still be forgotten tomorrow."')),
    ],
  },
  roomOf('q1', 'The First Question',
    'She: "Which of these was with you on the first day?" She waits, the cup halfway to her lips, while your team shuffles in front of her.',
    [
      ch('"This one."', out('She looks at the one you chose for a long moment, then shakes her head gently. She: "Not that one. But you love it like it was." She makes a mark in the notebook.', room(`${ID}-q2`)), {
        pick: {},
        branches: [{ when: [{ kind: 'picked', types: [], starter: true }], text: 'She looks at the one you chose, then at you, and smiles. She: "Of course. You did not even have to think." She makes a small tick in the notebook.', effects: [right, room(`${ID}-q2`)] }],
      }),
    ]),
  roomOf('q2', 'The Second Question',
    'She sets the cup down. Her voice goes quieter. She: "Second question. Has anyone in your care fallen on this road, and not got up again?"',
    [
      ch('"Yes."', out('She studies you, and then your team, and shakes her head slowly. She: "No. Not yet. Keep it that way." She does not tick the notebook, but she does not seem to mind.', room(`${ID}-q3`)), {
        branches: [{ when: [{ kind: 'memorial', atLeast: 1 }], text: 'She nods, and for a moment neither of you says anything. She: "Then you remember them. Good. That is the right answer, though I am sorry it is." A small tick.', effects: [right, room(`${ID}-q3`)] }],
      }),
      ch('"No."', out('She looks at your team, all of them, and nods. She: "Good. Then you know exactly how many you have." A small tick in the notebook.', right, room(`${ID}-q3`)), {
        branches: [{ when: [{ kind: 'memorial', atLeast: 1 }], text: 'She looks at you a long time, and you look away first. She: "That is not true, and you know it is not." She does not tick the notebook.', effects: [room(`${ID}-q3`)] }],
      }),
    ]),
  roomOf('q3', 'The Third Question',
    'She finishes her tea. She: "Last one. How many Gym badges are in your case?"',
    [
      ch('"None yet."', out('She: "None. Honest. The badges will come." A small tick.', right, room(`${ID}-verdict`)), {
        branches: [{ when: [{ kind: 'badges', atLeast: 1 }], text: 'She taps your bag, where the badge case clinks. She: "Count again." No tick.', effects: [room(`${ID}-verdict`)] }],
      }),
      ch('"One or two."', out('She shakes her head. She: "Count again." No tick.', room(`${ID}-verdict`)), {
        branches: [{ when: [{ kind: 'badges', atLeast: 3 }], text: 'She shakes her head. She: "More than that. You have stopped counting." No tick.', effects: [room(`${ID}-verdict`)] }, { when: [{ kind: 'badges', atLeast: 1 }], text: 'She: "Yes. Every one of them earned." A small tick.', effects: [right, room(`${ID}-verdict`)] }],
      }),
      ch('"Three or more."', out('She shakes her head. She: "Not yet. But you will." No tick.', room(`${ID}-verdict`)), {
        branches: [{ when: [{ kind: 'badges', atLeast: 3 }], text: 'She: "Three or more, and you still remember every Gym." A small tick.', effects: [right, room(`${ID}-verdict`)] }],
      }),
    ]),
  roomOf('verdict', 'Nobody Remembers It',
    'She closes the notebook and looks at the page of ticks. She: "Not enough. But you answered honestly about the ones you love, and that is worth something." She tucks a pressed leaf into your hand and goes back to her tea.',
    [ch('"Thank you."', out('The leaf smells faintly of mint. She waves you on without looking up.', moment('The Trivia Mentor quizzed you about your own journey')))],
    [{
      id: 'passed', when: [is(RIGHT, 2)],
      intro: 'She closes the notebook and looks at the page of ticks. She: "Enough. You know your own road. Now choose what to remember." She opens the notebook to a page so old the ink is brown, three moves written on it.',
      hide: [0],
      addChoices: [teach('counter', 'Counter'), teach('seismic-toss', 'Seismic Toss'), teach('metronome', 'Metronome')],
    }],
  ),
];

export const EVENTS: Json[] = EVENTS_LIST;
export const REMOVE: string[] = [];
export const DOC: Record<string, string> = Object.fromEntries(EVENTS_LIST.map((e) => [e.id as string, 'Ledger REVISE: The Trivia Mentor']));
