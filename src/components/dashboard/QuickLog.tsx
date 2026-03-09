import { useState } from 'react';
import { format } from 'date-fns';

interface Props {
  onLogPeriodStart: (date: string) => void;
  onLogPeriodEnd: (date: string) => void;
  hasOngoingPeriod: boolean;
}

export default function QuickLog({ onLogPeriodStart, onLogPeriodEnd, hasOngoingPeriod }: Props) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [mode, setMode] = useState<'start' | 'end'>('start');

  const handleQuickStart = () => {
    onLogPeriodStart(format(new Date(), 'yyyy-MM-dd'));
  };

  const handleQuickEnd = () => {
    onLogPeriodEnd(format(new Date(), 'yyyy-MM-dd'));
  };

  const handleCustomDate = () => {
    if (mode === 'start') {
      onLogPeriodStart(selectedDate);
    } else {
      onLogPeriodEnd(selectedDate);
    }
    setShowDatePicker(false);
  };

  return (
    <div className="quick-log-card">
      <h3 className="card-title">Quick Log</h3>

      <div className="quick-log-buttons">
        {!hasOngoingPeriod ? (
          <button className="btn btn-period-start" onClick={handleQuickStart}>
            <span className="btn-icon">🩸</span>
            Period Started Today
          </button>
        ) : (
          <button className="btn btn-period-end" onClick={handleQuickEnd}>
            <span className="btn-icon">✅</span>
            Period Ended Today
          </button>
        )}
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => setShowDatePicker(!showDatePicker)}
        >
          📅 Log custom date
        </button>
      </div>

      {showDatePicker && (
        <div className="custom-date-picker">
          <div className="date-mode-toggle">
            <button
              className={`toggle-btn ${mode === 'start' ? 'active' : ''}`}
              onClick={() => setMode('start')}
            >
              Period Start
            </button>
            <button
              className={`toggle-btn ${mode === 'end' ? 'active' : ''}`}
              onClick={() => setMode('end')}
            >
              Period End
            </button>
          </div>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="date-input"
          />
          <button className="btn btn-primary btn-sm" onClick={handleCustomDate}>
            Log Date
          </button>
        </div>
      )}
    </div>
  );
}
