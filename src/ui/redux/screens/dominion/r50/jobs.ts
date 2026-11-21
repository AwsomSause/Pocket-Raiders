// DOMINION redesign R4 (pass 50 of plans/evil-mode-rework/redesign-50): the Jobs group. The Card (mockup `card`), the
// Boss order cut-in (`order`), Job done (`done`), Job botched (`botched`), the Hero shows up (`herohit`) and Pick the
// crew (`crewpick`). Each page copies the mockup's pass-50 markup and fills it with the run's own data; the scene keeps
// the cursors and does the acts. Every data-testid the old views had is kept.

import './r4.css';
import type { CardModel } from '../../../../../core/dominion/fieldScreens';
import type { CaughtChoice, JobModel, OrderModel } from '../../../../../core/dominion/moments';
import type { InterruptModel } from '../../../../../core/dominion/heroScreens';
import { bg, esc, faceOf, frame, go, keys, map, page, rep, SP, type R5Group, type R5Key, type R5Run, type R5Speaker } from './kit';

/** Read by screen readers (and tests), not drawn. */
const SR = 'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap';
const sr = (text: string, testid = ''): string => `<span${testid ? ` data-testid="${testid}"` : ''} style="${SR}">${esc(text)}</span>`;
const money = (n: number): string => `₽${n.toLocaleString('en-US')}`;
/** The Card model's pay line carries <b> tags for the old view; the redesign draws it as plain text. */
const plain = (h: string): string => h.replace(/<[^>]*>/g, '');

/** A person on a page: a full picture (`pic`), a face for the text box (`face`, already cropped for 62 px), the ring
 *  colour, a name and a role. The scene draws the pictures (it knows the art and the team colours). */
export interface R5Person { pic: string; /** The face cropped for a ring `sz` px wide. */ face: (sz: number) => string; name: string; role: string; colour: string }

// ---------- the scene pages (the mockups' k:scene: cut-ins, VS, choices) ----------

export interface R5Choice { label: string; act: string; arg?: string | number; on?: boolean; dim?: boolean; testid?: string; /** Read by screen readers: the rest of the choice. */ more?: string }

export interface R5Scene {
  id: string;
  g: R5Group;
  /** cut (a cut-in: the order, the ace), vs (two sides), gim (a power moment), talk (a choice). */
  mode: 'cut' | 'vs' | 'gim' | 'talk';
  bg: string;
  word?: { small: string; big: string; testid?: string; sr?: string };
  left: R5Person;
  right: R5Person;
  /** Extra pieces before the two sides (the speed lines and stamp, the power's glow). */
  pre?: string;
  chs?: readonly R5Choice[];
  /** The text box: who speaks (null: narration), the line, a reply on the right, one button. */
  box: { who: R5Person | null; line: string; rep?: string; cta?: readonly [label: string, act: string, testid?: string]; testid?: string; lineSr?: string; lineAct?: string };
  keys: readonly R5Key[];
  run: R5Run;
}

const actor = (side: 'l' | 'r', p: R5Person): string =>
  `<div class="act ${side}" style="--pc:${p.colour}">${p.pic}<span class="plate vs17"><b>${esc(p.name)}</b><em>${esc(p.role)}</em></span></div>`;

