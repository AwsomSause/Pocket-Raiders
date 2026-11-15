// Catalog Overhaul Pack, category "places": STORY_FAMILIES_15.md SF94 Relics.
// Three relic lines (Ember, Leaf, Tide). The seed is a held item that grows into a bough and a crown (the `upgradeItem` effect
// renames every copy, in the bag or held). Growth (`relic-growth-<line>`) comes from acts in the line's element (the beacon, the
// Greedent's store, the whale song, the reef guard), from fragments fused at the forge, and from leaving the shrine's relics alone.
// Kice's run-memory rule: the pack's "next run" rewards (the other lines wake, the seeds start at bough) stay inside this run.
import { $, ch, flag, flagIs, heal, item, money, out, ptype, relic, rp, takeNode, type Json } from '../dsl.ts';
import { kind, moment, no } from './_delve.ts';

export const CATEGORY = 'places';

type Line = 'ember' | 'leaf' | 'tide';
const LINES: Line[] = ['ember', 'leaf', 'tide'];
const TYPE: Record<Line, string> = { ember: 'fire', leaf: 'grass', tide: 'water' };
const NAME: Record<Line, string> = { ember: 'Ember', leaf: 'Leaf', tide: 'Tide' };
/** At the shrine, the finished relic waiting on the table for each line (another line's crown). */
const OTHER: Record<Line, Line> = { ember: 'tide', leaf: 'ember', tide: 'leaf' };
const grow = (line: Line, n = 1): Json => flag(`relic-growth-${line}`, n);
const growing = (line: Line): Json => flagIs(`tree-${line}`, 1, 2);
const frag = (n: number): Json => flag('relic-frag', n);
const bond = (n: number, line: Line): Json => ({ kind: 'friendship', bond: n, who: { types: [TYPE[line]] } });

const ROOTS: Json = {
  id: 'relic-tree-roots',
  intro:
    'An old tree stands alone in a clearing, so old its bark has gone silver. Three seeds hang from its lowest branch: one warm as a coal, one green and soft, one cool and beaded with water. A plaque at its foot, worn almost smooth: "Choose a branch. It grows with you, and it bends to you." An old woman sits on the roots with a flask of tea. Old Merrin, the keeper: "Pick one. The other two go back to sleep. That\'s how the tree\'s always been."',
  choices: LINES.map((line) =>
    ch(`The ${NAME[line]} Seed.`, out(
      {
        ember: 'The Ember Seed drops into your palm, warm as a held hand. Merrin nods. "Fire, then. It grows when you\'re brave in the heat: a fire lit, a beacon, a battle in the sun. Give it to whoever carries your fire." The other two seeds close up, quietly, and go to sleep.',
        leaf: 'The Leaf Seed drops into your palm and you swear it breathes. Merrin smiles. "Leaf. That one grows when you mend things: plant, rebuild, feed the hungry. It heals a little better, too." The other two seeds close up, quietly, and go to sleep.',
        tide: 'The Tide Seed drops into your palm, cold and wet, and you can hear the sea in it. Merrin taps it. "Tide. It grows on the water: rescues, songs, the deep. Mind it near the sea." The other two seeds close up, quietly, and go to sleep.',
      }[line],
      item(`relic-${line}-seed`), flag(`tree-${line}`), flag('tree-branch'), moment(`You took the ${NAME[line]} Seed from the Relic Tree.`, 55),
    )),
  ),
};

const RUINS: Json = {
  id: 'relic-fragment-ruins',
  requires: [flagIs('tree-branch', 1)],
  intro:
    'A shrine fallen in on itself: broken walls, a cracked altar, ivy over all of it. Pieces of an old relic lie scattered in the grass like dropped teeth, and your seed stirs in your bag when you step near them. Someone once kept this place. Nobody has for a long time.',
  choices: [
    ch('Gather pieces.', out('You pick the pieces out of the grass, one by one. Most are dead stone. One is warm, like your seed. You pocket it.', frag(1))),
    ch('Mend the altar first.', out('You set the fallen stones back, as near as you can guess, and clear the ivy off the altar. It takes the afternoon. When the last stone sits true the altar glows, faintly, as if it remembers being thanked. Two pieces are warm now, not one.', frag(2), rp(2), ...kind())),
    ch('Leave it.', out('You leave the shrine to the ivy. Some things are allowed to stay broken.')),
  ],
};

