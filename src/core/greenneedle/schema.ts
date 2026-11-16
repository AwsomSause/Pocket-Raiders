// Greenneedle events (Catalog Overhaul Pack, docs GREENNEEDLE_*): the small data shapes their own mechanics need.
// Kept apart from contentSchema.ts so the Greenneedle rules live in one folder; contentSchema only adds these to its unions.
import { z } from 'zod';

const Key = z.string().regex(/^[a-z][a-z0-9-]*$/);

/** The full event-effect schema, bound by contentSchema.ts once it exists (a `when` step carries ordinary effects). */
let effectSchema: z.ZodType = z.never();
let conditionSchema: z.ZodType = z.never();
export const bindGnEffects = (schema: z.ZodType, conditions?: z.ZodType): void => {
  effectSchema = schema;
  if (conditions) conditionSchema = conditions;
};

/**
 * A Greenneedle story step (effect `gn`). Rolls use the event stop's own seeded stream, so a reload gives the same result.
 *  - `duelist`: the newest conscious party Pokémon of `type` becomes the forest's duelist (Viridian Forest, gn.03). Does nothing when one is already marked.
 *  - `capFlag`: the run flag `key` is cut down to at most `n` (Flame 0 to 5, Standing 0 to 3, Respect 0 to 5).
 *  - `setFlag`: the run flag `key` becomes exactly `n`.
 *  - `unmark`: the mark `key` is taken off every Pokémon (the story is over).
 *  - `roll`: the run flag `key` becomes 1 with `n` percent chance, else 0 ("10%: the fog").
 *  - `pick`: the run flag `key` becomes 1, 2, 3... by `weights` ("which Fire-type").
 *  - `when`: if the run flag `key` is within `min`..`max`, the `then` effects apply and `text` is shown.
 *  - `route`: opens the room `to.ids[value of key]` (the last one for larger values): the story branches on what was counted.
 *  - `scene`: opens the event `key` beside the node the player stands on. Unlike `addEvent` it is not a room of the pseudo-stage map: a node can
 *    hold several scenes (a dance in three prompts, a mine with three swings) and still be one node.
 *  - `stageMod`: the run flag `key` becomes (stage number counted from the start of the run) modulo `n` (the moon's phase: 1 new, 3 full with n = 4).
 *  - `stampRegion`: the run flag `key` remembers the region the player is in now (read with the `gn` condition `regionChanged`).
 *  - `fossil`: a fossil by region (`key`: `local` = 70% this region's and 30% another's, `far` = the rarer half of the table, another region's).
 *  - `stampStage`: the run flag `key` remembers the stage number now (read with the `gn` conditions `laterStage`, `sameStage`, `notThisStage`).
 *  - `partyHas`: the run flag `key` becomes 1 when a party Pokémon is one of `species`, else 0 (a Clefairy or Clefable sees the secret dance).
 */
