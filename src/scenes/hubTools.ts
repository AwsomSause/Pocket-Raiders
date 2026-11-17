// The Hub "Tools" room (W12): what's new, content status, your stats, the seed board, mod packs, bug report and a
// backup note. Every page is a list; none of it changes how a run plays.

import { CHANGELOG, entriesSince, latestChangelogId } from '../core/tools/changelog';
import { contentStatuses, problemEntries, statusBoard, statusLines } from '../core/tools/contentStatusView';
import { localStats, statTiles } from '../core/tools/localStats';
import { buildBugReport, bugReportHeadline } from '../core/tools/bugReport';
import { berryEntries, berryLines } from '../core/tools/berryBestiary';
import { boardCode, mergedBoard } from '../core/tools/seedBoard';
import { installPack, removePack, removeProblem } from '../core/tools/modPacks';
import { bracketLines, makeBracket, parseNames } from '../core/tools/bracket';
import { inspectSave, reportLines } from '../save/saveInspector';
import { categoryLabel, parseSplits, speedrunTiles, splitLines } from '../core/tools/speedrun';
import { peekStreams } from '../core/tools/rngView';
import { flagList, flagOn, setFlag } from '../core/tools/featureFlags';
import { botReportLines } from '../core/tools/botReport';
import { diffLines, diffRuns } from '../core/tools/replayDiff';
import { balanceLines, balanceView } from '../core/tools/balanceView';
import { provenanceLines, provenanceSources } from '../core/tools/provenanceView';
import { speciesStrength } from '../quality/balanceSim';
import { RunStateSchema } from '../core/state';
import { playedSeeds, scoreLine, seedLeaderboard } from '../core/tools/seedLeaderboard';
import { ghostFor } from '../core/ghost';
import { COOP_SIZE, coopTeam, draftDone, pick as coopPick, remaining, startCoop, whoseTurn, type CoopDraft } from '../core/tools/coopDraft';
import { activeMon, hotSeatWinner, moveOptions, playTurn, startHotSeat, type HotSeat } from '../core/tools/hotSeat';
import { noteKey, parseNotes, setNote, viewAt } from '../core/tools/spectator';
import { castVote, featured, parseVotes, tally, voteCode } from '../core/tools/packVoting';
import { addPoster, parsePosters, removePoster } from '../core/tools/fanArt';
import { wildEligibleSpecies } from '../core/themes';
import { hashSeed, Rng } from '../core/rng';
import { eventText } from './../ui/battleText';
import { pickPosterImage } from '../ui/files';
import { acceptOffer, cancelOffer, logPhoto, postOffer, readOffer, redeemReply, SHOWCASE_SLOTS, showcaseOf, toggleShowcase, weekTheme } from '../core/social';
import { backupDue } from '../core/tools/backup';
import { packSeeds } from '../core/configPack';
import { loadStoredPacks } from '../core/tools/modPacks';
import { decodeSeedCode } from '../core/seedCode';
import { legacyOf, shelfProblem, shelveSeed } from '../core/legacy';
import { downloadText, pickTextFile } from '../ui/files';
import { APP_VERSION, BUILD_ID } from '../game/buildInfo';
import { device, packStore, recentErrors } from '../game/deviceTools';
import { services } from '../game/services';
import { COLORS, textStyle } from '../ui/theme';
import type { Picker, PickerRow } from '../ui/partyPanel';
import type { AskOptions } from '../ui/redux/ask';
import { bracketView, friendsPage, friendsPages } from '../ui/redux/screens/bracket';
import type { ReduxCtx } from '../ui/redux/stage';
import { statsView } from '../ui/redux/templates';

type PickerConfig = ConstructorParameters<typeof Picker>[1];

export interface ToolsHost {
  open(config: PickerConfig): void;
  close(): void;
  /** Reopens the Hub (with a notice) on the Tools room. */
  restart(notice: string | undefined): void;
  /** New UI only: asks for a typed answer on the mock-ups' form page (the Old look uses the browser's own box). */
  ask?: (o: AskOptions) => Promise<string | null>;
}

const row = (label: string, sub: string, right = '', color: string = COLORS.textLight): PickerRow => ({
  problem: null,
  hint: sub,
  draw: (scene, box, w, h) => {
    box.add(scene.add.text(12, 6, label, textStyle(18, color, { wordWrap: { width: w - 190 } })));
    if (sub) box.add(scene.add.text(12, 31, sub, textStyle(13, COLORS.textMuted, { wordWrap: { width: w - 190 } })));
    if (right) box.add(scene.add.text(w - 12, h / 2, right, textStyle(15, COLORS.gold)).setOrigin(1, 0.5));
  },
});

function page(host: ToolsHost, title: string, rows: PickerRow[], onSelect: (i: number) => void = () => undefined, back: () => void = () => openTools(host)): void {
  host.open({ title, rows, columns: 1, rowHeight: 56, onSelect, onBack: back });
}

/**
 * A typed answer. New look: the mock-ups' form page (`o`); Old look: the browser's own box with the line `old`.
 * Null when the player backs out.
 */
function ask(host: ToolsHost, old: string, o: Omit<AskOptions, 'value'>, initial = ''): Promise<string | null> {
  return host.ask ? host.ask({ ...o, value: initial }) : Promise.resolve(window.prompt(old, initial));
}

