// Edits the existing src/data/bossTeams.json in place (it does NOT rebuild it, so levels and lineups stay):
//   1. every Gym, Elite Four and Champion team gets at least one of the game's custom forms
//      (Delta, Z, Spooky, Jet and Story Pokémon), picked to fit the boss (Steven: Aggron -> Cataggron);
//   2. every Champion team of region 6 and later (champion index 5..9) gets at least one Legendary.
// Designated gimmick Pokémon (bossGimmicks.json) are never removed, except a non-Mega one whose whole
// family is swapped for its custom form, in which case the designation moves with it.
//   3. LORE: each Champion's Legendaries are picked to fit the trainer (Hau: Tapu Koko, Cynthia: Cresselia).
// Run `npm run data:boss-gimmicks` afterwards (it owns bossGimmicks.json).
//   node tools/build-boss-forms.ts      (deterministic; running it twice changes nothing)
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const dataDir = join(import.meta.dirname, '..', 'src', 'data');
const readJson = <T>(f: string): T => JSON.parse(readFileSync(join(dataDir, f), 'utf8')) as T;

type Stat = 'hp' | 'atk' | 'def' | 'spa' | 'spd' | 'spe';
interface Sp { id: string; types: string[]; baseStats: Record<Stat, number>; learnset: { level: number; move: string }[]; evolvesFrom?: string | null; tags?: string[]; form?: { kind: string; base: string } }
interface Mv { id: string; type: string; category: string; power: number | null; accuracy: number | null; supported?: boolean; effects?: { statChanges?: { stat: string; stages: number; target: string }[] } }
interface Team { level: number; ai: number; members: string[] }
interface Gimmick { order: string[]; mons: Record<string, string> }

const base = readJson<Sp[]>('species.json');
const custom = readJson<Sp[]>('customSpecies.json');
const story = readJson<{ species: Sp[]; moves?: Mv[] }>('storySpecies.json');
const jet = readJson<{ species: Sp[]; moves?: Mv[] }>('jetSpecies.json');
// The Story Overhaul species (S15) are later additions: old-seed tests strip them from the game, so no boss team may use them.
const STORY = new Set(['tuftin', 'oracowl', 'oracowl-day', 'tempestwing', 'megawattrel', 'equinar', 'hollow-shepherd', 'brinecrown', 'veinheart', 'lumeria', 'verdelis']);
const customIds = new Set([...custom, ...story.species, ...jet.species].map((s) => s.id));
const species = new Map([...base, ...custom, ...story.species, ...jet.species].map((s) => [s.id, s]));
const moves = new Map([...readJson<Mv[]>('moves.json'), ...(story.moves ?? []), ...(jet.moves ?? [])].filter((m) => m.supported !== false).map((m) => [m.id, m]));
const bosses = readJson<{ id: string; types: string[]; signature: string[] }[]>('bosses.json');
const balance = readJson<{ levelBst: { base: number; perLevel: number } }>('balance.json');
const gimmicks = readJson<Record<string, Gimmick>>('bossGimmicks.json');
const teams = readJson<Record<string, { gym: Team[]; elite: Team[]; champion: Team[] }>>('bossTeams.json');

const bst = (s: Sp) => Object.values(s.baseStats).reduce((a, b) => a + b, 0);
const isLegend = (s: Sp) => (s.tags ?? []).some((t) => t === 'legendary' || t === 'mythical');
const root = (s: Sp): Sp => { let r = s; for (let g = 0; g < 6 && r.evolvesFrom && species.get(r.evolvesFrom); g++) r = species.get(r.evolvesFrom)!; return r; };
const family = (id: string) => { const s = species.get(id); if (!s) return id; const r = root(s); return r.form?.base ?? r.id; };
const children = new Map<string, number>();
for (const s of species.values()) if (s.evolvesFrom) children.set(s.evolvesFrom, (children.get(s.evolvesFrom) ?? 0) + 1);
const hash = (t: string) => [...t].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0, 2166136261);

