// Catalog Overhaul Pack, legends: Whole Run Event 1, GUIDANCE OF GIRATINA (expanded_notes/WHOLE_RUN_EVENTS.md section 2).
// The run draws it at the start (core/legends/wholeRun.ts, flag `wre-giratina`). Ten beats on the pack's skeleton: Beat 1 at Stage 2,
// Beats 2-3 in the first region, 4-6 a region later, 7-9 the region after, Beat 10 at the top of the League's steps (the last region).
// A beat waits for the one before it (`gg-beat`), so a late beat catches up instead of being lost; the climax needs only Beat 1.
// Threads are run flags: gg-faith, gg-doubt, gg-curse, gg-w (Witnesses, and gg-w-<who>), gg-lost, gg-names. Nothing here ends a run:
// every fight is friendly or pseudo, and losing the climax is the Raised ending. Same-run only. Known limits: docs/status/co-legends.md.
import { $, ch, br, ev, fight, flag, flagAgo, flagAt, flagIs, forRegion, fr, heal, out, ptype, relic, room, trainer, wild, party, type Json } from '../dsl.ts';

export const CATEGORY = 'legends';

const G = 'Whole Run: Guidance of Giratina';
const R = { room: true, rarity: 'epic' as const };
const not = (key: string): Json => flagIs(key, 0, 0);
const moment = (text: string, importance = 90): Json => ({ kind: 'moment', text, importance });
const regionsLeft = (atMost: number): Json => ({ kind: 'regionsLeft', atMost });
const anyFlag = (...keys: string[]): Json => ({ kind: 'anyFlag', keys });
const LITANY = '"What was cast out shall be called home. What was divided shall be folded. There is no far. There is no after. O praise be the Distortion."';
const ON = [flagIs('wre-giratina'), not('gg-done')];
/** Beat n waits for beat n-1, and for its region on the skeleton (Beats 4-6 a region after Beat 1, 7-9 two). */
const beat = (n: number): Json[] => [...ON, flagIs('gg-beat', n - 1, n - 1), ...(n >= 7 ? [flagAgo('gg-b1', 2)] : n >= 4 ? [flagAgo('gg-b1', 1)] : [])];
const step = (): Json => flag('gg-beat');
const faith = (n = 1): Json => flag('gg-faith', n);
const doubt = (n = 1): Json => flag('gg-doubt', n);
const curse = (n = 1): Json => flag('gg-curse', n);
const witness = (who: string): Json[] => [flag(`gg-w-${who}`), flag('gg-w')];
const card = (title: string, text: string): string => `${title}\n\n${text}`;
const fl = (name: string, o: Json = {}): Json => ({ ...trainer(name, { friendly: true, ...o } as never), friendly: true });
const DIVISION = ['dusknoir', 'banette', 'mismagius', 'sableye', 'drifblim', 'golurk'];

// ---------------------------------------------------------------- Beat 1. The Old Man at the Crossroads (Stage 2)
const b1 = ev('co-wre-gg-1', 'The Old Man at the Crossroads', G, { rarity: 'epic', requires: [...ON, flagIs('gg-beat', 0, 0)], cast: ['trainer.hiker'], tint: '#000000', effect: 'fog',
  remembers: [{ id: 'renegade', when: [flagIs('blessing-giratina')], notice: 'He stops and looks at you properly. "Oh. Oh, it has already touched you. I can smell the far side on you." He knows your name. You never told him.' }] },
  card('THE OLD MAN AT THE CROSSROADS', 'This story is a dark one. You can switch Whole Run Events off in Settings.\n\nAn old man steps into the road. He asks whether you have heard of the Distorted One. He does not wait for an answer. He never names a Pokémon.\n\n"In the beginning there was the First, and the First made three. One to keep the hours. One to keep the distances. And one to keep what the other two could not bear to look at.\nThe third was strong, and it was honest, and for its honesty they called it violent and put it out of the world. They built this," he taps the road with his stick, "on top of the door.\nIt is not dead, child. It is underneath. It has been listening to us walk about on its ceiling for a very long time."'),
  [
    ch('LISTEN', out('He tells you why he loves it. He lost someone. The priests of the other three told him she had gone far, and it would be a long time. Only the Distorted One, he says, promises a place with no far and no after.\n\nHe presses a grey stone into your hand. "O praise be the Distortion." He walks away.',
      flagAt('gg-b1'), step(), faith(2), flag('gg-stone'), moment('An old man at a crossroads gave you a grey stone and told you about something underneath the road.')),
    { branches: [br([flagIs('blessing-giratina')], 'He tells you why he loves it, and you find you already knew. He presses a grey stone into your hand like a man returning something. "O praise be the Distortion. They will be so glad you came."', flagAt('gg-b1'), step(), faith(4), flag('gg-stone'), moment('The old man at the crossroads knew your name before you said it.'))] }),
    ch('LEAVE', out('His hand closes on your shoulder, much stronger than it should be.\n\n"Heretic. You walk on its roof and will not hear its name. Then hear mine for you. May what you love go first. May your road be long and lead back here. May you be the last of your company standing, and may you understand, then, what I was offering."\n\nHe lets go. For the rest of the region, small things go slightly wrong.',
      flagAt('gg-b1'), step(), curse(2), forRegion('The old man\'s curse', { kind: 'captureMultiplier', value: 0.9 }, { kind: 'healingMultiplier', value: 0.95 }), moment('An old man at a crossroads cursed you.'))),
  ]);

