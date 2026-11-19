// DOMINION slice D3: the controller for the Morning (mockup 2) and the Crew File (mockup 5), kept beside DominionScene so
// the scene only forwards to it. It keeps the cursors; every change goes through GameSession.dominionStep (saved).

import { pokemonAssetIds, type AssetManifest } from '../../assets/catalog';
import { crewOf } from '../../core/dominion/crew';
import { fileModel, hireModel, leadsModel, morningModel, personaModel } from '../../core/dominion/crewScreens';
import { DOMINION_DATA } from '../../core/dominion/data';
import { dominionBlock } from '../../core/dominion/session';
import type { DominionAction } from '../../core/dominion/schema';
import { services } from '../../game/services';
import type { InputAction } from '../../ui/input';
import { rxFileOf } from '../../ui/redux/assets';
import { fileView, hireOverlay, leadsOverlay, morningView } from '../../ui/redux/screens/dominion/crew';
import { personaView } from '../../ui/redux/screens/dominion/persona';

interface Host {
  screenName: 'title' | 'setup' | 'opening' | 'hq' | 'map' | 'card' | 'crew';
  setNotice(n: string | null): void;
  refresh(): void;
  step(a: DominionAction): boolean;
  cache: { json: { get(k: string): unknown } };
}

export class CrewController {
  private sel = 0;
  /** -1: the Start the day button has the focus. */
  private taskAt = -1;
  private all = false;
  private talkAt = 0;
  private overlay: 'hire' | 'leads' | null = null;
  private pickAt = 0;
  private pitchAt = 0;
  /** D19: the personality card page of the Crew File (P opens it, Esc goes back to the file). */
  private persona = false;

  constructor(private readonly host: Host) {}

  private block() {
    return dominionBlock(services().session.run);
  }
  private talking(): boolean {
    return !!this.block()?.crew?.talks.length;
  }
  /** The HQ draws the Morning while it's morning (D3 replaces D1's Night Report panel). */
  owns(): boolean {
    return this.host.screenName === 'hq' && this.block()?.phase === 'morning';
  }
  private active(): boolean {
    return this.owns() || this.host.screenName === 'crew';
  }

  render(notice: string | null): string {
    const b = this.block();
    if (!b) return '';
    this.sel = Math.min(this.sel, b.members.length - 1);
    if (this.host.screenName === 'crew') {
      const seed = services().session.run!.seed;
      if (this.persona && !this.talking()) return personaView(personaModel(b, this.sel, seed), (s) => this.monFile(s));
      const overlay = this.overlay === 'hire' ? hireOverlay(hireModel(b, seed), this.pickAt) : this.overlay === 'leads' ? leadsOverlay(leadsModel(b, seed), this.pickAt, this.pitchAt) : '';
      return fileView(fileModel(b, this.sel), (s) => this.monFile(s), notice, overlay, this.talkAt);
    }
    return morningView(morningModel(b, this.sel, this.taskAt, this.all), notice, this.talkAt);
  }

  private monFile(species: string): string | null {
    const manifest = this.host.cache.json.get('manifest') as AssetManifest | undefined;
    const sp = services().session.content.species.get(species);
    return sp ? rxFileOf(manifest, pokemonAssetIds(sp.assets).front)?.file ?? null : null;
  }

  private member(): string | null {
    return this.block()?.members[this.sel]?.id ?? null;
  }
  private tasks(): string[] {
    const b = this.block();
    return b ? morningModel(b, this.sel, this.taskAt, this.all).tasks.map((t) => t.id) : [];
  }

  private answer(i: number): void {
    if (this.host.step({ t: 'talk', choice: i })) this.talkAt = 0;
  }
  private assign(i: number): void {
    const id = this.tasks()[i];
    const m = this.member();
    if (!id || !m) return;
    this.taskAt = i;
    if (this.host.step({ t: 'assign', member: m, task: id })) this.host.setNotice(null);
  }

  /** Tap targets (data-act). */
  acts(): Record<string, (arg: string) => void> {
    return {
      talk: (i) => this.answer(Number(i)),
      task: (i) => this.assign(Number(i)),
      crewMember: (i) => { this.sel = Number(i); this.taskAt = -1; this.host.refresh(); },
      moreTasks: () => { this.all = !this.all; this.taskAt = 0; this.host.refresh(); },
      flip: (d) => this.flip(Number(d)),
      hire: (i) => { this.pickAt = Number(i); this.pickConfirm(); },
      lead: (i) => { this.pickAt = Number(i); this.pitchAt = 0; this.host.refresh(); },
      pitch: (i) => { this.pitchAt = Number(i); this.pickConfirm(); },
      admit: () => this.pickConfirm(),
      persona: () => this.togglePersona(),
    };
  }
  overs(): Record<string, (arg: string) => void> {
    return {
      talkOver: (i) => { this.talkAt = Number(i); this.host.refresh(); },
      taskOver: (i) => { this.taskAt = Number(i); this.host.refresh(); },
      pickOver: (i) => { this.pickAt = Number(i); this.host.refresh(); },
    };
  }

  private flip(d: number): void {
    const n = this.block()?.members.length ?? 1;
    this.sel = (this.sel + d + n) % n;
    this.host.setNotice(null);
    this.host.refresh();
  }

  private togglePersona(): void {
    this.persona = !this.persona;
    this.overlay = null;
    this.host.setNotice(null);
    this.host.refresh();
  }

