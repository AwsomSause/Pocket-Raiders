// DOMINION redesign R4 (pass 50): the Trainers group's Boss card (mockup `tcard`, kind bc25 + bc45). Front: name,
// HQ level, money, crew, Heat and day beside the Boss, the Goal bar and the eight Gym marks; back: the Boss's skills,
// best job, the Hero and the Goal. Display only.

import './r4.css';
import { esc, frame, map, spr, type R5Run, type R5Speaker } from './kit';

export interface R5BossCard {
  name: string;
  /** "ID No. 03142": a number for the run, from its seed (looks only). */
  idNo: string;
  pic: string;
  facts: readonly [string, string][];
  goal: { pct: number; label: string };
  /** The eight Gyms: badge sprite and whose it is (nova = yours). */
  gyms: readonly { k: string; who: 'nova' | 'next' | 'free'; name: string }[];
  back: readonly [string, string][];
  speaker: R5Speaker | null;
  line: string;
}

export function r5BossCard(c: R5BossCard, run: R5Run): string {
  const dl = map(c.facts, ([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`);
  const card = `<div class="bcw25"><div class="bc25" data-m="card" data-testid="dom-bosscard"><div class="bh"><b>BOSS CARD</b><em>ID No. ${esc(c.idNo)}</em></div>
    <div class="bb"><dl>${dl}</dl><span class="pt">${c.pic}</span></div>
    <div class="xb45"><b>GOAL</b><span><i style="width:${Math.max(0, Math.min(100, c.goal.pct))}%"></i></span><em>${esc(c.goal.label)}</em></div>
    <div class="bd"><b>Gym marks</b><span class="gm45">${map(c.gyms, (g, i) => `<i class="g-${g.who}" style="--d:${i * 70}ms" title="${esc(g.name)}">${spr(g.k, 1)}</i>`)}</span></div></div></div>`;
  const back = `<section class="pn bcb25" data-m="det"><h3><i>The back</i></h3>${map(c.back, ([k, v], i) => `<div class="bk25" style="--i:${i};--d:${i * 70}ms"><b>${esc(k)}</b><em>${esc(v)}</em></div>`)}</section>`;
  return frame({
    id: 'tcard', g: 'Trainers', kind: 'bc25 k-bc45', bg: 'roof', run,
    top: { title: 'Boss card', sub: `Day ${run.day}`, crumb: ['Start', 'start'] },
    body: `${card}\n  ${back}`,
    who: c.speaker, line: c.line, ctas: [['Back', 'tcardBack', '', 'dom-bosscard-back']],
    keys: [['Esc', 'back', 'tcardBack']], noTabs: true,
  });
}
