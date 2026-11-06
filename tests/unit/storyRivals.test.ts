// Story Overhaul S10: the seven story rivals (data, role order, teams and levels, Pip's draws, Kael and Soren clue ledgers, fair-play audit).
import { describe, expect, it } from 'vitest';
import { storyGates } from '../../src/quality/storyGates';
import type { StoryData } from '../../src/core/story2/schema';
import {
  auditLedger, beatsFor, counterFor, ledgerFor, NEVER_FRIENDLY, pipDraw, pipTeamKey, revealAllowed, rivalAudit, rivalById, rivalListOrder, rolesForTheme, STORY_RIVAL_IDS, teamFor, teamLevels,
} from '../../src/core/story2/storyRivals';
import { content } from './helpers';

const data = content.storyData as StoryData;
const bands = content.balance.story.rivalBands;
const rv = (id: string) => rivalById(data, id)!;
const clone = (): StoryData => structuredClone(data);

describe('story rivals: data and audit', () => {
  it('has the seven rivals, each with a rival character and four scenes', () => {
    expect(data.rivals.map((r) => r.id)).toEqual([...STORY_RIVAL_IDS]);
    for (const r of data.rivals) {
      expect(data.characters.find((c) => c.id === r.character)?.role).toBe('rival');
      expect(r.scenes.map((s) => s.beat)).toEqual([2, 4, 6, 8]);
      expect(r.teams.map((t) => t.act)).toEqual([1, 2, 3, 4, 5, 6]);
    }
  });

  it('passes the fair-play audit with real species and the Act bands', () => {
    expect(rivalAudit(data, content.species, bands)).toEqual([]);
    expect(storyGates(data, content).find((g) => g.id === 'story-rival-audit')!.offenders).toEqual([]);
  });

  it('fails the audit for a bad ledger, a bad team, a Friendly Soren, a missing scene and an Avoid-list Primary', () => {
    const bad = clone();
    const soren = bad.rivals.find((r) => r.id === 'rv_soren')!;
    soren.ledger = soren.ledger.slice(0, 3);
    soren.roles = ['primary', 'secondary', 'friendly'];
    bad.rivals.find((r) => r.id === 'rv_dara')!.teams[1]!.slots.push({ species: 'rattata' });
    bad.rivals.find((r) => r.id === 'rv_hale')!.teams[2]!.slots.forEach((s) => (s.ace = false));
    bad.rivals.find((r) => r.id === 'rv_ines')!.scenes.pop();
    bad.rivalThemes[0]!.primary = 'rv_ines';
    const out = rivalAudit(bad, content.species, bands).join('\n');
    expect(out).toContain('rv_soren ledger: 3 clues, needs 5');
    expect(out).toContain('rv_soren: secret cannot be the Friendly rival');
    expect(out).toContain('rv_dara act 2: 4 Pokémon, band says 3');
    expect(out).toContain('rv_hale act 3: 0 Aces');
    expect(out).toContain('rv_ines: ');
    expect(out).toContain('th_price_of_power: Primary rv_ines is on the Avoid list');
  });

  it('keeps the rival scenes out of every generic Stop slot (tags only the rival slice uses)', () => {
    const slotTags = new Set(['narrative', 'character', 'conflict', 'discovery', 'relationship', 'branch', 'climax', 'resolution', 'recovery', 'rival_beat', 'rival_intro']);
    for (const e of data.events.filter((x) => x.id.startsWith('ev_rv_'))) {
      expect(e.tags.some((t) => slotTags.has(t))).toBe(false);
      expect(e.choices.length).toBeGreaterThanOrEqual(3);
      expect(e.variants.filter((v) => v.role === 'rival').length).toBeGreaterThanOrEqual(3);
    }
  });
});

