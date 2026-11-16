// Greenneedle, gn.new.10 The Mirror Lake (doc GREENNEEDLE_PLACED_1.md lines 382–411).
// Build: npm run co:build -- greenneedle-new-10   then   npm run co:gn
// A lake so still the player's reflection is a half second late. Needs a fight lost, or all but one Pokémon lost, this run
// (core/greenneedle/mirror.ts remembers that team). Fight them: that team, those moves. Skip stones: one reflection watches,
// and is a half second late at water nodes twice more this run. The doc's "Reflection Shard" is cut with the Shards (Nov 13):
// the win gives a Reflection Glass instead (itemCatalog/greenneedle-new-10.json).
import { ch, fight, item, out, trainer, type Json } from '../dsl.ts';
import { gev, gn, is, laterStage, moment, not, rm, say, scene, setTo, stampStage, when, type Placement } from './_gn.ts';

export { CATEGORY } from './_gn.ts';

const lake = (o: Json = {}): Json => ({ tint: '#5f7f96', tags: ['Pokémon', 'Mystery'], types: ['water'], effect: 'none', ...o });
const gnc = (test: string): Json => ({ kind: 'gn', test });

/** The late reflection's count (0, 1, 2): the second `when` runs first, so one visit moves it by one. */
const late = (): Json[] => [when('mirror-late', { min: 1, max: 1 }, [setTo('mirror-late', 2)]), when('mirror-late', { min: 0, max: 0 }, [setTo('mirror-late', 1)]), stampStage('mirror-stage')];

const EVENTS_10: Json[] = [
  gev('gn-new-10-lake', 'The Mirror Lake', lake({ stop: 'event', rarity: 'rare', requires: [gnc('mirrorReady'), not('mirror-seen')] }), say(
    '*A lake so still it looks painted. You lean over the edge, and your reflection leans over to meet you. It is a half second late.*',
    'You wave. The reflection waves back, after you have stopped. Then it does not stop waving.',
    '*The water shivers. Shapes climb out of it, dripping nothing: the team from the fight you would rather forget.*',
  ), [
    ch('Fight them.', fight('Your own team stands on the shore, exactly as it stood that day. They have the same moves. They know how you play.', trainer('The Reflections', {
      cls: 'ace-trainer', size: 1, lv: 0, friendly: true, rule: { gn: 'mirror' },
      win: [scene('gn-new-10-bow')], lose: [scene('gn-new-10-under')],
    }), setTo('mirror-seen', 1), setTo('mirror-fought', 1))),
    ch('Skip stones instead.', out('You pick up a flat stone and send it skipping. The ripples run out and break them up, one by one, until only one is left. It sits on the bank, and watches you.', setTo('mirror-seen', 1), setTo('mirror-watcher', 1), stampStage('mirror-stage'))),
    ch('Leave.', out('You step back from the edge. Nothing follows you. Behind you, the water settles, and goes on being painted.', setTo('mirror-seen', 1))),
  ]),
  rm('gn-new-10-bow', 'The Mirror Lake: The Bow', lake(), say(
    'The last reflection falls. They look at you for a moment, and at your team. Nobody says anything.',
    'Then they bow, all of them, together, the way you wish you had that day.',
    '*They turn and walk back into the water, and the water closes over them without a ripple.*',
  ), [ch('Watch them go.', out('Where they went in, something is floating on the surface, bright as a coin. You lift it out. It is a small pane of glass, still cold, and it shows your team as it was. Nothing is taken.', item('reflection-glass'), moment('Beat my own team at the Mirror Lake.', 55)))]),
  rm('gn-new-10-under', 'The Mirror Lake: Back In', lake(), say(
    'They stand over your team for a long moment, and do not press it. They look almost sorry.',
    'Then they turn, and walk back into the lake, the way they came. They go in anyway.',
    '*Nothing is taken. Your team gets up, a little dazed, to a lake gone perfectly still again.*',
  ), [ch('Watch them go.', out('The water closes over the last of them. Your own face looks up from it, a half second late, and for once you cannot tell which of you looks more tired.'))]),
  gev('gn-new-10-late', 'The Mirror Lake: A Half Second Late', lake({ stop: 'event', rarity: 'uncommon', tags: ['Story'], callback: true, requires: [is('mirror-watcher'), is('mirror-late', 0, 1), laterStage('mirror-stage')] }), say(
    '*Another still water. You lean over it, and look at your own reflection.*',
    'It is half a second late. It has the same face, and it is watching you with the same patience as the one on the bank.',
  ), [
    ch('Wave.', out('You wave. The reflection waves, after you have stopped. Then, very slightly, it nods. You wave goodbye. Its hand comes up a half second later.', ...late())),
    ch('Walk on.', out('You walk on. Behind you, the water holds its breath. You do not look back, and you know it is still looking.', ...late())),
  ]),
];

export const EVENTS: Json[] = EVENTS_10;
export const REMOVE: string[] = [];

export const PLACEMENT: Record<string, Placement> = {
  'gn-new-10-lake': {
    gn: 'gn.new.10', shape: 'Single', earliest: 'A5', home: 8, window: [6, 10], sits: 'side-branch', attaches: 'instead', tags: ['Miniature Episode'], needs: ['water'],
    level: 'The reflections are the player\'s own team as it was in the lost (or nearly lost) battle', often: 'run', badge: 'own',
    note: 'Badge: a ripple. A side branch at step 8 that needs water; the doc\'s fallback is step 13, optional (the placer widens the window). Needs a fight lost, or all but one Pokémon lost, this run: run.ts finishBattle keeps the latest such team. Once per run. Win: a Reflection Glass (the doc\'s "Reflection Shard" is cut with the Shards).',
  },
  'gn-new-10-late': { gn: 'gn.new.10', shape: 'Single', earliest: 'A5', home: 8, window: [2, 16], sits: 'optional', attaches: 'after', tags: ['Miniature Episode'], needs: ['water'], level: 'None', often: 'run', badge: 'own', note: 'Afterstory: if a reflection watched from the bank, twice more this run at water nodes one is a half second late.' },
};

export const CHAINS: Json[] = [];
