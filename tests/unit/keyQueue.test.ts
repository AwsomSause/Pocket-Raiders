import { describe, expect, it } from 'vitest';
import { freshKeyEvents, patchKeyQueue } from '../../src/ui/keyQueue';

// A slow frame keeps [Digit2 up, Enter down, Enter up] in Phaser's key queue; each new key re-reads the whole queue.
// Phaser's own duplicate check compares only neighbours, so Enter down went out twice (one Enter, two confirms).

const ev = (type: string, code: string) => ({ type, code });

/** A stand-in for Phaser's KeyboardPlugin.update with its neighbour-only duplicate check. */
function fakePlugin(log: string[]) {
  const proto = {
    update(this: any) {
      for (const e of this.manager.queue) {
        if (e === this.prev) continue;
        this.prev = e;
        if (e.type === 'keydown') log.push(e.code);
      }
    },
  };
  return { proto, make: (manager: { queue: any[] }) => Object.assign(Object.create(proto), { manager }) };
}

describe('key queue: each key event reaches a scene once', () => {
  it('freshKeyEvents returns only unseen events and remembers them', () => {
    const a = ev('keydown', 'Enter'), b = ev('keyup', 'Enter');
    const seen = new WeakSet<object>();
    expect(freshKeyEvents([a], seen)).toEqual([a]);
    expect(freshKeyEvents([a, b], seen)).toEqual([b]);
    expect(freshKeyEvents([a, b], seen)).toEqual([]);
  });

  it('without the patch a three-event frame repeats Enter; with it, Enter acts once', () => {
    const run = (patched: boolean) => {
      const log: string[] = [];
      const { proto, make } = fakePlugin(log);
      if (patched) patchKeyQueue(proto);
      const manager = { queue: [] as any[] };
      const kb = make(manager);
      const d2up = ev('keyup', 'Digit2'), down = ev('keydown', 'Enter'), up = ev('keyup', 'Enter');
      manager.queue.push(d2up); kb.update();
      manager.queue.push(down); kb.update();
      manager.queue.push(up); kb.update();
      kb.update(); // the frame's own update
      return { log, queue: manager.queue };
    };
    expect(run(false).log).toEqual(['Enter', 'Enter', 'Enter']);
    const fixed = run(true);
    expect(fixed.log).toEqual(['Enter']);
    expect(fixed.queue).toHaveLength(3); // the frame's queue is left whole for other scenes
  });

  it('each scene still gets every event once, and a key raised inside a handler is kept for the next pass', () => {
    const log: string[] = [];
    const proto = {
      update(this: any) {
        const q = this.manager.queue;
        for (let i = 0, n = q.length; i < n; i++) {
          log.push(`${this.name}:${q[i].code}`);
          if (q[i].code === 'KeyT' && this.name === 'a') q.push(ev('keydown', 'Enter'));
        }
      },
    };
    patchKeyQueue(proto);
    patchKeyQueue(proto); // twice is harmless
    const manager = { queue: [ev('keydown', 'KeyT')] as any[] };
    const one = Object.assign(Object.create(proto), { manager, name: 'a' });
    const two = Object.assign(Object.create(proto), { manager, name: 'b' });
    one.update();
    two.update();
    one.update();
    expect(log).toEqual(['a:KeyT', 'b:KeyT', 'b:Enter', 'a:Enter']);
  });
});
