// Catalog Overhaul Pack, category "singles" (revised single events), batch 9.
// Doc: catalog_overhaul/STORY_FAMILIES_21.md SF150 Elite Four and Famous Faces, SF151 Item Returns, SF152 Milestones, SF153 Quiet Moments.
// Known limits: docs/status/co-singles.md.
import { $, any, bondUp, ch, express, fight, flag, flagIs, good, heal, item, join, leave, out, reveal, room, scout, takeNode, trainer, type Json } from '../dsl.ts';
import { friendlyAll } from './_singlesKit.ts';

export const CATEGORY = 'singles';

const moment = (text: string, importance = 40): Json => ({ kind: 'moment', text, importance });
const has = (id: string): Json => ({ kind: 'item', id });
const lose = (id: string): Json => ({ kind: 'loseItem', id });
const no = (key: string): Json => flagIs(key, 0, 0);
const line = (species: string, absent = false): Json => ({ kind: 'partyLine', species, ...(absent ? { absent: true } : {}) });
/** "Reputation +N": the run flag `rep` the people row uses until the per-region reputation lands. */
const rep = (n = 1): Json => flag('rep', n);
const rest: Json = { kind: 'rest' };
const cure: Json = { kind: 'cure' };
const later = (eventId: string, nodes: number): Json => ({ kind: 'laterEvent', eventId, nodes });
const rm = (id: string, name: string, group: string, intro: string, choices: Json[], o: Json = {}): Json => ({ id, name, group, room: true, scene: { cast: [], effect: 'none' }, ...o, intro, choices });
const effort = (stat: 'atk' | 'spe' | 'spd'): Json => ({ kind: 'statBoost', stat, percent: 5, who: 'lead', until: 'run' });
const e4 = (name: string, o: Json = {}): Json => trainer(name, { cls: 'ace-trainer', size: 3, lv: 3, types: ['dragon'], ...o });
const RARE = ['leftovers', 'focus-sash', 'life-orb', 'choice-band', 'choice-specs', 'choice-scarf'];

