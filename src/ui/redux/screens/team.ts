// The rival's team page for the New UI (gn.new.29 The Borrowed Team): the team you commanded from behind their hat, with each
// Pokémon's level, types and real moves. Opened with R on a rival's scene; Enter or Esc closes it. Pure HTML from the kit.
import { act, esc, H, mini, TX, ty, W } from '../kit';

import type { ReduxCtx } from '../stage';

export interface TeamCard { name: string; file: string | null; level: number; types: string[]; moves: string[] }
export interface TeamModel { rival: string; cards: TeamCard[] }

export function teamView(c: ReduxCtx, d: TeamModel): string {
  const v = c.v(2);
  const cols = d.cards.length > 4 ? 3 : d.cards.length > 1 ? 2 : 1;
  const card = (m: TeamCard): string => W(
    `<div class="row" style="gap:8px;align-items:center">${m.file ? mini(m.file, v ? 36 : 48) : ''}<div class="col grow" style="min-width:0;gap:2px"><b style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(m.name)}${m.level ? ` <span class="sm">Lv ${m.level}</span>` : ''}</b><div class="row" style="gap:4px">${m.types.map(ty).join('')}</div></div></div>`
    + `<div style="display:grid;grid-template-columns:1fr 1fr;gap:3px;margin-top:4px">${[0, 1, 2, 3].map((k) => `<span style="background:#0003;border-radius:3px;padding:1px 6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:12px">${m.moves[k] ? esc(m.moves[k]!) : '—'}</span>`).join('')}</div>`,
    'padding:8px;min-width:0', 'team-card', ' data-testid="team-card"',
  );
  return H(`${d.rival}'s team`, 'story', [['Enter', 'close']])
    + `<div class="abs" style="left:24px;right:24px;top:62px;bottom:${v ? 112 : 104}px;display:grid;grid-template-columns:repeat(${cols},1fr);gap:8px;align-content:start;overflow:hidden"${act('back')}>${d.cards.map(card).join('')}</div>`
    + TX('You commanded every one of these. Their moves, their habits. You will not forget them.', d.rival);
}
