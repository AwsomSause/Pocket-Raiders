// Claude AI screens in the New look (Dominion slice D18), ported from the Claude mockups
// (plans/claude-api/mockups/index.html, https://claude.ai/artifact/LEFrzZyJrVo7kyA3Rk59hg):
// - a1 `claudeSettingsView`: Settings > Claude AI (four tiers, the Key-Card in use and its spend, "Use Claude for").
// - a2 `vaultHtml` + `vaultCards`: the hidden Key-Card vault (src/ui/keyVault.ts keeps its state and the key field).
// Plain data in; every button is a tap target (data-act) with a key path. No key ever reaches these views.

import './claude.css';
import { act, esc } from '../../kit';
import { rxUrl } from '../../assets';
import { stage } from './views';
import type { AiTier } from '../../../../core/ai/schema';

const img = (f: string): string => rxUrl(`dominion/${f}.png`);
const money = (n: number): string => `$${n.toFixed(2)}`;

export interface CardFace { id: string; name: string; k1: string; k2: string; legend: string; orb: string }

export interface ClaudeSettingsModel {
  /** The left list: every Settings category and Claude AI (`on`), each with its icon. */
  cats: { label: string; icon: string; on?: boolean }[];
  tiers: { id: AiTier; label: string; blurb: string; price: string; note: string; c: string }[];
  tier: AiTier;
  /** The focused row: 0 tiers, 1-6 uses, 7 change card, 8 forget, 9 back. */
  focus: number;
  /** Presses of 9 so far (0-8). */
  nines: number;
  card: (CardFace & { spent: number; usedUp: boolean; last: number | null }) | null;
  /** "≈ 12 more Standard runs" (null at Off). */
  runsLeft: string | null;
  cap: number;
  uses: { label: string; value: string; cls: 'g' | 'k' | 'b' | 'y' }[];
  notice: string;
}

const TILE_X = 175;

