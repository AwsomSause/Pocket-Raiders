// One-off: reads the Story Overhaul design doc (Parts IV-A to IV-D) and writes src/data/story/circuitCast.json.
//   node tools/story/build-circuit-cast.mjs <path to Story_Overhaul_Design_v2.md>
// The JSON is the committed source of truth; this script only documents where it came from.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const doc = readFileSync(process.argv[2], 'utf8').split('\n');
const out = join(import.meta.dirname, '..', '..', 'src', 'data', 'story', 'circuitCast.json');
const at = (re, from = 0) => doc.findIndex((l, i) => i >= from && re.test(l));
const rows = (from, to) => doc.slice(from, to).filter((l) => /^\|/.test(l) && !/^\|[-| ]+\|$/.test(l)).slice(1).map((l) => l.split('|').slice(1, -1).map((c) => c.trim()));
const unq = (s) => s.replace(/^["“]|["”]$/g, '').replace(/`/g, '');
const slug = (s) => s.toLowerCase().replace(/^(captain|dr\.|brother|sister)\s+/, '').split(/\s+/)[0].replace(/[^a-z]/g, '');

// ---- badge map and town table
const bm = at(/^### Badge map/);
const badgeRows = rows(bm, at(/^### Cairnmoor/)).map(([name, town, type, icon, badge]) => ({ name, town, type: type.toLowerCase(), icon: icon.replace(/`/g, ''), badge }));
const rs = at(/^### Region stage map/);
const townRows = rows(rs, at(/^### How six-of-eight/)).map(([region, stage, town, fork, act]) => ({ region, stage, town: town.replace(/ \(then Region Gate\)/, ''), gate: /Region Gate/.test(town), fork, act: Number(act) || null }));
const regionStart = { Cairnmoor: 0, Tidewrack: 1, Orrery: 2 };
const towns = townRows.filter((t) => t.region in regionStart).map((t) => {
  const n = Number(String(t.stage).match(/^\d+/)[0]);
  const region = regionStart[t.region];
  const forkNames = /pool/.test(t.fork) ? [] : t.fork.split(/ or /).map((n2) => n2.trim());
  return { region, stage: n, town: t.town, regionGate: t.gate, act: t.act, authored: forkNames, pool: forkNames.length === 0 };
});
const townOf = Object.fromEntries(badgeRows.map((b) => [b.name, b.town]));

// ---- leaders
const leaders = [];
let regionIdx = -1;
doc.forEach((l, i) => {
  if (i < bm || i > at(/^## Part IV-B/)) return;
  if (/^### Cairnmoor/.test(l)) regionIdx = 0; else if (/^### Tidewrack/.test(l)) regionIdx = 1; else if (/^### Orrery/.test(l)) regionIdx = 2;
  const m = l.match(/^#### (.+), (\w+) \(`sc_gl_(\w+)`, "(.+)"\)/);
  if (!m) return;
  const end = at(/^(#### |### |## )/, i + 1);
  const block = doc.slice(i + 1, end);
  const bullet = (k) => (block.find((x) => x.startsWith(`- ${k}`)) ?? '').replace(new RegExp(`^- ${k}[^:]*:\\s*`), '').trim();
  const setting = (block.find((x) => x.startsWith('Setting:')) ?? '').replace('Setting: ', '');
  const lines = block.filter((x) => x.startsWith('> ')).map((x) => x.slice(2).replace(/^\w+:\s*/, ''));
  const choices = block.filter((x) => /^\|/.test(x) && !/^\|[-| ]+\|$/.test(x)).slice(1).map((x) => { const c = x.split('|').slice(1, -1).map((s) => s.trim()); return { label: unq(c[0]), outcome: c[1] }; });
  const likes = bullet('Likes'); const [likesText, dislikesText = ''] = likes.split(/ Dislikes: /);
  const bmr = badgeRows.find((b) => b.name === m[1].replace(/^Captain /, ''));
  leaders.push({
    id: m[3], name: m[1], region: regionIdx, type: m[2].toLowerCase(), town: bmr.town, badge: bmr.badge, badgeIcon: bmr.icon,
    scene: { id: `sc_gl_${m[3]}`, title: m[4], setting, lines, choices },
    pre: unq(bullet('Pre')), mid: unq(bullet('Mid')), win: unq(bullet('Win')), lose: unq(bullet('Lose')),
    likes: likesText.replace(/\.$/, '').split(', '), dislikes: dislikesText.replace(/\.$/, '').split(', ').filter(Boolean),
    badgeStory: bullet('Badge story'),
  });
});

// ---- persona table (Part III "The original roster")
const ro = at(/^### The original roster/);
const persona = {};
for (const r of rows(ro, at(/^### Leader-to-leader links/)).concat([])) { /* header rows repeat per region; handled below */ }
for (let i = ro; i < at(/^### Leader-to-leader links/); i++) {
  const m = doc[i].match(/^\| (.+?), (\d+) \| (\w+), (.+?) \| (.+?) \| (.+?) \| (.+?) \| (.+?) \|$/);
  if (m) persona[m[1].replace(/^Captain /, '')] = { age: Number(m[2]), persona: m[5], ace: m[6].toLowerCase(), conflict: m[7], hook: m[8] };
}
for (const l of leaders) Object.assign(l, persona[l.name.replace(/^Captain /, '')]);

// ---- Elite Four, Champion, Ashdown
const fieldTable = (from) => { const o = {}; for (const [k, v] of rows(from, at(/^(### |---)/, from + 1))) o[k] = v; return o; };
const profiles = [];
doc.forEach((l, i) => {
  const m = l.match(/^### (.+?), (Elite \d), "the (.+)" \((\d+), (.+)\)/) ?? l.match(/^### (Selene Aurelian), (Champion) \((\d+), (.+)\)/) ?? l.match(/^### (Cornelius Ashdown), (Gilt Circle leader) \(about (\d+), (.+)\)/);
  if (!m || i < at(/^## Part IV-B/) || i > at(/^## Part IV-C/)) return;
  const f = fieldTable(i + 1);
  const elite = /Elite/.test(m[2]);
  profiles.push({
    id: slug(m[1]), name: m[1], role: elite ? 'elite' : m[2] === 'Champion' ? 'champion' : 'villain', slot: elite ? Number(m[2].slice(-1)) : 0,
    epithet: elite ? m[3] : '', age: Number(elite ? m[4] : m[3]), types: (elite ? m[5] : m[4]).toLowerCase().split(/ and |, /).map((t) => t.replace(/[^a-z]/g, '')).filter(Boolean),
    visual: f['Visual identity'], personality: f['Personality'], motivation: f['Motivation'], strategy: f['Battle strategy'], ace: f['Signature Pokémon'],
    relationships: f['Relationships'], history: f['History'], conflict: f['Personal conflict'], arc: f['Arc'], scenes: (f['Interactions'] ?? '').split('; '), independent: f['Independent action'],
  });
});

// ---- teams, lieutenants, leaders, grunts
const c0 = at(/^## Part IV-C/);
const TEAMS = { 'Mythic Marauders': 'mm', 'Hollow Choir': 'hc', 'Ironvein Combine': 'ic', 'Pale Cartographers': 'pc', 'Wildfire Accord': 'wa', 'Gilt Circle': 'gc' };
const NAME_TEAM = { Alaric: 'Ironvein Combine', Thessaly: 'Wildfire Accord', Cornelius: 'Gilt Circle' };
const teamIdOf0 = (t) =>  Object.keys(TEAMS).find((k) => t.includes(k) || (k === 'Ironvein Combine' && /Greenwall|Chairwoman/.test(t)) || (k === 'Hollow Choir' && /Cantor/.test(t)) || (k === 'Pale Cartographers' && /Surveyor/.test(t)));
const teamIdOf = (t) => NAME_TEAM[t.split(' ')[0]] ?? teamIdOf0(t);
const member = (kind) => ([who, motivation, sig, scene, turn]) => {
  const [name, ...rest] = who.split(', ');
  const m = sig.match(/^(\w+) "(.+)"$/);
  const team = teamIdOf(name + ' ' + rest.join(', '));
  return { id: `tm_${TEAMS[team] ?? 'x'}_${slug(name)}`, name, team: TEAMS[team] ?? null, kind, title: kind === 'leader' ? rest.join(', ') : '', motivation, signature: m ? { species: m[1].toLowerCase(), nickname: m[2] } : { species: sig.toLowerCase(), nickname: '' }, scene, turn };
};
const lieutenants = rows(at(/^### Lieutenants/, c0), at(/^### Team leaders/, c0)).filter((r) => !r[0].startsWith('Anselm Rook')).map(member('lieutenant'));
const teamLeaders = rows(at(/^### Team leaders/, c0), at(/^### Grunt line/, c0)).map(member('leader'));
const grunts = [];
let team = null;
for (let i = at(/^### Grunt line/, c0); i < at(/^## Part IV-D/); i++) {
  const h = doc[i].match(/^#### (.+?) \(/);
  if (h) team = TEAMS[h[1]];
  const m = doc[i].match(/^\| (\w+_g\d) \| (\w+) \| "(.+)" \|$/);
  if (m) grunts.push({ id: m[1], team, key: m[2], line: m[3] });
}

// ---- overlays
const ov = at(/^### Overlay mode/);
const overlays = rows(ov, ov + 14).filter((r) => /`/.test(r[0])).map(([who, persona, hook, linked, line]) => {
  const m = who.match(/^(.+) \(`(.+)`, (.+)\)$/);
  return { id: m[2], name: m[1], region: m[3], persona, conflict: hook, linked, line: unq(line) };
});

const SPRITE = {
  odette: 'boss.drive/alolan-usum-veteran-woman', wick: 'boss.drive/alolan-usum-veteran-man', sigrid: 'trainer.pr/snow_worker_f', tam: 'boss.drive/kantoian-lgpe-gambler',
  vesper: 'boss.drive/fan-calvin', dunstan: 'boss.drive/rancher', tolliver: 'boss.drive/galarian-swsh-post-man', lark: 'boss.drive/skytrainer-f',
  anneliese: 'boss.drive/galarian-swsh-doctor-woman', mirabel: 'boss.drive/alolan-usum-madame', rhodri: 'boss.drive/paldean-sv-dragon-tamer', perpetua: 'boss.drive/lady2',
  linnea: 'boss.drive/kaloian-xy-scientist-woman', gaspard: 'boss.drive/kaloian-xy-owner', ottilie: 'boss.drive/kaloian-xy-technical-worker', maren: 'trainer.pr/mela',
  hesper: 'boss.drive/hubian-pokengine-gardener', bramble: 'boss.drive/gardener',
  isadora: 'boss.drive/fennel', kofi: 'boss.drive/paldean-sv-black-belt', brigid: 'boss.drive/kaloian-xy-veteran-woman', aurelio: 'boss.drive/hoennian-oras-dragon-tamer',
  selene: 'boss.drive/champion-f', cornelius: 'boss.drive/butler',
  maelis: 'boss.drive/johtoian-hgss-sage', leocadia: 'boss.drive/paldean-sv-ace-trainer-woman', anselm: 'boss.drive/paldean-sv-scientist', thessaly: 'boss.drive/oerrian-colo-mirrorb-peon-folly',
  cull: 'trainer.pr/zinzolin', pennant: 'boss.drive/kaloian-xy-maid', alaric: 'trainer.drive/clerk2-m', brook: 'boss.drive/galarian-swsh-worker-man',
  bettina: 'boss.drive/fan-chelsea', corwin: 'boss.drive/hoennian-oras-fisher-man', joss: 'boss.drive/alolan-usum-punk-guy', pilar: 'boss.drive/fan-naomi',
  lucia: 'boss.drive/paldean-sv-office-worker-woman', piers: 'boss.drive/kantoian-lgpe-gym-guide',
};
// Signature Pokémon, ace first (the boss-team builder fills the rest of each team from the boss's types).
const SIG = {
  odette: ['rhyperior', 'golem', 'tyranitar', 'terrakion'], wick: ['dusknoir', 'mismagius', 'chandelure', 'gengar'], sigrid: ['mamoswine', 'glaceon', 'weavile', 'abomasnow'],
  tam: ['machamp', 'hitmontop', 'lucario', 'conkeldurr'], vesper: ['weavile', 'umbreon', 'sneasel', 'honchkrow'], dunstan: ['excadrill', 'garchomp', 'donphan', 'gliscor'],
  tolliver: ['gyarados', 'pelipper', 'milotic', 'kingdra'], lark: ['altaria', 'staraptor', 'skarmory', 'pidgeot'], anneliese: ['magnezone', 'electivire', 'rotom', 'luxray'],
  mirabel: ['toxapex', 'gengar', 'crobat', 'drapion'], rhodri: ['dragonite', 'haxorus', 'kingdra', 'goodra'], perpetua: ['gardevoir', 'togekiss', 'clefable', 'sylveon'],
  linnea: ['alakazam', 'espeon', 'reuniclus', 'bronzong'], gaspard: ['blissey', 'snorlax', 'tauros', 'ambipom'], ottilie: ['empoleon', 'bastiodon', 'scizor', 'magnezone'],
  maren: ['magmortar', 'arcanine', 'typhlosion', 'rapidash'], hesper: ['volcarona', 'scizor', 'heracross', 'butterfree'], bramble: ['torterra', 'venusaur', 'roserade', 'ludicolo'],
  isadora: ['spiritomb', 'dusknoir', 'froslass', 'banette'], kofi: ['lucario', 'machamp', 'hitmonlee', 'conkeldurr'], brigid: ['lapras', 'glaceon', 'vaporeon', 'walrein'],
  aurelio: ['salamence', 'garchomp', 'dragonite', 'haxorus'], selene: ['togekiss', 'gardevoir', 'lucario', 'milotic', 'garchomp', 'snorlax'], cornelius: ['arcanine', 'persian', 'weavile', 'tyranitar'],
};
leaders.find((l) => l.id === 'lark').ace = 'altaria'; // the doc's "Tempestwing" is not a species
const ash = profiles.find((e) => e.role === 'villain'); ash.types = ['fire'];
profiles.find((e) => e.role === 'champion').types = ['fairy']; // "balanced and adaptive": Togekiss ace
for (const l of leaders) { l.sprite = SPRITE[l.id]; l.signature = SIG[l.id]; }
for (const e of profiles) { e.sprite = SPRITE[e.id]; e.signature = SIG[e.id]; }
for (const t of [...lieutenants, ...teamLeaders]) t.sprite = SPRITE[t.id.split('_').pop()];

const data = {
  v: 1,
  source: 'Story_Overhaul_Design_v2.md Parts IV-A to IV-D (2026-11-06)',
  towns, leaders,
  elite: profiles.filter((p) => p.role === 'elite'),
  champion: profiles.find((p) => p.role === 'champion'),
  ashdown: profiles.find((p) => p.role === 'villain'),
  teams: Object.entries(TEAMS).map(([name, id]) => ({ id, name })),
  teamLeaders, lieutenants, grunts, overlays,
};
writeFileSync(out, JSON.stringify(data, null, 1) + '\n');
console.log(Object.fromEntries(Object.entries(data).map(([k, v]) => [k, Array.isArray(v) ? v.length : typeof v])));