/** What the Tools room shows first. */
export function openTools(host: ToolsHost): void {
  const { session } = services();
  const due = backupDue({ runs: session.profile.runHistory.length, lastExportAt: device.lastExport(), lastRemindedAt: null, now: new Date().toISOString() });
  const items: { label: string; sub: string; go: () => void }[] = [
    { label: "What's new", sub: 'Changes in each update.', go: () => openChangelog(host) },
    { label: 'Berry Bestiary', sub: 'What every berry does, how rare it is and how it grows in a Berry Garden.', go: () => openBerries(host) },
    { label: 'Content status', sub: 'How much of the game is fully working, limited or switched off.', go: () => openContentStatus(host) },
    { label: 'My stats', sub: 'Numbers worked out on this device from your own runs. Nothing is sent anywhere.', go: () => openStats(host) },
    { label: 'Seed board', sub: 'Curated seeds, plus seeds from your mod packs. Put one on the shelf (Enter).', go: () => openSeedBoard(host) },
    { label: 'Mod packs', sub: 'Add JSON packs of extra trainer lines and seeds. Packs are checked, never run as code.', go: () => openPacks(host) },
    { label: 'Tournament bracket', sub: 'Type friends\' names; get a seeded single-elimination bracket. Works offline.', go: () => openBracket(host) },
    { label: 'Check a save file', sub: 'Pick a save record or exported save: shows its version, the upgrade steps and any damage. Changes nothing.', go: () => openSaveCheck(host) },
    { label: 'Speedrun timer', sub: `Shows run time and badge splits on the map. Now ${device.speedrunOn() ? 'on' : 'off'}; Enter to switch, then see the last run's splits.`, go: () => openSpeedrun(host) },
    { label: 'RNG streams (debug)', sub: 'Shows the current run\'s random streams and what each will roll next. Looking changes nothing.', go: () => openRngView(host) },
    { label: 'Achievements showcase', sub: `Pick up to ${SHOWCASE_SLOTS} earned achievements to show on your Trainer Card.`, go: () => openShowcase(host) },
    { label: 'Photo contest', sub: 'A new theme each week. Take a shot (F9 saves a framed screenshot) and log it here.', go: () => openPhotos(host) },
    { label: 'Trade board', sub: 'Swap kept Pokémon with friends using short codes. No server; each code works once.', go: () => openTradeBoard(host) },
    { label: 'Report a bug', sub: 'Bundles the version, seed and recent errors into a file you can send.', go: () => openBugReport(host) },
    { label: 'Seed leaderboard', sub: 'Your runs on one seed, ranked, with a friend\'s ghost when you have one.', go: () => openSeedBoards(host) },
    { label: 'Co-op draft', sub: 'Two players alternate picks from a shared pool and share the team as a code.', go: () => openCoop(host, null) },
    { label: 'Hot-seat versus', sub: 'Two people, one device: pick moves in turn and pass it. Text battle, three Pokémon each.', go: () => openHotSeat(host) },
    { label: 'Replay viewer', sub: 'Step through a past run\'s journal and add your own notes.', go: () => openReplayList(host) },
    { label: 'Pack voting', sub: 'Pick featured mod packs with friends\' vote codes. Featured packs show first.', go: () => openVoting(host) },
    { label: 'Fan art frame', sub: 'Keep up to 3 of your own images as posters. Stored on this device only.', go: () => openFrame(host) },
    { label: 'Feature flags', sub: 'Switch optional parts of the game on or off. Stored on this device only.', go: () => openFlags(host) },
    ...(flagOn(device, 'devTools')
      ? [
          { label: 'Balance dashboard (dev)', sub: 'Runs quick one-on-one battles and shows which species win most and least.', go: () => openBalance(host) },
          { label: 'Bot report (dev)', sub: 'Pick a playtest log (.jsonl from node tools/playtest.ts) for a plain summary.', go: () => openBotReport(host) },
          { label: 'Replay diff (dev)', sub: 'Pick two run files and see the first place they differ.', go: () => openReplayDiff(host) },
          { label: 'Asset sources (dev)', sub: 'How many art and audio files come from each pack, and who to credit.', go: () => openProvenance(host) },
        ]
      : []),
    { label: 'Back up my save', sub: due ? 'You have not saved a copy in a while. Enter to download one.' : 'Download a copy of your profile and settings.', go: () => backup(host) },
  ];
  page(host, 'Tools & Community', items.map((i, n) => row(i.label, i.sub, i.label === 'Back up my save' && due ? 'Due' : '')), (n) => items[n]!.go(), () => host.close());
}

export function openChangelog(host: ToolsHost): void {
  const seen = device.changelogSeen();
  const unseen = new Set(entriesSince(seen).map((e) => e.id));
  const rows: PickerRow[] = [];
  for (const e of CHANGELOG) {
    rows.push(row(`${e.title}  ·  ${e.id}`, '', unseen.has(e.id) ? 'New' : '', COLORS.gold));
    for (const n of e.notes) rows.push(row(`• ${n}`, ''));
  }
  device.setChangelogSeen(latestChangelogId());
  page(host, "What's new", rows);
}

