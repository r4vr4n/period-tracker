import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import type { CycleEntry } from '../../types/cycle';

interface Props {
  cycles: CycleEntry[];
}

export default function CycleLengthChart({ cycles }: Props) {
  const sorted = [...cycles]
    .filter((c) => c.startDate)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  // Calculate cycle lengths
  const data: { name: string; length: number; index: number }[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const days = Math.round(
      (new Date(sorted[i].startDate + 'T00:00:00').getTime() - new Date(sorted[i - 1].startDate + 'T00:00:00').getTime()) /
      (1000 * 60 * 60 * 24)
    );
    if (days > 0 && days < 60) {
      data.push({
        name: new Date(sorted[i].startDate + 'T00:00:00').toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        length: days,
        index: i,
      });
    }
  }

  const average = data.length > 0 ? Math.round(data.reduce((s, d) => s + d.length, 0) / data.length) : 28;

  if (data.length === 0) {
    return (
      <div className="chart-card">
        <h3 className="card-title">Cycle Length Trend</h3>
        <div className="chart-empty">
          <p>Log at least 2 cycles to see trends</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chart-card">
      <h3 className="card-title">Cycle Length Trend</h3>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="cycleLengthGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FF6B9D" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#FF6B9D" stopOpacity={0.02} />
              </linearGradient>
            </defs>
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
              domain={['dataMin - 3', 'dataMax + 3']}
            />
            <Tooltip
              contentStyle={{
                background: 'rgba(20,16,36,0.95)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                color: '#fff',
              }}
              formatter={(value: any) => [`${value} days`, 'Cycle Length']}
            />
            <ReferenceLine
              y={average}
              stroke="#C44AFF"
              strokeDasharray="5 5"
              label={{
                value: `Avg: ${average}d`,
                fill: '#C44AFF',
                fontSize: 12,
                position: 'insideTopRight',
              }}
            />
            <Area
              type="monotone"
              dataKey="length"
              stroke="#FF6B9D"
              strokeWidth={2.5}
              fill="url(#cycleLengthGrad)"
              dot={{ fill: '#FF6B9D', strokeWidth: 0, r: 4 }}
              activeDot={{ r: 6, fill: '#FF6B9D', stroke: '#fff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
