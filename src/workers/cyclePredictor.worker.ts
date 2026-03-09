import type { CycleEntry, CycleMetrics, CyclePrediction, CyclePhase, FertileWindow, WorkerMessage, WorkerResponse } from '../types/cycle';

function daysBetween(a: string, b: string): number {
  const da = new Date(a);
  const db = new Date(b);
  return Math.round((db.getTime() - da.getTime()) / (1000 * 60 * 60 * 24));
}

function addDays(date: string, days: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function calculateMetrics(cycles: CycleEntry[], today: string): CycleMetrics {
  const defaultMetrics: CycleMetrics = {
    averageCycleLength: 28,
    averagePeriodDuration: 5,
    shortestCycle: 28,
    longestCycle: 28,
    regularityScore: 0,
    totalCyclesTracked: 0,
    currentCycleDay: 1,
    currentPhase: 'follicular',
    nextPredictedPeriod: null,
    fertileWindow: null,
    predictions: [],
  };

  if (cycles.length === 0) return defaultMetrics;

  // Sort by startDate ascending
  const sorted = [...cycles]
    .filter((c) => c.startDate)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  if (sorted.length === 0) return defaultMetrics;

  // Calculate period durations
  const periodDurations: number[] = sorted
    .filter((c) => c.endDate)
    .map((c) => daysBetween(c.startDate, c.endDate!) + 1);

  // Calculate cycle lengths (gap between consecutive period start dates)
  const cycleLengths: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const len = daysBetween(sorted[i - 1].startDate, sorted[i].startDate);
    if (len > 0 && len < 60) { // sanity check
      cycleLengths.push(len);
    }
  }

  const avgCycleLength =
    cycleLengths.length > 0
      ? Math.round(cycleLengths.reduce((s, v) => s + v, 0) / cycleLengths.length)
      : 28;

  const avgPeriodDuration =
    periodDurations.length > 0
      ? Math.round(periodDurations.reduce((s, v) => s + v, 0) / periodDurations.length)
      : 5;

  const shortestCycle = cycleLengths.length > 0 ? Math.min(...cycleLengths) : avgCycleLength;
  const longestCycle = cycleLengths.length > 0 ? Math.max(...cycleLengths) : avgCycleLength;

  // Regularity score (lower std dev = higher score)
  let regularityScore = 0;
  if (cycleLengths.length >= 2) {
    const mean = avgCycleLength;
    const variance = cycleLengths.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / cycleLengths.length;
    const stdDev = Math.sqrt(variance);
    regularityScore = Math.max(0, Math.min(100, Math.round(100 - stdDev * 10)));
  } else if (cycleLengths.length === 1) {
    regularityScore = 75; // not enough data to judge
  }

  // Current cycle day
  const lastPeriodStart = sorted[sorted.length - 1].startDate;
  const currentCycleDay = daysBetween(lastPeriodStart, today) + 1;

  // Current phase
  let currentPhase: CyclePhase = 'follicular';
  const lastEntry = sorted[sorted.length - 1];
  if (!lastEntry.endDate || daysBetween(lastEntry.startDate, today) < avgPeriodDuration) {
    currentPhase = 'menstrual';
  } else {
    const dayInCycle = currentCycleDay;
    if (dayInCycle <= avgPeriodDuration) {
      currentPhase = 'menstrual';
    } else if (dayInCycle <= Math.round(avgCycleLength * 0.4)) {
      currentPhase = 'follicular';
    } else if (dayInCycle <= Math.round(avgCycleLength * 0.55)) {
      currentPhase = 'ovulation';
    } else {
      currentPhase = 'luteal';
    }
  }

  // Predictions (next 3 cycles)
  const predictions: CyclePrediction[] = [];
  let refDate = lastPeriodStart;
  for (let i = 0; i < 3; i++) {
    const predictedStart = addDays(refDate, avgCycleLength);
    const predictedEnd = addDays(predictedStart, avgPeriodDuration - 1);
    const confidence = Math.max(0.3, 1 - i * 0.15 - (cycleLengths.length < 3 ? 0.2 : 0));
    predictions.push({
      predictedStartDate: predictedStart,
      predictedEndDate: predictedEnd,
      confidence: Math.round(confidence * 100) / 100,
    });
    refDate = predictedStart;
  }

  // Fertile window (approx days 10-16 of current cycle based on next predicted start)
  let fertileWindow: FertileWindow | null = null;
  if (predictions.length > 0) {
    const nextPeriod = predictions[0].predictedStartDate;
    const ovulationDate = addDays(nextPeriod, -14); // ~14 days before next period
    fertileWindow = {
      startDate: addDays(ovulationDate, -4),
      endDate: addDays(ovulationDate, 1),
      ovulationDate,
    };
  }

  return {
    averageCycleLength: avgCycleLength,
    averagePeriodDuration: avgPeriodDuration,
    shortestCycle,
    longestCycle,
    regularityScore,
    totalCyclesTracked: sorted.length,
    currentCycleDay: Math.max(1, currentCycleDay),
    currentPhase,
    nextPredictedPeriod: predictions.length > 0 ? predictions[0].predictedStartDate : null,
    fertileWindow,
    predictions,
  };
}

// Web Worker message handler
self.onmessage = function (e: MessageEvent<WorkerMessage>) {
  if (e.data.type === 'CALCULATE_PREDICTIONS') {
    const { cycles, today } = e.data.payload;
    const metrics = calculateMetrics(cycles, today);
    const response: WorkerResponse = {
      type: 'PREDICTION_RESULT',
      payload: metrics,
    };
    self.postMessage(response);
  }
};
