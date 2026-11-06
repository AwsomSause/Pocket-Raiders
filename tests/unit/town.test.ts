// Pocket Town (W7): data checks, every action, limits, determinism, run-start boon, Shrine cleanse, saves.

import { describe, expect, it } from 'vitest';
import { CAMP, campAction, campOf, grantRelic } from '../../src/core/camp';
import { createProfile } from '../../src/core/profile';
import { chooseStarter, createRun } from '../../src/core/run';
import { applyStartGrants, startGrants } from '../../src/core/legacy';
import { ProfileSchema, type Profile } from '../../src/core/state';
import { recordTownRun as recordRun, applyReward, basementCode, collections, dummyHit, getTownAction, jukeboxTracks, ledger, localDay, mailToday, optionsOf, recordTownRun, spendTownStart, statueTarget, TOWN, townAction, townOf, townProblem, townStartGrants, todaysQuests, townStats, townWeather, visitBuilding, KINDS } from '../../src/core/town';
import { Rng, hashSeed } from '../../src/core/rng';
import * as townApi from '../../src/core/town';
const require_town = () => townApi;
import { content } from './helpers';

const DAY = new Date(2026, 10, 3, 12, 0, 0); // a Tuesday, noon
const NIGHT = new Date(2026, 10, 3, 22, 0, 0);
function rich(): Profile {
  const p = structuredClone(createProfile(content, 'town'));
  p.bankCredits = 5000;
  p.researchPoints = 100;
  p.stats.runsStarted = 30;
  return p;
}
const act = (p: Profile, id: string, args = {}, now = DAY) => townAction(content, p, id, args, now);
const ok = (p: Profile, id: string, args = {}, now = DAY) => { const r = act(p, id, args, now); expect(r.ok, `${id}: ${r.message}`).toBe(true); return r; };

describe('town data', () => {
  it('has the planned buildings, unique ids, and every ledger row W7 owns', () => {
    const ids = TOWN.buildings.flatMap((b) => b.actions.map((a) => a.id));
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(TOWN.buildings.map((b) => b.id)).size).toBe(TOWN.buildings.length);
    const rows = new Set(TOWN.buildings.flatMap((b) => b.actions.flatMap((a) => a.rows)));
    const want = [...Array.from({ length: 51 }, (_, i) => `I${240 + i}`).filter((r) => !['I264', 'I265'].includes(r)), 'F29', 'F96', 'F97', 'F98', 'F99', 'F102', 'F105', 'F106', 'F110', 'F112', 'F114', 'F120', 'F121', 'F127', 'F130', 'I214', 'I42'];
    expect(want.filter((r) => !rows.has(r))).toEqual([]);
  });
  it('every item, species, prompt and kind named in the data is real', () => {
    const itemOk = (id: string) => content.items.has(id) || content.catalog.has(id);
    const checkReward = (r: { items?: Record<string, number> } | undefined) => { for (const id of Object.keys(r?.items ?? {})) expect(itemOk(id), id).toBe(true); };
    for (const b of TOWN.buildings) for (const a of b.actions) {
      expect(KINDS).toContain(a.kind);
      for (const g of Object.values(a.rewards ?? {})) checkReward(g);
      for (const o of a.options) checkReward(o.reward);
      for (const g of a.goods) checkReward(g.reward);
      for (const c of a.crops) checkReward(c.yield);
      if (a.prompt) expect(['throw-ring', 'shout-tap', 'brace-hold', 'echo-rhythm', 'aim-drag']).toContain(a.prompt);
    }
    for (const s of [...TOWN.pools.cries, ...TOWN.pools.memory]) expect(content.species.has(s), s).toBe(true);
    for (const r of TOWN.recipes) { checkReward(r.reward); expect(itemOk(r.a) && itemOk(r.b)).toBe(true); }
    for (const l of TOWN.letters) checkReward(l.gift);
    for (const g of TOWN.dailyGifts) checkReward(g);
    for (const r of Object.values(TOWN.badgePerks)) checkReward(r);
    checkReward(TOWN.mush);
    for (const q of Object.values(TOWN.quizzes).flat()) expect(q.right).toBeLessThan(q.a.length);
    for (const s of TOWN.seasons) checkReward(s.reward);
  });
});

