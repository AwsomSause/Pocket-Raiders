// Builds src/data/megaMoves.json: the Mega signature moves (Overhaul slices 27-28).
//
//   npm run data:mega-moves
//
// Source: tools/data/mega-roster.tsv (the roster Kice approved in plans/mega-signature-roster.md).
// Each row is built from its effect text by the small rules below, and a row with an effect text the
// rules don't know stops the build. Only rows whose batch is at most BUILT_BATCH are written, so the
// moves arrive about 15 at a time. A signature move works only while its Pokémon is Mega Evolved
// (core/battle/megaMove.ts); it carries the `megasig` flag so no random-move pool or learnset picks it up.

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const BUILT_BATCH = Number(process.env.MEGA_BATCH ?? 3);

const root = join(import.meta.dirname, '..');
const STATS: Record<string, string> = { Atk: 'atk', Def: 'def', SpA: 'spa', SpD: 'spd', Spe: 'spe' };
const STATUS: Record<string, string> = { burn: 'brn', paralyze: 'par', poison: 'psn', freeze: 'frz' };
const WEATHER: Record<string, string> = { snow: 'snow', sun: 'sun', rain: 'rain', sandstorm: 'sand' };
const TERRAIN: Record<string, string> = { grassy: 'grassy', electric: 'electric' };
/** Physical moves that are thrown or dropped rather than touched: no contact flag. */
const NO_CONTACT = /Rockfall|Meteor|Avalanche|Quake|Barrage|Boulder|Tempest/;

interface Row { form: string; name: string; type: string; cat: string; power: string; acc: string; pp: string; text: string; batch: number }

const rows: Row[] = readFileSync(join(root, 'tools', 'data', 'mega-roster.tsv'), 'utf8')
  .split('\n')
  .filter((l) => l && !l.startsWith('#'))
  .map((l) => {
    const [form, name, type, cat, power, acc, pp, text, batch] = l.split('|') as [string, string, string, string, string, string, string, string, string];
    return { form, name, type, cat, power, acc, pp, text, batch: Number(batch) };
  });

function build(row: Row): Record<string, unknown> {
  const effects: Record<string, unknown> = {};
  const flags: string[] = ['megasig'];
  const statChanges: unknown[] = [];
  let priority = 0;
  let critStage = 0;
  for (const raw of row.text.split(';').map((c) => c.trim()).filter(Boolean)) {
    const c = raw.toLowerCase().replace(/ \d+ turns$/, '');
    let m: RegExpMatchArray | null;
    if ((m = /^(\d+)% (burn|paralyze|poison|freeze)$/.exec(c))) effects.status = { id: STATUS[m[2]!], chance: Number(m[1]) };
    else if ((m = /^(\d+)% confuse$/.exec(c))) effects.confuse = { chance: Number(m[1]) };
    else if ((m = /^(\d+)% flinch$/.exec(c))) effects.flinchChance = Number(m[1]);
    else if ((m = /^(\d+)% lowers target (\w+)$/.exec(c.replace(/(spa|spd|spe|atk|def)/, (s) => s[0]!.toUpperCase() + s.slice(1).replace('pa', 'pA').replace('pd', 'pD'))))) statChanges.push({ stat: STATS[m[2]!], stages: -1, target: 'enemy', chance: Number(m[1]) });
    else if ((m = /^(\d+)% raises user (\w+)$/.exec(cap(c)))) statChanges.push({ stat: STATS[m[2]!], stages: 1, target: 'self', chance: Number(m[1]) });
    else if ((m = /^lowers target (\w+) and (\w+) 1$/.exec(cap(c)))) for (const s of [m[1]!, m[2]!]) statChanges.push({ stat: STATS[s], stages: -1, target: 'enemy', chance: 100 });
    else if ((m = /^lowers target (\w+) 1$/.exec(cap(c)))) statChanges.push({ stat: STATS[m[1]!], stages: -1, target: 'enemy', chance: 100 });
    else if ((m = /^lowers user (\w+) 1$/.exec(cap(c)))) statChanges.push({ stat: STATS[m[1]!], stages: -1, target: 'self', chance: 100 });
    else if ((m = /^raises user (\w+) (\d)$/.exec(cap(c)))) statChanges.push({ stat: STATS[m[1]!], stages: Number(m[2]), target: 'self', chance: 100 });
    else if ((m = /^sets (\w+) terrain$/.exec(c))) effects.terrain = TERRAIN[m[1]!];
    else if ((m = /^sets (\w+)$/.exec(c)) && WEATHER[m[1]!]) effects.weather = WEATHER[m[1]!];
    else if (c === 'sets toxic spikes on foe side') effects.sideMove = 'toxicSpikes';
    else if ((m = /^heals user (\d)\/(\d) of damage$/.exec(c))) effects.drain = Number(m[1]) / Number(m[2]);
    else if (c === 'heals user 50% max hp and cures its status') { effects.heal = 0.5; effects.cure = 'self'; }
    else if ((m = /^user takes (\d)\/(\d) recoil$/.exec(c))) effects.recoil = Number(m[1]) / Number(m[2]);
    else if ((m = /^hits (\d) times$/.exec(c))) effects.hits = [Number(m[1]), Number(m[1])];
    else if (c === 'hits first (+1)') priority = 1;
    else if (c === 'high crit' || c === 'high crit rate') critStage = 1;
    else if (c === "ignores target's def boosts") effects.ignoreStages = true;
    else if (c === 'double damage to a sleeping target') effects.powerRule = 'doubleTargetAsleep';
    else if (c === 'traps target') effects.bind = true;
    else if (c === 'pulse move') flags.push('pulse');
    else if (c === 'bite move') flags.push('bite');
    else throw new Error(`${row.form}: effect text "${raw}" is not one the builder knows`);
  }
  if (statChanges.length > 0) effects.statChanges = statChanges;
  if (row.cat === 'P' && !NO_CONTACT.test(row.name)) flags.push('contact');
  const status = row.cat === 'St';
  return {
    id: row.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    name: row.name,
    type: row.type,
    category: status ? 'status' : row.cat === 'P' ? 'physical' : 'special',
    power: status ? null : Number(row.power),
    accuracy: row.acc === '-' ? null : Number(row.acc),
    pp: Number(row.pp),
    priority,
    critStage,
    target: status ? 'self' : 'enemy',
    flags,
    effects,
  };
}

