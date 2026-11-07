import { describe, expect, it } from 'vitest';
import { createBattle } from '../../src/core/battle/engine';
import { createPokemon } from '../../src/core/pokemon';
import { openHistory } from '../../src/core/story/record';
import { chooseStarter, createRun, takeTurn } from '../../src/core/run';
import { RunStateSchema, type RunState } from '../../src/core/state';
import { StoryV2Schema } from '../../src/core/story2/schema';
import { checkSignatures, endSignatureMoves, grantSignatureMoves, nameSignature, nextNameable, partnerLine, signatureMoves } from '../../src/core/story2/signature';
import { recordBattleStarted } from '../../src/core/story/hooks';
import { eventText } from '../../src/ui/battleText';
import signatureJson from '../../src/data/storySignatureMoves.json';
import { content } from './helpers';

function storyRun(species = 'charmander'): { run: RunState; uid: string } {
  const run = structuredClone(chooseStarter(content, createRun(content, { runId: 'sig', seed: 'sig', archetypeId: 'red' }), 0));
  const lead = { ...createPokemon(content, species, 30, run.party[0]!.uid), moves: [{ id: 'scratch', pp: 99 }] };
  run.party[0] = lead;
  openHistory(content, run, lead.uid, lead.speciesId, 'starter');
  const v2 = StoryV2Schema.parse({ mode: 'story_run' });
  v2.heartbond.partner = lead.uid;
  run.story.v2 = v2;
  return { run, uid: lead.uid };
}

const LINES = content.storyData.remembrances.map((r) => r.line[0]!);

describe('signature move data', () => {
  it('gives every one of the 84 Remembrance lines a Signature I, a Signature II and a Keystone that exist as moves', () => {
    expect(LINES).toHaveLength(84);
    expect(Object.keys(signatureJson.byLine).sort()).toEqual([...LINES].sort());
    const ids = new Set<string>();
    for (const line of LINES) {
      const s = signatureMoves(line)!;
      for (const id of [s.sig1, s.sig2, s.keystone]) {
        expect(content.moves.get(id), `${line} ${id}`).toBeDefined();
        expect(ids.has(id), `${id} reused`).toBe(false);
        ids.add(id);
      }
    }
    expect(ids.size).toBe(252);
  });

  it('keeps every move inside the balance caps and out of random pools', () => {
    for (const line of LINES) {
      const s = signatureMoves(line)!;
      for (const id of [s.sig1, s.sig2, s.keystone]) {
        const m = content.moves.get(id)!;
        expect(m.flags).toContain('storysig');
        // A Keystone with nothing else to improve gets 8 PP instead.
        expect(m.pp).toBe(id === s.keystone && m.pp === 8 ? 8 : 5);
        expect(m.supported).toBe(true);
        if (m.power !== null) {
          // Multi-hit moves count every hit (a rising "perHit" move adds 1x, 2x and 3x its power).
          const hits = m.effects.hits?.[1] ?? 1;
          const total = m.effects.powerRule === 'perHit' ? m.power * (hits * (hits + 1)) / 2 : m.power * hits;
          expect(total, id).toBeGreaterThanOrEqual(40);
          expect(total, id).toBeLessThanOrEqual(id === s.keystone ? 105 : 95);
        }
        if (m.accuracy !== null) {
          expect(m.accuracy, id).toBeGreaterThanOrEqual(85);
          expect(m.accuracy, id).toBeLessThanOrEqual(100);
        }
      }
    }
  });

  it('names the partner line from the starter or the species', () => {
    const { run } = storyRun('charmeleon');
    expect(partnerLine(content, run)).toBe('charmander');
  });
});

