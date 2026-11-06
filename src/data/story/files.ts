// Loads the story JSON (src/data/story/*.json) into one validated StoryData object. Pure; used by buildContent and tools/build-story.ts.
import { StoryDataSchema, type StoryData } from '../../core/story2/schema';

// (tools/lib/storyFiles.ts keeps the same list for node-only tools.)
export const STORY_FILES = ['characters', 'events', 'arcs', 'themes', 'remembrances', 'moveMoments', 'dialogue', 'lore', 'news', 'interactables', 'backstories', 'quiz', 'blueprintRules'] as const;

export function storyDataFromFiles(raw: Record<string, unknown>): StoryData {
  const parsed = StoryDataSchema.safeParse(raw);
  if (!parsed.success) throw new Error(parsed.error.issues.map((i) => `story/${String(i.path[0])}.json ${i.path.slice(1).join('.')}: ${i.message}`).join('\n'));
  return parsed.data;
}