/** Mockup a1: Settings, Claude AI. */
export function claudeSettingsView(m: ClaudeSettingsModel): string {
  const k = Math.max(0, m.tiers.findIndex((t) => t.id === m.tier));
  const cats = m.cats.map((c, i) => c.on
    ? `<div class="row" style="padding:6px 10px;border-radius:7px;color:#2b1408;background:linear-gradient(180deg,#ffd9bf,#ffad80);box-shadow:0 0 0 3px var(--ink),0 0 18px var(--ai-glow)" data-testid="claude-tab"><span class="spark" style="--sc:#c4532a"></span>${esc(c.label)}<span class="pill" style="--c:#c4532a;margin-left:auto;font-size:11px;padding:1px 7px">NEW</span></div>`
    : `<div class="row" style="padding:5px 10px;border-radius:7px;color:#c9d2f2;cursor:pointer"${act('cat', i)}><img class="ic s" src="${img(c.icon)}" alt="">${esc(c.label)}</div>`).join('');
  const boxes = Array.from({ length: 8 }, (_, i) => i < m.nines
    ? '<i style="width:12px;height:12px;border-radius:3px;background:var(--ai);box-shadow:0 0 6px var(--ai)"></i>'
    : i === m.nines ? '<i class="pulse" style="width:12px;height:12px;border-radius:3px;background:#2a3150;box-shadow:0 0 0 2px var(--ai)"></i>'
      : '<i style="width:12px;height:12px;border-radius:3px;background:#2a3150"></i>').join('');
  const tiles = m.tiers.map((t, i) => {
    const on = i === k;
    const blurb = t.blurb.split('|').map(esc).join('<br>');
    return on
      ? `<div class="tile on" style="--c:${t.c};height:142px;margin-top:-8px;justify-content:flex-start;padding-top:12px;box-shadow:0 0 0 3px var(--ink),0 0 0 6px #ffd23f,0 0 34px rgba(255,160,110,.75),inset 0 -5px 0 ${t.c};cursor:pointer"${act('tier', i)} data-testid="claude-tier-${t.id}"><i class="brk"></i><b style="color:#fff">${esc(t.label)}</b><span>${blurb}</span><span class="num" style="font-size:24px;color:var(--gold);margin-top:auto">${esc(t.price)}</span><span>${esc(t.note)}</span></div>`
      : `<div class="tile" style="--c:${t.c};height:130px;justify-content:flex-start;padding-top:12px;cursor:pointer"${act('tier', i)} data-testid="claude-tier-${t.id}"><b>${esc(t.label)}</b><span>${blurb}</span><span class="num" style="font-size:22px;color:#fff;margin-top:auto">${esc(t.price)}</span><span>${esc(t.note)}</span></div>`;
  }).join('');
  const std = m.tiers.findIndex((t) => t.id === 'standard');
  const ring = (i: number): string => (m.focus === i ? 'box-shadow:0 0 0 3px #ffd23f,0 0 14px rgba(255,210,63,.5);' : '');
  const c = m.card;
  const cardArt = c
    ? `<div style="position:relative;width:92px;height:128px;flex:none;border-radius:9px;overflow:hidden;background:linear-gradient(160deg,${c.k1},${c.k2});box-shadow:0 0 0 3px var(--ink),inset 0 0 0 2px rgba(255,255,255,.6);${c.usedUp ? 'filter:grayscale(.85) brightness(.6)' : ''}">
        <img class="spr" src="${img(`p-${c.legend}`)}" alt="${esc(c.legend)}" style="left:2px;top:22px;width:88px;height:76px;object-fit:contain">
        <b class="a" style="left:7px;top:5px;font:800 15px var(--logo);font-style:italic;color:#fff;text-shadow:0 2px 0 rgba(0,0,0,.4)">${esc(c.name.toUpperCase())}</b><i class="a shine" style="inset:0;background:linear-gradient(115deg,transparent 30%,rgba(255,255,255,.45) 45%,rgba(160,255,240,.25) 52%,transparent 64%);mix-blend-mode:screen"></i><img class="a" src="${img(`g-${c.orb}`)}" alt="" style="right:5px;bottom:5px;width:18px;height:18px;image-rendering:pixelated"></div>`
    : `<div style="position:relative;width:92px;height:128px;flex:none;border-radius:9px;background:repeating-linear-gradient(135deg,#1c2340 0 8px,#232b4c 8px 16px);box-shadow:0 0 0 3px var(--ink),inset 0 0 0 2px rgba(255,255,255,.25);display:grid;place-items:center;font:800 40px var(--logo);color:#5a6490">?</div>`;
  const spentRow = c
    ? `<div class="row sp"><span class="caps sm mu">Rotom used</span>${c.last !== null ? `<span class="fx up" style="font-size:12px">${c.last < 0.00005 ? '+&lt;$0.0001' : `+$${c.last < 0.01 ? c.last.toFixed(4) : c.last.toFixed(2)}`} just now</span>` : ''}<span class="pill ${c.usedUp ? 'r' : 'g'}" style="font-size:12px" data-testid="claude-card-state">${c.usedUp ? 'USED UP' : 'ACTIVE'}</span></div>
        <div class="row" style="align-items:baseline;gap:6px"><span class="num" style="font-size:44px;line-height:.9;color:#fff;text-shadow:0 0 14px rgba(255,170,120,.7),0 3px 0 #5a2a10" data-testid="claude-spent">${money(Math.min(c.spent, m.cap))}</span><span class="num mu" style="font-size:22px">of $${m.cap}</span></div>
        <div class="mt shine" style="--v:${Math.min(100, Math.round((c.spent / m.cap) * 100))};--c:var(--ai);height:16px"></div>
        <div class="row sp xs mu"><span>${c.usedUp ? 'This key is used up. Ask for a new one.' : esc(m.runsLeft ?? 'Offline at this tier')}</span><span class="row" style="gap:3px"><span class="kc" style="height:18px;font-size:11px">←</span><span class="kc" style="height:18px;font-size:11px">→</span>tier</span></div>`
    : `<div class="row sp"><span class="caps sm mu">Rotom used</span><span class="pill k" style="font-size:12px" data-testid="claude-card-state">NO CARD</span></div>
        <div class="row" style="align-items:baseline;gap:6px"><span class="num" style="font-size:40px;line-height:.9;color:#c9d2f2" data-testid="claude-spent">Offline</span></div>
        <div class="xs mu" style="line-height:1.35">No Key-Card set: every line is the game's own and nothing is sent anywhere.</div>`;
  const uses = m.uses.map((u, i) => `<div class="row sp" style="padding:2px 6px;margin:0 -6px;border-radius:6px;cursor:pointer;${ring(i + 1)}"${act('pick', i + 1)} data-testid="claude-use-${i}"><span>${esc(u.label)}</span><span class="pill ${u.cls}">${esc(u.value)}</span></div>`).join('');
  return stage(`<div class="layer" style="background:radial-gradient(520px 300px at 640px 250px,rgba(255,150,100,.20),transparent 70%),radial-gradient(500px 360px at 120px 520px,rgba(120,70,220,.25),transparent 70%)"></div>
  <div class="ttl" style="--t1:#2a5fc4;--t2:#4f9be8">Settings <span class="sub">· Rotom</span></div>
  <div class="keys" style="cursor:pointer"${act('pick', 9)}><span class="key">Esc</span><span>Back</span></div>
  <span class="spark twinkle a" style="left:196px;top:356px;z-index:30;--z:14px"></span><span class="spark twinkle a" style="left:30px;top:404px;z-index:30;--z:10px;animation-delay:-1.2s"></span><span class="glint" style="left:752px;top:150px;--g:20px"></span>
  <div class="pnl dim" style="left:16px;top:76px;width:196px;height:448px;padding:10px">
    <div class="col" style="gap:3px;font-size:15px;font-weight:600">${cats}</div>
    <div class="a col" style="left:12px;right:12px;bottom:12px;gap:6px;font-size:12.5px;color:var(--dim);line-height:1.35">
      <span>Press <span class="kc">9</span> eight times here to open the Key-Card slot.</span>
      <span class="row" style="gap:5px" aria-label="${m.nines} of 8 presses" data-testid="claude-nines">${boxes}</span>
    </div>
  </div>
  <div class="rays turn" style="left:${420 + (k - std) * TILE_X}px;top:-10px;width:280px;height:280px;z-index:4;--rc:rgba(255,170,120,.28)"></div>
  <div class="pnl" style="left:228px;top:76px;width:716px;height:206px;${ring(0)}" data-testid="claude-tiers">
    <div class="hd"><span class="spark" style="--z:18px"></span>Rotom<span class="r">extra lines, smarter rivals, typed talks. The game is complete without it.</span></div>
    <div class="a" style="left:14px;right:14px;top:58px;display:grid;grid-template-columns:repeat(4,1fr);gap:12px">${tiles}</div>
    <div class="chipf" style="left:${404 + (std - 2) * TILE_X}px;top:40px;font-size:12px;padding:2px 10px">★ DEFAULT</div>
  </div>
  <div class="pnl gild" style="left:228px;top:296px;width:430px;height:228px;padding:14px 18px" data-testid="claude-card">
    <div class="hd y" style="border-color:rgba(240,207,110,.35)"><img class="ic" src="${img('g-key-charm')}" alt="">${c ? 'Key-Card in use' : 'No Key-Card yet'}</div>
    <div class="row" style="gap:16px;align-items:flex-start">${cardArt}<div class="col" style="gap:7px;flex:1;min-width:0">${spentRow}</div></div>
    <div class="row" style="gap:8px;margin-top:10px;white-space:nowrap"><span class="bt" style="font-size:14px;padding:4px 10px;${ring(7)}"${act('pick', 7)} data-testid="claude-change">${c ? 'Change card' : 'Add a card'}</span><span class="bt ghost" style="font-size:14px;padding:4px 10px;${ring(8)}${c ? '' : 'opacity:.5'}"${act('pick', 8)} data-testid="claude-forget">Forget key</span><span class="xs dm" style="margin-left:auto">At $${m.cap}: “ask for a new card”</span></div>
  </div>
  <div class="pnl" style="left:672px;top:296px;width:272px;height:228px;padding:12px 14px">
    <div class="hd" style="font-size:15px">Use Rotom for</div>
    <div class="col" style="gap:5px;font-size:15px">${uses}</div>
  </div>
  ${m.notice ? `<div class="aichip" style="left:240px;top:500px" data-testid="claude-notice"><i></i>${esc(m.notice)}</div>` : ''}`, '', 'check vign grain');
}

