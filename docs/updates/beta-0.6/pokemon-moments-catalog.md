# Pokémon Moments catalog (Beta 0.6)

129 moments, each tied to a species, line, group, type or role. Source of truth for `src/data/pokemonMoments.json`.

## Rules every moment follows
1. **One cinematic per battle.** Tier `landmark`/`major` are cinematic; the existing Moment Director allows 1 major per battle (cooldown 1) and landmark 3 per run. A refused cinematic still happens, shown as one plain line, so results never change. `minor` moments are one-line text, never a cinematic.
2. **Priority when several fire in the same battle** (highest first): runEnd > lethal > ally > start > low > super/crit > ko/enter/weather/status > rest/catch. Only the top one may be a cinematic; others become plain lines.
3. **Seeded roll.** Every chance is rolled on a new named stream `pmoment` seeded from `run.seed + battle index + mon uid + moment id`, so a roll never changes other rolls, and previews/animation never roll.
4. **Limits.** `battle` = at most once per Pokémon per battle; `run` = at most once per run (claim saved in the run, never applies twice). A once-per-run claim is spent even when the roll fails.
5. **Outcome vs animation.** Effects are applied by core rules; the screen/audio cue is a presentation cue only. Skip, reduced motion, disabled animations, and audio settings only change what is shown/heard, never the result.
6. **Fit.** Revive/survive moments obey existing run rules (Adventure checkpoints and Safety Net run first; a moment only fires when the run would truly end). Boss gimmick limits and Hyper/Overdrive limits (one Hyper change per side per turn) are unchanged; a Pokémon that already got a Hyper save this turn does not also get a moment save.
7. **Rarity.** Chance 5–15% = rare-ish minor; 15–30% = uncommon; 40%+ only when a condition (partner, trio, low HP) is also required; 100% only for once-per-run landmarks.

