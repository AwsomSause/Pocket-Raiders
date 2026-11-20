import { test, type Page } from '@playwright/test';
import { appendFileSync, mkdirSync } from 'node:fs';
import { fitIssues } from './helpers/textFit';

// Remake sweep (REMAKE_SWEEP=1): opens every screen of the main game, clicks every button it finds (two levels deep),
// and writes what it saw to $REMAKE_OUT/results.jsonl plus a screenshot per page. Used to label what needs a remake.
test.skip(!process.env.REMAKE_SWEEP, 'set REMAKE_SWEEP=1');
test.describe.configure({ mode: 'parallel' });

const OUT = process.env.REMAKE_OUT ?? 'test-results/remake';
mkdirSync(`${OUT}/shots`, { recursive: true });
const log = (row: Record<string, unknown>) => appendFileSync(`${OUT}/results.jsonl`, JSON.stringify(row) + '\n');
const active = (page: Page) => page.evaluate(() => (window as any).__pkr?.activeScene() ?? null);
const slug = (s: string) => s.replace(/[^a-z0-9-]+/gi, '_').slice(0, 90);

async function look(page: Page) {
  const key = await active(page);
  const dom = await page.evaluate((key) => {
    const shown = (e: Element) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && +cs.opacity > 0.05; };
    const stages = [...document.querySelectorAll('#rx .stage')].filter(shown) as HTMLElement[];
    const st = stages.find((s) => s.dataset.scene === key) ?? stages[0] ?? null;
    const acts = stages.flatMap((s) => [...s.querySelectorAll('[data-act]')].filter(shown).map((e) => ({ act: (e as HTMLElement).dataset.act!, arg: (e as HTMLElement).dataset.arg ?? '', text: (e.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 50) })));
    const cut = stages.flatMap((s) => [...s.querySelectorAll('*')].filter((e) => {
      if (!shown(e) || !(e.textContent ?? '').trim() || e.children.length > 0) return false;
      const cs = getComputedStyle(e);
      return (cs.overflow !== 'visible' || cs.textOverflow === 'ellipsis') && (e.scrollWidth > e.clientWidth + 2 || e.scrollHeight > e.clientHeight + 3);
    }).map((e) => (e.textContent ?? '').trim().slice(0, 50)));
    const broken = [...document.querySelectorAll('#rx img')].filter((i) => shown(i) && (i as HTMLImageElement).complete && (i as HTMLImageElement).naturalWidth === 0).map((i) => i.getAttribute('src'));
    const head = st ? (st.querySelector('h1,h2,.title,.ttl,[class*=head]')?.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 60) : '';
    return { newUi: !!st, stages: stages.map((s) => s.dataset.scene), acts, cut: [...new Set(cut)].slice(0, 15), broken: [...new Set(broken)].slice(0, 15), head, text: st ? (st.textContent ?? '').replace(/\s+/g, ' ').slice(0, 300) : '' };
  }, key);
  const canvas = await page.evaluate(() => {
    const game = (window as any).__pkr.game;
    let missing = 0, texts = 0;
    const walk = (l: any[]) => l.forEach((o) => { if (o.list) walk(o.list); if (o.texture?.key === '__MISSING') missing++; if (o.type === 'Text' && o.visible) texts++; });
    for (const s of game.scene.getScenes(true)) walk(s.children.list);
    return { missing, texts };
  });
  const fit = dom.newUi ? [] : (await fitIssues(page).catch(() => [])).slice(0, 12);
  return { key, ...dom, ...canvas, fit };
}

/** Records one page (screenshot + look) under `label`. */
async function record(page: Page, label: string, extra: Record<string, unknown> = {}, errs: string[] = []) {
  const l = await look(page);
  const shot = `${slug(label)}.png`;
  await page.screenshot({ path: `${OUT}/shots/${shot}` }).catch(() => undefined);
  log({ label, shot, ...l, errors: errs.splice(0), ...extra });
  return l;
}

function watch(page: Page) {
  const errs: string[] = [];
  page.on('pageerror', (e) => errs.push(e.message.slice(0, 200)));
  page.on('console', (m) => m.type() === 'error' && errs.push(m.text().slice(0, 200)));
  return errs;
}

