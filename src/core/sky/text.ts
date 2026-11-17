// Pidgey's Resolve: the words the rules speak (the scenes' own intros and choices are in data/events/sky-rivalry.json).
// Rule of the director (Kice, 2026-11-14): nothing is cut; the text is allowed to be long and to hurt a little.

import type { SkyEnding, SkySide } from './state';

/** Fearow's moves, in the order it learns them: it gets one more at every meeting (it also grows between them). */
export const FEAROW_TRACK: readonly string[] = ['peck', 'leer', 'pursuit', 'fury-attack', 'aerial-ace', 'agility', 'drill-peck', 'drill-run', 'sky-attack'];
/** gn.02: what Fearow gains each stage of its region, so the finale is fair: S2 Aerial Ace, S3 Agility, S4 Drill Peck, S5 Roost, S6 Mirror Move, S7 Drill Run. */
export const FEAROW_BY_STAGE: readonly string[] = ['aerial-ace', 'agility', 'drill-peck', 'roost', 'mirror-move', 'drill-run'];
export const FEAROW_START: readonly string[] = ['peck', 'fury-attack'];

/** What Fearow shows the first time it is seen with each new move (one line per meeting; index = how many it has learned minus the two it starts with). */
export const FEAROW_GROWTH: readonly string[] = [
  'High over the road a Fearow turns without a sound. It has learned Pursuit: whatever you try to leave behind, it follows.',
  'A Fearow drops out of the cloud and the grass flattens: Fury Attack, six strikes before a heartbeat. It does not hurry. It is not cruel. It is certain.',
  'The Fearow cuts the air in a line so straight it hums. Aerial Ace. Nothing the little bird knows how to dodge will matter to that line.',
  'Fearow tests the wind with one wing, tilts, and is somewhere else. Agility. It has stopped practising and started refining.',
  'The Fearow comes down on a fence post to rest, and the post splinters. Drill Peck. It looks at the little bird, and not unkindly. It would like it to stop.',
  'A corkscrew of dust marks where Fearow has been: Drill Run. It is learning from the ground now, because there is nothing left in the sky to learn from.',
  'Fearow hangs at the top of the sky with its wings folded. Sky Attack. It has never needed to use it on anyone. It practises it on the clouds, so it will never have to.',
];

export const fearowGrowthLine = (learned: number): string => FEAROW_GROWTH[Math.max(0, Math.min(FEAROW_GROWTH.length - 1, learned - 3))] ?? FEAROW_GROWTH[0]!;

/** What Pidgey learns from what beat it: the type that beat it → the answer it carries next time. */
export const ANSWERS: Readonly<Record<string, string>> = {
  grass: 'air-slash', bug: 'air-slash', fighting: 'air-slash', fire: 'rock-throw', water: 'thunderbolt', electric: 'rock-throw',
  ground: 'ice-beam', rock: 'ice-beam', ice: 'heat-wave', steel: 'heat-wave', normal: 'aerial-ace', flying: 'thunderbolt',
  ghost: 'pursuit', dark: 'u-turn', psychic: 'pursuit', poison: 'twister', fairy: 'steel-wing', dragon: 'ice-beam',
};

export const answerLine = (type: string, move: string): string =>
  `Pidgey watches the ${type}-type that beat it the whole way back to the road, tail low, eyes bright. It is not sulking. It is working something out. Next time it will carry an answer: ${move.replace(/-/g, ' ')}.`;

// ---- the opening: the branch ----
export const DUEL_HEADER = [
  'You step off the path and the two of them do not even notice you. A Pidgey, small and brown and stubborn. A Spearow, loud and quick and a size too big for the branch. The branch is not a good branch. It is a branch.',
  'Neither will say why it matters. That is how you know it matters.',
];

export function duelResult(backed: SkySide, winner: SkySide): string[] {
  if (backed === 'pidgey' && winner === 'pidgey') {
    return [
      'Pidgey wins. It does not crow. It stands on the branch for a long moment, shaking, as if it did not expect to be standing there.',
      'The Spearow screams once and is gone. And the little bird looks at you, the one who stood on its side, and does something small and brave: it flies a slow circle around your head, and where it flew the air is warm.',
      'It will not need to prove anything now. You are given a Flying HM, and a quiet thing happens that you only notice later: nobody is chasing anybody anymore. The story ends here.',
    ];
  }
  if (backed === 'spearow' && winner === 'spearow') {
    return [
      'Spearow wins, the way the stronger one wins: quickly, without a speech, without joy. The Pidgey is on its side in the grass, one wing out at a wrong angle, and the Spearow looks at you and then at the branch and then, strangely, away.',
      'The Pidgey gets up. It gets up slowly, and it does not look at the Spearow. It looks at you. It will remember that, and it will remember which of you it was. It vows, in the only language it has, to get stronger.',
      'The story begins.',
    ];
  }
  if (backed === 'spearow' && winner === 'pidgey') {
    return [
      'Spearow loses, and for a moment nobody moves. The bigger bird looks at its own wing as if it had been lied to. Then it wipes its beak on the branch and leaves, and it does not look at you either.',
      'Nothing happens. That is the worst part. Nothing happens, and the Pidgey sits on the branch it won and looks at the empty sky, and you realise you had your answer ready for a bird that did not need it.',
      'It leaves too, in the end. The story never begins.',
    ];
  }
  return [
    'Pidgey loses. It does not cry out. It slides off the branch into the leaves like something that has stopped trying to hold on, and the Spearow is already shouting at the sky about it.',
    'The little bird climbs out of the grass. There is a leaf stuck to its wing. It looks at you, the one who bet on it, and you wish for one second that you had not looked back. Then it lifts its small chin, and it vows, in the only language it has, to get stronger.',
    'The story begins. And Pidgey remembers who backed it.',
  ];
}

