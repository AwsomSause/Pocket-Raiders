// Greenneedle gn.48, The Pokémon Draft (doc GREENNEEDLE_REWORKED_PLACED_10.md lines 361–460).
// Your own team waits on the bench. Six rounds: five lent Pokémon on the table, each with its trainer's card (one true line that
// matters in battle); you pick one, the three other drafters take the rest, then an n-on-n battle. Then a bracket with only what
// you drafted. Drafted Pokémon start at Bond 0 and earn it; one may go with you, if its trainer agrees, and if it does.
// Pure rules: the table is dealt from the run's seed (no roll).
import type { Content, TypeName } from '../contentSchema';
import type { BattleState, PokemonInstance, RunState } from '../state';
import { getSpecies } from '../pokemon';
import { typeEffectiveness } from '../battle/damage';
import { fnv1a } from '../expansion/hash';
import { heldPick } from '../bossGear';
import { NATURE_IDS } from '../natures';

const f = (run: Pick<RunState, 'story'>, k: string): number => Number(run.story.flags[`ev:${k}`] ?? 0);
const set = (run: Pick<RunState, 'story'>, k: string, n: number): void => {
  run.story.flags[`ev:${k}`] = n;
};
type Make = (speciesId: string, level: number, uid: string) => PokemonInstance;

/** What the card's line says, and what it does in battle. */
export const TRAITS = ['shy', 'protect', 'first', 'leads', 'last', 'lazy'] as const;
export type Trait = (typeof TRAITS)[number];
const LINES: Record<Trait, [string, string]> = {
  shy: ['She\'s shy until she\'s hit. Then she isn\'t.', 'He hides behind his tail until something hits him. Then he doesn\'t.'],
  protect: ['Don\'t use Protect; he thinks it\'s cowardly, and sulks.', 'Never tell her to Protect. She takes it personally, and goes slow on you.'],
  first: ['First one I ever caught. Bring her back.', 'My first. Don\'t lose him. I mean it.'],
  leads: ['He likes to go first. Send him out first and he\'ll run through walls.', 'Send her out first. She hates waiting.'],
  last: ['She\'s best when she\'s the last one standing. Don\'t ask me why.', 'Last one left, he\'s a different Pokémon.'],
  lazy: ['He won\'t really try until his second turn out. Then he really tries.', 'Give her a turn to wake up. Then stand back.'],
};
/** The cards that made Wilf laugh. */
const FUNNY: Trait[] = ['protect', 'lazy'];
const LENDERS = ['Hesper Quill', 'Odo Marchetti', 'Rosalind Fenn', 'Tamsin Oyelaran', 'Bartholomew Pike', 'Yusuf Kettering', 'Anneliese Brandt', 'Corin Mbeki', 'Delphine Hartigan', 'Ivo Szabo',
  'Matilda Crowe', 'Rafferty Lund', 'Saoirse Ndiaye', 'Theodric Vane', 'Ulla Petrakis', 'Wendell Ashby', 'Zinnia Okoro', 'Florian Matsuda', 'Gwendolyn Hale', 'Jasper Ilunga',
  'Kestrel Moran', 'Lorcan Abiodun', 'Mirela Sato', 'Nils Gathii', 'Ottilie Brennan', 'Perpetua Lowe', 'Quentin Achterberg', 'Rhiannon Duda', 'Sebastian Orr', 'Thea Varga'];
const POOL = ['arcanine', 'gyarados', 'jolteon', 'vaporeon', 'flareon', 'machoke', 'graveler', 'haunter', 'kadabra', 'golbat', 'tauros', 'scyther', 'pinsir', 'electabuzz', 'magmar',
  'lapras', 'snorlax', 'dodrio', 'rapidash', 'slowbro', 'magneton', 'dewgong', 'cloyster', 'hypno', 'kingler', 'marowak', 'hitmonlee', 'hitmonchan', 'kangaskhan', 'starmie',
  'ampharos', 'azumarill', 'sudowoodo', 'heracross', 'skarmory', 'houndoom', 'donphan', 'miltank', 'breloom', 'manectric', 'absol', 'flygon', 'lucario', 'staraptor', 'roserade'];
/** A species that shrugs off each attacking type (the sixth pick's cover for the team's biggest weakness). */
export const COVER: Record<string, string> = {
  normal: 'skarmory', fire: 'lapras', water: 'roserade', electric: 'donphan', grass: 'arcanine', ice: 'magneton', fighting: 'haunter', poison: 'skarmory', ground: 'staraptor',
  flying: 'electabuzz', psychic: 'houndoom', bug: 'magmar', rock: 'breloom', ghost: 'absol', dragon: 'azumarill', dark: 'lucario', steel: 'arcanine', fairy: 'skarmory',
};

