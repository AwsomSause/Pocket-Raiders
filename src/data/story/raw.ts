// The story JSON files, imported once. Later slices split big packs into lazy chunks (see the design doc, Performance).
import characters from './characters.json';
import events from './events.json';
import arcs from './arcs.json';
import themes from './themes.json';
import remembrances from './remembrances.json';
import moveMoments from './moveMoments.json';
import dialogue from './dialogue.json';
import lore from './lore.json';
import news from './news.json';
import interactables from './interactables.json';
import backstories from './backstories.json';
import quiz from './quiz.json';
import blueprintRules from './blueprintRules.json';
import rivals from './rivals.json';
import rivalThemes from './rivalThemes.json';
import text from './text/en.json';
import rivalsText from './text/rivals.en.json';
import hash from './hash.json';

export const RAW_STORY: Record<string, unknown> = { characters, events, arcs, themes, remembrances, moveMoments, dialogue, lore, news, interactables, backstories, quiz, blueprintRules, rivals, rivalThemes, text: { ...text, ...rivalsText }, hash: hash.hash };