## Failure Will (NOT) Be Tolerated: detailed spec (moment #1)
- **Who:** constructs: Rotom, Magnezone, Golurk, Golett, Porygon2, Porygon-Z, Claydol, Metagross, Bronzong, Klinklang, Genesect, Cryogonal, Bastiodon, Probopass (any form), in the party when the run would end.
- **When:** the party is wiped and nothing else saves the run (no checkpoint, no Safety Net, no VS Recorder). If more than one construct is in the party, one roll for the whole party (50%), on the first construct in party order.
- **Roll:** 50% on stream `pmoment`. Once per run: the claim is stored in the run so reloading, replaying the same seed, or a second wipe cannot roll again.
- **Success:** no run-end screen. Screen fades to black, static and electrical crackle (about 1.2 s), then the robotic voice reads the four lines, then the Pokémon returns at its max HP x1.5 (healed fully) with **Overcharged** for the rest of that battle: each move has a one-turn cooldown (cannot be picked two turns in a row) and all five stats are doubled. The rest of the party stays fainted. The battle continues from the same turn.
- **Fail:** the normal run-end screen, unchanged.
- **Lines (voice clips supplied by Kice):** “Primary objective: protect father. Failed.” / “Secondary objective: save allies. Failed.” / “Backup objective: engaged.” / “This Pokémon.” / “Dead or alive.” / “Is mine.”
- **Presentation (built):** fade to black (0.9 s), short-circuit static clip, the Pokémon dark on the black screen while the lines play with subtitles, then after the last line its eyes open red, the flash clip plays, and the Metal Sonic theme (Kice's file) fades in over 2.5 s and loops until the battle ends. Skip or minimal animations keep the text and drop the waits. Video: /mnt/project-files/promo/pokemon-moments/failure-moment.mp4.
- **Audio:** all clips are Kice's own files, converted to ogg in `public/assets/audio/moments/`, listed in asset provenance; replace any file by name.

## Catalog by trigger
Columns: **id** · name · applies to · chance · limit · effect · tier · presentation (screen / audio / line).

### Run ends (party wiped, no checkpoint) (`runEnd`, 1)

- **failure-not-tolerated** · Failure Will (NOT) Be Tolerated · group:constructs(rotom,magnezone,golurk,golett,porygon2,porygon-z,claydol,metagross,bronzong,klinklang,genesect,cryogonal,bastiodon,probopass) · 50% · per run · Instead of the run-end screen: revive at 150% max HP (heal fully, then max HP x1.5 for the battle), gain Overcharged for the rest of the battle. Overcharged: every move has a 1-turn cooldown (cannot be used two turns in a row), all five stats x2. Ends when the battle ends. One claim per run, win or lose the roll. · landmark · Screen fades to black, static + electrical crackle 1.2 s, robotic voice reads 4 lines (see catalog notes), electric flare, Overcharged theme loop while active / stand-in voice + theme / "Primary Goal: Protect father. Failed."

### A hit would knock it out (`lethal`, 28)

- **stone-sturdy** · Stone Sturdy · line:geodude,onix,rhyhorn,larvitar,nosepass,aron,bonsly,roggenrola · 25% · per battle · Survive at 1 HP. · minor · Rock crack sfx, small shake / "Held together."
- **rock-pride** · Rock Pride · type:rock · 12% · per battle · Survive at 1 HP, Def +1. · minor · Dust puff / "Not today."
- **dragon-pride** · Dragon's Pride · type:dragon · 15% · per battle · Survive at 1 HP, Atk +2. · major · Cry + red vignette / "A dragon does not kneel."
- **ghost-between** · Between Worlds · type:ghost · 20% · per battle · Survive at 1 HP, Evasion +2. · major · Sprite fades to outline, whisper sfx / "It slipped between."
- **fighting-fuel** · Pain Is Fuel · type:fighting · 15% · per battle · Survive at 1 HP, Atk +1, Spe +1. · minor · Fist-clench sfx / "Hit me again."
- **eevee-promise** · Eevee's Promise · line:eevee,vaporeon,jolteon,flareon,espeon,umbreon,leafeon,glaceon,sylveon · 18% · per battle · Survive at 1 HP, heal 25% max HP. · major · Warm glow, soft chime / "Not yet. Not you."
- **starter-fire** · Starter's Spark · group:starters(final stages) · 15% · per battle · Survive at 1 HP, best attacking stat +1. · major · Trainer-call sfx, spark / "It remembers its first day."
- **fossil-roar** · Ancient Roar · group:fossils · 20% · per battle · Survive at 1 HP, Atk +1, Def +1. · minor · Deep roar, stone dust / "Older than fear."
- **baby-cry** · Tiny Cry · group:babies(pichu,togepi,riolu,munchlax,happiny,azurill,wynaut,cleffa,igglybuff,smoochum,elekid,magby,tyrogue,budew,chingling,bonsly,mime-jr,mantyke) · 20% · per battle · Survive at 1 HP, heal 20% max HP, foe Atk -1 (it hesitates). · minor · High cry, foe flinch / "The foe can't hit that."
- **pseudo-pride** · Pseudo-Legend Pride · group:pseudo-legendaries(dragonite,tyranitar,salamence,metagross,garchomp,hydreigon,goodra,kommo-o,dragapult,baxcalibur) · 22% · per run · Survive at 1 HP and heal 33% max HP. Once per run per Pokémon. · major · Aura ring, cry / "Built for this."
- **paradox-rewind** · Paradox Rewind · group:paradox(great-tusk,iron-treads,roaring-moon,iron-valiant,...) · 20% · per battle · Survive at 1 HP, restore 5 PP to every move. · major · Time-ripple wipe / "Rewound."
- **ultra-breach** · Breach · group:ultra-beasts · 20% · per battle · Survive at 1 HP, foe confused. · major · Rift sfx, purple tear / "It was never from here."
- **legend-duty** · Legendary Duty · group:legendaries · 30% · per battle · Survive at 1 HP, heal 50% max HP. · major · Gold flash, cry / "A legend is not so easily ended."
- **mythical-whisper** · Mythical Whisper · group:mythicals · 25% · per battle · Survive at 1 HP, cure all status conditions. · major · Soft choir / "The wish held."
- **bug-swarm** · Last Swarm · type:bug · 15% · per battle · Survive at 1 HP, Spe +2. · minor · Wing buzz / "They scatter... and return."
- **fairy-wish** · Last Wish · type:fairy · 15% · per battle · Survive at 1 HP; the rest of the party heals 10% max HP. · major · Star shimmer / "A wish for you."
- **steel-resolve** · Steel Resolve · type:steel · 15% · per battle · Survive at 1 HP, Def +1, SpD +1. · minor · Clang / "Bent, not broken."
- **ice-shell** · Ice Shell · type:ice · 15% · per battle · Survive at 1 HP, attacker Spe -1. · minor · Frost crack / "Frozen in place."
- **water-rebound** · Rebound Tide · type:water · 12% · per battle · Survive at 1 HP, heal 15% max HP. · minor · Splash / "Washed back up."
- **elec-overload** · Overload · type:electric · 12% · per battle · Survive at 1 HP, foe loses 20% of its max HP. · minor · Arc flash / "Zap!"
- **poison-defiant** · Poison Defiance · type:poison · 12% · per battle · Survive at 1 HP, attacker poisoned. · minor · Green bubble / "Toxic pride."
- **dark-cornered** · Cornered Beast · type:dark · 12% · per battle · Survive at 1 HP, Atk +1, Accuracy +1. · minor · Low growl / "It stopped running."
- **psychic-foresight** · Foresight · type:psychic · 12% · per battle · Survive at 1 HP, SpA +1, SpD +1. · minor · Eye glow / "It saw this coming."
- **grass-regrowth** · Regrowth · type:grass · 12% · per battle · Survive at 1 HP, heal 12% max HP, SpD +1. · minor · Leaf sprout / "Roots hold."
- **fire-last-blaze** · Last Blaze · type:fire · 12% · per battle · Survive at 1 HP, attacker burned 50%. · minor · Ember burst / "Burn bright."
- **normal-courage** · Ordinary Courage · type:normal · 10% · per battle · Survive at 1 HP, Atk +1. · minor · Plain thump / "Just a normal Pokémon."
- **flying-updraft** · Updraft · type:flying · 12% · per battle · Survive at 1 HP, Spe +1, evasion +1. · minor · Wind gust / "Caught the wind."
- **ground-dig-in** · Dig In · type:ground · 12% · per battle · Survive at 1 HP, takes half damage for the next 2 turns. · minor · Rumble / "Dug in deep."

### A teammate faints (`ally`, 10)

- **partner-fall** · Don't You Dare · group:duos(plusle,minun,nidoking,nidoqueen,volbeat,illumise,lunatone,solrock,latias,latios) · 40% · per battle · When its partner faints: Atk +1, SpA +1, Spe +1. · major · Cry together / "Its partner's cry fades."
- **latios-latias** · Eon Bond · species:latios,latias · 60% · per battle · When the other Eon faints: heal 30% max HP and +1 to all stats. · major · Twin cry echo / "They shared one heart."
- **pikachu-ash** · Cheer Up · species:pikachu,raichu · 25% · per battle · When an ally faints: ally-friendship +3, Spe +1. · minor · Pika cry / "Pika-pi!"
- **nidoking-queen** · Royal Pair · species:nidoking,nidoqueen · 70% · per battle · If the other royal is on your team and a teammate faints: Atk +1 / SpA +1. · minor · Crown ping / "For the pair."
- **legendary-birds** · Wings Together · species:articuno,zapdos,moltres · 50% · per battle · A fallen legendary bird of the trio: survivors +1 SpA, +1 Spe. · major · Triple screech / "Three become two, two become one."
- **lake-guardians** · Lake Trio Oath · species:uxie,mesprit,azelf · 50% · per battle · A fallen guardian: survivors heal 25% max HP. · major · Chime / "Will, Emotion, Knowledge."
- **legendary-beasts** · Beast Pack · species:raikou,entei,suicune · 50% · per battle · A fallen beast: survivors Atk +1, Spe +1. · major · Thunder, flame and water crash / "The pack runs on."
- **swords-justice** · Swords of Justice · species:cobalion,terrakion,virizion,keldeo · 50% · per battle · A fallen sword: survivors Def +1, Atk +1. · major · Blade ring / "Justice stands."
- **regis** · Regi Chain · species:regirock,regice,registeel,regigigas,regieleki,regidrago · 50% · per battle · A fallen Regi: survivors Def +1, SpD +1. · minor · Dot tones / "..."
- **tapu-guardians** · Island Guardians · species:tapu-koko,tapu-lele,tapu-bulu,tapu-fini · 50% · per battle · A fallen Tapu: survivors heal 20% max HP, terrain sets (matching). · major · Terrain shimmer / "The island answers."

### Battle starts / first send-out (`start`, 29)

- **pikachu-static** · Static Cling · line:pikachu,pichu,raichu · 12% · per battle · First foe is paralyzed at battle start. · minor · Spark sfx / "The air crackles."
- **gastly-grin** · Shadow Grin · line:gastly,haunter,gengar · 15% · per battle · First foe Accuracy -1. · minor · Laugh sfx / "It's grinning."
- **lucario-aura** · Aura Sense · line:riolu,lucario · 30% · per battle · Accuracy +1 and see the foe's moves for the battle. · minor · Aura ping / "It senses you."
- **sneasel-ambush** · Ambush Instinct · line:sneasel,weavile,sneasler · 20% · per battle · Spe +1 and the first move gains +1 priority. · minor · Claw glint / "Attack from the shadows."
- **growlithe-loyal** · Loyal Bark · line:growlithe,arcanine,houndour,poochyena,lillipup · 15% · per battle · Whole team: Atk +1 for 1 turn. · minor · Bark / "Fight together."
- **ditto-copy** · Perfect Copy · species:ditto · 25% · per battle · Copies the first foe's type(s) for the battle. · major · Goo shimmer / "Ditto becomes you."
- **smeargle-sketch** · Masterpiece · species:smeargle · 25% · per battle · Learns one move the foe knows (replaces slot 4) for the battle. · major · Brush strokes / "It sketched your move."
- **cubone-mourn** · Mourning Mask · line:cubone,marowak · 20% · per battle · Def +1, SpD +1. · minor · Hollow tone / "Its skull glints."
- **magikarp-splash** · Destiny Splash · species:magikarp · 5% · per run · A huge splash: every foe loses 10% max HP and gains nothing. Once per run. · major · Giant splash / "It just splashed. Strangely."
- **slowpoke-yawn** · Slow-Mo Insight · line:slowpoke,slowbro,slowking · 15% · per battle · Foe Spe -1, own SpA +1. · minor · Delayed splash / "Hm. Right."
- **mew-curious** · Curiosity · species:mew · 30% · per battle · Randomly learns 1 TM-learnable move for this battle (seeded). · major · Playful trail / "It wants to try that."
- **mewtwo-armored** · Armored Mind · species:mewtwo · 50% · per battle · SpA +1, SpD +1, immune to flinch. · major · Dark pulse ring / "Its mind is armor."
- **darkrai-nightmare** · Nightmare Veil · species:darkrai · 40% · per battle · Foes fall into Nightmare (lose 12% per turn while asleep). · major · Dark swirl / "Bad dreams."
- **arceus-judgment** · Plate of Judgment · species:arceus · 100% · per run · All stats +1 for the battle. Once per run. · landmark · Slow cry, light pillar / "The god arrives."
- **legendary-entrance** · Legendary Entrance · group:legendaries · 20% · per battle · Atk +1, SpA +1 for 3 turns. · major · Cry first, gold flash / "Its presence is felt."
- **mythical-grace** · Mythical Grace · group:mythicals · 20% · per battle · Evasion +1 for 3 turns. · minor · Sparkle / "Hard to touch."
- **ultra-rift** · Rift Presence · group:ultra-beasts · 25% · per battle · Foes' Accuracy -1 and they are flustered (confused 25%). · major · Rift hum / "Reality bends."
- **paradox-resonance** · Paradox Resonance · group:paradox · 25% · per battle · Highest stat +1. · minor · Glitch ripple / "Time is wrong."
- **pseudo-presence** · Pseudo Presence · group:pseudo-legendaries · 12% · per battle · Foe Atk -1. · minor · Cry / "They feel small."
- **fossil-awaken** · Fossil Awakening · group:fossils · 15% · per battle · Atk +1, Spe +1. · minor · Dust / "It remembers the age."
- **eevee-bond** · Eeveelution Bond · line:eevee,vaporeon,jolteon,flareon,espeon,umbreon,leafeon,glaceon,sylveon · 15% · per battle · All stats +1 if the player's party has 2+ Eeveelutions. · major · Chorus / "Siblings."
- **starter-trainers** · Partner Present · group:starters(final stages) · 18% · per battle · Atk +1 and +1 friendship at battle start. · minor · Trainer shout / "You and me."
- **baby-bravery** · Baby Bravery · group:babies · 20% · per battle · Def +1, SpD +1; foe underestimates it (-1 Acc). · minor · Giggle / "Too small to hit."
- **dragon-aura** · Dragon Aura · type:dragon · 8% · per battle · Atk +1 for 3 turns. · minor · Low roar / "Dragon's aura."
- **ghost-chill** · Chill Down Spine · type:ghost · 8% · per battle · Foe Atk -1 on first turn. · minor · Cold whisper / "A chill runs down."
- **dark-menace** · Dark Menace · type:dark · 8% · per battle · Foe loses 1 stage of Evasion; own crit stage +1. · minor · Low drone / "Menacing."
- **psychic-focus** · Psychic Focus · type:psychic · 8% · per battle · SpA +1 for 3 turns. · minor · Focus ring / "Calm mind."
- **fighting-spirit** · Fighting Spirit · type:fighting · 8% · per battle · Atk +1 for 3 turns. · minor · Kiai / "Fired up."
- **fairy-charm** · Fairy Charm · type:fairy · 8% · per battle · Foe Atk -1. · minor · Chime / "Charmed."

### HP first drops below the line (`low`, 20)

- **gyarados-rage** · Rage Rising · species:gyarados · 25% · per battle · Atk +2 at below 50% HP. · major · Roar, red tint / "Its eyes turn red."
- **snorlax-nap** · Power Nap · species:snorlax · 25% · per battle · At below 40% HP: sleeps 2 turns and heals 50% max HP. · major · Zzz bubbles / "It's... asleep?"
- **fire-last-stand** · Burning Bright · type:fire · 15% · per battle · At below 25% HP: Atk +1, SpA +1, burned status immunity. · minor · Flame flare / "Fire burns fiercest at the end."
- **water-rising** · Rising Tide · type:water · 15% · per battle · At below 25% HP: SpD +1, heal 10%. · minor · Wave / "The tide returns."
- **grass-chloro** · Photosynthesis Surge · type:grass · 15% · per battle · At below 25% HP in sun: heal 25% max HP. · minor · Leaf burst / "Soaking up the light."
- **elec-surge** · Last Surge · type:electric · 15% · per battle · At below 25% HP: Spe +2. · minor · Spark / "A last spark."
- **bug-swarm-low** · Swarm Strikes · type:bug · 15% · per battle · At below 25% HP: next Bug move +25% damage. · minor · Buzz / "Swarm!"
- **poison-toxic-blood** · Toxic Blood · type:poison · 15% · per battle · At below 25% HP: contact attackers get poisoned. · minor · Bubble / "Poison pulses."
- **rock-tank** · Rock Tank · type:rock · 15% · per battle · At below 25% HP: Def +2. · minor · Thud / "A mountain doesn't shake."
- **ice-flash-freeze** · Flash Freeze · type:ice · 15% · per battle · At below 25% HP: hail starts (3 turns). · minor · Frost wind / "Winter."
- **normal-resolve** · Normal Resolve · type:normal · 15% · per battle · At below 25% HP: Atk +1, Def +1. · minor · Clap / "Hang in there."
- **steel-adamant** · Adamant Will · type:steel · 15% · per battle · At below 25% HP: Def +1, SpD +1, immune to stat drops 2 turns. · minor · Ring / "Adamant."
- **ghost-haunt** · Haunting Frenzy · type:ghost · 15% · per battle · At below 25% HP: foe loses 10% max HP (curse). · minor · Chime / "A curse sets in."
- **fairy-moonlight** · Moonlight Mend · type:fairy · 15% · per battle · At below 25% HP: heal 15%. · minor · Chime / "Moon's blessing."
- **ground-quake** · Fault Line · type:ground · 15% · per battle · At below 25% HP: foes' Spe -1. · minor · Rumble / "The ground shifts."
- **flying-gale** · Gale Force · type:flying · 15% · per battle · At below 25% HP: Spe +1, evasion +1. · minor · Wind / "Caught a gale."
- **fighting-second-wind** · Second Wind · type:fighting · 15% · per battle · At below 25% HP: heal 15%, Atk +1. · minor · Breath / "Breathe in."
- **dragon-rage** · Dragon's Rage · type:dragon · 15% · per battle · At below 25% HP: Atk +1, SpA +1. · minor · Roar / "Rage."
- **psychic-mind** · Mind Over Matter · type:psychic · 15% · per battle · At below 25% HP: SpD +2. · minor · Hum / "Concentrate."
- **dark-desperate** · Desperate Gambit · type:dark · 15% · per battle · At below 25% HP: crit stage +2 for 2 turns. · minor · Heartbeat / "All in."

### It knocks out a foe (`ko`, 10)

- **pikachu-victory** · Victory Pose · species:pikachu · 20% · per battle · Spe +1 after a KO. · minor · Pose, jingle / "Pika!"
- **charizard-roar** · Victory Roar · species:charizard,charmeleon · 15% · per battle · Atk +1 after a KO. · minor · Roar / "It roars its triumph."
- **gengar-cackle** · Cackle · line:gastly,haunter,gengar · 15% · per battle · Foe loses 1 stage of Atk and SpA. · minor · Laugh / "Heh heh heh."
- **absol-disaster** · Omen Fulfilled · species:absol · 20% · per battle · Crit stage +1 after a KO. · minor · Low note / "It foresaw this."
- **lucario-flow** · Aura Flow · line:riolu,lucario · 20% · per battle · Heal 10% after a KO. · minor · Aura / "Aura flows."
- **scizor-precision** · Precision Strike · species:scizor,scyther · 15% · per battle · Acc +1 after a KO. · minor · Slice / "Precise."
- **shark-frenzy** · Blood in the Water · line:sharpedo,carvanha,wishiwashi,mareanie · 25% · per battle · Atk +1 and Spe +1 after a KO. · minor · Splash / "Frenzy."
- **hunter-pack** · Pack Hunt · line:growlithe,poochyena,houndour,lycanroc,zigzagoon,lillipup · 20% · per battle · Whole team Atk +1 for 2 turns after a KO. · minor · Howl / "The pack howls."
- **dragon-pride-ko** · Dragon Conquest · type:dragon · 10% · per battle · Heal 15% after a KO. · minor · Roar / "Conquest."
- **ice-chill-ko** · Cold Triumph · type:ice · 10% · per battle · Foes' Spe -1. · minor · Frost / "Cold."

### Switched in (`enter`, 5)

- **starter-entrance** · Starter Entrance · group:starters(final stages) · 15% · per battle · On switch-in: Atk +1. · minor · Cry / "Back in the ring."
- **legend-entrance** · Legendary Switch-In · group:legendaries · 25% · per battle · On switch-in: heal 10% and +1 SpA. · major · Cry first / "Present again."
- **wall-entrance** · Wall Reset · role:wall(def+spd>=240) · 15% · per battle · On switch-in: Def +1, SpD +1. · minor · Clang / "A wall rises."
- **glass-cannon-entrance** · Glass Cannon Smirk · role:glass-cannon(atk+spa>=260,hp<=70) · 15% · per battle · On switch-in: Atk +1 or SpA +1 (higher stat) but Def -1. · minor · Spark / "Dangerous."
- **support-entrance** · Helping Hand · role:support(heal/screen user) · 15% · per battle · On switch-in: whole team heals 5% max HP. · minor · Chime / "Here to help."

### Hit by a super-effective move (`super`, 6)

- **steel-no-effect** · Tough Skin · type:steel · 12% · per battle · After a super-effective hit: Def +1. · minor · Clang / "It held."
- **rock-hold** · Held The Line · line:graveler,golem,rhydon,rhyperior,tyranitar · 15% · per battle · After a super-effective hit: Def +1 and heal 5%. · minor · Dust / "Held the line."
- **ice-brittle** · Brittle Ice · type:ice · 12% · per battle · After a super-effective hit: Spe +1. · minor · Shatter / "Cracked, not broken."
- **bug-aggressive** · Bug Grit · type:bug · 12% · per battle · After a super-effective hit: Atk +1. · minor · Skitter / "Swarm angry."
- **grass-bend** · Bend Not Break · type:grass · 12% · per battle · After a super-effective hit: SpD +1. · minor · Rustle / "It bent."
- **normal-brush** · Brush It Off · type:normal · 12% · per battle · After a super-effective hit: heal 8%. · minor · Pat / "Shook it off."

### Takes a critical hit (`crit`, 2)

- **fighting-spite** · Spite · type:fighting · 25% · per battle · After taking a critical hit: Atk +1 and crit stage +1. · minor · Growl / "That hurt."
- **dark-grudge** · Grudge · type:dark · 25% · per battle · After a crit: foe loses 8% max HP. · minor · Hiss / "It will remember."

### Weather starts (`weather`, 4)

- **sunny-day-fire** · Solar Joy · type:fire · 20% · per battle · When sun starts: Spe +1. · minor · Fanfare / "Burning bright."
- **rain-dance-water** · Rain Dance · type:water · 20% · per battle · When rain starts: SpA +1. · minor · Drum / "Rain dance."
- **sand-rock** · Sandstorm Strength · type:rock · 20% · per battle · When sand starts: SpD +1. · minor · Gust / "Wind-hardened."
- **hail-ice** · Hail Hail · type:ice · 20% · per battle · When hail starts: Atk +1. · minor · Frost / "Home turf."

### Gets a status condition (`status`, 4)

- **poison-tolerance** · Poison Tolerance · type:poison · 30% · per battle · When poisoned: cures after 1 turn instead. · minor · Hiss / "Immune system."
- **fire-thaw** · Heat Wave · type:fire · 30% · per battle · When frozen: instantly thaws. · minor · Hiss / "Melted."
- **psychic-clear** · Clear Mind · type:psychic · 20% · per battle · When confused/asleep: cures. · minor · Ring / "Clear."
- **normal-hold** · Hold On · type:normal · 20% · per battle · When statused: Def +1. · minor · Pat / "Hold on."

### Rest node (no battle) (`rest`, 8)

- **snorlax-rest** · Lazy Afternoon · species:snorlax · 100% · per run · At the next rest node: +8 friendship and a free berry. · minor · Snore / "Snuggle."
- **pikachu-spark-night** · Spark Night · species:pikachu · 40% · per run · At rest: +5 friendship, charges item. · minor · Soft spark / "Pika-pika."
- **eevee-curl** · Curl Up · species:eevee · 40% · per run · At rest: +5 friendship. · minor · Purr / "Cuddle."
- **fire-campfire** · Campfire Tale · type:fire · 25% · per run · At rest: whole team +2 friendship. · minor · Crackle / "Warm."
- **ghost-story** · Ghost Story · type:ghost · 25% · per run · At rest: reveals one hidden event hint. · minor · Whisper / "A tale."
- **water-song** · Water Song · type:water · 25% · per run · At rest: heal 10% to all. · minor · Lullaby / "Soothing."
- **grass-sprout** · Seed Sprout · type:grass · 25% · per run · At rest: free berry. · minor · Rustle / "A sprout."
- **psychic-dream** · Dream Walk · type:psychic · 25% · per run · At rest: +1 level progress (EXP). · minor · Chime / "A dream."

### Joins the party (`catch`, 2)

- **ditto-join** · Ditto Delight · species:ditto · 100% · per run · On joining: gets a one-time trait roll. · minor · Squelch / "It's... you?"
- **legend-joined** · Legend Joins · group:legendaries · 100% · per run · On joining: team heals fully, +10 friendship. · landmark · Cry first, gold / "A legend joins your side."

## Build batches
- **Batch 1 (this PR):** framework (schema, data file, `pmoment` stream, once-per-run claim, priority picker), Failure Will (NOT) Be Tolerated + Overcharged, all `lethal` moments (28).
- **Batch 2:** `start` and `enter` moments (34).
- **Batch 3:** `low`, `ko`, `super`, `crit` (38).
- **Batch 4:** `ally`, `weather`, `status` (18).
- **Batch 5:** `rest` and `catch` (10).

## Open questions (recommendation in bold)
1. Is "constructs" the right group for Failure Will? **Yes; it is data, Kice can add or remove species.**
2. Metal Sonic audio: **Kice's own files are used (confirmed by Kice, 2026-11-13).** No stand-ins.
3. Should enemy Pokémon get moments? **No in batch 1 to 3 (player side only); enemy bosses already have Hyper rage.**
