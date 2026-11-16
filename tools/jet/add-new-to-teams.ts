// Works the Jet Pokédex species (batch 5 and the Galarian batch) into the fixed teams: boss teams
// (src/data/bossTeams.json) and Evil Team rank lists (src/data/evilTeams.json).
//
//   node tools/jet/add-new-to-teams.ts          (writes src/data/jetTeamSwaps.json; same input = same output)
//
// bossTeams.json and evilTeams.json stay as their builders wrote them; the swaps are laid over them when the content loads
// (src/data/index.ts applyTeamSwaps), so old-seed tests can leave the file out.
// A new Pokémon only replaces a member it fits: it evolves from that member, is that member's regional form,
// or shares a type with it at a similar power and stage. Typed bosses only take new Pokémon of their own type
// (or swap out an off-type member). Aces, Mega/Tera/Z/Dynamax gimmick Pokémon, legendaries and power-exempt
// species are never touched. Hash picks, no gameplay RNG.

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..', '..');
const dataDir = join(root, 'src', 'data');
const readJson = (f: string) => JSON.parse(readFileSync(join(dataDir, f), 'utf8'));

interface Sp { id: string; name: string; types: string[]; baseStats: Record<string, number>; evolutionStage: number; evolvesFrom?: string | null; tags?: string[]; form?: unknown; learnset: { level: number; move: string }[] }
const jet = readJson('jetSpecies.json');
const all = new Map<string, Sp>();
for (const s of readJson('species.json') as Sp[]) all.set(s.id, s);
for (const s of jet.species as Sp[]) all.set(s.id, s);
for (const p of jet.patches as Partial<Sp>[]) Object.assign(all.get(p.id!) ?? {}, p);
const moves = new Map<string, { type: string; category: string; power?: number; supported?: boolean }>();
for (const m of [...readJson('moves.json'), ...jet.moves]) moves.set(m.id, m);
const learnables = { ...readJson('learnables.json'), ...jet.learnables } as Record<string, { egg?: string[]; other?: string[] }>;
const bst = (s: Sp) => Object.values(s.baseStats).reduce((a, b) => a + b, 0);
const exempt = new Set(Object.keys(readJson('balance.json').powerBudget.exempt));

// New species this pass may place: Jet-batch ids that are not Mega/Gigantamax/legendary/exempt.
const jetIds = new Set((jet.species as Sp[]).map((s) => s.id));
const knownBefore = new Set(readJson('species.json').map((s: Sp) => s.id));
const isNew = (s: Sp) => jetIds.has(s.id) && !knownBefore.has(s.id);
const fresh: Sp[] = [...all.values()].filter(
  (s) => isNew(s) && !/-(mega|gmax)(-|$)/.test(s.id) && !s.form && !(s.tags ?? []).some((t) => ['legendary', 'mythical'].includes(t)) && !exempt.has(s.id) && bst(s) <= 600 && s.id !== 'chronoceli',
);
const kids = new Map<string, Sp[]>();
for (const n of fresh) if (n.evolvesFrom) kids.set(n.evolvesFrom, [...(kids.get(n.evolvesFrom) ?? []), n]);
const regionalBase = (n: Sp): string | undefined => {
  const m = /^(alolan|galarian|paldean)-(.+)$/.exec(n.id);
  return m ? m[2] : undefined;
};

const hash = (text: string): number => {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return ((h >>> 0) % 100000) / 100000;
};
const share = (a: string[], b: string[]) => a.some((t) => b.includes(t));
const minLevel = (stage: number) => (stage >= 4 ? 60 : stage === 3 ? 32 : stage === 2 ? 16 : 1);