// ---------------------------------------------------------------- moves
function pickMoves(s: Sp, level: number): string[] {
  const known = [...new Set(s.learnset.filter((e) => e.level <= level && moves.has(e.move)).map((e) => e.move))];
  const score = (m: Mv) => (m.category === 'status' ? 0 : (m.power ?? 0) * ((m.accuracy ?? 100) / 100) * (s.types.includes(m.type) ? 1.5 : 1));
  if (level < 30) return known.slice(-4);
  const chosen: string[] = [];
  const covered = new Set<string>();
  while (chosen.length < 3) {
    const next = known.filter((id) => !chosen.includes(id)).map((id) => moves.get(id)!).map((m) => ({ m, v: score(m) * (covered.has(m.type) ? 0.45 : 1) })).filter((x) => x.v > 0).sort((a, b) => b.v - a.v || a.m.id.localeCompare(b.m.id))[0];
    if (!next) break;
    chosen.push(next.m.id);
    covered.add(next.m.type);
  }
  const atk = s.baseStats.atk >= s.baseStats.spa ? 'atk' : 'spa';
  const boost = known.find((id) => !chosen.includes(id) && (moves.get(id)!.effects?.statChanges ?? []).some((c) => c.target === 'self' && c.stat === atk && c.stages > 0));
  if (boost) chosen.push(boost);
  for (const id of known.slice().reverse()) if (chosen.length < 4 && !chosen.includes(id) && score(moves.get(id)!) > 0) chosen.push(id);
  return chosen.length > 0 ? chosen : known.slice(-4);
}

const parseSp = (m: string) => m.split(' / ')[0]!;
const parseTraining = (m: string) => m.split(' / ')[2];
const text = (id: string, mv: string[], training?: string) => [id, mv.join(' '), ...(training ? [training] : [])].join(' / ');

// ---------------------------------------------------------------- custom candidates
const EXCLUDED = /-(mega|active|crystal|attack|defence|day|fired|armor)(-|$)|^ditto|^silvally/;
const finals = [...species.values()].filter((s) => customIds.has(s.id) && !STORY.has(s.id) && !isLegend(s) && !(s.tags ?? []).includes('baby') && !EXCLUDED.test(s.id) && !/mega|battle/.test(s.form?.kind ?? '') && !children.has(s.id));
/** A species' own line, from the first stage up to `s`. */
const lineTo = (s: Sp): Sp[] => { const out = [s]; for (let g = 0; g < 4 && out[0]!.evolvesFrom && species.get(out[0]!.evolvesFrom!); g++) out.unshift(species.get(out[0]!.evolvesFrom!)!); return out; };
const bstCap = (level: number) => balance.levelBst.base + balance.levelBst.perLevel * level + 100;
/** The stage of `final`'s line a boss may have at `level` (Cataggron at 60, Aron at 8); undefined when even the first stage is too strong. */
const stageFor = (final: Sp, level: number): Sp | undefined => [...lineTo(final)].reverse().find((s) => customIds.has(s.id) && bst(s) <= bstCap(level) && pickMoves(s, level).length > 0);

// Kice's examples take priority over the type-based ranking.
const PINNED: Record<string, string> = { steven: 'cataggron', piers: 'vine-riff' };

function ranked(boss: (typeof bosses)[number], teamSpecies: Set<string>): Sp[] {
  const sigFamilies = new Set([...boss.signature, ...teamSpecies].map(family));
  return finals
    .map((s) => ({ s, v: (PINNED[boss.id] === s.id ? 100 : 0) + (sigFamilies.has(family(s.id)) ? 4 : 0) + 2 * s.types.filter((t) => boss.types.includes(t)).length + (hash(boss.id + s.id) % 1000) / 1000 }))
    .sort((a, b) => b.v - a.v || a.s.id.localeCompare(b.s.id))
    .map((x) => x.s);
}


