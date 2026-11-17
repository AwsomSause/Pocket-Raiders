// Developer tools (shown in dev mode, or with ?debug=1 in the address).
// Press F2 or ` (backtick) to show/hide. Old look: one long panel at the right. New look: the mock-up's window at the
// top left (Scene, Seed, RNG stream, FPS) whose six tags each unfold one tool.

import type Phaser from 'phaser';
import { calcStats } from '../core/pokemon';
import { currentColumn, findNode } from '../core/map';
import { runLevelCap } from '../core/regions';
import { currentEnemy, type RunState } from '../core/state';
import { topMoments } from '../core/story/record';
import { getTheme, themePool } from '../core/themes';
import type { GameSession } from '../game/GameSession';
import { services } from '../game/services';
import { startFpsMeter } from '../game/deviceTools';
import { STREAM_NAMES } from '../core/rng';
import { isAssisted } from '../core/tools/assisted';
import { runDigest } from '../core/tools/replay';
import { STORY_ICONS, storyIconScale } from '../assets/storyIcons';
import { mountTool, reduxOn } from '../ui/redux/stage';
import { eventRows, filterRows, momentRows } from './momentViewer';

let iconGalleryOpen = false;
let momentsOpen = false;
let momentQuery = '';
let eventQuery = '';

/** The New look's tags, in the mock-up's order. */
export const DEBUG_TABS = ['Scene jump', 'Story log', 'Asset viewer', 'Moment viewer', 'Save creator', 'Extended Cut'] as const;
let tab = 0;
/** New look: the chosen tag's tool is unfolded under the tags (it opens folded, as the mock-up draws it). */
let unfolded = false;

function el<K extends keyof HTMLElementTagNameMap>(tag: K, props: Partial<HTMLElementTagNameMap[K]> = {}, children: (Node | string)[] = []): HTMLElementTagNameMap[K] {
  const node = Object.assign(document.createElement(tag), props);
  for (const c of children) node.append(c);
  return node;
}

/** The story layer, live: newest events first, then the chronicle's top moments and each Pokémon's history. */
function storyLog(run: RunState, claims = 0): string {
  const story = run.story;
  const where = (w: RunState['story']['events'][number]['where']) =>
    `R${w.region + 1}${w.stage !== null ? ` S${w.stage + 1}` : ''}${w.level !== null ? ` L${w.level}` : ''}${w.battle !== null ? ` B${w.battle}` : ''}${w.turn !== null ? ` T${w.turn}` : ''}`;
  const counts = new Map<string, number>();
  for (const e of story.events) counts.set(e.type, (counts.get(e.type) ?? 0) + 1);
  const lines = [
    `seed ${run.seed}  ·  rule version ${run.rules.ruleVersion ?? '?'}  ·  profile claims ${claims}`,
    `event counts: ${[...counts].sort((a, b) => b[1] - a[1]).map(([t, n]) => `${t}×${n}`).join(', ') || 'none'}`,
    '',
    ...story.events
    .slice(-40)
    .reverse()
    .map((e) => `#${e.seq} ${e.type} [${e.actors.join(',')}] ${where(e.where)} ${Object.entries(e.data).map(([k, v]) => `${k}=${v}`).join(' ')}`),
  ];
  lines.push('', 'top moments:', ...topMoments(story).map((m) => `  (${m.importance}) ${m.text}`));
  lines.push('', 'histories:');
  for (const h of Object.values(story.histories)) {
    lines.push(`  ${h.uid} ${h.speciesId}: ${h.battles} battles, KOs ${h.knockoutsDealt}/${h.knockoutsTaken}, close calls ${h.closeCalls}, survived ${h.survivedFatal}, bosses ${h.bossesBeaten}, low-HP stand ${h.longestLowHpStand}, ${h.memories.length} memories`);
  }
  if (run.battle?.storyEffects.length) lines.push('', `battle ledger: ${run.battle.storyEffects.join(', ')}`);
  lines.push(`run ledger: ${story.appliedEffects.length} effect ids  ·  major moments this battle: ${story.majorCuesThisBattle}`);
  return lines.join('\n');
}

