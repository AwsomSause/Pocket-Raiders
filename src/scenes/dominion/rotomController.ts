// DOMINION redesign R9 follow-up: the Rotom Phone's own pages (radio, inbox, messages, adventure log, Rotom's diary,
// Ask Rotom, Rotom's plan, the road so far, crew chatter, jukebox, photo mode, on a phone). Each page reads the run
// through core/dominion/rotomDesk and never changes it; the only things written are the look settings (heard songs,
// photo count, the tall layout) through the session. Links out of a page go back through the scene's r5go.

import type Phaser from 'phaser';
import { askModel, chaptersModel, chatterDue, chatterModel, diaryModel, inboxModel, journalModel, msgsModel, planModel, radioModel } from '../../core/dominion/rotomDesk';
import { hqName } from '../../core/dominion/hq';
import { teamColours } from '../../core/dominion/founding';
import type { DominionBlock, DominionLook } from '../../core/dominion/schema';
import type { RunState } from '../../core/state';
import { services } from '../../game/services';
import type { InputAction } from '../../ui/input';
import type { R5Run } from '../../ui/redux/screens/dominion/r50/kit';
import { r5Ask, r5Chapters, r5Chatter, r5Diary, r5Inbox, r5Journal, r5Jukebox, r5Msgs, r5Photo, r5Plan, r5Portrait, r5Radio, type Pic } from '../../ui/redux/screens/dominion/r50/rotomPages';
import { pngSrc } from '../../ui/redux/screens/dominion/teamPic';
import { musicNow } from '../../ui/audio';
import { click, playTrack, snap, TRACKS } from './phone';

export const PHONE_PAGES = ['radio', 'inbox', 'msgs', 'journal', 'rdiary', 'ask', 'rplan', 'chapters', 'chatter', 'jukebox', 'photo', 'portrait'] as const;
export type PhonePage = (typeof PHONE_PAGES)[number];
export const isPhonePage = (id: string): id is PhonePage => (PHONE_PAGES as readonly string[]).includes(id);

/** Rotom's apps, as the Rotom settings tab lists them (label, about, page). */
export const PHONE_APPS: readonly (readonly [string, string, PhonePage])[] = [
  ['Ask Rotom', 'Five questions about tonight', 'ask'],
  ['Rotom’s plan', 'Three plans, one picked for you', 'rplan'],
  ['Rotom’s diary', 'What Rotom saw today', 'rdiary'],
  ['Inbox', 'Calls, alerts and letters', 'inbox'],
  ['Messages', 'Your crew, one chat each', 'msgs'],
  ['Radio', 'Four stations and the police band', 'radio'],
  ['Adventure log', 'Every day so far', 'journal'],
  ['The road so far', 'The chapters of this run', 'chapters'],
  ['Jukebox', 'Songs you have heard', 'jukebox'],
  ['Photo mode', 'A picture of the crew', 'photo'],
  ['On a phone', 'How the pages stack on a tall screen', 'portrait'],
];

/** Where an item's link goes (the models name places; these are the scene's page ids). */
const OUT: Record<string, string> = { desk: 'hq', hero: 'herotrack', rivals: 'rivals', jobs: 'jobs', papers: 'hq', crew: 'roster', market: 'map', hq: 'hq' };

const PHOTO = {
  pose: ['Victory', 'Cool', 'Shy'],
  frame: ['polaroid', 'border'],
  filter: ['sunset', 'night', 'mono', 'none'],
} as const;
const cap = (s: string): string => s[0]!.toUpperCase() + s.slice(1);

export interface PhoneHost {
  scene: Phaser.Scene;
  refresh(): void;
  r5run(): R5Run | null;
  /** Leaves the phone for a game page (the scene's r5go). */
  r5go(id: string): void;
  /** Opens a Settings page (the Boss Menu's go). */
  settings(id: string): void;
  /** A face in a ring `sz` wide (Rotom's when there is no look). */
  pic(look: string | null, sz: number): string;
  /** A whole person `h` tall (the chatter scene, the photo). */
  body(look: string, h: number): string;
  /** The Boss, `h` tall (the photo's middle). */
  boss(h: number): string;
  bossName(): string;
}