export function scene(s: R5Scene): string {
  const many = (s.chs?.length ?? 0) > 1;
  const word = s.word ? `<div class="sc-word" data-m="ttl"${s.word.testid ? ` data-testid="${s.word.testid}"` : ''}><small>${esc(s.word.small)}</small><b>${esc(s.word.big)}</b>${s.word.sr ? sr(s.word.sr) : ''}</div>` : '';
  const vs = s.mode === 'vs' ? '<div class="vsdisc" data-nocheck="">VS</div>' : '';
  const chs = s.chs?.length ? `<nav class="chs">${map(s.chs, (c, i) => `<button class="ch${c.on ? ' on' : ''}${c.dim ? ' dim4' : ''}" ${go(c.act, c.arg ?? '')}${c.testid ? ` data-testid="${c.testid}"` : ''} style="--i:${i};--d:${i * 90}ms"><kbd>${i + 1}</kbd><b>${esc(c.label)}</b>${c.more ? sr(` · ${c.more}`) : ''}</button>`)}</nav>` : '';
  const w = s.box.who;
  const spk = w ? `<span class="spk6" style="--pc:${w.colour}">${faceOf(w.face(62), 62, w.colour)}<b>${esc(w.name)}</b></span>` : '';
  const cta = s.box.cta ? `<button class="cta on" ${go(s.box.cta[1])}${s.box.cta[2] ? ` data-testid="${s.box.cta[2]}"` : ''}>${esc(s.box.cta[0])}</button>` : '';
  const box = `<section class="tbox" data-m="box">${spk}<p${s.box.testid ? ` data-testid="${s.box.testid}"` : ''}${s.box.lineAct ? ` ${go(s.box.lineAct)}` : ''}>${s.box.lineSr ? sr(s.box.lineSr) : ''}${esc(s.box.line)}</p>${s.box.rep ? `<p class="rep">${esc(s.box.rep)}</p>` : ''}${cta}<i class="more">▼</i></section>`;
  const body = bg(s.bg, s.g, s.run) + `\n  ${word}\n  ${vs}${s.pre ?? ''}${actor('l', s.left)}\n  ${actor('r', s.right)}\n  ${chs}\n  ${box}\n  ` + keys(s.keys, s.g, s.run);
  return page({ id: s.id, g: s.g, kind: 'scene', body }).replace('class="scr nv k-scene"', `class="scr nv pg-${esc(s.id)} k-scene sm-${s.mode}${many ? ' many' : ''}" data-sp26=""`);
}

// ---------- The Card (mockup `card`) ----------

export interface R5CardExtras {
  /** Who is there: the member going (or the Boss) and the target (the foe's Pokémon, the owner). */
  who: readonly string[];
  /** The member who speaks in the text box (the one brought, else the first). */
  speaker: R5Speaker | null;
  line: string;
  showOdds: boolean;
}

