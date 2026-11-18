// Evil Mode's Board and Dispatch in the New look (design Part 29 sections 4 and 5). Draws the plain data from
// core/evilMode/boardScreens.ts inside the day's frame; EvilScene keeps the cursor and the job being built.
// Every button is a tap target (data-act) and has a key path (EvilScene.key), so a job can be queued with either alone.

import type { BoardModel } from '../../../core/evilMode/boardScreens';
import type { FrameModel } from '../../../core/evilMode/screens';
import { act, B, esc, W } from '../kit';

const sm = (t: string, st = ''): string => `<div class="sm" style="line-height:16px;${st}">${esc(t)}</div>`;
const RING: Record<string, string> = { none: '2px solid #0000', scouted: '2px dashed #bbb', holds: '3px solid var(--team-b)', turn: '3px dashed var(--team-b)' };

function map(m: BoardModel): string {
  const cell = (c: BoardModel['cells'][number], i: number): string => {
    const row = i < 10 ? 0 : 1;
    const col = row === 0 ? i : 19 - i; // the road snakes back along the second row to the Gym
    return `<div class="win${c.sel ? ' sel' : ''}" style="position:absolute;left:${col * 58}px;top:${row * 60}px;width:52px;height:52px;padding:0;box-sizing:border-box;outline:${RING[c.ring]};outline-offset:-3px;opacity:${c.lit ? 1 : 0.4};cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center"${act('cell', i)} data-testid="evil-cell-${c.step}" data-ring="${c.ring}" title="${esc(`${c.step}. ${c.name} (${c.kind})${c.mood ? `, ${c.mood}` : ''}`)}">
      <span class="sm" style="position:absolute;left:4px;top:1px;font-size:10px">${c.step}</span><b style="font-size:20px">${esc(c.mark)}</b>
      ${c.dot ? `<i style="position:absolute;right:4px;top:4px;width:9px;height:9px;border-radius:5px;background:${c.dot};border:1px solid #0008"></i>` : ''}
      ${c.queued ? '<i style="position:absolute;right:3px;bottom:3px;width:10px;height:10px;background:var(--team-a);border:2px solid var(--team-b);transform:rotate(45deg)"></i>' : ''}
      ${c.home ? '<span style="position:absolute;left:3px;bottom:0;font-size:11px" title="Their street" data-testid="evil-home">⌂</span>' : ''}
      ${c.posted ? '<span style="position:absolute;right:3px;top:13px;font-size:11px;font-weight:700;color:var(--team-a)" title="Somebody\'s standing here" data-testid="evil-posted">⚑</span>' : ''}
      ${c.road ? '<i style="position:absolute;left:6px;right:6px;bottom:2px;border-bottom:2px dotted #fff8" data-testid="evil-road"></i>' : ''}
      ${c.hero ? '<b style="position:absolute;left:50%;top:-8px;transform:translateX(-50%);background:#fff;color:#141414;border-radius:8px;padding:0 5px;font-size:11px;line-height:15px;box-shadow:0 0 0 2px #141414" title="The kid" data-testid="evil-hero-marker">KID</b>' : ''}</div>`;
  };
  return `<div class="abs" style="left:16px;top:130px;width:580px;height:112px" data-testid="evil-map">${m.cells.map(cell).join('')}</div>`;
}

function panel(m: BoardModel): string {
  const p = m.panel;
  const row = (a: string, b: string, id = '') => `<div class="row sm" style="line-height:18px"><span style="width:62px;flex:none">${esc(a)}</span><b class="grow"${id ? ` data-testid="${id}"` : ''} style="${b ? '' : 'border-bottom:1px solid #8886;min-height:14px'}">${esc(b)}</b></div>`;
  return W(`<b data-testid="evil-panel-name">${esc(p.name)}</b>${sm(p.kind)}${row('Mood', p.mood, 'evil-panel-mood')}${row('Earns', p.earns)}${row('Price', p.price)}${row('Wants', p.wants, 'evil-panel-wants')}${row('Fears', p.fears)}${row('Held', p.held, 'evil-panel-held')}${p.says ? sm(p.says, 'font-style:italic;margin-top:4px') : ''}${p.rail.length ? `<div style="margin-top:6px" data-testid="evil-gym-rail">${p.rail.map((r) => `<div class="sm" style="line-height:16px"><b style="color:${r.done ? 'inherit' : r.open ? '#7fd18f' : '#f08a7a'}">${esc(r.name)}</b>: ${esc(r.why)}</div>`).join('')}${sm('Y opens the Gym.', 'opacity:.7;margin-top:2px')}</div>` : ''}`, 'position:absolute;left:612px;right:16px;top:130px;bottom:70px;padding:8px 10px;overflow:auto', '', ' data-testid="evil-panel"');
}

