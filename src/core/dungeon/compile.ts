// Compiles a dungeon definition into room events (stop 'dungeon', room: true), run by the normal event engine and UI.
// Each room's choices are its exits; taking an exit pays the room (battle, loot, heal, check) and opens the next room
// with the `addEvent` effect. Rooms are never drawn on their own. Deterministic: no randomness here.

import type { DungeonDef } from './schema';
import { DUNGEONS } from './schema';

type Raw = Record<string, unknown>;
const roomId = (d: DungeonDef, node: string) => `${d.id.replace(/_/g, '-')}-${node}`;
/** The first room of a dungeon: the event id a gate opens. */
export const entranceEventId = (d: DungeonDef): string => roomId(d, d.nodes[0]!.id);

const cfg = DUNGEONS.config;
const trainerClass = (d: DungeonDef, i: number) => { const list = cfg.trainerClasses[String(d.tier)]!; return list[i % list.length]!; };
const exitWords: Record<string, string> = {
  wild: 'Take the wild path', trainer: 'Go toward the voices', cache: 'Head for the glint of a chest', rest: 'Look for a quiet corner',
  mystery: 'Follow the strange sound', puzzle: 'Try the carved door', trap: 'Cross the suspicious floor', den: 'Follow the tracks',
  rare: 'Follow the unusual cry', hidden: 'Open the sealed door (needs a Key Charm)', boss: 'Climb toward the deepest room', exit: 'Walk out into the light',
};