function openContentStatus(host: ToolsHost): void {
  const { session, assets } = services();
  const missing = new Set(assets.missing.flatMap((m) => m.files));
  const statuses = contentStatuses(session.content, { assetExists: (p) => !missing.has(p) });
  // New UI: each kind is a board row with a bar (how much is fully supported) and an OK or Check tag.
  const rows: PickerRow[] = statusLines(statuses).map((l) => ({
    ...row(`${l.kind}  ·  ${l.total}`, `supported ${l.counts.supported} · limited ${l.counts.limited} · disabled ${l.counts.disabled} · invalid ${l.counts.invalid}`, l.counts.invalid ? 'Check' : ''),
    board: statusBoard(l),
  }));
  const bad = problemEntries(statuses).slice(0, 40);
  rows.push(row(`Not fully supported (first ${bad.length})`, 'Limited means it works with notes; disabled means switched off for now.', '', COLORS.gold));
  for (const e of bad) rows.push(row(`${e.kind} ${e.id}  ·  ${e.status}`, e.notes[0] ?? ''));
  page(host, 'Content status', rows);
}

function openStats(host: ToolsHost): void {
  const { session } = services();
  const s = localStats(session.profile);
  const name = (id: string) => session.content.archetypes.get(id)?.name ?? id;
  const mon = (id: string) => session.content.species.get(id)?.name ?? id;
  const rows = [
    row('Runs', `${s.runs} finished · ${s.wins} won`, `${s.winRate}%`),
    row('Depth', `Average ${s.avgEncounters} encounters per run, best ${s.bestEncounters}. Average ${s.avgRegions} regions cleared.`),
    row('Assisted runs', 'Runs that used the debug tools.', String(s.assisted)),
    ...s.topTrainers.map((t) => row(`Trainer: ${name(t.id)}`, `${t.runs} runs, ${t.wins} won`)),
    ...s.topKillers.map((k) => row(`Beaten by ${mon(k.id)}`, '', `${k.count}×`)),
    ...s.topPartyMembers.map((m) => row(`Most used: ${mon(m.id)}`, '', `${m.count} runs`)),
  ];
  const t = statTiles(s, name, mon);
  host.open({ title: 'My stats', rows, columns: 1, rowHeight: 56, onSelect: () => undefined, onBack: () => openTools(host), page: (c) => statsView(c, { title: 'My stats', tiles: t.tiles, text: t.text, hints: [['Esc', 'back']] }) });
}

function openSeedBoard(host: ToolsHost): void {
  const { session } = services();
  const p = session.profile;
  const packs = loadStoredPacks(packStore).packs;
  const extra = packSeeds(packs);
  // The pack the player's friends voted for (Pack voting) goes first.
  const star = featured(parseVotes(device.get(KEYS.votes)), packs.map((x) => x.id));
  const starSeeds = packSeeds(packs.filter((x) => x.id === star));
  const merged = mergedBoard(extra);
  const board = [...merged.filter((e) => starSeeds.some((x) => x.seed === e.seed && x.archetypeId === e.archetypeId)), ...merged.filter((e) => !starSeeds.some((x) => x.seed === e.seed && x.archetypeId === e.archetypeId))];
  const now = new Date().toISOString();
  const rows = board.map((e) => {
    const code = boardCode(e);
    const problem = shelfProblem(p, code);
    return row(e.label, `${e.note}  Seed ${e.seed}, trainer ${session.content.archetypes.get(e.archetypeId)?.name ?? e.archetypeId}.`, problem ? (legacyOf(p).seedShelf.some((s) => s.code === code) ? 'On shelf' : 'Shelf full') : 'Add');
  });
  page(host, `Seed board  ·  ${board.length}`, rows, (n) => {
    const e = board[n]!;
    const code = boardCode(e);
    if (!decodeSeedCode(code).ok || shelfProblem(session.profile, code)) return;
    session.changeProfile((pr) => shelveSeed(pr, code, e.label, now));
    host.restart(`"${e.label}" is on your Seed Shelf.`);
  });
}

function openPacks(host: ToolsHost): void {
  const loaded = loadStoredPacks(packStore);
  const rows: PickerRow[] = [row('Add a pack from a file', 'Pick a .json pack. It is checked first; bad packs are refused.', 'Add')];
  for (const p of loaded.packs) rows.push(row(`${p.name}  ·  ${p.author}`, `${Object.keys(p.flavor).length} line sets, ${p.seeds.length} seeds, ${p.events.length} events. Enter removes it.`, 'Remove'));
  for (const problem of loaded.problems) rows.push(row('Skipped pack', problem, '', COLORS.textMuted));
  page(host, `Mod packs  ·  ${loaded.packs.length}`, rows, (n) => {
    if (n === 0) pickTextFile((text) => host.restart(installPack(packStore, text).message));
    else if (loaded.packs[n - 1]) {
      const blocked = removeProblem(packStore, loaded.packs[n - 1]!.id, !!services().session.run);
      if (blocked) return host.restart(blocked);
      removePack(packStore, loaded.packs[n - 1]!.id);
      host.restart('Pack removed. Restart the game to drop its lines.');
    }
  });
}

