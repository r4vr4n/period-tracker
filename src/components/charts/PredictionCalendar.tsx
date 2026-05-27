import { useState, useMemo } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  parseISO,
} from 'date-fns';
import type { CycleEntry, CyclePrediction, FertileWindow } from '../../types/cycle';
import type { DailyLog } from '../../types/cycle';

interface Props {
  cycles: CycleEntry[];
  dailyLogs: DailyLog[];
  predictions: CyclePrediction[];
  fertileWindow: FertileWindow | null;
  showFertility: boolean;
  onLogPeriod: (startDate: string, endDate: string) => Promise<void>;
  onSaveDailyLog: (
    date: string,
    data: Partial<Pick<DailyLog, 'symptoms' | 'mood' | 'energy' | 'spotting' | 'note'>>
  ) => Promise<void>;
  onSoftLog: (message: string) => void;
}

export default function PredictionCalendar({
  cycles,
  dailyLogs,
  predictions,
  fertileWindow,
  showFertility,
  onLogPeriod,
  onSaveDailyLog,
  onSoftLog,
}: Props) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const symptomShortcuts = ['Cramps', 'Tired', 'Cravings', 'Headache'];

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(monthEnd);

  // Build day => status map
  const dayStatus = useMemo(() => {
    const map = new Map<string, Set<string>>();
    const addStatus = (dateStr: string, status: string) => {
      if (!map.has(dateStr)) map.set(dateStr, new Set());
      map.get(dateStr)!.add(status);
    };

    // Past periods
    for (const c of cycles) {
      if (!c.startDate) continue;
      const start = parseISO(c.startDate);
      const end = c.endDate ? parseISO(c.endDate) : start;
      let d = start;
      while (d <= end) {
        addStatus(format(d, 'yyyy-MM-dd'), 'period');
        d = addDays(d, 1);
      }
    }

    // Predicted periods
    for (const p of predictions) {
      const start = parseISO(p.predictedStartDate);
      const end = parseISO(p.predictedEndDate);
      let d = start;
      while (d <= end) {
        const key = format(d, 'yyyy-MM-dd');
        if (!map.has(key) || !map.get(key)!.has('period')) {
          addStatus(key, 'predicted');
        }
        d = addDays(d, 1);
      }
    }

    // Fertile window
    if (showFertility && fertileWindow) {
      const fStart = parseISO(fertileWindow.startDate);
      const fEnd = parseISO(fertileWindow.endDate);
      let d = fStart;
      while (d <= fEnd) {
        addStatus(format(d, 'yyyy-MM-dd'), 'fertile');
        d = addDays(d, 1);
      }
      addStatus(fertileWindow.ovulationDate, 'ovulation');
    }

    for (const log of dailyLogs) {
      if (log.spotting) addStatus(log.date, 'spotting');
      if (log.symptoms.length > 0 || log.mood || log.note) addStatus(log.date, 'logged');
    }

    return map;
  }, [cycles, predictions, fertileWindow, showFertility, dailyLogs]);

  // Generate calendar days
  const days: Date[] = [];
  let day = calStart;
  while (day <= calEnd) {
    days.push(day);
    day = addDays(day, 1);
  }

  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const today = new Date();
  const selectedLog = selectedDate
    ? dailyLogs.find((log) => log.date === selectedDate)
    : null;

  const handleDayPeriod = async () => {
    if (!selectedDate) return;
    setIsSaving(true);
    try {
      await onLogPeriod(selectedDate, selectedDate);
      onSoftLog('Period day saved.');
      setSelectedDate(null);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSpotting = async () => {
    if (!selectedDate) return;
    setIsSaving(true);
    try {
      await onSaveDailyLog(selectedDate, { spotting: !(selectedLog?.spotting ?? false) });
      onSoftLog('Spotting updated.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSymptom = async (symptom: string) => {
    if (!selectedDate) return;
    const current = selectedLog?.symptoms ?? [];
    const next = current.includes(symptom)
      ? current.filter((item) => item !== symptom)
      : [...current, symptom];
    setIsSaving(true);
    try {
      await onSaveDailyLog(selectedDate, { symptoms: next });
      onSoftLog(`${symptom} updated.`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="chart-card calendar-card">
      <div className="calendar-header">
        <button className="cal-nav-btn" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
          ‹
        </button>
        <h3 className="card-title">{format(currentMonth, 'MMMM yyyy')}</h3>
        <button className="cal-nav-btn" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
          ›
        </button>
      </div>

      <div className="calendar-grid">
        <div className="cal-weekdays">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <span key={d} className="cal-weekday">{d}</span>
          ))}
        </div>

        {weeks.map((week, wi) => (
          <div className="cal-week" key={wi}>
            {week.map((d) => {
              const dateStr = format(d, 'yyyy-MM-dd');
              const statuses = dayStatus.get(dateStr);
              const isCurrentMonth = isSameMonth(d, currentMonth);
              const isToday = isSameDay(d, today);
              const isPeriod = statuses?.has('period');
              const isPredicted = statuses?.has('predicted');
              const isFertile = statuses?.has('fertile');
              const isOvulation = statuses?.has('ovulation');

              let className = 'cal-day';
              if (!isCurrentMonth) className += ' other-month';
              if (isToday) className += ' today';
              if (isPeriod) className += ' period-day';
              if (isPredicted) className += ' predicted-day';
              if (isFertile) className += ' fertile-day';
              if (isOvulation) className += ' ovulation-day';
              if (statuses?.has('spotting')) className += ' spotting-day';
              if (statuses?.has('logged')) className += ' logged-day';

              return (
                <button
                  type="button"
                  key={dateStr}
                  className={className}
                  onClick={() => setSelectedDate(dateStr)}
                  aria-label={`Open ${format(d, 'MMMM d')}`}
                >
                  <span>{format(d, 'd')}</span>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div className="calendar-legend">
        <span className="legend-item"><span className="legend-dot period" /> Period</span>
        <span className="legend-item"><span className="legend-dot predicted" /> Predicted</span>
        {showFertility && <span className="legend-item"><span className="legend-dot fertile" /> Fertile</span>}
        {showFertility && <span className="legend-item"><span className="legend-dot ovulation" /> Ovulation</span>}
        <span className="legend-item"><span className="legend-dot logged" /> Logged</span>
      </div>

      {selectedDate && (
        <div className="day-sheet" role="dialog" aria-label="Log selected day">
          <div className="day-sheet-header">
            <div>
              <span className="eyebrow">Selected Day</span>
              <h4>{format(parseISO(selectedDate), 'MMM d, yyyy')}</h4>
            </div>
            <button type="button" onClick={() => setSelectedDate(null)}>Close</button>
          </div>
          <div className="day-sheet-actions">
            <button type="button" className="btn btn-primary" onClick={handleDayPeriod} disabled={isSaving}>
              Mark period day
            </button>
            <button type="button" className="btn btn-secondary" onClick={handleSpotting} disabled={isSaving}>
              {selectedLog?.spotting ? 'Remove spotting' : 'Mark spotting'}
            </button>
          </div>
          <div className="symptom-chip-row compact">
            {symptomShortcuts.map((symptom) => (
              <button
                type="button"
                key={symptom}
                className={`symptom-chip ${selectedLog?.symptoms.includes(symptom) ? 'selected' : ''}`}
                onClick={() => handleSymptom(symptom)}
              >
                {symptom}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
