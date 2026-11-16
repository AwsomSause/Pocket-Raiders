// Catalog Overhaul Pack, Evil Teams Volume III: Kanto, eleven scenes for any player, inside the team or out of it
// (TEAM_ROCKET_KANTO_FULL_3 part A, R1 to R11). Each shows a piece of Rocket that wasn't visible before. R12 (Entry
// 4,113) is not built: it needs a Pokémon released in an earlier run, and memory stays inside one run (Kice).
import { ch, ev, flag, flagIs, fr, inRegion, join, out, type Json } from '../dsl.ts';
import { evil as story, kind, prompt } from './_evil-story-kit.ts';
import { teamJson } from './evil-story-1.ts';

export const CATEGORY = 'evil-story';

const R = teamJson('rocket');
const GRUNT = R.ranks.grunt.sprite;
const EXEC = R.ranks.executive.sprite;
const TINT = R.color;
const say = (who: string, line: string): string => `${who}: "${line}"`;
/** Rocket is the region's team, the run is in Kanto, and its story has reached this far. */
const rk = (after: number, o: Json = {}): Json[] => [{ kind: 'evil', team: 'rocket', after, anyRoute: true, ...o }, inRegion('kanto')];
const night: Json = { kind: 'period', in: ['night'] };
const intel = (n: number): Json => flag('intel', n);
const heat = (n: number): Json => story({ heat: n });
const BOND = 25;
const open = { cast: ['trainer.pr/clerk_f'], tint: '#3a3428' };

