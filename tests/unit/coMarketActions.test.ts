// Catalog Overhaul markets: the `market` effect's actions (core/market.ts): normal, boundary and failure cases.
import { describe, expect, it } from 'vitest';
import { applyEffect } from '../../src/core/events';
import { itemValue, pawned, rented } from '../../src/core/market';
import { hashSeed, Rng } from '../../src/core/rng';
import { chooseStarter, createRun } from '../../src/core/run';
import type { EventEffect } from '../../src/core/contentSchema';
import type { RunState } from '../../src/core/state';
import { content } from './helpers';

const fresh = (): RunState => {
  const run = chooseStarter(content, createRun(content, { runId: 'mk', seed: 'market-actions', archetypeId: 'red' }), 0);
  run.inventory = {};
  run.money = 1000;
  return run;
};
const mk = (run: RunState, e: Record<string, unknown>, seed = 's'): string => applyEffect(content, run, { kind: 'market', ...e } as EventEffect, new Rng(hashSeed(seed)));
const flag = (run: RunState, key: string) => Number(run.story.flags[`ev:${key}`] ?? 0);

describe('pawn and redeem', () => {
  it('pawns the most valuable item at the stated share and buys it back at the markup', () => {
    const run = fresh();
    run.inventory = { 'oran-berry': 1, 'hyper-potion': 1 };
    const paid = Math.round(itemValue(content, 'hyper-potion') * 0.5);
    mk(run, { action: 'pawn', key: 'sharks', factor: 0.5 });
    expect(run.money).toBe(1000 + paid);
    expect(pawned(run, 'sharks')?.item).toBe('hyper-potion');
    expect(flag(run, 'pawn-sharks')).toBe(1);
    expect(flag(run, 'pawn-sharks-berry')).toBe(0);
    mk(run, { action: 'redeem', key: 'sharks', factor: 1.5 });
    expect(run.inventory['hyper-potion']).toBe(1);
    expect(run.money).toBe(1000 + paid - Math.round(paid * 1.5));
    expect(pawned(run, 'sharks')).toBeNull();
  });
  it('a pawned Berry is remembered for the Berry buyback scene', () => {
    const run = fresh();
    run.inventory = { 'oran-berry': 1 };
    mk(run, { action: 'pawn', key: 'sharks', factor: 0.5 });
    expect(flag(run, 'pawn-sharks-berry')).toBe(1);
  });
  it('without the money the ticket stays good (failure case: nothing is silently lost)', () => {
    const run = fresh();
    run.inventory = { 'hyper-potion': 1 };
    mk(run, { action: 'pawn', key: 'sharks', factor: 0.5 });
    run.money = 0;
    expect(mk(run, { action: 'redeem', key: 'sharks', factor: 1.5 })).toMatch(/You need/);
    expect(pawned(run, 'sharks')?.item).toBe('hyper-potion');
    expect(flag(run, 'pawn-sharks')).toBe(1);
  });
  it('nothing to pawn (boundary)', () => {
    const run = fresh();
    expect(mk(run, { action: 'pawn', key: 'sharks' })).toBe('You have nothing to pawn');
    expect(run.money).toBe(1000);
  });
});

describe('the bank', () => {
  it('deposits half and pays it back with the stated interest', () => {
    const run = fresh();
    mk(run, { action: 'deposit', key: 'bank', factor: 0.5 });
    expect(run.money).toBe(500);
    expect(flag(run, 'deposit-bank')).toBe(1);
    mk(run, { action: 'withdraw', key: 'bank', factor: 1.1 });
    expect(run.money).toBe(1050);
    expect(flag(run, 'deposit-bank')).toBe(0);
  });
  it('a robbed bank pays half, never less (loss never exceeds the stake)', () => {
    const run = fresh();
    mk(run, { action: 'deposit', key: 'bank', factor: 0.5 });
    mk(run, { action: 'withdraw', key: 'bank', factor: 0.5 });
    expect(run.money).toBe(750);
  });
  it('withdrawing with nothing deposited does nothing (failure case)', () => {
    const run = fresh();
    expect(mk(run, { action: 'withdraw', key: 'bank', factor: 1.25 })).toBe('');
    expect(run.money).toBe(1000);
  });
});

describe('rentals and item payments', () => {
  it('a rental comes back as the item, or as its value when used (capped at your money)', () => {
    const run = fresh();
    mk(run, { action: 'rent', key: 'rental', only: ['focus-sash'] });
    expect(rented(run, 'rental')).toBe('focus-sash');
    expect(run.inventory['focus-sash']).toBe(1);
    mk(run, { action: 'returnRent', key: 'rental' });
    expect(run.inventory['focus-sash'] ?? 0).toBe(0);
    expect(run.money).toBe(1000);
    mk(run, { action: 'rent', key: 'rental', only: ['focus-sash'] });
    run.money = 10;
    mk(run, { action: 'returnRent', key: 'rental', used: true });
    expect(run.money).toBe(Math.max(0, 10 - itemValue(content, 'focus-sash')));
    expect(rented(run, 'rental')).toBeNull();
  });
  it('pays items in list order, exactly the amount asked', () => {
    const run = fresh();
    run.inventory = { 'potion': 1, 'poke-ball': 3 };
    mk(run, { action: 'payItem', only: ['potion', 'poke-ball'], amount: 2 });
    expect(run.inventory['potion'] ?? 0).toBe(0);
    expect(run.inventory['poke-ball']).toBe(2);
  });
});

describe('the Apothecary\'s brew', () => {
  it('is the same for the same seed (deterministic) and stays within limits', () => {
    const a = fresh();
    const b = fresh();
    expect(mk(a, { action: 'brew' }, 'brew-1')).toBe(mk(b, { action: 'brew' }, 'brew-1'));
    for (const v of Object.values(a.party[0]!.vitamins)) expect(v).toBeGreaterThanOrEqual(0);
  });
});