// ---------------------------------------------------------------- Beat 2. The Marked Doors (Region 1, middle)
const b2 = ev('co-wre-gg-2', 'The Marked Doors', G, { rarity: 'epic', requires: beat(2), cast: ['trainer.hex_maniac'], tint: '#000000', effect: 'fog',
  remembers: [{ id: 'ghost', when: [ptype('ghost')], notice: 'People in grey robes nod to your Ghost-type in the street, as if it were family.' }] },
  card('THE MARKED DOORS', 'A town where half the doors carry a grey handprint. Marked houses are left alone. Unmarked houses are visited at night for a tithe: one Pokémon. A house with no Pokémon and a child loses the child to the Choir.\n\nA family asks you to mark their door for them. They cannot bring themselves to do it.'),
  [
    ch('Mark it.', out('You press your hand into the ash and then onto the wood. They are safe tonight. Your hand stays grey for a long time.', step(), faith()),
      { branches: [br([ptype('ghost')], 'You press your hand into the ash and then onto the wood. A woman in grey sees your Ghost-type and smiles at you like a sister. They are safe tonight.', step(), faith(2))] }),
    ch('Wipe the marks off every door.', fight('You go down the street with a wet cloth. By midnight the Division has come for all of it.', fl('The Faithful', { size: 3, team: DIVISION.slice(0, 3), win: [step(), flag('gg-wiped'), moment('You wiped the grey marks off a whole street and held it through the night.')], lose: [step(), flag('gg-wiped'), flag('gg-tithe'), moment('You wiped the marks off a street. You could not hold it. The tithe was doubled.')] }))),
    ch('Stand guard at one unmarked door.', out('A Deacon comes alone, near dawn. He is tired. You ask his name. He gives it, Brother Aldous, and looks startled to have been asked. He goes away without knocking.', step(), flag('gg-guarded'), flag('gg-deacon-name'), flag('gg-names'), doubt())),
  ]);

// ---------------------------------------------------------------- Beat 3. The Offering (Region 1, end)
const NEITHER = ch('NEITHER.', out('The Deacon hesitates. The rift, offered nothing, does not close. It stays in the hillside, and the land around it begins to sicken. Nobody dies today. The Division takes the Deacon away for failing.',
  step(), flag('gg-spared'), flag('gg-rift'), doubt(2), forRegion('The open rift', { kind: 'healingMultiplier', value: 0.9 }), moment('At the rift you would give it neither your Pokémon nor the Deacon. It stayed open.')));
