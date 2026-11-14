// Writes src/data/events/poli-pond.json (Poli-Pond, Beta 0.7). Text lives here so it can be edited in one place; run `node tools/episodes/build-poli-pond.mjs`.
import { writeFileSync } from 'node:fs';

const G = 'Poli-Pond';
const flag = (key, atLeast = 1, atMost = 99) => ({ kind: 'flag', key, atLeast, atMost });
const pond = (action, extra = {}) => ({ kind: 'pond', action, ...extra });
const setFlag = (key, amount = 1) => ({ kind: 'flag', key, amount });
const scene = (tint, effect, pokemon = 'poliwag') => ({ cast: [], pokemon, tint, effect });
const base = { group: G, stop: 'event', rarity: 'rare', tags: ['Story', 'Pokémon', 'Relationship'], types: [], minStage: 1, requires: [], remembers: [] };

const lesson = (id, name, lessonId, attr, intro, retry, win, lose, show, showText) => ({
  ...base, id, name, stop: 'rest', callback: true, rarity: 'uncommon',
  requires: [flag('pp-begun'), flag(`pp-lesson-${lessonId}`, 0, 0), flag('pp-ending-done', 0, 0)],
  scene: scene('#23415c', 'float'),
  intro,
  choices: [
    { label: retry, requires: [], check: attr, success: { text: win, effects: [pond('lesson', { lesson: lessonId, firstTry: true }), { kind: 'friendship', amount: 8, who: 'party' }, setFlag('pp-bond')] }, failure: { text: lose, effects: [pond('lesson', { lesson: lessonId, firstTry: false }), { kind: 'friendship', amount: 5, who: 'party' }] } },
    { label: show, requires: [], success: { text: showText, effects: [pond('lesson', { lesson: lessonId, firstTry: false }), { kind: 'friendship', amount: 6, who: 'party' }] } },
  ],
});