// ---------- SF150. ELITE FOUR AND FAMOUS FACES ----------
const SF150: Json[] = [
  {
    id: 'ev-elite-four-exhibition',
    intro: 'A member of the Elite Four waves you into an empty exhibition court. Up close she is smaller than on television and her eyes are kinder. "An exhibition. Nothing is lost, win or lose. I just want to see what you have."',
    choices: [
      ch('Battle.', fight('"Good. Show me." She sends out her first Pokémon with a flick of the wrist, and you understand in the first exchange how far there still is to go, and how much fun it will be getting there.', e4('Elite Four Member', { win: [moment('Held your own against the Elite Four in an exhibition.', 55)] }))),
      ch('Watch them train.', out('You sit in the empty stands and watch her train for an hour. She never wastes a move. Every switch sets up the next, every attack leaves the foe one choice. By the end you can see her style as plainly as a map: patient, then sudden, then over.', moment('Watched an Elite Four member train.', 40))),
    ],
  },
  {
    id: 'face-e4-chef',
    intro: 'The Elite Four\'s dragon trainer is wearing an apron and a very serious face. "I cook before every league day. It calms the dragons. It calms me. Sit down. Eat."',
    choices: [
      ch('Eat.', out('She feeds your whole team until nobody can move: dragon-fruit stew, spiced rice, a cake shaped like a Dragonite that your team demolishes with respect. Everyone comes away whole and warm and half asleep.', heal())),
      ch('Help cook.', out('You chop, she stirs, and while she stirs she talks: about her ace, how it opens with Dragon Dance when it is safe, then Outrage, then Extreme Speed to finish anything left standing. "Now you know," she says. "Knowing is not the same as stopping it." She is smiling.', moment('Cooked with an Elite Four member and learned her ace\'s moves.', 45))),
    ],
  },
  {
    id: 'face-e4-practice',
    intro: 'A member of the Elite Four is warming up on an empty court. "Practice only. Lose and nothing is lost. Win, and I will teach your lead the move my ace is proudest of."',
    choices: [
      ch('Battle.', fight('"Come on, then." She does not hold back much. She does not need to.', e4('Elite Four Member', { win: [{ kind: 'teachMove', move: 'dragon-pulse' }, moment('Won a practice match against the Elite Four.', 55)] }))),
    ],
  },
  {
    id: 'face-ace-scouting',
    intro: 'An ace trainer has been watching you battle from a distance, and walks up at last. "I scout talent for a living. You\'ve got it. Take one of mine on loan for this stretch: from my Lucario line, a few levels above your team. I\'ll find you and take it back when the stage is done."',
    choices: [
      ch('Take the loan.', out('The loaned Pokémon looks you over, decides you will do, and falls in beside your team as if it had always been there. "Look after it," the scout says. "It\'ll look after you."', { ...join({ species: ['lucario'], lv: 3 }), direct: true }, flag('ace-loan'), later('face-ace-scouting-return', 6))),
      ch('No.', leave('"Fair enough. Your team, your way." The scout tips their cap and goes back to watching.')),
    ],
  },
  rm('face-ace-scouting-return', 'The Scout Comes Back', 'Famous faces', 'The ace scout is waiting by the road, exactly as promised. "Stage done. Time for my Pokémon to come home." It looks between the two of you, and for a moment it does not move.', [
    ch('Give it back.', out('You say thank you, properly, and it touches its paw to your hand before it goes. "It liked you," the scout says, surprised. "It doesn\'t like anybody."', { kind: 'tradeAway', want: { label: 'The loaned Pokémon', species: ['riolu', 'lucario'] } }, flag('ace-loan', -1), moment('Gave back a loaned Pokémon.', 40)), { branches: [{ when: [line('riolu', true)], text: 'The loaned Pokémon is not with you any more, and you tell the scout what happened. They are quiet for a long moment. "That\'s the job," they say at last. "Thanks for telling me straight."', effects: [flag('ace-loan', -1)] }] }),
  ]),
  {
    id: 'face-announcer',
    intro: 'A microphone on a stick pokes into your face. A man in a glittering jacket: "Ladies and gentlemen, our next challenger! And what does the crowd call you?"',
    choices: [
      ch('My real name.', out('You say your name into the microphone, and the crowd shouts it back, and keeps shouting it. For the rest of this region, wherever you battle, somebody in the stands is going to chant it.', rep(1), flag('chant-real'), moment('The crowd learned your name.', 45))),
      ch('A nickname.', out('You give them a nickname on the spot. The announcer loves it. The crowd loves it more. For the rest of this region it is the only name anyone in the stands will use for you.', rep(1), flag('chant-nickname'), moment('The crowd gave you a nickname.', 45))),
    ],
  },
  {
    id: 'face-badge-collector',
    intro: 'A collector with a vest covered in glass-cased badges taps one with a fingernail. "Every Gym has a hidden requirement, you know. Beat it a certain way and the Leader gives you something extra. Want to know this one\'s?"',
    choices: [
      ch('Tell me.', out('"Win without your lead fainting. That\'s it. She respects a trainer who protects their first Pokémon." He shows you the Leader\'s team, too, ticking them off on his fingers. "Go on. Make me proud."', { kind: 'gymPreview' }, flag('gym-secret'))),
    ],
  },
  {
    id: 'face-breeders-convention',
    intro: 'Rows of folding tables, all covered in egg cartons and photographs of very proud parents. A banner reads: BREEDERS UNITE.',
    choices: [
      ch('Ask about eggs.', out('A breeder with a cardigan full of pins talks to you for half an hour about eggs: how warm, how long, why you should always sing to them. You come away knowing far more than you expected and feeling oddly moved.', bondUp(1, 'party'))),
      ch('Show my team.', out('You line up your team on the table. A breeder looks them over with a jeweller\'s eye, stops at one, and smiles. "This one could learn something its parents knew. Here, let me show you." Your Pokémon learns an egg move it should never have been able to.', { kind: 'eggMove' })),
    ],
  },
  {
    id: 'face-chef-throwdown',
    intro: 'A celebrity chef slams a knife into a cutting board. "A cook-off! Taste decides. You, me, one dish, one judge. Pick your flavour."',
    choices: [
      ch('Spicy.', out('Your curry makes the judge cry, in the good way. "Spicy," she gasps. "I always go for spicy." You win: the crowd cheers, and the chef hands over a Big Malasada with real grace.', rep(1), item('big-malasada')), { chance: 0.34, fail: out('The judge takes one bite and fans her mouth. "Too hot! I\'m a sweet person, really." The chef wins, and shakes your hand anyway.') }),
      ch('Sweet.', out('Your berry pie makes the judge close her eyes. "Sweet. I\'m a sweet person, really." You win, and the chef hands over a Big Malasada.', rep(1), item('big-malasada')), { chance: 0.33, fail: out('The judge smiles politely. "Lovely. But I\'m a hearty eater." The chef wins, and gives your team the leftovers.') }),
      ch('Hearty.', out('Your stew is gone in four spoonfuls. "Hearty! That\'s what I like." You win, and the chef hands over a Big Malasada.', rep(1), item('big-malasada')), { chance: 0.33, fail: out('The judge pushes the bowl away. "Filling. But I want something with fire in it." The chef wins, and pats you on the back.') }),
    ],
  },
  {
    id: 'face-coach-whistle',
    intro: 'A coach blows a whistle right by your ear. "You! Your lead! Ten laps! No, wait, decide NOW: speed, power, or nerves?"',
    choices: [
      ch('Speed.', out('Sprints, until your lead is a blur and the coach is hoarse. A little faster, for good.', effort('spe'))),
      ch('Power.', out('Boulder-pushing, until your lead stands a little broader. A little stronger, for good.', effort('atk'))),
      ch('Nerves.', out('The coach blows the whistle, over and over, closer and closer, until your lead stops flinching at all. A little steadier, for good.', effort('spd'))),
    ],
  },
  {
    id: 'face-doctor-checkup',
    intro: 'A doctor with a stethoscope and a clipboard stops you on the road. "Free check-up. Two minutes. I promise."',
    choices: [
      ch('Yes.', out('She checks every one of them, ears, paws, teeth, and clears up every little ailment. Then she taps her clipboard. "One more thing. {least} hasn\'t been in a battle in a while. It\'s restless. It wants to help. Let it."', cure)),
    ],
  },
  {
    id: 'face-fisherman-legend',
    intro: 'An old fisherman reels in nothing and smiles at you. "Once upon a tide I hooked a Gyarados. It hooked me back. Care to hear it?"',
    choices: [
      ch('Tell me.', out('He tells it the long way: the storm, the line singing, three days and three nights, and the moment the Gyarados looked him in the eye and let him go. "Never caught it. Never needed to." He hands you his old rod. "Your turn."', item('good-rod'), moment('Heard the fisherman\'s Gyarados story.', 35))),
    ],
  },
  {
    id: 'face-hiker-story',
    intro: 'A weathered hiker sits on a rock, cleaning a compass. "Thirty years of caves. Want to hear which ones lie?"',
    choices: [
      ch('Tell me.', out('He tells you about every cave between here and the Gym, and which way out of each is the one nobody uses. "The next one has a back door," he says. "Follow the cold air."', reveal(), scout(3))),
    ],
  },
  {
    id: 'face-idol-backstage',
    intro: 'A guard waves you through by mistake. Backstage, a pop star is stretching, and spots your Pokémon. Her whole face lights up. "Oh! Can I meet them? Please?"',
    choices: [
      ch('Yes.', out('She meets every one of them properly, sitting on the floor in her stage costume, and every one of them is a little in love with her by the end. She signs your bag. Word gets round.', bondUp(1, 'party'), rep(1))),
      ch('Only the lead.', out('She kneels in front of your lead and talks to it like an old friend, and it leans into her hand. She signs your bag on the way out. Word gets round.', bondUp(1, 'lead'), rep(1))),
    ],
  },
  {
    id: 'face-jenny-checkpoint',
    intro: 'A police officer flags you down at a road barrier. "Routine check. Anything to declare?"',
    choices: [
      ch('Nothing.', out('She looks at your bag, looks at you, and waves you through. "Safe travels."')),
      ch('A key from a hideout.', out('You hold up the key you took from the evil team. Her face changes. "Where did you get this?"', room('face-jenny-key')), { requires: [flagIs('evil-key')] }),
    ],
  },
  rm('face-jenny-key', 'Where Is It From?', 'Famous faces', 'The officer turns the key over in her fingers. "This opens one of theirs, doesn\'t it. Where?"', [
    ch('Tell her everything.', out('You tell her everything: the gate, the grunts, the way in. She writes it all down, then looks up. "We\'ll raid it tonight. When you get there, there\'ll be fewer of them." She shakes your hand like she means it. Word gets round.', rep(2), flag('jenny-raid'), moment('Told the police where the evil team\'s hideout is.', 55))),
    ch('Say you found it.', out('"Found it." She does not believe you, and does not push. She gives the key back. "Be careful."')),
  ]),
  {
    id: 'face-journalist',
    intro: 'A reporter with a notepad leaps out of a bush. "Three questions for the paper! First: why do you battle?"',
    choices: [
      ch('For my team.', out('"For my team." She writes it down. "Second question, coming up."', flag('press-heart'), room('face-journalist-2'))),
      ch('To be the best.', out('"To be the best." She grins and writes it down. "Second question."', flag('press-bold'), room('face-journalist-2'))),
      ch('Honestly? For fun.', out('"For fun." She laughs. "Second question."', flag('press-light'), room('face-journalist-2'))),
    ],
  },
  rm('face-journalist-2', 'Second Question', 'Famous faces', '"Second: what do you think of your rivals?"', [
    ch('They push me.', out('"They push me." She underlines it. "Last one."', flag('press-heart'), room('face-journalist-3'))),
    ch('I\'ll beat them all.', out('"I\'ll beat them all." She underlines it twice. "Last one."', flag('press-bold'), room('face-journalist-3'))),
    ch('They\'re funny.', out('"They\'re funny." She bites her pen to keep from laughing. "Last one."', flag('press-light'), room('face-journalist-3'))),
  ]),
  rm('face-journalist-3', 'Last Question', 'Famous faces', '"Last one: who\'s your favourite Pokémon?"', [
    ch('{lead}.', out('"{lead}." Your lead puffs up. The reporter snaps a photo. The interview is printed the next morning, and you hear that your rivals have all read it.', flag('press-heart'), bondUp(1, 'lead'), moment('Gave an interview to the paper.', 40))),
    ch('All of them.', out('"All of them." Your whole team looks at you. The interview is printed the next morning, and you hear that your rivals have all read it.', flag('press-heart'), bondUp(1, 'party'), moment('Gave an interview to the paper.', 40))),
    ch('Whoever wins.', out('"Whoever wins." The reporter whistles. The interview is printed the next morning, and you hear that your rivals have all read it, and that one of them pinned it to a wall.', flag('press-bold'), moment('Gave an interview to the paper.', 40))),
  ]),
  {
    id: 'face-mascot-costume',
    intro: 'A giant foam Pokémon head sits on a bench, looking hopeful. A harassed woman with a clipboard: "Our mascot called in sick. Could you... possibly...?"',
    choices: [
      ch('Wear it.', out('You put on the head. It smells of every summer fair there has ever been. You dance, you wave, you get hugged by forty children, and when you take it off the woman hands you a little foam head of your own, for keeps. Word gets round.', rep(1), moment('Danced in the mascot costume.', 35))),
      ch('Let a Pokémon wear it.', out('Your lead wears the head. It is a triumph. The crowd goes wild, your lead refuses to take it off for an hour, and the woman gives it a little foam head of its own to keep. Word gets round.', rep(1), bondUp(1, 'lead'))),
    ],
  },
  {
    id: 'face-nurse-reunion',
    intro: 'A nurse waves from a clinic door, beaming. "It\'s you! I remember your team from the very first Center you ever walked into. Come in, come in. On the house."',
    choices: [
      ch('Come in.', out('She treats every one of them like an old friend, and tells you how much they have grown. Everyone comes out whole, and you come out with a lump in your throat.', heal(), cure)),
    ],
  },
  {
    id: 'face-professor-pet',
    intro: 'A professor presses a Poké Ball into your hands. "A prototype. An Eevee with an ability no Eevee is supposed to have: Protean. It changes type to match its move. Do not ask how. Take it for the road? I\'ll check in on it."',
    choices: [
      ch('Take it.', out('The Eevee pops out, looks at you, and turns a different colour from nose to tail just to show off. The professor writes your name in a notebook. "I\'ll find you. Next region, probably."', { ...join({ species: ['eevee'] }), ability: 'protean' }, { kind: 'flag', key: 'professor-pet', amount: 1, stamp: 'region' })),
      ch('No.', leave('"Quite right. Very sensible." The professor looks a little disappointed anyway.')),
    ],
  },
  {
    id: 'face-professor-checkin',
    name: 'The Professor Checks In',
    group: 'Famous faces',
    stop: 'event',
    rarity: 'uncommon',
    callback: true,
    requires: [{ kind: 'flag', key: 'professor-pet', atLeast: 1, regionsAgo: 1 }, no('professor-checkin-seen')],
    scene: { cast: [], effect: 'sparkle' },
    intro: 'The professor from last region comes hurrying up the road with a clipboard. "There you are! How is my prototype? Is it eating? Is it happy?"',
    choices: [
      ch('Show it to her.', out('She checks its eyes, its paws, its readings, and then just sits and watches it for a while. "It\'s happy," she says quietly. "That\'s the result I hoped for." She leaves you a gift and a long list of notes.', any('quick-claw', 'wide-lens', 'pp-up'), bondUp(1, { species: ['eevee', 'vaporeon', 'jolteon', 'flareon', 'espeon', 'umbreon', 'leafeon', 'glaceon', 'sylveon'] }), flag('professor-checkin-seen')), { branches: [{ when: [line('eevee', true)], text: 'The Eevee is not with you any more, and you tell her so. She nods slowly, and writes it down. "Thank you for telling me. Every result matters."', effects: [flag('professor-checkin-seen')] }] }),
    ],
  },
  {
    id: 'face-ranger-escort',
    intro: 'A ranger in a green vest falls in beside you. "Mind if I walk with you a stretch? The paths aren\'t safe lately. Anything waiting to jump you, I\'ll see first."',
    choices: [
      ch('Please.', out('The ranger walks ahead the whole way, and calls back what is waiting at the next two stops before you ever get there. Nothing takes you by surprise.', scout(2), moment('A ranger walked you safely down the road.', 30))),
    ],
  },
];

