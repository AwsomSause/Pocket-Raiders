// Phantom UI: the operation screens the mock-ups had no page for: the Rescue (the impound slip, the holding clock,
// the plans with their odds words), the Siege map (the districts as a ledger) and the League counter-pick. They take
// the New UI's models (ui/redux/screens/ops.ts), so the scenes steer them exactly as before. Presentation only.

import type { PhantomVersion } from '../../../core/presentation/phantom';
import { siegeCost, type CounterModel, type RescueModel, type SiegeMapModel, type SiegeStatus } from '../../redux/screens/ops';
import { figure } from '../../redux/templates';
import { act, esc, keys, mon, page, ty } from '../kit';
import { backK, factRows, fit, phHead } from '../templates';

/** The game's line along the bottom, with who says it. */
const told = (text: string, who = '', more = false, cls = 'ph-say-m'): string =>
  text ? `<div class="pn ph-say ${cls}">${who ? `<span class="lab">${esc(who)}</span>` : ''}<p class="txt">${esc(text)}${more ? ' <b class="ph-op-more">▼</b>' : ''}</p></div>` : '';
/** A click anywhere turns the page (or ends the screen). */
const anywhere = (name: string): string => `<div class="ph-fill ph-op-any"${act(name)}></div>`;

// ---------- Rescue ----------

export function phRescue(_ph: PhantomVersion, d: RescueModel): string {
  const options = d.more ? [] : d.options;
  const slip = `<div class="pn lt tilt ph-rq-slip" style="--r:-1.6deg"><span class="lab">${esc(d.head)}</span>${factRows(d.held)}${d.slip ? `<p class="txt ph-rq-i">${esc(d.slip)}</p>` : ''}`
    + `<div class="ph-rq-foot"><p class="txt">${d.notes.map(esc).join('<br>')}</p>${d.stamp ? `<b class="ph-rq-stamp${d.stampGood ? ' good' : ''}">${esc(d.stamp)}</b>` : ''}</div></div>`;
  const step = (k: number): string => (k === d.clock.at ? 'at' : d.clock.done && k < d.clock.at ? 'was' : '');
  const clock = `<div class="pn ph-rq-clock"><span class="lab">${esc(d.clock.title)}</span><div class="ph-rq-steps">${d.clock.steps.map((s, k) => `<div class="${step(k)}"><i></i><span>${esc(s)}</span></div>`).join('')}</div>${d.clock.note ? `<p class="txt">${esc(d.clock.note)}</p>` : ''}</div>`;
  const rows = options.map((o, k) => `<div class="pn ph-rq-o${k === d.index ? ' lt on' : ''}${o.locked ? ' off' : ''}" style="--i:${k}" data-key="o${k}"${act('pick', k, 'over')}><b class="${o.label.length > 34 ? 'long' : ''}">${esc(o.label)}</b>${o.tag ? `<em class="${esc(o.tag.toLowerCase())}">${esc(o.tag)}</em>` : ''}</div>`).join('');
  return page('rescue', backK('polygon(42% 0,100% 0,100% 100%,50% 100%)', 80, 44) + phHead(d.header, 'Story')
    + `<div class="ph-rq-l">${slip}${clock}</div><div class="ph-rq-os">${rows}</div>`
    + (d.rival ? `<div class="ph-rq-rival" aria-hidden="true">${figure(d.rival, 150)}</div>` : '')
    + told(d.text, d.who ?? '', d.more, 'ph-say-s') + (d.more ? anywhere('page') : '')
    + (d.more ? keys(['Enter', 'Next', 'page']) : keys(['▲▼', 'Plan'], ['Enter', 'Choose', 'pick', d.index])));
}

// ---------- Siege ----------

const SIEGE_WORD: Record<SiegeStatus, string> = { held: 'Held', contested: 'Contested', lost: 'Lost' };

