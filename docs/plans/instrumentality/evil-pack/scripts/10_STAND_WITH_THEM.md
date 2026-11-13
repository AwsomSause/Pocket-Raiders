# 10 — STAND WITH THEM: THE NINE ALLIED CLIMAXES

*The Inside Man version of each climax (`docs/STAND_WITH_THEM.md`). Every section assumes the player joined the team at Ignition, has reputation ≥ +45, and chose **[Stand with them]**. Sites, leaders, set pieces and rosters are the ones in scripts 01–09; this file only adds what changes. `{gymLeaderG}` is the Gym Leader (or Trial Captain) of the last Gym the player beat; `{rival}` is the run's rival.*

**Canon note.** The leaders and contacts here are canon characters; the dialogue and scenes are original. Species lists are my recall and are marked approximate; verify before shipping. The Hoenn section covers two flags (Aqua or Magma); the player picks one at Ignition and cannot hold both. The Galar section uses Macro Cosmos; Team Yell's comic flag (`yell.insideman`) does not unlock this route. The recurring trio (script 00) may decorate any of these sections as a cameo (Allied Strength +1, once per run); they never replace the Inside Man.

**Common beats in every section:** Phase 0 Internal Memo and Choice, Phase 1 Hold the Line (`alliedBattles` = 3–6), Phase 2 Carry Out the Plan (timer 12 turns), Phase 3 The Rival (variant roles in `STAND_WITH_THEM.md` §5), Phase 4 The Defender, Phase 5 The Verdict (Rise / Take the Throne / Turn). Rival lines are in `STAND_WITH_THEM.md` §5.1.

---

## 1. Kanto — Team Rocket: *The Silph Takeover, from the inside*

**Flag:** `rocket.insideman` · **Leader:** Giovanni · **Site:** `pr.kanto.silph-tower`

**Phase 0 — Internal Memo**
> **MEMO — EYES ONLY.** The Silph building is sealed at dusk. The Master Ball prototype goes to the President's floor. Police and Gym-aligned trainers will contest the lobby, the labs and the stairs. Hold all three. — *G.*
> **DOMINO** *(Commander)*: "You made it this far without getting caught. That's more than most of my staff. Try to keep the streak."

