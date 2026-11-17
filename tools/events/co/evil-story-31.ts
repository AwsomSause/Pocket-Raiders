// Catalog Overhaul Pack, Evil Teams Volume III: Kalos, Team Flare from inside, the end (TEAM_FLARE_KALOS_FULL_2). The
// Final Choice under Geosenge, the four endings as chain pseudo-stages (ps_fl_plan, ps_fl_turn, ps_fl_az, ps_fl_own:
// written by _evil-story-sync.ts), Team Ember (the third option: founding, three Stoppages and A Cup of Tea), who ends up
// where (part G), and the scientists' pool paying out (FULL_3 L8). "A Bigger Well" ends the team story here: Evil Mode
// is on hold (Kice); its four decisions are flags only.
import { $, bondUp, ch, ev, fight, flag, flagIs, fr, inRegion, out, room, trainer, type Json } from '../dsl.ts';
import { evil as story, foe, kind, prompt, rivalTrust, STEALTH } from './_evil-story-kit.ts';
import { teamJson } from './evil-story-1.ts';

export const CATEGORY = 'evil-story';

const F = teamJson('flare');
const BOSS = F.ranks.leader.sprite;
const RUE = 'trainer.pr/janitor';
const XAN = 'trainer.pr/rich_kid_m';
const YARB = 'boss.npc_gentleman';
const LIFT = 'trainer.pr/waiter_m';
const AZ = 'boss.az';
const SCI = ['trainer.pr/aliana', 'trainer.pr/bryony', 'trainer.pr/celosia', 'trainer.pr/mable'];
const CHAMBER = '#1e1418';
const K = inRegion('kalos');
const say = (who: string, line: string): string => `${who}: "${line}"`;
const fl = (o: Json = {}): Json[] => [{ kind: 'evil', team: 'flare', ...o }, K];
const mark = (m: string): Json => story({ mark: m });
const night: Json = { kind: 'period', in: ['night'] };
/** A fight inside an ending's own map: a loss walks the player back out, and the run goes on. */
const ps = (b: Json): Json => ({ ...b, pseudo: true });
const step = (id: string, name: string, intro: string, choices: Json[], o: { cast?: string[]; pokemon?: string; tint?: string; effect?: string } = {}): Json =>
  ev(id, name, 'Evil Teams', { room: true, cast: o.cast ?? [BOSS], tint: o.tint ?? CHAMBER, effect: o.effect ?? 'none', ...(o.pokemon ? { pokemon: o.pokemon } : {}) }, intro, choices);
const on = (text: string, next: string, ...fx: Json[]): Json => out(text, ...fx, room(next));
const CORKED = { id: 'corked', when: [flagIs('flare-drought-corked')], notice: `On Lysandre's desk, still corked: the bottle from the drought year.` };

// Part G. Who ends up where: one line each, said as the ending closes.
const EPILOGUE: Record<'plan' | 'turn' | 'az' | 'own' | 'ember', string> = {
  plan: `Lysandre is in the grey grass, with Sycamore. Sycamore sat at his place and didn't drink. AZ held a petal, and was outlasted. Xan was in the shelter, in a bespoke suit, sick on the floor. Rue let them out. Her mum was on a balcony; she stayed to see. Yarborough poured for forty. Xerosic: "It's short!" Malva reads the bulletin, and her voice goes. Garance issues a statement about "range." Mable wins the pool. Valerie unpicks. Bijou is not returned; it's the one ending. The members come out to a country that knows their names. The dining room is still laid.`,
  turn: `Lysandre is pulled out, or left, or sat with a glass. Sycamore keeps the corner table, every day, till one understands the other. AZ had his arms round the Draw. Xan is on Route 10: a vet, a fence. Rue has the keys, officially. Her mum makes the tea at the hearing. Yarborough poured for one. Xerosic is in custody, and asks for graph paper. Malva reads the news straight. Garance: "There's a credit." The four roll the pool over. Valerie quilts, for Geosenge. Bijou is home. The members were in red, in mud, unclipping. The dining room is cleared, by Yarborough, alone, in an afternoon.`,
  az: `Lysandre carries an old man's bag. Sycamore brings the sandwiches. AZ turned it back: one hour, again. Xan walks with AZ a while. Rue mops the flower room; there's a flower in it. Her mum gives AZ a sandwich. Yarborough poured for a king: "Sir's a little tall for the glass." Xerosic is in ecstasy. Malva covers the flowers; it's her best work. Garance sells seed packets. "Nobody had the tall one." Valerie makes a dress for a Floette. Bijou is home, sneezing. The members ask if the flowers are exclusive. They aren't. There's a vase on the dining-room table.`,
  own: `Lysandre gave away the coat. Sycamore is on the council: "I'll ask the stupid questions. I've a gift." AZ advises on the Well, slowly. Xan is your first investor, and reads the contract this time. Rue is your Executive. Her mum lives over the base and complains about the noise. Yarborough lays it, and sees who comes. Xerosic builds the Well. Malva was beaten in the lift, and stays for the clapping. Garance sells wells; she's superb. Celosia had "new management," at forty to one. Valerie cuts aprons: sixty, to measure. Bijou is home. The members are told which well. The dining room is laid again.`,
  ember: `Lysandre is on a plastic chair, with tea. Sycamore brings a dish; it's dreadful; everyone eats it. AZ is planting; he wasn't needed. Xan carries, and has learned tea. Rue: "We just didn't do Tuesday." Her mum has a handbag, and mints. Yarborough left a door on the latch. Xerosic told a cook everything. Malva came in her own face to the Gala, was recognised, and was asked for an autograph. Garance processes four hundred refunds, warmly. Nobody had "the cleaners." Valerie asks, at last, what the play was. Bijou is home, never clipped again. The members came in their own faces. Everybody brings something.`,
};

