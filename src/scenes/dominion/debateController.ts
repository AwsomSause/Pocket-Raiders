// DOMINION slice D13: the controller for the Debate (mockup 8), kept beside DominionScene so the scene only forwards to
// it. It keeps the cursor (stance, line, the Convinced pick); every turn goes through GameSession.dominionStep (saved).
// Keys: 1-4 or ◀▶ pick a stance, ▲▼ a set line, Enter argues; Esc walks out (asked twice). Convinced: 1 Merger, 2 Branch.
// D20 (the Rotom path, mockup a4): T opens the shared typing box (src/ui/typeBox.ts); the words go to Rotom's judge when a
// Key-Card is in (askClaude, stored in `run.ai`, so a reload never asks again), else the rules read them. The turn is
// played by the rules (GameSession.dominionStep, saved), then the Boss's reply streams in from Rotom (or the written
// reply types itself); B skips the typing, Enter goes back to the table. Waiting never changes the bar.

import { askClaude } from '../../ai/ask';
import { storedAnswer } from '../../core/ai/rules';
import { DOMINION_DATA } from '../../core/dominion/data';
import { debateModel, typedModel, type DebateCursor, type TypedCursor } from '../../core/dominion/debateScreens';
import { judgeAsk, replyAsk } from '../../core/dominion/debateTyped';
import { closeTypeBox, openTypeBox, typeBoxOpen } from '../../ui/typeBox';
import { fill } from '../../core/dominion/worldTurn';
import { dominionBlock } from '../../core/dominion/session';
import type { DominionAction } from '../../core/dominion/schema';
import { services } from '../../game/services';
import type { InputAction } from '../../ui/input';
import { debateTypedView, debateView } from '../../ui/redux/screens/dominion/debate';

type Screen = 'title' | 'setup' | 'opening' | 'hq' | 'map' | 'card' | 'crew' | 'reserve' | 'pyramid' | 'base' | 'rival' | 'ledger' | 'hero' | 'interrupt' | 'desk' | 'squads' | 'founding' | 'founded' | 'debate' | 'spy';
interface Host {
  screenName: Screen;
  setNotice(n: string | null): void;
  refresh(): void;
  debateStep(a: DominionAction): { ok: boolean; notice: string | null };
}

const STANCE_KEYS: Record<string, number> = { Digit1: 0, Digit2: 1, Digit3: 2, Digit4: 3 };
/** The written reply types itself at this many characters a second (instant with reduced motion). */
const TYPE_CPS = 60;
/** Rotom's chips: never a model name (Kice: players see "Rotom"). */
const chipOf = (m: string | undefined): string | null => (m ? (m === 'haiku' ? 'Quick' : 'Deep') : null);

export class DebateController {
  private cur: DebateCursor = { stance: 0, line: 0 };
  private notice: string | null = null;
  private leaving = false;
  /** D20: the typed turn playing out on the k4 page (presentation only). */
  private typed: TypedCursor | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private alive = true;

  constructor(private readonly host: Host) {}

  /** The scene shuts down: a typing box still open closes without sending; a late answer is dropped. */
  shutdown(): void {
    this.alive = false;
    this.stopTyping();
    if (typeBoxOpen()) closeTypeBox();
  }

  private block() {
    return dominionBlock(services().session.run);
  }

  private live() {
    return dominionBlock(services().session.run)?.debate?.live ?? null;
  }
  private active(): boolean {
    return this.host.screenName === 'debate';
  }

  /** A Debate is on the table: show it (after the Debate action, a card answered, or a reload). */
  claim(): boolean {
    if (!this.live() || this.active()) return false;
    this.host.screenName = 'debate';
    this.cur = { stance: 0, line: 0 };
    this.notice = null;
    this.leaving = false;
    this.typed = null;
    this.stopTyping();
    this.firstFree();
    return true;
  }

  render(): string {
    const b = dominionBlock(services().session.run);
    if (b && this.typed) {
      const t = typedModel(b, this.typed);
      if (t) return debateTypedView(t);
    }
    const m = b ? debateModel(b, this.cur, this.notice) : null;
    return m ? debateView(m) : '';
  }

  /** The stance's first line not said yet. */
  private firstFree(): void {
    const used = new Set(this.live()?.turns.map((t) => t.line) ?? []);
    const st = DOMINION_DATA.debate.stances[this.cur.stance]!.id;
    const lines = DOMINION_DATA.debate.lines.filter((l) => l.stance === st);
    const i = lines.findIndex((l) => !used.has(l.id));
    this.cur = { ...this.cur, line: Math.max(0, i) };
  }

  private stance(i: number): void {
    this.cur = { stance: (i + 4) % 4, line: 0 };
    this.notice = null;
    this.leaving = false;
    this.firstFree();
  }

