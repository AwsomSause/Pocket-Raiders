// Dumps every boss's teams with their designated gimmicks as JSON for tools/boss-gimmick-dex.py (the visual).
//   node tools/build-boss-gimmick-dex.ts <out.json>
import { writeFileSync } from 'node:fs';
import type * as Data from '../src/data/index.ts';
import type * as Gim from '../src/core/battle/bossGimmicks.ts';
import type * as Transform from '../src/core/battle/transform.ts';
import type * as Pokemon from '../src/core/pokemon.ts';
import type * as Heights from '../src/core/heights.ts';
import { closeModules, loadModule } from './lib/gameModules.ts';

const { buildContent } = await loadModule<typeof Data>('/src/data/index.ts');
const { planBossGimmicks, gimmickSlots, bossGimmickData } = await loadModule<typeof Gim>('/src/core/battle/bossGimmicks.ts');
const { stoneForms, bossZMove } = await loadModule<typeof Transform>('/src/core/battle/transform.ts');
const { createPokemon, abilityOf } = await loadModule<typeof Pokemon>('/src/core/pokemon.ts');
const { pokemonHeightM, trainerHeightM } = await loadModule<typeof Heights>('/src/core/heights.ts');
await closeModules();
const content = buildContent();
const after = content.balance.transformations.bossGimmickAfterStage;
const sprite = (id: string) => content.species.get(id)?.assets.sprite ?? null;

const species: Record<string, { name: string; sprite: string | null; h: number }> = {};
const note = (id: string) => (species[id] ??= { name: content.species.get(id)?.name ?? id, sprite: sprite(id), h: content.species.has(id) ? pokemonHeightM(content.species.get(id)!) : 1 });
const bosses = [...content.bosses.values()].sort((a, b) => a.name.localeCompare(b.name)).map((boss) => {
  const entry = bossGimmickData[boss.id]!;
  const roles = (['gym', 'elite', 'champion'] as const).map((role) =>
    boss.teams[role].map((team, i) => {
      const regionIndex = role === 'gym' ? Math.floor(i / 8) : i;
      const stageInRegion = role === 'gym' ? (i % 8) + 1 : null;
      const slots = gimmickSlots(regionIndex, stageInRegion, after);
      const mons = team.members.map((m, k) => {
        const mon = createPokemon(content, m.speciesId, team.level, `${boss.id}:${role}:${i}:${k}`);
        mon.moves = m.moves.map((id) => ({ id, pp: 10 }));
        return mon;
      });
      const plan = planBossGimmicks(content, boss.id, mons, slots);
      return {
        level: team.level, region: regionIndex + 1, stage: stageInRegion, slots,
        members: mons.map((mon) => {
          const kind = plan[mon.uid] ?? null;
          note(mon.speciesId);
          const out: Record<string, unknown> = { s: mon.speciesId };
          if (kind) out.g = kind;
          if (kind === 'mega') { const f = stoneForms(content, mon.speciesId, false)[0]!.formId; note(f); out.f = f; }
          if (kind === 'zmove') out.z = bossZMove(content, mon)!.type;
          if (kind === 'tera') out.t = boss.types[0];
          // Flying types and levitators hover (same rule as the battle screen, using the Mega form's types); everyone else stands on the ground.
          if (content.species.get((out.f as string | undefined) ?? mon.speciesId)?.types.includes('flying') || ['levitate', 'eelevate'].includes(abilityOf(content, mon) ?? '')) out.fl = 1;
          return out;
        }),
      };
    }),
  );
  for (const s of boss.signature) if (content.species.has(s)) note(s);
  for (const s of Object.values(entry.mons)) note(s);
  return { id: boss.id, th: trainerHeightM(boss.id), name: boss.name, types: boss.types, sprite: boss.sprites.default, order: entry.order, mons: entry.mons, signature: boss.signature, gym: roles[0], elite: roles[1], champion: roles[2] };
});
note('charizard');
const legend = { normal: 'charizard', mega: note(stoneForms(content, 'charizard', false)[0]!.formId) && stoneForms(content, 'charizard', false)[0]!.formId };
writeFileSync(process.argv[2]!, JSON.stringify({ afterStage: after, legend, species, bosses }));
console.log(`${bosses.length} bosses, ${Object.keys(species).length} species`);
