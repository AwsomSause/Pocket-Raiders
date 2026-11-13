// Beta 0.6 minigames: The Day the Center Closed, beds version (Kice's Triage pick). Pick a patient, put them in one of 3
// beds (that stops them getting worse), then use the right supply on them. Worst first; supplies run out. A tick is one
// fixed beat; outcomes never depend on animation.

import { Rng } from '../rng';
import type { BaseState, Cell, MinigameModule } from './games';

const CONDS = ['Poisoned', 'Burned', 'Paralyzed', 'Fainted'] as const;
const SUPPLIES = ['Antidote', 'Burn Heal', 'Paralyze Heal', 'Revive'] as const;
const NAMES = ['Pidgey', 'Rattata', 'Growlithe', 'Magikarp', 'Zubat', 'Oddish', 'Geodude', 'Meowth', 'Psyduck', 'Machop'];
const BEDS = 3;
interface Patient {
  name: string;
  /** Index into CONDS (and the supply that cures it). */
  cond: number;
  /** 1 low, 2 mid, 3 high risk: points when saved, and how fast health drops while waiting. */
  sev: number;
  hp: number;
  status: 'wait' | 'bed' | 'saved' | 'lost';
}
interface BedsState extends BaseState {
  patients: Patient[];
  beds: (number | null)[];
  supplies: number[];
  /** The patient picked and waiting for a bed. */
  sel: number | null;
  /** The bedded patient the next supply goes to. */
  target: number | null;
  points: number;
  best: number;
  ticks: number;
}
const beds: MinigameModule<BedsState> = {
  start(_c, p, rs) {
    const r = new Rng(rs);
    const names = r.shuffle([...NAMES]);
    const patients: Patient[] = Array.from({ length: p.patients! }, (_, i) => ({ name: names[i % names.length]!, cond: r.int(0, 3), sev: r.int(1, 3), hp: p.hp!, status: 'wait' }));
    // One supply per patient of that condition, minus a few (the worst are always covered).
    const supplies = [0, 0, 0, 0];
    for (const q of patients) supplies[q.cond]! += 1;
    let cut = p.short!;
    for (const q of [...patients].sort((a, b) => a.sev - b.sev)) if (cut > 0 && supplies[q.cond]! > 0) { supplies[q.cond]! -= 1; cut -= 1; }
    const coverable = [...patients];
    const left = [...supplies];
    let best = 0;
    for (const q of coverable.sort((a, b) => b.sev - a.sev)) if (left[q.cond]! > 0) { left[q.cond]! -= 1; best += q.sev; }
    return { ...base(r.state), patients, beds: Array.from({ length: BEDS }, () => null), supplies, sel: null, target: null, points: 0, best: Math.max(1, best), ticks: p.ticks! };
  },
  view(_c, s) {
    const cells: Cell[] = [];
    for (const [i, q] of s.patients.entries()) {
      cells.push({ id: `p${i}`, label: q.name, detail: q.status === 'wait' ? `${CONDS[q.cond]} · ${['', 'LOW', 'MID', 'HIGH'][q.sev]} · hp ${q.hp}` : q.status, tone: q.status === 'saved' ? 'good' : q.status === 'lost' ? 'bad' : s.sel === i ? 'hot' : q.status === 'bed' ? 'info' : 'dim', disabled: s.done || q.status !== 'wait' });
    }
    for (let b = 0; b < BEDS; b++) {
      const who = s.beds[b];
      cells.push({ id: `b${b}`, label: `Bed ${b + 1}`, detail: who !== null && who !== undefined ? s.patients[who]!.name : s.sel !== null ? 'put here' : 'empty', tone: who !== null && who !== undefined ? 'info' : 'dim', disabled: s.done });
    }
    for (const [k, n] of SUPPLIES.entries()) cells.push({ id: `s${k}`, label: n, detail: `x${s.supplies[k]}`, tone: 'good', disabled: s.done || (s.supplies[k] ?? 0) <= 0 });
    return { hud: [`Saved: ${s.points}/${s.best}`, `Time: ${s.ticks}`, s.msg], prompt: 'Pick a patient, then a bed. Then pick the supply that cures the bedded patient. Worst first.', cols: 4, cells, done: s.done, portraits: ['chansey', ...s.patients.filter((q) => q.status === 'wait' || q.status === 'bed').map((q) => q.name.toLowerCase())] };
  },
  act(_c, s, id) {
    if (s.done) return;
    const kind = id[0];
    const n = Number(id.slice(1));
    if (kind === 'p') {
      if (s.patients[n]?.status === 'wait') s.sel = n;
    } else if (kind === 'b') {
      if (n < 0 || n >= BEDS) return;
      if (s.sel !== null && s.beds[n] === null) {
        s.beds[n] = s.sel;
        s.patients[s.sel]!.status = 'bed';
        s.sel = null;
        s.msg = 'In bed.';
      } else if (s.sel !== null) s.msg = 'That bed is taken.';
      else if (s.beds[n] !== null) {
        s.target = s.beds[n]!;
        s.msg = `${s.patients[s.target]!.name} is ready for a supply.`;
      }
    } else if (kind === 's') {
      if (!SUPPLIES[n] || s.supplies[n]! <= 0) return;
      // The supply goes to the bedded patient you picked, or the first bed with someone in it.
      const bed = s.target !== null ? s.beds.indexOf(s.target) : s.beds.findIndex((w) => w !== null);
      if (bed < 0) {
        s.msg = 'Nobody is in a bed.';
        return;
      }
      const who = s.beds[bed]!;
      const q = s.patients[who]!;
      s.supplies[n]! -= 1;
      if (q.cond === n) {
        q.status = 'saved';
        s.points += q.sev;
        s.msg = `${q.name} is better!`;
      } else s.msg = `That did not help ${q.name}.`;
      if (q.cond === n) {
        s.beds[bed] = null;
        s.target = null;
      }
    }
  },
  tick(_c, s) {
    if (s.done) return;
    s.ticks -= 1;
    for (const q of s.patients) {
      if (q.status !== 'wait') continue;
      q.hp -= q.sev;
      if (q.hp <= 0) {
        q.status = 'lost';
        s.msg = `${q.name} could not wait.`;
      }
    }
    if (s.sel !== null && s.patients[s.sel]!.status !== 'wait') s.sel = null;
    if (s.ticks <= 0 || s.patients.every((q) => q.status === 'saved' || q.status === 'lost') || !s.supplies.some((n) => n > 0)) s.done = true;
  },
  result: (s) => ({ score: Math.min(s.points, s.best), max: s.best }),
};
function base(rs: BaseState['rs']): BaseState {
  return { rs, done: false, msg: '', tick: 0 };
}

export const MINIGAMES_11: Record<string, MinigameModule<never>> = { 'triage-beds': beds as never };
