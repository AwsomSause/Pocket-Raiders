// DOMINION slice D30: the job moments and the morning paper, ported from the round-4 mockups m8 (Boss order cut-in),
// m9 (Job done), m10 (Job botched) and m12 (The morning paper): plans/evil-mode-rework/mockups-v4/src/i4.py, i5.py.
// Plain data in from core/dominion/moments.ts; the scene's JobController keeps the state and the keys. The CSS for
// these classes is in dominion.css (ported from the mockups); moments.css only makes the looping mockup animations play
// once in the game and stills the slam when cut-ins are skipped.

import './dominion.css';
import './moments.css';
import type { CaughtChoice, JobModel, OrderModel, PaperModel } from '../../../../core/dominion/moments';
import type { TeamColours } from '../../../../core/dominion/founding';
import type { TopModel } from '../../../../core/dominion/screens';
import { act, esc } from '../../kit';
import { rxUrl } from '../../assets';
import { skylineDayUrl } from './paint';
import { memberPic } from './teamPic';
import { stage, topBar } from './views';

const img = (f: string): string => rxUrl(`dominion/${f}.png`);
const fx = (k: string, a: string): string =>
  `<div class="haze" aria-hidden="true" style="--hz:${k};--hz2:${a}"></div><div class="grade" aria-hidden="true" style="--g1:${k};--g2:${a}"></div><div class="edgeglow" aria-hidden="true" style="--eg:${k}"></div><div class="orn" aria-hidden="true"></div>`;
const chg = (ic: string, label: string, from: string, d: string, cls: string): string =>
  `<div class="chg"><img class="ic s" src="${img(ic)}" alt="">${esc(label)}<span class="from">${esc(from)}</span><span class="d ${cls}">${esc(d)}</span></div>`;

/** m8: the Boss gives the order on a crimson band, the member answers on a gold one, the order stamped across. */
export function orderView(m: OrderModel, team: TeamColours | null, still: boolean): string {
  const crew = m.crew && m.crew.look
    ? memberPic(m.crew.look, 182, 'position:absolute;left:660px;top:-14px;width:107px;height:182px', team, 'por')
    : '';
  return stage(`
  <img class="cv" src="${skylineDayUrl()}" alt="" style="position:absolute;inset:0;width:960px;height:540px;filter:grayscale(.6) brightness(.35) contrast(1.2)">
  <div class="half4"></div>
  <div class="band boss" data-once="d30-boss" style="left:-40px;top:40px;width:1040px;height:190px"><div class="speed"></div>
    <img class="por" src="${img('v-nate')}" alt="The Boss" style="left:40px;top:-20px;width:512px;height:256px"></div>
  <div class="say" style="left:560px;top:96px;width:340px" data-testid="dom-order-boss"><b>THE BOSS</b>${esc(m.boss)}</div>
  <div class="order" data-once="d30-order" style="left:120px;top:236px" data-testid="dom-order">ORDER: ${esc(m.verb)}<small>${esc(m.sub)}</small></div>
  <div class="band crew" data-once="d30-crew" style="left:-40px;top:350px;width:1040px;height:150px"><div class="speed"></div>${crew}</div>
  ${m.crew ? `<div class="say" style="left:250px;top:402px;width:360px;box-shadow:0 0 0 3px #12071a,6px 6px 0 #ffd23f" data-testid="dom-order-crew"><b>${esc(m.crew.name.toUpperCase())}</b>${esc(m.crew.line)}</div>` : ''}
  <div class="keys" style="top:auto;bottom:10px"${act('jobSkip')}><span class="key">Enter</span><span>Skip</span></div>
  ${fx('#ff4d63', '#ffd23f')}`, 'background:#12071a', `kl-red vign grain d30${still ? ' still' : ''}`);
}