describe('town actions', () => {
  it('every plain grade action pays at every grade', () => {
    for (const a of TOWN.buildings.flatMap((b) => b.actions).filter((x) => x.kind === 'grade' && !x.dynamic)) {
      for (const g of ['miss', 'ok', 'good', 'perfect'] as const) ok(rich(), a.id, { grade: g }, a.id === 'night-firefly' ? NIGHT : DAY);
    }
  });
  it('a grade action with a limit cannot be repeated until the limit resets', () => {
    let p = rich();
    p = ok(p, 'bakery-bake', { grade: 'perfect' }).profile;
    expect(townProblem(content, p, getTownAction('bakery-bake')!, DAY)).toContain('Done');
    expect(act(p, 'bakery-bake', { grade: 'perfect' }).ok).toBe(false);
    const started = spendTownStart(p);
    expect(townProblem(content, started, getTownAction('bakery-bake')!, DAY)).toBeNull();
  });
  it('rewards wait as the next run boon and leave the profile otherwise', () => {
    const p = ok(rich(), 'radio-tune', { choice: 'trainer-tips' }).profile;
    expect(townOf(p).boon.money).toBe(300);
    expect(townOf(p).boon.notes.length).toBe(1);
    expect(townStartGrants(content, p).money).toBe(300);
  });
  it('the same state and action roll the same result (deterministic)', () => {
    const a = ok(rich(), 'mirror-fit', { grade: 'perfect' }).profile;
    const b = ok(rich(), 'mirror-fit', { grade: 'perfect' }).profile;
    expect(townOf(a).sets.outfits).toEqual(townOf(b).sets.outfits);
  });
  it('quiz: right answers pay, the day limit holds', () => {
    let p = rich();
    const a = getTownAction('library-quiz')!;
    for (let i = 0; i < 3; i++) {
      const q = TOWN.quizzes.library!.find((x) => x.q === require_q(p, a))!;
      const r = ok(p, 'library-quiz', { answer: q.right });
      expect(r.message).toContain('Correct');
      p = r.profile;
    }
    expect(act(p, 'library-quiz', { answer: 0 }).ok).toBe(false);
  });
  it('garden: plant, water, grow on run start, harvest', () => {
    let p = ok(rich(), 'garden-tend', { choice: '0:plant:oran' }).profile;
    expect(act(p, 'garden-tend', { choice: '0:harvest' }).ok).toBe(false);
    p = spendTownStart(p);
    p = ok(p, 'garden-tend', { choice: '0:water' }).profile;
    p = spendTownStart(p);
    p = ok(p, 'garden-tend', { choice: '0:harvest' }).profile;
    expect(townOf(p).boon.items['oran-berry']).toBe(3);
  });
  it('buy needs credits, owned things cannot be bought twice, equip needs ownership', () => {
    const poor = { ...rich(), bankCredits: 0 };
    expect(act(poor, 'furniture-buy', { choice: 'dc-rug' }).ok).toBe(false);
    let p = ok(rich(), 'furniture-buy', { choice: 'dc-rug' }).profile;
    expect(act(p, 'furniture-buy', { choice: 'dc-rug' }).ok).toBe(false);
    p = ok(p, 'furniture-place', { choice: 'dc-rug|0.5|0.5' }).profile;
    expect(townOf(p).placed['dc-rug']).toEqual([0.5, 0.5]);
    expect(act(p, 'photo-equip', { choice: 'bd-night' }).ok).toBe(false);
    p = ok(p, 'photo-equip', { choice: 'bd-meadow' }).profile;
    expect(townOf(p).equipped.backdrop).toBe('bd-meadow');
  });
  it('gacha: free daily pull, pity guarantees a rare or better, duplicates become Research', () => {
    let p = rich();
    const first = ok(p, 'capsule-pull');
    p = first.profile;
    expect(p.bankCredits).toBe(5000);
    for (let i = 0; i < 40; i++) p = ok(p, 'capsule-pull').profile;
    expect(p.bankCredits).toBe(5000 - 40 * TOWN.gacha.cost.credits!);
    const got = Object.values(townOf(p).sets).flat().length;
    expect(got).toBeGreaterThan(5);
    const poor = { ...rich(), bankCredits: 3 };
    expect(act(ok(poor, 'capsule-pull').profile, 'capsule-pull').ok).toBe(false);
  });
  it('basement and statue puzzles open only on the right answer, then change', () => {
    let p = rich();
    const code = basementCode(townOf(p));
    expect(act(p, 'basement-code', { choice: [...code].reverse().join(',') }).message).toMatch(/cries|door/);
    const open = ok(p, 'basement-code', { choice: code.join(',') });
    p = open.profile;
    expect(basementCode(townOf(p))).not.toEqual(code);
    const target = statueTarget(townOf(p));
    for (let i = 0; i < 4; i++) for (let k = 0; k < target[i]!; k++) p = ok(p, 'statue-turn', { choice: String(i) }).profile;
    expect(townOf(p).puzzle.vault?.[0]).toBe(1);
  });
  it('daily gift keeps a streak and the season prop pays once a day', () => {
    let p = ok(rich(), 'hall-gift').profile;
    expect(act(p, 'hall-gift').ok).toBe(false);
    p = ok(p, 'hall-gift', {}, new Date(2026, 10, 4, 9)).profile;
    expect(townOf(p).counts.giftStreak).toBe(2);
    expect(ok(rich(), 'seasonal-tap').ok).toBe(true);
  });
  it('fireflies only at night; the quest board pays after the task is done', () => {
    const p = rich();
    expect(act(p, 'night-firefly', { grade: 'good' }).ok).toBe(false);
    expect(ok(p, 'night-firefly', { grade: 'good' }, NIGHT).ok).toBe(true);
    const quest = todaysQuests(townOf(p), localDay(DAY))[0]!;
    expect(act(p, 'hall-quests', { choice: quest.id }).ok).toBe(false);
  });
  it('wishing tree keeps three tags that become run journal notes, never rolls', () => {
    let p = rich();
    for (const o of ['wish-sea', 'wish-rival', 'wish-friend']) p = ok(p, 'wishing-tag', { choice: o }).profile;
    expect(act(p, 'wishing-tag', { choice: 'wish-storm' }).ok).toBe(false);
    expect(townStartGrants(content, p).notes.length).toBe(3);
    expect(townOf(spendTownStart(p)).wishes).toEqual([]);
  });
  it('trophy polish, practice dummy, stats, ledger, jukebox and collections read the profile', () => {
    const p = rich();
    const hit = dummyHit(content, 'pikachu', 20, 'thunder-shock');
    expect(hit && hit.max >= hit.min && hit.min > 0).toBe(true);
    expect(townStats(content, p).runs).toBe(0);
    expect(ledger(p, 'all', 'newest')).toEqual([]);
    expect(jukeboxTracks(p).some((t) => t.open)).toBe(true);
    expect(collections(p).length).toBeGreaterThan(4);
    expect(townWeather(p)).toBe('clear');
    expect(mailToday(content, p, DAY).length).toBeGreaterThanOrEqual(3);
  });
});

