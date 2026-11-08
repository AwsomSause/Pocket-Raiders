// Save Creator page (savegen.html): a form on top of src/save/saveGenerator.ts. No game scene, no Phaser.
// To add a field: add a row to RUN_FIELDS / PROFILE_FIELDS / MON_FIELDS below (and the matching key in SaveSpecSchema + the builder
// in saveGenerator.ts). The form, the spec JSON and validation pick it up on their own.
import { getContent } from '../data';
import { RUN_RULES } from '../core/rules';
import { NATURE_IDS } from '../core/natures';
import { TYPE_NAMES } from '../core/contentSchema';
import { generateSave, type SaveSpec } from '../save/saveGenerator';

type Kind = 'text' | 'num' | 'bool' | 'select' | 'list' | 'kv';
interface Field { key: string; label: string; kind: Kind; options?: string[]; datalist?: string; hint?: string }
type Obj = Record<string, unknown>;

const content = getContent();
const STORE = 'pkr.saveCreator.spec';
const trainers = ['nate', 'hilda'];

const RUN_FIELDS: Field[] = [
  { key: 'seed', label: 'Seed', kind: 'text', hint: 'Same seed + same fields = same save' },
  { key: 'trainer', label: 'Trainer', kind: 'select', options: trainers },
  { key: 'mode', label: 'Mode', kind: 'select', options: RUN_RULES.modes.map((m) => m.id) },
  { key: 'difficulty', label: 'Difficulty', kind: 'select', options: RUN_RULES.difficulties.map((d) => d.id) },
  { key: 'region', label: 'Region (1-based)', kind: 'num' },
  { key: 'stage', label: 'Stage (1-based)', kind: 'num' },
  { key: 'money', label: 'Money', kind: 'num' },
  { key: 'deathBlock', label: 'Death-Block', kind: 'bool' },
  { key: 'modifiers', label: 'Modifiers', kind: 'list', datalist: 'dl-mods' },
  { key: 'random', label: 'Fill blanks randomly', kind: 'bool', hint: 'On by default' },
  { key: 'levelCapCheck', label: 'Check region level cap', kind: 'bool', hint: 'On by default' },
  { key: 'items', label: 'Bag items (item=count per line)', kind: 'kv', datalist: 'dl-items' },
  { key: 'gimmickUses', label: 'Gimmick uses (mega:aggronite=3, dynamax=1, tera=2)', kind: 'kv' },
  { key: 'storyFlags', label: 'Story / rival flags (flag=true)', kind: 'kv' },
  { key: 'badges', label: 'Badges (blank = earned automatically)', kind: 'list' },
  { key: 'run.patch', label: 'Any other run field (path=value)', kind: 'kv', hint: 'e.g. log.battlesWon=5' },
];
const PROFILE_FIELDS: Field[] = [
  { key: 'id', label: 'Profile id', kind: 'text' },
  { key: 'protagonistName', label: 'Player name', kind: 'text' },
  { key: 'bankCredits', label: 'Bank credits', kind: 'num' },
  { key: 'bankTier', label: 'Bank tier (1-5)', kind: 'num' },
  { key: 'researchPoints', label: 'Research points', kind: 'num' },
  { key: 'prestige', label: 'Prestige (0-5)', kind: 'num' },
  { key: 'candies', label: 'Candies', kind: 'num' },
  { key: 'unlockAllTrainers', label: 'Unlock all trainers', kind: 'bool' },
  { key: 'dexAll', label: 'Pokédex complete', kind: 'bool' },
  { key: 'licenses', label: 'Bank licenses', kind: 'list' },
  { key: 'candyPerks', label: 'Candy Shop perks', kind: 'list' },
  { key: 'researchTree', label: 'Research Tree nodes', kind: 'list' },
  { key: 'contacts', label: 'Trainer contacts', kind: 'list' },
  { key: 'titles', label: 'Titles', kind: 'list' },
  { key: 'remembrances', label: 'Remembrances (id=locked|seen|unlocked)', kind: 'kv' },
  { key: 'patch', label: 'Any other profile field (path=value)', kind: 'kv', hint: 'e.g. stats.battlesWon=77' },
];
const MON_FIELDS: Field[] = [
  { key: 'species', label: 'Species / form', kind: 'text', datalist: 'dl-species', hint: 'The form is the species id, e.g. meowstic-female' },
  { key: 'level', label: 'Level', kind: 'num' },
  { key: 'gender', label: 'Gender', kind: 'select', options: ['', 'male', 'female'] },
  { key: 'shiny', label: 'Shiny', kind: 'bool' },
  { key: 'nature', label: 'Nature', kind: 'select', options: ['', ...NATURE_IDS] },
  { key: 'ability', label: 'Ability (id or hidden)', kind: 'text', datalist: 'dl-abilities' },
  { key: 'moves', label: 'Moves (up to 8)', kind: 'list', datalist: 'dl-moves' },
  { key: 'held', label: 'Held items ("mega-stone" = its own)', kind: 'list', datalist: 'dl-items' },
  { key: 'teraType', label: 'Tera type', kind: 'select', options: ['', ...TYPE_NAMES] },
  { key: 'ivs', label: 'IVs (one number, blank = random)', kind: 'num' },
  { key: 'evs', label: 'EVs', kind: 'select', options: ['', 'max'] },
  { key: 'friendship', label: 'Friendship (0-255)', kind: 'num' },
  { key: 'nickname', label: 'Nickname', kind: 'text' },
  { key: 'hpPercent', label: 'HP %', kind: 'num' },
  { key: 'status', label: 'Status', kind: 'text' },
  { key: 'patch', label: 'Any other field (path=value)', kind: 'kv' },
];