/** Four moves for a new member: best STAB attacks first, then other attacks, then one status move. */
function movesFor(n: Sp, level: number): string[] | undefined {
  const pool = new Set<string>();
  for (const e of n.learnset) if (e.level <= Math.max(level, 1)) pool.add(e.move);
  for (const m of learnables[n.id]?.other ?? []) pool.add(m);
  const usable = [...pool].map((id) => ({ id, m: moves.get(id)! })).filter((x) => x.m && x.m.supported !== false);
  const atk = usable.filter((x) => (x.m.power ?? 0) > 0 && x.m.category !== 'status');
  const score = (x: { m: { type: string; power?: number } }) => (x.m.power ?? 0) * (n.types.includes(x.m.type) ? 1.5 : 1);
  const picked: string[] = [];
  const stabs = atk.filter((x) => n.types.includes(x.m.type)).sort((a, b) => score(b) - score(a));
  for (const x of stabs) if (picked.length < 2 && !picked.includes(x.id)) picked.push(x.id);
  const rest = atk.filter((x) => !picked.includes(x.id)).sort((a, b) => score(b) - score(a));
  for (const x of rest) if (picked.length < 3 && (picked.length === 0 || x.m.type !== moves.get(picked[picked.length - 1]!)?.type || picked.length < 2)) picked.push(x.id);
  for (const x of rest) if (picked.length < 3 && !picked.includes(x.id)) picked.push(x.id);
  const status = usable.find((x) => x.m.category === 'status' && ['protect', 'swords-dance', 'calm-mind', 'nasty-plot', 'toxic', 'thunder-wave', 'will-o-wisp', 'recover', 'roost', 'bulk-up', 'iron-defense', 'agility', 'dragon-dance', 'rock-polish'].includes(x.id));
  if (status) picked.push(status.id);
  for (const x of rest) if (picked.length < 4 && !picked.includes(x.id)) picked.push(x.id);
  return picked.length > 0 ? picked : undefined;
}

// ---------------------------------------------------------------- boss teams
const bosses = new Map<string, { types: string[]; signature: string[] }>(readJson('bosses.json').map((b: { id: string; types: string[]; signature: string[] }) => [b.id, b]));
const gimmicks = readJson('bossGimmicks.json') as Record<string, { mons?: Record<string, string> }>;
const bossTeams = readJson('bossTeams.json') as Record<string, Record<string, { level: number; ai: number; members: string[] }[]>>;

interface Option { idx: number; n: Sp; kind: 'evo' | 'regional' | 'type'; w: number }
const options = (bossId: string, role: string, ti: number, level: number, members: string[]): Option[] => {
  const boss = bosses.get(bossId)!;
  const locked = new Set([boss.signature[0], ...Object.values(gimmicks[bossId]?.mons ?? {})]);
  const ids = members.map((m) => m.split('/')[0]!.trim());
  const out: Option[] = [];
  ids.forEach((id, idx) => {
    const M = all.get(id);
    if (!M || locked.has(id) || isNew(M) || /-(mega|gmax)/.test(id)) return;
    if ((M.tags ?? []).some((t) => ['legendary', 'mythical'].includes(t))) return;
    const typedOK = (n: Sp) => boss.types.length === 0 || share(n.types, boss.types) || !share(M.types, boss.types);
    const consider = (n: Sp, kind: Option['kind'], w: number) => {
      if (ids.includes(n.id) || !typedOK(n) || level < minLevel(n.evolutionStage)) return;
      if (Math.abs(bst(n) - bst(M)) > (kind === 'type' ? 45 : 90) || bst(n) < bst(M) - 45) return;
      if (!movesFor(n, level)) return;
      out.push({ idx, n, kind, w });
    };
    for (const n of kids.get(id) ?? []) consider(n, 'evo', 6);
    for (const n of fresh) {
      if (regionalBase(n) === id) consider(n, 'regional', 4);
      else if (share(n.types, M.types) && n.evolutionStage === M.evolutionStage && !n.evolvesFrom?.startsWith(id)) consider(n, 'type', 1);
    }
  });
  return out;
};

const pickOption = (opts: Option[], key: string): Option | undefined => {
  if (opts.length === 0) return undefined;
  const total = opts.reduce((a, o) => a + o.w, 0);
  let r = hash(key) * total;
  for (const o of opts) {
    r -= o.w;
    if (r < 0) return o;
  }
  return opts[opts.length - 1];
};