export const GN_OPS = ['duelist', 'paradeSwap', 'paradeEgg', 'paradeForget', 'paradeSecret', 'paradeWake', 'capFlag', 'setFlag', 'unmark', 'roll', 'pick', 'when', 'route', 'scene', 'stageMod', 'fossil', 'stampRegion', 'partyHas', 'stampStage', 'leadBoost', 'itemEach', 'noFaint', 'clampFlag', 'stash', 'unstash', 'markLook', 'setLook', 'payBerry', 'ahead', 'check', 'addParty', 'markParty', 'dropUnmarked', 'minigame', 'releaseLast', 'cast', 'hpCap', 'castItem', 'markLast', 'dropMarked', 'lendHeld', 'returnLent', 'partner', 'oldMove', 'castBase', 'nextOp', 'natureLast', 'markLead', 'crystal', 'crystalDrop', 'crystalMost', 'lightning', 'labCast', 'labForm', 'marketArrive', 'marketBuy', 'marketOffer', 'marketUndercut', 'daycareLeave', 'daycareReturn', 'eggShape', 'eggTake', 'eggWord', 'eggHatch', 'museumArrive', 'frontierClear', 'brainRecord', 'swapIn', 'bench', 'unbench', 'bagLeave', 'bagBack', 'rent', 'bring', 'auctionArrive', 'auctionOpen', 'auctionRound', 'auctionWin', 'auctionReturn', 'gavel', 'onevoneEnter', 'onevoneEnd', 'onevoneChampion', 'onevonePrize', 'lessonArrive', 'lessonEnd', 'lessonBonus', 'lessonTeach', 'allstarDraw', 'allstarChampion', 'exDraw', 'exBack', 'exWatch', 'exResult', 'draftStart', 'draftPick', 'draftWon', 'draftRecruit', 'draftEnd', 'draftAldhelm', 'draftLetter', 'snorlaxFeed', 'snorlaxFond', 'snorlaxFollow', 'snorlaxCaught', 'defectorStart', 'defectorTrust', 'defectorMeet', 'defectorReturn', 'defectorEnd', 'smuggleCages', 'smuggleRehab', 'smuggleJoin', 'smugglePostcard', 'taStart', 'taLot', 'taRare', 'taEnd', 'sgStart', 'sgAssign', 'sgAct', 'sgRescue', 'sgHomes', 'sgHalf', 'sgWhole', 'sgEnd', 'sgJoin', 'kcArrive', 'kcJump', 'kcEvolve', 'bidoofJoin', 'leftTake', 'leftFates', 'ltArrive', 'ltPage', 'ltSit', 'ltDawn', 'impJoin', 'impClaim', 'shedRest', 'shedNinjask', 'duelEnter', 'duelWin', 'duelLoss', 'duelWorthy', 'duelPass', 'lsDeal', 'lsTake', 'lsTicket', 'lsAddress', 'stStart', 'stAssign', 'stEnd', 'tyrJoin', 'tyrTally', 'tyrResult', 'tyrEvolve', 'muralPick', 'muralJoin', 'cheerJoin', 'prison', 'applianceRepair', 'leftFreeze', 'ofPick', 'ofJoin', 'ofGuest', 'ofReplacer', 'ferrisArrive', 'ferrisBest', 'ferrisHand', 'eeveeStart', 'eeveeEnd', 'borrowStart', 'borrowEnd', 'followedJoin', 'xatuDraw', 'xatuRedraw', 'ballFind', 'ballKind', 'ballHold', 'ballHatched', 'ballForce', 'reunionArrive', 'reunionFar', 'lsArrive', 'lsPearl', 'giveDearest', 'xatuPeek', 'xatuBlur'] as const;
export const GnEffectSchema = z.object({
  kind: z.literal('gn'),
  op: z.enum(GN_OPS),
  key: Key.optional(),
  n: z.number().int().optional(),
  type: z.string().optional(),
  species: z.array(z.string().min(1)).min(1).max(12).optional(),
  weights: z.array(z.number().positive()).min(2).max(16).optional(),
  min: z.number().int().min(0).optional(),
  max: z.number().int().min(0).optional(),
  text: z.string().min(1).optional(),
  then: z.array(z.lazy(() => effectSchema)).max(8).optional(),
  /** gn.13: a roll's chance moves by `n` percent for each line whose conditions all hold (a Squad member in the party -5, high Heat -5...). */
  mods: z.array(z.object({ when: z.array(z.lazy(() => conditionSchema)).min(1).max(3), n: z.number().int().min(-50).max(50) })).max(4).optional(),
  /** gn.16: `check` sets flag `key` to 1 when every one of these holds, else 0 (no roll). */
  if: z.array(z.lazy(() => conditionSchema)).min(1).max(3).optional(),
  /** Written as an `addEventFrom` so the pseudo-stage map (core/dungeon/pseudo.ts opensNext) sees every room a route can open. */
  to: z.object({ kind: z.literal('addEventFrom'), ids: z.array(z.string().min(1)).min(1).max(16) }).optional(),
}).refine((e) => (e.op === 'route' ? !!e.to && !!e.key : true), { message: 'a route needs `key` and `to`' })
  .refine((e) => (e.op === 'when' ? !!e.key && (!!e.then?.length || !!e.text) : true), { message: 'a when needs `key` and `then` or `text`' })
  .refine((e) => (e.op === 'pick' ? !!e.key && !!e.weights : true), { message: 'a pick needs `key` and `weights`' })
  .refine((e) => (e.op === 'roll' || e.op === 'capFlag' || e.op === 'setFlag' || e.op === 'stageMod' ? !!e.key && e.n !== undefined : true), { message: 'needs `key` and `n`' })
  .refine((e) => (e.op === 'scene' || e.op === 'giveDearest' || e.op === 'ahead' || e.op === 'fossil' || e.op === 'stampRegion' || e.op === 'stampStage' ? !!e.key : true), { message: 'needs `key`' })
  .refine((e) => (e.op === 'duelPass' || e.op === 'duelWin' || e.op === 'duelLoss' ? (e.n ?? 0) >= 1 && (e.n ?? 0) <= 5 : true), { message: 'a duel op needs `n` 1-5' })
  .refine((e) => (e.op === 'check' ? !!e.key && !!e.if : true), { message: 'a check needs `key` and `if`' })
  // gn.39: a market purchase, offer or undercut names the vendor (`key`) and the asking price (`n`); an offer gives its percent in `min`.
  .refine((e) => (e.op === 'marketBuy' || e.op === 'marketOffer' || e.op === 'marketUndercut' ? !!e.key && (e.n ?? 0) > 0 && (e.op !== 'marketOffer' || (e.min ?? 0) > 0) : true), { message: 'a market op needs `key`, `n` (and `min` for an offer)' })
  // gn.17. addParty: adds to flag `key` one for each party Pokémon still standing (each pulls one out of the pits). markParty: every Pokémon
  // in the party and the box carries mark `key`. dropUnmarked: Pokémon without mark `key` are lost (caught inside a factory that locked down).
  .refine((e) => (e.op === 'addParty' || e.op === 'markParty' || e.op === 'dropUnmarked' ? !!e.key : true), { message: 'needs `key`' })
  // gn.18. minigame: a stop for minigame `key` (minigames.json) on the node you stand on (Safari Land's gate opens the park).
  .refine((e) => (e.op === 'minigame' ? !!e.key : true), { message: 'a minigame needs `key` (the game)' })
  // gn.20. releaseLast: the last Pokémon of `species` to join (party or box) is let go (the first of a pair, so the other stops following).
  .refine((e) => (e.op === 'releaseLast' ? !!e.species : true), { message: 'a releaseLast needs `species`' })
  // gn.21. cast: the story Pokémon `key` is one of `species`, picked once and kept (with `n` 1, an unevolved Pokémon of the region the run is in
  // is one more choice). Event fights and joins name it as `@key`. hpCap: the lead is left with at most `n` percent of its HP (never below 1).
  .refine((e) => (e.op === 'cast' ? !!e.key && !!e.species : true), { message: 'a cast needs `key` and `species`' })
  // castItem: one of the item the story Pokémon `key` evolves with (its stone); a Pokémon that evolves by level gets a Rare Candy.
  .refine((e) => (e.op === 'castItem' ? !!e.key : true), { message: 'a castItem needs `key`' })
  // gn.22. markLast: the last Pokémon of `species` to join carries mark `key` (a guest for a stage). dropMarked: Pokémon carrying mark `key`
  // leave (never the last one in the party).
  .refine((e) => (e.op === 'markLast' ? !!e.key && !!e.species : true), { message: 'a markLast needs `key` and `species`' })
  .refine((e) => (e.op === 'dropMarked' ? !!e.key : true), { message: 'a dropMarked needs `key`' })
  // gn.23. lendHeld: one held item (not a Berry) comes off the first party Pokémon holding one and is lent to story `key` (the Magikarp
  // carries it for the region). returnLent: every item lent to `key` comes back.
  .refine((e) => (e.op === 'lendHeld' || e.op === 'returnLent' ? !!e.key : true), { message: 'needs `key`' })
  // gn.24. partner: your longest-owned wild-caught Pokémon (not the starter) carries mark `key`; flags `partner-story` (1-3, by its nature)
  // and `partner-bond` (its Bond level). oldMove: the Pokémon carrying mark `key` relearns the latest level-up move it has dropped.
  // castBase: story Pokémon `key` is cast as the first stage of the line of the Pokémon carrying mark `type`.
  .refine((e) => (e.op === 'partner' || e.op === 'oldMove' ? !!e.key : true), { message: 'needs `key` (the mark)' })
  .refine((e) => (e.op === 'castBase' ? !!e.key && !!e.type : true), { message: 'a castBase needs `key` (the cast) and `type` (the mark)' })
  .refine((e) => (e.op === 'hpCap' ? e.n !== undefined && e.n >= 1 && e.n <= 100 : true), { message: 'an hpCap needs `n` (1 to 100)' })
  .refine((e) => (e.op === 'partyHas' ? !!e.key && !!e.species : true), { message: 'a partyHas needs `key` and `species`' })
  // leadBoost: the lead's next battle opens with stat `type` at `n` stages ("the lead starts its next battle at -1 Speed").
  .refine((e) => (e.op === 'leadBoost' ? ['atk', 'def', 'spa', 'spd', 'spe', 'acc'].includes(e.type ?? '') && !!e.n : true), { message: 'a leadBoost needs a stat `type` and `n`' })
  // itemEach: one of item `key` for every party Pokémon ("one Berry each for the party").
  .refine((e) => (e.op === 'itemEach' ? !!e.key : true), { message: 'an itemEach needs `key` (the item)' })
  // noFaint: adds `n` to flag `key` when nobody in the party has fainted (a battle won "without letting anyone faint").
  .refine((e) => (e.op === 'noFaint' ? !!e.key && e.n !== undefined : true), { message: 'a noFaint needs `key` and `n`' })
  // clampFlag: holds flag `key` between `min` and `max` (the rain's Flame, 0 to 5).
  // markLook: marks (`key`) every party Pokémon wearing anime look `type` (the Squad recruit, before its challenge). setLook: marked ones now wear `type`.
  .refine((e) => (e.op === 'markLook' || e.op === 'setLook' ? !!e.key && !!e.type : true), { message: 'markLook / setLook need `key` (the mark) and `type` (the look)' })
  // gn.35. lightning: `n` percent that a bolt strikes the lead and paralyses it (core/greenneedle/ridge.ts says what stops it).
  // gn.42: a Frontier building cleared (`key` the building, `n` the points); a Brain's result (`key`, `n` 1 won / 2 lost); a Factory swap or rental (`key` the species).
  .refine((e) => (e.op === 'frontierClear' || e.op === 'brainRecord' ? !!e.key && (e.n ?? 0) > 0 : e.op === 'swapIn' || e.op === 'rent' ? !!e.key : true), { message: 'a Frontier op needs `key` (and `n` for a clear or a Brain)' })
  // gn.43: a lot opens (`n`, 1 to 6); a round is the player's bid, hold, out or silent (`key`).
  .refine((e) => (e.op === 'auctionOpen' ? (e.n ?? 0) >= 1 && (e.n ?? 0) <= 6 : e.op === 'auctionRound' ? ['bid', 'hold', 'out', 'silent'].includes(e.key ?? '') : true), { message: 'an auctionOpen needs `n` (1 to 6); an auctionRound needs `key` bid, hold, out or silent' })
  // gn.47: backing one side (`n` 1 or 2, 0 neither); a moment while it runs (`n` the part, 1-3; `key` cheer, watch or crowd).
  .refine((e) => (e.op === 'exBack' ? [0, 1, 2].includes(e.n ?? -1) : e.op === 'exWatch' ? (e.n ?? 0) >= 1 && (e.n ?? 0) <= 3 && ['cheer', 'watch', 'crowd'].includes(e.key ?? '') : true), { message: 'an exBack needs `n` 0-2; an exWatch needs `n` 1-3 and `key` cheer, watch or crowd' })
  // gn.48: the card picked from the table (`n` 1-5).
  .refine((e) => (e.op === 'draftPick' ? (e.n ?? 0) >= 1 && (e.n ?? 0) <= 5 : true), { message: 'a draftPick needs `n` 1-5' })
  // gn.new.04: tyrJoin `n` 1 travel / 2 pick one; tyrTally and tyrEvolve name the school (`key` kick, punch or stand).
  .refine((e) => (e.op === 'tyrTally' || e.op === 'tyrEvolve' ? ['kick', 'punch', 'stand'].includes(e.key ?? '') : true), { message: 'needs `key` kick, punch or stand' })
  // gn.62: a prison step; `key` says which (start, enter, go, wait, caught, free, stranger, next, do..., end), `n` the wing or the result.
  .refine((e) => (e.op === 'prison' ? !!e.key : true), { message: 'a prison step needs `key`' })
  .refine((e) => (e.op === 'lightning' ? e.n !== undefined && e.n >= 1 && e.n <= 100 : true), { message: 'a lightning needs `n` (1 to 100)' })
  .refine((e) => (e.op === 'clampFlag' ? !!e.key && e.min !== undefined && e.max !== undefined : true), { message: 'a clampFlag needs `key`, `min` and `max`' });