function texts(m: BoardModel, notice: string | null): string {
  const fight = m.fight ? `<div style="margin-bottom:6px;cursor:pointer" ${act('advance')} data-testid="evil-fight"><b class="sm" style="color:var(--team-a)">${esc(m.fight)}</b></div>` : '';
  const go = m.inPerson ? `<div style="margin-bottom:6px" data-testid="evil-inperson"><b class="sm">In person</b>${m.inPerson.go.map((g) => `<div class="row sm" style="line-height:20px;padding:0 4px;cursor:pointer;${g.sel ? 'outline:2px solid var(--team-a);' : ''}"${act('go', g.holdingId)} data-testid="evil-go">${esc(g.text)}</div>`).join('')}${m.inPerson.clock.map((c) => `<div class="row sm" style="line-height:20px;padding:0 4px;cursor:pointer;text-decoration:underline"${act('clock', c.code)} data-testid="evil-clock-${c.code.replace(':', '-')}">${esc(c.text)}</div>`).join('')}${m.inPerson.done ? sm(m.inPerson.done, 'opacity:.7') : sm('G, or press one, to go. Enter stays in.', 'opacity:.7')}</div>` : '';
  const blocks = m.overnight.map((o) => `<div style="margin-bottom:6px" data-testid="evil-sheet"><b class="sm">${esc(o.title)}</b>${o.lines.map((l) => sm(l)).join('')}</div>`).join('');
  const eve = m.evening.length ? `<div data-testid="evil-evening">${m.evening.map((l) => sm(l)).join('')}</div>` : '';
  return W(`${fight}${go}${blocks}${eve}${notice ? sm(notice, 'margin-top:6px') : ''}${!fight && !go && !blocks && !eve && !notice ? sm('Arrows move along the road. Each holding shows what is known.') : ''}`, 'position:absolute;left:16px;width:580px;top:252px;bottom:70px;padding:8px 10px;overflow:auto', '', ' data-testid="evil-text"');
}

