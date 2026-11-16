// Greenneedle gn.61, The Final Reunion (doc GREENNEEDLE_REWORKED_PLACED_13.md lines 196–289).
// The game walks the run's flags and calls each one that ended well enough to come; the player walks among them; up to three
// (by history) may stand with the player in the final battle, one turn each, called once with a button ("[Name]!").
import type { Content, Terrain, Weather } from '../contentSchema';
import type { BattleState, RunState } from '../state';
import { overhaulOf } from '../rivals/overhaul';

const f = (run: Pick<RunState, 'story'>, k: string): number => Number(run.story.flags[`ev:${k}`] ?? 0);
const put = (run: RunState, k: string, n: number): void => {
  run.story.flags[`ev:${k}`] = n;
};
const any = (run: Pick<RunState, 'story'>, keys: readonly string[]): number => keys.filter((k) => f(run, k) > 0).length;

export type Group = 'rival' | 'leader' | 'released' | 'rescued' | 'friend' | 'trainer' | 'after' | 'community' | 'agency' | 'thing';
/** What a helper's one turn is (doc "Who helps"). */
export type Kind = 'ace' | 'field' | 'guard' | 'food' | 'agency';

interface Person {
  id: string;
  name: string;
  group: Group;
  kind: Kind;
  /** They come when any of these run flags is set. */
  flags: string[];
  /** It went well when any of these is set. */
  good?: string[];
  /** They are at the far edge when any of these is set (and not coming closer). */
  far?: string[];
  /** The one line, [went well, went otherwise]. */
  line: [string, string];
}

