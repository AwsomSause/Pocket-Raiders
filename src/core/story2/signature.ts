// Story Run signature moves (Design v2 Part II "Signature moves" and Part II-D). Each of the 74 Remembrance lines has a
// Signature I, a Signature II and a Keystone upgrade of Signature I (src/data/storySignatureMoves.json, built by
// tools/story/build-signature-moves.mjs from tools/story/signature-roster.tsv). Only the run's partner learns them, for
// this run only. What it learned is kept in `v2.sigMoves`; each battle they sit in extra move slots (`storySig`, like
// the Mega signature slot) and are taken away when the battle ends, so they never fill the four normal slots.
//  - Signature I: Heartbond level 3 latched and a won boss, Gym, Elite, Champion or rival fight with the partner in it.
//  - Signature II: Heartbond level 7 latched and the line's own Starter arc (`arc_<Remembrance id>`) done, when that arc is
//    written (else Heartbond 7 alone); learned at a Recovery stop.
//  - Keystone: the Keystone Memory is ready (level 10); Signature I is replaced by its upgrade.
// Names: the player may rename each move once a run (core/story2/moveName.ts); battle text shows the display name.
// Pure and deterministic: no RNG.

import type { Content } from '../contentSchema';
import type { PokemonInstance, RunState } from '../state';
import signatureJson from '../../data/storySignatureMoves.json';
import { freshMoveName, nameMove, officialNames, type MoveNameRecord } from './moveName';
import nameBlocklist from '../../data/story/nameBlocklist.json';

type Slots = { sig1: string; sig2: string; keystone: string };
const BY_LINE: Readonly<Record<string, Slots>> = signatureJson.byLine as Record<string, Slots>;

export const signatureMoves = (lineFirst: string): Slots | null => BY_LINE[lineFirst] ?? null;

/** The partner's Remembrance line (its first stage id): the run's starter line, else the line holding the partner's species. */
export function partnerLine(content: Content, run: RunState): string | null {
  const v2 = run.story.v2;
  const partner = v2?.heartbond.partner ? run.party.find((m) => m.uid === v2.heartbond.partner) : undefined;
  if (!v2 || !partner) return null;
  const lines = content.storyData.remembrances;
  const byId = v2.starter ? lines.find((r) => r.id === v2.starter!.lineId) : undefined;
  const r = byId ?? lines.find((x) => x.line.includes(partner.speciesId));
  return r?.line[0] ?? null;
}

const partnerOf = (run: RunState): PokemonInstance | undefined => run.party.find((m) => m.uid === run.story.v2?.heartbond.partner);

export type SignatureUnlock = { slot: 'sig1' | 'sig2' | 'keystone'; moveId: string };

/**
 * Checks the unlocks and records what is due. `moment`: 'victory' after a won battle (`milestone` = boss, Gym, Elite,
 * Champion or rival), 'recovery' at a Recovery stop. Returns what was learned now (each slot once a run).
 */
export function checkSignatures(content: Content, run: RunState, moment: 'victory' | 'recovery', milestone = false): SignatureUnlock[] {
  const v2 = run.story.v2;
  const line = partnerLine(content, run);
  const slots = line ? signatureMoves(line) : null;
  if (!v2 || !partnerOf(run) || !slots) return [];
  const out: SignatureUnlock[] = [];
  const has = (id: string) => v2.sigMoves.includes(id);
  const latched = (l: number) => v2.heartbond.latched.includes(l);
  const learn = (slot: SignatureUnlock['slot'], id: string) => {
    const move = content.moves.get(id);
    if (!move) return;
    v2.sigMoves.push(id);
    v2.sigNames[id] ??= freshMoveName(move.name);
    out.push({ slot, moveId: id });
  };
  if (moment === 'victory' && milestone && latched(3) && !has(slots.sig1) && !has(slots.keystone)) learn('sig1', slots.sig1);
  // The line's Starter arc is `arc_<Remembrance id>` (as in module.ts). Lines whose arc is not written yet need Heartbond 7 alone.
  const remId = content.storyData.remembrances.find((r) => r.line[0] === line)?.id;
  const arcId = `arc_${remId}`;
  const arcDone = !content.storyData.arcs.some((a) => a.id === arcId) || v2.arcs[arcId]?.state === 'done';
  if (moment === 'recovery' && latched(7) && arcDone && !has(slots.sig2)) learn('sig2', slots.sig2);
  const k = content.moves.get(slots.keystone);
  if (v2.heartbond.keystoneReady && has(slots.sig1) && !has(slots.keystone) && k) {
    v2.sigMoves[v2.sigMoves.indexOf(slots.sig1)] = slots.keystone;
    // The upgrade keeps the player's name for Signature I, with its own default.
    const old = v2.sigNames[slots.sig1];
    v2.sigNames[slots.keystone] = old && old.raw !== null ? { ...old, defaultName: k.name } : freshMoveName(k.name);
    out.push({ slot: 'keystone', moveId: slots.keystone });
  }
  return out;
}

