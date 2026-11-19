// DOMINION slice D22: the controller for Confront (the spy on the crew), kept beside DominionScene so the scene only
// forwards to it. Every question, the accusation and letting it go go through GameSession.dominionStep (saved). A typed
// line also asks Rotom to voice the member's reply (askClaude, use "typed"): the reply is stored in the run's AI log
// under a stable id and shown when it arrives; the tell and every result were already fixed by the rules. With no
// Key-Card (or Rotom off) nothing is sent and the written reply stays.

import { z } from 'zod';
import { askClaude, type AskEnv } from '../../ai/ask';
import { wrapPlayerText } from '../../core/ai/rules';
import { DOMINION_DATA } from '../../core/dominion/data';
import { crewOf } from '../../core/dominion/crew';
import { cardPrompt } from '../../core/dominion/personality';
import { dominionBlock } from '../../core/dominion/session';
import { isMole, spiesOf } from '../../core/dominion/spies';
import { spyCallId, spyModel } from '../../core/dominion/spyScreens';
import type { DominionAction } from '../../core/dominion/schema';
import { rankWord } from '../../core/dominion/crew';
import { teamsHere } from '../../core/dominion/rivals';
import { services } from '../../game/services';
import type { InputAction } from '../../ui/input';
import { spyView } from '../../ui/redux/screens/dominion/spy';

type Screen = 'title' | 'setup' | 'opening' | 'hq' | 'map' | 'card' | 'crew' | 'base' | 'rival' | 'spy';
interface Host {
  screenName: Screen;
  setNotice(n: string | null): void;
  refresh(): void;
  rivalStep(a: DominionAction): { ok: boolean; fight: boolean; notice: string | null };
  startFight(): void;
}

const TYPE = '[data-testid="dom-spy-type"]';
const ReplySchema = z.object({ reply: z.string().min(1).max(300) });

export class SpyController {
  private at = 0;
  private draft = '';
  private notice: string | null = null;
  private waiting = 0;
  private typing = false;
  private readonly onInput = (e: Event): void => {
    const t = e.target as HTMLInputElement | null;
    if (t?.matches?.(TYPE)) this.draft = t.value;
  };
  private readonly onKey = (e: KeyboardEvent): void => {
    const t = e.target as HTMLInputElement | null;
    if (!t?.matches?.(TYPE) || !this.active()) return;
    if (e.key === 'Enter') {
      e.preventDefault();
      this.draft = t.value;
      this.say();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      this.typing = false;
      t.blur();
    }
  };
  private readonly onFocus = (e: Event): void => {
    if ((e.target as HTMLElement | null)?.matches?.(TYPE)) this.typing = true;
  };

  constructor(private readonly host: Host) {
    document.addEventListener('input', this.onInput, true);
    document.addEventListener('keydown', this.onKey, true);
    document.addEventListener('focusin', this.onFocus, true);
  }

  destroy(): void {
    document.removeEventListener('input', this.onInput, true);
    document.removeEventListener('keydown', this.onKey, true);
    document.removeEventListener('focusin', this.onFocus, true);
  }

  private block() {
    return dominionBlock(services().session.run);
  }
  active(): boolean {
    return this.host.screenName === 'spy';
  }
  private rows(): number {
    return DOMINION_DATA.spies.questions.filter((q) => q.id !== 'typed').length + 2;
  }

  /** F on the Crew File: opens the back room for this member (or says why not). False when it didn't open. */
  open(member: string): boolean {
    const out = this.host.rivalStep({ t: 'spyStart', member });
    if (!out.ok) {
      this.host.setNotice(out.notice);
      this.host.refresh();
      return false;
    }
    this.host.screenName = 'spy';
    this.at = 0;
    this.draft = '';
    this.notice = null;
    this.typing = false;
    this.host.setNotice(null);
    this.host.refresh();
    return true;
  }

  render(): string {
    const b = this.block();
    const m = b ? spyModel(b, services().session.run?.ai, this.waiting > 0) : null;
    if (!m) return '';
    return spyView(m, this.draft, this.at, this.notice);
  }

  private step(a: DominionAction): { ok: boolean; fight: boolean; notice: string | null } {
    const out = this.host.rivalStep(a);
    this.notice = out.notice;
    return out;
  }

  private row(i: number): void {
    this.at = i;
    const qs = DOMINION_DATA.spies.questions.filter((q) => q.id !== 'typed');
    if (i < qs.length) this.step({ t: 'spyAsk', q: qs[i]!.id });
    else if (i === qs.length) return this.accuse();
    else return this.drop();
    this.host.refresh();
  }

  private accuse(): void {
    const out = this.step({ t: 'spyAccuse' });
    if (!out.ok) return this.host.refresh();
    this.leave(out.notice);
    if (out.fight) return this.host.startFight();
    this.host.refresh();
  }

