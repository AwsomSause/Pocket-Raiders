// DOMINION redesign R3: the scene's side of The Day's pass-50 pages. Builds the live data for the Region Map, the
// District file, Walk the street and Place your crew, and keeps the pages that sit over the map or the file (street,
// deploy) with their cursors. Every change goes through the scene's `step` (core rules); nothing here rolls.

import { dayActions } from '../../core/dominion/clock';
import type Phaser from 'phaser';
import { DOMINION_DATA } from '../../core/dominion/data';
import { crewOf, taskById } from '../../core/dominion/crew';
import { taskLabel } from '../../core/dominion/crewScreens';
import { whereOf } from '../../core/dominion/empire';
import { districtModel } from '../../core/dominion/districtScreen';
import { mapModel, type MapCursor, type MapModel } from '../../core/dominion/fieldScreens';
import { heroAt, heroDefOf } from '../../core/dominion/hero';
import { teamColours } from '../../core/dominion/founding';
import type { DominionAction, DominionBlock } from '../../core/dominion/schema';
import { services } from '../../game/services';
import type { InputAction } from '../../ui/input';
import { tall } from '../../ui/redux/kit';
import { art, SP, type R5Run, type R5Speaker } from '../../ui/redux/screens/dominion/r50/kit';
import { r5Deploy, r5District, r5Map, r5Street, type MeetPanel, type R5Deploy, type R5MapExtras } from '../../ui/redux/screens/dominion/r50/day';
import { PHASES, r5Calendar, r5Clock, r5Recap, type R5CalDay, type R5Clock, type R5Phase, type R5RecapCard } from '../../ui/redux/screens/dominion/r50/day3';
import { r5Assign, r5Evening, r5Ledger, r5Morning, r5Paper, type R5Evening } from '../../ui/redux/screens/dominion/r50/day2';
import { assignModel } from '../../core/dominion/assignScreen';
import { morningModel } from '../../core/dominion/crewScreens';
import { ledgerModel } from '../../core/dominion/ledgerScreens';
import { paperModel } from '../../core/dominion/moments';
import { actionDef } from '../../core/dominion/field';
import type { CrewCursors } from './crewController';
import { bossPic, facePic, r5Run } from './r50Bridge';
import { memberPic } from '../../ui/redux/screens/dominion/teamPic';

const F = () => DOMINION_DATA.field;

/** The Gym Leader (or the town's face) the mockups drew; other towns show their first target's owner. */
const LEAD: Record<string, string> = { cerulean: 't-misty', celadon: 't-erika', saffron: 't-sabrina', fuchsia: 't-koga', viridian: 't-gio' };

