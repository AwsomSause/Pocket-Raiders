// DOMINION D11 screens, ported from the round-4 mockups (plans/evil-mode-rework/mockups-v4/index.html):
// s9 (the night screen with the Hero's file pinned up; the four cards are the Hero and the region's Legendaries until
// D14 brings the takeover paths) and m11 "The Hero shows up" (the cracked split screen with three choices).
// Plain data in from core/dominion/heroScreens.ts; DominionScene keeps the input.

import './dominion.css';
import './hero.css';
import type { HeroModel, InterruptModel } from '../../../../core/dominion/heroScreens';
import { act, esc, mini, tall } from '../../kit';
import { rxUrl } from '../../assets';
import { skylineUrl } from './paint';
import { stage } from './views';

const img = (f: string): string => rxUrl(`dominion/${f}.png`);

/** Pokémon atlas files the scene resolved (species id -> file), for Legendaries and allies. */
export type MonFiles = Record<string, string | null>;
const monPic = (files: MonFiles, id: string | null, size: number): string => (id && files[id] ? mini(files[id]!, size) : '');

// ---------- s9: the Hero's file ----------

export function heroView(m: HeroModel, files: MonFiles, notice: string | null): string {
  const h = m.hero;
  const cards = [
    `<div class="path${m.hero.threat >= 25 ? ' goal' : ''}" style="--c:#b28cff;left:16px;top:72px;width:141px;height:250px" data-testid="dom-hero-card">
      <div class="nm"><img class="ic s" src="${img('g-comet-shard')}" alt="">HERO</div>
      <div class="dial" style="--v:${m.heroCard.dial};--c:#b28cff"><b>${m.heroCard.dial}</b></div>
      <ul>${m.heroCard.rows.map((r) => `<li${r.ok ? ' class="ok"' : ''}>${esc(r.text)}</li>`).join('')}</ul>
      <span class="pill v" style="margin-top:auto">${esc(h.word)}</span>
    </div>`,
    ...m.legends.slice(0, 3).map((l, i) => `<div class="path" style="--c:${l.colour};left:${167 + i * 151}px;top:72px;width:${i === 2 ? 147 : 141}px;height:250px${l.out ? ';box-shadow:0 0 0 3px var(--ink),0 0 0 6px #ffd23f,0 0 30px rgba(255,210,63,.45)' : ''}" data-testid="dom-legend-${l.id}">
      <div class="nm">${monPic(files, l.id, 22)}${esc(l.name)}</div>
      <div class="dial" style="--v:${l.dial};--c:${l.colour}"><b>${l.dial}</b></div>
      <ul>${l.rows.map((r) => `<li${r.ok ? ' class="ok"' : ''}>${esc(r.text)}</li>`).join('')}</ul>
      ${l.out ? `<span class="pill ${l.canFight ? 'y' : 'k'}" style="margin-top:auto"${l.canFight ? act('legend', l.id) : ''} data-testid="dom-legend-fight-${l.id}">${l.canFight ? 'FIGHT IT' : 'OUT THERE'}</span>` : ''}
    </div>`),
  ].join('');
  const out = m.legends.find((l) => l.out);
  const sky = out ? `<div class="a cross" style="left:420px;top:4px;width:62px;height:50px;z-index:31;filter:brightness(.25) sepia(1) hue-rotate(-30deg) saturate(4) drop-shadow(0 0 8px #ff7a1c);--x:260px">${monPic(files, out.id, 56)}</div>` : '';
  const alerts = m.alerts.map((a) => {
    const pic = a.species ? `<span class="px" style="width:40px;height:34px;display:inline-flex;align-items:center;justify-content:center">${monPic(files, a.species, 34)}</span>` : a.look ? `<img class="px" src="${rxUrl(a.look)}" alt="" style="width:30px;height:34px;object-fit:cover;object-position:top">` : '';
    const bg = a.tone === 'y' ? 'rgba(255,204,51,.2)' : a.tone === 'v' ? 'rgba(178,140,255,.22)' : 'rgba(255,90,79,.22)';
    return `<div class="al ${a.tone === 'v' ? 'b' : a.tone}" style="background:linear-gradient(90deg,${bg},rgba(20,26,48,.9));padding:6px 10px">${pic}<span><span class="t">${esc(a.title)}</span>${esc(a.text)}</span></div>`;
  }).join('');
  const meet = m.meet
    ? `<div class="a col" style="left:16px;top:330px;width:600px;gap:6px;z-index:8" data-testid="dom-meet">
        <div class="al v" style="background:linear-gradient(90deg,rgba(178,140,255,.28),rgba(20,26,48,.94));padding:7px 10px"><img class="px" src="${rxUrl(h.look)}" alt="" style="width:30px;height:34px;object-fit:cover;object-position:top"><span><span class="t">${esc(m.meet.title.toUpperCase())}${m.meet.night ? ' · TONIGHT' : ''}</span>${esc(m.meet.text)}</span></div>
        <div style="display:grid;grid-template-columns:repeat(${m.meet.choices.length},1fr);gap:10px">${m.meet.choices.map((c, i) => `<div class="ch${i === 0 ? ' on' : ''}${m.meet!.open ? '' : ' dim'}" style="min-height:62px"${m.meet!.open ? act('meet', i) : ''} data-testid="dom-meet-${i}"><b>${esc(c.label)}</b><span class="xs" style="display:block;font-weight:500">${esc(c.note)}</span><span class="kc" style="position:absolute;right:10px;top:8px">${i + 1}</span></div>`).join('')}</div>
      </div>`
    : `<div class="a rib" style="left:16px;top:330px;width:600px;font-size:15px;padding:6px 40px 6px 16px;white-space:nowrap">${esc(m.rib)}</div>
      <div class="a col" style="left:16px;top:372px;width:600px;gap:8px;z-index:6" data-testid="dom-hero-alerts">${alerts || `<div class="al b" style="padding:6px 10px"><span><span class="t">QUIET</span>Nothing has come for you yet.</span></div>`}</div>`;
  const cta = m.meet ? '' : `<div class="cta shine" style="left:16px;top:478px;width:600px;height:48px;font-size:20px"${act(m.cta.act === 'legend' ? 'legend' : 'back', m.cta.id ?? '')} data-testid="dom-hero-cta">${esc(m.cta.label)} <span class="kc">${m.cta.act === 'legend' ? 'F' : 'Esc'}</span></div>`;
  const allies = h.allies.length
    ? h.allies.slice(0, 4).map((a) => (a.look ? `<img class="px" src="${rxUrl(a.look)}" alt="${esc(a.name)}" title="${esc(a.name)}" style="width:26px;height:36px;object-fit:contain">` : `<span title="${esc(a.name)}" style="display:inline-flex;width:30px;height:30px;align-items:center;justify-content:center">${monPic(files, a.species, 28)}</span>`)).join('')
    : '<span style="color:#7a6440">none yet</span>';
  const pills = m.choose
    ? `<span class="pill k" style="font-size:12.5px;cursor:pointer"${act('after', 'leave')} data-testid="dom-stand-leave">Leave them in their shame <span class="kc">L</span></span><span class="pill v" style="font-size:12.5px;cursor:pointer"${act('after', 'recruit')} data-testid="dom-stand-recruit">Try to recruit them <span class="kc">R</span></span>`
    : m.outcome
      ? `<span class="pill g" style="font-size:12.5px" data-testid="dom-stand-outcome">${esc(m.outcome)}</span>`
      : '<span class="pill k" style="font-size:12.5px;opacity:.6">Leave them in their shame</span><span class="pill v" style="font-size:12.5px;opacity:.6">Try to recruit them</span>';
  const badges = Array.from({ length: 8 }, (_, i) => `<i class="badge${i < h.badges ? '' : ' off'}"></i>`).join('');
  return stage(`
  <div class="layer" style="background:linear-gradient(180deg,#060818,#121a3e 55%,#1e1640)"></div>
  <div class="stars twinkle" style="height:260px"></div>
  <div class="moon" style="left:640px;top:8px;width:44px;height:44px;opacity:.9;z-index:30"></div>
  ${sky}
  <div class="beam sweep" style="left:90px;--a0:-22deg;--a1:16deg;opacity:.5;z-index:1"></div>
  <div class="layer" style="background:url(${skylineUrl()}) bottom/100% auto no-repeat;opacity:.75"></div>
  <div class="layer" style="background:linear-gradient(180deg,transparent 40%,rgba(6,8,22,.85))"></div>
  <div class="ttl" style="--t1:#3a2a8a;--t2:#7b3fa0" data-testid="dom-hero">The Hero <span class="sub">· ${esc(m.region)}</span></div>
  <div class="keys"><span class="key"${act('back')}>H</span><span>close</span><span class="key">1-3</span><span>answer</span><span class="key">F</span><span>fight</span><span class="key">${esc(m.top.phaseWord)}</span><span>${esc(m.top.day.replace('DAY ', 'Day '))}</span></div>
  ${cards}
  ${meet}
  ${cta}
  <div class="a" style="left:632px;top:70px;width:312px;height:458px;z-index:7;transform:rotate(1.2deg);background:linear-gradient(180deg,#f3e8cb,#e6d6ae);border-radius:4px;box-shadow:0 0 0 3px #2a1c0c,0 18px 34px rgba(0,0,0,.6);color:#3a2a18;padding:14px 16px" data-testid="dom-hero-file">
    <i style="position:absolute;left:146px;top:-8px;width:20px;height:20px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#ff9a8f,#c62a2a 60%,#5a0e0e);box-shadow:0 2px 0 #2a0808"></i>
    <div style="text-align:center;font:700 26px var(--regal);letter-spacing:.12em;color:#7a1414;border-bottom:3px double #7a1414;padding-bottom:4px">THE HERO</div>
    <div class="row" style="gap:12px;margin-top:10px;align-items:flex-start">
      <div style="width:104px;height:150px;flex:none;border-radius:6px;background:radial-gradient(circle at 50% 40%,#fff6df,#d8c597);box-shadow:inset 0 0 0 3px #3a2a18;position:relative;overflow:hidden">
        <img class="spr" src="${rxUrl(h.look)}" alt="${esc(h.name)}" style="left:2px;top:4px;width:100px;height:142px;object-fit:contain"></div>
      <div class="col" style="gap:4px;font-size:15px;min-width:0">
        <b style="font-size:24px;color:#2a1c0c" data-testid="dom-hero-name">${esc(h.name)}</b>
        <span>Badges <b data-testid="dom-hero-badges">${h.badges} of 8</b></span>
        <span style="display:flex;gap:3px">${badges}</span>
        <span>Team Lv <b>${esc(h.level)}</b></span>
        <span class="row" style="gap:4px;flex-wrap:wrap">Allies ${allies}</span>
        <span class="xs" style="color:#5d4a30">${esc(h.archetype)}${h.at ? ` · in ${esc(h.at)}` : ''}</span>
      </div>
    </div>
    <div class="seal" style="left:84px;top:172px;--s:44px;transform:rotate(14deg);background:radial-gradient(circle at 38% 32%,#ff7a6a,#c62a2a 45%,#6a1010 75%);box-shadow:0 0 0 3px #7a1414,0 4px 8px rgba(0,0,0,.45);color:#ffe0dc">!</div>
    <div class="row sp" style="margin-top:10px;font-size:16px"><span>Hero Threat</span><b style="color:#c0392b" data-testid="dom-hero-threat">${h.threat} · ${esc(h.word)}</b></div>
    <div class="mt b" style="--v:${h.threat};margin-top:4px"></div>
    <div style="margin-top:10px;font-size:14.5px;line-height:1.35;border-left:4px solid #c0392b;padding-left:8px" data-testid="dom-hero-week"><b>This week:</b> ${esc(h.week)}</div>
    <div style="margin-top:8px;font-size:13px;line-height:1.3;color:#5d4a30;font-style:italic">“${esc(h.taunt)}”</div>
    <div style="margin-top:8px;font-size:14px;color:#5d4a30">After the final battle${m.choose ? '' : ` at ${esc(h.place)}`}:</div>
    <div class="row" style="gap:6px;margin-top:4px;flex-wrap:wrap">${pills}</div>
  </div>
  <div class="layer pulse" style="top:440px;z-index:1;background:radial-gradient(500px 120px at 316px 540px,rgba(255,60,60,.45),transparent 70%);pointer-events:none"></div>
  <div class="cone" style="left:470px;top:60px;width:240px;height:480px;z-index:1;--cc:rgba(220,220,255,.18)"></div>
  <div class="haze" style="--hz:#ff7a6a;--hz2:#cfd8ff" aria-hidden="true"></div>
  <div class="grade" aria-hidden="true" style="--g1:#ff7a6a;--g2:#cfd8ff"></div>
  <div class="edgeglow" aria-hidden="true" style="--eg:#ff7a6a"></div>
  <div class="orn" aria-hidden="true"></div>
  ${notice ? `<div class="a pnl" style="left:180px;top:200px;width:600px;padding:14px 18px;z-index:40;font-size:16px;line-height:1.35"${act('dismiss')} data-testid="dom-notice">${esc(notice)} <span class="kc">Enter</span></div>` : ''}
  `, 'background:#070a1c', 'kl-red vign grain');
}