describe('town upgrades', () => {
  const withRun = (): Profile => {
    const p = rich();
    p.runHistory.unshift({ runId: 'r1', endedAt: '2026-11-01', seed: 's1', archetypeId: 'red', campaignId: 'full', victory: false, regionsCleared: 1, regions: 3, badges: 2, encounters: 20, defeatedBy: { speciesId: 'pidgey', level: 12, trainer: null }, party: [{ speciesId: 'pikachu', level: 20, shiny: false }, { speciesId: 'eevee', level: 18, shiny: false }], bankCredits: 0, researchPoints: 0, achievements: [], moments: ['A big moment.'], journal: [], epitaph: null, legacy: [] });
    return p;
  };
  it('the dojo spar adds real Move Research uses to the Pokémon\'s strongest move', () => {
    const p = ok(withRun(), 'dojo-spar', { grade: 'perfect', choice: 'pikachu' }).profile;
    expect(Object.values(p.moveUses ?? {}).reduce((a, b) => a + b, 0)).toBe(8);
  });
  it('mini battles use the real damage rules and repeat for the same seed', () => {
    const p = withRun();
    const a = ok(p, 'replica-duel', { choice: 'r1' }).message;
    const b = ok(p, 'replica-duel', { choice: 'r1' }).message;
    expect(a).toBe(b);
    expect(a).toMatch(/Practice win|ghost wins/);
    expect(ok(p, 'replica-mirror', { choice: 'pikachu' }).message).toContain('ghost');
    expect(ok(p, 'arcade-duel', { choice: 'pikachu' }).message).toContain('faces');
  });
  it('daycare: leave, wait two runs, collect a real egg that starts the next run', () => {
    let p = ok(withRun(), 'daycare-leave', { choice: 'pikachu' }).profile;
    expect(act(p, 'daycare-collect', { choice: 'collect-egg' }).ok).toBe(false);
    p = spendTownStart(spendTownStart(p));
    p = ok(p, 'daycare-collect', { choice: 'collect-egg' }).profile;
    expect(townStartGrants(content, p).eggs.length).toBe(1);
    const run = structuredClone(chooseStarter(content, createRun(content, { runId: 'dc', seed: 'dc', archetypeId: 'red' }), 0));
    applyStartGrants(content, run, p);
    expect(run.eggs.length).toBe(1);
  });
  it('hot spring bond and workshop tune-ups ride into the run as camp stuff', () => {
    let p = ok(withRun(), 'hotspring-soak', { grade: 'perfect', choice: 'pikachu' }).profile;
    p = ok(p, 'workshop-repair', { choice: 'repair-gear' }).profile;
    const g = startGrants(content, p, 'red');
    expect(g.stuff['spa-bond']).toBe(3);
    expect(g.stuff['tune-up']).toBe(2);
  });
  it('Memorial Wall keeps Nuzlocke losses and fallen aces only, one flower per grave per day', () => {
    const p = rich();
    recordTownRun(content, p, { runId: 'm', seed: 'm', victory: false, inventory: {}, nuzlocke: { memorial: [{ speciesId: 'pikachu', level: 9, ace: true, cause: 'Lost to a rival' }] }, party: [{ speciesId: 'eevee', level: 7, hp: 0 }, { speciesId: 'pidgey', level: 5, hp: 0, care: { ace: true } }] });
    expect(townOf(p).memorial.length).toBe(2);
    expect(townOf(p).memorial[0]).toContain('pikachu');
    const first = ok(p, 'memorial-flower', { choice: '0' }).profile;
    expect(act(first, 'memorial-flower', { choice: '0' }).ok).toBe(false);
    expect(ok(first, 'memorial-flower', { choice: '1' }).ok).toBe(true);
  });
  it('freehand graffiti is accepted, bad input is not', () => {
    const p = rich();
    expect(act(p, 'wall-sign', { choice: '#ff5a5a|d:1,1;2,2;3,3:5,5;6,6' }).ok).toBe(true);
    expect(act(p, 'wall-sign', { choice: '#ff5a5a|<script>' }).ok).toBe(false);
  });
});

