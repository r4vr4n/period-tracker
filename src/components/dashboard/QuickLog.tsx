import { useEffect, useState } from 'react';
import { addDays, format, isAfter, parseISO, subDays } from 'date-fns';
import type { CycleEntry, CycleMetrics } from '../../types/cycle';

interface Props {
  cycles: CycleEntry[];
  metrics: CycleMetrics | null;
  usualFlowDays: number;
  onStartPeriodToday: () => Promise<void>;
  onEndActivePeriod: (endDate: string) => Promise<void>;
  onLogCompletePeriod: (startDate: string, endDate: string) => Promise<void>;
  onSoftLog: (message: string) => void;
}

export default function QuickLog({
  cycles,
  metrics,
  usualFlowDays,
  onStartPeriodToday,
  onEndActivePeriod,
  onLogCompletePeriod,
  onSoftLog,
}: Props) {
  const today = format(new Date(), 'yyyy-MM-dd');
  const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
  const activePeriod = cycles.find((cycle) => !cycle.endDate);
  const dailyLogKey = `flo-cycle-daily-log-${today}`;
  const savedDailyLog = (() => {
    try {
      const raw = localStorage.getItem(dailyLogKey);
      return raw ? JSON.parse(raw) as { symptoms?: string[]; spotting?: boolean } : {};
    } catch {
      return {};
    }
  })();
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>(savedDailyLog.symptoms ?? []);
  const [spottingSelected, setSpottingSelected] = useState(Boolean(savedDailyLog.spotting));

  const symptomChips = ['Cramps', 'Tired', 'Cravings', 'Irritable', 'Headache', 'Tender breasts'];

  useEffect(() => {
    localStorage.setItem(
      dailyLogKey,
      JSON.stringify({ symptoms: selectedSymptoms, spotting: spottingSelected })
    );
  }, [dailyLogKey, selectedSymptoms, spottingSelected]);

  const handleStartChange = (val: string) => {
    setStartDate(val);
    const suggestedEnd = addDays(parseISO(val), Math.max(0, usualFlowDays - 1));
    const cappedEnd = isAfter(suggestedEnd, new Date()) ? today : format(suggestedEnd, 'yyyy-MM-dd');
    setEndDate(cappedEnd);
    setFormError('');
  };

  const runAction = async (action: () => Promise<void>) => {
    setIsSubmitting(true);
    setFormError('');
    try {
      await action();
    } catch {
      setFormError('Failed to save. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms((current) => {
      const next = current.includes(symptom)
        ? current.filter((item) => item !== symptom)
        : [...current, symptom];
      if (!current.includes(symptom)) {
        onSoftLog(`${symptom} saved for today.`);
      }
      return next;
    });
  };

  const toggleSpotting = () => {
    setSpottingSelected((selected) => {
      const next = !selected;
      if (next) onSoftLog('Spotting saved for today.');
      return next;
    });
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
      <div className="quick-log-header">
        <div>
          <h3 className="card-title">Quick Log</h3>
          <p>{activePeriod ? 'Period is currently active.' : 'Two taps for the common stuff.'}</p>
        </div>
        {metrics && (
          <span className="quick-log-context">
            usual period {metrics.averagePeriodDuration} days
          </span>
        )}
      </div>

      <div className="quick-actions">
        {activePeriod ? (
          <>
            <button
              type="button"
              className="quick-action primary"
              disabled={isSubmitting}
              onClick={() => runAction(() => onEndActivePeriod(today))}
            >
              <span>End today</span>
              <small>finish active period</small>
            </button>
            <button
              type="button"
              className="quick-action"
              disabled={isSubmitting}
              onClick={() => runAction(() => onEndActivePeriod(yesterday))}
            >
              <span>Ended yesterday</span>
              <small>smart default</small>
            </button>
          </>
        ) : (
          <button
            type="button"
            className="quick-action primary wide"
            disabled={isSubmitting}
            onClick={() => runAction(onStartPeriodToday)}
          >
            <span>Start Period</span>
            <small>saved locally</small>
          </button>
        )}
        <button
          type="button"
          className={`quick-action ${spottingSelected ? 'selected' : ''}`}
          onClick={toggleSpotting}
        >
          <span>Spotting</span>
          <small>{spottingSelected ? 'saved today' : 'note today'}</small>
        </button>
      </div>

      <div className="symptom-chip-row" aria-label="Common symptom shortcuts">
        {symptomChips.map((symptom) => (
          <button
            type="button"
            key={symptom}
            className={`symptom-chip ${selectedSymptoms.includes(symptom) ? 'selected' : ''}`}
            onClick={() => toggleSymptom(symptom)}
          >
            {symptom}
          </button>
        ))}
      </div>

      <button
        type="button"
        className="details-toggle"
        onClick={() => setDetailsOpen((open) => !open)}
        aria-expanded={detailsOpen}
      >
        {detailsOpen ? 'Hide backfill dates' : 'Add or backfill dates'}
      </button>

      <form
        onSubmit={handleSubmit}
        className={`custom-date-picker ${detailsOpen ? 'open' : ''}`}
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
          {isSubmitting ? 'Saving...' : 'Save dates'}
        </button>
      </form>
    </div>
  );
}
