// Catalog Overhaul, families-c part 2: STORY_FAMILIES_9.md SF60 to SF63 (A Familiar Stranger, Dark Deal, One of Us
// Is Not, The One You Helped). Re-read log: docs/status/co-families-c.md.
import { again, ch, ev, evil, fight, flag, flagAgo, flagIs, fr, good, hurtLead, join, leave, out, party, room, takeNode, type Json } from '../dsl.ts';
import { HAS_BERRY, BERRY, HAS_POTION, POTION, HAS_REVIVE, REVIVE, HEAL_ITEMS, against, apprenticeCopies, bagHas, done, helped, kindness, notYet, repDown, repUp, spend, stamped, tf, wf } from './_families-c-kit.ts';

export const CATEGORY = 'families-c';

// ---------- SF60 A Familiar Stranger ----------
// The pack's poncho trainer is the player's past-run self. Runs never remember each other (Kice, 2026-11-14), so this is
// the pack's own "no past run" version: someone from a run that hasn't happened, whose team is yours, slightly different.

const PONCHO = { cast: ['boss.hop'], tint: '#1e1e2c', effect: 'fog' };
const ponchoFight = (lvBonus: number, after: string): Json => tf('The Poncho', { mirror: true, size: 6, lv: lvBonus, cls: 'ace-trainer', win: [room(after)] }, [room(after)]);

const SF60: Json[] = [
  {
    id: 'boss-rematch-disguise',
    intro: 'Rain, the soft kind that soaks you without noticing. A trainer in a rain poncho, hood up, steps out to meet you. They walk like someone who has done this many times before. They have your stride, exactly. The Poncho: "Quick battle? I\'ve a long way to go." The Pokémon at their side is a {lead}. Not like yours. Yours.',
    choices: [
      ch('Battle.', fight('The Poncho nods, as if they knew you would. Every Pokémon they send out is one of yours, a little older, a little more tired, moving the way yours will someday.', ponchoFight(0, 'stranger-after'))),
      ch('Take your hood down.', out('They hesitate, then push the hood back. The face under it is yours. A little tired. A little older around the eyes. The Poncho: "It doesn\'t get easier. It gets better."', room('stranger-talk'))),
      ch('I know that Pokémon.', out('The Poncho looks at their {lead}, and then at yours. The Poncho: "So do I." A long breath, rain running off the hood. The Poncho: "It doesn\'t get easier. It gets better."', room('stranger-talk'))),
    ],
  },
  ev('stranger-talk', 'A Familiar Stranger', 'Emergent Stories', { room: true, ...PONCHO },
    'The Poncho is still there, waiting in the rain, the way you wait for a friend who is running late.',
    [
      ch('Battle.', fight('"Thank you," the Poncho says quietly, and sends out your {lead}.', ponchoFight(0, 'stranger-after'))),
      ch('Let them go.', leave('The Poncho pulls the hood back up and walks on into the rain. They don\'t look back. You know they won\'t; you wouldn\'t.')),
    ]),
  ev('stranger-after', 'A Familiar Stranger', 'Emergent Stories', { room: true, ...PONCHO },
    'The Poncho calls their {lead} back. Before it goes, it and your {lead} stand nose to nose in the rain for a long moment, and neither of them blinks. The Poncho: "It doesn\'t get easier. It gets better."',
    [
      ch('Who are you?', leave('The Poncho smiles under the hood. "You know." They walk away into the rain.')),
      ch('Again.', fight('"Again," the Poncho agrees, and this time they don\'t hold anything back. This is your team at its very best.', ponchoFight(5, 'stranger-after-2'))),
      ch('Thank you.', out('The Poncho takes something off their {starter} and presses it into your hand. "It held this the whole way. Your turn." They walk off into the rain.', { kind: 'copyHeld', who: 'starter' })),
    ]),
  ev('stranger-after-2', 'A Familiar Stranger', 'Emergent Stories', { room: true, ...PONCHO },
    'The Poncho is breathing hard, and grinning, and so are you. Your {lead} and its double press their foreheads together.',
    [
      ch('Who are you?', leave('"You know," the Poncho says, and goes.')),
      ch('Thank you.', out('The Poncho takes something off their {starter} and presses it into your hand. "It held this the whole way. Your turn."', { kind: 'copyHeld', who: 'starter' })),
    ]),
];

// ---------- SF61 Dark Deal ----------