const COINS = `<img class="coin4" src="${img('g-amulet-coin')}" alt="" style="left:330px;top:410px"><img class="coin4" src="${img('g-nugget')}" alt="" style="left:300px;top:450px;transform:rotate(20deg)"><img class="coin4" src="${img('g-amulet-coin')}" alt="" style="left:58px;top:430px;transform:scale(.8)"><img class="coin4" src="${img('g-big-nugget')}" alt="" style="left:356px;top:458px">`;

/** m9: the stamp, the take counting up in gold, every change with where it came from, the weekly ribbon. */
export function jobDoneView(m: JobModel, top: TopModel, team: TeamColours | null, still: boolean): string {
  const who = m.member ? memberPic(m.member.look, 186, 'position:absolute;left:96px;top:190px;width:110px;height:186px;z-index:6', team, 'spr') : '';
  const rows = m.changes.map((c) => chg(c.ic, c.label, c.from, c.d, c.cls)).join('');
  return stage(`${topBar(top)}
  <div class="rays4"></div>
  ${who}
  <img class="spr" src="${img('t-clerk')}" alt="" style="left:230px;top:262px;width:72px;height:112px;z-index:6;filter:brightness(.75);transform:scaleX(-1) rotate(-6deg)">
  <div class="shd" style="left:80px;top:368px;width:240px;height:26px"></div>
  <div class="bigstamp" data-once="d30-stamp" style="left:34px;top:104px;color:#ffd23f;font-size:36px" data-testid="dom-job-stamp">${esc(m.stamp)}</div>
  ${m.take > 0 ? `<div class="loot" style="left:96px;top:398px" data-testid="dom-job-take">+₽${m.take.toLocaleString('en-US')}</div>${COINS}` : ''}
  <div class="pnl gild" style="left:428px;top:92px;width:516px;height:${m.weekly ? 300 : 344}px" data-testid="dom-job-done">
    <div class="hd y"><img class="ic" src="${img('g-relic-gold')}" alt="">${esc(m.title)}<span class="r" style="color:#43cf78" data-testid="dom-job-roll">${esc(m.rolled)}</span></div>
    <div class="col" style="gap:7px;margin-top:10px">${rows}</div>
    ${m.lines ? `<div class="xs mu" style="margin-top:8px;line-height:1.35;max-height:${m.changes.length > 4 ? 40 : 90}px;overflow:hidden" data-testid="dom-job-lines">${esc(m.lines)}</div>` : ''}
  </div>
  ${m.weekly ? `<div class="bnr" style="left:428px;top:404px;width:516px;font-size:17px;padding:6px 20px;text-align:center" data-testid="dom-job-weekly">${esc(m.weekly)}</div>` : ''}
  <div class="cta shine" style="left:428px;top:448px;width:250px;height:52px;font-size:18px;white-space:nowrap"${act('jobMap')} data-testid="dom-job-map">To the Map <span class="kc">Enter</span></div>
  <div class="cta" style="left:694px;top:448px;width:250px;height:52px;font-size:18px;white-space:nowrap;filter:saturate(.6) brightness(.85)"${act('jobNext')} data-testid="dom-job-next">Next action <span class="kc">N</span></div>
  ${fx('#ffd23f', '#ff4d63')}`, 'background:#1a0e05', `kl-gold vign grain d30${still ? ' still' : ''}`);
}

export interface BotchedText { tape: string; cost: string; police: string; policeSub: string; map: string; mapSub: string; next: string; nextSub: string }