function cap(s: string): string {
  return s.replace(/\b(atk|def|spa|spd|spe)\b/g, (x) => ({ atk: 'Atk', def: 'Def', spa: 'SpA', spd: 'SpD', spe: 'Spe' })[x]!);
}

const built = rows.filter((r) => r.batch <= BUILT_BATCH);
const moves = built.map(build);
const byForm: Record<string, string> = {};
const species = JSON.parse(readFileSync(join(root, 'src', 'data', 'species.json'), 'utf8')) as { id: string; name: string }[];
const custom = JSON.parse(readFileSync(join(root, 'src', 'data', 'customSpecies.json'), 'utf8')) as { id: string; name: string }[];
const descriptions: Record<string, string> = {};
for (const [i, r] of built.entries()) {
  const id = (moves[i] as { id: string }).id;
  byForm[r.form] = id;
  const name = [...species, ...custom].find((s) => s.id === r.form)?.name ?? r.form;
  descriptions[id] = `The signature move of ${name}. Only a Mega Evolved Pokémon can use it, in an extra slot, until the battle ends.`;
}
writeFileSync(
  join(root, 'src', 'data', 'megaMoves.json'),
  JSON.stringify({ note: `Generated by npm run data:mega-moves from tools/data/mega-roster.tsv (batches 1-${BUILT_BATCH}). Each move is usable only while its Pokémon is Mega Evolved.`, byForm, descriptions, moves }, null, 1) + '\n',
);
console.log(`mega signature moves: ${moves.length} of ${rows.length} (batches 1-${BUILT_BATCH})`);

// Presentation: each signature move borrows the look of the strongest ordinary move of its type and category
// (src/data/moveAnims.json, presentation only). Run this after `npm run data:anims`, which does not know these moves.
const ordinary = JSON.parse(readFileSync(join(root, 'src', 'data', 'moves.json'), 'utf8')) as { id: string; type: string; category: string; power: number | null }[];
const animsPath = join(root, 'src', 'data', 'moveAnims.json');
const anims = JSON.parse(readFileSync(animsPath, 'utf8')) as { moves: Record<string, unknown> };
for (const m of moves as { id: string; type: string; category: string }[]) {
  const donor = ordinary
    .filter((o) => o.type === m.type && o.category === m.category && anims.moves[o.id] && !/^(z|max)-/.test(o.id))
    .sort((a, b) => (b.power ?? 0) - (a.power ?? 0) || a.id.localeCompare(b.id))[0];
  if (!donor) throw new Error(`no animation donor for ${m.id}`);
  const { pack: _pack, script: _script, ...look } = anims.moves[donor.id] as Record<string, unknown>;
  anims.moves[m.id] = { ...look, source: 'type' };
}
writeFileSync(animsPath, JSON.stringify(anims, null, 2) + '\n');