async function boot(page: Page) {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/?ui=new&seed=remake-sweep');
  await test.expect.poll(() => active(page), { timeout: 120_000 }).toBe('MainMenu');
  await page.waitForTimeout(800);
}

async function toMap(page: Page) {
  for (const next of ['Hub', 'TrainerSelect', 'RunPrep', 'StarterSelect', 'Briefing', 'Map']) {
    await test.expect.poll(async () => { if ((await active(page)) !== next) await page.keyboard.press('Enter'); return active(page); }, { timeout: 40_000, intervals: [1500] }).toBe(next);
    await page.waitForTimeout(400);
  }
  await test.expect.poll(() => page.evaluate(() => (window as any).__pkr.game.scene.getScene('Map').busy), { timeout: 90_000 }).toBe(false);
}

const snapRun = (page: Page) => page.evaluate(() => { const p = (window as any).__pkr; (window as any).__snap = p.session.run ? JSON.stringify(p.session.run) : null; (window as any).__snapProfile = JSON.stringify(p.session.profile ?? null); });

/** Puts the game back on `key` with the saved run, then replays `path` (act indexes). Returns false if a step vanished. */
async function restore(page: Page, key: string, data: unknown, path: { act: string; arg: string }[]) {
  await page.keyboard.press('Escape').catch(() => undefined);
  await page.evaluate(([k, d]) => {
    const p = (window as any).__pkr;
    const w = window as any;
    if (w.__snap) p.session.run = JSON.parse(w.__snap);
    const g = p.game;
    for (const s of g.scene.getScenes(true)) if (s.scene.key !== k) g.scene.stop(s.scene.key);
    g.scene.start(k as string, d ?? undefined);
  }, [key, data] as const);
  await test.expect.poll(() => active(page), { timeout: 20_000 }).toBe(key);
  await page.waitForTimeout(700);
  for (const step of path) {
    const loc = page.locator(`#rx .stage [data-act="${step.act}"][data-arg="${step.arg.replace(/"/g, '\\"')}"]`).first();
    if (!(await loc.count())) return false;
    await loc.dispatchEvent('click').catch(() => undefined);
    await page.waitForTimeout(700);
  }
  return true;
}

/** Clicks every button on `key` (and on whatever each opens, one more level), recording each new page. */
async function sweep(page: Page, errs: string[], key: string, data: unknown, label: string, depth = 2, budget = { left: 220 }) {
  const seen = new Set<string>();
  const queue: { path: { act: string; arg: string }[]; label: string }[] = [{ path: [], label }];
  while (queue.length && budget.left > 0) {
    const cur = queue.shift()!;
    if (!(await restore(page, key, data, cur.path))) { log({ label: cur.label, gone: true }); continue; }
    const base = await look(page);
    const acts = base.acts.filter((a, i, all) => all.findIndex((b) => b.act === a.act && b.arg === a.arg) === i).slice(0, 45);
    for (const a of acts) {
      if (budget.left-- <= 0) break;
      if (/^(quit|reset|wipe|delete|erase)/i.test(a.act)) { log({ label: `${cur.label} > ${a.text || a.act}`, skipped: 'destructive' }); continue; }
      if (!(await restore(page, key, data, cur.path))) break;
      const before = await page.evaluate(() => document.querySelector('#rx')?.innerHTML.length ?? 0);
      const loc = page.locator(`#rx .stage [data-act="${a.act}"][data-arg="${a.arg.replace(/"/g, '\\"')}"]`).first();
      const clicked = await loc.click({ timeout: 1500 }).then(() => true).catch(() => loc.dispatchEvent('click').then(() => 'forced', (e) => String(e).slice(0, 80)));
      await page.waitForTimeout(1100);
      const after = await look(page);
      const changed = after.key !== base.key || after.acts.map((x) => x.act + x.arg).join() !== base.acts.map((x) => x.act + x.arg).join() || (await page.evaluate(() => document.querySelector('#rx')?.innerHTML.length ?? 0)) !== before;
      const name = `${cur.label} > ${a.text || a.act}`;
      const sig = `${after.key}|${after.head}|${after.acts.map((x) => x.act).sort().join(',')}`;
      const fresh = !seen.has(sig);
      seen.add(sig);
      if (fresh && changed) {
        await record(page, name, { from: cur.label, act: a.act, arg: a.arg, clicked }, errs);
        if (cur.path.length + 1 < depth && after.key === key && after.newUi) queue.push({ path: [...cur.path, { act: a.act, arg: a.arg }], label: name });
      } else log({ label: name, act: a.act, clicked, changed, dup: !fresh, key: after.key, errors: errs.splice(0) });
    }
  }
}

