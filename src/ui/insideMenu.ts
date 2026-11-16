// The Team Hub (HOENN_TEAMS 7.1): who you are inside the team, what they want, and how closely they're looking.
// Opens from the map's menu while you're inside any team's route; Magma and Aqua get the crew, pay and the Hand In
// Uniform button with its confirm step. Draws what core/evil says; the one change goes through GameSession.

import type Phaser from 'phaser';
import { insideOn, rankOf, rankTitle, routeOf, standingOf, suspicionOf } from '../core/evil/inside';
import { evilOf, evilTeam } from '../core/evil/teams';
import { services } from '../game/services';
import type { FieldMenuHost } from './fieldMenus';
import { fitLine } from './fitText';
import { Picker } from './partyPanel';
import { textStyle } from './theme';

type Row = { title: string; right: string; hint: string; pct?: number; run?: () => void };
const CREW: Record<string, { bunk: string; lt: string; admin: string; leader: string; mark: string; motto: string }> = {
  magma: { bunk: 'Ottoway', lt: 'Tabitha', admin: 'Courtney', leader: 'Maxie', mark: '▲', motto: 'More land.' },
  aqua: { bunk: 'Marisca', lt: 'Shelly', admin: 'Matt', leader: 'Archie', mark: '◆', motto: 'More sea.' },
};
const LINE: Record<string, string> = { Tabitha: '"Hoo hah."', Courtney: '"Analysing."', Shelly: '"Ahahaha."', Matt: '"Hoo-ah!"' };

export function hasTeamHub(): boolean {
  const run = services().session.run;
  if (!run) return false;
  const team = evilTeam(services().session.content, run);
  return !!team && insideOn(run, team.id);
}

function list(host: FieldMenuHost, title: string, rows: Row[], back: () => void): void {
  const picker: Picker = new Picker(host.scene, {
    glass: true,
    title,
    columns: 1,
    rowHeight: 40,
    rows: rows.map((r) => ({
      problem: null,
      hint: r.hint,
      ...(r.pct !== undefined ? { board: { title: r.title, sub: r.right, pct: r.pct, tag: '' } } : {}),
      draw: (scene: Phaser.Scene, box: Phaser.GameObjects.Container, w: number) => {
        box.add(fitLine(scene.add.text(14, 9, r.title, textStyle(19, '#ffffff')), Math.max(120, w - 300)));
        box.add(fitLine(scene.add.text(w - 12, 11, r.right, textStyle(16, '#ffd0a0')).setOrigin(1, 0), 280));
      },
    })),
    onSelect: (i) => { const r = rows[i]; if (r?.run) { picker.close(); r.run(); } },
    onBack: () => { picker.close(); back(); },
  });
  host.setPicker(picker);
}

export function openTeamHub(host: FieldMenuHost): void {
  const { content, run } = { content: services().session.content, run: services().session.run! };
  const team = evilTeam(content, run);
  if (!team) return host.setPicker(null);
  const region = run.regionOrder[run.regionIndex];
  const route = routeOf(team, region);
  const rank = rankOf(run, team.id, route);
  const st = standingOf(run, team.id);
  const su = suspicionOf(run, team.id);
  const steps = route?.steps ?? [2, 4, 6, 8, 10];
  const next = steps.find((n) => n > st) ?? route?.max ?? 10;
  const crew = CREW[team.id];
  const mark = crew?.mark ?? '▲';
  const test = route?.test ?? 7;
  const out = route?.out ?? 10;
  const word = su >= out ? 'marked' : su >= test ? 'doubted' : su >= 2 ? 'watched' : 'trusted';
  const eyes = Array.from({ length: 5 }, (_, i) => (su >= (i + 1) * 2 ? '◉' : '○')).join(' ');
  const flag = (k: string) => Number(run.story.flags[`ev:${k}`] ?? 0);
  const rows: Row[] = [
    { title: `RANK: ${rankTitle(team, region, rank).toUpperCase()}`, right: `${mark.repeat(rank)}${'△'.repeat(6 - rank)} ·`, hint: `${team.name}, "${team.goal}". The seventh place is drawn and never fillable: ${team.ranks.leader.name}.` },
    { title: 'Standing', right: `${st}/${next}`, hint: 'Fills toward the next rank.', pct: Math.min(100, Math.round((st / Math.max(1, next)) * 100)) },
    { title: 'Suspicion', right: `${eyes}  ${word}`, hint: `Each two points opens an eye. The Direct Question comes at ${test}; at ${out} you're found out.`, pct: su * 10 },
  ];
  const running = evilOf(run).ops.filter((o) => o.region === run.regionIndex && o.outcome === 'running');
  for (const o of running) rows.push({ title: `Orders: ${team.ops.find((x) => x.id === o.id)?.name ?? o.id}`, right: 'NEW', hint: team.ops.find((x) => x.id === o.id)?.text ?? '' });
  if (crew) {
    const trust = flag('hoenn-bunkmate-trust');
    rows.push(
      { title: `${crew.bunk}`, right: `bunkmate ${'♥'.repeat(Math.min(5, trust))}${'♡'.repeat(Math.max(0, 3 - trust))}`, hint: 'Their trust, as hearts.' },
      { title: crew.lt, right: LINE[crew.lt] ?? '', hint: 'The lieutenant.' },
      { title: crew.admin, right: LINE[crew.admin] ?? '', hint: 'The Admin.' },
      { title: crew.leader, right: flag('hoenn-inside-act4') > 0 || rank >= 5 ? `"${crew.motto}"` : '── not yet ──', hint: 'The leader. Locked until Act 4.' },
    );
    const pay = route?.pay?.[rank - 1] ?? 0;
    rows.push({ title: 'Pay', right: `₽${pay} a stage`, hint: 'Paid at the start of each stage while you wear the uniform.' });
    rows.push({ title: 'HAND IN UNIFORM', right: '', hint: 'Leave the team. A confirm step says what is lost.', run: () => confirmHandIn(host) });
  }
  list(host, `${team.name}: Team Hub`, rows, () => host.setPicker(null));
}

function confirmHandIn(host: FieldMenuHost): void {
  const rows: Row[] = [
    { title: 'Hand it in', right: 'can\'t be undone', hint: 'You lose your rank, Standing, Suspicion and pay, and the inside story. The outside story resumes.', run: () => { host.changed(services().session.handInUniform()); host.setPicker(null); } },
    { title: 'Keep it on', right: '', hint: 'You put it back on.', run: () => openTeamHub(host) },
  ];
  list(host, 'Hand In Uniform?', rows, () => openTeamHub(host));
}
