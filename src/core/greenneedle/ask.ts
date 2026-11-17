// A choice in the middle of a battle, and a fight in phases (event rule fields `asks` and `phases`, core/greenneedle/schema.ts).
//
// The fight stops at a stated moment (a turn, an HP line, a phase, a new button) and asks the player one question with 2 to 4
// answers; each answer does its listed effects and the fight goes on. Everything is kept on the battle itself, as marks in
// `battle.storyEffects` (saved with the battle), so a reload in the middle of a question asks it again. Nothing here rolls a random
// number: showing a question, or answering it, never moves a gameplay stream. The battle screen only shows `askDue` / `askButtons`
// and sends the `answer` action; a fight nobody answers (a headless run) just goes on with nothing chosen.
import type { Content } from '../contentSchema';
import { maxHp } from '../pokemon';
import type { BattleState, PokemonInstance, RunState } from '../state';
import { crystalOp, golemRead } from './crystals';
import { pitsPull } from './factory';
import type { GnAsk, GnAskEffect } from './schema';

/** `ask:<id>`: that question was answered. */
export const ASK_DONE = 'ask:';
/** `ask-open:<id>`: a follow-up question is open ("Which one?"). */
export const ASK_OPEN = 'ask-open:';
/** `ask-phase:<n>`: the phase the fight is in (none: phase 1). */
export const ASK_PHASE = 'ask-phase:';
/** `ask-pass:<turns left>:<outcome>`: the turns pass by themselves, then the fight ends. */
export const ASK_PASS = 'ask-pass:';
/** `ask-pass-line:<line>`: the line for the next passing turn. */
export const ASK_PASS_LINE = 'ask-pass-line:';
/** `ask-form:<species>`: the form your Pokémon takes (the engine makes the change, then removes the mark). */
export const ASK_FORM = 'ask-form:';
/** House Call's own mark (battle/engine.ts): this Rotom has had its one change this battle. */
const HOUSE_CALL = 'house-call:';
const FOE_WAITS = 'gn-foe-waits:';
const YOU_WAIT = 'gn-you-wait:';

/** House Call (gn.new.23): once a battle, on entry, a plain Rotom may change to any appliance form. Two pages (a question holds four answers). */
export const HOUSE_CALL_ASKS: readonly GnAsk[] = [
  {
    id: 'house-call', at: { chained: true }, text: 'House Call: Rotom hums, and looks round for something to live in. Which one?',
    options: [
      { label: 'The oven.', text: 'It slips into the oven. The door glows.', effects: [{ kind: 'form', species: 'rotom-heat' }] },
      { label: 'The washing machine.', text: 'It slips into the washing machine. The drum turns.', effects: [{ kind: 'form', species: 'rotom-wash' }] },
      { label: 'The fridge.', text: 'It slips into the fridge. Frost creeps over the door.', effects: [{ kind: 'form', species: 'rotom-frost' }] },
      { label: 'Another.', then: 'house-call-2' },
    ],
  },
  {
    id: 'house-call-2', at: { chained: true }, text: 'House Call: which one?',
    options: [
      { label: 'The fan.', text: 'It slips into the fan. The blades spin up.', effects: [{ kind: 'form', species: 'rotom-fan' }] },
      { label: 'The mower.', text: 'It slips into the mower. The engine catches.', effects: [{ kind: 'form', species: 'rotom-mow' }] },
      { label: 'Stay as it is.', text: 'It stays as it is, humming to itself.' },
      { label: 'Back.', then: 'house-call' },
    ],
  },
];

export interface AskView {
  id: string;
  /** The question in full (read first when it is longer than `prompt`). */
  text: string;
  /** The line that stays in the text box beside the answers. */
  prompt: string;
  /** The answers on offer; `index` is the answer's place in the question's own list (what the `answer` action sends). */
  options: { index: number; label: string }[];
}

