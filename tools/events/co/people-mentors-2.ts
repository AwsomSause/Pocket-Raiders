// Catalog Overhaul Pack, people: the twelve mentors B1-B6 (STORY_FAMILIES_5.md, Part B). B1 Brook is the pattern for every mentor.
// Each mentor: Lesson, Recruit, Story (catalog ids), and the rooms `final` (the Final Lesson battle, opened by MS12 "Nothing Left to Teach")
// and `farewell` (the last line and the gift, opened by the battle, win or lose). Kit: tools/events/co/_mentors.ts.
// Build: npm run co:build -- people-mentors-2
import { again, ch, fight, item, out, room, type Json } from '../dsl.ts';
import { CATEGORY as CAT, moment, spar, variant } from './_people.ts';
import { bondJoin, bramLine, graduate, lesson, M, mentorKit, trust } from './_mentors.ts';

export const CATEGORY = CAT;


// ---------- B1. Brook of Tidewater (one type, done properly) ----------
const B = mentorKit('brook-tidewater');
const brookLesson = (text: string, which: 'water' | 'starter'): Json => out(text, B.set(which), M.set('lesson'), lesson(), trust(4, 2));
const brookFight = (team: string[], intro: string): Json =>
  ch('"Ready."', fight(intro, spar('Brook of Tidewater', { team, size: 6, lv: 2, win: [moment('You passed Brook\'s Final Lesson'), room(B.id('farewell'))], lose: [moment('Brook\'s Final Lesson beat you, and you still graduated'), room(B.id('farewell'))] })));
