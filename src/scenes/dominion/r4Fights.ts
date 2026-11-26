// DOMINION redesign R4 (pass 50): the scene's side of the battle pages that got their own rules
// (core/dominion/bossFights.ts). Power gear and Pick a power (the Start menu), and the pages around a big fight: the
// Snapshot after a win, Phase two and the Betrayal before the fight they start, and the crew's help (team-up away, steps
// in at the HQ) just before the battle. Cursors live here; every change to the run is a session step.

import type { Content } from '../../core/contentSchema';
import {
  assistDue, assistKind, betrayalLevel, betrayalOf, betrayalWaiting, carried, FIGHTS, foePreview, GEAR, gearRegion, helpers,
  noPowerLine, phaseWaiting, powerLines, powerSlots, assistCut,
} from '../../core/dominion/bossFights';
import { albumOf } from '../../core/dominion/jobs';
import { teamDef } from '../../core/dominion/rivals';
import type { DominionBlock } from '../../core/dominion/schema';
import { maxHp } from '../../core/pokemon';
import { services } from '../../game/services';
import type { InputAction } from '../../ui/input';
import { R5_SIZES } from '../../ui/redux/screens/dominion/r50/sizes';
import { SP, faceOf, type R5Run } from '../../ui/redux/screens/dominion/r50/kit';
import type { R5Person } from '../../ui/redux/screens/dominion/r50/jobs';
import { r5CrewIn, r5Gear, r5Legend, r5Phase, r5Power, r5Snap, r5TeamUp } from '../../ui/redux/screens/dominion/r50/fights';
import { memberBig, memberColour, memberSpeaker } from './r4Bridge';
import { facePic } from './r50Bridge';
import { leaderPic } from './r4Jobs';

export interface FightsHost {
  block(): DominionBlock | null;
  refresh(): void;
  people(): { run: R5Run; boss: R5Person } | null;
  monPic(species: string, h: number): string;
  /** Start the battle the block waits on (the scene's own fight(), which asks this controller first). */
  fight(from: string): void;
  /** A line for the page the scene goes back to. */
  notice(line: string | null): void;
}

type Mode = 'gear' | 'power' | 'phase' | 'assist' | 'legend' | 'snap';
const nice = (id: string): string => id.replace(/-/g, ' ').replace(/\b\w/g, (x) => x.toUpperCase());
const pct = (a: number, b: number): number => Math.max(0, Math.min(100, Math.round((100 * a) / Math.max(1, b))));

export class FightsX {
  private mode: Mode | null = null;
  private at = 0;
  private from = 'hq';
  private line: string | null = null;
  /** Pages already shown for the fight waiting (a page shows once; UI only). */
  private seen = new Set<string>();

  constructor(private readonly host: FightsHost) {}

  reset(): void {
    this.mode = null;
    this.at = 0;
    this.line = null;
  }
  owns(): boolean {
    return this.mode !== null;
  }
  private content(): Content {
    return services().session.content;
  }
  private run() {
    return services().session.run!;
  }
  private tag(b: DominionBlock, page: string): string {
    const f = b.field.fight;
    return `${page}|${b.day}|${f?.why}|${f?.racket}|${f?.phase ?? 1}`;
  }
  private open(mode: Mode, from: string, at = 0): true {
    this.mode = mode;
    this.from = from;
    this.at = at;
    this.line = null;
    this.host.refresh();
    return true;
  }

  // ---------- opening ----------

  /** The Start menu's Power gear. */
  openGear(): void {
    const b = this.host.block();
    const on = b ? Math.max(0, GEAR.findIndex((g) => g.kind === carried(b))) : 0;
    this.open('gear', this.from, on);
  }

  /** Before a battle starts: the Betrayal, Phase two, then the crew's help, each once. True: the page waits on the player. */
  preFight(from: string): boolean {
    const b = this.host.block();
    if (!b?.field.fight || b.field.fight.begun) return false;
    if (betrayalWaiting(b) && !this.seen.has(this.tag(b, 'legend'))) return this.open('legend', from);
    if (phaseWaiting(b) && !this.seen.has(this.tag(b, 'phase'))) return this.open('phase', from);
    if (assistDue(b)) return this.open('assist', from);
    return false;
  }