/** The Card: the chance ring, how the odds are made, who is there and what it pays; Change crew and Do it. */
export function r5Card(c: CardModel, x: R5CardExtras, run: R5Run, lesson = ''): string {
  const hide = !x.showOdds && c.roll;
  const pct = hide ? 0 : c.roll ? c.bar : c.chance;
  const pure = /^\d+%$/.test(c.dial) && !hide;
  const dial = hide ? '?' : c.dial;
  const cnt = pure ? `<b class="cnt" style="--to:${pct}"></b>${sr(dial, 'dom-card-chance')}` : `<b class="cnt txt4" data-testid="dom-card-chance">${esc(dial)}</b>`;
  const strip = c.opts.length || c.note
    ? `<div class="cs4" data-testid="dom-card-strip">${c.opts.length ? `<span class="op4">${map(c.opts, (o) => `<i class="${o.id === c.opt ? 'on' : ''}" ${go('opt', o.id)} data-testid="dom-opt-${esc(o.id)}">${esc(o.label)}</i>`)}</span>` : ''}${c.note ? `<em data-testid="dom-card-note">${esc(c.note)}</em>` : ''}</div>`
    : '';
  const odds = `<section class="pn c-odds" data-m="det"><div class="ring" style="--p:${pct}">${cnt}<em>chance</em></div><b class="det-t">${esc(c.title)}</b><p>${esc(c.sub)}</p>${c.roll && !hide ? `<p class="sc4">${c.exact ? 'Scouted · exact odds' : 'Unscouted · a guess'}</p>` : ''}</section>`;
  const parts = hide
    ? `<div class="part"><span data-testid="dom-card-odds-hidden">Odds hidden in Settings. The roll is the same.</span></div>`
    : c.roll
      ? map(c.parts, ([k, n], i) => `<div class="part" style="--i:${i};--d:${i * 70}ms"><span>${esc(k)}</span><b class="${n < 0 ? 'neg' : ''}">${n >= 0 ? '+' : '−'}${Math.abs(n)}</b></div>`)
      : '<div class="part"><span>A sure thing: it just takes the time.</span></div>';
  const tot = `<div class="part tot"><span>${c.roll ? 'Total' : 'No roll'}</span><b data-testid="dom-card-total">${esc(dial)}</b></div><p class="wl4"><b>Win</b> ${esc(c.win)}</p><p class="wl4 l"><b>Lose</b> ${esc(c.lose)}</p>`;
  const panel = `<section class="pn c-parts${c.parts.length > 5 || strip ? ' tight4' : ''}" data-m="panel"><h3><i>${hide ? 'Odds hidden' : c.roll ? 'How the odds are made' : 'No roll'}</i></h3>${strip}${parts}${tot}</section>`;
  const heat = c.heat > 0 || c.failHeat > 0 ? `+${c.heat}${c.failHeat ? ` · +${c.failHeat} if it fails` : ''}` : c.heat < 0 ? `−${-c.heat}` : '0';
  const facts: [string, string, string?][] = [['Pay', plain(c.pays).replace(/^Pays\s+/i, ''), 'dom-card-pays'], ['Heat', heat]];
  if (c.battle) facts.push([c.battle.always ? 'Battle: always' : `Battle? ${c.battle.chance}%`, c.battle.line]);
  if (c.hurt) facts.push([c.hurt.name, c.hurt.line]);
  facts.push(['Seen by', c.see.line]);
  const who = `<section class="pn c-who" data-testid="dom-card"><h3><i>Who is there</i></h3>${map(x.who, (w) => `<div class="who">${w}</div>`)}<dl class="facts">${map(facts, ([k, v, t]) => `<dt>${esc(k)}</dt><dd${t ? ` data-testid="${t}"` : ''}>${esc(v)}</dd>`)}</dl></section>`;
  const line = c.blocked ?? x.line;
  const ks: R5Key[] = [...(c.opts.length ? [['←→', 'choice'] as const] : []), ['B', 'crew', 'crewpick'], ['Enter', 'do it', 'doit'], ['Esc', 'back', 'back', 'dom-card-back']];
  return frame({
    id: 'card', g: 'Jobs', kind: 'card', bg: 'street', run,
    top: { title: 'The Card', sub: c.slotLine, subTestid: 'dom-card-slot', sub2: [c.travel, c.level].filter(Boolean).join(' · ') },
    body: `${odds}\n  ${panel}\n  ${who}`,
    who: c.blocked ? null : x.speaker, line: c.blocked ? line : `“${line}”`,
    ctas: [['Change crew', 'crewpick', '', 'dom-bring'], ['Do it', 'doit', '', 'dom-doit']],
    footOpts: c.blocked ? { sr: ['dom-card-blocked', c.blocked] } : {},
    keys: ks, over: lesson,
  }).replace('<button class="cta rc13 on" data-act="doit"', `<button class="cta rc13 on${c.blocked ? ' off4' : ''}" data-act="doit"`);
}

// ---------- Pick the crew (mockup `crewpick`) ----------

export interface R5CrewCell { id: string; name: string; pic: string; colour: string; stars: number; line: string; picked: boolean; tag: string | null }

export function r5CrewPick(o: { job: string; most: number; stat: string; cells: readonly R5CrewCell[]; at: number; note: string | null }, run: R5Run): string {
  const n = o.cells.length <= 6 ? 6 : o.cells.length <= 8 ? 8 : 12;
  const cells = map(o.cells, (c, i) => `<button class="cell${i === o.at ? ' on' : ''}${c.picked ? ' pk4' : ''}" ${go('crewPick', i)} data-over="crewOver" data-testid="dom-crewpick-${i}" style="--pc:${c.colour};--i:${i};--d:${i * 50}ms"><i class="rr14">${'★'.repeat(Math.max(1, Math.min(3, c.stars)))}</i><span class="cs">${c.pic}</span><b>${esc(c.name)}</b><em>${esc(c.line)}</em>${c.picked ? '<i class="tag">✓</i>' : c.tag ? `<i class="tag">${esc(c.tag)}</i>` : ''}</button>`);
  const head = `${o.job} · pick up to ${o.most}${o.stat ? ` · ${o.stat} job` : ''}`;
  const body = `<section class="pn g-main" data-m="panel" data-testid="dom-crewpick"><h3><i>${esc(head)}</i></h3><div class="cells n${n}"${n <= 6 ? ' style="grid-template-rows:repeat(2,minmax(0,1fr))"' : ''}>${cells}</div>${o.note ? `<p class="nt4" data-testid="dom-crewpick-note">${esc(o.note)}</p>` : ''}</section>`;
  return frame({
    id: 'crewpick', g: 'Jobs', kind: 'grid g-cards', bg: 'hq', run,
    top: { title: 'Pick the crew', sub: o.job, crumb: ['Card', 'card'] },
    body,
    keys: [['Enter', 'Choose'], ['Esc', 'Back', 'crewBack', 'dom-crewpick-back']],
  });
}

