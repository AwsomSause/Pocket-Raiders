// Phantom UI: the pages of starting a run, built from the mock-ups' `starter` (Choose your partner), `setup` (Run
// rules) and `nick` (the letter keys) pages, and a Plan page made of the same parts. They take the same models as the
// New UI views in ../../redux/screens/run.ts and prologue.ts. Presentation only.

import type { PhantomVersion } from '../../../core/presentation/phantom';
import type { FormModel as NameModel } from '../../redux/screens/prologue';
import { FORM_KEYS as NAME_KEYS } from '../../redux/screens/prologue';
import type { BriefModel, FormModel as SeedModel, StarterModel } from '../../redux/screens/run';
import { type Art, figure, type MenuModel } from '../../redux/templates';
import { act, esc, hero, keys, mon, page, ransom, TYC, ty } from '../kit';
import { phHead } from '../templates';
import { tall } from './event';

/** The four steps of a new run as the game really takes them, the current one lit. */
export const RUN_STEPS = ['Trainer', 'Rules', 'Partner', 'Plan'] as const;
export const stepRibbon = (at: number): string =>
  `<div class="stp">${RUN_STEPS.map((s, k) => `<span class="${k < at ? 'done' : k === at ? 'on' : ''}"><b>${k < at ? '✓' : k + 1}</b>${s}</span>`).join('')}</div>`;
const stepSmall = (at: number): string => `New run · step ${at + 1} of ${RUN_STEPS.length}`;
const cap = (t: string): string => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();

/** Choose your partner: three tall cards, the lit one lifted, and what the professor says about it. */
export function phStarter(_ph: PhantomVersion, d: StarterModel): string {
  const blind = !!d.blind, cur = d.picks[d.on]!;
  const cards = d.picks.map((p, k) => {
    const on = k === d.on, tc = TYC[(p.types[0] ?? '').toLowerCase()] ?? '#888';
    return `<div class="scd pn lt tilt${on ? ' on' : ''}" style="--r:${[-4, 0, 4][k] ?? 0}deg;--i:${k};--tc:${tc}"${act('pick', k, 'over')}><span class="lab">${blind ? 'Blind Draft' : p.region ? `${esc(p.region)} · Remembrance` : `Partner ${k + 1} of ${d.picks.length}`}</span><div class="scp ph-float" style="animation-delay:${k * -0.7}s">${p.file ? mon(p.file, 2.4, blind ? 'ph-sil' : 'olk', '', on) : ''}</div><h4 class="tl1" style="font-size:${p.name.length > 11 ? 26 : 34}px">${blind ? '???' : esc(p.name)}</h4><div class="sct">${blind ? '' : p.types.map(ty).join('')}</div><p class="txt ph-mv">${blind ? 'Shown after you choose.' : esc(p.moves)}</p><div class="scm${blind ? '' : ' ph-st'}">${blind ? 'Trust your gut' : p.stats.trim().split(/\s{2,}/).map((x) => { const [a = '', b = ''] = x.split(' '); return `<i>${esc(a)} <b>${esc(b)}</b></i>`; }).join('')}</div>${!blind && p.past ? `<div class="ph-sc-past${p.past === 'New to you' ? ' new' : ''}">${esc(p.past)}</div>` : ''}${on ? '<div class="sctk">Z · Choose</div>' : ''}</div>`;
  }).join('');
  const line = blind ? 'Three hidden partners. Pick the one you feel.' : `${cur.name}, the ${cur.types.map(cap).join(' and ')} Pokémon. Take this one?`;
  return page('starter', '<div class="bgr"></div><div class="burst" style="--x:50%;--y:62%" aria-hidden="true"></div><div class="dots" aria-hidden="true"></div><div class="shard" style="--cp:polygon(0 0,30% 0,12% 100%,0 100%);inset:0" aria-hidden="true"></div>'
    + phHead('Choose your partner', stepSmall(2)) + stepRibbon(2) + `<div class="scs">${cards}</div>`
    + `<div class="pn sc-say tilt" style="--r:-2deg" data-key="say${d.on}"><span class="lab">${esc(d.sub)}</span><p class="txt">${esc(line)}</p></div>`
    + keys(['◀▶', 'Look'], ['Enter', 'Choose', 'yes'], ['Esc', 'Menu', 'back']));
}

export interface SetupModel extends MenuModel {
  /** The trainer's picture and the short facts on the run card. */
  art: Art | null;
  card: readonly (readonly [string, string])[];
  seed: string;
}

