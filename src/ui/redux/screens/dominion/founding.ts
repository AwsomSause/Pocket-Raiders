// DOMINION D7 screens: the Founding page (Part 9 A15) and the scene when the sign goes up (Part 6 §8: the first
// member ties the new armband on). Built in the round-4 skin from mockup 13's "new squad" form (Code Name field with
// its letter counter, ideas line, Mark picker, the armband preview with rays) and mockup 0's emblem. Plain data in;
// DominionScene keeps the draft and the cursor.

import { DOMINION_DATA } from '../../../../core/dominion/data';
import { colourDef, draftColours, goalDef, type TeamColours } from '../../../../core/dominion/founding';
import type { TeamDraft } from '../../../../core/dominion/schema';
import { act, esc } from '../../kit';
import { rxUrl } from '../../assets';
import { warehouseUrl } from './paint';
import { emblem, stage } from './views';
import { memberPic } from './teamPic';

const img = (f: string): string => rxUrl(`dominion/${f}.png`);

export const FOUNDING_ROWS = ['name', 'primary', 'secondary', 'initial', 'logo', 'motto', 'goal', 'found'] as const;
export type FoundingRow = (typeof FOUNDING_ROWS)[number];

export interface FoundingUi {
  d: TeamDraft;
  row: number;
  typing: 'name' | 'motto' | null;
  ideas: string[];
  problem: string | null;
  member: { look: string; name: string };
}

function back(morning = false): string {
  return `<img class="cv" src="${warehouseUrl(morning)}" alt="" style="position:absolute;inset:0;width:960px;height:540px">
  <div class="rain" style="left:40px;top:192px;width:268px;height:176px;right:auto;bottom:auto;opacity:.9"></div>`;
}

/** The armband preview (mockup 13): the team's band with the initial, glowing in the primary. */
export function armbandPreview(c: TeamColours, caption: string): string {
  return `<div class="col" style="align-items:center;gap:3px;position:relative" data-testid="dom-armband">
    <div class="rays turn" style="left:-30px;top:-46px;width:180px;height:140px;--rc:color-mix(in srgb,${c.primary} 45%,transparent)"></div>
    <div class="armband" style="position:relative;background:linear-gradient(180deg,color-mix(in srgb,${c.primary} 80%,#fff),${c.primary} 50%,color-mix(in srgb,${c.primary} 70%,#000));color:${c.secondary};box-shadow:0 0 0 3px var(--ink),inset 0 0 0 3px ${c.secondary},inset 0 -6px 0 rgba(0,0,0,.2),0 0 22px color-mix(in srgb,${c.primary} 75%,transparent)"><span>${esc(c.initial)}</span></div>
    <span class="xs mu">${esc(caption)}</span></div>`;
}

