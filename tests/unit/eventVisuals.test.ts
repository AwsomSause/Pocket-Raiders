import { describe, expect, it } from 'vitest';
import { UIE_ARENAS } from '../../src/assets/catalog';
import { choiceKind } from '../../src/core/events';
import {
  allPictureIds, castInText, changeVisual, choiceVisual, eventVisual, familyPlaces, lineVisual, namedInText, outcomeBurst, PLACES, shotOf, wordsOf, type VisualContext, type VisualEvent,
} from '../../src/core/presentation/eventVisuals';
import { content } from './helpers';

// The event director reads an event's own words and data and decides its picture. It is pure, so every rule can
// be checked here, and the last block runs it over every event in the game (the "ALL events" check).

const ctx = (over: Partial<VisualContext> = {}): VisualContext => ({ period: 'afternoon', stageTypes: ['normal'], kinds: ['safe'], ...over });
const ev = (over: Partial<VisualEvent> = {}): VisualEvent => ({ id: 'test-event', name: 'A Quiet Moment', group: 'Test', intro: 'Nothing much happens.', scene: { cast: [], effect: 'none' }, ...over });

describe('event director: the place', () => {
  it('reads the place from the event’s own name first, then its text', () => {
    expect(eventVisual(ev({ name: 'The Market', intro: 'A road leads on.' }), ctx()).place).toBe('shop');
    expect(eventVisual(ev({ intro: 'The cave drips. Deeper in the cave, something moves in the tunnel.' }), ctx()).place).toBe('cave');
    const v = eventVisual(ev({ name: 'Lamp Street', intro: 'An alley at night, one lamp buzzing.' }), ctx());
    expect([v.place, v.placedBy, v.set, v.time]).toEqual(['city', 'words', 'skyline', 'night']);
  });
  it('falls back to the map stop, then the group, then the stage type, then the road', () => {
    expect(eventVisual(ev({ stop: 'delve' }), ctx())).toMatchObject({ place: 'cave', placedBy: 'stop' });
    expect(eventVisual(ev({ group: 'Fairground' }), ctx())).toMatchObject({ place: 'fair', placedBy: 'group' });
    expect(eventVisual(ev(), ctx({ stageTypes: ['ice'] }))).toMatchObject({ place: 'snow', placedBy: 'stage' });
    expect(eventVisual(ev(), ctx({ stageTypes: [] }))).toMatchObject({ place: 'route', placedBy: 'default' });
    // One stray word loses to the stop, but two of the event's own words win.
    expect(eventVisual(ev({ stop: 'delve', intro: 'You think of the sea.' }), ctx()).place).toBe('cave');
    expect(eventVisual(ev({ stop: 'delve', intro: 'The ship rocks at the dock.' }), ctx()).place).toBe('sea');
  });
  it('asks only for pictures the asset catalog has, the hour’s picture first', () => {
    for (const id of allPictureIds()) expect(UIE_ARENAS, id).toContain(id.replace('bg.uie.', ''));
    const night = eventVisual(ev({ name: 'The Lake' }), ctx({ period: 'night' }));
    expect(night.pictures.slice(0, 2)).toEqual(['bg.uie.lake_night', 'bg.uie.lake']);
    expect(eventVisual(ev({ name: 'The Lake' }), ctx()).pictures[0]).toBe('bg.uie.lake');
    // A drawn place asks for no picture.
    expect(eventVisual(ev({ name: 'The Old Temple' }), ctx())).toMatchObject({ set: 'ruins', pictures: [] });
  });
  it('is the same picture for the same event, and a different one for another event', () => {
    const a = eventVisual(ev({ id: 'a' }), ctx()), b = eventVisual(ev({ id: 'b' }), ctx());
    expect(eventVisual(ev({ id: 'a' }), ctx())).toEqual(a);
    expect(a.seed).not.toBe(b.seed);
    expect(a.signature).not.toBe(b.signature);
    expect(a.sigil).toBeGreaterThanOrEqual(0);
    expect(a.sigil).toBeLessThan(1 << 15);
  });
});

