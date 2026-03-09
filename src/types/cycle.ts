export interface CycleEntry {
  id: string;
  userId: string;
  startDate: string; // ISO date string YYYY-MM-DD
  endDate: string | null; // null if period is ongoing
  createdAt: number; // timestamp
}

export interface CyclePrediction {
  predictedStartDate: string;
  predictedEndDate: string;
  confidence: number; // 0-1
}

export interface FertileWindow {
  startDate: string;
  endDate: string;
  ovulationDate: string;
}

export interface CycleMetrics {
  averageCycleLength: number;
  averagePeriodDuration: number;
  shortestCycle: number;
  longestCycle: number;
  regularityScore: number; // 0-100
  totalCyclesTracked: number;
  currentCycleDay: number;
  currentPhase: CyclePhase;
  nextPredictedPeriod: string | null;
  fertileWindow: FertileWindow | null;
  predictions: CyclePrediction[];
}

export type CyclePhase = 'menstrual' | 'follicular' | 'ovulation' | 'luteal';

export interface WorkerMessage {
  type: 'CALCULATE_PREDICTIONS';
  payload: {
    cycles: CycleEntry[];
    today: string;
  };
}

export interface WorkerResponse {
  type: 'PREDICTION_RESULT';
  payload: CycleMetrics;
}
