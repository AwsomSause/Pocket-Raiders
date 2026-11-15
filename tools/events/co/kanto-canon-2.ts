// Kanto Canon Spaces, KANTO_PLACED_1.md: Lavender Town (Interlude 3, at the start of Kanto Stage 4).
// Every scripted line of the doc is kept word for word; the prose around the lines is expanded.
import type { Json } from '../dsl.ts';
import { EXTRA, SPACES, retired, battle, buy, c, cash, afford, flag, foe, fr, has, is, item, join, kc, moment, not, o, relic, space, teach, wild } from './_kc.ts';

export const CATEGORY = 'kanto-canon';
export const EVENTS: Json[] = [];
const E = EVENTS;
const DOC = 'KANTO_PLACED_1';
const light = (): Json[] => [has('flashlight')];
const flash: Json = { kind: 'partyMove', move: 'flash' };

// ---------- Pokémon Tower (Pseudo Stage: seven floors). The Rocket raid version is the base pack's own raid; this is the ordinary tower.
{
  const s = space(E, { id: 'cs.kanto.lavender.tower', town: 'lavender', name: 'Pokémon Tower', kind: 'PS', appears: 'always', length: 7, flags: ['kanto.tower.cleared', 'kanto.tower.memorial'], section: `${DOC}: Pokémon Tower`,
    placed: { stage: [4], home: 3, window: [2, 5], sits: 'must', attaches: 'instead', badge: 'A tower', level: 0, often: 'Once per run' },
    ps: { name: 'Pokémon Tower', themeId: 'ghost-dark', mood: 'candles in every window' } });
  s.entry('Pokémon Tower',
    'A tower of grey stone. Every window has a candle. The radio in town plays one tune, and people lower their voices without knowing they\'ve done it. You notice you have done it too. Seven floors up, a single light is burning that is not a candle, and it has not moved in a long time.',
    [
      c('Go in.', o('The door is not locked. It has never needed to be. Inside, the air is cool and still, and smells of wax and cut flowers.', s.open('f1'))),
      c('Not yet.', o('You stand at the foot of it a while with your head back, counting candles. Then you walk on, quietly, the way everybody walks here.')),
    ], { pseudo: true, scene: { effect: 'fog' } });

  s.room('f1', 'Pokémon Tower: The Graves', 'Memorial stones in rows, as far as the candlelight reaches. Mourners move between them, alone or in twos. Nobody speaks above a breath. A woman, leaving flowers, looks up as you pass, as if she owes you an explanation. A woman, leaving flowers: "It was only a Raticate. I say \'only.\' Eleven years."',
    [c('Climb the stairs.', o('You don\'t know what to say to her, so you stand beside the small stone for a moment, and that seems to be the right thing. Then you climb.', s.open('f2')))], { scene: { effect: 'fog' } });

  // Floor 2: without the Silph Scope the Ghost-types are "???": they can't be fought or caught, only fled.
  const seen = (text: string) => battle(text, wild(['gastly', 'haunter'], { levelBonus: 0, win: [s.open('f3')] }));
  s.room('f2', 'Pokémon Tower: The Unseen', 'The second floor is darker. The candles here burn, but their light stops short, as if it had been told not to go any further. Something\'s standing where the candlelight stops. It has no shape you can name. Your Pokédex says only: ???.',
    [
      c('Flee past it.', o('You can\'t fight what you can\'t see, and you can\'t catch it. You can only go. You walk, and then you don\'t walk, you run, and the cold follows you as far as the stairs and stops there, politely, like something seeing a guest out.', s.open('f3'))),
      c('Look through the Silph Scope.', seen('Through the Scope the dark has edges. It has eyes. It was never anything but a Ghost-type, lonely and curious, and now that you can see it, it can be faced.'), { requires: [has('silph-scope')] }),
      c('Let the Haunter show you.', seen('The Haunter that took your hat drifts out of your shadow, delighted to be useful. It blows a raspberry at the dark, and the dark, caught out, turns into a Ghost-type like any other.'), { requires: [is('kanto-prank-friend')] }),
    ], { scene: { effect: 'fog' } });

  s.room('f3', 'Pokémon Tower: The Channelers', 'Mediums in white, swaying between the stones. Their eyes are open and nobody is behind them. One turns toward you all at once, like a door blown by a wind, and speaks in a voice that is using her without asking.',
    [c('Battle, to end the possession.', battle('She throws a Poké Ball with a hand that isn\'t hers. Each battle ends a possession: there are two of them between you and the stairs.',
      foe('Channeler', { size: 2, types: ['ghost'], levelBonus: 0, chain: 2, win: [moment('Freed the Channelers of Pokémon Tower.'), s.open('f3b')] })))], { scene: { effect: 'fog' } });
  s.room('f3b', 'Pokémon Tower: The Channelers', 'The last of the cold goes out of her like a held breath. She sits down hard on the floor, and looks at her own hands, and then at you. Channeler, after: "Was I—? Oh. Oh, I\'m so sorry. Did I say anything dreadful?"',
    [c('"Nothing dreadful."', o('She laughs, shakily, and lets you help her up. "They only want somebody to talk through," she says. "They forget to ask." She points you to the stairs, and stays behind to sit with the other one until she wakes.', s.open('f4')))]);

  // Floor 4: the Memorial Wall. Each flower is answered with a Parting Gift (a Spell Tag, a Soul Dew shard or a Ghost-type egg): three at most.
  const walkOn = (from: string) => c('Walk on.', o('You walk on. At the stairs you look back once. The candle flames in front of the wall are all leaning the same way, toward you, as if something had breathed out.', s.openFrom(from === 'x' ? 'f5' : 'f5', 'f6', 'f6', 'f6')));
  const flowers = (next: string) => c('Leave flowers.', o('There are flowers in a bucket by the wall, left for anyone who needs them. You take one, and you put it under the name. You don\'t say anything. You don\'t have to. The flame nearest the name bends, and straightens, and something small is lying on the stone that was not there before: a Parting Gift, from the tower\'s ghosts, in answer.', kc('partingGift'), flag('kanto-tower-memorial'), s.open(next)), { requires: [kc('giftLeft') as Json] });
  const strangers = c('Leave flowers.', o('None of these names are yours. You leave a flower anyway, under one you pick because nobody else has. Nothing\'s given. Behind you a mourner you hadn\'t noticed says, very quietly, "Thank you," and when you turn, she is already looking at the wall again.', flag('kanto-tower-memorial'), s.openFrom('f5', 'f6', 'f6', 'f6')));
  const read = (next: string) => c('Read the names.', o('You read them. All of them. It takes a long time, and nobody hurries you. Some are in a careful hand and some were plainly written by someone who could hardly hold the chalk. Every one of them was somebody\'s whole world.', fr(1), s.open(next)));
  const WALL = 'A wall of names. Every Pokémon that\'s been lost for good in this run is listed. Your lead goes to the wall before you do. It finds a name, and sits.';
  s.room('f4', 'Pokémon Tower: The Memorial Wall', `${WALL} If the run has lost nobody, the wall has other people's names.`,
    [strangers, read('f4r'), walkOn('f4')],
    { remembers: [{ id: 'lost', when: [{ kind: 'memorial', atLeast: 1 }], intro: `${WALL} It does not look round at you. It doesn't need to. You know the name.`, hide: [0], addChoices: [flowers('f4b')] }] });
  s.room('f4r', 'Pokémon Tower: The Memorial Wall', 'You have read every name. Your lead has not moved from its place in front of the wall.',
    [strangers, walkOn('f4r')], { remembers: [{ id: 'lost', when: [{ kind: 'memorial', atLeast: 1 }], hide: [0], addChoices: [flowers('f4b')] }] });
  s.room('f4b', 'Pokémon Tower: The Memorial Wall', 'The wall waits. There are more flowers in the bucket, and more names. The ghosts will answer three flowers at most, and only for the names that are yours.',
    [flowers('f4c'), walkOn('f4b')]);
  s.room('f4c', 'Pokémon Tower: The Memorial Wall', 'One more flower, if there is one more name. The candles are burning low, and your lead leans against your leg.',
    [flowers('f4d'), walkOn('f4c')]);
  s.room('f4d', 'Pokémon Tower: The Memorial Wall', 'Three flowers lie under the wall. The ghosts have given what they give. Your lead stands up at last, and looks at you, and waits to be told it is all right to go.',
    [walkOn('f4d')]);

  // Floor 5: Haunter's Ghost (25%).
  s.room('f5', "Pokémon Tower: Haunter's Ghost", 'Halfway up the next flight, the stairs are suddenly upside down. Then they aren\'t. A Haunter unfolds out of the wall with its tongue out, enormously pleased with itself. It has played a prank on you, and it is waiting to find out what kind of person you are.',
    [
      c('Laugh.', o('You laugh. You can\'t help it; it has been a long, sad tower, and the laugh comes out of you like a sneeze. The Haunter turns three somersaults in the air for joy, and when it has gone there is a Spell Tag stuck to your forehead.', item('spell-tag'), s.open('f6'))),
      c('Chase it.', battle('You go after it. It shrieks with delight: nobody ever chases it. At the top of the stairs it turns round, and makes itself big.', wild(['haunter'], { levelBonus: 0, win: [s.open('f6')] }))),
    ], { scene: { pokemon: 'haunter' } });

  // Floor 6: the Marowak. It can't be caught. Beating it releases it.
  const RELEASED = [flag('kanto-tower-marowak'), moment('Released the ghost of the Marowak in Pokémon Tower.'), s.open('f7')];
  const marowak = (text: string, calm: boolean) => battle(text, foe('Marowak', { team: ['marowak'], levelBonus: 0, ...(calm ? { rule: { stages: { atk: -1 } } } : {}), win: RELEASED }));
  s.room('f6', 'Pokémon Tower: The Marowak', 'A shape between you and the stairs. A club, raised. Under the skull, nothing. Behind it, a small grave, with a smaller club laid on it. It can\'t be caught. It is not here to be caught. It is here because something small of hers was left in this room, and she has not found a way to stop guarding it.',
    [
      c('Battle.', marowak('You send out your lead. The club comes down. There is nothing behind it but grief, and grief hits very hard.', false)),
      c('Put my own hands up, and step back.', marowak('You put your hands up, empty, and you step back. For a long moment nothing happens. Then it lowers the club. It doesn\'t let you past. The battle\'s still needed. But it isn\'t angry now: it only has to be sure of you.', true)),
      c('Let Cubone go to it.', o('Cubone stops. The skull rattles. You let it go. It walks across the cold floor on its own, small and upright, to the shape under the raised club, and the club comes down slowly, and rests, very gently, on top of the skull it once wore. The ghost fades, smiling. Cubone stands a long while. Then, at once, it grows: a Marowak, holding a Thick Club that was not in its hand before.', { kind: 'formChange', from: 'cubone', to: 'marowak' }, item('thick-club'), flag('kanto-tower-mother'), ...RELEASED),
        { requires: [{ kind: 'partySpecies', species: 'cubone' }] }),
    ], { scene: { pokemon: 'marowak', effect: 'fog' } });

  // Floor 7: the top. Reward: the Silph Scope; a Cubone with Lightning Rod and Bone Rush if the Marowak was released; the Pokémon Tower Scroll.
  const SCROLL = relic('pokemon-tower-scroll', 'Pokémon Tower Scroll', [{ kind: 'statMultiplier', stat: 'atk', type: 'ghost', value: 1.1 }, { kind: 'statMultiplier', stat: 'spa', type: 'ghost', value: 1.1 }]);
  const TOP = [item('silph-scope'), SCROLL, flag('kanto-tower-cleared'), flag('xk-tower-cleansed'), moment('Climbed Pokémon Tower and sat with Mr. Fuji at the top.')];
  s.room('f7', 'Pokémon Tower: The Top', 'The seventh floor is small, and open to the sky on one side. An old man is sitting on a folding stool beside the last stone, with a blanket over his knees and a lamp at his feet. He looks up without surprise. Mr. Fuji: "I wasn\'t trapped. I was keeping it company. Nobody else would come up." He climbed up to sit with it, and couldn\'t get down.',
    [
      c('Help him down the stairs.', o('It takes a long time, seven floors, one step and then the next, his hand on your arm. On the way down he gives you the Silph Scope from his coat pocket, as if it were a boiled sweet, and a scroll tied with white ribbon: the Pokémon Tower Scroll. At the small grave on the sixth floor he stops. A Cubone is standing there, by itself, holding the smaller club. It knows Bone Rush. It looks at you, and it comes.', ...TOP, join(['cubone'], { ability: 'lightning-rod', moves: ['bone-rush'] })),
        { requires: [is('kanto-tower-marowak'), not('kanto-tower-mother')] }),
      c('Help him down the stairs.', o('It takes a long time, seven floors, one step and then the next, his hand on your arm. On the way down he gives you the Silph Scope from his coat pocket, as if it were a boiled sweet, and a scroll tied with white ribbon: the Pokémon Tower Scroll. At the sixth floor he stops, and looks at the Marowak walking beside you, and nods to it, as one nods to someone who has also been keeping watch.', ...TOP),
        { requires: [is('kanto-tower-mother')] }),
    ]);
}

