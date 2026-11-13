// The Dossier's saved shape, kept free of data imports so the run schema can use it without an import cycle.
import { z } from 'zod';

export const CAST_STATUSES = ['at large', 'beaten', 'turned', 'ally'] as const;
export type CastStatus = (typeof CAST_STATUSES)[number];
export const CastEntrySchema = z.object({ status: z.enum(CAST_STATUSES), metAt: z.number().int().min(0) });
export type CastEntry = z.infer<typeof CastEntrySchema>;
