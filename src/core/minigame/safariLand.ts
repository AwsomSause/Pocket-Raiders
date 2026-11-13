// Beta 0.6 canon space: Fuchsia's Safari Land (CANON_SPACES_KANTO.md section 8.3). Normal Safari Zone rules with a huge population:
// 30 Safari Balls, 500 steps, no battles. In an encounter you throw a ball, throw bait, throw a rock or walk on.
// Bait makes the Pokémon easier to catch but likelier to flee; a rock makes it harder to catch but less likely to flee.
// Four areas (Center, Area 1, 2, 3) draw from the whole Kanto pool plus a rotating 40% of other regions' Pokémon, weighted by
// catch rate. 8% of encounters are a rare "star", 2% a Delta or Hisuian form. Pure state machine on its own RNG state.

import { Rng, hashSeed } from '../rng';
import type { Content, Species } from '../contentSchema';
import type { BaseState, MinigameModule } from './games';

export const SAFARI_STARS = ['chansey', 'kangaskhan', 'tauros', 'scyther', 'pinsir', 'dratini', 'dragonair', 'heracross'] as const;
export const SAFARI_AREAS = ['Center', 'Area 1', 'Area 2', 'Area 3'] as const;
const STAR_ODDS = 0.08;
const FORM_ODDS = 0.02;
const OTHER_REGION_SHARE = 0.4;
const WALK_STEPS = 10;

interface Wild { id: string; star: boolean; form: boolean }
export interface SafariLandState extends BaseState {
  steps: number;
  stepsMax: number;
  balls: number;
  ballsMax: number;
  /** Level every caught Pokémon arrives at (the stage's opening level plus one). */
  level: number;
  /** Seeds the rotating other-region share, so a run's Safari is its own. */
  mix: number;
  mon: Wild;
  catchP: number;
  fleeP: number;
  caught: { id: string; star: boolean }[];
  /** Pokémon that ran off, for the end summary. */
  fled: number;
}

const rng = (s: BaseState) => new Rng(s.rs);
const keep = (s: BaseState, r: Rng) => void (s.rs = r.state);

const hashUnit = (key: string): number => new Rng(hashSeed(key)).float();

/** A Pokémon the Safari may hold: not a Legendary, a baby, a Mega or a special form. */
function eligible(sp: Species): boolean {
  if (sp.tags.some((t) => t === 'legendary' || t === 'mythical' || t === 'baby' || t === 'zform' || t === 'spooky' || t === 'scout')) return false;
  if (sp.form && sp.form.kind !== 'regional') return false;
  return !/-(mega|gmax|totem)/.test(sp.id);
}
const isDeltaOrHisui = (sp: Species): boolean => sp.tags.includes('delta') || sp.id.endsWith('-hisui');

/** The species an area can show for the common draw: all of Kanto (generation 1) plus the rotating share of every other generation. */
export function safariPool(content: Content, mix: number, area: number): { id: string; weight: number }[] {
  const out: { id: string; weight: number }[] = [];
  for (const sp of content.species.values()) {
    if (!eligible(sp) || isDeltaOrHisui(sp) || (SAFARI_STARS as readonly string[]).includes(sp.id)) continue;
    if (sp.generation !== 1 && hashUnit(`safari:${mix}:${area}:${sp.id}`) >= OTHER_REGION_SHARE) continue;
    out.push({ id: sp.id, weight: 10 + sp.catchRate });
  }
  return out.sort((a, b) => (a.id < b.id ? -1 : 1));
}

/** The 2% draw: every Delta and Hisuian form. */
export function safariForms(content: Content): string[] {
  return [...content.species.values()].filter((sp) => eligible(sp) && isDeltaOrHisui(sp)).map((sp) => sp.id).sort();
}

const areaAt = (s: SafariLandState): number => Math.min(3, Math.floor(((s.stepsMax - s.steps) * 4) / s.stepsMax));

