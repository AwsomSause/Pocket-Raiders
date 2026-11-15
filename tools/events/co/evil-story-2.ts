// Catalog Overhaul Pack, STORY_FAMILIES_13 Part D: the sixty-four Operations (four per team). Every scene has the doc's shape:
// the opening (the catalog description, expanded), one line from the Operation's lead, then "Stop it by force." / the
// Operation's own "another way" / "Let it happen.", with the lasting effect stated before the player decides. The lasting
// effects themselves live in src/data/evilTeams.json (written by _evil-story-sync.ts) and are applied by core/evil/teams.ts.
// Also here: the two hostile bosses an Operation can let loose (Genesect, Type: Null) and the Liberation Rally speech.
import { $, any, ch, ev, fight, flag, flagIs, join, lose, out, room, trainer, wild, type Json } from '../dsl.ts';
import { evil as story, foe, kind, prompt } from './_evil-story-kit.ts';
import { TEAMS, type TeamOp, type TeamStory, type Way } from './_evil-story-teams.ts';
import { teamJson } from './evil-story-1.ts';

export const CATEGORY = 'evil-story';

const say = (who: string, line: string): string => `${who}: "${line}"`;
const has = (m: string): Json => ({ kind: 'evil', has: m });

function operation(t: TeamStory, op: TeamOp, index: number): Json[] {
  const j = teamJson(t.id);
  const id = `evil-${t.id}-op-${op.id}`;
  const stop = (outcome: 'foiled' | 'infiltrated' | 'succeeded') => story({ op: outcome, opId: op.id });
  // "A battle, usually two Grunts then a lead." The fourth box on the whiteboard is the trap: an Admin waits there.
  const trap = index === 3;
  const force = (o: { half?: boolean } = {}) => foe(trap ? 'executive' : 'specialist', op.lead, o.half ? 2 : 3, { chain: o.half ? 1 : 2, win: [stop('foiled'), $(1200)] });
  const forceText = trap ? `Two ${j.ranks.grunt.name}s come at you first. Behind them, unhurried, an Admin who has been waiting for exactly this.` : `Two ${j.ranks.grunt.name}s get between you and the work, and behind them ${op.lead} is already reaching for a Ball.`;
  const forceChoice = (o: { half?: boolean; text?: string } = {}) => ch('Stop it by force.', fight(o.text ?? forceText, force(o), story({ heat: 1 })));
  const extras: Json[] = [];

  const wayChoice = (w: Way): Json => {
    const label = w.label;
    if (op.id === 'liberation-rally') {
      return ch(label, out(w.text, room(`${id}-speech`)));
    }
    if (w.fight) {
      const battle = w.fight.format === 'triples'
        ? { kind: 'trainer', evil: 'grunt', name: w.fight.name, size: w.fight.size, levelBonus: w.fight.lv, format: 'triples', chain: 1, win: [stop('infiltrated')] }
        : trainer(w.fight.name, { size: w.fight.size, lv: w.fight.lv, win: [stop('infiltrated')] });
      return ch(label, fight(w.text, battle, ...(w.effects ?? [])), w.requires ? { requires: w.requires } : {});
    }
    const done: Json[] = [...(w.effects ?? []), ...(w.alpha ? [flag('calmed-alpha')] : []), ...(w.partial ? [flag('crisis-blackout-start')] : []), stop('infiltrated')];
    if (w.prompt) {
      return ch(label, out(w.text, ...done), { ...(w.requires ? { requires: w.requires } : {}), prompt: prompt(w.prompt), fail: fight(`${w.fail ?? 'They see you.'} There's no talking your way out of it now.`, force(), story({ heat: 1 })) });
    }
    if (w.chance !== undefined) {
      return ch(label, out(w.text, ...done), { ...(w.requires ? { requires: w.requires } : {}), chance: w.chance, fail: out(w.fail ?? w.text, ...(w.failEffects ?? []), ...done) });
    }
    return ch(label, out(w.text, ...done), w.requires ? { requires: w.requires } : {});
  };

  const letIt = ch('Let it happen.', out(`You leave them to it. It isn't your fight, you tell yourself, and you very nearly believe it by the time you reach the road. ${op.stated}`, stop('succeeded')));
  const celosia = (fx: Json[]) => foe('executive', 'Admin Celosia', 4, { win: [stop('foiled'), ...fx] });
  const shut = [flag('flare-mine-shut'), flag('mega-resolved'), join({ species: ['mareep'] })];
  let choices: Json[];
  if (op.id === 'stone-mining') {
    // M2 The Stone Harvest (QUESTLINES_ALPHAS_AND_ANOMALIES): the seam chamber's three answers, plus letting the mine run.
    choices = [
      ch('Return the stones to the ground.', fight(`"Then make me," Celosia says, and her Manectric's mane crackles.`, celosia(shut))),
      ch('Take the stones.', fight(`"So you want them too," Celosia says. "Of course you do."`, celosia([flag('flare-stones-taken'), any('manectite', 'ampharosite', 'houndoominite', 'absolite', 'heracronite', 'aggronite'), any('manectite', 'ampharosite', 'houndoominite', 'absolite', 'heracronite', 'aggronite')]))),
      wayChoice(op.way),
      letIt,
    ];
  } else {
    choices = [forceChoice(), wayChoice(op.way), ...(op.way2 ? [wayChoice(op.way2)] : []), letIt];
  }

  const remembers: Json[] = [];
  if (op.id === 'stone-mining') {
    remembers.push({ id: 'bribed', when: [flagIs('flare-bribed')], notice: say('Celosia', `You took one. You're no different.`), hide: [0], addChoices: [ch('Give the stone back, then return them all.', fight(`You hold out the stone they paid you with. Celosia looks at it for a long moment before she reaches for her Ball.`, celosia(shut), lose()))] });
  } else {
    // A7: the lieutenant under arrest halves the guards on the Operation you marked first.
    remembers.push({ id: 'halved', when: [has('lieutenant-arrested'), has(`plan-first-${op.id}`)], notice: `With ${t.lt.name} under arrest, half the guards never turned up.`, hide: [0], addChoices: [forceChoice({ half: true, text: `One ${j.ranks.grunt.name} and ${op.lead}. That's all that's left of the guard.` })] });
    if (trap) remembers.push({ id: 'warned', when: [{ kind: 'evil', defector: true }], notice: `Just as you were warned: an Admin is waiting here, out of sight behind the others.` });
  }

  const event: Json = {
    id,
    name: op.name,
    requires: [{ kind: 'evil', team: t.id, op: op.id, afterFirst: true }],
    intro: `${op.opening} ${op.line ? say(op.lead, op.line) : `${op.lead}, rapping badly.`} If nobody stops it: ${op.stated}`,
    choices,
    ...(remembers.length ? { remembers } : {}),
  };

  if (op.id === 'liberation-rally') {
    // "Speak at the rally yourself (three choices; one convinces the crowd)."
    extras.push(ev(`${id}-speech`, 'Your Turn at the Microphone', 'Evil Teams', { room: true, cast: [j.ranks.executive.sprite], tint: j.color },
      `The crowd goes quiet in the way crowds do when they are waiting to be told something. A girl in the front row has her Poké Ball in both hands, holding it against her chest. Sage Rood smiles at you, the kind smile of someone who has done this a hundred times.`,
      [
        ch('"Ask your Pokémon. Open the Ball and ask."', out(`You say it, and then you take your own Ball off your belt and open it. Your Pokémon comes out, looks at the crowd, looks at you, and leans its whole weight against your leg. Nobody says anything for a while. Then the girl in the front row opens hers. One by one, all down the rows, people let their Pokémon out to see what they will do, and not one of them walks away. Rood is still smiling, but nobody is looking at him any more.`, story({ op: 'infiltrated', opId: op.id }), ...kind(1))),
        ch('"Team Plasma just wants an army."', fight(`It's true, and it doesn't matter. "Who are you to say?" someone shouts, and the crowd turns its back on you. Rood's helpers take you by the elbows, very gently, off the stage and into an alley full of ${j.ranks.grunt.name}s.`, foe('specialist', 'Sage Rood', 3, { chain: 2, win: [story({ op: 'foiled', opId: op.id })] }))),
        ch('"Pokémon are happier with us. Everybody knows that."', fight(`"Everybody knows it, do they?" Rood asks, mild as milk, and the crowd laughs, at you, not with you. While they're laughing, his helpers walk you off the stage and round the back, where the ${j.ranks.grunt.name}s are waiting.`, foe('specialist', 'Sage Rood', 3, { chain: 2, win: [story({ op: 'foiled', opId: op.id })] }))),
      ]));
  }
  return [event, ...extras];
}

