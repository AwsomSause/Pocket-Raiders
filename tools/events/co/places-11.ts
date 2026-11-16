// Catalog Overhaul Pack, category "places": STORY_FAMILIES_15.md SF100 Heated Moments.
// The four heated moments happen in big battles (rival, Gym and boss fights) through the Battle Drama engine (dramaEvents.json,
// `heated: true`). When the director plays one, core/drama/events.ts noteHeatedMoment owes its after-battle scene: at most one per
// region and three per run. The scene is a callback, so it is the next stop after the battle; answering it clears the flag.
import { ch, ev, flag, flagIs, out, type Json } from '../dsl.ts';

export const CATEGORY = 'places';

const rival = (feelings: Record<string, number>): Json => ({ kind: 'rivalChange', feelings });
const bond = (n: number, who: Json | string): Json => ({ kind: 'friendship', bond: n, who });
const done = (key: string): Json => flag(key, -99);
const scene = (id: string, key: string, name: string, intro: string, choices: Json[]): Json =>
  ev(id, name, 'Heated Moments', { stop: 'event', rarity: 'common', types: [], minStage: 1, callback: true, requires: [flagIs(key)], tint: '#5a2a1a' }, intro, choices);

export const EVENTS: Json[] = [
  scene('lastSecondResolve', 'heated-last-second-resolve', 'Last-Second Resolve',
    'After the battle you can still hear it: "Not yet. NOT YET." Their Pokémon held on at 1 HP when it had no right to, on nothing but will. Your rival is breathing hard, watching you, waiting to see what you will say about it.',
    [
      ch('"Respect."', out('You say it plainly, and you mean it. Your rival looks at you for a long second, then grins, and wipes their face on their sleeve. "Yeah. It was something, wasn\'t it?"', rival({ respect: 1 }), done('heated-last-second-resolve'))),
      ch('"That was unfair."', out('"Unfair?" Your rival\'s face goes hard. "It wanted to win. That\'s all it was." They turn away before you can answer, and do not look back.', rival({ respect: -1, rivalry: 1 }), done('heated-last-second-resolve'))),
    ]),
  scene('newMove', 'heated-new-move', 'The New Move',
    'In the middle of the fight, at half its strength, one of your Pokémon looked back at you, and you knew: it had found something new, something it had never shown you. Now, with the battle done, it is still looking at you, waiting.',
    [
      ch('"Learn it."', out('You kneel down and let it show you again, slowly this time. It is fierce and proud and a little clumsy, and it is its own. You make room for it.', { kind: 'train', what: 'learnMove' }, done('heated-new-move'))),
      ch('"Not now."', out('You rest a hand on its head. "Not now. But I saw it." It seems to understand. It keeps the move for later, folded up inside it like a letter.', done('heated-new-move'))),
    ]),
  scene('overdriveBreakthrough', 'heated-overdrive-breakthrough', 'The Overdrive Breakthrough',
    'In the battle your lead roared, and for a moment it was more than itself: a light came off it that you have never seen before. It is quiet now. It is sitting very close to you, as if it is a little frightened of what it did.',
    [
      ch('Sit with it.', out('You sit with it until it stops shaking. You tell it that you saw, and that it was wonderful, and that it is still yours. It leans its whole weight against you and falls asleep.', bond(1, 'lead'), done('heated-overdrive-breakthrough'))),
    ]),
  scene('midBattleEvolution', 'heated-mid-battle-evolution', 'The Breakthrough Evolution',
    '"It... it\'s evolving. NOW?" In the middle of your battle, your rival\'s Pokémon changed, there in the light, and became something new. Now your rival is holding it, half laughing, half crying, and looking over at you.',
    [
      ch('"Congratulations."', out('You say it and you mean it. Your rival laughs properly then, and holds the new Pokémon up so you can see. "Look at it! LOOK at it!" You look.', rival({ trust: 1 }), done('heated-mid-battle-evolution'))),
      ch('"Great timing."', out('Your rival snorts. "Right in the middle of losing, yes." Then softer: "It waited for a reason. I think it wanted you to see." You did.', rival({ trust: 1 }), done('heated-mid-battle-evolution'))),
    ]),
];
export const REMOVE: string[] = [];
