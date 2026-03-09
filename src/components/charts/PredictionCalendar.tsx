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

interface Props {
  cycles: CycleEntry[];
  predictions: CyclePrediction[];
  fertileWindow: FertileWindow | null;
}

export default function PredictionCalendar({ cycles, predictions, fertileWindow }: Props) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

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
    if (fertileWindow) {
      const fStart = parseISO(fertileWindow.startDate);
      const fEnd = parseISO(fertileWindow.endDate);
      let d = fStart;
      while (d <= fEnd) {
        addStatus(format(d, 'yyyy-MM-dd'), 'fertile');
        d = addDays(d, 1);
      }
      addStatus(fertileWindow.ovulationDate, 'ovulation');
    }

    return map;
  }, [cycles, predictions, fertileWindow]);

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

              return (
                <div key={dateStr} className={className}>
                  <span>{format(d, 'd')}</span>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="calendar-legend">
        <span className="legend-item"><span className="legend-dot period" /> Period</span>
        <span className="legend-item"><span className="legend-dot predicted" /> Predicted</span>
        <span className="legend-item"><span className="legend-dot fertile" /> Fertile</span>
        <span className="legend-item"><span className="legend-dot ovulation" /> Ovulation</span>
      </div>
    </div>
  );
}
