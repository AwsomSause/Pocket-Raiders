// Catalog Overhaul Pack: TRADES.md Part 3, the 110 specific trades (T001–T110), plus the trade-back service (4.3).
// Every trade is an `honestTrade`: the card shows both sides before the player agrees. Buttons: "Trade." / "Ask about it." /
// "No thanks." (some add a fourth). Asking first means it arrives at Bond 3, not 2 (TRADES.md 1.2). After a trade the run flag
// `trade-<id>` is set; a "Return" line comes back as a scene a region later (a callback on a region-stamped flag).
// Not built here (see docs/status/co-markets.md): T025 (a two-way temporary trade), T097–T100 (past runs: Kice's rule keeps
// memory inside one run), T101 (the rival's spare Pokémon).
import { ch, flag, flagIs, out, trainer, fight, type Json } from '../dsl.ts';
import { rep, stay } from './_markets.ts';

export { CATEGORY } from './_markets.ts';

const G = 'Trades';
type W = Json;
const any = (label = 'any Pokémon'): W => ({ label, species: [] });
const ty = (label: string, ...types: string[]): W => ({ label, species: [], types });
const not = (label: string, ...notTypes: string[]): W => ({ label, species: [], notTypes });
const sp = (label: string, ...species: string[]): W => ({ label, species });
const wt = (label: string, o: Json): W => ({ label, species: [], ...o });
const CALM = ['calm', 'relaxed', 'quiet', 'careful', 'sassy', 'gentle'];
const FAST = ['jolly', 'timid', 'hasty', 'naive'];
const GOOD = ['adamant', 'modest', 'jolly', 'timid', 'bold', 'calm', 'careful', 'impish', 'gentle'];
const FOSSILS = ['omanyte', 'kabuto', 'aerodactyl', 'lileep', 'anorith', 'cranidos', 'shieldon', 'archen', 'tyrunt', 'amaura', 'dracozolt', 'arctozolt', 'dracovish', 'arctovish'];
const EEVEELUTIONS = ['jolteon', 'flareon', 'espeon', 'umbreon', 'leafeon', 'glaceon', 'sylveon'];
const MOUSTACHES = ['abra', 'kadabra', 'alakazam', 'mienfoo', 'mienshao', 'hitmonchan'];
const GLOWS = ['chinchou', 'lanturn', 'litwick', 'lampent', 'chandelure'];

interface Row {
  n: number; who: string; ot: string; place: string; line: string;
  sp: string; nat: string; q?: string; marks?: string[]; moves?: string[]; hidden?: boolean;
  w: W | null; ask: string;
  /** A Return line: comes back as its own scene a region later. */
  ret?: string;
  /** A fourth button: label, text, and whether it is the trade (with a flag) or not. */
  fourth?: { label: string; text: string; trade: boolean; flag?: string; fx?: Json[] };
  /** "Only if": the run flag the trade needs. */
  only?: string;
  /** A gift: nothing taken. */
  gift?: boolean;
}