/** Run rules: the run's card at the left, the desk's rows at the right, and the last row ("Depart") as the big blade. */
export function phSetup(_ph: PhantomVersion, d: SetupModel): string {
  const last = d.items.length - 1, go = d.items[last], rows = d.items.slice(0, last);
  const list = rows.map((x, k) => {
    const note = x.note ?? '';
    return `<div class="sr ph-sr${k === d.index ? ' on' : ''}${x.disabled ? ' off' : ''}" style="--i:${k}" data-key="r${k}"${act('pick', k, 'over')}><span>${esc(x.label)}</span><span class="v cyc" style="font-size:${note.length > 26 ? 17 : note.length > 18 ? 21 : 28}px">${esc(note)}</span></div>`;
  }).join('');
  const det = d.detail;
  return page('setup', '<div class="bgk"></div><div class="shard" style="--c:var(--red);--cp:polygon(0 86%,100% 66%,100% 100%,0 100%);inset:0" aria-hidden="true"></div><div class="burst" style="--x:18%;--y:52%" aria-hidden="true"></div>'
    + phHead('Run rules', stepSmall(1)) + stepRibbon(1)
    + `<div class="cc tilt" style="--r:-4deg"><div class="cc-t">${ransom('THE RUN', 11)}</div><dl>${d.card.map(([a, b]) => `<dt>${esc(a)}</dt><dd style="font-size:${b.length > 16 ? 19 : b.length > 11 ? 24 : 30}px">${esc(b)}</dd>`).join('')}</dl><div class="cc-p ph-breathe">${figure(d.art, 150)}</div><div class="cc-s">SEED ${esc(d.seed)}</div></div>`
    + `<div class="su-rows ph-su n${rows.length}">${list}</div>`
    + `<div class="shelp su-help ph-suh" data-key="h${d.index}">${esc(d.index !== last && det?.body ? det.body : d.text ?? '')}</div>`
    + (go ? `<div class="blade su-go${d.index === last ? ' on' : ''}${go.disabled ? ' off' : ''}" style="--sh:#000;--r:-3deg"${act('pick', last, 'over')}>${esc(go.label === 'Depart' ? 'Begin the run' : go.label)}</div>` : '')
    + keys(['◀▶', 'Change'], ['Enter', 'Choose'], ['Esc', 'Back', 'back']));
}

/** The Plan: the campaign and its facts, the first stage with its seed, the party, and Depart. */
export function phBrief(_ph: PhantomVersion, d: BriefModel): string {
  const many = d.regions.length > 5;
  const regions = (many ? d.regions.slice(0, 4) : d.regions).map((r, k) => `<span class="${k ? '' : 'on'}"><b>${k + 1}</b>${esc(r)}</span>`).join('') + (many ? `<span><b>+</b>${d.regions.length - 4} more</span>` : '');
  const notes = d.notes.map(([a, b]) => `<p class="txt"><b>${esc(a)}</b> ${esc(b)}</p>`).join('');
  // Rows the notes take in the panel (about 80 letters a row): a long list is set smaller so all of it shows.
  const rows = d.notes.reduce((n, [a, b]) => n + Math.ceil((a.length + b.length + 1) / 80), Math.ceil(d.stage.length / 70));
  const size = rows > 12 ? ' xs' : rows > 7 ? ' sm' : '';
  return page('plan', '<div class="bgk"></div><div class="shard" style="--c:var(--red);--cp:polygon(0 0,46% 0,34% 100%,0 100%);inset:0" aria-hidden="true"></div><div class="burst" style="--x:82%;--y:44%" aria-hidden="true"></div>'
    + phHead(d.title, stepSmall(3)) + stepRibbon(3)
    + `<div class="pn lt ph-plan tilt" style="--r:-1.5deg"><span class="lab">The plan</span><h3 class="tl1">${esc(d.campaign)}</h3><div class="stp ph-regs">${regions}</div>${d.facts.map(([a, b]) => `<div class="dm-fr"><span>${esc(a)}</span><b>${esc(b)}</b></div>`).join('')}</div>`
    + `<div class="pn ph-first tilt${size}" style="--r:1deg"><span class="lab">First stage</span><div class="ph-nodes">${d.nodes.map((kind, k) => `<i class="ph-node k-${esc(kind)}" style="--i:${k}" title="${esc(kind)}"></i>`).join('')}</div><p class="txt">${esc(d.stage)}</p>${notes}<div class="dm-fr ph-seed"><span>Seed</span><b>${esc(d.seed)}</b><em class="${d.index === 1 ? 'on' : ''}"${act('copy')}>Copy</em></div></div>`
    + `<div class="ph-team">${d.party.slice(0, 6).map((p, k) => `<div class="ph-mate ph-float" style="animation-delay:${k * -0.6}s">${p.file ? mon(p.file, 1.6, 'olk', '', true) : ''}<b>${esc(p.name)}</b></div>`).join('')}</div>`
    + `<div class="blade su-go ph-go${d.index === 0 ? ' on' : ''}" style="--sh:#000;--r:-3deg"${act('go')}>Depart</div>`
    + (d.text ? `<div class="shelp ph-plh">${esc(d.text)}</div>` : '')
    + keys(['◀▶', 'Choose'], ['Enter', 'Select', 'go']));
}

