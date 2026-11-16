// Kice: uncommon items showed up more often than common ones. Every source keeps the order common > uncommon > rare > epic.
import { describe, expect, it } from 'vitest';
import { pickByRarity } from '../../src/core/events';
import { generateDraft } from '../../src/core/rewards';
import { hashSeed, Rng } from '../../src/core/rng';
import { chooseStarter, createRun } from '../../src/core/run';
import { content } from './helpers';

const TIERS = ['common', 'uncommon', 'rare', 'epic'] as const;
const inOrder = (t: Record<string, number>) => {
  expect(t.common, JSON.stringify(t)).toBeGreaterThan(t.uncommon!);
  expect(t.uncommon, JSON.stringify(t)).toBeGreaterThan(t.rare!);
  expect(t.rare, JSON.stringify(t)).toBeGreaterThan(t.epic!);
};

describe('rarity order', () => {
  it('the draft weights are ordered for ordinary, harder and boss rewards', () => {
    for (const w of [content.balance.rarityWeights, content.balance.harderRarityWeights, content.balance.bossRarityWeights, content.balance.events.itemRarityWeights]) {
      inOrder({ common: w.common!, uncommon: w.uncommon!, rare: w.rare!, epic: w.epic! });
    }
  });

  it('real drafts hand out common most often, then uncommon, rare, epic', () => {
    const run = chooseStarter(content, createRun(content, { runId: 'r', seed: 'rarity', archetypeId: 'red' }), 0);
    for (const weights of [content.balance.rarityWeights, content.balance.harderRarityWeights, content.balance.bossRarityWeights]) {
      const t: Record<string, number> = { common: 0, uncommon: 0, rare: 0, epic: 0 };
      for (let i = 0; i < 1500; i++) for (const id of generateDraft(content, run, new Rng(hashSeed(`d${i}`)), weights)) t[content.rewards.get(id)!.rarity]!++;
      inOrder(t);
    }
  });

  // Weighed by how often a player can meet the gift (Kice, 2026-11-16: count gifts by how often they appear): a stop drawn on the map counts
  // by its event rarity weight (balance.events.rarityWeights, common = 1); a room only opens from another event's choice, so it counts
  // its best opener's weight split over that opener's choices; a room only the code opens (no opener in the data) counts as a rare stop.
  // A stop gated on a story flag counts no more than the choice that sets the flag, and a game-event stop only for that event's share of the calendar.
  // Fixed authored items are one-offs and not counted.
  it('event one-of gift lists follow the same order, weighed by how often their stop comes up', () => {
    const t: Record<string, number> = { common: 0, uncommon: 0, rare: 0, epic: 0 };
    const rarityOf = (id: string) => content.catalog.get(id)?.rarity ?? content.rewards.get(id)?.rarity ?? 'common';
    const draw = content.balance.events.rarityWeights;
    const drawn = (e: { rarity: string }) => (draw[e.rarity as keyof typeof draw] ?? 0) / draw.common;
    const openers = new Map<string, string[]>();
    for (const e of content.events.values()) {
      JSON.stringify(e, (_key, v) => {
        if (v && typeof v === 'object' && (v.kind === 'addEvent' || v.kind === 'laterEvent')) openers.set(v.eventId, [...(openers.get(v.eventId) ?? []), e.id]);
        if (v && typeof v === 'object' && v.kind === 'addEventFrom') for (const id of v.ids as string[]) openers.set(id, [...(openers.get(id) ?? []), e.id]);
        return v;
      });
    }
    // Who sets each story flag (a plain `flag` effect), for stops gated on one.
    const setters = new Map<string, string[]>();
    for (const e of content.events.values()) {
      JSON.stringify(e, (_key, v) => {
        if (v && typeof v === 'object' && v.kind === 'flag' && typeof v.key === 'string' && v.atLeast === undefined && v.atMost === undefined && (v.amount ?? 1) > 0) setters.set(v.key, [...(setters.get(v.key) ?? []), e.id]);
        return v;
      });
    }
    // A stop drawn only while one game event runs (`gameEvent`) is there for that event's share of its schedule kind.
    const gameShare = (g: string): number => {
      const kind = content.gameEvents.get(g)?.schedule.kind;
      return 1 / Math.max(1, [...content.gameEvents.values()].filter((x) => x.schedule.kind === kind).length);
    };
    const weight = new Map<string, number>();
    const weightOf = (id: string, depth = 0): number => {
      if (weight.has(id)) return weight.get(id)!;
      const e = content.events.get(id);
      if (!e || e.disabled) return 0;
      weight.set(id, 0); // a loop through itself adds nothing
      const share = e.gameEvent ? gameShare(e.gameEvent) : 1;
      if (!e.room) {
        // Gated on a story flag another event sets (a callback, a payout after a challenge): no more often than that setter's choice.
        const keys = e.requires.filter((r) => r.kind === 'flag' && (r.atLeast ?? 0) >= 1).map((r) => (r as { key: string }).key);
        const via = keys.flatMap((k) => (setters.get(k) ?? []).filter((o) => o !== id).map((o) => weightOf(o, depth + 1) / Math.max(1, content.events.get(o)!.choices.length)));
        const w = drawn(e) * share * (keys.length && via.length ? Math.min(1, Math.max(...via) / Math.max(drawn(e) * share, 1e-9)) : 1);
        weight.set(id, w);
        return w;
      }
      if (depth > 8) return drawn({ rarity: 'rare' });
      const from = (openers.get(id) ?? []).filter((o) => o !== id).map((o) => weightOf(o, depth + 1) / Math.max(1, content.events.get(o)!.choices.length));
      const w = (from.length ? Math.max(...from) : drawn({ rarity: 'rare' })) * share;
      weight.set(id, w);
      return w;
    };
    const rng = new Rng(hashSeed('events'));
    const count = (part: unknown, w: number) =>
      JSON.stringify(part ?? null, (_key, v) => {
        if (v && typeof v === 'object' && v.kind === 'itemFrom') for (let i = 0; i < 40; i++) t[rarityOf(pickByRarity(content, v.ids, rng))]! += w / 40;
        return v;
      });
    // One visit gives one choice's outcome: each choice counts 1/choices; a chance roll splits success and failure;
    // a choice's branches and its plain success are one outcome between them (counted evenly, as their conditions are not known here).
    for (const event of content.events.values()) {
      const w = weightOf(event.id);
      const choices = [...event.choices, ...event.remembers.flatMap((r) => r.addChoices)];
      for (const ch of choices) {
        const cw = w / Math.max(1, choices.length);
        const win = ch.chance ?? (ch.failure ? 0.5 : 1);
        const ways = ch.branches.length + 1;
        count(ch.success, (cw * win) / ways);
        for (const b of ch.branches) count(b.effects, (cw * win) / ways);
        if (ch.success.battle) count(ch.success.battle, (cw * win) * (1 - 1 / ways));
        count(ch.failure, cw * (1 - win));
      }
    }
    for (const tier of TIERS) expect(t[tier]).toBeGreaterThan(0);
    inOrder(t);
  });
});
