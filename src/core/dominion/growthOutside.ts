// DOMINION D10 follow-up, part 2: what Growth adds to the street meetings (outside-interactions.md sections B Shops,
// C Police, D Gyms, E Trainers, H Labs, I Wild Pokémon, K Crime World; town.ts plays them, town.json says what each
// choice does) and the rival teams' moves against your Gym plans (rival actions 53, 62, 69, 79, 128; rivals.ts runs them).
// Numbers live in growth.json "rivalGym" and town.json "meet"; the words in growth.json "lines".
import { chairOf } from './chair';
import { courtOf } from './growthCourt';
import { DOMINION_DATA } from './data';
import { addActAfter, addCardGate, addCardHook, addHeat, districtDef, edgeXp } from './field';
import { addPart, gymDef, gymIn, growthOf, ownedGyms } from './growth';
import { setRivalKind } from './rivals';
import type { DominionBlock, GrowthState, StatId } from './schema';
import { setTownFx } from './town';
import { fill } from './worldTurn';
import { crewOf, rng } from './crew';

const G = () => DOMINION_DATA.growth;
const Ln = (k: string): string => G().lines[k] ?? k;
const round10 = (n: number): number => Math.round(n / 10) * 10;
const pretty = (id: string): string => id.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
const statName = (s: StatId): string => `${s[0]!.toUpperCase()}${s.slice(1)}`;

// ---------- street meetings: the Growth keys of a choice ----------

setTownFx((b, fx, district, seed) => {
  const bits: string[] = [];
  const g = growthOf(b);
  const gym = gymIn(district);
  const mine = gym ? ownedGyms(b).includes(gym.id) : false;
  if (fx.racket) {
    const F = DOMINION_DATA.field;
    const t = districtDef(district)?.targets.find((x) => ['shop', 'street', 'crowd', 'dock', 'center'].includes(x.kind) && !b.field.rackets.some((k) => k.target === x.id));
    if (t) {
      const n = Math.round((F.play.extort?.weekly ?? 100) * t.pay);
      b.field.rackets.push({ target: t.id, district, weekly: n, day: b.day, kind: 'racket' });
      bits.push(fill(Ln('townRacket'), { name: t.name, n }));
    } else bits.push(Ln('townNoRacket'));
  }
  if (fx.route) {
    if (g.routes.some((r) => r.to === district)) bits.push(Ln('townRouteHave'));
    else {
      const n = round10((G().smuggle.nightly[0] + G().smuggle.nightly[1]) / 2);
      g.routes.push({ to: district, nightly: n, day: b.day });
      bits.push(fill(Ln('townRoute'), { n }));
    }
  }
  if (fx.contact) {
    const s = G().specialists.find((x) => x.id === fx.contact);
    if (s && !g.contacts.includes(s.id)) {
      g.contacts.push(s.id);
      bits.push(fill(Ln('townContact'), { name: s.name[0]!.toUpperCase() + s.name.slice(1) }));
    }
  }
  if ((fx.gymScout || fx.ally || fx.shaken) && !gym) bits.push(Ln('townNoGym'));
  if (gym && fx.gymScout && !mine) {
    g.gymScout[gym.id] = (g.gymScout[gym.id] ?? 0) + 1;
    bits.push(fill(Ln('townGymScout'), { leader: gym.leader, n: g.gymScout[gym.id]!, need: G().gym.blackmailScouts }));
  }
  if (gym && fx.ally) {
    if (!g.courted.includes(gym.id)) g.courted.push(gym.id);
    if (g.foes) delete g.foes.cold[gym.id];
    bits.push(fill(Ln('townAlly'), { leader: gym.leader }));
  }
  if (gym && fx.shaken) {
    g.shaken[gym.id] = b.day + G().gym.shakenDays;
    bits.push(fill(Ln('townShaken'), { leader: gym.leader, day: g.shaken[gym.id]! }));
  }
  if (fx.papers) {
    g.papers = Math.max(0, g.papers + fx.papers);
    bits.push(fill(Ln('townPapers'), { n: fx.papers }));
  }
  if (fx.edge) {
    const n = DOMINION_DATA.town.meet.edge;
    bits.push(`Boss ${statName(fx.edge)} XP +${n}`);
    const up = edgeXp(b.field, fx.edge, n);
    if (up) bits.push(up);
  }
  if (fx.item) {
    chairOf(b).give.push({ k: 'item', id: fx.item, n: 1, held: false });
    bits.push(fill(Ln('townItem'), { item: pretty(fx.item) }));
  }
  if (fx.mon) {
    const pool = DOMINION_DATA.crew.pools[DOMINION_DATA.start.start.region.toLowerCase()]?.catch ?? ['rattata'];
    const species = fx.mon === 'local' ? pool[rng(seed, 'dominion-town-mon', b.day, district).int(0, pool.length - 1)]! : fx.mon;
    chairOf(b).give.push({ k: 'mon', species, level: Math.max(5, b.levelCap - DOMINION_DATA.town.meet.monBelow), member: null });
    bits.push(fill(Ln('townMon'), { mon: pretty(species) }));
  }
  if (fx.sell) {
    if (Object.keys(g.hot).length) {
      courtOf(b).sell.push(fx.sell);
      bits.push(fill(Ln('townSell'), { pct: fx.sell }));
    } else bits.push(Ln('courtFenceNone'));
  }
  if (fx.safehouse && !g.safehouses.includes(district)) {
    g.safehouses.push(district);
    bits.push(Ln('townSafehouse'));
  }
  if (fx.heist) {
    courtOf(b).heist += 1;
    bits.push(Ln('townHeist'));
  }
  if (fx.dirt) {
    const key = gym && !mine ? gym.id : district;
    if (!g.dirt.includes(key)) g.dirt.push(key);
    if (gym && !mine) g.gymScout[gym.id] = (g.gymScout[gym.id] ?? 0) + 1;
    bits.push(Ln('townDirt'));
  }
  if (fx.cover) {
    g.bribed[district] = Math.max(g.bribed[district] ?? 0, b.day + fx.cover);
    if (b.field.patrol === district) b.field.patrol = null;
    bits.push(fill(Ln('townCover'), { day: g.bribed[district]! }));
  }
  if (fx.tip) {
    const c = courtOf(b);
    c.tip = Math.max(c.tip, b.day + fx.tip);
    bits.push(fill(Ln('townTip'), { day: c.tip }));
  }
  if (fx.free) {
    const m = b.members.find((x) => crewOf(x).out?.why === 'jail');
    if (m) {
      m.crew = { ...crewOf(m), out: null };
      bits.push(fill(Ln('townFree'), { member: m.name }));
    }
  }
  return bits;
});

