// New UI: what a wide-format page shows, read from the running format (core/formats). FormatScene asks for it at
// every draw; nothing here changes the run. Each format has its own mock-up page; anything else gets the plain one.

import { isTempAlly } from '../../core/battle/guests';
import type Phaser from 'phaser';
import { beatenCount, SEAL_BREAKS_AT, type BlackoutState } from '../../core/formats/blackout';
import type { BreatherState } from '../../core/formats/breather';
import { COLOSSUS_REGIONS, type ColossusState } from '../../core/formats/colossus';
import type { ConvoyState } from '../../core/formats/convoy';
import { DEBATE_TABLE, type DebateState } from '../../core/formats/debate';
import type { FrontState } from '../../core/formats/front';
import { cardOf, formatOver } from '../../core/formats/registry';
import { currentFormat } from '../../core/formats/store';
import type { FormatCtx } from '../../core/formats/types';
import { maxHp } from '../../core/pokemon';
import { artOf, monFile, partyChips } from './game';
import type { WideChip, WideModel, WideOption } from './screens/wide';
import type { Art } from './templates';

const EVENT_BG = 'packs/memories/eventbg';

export interface WidePage {
  model: WideModel;
  /** The option ids behind the buttons, in order; empty once only "Continue" is left. */
  ids: string[];
  /** Which buttons can be pressed. */
  open: boolean[];
}