  private send(a: DominionAction): void {
    const out = this.host.debateStep(a);
    this.notice = out.ok ? null : out.notice;
    this.leaving = false;
    if (!out.ok) return;
    if (!this.live()) {
      // The result was read (or you walked out): back to the HQ with what happened.
      this.host.screenName = 'hq';
      this.host.setNotice(out.notice);
      return;
    }
    this.firstFree();
  }

  private argue(): void {
    const l = this.live();
    if (!l) return;
    if (l.phase === 'done') return this.send({ t: 'debateDone' });
    if (l.phase !== 'argue') return;
    const st = DOMINION_DATA.debate.stances[this.cur.stance]!.id;
    const line = DOMINION_DATA.debate.lines.filter((x) => x.stance === st)[this.cur.line];
    if (line) this.send({ t: 'argue', line: line.id });
  }

  // ---------- D20: typed words ----------

  /** T: the shared typing box. Enter sends, Esc cancels. */
  private openBox(): void {
    const l = this.live();
    if (!l || l.phase !== 'argue' || this.typed || typeBoxOpen()) return;
    const T = DOMINION_DATA.debate.typed;
    this.notice = null;
    this.leaving = false;
    openTypeBox({
      title: fill(T.text.type!, { boss: l.name }),
      placeholder: T.text.placeholder!,
      maxChars: T.maxText,
      onSend: (text) => { if (this.alive) void this.submit(text); },
      onClose: () => { if (this.alive) this.host.refresh(); },
    });
    this.host.refresh();
  }

  /** The judge (Rotom or the rules), then the turn (saved), then the reply. */
  private async submit(typed: string): Promise<void> {
    const T = DOMINION_DATA.debate.typed;
    const text = typed.trim().slice(0, T.maxText);
    const b = this.block();
    const l = b?.debate?.live;
    if (!b || !l || l.phase !== 'argue' || this.typed) return;
    if (text.length < T.minText) {
      this.notice = 'Say a little more than that.';
      return this.host.refresh();
    }
    const ask = judgeAsk(b, text);
    if (!ask) return;
    const turn = l.turns.length;
    this.typed = { turn, text, stage: 'judging', shown: 0, stream: null, judgeChip: null, replyChip: null };
    this.host.refresh();
    let judge: unknown;
    let rotom = false;
    const env = services().session.aiEnv();
    if (env) {
      try {
        const got = await askClaude({ id: ask.id, role: 'judge', use: 'typed', system: ask.system, context: ask.context, input: ask.input, schema: ask.schema, offline: ask.offline }, env);
        if (got.source !== 'offline') {
          judge = got.value;
          rotom = true;
          this.typed.judgeChip = chipOf(storedAnswer(env.log, ask.id)?.m);
        }
      } catch {
        // The rules read the words.
      }
    }
    if (!this.alive) return;
    // The run moved on while Rotom thought (a reload, a walk-out): the words belong to that moment only.
    const now = this.live();
    if (!this.typed || !now || now.phase !== 'argue' || now.turns.length !== turn) {
      this.typed = null;
      return this.host.refresh();
    }
    const out = this.host.debateStep({ t: 'argueTyped', text, ...(judge !== undefined ? { judge } : {}), rotom });
    if (!out.ok) {
      this.typed = null;
      this.notice = out.notice;
      return this.host.refresh();
    }
    this.typed.stage = 'speaking';
    this.host.refresh();
    await this.voice(turn);
  }

  /** The Boss's reply: Rotom's, streamed and stored (a "big" call), or the written one typing itself. */
  private async voice(turn: number): Promise<void> {
    const b = this.block();
    const ask = b ? replyAsk(b, turn) : null;
    const env = services().session.aiEnv();
    if (ask && env) {
      try {
        // The chip shows what this reply cost (the spend counter's own numbers, per device).
        const key = env.keys.active()?.key;
        const before = key ? await env.keys.spent(key) : 0;
        const got = await askClaude({
          id: ask.id, role: 'big', use: 'typed', system: ask.system, context: ask.context, input: ask.input, offline: ask.offline,
          onText: (so) => {
            if (!this.alive || this.typed?.turn !== turn) return;
            this.typed.stream = so;
            this.typed.shown = so.length;
            this.host.refresh();
          },
        }, env);
        if (!this.alive || this.typed?.turn !== turn) return;
        this.typed.stream = null;
        if (got.source !== 'offline') {
          this.host.debateStep({ t: 'debateVoice', turn, text: String(got.value) });
          const cost = key ? (await env.keys.spent(key)) - before : 0;
          const chip = chipOf(storedAnswer(env.log, ask.id)?.m);
          if (this.typed?.turn === turn) this.typed.replyChip = chip && cost >= 0.0005 ? `${chip} · $${cost.toFixed(3)}` : chip;
        }
      } catch {
        // The written reply stands.
      }
    }
    if (!this.alive || this.typed?.turn !== turn) return;
    this.typeOut();
  }

