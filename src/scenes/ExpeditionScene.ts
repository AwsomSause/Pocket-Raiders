// The Mega-Expedition screen: the route (a few layers of stops, the next ones lit), the party's health, the loot
// held so far, and the choices of the moment (next stop, a recruit, a rest option, or extracting). Rules: core/expedition.

import { paintSkinBackdrop, skinFor } from '../ui/screenSkins';
import Phaser from 'phaser';
import { availableNodes, getExpedition, nodeLabel } from '../core/expedition/flow';
import { stageRules } from '../core/legendary/legendary';
import { legendCards, legendKit, legendLook } from '../core/legendary/visuals';
import { resolveAnim } from '../core/presentation/animRegistry';
import { legendAnimId } from '../core/presentation/legendAnims';
import { animSettingsFrom } from '../core/accessibility';
import { uieArenaId } from '../assets/catalog';
import { addLegendLook, playSignature } from '../ui/legendFx';
import { titleCard } from '../ui/battleFx/spectacle';
import { maxHp } from '../core/pokemon';
import type { ExpeditionState, RunState } from '../core/state';
import { services } from '../game/services';
import { onInputAction } from '../ui/input';
import { playMusic, playSfx } from '../ui/audio';
import { legendMusic } from '../core/legendary/identity';
import { setAmbience, setMusicState, setRegionKey, stopProceduralAudio } from '../ui/procAudio';
import { loadAssets } from '../ui/lazyAssets';
import { EXPEDITION_TRACK_IDS, expeditionTrack } from '../core/presentation/battleMusic';
import { COLORS, GAME_HEIGHT, GAME_WIDTH, textStyle } from '../ui/theme';
import { Menu } from '../ui/widgets';
import { glassPanel as drawPanel, slideIn } from '../ui/aero';
import { sceneForRun } from './routing';
import { screenStyleOf } from '../core/presentation/screenStyles';
import { getRaid } from '../core/raid/raid';
import { getTotem } from '../core/totem/totem';
import { drawExpeditionLook, type ExpeditionLayout, type ExpeditionLook } from '../ui/expeditionLooks';
import { arenaFor, getTheme } from '../core/themes';
import { artOf, monFile, partyChips } from '../ui/redux/game';
import { mountRedux, pocketOn, reduxOn } from '../ui/redux/stage';
import { pkXpDoor, pkXpDraft, pkXpExtract, pkXpResult, pkXpRoute, type PkXpResultModel } from '../ui/pocket/screens/expedition';
import { pkArtOf } from '../ui/pocket/templates';
import { itemArt, monArt, walkerUrl, type PkArt } from '../ui/pocket/art';
import { trainerSheet } from '../core/hubTown/world';
import { mapView, type MapModel } from '../ui/redux/screens/map';
import { phMap } from '../ui/phantom/screens/map';

const GLYPH: Record<string, { glyph: string; color: number }> = {
  wild: { glyph: 'W', color: 0x58a858 }, trainer: { glyph: 'T', color: 0xc85858 }, elite: { glyph: 'E', color: 0xa040c0 }, rest: { glyph: '+', color: 0xe06890 },
  cache: { glyph: '$', color: 0xd0a030 }, research: { glyph: '?', color: 0x4890d0 }, mystery: { glyph: '!', color: 0x9070c0 }, recruit: { glyph: 'R', color: 0x30b0a0 },
  megaEnergy: { glyph: 'M', color: 0xf0c020 }, totem: { glyph: 'O', color: 0xe8a020 }, raid: { glyph: 'X', color: 0xd04040 }, finale: { glyph: '★', color: 0xf08020 },
};

export class ExpeditionScene extends Phaser.Scene {
  private menu!: Menu;

  constructor() {
    super('Expedition');
  }

  /** Pocket look: Extract now asks first (both sides), while true. */
  private pkExtract = false;
  private pkView: { refresh(): void } | null = null;

