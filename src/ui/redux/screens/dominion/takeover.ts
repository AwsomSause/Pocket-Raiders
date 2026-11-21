// DOMINION D14 screens, ported from the round-4 mockups (plans/evil-mode-rework/mockups-v4/index.html): s9 "Takeover"
// (the four ways to take the region, with the Hero's file pinned up), the Holdings list beside it, a Turning Point
// card, and m13 "The hijacked broadcast" (the wall of TVs after a Takeover). Plain data in from
// core/dominion/takeoverScreens.ts; the scene's TakeoverController keeps the input.

import './dominion.css';
import './hero.css';
import './takeover.css';
import type { HeroModel } from '../../../../core/dominion/heroScreens';
import type { BroadcastModel, HoldingsModel, TakeoverModel } from '../../../../core/dominion/takeoverScreens';
import { act, esc, tall } from '../../kit';
import { rxUrl } from '../../assets';
import { heroFile, type MonFiles } from './heroViews';
import { skylineUrl } from './paint';
import { stage, WHEEL_KEY } from './views';

const img = (f: string): string => rxUrl(`dominion/${f}.png`);
const ICON_FILE: Record<string, string> = { 'i-leaders_crest': 'g-comet-shard' };
const icon = (f: string): string => img(ICON_FILE[f] ?? f);

const notePanel = (notice: string | null): string =>
  notice ? `<div class="a pnl" style="left:180px;top:200px;width:600px;padding:14px 18px;z-index:40;font-size:16px;line-height:1.35"${act('dismiss')} data-testid="dom-notice">${esc(notice)} <span class="kc">Enter</span></div>` : '';

// ---------- s9: Takeover ----------