const b3 = ev('co-wre-gg-3', 'The Offering', G, { rarity: 'epic', requires: beat(3), cast: ['trainer.psychic_m'], tint: '#000000', effect: 'flicker',
  remembers: [
    { id: 'named', when: [anyFlag('gg-deacon-name', 'gg-stone')], notice: 'You know something they did not expect you to know: a name, or the weight of a grey stone in your pocket.', addChoices: [NEITHER] },
    { id: 'doubt', when: [flagIs('gg-doubt', 2)], notice: 'You have asked too many questions for them to be sure of you. The Deacon is not sure of anything now.', addChoices: [NEITHER] },
  ] },
  card('THE OFFERING', 'A rift has opened in a hillside: a wound in the air, with the wrong sky behind it. A Deacon stands before it. Bound at the edge is one of your Pokémon.\n\n"It must be given a life. Yours is not asked for; you are a guest. So choose. The one who came to you last. Or me."\n\nThe Deacon means it. They are not afraid. They believe they are going home.'),
  [
    ch('THE POKÉMON.', out('It is taken. It looks at you the whole way. It is gone from your party, and its name is the one you will hear in every beat from now on. Your rival, when they hear, does not speak to you for a long time.',
      { kind: 'tradeAway', want: { label: 'a Pokémon' } }, step(), flag('gg-lost'), fr(-20), moment('You gave one of your Pokémon to the rift. The Division calls it the Lost.', 95)), { requires: [party(2)] }),
    ch('THE DEACON.', out('They thank you, turn, and walk into the rift.\n\nThe rift does not take them the way a door takes someone. It takes them the way a hand closes. Their feet leave the ground; down has moved, for them alone, and they fall sideways into the air and stop there, held. For a moment they are smiling. Then the space they are in begins to be smaller than they are. The last thing through is the hand, open, palm out. The ash print on it is the same size as the one on the door in the town.\n\nThen the air is flat and clean, and something on the far side of it, very large, makes a noise of contentment.',
      step(), faith(2), curse(), flag('gg-martyr'), fr(-10), moment('A Deacon walked into the rift instead of your Pokémon. Someone who loved them is hunting you now.', 95))),
  ]);

// ---------------------------------------------------------------- Beat 4. The Investigator (Region 2, early): three rooms, one Witness each
const b4 = ev('co-wre-gg-4', 'The Investigator', G, { rarity: 'epic', requires: beat(4), cast: ['boss.Spr_Pt_Looker'], tint: '#000000' },
  card('THE INVESTIGATOR', 'Looker has been following disappearances across three regions and has a wall of string to show for it. He has a photograph of you on it.\n\nLooker: "Grey handprints. Missing children who sing. You have seen them. Tell me what you saw, and wear this into the next one." He holds up a wire.'),
  [
    ch('Tell him everything, and wear the wire.', out('He listens without writing anything down. He tapes the wire under your collar himself, very gently.', step(), ...witness('looker'), flag('gg-wire'), room('co-wre-gg-4-rowan'))),
    ch('Tell him some of it.', out('He nods. He knows what you left out. "Some is not nothing." He does not offer the wire again.', step(), ...witness('looker'), room('co-wre-gg-4-rowan'))),
    ch('"I have never seen them."', out('Looker looks at the photograph of you on his wall, then at you. "Of course." He lets you go.', step(), flag('gg-lied'), room('co-wre-gg-4-rowan'))),
  ]);
const b4r = ev('co-wre-gg-4-rowan', 'The Investigator: The Professor', G, { ...R, cast: ['boss.rowan'], tint: '#000000' },
  'Professor Rowan has been sent the Division\'s scripture, and he does not like how much of it is accurate.\n\nRowan: "This is real history, written by someone who wanted it to be a prophecy. Bring me what they gave you, if they gave you anything."',
  [
    ch('Give him the grey stone.', out('He turns it over under the lamp for a long time. "I will keep it safe. You will have it back before the end." He becomes a Witness.', ...witness('rowan'), flag('gg-stone', -1), flag('gg-stone-rowan'), room('co-wre-gg-4-cynthia')), { requires: [flagIs('gg-stone')] }),
    ch('Ask him what it is for.', out('"For?" He closes the scripture. "It is for being afraid of correctly. Come back to me."', ...witness('rowan'), room('co-wre-gg-4-cynthia'))),
    ch('Keep your counsel.', out('He does not press you. He has met young people with secrets before.', room('co-wre-gg-4-cynthia'))),
  ]);
const b4c = ev('co-wre-gg-4-cynthia', 'The Investigator: The Inscription', G, { ...R, cast: ['boss.cynthia-gen7'], tint: '#000000' },
  'Cynthia is at a ruin nearby, reading an inscription over and over. She recognises the handwriting in the Division\'s oldest text, and will not yet say whose.\n\nCynthia: "Let me come with you. I need to see the end of this. I think I owe it that."',
  [
    ch('"Come with me."', out('She closes her notebook. "Thank you." She walks beside you as far as the next town and then is simply always nearby.', ...witness('cynthia'), moment('Cynthia said she would hold the line with you.'))),
    ch('"This is mine to do."', out('"Then I will be close." She means it.')),
  ]);