export class RotomPhone {
  private on: PhonePage | null = null;
  private from: string = 'hq';
  private at = 0;
  private sub = 0;
  private asked: number[] = [];
  private day = 0;
  private photo = { pose: 0, frame: 0, filter: 0, stickers: 3, who: 5 };
  private playing: string | null = null;
  /** Page changes seen this session (chatter shows every eighth, or fourth). */
  private pages = 0;
  private chat: number | null = null;

  constructor(private readonly host: PhoneHost) {}

  owns(): boolean {
    return this.on !== null;
  }
  get page(): PhonePage | null {
    return this.on;
  }

  private block(): DominionBlock | null {
    return services().session.run?.expansion?.dominion ?? null;
  }
  private run(): RunState | null {
    return services().session.run;
  }
  private look(): DominionLook {
    return services().session.settings.expansion.dominionPrefs.look;
  }
  private setLook(p: Partial<DominionLook>): void {
    const s = services().session;
    const d = s.settings.expansion.dominionPrefs;
    s.saveSettings({ ...s.settings, expansion: { ...s.settings.expansion, dominionPrefs: { ...d, look: { ...d.look, ...p } } } });
  }

  /** Opens a page; Back returns to `from` (a game page id, or a Settings page when it starts with `set:`). */
  open(id: PhonePage, from = 'hq'): void {
    if (!this.on) this.from = from;
    this.on = id;
    this.at = 0;
    this.sub = 0;
    if (id === 'rdiary') this.day = this.block()?.day ?? 1;
    if (id === 'ask') this.asked = [];
    if (id === 'jukebox') this.playing = musicNow();
    if (id === 'chatter') this.chat = this.pages;
  }
  close(): void {
    this.on = null;
  }
  private back(): void {
    const to = this.from;
    this.close();
    if (to.startsWith('set:')) this.host.settings(to.slice(4));
    else this.host.r5go(to);
  }

  /** A page change in the game: counts toward chatter. True when Rotom has something to say (the T chip's bubble). */
  turn(): boolean {
    this.pages++;
    return this.due();
  }
  due(): boolean {
    const b = this.block();
    return !!b && chatterDue(this.look().chatter, this.pages) && this.chat !== this.pages && !!chatterModel(b, this.pages);
  }
  /** T: the chatter when Rotom has some, else Ask Rotom. */
  rotomKey(from: string): void {
    this.open(this.due() ? 'chatter' : 'ask', from);
  }

  // ---------- drawing ----------

  render(): string {
    const b = this.block();
    const run = this.run();
    const r = this.host.r5run();
    if (!b || !run || !r || !this.on) return '';
    const pic: Pic = (look, sz) => this.host.pic(look, sz);
    switch (this.on) {
      case 'radio': {
        const ss = radioModel(b);
        return r5Radio(ss, this.at, this.sub, r);
      }
      case 'inbox': return r5Inbox(inboxModel(b, run), this.at, pic, r);
      case 'msgs': return r5Msgs(msgsModel(b, run), this.at, this.sub, pic, r);
      case 'journal': return r5Journal(journalModel(b), this.sub, this.host.bossName(), r);
      case 'rdiary': return r5Diary(diaryModel(b, run, this.day), r);
      case 'ask': return r5Ask(askModel(b, run), this.at, this.asked, r);
      case 'rplan': return r5Plan(planModel(b, run), this.at, r);
      case 'chapters': return r5Chapters(chaptersModel(b), this.at, r);
      case 'chatter': {
        const c = chatterModel(b, this.chat ?? this.pages);
        return c ? r5Chatter(c, pic, this.host.body(c.look, 300), this.at, r) : '';
      }
      case 'jukebox': {
        const heard = this.look().heard;
        return r5Jukebox(TRACKS.map((t) => ({ ...t, heard: heard.includes(t.id) })), this.at, this.playing, r);
      }
      case 'photo': return r5Photo(this.shot(b), this.at, r);
      case 'portrait': return r5Portrait(this.portrait(b, r), r);
    }
    return '';
  }

