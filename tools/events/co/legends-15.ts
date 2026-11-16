// Catalog Overhaul Pack, legends row C (batch 5): the Shadow chain, the Reputation readout and the Rivalry-week rival.
// Rules (CATALOG_INDEX.md, rules/08_villains.js, 12_setpieces.js, 18_calendar.js):
// - "The Shadow chain stays and plugs into the pack's Shadow system (Reclaim, purification, the Lieutenant)." The nine `shadow-*`
//   events now feed the Shadow world (shadow-activity, shadow-outbreak, lieutenant-loose: core/shadowWorld/world.ts), soothe and
//   purify real Shadow Pokémon (shadowHeart, purifyShadow: core/co/shadowChain.ts), and Reclaim: a Shadow left at the Sanctuary comes
//   back purified (sendAway / bringBack). Shadow Triad merges into the Plasma storyline (only when Team Plasma hunts you).
//   Never forced: every Shadow Pokémon is offered with the accept prompt, and the Sanctuary will always take one in instead.
// - "Reputation readout." karma-echo reads the run's record back to the player (core/events/coToolkit.ts recordOf; rivals/reputation.ts).
// - Rivalry weeks: "the rival appears in every Pseudo Stage" (co-week-rival, placed by core/co/weeks.ts rivalInPseudo).
import { $, ch, ev, fight, flag, fr, good, heal, hurt, item, leave, lv, out, rage, reveal, rp, type Json } from '../dsl.ts';
import { rival } from './_rivals.ts';

export const CATEGORY = 'legends';

const SHADOW = { kind: 'partyShadow' };
const flagAt = (key: string, atLeast = 1): Json => ({ kind: 'flag', key, atLeast, atMost: 999 });
const flagNone = (key: string): Json => ({ kind: 'flag', key, atLeast: 0, atMost: 0 });
const seen = (id: string): Json => ({ kind: 'eventSeen', id });
const eased = (amount: number): Json => ({ kind: 'shadowHeart', amount });
const PACIFIST_OK = { kind: 'noTrainerTag', tag: 'pacifist' };
/** Reclaim: the Sanctuary's ward (a Shadow Pokémon of yours left in the caretaker's care). */
const WARD = 'shadow-sanctuary-ward';
const HAZED = ['dark', 'ghost', 'poison'];
const hazedJoin = (lvl: number, shadow: boolean): Json => ({ kind: 'join', shadow, species: [], types: HAZED, levelBonus: lvl, shinyMultiplier: 1 });
const wildShadow = (lvl: number, win: Json[]): Json => ({ kind: 'wild', species: [], types: HAZED, levelBonus: lvl, shinyMultiplier: 1, shadow: true, blissful: false, win });
const guards = (name: string, size: number, shadow: number, lvl: number, win: Json[]): Json => ({ kind: 'trainer', name, size, shadow, types: ['dark'], levelBonus: lvl, win });

