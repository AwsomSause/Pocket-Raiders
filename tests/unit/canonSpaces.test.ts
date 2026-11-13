import { describe, expect, it } from 'vitest';
import { canonKanto } from '../../src/data/expansion';
import { buildTownMenu, canonSpaceGaps } from '../../src/core/expansion/canonSpaces';

const byId = new Map(canonKanto.spaces.map((s) => [s.id, s]));
const menu = (seed: string, slot: string, flags: string[] = [], completed: string[] = []) => buildTownMenu(canonKanto, { seed, slot, flags: new Set(flags), completed: new Set(completed) });

describe('Kanto canon spaces catalog', () => {
  it('is clean and has the documented counts', () => {
    expect(canonSpaceGaps(canonKanto)).toEqual([]);
    expect(canonKanto.spaces.length).toBe(71);
  });
  it('keeps the director\'s mandatory spaces always placed', () => {
    for (const id of ['cs.kanto.vermilion.flightnorth', 'cs.kanto.saffron.route25', 'cs.kanto.pewter.forest', 'cs.kanto.pewter.moon', 'cs.kanto.lavender.tower']) expect(byId.get(id)?.appears).toBe('always');
  });
  it('reads levels and lengths from the specs', () => {
    expect(byId.get('cs.kanto.pewter.forest')).toMatchObject({ level: { mode: 'relative', offset: -1 }, length: 6 });
    expect(byId.get('cs.kanto.vermilion.flightnorth')).toMatchObject({ level: { mode: 'fixed', min: 5, max: 20 }, length: 7 });
  });
});

describe('Town Roll', () => {
  it('is deterministic for the same seed, slot and flags', () => {
    expect(menu('SEED1', 'stage-1')).toEqual(menu('SEED1', 'stage-1'));
  });
  it('different seeds give different Kantos', () => {
    const menus = new Set(Array.from({ length: 20 }, (_, i) => menu(`S${i}`, 'stage-4').join(',')));
    expect(menus.size).toBeGreaterThan(5);
  });
  it('places Always spaces first and draws 2 early, 3 later', () => {
    const early = menu('A', 'stage-1');
    expect(early.slice(0, 2)).toEqual(['cs.kanto.pewter.forest', 'cs.kanto.pewter.moon']);
    expect(early.length).toBe(2 + 2);
    const late = menu('A', 'stage-4');
    expect(late[0]).toBe('cs.kanto.celadon.mart');
    expect(late.length).toBe(1 + 3);
  });
  it('never offers more than two Pseudo Stages, and never a sub-space or trigger without its condition', () => {
    for (let i = 0; i < 200; i++) for (const slot of ['stage-5', 'stage-7', 'interlude-3']) {
      const m = menu(`P${i}`, slot);
      expect(m.filter((id) => byId.get(id)!.kind === 'PS').length).toBeLessThanOrEqual(2);
      expect(m.every((id) => byId.get(id)!.parent === null)).toBe(true);
      expect(m).not.toContain('cs.kanto.saffron.tournament');
    }
    for (let i = 0; i < 100; i++) expect(menu(`T${i}`, 'stage-2')).not.toContain('cs.kanto.cerulean.hidden-village');
  });
  it('fires trigger spaces only when their flag is set', () => {
    expect(menu('X', 'stage-2', ['kanto.bridge.fell'])).toContain('cs.kanto.cerulean.hidden-village');
    expect(menu('X', 'stage-6', ['kanto.mankey'])).toContain('cs.kanto.saffron.tournament');
  });
  it('skips the S.S. Anne without the ticket and Safari-dependent spaces without Safari Land', () => {
    for (let i = 0; i < 150; i++) expect(menu(`V${i}`, 'stage-3')).not.toContain('cs.kanto.vermilion.ssanne');
    let withTicket = 0;
    for (let i = 0; i < 150; i++) if (menu(`V${i}`, 'stage-3', ['kanto.ssanne.ticket']).includes('cs.kanto.vermilion.ssanne')) withTicket++;
    expect(withTicket).toBeGreaterThan(0);
    for (let i = 0; i < 300; i++) {
      const m = menu(`F${i}`, 'stage-5');
      for (const dep of ['cs.kanto.fuchsia.warden', 'cs.kanto.fuchsia.tauros']) if (m.includes(dep)) expect(m).toContain('cs.kanto.fuchsia.safari');
    }
  });
  it('retires a space once its one-time reward is owned', () => {
    for (let i = 0; i < 150; i++) expect(menu(`M${i}`, 'stage-3', ['kanto.maiden.zcrystal'])).not.toContain('cs.kanto.vermilion.maiden');
  });
  it('the Viridian return only replays Route 22 and leaves completed spaces out', () => {
    const first = menu('R', 'interlude-0');
    const back = menu('R', 'stage-8', [], first);
    expect(back[0]).toBe('cs.kanto.viridian.route22');
    expect(back.filter((id) => first.includes(id))).toEqual(['cs.kanto.viridian.route22']);
  });
  it('opens the Indigo finale with Victory Road, and Cerulean Cave only after it', () => {
    expect(menu('I', 'finale')).toEqual(['cs.kanto.indigo.road']);
    expect(menu('I', 'finale', [], ['cs.kanto.indigo.road'])).toContain('cs.kanto.cerulean.cave');
  });
  it('does not touch the run RNG streams (pure: no shared state)', () => {
    const a = menu('Z', 'stage-4');
    menu('other', 'stage-5');
    expect(menu('Z', 'stage-4')).toEqual(a);
  });
});
