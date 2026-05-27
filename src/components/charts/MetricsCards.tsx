import type { CycleMetrics } from '../../types/cycle';

interface Props {
  metrics: CycleMetrics;
}

export default function MetricsCards({ metrics }: Props) {
  const cards = [
    {
      label: 'Avg Cycle',
      value: `${metrics.averageCycleLength}`,
      unit: 'days',
      icon: 'CL',
      color: '#FF6B9D',
    },
    {
      label: 'Avg Period',
      value: `${metrics.averagePeriodDuration}`,
      unit: 'days',
      icon: 'FL',
      color: '#C44AFF',
    },
    {
      label: 'Regularity',
      value: `${metrics.regularityScore}`,
      unit: '%',
      icon: 'RG',
      color: '#4ECDC4',
    },
    {
      label: 'Cycles Tracked',
      value: `${metrics.totalCyclesTracked}`,
      unit: '',
      icon: 'CT',
      color: '#FFE66D',
    },
    {
      label: 'Shortest',
      value: `${metrics.shortestCycle}`,
      unit: 'days',
      icon: 'MIN',
      color: '#45B7D1',
    },
    {
      label: 'Longest',
      value: `${metrics.longestCycle}`,
      unit: 'days',
      icon: 'MAX',
      color: '#F97316',
    },
  ];

  return (
    <div className="metrics-cards">
      {cards.map((card) => (
        <div className="metric-card" key={card.label}>
          <div className="metric-icon" style={{ background: `${card.color}22` }}>
            <span>{card.icon}</span>
          </div>
          <div className="metric-info">
            <span className="metric-value" style={{ color: card.color }}>
              {card.value}
              {card.unit && <small>{card.unit}</small>}
            </span>
            <span className="metric-label">{card.label}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
