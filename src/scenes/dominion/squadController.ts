// DOMINION slice D8: the controller for the Squads page (mockup 13, U on the Crew File), kept beside DominionScene so the
// scene only forwards to it. It keeps the cursors and the builder's draft; every change goes through
// GameSession.dominionStep (saved). The Code Name is typed on the shared form (askText), so letter keys never leak.

import type Phaser from 'phaser';
import { DOMINION_DATA } from '../../core/dominion/data';
import {
  CARDS_PER_PAGE, editDraft, freeFor, GROUP_ROWS, groupBuilder, groupLeaders, leadersFor, newDraft, newGroupDraft, orderRows, SQUAD_ROWS, squadBuilder, squadsModel,
  traitRows, type BuilderRow,
} from '../../core/dominion/squadScreens';
import { suggestions } from '../../core/dominion/squads';
import { dominionBlock } from '../../core/dominion/session';
import type { DominionAction, GroupDraft, SquadDraft } from '../../core/dominion/schema';
import { services } from '../../game/services';
import type { InputAction } from '../../ui/input';
import { askText } from '../../ui/redux/ask';
import { squadsView } from '../../ui/redux/screens/dominion/squads';

type ScreenName = 'title' | 'setup' | 'opening' | 'hq' | 'map' | 'card' | 'crew' | 'reserve' | 'pyramid' | 'base' | 'rival' | 'squads';
interface Host {
  screenName: ScreenName;
  setNotice(n: string | null): void;
  refresh(): void;
  step(a: DominionAction): boolean;
}

const Q = () => DOMINION_DATA.squads;
const wrap = (i: number, n: number): number => (n ? ((i % n) + n) % n : 0);

export class SquadController {
  private sel = 0;
  private page = 0;
  private focus: 'cards' | 'builder' = 'cards';
  private mode: 'squad' | 'group' = 'squad';
  private row = 0;
  private candAt = 0;
  private draft: SquadDraft | null = null;
  private gdraft: GroupDraft | null = null;
  private picker: { kind: 'order' | 'trait'; at: number } | null = null;
  private armed = false;
  private notice: string | null = null;
  private typing = false;
  /** When the typing form closed: the Enter that closed it can reach the scene a frame later and must not reopen it. */
  private closedAt = -1e9;

  constructor(private readonly host: Host, private readonly scene: Phaser.Scene) {}

  private block() {
    return dominionBlock(services().session.run);
  }
  owns(): boolean {
    return this.host.screenName === 'squads';
  }
  private list() {
    return this.block()?.squads?.list ?? [];
  }
  private rows(): BuilderRow[] {
    return this.mode === 'group' ? GROUP_ROWS : SQUAD_ROWS;
  }
  private sq(): SquadDraft {
    const b = this.block()!;
    this.draft ??= newDraft(b);
    return this.draft;
  }
  private gr(): GroupDraft {
    this.gdraft ??= newGroupDraft(this.block()!);
    return this.gdraft;
  }

  render(notice: string | null): string {
    const b = this.block();
    if (!b) return '';
    this.sel = Math.min(this.sel, Math.max(0, this.list().length - 1));
    const initial = b.teamName?.[0]?.toUpperCase() ?? 'N';
    const rowId = this.rows()[Math.min(this.row, this.rows().length - 1)]!;
    const bm = this.mode === 'group'
      ? groupBuilder(b, this.gr(), rowId, this.candAt, this.focus === 'builder', initial)
      : squadBuilder(b, this.sq(), rowId, this.candAt, this.focus === 'builder', initial);
    const m = squadsModel(b, this.sel, this.page, bm, this.picker);
    this.page = m.page;
    return squadsView(m, notice ?? this.notice);
  }

  private say(n: string | null): void {
    this.notice = n;
    this.host.setNotice(null);
  }
  private go(a: DominionAction): boolean {
    this.notice = null;
    return this.host.step(a);
  }

  private open(): void {
    this.host.screenName = 'squads';
    this.focus = this.list().length ? 'cards' : 'builder';
    this.picker = null;
    this.armed = false;
    this.say(null);
  }

  // ---------- the builder ----------