export function foundingView(u: FoundingUi): string {
  const F = DOMINION_DATA.founding;
  const d = u.d, c = draftColours(d);
  const on = (r: FoundingRow): boolean => FOUNDING_ROWS[u.row] === r;
  const sel = 'background:linear-gradient(90deg,#3a5a9e,#2a3f72);box-shadow:0 0 0 2px #8cc0ff,0 0 14px rgba(79,163,255,.45)';
  const row = (r: FoundingRow, label: string, body: string, extra = ''): string =>
    `<div class="row" style="gap:8px;font-size:15px;padding:4px 8px;border-radius:7px;${on(r) ? sel : ''};${extra}"${act('fRow', FOUNDING_ROWS.indexOf(r))} data-testid="dom-f-${r}"><span style="width:92px;flex:none">${on(r) ? '▶ ' : ''}${label}</span>${body}</div>`;
  const caret = '<b class="blink" style="color:var(--gold)">▌</b>';
  const field = (text: string, typing: boolean, max: number, id: string): string =>
    `<span class="field" style="position:relative;min-height:24px;${typing ? 'border-color:#ffd23f;box-shadow:0 0 0 2px var(--ink),0 0 12px rgba(255,210,63,.55)' : ''}" data-testid="dom-f-${id}-text">${esc(text)}${typing ? caret : ''}<span class="xs dm" style="position:absolute;right:8px;top:4px">${text.length}/${max}</span></span>`;
  const swatches = (pick: string, other: string, which: 'p' | 's'): string => `<div class="row" style="gap:3px;flex-wrap:wrap">${F.colours.map((x) => {
    const is = x.id === pick, taken = x.id === other;
    return `<span class="mkp${is ? ' on' : ''}" title="${esc(x.name)}" style="width:20px;height:20px;background:${x.hex};${is ? 'box-shadow:0 0 0 2px var(--ink),0 0 0 4px #ffd23f,0 0 10px rgba(255,210,63,.7)' : taken ? 'opacity:.3' : ''}"${act(which === 'p' ? 'fPrimary' : 'fSecondary', x.id)}></span>`;
  }).join('')}</div>`;
  const goal = goalDef(d.goal);
  const logos = F.logos.map((l) => `<span${act('fLogo', l.id)} title="${esc(l.name)}" style="cursor:pointer;${l.id === d.logo ? 'filter:drop-shadow(0 0 6px #ffd23f)' : 'opacity:.55'}">${emblem({ ...c, logo: l.id }, 24, 22, 14)}</span>`).join('');
  const name = d.name.trim() || '…';
  const form = `<div class="pnl gild" style="left:22px;top:74px;width:540px;height:404px;padding:10px 12px" data-testid="dom-founding"><span class="brk"></span>
    <div class="hd y"><img class="ic" src="${img('g-member-card')}" alt="">THE FOUNDING<span class="r">Street Gang · Day 1 of the name</span></div>
    <div class="col" style="gap:3px">
      ${row('name', 'Name', field(d.name, u.typing === 'name', F.name.max, 'name'))}
      <div class="xs mu" style="margin:-1px 0 2px 108px" data-testid="dom-f-ideas">Ideas from your record: ${u.ideas.map((x) => `<span${x === d.name ? ' class="y"' : ''}>${esc(x)}</span>`).join(' · ')}</div>
      ${row('primary', 'Primary', `${swatches(d.primary, d.secondary, 'p')}<span class="xs mu" style="margin-left:auto">${esc(colourDef(d.primary)?.name ?? '')}</span>`)}
      ${row('secondary', 'Secondary', `${swatches(d.secondary, d.primary, 's')}<span class="xs mu" style="margin-left:auto">${esc(colourDef(d.secondary)?.name ?? '')}</span>`)}
      ${row('initial', 'Initial', `<span class="kc">◀</span><span class="mkp on" style="font:800 16px/1 var(--logo);font-style:italic" data-testid="dom-f-letter">${esc(d.initial)}</span><span class="kc">▶</span><span class="xs mu">on every armband</span>`)}
      ${row('logo', 'Mark', `<div class="row" style="gap:6px">${logos}</div>`)}
      ${row('motto', 'Motto', field(d.motto, u.typing === 'motto', F.motto.max, 'motto'))}
      ${row('goal', 'Goal', `<div class="col" style="gap:1px;min-width:0"><b data-testid="dom-f-goal-name">${esc(goal?.name ?? F.noGoal.name)}</b><span class="xs mu" style="line-height:1.25">${esc(goal?.line ?? F.noGoal.line)}</span></div>`, 'align-items:flex-start')}
    </div>
    <div class="row xs mu" style="position:absolute;left:14px;right:14px;bottom:10px;gap:6px;flex-wrap:wrap" data-testid="dom-f-keys">
      ${u.typing ? '<span>Type</span><span class="kc">Enter</span><span>done</span>' : '<span class="kc">↑</span><span class="kc">↓</span><span>row</span><span class="kc">◀</span><span class="kc">▶</span><span>change</span><span class="kc">Enter</span><span>type a name or motto · found</span><span class="kc">Esc</span><span>later</span>'}
    </div>
  </div>`;
  const quote = goal?.quote ?? F.noGoal.quote;
  const preview = `<div class="pnl glass" style="left:578px;top:74px;width:362px;height:404px;padding:10px 12px;overflow:hidden" data-testid="dom-door">
    <div class="hd"><img class="ic" src="${img('g-letter')}" alt="">THE DOOR<span class="r">how the town will see you</span></div>
    <div class="row" style="gap:12px;align-items:center">
      ${emblem(c, 76, 68, 50, 'flex:none')}
      <div class="col" style="gap:2px;min-width:0"><b style="font:800 26px/1.05 var(--logo);font-style:italic;letter-spacing:.02em;color:#fff;text-shadow:0 3px 0 color-mix(in srgb,${c.primary} 70%,#000)" data-testid="dom-f-door-name">${esc(name.toUpperCase())}</b>
      <span class="sm" style="font-style:italic;color:#efe6ff">“${esc(d.motto || '…')}”</span></div>
    </div>
    <div class="row" style="gap:14px;align-items:flex-end;margin-top:12px">
      <div style="position:relative;width:120px;height:170px;border-radius:10px;background:radial-gradient(closest-side at 50% 85%,color-mix(in srgb,${c.primary} 55%,transparent),transparent);box-shadow:inset 0 -6px 0 color-mix(in srgb,${c.primary} 50%,#000)" data-testid="dom-f-member">
        ${memberPic(u.member.look, 160, 'position:absolute;left:0;right:0;bottom:6px;margin:auto;width:104px;height:160px;object-fit:contain;object-position:bottom', c)}
      </div>
      <div class="col" style="gap:10px;align-items:center;flex:1">
        ${armbandPreview(c, `${colourDef(d.primary)?.name ?? ''} · ${colourDef(d.secondary)?.name ?? ''}`)}
        <span class="xs mu" style="text-align:center;line-height:1.3">Everyone on the Pyramid wears it, and every outfit turns these two colours.</span>
      </div>
    </div>
    <div class="xs" style="margin-top:8px;font-style:italic;color:#d4b8ff;line-height:1.3">“${esc(quote)}”</div>
  </div>`;
  const problem = u.problem ? `<div class="a rd b7" style="left:24px;top:486px;z-index:9;font-size:15px" data-testid="dom-problem">${esc(u.problem)}</div>` : '';
  return stage(`${back()}<div class="a" style="inset:0;background:rgba(6,9,19,.6);z-index:4"></div>
    <div class="ttl" style="--t1:#5b34b0;--t2:#c9338f">THE FOUNDING<span class="sub">· the sign goes up</span></div>
    ${form}${preview}${problem}
    <div class="cta shine${on('found') ? ' on' : ''}" style="right:20px;bottom:14px;${on('found') ? 'box-shadow:0 0 0 3px var(--ink),0 0 0 6px #ffd23f,0 0 24px rgba(255,210,63,.8)' : ''}"${act('fFound')} data-testid="dom-f-found">Found the team ▶ <span class="kc">Enter</span></div>
    <div class="haze" style="--hz:${c.primary};--hz2:#ffd23f" aria-hidden="true"></div>`);
}