export const EVENTS: Json[] = [
  // ---------- the Shadow chain ----------
  {
    id: 'shadow-sighting',
    intro: 'A Pokémon stands very still in the long grass, wrapped in a purple haze. Its eyes are empty, like a window with nobody home.\n\nSomewhere behind those eyes, it is still in there. You can tell by the way it shakes.',
    choices: [
      ch('Watch from the trees.', out('It moves like something is steering it. A collar of black wire, a tag with a team mark. You write it all down. Somebody is doing this on purpose.', rp(10), flag('shadow-activity'))),
      ch('Throw it a berry.', out('The haze flickers. It does not eat, but it does not attack, and for one breath its eyes almost find yours. Then the wire tugs it away into the trees.', fr(2), good(1), flag('shadow-activity'), flag('sighting-kind'))),
      ch('Let your own Shadow Pokémon go to it.', out('The two of them stand nose to nose in the haze for a long time. Neither one attacks. When yours comes back, it walks a little straighter, as if it saw something it wants to stop being.', eased(-6), fr(2), flag('shadow-activity')), { requires: [SHADOW] }),
      ch('Back away.', leave('You back away slowly. The haze fades behind you, but the shaking stays with you for a while.')),
    ],
  },
  {
    id: 'shadow-sanctuary',
    intro: 'A ruined hut at the edge of the woods. Inside, a caged Pokémon wrapped in the same dark haze, and a tired caretaker in a patched coat keeping watch.\n\nCaretaker: "The haze comes off. Slowly. With people who stay. Most people don\'t stay."',
    choices: [
      ch('Break the cage open.', fight('The lock gives, and the shadowed Pokémon comes out swinging: scared, strong, and not sure you are not the one who caged it.', wildShadow(3, [item('rare-candy', 1)]), good(2)), { check: 'strength', fail: out('The lock holds. The caretaker shoos you out, not unkindly: "Force is how it got in there."', hurt(0.05)) }),
      ch('Help the caretaker calm it.', out('Hours of quiet voices and slow hands. When the cage opens, it does not run. It steps out and stands beside you, still shaded, choosing you.', good(3), hazedJoin(-1, true), flag('sanctuary-friend'))),
      ch('Leave it in the caretaker\'s care.', out('Caretaker: "Then it stays with me until the haze is gone. Come back for it." She writes your name on the cage, so it knows someone is coming.', good(2), flag('sanctuary-ward-wild'), flag('sanctuary-friend'))),
      ch('Leave your own Shadow Pokémon here to heal.', out('You kneel and say goodbye properly. It watches you go from the doorway. The caretaker puts a hand on its head: "I\'ll keep it safe. You come back."', { kind: 'sendAway', key: WARD, shadow: true, who: 'lead' }, good(2), flag('sanctuary-friend')), { requires: [SHADOW] }),
    ],
    remembers: [{ id: 'sanctuary-berry', when: [flagAt('sighting-kind')], notice: 'Caretaker: "You\'re the one who threw the berry, back in the grass. It told me. Well. It came here calmer, and that told me."' }],
  },
  {
    id: 'shadow-stabilize',
    requires: [seen('shadow-sanctuary')],
    intro: 'The caretaker from the Sanctuary finds you on the road, out of breath, with a bag of herbs.\n\nCaretaker: "The haze listens to a steady heart. Loud noises, sudden moves, and it closes again. You have to be the calm it can borrow."',
    choices: [
      ch('Sit with your Shadow Pokémon through the night.', out('You talk to it until the fire burns down. By morning the haze is thinner, and it is leaning its whole weight against you, asleep.', eased(-10), fr(6), good(2), heal(0.5)), { requires: [SHADOW] }),
      ch('Train it gently, a little at a time.', out('Small moves, never forced. Its strikes get cleaner, and once, for a heartbeat, its eyes flash with a spark of itself.', eased(-5), lv(1), fr(3)), { requires: [SHADOW] }),
      ch('Visit the Sanctuary with her.', out('The one you left there hears your voice before it sees you, and presses against the bars. Caretaker: "See? It remembers. It is getting better."', flag('sanctuary-visits'), rp(5), heal(0.3)), { requires: [flagAt('sanctuary-friend')] }),
      ch('Give it space.', leave('You thank her for the herbs and walk on. She watches you go, and keeps a light in the window anyway.')),
    ],
  },
  {
    id: 'shadow-purified',
    requires: [seen('shadow-stabilize')],
    intro: 'Word comes down the road with the caretaker\'s handwriting on it: "Today is the day. The last of the haze is lifting. Come."',
    choices: [
      ch('Stay with your Shadow Pokémon until it is gone.', out('The haze lifts off it like smoke off a cold morning. It looks at you, finally clear-eyed, and cries out so loud the whole party jumps. Warmth floods through all of you.', { kind: 'purifyShadow', ready: 100 }, fr(8), good(3), heal(1)), { requires: [SHADOW] }),
      ch('Go back to the Sanctuary for the one you left.', out('It is waiting at the door, clear-eyed and loud, and it runs the last ten steps. The caretaker is crying and pretending she isn\'t. "Told you to come back."', { kind: 'bringBack', key: WARD, levels: 2, friendship: 20, purify: true }, flag('sanctuary-reclaimed'), good(2)), { requires: [flagAt(WARD), flagNone('sanctuary-reclaimed')] }),
      ch('Go back for the caged one in her care.', out('The cage is open. The Pokémon inside is not hazed any more, just shy, and it walks to your name on the bars and then to you.', hazedJoin(0, false), flag('sanctuary-reclaimed'), good(2)), { requires: [flagAt('sanctuary-ward-wild'), flagNone('sanctuary-reclaimed')] }),
      ch('Share a quiet moment.', out('You sit with the caretaker on the step. She presses a strange glowing stone into your hand: "For the next one. There is always a next one."', item('rare-candy', 1), rp(15))),
    ],
    remembers: [{ id: 'purified-visits', when: [flagAt('sanctuary-visits')], notice: 'Caretaker: "You kept coming back. Do you know how rare that is? It knew your footsteps by the end."' }],
  },
  {
    id: 'shadow-outbreak',
    intro: 'Purple haze hangs over the route like smoke that forgot to rise. Wild Pokémon pace in circles, eyes dull. Something nearby is feeding it, and it is getting bigger.',
    choices: [
      ch('Search for the source.', fight('Behind a rock: a humming canister with a team mark, and the Pokémon it hazed, standing guard over it.', wildShadow(2, [flag('shadow-outbreak', -1), flag('kindness'), rp(15)])), { check: 'intelligence', fail: out('The haze thickens and the Pokémon lash out. You pull back with scrapes, coughing.', hurt(0.1)) }),
      ch('Let the Blissful aura settle the haze.', out('Soft light spreads from your Blissful Pokémon. The haze thins, the pacing slows, and the route breathes again.', flag('shadow-outbreak', -1), flag('kindness'), heal(0.3)), { requires: [{ kind: 'partyBlissful' }] }),
      ch('Follow your Shadow Pokémon to the source.', out('It knows this haze. It walks straight to the canister without looking, and stands there shaking until you smash it. The haze clears. So, a little, does its own.', flag('shadow-outbreak', -1), flag('kindness'), eased(-8)), { requires: [SHADOW] }),
      ch('Avoid the area.', leave('You take the long way round. The haze stays where it is.')),
    ],
  },
  {
    id: 'shadow-stronghold',
    intro: 'A faction hideout wedged into the cliffside: vents, a guarded loading dock, and cages stacked behind glass. Some of the cages are moving.\n\nYou can get a look at the guards before you choose.',
    choices: [
      ch('Slip in through the vents.', out('Quiet and quick. You open a cage, and a hazed Pokémon steps out trembling, looking at your hand like it has never seen one held out open.', hazedJoin(-1, true), flag('shadow-activity', -1)), { check: 'speed', fail: fight('A guard spots you. "Intruder!"', guards('Hideout guards', 3, 1, 1, [$(700), flag('shadow-activity', -1)])) }),
      ch('Break in through the front.', fight('Alarms scream. The whole shift storms out to meet you, and somewhere above, a lieutenant is shouting orders.', guards('Hideout guards', 4, 2, 2, [$(1100), item('premier-ball', 1), flag('shadow-activity', -1), flag('kindness'), flag('lieutenant-loose')])), { requires: [PACIFIST_OK] }),
      ch('Free the cages and send them to the Sanctuary.', out('You work the locks one by one while the guards change shift. The freed ones go north to the caretaker, every one. On the roof, the lieutenant sees you, and runs.', flag('sanctuary-ward-wild'), flag('sanctuary-friend'), flag('shadow-activity', -1), flag('lieutenant-loose'), good(3)), { check: 'speed', fail: out('A lock jams and the alarm goes. You get out with nothing but bruises.', hurt(0.08)) }),
      ch('Study the guards\' patrol, then leave.', out('You learn when they change shifts and which crates move at night.', reveal(), rp(10))),
    ],
  },
  {
    id: 'shadow-black-market',
    intro: 'A hooded dealer sells from a crate behind a barn. A hand-painted sign: STOLEN. CHEAP. NO QUESTIONS.\n\nDealer: "Information, gear, special supplies. Every coin I take goes back to the people who make the haze. You know that, right?"',
    choices: [
      ch('Buy a tip about the factions (₽600).', out('He slides a folded map across. Circled in red: what the hideouts are moving, and where. Your money goes back up the line.', $(-600), reveal(), flag('evil-funded')), { requires: [{ kind: 'money', atLeast: 600 }] }),
      ch('Buy a Snag Ball (₽5000). "Two in five of these work."', out('A battered ball with a black seam. It is the good one.', $(-5000), item('snag-ball', 1), flag('snag-ball-sold'), flag('evil-funded')), { requires: [{ kind: 'money', atLeast: 5000 }, flagNone('snag-ball-sold')], chance: 0.4, fail: out('A battered ball with a black seam. It is one of the three that don\'t work. He told you the odds; he keeps the money.', $(-5000), flag('snag-ball-sold'), flag('evil-funded')) }),
      ch('Buy back the Shadow Pokémon in the crate (₽2000).', out('He opens the crate. Inside, a hazed Pokémon with a team tag, curled small. "Reclaimed, then. It\'s yours, if you want the trouble."', $(-2000), hazedJoin(0, true), flag('evil-funded')), { requires: [{ kind: 'money', atLeast: 2000 }] }),
      ch('Report the dealer to the Sanctuary Keepers.', out('A keeper thanks you and pays for the tip. By evening the crate is gone, and another stall closes.', $(300), flag('kindness'), flag('shadow-activity', -1))),
    ],
  },
  {
    id: 'shadow-lieutenant',
    intro: 'A figure steps out of the trees: the lieutenant who got away, with a fresh team and a burn scar on one glove.\n\nLieutenant: "You cost me an operation. I want it back. Starting with you."',
    choices: [
      ch('Fight them.', fight('They send out their best, and one of them is hazed so deep it does not even flinch.', guards('The Lieutenant\'s squad', 4, 1, 2, [$(1500), flag('shadow-activity', -1), flag('lieutenant-loose', -1), flag('lieutenant-beaten'), hazedJoin(0, true)])), { requires: [PACIFIST_OK] }),
      ch('Bluff your way past.', out('You talk about the Keepers on the next ridge. They hesitate long enough for you to slip away.', fr(-1)), { check: 'charisma', fail: out('They see through it, and the squad shoves you to the ground on the way past.', hurt(0.12)) }),
      ch('Turn back.', leave('You take another road. They will remember.')),
    ],
    remembers: [{ id: 'lieutenant-again', when: [flagAt('lieutenant-beaten')], notice: 'Lieutenant: "Again. You. Fine. This time I brought the ones I kept back."' }],
  },
  {
    id: 'shadow-triad',
    requires: [{ kind: 'evil', team: 'plasma' }],
    intro: 'Three figures in black and white drop from nowhere in a puff of smoke, faces covered, perfectly still.\n\nShadow Triad: "Lord Ghetsis would like to know why you keep getting in the way."',
    choices: [
      ch('Battle all three.', fight('They attack together, all three at once, without a word between them.', { kind: 'trainer', format: 'triples', name: 'Shadow Triad', size: 3, types: ['dark'], levelBonus: 2, win: [{ kind: 'itemFrom', ids: ['leftovers', 'focus-sash', 'life-orb', 'choice-band', 'lucky-punch', 'macho-brace', 'smoke-ball'] }, $(1500), flag('shadow-activity', -1)] }), { requires: [PACIFIST_OK] }),
      ch('Hand over an item.', out('One of them takes it without touching your hand. Then there are no figures at all, only smoke.', { kind: 'loseItem' })),
      ch('"Tell him I\'m not stopping."', out('A pause. Then, together: "He knows." The smoke clears. The road ahead feels watched for the rest of the day.', flag('shadow-activity'), rage(1))),
    ],
  },

  // ---------- the Reputation readout ----------
  {
    id: 'karma-echo',
    intro: 'A stranger stops you at the crossroads, hat low, notebook open.\n\nStranger: "I collect what the road says about people. You\'d be surprised how much it says. Want to hear yours?"',
    choices: [
      ch('"What does the road say about me?"', out('Stranger: "By my count: {flag:rep} good turns, {flag:rep-lost} bad ones, {flag:kind-total} kindnesses. Quiet road. Nobody has made up their mind about you yet."', rp(2)), {
        branches: [
          { when: [{ kind: 'record', is: 'high' }], text: 'Stranger: "{flag:rep} good turns, {flag:kind-total} kindnesses. They say you stop for people. A shopkeeper two towns back asked me to give you this, if I ever met you."', effects: [$(200), fr(1), good(1)] },
          { when: [{ kind: 'record', is: 'low' }], text: 'Stranger: "{flag:rep-lost} bad turns, and something you kept that wasn\'t yours. They lock their doors when they hear your name. Some of them pay me to warn them you\'re coming."', effects: [$(200), rage(1)] },
        ],
      }),
      ch('"What do they say about my team?"', out('Stranger: "They talk about your {lead}. Mostly that it looks tired, and that it never stops looking at you."', fr(1)), {
        branches: [
          { when: [{ kind: 'rep', category: 'rival', atLeast: 'known' }], text: 'Stranger: "They say you never once backed down from your rival. Kids have started picking sides."', effects: [fr(1)] },
          { when: [{ kind: 'rep', category: 'champion', atLeast: 'known' }], text: 'Stranger: "Gym Leaders talk. They say you fight like someone who has already seen the end of the road."', effects: [fr(1)] },
          { when: [{ kind: 'rep', category: 'villain', atLeast: 'known' }], text: 'Stranger: "The teams know your face. Some of their grunts have stopped wearing the uniform on this road."', effects: [fr(1)] },
          { when: [{ kind: 'rep', category: 'bond', atLeast: 'known' }], text: 'Stranger: "They say your Pokémon would walk into fire for you, and that you would walk in first."', effects: [fr(2)] },
        ],
      }),
      ch('"I don\'t care what they say."', leave('Stranger: "Everyone says that." They close the notebook and let you pass.')),
    ],
  },

  // ---------- Rivalry weeks: the rival in every pseudo-stage ----------
  {
    ...ev('co-week-rival', 'Your Rival, Here Too', 'Rivalry Week', { room: true, stop: 'event', tint: '#e04848', effect: 'sparkle' },
    'Halfway through, somebody is leaning on the wall like they have been waiting all day.\n\n{rival}: "Rivalry Week. You didn\'t think I\'d let you have this place to yourself, did you?"',
    [
      ch('"Then let\'s settle it here."', fight('{rival} grins and throws first. In a place like this, nobody is coming to break it up.', rival({ lv: 1, size: 4, win: [$(900), flag('week-rival-won')] })), { requires: [{ kind: 'rivalMet', atLeast: 1 }] }),
      ch('"Help me get through, then."', out('{rival}: "Fine. Just this once." Two teams side by side for a while. You both get better, and neither of you says so.', fr(4), lv(1))),
      ch('Walk past them.', leave('{rival}: "Running already? I\'ll be in the next one too."')),
    ]),
    remembers: [{ id: 'week-rival-again', when: [flagAt('week-rival-won')], notice: '{rival}: "The last one went to you. I have been thinking about it every step since."' }],
  },
];

export const REMOVE: string[] = [];
