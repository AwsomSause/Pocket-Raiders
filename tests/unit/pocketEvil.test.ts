// The Pocket look's Evil Team Case File (mock-up `et-file`): the core facts (evilCaseFile) and the page that draws them.
import { describe, expect, it } from 'vitest';
import { evilCaseFile, evilOf, evilStageStart } from '../../src/core/evil/teams';
import { chooseStarter, createRun } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import { pkPageOf } from '../../src/ui/pocket/kit';
import { pkEtFile } from '../../src/ui/pocket/screens/evil';
import { content } from './helpers';

function teamRun(): RunState {
  const run = structuredClone(chooseStarter(content, createRun(content, { runId: 'cf', seed: 'case-file', archetypeId: 'red' }), 0));
  while (!evilOf(run).teamId) evilStageStart(content, run);
  return run;
}

describe('Evil Team Case File', () => {
  it('lists the seven stops: played ones done, the next one now, the rest later with a stop count', () => {
    const run = teamRun(), s = evilOf(run);
    Object.assign(s, { beat: 2, heat: 5, stages: 10, nextAt: 12, region: -1 });
    const before = JSON.stringify(run.story.evil);
    const f = evilCaseFile(content, run)!;
    expect(JSON.stringify(run.story.evil)).toBe(before); // read only
    expect(f.stops.map((x) => x.state)).toEqual(['done', 'done', 'now', 'later', 'later', 'later', 'later']);
    expect(f.stops[2]!.due).toBe(2);
    expect(f.stops[3]!.due).toBe(2 + content.evilTeams.config.beatEvery);
    expect(f.stops[0]!.eventId).toBe(`evil-${s.teamId}-suspicious`);
    expect(f.stops[0]!.name).toBe(content.events.get(f.stops[0]!.eventId)?.name ?? null);
    expect(f.heat).toBe(5);
    expect(f.boss.met).toBe(0);
    const html = pkEtFile({ file: f, boss: null });
    expect(pkPageOf(html)).toEqual({ id: 'et-file', tier: 51, hud: false });
    expect(html).toContain('In 2 stops');
    expect((html.match(/<i>Done<\/i>/g) ?? []).length).toBe(2);
    expect((html.match(/<li class="on/g) ?? []).length).toBe(5);
    expect(html).toContain(`Ambush at ${f.ambushAt}`);
    expect(html).toContain('Not seen yet');
  });
  it('a finished story has no stop to come and counts the Boss once met', () => {
    const run = teamRun(), s = evilOf(run);
    Object.assign(s, { beat: 7, end: 'defeated' });
    s.villains.leader = { met: 2, won: 1 } as never;
    const f = evilCaseFile(content, run)!;
    expect(f.ended).toBe(true);
    expect(f.stops.every((x) => x.state === 'done')).toBe(true);
    const html = pkEtFile({ file: f, boss: null });
    expect(html).toContain('Met 2 · beaten 1');
    expect(html).toContain('pin36 seen');
  });
  it('a run with no team has no Case File', () => {
    const run = structuredClone(chooseStarter(content, createRun(content, { runId: 'cf0', seed: 'case-file', archetypeId: 'red' }), 0));
    run.story.evil = undefined as never;
    expect(evilCaseFile(content, run)).toBeNull();
  });
});