// ---------- m11: the Hero shows up ----------

export function interruptView(m: InterruptModel, member: { look: string; atlas: boolean }, lead: string | null, at: number, notice: string | null): string {
  const grunt = member.atlas
    ? `<div class="a" style="left:150px;top:150px;width:126px;height:214px;z-index:6;display:flex;align-items:flex-end;justify-content:center">${tall(member.look, 214)}</div>`
    : `<img class="spr" src="${rxUrl(member.look)}" alt="${esc(m.member)}" style="left:150px;top:150px;width:126px;height:214px;z-index:6">`;
  const mon = lead ? `<div class="a" style="left:270px;top:290px;width:80px;height:82px;z-index:6;display:flex;align-items:flex-end;justify-content:center">${mini(lead, 80)}</div>` : '';
  const choices = [
    { b: 'Battle them', s: `${m.member} vs ${m.hero} · win to finish the job`, on: true },
    { b: 'Run', s: `Safe · lose the job · Heat +${m.runHeat}`, on: true },
    { b: 'Smoke Ball', s: m.smoke ? `${m.smokeChance}% clean escape with the take · ${m.smoke} left` : 'You have no Smoke Ball', on: m.smoke > 0 },
  ];
  return stage(`
  <div class="layer" style="background:linear-gradient(100deg,#2a0610 0 49.6%,#12071a 49.6% 50.4%,#0e1a3a 50.4%)"></div>
  <div class="cone" style="left:600px;top:0;width:280px;height:470px;--cc:rgba(255,255,255,.4)"></div>
  <div class="cone" style="left:80px;top:0;width:260px;height:470px;--cc:rgba(255,77,99,.35)"></div>
  ${grunt}
  ${mon}
  <img class="spr" src="${rxUrl(m.look)}" alt="${esc(m.hero)}, the Hero" style="left:660px;top:120px;width:150px;height:244px;z-index:6;transform:scaleX(-1);object-fit:contain">
  <div class="shd" style="left:120px;top:360px;width:250px;height:26px"></div><div class="shd" style="left:620px;top:356px;width:230px;height:26px"></div>
  <svg class="crack" viewBox="0 0 960 540" aria-hidden="true"><g fill="none" stroke="#fff" stroke-width="2.5" opacity=".75"><path d="M480 270 L380 120 L350 0"/><path d="M480 270 L620 90 L700 0"/><path d="M480 270 L700 300 L960 280"/><path d="M480 270 L560 460 L540 540"/><path d="M480 270 L300 360 L0 420"/><path d="M380 120 L300 160"/><path d="M620 90 L700 130"/><path d="M700 300 L760 380"/><path d="M300 360 L280 460"/></g><g fill="none" stroke="#ff4d63" stroke-width="1" opacity=".6"><path d="M480 270 L380 120 L350 0"/><path d="M480 270 L700 300 L960 280"/></g></svg>
  <div class="vs4" style="left:430px;top:170px">VS</div>
  <div class="hero4" style="left:560px;top:28px;width:380px;text-align:right" data-testid="dom-interrupt"><small>A HERO APPEARS</small>${esc(m.hero.toUpperCase())}</div>
  <div class="a" style="left:20px;top:36px;width:420px;font:600 15px var(--ui);color:#ffd9de;z-index:19;letter-spacing:.04em">${esc(m.job.toUpperCase())} · INTERRUPTED</div>
  <div class="pnl" style="left:600px;top:372px;width:340px;height:52px;padding:8px 12px;z-index:19">
    <div class="row" style="gap:10px"><span class="xs caps" style="color:#ff9aa8">Threat</span><div class="mt" style="--v:${m.threat};--c:#ff4d63;flex:1"></div><b style="font:700 22px var(--num);color:#ff4d63">${m.threat}</b></div>
  </div>
  <div class="a" style="left:20px;right:20px;bottom:16px;display:grid;grid-template-columns:repeat(3,1fr);gap:14px;z-index:20">
    ${choices.map((c, i) => `<div class="ch${i === at ? ' on' : ''}${c.on ? '' : ' dim'}"${act('interrupt', i)} data-testid="dom-interrupt-${i}"><b>${esc(c.b)}</b><span class="xs${i === at ? '' : ' mu'}" style="display:block;font-weight:500">${esc(c.s)}</span><span class="kc" style="position:absolute;right:12px;top:12px">${i + 1}</span></div>`).join('')}
  </div>
  <div class="haze" aria-hidden="true" style="--hz:#ffffff;--hz2:#ff4d63"></div><div class="grade" aria-hidden="true" style="--g1:#ffffff;--g2:#ff4d63"></div><div class="edgeglow" aria-hidden="true" style="--eg:#ffffff"></div><div class="orn" aria-hidden="true"></div>
  ${notice ? `<div class="a pnl" style="left:240px;top:420px;width:480px;padding:10px 14px;z-index:40;font-size:15px"${act('dismiss')} data-testid="dom-notice">${esc(notice)}</div>` : ''}
  `, 'background:#0a0610', 'kl-red vign grain');
}
