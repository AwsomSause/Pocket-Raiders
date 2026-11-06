// Mythical quest chains: the pack has none, so these are our own. Each is 3 map events (a clue, a trial, the meeting).
// Same shape as the pack chains (chains.ts): a later stage only appears once you took the continuing option of the one
// before. Only one Mythical chain can start per run (flag `ovc-mythic`), none before `minStage`. The trial (stage 2)
// has one right answer; picking the other ends the quest. The last stage is a catchable wild battle.
// Pure: no RNG, no run state.

type Raw = Record<string, unknown>;

export interface MythicalChainsConfig { enabled: boolean; minStage: number }
export const DEFAULT_MYTHICAL_CHAINS: MythicalChainsConfig = { enabled: true, minStage: 9 };

interface Quest { id: string; title: string; species: string; types: string[]; clue: [string, string, string]; trial: [string, string, string, string, string]; meet: string }

export const MYTHICAL_QUESTS: Quest[] = [
  { id: 'mew', title: 'The Playful Shadow', species: 'mew', types: ['psychic', 'normal'],
    clue: ['Something small and pink keeps darting behind your party, just out of sight.', 'Play along', 'Look away'],
    trial: ['A ring of floating pebbles spins in a clearing. One of them is not a pebble.', 'Pick the one that blinks', 'Pick the biggest one', 'Fine, you play: the pebbles settle and a giggle echoes.', 'Wrong pebble. The giggling fades.'],
    meet: 'The shadow stops, turns, and floats up to meet your eyes.' },
  { id: 'celebi', title: 'Echo of the Old Forest', species: 'celebi', types: ['grass'],
    clue: ['A tree you passed an hour ago is a sapling again, and a green sparkle hangs above it.', 'Follow the sparkle', 'Hurry on'],
    trial: ['A stone shrine is overgrown with moss. Three offerings fit its bowl.', 'Offer a berry', 'Offer coins', 'The moss glows and the bowl fills with dew.', 'The coins sink out of sight. The shrine stays dark.'],
    meet: 'Time folds. A small green figure laughs from the branches.' },
  { id: 'jirachi', title: 'A Wish Under Stars', species: 'jirachi', types: ['steel', 'psychic'],
    clue: ['A comet drifts overhead and a tiny paper strip lands in your hand: "Wish for others."', 'Keep the strip', 'Toss it away'],
    trial: ['Under the stars a sleepy voice asks: what do you wish for?', 'Wish for the team', 'Wish for riches', 'The stars blink twice, pleased.', 'The stars go dim. Nothing answers.'],
    meet: 'Seven nights pass in a heartbeat. A small star-shaped Pokémon wakes up.' },
  { id: 'deoxys', title: 'Signal From the Meteor', species: 'deoxys', types: ['psychic'],
    clue: ['A faint repeating signal hums from a crater that was not there yesterday.', 'Trace the signal', 'Ignore it'],
    trial: ['The crater hums a pattern: long, short, long. A panel waits for your answer.', 'Repeat the pattern', 'Break the panel', 'The crater glows and answers back.', 'The panel sparks and goes dead.'],
    meet: 'A crystal core unfolds into a shape that studies you.' },
  { id: 'manaphy', title: 'The Sea\'s Little Egg', species: 'manaphy', types: ['water'],
    clue: ['A drifting egg rocks gently in the tide pools, singing in quiet pings.', 'Guard the egg', 'Take it for yourself'],
    trial: ['A great wave looms. The egg trembles against your hands.', 'Shield it with your team', 'Run for high ground', 'The wave parts around you and the egg hums happily.', 'You run. The sea takes the egg back.'],
    meet: 'The egg cracks open. The sea calls a child home.' },
  { id: 'victini', title: 'Victory\'s Spark', species: 'victini', types: ['fire', 'psychic'],
    clue: ['An old trophy case in a ruined arena is warm to the touch, and a flame flickers inside.', 'Polish the trophy', 'Walk past'],
    trial: ['An empty arena cheers for nobody. A voice asks: do you win for glory or for the team?', 'For the team', 'For glory', 'The cheers swell and the flame leaps.', 'The cheers die. The flame goes out.'],
    meet: 'Victory itself bounds out of the flame and challenges you.' },
  { id: 'shaymin', title: 'Gratitude Garden', species: 'shaymin', types: ['grass'],
    clue: ['A field of flowers blooms out of season, and one hedgehog-shaped bush follows you.', 'Water the flowers', 'Pick the flowers'],
    trial: ['The flowers wilt in the heat. A wilted petal points to a spring far off.', 'Carry water back', 'Rest in the shade', 'The field bursts into pink and white.', 'The field wilts. The bush slips away.'],
    meet: 'The hedgehog bush shakes loose its petals and faces you.' },
  { id: 'meloetta', title: 'The Lost Melody', species: 'meloetta', types: ['normal', 'psychic'],
    clue: ['A music box in a roadside stall plays half a song, and a soft voice finishes it from nowhere.', 'Hum along', 'Mute the box'],
    trial: ['The voice asks you to finish the tune. It has three notes left.', 'Sing it softly', 'Sing it loud', 'The tune completes. Applause drifts out of the trees.', 'Your voice cracks the melody. The music box falls silent.'],
    meet: 'A graceful dancer steps out of the sound and bows.' },
  { id: 'diancie', title: 'The Jewel in the Cave', species: 'diancie', types: ['rock', 'fairy'],
    clue: ['A pink glint in a cave wall pulses in time with your heartbeat.', 'Chip it free carefully', 'Smash it open'],
    trial: ['The crystals around the glint hum. One pure note would wake it.', 'Tap them in turn', 'Hammer them all', 'The cave sings a chord and the wall shimmers.', 'Cracks run through the cave. The glint is gone.'],
    meet: 'The crystal peels back. A shy jewel Pokémon looks up.' },
  { id: 'hoopa', title: 'Rings of Mischief', species: 'hoopa', types: ['psychic', 'ghost'],
    clue: ['A golden ring hangs in the air. Your hand goes through, and comes out holding a stolen snack.', 'Follow through the ring', 'Throw the snack back'],
    trial: ['Three rings float side by side. Giggles echo from one of them.', 'Step through the giggling one', 'Step through the quiet one', 'You tumble out to cheerful applause.', 'You land in the same spot, and the rings pop.'],
    meet: 'A mischievous Pokémon sits on a ring and dares you to catch it.' },
  { id: 'marshadow', title: 'Shadow Without a Body', species: 'marshadow', types: ['ghost', 'fighting'],
    clue: ['Your shadow throws a punch that you did not throw.', 'Mirror its moves', 'Step on it'],
    trial: ['At dusk your shadow stands apart and takes a stance, waiting.', 'Spar with it', 'Flee into the light', 'It nods in respect and the stance eases.', 'The shadow slumps and slides away.'],
    meet: 'The shadow steps free and puts up its fists.' },
  { id: 'zeraora', title: 'Thunder on the Ridge', species: 'zeraora', types: ['electric'],
    clue: ['A streak of lightning crosses the ground, not the sky, and stops at your feet.', 'Chase the streak', 'Take cover'],
    trial: ['A ridge crackles with static. A set of claw marks leads along it.', 'Race the marks', 'Wait it out', 'You match its pace, and the air snaps in approval.', 'The ridge goes quiet. The marks fade.'],
    meet: 'A blur stops on the cliff edge and bares its claws, smiling.' },
];

