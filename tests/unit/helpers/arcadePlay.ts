// A careful player for the Arcade Cabinet (gn.new.14): the next press that a player who never rushes would make. Used by the unit
// tests and by the browser spec (which reads the game's state from the page). No Phaser, no content.
import { mazeDistance, shootTarget, stackBest, type ArcadeState } from '../../../src/core/greenneedle/arcade';

/** The cell to press next: 'a' at a title card, 'take' at a game over, else one step of the game on screen. */
export function arcadePress(s: ArcadeState): string {
  if (s.stage === 'intro') return 'a';
  if (s.stage === 'lost') return 'take';
  const g = s.g;
  if (g.k === 'maze') {
    const ways: [string, number][] = [['l', -1], ['r', 1], ['u', -g.w], ['d', g.w]];
    const open = ways.filter(([, d]) => '.o'.includes(g.cells[g.at + d] ?? '#')).map(([id, d]) => [id, mazeDistance(g.cells, g.w, g.at + d, g.exit, false)] as const).filter(([, far]) => far >= 0);
    return open.sort((a, b) => a[1] - b[1])[0]![0];
  }
  if (g.k === 'stack') {
    const want = stackBest(g);
    return want < g.bar.x ? 'l' : want > g.bar.x ? 'r' : 'd';
  }
  const want = shootTarget(g);
  return want < g.x ? 'l' : want > g.x ? 'r' : 'a';
}