const chance: Record<string, (ti: number) => number> = { gym: (ti) => (ti < 4 ? 0.08 : 0.15), elite: () => 0.25, champion: () => 0.3 };
let swapped = 0;
const swaps = { boss: {} as Record<string, Record<string, Record<string, string>>>, evil: {} as Record<string, Record<string, Record<string, string>>> };
const used = new Map<string, number>();
for (const [bossId, roles] of Object.entries(bossTeams)) {
  if (!bosses.has(bossId)) continue;
  for (const role of ['gym', 'elite', 'champion'] as const) {
    roles[role]!.forEach((team, ti) => {
      const rounds = 1;
      for (let round = 0; round < rounds; round++) {
        const key = `${bossId}|${role}|${ti}|${round}`;
        if (hash(key + '|go') >= chance[role]!(ti)) continue;
        const o = pickOption(options(bossId, role, ti, team.level, team.members).filter((x) => (used.get(x.n.id) ?? 0) < 25), key);
        if (!o) continue;
        // keep the old member's training and use fresh moves for the new species
        const parts = team.members[o.idx]!.split('/').map((p) => p.trim());
        const mv = movesFor(o.n, team.level)!;
        const text = [o.n.id, mv.join(' '), ...(parts[2] ? [parts[2]] : [])].join(' / ');
        team.members[o.idx] = text;
        ((swaps.boss[bossId] ??= {})[role] ??= {})[`${ti}.${o.idx}`] = text;
        used.set(o.n.id, (used.get(o.n.id) ?? 0) + 1);
        swapped++;
      }
    });
  }
}
// ---------------------------------------------------------------- evil teams
const evil = readJson('evilTeams.json');
let evilSwaps = 0;
for (const team of Object.values(evil.teams) as { id: string; ranks: Record<string, { species: string[] }> }[]) {
  for (const [rank, r] of Object.entries(team.ranks)) {
    const key = `${team.id}|${rank}`;
    const level = rank === 'grunt' ? 12 : rank === 'specialist' ? 30 : rank === 'executive' ? 45 : 60;
    const rounds = rank === 'leader' ? 2 : 1;
    for (let round = 0; round < rounds; round++) {
      const opts: Option[] = [];
      const themeTypes = new Map<string, number>();
      for (const id of r.species) for (const t of all.get(id)?.types ?? []) themeTypes.set(t, (themeTypes.get(t) ?? 0) + 1);
      r.species.forEach((id, idx) => {
        const M = all.get(id);
        if (!M || isNew(M) || (M.tags ?? []).some((t) => ['legendary', 'mythical'].includes(t))) return;
        const consider = (n: Sp, kind: Option['kind'], w: number) => {
          if (r.species.includes(n.id) || level < minLevel(n.evolutionStage) || Math.abs(bst(n) - bst(M)) > (kind === 'type' ? 45 : 90) || bst(n) < bst(M) - 45) return;
          if (kind === 'type' && !n.types.some((t) => (themeTypes.get(t) ?? 0) >= 2)) return;
          opts.push({ idx, n, kind, w });
        };
        for (const n of kids.get(id) ?? []) consider(n, 'evo', 6);
        for (const n of fresh) {
          if (regionalBase(n) === id) consider(n, 'regional', 4);
          else if (share(n.types, M.types) && n.evolutionStage === M.evolutionStage && !n.evolvesFrom?.startsWith(id)) consider(n, 'type', 1);
        }
      });
      if (hash(key + '|' + round + '|go') >= 0.6) continue;
      const o = pickOption(opts, key + round);
      if (!o) continue;
      r.species[o.idx] = o.n.id;
      ((swaps.evil[team.id] ??= {})[rank] ??= {})[String(o.idx)] = o.n.id;
      evilSwaps++;
    }
  }
}
writeFileSync(join(dataDir, 'jetTeamSwaps.json'), JSON.stringify({ note: 'Beta 0.7 Jet Pokédex: new Pokémon worked into fixed boss teams ("<team index>.<member index>": member text) and Evil Team rank lists (rank: {slot: species}). Written by tools/jet/add-new-to-teams.ts, laid over bossTeams.json / evilTeams.json by src/data/index.ts.', ...swaps }, null, 1) + '\n');
console.log(`boss members swapped: ${swapped}; evil rank slots swapped: ${evilSwaps}; new species used: ${used.size}`);
console.log([...used.entries()].sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}:${v}`).join(' '));