  create(data?: { pkFrom?: RunState }): void {
    const { session } = services();
    let run = session.run!;
    const settlingId = run.expedition?.battleResult ? run.expedition.id : null;
    const before = data?.pkFrom ?? (settlingId ? run : null);
    this.pkExtract = false;
    if (run.expedition?.battleResult) run = session.settleExpedition();
    if (run.phase !== 'expedition' || !run.expedition) {
      // The expedition ended (finished, extracted or failed): back to the map with the result.
      // Pocket look: the haul or the loss as its own page first (Enter goes on to the map).
      const shown = !!(before?.expedition && reduxOn() && pocketOn());
      const leave = () => this.scene.start(sceneForRun(run), { notice: shown ? '' : run.expeditions.last.join(' '), focus: 0 });
      const go = () => {
        if (!shown) return leave();
        const model = this.pkResult(before!, run);
        let left = false;
        const done = () => { if (!left && this.scene.isActive()) { left = true; leave(); } };
        mountRedux(this, { clear: true, render: (c) => (c.pk ? pkXpResult(model) : ''), acts: { next: done } });
        onInputAction(this, (a) => { if (a === 'confirm' || a === 'back') done(); });
      };
      // A Legendary stage ends with its own victory or defeat card before returning to the map.
      const endedDef = settlingId ? getExpedition(session.content, settlingId) : null;
      const cards = endedDef?.legendary ? legendCards(session.content, endedDef) : null;
      const result = run.legendary?.outcomes.at(-1);
      if (cards && result?.id === settlingId) {
        const won = result.outcome === 'completed';
        const motion = session.settings.battleAnimations;
        const kit = legendKit(session.content, endedDef!, 0);
        const card = won ? cards.won : cards.lost;
        if (kit && motion !== 'off') {
          void titleCard(this, card.title, card.sub, won ? kit.accent : 0x8a8aa0, motion).done.then(go);
          return;
        }
      }
      go();
      return;
    }
    const exp = run.expedition;
    const def = getExpedition(session.content, exp.id);
    const skin = skinFor('expedition', `${run.seed}:${exp.id}`);
    const lookId = screenStyleOf('expedition', session.settings.screenStyles, `${run.seed}:${exp.id}`);
    const look: ExpeditionLook | null = skin && (lookId === 'aero' || lookId === 'manga' || lookId === 'depth') ? lookId : null;
    if (skin) paintSkinBackdrop(this, skin, session.settings.battleAnimations);
    const music = legendMusic(session.content, def);
    const song = music?.route ?? expeditionTrack(def.tier);
    if (music) {
      // The event's own key and ambience bed under its song (synth layers; silent when audio is unavailable).
      setRegionKey(music.key);
      setAmbience(this, music.ambience);
      setMusicState(this, 'tense');
      this.events.once('shutdown', () => stopProceduralAudio());
    }
    void loadAssets(this, [song]).then(() => { if (this.scene.isActive()) playMusic(this, song); });
    if (!look && this.textures.exists('ui.raid.adv_header')) this.add.image(GAME_WIDTH / 2, 22, 'ui.raid.adv_header').setDisplaySize(GAME_WIDTH * 0.7, 56).setAlpha(0.5);
    const legend = def.legendary;
    /** A Legendary stage's title card, while it plays (the New UI route waits for it). */
    let intro: Promise<unknown> | null = null;
    let rxArena: string | undefined;
    if (legend) {
      // A Legendary stage has its own colour wash and accent line.
      const layerNow = exp.current ? exp.nodes.find((n) => n.id === exp.current)!.layer + 1 : 0;
      const kit = legendKit(session.content, def, layerNow)!;
      const motion = session.settings.battleAnimations;
      // Wash and particles in the event's own look; with motion off, just the plain wash.
      if (addLegendLook(this, kit, motion).length === 0) this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, kit.tint, 0.28).setDepth(-1);
      // Title cards: the stage opening, and the finale once it is the only stop left.
      const cards = legendCards(session.content, def)!;
      const finaleNext = !exp.choice && exp.status === 'route' && availableNodes(exp).some((n) => n.kind === 'finale');
      const opening = exp.current === null && !exp.choice;
      const look = legendLook(session.content, def)!;
      // The event's own battleback behind the route (Essentials/UIE art), loaded on demand.
      const arenaId = uieArenaId(look.arena);
      rxArena = arenaId;
      void loadAssets(this, [arenaId]).then(() => {
        if (!this.scene.isActive() || !this.textures.exists(arenaId)) return;
        this.add.image(0, 0, arenaId).setOrigin(0).setDisplaySize(GAME_WIDTH, GAME_HEIGHT).setAlpha(0.45).setDepth(-2);
      });
      if (opening || finaleNext) playSignature(this, look.shape, resolveAnim(legendAnimId(look.shape), animSettingsFrom(session.settings)));
      if (opening || finaleNext) intro = titleCard(this, finaleNext ? cards.finale.title : cards.intro.title, finaleNext ? cards.finale.sub : cards.intro.sub, kit.accent, motion).done;
      this.add.text(GAME_WIDTH / 2, 8, `LEGENDARY EVENT  ·  ${legend.epithet}`, textStyle(12, legend.visual.accent)).setOrigin(0.5, 0);
    }
    const loot = exp.loot;
    const items = Object.entries(loot.items).map(([id, n]) => `${n} ${id.replace(/-/g, ' ')}`);
    const lootLine = `Loot: ₽${loot.money}${items.length ? `, ${items.join(', ')}` : ''}  ·  Mega Energy ${loot.energy}/${def.megaCost}  ·  Research ${loot.research}/${def.researchGoal}`;
    let layout: ExpeditionLayout | null = null;
    if (look) {
      const sp = session.content.species;
      const lead = run.party[0] ? sp.get(run.party[0].speciesId) : undefined;
      const fin = def.finale;
      const bossId = fin.kind === 'megaBoss' ? fin.species[0] : fin.kind === 'raid' ? getRaid(session.content, fin.raidId).species[0] : getTotem(session.content, fin.totemId).species[0];
      const bossSpecies = bossId ? sp.get(bossId) : undefined;
      layout = drawExpeditionLook(this, look, { exp, name: def.name, tier: def.tier, loot: lootLine, party: this.partyLine(run), prompt: '', hero: lead, boss: bossSpecies });
    } else {
    this.add.text(GAME_WIDTH / 2, 22, legend ? def.name : `${def.name}  ·  Tier ${def.tier}`, textStyle(32, COLORS.textLight)).setOrigin(0.5);
    const route = drawPanel(this, 16, 48, GAME_WIDTH - 32, 200, { fill: COLORS.panelDark, border: COLORS.borderMuted, thin: true });
    slideIn(this, route, 0, -16, session.settings.battleAnimations);
    this.drawRoute(exp);
    this.add.text(24, 256, this.partyLine(run), textStyle(15, COLORS.textLight, { wordWrap: { width: GAME_WIDTH - 48 } }));
    this.add.text(24, 282, lootLine, textStyle(15, '#f0e0a0', { wordWrap: { width: GAME_WIDTH - 48 } }));
    this.add.text(24, 306, exp.log.slice(-2).join('  ·  '), textStyle(14, '#a8d0a8', { wordWrap: { width: GAME_WIDTH - 48 } }));
    if (legend) {
      const layer = exp.current ? exp.nodes.find((n) => n.id === exp.current)!.layer + 1 : 0;
      this.add.text(GAME_WIDTH - 24, 258, stageRules(def, layer).join('  ·  '), textStyle(12, legend.visual.accent, { wordWrap: { width: 420 }, align: 'right' })).setOrigin(1, 0);
    }
    }