// ---- spec <-> form values ----
const getAt = (o: Obj, path: string): unknown => path.split('.').reduce<unknown>((n, k) => (n && typeof n === 'object' ? (n as Obj)[k] : undefined), o);
const setAt = (o: Obj, path: string, v: unknown): void => {
  const ks = path.split('.');
  let n = o;
  for (const k of ks.slice(0, -1)) n = (n[k] ??= {}) as Obj;
  n[ks[ks.length - 1]!] = v;
};
const parseVal = (s: string): unknown => { try { return JSON.parse(s); } catch { return s; } };
const kvText = (v: unknown): string => Object.entries((v ?? {}) as Obj).map(([k, x]) => `${k}=${typeof x === 'string' ? x : JSON.stringify(x)}`).join('\n');
const kvParse = (s: string): Obj | undefined => {
  const out: Obj = {};
  for (const line of s.split('\n')) { const i = line.indexOf('='); if (i > 0) out[line.slice(0, i).trim()] = parseVal(line.slice(i + 1).trim()); }
  return Object.keys(out).length ? out : undefined;
};
function readField(f: Field, el: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement): unknown {
  const s = el.value.trim();
  if (f.kind === 'bool') return (el as HTMLInputElement).indeterminate ? undefined : (el as HTMLInputElement).checked;
  if (s === '') return undefined;
  if (f.kind === 'num') return Number(s);
  if (f.kind === 'list') return s.split(/[\n,]+/).map((x) => x.trim()).filter(Boolean);
  if (f.kind === 'kv') return kvParse(el.value);
  return s;
}
function writeField(f: Field, el: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement, v: unknown): void {
  if (f.kind === 'bool') { (el as HTMLInputElement).indeterminate = v === undefined; (el as HTMLInputElement).checked = v === true; return; }
  if (v === undefined || (f.kind === 'num' && typeof v === 'object')) el.value = '';
  else if (f.kind === 'list') el.value = Array.isArray(v) ? v.join(', ') : typeof v === 'object' ? Object.entries(v as Obj).flatMap(([k, n]) => Array<string>(Number(n) || 1).fill(k)).join(', ') : String(v);
  else el.value = f.kind === 'kv' ? kvText(v) : String(v);
}

