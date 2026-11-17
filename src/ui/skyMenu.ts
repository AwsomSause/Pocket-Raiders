// Team Sky's screens (HOENN_TEAMS 7.9 to 7.13): the Hub, the Roster (hire and promote), the Dispatch Board, the
// Doctrine and the Base, as tabs of one glass list. Opens from the map's menu once Sky is founded. Every change goes
// through GameSession.skyAct; this file only draws what core/evil/teamSky.ts says.

import type Phaser from 'phaser';
import { skyFounded, cantGo, doctrineMatchups, doctrinePreview, flawOf, missionChance, missionNodes, nextRankNeeds, originOf, rankName, SKY, skyBase, skyCaps, skyRenown, teamSkyOf, todayLines, traitOf, windowLine } from '../core/evil/teamSky';
import type { SkyGrunt, SkyHow, SkyMission, TeamSkyState } from '../core/evil/teamSkySchema';
import { TYPE_NAMES } from '../core/contentSchema';
import { services } from '../game/services';
import type { FieldMenuHost } from './fieldMenus';
import { fitLine } from './fitText';
import { Picker, type PickerRow } from './partyPanel';
import { textStyle } from './theme';

const TABS = ['Hub', 'Roster', 'Hire', 'Dispatch', 'Doctrine', 'Base'] as const;
type Row = { title: string; right: string; hint: string; problem?: string | null; pct?: number; tag?: string; run?: () => void };

export function hasTeamSky(): boolean {
  const run = services().session.run;
  return !!run && skyFounded(run);
}

const feathers = (n: number): string => '▮'.repeat(n) + '▯'.repeat(10 - n);
const dots = (n: number): string => '●'.repeat(n) + '○'.repeat(5 - n);

function rowOf(r: Row): PickerRow {
  return {
    problem: r.problem ?? null,
    hint: r.hint,
    ...(r.pct !== undefined ? { board: { title: r.title, sub: r.right, pct: r.pct, tag: r.tag ?? '' } } : {}),
    draw: (scene: Phaser.Scene, box: Phaser.GameObjects.Container, w: number) => {
      box.add(fitLine(scene.add.text(14, 9, r.title, textStyle(19, '#ffffff')), Math.max(120, w - 300)));
      box.add(fitLine(scene.add.text(w - 12, 11, r.right, textStyle(16, '#c8f0c0')).setOrigin(1, 0), 280));
    },
  };
}

function list(host: FieldMenuHost, title: string, rows: Row[], back: () => void, tab?: number): void {
  const picker: Picker = new Picker(host.scene, {
    glass: true,
    title,
    columns: 1,
    rowHeight: 40,
    rows: rows.map(rowOf),
    ...(tab !== undefined ? { tabs: { labels: TABS, index: tab, onChange: (i: number) => { picker.close(); openTab(host, i); } } } : {}),
    onSelect: (i) => { const r = rows[i]; if (r?.run && !r.problem) { picker.close(); r.run(); } },
    onBack: () => { picker.close(); back(); },
  });
  host.setPicker(picker);
}

function act(host: FieldMenuHost, action: Parameters<ReturnType<typeof services>['session']['skyAct']>[0], then: () => void): void {
  host.changed(services().session.skyAct(action));
  then();
}

const state = (): TeamSkyState => teamSkyOf(services().session.run!)!;

export function openSkyMenu(host: FieldMenuHost): void {
  if (!teamSkyOf(services().session.run!)) services().session.skyAct({ kind: 'open' });
  openTab(host, 0);
}