async function openBracket(host: ToolsHost): Promise<void> {
  const form = { title: 'Tournament bracket', area: 'run' } as const;
  const text = await ask(host, 'Names, separated by commas (2 to 32):', { ...form, heading: 'Type the names, with commas between them', text: 'Two to 32 names. The same names and seed always draw the same bracket. Works offline.', ok: 'Next' });
  if (text === null) return openTools(host);
  const start = String(Date.now() % 100000);
  const typed = await ask(host, 'Seed for the draw (anything; same names + seed = same bracket):', { ...form, heading: 'Type a seed for the draw', text: 'Anything works. The same names and seed always draw the same bracket.', ok: 'Draw' }, start);
  // Backing out of the seed: the New look goes back to Tools, the Old look draws with no seed (as it always did).
  if (typed === null && host.ask) return openTools(host);
  const seed = typed ?? '';
  const result = makeBracket(parseNames(text), seed);
  if (!result.ok) return host.restart(result.reason);
  const lines = bracketLines(result.rounds);
  const copy = (): void => { void navigator.clipboard?.writeText(lines.join('\n')).catch(() => undefined); host.restart('Bracket copied.'); };
  const size = (result.rounds[0]?.length ?? 0) * 2, pages = friendsPages(size);
  // New UI: the mock-ups' bracket page (groups of eight as tabs); Enter copies it as text.
  const show = (tab: number): void => host.open({
    title: `Bracket  ·  ${result.names.length} players`, columns: 1, rowHeight: 56, onBack: () => openTools(host),
    rows: [...lines.map((l) => row(l, '')), row('Copy as text', 'For pasting into a chat.', 'Copy')],
    onSelect: (n) => { if (host.ask || n === lines.length) copy(); },
    ...(host.ask ? {
      tabs: pages.length ? { labels: pages, index: tab, onChange: show } : undefined,
      page: (c: ReduxCtx) => bracketView(c, friendsPage(result.rounds, tab, `${result.names.length} players, seed ${seed || 'none'}. Enter copies the bracket as text.`)),
    } : {}),
  });
  show(0);
}

/** Checks a save's text: an exported save holds records inside it; a plain record is checked as is. */
function showSaveCheck(host: ToolsHost, text: string): void {
  let parts: { name: string; raw: string }[] = [{ name: 'File', raw: text }];
  try {
    const file = JSON.parse(text) as { kind?: string; profile?: unknown; settings?: unknown };
    if (file.kind === 'export') parts = [file.profile ? { name: 'Profile', raw: JSON.stringify(file.profile) } : null, file.settings ? { name: 'Settings', raw: JSON.stringify(file.settings) } : null].filter((x): x is { name: string; raw: string } => !!x);
  } catch { /* inspectSave reports it */ }
  const rows = parts.flatMap((p) => reportLines(inspectSave(p.raw)).map((l, i) => row(i === 0 ? `${p.name}: ${l}` : l, '', '', l.startsWith('!') ? COLORS.gold : COLORS.textLight)));
  page(host, 'Save check', rows.length ? rows : [row('Nothing to check', 'That file has no save records.')]);
}

async function openSaveCheck(host: ToolsHost): Promise<void> {
  if (!host.ask) return pickTextFile((text) => showSaveCheck(host, text));
  // New UI: the mock-ups' form page. Pasted save text is checked as it is; an empty box opens the file picker.
  const text = await host.ask({ title: 'Check a save file', heading: 'Paste a save code to check it', text: 'Paste the text of a save, or leave the box empty and press Check to pick a save file. Nothing is changed.', ok: 'Check' });
  if (text === null) return openTools(host);
  if (text.trim()) showSaveCheck(host, text.trim());
  else pickTextFile((file) => showSaveCheck(host, file));
}

function openSpeedrun(host: ToolsHost): void {
  const { session } = services();
  const on = device.speedrunOn();
  const sp = parseSplits(device.splits());
  const rules = session.run?.rules;
  const rows = [row(`Timer is ${on ? 'on' : 'off'}`, 'Enter switches it. Times stay on this device, never in your save.', on ? 'Turn off' : 'Turn on'), ...(rules ? [row(`Category: ${categoryLabel(rules)}`, 'Only compare times in the same category.')] : []), ...(sp ? splitLines(sp, Date.now()).map((l) => row(l, '')) : [row('No splits yet', 'Turn the timer on and start a run.')])];
  const tiles = speedrunTiles(on, sp, Date.now(), rules ? categoryLabel(rules) : null);
  host.open({
    title: 'Speedrun timer', rows, columns: 1, rowHeight: 56, onBack: () => openTools(host),
    onSelect: (n) => { if (n === 0) { device.setSpeedrun(!on); host.restart(`Speedrun timer ${on ? 'off' : 'on'}.`); } },
    page: (c) => statsView(c, { title: 'Speedrun timer', area: 'run', tiles, press: 0, text: `Enter turns the timer ${on ? 'off' : 'on'}. Times stay on this device, never in your save.`, hints: [['Enter', on ? 'turn off' : 'turn on'], ['Esc', 'back']] }),
  });
}

function openRngView(host: ToolsHost): void {
  const run = services().session.run;
  const rows = run ? peekStreams(run.rng, 3).map((v) => row(v.name, `state ${v.state}`, v.next.join('  '))) : [row('No run in progress', 'Start a run to see its streams.')];
  page(host, 'RNG streams', rows);
}

function openShowcase(host: ToolsHost): void {
  const { session } = services();
  const p = session.profile;
  const shown = new Set(showcaseOf(p));
  const earned = [...session.content.achievements.values()].filter((a) => p.achievements[a.id]);
  const rows = earned.length ? earned.map((a) => row(a.name, a.description, shown.has(a.id) ? 'Shown' : '')) : [row('Nothing earned yet', 'Win battles and finish runs to earn achievements.')];
  page(host, `Showcase  ·  ${shown.size}/${SHOWCASE_SLOTS}`, rows, (n) => {
    const a = earned[n];
    if (!a) return;
    const r = toggleShowcase(session.profile, a.id);
    if ('problem' in r) return host.restart(r.problem);
    session.changeProfile(() => r.profile);
    openShowcase(host);
  });
}