describe('town and the run', () => {
  it('run end records relics, weather and lost items; start grants carry boon and Shrine Water into the run', () => {
    let run = chooseStarter(content, createRun(content, { runId: 'tr', seed: 'tr', archetypeId: 'red' }), 0);
    run = structuredClone(run);
    run.phase = 'map';
    const cursed = CAMP.relics.find((r) => r.curse)!;
    grantRelic(run, cursed.id, true);
    const p = rich();
    recordTownRun(content, p, { runId: 'tr', seed: 'tr', victory: false, regionIndex: 0, inventory: run.inventory, camp: run.camp });
    expect(townWeather(p)).toBe('storm');
    expect(townOf(p).sets.relics).toContain(`${cursed.id}!`);
    // Offer it at the Shrine: Shrine Water joins the boon.
    const offered = ok(p, 'shrine-offer', { choice: `${cursed.id}!` }).profile;
    expect(townStartGrants(content, offered).stuff['shrine-water']).toBe(1);
    // A new run gets the water; the camp rite uses it instead of money.
    const fresh = structuredClone(chooseStarter(content, createRun(content, { runId: 'tr2', seed: 'tr2', archetypeId: 'red' }), 0));
    fresh.phase = 'map';
    applyStartGrants(content, fresh, offered);
    expect(campOf(fresh).stuff['shrine-water']).toBe(1);
    grantRelic(fresh, cursed.id, true);
    fresh.money = 0;
    const done = campAction(content, fresh, undefined, 'purify', { choice: '0' });
    expect(done.ok, done.message).toBe(true);
    expect(campOf(done.run).stuff['shrine-water']).toBe(0);
    expect(startGrants(content, offered, 'red').stuff['shrine-water']).toBe(1);
  });
  it('the start spends the boon once and plants grow', () => {
    const p = ok(rich(), 'radio-tune', { choice: 'weather' }).profile;
    const after = spendTownStart(p);
    expect(townStartGrants(content, after).items.potion ?? 0).toBe(0);
  });
  it('profile with a town round-trips through the profile schema', () => {
    const p = ok(rich(), 'radio-tune', { choice: 'weather' }).profile;
    expect(ProfileSchema.parse(JSON.parse(JSON.stringify(p))).town?.boon.items.potion).toBe(2);
    expect(ProfileSchema.parse(JSON.parse(JSON.stringify(createProfile(content, 'old')))).town).toBeUndefined();
  });
  it('visits count and the passage opens at 20', () => {
    let p = rich();
    for (let i = 0; i < 20; i++) p = visitBuilding(p, 'garden');
    expect(townProblem(content, p, getTownAction('dev-jokes')!, DAY)).toBeNull();
    expect(townProblem(content, rich(), getTownAction('dev-jokes')!, DAY)).toContain('20');
  });
  it('optionsOf builds dynamic choices for an empty profile without throwing', () => {
    for (const a of TOWN.buildings.flatMap((b) => b.actions)) expect(() => optionsOf(content, rich(), a, DAY)).not.toThrow();
    expect(applyReward(rich(), townOf(rich()), undefined, new Rng(hashSeed('x')))).toBe('');
  });
});

