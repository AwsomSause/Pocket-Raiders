// DOMINION slice D24 screens: the interview room (Rotom mockup a8) and the release page (a9), ported from the round-4
// copy (plans/evil-mode-rework/mockups-v4/index.html #k8, #k9: the Nova livery, sigil and villain light come from dominion.css and stage(), D26).
// Plain data in from core/dominion/policeScreens.ts; the scene's PoliceController keeps the typing box and the input.
// Every button is a tap target with a key: 1-5 the quick answers, T your own words, Esc stay silent, Enter back to HQ.

import './claude.css';
import type { QuestionModel, ReleaseModel } from '../../../../core/dominion/policeScreens';
import type { ReleaseLine } from '../../../../core/dominion/schema';
import { act, esc, mini, tall } from '../../kit';
import { rxUrl } from '../../assets';
import { skylineDuskUrl } from './paint';
import { stage, WHEEL_KEY } from './views';

const img = (f: string): string => rxUrl(`dominion/${f}.png`);
const sign = (n: number): string => (n > 0 ? `+${n}` : n < 0 ? `−${-n}` : '±0');
const BAND = { free: '#43cf78', bail: '#ffb238', held: '#ff5a4f' } as const;

/** Where the four case papers sit on the cork board (mockup a8), and the pin the red string ends on. */
const DOCS = [
  { left: 174, top: 104, w: 110, h: 78, rot: -3, pin: [262, 172] },
  { left: 294, top: 100, w: 108, h: 80, rot: 2, pin: [380, 170] },
  { left: 176, top: 192, w: 108, h: 70, rot: 1, pin: [262, 252] },
  { left: 296, top: 190, w: 104, h: 74, rot: -2, pin: [380, 252] },
] as const;

const ROOM_FX = `<div class="haze" style="--hz:#8fb8ff;--hz2:#ff6a6a" aria-hidden="true"></div>
  <div class="bokeh" aria-hidden="true" style="background:radial-gradient(circle 39px at 152px 79px,color-mix(in srgb,#ff6a6a 34%,transparent),color-mix(in srgb,#ff6a6a 18%,transparent) 70%,transparent 100%),radial-gradient(circle 33px at 214px 178px,color-mix(in srgb,#8fb8ff 34%,transparent),color-mix(in srgb,#8fb8ff 18%,transparent) 70%,transparent 100%),radial-gradient(circle 52px at 768px 193px,color-mix(in srgb,#ff6a6a 34%,transparent),color-mix(in srgb,#ff6a6a 18%,transparent) 70%,transparent 100%),radial-gradient(circle 30px at 198px 80px,color-mix(in srgb,#8fb8ff 34%,transparent),color-mix(in srgb,#8fb8ff 18%,transparent) 70%,transparent 100%),radial-gradient(circle 32px at 949px 398px,color-mix(in srgb,#ff6a6a 34%,transparent),color-mix(in srgb,#ff6a6a 18%,transparent) 70%,transparent 100%),radial-gradient(circle 48px at 300px 183px,color-mix(in srgb,#8fb8ff 34%,transparent),color-mix(in srgb,#8fb8ff 18%,transparent) 70%,transparent 100%),radial-gradient(circle 29px at 94px 180px,color-mix(in srgb,#ff6a6a 34%,transparent),color-mix(in srgb,#ff6a6a 18%,transparent) 70%,transparent 100%),radial-gradient(circle 27px at 287px 199px,color-mix(in srgb,#8fb8ff 34%,transparent),color-mix(in srgb,#8fb8ff 18%,transparent) 70%,transparent 100%)"></div>
  <div class="pts" aria-hidden="true"><div class="pt-siren" aria-hidden="true"></div></div>
  <div class="grade" aria-hidden="true" style="--g1:#8fb8ff;--g2:#ff6a6a"></div>
  <div class="focus" aria-hidden="true" style="left:504px;top:198px;--r:140px;--fc:170,205,255"></div>
  <div class="edgeglow" aria-hidden="true" style="--eg:#8fb8ff"></div>
  <div class="orn" aria-hidden="true"></div>
  <div class="rays turn finale" aria-hidden="true" style="left:350px;top:44px;width:308px;height:308px;--rc:rgba(170,205,255,.30)"></div><i class="glint fg" style="left:581px;top:114px;--g:20px"></i><i class="glint fg" style="left:406px;top:247px;--g:14px;animation-delay:-1.4s"></i>`;