export function takeoverView(m: TakeoverModel, hero: HeroModel | null, files: MonFiles, notice: string | null): string {
  const w = [141, 141, 141, 147];
  const lead = m.cards.findIndex((c) => c.lead);
  const cards = m.cards.map((c, i) => {
    const left = 16 + i * 151;
    const ring = c.lead ? ';box-shadow:0 0 0 3px var(--ink),0 0 0 6px #ffd23f,0 0 30px rgba(255,210,63,.45)' : '';
    return `<div class="path${c.id === 'goal' ? ' goal' : ''}" style="--c:${c.colour};left:${left}px;top:72px;width:${w[i]}px;height:250px${ring}" data-testid="dom-path-${c.id}">
      <div class="nm"><img class="ic s" src="${icon(c.icon)}" alt="">${esc(c.name)}</div>
      <div class="dial" style="--v:${c.dial};--c:${c.colour}"><b>${c.dial}</b></div>
      <ul>${c.rows.map((r) => `<li${r.ok ? ' class="ok"' : ''}>${esc(r.text)}</li>`).join('')}</ul>
      ${c.pill ? `<span class="pill ${c.pillTone}" style="margin-top:auto">${esc(c.pill)}</span>` : ''}
    </div>`;
  }).join('');
  const crown = lead >= 0
    ? `<div class="a" style="left:${16 + lead * 151}px;top:72px;width:${w[lead]}px;height:250px;z-index:9;pointer-events:none"><span class="brk" style="inset:-10px"></span></div>
  <div class="rays turn" style="left:${16 + lead * 151 - 47}px;top:20px;width:240px;height:150px;z-index:5;--rc:rgba(200,160,255,.4)"></div>
  <div class="a float" style="left:${16 + lead * 151 + 51}px;top:40px;width:46px;height:30px;z-index:12;background:linear-gradient(180deg,#fff2b0,#ffd23f 50%,#c08a0c);clip-path:polygon(0 100%,0 20%,22% 55%,50% 0,78% 55%,100% 20%,100% 100%);filter:drop-shadow(0 0 8px #ffd23f)"></div>`
    : '';
  const alerts = m.alerts.map((a) => {
    const bg = a.tone === 'y' ? 'rgba(255,204,51,.2)' : a.tone === 'v' ? 'rgba(178,140,255,.22)' : 'rgba(255,90,79,.22)';
    return `<div class="al ${a.tone === 'v' ? 'b' : a.tone}" style="background:linear-gradient(90deg,${bg},rgba(20,26,48,.9));padding:6px 10px"><span><span class="t">${esc(a.title)}</span>${esc(a.text)}</span></div>`;
  }).join('') || (hero?.alerts.slice(0, 2).map((a) => `<div class="al ${a.tone === 'v' ? 'b' : a.tone}" style="background:linear-gradient(90deg,${a.tone === 'y' ? 'rgba(255,204,51,.2)' : 'rgba(255,90,79,.22)'},rgba(20,26,48,.9));padding:6px 10px"><span><span class="t">${esc(a.title)}</span>${esc(a.text)}</span></div>`).join('') ?? '')
    || `<div class="al b" style="padding:6px 10px"><span><span class="t">QUIET</span>Nothing is closing in yet.</span></div>`;
  const tp = m.tp
    ? `<div class="a pnl" style="left:120px;top:120px;width:500px;padding:16px 20px;z-index:45;line-height:1.35;box-shadow:0 0 0 3px var(--ink),0 0 0 6px #b28cff,0 0 40px rgba(178,140,255,.5)"${act('tpSeen')} data-testid="dom-turning-point">
        <div style="font:700 13px var(--ui);letter-spacing:.16em;color:#c9a0ff">TURNING POINT · ${esc(m.tp.track.toUpperCase())} STAGE ${m.tp.stage}</div>
        <div style="font:700 28px var(--regal);margin:4px 0 6px;color:#ffe28a">${esc(m.tp.name)}</div>
        <div style="font-size:18px;font-weight:700">${esc(m.tp.title)}</div>
        <div style="font-size:15px;margin-top:6px;color:#cfd8ff">${esc(m.tp.scene)}.</div>
        <div class="xs" style="margin-top:10px;text-align:right"><span class="kc">Enter</span> go on</div>
      </div>`
    : '';
  return stage(`
  <div class="layer" style="background:linear-gradient(180deg,#060818,#121a3e 55%,#1e1640)"></div>
  <div class="stars twinkle" style="height:260px"></div>
  <div class="moon" style="left:640px;top:8px;width:44px;height:44px;opacity:.9;z-index:30"></div>
  <div class="beam sweep" style="left:90px;--a0:-22deg;--a1:16deg;opacity:.5;z-index:1"></div>
  <div class="layer" style="background:url(${skylineUrl()}) bottom/100% auto no-repeat;opacity:.75"></div>
  <div class="layer" style="background:linear-gradient(180deg,transparent 40%,rgba(6,8,22,.85))"></div>
  <div class="ttl" style="--t1:#3a2a8a;--t2:#7b3fa0" data-testid="dom-takeover">Takeover <span class="sub">· ${esc(m.region)}</span></div>
  <div class="keys">${WHEEL_KEY}<span class="key"${act('back')}>K</span><span>close</span><span class="key"${act('tkHoldings')}>P</span><span>Holdings</span><span class="key">${esc(m.top.phaseWord)}</span><span>${esc(m.top.day.replace('DAY ', 'Day '))}</span></div>
  ${cards}
  <div class="a rib" style="left:16px;top:330px;width:600px;font-size:15px;padding:6px 40px 6px 16px;white-space:nowrap" data-testid="dom-takeover-rib">${esc(m.rib)}</div>
  <div class="a col" style="left:16px;top:372px;width:600px;gap:8px;z-index:6" data-testid="dom-takeover-alerts">${alerts}</div>
  <div class="cta shine" style="left:16px;top:478px;width:600px;height:48px;font-size:20px"${act('tkCta')} data-testid="dom-takeover-cta">${esc(m.cta.label)} <span class="kc">${esc(m.cta.key)}</span></div>
  ${hero ? heroFile(hero, files) : ''}
  <div class="layer pulse" style="top:440px;z-index:1;background:radial-gradient(500px 120px at 316px 540px,rgba(255,60,60,.45),transparent 70%);pointer-events:none"></div>
  <div class="cone" style="left:470px;top:60px;width:240px;height:480px;z-index:1;--cc:rgba(220,220,255,.18)"></div>
  ${crown}
  <div class="haze" style="--hz:#ff7a6a;--hz2:#cfd8ff" aria-hidden="true"></div>
  <div class="grade" aria-hidden="true" style="--g1:#ff7a6a;--g2:#cfd8ff"></div>
  <div class="edgeglow" aria-hidden="true" style="--eg:#ff7a6a"></div>
  <div class="orn" aria-hidden="true"></div>
  ${tp}
  ${notePanel(notice)}
  `, 'background:#070a1c', 'kl-red vign grain');
}