// ---------- The Final Choice ----------
const finalChoice = ev('fl-final-choice', 'The Final Choice', 'Evil Teams', { room: true, cast: [BOSS, AZ], tint: CHAMBER, effect: 'glint' },
  `Under Geosenge. A crystal flower the height of a tower, half open. A console with a key in it. A table laid for forty. A countdown on every screen in Kalos. At the console, Lysandre, with his hand near the key, not on it. At the table, thirty-nine of the Chosen, seated; one chair pulled out. At the door, AZ: he's too tall for it; he's bent, to look in. On the monitors, Lumiose: a balcony, and a woman of seventy-one in her good coat. In the lift hall above, some three hundred and seventy people in red, holding keys that chime. At the far wall, with a bucket, Rue. ${say('Lysandre', `You're here. Good. I'd not have turned it without you. Please.`)} He pulls out the fortieth chair. He doesn't sit. There's no forty-first. ${say('Lysandre', `It's dusk. I chose dusk; it's the kindest light. I've told them. The Holo Caster. So that they might spend today as they'd wish to have spent it.`)} At the door: ${say('AZ', `I fired it for one life. I have walked three thousand years to say one word to whoever stood where you stand. May I come in? I'll have to stoop.`)} ${say('Lysandre', `You're the king. The first one.`)} He's looked this man up. He's descended from his brother. ${say('Lysandre', `...You're family.`)} ${say('AZ', `Yes. I'm sorry for it.`)} Lysandre turns to you. ${say('Lysandre', `I've made every choice in this alone. I find I can't make the last. I've a guest. A host asks the guest.`)} He steps back from the console. The key's there. ${say('Lysandre', `It turns one way.`)} It turns two. AZ knows. Xerosic knows. Nobody's told Lysandre.`,
  [
    ch('Sit in the fortieth chair. "Turn it."', on(`You sit. He looks at you a long moment, and then at the key.`, 'fl-plan-lobby', flag('flare-final-plan'))),
    ch('Take the key out of the console.', on(`You take it out. It's small. It's warm. ${say('Lysandre', `...Ah.`)}`, 'fl-turn-key', flag('flare-final-turn'))),
    ch('Hand the key to the tall man in the door.', on(`You cross the chamber. You hold the key up. A hand the size of a tray takes it.`, 'fl-az-door', flag('flare-final-az'))),
    ch(`Take the key, and his place at the console. "Forty's Xerosic's number. I'll ask a better question."`, on(`You take the key. You stand where he stood.`, 'fl-own-console', flag('flare-final-own')), { requires: [{ kind: 'evil', rank: 5, has: 'confided' }] }),
  ]);
(finalChoice as Json).remembers = [
  { id: 'told-all', when: [flagIs('flare-told-all')], notice: `The lift hall above is silent. They're not queuing.` },
  { id: 'yours', when: [flagIs('flare-test-yours')], notice: `He's already named the village to you. He doesn't look at the photograph on the console; he doesn't need to.` },
  { id: 'who-forty', when: [flagIs('flare-who-forty')], notice: `"Who told you forty?" He's been thinking about it for two stages. You can see it.` },
];

// ---------- Ending 1. Carry it out: "So Clean" (ps_fl_plan) ----------
const PLAN_END = (lead: string): Json => out(`${lead} Rue was never on the list. She's the one who lets them out; she's got the keys. At the lift, to forty people in red: ${say('Rue', `Mind the step. It's all still there. Mostly. They know your names; it was on the wireless. Off you go.`)} The Chosen come out into a country that knows their names. Three hundred and seventy more come out behind them, holding keys that chimed, and they've worked it out on the stairs. Geosenge and nine miles round are grey for the rest of the region: no wild pools, no shop, and a rest that heals in full; it's very quiet there. Your Pokémon were in the lift hall: they've each lost a step of trust in you, for now. In every town in Kalos, people look at the red suit. The team has no leader. Lysandre's in the grass. It looks to the Guest. ${EPILOGUE.plan}`,
  fr(-25), story({ beat: true }), story({ end: 'allied', mods: [{ kind: 'priceMultiplier', group: 'all', value: 1.2 }], modsText: 'Every Kalos shop charges you 20% more for the rest of the region: they look at the red suit.' }), flag('flare-ending-plan'), flag('kalos-nine-miles'), flag('lysandre-grass'));
