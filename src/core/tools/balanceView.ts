// Balance Dashboard (idea S327): turns species win rates from the balance simulation (`quality/balanceSim`) into rows
// for a dev screen: strongest, weakest and the spread. Pure; the simulation itself runs elsewhere.

export interface StrengthRow { speciesId: string; winRate: number; battles: number }

export interface BalanceView {
  count: number;
  average: number;
  /** Highest first. */
  top: StrengthRow[];
  /** Lowest first. */
  bottom: StrengthRow[];
  /** How many species fall in each tenth of the win-rate range (0-10%, ... 90-100%). */
  histogram: number[];
}

export function balanceView(rows: StrengthRow[], size = 10): BalanceView {
  const sorted = [...rows].sort((a, b) => b.winRate - a.winRate || a.speciesId.localeCompare(b.speciesId));
  const histogram = new Array<number>(10).fill(0);
  for (const r of rows) histogram[Math.min(9, Math.floor(r.winRate * 10))]!++;
  const average = rows.length ? rows.reduce((n, r) => n + r.winRate, 0) / rows.length : 0;
  return { count: rows.length, average: Math.round(average * 1000) / 1000, top: sorted.slice(0, size), bottom: sorted.slice(-size).reverse(), histogram };
}

const bar = (n: number, max: number) => '█'.repeat(max ? Math.round((n / max) * 20) : 0);
const pct = (x: number) => `${Math.round(x * 100)}%`;

export function balanceLines(v: BalanceView): string[] {
  if (!v.count) return ['No species to show.'];
  const max = Math.max(...v.histogram);
  return [
    `${v.count} species, average win rate ${pct(v.average)}.`,
    'Strongest:', ...v.top.map((r) => `${r.speciesId}: ${pct(r.winRate)} of ${r.battles}`),
    'Weakest:', ...v.bottom.map((r) => `${r.speciesId}: ${pct(r.winRate)} of ${r.battles}`),
    'Spread (win rate by tenths):', ...v.histogram.map((n, i) => `${i * 10}-${i * 10 + 10}%  ${bar(n, max)} ${n}`),
  ];
}