// ---------- SF151. ITEM RETURNS ----------
const SF151: Json[] = [
  {
    id: 'file-data-card',
    intro: 'A researcher with a scanner the size of a shoebox spots the Data Card in your bag. "Is that... may I? It would help the whole Pokédex project."',
    choices: [
      ch('Hand it over.', out('She scans it, gasps, and pays you on the spot. "Look at this! Habitats, the whole region!" She uploads it, and the Pokédex starts showing you where things live.', lose('data-card'), $(500), flag('dex-habitat')), { requires: [has('data-card')] }),
      ch('Keep it.', leave('You keep it. She understands, sort of.')),
    ],
  },
  {
    id: 'fix-machine-part',
    intro: 'A shop\'s register is jammed shut, and the shopkeeper is close to tears. "If only I had that one machine part..."',
    choices: [
      ch('Give the part.', out('You hand over the part from your bag. Click, whirr, ding: the register opens. "Take anything from the shelf behind me, on the house." You take a PP Up, ₽1,000 on the tag.', lose('machine-part'), item('pp-up')), { requires: [has('machine-part')] }),
      ch('Walk on.', leave('You leave the shopkeeper with the register.')),
    ],
  },
  {
    id: 'penny-hack',
    intro: 'Penny looks up from a laptop covered in stickers. "I can... improve your storage. Probably. Let me?"',
    choices: [
      ch('Let her.', out('She types for a long time, mutters, types some more, and slaps the laptop shut. "There. Your storage now lets each of your Pokémon hold one more item. Don\'t ask how."', { kind: 'relic', id: 'penny-storage-slot', name: 'Penny\'s Storage Hack', effects: [{ kind: 'itemSlotOffset', value: 1 }] })),
    ],
  },
  {
    id: 'return-gold-teeth',
    intro: 'The old Safari warden is tapping his jaw sadly. Then he sees what is in your hand. "My teeth! You found my gold teeth!"',
    choices: [
      ch('Give them back.', out('He pops them in, beams a golden beam, and presses a card into your hand. "A Safari pass. Free entry, any time. You\'ve earned it."', lose('gold-teeth'), flag('safari-pass'), moment('Gave the Safari warden his teeth back.', 35)), { requires: [has('gold-teeth')] }),
      ch('Walk on.', leave('You walk on. Somewhere behind you, the warden is still looking.')),
    ],
  },
  {
    id: 'return-lost-item',
    intro: 'The woman at the Lost and Found counter spots the thing in your bag. "Oh! Someone has been looking everywhere for that."',
    choices: [
      ch('Return it.', out('The owner is called in. They hold it like something they thought was gone for good, and they cry a little, and then they give you something rare they had been saving, because what else could they do.', lose('lost-item'), any(...RARE), good(1)), { requires: [has('lost-item')] }),
      ch('Keep it.', leave('You keep it. The counter woman looks at you for a long moment.')),
    ],
  },
  {
    id: 'trade-scanner',
    intro: 'A collector at the dock spots your Scanner and holds up his Honest Trade Card. "I\'ll be straight with you. That\'s worth ₽2,000. I\'ll give you a Nugget and a PP Up for it, which is exactly that."',
    choices: [
      ch('Trade.', out('A fair trade, honestly made. He shakes your hand and goes off happy with his Scanner.', lose('scanner'), item('nugget'), item('pp-up')), { requires: [has('scanner')] }),
      ch('Keep it.', leave('"Fair enough. If you change your mind, you know where the dock is."')),
    ],
  },
];

