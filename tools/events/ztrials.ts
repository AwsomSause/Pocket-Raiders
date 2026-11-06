// S502 Sun/Moon Z-Trials: island trial map events. A trial captain offers a totem challenge for a Z-Crystal, one per type.
// Needs a Z-Ring (the trial is pointless without one). Written with the DSL; tools/build-z-trials.ts adds them to src/data/events.json.
import { ch, ev, fight, has, item, leave, out, rp, trainer, type Json } from './dsl.ts';

const TYPES: { type: string; crystal: string; place: string; captain: string; guardian: string }[] = [
  { type: 'normal', crystal: 'normalium-z', place: 'a grassy shrine', captain: 'Trial Captain Yuri', guardian: 'Totem of the Plains' },
  { type: 'fighting', crystal: 'fightinium-z', place: 'a dojo of stone', captain: 'Trial Captain Gaku', guardian: 'Totem of the Fist' },
  { type: 'flying', crystal: 'flyinium-z', place: 'a cliff above the clouds', captain: 'Trial Captain Sora', guardian: 'Totem of the Wind' },
  { type: 'poison', crystal: 'poisonium-z', place: 'a swamp of green mist', captain: 'Trial Captain Mire', guardian: 'Totem of the Bog' },
  { type: 'ground', crystal: 'groundium-z', place: 'a canyon of red dust', captain: 'Trial Captain Dune', guardian: 'Totem of the Dust' },
  { type: 'rock', crystal: 'rockium-z', place: 'a quarry of glittering stone', captain: 'Trial Captain Flint', guardian: 'Totem of the Quarry' },
  { type: 'bug', crystal: 'buginium-z', place: 'a hollow tree alive with hum', captain: 'Trial Captain Fern', guardian: 'Totem of the Swarm' },
  { type: 'ghost', crystal: 'ghostium-z', place: 'a lantern-lit graveyard', captain: 'Trial Captain Hollow', guardian: 'Totem of the Lantern' },
  { type: 'steel', crystal: 'steelium-z', place: 'a forge under the hill', captain: 'Trial Captain Anvil', guardian: 'Totem of the Forge' },
  { type: 'fire', crystal: 'firium-z', place: 'a caldera of embers', captain: 'Trial Captain Kiawe', guardian: 'Totem of the Caldera' },
  { type: 'water', crystal: 'waterium-z', place: 'a lagoon of clear tide', captain: 'Trial Captain Lana', guardian: 'Totem of the Lagoon' },
  { type: 'grass', crystal: 'grassium-z', place: 'a jungle clearing', captain: 'Trial Captain Mallow', guardian: 'Totem of the Canopy' },
  { type: 'electric', crystal: 'electrium-z', place: 'a power plant humming with sparks', captain: 'Trial Captain Volkner Jr.', guardian: 'Totem of the Storm' },
  { type: 'psychic', crystal: 'psychium-z', place: 'a moonlit observatory', captain: 'Trial Captain Olivia', guardian: 'Totem of the Mind' },
  { type: 'ice', crystal: 'icium-z', place: 'a glacier cave', captain: 'Trial Captain Frost', guardian: 'Totem of the Glacier' },
  { type: 'dragon', crystal: 'dragonium-z', place: 'a ridge where wings once nested', captain: 'Trial Captain Drake', guardian: 'Totem of the Ridge' },
  { type: 'dark', crystal: 'darkinium-z', place: 'a ruin that never sees the sun', captain: 'Trial Captain Nyx', guardian: 'Totem of the Dusk' },
  { type: 'fairy', crystal: 'fairium-z', place: 'a meadow of soft light', captain: 'Trial Captain Lillie', guardian: 'Totem of the Meadow' },
];

export const Z_TRIAL_EVENTS: Json[] = TYPES.map((t) =>
  ev(`island-trial-${t.type}`, `Island Trial: ${t.type[0]!.toUpperCase()}${t.type.slice(1)}`, 'Z-Trials', { rarity: 'rare', minStage: 2, types: [t.type], tint: '#2a3a4a' },
    `${t.captain} waits at ${t.place}. "You carry a Z-Ring. Beat the ${t.guardian} and the ${t.type} Z-Crystal is yours."`,
    [
      ch('Take the trial', fight(`The ${t.guardian} rises, huge and glowing, and the trial begins.`, trainer(t.guardian, { cls: 'ace-trainer', size: 3, types: [t.type], lv: 3, win: [item(t.crystal), rp(6)] })), { requires: [has('z-ring')] }),
      ch('Watch the trial and take notes', out(`You watch a local try the trial. You learn a lot about ${t.type} moves.`, rp(2))),
      ch('Walk on', leave()),
    ]),
);
