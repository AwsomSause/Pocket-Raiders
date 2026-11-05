// Run events D: villain teams and heists (docs/ideas/categories/r-d-villain-teams-and-heists.md, R181-R235).
// Written with the events DSL; tools/build-villain-events.ts turns the lists into src/data/eventsVillain.json.
// Skipped because they already exist: R187 (skull-graffiti), R188 (yell-blockade), R189 (star-raid), R235 (boss-rematch-disguise).
// A flag set by one event (`vt-*`) gates its follow-up scene, which is a `callback`.

import { $, any, att, ch, ev, fight, flag, flagIs, fr, good, evil, has, heal, hurt, item, join, leave, lose, lv, money, out, party, ptype, relic, rp, scout, status, trainer, wild, better, express, type Json, BALLS, HELD, RARE_HELD, TREASURE, STONES } from './dsl.ts';

const G = 'Villain Teams';
const H = 'Heists & Hideouts';
const PR = (id: string, needs: 'ok' | 'good' | 'perfect' = 'good') => ({ prompt: { id, needs } });
const grunt = (name: string, size = 2, lvl = 0, win: Json[] = []) => trainer(name, { cls: 'roughneck', size, lv: lvl, win });

// ---------------- Batch A: the teams in the field (R181-R208) ----------------
export const VILLAIN_A: Json[] = [
  ev('vt-rocket-bake-sale', 'Rocket Bake Sale', G, { stop: 'event', rarity: 'common', minStage: 1, tint: '#2a1414', effect: 'sparkle' },
    'A cheerful stall sells cookies "for sick Pokémon". The cashier\'s collar says R, and the cash box has no charity sticker.', [
      ch('Donate ₽300 anyway', out('They hand over a cookie and a fake smile. The cookie is delicious.', $(-300), any('old-gateau', 'lava-cookie'), good(1)), { requires: [money(300)] }),
      ch('Report the stall', out('The authorities swoop in. A grateful official tips you off.', $(500), good(2), rp(10))),
      ch('Shake them down', fight('"Prepare for trouble!" The cash box is worth fighting for.', grunt('Bake Sale Grunt', 2, 0, [$(700)])), evil(1)),
      ch('Walk on', leave()),
    ]),
  ev('vt-aqua-leak-patrol', 'Aqua Leak Patrol', G, { stop: 'event', rarity: 'common', minStage: 1, types: ['water'], tint: '#0c1a2a', effect: 'rain' },
    'A cracked pipe sprays sea water across the path. Two Team Aqua grunts argue over whose fault it is.', [
      ch('Seal the leak (Strength)', out('You wrestle the valve shut. The grunts, soaked, wave you off.', rp(15), item('mystic-water')), { check: 'strength', fail: out('The pipe bursts in your face. Cold, but not hurt.', hurt(0.05)) }),
      ch('Fight the two grunts', fight('"You will not stop the flood!"', grunt('Aqua Grunt', 2, 0, [any(...BALLS)]))),
      ch('Let your Water-type absorb it', out('Your Water-type drinks the spray happily. The pipe drains, the grunts flee.', heal(0.5), fr(4)), { requires: [ptype('water')] }),
    ]),
  ev('vt-magma-quarry-strike', 'Magma Quarry Strike', G, { stop: 'event', rarity: 'uncommon', minStage: 2, types: ['fire', 'rock'], tint: '#2a1008', effect: 'fire' },
    'Team Magma is strip-mining the hillside. Rare ore glints in the cut, behind two guards and a drill rig.', [
      ch('Fight for the ore', fight('"This is OUR mountain now!"', grunt('Magma Grunt', 2, 1, [any('hard-stone', 'metal-coat', 'star-piece'), any('nugget', 'star-piece')]))),
      ch('Sneak to the cut (Speed)', out('You slip along the spoil heap and pocket ore before they notice.', any('hard-stone', 'star-piece', 'nugget')), { check: 'speed', fail: fight('A guard spots you!', grunt('Magma Grunt', 1, 0)) }),
      ch('Leave them to it', leave()),
    ]),
  ev('vt-galactic-toll-booth', 'Galactic Toll Booth', G, { stop: 'event', rarity: 'common', minStage: 1, tint: '#1c1c34', effect: 'none' },
    'A makeshift booth bars the road. A Galactic grunt taps a sign: "Road tax for a new universe. ₽400."', [
      ch('Pay the toll', out('The barrier lifts. "Thank you for supporting the future."', $(-400)), { requires: [money(400)] }),
      ch('Pass the grunt (Charisma)', out('You talk about how important you are. He waves you through, confused.', rp(10)), { check: 'charisma', fail: fight('"No pass, no payment? Battle!"', grunt('Galactic Grunt'))}),
      ch('Battle the grunt', fight('He sighs, then sends out a Pokémon.', grunt('Galactic Grunt', 2, 0, [$(500)]))),
    ]),
  ev('vt-plasma-rally', 'Plasma Rally Interrupt', G, { stop: 'event', rarity: 'uncommon', minStage: 2, tint: '#1c2a34', effect: 'sparkle' },
    'A Plasma speaker is mid-speech on the plaza steps: "Pokémon deserve freedom!" The crowd turns to look at you and your team.', [
      ch('Speak up for trainers', out('You say that bonds are a choice, and the crowd cheers. Plasma slinks away.', good(2), flag('vt-plasma-rep', 1), fr(4)), { check: 'charisma', fail: out('You stumble over your words and the crowd boos.', evil(1), flag('vt-plasma-rep', 0)) }),
      ch('Cheer the speaker on', out('Plasma are delighted. A grunt slips you a pamphlet and a coin.', $(300), evil(2), flag('vt-plasma-rep', 2))),
      ch('Heckle from the back', fight('Security in white and teal moves in.', grunt('Plasma Grunt', 2, 0, [$(400)]))),
    ]),
  ev('vt-flare-salon-spy', 'Flare Salon Spy', G, { stop: 'event', rarity: 'uncommon', minStage: 2, tint: '#3a1c24', effect: 'sparkle' },
    'The stylist is humming a little too casually as she asks about your route and your team. A red lipstick is shaped like a Team Flare logo.', [
      ch('Confront her', fight('"Oh, you caught me!" She grins and snaps her fingers.', grunt('Flare Stylist', 2, 1, [any('shiny-stone', 'fairy-feather', 'star-piece')]))),
      ch('Turn her (Charisma)', out('She trades her information for a better offer. "I never saw you."', rp(25), any('shiny-stone', 'dawn-stone'), flag('vt-flare-informant', 1)), { check: 'charisma', fail: out('She smiles, takes your tip, and leaves without a word.', $(-100)) }),
      ch('Feed her false details', out('She writes it all down. Somewhere, a Flare scout wastes a day.', rp(10), good(1))),
    ]),
  ev('vt-yell-cheer-chorus', 'Yell Cheer Chorus', G, { stop: 'event', rarity: 'common', minStage: 1, tint: '#2a1c34', effect: 'sparkle' },
    'A knot of Team Yell fans fills the road. "We won\'t move unless you sing along!"', [
      ch('Sing a chorus (rhythm)', out('You nail the beat. The fans cheer and wash your team with fresh energy.', heal(0.5), fr(5)), { ...PR('echo-rhythm', 'ok'), fail: out('You miss a few notes. They let you through, politely.', fr(1)) }),
      ch('Push through', fight('The fans turn into a wall of noise and Pokémon.', grunt('Yell Fan', 2, 0, [any('oran-berry', 'sitrus-berry')]))),
    ]),
  ev('vt-rocket-radio-hijack', 'Rocket Radio Hijack', G, { stop: 'event', rarity: 'uncommon', minStage: 2, types: ['electric'], tint: '#1c1c24', effect: 'flicker' },
    'Every radio nearby buzzes with the same jammed signal. A Team Rocket transmitter hums on a pole.', [
      ch('Fix it with an Electric-type', out('A jolt resets the receiver. The broadcast clears and a grateful operator tips you.', $(500), rp(20), good(1)), { requires: [ptype('electric')] }),
      ch('Rewire it yourself (Intelligence)', out('You cross the right two wires. The signal returns.', rp(25), $(200)), { check: 'intelligence', fail: out('Sparks fly. The radio is toast.', hurt(0.05)) }),
      ch('Smash the transmitter', fight('Rocket grunts rush out.', grunt('Rocket Grunt', 2, 0, [any(...BALLS)]))),
    ]),
  ev('vt-rocket-cargo-truck', 'Stolen Cargo Truck', G, { stop: 'event', rarity: 'uncommon', minStage: 1, tint: '#2a2418', effect: 'fog' },
    'A truck marked with a big R barrels past. Crates tumble out of the back and roll down the road.', [
      ch('Chase it down (Speed)', out('You vault the tailgate and haul back the cargo.', any(...BALLS), any('potion', 'super-potion'), $(400)), { check: 'speed', fail: out('It outruns you. You grab a few crates by the roadside.', any(...BALLS)) }),
      ch('Sort the roadside crates', out('A handful of crates is all that is left. Loot!', any('potion', 'revive', 'great-ball'))),
      ch('Call out the driver', fight('The driver pulls over, furious.', grunt('Truck Driver', 2, 0, [$(600)]))),
    ]),
  ev('vt-aqua-submarine-dock', 'Aqua Submarine Dock', H, { stop: 'hideout', rarity: 'rare', minStage: 3, types: ['water'], tint: '#0c1a2a', effect: 'rain' },
    'A hatch in the sea wall opens onto a hidden dock. A Team Aqua submarine sits at the pier with one guard on watch.', [
      ch('Sneak aboard (stealth)', out('You tiptoe across the hull when the guard turns away. Inside, a locker full of loot.', any('mystic-water', 'big-pearl', 'pearl'), any(...TREASURE)), { ...PR('brace-hold', 'good'), fail: fight('A klaxon blares!', grunt('Aqua Grunt', 3, 1)) }),
      ch('Fight the guard', fight('"Intruder!"', grunt('Aqua Guard', 2, 1, [any('mystic-water', 'pearl')]))),
      ch('Photograph it from afar', out('You get the evidence. The authorities pay for it.', $(600), rp(20))),
    ]),
  ev('vt-magma-seismograph', 'Magma Seismograph Tamper', G, { stop: 'event', rarity: 'uncommon', minStage: 2, types: ['ground', 'fire'], tint: '#2a1810', effect: 'shake' },
    'The village seismograph blares a quake alarm, but the ground is perfectly still. A Team Magma grunt leans on the cable box.', [
      ch('Fix the sensor (Intelligence)', out('The alarm stops. The villagers thank you with supplies.', any('super-potion', 'hyper-potion'), $(300), good(1)), { check: 'intelligence', fail: out('You only make it louder. The grunt snickers and runs.', evil(1)) }),
      ch('Fight the grunt', fight('"Everybody evacuate! Hahaha!"', grunt('Magma Grunt', 2, 0, [$(500)]))),
    ]),
  ev('vt-galactic-orders', 'Cyrus\'s Orders', G, { stop: 'event', rarity: 'rare', minStage: 3, tint: '#14142c', effect: 'none' },
    'A folded note lies on a bench, signed with a stern C. It lays out the next Galactic operation, step by step.', [
      ch('Spoil the plan', out('You tip off the right people. The operation collapses, and your rival hears about it.', good(2), rp(30), flag('vt-rival-edge', 1)), ),
      ch('Copy and use it', out('You take their route. It saves you a day.', express(), evil(1))),
      ch('Return it', out('You leave it where it lay. A grunt is relieved, and tips you.', $(300))),
    ]),
  ev('vt-plasma-blank-duel', 'Blank Soldier Duel', G, { stop: 'event', rarity: 'rare', minStage: 3, tint: '#10202c', effect: 'none' },
    'A silent Plasma soldier steps from the trees. "N asks only one thing. Do your Pokémon fight for you, or with you?"', [
      ch('Answer with empathy', out('You kneel to your Pokémon and speak. The soldier nods, and lets you pass with a gift.', fr(8), good(2), any('ether', 'full-restore', 'revive')), { check: 'love', fail: out('Your answer comes out stiff. He turns away.', fr(1)) }),
      ch('Answer by force', fight('"Then show me."', grunt('Plasma Soldier', 3, 2, [$(800), any(...HELD)]))),
    ]),
  ev('vt-flare-fashion-heist', 'Flare Fashion Heist', G, { stop: 'event', rarity: 'uncommon', minStage: 2, tint: '#34161c', effect: 'sparkle' },
    'Two Flare members dash off with your best accessory! A third waits at the corner, twirling a scarf.', [
      ch('Win it back', fight('"Fashion is a battlefield!"', grunt('Flare Grunt', 2, 1, [any('silk-scarf', 'shiny-stone'), $(400)]))),
      ch('Chase them (Speed)', out('You tackle the thief at the next corner and snatch it back.', fr(3), $(200)), { check: 'speed', fail: out('They are gone. You buy a replacement trinket.', $(-150)) }),
    ]),
  ev('vt-skull-dance-break', 'Skull Dance Break', G, { stop: 'event', rarity: 'common', minStage: 1, tint: '#241c34', effect: 'sparkle' },
    'A boombox thumps and Team Skull grunts form a circle. "Dance-off, yo! Win, and we bounce!"', [
      ch('Join the dance-off (rhythm)', out('You nail every beat. The crew dissolves, laughing.', $(500), fr(3)), { ...PR('echo-rhythm', 'good'), fail: out('You trip over your own feet. They keep the beat and the cash.', $(-100)) }),
      ch('Battle instead', fight('"Not into dancing? Fine, battle!"', grunt('Skull Grunt', 2, 0, [$(400)]))),
    ]),
  ev('vt-rocket-disguise-gig', 'Rocket Disguise Gig', H, { stop: 'hideout', rarity: 'rare', minStage: 2, tint: '#241418', effect: 'none' },
    'A spare grunt uniform hangs on a hook by the hideout gate. The guards do not look closely at faces.', [
      ch('Wear the uniform', out('You nod, grunt, and stroll inside. The loot room is open.', any(...RARE_HELD, ...BALLS), flag('vt-disguise-used', 1)), { requires: [flagIs('vt-disguise-used', 0, 0)] }),
      ch('Sabotage the gate', out('You snip the alarm wire as you pass. Nobody notices.', rp(15), good(1))),
      ch('Leave it', leave()),
    ]),
  ev('vt-double-agent', 'Double Agent', G, { stop: 'event', rarity: 'rare', minStage: 3, tint: '#1c1c28', effect: 'none' },
    'A villain you have fought before waits at the roadside, hat low. "I\'m done with them. Let me tag along for a while."', [
      ch('Accept the help', out('A short-term ally joins you for the next stretch.', join({ lv: 1 }), flag('vt-double-agent', 1), evil(1)), { requires: [party(1)] }),
      ch('Take a tip and say goodbye', out('They give you useful information.', rp(30), scout(3))),
      ch('Turn them in', fight('"A trap?! You\'ll regret it!"', grunt('Double Agent', 3, 2, [$(900), good(1)]))),
    ]),
  ev('vt-ransom-note', 'Villain Ransom Note', G, { stop: 'event', rarity: 'uncommon', minStage: 2, tint: '#2a2018', effect: 'none' },
    'A note pinned to a tree: "We have your item. ₽700, or come and get it." One of your bag\'s pockets is open.', [
      ch('Pay the ransom', out('You hand over cash. The item comes back with a smirk.', $(-700), item('potion')), { requires: [money(700), { kind: 'item', id: 'potion' }] }),
      ch('Go and get it', fight('The kidnappers are not happy to see you.', grunt('Item Thief', 3, 1, [any(...RARE_HELD), $(400)]))),
      ch('Forget it', leave('It was probably not that valuable.')),
    ]),
  ev('vt-meteorite-fakeout', 'Meteorite Fakeout', G, { stop: 'event', rarity: 'uncommon', minStage: 2, types: ['rock'], tint: '#241c24', effect: 'fire' },
    'Treasure hunters swarm a "meteor" glowing in the hillside. It is flat painted rock. The crooks wait for someone to dig.', [
      ch('Dig anyway', fight('"The fakeout worked!" The crooks pounce.', grunt('Crook', 2, 0, [any('star-piece', 'comet-shard', 'moon-stone')]))),
      ch('Warn the hunters', out('They thank you with a share of what they did find.', any(...STONES), good(1)), { check: 'charisma', fail: out('They do not listen.') }),
      ch('Tail the crooks', out('You follow them to their stash and lift a few things.', any('star-piece', 'nugget'), evil(1))),
    ]),
  ev('vt-vent-crawl', 'Hideout Vent Crawl', H, { stop: 'hideout', rarity: 'uncommon', minStage: 2, tint: '#1c1c20', effect: 'fog' },
    'Three vents lead off in three directions. You can hear voices, humming machinery, and the clink of coins.', [
      ch('Left vent: the voices', fight('You drop into a guard room.', grunt('Hideout Guard', 2, 1, [any('hyper-potion', 'full-heal')]))),
      ch('Middle vent: the machinery', out('A generator room. You pocket spare parts.', rp(25), any('metal-coat', 'magnet'))),
      ch('Right vent: the coins', out('A cash room. You take what you can carry.', $(900)), { chance: 0.6, fail: out('An alarm! You scramble back out the vent.', hurt(0.05)) }),
    ]),
  ev('vt-laser-maze', 'Laser Maze', H, { stop: 'hideout', rarity: 'rare', minStage: 3, types: ['psychic'], tint: '#2a0c14', effect: 'flicker' },
    'Red beams cross the corridor ahead. A vault door glows at the far end.', [
      ch('Psychic phases through', out('Your Psychic-type guides the team through the beams. The vault opens.', any(...RARE_HELD), $(700)), { requires: [ptype('psychic')] }),
      ch('Dodge the beams (Speed)', out('You wriggle between beams, right to the vault.', $(700)), { check: 'speed', fail: out('An alarm trips! Grunts rush the corridor.', hurt(0.08)) }),
      ch('Back away', leave()),
    ]),
  ev('vt-camera-swap', 'Security Camera Swap', H, { stop: 'hideout', rarity: 'uncommon', minStage: 2, tint: '#1c2024', effect: 'flicker' },
    'A wall of monitors flickers in the guard room. A tape deck sits under the desk, labeled "LOOP".', [
      ch('Loop the feed (Intelligence)', out('Guards watch an empty corridor. You walk right past.', rp(20), any(...BALLS)), { check: 'intelligence', fail: fight('The loop cuts out! Guards arrive.', grunt('Hideout Guard', 2, 1)) }),
      ch('Smash the monitors', fight('Alarms ring.', grunt('Hideout Guard', 3, 1, [$(600)]))),
    ]),
  ev('vt-password-lock', 'Password Lock', H, { stop: 'hideout', rarity: 'uncommon', minStage: 2, tint: '#1c2418', effect: 'none' },
    'A keypad glows on a steel door. Three notes are taped nearby: "Where we began." "First letter, last letter." "Count the badges."', [
      ch('Work out the code (Intelligence)', out('Click. The door swings open on a stash.', any('hyper-potion', 'revive'), $(500)), { check: 'intelligence', fail: fight('Wrong! The alarm brings guards.', grunt('Hideout Guard', 2, 1)) }),
      ch('Guess', out('A lucky guess! The stash is yours.', $(500)), { chance: 0.25, fail: fight('Wrong! The alarm brings guards.', grunt('Hideout Guard', 2, 1)) }),
      ch('Leave it', leave()),
    ]),
  ev('vt-boss-phone-call', 'Boss Phone Call', G, { stop: 'event', rarity: 'rare', minStage: 3, tint: '#1c1418', effect: 'flicker' },
    'A public phone rings by itself. A rasping voice: "I\'ve been watching you. Choose your words carefully."', [
      ch('Defy them', out('"We\'ll see." The line goes dead. They will remember this.', flag('vt-boss-defied', 1), good(1), rp(15))),
      ch('Plead for mercy', out('They laugh and promise not to go easy anyway.', flag('vt-boss-defied', 0), evil(1))),
      ch('Hang up', leave()),
    ]),
  ev('vt-disguised-merchant', 'Friendly Seller', G, { stop: 'merchant', rarity: 'uncommon', minStage: 2, tint: '#2a2218', effect: 'none' },
    'A friendly seller beams as you approach. Their prices are a little too good. Their boots are standard-issue.', [
      ch('Buy a deal (₽400)', out('The goods are fine. A grunt winks as you leave.', $(-400), any(...BALLS, 'great-ball'), evil(1)), { requires: [money(400)] }),
      ch('Unmask them', fight('"Oh no. The jig is up!"', grunt('Seller Grunt', 2, 1, [any(...BALLS), $(500)]), good(1))),
    ]),
  ev('vt-gadget-sabotage', 'Gadget Sabotage', G, { stop: 'event', rarity: 'uncommon', minStage: 2, types: ['steel', 'electric'], tint: '#1c2430', effect: 'flicker' },
    'A small villain drone buzzes behind you, blinking a camera light. It has been following for a while.', [
      ch('Destroy it', out('Your Pokémon smashes it. A circuit board falls out.', any('magnet', 'metal-coat'), rp(15))),
      ch('Dodge it (Speed)', out('You lose it in the trees.', rp(5)), { check: 'speed', fail: out('It follows you and snaps a photo.', hurt(0.03)) }),
    ]),
];