  private typeName(): void {
    if (this.typing) return;
    const d = this.mode === 'group' ? this.gr() : this.sq();
    this.typing = true;
    void askText(this.scene, {
      title: this.mode === 'group' ? 'Group' : 'Squad', area: 'sys', heading: 'Code Name', value: d.codeName,
      text: `Up to ${Q().codeName.max} letters. It goes on the Roster, the map, the Night Report and every Job Card.`, ok: 'Name it',
    }).then((v) => {
      this.typing = false;
      this.closedAt = performance.now();
      if (v !== null) d.codeName = v.trim().slice(0, Q().codeName.max);
      this.host.refresh();
    });
  }

  private change(dir: number): void {
    const b = this.block()!;
    const row = this.rows()[this.row]!;
    if (this.mode === 'group') {
      const d = this.gr();
      if (row === 'leader') {
        const ls = groupLeaders(b);
        if (ls.length) d.leader = ls[wrap(ls.findIndex((m) => m.id === d.leader) + dir, ls.length)]!.id;
      } else if (row === 'incentive') this.cycleIncentive(dir);
      else if (row === 'members') this.candAt = wrap(this.candAt + dir, this.list().length);
      return;
    }
    const d = this.sq();
    switch (row) {
      case 'name': {
        const ideas = suggestions(b, [d.leader, ...d.members]);
        if (ideas.length) d.codeName = ideas[wrap(ideas.indexOf(d.codeName) + dir, ideas.length)]!;
        break;
      }
      case 'leader': {
        const ls = leadersFor(b, d.id);
        if (!ls.length) break;
        const next = ls[wrap(ls.findIndex((m) => m.id === d.leader) + dir, ls.length)]!;
        d.members = d.members.filter((x) => x !== next.id);
        d.leader = next.id;
        break;
      }
      case 'incentive': this.cycleIncentive(dir); break;
      case 'target': {
        if (d.incentive === 'vengeance') {
          const ts = Q().targets;
          d.target = ts[wrap(ts.findIndex((t) => t.id === d.target) + dir, ts.length)]!.id;
        } else this.cycleFocus(dir);
        break;
      }
      case 'mark': d.mark = wrap(d.mark + dir, Q().marks.length); break;
      case 'members': {
        const pool = freeFor(b, d.id).filter((m) => m.id !== d.leader);
        this.candAt = wrap(this.candAt + dir, pool.length);
        break;
      }
    }
  }
  private cycleIncentive(dir: number): void {
    const all = Q().incentives;
    const d = this.mode === 'group' ? this.gr() : this.sq();
    d.incentive = all[wrap(all.findIndex((x) => x.id === d.incentive) + dir, all.length)]!.id;
    if (this.mode === 'squad' && d.incentive === 'vengeance' && !this.sq().target) this.sq().target = Q().targets.find((t) => t.live)?.id ?? null;
  }
  private cycleFocus(dir: number): void {
    const d = this.sq();
    const ids = [null, ...Q().focus.map((f) => f.id)];
    d.focus = ids[wrap(ids.indexOf(d.focus) + dir, ids.length)] ?? null;
  }
  private toggle(): void {
    const b = this.block()!;
    if (this.mode === 'group') {
      const d = this.gr();
      const s = this.list()[this.candAt];
      if (s) d.squads = d.squads.includes(s.id) ? d.squads.filter((x) => x !== s.id) : [...d.squads, s.id];
      return;
    }
    const d = this.sq();
    const m = freeFor(b, d.id).filter((x) => x.id !== d.leader)[this.candAt];
    if (m) d.members = d.members.includes(m.id) ? d.members.filter((x) => x !== m.id) : [...d.members, m.id];
  }
  private submit(): void {
    if (this.mode === 'group') {
      const d = this.gr();
      if (this.go({ t: 'groupSave', draft: structuredClone(d) })) {
        this.gdraft = null;
        this.mode = 'squad';
        this.focus = 'cards';
      }
      return;
    }
    const d = this.sq();
    if (this.go({ t: 'squadSave', draft: structuredClone(d) })) {
      const id = d.id;
      this.draft = null;
      this.row = 0;
      this.candAt = 0;
      this.focus = 'cards';
      const at = this.list().findIndex((s) => s.id === id);
      this.sel = at >= 0 ? at : this.list().length - 1;
      this.page = Math.floor(this.sel / CARDS_PER_PAGE);
    }
  }
  private builderConfirm(): void {
    const row = this.rows()[this.row]!;
    if (row === 'name') this.typeName();
    else if (row === 'members') this.toggle();
    else this.submit();
  }

