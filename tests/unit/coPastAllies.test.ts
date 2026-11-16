// Catalog Overhaul batch 5, rows D+E: same-run PAST ALLIES (core/co/pastAllies.ts), the rival hooks (Lead gate, rival honest trade)
// and the four drama moments plugged into the rival overhaul (core/drama/rivalHooks.ts).
import { describe, expect, it } from 'vitest';
import { EventEffectSchema, EventConditionSchema } from '../../src/core/contentSchema';
import { applyEffect, conditionMet, eligibleEvents } from '../../src/core/events';
import { fillPastAlliesText, frames, lostItem, pastAllyAce, pastReplay, pastTeam, pedestalItem, ranchSource, rivalEchoes, tagPartnerOf } from '../../src/core/co/pastAllies';
import { rivalGives } from '../../src/core/co/tradeCard';
import { grudgeHeld, recordRivalMoment, scoutedMove, scoutedSpecies } from '../../src/core/drama/rivalHooks';
import { pickContextLine } from '../../src/core/rivals/bank';
import { registerRival } from '../../src/core/rivals/overhaul';
import { hashSeed, Rng } from '../../src/core/rng';
import { chooseStarter, createRun } from '../../src/core/run';
import type { BattleReplay } from '../../src/core/memories/schema';
import { content } from './helpers';

const run = () => chooseStarter(content, createRun(content, { runId: 'pa', seed: 'pa', archetypeId: 'red' }), 0);
const rng = () => new Rng(hashSeed('pa-test'));
const replay = (o: Partial<BattleReplay>): BattleReplay => ({ id: `r${Math.random()}`, kind: 'gym', title: 'Gym battle against Brock', outcome: 'win', region: 0, stage: 1, foe: { name: 'Brock', team: ['geodude', 'onix'] }, team: ['bulbasaur'], turns: 5, lines: [], ...o });
const cond = (o: object) => EventConditionSchema.parse(o);
const eff = (o: object) => EventEffectSchema.parse(o);

describe('Past Allies frames (this run only)', () => {
  it('picks won, fell, earliest, best, rival and second from this run\'s big battles', () => {
    const r = run();
    expect(frames(r)).toEqual([]);
    expect(conditionMet(content, r, cond({ kind: 'pastAlly', has: 'won' }))).toBe(false);
    r.story.replays = [
      replay({ id: 'a', team: ['bulbasaur'] }),
      replay({ id: 'b', kind: 'rival', title: 'Rival battle against Blue', foe: { name: 'Blue', team: ['pidgey', 'squirtle'] }, team: ['ivysaur', 'pidgey'] }),
      replay({ id: 'c', kind: 'elite', outcome: 'lose', title: 'Elite Four battle against Lorelei', team: ['ivysaur', 'pidgeotto'] }),
      replay({ id: 'd', kind: 'ghost', team: ['gastly'] }),
    ];
    expect(frames(r).map((f) => f.id)).toEqual(['a', 'b', 'c']);
    expect(pastReplay(r, 'won')?.id).toBe('b');
    expect(pastReplay(r, 'fell')?.id).toBe('c');
    expect(pastReplay(r, 'earliest')?.id).toBe('a');
    expect(pastReplay(r, 'second')?.id).toBe('b');
    expect(pastReplay(r, 'best')?.id).toBe('a');
    expect(pastTeam(r, 'rival')).toEqual(['pidgey', 'squirtle']);
    expect(pastAllyAce(r)).toBe('squirtle');
    expect(conditionMet(content, r, cond({ kind: 'pastAlly', has: 'second', atLeast: 2 }))).toBe(true);
  });
  it('opens the Hall only from this run: champion-defense after a won big battle, retired-team after a lost one', () => {
    const r = { ...run(), regionIndex: 3 };
    const ids = () => eligibleEvents(content, r).map((e) => e.id);
    expect(ids()).not.toContain('champion-defense');
    expect(ids()).not.toContain('retired-team');
    r.story.replays = [replay({ id: 'w' })];
    expect(ids()).toContain('champion-defense');
    expect(ids()).not.toContain('retired-team');
    r.story.replays.push(replay({ id: 'l', outcome: 'lose' }));
    expect(ids()).toContain('retired-team');
  });
  it('fills its tokens, and plain words when the record is missing', () => {
    const r = run();
    expect(fillPastAlliesText(content, r, 'At {pa:fell-where}: {pa:fell-team}.')).toBe('At somewhere back down the road: a team you cannot quite place.');
    r.story.replays = [replay({ outcome: 'lose', team: ['bulbasaur', 'pidgey'] })];
    expect(fillPastAlliesText(content, r, '{pa:fell} / {pa:fell-team}')).toBe('Gym battle against Brock / Bulbasaur and Pidgey');
    expect(fillPastAlliesText(content, r, '{pa:frames}')).toMatch(/stage 2: Gym battle against Brock\. Bulbasaur and Pidgey\. Lost, and kept going\./);
  });
});

