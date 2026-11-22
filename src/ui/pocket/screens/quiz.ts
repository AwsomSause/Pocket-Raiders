// The Pocket look's Starter Quiz (mock-up `quiz`): the professor at the left, the question in a card, the answers as
// buttons, a pip per question. The prologue owns the questions and the answers; this only draws them. Presentation only.

import { act, esc, hdr, keys, page, sprH } from '../kit';
import type { PkArt } from '../art';
import { fit } from '../templates';

export interface PkQuizModel { who: string; art: PkArt | null; intro: string; question: string; answers: readonly { label: string; off: boolean }[]; index: number; at: number; of: number; back: boolean }

export function pkQuiz(d: PkQuizModel): string {
  // `at` counts from 0.
  const n = d.at + 1, many = d.answers.length > 3;
  const head = hdr('Starter Quiz', { area: 'map', crumb: ['Prologue', 'Starter'], pills: [`Question ${n} of ${d.of}`] });
  const steps = '<div class="steps"><i class="past"><b>1</b>Trainer</i><i class="on"><b>2</b>Starter</i><i class=""><b>3</b>Blessing</i><i class=""><b>4</b>Set off</i></div>';

  const answers = d.answers.map((a, k) => `<div class="btn${k === d.index ? ' on' : ''}${a.off ? ' off' : ''}" data-key="qz-${k}"${act('pick', k)}><b style="font-size:${fit(a.label, 520, many ? 15 : 17, 12, 0.5)}px">${esc(a.label)}</b></div>`).join('');
  const pips = Array.from({ length: d.of }, (_, k) => `<i class="${k + 1 < n ? 'past' : k + 1 === n ? 'on' : ''}"></i>`).join('');
  return page('quiz', 26, `<div class="scr quizp${many ? ' gx-qz-many' : ''}${d.of > 6 ? ' gx-qz-long' : ''}" data-key="quiz">${head}${steps}<div class="qz-oak" data-key="qz-oak">${d.art ? sprH(d.art, 300) : ''}</div><div class="qz-q" data-key="qz-q"><em>${esc(d.who)} asks</em>${d.intro ? `<span class="gx-qz-intro">${esc(d.intro)}</span>` : ''}<b style="font-size:${fit(d.question, many ? 900 : 1100, 30, 18, 0.5)}px">${esc(d.question)}</b></div><div class="qz-a" data-key="qz-a">${answers}</div><div class="qz-pips" data-key="qz-pips">${pips}<span>There are no wrong answers.</span></div>${keys([['↑↓', 'answer'], ['Enter', 'choose'], ...(d.back ? [['Esc', 'back'] as const] : [])])}</div>`);
}