// ---- the meetings ----
export const backedLine = (backed: SkySide): string =>
  backed === 'pidgey' ? 'It remembers you were on its side, and stands a little straighter around you.' : 'It remembers you bet on the other bird. It says nothing about it. It does not need to.';

export const SPAR_WON = [
  'You beat it, and it takes the loss like a coin it plans to spend. It sits, panting, and looks at where it went wrong.',
  'You win. It gets up before you can reach for a hand, because it does not want a hand. It wants to know how.',
];
export const SPAR_LOST = [
  'It beat you, and it is so surprised it forgets to be proud. Then it remembers, and it hops, once, and you can see how much it needed that.',
  'It wins, and flutters over, and puts its small head against your knee for the length of one breath. It will not do it again.',
];

export const GIFT_LINES: Record<'berry' | 'item', readonly string[]> = {
  berry: [
    'It looks at the berry for a long time. Nobody has ever given it anything for free. It takes it, and keeps it, tucked under its wing, instead of eating it. It is saving it for something.',
    'It does not eat it. It tucks it into its feathers the way you would keep a note from someone you were afraid to lose.',
  ],
  item: [
    'It takes the gift in its beak, turns it over twice, and tucks it away with a look that says it will carry it to the end. It will.',
    'It holds the gift as if it were a promise. It is.',
  ],
};

export const ALONE_LINES = [
  'You find it alone at the edge of the road, throwing itself at the wind and falling and throwing itself at the wind. It does not notice you. It is not looking for an audience. This is the Pidgey that nobody is meant to see.',
  'It is training by itself in the long grass, beak set, wings out, falling over, getting up. It does not see you. You leave it its privacy, and carry what you saw for the rest of the day.',
];

// ---- the finale ----
export const FINALE_SETUP = [
  'The road ends at a cliff, and the cliff is full of wind. Wild Pokémon have come out along the rocks: Rattata on the ledge, a Machop with its arms crossed, a Zubat that has forgotten to be afraid of daylight. They are not here for you. They are here because they felt it coming, the way a field feels rain.',
  'Pidgeot stands on the high rock with its crest into the gale. Fearow lands across the gap from it. For a long moment they only look at each other. Then Fearow speaks, in the only way it ever has: it takes a step forward.',
];

export const FINALE_ASK = 'Pidgeot and Fearow face each other across the wind, and the whole cliff holds its breath. The Pokémon along the rocks look to you. You have been there since the beginning. It is yours to say. Who are you cheering for?';

export const CHEER_PIDGEOT_LINE = "Pidgeot's resolve is unwavering!";

