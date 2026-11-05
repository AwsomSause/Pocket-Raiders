// The choices behind the Run Setup and Trainer pages of the Preparation Desk:
// for each row, its list of options (with why one can't be picked) and how to
// apply a pick. Pure, so the pages and tests share one source of truth.

import { loanProblem } from './bank';
import type { Content, TypeName } from './contentSchema';
import { TYPE_NAMES } from './contentSchema';
import { LICENSES, type LicenseId } from './license';
import { availableMentors, getMentor, mentorBlurb } from './mentors';
import { tokenAvailable, tokenLockText } from './runPrep';
import { RUN_RULES, getMode, heatOf, type RulesChoice } from './rules';
import type { Profile, RunPrep } from './state';

export type OptionRow = 'trainer' | 'token' | 'directive' | 'license' | 'loan' | 'vault' | 'mentor' | 'mode' | 'region' | 'difficulty' | 'heat' | 'campaign' | 'weeks';

export interface PrepState {
  archetypeId: string;
  prep: RunPrep;
  rules: RulesChoice;
}

export interface Opt {
  id: string;
  label: string;
  detail: string;
  /** False: shown but can't be picked (detail says why). */
  ok: boolean;
}

export interface RowOptions {
  options: Opt[];
  /** The id of the option in effect. */
  chosen: string;
  /** False: the whole row doesn't apply now (e.g. Circuit region outside the Regional Circuit). */
  enabled: boolean;
}

export const NONE = '__none';
const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

/** What each row changes, shown above its options. */
export const ROW_HELP: Record<OptionRow | 'start' | 'pool' | 'draft' | 'type' | 'modifier' | 'deathBlock' | 'seed' | 'save' | 'load', string> = {
  start: 'Rolls your starters from the pool and begins the run with everything on this desk.',
  trainer: 'The Trainer you play: their Pokémon leanings, strengths and weaknesses.',
  campaign: 'How many regions the run covers. Shorter campaigns are for testing and do not count for progress.',
  pool: 'Which Pokémon your starters are drawn from. Unlock more pools in the Starter Laboratory.',
  draft: 'How you pick your starters: choose from a few, a blind draft, or focus on one type.',
  type: 'Type Focus only: the type your starter choices lean toward.',
  token: 'One preparation for the run (extra items, money or a hint). More unlock with achievements and licenses.',
  directive: 'Study one type this run for bonus Research Points when you defeat or catch its Pokémon.',
  license: 'A Field License gives one exploration hint for the whole run.',
  loan: 'Borrow money now. Finish with enough badges, or the Bank takes credits back.',
  mentor: 'Train under a mentor: lessons that unlock with trust, a mission, a fellow apprentice. More mentors unlock with runs, wins and trust.',
  vault: "Take a rare held item from the Collector's Vault into this run.",
  mode: 'The kind of run: Standard, Adventure, Endless, Daily Run and more. Some modes pay no account rewards.',
  region: 'Regional Circuit only: the region you run. "By seed" lets the seed pick.',
  difficulty: 'Raises enemy levels and the rewards for beating them.',
  heat: 'Heat Level: stacking opt-in difficulty. Each level adds enemy levels and a reward bonus on top of the difficulty.',
  weeks: "Weeks ON (the default): this week's event and any holiday event apply to this run: their rules, roamers and map stops, and the run counts toward their goals. Weeks OFF: none of that this run. Events you already finished and their rewards are kept either way. The choice is fixed for the whole run.",
  modifier: 'Opens the Modifiers page: every special rule and challenge in a browsable list, with Death-Block.',
  deathBlock: 'Once, at the start of a run, a wipe sends you back to a checkpoint instead of ending it. On for your first three runs.',
  seed: 'A fixed seed makes the run play out the same way again. Paste a shared seed code to copy its trainer and rules too.',
  save: 'Keeps this whole setup in a preset slot to load later.',
  load: 'Replaces this setup with one from a preset slot.',
};