// ---------- Pick the crew: the cursor (pure; the scene keeps one) ----------

/** The cursor of the Pick the crew page (over the Card). The picks live in the Card's cursor (`bring`). */
export class CrewPick {
  on = false;
  at = 0;
  note: string | null = null;
  open(): void { this.on = true; this.at = 0; this.note = null; }
  close(): void { this.on = false; this.note = null; }

  /** Picks or drops member `id`: one at a time for a solo job (picking another swaps), up to `most` for a squad. */
  static toggle(bring: readonly string[], id: string, most: number): { bring: string[]; full: boolean } {
    if (bring.includes(id)) return { bring: bring.filter((x) => x !== id), full: false };
    if (most <= 1) return { bring: [id], full: false };
    if (bring.length >= most) return { bring: [...bring], full: true };
    return { bring: [...bring, id], full: false };
  }

  /** Arrows on the grid (three across). */
  move(a: 'up' | 'down' | 'left' | 'right', n: number): void {
    if (n <= 0) return;
    const d = a === 'left' ? -1 : a === 'right' ? 1 : a === 'up' ? -3 : 3;
    const next = this.at + d;
    if (next >= 0 && next < n) this.at = next;
  }
}

// ---------- The Boss order cut-in (mockup `order`) ----------

export function r5Order(m: OrderModel, boss: R5Person, crew: R5Person | null, run: R5Run): string {
  // Alone, the Boss stands where the member would (the mockup's right side) and gives the order to nobody.
  const right = crew ?? { ...boss, role: 'Goes alone' };
  return scene({
    id: 'order', g: 'Jobs', mode: 'cut', bg: 'crimson', run,
    word: { small: `${boss.name} · The Boss`, big: 'THE ORDER', testid: 'dom-order', sr: `ORDER: ${m.verb} · ${m.sub}` },
    pre: '<div class="speed7" data-nocheck=""></div><div class="stamp7" data-nocheck="">ORDER</div>',
    left: { ...boss, role: 'The Boss' }, right,
    box: { who: boss, line: m.boss, lineSr: 'THE BOSS: ', testid: 'dom-order-boss', rep: m.crew ? `${m.crew.name}: “${m.crew.line}”` : undefined, cta: ['Go', 'jobSkip', 'dom-order-go'] },
    keys: [['Enter', 'next', 'jobSkip']],
  }).replace('<p class="rep">', '<p class="rep" data-testid="dom-order-crew">');
}

// ---------- Job done and Job botched (mockups `done`, `botched`) ----------

const RAIL = ['The take', 'Heat', 'Crew', 'Loot', 'Next'];
const rail = (): string => `<ol class="rail7" data-m="rail">${map(RAIL, (r, i) => `<li class="${i === 0 ? 'on' : ''}"><i>${i + 1}</i>${r}</li>`)}</ol>`;
const COINS = `<div class="coins" data-nocheck="">${rep(14, (i) => `<i style="--a:${i * 26}deg;--r:${120 + (i % 4) * 40}px;--d:${(i % 5) * 60}ms"></i>`)}</div>`;
const chgRow = (c: { label: string; from: string; d: string; cls: string }, i: number): string => {
  const up = c.cls !== 'dn';
  return `<div class="chg ${up ? 'up' : 'dn'}" style="--i:${i};--d:${i * 110}ms"><i>${up ? '▲' : '▼'}</i><b>${esc(c.label)}</b><em>${esc([c.d, c.from].filter(Boolean).join(' · '))}</em></div>`;
};

export interface R5JobExtras { member: R5Person | null; day: number; place: string; at: number; note: string | null; /** A calling card can be left (C). */ calling?: boolean; held: readonly CaughtChoice[] | null; texts: { police: string; policeSub: string; map: string; mapSub: string; next: string; nextSub: string } }