function require_q(p: Profile, a: NonNullable<ReturnType<typeof getTownAction>>): string {
  const rng = new Rng(hashSeed(`town::quiz::${a.id}::${localDay(DAY)}::${(townOf(p).daily[a.id] ?? '').startsWith(localDay(DAY)) ? Number(townOf(p).daily[a.id]!.split(':')[1]) : 0}`));
  return TOWN.quizzes.library![rng.int(0, TOWN.quizzes.library!.length - 1)]!.q;
}

describe('Hall Records (S466)', () => {
  it('has no records for an empty history and picks the best run per category', async () => {
    const { hallRecords } = await import('../../src/core/town');
    const base = { regionsCleared: 1, regions: 3, badges: 2, encounters: 10, victory: false, party: [{ speciesId: 'pikachu', level: 20, shiny: false }], bankCredits: 5, researchPoints: 1, achievements: [], seed: 'a', endedAt: '2026-01-01' };
    const empty = hallRecords({ runHistory: [] } as never);
    expect(empty.every((r) => r.seed === null)).toBe(true);
    const rows = hallRecords({ runHistory: [base, { ...base, seed: 'b', endedAt: '2026-01-02', badges: 5, victory: true, encounters: 8, party: [{ speciesId: 'mew', level: 90, shiny: true }] }] } as never);
    expect(rows.find((r) => r.label === 'Most badges')?.seed).toBe('b');
    expect(rows.find((r) => r.label === 'Longest run')?.seed).toBe('a');
    expect(rows.find((r) => r.label === 'Quickest win')?.seed).toBe('b');
    expect(rows.find((r) => r.label === 'Shiniest team')?.value).toBe('1 shiny');
  });
});

describe('Weather Station (S362)', () => {
  it('each bought tier is handed to the next run as camp stuff and widens the forecast', async () => {
    const { stationTier } = await import('../../src/core/world');
    let p = rich();
    expect(townStartGrants(content, p).stuff['weather-station']).toBeUndefined();
    p = ok(p, 'rooftop-station', { choice: 'station-1' }).profile;
    p = ok(p, 'rooftop-station', { choice: 'station-2' }).profile;
    expect(townStartGrants(content, p).stuff['weather-station']).toBe(2);
    expect(act(p, 'rooftop-station', { choice: 'station-2' }).ok).toBe(false);
    expect(stationTier({ camp: { stuff: { 'weather-station': 9 } } } as never)).toBe(3);
    expect(stationTier({} as never)).toBe(0);
  });
});

describe('Fan Club (S358)', () => {
  it('followers come from the history and each reached tier adds starting money', async () => {
    const { fanClub } = await import('../../src/core/town');
    const p = rich();
    expect(fanClub(p).fans).toBe(0);
    const base = townStartGrants(content, p).money;
    const run = { regionsCleared: 1, regions: 3, badges: 1, encounters: 5, victory: true, party: [], bankCredits: 0, researchPoints: 0, achievements: [], seed: 's', endedAt: 'x' };
    p.runHistory = Array.from({ length: 2 }, () => run) as never; // 2 runs, 2 wins = 26 fans
    expect(fanClub(p).fans).toBe(26);
    expect(townStartGrants(content, p).money).toBe(base + TOWN.fanClub[0]!.money);
  });
});