/** Name and pronouns: the mock-ups' letter keys. The scene owns the typing; a click on a key calls `key`. */
export function phName(ph: PhantomVersion, d: NameModel): string {
  const many = d.fields.length > 1, letters = [...d.value], room = Math.max(12, letters.length + 1);
  const last = d.value.slice(-1).toUpperCase();
  const boxes = Array.from({ length: room }, (_, k) => (k < letters.length ? `<b>${esc(letters[k] === ' ' ? ' ' : letters[k]!)}</b>` : k === letters.length ? '<b class="cur"></b>' : '<b class="e"></b>')).join('');
  const fields = many ? `<div class="nk-tabs ph-fields">${d.fields.map((f, k) => `<span class="${k === d.field ? 'on' : ''}"${act('field', k)}>${esc(f.label)}: ${esc(f.value || '…')}</span>`).join('')}</div>` : '';
  const face = (k: string): string => (k === ' ' ? 'Space' : k === '⌫' ? 'Del' : k);
  return page('nick', '<div class="bgr"></div><div class="burst" style="--x:16%;--y:60%" aria-hidden="true"></div><div class="dots" aria-hidden="true"></div><div class="shard" style="--cp:polygon(30% 0,100% 0,100% 100%,22% 100%);inset:0" aria-hidden="true"></div>'
    + phHead(d.title, 'New trainer', 'onred')
    + `<div class="nk-mon ph-breathe">${hero(ph.hero, 5, 'ol')}</div>`
    + `<div class="ph-ask2">${esc(d.prompt)}</div><div class="nk-name${room > 12 ? ' ph-tight' : ''}" aria-label="so far: ${esc(d.value)}">${boxes}</div>${fields}`
    + `<div class="nk-kb ph-kb">${NAME_KEYS.map((k, i) => `<i class="${k.length === 1 && k !== ' ' && k === last ? 'on' : ''}${k === ' ' || k === '⌫' ? ' ph-k2' : ''}" style="--i:${i}"${act('key', k)}>${esc(face(k))}</i>`).join('')}<i class="w"${act('paste')}>Paste</i><i class="w ok"${act('ok')}>${esc(d.ok)}</i><i class="w"${act('clear')}>Clear</i></div>`
    + (d.note ? `<div class="pn ph-say ph-say-n"><p class="txt">${esc(d.note)}</p></div>` : '')
    + keys(...(many ? [['Tab', 'Next box'] as const] : []), ['Enter', 'Choose'], ['Esc', 'Back']));
}

/** The keys of Seed & Codes: letters, digits, and the dot and dash a share code has. */
export const SEED_KEYS = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', '.', '-'] as const;
/** The four kinds of code the box reads, as the old page lists them. */
export const SEED_CODES = [
  ['PR1', 'Seed code', 'Sets the seed, trainer and rules.'],
  ['GH1', 'Ghost code', 'Race a friend\'s seed and see what they did.'],
  ['CC1', 'Challenge card', 'Seed, trainer and rules, with a score to beat.'],
  ['TM1', 'Team code', 'Shows the team. Changes nothing.'],
] as const;

/**
 * Seed & Codes (the mock-ups' letter keys, as on the name page). The value window `.rx-field` is left empty: the
 * scene lays its real text box over it, so typing, pasting and a phone's keyboard all work. A click on a key calls
 * `key`, a button calls `btn` with its argument.
 */