export function optionsFor(row: OptionRow, content: Content, profile: Profile, s: PrepState, testing = false): RowOptions {
  const none = (label = 'None', detail = 'Nothing chosen.'): Opt => ({ id: NONE, label, detail, ok: true });
  switch (row) {
    case 'trainer': {
      const options = [...content.archetypes.values()].filter((a) => a.available && (a.unlockedByDefault || profile.unlockedArchetypes.includes(a.id))).map((a) => ({ id: a.id, label: a.name, detail: a.description ?? '', ok: true }));
      return { options, chosen: s.archetypeId, enabled: true };
    }
    case 'token': {
      const options = [none('No preparation', 'Start the run with nothing extra.'), ...[...content.prepTokens.values()].map((t) => {
        const ok = tokenAvailable(profile, t);
        return { id: t.id, label: t.name, detail: ok ? t.description : `Locked: ${tokenLockText(content, t)}.`, ok };
      })];
      return { options, chosen: s.prep.tokenId ?? NONE, enabled: true };
    }
    case 'directive': {
      const options = [none('No directive', 'No type to study.'), ...TYPE_NAMES.map((t) => ({ id: t, label: cap(t), detail: `Bonus Research Points for ${cap(t)} Pokémon this run.`, ok: true }))];
      return { options, chosen: s.prep.directive ?? NONE, enabled: true };
    }
    case 'license': {
      const options = [none('No license', 'No exploration hint.'), ...LICENSES.map((l) => ({ id: l.id, label: l.name, detail: l.blurb, ok: true }))];
      return { options, chosen: s.prep.license ?? NONE, enabled: true };
    }
    case 'loan': {
      const l = content.balance.bank.loan;
      const problem = loanProblem(content, profile);
      return {
        options: [
          { id: 'off', label: 'No loan', detail: 'Start with your own money.', ok: true },
          { id: 'on', label: `Take a loan (+₽${l.money})`, detail: problem ?? `+₽${l.money} now; finish with ${l.badges}+ badges or lose ${l.penalty} credits.`, ok: !problem },
        ],
        chosen: s.prep.loan ? 'on' : 'off',
        enabled: true,
      };
    }
    case 'vault': {
      const items = [...new Set(profile.vault)];
      const options = [none('No vault item', items.length === 0 ? "The Collector's Vault is empty (Bank tier 5 keeps a rare held item from each finished run)." : 'Take nothing.'), ...items.map((id) => ({ id, label: content.items.get(id)?.name ?? id, detail: content.items.get(id)?.description ?? 'A rare held item.', ok: true }))];
      return { options, chosen: s.prep.vaultItem ?? NONE, enabled: true };
    }
    case 'mentor': {
      const options = [none('No mentor', 'Go it alone.'), ...availableMentors(profile).map((m) => ({ id: m.id, label: m.name, detail: mentorBlurb(m).slice(0, 3).join(' '), ok: true }))];
      const chosen = getMentor(s.prep.mentorId)?.id ?? NONE;
      return { options, chosen, enabled: true };
    }
    case 'mode': {
      const options = RUN_RULES.modes.filter((m) => m.status === 'supported').map((m) => ({ id: m.id, label: m.name, detail: m.blurb, ok: true }));
      return { options, chosen: s.rules.modeId, enabled: true };
    }
    case 'region': {
      const options = [{ id: NONE, label: 'By seed', detail: 'The seed picks the region.', ok: true }, ...[...content.regions.values()].filter((r) => !r.grand).map((r) => ({ id: r.id, label: r.name, detail: `Run the ${r.name} circuit.`, ok: true }))];
      return { options, chosen: s.rules.regionId ?? NONE, enabled: getMode(s.rules.modeId)?.campaignId === 'regional-circuit' };
    }
    case 'difficulty': {
      const options = RUN_RULES.difficulties.map((d) => ({ id: d.id, label: d.name, detail: d.blurb, ok: true }));
      return { options, chosen: s.rules.difficultyId, enabled: true };
    }
    case 'heat': {
      const per = RUN_RULES.heat;
      const options = Array.from({ length: per.max + 1 }, (_, i) => ({ id: String(i), label: i === 0 ? 'Heat 0 (off)' : `Heat ${i}`, detail: i === 0 ? 'No extra heat.' : `Enemy levels +${i * per.enemyLevelPerHeat}, rewards +${Math.round(i * per.bonusPerHeat * 100)}%.`, ok: true }));
      return { options, chosen: String(heatOf(s.rules)), enabled: true };
    }
    case 'campaign': {
      const options = [...content.campaigns.values()].filter((c) => c.countsForProgress || testing).map((c) => ({ id: c.id, label: c.name, detail: c.countsForProgress ? 'Counts for progress.' : 'Testing only: does not count for progress.', ok: true }));
      return { options, chosen: s.prep.campaignId, enabled: true };
    }
    case 'weeks':
      return {
        options: [
          { id: 'on', label: 'Weeks ON (default)', detail: "This week's event and any holiday event apply.", ok: true },
          { id: 'off', label: 'Weeks OFF', detail: 'No weekly or holiday events this run.', ok: true },
        ],
        chosen: s.rules.weeks === false ? 'off' : 'on',
        enabled: true,
      };
  }
}

/** The state after picking `id` in `row` (an id that is not in the row's options changes nothing). */
export function applyOption(row: OptionRow, id: string, s: PrepState, content: Content, profile: Profile, testing = false): PrepState {
  const opts = optionsFor(row, content, profile, s, testing);
  const opt = opts.options.find((o) => o.id === id);
  if (!opt || !opt.ok || !opts.enabled) return s;
  const val = id === NONE ? null : id;
  const prep = (p: Partial<RunPrep>): PrepState => ({ ...s, prep: { ...s.prep, ...p } });
  const rules = (r: Partial<RulesChoice>): PrepState => ({ ...s, rules: { ...s.rules, ...r } });
  switch (row) {
    case 'trainer': return { ...s, archetypeId: id };
    case 'token': return prep({ tokenId: val });
    case 'directive': return prep({ directive: val as TypeName | null });
    case 'license': return prep({ license: val as LicenseId | null });
    case 'loan': return prep({ loan: id === 'on' });
    case 'vault': return prep({ vaultItem: val });
    case 'mentor': return prep({ mentorId: val });
    case 'mode': return rules({ modeId: id });
    case 'region': return rules({ regionId: val });
    case 'difficulty': return rules({ difficultyId: id });
    case 'heat': return rules({ heat: Number(id) });
    case 'campaign': return prep({ campaignId: id });
    case 'weeks': return rules({ weeks: id === 'on' });
  }
}