  private crewIn(b: DominionBlock): DominionBlock['members'] {
    return b.members.filter((m) => !m.crew?.out);
  }
  private shot(b: DominionBlock): Parameters<typeof r5Photo>[0] {
    const p = this.photo;
    const crew = this.crewIn(b);
    const n = Math.min(p.who, crew.length + 1);
    // The Boss stands in the middle, the crew either side (the mockup's line-up).
    const people = [...crew.slice(0, n - 1).map((m, i) => ({ pic: this.host.body(m.look, 130 - (i % 2) * 12), h: 130 - (i % 2) * 12 }))];
    people.splice(Math.floor(people.length / 2), 0, { pic: this.host.boss(170), h: 170 });
    return {
      rows: [['Pose', PHOTO.pose[p.pose]!], ['Frame', cap(PHOTO.frame[p.frame]!)], ['Filter', cap(PHOTO.filter[p.filter]!)], ['Stickers', p.stickers ? `${p.stickers} on` : 'Off'], ['Who is in it', `${n} of ${crew.length + 1}`]],
      who: people,
      caption: `${b.teamName ?? 'The crew'} · Day ${b.day}`,
      album: this.look().photos,
      filter: PHOTO.filter[p.filter]!,
      frame: PHOTO.frame[p.frame]!,
      stickers: p.stickers,
    };
  }
  private portrait(b: DominionBlock, r: R5Run): Parameters<typeof r5Portrait>[0] {
    const week = b.voices?.week ?? [];
    const crew = this.crewIn(b);
    return {
      hq: hqName(b),
      funds: r.funds,
      heat: b.heat,
      news: week[week.length - 1]?.l ?? 'All quiet in the papers',
      floors: [crew.slice(0, 3).map(() => 'g-idcard'), ['g-dark-gem', 'g-storage-key']],
      todo: [b.desk?.queue?.length ? `${b.desk.queue.length} on the desk` : 'Plan a job', `Heat ${b.heat}%`],
      says: `Rotom: Bzzt! ${crew.length} on the crew today.`,
      tall: this.look().tall,
    };
  }

  // ---------- doing ----------

  /** Enter on row `i` (or a page's own press). */
  private enter(i: number): void {
    const b = this.block();
    const run = this.run();
    if (!b || !run) return;
    click(this.host.scene);
    switch (this.on) {
      case 'radio': {
        const s = radioModel(b)[i];
        if (!s || s.locked) return;
        if (this.at === i) this.sub = (this.sub + 1) % Math.max(1, s.lines.length + 1);
        else { this.at = i; this.sub = 0; }
        return;
      }
      case 'inbox': {
        const it = inboxModel(b, run)[i];
        if (!it) return;
        this.close();
        return this.host.r5go(OUT[it.go] ?? 'hq');
      }
      case 'msgs': {
        const c = msgsModel(b, run)[this.at];
        const rep = c?.replies[i];
        if (!rep?.go) return;
        this.close();
        return this.host.r5go(OUT[rep.go] ?? rep.go);
      }
      case 'journal': {
        const pages = Math.max(1, Math.ceil(journalModel(b).length / 5));
        this.sub = (this.sub + (i < 0 ? -1 : 1) + pages) % pages;
        return;
      }
      case 'rdiary':
        this.day = Math.max(1, Math.min(b.day, this.day + (i < 0 ? -1 : 1)));
        return;
      case 'ask':
        this.at = i;
        if (!this.asked.includes(i)) this.asked = [...this.asked, i];
        return;
      case 'rplan': {
        const p = planModel(b, run).plans[i];
        if (!p) return;
        if (this.at !== i) { this.at = i; return; }
        this.close();
        return this.host.r5go(OUT[p.go] ?? 'jobs');
      }
      case 'chapters':
        this.at = i;
        return;
      case 'chatter':
        this.chat = this.pages;
        return this.back();
      case 'jukebox': {
        const t = TRACKS[i];
        this.at = i;
        if (t && playTrack(this.host.scene, t.id)) this.playing = t.id;
        return;
      }
      case 'photo':
        this.at = i;
        return this.change(1);
      case 'portrait':
        this.setLook({ tall: !this.look().tall });
        return;
    }
  }

  private count(): number {
    const b = this.block();
    const run = this.run();
    if (!b || !run) return 0;
    switch (this.on) {
      case 'radio': return radioModel(b).length;
      case 'inbox': return inboxModel(b, run).length;
      case 'msgs': return msgsModel(b, run).length;
      case 'ask': return askModel(b, run).length;
      case 'rplan': return planModel(b, run).plans.length;
      case 'chapters': return chaptersModel(b).length;
      case 'chatter': return 2;
      case 'jukebox': return TRACKS.length;
      case 'photo': return 5;
      default: return 0;
    }
  }