// ---------------- Batch B: hideouts, schemes and rogues (R209-R234) ----------------
export const VILLAIN_B: Json[] = [
  ev('vt-hostage-negotiation', 'Hostage Negotiation', G, { stop: 'event', rarity: 'rare', minStage: 3, tint: '#241820', effect: 'none' },
    'A grunt holds a trainer\'s Pokémon behind a crate. "One step closer and it\'s over!" Everyone is looking at you.', [
      ch('Bargain (Charisma)', out('You trade a favour for the Pokémon. Everyone walks away.', good(2), fr(4), $(-100)), { check: 'charisma', fail: fight('The deal collapses!', grunt('Hostage Taker', 2, 1)) }),
      ch('Bluff (Intelligence)', out('You pretend the police are circling. He bolts and drops everything.', good(1), $(400)), { check: 'intelligence', fail: fight('He calls your bluff!', grunt('Hostage Taker', 2, 1)) }),
      ch('Battle', fight('"Then I\'ll fight you!"', grunt('Hostage Taker', 3, 1, [any('revive', 'hyper-potion'), good(2)]))),
    ]),
  ev('vt-safehouse-raid', 'Raid on a Safehouse', H, { stop: 'hideout', rarity: 'rare', minStage: 3, tint: '#1c1418', effect: 'none' },
    'A shuttered house hums with villains. Room by room, a whole squad waits.', [
      ch('Take the squad one by one', fight('The first guard is waiting by the door.', grunt('Safehouse Squad', 4, 2, [$(1000), any(...RARE_HELD, 'rare-candy')]), evil(1))),
      ch('Call it in', out('The authorities handle the raid. A reward trickles in.', $(300), good(1))),
      ch('Walk on', leave()),
    ]),
  ev('vt-grunt-school', 'Villain Grunt School', G, { stop: 'event', rarity: 'uncommon', minStage: 2, tint: '#2a2418', effect: 'none' },
    'A class of nervous rookies in oversized uniforms cluster around a whiteboard. The teacher looks up: "Can you show them how it\'s done?"', [
      ch('Teach the class', out('You run a demo. The rookies are in awe and owe you a favour.', fr(3), flag('vt-grunt-favor', 1), rp(15), $(300)), { requires: [party(2)] }),
      ch('Sit in the back and listen', out('You learn a thing or two about villain tactics.', rp(20))),
      ch('Fight the teacher', fight('"Class dismissed! Battle!"', grunt('Grunt Instructor', 2, 1, [any(...BALLS)]))),
    ]),
  ev('vt-grunt-favor', 'The Rookies Return', G, { stop: 'event', rarity: 'uncommon', minStage: 3, callback: true, requires: [flagIs('vt-grunt-favor')], tint: '#2a2418', effect: 'sparkle' },
    'The rookies from the grunt school wave from the roadside, a gift basket in hand. "We remembered your lesson!"', [
      ch('Accept the gift', out('A basket of supplies from grateful rookies.', any('super-potion', 'revive', 'great-ball'), fr(2))),
      ch('Ask them to look away', out('They turn their backs while you pass the checkpoint ahead.', express())),
    ]),
  ev('vt-stolen-egg-lab', 'Stolen Egg Lab', H, { stop: 'lab', rarity: 'rare', minStage: 3, tint: '#201828', effect: 'sparkle' },
    'A lab full of incubators, some empty. One Egg sits in a villain\'s case, tagged "STOLEN".', [
      ch('Fight for the Egg', fight('The lab guard stands in front of the case.', grunt('Lab Guard', 3, 1, [{ kind: 'egg', species: [], types: [], levelBonus: 0, shinyMultiplier: 1, left: 3, unit: 'battle' }, good(1)]))),
      ch('Sneak it out (Speed)', out('You scoop the Egg and run. It\'s warm in your arms.', { kind: 'egg', species: [], types: [], levelBonus: 0, shinyMultiplier: 1, left: 3, unit: 'battle' }), { check: 'speed', fail: fight('The case alarm blares!', grunt('Lab Guard', 2, 1)) }),
    ]),
  ev('vt-experiment-gone-wrong', 'Experiment Gone Wrong', H, { stop: 'lab', rarity: 'uncommon', minStage: 2, tint: '#1c2a20', effect: 'fog' },
    'A wild Pokémon stumbles from a villain lab, glowing and twitching. A broken tank leaks behind it.', [
      ch('Capture it', fight('It lunges, confused and scared.', wild({ lv: 2, shiny: 2 })), ),
      ch('Cure it (Love)', out('You calm it down with a soft voice. The glow fades, and it follows you.', join({ lv: 1 }), fr(5)), { check: 'love', fail: fight('It panics and attacks!', wild({ lv: 2 })) }),
      ch('Leave it', leave('You hope someone finds it.')),
    ]),
  ev('vt-prison-break', 'Prison Break', H, { stop: 'hideout', rarity: 'rare', minStage: 3, tint: '#1c1c28', effect: 'rattle' },
    'Cages line the cellar wall. Each holds a scared Pokémon. A single key hangs on a hook by the guard.', [
      ch('Free them all', fight('The guard won\'t give up the key!', grunt('Warden', 3, 1, [join({ lv: 1 }), flag('vt-freed', 3), good(2)]))),
      ch('Free one quietly (Speed)', out('You pick a lock and one Pokémon slips out and follows you.', join({ lv: 0 }), flag('vt-freed', 1)), { check: 'speed', fail: out('The lock rattles. Nothing happens.') }),
    ]),
  ev('vt-mind-control-helmet', 'Mind Control Helmet', H, { stop: 'lab', rarity: 'rare', minStage: 3, types: ['psychic'], tint: '#241c34', effect: 'flicker' },
    'A Pokémon in a flashing helmet blocks the corridor, eyes glazed. A grunt works a console.', [
      ch('Break the helmet', fight('The controlled Pokémon attacks!', wild({ lv: 2, win: [join({ lv: 1 })] }))),
      ch('Hack the console (Intelligence)', out('The helmet pops off and the Pokémon shakes its head. It joins you.', join({ lv: 1 }), rp(20)), { check: 'intelligence', fail: fight('The console zaps back!', wild({ lv: 2 })) }),
      ch('Slip past', leave()),
    ]),
  ev('vt-pokeball-sting', 'Black Market Poké Ball Sting', G, { stop: 'event', rarity: 'uncommon', minStage: 2, tint: '#2a2418', effect: 'none' },
    'A man in a trench coat sells "special" Poké Balls out of a van. The ring is bigger than he lets on.', [
      ch('Bust the ring', fight('"Run!"', grunt('Smuggler', 3, 1, [item('ultra-ball', 3), item('great-ball', 3), good(1)]))),
      ch('Buy a few (₽600)', out('The balls are fine. Do not ask.', $(-600), item('ultra-ball', 2), evil(1)), { requires: [money(600)] }),
    ]),
  ev('vt-cargo-ship-ransack', 'Cargo Ship Ransack', H, { stop: 'event', rarity: 'rare', minStage: 3, types: ['water'], tint: '#0c1a2a', effect: 'rain' },
    'A freighter rocks at anchor. On its deck, a crew of villains dive for crates as waves crash over the rail.', [
      ch('Fight on deck', fight('The deck heaves under your feet.', grunt('Deckhand', 3, 2, [any(...TREASURE), any(...RARE_HELD), $(700)]))),
      ch('Wait for low tide', out('You come back after the crew leaves, and take a few loose crates.', any(...TREASURE), $(300))),
    ]),
  ev('vt-doom-clock', 'Doom Clock Bomb', H, { stop: 'hideout', rarity: 'rare', minStage: 3, tint: '#2a0c0c', effect: 'flicker' },
    'A red clock ticks down over a stack of crates. Two wires, one red and one blue, run from a dented box.', [
      ch('Defuse it (timing)', out('Snip! The clock stops. A relieved grunt thanks you from behind a barrel.', rp(30), good(1), $(500)), { ...PR('brace-hold', 'good'), fail: out('BOOM! A smoky bang rocks the room.', hurt(0.15), status('burn')) }),
      ch('Cut the red wire', out('The clock stops!', rp(20)), { chance: 0.5, fail: out('BOOM! A smoky bang rocks the room.', hurt(0.15)) }),
      ch('Run', leave('You back away, quickly.')),
    ]),
  ev('vt-fake-gym-front', 'Fake Gym Front', H, { stop: 'hideout', rarity: 'rare', minStage: 3, tint: '#201c2a', effect: 'none' },
    'The gym looks ordinary, but the sign is crooked and the trainers inside look nervous. A hidden stairwell door sits behind the trophy case.', [
      ch('Find the hidden stairs (Intelligence)', out('Behind the trophies, a stair leads down to a hideout stash.', any(...RARE_HELD), $(600), rp(20)), { check: 'intelligence', fail: fight('The trainers close ranks!', grunt('Fake Gym Trainer', 2, 1)) }),
      ch('Challenge the "leader"', fight('The fake leader smirks.', grunt('Fake Gym Leader', 3, 2, [$(800), good(1)]))),
    ]),
  ev('vt-spy-dead-drop', 'Spy Dead Drop', G, { stop: 'event', rarity: 'uncommon', minStage: 2, tint: '#1c2024', effect: 'none' },
    'A sealed envelope is wedged behind a loose brick. It is addressed to no one in particular.', [
      ch('Deliver it to the police', out('They are grateful, and pay you for it.', $(500), good(2))),
      ch('Deliver it to the villains', out('A shadow takes it from your hand and pays well.', $(900), evil(2))),
      ch('Read it and put it back', out('You learn where their next base is.', rp(25), scout(3))),
    ]),
  ev('vt-bounty-board', 'Villain Bounty Board', G, { stop: 'event', rarity: 'uncommon', minStage: 2, tint: '#2a2018', effect: 'none' },
    'A notice board lists bounties. One wanted poster carries a villain name and a reward.', [
      ch('Take the bounty (₽500 up front)', out('You sign the slip. The target will turn up later.', $(500), flag('vt-bounty', 1)), ),
      ch('Ignore it', leave()),
    ]),
  ev('vt-bounty-target', 'The Bounty Target', G, { stop: 'event', rarity: 'uncommon', minStage: 3, callback: true, requires: [flagIs('vt-bounty')], tint: '#2a2018', effect: 'none' },
    'The target from the bounty board steps from the shadows, ready to run.', [
      ch('Bring them in', fight('"You will never take me alive!"', grunt('Bounty Target', 3, 2, [$(1200), any(...RARE_HELD)]))),
      ch('Let them go', out('You tear the slip. They slip into the dark.', good(1))),
    ]),
  ev('vt-lockpick-lesson', 'Lockpick Lesson', G, { stop: 'event', rarity: 'uncommon', minStage: 1, tint: '#2a2018', effect: 'none' },
    'A retired burglar offers to teach you the craft over a cup of tea. "Never know when you will need it."', [
      ch('Learn to pick locks', out('Click, click. You have the knack.', flag('vt-lockpick', 1), rp(10))),
      ch('Politely decline', leave()),
    ]),
  ev('vt-locked-chest', 'A Locked Chest', G, { stop: 'event', rarity: 'uncommon', minStage: 2, callback: true, requires: [flagIs('vt-lockpick')], tint: '#2a2018', effect: 'glint' },
    'An old chest with a stubborn lock sits in a ditch. You smile and take out your picks.', [
      ch('Pick the lock', out('Click! The chest is full of treasure.', any(...TREASURE), any(...RARE_HELD))),
    ]),
  ev('vt-pyromaniac-sweep', 'Pyromaniac Sweep', G, { stop: 'event', rarity: 'uncommon', minStage: 2, types: ['fire'], tint: '#3a1808', effect: 'fire' },
    'A villain with a torch cackles as fire spreads across the field. Villagers shout for help.', [
      ch('Douse it with Water', out('Your Water-type floods the field. The villagers cheer.', $(500), good(2)), { requires: [ptype('water')] }),
      ch('Beat it out (Strength)', out('You stamp out the flames with a blanket.', $(300), good(1), hurt(0.05)), { check: 'strength', fail: out('The fire flares up, singeing your team.', hurt(0.1), status('burn')) }),
      ch('Take on the villain', fight('"Burn, baby, burn!"', grunt('Pyromaniac', 2, 1, [$(500), any('fire-stone', 'charcoal')]))),
    ]),
  ev('vt-magma-flood-valve', 'Magma Flood Valve', G, { stop: 'event', rarity: 'rare', minStage: 3, tint: '#2a1408', effect: 'fire' },
    'A great valve controls the lab\'s coolant. Flood the lab and everything dies. Drain it and the lab burns.', [
      ch('Flood the lab', out('Steam fills the air. The Fire-types are subdued, and so are yours.', relic('vt-flood', 'Flooded Lab', [{ kind: 'typeDamageMultiplier', type: 'water', value: 1.1 }, { kind: 'typeDamageMultiplier', type: 'fire', value: 0.9 }]))),
      ch('Drain the lab', out('Heat roars up from the vents. Fire burns brighter.', relic('vt-drain', 'Drained Lab', [{ kind: 'typeDamageMultiplier', type: 'fire', value: 1.1 }, { kind: 'typeDamageMultiplier', type: 'water', value: 0.9 }]))),
      ch('Leave it', leave()),
    ]),
  ev('vt-aqua-tide-turner', 'Aqua Tide Turner', G, { stop: 'event', rarity: 'rare', minStage: 3, types: ['water', 'ground'], tint: '#0c2a3a', effect: 'rain' },
    'A big dial on a tower controls the tide. Aqua wants it high, and Magma wants it low.', [
      ch('Turn the tide in', out('The sea rises and your Water-types feel strong.', relic('vt-high-tide', 'High Tide', [{ kind: 'typeDamageMultiplier', type: 'water', value: 1.1 }, { kind: 'typeDamageMultiplier', type: 'ground', value: 0.9 }]))),
      ch('Turn the tide out', out('The sea falls back and the land sings. Your Ground-types feel strong.', relic('vt-low-tide', 'Low Tide', [{ kind: 'typeDamageMultiplier', type: 'ground', value: 1.1 }, { kind: 'typeDamageMultiplier', type: 'water', value: 0.9 }]))),
      ch('Leave it', leave()),
    ]),
  ev('vt-gravity-well', 'Galactic Gravity Well', G, { stop: 'event', rarity: 'rare', minStage: 3, types: ['psychic', 'steel'], tint: '#14142c', effect: 'float' },
    'A device on a pole bends the light around it. Pebbles drift towards the next node ahead.', [
      ch('Smash the device', fight('Galactic guards rush out.', grunt('Galactic Guard', 2, 1, [any('metal-coat', 'magnet'), rp(15)]))),
      ch('Study it (Intelligence)', out('You jot down its design. It could be useful.', rp(35)), { check: 'intelligence', fail: out('It tugs at your pockets. A few coins drift away.', $(-150)) }),
    ]),
  ev('vt-banner-burn', 'Plasma Banner Burn', G, { stop: 'event', rarity: 'uncommon', minStage: 2, tint: '#1c2a34', effect: 'fire' },
    'A huge Plasma banner hangs over the plaza, with a rival\'s ad pinned to its corner. A match would do wonders.', [
      ch('Burn the banner', out('The banner goes up. Your rival is impressed.', flag('vt-rival-edge', 1), evil(1), rp(10))),
      ch('Take it down quietly', out('You fold it away. The authorities pay you for it.', $(300), good(1))),
      ch('Leave it', leave()),
    ]),
  ev('vt-team-neo', 'Team Neo Rookies', G, { stop: 'event', rarity: 'common', minStage: 1, tint: '#2a2a18', effect: 'sparkle' },
    'Three bumbling villains in very new uniforms trip over their own banner. "We are... Team Neo! Prepare for... something!"', [
      ch('Easy fight', fight('They send out one tiny Pokémon each.', grunt('Neo Rookie', 1, -2, [$(400), item('potion')]))),
      ch('Help them up', out('They are so grateful they give you their lunch money.', $(200), good(1), fr(2))),
    ]),
  ev('vt-grunt-union-strike', 'Grunt Union Strike', G, { stop: 'event', rarity: 'uncommon', minStage: 2, tint: '#2a2418', effect: 'none' },
    'Grunts picket the road with signs: "FAIR PAY FOR VILLAINY". They refuse to fight anyone. A clipboard waits for a signature.', [
      ch('Sign the petition', out('They wave you through and slip you a union perk.', express(), good(1))),
      ch('Cross the picket line', fight('"Scab!"', grunt('Picketer', 2, 0, [$(300)]))),
    ]),
  ev('vt-shady-surveyor', 'Shady Surveyor', G, { stop: 'event', rarity: 'uncommon', minStage: 2, tint: '#2a2018', effect: 'none' },
    'Four people mill around a market stall. One of them lifted a wallet just now. You saw something, but not clearly.', [
      ch('Spot the thief (Intelligence)', out('You point at the right one. He drops the wallet and runs.', $(400), good(1)), { check: 'intelligence', fail: out('You accuse a bystander. Awkward.', evil(1)) }),
      ch('Guess', out('Lucky! You nab the thief.', $(400), good(1)), { chance: 0.25, fail: out('Wrong person. Awkward.') }),
      ch('Mind your own business', leave()),
    ]),
  ev('vt-letter-mixup', 'Villain Letter Mix-up', G, { stop: 'event', rarity: 'uncommon', minStage: 2, tint: '#2a2018', effect: 'none' },
    'The postman hands you a letter addressed to a Team grunt. It orders a mission, a sealed bag, and a bonus.', [
      ch('Accept the mission', out('The bag holds a stolen item, and a note: "Bring it to the dock." You keep the bonus.', $(700), evil(2))),
      ch('Return it to the post office', out('The postman is relieved, and gives you a reward.', $(250), good(1))),
    ]),
  ev('vt-shadow-exchange', 'Shadow Pokémon Exchange', H, { stop: 'hideout', rarity: 'rare', minStage: 3, tint: '#1c0c2a', effect: 'fog' },
    'A dealer offers to lend you a Shadow Pokémon for a few battles. "It hits hard. Just keep it away from the light."', [
      ch('Borrow one', out('The Shadow Pokémon joins your party.', join({ shadow: true, lv: 1 }), evil(1))),
      ch('Refuse', leave()),
    ]),
  ev('vt-stakeout', 'Stakeout', G, { stop: 'event', rarity: 'uncommon', minStage: 2, tint: '#1c1c28', effect: 'none' },
    'A shady meeting is about to happen in the building across the street. You can wait and watch, or step in right now.', [
      ch('Wait and watch', out('You see the whole handoff. You can step in now, or let it pass.', rp(25), scout(2))),
      ch('Intervene', fight('You burst in on the handoff!', grunt('Courier', 3, 1, [$(700), any(...BALLS)]))),
    ]),
  ev('vt-contraband-detector', 'Contraband Detector', G, { stop: 'event', rarity: 'common', minStage: 1, tint: '#1c2024', effect: 'flicker' },
    'A gate scans your bag. A bored guard says: "Anything shady in there? Better be nothing."', [
      ch('Walk through', out('The gate beeps happily. Clean!', $(200), good(1)), { requires: [{ kind: 'meter', key: 'goodEvil', side: 'positive', atLeast: 0 }] }),
      ch('Talk your way past (Charisma)', out('The guard waves you through.', rp(5)), { check: 'charisma', fail: out('The alarm blares. You pay a small fine.', $(-200)) }),
    ]),
];

export const VILLAIN_EVENTS: Json[] = [...VILLAIN_A, ...VILLAIN_B];
// Unused imports kept for the next batch.
void [att, lose, lv, relic, status, wild, better, ev, has];