const VREEL = { cast: ['trainer.scientist'], tint: '#180820', effect: 'flicker' };
const SF61: Json[] = [
  {
    id: 'dark-deal',
    intro: 'A dim lab behind a door that should have been locked. A scientist in a stained coat holds a humming device against his chest like a baby. Dr. Vreel: "Give me one Pokémon. I\'ll give you a legend. Maybe." Dr. Vreel: "The device closes a heart and opens a door. What comes through is very strong, and very unhappy." A screen behind him reads: SHADOW CONVERSION: 4 OF 4 SUCCESSFUL.',
    choices: [
      ch('What happens to the one I give you?', out('Vreel doesn\'t even look up. "It goes to my employers. You\'ll see it again, probably." He finally meets your eyes. "On the other side."', room('dark-deal'))),
      ch('Deal.', out('You point. Vreel takes the Ball without a word and puts it in the machine, and the hum climbs, and the lights flicker, and the door at the back of the lab opens. What walks out is a legend, and its eyes are dark, and it does not look at you. It must be purified before it will truly fight for you. Using it is up to you.', { kind: 'notePicked', key: 'dark-deal', take: true }, { kind: 'regionJoin', table: 'darkDeal', shadow: true }, stamped('dark-dealt'), evil(3), flag('cruelty-act')), { pick: {}, requires: [party(2)] }),
      ch('Report you.', out('You run for the nearest phone. When the officers break the door down, the lab is empty, the device gone, Vreel gone. But his notes are still on the desk, and one page lays out the next step of his employers\' plan.', flag('dark-reported'), flag('reported-crime'), flag('evil-plan-revealed'), good(1), repUp(1))),
    ],
    remembers: [
      { id: 'volcanion', when: [flagIs('promise-volcanion')], notice: 'Steam drifts through the vent above the door. Volcanion is watching. It promised to walk with someone who would never be cruel.', hide: [], addChoices: [] },
      { id: 'zeraora', when: [flagIs('promise-zeraora')], notice: 'A crackle of lightning in the hall, and gone. Zeraora is watching. It promised to walk with someone who would never be cruel.', hide: [], addChoices: [] },
    ],
  },
  ev('dark-deal-admin', 'Dark Deal: The Other Side', 'PokeRogue-style encounters', { callback: true, minStage: 2, requires: [flagAgo('dark-dealt', 1), notYet('dark-admin-done')], cast: ['boss.npc_teamrocket_m'], tint: '#180820', effect: 'flicker' },
    'An Admin of the Evil Team blocks the road, bored, a Ball spinning on one finger. Then the Ball opens, and {note:dark-deal} comes out. Your {note:dark-deal}. It sees you. Its whole body goes still. Admin: "Oh, you know this one? Funny. It\'s the best thing that lab ever sent us."',
    [
      ch('Win it back.', fight('"Sure," the Admin says. "Take it from me." {note:dark-deal} stands on the wrong side of the field and will not look at you.', against(tf('Admin', { cls: 'ace-trainer', size: 3, lv: 4, win: [{ kind: 'rejoin', key: 'dark-deal' }, done('dark-admin-done'), flag('dark-won-back')] }, [stamped('dark-admin-again')]), { note: 'dark-deal' })) as Json),
      ch('Leave it.', out('You walk past. You hear the Ball close behind you.', done('dark-admin-done'), flag('dark-left'))),
    ]),
  ev('dark-deal-admin-again', 'Dark Deal: The Other Side', 'PokeRogue-style encounters', { callback: true, minStage: 2, requires: [flagAgo('dark-admin-again', 1), notYet('dark-admin-done')], cast: ['boss.npc_teamrocket_m'], tint: '#180820', effect: 'flicker' },
    'The same Admin, a region on, and {note:dark-deal} at their side. This time it looks at you first.',
    [
      ch('Win it back.', fight('"You again," the Admin says. "Fine."', against(tf('Admin', { cls: 'ace-trainer', size: 3, lv: 5, win: [{ kind: 'rejoin', key: 'dark-deal' }, done('dark-admin-done'), flag('dark-won-back')] }, [done('dark-admin-done'), flag('dark-left')]), { note: 'dark-deal' }))),
      ch('Leave it.', out('You walk past. You hear the Ball close behind you.', done('dark-admin-done'), flag('dark-left'))),
    ]),
];