describe('Past Allies effects', () => {
  it('the Lost-and-Found Desk returns the item a random loss took, once', () => {
    const r = run();
    r.inventory = { 'potion': 1 };
    applyEffect(content, r, eff({ kind: 'loseItem' }), rng());
    expect(lostItem(r)).toBe('potion');
    expect(r.inventory['potion']).toBeUndefined();
    applyEffect(content, r, eff({ kind: 'pastAlly', action: 'returnItem' }), rng());
    expect(r.inventory['potion']).toBe(1);
    expect(lostItem(r)).toBeNull();
    // A named payment is not a loss.
    applyEffect(content, r, eff({ kind: 'loseItem', id: 'potion' }), rng());
    expect(lostItem(r)).toBeNull();
  });
  it('the Legacy Pedestal keeps one item and the one who took it pays it back', () => {
    const r = run();
    r.inventory = { 'potion': 1, 'poke-ball': 3 };
    expect(applyEffect(content, r, eff({ kind: 'pastAlly', action: 'pedestal', item: 'super-potion' }), rng())).toBe('');
    applyEffect(content, r, eff({ kind: 'pastAlly', action: 'pedestal', item: 'potion' }), rng());
    expect(pedestalItem(r)).toBe('potion');
    expect(r.inventory['potion']).toBeUndefined();
    // One at a time: a second item is refused while the first waits.
    expect(applyEffect(content, r, eff({ kind: 'pastAlly', action: 'pedestal' }), rng())).toBe('');
    applyEffect(content, r, eff({ kind: 'pastAlly', action: 'pedestalThanks' }), rng());
    expect(r.inventory['potion']).toBe(1);
    expect(pedestalItem(r)).toBeNull();
  });
  it('the Ranch Egg comes from the boxed Pokémon with the highest Bond and knows its most-used move', () => {
    const r = run();
    expect(ranchSource(r)).toBeNull();
    const boxed = { ...r.party[0]!, uid: 'boxed1', friendship: 200, moveCounts: { tackle: 9, growl: 2 } };
    r.box.push(boxed);
    expect(ranchSource(r)).toMatchObject({ speciesId: boxed.speciesId, from: 'boxed', move: 'tackle' });
    const before = r.eggs.length;
    applyEffect(content, r, eff({ kind: 'pastAlly', action: 'egg' }), rng());
    const egg = r.eggs[before]!;
    expect(egg.eggMoves).toContain('tackle');
    expect(egg.unit).toBe('stage');
    expect(egg.left).toBeGreaterThanOrEqual(3);
  });
  it('a named tag partner (Arlen\'s Garchomp) is remembered with its boost and battles owed', () => {
    const r = run();
    applyEffect(content, r, eff({ kind: 'tagPartner', battles: 3, species: 'garchomp', boost: 'spe' }), rng());
    expect(tagPartnerOf(r)).toEqual({ species: 'garchomp', boost: 'spe' });
    expect(r.itemCounters?.['tag-partner']).toBe(3);
    expect(EventEffectSchema.safeParse({ kind: 'tagPartner', battles: 4 }).success).toBe(false);
  });
});