// ---------- the rival teams' Gym moves ----------

type Foes = NonNullable<GrowthState['foes']>;
const foesOf = (b: DominionBlock): Foes => (growthOf(b).foes ??= { cold: {}, refuse: {}, annex: {}, weak: {} });
const R = () => G().rivalGym;
/** Gyms the Boss could still take, in a fixed order. */
const open = (b: DominionBlock): string[] => G().gyms.map((x) => x.id).filter((id) => !ownedGyms(b).includes(id));
/** Gyms where the Boss has a way in (a Leader courted, not yet taken). */
const allies = (b: DominionBlock): string[] => open(b).filter((id) => (b.growth?.courted ?? []).includes(id));
/** Which Gym a rival goes after: one you court first, then the one you've scouted most, else any you could take. */
function aim(b: DominionBlock, pick: (n: number) => number, ally = false): string | null {
  const a = allies(b);
  if (a.length) return a[pick(a.length)]!;
  if (ally) return null;
  const o = open(b);
  if (!o.length) return null;
  const s = b.growth?.gymScout ?? {};
  const best = Math.max(...o.map((id) => s[id] ?? 0));
  const top = o.filter((id) => (s[id] ?? 0) === best);
  return top[pick(top.length)]!;
}
const leaderOf = (id: string): string => gymDef(id)?.leader ?? 'The Leader';

setRivalKind('gymSmear', (c) => {
  const id = aim(c.b, (n) => c.r.int(0, n - 1));
  if (!id) return null;
  const f = foesOf(c.b);
  f.cold[id] = (f.cold[id] ?? 0) + c.num('R');
  return fill(Ln('gymSmear'), { ...c.v, leader: leaderOf(id), n: f.cold[id]! * R().coldPer });
}, (b) => open(b).length > 0);

