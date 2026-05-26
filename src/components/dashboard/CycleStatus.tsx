import type { CycleMetrics } from '../../types/cycle';

interface Props {
  metrics: CycleMetrics;
}

export default function CycleStatus({ metrics }: Props) {
  const { currentCycleDay, currentPhase, averageCycleLength, predictions, regularityScore } = metrics;
  const progress = Math.min(100, (currentCycleDay / averageCycleLength) * 100);
  const daysLeft = averageCycleLength - currentCycleDay;
  const nextPrediction = predictions[0];

  const phaseInfo: Record<string, { label: string; color: string; emoji: string }> = {
    menstrual: { label: 'Menstrual', color: '#FF6B9D', emoji: '🩸' },
    follicular: { label: 'Follicular', color: '#4ECDC4', emoji: '🌱' },
    ovulation: { label: 'Ovulation', color: '#FFE66D', emoji: '✨' },
    luteal: { label: 'Luteal', color: '#A78BFA', emoji: '🌙' },
  };

  const phase = phaseInfo[currentPhase];
  const circumference = 2 * Math.PI * 90;
  const dashOffset = circumference - (progress / 100) * circumference;
  const confidencePercent = nextPrediction ? Math.round(nextPrediction.confidence * 100) : 0;
  const confidenceLabel =
    confidencePercent >= 75 ? 'High' : confidencePercent >= 55 ? 'Medium' : 'Low';
  const formatDate = (date: string) =>
    new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });

  return (
    <div className="cycle-status-card">
      <div className="cycle-ring-container">
        <svg viewBox="0 0 200 200" className="cycle-ring">
          <defs>
            <linearGradient id="ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF6B9D" />
              <stop offset="50%" stopColor="#C44AFF" />
              <stop offset="100%" stopColor="#4ECDC4" />
            </linearGradient>
          </defs>
          <circle
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="8"
          />
          <circle
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke="url(#ring-gradient)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            transform="rotate(-90 100 100)"
            className="cycle-progress-ring"
          />
        </svg>
        <div className="cycle-ring-inner">
          <span className="cycle-day-number">Day {currentCycleDay}</span>
          <span className="cycle-phase-label" style={{ color: phase.color }}>
            {phase.emoji} {phase.label}
          </span>
        </div>
      </div>

      <div className="cycle-status-info">
        <div className="cycle-stat">
          <span className="stat-value">{daysLeft > 0 ? daysLeft : '—'}</span>
          <span className="stat-label">days until next period</span>
        </div>
        {nextPrediction && (
          <div className="cycle-stat">
            <span className="stat-value">
              {formatDate(nextPrediction.predictedStartDate)}-{formatDate(nextPrediction.predictedEndDate)}
            </span>
            <span className="stat-label">likely period range</span>
          </div>
        )}
      </div>

      {nextPrediction && (
        <div className="confidence-panel">
          <div className="confidence-copy">
            <span>Prediction confidence</span>
            <strong>{confidenceLabel}</strong>
          </div>
          <div className="confidence-meter" aria-label={`Prediction confidence ${confidencePercent}%`}>
            <span style={{ width: `${confidencePercent}%` }} />
          </div>
          <p>
            {regularityScore < 60
              ? 'Recent cycles vary more than usual, so estimates are broader right now.'
              : 'Estimate is based on your recent cycle pattern and may shift as you log more.'}
          </p>
        </div>
      )}
    </div>
  );
}
