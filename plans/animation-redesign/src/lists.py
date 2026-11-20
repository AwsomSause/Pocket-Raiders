"""Writes ../REANIMATE.md and ../NEW_ANIMATIONS.md from clips.json (node src/dump.cjs) plus the hand-written entries below. python3 src/lists.py"""
import json, collections, os
D = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'clips.json'))); C = {c['id']: c for c in D}
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '')
B = 'src/scenes/BattleScene.ts'; FX = 'src/ui/battleFx/'
# id: (need|want, where in the game)
R = {
 'sendout': ('want', 'src/ui/playerTrainer.ts:140, src/ui/aero.ts:76'), 'recall': ('need', B + ':5152'), 'attack': ('want', FX + 'battleFx.ts:367-424'), 'faint': ('need', B + ':5133'),
 'hpbar': ('want', 'src/ui/widgets.ts:547'), 'idle': ('want', 'src/ui/aero.ts:108'), 'switch': ('want', B + ':1606, 5179'), 'miss': ('want', B + ':5141'), 'encounter': ('want', FX + 'spectacle.ts:51'),
 'p-shiny': ('want', ''), 'lowhp': ('want', 'src/ui/widgets.ts:547'), 'levelup': ('want', FX + 'transitions.ts:10'),
 'types': ('want', FX + 'familyFx.ts:198'), 'telegraph': ('want', 'src/core/presentation/cues.ts (telegraph cue)'), 'stamps': ('want', FX + 'battleFx.ts:426'), 'bh-tiers': ('want', 'src/core/presentation/cues.ts:137'),
 'bh-charge': ('want', FX + 'cinematics.ts:848'), 'bh-crit': ('want', FX + 'skillMoments.ts:67'),
 'mf-close': ('want', FX + 'familyFx.ts:198, src/core/presentation/families.ts:39'), 'mf-shot': ('want', FX + 'familyFx.ts:198'), 'mf-element': ('want', FX + 'familyFx.ts:198'), 'mf-mind': ('want', FX + 'familyFx.ts:198'),
 'mf-self': ('want', FX + 'familyFx.ts:198'), 'mf-burst': ('want', FX + 'familyFx.ts:198'), 'mf-type': ('want', FX + 'familyFx.ts:198'), 'mf-reel': ('want', 'src/core/presentation/families.ts:39'),
 'heal': ('want', 'src/core/presentation/cues.ts:199'), 'st-brn': ('want', 'src/core/presentation/cues.ts:230'), 'st-psn': ('want', 'src/core/presentation/cues.ts:230'), 'st-par': ('want', 'src/core/presentation/cues.ts:230'),
 'st-slp': ('want', 'src/core/presentation/cues.ts:230'), 'st-frz': ('want', 'src/core/presentation/cues.ts:230'), 'st-cnf': ('want', 'src/core/presentation/cues.ts:217'),
 'w-rain': ('want', FX + 'weather.ts:44'), 'w-sun': ('want', FX + 'weather.ts:44'), 'w-sand': ('want', FX + 'weather.ts:44'), 'w-snow': ('want', FX + 'weather.ts:44'),
 'statup': ('want', FX + 'battleFx.ts:460'), 'ability': ('want', FX + 'abilityFx.ts:234'), 'protect': ('want', 'src/core/presentation/cues.ts (protect slot)'),
 't-intro': ('need', FX + 'spectacle.ts:51, ' + FX + 'vsScreens.ts:37'), 't-ace': ('need', B + ':5200'), 't-lose': ('want', B + ':1152'), 'catch': ('want', B + ':5560'),
 'mega': ('need', FX + 'megaScene.ts:42, ' + FX + 'cinematics.ts:331'), 'tera': ('need', FX + 'teraScene.ts:42'), 'dynamax': ('need', FX + 'dynamaxScene.ts:52, ' + FX + 'cinematics.ts:516'), 'zmove': ('need', FX + 'zMoveScene.ts:47, ' + FX + 'cinematics.ts:742'),
 'dmax-end': ('want', 'src/core/presentation/transformAnims.ts:15'), 'stadium': ('want', 'src/ui/galar/stadiumDirector.ts'),
 'ev-open': ('want', 'src/scenes/EventScene.ts, src/ui/redux/screens/event.ts'), 'ev-choice': ('need', 'src/ui/redux/screens/event.ts'), 'ev-result': ('want', 'src/ui/redux/screens/event.ts'), 'ev-reward': ('want', 'src/ui/redux/screens/event.ts'),
 'blessing': ('need', 'src/scenes/BlessingScene.ts'), 'starter': ('want', 'src/scenes/StarterSelectScene.ts'), 'wipe': ('want', 'src/ui/transitions.ts:19, ' + FX + 'spectacle.ts:312'), 'title': ('want', 'src/scenes/MainMenuScene.ts:100'),
 'map-travel': ('need', 'src/scenes/MapScene.ts:1460'), 'shop': ('want', 'src/ui/shopStyles/common.ts:105'), 'vs': ('want', FX + 'vsScreens.ts:37'), 'gym-intro': ('want', FX + 'spectacle.ts:51'),
 'legend': ('want', 'src/core/presentation/legendAnims.ts:12'), 'boss-phase': ('want', FX + 'spectacle.ts:366, ' + FX + 'arenaLife.ts:109'), 'boss-heal': ('want', 'src/core/presentation/cues.ts:199'),
 'cam-ko': ('want', B + ':2221'), 'sg-short': ('want', FX + 'cinematics.ts:81'), 'evolve': ('want', 'src/ui/evolutionScene.ts:237'), 'egg': ('want', 'src/scenes/DecisionScene.ts:697'),
 'trade': ('want', 'src/ui/tradeStyles/'), 'reward': ('want', 'src/ui/rewardStyles/'), 'bag-item': ('want', 'src/core/presentation/cues.ts:199'), 'msg': ('want', 'src/ui/dialogue/storyDialogue.ts:14, src/core/state.ts:2000'),
 'mc-calm': ('need', 'src/core/settingsRegistry.ts (battleAnimations and about 40 other switches)'), 'mc-skip': ('need', 'src/core/state.ts:2120 (fastMega, fastTera, fastDynamax, fastZMove)'),
}
SKIP = {'mc-battle', 'mc-event', 'mc-run'}
NOTE = {'t-intro': 'Kice note: use the trainer intro from the UI mockups.', 't-ace': 'Kice note: use the ace call from the UI mockups. Also the Ace rule: an ace must be announced.', 'mega': 'Kice note: remade five times (passes 16 to 20).', 'tera': 'Kice note: remade five times (passes 16 to 20).',
 'dynamax': 'Kice note: remade five times (passes 16 to 20).', 'zmove': 'Kice note: remade five times (passes 16 to 20).', 'blessing': 'Kice note: the original cutscene, remade holy. Overrides the UI mockups.', 'ev-choice': 'Kice note: the choice has a cutout of a text bar.',
 'map-travel': 'Kice note: smaller map that shows 8 stops with room to spare. Also fills a gap: paths are never drawn on today.', 'recall': 'Gap in the survey: no ball-return picture exists.', 'faint': 'Gap in the survey: no last-hit moment.',
 'mc-calm': 'Needed before anything is built: one rule for what Reduced and Off keep.', 'mc-skip': 'Needed before anything is built: one rule for skipping.',
 'raid-shield': 'Needs a rule first: raid bosses have no barrier in the game today.'}