// ---------- SF152. MILESTONES ----------
const fast = (t: string): Json => ch('Fast.', out(`${t} You take the quick way: the next stretch goes by in a blur.`, express(), flag('pace-fast')));
const careful = (t: string): Json => ch('Careful.', out(`${t} You take it slow and safe, and a little way on there is a Center you had not seen on the map.`, { kind: 'addStop', stop: 'heal' }, flag('pace-careful')));
const rich = (t: string): Json => ch('Rich.', out(`${t} You take the road where the trainers are, and the prizes. Harder fights, bigger purses, for the rest of the region.`, { kind: 'tempEffect', label: 'Rich road: harder trainers, bigger prizes', effects: [{ kind: 'moneyMultiplier', value: 1.25 }, { kind: 'bonusRewardChance', chance: 0.15 }, { kind: 'enemyLevelOffset', value: 1 }], until: 'region' }, flag('pace-rich')));
const SF152: Json[] = [
  {
    id: 'milestone-crossroads',
    intro: 'Four roads meet at a worn stone. One is short and steep, one is slow and safe, one is busy with trainers. There is no hurry. But there is a choice.',
    choices: [fast('The short road.'), careful('The safe road.'), rich('The busy road.')],
  },
  {
    id: 'milestone-dawn',
    intro: 'A pale sun rises over a clearing, and your team stretches in the first light. A good place to decide how the next stretch goes.',
    choices: [fast('You set off at a run.'), careful('You set off slowly.'), rich('You set off toward the noise of battles.')],
  },
  {
    id: 'milestone-embers',
    intro: 'Someone else camped here before you. The fire is still warm, and there are footprints leading away, and Pokémon tracks beside them.',
    choices: [
      fast('You kick dirt over the embers.'), careful('You sit by the warm fire a while.'), rich('You head for the town.'),
      ch('Follow their tracks.', out('You follow the footprints and the Pokémon tracks. They lead somewhere: whoever camped here is just ahead, and they will be waiting when you catch up.', later('milestone-embers-trainer', 1))),
    ],
  },
  rm('milestone-embers-trainer', 'Whoever Camped There', 'Milestones', 'The trainer from the campfire is sitting on a fence, waiting, as if they knew you would follow. "Took you long enough. Battle?"', [
    ch('Battle.', fight('"Good. I was getting bored." They hop down off the fence.', trainer('Road Roster Trainer', { cls: 'ace-trainer', size: 3, lv: 1, win: [$(400)] }))),
  ]),
  {
    id: 'milestone-summit',
    intro: 'You are at the top of a long climb. The whole region is laid out below you, roads and rivers and towns, and somewhere down there, your rival.',
    choices: [
      fast('You take the steep way down.'), careful('You take the long way down.'), rich('You head for the busiest town.'),
      ch('Look for the rival.', out('You look for a long time, and there: a little figure on the road ahead, with a Pokémon you would know anywhere. Now you know where they are, and every battle between you and them.', { kind: 'riftPreview' }, moment('Spotted your rival from the summit.', 35))),
    ],
  },
];