function openTab(host: FieldMenuHost, tab: number): void {
  const close = () => host.setPicker(null);
  const s = state();
  const run = services().session.run!;
  const content = services().session.content;
  const caps = skyCaps(run, s);
  const creed = run.story.flags['ev:sky-creed-balance'] ? 'Keep the Balance.' : run.story.flags['ev:sky-creed-small'] ? 'Protect the Small.' : run.story.flags['ev:sky-creed-above'] ? 'Above It All.' : '';
  const title = `Team Sky${creed ? `  "${creed}"` : ''}   Leader: you`;
  let rows: Row[] = [];
  if (tab === 0) {
    const renown = skyRenown(run, s);
    rows = [
      { title: 'Renown', right: `${renown} (the kite climbs)`, hint: `Renown sets how many grunts (${caps.grunts}), squads (${caps.squads}) and Admins (${caps.admins}) Sky can have.`, pct: Math.min(100, Math.round((renown / 36) * 100)), tag: 'kite' },
      { title: 'Funds', right: `₽${s.funds.toLocaleString('en-GB')}`, hint: 'The team chest. Separate from your own wallet.' },
      { title: 'Heat: Magma', right: `${s.heat.magma}/${SKY.heatMax}`, hint: 'How hard Magma is hunting Sky. At full, a raid on the base is possible.', pct: s.heat.magma * 10, tag: s.heat.magma >= SKY.heatMax ? '!' : '' },
      { title: 'Heat: Aqua', right: `${s.heat.aqua}/${SKY.heatMax}`, hint: 'How hard Aqua is hunting Sky. At full, a raid on the base is possible.', pct: s.heat.aqua * 10, tag: s.heat.aqua >= SKY.heatMax ? '!' : '' },
      { title: 'Roster', right: `${s.grunts.length} hired, room for ${caps.grunts}${s.grunts.some((g) => g.cracked) ? '  1 cracked ⚠' : ''}`, hint: 'Hire, promote, talk.', run: () => openTab(host, 1) },
      { title: 'Dispatch', right: `${s.missions.length} missions, ${s.away.length} away`, hint: 'Send squads out.', run: () => openTab(host, 3) },
      { title: 'Doctrine', right: s.doctrine.mode === 'arch' ? SKY.archetypes.find((a) => a.id === s.doctrine.arch)?.name ?? '' : s.doctrine.types.join(', '), hint: 'What your grunts carry.', run: () => openTab(host, 4) },
      { title: 'Base', right: skyBase(run) ? `${s.rooms.length} rooms` : 'none yet', hint: 'Build rooms with Funds.', run: () => openTab(host, 5) },
      ...todayLines(run, s).map((t) => ({ title: 'Today', right: '', hint: t })),
      ...s.reports.slice(0, 4).map((r) => ({ title: `Report: ${r.who}`, right: r.win ? 'done' : 'went wrong', hint: `"${r.text}"` })),
    ];
  } else if (tab === 1) {
    const byRank = [...s.grunts].sort((a, b) => b.rank - a.rank || a.name.localeCompare(b.name));
    rows = byRank.map((g) => {
      const need = nextRankNeeds(run, s, g);
      const crack = g.cracked > 0 ? ` ⚠ cracked: "${SKY.cracked[g.flaw] ?? ''}"` : '';
      return {
        title: `${rankName(g.rank).toUpperCase()}  ${g.name}${g.nick ? ` "${g.nick}"` : ''}${g.captured ? ' (captured)' : g.away ? ' (away)' : ''}`,
        right: `Skill ${dots(g.skill)} Loyal ${feathers(g.loyalty)}`,
        hint: `${originOf(g.origin).name}. + ${traitOf(g.trait).name}, − ${flawOf(g.flaw).name}. ${g.missions} missions. ${need === null ? `Ready for ${rankName(g.rank + 1)}: ₽${SKY.ranks[g.rank + 1]!.cost}.` : need}${g.ace ? ` Ace: ${content.species.get(g.ace)?.name}.` : ''}${crack}`,
        pct: g.loyalty * 10,
        tag: rankName(g.rank),
        run: () => openGrunt(host, g.id),
      };
    });
    if (rows.length === 0) rows = [{ title: 'Nobody yet', right: '', hint: 'Hire from the candidates.' }];
  } else if (tab === 2) {
    rows = s.candidates.map((c) => ({
      title: `${c.name}  ${originOf(c.origin).name}`,
      right: `Skill ${dots(c.skill)} Loyal ${feathers(c.loyalty)}  ${c.fee ? `₽${c.fee}` : 'FREE'}`,
      hint: `+ ${traitOf(c.trait).name} (${traitOf(c.trait).text}) − ${flawOf(c.flaw).name} (${flawOf(c.flaw).text}) "${c.why}"${c.answer ? ` ${c.answer}` : ''}`,
      run: () => openCandidate(host, c.id),
    }));
    rows.push({ title: `Slots ${s.grunts.length}/${caps.grunts}`, right: `Funds ₽${s.funds}`, hint: 'Candidates refresh next stage.' });
  } else if (tab === 3) {
    rows = s.missions.map((m) => ({
      title: `${m.type.toUpperCase()}  ${m.at}`,
      right: `${missionNodes(s, m)} node${missionNodes(s, m) === 1 ? '' : 's'}  Skill ${m.need}`,
      hint: `${m.text} Win: ${winText(m)}. Lose: ${SKY.missions.find((d) => d.type === m.type)!.lose}.`,
      problem: s.away.length >= caps.squads ? 'Every squad is out.' : null,
      run: () => openMission(host, m.id, [], 'quiet'),
    }));
    for (const a of s.away) rows.push({ title: `AWAY: ${a.squad.map((id) => s.grunts.find((g) => g.id === id)?.name ?? '?').join(', ')}`, right: `back in ${a.left} node${a.left === 1 ? '' : 's'}`, hint: `${a.mission.text} (${a.chance}% to succeed)` });
    if (s.intel.length) rows.push({ title: 'Intel', right: s.intel[0]!, hint: 'What the last Watch found.' });
  } else if (tab === 4) {
    const prev = doctrinePreview(content, s);
    const mu = doctrineMatchups(content, s);
    const cost = s.doctrine.set ? `₽${SKY.doctrineCost}` : 'free the first time';
    rows = [
      { title: s.doctrine.mode === 'types' ? '(●) Three types   ( ) One archetype' : '( ) Three types   (●) One archetype', right: s.doctrine.mode === 'arch' ? SKY.archetypes.find((a) => a.id === s.doctrine.arch)?.name ?? '' : s.doctrine.types.join(' / '), hint: `Cost to change: ${cost}.` },
      { title: 'Pick three types', right: '', hint: 'Eighteen types; three can be lit.', run: () => openTypes(host, [...(s.doctrine.mode === 'types' ? s.doctrine.types : [])]) },
      { title: 'Pick one archetype', right: '', hint: 'Eight sets, each with its perk.', run: () => openArch(host) },
      ...prev.map((names, i) => ({ title: `Your ${rankName(i)}s carry`, right: names.join(', ') + (i === 3 ? ' + ACE' : ''), hint: 'A live preview, by rank.' })),
      { title: 'Matchups', right: `vs MAGMA ${mu.magma}   vs AQUA ${mu.aqua}`, hint: "How the doctrine does against Magma's and Aqua's usual teams." },
    ];
  } else {
    const base = skyBase(run);
    rows = base
      ? [
          ...SKY.rooms.map((r) => ({
            title: s.rooms.includes(r.id) ? r.name : `(chalk) ${r.name}`,
            right: s.rooms.includes(r.id) ? 'built' : `₽${r.cost}`,
            hint: s.rooms.includes(r.id) ? (r.id === 'window' ? `Zinnia: ${windowLine(s)}` : r.line) : r.text,
            ...(s.rooms.includes(r.id) ? {} : { run: () => act(host, { kind: 'build', room: r.id }, () => openTab(host, 5)) }),
          })),
          ...(s.rooms.includes('workshop') ? SKY.gadgets.map((g) => ({ title: `Gadget: ${g.name}`, right: s.gadgets.includes(g.id) ? 'made' : `₽${g.cost}`, hint: g.text, ...(s.gadgets.includes(g.id) ? {} : { run: () => act(host, { kind: 'gadget', id: g.id }, () => openTab(host, 5)) }) })) : []),
        ]
      : [{ title: 'No base yet', right: '', hint: 'Sky chooses a base in "The Base" (Act S3).' }];
  }
  list(host, title, rows, close, tab);
}