// ---- state ----
const defaultSpec = (): SaveSpec => ({ seed: 'my-save', trainer: 'nate', region: 1, stage: 1, party: [{ species: 'charizard', level: 50 }] } as SaveSpec);
let spec: Obj = defaultSpec() as Obj;
try { const saved = localStorage.getItem(STORE); if (saved) spec = JSON.parse(saved) as Obj; } catch { /* storage may be blocked */ }
if (typeof spec.profile !== 'object' || spec.profile === null) spec.profile = {};
if (!Array.isArray(spec.party)) spec.party = [];
const persist = (): void => { try { localStorage.setItem(STORE, JSON.stringify(spec)); } catch { /* ignore */ } };

const $ = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;
function datalist(id: string, values: string[]): void {
  const dl = document.createElement('datalist');
  dl.id = id;
  dl.innerHTML = values.map((v) => `<option value="${v}">`).join('');
  document.body.append(dl);
}
datalist('dl-species', [...content.species.keys()]);
datalist('dl-moves', [...content.moves.keys()]);
datalist('dl-items', [...content.items.keys()]);
datalist('dl-mods', RUN_RULES.modifiers.map((m) => m.id));
const abilityList = document.createElement('datalist');
abilityList.id = 'dl-abilities';
document.body.append(abilityList);

function fieldEl(f: Field, v: unknown, onChange: (v: unknown) => void): HTMLElement {
  const wrap = document.createElement('label');
  const text = document.createElement('span');
  text.textContent = f.label + (f.hint ? ` — ${f.hint}` : '');
  let el: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
  if (f.kind === 'bool') { wrap.className = 'chk'; el = document.createElement('input'); el.type = 'checkbox'; wrap.append(el, text); }
  else {
    if (f.kind === 'select') { el = document.createElement('select'); (el as HTMLSelectElement).innerHTML = ['', ...(f.options ?? [])].filter((o, i, a) => a.indexOf(o) === i).map((o) => `<option value="${o}">${o || '(auto)'}</option>`).join(''); }
    else if (f.kind === 'kv' || f.kind === 'list') { el = document.createElement('textarea'); el.rows = f.kind === 'kv' ? 3 : 2; }
    else { el = document.createElement('input'); el.type = f.kind === 'num' ? 'number' : 'text'; }
    if (f.datalist && f.kind !== 'kv') el.setAttribute('list', f.datalist);
    wrap.append(text, el);
  }
  writeField(f, el, v);
  el.addEventListener('input', () => onChange(readField(f, el)));
  el.addEventListener('change', () => onChange(readField(f, el)));
  return wrap;
}
function section(title: string, fields: Field[], target: Obj, extra?: HTMLElement): HTMLElement {
  const card = document.createElement('div');
  card.className = 'card';
  const h = document.createElement('h3');
  h.textContent = title;
  if (extra) h.append(extra);
  const grid = document.createElement('div');
  grid.className = 'grid';
  for (const f of fields) {
    grid.append(fieldEl(f, getAt(target, f.key), (v) => {
      if (v === undefined) { const ks = f.key.split('.'); let n: Obj | undefined = target; for (const k of ks.slice(0, -1)) n = n?.[k] as Obj | undefined; if (n) delete n[ks[ks.length - 1]!]; } else setAt(target, f.key, v);
      changed();
      if (f.key === 'species') refreshAbilities(String(v ?? ''));
    }));
  }
  card.append(h, grid);
  return card;
}
function refreshAbilities(speciesId: string): void {
  const s = content.species.get(speciesId);
  abilityList.innerHTML = s ? [...s.abilities.normal, ...(s.abilities.hidden ? [s.abilities.hidden, 'hidden'] : [])].map((a) => `<option value="${a}">`).join('') : '';
}