**Phase 1 — Hold the Line.** Defenders: Saffron Police (Normal/Fighting; their *Whistle* gives the first status move +1 turn, announced), Gym Trainers carrying search warrants.
**Phase 2 — Carry Out the Plan.** Seat the **Gate Locks** (2–3) on the lobby, lab and stair doors. Each lock takes 2 turns; police try to cut the power (a defender's KO on the carrier resets that lock). *Line (over the PA):* "Building sealed. Please remain where you are."
**Phase 3 — The Rival.** *Setting line:* the rival slips through the freight elevator, past a Silph scientist who has given up.
**Phase 4 — The Defender: {gymLeaderG}**, leading the police. Phase change at 50% ace HP: **Public Outcry** (the lobby crowd cheers; +10% damage for them for 3 turns, announced).
> **{gymLeaderG}:** "This city isn't yours. Give it back."

**The Verdict**
> **GIOVANNI:** "You held. I don't need loyalty. I need people who finish the job."

| Ending | Text | Effect |
| --- | --- | --- |
| **Rise** | "Executive. Your first task: do not let me down." | Executive rank. Region Allied-Occupied |
| **Take the Throne** | "You want the chair? It is not given. Prove it." *(Giovanni: Rhyhorn, Dugtrio, Nidoqueen, Nidoking, Persian, Rhydon (ace); Doctrine Earth Rule)* | You lead Rocket |
| **Turn** | You pull the Master Ball prototype from the case and hold it up. *"Not yours."* | Normal Phase 4; Rocket Hostile |

**If you fall.** *Giovanni:* "Another failure. The organization does not keep those."

---

## 2. Johto — Team Rocket (Return): *The Radio Tower, from the inside*

**Flag:** `rocket-return.insideman` · **Leader:** Archer · **Site:** `pr.johto.radio-tower`

**Phase 0 — Internal Memo**
> **BROADCAST ORDER.** At noon the Tower speaks. Every station, every frequency. Hold the lobby, the studio and the transmitter. Wait for the Boss's voice. — *Archer*
> **ARIANA** *(Executive)*: "It's quiet in here, isn't it? Enjoy it. Noon is going to be loud."

**Phase 1 — Hold the Line.** Defenders: Goldenrod Police and Radio Tower Guards (Electric/Steel; their *Static* gives the first Electric move +1 priority, announced), Gym Trainers who "heard the broadcast and came to end it".
**Phase 2 — Carry Out the Plan.** Hold the **Broadcast Keys** (3) in the studio. Each key takes 2 turns to seat; guards try to unplug them. The Tower hums louder with each key (Rocket Pokémon +5% per key, announced).
**Phase 3 — The Rival.** *Setting line:* the rival bursts out of the stairwell onto the studio floor, a dozen dead screens behind them.
**Phase 4 — The Defender: {gymLeaderG}**. Phase change at 50% ace HP: **Dead Air** (all sound moves are disabled for 2 turns on both sides, announced).
> **{gymLeaderG}:** "Pull the plug, Rocket. People are listening."

**The Verdict**
> **ARCHER:** "You held. I knew you would. The Boss will hear of this."

| Ending | Text | Effect |
| --- | --- | --- |
| **Rise** | "Executive. Welcome back to the family." | Executive rank |
| **Take the Throne** | "You'd lead what's left? Then lead it through me." *(Archer: Houndoom, Weezing, Crobat, Arbok, Murkrow, Honchkrow (ace); Doctrine Radio Rule)* | You lead the Rocket Return |
| **Turn** | You cut the cable and let the Tower go silent. | Normal Phase 4; Rocket Return Hostile |

**If you fall.** *Archer:* "The Boss is not coming. He never was."

---

## 3. Hoenn — Team Aqua / Team Magma: *The Awakening, from the inside*

**Flag:** `aqua.insideman` · **Alt flag:** `magma.insideman` · **Leader:** Archie (Aqua) or Maxie (Magma) · **Site:** `pr.hoenn.cave-of-origin`

**Phase 0 — Internal Memo**
> **(Aqua)** **ORDER OF THE TIDE.** At dawn the Orb is carried to the Cave of Origin. The Coast Guard and League-aligned trainers will come for the shaft. Hold the shaft. Hold the pool. — *Archie*
> **(Magma)** **ORDER OF THE FLAME.** At dawn the Orb is carried to the Cave of Origin. Rangers and League-aligned trainers will come for the shaft. Hold the shaft. Hold the vent. — *Maxie*
> **MATT** *(Aqua)* / **TABITHA** *(Magma)*: "You saw the plan. You stayed. That's the whole job."

**Phase 1 — Hold the Line.** Defenders: Sootopolis Guard (Water/Fighting; their *Cutter* gives the first Water move +1 priority, announced), Gym Trainers in raincoats.
**Phase 2 — Carry Out the Plan.** Light the **Orb Altars** (2–3) in the cave. Each takes 2 turns; defenders try to smother the flame or drain the pool. *Aqua:* pools fill each altar (Water moves +10% for Aqua Pokémon). *Magma:* vents flare (Fire moves +10% for Magma Pokémon).
**Phase 3 — The Rival.** *Setting line:* the rival slides down the shaft rope into a cave full of echoes.
**Phase 4 — The Defender: {gymLeaderG}**. Phase change at 50% ace HP: **Storm Cell** (the weather changes for both sides for 3 turns, announced).
> **{gymLeaderG}:** "The sea and the land aren't yours to fight over. Stand down."

**The Verdict**
> **ARCHIE / MAXIE:** "You held the shaft. The world will remember who was beside me."

| Ending | Text | Effect |
| --- | --- | --- |
| **Rise** | "Executive. Welcome to the new world." | Executive rank |
| **Take the Throne** | "You'd lead? Then let's see if the Orb listens to you." *(Archie: Mightyena, Crobat, Muk, Sharpedo, Sharpedo, Wailord (ace), or Maxie: Mightyena, Crobat, Weezing, Camerupt, Solrock, Camerupt (ace); Doctrine The Tide / The Flame)* | You lead Aqua or Magma |
| **Turn** | You drop the Orb into the pool and let the cave go still. | Normal Phase 4; Aqua or Magma Hostile |

**If you fall.** *Archie / Maxie:* "Tide's out. Flame's out. It's over. For you, anyway."

---

## 4. Sinnoh — Team Galactic: *The Spear Pillar, from the inside*

**Flag:** `galactic.insideman` · **Leader:** Cyrus · **Site:** `pr.sinnoh.spear-pillar`

**Phase 0 — Internal Memo**
> **DIRECTIVE.** Tonight we stand at the Pillar. The Chain will be set. Rangers, the Police and trained opponents will climb. Hold the stairs. Hold the altar. — *Cyrus*
> **SATURN** *(Second)*: "You read the directive. You didn't ask why. That's why you're still here."

**Phase 1 — Hold the Line.** Defenders: Mountain Rangers (Rock/Ice; their *Rope Line* pulls the first Pokémon they KO back one slot, announced), Gym Trainers and Mountain Rescue.
**Phase 2 — Carry Out the Plan.** Seat the **Chain Anchors** (2–3) on the Pillar steps. Each takes 2 turns; defenders cut the chains. Mars and Jupiter hold the flanks (an ally per anchor, announced).
**Phase 3 — The Rival.** *Setting line:* the rival crests the last step in a gale, hair whipped across their face.
**Phase 4 — The Defender: {gymLeaderG}**. Phase change at 50% ace HP: **Avalanche** (both sides' Rock/Ice moves +10% for 3 turns, announced).
> **{gymLeaderG}:** "Whatever he told you, it isn't worth the world. Stop."

**The Verdict**
> **CYRUS:** "You held the Pillar. In the new world, there will be no grief. Join me."

| Ending | Text | Effect |
| --- | --- | --- |
| **Rise** | "Commander. The Pillar is yours to keep." | Executive rank |
| **Take the Throne** | "You want my place? Then take the world with it." *(Cyrus: Honchkrow, Gyarados, Crobat, Weavile, Houndoom, Toxicroak (ace); Doctrine Cold Calculus)* | You lead Galactic |
| **Turn** | You cut the Chain with a rope axe and let the Pillar sing. | Normal Phase 4; Galactic Hostile |

**If you fall.** *Cyrus:* "Emotion is a flaw. You proved it."

---

## 5. Unova — Team Plasma: *The Frozen Crown, from the inside*

**Flag:** `plasma.insideman` · **Leader:** Ghetsis · **Site:** `pr.unova.giant-chasm`

**Phase 0 — Internal Memo**
> **PROCLAMATION.** At sunrise the Crown is raised. Police, Gym-aligned trainers and Rangers will come for the Chasm. Hold the bridge. Hold the relays. — *Lord Ghetsis*
> **ZINZOLIN** *(Second)*: "A sage's hands are small. Mine are cold. Now go."

**Phase 1 — Hold the Line.** Defenders: Chasm Rangers (Ice/Ground; their *Snowline* gives the first Ice move +1 priority, announced), Gym Trainers in parkas.
**Phase 2 — Carry Out the Plan.** Power the **Frost Relays** (2–4) along the bridge. Each takes 2 turns; defenders cut the cables. A blizzard hits every 3 turns (announced).
**Phase 3 — The Rival.** *Setting line:* the rival clambers over the last icy ridge, breath steaming.
**Phase 4 — The Defender: {gymLeaderG}**. Phase change at 50% ace HP: **Whiteout** (accuracy −10% on both sides for 3 turns, announced).
> **{gymLeaderG}:** "Whatever he freed you from, it's not worth this."

**The Verdict**
> **GHETSIS:** "You held. Good. A weapon that finishes its job is worth keeping."

| Ending | Text | Effect |
| --- | --- | --- |
| **Rise** | "Sage. Your Crown awaits." | Executive rank |
| **Take the Throne** | "You'd rule? Then stand where I stand." *(Ghetsis: Cofagrigus, Bouffalant, Seismitoad, Eelektross, Drapion, Hydreigon (ace); Doctrine The Liberator's Lie)* | You lead Plasma |
| **Turn** | You cut the relay to Kyurem and let it fall silent. | Normal Phase 4; Plasma Hostile |

**If you fall.** *Ghetsis:* "Hahaha! A fine ending. It is the one I wrote."

---

## 6. Kalos — Team Flare: *The Ultimate Weapon, from the inside*

**Flag:** `flare.insideman` · **Leader:** Lysandre · **Site:** `pr.kalos.geosenge-hq`

**Phase 0 — Internal Memo**
> **PROTOCOL — FLARE.** At dusk the Weapon is armed. Police, Gym-aligned trainers and the Prism Tower guard will come for the core. Hold the lobby. Hold the core. — *Lysandre*
> **MALVA** *(Second)*: "You've read the briefing. Good. Lysandre doesn't like repeating himself."

**Phase 1 — Hold the Line.** Defenders: Lumiose Police (Fire/Fighting; their *Siren* gives the first Fire move +1 priority, announced), Gym Trainers carrying warrants.
**Phase 2 — Carry Out the Plan.** Prime the **Weapon Nodes** (2–4) around the core. Each takes 2 turns; defenders try to short them. The core glows brighter with each node (Flare Pokémon +5% per node, announced).
**Phase 3 — The Rival.** *Setting line:* the rival steps off the lift onto the core catwalk, a hum rising under their feet.
**Phase 4 — The Defender: {gymLeaderG}**. Phase change at 50% ace HP: **Flare Burst** (Fire moves +10% for both sides for 3 turns, announced).
> **{gymLeaderG}:** "Beauty isn't worth this. Stop."

**The Verdict**
> **LYSANDRE:** "You held. The world will be more beautiful for it."

| Ending | Text | Effect |
| --- | --- | --- |
| **Rise** | "Commander. The new world has a place for you." | Executive rank |
| **Take the Throne** | "You'd lead? Then prove you can stay beautiful." *(Lysandre: Mienshao, Honchkrow, Pyroar, Gyarados (Mega, ace); Doctrine The Beautiful World)* | You lead Flare |
| **Turn** | You pull the core's rod and let the Weapon dim. | Normal Phase 4; Flare Hostile |

**If you fall.** *Lysandre:* "A fitting ending. Thank you for your service."

---

## 7. Alola — Team Skull / Aether Foundation: *The Beast of Paradise, from the inside*

**Flag:** `skull.insideman` · **Leader:** Lusamine · **Site:** `pr.alola.ultra-wormhole`

**Phase 0 — Internal Memo**
> **ISLAND NOTICE (CONFIDENTIAL).** At night the Gate opens. Skull will hold the beaches; the Foundation will hold the Paradise. Trial Captains and Rangers will try the stairs. Hold both. — *L. Mohn*
> **PLUMERIA** *(Skull Admin)*: "Guzma's gonna tell you it's his plan. It ain't. Don't say I said so."

**Phase 1 — Hold the Line.** Defenders: Trial Captains and Island Rangers (Water/Fighting; their *Island Call* gives the first Water move +1 priority, announced), Gym Trainers in sun hats.
**Phase 2 — Carry Out the Plan.** Prime the **Gate Pylons** (2–4) around the Wormhole. Each takes 2 turns; defenders try to short them. A spatial surge hits every 3 turns (announced).
**Phase 3 — The Rival.** *Setting line:* the rival leaps from the Skull van onto the Paradise deck, a crash of surf below.
**Phase 4 — The Defender: {gymLeaderG}**. Phase change at 50% ace HP: **Ultra Surge** (Psychic moves +10% for both sides for 3 turns, announced).
> **{gymLeaderG}:** "Whatever she promised you, it isn't worth the islands."

**The Verdict**
> **LUSAMINE:** "You held. You love beautiful things, don't you? Come, join me."

| Ending | Text | Effect |
| --- | --- | --- |
| **Rise** | "Foundation Executive. You will want for nothing." | Executive rank |
| **Take the Throne** | "You'd rule the Gate? Then show me you can hold it." *(Lusamine: Clefable, Lilligant, Milotic, Bewear, Mismagius, Clefable (Nihilego-bonded, ace); Doctrine Beauty Is Everything)* | You lead the Foundation |
| **Turn** | You pull the last Pylon and let the Wormhole close. | Normal Phase 4; Skull and Aether Hostile |

**If you fall.** *Lusamine:* "Hush. It's all over. I'll keep you safe now."

---

## 8. Galar — Macro Cosmos: *The Darkest Day, from the inside*

**Flag:** `macro-cosmos.insideman` · **Leader:** Chairman Rose · **Site:** `pr.galar.rose-tower`

**Phase 0 — Internal Memo**
> **MEMORANDUM (INTERNAL).** At dusk the Plant fires. The Tower hosts the broadcast. The League, Stadium Security and trained opponents will climb. Hold the lobby, the floors and the roof. — *Chairman Rose*
> **OLEANA** *(Secretary)*: "You've done well. I would tell you not to get comfortable, but you wouldn't listen."

**Phase 1 — Hold the Line.** Defenders: Stadium Security (Steel/Fighting; their *Whistle* gives the first status move +1 turn, announced), Gym Trainers in team scarves.
**Phase 2 — Carry Out the Plan.** Feed the **Pulse Relays** (2–5) around the tower. Each needs 2 turns; defenders pull the plugs. A surge hits every 3 turns (a Dynamax for 1 turn, up to the cap; announced).
**Phase 3 — The Rival.** *Setting line:* the rival shoulders out of the stairwell into a floor of neon and noise.
**Phase 4 — The Defender: {gymLeaderG}**. Phase change at 50% ace HP: **The Crowd Turns** (the crowd roars for the defenders: +10% damage for them for 3 turns, announced).
> **{gymLeaderG}:** "Fans came for a game, not a catastrophe. Play it clean."

**The Verdict**
> **ROSE:** "You kept the line. That is all I ever ask. A result is a product, and you delivered."

| Ending | Text | Effect |
| --- | --- | --- |
| **Rise** | "Director of Dynamax. Smile for the camera." | Executive rank |
| **Take the Throne** | "The Chair is yours if you can win it. I do love an upset." *(Rose: Escavalier, Klang, Perrserker, Copperajah, Duraludon (ace, Dynamax); Doctrine Corporate Dynamax)* | You lead Macro Cosmos |
| **Turn** | You pull the Plant's relay and air the whole plan. | Normal Phase 4; Macro Cosmos Hostile |

**If you fall.** *Rose:* "And that's the match. There will be no review."

---

## 9. Paldea — Team Star: *Starfall Street, from the inside*

**Flag:** `star.insideman` · **Leader:** Cassiopeia · **Site:** `pr.paldea.starfall-street`

**Phase 0 — Internal Memo**
> **CREW MESSAGE.** Tonight the Barrage runs. Five Starmobiles on the avenue. The Academy, the Gym Leaders and some very annoyed teachers will come. Hold the line. Don't hurt anyone. — *Cassiopeia*
> **GIACOMO** *(Boss, Segin Squad)*: "She trusts you. Don't make me explain what that means."

**Phase 1 — Hold the Line.** Defenders: Academy Staff (Psychic/Fairy; their *Pop Quiz* swaps the player's lead for 1 turn once, announced), Gym Trainers in Academy colors.
**Phase 2 — Carry Out the Plan.** Link the **Starmobiles** (2–5) along the avenue. Each needs 2 turns; staff try to snuff the engines. The crowd chants every 4 turns (both sides' Speed +10%, announced).
**Phase 3 — The Rival.** *Setting line:* the rival slides under a Starmobile, scraped and furious.
**Phase 4 — The Defender: {gymLeaderG}**. Phase change at 50% ace HP: **Reverse Time** (turn order reverses for 2 turns, announced).
> **{gymLeaderG}:** "They're kids. Be careful with them. Stand down."

**The Verdict**
> **CASSIOPEIA:** "You held the line. You listened. That is rarer than courage."

| Ending | Text | Effect |
| --- | --- | --- |
| **Rise** | "Boss of a new Base. Make it yours." | Executive rank |
| **Take the Throne** | "The chair is the last one in the room. Take it if you can carry it." *(Cassiopeia: Umbreon, Vaporeon, Flareon, Jolteon, Espeon, Glaceon, Sylveon (ace); Doctrine Star Barrage)* | You lead Team Star |
| **Turn** | You park your Starmobile across the avenue and shut the engine. *"Enough."* | Normal Phase 4; Team Star Hostile |

**If you fall.** *Cassiopeia:* "I'm so sorry. I didn't want it to end like this. Please don't hate us."
