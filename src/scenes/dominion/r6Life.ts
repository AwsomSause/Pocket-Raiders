// DOMINION redesign R6, part 2: a Region Event's page (Fireworks Night, the Blackout), the Prize Corner and the chapter
// card. The rules are core/dominion/life.ts; every change goes through GameSession.dominionStep. The event and the
// chapter card open on their own when a new day brings them (never on a load, so a saved game opens where it was);
// the top bar's festival lantern and the Start menu open the event and the Prize Corner by hand.

import type Phaser from 'phaser';
import { crewOf } from '../../core/dominion/crew';
import { DOMINION_DATA } from '../../core/dominion/data';
import { districtDef } from '../../core/dominion/field';
import { chapterDue, eventOpen, eventPicks, prizes, regionEvent, swapOdds, type RegionEvent } from '../../core/dominion/life';
import type { DominionBlock, Member } from '../../core/dominion/schema';
import { services } from '../../game/services';
import type { InputAction } from '../../ui/input';
import { SP, type R5Run, type R5Speaker } from '../../ui/redux/screens/dominion/r50/kit';
import { r5Chapter, r5Prize, r5Region, type R5Prize } from '../../ui/redux/screens/dominion/r50/life';
import { facePic, r5Run } from './r50Bridge';
import { monPic } from './r6Pokemon';

type Page = 'event' | 'prize' | 'chapter';
type Result = { word: string; line: string; ok: boolean };

const fill = (t: string, v: Record<string, string | number>): string => t.replace(/\{(\w+)\}/g, (_, k: string) => String(v[k] ?? ''));
const statWord = (s: string): string => s[0]!.toUpperCase() + s.slice(1);
const money = (n: number): string => n.toLocaleString('en-US');
const rotom: R5Speaker = { name: 'Rotom', k: 'p-rotom' };

export class LifePages {
  page: Page | null = null;
  private at = 0;
  private notice: string | null = null;
  private result: Result | null = null;
  /** The day last drawn: a new day may bring a chapter card or a Region Event (none pops up on a load). */
  private lastDay: number | null = null;
  /** Events this session already opened on their own (each pops up once; the lantern opens it again). */
  private popped = new Set<string>();

  constructor(private readonly scene: Phaser.Scene, private readonly host: { refresh(): void; block(): DominionBlock | null; onHub(): boolean }) {}

  open(p: Page): void {
    this.page = p;
    this.at = 0;
    this.notice = null;
    this.result = null;
  }
  close(): void { this.page = null; this.notice = null; this.result = null; }

  /** A page is up, or a new day just brought one. */
  owns(): boolean {
    const b = this.host.block();
    if (!b || !this.host.onHub()) return false;
    if (this.lastDay !== null && b.day > this.lastDay && !this.page) {
      if (chapterDue(b)) this.open('chapter');
      else {
        const ev = regionEvent(b);
        if (eventOpen(b, ev) && !this.seenEv(b, ev)) this.popEvent(ev);
      }
    }
    this.lastDay = b.day;
    if (this.page === 'chapter' && !chapterDue(b)) this.page = null;
    return this.page !== null;
  }

  private seenEv(b: DominionBlock, ev: RegionEvent): boolean {
    return (b.life?.seen ?? []).includes(ev.key) || this.popped.has(ev.key);
  }
  private popEvent(ev: RegionEvent): void {
    this.popped.add(ev.key);
    this.open('event');
  }

  private speaker(m: Member | null, b: DominionBlock): R5Speaker {
    return m ? { name: m.name, pic: facePic(m.look, b), colour: '#e0901c' } : rotom;
  }

  render(): string {
    const b = this.host.block();
    if (!b || !this.page) return '';
    const run: R5Run = r5Run(this.scene, b);
    if (this.page === 'chapter') {
      const c = chapterDue(b);
      if (!c) return '';
      return r5Chapter({ n: c.n, title: c.title, line: c.line, left: SP('t-natebig', 250), right: SP('t-giovanni', 250) }, run);
    }
    if (this.page === 'prize') return this.prize(b, run);
    return this.event(b, run);
  }

