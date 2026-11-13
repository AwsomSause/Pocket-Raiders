// Writes src/data/events/xr-run-events.json: the 104 Beta 0.6 run events (FE-44 to FE-75, EN-60 to EN-131) from
// tools/events/expansion/run*.ts. Run with: npm run data:run-events. `--check` fails when the file is out of date.
import { readFileSync, writeFileSync } from 'node:fs';
import { WORLD_EVENTS } from './events/expansion/runWorld.ts';
import { CAST_EVENTS } from './events/expansion/runCast.ts';
import { SHADOW_EVENTS } from './events/expansion/runShadow.ts';
import { LIAISON_EVENTS } from './events/expansion/runLiaison.ts';
import { ROAMING_EVENTS } from './events/expansion/runRoaming.ts';
import { FRIEND_EVENTS } from './events/expansion/runFriend.ts';
import { QUIET_EVENTS } from './events/expansion/runQuiet.ts';
import { REGIONAL_EVENTS } from './events/expansion/runRegional.ts';

const events = [...WORLD_EVENTS, ...CAST_EVENTS, ...SHADOW_EVENTS, ...LIAISON_EVENTS, ...ROAMING_EVENTS, ...FRIEND_EVENTS, ...QUIET_EVENTS, ...REGIONAL_EVENTS];
const ids = new Set<string>();
for (const e of events) {
  const id = String(e.id);
  if (ids.has(id)) throw new Error(`duplicate event id ${id}`);
  ids.add(id);
}
if (events.length !== 104) throw new Error(`expected 104 run events, got ${events.length}`);
const text = JSON.stringify({ events }, null, 1) + '\n';
const url = new URL('../src/data/events/xr-run-events.json', import.meta.url);
if (process.argv.includes('--check')) {
  if (readFileSync(url, 'utf8') !== text) {
    console.error('xr-run-events.json is out of date: run npm run data:run-events');
    process.exit(1);
  }
} else writeFileSync(url, text);
console.log(`xr-run-events.json: ${events.length} events`);
