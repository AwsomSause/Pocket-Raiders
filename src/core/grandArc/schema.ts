// The Grand Arc (Beta 0.6 slice E7): Data ROMs from Cipher's liaisons and the Stock track. Pure data + Zod, no Phaser.

import { z } from 'zod';

/** `run.expansion.grandArc`. Present only when the Grand Arc setting was on when the run started. */
export const GrandArcStateSchema = z.object({
  /** Data ROMs earned in their own region ("K"); each opens one lock on XD001 and one bank of tanks. */
  roms: z.array(z.string()).default([]),
  /** ROMs taken late from their liaison at the finale: a bank of tanks, no lock. */
  late: z.array(z.string()).default([]),
  /** Stock steps gained so far (1 to 5, each at most once). */
  stock: z.array(z.number().int().min(1).max(5)).default([]),
  /** Region ids whose liaison left unbeaten (they return at the finale). */
  left: z.array(z.string()).default([]),
});
export type GrandArcState = z.infer<typeof GrandArcStateSchema>;
export const freshGrandArc = (): GrandArcState => GrandArcStateSchema.parse({});
