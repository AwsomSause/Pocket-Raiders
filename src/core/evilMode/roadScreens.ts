// Evil Mode slice 12, the screens' plain data (design Parts 19, 20, 21; Part 29 New look): the Road page (the other three,
// the fire's flame, the mother's letters, the Night's notebook), the fire itself, and the last room. Each choice carries an
// id; `roadChoice` turns it into the one EvilAction it stands for, so the screen never decides anything.

import { EVIL_DATA, type EvilData } from './data';
import type { EvilAction } from './day';
import { fireChoices, flameAt } from './fires';
import { dayOfReck, reckOn, roomOptions, type LastDay, type RoomOption } from './reckoning';
import { ROAD_WHATS, type RoadWhat } from './road';
import type { EvilModeBlock } from './schema';
import { temperDoes, temperWord } from './temper';

export interface RoadChoice { id: string; say: string; note?: string }
export interface RoadModel {
  mode: 'road' | 'fire' | 'room';
  /** The fire and the room hold the screen until they're closed (text stays until the player's input). */
  forced: boolean;
  title: string;
  lines: string[];
  choices: RoadChoice[];
  /** A typed line is open here (the fire's own line, the Night's notebook): its limit and help. */
  own: { max: number; help: string; id: string } | null;
  temper: string | null;
  sections: { title: string; lines: string[]; empty: string }[];
}

const roomOpen = (block: EvilModeBlock) => block.reck?.room && block.reck.region === block.here.region ? block.reck.room : null;

/** True while the fire or the last room (not yet seen out) must stay on screen. */
export const roadForced = (block: EvilModeBlock, roomSeen = false): boolean => !!block.fire || (!!roomOpen(block) && !roomSeen);

export function roadModel(block: EvilModeBlock, roomSeen = false, data: EvilData = EVIL_DATA): RoadModel | null {
  const hero = block.hero;
  if (!hero) return null;
  const temper = `${temperWord(hero.temper, data)}. ${temperDoes(hero.temper, data)}`;
  const base = { forced: true, temper: hero.met ? temper : null, sections: [], own: null } as const;
  const f = block.fire;
  if (f) {
    const choices: RoadChoice[] = block.fight ? [{ id: 'fight', say: 'Fight' }] : f.step === 'done' ? [{ id: 'close', say: data.fires.scene.close! }] : fireChoices(block, data).map((c) => ({ id: c.id.startsWith('own:') ? c.id : `fa:${c.id}`, say: c.say }));
    const own = f.step === 'own' && !block.fight ? { max: data.fires.rules.ownMax, help: data.fires.scene.ownHelp!, id: 'own:typed' } : null;
    return { ...base, mode: 'fire', title: data.fires.scene.title!, lines: f.lines, choices, own, sections: [] };
  }
  const room = roomOpen(block);
  if (room && !roomSeen) {
    const r = block.reck!;
    const lines = [...r.gate, ...r.walk, room.open, ...room.speech, ...room.lines];
    const choices: RoadChoice[] = block.fight ? [{ id: 'fight', say: 'Fight' }]
      : room.outcome ? [{ id: 'roomDone', say: 'Close' }]
      : roomOptions(block, data).map((o) => ({ id: `ra:${o.what}:${o.kind ?? ''}:${o.who ?? ''}`, say: o.name }));
    if (room.outcome) lines.push(...block.evening);
    return { ...base, mode: 'room', title: 'The last room', lines, choices, sections: [] };
  }
  // The Road page: not forced.
  const lines: string[] = [];
  const choices: RoadChoice[] = [];
  const at = flameAt(block, data);
  if (at !== null) {
    lines.push(data.fires.flame.board!.replace('{step}', String(at)));
    choices.push({ id: 'sit', say: data.fires.flame.sit!, note: data.fires.flame.why! });
  }
  const D = data.lastRoom.lastDay;
  if (reckOn(data) && block.here.stage >= 8 && dayOfReck(block) === 2 && !block.reck?.lastDay) {
    lines.push(D.help);
    for (const [k, o] of Object.entries(D.options)) choices.push({ id: `ld:${k}`, say: o.name ?? k, ...(o.does ? { note: o.does } : {}) });
  }
  for (const t of block.road.filter((x) => x.state === 'on')) for (const w of ROAD_WHATS) choices.push({ id: `rd:${t.id}:${w}`, say: `${w === 'help' ? 'Help' : w === 'talk' ? 'Talk to' : 'Mislead'} ${t.name}` });
  const M = data.road.mother;
  for (const l of hero.mother.letters) if (l.mood !== 'none' && !l.read) choices.push({ id: `lo:${l.id}`, say: `${M.open.yes}: region ${l.region + 1}, district ${l.district}`, note: `${M.open.warn} ${M.open.need}` });
  if (block.here.beat === 'night') {
    if (!hero.mother.written.includes(block.here.region)) M.write.openings.forEach((o, i) => choices.push({ id: `wm:${i}`, say: `Write to her: ${o}` }));
    if (block.team.line !== 'clean' && !hero.mother.keepNext) choices.push({ id: 'keep', say: M.keep.name ?? 'Keep the next letter back', ...(M.keep.other ? { note: M.keep.other } : {}) });
  }
  const fireTonight = block.here.beat === 'night' && hero.fires.some((x) => !x.missed && x.day === block.here.day && x.region === block.here.region) && !block.applied.includes(`notebook:${block.here.region}:${block.here.day}`);
  if (fireTonight) lines.push(data.fires.flame.night!);
  const sections = [
    { title: 'The other three', lines: block.road.map((t) => (t.state === 'home' ? `${t.name}: gone home.` : `${t.name}: ${t.today ?? data.road.approach[t.role]}`)), empty: 'Nobody else on the road.' },
    { title: "Their mother's letters", lines: [M.sealed.replace('{n}', String(hero.mother.letters.filter((l) => l.mood !== 'none').length))], empty: '' },
  ];
  return { mode: 'road', forced: false, title: 'The road', lines, choices, own: fireTonight ? { max: data.fires.rules.noteMax, help: 'One line in the Office notebook.', id: 'nb' } : null, temper: hero.met ? temper : null, sections };
}

/** The one action a choice stands for. `text` is the typed line for `own:typed` and `nb`. Null: the screen handles it. */
export function roadChoice(id: string, text = ''): EvilAction | null {
  const [k, a = '', b = '', c = ''] = id.split(':');
  if (k === 'sit') return { type: 'sitFire' };
  if (k === 'fa') return { type: 'fireAnswer', id: `${a}:${b}` };
  if (k === 'own') return a === 'typed' ? { type: 'fireOwn', text } : a === 'silence' ? { type: 'fireOwn', silence: true } : { type: 'fireOwn', pick: Number(a) };
  if (k === 'close') return { type: 'closeFire' };
  if (k === 'nb') return { type: 'writeNotebook', text };
  if (k === 'ld') return { type: 'lastDay', what: a as LastDay };
  if (k === 'rd') return { type: 'roadDo', who: a, what: b as RoadWhat };
  // Letter ids carry colons ("letter:0:2"): everything after "lo:".
  if (k === 'lo') return { type: 'openLetter', id: id.slice(3) };
  if (k === 'keep') return { type: 'keepLetter' };
  if (k === 'wm') return { type: 'writeMother', opening: Number(a) };
  if (k === 'ra') return { type: 'roomAct', what: a as RoomOption['what'], ...(b ? { kind: b } : {}), ...(c ? { who: c } : {}) };
  return null;
}