function winText(m: SkyMission): string {
  const w = SKY.missions.find((d) => d.type === m.type)!.win;
  return [w.renown && `Renown +${w.renown}`, w.loyalty && `Loyalty +${w.loyalty}`, w.recruits && 'recruits', w.funds && `₽${w.funds}`, w.heat && `Heat +${w.heat}`, w.intel && 'the next Operation', w.trouble && 'their Trouble Inside moves on', m.free && 'your grunt back'].filter(Boolean).join(', ');
}

function openCandidate(host: FieldMenuHost, id: string): void {
  const back = () => openTab(host, 2);
  const c = state().candidates.find((x) => x.id === id);
  if (!c) return back();
  const rows: Row[] = [
    ...(c.answer ? [] : SKY.questions.map((q) => ({ title: `Ask: ${q.label}`, right: 'once', hint: 'The answer is always honest.', run: () => act(host, { kind: 'ask', id, q: q.id }, () => openCandidate(host, id)) }))),
    ...(c.answer ? [{ title: 'Their answer', right: '', hint: c.answer }] : []),
    { title: 'Hire', right: c.fee ? `₽${c.fee}` : 'FREE', hint: 'They tie on a green scarf.', run: () => act(host, { kind: 'hire', id }, () => openTab(host, 1)) },
    { title: 'Not now', right: '', hint: 'They stay on the board until next stage.', run: back },
  ];
  list(host, c.name, rows, back);
}

