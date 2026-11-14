// The Citadark finale (Beta 0.7 E11): "XD001 locks = 9 - ROMs + modifiers". After the last region, a run with three or more Data ROMs
// may sail to Citadark Isle: the Crossing, the Climb, the Admins, a Breather, the Reservoir, Greevil and XD001. With all nine ROMs
// earned in their regions the last fight is not a fight. The finale is optional and comes after the run is already won, so a loss
// anywhere in it ends the finale as `silent` and never undoes the win (decision D1 relaxed in the player's favor).
// Pure rules: this file builds the plan and the cards; `epilogue/director.ts` plays it. Own seeded stream `finale-<phase>`, no gameplay RNG.
// Not built (limited, see docs/updates/beta-0.7/): the Siege Map alliance screen (approaches are worked out from flags and companions),
// the Rainbow Door's Front (its outcome is written, no battle), the Reservoir's tank effects on Shadow tiers, per-lock field conditions.

import type { RunState } from '../state';
import { hashSeed, Rng } from '../rng';
import { companionEpilogue as companionEndLines, companionsOf, flagHeld, hasCompanionId } from './companions';
import { finaleData } from './finaleData';
import { grandArcData, grandArcOf, romsHeld } from './index';
import type { EpilogueState } from './schema';

export const XD001_RAID = 'ss-cipher-xd001';
export const MAX_LOCKS = 9;

export type EvilRankId = 'grunt' | 'specialist' | 'executive' | 'leader';

/** One piece of an epilogue track, stored in the run as plain JSON. */
export type EpiStep =
  | { t: 'card'; id: string }
  | { t: 'battles'; key: string; name: string; n: number | 'banks'; size: number; evil?: EvilRankId; team?: string; types?: string[]; levelBonus?: number; /** Winning this duel takes this ROM from its liaison, late. */ rom?: string; /** Doom: the district taken back by a win. */ district?: string }
  | { t: 'breather' }
  | { t: 'xd001' };

export const epilogueOf = (run: Pick<RunState, 'expansion'>): EpilogueState | null => run.expansion?.epilogue ?? null;

/** Is the finale offered now? On for the run, the Grand Arc running, three or more ROMs, and not played yet. */
export function finaleAvailable(run: Pick<RunState, 'expansion' | 'victory'>): boolean {
  const ep = epilogueOf(run);
  const g = grandArcOf(run);
  return !!run.victory && !!ep?.finale && !!g && romsHeld(g).length >= 3 && ep.finaleResult === undefined;
}

/** Does an approach to the island have an ally this run? (`companion:<id>` or `flag:<key>`.) */
export function approachHeld(run: Pick<RunState, 'story'>, id: string): boolean {
  const a = finaleData.approaches.find((x) => x.id === id);
  return !!a && a.heldBy.some((h) => (h.startsWith('companion:') ? hasCompanionId(run, h.slice(10)) : flagHeld(run, h.slice(5))));
}

/** The approaches nobody holds, in the data's order. */
export const lostApproaches = (run: Pick<RunState, 'story'>): string[] => finaleData.approaches.filter((a) => !approachHeld(run, a.id)).map((a) => a.id);

/** Did a regional Apex Shadow leave in a helicopter this run (it enters the Region of Doom)? */
export const apexTaken = (run: Pick<RunState, 'story'>): boolean => finaleData.apexFlags.some((f) => run.story.flags[f] === 'taken');

/** ROMs earned in their own region (each one opens a lock on XD001). */
export const earnedRoms = (run: Pick<RunState, 'expansion'>): string[] => grandArcOf(run)?.roms ?? [];

/**
 * XD001's locks now: nine, less every ROM earned in its region, less Krane's Purify Chamber (it counts as one ROM) and less the
 * Remnants' balloon, which breaks the Carrier Beat (lock J) if J is still standing. Never below 0. A ROM taken late opens no lock.
 */
export function xd001Locks(run: Pick<RunState, 'expansion' | 'story'>): number {
  const earned = earnedRoms(run);
  let locks = MAX_LOCKS - earned.length;
  if (hasCompanionId(run, 'krane') && locks > 0) locks -= 1;
  if (hasCompanionId(run, 'remnants') && locks > 0 && !earned.includes('J')) locks -= 1;
  return Math.max(0, Math.min(MAX_LOCKS, locks));
}

