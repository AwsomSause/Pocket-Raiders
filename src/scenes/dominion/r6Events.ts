// DOMINION redesign R6: the street meeting (core/dominion/town.ts) played as an event in four beats: Talk, Choose,
// Result and Reward, with the Text log on L. Answers go through GameSession.dominionStep({ t: 'townMeet' }); the pages
// only show what the meeting and the answer said. Event rule: each text stays until a key press, and the reward shows
// only after the result's text is closed.

import type Phaser from 'phaser';
import { crewOf, rankWord } from '../../core/dominion/crew';
import { meetModel, type MeetModel } from '../../core/dominion/town';
import type { DominionBlock, Member } from '../../core/dominion/schema';
import { DOMINION_DATA } from '../../core/dominion/data';
import { services } from '../../game/services';
import type { InputAction } from '../../ui/input';
import { LOG_ROWS, r5EvChoose, r5Press, r5EvLog, r5EvResult, r5EvReward, r5EvTalk, type R5Actor, type R5EvChoice, type R5RewardCard, type R5Said } from '../../ui/redux/screens/dominion/r50/events';
import { PCOL } from '../../ui/redux/screens/dominion/r50/kit';
import { facePic, r5Run } from './r50Bridge';
import { personPic } from './r6Pokemon';

type Beat = 'talk' | 'choose' | 'result' | 'reward';

/** Who a meeting is with, to a mockup sprite (the person's job). Anyone else is a passer-by. */
const WHO: readonly [RegExp, string][] = [
  [/jenny|cop|officer|police|guard|inspector|houndour \(police\)/i, 't-policeman'],
  [/looker|detective|agent|tail|snitch|spy/i, 't-looker'],
  [/scientist|professor|lab|researcher|curator|museum|astronomer|medic|nurse|pharmacist/i, 't-sci'],
  [/gentleman|banker|rich|landlord|collector|jeweller|antique|concierge|lady|mayor|councilor|candidate|official|attorney|judge|lawyer|executive/i, 't-rich'],
  [/reporter|camera|editor|columnist|radio|pollster|spokesperson|clerk|shopkeeper|vendor|cashier|manager|host|staff|auctioneer|pawnbroker|tailor|baker|cook|florist|hairdresser|bartender/i, 't-clerk'],
  [/biker|brawler|gang|criminal|smuggler|fence|forger|ex-con|crew leader|assassin|blackmailer|pickpocket|gambler|driver/i, 't-biker'],
  [/psychic|hex|cabal/i, 't-hex'],
  [/hiker|traveler|tourist|camper|picnicker|miners|ranger|fisherman|sailor|swimmer|skier|backpacker/i, 't-backpacker'],
  [/leader|gym|e4|champion|ace|trainer|black belt|cooltrainer|veteran|breeder/i, 't-acetrainer-m'],
  [/worker|mechanic|dock|delivery|janitor/i, 't-janitor'],
  [/old lady|mother|villagers|citizens|gossips|teacher|kimono/i, 't-kimono'],
];
export const whoSprite = (who: string): string => WHO.find(([re]) => re.test(who))?.[1] ?? 't-applicant';

/** A media meeting (outside.json section J: a reporter, a camera crew, the radio) is asked on camera: the press page. */
export const isPress = (m: Pick<MeetModel, 'section' | 'who'>): boolean => m.section === 'J' && /reporter|camera|radio|spokes|news|editor|columnist|pollster/i.test(m.who);

const STAT_WORD = (s: string): string => s[0]!.toUpperCase() + s.slice(1);
const nice = (s: string): string => s.replace(/\bRg\b\s*/g, 'Regard ').replace(/\bDr\b\s*/g, 'Dread ').replace(/\bH([+−-])/g, 'Heat $1').replace(/₽([+−-])/g, '$1₽').replace(/\s+/g, ' ').trim();

/** A reward line from the answer ("Regard +3", "+₽80", "a new lead") as a card. */
function card(bit: string): R5RewardCard {
  const m = /^(.*?)\s*([+−-]\d+)$/.exec(bit);
  const title = m ? m[1]! : bit;
  const sub = m ? m[2]! : '';
  const t = title.toLowerCase();
  const icon = /₽/.test(bit) ? 'g-amulet-coin' : /regard/.test(t) ? 'g-relic-crown' : /dread/.test(t) ? 'bd-dark' : /heat|wanted/.test(t) ? 'bd-fire' : /control|scouted/.test(t) ? 'g-town-map'
    : /morale|crew/.test(t) ? 'g-idcard' : /tension|plan|spy|rival/.test(t) ? 'g-scope-lens' : /lead/.test(t) ? 'g-letter' : /hero/.test(t) ? 'g-black-belt' : 'g-star-piece';
  return { icon, title: title.charAt(0).toUpperCase() + title.slice(1), sub };
}