function openGrunt(host: FieldMenuHost, id: string): void {
  const back = () => openTab(host, 1);
  const s = state();
  const run = services().session.run!;
  const content = services().session.content;
  const g = s.grunts.find((x) => x.id === id);
  if (!g) return back();
  const need = nextRankNeeds(run, s, g);
  const rows: Row[] = [
    ...SKY.talk.lines.map((line, i) => ({ title: `Talk: ${line}`, right: g.talked === s.tick ? 'talked' : '', hint: `Their flaw (${flawOf(g.flaw).name}) decides which line works.`, problem: g.talked === s.tick ? 'Once a stage.' : null, run: () => act(host, { kind: 'talk', id, line: i }, () => openGrunt(host, id)) })),
    { title: `Promote to ${rankName(Math.min(3, g.rank + 1))}`, right: need === null ? `₽${SKY.ranks[g.rank + 1]!.cost}` : '', hint: need ?? SKY.ranks[g.rank + 1]!.gains, problem: need, run: () => act(host, { kind: 'promote', id }, back) },
    ...(g.rank >= 3 ? SKY.orders.map((o) => ({ title: `Orders: ${o.name}`, right: g.orders === o.id ? '✔' : '', hint: o.text, run: () => act(host, { kind: 'orders', id, orders: o.id }, () => openGrunt(host, id)) })) : []),
    ...(g.rank >= 3 ? (SKY.aces[g.trait] ?? []).map((sp) => ({ title: `Ace: ${content.species.get(sp)?.name ?? sp}`, right: g.ace === sp ? '✔' : '', hint: `Offered for a ${traitOf(g.trait).name}.`, run: () => act(host, { kind: 'ace', id, species: sp }, () => openGrunt(host, id)) })) : []),
    ...(g.rank >= 2 && !g.gift ? [{ title: 'Give one of mine', right: `${run.box.length} in Box`, hint: 'This Pokémon becomes theirs. Loyalty +2.', problem: run.box.length ? null : 'Your Box is empty.', run: () => openGive(host, id) }] : []),
    ...(g.gift ? [{ title: 'Ask for yours back', right: 'Loyalty −3', hint: 'It goes back to your Box.', run: () => act(host, { kind: 'takeBack', id }, () => openGrunt(host, id)) }] : []),
    { title: 'Dismiss', right: g.cracked ? '' : 'Loyalty −1 for all', hint: 'They hand back the scarf.', run: () => act(host, { kind: 'dismiss', id }, back) },
  ];
  list(host, `${rankName(g.rank)} ${g.name}`, rows, back);
}