  /** Back from a battle: the Snapshot of a big win, then what the next fight brings. */
  afterFight(back: string | null): boolean {
    const b = this.host.block();
    if (!b) return false;
    if (b.jobx?.snap) return this.open('snap', back ?? 'hq');
    return back ? this.preFight(back) : false;
  }

  private go(): void {
    const from = this.from;
    this.mode = null;
    this.host.fight(from);
  }

  // ---------- drawing ----------

  render(): string {
    const b = this.host.block(), q = this.host.people();
    if (!b || !q || !this.mode) return '';
    switch (this.mode) {
      case 'gear': return this.gear(b, q.run);
      case 'power': return this.power(b, q.run);
      case 'phase': return this.phase(b, q.run);
      case 'assist': return this.assist(b, q.run);
      case 'legend': return this.legend(b, q);
      case 'snap': return this.snap(b, q.run);
    }
  }

  private lead(h: number): string {
    const run = this.run(), m = run.party.find((x) => x.hp > 0) ?? run.party[0];
    return m ? this.host.monPic(m.speciesId, h) : '';
  }

  private gear(b: DominionBlock, run: R5Run): string {
    const c = this.content(), open = powerSlots(c, b), on = carried(b);
    const rows = GEAR.map((g, i) => ({
      gear: g.gear, icon: g.pic, ready: i < open, carried: g.kind === on,
      sub: i < open ? `${g.name} · ${g.kind === on ? 'carried into your next fight' : 'ready to carry'}` : `${g.name} · opens in Region ${gearRegion(i)}`,
      tag: i < open ? 'Ready' : `Region ${gearRegion(i)}`,
    }));
    return r5Gear({ rows, at: this.at, open, pic: this.lead(110), lines: open ? powerLines(c) : [noPowerLine(c), ...powerLines(c).slice(1)], note: this.line }, run);
  }

  private power(b: DominionBlock, run: R5Run): string {
    const c = this.content(), open = powerSlots(c, b), on = carried(b);
    const cards = GEAR.map((g, i) => ({ kind: g.kind, name: g.name, about: g.about, icon: g.pic, ready: i < open, art: this.lead(120), tag: g.kind === on ? 'Carried' : i < open ? 'Ready' : `Region ${gearRegion(i)}` }));
    const sel = GEAR[this.at];
    const g = on ? GEAR.find((x) => x.kind === on) : null;
    return r5Power({ cards, at: this.at, sub: g ? `You carry the ${g.gear}` : 'No gear carried', line: this.line ?? (open ? FIGHTS.power.pick : noPowerLine(c)), verb: sel?.verb ?? 'Carry' }, run);
  }

  private phase(b: DominionBlock, run: R5Run): string {
    const f = b.field.fight!, team = teamDef(f.racket ?? ''), P = FIGHTS.phase;
    const boss = team?.boss.name ?? 'The Boss', his = 'His';
    const hs = helpers(b);
    const v = { boss, his, atk: P.atk, who: hs[0]?.m.name ?? 'Your crew', team: team?.name ?? 'the team' };
    const fillv = (t: string): string => t.replace(/\{(\w+)\}/g, (_, k: string) => String((v as Record<string, string | number>)[k] ?? ''));
    const changes = P.changes.map((x, i) => ({ ...x, title: fillv(x.title), text: i === 3 && !hs.length ? P.noCrew : fillv(x.text) }));
    const id = team?.boss.id ?? null;
    return r5Phase({
      boss, role: `${team?.tag ?? 'Rival'} Boss`, pic: leaderPic(id, 300), word: P.word, sub: fillv(P.sub), changes,
      speaker: { name: boss, ...(id && R5_SIZES[`t-${id}`] ? { k: `t-${id}` } : {}) }, line: `“${fillv(P.lines[0]!)}”`,
    }, run);
  }