/** Battle start: the partner gets its learned signature moves in extra slots, at full PP. */
export function grantSignatureMoves(content: Content, run: RunState): void {
  const v2 = run.story.v2;
  const mon = partnerOf(run);
  if (!v2 || !mon || v2.sigMoves.length === 0) return;
  for (const id of v2.sigMoves) {
    const move = content.moves.get(id);
    if (move && !mon.moves.some((m) => m.id === id)) mon.moves.push({ id, pp: move.pp, storySig: true });
  }
}

/** Battle end: the extra slots go away (the moves stay learned in `v2.sigMoves`). */
export function endSignatureMoves(party: readonly PokemonInstance[]): void {
  for (const mon of party) if (mon.moves.some((m) => m.storySig)) mon.moves = mon.moves.filter((m) => !m.storySig);
}

/** The name to show for a move: the partner's chosen name for a signature move, else undefined (use the move's own). */
export function signatureDisplay(run: RunState, moveId: string): string | undefined {
  return run.story.v2?.sigNames[moveId]?.display;
}

/** Stores a naming result (from nameMove). */
export function setSignatureName(run: RunState, moveId: string, rec: MoveNameRecord): void {
  const v2 = run.story.v2;
  if (v2 && v2.sigNames[moveId]) v2.sigNames[moveId] = rec;
}

/** The line shown when a signature move is learned. */
export function learnedLine(content: Content, run: RunState, pokemon: string, u: SignatureUnlock): string {
  const name = signatureDisplay(run, u.moveId) ?? content.moves.get(u.moveId)?.name ?? u.moveId;
  return u.slot === 'keystone' ? `${pokemon}'s signature move grew into ${name}!` : `${pokemon} learned its own move: ${name}!`;
}

/** The signature move the partner can be asked to name next (learned, not yet renamed), or null. Only for the partner. */
export function nextNameable(run: RunState, uid: string): string | null {
  const v2 = run.story.v2;
  if (!v2 || v2.heartbond.partner !== uid) return null;
  return v2.sigMoves.find((id) => v2.sigNames[id] && !v2.sigNames[id]!.renamed) ?? null;
}

/**
 * Names (or renames) a learned signature move: 3 to 20 characters, the bad-word filter, no official move or Pokémon
 * names (moveName.ts). The first name is free, then one rename a run. Returns the message to show.
 */
export function nameSignature(content: Content, run: RunState, moveId: string, raw: string | null): string {
  const rec = run.story.v2?.sigNames[moveId];
  if (!rec) return 'Only a learned signature move can be named.';
  const official = officialNames([...[...content.moves.values()].filter((m) => !m.flags.includes('storysig')).map((m) => m.name), ...[...content.species.values()].map((s) => s.name)]);
  const r = nameMove(rec, raw, { blocklist: nameBlocklist, official });
  if (r.message) return r.message;
  setSignatureName(run, moveId, r.rec);
  return `The move is called ${r.rec.display}.`;
}
