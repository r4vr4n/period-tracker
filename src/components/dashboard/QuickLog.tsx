import { useState } from 'react';
import { format } from 'date-fns';

interface Props {
  onLogCompletePeriod: (startDate: string, endDate: string) => void;
}

export default function QuickLog({ onLogCompletePeriod }: Props) {
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (new Date(endDate) < new Date(startDate)) {
      alert('End date cannot be before start date.');
      return;
    }
    onLogCompletePeriod(startDate, endDate);
  };

  return (
    <div className="quick-log-card">
      <h3 className="card-title">Log Period</h3>

      <form onSubmit={handleSubmit} className="custom-date-picker" style={{ display: 'flex', borderTop: 'none', paddingTop: 0 }}>
        <div className="complete-period-inputs">
          <div className="date-input-group">
            <label htmlFor="period-start-date">Start Date</label>
            <input
              id="period-start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="date-input"
              required
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
              required
            />
          </div>
        </div>
        <button type="submit" className="btn btn-primary">
          Log Complete Period
        </button>
      </form>
    </div>
  );
}