// The Admin battle carries the evil team's look (rank "executive" is the pack's Admin).
for (const e of SF61) for (const c of (e.choices as Json[]) ?? []) {
  const b = ((c.success as Json)?.battle as Json | undefined);
  if (b && b.name === 'Admin') Object.assign(b, { evil: 'executive' });
}

// ---------- SF62 One of Us Is Not ----------

const SF62: Json[] = [
  {
    id: 'ditto-impostor',
    intro: 'You count your party. Twice. Then again, slower. Seven Pokémon. Six Balls. One of them is a little too eager to be looked at. It moves like a {impostorType}-type that forgot how. Its cry comes out half a note off. When you say its name, it doesn\'t turn. And for one frame, just one, its eyes are two black dots.',
    choices: [
      ch('Point at the impostor.', out('You point.', { kind: 'pickTest', test: 'impostor', pass: 'ditto-spotted', fail: 'ditto-missed', sulk: 5 }, room('ditto-reveal')), { pick: {} }),
    ],
  },
  ev('ditto-reveal', 'One of Us Is Not', 'Emergent Stories', { room: true, pokemon: 'ditto', tint: '#2a2030', effect: 'none' },
    'For a second, nothing happens.',
    [
      ch('Welcome it.', out('The Pokémon you pointed at sags, wobbles, and melts into a very embarrassed Ditto. It shuffles its feet. Then it looks up at you and asks, as plainly as a Ditto can, to come along.', join({ species: ['ditto'], lv: 0 }), flag('ditto-spotted', -99), flag('ditto-missed', -99)), { requires: [flagIs('ditto-spotted')] }),
      ch('Watch it go.', out('The one you pointed at looks at you, hurt, and turns away to sulk. Behind it, the real impostor slips off the edge of the group and into the grass. You catch one last look at it: it has your lead\'s face. It will be on the other side of your next battle.', flag('ditto-lurking'), flag('ditto-spotted', -99), flag('ditto-missed', -99)), { requires: [flagIs('ditto-missed')] }),
    ],
  ),
];
// ditto-reveal's view: only the true answer's button.
Object.assign(SF62[1]!, {
  remembers: [
    { id: 'cove', when: [flagIs('ditto-spotted'), flagIs('cages-opened')], intro: 'It\'s a cove Ditto, one of the ones you freed. It knew you were a friend the whole time. It just wanted to see if you knew it too.', hide: [1], addChoices: [] },
    { id: 'spotted', when: [flagIs('ditto-spotted')], hide: [1], addChoices: [] },
    { id: 'missed', when: [flagIs('ditto-missed')], hide: [0], addChoices: [] },
  ],
});

// ---------- SF63 The One You Helped ----------
// Each costs something real. A helped Pokémon comes back once a region at the worst moment (core/events/coHelpers.ts).
// Leaving is never punished, only remembered (`passed-<species>`).

const passed = (_species: string): Json[] => [flag('kind-walked-past')];
const helpedBy = (species: string, rare = false): Json[] => [helped(species, rare), flag('kind-helped-stranger'), ...kindness()];