export interface Card { sp: string; lv: number; nature: string; by: string; trait: Trait; line: string }
interface Draft { round: number; level: number; cards: Card[]; picks: Card[]; cosima: Card[]; aldhelm: Card[]; wilf: Card[]; used: string[]; dealt: number }
const KEY = 'draft:state';
export const draftOf = (run: Pick<RunState, 'story'>): Draft | null => {
  const raw = run.story.flags[KEY];
  try {
    return typeof raw === 'string' ? (JSON.parse(raw) as Draft) : null;
  } catch {
    return null;
  }
};
const save = (run: Pick<RunState, 'story'>, d: Draft): void => {
  run.story.flags[KEY] = JSON.stringify(d);
  set(run, 'draft-round', d.round);
};
export const DRAFTED = 'drafted';
export const DRAFT_BENCH = 'draft-benched';

/** Deals five new cards (the sixth round's always includes a cover for the drafted team's biggest weakness). */
function deal(content: Content, run: RunState, d: Draft): void {
  const fresh = POOL.filter((s) => content.species.has(s) && !d.used.includes(s));
  const cards: Card[] = [];
  const pickCard = (sp: string, i: number): Card => {
    const h = fnv1a(`draft:${run.seed}:${run.regionIndex}:${d.dealt + i}:${sp}`);
    const trait = TRAITS[h % TRAITS.length]!;
    return { sp, lv: d.level, nature: NATURE_IDS[(h >>> 4) % NATURE_IDS.length]!, by: LENDERS[(d.dealt + i) % LENDERS.length]!, trait, line: LINES[trait][(h >>> 8) & 1]! };
  };
  if (d.round === 6) {
    const weak = weakness(content, d.picks.map((c) => c.sp));
    const cover = weak ? COVER[weak] : undefined;
    if (cover && content.species.has(cover) && !d.used.includes(cover)) cards.push(pickCard(cover, 0));
  }
  for (let i = 0; cards.length < 5 && fresh.length > 0; i++) {
    const at = fnv1a(`draft-deal:${run.seed}:${run.regionIndex}:${d.round}:${i}`) % fresh.length;
    const sp = fresh.splice(at, 1)[0]!;
    if (!cards.some((c) => c.sp === sp)) cards.push(pickCard(sp, cards.length));
  }
  d.cards = cards;
  d.dealt += cards.length;
  d.used.push(...cards.map((c) => c.sp));
}

/** The attacking type that hits the most of these super-effectively. */
export function weakness(content: Content, species: string[]): string | null {
  let best: string | null = null;
  let most = 0;
  for (const t of Object.keys(COVER)) {
    const n = species.filter((s) => content.species.has(s) && typeEffectiveness(content.typeChart, t as TypeName, getSpecies(content, s).types as TypeName[]) >= 2).length;
    if (n > most) {
      most = n;
      best = t;
    }
  }
  return best;
}

/** Sits down at the table: the first five are dealt. Your team goes to the bench with the first pick. */
export function draftStart(content: Content, run: RunState): string {
  const level = Math.max(1, Math.round(run.party.reduce((a, m) => a + m.level, 0) / Math.max(1, run.party.length)));
  const d: Draft = { round: 1, level, cards: [], picks: [], cosima: [], aldhelm: [], wilf: [], used: [], dealt: 0 };
  deal(content, run, d);
  save(run, d);
  set(run, 'draft-misused', 0);
  set(run, 'draft-result', 0);
  return '';
}