/** A full-length picture of a look (a dominion png or a trainer atlas) `h` tall. */
function fullPic(look: string, h: number): string {
  if (look.endsWith('.png')) return art(look.replace(/^dominion\//, '').replace(/\.png$/, ''), h, 'lead12');
  return tall(look, h, 'lead12') || SP('t-grunt', h, 'lead12');
}
export function districtFace(id: string, h: number): string {
  if (LEAD[id]) return SP(LEAD[id]!, h, 'lead12');
  const d = F().districts.find((x) => x.id === id);
  return fullPic(d?.targets[0]?.owner.look ?? 'dominion/t-grunt.png', h);
}

const bossFace = (file: string | null, sz: number): string => `<span style="display:block;margin-left:${-Math.round(sz * 0.25)}px;margin-top:-2px">${bossPic(file, sz * 2.5)}</span>`;

export function mapExtras(b: DominionBlock, c: MapCursor, bossFile: string | null): R5MapExtras {
  const spots: R5MapExtras['spots'] = {};
  const heroKnown = !!b.hero && (b.hero.met || b.hero.intel >= b.day);
  const hAt = heroKnown ? heroAt(b) : null;
  for (const d of F().districts) {
    const ds = b.field.districts[d.id]!;
    const crew = b.members.filter((m) => !crewOf(m).out && crewOf(m).where === d.id && taskById(crewOf(m).task)?.effect?.kind === 'district').map((m) => facePic(m.look, b, 26));
    if (b.field.at === d.id) crew.unshift(bossFace(bossFile, 26));
    spots[d.id] = { crew: crew.slice(0, 3), hero: hAt === d.id, rk: ds.rival >= 50 ? 2 : ds.rival >= 20 ? 1 : 0 };
  }
  const h = b.hero ? heroDefOf(b.hero.id) : null;
  return {
    spots,
    face: districtFace(c.district, 74),
    hero: h && heroKnown ? { pic: facePic(h.look, null, 26), name: h.name } : null,
    team: b.team?.name ?? b.teamName ?? 'Your crew',
    rivalInitial: F().rivalTeam.replace(/^Team /, '')[0] ?? 'R',
    region: F().region[0]!.toUpperCase() + F().region.slice(1),
    who: ROTOM,
  };
}
const ROTOM: R5Speaker = { name: 'Rotom', k: 'p-rotom' };

/** The map's line: the file's alert, else what's left today. */
const alertOf = (m: MapModel): string | null => m.file.alert?.text ?? null;

export type DayPage = 'street' | 'deploy' | 'evening' | 'clock' | 'recap' | 'calendar';

interface Host {
  screenName: string;
  setNotice(n: string | null): void;
  refresh(): void;
  step(a: DominionAction): boolean;
  dayCursor(): MapCursor | null;
  setDayCursor(c: MapCursor): void;
  dayNotice(): string | null;
  dayCard(): void;
  dayBoss(): string | null;
  /** The HQ's Next (the clock's button): the scene's own step to the next phase. */
  dayNext(): void;
}

/** The Day's pages that sit over the map (deploy) or the District file (street). */
export class DayPages {
  page: DayPage | null = null;
  private base = '';
  private at = 0;
  /** Focus view on the map (F): the HUD folds away. Presentation only. */
  focus = false;
  constructor(private readonly scene: Phaser.Scene, private readonly host: Host) {}

  private block(): DominionBlock | null {
    const r = services().session.run;
    return (r?.expansion as { dominion?: DominionBlock } | undefined)?.dominion ?? null;
  }
  /** The chrome's data, with the place sign saying where the Boss is and when. */
  private run(b: DominionBlock): R5Run {
    const where = F().districts.find((d) => d.id === b.field.at)?.name ?? '';
    const ph = DOMINION_DATA.start.clock.phases.find((p) => p.id === b.phase)?.word.toLowerCase() ?? '';
    return { ...r5Run(this.scene, b), place: `${where} · ${ph}` };
  }

  owns(): boolean {
    if (!this.page) return false;
    if (this.host.screenName === this.base) return true;
    if (this.host.screenName !== 'card') this.page = null;
    return false;
  }

  /** Opens a page over the map or the file. False when the page can't open here. */
  open(p: DayPage): boolean {
    const s = this.host.screenName;
    if (p === 'street' && s !== 'district' && s !== 'map') return false;
    if (p === 'deploy' && s !== 'map') return false;
    if (p === 'street' && s === 'map') return false;
    if (p === 'evening' && s !== 'hq' && s !== 'map') return false;
    if ((p === 'clock' || p === 'recap' || p === 'calendar') && s !== 'hq' && s !== 'map' && s !== 'district') return false;
    this.page = p;
    this.base = s;
    const b = this.block();
    this.at = p === 'clock' && b ? Math.max(0, PHASES.indexOf(b.phase as R5Phase)) : p === 'calendar' ? this.calToday() : 0;
    this.host.setNotice(null);
    this.host.refresh();
    return true;
  }
  close(): void { this.page = null; this.host.setNotice(null); this.host.refresh(); }

  // ---------- the map and the file (the scene's own screens) ----------

  mapPage(b: DominionBlock, c: MapCursor, notice: string | null, garage: boolean, meet: MeetPanel | null): string {
    const m = mapModel(b, services().session.run!, c);
    return r5Map(m, mapExtras(b, c, this.host.dayBoss()), { notice, garage, meet, alert: alertOf(m), focus: this.focus, evening: b.phase === 'evening' }, this.run(b));
  }
  districtPage(b: DominionBlock, c: MapCursor, notice: string | null): string {
    return r5District(districtModel(b, services().session.run!, c), districtFace(c.district, 190).replace('lead12', 'fspr'), notice, this.run(b));
  }

  // ---------- the pages it keeps ----------

  render(notice: string | null): string {
    const b = this.block(), c = this.host.dayCursor();
    if (b && this.page === 'evening') return r5Evening(this.eveningModel(b), this.run(b));
    if (b && this.page === 'clock') return r5Clock(this.clockModel(b), this.run(b));
    if (b && this.page === 'recap') return r5Recap(this.recapModel(b), this.run(b));
    if (b && this.page === 'calendar') return r5Calendar(this.calModel(b), this.run(b));
    if (!b || !c) return '';
    if (this.page === 'deploy') return r5Deploy(mapModel(b, services().session.run!, c), mapExtras(b, c, this.host.dayBoss()), this.deployModel(b, c), notice, this.run(b));
    return r5Street(this.streetModel(b, c), notice, this.run(b));
  }

  private deployModel(b: DominionBlock, c: MapCursor): R5Deploy {
    const tc = teamColours(b);
    const open = b.phase === 'morning' || b.phase === 'evening';
    const rows = b.members.map((m) => {
      const cr = crewOf(m);
      const district = taskById(cr.task)?.effect?.kind === 'district';
      const where = F().districts.find((d) => d.id === whereOf(m))?.name ?? '';
      return { id: m.id, name: m.name, pic: facePic(m.look, b, 34), colour: tc?.primary ?? '#3f7fd9', where: cr.out ? 'Out of action' : district ? `${where} · ${taskLabel(cr.task)}` : `${taskLabel(cr.task)} · pick a district`, placed: district && !!cr.where, can: !cr.out };
    });
    this.at = Math.min(this.at, Math.max(0, rows.length - 1));
    const sel = rows[this.at];
    const dn = F().districts.find((d) => d.id === c.district)?.name ?? '';
    const line = !open ? 'Crew are placed in the Morning or the Evening.' : sel ? `${sel.name} to ${dn}? Enter places them.` : 'Nobody to place yet.';
    const placed = rows.filter((r) => r.placed).length;
    return { rows, at: this.at, left: `${placed} of ${rows.length} placed`, line, who: sel ? { name: sel.name, pic: sel.pic, colour: sel.colour } : ROTOM };
  }

  private place(district: string): void {
    const b = this.block(), c = this.host.dayCursor();
    const m = b?.members[this.at];
    if (!b || !c || !m) return;
    this.host.setDayCursor({ ...c, district, target: 0 });
    if (this.host.step({ t: 'where', member: m.id, district })) this.host.setNotice(null);
    else this.host.setNotice('Crew are placed in the Morning or the Evening, at the HQ.');
    this.host.refresh();
  }

  private streetModel(b: DominionBlock, c: MapCursor) {
    const d = F().districts.find((x) => x.id === c.district)!;
    const dm = districtModel(b, services().session.run!, c);
    const sel = dm.columns.flatMap((x) => x.acts).find((a) => a.on);
    const t = d.targets[c.target];
    const m = b.members[0];
    return {
      district: d.name,
      targets: d.targets.map((x, i) => ({ id: x.id, name: x.name, kind: x.kind, sub: dm.targets[i]?.pays || x.owner.name, on: i === c.target })),
      action: sel?.label ?? 'Look around',
      cta: dm.cta,
      walker: m ? memberPic(m.look, 96, 'width:64px;height:96px;object-fit:contain;object-position:bottom', teamColours(b)) : SP('c-rook', 96),
      who: m ? { name: m.name, pic: facePic(m.look, b, 40), colour: '#3f7fd9' } : ROTOM,
      line: t ? `“${t.owner.line}”` : `${d.name}. Pick a door.`,
    };
  }

  // ---------- the Morning, Assign a task, the paper, the Ledger (other controllers' screens) ----------

  private faces(b: DominionBlock, sz: number): string[] { return b.members.map((m) => facePic(m.look, b, sz)); }
  private colour(b: DominionBlock): string { return teamColours(b)?.primary ?? '#3f7fd9'; }

  crewPage(page: 'morning' | 'assign', b: DominionBlock, c: CrewCursors, notice: string | null): string {
    const tc = teamColours(b);
    const sel = b.members[Math.min(c.sel, b.members.length - 1)];
    const pic = sel ? memberPic(sel.look, 110, 'height:110px;width:80px;object-fit:contain;object-position:bottom', tc) : SP('c-rook', 110);
    if (page === 'assign') {
      const m = assignModel(b, c.sel, c.asAt, c.all);
      const faces: Record<string, string> = {};
      for (const x of b.members) faces[x.id] = facePic(x.look, b, 30);
      return r5Assign(m, pic, faces, this.colour(b), notice, this.run(b));
    }
    const m = morningModel(b, c.sel, -1, false);
    const talk = m.talk ? { t: m.talk, at: c.talkAt, pic: facePic(b.members.find((x) => x.name === m.talk!.name)?.look ?? sel?.look ?? '', b, 40), colour: this.colour(b) } : null;
    const tm = m.tasks.find((t) => t.on);
    const n = b.members.length, acts = b.phase === 'morning' ? dayActions(b) : b.actions;
    const today = [
      `${n} crew, ${acts} action${acts === 1 ? '' : 's'} ${b.phase === 'morning' ? 'when the day starts' : 'left today'}.`,
      `Heat ${b.heat}%. It cools if you lie low.`,
    ];
    return r5Morning(m, { faces: this.faces(b, 30), pic, colour: this.colour(b), at: c.taskAt, talk, notice, today }, this.run(b));
  }

  /** The page a row of the Morning report opens (the last row is the rival badge). */
  morningGo(b: DominionBlock, i: number): string | null {
    const m = morningModel(b, 0, -1, false);
    const n = Math.max(1, m.alerts.length);
    if (i >= n) return 'rival';
    const k = m.alerts[i]?.kind;
    return k === 'crew' ? 'roster' : k === 'money' ? 'ledger' : k === 'rival' ? 'rival' : k === 'hero' ? 'herotrack' : null;
  }

  paperPage(b: DominionBlock): string {
    const run = services().session.run!;
    const m = paperModel(b, run.seed, run.ai);
    const photo = m.photo ? memberPic(m.photo.look, 120, 'height:120px;width:72px;object-fit:contain;object-position:bottom', teamColours(b)) : SP('p-rotom', 90);
    const jobs = (b.paper?.jobs ?? []).filter((j) => j.d === b.day - 1);
    const heat = jobs.reduce((a, j) => a + j.heat, 0), take = jobs.reduce((a, j) => a + j.pay, 0);
    const glance: [string, string][] = jobs.length ? [['Jobs', String(jobs.length)], ['Heat', `${heat >= 0 ? '+' : ''}${heat}`], ['Take', `₽${take.toLocaleString('en-US')}`]] : [['Jobs', 'none']];
    return r5Paper(m, photo, glance, this.run(b));
  }

  ledgerPage(b: DominionBlock, spread: number, notice: string | null): string {
    const run = services().session.run!;
    const m = ledgerModel(b, run, spread);
    const weeks = (b.empire?.weeks ?? []).slice(-6);
    const labels = [...weeks.map((w) => `Week ${w.w}`), 'This week'];
    const ins = m.money.lines.filter((l) => l.plus), outs = m.money.lines.filter((l) => !l.plus);
    const sum = (ls: typeof ins): number => ls.reduce((a, l) => a + Number(l.n.replace(/[^\d]/g, '')), 0);
    const inNow = sum(ins), outNow = sum(outs);
    const note = (ls: typeof ins): string => {
      const due = ls.find((l) => l.due)?.due;
      return (ls.map((l) => `${l.label.replace(/\s*\(.*?\)/g, '')} ${l.n.replace(/^[+−]/, '')}`).join(' · ') || 'Nothing yet') + (due ? ` · ${due}` : '');
    };
    const wk = (w: { lines: Record<string, number> }, plus: boolean): number => Object.values(w.lines).reduce((a, n) => a + (plus ? Math.max(0, n) : Math.max(0, -n)), 0);
    const money = (n: number): string => `₽${n.toLocaleString('en-US')}`;
    const dirty = Number(m.money.dirty.replace(/[^\d]/g, '')), clean = Number(m.money.clean.replace(/[^\d]/g, ''));
    const lead = b.members[0];
    return r5Ledger(m, {
      line: m.money.scribble ?? (m.money.netPlus ? 'The week is in the black so far, Boss.' : 'Bills come due at the end of the week.'),
      who: lead ? { name: lead.name, pic: facePic(lead.look, b, 40), colour: this.colour(b) } : null,
      notice,
      barsIn: [...weeks.map((w) => wk(w, true)), inNow], barsOut: [...weeks.map((w) => wk(w, false)), outNow], labels,
      inSum: money(inNow), outSum: money(outNow), inNote: note(ins), outNote: note(outs),
      dirtyPct: b.funds > 0 ? Math.round((100 * dirty) / Math.max(1, dirty + clean)) : 0,
    }, this.run(b));
  }

  private eveningModel(b: DominionBlock): R5Evening {
    const run = services().session.run!;
    const jobs = (b.paper?.jobs ?? []).filter((j) => j.d === b.day);
    const take = jobs.reduce((a, j) => a + j.pay, 0);
    const good = jobs.filter((j) => j.res === 'done' || j.res === 'big' || j.res === 'won').length;
    const who = (id: string | null): string => (id ? b.members.find((m) => m.id === id)?.name ?? 'The Boss' : 'The Boss');
    const tgt = (id: string | null, at: string): string => F().districts.find((d) => d.id === at)?.targets.find((t) => t.id === id)?.name ?? F().districts.find((d) => d.id === at)?.name ?? at;
    const lines = jobs.slice(-5).map((j) => ({
      who: who(j.who),
      what: `${actionDef(j.a)?.name.replace(/\s*\(.*\)/, '') ?? j.a} · ${tgt(j.t, j.at)}${j.pay ? ` · ₽${j.pay.toLocaleString('en-US')}` : ''}${j.heat ? ` · Heat ${j.heat > 0 ? '+' : ''}${j.heat}` : ''}`,
      up: j.res === 'done' || j.res === 'big' || j.res === 'won',
    }));
    const clipM = jobs.length ? paperModel({ ...b, day: b.day + 1 }, run.seed) : null;
    const lead = b.members[0];
    return {
      day: b.day,
      take: `${take ? '+' : ''}₽${take.toLocaleString('en-US')}`,
      sub: jobs.length ? `${jobs.length} job${jobs.length === 1 ? '' : 's'} · ${good} clean, ${jobs.length - good} close call${jobs.length - good === 1 ? '' : 's'}` : 'No jobs today',
      lines,
      clip: clipM ? { mast: `${clipM.masthead} · Day ${b.day + 1}`, head: clipM.head, note: clipM.deck } : null,
      line: jobs.length ? `“${good * 2 >= jobs.length ? 'Another good day' : 'A rough day'} for ${b.team?.name ?? b.teamName ?? 'the crew'}.”` : '“Quiet one, Boss. Tomorrow we hit harder.”',
      who: lead ? { name: lead.name, pic: facePic(lead.look, b, 40), colour: this.colour(b) } : null,
    };
  }

  // ---------- the clock, last night, the calendar ----------

  private clockRow(i: number): void {
    const b = this.block();
    if (!b) return;
    if (i !== this.at) { this.at = i; return this.host.refresh(); }
    const p = PHASES[i];
    if (p === b.phase && p === 'morning') { this.page = 'recap'; this.at = 0; return this.host.refresh(); }
    if (p === 'evening' && b.phase === 'evening') { this.page = 'evening'; return this.host.refresh(); }
    if (p === b.phase) { this.page = null; this.host.dayNext(); }
  }

  private clockModel(b: DominionBlock): R5Clock {
    const ph = (PHASES.includes(b.phase as R5Phase) ? b.phase : 'morning') as R5Phase;
    const acts = ph === 'morning' ? dayActions(b) : b.actions;
    const nightLeft = Math.max(0, 1 - b.nightActions);
    const what: Record<R5Phase, string> = {
      morning: 'Night report, paper, assign the crew', day: "The Boss's actions, jobs in the street",
      evening: 'Wrap-up, plans, crew placed', night: 'One night job, or rest',
    };
    const tag = (p: R5Phase): string | null => (p === ph ? 'Now' : p === 'day' && ph === 'morning' ? `${acts} action${acts === 1 ? '' : 's'}` : null);
    const next: Record<R5Phase, string> = { morning: 'Start the day', day: 'End the day', evening: 'Go to night', night: nightLeft ? 'Sleep' : 'Next morning' };
    const line: Record<R5Phase, string> = {
      morning: `Bzzt! Day ${b.day}. Read the report, then give out the jobs.`,
      day: `Bzzt! ${acts} action${acts === 1 ? '' : 's'} left. The street is awake.`,
      evening: 'Bzzt! The day is done. Count the take, then plan the night.',
      night: 'Bzzt! One job in the dark, or a good night’s sleep.',
    };
    const max = run3(this.run(b));
    return {
      day: b.day, phase: ph, used: max[0], max: max[1],
      left: ph === 'day' ? `${acts} action${acts === 1 ? '' : 's'} left` : ph === 'morning' ? `${acts} actions today` : ph === 'night' ? `${nightLeft} job left` : 'Plan the night',
      rows: PHASES.map((p) => ({ phase: p, what: what[p], tag: tag(p) })), at: this.at, cta: next[ph],
      who: ROTOM, line: line[ph],
    };
  }

  private recapModel(b: DominionBlock): { from: number; cards: R5RecapCard[]; who: R5Speaker | null; line: string; cta: string } {
    const m = morningModel(b, 0, -1, false);
    const PIC: Record<string, [string, string]> = { crew: ['Crew', ''], money: ['Money', 'g-amulet-coin'], rival: ['Rival', 't-giovanni'], police: ['Police', 't-policeman'], hero: ['Hero', 't-red'], world: ['News', 'g-journal'] };
    const tc = teamColours(b);
    const cards = m.alerts.slice(0, 4).map((a) => {
      const [tag, k] = PIC[a.kind] ?? PIC.world!;
      const [head, rest] = splitLine(a.text);
      const who = b.members.find((x) => a.text.startsWith(x.name));
      const pic = a.kind === 'crew' && who ? memberPic(who.look, 110, 'height:110px;width:80px;object-fit:contain;object-position:bottom', tc) : SP(k || 'g-idcard', k.startsWith('t-') ? 110 : 64);
      const val = /([+−-]?₽[\d,]+)|Heat [+−-]?\d+%?/.exec(a.text)?.[0] ?? '';
      return { tag, pic, head, line: rest ?? a.time, val };
    });
    return { from: Math.max(1, b.day - 1), cards, who: ROTOM, line: `“Bzzt! Previously, on ${b.team?.name ?? b.teamName ?? 'your crew'}… Ready for Day ${b.day}?”`, cta: 'The Morning report' };
  }

  private calToday(): number {
    const b = this.block();
    return b ? (b.day - 1) % CAL : 0;
  }

  private calModel(b: DominionBlock): Parameters<typeof r5Calendar>[0] {
    const wk = DOMINION_DATA.start.clock.weekLength;
    const d0 = Math.floor((b.day - 1) / CAL) * CAL + 1;
    const ev = new Map<number, { cls: string; word: string; title: string; sub: string; body: string }>();
    for (let d = d0; d < d0 + CAL; d++) if (d % wk === 0) ev.set(d, { cls: 'e-pay', word: 'Payday', title: 'Payday', sub: 'End of the week', body: 'Wages and rent come out tonight, the Chair’s deals pay, and the Ledger closes the week.' });
    for (const [id, t] of Object.entries(b.rivals?.teams ?? {})) {
      if (t.raid && t.raid >= d0 && t.raid < d0 + CAL) ev.set(t.raid, { cls: 'e-raid', word: 'Raid?', title: 'A raid on the HQ', sub: `${teamName3(id)} · at night`, body: 'They warned you. Put guards on the HQ before that night.' });
    }
    for (const x of b.chair?.due ?? []) if (x.day >= d0 && x.day < d0 + CAL && !ev.has(x.day)) ev.set(x.day, { cls: 'e-gym', word: 'Chair', title: 'A Chair card comes back', sub: 'Morning', body: 'A decision you put off at the Chair is due today.' });
    const days: R5CalDay[] = Array.from({ length: CAL }, (_, i) => { const d = d0 + i, e = ev.get(d); return { d, past: d < b.day, now: d === b.day, ev: e ? { cls: e.cls, word: e.word } : null }; });
    const sel = d0 + this.at, e = ev.get(sel);
    const lead = b.members[0];
    const next = [...ev.keys()].filter((d) => d >= b.day).sort((x, y) => x - y)[0];
    return {
      region: cap(String(F().region ?? 'Kanto')), month: Math.floor((b.day - 1) / CAL) + 1, days, at: this.at,
      title: e?.title ?? (sel === b.day ? `Day ${sel}` : sel < b.day ? `Day ${sel} · past` : `Day ${sel}`),
      sub: e?.sub ?? (sel === b.day ? 'Today' : sel < b.day ? 'Done' : `In ${sel - b.day} day${sel - b.day === 1 ? '' : 's'}`),
      body: e?.body ?? 'Nothing on the books. A day for jobs.',
      who: lead ? { name: lead.name, pic: facePic(lead.look, b, 40), colour: this.colour(b) } : null,
      line: next !== undefined ? `“${ev.get(next)!.title} on Day ${next}, Boss.”` : '“Nothing on the books this month, Boss.”',
    };
  }

  // ---------- input ----------

  key(a: InputAction): boolean {
    if (!this.owns()) return false;
    const b = this.block(), c = this.host.dayCursor();
    if (!b) return false;
    if (this.host.dayNotice() && (a === 'confirm' || a === 'back')) { this.host.setNotice(null); return true; }
    if (this.page === 'evening' || this.page === 'recap') {
      if (a === 'confirm' || a === 'back') this.close();
      return true;
    }
    if (this.page === 'clock') {
      if (a === 'up' || a === 'down') { this.at = (this.at + (a === 'up' ? -1 : 1) + 4) % 4; this.host.refresh(); }
      else if (a === 'confirm') this.clockRow(this.at);
      else if (a === 'back') this.close();
      return true;
    }
    if (this.page === 'calendar') {
      const d: Partial<Record<InputAction, number>> = { left: -1, right: 1, up: -7, down: 7 };
      if (d[a] !== undefined) { this.at = Math.max(0, Math.min(CAL - 1, this.at + d[a]!)); this.host.refresh(); }
      else if (a === 'back' || a === 'confirm') this.close();
      return true;
    }
    if (!c) return false;
    if (this.page === 'deploy') {
      const n = b.members.length;
      const ids = F().districts.map((d) => d.id);
      if (a === 'up' || a === 'down') this.at = (this.at + (a === 'up' ? -1 : 1) + n) % n;
      else if (a === 'left' || a === 'right') this.host.setDayCursor({ ...c, district: ids[(ids.indexOf(c.district) + (a === 'left' ? -1 : 1) + ids.length) % ids.length]!, target: 0 });
      else if (a === 'confirm') this.place(c.district);
      else if (a === 'back') this.close();
      return true;
    }
    const n = F().districts.find((d) => d.id === c.district)?.targets.length ?? 1;
    if (a === 'left' || a === 'right') this.host.setDayCursor({ ...c, target: (c.target + (a === 'left' ? -1 : 1) + n) % n });
    else if (a === 'confirm') this.host.dayCard();
    else if (a === 'back') this.close();
    return true;
  }

  /** F on the map: Focus view. */
  raw(code: string): boolean {
    if (code === 'KeyF' && this.host.screenName === 'map' && !this.page) {
      this.focus = !this.focus;
      this.host.refresh();
      return true;
    }
    if (code === 'KeyC' && this.owns() && this.page === 'clock') { this.page = 'calendar'; this.at = this.calToday(); this.host.refresh(); return true; }
    // Number keys still pick an action under the street (the scene's own keys); letters stay with the page.
    return this.owns() && /^Key/.test(code);
  }

  acts(): Record<string, (arg: string) => void> {
    return {
      r5dep: (i) => { if (this.at === Number(i)) { const c = this.host.dayCursor(); if (c) this.place(c.district); } else { this.at = Number(i); this.host.refresh(); } },
      r5depTo: (id) => this.place(String(id)),
      clockRow: (i) => this.clockRow(Number(i)),
      clockNext: () => { this.page = null; this.host.dayNext(); },
      calDay: (i) => { this.at = Number(i); this.host.refresh(); },
      dayCal: () => { this.page = 'calendar'; this.at = this.calToday(); this.host.refresh(); },
      dayBack: () => this.close(),
    };
  }
}

/** Five weeks on the calendar page. */
const CAL = 35;
const cap = (w: string): string => w.charAt(0).toUpperCase() + w.slice(1);
const run3 = (r: R5Run): [number, number] => [r.orders[0], Math.max(1, r.orders[1])];
const teamName3 = (id: string): string => cap(id.replace(/-/g, ' '));
/** A report line as a card's title and line: the first sentence, then the rest. */
function splitLine(text: string): [string, string | null] {
  const m = /^(.+?)[.!?]\s+(.+)$/.exec(text);
  return m && m[1]!.length <= 44 ? [m[1]!, m[2]!] : [text.replace(/\.$/, ''), null];
}