GROUPS = ['Battle basics', 'After battle', 'Moves', 'Conditions', 'Trainers', 'Catching', 'Gimmicks', 'Galar', 'Bosses', 'Rivals', 'Villains', 'Camera', 'Impact', 'Light', 'Together', 'Signature', 'Arenas', 'Flow', 'Events', 'Side roads', 'Screens', 'World', 'Master Cut']
GNAME = {'Master Cut': 'Rules for the whole set', 'Signature': 'Short cuts', 'Together': 'Trainer and Pokémon together', 'Impact': 'Impact frames', 'Light': 'Light', 'Camera': 'Camera'}
# extra entries with no clip: (group, title, today, redesign, tag, where)
XR = [
 ('Battle basics', 'Damage number shown twice', 'Two parts of the code can each float a number for the same hit. The survey could not confirm whether both play.', 'One number per hit, from the Numbers and Stamps design (pass 5). Check and remove the second.', 'need', B + ':5039, 2230; ' + FX + 'battleFx.ts:426'),
 ('Camera', 'Opening reveal camera', 'At the start of a battle the camera pans for 0.9s at 1.7 times zoom while a veil fades.', 'Fold it into Entrance Camera (pass 16), so the opening and every later send-out use the same camera move.', 'want', FX + 'opening.ts:52'),
 ('Moves', 'Mastery flourish', 'Sparks and a shine ring on the target when a mastered move hits.', 'A mastered move plays its family startup one step bigger and its impact shape gets a gold edge, so mastery reads from the move itself.', 'want', FX + 'battleFx.ts:322'),
 ('Trainers', 'Last Resort and mentor scene', 'A full-screen mentor scene, then a moment.', 'Use the split screen from pass 19 (trainer on one half, Pokémon on the other) so it matches the gimmick scenes.', 'want', FX + 'mentorScene.ts, ' + B + ':3982'),
 ('Trainers', 'Player trainer moments (hit, win, defeat frames)', 'The player trainer has drawn frames for throw, recall, win, hit and defeat.', 'The frames stay. Trainer Reactions (pass 19) decides when each plays and adds the word chip.', 'want', 'src/ui/playerTrainer.ts:8'),
 ('Trainers', 'Trainer intro strips and boss poses', 'Intro strips play once at 12 frames a second and hold the last frame. 75 bosses are posed once.', 'The frames stay. After the last frame the trainer keeps a slow breathing loop instead of freezing.', 'want', 'src/ui/sprites.ts:175-208'),
 ('Moves', 'Heated and Hyper moments (23 story animations)', '23 named story animations (overdrive, interaction, rival, bond, drama), each timed on its own.', 'Re-time all 23 on the set\'s shared beats (wind-up, hit-stop, hold, release). Each of the five groups gets one colour and one shape.', 'want', 'src/core/presentation/storyAnims.ts, ' + FX + 'storyFx.ts:94'),
 ('Moves', 'Moment scene', 'Fade to black, static, then lines one at a time.', 'An iris closes on the Pokémon as in Event Opens (pass 9); the lines are typed with Message Rhythm (pass 23).', 'want', FX + 'momentScene.ts:132'),
 ('Conditions', 'The 8 ability animations', 'Eight registered ability animations share one banner and a few sparks.', 'Ability Trigger (pass 8) is the base. Each of the eight gets its own icon and one shape from the type kit.', 'want', 'src/core/presentation/abilityAnims.ts'),
 ('Bosses', 'Legend title cards (12 shapes)', 'Twelve title-card shapes, 1.2 to 1.6 seconds each.', 'Keep the twelve shapes. Each one opens with the Legendary Encounter beats (near black, eyes, colour flood), so the card ends the entrance and does not come before it.', 'want', 'src/core/presentation/legendAnims.ts:12, ' + FX + 'rivalStepIn.ts:115'),
 ('Gimmicks', 'Primal Reversion', 'Reuses the Mega crystal scene, 2.5 seconds.', 'Its own cut in the pass 20 style: the screen breaks into ancient-pattern slabs instead of glass.', 'want', FX + 'cinematics.ts:50'),
 ('Gimmicks', 'Shadow and purified aura', 'A burst in the aura colour and a 0.9 second pulse. (The survey was not sure this is main-game.)', 'Use the Totem Aura design (pass 13) in the shadow colour. Purifying plays it backwards and ends in the Blessing light.', 'want', B + ':2743, ' + FX + 'markAura.ts:72'),
 ('Gimmicks', 'What a gimmick leaves on the Pokémon', 'A Tera jewel bobs 4 pixels above the Pokémon. Mega and Dynamax leave nothing.', 'Each gimmick leaves one lasting sign on the Pokémon and on its plate, as in the pass 16 after-states.', 'want', B + ':1398'),
 ('Galar', 'Favour bar, banners, camera cuts and interview', 'The favour bar eases for 0.5s, a banner slides and holds, ten small moves on the cut art, then an interview.', 'All four join the Stadium Crowd design (pass 7): the bar moves with the crowd wave, banners unroll from the stands, the interview uses Trainer Call-out.', 'want', 'src/ui/galar/stadiumDirector.ts:264, 321; src/ui/galar/cutArt.ts'),
 ('Screens', 'Boot screen', 'A fish bobs every 0.6s and scales in.', 'The game opens with the Ball Wipe (pass 10), so the first thing you see is in the same language as the rest.', 'want', 'src/scenes/BootScene.ts:176'),
 ('Screens', 'Loading looks (9)', 'Nine loading looks that loop every 0.7 to 1.4 seconds.', 'Keep the nine. Put them on one 1.2 second beat and end each by handing off to the Next Stop Card (pass 10).', 'want', 'src/ui/loadingLooks.ts'),
 ('Screens', 'Title background clips and Press Start', 'Six video clips crossfade every 9 seconds. Press Start blinks.', 'The crossfade stays. Press Start breathes on the same 0.9 second beat as a Pokémon standing, instead of blinking.', 'want', 'src/ui/titleClips.ts, src/scenes/MainMenuScene.ts:158'),
 ('Screens', 'Screen transition styles', 'Four styles to choose from (fade, bounce, wipe, ripple). Battles always get a plain fade whatever is chosen.', 'One family: Ball Wipe into battles, a slanted wipe between screens, an iris for events. The setting picks the speed, not a different style.', 'want', 'src/ui/transitions.ts:19, src/main.ts:150'),
 ('Screens', 'Sheen sweep on every screen', 'A shine sweeps across every screen as it arrives.', 'Keep it only for screens that arrive with a win or a reward, so the shine means something.', 'want', 'src/ui/transitions.ts (sheenSweep)'),
 ('Screens', 'New UI page motion (about 55 CSS animations)', 'About 55 small animations in the new UI stylesheet, each timed on its own.', 'One timing table for the whole game (0.12s pop, 0.25s slide, 0.4s settle), so pages and battles move at the same speeds.', 'want', 'src/ui/redux/redux.css'),
 ('Screens', 'Settings', 'Five small tweens.', 'Switches flick, sliders show their effect live. Battle effects plays the Reduced Motion clip (pass 25) in a small window as you change it.', 'want', 'src/scenes/SettingsScene.ts'),
 ('Screens', 'Save Slots', 'Two small tweens; the three cards are simply there.', 'The three cards are dealt in. The one you pick opens like a trainer card and the others tuck behind it.', 'want', 'src/scenes/SaveSlotsScene.ts'),
 ('Screens', 'Trainer Select', 'Four small tweens.', 'The trainer you point at steps forward and plays its win frame; the others step back and dim.', 'want', 'src/scenes/TrainerSelectScene.ts'),
 ('Screens', 'Briefing', 'Two small tweens.', 'The lines stamp in one by one like a mission card, on the Message Rhythm beat.', 'want', 'src/scenes/BriefingScene.ts'),
 ('World', 'Hub Town: walking and the crowd', 'You walk a tile in 0.14s and run one in 0.075s. Townsfolk wander.', 'Speeds stay. The walker squashes a little on start and stop, and townsfolk turn to look as you pass.', 'want', 'src/ui/hubTown/townView.ts:284, src/ui/hubTown/crowd.ts'),
 ('World', 'Hub Town: day and night, growth, signs', 'A halo pulses with the time of day, growth shows sparkles, signs bob every 0.52s.', 'All three follow the Time of Day clock from pass 21, so the town and the battles share one sky.', 'want', 'src/ui/hubTown/townTime.ts:38, townGrowth.ts:42, indicators.ts:89'),
 ('World', 'Pocket Town folk', 'Folk walk a step in 0.34s at 7 frames a second.', 'Same rules as the Hub Town crowd.', 'want', 'src/ui/hubTown/pocketFolk.ts:139'),
 ('World', 'Map: halos, path sparks and depth', 'Reachable stops breathe, open paths carry light sparks, the layers shift a little.', 'Keep all three. The halos pulse in order along the path from where you stand, so the eye is led to the next stops.', 'want', 'src/scenes/MapScene.ts:764, 968-1025'),
 ('World', 'Map: healing stop', 'A green wash and 14 rising sparkles, 0.8 seconds.', 'Use the Healing family (pass 24): lights rise from each party icon in order and each bar fills as they pass.', 'want', 'src/scenes/MapScene.ts:546'),
 ('World', 'Map: the egg', 'The egg wobbles on the map.', 'The wobble gets stronger the closer the egg is to hatching, and matches the first beat of Egg Hatch (pass 22).', 'want', 'src/scenes/MapScene.ts:1180'),
 ('World', 'Map: welcome back', 'A banner pans for 0.9s and a dream blur clears when you resume.', 'The blur clears outward from your marker, then the Next Stop Card says where you were.', 'want', 'src/scenes/MapScene.ts:905, 1384'),
 ('Events', 'Pseudo-stage banner', 'A banner on the map.', 'The purple band from Event Stage Starts (pass 9), because a pseudo-stage always belongs to an event.', 'want', 'src/scenes/MapScene.ts:1388'),
 ('Events', 'Event screen styles (8)', 'Eight event styles with 3 to 12 small tweens each.', 'All eight use the same four clips (Event Opens, Choice, Result, Reward). A style changes colours and frames, not timing.', 'want', 'src/ui/eventStyles/, src/ui/redux/redux.css:133'),
 ('World', 'Shop screen styles (8)', 'Coins count up in 0.38s, a price pops, the stall shakes on a failed buy, a box slides.', 'All eight use the Poké Mart: Buying beats (hop off the shelf, basket bump, coins fly, SOLD).', 'want', 'src/ui/shopStyles/'),
 ('Screens', 'Party and summary panel', 'Sprites sway every 1.4s, hop in loops, and the panel fades shut. Eight party styles.', 'Party tiles pop in order like the Pause Menu. The Pokémon you point at plays its own Idle Style (pass 11).', 'want', 'src/ui/partyPanel.ts:418, 662'),
 ('Side roads', 'Run over (defeat or victory)', 'Ten small tweens on the end-of-run screen.', 'The map path dims stop by stop back to the start, your team walks off together, then the run\'s numbers count up one line at a time.', 'want', 'src/scenes/GameOverScene.ts'),
 ('Side roads', 'Hall of Fame', 'Three small tweens.', 'Each team member steps into a spotlight in order, with its level and the stop where it joined.', 'want', 'src/scenes/HallOfFameScene.ts'),
 ('Side roads', 'Credits', 'A plain roll with three tweens.', 'The run\'s stops scroll past as a road, with your team walking along it under the names.', 'want', 'src/scenes/CreditsScene.ts'),
 ('Side roads', 'Minigames', 'One shared screen with two tweens.', 'A three-beat count-in, score ticks that pop, and a finish stamp, the same for every minigame.', 'want', 'src/scenes/MinigameScene.ts'),
 ('Side roads', 'Legacy Gallery', 'Two small tweens.', 'Past trainers stand in a row; the one you pick steps forward and its team is sent out behind it, ace last.', 'want', 'src/scenes/LegacyGalleryScene.ts'),
]
# extra new animations with no clip: (group, title, idea)
XN = [
 ('Conditions', 'Screens stay up (Reflect, Light Screen)', 'A faint six-sided pane (the Barrier family, pass 24) stands in front of the side for as long as the screen lasts, and flashes each time it lowers a hit.'),
 ('Conditions', 'Tailwind stays', 'Thin crescents (the Wind family) keep crossing behind the side that has the wind.'),
 ('Conditions', 'Trick Room stays', 'The arena floor shows a tilted grid, and the Who Goes First strip (pass 23) runs backwards.'),
 ('Conditions', 'Leech Seed and binding stay', 'A small vine or ring stays on the Pokémon. The End-of-turn Damage tick (pass 3) travels along it.'),
 ('Conditions', 'Substitute', 'A doll drops in front of the Pokémon, takes the hit in its place, and bursts when it breaks.'),
 ('Conditions', 'Perish count', 'A number chip on the plate ticks down each turn with a bell.'),
 ('Conditions', 'Status icon lands on the plate', 'The icon pops onto the plate in the status colour, and shakes on any turn the status stops the Pokémon acting.'),
 ('Conditions', 'Stat stages stay on the plate', 'Small up and down chips stay on the plate after Stat Changes (pass 8) and count what is active.'),
 ('Conditions', 'Weather and terrain turn counter', 'A chip counts the turns left, flips each turn, and flashes on the last one before Weather Clears.'),
 ('Battle basics', 'Forced out (Roar, Whirlwind)', 'The target is dragged backwards into its ball. The next Pokémon is thrown out, not sent.'),
 ('Battle basics', 'Hit and run (U-turn, Volt Switch)', 'The user\'s dash ends inside its own ball, so there is no separate recall.'),
 ('Battle basics', 'Form change in battle', 'One beat: a snap, a ring in the type colour, and the plate updates. Used for a broken disguise and other mid-battle form changes.'),
 ('Battle basics', 'Transform', 'The user\'s outline wipes across into the shape of the target.'),
 ('Battle basics', 'Running away', 'The Pokémon is recalled (pass 1 Recall), the trainer turns, and the battle slides away with dust. A failed run is a stumble and a shake of the head.'),
 ('Battle basics', 'Battle menu buttons', 'Buttons press down two pixels and pop back. The four moves fan out in their type colours. No new look, motion only.'),
 ('Flow', 'Berry eaten', 'The berry pops out of the Pokémon\'s plate, takes two bites, and is gone, using the Held Items language (pass 23).'),
 ('Trainers', 'Trainers at rest', 'Trainers with a single still picture get breathing, a blink and a weight shift made in code, like Idle Styles for Pokémon (pass 11).'),
 ('Catching', 'Ball kinds open differently', 'Each kind of ball has its own burst colour and number of rings. Seal Case extras ride on top.'),
 ('Catching', 'New Pokédex entry', 'After a first catch, a card flips in and the silhouette fills with colour from the feet up.'),
 ('Catching', 'Nickname prompt', 'The name tag slides out of the ball and waits; the name is typed onto it.'),
 ('Screens', 'Prologue', 'Pictures slide like pages. Text uses Message Rhythm. The cold open ends on the Ball Wipe.'),
 ('Screens', 'Story scenes between stops', 'Confirm turns the page with a real page turn; the speaker\'s picture bounces once when they start a line.'),
 ('Screens', 'Memories', 'Journal entries slide in as photos pinned to a board. Picking one lifts it off the board.'),
 ('Rivals', 'Rival Rescue Plan', 'The rival steps in with the Trainer Call-out, the plan choices are dealt like Event Choice cards, and the readiness word stamps on.'),
 ('Screens', 'Preparation Desk', 'Pages slide like sheets on a desk. A modifier snaps onto the run card like a badge.'),
 ('Screens', 'Seed and codes', 'A typed seed rolls into place like a counter and locks with a click.'),
 ('Screens', 'Update log and tutorial', 'The update log unrolls from the top. In the tutorial a Rotom arrow hops to whatever it is talking about.'),
 ('World', 'Safari Park', 'Walking uses the Hub Town rules. A thrown ball uses the Catch arc, and bait and rocks get their own small arcs.'),
]
def passes(c): return 'pass %d' % c['first'] if c['first'] == c['last'] else 'pass %d, improved up to pass %d' % (c['first'], c['last'])
def build(kind):
    by = collections.OrderedDict((g, []) for g in GROUPS)
    for c in D:
        if c['id'] in SKIP: continue
        isR = c['id'] in R
        if (kind == 'R') != isR: continue
        tag, where = R.get(c['id'], ('', ''))
        by[c['g']].append(dict(t=c['t'], today=c['now'], idea=c['idea'], see='%s, clip "%s"' % (passes(c), c['t']), tag=tag, where=where, note=NOTE.get(c['id'], '')))
    if kind == 'R':
        for g, t, today, idea, tag, where in XR: by[g].append(dict(t=t, today=today, idea=idea, see='', tag=tag, where=where, note=''))
    else:
        for g, t, idea in XN: by[g].append(dict(t=t, today='No motion of its own was found in the survey.', idea=idea, see='', tag='', where='', note=''))
    return collections.OrderedDict((g, v) for g, v in by.items() if v)
