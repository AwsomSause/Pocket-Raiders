// DOMINION slice D19 screen: the personality card on the Crew File (Rotom mockup a3, ported from
// plans/claude-api/mockups/index.html #k3: the manila dossier under a desk lamp, the photo with the member's first
// Pokémon, the trait pills ringed in red pen, the "What his traits do" slip, the memory of this run, and the "How they
// talk" panel with the offline line and the Rotom line), with the round-3 passes (mockups-v3). Plain data in from core/dominion/crewScreens.ts personaModel.

import type { PersonaModel } from '../../../../core/dominion/crewScreens';
import { act, esc, mini, tall } from '../../kit';
import { rxUrl } from '../../assets';
import { stage } from './views';

const img = (f: string): string => rxUrl(`dominion/${f}.png`);

/** Round-3 mockup passes on k3 (plans/evil-mode-rework/mockups-v3, PR #1494): haze, bokeh, motes, grade, the lamp's
 * focal spotlight, edge glow, gold frame, the finale sunburst and glints. Decoration only: no clicks (the CSS sets
 * pointer-events:none) and every animation stops under reduced motion. */
const OVERLAYS = `<div class="haze" style="--hz:#ffe0a0;--hz2:#ffb38a" aria-hidden="true"></div>
  <div class="bokeh" aria-hidden="true" style="background:radial-gradient(circle 39px at 182px 197px,color-mix(in srgb,#ffb38a 34%,transparent),color-mix(in srgb,#ffb38a 18%,transparent) 70%,transparent 100%),radial-gradient(circle 21px at 888px 178px,color-mix(in srgb,#ffe0a0 34%,transparent),color-mix(in srgb,#ffe0a0 18%,transparent) 70%,transparent 100%),radial-gradient(circle 28px at 855px 122px,color-mix(in srgb,#ffb38a 34%,transparent),color-mix(in srgb,#ffb38a 18%,transparent) 70%,transparent 100%),radial-gradient(circle 35px at 614px 462px,color-mix(in srgb,#ffe0a0 34%,transparent),color-mix(in srgb,#ffe0a0 18%,transparent) 70%,transparent 100%),radial-gradient(circle 28px at 834px 193px,color-mix(in srgb,#ffb38a 34%,transparent),color-mix(in srgb,#ffb38a 18%,transparent) 70%,transparent 100%),radial-gradient(circle 38px at 836px 130px,color-mix(in srgb,#ffe0a0 34%,transparent),color-mix(in srgb,#ffe0a0 18%,transparent) 70%,transparent 100%),radial-gradient(circle 45px at 208px 141px,color-mix(in srgb,#ffb38a 34%,transparent),color-mix(in srgb,#ffb38a 18%,transparent) 70%,transparent 100%),radial-gradient(circle 43px at 27px 186px,color-mix(in srgb,#ffe0a0 34%,transparent),color-mix(in srgb,#ffe0a0 18%,transparent) 70%,transparent 100%)"></div>
  <div class="pts" aria-hidden="true"><i class="pt mote f" style="left:65px;top:232px;--dl:-0.8s;--t:4.1s;--c:#ffe0a0"></i><i class="pt mote f" style="left:97px;top:315px;--dl:-3.9s;--t:5.6s;--c:#fff"></i><i class="pt mote f" style="left:278px;top:371px;--dl:-5.4s;--t:5.0s;--c:#ffe0a0"></i><i class="pt mote f" style="left:638px;top:277px;--dl:-4.6s;--t:4.7s;--c:#ffe0a0"></i><i class="pt mote f" style="left:93px;top:236px;--dl:-2.2s;--t:4.4s;--c:#fff"></i><i class="pt mote f" style="left:514px;top:107px;--dl:-3.6s;--t:3.8s;--c:#fff"></i><i class="pt mote f" style="left:442px;top:272px;--dl:-2.7s;--t:3.3s;--c:#ffe0a0"></i><i class="pt mote f" style="left:510px;top:234px;--dl:-3.4s;--t:3.1s;--c:#ffb38a"></i><i class="pt mote f" style="left:265px;top:288px;--dl:-5.4s;--t:3.6s;--c:#fff"></i><i class="pt mote f" style="left:216px;top:133px;--dl:-5.6s;--t:5.4s;--c:#fff"></i></div>
  <div class="grade" aria-hidden="true" style="--g1:#ffe0a0;--g2:#ffb38a"></div>
  <div class="focus" aria-hidden="true" style="left:144px;top:216px;--r:150px;--fc:255,205,140"></div>
  <div class="edgeglow" aria-hidden="true" style="--eg:#ffe0a0"></div>
  <div class="orn" aria-hidden="true"></div>
  <div class="rays turn finale" aria-hidden="true" style="left:-21px;top:51px;width:330px;height:330px;--rc:rgba(255,205,140,.30)"></div><i class="glint fg" style="left:226px;top:126px;--g:20px"></i><i class="glint fg" style="left:39px;top:268px;--g:14px;animation-delay:-1.4s"></i>`;