export function phSiege(_ph: PhantomVersion, d: SiegeMapModel): string {
  const cur = d.rows[d.index], chosen = d.entered ?? d.index;
  const effect = (k: number): string => { const r = d.rows[k]!; return r.status === 'lost' ? r.ifLost : !r.gate ? 'No gate here' : r.status === 'held' ? 'Free entry' : 'Costs one battle'; };
  const rows = d.rows.map((r, k) => `<div class="pn ph-sg-r${k === d.index ? ' lt on' : ''}" style="--i:${k}" data-key="r${k}"${act('district', k, 'over')}><b style="font-size:${fit(r.name, 230, 28, 16)}px">${esc(r.name)}</b><em class="${r.status}">${SIEGE_WORD[r.status]}</em><span>${esc(effect(k))}</span>${k === chosen && r.gate ? '<u>Chosen gate</u>' : ''}</div>`).join('');
  const tally = (['held', 'contested', 'lost'] as const).map((s) => [s, d.rows.filter((r) => r.status === s).length] as const);
  const control = `<div class="ph-sg-ctl">${tally.map(([s, n]) => (n ? `<i class="${s}" style="flex:${n}"></i>` : '')).join('')}</div><div class="ph-sg-tal">${tally.map(([s, n]) => `<span class="${s}">${SIEGE_WORD[s]} ${n}</span>`).join('')}</div>`;
  const lost = d.rows.filter((r) => r.status === 'lost');
  const card = cur
    ? `<div class="pn lt tilt ph-sg-card" style="--r:1deg" data-key="c${d.index}"><span class="lab">${esc(d.title)}</span><h3 class="tl1" style="font-size:${fit(cur.name, 330, 40, 22)}px">${esc(cur.name)}</h3>${factRows([['Status', SIEGE_WORD[cur.status]], ['Cost', siegeCost(cur)], ['Held by', cur.heldBy || 'Nobody'], ...(d.tries ? [['Gate fights lost', String(d.tries)] as const] : [])])}${control}`
      + `<div class="ph-sg-go"><div class="blade on${d.ready ? '' : ' off'}" style="--sh:#000;--r:-3deg"${act('enter')}>${esc(d.button)}</div></div></div>`
    : '';
  const warn = `<div class="pn ph-sg-lost"><span class="lab">Lost district effects</span>${lost.length ? lost.map((r) => `<p class="txt"><b>${esc(r.name)}:</b> ${esc(r.ifLost)}</p>`).join('') : '<p class="txt">None. No district is lost.</p>'}</div>`;
  return page('siege', backK('polygon(60% 0,100% 0,100% 100%,68% 100%)', 84, 40) + phHead(d.header, 'On the road')
    + `<div class="ph-sg-rows${d.rows.length > 6 ? ' many' : ''}">${rows}</div>` + card + warn + told(d.text, '', false, 'ph-say-w')
    + keys(['▲▼', 'District'], ['Enter', d.button, 'enter']));
}

// ---------- League counter-pick ----------

const COUNTER_TAG = { answer: 'The League will answer this', registered: 'Registered', out: 'Not registered' } as const;

export function phCounterPick(_ph: PhantomVersion, d: CounterModel): string {
  const n = d.bench.length, done = d.result !== null;
  const tiles = d.party.map((p, k) => `<div class="pn ph-lc-t ${p.state}${p.state === 'answer' ? ' lt' : ''}" style="--i:${k}"><div class="ph-lc-pic">${p.file ? mon(p.file, 1.1) : ''}</div><b style="font-size:${fit(p.name, 150, 24, 14)}px">${esc(p.name)}</b><div class="ph-lc-ty">${p.types.map(ty).join('')}</div><small>${COUNTER_TAG[p.state]}</small></div>`).join('');
  const rows = d.bench.map((m, k) => `<div class="ph-lc-b${k === d.at ? ' on' : ''}" data-key="b${k}"${act('pick', k, 'over')}><i>${m.file ? mon(m.file, 0.8) : ''}</i><b style="font-size:${fit(m.name, 170, 24, 15)}px">${esc(m.name)}</b><span>${esc(m.sub)}</span>${k === d.pick ? '<em>Pick</em>' : ''}</div>`).join('');
  const blades = done ? '' : `<div class="ph-lc-go"><div class="blade${d.at === n ? ' on' : ''}" style="--i:0;--sh:#000;--r:-3deg;font-size:${fit(d.swap, 330, 30, 18)}px" data-key="s"${act('pick', n, 'over')}>${esc(d.swap)}</div><div class="blade${d.at === n + 1 ? ' on' : ''}" style="--i:1;--sh:#000;--r:-1deg;font-size:${fit(d.keep, 330, 30, 18)}px" data-key="k"${act('pick', n + 1, 'over')}>${esc(d.keep)}</div></div>`;
  const side = `<div class="pn ph-lc-side"><span class="lab">Swap it for a boxed Pokémon?</span>${rows || '<p class="txt">No boxed Pokémon can take its place.</p>'}${blades}</div>`;
  return page('counterpick', backK('polygon(0 0,36% 0,22% 100%,0 100%)', 86, 60) + phHead('League counter-pick', 'Battle')
    + `<div class="ph-lc-party">${tiles}</div>` + side + told(done ? d.result! : d.text, done ? '' : d.who, false, 'ph-say-w') + (done ? anywhere('done') : '')
    + (done ? keys(['Enter', 'Continue', 'done']) : keys(['▲▼', 'Move'], ['Enter', 'Choose', 'pick', d.at])));
}
