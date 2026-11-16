// Rival questline panels for the New UI (Catalog Overhaul row 12). Pure HTML builders from the kit; the screens that own the
// event, map and battle views mount them (the UI thread wires them in). Data comes from core/rivals/questlines.ts:
// rivalStanding (EventView.standing), circuitBoard, raceRivalColumn and questBattleMeter.
import { esc, W } from '../kit';

export interface Standing { rank: string; meters: readonly { label: string; value: number; max: number }[] }
export interface Meter { label: string; value: number; max: number }

const bar = (m: Meter, color: string): string => {
  const pct = m.max > 0 ? Math.round((Math.max(0, Math.min(m.max, m.value)) / m.max) * 100) : 0;
  return `<div class="row sm" style="gap:8px;align-items:center"><span style="width:84px">${esc(m.label)}</span><div class="hp" style="flex:1;--c:${color}"><i style="width:${pct}%;background:${color}"></i></div><b style="width:36px;text-align:right">${m.value}/${m.max}</b></div>`;
};

/** The event screen's side panel for a rival scene: what they call you, and Trust, Friendship and Respect. */
export function rivalStandingPanel(s: Standing, st = 'position:absolute;right:20px;top:64px;width:260px'): string {
  return W(`<div class="row"><b class="grow">Your rival</b></div><div class="row sm" style="opacity:.85">${esc(s.rank)}</div>${s.meters.map((m) => bar(m, '#9a5ad8')).join('')}`, st, 'rival-standing', ' data-testid="rival-standing"');
}

/** R1 The Circuit: the ladder strip for the map header (your rung and the rival's, out of 16). */
export function circuitStrip(board: { you: number; rival: number }, rungs = 16, st = 'position:absolute;left:50%;top:8px;transform:translateX(-50%);width:360px'): string {
  const dot = (n: number, c: string, who: string) => (n > 0 ? `<i title="${who}" style="position:absolute;left:${((n - 1) / (rungs - 1)) * 100}%;top:-3px;width:12px;height:12px;border-radius:6px;background:${c};transform:translateX(-50%)"></i>` : '');
  return W(`<div class="row sm"><b class="grow">The Circuit</b><span>You ${board.you || '-'} · Rival ${board.rival}</span></div><div style="position:relative;height:6px;margin:8px 6px;background:#0003;border-radius:3px">${dot(board.rival, '#d8483a', 'Rival')}${dot(board.you, '#3d8bea', 'You')}</div>`, st, 'circuit-strip', ' data-testid="circuit-strip"');
}

/** R23 The Race: the rival's marker on the race map, drawn at a node's position (the map screen passes x and y). */
export function raceRivalMarker(x: number, y: number, sprite = ''): string {
  return `<div class="foot race-rival" data-testid="race-rival" style="left:${x}px;top:${y - 28}px;pointer-events:none">${sprite ? `<img src="${esc(sprite)}" style="height:28px;image-rendering:pixelated">` : '<b style="color:#d8483a">Rival</b>'}</div>`;
}

/** R16 Wants to Stop and R18 the midnight clock: the meter for the battle header. */
export function questMeterBar(m: Meter, st = 'position:absolute;left:50%;top:8px;transform:translateX(-50%);width:300px'): string {
  return W(bar(m, m.label === 'Wants to Stop' ? '#3fae5a' : '#d8a810'), st, 'quest-meter', ' data-testid="quest-meter"');
}