// Part D, ops 20 and 31: an Operation that happens lets a hostile Pokémon loose "later in the region".
function hunted(teamId: string, key: string, loose: string, species: string, name: string, intro: string): Json {
  const j = teamJson(teamId);
  return ev(`evil-${teamId}-${key}`, `A Hostile ${name}`, 'Evil Teams', { callback: true, requires: [flagIs(loose), flagIs(`${key}-done`, 0, 0)], tint: j.color, pokemon: species, effect: 'shake' }, intro, [
    ch('Stand and fight.', fight(`It doesn't wait for you to be ready.`, wild({ species: [species], lv: 4, win: [flag(`${key}-done`)] }))),
    ch('Get your team out of its way.', out(`You pull everyone back behind a wall and let it pass. It will find you again before long.`)),
  ]);
}

export const EVENTS: Json[] = [
  ...TEAMS.flatMap((t) => t.ops.flatMap((op, i) => operation(t, op, i))),
  hunted('plasma', 'genesect-hunt', 'genesect-loose', 'genesect', 'Genesect', `The road ahead is scorched in two straight lines. At the end of them a Genesect of purple metal stands perfectly still, its cannon tracking you. Somebody taught it that you were the enemy, and it believed them.`),
  hunted('aether', 'null-hunt', 'type-null-loose', 'type-null', 'Type: Null', `Something in an iron mask too big for its head comes out of the trees at a run. Faba's weapon has found its target, and the target is you. Under the mask, it is shaking.`),
];
export const REMOVE: string[] = [];