export function r5Done(m: JobModel, x: R5JobExtras, run: R5Run): string {
  const big = m.take > 0 ? `<b class="r-big" data-m="funds" data-testid="dom-job-take">+${money(m.take)}</b>` : `<b class="r-big" data-m="funds">DONE</b>`;
  const left = `<div class="r-l r7" data-testid="dom-job-done"><small>The take</small>${big}<p>${esc(m.title)} · <span data-testid="dom-job-roll">${esc(m.rolled)}</span></p>${m.take > 0 ? COINS : ''}<div class="stamp" data-m="ttl" data-testid="dom-job-stamp">${esc(m.stamp)}</div></div>`;
  const rows = m.changes.slice(0, m.weekly ? 4 : 5).map(chgRow).join('') + (m.weekly ? `<div class="chg up" data-testid="dom-job-weekly" style="--i:5;--d:550ms"><i>▲</i><b>Every week</b><em>${esc(m.weekly)}</em></div>` : '');
  const panel = `<section class="pn r-lines" data-m="panel"><h3><i>What changed</i></h3>${rows}</section>`;
  const clip = m.lines ? `<div class="clip18" data-testid="dom-job-lines"><small>The Kanto Ledger · Day ${x.day}</small><b>${esc(m.title.toUpperCase())}</b><em>${esc(m.lines)}</em></div>` : '';
  const who: R5Speaker | null = m.quote && x.member ? { name: x.member.name, colour: x.member.colour, pic: x.member.face(40) } : null;
  return frame({
    id: 'done', g: 'Jobs', kind: 'res', bg: 'gold', run: { ...run, place: x.place },
    top: { title: 'Job done', sub: '' },
    body: `${rail()}${left}\n  ${panel}`,
    who: x.note ? null : who, line: x.note ?? (m.quote ? `“${m.quote}”` : `“Another good day for ${run.side && run.side !== 'Your crew' ? run.side : 'the crew'}.”`),
    footOpts: x.note ? { testid: 'dom-job-note' } : {},
    ctas: [['Next action', 'jobNext', '', 'dom-job-next'], ['To the Map', 'jobMap', '', 'dom-job-map']],
    keys: [...(x.calling ? [['C', 'calling card', 'callingOpen', 'dom-job-calling'] as const] : []), ['N', 'next action', 'jobNext'], ['Enter', 'to the Map', 'jobMap']], noTabs: true, over: clip,
  });
}