  // ---------- the cards ----------

  private edit(): void {
    const s = this.list()[this.sel];
    if (!s) return;
    this.mode = 'squad';
    this.draft = editDraft(s);
    this.focus = 'builder';
    this.row = 0;
    this.candAt = 0;
  }
  private moveCard(a: InputAction): void {
    const n = this.list().length;
    if (!n) return;
    const d = a === 'left' ? -1 : a === 'right' ? 1 : a === 'up' ? -2 : 2;
    this.sel = wrap(this.sel + d, n);
    this.page = Math.floor(this.sel / CARDS_PER_PAGE);
  }
  private pickConfirm(): void {
    const b = this.block()!;
    const s = this.list()[this.sel];
    if (!s || !this.picker) return;
    const rows = this.picker.kind === 'order' ? orderRows(b, s) : traitRows(s);
    const r = rows[Math.max(0, Math.min(this.picker.at, rows.length - 1))];
    if (!r || r.locked) return;
    const ok = this.picker.kind === 'order' ? this.go({ t: 'squadOrder', squad: s.id, task: r.id || null }) : this.go({ t: 'squadTrait', squad: s.id, trait: r.id });
    if (ok) this.picker = null;
  }

  /** Tap targets (data-act). */
  acts(): Record<string, (arg: string) => void> {
    const r = (f: () => void) => (): void => { f(); this.host.refresh(); };
    return {
      sqCard: (i) => { const at = this.page * CARDS_PER_PAGE + Number(i); const again = this.sel === at && this.focus === 'cards'; this.sel = at; this.focus = 'cards'; this.picker = again ? { kind: 'order', at: 0 } : null; this.host.refresh(); },
      sqCardPage: (d) => r(() => { const n = Math.max(1, Math.ceil(this.list().length / CARDS_PER_PAGE)); this.page = wrap(this.page + Number(d), n); this.sel = this.page * CARDS_PER_PAGE; })(),
      sqRow: (id) => r(() => { this.focus = 'builder'; this.picker = null; const i = this.rows().indexOf(id as BuilderRow); if (i >= 0) this.row = i; })(),
      sqName: () => { this.focus = 'builder'; this.row = 0; this.typeName(); },
      sqInc: (id) => r(() => { const d = this.mode === 'group' ? this.gr() : this.sq(); d.incentive = id; if (this.mode === 'squad' && id === 'vengeance' && !this.sq().target) this.sq().target = Q().targets.find((t) => t.live)?.id ?? null; })(),
      sqIncMore: r(() => this.cycleIncentive(1)),
      sqForm: () => { this.submit(); this.host.refresh(); },
      sqPick: (i) => { if (!this.picker) return; const again = this.picker.at === Number(i); this.picker.at = Number(i); if (again) this.pickConfirm(); this.host.refresh(); },
    };
  }
  overs(): Record<string, (arg: string) => void> {
    return {
      sqCardOver: (i) => { if (this.focus !== 'cards' || this.picker) return; this.sel = this.page * CARDS_PER_PAGE + Number(i); this.host.refresh(); },
      sqPickOver: (i) => { if (this.picker) { this.picker.at = Number(i); this.host.refresh(); } },
    };
  }

  /** Tab 1 goes back to the HQ from the Squads page. */
  tab(i: number): boolean {
    if (!this.owns() || i !== 0) return false;
    this.host.screenName = 'hq';
    this.say(null);
    return true;
  }

