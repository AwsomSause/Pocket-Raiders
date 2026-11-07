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
import textThemes from './text/themes.json';
import rivalsText from './text/rivals.en.json';
import hash from './hash.json';
import starterArcs from './starterArcs.json';
import starterArcsText from './text/starterArcs.en.json';
import { withStarterArcs } from './starterArcs';
import questArcs from './questArcs.json';
import questArcsText from './text/questArcs.en.json';
import { withQuestArcs } from './questArcs';

export const RAW_STORY: Record<string, unknown> = withQuestArcs(withStarterArcs({ characters, events, arcs, themes, remembrances, moveMoments, dialogue, lore, news, interactables, backstories, quiz, blueprintRules, rivals, rivalThemes, starterArcs, questArcs, text: { ...text, ...questArcsText, ...rivalsText, ...starterArcsText, ...textThemes }, hash: hash.hash }));