  /** The reply types itself from where the stream left it (presentation only). */
  private typeOut(): void {
    this.stopTyping();
    const t = this.typed;
    if (!t) return;
    const full = this.replyText();
    if (services().session.settings.animationIntensity === 'reduced' || t.shown >= full.length) return this.finishTyping();
    this.timer = setInterval(() => {
      if (!this.alive || !this.typed) return this.stopTyping();
      this.typed.shown = Math.min(full.length, this.typed.shown + Math.max(1, Math.round(TYPE_CPS / 20)));
      if (this.typed.shown >= full.length) this.finishTyping();
      else this.host.refresh();
    }, 50);
  }

  private replyText(): string {
    const t = this.typed;
    const turn = t ? this.live()?.turns[t.turn] : undefined;
    return t?.stream ?? turn?.voice ?? turn?.reply ?? '';
  }

  private finishTyping(): void {
    this.stopTyping();
    if (!this.typed) return;
    this.typed.shown = this.replyText().length;
    this.typed.stage = 'read';
    this.host.refresh();
  }

  private stopTyping(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  /** B (or Enter while it types): show the whole reply now. Only once the turn is in the save. */
  private skip(): void {
    if (this.typed?.stage === 'speaking' && this.typed.stream === null && this.live()?.turns[this.typed.turn]) this.finishTyping();
  }

  /** Enter on the read reply: back to the table (or the result). */
  private doneTyped(): void {
    if (this.typed?.stage !== 'read') return this.skip();
    this.typed = null;
    this.firstFree();
  }

  acts(): Record<string, (arg: string) => void> {
    return {
      debType: () => this.openBox(),
      debSkip: () => { this.skip(); this.host.refresh(); },
      debTypedDone: () => { this.doneTyped(); this.host.refresh(); },
      debStance: (i) => { this.stance(Number(i)); this.host.refresh(); },
      debLine: (i) => { this.cur = { ...this.cur, line: Number(i) }; this.host.refresh(); },
      debArgue: () => { this.argue(); this.host.refresh(); },
      debDeal: (k) => { this.send({ t: 'deal', kind: k === 'merger' ? 'merger' : 'branch' }); this.host.refresh(); },
      debDone: () => { this.send({ t: 'debateDone' }); this.host.refresh(); },
    };
  }

  /** Arrows, Enter and Esc. Returns true when handled. */
  key(a: InputAction): boolean {
    if (!this.active()) return false;
    const l = this.live();
    if (!l) {
      this.host.screenName = 'hq';
      return true;
    }
    if (typeBoxOpen()) return true;
    if (this.typed) {
      if (a === 'confirm' || a === 'back') this.doneTyped();
      return true;
    }
    if (this.notice && a === 'confirm') {
      this.notice = null;
      this.leaving = false;
      return true;
    }
    if (a === 'back') {
      if (l.phase === 'done') this.send({ t: 'debateDone' });
      else if (l.phase === 'argue') {
        if (this.leaving) this.send({ t: 'walkOut' });
        else {
          this.leaving = true;
          this.notice = `Walk out on ${l.name}? It counts as a failed Debate. Esc again to walk out, Enter to stay.`;
        }
      }
      return true;
    }
    if (l.phase === 'argue') {
      if (a === 'left' || a === 'right') this.stance(this.cur.stance + (a === 'left' ? -1 : 1));
      else if (a === 'up' || a === 'down') this.cur = { ...this.cur, line: (this.cur.line + (a === 'up' ? 2 : 1)) % 3 };
      else if (a === 'confirm') this.argue();
    } else if (l.phase === 'done' && a === 'confirm') this.send({ t: 'debateDone' });
    return true;
  }

  /** Number keys: 1-4 pick a stance; Convinced: 1 Merger, 2 Branch. */
  raw(code: string, e?: KeyboardEvent): boolean {
    if (!this.active()) return false;
    const l = this.live();
    if (typeBoxOpen()) return true;
    if (this.typed) {
      if (code === 'KeyB') this.skip();
      this.host.refresh();
      return true;
    }
    if (code === 'KeyT' && l?.phase === 'argue') {
      // Stopped so its letter doesn't land in the box it opens.
      e?.preventDefault();
      if (!e?.repeat) this.openBox();
      return true;
    }
    const i = STANCE_KEYS[code];
    if (i === undefined || !l) return true;
    if (l.phase === 'choose') {
      if (i < 2) this.send({ t: 'deal', kind: i === 0 ? 'merger' : 'branch' });
    } else if (l.phase === 'argue') this.stance(i);
    this.host.refresh();
    return true;
  }

  dismiss(): void {
    this.notice = null;
    this.leaving = false;
  }
}
