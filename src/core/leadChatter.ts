// Companion Pokémon Dialogue (S129): the lead Pokémon comments on the road ahead. Pure: no RNG, so a preview or redraw never changes it.

import type { Content } from './contentSchema';
import type { RunState } from './state';
import { forecast } from './world';

const WEATHER_LINES: Record<string, string> = {
  rain: 'smells rain on the way',
  sun: 'squints at the bright road ahead',
  sandstorm: 'sneezes: sand ahead',
  hail: 'shivers at the cold wind',
  fog: 'sticks close: fog is coming',
};

/** One line from the lead Pokémon, or null when there is no lead or nothing to say. Friendlier leads talk more openly. */
export function leadChatter(content: Content, run: RunState): string | null {
  const lead = run.party.find((m) => m.hp > 0) ?? run.party[0];
  if (!lead) return null;
  const name = lead.care?.nickname ?? content.species.get(lead.speciesId)?.name ?? 'Your lead';
  const fc = forecast(content, run);
  if (fc && fc.startsIn <= 2) return `${name} ${WEATHER_LINES[fc.front.weather] ?? `watches the ${fc.front.weather} gather`}.`;
  if (lead.friendship >= 200) return `${name} trots ahead, sure the road is safe with you.`;
  if (lead.friendship < 70) return `${name} keeps glancing back, unsure about the road.`;
  const index = run.stage?.index ?? 0;
  const idle = [`${name} sniffs the air.`, `${name} looks up at you.`, `${name} stretches, ready for the next stop.`];
  return idle[index % idle.length]!;
}
