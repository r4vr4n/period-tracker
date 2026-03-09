import { useState } from 'react';
import { format } from 'date-fns';

interface Props {
  onLogPeriodStart: (date: string) => void;
  onLogPeriodEnd: (date: string) => void;
  onLogCompletePeriod: (startDate: string, endDate: string) => void;
  hasOngoingPeriod: boolean;
}

export default function QuickLog({ onLogPeriodStart, onLogPeriodEnd, onLogCompletePeriod, hasOngoingPeriod }: Props) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [mode, setMode] = useState<'start' | 'end' | 'complete'>('start');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const handleQuickStart = () => {
    onLogPeriodStart(format(new Date(), 'yyyy-MM-dd'));
  };

  const handleQuickEnd = () => {
    onLogPeriodEnd(format(new Date(), 'yyyy-MM-dd'));
  };

  const handleCustomDate = () => {
    if (mode === 'start') {
      onLogPeriodStart(selectedDate);
    } else if (mode === 'end') {
      onLogPeriodEnd(selectedDate);
    } else if (mode === 'complete') {
      onLogCompletePeriod(startDate, endDate);
    }
    setShowDatePicker(false);
  };

  return (
    <div className="quick-log-card">
      <h3 className="card-title">Quick Log</h3>

      <div className="quick-log-buttons">
        {!hasOngoingPeriod ? (
          <button type="button" className="btn btn-period-start" onClick={handleQuickStart}>
          
            <span className="btn-icon">🩸</span>
            Period Started Today
          </button>
        ) : (
          <button type="button" className="btn btn-period-end" onClick={handleQuickEnd}>
            <span className="btn-icon">✅</span>
            Period Ended Today
          </button>
        )}
        <button
          type="button"
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
              type="button"
              className={`toggle-btn ${mode === 'start' ? 'active' : ''}`}
              onClick={() => setMode('start')}
            >
              Period Start
            </button>
            <button
              type="button"
              className={`toggle-btn ${mode === 'end' ? 'active' : ''}`}
              onClick={() => setMode('end')}
            >
              Period End
            </button>
            <button
              type="button"
              className={`toggle-btn ${mode === 'complete' ? 'active' : ''}`}
              onClick={() => setMode('complete')}
            >
              Complete Period
            </button>
          </div>
          {mode === 'complete' ? (
            <div className="complete-period-inputs">
              <div className="date-input-group">
                <label htmlFor="period-start-date">Start Date</label>
                <input
                  id="period-start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="date-input"
                />
              </div>
              <div className="date-input-group">
                <label htmlFor="period-end-date">End Date</label>
                <input
                  id="period-end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="date-input"
                />
              </div>
            </div>
          ) : (
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="date-input"
            />
          )}
          <button type="button" className="btn btn-primary btn-sm" onClick={handleCustomDate}>
            Log {mode === 'complete' ? 'Period' : mode === 'start' ? 'Start' : 'End'}
          </button>
        </div>
      )}
    </div>
  );
}