const T = (s: string): string => s;
/** The people the run's flags can call. Flags marked "external" in flags/greenneedle.json are set by events another row builds. */
export const PEOPLE: Person[] = [
  { id: 'damian', name: 'Damian', group: 'after', kind: 'ace', flags: ['damian-meetings'], good: ['damian-meetings-2'], line: [T('**Damian**, in a staff shirt: "I\'ve got a Gym. With *pillars.* You did that. No, I did that. You helped."'), T('*A note pinned to a post, in Damian\'s handwriting: "Still thinking. — D."*')] },
  { id: 'staff', name: 'Tully and Bex', group: 'after', kind: 'ace', flags: ['damian-meetings'], good: ['damian-meetings-2'], line: [T('**Tully and Bex**, in staff shirts, hand out cups of something hot and tell nobody which is which.'), T('**Tully and Bex** stand a little behind the post with the note. Bex waves. Tully is pretending not to.')] },
  { id: 'pond', name: 'The Poliwag\'s pond', group: 'community', kind: 'food', flags: ['poli-ending-release', 'poli-ending-reconcile'], good: ['poli-ending-reconcile'], line: [T('*Five Poliwhirl and a Poliwrath, in a line, saluting. One of them is late with the salute.*'), T('*Four Poliwhirl, in a line, saluting. Nobody mentions the gap.*')] },
  { id: 'rainfire', name: 'The Fire-type from the rain', group: 'released', kind: 'guard', flags: ['kanto-rain-fire', 'rain-nurse-seen'], good: ['kanto-rain-fire'], line: [T('*The Fire-type from the rain runs the length of the field, and does not stop until it reaches you.*'), T('*The Fire-type from the rain is with the nurse. It looks at you. It lifts a paw.*')] },
  { id: 'nurse', name: 'The nurse of the closed Center', group: 'friend', kind: 'food', flags: ['rain-nurse-seen'], good: ['kanto-rain-fire'], line: [T('**The nurse** has brought a basket and her good coat. "The Center\'s shut. I thought, why not shut it for this."'), T('**The nurse** keeps one hand on the Fire-type\'s shoulder. "It\'ll come round. Give it the evening."')] },
  { id: 'ffion', name: 'Captain Ffion', group: 'friend', kind: 'food', flags: ['ffion-pier'], good: ['ffion-pier-gap'], line: [T('**Captain Ffion:** "There\'s a gap in the pier. Something swims through it every dawn. The children wave."'), T('**Captain Ffion:** "We rebuilt. It took a year."')] },
  { id: 'mankey', name: 'The Mankey troop', group: 'community', kind: 'food', flags: ['kanto-mankey'], good: ['mankey-food-returned'], line: [T('*The Mankey troop, on each other\'s shoulders, in a tower, to see over the crowd.*'), T('*Four Mankey sit apart, watching the fifth. The fifth is trying not to look back.*')] },
  { id: 'mimikyu', name: 'The Mimikyu', group: 'released', kind: 'guard', flags: ['mansion-mimikyu', 'mansion-coat'], good: ['mansion-coat'], line: [T('*The Mimikyu\'s coat is folded, on a chair, with a cup of tea beside it.*'), T('*The Mimikyu is wearing the coat. It has set a place for someone, and is keeping the chair warm.*')] },
  { id: 'cubone', name: 'The Cubone', group: 'released', kind: 'guard', flags: ['cubone-trusted'], good: ['cubone-trusted-stayed'], line: [T('*The Cubone has come out from the trees. It sits at the edge of the crowd, close enough to be counted.*'), T('*The Cubone watches from the trees at the far side of the field. It came. That is all it can do.*')] },
  { id: 'ferris', name: 'Ferris', group: 'after', kind: 'ace', flags: ['ferris-belt'], good: ['ferris-six'], line: [T('**Ferris** has six on the belt, asleep in a folding chair. The new one is in their lap.'), T('**Ferris** has five on the belt, and counts them twice.')] },
  { id: 'samurai', name: 'The Samurai', group: 'after', kind: 'ace', flags: ['kanto-forest-samurai-won'], good: ['kanto-forest-samurai-won'], line: [T('**The Samurai** stands very straight at the edge of the lantern light, and bows when you look.'), T('**The Samurai** stands very straight at the edge of the lantern light, and bows when you look.')] },
  { id: 'duelist', name: 'The Duelist', group: 'trainer', kind: 'ace', flags: ['allstar-samurai', 'allstar-damian'], good: ['allstar-respect'], line: [T('**The Duelist** has found someone to practise against, and is losing, cheerfully.'), T('**The Duelist** has found someone to practise against, and is losing, cheerfully.')] },
  { id: 'linus', name: 'Linus and the stone', group: 'after', kind: 'guard', flags: ['wontevolve-linus-gone'], good: ['wontevolve-linus-gone'], line: [T('**Linus** has the stone in his pocket, and a Pokémon beside him who has decided, again, not to.'), T('**Linus** has the stone in his pocket, and a Pokémon beside him who has decided, again, not to.')] },
  { id: 'idris', name: 'Idris and a pair of boots', group: 'after', kind: 'guard', flags: ['desert-saw-idris'], good: ['desert-saw-idris'], line: [T('**Idris** has brought the boots. Both of them. He holds one up so you can see it is the right one.'), T('**Idris** has brought the boots. Both of them. He holds one up so you can see it is the right one.')] },
  { id: 'tamsel', name: 'Granny Tamsel', group: 'friend', kind: 'food', flags: ['tamsel-out'], good: ['tamsel-out'], line: [T('**Granny Tamsel**, who shouldn\'t be out of the gorge, and is: "Don\'t look at me like that. I walked."'), T('**Granny Tamsel**, who shouldn\'t be out of the gorge, and is: "Don\'t look at me like that. I walked."')] },
  { id: 'holloways', name: 'The Holloways', group: 'friend', kind: 'food', flags: ['holloways-ok'], good: ['holloways-ok'], line: [T('**The Holloways** have brought the whole kitchen. There is a pie for you, and a second pie in case you forget the first.'), T('**The Holloways** have brought the whole kitchen. There is a pie for you, and a second pie in case you forget the first.')] },
  { id: 'wicker', name: 'Old Wicker', group: 'friend', kind: 'food', flags: ['wicker-ok'], good: ['wicker-ok'], line: [T('**Old Wicker** has the best chair in the field, and says it\'s because he is old and not because he is important.'), T('**Old Wicker** has the best chair in the field, and says it\'s because he is old and not because he is important.')] },
  { id: 'oldfriend', name: 'Your Old Friend', group: 'released', kind: 'guard', flags: ['oldfriend-parted'], good: ['oldfriend-parted'], line: [T('*The Old Friend you let go of is here. It does not make a fuss. It walks to your side and stays.*'), T('*The Old Friend you let go of is here. It does not make a fuss. It walks to your side and stays.*')] },
  { id: 'freed-kaiju', name: 'The Kaiju from the Factory', group: 'rescued', kind: 'guard', flags: ['kaiju-freed'], good: ['kaiju-freed'], line: [T('*The Kaiju stands in the back, taller than anything else in the field, with a daisy tucked behind one ear. Somebody has been generous.*'), T('*The Kaiju stands in the back, taller than anything else in the field, with a daisy tucked behind one ear. Somebody has been generous.*')] },
  { id: 'freed-pits', name: 'The Factory\'s pit Pokémon', group: 'rescued', kind: 'guard', flags: ['factory-freed'], good: ['factory-freed'], line: [T('*Six Pokémon from the Factory\'s pits, clean, and sticking close together. One of them keeps checking you are still there.*'), T('*Six Pokémon from the Factory\'s pits, clean, and sticking close together. One of them keeps checking you are still there.*')] },
  { id: 'freed-ring', name: 'The Pokémon from the Smuggling Ring', group: 'rescued', kind: 'guard', flags: ['smuggle-rehab', 'ring-finished'], good: ['smuggle-rehab'], line: [T('*The Pokémon from the Smuggling Ring have come by the road. They\'ve been taught to look up when someone comes near. They do.*'), T('*The Pokémon from the Smuggling Ring have come by the road. They\'ve been taught to look up when someone comes near. They do.*')] },
  { id: 'agency', name: 'The Slowpoke Detective Agency', group: 'agency', kind: 'agency', flags: ['slowpoke-agency-solved'], good: ['slowpoke-agency-solved'], line: [T('*Not here yet. A hand-lettered sign on a post says: "Gone to the Reunion. Back in a week. — S.D.A." It is dated a week ago.*'), T('*Not here yet. A hand-lettered sign on a post says: "Gone to the Reunion. Back in a week. — S.D.A." It is dated a week ago.*')] },
  { id: 'mural', name: 'The Mural', group: 'thing', kind: 'food', flags: ['mural-walls'], good: ['mural-walls'], line: [T('*The Mural: {walls}, set up in the grass and lit from behind by someone with a lamp. Every wall is a place you were. Somewhere on each one, in the corner, a small signature.*'), T('*The Mural.*')] },
  { id: 'impersonator', name: 'The Impersonator', group: 'after', kind: 'guard', flags: ['impersonator-joined'], good: ['impersonator-joined'], line: [T('*Two of somebody. They stand side by side, each quite sure the other is the copy, and both of them keep looking at you to settle it.*'), T('*Two of somebody.*')] },
  { id: 'cheers', name: 'Plusle and Minun', group: 'after', kind: 'food', flags: ['cheer-split', 'cheer-both', 'cheer-truth'], good: ['cheer-both', 'cheer-truth'], line: [T('*Plusle and Minun, front row, pom-poms up. They are arguing about who cheered loudest. For the first time, they are cheering in time.*'), T('*The one you left on the road is in the front row, alone, with its pom-poms. It is cheering for you, and for your rival, at the same volume. Nobody told it to stop.*')] },
  { id: 'well', name: 'The well', group: 'thing', kind: 'food', flags: ['well-pebble'], good: ['well-pebble'], line: [T('*The well, from somewhere, with a pebble on the rim.*'), T('*The well, from somewhere, with a pebble on the rim.*')] },
  { id: 'coat', name: 'The Storm-Grey Coat', group: 'thing', kind: 'food', flags: ['storm-grey-coat'], good: ['storm-grey-coat'], line: [T('*The Storm-Grey Coat, on a chair, with its sleeves arranged as if someone had only just stood up.*'), T('*The Storm-Grey Coat, on a chair, with its sleeves arranged as if someone had only just stood up.*')] },
  // gn.39 and gn.42 afterstories: the market's wagons come as guests; the Frontier Brains have a table.
  { id: 'market', name: 'The market\'s wagons', group: 'community', kind: 'food', flags: ['market-visits'], good: ['market-visits'], line: [T('*The market\'s wagons are in the field, in a ring, awnings down. Nothing\'s for sale. They\'ve come as guests.*'), T('*The market\'s wagons are in the field, in a ring, awnings down. Nothing\'s for sale. They\'ve come as guests.*')] },
  { id: 'brains', name: 'The Frontier Brains', group: 'trainer', kind: 'ace', flags: ['frontier-symbols'], good: ['frontier-symbols'], line: [T('**The Frontier Brains** have a table. They\'re arguing about whose building is hardest. Lady Imara is counting the arguments aloud.'), T('**The Frontier Brains** have a table. They\'re arguing about whose building is hardest.')] },
  // The far edge: they came, and they aren't coming closer. They can be walked up to.
  { id: 'robbed', name: 'The Trainer You Robbed', group: 'friend', kind: 'ace', flags: ['robbed-trainer', 'auction-bought-stolen'], far: ['robbed-trainer', 'auction-bought-stolen'], line: [T('**"I came to see what you turned into."**'), T('**"I came to see what you turned into."**')] },
  { id: 'abandoned', name: 'The one you left behind', group: 'released', kind: 'guard', flags: ['abandoned-mon', 'lost-mon'], far: ['abandoned-mon', 'lost-mon'], line: [T('*A Pokémon at the far edge, who used to answer to a name you gave it. It keeps its eyes on the grass.*'), T('*A Pokémon at the far edge, who used to answer to a name you gave it. It keeps its eyes on the grass.*')] },
];

