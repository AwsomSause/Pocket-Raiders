// Greenneedle gn.60, The Pokémon That Followed You Home (doc GREENNEEDLE_REWORKED_PLACED_13.md lines 109–195).
// The story has no node: the scenery, the camp and the shops carry it (core/greenneedle/followed.ts, hooks in run.ts). Only the reveal is an
// event: a room that opens beside a rest once the player is ready (four regions, a bonded team, or a team on its last legs).
// Build: npm run co:build -- greenneedle-60   then   npm run co:gn
import { ch, out, type Json } from '../dsl.ts';
import { gn, gev, say, type Placement } from './_gn.ts';

export { CATEGORY } from './_gn.ts';

const reveal = (): Json => gev('gn-60-reveal', 'Something Walks Into the Light', { room: true, tags: ['Recovery', 'Story'], tint: '#3d2f24', effect: 'none' }, say(
  'A rest. The fire. The team.',
  'Something walks into the light.',
  'It doesn\'t hurry. It goes past your lead, which moves over. It sits down in the gap between two of them, as if the gap had been kept.',
  'It looks at the fire. Then at you.',
), [
  ch('"There you are."', out('It blinks, slowly. The way you do at someone you\'ve been waiting a long time to be seen by.\n\nIt\'s been with you since the first road. Now it\'s here, and it stays.', gn('followedJoin'))),
  ch('"...How long?"', out('It looks back the way you came. A very long way. Every region, every fire, every night you didn\'t know.\n\nThen it looks at you again, and the answer is: all of it.', gn('followedJoin'))),
  ch('(Hold out a hand.)', out('It crosses the last of the distance and puts its chin in your palm. It is warm, and heavier than it looks.\n\nIt was never going to be anywhere else.', gn('followedJoin'))),
]);

export const EVENTS: Json[] = [reveal()];
export const REMOVE: string[] = [];
export const PLACEMENT: Record<string, Placement> = {};
export const CHAINS: Json[] = [];