// ---------- Mr. Fuji's House
{
  const s = space(E, { id: 'cs.kanto.lavender.fuji', town: 'lavender', name: "Mr. Fuji's House", kind: 'EV', appears: 'roll', flags: ['kanto.fuji.adopted'], section: `${DOC}: Mr. Fuji's House`,
    placed: { stage: [4], home: 1, sits: 'town', attaches: 'town', badge: 'A small house', level: null, often: 'Once per run' } });
  const BABIES = ['pichu', 'cleffa', 'igglybuff', 'togepi', 'elekid', 'magby', 'smoochum', 'tyrogue', 'azurill', 'wynaut', 'budew', 'happiny', 'munchlax', 'bonsly', 'mime-jr', 'riolu'];
  // The adoptee; the Poké Flute; Fuji's Blessing: Bond +1 for the whole party (+3 each on the shared scale).
  const gifts = [item('poke-flute'), fr(3), flag('kanto-fuji-adopted'), moment("Adopted a Pokémon from Mr. Fuji's house.")];
  const adopt = (label: string, line: string, ...bonus: Json[]) => c(label, o(`${line} You crouch by the bed. It wakes, and looks at you, and does not look away. Somebody puts a Poké Flute into your hand on the way out, "for the ones that won't wake," and a blessing with it that you feel settle over your whole party like a blanket.`, join(BABIES, { levelBonus: -1 }), ...bonus, ...gifts));
  s.entry("Mr. Fuji's House",
    'A house with too many beds. Every one has something asleep in it. A volunteer: "He\'s up the Tower again. He\'ll be back. Mind the Psyduck, it thinks it\'s a doorstop." There are three small ones nobody has come for, each in its own bed, each with one line of history on a card tied to the bedpost. You may adopt one of the three.',
    [
      adopt('"Left in a box at the Center, with a blanket."', 'The blanket is still in the bed with it. It has been washed many times and is kept folded just so.', kc('statUp', { stat: 'best', who: 'newest' })),
      adopt('"Its trainer went to sea."', 'It sleeps facing the window that faces the harbor road. It is the fastest thing in the house, the volunteers say; it runs to the gate every time a boat\'s horn sounds.', kc('statUp', { stat: 'spe', who: 'newest' })),
      adopt('"Nobody knows. It walked in."', 'One morning it was simply there, in the hall, with wet feet. It chose this house. Now it looks at you as though it might be choosing again.', kc('statUp', { stat: 'random', who: 'newest' }), kc('bond', { who: 'newest' })),
      c('Let them sleep.', o('You step over the Psyduck, which does not stir, and close the door behind you so quietly that not one of them wakes.')),
    ], { scene: { pokemon: 'psyduck' }, remembers: [
      { id: 'cubone', when: [is('kanto-tower-cleared'), { kind: 'partySpecies', species: 'cubone' }], notice: 'The Tower\'s been cleared, and Mr. Fuji is here himself, in a chair by the stove. Mr. Fuji: "Each of these was somebody\'s. Then it wasn\'t. I don\'t ask why any more; the why doesn\'t help them." Then he sees the Cubone at your heel, and his whole face changes. He knows it. Mr. Fuji: "So that\'s where you went."' },
      { id: 'home', when: [is('kanto-tower-cleared')], notice: 'The Tower\'s been cleared, and Mr. Fuji is here himself, in a chair by the stove, with something small asleep in the crook of his arm. Mr. Fuji: "Each of these was somebody\'s. Then it wasn\'t. I don\'t ask why any more; the why doesn\'t help them."' },
    ] });
}