function nextEncounter(content: Content, s: SafariLandState): void {
  const r = rng(s);
  const area = areaAt(s);
  const roll = r.float();
  let id: string;
  let star = false;
  let form = false;
  if (roll < STAR_ODDS) { id = r.pick([...SAFARI_STARS]); star = true; }
  else if (roll < STAR_ODDS + FORM_ODDS && safariForms(content).length > 0) { id = r.pick(safariForms(content)); form = true; }
  else id = r.weighted(safariPool(content, s.mix, area).map((p) => ({ item: p.id, weight: p.weight })));
  const sp = content.species.get(id);
  const rate = sp?.catchRate ?? 100;
  s.mon = { id, star, form };
  s.catchP = Math.min(0.7, Math.max(0.1, 0.12 + 0.55 * (rate / 255)));
  s.fleeP = star ? 0.3 : 0.18;
  keep(s, r);
}

const nameOf = (content: Content, id: string): string => content.species.get(id)?.name ?? id;

export const safariLand: MinigameModule<SafariLandState> = {
  start(content, p, rs) {
    const r = new Rng(rs);
    const balls = p.balls! + (p.bonus ?? 0);
    const s: SafariLandState = {
      rs, done: false, msg: '', tick: 0,
      steps: p.steps!, stepsMax: p.steps!, balls, ballsMax: balls, level: Math.max(2, p.level ?? 5), mix: r.int(0, 999999),
      mon: { id: '', star: false, form: false }, catchP: 0, fleeP: 0, caught: [], fled: 0,
    };
    s.rs = r.state;
    nextEncounter(content, s);
    return s;
  },
  view(content, s) {
    const where = SAFARI_AREAS[areaAt(s)]!;
    return {
      hud: [`Safari Land: ${where}`, `Steps: ${s.steps}`, `Safari Balls: ${s.balls}`, `Caught: ${s.caught.length}`, s.msg],
      prompt: s.done ? 'The whistle blows. Safari time is up.' : `A wild ${nameOf(content, s.mon.id)} appeared!${s.mon.star ? ' It looks rare.' : s.mon.form ? ' It looks different from the others.' : ''}`,
      cols: 4,
      done: s.done,
      portraits: s.done ? s.caught.map((c) => c.id) : [s.mon.id],
      cells: [
        { id: 'ball', label: 'Safari Ball', detail: `${Math.round(s.catchP * 100)}% to catch`, tone: 'hot', disabled: s.done || s.balls <= 0 },
        { id: 'bait', label: 'Throw bait', detail: 'easier to catch, flees more', tone: 'info', disabled: s.done },
        { id: 'rock', label: 'Throw a rock', detail: 'harder to catch, flees less', tone: 'dim', disabled: s.done },
        { id: 'run', label: 'Walk on', detail: `${WALK_STEPS} steps`, tone: 'dim', disabled: s.done },
      ],
    };
  },
  act(content, s, id) {
    if (s.done) return;
    const r = rng(s);
    const name = nameOf(content, s.mon.id);
    let over = false;
    if (id === 'run') {
      s.msg = `You leave the ${name} behind.`;
      over = true;
    } else if (id === 'ball' && s.balls > 0) {
      s.balls -= 1;
      if (r.chance(s.catchP)) {
        s.caught.push({ id: s.mon.id, star: s.mon.star });
        s.msg = `Gotcha! ${name} was caught!`;
        over = true;
      } else s.msg = `${name} broke free!`;
    } else if (id === 'bait') {
      s.catchP = Math.min(0.9, s.catchP * 1.5);
      s.fleeP = Math.min(0.9, s.fleeP + 0.1);
      s.msg = `${name} eats the bait. It looks warier.`;
    } else if (id === 'rock') {
      s.catchP = Math.max(0.05, s.catchP * 0.6);
      s.fleeP = Math.max(0.02, s.fleeP - 0.08);
      s.msg = `${name} is angry!`;
    }
    // After any throw that did not end it, the Pokémon may run.
    if (!over && id !== 'run' && r.chance(s.fleeP)) {
      s.msg = `${name} ran away!`;
      s.fled += 1;
      over = true;
    }
    keep(s, r);
    if (over) {
      s.steps = Math.max(0, s.steps - WALK_STEPS);
      if (s.steps > 0 && s.balls > 0) nextEncounter(content, s);
    }
    if (s.steps <= 0 || s.balls <= 0) s.done = true;
  },
  result: (s) => ({ score: s.caught.length, max: Math.max(1, s.caught.length) }),
};