const ROWS: Row[] = [
  // ---- Pool 1. Coastal Harbour ----
  { n: 1, who: 'Net-mender Effie', ot: 'Effie', place: 'A pier strung with drying nets', line: 'This one chews my nets. I love it. I can\'t afford it.', sp: 'krabby', nat: 'adamant', q: 'collector', w: not('any non-Water Pokémon', 'water'), ask: 'It\'s ruined forty nets. It brings me a shell every morning to say sorry.', ret: 'A letter from Effie, smelling of salt: "Your Pokémon guards my nets now. Not one hole all season. It still gets a shell from me every morning, to say thank you."' },
  { n: 2, who: 'Old salt Brinner', ot: 'Brinner', place: 'The harbour wall', line: 'Swap? Tide\'s been kind.', sp: 'wingull', nat: 'timid', q: 'loves-rain', w: wt('a Pokémon that can\'t swim', { notTypes: ['water'] }), ask: 'It\'s been on my boat twelve years. It deserves land.' },
  { n: 3, who: 'Lighthouse kid Bodhi', ot: 'Bodhi', place: 'The foot of a lighthouse', line: 'Trade me something that\'s never seen the sea!', sp: 'chinchou', nat: 'calm', q: 'sings-at-night', w: not('a Pokémon caught inland', 'water'), ask: 'It lights my room. I\'ll be okay. I\'ve got a torch.' },
  { n: 4, who: 'Mrs. Ennis, the ferryman\'s widow', ot: 'Mrs. Ennis', place: 'The ferry, tied up and still', line: 'My husband\'s. I can\'t look at it.', sp: 'lapras', nat: 'modest', q: 'old', w: any('anything, any level'), ask: 'He ferried people for forty years on its back. I just can\'t.',
    fourth: { label: 'I\'ll bring it back to visit.', text: 'Mrs. Ennis presses both hands to her mouth. "Would you? Once in a while?" She lets it go, and watches it all the way down the jetty.', trade: true, flag: 't004-visit' },
    ret: 'Mrs. Ennis is at the ferry when you pass. The Lapras goes straight to her. She cries, but less than last time, and she laughs at the end.' },
  { n: 5, who: 'Diver Maren Breck', ot: 'Maren Breck', place: 'A dive boat rocking on the swell', line: 'Found it on a wreck. It won\'t leave me alone.', sp: 'dhelmise', nat: 'brave', q: 'grudge', marks: ['found on a wreck'], w: ty('a Steel-type', 'steel'), ask: 'It thinks I\'m the ship. I\'m not the ship.' },
  { n: 6, who: 'Fishing boy Tobias Reef', ot: 'Tobias Reef', place: 'A jetty with three rods propped on it', line: 'Trade? It keeps scaring the fish.', sp: 'skrelp', nat: 'bold', q: 'show-off', w: ty('a Bug-type', 'bug'), ask: 'My dad says Poison-types are bad luck on boats. I don\'t believe him.' },
  { n: 7, who: 'Harbourmaster Corrie Lund', ot: 'Corrie Lund', place: 'The harbour office, paperwork to the ceiling', line: 'Paperwork says I have to rehome it.', sp: 'finizen', nat: 'jolly', q: 'always-leads', w: wt('a Pokémon with a good nature', { natures: GOOD }), ask: 'It keeps rescuing swimmers who aren\'t drowning.',
    ret: 'A postcard from Corrie Lund: "Your Pokémon pulled a kid out of the surf. A real one, this time. The whole harbour knows your name."' },
  { n: 8, who: 'Coral keeper Imelda Sand', ot: 'Imelda Sand', place: 'A reef, white turning slowly pink', line: 'The reef\'s healing. This one\'s ready to leave.', sp: 'corsola', nat: 'calm', q: 'gentle', w: ty('a Grass-type, for the reef garden', 'grass'), ask: 'It stayed while the reef was white. It\'s earned a journey.' },
  { n: 9, who: 'Gull-feeder Ama', ot: 'Ama', place: 'The promenade, gulls everywhere', line: 'It steals chips. Every chip. Please.', sp: 'wingull', nat: 'naughty', q: 'steals-berries', w: any('anything that won\'t steal chips'), ask: 'I\'ll miss it. I won\'t miss buying chips twice.' },
  // ---- Pool 2. Mountain and Mine ----
  { n: 10, who: 'Miner Gratton', ot: 'Gratton', place: 'A pit head, lamps swinging', line: 'Dug this one out of a wall.', sp: 'roggenrola', nat: 'sassy', q: 'wont-lead', w: ty('a Fire- or Electric-type, for light', 'fire', 'electric'), ask: 'It was asleep in the rock for who knows how long.' },
  { n: 11, who: 'Climber Yolanda Peak', ot: 'Yolanda Peak', place: 'A narrow ledge, rope coiled on her shoulder', line: 'She\'s too heavy for my rope.', sp: 'onix', nat: 'impish', q: 'show-off', w: ty('a Flying-type', 'flying'), ask: 'We\'ve climbed every peak but one. I need wings for the last.',
    ret: 'A photo arrives from Yolanda Peak: the last summit, the clouds below, and your Pokémon beside her with its wings spread, looking very pleased.' },
  { n: 12, who: 'Foreman\'s kid Rocco', ot: 'Rocco', place: 'The mine office', line: 'Dad says I can trade one.', sp: 'machop', nat: 'adamant', q: 'always-leads', w: ty('something cute, a Fairy- or Normal-type', 'fairy', 'normal'), ask: 'Machop does all my chores. I want one that does none.' },
  { n: 13, who: 'Old geologist Doran Stout', ot: 'Doran Stout', place: 'A cave mouth, rock samples in rows', line: 'I trade rocks for rocks.', sp: 'nosepass', nat: 'relaxed', q: 'collector', w: ty('a Rock-type', 'rock'), ask: 'It always points north. I\'ve never been lost. I\'d like to be, once.' },
  { n: 14, who: 'Caver Fia', ot: 'Fia', place: 'Deep in a cave, one headlamp', line: 'It\'s afraid of the dark. In a cave.', sp: 'zubat', nat: 'timid', q: 'night-owl', w: sp('a Pokémon that glows (Chinchou, Lanturn, Litwick)', ...GLOWS), ask: 'Bats afraid of the dark. I know. I know.' },
  { n: 15, who: 'Rescue miner Bryn', ot: 'Bryn', place: 'A collapsed shaft, timbers fresh', line: 'Saved me in a cave-in. I owe it more than I can give.', sp: 'riolu', nat: 'jolly', q: 'gentle', w: wt('a Pokémon with Bond 3 or more', { bond: 3 }), ask: 'It wants a trainer who\'ll go further than this mine.',
    fourth: { label: 'Are you sure?', text: 'Bryn looks at it for a long time. "Yes." He is crying. "Yes. Go on. Go further than me."', trade: true } },
  { n: 16, who: 'Ore trader Sigrun', ot: 'Sigrun', place: 'The mine market, scales on every stall', line: 'Fair value, as ever.', sp: 'larvitar', nat: 'hasty', q: 'bites-strangers', w: wt('a Rare-tier Pokémon (value shown)', { minTier: 3 }), ask: 'Hatched in the ore cart. It thinks the cart\'s its mother.' },
  { n: 17, who: 'Mountain hermit Bracken', ot: 'Bracken', place: 'A stone hut above the treeline', line: 'Too old to keep up with it.', sp: 'gible', nat: 'rash', q: 'always-leads', w: wt('a slow, calm Pokémon', { natures: CALM }), ask: 'It runs off the cliff edge to see if it can fly. It can\'t.' },
  { n: 18, who: 'Stone-polisher Ilsa', ot: 'Ilsa', place: 'A workshop glittering with dust', line: 'It eats my best gems.', sp: 'sableye', nat: 'careful', q: 'collector', w: any('a Pokémon that doesn\'t eat gems'), ask: 'It\'s very sorry. It isn\'t sorry.' },
  // ---- Pool 3. Forest and Grove ----
  { n: 19, who: 'Forester Linnea', ot: 'Linnea', place: 'A log lodge at the forest edge', line: 'This one keeps wandering into town.', sp: 'teddiursa', nat: 'bold', q: 'steals-berries', w: ty('a Water-type', 'water'), ask: 'It walked into the bakery and sat down. Every day for a month.' },
  { n: 20, who: 'Orchard keeper Brae', ot: 'Brae', place: 'An orchard, branches heavy', line: 'The trees lean toward it.', sp: 'skiddo', nat: 'docile', q: 'gentle', w: ty('a Grass-type', 'grass'), ask: 'It belonged to a farm that closed. It wants to roam.' },
  { n: 21, who: 'Bug Catcher Wade', ot: 'Wade', place: 'The forest edge, net over his shoulder', line: 'Bug for a bug?', sp: 'scyther', nat: 'adamant', q: 'show-off', w: ty('a Bug-type', 'bug'), ask: 'My Spike evolved. This one\'s sulking. It wants to be someone\'s main.' },
  { n: 22, who: 'Herbalist Old Sesk', ot: 'Old Sesk', place: 'A glade full of drying herbs', line: 'It keeps eating my stock.', sp: 'shroomish', nat: 'calm', q: 'steals-berries', w: not('anything that won\'t eat herbs', 'grass', 'bug'), ask: 'It\'s healthy. It\'s very, very healthy.' },
  { n: 23, who: 'Woodcutter Hamish', ot: 'Hamish', place: 'A clearing, an axe left in a stump', line: 'It saved me from a falling tree.', sp: 'heracross', nat: 'brave', q: 'gentle', w: ty('a Pokémon that can cut (a Grass- or Bug-type)', 'grass', 'bug'), ask: 'I don\'t cut trees anymore. It doesn\'t need to lift them.',
    ret: 'Word from Hamish: he plants trees now, rows of them. The saplings by the road are his, and your Pokémon carries the water.' },
  { n: 24, who: 'Hermit Wennick', ot: 'Wennick', place: 'The hollow tree', line: 'It brings me berries. You need it more.', sp: 'sewaddle', nat: 'quiet', q: 'collector', w: any('any Pokémon (he\'ll love it)'), ask: 'Thirty years. It\'s been my company. Go on. I\'ve got the Mythical now.', only: 'teller-wennick' },
  { n: 26, who: 'Grove child Ivy-May', ot: 'Ivy-May', place: 'A treehouse with a rope ladder', line: 'Its name\'s Leafy. Do you want Leafy?', sp: 'fomantis', nat: 'hasty', q: 'show-off', marks: ['named Leafy'], w: ty('a teddy bear (any Normal-type)', 'normal'), ask: 'Leafy needs a big adventure. I\'m eight.' },
  { n: 27, who: 'Fire-watch Abigail', ot: 'Abigail', place: 'A fire tower above the canopy', line: 'Its wings are too warm for the forest.', sp: 'larvesta', nat: 'modest', q: 'homesick', w: ty('a Water-type', 'water'), ask: 'It set the bracken smoking twice. I love it. It can\'t stay.' },
  // ---- Pool 4. City and Market ----
  { n: 28, who: 'Office worker Tamsk', ot: 'Tamsk', place: 'A tiny flat, a window box of herbs', line: 'My flat\'s too small for it.', sp: 'lillipup', nat: 'jolly', q: 'always-leads', w: wt('a small Pokémon', { maxWeight: 10 }), ask: 'It needs a field. I\'ve got a window box.' },
  { n: 29, who: 'Shop kid Nell-Bea', ot: 'Nell-Bea', place: 'A corner shop doorway', line: 'Swap? Please? I\'ll be good.', sp: 'pikachu', nat: 'hasty', q: 'show-off', w: sp('an Eevee', 'eevee'), ask: 'I want the one with the fluffy neck.' },
  { n: 30, who: 'Hacker Ivo Ternary', ot: 'Ivo Ternary', place: 'A café, three laptops open', line: 'Digital for digital.', sp: 'porygon', nat: 'modest', q: 'collector', w: sp('a Porygon', 'porygon'), ask: 'I\'ve an Up-Grade. Trade me yours, I\'ll trade it back evolved. Free.',
    fourth: { label: 'Trade, and trade back.', text: 'Ivo clips an Up-Grade to your Porygon, trades it over, and trades it straight back. "Honest. Always."', trade: false, fx: [{ kind: 'tradeBack' }] } },
  { n: 31, who: 'Street magician Vasquez', ot: 'Vasquez', place: 'A square, a small crowd', line: 'Pick a card. Any Pokémon.', sp: 'zorua', nat: 'naughty', q: 'show-off', w: any(), ask: 'It turns into my rabbit. I don\'t have a rabbit.' },
  { n: 32, who: 'Electrician Baxter', ot: 'Baxter', place: 'A workshop full of wires', line: 'It lives in my microwave.', sp: 'rotom', nat: 'timid', q: 'collector', w: not('a Pokémon that doesn\'t live in appliances', 'electric'), ask: 'My toast is ruined. Every morning.' },
  { n: 33, who: 'Postal worker June', ot: 'June', place: 'The post office counter', line: 'It keeps eating the letters.', sp: 'yamper', nat: 'jolly', q: 'steals-berries', w: any('any Pokémon that respects mail'), ask: 'It eats the stamps. Just the stamps. It has a type.' },
  { n: 34, who: 'Busker Ollo', ot: 'Ollo', place: 'The high street, a hat on the ground', line: 'My Meowth hates my music.', sp: 'meowth', nat: 'sassy', q: 'collector', w: wt('a Pokémon with a sound move', { moveFlag: 'sound' }), ask: 'It covers its ears. Every song. I need a fan.' },
  { n: 35, who: 'Recycler Pruitt', ot: 'Pruitt', place: 'The tip, gulls circling', line: 'It found me. I wasn\'t looking.', sp: 'trubbish', nat: 'careful', q: 'collector', w: any('anything'), ask: 'Trubbish nobody wanted. I wanted it. Now you might.' },
  { n: 36, who: 'Ditto researcher Dr. Mole', ot: 'Dr. Mole', place: 'A cramped lab', line: 'It\'s been my Eevee for a year. It\'s sad about it.', sp: 'ditto', nat: 'relaxed', q: 'gentle', w: sp('an Eevee', 'eevee'), ask: 'I wanted an Eevee. It wanted to be what I wanted. That\'s not fair to it.' },
  // ---- Pool 5. Desert and Ruins ----
  { n: 37, who: 'Nomad Yusra', ot: 'Yusra', place: 'The sandstorm camp', line: 'Our caravans always trade.', sp: 'trapinch', nat: 'brave', q: 'homesick', w: ty('a Water-type', 'water'), ask: 'It dug a pit under my tent. Twice.' },
  { n: 38, who: 'Ruin Maniac Hadrian', ot: 'Hadrian', place: 'A dig, string grids everywhere', line: 'Found it guarding a door.', sp: 'baltoy', nat: 'calm', q: 'night-owl', w: ty('a Psychic-type', 'psychic'), ask: 'It spins when it\'s happy. It\'s spun for six years.' },
  { n: 39, who: 'Oasis keeper Rahim', ot: 'Rahim', place: 'The oasis, shade and still water', line: 'It drinks too much.', sp: 'hippopotas', nat: 'relaxed', q: 'steals-berries', w: not('a Pokémon that doesn\'t drink much', 'water'), ask: 'The water costs me. It costs me most.' },
  { n: 40, who: 'Tomb guard Neferet', ot: 'Neferet', place: 'A sealed ruin, a torch by the door', line: 'It mourns the king. The king\'s been dead three thousand years.', sp: 'yamask', nat: 'quiet', q: 'grudge', w: ty('a Ghost- or Psychic-type', 'ghost', 'psychic'), ask: 'It wears his mask. It should see something new.' },
  { n: 41, who: 'Cactus farmer Prickett', ot: 'Prickett', place: 'A cactus farm, gloves on every post', line: 'It hugs. That\'s the problem.', sp: 'cacnea', nat: 'impish', q: 'bites-strangers', w: ty('a Steel-type', 'steel'), ask: 'It wants to be held. It\'s a cactus.' },
  { n: 42, who: 'Caravan guard Dashiell', ot: 'Dashiell', place: 'A caravan resting at dusk', line: 'It wants to fly. It can\'t.', sp: 'sigilyph', nat: 'timid', q: 'night-owl', w: ty('a Flying-type', 'flying'), ask: 'It hovers. It thinks that\'s flying. I don\'t have the heart.' },
  { n: 43, who: 'Sand diver Kasha', ot: 'Kasha', place: 'The dunes', line: 'It swims through sand. It\'s never seen water.', sp: 'silicobra', nat: 'hasty', q: 'homesick', w: ty('a Water-type', 'water'), ask: 'Show it a lake. It\'ll lose its mind.' },
  { n: 44, who: 'Scorpion breeder Hux', ot: 'Hux', place: 'A hut with a hand-painted sign', line: 'It\'s gentle. People don\'t believe me.', sp: 'skorupi', nat: 'gentle', q: 'gentle', w: any('any Pokémon, as long as you believe him'), ask: 'It\'s never stung anyone. Not once.' },
  { n: 45, who: 'Ruins child Sefa', ot: 'Sefa', place: 'The edge of a ruin', line: 'It came out of the wall. It likes my songs.', sp: 'dreepy', nat: 'jolly', q: 'sings-at-night', w: wt('a Pokémon that likes songs (a sound move)', { moveFlag: 'sound' }), ask: 'It was alone in there. I think it\'s a ghost of a dragon.' },
  // ---- Pool 6. Snow and Ice ----
  { n: 46, who: 'Ice fisher Aurel Stav', ot: 'Aurel Stav', place: 'A frozen lake, a hole cut in the ice', line: 'It\'s never been warm. Show it.', sp: 'spheal', nat: 'relaxed', q: 'homesick', w: ty('a Fire-type', 'fire'), ask: 'It rolls everywhere. It\'s never had anywhere to roll to.' },
  { n: 47, who: 'Skier Yuki', ot: 'Yuki', place: 'The bottom of a slope', line: 'She hates skiing. Hates it.', sp: 'snover', nat: 'bold', q: 'wont-lead', w: wt('a Pokémon that likes speed', { natures: FAST }), ask: 'She just wants to stand still and be a tree.' },
  { n: 48, who: 'Lodge keeper Ingrid', ot: 'Ingrid', place: 'A lodge, the fire roaring', line: 'Fireside for a snowball?', sp: 'snom', nat: 'timid', q: 'collector', w: ty('a Fire-type', 'fire'), ask: 'It eats the frost off my windows. Then it\'s cold.' },
  { n: 49, who: 'Glacier guide Ostrom', ot: 'Ostrom', place: 'The foot of a glacier', line: 'It found me in a crevasse.', sp: 'cubchoo', nat: 'impish', q: 'gentle', w: ty('a Pokémon that can climb (Rock or Ground)', 'rock', 'ground'), ask: 'Its nose runs all the time. It\'s the best Pokémon alive.' },
  { n: 50, who: 'Snow sculptor Liesl', ot: 'Liesl', place: 'An ice garden of statues', line: 'It ruins my sculptures. Lovingly.', sp: 'snorunt', nat: 'naughty', q: 'show-off', w: any('a Pokémon that won\'t touch art'), ask: 'It adds a hat to every statue. The hats are good.' },
  { n: 51, who: 'Ice-cave hermit Vada', ot: 'Vada', place: 'An ice cave, blue light', line: 'This one\'s from an island where it snows in summer.', sp: 'vulpix-alola', nat: 'modest', q: 'homesick', w: sp('a Kantonian Vulpix', 'vulpix'), ask: 'It wants to see what it would have been.' },
  { n: 52, who: 'Whaler\'s grandson Pieter', ot: 'Pieter', place: 'A cold harbour', line: 'It sings to the whales.', sp: 'cetoddle', nat: 'calm', q: 'sings-at-night', w: ty('a Water-type', 'water'), ask: 'Grandpa hunted whales. I\'m doing the opposite.' },
  { n: 53, who: 'Osric, the Frost King\'s squire', ot: 'Osric', place: 'A snow road', line: 'The King says this one\'s too soft for a squire.', sp: 'frigibax', nat: 'careful', q: 'gentle', w: ty('a Fighting-type', 'fighting'), ask: 'It cried when I fell. A dragon. Cried.' },
  { n: 54, who: 'Skater Lumi', ot: 'Lumi', place: 'An outdoor rink', line: 'It can\'t skate. It tries every day.', sp: 'swinub', nat: 'jolly', q: 'always-leads', w: any(), ask: 'I\'ll miss watching it try.' },
  // ---- Pool 7. Farm and Ranch ----
  { n: 55, who: 'Rancher Mags', ot: 'Mags', place: 'A ranch, the herd by the river', line: 'Too lively for the herd.', sp: 'ponyta', nat: 'hasty', q: 'always-leads', w: wt('a calm Pokémon', { natures: CALM }), ask: 'It leads the herd into the river. Every time.' },
  { n: 56, who: 'Farmer\'s daughter Wynne', ot: 'Wynne', place: 'The farm gate', line: 'Dad won\'t remember it. It\'s alright.', sp: 'skiddo', nat: 'gentle', q: 'gentle', w: any('any Pokémon that will visit'), ask: 'It\'s one of Bramble\'s grandchildren. Take it far.',
    fourth: { label: 'I\'ll bring it back to see Abner.', text: 'Wynne\'s face crumples, then smiles. "He won\'t remember. But he\'ll like it. Thank you."', trade: true, flag: 't056-visit' },
    ret: 'At the farm gate, old Abner is sitting in the sun. The Skiddo trots up to him. He pets it and says, "Hello, you." Wynne turns away so he won\'t see her face.' },
  { n: 57, who: 'Mrs. Holloway, the daycare lady', ot: 'Mrs. Holloway', place: 'The daycare', line: 'Nobody came back for it.', sp: 'togepi', nat: 'calm', q: 'gentle', w: any('any Pokémon that needs a daycare'), ask: 'Its trainer left it with me four years ago. It\'s still waiting. It needs someone who\'ll stay.' },
  { n: 58, who: 'Shepherd boy Colm', ot: 'Colm', place: 'A windy hill', line: 'Its wool\'s too warm.', sp: 'mareep', nat: 'relaxed', q: 'sings-at-night', w: ty('a Pokémon that likes the cold (an Ice-type)', 'ice'), ask: 'It sheds static on the sheep.' },
  { n: 59, who: 'Dairy farmer Elspeth Fenn', ot: 'Elspeth Fenn', place: 'A dairy, a barn door dented', line: 'Our Miltank\'s had twins. One wants adventure.', sp: 'miltank', nat: 'brave', q: 'show-off', w: ty('a Normal-type', 'normal'), ask: 'She headbutts the barn door every morning. She wants out.' },
  { n: 60, who: 'Pig farmer Ruddock', ot: 'Ruddock', place: 'A sty with a chained gate', line: 'It\'s too clever. It opens the gate.', sp: 'lechonk', nat: 'impish', q: 'collector', w: any('a Pokémon that can\'t open gates'), ask: 'It brings me things from the neighbours. I return them.' },
  { n: 61, who: 'Breeder Delia', ot: 'Delia', place: 'Her ranch', line: 'This one hatched with a move it shouldn\'t know.', sp: 'eevee', nat: 'timid', q: 'gentle', moves: ['wish'], marks: ['hatched knowing Wish'], w: any('a Pokémon from another region'), ask: 'It\'s special. It should travel.' },
  { n: 62, who: 'Wool farmer Gisella', ot: 'Gisella', place: 'A field of wool', line: 'Too much wool. Not enough sheep.', sp: 'wooloo', nat: 'docile', q: 'gentle', w: ty('a Pokémon that can shear (a Bug-type)', 'bug'), ask: 'It rolls downhill to have fun.' },
  { n: 64, who: 'Channeler Hester', ot: 'Hester', place: 'Her house, candles everywhere', line: 'It follows me. Maybe it\'d follow you.', sp: 'shuppet', nat: 'quiet', q: 'night-owl', w: ty('a Fairy-type', 'fairy'), ask: 'It wants a lost doll. I found the doll. It still wants more.' },
  { n: 65, who: 'Medium Orla', ot: 'Orla', place: 'A table with a cloth over it', line: 'It\'s not haunted. It\'s lonely.', sp: 'phantump', nat: 'calm', q: 'sings-at-night', w: ty('a Psychic-type', 'psychic'), ask: 'It was a child lost in a forest. It still wants to be found.' },
  { n: 66, who: 'Gravedigger Mortlake', ot: 'Mortlake', place: 'A graveyard at dusk', line: 'Found it in a coffin. Empty coffin. Long story.', sp: 'duskull', nat: 'careful', q: 'night-owl', w: ty('anything with a light (Fire or Electric)', 'fire', 'electric'), ask: 'It counts the graves every night. It always gets the same number.' },
  { n: 67, who: 'Tea-shop owner Primrose Brew', ot: 'Primrose Brew', place: 'A tea shop, cups on every shelf', line: 'It lives in my best teapot.', sp: 'sinistea', nat: 'modest', q: 'collector', w: any('any Pokémon that won\'t break teapots'), ask: 'Customers keep drinking it. It doesn\'t mind. I mind.' },
  { n: 68, who: 'Balloon seller Wendell', ot: 'Wendell', place: 'A fair at night', line: 'It took my best balloon and won\'t give it back.', sp: 'drifloon', nat: 'timid', q: 'collector', w: any('a Pokémon that likes children'), ask: 'It takes kids by the hand. It\'s never let go of one. I check.' },
  { n: 69, who: 'Sword collector Sir Percival Knoll', ot: 'Sir Percival', place: 'A manor hall, swords on the walls', line: 'It chose me. Now it wants to choose again.', sp: 'honedge', nat: 'brave', q: 'grudge', w: ty('a Steel-type', 'steel'), ask: 'Its last owner left it in a scabbard for forty years. It\'s angry.' },
  { n: 70, who: 'Costume maker Bettony', ot: 'Bettony', place: 'A theatre\'s back room', line: 'Its costume is perfect. It\'s never taken it off.', sp: 'mimikyu', nat: 'jolly', q: 'show-off', w: sp('a Pikachu (it wants to meet one)', 'pikachu'), ask: 'It wants to see a real one. That\'s all it\'s ever wanted.' },
  { n: 71, who: 'Night watchman Gaspar', ot: 'Gaspar', place: 'A factory at night', line: 'It keeps me company. Nights are long.', sp: 'litwick', nat: 'calm', q: 'sings-at-night', w: wt('a Pokémon that stays up late', { types: ['dark', 'ghost'] }), ask: 'It eats a little of my life, they say. I\'ve got plenty.' },
  { n: 72, who: 'Mrs. Quell, the prankster\'s mother', ot: 'Mrs. Quell', place: 'A cottage', line: 'It\'s been hiding my glasses for nine years.', sp: 'sableye', nat: 'naughty', q: 'collector', hidden: true, w: any('any Pokémon that\'s never pranked anyone'), ask: 'I\'m going to miss looking for my glasses.' },
  // ---- Pool 9. Specific Collectors ----
  { n: 73, who: 'Blue Collector Azura', ot: 'Azura', place: 'A blue house', line: 'Everything I own is blue.', sp: 'fletchling', nat: 'jolly', w: wt('a blue Pokémon', { color: 'blue' }), ask: 'Rudy next door does red. We don\'t speak.' },
  { n: 74, who: 'Tiny Collector Pip Small', ot: 'Pip Small', place: 'A dolls\' house, full size', line: 'I only keep the little ones.', sp: 'snorlax', nat: 'relaxed', q: 'wont-lead', w: wt('a Pokémon under 1 kg', { maxWeight: 1 }), ask: 'It was little when I got it. Then it wasn\'t.' },
  { n: 75, who: 'Name Collector Archibald', ot: 'Archibald', place: 'A library', line: 'I collect Pokémon named after people.', sp: 'eevee', nat: 'docile', marks: ['nicknamed Archie'], w: any('a nicknamed Pokémon'), ask: 'I\'ll keep the name. You keep the Pokémon\'s memory of it.' },
  { n: 76, who: 'Fossil Collector Ammonia', ot: 'Ammonia', place: 'A stall of fossils', line: 'Fossils for fossils.', sp: 'tirtouga', nat: 'bold', w: sp('a different fossil Pokémon', ...FOSSILS), ask: 'I want one of each. You get one of mine.' },
  { n: 77, who: 'Eeveelution Collector Tobit', ot: 'Tobit', place: 'A cottage', line: 'I need a Glaceon.', sp: 'vaporeon', nat: 'calm', w: sp('any other Eeveelution', ...EEVEELUTIONS), ask: 'Uncle Fenwick never evolved his. I\'m doing all of them for him.' },
  { n: 78, who: 'Moustache Collector Barnaby Brisk', ot: 'Barnaby Brisk', place: 'A barber\'s', line: 'I collect Pokémon with moustaches.', sp: 'mr-mime', nat: 'timid', w: sp('a Pokémon with a moustache', ...MOUSTACHES), ask: 'It\'s a lifestyle.' },
  { n: 79, who: 'Heavy Collector Brannoc', ot: 'Brannoc', place: 'His cart', line: 'One more puller and the cart\'s complete.', sp: 'bronzor', nat: 'relaxed', w: wt('a Pokémon of 100 kg or more', { minWeight: 100 }), ask: 'My old puller\'s retiring next week.' },
  { n: 81, who: 'Night Collector Morwen', ot: 'Morwen', place: 'A crypt', line: 'Ghosts and Darks only. Bring me one.', sp: 'clefairy', nat: 'calm', w: ty('a Ghost- or Dark-type', 'ghost', 'dark'), ask: 'The Coven\'s short-handed for the parade.' },
  { n: 82, who: 'Mr. Lyle, the Retired Champion\'s Collector', ot: 'Mr. Lyle', place: 'A trophy room', line: 'I collect Pokémon that beat a Champion.', sp: 'lapras', nat: 'modest', w: wt('a Pokémon that has beaten a Champion (Bond 4 or more)', { bond: 4 }), ask: 'History matters. I\'ll take good care of it.' },
  // ---- Pool 10. Far From Home ----
  { n: 83, who: 'Traveller Iolo Akana', ot: 'Iolo Akana', place: 'A ferry port', line: 'Brought it from the islands. It\'s miserable here.', sp: 'sandshrew-alola', nat: 'calm', q: 'homesick', w: sp('a Sandshrew', 'sandshrew'), ask: 'It\'s freezing on the inside and boiling on the outside. It wants the snow.' },
  { n: 84, who: 'Exchange student Kenta', ot: 'Kenta', place: 'A school gate', line: 'Trade forms? For science!', sp: 'meowth-galar', nat: 'brave', q: 'show-off', w: sp('a Meowth', 'meowth'), ask: 'Mine\'s tough. Yours is clever. Let\'s compare.' },
  { n: 85, who: 'Pilgrim Sister Aoi', ot: 'Sister Aoi', place: 'A shrine road', line: 'This one\'s from the old days. The very old days.', sp: 'growlithe-hisui', nat: 'adamant', q: 'always-leads', w: sp('a Growlithe', 'growlithe'), ask: 'It guarded a village that isn\'t there anymore.' },
  { n: 86, who: 'Galar farmer Rowan Fell', ot: 'Rowan Fell', place: 'A border farm', line: 'It\'s never seen a normal pony.', sp: 'ponyta-galar', nat: 'timid', q: 'gentle', w: sp('a Ponyta', 'ponyta'), ask: 'It thinks it\'s an ordinary horse. It isn\'t.' },
  { n: 87, who: 'Paldean wanderer Inés', ot: 'Inés', place: 'A crossroads', line: 'It\'s poison where it should be water.', sp: 'wooper-paldea', nat: 'relaxed', q: 'homesick', w: sp('a Wooper', 'wooper'), ask: 'It wants to see its cousins. The wet ones.' },
  { n: 88, who: 'Antiques dealer Dunmore', ot: 'Dunmore', place: 'An antique shop', line: 'Very old. Very rare. Very angry.', sp: 'zorua-hisui', nat: 'naughty', q: 'grudge', w: sp('a Zorua', 'zorua'), ask: 'I bought it. It never forgave me. Please.' },
  { n: 89, who: 'Island chef Malie', ot: 'Malie', place: 'A seafood stall', line: 'It eats all my rubbish. I mean that kindly.', sp: 'grimer-alola', nat: 'bold', q: 'collector', w: sp('a Grimer', 'grimer'), ask: 'It\'s colourful. Your Grimer is... not.' },
  { n: 90, who: 'Galarian historian Prof. Slade', ot: 'Prof. Slade', place: 'A museum', line: 'It\'s a regional variant of a famously slow Pokémon.', sp: 'slowpoke-galar', nat: 'quiet', q: 'wont-lead', w: sp('a Slowpoke', 'slowpoke'), ask: 'We\'re writing a paper on yawning. We need both.' },
  // ---- Pool 11. Delta Exchange ----
  { n: 91, who: 'Dr. Linden Vale', ot: 'Linden Vale', place: 'His lab', line: 'A Delta for a Delta. Study purposes.', sp: 'bulbasaur-delta', nat: 'modest', w: wt('any Delta or regional form', { regional: true }), ask: 'It came from a meadow that grew wrong. It thrives here. I\'d like to see yours.', only: 'delta-journal' },
  { n: 92, who: 'Delta keeper Ysella', ot: 'Ysella', place: 'A greenhouse', line: 'It doesn\'t fit here. It\'d fit with you.', sp: 'pikachu-delta', nat: 'timid', q: 'homesick', w: sp('a Pikachu', 'pikachu'), ask: 'It wants to see another sky.' },
  { n: 93, who: 'Marsh warden Idony', ot: 'Idony', place: 'The Hot Marsh', line: 'The marsh is warm again. This one wants to wander.', sp: 'wooper-delta', nat: 'relaxed', w: sp('a Wooper', 'wooper'), ask: 'It kept a fire lit for a year. It deserves a holiday.', only: 'marsh-vent' },
  { n: 94, who: 'The cove beachcomber', ot: 'the beachcomber', place: 'The Ditto Colony', line: 'One of the colony wants to leave.', sp: 'ditto-delta', nat: 'docile', w: sp('a Ditto', 'ditto'), ask: 'It wants to see what the rest of the world copies.', only: 'delta-ditto-colony' },
  { n: 95, who: 'The hill gran', ot: 'the hill gran', place: 'The Four Seasons hill', line: 'The season\'s one can go, if it wants.', sp: 'snorlax-delta', nat: 'relaxed', w: sp('a Snorlax', 'snorlax'), ask: 'It\'ll come back to sleep in its hollow. They always do.' },
  { n: 96, who: 'Delta researcher Ingram', ot: 'Ingram', place: 'A mobile lab', line: 'Rarer still. A Delta Muk form.', sp: 'muk-delta', nat: 'bold', w: sp('a Grimer', 'grimer'), ask: 'From the factory dump. It\'s clean now. Mostly.', only: 'delta-factory-dump' },
  // ---- Pool 13. Rival and Roster ----
  { n: 102, who: 'Youngster Joey', ot: 'Joey', place: 'The Rattata Club', line: 'Club rule: every member trades once.', sp: 'rattata', nat: 'jolly', q: 'show-off', marks: ['Rattata Club member'], w: any('any Pokémon (it joins the club)'), ask: 'Top percentage. Obviously.' },
  { n: 103, who: 'Gentleman Alfred', ot: 'Alfred', place: 'His cottage', line: 'I can\'t keep up with them all now.', sp: 'furfrou', nat: 'calm', marks: ['trimmed'], w: any('a Pokémon that will visit him'), ask: 'Visit. That\'s all I ask.',
    ret: 'Alfred\'s cottage, a region on. Tea in the good cups. Your old Pokémon is asleep on his feet, and he does not move them for an hour.' },
  { n: 105, who: 'Tuber Dot', ot: 'Dot', place: 'The pool', line: 'My Marill\'s grown up. It wants a big kid.', sp: 'azumarill', nat: 'jolly', q: 'gentle', w: wt('a Pokémon that likes swimming', { types: ['water'] }), ask: 'It held me up in the water. Now I can swim.' },
  // ---- Pool 14. Story Trades ----
  { n: 106, who: 'Imma', ot: 'Imma', place: 'Sorrel\'s Gym', line: 'Dad says I can trade my Elekid if it goes somewhere good.', sp: 'elekid', nat: 'hasty', q: 'show-off', w: wt('a Pokémon you won a badge with (Bond 3 or more)', { bond: 3 }), ask: 'I want something that\'s won a badge. For luck.', only: 'badge-challenged' },
  { n: 107, who: 'Tib', ot: 'Tib', place: 'The bridge', line: 'Trade? I want something that\'s been where you\'ve been.', sp: 'sentret', nat: 'jolly', marks: ['Tib\'s first Pokémon'], w: wt('a Pokémon that\'s been everywhere with you (Bond 4 or more)', { bond: 4 }), ask: 'So part of you comes with me.', only: 'apprentice-friend' },
  { n: 108, who: 'Nell', ot: 'Nell', place: 'The dock at midnight', line: 'I can\'t take two on the boat.', sp: 'sneasel', nat: 'jolly', marks: ['Nell\'s second Pokémon'], w: null, gift: true, ask: 'It never liked the team. It\'ll like you.', only: 'nobody-escaped',
    fourth: { label: 'Give something back.', text: 'You press one of yours into Nell\'s hands. She stares at it, then at you, and has to look at the water for a while.', trade: true } },
  { n: 109, who: 'Old Haddon', ot: 'Old Haddon', place: 'The ferry raft', line: 'Ferry Lotad wants to see the sea.', sp: 'lotad', nat: 'calm', q: 'old', w: ty('a Water-type to take the raft', 'water'), ask: 'Fifty years of the marsh. It\'s earned a bigger water.' },
  { n: 110, who: 'Della, Biscuit\'s owner', ot: 'Della', place: 'Her doorstep', line: 'Biscuit had puppies. One of them is very you.', sp: 'growlithe', nat: 'jolly', q: 'always-leads', marks: ['Biscuit\'s puppy'], w: any(), ask: 'It sits by the door when you\'re in town. It knows.' },
];