// ---------- SF153. QUIET MOMENTS ----------
const SF153: Json[] = [
  {
    id: 'quiet-bond',
    intro: 'Two of your Pokémon have drifted away from the group and sit together, watching the sunset, not making a sound.',
    choices: [
      ch('Leave them be.', out('You leave them to it. When they come back to the fire, they come back together, and from then on they fight side by side as if they had planned it.', { kind: 'statBoost', stat: 'spe', percent: 5, who: 'top', until: 'run' }, flag('quiet-pair'))),
      ch('Sit with them.', out('You sit down between them. Nobody says anything. Nobody needs to. When the sun is gone, both of them lean on you.', bondUp(1, 'lead'), bondUp(1, 'top'))),
    ],
  },
  {
    id: 'rk-birthday',
    intro: 'Everyone you have helped on this run lines the road with streamers. Somebody wheels out a cake with far too many candles. "Happy birthday, trainer!"',
    choices: [
      ch('Blow out the candles.', out('You blow them all out in one go, and everyone cheers, and your team gets cake on every single face. People you helped weeks ago come up to shake your hand. It is a very good day.', { kind: 'celebrate' }, bondUp(1, 'party'), moment('Celebrated a birthday on the road with everyone you helped.', 60))),
    ],
  },
  {
    id: 'rk-counting-sheep',
    intro: 'A grassy hill. Nothing is happening. Nothing at all. A sleepy Mareep is counting something under its breath.',
    choices: [
      ch('Count with it.', out('One Wooloo... two Wooloo... you wake up an hour later with your whole team asleep around you and every one of them clear-eyed and rested.', rest, cure)),
      ch('Nap.', out('You just lie down in the grass. It is the best nap of the whole run.', rest)),
    ],
  },
  {
    id: 'rk-mood-swing',
    intro: 'A strange breeze rolls over the team. Everyone\'s mood tips, some up, some down. One of them is very down.',
    choices: [
      ch('Ride it out.', out('You ride it out together. By evening the breeze has passed and everyone is themselves again.')),
      ch('Cheer them up.', out('You go round each of them, and spend longest with the one who needs it most. By evening, everyone is in a better mood, and the low one is lying with its head on your foot.', bondUp(1, 'party'))),
    ],
  },
  {
    id: 'rk-perfect-day',
    intro: 'The sun is warm, the breeze is soft, and everyone on this road is smiling at you. Nothing here can go wrong.',
    choices: [
      ch('Enjoy it.', out('You enjoy it. All of it. You let the day be what it is, and your team does the same, and by evening every one of them is rested and closer to you than ever.', rest, bondUp(1, 'party'))),
    ],
  },
  {
    id: 'rk-rest-day',
    intro: 'A meadow with nothing in it but soft grass and a warm sun. Nothing is scheduled. Nobody will find you here.',
    choices: [
      ch('Rest.', out('You rest. The whole day. Nobody finds you.', rest)),
    ],
  },
  {
    id: 'rk-terrible-day',
    intro: 'Dark clouds, a broken cart wheel, and a bag strap that snaps. Nothing here is going to go right today.',
    choices: [
      ch('Push through it.', out('You push through it, and it takes all day, and every one of you is soaked. But at the end, in the wreck of the cart, you find something the storm uncovered: something rare.', takeNode(1), any(...RARE))),
      ch('Sit it out.', out('You sit it out under a ledge, the whole team in a heap. When the storm finally passes it has washed something rare down the hill, right to your feet.', takeNode(1), any(...RARE))),
    ],
  },
  {
    id: 'hold-the-hand',
    intro: 'A scary stretch of road. Strange noises in the trees. Your lead grips your sleeve and does not let go.',
    choices: [
      ch('Keep going together.', out('You keep going, together, one step at a time, and it holds on the whole way. On the other side, it does not let go for a long while after.', bondUp(2, 'lead'))),
      ch('Turn back.', out('You turn back and find another way round. Your lead looks relieved, and a little ashamed. You scratch its ears to tell it that is fine.')),
    ],
  },
  {
    id: 'dream-memory',
    intro: 'You close your eyes by the fire, and the road fades, and you see something from earlier in the run, as clearly as if it were happening again.',
    choices: [
      ch('Watch.', out('You watch it again: {most} standing in front of the rest of the team when it mattered. And in the dream you see, for a moment, how it would have gone if you had chosen differently. You wake glad of the choice you made.', bondUp(1, 'top'), moment('Dreamed of an earlier moment of the run.', 35))),
    ],
  },
];

export const EVENTS: Json[] = friendlyAll([...SF150, ...SF151, ...SF152, ...SF153]);
export const REMOVE: string[] = [];
