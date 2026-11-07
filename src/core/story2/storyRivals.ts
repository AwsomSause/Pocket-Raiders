// Story Overhaul S10: the seven story rivals as pure helpers over src/data/story/rivals.json and rivalThemes.json (design Part IV-R).
// Roles are written in list order (Primary, Secondary, Friendly), teams and levels come from the Act bands, and Pip's drawn slots use the named
// stream `rival_pip_draw`, so no gameplay roll moves. Nothing here touches a save or the engine; the Director and the first-rival slot read it.
import { hashSeed, Rng } from '../rng';
import { CLUE_TYPES, RIVAL_ROLES, type RivalRole, type RivalThemeRow, type StoryData, type StoryRival } from './schema';

/** The rival cast ids in Rule R2: these never read NpcMemory. */
export const STORY_RIVAL_IDS = ['rv_dara', 'rv_hale', 'rv_ines', 'rv_pip', 'rv_soren', 'rv_kael', 'rv_marisol'] as const;
/** Rivals whose secret or guilt needs scenes of their own, so they cannot be the Friendly rival. */
export const NEVER_FRIENDLY = ['secret', 'turned_villain', 'fallen'] as const;
export const REVEAL_NEEDS = 4;

export interface RivalBands {
  acts: readonly { band: readonly [number, number]; size: number }[];
  /** A Friendly rival uses the band minus this. */
  friendlyOffset: number;
}
export interface RivalRoleIds { primary: string; secondary: string; friendly: string }

export const rivalById = (data: Pick<StoryData, 'rivals'>, id: string): StoryRival | undefined => data.rivals.find((r) => r.id === id);

/** R1: the Director writes `run.story.rivals` as [Primary (major), Secondary, Friendly]. Nothing else may reorder it. */
export const rivalListOrder = (roles: RivalRoleIds): [string, string, string] => [roles.primary, roles.secondary, roles.friendly];

/**
 * Who fills the three roles for a theme (design table, all 10 core themes). A backstory may swap Primary and Secondary:
 * Champion Heir puts Hale in front when the table has him second, Ex-Criminal prefers Kael or Soren. A swap never moves a rival into an "Avoid" slot.
 */
export function rolesForTheme(data: Pick<StoryData, 'rivals' | 'rivalThemes'>, themeId: string, backstory?: string): RivalRoleIds | null {
  const row = data.rivalThemes.find((t) => t.theme === themeId);
  if (!row) return null;
  const roles: RivalRoleIds = { primary: row.primary, secondary: row.secondary, friendly: row.friendly };
  const prefer = backstory === 'bs_champion_heir' ? ['rv_hale'] : backstory === 'bs_ex_criminal' ? ['rv_kael', 'rv_soren'] : [];
  const archetype = (id: string) => rivalById(data, id)?.archetype;
  if (prefer.includes(roles.secondary) && !prefer.includes(roles.primary) && !row.avoid.includes(archetype(roles.secondary) ?? '')) [roles.primary, roles.secondary] = [roles.secondary, roles.primary];
  return roles;
}

/** The key scenes (beats) a rival plays in a role: Primary all four, Secondary three, Friendly one plus its spars. */
export const beatsFor = (rival: StoryRival, role: RivalRole): number[] => rival.sceneBeats[role] ?? [];

/** Whether a rival can fill a role. */
export const canFill = (rival: StoryRival, role: RivalRole): boolean => rival.roles.includes(role);

/** Levels for one Act: the Ace sits at the top of the band, the others at its midpoint; a Friendly rival's band is lowered by the offset. */
export function teamLevels(bands: RivalBands, act: number, role: RivalRole, cap: number, size: number, aceIndex: number): number[] {
  const b = bands.acts[act - 1];
  if (!b) throw new Error(`no rival band for act ${act}`);
  const off = role === 'friendly' ? bands.friendlyOffset : 0;
  const hi = Math.max(1, Math.round((b.band[1] - off) * cap)), mid = Math.max(1, Math.round(((b.band[0] + b.band[1]) / 2 - off) * cap));
  return Array.from({ length: size }, (_, i) => (i === aceIndex ? hi : Math.min(mid, hi)));
}