const bst = (content: Content, sp: string): number => Object.values(getSpecies(content, sp).baseStats).reduce((a, n) => a + n, 0);
/** The card the player picks (1-5): it joins the drafted team; Cosima, Wilf and Brother Aldhelm take the rest. */
export function draftPick(content: Content, run: RunState, n: number, make: Make): string {
  const d = draftOf(run);
  const card = d?.cards[n - 1];
  if (!d || !card) return '';
  if (d.round === 1) {
    // Your own stay on the bench.
    for (const m of run.party) m.gn = [...(m.gn ?? []), DRAFT_BENCH];
    run.box = [...run.box, ...run.party];
    run.party = [];
  }
  const mon = make(card.sp, card.lv, `p${run.nextUid}`);
  run.nextUid += 1;
  if (card.trait === 'protect' && !mon.moves.some((m) => m.id === 'protect') && content.moves.has('protect')) {
    if (mon.moves.length < 4) mon.moves.push({ id: 'protect', pp: content.moves.get('protect')!.pp });
    else mon.moves[3] = { id: 'protect', pp: content.moves.get('protect')!.pp };
  }
  mon.nature = card.nature as PokemonInstance['nature'];
  const warm = f(run, 'x-rival-swapped-teams') > 0 || f(run, 'rival-colours-kept') > 0;
  mon.friendship = warm ? content.balance.co.bondLevelStep : 0;
  mon.gn = [DRAFTED, `draft-trait:${card.trait}`, `draft-by:${card.by}`];
  run.party = [...run.party, mon];
  d.picks.push(card);
  const rest = d.cards.filter((c) => c !== card);
  const take = (list: Card[], pick: (c: Card[]) => Card | undefined): void => {
    const c = pick(rest);
    if (!c) return;
    list.push(c);
    rest.splice(rest.indexOf(c), 1);
  };
  take(d.cosima, (c) => [...c].sort((a, b) => bst(content, b.sp) - bst(content, a.sp))[0]);
  take(d.wilf, (c) => c.find((x) => FUNNY.includes(x.trait)) ?? c[c.length - 1]);
  take(d.aldhelm, (c) => c[0]);
  d.cards = [];
  save(run, d);
  return `${content.species.get(card.sp)?.name ?? card.sp}, lent by ${card.by}. Cosima takes the strongest left. Wilf takes the one that made him laugh. Brother Aldhelm takes what nobody looked at.`;
}

const traitOf = (mon: PokemonInstance): Trait | undefined => mon.gn?.find((t) => t.startsWith('draft-trait:'))?.slice('draft-trait:'.length) as Trait | undefined;
const byOf = (mon: PokemonInstance): string | undefined => mon.gn?.find((t) => t.startsWith('draft-by:'))?.slice('draft-by:'.length);

/** A draft battle starts: the n-on-n size; the bracket's drafter and their team; a lead who likes going first goes faster. */
export function draftBattleStart(content: Content, run: RunState, battle: BattleState, slot: number | undefined, make: Make): void {
  const d = draftOf(run);
  if (!d) return;
  if (slot) {
    const who = bracketOrder(content, d)[slot - 1];
    const cards = who ? d[who] : [];
    const level = battle.enemyTeam[0]?.level ?? d.level;
    battle.enemyTeam = cards.slice(0, 6).map((c, i) => {
      const m = make(c.sp, level, battle.enemyTeam[i]?.uid ?? `draft-${who}-${i}`);
      // Brother Aldhelm watched why everyone passed: each of his has the item that suits it.
      if (who === 'aldhelm') {
        const held = heldPick(content, { speciesId: m.speciesId, level: m.level, moves: m.moves.map((x) => x.id) }, i === 0, i === cards.length - 1);
        if (held) m.held = { [held]: 1 };
      }
      return m;
    });
    if (battle.trainer && who) battle.trainer = { ...battle.trainer, name: DRAFTER_NAME[who] };
  } else {
    battle.enemyTeam = battle.enemyTeam.slice(0, Math.max(1, Math.min(5, d.round)));
  }
  battle.enemyIndex = 0;
  const lead = run.party[battle.activeIndex];
  if (lead && traitOf(lead) === 'leads') {
    battle.playerStages.spe = Math.min(6, battle.playerStages.spe + 1);
    battle.storyEffects.push(`draft-right:${lead.uid}`);
  }
}

export const DRAFTER_NAME = { cosima: 'Cosima Achebe-Lund', wilf: 'Wilf', aldhelm: 'Brother Aldhelm' } as const;
type Drafter = keyof typeof DRAFTER_NAME;
/** The bracket: the other two by how well they've done (weaker first), then Brother Aldhelm's leftovers, the hardest. */
export function bracketOrder(content: Content, d: Draft): Drafter[] {
  const power = (who: Drafter) => d[who].reduce((a, c) => a + (content.species.has(c.sp) ? bst(content, c.sp) : 0), 0);
  return [...(['cosima', 'wilf'] as Drafter[]).sort((a, b) => power(a) - power(b)), 'aldhelm'];
}