describe('event director: words that mislead, and storylines', () => {
  it('a hyphenated name counts as its parts: Poli-Pond is at a pond, whatever show is put on', () => {
    const v = eventVisual(ev({ name: 'Poli-Pond: The Little Pokémon That Could', intro: 'The reeds shake. A Poliwag is shoved out of them. It puts on a show of not minding.' }), ctx());
    expect(v.place).toBe('lake');
    expect(wordsOf('Poli-Pond')).toEqual(['poli-pond', 'poli', 'pond']);
  });
  it('a weak word alone does not say where an event is: it loses to the storyline, and only beats the stage', () => {
    const dance = ev({ name: 'The Dance', intro: 'The ring turns. One of them spins too fast and sits down hard.' });
    expect(eventVisual(dance, ctx({ stageTypes: ['fire'], family: 'mountain' }))).toMatchObject({ place: 'mountain', placedBy: 'family' });
    expect(eventVisual(dance, ctx({ stageTypes: ['fire'] })).place).toBe('gym');
    // An item's or a move's name is not a place.
    for (const name of ['Ice Stone', 'TM Surf', 'Dream Ball', 'A Ghost of a Chance']) expect(eventVisual(ev({ name, intro: 'She weighs it and nods.' }), ctx({ family: 'shop' })).place, name).toBe('shop');
    // Beside a surer word, or a second weak word for the same place, it counts.
    expect(eventVisual(ev({ intro: 'The referee waves you into the ring.' }), ctx({ family: 'mountain' })).place).toBe('gym');
    expect(eventVisual(ev({ intro: 'A booth at the edge of the stage.' }), ctx({ family: 'mountain' })).place).toBe('fair');
  });
  it('an event with no place words stands where its storyline does, before the stage decides', () => {
    const lands = ev({ id: 'sky.join.fearow', name: 'Fearow Lands', intro: 'Fearow lands beside you with its crest low.' });
    expect(eventVisual(lands, ctx({ stageTypes: ['fire'] }))).toMatchObject({ place: 'volcano', placedBy: 'stage' });
    expect(eventVisual(lands, ctx({ stageTypes: ['fire'], family: 'forest' }))).toMatchObject({ place: 'forest', placedBy: 'family' });
    // Its own words, its stop and its group still come first.
    expect(eventVisual(ev({ name: 'The Lighthouse', intro: 'A harbour at dusk, ships at the pier.' }), ctx({ family: 'forest' })).place).toBe('sea');
    expect(eventVisual(ev({ stop: 'shrine' }), ctx({ family: 'forest' })).place).toBe('ruins');
    expect(eventVisual(ev({ group: 'Camp' }), ctx({ family: 'forest' })).place).toBe('camp');
  });
  const e = (id: string, name: string, intro = ''): { id: string; name: string; intro: string } => ({ id, name, intro });
  it('a storyline is set where its opening event is, or where more of its events are than anywhere else', () => {
    const places = familyPlaces([
      e('mt-04-door', 'Mt. Moon', 'The mountain path climbs.'), e('mt-04-dance', 'The Dance', 'The ring turns.'), e('mt-04-mine', 'The Gem-Stone Mine', 'Ore in the quarry wall.'),
      e('bird.opening', 'Resolve', 'Two birds fight over one branch.'), e('bird.finale', 'High Wind', 'A cliff, a ledge, a summit.'), e('bird.rematch', 'Again', 'On the cliff, by the ridge.'), e('bird.join', 'It Lands', 'It lands beside you.'),
      e('lone-event', 'Alone', 'Nothing here.'),
    ]);
    expect(places.get('mt-04-dance')).toBe('mountain');
    expect(places.get('mt-04-mine')).toBe('mountain');
    expect(places.get('bird.join')).toBe('mountain');
    expect(places.has('lone-event')).toBe(false);
  });
  it('an opening with one word is the last guess; ids that only look alike are not one storyline; a whole pack is not a storyline', () => {
    const guess = familyPlaces([e('owl.opening', 'Resolve', 'Two birds fight over one branch.'), e('owl.join', 'It Lands', 'It lands beside you.')]);
    expect(guess.get('owl.join')).toBe('forest');
    const apart = familyPlaces([e('sky.opening', 'The Harbour', 'Ships at the pier.'), e('sky.join', 'It Lands', ''), e('sky-pillar', 'Up', ''), e('sky-other', 'Down', '')]);
    expect(apart.get('sky.join')).toBe('sea');
    expect(apart.has('sky-pillar')).toBe(false);
    const pack = familyPlaces([e('big-door', 'The Forest', 'Trees.'), ...Array.from({ length: 45 }, (_, i) => e(`big-${i}`, 'Something', ''))]);
    expect(pack.has('big-7')).toBe(false);
    // The longest shared start wins: a wing of a pack is still a storyline.
    const wing = familyPlaces([e('big-door', 'The Forest', 'Trees.'), ...Array.from({ length: 45 }, (_, i) => e(`big-${i}`, 'Something', '')), e('big-pike-door', 'The Battle Tower', 'A castle hall.'), e('big-pike-1', 'Room 1', '')]);
    expect(wing.get('big-pike-1')).toBe('hall');
  });
  it('in the game: Poli-Pond opens at the pond, Pidgey’s Resolve is never in a volcano, the Clefairy dance is on Mt. Moon', () => {
    const all = [...content.events.values()], families = familyPlaces(all);
    const at = (id: string) => { const x = content.events.get(id)!; return eventVisual(x, { period: 'afternoon', stageTypes: ['fire'], kinds: [], family: families.get(id) }).place; };
    expect(at('pp-cold-open')).toBe('lake');
    for (const x of all.filter((y) => y.id.startsWith('sky.'))) expect(at(x.id), x.id).not.toBe('volcano');
    expect(at('gn-04-dance-1')).toBe('mountain');
    expect(at('gn-05-hall-damian')).toBe('gym');
    expect(at('gn-42-pike-3')).toBe('hall');
  });
});