const flagOf = (run: Pick<RunState, 'story'>, key: string): number => Number(run.story.flags[`ev:${key}`] ?? 0);
const holds = (run: Pick<RunState, 'story'>, conds: readonly { key: string; min?: number; max?: number }[] | undefined): boolean =>
  (conds ?? []).every((c) => {
    const v = flagOf(run, c.key);
    return v >= (c.min ?? 1) && v <= (c.max ?? Number.MAX_SAFE_INTEGER);
  });

/** The phase the fight is in: 1 at the start. */
export function phaseOf(battle: Pick<BattleState, 'storyEffects'>): number {
  const token = battle.storyEffects.find((t) => t.startsWith(ASK_PHASE));
  return token ? Number(token.slice(ASK_PHASE.length)) || 1 : 1;
}

/** The HP a hit can't take the boss under in this phase: the next phase's line (0 in the last phase, or in a fight without phases). */
export function phaseFloor(battle: Pick<BattleState, 'storyEffects' | 'eventRule' | 'enemyTeam'>, mon: PokemonInstance, max: number): number {
  const phases = battle.eventRule?.phases;
  if (!phases || mon !== battle.enemyTeam[0]) return 0;
  const next = phases[phaseOf(battle) - 1];
  return next ? Math.max(1, Math.floor(max * next.at)) : 0;
}

/** Checked as a turn begins and as it ends: the boss's HP has reached the next phase's line, so that phase begins. Returns its lines. */
export function phaseSync(content: Content, battle: BattleState): string[] {
  const phases = battle.eventRule?.phases;
  const boss = battle.enemyTeam[0];
  const lines: string[] = [];
  if (!phases || !boss || battle.outcome || boss.hp <= 0) return lines;
  const max = maxHp(content, boss);
  for (;;) {
    const now = phaseOf(battle);
    const next = phases[now - 1];
    if (!next || boss.hp > Math.max(1, Math.floor(max * next.at))) return lines;
    battle.storyEffects = battle.storyEffects.filter((t) => !t.startsWith(ASK_PHASE));
    battle.storyEffects.push(`${ASK_PHASE}${now + 1}`);
    if (next.gn) battle.eventRule = { ...battle.eventRule!, gn: next.gn };
    if (next.moves) {
      const moves = next.moves.filter((id) => content.moves.has(id)).map((id) => ({ id, pp: content.moves.get(id)!.pp }));
      if (moves.length) boss.moves = moves;
    }
    for (const [stat, n] of Object.entries(next.foeStages ?? {})) battle.enemyStages[stat as 'atk'] = n!;
    if (next.line) lines.push(plain(next.line));
  }
}

/** Every question this fight knows: the event rule's own, and House Call's. */
function asksOf(battle: Pick<BattleState, 'eventRule'>): readonly GnAsk[] {
  return [...(battle.eventRule?.asks ?? []), ...HOUSE_CALL_ASKS];
}

/** The battle's text box shows plain text: the event scripts' *stage directions* and **names** lose their marks. */
const plain = (text: string): string => text.replace(/\*+/g, '');
/** What fits in the battle's text box beside the answers. */
const BOX = 84;

const view = (run: RunState, ask: GnAsk): AskView => ({
  id: ask.id,
  text: plain(ask.text),
  prompt: plain(ask.prompt ?? (ask.text.length <= BOX ? ask.text : ask.text.slice(ask.text.lastIndexOf(' ', BOX)).trim())),
  options: ask.options.map((o, index) => ({ index, label: o.label, ok: holds(run, o.if) })).filter((o) => o.ok).map(({ index, label }) => ({ index, label })),
});

/** True when a plain Rotom with House Call stands in the fight and has not had its change yet (single battles; your side). */
function houseCallDue(run: RunState, battle: BattleState, mon: PokemonInstance): boolean {
  return !battle.doubles && mon.speciesId === 'rotom' && mon.fixedAbility === 'house-call' && !battle.storyEffects.includes(`${HOUSE_CALL}${mon.uid}`);
}