/** Pip's draw for one fight: `draws` unique species from the pool on the named stream `rival_pip_draw`; a full team already used (`history` keys) is re-drawn. */
export function pipDraw(rival: StoryRival, act: number, seed: string, fight: number, history: readonly string[] = []): string[] {
  const team = rival.teams[act - 1];
  if (!team || !team.draws) return [];
  const rng = new Rng(hashSeed(`${seed}::rival_pip_draw::${act}::${fight}`));
  let pick: string[] = [];
  for (let attempt = 0; attempt < 40; attempt++) {
    pick = rng.shuffle(rival.drawPool).slice(0, team.draws);
    if (!history.includes(pipTeamKey(team.slots.map((s) => s.species), pick))) break;
  }
  return pick;
}
export const pipTeamKey = (fixed: readonly string[], drawn: readonly string[]): string => [...fixed, ...drawn].sort().join(',');

export interface TeamMember { species: string; level: number; ace: boolean; nick?: string; move?: string; item?: string }
/** The team a rival brings to an Act. `freed`: Marisol has Bastion back. Pip's drawn slots come from `drawn` (see `pipDraw`). */
export function teamFor(rival: StoryRival, act: number, o: { role: RivalRole; cap: number; bands: RivalBands; freed?: boolean; drawn?: readonly string[] }): TeamMember[] {
  const team = rival.teams[act - 1];
  if (!team) throw new Error(`${rival.id} has no team for act ${act}`);
  const slots = team.slots.map((s, i) => (s.freedOnly && !o.freed ? { species: team.fallbackSlot?.slot === i + 1 ? team.fallbackSlot.species : s.species, nick: undefined, ace: false, move: undefined, item: undefined } : s));
  // Marisol: Bastion is the Ace only when freed; otherwise the Ace is the stand-in (the slot flagged ace without freedOnly).
  const members: Omit<TeamMember, 'level'>[] = slots.map((s) => ({ species: s.species, ace: !!s.ace, ...(s.nick ? { nick: s.nick } : {}), ...(s.move ? { move: s.move } : {}), ...(s.item ? { item: s.item } : {}) }));
  for (const sp of o.drawn ?? []) members.push({ species: sp, ace: false });
  let aceIndex = members.findIndex((m) => m.ace);
  if (aceIndex < 0) aceIndex = 0;
  const levels = teamLevels(o.bands, act, o.role, o.cap, members.length, aceIndex);
  return members.map((m, i) => ({ ...m, level: levels[i]!, ace: i === aceIndex }));
}

/** The counter swap a rival may make after a loss: Primary any, Secondary once per run, Friendly never. Null when none. */
export function counterFor(rival: StoryRival, act: number, role: RivalRole, o: { used: number; freed?: boolean }): { slot: number; species?: string; vs: string[]; draw?: boolean } | null {
  if (role === 'friendly') return null;
  if (role === 'secondary' && o.used >= 1) return null;
  const c = rival.teams[act - 1]?.counter;
  if (!c || (c.freedOnly && !o.freed)) return null;
  return { slot: c.slot, species: c.species, vs: c.vs, ...(c.draw ? { draw: true } : {}) };
}

// ---------- clue ledgers (Kael, Soren) ----------

/** The ledger the run uses: the full one, or the three-clue compressed one for a Secondary rival. */
export function ledgerFor(rival: StoryRival, role: RivalRole): StoryRival['ledger'] {
  if (role === 'secondary' && rival.compressed) return rival.ledger.filter((c) => rival.compressed!.clueIds.includes(c.id));
  return rival.ledger;
}
/** The reveal stays blocked until enough clues have fired: 4 for the full ledger, 3 for the compressed one. */
export const revealAllowed = (rival: StoryRival, role: RivalRole, fired: number): boolean => fired >= (role === 'secondary' && rival.compressed ? rival.compressed.revealNeeds : REVEAL_NEEDS);