export class EventPages {
  private beat: Beat | null = null;
  private at = 0;
  private log = false;
  private logFirst = 0;
  private said: R5Said[] = [];
  /** The meeting as it was (kept after the answer clears it from the block). */
  private meet: MeetModel | null = null;
  private crewId: string | null = null;
  private out: { label: string; ok: boolean | null; roll: { r: number; chance: number } | null; stat: string | null; best: number; bits: string[]; line: string } | null = null;
  private problem: string | null = null;

  constructor(private readonly scene: Phaser.Scene, private readonly host: { refresh(): void; fight(): void; block(): DominionBlock | null; onMap(): boolean }) {}

  /** A meeting waits on the map (Talk, Choose), or its result and reward are still showing. */
  owns(): boolean {
    if (!this.host.onMap()) return false;
    if (this.beat === 'result' || this.beat === 'reward') return true;
    const b = this.host.block();
    const m = b ? meetModel(b) : null;
    if (!m) {
      this.beat = null;
      return false;
    }
    if (!this.beat || this.meet?.row !== m.row) this.begin(b!, m);
    return true;
  }

  private begin(b: DominionBlock, m: MeetModel): void {
    // The press asks its question and waits for the answer on one page (mockup `press`).
    this.beat = isPress(m) ? 'choose' : 'talk';
    this.meet = m;
    this.at = 0;
    this.log = false;
    this.problem = null;
    this.out = null;
    // The member who does the talking: the best at the first check, else the first one in.
    const stat = m.odds.find((o) => o.stat)?.stat ?? null;
    const crew = b.members.filter((x) => !crewOf(x).out);
    const best = stat ? [...crew].sort((a, c) => c.stats[stat] - a.stats[stat])[0] : crew[0];
    this.crewId = best?.id ?? null;
    this.said = [{ who: this.left(m), text: m.what }];
  }

  private left(m: MeetModel): R5Actor {
    const k = whoSprite(m.who);
    return { k, name: m.who, sub: m.district, colour: PCOL[k] ?? '#c9a24a' };
  }
  private member(b: DominionBlock): Member | undefined {
    return b.members.find((x) => x.id === this.crewId) ?? b.members[0];
  }
  private crew(b: DominionBlock): R5Actor | null {
    const m = this.member(b);
    if (!m) return null;
    return { html: personPic(m.look, b, 250).replace('class="px"', 'class="px flip"'), face: facePic(m.look, b), name: m.name, sub: rankWord(m.rank).toLowerCase().replace(/(^|\s)\S/g, (x) => x.toUpperCase()), colour: '#e0901c' };
  }
  private boss(): R5Actor {
    return { k: 't-natebig', name: 'The Boss', sub: 'You', colour: '#e0294a' };
  }