/** The question the battle screen must ask now, before the next command; null when there is none. */
export function askDue(content: Content, run: RunState): AskView | null {
  const battle = run.battle;
  if (!battle || battle.outcome || battle.needsSwitch || battle.spectate || askPassing(battle)) return null;
  const mon = run.party[battle.activeIndex];
  if (!mon || mon.hp <= 0) return null;
  const asks = asksOf(battle);
  // A follow-up question that is open comes first.
  const open = battle.storyEffects.find((t) => t.startsWith(ASK_OPEN))?.slice(ASK_OPEN.length);
  const opened = open ? asks.find((a) => a.id === open) : undefined;
  if (opened) return view(run, opened);
  const foe = battle.enemyTeam[0];
  const phase = phaseOf(battle);
  for (const ask of battle.eventRule?.asks ?? []) {
    const at = ask.at;
    if (at.chained || at.button !== undefined || battle.storyEffects.includes(`${ASK_DONE}${ask.id}`) || !holds(run, ask.if)) continue;
    if (at.turn !== undefined && battle.turn < at.turn) continue;
    if (at.phase !== undefined && phase < at.phase) continue;
    if (at.foeHp !== undefined && !(foe && foe.hp > 0 && foe.hp <= maxHp(content, foe) * at.foeHp)) continue;
    if (at.myHp !== undefined && !(mon.hp < maxHp(content, mon) * at.myHp)) continue;
    const v = view(run, ask);
    if (v.options.length > 0) return v;
  }
  if (houseCallDue(run, battle, mon)) return view(run, HOUSE_CALL_ASKS[0]!);
  return null;
}

/** The new buttons on the battle menu this turn ("Give it the crystals.", "Stop attacking."). `direct`: one answer, done at once. */
export function askButtons(content: Content, run: RunState): { id: string; label: string; direct: boolean }[] {
  const battle = run.battle;
  if (!battle || battle.outcome || battle.needsSwitch || askPassing(battle)) return [];
  const phase = phaseOf(battle);
  return (battle.eventRule?.asks ?? [])
    .filter((a) => a.at.button !== undefined && !battle.storyEffects.includes(`${ASK_DONE}${a.id}`) && phase >= (a.at.phase ?? 1) && holds(run, a.if) && view(run, a).options.length > 0)
    .map((a) => ({ id: a.id, label: a.at.button!, direct: a.options.length === 1 }));
}

/** The question a button opens (for the screen), or null. */
export function askOf(content: Content, run: RunState, id: string): AskView | null {
  if (!askButtons(content, run).some((b) => b.id === id)) return null;
  const ask = run.battle!.eventRule!.asks!.find((a) => a.id === id)!;
  return view(run, ask);
}

/** The turns are passing by themselves (after "Stop attacking."): the screen sends `idle` without asking. */
export function askPassing(battle: Pick<BattleState, 'storyEffects' | 'outcome'> | null | undefined): boolean {
  return !!battle && !battle.outcome && battle.storyEffects.some((t) => t.startsWith(ASK_PASS));
}

/** End of a passing turn: one fewer to go; after the last, the fight ends. Returns the line to show. */
export function passTurnEnd(battle: BattleState): string | null {
  const at = battle.storyEffects.findIndex((t) => t.startsWith(ASK_PASS));
  if (at < 0 || battle.outcome) return null;
  const [left, outcome] = battle.storyEffects[at]!.slice(ASK_PASS.length).split(':');
  const n = Number(left) - 1;
  const lineAt = battle.storyEffects.findIndex((t) => t.startsWith(ASK_PASS_LINE));
  const line = lineAt >= 0 ? battle.storyEffects[lineAt]!.slice(ASK_PASS_LINE.length) : null;
  if (lineAt >= 0) battle.storyEffects.splice(lineAt, 1);
  const i = battle.storyEffects.findIndex((t) => t.startsWith(ASK_PASS));
  if (n > 0) battle.storyEffects[i] = `${ASK_PASS}${n}:${outcome}`;
  else {
    battle.storyEffects.splice(i, 1);
    battle.outcome = outcome === 'lose' ? 'lose' : 'win';
  }
  return line;
}