const DAWN_FX = `<div class="haze" style="--hz:#ffb07a;--hz2:#b48cff" aria-hidden="true"></div>
  <div class="bokeh" aria-hidden="true" style="background:radial-gradient(circle 37px at 21px 93px,color-mix(in srgb,#b48cff 34%,transparent),color-mix(in srgb,#b48cff 18%,transparent) 70%,transparent 100%),radial-gradient(circle 42px at 869px 179px,color-mix(in srgb,#ffb07a 34%,transparent),color-mix(in srgb,#ffb07a 18%,transparent) 70%,transparent 100%),radial-gradient(circle 18px at 822px 117px,color-mix(in srgb,#b48cff 34%,transparent),color-mix(in srgb,#b48cff 18%,transparent) 70%,transparent 100%),radial-gradient(circle 32px at 115px 130px,color-mix(in srgb,#ffb07a 34%,transparent),color-mix(in srgb,#ffb07a 18%,transparent) 70%,transparent 100%),radial-gradient(circle 21px at 599px 384px,color-mix(in srgb,#b48cff 34%,transparent),color-mix(in srgb,#b48cff 18%,transparent) 70%,transparent 100%),radial-gradient(circle 24px at 162px 405px,color-mix(in srgb,#ffb07a 34%,transparent),color-mix(in srgb,#ffb07a 18%,transparent) 70%,transparent 100%),radial-gradient(circle 29px at 133px 426px,color-mix(in srgb,#b48cff 34%,transparent),color-mix(in srgb,#b48cff 18%,transparent) 70%,transparent 100%),radial-gradient(circle 27px at 75px 196px,color-mix(in srgb,#ffb07a 34%,transparent),color-mix(in srgb,#ffb07a 18%,transparent) 70%,transparent 100%)"></div>
  <div class="pts" aria-hidden="true"><i class="pt mote f" style="left:440px;top:282px;--dl:-0.4s;--t:4.6s;--c:#ffb07a"></i><i class="pt mote f" style="left:579px;top:127px;--dl:-1.9s;--t:2.6s;--c:#fff"></i><i class="pt mote f" style="left:510px;top:195px;--dl:-4.4s;--t:3.9s;--c:#ffb07a"></i><i class="pt mote f" style="left:634px;top:351px;--dl:-2.8s;--t:3.1s;--c:#b48cff"></i><i class="pt mote f" style="left:523px;top:327px;--dl:-1.5s;--t:6.0s;--c:#ffb07a"></i><i class="pt mote f" style="left:557px;top:262px;--dl:-0.6s;--t:4.0s;--c:#ffb07a"></i><i class="pt mote f" style="left:617px;top:161px;--dl:-0.3s;--t:2.8s;--c:#ffb07a"></i><i class="pt mote f" style="left:390px;top:143px;--dl:-4.7s;--t:3.0s;--c:#ffb07a"></i><i class="pt mote f" style="left:586px;top:303px;--dl:-2.2s;--t:5.9s;--c:#b48cff"></i><i class="pt mote f" style="left:542px;top:130px;--dl:-1.7s;--t:5.5s;--c:#ffb07a"></i></div>
  <div class="grade" aria-hidden="true" style="--g1:#ffb07a;--g2:#b48cff"></div>
  <div class="focus" aria-hidden="true" style="left:246px;top:384px;--r:160px;--fc:255,170,110"></div>
  <div class="edgeglow" aria-hidden="true" style="--eg:#ffb07a"></div><div class="beam sweep" aria-hidden="true" style="left:120px;z-index:1;--a0:-30deg;--a1:14deg;background:linear-gradient(0deg,transparent,#ffb07a 35%,transparent);opacity:.35"></div><div class="beam sweep b" aria-hidden="true" style="left:780px;z-index:1;--a0:22deg;--a1:-18deg;background:linear-gradient(0deg,transparent,#b48cff 35%,transparent);opacity:.3"></div>
  <div class="orn" aria-hidden="true"></div>
  <div class="rays turn finale" aria-hidden="true" style="left:70px;top:208px;width:352px;height:352px;--rc:rgba(255,170,110,.30)"></div><i class="glint fg" style="left:334px;top:288px;--g:20px"></i><i class="glint fg" style="left:134px;top:440px;--g:14px;animation-delay:-1.4s"></i>`;

