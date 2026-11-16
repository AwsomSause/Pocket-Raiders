// Turns a Jet Pokédex signature move's effect text into battle-engine effects (tools/jet/build-jet-species.ts).
// The pack's own `effects` list is empty for most moves, so the text is the source: each sentence is matched by a
// small rule. A sentence no rule knows is returned in `left` and ends up in docs/status/jet-pokedex-batch5.md as a
// known limit (the move still works as a plain damaging move).

export interface PackMove {
  id: string;
  name: string;
  type: string;
  category: string;
  power: number | null;
  accuracy: number | null;
  neverMisses: boolean;
  pp: number | null;
  priority: number;
  target: string;
  makesContact: boolean;
  flags: string[];
  description: string;
}

type Obj = Record<string, unknown>;
const STAT: Record<string, string> = { attack: 'atk', defense: 'def', 'sp. atk': 'spa', 'sp. def': 'spd', speed: 'spe', accuracy: 'acc', evasion: 'eva' };
const STATUS: Record<string, string> = { burn: 'brn', paralyze: 'par', poison: 'psn', 'badly poison': 'psn', freeze: 'frz', 'fall asleep': 'slp', sleep: 'slp' };
const SIDE: Record<string, string> = { spikes: 'spikes', 'stealth rock': 'stealthRock', 'sticky web': 'stickyWeb', 'toxic spikes': 'toxicSpikes', 'aurora veil': 'auroraVeil', reflect: 'reflect' };
const WEATHER: Record<string, string> = { snow: 'snow', rain: 'rain', 'harsh sunlight': 'sun' };

