import { useState } from 'react';
import { format } from 'date-fns';
import type { CycleEntry } from '../../types/cycle';

interface Props {
  cycles: CycleEntry[];
  onDelete: (id: string) => void;
}

export default function CycleHistory({ cycles, onDelete }: Props) {
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

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

  // Sort ascending by local start date (oldest first) to assign chronological cycle numbers
  const sortedAsc = [...cycles].sort(
    (a, b) =>
      new Date(a.startDate + 'T00:00:00').getTime() -
      new Date(b.startDate + 'T00:00:00').getTime()
  );

  // Display newest first
  const displayList = [...sortedAsc].reverse();

  return (
    <div className="history-card">
      <h3 className="card-title">Cycle History</h3>
      <div className="history-list">
        {displayList.map((cycle) => {
          const cycleNumber = sortedAsc.findIndex((c) => c.id === cycle.id) + 1;
          const start = new Date(cycle.startDate + 'T00:00:00');
          const end = cycle.endDate ? new Date(cycle.endDate + 'T00:00:00') : null;
          const duration = end
            ? Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
            : null;
          const isPendingDelete = pendingDeleteId === cycle.id;

          return (
            <div className="history-item" key={cycle.id}>
              <span className="history-cycle-number">#{cycleNumber}</span>
              <div className="history-item-content">
                <div className="history-dates">
                  <span className="history-start">{format(start, 'MMM d, yyyy')}</span>
                  <span className="history-arrow">→</span>
                  <span className="history-end">
                    {end ? format(end, 'MMM d, yyyy') : '(ongoing)'}
                  </span>
                </div>
                {duration && (
                  <span className="history-duration">
                    {duration} day{duration !== 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {isPendingDelete ? (
                <div className="delete-confirm-actions">
                  <span className="delete-confirm-label">Delete?</span>
                  <button
                    type="button"
                    className="btn-confirm-delete"
                    onClick={() => {
                      onDelete(cycle.id);
                      setPendingDeleteId(null);
                    }}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    className="btn-cancel-delete"
                    onClick={() => setPendingDeleteId(null)}
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="btn btn-icon-delete"
                  onClick={() => setPendingDeleteId(cycle.id)}
                  title="Delete entry"
                >
                  🗑️
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