export function phSeed(_ph: PhantomVersion, d: SeedModel): string {
  const buttons = d.buttons.map(([label, arg], k) => `<div class="blade ph-sd-b${k === d.primary ? ' on' : ''}" style="--sh:#000;--r:${k % 2 ? 2 : -2}deg;--i:${k}"${act('btn', arg)}>${esc(label)}</div>`).join('');
  const codes = SEED_CODES.map(([tag, name, text]) => `<div class="ph-sd-code"><b>${tag}</b><span><em>${name}</em>${text}</span></div>`).join('');
  return page('seed', '<div class="bgk"></div><div class="shard" style="--c:var(--red);--cp:polygon(0 0,22% 0,12% 100%,0 100%);inset:0" aria-hidden="true"></div><div class="burst" style="--x:84%;--y:30%" aria-hidden="true"></div><div class="dots" aria-hidden="true"></div>'
    + phHead(d.title, 'Preparation desk')
    + `<div class="ph-sd-ask">${esc(d.heading)}</div>`
    + '<div class="ph-sd-win tilt" style="--r:-1deg"><span class="lab">Seed or share code</span><div class="ph-sd-field rx-field"></div></div>'
    + `<div class="ph-sd-kb">${SEED_KEYS.map((k, i) => `<i class="${d.lit === k ? 'on' : ''}" style="--i:${i}"${act('key', k)}>${k}</i>`).join('')}</div>`
    + `<div class="ph-sd-btns">${buttons}</div>`
    + `<div class="pn lt ph-sd-codes tilt" style="--r:1.2deg"><span class="lab">What the box reads</span>${codes}</div>`
    + (d.text ? `<div class="pn ph-say ph-sd-say" data-key="say:${esc(d.text.slice(0, 24))}"><p class="txt">${esc(d.text)}</p></div>` : '')
    + keys(...(d.hints ?? []).map(([k, t]) => [k, t.charAt(0).toUpperCase() + t.slice(1), /esc/i.test(k) ? 'back' : 'btn', /esc/i.test(k) ? undefined : d.buttons[d.primary]?.[1]] as const)));
}

/** The quiz of the intake (mock-up `quiz`): who asks, the question with where you are in it, and the answers as cards. */
export interface QuizModel {
  /** Who asks ("Prof. Vance") and their picture. */
  who: string;
  bust: Art | null;
  /** Words said before the question (the professor's opening before the first one); they are set smaller above it. */
  intro?: string;
  question: string;
  at: number;
  of: number;
  answers: readonly { label: string; off?: boolean }[];
  index: number;
  /** True when Esc goes back a question. */
  back: boolean;
  hint: string;
}

/** The intake's four beats, as the ribbon at the top. */
export const QUIZ_STEPS = ['Quiz', 'Reveal', 'Your story', 'Partner'] as const;

export function phQuiz(_ph: PhantomVersion, d: QuizModel): string {
  const n = Math.max(1, d.of), at = Math.max(0, Math.min(n - 1, d.at));
  const bust = d.bust ? `<div class="bust ph-qz-bust" aria-hidden="true"><div class="ph-qz-sh">${tall(d.bust, 560, 720)}</div><div>${tall(d.bust, 560, 720)}</div></div>` : '';
  const ribbon = `<div class="stp">${QUIZ_STEPS.map((t, k) => `<span class="${k === 0 ? 'on' : ''}"><b>${k + 1}</b>${t}</span>`).join('')}</div>`;
  const q = d.question, lead = d.intro ?? '', load = q.length + lead.length * 0.6;
  const size = load > 190 ? 22 : load > 130 ? 26 : load > 80 ? 31 : 38;
  const longest = Math.max(1, ...d.answers.map((a) => a.label.length)), single = d.answers.length > 6, odd = !single && d.answers.length % 2 === 1;
  const font = longest > 70 ? 17 : longest > 46 ? 20 : longest > 28 ? 24 : 29;
  const answers = d.answers.map((a, k) => `<div class="ch ph-qz-ch${k === d.index ? ' on' : ''}${a.off ? ' off' : ''}${odd && k === d.answers.length - 1 ? ' last' : ''}" data-key="qz${at}:${k}" style="--i:${k}"${act('pick', k, 'over')}><kbd>${k + 1}</kbd><b style="font-size:${single ? Math.min(font, 22) : font}px">${esc(a.label)}</b></div>`).join('');
  return page('quiz', '<div class="bgk"></div><div class="strip r" aria-hidden="true"></div><div class="strip" aria-hidden="true"></div>'
    + bust + `<div class="hd"><small>Prologue · the intake</small>Partner quiz</div>` + ribbon
    + `<div class="pn qz-q tilt ph-qz-q" data-key="q${at}" style="--r:-1.2deg"><span class="lab">${esc(d.who)} asks · question ${at + 1} of ${n}</span>${lead ? `<p class="ph-qz-in">${esc(lead)}</p>` : ''}<p style="font-size:${size}px">${esc(q)}</p><div class="qz-pips" aria-hidden="true">${Array.from({ length: n }, (_, k) => `<i class="${k < at ? 'f' : k === at ? 'n' : ''}"></i>`).join('')}</div></div>`
    + `<div class="qz-a ph-qz-a${single ? ' tall' : ''}">${answers}</div>`
    + `<p class="txt qz-h ph-qz-h">${esc(d.hint)}</p>`
    + keys(['▲▼◀▶', 'Pick'], ['Enter', 'Answer', 'pick', d.index], ...(d.back ? [['Esc', 'Last question', 'back'] as const] : [])));
}