export function parseMove(m: PackMove): { effects: Obj; flags: string[]; critStage: number; priority: number; accuracy: number | null; left: string[] } {
  const effects: Obj = {};
  const flags = new Set<string>(m.flags.filter((f) => ['sound', 'punch', 'bite', 'slicing', 'pulse', 'bullet', 'wind'].includes(f)));
  if (m.makesContact) flags.add('contact');
  const statChanges: Obj[] = [];
  let critStage = 0;
  let priority = m.priority;
  let accuracy = m.neverMisses ? null : m.accuracy;
  const left: string[] = [];
  const stats = (s: string): string[] | null => {
    const parts = s.split(/,| and /).map((x) => x.trim().toLowerCase()).filter(Boolean);
    return parts.every((p) => STAT[p]) ? parts.map((p) => STAT[p]!) : null;
  };
  const sentences = m.description.replace(/Sp\. /g, 'Sp.\u0001').split(/(?<=\.)\s+/).map((s) => s.replace(/\.$/, '').replace(/\u0001/g, ' ').trim()).filter(Boolean);
  for (const [i, s] of sentences.entries()) {
    let r: RegExpExecArray | null;
    if (/^(Sound-based|Punching move|Biting move|Slicing move|Pulse move|Dance move)$/.test(s)) { if (s.startsWith('Dance')) left.push(s); continue; }
    if (s === 'High critical-hit ratio') { critStage = 1; continue; }
    if (/^Ignores the target's stat changes$/.test(s)) { effects.ignoreStages = true; continue; }
    if (/^(Ignores Protect|Breaks through Protect)$/.test(s)) { effects.breaksProtect = true; continue; }
    if (/^Breaks screens$|^Removes the target's screens$/.test(s)) { effects.breaksScreens = true; continue; }
    if (/^Never misses$|^Can't miss, and ignores the target's stat changes$/.test(s)) { accuracy = null; if (/ignores/.test(s)) effects.ignoreStages = true; continue; }
    if ((r = /^(?:Never misses|Can't miss) in (rain|snow)$/.exec(s))) { effects.sureIn = r[1]; continue; }
    if ((r = /^Traps (?:it|the target) for 4–5 turns/.exec(s))) { effects.bind = true; continue; }
    if (/^Pulls the target closer: the target can't switch out next turn$/.test(s) || /^(?:The target|It) can't switch out for 3 turns$/.test(s)) { effects.trap = true; continue; }
    if (/forces it to switch out$/.test(s)) { effects.forceSwitch = true; continue; }
    if ((r = /^Hits (\d) times$/.exec(s))) { effects.hits = [Number(r[1]), Number(r[1])]; continue; }
    if (s === 'Hits twice') { effects.hits = [2, 2]; continue; }
    if (/^Each hit has a 10% chance to burn$/.test(s)) { effects.status = { id: 'brn', chance: 10 }; continue; }
    if (s === 'Hits all opponents and sets Stealth Rock') { effects.sideMove = 'stealthRock'; left.push('Hits all opponents (hits one foe)'); continue; }
    if (s === 'Power 100') continue;
    if (/^Hits all (opponents|adjacent Pokémon)$/.test(s)) { left.push(`${s} (hits one foe)`); continue; }
    if ((r = /^The user takes 1\/(\d) of the damage dealt as recoil$/.exec(s))) { effects.recoil = 1 / Number(r[1]); continue; }
    if (/^The user restores HP equal to half the damage dealt$/.test(s)) { effects.drain = 0.5; continue; }
    if ((r = /^The user restores 1\/(\d) of its max HP$/.exec(s))) { effects.healSelf = 1 / Number(r[1]); continue; }
    if ((r = /^The user and its allies restore 1\/(\d) of their max HP$/.exec(s)) || (r = /^Restores 1\/(\d) of the max HP of the user and its allies$/.exec(s))) { effects.healSelf = 1 / Number(r[1]); continue; }
    if (/^Restores half of the max HP of the user and its allies and cures their status conditions$/.test(s)) { effects.heal = 0.5; effects.cure = 'self'; continue; }
    if (/^Restores half its max HP and raises its Defense and Sp\. Def by 1 stage$/.test(s)) { effects.heal = 0.5; for (const st of ['def', 'spd']) statChanges.push({ stat: st, stages: 1, target: 'self', chance: 100 }); continue; }
    if ((r = /^Sets (Spikes|Stealth Rock|Sticky Web|Toxic Spikes) on the opponent's side$/.exec(s)) || (r = /^Sets (Stealth Rock)$/.exec(s))) { effects.sideMove = SIDE[r[1]!.toLowerCase()]; continue; }
    if (/^Sets Aurora Veil for 3 turns$/.test(s)) { effects.sideMove = 'auroraVeil'; continue; }
    if (/^Sets Reflect and Light Screen for 3 turns$/.test(s)) { effects.sideMove = 'reflect'; left.push('Light Screen is not set (one screen per move)'); continue; }
    if ((r = /^Sets (snow|rain|harsh sunlight) for 3 turns$/.exec(s))) { effects.weather = WEATHER[r[1]!]; continue; }
    if (s === 'Sets Grassy Terrain') { effects.terrain = 'grassy'; continue; }
    if (/^Removes hazards from the user's side$/.test(s)) { effects.clearHazards = 'self'; continue; }
    if (/^Double power if the target is asleep$/.test(s)) { effects.powerRule = 'doubleTargetAsleep'; continue; }
    if (/^Power is higher the more HP the user has$/.test(s)) { effects.powerRule = 'userHp'; continue; }
    if (/^Fires instantly in harsh sunlight$/.test(s)) { effects.charge = { sunSkips: true }; continue; }
    if (/^Uses the user's Defense instead of Attack\. Power 100$|^Uses the user's Defense instead of Attack$/.test(s)) { effects.attackFrom = 'def'; continue; }
    if (/^Hits the target's weaker defense$/.test(s)) { effects.targetsDefense = true; left.push(s); continue; }
    if (/^Removes the target's stat boosts and cures the user's status$/.test(s)) { effects.resetStages = 'target'; left.push("does not cure the user's status"); continue; }
    if (/^-4 priority\. Deals 1\.5/.test(s)) { priority = -4; effects.counter = 'both'; left.push('returns double the damage (not 1.5x)'); continue; }
    if (/^-4 priority$/.test(s)) { priority = -4; continue; }
    if (/^Deals 1\.5× the damage of the last attack/.test(s)) { effects.counter = 'both'; left.push('returns double the damage (not 1.5x)'); continue; }
    if (/^\+1 priority if the target is at full HP$/.test(s)) { left.push(s); continue; }
    // Chance effects: "30% chance to poison the target", "10% chance to put each target to sleep", "20% chance to lower the target's Defense by 1 stage".
    if ((r = /^(?:(\d+)% chance to )?(badly poison|poison|burn|paralyze|freeze|make the target fall asleep|put each target to sleep|confuse|make the target flinch)(?: each target| the target)?$/.exec(s))) {
      const chance = Number(r[1] ?? 100);
      const w = r[2]!;
      if (w === 'confuse') effects.confuse = { chance };
      else if (w === 'make the target flinch') effects.flinchChance = chance;
      else effects.status = { id: /sleep/.test(w) ? 'slp' : STATUS[w], chance };
      continue;
    }
    if ((r = /^(\d+)% chance to poison or burn the target$/.exec(s))) { effects.status = { id: 'psn', chance: Number(r[1]) }; left.push('poison only (the burn half is not rolled)'); continue; }
    if ((r = /^(\d+)% chance to lower the target's (.+?)(?: by (\d) stages?)?$/.exec(s))) {
      const st = stats(r[2]!);
      if (st) { for (const stat of st) statChanges.push({ stat, stages: -Number(r[3] ?? 1), target: 'enemy', chance: Number(r[1]) }); continue; }
    }
    if ((r = /^Lowers the (?:target's|Speed of all opponents) ?(.*?)(?: by (\d) stages?)?$/.exec(s)) && /Speed of all opponents|target's/.test(s)) {
      const word = /Speed of all opponents/.test(s) ? 'speed' : r[1]!.trim().toLowerCase();
      const st = stats(word);
      if (st) { for (const stat of st) statChanges.push({ stat, stages: -Number(r[2] ?? 1), target: 'enemy', chance: 100 }); if (/all opponents/.test(s)) left.push('all opponents (lowers one foe)'); continue; }
    }
    if ((r = /^Raises the user's (.+?) by (\d) stages?$/.exec(s))) {
      const st = stats(r[1]!);
      if (st) { for (const stat of st) statChanges.push({ stat, stages: Number(r[2]), target: 'self', chance: 100 }); continue; }
    }
    if ((r = /^Raises the (.+?) of the user and its allies by (\d) stage$/.exec(s))) {
      const st = stats(r[1]!);
      if (st) { for (const stat of st) statChanges.push({ stat, stages: Number(r[2]), target: 'self', chance: 100 }); continue; }
    }
    // The first sentence of a longer text is the move's flavour line.
    if (!(i === 0 && sentences.length > 1)) left.push(s);
  }
  if (statChanges.length) effects.statChanges = statChanges;
  return { effects, flags: [...flags], critStage, priority, accuracy, left };
}