test('front door, hub and map: every button', async ({ page }) => {
  test.setTimeout(3_600_000);
  const errs = watch(page);
  await boot(page);
  await snapRun(page);
  await record(page, 'MainMenu', {}, errs);
  await sweep(page, errs, 'MainMenu', undefined, 'MainMenu', 2, { left: 160 });
  await boot(page);
  await toMap(page);
  await page.evaluate(() => { const { session } = (window as any).__pkr; session.run.money = 5000; });
  await snapRun(page);
  for (const k of ['Hub', 'TrainerSelect', 'RunPrep', 'StarterSelect', 'Briefing', 'Map']) {
    await restore(page, k, undefined, []).catch(() => undefined);
    await record(page, k, {}, errs);
  }
  await sweep(page, errs, 'Hub', undefined, 'Hub', 2, { left: 260 });
  await sweep(page, errs, 'Map', undefined, 'Map', 2, { left: 160 });
});

test('hub, town and map menus deeper', async ({ page }) => {
  test.setTimeout(5_400_000);
  const errs = watch(page);
  await boot(page);
  await toMap(page);
  await page.evaluate(() => { const { session } = (window as any).__pkr; session.run.money = 5000; });
  await snapRun(page);
  for (const part of (process.env.DEEP ?? 'Map,Settings').split(',')) await sweep(page, errs, part, undefined, part.toUpperCase(), 3, { left: 400 });
});

test('every scene opened from a run', async ({ page }) => {
  test.setTimeout(1_800_000);
  const errs = watch(page);
  await boot(page);
  await toMap(page);
  await snapRun(page);
  const keys: string[] = await page.evaluate(() => (window as any).__pkr.game.scene.scenes.map((s: any) => s.scene.key));
  for (const k of keys) {
    if (k === 'Boot') continue;
    const ok = await restore(page, k, undefined, []).then(() => true).catch((e) => String(e).slice(0, 120));
    await page.waitForTimeout(800);
    await record(page, `scene ${k}`, { opened: ok, now: await active(page) }, errs);
  }
});

test('battle: every command, move and page', async ({ page }) => {
  test.setTimeout(1_800_000);
  const errs = watch(page);
  await boot(page);
  await toMap(page);
  await page.evaluate(() => {
    const { session, game } = (window as any).__pkr;
    const node = session.run.stage.map.nodes.find((n: any) => n.column === 1 && ['wild', 'trainer', 'battle'].includes(n.kind)) ?? session.run.stage.map.nodes.find((n: any) => n.column === 1);
    session.chooseNode(node.id);
    game.scene.getScene('Map').scene.start('Battle');
  });
  await test.expect.poll(() => active(page), { timeout: 30_000 }).toBe('Battle');
  for (let i = 0; i < 14; i++) { await page.keyboard.press('Enter'); await page.waitForTimeout(500); }
  await record(page, 'Battle commands', {}, errs);
  // Every command button and what it opens (no restore: battle state cannot be rebuilt, so go back with Escape).
  const cmds = (await look(page)).acts;
  for (const c of cmds) {
    const loc = page.locator(`#rx .stage [data-act="${c.act}"][data-arg="${c.arg}"]`).first();
    if (!(await loc.count())) continue;
    if (/run|flee/i.test(c.text + c.act)) { log({ label: `Battle > ${c.text}`, skipped: 'ends battle' }); continue; }
    await loc.click({ timeout: 2500 }).catch(() => undefined);
    await page.waitForTimeout(900);
    await record(page, `Battle > ${c.text || c.act}`, { act: c.act }, errs);
    const sub = (await look(page)).acts.filter((a) => !cmds.some((b) => b.act === a.act && b.arg === a.arg)).slice(0, 12);
    for (const s of sub.slice(0, 1)) log({ label: `Battle > ${c.text} sub`, acts: sub.map((x) => x.text || x.act) , first: s.text });
    for (let i = 0; i < 3; i++) { await page.keyboard.press('Escape'); await page.waitForTimeout(300); }
  }
  // Fight with each move in turn until the battle ends, recording every turn.
  for (let turn = 0; turn < 12 && (await active(page)) === 'Battle'; turn++) {
    await page.keyboard.press('Escape');
    const fight = page.locator('#rx .stage [data-act]').filter({ hasText: /fight/i }).first();
    if (await fight.count()) await fight.click({ timeout: 2500 }).catch(() => undefined);
    await page.waitForTimeout(700);
    if (turn === 0) await record(page, 'Battle > Fight moves', {}, errs);
    const moves = page.locator('#rx .stage [data-act="move"], #rx .stage [data-act="fight"]');
    const n = await moves.count();
    if (n) await moves.nth(turn % n).click({ timeout: 2500 }).catch(() => undefined); else await page.keyboard.press('Enter');
    for (let i = 0; i < 10; i++) { await page.waitForTimeout(500); await page.keyboard.press('Enter'); }
    await record(page, `Battle turn ${turn + 1}`, {}, errs);
  }
  await record(page, 'After battle', {}, errs);
});