/** The finale's steps for this run. Deterministic: the only draw is the Climb's wave count, from the `finale-climb` stream. */
export function planFinale(run: Pick<RunState, 'expansion' | 'story' | 'seed'>): EpiStep[] {
  const lost = lostApproaches(run);
  const extraWaves = lost.filter((id) => id !== 'gate').length;
  const climb = new Rng(hashSeed(`${run.seed}::finale-climb`)).int(4, 6) + extraWaves;
  const earned = earnedRoms(run);
  const admins = grandArcData.roms.filter((r) => !earned.includes(r.id)).slice(0, 4);
  const steps: EpiStep[] = [
    { t: 'card', id: 'letter' },
    { t: 'battles', key: 'crossing', name: 'Cipher Patrol', n: lost.includes('gate') ? 3 : 2, size: 4, evil: 'grunt', team: 'cipher' },
    { t: 'battles', key: 'climb', name: 'Cipher Peon', n: climb, size: 4, evil: 'grunt', team: 'cipher' },
  ];
  if (!hasCompanionId(run, 'wes')) steps.push({ t: 'battles', key: 'gonzap', name: 'Gonzap', n: 1, size: 5, evil: 'executive', team: 'snagem' });
  for (const r of admins) steps.push({ t: 'battles', key: `admin-${r.id}`, name: r.liaison, n: 1, size: 5, evil: 'executive', team: 'cipher', rom: r.id });
  steps.push(
    { t: 'battles', key: 'evice', name: 'Evice', n: 1, size: 5, evil: 'leader', team: 'cipher' },
    { t: 'breather' },
    { t: 'battles', key: 'reservoir', name: 'Reservoir Guard', n: 'banks', size: 5, evil: 'specialist', team: 'cipher' },
    { t: 'card', id: 'greevil' },
    { t: 'battles', key: 'greevil', name: 'Grand Master Greevil', n: 1, size: 6, evil: 'leader', team: 'cipher' },
    { t: 'xd001' },
    { t: 'card', id: 'greevil-end' },
    { t: 'card', id: 'machines' },
  );
  if (hasCompanionId(run, 'remnants')) steps.push({ t: 'card', id: 'trio' });
  steps.push({ t: 'card', id: 'finale-end' });
  return steps;
}

/** How many Reservoir banks still need a fight: one for every ROM not held, up to four. */
export const reservoirBattles = (run: Pick<RunState, 'expansion'>): number => {
  const g = grandArcOf(run);
  return Math.min(4, Math.max(0, MAX_LOCKS - (g ? romsHeld(g).length : 0)));
};

export interface CardOption { id: string; label: string }
export interface EpiCard { title: string; lines: string[]; options: CardOption[] }

const noOptions: CardOption[] = [];