type Ev = { type: string; side?: string; moveId?: string | null };
/** End of each draft turn: the cards come true. */
export function draftTurn(battle: BattleState, party: PokemonInstance[], events: Ev[], push: (text: string) => void): void {
  const mine = party[battle.activeIndex];
  if (!mine) return;
  const trait = traitOf(mine);
  const has = (s: string) => battle.storyEffects.includes(s);
  const name = mine.care?.nickname || 'It';
  if (trait === 'shy' && !has(`draft-right:${mine.uid}`) && mine.hp > 0 && events.some((e) => e.type === 'damage' && e.side === 'player')) {
    battle.storyEffects.push(`draft-right:${mine.uid}`);
    battle.playerStages.atk = Math.min(6, battle.playerStages.atk + 1);
    battle.playerStages.spa = Math.min(6, battle.playerStages.spa + 1);
    push(`${name === 'It' ? 'Your drafted Pokémon' : name} was hit, and it isn't shy any more. Its Attack and Sp. Atk rose!`);
  }
  if (trait === 'protect' && events.some((e) => e.type === 'move' && e.side === 'player' && (e.moveId === 'protect' || e.moveId === 'detect'))) {
    battle.storyEffects.push(`draft-misused:${mine.uid}`);
    battle.playerStages.spe = Math.max(-6, battle.playerStages.spe - 1);
    push('It thinks that was cowardly. It sulks. Its Speed fell.');
  }
  if (trait === 'last' && !has(`draft-right:${mine.uid}`) && mine.hp > 0 && party.every((m) => m === mine || m.hp <= 0) && party.length > 1) {
    battle.storyEffects.push(`draft-right:${mine.uid}`);
    battle.playerStages.atk = Math.min(6, battle.playerStages.atk + 1);
    battle.playerStages.spa = Math.min(6, battle.playerStages.spa + 1);
    push('The last one standing. It\'s a different Pokémon now. Its Attack and Sp. Atk rose!');
  }
  if (trait === 'lazy' && !has(`draft-right:${mine.uid}`) && mine.hp > 0 && battle.playerVolatile.turnsOut >= 1) {
    battle.storyEffects.push(`draft-right:${mine.uid}`);
    battle.playerStages.atk = Math.min(6, battle.playerStages.atk + 1);
    push('Its second turn out. Now it\'s really trying. Its Attack rose!');
  }
}

/** A draft battle is won (finishBattle): each drafted Pokémon that fought keeps what it did, for draftWon. */
export function draftRecord(run: RunState): void {
  const b = run.battle;
  if (!b || b.eventRule?.gn !== 'draft' || b.outcome !== 'win') return;
  for (const m of run.party) {
    if (!m.gn?.includes(DRAFTED) || !b.participants.includes(m.uid)) continue;
    const trait = traitOf(m);
    const misused = b.storyEffects.includes(`draft-misused:${m.uid}`);
    const right = trait === 'protect' ? !misused : trait === 'first' ? m.hp > 0 : b.storyEffects.includes(`draft-right:${m.uid}`);
    m.gn = [...m.gn.filter((t) => !t.startsWith('draft-did:')), `draft-did:${right ? 'right' : misused ? 'misused' : 'fought'}`];
  }
}

/** A draft battle won: Bond +1 for each drafted Pokémon that fought, and +1 more for each used the way its card says. The next round is dealt. */
export function draftWon(content: Content, run: RunState): string {
  const d = draftOf(run);
  if (!d) return '';
  const step = content.balance.co.bondLevelStep;
  const max = content.balance.friendship.max;
  for (const m of run.party) {
    const did = m.gn?.find((t) => t.startsWith('draft-did:'))?.slice('draft-did:'.length);
    if (!did) continue;
    m.gn = m.gn!.filter((t) => !t.startsWith('draft-did:'));
    if (did === 'misused') set(run, 'draft-misused', f(run, 'draft-misused') + 1);
    m.friendship = Math.min(max, m.friendship + step * (did === 'right' ? 2 : 1));
  }
  d.round += 1;
  if (d.round <= 6) deal(content, run, d);
  save(run, d);
  return '';
}

/** The answer: its trainer (the "first one I ever caught" card says no, kindly, and offers its egg), and it (Bond 3 or more). */
export function draftRecruit(content: Content, run: RunState, uid: string | undefined, host: { apply: (e: unknown) => string }): string {
  const mon = run.party.find((m) => m.uid === uid && m.gn?.includes(DRAFTED));
  const by = mon ? byOf(mon) : undefined;
  let said = '';
  if (mon && by) {
    const name = content.species.get(mon.speciesId)?.name ?? mon.speciesId;
    set(run, 'draft-asked', 1);
    if (traitOf(mon) === 'first') {
      set(run, 'draft-result', 2);
      const egg = host.apply({ kind: 'egg', species: [mon.speciesId], types: [], levelBonus: 0, shinyMultiplier: 1, left: 3, unit: 'battle' });
      said = `${by}: "No. I'm sorry. She's my first. But she had an egg, last spring." ${egg}`;
    } else if (Math.floor(mon.friendship / content.balance.co.bondLevelStep) >= 3) {
      set(run, 'draft-result', 1);
      mon.gn = (mon.gn ?? []).filter((t) => t !== DRAFTED);
      mon.gn.push(`draft-from:${by}`);
      mon.marks = [...(mon.marks ?? []), `lent by ${by} at the Pokémon Draft, and stayed`].slice(-8);
      said = `${by}: "${LINES[traitOf(mon) ?? 'shy'][0]} You'll remember that? ...You already knew. You read the card. All right. Go on, then." ${name} comes with you.`;
    } else {
      set(run, 'draft-result', 3);
      said = `${by} says yes. ${name} doesn't. It goes back to ${by}, and looks over its shoulder once.`;
    }
  }
  draftEnd(run);
  return said;
}