/** m10: police lights and tape, BOTCHED, what it cost, and what happens next (D24's questioning when someone was caught). */
export function jobBotchedView(m: JobModel, t: BotchedText, at: number, team: TeamColours | null, still: boolean, held: CaughtChoice[] | null = null, note: string | null = null): string {
  const who = m.member ? memberPic(m.member.look, 142, 'position:absolute;left:96px;top:196px;width:84px;height:142px;z-index:7;filter:brightness(.9) saturate(.8);transform:rotate(8deg)', team, 'spr') : '';
  const choices: { b: string; s: string; k: string; a: string; arg?: number; off?: boolean }[] = held
    ? held.map((c, i) => ({ b: c.label, s: c.sub, k: `${i + 1}`, a: 'jobCaught', arg: i, off: !c.on }))
    : m.caught
      ? [{ b: t.police, s: t.policeSub, k: 'Enter', a: 'jobMap' }]
      : [{ b: t.map, s: t.mapSub, k: 'Enter', a: 'jobMap' }, { b: t.next, s: t.nextSub, k: 'N', a: 'jobNext' }];
  const tape = `<span>${esc(t.tape)}</span>`.repeat(3);
  return stage(`
  <img class="cv" src="${skylineDayUrl()}" alt="" style="position:absolute;inset:0;width:960px;height:540px;filter:brightness(.45) saturate(.6)">
  <div class="sirenL"></div><div class="sirenR"></div>
  <div class="tape4" style="left:-20px;right:-20px;top:16px;transform:rotate(-2deg)">${tape}</div>
  <img class="spr" src="${img('t-policeman')}" alt="Police officer" style="left:150px;top:180px;width:112px;height:154px;z-index:6;transform:scaleX(-1)">
  ${who}
  <div class="shd" style="left:70px;top:330px;width:220px;height:24px"></div>
  <div class="bigstamp" data-once="d30-stamp" style="left:56px;top:84px;color:#ff4d63" data-testid="dom-job-stamp">${esc(m.stamp)}</div>
  <div class="pnl" style="left:28px;top:372px;width:330px;height:140px">
    <div class="hd"><img class="ic" src="${img('g-fire-stone')}" alt="">${esc(t.cost)}</div>
    <div class="col" style="gap:5px;margin-top:6px">${m.changes.filter((c) => c.label.startsWith('Heat')).slice(0, 1).map((c) => chg(c.ic, c.label, c.from, c.d, c.cls)).join('')}${chg('g-amulet-coin', 'Take', m.rolled, '₽0', 'dn')}</div>
  </div>
  <div class="pnl gild" style="left:380px;top:70px;width:564px;height:442px" data-testid="dom-job-botched">
    <div class="hd y"><img class="ic" src="${img('g-policekey')}" alt="">${esc(m.head)}</div>
    <div class="col" style="gap:10px;margin-top:12px">
      ${choices.map((c, i) => `<div class="ch${i === at ? ' on' : ''}${c.off ? ' dim' : ''}"${act(c.a, c.arg)} data-testid="dom-job-choice-${i}"><b>${esc(c.b)}</b><span class="xs${i === at ? '' : ' mu'}" style="display:block;font-weight:500">${esc(c.s)}</span><span class="kc" style="position:absolute;right:12px;top:12px">${c.k}</span></div>`).join('')}
    </div>
    ${note ? `<div class="xs" style="margin-top:10px;color:#ff9aa8" data-testid="dom-job-note">${esc(note)}</div>` : ''}
    ${m.lines ? `<div class="xs mu" style="margin-top:12px;line-height:1.35;max-height:${held ? 54 : 110}px;overflow:hidden" data-testid="dom-job-lines">${esc(m.lines)}</div>` : ''}
    ${m.quote && m.member ? `<div class="quote" style="position:static;margin-top:14px">“${esc(m.quote)}” <b>— ${esc(m.member.name)}${m.caught ? ', from the back of the car' : ''}</b></div>` : ''}
  </div>
  ${fx('#8fb8ff', '#ff4d63')}`, 'background:#0a0e1c', `kl-police vign grain d30${still ? ' still' : ''}`);
}

const STARS = (n: number): string => `${'★'.repeat(n)}<i>${'★'.repeat(5 - n)}</i>`;