export function mythicalChainEvents(config: MythicalChainsConfig = DEFAULT_MYTHICAL_CHAINS): Raw[] {
  const events: Raw[] = [];
  for (const q of MYTHICAL_QUESTS) {
    const k = (n: number) => `ovm-${q.id}-${n}`;
    const flag = (key: string) => ({ kind: 'flag', key, amount: 1 });
    const base = { group: 'Overhaul chains', stop: 'event', rarity: 'epic', types: q.types, minStage: config.minStage };
    events.push({
      ...base, id: `ovm-${q.id}-s1`, name: q.title, requires: [{ kind: 'flag', key: 'ovc-mythic', atMost: 0 }], callback: false, intro: q.clue[0],
      choices: [
        { label: q.clue[1], requires: [], success: { text: 'You sense something watching.', effects: [flag('ovc-mythic'), flag(k(1))] } },
        { label: q.clue[2], requires: [], success: { text: 'Nothing comes of it.', effects: [] } },
      ],
    });
    events.push({
      ...base, id: `ovm-${q.id}-s2`, name: q.title, requires: [{ kind: 'flag', key: k(1) }], callback: true, intro: q.trial[0],
      choices: [
        { label: q.trial[1], requires: [], success: { text: q.trial[3], effects: [flag(k(2)), { kind: 'friendship', amount: 4, who: 'party' }] } },
        { label: q.trial[2], requires: [], success: { text: q.trial[4], effects: [] } },
      ],
    });
    events.push({
      ...base, id: `ovm-${q.id}-s3`, name: q.title, requires: [{ kind: 'flag', key: k(2) }], callback: true, intro: q.meet,
      choices: [
        { label: 'Meet it', requires: [], success: { text: 'It steps forward.', effects: [], battle: { kind: 'wild', species: [q.species], levelBonus: 5, win: [] } } },
        { label: 'Step back', requires: [], success: { text: 'It watches you leave.', effects: [] } },
      ],
    });
  }
  return events;
}