describe('story rivals: roles in list order', () => {
  it('writes [Primary, Secondary, Friendly] for all 10 themes, 3 distinct rivals, Friendly never a secret keeper', () => {
    expect(data.rivalThemes).toHaveLength(10);
    for (const t of data.rivalThemes) {
      const roles = rolesForTheme(data, t.theme)!;
      const list = rivalListOrder(roles);
      expect(list).toEqual([t.primary, t.secondary, t.friendly]);
      expect(new Set(list).size).toBe(3);
      expect(t.avoid).not.toContain(rv(roles.primary).archetype);
      expect(NEVER_FRIENDLY).not.toContain(rv(roles.friendly).archetype as never);
    }
    expect(rolesForTheme(data, 'th_nothing')).toBeNull();
  });

  it('lets Champion Heir move Hale to Primary and Ex-Criminal move Kael or Soren to Primary, never past an Avoid slot', () => {
    expect(rolesForTheme(data, 'th_marauder_conspiracy', 'bs_champion_heir')).toMatchObject({ primary: 'rv_kael' }); // Hale is Friendly there: no swap
    // Force Hale into the Secondary column to see the swap.
    const d = clone();
    d.rivalThemes.find((t) => t.theme === 'th_price_of_power')!.secondary = 'rv_hale';
    d.rivalThemes.find((t) => t.theme === 'th_price_of_power')!.primary = 'rv_ines';
    expect(rolesForTheme(d, 'th_price_of_power', 'bs_champion_heir')).toMatchObject({ primary: 'rv_hale', secondary: 'rv_ines' });
    d.rivalThemes.find((t) => t.theme === 'th_price_of_power')!.avoid = ['competitive'];
    expect(rolesForTheme(d, 'th_price_of_power', 'bs_champion_heir')).toMatchObject({ primary: 'rv_ines' });
    expect(rolesForTheme(data, 'th_missing_myth', 'bs_ex_criminal')).toMatchObject({ primary: 'rv_pip', secondary: 'rv_ines' });
  });

  it('gives Primary four scenes, Secondary three (no epilogue), Friendly one plus three spars', () => {
    expect(beatsFor(rv('rv_kael'), 'primary')).toEqual([2, 4, 6, 8]);
    expect(beatsFor(rv('rv_kael'), 'secondary')).toEqual([2, 4, 6]);
    expect(beatsFor(rv('rv_dara'), 'friendly')).toEqual([2]);
    expect(rv('rv_dara').sparActs).toEqual([2, 4, 6]);
    expect(beatsFor(rv('rv_soren'), 'friendly')).toEqual([]);
  });
});

describe('story rivals: teams, levels and counters', () => {
  it('sizes teams 2,3,4,5,6,6 and puts the Ace at the top of the band (cap 100)', () => {
    for (const r of data.rivals.filter((x) => x.id !== 'rv_pip')) {
      r.teams.forEach((t, i) => {
        const team = teamFor(r, i + 1, { role: 'primary', cap: 100, bands, freed: true });
        expect(team).toHaveLength(bands.acts[i]!.size);
        const ace = team.find((m) => m.ace)!;
        expect(ace.level).toBe(Math.round(bands.acts[i]!.band[1] * 100));
        expect(team.filter((m) => !m.ace).every((m) => m.level < ace.level)).toBe(true);
        expect(t.slots.filter((s) => s.ace)).toHaveLength(1);
      });
    }
    expect(teamFor(rv('rv_dara'), 6, { role: 'primary', cap: 100, bands }).find((m) => m.ace)).toMatchObject({ species: 'staraptor', level: 100, move: 'brave-bird' });
  });

  it('lowers a Friendly rival by 0.03 of the cap', () => {
    const primary = teamLevels(bands, 3, 'primary', 100, 4, 2);
    const friendly = teamLevels(bands, 3, 'friendly', 100, 4, 2);
    expect(primary[2]! - friendly[2]!).toBe(3);
  });

  it('plays Marisol\'s Bastion only when freed, else Dusclops leads and slot 6 is a Gothorita', () => {
    const freed = teamFor(rv('rv_marisol'), 6, { role: 'primary', cap: 100, bands, freed: true });
    expect(freed.find((m) => m.ace)).toMatchObject({ species: 'chesnaught', nick: 'Bastion' });
    const lost = teamFor(rv('rv_marisol'), 5, { role: 'primary', cap: 100, bands, freed: false });
    expect(lost.map((m) => m.species)).toContain('gothorita');
    expect(lost.map((m) => m.species)).not.toContain('chesnaught');
    expect(lost.find((m) => m.ace)!.species).toBe('dusclops');
    expect(counterFor(rv('rv_marisol'), 5, 'primary', { used: 0, freed: false })).toBeNull();
  });

  it('allows Primary counters, one for a Secondary, none for a Friendly', () => {
    const dara = rv('rv_dara');
    expect(counterFor(dara, 1, 'primary', { used: 5 })).toMatchObject({ slot: 2, species: 'pidove' });
    expect(counterFor(dara, 1, 'secondary', { used: 0 })).not.toBeNull();
    expect(counterFor(dara, 1, 'secondary', { used: 1 })).toBeNull();
    expect(counterFor(dara, 1, 'friendly', { used: 0 })).toBeNull();
  });
});