export type GnEffect = z.infer<typeof GnEffectSchema>;

/**
 * A Greenneedle condition (condition `gn`).
 *  - `regionChanged`: the run flag `key` was stamped (`stampRegion`) in an earlier region than the one the player is in now ("he's back next region").
 *  - `notThisRegion`: the run flag `key` was not stamped in the region the player is in now (never stamped counts: "at most once per region").
 *  - `laterStage` / `sameStage` / `notThisStage`: against the stage stamped in `key` (`stampStage`): a later stage than it, the same stage,
 *    or any stage but it (never stamped counts as "not this stage").
 *  - `lookAtLevel`: a party Pokémon wearing anime look `types[0]` is at least the level stored in flag `key` (the Squad recruit has caught up with its Leader).
 *  - `thisRegion`: the run flag `key` was stamped in the region the player is in now ("later in the region").
 *  - `notRegion`: the run is in none of the regions listed in `types` (a Greenneedle event that Kanto shows through its own canon space).
 *  - `holdsBerry`: a party Pokémon holds a Berry (gn.12: the Dusk Vendors take payment in Berries; `payBerry` takes one).
 *  - `cutter`: a conscious party Pokémon knows a slicing move or a claw move (gn.11: cut the net).
 *  - `moveType`: a conscious party Pokémon knows a damaging move of one of `types` (gn.11's pylons: a Fighting, Rock or Steel move).
 *  - `noMoveType`: no party Pokémon knows a move of any of `types` (the mine's pickaxe is for a party with no Fighting, Steel or Ground move).
 *  - `hurtLead`: the first party Pokémon able to fight is at half its HP or less (gn.16: a win from behind).
 */