// ---------- the Holdings (takeover-bonuses.md) ----------

const STATE_PILL: Record<string, [string, string]> = { held: ['g', 'YOURS'], seizing: ['y', 'SEIZING'], open: ['v', 'TAKE'], locked: ['k', 'LOCKED'] };

export function holdingsView(m: HoldingsModel): string {
  const from = m.page * m.per;
  const rows = m.rows.slice(from, from + m.per).map((r, k) => {
    const i = from + k, on = i === m.at;
    const [c, w] = STATE_PILL[r.state]!;
    const right = r.state === 'held' || r.state === 'seizing' ? `${r.cond ?? 100}%` : r.cost ? `₽${r.cost.toLocaleString('en-US')}` : '';
    return `<div class="ch${on ? ' on' : ''}" style="padding:5px 10px 5px 20px;font-size:15px;--stripe:${on ? '#ffd23f' : '#56679d'}"${act('tkRow', i)} data-over="tkOver" data-testid="dom-holding-${esc(r.id.split(':')[1] ?? r.id)}">
      <div class="row sp" style="gap:8px"><span>${on ? '▶ ' : ''}${esc(r.place)} <span class="mu xs">${esc(r.town)} · ${esc(r.kind)} · ${esc(r.size)}</span></span><span class="row" style="gap:6px"><span class="xs">${esc(right)}</span><span class="pill ${c}" style="font-size:11px;padding:0 7px">${w}</span></span></div>
    </div>`;
  }).join('');
  const cur = m.rows[m.at];
  const detail = cur
    ? `<div class="hd y"><img class="ic" src="${img('g-relic-crown')}" alt="">${esc(cur.bonus.toUpperCase())}</div>
      <div class="sm" style="line-height:1.35">${esc(cur.text)}</div>
      ${cur.limited ? `<div class="xs" style="margin-top:8px;line-height:1.3;color:#ffe28a">In this version: ${esc(cur.limited)}</div>` : ''}
      <div class="xs mu" style="margin-top:10px">How</div><div class="sm">${esc(cur.kind)}${cur.cost ? ` · ₽${cur.cost.toLocaleString('en-US')}` : ''}</div>
      <div class="sm" style="margin-top:10px;font-weight:700;color:${cur.state === 'open' ? '#8fffb0' : '#ff9a8f'}" data-testid="dom-holding-why">${esc(cur.state === 'open' ? 'Enter to take it (one Boss action).' : cur.state === 'held' ? 'Yours. Its bonus pays each week.' : cur.state === 'seizing' ? 'Hold on: your crew is still seizing it.' : cur.why ?? '')}</div>`
    : '';
  return stage(`
  <div class="layer" style="background:linear-gradient(180deg,#060818,#121a3e 55%,#1e1640)"></div>
  <div class="layer" style="background:url(${skylineUrl()}) bottom/100% auto no-repeat;opacity:.45"></div>
  <div class="layer" style="background:linear-gradient(180deg,rgba(6,8,22,.4),rgba(6,8,22,.9))"></div>
  <div class="ttl" style="--t1:#8a6a1a;--t2:#c79a2a" data-testid="dom-holdings">Holdings <span class="sub">· ${esc(m.region)} · ${m.held} held</span></div>
  <div class="keys"><span class="key"${act('back')}>Esc</span><span>back</span><span class="key">▲▼</span><span>choose</span><span class="key">◀▶</span><span>page ${m.page + 1}/${m.pages}</span></div>
  <div class="pnl glass" style="left:12px;top:72px;width:590px;height:420px" data-testid="dom-holdings-list"><div class="col" style="gap:5px">${rows}</div></div>
  <div class="pnl glass" style="left:614px;top:72px;width:334px;height:420px" data-testid="dom-holding-detail">${detail}
    <div class="xs mu" style="position:absolute;left:14px;bottom:12px">This week the Holdings ${m.weekly >= 0 ? 'pay' : 'cost'} about ₽${Math.abs(m.weekly).toLocaleString('en-US')}.</div></div>
  ${notePanel(m.notice)}
  `, 'background:#070a1c', 'vign grain');
}