/** Pairs the player can introduce: [id a, id b]. Each has a short exchange (gn-61-intro rooms). */
export const PAIRS: [string, string][] = [['idris', 'ferris'], ['samurai', 'duelist'], ['cubone', 'mimikyu']];

interface Attendee { id: string; name: string; group: Group; kind: Kind; score: number; good: boolean; far: boolean; line: string; /** a Gym Leader's boss id */ boss?: string }
interface Gathering { att: Attendee[]; seen: number }

const GROUP_BASE: Record<Group, number> = { rival: 3, leader: 1, released: 2, rescued: 2, friend: 1, trainer: 1, after: 2, community: 1, agency: 3, thing: 0 };
const LIST = 'reunion:list';

export function gathering(run: Pick<RunState, 'story'>): Gathering | null {
  const raw = run.story.flags[LIST];
  return typeof raw === 'string' ? (JSON.parse(raw) as Gathering) : null;
}

/** "Damian" met twice or more (a flag that isn't there: counted as met once, so the plain good flag also holds). */
const wentWell = (run: RunState, p: Person): boolean => (p.good ?? []).some((k) => (k.endsWith('-2') ? f(run, k.slice(0, -2)) >= 2 : f(run, k) > 0));

/** Walks the run's flags and calls each one that ended well enough to come. Stores who, how well it went, and the three best friends. */
export function reunionArrive(content: Content, run: RunState): string {
  if (gathering(run)) return '';
  const att: Attendee[] = [];
  // Rivals: the player's rival and the second one, when Rival Trust is 1 or more.
  for (const r of run.story.rivals.filter((x) => x.state !== 'retired').slice(0, 2)) {
    const trust = overhaulOf(run, r.id)?.feelings.trust ?? 0;
    if (trust < 1) continue;
    att.push({ id: `rival-${r.id}`, name: r.name, group: 'rival', kind: 'ace', score: GROUP_BASE.rival + trust + (r.state === 'ally' ? 2 : 0), good: r.state === 'ally', far: false, line: `**${r.name}**, with their arms folded, pretending they only happened to be passing: "Well. You did it. Don't make it weird."` });
  }
  // Gym Leaders: every one the player beat this run.
  for (const [i, id] of run.badges.entries()) {
    const name = content.bosses.get(id)?.name ?? id;
    att.push({ id: `leader-${id}`, name, group: 'leader', kind: 'field', score: GROUP_BASE.leader + (i + 1) / 100, good: true, far: false, line: `**${name}** is here, off duty, and not wearing the badge. They keep looking at yours.`, boss: id });
  }
  // Everyone else the flags call.
  for (const p of PEOPLE) {
    const came = any(run, p.flags);
    if (!came) continue;
    const good = wentWell(run, p);
    const far = !!p.far && any(run, p.far) > 0;
    const walls = f(run, 'mural-walls');
    const line = (good ? p.line[0] : p.line[1]).replace('{walls}', walls === 1 ? 'one wall' : `${walls} walls`);
    att.push({ id: p.id, name: p.name, group: p.group, kind: p.kind, score: GROUP_BASE[p.group] + came + (good ? 2 : 0), good, far, line });
  }
  // Road Roster trainers with Trust 2 or more: met twice (`roster-<key>-m2`), and more when their arc ended (`roster-<key>-done`).
  const roster = Object.keys(run.story.flags).map((k) => /^ev:roster-([a-z0-9-]+)-m2$/.exec(k)?.[1]).filter((k): k is string => !!k && f(run, `roster-${k}-m2`) > 0);
  for (const key of roster.slice(0, 6)) {
    const done = f(run, `roster-${key}-done`) > 0;
    const name = key.split('-').map((w) => w[0]!.toUpperCase() + w.slice(1)).join(' ');
    att.push({ id: `road-${key}`, name, group: 'trainer', kind: 'ace', score: GROUP_BASE.trainer + 2 + (done ? 2 : 0), good: done, far: false, line: done ? `**${name}**, off the road for one night: "Told you we'd see each other again. I never said where."` : `**${name}** raises a hand from the back of the crowd. You have only met twice. It was enough to be asked.` });
  }
  // The three with the longest history are offered; the Slowpoke Agency always arrives by itself on turn six if it is among them.
  const near = att.filter((a) => !a.far && a.group !== 'thing');
  const top = [...near].sort((a, b) => b.score - a.score || att.indexOf(a) - att.indexOf(b)).slice(0, 3);
  top.forEach((a, i) => put(run, `reunion-offer-${i + 1}`, att.indexOf(a) + 1));
  put(run, 'reunion-offers', top.length);
  put(run, 'reunion-count', att.length);
  put(run, 'reunion-fartotal', att.filter((a) => a.far).length);
  put(run, 'reunion-farleft', att.filter((a) => a.far).length);
  for (const a of att) put(run, `reunion-att-${a.id}`, a.good ? 2 : 1);
  PAIRS.forEach(([a, b], i) => put(run, `reunion-pair-${i + 1}`, att.some((x) => x.id === a && !x.far) && att.some((x) => x.id === b && !x.far) ? 1 : 0));
  run.story.flags[LIST] = JSON.stringify({ att, seen: 0 } satisfies Gathering);
  return '';
}

