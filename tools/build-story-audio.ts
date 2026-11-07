// Builds src/data/audio/story_music.json: every story music piece, stinger and sound effect of
// Design v2 Part AD, each pointing at an existing catalog sound until real audio is composed
// (source "reuse"). Run: npm run data:story-audio. No audio is composed or licensed here.
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

type Kind = 'loop' | 'stem' | 'oneShot' | 'sfx';
interface Track { id: string; kind: Kind; group: string; lengthSec: number | null; source: 'reuse'; reuse: string; stemOf?: string; note?: string }
const tracks: Track[] = [];
const add = (id: string, kind: Kind, group: string, lengthSec: number | null, reuse: string, stemOf?: string, note?: string) =>
  tracks.push({ id, kind, group, lengthSec, source: 'reuse', reuse, ...(stemOf ? { stemOf } : {}), ...(note ? { note } : {}) });

const ARR = [['calm', 60], ['tense', 45], ['final', 75]] as const;
const LEIT_REUSE = { calm: 'bgm.hub', tense: 'bgm.event', final: 'bgm.credits' } as const;
const TEAM_REUSE = { calm: 'bgm.event', tense: 'bgm.battle_trainer', final: 'bgm.battle_elite' } as const;
for (const c of ['protagonist', 'ch_vance', 'ch_dara', 'ch_hale', 'ch_ines', 'ch_pip', 'ch_soren', 'ch_kael', 'ch_marisol', 'ch_gideon', 'ch_evander_ashgrove', 'ch_lysandra_quill', 'ch_marek_voss', 'ch_cass_verrin', 'ch_ilse_rennick', 'ch_selene_aurelian'])
  for (const [a, len] of ARR) add(`mu_lm_${c}_${a}`, 'loop', 'leitmotif', len, LEIT_REUSE[a], c);
for (const t of ['mythic_marauders', 'hollow_choir', 'ironvein_combine', 'pale_cartographers', 'wildfire_accord', 'gilt_circle'])
  for (const [a, len] of ARR) add(`mu_team_${t}_${a}`, 'loop', 'team', len, TEAM_REUSE[a], t);
const REGION_REUSE = { town: 'bgm.hub', route: 'bgm.map', tension: 'bgm.event' } as const;
for (const r of ['cairnmoor', 'tidewrack', 'orrery_basin']) for (const k of ['town', 'route', 'tension'] as const) add(`mu_region_${r}_${k}`, 'loop', 'region', 105, REGION_REUSE[k]);
const BATTLE = { rival: 'bgm.battle_rival', leader: 'bgm.battle_leader', elite: 'bgm.battle_elite', champion: 'bgm.battle_elite', team_leader: 'bgm.battle_trainer', legendary: 'bgm.raid.ultra', alpha: 'bgm.raid.max' } as const;
for (const [role, reuse] of Object.entries(BATTLE)) { add(`mu_battle_${role}_a`, 'loop', 'battle', 90, reuse); add(`mu_battle_${role}_b`, 'loop', 'battle', 60, reuse, undefined, 'phase B plays at +8 percent tempo'); }
const ST: [string, number, string][] = [
  ['st_feat', 5, 'ui.vs_flash'], ['st_keystone', 8, 'me.key_item'], ['st_evolution_moment', 6, 'me.evo_success'], ['st_bond_up', 3, 'me.pkmn_get'], ['st_archive_unlock', 3, 'me.key_item'],
  ['st_rel_up', 2, 'ui.select'], ['st_rel_down', 2, 'ui.cancel'], ['st_rel_gate', 2, 'ui.door'], ['st_news', 2, 'ui.page'], ['st_tip', 1, 'ui.exclaim'], ['st_badge_circuit', 6, 'me.badge'], ['st_league_gate', 8, 'bgm.victory_leader'],
];
for (const [id, len, reuse] of ST) add(id, 'oneShot', 'stinger', len, reuse);
add('mu_opening_montage', 'oneShot', 'opening', 90, 'bgm.menu');
for (const s of ['base', 'think', 'warm']) add(`mu_quiz_lab_${s}`, 'stem', 'quiz', 60, 'bgm.hub', 'mu_quiz_lab');
const SFX: [string, string][] = [
  ['se_page_flip', 'ui.page'], ['se_choice_hover', 'ui.cursor'], ['se_choice_confirm', 'ui.select'], ['se_tone_warm', 'ui.item'], ['se_tone_firm', 'ui.select'], ['se_tone_curious', 'ui.exclaim'], ['se_tone_humor', 'ui.cursor'],
  ['se_log_open', 'ui.menu_open'], ['se_log_close', 'ui.menu_close'], ['se_skip', 'ui.cancel'], ['se_note_added', 'ui.item'], ['se_archive_unlock', 'me.key_item'], ['se_name_confirm', 'ui.select'], ['se_error', 'ui.error'],
  ['se_rel_stage_up', 'ui.select'], ['se_rel_stage_down', 'ui.cancel'], ['se_rel_gate_open', 'ui.door'], ['se_rel_betrayal', 'ui.error'], ['se_rel_reconcile', 'ui.item'], ['se_rel_ripple', 'ui.cursor'], ['se_news_arrive', 'ui.page'], ['se_tip_arrive', 'ui.exclaim'],
  ['se_heartbond_tick', 'ui.cursor'], ['se_heartbond_level', 'me.pkmn_get'], ['se_heartbond_strain', 'ui.poison_step'], ['se_heartbond_override', 'ui.vs_flash'], ['se_keystone_open', 'ui.menu_open'], ['se_keystone_close', 'ui.menu_close'],
  ['se_feat_vignette_in', 'ui.vs_flash'], ['se_feat_timeslow', 'ui.vs_sword'], ['se_feat_resolve_spark', 'ui.ability'], ['se_feat_banner', 'ui.vs_flash'], ['se_feat_release', 'ui.recall'], ['se_feat_echo', 'ui.ability'],
];
for (const [id, reuse] of SFX) add(id, 'sfx', 'sfx', null, reuse);

const file = { status: 'limited', source: 'Story Overhaul Design v2 Part AD. Every track reuses an existing sound until composed; see docs/status/story-audio.md.', fadeMs: 2000, tracks };
writeFileSync(join(import.meta.dirname, '..', 'src', 'data', 'audio', 'story_music.json'), JSON.stringify(file, null, 1) + '\n');
console.log(`wrote ${tracks.length} story audio entries`);