const SHOPS = ['mart', 'boutique', 'bazaar', 'depot', 'pokenet', 'night'];
const EXPEDITIONS = ['ember-trail', 'wanderers-road', 'grand-crossing', 'frozen-pass', 'ruins-run', 'mega-gauntlet', 'hollow-of-masks', 'dune-trek', 'sky-ascent', 'scale-summit', 'borrowed-team', 'draft-cup'];
const MINIGAMES = ['pokemon-memory', 'catching-challenge', 'rhythm-challenge', 'berry-foraging', 'knowledge-quiz', 'fossil-excavation', 'fishing-challenge', 'battle-puzzle', 'type-match', 'pokemon-tracking', 'berry-growing', 'trainers-trial', 'treasure-hunt', 'reaction-challenge', 'maze-runner', 'lock-picking', 'sky-race', 'safari-steps', 'sliding-puzzle', 'berry-blending', 'camp-cooking'];

test('shops, expeditions, minigames, run end', async ({ page }) => {
  test.setTimeout(3_600_000);
  const errs = watch(page);
  await boot(page);
  await toMap(page);
  await snapRun(page);
  const node = `const run = pkr.session.run; const node = run.stage.map.nodes.find((n) => n.id === run.stage.current) ?? run.stage.map.nodes[0]; run.stage.current = node.id; const sid = 'sw-' + Math.random().toString(36).slice(2, 8);`;
  const go = async (label: string, setup: string, arg: unknown) => {
    await restore(page, 'Map', undefined, []).catch(() => undefined);
    const r = await page.evaluate(([code, a]) => { try { new Function('pkr', 'arg', code as string)((window as any).__pkr, a); return 'ok'; } catch (e) { return String(e).slice(0, 150); } }, [setup, arg] as const);
    await page.waitForTimeout(1800);
    await record(page, label, { start: r, now: await active(page) }, errs);
  };
  for (const t of SHOPS) await go(`shop ${t}`, `${node} node.sides.push({ id: sid, kind: 'shop', used: false }); pkr.session.visitSide(sid); if (run.shop) run.shop.type = arg; pkr.game.scene.getScene('Map').scene.start('Shop', { type: arg });`, t);
  for (const id of EXPEDITIONS) await go(`expedition ${id}`, `${node} node.sides.push({ id: sid, kind: 'expedition', expeditionId: arg, used: false }); pkr.session.beginExpedition(sid); pkr.game.scene.getScene('Map').scene.start('Expedition');`, id);
  for (const id of MINIGAMES) await go(`minigame ${id}`, `${node} node.sides.push({ id: sid, kind: 'minigame', minigameId: arg, used: false }); pkr.session.beginMinigame(sid, 1); pkr.game.scene.getScene('Map').scene.start('Minigame');`, id);
  await go('league map', `pkr.session.debugJumpToLeague(); pkr.game.scene.getScene('Map').scene.restart();`, 0);
  await go('game over (win)', `pkr.session.run.victory = true; pkr.session.run.phase = 'over'; pkr.game.scene.getScene('Map').scene.start('GameOver');`, 0);
  await go('game over (loss)', `pkr.session.run.phase = 'over'; pkr.game.scene.getScene('Map').scene.start('GameOver');`, 0);
  for (const k of ['Credits', 'HallOfFame', 'LegacyGallery', 'Memories', 'Prologue', 'Tutorial', 'Welcome', 'Town', 'Plaza', 'Siege', 'Trade', 'FieldTrial', 'Format', 'Story', 'Decision']) await go(`scene ${k}`, `pkr.game.scene.getScene('Map').scene.start(arg, { returnTo: 'Map', from: 'Map' });`, k);
});