/** Fair-play audit of one ledger (design 4 and the Clue Ledger rules). Empty = passes. */
export function auditLedger(ledger: StoryRival['ledger'], need: { clues: number; acts: number; mandatory: number } = { clues: 5, acts: 3, mandatory: 3 }): string[] {
  const out: string[] = [];
  if (ledger.length < need.clues) out.push(`${ledger.length} clues, needs ${need.clues}`);
  if (new Set(ledger.map((c) => c.act)).size < need.acts) out.push(`clues cover ${new Set(ledger.map((c) => c.act)).size} Acts, needs ${need.acts}`);
  if (ledger.filter((c) => c.mandatory).length < need.mandatory) out.push(`${ledger.filter((c) => c.mandatory).length} clues on mandatory stops, needs ${need.mandatory}`);
  if (ledger.length >= need.clues) for (const t of CLUE_TYPES) if (!ledger.some((c) => c.type === t)) out.push(`no ${t} clue`);
  for (const c of ledger) {
    if (!c.visible) out.push(`${c.id}: not visible`);
    if (!c.cover) out.push(`${c.id}: no innocent reading`);
  }
  return out;
}

/** Every problem in the rival data: references, teams, ledgers, the theme table. Empty = the fair-play audit passes. `species` (optional) checks team species. */
export function rivalAudit(data: StoryData, species?: { has(id: string): boolean }, bands?: RivalBands): string[] {
  const out: string[] = [];
  const chars = new Map(data.characters.map((c) => [c.id, c]));
  const events = new Map(data.events.map((e) => [e.id, e]));
  const has = (k: string) => k in data.text;
  const sp = (id: string, where: string) => { if (species && !species.has(id)) out.push(`${where}: unknown species ${id}`); };
  for (const r of data.rivals) {
    if (chars.get(r.character)?.role !== 'rival') out.push(`${r.id}: character ${r.character} is missing or not a rival`);
    if (!r.roles.includes('primary') || !r.roles.includes('secondary')) out.push(`${r.id}: must fill Primary and Secondary`);
    if (NEVER_FRIENDLY.includes(r.archetype as never) && r.roles.includes('friendly')) out.push(`${r.id}: ${r.archetype} cannot be the Friendly rival`);
    for (const k of [...Object.values(r.lines), r.friendlyLineKey, r.hostileLineKey]) if (!has(k)) out.push(`${r.id}: missing text ${k}`);
    for (const p of r.packs) for (const k of [p.nameKey, p.payoffKey]) if (!has(k)) out.push(`${r.id}: missing text ${k}`);
    for (const role of RIVAL_ROLES) for (const b of r.sceneBeats[role] ?? []) if (!r.scenes.some((s) => s.beat === b)) out.push(`${r.id}: ${role} plays beat ${b} but it has no scene`);
    for (const s of r.scenes) {
      const e = events.get(s.event);
      if (!e) out.push(`${r.id}: scene event ${s.event} does not exist`);
      else if (e.choices.length < 3) out.push(`${s.event}: fewer than 3 choices`);
    }
    const sorted = [...r.teams].map((t) => t.act);
    if (sorted.join() !== '1,2,3,4,5,6') out.push(`${r.id}: teams must be Acts 1 to 6 in order`);
    r.teams.forEach((t, i) => {
      const where = `${r.id} act ${t.act}`;
      const size = t.slots.length + (t.draws ?? 0);
      if (bands && size !== bands.acts[i]?.size) out.push(`${where}: ${size} Pokémon, band says ${bands.acts[i]?.size}`);
      const aces = t.slots.filter((s) => s.ace).length;
      if (aces !== 1) out.push(`${where}: ${aces} Aces (needs exactly 1)`);
      t.slots.forEach((s) => sp(s.species, where));
      if (t.fallbackSlot) sp(t.fallbackSlot.species, where);
      if (t.counter?.species) sp(t.counter.species, `${where} counter`);
      if (t.counter && t.counter.slot > size) out.push(`${where}: counter slot ${t.counter.slot} past the team`);
    });
    r.drawPool.forEach((s) => sp(s, `${r.id} pool`));
    if (r.teams.some((t) => t.draws) && r.drawPool.length < (Math.max(...r.teams.map((t) => t.draws ?? 0)) + 2)) out.push(`${r.id}: draw pool too small`);
    const needsLedger = r.archetype === 'secret' || r.archetype === 'turned_villain';
    if (needsLedger) {
      for (const p of auditLedger(r.ledger)) out.push(`${r.id} ledger: ${p}`);
      const c = r.compressed;
      if (!c) out.push(`${r.id}: no compressed arc`);
      else {
        const picked = r.ledger.filter((x) => c.clueIds.includes(x.id));
        if (picked.length !== c.clueIds.length || picked.length !== c.revealNeeds) out.push(`${r.id}: compressed ledger needs ${c.revealNeeds} known clues`);
        if (picked.map((x) => x.act).sort().join() !== '2,3,4') out.push(`${r.id}: compressed clues must sit one each in Acts 2, 3 and 4`);
      }
    }
    for (const c of r.ledger) for (const k of [c.textKey, c.coverKey, c.retroKey]) if (!has(k)) out.push(`${r.id}: missing text ${k}`);
  }
  const ids = new Set(data.rivals.map((r) => r.id));
  for (const t of data.rivalThemes) {
    const trio = [t.primary, t.secondary, t.friendly];
    if (new Set(trio).size !== 3) out.push(`${t.theme}: roles are not 3 distinct rivals`);
    for (const id of trio) if (!ids.has(id)) out.push(`${t.theme}: unknown rival ${id}`);
    const by = (id: string) => data.rivals.find((r) => r.id === id);
    if (by(t.primary) && t.avoid.includes(by(t.primary)!.archetype)) out.push(`${t.theme}: Primary ${t.primary} is on the Avoid list`);
    if (by(t.friendly) && !by(t.friendly)!.roles.includes('friendly')) out.push(`${t.theme}: ${t.friendly} cannot be Friendly`);
    const pk = by(t.pack.rival);
    if (!pk || !pk.packs.some((p) => p.id === t.pack.pack)) out.push(`${t.theme}: pack ${t.pack.rival}/${t.pack.pack} does not exist`);
  }
  return out;
}
export type { RivalThemeRow };