  private drop(): void {
    const out = this.step({ t: 'spyDrop' });
    this.leave(out.ok ? out.notice : null);
    this.host.refresh();
  }

  private leave(notice: string | null): void {
    this.host.screenName = 'crew';
    this.notice = null;
    this.draft = '';
    this.typing = false;
    this.host.setNotice(notice);
  }

  /** Sends the typed line: the rules roll the reply and tell at once; Rotom may voice the reply after. */
  private say(): void {
    const text = this.draft.trim();
    const b0 = this.block();
    const talk = b0 ? spiesOf(b0).talk : null;
    if (!text || !talk) return;
    const turn = talk.turns.length;
    const out = this.step({ t: 'spyAsk', q: 'typed', text });
    if (!out.ok) return this.host.refresh();
    this.draft = '';
    this.typing = true;
    this.ask(turn);
    this.refreshKeepFocus();
  }

  private ask(turn: number): void {
    const session = services().session;
    const env: AskEnv | null = session.aiEnv();
    const b = this.block();
    const talk = b ? spiesOf(b).talk : null;
    const m = talk ? b!.members.find((x) => x.id === talk.member) : null;
    const t = talk?.turns[turn];
    if (!env || !b || !talk || !m || !t || env.tier === 'off') return;
    const card = crewOf(m).card;
    const team = teamsHere()[0]?.name ?? 'the rival team';
    const clues = spiesOf(b).clues.filter((c) => c.member === m.id).slice(-3).map((c) => `Day ${c.day}: ${c.text}`).join('; ') || 'none';
    const earlier = talk.turns.slice(0, turn).map((x) => `Boss: ${x.said ?? x.q} / ${m.name}: ${x.reply}`).join('\n') || '(nothing yet)';
    this.waiting += 1;
    void askClaude({
      id: spyCallId(m.id, talk.day, turn),
      role: 'line',
      use: 'typed',
      system: [DOMINION_DATA.spies.rotom.system, card ? cardPrompt(m.name, `${rankWord(m.rank)} of the Boss's crew`, card) : `Character: ${m.name}.`].join('\n'),
      context: `The truth (fixed by the game): ${m.name} ${isMole(b, m.id) ? `IS a spy for ${team}` : 'is NOT a spy'}. Clues the Boss has: ${clues}.`,
      input: `Earlier in this talk:\n${earlier}\nThe Boss now says: ${wrapPlayerText(t.said ?? '')}\nTell to show: ${t.tell ?? 'none'}.\nAnswer as JSON {"reply": "..."}.`,
      schema: ReplySchema,
      offline: () => ({ reply: t.reply }),
    }, env).finally(() => {
      this.waiting = Math.max(0, this.waiting - 1);
      this.refreshKeepFocus();
    });
  }

  /** After a redraw the input is a new element: give it the focus back (and the caret at the end) if it had it. */
  private refreshKeepFocus(): void {
    this.host.refresh();
    if (!this.typing) return;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const el = document.querySelector<HTMLInputElement>(TYPE);
      if (!el || !this.active()) return;
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
    }));
  }

  acts(): Record<string, (arg: string) => void> {
    return {
      spyRow: (i) => this.row(Number(i)),
      spySay: () => {
        const el = document.querySelector<HTMLInputElement>(TYPE);
        if (el) this.draft = el.value;
        this.say();
      },
    };
  }
  overs(): Record<string, (arg: string) => void> {
    return { spyOver: (i) => { this.at = Number(i); this.host.refresh(); } };
  }

  /** Arrow keys, Enter and Esc (not while typing: the input keeps those). Returns true when handled. */
  key(a: InputAction): boolean {
    if (!this.active()) return false;
    if (this.notice && (a === 'confirm' || a === 'back')) {
      this.notice = null;
      return true;
    }
    const n = this.rows();
    if (a === 'left' || a === 'up') this.at = (this.at - 1 + n) % n;
    else if (a === 'right' || a === 'down') this.at = (this.at + 1) % n;
    else if (a === 'confirm') this.row(this.at);
    else if (a === 'back') this.drop();
    return true;
  }

  /**
   * A letter, digit or sign pressed on the screen starts a typed line: the input takes the focus and the key. Returns
   * true when the key was taken (the scene eats the same key's move/confirm/back, MOVE_LETTERS).
   */
  raw(e: KeyboardEvent): boolean {
    if (!this.active()) return false;
    if (e.key.length !== 1 || e.key === ' ' || e.ctrlKey || e.metaKey || e.altKey) return false;
    const el = document.querySelector<HTMLInputElement>(TYPE);
    if (!el) return false;
    e.preventDefault();
    this.draft = (el.value + e.key).slice(0, DOMINION_DATA.spies.talk.typedMax);
    el.value = this.draft;
    this.typing = true;
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
    return true;
  }

  dismiss(): void {
    this.notice = null;
  }
}