export function installDebugPanel(game: Phaser.Game, session: GameSession): void {
  const panel = el('div', { id: 'debug-panel' });
  panel.hidden = true;
  document.body.append(panel);
  // New look: the same tools inside the mock-up's window, on a layer that turns and scales with the game.
  let tool: HTMLElement | null = null;
  let win: HTMLElement | null = null;
  let shown = false;
  let lastFps = 0;
  /** The stream whose state moved since the last look (its name and state), for the "RNG stream" line. */
  let seen: Record<string, string> = {};
  let moved = '';

  const activeScene = () => game.scene.getScenes(true)[0] ?? null;
  const goTo = (key: string) => {
    const current = activeScene();
    if (current) current.scene.start(key);
  };
  const fail = (err: unknown) => alert(String(err));

  // --- the run: where it is, and the jumps
  const runInfo = (run: RunState): Node[] => {
    const content = session.content, out: Node[] = [];
    const bag = Object.entries(run.inventory).map(([id, n]) => `${id}×${n}`).join(', ') || '(empty)';
    const lines = [`seed: ${run.seed}`, `trainer: ${run.archetypeId}`, `phase: ${run.phase}`, `encounters done: ${run.encountersCompleted}`, `money: ₽${run.money}  candies: ${run.candies}`, `bag: ${bag}`];
    for (const mon of run.party) {
      const s = calcStats(content, mon);
      lines.push(`${mon.speciesId} Lv${mon.level} HP ${mon.hp}/${s.hp} XP ${mon.xp} status ${mon.status?.id ?? '-'}`);
      lines.push(`  atk ${s.atk} def ${s.def} spa ${s.spa} spd ${s.spd} spe ${s.spe}`);
    }
    if (run.battle) {
      const enemy = currentEnemy(run.battle);
      const who = run.battle.trainer ? `${run.battle.trainer.name}'s ` : 'wild ';
      lines.push(`enemy: ${who}${enemy.speciesId}${enemy.shiny ? ' (shiny)' : ''} Lv${enemy.level} HP ${enemy.hp} (${run.battle.enemyIndex + 1}/${run.battle.enemyTeam.length}, turn ${run.battle.turn})`);
    }
    if (run.battle?.levelInfo.length) {
      lines.push('enemy levels (base + progress + variance + archetype + bonus = level):');
      run.battle.levelInfo.forEach((b, i) => {
        const f = (n: number) => (Math.round(n * 100) / 100).toString();
        const clamp = b.unclamped !== b.level ? ` (clamped from ${f(b.unclamped)})` : '';
        lines.push(`  #${i + 1}: ${f(b.base)} + ${f(b.progress)} + ${f(b.party ?? 0)} + ${f(b.variance)} + ${f(b.archetypeOffset)} + ${f(b.bonus)} = Lv${b.level}${clamp}`);
      });
    }
    if (run.pending.length) lines.push(`pending: ${run.pending.map((d) => d.kind).join(', ')}`);
    if (run.draft) lines.push(`draft: ${run.draft.join(', ')}`);
    out.push(el('pre', { textContent: lines.join('\n') }));
    // F206: where each named random stream is now (changes with every roll from it), and the run digest the replay validator compares.
    const streamLines = STREAM_NAMES.map((n) => { const r = run.rng[n]; return `${n.padEnd(9)} ${[r.a, r.b].map((v) => (v >>> 0).toString(16).padStart(8, '0')).join(' ')}`; });
    out.push(el('h3', { textContent: `RNG streams${isAssisted(run) ? '  ·  run is ASSISTED' : ''}` }), el('pre', { textContent: `${streamLines.join('\n')}\ndigest ${runDigest(run)}` }));

    const regionLines = [
      `campaign: ${run.campaignId}  ·  region ${run.regionIndex + 1}/${run.regionOrder.length}: ${run.regionOrder[run.regionIndex] ?? '-'}  ·  level cap ${runLevelCap(content, run)}`,
      `region order: ${run.regionOrder.join(' → ') || '(not set yet)'}`,
      `regions cleared: ${run.regionsCleared.join(', ') || '-'}${run.victory ? '  ·  VICTORY' : ''}`,
    ];
    out.push(el('h3', { textContent: 'Region' }), el('pre', { textContent: regionLines.join('\n') }));
    if (run.phase === 'map' && run.stage?.kind === 'stage') {
      out.push(el('button', { textContent: 'Jump to the Pokémon League', onclick: () => { try { session.debugJumpToLeague(); goTo('Map'); } catch (err) { fail(err); } render(); } }));
    }

    if (run.stage) {
      const stage = run.stage;
      const theme = getTheme(content, stage.themeId);
      const node = stage.current ? findNode(stage.map, stage.current) : null;
      const pool = themePool(content, theme).map((p) => `${p.speciesId}${p.weight > 1 ? `×${p.weight}` : ''}`).join(', ');
      const stageLines = [
        stage.kind === 'league' ? `Pokémon League (champion's last theme: ${theme.name})` : `stage ${stage.index + 1}: ${theme.name} (${theme.types.join('/')})`,
        stage.kind === 'league' ? `elite four: ${stage.eliteFour.join(', ')}  ·  champion: ${stage.leaderId}` : `gym leader: ${stage.leaderId}  ·  badges: ${run.badges.join(', ') || '-'}`,
        `level ${currentColumn(stage)}/${stage.map.columns}  ·  trainer columns: ${stage.map.trainerColumns.join(', ')}`,
        `node: ${node ? `${node.id} — ${node.note}` : '(start)'}`,
        `wild pool: ${pool}`,
        `used themes: ${run.usedThemes.length}  ·  used leaders: ${run.usedLeaders.join(', ')}`,
      ];
      out.push(el('h3', { textContent: 'Stage' }), el('pre', { textContent: stageLines.join('\n') }));
      if (run.phase === 'map') {
        const colInput = el('input', { type: 'number', value: String(stage.map.columns), min: '1', max: String(stage.map.columns) });
        colInput.style.width = '50px';
        out.push(el('span', { textContent: 'Jump so the next column is ' }), colInput,
          el('button', { textContent: 'Jump', onclick: () => { try { session.debugJumpToColumn(Number(colInput.value) || 0); goTo('Map'); } catch (err) { fail(err); } render(); } }));
      }
    }
    return out;
  };

  const story = (run: RunState): Node[] => [
    el('h3', { textContent: `Story Log (${run.story.seq} events, ${run.story.chronicle.length} in the chronicle)` }),
    el('pre', { textContent: storyLog(run, Object.keys(session.profile.claims ?? {}).length) }),
  ];

  // --- the run: heal, add, give, replace
  const runTools = (run: RunState): Node[] => {
    const content = session.content, out: Node[] = [];
    out.push(el('button', { textContent: 'Heal party', onclick: () => { session.debugHeal(); if (run.phase === 'battle') goTo('Battle'); render(); } }));

    const addSpecies = el('select', {}, [...content.species.values()].map((s) => el('option', { value: s.id, textContent: s.name })));
    const addLevel = el('input', { type: 'number', value: '10', min: '1', max: '100' });
    addLevel.style.width = '50px';
    out.push(el('h3', { textContent: 'Add Pokémon to party' }), addSpecies, addLevel,
      el('button', { textContent: 'Add', onclick: () => { try { session.debugAddToParty(addSpecies.value, Number(addLevel.value) || 10); } catch (err) { fail(err); } render(); } }));

    const itemSelect = el('select', {}, [...content.items.values()].map((i) => el('option', { value: i.id, textContent: i.name })));
    out.push(el('h3', { textContent: 'Give item' }), itemSelect,
      el('button', { textContent: 'Give 5', onclick: () => { session.debugGiveItem(itemSelect.value, 5); render(); } }));

    if (run.phase === 'battle') {
      const speciesSelect = el('select', {}, [...content.species.values()].map((s) => el('option', { value: s.id, textContent: s.name })));
      const levelInput = el('input', { type: 'number', value: '5', min: '1', max: '100' });
      levelInput.style.width = '50px';
      out.push(el('h3', { textContent: 'Replace wild Pokémon' }), speciesSelect, levelInput,
        el('button', { textContent: 'Replace', onclick: () => { session.debugReplaceEnemy(speciesSelect.value, Number(levelInput.value) || 5); goTo('Battle'); } }));
    }
    return out;
  };

  // --- new run with a seed
  const newRun = (): Node[] => {
    const content = session.content;
    const seedInput = el('input', { placeholder: 'seed (blank = random)' });
    const archetypeSelect = el('select', {}, [...content.archetypes.values()].map((a) => el('option', { value: a.id, textContent: a.name })));
    const campaignSelect = el('select', {}, [...content.campaigns.values()].map((c) => el('option', { value: c.id, textContent: c.name })));
    return [el('h3', { textContent: 'New run with seed' }), seedInput, archetypeSelect, campaignSelect, el('button', {
      textContent: 'Start',
      onclick: () => { session.newRun(archetypeSelect.value, seedInput.value.trim() || undefined, campaignSelect.value); goTo('StarterSelect'); render(); },
    })];
  };

  // --- moment viewer and "force this encounter" (Overhaul dev console); `always` leaves the fold button out
  const moments = (always: boolean): Node[] => {
    const out: Node[] = [];
    if (!always) out.push(el('button', { textContent: momentsOpen ? 'Hide moment viewer' : 'Moment viewer', onclick: () => { momentsOpen = !momentsOpen; render(); } }));
    if (always || momentsOpen) {
      const q = el('input', { placeholder: 'filter moments', value: momentQuery });
      q.oninput = () => { momentQuery = q.value; showMoments(); };
      const list = el('pre', { id: 'moment-list' });
      list.style.cssText = 'max-height:240px;overflow:auto;white-space:pre-wrap';
      const showMoments = () => {
        const rows = filterRows(momentRows(), momentQuery);
        list.textContent = `${rows.length} shown\n` + rows.slice(0, 80).map((r) => `[${r.source}] ${r.name} (${r.category}, ${r.budget})\n  ${r.text}`).join('\n');
      };
      showMoments();
      out.push(q, list);
    }
    const run = session.run;
    if (run && run.phase === 'map' && run.stage) {
      out.push(el('h3', { textContent: 'Force an event' }));
      const eq = el('input', { placeholder: 'filter events', value: eventQuery });
      const sel = el('select', { id: 'force-event' });
      const fill = () => { sel.replaceChildren(...filterRows(eventRows(session.content), eventQuery).map((e) => el('option', { value: e.id, textContent: `${e.name} [${e.stop}] (${e.id})` }))); };
      eq.oninput = () => { eventQuery = eq.value; fill(); };
      fill();
      out.push(eq, sel, el('button', {
        textContent: 'Open event',
        onclick: () => {
          if (!sel.value) return;
          try { const sideId = session.debugForceEvent(sel.value); const cur = activeScene(); if (cur) cur.scene.start('Event', { sideId }); } catch (err) { fail(err); }
          render();
        },
      }));
    }
    return out;
  };

  // --- story icon gallery (slice P7): every pack icon at 2x, named by catalog id; then the asset count and what is missing
  const assetNodes = (): Node[] => {
    const out: Node[] = [el('button', { textContent: iconGalleryOpen ? 'Hide icon gallery' : `Icon gallery (${STORY_ICONS.length})`, onclick: () => { iconGalleryOpen = !iconGalleryOpen; render(); } })];
    if (iconGalleryOpen) {
      const grid = el('div', { id: 'icon-gallery' });
      grid.style.cssText = 'display:flex;flex-wrap:wrap;gap:4px;max-height:260px;overflow:auto';
      for (const i of STORY_ICONS) {
        const img = el('img', { src: `${import.meta.env.BASE_URL}assets/${i.path}`, title: i.id, alt: i.id });
        const k = storyIconScale(64, i.size);
        img.style.cssText = `image-rendering:pixelated;width:${i.size * k}px;height:${i.size * k}px;background:#444`;
        grid.append(img);
      }
      out.push(grid);
    }
    const { assets } = services();
    out.push(el('h3', { textContent: `Assets: ${assets.entries().length} loaded, ${assets.missing.length} missing, ${assets.failed.length} failed` }));
    const problems = [...assets.missing.map((m) => `missing ${m.id}: ${m.files.join(', ')}`), ...assets.failed.map((f) => `failed ${f}`)];
    if (problems.length) out.push(el('pre', { textContent: problems.join('\n') }));
    return out;
  };

  const noRun = (): Node[] => [el('pre', { textContent: 'No active run.' })];

  /** Old look: everything in one long panel. */
  const renderOld = () => {
    panel.replaceChildren();
    const run = session.run;
    panel.append(el('h3', { textContent: 'DEBUG (F2 to hide)' }));
    panel.append(el('pre', { textContent: `scene: ${activeScene()?.scene.key ?? '-'}\nstorage: ${session.saves.storageName}\nlast save error: ${session.lastSaveError ?? 'none'}` }));
    panel.append(el('h3', { textContent: 'Run' }));
    if (run) panel.append(...runInfo(run), ...story(run), ...runTools(run));
    else panel.append(...noRun());
    panel.append(...newRun(), ...moments(false), ...assetNodes());
  };

  /** The "RNG stream" line: the stream that rolled since the last look and where it stands now. */
  const streamLine = (run: RunState | null): string => {
    if (!run) return '-';
    const now: Record<string, string> = {};
    for (const n of STREAM_NAMES) now[n] = [run.rng[n].a, run.rng[n].b].map((v) => (v >>> 0).toString(16).padStart(8, '0')).join('');
    const changed = STREAM_NAMES.filter((n) => seen[n] !== undefined && seen[n] !== now[n]);
    if (changed.length) moved = changed[changed.length - 1]!;
    seen = now;
    const name = moved || STREAM_NAMES[0]!;
    return `${name} #${now[name]!.slice(0, 8)}`;
  };

  const fact = (key: string, value: string): HTMLElement => el('div', { className: 'row sm' }, [el('span', { className: 'grow', textContent: key }), el('b', { textContent: value })]);

  /** The chosen tag's tool. */
  const toolNodes = (): Node[] => {
    const run = session.run, name = DEBUG_TABS[tab];
    if (name === 'Scene jump') return [el('pre', { textContent: `storage: ${session.saves.storageName}\nlast save error: ${session.lastSaveError ?? 'none'}` }), ...(run ? [...runInfo(run), ...runTools(run)] : noRun()), ...newRun()];
    if (name === 'Story log') return run ? story(run) : noRun();
    if (name === 'Asset viewer') return assetNodes();
    if (name === 'Moment viewer') return moments(true);
    if (name === 'Save creator') {
      return [
        el('pre', { textContent: 'Builds a save file from a form: run, profile and party fields. It opens in its own tab.' }),
        el('button', { textContent: 'Open the Save Creator', onclick: () => { window.open(`${import.meta.env.BASE_URL}savegen.html`, '_blank', 'noopener'); } }),
      ];
    }
    const note = el('pre', { textContent: 'Jumps this run into the Extended Cut climax (Kanto phases) and opens the map. Needs a run on the map.' });
    return [note, el('button', {
      textContent: 'Jump to the Extended Cut',
      onclick: () => {
        const ok = (window as unknown as { __pkr?: { extendedCut?: () => boolean } }).__pkr?.extendedCut?.() ?? false;
        note.textContent = ok ? 'The run is in the Extended Cut now.' : 'No run on the map: nothing changed.';
      },
    })];
  };

  /** New look: the mock-up's window. */
  const renderNew = () => {
    tool ??= mountTool(game, 'debug');
    if (!win) {
      win = el('div', { id: 'rx-debug', className: 'win abs hit dbg' });
      tool.append(win);
    }
    const run = session.run;
    const tags = el('div', { className: 'row' }, DEBUG_TABS.map((name, k) => {
      const t = el('span', { className: `tg${k === tab ? '' : ' no'}`, textContent: name });
      t.dataset.tab = String(k);
      t.onclick = () => {
        unfolded = k === tab ? !unfolded : true;
        tab = k;
        render();
      };
      return t;
    }));
    tags.style.cssText = 'flex-wrap:wrap;gap:6px';
    const sceneFact = fact('Scene', `${activeScene()?.scene.key ?? '-'}Scene`), fpsFact = fact('FPS', lastFps ? String(lastFps) : '--');
    sceneFact.dataset.fact = 'scene';
    fpsFact.dataset.fact = 'fps';
    const nodes: Node[] = [el('b', { className: 'acc', textContent: 'Debug panel' }), sceneFact, fact('Seed', run?.seed ?? '-'), fact('RNG stream', streamLine(run)), fpsFact, tags];
    if (unfolded) nodes.push(el('div', { className: 'dbg-tool' }, toolNodes()));
    win.replaceChildren(...nodes);
  };

  const render = () => {
    const rx = shown && reduxOn();
    panel.hidden = !shown || rx;
    if (win) win.hidden = !rx;
    // The frame rate has its own line in the New window, so the corner meter steps aside while that is open.
    fps.hidden = rx;
    if (!shown) return;
    if (rx) renderNew();
    else renderOld();
  };

  window.addEventListener('keydown', (e) => {
    if (e.key === 'F2' || e.key === '`') {
      shown = !shown;
      render();
      e.preventDefault();
    }
  });
  session.onChange(render);

  // Frame rate, top right, while the debug flag is on.
  const fps = el('div', { id: 'fps-meter', textContent: '-- fps' });
  document.body.append(fps);
  startFpsMeter((n) => {
    lastFps = n;
    fps.textContent = `${n} fps`;
    // The New window's two live lines are kept current without rebuilding the form under them.
    if (!win || win.hidden) return;
    const set = (key: string, value: string) => { const b = win!.querySelector(`[data-fact="${key}"] b`); if (b && b.textContent !== value) b.textContent = value; };
    set('fps', String(n));
    set('scene', `${activeScene()?.scene.key ?? '-'}Scene`);
  });
}
