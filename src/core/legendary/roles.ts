// Battle roles for every Legendary and Mythical base species (Overhaul slice 12, THE OVERHAUL.md 3.6): so they are
// not just stronger ordinary Pokémon. Forms use their base species' role. Data: src/data/legendaryRoles.json.

import { z } from 'zod';
import rolesJson from '../../data/legendaryRoles.json';
import type { Content } from '../contentSchema';

export const LEGEND_ROLES = ['striker', 'powerhouse', 'wall', 'support', 'controller'] as const;
export type LegendRole = (typeof LEGEND_ROLES)[number];
const RoleSchema = z.enum(LEGEND_ROLES);

export const LegendRolesFileSchema = z.object({
  status: z.literal('supported'),
  source: z.string(),
  roles: z.record(RoleSchema, z.string().min(1)),
  species: z.record(z.string(), RoleSchema),
});
export const LEGEND_ROLE_DATA = LegendRolesFileSchema.parse(rolesJson);

/** The role of a Legendary or Mythical species (or form), or null for any other Pokémon. */
export function legendRoleOf(content: Content, speciesId: string): LegendRole | null {
  const s = content.species.get(speciesId);
  if (!s || !(s.tags.includes('legendary') || s.tags.includes('mythical'))) return null;
  return LEGEND_ROLE_DATA.species[s.form?.base ?? s.id] ?? null;
}