const SF63: Json[] = [
  {
    id: 'injured-pokemon',
    scene: { cast: [], pokemon: 'growlithe', effect: 'hearts' },
    intro: 'A Growlithe lies fainted in the long grass, one ear folded under it. Its fur is matted. It is breathing, barely. It is a long way from anywhere.',
    choices: [
      ch('Revive it (costs a Revive).', out('The Revive works fast. The Growlithe wakes all at once, scrambles up, and looks at you for a long, careful moment. Then it runs. At the edge of the grass it stops and looks back once.', REVIVE, ...helpedBy('growlithe')), { requires: [HAS_REVIVE] }),
      ch('Carry it to a Center (a node).', out('It\'s heavier than it looks. Nurse Joy takes it from your arms without a single question. When you leave, it is sitting up on the cot, watching you go through the glass.', takeNode(), ...helpedBy('growlithe'))),
      ch('Leave it.', leave('You leave it in the grass. You don\'t forget it.'), {}),
    ],
  },
  {
    id: 'injured-wild-pokemon',
    scene: { cast: [], pokemon: 'ponyta', tint: '#201820', effect: 'float' },
    intro: 'A young Ponyta stands beside the path on three legs, breathing hard, its flame burning low and blue. The fourth leg hangs wrong. It watches you come closer, too tired to run.',
    choices: [
      ch('Use a Potion.', out('You spray the leg slowly, talking to it the whole time. The flame flickers back to orange. It recovers just enough to limp off into the trees.', POTION, ...helpedBy('ponyta')), { requires: [HAS_POTION] }),
      ch('Splint its leg (a node).', out('A straight stick, a strip of cloth from your own bag, an hour of patience while it trembles. When you\'re done, it puts its weight on the leg, carefully, and limps off. Then it turns and presses its nose into your hand, once, grateful.', takeNode(), ...helpedBy('ponyta'))),
      ch('Leave it.', out('You leave it there. It watches you go.', ...passed('ponyta'))),
    ],
  },
  {
    id: 'starving-wild',
    intro: 'A thin Poochyena sits by the road, watching your bag. Every rib shows. It doesn\'t growl. It\'s too tired to growl.',
    choices: [
      ch('Feed it.', out('You set a Berry down and step back. It eats in three bites, then licks the ground where it was. It watches you go, and keeps watching until you\'re gone.', BERRY, flag('fed-poochyena'), ...kindness()), { requires: [HAS_BERRY] }),
      ch('Feed it and stay a while (a node).', out('You give it a Berry and sit down in the dust beside it. After a long time it leans against you. Then it falls asleep against your leg, and you let it, until the afternoon is gone.', BERRY, takeNode(), flag('fed-poochyena'), flag('fed-poochyena-stayed'), ...kindness()), { requires: [HAS_BERRY] }),
      ch('Walk on.', out('You walk on. It doesn\'t follow. It doesn\'t have the strength.', ...passed('poochyena'))),
    ],
  },
  {
    id: 'starving-wild-returns',
    requires: [flagIs('fed-poochyena'), notYet('mightyena-done')],
    intro: 'A raider has you cornered at the worst moment, your team worn down, nowhere to go. Then a growl, low and huge, and a Mightyena in full health lands between you and the raider, every hair on its back standing up. You know it. It knows you.',
    choices: [
      ch('Fight beside it.', fight('It doesn\'t look at you. It doesn\'t need to. It fights like it owes you something.', tf('Raider', { cls: 'roughneck', size: 3, lv: 2, ally: 'mightyena', win: [done('mightyena-done')] }, [done('mightyena-done')]))),
      ch('Let it handle it.', out('The Mightyena routs the raider in less time than it takes to tell. Then it comes back, and sits down in front of you, and looks at you.', done('mightyena-done'), room('mightyena-sits'))),
    ],
  },
  ev('mightyena-sits', 'The Poochyena Returns', 'Emergent Stories', { room: true, pokemon: 'mightyena', tint: '#2a1d1d', effect: 'glint' },
    'The Mightyena sits in the road, tail still, and looks at you.',
    [
      ch('Thank it.', leave('You crouch and thank it. It touches its nose to your hand, and lopes away into the grass.')),
      ch('Let it come.', out('It stands, walks around behind you, and falls into step at your heel like it has always been there.', join({ species: ['mightyena'], lv: 0 }), fr(100, 'newest')), { requires: [flagIs('fed-poochyena-stayed')] }),
    ]),
  {
    id: 'trapped-pokemon',
    scene: { cast: [], pokemon: 'skitty', tint: '#183018', effect: 'shake' },
    intro: 'A Skitty is tangled in thick, thorny vines, crying weakly. Every time it struggles, the vines pull tighter. Its paws are bleeding.',
    choices: [
      ch('Cut it free (a node).', out('It takes a long time, and the thorns don\'t care whose hands they cut. When the last vine gives, the Skitty bolts, then stops, and comes back to lick the scratches on your hands.', takeNode(), hurtLead(0.05), ...helpedBy('skitty'))),
      ch('Use a Fire-type.', out('One careful breath of flame and the vines shrivel away. The Skitty tumbles free, unhurt, and rubs its whole body against your Fire-type\'s leg.', fr(5, 'picked'), ...helpedBy('skitty')), { pick: { types: ['fire'] } }),
      ch('Leave it.', out('You leave it in the vines. Its crying follows you a long way.', ...passed('skitty'))),
    ],
  },
  ev('trapped-pokemon-net', 'The Net Tangle', 'Wild Pokémon scenes', { rarity: 'uncommon', types: ['water'], pokemon: 'wooper', tint: '#183040', effect: 'rain' },
    'A Wooper is caught in an old fishing net in the shallows, crying weakly, its head barely above the water. Somebody left this net here and forgot it.',
    [
      ch('Cut it free (a node).', out('You wade in to your waist and saw at the net until your hands ache. The Wooper slips free and floats beside you, blinking, and won\'t leave until you\'re back on the bank.', takeNode(), hurtLead(0.05), ...helpedBy('wooper'))),
      ch('Use a Water-type.', out('Your Water-type dives, works the knots loose with practiced care, and surfaces with the Wooper riding on its head.', fr(5, 'picked'), ...helpedBy('wooper')), { pick: { types: ['water'] } }),
      ch('Leave it.', out('You leave it in the net.', ...passed('wooper'))),
    ]),
  {
    id: 'unlikely-ally',
    scene: { cast: [], pokemon: 'ursaring', effect: 'sparkle' },
    intro: 'A huge Ursaring stands its ground against a whole gang of Primeape, swinging, roaring, bleeding from a dozen scratches. It\'s strong. It\'s losing.',
    choices: [
      ch('Help it fight.', fight('You jump in beside it. The Ursaring looks at you once, surprised, and then turns back to the gang. Side by side.', { ...tf('The Gang', { size: 3, lv: 2, team: ['primeape', 'mankey', 'primeape'], ally: 'ursaring', win: [...helpedBy('ursaring')] }, [...helpedBy('ursaring')]), spritePokemon: 'primeape' }) as Json),
      ch('Heal it after.', out('You wait until the gang finally breaks and runs. Then you walk over with a Potion. The Ursaring growls at you, then lets you, grudging, grumbling the whole time.', POTION, ...helpedBy('ursaring')), { requires: [HAS_POTION] }),
      ch('Stay out.', out('You stay out of it. The Ursaring wins anyway, barely, and limps off into the trees without looking at you.', ...passed('ursaring'))),
    ],
  },
  {
    id: 'hungry-foe-berry',
    scene: { cast: [], pokemon: 'munchlax', tint: '#2a2a1c', effect: 'none' },
    intro: 'A wild Munchlax plants itself in the middle of the road and growls at you. Its stomach growls louder than it does.',
    choices: [
      ch('Throw a Berry.', out('It catches the Berry in both paws and eats it in one bite. Then it stops growling, sits down, and pats its belly, deeply satisfied.', BERRY, ...helpedBy('munchlax')), { requires: [HAS_BERRY] }),
      ch('Battle.', fight('Hungry and cross, it charges.', wf({ species: ['munchlax'], lv: 1 }))),
      ch('Back away.', out('You back away slowly. It follows you, still hungry, a few steps behind. It will be back.', again('hungry-foe-berry'))),
    ],
  },
  {
    id: 'wounded-rare',
    scene: { cast: [], pokemon: 'dratini', tint: '#2a1c1c', effect: 'none' },
    intro: 'A Dratini lies hurt beside the road, its scales dull, a long gash along its side. You have never seen one in the wild. It sees you, and tries to rise, and can\'t.',
    choices: [
      ch("Heal it, don't catch it.", out('You kneel and heal it slowly. Its scales brighten. It rises, coils, and looks at you a long moment with its dark wet eyes. Then it slides away into the river.', spend(['revive', ...HEAL_ITEMS], 1), ...helpedBy('dratini', true)), { requires: [bagHas(['revive', ...HEAL_ITEMS], 1, 'a Revive or a Potion')] }),
      ch("Catch it while it's weak.", out('It can\'t even struggle. The Ball barely wobbles. Somewhere behind a fence, a kid who copies you saw.', join({ species: ['dratini'], lv: 0 }), repDown(1), evil(1), ...apprenticeCopies('caught-weak'))),
      ch('Leave it.', out('You leave it by the road.', ...passed('dratini'))),
    ],
  },
  ev('wounded-rare-thanks', 'The Wounded Rare', 'Set Pieces', { room: true, pokemon: 'dratini', tint: '#1c2a2a', effect: 'sparkle' },
    'The Dratini that saved you is waiting by the road, coiled on a warm stone. Its scales shine now. It uncoils when it sees you, and comes closer, and looks at your Balls, and then at you.',
    [
      ch('Welcome it.', out('It slides into a Ball on its own, and the Ball clicks shut without a wobble.', join({ species: ['dratini'], lv: 0 }), fr(100, 'newest'))),
      ch('Let it go home.', leave('You shake your head gently. It touches its nose to your hand and goes back to the river.')),
    ]),
];

export const EVENTS: Json[] = [...SF60, ...SF61, ...SF62, ...SF63];
export const REMOVE: string[] = ['ovc-net-tangle-s1'];