function photo(look: string, name: string): string {
  return look.endsWith('.png')
    ? `<img class="spr" src="${rxUrl(look)}" alt="${esc(name)}" style="left:30px;top:24px;width:140px;height:186px">`
    : `<div class="a" style="left:10px;top:14px;width:180px;height:196px;display:flex;align-items:flex-end;justify-content:center;overflow:hidden">${tall(look, 190)}</div>`;
}

function face(look: string): string {
  return look.endsWith('.png')
    ? `<span class="face"><img src="${rxUrl(look)}" alt=""></span>`
    : `<span class="face" style="display:inline-flex;align-items:flex-end;justify-content:center;overflow:hidden">${tall(look, 40)}</span>`;
}

export function personaView(p: PersonaModel, monFile: (species: string) => string | null): string {
  const monAtlas = p.mon ? monFile(p.mon) : null;
  const pills = p.traits.map((t) => `<span class="pill ${t.tone} shine" style="font-size:18px;padding:5px 14px 5px 8px" data-testid="dom-persona-trait"><img class="ic s" src="${img(t.icon)}" alt="">${esc(t.name.toUpperCase())}</span>`).join('');
  const effects = p.effects.map((e) => `<span><b>${esc(e.trait)}</b> · ${esc(e.text)}${e.needs ? ` <i style="opacity:.7">(from ${esc(e.needs)})</i>` : ''}</span>`).join('');
  const memory = p.memory.length
    ? p.memory.map((x) => `<span>Day ${x.day} · ${esc(x.line)}</span>`).join('')
    : '<span style="opacity:.7">Nothing yet. This run is only starting.</span>';
  const rotom = p.rotom
    ? `<div class="typing" style="background:linear-gradient(180deg,#3a2216,#2a1a14);border-radius:8px;padding:8px 10px;font-size:15px;line-height:1.35;box-shadow:0 0 0 2px #ff9a62,0 0 18px var(--ai-glow)" data-testid="dom-persona-rotom">“${esc(p.rotom.text)}”</div>
        <span class="xs" style="color:var(--ai)">${esc(p.rotom.meta)}</span>`
    : `<div style="background:linear-gradient(180deg,#2a2220,#1e1a1a);border-radius:8px;padding:8px 10px;font-size:14px;line-height:1.35;box-shadow:0 0 0 2px #6a4a3a;color:#c9b8a8" data-testid="dom-persona-rotom">${esc(p.rotomOff)}</div>`;
  const others = p.others.map((o) => `${face(o.look)}<span class="xs">${esc(o.name)}<br><b class="vi">${esc(o.traits)}</b></span>`).join('');
  return stage(`<div class="layer" style="background:repeating-linear-gradient(90deg,#2a2036 0 3px,#30253d 3px 6px)"></div>
  <div class="layer" style="background:radial-gradient(520px 360px at 330px 290px,rgba(255,214,140,.22),transparent 70%)"></div>
  <div class="pool flick" style="left:120px;top:120px;width:460px;height:380px;z-index:6;--pc:rgba(255,220,150,.22)"></div>
  <div class="ttl" style="--t1:#5b34b0;--t2:#a678ff">Crew File <span class="sub">· ${esc(p.name)}</span></div>
  <div class="keys"><span class="key"${act('flip', -1)}>Q</span><span class="key"${act('flip', 1)}>E</span><span>Next member</span><span class="key"${act('persona')} style="margin-left:8px">Esc</span><span>File</span></div>

  <div class="a" style="left:28px;top:76px;width:600px;height:448px;z-index:3;border-radius:6px 16px 8px 8px;background:linear-gradient(180deg,var(--manila),#d9c18a);box-shadow:0 0 0 3px #3a2a10,0 18px 34px rgba(0,0,0,.55)"></div>
  <div class="a" style="left:40px;top:58px;width:180px;height:30px;z-index:4;border-radius:10px 10px 0 0;background:var(--manila);box-shadow:0 0 0 3px #3a2a10;font:700 14px var(--ui);letter-spacing:.14em;color:#5a4420;padding:6px 14px">PERSONNEL · ${esc(p.file)}</div>

  <div class="a" style="left:48px;top:96px;width:200px;height:260px;z-index:5;background:linear-gradient(180deg,#5a5f7a,#2a2f45);border-radius:6px;box-shadow:0 0 0 3px #3a2a10,inset 0 0 0 3px #f3ecd8;transform:rotate(-2deg);overflow:hidden" data-testid="dom-persona-photo">
    ${photo(p.look, p.name)}
    ${monAtlas ? `<div class="a bob" style="left:124px;top:160px;width:70px;height:70px;display:flex;align-items:flex-end;justify-content:center">${mini(monAtlas, 64)}</div>` : ''}<i class="a" style="inset:0;background:linear-gradient(125deg,transparent 40%,rgba(255,255,255,.22) 48%,transparent 56%)"></i>
    <div class="a" style="left:0;right:0;bottom:0;padding:5px;text-align:center;background:#f3ecd8;font:700 16px var(--ui);color:#2a2014" data-testid="dom-persona-name">${esc(p.name.toUpperCase())} · ${esc(p.rank)}</div>
  </div>
  <span class="tape" style="left:78px;top:88px;transform:rotate(-14deg)"></span>
  <div class="inked" style="left:430px;top:300px;color:#7b3fa0;transform:rotate(-10deg);font-size:20px">${esc(p.stamp)}</div>
  <div class="a" style="left:584px;top:66px;width:16px;height:56px;z-index:7;border:4px solid #b9c2d6;border-radius:9px;box-shadow:0 0 0 1px #3a3f50"></div>
  <div class="doc" style="left:388px;top:368px;width:222px;transform:rotate(1.5deg)" data-testid="dom-persona-effects"><div class="dh"><img class="ic s" src="${img('g-fame-checker')}" alt="">What ${esc(p.his)} traits do</div>
    <div class="col" style="gap:2px;font-size:12.5px">${effects}</div></div>

  <div class="a col" style="left:270px;top:100px;width:340px;z-index:5;gap:10px;color:#3a2e1c" data-testid="dom-persona-card">
    <div class="row" style="gap:10px;flex-wrap:wrap;position:relative;padding:4px 0">${pills}
      <i class="a" style="left:-8px;top:-6px;width:248px;height:46px;border:3px solid #d8402f;border-radius:50%;transform:rotate(-3deg);opacity:.75"></i></div>
    <div class="col" style="gap:6px;font-size:16px;line-height:1.3">
      <div><span class="caps xs" style="color:#7a6440;letter-spacing:.14em">Speech quirk</span><br><b>${esc(p.quirk)}</b></div>
      <div><span class="caps xs" style="color:#7a6440;letter-spacing:.14em">Wants</span><br><b>${esc(p.want)}</b></div>
      <div><span class="caps xs" style="color:#7a6440;letter-spacing:.14em">Fears</span><br><b>${esc(p.fear)}</b></div>
      <div><span class="caps xs" style="color:#7a6440;letter-spacing:.14em">Home town</span><br><b data-testid="dom-persona-home">${esc(p.home)}</b></div>
    </div>
  </div>
  <div class="a" style="left:48px;top:372px;width:336px;z-index:5;color:#3a2e1c">
    <div class="caps xs" style="letter-spacing:.14em;color:#7a6440;margin-bottom:4px">Memory · this run only</div>
    <div class="col" style="gap:3px;font-size:14.5px" data-testid="dom-persona-memory">${memory}</div>
  </div>

  <div class="pnl" style="left:648px;top:76px;width:296px;height:448px">
    <div class="hd"><img class="ic" src="${img('g-mic')}" alt="">How ${p.his === 'her' ? 'she talks' : 'he talks'}</div>
    <div class="col" style="gap:10px">
      <div class="col" style="gap:4px"><span class="pill k" style="align-self:flex-start;font-size:11px">OFFLINE LINE</span>
        <div style="background:#0b1020;border-radius:8px;padding:8px 10px;font-size:15px;line-height:1.35;box-shadow:0 0 0 2px #2f3a62" data-testid="dom-persona-line">“${esc(p.offline)}”</div></div>
      <div class="col" style="gap:4px"><span class="pill" style="--c:#c4532a;align-self:flex-start;font-size:11px${p.rotom ? '' : ';opacity:.6'}">✦ ROTOM LINE</span>
        ${rotom}</div>
      <div class="xs mu" style="line-height:1.4">${esc(p.note)}</div>
    </div>
    <div class="a col" style="left:14px;right:14px;bottom:12px;gap:6px">
      <div class="caps xs dm" style="letter-spacing:.14em">Others on file</div>
      <div class="row" style="gap:8px">${others || '<span class="xs mu">Nobody else yet.</span>'}</div>
    </div>
  </div>
  ${OVERLAYS}`, 'background:#1a1428', 'kl-warm vign grain');
}
