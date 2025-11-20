export interface MatrixValues {
  tp: number;
  tn: number;
  fp: number;
  fn: number;
  threshold: number;
}

export interface Scenario {
  topic: string;
  positiveLabel: string;
  negativeLabel: string;
  description: string;
  fpConsequence: string;
  fnConsequence: string;
  // AI recommended simulation settings for this specific scenario
  simulation?: {
    separation: number; // 0.1 (Hard) to 0.8 (Easy)
    noise: number;      // 0.1 to 0.3
    balance: number;    // 0.01 (Rare) to 0.9 (Common)
  };
}

export interface DistributionPoint {
  x: number;
  posDist: number; // Probability density for Positive class
  negDist: number; // Probability density for Negative class
}

export interface CurvePoint {
  threshold: number;
  tpr: number; // Recall
  fpr: number; // 1 - Specificity
  precision: number;
}

export type MatrixRegion = 'tp' | 'tn' | 'fp' | 'fn' | null;