// Lore picks, best first. The first goes on every Champion team from region 6; the second joins from region 9.
// Bosses not listed keep the type-matched Legendary chosen above.
const LORE: Record<string, string[]> = {
  misty: ['manaphy', 'suicune'], 'lt-surge': ['zapdos', 'raikou'], erika: ['celebi', 'shaymin'], blaine: ['moltres', 'entei'],
  giovanni: ['mewtwo', 'landorus'], lorelei: ['articuno', 'regice'], agatha: ['giratina', 'spectrier'], lance: ['rayquaza', 'reshiram'],
  sabrina: ['uxie', 'mew'], 'mr-fuji': ['mew'], clair: ['rayquaza'], ethan: ['ho-oh', 'lugia'], kris: ['lugia', 'ho-oh'], lyra: ['suicune', 'entei'],
  elm: ['celebi'], eusine: ['suicune', 'raikou'], roxanne: ['regirock', 'diancie'], flannery: ['heatran', 'entei'], norman: ['regigigas', 'arceus'],
  winona: ['rayquaza', 'tornadus'], juan: ['kyogre', 'manaphy'], phoebe: ['spectrier', 'giratina'], glacia: ['regice', 'articuno'],
  drake: ['rayquaza', 'dialga'], steven: ['regirock', 'registeel'], wallace: ['kyogre', 'manaphy'], brendan: ['latios'], may: ['latias'],
  maxie: ['groudon'], archie: ['kyogre'], shelly: ['kyogre'], zinnia: ['rayquaza'],
  cynthia: ['cresselia', 'arceus'], palmer: ['regigigas', 'cresselia'], cyrus: ['dialga', 'palkia'], rowan: ['arceus', 'dialga'],
  lucian: ['uxie', 'mesprit'], flint: ['heatran', 'entei'], volkner: ['raikou', 'zekrom'], byron: ['dialga', 'registeel'],
  candice: ['regice', 'glastrier'], maylene: ['terrakion', 'cobalion'], gardenia: ['shaymin', 'virizion'], roark: ['regirock', 'diancie'],
  'crasher-wake': ['manaphy', 'kyogre'], barry: ['latios'], dawn: ['jirachi', 'mesprit'],
  n: ['reshiram', 'zekrom'], ghetsis: ['kyurem'], colress: ['genesect'], hilbert: ['zekrom'], hilda: ['reshiram'], cilan: ['virizion'],
  korrina: ['zygarde'], lysandre: ['yveltal'],
  hau: ['tapu-koko'], hala: ['tapu-koko'], olivia: ['tapu-lele'], nanu: ['tapu-bulu'], hapu: ['tapu-fini'], lana: ['tapu-fini'], mallow: ['tapu-bulu'],
  sophocles: ['tapu-koko', 'zeraora'], mina: ['tapu-lele'], gladion: ['silvally'], lillie: ['lunala', 'solgaleo'], lusamine: ['lunala'],
  elio: ['solgaleo'], selene: ['lunala'],
  leon: ['zacian', 'eternatus'], hop: ['zamazenta'], gloria: ['zacian'], raihan: ['eternatus'], rose: ['eternatus'], oleana: ['eternatus'],
  arven: ['koraidon', 'miraidon'], nemona: ['koraidon'], turo: ['miraidon'], sada: ['koraidon'], iono: ['miraidon'], kieran: ['ogerpon'],
  volo: ['giratina'], ash: ['ho-oh', 'lugia'], red: ['mew', 'arceus'],
};

const legends = [...species.values()].filter((s) => isLegend(s) && !STORY.has(s.id) && !s.form && !(s.tags ?? []).includes('baby'));
let customAdded = 0, legendAdded = 0, remapped = 0, skipped = 0;

const place = (team: Team, newId: string, level: number, protect: Set<string>, preferFamily?: string, includeAce = false): boolean => {
  const ns = species.get(newId)!;
  const fam = family(newId);
  const idxs = team.members.map((m, i) => ({ id: parseSp(m), i })).slice(0, includeAce ? undefined : -1);
  let slot = preferFamily ? idxs.find((x) => family(x.id) === preferFamily && !protect.has(x.id)) : undefined;
  // A team that already holds this family elsewhere would end up with a duplicate: skip.
  if (!slot && team.members.some((m) => family(parseSp(m)) === fam)) return false;
  slot ??= idxs.filter((x) => !protect.has(x.id)).sort((a, b) => bst(species.get(a.id) ?? ns) - bst(species.get(b.id) ?? ns))[0];
  if (!slot) return false;
  team.members[slot.i] = text(newId, pickMoves(ns, level), parseTraining(team.members[slot.i]!));
  return true;
};


// Evict story species from boss teams (earlier runs of this tool may have placed them): a plain same-type stand-in
// takes the slot, and the passes below put a custom form or Legendary back where one is due.
const standIns = base.filter((s) => !s.form && !children.has(s.id) && !isLegend(s) && !(s.tags ?? []).includes('baby') && !customIds.has(s.id));
for (const boss of bosses) {
  const bt = teams[boss.id];
  if (!bt) continue;
  for (const team of (['gym', 'elite', 'champion'] as const).flatMap((r) => bt[r])) {
    team.members.forEach((m, i) => {
      const old = species.get(parseSp(m));
      if (!old || !STORY.has(old.id)) return;
      const have = new Set(team.members.map((x) => family(parseSp(x))));
      const pick = standIns
        .filter((c) => !have.has(family(c.id)) && (boss.types.length === 0 || c.types.some((t) => boss.types.includes(t))) && bst(c) <= bstCap(team.level) && pickMoves(c, team.level).length > 0)
        .sort((a, b) => Math.abs(bst(a) - bst(old)) - Math.abs(bst(b) - bst(old)) || a.id.localeCompare(b.id))[0];
      if (pick) team.members[i] = text(pick.id, pickMoves(pick, team.level), parseTraining(m));
    });
  }
}

