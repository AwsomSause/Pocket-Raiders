// Playtest Bot Reports (idea S328): turns the bot playtest log (`node tools/playtest.ts`, one JSON line per run) into
// a short plain-text summary. Reads the same lines as the HTML dashboard. Pure.

import { parseLines, summarize, type Group } from '../../quality/playtestDashboard';

const groupLine = (g: Group) => `${g.key}: ${g.runs} runs, ${g.avgEncounters} encounters on average, ${g.badgePct}% earned a badge${g.problems ? `, ${g.problems} problems` : ''}`;

/** Lines for a log file's text. An empty or unreadable log says so instead of showing zeros. */
export function botReportLines(text: string): string[] {
  const { lines, skipped } = parseLines(text);
  if (!lines.length) return [skipped ? `No runs found (${skipped} lines were not JSON).` : 'No runs found in that file.'];
  const s = summarize(lines);
  const out = [`${s.runs} runs, ${s.problems} with a problem (error, stuck or bad state)${skipped ? `; ${skipped} lines skipped` : ''}.`];
  if (s.byMode.length) out.push('By mode:', ...s.byMode.map(groupLine));
  if (s.byDifficulty.length) out.push('By difficulty:', ...s.byDifficulty.map(groupLine));
  if (s.byTrainer.length) out.push('By trainer:', ...s.byTrainer.map(groupLine));
  if (s.topKillers.length) out.push('Most common last attackers:', ...s.topKillers.map((k) => `${k.id}: ${k.count}`));
  return out;
}
