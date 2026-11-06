// Story Overhaul F0: each of the story gates passes on empty data and reports a seeded bad record.

import { describe, expect, it } from 'vitest';
import { PARITY_ITEMS, storyGates, type StoryGateContext } from '../../src/quality/storyGates';
import { BackstorySchema, RemembranceSchema, ThemeSchema, type StoryData } from '../../src/core/story2/schema';
import { content } from './helpers';

// A blank StoryData: the shipped story content is authored now, so gate tests start from empty arrays.
const empty = (): StoryData => ({ ...structuredClone(content.storyData), characters: [], events: [], arcs: [], themes: [], remembrances: [], moveMoments: [], dialogue: [], lore: [], news: [], interactables: [], backstories: [], quiz: [], rivals: [], rivalThemes: [], text: {} });
const count = (data: StoryData, id: string, ctx: StoryGateContext = {}) => storyGates(data, content, ctx).find((g) => g.id === id)!.offenders.length;
const character = (over: object = {}) => ({ id: 'dara', v: 1, nameKey: 'c.dara', age: 20, role: 'rival' as const, poses: { a: 'x.png', b: 'y.png', c: 'z.png', d: 'w.png' }, tier: 1 as const, party: [], relationClass: 'friend' as const, romanceable: false, tellings: [], bio: [{ tier: 1, textKey: 'c.dara.bio', spoiler: false }], flags: [], ...over });
const event = (over: object = {}) => ({ id: 'ev', v: 1, tags: [], requires: [], roles: {}, beats: [], choices: [], outputs: [], variants: [], cost: 1, tier: 'A' as const, moment: 'none' as const, ...over });
const GATES = ['story-unresolved-ids', 'story-event-variants', 'story-branch-no-exit', 'story-unreachable-ending', 'story-canon-write', 'story-backstory-parity', 'story-quiz-balance', 'story-remembrance-unlock', 'story-romance-age', 'story-twist-clues', 'story-theme-audit', 'story-movemoment-types', 'story-character-sheet', 'story-string-keys', 'story-template-tokens', 'story-pose-set', 'story-look-lock', 'story-species-budget', 'story-asset-files', 'story-bundle-budget', 'story-rival-audit', 'story-hash-stable'];

describe('story gates', () => {
  it('there are 22, and empty data passes every one', () => {
    const gates = storyGates(empty(), content, { fileExists: () => true, overBudgetIds: new Set(), hashFresh: true, fileSizes: {} });
    expect(gates.map((g) => g.id)).toEqual(GATES);
    for (const g of gates) expect(g.offenders, g.id).toEqual([]);
  });
  it('a sound character and event pass', () => {
    const d = empty();
    d.characters = [character()];
    d.text = { ...d.text, 'c.dara': 'Dara', 'c.dara.bio': 'Bio' };
    for (const id of GATES) expect(count(d, id, { fileExists: () => true }), id).toBe(0);
  });
  const bad: [string, (d: StoryData) => void, StoryGateContext?][] = [
    ['story-unresolved-ids', (d) => { d.events = [event({ roles: { a: { character: 'nobody' } } })]; }],
    ['story-event-variants', (d) => { d.events = [event({ roles: { a: {} } })]; }],
    ['story-branch-no-exit', (d) => { d.arcs = [{ id: 'arc', v: 1, steps: [], nodeCost: 1, branches: [{ id: 'b' }], effects: [], exits: ['x'] }]; }],
    ['story-unreachable-ending', (d) => { d.backstories = [BackstorySchema.parse({ id: 'bs', nameKey: 'k', parity: [], endings: ['e1'] })]; }],
    ['story-canon-write', (d) => { d.events = [event({ outputs: [{ kind: 'fact', target: 'canon.dara' }] })]; }],
    ['story-backstory-parity', (d) => { d.backstories = [BackstorySchema.parse({ id: 'bs', nameKey: 'k', parity: PARITY_ITEMS.slice(1), endings: ['e'], catchAllEnding: 'e' })]; }],
    ['story-quiz-balance', (d) => { d.quiz = [{ id: 'q1', quick: false, textKey: 'k', answers: [{ id: 'a', textKey: 'k', weights: { bold: 3 } }, { id: 'b', textKey: 'k', weights: { calm: 3 } }] }]; }],
    ['story-remembrance-unlock', (d) => { d.remembrances = [RemembranceSchema.parse({ id: 'r', v: 1, line: ['pidgey'], types: ['flying'], temperament: 't', affinity: {}, unlock: { kind: 'event', arg: 'missing_event' }, moves: [], keystone: 'k', status: 'supported' })]; }],
    ['story-romance-age', (d) => { d.characters = [character({ romanceable: true, age: 17 })]; d.text = { 'c.dara': 'x', 'c.dara.bio': 'x' }; }],
    ['story-twist-clues', (d) => { d.themes = [ThemeSchema.parse({ id: 't', letter: 'a', nameKey: 'k', beatSheet: [{ act: 1, slot: 'reveal' }, { act: 2, slot: 'clue1' }], slotRules: [], endings: ['e'], weight: 1, needs: [], twist: { revealSlot: 'reveal', clueSlots: ['clue1'], minClues: 1 } })]; }],
    ['story-theme-audit', (d) => { d.themes = [ThemeSchema.parse({ id: 't', letter: 'a', nameKey: 'k', beatSheet: [{ act: 1, slot: 's' }], slotRules: [], endings: ['e'], weight: 1, events: ['ev_missing'] })]; }],
    ['story-movemoment-types', (d) => { d.moveMoments = [{ id: 'm', trigger: 'finisher', templateKey: 'k', typeMap: { fire: 'k' } }]; }],
    ['story-character-sheet', (d) => { d.characters = [character({ bio: [] })]; d.text = { 'c.dara': 'x' }; }],
    ['story-string-keys', (d) => { d.characters = [character()]; }],
    ['story-template-tokens', (d) => { d.text = { 'x.y': 'Hello {nobody}' }; }],
    ['story-pose-set', (d) => { d.characters = [character({ poses: { a: 'x.png' } })]; d.text = { 'c.dara': 'x', 'c.dara.bio': 'x' }; }],
    ['story-look-lock', () => {}, { lookB: { enabled: true, checklistDone: false } }],
    ['story-species-budget', (d) => { d.remembrances = [RemembranceSchema.parse({ id: 'r', v: 1, line: ['mewtwo'], types: ['psychic'], temperament: 't', affinity: {}, unlock: { kind: 'start' }, moves: [], keystone: 'k', status: 'supported' })]; }, { overBudgetIds: new Set(['mewtwo']) }],
    ['story-asset-files', (d) => { d.characters = [character()]; d.text = { 'c.dara': 'x', 'c.dara.bio': 'x' }; }, { fileExists: () => false }],
    ['story-bundle-budget', () => {}, { fileSizes: { events: 700_000 } }],
    ['story-rival-audit', (d) => { d.rivals = structuredClone(content.storyData.rivals); d.rivals[0]!.character = 'nobody'; }],
    ['story-hash-stable', () => {}, { hashFresh: false }],
  ];
  it('gate_each_catches_bad_record: each of the 20 gates reports a seeded bad record', () => {
    expect(bad.map((b) => b[0])).toEqual(GATES);
    for (const [id, seed, ctx] of bad) {
      const d = empty();
      seed(d);
      expect(count(d, id, ctx), id).toBeGreaterThan(0);
    }
  });
});
