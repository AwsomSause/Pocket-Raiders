// Each scene hears each key event once.
//
// Phaser keeps the key events of a frame in one queue and hands a scene the WHOLE queue again at every new key event;
// its own guard only remembers the event before. So when three or more key events land inside one frame (a slow
// frame, or fast presses), an earlier press reaches the scene a second time: one press of Down moves the cursor twice.
// This wraps the keyboard plugin's `update` so that it only sees the events it has not seen yet.

type KeyPlugin = { manager: { queue: object[] } };

/** `update`, made to run only on the queue's events this plugin has not been given before. */
export function onceEach<T extends KeyPlugin>(update: (this: T) => void): (this: T) => void {
  const given = new WeakMap<object, WeakSet<object>>();
  return function (this: T): void {
    const all = this.manager.queue;
    let mine = given.get(this);
    if (!mine) given.set(this, (mine = new WeakSet()));
    const fresh: object[] = [];
    for (const e of all) if (!mine.has(e)) { mine.add(e); fresh.push(e); }
    if (!fresh.length) return;
    const n = fresh.length;
    this.manager.queue = fresh;
    try {
      update.call(this);
    } finally {
      // A handler may have sent a key event of its own (a touch swipe does): it stays in the frame's queue.
      if (this.manager.queue === fresh) {
        for (const e of fresh.slice(n)) all.push(e);
        this.manager.queue = all;
      }
    }
  };
}

/** Puts the guard on a keyboard plugin class (once, before the game starts). */
export function installKeyOnce(proto: { update: () => void; keyOnce?: boolean }): void {
  if (proto.keyOnce) return;
  proto.keyOnce = true;
  proto.update = onceEach(proto.update as (this: KeyPlugin) => void) as () => void;
}