function openPhotos(host: ToolsHost): void {
  const { session } = services();
  const today = new Date().toISOString().slice(0, 10);
  const rows = [row(`This week: ${weekTheme(today)}`, 'Enter to log your entry (a note and your own star rating).', 'Log'), ...legacyOf(session.profile).photos.map((x) => row(`${x.week}  ·  ${x.theme}`, x.note, '★'.repeat(x.stars)))];
  page(host, 'Photo contest', rows, async (n) => {
    if (n !== 0) return;
    const form = { title: 'Photo contest' } as const;
    const note = await ask(host, `Describe your shot for "${weekTheme(today)}":`, { ...form, heading: 'Describe your shot', text: `This week's theme: ${weekTheme(today)}. F9 saves a framed screenshot.`, ok: 'Next' });
    if (note === null) return;
    const stars = Number(await ask(host, 'Rate it yourself, 1 to 5 stars:', { ...form, heading: 'Rate it yourself, 1 to 5 stars', text: 'Your own rating; it shows beside the entry.', ok: 'Log' }, '3'));
    session.changeProfile((pr) => logPhoto(pr, today, note, stars));
    host.restart('Entry logged.');
  });
}

function openTradeBoard(host: ToolsHost): void {
  const { session } = services();
  const p = session.profile;
  const name = (id: string) => session.content.species.get(id)?.name ?? id;
  const kept = p.pastPokemon;
  const board = legacyOf(p).tradeBoard;
  const done = (r: { ok: boolean; reason?: string; profile?: typeof p; code?: string; reply?: string }, keep: string): void => {
    if (!r.ok || !r.profile) return host.restart(r.reason ?? 'That did not work.');
    session.changeProfile(() => r.profile!);
    const text = r.code ?? r.reply;
    if (text) void navigator.clipboard?.writeText(text).catch(() => undefined);
    host.restart(text ? `${keep} Code copied: send it to your friend.` : keep);
  };
  const form = { title: 'Trade board' } as const;
  const items: { label: string; sub: string; go: () => void | Promise<void> }[] = [
    { label: 'Post an offer', sub: `Put one of your ${kept.length} kept Pokémon on the board and copy its code.`, go: async () => {
      const list = kept.map((m, i) => `${i + 1} ${name(m.speciesId)} Lv${m.level}`).join(', ');
      const pick = await ask(host, `Which one? ${list}`, { ...form, heading: 'Type the number of the Pokémon to offer', text: list || 'You have no kept Pokémon yet.', ok: 'Next' }, '1');
      if (pick === null) return;
      const want = (await ask(host, 'Species id you want back (empty: a gift)', { ...form, heading: 'Type the species you want back', text: 'A species id such as "pikachu". Leave it empty to make it a gift.', ok: 'Post' })) ?? '';
      done(postOffer(session.profile, Number(pick) - 1, want.trim() || null, 'A friend', new Date().toISOString()), 'Offer posted.');
    } },
    { label: 'Take a friend\'s offer', sub: 'Paste their TB1 code. You get a reply code to send back.', go: async () => {
      const code = await ask(host, 'Paste the offer code:', { ...form, heading: 'Paste the offer code', text: 'Offer codes start with TB1. You get a reply code to send back.', ok: 'Take' });
      if (!code) return;
      const read = readOffer(code);
      if (!read.ok) return host.restart(read.reason);
      let give: number | null = null;
      if (read.offer.want) {
        const list = kept.map((m, i) => `${i + 1} ${name(m.speciesId)}`).join(', ');
        const pick = await ask(host, `${read.offer.from} wants a ${name(read.offer.want)}. Which of yours? ${list}`, { ...form, heading: `${read.offer.from} wants a ${name(read.offer.want)}: type the number of yours`, text: list || 'You have no kept Pokémon yet.', ok: 'Give' }, '1');
        if (pick === null) return;
        give = Number(pick) - 1;
      }
      done(acceptOffer(session.profile, code, give, new Date().toISOString()), `You received ${name(read.offer.mon.speciesId)}.`);
    } },
    { label: 'Use a friend\'s reply', sub: 'Paste the TR1 code they sent back to finish your offer.', go: async () => {
      const code = await ask(host, 'Paste the reply code:', { ...form, heading: 'Paste the reply code', text: 'Reply codes start with TR1. Each code works once.', ok: 'Finish' });
      if (code) done(redeemReply(session.profile, code, new Date().toISOString()), 'Trade finished.');
    } },
    ...board.map((e) => ({ label: `Open: ${name(e.mon.speciesId)} Lv${e.mon.level}`, sub: `Wants ${e.want ? name(e.want) : 'nothing (gift)'}. Enter cancels it and returns the Pokémon.`, go: () => done(cancelOffer(session.profile, e.id), 'Offer cancelled.') })),
  ];
  page(host, 'Trade board', items.map((i) => row(i.label, i.sub)), (n) => void items[n]!.go());
}

