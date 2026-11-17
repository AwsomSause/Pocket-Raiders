// Mythical Promises stage 2: Wonders the player uses on purpose. They show as rows in the map's Items menu ("wonder:<id>") and, when they
// need a pick, as a `wonderChoice` decision (the same option screen the Visit uses). Charges and picks live in `promise.track`, in-run only.

import type { Content } from '../contentSchema';
import type { PendingDecision, RunState } from '../state';
import { addItem, consumeItem } from '../items';
import { bouquetHolder, bumpTrack, guestId, itemValue, MELTAN_TO_MERGE, metalItems, promiseState, STANCE_NAME, stageKeyOf, trackOf } from './promises';
import { MYTHICALS } from './promisesData';

export interface WonderAction { id: string; title: string; text: string; problem: string | null }
export type WonderDecision = Extract<PendingDecision, { kind: 'wonderChoice' }>;

const _run_inv = (run: RunState): Record<string, number> => Object.fromEntries(Object.entries(run.inventory).filter(([, n]) => n > 0));
const STANCES = ['atk', 'def', 'spe', 'norm'] as const;
const STANCE_TEXT: Record<string, string> = { atk: '+15% damage dealt', def: '-15% damage taken', spe: 'acts first on turn one', norm: '+5% to everything' };

/** The Items-menu rows for the Guest's Wonder, if it has an action. */
export function wonderActions(_content: Content, run: RunState): WonderAction[] {
  const id = guestId(run);
  if (!id || !run.expansion?.promises) return [];
  const out: WonderAction[] = [];
  if (id === 'deoxys') {
    const ready = trackOf(run, 'restsUsed') > trackOf(run, 'stancesTaken');
    const now = ['none', 'Attack', 'Defense', 'Speed', 'Normal'][trackOf(run, 'stance')] ?? 'none';
    out.push({ id: 'stance', title: 'Deoxys: take a stance', text: `Pick a Forme for the party (now: ${now}). Once a rest.`, problem: ready ? null : 'Deoxys changes stance only after a rest.' });
  }
  if (id === 'phione') {
    out.push({ id: 'current', title: 'Phione: ride the current', text: 'A current carries you past a node (once a region).', problem: trackOf(run, 'currentRegion') === run.regionIndex + 1 ? 'Already used this region.' : run.stage?.kind === 'league' ? 'Not in the Pokémon League.' : null });
  }
  if (id === 'magearna') {
    const holder = bouquetHolder(run);
    out.push({ id: 'bouquet', title: "Magearna: the bouquet", text: holder ? `${holder.speciesId} carries it. Choose another to hand it over.` : 'Choose who carries her bouquet to the last stage.', problem: run.party.length === 0 ? 'No one to carry it.' : null });
  }
  if (id === 'diancie') {
    const have = Object.keys(run.inventory).filter((i) => (run.inventory[i] ?? 0) > 0);
    out.push({ id: 'copy', title: 'Diancie: copy an item', text: 'She copies one item from your bag (once a region).', problem: trackOf(run, 'copyRegion') === run.regionIndex + 1 ? 'Already used this region.' : have.length === 0 ? 'Your bag is empty.' : null });
  }
  if (id === 'meltan') {
    const fed = trackOf(run, 'fedKey') === stageKeyOf(run) + 1;
    out.push({ id: 'feed', title: 'Meltan: feed it', text: `Give it one metal item (${trackOf(run, 'fed')}/${MELTAN_TO_MERGE} eaten). One a stage.`, problem: fed ? 'Meltan is full for this stage.' : metalItems(_content, run).length === 0 ? 'You carry nothing metal.' : null });
  }
  if (id === 'melmetal') {
    const gave = trackOf(run, 'gaveRegion') === run.regionIndex + 1;
    out.push({ id: 'give', title: 'Melmetal: forge, do not hoard', text: 'Give away your most valuable item (once a region).', problem: gave ? 'Already given this region.' : Object.keys(run.inventory).length === 0 ? 'Your bag is empty.' : null });
  }
  return out;
}