export function widePage(scene: Phaser.Scene, ctx: FormatCtx, index: number): WidePage | null {
  const { content, run } = ctx;
  const slot = currentFormat(run), card = cardOf(ctx);
  if (!slot || !card) return null;
  const over = card.over || formatOver(ctx);
  const ids = over ? [] : card.options.map((o) => o.id);
  let options: WideOption[] = over ? [{ label: 'Continue', sub: '', locked: false }] : card.options.map((o) => ({ label: o.label, sub: o.note ?? '', locked: !o.enabled }));
  const open = options.map((o) => !o.locked);
  const at = Math.max(0, Math.min(options.length - 1, index));
  const state = slot.state as unknown;
  const lines = card.lines;
  const rest = lines.slice(1).join(' ');
  const chips = (note: (fainted: boolean) => string): WideChip[] => partyChips(scene).map((p) => ({ name: p.name, file: p.file, hp: p.hp, note: note(p.fainted) }));
  const nameOf = (speciesId: string): string => content.species.get(speciesId)?.name ?? speciesId;
  const bossArt = (name: string): Art | null => artOf(scene, content.bosses.get(name.toLowerCase())?.sprites.default);
  const classArt = (classId: string): Art | null => artOf(scene, content.trainers.get(classId)?.spriteAssetId);
  const page = (art: string | null, shade: string, text: string, body: WideModel['body']): WidePage => ({ model: { title: card.title, art, shade, options, index: at, text, body }, ids, open });

  if (slot.id === 'breather') {
    const s = state as BreatherState, pct = Math.round(s.healPct * 100);
    const downs = over ? [] : card.options.filter((o) => o.id !== 'rest').map((o) => run.party.find((m) => m.uid === o.id)).filter((m): m is NonNullable<typeof m> => !!m);
    if (downs.length) options = downs.map((m) => ({ label: `Revive ${nameOf(m.speciesId)}`, sub: '', locked: false }));
    else if (!over) options = options.map((o) => ({ ...o, sub: '' }));
    const back = s.revived ? run.party.find((m) => m.uid === s.revived) : undefined;
    return page(`${EVENT_BG}/indoor.png`, '#1a100890', over ? lines.join(' ') : (lines[0] ?? ''), {
      kind: 'breather',
      party: chips((fainted) => (over ? '' : fainted ? 'Revive?' : `+${pct}% HP`)),
      down: downs.map((m) => ({ file: monFile(scene, m.speciesId, 'front', !!m.shiny), name: nameOf(m.speciesId), sub: `Fainted · Lv ${m.level}` })),
      note: over ? (back ? `${nameOf(back.speciesId)} got back up.` : 'Everyone still standing has rested.') : 'Nobody is down.',
      room: { title: 'The quiet room', text: over ? 'The rest is over. The run is saved here.' : rest, facts: [['Heal', `${pct}%`], ['Save', over ? 'Done' : 'When you rest']] },
    });
  }

  if (slot.id === 'blackout') {
    const s = state as BlackoutState, fallen = beatenCount(s);
    // The count is on the Seal's own line, so the sentence that repeats it is left out (what was lost stays).
    const tell = (over ? lines.slice(1, -1) : lines.slice(1)).map((l) => l.replace(/^Anchors beaten: \d+ of \d+\.\s*/, '')).filter(Boolean).join(' ');
    return page(`${EVENT_BG}/city_night.png`, '#5a20a060', over ? `${lines[0] ?? ''} ${lines[lines.length - 1] ?? ''}` : (lines[0] ?? ''), {
      kind: 'blackout',
      anchors: s.anchors.map((a) => {
        const k = ids.indexOf(a.id), sabrina = !!a.sabrina;
        return {
          name: a.name,
          art: sabrina ? (bossArt('sabrina') ?? classArt('psychic')) : classArt(s.region ? 'roughneck' : 'worker'),
          dark: !sabrina,
          state: a.beaten ? 'Fallen' : k >= 0 && options[k]!.locked ? 'Standing · waits for the others' : `Standing · ${a.place}`,
          fallen: a.beaten,
          option: k >= 0 ? k : null,
        };
      }),
      seal: { title: s.region ? card.title : 'The violet Seal', count: `Anchors fallen ${Math.min(fallen, SEAL_BREAKS_AT)} / ${SEAL_BREAKS_AT}`, text: tell },
    });
  }

  if (slot.id === 'convoy') {
    const s = state as ConvoyState;
    return page('arenas/mountain_bg.png', '#0008', rest || (lines[0] ?? ''), {
      kind: 'convoy',
      caption: rest ? (lines[0] ?? '') : '',
      legs: s.legs.map((l, q) => ({ name: l.name, note: q < s.index ? 'Cleared' : q === s.index ? (s.outcome === 'failed' ? 'Got away' : 'Now') : 'Ahead', state: q < s.index ? 'done' : q === s.index ? 'now' : 'ahead' })),
      party: chips(() => ''),
    });
  }

  if (slot.id === 'front') {
    const s = state as FrontState;
    if (s.lanes.length && s.result !== 'none') {
      const up = run.party.filter((m) => m.hp > 0 && !isTempAlly(run.battle, m.uid));
      return page('arenas/power_plant_bg.png', '#0006', lines.length > 2 ? `${lines[0]} ${lines[lines.length - 1]}` : lines.join(' '), {
        kind: 'front',
        lanes: s.lanes.map((l, i) => {
          const me = up[i];
          return {
            name: `Lane ${i + 1}`,
            sub: l.leader === nameOf(l.species) || s.region === 'alola' ? nameOf(l.species) : `${l.leader} · ${l.apex}`,
            foe: monFile(scene, l.species, 'front'),
            foeHp: s.result === 'held' ? 0 : 100,
            you: me ? monFile(scene, me.speciesId, 'back', !!me.shiny) : null,
            youHp: me ? Math.round((me.hp / Math.max(1, maxHp(content, me))) * 100) : 0,
            won: s.result === 'held',
          };
        }),
      });
    }
  }

  if (slot.id === 'debate') {
    const s = state as DebateState, script = DEBATE_TABLE.find((d) => d.region === s.region);
    if (script) {
      const n = script.exchanges.length, ex = script.exchanges[s.index], lost = Math.max(0, Math.min(s.index, n) - s.won);
      const evidence = new Set(script.evidence.map((e) => `arg:${e.id}`));
      if (!over && ex && s.stage === 'argue') options = card.options.map((o) => ({ label: o.label.replace(/^Put forward: /, ''), sub: evidence.has(o.id) ? 'Evidence' : 'Reasoning', locked: !o.enabled }));
      const last = lines[lines.length - 1] ?? '';
      const head = s.result || !ex ? lines.slice(0, -1).join(' ') : s.log.length ? s.log.join(' ') : s.index === 0 ? script.intro : (s.recap[s.recap.length - 1] ?? '');
      return page(`${EVENT_BG}/indoor.png`, '#0007', head || last, {
        kind: 'debate',
        who: {
          art: bossArt(script.opponent) ?? classArt('gentleman'),
          name: script.opponent,
          sub: s.result ? 'The ruling' : !ex ? 'It comes to a battle' : `Exchange ${s.index + 1} of ${n} · Evidence ${s.held.length}/${script.evidence.length}`,
          won: s.won, of: n,
          score: s.won > lost ? `you lead ${s.won}–${lost}` : s.won < lost ? `you trail ${s.won}–${lost}` : `level ${s.won}–${lost}`,
        },
        claim: s.result ? { tag: 'The ruling', text: last } : !ex ? { tag: 'The room', text: last } : s.stage === 'rebut' ? { tag: 'The rebuttal', text: s.log[s.log.length - 1] ?? last } : { tag: 'The claim', text: ex.claim },
        next: !s.result && ex && s.stage === 'argue' ? { tag: 'The rebuttal', text: 'Appears after your argument. You then pick an answer.' } : null,
      });
    }
  }

  if (slot.id === 'colossus') {
    const s = state as ColossusState;
    return page('arenas/power_plant_bg.png', '#0006', lines[0] ?? '', {
      kind: 'plate',
      // The Apex's picture: the region's species, or Kanto's M2.
      mon: monFile(scene, (s.region && COLOSSUS_REGIONS[s.region]?.species) || 'mewtwo', 'front'),
      name: s.apex.name,
      // Kanto's roof fight: the armor's shield comes up at three marks, and the helicopter leaves after ten turns.
      plate: s.region || s.result ? { title: s.apex.code, rows: [], note: '' } : { title: 'Blueprint', rows: [['Shield at 75%', 75], ['Shield at 50%', 50], ['Shield at 25%', 25]], note: 'Ten turns before the helicopter lifts it away.' },
      lines: lines.slice(1),
    });
  }

  return page(null, '', lines[0] ?? '', { kind: 'plain', lines: lines.slice(1) });
}
