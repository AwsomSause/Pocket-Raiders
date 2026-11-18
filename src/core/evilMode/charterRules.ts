// Evil Mode slice 22: the house rules other modules read (Part 28 sections 7.3 and 8.3). Kept apart from charters.ts so
// the odds and the Evening can read them without importing founding. Pure: reads the block and charters.json only.

import chartersRaw from '../../data/evilMode/charters.json';
import type { EvilModeBlock } from './schema';

const H = chartersRaw.houseRules;

/** Galactic (7.3): nobody's asked this holding's local yet, so its mood is unknown and its jobs roll as if Easy. */
export const unasked = (block: Pick<EvilModeBlock, 'charter'>, holdingId: string): boolean => block.charter?.rule === 'ask-first' && !(block.charter.asked ?? []).includes(holdingId);
/** The mood an unasked holding's jobs roll as. */
export const ASK_ROLLS_AS: string = H.ask.rollsAs;

/** Plasma (8.3): the sentence is whole when all four parts are in. */
export const sentenceWhole = (block: Pick<EvilModeBlock, 'charter'>): boolean => {
  const s = block.charter?.sentence;
  return !!s && !!s.who && !!s.wrong && !!s.do && !!s.wont;
};

/** Plasma (8.3): what the holdings' takings are multiplied by: nothing until the sentence is whole, double for the rest of that region, then as usual. */
export function takingsScale(block: Pick<EvilModeBlock, 'charter' | 'here'>): number {
  if (block.charter?.rule !== 'written-sentence') return 1;
  if (!sentenceWhole(block)) return H.plasma.before;
  return block.charter.wholeIn === block.here.region ? H.plasma.after : 1;
}
