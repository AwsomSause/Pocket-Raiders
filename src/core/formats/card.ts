// Wide format 8: the story card (Beta 0.7 epilogue). A plain card with a title, some lines and up to a few choices; the pick is
// handed to the epilogue director through `run.expansion.cut.cardPick`. The Citadark finale and the Region of Doom use it for
// their letters, offers and resolutions. No battle, no RNG: the card only shows what the director gave it.

import { cutOf } from './store';
import type { FormatCard, FormatCtx, WideFormat } from './types';

export interface CardState {
  title: string;
  lines: string[];
  options: Array<{ id: string; label: string }>;
  picked: string | null;
}

export const card: WideFormat<CardState> = {
  id: 'card',
  setup: (_ctx: FormatCtx, input?: unknown): CardState => {
    const i = (input ?? {}) as Partial<CardState>;
    return { title: i.title ?? '', lines: i.lines ?? [], options: i.options ?? [], picked: null };
  },
  describe(s): FormatCard {
    const over = s.picked !== null || s.options.length === 0;
    const chosen = s.picked !== null ? s.options.find((o) => o.id === s.picked)?.label : null;
    return {
      title: s.title,
      lines: chosen ? [...s.lines, `You chose: ${chosen}.`] : s.lines,
      options: s.options.map((o) => ({ id: o.id, label: o.label, enabled: true })),
      over,
    };
  },
  choose(s, optionId, { run }): CardState {
    if (s.picked !== null || !s.options.some((o) => o.id === optionId)) return s;
    cutOf(run).cardPick = optionId;
    return { ...s, picked: optionId };
  },
  isOver: (s) => s.picked !== null || s.options.length === 0,
};
