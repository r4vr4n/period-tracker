import { format } from 'date-fns';
import type { CycleEntry } from '../../types/cycle';

interface Props {
  cycles: CycleEntry[];
  onDelete: (id: string) => void;
}

export default function CycleHistory({ cycles, onDelete }: Props) {
  if (cycles.length === 0) {
    return (
      <div className="history-card">
        <h3 className="card-title">Cycle History</h3>
        <div className="history-empty">
          <span className="empty-icon">📝</span>
          <p>No cycles logged yet. Use the dashboard to start tracking.</p>
        </div>
      </div>
    );
  }

  const sorted = [...cycles].sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  );

  return (
    <div className="history-card">
      <h3 className="card-title">Cycle History</h3>
      <div className="history-list">
        {sorted.map((cycle) => {
          const start = new Date(cycle.startDate + 'T00:00:00');
          const end = cycle.endDate ? new Date(cycle.endDate + 'T00:00:00') : null;
          const duration = end
            ? Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
            : null;

          return (
            <div className="history-item" key={cycle.id}>
              <div className="history-item-dot" />
              <div className="history-item-content">
                <div className="history-dates">
                  <span className="history-start">
                    {format(start, 'MMM d, yyyy')}
                  </span>
                  <span className="history-arrow">→</span>
                  <span className="history-end">
                    {end ? format(end, 'MMM d, yyyy') : '(ongoing)'}
                  </span>
                </div>
                {duration && (
                  <span className="history-duration">{duration} day{duration !== 1 ? 's' : ''}</span>
                )}
              </div>
              <button
                className="btn btn-icon-delete"
                onClick={() => onDelete(cycle.id)}
                title="Delete entry"
              >
                🗑️
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
