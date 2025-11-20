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