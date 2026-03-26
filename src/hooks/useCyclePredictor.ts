import { useState, useEffect, useRef, useCallback } from 'react';
import type { CycleEntry, CycleMetrics, WorkerMessage, WorkerResponse } from '../types/cycle';

export function useCyclePredictor(cycles: CycleEntry[]) {
  const [metrics, setMetrics] = useState<CycleMetrics | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    workerRef.current = new Worker(
      new URL('../workers/cyclePredictor.worker.ts', import.meta.url),
      { type: 'module' }
    );

    workerRef.current.onmessage = (e: MessageEvent<WorkerResponse>) => {
      if (e.data.type === 'PREDICTION_RESULT') {
        setMetrics(e.data.payload);
        setIsCalculating(false);
      }
    };

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const calculate = useCallback(() => {
    if (!workerRef.current) return;
    setIsCalculating(true);
    const message: WorkerMessage = {
      type: 'CALCULATE_PREDICTIONS',
      payload: {
        cycles,
        // Use local date parts to avoid UTC offset issues (toISOString() returns
      // a UTC date which can differ from local date in positive-offset timezones).
      today: (() => {
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const d = String(now.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
      })(),
      },
    };
    workerRef.current.postMessage(message);
  }, [cycles]);

  useEffect(() => {
    if (cycles.length > 0) {
      calculate();
    }
  }, [cycles, calculate]);

  return { metrics, isCalculating, recalculate: calculate };
}