def write(kind, name, title, intro):
    by = build(kind); n = sum(len(v) for v in by.values()); need = sum(1 for v in by.values() for e in v if e['tag'] == 'need'); mock = sum(1 for v in by.values() for e in v if e['see'])
    L = ['# ' + title, '', intro.format(n=n, need=need, want=n - need, mock=mock, nomock=n - mock), '', '| Section | Entries |', '|---|---|']
    for g, v in by.items(): L.append('| %s | %d |' % (GNAME.get(g, g), len(v)))
    L.append('| **Total** | **%d** |' % n); i = 0
    for g, v in by.items():
        L += ['', '## ' + GNAME.get(g, g), '']
        for e in v:
            i += 1; L.append('### %d. %s%s' % (i, e['t'], {'need': ' (need)', 'want': ' (want)'}.get(e['tag'], '')))
            L.append('- **Today:** ' + e['today']); L.append('- **%s:** ' % ('Redesign' if kind == 'R' else 'New animation') + e['idea'])
            L.append('- **See it:** ' + (e['see'] if e['see'] else 'no mockup yet, described only'))
            if e['where']: L.append('- **In the game:** `' + e['where'] + '`')
            if e['note']: L.append('- **Note:** ' + e['note'])
            L.append('')
    open(OUT + name, 'w', encoding='utf8').write('\n'.join(L).rstrip() + '\n'); return n, need, mock