// ---------- Pokémon Fan Club (a patience test: four times, "Interrupt." beside a smaller "Keep listening.")
{
  const s = space(E, { id: 'cs.kanto.lavender.fanclub', town: 'lavender', name: 'Pokémon Fan Club', kind: 'EV', appears: 'roll', flags: ['kanto.fanclub.listened'], section: `${DOC}: Pokémon Fan Club`,
    placed: { stage: [4], home: 1, sits: 'town', attaches: 'town', badge: 'A rosette', level: null, often: 'Once per run' } });
  const interrupt = c('Interrupt.', o('You say you really must be going. He stops in the middle of a word. For a second he looks like a man who has dropped something and heard it break. Then he remembers his manners, and finds you a Poké Doll from a shelf of them, and sees you to the door with a hurt look that he does his best to fold away.', item('poke-doll')));
  const SAYS = [
    '"...and the hooves. Four of them. One at each corner."',
    '"...which brings me to its mother. A remarkable Ponyta. I never met her."',
    '"...I\'ve a photograph. It\'s of the stable. The Rapidash was out."',
    '"...and that\'s why I say, you never forget a mane like that. Don\'t you agree?"',
  ];
  const BETWEEN = ['The clock on the mantel ticks. You had not noticed it before. You will never not notice it again.', 'A second cup of tea appears at your elbow. You do not remember the first.', 'The light through the window has moved from the rug to the wall.', 'Outside, it has begun to get dark.'];
  s.entry('Pokémon Fan Club',
    'A room of armchairs. A man who\'s been waiting for someone new. He is on his feet before the door has closed behind you. The Chairman: "Sit, sit. I must tell you about my Rapidash. Its mane. You won\'t believe the mane. I\'ll begin at the beginning. It was a Tuesday."',
    [c('Sit.', o('You sit. The armchair takes you in like a swamp. He begins at the beginning. It was, indeed, a Tuesday.', s.open('t1'))), c('Back out of the door.', o('"Another time!" he calls after you, with the terrible hope of a man who will remember that you said so.'))],
    { scene: { pokemon: 'rapidash' } });
  SAYS.forEach((line, n) => s.room(`t${n + 1}`, 'Pokémon Fan Club', `He talks. ${BETWEEN[n]} The Chairman: ${line}`,
    [interrupt, c('Keep listening.', n < 3 ? o('You keep listening. It is not nothing, to be listened to. He glows.', s.open(`t${n + 2}`))
      : o('"I do," you say, and find that somewhere in the last hour it has become true. He has to sit down. Nobody has ever listened to the end before. He presses a Bike Voucher into both your hands and holds on a moment longer than he needs to. "Come back," he says. "I haven\'t told you about its tail."', item('bike-voucher'), flag('kanto-fanclub-listened'), moment('Listened to the Fan Club Chairman all the way to the end.')))],
    { scene: { pokemon: 'rapidash' } }));
}

