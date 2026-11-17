// Evil Mode's screens in the New look (design Part 29 sections 2 and 3): Founding (pages 1 to 5 and the summary, the
// Grunt on the right third) and the frame of a day (top strip, corner chip, beat strip with its one button).
// EvilScene keeps the state and the input; these only draw the plain data from core/evilMode/screens.ts.

import type { FoundingModel, FrameModel } from '../../../core/evilMode/screens';
import { act, B, esc, H, mini, W } from '../kit';
import type { ReduxCtx } from '../stage';

const sm = (t: string, st = ''): string => `<div class="sm" style="line-height:17px;${st}">${esc(t)}</div>`;
const pick = (i: number): string => `${act('pick', i)} data-over="over"`;

/** Townsfolk in an armband: the team's Grunts are never drawn in another team's uniform (Kice's answer 4). */
const GRUNT_FILE = 'trainer/worker_m';

function grunt(m: FoundingModel): string {
  const g = m.grunt;
  const kit = g.kit.length ? `<div class="row" style="gap:6px;justify-content:center;flex-wrap:wrap">${g.kit.map((k) => `<span class="tg">${esc(k)}</span>`).join('')}</div>` : '';
  const pic = mini(GRUNT_FILE, 150) || '<div style="width:150px;height:150px"></div>';
  return W(`<div class="ev-bubble" style="background:var(--pa);color:var(--pai);padding:6px 10px;border-radius:10px;font-weight:700;text-align:center;min-height:22px" data-testid="evil-grunt-says">${esc(g.says)}</div>
    <div style="position:relative;display:flex;justify-content:center;${g.looksAway ? 'transform:scaleX(-1);' : ''}">${pic}<i style="position:absolute;left:50%;top:58%;width:34px;height:10px;margin-left:-30px;background:var(--team-b,#2f7a4a);border:2px solid var(--team-a,#efe6c8)"></i></div>
    ${sm(`Face: ${g.face}${g.looksAway ? ' (won\'t look at you)' : ''}`, 'text-align:center')}
    ${sm(`Methods behind them: ${g.litCount} of 7 lit`, 'text-align:center')}${kit}`, 'position:absolute;right:16px;top:96px;bottom:70px;width:280px;display:flex;flex-direction:column;gap:8px;padding:12px', '', ' data-testid="evil-grunt"');
}