const events = [
  {
    ...base, id: 'pp-cold-open', name: 'Something Shoved Out of the Reeds', callback: true, minStage: 2, rarity: 'rare',
    requires: [flag('pp-begun', 0, 0)],
    scene: scene('#1f4a63', 'rain'),
    intro: 'The path runs along a pond, and the reeds at its edge are talking in low, ugly voices. Then the reeds part and something small is shoved out of them, hard, and lands on its belly at your feet. A Poliwag. It does not run. It scrambles behind your legs and presses itself against your shins, and you can feel it shaking through your boots. Five round heads rise out of the water one after another, with the slow patience of animals who have done this before. Nobody makes a sound. They are only watching to see what you do.',
    choices: [
      { label: 'Crouch down and let it hide behind you.', requires: [], success: { text: 'You do not say anything. You lower yourself until you are the same height as it is, and you let your shadow fall over it. After a long moment the shaking slows. A damp little hand takes hold of your sleeve and does not let go. On the water, the five heads sink out of sight one by one, as if none of this had ever happened. The Poliwag looks up at you with enormous eyes, and you understand that for the length of this stage it is yours, and you are its.', effects: [pond('begin', { gentle: true })] } },
      { label: 'Step between it and the water.', requires: [], success: { text: 'You do not raise your voice. You only move, and you stop being a person walking past and become a wall. The heads in the water look at your boots, then at your face, and something in them calculates and decides it is not worth it today. They sink. Behind you the Poliwag lets out a breath it has been holding for what sounds like a very long time, and falls over sideways against your ankle, and stays there. It chooses you without being asked. For this stage it is yours.', effects: [pond('begin')] } },
      { label: 'Ask the pond what this is about.', requires: [], success: { text: 'Nobody answers. The water folds closed over the five heads without a ripple. The only answer you get is the one at your feet: a small, trembling Poliwag who has no idea what it did wrong, only that it is the one who always ends up on the ground. You can find out more at the pond, if you go looking, and you suspect not everyone in that water is as sure of themselves as they look. For this stage the Poliwag comes with you.', effects: [pond('begin')] } },
    ],
  },
  lesson('pp-lesson-aim', 'Lesson: Aim', 'aim', 'intelligence',
    'The rest spot is quiet, and the Poliwag has been looking at the same pebble for a while. You set up three smooth stones on a log and ask it to hit the middle one. It takes a breath, shuts both eyes, and sprays a bright jet of bubbles straight into the dirt a body-length to the left. It looks at the wet patch. It looks at you. Its whole face is already apologising. This was the first attempt, and it failed, and the Poliwag knows exactly how it feels to fail.',
    'Try again, slower. Teach it to keep its eyes open.',
    'You crouch beside it and say, not unkindly: eyes open. It tries. Its eyes want to close, and you can see it deciding every second not to let them. The jet flies, and it clips the edge of the middle stone, and the stone wobbles and tips off the log. The Poliwag stares at it. Then it turns to you with its whole body, and it is laughing, a short startled wheezing laugh, as if it just learned a secret about the world.',
    'It tries again with its eyes open, but it flinches at the last moment and the bubbles go wide, and you watch its small face collapse. You say that is good, you kept them open, and you mean it. You do it again together, again, a dozen times, until the sun is low. Near dusk a jet clips the stone and it does not tip, but the Poliwag does not care, because it knows now what it feels like to aim. It gets it later than it might have, and it gets it all the same.',
    'Set up the stones again and again, and do not stop until it laughs.',
    'You ask for no more than one more try, and then one more, and you never say the word failed. Somewhere in the fiftieth jet, the Poliwag hits the stone. It does not tip. It just sits there, hit. The Poliwag looks at it as if it were the finest thing it had ever seen. It learned to aim with you beside it the whole way, and the lesson is still its own.'),
  lesson('pp-lesson-footing', 'Lesson: Footing', 'footing', 'strength',
    'On a slick stretch of bank the Poliwag stands very straight, and then a moorhen lands in the reeds nearby with a loud flap. The Poliwag flinches so hard it slides on its own belly and ends up in the mud with its eyes squeezed shut. It does this every time something startles it, you realise: it has spent so long being pushed that the world has become a series of shoves. The first lesson fails, and the mud is the proof. It gets up and tries to look like it meant to do that.',
    'Try again. Plant your own feet beside it, and let it lean.',
    'You dig your boots into the bank and say: lean on me. It does not trust the offer at first. Then it leans, just a little, and the bank does not move, and you do not move, and the next time the moorhen flaps the Poliwag only blinks. It sits there, startled and unmoved, and looks down at its own two feet as if it had never met them. It has found its footing. It will never admit that it learned it from leaning on someone.',
    'You plant yourself beside it again, and it flinches again, and the mud takes it again. You do not say anything about it. You help it up, wipe its face, and plant your boots once more. On the fourth try it stands through the flap of wings. The look on its face is pure astonishment. It is not as clean as a first-try lesson, but it is learned, and it is steady, and you were there for every slip.',
    'Stand with it on the bank for as long as it takes, one flinch at a time.',
    'There is no cleverness to it: you stand on the muddy bank, and every time a sound makes it jump, you say nothing and wait. The jumping gets smaller. By evening it is only a twitch, and by the time the stars are out it is a glance. The Poliwag stands at the water\'s edge with its feet flat on the ground, and it looks very small and very certain.'),
  lesson('pp-lesson-stand', 'Lesson: Standing Its Ground', 'stand', 'love',
    'You ask it to face you and hold still while you walk towards it, slowly, the way a bully would. It manages three steps of your approach before it turns and bolts for the reeds, and you have to catch it gently by the tail before it is gone. It is panting. It is not angry; it is ashamed. The first attempt fails, and so does every first attempt of its life, and you see for a moment the shape of what the pond has been teaching it all along: when someone big comes, you run.',
    'Try again. Walk towards it, and stop before it breaks.',
    'You come at it slowly again, and this time you stop one step early, and wait. The Poliwag is trembling, but it is not running. You hold the stop. After a long moment it takes one small step towards you instead of away. Then another. You say its name. It says its own, in the cry it has, and it holds its ground against a person walking at it, and it does not run. When you let it go it is crying, and it is not from fear.',
    'It runs again, and you catch it again, and you tell it it is allowed to be scared and still stay. The third time it holds for three breaths. The fourth time, for ten. You can see how much it is costing it to stay, and you stay with it, and when it finally does not run it falls on its back in the grass and cries and laughs in the same breath. It learned it the slow way, and the slow way holds just as well.',
    'Sit down on the grass so you are small, and let it come to you when it is ready.',
    'You do not walk at it at all. You simply sit, and look at the sky, and wait. It takes a very long time. Eventually a small, wet shape climbs into your lap and sits there with its back straight, its chin up, and its eyes on the water. It is facing the pond. It is not running. Neither of you says anything, and for the Poliwag it is the bravest thing that has ever happened.'),
  {
    ...base, id: 'pp-pond-visit', name: 'The One Who Hangs Back', requires: [flag('pp-begun'), flag('pp-ending-done', 0, 0)], rarity: 'rare',
    scene: scene('#1c3b52', 'fog', 'poliwhirl'),
    intro: 'A Poliwhirl is sitting at the far edge of the pond, a little apart from the others, with its back to the water and its eyes on the ground. It is one of the five. It has not looked at the Poliwag once since you arrived. When you come near, its shoulders tighten, the way a person\'s do when they are expecting to be told off. The others laugh somewhere out in the reeds. This one does not.',
    choices: [
      { label: 'Sit beside it and ask what happened.', requires: [], success: { text: 'It takes a long time to speak, and when it does, it is mostly in the cry of its kind, which you understand more than you should. Once the pond was a post: they were the ones who stood watch over the water and turned trainers away so that nobody would net the small ones. It was good, honest work. Then the trainers stopped coming. And a watch with nothing to guard gets mean out of habit, the way a fist stays closed. It points at the Poliwag with one webbed hand and shuts its eyes. It is ashamed. It does not know how to stop, and it hoped someone would.', effects: [pond('guilty'), setFlag('pp-pond-talked')] } },
      { label: 'Tell it the Poliwag is not scared of it anymore.', requires: [{ kind: 'flag', key: 'pp-lessons', atLeast: 1, atMost: 99 }], success: { text: 'It lifts its head, finally. Behind you the Poliwag is standing straight, with its chin up and its feet planted. The Poliwhirl looks at it for a long moment, and something loosens in it that has been tight for a very long time. It says nothing. It nods, once, the smallest nod you have ever seen, and turns its face away so no one will see it. Whatever happens at the rematch, one of the five will not be laughing.', effects: [pond('guilty'), setFlag('pp-pond-talked')] } },
      { label: 'Leave it alone.', requires: [], success: { text: 'You leave it with its back to the water and its eyes on the ground. It is not your place. You are almost out of sight when you hear it say one word to nobody. You do not catch it. Someone, you suspect, will have to ask again.', effects: [] } },
    ],
  },
];