test('events: every event opens', async ({ page }) => {
  test.setTimeout(6 * 3_600_000);
  const errs = watch(page);
  await boot(page);
  await toMap(page);
  await snapRun(page);
  const part = Number(process.env.EVENT_PART ?? 0), parts = Number(process.env.EVENT_PARTS ?? 1);
  const all: { id: string; src: string }[] = await page.evaluate(() => {
    const ev = (window as any).__pkr.session.content.events;
    const list = ev instanceof Map ? [...ev.values()] : Array.isArray(ev) ? ev : Object.values(ev);
    return list.map((e: any) => ({ id: e.id, src: e.source ?? e.pack ?? e.category ?? '' }));
  });
  const step = Number(process.env.EVENT_STEP ?? 1);
  const mine = all.filter((_, i) => i % step === 0).filter((_, i) => i % parts === part);
  const shotOf = new Set<string>();
  for (const [n, e] of mine.entries()) {
    const r = await page.evaluate((id) => {
      const p = (window as any).__pkr; const w = window as any;
      p.session.run = JSON.parse(w.__snap);
      const run = p.session.run; const node = run.stage.map.nodes.find((n: any) => n.id === run.stage.current) ?? run.stage.map.nodes[0];
      run.stage.current = node.id;
      const sid = 'sw-' + id; node.sides.push({ id: sid, kind: 'event', used: false, eventId: id });
      const g = p.game; const from = g.scene.getScenes(true)[0];
      try { from.scene.start('Event', { sideId: sid }); return 'ok'; } catch (x) { return String(x).slice(0, 120); }
    }, e.id);
    await test.expect.poll(() => active(page), { timeout: 6000 }).toBe('Event').catch(() => undefined);
    await page.waitForTimeout(500);
    const now = await active(page);
    const want = n % 20 === 0 || errs.length > 0 || now !== 'Event';
    if (want) { shotOf.add(e.src); await record(page, `event ${e.id}`, { src: e.src, start: r, now }, errs); }
    else { const l = await look(page); log({ label: `event ${e.id}`, src: e.src, now, newUi: l.newUi, cut: l.cut, broken: l.broken, missing: l.missing, acts: l.acts.length, errors: errs.splice(0) }); }
  }
});