  private choices(m: MeetModel): R5EvChoice[] {
    return m.choices.map((c, i) => {
      const o = m.odds[i]!;
      const label = c.replace(/\s*\(.*$/, '').trim();
      const paren = /\((.*)\)/.exec(c)?.[1];
      const note = paren ? nice(paren) : o.fight ? 'Someone squares up' : o.stat ? `A ${STAT_WORD(o.stat)} check${o.money > 0 ? ` · +₽${o.money} if it works` : ''}` : 'Nothing is rolled';
      const icon = o.fight ? 'g-black-belt' : o.stat ? 'g-scope-lens' : o.money ? 'g-amulet-coin' : 'g-letter';
      const chance = o.chance === null ? '100%' : `${o.chance}%`;
      const how = o.fight ? 'Fight' : o.stat ? `${STAT_WORD(o.stat)} ${o.best}` : 'No roll';
      return { label, note, icon, chance, how };
    });
  }

  render(): string {
    const b = this.host.block();
    const m = this.meet;
    if (!b || !m) return '';
    const run = { ...r5Run(this.scene, b), place: m.district };
    const left = this.left(m);
    if (this.log) {
      const n = this.said.length;
      this.logFirst = Math.max(0, Math.min(this.logFirst, n - LOG_ROWS));
      return r5EvLog({ lines: this.said, first: this.logFirst, where: `Street event · ${m.district}` }, run);
    }
    if (this.beat === 'talk') return r5EvTalk({ left, right: this.crew(b), line: m.what }, run);
    if (this.beat === 'choose' && isPress(m)) {
      const ask = this.problem ?? (DOMINION_DATA.town.lines.pressAsk ?? '{what}').replace('{district}', m.district).replace('{what}', m.what);
      const fx = (c: string): string => nice(/\((.*)\)/.exec(c)?.[1] ?? '');
      return r5Press({ left: this.boss(), right: { ...left, sub: m.district }, line: ask, choices: m.choices.map((c) => ({ label: c.replace(/\s*\(.*$/, '').trim(), fx: fx(c) })), at: this.at }, run);
    }
    if (this.beat === 'choose') {
      const crew = this.crew(b);
      const line = this.problem ?? DOMINION_DATA.town.lines.crewSays ?? 'Your call, Boss.';
      return r5EvChoose({ left, crew, line, choices: this.choices(m), at: this.at }, run);
    }
    const o = this.out!;
    if (this.beat === 'result') {
      const roll = o.roll && o.stat ? { stat: `${STAT_WORD(o.stat)} ${o.best}`, word: o.ok ? 'SUCCESS' : 'MISSED', line: `rolled ${o.roll.r} · needed ${o.roll.chance} or less`, ok: !!o.ok } : null;
      return r5EvResult({ left, right: this.crew(b), art: '', roll, who: left, line: o.line }, run);
    }
    const money = o.bits.find((x) => /₽/.test(x));
    const rest = o.bits.filter((x) => x !== money);
    const big = money ?? (rest[0] ? card(rest[0]).title + (card(rest[0]).sub ? ` ${card(rest[0]).sub}` : '') : 'Nothing gained');
    // The answer itself leads the cards when there's room (three fit), so the page always says what was done.
    const said: R5RewardCard = { icon: 'g-letter', title: o.label, sub: o.ok === null ? 'Done' : o.ok ? DOMINION_DATA.town.lines.passed! : DOMINION_DATA.town.lines.missed! };
    const cards = (money ? rest : rest.slice(1)).map(card);
    return r5EvReward({ big, cards: cards.length < 3 ? [said, ...cards] : cards }, run);
  }

  private answer(i: number): void {
    const m = this.meet;
    const b = this.host.block();
    if (!m || !b || i < 0 || i >= m.choices.length) return;
    const out = services().session.dominionStep({ t: 'townMeet', choice: i });
    if (!out.ok) {
      this.problem = out.notice;
      return;
    }
    const label = m.choices[i]!.replace(/\s*\(.*$/, '').trim();
    this.said.push({ who: this.boss(), text: `You chose: ${label}.`, you: true });
    if (out.fight) {
      this.beat = null;
      this.meet = null;
      this.host.fight();
      return;
    }
    const o = m.odds[i]!;
    const L = DOMINION_DATA.town.lines;
    const ok = out.roll ? out.roll.r <= out.roll.chance : null;
    const line = ok === null ? `${label}. Done.` : `${label}: ${ok ? L.passed : L.missed}.`;
    this.out = { label, ok, roll: out.roll ? { r: out.roll.r, chance: out.roll.chance } : null, stat: o.stat, best: o.best, bits: out.bits.filter((x) => x !== L.nothing), line };
    this.said.push({ who: this.left(m), text: line });
    this.beat = 'result';
  }

  private close(): void {
    this.beat = null;
    this.meet = null;
    this.out = null;
    this.log = false;
  }

  /** Arrows, Enter and Esc while the event is up. Esc on Talk and Choose goes on to the scene (the meeting waits). */
  key(a: InputAction): boolean {
    if (!this.owns()) return false;
    if (this.log) {
      if (a === 'back' || a === 'confirm') this.log = false;
      else if (a === 'up') this.logFirst = Math.max(0, this.logFirst - 1);
      else if (a === 'down') this.logFirst += 1;
      return true;
    }
    if (this.beat === 'talk') {
      if (a === 'confirm') this.beat = 'choose';
      return a !== 'back';
    }
    if (this.beat === 'choose') {
      const n = this.meet?.choices.length ?? 0;
      if (a === 'confirm') this.answer(this.at);
      else if ((a === 'up' || a === 'down' || a === 'left' || a === 'right') && n) { this.at = (this.at + (a === 'up' || a === 'left' ? -1 : 1) + n) % n; this.problem = null; }
      return a !== 'back';
    }
    if (this.beat === 'result') {
      if (a === 'confirm' || a === 'back') {
        if (this.out?.bits.length) this.beat = 'reward';
        else this.close();
      }
      return true;
    }
    if (a === 'confirm' || a === 'back') this.close();
    return true;
  }

  /** L opens the log; 1-9 answer on Choose. */
  raw(code: string): boolean {
    if (!this.owns()) return false;
    if (code === 'KeyL') {
      this.log = !this.log;
      this.logFirst = Math.max(0, this.said.length - LOG_ROWS);
      this.host.refresh();
      return true;
    }
    const d = /^Digit([1-9])$/.exec(code);
    if (d && this.beat === 'choose' && !this.log) {
      this.at = Number(d[1]) - 1;
      this.answer(this.at);
      this.host.refresh();
      return true;
    }
    // On Result and Reward the digits wait (the text and the reward stay until Enter); on Talk they still change tabs.
    return code.startsWith('Digit') && (this.beat === 'result' || this.beat === 'reward' || this.beat === 'choose');
  }

  acts(): Record<string, (arg: string) => void> {
    const r = (): void => this.host.refresh();
    return {
      evNext: () => { this.key('confirm'); r(); },
      evLog: () => { this.raw('KeyL'); },
      townMeet: (i) => { if (this.owns() && this.beat === 'talk') this.beat = 'choose'; this.at = Number(i); this.answer(Number(i)); r(); },
    };
  }
  overs(): Record<string, (arg: string) => void> {
    return { evOver: (i) => { if (this.beat === 'choose') { this.at = Number(i); this.host.refresh(); } } };
  }

  state(): { beat: Beat | null; at: number; log: boolean; said: number } {
    return { beat: this.beat, at: this.at, log: this.log, said: this.said.length };
  }
}
