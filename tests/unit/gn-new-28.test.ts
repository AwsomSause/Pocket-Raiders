// Greenneedle gn.new.28 The Ring Under the Bridge (tools/events/co/greenneedle-new-28.ts).
import { describe, expect, it } from 'vitest';
import { content } from './helpers';
import { choose, flagOf, gnRun, lose, open, win } from './helpers/gnPlay';

const go = (run: ReturnType<typeof gnRun>, id: string, label: string) => choose(run, id, label).run;
const next = (run: ReturnType<typeof gnRun>, id?: string): string => {
  const side = run.stage!.map.nodes.find((n) => n.id === run.stage!.current)!.sides.find((x) => x.kind === 'event' && !x.used && x.eventId!.startsWith('gn-new-28-'));
  return id ?? side!.eventId!;
};

describe('gn.new.28 The Ring Under the Bridge', () => {
  it('exists with its rooms', () => {
    for (const id of ['gn-new-28-bridge', 'gn-new-28-third', 'gn-new-28-recruiter', 'gn-new-28-dojo']) expect(content.events.get(id)).toBeTruthy();
  });
  it('winning all three gives the Scrafty with Counter and stops the ring', () => {
    let run = gnRun('n28-win');
    open(run, 'gn-new-28-bridge');
    run = go(run, 'gn-new-28-bridge', 'Enter.');
    run = win(go(run, next(run), 'Fight.'));
    run = win(go(run, next(run), 'Fight.'));
    run = win(go(run, next(run), 'Fight.'));
    run = go(run, next(run), 'Take the Scrafty.');
    const s = run.party.find((m) => m.speciesId === 'scrafty');
    expect(s).toBeTruthy();
    expect(s!.moves.some((m) => m.id === 'counter')).toBe(true);
    expect(flagOf(run, 'ring-won-clean')).toBe(1);
    expect(flagOf(run, 'bridge-ring-stopped')).toBe(1);
  });
  it('throwing the second fight is remembered as a lie and gives no Scrafty', () => {
    let run = gnRun('n28-throw');
    open(run, 'gn-new-28-bridge');
    run = go(run, 'gn-new-28-bridge', 'Enter.');
    run = win(go(run, next(run), 'Fight.'));
    run = go(run, next(run), 'Go down in the second.');
    expect(flagOf(run, 'ring-threw')).toBe(1);
    expect(flagOf(run, 'honest-lied')).toBe(1);
    expect(flagOf(run, 'bridge-ring-stopped')).toBe(0);
    expect(run.party.some((m) => m.speciesId === 'scrafty')).toBe(false);
  });
  it('the crowd learns the owner; the cages free every fighter', () => {
    let run = gnRun('n28-crowd');
    open(run, 'gn-new-28-bridge');
    run = go(run, 'gn-new-28-bridge', 'Sit in the crowd.');
    run = go(run, next(run), 'Memorise the face.');
    expect(flagOf(run, 'ring-knows-owner')).toBe(1);
    let r2 = gnRun('n28-back');
    open(r2, 'gn-new-28-bridge');
    r2 = go(r2, 'gn-new-28-bridge', 'Go round the back.');
    r2 = go(r2, next(r2), 'Open the cages.');
    r2 = go(r2, next(r2), 'Bow back.');
    expect(flagOf(r2, 'ring-freed')).toBe(1);
    expect(flagOf(r2, 'freed-caged')).toBe(1);
    expect(flagOf(r2, 'bridge-ring-stopped')).toBe(1);
    expect(r2.party.some((m) => m.speciesId === 'scrafty')).toBe(true);
  });
  it('losing a fight never ends the run', () => {
    let run = gnRun('n28-lose');
    open(run, 'gn-new-28-bridge');
    run = go(run, 'gn-new-28-bridge', 'Enter.');
    run = lose(go(run, next(run), 'Fight.'));
    expect(run.phase).not.toBe('over');
  });
});
