// A stronger test bot for the mass sims (tools/mass-sim.ts). It wraps the shared autoplay `step` and overrides
// the choices that made the old bot lose early: it keeps its best move set, takes useful rewards on the lead,
// heals sooner, rotates in healthy teammates and keeps catching.
import type { Content } from '../../src/core/contentSchema.ts';
import type { RunState } from '../../src/core/state.ts';
import { currentEnemy } from '../../src/core/state.ts';
import { maxHp } from '../../src/core/pokemon.ts';
import { chooseReward, resolveDecision, takeTurn, type TurnResult } from '../../src/core/run.ts';
import { forcedMoveIndex } from '../../src/core/battle/engine.ts';
import { typeEffectiveness } from '../../src/core/battle/damage.ts';
import type { step as Step } from '../../tests/unit/autoplay.ts';

const RARITY = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

const movePower = (content: Content, id: string): number => {
  const m = content.moves.get(id);
  return m ? (m.power ?? 0) * ((m.accuracy ?? 100) / 100) : 0;
};

/** Reward value for the bot: growth first, then held/gear, then supplies. */
function rewardValue(content: Content, id: string): number {
  const r = content.rewards.get(id);
  if (!r) return 0;
  const rar = Math.max(0, RARITY.indexOf(r.rarity));
  const kind = (r.effect as { kind?: string }).kind;
  const base = kind === 'levelUp' ? 50 : kind === 'vitamin' ? 30 : kind === 'attribute' ? 25 : kind === 'catalog' ? 20 : kind === 'addItem' ? (r.category === 'healing' ? 22 : 12) : kind === 'money' ? 8 : 5;
  return base + rar * 4;
}

export function botStep(content: Content, run: RunState, step: typeof Step): { run: RunState; turn: TurnResult | null } {
  if (run.phase === 'decision') {
    const d = run.pending[0]!;
    if (d.kind === 'learnMove') {
      const mon = run.party.find((p) => p.uid === d.uid);
      if (mon) {
        const newP = movePower(content, d.moveId);
        if (mon.moves.length < 4) return { run: resolveDecision(content, run, { kind: 'forgetMove', moveIndex: mon.moves.length }).run, turn: null };
        let worst = 0;
        mon.moves.forEach((m, i) => { if (movePower(content, m.id) < movePower(content, mon.moves[worst]!.id)) worst = i; });
        // Keep at least two attacking moves; replace the weakest only when the new move is clearly better.
        if (newP > movePower(content, mon.moves[worst]!.id) * 1.15) return { run: resolveDecision(content, run, { kind: 'forgetMove', moveIndex: worst }).run, turn: null };
        return { run: resolveDecision(content, run, { kind: 'skipMove' }).run, turn: null };
      }
    }
  }
  if (run.phase === 'reward') {
    const order = (run.draft ?? []).map((id, i) => ({ i, v: rewardValue(content, id) })).sort((a, b) => b.v - a.v);
    // Target the lead first, then the highest level (most likely to be used).
    const targets = run.party.map((p, i) => ({ i, l: p.level })).sort((a, b) => (a.i === 0 ? -1 : b.i === 0 ? 1 : b.l - a.l));
    for (const o of order) for (const t of targets) { try { return { run: chooseReward(content, run, o.i, t.i).run, turn: null }; } catch { /* next */ } }
  }
  if (run.phase === 'battle' && !run.battle!.needsSwitch) {
    const b = run.battle!;
    const mon = run.party[b.activeIndex]!;
    const share = mon.hp / maxHp(content, mon);
    if (forcedMoveIndex(b, run.party) === null && share < 0.45) {
      // Low and no potion: swap to the healthiest teammate that is not nearly dead.
      const potion = ['hyper-potion', 'super-potion', 'potion'].some((id) => (run.inventory[id] ?? 0) > 0);
      if (!potion) {
        let bi = -1; let bs = 0.6;
        run.party.forEach((p, i) => { const s = p.hp / maxHp(content, p); if (i !== b.activeIndex && s > bs) { bs = s; bi = i; } });
        if (bi >= 0 && !b.doubles) { try { const t = takeTurn(content, run, { kind: 'switch', partyIndex: bi }); return { run: t.run, turn: t }; } catch { /* fall through */ } }
      }
    }
  }
  return step(content, run, true);
}

export { typeEffectiveness, currentEnemy };