function openGive(host: FieldMenuHost, id: string): void {
  const run = services().session.run!;
  const content = services().session.content;
  const rows: Row[] = run.box.map((p, i) => ({ title: content.species.get(p.speciesId)?.name ?? p.speciesId, right: `Lv ${p.level}`, hint: 'This Pokémon becomes theirs. Loyalty +2.', run: () => act(host, { kind: 'give', id, box: i }, () => openGrunt(host, id)) }));
  list(host, 'Give one of mine', rows, () => openGrunt(host, id));
}

function openMission(host: FieldMenuHost, id: string, squad: string[], how: SkyHow): void {
  const back = () => openTab(host, 3);
  const s = state();
  const m = s.missions.find((x) => x.id === id);
  if (!m) return back();
  const picked = squad.map((x) => s.grunts.find((g) => g.id === x)).filter((g): g is SkyGrunt => !!g);
  const ch = missionChance(s, m, picked, how);
  const rows: Row[] = [
    { title: `Success ${ch.chance}%`, right: ch.parts.map((p) => `${p.who} ${p.delta >= 0 ? '+' : ''}${p.delta}`).join('  '), hint: ch.parts.map((p) => `${p.who} ${p.delta >= 0 ? '+' : ''}${p.delta} (${p.why})`).join('; ') || 'Pick a squad.' },
    ...(['quiet', 'bold', 'kind'] as const).map((h) => ({ title: `How: ${SKY.how[h].name}`, right: how === h ? '●' : '○', hint: SKY.how[h].text, run: () => openMission(host, id, squad, h) })),
    ...s.grunts.map((g) => {
      const why = cantGo(s, g, m);
      const on = squad.includes(g.id);
      return { title: `${on ? '[x]' : '[ ]'} ${rankName(g.rank)} ${g.name}`, right: `Skill ${dots(g.skill)} + ${traitOf(g.trait).name}`, hint: why ?? `− ${flawOf(g.flaw).name}`, problem: on ? null : why, run: () => openMission(host, id, on ? squad.filter((x) => x !== g.id) : squad.length >= 3 ? squad : [...squad, g.id], how) };
    }),
    { title: 'SEND', right: `Win: ${winText(m)}`, hint: `Lose: ${SKY.missions.find((d) => d.type === m.type)!.lose}.`, problem: picked.length ? null : 'Pick one to three grunts.', run: () => act(host, { kind: 'send', mission: id, squad, how }, back) },
    { title: 'GO MYSELF', right: '', hint: "You can always go in person: it's played as the story's own events. Leave it on the board.", run: back },
  ];
  list(host, `${m.type.toUpperCase()}: ${m.at}`, rows, back);
}

function openTypes(host: FieldMenuHost, lit: string[]): void {
  const back = () => openTab(host, 4);
  const rows: Row[] = [
    ...TYPE_NAMES.map((t) => ({ title: `${lit.includes(t) ? '✔' : ' '} ${t[0]!.toUpperCase()}${t.slice(1)}`, right: '', hint: lit.length >= 3 && !lit.includes(t) ? `Picking a fourth drops ${lit[0]}.` : 'Pick three.', run: () => openTypes(host, lit.includes(t) ? lit.filter((x) => x !== t) : [...lit, t].slice(-3)) })),
    { title: 'CONFIRM', right: lit.join(' / '), hint: state().doctrine.set ? `Costs ₽${SKY.doctrineCost}.` : 'Free the first time.', problem: lit.length === 3 ? null : 'Pick three.', run: () => act(host, { kind: 'types', types: lit }, back) },
  ];
  list(host, 'Doctrine: three types', rows, back);
}

function openArch(host: FieldMenuHost): void {
  const back = () => openTab(host, 4);
  const content = services().session.content;
  const rows: Row[] = SKY.archetypes.map((a) => ({ title: a.name, right: a.pool.slice(0, 4).map((id) => content.species.get(id)?.name ?? id).join(', ') || 'whatever they had', hint: a.perk, run: () => act(host, { kind: 'arch', arch: a.id }, back) }));
  list(host, 'Doctrine: one archetype', rows, back);
}