/** The sign goes up: the door with the emblem, the first member in the new colours, their line. */
export function foundedView(lines: string[], shown: number, c: TeamColours, name: string, member: { look: string; name: string }): string {
  const text = lines.slice(0, shown).map((l) => `<div>${esc(l)}</div>`).join('');
  return stage(`${back(true)}
    <div class="rays turn" style="left:130px;top:40px;width:420px;height:320px;z-index:2;--rc:color-mix(in srgb,${c.primary} 40%,transparent)"></div>
    <div class="a col" style="left:190px;top:64px;width:300px;z-index:3;align-items:center;gap:8px;padding:14px;border-radius:10px;background:linear-gradient(180deg,#2a2f44,#1a1d2c);box-shadow:0 0 0 4px var(--ink),inset 0 0 0 3px color-mix(in srgb,${c.primary} 60%,#000),0 0 30px color-mix(in srgb,${c.primary} 60%,transparent)" data-testid="dom-sign">
      ${emblem(c, 96, 86, 62)}
      <b style="font:800 30px/1 var(--logo);font-style:italic;color:#fff;text-shadow:0 3px 0 color-mix(in srgb,${c.primary} 70%,#000)" data-testid="dom-sign-name">${esc(name.toUpperCase())}</b>
    </div>
    <div class="cone flick" style="left:520px;top:70px;width:300px;height:400px;z-index:2;--cc:rgba(255,214,140,.30)"></div>
    <div class="shd" style="left:600px;top:454px;width:150px;height:22px"></div>
    ${memberPic(member.look, 195, 'position:absolute;left:606px;top:262px;width:126px;height:195px;z-index:4', c, 'spr bob')}
    <div class="embers" style="left:520px;top:120px;width:260px;height:300px;z-index:3;--ec:${c.secondary};opacity:.8"></div>
    <div class="tbox" style="left:60px;right:60px;bottom:24px;min-height:120px" data-testid="dom-founded"${act('more')}><span class="who">THE FOUNDING</span>${text}<span class="more">${shown < lines.length ? '▼' : 'Enter ▶'}</span></div>`);
}