// ---------- Rock Tunnel Blackout (Pseudo Stage: five nodes; a dark cave: accuracy -10%, wild encounters hidden)
{
  const s = space(E, { id: 'cs.kanto.lavender.rocktunnel', town: 'lavender', name: 'Rock Tunnel Blackout', kind: 'PS', appears: 'roll', length: 5, flags: ['kanto.rocktunnel.cleared'], section: `${DOC}: Rock Tunnel Blackout`,
    placed: { stage: [4], home: 4, window: [3, 6], sits: 'door', attaches: 'instead', badge: 'A black square', level: 0, often: 'Once per run' },
    ps: { name: 'Rock Tunnel', themeId: 'ground-rock', mood: 'no light at all' } });
  const DARK = { accuracyMult: 0.9, hiddenFoe: true };
  const blind = (text: string, pool: string[], next: string) => battle(text, wild(pool, { levelBonus: 0, rule: DARK, win: [s.open(next)] }));
  s.entry('Rock Tunnel Blackout', 'A tunnel mouth. Ten steps in, the light\'s gone. Not dim: gone, as if it had never been invented. With Flash or a Flashlight, each encounter in here is shown and can be avoided. Without, each one is random, and can\'t be fled. It is a dark cave: accuracy is down 10%, and you will not see what you are fighting.',
    [c('Walk in.', o('Ten steps. You count them. On the eleventh you hold your hand up in front of your face and there is no hand.', s.open('n1'))), c('Stay in the daylight.', o('You stay in the daylight. The tunnel breathes cold air on your ankles, patiently, like something that knows you will be back.'))], { pseudo: true });
  s.room('n1', 'Rock Tunnel: The Dark', 'The dark. It presses on your eyes like a thumb. From somewhere ahead, or behind, or above, a Hiker\'s voice, calm and unhurried: "Left hand on the wall. Don\'t let go of the wall."',
    [c('Left hand on the wall.', o('The wall is cold and wet and absolutely real. You have never been so grateful for a wall. You don\'t let go of it.', s.open('n2')))]);
  s.room('n2', 'Rock Tunnel: Something Shifting', 'Geodude and Zubat: you can hear the one grinding and the other chittering, close. And under both, further in, something large shifting, slowly, the way a hillside shifts.',
    [
      c('Light it up, and step around them.', o('The light shows a Geodude on the path and a Zubat on the roof, both of them squinting. You walk between them. Neither thinks you are worth the trouble.', s.open('n3')), { requires: light() }),
      c('Use Flash, and step around them.', o('Flash turns the tunnel white for one long second. A Geodude. A Zubat. A path between them. You take it before the dark comes back.', s.open('n3')), { requires: [flash] }),
      c('Feel your way forward.', blind('Something hits you out of the dark. You don\'t know what it is. You can\'t flee what you can\'t see.', ['geodude', 'zubat'], 'n3')),
    ]);
  const LAMP = [item('flashlight')];
  s.room('n3', 'Rock Tunnel: The Dead Lamp', 'A Hiker with a dead lamp. He is sitting very still with his back against the wall, the way he told you to, and he has been sitting there for some time. In his pack is a Flashlight he was saving the batteries for.',
    [
      c('Share my light.', o('You hold your light where he can see by it. He looks at his own hands as if he had forgotten what they looked like. Then he laughs, and digs out the Flashlight he was saving batteries for, and gives it to you. "Saving them for what?" he says. "For this, as it turns out."', ...LAMP, s.open('n4')), { requires: light() }),
      c('Walk him out.', o('You find his hand in the dark, and put it on your shoulder, and the two of you go on with your left hands on the wall. After a while he stops you, and presses something into your palm: the Flashlight he was saving batteries for. "You\'d better have it," he says. "You\'re the one in front."', ...LAMP, s.open('n4'))),
    ]);
  s.room('n4', 'Rock Tunnel: The Onix', 'An Onix, asleep across the tunnel, from one wall to the other, breathing like a slow tide. With light, it can be stepped round. Without, you walk into it.',
    [
      c('Step round it, by the light.', o('You step round it, one boulder at a time, holding your breath. Just as you clear the tail, one eye opens the size of a dinner plate. It watches you. It does not get up. But behind you, as you go on, comes a long, slow, curious grinding. It is following.', flag('kanto-rocktunnel-onix'), s.open('n5')), { requires: light() }),
      c('Step round it, by Flash.', o('One flash, and you see all of it at once, and step round, one boulder at a time. An eye opens the size of a dinner plate. It does not get up. But behind you comes a long, slow, curious grinding. It is following.', flag('kanto-rocktunnel-onix'), s.open('n5')), { requires: [flash] }),
      c('Walk on in the dark.', blind('You walk into it. It is like walking into a cliff that wakes up.', ['onix'], 'n5')),
    ], { scene: { pokemon: 'onix' } });
  const OUT = [teach('rock-slide', { type: 'rock' }), flag('kanto-rocktunnel-cleared'), moment('Came out the far side of Rock Tunnel.')];
  s.room('n5', 'Rock Tunnel: Daylight', 'Daylight. It hurts. It is the best thing you have ever seen. You stand in it with your eyes streaming, and find a TM wedged in the rocks by the mouth of the tunnel, left by some other traveller who came out as glad as you: Rock Slide.',
    [
      c('Look back into the tunnel.', o('Something very large comes out of the dark behind you, blinking, and lowers its great head to look at you properly in the light. The Onix. It is Sturdy, and it is curious, and it has decided it would like to see where you are going.', ...OUT, join(['onix'], { ability: 'sturdy' })), { requires: [is('kanto-rocktunnel-onix')] }),
      c('Walk out into the sun.', o('You walk out into the sun, and you do not look back, and your left hand, you notice, is still held a little out from your side, feeling for a wall.', ...OUT)),
    ]);
}

