// Content pack events (S325), plugin cue hooks (S344) and the atlas builder (S338).

import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { applyPackEvents, parseConfigPack } from '../../src/core/configPack';
import { installPack, loadStoredPacks, removeProblem, type PackStore } from '../../src/core/tools/modPacks';
import { applyCueHooks, hookNames, registerCueHook, unregisterCueHook, MAX_HOOKS } from '../../src/core/presentation/hooks';
import type { Cue } from '../../src/core/presentation/cues';
import { content } from './helpers';

const pack = (events: unknown[]) => JSON.stringify({ format: 1, id: 'test-pack', name: 'Test', author: 'Me', events });
const good = { id: 'well', name: 'A wishing well', intro: 'You find a well.', choices: [{ label: 'Toss a coin', text: 'Plink.', effects: [{ kind: 'money', amount: -10 }, { kind: 'heal', share: 0.5 }] }] };

describe('content pack events (S325)', () => {
  it('adds a valid event to the content once, namespaced by the pack', () => {
    const r = parseConfigPack(pack([good]));
    if (!r.ok) throw new Error(r.errors.join());
    const fake = { events: new Map(content.events) };
    expect(applyPackEvents(r.pack, fake)).toBe(1);
    expect(applyPackEvents(r.pack, fake)).toBe(0);
    expect(fake.events.has('pack-test-pack-well')).toBe(true);
    expect(content.events.has('pack-test-pack-well')).toBe(false);
  });
  it('refuses big money, other effects, markup and too many events', () => {
    const bad = (e: unknown) => parseConfigPack(pack([e])).ok;
    expect(bad({ ...good, choices: [{ label: 'x', text: 'y', effects: [{ kind: 'money', amount: 5000 }] }] })).toBe(false);
    expect(bad({ ...good, choices: [{ label: 'x', text: 'y', effects: [{ kind: 'join', species: 'mew' }] }] })).toBe(false);
    expect(bad({ ...good, intro: '<script>' })).toBe(false);
    expect(bad({ ...good, id: 'Bad Id' })).toBe(false);
    expect(parseConfigPack(pack(Array.from({ length: 11 }, (_, i) => ({ ...good, id: `e${i}x` })))).ok).toBe(false);
    expect(parseConfigPack(pack([good])).ok).toBe(true);
  });
  it('loads events into content at start-up and blocks removal during a run', () => {
    let texts: string[] = [];
    const store: PackStore = { get: () => texts, set: (t) => void (texts = t) };
    expect(installPack(store, pack([good])).ok).toBe(true);
    const fake = { events: new Map(content.events) };
    expect(loadStoredPacks(store, fake).packs).toHaveLength(1);
    expect(fake.events.has('pack-test-pack-well')).toBe(true);
    expect(removeProblem(store, 'test-pack', true)).toContain('current run');
    expect(removeProblem(store, 'test-pack', false)).toBeNull();
    expect(removeProblem(store, 'other', true)).toBeNull();
  });
});

describe('plugin cue hooks (S344)', () => {
  const cues = (): Cue[][] => [[{ kind: 'pulse', side: 'player', color: '#fff' }], []];
  const events = [{ type: 'move' }, { type: 'damage' }];
  afterEach(() => hookNames().forEach(unregisterCueHook));
  it('lets a hook add a cue, without touching the original', () => {
    const original = cues();
    registerCueHook('add', (c) => (c[1]!.push({ kind: 'badge', side: 'enemy', badge: 'super' }), c));
    const out = applyCueHooks(original, events);
    expect(out[1]).toHaveLength(1);
    expect(original[1]).toHaveLength(0);
  });
  it('ignores hooks that throw, return the wrong shape or unknown cues', () => {
    registerCueHook('throws', () => { throw new Error('x'); });
    registerCueHook('short', () => []);
    registerCueHook('unknown', (c) => [[{ kind: 'nuke' } as never], c[1]!]);
    registerCueHook('null', () => null as never);
    expect(applyCueHooks(cues(), events)).toEqual(cues());
  });
  it('cannot change the events it is shown, and caps the number of hooks', () => {
    let frozen = false;
    registerCueHook('peek', (c, e) => { try { (e[0] as { type: string }).type = 'x'; } catch { frozen = true; } return c; });
    applyCueHooks(cues(), events);
    expect(frozen).toBe(true);
    expect(events[0]!.type).toBe('move');
    for (let i = 0; i < MAX_HOOKS + 3; i++) registerCueHook(`h${i}`, (c) => c);
    expect(hookNames().length).toBe(MAX_HOOKS);
    expect(registerCueHook('h1', (c) => c)).toBe(false);
  });
});

describe('atlas builder (S338)', () => {
  const py = (code: string, ...args: string[]) => spawnSync('python3', ['-I', '-c', code, ...args], { encoding: 'utf8' });
  const hasPil = py('import PIL').status === 0;
  (hasPil ? it : it.skip)('packs a folder into one atlas with non-overlapping frames, the same way twice', () => {
    const dir = mkdtempSync(join(tmpdir(), 'atlas-'));
    py('from PIL import Image; import sys\nfor n,w,h in [("a",16,16),("b",32,8),("c",10,40)]: Image.new("RGBA",(w,h),(255,0,0,255)).save(sys.argv[1]+"/"+n+".png")', dir);
    const outDir = mkdtempSync(join(tmpdir(), 'atlas-out-'));
    const run = (out: string) => execFileSync('python3', ['tools/build-atlas.py', dir, join(outDir, out)], { encoding: 'utf8' });
    expect(run('one')).toContain('3 images');
    run('two');
    const a = JSON.parse(readFileSync(join(outDir, 'one.json'), 'utf8')) as { frames: Record<string, { frame: { x: number; y: number; w: number; h: number } }>; meta: { size: { w: number; h: number } } };
    expect(readFileSync(join(outDir, 'one.json'), 'utf8').replace('one.png', 'x')).toBe(readFileSync(join(outDir, 'two.json'), 'utf8').replace('two.png', 'x'));
    const f = Object.values(a.frames).map((x) => x.frame);
    for (const r of f) expect(r.x + r.w <= a.meta.size.w && r.y + r.h <= a.meta.size.h).toBe(true);
    for (let i = 0; i < f.length; i++) for (let j = i + 1; j < f.length; j++) {
      const p = f[i]!, q = f[j]!;
      expect(p.x + p.w <= q.x || q.x + q.w <= p.x || p.y + p.h <= q.y || q.y + q.h <= p.y).toBe(true);
    }
    expect(existsSync(join(outDir, 'one.png'))).toBe(true);
  });
  (hasPil ? it : it.skip)('fails clearly when the images do not fit and when the folder is empty', () => {
    const dir = mkdtempSync(join(tmpdir(), 'atlas-'));
    expect(spawnSync('python3', ['tools/build-atlas.py', dir, join(dir, 'x')], { encoding: 'utf8' }).status).toBe(1);
    py('from PIL import Image; import sys\nfor n in "ab": Image.new("RGBA",(40,40)).save(sys.argv[1]+"/"+n+".png")', dir);
    const r = spawnSync('python3', ['tools/build-atlas.py', dir, join(dir, 'x'), '--max', '64'], { encoding: 'utf8' });
    expect(r.status).toBe(1);
    expect(r.stdout).toContain('do not fit');
  });
});
