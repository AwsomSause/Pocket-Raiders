import { describe, expect, it } from 'vitest';
import { OUTLETS, TEMPLATE_TOKENS, renderTemplate, tokensIn } from '../../src/core/story2/templates';
import { content } from './helpers';

const story = content.storyData;

describe('story templates', () => {
  it('tokensIn lists each token once; renderTemplate fills known values and keeps unknown tokens visible', () => {
    expect(tokensIn('{a} met {b} and {a}')).toEqual(['a', 'b']);
    expect(renderTemplate('{player} meets {rival}', { player: 'Dara' })).toBe('Dara meets {rival}');
    expect(renderTemplate('Node {node}', { node: 7 })).toBe('Node 7');
  });
  it('news_has_forty_headlines_over_three_outlets, every outlet text exists', () => {
    expect(story.news.length).toBeGreaterThanOrEqual(40);
    const outlets = new Set<string>();
    for (const n of story.news) for (const [o, key] of Object.entries(n.outlets)) { outlets.add(o); expect(story.text[key], key).toBeTruthy(); }
    expect([...outlets].sort()).toEqual([...OUTLETS].sort());
  });
  it('every news token is declared, known, and resolves with a full value set', () => {
    const values = Object.fromEntries(TEMPLATE_TOKENS.map((t) => [t, 'X']));
    for (const n of story.news) for (const key of Object.values(n.outlets)) {
      const text = story.text[key]!;
      expect(renderTemplate(text, values), key).not.toMatch(/\{\w+\}/);
      for (const t of tokensIn(text)) expect(n.tokens, `${n.id} ${t}`).toContain(t);
    }
  });
  it('chronicle templates exist, open with "In this telling,", and use known tokens only', () => {
    expect(story.text['chron.open']).toBe('In this telling,');
    const keys = Object.keys(story.text).filter((k) => k.startsWith('chron.'));
    expect(keys.length).toBeGreaterThanOrEqual(20);
    for (const k of keys) for (const t of tokensIn(story.text[k]!)) expect(TEMPLATE_TOKENS as readonly string[], k).toContain(t);
  });
  it('field notes are lore entries a researcher can source', () => {
    const notes = story.lore.filter((l) => l.id.startsWith('lore_fn_'));
    expect(notes.length).toBeGreaterThanOrEqual(6);
    for (const l of notes) expect(l.sources).toContain('ch_vance');
  });
});