describe('Guild Hall Board (S364)', () => {
  it('a hired helper costs credits and their supplies wait as the next run boon', () => {
    let p = rich();
    const before = p.bankCredits;
    const money = townStartGrants(content, p).money;
    p = ok(p, 'hall-guild', { choice: 'guild-medic' }).profile;
    p = ok(p, 'hall-guild', { choice: 'guild-treasurer' }).profile;
    expect(p.bankCredits).toBe(before - 105);
    const g = townStartGrants(content, p);
    expect(g.items['super-potion']).toBe(4);
    expect(g.money).toBe(money + 500);
  });
});

describe('Relic Vault (S464)', () => {
  it('stores up to two uncursed relics, which join every later run', () => {
    let p = rich();
    const t = townOf(p);
    const ids = (CAMP.relics.slice(0, 4)).map((r) => r.id);
    t.sets.relics = ids;
    p = { ...p, town: t } as Profile;
    p = ok(p, 'vault-store', { choice: ids[0]! }).profile;
    p = ok(p, 'vault-store', { choice: ids[1]! }).profile;
    expect(act(p, 'vault-store', { choice: ids[2]! }).ok).toBe(false);
    expect(townStartGrants(content, p).relics).toEqual([ids[0], ids[1]]);
    p = ok(p, 'vault-store', { choice: ids[0]! }).profile;
    expect(townStartGrants(content, p).relics).toEqual([ids[1]]);
  });
});

describe('Dream Tower and garden visitors (S109, S475)', () => {
  it('a dream costs credits and describes a real region', () => {
    const p = rich();
    const before = p.bankCredits;
    const regionId = [...content.regions.keys()][0]!;
    const r = ok(p, 'dream-peek', { choice: regionId });
    expect(r.profile.bankCredits).toBe(before - townApi.townPrice(p, 10));
    expect(r.message).toMatch(/dream/i);
    const poor = { ...rich(), bankCredits: 0 };
    expect(act(poor, 'dream-peek', { choice: regionId }).ok).toBe(false);
  });
  it('the day brings three visitors, the same all day, each greeted once', () => {
    const { gardenVisitors } = require_town();
    const a = gardenVisitors(content, DAY);
    expect(a).toHaveLength(3);
    expect(gardenVisitors(content, DAY)).toEqual(a);
    const id = `${a[0]}@${localDay(DAY)}`;
    const p = ok(rich(), 'garden-visitors', { choice: id }).profile;
    expect(p.researchPoints).toBe(rich().researchPoints + 1);
    expect(ok(p, 'garden-visitors', { choice: id }).profile.researchPoints).toBe(p.researchPoints); // the gift pays once
  });
});

describe('Lab research, trading cards, notice filters (S462, S357, S478)', () => {
  it('lab research costs 2 Research Points, shows base stats and lists a species once', () => {
    const p = rich();
    p.speciesCaught = ['bulbasaur'];
    expect(optionsOf(content, p, getTownAction('lab-research')!, DAY).map((o) => o.id)).toEqual(['bulbasaur']);
    const r = ok(p, 'lab-research', { choice: 'bulbasaur' });
    expect(r.profile.researchPoints).toBe(p.researchPoints - 2);
    expect(r.message).toMatch(/HP 45/);
    expect(optionsOf(content, r.profile, getTownAction('lab-research')!, DAY)).toHaveLength(0);
    expect(act({ ...p, researchPoints: 0, speciesCaught: ['bulbasaur'] }, 'lab-research', { choice: 'bulbasaur' }).ok).toBe(false);
  });
  it('trading cards come from caught species and trainers run, rarer with base stats', () => {
    const p = rich();
    p.speciesCaught = ['caterpie', 'mewtwo'];
    const cards = townApi.tradingCards(content, p);
    expect(cards.find((c) => c.id === 'caterpie')!.rarity).toBe('common');
    expect(cards.find((c) => c.id === 'mewtwo')!.rarity).toBe('holo');
    expect(townApi.tradingCards(content, { ...p, speciesCaught: ['nope'] })).toEqual([]);
  });
  it('the notice board sorts ready-to-claim first and filters by state', () => {
    const t = townOf(rich());
    const today = '2026-11-03';
    const quests = [
      { id: 'a', text: 'A', action: 'x', reward: { credits: 5 } },
      { id: 'b', text: 'B', action: 'y', reward: { credits: 20 } },
      { id: 'c', text: 'C', action: 'z', reward: { credits: 1 } },
    ];
    t.daily['used:z'] = today;
    t.daily['claim:a'] = today;
    expect(townApi.noticeBoard(t, today, quests, 'all').map((n) => n.id)).toEqual(['c', 'b', 'a']);
    expect(townApi.noticeBoard(t, today, quests, 'open').map((n) => n.id)).toEqual(['b']);
    expect(townApi.noticeBoard(t, today, quests, 'claim').map((n) => n.id)).toEqual(['c']);
    expect(townApi.noticeBoard(t, today, quests, 'done').map((n) => n.id)).toEqual(['a']);
  });
});