export interface TypingState { on: boolean; text: string; busy: boolean; notice: string | null }

/** Mockup a8: the interview room. `monFile` gives a species' atlas (the CCTV still shows the Boss's lead Pokémon). */
export function questionView(m: QuestionModel, t: TypingState, monFile: (species: string) => string | null): string {
  const col = BAND[m.now];
  const lost = m.delta < 0 ? -m.delta : 0;
  const chunkTop = Math.min(100, m.belief + lost);
  const deltaY = Math.max(20, Math.min(370, 361 - ((m.belief + lost / 2) / 100) * 290 - 10));
  const docs = m.evidence.slice(0, DOCS.length).map((e, i) => {
    const d = DOCS[i]!;
    const box = `left:${d.left}px;top:${d.top}px;width:${d.w}px;height:${d.h}px;transform:rotate(${d.rot}deg)`;
    const ring = e.hit ? ';box-shadow:0 0 0 3px #e02a2a,0 0 16px rgba(224,42,42,.7)' : '';
    if (e.down) return `<div class="doc" data-testid="dom-q-doc" data-down="1" style="${box};background:#c9b88f;display:grid;place-items:center;font:700 30px var(--logo);color:#7a6440${ring}">?</div>`;
    if (e.kind === 'cctv') {
      const atlas = e.mon ? monFile(e.mon) : null;
      return `<div class="doc" data-testid="dom-q-doc" style="${box};padding:4px 6px${ring}"><div style="height:44px;background:linear-gradient(180deg,#3a4a3a,#1e2a1e);position:relative;overflow:hidden;display:flex;align-items:flex-end;justify-content:center;filter:sepia(.6) brightness(.85)">${atlas ? mini(atlas, 40) : ''}</div><div class="xs" style="margin-top:2px;font-size:9.5px;line-height:1.1;overflow:hidden;max-height:24px">${esc(e.label)} · ${esc(e.text)}</div></div>`;
    }
    return `<div class="doc" data-testid="dom-q-doc" style="${box};font-size:11px;line-height:1.2;overflow:hidden${ring}"><div class="dh" style="font-size:9.5px">${esc(e.label)}</div>${esc(e.text)}</div>`;
  }).join('');
  const hitAt = m.evidence.slice(0, DOCS.length).findIndex((e) => e.hit);
  const pin = hitAt >= 0 ? DOCS[hitAt]!.pin : null;
  const string = pin && m.tell
    ? `<div class="tell jolt" style="left:420px;top:232px;--tc:#d8402f;font-size:18px" data-testid="dom-q-tell">${esc(m.tell)}</div>
  <svg class="a" style="left:0;top:0;z-index:9;pointer-events:none" width="960" height="540" viewBox="0 0 960 540"><path d="M430 246 C 360 230, 300 ${pin[1] + 28}, ${pin[0]} ${pin[1]}" fill="none" stroke="#e02a2a" stroke-width="3"/><circle cx="${pin[0]}" cy="${pin[1]}" r="5" fill="#ffd23f" stroke="#2a1a0c" stroke-width="2"/></svg>`
    : '';
  const last = m.last
    ? `<div style="font-size:13.5px;line-height:1.25;max-height:34px;overflow:hidden" data-testid="dom-q-said">“${esc(m.last.said)}”</div>
    <div class="col" style="gap:2px;margin-top:5px;font-size:12.5px">
      <div class="row sp"><span>Consistent</span><b class="${m.last.consistent ? 'gn' : 'rd'}">${m.last.consistent ? 'yes' : 'no'}</b></div>
      <div class="row sp"><span>Fits the evidence</span><b class="${m.last.fits === 'yes' ? 'gn' : 'rd'}">${esc(m.last.fits)}</b></div>
      <div class="row sp"><span>Persuasive</span><span class="pips" style="--n:${m.last.persuasive};width:66px"></span></div>
      <div class="row sp"><span>Belief</span><span class="fx ${m.last.delta < 0 ? 'dn' : 'up'}" data-testid="dom-q-delta">${sign(m.last.delta)}</span></div>
    </div>`
    : `<div style="font-size:13.5px;line-height:1.3;opacity:.85">They're waiting. Answer with <b>1</b>-<b>5</b>, or press <b>T</b> and say it in your own words.</div>
    <div class="xs mu" style="margin-top:6px">Some evidence stays face down: you don't know everything they know.</div>`;
  const buttons = m.answers.map((a) => `<span class="bt" style="font-size:14px"${act('policeAnswer', a.kind)} data-testid="dom-q-${a.kind}"${a.cost ? ` title="₽${a.cost}"` : ''}>${esc(a.label)}<span class="kc" style="height:16px;font-size:10px;min-width:16px;padding:0 4px">${a.key}</span></span>`).join('');
  const box = t.busy
    ? `<span style="color:#ffb38a">Rotom is listening…</span>`
    : t.on
      ? `${esc(t.text)}<b class="blink" style="color:var(--gold)">▌</b>`
      : t.notice
        ? `<span class="rd">${esc(t.notice)}</span>`
        : `<span class="mu">T · type your own answer</span>`;
  const meter = `<div class="pnl" style="left:16px;top:76px;width:130px;height:400px;padding:10px" data-testid="dom-q-meter">
    <div class="caps" style="font-size:13px;font-weight:700;letter-spacing:.1em;text-align:center">Belief</div>
    <div class="num n3d" style="font-size:40px;text-align:center;line-height:1;color:${col}" data-testid="dom-q-belief">${m.belief}</div>
    <div style="position:relative;margin:8px auto 0;width:40px;height:290px;border-radius:8px;background:#0a0f20;box-shadow:0 0 0 3px var(--ink);overflow:hidden">
      <i class="a" style="left:0;right:0;bottom:0;height:${m.bands.bail}%;background:rgba(216,64,47,.35)"></i>
      <i class="a" style="left:0;right:0;bottom:${m.bands.bail}%;height:${m.bands.free - m.bands.bail}%;background:rgba(227,171,11,.28)"></i>
      <i class="a" style="left:0;right:0;bottom:${m.bands.free}%;height:${100 - m.bands.free}%;background:rgba(39,163,86,.3)"></i>
      <i class="a" style="left:6px;right:6px;bottom:0;height:${m.belief}%;border-radius:4px 4px 0 0;background:linear-gradient(180deg,${col}cc,${col});box-shadow:0 0 12px ${col};transition:height .4s"></i>
      ${lost ? `<i class="a" style="left:6px;right:6px;bottom:${m.belief}%;height:${chunkTop - m.belief}%;background:repeating-linear-gradient(135deg,rgba(255,90,79,.8) 0 5px,rgba(255,90,79,.35) 5px 10px)"></i>` : ''}
    </div>
    <b class="a gn" style="left:90px;top:${Math.round(361 - (m.bands.free / 100) * 290 + 4)}px;font-size:11.5px">FREE</b><b class="a y" style="left:90px;top:${Math.round(361 - (m.bands.bail / 100) * 290 + 4)}px;font-size:11.5px">BAIL</b><b class="a rd" style="left:90px;top:384px;font-size:11.5px">HELD</b>
    ${m.delta ? `<div class="a num jolt" style="left:86px;top:${Math.round(deltaY)}px;font-size:24px;color:${m.delta < 0 ? '#ff5a4f' : '#43cf78'};text-shadow:0 3px 0 #0a0a14,0 0 12px ${m.delta < 0 ? 'rgba(255,90,79,.8)' : 'rgba(67,207,120,.8)'}">${sign(m.delta)}</div>` : ''}
  </div>`;
  return stage(`<div class="a" style="left:0;top:0;width:960px;height:330px;z-index:1;background:repeating-linear-gradient(0deg,#5a6270 0 30px,#3e4450 30px 33px),#5a6270"></div>
  <div class="a" style="left:0;top:0;width:960px;height:330px;z-index:1;background:repeating-linear-gradient(90deg,transparent 0 62px,#3e4450 62px 65px);-webkit-mask:repeating-linear-gradient(0deg,#000 0 33px,transparent 33px 66px);mask:repeating-linear-gradient(0deg,#000 0 33px,transparent 33px 66px)"></div>
  <div class="a" style="left:0;top:33px;width:960px;height:330px;z-index:1;background:repeating-linear-gradient(90deg,transparent 0 62px,#3e4450 62px 65px);-webkit-mask:repeating-linear-gradient(0deg,transparent 0 33px,#000 33px 66px);mask:repeating-linear-gradient(0deg,transparent 0 33px,#000 33px 66px);background-position:31px 0"></div>
  <div class="a" style="left:0;top:330px;width:960px;height:210px;z-index:1;background:linear-gradient(180deg,#2a2e36,#16181e)"></div>
  <div class="a" style="left:640px;top:80px;width:300px;height:150px;z-index:2;background:linear-gradient(135deg,#1a2230,#0e131c);box-shadow:0 0 0 6px #8a93a6,0 0 0 9px var(--ink)">
    <img class="spr" src="${img('t-looker')}" alt="Looker" style="left:190px;top:30px;width:72px;height:142px;filter:brightness(.35) saturate(.4)"></div>
  <div class="a" style="left:640px;top:80px;width:300px;height:150px;z-index:3;background:linear-gradient(120deg,transparent 30%,rgba(255,255,255,.14) 38%,transparent 46%,transparent 60%,rgba(255,255,255,.08) 66%,transparent 72%)"></div>

  <div class="ttl" style="--t1:#2a4a8a;--t2:#4f7fd0" data-testid="dom-q-title">Questioning <span class="sub">· ${esc(m.station)}</span></div>
  <div class="keys">${WHEEL_KEY}<span class="key"${act('policeType')}>T</span><span>Your words</span><span class="key"${act('policeAnswer', 'silent')} data-testid="dom-q-silent">Esc</span><span>Stay silent</span></div>

  <div class="shd" style="left:410px;top:322px;width:180px;height:24px"></div>
  <img class="spr" src="${img(m.officer.sprite)}" alt="${esc(m.officer.name)}" style="left:432px;top:148px;width:120px;height:189px;z-index:4" data-testid="dom-q-officer">
  <img class="spr bob" src="${img(`p-${m.officer.mon}`)}" alt="" style="left:560px;top:262px;width:82px;height:72px;z-index:5">
  <div class="a" style="left:300px;top:318px;width:380px;height:26px;z-index:6;border-radius:4px;background:linear-gradient(180deg,#b9c2d6,#7a8496);box-shadow:0 0 0 3px var(--ink),0 10px 20px rgba(0,0,0,.6)"></div>
  <img class="spr" src="${img('g-tape')}" alt="Recorder" style="left:330px;top:290px;width:46px;height:40px;z-index:7">
  <div class="a row" style="left:380px;top:294px;z-index:7;gap:4px;font:700 12px var(--ui);color:#ff5a4f"><i class="blink" style="width:9px;height:9px;border-radius:50%;background:#ff3b3b;box-shadow:0 0 8px #ff3b3b"></i>REC</div>

  ${meter}

  <div class="a" style="left:162px;top:76px;width:250px;height:200px;z-index:2;background:linear-gradient(180deg,#8a6a45,#6b4d30);border-radius:6px;box-shadow:0 0 0 4px #4a3524,0 0 0 7px var(--ink)"></div>
  <div class="a caps" style="left:172px;top:82px;z-index:3;font:700 12px var(--ui);letter-spacing:.14em;color:#f3ecd8">What they know</div>
  ${docs || '<div class="a xs" style="left:176px;top:120px;width:220px;z-index:3;color:#f3ecd8">Nothing on file. Yet.</div>'}

  <div class="tbox" style="left:162px;top:356px;width:520px;height:94px;padding:16px 20px;font-size:17px" data-testid="dom-q-line"><span class="who">${esc(m.line.who)}</span>“${esc(m.line.text)}”</div>
  <div class="pnl" style="left:696px;top:300px;width:248px;height:160px;padding:8px 12px" data-testid="dom-q-judge">
    <div class="hd" style="font-size:14px"><span class="spark" style="--z:14px"></span>${m.last ? 'Your last answer' : m.suspect}<span class="r xs" data-testid="dom-q-turn">${m.turn}/${m.turns}</span></div>
    ${last}
  </div>
  ${string}
  <div class="aichip" style="left:706px;top:280px;z-index:33" data-testid="dom-q-chip"><i></i>${esc(m.chip)}</div>
  <div class="a flick" style="left:300px;top:0;width:360px;height:10px;z-index:7;border-radius:0 0 4px 4px;background:#eaf6ff;box-shadow:0 0 20px 6px rgba(200,235,255,.7),0 0 0 2px var(--ink)"></div>
  <div class="cone" style="left:230px;top:8px;width:500px;height:340px;z-index:2;--cc:rgba(200,235,255,.22)"></div>
  <i class="glint" style="left:842px;top:126px;--g:10px;--gc:#9fd6ff"></i>
  <div class="a" style="left:870px;top:240px;width:56px;height:56px;z-index:4;border-radius:50% 50% 46% 46%;background:radial-gradient(circle at 40% 35%,#fff2b0,#e3b955 50%,#9a6a10);box-shadow:0 0 0 3px var(--ink),0 0 14px rgba(255,210,63,.5);display:grid;place-items:center;font:800 13px var(--ui);color:#3a2a08;letter-spacing:.06em">${esc(m.station.slice(0, 1))}PD</div>

  <div class="a row" style="left:162px;top:464px;width:782px;z-index:8;gap:8px;flex-wrap:wrap">
    ${buttons}
    <div style="flex:1;min-width:200px;height:34px;border-radius:8px;background:#0b1020;border:3px solid ${t.on ? 'var(--gold)' : '#56679d'};box-shadow:0 0 0 3px var(--ink);display:flex;align-items:center;padding:0 10px;font-size:14px;color:#e8ecff;overflow:hidden;white-space:nowrap"${act('policeType')} data-testid="dom-q-type">${box}</div>
  </div>
  ${ROOM_FX}`, 'background:#1a1e24', 'd24 kl-police vign grain');
}