test('special stops: Galar gym, raid, totem, plaza, trade, siege', async ({ page }) => {
  test.setTimeout(1_800_000);
  const errs = watch(page);
  const fresh = async () => { await boot(page); await toMap(page); };
  const mapCall = async (code: string) => page.evaluate((c) => new Function('pkr', c)((window as any).__pkr), code);
  const waitMap = async () => { await test.expect.poll(() => active(page), { timeout: 30_000 }).toBe('Map'); await test.expect.poll(() => page.evaluate(() => (window as any).__pkr.game.scene.getScene('Map').busy), { timeout: 90_000 }).toBe(false); };
  const steps = async (label: string, n: number, key = 'Enter', gap = 900) => { for (let i = 0; i < n; i++) { await page.keyboard.press(key); await page.waitForTimeout(gap); if (i % 3 === 2) await record(page, `${label} ${i + 1}`, {}, errs); } };

  // Galar gym (stadium battle)
  await fresh();
  await mapCall(`const { session, game } = pkr; const run = session.run; run.regionOrder = ['galar', ...run.regionOrder.filter((r) => r !== 'galar')]; run.regionIndex = 0; const node = run.stage.map.nodes.find((n) => n.column === 1); node.kind = 'gym'; session.chooseNode(node.id); game.scene.getScene('Map').scene.start('Battle');`);
  await test.expect.poll(() => active(page), { timeout: 30_000 }).toBe('Battle');
  for (const t of [1500, 3000, 5000, 8000]) { await page.waitForTimeout(t / 2); await record(page, `galar gym intro ${t}`, {}, errs); }
  await steps('galar gym', 12);

  // Raid den
  await fresh();
  await mapCall(`const run = pkr.session.run; const node = run.stage.map.nodes.find((n) => n.column === 1); node.sides.push({ id: 'sw-raid', kind: 'raid', raidId: 'sleeping-snorlax', used: false }); run.stage.current = node.id; pkr.game.scene.getScene('Map').scene.restart({ focus: 0 });`);
  await waitMap();
  await mapCall(`pkr.game.scene.getScene('Map').openRaid('sw-raid');`);
  await page.waitForTimeout(900); await record(page, 'raid preview', {}, errs);
  await page.keyboard.press('Enter'); await page.waitForTimeout(900); await record(page, 'raid prep', {}, errs);
  await page.keyboard.press('Enter');
  await test.expect.poll(() => active(page), { timeout: 30_000 }).toBe('Battle').catch(() => undefined);
  await page.waitForTimeout(2500); await record(page, 'raid battle', {}, errs);
  await steps('raid battle', 12);

  // Totem
  await fresh();
  await mapCall(`const run = pkr.session.run; const node = run.stage.map.nodes.find((n) => n.column === 1); node.sides.push({ id: 'sw-totem', kind: 'totem', totemId: 'totem-lurantis', used: false }); run.stage.current = node.id; pkr.game.scene.getScene('Map').scene.restart({ focus: 0 });`);
  await waitMap();
  await mapCall(`pkr.game.scene.getScene('Map').openTotem('sw-totem');`);
  await page.waitForTimeout(900); await record(page, 'totem preview', {}, errs);
  await page.keyboard.press('Enter'); await page.waitForTimeout(900); await record(page, 'totem prep', {}, errs);
  await page.keyboard.press('Enter');
  await test.expect.poll(() => active(page), { timeout: 30_000 }).toBe('Battle').catch(() => undefined);
  await page.waitForTimeout(2500); await record(page, 'totem battle', {}, errs);
  await steps('totem battle', 12);

  // Plaza (middle column) and its areas
  await fresh();
  const plaza = await mapCall(`const run = pkr.session.run; const middle = Math.ceil(run.stage.map.columns / 2); const node = run.stage.map.nodes.find((n) => n.column === middle); let s = node.sides.find((x) => x.kind === 'plaza'); if (!s) { s = { id: 'sw-plaza', kind: 'plaza', used: false }; node.sides.push(s); } run.stage.current = node.id; run.money = 50000; pkr.game.scene.getScene('Map').scene.restart({ focus: 0 }); return s.id;`) as unknown as string;
  await waitMap();
  await page.evaluate((id) => (window as any).__pkr.game.scene.getScene('Map').openPlaza(id), plaza);
  await test.expect.poll(() => active(page), { timeout: 30_000 }).toBe('Plaza').catch(() => undefined);
  await page.waitForTimeout(2500); await record(page, 'plaza', {}, errs);
  for (const k of ['ArrowRight', 'ArrowRight', 'ArrowDown', 'ArrowDown', 'Enter', 'Enter', 'ArrowUp', 'Enter']) { await page.keyboard.press(k); await page.waitForTimeout(700); }
  await record(page, 'plaza walk', {}, errs);

  // Trade service
  await fresh();
  const trade = await mapCall(`const run = pkr.session.run; const tpl = JSON.parse(JSON.stringify(run.party[0])); run.party = ['squirtle', 'eevee', 'onix'].map((sp, i) => ({ ...JSON.parse(JSON.stringify(tpl)), uid: tpl.uid + '-' + i, speciesId: sp, level: 14 })); run.money = 9000; const node = run.stage.map.nodes.find((x) => x.column === 1); run.stage.current = node.id; if (!run.stage.visited.includes(node.id)) run.stage.visited.push(node.id); node.sides = node.sides.filter((s) => s.kind !== 'event'); node.sides.push({ id: 'sw-trade', kind: 'service', serviceId: 'trade', used: false }); pkr.game.scene.getScene('Map').scene.restart({ focus: 0 }); return 'sw-trade';`) as unknown as string;
  await waitMap();
  await page.evaluate((id) => (window as any).__pkr.game.scene.getScene('Map').openService(id), trade);
  await page.waitForTimeout(3000); await record(page, 'trade', {}, errs);
  await page.keyboard.press('Enter'); await page.waitForTimeout(3000); await record(page, 'trade picked', {}, errs);
  await page.keyboard.press('Enter'); await page.waitForTimeout(4000); await record(page, 'trade done', {}, errs);

  // Siege war map (Kanto climax format)
  await fresh();
  await mapCall(`const run = pkr.session.run; const d = (id, name, place, status, heldBy, ifLost, gate = true) => ({ id, name, place, status, heldBy, ifLost, gate }); const districts = [d('north-gate', 'North Gate', 'Route 5', 'held', 'Your rival', 'x'), d('east-gate', 'East Gate', 'Route 8', 'held', 'Officer Jenny', 'x'), d('south-gate', 'South Gate', 'Route 6', 'contested', '', 'x'), d('west-gate', 'West Gate', 'Route 7', 'lost', '', 'x'), d('center', 'The Center', null, 'contested', 'Oracle Sabrina', 'x', false)]; run.expansion = { ...(run.expansion ?? {}), cut: { format: { id: 'siege', state: { region: 'kanto', districts, entered: null, pending: null, tries: 0 } } } }; pkr.game.scene.getScene('Map').scene.restart({ focus: 0 });`);
  await test.expect.poll(() => active(page), { timeout: 30_000 }).toBe('Siege').catch(() => undefined);
  await page.waitForTimeout(1500); await record(page, 'siege', {}, errs);
  await sweep(page, errs, 'Siege', undefined, 'SIEGE', 1, { left: 12 }).catch(() => undefined);
});