export const GnCondSchema = z.object({ kind: z.literal('gn'), test: z.enum(['paradeMemory', 'paradeNickname', 'paradeEggReady', 'paradeAll', 'regionChanged', 'notThisRegion', 'laterStage', 'sameStage', 'notThisStage', 'noMoveType', 'moveType', 'cutter', 'holdsBerry', 'notRegion', 'thisRegion', 'lookAtLevel', 'hurtLead', 'heavy', 'markDown', 'hasMark', 'holdsItem', 'oldCatch', 'strength', 'lowTide', 'highTide', 'holds', 'hasAbility', 'aceHere', 'leadInitiative', 'entrantChampion', 'entrantCameBack', 'rivalAhead', 'allstarReady', 'allstarUnbeaten', 'rivalTrustMax', 'rivalTrustBelow', 'exKnown', 'exLeft', 'draftFriend', 'fluteReady', 'foodReady', 'defectorGuest', 'insideTeam', 'notInsideTeam', 'rehabDone', 'rehabWaiting', 'sgWaiting', 'sgOrdered', 'kcNotch', 'lsLost', 'lsLetGo', 'lsStory', 'kcMine', 'kcRegular', 'parentAndChild', 'eggMoveKnown', 'natureIs', 'pairGetsOn', 'partyBond', 'leftHas', 'lastStage', 'pickedTopBond', 'duelDue', 'duelistLeft', 'tyrLead', 'tyrEven', 'tyrWith', 'rivalBeaten', 'mirrorReady', 'ofDue', 'ofMany', 'rivalTrust', 'prophecyTrue', 'finalRest', 'communion']), key: Key.optional(), /** gn.27 strength: percent of the `key` Pokémon's Attack to beat. */ n: z.number().int().min(1).max(200).optional(), types: z.array(z.string().min(1)).min(1).max(6).optional() })
  .refine((c) => (c.test === 'noMoveType' || c.test === 'moveType' || c.test === 'notRegion' ? !!c.types : c.test === 'lookAtLevel' ? !!c.types && !!c.key : c.test === 'cutter' || c.test === 'prophecyTrue' || c.test === 'finalRest' || c.test === 'communion' || c.test === 'paradeMemory' || c.test === 'paradeNickname' || c.test === 'paradeEggReady' || c.test === 'holdsBerry' || c.test === 'hurtLead' || c.test === 'heavy' || c.test === 'holdsItem' || c.test === 'oldCatch' || c.test === 'lowTide' || c.test === 'highTide' || c.test === 'parentAndChild' || c.test === 'pickedTopBond' || c.test === 'leadInitiative' || c.test === 'entrantChampion' || c.test === 'entrantCameBack' || c.test === 'rivalAhead' || c.test === 'allstarReady' || c.test === 'allstarUnbeaten' || c.test === 'rivalTrustMax' || c.test === 'rivalTrustBelow' || c.test === 'exKnown' || c.test === 'exLeft' || c.test === 'draftFriend' || c.test === 'fluteReady' || c.test === 'foodReady' || c.test === 'defectorGuest' || c.test === 'insideTeam' || c.test === 'notInsideTeam' || c.test === 'rehabDone' || c.test === 'rehabWaiting' || c.test === 'sgWaiting' || c.test === 'sgOrdered' || c.test === 'kcNotch' || c.test === 'lsLost' || c.test === 'lsLetGo' || c.test === 'lsStory' || c.test === 'kcMine' || c.test === 'kcRegular' || c.test === 'eggMoveKnown' || c.test === 'pairGetsOn' || c.test === 'partyBond' || c.test === 'leftHas' || c.test === 'lastStage' || c.test === 'duelDue' || c.test === 'duelistLeft' || c.test === 'tyrEven' || c.test === 'tyrWith' || c.test === 'rivalBeaten' || c.test === 'mirrorReady' || c.test === 'ofDue' || c.test === 'ofMany' || c.test === 'rivalTrust' ? true : !!c.key), { message: 'noMoveType and notRegion need `types` (move types / region ids), the others need `key`' });
