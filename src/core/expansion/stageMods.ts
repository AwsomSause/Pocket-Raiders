// Attribute changes that last one stage (Celadon's Bad Luck Charm). The change goes on the run's attribute modifiers at once
// and is taken off again when the next stage starts. State lives in run.expansion.stageMods; no random stream is used.

import type { AttributeKey } from '../contentSchema';
import type { RunState } from '../state';

const here = (run: RunState) => ({ region: run.regionIndex, stage: run.stage?.index ?? -1 });

/** Applies an attribute change for the rest of this stage. */
export function addStageAttribute(run: RunState, key: AttributeKey, amount: number): void {
  run.attributeModifiers[key] = (run.attributeModifiers[key] ?? 0) + amount;
  run.expansion = { ...run.expansion, stageMods: [...(run.expansion?.stageMods ?? []), { key, amount, ...here(run) }] };
}

/** On a new stage: takes off every change that was made on an earlier stage. */
export function expireStageMods(run: RunState): void {
  const mods = run.expansion?.stageMods;
  if (!mods?.length) return;
  const now = here(run);
  const kept = [];
  for (const m of mods) {
    if (m.region === now.region && m.stage === now.stage) { kept.push(m); continue; }
    run.attributeModifiers[m.key as AttributeKey] = (run.attributeModifiers[m.key as AttributeKey] ?? 0) - m.amount;
  }
  run.expansion = { ...run.expansion, stageMods: kept };
}