// ---------- Abandoned Power Plant (Pseudo Stage: six nodes, A+2)
{
  const s = space(E, { id: 'cs.kanto.lavender.powerplant', town: 'lavender', name: 'Abandoned Power Plant', kind: 'PS', appears: 'roll', length: 6, flags: ['kanto.powerplant.cleared', 'kanto.powerplant.zapdos'], section: `${DOC}: Abandoned Power Plant`,
    placed: { stage: [4], home: 4, window: [3, 6], sits: 'door', attaches: 'instead', badge: 'A bolt in a circle', level: 2, often: 'Once per run' },
    ps: { name: 'Abandoned Power Plant', themeId: 'electric-steel', mood: 'windows out, lights on' } });
  s.entry('Abandoned Power Plant', 'A building with its windows out and its lights on. Nobody has paid for those lights in years. Through the broken glass you can see corridors of things lying on the floor, and hear a hum that you feel in your teeth.',
    [c('Go in.', o('The door hangs open. Inside, every bulb is burning and there is nobody to see by them.', s.openFrom('c1r', 'c1f'))), c('Leave it humming.', o('You leave it humming. Behind you a light goes on in a window that has no room behind it.'))], { pseudo: true });
  // Some of the item balls are Voltorb and Electrode. The tell: real items sit still; the others rock, very slightly, as if breathing.
  const HALLS: [string, string, string, number][] = [
    ['A corridor of things lying on the floor: a boot, a clipboard, a hard hat. And an item ball.', 'repel', 'voltorb', 2],
    ['A control room with every dial turned to zero. On the main desk, among the dust, an item ball.', 'elixir', 'voltorb', 2],
    ['A locker room. Forty lockers, all open, all empty, except one, with an item ball in the bottom of it.', 'cell-battery', 'electrode', 2],
    ['A corridor where the lights buzz and dim as you pass under them. In the middle of the floor, an item ball.', 'max-repel', 'voltorb', 2],
    ['The stairs down to the generator hall. On the top step, where anyone would trip on it, an item ball.', 'light-ball', 'electrode', 2],
  ];
  HALLS.forEach(([place, prize, mon, lv], n) => {
    const next = n < 4 ? [s.openFrom(`c${n + 2}r`, `c${n + 2}f`)] : [s.openFrom('zapdos', 'zapdos', 'horde', 'horde', 'horde')];
    const walk = c('Leave it where it is.', o('You step around it and go on. It doesn\'t follow. You do not look back to check.', ...next));
    s.room(`c${n + 1}r`, `Power Plant: Hall ${n + 1}`, `${place} It sits still. Perfectly still, the way a thing sits when it is only a thing.`,
      [c('Pick it up.', o('It is exactly what it looks like. You put it in your bag, and let out a breath.', item(prize), ...next)), walk]);
    s.room(`c${n + 1}f`, `Power Plant: Hall ${n + 1}`, `${place} It rocks, very slightly, as if breathing.`,
      [c('Pick it up.', battle('An item ball. You reach for it. It opens an eye.', wild([mon], { levelBonus: lv, win: next }))), walk], { scene: { pokemon: mon } });
  });
  const LOOT = [item('magnet'), item('thunderstone'), flag('kanto-powerplant-cleared'), moment('Searched the Abandoned Power Plant to the generator.')];
  // The end: 40% Zapdos, asleep on the generator, level-fixed at A+2, catchable at low odds; 60% an Electrode horde: five, one after another.
  s.room('zapdos', 'Power Plant: The Generator', 'The generator hall. Zapdos. On the generator, asleep, with the whole plant\'s power running into it. Every light in the building is on because of this. It can be caught, at low odds, and your Poké Balls will show you the odds honestly. Or it can be left to sleep.',
    [
      c('Wake it.', battle('You take one step onto the steel floor, and every bulb in the plant goes out at once. In the dark, two eyes open.', wild(['zapdos'], { levelBonus: 2, rule: { foeAsleep: true }, win: [...LOOT, flag('kanto-powerplant-zapdos')] }))),
      c('Let it sleep, and search the hall.', o('You go round the edge of the hall on the sides of your feet. On a workbench, a Magnet. Behind a panel, a Thunder Stone. On the generator, a legend, asleep, dreaming whatever storms dream. You leave it every one of its lights.', ...LOOT)),
    ], { scene: { pokemon: 'zapdos' } });
  s.room('horde', 'Power Plant: The Generator', 'The generator hall. The generator is running. Nobody is running it. Round its base, in a ring, sit five item balls, and every one of them is rocking, very slightly, as if breathing.',
    [c('Step into the ring.', battle('Five eyes open. An Electrode horde: five, one after another.', wild(['electrode'], { levelBonus: 2, chain: 3, win: [s.open('horde2')] })))], { scene: { pokemon: 'electrode' } });
  s.room('horde2', 'Power Plant: The Generator', 'Three down. Two left, and they have had time to get angry.',
    [c('Finish it.', battle('The last two roll at you together.', wild(['electrode'], { levelBonus: 2, chain: 2, win: [s.open('spoils')] })))], { scene: { pokemon: 'electrode' } });
  s.room('spoils', 'Power Plant: The Generator', 'The hum drops by a note. The hall is yours. On a workbench, a Magnet. Behind a panel, a Thunder Stone.',
    [c('Take them, and get out.', o('You take them, and you get out, and behind you every light in the building is still on.', ...LOOT))]);
}