const pad = (n: number) => String(n).padStart(3, '0');
const TAKE = [
  (ot: string) => `${ot} holds the Ball a moment longer than needed, then lets go. The swap is made, both cards turned face-down.`,
  (ot: string) => `${ot} kneels to say goodbye first. Then the swap is made, gently, hand to hand.`,
  (ot: string) => `A handshake, two Balls passed across. ${ot} looks lighter and sadder at the same time.`,
];

function tradeEvent(r: Row): Json[] {
  const id = `trade-t${pad(r.n)}`;
  const key = `t${pad(r.n)}`;
  const gives = { species: r.sp, nature: r.nat, ...(r.q ? { quirk: r.q } : {}), marks: r.marks ?? [], ...(r.moves ? { moves: r.moves } : {}), ...(r.hidden ? { hidden: true } : {}), why: r.ask, ot: r.ot };
  const eff = (asked: boolean): Json => ({ kind: 'honestTrade', id: key, ...(r.w ? { wants: r.w } : {}), gives, ...(asked ? { askedFirst: true } : {}), ...(r.gift ? { gift: true } : {}) });
  const back = r.ret ? [{ kind: 'flag', key: `${key}-return`, stamp: 'region' }] : [];
  const take = TAKE[r.n % TAKE.length]!(r.ot);
  const choices: Json[] = [
    ch('Trade.', out(take, eff(false), ...(r.fourth?.flag ? [] : back))),
    ch('Ask about it.', out(`${r.ot}: "${r.ask}"`, flag(`asked-${key}`), stay(id))),
    ch('No thanks.', out(`"Another time, then." ${r.ot} keeps it close.`)),
  ];
  if (r.fourth) {
    const fx: Json[] = r.fourth.trade ? [r.gift ? { kind: 'honestTrade', id: `${key}-back`, wants: any(), gives, askedFirst: true } : eff(true)] : [];
    if (r.fourth.flag) fx.push({ kind: 'flag', key: r.fourth.flag, stamp: 'region' });
    fx.push(...(r.fourth.fx ?? []));
    choices.push(ch(r.fourth.label, out(r.fourth.text, ...fx)));
  }
  const events: Json[] = [{
    id, name: r.who, group: G,
    ...(r.only ? { requires: [flagIs(r.only)] } : {}),
    intro: `${r.place}. ${r.who}: "${r.line}" The Honest Trade Card is filled in, both sides.`,
    choices,
    remembers: [{ id: `${id}-asked`, when: [flagIs(`asked-${key}`)], notice: `${r.ot} has told you its story. It is looking at you now.`, hide: [0, 1],
      addChoices: [ch('Trade.', out(take, eff(true), ...(r.fourth?.flag ? [] : back)))] }],
  }];
  if (r.ret) {
    const when = r.fourth?.flag ?? `${key}-return`;
    events.push({
      id: `${id}-return`, name: r.who, group: G, callback: true,
      requires: [{ kind: 'flag', key: when, regionsAgo: 1 }],
      intro: r.ret,
      choices: [ch('Smile.', out('Some trades are the start of something. This was one.', ...(r.n === 7 ? rep(1) : [])))],
    });
  }
  return events;
}

