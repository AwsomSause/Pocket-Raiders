import { afterEach, describe, expect, it } from 'vitest';
import { crumbHtml, PAUSE_RING, ringNeighbours, ringPage, ringStep, setRing, setRingTrail } from '../../src/ui/pauseRing';

// The Phantom pause ring (the mock-ups' crumb): where a pause page is, and the pages Q and E turn to.

afterEach(() => setRing(null));

describe('pause ring', () => {
  it('runs Party, Bag, Pokédex, Trainer card, Save, Settings and wraps at both ends', () => {
    expect(PAUSE_RING).toEqual(['Party', 'Bag', 'Pokédex', 'Trainer card', 'Save', 'Settings']);
    expect(ringNeighbours('Party')).toEqual(['Settings', 'Bag']);
    expect(ringNeighbours('Settings')).toEqual(['Save', 'Party']);
  });

  it('draws the crumb with its keys, as the mock-ups do, and nothing off the ring', () => {
    expect(crumbHtml()).toBe('');
    setRing({ page: 'Party', trail: [], go: () => {} });
    expect(crumbHtml()).toBe('<nav class="crumb" aria-label="where you are"><span>Pause</span><b>Party</b><em><kbd>Q</kbd>Settings<i>·</i>Bag<kbd>E</kbd></em></nav>');
  });

  it('shows a deeper step and drops the keys while the page uses Q and E itself', () => {
    let busy = false;
    setRing({ page: 'Settings', trail: [], go: () => {}, busy: () => busy });
    setRingTrail(['Access']);
    busy = true;
    expect(crumbHtml()).toBe('<nav class="crumb" aria-label="where you are"><span>Pause</span><span>Settings</span><b>Access</b></nav>');
  });

  it('Q and E ask the owner for the page before and after', () => {
    const asked: string[] = [];
    setRing({ page: 'Bag', trail: [], go: (to) => asked.push(to) });
    ringStep(1);
    ringStep(-1);
    expect(asked).toEqual(['Pokédex', 'Party']);
    expect(ringPage()).toBe('Bag');
    setRing(null);
    ringStep(1);
    expect(asked).toHaveLength(2);
  });
});