describe('event director: hour, mood, weather', () => {
  it('takes the hour from the text, else from the run’s clock; a graveyard is always at night', () => {
    expect(eventVisual(ev({ intro: 'The sunset is red.' }), ctx()).time).toBe('eve');
    expect(eventVisual(ev(), ctx({ period: 'evening' })).time).toBe('eve');
    expect(eventVisual(ev(), ctx({ period: 'morning' })).time).toBe('day');
    expect(eventVisual(ev({ name: 'The Graveyard' }), ctx({ period: 'morning' })).time).toBe('night');
  });
  it('reads the mood from the words, the choices and the rarity', () => {
    expect(eventVisual(ev(), ctx()).mood).toBe('calm');
    expect(eventVisual(ev({ intro: 'She smiles and thanks you, a friend at last.' }), ctx()).mood).toBe('warm');
    expect(eventVisual(ev(), ctx({ kinds: ['battle', 'safe'] })).mood).toBe('tense');
    expect(eventVisual(ev({ rarity: 'legendary' }), ctx()).mood).toBe('grand');
    expect(eventVisual(ev({ intro: 'It has been crying, alone, lost.' }), ctx()).mood).toBe('sad');
  });
  it('keeps the event’s own effect: weather fills the view, a stir moves the subject', () => {
    expect(eventVisual(ev({ scene: { cast: [], effect: 'rain' } }), ctx())).toMatchObject({ weather: 'rain', stir: null });
    expect(eventVisual(ev({ scene: { cast: [], effect: 'float' } }), ctx())).toMatchObject({ weather: null, stir: 'float' });
    // Weather the text names shows too, but it does not rain indoors.
    expect(eventVisual(ev({ intro: 'Rain on the road.' }), ctx()).weather).toBe('rain');
    expect(eventVisual(ev({ name: 'The Kitchen', intro: 'Rain on the window.' }), ctx()).weather).toBeNull();
    expect(eventVisual(ev({ scene: { cast: [], effect: 'snow' } }), ctx()).motes).toBe('flakes');
  });
  it('does not break on an event with nothing to read', () => {
    const v = eventVisual({ id: '', name: '', group: '', intro: '' }, ctx({ stageTypes: [], kinds: [] }));
    expect(v).toMatchObject({ place: 'route', mood: 'calm', weather: null, stir: null });
    expect(wordsOf('')).toEqual([]);
    expect(eventVisual(ev({ intro: '<b>¡¿?!</b> 12345 ₽₽₽' }), ctx()).place).toBe('route');
  });
});

describe('event director: the shot', () => {
  const calm = { mood: 'calm', place: 'route' } as const;
  it('frames the scene by who is in it and what is on offer', () => {
    expect(shotOf(calm, 1, false, ['safe'])).toBe('talk');
    expect(shotOf(calm, 0, true, ['safe'])).toBe('moment');
    expect(shotOf(calm, 0, false, ['safe'])).toBe('vista');
    expect(shotOf({ mood: 'tense', place: 'route' }, 1, false, ['battle', 'safe'])).toBe('clash');
    expect(shotOf(calm, 1, false, ['battle'])).toBe('clash');
    expect(shotOf(calm, 1, false, ['trade', 'safe'])).toBe('deal');
    expect(shotOf({ mood: 'calm', place: 'shop' }, 0, false, ['safe'])).toBe('deal');
    expect(shotOf(calm, 0, false, [])).toBe('vista');
  });
});