/** The card for one story step. `options` is empty for a card that only says Continue. */
export function finaleCard(run: Pick<RunState, 'expansion' | 'story' | 'regionIndex'>, id: string): EpiCard {
  const ep = epilogueOf(run);
  const picks = ep?.picks ?? {};
  const g = grandArcOf(run);
  switch (id) {
    case 'letter':
      return {
        title: 'The Nine Locks',
        lines: [
          'A Delibird lands with an envelope. It is the list Eldes wrote, or, if you never met him, a bottle cap from James with a map scratched on the inside.',
          '"An island with a volcano at its heart. A dome at the top. Under the dome, the only one of the series that was ever finished. They say it cannot be purified. They said that because they needed it to be true. Bring whatever you have."',
          `You hold ${g ? romsHeld(g).length : 0} Data ROMs. The run is already won; this is optional, and losing it never undoes the win.`,
          ...finaleData.approaches.map((a) => (approachHeld(run, a.id) ? `${a.name}: held by an ally.` : `${a.name}: nobody holds it. ${a.ifLost}`)),
        ],
        options: [{ id: 'go', label: 'Go' }, { id: 'never', label: 'Never' }],
      };
    case 'greevil': {
      const nine = (g?.roms.length ?? 0) >= MAX_LOCKS;
      return {
        title: 'Grand Master Greevil',
        lines: [
          'The dome. A desk. A view of the storm. An old man in a good suit, pouring two cups of tea.',
          '"Shall we be sensible? Name a number. Any number. I have never met a principle that didn\'t have one. I shall be so disappointed in you if you turn out to be the first."',
        ],
        options: [{ id: 'number', label: 'Name a number' }, { id: 'refuse', label: 'Refuse' }, ...(nine ? [{ id: 'nine', label: '"Nine."' }] : [])],
      };
    }
    case 'greevil-end': {
      const locks = xd001Locks(run);
      const result = ep?.finaleResult;
      return {
        title: 'XD001',
        lines: result === 'sung'
          ? [locks === 0 && (g?.roms.length ?? 0) >= MAX_LOCKS ? 'The locks fall open one after another, each with the sound of the region it came from. You simply walk up to it.' : 'The last lock opens. Nothing happens for a moment. Then XD001 makes a small, cracked, uncertain sound, and another. By the fourth note it has remembered the tune.', 'The purple goes out of its wings from the tips inward, and what is left is silver.']
          : ['XD001 leaves through the roof, still silent, with the storm. The run stays won; the finale is lost.'],
        options: noOptions,
      };
    }
    case 'machines':
      return {
        title: 'The Snag Machines',
        lines: ['Two Snag Machines are left on the floor of the dome. Krane\'s on a card table, Gonzap\'s in a crate.'],
        options: [{ id: 'destroy', label: 'Destroy both' }, { id: 'keep', label: 'Keep Krane\'s' }, { id: 'wes', label: 'Give Gonzap\'s to Wes' }],
      };
    case 'trio':
      return {
        title: 'The trio',
        lines: ['Three people in a very singed hot-air balloon basket wait to hear what you will tell the news.'],
        options: [{ id: 'tell', label: 'Tell the news who broke the antenna' }, { id: 'quiet', label: 'Say nothing' }],
      };
    case 'finale-end': {
      const result = ep?.finaleResult;
      const lines: string[] = [];
      if (picks['machines'] === 'destroy') lines.push('Both Snag Machines are in the sea.');
      else if (picks['machines'] === 'keep') lines.push('You keep Krane\'s machine, wrapped in tape.');
      else if (picks['machines'] === 'wes') lines.push('Wes looks at the machine for a while, and throws it into the sea himself.');
      if (picks['trio'] === 'tell') lines.push('Three heroes for one day. They hate it. They steal the medals.');
      else if (picks['trio'] === 'quiet') lines.push('"Good," says Meowth. "We got a reputation."');
      lines.push(`The Rainbow Door: ${ep?.rainbow === 'open' ? 'a world where they won stays standing at the edge of the map.' : 'nobody came, and nothing was left behind.'}`);
      lines.push(...companionsOf(run).map((c) => `${c.name} ${c.role}`));
      return { title: result === 'sung' ? 'Resolution: the song' : result === 'sold' ? 'Resolution: sold' : 'Resolution: silent', lines, options: noOptions };
    }
    default:
      return { title: 'Citadark', lines: [], options: noOptions };
  }
}

/** The finale's end card text for a finale that ended early (declined, sold or lost). */
export function finaleEndedEarly(result: 'declined' | 'sold' | 'silent'): EpiCard {
  const lines = {
    declined: ['You tear the map in half and let the wind have it. The run is won, and the island stays a rumor.'],
    sold: ['You name a number. The old man writes it down and smiles. "Always," he says, "there is a number."'],
    silent: ['You fall back from the dome. The storm closes behind you. The run stays won; the song is not sung.'],
  }[result];
  return { title: result === 'declined' ? 'Declined' : result === 'sold' ? 'Sold' : 'The song is not sung', lines, options: noOptions };
}

/** Epilogue lines for the victory screen: how the finale and the Region of Doom ended, and who stood with you. Empty for an ordinary run. */
export function epilogueEndLines(run: Pick<RunState, 'expansion' | 'story'>): string[] {
  const ep = epilogueOf(run);
  const out: string[] = [];
  if (ep?.finaleResult === 'sung') out.push('At Citadark Isle XD001 found its song again, and the sea has been calm since.');
  else if (ep?.finaleResult === 'silent') out.push('XD001 left Citadark Isle in a storm with no song. Somewhere it is still out there.');
  else if (ep?.finaleResult === 'sold') out.push('Somewhere a very old man keeps your number in a drawer.');
  if (ep?.doomResult === 'cleared') out.push('The Margin has no Chairperson now, and its districts are quiet.');
  else if (ep?.doomResult === 'fled') out.push(`You walked out of the Margin with ${ep.marks} of 8 Doom Marks and a long way still to go.`);
  if (ep?.finaleResult || ep?.doomResult) out.push(...companionEndLines(run));
  return out;
}