export function finaleEnd(winner: 'pidgeot' | 'fearow', cheer: 'pidgeot' | 'fearow' | undefined): string[] {
  if (winner === 'pidgeot' && cheer === 'pidgeot') {
    return [
      "Pidgeot's resolve is unwavering! The light that comes off it is not a stone's light. It is only a bird's decision, made harder than a bird should be able to make it, and it wins.",
      'Fearow falls out of the air, lands, and looks up at the one it has been trying to protect all its life from the thing it just became. For the first time it is not certain. Then it bows its head, once, and it flies.',
      'Pidgeot turns to the one who cheered. It has a question in its eyes, and you know what it is.',
    ];
  }
  if (winner === 'pidgeot' && cheer === 'fearow') {
    return [
      'You said the other name. It was a small sound; it reached the cliff anyway. Pidgeot heard it. Rage takes the shape of a wing and it hits Fearow with everything the whole road gave it, and wins.',
      'It does not look at you. It does not look at the Fearow, either, or at the cliff full of watching faces. It lifts into the wind and goes, and it does not look back, because looking back would mean it had forgiven you.',
      'It is not forgiveness yet. Maybe next region.',
    ];
  }
  if (winner === 'pidgeot') {
    return [
      'Pidgeot wins before anyone needed to ask, and stands there not knowing what to do with its wings. There is no one left to beat. It looks at you. It looks at the cliff. Then it goes up into the wind alone, and the gale closes behind it.',
    ];
  }
  if (cheer === 'fearow') {
    return [
      'Fearow wins. And then it does something nobody expected: it lands, folds its wings, and walks over to the one who said its name. It is not a victory walk. It is the walk of a bird that has been waiting its whole life for someone to say it was right to want it to stop, and has not yet decided if it believes it.',
      'Pidgeot lies on the rock, breathing. It is alive. That is all that matters, and Fearow knows it.',
    ];
  }
  if (cheer === 'pidgeot') {
    return [
      'You said its name, and Pidgeot gave you everything, and it was not enough. Fearow stands over it, not triumphant, almost sorry. It did not want this. It wanted it to stop.',
      'Pidgeot gets up. It is a long time getting up. It looks at the one who cheered for it, and then it goes, and Fearow goes the other way, and the cliff is only a cliff.',
    ];
  }
  return [
    'Fearow wins. Neither of them looks at the other, or at the cliff, or at you. Pidgeot leaves first. Fearow, after a while, leaves last. The wind has the cliff to itself.',
  ];
}

// ---- endings and the afterstory ----
export const JOIN_PIDGEOT = 'Pidgeot lands. It is taller than it ever imagined it would be, and it is shaking a little, and it looks at you the way it looked at the branch that first day. It would like to come with you.';
export const JOIN_FEAROW = 'Fearow lands beside you with its crest low. It has never asked anyone for anything. It says, without saying it, that it was wrong about the one it fought, and that it would like to be somewhere it can be a little less sure of everything.';

export const OVERHEAD: Record<'pidgeot' | 'fearow', readonly string[]> = {
  pidgeot: [
    'A shape crosses the top of the sky at the start of the new region, high and alone. A Pidgeot. It is still training. It is not training for anyone now.',
    'The same shape again, a little later: a Pidgeot above the clouds, dropping and climbing, dropping and climbing. It does not need an audience. It has learned what that is for.',
  ],
  fearow: [
    'A shape crosses the top of the sky at the start of the new region, high and alone. A Fearow. It has the same slow climb it has always had. It is still training, and it does not look down.',
    'A Fearow, far above, practising the one thing it was never allowed to forget: how to be strong enough that nobody has to be hurt. It looks smaller than you remember.',
  ],
};

export const REMATCH_INTRO = 'Pidgeot is waiting on the road, as if it had been there since the cliff. It says nothing. It does not need to. It wants one more fight, to finish the last one.';

export function endingLine(ending: SkyEnding): string {
  switch (ending) {
    case 'hm': return 'The story of the branch ended on the first day, and you were the reason.';
    case 'pidgeot-joined': return 'Pidgeot flies at your shoulder now: a stoneless Mega whose resolve you once chose to believe in.';
    case 'pidgeot-free': return 'You let Pidgeot go, and it flew into the high wind where it belonged. It will be overhead again.';
    case 'pidgeot-alone': return 'Pidgeot flew on alone. It will be overhead again.';
    case 'pidgeot-left': return 'Pidgeot left without looking back. You will meet it again in the next region.';
    case 'rematch-done': return 'Pidgeot and you have fought your last fight. Neither of you said anything. Both of you understood.';
    case 'fearow-joined': return 'Fearow joined you. It still flies a little faster than everybody else. It has learned to slow down.';
    case 'fearow-free': return 'You let Fearow go. It will be overhead again.';
    case 'fearow-alone': return 'Both birds went their own way.';
    case 'spearow-lost': return 'The Spearow you backed lost the branch, and left. Nothing began.';
  }
}

/** Splits story lines into pieces that fit the battle message box (about three short lines): whole sentences packed up to `max` characters, a long sentence cut at a space. Nothing is dropped. */
export function chunkLines(lines: readonly string[], max = 84): string[] {
  const out: string[] = [];
  for (const line of lines) {
    for (const paragraph of line.split('\n')) {
      const sentences = paragraph.trim().split(/(?<=[.!?…:;])\s+/).filter(Boolean);
      let current = '';
      const flush = (): void => {
        if (current) out.push(current);
        current = '';
      };
      for (const sentence of sentences) {
        let rest = sentence;
        while (rest.length > max) {
          const cut = rest.lastIndexOf(' ', max);
          const at = cut > max * 0.4 ? cut : max;
          flush();
          out.push(rest.slice(0, at).trim());
          rest = rest.slice(at).trim();
        }
        if (current && current.length + 1 + rest.length > max) flush();
        current = current ? `${current} ${rest}` : rest;
      }
      flush();
    }
  }
  return out;
}
