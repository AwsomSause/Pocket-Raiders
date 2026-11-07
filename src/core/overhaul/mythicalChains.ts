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
  { id: 'arceus', title: 'The Thousand Arms', species: 'arceus', types: ['normal'],
    clue: ['A plate of old stone lies half-buried, carved with a circle of sixteen marks.', 'Brush it clean', 'Leave it buried'],
    trial: ['Sixteen pedestals ring a dark hall. A voice asks what you bring to the beginning.', 'Bring your whole team', 'Bring only yourself', 'The hall lights one pedestal at a time. Something vast notices you.', 'The hall stays dark. The echo says nothing.'],
    meet: 'The air goes still. A pale figure with a golden wheel descends.' },
  { id: 'genesect', title: 'Relic of the Lab', species: 'genesect', types: ['bug', 'steel'],
    clue: ['A cracked cryo-pod in an abandoned lab hums softly, and a cannon barrel twitches inside.', 'Reboot the pod', 'Seal the pod'],
    trial: ['A console asks for a command before the pod fully wakes.', 'Enter a peaceful command', 'Enter an attack command', 'The pod powers up quietly and a pair of eyes blink.', 'Alarms blare. The pod shuts down for good.'],
    meet: 'The pod opens. An ancient machine-bug unfolds and aims at you.' },
  { id: 'magearna', title: 'The Clockwork Heart', species: 'magearna', types: ['steel', 'fairy'],
    clue: ['A soul-heart shaped music box ticks in a crumbling castle hall.', 'Wind the box', 'Carry it off'],
    trial: ['Three tiny doors in the box each wait for a gear. Only one fits.', 'Set the small silver gear', 'Force the big gear', 'The gears mesh and a chime rings through the castle.', 'The box jams. The ticking stops.'],
    meet: 'Armor clicks open. A small artificial Pokémon bows politely.' },
  { id: 'volcanion', title: 'Steam Behind the Crater', species: 'volcanion', types: ['fire', 'water'],
    clue: ['A plume of hot steam rises from a hidden spring and drifts toward you.', 'Follow the steam', 'Keep your distance'],
    trial: ['The spring boils over. A steam cannon in the rocks is aimed at the sky.', 'Cool the spring with water', 'Cap the cannon', 'The spring settles and the steam sighs out.', 'The cannon backfires. The steam thickens into a fog.'],
    meet: 'The fog parts. A hulking steam Pokémon stomps out.' },
  { id: 'keldeo', title: 'The Colt by the Falls', species: 'keldeo', types: ['water', 'fighting'],
    clue: ['Hoofprints on the wet stone lead behind a waterfall, and something young whinnies.', 'Follow the hoofprints', 'Call out'],
    trial: ['Three old swordsmen statues guard the pool. Each holds a different stance.', 'Mirror the calm stance', 'Mirror the fierce stance', 'The pool ripples and the water bows to you.', 'The statues crack. The hoofprints wash away.'],
    meet: 'A young colt leaps from the falls, ready to prove itself.' },
  { id: 'meltan', title: 'The Little Nut', species: 'meltan', types: ['steel'],
    clue: ['A tiny bolt-shaped creature gnaws on a rusty hinge near your campfire.', 'Share a snack', 'Shoo it away'],
    trial: ['The tiny creature leads you to a pile of scrap and waits.', 'Hand over a spare bolt', 'Pick the best scrap yourself', 'It gulps happily and does a spin.', 'It droops and rolls off, disappointed.'],
    meet: 'It hops out of the scrap pile and asks for a battle.' },
  { id: 'zarude', title: 'Vines of the Deep Jungle', species: 'zarude', types: ['dark', 'grass'],
    clue: ['A thick vine swings across your path and a chittering pack sits high in the trees.', 'Wave to them', 'Cut the vine'],
    trial: ['A pack of apes throws fruit and watches how you react.', 'Catch the fruit gently', 'Throw it back', 'They hoot and a bigger shape drops down to the ground.', 'They scatter into the canopy and you lose the trail.'],
    meet: 'The leader of the pack lands in front of you and beats its chest.' },
  { id: 'pecharunt', title: 'A Gift With Strings', species: 'pecharunt', types: ['poison', 'ghost'],
    clue: ['A sweet-smelling peach sits on a roadside shrine, and a thin purple ribbon trails off it.', 'Taste the peach', 'Leave it alone'],
    trial: ['A soft voice offers a deal: three wishes for a small favour.', 'Politely refuse', 'Accept the deal', 'The voice laughs, surprised and impressed.', 'The ribbon tightens. The voice goes quiet and satisfied.'],
    meet: 'A smiling little Pokémon with a cunning look steps out of the shadow.' },
  { id: 'darkrai', title: 'The Long Night', species: 'darkrai', types: ['dark'],
    clue: ['Everyone in camp falls asleep at once, and the moon is gone from the sky.', 'Stay awake and watch', 'Sleep as well'],
    trial: ['A figure at the edge of the camp whispers a question about your nightmares.', 'Tell it the truth', 'Make something up', 'It listens and the dark lifts a little.', 'The dark thickens. The figure fades.'],
    meet: 'The shadow takes shape: a tall figure with a white mane.' },
  { id: 'phione', title: 'Drifting in Warm Water', species: 'phione', types: ['water'],
    clue: ['A tiny bubble-like Pokémon floats on the tide, bobbing along without a plan.', 'Wade out gently', 'Splash it away'],
    trial: ['The tide pulls the little one toward a strong current.', 'Swim after it', 'Call it back', 'You catch it and it giggles in the bubbles.', 'The current carries it out of sight.'],
    meet: 'It bobs back to the shore and waits for a game.' },
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