function endView(m: BoardModel): string {
  const e = m.end!;
  const head = e.how === 'held' ? 'Held' : e.how === 'taken' ? 'Not held' : e.how === 'arrival' ? 'The Arrival is over' : 'The Hero is at the door';
  const rows = e.rows.map(([a, b]) => `<div class="row sm" style="line-height:18px"><span style="width:110px;flex:none">${esc(a)}</span><b class="grow">${esc(b)}</b></div>`).join('');
  const said = e.said ? sm(`One thing somebody said: ${e.said}`, 'font-style:italic;margin-top:4px') : '';
  // Slice 9: the tally, then the Road (who stays), or the region's end. Every choice is a button and has a key (Enter).
  let foot = sm('Enter: on to the Road.', 'margin-top:6px;opacity:.8');
  if (e.phase === 'day') foot = sm('Leave saves the run.', 'margin-top:8px');
  if (e.phase === 'tally' && e.how === 'reckoning') foot = sm('Enter: the end of the region.', 'margin-top:6px;opacity:.8');
  if (e.phase === 'over') foot = W(`<b data-testid="evil-region-over">${esc(e.text)}</b>`, 'padding:6px 8px;margin-top:6px');
  if (e.crossing) {
    // Slice 16: the Crossing, one step at a time. Each choice is a button; Enter takes the first one that's open.
    const x = e.crossing;
    const first = x.choices.find((c) => !c.off)?.code;
    foot = `<div style="margin-top:6px" data-testid="evil-crossing" data-step="${x.step}"><b>${esc(x.title)}</b>${sm(x.intro, 'font-style:italic')}${x.said.map((l) => sm(l, 'opacity:.8')).join('')}
      <b class="sm" style="display:block;margin-top:4px">${esc(x.heading)}</b>${x.info.map((l) => sm(l)).join('')}
      ${x.choices.map((c) => `<div class="sm" style="line-height:18px;padding:3px 4px;cursor:${c.off ? 'default' : 'pointer'};opacity:${c.off ? 0.45 : 1}"${c.off ? '' : act('cross', c.code)} data-testid="evil-cross-${c.code.replace(':', '-')}"><b>${c.code === first ? '→ ' : ''}${esc(c.text)}${c.code === first ? ' (Enter)' : ''}</b><div style="opacity:.8">${esc(c.sub)}</div></div>`).join('')}</div>`;
  }
  if (e.road) {
    const r = e.road;
    foot = `<div style="margin-top:6px" data-testid="evil-road-page"><b>${esc(r.title)}</b>${sm(r.heard, 'font-style:italic')}${sm(r.carried)}
      ${r.stay.map((x) => `<div class="row sm" style="line-height:22px;cursor:pointer;padding:0 4px"${act('stay', x.id)} data-testid="evil-stay-${x.id}">☐ ${esc(x.text)}</div>`).join('')}
      <div class="row sm" style="line-height:22px;cursor:pointer;padding:0 4px;font-weight:700"${act('stay', '')} data-testid="evil-stay-nobody">→ ${esc(r.nobody)} (Enter)</div>
      ${r.away.map((x) => `<div class="row sm" style="line-height:20px;cursor:pointer;padding:0 4px;text-decoration:underline"${act('recall', x.id)} data-testid="evil-recall-${x.id}">${esc(x.text)}</div>`).join('')}</div>`;
  }
  return W(`<b style="font-size:20px" data-testid="evil-end" data-how="${e.how}" data-phase="${e.phase}">${esc(head)}</b>${sm(e.title, 'margin:2px 0')}${e.phase !== 'over' ? sm(e.text, 'margin:2px 0 6px') : ''}${e.crossing ? '' : `<div data-testid="evil-tally">${rows}</div>${said}`}${foot}`, 'position:absolute;left:16px;width:580px;top:252px;bottom:70px;padding:10px 12px;overflow:auto');
}