describe('choices: icon, tone and odds from what the card shows', () => {
  const c = (label: string, over: Partial<Parameters<typeof choiceVisual>[0]> = {}) => choiceVisual({ label, kind: 'safe', locked: false, chance: null, ...over });
  it('a kind the card shows wins over the words', () => {
    expect(c('Accept.', { kind: 'battle' })).toMatchObject({ icon: 'battle', tone: 'danger' });
    expect(c('Hand it over.', { kind: 'trade' })).toMatchObject({ icon: 'trade', tone: 'deal' });
    expect(c('Sure.', { kind: 'cost' })).toMatchObject({ icon: 'coin', tone: 'deal' });
    expect(c('Anything', { locked: true, kind: 'battle' })).toMatchObject({ icon: 'lock', tone: 'shut' });
  });
  it('reads the deed from the label', () => {
    expect(c('Leave.')).toMatchObject({ icon: 'leave', tone: 'away' });
    expect(c('Decline.').icon).toBe('leave');
    expect(c('Help it up.')).toMatchObject({ icon: 'care', tone: 'kind' });
    expect(c('Take the ball.').icon).toBe('take');
    expect(c('Search the shelves.')).toMatchObject({ icon: 'look', tone: 'curious' });
    expect(c('How bad is it for me?').icon).toBe('talk');
    expect(c('"Learn it."').icon).toBe('train');
    expect(c('Rest a while.').icon).toBe('rest');
    expect(c('Climb the wall.').icon).toBe('go');
    expect(c('Catch it.').icon).toBe('catch');
    expect(c('A kite.').icon).toBe('pick');
    expect(c('Roll.', { kind: 'chance', chance: 0.5 })).toMatchObject({ icon: 'dice', tone: 'luck', odds: 50 });
  });
  it('shows the odds as a 0–100 meter and never out of range', () => {
    expect(c('Try.', { chance: 0.7 }).odds).toBe(70);
    expect(c('Try.', { chance: 1.4 }).odds).toBe(100);
    expect(c('Try.', { chance: -1 }).odds).toBe(0);
    expect(c('Try.').odds).toBeNull();
    expect(c('').icon).toBe('pick');
  });
});

describe('text: how a line is said', () => {
  it('hears a shout, a whisper and a trailing line', () => {
    expect(lineVisual('GET OUT!!').voice).toBe('shout');
    expect(lineVisual('Run!').voice).toBe('shout');
    expect(lineVisual('(She does not look up.)').voice).toBe('whisper');
    expect(lineVisual('I thought you were…').voice).toBe('trail');
    expect(lineVisual('A small Pokémon Center.')).toEqual({ voice: 'plain', emote: null });
  });
  it('puts a mark over the speaker for what the line does', () => {
    expect(lineVisual('It has been crying.').emote).toBe('teardrop');
    expect(lineVisual('He laughs.').emote).toBe('smile');
    expect(lineVisual('What?!').emote).toBe('exclaim_question');
    expect(lineVisual('Who are you?').emote).toBe('question');
    expect(lineVisual('Stop!').emote).toBe('exclamation');
    expect(lineVisual('').emote).toBeNull();
  });
});

describe('outcomes: what each line is about and the one big reaction', () => {
  it('sorts a change line by what it is about, and good from bad', () => {
    expect(changeVisual('+₽300')).toEqual({ kind: 'money', good: true });
    expect(changeVisual('−₽300')).toEqual({ kind: 'money', good: false });
    expect(changeVisual('Charisma +2')).toEqual({ kind: 'stat', good: true });
    expect(changeVisual('Charisma −2')).toEqual({ kind: 'stat', good: false });
    expect(changeVisual('Potion ×2')).toEqual({ kind: 'item', good: true });
    expect(changeVisual('Lost Potion ×2').good).toBe(false);
    expect(changeVisual('Pikachu joined the party').kind).toBe('join');
    expect(changeVisual('Party healed').kind).toBe('heal');
    expect(changeVisual('Lead loses 20 HP')).toEqual({ kind: 'hurt', good: false });
    expect(changeVisual('Traded Rattata for Farfetch’d').kind).toBe('trade');
    expect(changeVisual('Evil +1')).toEqual({ kind: 'evil', good: false });
    expect(changeVisual('')).toEqual({ kind: 'note', good: true });
  });
  it('picks one reaction: a battle, a failure, or the change that matters most', () => {
    expect(outcomeBurst(['+₽300'], true, true)).toBe('battle');
    expect(outcomeBurst(['Pikachu joined the party', '+₽300'], true, false)).toBe('join');
    expect(outcomeBurst(['Lead loses 20 HP'], true, false)).toBe('hurt');
    expect(outcomeBurst([], false, false)).toBe('fail');
    expect(outcomeBurst(['Party healed'], true, false)).toBe('heal');
    expect(outcomeBurst(['+₽300'], true, false)).toBe('gold');
    expect(outcomeBurst(['Potion ×2'], true, false)).toBe('gift');
    expect(outcomeBurst([], true, false)).toBe('none');
    expect(outcomeBurst(['Charisma −2'], true, false)).toBe('fail');
  });
});

