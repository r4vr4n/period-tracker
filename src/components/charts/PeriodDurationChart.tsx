import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { CycleEntry } from '../../types/cycle';
import type { DailyLog } from '../../types/cycle';

interface Props {
  cycles: CycleEntry[];
  dailyLogs: DailyLog[];
}

const COLORS = ['#FF6B9D', '#C44AFF', '#4ECDC4', '#FFE66D', '#45B7D1', '#F97316'];

export default function PeriodDurationChart({ cycles, dailyLogs }: Props) {
  const data = cycles
    .filter((c) => c.startDate && c.endDate)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .map((c, i) => {
      const duration =
        Math.round(
          (new Date(c.endDate! + 'T00:00:00').getTime() - new Date(c.startDate + 'T00:00:00').getTime()) /
          (1000 * 60 * 60 * 24)
        ) + 1;
      return {
        name: new Date(c.startDate + 'T00:00:00').toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        duration,
        index: i,
      };
    })
    .filter((d) => d.duration > 0 && d.duration < 15);

  if (data.length === 0) {
    return (
      <div className="chart-card">
        <h3 className="card-title">Period Duration</h3>
        <div className="chart-empty">
          <p>Log complete periods (start & end) to see durations</p>
        </div>
      </div>
    );
  }

  const average = Math.round(data.reduce((sum, item) => sum + item.duration, 0) / data.length);
  const symptomCounts = dailyLogs.reduce<Record<string, number>>((acc, log) => {
    for (const symptom of log.symptoms) acc[symptom] = (acc[symptom] ?? 0) + 1;
    return acc;
  }, {});
  const topSymptom = Object.entries(symptomCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

  return (
    <div className="chart-card">
      <h3 className="card-title">Period Duration</h3>
      <p className="chart-summary">
        Your completed periods average {average} day{average === 1 ? '' : 's'}
        {topSymptom ? `, with ${topSymptom.toLowerCase()} showing up most often.` : '.'}
      </p>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis
              dataKey="name"
              stroke="rgba(255,255,255,0.4)"
              fontSize={12}
              tickLine={false}
            />
            <YAxis
              stroke="rgba(255,255,255,0.4)"
              fontSize={12}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                background: 'rgba(20,16,36,0.95)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                color: '#fff',
              }}
              formatter={(value) => [`${value ?? '—'} days`, 'Duration']}
            />
            <Bar dataKey="duration" radius={[6, 6, 0, 0]}>
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