/** It's over: the drafted Pokémon go home (except one that chose to stay), and your own come off the bench. */
export function draftEnd(run: RunState): string {
  run.party = run.party.filter((m) => !m.gn?.includes(DRAFTED));
  const back = run.box.filter((m) => m.gn?.includes(DRAFT_BENCH));
  for (const m of back) m.gn = (m.gn ?? []).filter((t) => t !== DRAFT_BENCH);
  const all = [...back, ...run.party];
  run.box = [...run.box.filter((m) => !back.includes(m)), ...all.slice(6)];
  run.party = all.slice(0, 6);
  return '';
}

/** Read every card, and never once went against one: Brother Aldhelm hands over his own first pick. */
export function draftAldhelm(content: Content, run: RunState, host: { apply: (e: unknown) => string }): string {
  const sp = draftOf(run)?.aldhelm[0]?.sp;
  if (!sp || !content.species.has(sp)) return '';
  return host.apply({ kind: 'join', recall: false, species: [sp], types: [], levelBonus: 0, shinyMultiplier: 1, shadow: false, blissful: false, hiddenAbility: false, moves: [], direct: false, alpha: false, starterType: false, marks: ['Brother Aldhelm\'s own first pick at the Pokémon Draft'] });
}

/** A letter, once a region, from the trainer of a drafted Pokémon that stayed. */
export const draftFriend = (run: Pick<RunState, 'party' | 'box'>): PokemonInstance | undefined => [...run.party, ...run.box].find((m) => m.gn?.some((t) => t.startsWith('draft-from:')));
export function draftLetter(content: Content, run: RunState): string {
  const mon = draftFriend(run);
  if (!mon) return '';
  mon.friendship = Math.min(content.balance.friendship.max, mon.friendship + 5);
  return `You write back. Somehow, ${content.species.get(mon.speciesId)?.name ?? 'it'} knows. Bond +1.`;
}

/** Tokens: {draft:round}, {draft:card:<n>} (in full), {draft:label:<n>}, {draft:vs:<slot>}, {draft:friend}, {draft:from}. */
export function draftTokens(content: Content, run: RunState, text: string): string {
  const d = draftOf(run);
  const sp = (s: string) => content.species.get(s)?.name ?? s;
  const card = (c: Card | undefined): string => {
    if (!c) return '';
    const moves = content.species.has(c.sp) ? getSpecies(content, c.sp).learnset.filter((e) => e.level <= c.lv).slice(-4).map((e) => content.moves.get(e.move)?.name ?? e.move) : [];
    const word = c.nature.charAt(0).toUpperCase() + c.nature.slice(1);
    return `**${sp(c.sp)}**, Lv. ${c.lv}, ${word}. ${moves.join(', ')}${c.trait === 'protect' ? ', Protect' : ''}. *${c.by}:* "${c.line}"`;
  };
  const friend = draftFriend(run);
  return text
    .replaceAll('{draft:round}', String(d?.round ?? 1))
    .replace(/\{draft:card:([1-5])\}/g, (_, n: string) => card(d?.cards[Number(n) - 1]))
    .replace(/\{draft:label:([1-5])\}/g, (_, n: string) => {
      const c = d?.cards[Number(n) - 1];
      return c ? `${sp(c.sp)}, from ${c.by}.` : '—';
    })
    .replace(/\{draft:vs:([1-3])\}/g, (_, n: string) => (d ? DRAFTER_NAME[bracketOrder(content, d)[Number(n) - 1]!] : 'a drafter'))
    .replaceAll('{draft:friend}', friend ? sp(friend.speciesId) : 'it')
    .replaceAll('{draft:from}', (friend && byOf(friend)) ?? 'its first trainer');
}
