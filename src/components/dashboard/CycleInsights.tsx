import { differenceInCalendarDays } from 'date-fns';
import type { CycleEntry, CycleMetrics, DailyLog } from '../../types/cycle';

interface Props {
  cycles: CycleEntry[];
  dailyLogs: DailyLog[];
  metrics: CycleMetrics;
}

export default function CycleInsights({ cycles, dailyLogs, metrics }: Props) {
  const sorted = [...cycles].sort(
    (a, b) =>
      new Date(a.startDate + 'T00:00:00').getTime() -
      new Date(b.startDate + 'T00:00:00').getTime()
  );
  const latest = sorted[sorted.length - 1];
  const daysSinceLatest = latest
    ? differenceInCalendarDays(new Date(), new Date(latest.startDate + 'T00:00:00'))
    : 0;

  const notes: string[] = [];

  if (daysSinceLatest > metrics.averageCycleLength + 14) {
    notes.push('Welcome back. Want to update anything from the last few weeks?');
  }

  if (metrics.totalCyclesTracked < 3) {
    notes.push('Predictions will get steadier after a few logged cycles.');
  } else if (metrics.regularityScore < 60) {
    notes.push('Your recent cycles look more variable, so wider date ranges are shown.');
  } else {
    notes.push('Your recent cycle pattern is consistent enough for a narrower estimate.');
  }

  if (metrics.currentPhase === 'luteal') {
    notes.push('This phase is a useful time to notice energy, sleep, cravings, or mood changes.');
  }

  const symptomCounts = dailyLogs.reduce<Record<string, number>>((acc, log) => {
    for (const symptom of log.symptoms) {
      acc[symptom] = (acc[symptom] ?? 0) + 1;
    }
    return acc;
  }, {});
  const topSymptom = Object.entries(symptomCounts).sort((a, b) => b[1] - a[1])[0];
  if (topSymptom && topSymptom[1] >= 2) {
    notes.push(`${topSymptom[0]} is your most repeated recent symptom.`);
  }

  const lowEnergyLogs = dailyLogs.filter((log) => log.energy !== null && log.energy <= 2).length;
  if (lowEnergyLogs >= 2) {
    notes.push('Low-energy days have appeared more than once. Tracking sleep or stress may help spot a pattern.');
  }

  return (
    <section className="insight-panel" aria-label="Cycle insights">
      <div className="insight-header">
        <h3 className="card-title">Helpful Notes</h3>
        <span>Private by default</span>
      </div>
      <div className="insight-list">
        {notes.map((note) => (
          <p key={note}>{note}</p>
        ))}
      </div>
    </section>
  );
}