const rematchFight = (id, name, exceptional) => ({
  ...base, id, name, callback: true, rarity: 'rare',
  requires: [flag('pp-begun'), flag('pp-lessons', 3), flag('pp-exceptional', exceptional ? 1 : 0, exceptional ? 99 : 0), flag('pp-ending-done', 0, 0), flag('pp-rematch-won', 0, 0)],
  scene: scene('#1a4a6b', exceptional ? 'sparkle' : 'rain', 'poliwhirl'),
  intro: exceptional
    ? 'Back at the pond. The five are waiting this time, in a half circle, the way you wait for something you are sure about. The lead bully steps forward from the reeds, big and broad and smiling, and says the thing in the old cry that every bully says: so. Are you back for more? The Poliwag does not shrink. It steps out in front of you without being asked, it plants its feet and it keeps its eyes open, and you can feel from where you are standing that something has been waiting to happen all along. Behind the bully, the Poliwhirl who hangs back is watching with its hands clenched at its sides.'
    : 'Back at the pond. The five are waiting, in a half circle, and the lead bully steps forward out of the reeds with its arms folded. Big and broad and smiling. So, it says in the old cry. Are you back for more? The Poliwag does not run. It is shaking, but it is not running, and it steps out in front of you without being asked. It is one on one: the bully has decided that, because it never doubted how it would go. You taught the Poliwag three things. The bully has three tricks. Everything depends on whether they cancel out.',
  choices: [{
    label: exceptional ? 'Let the Poliwag go to the water.' : 'Let the Poliwag step forward.', requires: [],
    success: {
      text: exceptional ? 'You step back. The Poliwag does not look at you for permission. It looks at the bully.' : 'You step back, and it is the hardest thing you have done all stage. You trust the Poliwag. You taught it everything you could.',
      effects: [],
      battle: {
        kind: 'trainer', name: 'The Lead Bully', classId: 'roughneck', team: ['poliwhirl'], size: 1, levelBonus: 7, pseudo: true,
        rule: { pondDuel: true, noSwitch: true, matchLead: true, ...(exceptional ? { evolveMid: true } : {}) },
        win: [pond('rematchWon'), { kind: 'addEvent', eventId: 'pp-ending' }],
        lose: [{ kind: 'heal', share: 0.5, who: 'party' }],
      },
    },
  }],
});