export function r5Botched(m: JobModel, x: R5JobExtras, run: R5Run): string {
  const t = x.texts;
  const choices: { b: string; s: string; a: string; arg?: number; off?: boolean }[] = x.held
    ? x.held.map((c, i) => ({ b: c.label, s: c.sub, a: 'jobCaught', arg: i, off: !c.on }))
    : m.caught
      ? [{ b: t.police, s: t.policeSub, a: 'jobMap' }]
      : [{ b: t.map, s: t.mapSub, a: 'jobMap' }, { b: t.next, s: t.nextSub, a: 'jobNext' }];
  const at = Math.min(x.at, choices.length - 1);
  const left = `<div class="r-l r7" data-testid="dom-job-botched"><small>What it cost</small><b class="r-big" data-m="funds">${m.caught ? 'CAUGHT' : 'NO TAKE'}</b><p>${esc(m.head)}</p><div class="stamp" data-m="ttl" data-testid="dom-job-stamp">${esc(m.stamp)}</div></div>`;
  const rows = [
    ...(m.caught ? [{ label: m.caught, from: '', d: 'taken in for questioning', cls: 'dn' }] : []),
    ...m.changes.filter((c) => c.cls === 'dn' || c.label.startsWith('Heat')),
    { label: 'Take', from: m.rolled, d: 'none', cls: 'dn' },
  ].slice(0, 5);
  const panel = `<section class="pn r-lines" data-m="panel"><h3><i>What changed</i></h3>${rows.map(chgRow).join('')}${m.lines ? `<p class="ln4" data-testid="dom-job-lines">${esc(m.lines)}</p>` : ''}</section>`;
  const pick = choices[at]!;
  const line = x.note ?? (x.held ? pick.s : m.quote ? `“${m.quote}”` : pick.s);
  const who: R5Speaker | null = !x.note && !x.held && m.quote && x.member ? { name: x.member.name, colour: x.member.colour, pic: x.member.face(40) } : null;
  // The choices are the text box's buttons (the last one drawn is the mockup's lit one): the cursor lights its own.
  const btns = `<div class="ch23">${map(choices, (c, i) => `<button class="cta rc13${i === at ? ' on' : ''}${c.off ? ' off4' : ''}" ${go(c.a, c.arg ?? '')} data-testid="dom-job-choice-${i}">${esc(c.b)}${sr(` · ${c.s}`)}</button>`)}</div>`;
  const html = frame({
    id: 'botched', g: 'Jobs', kind: 'res bad', bg: 'police', run: { ...run, place: x.place },
    top: { title: 'Job botched', sub: '' },
    body: `${rail()}${left}\n  ${panel}`,
    who, line, ctas: [], footOpts: x.note ? { testid: 'dom-job-note' } : {},
    keys: [...(choices.length > 1 ? [[x.held ? '1-3' : '←→', 'choose'] as const] : []), ['Enter', choices.length > 1 ? 'confirm' : 'next']], noTabs: true,
  });
  return html.replace(/(<section class="foot[^"]*" data-m="box">[\s\S]*?<\/p>)/, `$1${btns}`);
}

// ---------- The Hero shows up (mockup `herohit`) ----------

export function r5HeroHit(m: InterruptModel, member: R5Person, hero: R5Person, at: number, notice: string | null, run: R5Run): string {
  const chs: R5Choice[] = [
    { label: `Battle ${hero.name} · win to finish the job`, act: 'interrupt', arg: 0, testid: 'dom-interrupt-0', more: `${m.member} vs ${m.hero}` },
    { label: `Run · lose the job, Heat +${m.runHeat}`, act: 'interrupt', arg: 1, testid: 'dom-interrupt-1', more: 'Safe' },
    { label: m.smoke ? `Smoke Ball · ${m.smokeChance}% clean escape` : 'Smoke Ball · You have no Smoke Ball', act: 'interrupt', arg: 2, testid: 'dom-interrupt-2', dim: !m.smoke, more: m.smoke ? `${m.smoke} left · keep the take` : '' },
  ].map((c, i) => ({ ...c, on: i === at }));
  return scene({
    id: 'herohit', g: 'Jobs', mode: 'vs', bg: 'split', run,
    word: { small: `${m.job} · interrupted`, big: 'A HERO APPEARS', testid: 'dom-interrupt', sr: ` · ${m.hero.toUpperCase()}` },
    left: member, right: { ...hero, role: `Threat ${m.threat}` }, chs,
    box: notice ? { who: null, line: notice, testid: 'dom-notice', lineAct: 'dismiss' } : { who: null, line: `${m.hero.toUpperCase()} APPEARS!` },
    keys: [['1-3', 'answer'], ['Enter', 'your call']],
  });
}

// ---------- Lesson · the Card (mockup `lessonjob`) ----------

/** Rotom's coach over the Card: the page dims around the chance ring, a dashed ring marks it, and the lesson's tip
 *  waits for Enter (the tutorial's own act). Drawn inside the page root (the scene places it), so it wears r50.css. */
export function r5CardLesson(o: { lesson: string; n: number; of: number; step: number; steps: number; items: readonly (readonly [string, string])[] }): string {
  const dots = rep(Math.max(1, o.steps), (i) => `<i class="${i < o.step ? 'done' : i === o.step ? 'on' : ''}">${i + 1}</i>`);
  const text = o.items.map(([k, v]) => `<b>${esc(k)}</b> ${esc(v)}`).join(' · ');
  return `<div data-r5in="" data-testid="dom-tut-tip"><div class="sheet21" style="--x:134px;--y:230px;--w:236px;--h:300px" data-nocheck=""></div><i class="ring21" style="left:16px;top:80px;width:236px;height:300px" data-nocheck=""></i>
  <div class="coach21" style="left:300px;top:240px"><span class="rt">${SP('p-rotom', 60)}</span><div class="cb"><small>Lesson ${o.n} of ${o.of} · ${esc(o.lesson)}</small><p>“Bzzt! ${text}. Over 50% and it usually works. Press Enter when you like the odds.”</p><div class="st21">${dots}<span class="sp"></span><button class="cta" ${go('tutSkip')}>Skip lesson</button><button class="cta on" ${go('tutNext')}>Next</button></div></div></div></div>`;
}
