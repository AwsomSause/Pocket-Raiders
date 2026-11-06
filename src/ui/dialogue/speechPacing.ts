// How a spoken line is typed out so it reads like real speech (presentation only, no Phaser).
// Commas and full stops pause, "..." drags, CAPS and [shake] get loud (faster, box shakes),
// a question rises in pitch at the end. Authors can also mark a line: [slow]..[/slow],
// [fast]..[/fast], [shake]..[/shake], [pause] (a beat) and [p=600] (a pause in ms).

export type SpeechMood = 'shout' | 'question' | 'trail' | 'calm';
export type SpeechVoice = 'brash' | 'gentle' | 'calm' | 'grim' | 'cheerful';

export interface SpeechBeat {
  /** One character of the shown text. */
  ch: string;
  /** Milliseconds to wait after this character before the next one. */
  wait: number;
  /** Part of a loud stretch (CAPS word or [shake]). */
  loud: boolean;
  /** Play a voice blip on this character. */
  blip: boolean;
  /** Blip pitch multiplier (1 = the speaker's normal pitch). */
  pitch: number;
}

export interface SpeechPlan {
  /** The line without tags (what the log and the finished box show). */
  plain: string;
  beats: SpeechBeat[];
  mood: SpeechMood;
  /** Character indexes where the text box shakes. */
  shakeAt: number[];
  /** Total typing time in ms. */
  total: number;
}

/** Voice feel: typing speed multiplier, so a brash trainer talks faster than a grim one. */
export const VOICE_TEMPO: Record<SpeechVoice, number> = { brash: 0.85, cheerful: 0.8, calm: 1, gentle: 1.15, grim: 1.3 };

const PAUSE_COMMA = 140;
const PAUSE_STOP = 300;
const PAUSE_DOT = 200;
const PAUSE_TAG = 450;
const MAX_PAUSE = 2000;

const TAG = /\[(\/?)(slow|fast|shake|pause|p=(\d{1,4}))\]/y;

/** Plans the typing of one line. `baseMs` is the per-letter delay from Settings > Text speed. */
export function planSpeech(text: string, baseMs: number, voice: SpeechVoice = 'calm'): SpeechPlan {
  const tempo = VOICE_TEMPO[voice] ?? 1;
  const beats: SpeechBeat[] = [];
  const shakeAt: number[] = [];
  let slow = 0;
  let fast = 0;
  let shake = 0;
  let extraNext = 0;
  for (let i = 0; i < text.length; ) {
    TAG.lastIndex = i;
    const m = TAG.exec(text);
    if (m) {
      const close = m[1] === '/';
      const name = m[2]!;
      if (name === 'slow') slow += close ? -1 : 1;
      else if (name === 'fast') fast += close ? -1 : 1;
      else if (name === 'shake') {
        if (!close && shake === 0) shakeAt.push(beats.length);
        shake += close ? -1 : 1;
      } else if (name === 'pause') extraNext += PAUSE_TAG;
      else extraNext += Number(m[3]);
      slow = Math.max(0, slow);
      fast = Math.max(0, fast);
      shake = Math.max(0, shake);
      i = TAG.lastIndex;
      continue;
    }
    if (extraNext > 0 && beats.length > 0) beats[beats.length - 1]!.wait = Math.min(MAX_PAUSE, beats[beats.length - 1]!.wait + extraNext);
    extraNext = 0;
    const ch = text[i]!;
    const capsWord = isCapsWordAt(text, i);
    if (capsWord && shake === 0 && (i === 0 || !isLetter(text[i - 1]!))) shakeAt.push(beats.length);
    const loud = shake > 0 || capsWord;
    let speed = tempo * (slow > 0 ? 2.2 : 1) * (fast > 0 ? 0.45 : 1) * (loud ? 0.7 : 1);
    if (inEllipsis(text, i)) speed *= 1.6;
    let wait = Math.round(baseMs * speed);
    const next = text[i + 1];
    const endOrSpace = next === undefined || next === ' ' || next === '"' || next === '”' || next === '\n';
    if (ch === ',' || ch === ';' || ch === ':' || ch === '—') wait += PAUSE_COMMA;
    else if ((ch === '.' && inEllipsis(text, i)) || ch === '…') wait += PAUSE_DOT;
    else if ((ch === '.' || ch === '!' || ch === '?') && endOrSpace && next !== undefined) wait += PAUSE_STOP;
    beats.push({ ch, wait, loud, blip: isLetter(ch) && beats.length % 2 === 0, pitch: loud ? 1.15 : 1 });
    i++;
  }
  const plain = beats.map((b) => b.ch).join('');
  const trimmed = plain.trim().replace(/[”"')\]]+$/, '');
  const mood: SpeechMood = shakeAt.length > 0 || /!$/.test(trimmed) ? 'shout' : /\?$/.test(trimmed) ? 'question' : /(\.\.\.|…)$/.test(trimmed) ? 'trail' : 'calm';
  // A shout with no loud word still lands: one shake on its last "!".
  if (mood === 'shout' && shakeAt.length === 0) shakeAt.push(plain.lastIndexOf('!'));
  // A question rises over its last word; a trailing line sinks.
  if (mood === 'question' || mood === 'trail') {
    const lastWord = Math.max(0, plain.trimEnd().lastIndexOf(' '));
    for (let k = lastWord; k < beats.length; k++) beats[k]!.pitch *= mood === 'question' ? 1.25 : 0.85;
  }
  if (beats.length > 0) beats[beats.length - 1]!.wait = 0;
  return { plain, beats, mood, shakeAt, total: beats.reduce((s, b) => s + b.wait, 0) };
}

/** The line without tags. */
export function stripSpeechTags(text: string): string {
  return text.replace(/\[\/?(slow|fast|shake|pause|p=\d{1,4})\]/g, '');
}

/** A steady base pitch (Hz) for a speaker's voice blips, from the name and voice. */
export function voicePitch(speaker: string, voice: SpeechVoice = 'calm'): number {
  let h = 0;
  for (const c of speaker) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const base = { brash: 300, cheerful: 380, calm: 260, gentle: 320, grim: 170 }[voice] ?? 260;
  return base + (h % 80) - 40;
}

function isLetter(ch: string): boolean {
  return /\p{L}/u.test(ch);
}

/** True when the character sits in a word of 2+ letters that is all capitals (shouting). */
function isCapsWordAt(text: string, i: number): boolean {
  if (!isLetter(text[i]!)) return false;
  let s = i;
  let e = i;
  while (s > 0 && isLetter(text[s - 1]!)) s--;
  while (e < text.length - 1 && isLetter(text[e + 1]!)) e++;
  const word = text.slice(s, e + 1);
  return word.length >= 2 && word === word.toUpperCase() && word !== word.toLowerCase();
}

function inEllipsis(text: string, i: number): boolean {
  if (text[i] === '…') return true;
  if (text[i] !== '.') return false;
  return text[i - 1] === '.' || text[i + 1] === '.';
}
