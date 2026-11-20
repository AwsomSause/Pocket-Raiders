// DOMINION slice D25: the controller for the Evening voices scene (mockup a10), kept beside DominionScene. It is an
// overlay on the HQ: V opens it (or the HQ chip), V / Esc / Enter close it. Opening it sends the evening's Rotom calls
// (when a Key-Card is in the vault and Rotom is on); each answer is stored with the run and the scene redraws. Without
// a key nothing is sent and the written lines are the whole scene.

import { askClaude } from '../../ai/ask';
import { dominionBlock } from '../../core/dominion/session';
import { rotomAsks, voicesModel } from '../../core/dominion/voices';
import { services } from '../../game/services';
import type { InputAction } from '../../ui/input';
import { voicesView } from '../../ui/redux/screens/dominion/voicesViews';

interface Host {
  refresh(): void;
  /** True on the HQ with nothing else open on it (no crew talk). */
  onHq(): boolean;
}

export class VoicesController {
  on = false;

  constructor(private readonly host: Host) {}

  private block() {
    return dominionBlock(services().session.run);
  }

  open(): boolean {
    const b = this.block();
    if (!b?.opened || !this.host.onHq()) return false;
    this.on = true;
    this.ask();
    return true;
  }

  close(): void {
    this.on = false;
  }

  /** Sends the calls not answered yet (askClaude plays offline, storing nothing, when there is no key). */
  private ask(): void {
    const { session } = services();
    const run = session.run, b = this.block(), env = session.aiEnv();
    if (!run || !b || !env) return;
    for (const a of rotomAsks(b, run.seed, env.log)) {
      void askClaude({ id: a.id, role: 'line', use: a.use, system: a.system, context: a.context, input: a.input, offline: () => '' }, env)
        .then((r) => { if (r.source === 'ai' && this.on) this.host.refresh(); })
        .catch(() => undefined);
    }
  }

  render(): string {
    const run = services().session.run, b = this.block();
    return run && b ? voicesView(voicesModel(b, run.seed, run.ai)) : '';
  }

  acts(): Record<string, (arg: string) => void> {
    return {
      voicesOpen: () => { if (this.open()) this.host.refresh(); },
      voicesClose: () => { this.close(); this.host.refresh(); },
    };
  }

  /** Enter or Esc closes it; every other key is eaten while it is open. */
  key(a: InputAction): boolean {
    if (!this.on) return false;
    if (a === 'confirm' || a === 'back') this.close();
    return true;
  }

  /** V opens it from the HQ and closes it again; other letters do nothing while it is open. */
  raw(code: string): boolean {
    if (this.on) {
      if (code === 'KeyV') this.close();
      this.host.refresh();
      return true;
    }
    if (code === 'KeyV' && this.open()) {
      this.host.refresh();
      return true;
    }
    return false;
  }
}