function openBugReport(host: ToolsHost): void {
  const { session } = services();
  const make = (note: string) => buildBugReport({ version: APP_VERSION, build: BUILD_ID, now: new Date().toISOString(), userAgent: navigator.userAgent, scene: 'Hub', run: session.run, settings: session.settings, errors: recentErrors(), note });
  const head = bugReportHeadline(make(''));
  page(host, 'Report a bug', [row('Save a bug report file', `${head}. Contains no save data, only the run seed, version and recent errors.`, 'Save'), row('Copy a one-line summary', 'For pasting into a chat.', 'Copy')], async (n) => {
    if (n === 0) {
      const note = (await ask(host, 'What went wrong? (optional)', { title: 'Report a bug', heading: 'What went wrong? (optional)', text: 'A few words help. The file holds no save data, only the run seed, the version and recent errors.', ok: 'Save' })) ?? '';
      downloadText(`pkmn-bug-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(make(note), null, 2));
      host.restart('Bug report saved.');
    } else {
      void navigator.clipboard?.writeText(head).catch(() => undefined);
      host.restart('Summary copied.');
    }
  });
}

function backup(host: ToolsHost): void {
  const { session } = services();
  downloadText(`pkmn-save-${new Date().toISOString().slice(0, 10)}.json`, session.exportSave());
  device.markExported(new Date().toISOString());
  host.restart('Save exported.');
}

/** A notice for the Hub when something is worth saying on arrival (an update, a backup). */
export function hubArrivalNotice(): { text: string; openChangelog: boolean } | null {
  const { session } = services();
  const now = new Date().toISOString();
  const seen = device.changelogSeen();
  if (seen === null) {
    device.setChangelogSeen(latestChangelogId());
    return null;
  }
  if (seen !== latestChangelogId()) return { text: "The game was updated. Open Settings > Tools & Community > What's new.", openChangelog: true };
  if (backupDue({ runs: session.profile.runHistory.length, lastExportAt: device.lastExport(), lastRemindedAt: device.lastReminded(), now })) {
    device.markReminded(now);
    return { text: 'Back up your save: Settings > Tools & Community > Back up my save.', openChangelog: false };
  }
  return null;
}

function openFlags(host: ToolsHost): void {
  const flags = flagList(device);
  page(host, 'Feature flags', flags.map(({ flag, on }) => row(flag.label, flag.blurb, on ? 'On' : 'Off')), (n) => {
    const f = flags[n];
    if (!f) return;
    setFlag(device, f.flag.id, !f.on);
    host.restart(`${f.flag.label}: ${f.on ? 'off' : 'on'}.`);
  });
}

function textRows(lines: string[]): PickerRow[] {
  return lines.map((l) => row(l, ''));
}

function openBalance(host: ToolsHost): void {
  // A small sample keeps the wait short; the full report is `npm run report:balance`.
  const rows = speciesStrength(services().session.content, 'dashboard-v1', 50, 6).map((r) => ({ speciesId: r.speciesId, winRate: r.winRate, battles: r.battles }));
  page(host, 'Balance dashboard', textRows(balanceLines(balanceView(rows))));
}

function openBotReport(host: ToolsHost): void {
  pickTextFile((text) => page(host, 'Bot report', textRows(botReportLines(text))), '.jsonl,.json,.txt,application/json,text/plain');
}

function openReplayDiff(host: ToolsHost): void {
  const read = (text: string) => {
    try {
      const r = RunStateSchema.safeParse(JSON.parse(text));
      return r.success ? r.data : null;
    } catch {
      return null;
    }
  };
  pickTextFile((first) =>
    pickTextFile((second) => {
      const a = read(first);
      const b = read(second);
      page(host, 'Replay diff', textRows(a && b ? diffLines(diffRuns(a, b)) : ['One of the files is not a saved run.']));
    }),
  );
}

function openBerries(host: ToolsHost): void {
  const berries = berryEntries(services().session.content);
  page(host, 'Berry Bestiary', berries.map((b) => ({ ...row(b.name, b.effect, b.rarity), art: b.icon ?? undefined })), (n) => {
    const b = berries[n];
    if (b) page(host, b.name, textRows(berryLines(b)), () => undefined, () => openBerries(host));
  });
}

async function openProvenance(host: ToolsHost): Promise<void> {
  const { default: main } = await import('../../docs/quality/asset-provenance.md?raw');
  const frags = await Promise.all(Object.values(import.meta.glob<string>('../../docs/quality/provenance/*.md', { query: '?raw', import: 'default' })).map((load) => load()));
  const md = [main, ...frags].join('\n');
  page(host, 'Asset sources', textRows(provenanceLines(provenanceSources(md))));
}

const KEYS = { notes: 'pkr.replayNotes', votes: 'pkr.packVotes', frame: 'pkr.fanArt' } as const;

function openSeedBoards(host: ToolsHost): void {
  const { session } = services();
  const seeds = playedSeeds(session.profile.runHistory).slice(0, 12);
  const rows = seeds.length ? seeds.map((s) => row(s.seed, `${s.runs} run${s.runs === 1 ? '' : 's'}. Enter shows the board.`)) : [row('No runs yet', 'Finish a run to start a board. Runs that used debug tools never count.')];
  page(host, 'Seed leaderboard', rows, (n) => {
    const s = seeds[n];
    if (!s) return;
    const g = ghostFor(session.profile, s.seed);
    const board = seedLeaderboard(session.profile.runHistory, s.seed, g ? { from: g.from, victory: g.victory, badges: g.badges, encounters: g.encounters } : null);
    page(host, `Board: ${s.seed}`, board.map((b, i) => row(scoreLine(b, i + 1), '', b.mine ? 'You' : 'Friend')), () => undefined, () => openSeedBoards(host));
  });
}

async function openCoop(host: ToolsHost, draft: CoopDraft | null): Promise<void> {
  const { session } = services();
  if (!draft) {
    const form = { title: 'Co-op draft' } as const;
    const names = ((await ask(host, 'Two names, separated by a comma:', { ...form, heading: 'Type two names, with a comma between them', text: 'Two players take turns picking from one pool and share the team as a code.', ok: 'Next' }, 'Player 1, Player 2')) ?? '').split(',');
    const seed = (await ask(host, 'Seed for the pool (same seed = same pool):', { ...form, heading: 'Type a seed for the pool', text: 'The same seed gives the same pool.', ok: 'Start' }, String(Date.now() % 100000))) ?? '';
    const made = startCoop(wildEligibleSpecies(session.content).map((sp) => sp.id), seed, [names[0] ?? '', names[1] ?? '']);
    if ('problem' in made) return host.restart(made.problem);
    return openCoop(host, made);
  }
  const name = (id: string) => session.content.species.get(id)?.name ?? id;
  if (draftDone(draft)) {
    const { code } = coopTeam(draft);
    const rows = draft.picks.map((p) => row(name(p.speciesId), `Picked by ${draft.names[p.by]}`), ) as PickerRow[];
    rows.push(row('Team code', code ?? '', 'Copy'));
    return page(host, 'Co-op team', rows, (n) => {
      if (n === rows.length - 1 && code) void navigator.clipboard?.writeText(code).then(() => host.restart('Team code copied.'), () => void ask(host, 'Team code:', { title: 'Co-op team', heading: 'Team code', text: 'Copy this code and send it to your friend.', ok: 'Done' }, code));
    }, () => host.close());
  }
  const left = remaining(draft);
  page(host, `${draft.names[whoseTurn(draft)]}: pick ${draft.picks.length + 1} of ${COOP_SIZE}`, left.map((id) => row(name(id), '')), (n) => {
    const next = left[n] ? coopPick(draft, left[n]!) : null;
    if (next && !('problem' in next)) void openCoop(host, next);
  }, () => openTools(host));
}

async function openHotSeat(host: ToolsHost): Promise<void> {
  const { session } = services();
  const form = { title: 'Hot-seat versus' } as const;
  const names = ((await ask(host, 'Two names, separated by a comma:', { ...form, heading: 'Type two names, with a comma between them', text: 'Two people, one device: pick moves in turn and pass it on.', ok: 'Next' }, 'Player 1, Player 2')) ?? '').split(',');
  const seed = (await ask(host, 'Seed (same seed + same picks = same battle):', { ...form, heading: 'Type a seed for the battle', text: 'The same seed and the same picks give the same battle.', ok: 'Start' }, String(Date.now() % 100000))) ?? '';
  const pool = wildEligibleSpecies(session.content).map((sp) => sp.id).sort();
  const rng = new Rng(hashSeed(`${seed}#hotseat-teams`));
  const mix = rng.shuffle(pool);
  const h = startHotSeat(session.content, mix.slice(0, 3), mix.slice(3, 6), 50, seed, [names[0] ?? '', names[1] ?? '']);
  if ('problem' in h) return host.restart(h.problem);
  hotSeatPick(host, h, 0, 0);
}

function hotSeatPick(host: ToolsHost, h: HotSeat, side: 0 | 1, firstPick: number): void {
  const { session } = services();
  const winner = hotSeatWinner(h);
  if (winner !== null) return page(host, 'Hot-seat versus', [row(winner === 'draw' ? 'A draw.' : `${h.names[winner]} wins!`, `After ${h.turns} turns.`)], () => undefined, () => host.close());
  const opts = moveOptions(h, side);
  const me = activeMon(h, side);
  const foe = activeMon(h, side === 0 ? 1 : 0);
  const nm = (id: string) => session.content.species.get(id)?.name ?? id;
  page(host, `${h.names[side]}: choose a move`, opts.map((o) => row(o.name, `${nm(me.speciesId)} ${me.hp} HP vs ${nm(foe.speciesId)} ${foe.hp} HP`, `PP ${o.pp}`)), (n) => {
    if (side === 0) return page(host, 'Pass the device', [row(`Pass it to ${h.names[1]}`, 'Look away, player 1. Enter when ready.', 'Ready')], () => hotSeatPick(host, h, 1, n), () => undefined);
    const result = playTurn(h, firstPick, n);
    if ('problem' in result) return host.restart(result.problem);
    const names = { player: nm(activeMon(h, 0).speciesId), enemy: nm(activeMon(h, 1).speciesId), trainer: h.names[1], nameOf: (uid: string) => nm([...h.ctx.party, ...h.ctx.battle.enemyTeam].find((m) => m.uid === uid)?.speciesId ?? uid) };
    const lines = result.events.map((e) => eventText(session.content, names, e as never)).filter((t): t is string => !!t);
    page(host, `Turn ${h.turns}`, (lines.length ? lines : ['Nothing happened.']).map((l) => row(l, '')), () => hotSeatPick(host, h, 0, 0), () => hotSeatPick(host, h, 0, 0));
  }, () => openTools(host));
}

function openReplayList(host: ToolsHost): void {
  const runs = services().session.profile.runHistory.filter((r) => r.journal.length).slice(-15).reverse();
  const rows = runs.length ? runs.map((r) => row(`${r.seed}  ·  ${r.victory ? 'won' : 'lost'}`, `${r.journal.length} steps. Enter to watch.`)) : [row('Nothing to watch', 'Runs with a Journal can be replayed here.')];
  page(host, 'Replay viewer', rows, (n) => runs[n] && openReplay(host, runs[n]!.runId, runs[n]!.journal, 0));
}

function openReplay(host: ToolsHost, runId: string, journal: string[], index: number): void {
  const notes = parseNotes(device.get(KEYS.notes));
  const v = viewAt(journal, runId, index, notes);
  const rows = [
    row(v.line ?? '(empty)', `Step ${v.index + 1} of ${v.total}`),
    row('Next step', '', v.atEnd ? '' : 'Enter'),
    row('Previous step', '', v.atStart ? '' : 'Enter'),
    row(v.note ? `Note: ${v.note}` : 'Add a note', 'Notes stay on this device.', 'Edit'),
  ];
  page(host, 'Replay', rows, async (n) => {
    if (n === 1) openReplay(host, runId, journal, v.index + 1);
    else if (n === 2) openReplay(host, runId, journal, v.index - 1);
    else if (n === 3) {
      const text = await ask(host, 'Note for this step (empty clears it):', { title: 'Replay', heading: 'Write a note for this step', text: 'An empty note clears it. Notes stay on this device.', ok: 'Save' }, notes[noteKey(runId, v.index)] ?? '');
      if (text !== null) {
        const next = setNote(notes, journal, runId, v.index, text);
        if ('problem' in next) return host.restart(next.problem);
        device.set(KEYS.notes, JSON.stringify(next.notes));
      }
      openReplay(host, runId, journal, v.index);
    }
  }, () => openReplayList(host));
}

function openVoting(host: ToolsHost): void {
  const installed = loadStoredPacks(packStore).packs;
  const ids = installed.map((p) => p.id);
  const votes = parseVotes(device.get(KEYS.votes));
  const top = featured(votes, ids);
  const rows = [row('Enter a friend\'s vote code', 'Codes look like PV1.pack-id.Name. One vote per friend.', 'Add'), ...tally(votes, ids).map((t) => row(installed.find((p) => p.id === t.packId)?.name ?? t.packId, `Enter makes a vote code to send to friends`, `${t.votes}${t.packId === top ? ' ★' : ''}`))];
  if (!ids.length) rows.push(row('No packs installed', 'Add one in Mod packs first.'));
  const form = { title: 'Pack voting' } as const;
  page(host, 'Pack voting', rows, async (n) => {
    if (n === 0) {
      const code = await ask(host, 'Vote code:', { ...form, heading: 'Enter a friend\'s vote code', text: 'Codes look like PV1.pack-id.Name. One vote per friend.', ok: 'Add' });
      if (!code) return;
      const next = castVote(votes, code, ids);
      if ('problem' in next) return host.restart(next.problem);
      device.set(KEYS.votes, JSON.stringify(next.votes));
      return host.restart('Vote counted.');
    }
    const t = tally(votes, ids)[n - 1];
    if (!t) return;
    const me = (await ask(host, 'Your name:', { ...form, heading: 'Type your name', text: 'It goes into the vote code, so friends see whose vote it is.', ok: 'Next' }, 'Me')) ?? 'Me';
    await ask(host, 'Send this code to friends, or add it yourself:', { ...form, heading: 'Your vote code', text: 'Send this code to friends, or add it yourself.', ok: 'Done' }, voteCode(t.packId, me));
  });
}

function openFrame(host: ToolsHost): void {
  const posters = parsePosters(device.get(KEYS.frame));
  const rows: PickerRow[] = posters.map((p, i) => ({
    problem: null,
    hint: 'Enter removes this poster.',
    draw: (scene, box, w, h) => {
      const key = `fanart-${i}-${hashSeed(p.dataUrl).a}`;
      const show = () => box.scene && box.add(scene.add.image(34, h / 2, key).setDisplaySize(44, 44));
      if (scene.textures.exists(key)) show();
      else {
        scene.textures.once(`addtexture-${key}`, show);
        scene.textures.addBase64(key, p.dataUrl);
      }
      box.add(scene.add.text(70, h / 2, p.title, textStyle(18, COLORS.textLight, { wordWrap: { width: w - 150 } })).setOrigin(0, 0.5));
      box.add(scene.add.text(w - 12, h / 2, 'Remove', textStyle(15, COLORS.gold)).setOrigin(1, 0.5));
    },
  }));
  rows.push(row('Add a poster', `${posters.length} of 3 used. Pick an image; it is shrunk and kept on this device.`, 'Add'));
  page(host, 'Fan art frame', rows, (n) => {
    if (n < posters.length) {
      device.set(KEYS.frame, JSON.stringify(removePoster(posters, n)));
      return host.restart('Poster removed.');
    }
    pickPosterImage(
      (dataUrl, name) => {
        const next = addPoster(posters, name, dataUrl);
        if ('problem' in next) return host.restart(next.problem);
        device.set(KEYS.frame, JSON.stringify(next));
        host.restart('Poster added.');
      },
      (m) => host.restart(m),
    );
  });
}