describe('who the text names', () => {
  it('finds people by their trade, in the order they are named', () => {
    expect(castInText('A Hiker blocks the path. A fisherman watches.')).toEqual(['trainer.hiker', 'trainer.fisherman']);
    expect(castInText('Three hikers and a hiker.')).toEqual(['trainer.hiker']);
    expect(castInText('Nobody is here.')).toEqual([]);
    expect(castInText('A nurse, a baker and an artist.', 2)).toHaveLength(2);
  });
  it('finds names only as whole capitalised words, the longest name first', () => {
    const index = new Map([['ditto', 'ditto'], ['mr. mime', 'mr-mime'], ['mime', 'mime-jr'], ['rare candy', 'rare-candy'], ['candy', 'candy'], ['eevee', 'eevee']]);
    expect(namedInText('The second Eevee lives behind a stall.', index)).toEqual(['eevee']);
    expect(namedInText('He said ditto, and left.', index)).toEqual([]);
    expect(namedInText('A Rare Candy on the desk.', index)).toEqual(['rare-candy']);
    expect(namedInText('Eevee’s bowl. Then Ditto. Then Eevee again.', index, 3)).toEqual(['eevee', 'ditto']);
    expect(namedInText('Eevee, Ditto, Candy.', index, 2)).toHaveLength(2);
    expect(namedInText('', index)).toEqual([]);
  });
});

describe('ALL events get the new look', () => {
  const events = [...content.events.values()];
  const periods = ['morning', 'afternoon', 'evening', 'night'] as const;
  const families = familyPlaces(events);
  const looks = events.map((e, i) => {
    const kinds = e.choices.map((c) => choiceKind(c, c.chance ?? null));
    return { e, kinds, v: eventVisual(e, { period: periods[i % 4]!, stageTypes: [(e.types?.[0] ?? 'normal').toLowerCase()], kinds, family: families.get(e.id) }) };
  });
  it('every event resolves to a place, an hour, a mood and a way to draw it', () => {
    expect(events.length).toBeGreaterThan(8000);
    const arenas = new Set(UIE_ARENAS);
    const broken: string[] = [];
    for (const { e, v } of looks) {
      const def = PLACES[v.place];
      const ok = def !== undefined && ['day', 'eve', 'night'].includes(v.time) && v.mood.length > 0 && v.set.length > 0 && v.pictures.every((p) => arenas.has(p.replace('bg.uie.', ''))) && (v.pictures.length > 0 || def.pics.length === 0);
      if (!ok) broken.push(e.id);
    }
    expect(broken).toEqual([]);
  });
  it('no two events share a picture: every seed and signature is its own', () => {
    expect(new Set(looks.map((x) => x.v.seed)).size).toBe(events.length);
    expect(new Set(looks.map((x) => x.v.signature)).size).toBe(events.length);
  });
  it('every choice of every event gets an icon and a tone', () => {
    let n = 0, plain = 0;
    for (const { e, kinds } of looks) e.choices.forEach((c, i) => {
      const v = choiceVisual({ label: c.label, kind: kinds[i]!, locked: false, chance: c.chance ?? null });
      expect(v.icon.length).toBeGreaterThan(0);
      expect(v.tone.length).toBeGreaterThan(0);
      n += 1;
      if (v.icon === 'star') plain += 1;
    });
    expect(n).toBeGreaterThan(19000);
    // The plain star is the fallback; most choices say what kind of deed they are.
    expect(plain / n).toBeLessThan(0.1);
  });
  it('most events are placed by their own words, and the places are spread wide', () => {
    const by = (k: string) => looks.filter((x) => x.v.placedBy === k).length;
    expect(by('words') / events.length).toBeGreaterThan(0.55);
    const used = new Set(looks.map((x) => x.v.place));
    expect(used.size).toBe(Object.keys(PLACES).length);
    const biggest = Math.max(...[...used].map((p) => looks.filter((x) => x.v.place === p).length));
    expect(biggest / events.length).toBeLessThan(0.3);
  });
});