  /** Letter keys. U on the Crew File opens the Squads page. On the page every letter key but Q is its own. */
  raw(code: string): boolean {
    if (this.host.screenName === 'crew' && code === 'KeyU') {
      this.open();
      this.host.refresh();
      return true;
    }
    // Q (hold: the command wheel) and End (quit to title) belong to the whole scene; digits are the tabs.
    if (!this.owns() || this.typing || code.startsWith('Digit') || code === 'KeyQ' || code === 'End') return false;
    // W, A, S and D are arrow keys (onInputAction); Enter and Esc come there too.
    if (['KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(code)) return true;
    const b = this.block();
    if (!b) return true;
    const s = this.list()[this.sel];
    if (code !== 'KeyX') this.armed = false;
    switch (code) {
      case 'Tab':
        this.picker = null;
        this.focus = this.focus === 'cards' ? 'builder' : 'cards';
        break;
      case 'KeyE': if (s) this.edit(); break;
      case 'KeyN': this.focus = 'builder'; this.row = 0; this.typeName(); break;
      case 'KeyF': if (this.mode === 'squad') this.cycleFocus(1); break;
      case 'KeyG':
        this.mode = this.mode === 'group' ? 'squad' : 'group';
        this.focus = 'builder';
        this.row = 0;
        this.candAt = 0;
        this.picker = null;
        break;
      case 'KeyT': if (s?.offered.length) { this.focus = 'cards'; this.picker = { kind: 'trait', at: 0 }; } break;
      case 'KeyX':
        if (!s || this.focus !== 'cards') break;
        if (this.armed) {
          this.armed = false;
          this.go({ t: 'squadDisband', squad: s.id });
        } else {
          this.armed = true;
          this.say(`Break up ${s.codeName}?${s.cohesion >= 80 ? ' They are Family: everyone loses Morale and one may walk out.' : ''} Press X again.`);
        }
        break;
      case 'BracketLeft': case 'BracketRight': {
        const n = Math.max(1, Math.ceil(this.list().length / CARDS_PER_PAGE));
        this.page = wrap(this.page + (code === 'BracketLeft' ? -1 : 1), n);
        this.sel = Math.min(this.list().length - 1, this.page * CARDS_PER_PAGE);
        break;
      }
      default: break;
    }
    this.host.refresh();
    return true;
  }

  /** Arrow keys, Enter and Esc on the page. Returns true when handled. */
  key(a: InputAction): boolean {
    if (!this.owns() || this.typing) return this.owns();
    if (!this.block()) return false;
    if (a === 'confirm' && performance.now() - this.closedAt < 300) return true;
    if (this.picker) {
      const b = this.block()!;
      const s = this.list()[this.sel];
      const n = s ? (this.picker.kind === 'order' ? orderRows(b, s).length : traitRows(s).length) : 0;
      if (a === 'back') this.picker = null;
      else if (a === 'up' || a === 'left') this.picker.at = wrap(this.picker.at - 1, n);
      else if (a === 'down' || a === 'right') this.picker.at = wrap(this.picker.at + 1, n);
      else if (a === 'confirm') this.pickConfirm();
      return true;
    }
    if (a === 'back') {
      if (this.focus === 'builder' && this.list().length) {
        this.focus = 'cards';
        this.draft = null;
        this.gdraft = null;
        this.mode = 'squad';
      } else this.host.screenName = 'crew';
      this.say(null);
      return true;
    }
    if (this.focus === 'cards') {
      if (a === 'confirm') { if (this.list()[this.sel]) this.picker = { kind: 'order', at: 0 }; } else this.moveCard(a);
      return true;
    }
    const n = this.rows().length;
    if (a === 'up') this.row = wrap(this.row - 1, n);
    else if (a === 'down') this.row = wrap(this.row + 1, n);
    else if (a === 'left' || a === 'right') this.change(a === 'left' ? -1 : 1);
    else if (a === 'confirm') this.builderConfirm();
    return true;
  }

  /** Test hooks. */
  state(): { sel: number; focus: string; mode: string; row: string; draft: SquadDraft | GroupDraft | null; picker: string | null } {
    return { sel: this.sel, focus: this.focus, mode: this.mode, row: this.rows()[this.row]!, draft: this.mode === 'group' ? this.gdraft : this.draft, picker: this.picker?.kind ?? null };
  }
}