for (const boss of bosses) {
  const bt = teams[boss.id];
  if (!bt) continue;
  const gim = gimmicks[boss.id];
  const designated = new Set(Object.values(gim?.mons ?? {}));
  const megaMon = gim?.mons.mega;
  const all = (['gym', 'elite', 'champion'] as const).flatMap((r) => bt[r]);
  const cands = ranked(boss, new Set(all.flatMap((t) => t.members.map(parseSp))));
  // One signature custom line per boss: its family swaps in wherever that family already appears.
  const main = cands.find((c) => !megaMon || family(c.id) !== family(megaMon)) ?? cands[0]!;

  for (const role of ['gym', 'elite', 'champion'] as const) {
    bt[role].forEach((team, index) => {
      if (!team.members.some((m) => customIds.has(parseSp(m)))) {
        const order = [main, ...cands.filter((c) => c !== main)];
        let done = false;
        for (const c of order) {
          const st = stageFor(c, team.level);
          if (!st) continue;
          const prefer = family(c.id);
          // Designated Pokémon stay, except non-Mega ones of the family being swapped (the designation follows below);
          // when no other slot is free, any non-Mega designated one may go.
          const tiers = [new Set([...designated].filter((d) => d === megaMon || family(d) !== prefer)), new Set(megaMon ? [megaMon] : [])];
          if (tiers.some((protect) => place(team, st.id, team.level, protect, prefer)) || place(team, st.id, team.level, tiers[0]!, prefer, true)) { done = true; break; }
        }
        if (done) customAdded++;
        else skipped++;
      }
      if (role === 'champion' && index >= 5 && !team.members.some((m) => isLegend(species.get(parseSp(m)) ?? ({} as Sp)))) {
        const used = new Set(bt.champion.flatMap((t) => t.members.map(parseSp)));
        const options = legends
          .filter((l) => !team.members.some((m) => family(parseSp(m)) === family(l.id)))
          .map((l) => ({ l, v: (boss.signature.includes(l.id) ? 6 : 0) + 3 * l.types.filter((t) => boss.types.includes(t)).length - (used.has(l.id) ? 2 : 0) + (bst(l) >= 570 ? 1 : 0) + (hash(`${boss.id}${index}${l.id}`) % 1000) / 1000 }))
          .sort((a, b) => b.v - a.v || a.l.id.localeCompare(b.l.id));
        const custom = team.members.map(parseSp).filter((id) => customIds.has(id));
        const tiers = [new Set([...designated, ...custom]), new Set([...(megaMon ? [megaMon] : []), ...custom])];
        if (options.slice(0, 8).some((o) => tiers.some((protect) => place(team, o.l.id, team.level, protect)))) legendAdded++;
        else skipped++;
      }
    });
  }
  // Lore Legendaries for the late Champions: swap out a type-matched Legendary first, else the weakest free slot.
  const wanted = LORE[boss.id];
  if (wanted) {
    const keep = new Set([...wanted, ...boss.signature]);
    bt.champion.forEach((team, index) => {
      if (index < 5) return;
      for (const id of wanted.slice(0, index >= 8 ? 2 : 1)) {
        if (team.members.some((m) => parseSp(m) === id) || !species.has(id)) continue;
        const ids = team.members.map(parseSp);
        const stray = ids.findIndex((x, i) => i < ids.length - 1 && isLegend(species.get(x) ?? ({} as Sp)) && !keep.has(x));
        if (stray >= 0) {
          team.members[stray] = text(id, pickMoves(species.get(id)!, team.level), parseTraining(team.members[stray]!));
        } else {
          const custom = ids.filter((x) => customIds.has(x));
          const lore = new Set([...custom, ...wanted, ...(megaMon ? [megaMon] : [])]);
          if (!place(team, id, team.level, new Set([...designated, ...lore]))) place(team, id, team.level, lore);
        }
      }
    });
  }
  // A designated Pokémon whose whole family was swapped away: the designation follows to the custom form.
  if (gim) {
    const present = new Set(all.flatMap((t) => t.members.map(parseSp)));
    for (const [kind, id] of Object.entries(gim.mons)) {
      if (present.has(id)) continue;
      const repl = [...present].find((s) => family(s) === family(id) && customIds.has(s));
      if (repl) { gim.mons[kind] = repl; remapped++; continue; }
      // Squeezed out by a Legendary: hand the gimmick to the boss's most common remaining Pokémon that has none yet.
      const freq = new Map<string, number>();
      for (const t of all) for (const m of t.members) freq.set(parseSp(m), (freq.get(parseSp(m)) ?? 0) + 1);
      const taken = new Set(Object.values(gim.mons));
      const next = [...freq.entries()].filter(([s]) => !taken.has(s) && !isLegend(species.get(s) ?? ({} as Sp))).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];
      if (next) { gim.mons[kind] = next[0]; remapped++; }
    }
  }
}

