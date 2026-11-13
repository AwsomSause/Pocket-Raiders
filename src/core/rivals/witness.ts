// Witness the Rest (Beta 0.6 R11): the end-of-run cards. Simulated from THIS run's rival records only (no Archive,
// nothing carried to another run). Always ends with a Champion card and a final card. Pure and deterministic.

import { FEELING_KEYS, type RivalOverhaulState } from './overhaulSchema';
import { PRESENCE } from './presence';

export interface WitnessCard {
  kind: 'rival' | 'friend' | 'champion' | 'final';
  title: string;
  body: string;
}

export interface WitnessInput {
  playerName: string;
  /** The run reached and beat the final Champion. */
  won: boolean;
  rivals: { id: string; name: string; rec: RivalOverhaulState }[];
}

const strongest = (rec: RivalOverhaulState): string => {
  const [k] = FEELING_KEYS.map((f) => [f, rec.feelings[f]] as const).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]!;
  return k;
};

const ENDINGS: Record<string, string> = {
  friendship: 'kept the road open and still writes.',
  respect: 'trains harder every day, aiming for the day you meet again.',
  trust: 'tells people that you were the one who never lied.',
  rivalry: 'is already planning the next match.',
  resentment: 'carries the losses quietly, and is working on putting them down.',
  admiration: 'tells every new trainer about the time you beat them.',
};

export function rivalCard(r: { name: string; rec: RivalOverhaulState }): WitnessCard {
  const lead = r.rec.lead;
  const how = lead > 0 ? 'came out ahead of you' : lead < 0 ? 'fell behind you' : 'finished level with you';
  return { kind: r.rec.role === 'friend' ? 'friend' : 'rival', title: r.name, body: `${r.name} ${how} and ${ENDINGS[strongest(r.rec)]}` };
}

/** Cards in order: main rival, Friend, then the Champion card and the final card. Capped at the data's maximum. */
export function witnessCards(i: WitnessInput): WitnessCard[] {
  const rivals = [...i.rivals].sort((a, b) => (a.rec.role === b.rec.role ? a.id.localeCompare(b.id) : a.rec.role === 'main' ? -1 : 1));
  const cards = rivals.map(rivalCard);
  const main = rivals.find((r) => r.rec.role === 'main');
  cards.push({
    kind: 'champion',
    title: 'The Champion',
    body: i.won ? `${i.playerName} stands as Champion. ${main ? `${main.name} watched from the crowd.` : 'The crowd does not stop cheering.'}` : `The title is still open. ${main ? `${main.name} is still training for it.` : 'Someone will take it.'}`,
  });
  cards.push({ kind: 'final', title: 'And the road goes on', body: i.won ? 'Every end is the first day of the next run.' : 'Every run ends. The road does not.' });
  const keep = PRESENCE.witness.maxCards;
  // Keep the last two (Champion, final) always; trim rival cards when over the cap.
  return cards.length <= keep ? cards : [...cards.slice(0, keep - 2), ...cards.slice(-2)];
}
