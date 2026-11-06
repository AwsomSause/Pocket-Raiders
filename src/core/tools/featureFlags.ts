// Feature Flags (idea S332): switches for optional or experimental parts of the game, kept on this device (never in a
// save). A flag only decides whether something is shown; it never changes a roll or a rule. Unknown flag names in
// storage are ignored. Pure: storage is passed in.

export interface FeatureFlag {
  id: string;
  label: string;
  blurb: string;
  /** Value when the player never touched it. */
  default: boolean;
}

export const FEATURE_FLAGS: FeatureFlag[] = [
  { id: 'devTools', label: 'Developer tools', blurb: 'Shows the balance dashboard, bot report, replay diff and asset sources in Tools & Community.', default: false },
  { id: 'commentary', label: 'Run commentary', blurb: 'A narrator line after notable events on the map. Text only; never changes a roll.', default: false },
];

export interface FlagStore {
  get(key: string): string | null;
  set(key: string, value: string): void;
}

const KEY = 'pkr.flags';

function readAll(store: FlagStore): Record<string, boolean> {
  try {
    const parsed: unknown = JSON.parse(store.get(KEY) ?? '{}');
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return {};
    const out: Record<string, boolean> = {};
    for (const f of FEATURE_FLAGS) {
      const v = (parsed as Record<string, unknown>)[f.id];
      if (typeof v === 'boolean') out[f.id] = v;
    }
    return out;
  } catch {
    return {};
  }
}

export function flagOn(store: FlagStore, id: string): boolean {
  const flag = FEATURE_FLAGS.find((f) => f.id === id);
  if (!flag) return false;
  return readAll(store)[id] ?? flag.default;
}

/** Sets a known flag. Returns false for an unknown id. */
export function setFlag(store: FlagStore, id: string, on: boolean): boolean {
  if (!FEATURE_FLAGS.some((f) => f.id === id)) return false;
  store.set(KEY, JSON.stringify({ ...readAll(store), [id]: on }));
  return true;
}

export const flagList = (store: FlagStore): { flag: FeatureFlag; on: boolean }[] => FEATURE_FLAGS.map((flag) => ({ flag, on: flagOn(store, flag.id) }));