  /** ◀ ▶ on the photo's rows. */
  private change(dir: number): void {
    const p = this.photo;
    const crew = this.crewIn(this.block()!).length;
    const roll = (v: number, n: number): number => (v + dir + n) % n;
    if (this.at === 0) p.pose = roll(p.pose, PHOTO.pose.length);
    else if (this.at === 1) p.frame = roll(p.frame, PHOTO.frame.length);
    else if (this.at === 2) p.filter = roll(p.filter, PHOTO.filter.length);
    else if (this.at === 3) p.stickers = roll(p.stickers, 4);
    else if (this.at === 4) p.who = Math.max(1, Math.min(crew + 1, p.who + dir));
  }

  private async takePhoto(): Promise<void> {
    const b = this.block();
    if (!b) return;
    const s = this.shot(b);
    const tc = teamColours(b);
    const pics = this.crewIn(b).slice(0, Math.max(0, this.photo.who - 1)).map((m) => m.look).filter((l) => l.endsWith('.png')).map((l) => pngSrc(l, tc));
    if (await snap({ pics, caption: s.caption, filter: s.filter, frame: s.frame, stickers: s.stickers })) this.host.refresh();
  }

  acts(): Record<string, (arg: string) => void> {
    const done = (): void => this.host.refresh();
    return {
      r9at: (i) => { if (!this.on) return; this.at = Number(i); if (this.on === 'chatter' || this.on === 'ask' || this.on === 'chapters') this.enter(Number(i)); done(); },
      r9enter: (i) => { if (!this.on) return; this.enter(Number(i)); done(); },
      r9snap: () => { void this.takePhoto(); },
      r9tall: () => { this.setLook({ tall: !this.look().tall }); done(); },
      setLeft: (i) => { if (this.on !== 'photo') return; this.at = Number(i); this.change(-1); done(); },
      setRight: (i) => { if (this.on !== 'photo') return; this.at = Number(i); this.change(1); done(); },
    };
  }

  /** Letter and number keys. True when handled. */
  raw(code: string): boolean {
    if (!this.on) return false;
    const n = /^Digit([1-9])$/.exec(code);
    if (n && this.on === 'chatter') { this.enter(Number(n[1]) - 1); this.host.refresh(); return true; }
    if (code === 'KeyP' && this.on === 'photo') { void this.takePhoto(); return true; }
    if (code === 'KeyR' && this.on === 'rdiary') { this.close(); this.host.settings('readaloud'); this.host.refresh(); return true; }
    if (code === 'Enter' || code === 'NumpadEnter' || code === 'Space') return false;
    return code.startsWith('Digit') || (code.startsWith('Key') && !['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyZ', 'KeyX'].includes(code));
  }

  /** Arrows, Enter, Esc. True when handled. */
  key(a: InputAction): boolean {
    if (!this.on) return false;
    const wrap = this.look().wrap;
    const n = this.count();
    const step = (d: number): void => {
      if (!n) return;
      const j = this.at + d;
      this.at = wrap ? (j + n) % n : Math.max(0, Math.min(n - 1, j));
      if (this.on === 'radio') this.sub = 0;
    };
    if (a === 'back') { this.back(); return true; }
    if (a === 'up' || a === 'down') step(a === 'up' ? -1 : 1);
    else if (a === 'left' || a === 'right') {
      const d = a === 'left' ? -1 : 1;
      if (this.on === 'photo') this.change(d);
      else if (this.on === 'journal' || this.on === 'rdiary') this.enter(d);
      else if (this.on === 'msgs') { const c = msgsModel(this.block()!, this.run()!)[this.at]; const k = c?.replies.length ?? 0; if (k) this.sub = (this.sub + d + k) % k; }
      else if (this.on === 'chatter') step(d);
    } else if (a === 'confirm') {
      if (this.on === 'msgs') this.enter(this.sub);
      else if (this.on === 'journal') this.enter(1);
      else if (this.on === 'rdiary') this.enter(-1);
      else this.enter(this.at);
    }
    return true;
  }
}