describe('signature unlocks', () => {
  it('teaches Signature I only after a milestone win with Heartbond 3 latched', () => {
    const { run } = storyRun();
    const s = signatureMoves('charmander')!;
    expect(checkSignatures(content, run, 'victory', true)).toEqual([]);
    run.story.v2!.heartbond.latched.push(3);
    expect(checkSignatures(content, run, 'victory', false)).toEqual([]);
    expect(checkSignatures(content, run, 'recovery')).toEqual([]);
    expect(checkSignatures(content, run, 'victory', true)).toEqual([{ slot: 'sig1', moveId: s.sig1 }]);
    expect(checkSignatures(content, run, 'victory', true)).toEqual([]);
    expect(run.story.v2!.sigMoves).toEqual([s.sig1]);
    // Learned moves wait in the story state: the four normal slots stay as they were.
    expect(run.party[0]!.moves.map((m) => m.id)).toEqual(['scratch']);
  });

  it('teaches Signature II at a Recovery stop once Heartbond 7 is latched and the Starter arc is done', () => {
    const s = signatureMoves('charmander')!;
    expect(content.storyData.arcs.some((a) => a.id === 'arc_rm_charmander')).toBe(true);
    const { run } = storyRun();
    run.story.v2!.heartbond.latched.push(3, 7);
    expect(checkSignatures(content, run, 'recovery')).toEqual([]);
    run.story.v2!.arcs['arc_rm_charmander'] = { state: 'done' } as never;
    expect(checkSignatures(content, run, 'victory', true).map((u) => u.slot)).toEqual(['sig1']);
    expect(checkSignatures(content, run, 'recovery')).toEqual([{ slot: 'sig2', moveId: s.sig2 }]);
    // A line whose arc is not written yet needs Heartbond 7 alone.
    const noArc = { ...content, storyData: { ...content.storyData, arcs: content.storyData.arcs.filter((a) => a.id !== 'arc_rm_charmander') } } as typeof content;
    const other = storyRun().run;
    other.story.v2!.heartbond.latched.push(6);
    expect(checkSignatures(noArc, other, 'recovery')).toEqual([]);
    other.story.v2!.heartbond.latched.push(7);
    expect(checkSignatures(noArc, other, 'recovery')).toEqual([{ slot: 'sig2', moveId: s.sig2 }]);
  });

  it('upgrades Signature I into its Keystone and keeps the name the player gave it', () => {
    const { run } = storyRun();
    const s = signatureMoves('charmander')!;
    run.story.v2!.heartbond.latched.push(3);
    checkSignatures(content, run, 'victory', true);
    expect(nameSignature(content, run, s.sig1, 'Ember Promise')).toContain('Ember Promise');
    run.story.v2!.heartbond.keystoneReady = true;
    expect(checkSignatures(content, run, 'recovery')).toEqual([{ slot: 'keystone', moveId: s.keystone }]);
    expect(run.story.v2!.sigMoves).toEqual([s.keystone]);
    expect(run.story.v2!.sigNames[s.keystone]).toMatchObject({ display: 'Ember Promise', defaultName: content.moves.get(s.keystone)!.name });
    // Without a Signature I there is nothing to upgrade.
    const other = storyRun().run;
    other.story.v2!.heartbond.keystoneReady = true;
    expect(checkSignatures(content, other, 'recovery')).toEqual([]);
  });

  it('adds the moves for a battle in extra slots and takes them away after, surviving a save round trip', () => {
    const { run } = storyRun();
    const s = signatureMoves('charmander')!;
    run.story.v2!.sigMoves.push(s.sig1, s.sig2);
    grantSignatureMoves(content, run);
    grantSignatureMoves(content, run);
    expect(run.party[0]!.moves.map((m) => [m.id, m.storySig ?? false])).toEqual([['scratch', false], [s.sig1, true], [s.sig2, true]]);
    const loaded = RunStateSchema.parse(JSON.parse(JSON.stringify(run)));
    expect(loaded.party[0]!.moves).toHaveLength(3);
    expect(loaded.story.v2!.sigMoves).toEqual([s.sig1, s.sig2]);
    endSignatureMoves(run.party);
    expect(run.party[0]!.moves.map((m) => m.id)).toEqual(['scratch']);
  });

  it('learns Signature I through a real boss win and clears the battle slots', () => {
    const { run } = storyRun();
    run.story.v2!.heartbond.latched.push(3);
    run.story.v2!.sigMoves = [];
    run.battle = createBattle('trainer', [createPokemon(content, 'magikarp', 2, 'e1')], 0, run.party[0]!.uid, { classId: 'gym-leader', name: 'Boss', leaderId: null });
    run.phase = 'battle';
    recordBattleStarted(content, run);
    let r = run;
    const texts: string[] = [];
    for (let i = 0; i < 20 && r.phase === 'battle'; i += 1) {
      const t = takeTurn(content, r, { kind: 'move', index: 0 });
      r = t.run;
      for (const e of t.events) if (e.type === 'spectacle') texts.push(e.text);
    }
    expect(r.phase).not.toBe('battle');
    expect(r.story.v2!.sigMoves).toEqual([signatureMoves('charmander')!.sig1]);
    expect(texts.some((t) => t.includes('learned its own move'))).toBe(true);
    expect(r.party[0]!.moves.some((m) => m.storySig)).toBe(false);
  });
});

describe('signature moves in battle', () => {
  it('every signature move can be used for a turn without breaking the battle', () => {
    const { run } = storyRun();
    for (const id of Object.values(signatureJson.byLine).flatMap((s) => [s.sig1, s.sig2, s.keystone])) {
      const r = structuredClone(run);
      r.party[0]!.moves = [{ id, pp: 5, storySig: true }];
      r.battle = createBattle('trainer', [createPokemon(content, 'snorlax', 40, 'e1')], 0, r.party[0]!.uid, { classId: 'gym-leader', name: 'Boss', leaderId: null });
      r.phase = 'battle';
      const t = takeTurn(content, r, { kind: 'move', index: 0 });
      expect(t.events.some((e) => e.type === 'move' && e.moveId === id), id).toBe(true);
    }
  });

  it('shows the chosen name in "used" lines and blocks bad or official names', () => {
    const { run, uid } = storyRun();
    const s = signatureMoves('charmander')!;
    run.story.v2!.heartbond.latched.push(3);
    checkSignatures(content, run, 'victory', true);
    expect(nextNameable(run, uid)).toBe(s.sig1);
    expect(nextNameable(run, 'someone-else')).toBeNull();
    expect(nameSignature(content, run, s.sig1, 'Flamethrower')).not.toContain('is called');
    expect(nameSignature(content, run, s.sig1, 'Pikachu')).not.toContain('is called');
    expect(nameSignature(content, run, s.sig1, 'ab')).not.toContain('is called');
    expect(nameSignature(content, run, s.sig1, 'Hearth Spark')).toBe('The move is called Hearth Spark.');
    expect(nameSignature(content, run, s.sig1, 'Kindle Oath')).toBe('The move is called Kindle Oath.');
    expect(nameSignature(content, run, s.sig1, 'Third Try')).toContain('already renamed');
    expect(nextNameable(run, uid)).toBeNull();
    const names = { player: 'Charmander', enemy: 'Rattata', trainer: null, nameOf: () => '', moveName: (id: string) => run.story.v2!.sigNames[id]?.display };
    expect(eventText(content, names, { type: 'move', side: 'player', moveId: s.sig1 } as never)).toBe('Charmander used Kindle Oath!');
    expect(eventText(content, names, { type: 'move', side: 'enemy', moveId: s.sig1 } as never)).toContain(content.moves.get(s.sig1)!.name);
  });
});