// ---------------------------------------------------------------- Beat 5. The Baptism (Region 2, middle)
const b5 = ev('co-wre-gg-5', 'The Baptism', G, { rarity: 'epic', requires: beat(5), cast: ['boss.n', 'boss.ghetsis'], tint: '#000000', effect: 'rain' },
  card('THE BAPTISM', `A lake town. The water has turned over: it reflects a sky that is not above it. The Division is leading people into it in rows. Those who go under come out quiet: calm, smiling, hollow. The Choir sings from the bank. ${LITANY}\n\nRemnants of Team Galactic watch from the trees. Team Plasma has split: Ghetsis thinks the Division is a tool he can pick up, and is already offering you a hand. N is on his knees at the waterline with his hands over his ears.`),
  [
    ch('Break it up by force.', fight('You go in hard. People panic; some run into the water. Fewer are saved than you hoped.', fl('Deacons of the Division', { format: 'doubles', size: 4, team: DIVISION.slice(1, 5), lv: 1, win: [step(), curse(), moment('You broke up the Baptism by force. Not everyone was saved.'), room('co-wre-gg-5-ghetsis')], lose: [step(), curse(), faith(), moment('You tried to stop the Baptism and could not.'), room('co-wre-gg-5-ghetsis')] }))),
    ch('Go under.', out('You walk in to pull one person out: the father from the town of marked doors. Underwater there is no battle, only the litany and a choice of which hand to take. You come out with one person, and with something of the lake in your eyes.', step(), faith(), doubt(), heal(0.3), room('co-wre-gg-5-ghetsis'))),
    ch('Call them by name.', out('You say the names you have learned, out loud, across the water. Each name turns one of the quiet around. They wade back to the bank, blinking, as if waking.', step(), doubt(2), flag('gg-names'), room('co-wre-gg-5-ghetsis')), { requires: [flagIs('gg-names')] }),
    ch('Help N.', out('He takes his hands from his ears long enough to tell you what the Pokémon under the water are saying. It is one word, over and over, and it is not "home". It is "no".\n\nN stays with you after that. Ghetsis watches you both, and smiles.', step(), ...witness('n'), doubt(), moment('N told you what the Pokémon under the lake were saying.'), room('co-wre-gg-5-ghetsis'))),
  ]);

const b5g = ev('co-wre-gg-5-ghetsis', 'The Baptism: A Hand Offered', G, { ...R, cast: ['boss.ghetsis'], tint: '#000000' },
  'Ghetsis finds you on the bank afterwards. He is not wet. He has not been near the water.\n\nGhetsis: "They are fools with a door. I have a use for a door. Stand with me, and when it opens, we will be the ones holding the handle."',
  [
    ch('Take his help.', out('His grip is dry and certain. "Sensible." He knows where the Synod meets. He will want something for it later.', flag('gg-ghetsis'), faith())),
    ch('Refuse.', out('"A pity." He walks away along the bank, already looking for someone else.', doubt())),
  ]);