    const options: { label: string; detail?: string; act: () => void }[] = [];
    if (exp.choice) {
      this.promptText(layout, exp.choice.title);
      exp.choice.options.forEach((o, i) => options.push({ label: o.label, detail: o.detail, act: () => session.resolveExpeditionChoice(i) }));
    } else {
      this.promptText(layout, 'Choose your next stop');
      for (const n of availableNodes(exp)) options.push({ label: nodeLabel(n.kind), detail: `stop ${n.layer + 1}`, act: () => session.chooseExpeditionNode(n.id) });
      options.push({ label: 'Extract now', detail: 'keep the loot, skip the finale', act: () => session.extractExpedition() });
    }
    const extractAt = exp.choice ? -1 : options.length - 1;
    const pocket = reduxOn() && pocketOn() && !look;
    this.menu = new Menu(this, {
      x: layout?.menu.x ?? 40, y: layout?.menu.y ?? 366, columns: layout?.menu.columns ?? 2, itemWidth: layout?.menu.itemWidth ?? 440, itemHeight: layout?.menu.itemHeight ?? 46, fontSize: layout ? 15 : 20, color: layout?.ink ?? COLORS.textLight,
      options: options.map((o) => ({ label: o.label, detail: o.detail })),
      onSelect: (i) => {
        playSfx(this, 'ui.select');
        // Pocket look: Extract now shows both sides first; Enter there extracts, Esc keeps going.
        if (pocket && i === extractAt && !this.pkExtract) {
          this.pkExtract = true;
          this.pkView?.refresh();
          return;
        }
        const prior = session.run!;
        try {
          options[i]!.act();
        } catch (err) {
          this.add.text(GAME_WIDTH / 2, 320, String(err instanceof Error ? err.message : err), textStyle(16, '#ff8080')).setOrigin(0.5);
          return;
        }
        // Pocket look: an expedition that just ended shows its haul here first.
        if (pocket && session.run!.phase !== 'expedition') return void this.scene.restart({ pkFrom: prior });
        this.scene.start(sceneForRun(session.run!), { notice: '', focus: 0 });
      },
    });
    this.add.text(16, GAME_HEIGHT - 22, '←/→/↑/↓ choose  ·  Enter select', textStyle(14, '#8a7f96'));
    onInputAction(this, (a) => {
      // Pocket look: X (or Esc) on the route asks Extract now; on that page Enter extracts and X or Esc keeps going.
      if (pocket && !this.pkExtract && a === 'back' && extractAt >= 0) { this.menu.focus(extractAt, false); this.menu.confirm(); return; }
      if (!this.pkExtract) return this.menu.handle(a);
      if (a === 'confirm') { this.menu.focus(extractAt, false); this.menu.confirm(); }
      if (a === 'back') { this.pkExtract = false; this.pkView?.refresh(); }
    });
    // New UI: the route drawn with the mock-up map (its Expedition piece) unless an Expedition look is picked.
    if (reduxOn() && !look) {
      const content = session.content;
      const layers = Math.max(...exp.nodes.map((n) => n.layer)) + 1;
      const open = exp.choice || exp.status !== 'route' ? [] : availableNodes(exp);
      const here = exp.current ? exp.nodes.find((n) => n.id === exp.current) : undefined;
      const theme = run.stage ? getTheme(content, run.stage.themeId) : undefined;
      const art = (artOf(this, rxArena) ?? artOf(this, theme ? arenaFor(content, theme) : undefined))?.file ?? null;
      const trainer = artOf(this, content.archetypes.get(run.archetypeId)?.spriteAssetId)?.file ?? null;
      const party = partyChips(this).map((p) => ({ file: p.file, hp: p.hp, label: `${p.name} Lv ${p.level}` }));
      const prompt = exp.choice ? exp.choice.title : 'Choose your next stop';
      const rules = legend ? stageRules(def, here ? here.layer + 1 : 0) : [];
      const view = mountRedux(this, {
        // Phantom: the route is the Phantom map page (the same model). Pocket: the mock-up's Expedition pages.
        render: (c) => c.pk ? this.pkPage(run, exp, options, extractAt) :
          (c.ph ? (m: MapModel) => phMap(c.ph!, m) : (m: MapModel) => mapView(c, m))({
            title: `${def.name} · Layer ${(here?.layer ?? -1) + 2}`,
            chips: [legend ? `Legendary event · ${legend.epithet}` : `Tier ${def.tier}`, `₽ ${loot.money}`, `Mega Energy ${loot.energy}/${def.megaCost}`, `Research ${loot.research}/${def.researchGoal}`, ...items],
            types: [],
            lines: [...exp.log.slice(-2), ...rules],
            party,
            eggs: [],
            art,
            trainer,
            columns: layers,
            column: here ? here.layer + 1 : 0,
            nodes: exp.nodes.map((n) => {
              const col = exp.nodes.filter((x) => x.layer === n.layer);
              const opt = open.findIndex((x) => x.id === n.id);
              return { id: n.id, col: n.layer + 1, row: col.indexOf(n), rows: col.length, kind: n.blocked ? 'blocked' : n.kind, fog: false, visited: n.done, cur: n.id === exp.current, go: opt >= 0, dim: !n.done && opt < 0 && n.id !== exp.current, harder: false, opt, sides: [], marks: [], title: nodeLabel(n.kind), text: `Stop ${n.layer + 1}` };
            }),
            edges: exp.nodes.flatMap((n) => n.next.map((b) => ({ a: n.id, b, open: open.some((x) => x.id === b) && n.id === exp.current, walked: n.done || n.id === exp.current }))),
            buttons: options.map((o, i) => ({ label: o.label, opt: i, hot: false })),
            keys: [],
            hints: [['Enter', 'choose']],
            index: this.menu.index,
            info: `${options[this.menu.index]?.label ?? ''}${options[this.menu.index]?.detail ? `: ${options[this.menu.index]!.detail}` : ''}`,
            notice: prompt,
            going: null,
            banner: null,
            legend: null,
          }),
        acts: {
          pick: (i) => { this.menu.focus(Number(i), false); this.menu.confirm(); },
          go: () => this.menu.confirm(),
          xpOut: () => { this.menu.focus(extractAt, false); this.menu.confirm(); },
          back: () => { if (this.pkExtract) { this.pkExtract = false; view.refresh(); } },
        },
        overs: { over: (i) => this.menu.focus(Number(i), false) },
      });
      this.menu.onFocus = () => view.refresh();
      this.pkView = view;
      this.events.once('shutdown', () => { this.pkView = null; });
      // The stage's title card plays on the canvas first.
      if (intro) {
        view.visible(false);
        void intro.then(() => view.visible(true));
      }
    }
  }

  /** Pocket look: the page for where the expedition stands (the route, a stop's question, a draft, Extract now). */
  private pkPage(run: RunState, exp: ExpeditionState, options: readonly { label: string; detail?: string }[], extractAt: number): string {
    const { content } = services().session;
    const def = getExpedition(content, exp.id);
    const layers = Math.max(...exp.nodes.map((n) => n.layer)) + 1;
    const here = exp.current ? exp.nodes.find((n) => n.id === exp.current) : undefined;
    const layer = here ? here.layer + 1 : 0;
    const index = this.menu.index;
    const sp = content.species;
    const fin = def.finale;
    const bossId = fin.kind === 'megaBoss' ? fin.species[0] : fin.kind === 'raid' ? getRaid(content, fin.raidId).species[0] : getTotem(content, fin.totemId).species[0];
    const monPic = (id: string | undefined): PkArt | null => { const f = id ? monFile(this, id) : null; return f ? monArt(f) : null; };
    const items = Object.values(exp.loot.items).reduce((a, b) => a + b, 0);
    const sub = `${def.name} · Layer ${Math.max(1, layer)} of ${layers}`;
    const alive = run.party.filter((p) => p.hp > 0).length;
    const typesOf = (id: string | undefined): string => (id ? (sp.get(id)?.types ?? []).map((t) => t.charAt(0).toUpperCase() + t.slice(1)).join(' / ') : '');
    if (this.pkExtract) {
      const prize = def.rewards.megaStones ? `${def.rewards.megaStones} Mega Stone${def.rewards.megaStones === 1 ? '' : 's'}` : 'The finale prize';
      return pkXpExtract({ money: exp.loot.money, items: Object.entries(exp.loot.items).map(([id, n]) => `${content.items.get(id)?.name ?? id.replace(/-/g, ' ')}${n > 1 ? ` ×${n}` : ''}`), prize, left: layers - layer, boss: monPic(bossId), keep: Math.floor(exp.loot.money * def.failureKeep), index: 0 }, { pick: 'xpOut', over: '' });
    }
    const ch = exp.choice;
    if (ch && (ch.kind === 'draft' || ch.kind === 'combined' || ch.kind === 'recruit')) {
      const offer = ch.options.filter((o) => o.speciesId);
      const pass = ch.options.find((o) => !o.speciesId);
      const taken = run.party.filter((p) => exp.tempUids.includes(p.uid)).map((p) => ({ art: monPic(p.speciesId), name: sp.get(p.speciesId)?.name ?? p.speciesId, types: typesOf(p.speciesId) }));
      const picks = ch.kind === 'draft' ? taken.length + ch.left : 1;
      const title = ch.kind === 'draft' ? 'Draft' : 'Recruit';
      const text = ch.kind === 'draft' ? `Draft ${picks} Pokémon from the ones offered; your party waits at the gate.` : ch.title;
      return pkXpDraft({ title, text, taken: ch.kind === 'draft' ? taken : [], offer: offer.map((o) => ({ art: monPic(o.speciesId), name: o.label, types: typesOf(o.speciesId), note: o.detail ?? '' })), index, picks, pass: pass?.label ?? null });
    }
    if (ch) {
      const rest = ch.kind === 'rest';
      return pkXpDoor({
        kind: 'stop', where: rest ? 'Rest Area' : 'Mystery', sub, kicker: 'Expedition', name: rest ? 'Rest Area' : 'Something on the path',
        text: rest ? 'A ranger camp on the route.' : ch.title,
        rows: [['Team', `${alive} of ${run.party.length} can fight`], ['Loot', `₽${exp.loot.money.toLocaleString('en-US')}${items ? ` and ${items} ${items === 1 ? 'item' : 'items'}` : ''} so far`], ['Ahead', `${layers - layer} ${layers - layer === 1 ? 'layer' : 'layers'}, then the finale`]],
        options: options.map((o) => ({ label: o.label, detail: o.detail ?? '' })), index, say: rest ? 'A kettle is already on. Rest here, or look around the camp instead.' : '', esc: '',
      });
    }
    const open = exp.status === 'route' ? availableNodes(exp) : [];
    const byId = new Map(exp.nodes.map((n, k) => [n.id, k]));
    const lit = open[index];
    const step = (['draft', 'rental', 'combined'].includes(def.partyMode) ? 1 : 0);
    const flow = ['Gate', ...(step ? [def.partyMode === 'rental' ? 'Rentals' : 'Draft'] : []), 'Route', 'Finale', 'Extract'];
    return pkXpRoute({
      name: def.name, tag: def.legendary ? 'Legendary event' : 'Expedition', layers, layer,
      nodes: exp.nodes.map((n) => {
        const col = exp.nodes.filter((x) => x.layer === n.layer);
        return { layer: n.layer, row: col.indexOf(n), rows: col.length, kind: n.blocked ? 'blocked' : n.kind, title: nodeLabel(n.kind), past: n.done, on: n.id === exp.current, opt: open.findIndex((x) => x.id === n.id) };
      }),
      edges: exp.nodes.flatMap((n) => n.next.map((b) => ({ a: byId.get(n.id)!, b: byId.get(b)!, went: (n.done || n.id === exp.current) && !!exp.nodes.find((x) => x.id === b)?.done }))),
      party: run.party.map((p) => ({ art: monPic(p.speciesId), hp: Math.round((p.hp / Math.max(1, maxHp(content, p))) * 100) })),
      boss: monPic(bossId),
      walker: walkerUrl(trainerSheet(run.archetypeId, content.archetypes.get(run.archetypeId)?.name)),
      now: lit ? `${nodeLabel(lit.kind)}: stop ${lit.layer + 1}` : index === extractAt ? 'Extract now: keep the loot, skip the finale.' : 'Choose your next stop',
      money: exp.loot.money, items, index, extract: extractAt,
      flow, step: step + 1, lines: exp.log.filter((l) => !/^npc:|^[a-z0-9-]+$/.test(l)).slice(-1),
    });
  }

  /** Pocket look: the haul or the loss, from the run before the expedition ended and after. */
  private pkResult(before: RunState, after: RunState): PkXpResultModel {
    const { content } = services().session;
    const exp = before.expedition!;
    const def = getExpedition(content, exp.id);
    const outcome = after.expeditions.failed.length > before.expeditions.failed.length ? 'failed' : after.expeditions.completed.length > before.expeditions.completed.length ? 'completed' : 'extracted';
    const name = (id: string) => content.items.get(id)?.name ?? id.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    const pic = (id: string): PkArt | null => pkArtOf(artOf(this, content.items.get(id)?.iconAssetId)) ?? itemArt(id.replace(/-/g, '_'));
    const gained = Object.entries(after.inventory).map(([id, n]) => [id, n - (before.inventory[id] ?? 0)] as const).filter(([, n]) => n > 0);
    const money = after.money - before.money;
    const layers = Math.max(...exp.nodes.map((n) => n.layer)) + 1;
    const walked = exp.nodes.filter((n) => n.done || n.id === exp.current);
    const reached = walked.length ? Math.max(...walked.map((n) => n.layer)) + 1 : 0;
    const counts = [[`${reached} of ${layers}`, 'layers walked'], [String(exp.nodes.filter((n) => n.done).length), 'stops cleared'], [String(exp.nodes.filter((n) => n.done && n.kind === 'rest').length), 'rests taken']] as const;
    const party = after.party.map((p) => { const f = monFile(this, p.speciesId, 'front', !!p.shiny); return f ? monArt(f) : null; });
    const last = after.expeditions.last;
    if (outcome === 'failed') {
      const lost = Object.entries(exp.loot.items).map(([id, n]) => `${name(id)}${n > 1 ? ` ×${n}` : ''}`);
      return {
        outcome, name: def.name, text: last.join(' '), party, counts,
        rows: [
          { art: itemArt('nugget'), title: `₽${money.toLocaleString('en-US')} kept`, sub: `${Math.round(def.failureKeep * 100)}% of the money` },
          { art: itemArt('rare_candy'), title: lost.length ? 'Items lost' : 'No items lost', sub: lost.join(', ') || 'You had found none yet' },
          { art: itemArt('potion'), title: 'Team is safe', sub: `Healed to ${Math.round(content.expeditions.failureHealFraction * 100)}%`, on: true },
          { art: itemArt('mega_bracelet'), title: def.rewards.megaStones ? 'Mega Stone' : 'The prize', sub: 'Still out there' },
        ],
        side: 'Next time', lines: [`Extract now would have kept ₽${exp.loot.money.toLocaleString('en-US')}${lost.length ? ` and ${lost.join(', ')}` : ''}.`, 'Losing a fight never costs you a Pokémon.'],
      };
    }
    return {
      outcome, name: def.name, text: outcome === 'completed' ? 'The guardian is beaten. Everything you carried out is yours.' : 'You walked out with the loot. The finale waits for another day.',
      rows: [{ art: itemArt('nugget'), title: `₽${money.toLocaleString('en-US')}`, sub: 'All the money', on: !gained.length }, ...gained.map(([id, n], k) => ({ art: pic(id), title: `${name(id)}${n > 1 ? ` ×${n}` : ''}`, sub: /ite$/.test(id) ? 'Mega Stone' : 'Found on the route', on: k === 0 }))].slice(0, 4),
      side: outcome === 'completed' ? 'What you earned' : 'You extracted', lines: last, party, counts,
    };
  }

  private promptText(layout: ExpeditionLayout | null, text: string): void {
    if (!layout) this.add.text(GAME_WIDTH / 2, 338, text, textStyle(20, '#ffd0a0')).setOrigin(0.5);
    else this.add.text(layout.promptAt.x, layout.promptAt.y, text, textStyle(18, layout.promptColor)).setOrigin(layout.promptAt.originX, 0.5);
  }

  private partyLine(run: RunState): string {
    const { content } = services().session;
    return run.party.map((m) => `${content.species.get(m.speciesId)?.name ?? m.speciesId} Lv${m.level} ${m.hp}/${maxHp(content, m)}`).join('  ·  ');
  }

  /** Layers left to right; stops you can take now are bright, finished ones dim. */
  private drawRoute(exp: ExpeditionState): void {
    const layers = Math.max(...exp.nodes.map((n) => n.layer)) + 1;
    const pos = new Map<string, { x: number; y: number }>();
    for (let l = 0; l < layers; l++) {
      const col = exp.nodes.filter((n) => n.layer === l);
      col.forEach((n, i) => pos.set(n.id, { x: 70 + (l * (GAME_WIDTH - 140)) / Math.max(1, layers - 1), y: 148 + (i - (col.length - 1) / 2) * 80 }));
    }
    const g = this.add.graphics();
    const lit = new Set(exp.status === 'route' ? availableNodes(exp).map((n) => n.id) : []);
    for (const n of exp.nodes) {
      const a = pos.get(n.id)!;
      for (const nx of n.next) {
        const b = pos.get(nx)!;
        g.lineStyle(3, n.done || exp.current === n.id ? 0xf0e0a0 : 0x6a6080, 1);
        g.lineBetween(a.x, a.y, b.x, b.y);
      }
    }
    for (const n of exp.nodes) {
      const p = pos.get(n.id)!;
      const style = n.blocked ? { glyph: '✗', color: 0x503030 } : (GLYPH[n.kind] ?? { glyph: '·', color: 0x888888 });
      const bright = lit.has(n.id) || n.id === exp.node;
      g.fillStyle(style.color, n.done ? 0.35 : bright ? 1 : 0.7);
      g.fillCircle(p.x, p.y, 20);
      g.lineStyle(bright ? 4 : 2, bright ? 0xffffff : 0x202020, 1);
      g.strokeCircle(p.x, p.y, 20);
      this.add.text(p.x, p.y, n.done ? '✓' : style.glyph, textStyle(20, '#ffffff')).setOrigin(0.5);
    }
    this.add.text(70, 60, 'Start', textStyle(12, '#c8c0d8')).setOrigin(0.5);
  }
}
