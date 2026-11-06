// Trainer importance I1 to I4 (Story Overhaul W1, design 14.8). A derived value, never stored: it says how much unique
// content a trainer may have (lines, intro, cinematic). It never changes stats; stats come from skill tiers and stage plans.

export type Importance = 'I1' | 'I2' | 'I3' | 'I4';

export interface TrainerFacts {
  role: 'route' | 'gym' | 'elite' | 'champion' | 'grunt' | 'specialist' | 'executive' | 'leader' | 'rival' | 'mentor' | 'boss';
  /** Trainer class id (ace-trainer and veteran are I2). */
  classId?: string;
  rivalSlot?: 'major' | 'additional' | 'friendly';
  /** Times the player has fought this trainer in the run. */
  timesFought?: number;
  /** The `important` flag on the trainer record. */
  important?: boolean;
  /** A boss that no region lists (I2), or an original `drive` boss placed in a region (I3). */
  regionListed?: boolean;
  drive?: boolean;
  /** I4 triggers: the major rival from Act 5 or region 6 on, the final antagonist, the Grand Region's top eight. */
  lateMajorRival?: boolean;
  finalAntagonist?: boolean;
  grandTopEight?: boolean;
}

export function importanceOf(f: TrainerFacts): Importance {
  if (f.role === 'champion' || f.finalAntagonist || f.grandTopEight || (f.role === 'rival' && f.rivalSlot === 'major' && f.lateMajorRival)) return 'I4';
  if (f.role === 'gym' || f.role === 'elite' || f.role === 'executive' || f.role === 'leader' || f.role === 'mentor' || (f.role === 'rival' && f.rivalSlot !== undefined)) return 'I3';
  if (f.role === 'boss') return f.drive && f.regionListed ? 'I3' : 'I2';
  if (f.role === 'specialist' || f.important || (f.timesFought ?? 0) >= 2 || f.classId === 'ace-trainer' || f.classId === 'veteran') return 'I2';
  return 'I1';
}