describe('Guide tips, rank upgrades, mastery prestige (S469, S460, S461)', () => {
  it('tips fit the profile and never exceed four', () => {
    const fresh = structuredClone(createProfile(content, 'tips'));
    expect(townApi.hubTips(fresh)[0]).toMatch(/first run/);
    const p = rich();
    p.stats.runsStarted = 3;
    p.bankCredits = 500;
    p.researchPoints = 40;
    const tips = townApi.hubTips(p);
    expect(tips.length).toBeGreaterThan(1);
    expect(tips.length).toBeLessThanOrEqual(4);
  });
  it('rank upgrades list what is still locked', () => {
    const p = structuredClone(createProfile(content, 'rank'));
    const r = townApi.rankUpgrades(p, TOWN.buildings, (b) => { const bd = TOWN.buildings.find((x) => x.id === b.id)!; return townApi.buildingProblem(p, bd); });
    expect(r.rank).toBe(0);
    expect(r.open + r.locked.length).toBe(TOWN.buildings.length);
  });
  it('prestige stars come from mastery and cap at five', () => {
    const p = structuredClone(createProfile(content, 'prestige'));
    expect(townApi.prestigeCosmetics(content, p)).toEqual([]);
    p.mastery.pikachu = { seen: 5, caught: 5, battles: 50, bossWins: 40, evolved: 3, flawless: 10, regions: 8 } as never;
    const [top] = townApi.prestigeCosmetics(content, p);
    expect(top).toMatchObject({ speciesId: 'pikachu', stars: 5, title: 'Legend' });
  });
});

describe('Seasonal quests, card backgrounds, rival dojo (S471, S472, S474)', () => {
  it('the season adds its own third notice, and the board is stable per day', () => {
    const nov = todaysQuests(townOf(rich()), '2026-11-03');
    expect(nov).toHaveLength(3);
    expect(nov[2]!.id).toBe('dq-autumn');
    expect(todaysQuests(townOf(rich()), '2026-10-31')[2]!.id).toBe('dq-halloween');
    expect(todaysQuests(townOf(rich()), '2026-12-25')[2]!.id).toBe('dq-winter');
    expect(todaysQuests(townOf(rich()), '2026-11-03')).toEqual(nov);
  });
  it('card backgrounds are equipped only once unlocked', () => {
    const p = rich();
    expect(act(p, 'hall-cardbg', { choice: 'cb-sunrise' }).ok).toBe(false);
    p.town = { ...townOf(p), sets: { ...townOf(p).sets, cardbg: ['cb-sunrise'] } };
    const q = ok(p, 'hall-cardbg', { choice: 'cb-sunrise' }).profile;
    expect(townOf(q).equipped.cardbg).toBe('cb-sunrise');
    expect(townApi.cardBackground(q)).toMatchObject({ id: 'cb-sunrise', name: 'Sunrise' });
    expect(townApi.cardBackground(rich())).toBeNull();
  });
  it('rival sparring needs a finished run and pays once a day', () => {
    const p = rich();
    expect(act(p, 'dojo-rival', { choice: 'Blue' }).ok).toBe(false);
    p.runHistory = [{ runId: 'r1', victory: true, regionsCleared: 1, regions: 3, badges: 1, encounters: 5, defeatedBy: null, party: [{ speciesId: 'charizard', level: 60, shiny: false }], bankCredits: 0, researchPoints: 0, achievements: [], seed: 's', endedAt: 'x', archetypeId: 'red', campaignId: 'c' }] as never;
    const r = ok(p, 'dojo-rival', { choice: 'Blue' });
    expect(r.message).toMatch(/Blue/);
    expect(act(r.profile, 'dojo-rival', { choice: 'Blue' }).ok).toBe(false); // once a day
  });
});

