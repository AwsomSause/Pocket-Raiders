// DOMINION redesign R6: the scene's side of the Pokémon pages. Builds the Reserve's and the Card's display data from
// core/dominion/reserveScreens, and keeps the Party, Summary and Bag pages (pages of the Pokémon tab: the scene's screen
// stays 'reserve'). Changes go through GameSession (moveParty, useItem); nothing here rolls or edits the run.

import type Phaser from 'phaser';
import { BAG_POCKETS, bagEntries, POCKET_NAMES, type BagEntry, type BagPocket } from '../../core/bag';
import { monName } from '../../core/dominion/crew';
import type { ReserveModel } from '../../core/dominion/reserveScreens';
import type { DominionBlock } from '../../core/dominion/schema';
import { teamColours } from '../../core/dominion/founding';
import { maxHp } from '../../core/pokemon';
import type { PokemonInstance } from '../../core/state';
import { services } from '../../game/services';
import type { InputAction } from '../../ui/input';
import { summaryInfo } from '../../ui/summaryLook';
import { rxFileOf, rxUrl } from '../../ui/redux/assets';
import { monFile } from '../../ui/redux/game';
import { mini } from '../../ui/redux/kit';
import { pngSrc, tallTeam } from '../../ui/redux/screens/dominion/teamPic';
import { r5Bag, r5Give, r5Party, r5Summary, type R5BagItem, type R5GiveView, type R5ReserveView } from '../../ui/redux/screens/dominion/r50/pokemon';
import { SP, type R5Run, type R5Speaker } from '../../ui/redux/screens/dominion/r50/kit';
import { facePic, r5Run } from './r50Bridge';

const cap = (s: string): string => (s ? s[0]!.toUpperCase() + s.slice(1) : s);
const rotom: R5Speaker = { name: 'Rotom', k: 'p-rotom' };

/** A Pokémon's front sprite fitted into `size` (nothing when the art is missing). */
export function monPic(scene: Phaser.Scene, species: string, size: number, shiny = false): string {
  const f = monFile(scene, species, 'front', shiny);
  return f ? mini(f, size) : '';
}

/** A member (or any png/atlas look) standing, `h` px tall, in the team's colours. */
export function personPic(look: string, b: DominionBlock, h: number): string {
  const tc = teamColours(b);
  if (look.endsWith('.png')) return `<img class="px" src="${pngSrc(look, tc)}" alt="" style="height:${h}px;width:auto">`;
  return tallTeam(look, h, tc);
}

/** Stars on a Reserve cell: how strong the species is (base stat total). */
const stars = (bst: number): number => (bst >= 500 ? 4 : bst >= 400 ? 3 : bst >= 300 ? 2 : 1);

export function reserveData(scene: Phaser.Scene, b: DominionBlock, m: ReserveModel, notice: string | null): R5ReserveView {
  const meta = b.reserve?.meta ?? {};
  return {
    box: `Box ${m.page + 1}${m.pages > 1 ? ` of ${m.pages}` : ''}`,
    count: m.count,
    types: `${cap(m.types[0])} and ${cap(m.types[1])}`,
    cells: m.tiles.map((t) => ({
      name: monName(t.species),
      types: (meta[t.uid]?.types ?? [t.type]).join(' · '),
      pic: monPic(scene, t.species, 58),
      stars: stars(t.bst),
      // The mockup tags only what's out of the ordinary: an Ace, or why it can't go to this member.
      tag: t.fits ? (t.ace ? 'ACE' : '') : t.tag,
      on: t.on,
      fits: t.fits,
    })),
    empty: m.fitsOnly ? 'Nothing in the Reserve fits.' : 'The Reserve is empty. Catch and Steal tasks fill it.',
    fitsOnly: m.fitsOnly,
    auto: m.auto,
    who: m.who.name,
    notice,
  };
}

export function giveData(scene: Phaser.Scene, b: DominionBlock, m: ReserveModel, focus: number | null, notice: string | null): R5GiveView | null {
  const p = m.pick;
  if (!p) return null;
  const w = m.who, boss = w.id === 'boss';
  const name = monName(p.species);
  const types = b.reserve?.meta[p.uid]?.types ?? [p.type];
  const typeOk = boss || p.ace || types.some((t) => (b.types as readonly string[]).includes(t));
  const run = services().session.run!;
  const bad = w.slots.find((s) => s.bad);
  const member = b.members.find((x) => x.id === w.id);
  const ok = m.cta.ok;
  return {
    mon: name,
    who: w.name,
    sub: boss ? 'The Boss · no BST cap, no type rule' : `${w.name} · BST cap ${w.bstCap ?? '—'}`,
    ok,
    parts: [
      [`${name} BST`, String(p.bst), w.bstCap !== null && p.bst > w.bstCap],
      [boss ? 'BST cap' : `${w.name}’s BST cap`, w.bstCap === null ? '—' : String(w.bstCap), false],
      ['Level', `Lv ${p.level}`, p.level > w.lvCap],
      ['Level cap', String(w.lvCap), false],
      ['Type', `${types.map(cap).join(' · ')} ${typeOk ? '✓' : '✗'}`, !typeOk],
    ],
    person: boss ? SP('t-natebig', 64) : personPic(w.look, b, 64),
    team: w.slots.map((s) => ({ pic: monPic(scene, s.species, 54), bad: !!s.bad })),
    pick: monPic(scene, p.species, 54),
    focus,
    facts: [
      ['Pay', boss ? `Your party ${run.party.length + (ok ? 1 : 0)} of 6` : `${w.name}’s team ${w.slots.length + (ok ? 1 : 0)} of ${w.size}`],
      ['Heat', '0'],
      ['Risk', bad ? `${monName(bad.species)} (${bad.bad}) waits until the caps grow` : m.notes[0] ?? (ok ? 'None' : m.cta.text)],
    ],
    speaker: boss || !member ? rotom : { name: w.name, pic: facePic(member.look, b), colour: '#25b3c7' },
    line: boss ? (ok ? `“Bzzt! ${name} joins your party.”` : `“Bzzt! ${m.cta.text}.”`) : ok ? '“Say the word, Boss.”' : `“${m.cta.text}. Not this one, Boss.”`,
    cta: 'Do it',
    notice,
  };
}