const EVENTS_A: Json[] = [
  // R1. The Shop That Likes Them
  ev('rk-shop-likes-them', 'The Shop That Likes Them', 'Evil Teams', { requires: rk(2), ...open },
    `A pawnbroker's. A Rocket Grunt has just left with an envelope, and the owner is waving him off. ${say('Mr. Yorick Nettlebed', `You've a face on. You think I'm a victim. Sit down; I'll tell you about before. Before, there were four gangs. Each took what it liked. One took the till. One took the stock. One broke the window so I'd pay the other. Then the men in black came, and there was one, and it took a tenth, and it wrote it down, and it never came twice.`)} ${say('Mr. Nettlebed', `I'd pay double to be let alone. He won't take double. A tenth. It's the only honest number in this town. The League's licence fee's fifteen.`)}`,
    [
      ch(`"It's still extortion."`, out(say('Mr. Nettlebed', `Course it is. So's the licence. One of them sends a man round when my window's broken.`))),
      ch('"What happened to the four gangs?"', out(say('Mr. Nettlebed', `He bought three. The fourth he audited. I never found out what that meant. They left town.`), intel(2), flag('rocket-lore-gangs'), flag('rocket-rules-heard'))),
      ch('"What do you get for the tenth?"', out(`He opens a drawer: a card with one telephone number. ${say('Mr. Nettlebed', `I rang it once. A lad had robbed me. He was back in an hour, with everything, and a split lip, and an apology he'd been made to write out.`)} He lets you copy the number.`, flag('rocket-lore-card'))),
    ]),
  // R2. Matori's Day Off
  ev('rk-matori-day-off', `Matori's Day Off`, 'Evil Teams', { requires: [...rk(3), flagIs('matori-met')], cast: [EXEC], tint: '#3a4a3a' },
    `A woman on a park bench with a tablet she isn't looking at and an ice cream she doesn't know how to hold. ${say('Matori', `He told me to take one. A day. I've nine years of them owed. I've been sitting here since eight. I don't know what one does.`)} The tablet buzzes. She doesn't look. ${say('Matori', `That's him. He's lost a helicopter. He hasn't lost it. It's where I left it. He doesn't know where I leave things.`)}`,
    [
      ch('"Eat the ice cream."', out(`She does. It gets on her cuff. She laughs: once, the way a door opens that hasn't been opened in a long time.`, flag('matori-bench'))),
      ch('"What did you do before?"', out(say('Matori', `I was a Gym's registrar. Viridian. I kept the challengers' book. He passed every inspection; I wrote them up. I know better than anyone alive that he was good at the honest thing. I think that's why I stayed. Somebody should remember it.`), flag('matori-bench'))),
      ch('"What are you running from?"', out(`Nobody's ever asked her. ${say('Matori', `...A house with nobody in it who needs to be told where anything is.`)}`, flag('matori-bench'))),
      ch('Stay a while.', out(`You sit. The ice cream melts. She tells you where the helicopter is, and a great deal else, freely, as conversation.`, intel(3), flag('matori-bench'))),
    ]),
  // R3. The Dentist on B2
  ev('rk-dentist', 'The Dentist on B2', 'Evil Teams', { requires: rk(2), cast: ['trainer.pr/clerk_f'], tint: '#2a3a3a', effect: 'sparkle' },
    `A door in the Hideout marked DENTAL. A queue of Grunts, holding their jaws, behaving perfectly. ${say('Dr. Orsolya Wexford, masked', `You're not on my list. Are you in pain? Sit. I don't care whose side you're on; I care about your molars. I was struck off. I treated a man who couldn't pay, in a surgery that wasn't mine. He heard. He said: "I've four hundred staff who've never seen a dentist. Name your equipment." I named it. It was here on Monday. I know what they do. I've decided my job's the teeth. Somebody's got to do the teeth. Open.`)}`,
    [
      ch('"Open."', out(`She looks at your teeth, and then, without asking, at your lead's. "A Raticate's a patient like any other." Everyone gets a clean bill.`, fr(BOND, 'lead'), flag('wexford-met'))),
      ch('"Does it bother you?"', out(say('Dr. Wexford', `Every day. Then somebody sits in that chair who hasn't been able to chew for a year, and it bothers me less. Open.`), flag('wexford-met'))),
      ch('"What do the Grunts say, in the chair?"', out(say('Dr. Wexford', `Everything. They can't not; I've my hand in. The big one cries about his mum. The girl by the door's posting her wages home in someone else's name. There's a lad on nineteen-upper they don't mention.`), intel(2), flag('wexford-met'))),
    ]),
  // R4. The Black Tag Clinic
  ev('rk-black-tag-clinic', 'The Black Tag Clinic', 'Evil Teams', { requires: rk(3), ...open, pokemon: 'clefairy' },
    `A van with its back open and a hand-painted sign: TAGS OFF. NO QUESTIONS. A queue of people holding prize Pokémon from the Game Corner. ${say('Kingsley Umber, a vet\'s assistant with bolt-cutters', `They win one at the Corner. Lovely Pokémon. Does as it's told. Then they notice it does only as it's told. Won't play. Won't choose. That's the tag. Takes a second to cut. Takes a month for them to realise they're allowed to move. Don't order it about for a month. Just ask it things. "Do you want this?" Let it not know. Let it find out.`)} A girl holds a Clefairy that's sitting exactly where it was put.`,
    [
      ch('"Can I help?"', out(`You hold a Growlithe still while the tag's cut. You show a Meowth the cut doesn't hurt: your lead goes first, and lets Kingsley pretend. Then you sit with the Clefairy for a long time, asking it things. The Clefairy moves one paw.`, ...kind(2))),
      ch('"Who taught you to cut them?"', out(say('Kingsley', `A woman at the lab. Sotheby. She leaves the cutters in a bin behind the Corner, Wednesdays. I've never met her.`), flag('rocket-lore-sotheby'))),
    ]),
  // R5. The Plum Tree
  ev('rk-plum-tree', 'The Plum Tree', 'Evil Teams', { requires: rk(1), cast: ['trainer.pr/clerk_f'], tint: '#3a2a3a' },
    `A garden behind a house with no number in Viridian. A plum tree. An old woman with secateurs, pruning as if she's telling it off. ${say('The old woman', `You've walked in. People don't. There's usually a man. I gave him the afternoon.`)} Under the tree is a small flat stone with no name: a carved Pidgey, worn smooth by a thumb. ${say('The old woman', `First thing I ever kept. A boy couldn't pay. I meant to send it back. Then it took to sitting on the ledger while I wrote, and I thought: well. One. My son thinks keeping's the whole of it. He never asked why I only kept one.`)}`,
    [
      ch('"Why only one?"', out(say('The old woman', `Because once you've loved a thing you took, you know exactly what you've done to the person you took it from. I couldn't do it twice. He's never loved anything he took. That's the trouble. Not that he's wicked. That he's never been caught by it.`), flag('rocket-madame-met'), flag('rocket-madame-line'), flag('rocket-rules-heard'))),
      ch(`"Who's your son?"`, out(`She smiles. ${say('The old woman', `A Gym Leader. A very good one. Ask anybody.`)}`, flag('rocket-madame-met'), flag('rocket-madame-line'))),
      ch(`"It's a good tree."`, out(`"It is," she says, and picks you a plum, and tells you to give it back when you can pay.`, flag('rocket-madame-met'), flag('rocket-madame-line'), flag('rocket-rules-heard'))),
    ]),
  // R6. Induction Day
  ev('rk-induction-day', 'Induction Day', 'Evil Teams', { requires: rk(0, { ends: ['none'], anyRoute: false, inside: false }), cast: [GRUNT], tint: TINT },
    `A hired hall. Folding chairs. Twenty people who've never met, each holding a uniform in a paper bag. ${say('Sergeant Jardine, delighted', `Welcome to Team Rocket! Tea's at the back. Three things. One: you're paid Fridays. Two: you'll be given a twelfth. Do your twelfth. Three: don't ask what the other eleven are. Questions? No. Lovely. That's the point of three.`)} You're taken for a recruit, and handed a bag. Beside you, a woman of fifty in a cleaner's tabard: "My sister said they've a dentist." A boy of seventeen: "I failed the League entrance twice. They don't have an entrance." A man in a good coat worn at the cuffs: "I was a bank manager. Was. Do you know who came to my leaving do? Nobody. Do you know who rang the day after?"`,
    [
      ch('Take the bag.', out(`You take it. Jardine shakes your hand with both of his. You're Team Rocket now, from the inside, and early.`, story({ mark: 'inside' }), flag('rocket-offered')), { requires: [flagIs('rocket-offered', 0, 0), { kind: 'evil', team: 'rocket', after: 0, inside: false }] }),
      ch('Tell them what the twelfths add up to.', out(`You stand up and say it: crates, collars, a Sandshrew with its eyes shut. Silence. The bank manager puts his bag on his chair. Four others do. The cleaner keeps hers: "I've four grandchildren and no teeth, love. I heard you. I'm stopping."`, heat(3), ...kind(2), flag('rocket-induction-told'))),
      ch('"Why are you all here?"', out(`Each of them says. Rent. Teeth. A sister. A father who said they'd never be anything. Somebody sent a car. It's the same story in twenty voices.`, intel(2))),
      ch('Leave quietly.', out(`You put the bag on your chair and slip out by the fire door. Nobody stops you.`)),
    ]),
  // R7. Griggs's Egg
  ev('rk-griggs-egg', `Griggs's Egg`, 'Evil Teams', { requires: rk(4), cast: ['trainer.worker_m'], tint: '#3a2e22' },
    `A miner's hut near Mt. Moon. A big man in a Rocket vest, sitting very carefully, with a hot-water bottle and something wrapped in his coat. ${say('Foreman Griggs', `Don't shout. Don't— it's asleep. I think it's asleep. I don't know what they do.`)} In the coat: a stone, round, warm, the size of a loaf. It's a fossil. He doesn't know that. ${say('Griggs', `Found it eleven months back. Should've gone in the crate. It was warm. I thought: that's an egg. That's somebody's. I've kept it by the stove. It's never hatched. I've a bad feeling I've been keeping a rock warm for a year.`)}`,
    [
      ch(`"It's a fossil."`, out(`He looks at it for a long time. "...So nobody's in there." "Somebody is. They've just been asleep longer than an egg." He holds it tighter.`)),
      ch('Take it to someone who will wake it properly.', out(`He comes too. He's never left the dig. At the Pewter Museum, on the plate, it cracks along a line that was always there. It looks at him first. It's his: he's a father at forty-six, to an Omanyte. He doesn't go back to the dig.`, flag('griggs-left'), ...kind(1))),
      ch('"Why didn\'t you hand it in?"', out(say('Griggs', `Because they wake them up bound. I've seen it. They come out of the machine screaming with a collar already on. I couldn't— it was warm. I couldn't.`), flag('griggs-egg-kept'))),
      ch('Leave it with him.', out(`He keeps it by the stove, and thanks you for not shouting.`, flag('griggs-egg-kept'))),
    ]),
  // R8. The Thirty-Third Cage
  ev('rk-thirty-third-cage', 'The Thirty-Third Cage', 'Evil Teams', { requires: [...rk(4), night], cast: ['trainer.worker_m'], pokemon: 'chansey', tint: '#1e2a1e' },
    `The Safari, after closing. A row of cages on a lorry. A man walking along them with a ledger, counting under his breath. ${say('Poacher-Captain Rudd', `Thirty. Thirty-one. Thirty-two.`)} He stops at the last. He looks left. He looks right. He opens it. A Chansey gets down, slowly, and walks back into the long grass. ${say('Rudd', `Thirty-two. That's the count.`)} He's seen you. ${say('Rudd', `...You didn't see that. I've a clean count. Thirty-two. Every night for four years: thirty-two.`)}`,
    [
      ch('"Why that one?"', out(say('Rudd', `Whichever's last. I don't choose. If I chose, I'd have to choose the others too, wouldn't I? This way it's just: the count's short. Counts are sometimes short.`))),
      ch('Open the rest.', out(`He doesn't stop you. He doesn't help. He stands with his book open and watches thirty-two cages emptied, and at the end he writes one line: "Count: nil."`, heat(4), ...kind(2), flag('rudd-nil'))),
      ch('Leave it.', out(`"Thirty-two," he says, to nobody, and starts the engine.`)),
      ch('"Make it a decision."', out(`A long time. He opens a second. Then he sits down on the running board. "...That's it, then. I've decided. I can't count that." He opens them himself.`, ...kind(2), flag('rudd-decided'))),
    ]),
  // R9. The Collector's Daughter
  ev('rk-collectors-daughter', `The Collector's Daughter`, 'Evil Teams', { requires: rk(3), cast: [GRUNT], tint: '#3a3428' },
    `A sweet shop. A man behind the counter is counting a tenth into an envelope. The Grunt who's come for it is about eighteen, and won't look at him. ${say('The shopkeeper', `There. A tenth. To the coin. ...Take it, then, Bess.`)} ${say('Bess Ostrander', `Dad. Don't— it's a job. I joined so it'd be me. If it's me, nobody leans on you. I thought if I was on the side that collects—`)} ${say('The shopkeeper', `You thought it'd stop if you were holding the bag. It's my daughter holding the bag. That's not it stopping. That's it getting in the house.`)}`,
    [
      ch('"Take it. Then put it back in his till on Sunday."', out(`She stares. "That's— that's not collecting." "It's collecting. Then it's a daughter giving her dad some money." She does it every week, from then on.`, ...kind(1), flag('bess-sunday'))),
      ch(`"Bess. What happens if you don't collect?"`, out(`"They send Cassidy." The shopkeeper pays.`)),
      ch('(Pay the tenth for him.) (₽500)', out(`You put your own coins on the counter. He's furious. She's grateful. Neither of them thanks you.`, { kind: 'money', amount: -500 }, ...kind(1)), { requires: [{ kind: 'money', atLeast: 500 }] }),
    ]),
  // R10. The Honest Inspector
  ev('rk-honest-inspector', 'The Honest Inspector', 'Evil Teams', { requires: rk(3), cast: ['trainer.gentleman'], tint: '#2e2e3a' },
    `An old man with a League lapel pin, doing a crossword, has noticed your Badges. ${say('Mr. Ezra Pilkington', `Eight slots. You'll be wanting the Earth one, in time. I inspected that Gym. Eleven times. They sent me because I'd failed four Leaders in a year. I wanted to fail him. I'd heard things. I couldn't. The floor was raked. The trainers were paid. He lost to a girl of eleven with a Squirtle, and he lost properly, and he shook her hand, and he gave her the Badge with both of his. I wrote: "Cleanest Gym in Kanto." I've never been easy about it.`)}`,
    [
      ch('"Were you wrong?"', out(say('Mr. Pilkington', `No. That's what's kept me up. I was right. It was the cleanest Gym in Kanto. He'd simply got another building.`), intel(3), flag('rocket-lore-inspector'))),
      ch('"What did you hear?"', out(say('Mr. Pilkington', `That the Leader of Viridian owned a casino, a dig and a shipping line. All true, it turned out. None of it in his Gym.`), intel(3), flag('rocket-lore-inspector'))),
      ch('"Did he pay you?"', out(say('Mr. Pilkington', `He had me followed home, I think, to see if I could be. I can't. I'd have liked to be asked.`), intel(3), flag('rocket-lore-inspector'))),
    ]),
  // R11. Thursday
  ev('rk-thursday', 'Thursday', 'Evil Teams', { requires: [...rk(4), night], cast: [], pokemon: 'vulpix', tint: '#160e22', effect: 'fog' },
    `Thursday. A Rocket lorry, stopped across the road, doors open, engine running. Nobody in it. A cap on the tarmac. In the back: one crate, shaking. Not the crate: what's in it. The air has gone cold in a patch about the size of a room, and the patch is moving along the road toward the lorry. Something's in it: a shape made of smoke and a smell of burnt wire. It isn't after you. It's after the collar. (The Black Fog can't be fought here.)`,
    [
      ch('Open the crate, and get the collar off.', out(`Your fingers find the clasp with the cold coming on. It's a Vulpix. It's got a ribbon. The collar comes away in your hands; the Fog takes it out of them, gently, like something being passed, and it's gone. The Vulpix is in your coat. The ribbon has a name on it, if you ever want to take it home.`, join({ species: ['vulpix'] }), flag('rocket-fog-understood')), { prompt: prompt('pull-hold'), fail: out(`The clasp won't give. The cold comes on, and leans past you, and takes the collar off itself. The Vulpix runs into the dark. It's free. It never needed you to be quick.`, flag('rocket-fog-understood')) }),
      ch('Stand between it and the lorry.', out(`It stops. It leans. It goes through you: for one second you're very cold, and you remember something that isn't yours: a tower, a hand fitting a collar, a decision to bite. Then it's past, and the crate is quiet, and the collar is gone. Every one of your Pokémon stepped in front with you.`, fr(BOND, 'party'), flag('rocket-fog-understood'))),
      ch('Get out of its way.', out(`It takes the collar. It doesn't hurt the Vulpix. It never has. It only eats Rigs. The Grunts are wrong about what it is.`, flag('rocket-fog-understood'))),
    ]),
];

export const EVENTS: Json[] = EVENTS_A;
export const REMOVE: string[] = [];
