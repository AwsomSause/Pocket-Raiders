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

export const VILLAIN_EVENTS: Json[] = [...VILLAIN_A];
// Unused imports kept for the next batch.
void [att, lose, lv, relic, status, wild, better, ev, has];