events.push(rematchFight('pp-rematch', 'The Rematch at the Pond', false), rematchFight('pp-rematch-exceptional', 'The Rematch at the Pond (It Is Ready)', true));

events.push({
  ...base, id: 'pp-ending', name: 'After the Pond', room: true, rarity: 'rare', requires: [flag('pp-rematch-won')],
  scene: scene('#2a6a8a', 'sparkle'),
  intro: 'It is very quiet after. The lead bully is sitting in the shallows with its head down, and the other four have gone silent, and the Poliwag is standing in front of you dripping, out of breath, bright-eyed and unbelievably proud. Nobody has ever hit it back before. It does not know what to do with its hands. Then it turns around and looks at you, and you see the question it has been holding for the whole stage and cannot ask. Where does it go from here?',
  choices: [
    { label: 'Keep it. It stays with you.', requires: [], success: { text: 'You hold out a hand. The Poliwag looks at it as if it might disappear. Then it puts a damp little palm on yours. And for the first time in its life, someone has chosen it, and it does not have to earn the place. In the quiet, something small lights up in it and stays: when it steps aside for a friend, the friend goes first. It has learned that from someone. It learned it from you. Kindness is its now, and it will always be the first to make room.', effects: [pond('keep')] } },
    { label: 'Let it go. It will found its own pond.', requires: [], success: { text: 'You crouch and tell it you are proud of it, and that it does not have to follow you to be brave. It understands before you finish. It looks back at the water, and at the five who are suddenly listening, and it stays at the edge with its chin up. When you walk away it does not call after you. It turns to the pond and starts to teach the first small thing it knows: eyes open. Somewhere deep in the reeds a new pond is starting, and you will not hear about it. But you will hear it, one day, when you most need it.', effects: [pond('release'), setFlag('pp-pond-founded')] } },
    { label: 'Ask the one who hung back to come forward.', requires: [{ kind: 'flag', key: 'pp-guilty', atLeast: 1, atMost: 99 }], success: { text: 'The Poliwhirl who hung back comes forward before you finish asking. It stands in front of the lead bully and says a single word, the one you did not catch before. The lead bully looks up, and for the first time you see how tired it is, how long it has been angry. One by one the five come to the water\'s edge and stand in a row. The Poliwag does not hide. It says, in the little cry that is its own: we could do something good with the pond. The old post. The watch. The five look at one another, and nobody laughs. The pond will not be a fortress. It will be a school, and the Poliwag will be its first student and its last teacher.', effects: [pond('reconcile'), setFlag('pp-pond-founded')] } },
  ],
});

events.push({
  ...base, id: 'pp-return-join', name: 'It Knew You First', callback: true, rarity: 'rare',
  requires: [flag('pp-return-fired'), flag('pp-return-joined', 0, 0)],
  scene: scene('#2a7a9a', 'sparkle', 'poliwrath'),
  intro: 'A Poliwrath is waiting at the edge of the path, broad and quiet and rain-wet. It does not roar. It does not pose. When you step closer it simply looks at you with the same wide, honest eyes you last saw behind your own shins, and it makes a small sound in its throat, and you know that sound, and your knees almost give. It says, in the cry that it has always had: I was always going to come back. I only needed to become something that could.',
  choices: [
    { label: 'Open your arms. Welcome it home.', requires: [], success: { text: 'It crosses the distance in two steps and stops one short, the way someone does who has practiced the moment alone a hundred times. Then it bows its head. It joins your party at the average of your levels, carrying a small, gentle ability it made for itself: Kindness. The first move a friend makes after it steps aside will always be fast enough to count.', effects: [pond('returnJoin')] } },
    { label: 'Smile. Tell it to go on back to its pond.', requires: [], success: { text: 'It understands, and it is not hurt. It bows once, deeply, and turns to the reeds. Over its shoulder it makes the small sound again, and you realise it was never asking to join. It was making sure you were all right. It goes home to a pond full of students. You are a little lonelier, and a little more loved.', effects: [setFlag('pp-return-joined')] } },
  ],
});

writeFileSync(new URL('../../src/data/events/poli-pond.json', import.meta.url), JSON.stringify({ events }, null, 1) + '\n');
console.log(`poli-pond: ${events.length} events`);