const nearOf = (g: Gathering): Attendee[] => g.att.filter((a) => !a.far);

/** Text tokens: `{reunion:crowd}`, `{reunion:lines}`, `{reunion:far}`, `{reunion:offer:<n>}`. */
export function reunionTokens(run: RunState, text: string): string {
  const g = gathering(run);
  const near = g ? nearOf(g) : [];
  return text
    .replace(/\{reunion:crowd\}/g, () => {
      if (!g) return 'There are a lot of people in the field.';
      const leaders = g.att.filter((a) => a.group === 'leader').length;
      return `*${g.att.length} ${g.att.length === 1 ? 'has' : 'have'} come${leaders ? `, ${leaders} of them Gym ${leaders === 1 ? 'Leader' : 'Leaders'}` : ''}. Count them if you like. Everyone else already has.*`;
    })
    .replace(/\{reunion:lines\}/g, () => {
      const lines = near.filter((a) => a.group !== 'leader').map((a) => a.line);
      const leaders = near.filter((a) => a.group === 'leader');
      if (leaders.length) lines.unshift(`*${leaders.map((a) => a.name).join(', ')}: every Gym Leader you beat is here, in their own coats, and not one of them is on duty.*`);
      return lines.length ? lines.join('\n\n') : '*It is quiet. Nobody speaks. The wind moves the grass.*';
    })
    .replace(/\{reunion:far\}/g, () => {
      const next = g?.att.find((a) => a.far && f(run, `reunion-far-${a.id}`) === 0);
      return next ? `${next.line}` : '*There is nobody left to stand beside. The wind moves the grass. You are still here.*';
    })
    .replace(/\{reunion:ask:([1-3])\}/g, (_, n: string) => {
      const a = g?.att[f(run, `reunion-offer-${n}`) - 1];
      if (!a) return '';
      if (a.group === 'rival') return '**' + a.name + ':** "One turn. Then it\'s yours. Don\'t waste my one turn."';
      return ({ ace: 'Their ace will use its best move, once.', field: 'They will set their Gym\'s field for three turns.', guard: 'They will take one hit meant for your Pokémon.', food: 'They will bring food: a fifth of every Pokémon\'s health.', agency: 'They arrive on turn six, whatever turn it is. Nobody has to call.' } as const)[a.kind];
    })
    .replace(/\{reunion:offer:([1-3])\}/g, (_, n: string) => g?.att[f(run, `reunion-offer-${n}`) - 1]?.name ?? 'Someone');
}