// ---------------------------------------------------------------- Beat 6. The Kiss (Region 2, end)
const synod = 'You are brought before the Synod: seven veiled chairs in a hall with no visible walls. Six voices discuss you as if reading minutes. The seventh chair leans forward. It is the first time the Avatar speaks.\n\n"Leave them. I would like to see what it does."';
const b6 = ev('co-wre-gg-6', 'The Kiss', G, { rarity: 'epic', requires: beat(6), cast: ['trainer.will'], tint: '#000000', effect: 'flicker',
  remembers: [
    { id: 'ghetsis', when: [flagIs('gg-ghetsis')], intro: card('THE KISS', `Ghetsis gives you up, for a seat at the Synod. He does not look at you while he does it.\n\n${synod}`) },
    { id: 'wire', when: [flagIs('gg-faith', 6), flagIs('gg-wire')], intro: card('THE KISS', `Looker\'s wire is found. The Division thinks you are theirs, so it is you they ask to hand Looker over.\n\n${synod}`), hide: [0], addChoices: [
      ch('Hand Looker over.', out('You say his name to them. He looks at you once, without surprise. The chairs approve.', step(), faith(2), flag('gg-w-looker', -1), flag('gg-w', -1), flag('gg-lied'))),
      ch('Refuse.', out('"Interesting," says the seventh chair. They let you both go, because it is more interesting.', step(), doubt(2))),
    ] },
    { id: 'spared', when: [flagIs('gg-spared')], intro: card('THE KISS', `The Deacon you would not sacrifice finds you on the road. They have betrayed the Division instead, and they bring you the Synod\'s meeting place.\n\n${synod}`), hide: [0], addChoices: [
      ch('Go there and listen.', out('You learn the names of six chairs, and that the seventh has none.', step(), doubt(2), flag('gg-names'))),
    ] },
  ] },
  card('THE KISS', `Someone you trusted gives you up. A Witness, under threat to someone they love. They cannot look at you.\n\n${synod}`),
  [
    ch('Forgive them.', out('You tell them you understand. They do not believe you, and they stay anyway.', step(), doubt())),
    ch('Let them go.', out('They go. You are one Witness fewer.', step(), flag('gg-w', -1))),
  ]);

// ---------------------------------------------------------------- Beat 7. The Wilderness (Region 3, early)
const b7 = ev('co-wre-gg-7', 'The Wilderness', G, { rarity: 'epic', requires: beat(7), cast: ['trainer.will'], tint: '#000000' },
  card('THE WILDERNESS', 'The Avatar comes to you alone, on an empty stretch of road, with no guard. He is courteous. He has clearly looked forward to this. He sits with his hands folded in front of his mouth. He never uses your name.\n\nHe offers three things, one at a time, and each is real.'),
  [
    ch('"Command that it be returned."', out('He inclines his head. "It is already on its way." Something is coming back to you through the Distortion. It will be at the top of the steps, and it will not be on your side until you call it by name.', step(), flag('gg-returned'), faith())),
    ch('"All of this could be yours."', out('He offers you the Champion\'s seat, without the battle. You take his hand. It is cold, and he is delighted.', step(), flag('gg-usurper'), faith(3), moment('You accepted the Avatar\'s second offer: the Champion\'s seat, without the battle.'))),
    ch('"Step off. It will bear you up."', out('From now on your Pokémon sometimes hang on at the edge of fainting, held up by something. Each time it happens they are a little quieter afterwards.', step(), faith(2), fr(-15), relic('gg-borne-up', 'Borne Up', [{ kind: 'survivalChance', chance: 0.3 }]))),
    ch('Refuse all three.', out('He is not angry. He is interested.\n\n"Mere mortals always imagine that refusing is the brave thing. It is only the slow thing. You will come to the same door. I will hold it."', step(), doubt(2))),
  ]);

// ---------------------------------------------------------------- Beat 8. The Reveal (Region 3, middle)
const REVEAL = 'Cynthia explains what the Division\'s oldest text says, and whose hand wrote it. A man named Volo, long ago, who spent his life trying to reach the First through the Distorted One, and failed, and wrote down everything he learned so that someone else would not. The Avatar found the text and believes he is Volo, returned. He is not.\n\nAnd the last page: every Giratina anyone has ever seen, fought or caught is an avatar. A finger pushed through a curtain. The true one sank into the place it was sealed in. The true Giratina is the Distortion World itself, shaped like nothing, wanting in.';
const b8 = ev('co-wre-gg-8', 'The Reveal', G, { rarity: 'epic', requires: beat(8), cast: ['boss.cynthia-gen7'], pokemon: 'giratina', tint: '#000000', effect: 'flicker',
  remembers: [{ id: 'carried', when: [{ kind: 'partySpecies', species: 'giratina' }], notice: 'The Giratina in your party turns its head and looks at you, and for one second its eyes are not its own.' }] },
  card('THE REVEAL', 'At a spring where the water stands in a column, a Giratina is waiting. It can be fought. It can be caught.'),
  [
    ch('Face it.', fight('It comes out of the column of water as if out of a door.', { ...wild({ species: ['giratina'], lv: 2, win: [step(), moment('You faced a Giratina at the standing spring. Cynthia told you it was only a finger.')] }), pseudo: true, lose: [step()] }), { branches: [br([{ kind: 'partySpecies', species: 'giratina' }], `It will not fight the one you carry. It simply looks at it.\n\n${REVEAL}`, step())] }),
    ch('Listen to Cynthia first.', out(REVEAL, step(), doubt(), moment('At the standing spring you learned what the true Giratina is.'))),
  ]);