describe('Rival hooks', () => {
  it('rival echoes turn the said bank lines back into words', () => {
    const r = run();
    const rec = registerRival(r, { id: 'blue', role: 'main', personality: 'underdog', style: 'blitz', arc: 'prodigy-learns-humility' });
    expect(rivalEchoes(content, r)).toEqual([]);
    const said = [pickContextLine(rec, 's', 'won', 0), pickContextLine(rec, 's', 'lost', 1), pickContextLine(rec, 's', 'gym', 2)];
    expect(rivalEchoes(content, r).map((e) => e.text)).toEqual(said);
    expect(conditionMet(content, r, cond({ kind: 'pastAlly', has: 'echoes', atLeast: 3 }))).toBe(true);
    expect(fillPastAlliesText(content, r, '{pa:echo1}')).toBe(said[2]);
  });
  it('the Lead gate reads the main rival\'s Lead', () => {
    const r = run();
    r.story.rivals.push({ id: 'blue', name: 'Blue', state: 'active', encounters: 2 } as never);
    const rec = registerRival(r, { id: 'blue', role: 'main', personality: 'underdog', style: 'blitz', arc: 'prodigy-learns-humility' });
    const ahead = cond({ kind: 'rivalQuest', lead: { atLeast: 2 } });
    expect(conditionMet(content, r, ahead)).toBe(false);
    rec.lead = 2;
    expect(conditionMet(content, r, ahead)).toBe(true);
    expect(conditionMet(content, r, cond({ kind: 'rivalQuest', lead: { atMost: -1 } }))).toBe(false);
  });
  it('the old friend offers a raised non-ace from your last battle, honestly', () => {
    const r = run();
    expect(rivalGives(content, r)).toBeNull();
    r.story.rivals.push({ id: 'blue', name: 'Blue', state: 'active', encounters: 2, memory: { lastBattle: { eventId: 'x', result: 'win', hpLeftShare: 0, turns: 4, team: ['pidgey', 'rattata', 'squirtle'], moves: [[], ['tackle', 'quick-attack'], []] } } } as never);
    const g = rivalGives(content, r)!;
    expect(g.species).toBe('rattata');
    expect(g.moves).toEqual(['tackle', 'quick-attack']);
    expect(g.ot).toBe('Blue');
    expect(rivalGives(content, r)).toEqual(g);
  });
});

describe('Rival drama moments read the overhaul', () => {
  it('grudge, scouted move, scouted species and the watcher\'s ledger', () => {
    const r = run();
    const rec = registerRival(r, { id: 'blue', role: 'main', personality: 'underdog', style: 'blitz', arc: 'prodigy-learns-humility' });
    rec.feelings.rivalry = 0;
    expect(grudgeHeld(rec)).toBe(false);
    rec.marks.push('first-blood');
    expect(grudgeHeld(rec)).toBe(true);
    const lead = r.party[0]!;
    expect(scoutedMove(content, rec, lead)).toBeNull();
    rec.ledger = { moves: [lead.moves[0]!.id], items: [], abilities: [], species: [lead.speciesId], turns: 1, switches: 0 };
    expect(scoutedMove(content, rec, lead)).toBe(content.moves.get(lead.moves[0]!.id)!.name);
    expect(scoutedSpecies(rec, lead.speciesId)).toBe(true);
    const w = registerRival(r, { id: 'green', role: 'friend', personality: 'protector', style: 'blitz', arc: 'rivals-become-friends' });
    const respect = w.feelings.respect;
    recordRivalMoment(r, 'rivalInterruption', undefined, { id: 'green' } as never);
    expect(w.ledger?.species).toContain(lead.speciesId);
    expect(w.feelings.respect).toBe(Math.min(10, respect + 1));
  });
});

describe('batch 5 events', () => {
  const ids = ['mr-rival-echoes', 'face-rival-honors', 'old-rival-old-friend', 'cheer-rival-match', 'cameo-ally-assist', 'ng-plus-old-friends', 'champion-defense', 'retired-team', 'rivals-friend', 'archive-gauntlet-entry', 'lost-and-found-desk', 'companion-recruit', 'rk-anniversary-archive', 'rk-coin-vault', 'rk-hall-of-records', 'rk-legacy-pedestal', 'rk-memory-lane', 'cameo-veteran-garchomp', 'cameo-veteran-lucario', 'legacy-ranch', 'rival-views', 'ev-rivals-defeat', 'ev-rivals-victory', 'rival-berry-boss', 'rival-gloat', 'rival-grudge-spot'];
  it('are live, never read a past run, and every rival battle in them is a story fight', () => {
    for (const id of ids) {
      const e = content.events.get(id);
      expect(e, id).toBeDefined();
      expect(e!.disabled ?? false, id).toBe(false);
      const json = JSON.stringify(e);
      expect(json, id).not.toMatch(/"(championGhost|retiredGhost|pastTeams|legacyEgg|keepsake|recoverKeepsake|pastGauntlet)"/);
      expect(json, id).not.toMatch(/"ghost":true|"retired":true/);
    }
    for (const id of ['face-rival-shopping', 'kieran-rivalry', 'ghost-trainer-reunion']) expect(content.events.get(id)?.disabled, id).toBe(true);
  });
});