export type GnCond = z.infer<typeof GnCondSchema>;

/**
 * A Greenneedle fight rule (event rule `gn`), see core/greenneedle/index.ts for what each one does.
 *  - `samurai`: the Samurai's duel (gn.03). His Pinsir will not strike a foe that is not facing it: after a guarding move it waits a turn.
 *    A duelist that trusts you (friendship) moves first on its first move.
 *  - `tully`: Damian's friend Tully (gn.05). His Pokémon uses Splash, on purpose, twice, before it does anything else.
 *  - `bex`: Damian's friend Bex (gn.05). She spends the first turn looking for the attack button.
 *  - `damian`: Damian himself (gn.05). His last Pokémon is the ace he actually trained: `ace` levels higher, a held item that fits its type,
 *    and two moves that cover its weaknesses.
 *  - `palace` (gn.42): your Pokémon choose their own moves, by nature (core/greenneedle/frontier.ts). `arena`: with `surviveTurns`, the judges
 *    decide after that many turns. `brain-<building>`: a Frontier Brain (their answer to your old ace; held items at Gold); the Palace and
 *    Arena Brains keep their building's rule.
 *  - `onevone` (gn.44, with `slot`): the 1v1 Championship's drawn opponent for that round, at the entrant's level (core/greenneedle/onevone.ts).
 */