test('event choices: pick every choice of a sample of events', async ({ page }) => {
  test.setTimeout(4 * 3_600_000);
  const errs = watch(page);
  await boot(page);
  await toMap(page);
  await snapRun(page);
  const step = Number(process.env.CHOICE_STEP ?? 60);
  const ids: string[] = await page.evaluate((step) => {
    const ev = (window as any).__pkr.session.content.events;
    const list = ev instanceof Map ? [...ev.values()] : Array.isArray(ev) ? ev : Object.values(ev);
    return list.filter((_: unknown, i: number) => i % step === 0).map((e: any) => e.id);
  }, step);
  for (const [n, id] of ids.entries()) {
    for (let pick = 0; pick < 4; pick++) {
      const ok = await page.evaluate(([id]) => {
        const p = (window as any).__pkr; const w = window as any;
        p.session.run = JSON.parse(w.__snap);
        const run = p.session.run; const node = run.stage.map.nodes.find((x: any) => x.id === run.stage.current) ?? run.stage.map.nodes[0];
        run.stage.current = node.id;
        node.sides.push({ id: 'ch-' + id, kind: 'event', used: false, eventId: id });
        try { p.game.scene.getScenes(true)[0].scene.start('Event', { sideId: 'ch-' + id }); return true; } catch { return false; }
      }, [id] as const);
      if (!ok) break;
      await test.expect.poll(() => active(page), { timeout: 8000 }).toBe('Event').catch(() => undefined);
      await page.waitForTimeout(500);
      for (let i = 0; i < 10 && (await page.locator('#rx .stage [data-act="pick"]').count()) === 0; i++) { await page.keyboard.press('Enter'); await page.waitForTimeout(300); }
      const choices = await page.locator('#rx .stage [data-act="pick"]').count();
      if (pick >= choices) break;
      await page.locator('#rx .stage [data-act="pick"]').nth(pick).dispatchEvent('click');
      let shots = 0;
      const end = Date.now() + 20_000;
      while (Date.now() < end && (await active(page)) === 'Event') {
        await page.waitForTimeout(600);
        const l = await look(page);
        if (l.cut.length || l.broken.length || errs.length || (n % 10 === 0 && shots < 2)) { shots++; await record(page, `choice ${id} #${pick + 1} step`, { event: id, pick }, errs); }
        const next = page.locator('#rx .stage [data-act="next"]');
        if (await next.count()) await next.first().dispatchEvent('click'); else await page.keyboard.press('Enter');
      }
      const now = await active(page);
      log({ label: `choice ${id} #${pick + 1}`, event: id, pick, choices, after: now, errors: errs.splice(0) });
    }
  }
});