const DIG: Json = {
  id: 'relic-fragment-dig',
  requires: [flagIs('tree-branch', 1)],
  intro:
    'A dig site cut into a hillside, all string lines and little flags. A girl in a hat too big for her sits on an upturned bucket, sorting shards. Tuppence, the digger: "You\'ve got a seed, haven\'t you? I can tell, they make the shards hum. Collect three pieces and the forge\'ll do the rest."',
  choices: [
    ch('Dig. (a node)', out('You dig beside her until your arms ache. She talks the whole time, about her gran who dug here first. Near sundown your trowel finds a shard that hums. Tuppence claps. "Told you."', takeNode(), frag(1))),
    ch('Buy a fragment (300).', out('She counts out the change very carefully. "Honest price. Gran said always honest price, because the hill\'s watching." She gives you the best one.', $(-300), frag(1)), { requires: [money(300)] }),
    ch('Leave.', out('You tip your hat to her. She tips hers back, and it falls over her eyes.')),
  ],
};

const FORGE: Json = {
  id: 'relic-forge',
  requires: [flagIs('relic-frag', 3), flagIs('tree-branch', 1)],
  intro:
    'A smith\'s forge in a stone shed, hot enough to feel from the road. A broad man with burn-scarred forearms looks up from the anvil. Hallam, the smith: "Bring me three fragments and I\'ll fuse them into your relic. One rule: I only forge the line you chose."',
  choices: [
    {
      ...ch('Fuse three.', out('Hallam turns your three pieces over in his tongs and shakes his head. "Your line\'s asleep. There\'s nothing for these to join." He gives you the scrap price for them.', frag(-3), $(150))),
      requires: [flagIs('relic-frag', 3)],
      branches: LINES.map((line) => ({
        when: [growing(line)],
        text: `Hallam lays the three pieces in the coals and works the bellows until the shed roars. Then he holds your ${NAME[line]} relic beside them, and the pieces run into it like water finding its level. It comes out of the quench a little heavier. "There. It's grown a step. Feel it?" You do.`,
        effects: [frag(-3), grow(line, 2)],
      })),
    },
    ch('Ask about the other lines.', out('"Shut for this run," says Hallam. "Once a seed\'s chosen the other two sleep till the road\'s done. That\'s not my rule; it\'s the tree\'s." He goes back to the anvil.', { kind: 'addEvent', eventId: 'relic-forge' })),
    ch('Leave.', out('You leave Hallam to his fire. The hammering follows you down the road.')),
  ],
};

const SHRINE: Json = {
  id: 'relic-shrine',
  requires: [flagIs('tree-branch', 1), no('relic-shrine-done')],
  intro:
    'Three relics on a stone table in a shrine with no roof, under an open sky. A carved line runs along the table\'s edge: "Each gift has its price. You may take one." Two of them are finished, crowned and glowing. The third, your own line, is only a sketch carved in the stone: it is not grown yet, and here it never will be.',
  choices: [
    {
      ...ch('Take another line\'s relic.', out('You reach for a crown and your hand stops on its own, as if the stone holds it. Your seed is asleep; there is nothing here to trade.')),
      branches: LINES.map((line) => ({
        when: [growing(line)],
        text: `You take the ${NAME[OTHER[line]]} crown. It is light, and finished, and it is yours now. In your bag your ${NAME[line]} relic goes grey and dry, all at once, like a leaf in autumn. Everything you grew in it is gone. You hold the dead thing for a while before you put it away.`,
        effects: [
          item(`relic-${OTHER[line]}-crown`),
          { kind: 'upgradeItem', from: `relic-${line}-seed`, to: 'withered-relic' },
          { kind: 'upgradeItem', from: `relic-${line}-bough`, to: 'withered-relic' },
          flag(`tree-${line}`, -99), grow(line, -99), flag(`tree-${OTHER[line]}`, 3), flag('relic-shrine-done'),
          moment(`You traded your ${NAME[line]} relic for a finished ${NAME[OTHER[line]]} crown.`, 60),
        ],
      })),
    },
    {
      ...ch('Leave them.', out('You leave the crowns where they lie. The shrine is quiet. Nothing happens, and that is its own answer.', flag('relic-shrine-done'))),
      branches: LINES.map((line) => ({
        when: [growing(line)],
        text: `You leave the crowns where they lie. On the way out your ${NAME[line]} relic grows warm in your bag, warmer than it has ever been, as if it knows what you did not take.`,
        effects: [grow(line, 1), flag('relic-shrine-done'), ...kind()],
      })),
    },
    ch('Read the price.', out('Under the carved line, smaller, cut by a different hand: "Whatever you\'ve grown, you lose." Someone has scratched a tally beside it. Most of the marks are old.', { kind: 'addEvent', eventId: 'relic-shrine' })),
  ],
};