// ---------------------------------------------------------------- Beat 9. The Night Before (Region 3, late)
const b9 = ev('co-wre-gg-9', 'The Night Before', G, { rarity: 'epic', requires: beat(9), cast: ['boss.Spr_Pt_Looker', 'boss.cynthia-gen7'], tint: '#100808', effect: 'fire',
  remembers: [{ id: 'lost', when: [flagIs('gg-lost')], notice: 'Its place by the fire is left open. The others left it open.' }] },
  card('THE NIGHT BEFORE', 'A camp below the League. Whoever you gathered is here. Each of them offers one thing for tomorrow and asks one question tonight.'),
  [
    ch('Sit with your Witnesses.', out('Looker asks if you are afraid. He is. Cynthia tells you who Volo was to her family, and says she will hold the line. N asks whether a Pokémon can forgive. Rowan hands you back the grey stone; he has carved a second word under the first: "Home."', step(), heal(), flag('gg-stone')), { requires: [flagIs('gg-w', 2)] }),
    ch('Walk to the edge of the light.', out('A man in a grey coat is standing just outside the firelight. Cyrus.\n\n"I went to the place they want to open. I went there wanting a world without spirit. It is not empty. That is the problem with it."\n\nHe stays. He does not say why.', step(), ...witness('cyrus'), moment('Cyrus came out of the dark the night before the League, and stayed.')), { requires: [not('gg-lied')] }),
    ch('Sit with your party.', out('The last conversation is with the party. Nobody says anything much. Nobody needs to.', step(), heal(), fr(20))),
  ]);

// ---------------------------------------------------------------- Beat 10. The Raising (before the Champion)
const avatarTeam = ['giratina', 'dusknoir', 'hydreigon', 'gengar', 'dragapult', 'spiritomb'];
const phase1 = (size: number): Json => fight(`The Inquisitor and the Synod's Deacons are waiting on the steps. ${size < 6 ? 'Some of them lower their Poké Balls and step aside before it starts. They have heard you.' : 'Not one of them steps aside.'}`,
  fl('The Inquisitor', { size, team: DIVISION.slice(0, size), lv: 2, win: [room('co-wre-gg-10-avatar')], lose: [...raised()] }));
function raised(): Json[] {
  return [flag('gg-done'), flag('gg-end-raised'), forRegion('Raised: the world turned over', { kind: 'bossDamageTakenMultiplier', value: 1.15 }), moment('It came through. Not all of it. Enough. The Champion is trying not to look up.', 100)];
}
const b10 = ev('co-wre-gg-10', 'The Raising', G, { rarity: 'epic', requires: [...ON, flagIs('gg-b1'), regionsLeft(0)], cast: ['trainer.will'], tint: '#000000', effect: 'flicker',
  remembers: [{ id: 'usurper', when: [flagIs('gg-usurper')], notice: 'The seventh chair is waiting for you at the top of the steps. It has been waiting since the wilderness.', hide: [0, 1, 2, 3], addChoices: [
    ch('Take the seventh chair.', out('You sit. The Avatar kneels, delighted. Six veiled figures turn to face you. The Champion will still meet you, because nothing here ends a run; but the people in the stands are wearing grey.', flag('gg-done'), flag('gg-end-usurper'), forRegion('The Usurper', { kind: 'bossDamageMultiplier', value: 1.25 }, { kind: 'friendshipMultiplier', value: 0.5 }), moment('You took the seventh chair of the Synod. The Usurper.', 100))),
  ] }] },
  card('THE RAISING', `At the top of the League's steps the sky has been opened like the hillside was, and far larger. ${LITANY}`),
  [
    ch('Climb.', phase1(6), { requires: [flagIs('gg-doubt', 0, 1)] }),
    ch('Climb.', phase1(4), { requires: [flagIs('gg-doubt', 2, 4)] }),
    ch('Climb.', phase1(2), { requires: [flagIs('gg-doubt', 5, 7)] }),
    ch('Climb. Nobody stops you.', out('Every one of the Faithful on the steps lowers their Poké Ball and steps aside. There is no fight. There is only the man at the top.', room('co-wre-gg-10-avatar')), { requires: [flagIs('gg-doubt', 8)] }),
  ]);
