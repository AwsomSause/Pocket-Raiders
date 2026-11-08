// Story Overhaul S2: the player's identity (Look, name, pronouns) and the Vance Tone rules.
// Pure functions; the scenes only call these. No gameplay RNG.

import { graphemeCount, sanitizeName, type ProfileStory } from './schema';

// ---------- Look (Look B is COMING SOON until its checklist passes) ----------

export type LookId = 'look_a' | 'look_b';
export const LOOKS: { id: LookId; label: string; status: 'ready' | 'coming_soon' }[] = [
  { id: 'look_a', label: 'Look A', status: 'ready' },
  { id: 'look_b', label: 'Look B', status: 'ready' },
];
export const lookReady = (id: LookId): boolean => LOOKS.find((l) => l.id === id)?.status === 'ready';

/** The Look a save actually uses: a request for a Look that is not ready gives Look A (and `downgraded` so one toast can say so). */
export function resolveLook(requested: LookId): { look: LookId; downgraded: boolean } {
  return lookReady(requested) ? { look: requested, downgraded: false } : { look: 'look_a', downgraded: true };
}

/** Writes the Look. Look B is rejected (`look_locked`) while it is not ready; the request is kept in `lookRequested`. */
export function setLook(story: ProfileStory, requested: LookId): { story: ProfileStory; result: 'ok' | 'look_locked' } {
  if (!lookReady(requested)) return { story: { ...story, protagonist: { ...story.protagonist, look: 'look_a', lookRequested: requested } }, result: 'look_locked' };
  return { story: { ...story, protagonist: { ...story.protagonist, look: requested, lookRequested: undefined } }, result: 'ok' };
}

/** A loaded save that holds an unready Look is switched to Look A (the request stays). */
export function normalizeLook(story: ProfileStory): { story: ProfileStory; downgraded: boolean } {
  const r = resolveLook(story.protagonist.look);
  if (!r.downgraded) return { story, downgraded: false };
  return { story: { ...story, protagonist: { ...story.protagonist, look: r.look, lookRequested: story.protagonist.look } }, downgraded: true };
}

// ---------- Name ----------

export const NAME_MAX = 12;
const BLOCKLIST = ['admin', 'moderator', 'nigger', 'faggot', 'fuck', 'shit', 'cunt', 'rape', 'nazi', 'hitler'];
export type NameResult = { ok: true; name: string } | { ok: false; error: string };

export function validateName(input: string): NameResult {
  const trimmed = (input ?? '').replace(/\s+/g, ' ').trim();
  if (!trimmed) return { ok: false, error: 'Please enter a name.' };
  if (graphemeCount(trimmed) > NAME_MAX) return { ok: false, error: 'That is too long. 12 letters is the limit.' };
  if (/\./.test(trimmed)) return { ok: false, error: 'Letters, numbers, spaces, hyphens and apostrophes only.' };
  const name = sanitizeName(trimmed);
  if (!name) return { ok: false, error: 'Letters, numbers, spaces, hyphens and apostrophes only.' };
  const flat = name.toLowerCase().replace(/[^a-z]/g, '');
  if (BLOCKLIST.some((w) => flat.includes(w))) return { ok: false, error: 'Let us pick a different name.' };
  return { ok: true, name };
}

// ---------- Pronouns and text tokens ----------

export interface PronounSet { subj: string; obj: string; poss: string; reflexive: string }
export const PRONOUN_PRESETS: Record<'she' | 'he' | 'they', PronounSet & { label: string; plural: boolean }> = {
  she: { label: 'she/her', subj: 'she', obj: 'her', poss: 'her', reflexive: 'herself', plural: false },
  he: { label: 'he/him', subj: 'he', obj: 'him', poss: 'his', reflexive: 'himself', plural: false },
  they: { label: 'they/them', subj: 'they', obj: 'them', poss: 'their', reflexive: 'themself', plural: true },
};
export type PronounChoice = 'she' | 'he' | 'they' | PronounSet;

export function validateCustomPronouns(p: PronounSet): { ok: true; set: PronounSet } | { ok: false; error: string } {
  const words = [p.subj, p.obj, p.poss, p.reflexive].map((w) => (w ?? '').trim().toLowerCase());
  if (words.some((w) => w.length < 2 || w.length > 12)) return { ok: false, error: 'Each word needs 2 to 12 letters.' };
  if (words.some((w) => !/^\p{L}+$/u.test(w))) return { ok: false, error: 'Use letters only.' };
  return { ok: true, set: { subj: words[0]!, obj: words[1]!, poss: words[2]!, reflexive: words[3]! } };
}

const cap = (s: string): string => (s ? s[0]!.toUpperCase() + s.slice(1) : s);
const pluralVerbs = new Set(['they', 'we', 'you']);

/** The forms a text token can ask for. A stored value that is not valid reads as they/them. */
export function pronounForms(choice: string | PronounSet | undefined): Record<string, string> {
  let set: PronounSet & { plural?: boolean };
  if (choice && typeof choice === 'object') set = { ...choice, plural: pluralVerbs.has(choice.subj.toLowerCase()) };
  else set = PRONOUN_PRESETS[(choice as 'she' | 'he' | 'they') in PRONOUN_PRESETS ? (choice as 'she') : 'they'];
  const theirs = set === PRONOUN_PRESETS.they ? 'theirs' : set.poss === 'his' ? 'his' : set.poss.endsWith('s') ? set.poss : `${set.poss}s`;
  const be = set.plural ? 'are' : 'is';
  const was = set.plural ? 'were' : 'was';
  return { they: set.subj, them: set.obj, their: set.poss, theirs, themself: set.reflexive, they_are: `${set.subj} ${be}`, they_were: `${set.subj} ${was}` };
}

/** Fills {player} and the pronoun tokens. {They} and {They_are} are the capitalised forms. Unknown tokens stay as written. */
export function renderTokens(text: string, who: { name?: string; pronouns?: string | PronounSet }): string {
  const forms = pronounForms(who.pronouns);
  return text.replace(/\{(player|[A-Za-z_]+)\}/g, (whole, key: string) => {
    if (key === 'player') return who.name || 'you';
    const lower = key[0]!.toLowerCase() + key.slice(1);
    const form = forms[lower];
    if (!form) return whole;
    return key[0] === key[0]!.toUpperCase() ? cap(form) : form;
  });
}

export const PREVIEW_LINE = '{player} arrived late. {They_are} not nervous. {Their} first question was good.';
export const previewSentence = (who: { name?: string; pronouns?: string | PronounSet }): string => renderTokens(PREVIEW_LINE, who);

// ---------- Vance Tone ----------

export type Tone = 'warm' | 'formal' | 'playful';
export const TONES: Tone[] = ['warm', 'formal', 'playful'];
/** The highest of the Tone points wins; ties go to the Question 1 answer (also when all three differ). A missing Question 1 reads as warm. */
export function vanceTone(answers: Tone[]): Tone {
  const counts: Record<Tone, number> = { warm: 0, formal: 0, playful: 0 };
  for (const a of answers) counts[a] += 1;
  const best = Math.max(...TONES.map((t) => counts[t]));
  const leaders = TONES.filter((t) => counts[t] === best);
  const first = answers[0];
  if (leaders.length === 1) return leaders[0]!;
  return first && leaders.includes(first) ? first : leaders[0] ?? 'warm';
}
