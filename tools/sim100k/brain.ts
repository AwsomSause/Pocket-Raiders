// The survey bot's battle brain ("vgc" bot). Nothing here is machine-learned: it is a rule-based player that
//  - reads the game's own damage estimate for every move on both sides (types, STAB, abilities, items, weather, stat stages),
//  - looks one exchange ahead ("who faints first if we both keep hitting?") and plays the line that wins that race,
//  - switches to the teammate that wins the race after taking a hit on the way in,
//  - sets up or spreads status only when the foe cannot punish it, heals when a heal out-paces the foe's damage,
//  - lets the game's Auto-Battle brain decide Mega / Z-Move / Dynamax / Tera / Rally and all double battles,
//  - picks which moves to keep, which species to keep and which held items to take from Pokémon Showdown usage stats
//    (tools/sim100k/showdown-usage.json, built by showdown-usage.mjs from https://www.smogon.com/stats/).
import type { Content, Move } from '../../src/core/contentSchema';
import { chooseAutoAction } from '../../src/core/battle/autoBattle';
import { statStageMultiplier } from '../../src/core/battle/damage';
import { estimateDamage, forcedMoveIndex, itemProblem, moveValue, switchProblem, type EnemyBrain, type PlayerAction } from '../../src/core/battle/engine';
import { moveBlockReason } from '../../src/core/battle/moveBlock';
import { calcStats } from '../../src/core/pokemon';
import { battleContent } from '../../src/core/rules';
import { currentEnemy, freshStages, type PokemonInstance, type RunState } from '../../src/core/state';
import usageJson from './showdown-usage.json';

interface Usage { items: Record<string, number>; species: Record<string, { u: number; m: Record<string, number>; i: Record<string, number> }> }
const usage = usageJson as unknown as Usage;
const norm = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]/g, '');

/** The species itself plus everything it can evolve into. */
const lineCache = new Map<string, string[]>();
function line(content: Content, id: string): string[] {
  let out = lineCache.get(id);
  if (!out) {
    out = [id]; lineCache.set(id, out);
    for (let i = 0; i < out.length && out.length < 12; i++) for (const e of content.species.get(out[i]!)?.evolutions ?? []) if (!out.includes(e.to)) out.push(e.to);
  }
  return out;
}
/** 0..1: how strong competitive players rate this species (or what it grows into); base stats when Showdown has no data. */
export function speciesPower(content: Content, id: string): number {
  const known = Math.max(0, ...line(content, id).map((s) => usage.species[norm(s)]?.u ?? 0));
  if (known > 0) return known;
  const bs = content.species.get(id)?.baseStats;
  return bs ? Math.min(0.6, (bs.hp + bs.atk + bs.def + bs.spa + bs.spd + bs.spe) / 1200) : 0.2;
}
/** 0..1: share of competitive sets of this species (or its evolutions) that run the move. */
export const moveShare = (content: Content, speciesId: string, moveId: string): number => Math.max(0, ...line(content, speciesId).map((s) => usage.species[norm(s)]?.m[norm(moveId)] ?? 0));
/** How common a held item is across all Showdown sets (0..~0.12), and on this species (0..1). */
export const itemShare = (itemId: string): number => usage.items[norm(itemId)] ?? 0;
export const itemShareFor = (content: Content, speciesId: string, itemId: string): number => Math.max(0, ...line(content, speciesId).map((s) => usage.species[norm(s)]?.i[norm(itemId)] ?? 0));

function moveWorth(content: Content, mon: PokemonInstance, moveId: string): number {
  const mv = content.moves.get(moveId); if (!mv) return 0;
  const types = content.species.get(mon.speciesId)?.types ?? [];
  const raw = mv.category === 'status' ? 8 : Math.min(40, ((mv.power ?? 0) * ((mv.accuracy ?? 100) / 100) * (types.includes(mv.type) ? 1.5 : 1)) / 4);
  return 100 * moveShare(content, mon.speciesId, moveId) + raw;
}
/** New move offered: keep the four that competitive sets use most (always at least two attacks). */
export function learnChoice(content: Content, run: RunState): { kind: 'forgetMove'; moveIndex: number } | { kind: 'skipMove' } | null {
  const d = run.pending[0] as { kind: string; uid?: string; moveId?: string } | undefined;
  if (!d || d.kind !== 'learnMove' || !d.moveId) return null;
  const mon = run.party.find((p) => p.uid === d.uid); if (!mon) return null;
  if (mon.moves.length < 4) return { kind: 'forgetMove', moveIndex: mon.moves.length };
  const isAtk = (id: string) => content.moves.get(id)?.category !== 'status';
  const attacks = mon.moves.filter((m) => isAtk(m.id)).length;
  const fresh = moveWorth(content, mon, d.moveId);
  let worst = -1;
  mon.moves.forEach((m, i) => {
    if (isAtk(m.id) && attacks <= 2 && !isAtk(d.moveId!)) return;
    if (worst < 0 || moveWorth(content, mon, m.id) < moveWorth(content, mon, mon.moves[worst]!.id)) worst = i;
  });
  if (worst >= 0 && fresh > moveWorth(content, mon, mon.moves[worst]!.id) * 1.15 + 1) return { kind: 'forgetMove', moveIndex: worst };
  return { kind: 'skipMove' };
}