const avatar = ev('co-wre-gg-10-avatar', 'The Raising: The Avatar', G, { ...R, cast: ['trainer.will'], pokemon: 'giratina', tint: '#000000', effect: 'flicker',
  remembers: [{ id: 'returned', when: [flagIs('gg-returned')], notice: 'Beside him, hollow-eyed, is the one you asked to have returned. It does not know you yet. You will have to say its name.' }] },
  'The Avatar of Distant Death stands at the top of the steps with his hands folded. His team is Ghost and Dragon, led by a Giratina he calls his own body.\n\n"Mere mortal. I am so glad it is you."',
  [ch('Fight him.', fight('He sacrifices his own Pokémon without a flicker.', fl('The Avatar of Distant Death', { format: 'doubles', size: 6, team: avatarTeam, lv: 3, win: [room('co-wre-gg-10-hand')], lose: raised() })))]);
const hand = ev('co-wre-gg-10-hand', 'The Raising: Strike or Lower Your Hand', G, { ...R, cast: ['trainer.will'], tint: '#000000' },
  'His last Pokémon falls. He is on one knee on the top step, and he is looking at you with enormous interest. You are asked one thing.',
  [
    ch('STRIKE.', out('You strike. Behind him the sky is still open, and the floor is starting to become the wall.', room('co-wre-gg-10-doors'))),
    ch('LOWER YOUR HAND.', out('You lower your hand. He does not understand it. Behind him the sky is still open.', flag('gg-lowered'), room('co-wre-gg-10-doors')),
      { branches: [br([flagIs('gg-doubt', 8)], 'You lower your hand. Behind you, on the steps, the Faithful see you do it. Behind him the sky is still open.', flag('gg-lowered'), flag('gg-mercy'), room('co-wre-gg-10-doors'))] }),
    ch('COMPLETE THE RITE.', out('You raise it. Every Pokémon in your party changes: stronger, and quiet. The Champion is the last person in the region who is not, and the fight is for that.', flag('gg-done'), flag('gg-end-convert'), forRegion('The Convert', { kind: 'damageMultiplier', value: 1.15 }, { kind: 'friendshipMultiplier', value: 0.5 }), moment('You completed the rite. The Convert.', 100)), { requires: [flagIs('gg-faith', 8)] }),
  ]);
// Phase 3: the Distorted One is the arena. Three acts, each needing something done long before; each one done takes three turns off the ten.
const act = (id: string, next: string, title: string, intro: string, ways: [string, Json[], string][]): Json =>
  ev(id, `The Raising: ${title}`, G, { ...R, tint: '#000000', effect: 'flicker' }, intro, [
    ...ways.map(([label, needs, text]) => ch(label, out(text, flag('gg-act'), room(next)), { requires: needs })),
    ch('You cannot.', out('Nothing you did long ago reaches this far. The turn goes on without it.', room(next))),
  ]);
const doors = act('co-wre-gg-10-doors', 'co-wre-gg-10-quiet', 'Close the Doors', 'The Distorted One is not a Pokémon on the field. It is the arena. The floor becomes the wall. In the walls, there are doors.',
  [['Close the doors.', [anyFlag('gg-wiped', 'gg-guarded')], 'You close them, one after another, the way you held a street once. They stay shut.']]);
const quiet = act('co-wre-gg-10-quiet', 'co-wre-gg-10-give', 'Call the Quiet', 'The quiet ones from the lake are standing in the air, facing the wrong way.',
  [['Call them by name.', [flagIs('gg-names', 3)], 'You call them by name. One by one they turn around.'],
    ['Call to them.', [flagIs('gg-doubt', 5)], 'You do not know their names, but they know your voice: you have argued with every one of them. They turn around.']]);
const give = act('co-wre-gg-10-give', 'co-wre-gg-10-endure', 'Give Back What Was Offered', 'Something on the far side is holding out its hand, palm up, waiting for what it was promised.',
  [['Give back the stone.', [flagIs('gg-stone')], 'You hold out the grey stone. Something on the far side takes it, and closes its hand.'],
    ['Call the returned one by name.', [flagIs('gg-returned')], 'You say its name. It stops, halfway across the step, and comes back to your side. What was offered is given back.'],
    ['Seal the hillside wound.', [flagIs('gg-rift'), flagIs('gg-w')], 'With a Witness\'s hand on yours, you press the wound in the hillside shut from here. What was offered is given back.']]);