  private assist(b: DominionBlock, run: R5Run): string {
    const kind = assistKind(b.field.fight), hs = helpers(b), c = this.content();
    if (kind === 'teamup') {
      const T = FIGHTS.assist.teamup, first = hs[0]?.m;
      const crew = hs.map((h) => ({ name: h.m.name, pic: memberBig(h.m.look, b, 150), mon: this.host.monPic(h.mon.speciesId, 120) }));
      return r5TeamUp({ word: T.word.replace('{tag}', (run.side ?? 'Crew').replace(/^Team\s+/i, '')), sub: T.sub, crew, speaker: first ? memberSpeaker(first, b) : null, line: `“${T.lines[b.day % T.lines.length]}”`, cut: assistCut(c, 'teamup', hs) }, run);
    }
    const C = FIGHTS.assist.crewin, foe = foePreview(b, this.run());
    const rows = hs.map((h) => {
      const top = maxHp(c, h.mon), p = pct(h.mon.hp, top);
      return { name: h.m.name, mon: c.species.get(h.mon.speciesId)?.name ?? nice(h.mon.speciesId), face: facePic(h.m.look, b, 48), colour: memberColour(h.m.look, b), hp: p, text: `${p >= 100 ? C.fresh : `${C.hurtWord} · ${p}% HP`} · takes ${assistCut(c, 'crewin', [h])}% off their lead` };
    });
    const me = this.run().party.find((x) => x.hp > 0);
    const f = b.field.fight!;
    return r5CrewIn({
      foe: foe ? { name: c.species.get(foe.species)?.name ?? nice(foe.species), level: foe.level, pips: foe.count, pic: `<span class="b8-foe" style="display:block">${this.host.monPic(foe.species, 200)}</span>` } : null,
      trainer: foe ? { name: foe.name, face: faceOf(foe.leaderId ? leaderPic(foe.leaderId, 100) : SP('t-grunt', 100), 40, '#ef3b2c'), sub: f.why === 'heroRaid' ? 'The Hero' : 'At the door' } : null,
      clock: { label: f.why === 'rival' ? 'Boss at the door' : f.why === 'heroRaid' ? 'Hero at the door' : 'HQ raid', n: foe?.count ?? 1, unit: 'Pokémon to beat' },
      me: me ? { name: c.species.get(me.speciesId)?.name ?? nice(me.speciesId), level: me.level, hp: me.hp, max: maxHp(c, me), pic: `<span class="b8-me" style="display:block;transform:scaleX(-1)">${this.host.monPic(me.speciesId, 230)}</span>` } : null,
      rows, at: this.at, head: C.head, about: C.about,
    }, run);
  }

  private legend(b: DominionBlock, q: { run: R5Run }): string {
    const f = b.field.fight!, e = betrayalOf(f.racket), team = teamDef(f.racket ?? ''), B = FIGHTS.betrayal;
    const admin = team?.admins.find((a) => a.id === e?.admin);
    const adminName = admin?.name ?? 'The admin', boss = team?.boss.name ?? 'The Boss';
    const legendName = this.content().species.get(e?.legend ?? '')?.name ?? nice(e?.legend ?? '');
    const level = e ? betrayalLevel(e, this.run().party) : 1;
    const ak = admin ? `c-${admin.id}` : '';
    const adminPic = (h: number): string => (R5_SIZES[ak] ? SP(ak, h) : leaderPic(admin?.id ?? null, h));
    const person = (pic: string, name: string, role: string, colour: string, face: (sz: number) => string): R5Person => ({ pic, name, role, colour, face });
    const fill = (t: string): string => t.replace('{boss}', boss).replace('{team}', team?.name ?? 'the team').replace('{admin}', adminName).replace('{legend}', legendName);
    return r5Legend({
      small: B.small, word: B.word,
      boss: person(leaderPic(team?.boss.id ?? null, 250), boss, fill(B.role), '#7d8298', (sz) => leaderPic(team?.boss.id ?? null, sz * 2.5)),
      legend: person(this.host.monPic(e?.legend ?? '', 250), legendName, `Lv ${level} · catchable`, '#c1121f', (sz) => this.host.monPic(e?.legend ?? '', sz)),
      admin: person(adminPic(250), adminName, 'Admin', '#4a5fa0', (sz) => `<span style="display:block;margin-top:${-Math.round(sz * 0.08)}px">${adminPic(Math.round(sz * 2.5))}</span>`),
      line: e ? fill(e.line) : '', face: fill(B.face),
    }, q.run);
  }