// ---------- m13: the hijacked broadcast ----------

function smallTv(x: number, y: number, tint: number, boss: string): string {
  return `<div class="tv sm" style="left:${x}px;top:${y}px;width:170px;height:130px;padding:6px;border-radius:10px"><div class="scr" style="filter:hue-rotate(${tint}deg)"><div class="tvsig" style="left:-10px;top:-6px;width:170px;height:130px;opacity:.5"></div>${boss}</div></div>`;
}

/** `look` is the Boss's sprite (atlas or png), or null for the stand-in. */
export function broadcastView(m: BroadcastModel, look: string | null): string {
  const pic = (w: number, big: boolean): string => {
    const style = big ? 'position:absolute;left:50%;bottom:58px;transform:translateX(-50%);z-index:2' : 'position:absolute;left:50%;bottom:0;transform:translateX(-50%);opacity:.8';
    if (look && !look.endsWith('.png')) return `<div style="${style};display:flex;align-items:flex-end;justify-content:center">${tall(look, big ? 210 : 110)}</div>`;
    return `<img src="${look ? rxUrl(look) : img('v-nate')}" alt="${big ? 'The Boss on TV' : ''}" style="${style};width:${w}px;height:${big ? '210px' : 'auto'};object-fit:contain;image-rendering:pixelated">`;
  };
  const small = pic(187, false);
  const tag = m.team.replace(/^Team /, '').toUpperCase();
  const ticker = `<b>${esc(tag)}</b> ${m.ticker.map(esc).join(' · ')} · <b>${esc(tag)}</b>`;
  return stage(`
  <div class="layer" style="background:radial-gradient(70% 70% at 50% 50%,#2a0a20,#0a0410 75%)"></div>
  ${smallTv(24, 30, 0, small)}${smallTv(24, 176, 30, small)}${smallTv(24, 322, -20, small)}${smallTv(766, 30, 15, small)}${smallTv(766, 176, -35, small)}${smallTv(766, 322, 0, small)}
  <div class="tv" style="left:214px;top:28px;width:532px;height:404px" data-testid="dom-broadcast">
    <div class="scr">
      <div class="tvsig" style="left:110px;top:0;width:290px;height:320px;opacity:.35"></div>
      ${pic(420, true)}
      <div class="onair">${esc(m.onAir)}</div>
      <div class="lower3" data-testid="dom-broadcast-head"><small>${esc(m.small)}</small>${esc(m.head)}</div>
      <div class="ticker4"><span>${ticker}</span></div>
    </div>
  </div>
  <div class="say" style="left:250px;top:446px;width:460px;transform:rotate(-1deg)" data-testid="dom-broadcast-say"><b>THE BOSS, ON EVERY SCREEN</b>${esc(m.say)}</div>
  <div class="keys" style="top:auto;bottom:14px"><span class="key"${act('tkSkip')}>Enter</span><span>Skip</span></div>
  <div class="haze" style="--hz:#ff4d63;--hz2:#c9a0ff" aria-hidden="true"></div>
  <div class="grade" aria-hidden="true" style="--g1:#ff4d63;--g2:#c9a0ff"></div>
  <div class="edgeglow" aria-hidden="true" style="--eg:#ff4d63"></div>
  `, 'background:#0a0410', 'kl-red vign grain');
}