function dispatch(m: BoardModel, notice: string | null): string {
  const d = m.dispatch!;
  const list = W(`<b class="sm">Where · ${esc(d.funds)} to spend</b>${d.rows.map((r) => `<div class="row sm" style="line-height:20px;padding:0 4px;cursor:pointer;${r.sel ? 'outline:2px solid var(--team-a);' : ''}"${act('cell', r.at)} data-testid="evil-row-${r.at + 1}"><span class="grow">${esc(r.name)}</span><span style="opacity:.8">${esc(r.mood)}</span>&nbsp;<span style="opacity:.7">${esc(r.queued ?? r.known)}</span></div>`).join('')}<div class="row sm" style="line-height:22px;padding:0 4px;cursor:pointer;font-weight:700;${d.sendSel ? 'outline:2px solid var(--team-a);' : ''}"${act('advance')} data-testid="evil-send-row">Send them →</div>`, 'position:absolute;left:612px;right:16px;top:130px;bottom:70px;padding:6px 8px;overflow:auto', d.step === 'where' ? 'sel' : '', ' data-testid="evil-where"');
  const crew = W(`<b class="sm">Who</b>${d.crew.map((c) => `<div class="row sm" style="line-height:20px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding:0 4px;cursor:pointer;opacity:${c.why ? 0.5 : 1};${c.sel ? 'outline:2px solid var(--team-a);' : ''}"${act('crew', c.id)} data-testid="evil-crew-${c.id}" data-in="${c.inSquad}" title="${esc(c.why ?? '')}">${c.inSquad ? '☑' : '☐'}&nbsp;${esc(c.name)}</div>`).join('')}
    <div class="row sm" style="line-height:22px;padding:0 4px;cursor:pointer;${d.nextSel ? 'outline:2px solid var(--team-a);' : ''}"${act('how')} data-testid="evil-who-next">→ How</div>`, 'position:absolute;left:16px;width:130px;top:252px;bottom:70px;padding:6px 8px;overflow-y:auto', d.step === 'who' ? 'sel' : '', ' data-testid="evil-who"');
  const methods = `<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:4px">${d.methods.map((x, i) => B(`${x.key}. ${esc(x.name)}`, x.chosen, `padding:2px 4px;font-size:13px;justify-content:center;opacity:${x.on ? 1 : 0.4}`, '', `${act('method', i)} data-testid="evil-method-${x.id}" title="${esc(x.dark ?? x.word)}"`)).join('')}</div>`;
  const offers = d.offers ? `<div class="row" style="gap:4px;margin-top:4px">${d.offers.map((o) => B(`${o.pct}% · ${esc(o.cost)}`, o.chosen, 'padding:2px 6px;font-size:12px', '', `${act('offer', o.pct)} data-testid="evil-offer-${o.pct}"`)).join('')}</div>` : '';
  const things = d.things ? `<div class="row" style="gap:4px;margin-top:4px">${d.things.map((t) => B(esc(t.name), t.chosen, `padding:2px 6px;font-size:12px;opacity:${t.why ? 0.5 : 1}`, '', `${act('thing', t.id)} data-testid="evil-thing-${t.id}" title="${esc(t.why ?? '')}"`)).join('')}</div>` : '';
  const queue = d.queue.length ? d.queue.map((q) => `<div class="row sm" style="line-height:18px"><span class="grow" data-testid="evil-queued">${esc(q.text)}</span><span style="cursor:pointer;text-decoration:underline"${act('clear', q.holdingId)}>Clear</span></div>`).join('') : sm('Nothing queued yet.');
  const how = W(`<b class="sm">How</b>${methods}${offers}${things}
    <div class="sm" style="line-height:16px;margin-top:4px" data-testid="evil-odds">${esc(d.oddsLine)}</div>
    ${d.wont ? `<div class="sm" style="line-height:16px" data-testid="evil-wont">Who won't: ${esc(d.wont)}</div>` : ''}
    <div class="sm" style="line-height:16px;opacity:.85" data-testid="evil-heat-forecast">${esc(d.heat)}</div>
    ${d.problem ? sm(d.problem, 'color:#f08a7a') : ''}${notice ? sm(notice) : ''}
    <div class="row" style="gap:6px;margin-top:4px">${B('Read the Card', d.canQueue, `padding:2px 12px;${d.canQueue ? '' : 'opacity:.5'}`, '', `${act('queue')} data-testid="evil-queue"`)}</div>
    ${d.hold ? `<div class="row" style="gap:6px;margin-top:4px">${B(esc(d.hold.label), !d.hold.problem, `padding:2px 12px;${d.hold.problem ? 'opacity:.5' : ''}`, '', `${act('hold')} data-testid="evil-hold" title="${esc(d.hold.problem ?? '')}"`)}</div>${d.hold.problem ? sm(d.hold.problem, 'opacity:.7') : ''}` : ''}
    <div style="margin-top:4px">${queue}${d.posted.map((q) => `<div class="row sm" style="line-height:18px"><span class="grow" data-testid="evil-posted-row">${esc(q.text)}</span><span style="cursor:pointer;text-decoration:underline"${act('unpost', q.holdingId)}>Clear</span></div>`).join('')}</div>`, 'position:absolute;left:152px;width:444px;top:252px;bottom:70px;padding:6px 8px;overflow:auto', d.step === 'how' ? 'sel' : '', ' data-testid="evil-how"');
  return list + crew + how;
}

export function boardView(m: BoardModel, f: FrameModel, notice: string | null, extra: { ledger?: string; roster?: string; file?: string; line?: string; gym?: string; trade?: string; neighbour?: string; scheme?: string; base?: string; road?: string; night?: string; filed?: string; rail?: string; edges?: string; edgesTag?: string } = {}): string {
  const book = `<span class="tg" style="cursor:pointer;${extra.ledger ? 'outline:2px solid var(--acc);' : ''}"${act('ledger')} data-testid="evil-ledger-open" title="Key L">Ledger</span>`;
  const people = `<span class="tg" style="cursor:pointer;${extra.roster ? 'outline:2px solid var(--acc);' : ''}"${act('roster')} data-testid="evil-roster-open" title="Key R">Roster</span>`;
  const lineTag = m.lineFixed ? '' : `<span class="tg" style="cursor:pointer;${extra.line ? 'outline:2px solid var(--acc);' : ''}"${act('line')} data-testid="evil-line-open" title="Key N">Line</span>`;
  const gymTag = `<span class="tg" style="cursor:pointer;${extra.gym ? 'outline:2px solid var(--acc);' : ''}"${act('gym')} data-testid="evil-gym-open" title="Key Y">Gym</span>`;
  const tradeTag = `<span class="tg" style="cursor:pointer;${extra.trade ? 'outline:2px solid var(--acc);' : ''}"${act('trade')} data-testid="evil-trade-open" title="Key T">Trade</span>`;
  const nbTag = m.neighbour ? `<span class="tg" style="cursor:pointer;${extra.neighbour ? 'outline:2px solid var(--acc);' : ''}"${act('nb')} data-testid="evil-nb-open" title="${esc(m.neighbour)}">${esc(m.neighbour.split(' · ')[0]!)}</span>` : '';
  const scTag = `<span class="tg" style="cursor:pointer;${extra.scheme ? 'outline:2px solid var(--acc);' : ''}"${act('scheme')} data-testid="evil-sc-open" title="Key C">Scheme</span>`;
  // Slice 21: the Edges page (key J); its tag reads the Tear's chip while one's open.
  const edgeTag = extra.edgesTag ? `<span class="tg" style="cursor:pointer;${extra.edges ? 'outline:2px solid var(--acc);' : ''}"${act('edges')} data-testid="evil-edge-open" title="Key J">${esc(extra.edgesTag)}</span>` : '';
  const baseTag = `<span class="tg" style="cursor:pointer;${extra.base ? 'outline:2px solid var(--acc);' : ''}"${act('base')} data-testid="evil-base-open" title="Key B">Base</span>`;
  const roadTag = `<span class="tg" style="cursor:pointer;${extra.road ? 'outline:2px solid var(--acc);' : ''}"${act('road')} data-testid="evil-road-open" title="Key O">Road</span>`;
  const houseTag = m.house ? `<span class="tg" style="min-width:0;flex:0 1 auto;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${esc(m.house.line)}" data-testid="evil-house">${esc(m.house.line)}</span>${m.house.acts.length ? `<span class="row" style="gap:4px;flex:0 1 auto;min-width:0;max-width:46%;overflow-x:auto;white-space:nowrap" data-testid="evil-house-acts">${m.house.acts.map((a, i) => `<span class="tg" style="cursor:pointer;flex:0 0 auto;${a.problem ? 'opacity:.5' : 'background:var(--team-b);color:#fff'}"${act('house', i)} title="${esc(a.problem ?? '')}" data-testid="evil-house-act">${esc(a.label)}${i === 0 ? ' (U)' : ''}</span>`).join('')}</span>` : ''}` : '';
  const fileTag = `<span class="tg" style="cursor:pointer;${extra.file ? 'outline:2px solid var(--acc);' : ''}"${act('file')} data-testid="evil-file-open" title="Key F">File</span>`;
  const title = `<div class="abs row" style="left:16px;right:16px;top:100px;gap:6px;align-items:center;overflow:hidden"><b data-testid="evil-team-name" style="flex:0 0 auto">${esc(f.team.name)}</b><span class="tg" style="min-width:0;flex:0 1 auto;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${esc(m.title)}">${esc(m.title)}</span><span class="tg" style="${m.warn ? 'background:var(--team-b);color:#fff' : ''}" data-testid="evil-day">${esc(m.day)}</span><span class="tg" data-testid="evil-count">${esc(m.count)}</span><div class="grow"></div>${f.chips.map((c) => `<span class="tg" style="min-width:0;flex:0 1 auto;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${esc(c)}" data-testid="evil-chip">${esc(c)}</span>`).join('')}${houseTag}<span class="row" style="gap:4px;flex:0 0 auto;white-space:nowrap" data-testid="evil-tabs">${[lineTag, gymTag, tradeTag, nbTag, scTag, edgeTag, baseTag, roadTag, fileTag, people, book].join('')}</span></div>`;
  // The Ledger shares the frame and takes the board's place (slice 3); the last line filed sits in its corner.
  // The Base (slice 10) the same way; Walk it and a Raid hold it open over everything.
  // Slice 12: the fire and the last room hold the screen; the Road page takes the board's place like the rest.
  if (extra.road) return `${title}${extra.road}${extra.filed ?? ''}`;
  if (extra.base) return `${title}${extra.base}${extra.filed ?? ''}`;
  if (extra.ledger) return `${title}${extra.ledger}${extra.filed ?? ''}`;
  // The Roster (slice 4) takes the board's place the same way.
  if (extra.roster) return `${title}${extra.roster}${extra.filed ?? ''}`;
  // The File (slice 5) the same way.
  if (extra.file) return `${title}${extra.file}${extra.filed ?? ''}`;
  // The Line (slice 6) the same way.
  if (extra.line) return `${title}${extra.line}${extra.filed ?? ''}`;
  // The Gym (slice 8) the same way.
  if (extra.gym) return `${title}${extra.gym}${extra.filed ?? ''}`;
  // The Trade page (slice 11) the same way.
  if (extra.trade) return `${title}${extra.trade}${extra.filed ?? ''}`;
  // The neighbour (slice 13) the same way.
  if (extra.neighbour) return `${title}${extra.neighbour}${extra.filed ?? ''}`;
  // The Scheme (slice 14) the same way.
  if (extra.scheme) return `${title}${extra.scheme}${extra.filed ?? ''}`;
  if (extra.edges) return `${title}${extra.edges}${extra.filed ?? ''}`;
  // The Office at Night (slice 7) takes the board's place the same way.
  if (extra.night) return `${title}${extra.night}${extra.filed ?? ''}`;
  // Slice 22: the Turn's first meeting (Part 28 section 15.2): the Hero in the road, one line, three answers.
  if (m.meeting) {
    const g = m.meeting;
    const card = W(`<b style="font-size:18px">${esc(g.title)}</b>${sm(`${g.who} is standing there. No battle is offered.`, 'margin:2px 0 6px')}<div style="font-size:16px;margin-bottom:10px" data-testid="evil-meeting-line">${esc(g.line)}</div><div class="row" style="gap:8px;flex-wrap:wrap">${g.answers.map((a, i) => B(`${i + 1}. ${esc(a.label)}`, false, '', '', `${act('meet', a.key)} data-testid="evil-meet-${a.key}"`)).join('')}</div>`, 'position:absolute;left:16px;width:580px;top:252px;bottom:70px;padding:10px 12px;overflow:auto', '', ' data-testid="evil-meeting"');
    return `${title}${map(m)}${card}${panel(m)}${extra.filed ?? ''}`;
  }
  const lower = m.end ? endView(m) + panel(m) : m.dispatch ? dispatch(m, notice) : texts(m, notice) + panel(m);
  // Part 29 section 17: on a phone (body.rx-phone, CSS only) the map's full width, the two rails are tabs at the edges
  // that slide in, and Dispatch shows one step at a time. On a wide window the wrapper changes nothing.
  const mode = m.end ? 'end' : m.dispatch ? 'dispatch' : 'day';
  const rail = extra.rail ?? '';
  const tabs = mode === 'day' ? `<div class="rail-tab left${rail === 'left' ? ' on' : ''}"${act('rail', 'left')} data-testid="evil-rail-left">${rail === 'left' ? '‹' : 'Day ›'}</div><div class="rail-tab right${rail === 'right' ? ' on' : ''}"${act('rail', 'right')} data-testid="evil-rail-right">${rail === 'right' ? '›' : '‹ Here'}</div>` : '';
  return `${title}<div class="rx-board" data-mode="${mode}" data-rail="${rail}" data-dstep="${m.dispatch?.step ?? ''}" data-testid="evil-board">${map(m)}${lower}${tabs}</div>${extra.filed ?? ''}`;
}