export { r5Give };

// ---------- the Party, the Summary and the Bag ----------

type Page = 'party' | 'summary' | 'bag';

const hpPct = (m: PokemonInstance): number => Math.round((m.hp / Math.max(1, maxHp(services().session.content, m))) * 100);

export class PokemonPages {
  page: Page | null = null;
  private at = 0;
  private swap: number | null = null;
  private pocketAt = 0;
  private item = 0;
  /** An item from the Bag waiting for a Pokémon to use it on. */
  private using: string | null = null;
  private notice: string | null = null;

  constructor(private readonly scene: Phaser.Scene, private readonly host: { refresh(): void; toReserve(): void; block(): DominionBlock | null }) {}

  open(p: Page): void {
    this.page = p;
    this.swap = null;
    this.using = null;
    this.notice = null;
    if (p !== 'summary') this.at = 0;
  }
  close(): void { this.page = null; this.using = null; this.swap = null; this.notice = null; }

  private party(): PokemonInstance[] { return services().session.run?.party ?? []; }

  private pockets(): { id: Exclude<BagPocket, 'all'>; rows: BagEntry[] }[] {
    const run = services().session.run;
    if (!run) return [];
    const all = bagEntries(services().session.content, run).filter((e) => e.source === 'bag' && e.quantity > 0);
    return BAG_POCKETS.filter((p): p is Exclude<BagPocket, 'all'> => p !== 'all').map((id) => ({ id, rows: all.filter((e) => e.pocket === id) })).filter((p) => p.rows.length);
  }

  private icon(itemId: string, h: number): string {
    const it = services().session.content.items.get(itemId);
    const manifest = this.scene.cache.json.get('manifest') as Parameters<typeof rxFileOf>[0];
    const f = it ? rxFileOf(manifest, it.iconAssetId) : null;
    return f ? `<img class="px" src="${rxUrl(f.atlas ? `${f.file}.png` : f.file)}" alt="" style="height:${h}px;width:auto">` : SP('g-ball', h);
  }

  render(): string {
    const b = this.host.block();
    if (!b) return '';
    const run: R5Run = r5Run(this.scene, b);
    const content = services().session.content;
    const party = this.party();
    if (this.page === 'bag') {
      const ps = this.pockets();
      this.pocketAt = Math.min(this.pocketAt, Math.max(0, ps.length - 1));
      const p = ps[this.pocketAt];
      const items: R5BagItem[] = (p?.rows ?? []).map((e) => ({ name: e.name, count: e.quantity, icon: this.icon(e.itemId, 32), big: this.icon(e.itemId, 64), about: e.description, usable: !!content.items.get(e.itemId)?.usableOutside }));
      this.item = Math.min(this.item, Math.max(0, items.length - 1));
      return r5Bag({ pocket: p ? POCKET_NAMES[p.id] : 'Items', pockets: Math.max(1, ps.length), pocketAt: this.pocketAt, items, at: this.item, initial: run.initial ?? 'N', notice: this.notice }, run);
    }
    this.at = Math.min(this.at, Math.max(0, party.length - 1));
    if (this.page === 'summary') {
      const mon = party[this.at];
      if (!mon) return '';
      const s = summaryInfo(content, services().session.run, mon);
      const sp = content.species.get(mon.speciesId);
      const keys = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'] as const;
      const nat = s.nature ? ` · Nature: ${s.nature.replace(/\s*\(.*$/, '')}` : '';
      return r5Summary({
        name: mon.care?.nickname || s.name, level: s.level, pic: monPic(this.scene, mon.speciesId, 150, !!mon.shiny),
        line1: `${s.types.map(cap).join(' · ')}${nat}`,
        base: keys.map((k) => sp?.baseStats[k] ?? 0), stats: keys.map((k) => s.stats.find((x) => x.key === k)?.value ?? 0),
        moves: s.moves.map((m) => ({ name: m.name, type: cap(m.type), pp: `PP ${m.pp.split('/')[0]}` })),
        ability: s.ability?.name ?? '—', item: s.held[0]?.name ?? 'None',
        speaker: rotom, line: s.record && !s.record.startsWith('0 battles') ? `“Bzzt! ${s.record} this run.”` : `“Bzzt! ${s.name} hasn’t fought for you yet.”`,
      }, run);
    }
    const mons = party.map((m) => {
      const s = content.species.get(m.speciesId);
      const held = Object.keys(m.held ?? {})[0];
      return {
        name: m.care?.nickname || (s?.name ?? monName(m.speciesId)), level: m.level, types: (s?.types ?? []).map(cap).join(' · '), hp: hpPct(m),
        item: held ? content.catalog.get(held)?.name ?? held : '', pic: monPic(this.scene, m.speciesId, 54, !!m.shiny), big: monPic(this.scene, m.speciesId, 110, !!m.shiny),
      };
    });
    const low = mons.map((m, i) => ({ m, i })).filter((x) => x.m.hp < 50).sort((a, c) => a.m.hp - c.m.hp)[0];
    const useName = this.using ? content.items.get(this.using)?.name ?? this.using : null;
    const line = useName ? `“Bzzt! Who gets the ${useName}?”` : low ? `“Bzzt! ${low.m.name} is at ${low.m.hp}%. Resting tonight heals the whole party.”` : '“Bzzt! The whole party is fighting fit.”';
    return r5Party({ mons, at: this.at, swap: this.swap, using: useName, speaker: rotom, line, notice: this.notice }, run);
  }