function page(m: FoundingModel): string {
  const L = 'position:absolute;left:16px;top:96px;width:620px;bottom:70px;display:flex;flex-direction:column;gap:8px';
  switch (m.page) {
    case 'boss':
      return `<div style="${L}">${W(`<div class="row" style="gap:16px;align-items:center">${m.boss.file ? mini(m.boss.file, 110) : ''}<div class="col" style="gap:4px"><b style="font-size:24px">${esc(m.boss.name)}</b>${sm('The Boss. Never wears the uniform.')}<div class="row" style="gap:8px;align-items:center">${m.boss.starterFile ? mini(m.boss.starterFile, 56) : ''}${sm(`Command party's first: ${m.boss.starter}`)}</div></div></div>`, 'padding:12px')}
        ${W(m.opening.map((t) => `<div style="font-style:italic;line-height:24px">${esc(t)}</div>`).join(''), 'padding:12px')}
        ${m.oldLookLine ? W(sm(m.oldLookLine), 'padding:8px 12px', '', ' data-testid="evil-oldlook"') : ''}</div>`;
    case 'name':
      return `<div style="${L}">${W(`<b>Team</b><div class="ev-field win" style="height:40px;margin-top:6px" data-testid="evil-name-field"></div>${m.name.problem ? sm(m.name.problem, 'color:#f08a7a;margin-top:4px') : sm('One to fourteen letters. A Grunt has to say it aloud.', 'margin-top:4px')}`, 'padding:12px')}
        ${W(`${sm(`Up/Down: suggest. Suggestion: ${m.name.suggestion}`)}${m.name.lists.map((l) => `<div class="row" style="gap:4px;flex-wrap:wrap;margin-top:4px"><b class="sm" style="width:60px">${esc(l.title)}</b>${l.names.slice(0, 9).map((n) => `<span class="tg" style="cursor:pointer"${act('suggest', n)}>${esc(n)}</span>`).join('')}</div>`).join('')}`, 'padding:10px 12px')}</div>`;
    case 'creed': {
      const sel = m.creeds[m.at] ?? m.creeds[0]!;
      return `<div style="${L}"><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px">${m.creeds.map((c, i) => W(`<b>${esc(c.name)}${c.chosen ? ' ✓' : ''}</b>${sm(`"${c.line}"`, 'font-style:italic;font-size:12px;line-height:15px')}`, 'padding:6px 8px;min-height:66px', i === m.at ? 'sel' : '', pick(i) + ` data-testid="evil-creed-${c.id}"`)).join('')}</div>
        ${W(`<b>${esc(sel.name)}</b>${sm(`Pays best: ${sel.pays}`)}${sm(`Who applies: ${sel.applies}`)}${sm(`Its own room: ${sel.room}`)}${sm(`Its Grand Scheme: ${sel.scheme}`)}`, 'padding:10px 12px;display:flex;flex-direction:column;gap:4px')}</div>`;
    }
    case 'line':
      return `<div style="${L}"><div class="row" style="gap:8px">${m.lines.map((l, i) => B(esc(l.name), l.chosen, 'flex:1;justify-content:center', '', pick(i) + ` data-testid="evil-line-${l.id}"`)).join('')}</div>
        ${W(sm(m.lines.find((l) => l.chosen)!.feel), 'padding:10px 12px')}
        ${W(`<b>The methods</b><div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-top:6px">${m.methods.map((x) => `<div class="row" style="gap:6px;opacity:${x.lit ? 1 : 0.35}"><i style="width:12px;height:12px;border-radius:6px;background:${x.lit ? 'var(--team-b,#2f7a4a)' : '#555'}"></i><b>${esc(x.name)}</b><span class="sm">${esc(x.word)}</span></div>`).join('')}</div>`, 'padding:10px 12px')}
        ${sm('Left/Right moves the Line. It can move once a region, later.')}</div>`;
    case 'doctrine': {
      const sel = m.doctrines[m.at] ?? m.doctrines[0]!;
      return `<div style="${L}"><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px">${m.doctrines.map((d, i) => W(`<b>${esc(d.name)}${d.chosen ? ' ✓' : ''}</b>${sm(`"${d.line}"`, 'font-style:italic;font-size:12px;line-height:15px')}`, 'padding:6px 8px;min-height:70px', i === m.at ? 'sel' : '', pick(i) + ` data-testid="evil-doctrine-${d.id}"`)).join('')}</div>
        ${W(`<b>${esc(sel.name)}</b>${sm(`Perk: ${sel.perk}`)}${sm(`Weakness the Hero learns: ${sel.weakness}`)}${sm(`Three example kits: ${sel.kits.join(' · ')}`)}`, 'padding:10px 12px;display:flex;flex-direction:column;gap:4px')}</div>`;
    }
    case 'summary':
      return `<div style="${L}">${W(m.summary.rows.map(([a, b]) => `<div class="row sm" style="line-height:24px"><span style="width:120px">${esc(a)}</span><b class="grow">${esc(b)}</b></div>`).join(''), 'padding:12px')}
        ${m.summary.problem ? sm(m.summary.problem, 'color:#f08a7a') : ''}
        ${m.summary.confirming ? W(`<b>${esc(m.summary.confirmLine)}</b>${sm('Press Found it again to found the team, or Back to look again.')}`, 'padding:10px 12px', 'sel', ' data-testid="evil-confirm"') : ''}</div>`;
  }
}

export function foundingView(_c: ReduxCtx, m: FoundingModel): string {
  const tabs = `<div class="abs row" style="left:16px;right:16px;top:56px;gap:6px">${m.pages.map((p) => `<span class="tg" style="${p.on ? 'outline:2px solid var(--acc);' : ''}${p.done ? '' : p.on ? '' : 'opacity:.6'}">${esc(p.title)}${p.done ? ' ✓' : ''}</span>`).join('')}</div>`;
  const next = m.page === 'summary' ? 'Found it' : 'Next';
  const foot = `<div class="abs row" style="left:16px;right:16px;bottom:16px;gap:10px">${B('Back', false, 'width:140px;justify-content:center', '', act('back') + ' data-testid="evil-back"')}<div class="grow"></div>${B(next, m.ready, `width:200px;justify-content:center;${m.ready ? '' : 'opacity:.5'}`, '', act('next') + ' data-testid="evil-next"')}</div>`;
  return `<div style="position:absolute;inset:0;--team-a:#efe6c8;--team-b:#2f7a4a" data-testid="evil-founding" data-page="${m.page}">${H('Evil Mode · Found a team', 'story', [['Enter', 'next'], ['Esc', 'back']])}${tabs}${page(m)}${grunt(m)}${foot}</div>`;
}

const lamps = (n: number, on: (i: number) => string): string => Array.from({ length: 10 }, (_, i) => `<i style="display:inline-block;width:7px;height:12px;margin-right:2px;border-radius:2px;background:${i < n ? on(i) : '#0004'}"></i>`).join('');

/** The day's frame. With `board` (slice 2: a district), the board fills the middle and the chip sits in its title row. */
export function frameView(_c: ReduxCtx, f: FrameModel, notice: string | null, board?: string): string {
  const s = f.strip;
  const slot = (label: string, body: string, tip: string, id: string): string => W(`<div class="sm" style="line-height:14px">${esc(label)}</div><div style="font-weight:700">${body}</div>`, 'padding:4px 10px', '', ` title="${esc(tip)}" data-testid="evil-${id}"`);
  const strip = `<div class="abs row" style="left:16px;right:16px;top:52px;gap:6px">
    ${slot('Funds', `₽${s.funds.toLocaleString('en-GB')}`, `Funds ₽${s.funds}`, 'funds')}
    ${slot('Heat', lamps(s.heat, (i) => (i < 5 ? '#e8a020' : '#d8483a')), `Heat ${s.heat}`, 'heat')}
    ${slot('Loyalty', esc(s.loyalty.name), `${s.loyalty.name}. ${s.loyalty.face}.`, 'loyalty')}
    ${slot('Regard', lamps(s.regard, () => '#6fb0e8'), `Regard ${s.regard}`, 'regard')}
    ${slot('Dread', lamps(s.dread, () => '#8a5ab8'), `Dread ${s.dread}`, 'dread')}
    ${s.corruption !== null ? slot('Corruption', String(s.corruption), `Corruption ${s.corruption}`, 'corruption') : ''}</div>`;
  const chips = `<div class="abs col" style="right:16px;top:112px;gap:4px;align-items:flex-end">${f.chips.map((c) => `<span class="tg" data-testid="evil-chip">${esc(c)}</span>`).join('')}</div>`;
  const t = f.team;
  const team = W(`<div style="height:6px;background:linear-gradient(90deg,var(--team-a) 50%,var(--team-b) 50%);margin:-10px -12px 8px"></div><b style="font-size:24px" data-testid="evil-team-name">${esc(t.name)}</b>${sm(`Boss: ${t.boss}`)}${sm(`${t.creed} · ${t.line} · ${t.doctrine}`)}`, 'position:absolute;left:16px;top:112px;width:360px;padding:10px 12px');
  const beat = W(`<div style="line-height:24px" data-testid="evil-beat-text">${esc(f.text)}</div>${notice ? sm(notice, 'margin-top:8px') : ''}`, 'position:absolute;left:16px;right:16px;top:230px;padding:14px');
  const lozenges = f.beats.map((b) => `<span class="tg" data-testid="evil-beat-${b.id}" data-state="${b.state}" style="${b.state === 'now' ? 'outline:2px solid var(--acc);' : b.state === 'later' ? 'opacity:.55;' : ''}">${b.state === 'done' ? '✓ ' : ''}${esc(b.name)}</span>`).join('');
  const foot = `<div class="abs row" style="left:16px;right:16px;bottom:16px;gap:6px;align-items:center">${lozenges}<div class="grow"></div>${B(esc(f.button), true, 'width:190px;justify-content:center', '', act('advance') + ' data-testid="evil-advance"')}</div>`;
  const middle = board ?? `${chips}${team}${beat}`;
  return `<div style="position:absolute;inset:0;--team-a:${esc(t.a)};--team-b:${esc(t.b)}" data-testid="evil-frame">${H(`Evil Mode · ${t.name}`, 'story', [['Enter', f.button], ['Esc', 'menu']])}${strip}${middle}${foot}</div>`;
}