function lineRow(l: ReleaseLine, tag: string, monFile: (species: string) => string | null, compact: boolean): string {
  const pad = compact ? 'padding:3px 10px;font-size:12.5px' : '';
  let icon = '';
  if (l.face) icon = `<span class="face" style="width:30px;height:30px;display:inline-flex;align-items:flex-end;justify-content:center;overflow:hidden">${l.face.endsWith('.png') ? `<img src="${rxUrl(l.face)}" alt="">` : tall(l.face, 30)}</span>`;
  else if (l.mon) {
    const atlas = monFile(l.mon);
    icon = atlas ? `<span style="width:30px;height:30px;display:inline-flex;align-items:flex-end;justify-content:center">${mini(atlas, 30)}</span>` : '';
  }
  const hot = l.tag === 'informant' || l.tag === 'leave' ? ' pulse" style="box-shadow:0 0 0 2px #ff6a5c,0 0 14px rgba(255,90,79,.5);' : '" style="';
  return `<div class="al ${l.tone}${hot}${pad}" data-testid="dom-rel-${l.tag}">${icon}<span><span class="t">${esc(tag)}</span>${esc(l.text)}</span></div>`;
}

/** Mockup a9: the release, the stamp and "What it cost". `who` is the Boss's (or the member's) sprite: atlas or png. */
export function releaseView(m: ReleaseModel, who: { look: string | null; name: string }, tagOf: (l: ReleaseLine) => string, monFile: (species: string) => string | null): string {
  const compact = m.crew.length + m.hq.length > 7;
  const stamp = m.outcome === 'free' ? '#43cf78' : m.outcome === 'bail' ? '#ffd23f' : '#ff5a4f';
  const fig = who.look
    ? who.look.endsWith('.png')
      ? `<img class="spr" src="${rxUrl(who.look)}" alt="${esc(who.name)}" style="left:216px;top:316px;width:74px;height:144px;z-index:6">`
      : `<div class="a" style="left:190px;top:300px;width:126px;height:160px;z-index:6;display:flex;align-items:flex-end;justify-content:center" data-testid="dom-rel-who">${tall(who.look, 144)}</div>`
    : '';
  const group = (title: string, icon: string, rows: ReleaseLine[], first: boolean): string => rows.length
    ? `<div class="caps xs y row" style="letter-spacing:.14em;margin:${first ? '0' : '10px'} 0 5px;gap:5px"><img class="ic s" src="${img(icon)}" alt="">${title}</div>
    <div class="col" style="gap:${compact ? 3 : 5}px">${rows.map((l) => lineRow(l, tagOf(l), monFile, compact)).join('')}</div>`
    : '';
  return stage(`<div class="a" style="left:0;top:0;width:960px;height:540px;z-index:0;background:linear-gradient(180deg,#2a2050,#7a3c6e 48%,#e0745a 70%,#f5b071)"></div>
  <div class="a" style="left:560px;top:250px;width:420px;height:300px;z-index:0;border-radius:50%;background:radial-gradient(closest-side,rgba(255,230,170,.9),rgba(255,180,110,.4) 50%,transparent)"></div>
  <img class="a" src="${skylineDuskUrl()}" alt="" style="left:0;top:0;width:960px;height:540px;opacity:.9;image-rendering:pixelated">
  <div class="rain" style="z-index:2;opacity:.6"></div>
  <div class="a" style="left:40px;top:130px;width:420px;height:330px;z-index:3;background:linear-gradient(180deg,#5a6478,#3a4256);box-shadow:0 0 0 3px var(--ink)"></div>
  <div class="a" style="left:40px;top:118px;width:420px;height:18px;z-index:3;background:#2a3044;box-shadow:0 0 0 3px var(--ink)"></div>
  <div class="a" style="left:150px;top:150px;width:200px;height:34px;z-index:4;border-radius:4px;background:linear-gradient(180deg,#2a4a8a,#1a3060);box-shadow:0 0 0 3px var(--ink);display:grid;place-items:center;font:700 18px var(--ui);letter-spacing:.2em;color:#cfe0ff">POLICE</div>
  <div class="a" style="left:190px;top:280px;width:120px;height:180px;z-index:4;background:linear-gradient(180deg,#ffe6a8,#f2b56a);box-shadow:0 0 0 4px #2a3044,0 0 40px rgba(255,210,140,.6)"></div>
  <div class="a" style="left:70px;top:210px;width:80px;height:60px;z-index:4;background:#ffd98a;box-shadow:0 0 0 4px #2a3044,0 0 20px rgba(255,210,140,.4)"></div>
  <div class="a" style="left:350px;top:210px;width:80px;height:60px;z-index:4;background:#1a2030;box-shadow:0 0 0 4px #2a3044"></div>
  <div class="a" style="left:0;top:460px;width:960px;height:80px;z-index:3;background:linear-gradient(180deg,#2a2a36,#141420)"></div>
  <div class="shd" style="left:190px;top:452px;width:110px;height:18px;z-index:5"></div>
  <div class="a" style="left:150px;top:460px;width:200px;height:60px;z-index:4;background:linear-gradient(180deg,rgba(255,220,150,.45),transparent);clip-path:polygon(20% 0,80% 0,100% 100%,0 100%)"></div>
  <div class="ping" style="left:90px;top:490px;width:40px;height:12px;z-index:5;--pc:rgba(200,210,255,.7)"></div><div class="ping" style="left:380px;top:500px;width:36px;height:12px;z-index:5;--pc:rgba(200,210,255,.6);animation-delay:-1.2s"></div>
  ${fig}

  <div class="ttl" style="--t1:#b0569a;--t2:#ff9a62" data-testid="dom-rel-title">${esc(m.title)} <span class="sub">· ${esc(m.when)}</span></div>
  <div class="keys">${WHEEL_KEY}<span class="key"${act('policeDone')} data-testid="dom-rel-enter">Enter</span><span>Back to HQ</span></div>

  <div class="inked jolt" style="left:76px;top:66px;z-index:20;color:${stamp};font-size:34px;transform:rotate(-6deg);mix-blend-mode:normal;background:rgba(30,20,40,.6);box-shadow:0 0 0 4px rgba(30,20,40,.6),0 0 0 7px ${stamp},0 0 26px ${stamp}99" data-testid="dom-rel-stamp">${esc(m.stamp)}</div>

  <div class="pnl" style="left:488px;top:76px;width:456px;height:448px;padding:12px 16px;overflow:hidden" data-testid="dom-rel-cost">
    <div class="hd" style="font-size:16px"><img class="ic" src="${img('g-policekey')}" alt="">What it cost<span class="r" data-testid="dom-rel-belief">Belief ended at ${m.belief}</span></div>
    <div class="row" style="gap:8px;font-size:13px;margin-bottom:10px"><span class="mu">Weight</span><div style="flex:1;height:10px;border-radius:5px;background:linear-gradient(90deg,#43cf78,#ffb238,#ff5a4f);box-shadow:0 0 0 2px var(--ink);position:relative"><i class="a" style="left:calc(${m.weightPct}% - ${m.weightPct * 0.06}px);top:-5px;width:6px;height:20px;background:#fff;border-radius:2px;box-shadow:0 0 0 2px var(--ink)"></i></div><span class="mu" data-testid="dom-rel-weight">×${m.weight}</span></div>
    ${group(m.boss ? 'The crew' : `The crew · ${m.name}`, 'g-member-card', m.crew, true)}
    ${group('The HQ', 'g-card-key', m.hq, !m.crew.length)}
    <div class="row xs mu" style="margin-top:8px;gap:6px" data-testid="dom-rel-cell"><img class="ic s" src="${img('g-calendar')}" alt="">${esc(m.cell)}</div>
  </div>
  <div class="bub" style="left:40px;top:216px;width:230px;z-index:20;--tx:150px;font-size:14px" data-testid="dom-rel-parting">${esc(m.parting)}</div>
  ${DAWN_FX}`, 'background:#2a2050', 'd24 kl-dawn vign grain');
}