  private event(b: DominionBlock, run: R5Run): string {
    const ev = regionEvent(b);
    if (!ev) return '';
    const open = eventOpen(b, ev);
    const picks = eventPicks(b, ev);
    this.at = Math.min(this.at, picks.length - 1);
    const where = districtDef(ev.district)?.name ?? ev.district;
    const days = ev.daysLeft === 1 ? 'one night' : `${ev.daysLeft} days`;
    const lead = picks[this.at]?.member ?? b.members.find((m) => !crewOf(m).out) ?? null;
    const def = ev.kind === 'festival' ? DOMINION_DATA.life.festival : DOMINION_DATA.life.blackout;
    const line = this.result?.line ?? (open ? fill(def.line, { district: where, days }) : DOMINION_DATA.life.jobLines.over!);
    const sel = picks[this.at];
    const go = ev.kind === 'festival' ? 'Plan a job' : `Hit the ${sel?.name.replace(`${where} `, '') ?? 'target'}`;
    return r5Region({
      kind: ev.kind, title: ev.name, sub: `${where} · ${ev.daysLeft === 1 ? 'tonight only' : `${ev.daysLeft} days left`}`,
      picks: picks.map((p) => ({
        name: p.name,
        sub: ev.kind === 'festival' ? `${p.member?.name ?? 'Nobody'} · ${statWord(p.stat)} ${p.chance}% · ${p.note}` : `${p.note} · ${p.chance}%`,
        prize: p.mon ? (services().session.content.species.get(p.mon)?.name ?? p.mon) : `+₽${money(p.money)}`,
        chance: `${p.chance}%`, sprite: p.sprite ?? 'tw-mart2', dark: p.dark,
      })),
      at: this.at, speaker: this.speaker(lead, b), line,
      left: ev.daysLeft === 1 ? 'TONIGHT' : `${ev.daysLeft} DAYS`, leftPct: Math.round((ev.daysLeft / DOMINION_DATA.life.events.lasts) * 100),
      pass: ev.kind === 'festival' ? 'Just watch' : 'Stay in', go, open, result: this.result,
      crowd: ['t-rich', 't-applicant', 't-grunt', 't-looker', 't-grunt', 't-applicant', 't-rich'], notice: this.notice,
    }, { ...run, place: where, tip: def.tip, festival: ev.name });
  }

  private prize(b: DominionBlock, run: R5Run): string {
    const coins = b.life?.coins ?? 0;
    const list = prizes();
    this.at = Math.min(this.at, list.length - 1);
    const items: R5Prize[] = list.map((p) => ({
      name: p.name, coins: money(p.coins), can: coins >= p.coins,
      pic: p.species ? monPic(this.scene, p.species, 110) : SP(`i-${p.item!.replace(/-/g, '_')}`, 96),
    }));
    const sel = list[this.at]!;
    const o = swapOdds(b);
    const C = DOMINION_DATA.life.coins;
    const line = this.result?.line ?? fill(C.line, { prize: sel.name });
    return r5Prize({
      prizes: items, at: this.at, coins: money(coins), speaker: this.speaker(o.member, b), line, swap: `Swap it · ${o.chance}%`, result: this.result, notice: this.notice,
    }, { ...run, place: 'Game Corner', tip: `${C.pack} coins for ₽${money(C.price)}: press B.` });
  }

  private say(out: { ok: boolean; notice: string | null; roll: { r: number; chance: number } | null }): void {
    if (!out.ok) { this.notice = out.notice; return; }
    this.notice = null;
    this.result = out.roll
      ? { word: out.roll.r <= out.roll.chance ? 'SUCCESS' : 'MISSED', line: out.notice ?? '', ok: out.roll.r <= out.roll.chance }
      : out.notice ? { word: 'DONE', line: out.notice, ok: true } : null;
    if (this.result && out.roll) this.result.word += ` · rolled ${out.roll.r}, needed ${out.roll.chance} or less`;
  }

