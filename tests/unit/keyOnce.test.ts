import { describe, expect, it } from 'vitest';
import { installKeyOnce, onceEach } from '../../src/ui/keyOnce';

// A stand-in for Phaser's keyboard plugin: `update` hands every event in the frame's queue to the scene, and (like
// Phaser's own guard) only skips the event it handled last.
type Stub = { manager: { queue: object[] }; got: object[]; prev: object | null; update(this: Stub): void };
function plugin(queue: object[]): Stub {
  return {
    manager: { queue },
    got: [],
    prev: null,
    update(this: Stub): void {
      for (const e of this.manager.queue) { if (e === this.prev) continue; this.prev = e; this.got.push(e); }
    },
  };
}
const ev = (n: string): object => ({ n });

describe('each scene hears each key event once', () => {
  it('without the guard, the third key event of a frame hands the first one over again', () => {
    const queue: object[] = [], p = plugin(queue), [a, b, c] = [ev('down'), ev('up'), ev('down2')];
    for (const e of [a, b, c]) { queue.push(e); p.update(); }
    expect(p.got).toEqual([a, b, a, b, c]);
  });

  it('with it, every event of the frame is handed over once, in order', () => {
    const queue: object[] = [], p = plugin(queue), events = ['d1', 'u1', 'd2', 'u2', 'd3', 'u3'].map(ev);
    p.update = onceEach(p.update);
    for (const e of events) { queue.push(e); p.update(); }
    expect(p.got).toEqual(events);
    // The frame's queue is left as it was for the other scenes.
    expect(p.manager.queue).toBe(queue);
    expect(queue).toEqual(events);
    // Nothing new: nothing happens.
    p.update();
    expect(p.got).toEqual(events);
  });

  it('two scenes on one queue each hear every event once', () => {
    const queue: object[] = [], one = plugin(queue), two = plugin(queue), events = ['d1', 'u1', 'd2'].map(ev);
    const guarded = onceEach(one.update);
    one.update = guarded;
    two.update = guarded;
    two.manager = one.manager;
    for (const e of events) { queue.push(e); one.update(); two.update(); }
    expect(one.got).toEqual(events);
    expect(two.got).toEqual(events);
  });

  it('an event sent from inside a handler stays in the queue and is heard once', () => {
    const queue: object[] = [], heard: object[] = [], extra = ev('sent');
    const p = {
      manager: { queue },
      update(this: { manager: { queue: object[] } }): void {
        for (const e of [...this.manager.queue]) { heard.push(e); if (heard.length === 1) this.manager.queue.push(extra); }
      },
    };
    p.update = onceEach(p.update);
    const first = ev('d1');
    queue.push(first);
    p.update();
    expect(queue).toEqual([first, extra]);
    p.update();
    expect(heard).toEqual([first, extra]);
  });

  it('a new frame (a new queue) starts clean, and installing twice wraps once', () => {
    const p = plugin([]), a = ev('a');
    const proto: { update: () => void; keyOnce?: boolean } = { update: p.update };
    installKeyOnce(proto);
    const wrapped = proto.update;
    installKeyOnce(proto);
    expect(proto.update).toBe(wrapped);
    p.update = proto.update as Stub['update'];
    p.manager.queue = [a];
    p.update();
    const b = ev('b');
    p.manager.queue = [b];
    p.update();
    p.update();
    expect(p.got).toEqual([a, b]);
  });
});