const brook: Json[] = [
  B.lesson({
    title: 'One Type, Done Properly',
    intro:
      'A harbour wall, slick with spray, gulls arguing over the fish boxes. Brook sits on a bollard in yellow oilskins with a Golduck at their feet, both of them watching the water like it might try something. ' +
      'Brook: "One type. Done properly. That\'s the whole lesson." The Golduck flicks water off its bill in agreement. Brook: "Pick one. Learn every trick it has. Then learn the tricks against it."',
    choices: [
      ch('"Water, like you."', brookLesson('Brook almost smiles. They spend the afternoon on the wall, Brook pointing at the waves and naming what each one would do to a Fire-type, a Grass-type, a Water-type like their own. For the run, every Water-type you have hits a little harder with its own-type moves.', 'water')),
      ch('"My starter\'s type."', brookLesson('Brook looks at your starter for a long time, then nods slowly, like they approve of the honesty. Brook: "The one you started with. Good. You already love it; now learn it." For the run, every Pokémon of your starter\'s type hits a little harder with its own-type moves.', 'starter')),
      ch('"Why not all of them?"', out('Brook does not even turn round. Brook: "Because you\'ll be good at none." The Golduck sighs through its bill. The question is still there on the wall between you, waiting.', room(B.id('lesson-again')))),
    ],
  }),
  B.room('lesson-again', {
    title: 'Pick One',
    intro: 'The tide has come up a foot while you were thinking. Brook is still waiting, still watching the water. Brook: "Pick one."',
    choices: [
      ch('"Water, like you."', brookLesson('Brook nods once, like you finally said the right word. The afternoon goes to waves and what they do. For the run, every Water-type you have hits a little harder with its own-type moves.', 'water')),
      ch('"My starter\'s type."', brookLesson('Brook: "The one you started with. Good." For the run, every Pokémon of your starter\'s type hits a little harder with its own-type moves.', 'starter')),
    ],
  }),
  B.recruit({
    title: 'Starting to Flow',
    intro:
      'Brook has been watching you battle from the end of a jetty, arms folded under the oilskins. When it is over they come down the boards slowly, and there is something close to warmth in their weathered face. ' +
      'Brook: "You\'re starting to flow. I know a fisherman with a Pokémon that\'d suit you. Of your type."',
    choices: [
      ch('"Meet him."', out('The fisherman is a quiet old man with a net over one shoulder, and the Pokémon is already waiting at the end of his boat, looking at you like it has heard all about you. It comes to you without being asked.', bondJoin(3, { types: ['water'] }), M.set('recruit'), trust(1, 2))),
      ch('"Not yet."', out('Brook shrugs, unbothered. Brook: "He\'ll be there. So will it." The offer will come round again at the next harbour.', again(B.id('recruit')), trust(0, 1))),
    ],
    remembers: [
      variant('starter-type', [B.is('starter')], {
        hide: [0],
        add: [ch('"Meet him."', out('The fisherman is a quiet old man with a net over one shoulder, and the Pokémon waiting on his boat is the same type as your starter, looking at you like it has heard all about you. It comes to you without being asked.', bondJoin(3, { starterType: true }), M.set('recruit'), trust(1, 2)))],
      }),
    ],
  }),
  B.story({
    title: 'Her Badge, Not Her Name',
    intro:
      'An old gym by the harbour, boarded up, its sign so salt-bleached you can barely read TIDEWATER on it. Brook stands in front of it with their hands in their pockets. ' +
      'Brook: "My mother kept this gym. When the harbour flooded, we saved the Pokémon first. I took her badge, not her name." A gull lands on the sign and leaves again. Brook: "The town wants me to reopen it. Under her name."',
    choices: [
      ch('"Reopen it under her name."', out('Brook is quiet for a long moment, then pulls the first board off the door with their bare hands. The Tidewater Gym opens again as their mother\'s, with her old Kingdra and Lapras in the pool. When Brook battles you at the end, it will be with them.', B.set('mother'), M.set('story'), trust(5, 3))),
      ch('"Under yours."', out('Brook looks at you like nobody has ever said that out loud. Then they laugh, short and surprised. The sign gets repainted: BROOK\'S TIDEWATER GYM. When Brook battles you at the end, it will be with their own team.', B.set('own'), M.set('story'), trust(5, 3))),
      ch('"Don\'t reopen it."', out('Brook lets out a long breath, like they have been holding it for years. Brook: "...No. I\'m a teacher. That\'s enough." The gym stays shut. When the Final Lesson comes, it will be out here on the harbour wall, with the sea for a crowd.', B.set('teacher'), M.set('story'), trust(5, 3))),
    ],
    remembers: [bramLine('Brook')],
  }),
  B.room('final', {
    title: 'The Final Lesson',
    intro:
      'Brook leads you to the harbour wall at low tide, where they first taught you, and stands with the sea at their back. Six Poké Balls hang at their belt, every one of them a Water-type. ' +
      'Brook: "One type. Done properly. Show me yours."',
    choices: [brookFight(['golduck', 'pelipper', 'gyarados', 'starmie', 'vaporeon', 'milotic'], 'Brook sends out their own Golduck first, the one that sat at their feet that first day, and the tide comes in around both of you.')],
    remembers: [
      variant('mother', [B.is('mother')], {
        intro:
          'The Tidewater Gym, open again, its pool green and full. Brook stands at the far end under a painted sign with their mother\'s name on it. Six Poké Balls, every one a Water-type; the first two belonged to her. ' +
          'Brook: "One type. Done properly. Show me yours."',
        hide: [0],
        add: [brookFight(['kingdra', 'lapras', 'gyarados', 'starmie', 'vaporeon', 'milotic'], 'Brook sends out their mother\'s old Kingdra first. It rises out of the gym pool like it never left.')],
      }),
      variant('own', [B.is('own')], {
        intro:
          'Brook\'s Tidewater Gym, the paint on the new sign barely dry. Brook stands at the far end of the pool with six Poké Balls, every one a Water-type, every one their own. ' +
          'Brook: "One type. Done properly. Show me yours."',
      }),
    ],
  }),
  B.room('farewell', {
    title: 'You\'ve Done Yours',
    intro:
      'When it is over, Brook calls their last Pokémon back and stands for a while looking at the water. Then they turn to you, and for once the weathered face is not hiding anything. ' +
      'Brook: "One type. Done properly. You\'ve done yours." They press something into your hand: a Mystic Water, and the old Tidewater badge, worn smooth by their thumb.',
    choices: [graduate('You close your hand round both. Brook nods once, the way they did on the first day, and goes back to watching the sea. You walk on, and the badge is warm in your pocket.', item('mystic-water'), moment('Brook gave you the Tidewater badge', 70))],
  }),
];

export const EVENTS: Json[] = [...brook];
export const REMOVE: string[] = [];

export const DOC: Record<string, string> = {
  'mentor-brook-tidewater-lesson': 'SF5 B1 Lesson', 'mentor-brook-tidewater-lesson-again': 'SF5 B1 Lesson (Why not all)', 'mentor-brook-tidewater-recruit': 'SF5 B1 Recruit',
  'mentor-brook-tidewater-story': 'SF5 B1 Story', 'mentor-brook-tidewater-final': 'SF5 B1 Final Lesson', 'mentor-brook-tidewater-farewell': 'SF5 B1 Final Lesson (last line, gift)',
};

export const AFTERSTORY: { match: string; readBy: string }[] = [
  { match: 'brook-(water|teacher)', readBy: 'Brook\'s lesson type (core/mentors/lessons.ts reads brook-starter; water is the default) and the harbour-wall Final Lesson (the default room)' },
  { match: 'mentor-(recruit|graduated)', readBy: 'Arc steps (SF5 How it runs); `mentor-graduated` is read by the Final Reunion and the After graduation table (cross-run, not built)' },
];