// ---------- S10 wiring: who plays the three roles in a run, and the plan a story rival brings ----------

/** The run's three story rivals. A theme row decides when the theme has one; otherwise a seeded stream (`story_rival_roles`) deals them, Friendly from the Friendly-capable four. */
export function pickStoryRivals(data: Pick<StoryData, 'rivals' | 'rivalThemes'>, seed: string, themeId?: string, backstory?: string): RivalRoleIds | null {
  if (data.rivals.length < 3) return null;
  const byTheme = themeId ? rolesForTheme(data, themeId, backstory) : null;
  if (byTheme) return byTheme;
  const rng = new Rng(hashSeed(`${seed}::story_rival_roles`));
  const all = data.rivals.map((r) => r.id);
  const primary = rng.pick(all);
  const secondary = rng.pick(all.filter((id) => id !== primary));
  const friendly = rng.pick(data.rivals.filter((r) => r.id !== primary && r.id !== secondary && r.roles.includes('friendly')).map((r) => r.id));
  return { primary, secondary, friendly };
}

/** The role a story rival plays in this run's blueprint, or null when it is not one of the three. */
export function storyRoleOf(roles: RivalRoleIds | undefined, id: string): RivalRole | null {
  if (!roles) return null;
  return roles.primary === id ? 'primary' : roles.secondary === id ? 'secondary' : roles.friendly === id ? 'friendly' : null;
}

/** The Act (1 to 6) a stage belongs to, clamped, from balance.story.actEndStages. */
export function actForStage(actEndStages: readonly number[], stage: number): number {
  const i = actEndStages.findIndex((end) => stage <= end);
  return Math.min(6, Math.max(1, i < 0 ? 6 : i + 1));
}
