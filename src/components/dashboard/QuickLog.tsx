import { useState } from 'react';
import { format } from 'date-fns';

interface Props {
  onLogCompletePeriod: (startDate: string, endDate: string) => Promise<void>;
}

export default function QuickLog({ onLogCompletePeriod }: Props) {
  const today = format(new Date(), 'yyyy-MM-dd');
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStartChange = (val: string) => {
    setStartDate(val);
    // Auto-snap end date forward if it would be before the new start
    if (endDate < val) setEndDate(val);
    setFormError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (endDate < startDate) {
      setFormError('End date must be on or after the start date.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onLogCompletePeriod(startDate, endDate);
      // Reset form to today after a successful save
      setStartDate(today);
      setEndDate(today);
    } catch {
      setFormError('Failed to save. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="quick-log-card">
      <h3 className="card-title">Log Period</h3>

      <form
        onSubmit={handleSubmit}
        className="custom-date-picker"
        style={{ display: 'flex', borderTop: 'none', paddingTop: 0 }}
      >
        <div className="complete-period-inputs">
          <div className="date-input-group">
            <label htmlFor="period-start-date">Start Date</label>
            <input
              id="period-start-date"
              type="date"
              value={startDate}
              max={today}
              onChange={(e) => handleStartChange(e.target.value)}
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
              min={startDate}
              max={today}
              onChange={(e) => { setEndDate(e.target.value); setFormError(''); }}
              className="date-input"
              required
            />
          </div>
        </div>

        {formError && <p className="form-error">{formError}</p>}

        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : 'Log Period'}
        </button>
      </form>
    </div>
  );
}
