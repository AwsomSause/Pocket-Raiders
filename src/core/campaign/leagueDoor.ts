// Beta 0.6 B7: the League door. Entering the first Elite Four room registers your party; the League tells you which of
// them it will answer most and lets you swap that one for a boxed Pokémon (the swapped-in one stays unseen). Pure helpers.
import type { Content } from '../contentSchema';
import type { PendingDecision, RunState } from '../state';
import { mostCountered, registeredMons } from './counterPick';

type Door = Extract<PendingDecision, { kind: 'leagueDoor' }>;

/** Registers the party (up to `register` Pokémon, strongest kept) and returns the swap offer, or null when there is nothing to offer. */
export function leagueDoorDecision(content: Content, run: RunState): Door | null {
  const cp = content.balance.leagueCounterPick;
  const registered = [...run.party].sort((a, b) => b.level - a.level || a.uid.localeCompare(b.uid)).slice(0, cp.register).map((m) => m.uid);
  run.expansion = { ...run.expansion, league: { registered, swapped: false } };
  const out = mostCountered(content, run);
  const bench = [...run.box].sort((a, b) => b.level - a.level).slice(0, 5);
  if (cp.swaps <= 0 || !out || bench.length === 0 || !run.party.some((m) => m.uid === out.uid)) return null;
  const name = (m: { speciesId: string }): string => content.species.get(m.speciesId)?.name ?? m.speciesId;
  return {
    kind: 'leagueDoor',
    title: `The League has read your team (${registeredMons(run).length} registered). Swap one before the first battle?`,
    outUid: out.uid,
    swapIns: bench.map((m) => m.uid),
    options: [
      { label: 'Keep my team', description: 'Go in with the Pokémon you registered.' },
      ...bench.map((m) => ({ label: `Swap in ${name(m)} (Lv ${m.level})`, description: `Replaces ${name(out)}, the Pokémon the Elite Four will answer most. The League has not seen ${name(m)}.` })),
    ],
  };
}

/** Option 0 keeps the party; option N swaps the most-answered Pokémon with boxed `swapIns[N-1]`. Never throws on a stale choice. */
export function applyLeagueDoorChoice(content: Content, run: RunState, decision: Door, optionIndex: number): string {
  if (optionIndex <= 0) return 'You go in with the team you registered.';
  const inUid = decision.swapIns[optionIndex - 1];
  const partyAt = run.party.findIndex((m) => m.uid === decision.outUid);
  const boxAt = run.box.findIndex((m) => m.uid === inUid);
  if (partyAt < 0 || boxAt < 0) return 'You go in with the team you registered.';
  const [incoming] = run.box.splice(boxAt, 1);
  const outgoing = run.party[partyAt]!;
  run.party[partyAt] = incoming!;
  run.box.push(outgoing);
  if (run.expansion?.league) run.expansion.league.swapped = true;
  const nm = (id: string): string => content.species.get(id)?.name ?? id;
  return `${nm(incoming!.speciesId)} takes ${nm(outgoing.speciesId)}'s place. The League has not seen it.`;
}