  private pickConfirm(): void {
    const b = this.block();
    if (!b) return;
    if (this.overlay === 'hire') this.host.step({ t: 'hire', index: this.pickAt });
    else if (this.overlay === 'leads') {
      const lead = b.crew?.leads[this.pickAt];
      if (!lead) return;
      const pitch = DOMINION_DATA.crew.recruit.pitches[this.pitchAt]!.id;
      this.host.step(lead.waiting ? { t: 'admit', lead: lead.id } : { t: 'approach', lead: lead.id, pitch });
      this.pickAt = Math.min(this.pickAt, Math.max(0, (this.block()?.crew?.leads.length ?? 1) - 1));
    }
  }

  /** Tab keys: Roster (3) opens the Crew File; HQ (1) goes back. Returns true when handled. */
  tab(i: number): boolean {
    if (i === 2) {
      this.host.screenName = 'crew';
      this.overlay = null;
      this.persona = false;
      this.host.setNotice(null);
      return true;
    }
    if (i === 0 && this.host.screenName === 'crew') {
      this.host.screenName = 'hq';
      this.overlay = null;
      this.persona = false;
      this.host.setNotice(null);
      return true;
    }
    return false;
  }

  /** Letter keys on the Crew File and the Morning. Returns true when handled. */
  raw(code: string): boolean {
    const b = this.block();
    if (!b || !this.active()) return false;
    if (this.owns() && code === 'KeyM' && !this.talking()) {
      this.all = !this.all;
      this.taskAt = 0;
      this.host.refresh();
      return true;
    }
    if (this.host.screenName !== 'crew' || this.overlay || this.talking()) return false;
    const m = b.members[this.sel];
    if (!m) return false;
    if (code === 'KeyP') return this.togglePersona(), true;
    if (this.persona) {
      if (code === 'KeyQ' || code === 'KeyE') return this.flip(code === 'KeyQ' ? -1 : 1), true;
      return false;
    }
    const go = (a: DominionAction): boolean => (this.host.step(a), true);
    switch (code) {
      case 'KeyT':
        return go({ t: 'evTalk', member: m.id });
      case 'KeyB':
        return go({ t: 'bail', member: m.id });
      case 'KeyG': {
        const run = services().session.run!;
        const item = (run.inventory['rare-candy'] ?? 0) > 0 ? 'rare-candy' : Object.keys(run.looseHeld ?? {}).sort().find((k) => (run.looseHeld![k] ?? 0) > 0);
        if (!item) {
          this.host.setNotice('Nothing to give: a Rare Candy (+1 member level) or a held item (+Morale).');
          this.host.refresh();
          return true;
        }
        return go({ t: 'gift', member: m.id, item });
      }
      case 'KeyH':
        this.overlay = 'hire';
        this.pickAt = 0;
        this.host.setNotice(null);
        this.host.refresh();
        return true;
      case 'KeyR':
        this.overlay = 'leads';
        this.pickAt = 0;
        this.pitchAt = 0;
        this.host.setNotice(null);
        this.host.refresh();
        return true;
    }
    return false;
  }

  /** Arrow keys, Enter and Esc. Returns true when handled. */
  key(a: InputAction): boolean {
    if (!this.active()) return false;
    const b = this.block()!;
    if (this.talking()) {
      const n = b.crew!.talks.length ? (morningModel(b, this.sel, this.taskAt, this.all).talk?.choices.length ?? 1) : 1;
      if (a === 'up' || a === 'down') this.talkAt = (this.talkAt + (a === 'up' ? -1 : 1) + n) % n;
      else if (a === 'confirm') this.answer(this.talkAt);
      return a !== 'back';
    }
    if (this.host.screenName === 'crew') {
      if (this.overlay) {
        const rows = this.overlay === 'hire' ? hireModel(b, services().session.run!.seed).rows.length : b.crew?.leads.length ?? 0;
        if (a === 'back') this.overlay = null;
        else if ((a === 'up' || a === 'down') && rows) this.pickAt = (this.pickAt + (a === 'up' ? -1 : 1) + rows) % rows;
        else if (this.overlay === 'leads' && (a === 'left' || a === 'right')) this.pitchAt = (this.pitchAt + (a === 'left' ? -1 : 1) + 4) % 4;
        else if (a === 'confirm') this.pickConfirm();
        return true;
      }
      if (a === 'left' || a === 'right') this.flip(a === 'left' ? -1 : 1);
      else if (a === 'back' && this.persona) this.togglePersona();
      else if (a === 'back') {
        this.host.screenName = 'hq';
        this.host.setNotice(null);
      }
      return true;
    }
    // The Morning: ◀ ▶ pick the member, ▲ ▼ the task (from the Start button), Enter assigns or starts the day.
    const n = this.tasks().length;
    if (a === 'left' || a === 'right') {
      const k = b.members.length;
      this.sel = (this.sel + (a === 'left' ? -1 : 1) + k) % k;
      return true;
    }
    if (a === 'up' || a === 'down') {
      const next = this.taskAt + (a === 'up' ? -1 : 1);
      this.taskAt = next < -1 ? n - 1 : next >= n ? -1 : next;
      return true;
    }
    if (a === 'confirm' && this.taskAt >= 0) {
      this.assign(this.taskAt);
      return true;
    }
    if (a === 'back' && this.all) {
      this.all = false;
      this.taskAt = -1;
      return true;
    }
    return false;
  }

  /** Who the selected member is (tests). */
  current(): string | null {
    const m = this.block()?.members[this.sel];
    return m ? crewOf(m).task : null;
  }
}