/** gn op `reunionFar`: the player's answer (`n` 1 "I'm sorry.", 2 "I'd do it again.", 3 say nothing and stay) to the next one standing at the far edge. */
export function reunionFar(run: RunState, n: number): string {
  const g = gathering(run);
  const next = g?.att.find((a) => a.far && f(run, `reunion-far-${a.id}`) === 0);
  if (!g || !next) return '';
  put(run, `reunion-far-${next.id}`, n);
  put(run, 'reunion-farleft', Math.max(0, f(run, 'reunion-farleft') - 1));
  put(run, 'reunion-farvisit', 1);
  if (n === 1) return `${next.name} hears it. They do not answer, and they do not look away. It was heard.`;
  if (n === 2) return `${next.name} nods slowly. "That's honest, at least." It is the last thing they say.`;
  return `You stand beside ${next.name}, and say nothing, and stay. Nobody speaks for a long time. Neither of you leaves.`;
}

// ---------- the final battle ----------
export const HELP = 'helper:';
export const HELP_USED = 'helper-used:';
const FIELD: Record<string, { weather?: Weather; terrain?: Terrain }> = {
  fire: { weather: 'sun' }, water: { weather: 'rain' }, ice: { weather: 'snow' }, rock: { weather: 'sand' }, ground: { weather: 'sand' },
  electric: { terrain: 'electric' }, grass: { terrain: 'grassy' }, bug: { terrain: 'grassy' }, fairy: { terrain: 'misty' }, psychic: { terrain: 'psychic' },
};