// ---------- mockup a2: the Key-Card vault ----------

export interface VaultCard extends CardFace {
  /** The card's key spend on this device, or null when no key was sealed in it. */
  spent: number | null;
  usedUp: boolean;
  inUse: boolean;
}

/** The four side slots of the fan, left to right (mockup a2), then the raised centre. */
const SLOTS = [
  { left: 34, top: 150, rot: -8 },
  { left: 190, top: 128, rot: -4 },
  { left: 620, top: 128, rot: 4 },
  { left: 776, top: 150, rot: 8 },
];
const ART: Record<string, [number, number]> = { dialga: [104, 114], palkia: [104, 90], giratina: [110, 110], groudon: [112, 106], kyogre: [128, 78] };

/** The fan of five cards: the chosen one raised in the middle, the others in the side slots in list order. */
export function vaultCards(cards: readonly VaultCard[], pick: number, cap: number): string {
  const others = cards.map((c, i) => [c, i] as const).filter(([, i]) => i !== pick);
  const side = others.map(([c, i], s) => {
    const p = SLOTS[s]!;
    const [w, h] = ART[c.legend] ?? [104, 100];
    const label = c.spent === null ? 'empty slot' : `${money(Math.min(c.spent, cap))} of $${cap}`;
    return `<div class="kcard${c.usedUp ? ' off' : ''}" style="left:${p.left}px;top:${p.top}px;--k1:${c.k1};--k2:${c.k2};transform:rotate(${p.rot}deg);${c.usedUp ? '' : 'filter:brightness(.78);'}cursor:pointer"${act('card', i)} data-testid="vault-card-${c.id}"><img class="gem" src="${img(`g-${c.orb}`)}" alt=""><span class="kt">KEY-CARD</span><span class="kn">${esc(c.name.toUpperCase())}</span><div class="art"><img src="${img(`p-${c.legend}`)}" alt="${esc(c.legend)}" style="width:${w}px;height:${h}px"></div><span class="xs" style="color:#fff">${c.inUse ? 'in use · ' : ''}${label}</span></div>`
      + (c.usedUp ? `<div class="inked" style="left:${p.left + 10}px;top:${p.top + 100}px;color:#ff4a4a;transform:rotate(${p.rot * 2.5}deg);font-size:21px;mix-blend-mode:normal;background:rgba(20,0,0,.35)">USED UP</div>` : '');
  }).join('');
  const c = cards[pick]!;
  const [w, h] = ART[c.legend] ?? [104, 100];
  const state = c.usedUp ? '<span class="pill r" style="font-size:11px">USED UP</span>' : c.inUse ? '<span class="pill g" style="font-size:11px">ACTIVE</span>' : c.spent === null ? '<span class="pill g" style="font-size:11px">NEW</span>' : '';
  return `${side}
  <div class="chipf" style="left:430px;top:52px;z-index:16;font-size:12px">▼ SELECTED</div>
  <div class="kcard float${c.usedUp ? ' off' : ''}" style="left:376px;top:70px;width:208px;height:288px;z-index:12;--k1:${c.k1};--k2:${c.k2};padding:14px;box-shadow:0 0 0 3px var(--ink),inset 0 0 0 3px rgba(255,255,255,.7),inset 0 0 0 7px rgba(0,0,0,.12),0 0 0 7px #ffd23f,0 0 50px color-mix(in srgb,${c.k1} 80%,transparent),0 24px 40px rgba(0,0,0,.6)" data-testid="vault-selected" data-card="${c.id}">
    <img class="gem" src="${img(`g-${c.orb}`)}" alt="" style="width:30px;height:30px;right:12px;top:12px"><span class="kt">KEY-CARD</span><span class="kn" style="font-size:30px">${esc(c.name.toUpperCase())}</span>
    <div class="art"><img src="${img(`p-${c.legend}`)}" alt="${esc(c.legend)}" style="width:${Math.round(w * 1.5)}px;height:${Math.round(h * 1.5)}px;max-width:164px;max-height:150px;object-fit:contain"><i class="glint" style="left:20px;top:14px;--g:16px"></i><i class="glint" style="right:18px;bottom:20px;left:auto;top:auto;--g:12px;animation-delay:-1.4s"></i></div><i class="a shine" style="inset:0;border-radius:14px"></i><i class="brk" style="inset:-14px"></i>
    <div class="row sp" style="font-size:12px;color:#fff;white-space:nowrap;gap:6px"><span data-testid="vault-selected-spend">Rotom used ${money(Math.min(c.spent ?? 0, cap))} of $${cap}</span>${state}</div>
  </div>`;
}