// ---------- Lavender Volunteers
{
  const s = space(E, { id: 'cs.kanto.lavender.volunteers', town: 'lavender', name: 'Lavender Volunteers', kind: 'SHOP', appears: 'roll', flags: ['kanto.volunteers.revive'], section: `${DOC}: Lavender Volunteers`,
    placed: { stage: [4], home: 1, sits: 'town', attaches: 'town', badge: 'A candle', level: null, often: 'Once per run' } });
  const stall = (again: string | null): Json[] => {
    const more = again ? [s.open(again)] : [];
    return [
      buy('A Spell Tag', 600, 'One of them wraps it in tissue paper, twice, as if it might catch cold.', item('spell-tag'), ...more),
      buy('A Ghost Gem', 400, 'It is cold to hold, and it goes on being cold in your pocket.', item('ghost-gem'), ...more),
      buy('An Escape Rope', 250, '"For when a tower turns out taller than you thought," says the one with the cash tin.', item('escape-rope'), ...more),
      c('Ask about the reviving.', o('The three of them look at each other, and then at your party, and the one in the middle takes off her apron.', s.open('revive'))),
    ];
  };
  s.entry('Lavender Volunteers', 'A trestle table outside Mr. Fuji\'s house. Three people in aprons. They sell a Spell Tag, a Ghost Gem and an Escape Rope, laid out on a clean cloth, and they do one other thing, once, that isn\'t on the table.', stall('more'));
  s.room('more', 'Lavender Volunteers', 'The three of them rearrange the cloth so the gap doesn\'t show. "Anything else, dear?"', stall(null));
  // The service: they revive one fainted Pokémon, once, for ₽500. Out of battle.
  s.room('revive', 'Lavender Volunteers: The Reviving', 'They revive one fainted Pokémon, once, for ₽500. Not in a battle: here, at the table, with warm water and patience. A volunteer: "We don\'t charge for the reviving. The five hundred\'s for the roof."',
    [
      c('Pay the ₽500 for the roof.', o('She takes your fainted Pokémon into the house in both arms. You wait at the table. The other two give you tea and do not make you talk. When she comes back it is walking beside her, on its own feet, looking for you.', cash(-500), kc('reviveOne'), flag('kanto-volunteers-revive'), fr(1)),
        { requires: [afford(500), kc('fainted') as Json, not('kanto-volunteers-revive')] }),
      c('Thank them, and go.', o('They wave. All three, in a row. Behind them in Mr. Fuji\'s window somebody has lit a candle, the way somebody does every night.')),
    ]);
}