r = write('R', 'REANIMATE.md', 'What to reanimate', 'Everything in the main game that already moves and should be animated again. {n} entries. Evil Mode and Dominion are left out, and so are Pokémon sprite frames, trainer throw frames and the move animation packs, which are kept as they are.\n\nEach entry says what the game does today, what the redesign does, where to watch it in the mockups (`index.html`, or the live page), and where the code is. **(need)** marks the {need} entries that have to change: your six notes, gaps where the game shows nothing useful, and the two rules everything else depends on. **(want)** marks the {want} that work today and would simply be better. {mock} entries have a mockup clip; {nomock} are described only.\n\nSuggested order to build: the two rules (Reduced motion, Skip) first, then your six notes, then Battle basics, then the rest in the order of this page.')
n = write('N', 'NEW_ANIMATIONS.md', 'New animations', 'Moments in the main game that have no animation of their own today: a line of text, a number, a hard cut, or nothing. {n} entries. Evil Mode and Dominion are left out.\n\nEach entry says what happens today, what the new animation is, and where to watch it in the mockups. {mock} entries have a mockup clip; {nomock} are described only. None of these changes a battle result: they only show what the game already decided. The one exception is marked with a note (Raid Barrier), because it would need a new rule.')
print(r, n, r[0] + n[0])