describe('Berry Orchard', () => {
  it('one tree a day pays berries into the next run', () => {
    const p = ok(rich(), 'orchard-pick', { choice: 'tree-oran' }).profile;
    expect(townOf(p).boon.items['oran-berry']).toBe(3);
    expect(act(p, 'orchard-pick', { choice: 'tree-pecha' }).ok).toBe(false);
  });
});

describe('Rival Sponsors (S360)', () => {
  it('a rival sponsor pays only when you beat your earlier best', () => {
    const p = ok(rich(), 'hall-sponsor', { choice: 'sponsor-rival-trail' }).profile;
    const old = { regionsCleared: 2, regions: 3, badges: 1, encounters: 5, victory: false, party: [], bankCredits: 0, researchPoints: 0, achievements: [], seed: 's', endedAt: 'x', runId: 'old' };
    p.runHistory = [old] as never;
    const run = { runId: 'r', seed: 's', victory: false, inventory: {}, camp: { relics: [], stuff: { 'sponsor-rival-trail': 1 } } };
    const slow = structuredClone(p);
    recordRun(content, slow, { ...run, regionIndex: 2 });
    expect(slow.bankCredits).toBe(p.bankCredits);
    const fast = structuredClone(p);
    recordRun(content, fast, { ...run, regionIndex: 3 });
    expect(fast.bankCredits).toBe(p.bankCredits + 110);
  });
});

describe('Sponsor Deals (S359)', () => {
  it('a signed sponsor pays at run end only when its goal was met', () => {
    let p = rich();
    p = ok(p, 'hall-sponsor', { choice: 'sponsor-gear' }).profile;
    expect(act(p, 'hall-sponsor', { choice: 'sponsor-trail' }).ok).toBe(false); // one per run
    const g = townStartGrants(content, p);
    expect(g.stuff['sponsor-gear']).toBe(1);
    const run = { runId: 'r', seed: 's', victory: false, regionIndex: 0, inventory: {}, camp: { relics: [], stuff: { 'sponsor-gear': 1 } } };
    const miss = structuredClone(p);
    recordRun(content, miss, { ...run, badges: ['a', 'b'] });
    expect(miss.bankCredits).toBe(p.bankCredits);
    const hit = structuredClone(p);
    recordRun(content, hit, { ...run, badges: ['a', 'b', 'c', 'd'] });
    expect(hit.bankCredits).toBe(p.bankCredits + 70);
  });
});

describe('Town Economy (S347)', () => {
  it('Fan Club tiers cut credit prices in the town shops', async () => {
    const { townDiscount, townPrice, marketSwing } = await import('../../src/core/town');
    const p = rich();
    expect(townDiscount(p)).toBe(0);
    expect(townPrice(p, 60)).toBe(60);
    const run = { regionsCleared: 1, regions: 3, badges: 1, encounters: 5, victory: true, party: [], bankCredits: 0, researchPoints: 0, achievements: [], seed: 's', endedAt: 'x' };
    p.runHistory = Array.from({ length: 2 }, () => ({ ...run, victory: false })) as never; // 12 fans: no tier yet
    expect(townDiscount(p)).toBe(0);
    p.runHistory = Array.from({ length: 2 }, () => run) as never; // 26 fans = tier 1
    expect(townDiscount(p)).toBeCloseTo(0.05);
    const price = Math.max(1, Math.round(60 * 0.95 * (1 + marketSwing(p).pct)));
    expect(townPrice(p, 60)).toBe(price);
    const before = p.bankCredits;
    const q = ok(p, 'hall-guild', { choice: 'guild-medic' }).profile;
    expect(q.bankCredits).toBe(before - townPrice(p, 60));
    expect(townPrice(p, 0)).toBe(0);
  });
  it('Market swings (S347): steady with no runs, a sale after a win, same inputs same price', async () => {
    const { marketSwing } = await import('../../src/core/town');
    const p = rich();
    expect(marketSwing(p).pct).toBe(0);
    const run = { regionsCleared: 1, regions: 3, badges: 1, encounters: 5, victory: true, party: [], bankCredits: 0, researchPoints: 0, achievements: [], seed: 's', endedAt: 'x' };
    p.runHistory = [run, run, run] as never;
    const won = marketSwing(p).pct;
    p.runHistory = [{ ...run, victory: false }, run, run] as never;
    expect(Math.round((marketSwing(p).pct - won) * 100)).toBe(5);
    expect(marketSwing(p)).toEqual(marketSwing(p));
  });
});