const endure = (turns: number): Json => ({ ...wild({ species: ['spiritomb', 'dusknoir', 'banette'], lv: 3, win: [room('co-wre-gg-end')] }), pseudo: true, rule: { surviveTurns: turns, contrary: true, breakingFloor: true }, lose: raised() });
const endureRoom = ev('co-wre-gg-10-endure', 'The Raising: The Distorted One', G, { ...R, tint: '#000000', effect: 'shake' },
  'There is nothing to knock out. The room keeps making shapes and sending them at you. Type matchups invert, right themselves, invert. You must last.',
  [
    ch('Endure ten turns.', fight('Nothing you did reaches this far. Hold on.', endure(10)), { requires: [flagIs('gg-act', 0, 0)] }),
    ch('Endure seven turns.', fight('One door is shut. Hold on.', endure(7)), { requires: [flagIs('gg-act', 1, 1)] }),
    ch('Endure four turns.', fight('Two acts done. Hold on.', endure(4)), { requires: [flagIs('gg-act', 2, 2)] }),
    ch('Endure one turn.', fight('Three acts done. One more turn.', endure(1)), { requires: [flagIs('gg-act', 3)] }),
  ]);
const BREAKDOWN = 'The sky has closed. His Giratina has gone back into its Ball by itself. He is standing alone at the top of the steps and nothing is happening. This is the first time his voice rises.\n\n"No. No. Look again. You have not understood what you are looking at. I am not a man who failed. I am the will of a god, and a god does not fail: the world fails Him. I was chosen. I gave it everything. I gave it everyone. You are dust that learned to stand upright. You are an afternoon. I was going to make you eternal and you chose to stay small. And you look at me. You dare. With pity.\nI am not one of you. I am not one of you. I am not"\n\nHe stops, because he has heard his own voice echo off the stone, and it is only a voice.';
const ending = ev('co-wre-gg-end', 'Guidance of Giratina: The End', G, { ...R, cast: ['trainer.will'], tint: '#101010' },
  'The tenth turn ends. The room is a room again.',
  [
    ch('The sky closes.', out(`${BREAKDOWN}\n\nThe last of the rift, a crack no wider than a coin, takes him by the hand. He has time to understand that he is not being welcomed.`, flag('gg-done'), flag('gg-end-sealed'), forRegion('Sealed: the Champion has heard', { kind: 'bossDamageMultiplier', value: 1.1 }), moment('Guidance of Giratina: Sealed. The sky closed.', 100)), { requires: [flagIs('gg-act', 3), not('gg-mercy')] }),
    ch('The sky closes, and nothing takes him.', out(`${BREAKDOWN}\n\nNothing takes him. He is left standing there, ordinary, in the morning. Looker puts a coat round his shoulders. That is worse, and it is the better ending.\n\nThe Division walks away in ones and twos. Later, the old man is at the crossroads. He asks if you will listen now. This time he tells you his wife's name.`, flag('gg-done'), flag('gg-end-mercy'), forRegion('Mercy: hoods down in the stands', { kind: 'healingMultiplier', value: 1.2 }), moment('Guidance of Giratina: Mercy. The old man told you his wife\'s name.', 100)), { requires: [flagIs('gg-act', 3), flagIs('gg-mercy')] }),
    ch('The door will not shut from this side.', out('Someone has to hold it from within. The Witness who loves you most steps through without being asked. If there is nobody, it is the Pokémon who loves you most. The door shuts behind them.', flag('gg-done'), flag('gg-end-stayed'), fr(-30), forRegion('The One Who Stayed: one empty slot, in respect', { kind: 'bossDamageTakenMultiplier', value: 0.9 }), moment('Guidance of Giratina: someone stayed behind to hold the door.', 100)), { requires: [flagIs('gg-act', 0, 2)] }),
  ]);

export const EVENTS: Json[] = [b1, b2, b3, b4, b4r, b4c, b5, b5g, b6, b7, b8, b9, b10, avatar, hand, doors, quiet, give, endureRoom, ending];
export const REMOVE: string[] = [];
