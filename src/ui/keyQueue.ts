// Phaser keeps a frame's key events in one queue and hands the whole queue to each scene's keyboard again every time a
// new key arrives (and once more in the frame's update). Its duplicate check only compares an event with the one just
// before it, so when a slow frame holds three or more events (Digit2 up, Enter down, Enter up), Enter down is handed
// out a second time: one press of Enter acts twice. This keeps a note of the events each scene's keyboard has already
// seen and hands it only the new ones.

/** The events in `queue` not in `seen`, which are added to `seen`. Pure apart from `seen`. */
export function freshKeyEvents<T extends object>(queue: readonly T[], seen: WeakSet<T>): T[] {
  const fresh = queue.filter((e) => !seen.has(e));
  for (const e of fresh) seen.add(e);
  return fresh;
}

type Plugin = { manager?: { queue: KeyboardEvent[] } | null; update: () => void; __seen?: WeakSet<KeyboardEvent> };

/** Wraps the keyboard plugin's update so that each event reaches a scene once. */
export function patchKeyQueue(proto: { update: () => void }): void {
  const p = proto as Plugin & { __patched?: boolean };
  if (p.__patched) return;
  p.__patched = true;
  const update = p.update;
  p.update = function (this: Plugin) {
    const m = this.manager;
    if (!m || !m.queue.length) return update.call(this);
    const all = m.queue;
    const fresh = freshKeyEvents(all, (this.__seen ??= new WeakSet()));
    if (!fresh.length) return;
    const n = fresh.length;
    m.queue = fresh;
    try {
      update.call(this);
    } finally {
      // A key a handler raised itself (touch or gamepad buttons) lands in `fresh`: keep it in the frame's queue. If
      // the queue was cleared meanwhile, it stays cleared.
      if (m.queue === fresh) {
        m.queue = all;
        all.push(...fresh.slice(n));
      }
    }
  };
}