  private go(): void {
    const s = services().session;
    if (this.page === 'chapter') {
      s.dominionStep({ t: 'chapter' });
      this.close();
      // The next new thing this morning, if any: the Region Event.
      const b = this.host.block();
      const ev = b ? regionEvent(b) : null;
      if (b && eventOpen(b, ev) && !this.seenEv(b, ev) && this.lastDay === b.day) this.popEvent(ev);
      return;
    }
    if (this.result) { this.result = null; if (this.page === 'event') this.close(); return; }
    if (this.page === 'event') {
      const b = this.host.block();
      const ev = b ? regionEvent(b) : null;
      if (!b || !eventOpen(b, ev)) return this.close();
      const pick = eventPicks(b, ev)[this.at];
      if (pick) this.say(s.dominionStep({ t: 'regionEv', id: pick.id }));
      return;
    }
    const p = prizes()[this.at];
    if (p) this.say(s.dominionStep({ t: 'prize', op: 'trade', id: p.id }));
  }

  private pass(): void {
    if (this.page !== 'event' || this.result) return this.close();
    services().session.dominionStep({ t: 'regionEv', id: null });
    this.close();
  }

  private swap(): void {
    const p = prizes()[this.at];
    if (this.page === 'prize' && p && !this.result) this.say(services().session.dominionStep({ t: 'prize', op: 'swap', id: p.id }));
  }
  private buy(): void {
    if (this.page !== 'prize') return;
    const out = services().session.dominionStep({ t: 'prize', op: 'buy' });
    this.notice = out.notice;
    this.result = null;
  }

  /** Esc on the event page only closes it (the event waits until its last day; "Just watch" lets it pass). */
  key(a: InputAction): boolean {
    if (!this.owns()) return false;
    if (this.notice && (a === 'confirm' || a === 'back')) { this.notice = null; return true; }
    if (a === 'confirm') this.go();
    else if (a === 'back') { if (this.page === 'event' && this.result) this.result = null; if (this.page !== 'chapter') this.close(); }
    else if (this.page !== 'chapter' && !this.result) {
      const n = this.page === 'prize' ? prizes().length : this.eventSize();
      if (n) this.at = (this.at + (a === 'up' || a === 'left' ? -1 : 1) + n) % n;
    }
    return true;
  }
  private eventSize(): number {
    const b = this.host.block();
    const ev = b ? regionEvent(b) : null;
    return b && ev ? eventPicks(b, ev).length : 0;
  }

  /** B buys coins and S swaps at the Prize Corner; P opens it from the festival. Other letters stay with the page. */
  raw(code: string): boolean {
    if (!this.page || !this.owns()) return false;
    if (code === 'KeyQ' || code === 'End') return false;
    if (code === 'KeyB') this.buy();
    else if (code === 'KeyS') this.swap();
    else if (code === 'KeyP' && this.page === 'event') this.open('prize');
    this.host.refresh();
    return true;
  }

  acts(): Record<string, (arg: string) => void> {
    const r = (): void => this.host.refresh();
    return {
      regionPick: (i) => { const again = this.at === Number(i); this.at = Number(i); if (again) this.go(); r(); },
      regionGo: () => { this.go(); r(); },
      regionPass: () => { this.pass(); r(); },
      regionClose: () => { this.result = null; this.close(); r(); },
      prizePick: (i) => { this.at = Number(i); r(); },
      prizeTrade: () => { this.result = null; this.go(); r(); },
      prizeSwap: () => { this.swap(); r(); },
      prizeBuy: () => { this.buy(); r(); },
      prizeClose: () => { this.close(); r(); },
      chapterGo: () => { this.go(); r(); },
    };
  }

  /** Opens a page by hand (the lantern, the Start menu); the event says so when none is on. */
  openByHand(p: 'event' | 'prize'): string | null {
    const b = this.host.block();
    if (!b) return null;
    if (p === 'event') {
      const ev: RegionEvent | null = regionEvent(b);
      if (!ev) {
        const E = DOMINION_DATA.life.events;
        const next = b.day < E.first ? E.first : E.first + (Math.floor((b.day - E.first) / E.every) + 1) * E.every;
        return `${DOMINION_DATA.life.jobLines.notNow} The next Region Event starts on Day ${next}.`;
      }
    }
    this.open(p);
    this.lastDay = b.day;
    return null;
  }

  state(): { page: Page | null; at: number; result: boolean } {
    return { page: this.page, at: this.at, result: !!this.result };
  }
}