const bough = (line: Line): Json => ({
  id: `relic-tree-${line}-bough`,
  requires: [flagIs(`tree-${line}`, 1, 1), flagIs(`relic-growth-${line}`, 2)],
  intro: `The Relic Tree again, or one just like it. Your ${NAME[line]} relic pulls toward it, and when you hold it up, it has grown: a seed no longer, but a small bough, leaves and all. "Your seed has grown a bough." Old Merrin is there, on the roots, with her flask: "Look at that. You've been busy."`,
  choices: [
    ch('Thank the tree.', out(`You put your hand on the silver bark and say it out loud, feeling foolish, then not. The bough grows warm. Your ${NAME[line]} relic is twice what it was, and your ${TYPE[line]}-type leans into your side the whole way back to the road.`, { kind: 'upgradeItem', from: `relic-${line}-seed`, to: `relic-${line}-bough` }, flag(`tree-${line}`), bond(1, line)), { requires: [ptype(TYPE[line])] }),
    ch('Keep going.', out(`You nod to Merrin and keep walking. The bough settles in your relic all the same: it is twice what it was.`, { kind: 'upgradeItem', from: `relic-${line}-seed`, to: `relic-${line}-bough` }, flag(`tree-${line}`))),
  ],
});

const CROWN_FX: Record<Line, string> = {
  ember: 'Its holder can\'t be burned now.',
  leaf: 'From now on the whole party heals a little after every battle.',
  tide: 'The first move its holder throws in a battle won\'t miss.',
};
const crown = (line: Line): Json => ({
  id: `relic-tree-${line}-crown`,
  requires: [flagIs(`tree-${line}`, 2, 2), flagIs(`relic-growth-${line}`, 4)],
  intro: `The bough on your ${NAME[line]} relic has flowered overnight. "The branch blooms into a crown." Old Merrin turns it over in her hands, and she is crying a little, and does not hide it. "I haven't seen a crown in forty years. Forty years. My mother wore the last one."`,
  choices: [
    ch('Wear it.', out(`You take the crown back from her, carefully. It is yours. ${CROWN_FX[line]} Merrin wipes her eyes on her sleeve and laughs at herself.`, { kind: 'upgradeItem', from: `relic-${line}-bough`, to: `relic-${line}-crown` }, flag(`tree-${line}`),
      ...(line === 'leaf' ? [relic('leaf-crown-bloom', 'Leaf Crown in Bloom', [{ kind: 'postBattleHeal', percent: 5 }])] : []),
      moment(`Your ${NAME[line]} relic bloomed into a crown.`, 65))),
    ch('Give it to the tree.', out(`You hold the crown up to the lowest branch and let go. The tree takes it back. Every leaf in the clearing turns over at once, silver side up, and a warm wind goes through the whole party: every hurt closes, every tired face lifts. Merrin cannot speak. She just holds your hand. Your relic stays a bough, and it stays yours.`,
      heal(1), bond(2, line), { kind: 'friendship', bond: 1, who: 'party' }, flag(`tree-${line}`), flag('tree-crown-given'), ...kind(2),
      moment(`You gave the ${NAME[line]} crown back to the Relic Tree.`, 70))),
  ],
});

export const EVENTS: Json[] = [ROOTS, RUINS, DIG, FORGE, SHRINE, ...LINES.flatMap((l) => [bough(l), crown(l)])];
export const REMOVE: string[] = [];
