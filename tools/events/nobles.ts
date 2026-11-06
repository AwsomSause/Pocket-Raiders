// S498 Legends Arceus Alpha Nobles: a noble Pokémon has gone frenzied. Calm it with a steady stance and it joins you;
// fail, or choose to fight, and it attacks at a higher level. Written with the DSL; tools/build-nobles.ts adds them to src/data/events.json.
import { ch, ev, fight, join, leave, out, rp, item, wild, type Json } from './dsl.ts';

const NOBLES: { id: string; name: string; place: string; type: string }[] = [
  { id: 'arcanine', name: 'Arcanine', place: 'a ridge of burnt grass', type: 'fire' },
  { id: 'electrode', name: 'Electrode', place: 'a field crackling with static', type: 'electric' },
  { id: 'kleavor', name: 'Kleavor', place: 'a quarry of broken stone', type: 'rock' },
  { id: 'lilligant', name: 'Lilligant', place: 'a wildflower meadow', type: 'grass' },
  { id: 'avalugg', name: 'Avalugg', place: 'a snowfield under grey sky', type: 'ice' },
  { id: 'wyrdeer', name: 'Wyrdeer', place: 'a frozen forest edge', type: 'normal' },
  { id: 'ursaluna', name: 'Ursaluna', place: 'a muddy wetland', type: 'ground' },
  { id: 'braviary', name: 'Braviary', place: 'a windswept cliff top', type: 'flying' },
];

export const NOBLE_EVENTS: Json[] = NOBLES.map((n) =>
  ev(`alpha-noble-${n.id}`, `Frenzied Noble: ${n.name}`, 'Alpha Nobles', { rarity: 'rare', minStage: 2, types: [n.type], tint: '#4a2a2a', pokemon: n.id },
    `At ${n.place} a huge ${n.name} thrashes, eyes glowing red. A noble of its kind, driven into a frenzy. It has not noticed you yet.`,
    [
      ch('Hold your ground and calm it', out(`You stand tall and breathe slowly. The frenzy fades. ${n.name} lowers its head and walks with you.`, join({ species: [n.id], lv: 2 }), rp(3)), {
        prompt: { id: 'brace-hold', needs: 'good' },
        fail: fight(`The ${n.name} lunges. The frenzy is too strong to talk down.`, wild({ species: [n.id], lv: 5, win: [item('rare-candy'), rp(6)] })),
      }),
      ch('Fight the frenzied noble', fight(`${n.name} charges, far stronger than a normal one.`, wild({ species: [n.id], lv: 5, win: [item('rare-candy'), rp(6)] }))),
      ch('Back away quietly', leave()),
    ]),
);
