// DOMINION D17: the controller for the ending page, kept beside DominionScene so the scene only forwards to it. The page
// opens by itself the first time the run is complete (and from L on the Empire or Takeover page); ◀ ▶ turn the crew
// pages, Enter closes the books (GameSession.dominionFinish: the run ends and the run-end page pays it), Esc goes back.

import { completion, endingModel, endingNotYet, type Journey } from '../../core/dominion/ending';
import { rightHand } from '../../core/dominion/chair';
import { DOMINION_DATA } from '../../core/dominion/data';
import { monName } from '../../core/dominion/crew';
import { dominionBlock } from '../../core/dominion/session';
import { services } from '../../game/services';
import type { InputAction } from '../../ui/input';
import type { R5Pics } from '../../ui/redux/screens/dominion/r50/chairR8';
import type { R5Run } from '../../ui/redux/screens/dominion/r50/kit';
import { imgAt, r5Credits, r5Ending, r5Infamy } from '../../ui/redux/screens/dominion/r50/empireR8';

/** Crew cards on one Credits page (the mockup shows six). */
const CREDITS_PER = 6;
interface Host {
  readonly screenName: string;
  setNotice(n: string | null): void;
  refresh(): void;
  /** The books are closed: the run is over (the scene goes to the run-end page). */
  closeBooks(): void;
  /** Redesign R8: the pass-50 chrome's run data, how people are drawn, the Boss's picture and name. */
  r8(): { run: R5Run; pics: R5Pics } | null;
  r8Boss(h: number): string;
  bossName(): string;
}

export class EndingController {
  private page = 0;
  /** Redesign R8: the Ending (mockup `ending`), the Credits (`credits`) or the Hall of Infamy (`infamy`). */
  private view: 'end' | 'credits' | 'infamy' = 'end';
  private notice: string | null = null;
  /** Shown once by itself per visit to the scene; L brings it back. */
  private seen = false;
  /** The page is up (over whatever page the scene was on). */
  private on = false;

  constructor(private readonly host: Host) {}

  owns(): boolean {
    return this.on;
  }
  private block() {
    return dominionBlock(services().session.run);
  }

  /** Opens the page. False (with the "not yet" line) when the run isn't complete. */
  open(): boolean {
    const b = this.block();
    if (!b || !completion(b)) {
      this.host.setNotice(endingNotYet());
      return false;
    }
    this.on = true;
    this.page = 0;
    this.view = 'end';
    this.notice = null;
    this.seen = true;
    this.host.setNotice(null);
    return true;
  }

  /** The first time a hub page is drawn with the run complete, the ending opens over it. */
  maybeOpen(): boolean {
    if (this.seen || this.owns()) return false;
    const b = this.block();
    if (!b || !completion(b) || b.field.fight) return false;
    if (!['hq', 'map', 'takeover', 'empire', 'ledger'].includes(this.host.screenName)) return false;
    return this.open();
  }

  /** Every crew member's journey (the core model pages them two at a time). */
  private journeys(): Journey[] {
    const b = this.block(), run = services().session.run;
    if (!b || !run) return [];
    const pages = endingModel(b, run, 0).pages;
    const out: Journey[] = [];
    for (let p = 0; p < pages; p++) out.push(...endingModel(b, run, p).crew);
    return out;
  }
  private creditPages(): number {
    return Math.max(1, Math.ceil(this.journeys().length / CREDITS_PER));
  }

  render(notice: string | null): string {
    const b = this.block(), run = services().session.run;
    const r = this.host.r8();
    if (!b || !run || !r) return '';
    const n = this.notice ?? notice;
    const m = endingModel(b, run, 0);
    const region = DOMINION_DATA.regions.regions[b.realm?.at ?? 'kanto']?.name ?? 'Kanto';
    if (this.view === 'credits') {
      const all = this.journeys();
      const crew = all.slice(this.page * CREDITS_PER, (this.page + 1) * CREDITS_PER).map((j) => ({ ...j, pic: r.pics.body(j.look, 72) }));
      const met = new Set([b.realm?.at ?? 'kanto', ...(b.realm?.held ?? []).map((h) => h.id)]);
      const also = DOMINION_DATA.rivals.teams.filter((t) => met.has(t.region)).map((t) => ({ pic: t.boss.look ? imgAt(t.boss.look, 72) : '', name: t.boss.name, line: `${t.name} · ${DOMINION_DATA.regions.regions[t.region]?.name ?? t.region}` }));
      return r5Credits({ team: b.teamName ?? 'Your crew', boss: this.host.r8Boss(190), bossName: this.host.bossName(), took: `The Boss · took ${region} in ${b.day} days`, crew, also, page: this.page, pages: this.creditPages(), notice: n }, r.run);
    }
    if (this.view === 'infamy') {
      const hand = rightHand(b) ?? b.members[0];
      const ace = run.party.find((p) => p.hp > 0) ?? run.party[0];
      const rank = (id: string): string => DOMINION_DATA.crew.ranks.find((x) => x.id === id)?.word ?? id;
      const peds = [
        { pic: this.host.r8Boss(150), name: this.host.bossName(), role: 'The Boss', top: true },
        ...(hand ? [{ pic: r.pics.body(hand.look, 110), name: hand.name, role: rank(hand.rank) }] : []),
        ...(ace ? [{ pic: r.pics.mon(ace.speciesId, 110), name: monName(ace.speciesId), role: `Ace · Lv ${ace.level}` }] : []),
        ...b.members.filter((x) => x.id !== hand?.id).slice(0, 2).map((x) => ({ pic: r.pics.body(x.look, 110), name: x.name, role: rank(x.rank) })),
      ];
      return r5Infamy({ region, day: b.day, peds }, r.run);
    }
    const crew = b.members.slice(0, 6).map((x) => r.pics.body(x.look, 104));
    return r5Ending(m, { crew, boss: this.host.r8Boss(168), initial: (b.teamName ?? 'N')[0]!.toUpperCase(), notice: n }, r.run);
  }

  private turn(d: number): void {
    const pages = this.creditPages();
    this.page = (this.page + d + pages) % pages;
    this.host.refresh();
  }
  private show(v: 'end' | 'credits' | 'infamy'): void {
    this.view = v;
    this.page = 0;
    this.host.refresh();
  }

  private close(): void {
    if (!this.on) return;
    if (!services().session.dominionFinish()) {
      this.notice = endingNotYet();
      return this.host.refresh();
    }
    this.on = false;
    this.host.closeBooks();
  }

  acts(): Record<string, (arg: string) => void> {
    return {
      endPage: (d) => this.turn(Number(d) || 1),
      endClose: () => this.close(),
      r8Credits: () => this.show('credits'),
      r8Infamy: () => this.show('infamy'),
    };
  }

  key(a: InputAction): boolean {
    if (!this.owns()) return false;
    if (this.notice && (a === 'confirm' || a === 'back')) {
      this.notice = null;
      this.host.refresh();
      return true;
    }
    if (this.view === 'credits' && (a === 'left' || a === 'right')) this.turn(a === 'left' ? -1 : 1);
    else if (a === 'confirm') {
      if (this.view === 'end' || this.view === 'infamy') this.show('credits');
      else this.close();
    } else if (a === 'back') {
      if (this.view !== 'end') return this.show('end'), true;
      this.on = false;
      this.host.refresh();
    }
    return true;
  }

  /** H: the Hall of Infamy. */
  raw(code: string): boolean {
    if (!this.owns()) return false;
    if (code === 'KeyH') this.show(this.view === 'infamy' ? 'end' : 'infamy');
    return true;
  }
}