/** m12: the region's Ledger folded on the Boss's desk, the WANTED poster, and what the news changed. */
export function paperView(m: PaperModel, team: TeamColours | null): string {
  const photo = m.photo
    ? memberPic(m.photo.look, 102, 'position:absolute;left:120px;top:40px;width:60px;height:102px;filter:brightness(.3)', team, 'px')
    : '';
  const rows = m.rows.map((r) => `<div class="chg">${esc(r.label)}<span class="d ${r.stars !== undefined ? 'stars4' : r.cls}">${r.stars !== undefined ? STARS(r.stars) : esc(r.d)}</span></div>`).join('');
  return stage(`
  <div class="desk"></div>
  <img class="spr" src="${img('g-tea')}" alt="" style="left:858px;top:30px;width:64px;height:64px;z-index:3;filter:drop-shadow(0 6px 4px rgba(0,0,0,.5))">
  <div class="paper" style="left:34px;top:26px;width:560px;height:490px;padding:16px 20px" data-testid="dom-paper">
    <div class="mast4">${esc(m.masthead)}</div>
    <div class="dateline"><span data-testid="dom-paper-date">${esc(m.dateline[0])}</span><span>${esc(m.dateline[1])}</span><span>${esc(m.dateline[2])}</span></div>
    <div class="head4" data-testid="dom-paper-head">${esc(m.head)}</div>
    <div class="deck">${esc(m.deck)}</div>
    <div class="row" style="gap:14px;margin-top:10px;align-items:flex-start">
      <div style="width:220px;flex:none">
        <div class="photo4" style="height:150px"><img class="cv" src="${skylineDayUrl()}" alt="" style="position:absolute;width:440px;height:248px;left:-110px;top:-60px">${photo}</div>
        <div class="cap4">${esc(m.caption)}</div>
      </div>
      <div class="col4" style="height:200px;overflow:hidden" data-testid="dom-paper-column">${esc(m.column)}${m.rotom ? ` <b data-testid="dom-paper-rotom">✦ ${esc(m.rotom)}</b>` : ''}</div>
    </div>
    <div class="row" style="gap:12px;margin-top:10px;border-top:2px solid #231a10;padding-top:6px">
      ${m.side.map((s, i) => `<div style="flex:1;overflow:hidden;max-height:68px" data-testid="dom-paper-side-${i}"><b style="font:700 15px var(--regal)">${esc(s.head)}</b><div class="deck" style="font-size:11.5px">${esc(s.body)}</div></div>`).join('')}
    </div>
  </div>
  <div class="wanted" style="left:488px;top:150px;width:168px" data-testid="dom-paper-wanted">
    <b class="w">${esc(m.wanted.title)}</b>
    <div class="mug"><img src="${img('t-nate')}" alt="The Boss" style="width:74px;height:144px;margin-bottom:-36px"></div>
    <div style="font:600 11px var(--ui);margin-top:4px;letter-spacing:.06em">${esc(m.wanted.who)}</div>
    <div class="bty" data-testid="dom-paper-bounty">${esc(m.wanted.bounty)}</div>
    <div style="font:600 10px var(--ui)">${esc(m.wanted.by)}</div>
  </div>
  <div class="pnl gild" style="left:690px;top:120px;width:254px;height:300px" data-testid="dom-paper-news">
    <div class="hd y"><img class="ic" src="${img('g-journal')}" alt="">${esc(m.news)}</div>
    <div class="col" style="gap:7px;margin-top:8px">${rows}${m.rows.length < 2 ? `<div class="xs mu" style="margin-top:4px">${esc(m.noRows)}</div>` : ''}</div>
  </div>
  <div class="cta shine" style="left:690px;top:436px;width:254px;height:56px;font-size:19px;white-space:nowrap"${act('paperFold')} data-testid="dom-paper-fold">${esc(m.fold)} <span class="kc">Enter</span></div>
  ${fx('#ffcf8a', '#ff4d63')}`, 'background:#120a05', 'kl-warm vign grain d30');
}
