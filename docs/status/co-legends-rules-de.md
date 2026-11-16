# Catalog Overhaul batch 5, rows D+E: rival hooks, same-run PAST ALLIES, rivals bookkeeping

33 ids from `/mnt/project-files/plans/catalog-overhaul/OPEN_IDS.md` rows D and E, plus the six rivals bookkeeping ids.
Kice's run memory rule: memory only inside the run it happened in. Every Past Ally here reads THIS run, never an earlier one.

## What the player gets
- **Rival hooks.** The Echo Chamber plays back real lines your rivals said to you this run. Honors Day (your rival judges you), An Old Face on the Road (train, spar, or an honest trade of two raised Pokémon), A Rival Match to Cheer (cheer one rival on against the other; the cheered side starts with +1 Attack and Sp. Atk). All gated by the rival's Lead, Marks and feelings, with personality lines.
- **Drama moments** (The Unfinished Grudge, The Rematch Reversal, Pokémon Recognition, The Rival Interruption) now read the rival's scouting ledger, Marks and feelings, speak a line from the rival's own dialogue bank, and leave a mark on the relationship (a watching rival scouts your team).
- **Past Allies, same run.** The Hall rebuilds your best team of this run, or the team that lost a big battle, or the rival team you last beat. The Archive hangs this run's big battles as frames (fight your earliest or best). A stranger and a veteran (Arlen, with a Garchomp or a Lucario) read about your fall earlier this run. Arlen's partner fights beside you (3 battles, or the rest of the region; may join you next region). The Lost-and-Found Desk returns the item an event took. The Ranch Keeper's Egg comes from a Pokémon you left this run and hatches knowing its most-used move. The Legacy Pedestal keeps one item; the young trainer who took it pays it back next region. A Friend for the Road walks one stage with you.
- **Six rival beats rebuilt** (The Rival's Opinion, Rival's Defeat, Rival's Victory, A Berry for the Road, The Victory Lap, Their Spot): gated by Lead, Marks and feelings; they give the pack's Marks *The Hand Up* and *Left Standing*.

## Engine pieces (shared)
| Piece | Where | Use |
|---|---|---|
| Frames of this run (`story.replays`: Gym, Elite, Champion, rival, nemesis fights, won or lost) | `src/core/co/pastAllies.ts` | condition `{ kind: 'pastAlly', has: 'won' / 'fell' / 'earliest' / 'best' / 'rival' / 'second' / 'echoes' / 'lostItem' / 'left' / 'pedestal' / 'ranchReleased' }`; trainer field `pastAlly: <pick>`; trainer `ally: 'past'` |
| Text tokens | same | `{pa:won}` `{pa:fell-where}` `{pa:best-team}` `{pa:rival-foe}` `{pa:frames}` `{pa:echo1..3}` `{pa:lost}` `{pa:ranch}` `{pa:starter}` (filled through `fillCoText`) |
| `pastAlly` effect | `src/core/co/pastAlliesEffects.ts` | `returnItem`, `egg` (`now` for the kept Egg), `pedestal` (`item`), `pedestalThanks` |
| Named tag partner | `tagPartner` `species`, `region`, `boost` (run.ts `joinTagPartner`) | Arlen's Garchomp at your lead's level |
| Rival honest trade | `honestTrade` `rival: true` (`core/co/tradeCard.ts rivalGives`) | the rival's newest non-ace from your last battle, with its moves that day |
| Lead gate | `rivalQuest` condition `lead: { atLeast, atMost }` | |
| Drama hooks | `src/core/drama/rivalHooks.ts` | grudge, scouted move, scouted species, watcher scouting |

No save bump: everything lives in run flags and existing fields.

## Re-read table (doc vs build, checked 2026-11-16)
| Id | Doc / section | Built as | Checked |
|---|---|---|---|
| mr-rival-echoes | ledger: Rival Archive, real lines this run | event, `{pa:echo}` from the rival bank keys said | 2026-11-16 |
| face-rival-honors | ledger: into the RIVALS questlines | rival beat (slot), Lead variants, personality lines | 2026-11-16 |
| face-rival-shopping | ledger: into the RIVALS questlines | merged into R14 Emptied Shelves (`rival-buyout`) | 2026-11-16 |
| kieran-rivalry | ledger: into the RIVALS questlines | merged into R16 meeting 1 (`rq-kieran-1`) | 2026-11-16 |
| old-rival-old-friend | ledger: swap is an honest trade of two raised Pokémon | rival beat; `honestTrade rival` (Trust 4+) | 2026-11-16 |
| cheer-rival-match | ledger: cheering moves both rivals' axes | rival pair scene; R11 watched fight with the cheer bonus | 2026-11-16 |
| rivalInterruption, unfinishedGrudge, rematchReversal, pokemonRecognition | ledger: scouting ledger, Marks, dialogue bank | rule: `core/drama/rivalHooks.ts` | 2026-11-16 |
| cameo-ally-assist | ledger: a trainer from earlier | the trainer of this run's newest big win, their ace as your ally | 2026-11-16 |
| ng-plus-old-friends | ledger: read the Witness the Rest record | the stranger read this run's record (a win, or the fall variant) | 2026-11-16 |
| ghost-trainer-reunion | ledger: PA1 The Ones You Left | merged into `gn-new-13-door` (Greenneedle, already same-run) | 2026-11-16 |
| champion-defense, retired-team, rivals-friend | ledger: the Hall rebuilds a team, won or lost | `pastAlly` best / fell / rival | 2026-11-16 |
| archive-gauntlet-entry | PA7 The Archive | earliest / best / just look (captions) | 2026-11-16 |
| lost-and-found-desk | ledger: an item from the past | the item a random loss took this run | 2026-11-16 |
| companion-recruit | ledger: a companion who walks a stage | `wandererFriend` 1 stage (patches once per fight) | 2026-11-16 |
| rk-anniversary-archive, rk-hall-of-records, rk-memory-lane | ledger: a place where past runs are visible | this run's frames; the note is read by the Hall | 2026-11-16 |
| rk-legacy-pedestal | ledger: passes one item on | leave a Potion or Poké Ball; paid back next region | 2026-11-16 |
| rk-coin-vault | ledger: save-level research fund | research (save-level) for coins | 2026-11-16 |
| cameo-veteran-garchomp, cameo-veteran-lucario | PA5 The Veteran Returns | full script, Tell me room, three answers, joins next region | 2026-11-16 |
| legacy-ranch | PA8 The Ranch Keeper | Take / Which one? / Keep it here, all Remembers | 2026-11-16 |
| rival-views, ev-rivals-defeat, ev-rivals-victory, rival-berry-boss, rival-gloat, rival-grudge-spot | ledger "Rivals": beats gated by Lead, Marks, axes, personality versions | `tools/events/co/rivals-8.ts` | 2026-11-16 |

## Known limits (the same-run reading)
- PA5: "another road, another run" becomes a fall earlier in this run; the "same Garchomp, older" Remembers is your own Garchomp line meeting Arlen's.
- PA7: "A frame for this run, filled in at the end" shows as an empty frame with your name on a second visit; there is no end-of-run frame screen.
- PA8: "the hatchling is one level higher for each run it waited" becomes one level higher for the region it waited.
- Rival Report entries are not part of these scenes.
- Old pedestal choices left a Rare Candy or Nugget, which are instant rewards and never sat in the bag (the choice could never be taken); it now takes a Potion or a Poké Ball.