// ---------------------------------------------------------------- repairs
// A major trainer's ace (src/data/overhaul/major_trainers.json) must stay on its boss's teams.
const majors = readJson<{ entries: { bossId?: string; aceId?: string }[] }>('overhaul/major_trainers.json').entries;
for (const e of majors) {
  const bt = e.bossId ? teams[e.bossId] : undefined;
  if (!bt || !e.aceId || !species.has(e.aceId)) continue;
  const aceId: string = e.aceId;
  if ((['gym', 'elite', 'champion'] as const).some((r) => bt[r].some((t) => t.members.some((m) => parseSp(m) === aceId)))) continue;
  // Latest team first (the ace is a boss's top-tier Pokémon); the first one with room and no relative of the ace takes it.
  for (const team of (['gym', 'elite', 'champion'] as const).flatMap((r) => bt[r]).reverse()) {
    const keep = new Set([...Object.values(gimmicks[e.bossId!]?.mons ?? {}), ...team.members.map(parseSp).filter((id) => customIds.has(id) || isLegend(species.get(id) ?? ({} as Sp)))]);
    if (place(team, aceId, team.level, keep)) break;
    // Its own line is already there as a custom form (Blastoise-Delta): the plain ace takes that slot, and another custom form joins.
    const at = team.members.findIndex((m, i) => i < team.members.length - 1 && customIds.has(parseSp(m)) && family(parseSp(m)) === family(aceId));
    if (at < 0) continue;
    const boss = bosses.find((b) => b.id === e.bossId)!;
    const before = [...team.members];
    team.members[at] = text(aceId, pickMoves(species.get(aceId)!, team.level), parseTraining(before[at]!));
    const others = ranked(boss, new Set(team.members.map(parseSp))).filter((c) => family(c.id) !== family(aceId));
    const done = others.some((c) => { const st = stageFor(c, team.level); return st && place(team, st.id, team.level, new Set([...keep, aceId])); });
    if (done) break;
    team.members = before;
  }
}

// No two boss teams may be the same fight (same species and moves, training aside): a repeat swaps its custom form for the boss's next-best one.
const seenTeams = new Set<string>();
let deduped = 0;
for (const boss of bosses) {
  const bt = teams[boss.id];
  if (!bt) continue;
  const cands = ranked(boss, new Set((['gym', 'elite', 'champion'] as const).flatMap((r) => bt[r].flatMap((t) => t.members.map(parseSp)))));
  for (const role of ['gym', 'elite', 'champion'] as const) {
    for (const team of bt[role]) {
      const lineup = () => team.members.map((m) => m.split(' / ').slice(0, 2).join(' / ')).join('|');
      let key = lineup();
      if (seenTeams.has(key)) {
        const at = team.members.findIndex((m, i) => i < team.members.length - 1 && customIds.has(parseSp(m)) && !isLegend(species.get(parseSp(m)) ?? ({} as Sp)));
        if (at >= 0) {
          const old = team.members[at]!;
          for (const c of cands) {
            const st = stageFor(c, team.level);
            if (!st || team.members.some((m, i) => i !== at && family(parseSp(m)) === family(st.id))) continue;
            team.members[at] = text(st.id, pickMoves(st, team.level), parseTraining(old));
            if (!seenTeams.has(lineup())) { deduped++; break; }
            team.members[at] = old;
          }
        }
        key = lineup();
      }
      seenTeams.add(key);
    }
  }
}
console.log(`repeated teams fixed: ${deduped}`);

// One team per line keeps the file readable and its diffs small (same layout as build-boss-teams.ts).
const lines = Object.entries(teams).map(([id, roles]) => {
  const roleText = (Object.keys(roles) as (keyof typeof roles)[])
    .map((role) => `  ${JSON.stringify(role)}: [\n${roles[role].map((t) => '   ' + JSON.stringify({ level: t.level, ai: t.ai, members: t.members })).join(',\n')}\n  ]`)
    .join(',\n');
  return ` ${JSON.stringify(id)}: {\n${roleText}\n }`;
});
writeFileSync(join(dataDir, 'bossTeams.json'), `{\n${lines.join(',\n')}\n}\n`);
console.log(`custom forms added: ${customAdded}, legendaries added: ${legendAdded}, gimmick designations moved: ${remapped}, skipped: ${skipped}`);
