import { describe, expect, it } from 'vitest';
import type { ReduxCtx } from '../../src/ui/redux/stage';
import { agoWord, LOG_EMPTY, noticeOf, overlayView, type OverlayModel } from '../../src/ui/redux/screens/overlay';

const ctx: ReduxCtx = { k: 0, skin: {} as ReduxCtx['skin'], v: () => 0 };
const count = (html: string, bit: string): number => html.split(bit).length - 1;
const model = (o: Partial<OverlayModel> = {}): OverlayModel => ({ notices: [], toasts: [], log: null, caption: '', ...o });

describe('New UI system overlays', () => {
  it('a notice with a short "Head: line" start splits into its head and its line; a plain line is a Notice', () => {
    expect(noticeOf('Rival: Kieran beat Gym 2 before you.')).toEqual({ head: 'Rival', text: 'Kieran beat Gym 2 before you.' });
    expect(noticeOf('Tip: Press L for the log.')).toEqual({ head: 'Tip', text: 'Press L for the log.' });
    expect(noticeOf('Saved the game')).toEqual({ head: 'Notice', text: 'Saved the game' });
    // A long lead-in or a lower-case start is not a head; a colon later in the head's line stays in the line.
    expect(noticeOf('your lead squeezes your hand: it feels braver').head).toBe('Notice');
    expect(noticeOf('This is a rather long sentence before a colon: and more').head).toBe('Notice');
    expect(noticeOf('Jet: Skål, raider! The storms bless you: Odin, Thor.')).toEqual({ head: 'Jet', text: 'Skål, raider! The storms bless you: Odin, Thor.' });
    expect(noticeOf('Egg:')).toEqual({ head: 'Notice', text: 'Egg:' });
  });

  it('times read as short words', () => {
    expect(agoWord(0)).toBe('just now');
    expect(agoWord(-500)).toBe('just now');
    expect(agoWord(9_999)).toBe('just now');
    expect(agoWord(10_000)).toBe('10 s ago');
    expect(agoWord(59_999)).toBe('59 s ago');
    expect(agoWord(60_000)).toBe('1 min ago');
    expect(agoWord(3_599_000)).toBe('59 min ago');
    expect(agoWord(7_200_000)).toBe('2 h ago');
  });

  it('nothing to show draws nothing at all', () => {
    expect(overlayView(ctx, model())).toBe('');
  });

  it('the notification stack sits at the top right; the newest is bright and the older ones fade back', () => {
    const html = overlayView(ctx, model({ notices: [{ id: 3, head: 'Egg', text: 'Your egg hatches in 2 stops.' }, { id: 2, head: 'Rival', text: 'Kieran beat Gym 2 before you.' }, { id: 1, head: 'Bond', text: 'Lucario trusts you more.' }] }));
    expect(html).toContain('right:20px;top:20px;width:330px;gap:8px');
    expect(count(html, 'data-act="notice"')).toBe(3);
    expect(html).toContain('<b class="acc" style="font-size:14px">Egg</b>');
    expect(html).toContain('<b class="" style="font-size:14px">Rival</b>');
    expect(html).toContain('opacity:1"');
    expect(html).toContain('opacity:0.8"');
    expect(html).toContain('opacity:0.6"');
    expect(html).toContain('data-arg="2"');
  });

  it('a toast shows its kicker and name; opened, it also says what it was for', () => {
    const toast = { id: 7, kicker: 'Achievement', title: 'First Mega Evolution', art: null, lines: ['Mega Evolve a Pokémon.  +50 credits', 'A milestone on your road.'], open: false };
    const shut = overlayView(ctx, model({ toasts: [toast] }));
    expect(shut).toContain('width:320px');
    expect(shut).toContain('padding:9px 14px');
    expect(shut).toContain('<span class="sm">Achievement</span><b class="acc">First Mega Evolution</b>');
    expect(shut).toContain('data-act="toast" data-arg="7"');
    expect(shut).not.toContain('+50 credits');
    const open = overlayView(ctx, model({ toasts: [{ ...toast, open: true }] }));
    expect(open).toContain('+50 credits');
    expect(open).toContain('A milestone on your road.');
  });

  it('toasts stand over the notices in one column', () => {
    const html = overlayView(ctx, model({ toasts: [{ id: 1, kicker: 'Achievement', title: 'T', art: null, lines: [], open: false }], notices: [{ id: 1, head: 'Egg', text: 'x' }] }));
    expect(html.indexOf('data-act="toast"')).toBeLessThan(html.indexOf('data-act="notice"'));
    expect(count(html, 'right:20px;top:20px')).toBe(1);
  });

  it('the interaction log is the mock-up window down the left side; empty, it says so; a click closes it', () => {
    const html = overlayView(ctx, model({ log: [{ text: 'Bought Potion × 2', when: 'just now' }, { text: 'Saved the game', when: '2 min ago' }] }));
    expect(html).toContain('left:20px;top:20px;bottom:20px;width:340px');
    expect(html).toContain('Interaction log');
    expect(html).toContain('Bought Potion × 2');
    expect(html).toContain('2 min ago');
    expect(html).toContain('data-act="log"');
    expect(overlayView(ctx, model({ log: [] }))).toContain(LOG_EMPTY);
  });

  it('a song caption sits at the bottom and never takes a click', () => {
    const html = overlayView(ctx, model({ caption: 'La la la' }));
    expect(html).toContain('♪ La la la ♪');
    expect(html).toContain('pointer-events:none');
    expect(html).not.toContain('data-act');
  });

  it('every word from the game is escaped', () => {
    const html = overlayView(ctx, model({ notices: [{ id: 1, head: '<b>h</b>', text: '<i>t</i>' }], toasts: [{ id: 1, kicker: '<u>k</u>', title: '<s>n</s>', art: null, lines: ['<em>l</em>'], open: true }], log: [{ text: '<p>x</p>', when: '<q>w</q>' }], caption: '<c>' }));
    for (const raw of ['<b>h</b>', '<i>t</i>', '<u>k</u>', '<s>n</s>', '<em>l</em>', '<p>x</p>', '<q>w</q>', '<c>']) expect(html).not.toContain(raw);
  });
});