const plan: Json[] = [
  step('fl-plan-lobby', 'Phase 1: The Lobby', `You're in the chair. Your party holds the lift hall above. Three come down. First, two in masks. ${say('Sina', `You'll never guess who we are!`)} ${say('Dexio', `It's us.`)} ${say('Sina', `Dexio.`)}`, [
    ch('Battle them.', fight(`They fight side by side, the way they've practised.`, ps(trainer('Sina and Dexio', { format: 'doubles', size: 4, lv: 0, win: [room('fl-plan-rival')] }))))]),
  step('fl-plan-rival', 'Phase 1: The Lobby', `Your rival comes down the stairs two at a time, and stops at the bottom, and looks at the red suit.`, [
    ch('"Go home."', fight(`"Not without you."`, ps(trainer('Your rival', { rival: true, size: 6, lv: 1, win: [room('fl-plan-sycamore')] })), rivalTrust(-2))),
    ch(`"There's a reason."`, fight(`"Then show me."`, ps(trainer('Your rival', { rival: true, size: 6, lv: 1, win: [room('fl-plan-sycamore')] })), rivalTrust(-1))),
  ], { cast: [] }),
  step('fl-plan-sycamore', 'Phase 1: The Lobby', `${say('Professor Sycamore', `I sat across a table from him for six years and thought it was philosophy. I'm not going to make that mistake with you. I'm going to assume you mean it.`)}`, [
    ch('Battle the Professor.', fight(`His Garchomp comes out of the Ball already moving.`, ps(trainer('Professor Sycamore', { sprite: 'boss.sycamore', team: ['garchomp'], size: 1, lv: 2, win: [room('fl-plan-petals')] }))))], { cast: ['boss.sycamore'] }),
  step('fl-plan-petals', 'Phase 2: The Petals', `${say('Sycamore', `Then I'll go down. He's put me on his list; did you know? I looked. I'd rather be struck off.`)} He goes past you. He sits at the table, in the place that says his name. He doesn't touch the glass. Three housings to prime: the Draw, the Gift, the Aim. Each takes two turns. The defenders try to short them.`, [
    ch('Prime the Draw and the Gift.', fight(`The defenders come at the housings.`, ps(trainer('The defenders', { size: 3, lv: 1, win: [room('fl-plan-aim')] }))))], { cast: ['boss.sycamore'] }),
  step('fl-plan-aim', 'Phase 2: The Aim', `At the Aim: AZ. He's got his arms round a petal thicker than he is. ${say('AZ', `I'll not fight you. I've not fought anyone since. I'll simply hold. You'll have to move me.`)} It isn't a battle. He can't be knocked out. He can be outlasted. He's three thousand years tired.`, [
    ch('Push.', out(`You push. He holds. You push, and he holds, and at last he doesn't: not because you were stronger, but because you were younger.`, room('fl-plan-light')), { prompt: prompt(STEALTH), fail: out(`You push until your arms shake. He holds. Then, very slowly, he lets go: he was only ever going to be outlasted.`, room('fl-plan-light')) }),
    ch(`Don't push.`, out(`You stand beside him and don't push. He holds the petal for a long time. Then he lets go of it himself, very gently, as one puts down something one has carried too far. ${say('AZ', `I'm tired. Forgive me.`)}`, room('fl-plan-light'))),
  ], { cast: [AZ] }),
  step('fl-plan-light', 'Phase 3: The Light', `Lysandre turns the key. It isn't loud. It's white. It goes up the flower and out. On the monitors: Kalos. The light crossing it like a tide. It gets to the hills round Geosenge. It gets a little past. It stops.`, [
    ch('Watch the monitors.', out(`${say('Xerosic', `It's— ah.`)} says the intercom, delighted, then not. It reached thirty miles. Nobody had touched the stones. It never reaches Lumiose. The hills are grey. The valley's quiet. Nobody on screen is seen to fall; the monitors show places, and then show them empty of colour.`, flag('flare-thirty-miles'), room('fl-plan-last')), {
      branches: [{ when: [{ kind: 'evil', team: 'flare', inside: true }, flagIs('flare-stones-tenth')], text: `${say('Xerosic', `It's— ah. The stones. Somebody's been unhooking stones. A tenth a night. It's short. It's reached— let me see— about nine miles.`)} It never reaches Lumiose. The hills are grey. The valley's quiet. Nobody on screen is seen to fall; the monitors show places, and then show them empty of colour.`, effects: [room('fl-plan-last')] },
        { when: [flagIs('flare-stones-unhooked')], text: `${say('Xerosic', `It's— ah. The stones. Somebody unhooked a whole row. It's short. It's reached— let me see— about nine miles.`)} It never reaches Lumiose. The hills are grey. The valley's quiet. Nobody on screen is seen to fall; the monitors show places, and then show them empty of colour.`, effects: [room('fl-plan-last')] }],
    }),
  ], { cast: [BOSS], effect: 'glint' }),
  step('fl-plan-last', 'Forty at a Table', `The shelter. White light fading in the vents. Forty people who've been spared a thing that didn't arrive. ${say('Lysandre', `...It's so clean.`)} The grey hills. Nothing moving on them. ${say('Lysandre', `It didn't reach. Nine miles. I've— for nine miles.`)} One monitor's still Lumiose. A balcony. A woman in her good coat, who stayed to see. She's looking toward Geosenge. She's seen the light come up over the hills, and stop. She's looking straight at the camera. She doesn't know it's there. He can't look away from her. ${say('Lysandre', `That's Mme Carmody's mother. She does— her daughter does the flower room. She hums.`)} At the far wall: a bucket, set down. ${say('Rue', `She said she'd stay and see what I'd done.`)} A pause. ${say('Rue', `That's what you've done. That's nine miles of it. D'you want to see the rest of what I've done? I've been unhooking a tenth a night.`)}`, [
    ch('"It was arithmetic."', PLAN_END(`He doesn't answer. He's still looking at the balcony.`)),
    ch('(Say nothing.)', PLAN_END(`You say nothing. Nor does he. Nor does anyone at the table.`)),
    ch('"Go up. Look at it."', PLAN_END(`He goes. He stands in the grey grass. Sycamore comes and stands next to him. Neither says anything. It's the corner table, without the table.`)),
    ch('"Whose plate was it?"', PLAN_END(`He looks down at the table, laid for forty, and doesn't find his own.`)),
  ], { cast: [BOSS, RUE] }),
];
(plan[6] as Json).remembers = [CORKED];

// ---------- Ending 2. Turn on the team: "No Refunds" (ps_fl_turn) ----------
const TURN_END = (lead: string, ...fx: Json[]): Json => out(`${lead} Flare's assets are seized. The list's published. Xan spends what's left of his allowance on Route 10: a vet, a fence, a sign with a telephone number on it. Treasurer Garance, at the hearing, warmly: "There are no refunds. It's on page eleven. However. There's a credit. It can be redeemed against the damage." ${EPILOGUE.turn}`,
  story({ beat: true }), story({ end: 'defeated' }), flag('flare-ending-turn'), flag('route10-woke'), ...fx);
const turn: Json[] = [
  step('fl-turn-key', 'Phase 1: The Key', `${say('Lysandre', `I asked the guest. One must abide by the guest.`)} A pause. ${say('Lysandre', `I find I can't. I've spent six years on the arithmetic. If I let you walk out with that, they were six years of nothing.`)}`, [
    ch('(Hold on to the key.)', on(`You hold on to it. He takes off his coat, and folds it over the fortieth chair.`, 'fl-turn-lysandre')),
    ch('"Who told you forty?"', on(`${say('Lysandre', `Don't. Not now. I've thought of nothing else for a fortnight.`)} He takes off his coat, and folds it over the fortieth chair.`, 'fl-turn-lysandre'), { requires: [flagIs('flare-who-forty')] }),
  ]),
  step('fl-turn-lysandre', 'Phase 2: Lysandre', `The Beautiful World, as he's always fought for it: Mienshao, Honchkrow, Pyroar, and Gyarados, the one he calls Sovereign, with a stone at its throat.`, [
    ch('Battle him.', fight(`He fights beautifully. He always has.`, ps(trainer('Lysandre', { sprite: BOSS, team: ['mienshao', 'honchkrow', 'pyroar', 'gyarados'], size: 4, lv: 2, win: [room('fl-turn-offer')] }))))]),
  step('fl-turn-offer', 'The Offer', `At a quarter of Sovereign's health, he stopped the battle for a turn and held out a key. ${say('Lysandre', `Take it. No fee. You and yours. Stand beside me and watch it be beautiful, and afterwards help me deserve it.`)}`, [
    ch('(Refuse.)', on(`You don't take it. He puts it back in his pocket, and Sovereign goes down.`, 'fl-turn-flower')),
    ch(`"That one chimes. Doesn't it."`, on(`He looks at it. In his own hand. ${say('Lysandre', `...I don't know. I don't know which this is. I've four hundred of them in a drawer and forty in a safe and I picked this up from the desk.`)} He puts it down. Sovereign's next move doesn't come.`, 'fl-turn-flower'), {
      branches: [{ when: [flagIs('flare-tester')], text: `You hold Bastien's tester to it. Red. He looks at it. In his own hand. ${say('Lysandre', `...I don't know. I don't know which this is. I've four hundred of them in a drawer and forty in a safe and I picked this up from the desk.`)} He puts it down. Sovereign's next move doesn't come.`, effects: [room('fl-turn-flower')] }],
    }),
    ch(`"Who's holding the plate now?"`, on(`He looks at his own hands, as if there might be one in them. ${say('Lysandre', `...I am. I always was. I never once put it down.`)} Sovereign goes down while he's still looking.`, 'fl-turn-flower'), { requires: [flagIs('flare-guest')] }),
  ]),
  step('fl-turn-flower', 'Phase 3: The Flower', `The Battery: three petals, twelve turns. With the key in your hand, the Aim's already shut. Two to close. AZ has his arms round the Draw. ${say('AZ', `I built you to give one life back. I built you badly. Close.`)}`, [
    ch('Close the Draw and the Gift.', out(`The petals fold, one and then the other.`, room('fl-turn-rubble')), { prompt: prompt(STEALTH), fail: out(`The Gift sparks and burns your hands before it folds. It folds.`, room('fl-turn-rubble')) }),
  ], { cast: [AZ] }),
  step('fl-turn-rubble', 'Phase 4: The Rubble', `${say('Lysandre', `It will fire. It has enough for here. Only for here.`)} He's on his knees at the console. ${say('Lysandre', `Go. All of you. I mean it kindly. It's the last thing I have to give away.`)}`, [
    ch('(Pull him out.)', TURN_END(`You pull him out. He doesn't fight you. The third petal closes behind you both.`, flag('lysandre-pulled'))),
    ch('(Leave him.)', TURN_END(`You leave him. The third petal closes. When the dust settles, the console is empty.`, flag('lysandre-left'))),
    ch('"You never sat down. Sit down."', TURN_END(`There's a chair. The fortieth. It was yours. He looks at it for a long time. He sits. It's the first time in six years he's taken a place. The third petal closes. He's still in the chair when the dust settles. Yarborough pours him a glass. "The house red, sir."`, flag('lysandre-sat'))),
  ]),
];
(turn[1] as Json).remembers = [
  { id: 'told-two', when: [flagIs('flare-told-two')], notice: `On the monitors: Xan, opening the cages on Route 10, in a ruined suit. By the end of the battle, the flower's got nothing to draw on. ${say('Xan', `I've done forty stones! I've had help! There's a woman here with a lead who keeps thanking me!`)}` },
  { id: 'told-all', when: [flagIs('flare-told-all')], notice: `Three hundred and seventy members aren't in the lift hall. They've gone up. They're on Route 10, in red, unclipping. They're very bad at it. A member, kneeling in mud: "This'll never come out. I don't care. Hold still, darling."` },
  { id: 'bijou', when: [flagIs('flare-bijou-rung')], notice: `On a monitor: a Furfrou, crossing a field to a woman with her arms out.` },
];
(turn[3] as Json).remembers = [{ id: 'pool', when: [flagIs('flare-pool-talked')], notice: `Aliana, Bryony, Celosia and Mable don't come down. "We've money on this."` }];
(turn[4] as Json).remembers = [
  { id: 'well-column', when: [flagIs('flare-eleventh'), flagIs('flare-column')], notice: `He looks at the fortieth chair. Then he sits down in it, without being told.`, hide: [0, 1, 2], addChoices: [ch('(Let him sit.)', TURN_END(`He sits. It's the first time in six years he's taken a place. The third petal closes. He's still in the chair when the dust settles. Yarborough pours him a glass. "The house red, sir."`, flag('lysandre-sat')))] },
  CORKED,
];

// ---------- Ending 3. Side with the other side: "Back" (ps_fl_az) ----------
const azEnd = (text: string): Json => out(`${text} Kalos has a very old man in it, planting flowers. A Floette's found him. Lysandre walks with him a while. He carries the bag. He's asked whether there's a list of who gets a flower. AZ: "No. One plants them, and people come." On Route 10, every stone has something growing at its foot. The Pokémon that fought beside AZ has gained a year. "She may walk where she likes," AZ says of the Floette. ${EPILOGUE.az}`,
  bondUp(1), story({ beat: true }), story({ end: 'exposed' }), flag('flare-ending-az'), flag('weapon-back'), flag('lysandre-walks'), flag('sv-flare-eternal-flower'), flag('route10-woke'));
const az: Json[] = [
  step('fl-az-door', 'Phase 1: The Door', `${say('Lysandre', `He'll turn it. He built it. He's the only one alive who's used it.`)} ${say('AZ', `I fired it for one life. I've walked three thousand years to say: don't.`)} He stoops. He comes in. He's the tallest thing in the room but the flower. ${say('AZ', `You're my brother's child. A long way down. He was the kind one. He told me not to build it. I said: you've never loved anything enough to do a terrible thing. He said: no. I've loved things enough not to.`)} ${say('AZ', `I didn't understand him for a thousand years.`)}`, [
    ch('Stand beside him.', on(`Lysandre doesn't fight. The scientists do: they've a pool on.`, 'fl-az-four')),
  ], { cast: [AZ, BOSS] }),
  step('fl-az-four', 'Phase 2: The Four', `Aliana and Mable first. AZ fights beside you: Torkoal, Golurk, Sigilyph. He's slow. Every move's travelled a long way.`, [
    ch('Battle Aliana and Mable.', fight(`AZ's Golurk lumbers forward beside yours.`, ps(trainer('Aliana and Mable', { format: 'doubles', size: 4, lv: 1, ally: 'golurk', win: [room('fl-az-four-2')] }))))], { cast: [SCI[0]!, SCI[3]!] }),
  step('fl-az-four-2', 'Phase 2: The Four', `Then Bryony and Celosia.`, [
    ch('Battle Bryony and Celosia.', fight(`AZ's Golurk is still standing. So is he.`, ps(trainer('Bryony and Celosia', { format: 'doubles', size: 4, lv: 1, ally: 'golurk', win: [room('fl-az-back')] }))))], { cast: [SCI[1]!, SCI[2]!] }),
  step('fl-az-back', 'Phase 3: Back', `${say('Celosia', `Who had 'the tall one'? Nobody had the tall one.`)} ${say('Mable', `It's not on the grid. We'll have to roll it over.`)} AZ puts the key in the console. His hand covers it. ${say('Lysandre', `It turns one way.`)} ${say('AZ', `It was built to give a life back. I only ever used the half that takes. Nobody's turned it the other way. I was afraid to. I thought: if it could give without taking, I'd have done the terrible thing for nothing.`)} He turns it. Not on. Back. The flower doesn't open. It folds. The light goes down, not up: into the roots, along the cables, out to the stones.`, [
    ch('Watch the monitors.', on(`Route 10, on every monitor. Row on row. Every Pokémon on the stones wakes. They stand up. They shake. A Furfrou with a fussy home trim sneezes, twice, and looks about for a garden. ${say('Xerosic', `It runs backwards! I said it'd be more interesting! Nobody asked!`)} says the intercom, in ecstasy. The weapon gives back what it took, once. Then it's a tree. Or a cocoon. Quiet.`, 'fl-az-hour')),
  ], { cast: [AZ, BOSS], effect: 'sparkle' }),
  step('fl-az-hour', 'Phase 4: The Hour', `A small Pokémon with a black flower floats down the lift shaft, out of the evening. AZ doesn't say anything. He's too tall to kneel easily. He manages. Lysandre's watching. ${say('Lysandre', `It could give. All along. It could have been a well.`)} ${say('AZ', `Yes. That's the grief of it. I'll help you carry it. I've had practice.`)}`, [
    ch('(Leave them be.)', azEnd(`You leave them be: a king on his knees, and a man with a bag.`)),
  ], { cast: [AZ, BOSS], pokemon: 'floette' }),
];
(az[3] as Json).remembers = [{ id: 'backwards', when: [flagIs('flare-backwards')], notice: `You knew it turned back. Xerosic told you, over a sandwich.` }];
(az[0] as Json).remembers = [{ id: 'key', when: [flagIs('flare-az-key')], notice: `AZ knows you. He nods.` }, { id: 'ally', when: [flagIs('flare-az-ally')], notice: `AZ knows you. He nods.` }];

// ---------- Ending 4. Take it all: "A Bigger Well" (ps_fl_own) ----------
const ownStep = (id: string, name: string, intro: string, choices: Json[]): Json => step(id, name, intro, choices, { cast: [RUE, YARB] });
const own: Json[] = [
  step('fl-own-console', 'Phase 1: The Console', `${say('Lysandre', `It's the machine's range.`)} "It's the first capacitor he had on the shelf. He could do four hundred. He could run it backwards. He's been waiting for somebody to ask." Silence. Then, from the intercom: ${say('Xerosic', `...Is somebody asking? Because I've the drawings! I've had the drawings since March!`)} ${say('Lysandre', `March.`)} ${say('Lysandre', `I asked how to choose. For three years. I never once asked if there was more.`)} "Give me the machine. I'll ask a better question." ${say('Lysandre', `...You'd run it the other way. You'd give with it.`)} He takes the key out himself. He looks at it. He takes off his coat; it's a very good coat; it's the fourth he's owned this decade. He hands over the key, and the coat. ${say('Lysandre', `I've given away everything else. I don't know why I thought I'd keep this.`)}`, [
    ch('Take the coat.', on(`It's warm. He doesn't fight. She does.`, 'fl-own-malva')),
  ]),
  step('fl-own-malva', 'Phase 2: Malva', `Malva comes down in the lift, in both uniforms. ${say('Malva', `No. I was picked. I'm on the forty. I've a seat with my name on, and I'll not have it turned into a— soup kitchen.`)} ${say('Malva', `Both my jobs choose who's worth it. I'm good at being worth it. If everyone's let in, what was I?`)}`, [
    ch('Battle Malva.', fight(`She fights as if there were cameras.`, ps(trainer('Malva', { sprite: 'trainer.malva', team: ['pyroar', 'torkoal', 'chandelure', 'talonflame'], size: 4, lv: 2, win: [room('fl-own-clapping')], lose: [room('fl-own-lost')] }))))]),
  step('fl-own-clapping', 'Phase 2: Malva', `${say('Malva', `...They clapped. In the lift hall. I could hear it. They were clapping you, and you hadn't hurt anyone.`)}`, [
    ch('Let her go.', on(`She stays for the clapping.`, 'fl-own-list')),
  ], { cast: ['trainer.malva'] }),
  ownStep('fl-own-list', 'The First Hour: The List', `Forty at a table. Three hundred and seventy in a lift hall. Sixty in a staff corridor. A flower. Four decisions, each one line. The first: the list.`, [
    ch('Keep forty.', on(`Forty it stays.`, 'fl-own-fees', flag('flare-list-forty'))),
    ch('Make it four hundred and eleven: everyone who paid.', on(`Four hundred and eleven chairs. Yarborough will need more glasses.`, 'fl-own-fees', flag('flare-list-paid'))),
    ch(`Burn it. "Nobody's not on the list."`, on(`It burns in the fireplace of his study. There's no membership now; there's a door.`, 'fl-own-fees', flag('flare-list-burned'))),
  ]),
  ownStep('fl-own-fees', 'The First Hour: The Fees', `The second: the fees.`, [
    ch('Keep them.', on(`Five million a head, in the safe.`, 'fl-own-flower', flag('flare-fees-kept'))),
    ch('Refund them.', on(`Garance processes the refunds, warmly.`, 'fl-own-flower', flag('flare-fees-refunded'))),
    ch(`They're the fund again: five million a head, to the wells, and every member's told which well.`, on(`Every coin's got a destination that can be visited.`, 'fl-own-flower', flag('flare-fees-fund'))),
  ]),
  ownStep('fl-own-flower', 'The First Hour: The Flower', `The third: the flower.`, [
    ch('Seal it.', on(`It's sealed, under Geosenge, for good.`, 'fl-own-staff', flag('flare-flower-sealed'))),
    ch('Run it backwards.', on(`Xerosic has the drawings. It'll be a Well: once a stage, it gives a year back to a place that's lost one.`, 'fl-own-staff', flag('flare-flower-well'))),
    ch('Keep it as it is, unfired.', on(`It stays as it is: half open, and waiting.`, 'fl-own-staff', flag('flare-flower-kept'))),
  ]),
  ownStep('fl-own-staff', 'The First Hour: The Staff Corridor', `The fourth: the staff corridor.`, [
    ch('As it was.', on(`The rota stays on the wall.`, 'fl-own-yarborough', flag('flare-staff-same'))),
    ch('A rise.', on(`Sixty pay slips, a little heavier.`, 'fl-own-yarborough', flag('flare-staff-rise'))),
    ch('Seat them. The sixty are the council.', on(`Rue's the Executive. The lift man's Intelligence. They've the keys to everything.`, 'fl-own-yarborough', flag('flare-council-staff'))),
  ]),
  ownStep('fl-own-yarborough', 'The First Hour: A Table', `Yarborough, with a tray: ${say('Yarborough', `Will there be a table, under the new management? I ask only to know how many to lay.`)}`, [
    ch('"Forty."', out(`${say('Yarborough', `Very good.`)} Team Flare is yours. Everything the team gives brings more hands; every stage, the table's longer. ${EPILOGUE.own}`, story({ beat: true }), story({ end: 'allied' }), flag('flare-ending-own'), flag('evil-start-flare'), flag('flare-table-forty'))),
    ch('"Four hundred and eleven."', out(`${say('Yarborough', `I'll need the good china.`)} Team Flare is yours. Everything the team gives brings more hands; every stage, the table's longer. ${EPILOGUE.own}`, story({ beat: true }), story({ end: 'allied' }), flag('flare-ending-own'), flag('evil-start-flare'), flag('flare-table-all'))),
    ch('"Lay it, and see who comes."', out(`He looks at you a long time. ${say('Yarborough', `...That's what he used to say. Before the pencil.`)} He goes to find the good china. Team Flare is yours. Everything the team gives brings more hands; every stage, the table's longer. ${EPILOGUE.own}`, story({ beat: true }), story({ end: 'allied' }), flag('flare-ending-own'), flag('evil-start-flare'), flag('flare-table-open'), ...kind(1))),
  ]),
];
own.push(step('fl-own-lost', 'The Verdict', `Malva stands over your lead. ${say('Malva', `Sit down, Guest. Your chair's there. It always was.`)} Lysandre takes the key back from your hand, gently, as one takes a glass from a guest who's had enough.`, [ch('Take the fortieth chair.', PLAN_END(`You sit. He turns the key. It isn't loud. It's white. It goes up the flower and out, and crosses the hills round Geosenge, and stops. ${say('Lysandre', `...It's so clean.`)}`))], { cast: ['trainer.malva', BOSS] }));
(own[2] as Json).remembers = [{ id: 'keep', when: [flagIs('flare-malva-keep')], notice: `"That's the one you wanted." ${say('Malva', `Don't be clever. ...Yes.`)}` }];

// ---------- Team Ember: the third option ----------
const EMBER = { cast: [RUE, LIFT], tint: '#2a2420', effect: 'none' };
const ember: Json[] = [
  ev('ember-founding', 'Team Ember', 'Evil Teams', { callback: true, requires: [...fl({ after: 4, ends: ['none'] }), flagIs('flare-offer-refused'), flagIs('flare-az-key', 0, 0), flagIs('flare-kind-staff'), night], ...EMBER },
    `A service door, propped with a mop bucket. Lino. A rota on the wall. A kettle, just boiled. ${say('Rue Carmody', `You're the one who wouldn't. He offered it you free and you said no. It went round the corridor in about four minutes.`)} ${say('Rue', `There's sixty of us on staff passes. Cleaners. Cooks. The lift man. We're not on the list. We've the keys to everything.`)} The lift man, Monsieur Everard Kettering: "I've taken every one of them up and down for six years. They don't see me. D'you know what people say in a lift, when they don't see you?" ${say('Rue', `We're not going to fight them. Look at us. I've a mop. We're just going to stop.`)} The creed is on the rota, in biro, under FRIDAY: NOBODY'S NOT ON THE LIST.`,
    [
      ch('Sign the rota.', out(`You write your name under FRIDAY. Rue puts the kettle on again. Team Ember: sixty on staff passes, and you.`, mark('third'), flag('ember-founded'))),
      ch('"Who else?"', out(`Rue counts them off. Herself: the flower room, Tuesdays; she knows where the fuses are. Everard Kettering, the lift man: six years of what's said between floors. The night porter: every delivery, every signature. Four cooks: the Chosen eat what they're given. The laundry: four hundred red suits go through it on a Thursday. A dishwasher at the café: the corner table's glasses; who sat; how long. Concierge Yarborough doesn't join; he leaves a door on the latch, and says nothing, and brings the wine. And Rue's mum: a handbag.`, mark('third'), flag('ember-founded'))),
      ch('"What do we stop?"', out(`${say('Rue', `Nothing big. That's the trick. What's the smallest thing that, left undone, stops the largest? We'll find out on Thursday.`)} She writes your name under FRIDAY.`, mark('third'), flag('ember-founded'))),
    ]),
  // Stoppage 1: Thursday's Laundry (a door of three rooms, ps_ember_laundry)
  ev('ember-stop-1', `Stoppage 1: Thursday's Laundry`, 'Evil Teams', { requires: [...fl({ after: 5, has: 'third' })], ...EMBER },
    `The Gala at Parfum Palace is on Friday. Four hundred suits are in the wash.`,
    [ch('Go down to the laundry.', out(`Steam, and the smell of starch.`, room('ember-laundry-1')))]),
  ev('ember-laundry-1', `Thursday's Laundry`, 'Evil Teams', { room: true, ...EMBER, effect: 'fog' },
    `Four hundred red suits on rails. The laundry crew look at you. What could be left undone?`,
    [
      ch('The pressing.', out(`They go wrinkled. Members complain. The Gala goes ahead.`, room('ember-laundry-2'))),
      ch('The delivery.', out(`They go late. Members complain louder. It goes ahead.`, room('ember-laundry-2'))),
      ch('The visors: rinse them with the reds.', out(`Every visor comes out pink. Not one member'll be seen in it.`, room('ember-laundry-gala'))),
    ]),
  ev('ember-laundry-2', `Thursday's Laundry`, 'Evil Teams', { room: true, ...EMBER, effect: 'fog' },
    `The next Thursday. Another rail of suits. Another try.`,
    [
      ch('The visors: rinse them with the reds.', out(`Every visor comes out pink. Not one member'll be seen in it.`, room('ember-laundry-gala'))),
      ch('The buttons.', out(`They go on with the wrong buttons. Nobody notices. It goes ahead.`, room('ember-laundry-2'))),
    ]),
  ev('ember-laundry-gala', 'The Gala', 'Evil Teams', { room: true, cast: ['trainer.pr/rich_f', 'trainer.pr/rich_m'], tint: '#3a2830', effect: 'sparkle' },
    `Four hundred people come to a Flare gala in their own faces, and look at each other, and three recognise their own dentist. A member, to another: "Hélène? You're in this?" The other: "I thought it was a wine thing!"`,
    [ch('Slip out by the staff door.', out(`A third of the members ask about refunds within the week.`, flag('ember-stop1')))]),
  // Stoppage 2: The Kitchen
  ev('ember-stop-2', 'Stoppage 2: The Kitchen', 'Evil Teams', { requires: [...fl({ after: 6, has: 'third' })], ...EMBER },
    `The scientists eat at their benches. Xerosic never stops; he's fed by tray. A cook: "He doesn't look at what it is. He'd eat the napkin." ${say('Rue', `Then we don't send the tray.`)} Which meal, which day?`,
    [
      ch('Breakfast, on Monday.', out(`He doesn't notice. He's had a biscuit from under the console.`, room('ember-kitchen-2'))),
      ch('Lunch, before the capacitor test.', out(`He's light-headed for the calibration.`, room('ember-kitchen-test'))),
      ch('Supper, after the test.', out(`The test's already done. He's hungry, and cross, and nothing else.`, room('ember-kitchen-2'))),
    ]),
  ev('ember-kitchen-2', 'The Kitchen', 'Evil Teams', { room: true, ...EMBER },
    `${say('Rue', `Not that one. Think. What does he need his head for?`)}`,
    [ch('Lunch, before the capacitor test.', out(`He's light-headed for the calibration.`, room('ember-kitchen-test')))]),
  ev('ember-kitchen-test', 'The Kitchen', 'Evil Teams', { room: true, cast: ['trainer.pr/xerosic'], tint: '#202430' },
    `Xerosic, on the lab floor, with a low blood sugar and a clipboard: ${say('Xerosic', `Forty. No. Four. Fourteen? I've written 'sandwich.' I've written 'sandwich' in the tolerance column.`)} The test's put back a day. It's the day that matters. And somebody on staff brings him a sandwich, in the end, and stays while he eats it, and asks what the machine's for. Nobody on staff has ever asked.`,
    [ch('Listen at the door.', out(`He tells her. All of it. He's delighted. The whole design, as told to a cook. Including: it runs backwards.`, flag('ember-stop2'), flag('flare-backwards')))]),
  // Stoppage 3: The Flower Room (a + node, at Night, under Geosenge)
  ev('ember-stop-3', 'Stoppage 3: The Flower Room', 'Evil Teams', { requires: [...fl({ after: 6, has: 'third' }), night], cast: [RUE], tint: '#18201c', effect: 'fog' },
    `Tuesday. Rue mops it. The flower. The console. A grey box on the wall: forty fuses, ceramic, each the size of a thumb. ${say('Rue', `I've dusted that box for three years. I've never opened it. I'm not supposed to open it.`)}`,
    [
      ch('"Open it."', out(`She opens it. Forty fuses, in a row, like teeth.`, room('ember-flower-where'))),
      ch(`"What happens if they're gone?"`, out(say('Rue', `Then it's a very big flower.`), room('ember-flower-where'))),
      ch('"Where would you put them?"', out(`${say('Rue', `Somewhere nobody in a red suit'd ever go.`)} She thinks. ${say('Rue', `My mum's.`)}`, room('ember-flower-bus'))),
    ]),
  ev('ember-flower-where', 'The Flower Room', 'Evil Teams', { room: true, cast: [RUE], tint: '#18201c' },
    `${say('Rue', `And put them where?`)}`,
    [ch('"Where would you put them?"', out(`${say('Rue', `Somewhere nobody in a red suit'd ever go.`)} She thinks. ${say('Rue', `My mum's.`)}`, room('ember-flower-bus')))]),
  ev('ember-flower-bus', 'The Staff Bus', 'Evil Teams', { room: true, cast: [RUE, 'trainer.pr/veteran_f'], tint: '#2a2a30' },
    `The fuses go to Lumiose in a mop bucket, on the staff bus. It's the longest, quietest part of it: a woman on a bus with a bucket on her knee. Rue's mum, Madame Winnifred Carmody, seventy-one, opening her handbag: "In here? With my mints? ...Is this your work?" ${say('Rue', `Yes.`)} Madame Carmody: "Then I'll mind it."`,
    [ch('Ride back with Rue.', out(`The weapon's got no fuses. Nobody knows but sixty people and a handbag.`, flag('ember-stop3')))]),
  // The climax: A Cup of Tea (replaces the Final Choice and the outside climax)
  ev('ember-tea', 'A Cup of Tea', 'Evil Teams', { callback: true, requires: [...fl({ beat: 6, has: 'third', inside: false })], cast: [BOSS], tint: CHAMBER },
    `The chamber. Dusk. Forty at a table. The countdown. ${say('Lysandre', `This is not a threat. I am telling you so that you may spend today as you would wish to have spent it.`)} He turns the key. Nothing happens. He turns it again. ${say('Xerosic', `It's— there's no circuit. There's no— somebody's taken the fuses! All forty! Who takes fuses?`)} says the intercom. Lysandre looks at the box on the wall. It's been dusted. Recently.`,
    [ch('Follow him up.', out(`He goes up. Alone. The lift man takes him.`, room('ember-tea-lift')))]),
  ev('ember-tea-lift', 'A Cup of Tea: The Lift', 'Evil Teams', { room: true, cast: [LIFT, BOSS], tint: '#2a2420' },
    `Kettering, looking straight ahead: "Ground floor, monsieur?" ${say('Lysandre', `...You're Everard. Your daughter's at the conservatoire. The cello.`)} Kettering: "Viola, monsieur. But it's kind of you." ${say('Lysandre', `Six years. I've said 'cello' for six years. You never—`)} Kettering: "You never asked, monsieur. You told me. Very warmly."`,
    [ch('(The doors open.)', out(`The lift opens on the staff floor. He's never been down here.`, room('ember-tea-corridor')))]),
  ev('ember-tea-corridor', 'A Cup of Tea: The Corridor', 'Evil Teams', { room: true, cast: [RUE, BOSS], tint: '#2a2420' },
    `Sixty people in aprons and overalls, along the lino, not blocking anything. A kettle. ${say('Rue', `The fuses are in my mum's handbag. In Lumiose. With her mints. You'll not get them. She doesn't open it for strangers.`)} ${say('Lysandre', `Mme Carmody.`)} ${say('Rue', `Rue.`)} ${say('Lysandre', `You've— all of you. You've simply not.`)} ${say('Rue', `We've not. It's all we could think of. We can't fight you; you're very good at it. We just didn't do Tuesday.`)} A cook: "You've sixty people on your payroll and none on your list. We wondered if you'd noticed." ${say('Lysandre', `I'd noticed. I wrote a page about it. I couldn't— if I put you on it—`)} ${say('Rue', `Then it's Thursday. I know. I've dusted round your table for three years. You never cleared it.`)} ${say('Rue', `Here's the thing about Thursday. You never once asked any of them to bring a dish.`)} Silence. ${say('Rue', `Four hundred and eleven people, and you fed every one off your own china till there wasn't any. My mum does a street party. Forty houses. Everybody brings something. Nobody counts plates.`)} Somebody holds out a cup. ${say('Rue', `Tea. It's not the house red. Sit down; you're making the corridor look untidy.`)}`,
    [
      ch('(Let him sit.)', out(`He sits. On a plastic chair. With a cup of staff tea. It's the first time in six years somebody's handed him something. Team Ember doesn't disband. It becomes a thing Kalos has: at a city in this region, a staff door propped with a bucket is a way round a battle, and a cup of tea. Thursday comes back, at the house on the Avenue d'Été. The cloth's been washed. Everybody brings something. Nobody counts. ${EPILOGUE.ember}`,
        story({ beat: true }), story({ end: 'exposed' }), flag('flare-ending-ember'), flag('thursday-again'), flag('ember-door'))),
      ch('"I want a battle."', fight(`There isn't one to have. He's got nobody to fight. For the pool's sake, the four scientists come up anyway.`, trainer('Aliana, Bryony, Celosia and Mable', { size: 4, lv: 1, win: [] }),
        story({ beat: true }), story({ end: 'exposed' }), flag('flare-ending-ember'), flag('thursday-again'), flag('ember-door'))),
    ]),
];
(ember[ember.length - 3] as Json).remembers = [{ id: 'no-stop3', when: [flagIs('ember-stop3', 0, 0)], notice: `(Rue went down on the Tuesday herself, with a mop bucket, and came back without the fuses.)` }];

// ---------- The scientists' pool (FULL_3 L8): paid in whatever ending, by whichever of the four is still solvent ----------
const MABLE = `Mable, counting it out in a staff corridor, into your hand: "I'd like it noted that this is the worst day of my professional life and I've never been so relieved."`;
const payout = (square: string, name: string, odds: number, when: Json[]): Json =>
  ev(`fl-pool-pays-${square}`, 'The Pool Pays', 'Evil Teams', { callback: true, requires: [flagIs(`flare-pool-${square}`), flagIs('flare-pool-paid', 0, 0), ...when], cast: [SCI[3]!], tint: '#2a2420' },
    `Your slip: "${name}," at ${odds} to 1. ${MABLE}`,
    [ch('Take it.', out(`₽${(500 * (odds + 1)).toLocaleString('en-US')}.`, $(500 * (odds + 1)), flag('flare-pool-paid')), {
      branches: [{ when: [flagIs('flare-pool-outside')], text: `₽${(1000 * (odds + 1)).toLocaleString('en-US')}: outsiders paid double, and are paid double.`, effects: [$(1000 * (odds + 1)), flag('flare-pool-paid')] }],
    })]);
const POOL: Json[] = [
  payout('yes', 'Yes', 2, [flagIs('flare-ending-plan')]),
  payout('short', `Yes, but it's short`, 5, [flagIs('flare-ending-plan'), flagIs('flare-thirty-miles', 0, 0)]),
  payout('stopped', 'No: stopped', 3, [...fl({ ends: ['defeated'] })]),
  payout('talked', 'No: talked out of it', 20, [flagIs('lysandre-sat')]),
  { ...payout('talked', 'No: talked out of it', 20, [flagIs('flare-ending-ember')]), id: 'fl-pool-pays-talked-ember' },
  payout('tall', 'The tall one', 50, [flagIs('flare-ending-az')]),
  payout('mgmt', 'New management', 40, [flagIs('flare-ending-own')]),
  payout('cleaners', 'The cleaners', 100, [flagIs('flare-ending-ember')]),
];

export const EVENTS: Json[] = [finalChoice, ...plan, ...turn, ...az, ...own, ...ember, ...POOL];
export const REMOVE: string[] = [];