// ---------- Haunter's Prank
{
  const s = space(E, { id: 'cs.kanto.lavender.prank', town: 'lavender', name: "Haunter's Prank", kind: 'EV', appears: 'roll', flags: ['kanto.prank.friend'], section: `${DOC}: Haunter's Prank`,
    placed: { stage: [4], home: 2, window: [1, 4], sits: 'optional', attaches: 'after', badge: 'A grin', level: 0, often: 'Once per run' } });
  const FRIEND = [flag('kanto-prank-friend'), moment('Out-faced a Haunter in Lavender Town, and made a friend.')];
  s.entry("Haunter's Prank",
    'Your hat lifts off your head and hangs in the air. A tongue appears. Then eyes. Then the rest of a Haunter, wearing the hat, very pleased. It pulls a face. It waits. It has pulled that face for a great many people in this quiet town, and you can tell from the way it waits that not one of them has ever given it what it wanted.',
    [
      c('Laugh.', o('You laugh, out loud, in Lavender Town, where nobody laughs. It\'s delighted. It does three more: the one with the eyes, the one with the hands, and one you will not be able to describe to anyone later. Then the hat comes back down onto your head, and there is a Spell Tag in it.', item('spell-tag'))),
      c('Pull a face back.', o('You pull a face back. It\'s outraged with joy. It has waited years for this. A face-pulling contest: three rounds, and timing is everything.', s.open('r1'))),
      c('Give that back!', battle('It claps both hands over the hat and makes itself big. If you want it, you can come and get it.', wild(['haunter'], { levelBonus: 0, win: [] }))),
    ], { scene: { pokemon: 'haunter' }, remembers: [
      { id: 'impression', when: [{ kind: 'flag', key: 'x-met-laughing-ghost', atLeast: 1, atMost: 99 }], notice: 'Then it does an impression. It folds itself small, and tilts its head, and for one second it is the ghost who made her laugh, exactly, down to the way it hovered. It looks at you to see whether you got it.' },
      { id: 'mimikyu', when: [{ kind: 'flag', key: 'x-met-mimikyu', atLeast: 1, atMost: 99 }], notice: 'Then it does an impression. It pulls your hat down over its whole body, lets its head flop to one side, and scratches at the ground: the Mimikyu, exactly. It peeks out to see whether you got it.' },
    ] });
  const lose = o('You crack first. You can\'t help it. The Haunter spins in the air, victorious, drops the hat on your head back to front, and is gone through a wall, laughing the whole way.');
  s.room('r1', "Haunter's Prank: Round One", 'Round one. It pulls its own mouth out past its ears and crosses its eyes. You are expected to answer.', [c('Pull the face.', o('You answer. A passing mourner stops, stares, and then, to her own horror, snorts.', s.open('r2')), { prompt: ['shout-tap', 'ok'], fail: lose })], { scene: { pokemon: 'haunter' } });
  s.room('r2', "Haunter's Prank: Round Two", 'Round two. It takes its own hands off and juggles them, wearing your hat at an angle. The bar has been raised.', [c('Pull the face.', o('You do something with your eyebrows that you did not know you could do. The Haunter wobbles in the air.', s.open('r3')), { prompt: ['shout-tap', 'ok'], fail: lose })], { scene: { pokemon: 'haunter' } });
  s.room('r3', "Haunter's Prank: Round Three", 'Round three. It turns itself entirely inside out, slowly, maintaining eye contact. This is its best one. It has been saving it.', [c('Pull the face.', o('You pull the worst face of your life. The Haunter stares. Then it laughs so hard it falls through the ground and has to come back up. It puts the hat on your head with both hands, very carefully, and falls in behind your shoulder. It will follow you through the Tower, and make the unseen things visible without a Scope.', ...FRIEND), { prompt: ['shout-tap', 'good'], fail: lose })], { scene: { pokemon: 'haunter' } });
}

// Old rooms of the simplified builds that the rebuilt spaces no longer open.
export const REMOVE: string[] = retired(EVENTS);
export { SPACES, EXTRA };