describe('story rivals: Pip\'s draws', () => {
  const pip = rv('rv_pip');
  it('never repeats a full team over 30 fights, repeats exactly on reload, and stays in the pool', () => {
    const history: string[] = [];
    const first: string[][] = [];
    for (let fight = 0; fight < 30; fight++) {
      const act = 3 + (fight % 4);
      const drawn = pipDraw(pip, act, 'seed-1', fight, history);
      first.push(drawn);
      expect(new Set(drawn).size).toBe(drawn.length);
      expect(drawn).toHaveLength(pip.teams[act - 1]!.draws!);
      drawn.forEach((s) => expect(pip.drawPool).toContain(s));
      const key = pipTeamKey(pip.teams[act - 1]!.slots.map((s) => s.species), drawn);
      expect(history).not.toContain(key);
      history.push(key);
    }
    const again: string[][] = [];
    const h2: string[] = [];
    for (let fight = 0; fight < 30; fight++) {
      const act = 3 + (fight % 4);
      const drawn = pipDraw(pip, act, 'seed-1', fight, h2);
      again.push(drawn);
      h2.push(pipTeamKey(pip.teams[act - 1]!.slots.map((s) => s.species), drawn));
    }
    expect(again).toEqual(first);
  });

  it('builds a full six at Act 5 with Gengar as the Ace, and uses its own stream', () => {
    const drawn = pipDraw(pip, 5, 'seed-2', 0);
    const team = teamFor(pip, 5, { role: 'primary', cap: 100, bands, drawn });
    expect(team).toHaveLength(6);
    expect(team.find((m) => m.ace)!.species).toBe('gengar');
    expect(pipDraw(pip, 1, 'seed-2', 0)).toEqual([]);
  });
});

describe('story rivals: Kael and Soren clue ledgers', () => {
  for (const id of ['rv_kael', 'rv_soren']) {
    it(`${id}: passes the fair-play rules (6 clues, 4+ Acts, 3+ on mandatory stops, all five types, an innocent reading each)`, () => {
      const r = rv(id);
      expect(r.ledger).toHaveLength(6);
      expect(auditLedger(r.ledger)).toEqual([]);
      expect(new Set(r.ledger.map((c) => c.act)).size).toBeGreaterThanOrEqual(3);
      expect(r.ledger.filter((c) => c.mandatory).length).toBeGreaterThanOrEqual(3);
      for (const c of r.ledger) for (const k of [c.textKey, c.coverKey, c.retroKey]) expect(data.text[k]).toBeTruthy();
    });

    it(`${id}: blocks the reveal until 4 clues fired (3 on the compressed Secondary arc)`, () => {
      const r = rv(id);
      expect(revealAllowed(r, 'primary', 3)).toBe(false);
      expect(revealAllowed(r, 'primary', 4)).toBe(true);
      expect(revealAllowed(r, 'secondary', 2)).toBe(false);
      expect(revealAllowed(r, 'secondary', 3)).toBe(true);
      expect(ledgerFor(r, 'primary')).toHaveLength(6);
      expect(ledgerFor(r, 'secondary').map((c) => c.act).sort()).toEqual([2, 3, 4]);
    });
  }

  it('the audit rejects a ledger with too few mandatory clues, one Act, or a clue with no cover', () => {
    const l = clone().rivals.find((r) => r.id === 'rv_kael')!.ledger;
    expect(auditLedger(l.map((c) => ({ ...c, mandatory: false })))).toContain('0 clues on mandatory stops, needs 3');
    expect(auditLedger(l.map((c) => ({ ...c, act: 2 })))).toContain('clues cover 1 Acts, needs 3');
    expect(auditLedger(l.map((c, i) => ({ ...c, cover: i !== 0 })))).toContain('k1: no innocent reading');
  });
});