  private snap(b: DominionBlock, run: R5Run): string {
    const s = b.jobx!.snap!;
    return r5Snap({
      mine: `<span style="display:block;transform:scaleX(-1)">${this.host.monPic(s.mine, 120)}</span>`, foe: this.host.monPic(s.foe, 150),
      text: s.text, count: albumOf(b).length, max: 40, note: FIGHTS.snap.note, line: `“${FIGHTS.snap.line}”`,
    }, run);
  }

  // ---------- answers ----------

  private step(a: Parameters<ReturnType<typeof services>['session']['dominionStep']>[0]) {
    return services().session.dominionStep(a);
  }

  private carry(i: number): void {
    const g = GEAR[i];
    if (!g) return;
    const out = this.step({ t: 'power', kind: g.kind });
    this.line = out.notice;
    this.host.refresh();
  }

  private answerAssist(yes: boolean): void {
    const b = this.host.block();
    if (!b) return;
    const hs = helpers(b), kind = assistKind(b.field.fight);
    const by = !yes ? [] : kind === 'teamup' ? hs.map((h) => h.m.id) : hs[this.at] ? [hs[this.at]!.m.id] : [];
    this.step({ t: 'assist', by });
    this.go();
  }

  private answerSnap(keep: boolean): void {
    this.step({ t: 'snap', keep });
    this.mode = null;
    this.host.notice(keep ? FIGHTS.snap.saved : null);
    if (!this.preFight(this.from)) this.host.refresh();
  }

  private seenGo(page: 'legend' | 'phase'): void {
    const b = this.host.block();
    if (b) this.seen.add(this.tag(b, page));
    this.go();
  }

  key(a: InputAction): boolean {
    const b = this.host.block();
    if (!this.mode || !b) return false;
    const n = this.mode === 'gear' || this.mode === 'power' ? GEAR.length : this.mode === 'assist' ? helpers(b).length : 1;
    const prev = a === 'up' || a === 'left', next = a === 'down' || a === 'right';
    if ((prev || next) && n > 1 && (this.mode === 'gear' || this.mode === 'power' || (this.mode === 'assist' && assistKind(b.field.fight) === 'crewin'))) {
      this.at = (this.at + (prev ? n - 1 : 1)) % n;
      this.line = null;
      this.host.refresh();
      return true;
    }
    if (a === 'confirm') {
      if (this.mode === 'gear') return this.open('power', this.from, this.at), true;
      if (this.mode === 'power') return this.carry(this.at), true;
      if (this.mode === 'phase') return this.seenGo('phase'), true;
      if (this.mode === 'legend') return this.seenGo('legend'), true;
      if (this.mode === 'assist') return this.answerAssist(true), true;
      if (this.mode === 'snap') return this.answerSnap(true), true;
    }
    if (a === 'back') {
      if (this.mode === 'power') return this.open('gear', this.from, this.at), true;
      if (this.mode === 'gear') { this.mode = null; this.host.refresh(); return true; }
      if (this.mode === 'assist') return this.answerAssist(false), true;
      if (this.mode === 'snap') return this.answerSnap(false), true;
    }
    return true;
  }

  /** Every other key is eaten while a page is up. */
  raw(_code: string): boolean {
    return this.mode !== null;
  }

  acts(): Record<string, (arg: string) => void> {
    const at = (i: string): number => Number(i) || 0;
    return {
      gearAt: (i) => { this.at = at(i); this.host.refresh(); },
      gearPick: () => void this.open('power', this.from, this.at),
      gearBack: () => { this.mode = null; this.host.refresh(); },
      powerAt: (i) => { this.at = at(i); this.line = null; this.host.refresh(); },
      powerUse: (i) => this.carry(i === '' ? this.at : at(i)),
      powerBack: () => void this.open('gear', this.from, this.at),
      phaseGo: () => this.seenGo('phase'),
      legendGo: () => this.seenGo('legend'),
      assistYes: () => this.answerAssist(true),
      assistNo: () => this.answerAssist(false),
      crewInAt: (i) => { this.at = at(i); this.answerAssist(true); },
      snapKeep: () => this.answerSnap(true),
      snapSkip: () => this.answerSnap(false),
    };
  }
}