  private say(n: string | null): void { this.notice = n; }
  dismiss(): void { this.notice = null; }

  private go(): void {
    const party = this.party();
    if (this.page === 'party') {
      if (!party[this.at]) return;
      if (this.using) {
        try {
          this.say(services().session.useItem(this.using, this.at));
        } catch (e) {
          this.say(e instanceof Error ? e.message : String(e));
        }
        return;
      }
      this.page = 'summary';
      return;
    }
    if (this.page === 'bag') {
      const p = this.pockets()[this.pocketAt];
      const e = p?.rows[this.item];
      if (!e) return;
      if (!services().session.content.items.get(e.itemId)?.usableOutside) return this.say(`${e.name} can’t be used here.`);
      if (!party.length) return;
      this.using = e.itemId;
      this.page = 'party';
      this.at = 0;
      this.notice = null;
    }
  }

  private back(): void {
    if (this.page === 'summary') { this.page = 'party'; return; }
    if (this.page === 'party' && this.using) { this.using = null; this.page = 'bag'; return; }
    this.close();
    this.host.toReserve();
  }

  private doSwap(): void {
    if (this.page !== 'party' || this.using) return;
    if (this.swap === null) { this.swap = this.at; return; }
    if (this.swap !== this.at) {
      try {
        services().session.moveParty(this.swap, this.at);
      } catch (e) {
        this.say(e instanceof Error ? e.message : String(e));
      }
    }
    this.swap = null;
  }

  /** Arrows, Enter and Esc while a page is open. */
  key(a: InputAction): boolean {
    if (!this.page) return false;
    if (this.notice && (a === 'confirm' || a === 'back')) { this.notice = null; return true; }
    const n = this.party().length;
    if (a === 'back') this.back();
    else if (a === 'confirm') this.go();
    else if (this.page === 'bag') {
      const ps = this.pockets();
      if (a === 'left' || a === 'right') { this.pocketAt = (this.pocketAt + (a === 'left' ? -1 : 1) + Math.max(1, ps.length)) % Math.max(1, ps.length); this.item = 0; }
      else { const k = ps[this.pocketAt]?.rows.length ?? 0; if (k) this.item = (this.item + (a === 'up' ? -1 : 1) + k) % k; }
    } else if (n) {
      const d = a === 'up' || a === 'left' ? -1 : 1;
      this.at = (this.at + d + n) % n;
    }
    return true;
  }

  /** S swaps on the Party page; every other letter but the scene's own (Q wheel, End, digits) stays here too. */
  raw(code: string): boolean {
    if (!this.page) return false;
    if (code === 'KeyQ' || code === 'End' || code.startsWith('Digit')) return false;
    if (code === 'KeyS') this.doSwap();
    return true;
  }

  acts(): Record<string, (arg: string) => void> {
    const r = (): void => this.host.refresh();
    return {
      partyPick: (i) => { const again = this.at === Number(i); this.at = Number(i); if (again) this.go(); r(); },
      partyGo: () => { this.go(); r(); },
      partyBack: () => { this.back(); r(); },
      partySwap: () => { this.doSwap(); r(); },
      bagPocket: (d) => { const n = Math.max(1, this.pockets().length); this.pocketAt = (this.pocketAt + Number(d) + n) % n; this.item = 0; r(); },
      bagPick: (i) => { const again = this.item === Number(i); this.item = Number(i); if (again) this.go(); r(); },
    };
  }
  overs(): Record<string, (arg: string) => void> {
    return { partyOver: (i) => { if (this.page === 'party') { this.at = Number(i); this.host.refresh(); } } };
  }

  state(): { page: Page | null; at: number; using: string | null } {
    return { page: this.page, at: this.at, using: this.using };
  }
}