function applyEffect(content: Content, run: RunState, battle: BattleState, mon: PokemonInstance, fx: GnAskEffect, lines: string[]): void {
  const foe = battle.enemyTeam[battle.enemyIndex] ?? battle.enemyTeam[0];
  switch (fx.kind) {
    case 'flag':
      run.story.flags[`ev:${fx.key}`] = fx.n;
      return;
    case 'stages': {
      const stages = fx.side === 'you' ? battle.playerStages : battle.enemyStages;
      for (const [stat, n] of Object.entries(fx.stages)) stages[stat as 'atk'] = Math.max(-6, Math.min(6, stages[stat as 'atk'] + n!));
      return;
    }
    case 'heal': {
      const who = fx.side === 'you' ? mon : foe;
      if (who && who.hp > 0) who.hp = Math.min(maxHp(content, who), who.hp + Math.max(1, Math.floor(maxHp(content, who) * fx.share)));
      return;
    }
    case 'foeWaits':
      battle.storyEffects.push(`${FOE_WAITS}${fx.line}`);
      return;
    case 'youWait':
      battle.storyEffects.push(`${YOU_WAIT}${fx.line}`);
      return;
    case 'end':
      battle.outcome = fx.outcome;
      return;
    case 'pass':
      battle.storyEffects.push(`${ASK_PASS}${fx.turns}:${fx.outcome}`, ...fx.lines.map((l) => `${ASK_PASS_LINE}${l}`));
      return;
    case 'form':
      if (content.species.has(fx.species)) battle.storyEffects.push(`${ASK_FORM}${fx.species}`);
      return;
    case 'op': {
      const line = fx.op === 'crystalDrop' ? crystalOp(content, run, 'crystalDrop', fx.key, undefined, undefined) : fx.op === 'golemRead' ? golemRead(run, battle) : pitsPull(content, run, battle);
      if (line) lines.push(line);
      return;
    }
  }
}

/**
 * The player's answer. `askId` must be the question that is due, or a button on offer; `option` is the answer's place in its list.
 * Changes the battle (and run flags) and returns the lines to show. Throws when there is no such question or answer now.
 */
export function answerAsk(content: Content, run: RunState, askId: string, option: number): string[] {
  const battle = run.battle;
  const due = askDue(content, run);
  const button = due?.id === askId ? null : askButtons(content, run).find((b) => b.id === askId);
  if (!battle || (due?.id !== askId && !button)) throw new Error('There is nothing to answer');
  const ask = asksOf(battle).find((a) => a.id === askId)!;
  const picked = ask.options[option];
  if (!picked || !holds(run, picked.if)) throw new Error('That answer is not on offer');
  const mon = run.party[battle.activeIndex]!;
  // The question is closed: a follow-up's open mark goes, an asked-once question is marked done.
  battle.storyEffects = battle.storyEffects.filter((t) => t !== `${ASK_OPEN}${askId}`);
  if (!ask.at.chained && !(button && picked.then)) battle.storyEffects.push(`${ASK_DONE}${askId}`);
  const lines: string[] = picked.text ? [plain(picked.text)] : [];
  for (const fx of picked.effects ?? []) applyEffect(content, run, battle, mon, fx, lines);
  if (picked.then && asksOf(battle).some((a) => a.id === picked.then)) battle.storyEffects.push(`${ASK_OPEN}${picked.then}`);
  // House Call: any last answer (a form, or staying plain) is its one change this battle.
  else if (askId.startsWith('house-call')) battle.storyEffects.push(`${HOUSE_CALL}${mon.uid}`);
  return lines;
}

/** The form your Pokémon is to take now (set by an answer), taken off the battle; null when none. */
export function takeAskForm(battle: BattleState): string | null {
  const at = battle.storyEffects.findIndex((t) => t.startsWith(ASK_FORM));
  if (at < 0) return null;
  return battle.storyEffects.splice(at, 1)[0]!.slice(ASK_FORM.length);
}