/** The vault's fixed frame; `#vault-cards`, the name, the checks and the message are filled in by src/ui/keyVault.ts. */
export function vaultHtml(fake: boolean): string {
  return stage(`<div class="layer" style="background:radial-gradient(600px 360px at 480px 300px,rgba(150,90,255,.35),transparent 70%),repeating-linear-gradient(0deg,rgba(255,255,255,.025) 0 2px,transparent 2px 6px)"></div>
  <div class="a" style="left:270px;top:24px;width:420px;height:420px;border-radius:50%;z-index:1;background:radial-gradient(circle,#1a1030 0 54%,#3a2d55 55% 60%,#241a3a 61% 70%,#4a3c6a 71% 73%,#1c1430 74%);box-shadow:0 0 0 4px var(--ink),0 0 60px rgba(160,100,255,.35)"></div>
  <div class="a" style="left:270px;top:24px;width:420px;height:420px;border-radius:50%;z-index:1;background:repeating-conic-gradient(from 0deg,#c9b8ff 0 2deg,transparent 2deg 30deg);-webkit-mask:radial-gradient(closest-side,transparent 88%,#000 89% 93%,transparent 94%);mask:radial-gradient(closest-side,transparent 88%,#000 89% 93%,transparent 94%);opacity:.7"></div>
  <div class="rays turn" style="left:250px;top:30px;width:460px;height:460px;z-index:2;--rc:rgba(255,200,240,.26)"></div>
  <div class="cone" style="left:330px;top:-40px;width:300px;height:470px;z-index:3;--cc:rgba(255,190,230,.35)"></div>
  <div class="embers" style="left:300px;top:40px;width:360px;height:360px;z-index:13;--ec:#ffc6ea;opacity:.8"></div>
  <div class="a" style="left:60px;top:392px;width:840px;height:40px;z-index:2;border-radius:50%;background:radial-gradient(closest-side,rgba(255,170,220,.25),transparent)"></div>
  <div class="ttl" style="--t1:#b0569a;--t2:#ff9a62">Key-Card Vault <span class="sub">· hidden slot</span></div>
  <div class="keys" style="cursor:pointer" data-vault="close"><span class="key">← →</span><span>Pick</span><span class="key">Esc</span><span>Close</span></div>
  <div class="aichip" style="left:16px;top:70px;background:linear-gradient(180deg,#e9e2ff,#b9a6ff)"><i style="background:#5b34b0"></i>9 × 8 · slot unlocked${fake ? ' · test mode, nothing is sent' : ''}</div>
  <div id="vault-cards"></div>
  <div class="pnl" style="left:150px;top:368px;width:660px;height:158px;z-index:14;padding:12px 16px;white-space:nowrap">
    <div class="row sp"><b class="caps" style="font-size:15px;letter-spacing:.1em">Paste the key Kice sent you for <span style="color:#ffb3d6" data-vault="name"></span></b><span class="xs dm">stays on this device</span></div>
    <div class="row" style="gap:10px;margin-top:8px">
      <div class="vault-field" style="flex:1;height:42px;border-radius:8px;background:#0b1020;border:3px solid #ffb3d6;box-shadow:0 0 0 3px var(--ink),0 0 16px rgba(255,170,220,.45);display:flex;align-items:center;padding:0 12px"><input type="password" autocomplete="off" spellcheck="false" placeholder="sk-ant-..." aria-label="Key" data-testid="vault-key" style="all:unset;flex:1;min-width:0;font:20px var(--num);letter-spacing:.06em;color:#e8ecff;caret-color:var(--gold);pointer-events:auto"></div>
      <div class="bt y" style="height:42px;font-size:16px;cursor:pointer" data-vault="seal" data-testid="vault-seal">Test &amp; seal</div>
    </div>
    <div class="row" style="gap:16px;margin-top:10px;font-size:14px">
      <span class="row" style="gap:5px" data-testid="vault-shape"><b data-vault="shape" class="mu">○</b>starts with sk-ant-</span>
      <span class="row" style="gap:6px" data-testid="vault-test"><span data-vault="test"><b class="mu">○</b></span>one tiny test call</span>
      <label class="row" style="gap:6px;margin-left:auto;cursor:pointer;pointer-events:auto"><input type="checkbox" data-testid="vault-remember" style="width:16px;height:16px;margin:0;accent-color:#ffb3d6">Remember on this device</label>
    </div>
    <div class="xs dm" style="margin-top:8px;white-space:normal" data-vault="msg" data-testid="vault-msg">Each card's key has its own $10 limit in the Anthropic Console. The game's counter is a friendly display.</div>
  </div>`, 'background:#0b0718');
}