export interface BrainState { lastSwitch: Map<string, number>; statusTried: Set<string>; heals: number; /** Battle turn on which the foe's trainer last used a healing item. */ foeHealTurn: number }
export const freshBrain = (): BrainState => ({ lastSwitch: new Map(), statusTried: new Set(), heals: 0, foeHealTurn: -9 });

interface Race { dmg: number; threat: number; myTurns: number; foeTurns: number; first: boolean; wins: boolean; score: number }

function speed(content: Content, mon: PokemonInstance, stage: number): number {
  return calcStats(content, mon).spe * statStageMultiplier(stage) * (mon.status?.id === 'par' ? 0.5 : 1);
}

/** Who faints first if both sides keep using their best attack? `entry`: the Pokémon first takes one hit while switching in. */
function race(content: Content, run: RunState, cand: PokemonInstance, active: boolean, entry: boolean): Race {
  const b = run.battle!; const foe = currentEnemy(b);
  const mine: EnemyBrain = { content, ai: 1, target: foe, stages: active ? b.playerStages : freshStages(), battle: b, party: run.party, side: 'player', raw: true };
  const theirs: EnemyBrain = { content, ai: 1, target: cand, stages: b.enemyStages, battle: b, party: run.party, side: 'enemy', raw: true };
  const dmg = Math.max(0, ...cand.moves.map((m, i) => (m.pp > 0 && (!active || moveBlockReason(content, b, cand, i) === null) ? estimateDamage(mine, cand, m.id) * ((content.moves.get(m.id)?.accuracy ?? 100) / 100) : 0)));
  const threat = Math.max(0, ...foe.moves.filter((m) => m.pp > 0).map((m) => estimateDamage(theirs, foe, m.id)));
  const hp = cand.hp - (entry ? threat : 0);
  const myTurns = dmg > 0 ? Math.ceil(foe.hp / dmg) : 99;
  const foeTurns = hp <= 0 ? 0 : threat > 0 ? Math.ceil(hp / threat) : 99;
  let first = speed(content, cand, active ? b.playerStages.spe ?? 0 : 0) >= speed(content, foe, b.enemyStages.spe ?? 0);
  if ((b as { field?: { trickRoom?: number } }).field?.trickRoom) first = !first;
  const wins = hp > 0 && (first ? myTurns <= foeTurns : myTurns < foeTurns);
  return { dmg, threat, myTurns, foeTurns, first, wins, score: Math.min(foeTurns, 12) - Math.min(myTurns, 12) + (first ? 0.5 : 0) };
}

/** True when the active Pokémon's best attack would knock the foe out this turn (the catcher throws a ball first). */
export function wouldKo(content: Content, run: RunState): boolean {
  try { const bc = battleContent(content, run.rules, run.regionOrder[run.regionIndex]); return race(bc, run, run.party[run.battle!.activeIndex]!, true, false).myTurns <= 1; } catch { return false; }
}

