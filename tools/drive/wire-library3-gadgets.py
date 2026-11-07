"""Batch A of "give every remaining picture a use": gadgets, travel and tools (map perks, lures, repels).

  python3 -I tools/drive/wire-library3-gadgets.py <repo>
"""
import os
exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'wire3_common.py')).read())

F = 'Map gadgets (Drive pack 3)'
once = lambda n=1: {'for': 'manual', 'count': n}
# ---- bikes and rides ----
add('bikeyellow', 'yellow-bike', 'Yellow Bike', F, 'Once per stage, from the map: ride two columns ahead, skipping one', 'rare', Y, 1, 'passive', perk({'perk': 'bicycle'}))
add('bikeaqua', 'aqua-bike', 'Aqua Bike', F, 'Once per stage, from the map: jump to any stop in the next column, even without a path', 'rare', Y, 1, 'passive', perk({'perk': 'acroBike'}))
add('bikev', 'bike-v', 'Bike V', F, 'Once per stage, from the map: ride past a wild Pokémon and still get its reward', 'epic', Y, 1, 'passive', perk({'perk': 'machBike'}))
add('ridepager', 'ride-pager', 'Ride Pager', F, 'From the map, 2 trips: call a ride and fly two columns ahead to any stop', 'epic', Y, 2, 'use', perk({'perk': 'airship'}, lasts=once(2)))
add('ladder', 'ladder', 'Ladder', F, 'Next fork: add a bridge to a "?" event', 'uncommon', Y, 3, 'use', perk({'perk': 'extraStop', 'kind': 'event', 'where': 'nextNode'}, lasts=NEXT))
# ---- digging and finding ----
add('miningkit', 'mining-kit', 'Mining Kit', F, 'Each wild battle on a Rock or Ground stage pays +₽20 per copy', 'uncommon', Y, 3, 'passive', perk({'perk': 'wildMoney', 'type': 'rock', 'amount': 20}, {'perk': 'wildMoney', 'type': 'ground', 'amount': 20}))
add('dowsingmachine', 'dowsing-machine', 'Dowsing Machine', F, 'One wild stop on each stage hides a Bag item, and the first draft shows 6 choices', 'epic', Y, 1, 'passive', perk({'perk': 'hiddenItem'}, {'perk': 'dowsing'}))
add('pokescanner', 'poke-scanner', 'Poké Scanner', F, 'The map shows the wild Pokémon waiting at the next stops and what is behind every "?" stop', 'epic', Y, 1, 'passive', perk({'perk': 'preview', 'what': 'wild'}, {'perk': 'revealEvents'}))
add('hitechearbuds', 'hi-tech-earbuds', 'Hi-Tech Earbuds', F, "Next \"?\" stop shows its outcome before you choose, and the next trainers' teams show on the map", 'rare', Y, 1, 'passive', perk({'perk': 'eventInsight'}, {'perk': 'preview', 'what': 'trainers'}))
add('soundtrackearbuds', 'soundtrack-earbuds', 'Soundtrack Earbuds', F, 'Battle music changes to Gen 1 style; +1 Charisma', 'uncommon', Y, 1, 'passive', perk({'perk': 'gbSounds'}))
add('bellmchn', 'bell-machine', 'Bell Machine', F, 'The map shows an omen for each fight you can walk to: calm, uneasy or dire', 'rare', Y, 1, 'passive', perk({'perk': 'omen'}))
# ---- phones, discs and computers ----
add('rotomphone', 'rotom-phone', 'Rotom Phone', F, 'From the map: fight a trainer from this stage again for double money', 'rare', Y, 1, 'passive', perk({'perk': 'rematch'}))
add('rotomcatalog', 'rotom-catalog', 'Rotom Catalog', F, 'Shops sell one item early, and everything is 5% cheaper', 'rare', Y, 1, 'passive', perk({'perk': 'earlyStock', 'count': 1}, {'perk': 'discount', 'percent': 5}))
add('remotepc', 'remote-pc', 'Remote PC', F, 'On the reward screen: swap one draft choice for a new one', 'uncommon', Y, 2, 'use', perk({'perk': 'rerollOne'}, lasts=once(2)))
add('pokemonboxlink', 'pokemon-box-link', 'Pokémon Box Link', F, 'On the reward screen: lock one choice so it is in the next draft too', 'uncommon', Y, 2, 'use', perk({'perk': 'lockOne'}, lasts=once(1)))
add('pokemoncenterdisk', 'pokemon-center-disk', 'Pokémon Center Disk', F, 'Next stage: one extra healing spot', 'uncommon', Y, 3, 'use', perk({'perk': 'extraStop', 'kind': 'heal', 'where': 'stage'}, lasts=NEXT))
add('savedisk', 'save-disk', 'Save Disk', F, 'Once per run, a wipe is undone: the fight restarts with your party healed', 'epic', Y, 1, 'passive', perk({'perk': 'safetyNet'}))
add('savearrow', 'save-arrow', 'Save Arrow', F, "Run History records this run's full map", 'common', Y, 1, 'passive', perk({'perk': 'journal'}))
add('datacable', 'data-cable', 'Data Cable', F, 'Next stage: the reward draft after each trainer has one extra choice', 'uncommon', Y, 3, 'use', perk({'perk': 'extraChoice'}, lasts=NEXT))
add('transmitter', 'transmitter', 'Transmitter', F, 'Once per stage, call home: your whole team heals 20%', 'uncommon', Y, 1, 'passive', perk({'perk': 'transceiver', 'heal': 0.2}))
add('xtransceiverred', 'x-transceiver-red', 'X Transceiver (Red)', F, 'Once per stage, call home: your whole team heals 30%', 'rare', Y, 1, 'passive', perk({'perk': 'transceiver', 'heal': 0.3}))
add('xtransceiveryellow', 'x-transceiver-yellow', 'X Transceiver (Yellow)', F, 'Once per stage, call home: your whole team heals 35%', 'epic', Y, 1, 'passive', perk({'perk': 'transceiver', 'heal': 0.35}))
add('powerplantpass', 'power-plant-pass', 'Power Plant Pass', F, 'The next stage: wild Pokémon are often Electric', 'uncommon', Y, 3, 'use', enc(STAGE, {'mod': 'types', 'types': ['electric'], 'percent': 50}))
add('snagmachine', 'snag-machine', 'Snag Machine', F, 'Every wild Pokémon is 1.2x easier to catch', 'rare', Y, 1, 'passive', enc(RUN, {'mod': 'catch', 'multiplier': 1.2}))
add('snagmachine1', 'snag-machine-1', 'Snag Machine Mk I', F, 'The next 5 throws are 1.5x easier', 'uncommon', Y, 3, 'use', enc({'for': 'throws', 'count': 5}, {'mod': 'catch', 'multiplier': 1.5}))
add('colressmachine', 'colress-machine', 'Colress Machine', F, 'Next 3 wild battles: you get a free turn', 'rare', Y, 3, 'use', enc(battles(3), {'mod': 'freeTurn'}))
add('synchromachine', 'synchro-machine', 'Synchro Machine', F, 'Your whole team gets +1 Speed in its next battle', 'rare', T, 3, 'use', boost(stage('spe', 1)))
add('stabilizer', 'stabilizer', 'Stabilizer', F, 'Your whole team cannot have its stats lowered for 8 turns of its next battle', 'uncommon', T, 3, 'use', boost({'kind': 'guard', 'turns': 8}))
add('magwand', 'mag-wand', 'Mag Wand', F, 'The next 3 wild battles show a Steel, Electric or Rock Pokémon', 'uncommon', Y, 3, 'use', enc(battles(3), {'mod': 'types', 'types': ['steel', 'electric', 'rock'], 'percent': 70}))
# ---- lures and repels ----
add('magneticlure', 'magnetic-lure', 'Magnetic Lure', F, 'The next 3 wild battles are often Steel or Electric', 'uncommon', Y, 3, 'use', enc(battles(3), {'mod': 'types', 'types': ['steel', 'electric'], 'percent': 60}))
add('infirepel', 'everlasting-repel', 'Everlasting Repel', F, 'Skip every wild battle on the next stage (the level still counts)', 'rare', Y, 2, 'use', enc(STAGE, {'mod': 'repel'}))
add('infirepeloff', 'everlasting-repel-off', 'Everlasting Repel (Off)', F, 'The next stage: wild Pokémon are 1 level higher and give 15% more EXP', 'uncommon', Y, 3, 'use', enc(STAGE, {'mod': 'level', 'amount': 1}, {'mod': 'exp', 'percent': 15}))
finish('gadgets')