/** Starts a Wonder from its row. Returns a decision to show, or null when it already happened (the message says what). */
export function startWonder(_content: Content, run: RunState, wonderId: string): { decision: WonderDecision | null; message: string } {
  const guest = guestId(run);
  if (wonderId === 'stance' && guest === 'deoxys') {
    return {
      decision: { kind: 'wonderChoice', mythicalId: 'deoxys', wonderId, title: 'Deoxys: choose the party\'s stance', options: STANCES.map((s) => ({ label: STANCE_NAME[s]!, description: STANCE_TEXT[s]!, value: s })) },
      message: '',
    };
  }
  if (wonderId === 'current' && guest === 'phione') {
    bumpTrack(run, 'currentRegion', run.regionIndex + 1);
    run.moveMode = 'airship';
    return { decision: null, message: 'A current takes hold of you. Choose where to drift: it carries you past a node.' };
  }
  if (wonderId === 'bouquet' && guest === 'magearna') {
    return { decision: { kind: 'wonderChoice', mythicalId: 'magearna', wonderId, title: 'Who carries the bouquet?', options: run.party.map((m) => ({ label: _content.species.get(m.speciesId)?.name ?? m.speciesId, description: `Lv${m.level}`, value: m.uid })) }, message: '' };
  }
  if (wonderId === 'copy' && guest === 'diancie') {
    const ids = Object.keys(_run_inv(run)).sort();
    return { decision: { kind: 'wonderChoice', mythicalId: 'diancie', wonderId, title: 'Diancie: which item should she copy?', options: ids.slice(0, 12).map((i) => ({ label: _content.items.get(i)?.name ?? i, description: `You have ${run.inventory[i]}.`, value: i })) }, message: '' };
  }
  if (wonderId === 'feed' && guest === 'meltan') {
    const ids = metalItems(_content, run);
    return { decision: { kind: 'wonderChoice', mythicalId: 'meltan', wonderId, title: 'Meltan: what will it eat?', options: ids.slice(0, 12).map((i) => ({ label: _content.items.get(i)?.name ?? i, description: `You have ${run.inventory[i]}.`, value: i })) }, message: '' };
  }
  if (wonderId === 'give' && guest === 'melmetal') {
    const ids = Object.keys(run.inventory).sort((a, b) => itemValue(_content, b) - itemValue(_content, a) || a.localeCompare(b));
    const top = ids[0]!;
    consumeItem(run.inventory, top);
    bumpTrack(run, 'gaveRegion', run.regionIndex + 1);
    return { decision: null, message: `Melmetal forges your ${_content.items.get(top)?.name ?? top} into something new. It is gone. (Forge; do not hoard.)` };
  }
  throw new Error('That Wonder is not available');
}

/** Applies the pick. Never throws on a stale choice. */
export function resolveWonder(_content: Content, run: RunState, decision: WonderDecision, optionIndex: number): string {
  const pick = decision.options[optionIndex] ?? decision.options[0]!;
  if (decision.wonderId === 'stance' && guestId(run) === 'deoxys') {
    bumpTrack(run, 'stance', STANCES.indexOf(pick.value as (typeof STANCES)[number]) + 1);
    bumpTrack(run, 'stancesTaken', trackOf(run, 'restsUsed'));
    return `Deoxys takes the ${pick.label} stance: ${pick.description}.`;
  }
  if (decision.wonderId === 'bouquet' && guestId(run) === 'magearna') {
    bumpTrack(run, 'bouquet', Number(pick.value.replace(/\D/g, '')) || 0);
    return `${pick.label} carries Magearna's bouquet. Keep it in the party to the last stage.`;
  }
  if (decision.wonderId === 'copy' && guestId(run) === 'diancie') {
    addItem(run.inventory, pick.value, 1);
    bumpTrack(run, 'copyRegion', run.regionIndex + 1);
    return `Diancie copies your ${pick.label}: you now have ${run.inventory[pick.value]}.`;
  }
  if (decision.wonderId === 'feed' && guestId(run) === 'meltan') {
    if ((run.inventory[pick.value] ?? 0) <= 0) return 'You no longer have that.';
    consumeItem(run.inventory, pick.value);
    bumpTrack(run, 'fedKey', stageKeyOf(run) + 1);
    const n = bumpTrack(run, 'fed', (x) => x + 1);
    if (n >= MELTAN_TO_MERGE) {
      const p = promiseState(run);
      const def = MYTHICALS.find((m) => m.id === 'melmetal')!;
      run.expansion = { ...run.expansion, promise: { ...p, guest: { id: 'melmetal', forgiven: false }, kept: [...p.kept, 'meltan'] } };
      return `Eight Meltan merge into ${def.title}. ${def.promise}`;
    }
    return `Meltan eats your ${pick.label}: ${n}/${MELTAN_TO_MERGE}, +${n * 2}% Defense.`;
  }
  return '';
}
