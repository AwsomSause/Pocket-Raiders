// The battle log as rows (Phantom UI, mock-up `blog`): who acted, what happened, the move's name, and where each turn starts.
// Presentation only: it reads the said lines, never changes a battle.

export interface LogRow {
  /** Set on the first row of a turn. */
  turn?: number;
  /** The Pokémon (or the speaker) the line is about; none for lines about the field. */
  who?: string;
  foe?: boolean;
  text: string;
  /** The move's name inside `text`, drawn in gold. */
  move?: string;
}

const FOE_PREFIX = /^(?:the wild |wild |the foe's |foe's |the opposing |opposing |foe )/i;

/** One said line as a row. `mine` and `foes` are the names on each side; a mirror match counts as yours unless the line says "foe". */
export function logRow(line: string, mine: readonly string[], foes: readonly string[]): LogRow {
  const speech = /^([^:“]{1,32}): “/.exec(line);
  if (speech) return { who: speech[1]!, foe: !mine.includes(speech[1]!), text: line.slice(speech[1]!.length + 2) };
  const pre = FOE_PREFIX.exec(line);
  const rest = pre ? line.slice(pre[0].length) : line;
  const names = [...(pre ? foes : [...mine, ...foes])].sort((a, b) => b.length - a.length);
  const who = names.find((n) => rest.startsWith(n) && /^(?:\s|'s\b|’s\b|$)/.test(rest.slice(n.length)));
  if (!who) return { text: line };
  let text = rest.slice(who.length).trim();
  if (/^['’]s\s/.test(text)) text = `Its ${text.slice(3)}`;
  const move = /^used ([^!.]+?)[!.]/.exec(text)?.[1];
  return { who, foe: !!pre || !mine.includes(who), text, ...(move ? { move } : {}) };
}

/** The rows of a log, with a turn tag where the turn changes (a line with nobody in it carries the tag itself). */
export function logRows(lines: readonly { text: string; turn: number }[], mine: readonly string[], foes: readonly string[]): LogRow[] {
  const out: LogRow[] = [];
  let last = -1;
  for (const l of lines) {
    const row = logRow(l.text, mine, foes);
    if (l.turn !== last && l.turn > 0) {
      if (row.who) out.push({ turn: l.turn, text: '' });
      else row.turn = l.turn;
    }
    last = l.turn;
    out.push(row);
  }
  return out;
}
