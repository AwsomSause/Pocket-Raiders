# Overhaul slice 23: event chains

The pack's 180 event chains (389 stages, 822 options) are now ordinary map events (`core/overhaul/chains.ts`, built when content loads; switch: `balance.overhaulChains.enabled`).

- Stage 1 is a normal stop (rarity: common/uncommon/rare, very rare and unique count as epic). Later stages are "callback" events: they show on a later stage once you took a continuing option of the stage before (flag `ovc-<stage>`). Walking away (ignore, leave, retreat...) ends the chain. Each option also records its pack flag as `ovp-<flag>` for later systems.
- Outcome text is mapped by keywords to real effects: coins, berries, healing and rare items from the real item catalog, TMs, eggs, friendship, luck, research, wild and trainer battles. Of 822 options: 186 pay something, 66 start a battle, 264 are "nothing", 306 are story-only (text and flag, no reward).
- The 20 legendary chains start at stage 7 or later and only one can start per run (`ovc-legend`). Their last "Battle" option is a wild fight with the chain's real Legendary(s) (`LEGEND_SPECIES`). There are no Mythical chains.
- No save change, no new RNG stream.

Limits: the timing windows (min/max nodes between stages) are not used, a follow-up shows on the next stage that qualifies; no stage-2 options depend on earlier choices (the pack has none coded); story-only outcomes are not yet upgraded; recurring NPCs are the chains themselves (no portraits yet).
Tests: `tests/unit/overhaulChains.test.ts`.