/** The bot's command for this battle turn and a short label for the tally, or null to leave it to the older bot. */
export function battleBrain(base: Content, run: RunState, st: BrainState): { action: PlayerAction; tag: string } | null {
  const b = run.battle; if (!b || b.outcome) return null;
  if ((b as { doubles?: unknown }).doubles) { const p = chooseAutoAction(base, run); return p ? { action: p.action, tag: 'doubles (game auto-battle)' } : null; }
  const content = battleContent(base, run.rules, run.regionOrder[run.regionIndex]);
  const foe = currentEnemy(b); const key = foe.uid;
  const canSwitch = (i: number) => i !== b.activeIndex && switchProblem({ content, battle: b, party: run.party }, i) === null;
  if (b.needsSwitch) {
    let best = -1; let bs = -Infinity;
    run.party.forEach((p, i) => { if (p.hp <= 0 || !canSwitch(i)) return; const r = race(content, run, p, false, false); const s = r.score + (r.wins ? 5 : 0); if (s > bs) { bs = s; best = i; } });
    return best >= 0 ? { action: { kind: 'switch', partyIndex: best }, tag: 'send-in by matchup' } : null;
  }
  if (forcedMoveIndex(b, run.party) !== null) return null;
  const mon = run.party[b.activeIndex]!;
  const max = calcStats(content, mon).hp; const hpShare = mon.hp / max;
  const mine: EnemyBrain = { content, ai: 1, target: foe, stages: b.playerStages, battle: b, party: run.party, side: 'player', raw: true };
  const opts = mon.moves.map((slot, i) => ({ i, slot, mv: content.moves.get(slot.id) })).filter((x): x is { i: number; slot: typeof x.slot; mv: Move } => Boolean(x.mv) && x.slot.pp > 0 && moveBlockReason(content, b, mon, x.i) === null)
    .map((x) => { const dmg = x.mv.category === 'status' ? 0 : estimateDamage(mine, mon, x.mv.id); const acc = (x.mv.accuracy ?? 100) / 100; return { ...x, dmg, acc, exp: dmg * acc }; });
  if (opts.length === 0) return null;
  const me = race(content, run, mon, true, false);
  const dying = me.threat >= mon.hp;
  const attacks = opts.filter((o) => o.dmg > 0 && !(o.mv.effects.selfFaint && hpShare > 0.25));
  const withGimmick = (index: number, tag: string): { action: PlayerAction; tag: string } => {
    // Mega / Z-Move / Dynamax / Tera / Rally: the game's own Auto-Battle brain decides when (it knows the rules for each).
    try {
      const auto = chooseAutoAction(base, run)?.action;
      if (auto && auto.kind === 'move' && (auto.transform || auto.rally)) {
        const idx = auto.transform?.kind === 'zmove' ? auto.index : index;
        return { action: { kind: 'move', index: idx, ...(auto.transform ? { transform: auto.transform } : {}), ...(auto.rally ? { rally: true } : {}) }, tag: auto.transform ? `${tag} + ${auto.transform.kind}` : tag };
      }
    } catch { /* plain move */ }
    return { action: { kind: 'move', index, }, tag };
  };
  // The foe's trainer is healing every time it gets low (bosses carry many potions): use the free turns to boost, so one hit finishes it.
  if (b.turn - st.foeHealTurn <= 1 && b.turn >= st.foeHealTurn && !dying) {
    const boost = opts.find((o) => o.mv.category === 'status' && (o.mv.effects.statChanges ?? []).some((ch) => ch.target === 'self' && ch.stages > 0 && ['atk', 'spa'].includes(ch.stat) && (b.playerStages[ch.stat] ?? 0) < 4));
    if (boost) return { action: { kind: 'move', index: boost.i }, tag: 'set-up while the foe heals' };
  }
  const strongest = () => attacks.reduce((a, o) => (o.exp > a.exp ? o : a), attacks[0]!);

  // 1. A knock-out is on the table: take the surest one (a priority one when the foe would get there first).
  const kos = attacks.filter((o) => o.dmg >= foe.hp);
  if (kos.length) {
    const pick = kos.reduce((a, o) => { const pa = !me.first && dying && (a.mv.priority ?? 0) > 0 ? 1 : 0; const po = !me.first && dying && (o.mv.priority ?? 0) > 0 ? 1 : 0; return po > pa || (po === pa && (o.acc > a.acc || (o.acc === a.acc && o.dmg > a.dmg))) ? o : a; });
    st.heals = 0;
    return withGimmick(pick.i, 'knock-out move');
  }
  const inv = run.inventory;
  const usable = (id: string, target: number) => (inv[id] ?? 0) > 0 && itemProblem({ content, battle: b, party: run.party, inventory: inv, noBattleItems: false } as Parameters<typeof itemProblem>[0], id, target) === null;
  const heals = Object.keys(inv).map((id) => content.items.get(id)).filter((it): it is NonNullable<typeof it> => Boolean(it) && (it!.effect.kind === 'healHp' || it!.effect.kind === 'fullRestore')).map((it) => ({ id: it.id, amount: it.effect.kind === 'healHp' ? Math.min(it.effect.amount, max - mon.hp) : max - mon.hp })).filter((h) => usable(h.id, b.activeIndex));
  const selfHeal = opts.find((o) => o.mv.effects.heal || o.mv.effects.rest);

  // 2. Losing the damage race: leave for a teammate that wins it, else heal if that out-paces the foe, else hit as hard as possible.
  if (!me.wins) {
    const last = st.lastSwitch.get(key) ?? -9;
    if (!b.eventRule?.noSwitch && b.turn - last >= 3) {
      let best = -1; let br: Race | null = null;
      run.party.forEach((p, i) => { if (!canSwitch(i)) return; const r = race(content, run, p, false, true); if (!br || (r.wins ? 5 : 0) + r.score > (br.wins ? 5 : 0) + br.score) { br = r; best = i; } });
      const got = br as Race | null;
      if (best >= 0 && got && (got.wins || (dying && got.score > me.score + 1.5 && got.foeTurns >= 2))) { st.lastSwitch.set(key, b.turn); st.heals = 0; return { action: { kind: 'switch', partyIndex: best }, tag: 'switch to a winning matchup' }; }
    }
    if (hpShare < 0.55 && st.heals < 2) {
      const good = heals.filter((h) => h.amount > me.threat * 1.25).sort((a, c) => a.amount - c.amount)[0];
      if (good) { st.heals++; return { action: { kind: 'item', itemId: good.id, targetIndex: b.activeIndex }, tag: 'heal item that out-paces the foe' }; }
      if (selfHeal && max * 0.5 > me.threat * 1.25 && !dying) { st.heals++; return { action: { kind: 'move', index: selfHeal.i }, tag: 'recovery move' }; }
    }
    st.heals = 0;
    if (attacks.length) {
      const prio = dying && !me.first ? attacks.filter((o) => (o.mv.priority ?? 0) > 0).sort((a, c) => c.exp - a.exp)[0] : undefined;
      return withGimmick((prio ?? strongest()).i, 'best damage (losing race)');
    }
    return { action: { kind: 'move', index: opts[0]!.i }, tag: 'no attack available' };
  }
  st.heals = 0;

  // 3. Winning with room to spare: bring a fallen teammate back, heal up, set up, or cripple the foe before attacking.
  if (me.foeTurns >= 3) {
    if (b.kind === 'trainer') {
      const down = run.party.findIndex((p) => p.hp <= 0);
      const rev = ['max-revive', 'revive'].find((id) => down >= 0 && usable(id, down));
      if (rev && (run.party.filter((p) => p.hp <= 0).length >= 2 || (inv[rev] ?? 0) > 1)) return { action: { kind: 'item', itemId: rev, targetIndex: down }, tag: 'revive while safe' };
    }
    if (selfHeal && hpShare < 0.5) return { action: { kind: 'move', index: selfHeal.i }, tag: 'recovery move' };
    if (me.myTurns >= 2) {
      const strat: EnemyBrain = { ...mine, raw: false };
      const setup = opts.filter((o) => o.mv.category === 'status' && (o.mv.effects.statChanges ?? []).some((ch) => ch.target === 'self' && ch.stages > 0 && ['atk', 'spa', 'spe'].includes(ch.stat) && (b.playerStages[ch.stat] ?? 0) < 2) && moveValue(strat, mon, o.mv.id) > 0)
        .sort((a, c) => moveValue(strat, mon, c.mv.id) - moveValue(strat, mon, a.mv.id))[0];
      if (setup && b.kind !== 'wild') return { action: { kind: 'move', index: setup.i }, tag: 'set-up move' };
      if (me.myTurns >= 3 && !foe.status && !st.statusTried.has(key)) {
        const status = opts.filter((o) => o.mv.category === 'status' && (o.mv.effects.status || o.mv.effects.confuse) && moveValue(strat, mon, o.mv.id) > 0).sort((a, c) => moveValue(strat, mon, c.mv.id) - moveValue(strat, mon, a.mv.id))[0];
        if (status) { st.statusTried.add(key); return { action: { kind: 'move', index: status.i }, tag: 'status move' }; }
      }
    }
  }
  if (attacks.length) return withGimmick(strongest().i, 'best damage');
  return null;
}