setRivalKind('gymRefuse', (c) => {
  const id = aim(c.b, (n) => c.r.int(0, n - 1));
  if (!id) return null;
  const f = foesOf(c.b);
  const day = c.b.day + c.num('D') * DOMINION_DATA.start.clock.weekLength;
  f.refuse[id] = Math.max(f.refuse[id] ?? 0, day);
  return fill(Ln('gymRefuse'), { ...c.v, leader: leaderOf(id), day: f.refuse[id]! });
}, (b) => open(b).length > 0);

setRivalKind('gymFrame', (c) => {
  const id = aim(c.b, (n) => c.r.int(0, n - 1), true);
  if (!id) return null;
  const g = growthOf(c.b);
  g.courted = g.courted.filter((x) => x !== id);
  const n = c.num('H');
  const d = gymDef(id)?.district;
  if (d) addHeat(c.b, d, n);
  return fill(Ln('gymFrame'), { ...c.v, leader: leaderOf(id), n });
}, (b) => allies(b).length > 0);

setRivalKind('gymAnnex', (c) => {
  const id = aim(c.b, (n) => c.r.int(0, n - 1));
  if (!id) return null;
  const f = foesOf(c.b);
  f.annex[id] = Math.max(f.annex[id] ?? 0, c.num('R'));
  const d = gymDef(id)?.district ?? '';
  const ds = c.b.field.districts[d];
  if (ds) ds.rival = Math.min(100, ds.rival + f.annex[id]!);
  return fill(Ln('gymAnnex'), { ...c.v, district: districtDef(d)?.name ?? d, n: f.annex[id]!, pct: f.annex[id]! * R().annexPer });
}, (b) => open(b).length > 0);

setRivalKind('gymWeaken', (c) => {
  const id = aim(c.b, (n) => c.r.int(0, n - 1), true);
  if (!id) return null;
  const f = foesOf(c.b);
  const day = c.b.day + R().weakDays;
  const n = c.num('P');
  f.weak[id] = [day, n];
  const d = gymDef(id)?.district;
  if (d) addHeat(c.b, d, c.num('H'));
  return fill(Ln('gymWeaken'), { ...c.v, leader: leaderOf(id), n, day });
}, (b) => allies(b).length > 0);

/** The team that holds the most sway in a Gym's town (for the lines); the first rival here otherwise. */
const teamName = (b: DominionBlock): string => {
  const t = DOMINION_DATA.rivals.teams.find((x) => x.on && x.region === DOMINION_DATA.rivals.region && b.rivals?.teams[x.id]);
  return t?.name ?? 'A rival team';
};

// What they did shows on the Gym Takeover's Card: lower odds, a Leader who won't see you, more scouting for Blackmail.
addCardHook((b, _run, c) => {
  if (c.play?.effect !== 'gym' || !c.roll) return;
  const gym = gymIn(c.district.id);
  const f = b.growth?.foes;
  if (!gym || !f || ownedGyms(b).includes(gym.id)) return;
  if (f.cold[gym.id]) addPart(c, Ln('coldOdds'), -f.cold[gym.id]! * R().coldPer);
  if (f.annex[gym.id]) addPart(c, Ln('annexOdds'), -f.annex[gym.id]! * R().annexPer);
  const w = f.weak[gym.id];
  if (w && w[0] >= b.day) addPart(c, Ln('weakOdds'), -w[1]);
});
addCardGate((b, _run, c) => {
  if (c.play?.effect !== 'gym') return null;
  const gym = gymIn(c.district.id);
  const f = b.growth?.foes;
  if (!gym || !f || ownedGyms(b).includes(gym.id)) return null;
  const until = f.refuse[gym.id] ?? 0;
  if (until >= b.day) return fill(Ln('gymRefused'), { leader: gym.leader, day: until, team: teamName(b) });
  const more = f.annex[gym.id] ?? 0;
  const have = b.growth?.gymScout[gym.id] ?? 0;
  if (c.opt === 'blackmail' && more && have >= G().gym.blackmailScouts && have < G().gym.blackmailScouts + more) {
    return fill(Ln('gymAnnexed'), { n: G().gym.blackmailScouts + more - have, district: c.district.name, team: teamName(b) });
  }
  return null;
});
// Courting the Leader again wins back their opinion of you (a smear wears off).
addActAfter((b, x, play) => {
  if (play.effect !== 'gymCourt') return [];
  const gym = gymIn(x.district);
  if (gym && b.growth?.foes) delete b.growth.foes.cold[gym.id];
  return [];
});