export const GN_RULES = ['samurai', 'tully', 'bex', 'damian', 'lastflame', 'hawlucha', 'final', 'lastExchange', 'pipes', 'sludge', 'furnace', 'core', 'savanna', 'herd', 'jungle', 'tsareena', 'slowking', 'forest', 'golem', 'ridge', 'overcharged', 'earthing', 'desert', 'mansion', 'lab', 'palace', 'arena', 'brain-tower', 'brain-factory', 'brain-arena', 'brain-pike', 'brain-dome', 'brain-palace', 'brain-pyramid', 'onevone', 'champlesson', 'champexam', 'allstar-qf', 'allstar-sf', 'allstar-final', 'exhibition', 'draft', 'snorlax', 'defector', 'siege-commander', 'quillfeather', 'bidoof', 'alley', 'impersonator', 'duelist', 'mirror', 'prison-warden', 'ferris', 'borrowed', 'ball'] as const;
export const GnRuleSchema = z.enum(GN_RULES);
export type GnRule = z.infer<typeof GnRuleSchema>;

const Stages = z.partialRecord(z.enum(['atk', 'def', 'spa', 'spd', 'spe']), z.number().int().min(-6).max(6));
/** Extra fields of an event fight's rule that the Greenneedle events use. */
export const GnRuleFields = {
  /** A named Greenneedle rule. */
  gn: GnRuleSchema.optional(),
  /** Your Pokémon carrying this Greenneedle mark leads (the forest duelist). */
  leadMark: Key.optional(),
  /** In a double battle the foes aim their single-target moves at your Pokémon carrying this mark (gn.22: the birds go for the Cubone). */
  aimMark: Key.optional(),
  /** Stat stages your first Pokémon starts with (the Squad's hose: Speed -1). */
  myStages: Stages.optional(),
  /** Stat stages the foe's first Pokémon starts with. */
  foeStages: Stages.optional(),
  /** The foe can't be caught (a Squad member fights for its Squad; one joins later, by choice). */
  noCatch: z.literal(true).optional(),
  /** Catching is this many times easier (gn.32: the Pokémon that followed you through the caverns). */
  catchTimes: z.number().min(1).max(4).optional(),
  /** With rule `damian`: how many levels the ace stands above the rest of the team. */
  ace: z.number().int().min(0).max(5).optional(),
  /** gn.44: the 1v1 Championship round (1 to 8): which drawn opponent this is. */
  slot: z.number().int().min(1).max(8).optional(),
};