function room(d: DungeonDef, nodeIndex: number): Raw {
  const n = d.nodes[nodeIndex]!;
  const byId = new Map(d.nodes.map((x) => [x.id, x]));
  const lvl = cfg.levelBonus[d.tier - 1]!;
  const open = (to: string) => ({ kind: 'addEvent', eventId: roomId(d, to) });
  const species = n.kind === 'rare' ? (d.rare ?? d.wild) : d.wild;
  const intro: Record<string, string> = {
    wild: `Something stirs ahead in ${d.name}.`, trainer: `Someone is waiting in ${d.name}, arms folded.`, cache: 'A battered chest sits in a side room.',
    rest: 'A dry corner with room to sit. The air is calm.', mystery: 'Something here does not belong. A faint light pulses.',
    puzzle: 'A carved mechanism blocks the way, its pieces worn but readable.', trap: 'The floor ahead looks wrong: uneven, with scuff marks where others turned back.',
    den: 'Claw marks and nests line the walls. This is somebody\'s home.', rare: 'An unusual cry echoes. Whatever it is, it does not belong here.',
    hidden: 'A sealed chamber, its lock cold and old.', boss: `The deepest room of ${d.name}. Someone guards it.`, exit: 'Daylight again. The way out lies open.',
  };
  const first = n.kind === 'wild' && nodeIndex === 0 ? `${d.intro} ${intro.wild}` : n.kind === 'wild' || nodeIndex > 0 ? intro[n.kind]! : `${d.intro} ${intro[n.kind]}`;
  const choices: Raw[] = [];
  const exits = n.next.length > 0 ? n.next : [''];
  for (const to of exits) {
    const target = to ? byId.get(to) : undefined;
    const label = n.kind === 'exit' ? 'Leave the dungeon' : exitWords[target?.kind ?? 'wild']!;
    const requires = target?.kind === 'hidden' ? [{ kind: 'item', id: 'key-charm' }] : [];
    const onward = to ? [open(to)] : [];
    const fx = (text: string, effects: Raw[] = [], battle?: Raw): Raw => ({ text, effects: [...effects, ...onward], ...(battle ? { battle: { ...battle, win: [...((battle.win as Raw[] | undefined) ?? []), ...onward] } } : {}) });
    const base = { label, ...(requires.length > 0 ? { requires } : {}) };
    switch (n.kind) {
      case 'wild': case 'rare': case 'den':
        choices.push({ ...base, success: fx('You step in.', [], { kind: 'wild', species, levelBonus: lvl + (n.kind === 'den' ? 2 : 0), shinyMultiplier: n.kind === 'rare' ? 2 : 1, chain: n.kind === 'den' ? 2 : 1, win: [{ kind: 'research', amount: n.kind === 'den' ? 2 : 1 }] }) });
        break;
      case 'trainer':
        choices.push({ ...base, success: fx('"You came all this way. Show me why."', [], { kind: 'trainer', classId: trainerClass(d, nodeIndex), name: 'Dungeon Trainer', size: Math.min(3, 1 + d.tier), levelBonus: lvl, win: [{ kind: 'money', amount: cfg.moneyPerTier * d.tier }] }) });
        break;
      case 'boss':
        choices.push({ ...base, success: fx('"This is as far as you go."', [], { kind: 'trainer', classId: d.boss!.classId, name: d.boss!.name, size: d.boss!.size, levelBonus: lvl + 2, win: [{ kind: 'money', amount: cfg.moneyPerTier * d.tier * 2 }, { kind: 'item', id: d.reward.item, count: d.reward.count }, { kind: 'moment', text: `You beat ${d.boss!.name} in ${d.name}.`, importance: 55 }] }) });
        break;
      case 'cache':
        choices.push({ ...base, success: fx('Inside: supplies someone left behind.', [{ kind: 'item', id: cfg.potion[String(d.tier)]!, count: 1 }, { kind: 'item', id: d.supply.item, count: d.supply.count }]) });
        break;
      case 'rest':
        choices.push({ ...base, success: fx('You rest. Everyone recovers some strength.', [{ kind: 'heal', share: cfg.restHeal }]) });
        break;
      case 'mystery':
        choices.push({ ...base, success: fx('The light settles over your team. It feels restorative.', [{ kind: 'heal', share: cfg.mysteryHeal }, { kind: 'research', amount: 1 }]) });
        break;
      case 'puzzle':
        choices.push({ ...base, check: 'intelligence', success: fx('Click. The mechanism turns and a hidden compartment opens.', [{ kind: 'item', id: cfg.potion[String(d.tier)]!, count: 2 }, { kind: 'research', amount: 2 }]), failure: fx('The mechanism jams, and a stone drops on your toes. You pry it open the hard way.', [{ kind: 'damage', share: 0.1 }]) });
        break;
      case 'trap':
        choices.push({ ...base, check: 'intelligence', success: fx('You read the floor and step around the trigger.'), failure: fx('A plate gives way. The party takes a hit before you get across.', [{ kind: 'damage', share: cfg.trapDamage }]) });
        break;
      case 'hidden':
        choices.push({ ...base, success: fx('The lock clicks open. Inside lies an old stash.', [{ kind: 'item', id: d.supply.item, count: d.supply.count + 1 }, { kind: 'research', amount: 3 }]) });
        break;
      case 'exit':
        choices.push({ ...base, success: fx(`You leave ${d.name} with what you found.`, [{ kind: 'item', id: d.reward.item, count: d.reward.count }, { kind: 'money', amount: cfg.moneyPerTier * d.tier }, { kind: 'moment', text: `You explored ${d.name} and made it out.`, importance: 45 }]) });
        break;
    }
  }
  // A trap can also be skipped with an Escape Rope (only when the choices still fit).
  if (n.kind === 'trap' && choices.length <= 3) {
    const to = n.next[0];
    choices.push({ label: 'Use an Escape Rope to skip it', requires: [{ kind: 'item', id: 'escape-rope' }], success: { text: 'You haul the party over the trap on a rope. The rope is spent.', effects: [{ kind: 'loseItem', id: 'escape-rope' }, ...(to ? [open(to)] : [])] } });
  }
  return {
    id: roomId(d, n.id), name: nodeIndex === 0 ? d.name : `${d.name}: ${n.kind}`, group: 'Dungeons', stop: 'dungeon', rarity: 'rare', tags: ['Dungeon', 'Exploration'],
    minStage: 1, room: true, types: [], requires: [], scene: { cast: [], effect: 'none' }, intro: first, choices,
  };
}

/** All rooms of all dungeons (or the given ones) as raw event objects, ready for the events file. */
export function dungeonEvents(defs: readonly DungeonDef[] = DUNGEONS.dungeons): Raw[] {
  return defs.flatMap((d) => d.nodes.map((_, i) => room(d, i)));
}

export const BASIC_ENTRANCES = (): string[] => DUNGEONS.dungeons.filter((d) => d.kind === 'basic').map(entranceEventId);
export const THEMED_ENTRANCES = (): string[] => DUNGEONS.dungeons.filter((d) => d.kind === 'themed').map(entranceEventId);