export const EVENTS: Json[] = [
  ...ROWS.flatMap(tradeEvent),
  // T063: the Tauros has to respect your Pokémon first.
  {
    id: 'trade-t063', name: 'Ranch hand Bouncer', group: G,
    intro: 'A corral, the rails scarred. Ranch hand Bouncer: "It won\'t be ridden." The Tauros paws the dirt and watches your team, not you. The Honest Trade Card is filled in, both sides.',
    choices: [
      ch('Trade.', out('The Tauros walks over to the one that beat it and stands beside it like it has always been there. Bouncer tips his hat.', { kind: 'honestTrade', id: 't063', wants: any('a Pokémon it respects'), gives: { species: 'tauros', nature: 'adamant', quirk: 'bites-strangers', marks: [], why: 'It wants someone who\'ll battle, not ride.', ot: 'Bouncer' } }), { requires: [flagIs('t063-respect')] }),
      ch('Ask about it.', out('Bouncer: "It wants someone who\'ll battle, not ride."', stay('trade-t063'))),
      ch('No thanks.', out('"Didn\'t think so." Bouncer goes back to mending the rail.')),
      ch('Battle it first.', fight('One on one in the corral. The Tauros comes in head down, and does not stop until it is beaten.', trainer('Bouncer', { team: ['tauros'], size: 1, friendly: true, win: [flag('t063-respect')] }))),
    ],
  },
  // T080: the shiny hunter's three.
  {
    id: 'trade-t080', name: 'Shiny Hunter Olwen', group: G,
    intro: 'A hide in the long grass, a tired woman with a tally book. Shiny Hunter Olwen: "I\'m not trading a shiny. I\'m trading for one. Forty thousand encounters. I\'m tired. Pick any of my three."',
    choices: [
      ch('The Lapras.', out('Olwen holds your shiny up to the light and laughs, for the first time in years.', { kind: 'honestTrade', id: 't080-lapras', wants: wt('a shiny Pokémon', { shiny: true }), gives: { species: 'lapras', nature: 'calm', quirk: 'gentle', marks: [], why: 'Forty thousand encounters. I\'m tired. Trade me yours.', ot: 'Olwen' } })),
      ch('The Gible.', out('Olwen holds your shiny up to the light and laughs, for the first time in years.', { kind: 'honestTrade', id: 't080-gible', wants: wt('a shiny Pokémon', { shiny: true }), gives: { species: 'gible', nature: 'jolly', quirk: 'always-leads', marks: [], why: 'Forty thousand encounters. I\'m tired. Trade me yours.', ot: 'Olwen' } })),
      ch('The Riolu.', out('Olwen holds your shiny up to the light and laughs, for the first time in years.', { kind: 'honestTrade', id: 't080-riolu', wants: wt('a shiny Pokémon', { shiny: true }), gives: { species: 'riolu', nature: 'adamant', quirk: 'show-off', marks: [], why: 'Forty thousand encounters. I\'m tired. Trade me yours.', ot: 'Olwen' } })),
      ch('No thanks.', out('Olwen nods and goes back to the grass. Encounter forty thousand and one.')),
    ],
  },
  // T104: the twins, one trade each, together.
  {
    id: 'trade-t104', name: 'Twins Nia and Mia', group: G,
    intro: 'The street, two girls in matching coats. Twins Nia and Mia: "Trade with both of us! Same time!" A Plusle and a Minun, holding paws. The Honest Trade Card is filled in, both sides.',
    choices: [
      ch('Trade.', out('Nia takes your first and hands over Plusle. Mia is already holding out Minun, bouncing.', { kind: 'honestTrade', id: 't104', wants: any('two Pokémon of the same species'), gives: { species: 'plusle', nature: 'jolly', marks: ['a twin'], why: 'They\'re twins. They have to go together.', ot: 'Nia' } }, stay('trade-t104-mia'))),
      ch('Ask about it.', out('Nia and Mia, together: "They\'re twins. They have to go together."', stay('trade-t104'))),
      ch('No thanks.', out('"Awww." In perfect unison.')),
    ],
  },
  {
    id: 'trade-t104-mia', name: 'Twins Nia and Mia', group: G, room: true, callback: false,
    intro: 'Mia, holding out Minun with both hands: "Now me! Same species as the other one, please!" Plusle is already calling to it.',
    choices: [
      ch('Trade.', out('Minun leaps across to Plusle. The twins cheer. Two of yours go off arm in arm with two of theirs.', { kind: 'honestTrade', id: 't104-mia', wants: any('the twin of the one you gave Nia'), gives: { species: 'minun', nature: 'jolly', marks: ['a twin'], why: 'They\'re twins. They have to go together.', ot: 'Mia' } })),
      ch('Not this time.', out('Mia hugs Minun. Plusle looks back at it from your arms the whole way down the street.')),
    ],
  },
  // T110: Biscuit's puppy is a gift if Biscuit got home.
  // TRADES.md 4.3: Ivo's trade-back service, every region.
  {
    id: 'trade-back-service', name: 'The Trade-Back Service', group: G,
    intro: 'Hacker Ivo Ternary\'s café, a sign over the counter. Ivo: "Trade me a trade-evolver and I\'ll trade it straight back, evolved. Free. You can check my record."',
    choices: [
      ch('Trade it over.', out('Two clicks, a whirr, a flash. Ivo hands the Ball straight back. "As promised. Free."', { kind: 'tradeBack' })),
      ch('Check his record.', out('A logbook: forty years of trades, every one returned, every one signed. Ivo watches you read it, not offended in the slightest.', flag('ivo-checked'), stay('trade-back-service'))),
      ch('No thanks.', out('"Any time." Ivo goes back to his screens.', flag('ivo-refused'))),
    ],
    remembers: [{ id: 'ivo-jenny', when: [flagIs('ivo-refused', 3)], notice: 'Ivo sighs. "Fine. I\'ll do it in front of Officer Jenny." She is here, bored, eating a sandwich. It works.', hide: [2],
      addChoices: [ch('Trade it over, with Jenny watching.', out('Jenny watches the whole thing, chewing. "Huh," she says. "He did give it back."', { kind: 'tradeBack' }))] }],
  },
];

// T110's gift variant (Biscuit is home): added after the table so the shared builder stays simple.
const t110 = EVENTS.find((e) => e.id === 'trade-t110') as { remembers: Json[] };
t110.remembers.unshift({ id: 'trade-t110-home', when: [flagIs('dog-home')], notice: 'Della is smiling. "Biscuit\'s home because of you. The puppy\'s yours. No trade."', hide: [0],
  addChoices: [ch('Take the puppy.', out('The puppy is in your arms before Della finishes the sentence. Biscuit, on the step, thumps his tail.', { kind: 'honestTrade', id: 't110', gift: true, askedFirst: true, gives: { species: 'growlithe', nature: 'jolly', quirk: 'always-leads', marks: ['Biscuit\'s puppy'], why: 'It sits by the door when you\'re in town. It knows.', ot: 'Della' } }))] });