/** The player's accepted helpers become buttons for the final battle: `helper:<slot>:<kind>:<name>[:<boss>]`. Only the region's Champion fight of the last region. */
export function reunionBattleStart(run: RunState): void {
  const b = run.battle;
  const g = gathering(run);
  if (!b || !g || b.kind === 'wild' || !b.spectacle?.final || b.storyEffects.some((t) => t.startsWith(HELP))) return;
  for (let slot = 1; slot <= 3; slot++) {
    if (f(run, `reunion-help-${slot}`) !== 1) continue;
    const a = g.att[f(run, `reunion-offer-${slot}`) - 1];
    if (a) b.storyEffects.push(`${HELP}${slot}:${a.kind}:${a.name}${a.boss ? `:${a.boss}` : ''}`);
  }
}

export interface Helper { slot: number; kind: Kind; name: string; boss?: string; used: boolean }
export const helpersOf = (battle: Pick<BattleState, 'storyEffects'>): Helper[] =>
  battle.storyEffects.filter((t) => t.startsWith(HELP)).map((t) => {
    const [slot, kind, name, boss] = t.slice(HELP.length).split(':');
    return { slot: Number(slot), kind: kind as Kind, name: name ?? 'Someone', ...(boss ? { boss } : {}), used: battle.storyEffects.includes(`${HELP_USED}${slot}`) };
  });

/** The buttons the battle shows: every helper you can call, once (the Slowpoke Agency calls itself on turn six). */
export const helperButtons = (battle: Pick<BattleState, 'storyEffects'>): Helper[] => helpersOf(battle).filter((h) => !h.used && h.kind !== 'agency');

export const helperProblem = (battle: Pick<BattleState, 'storyEffects'>, slot: number): string | null => {
  const h = helperButtons(battle).find((x) => x.slot === slot);
  return h ? null : 'They have already had their turn.';
};

export const fieldOf = (content: Content, boss: string | undefined): { weather?: Weather; terrain?: Terrain } => {
  const types = boss ? content.bosses.get(boss)?.types ?? [] : [];
  return types.map((t) => FIELD[t]).find(Boolean) ?? { terrain: 'misty' };
};

/** The called helper acts: the engine applies what this says. */
export function callHelper(battle: Pick<BattleState, 'storyEffects'>, slot: number): Helper | null {
  const h = helperButtons(battle).find((x) => x.slot === slot);
  if (!h) return null;
  battle.storyEffects.push(`${HELP_USED}${slot}`);
  return h;
}

/** A released or rescued Pokémon takes one hit meant for the player's Pokémon. Returns its name once, then ''. */
export function reunionTakeHit(battle: Pick<BattleState, 'storyEffects'>): string {
  const i = battle.storyEffects.findIndex((t) => t.startsWith('helper-guard:'));
  if (i < 0) return '';
  const name = battle.storyEffects[i]!.slice('helper-guard:'.length);
  battle.storyEffects.splice(i, 1);
  return name;
}

/** The Slowpoke Detective Agency arrive on turn six, whatever turn it is, and the opponent flinches from sheer confusion. */
export function agencyArrives(battle: Pick<BattleState, 'storyEffects' | 'turn'>): string {
  const h = helpersOf(battle).find((x) => x.kind === 'agency' && !x.used);
  if (!h || battle.turn < 6) return '';
  battle.storyEffects.push(`${HELP_USED}${h.slot}`);
  return h.name;
}