// ---- tabs ----
type Tab = 'run' | 'party' | 'profile' | 'json';
let tab: Tab = 'run';
const names: Record<Tab, string> = { run: 'Run', party: 'Party', profile: 'Account', json: 'Spec JSON' };
function render(): void {
  $('tabs').innerHTML = '';
  for (const t of Object.keys(names) as Tab[]) {
    const b = document.createElement('button');
    b.textContent = names[t];
    b.className = t === tab ? 'on' : '';
    b.onclick = () => { tab = t; render(); };
    $('tabs').append(b);
  }
  const panel = $('panel');
  panel.innerHTML = '';
  if (tab === 'run') panel.append(section('Run', RUN_FIELDS, spec));
  if (tab === 'profile') panel.append(section('Account / meta progress', PROFILE_FIELDS, spec.profile as Obj));
  if (tab === 'party') {
    const party = spec.party as Obj[];
    const add = document.createElement('button');
    add.textContent = 'Add Pokémon';
    add.disabled = party.length >= 6;
    add.onclick = () => { party.push({ species: 'pikachu', level: 50 }); changed(); render(); };
    panel.append(add);
    party.forEach((mon, i) => {
      const rm = document.createElement('button');
      rm.textContent = 'Remove';
      rm.onclick = () => { party.splice(i, 1); changed(); render(); };
      const card = section(`#${i + 1} ${String(mon.species ?? '')}`, MON_FIELDS, mon, rm);
      card.querySelector('input[list="dl-species"]')?.addEventListener('focus', (e) => refreshAbilities((e.target as HTMLInputElement).value));
      panel.append(card);
    });
  }
  if (tab === 'json') {
    const ta = document.createElement('textarea');
    ta.id = 'json';
    ta.value = JSON.stringify(spec, null, 2);
    ta.onchange = () => { try { spec = JSON.parse(ta.value) as Obj; spec.profile ??= {}; spec.party ??= []; changed(); setMsg('Spec loaded.', true); } catch (e) { setMsg(`Not valid JSON: ${(e as Error).message}`, false); } };
    const note = document.createElement('small');
    note.textContent = 'The same JSON works with: node tools/savegen.ts spec.json. Edit and click outside the box to apply.';
    panel.append(note, ta);
  }
}

// ---- output ----
function setMsg(text: string, ok: boolean): void { $('msg').className = ok ? 'ok' : 'bad'; $('msg').textContent = text; }
let timer = 0;
function changed(): void { persist(); window.clearTimeout(timer); timer = window.setTimeout(check, 250); }
function build(): { file: string; report: string[] } | null {
  try { return generateSave(content, spec); } catch (e) { setMsg((e as Error).message, false); return null; }
}
function check(): void { const r = build(); if (r) setMsg(r.report.join('\n'), true); }
function download(name: string, text: string): void {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}
function action(label: string, fn: () => void, cls = ''): void { const b = document.createElement('button'); b.textContent = label; b.className = cls; b.onclick = fn; $('actions').append(b); }
action('Download save', () => { const r = build(); if (r) { download(`pocket-raiders-save-${String(spec.seed ?? 'save')}.json`, r.file); setMsg(r.report.join('\n') + '\nDownloaded.', true); } }, 'go');
action('Download spec', () => download('savegen-spec.json', JSON.stringify(spec, null, 2)));
action('Load spec / save file…', () => {
  const inp = document.createElement('input');
  inp.type = 'file';
  inp.accept = '.json';
  inp.onchange = async () => {
    const text = await inp.files?.[0]?.text();
    if (!text) return;
    try { spec = JSON.parse(text) as Obj; spec.profile ??= {}; spec.party ??= []; changed(); render(); } catch (e) { setMsg(`Not valid JSON: ${(e as Error).message}`, false); }
  };
  inp.click();
});
const presets = import.meta.glob('../../tools/savegen/presets/*.json', { eager: true, import: 'default' }) as Record<string, Obj>;
const sel = document.createElement('select');
sel.innerHTML = '<option value="">Presets…</option>' + Object.keys(presets).map((p) => `<option value="${p}">${p.replace(/.*\//, '').replace('.json', '')}</option>`).join('');
sel.onchange = () => { if (sel.value) { spec = structuredClone(presets[sel.value]!); spec.profile ??= {}; spec.party ??= []; sel.value = ''; changed(); render(); } };
$('actions').append(sel);
action('Reset', () => { spec = defaultSpec() as Obj; spec.profile = {}; changed(); render(); });

render();
check();
