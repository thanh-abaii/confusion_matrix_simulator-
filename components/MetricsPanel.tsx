import React from 'react';
import { MatrixValues, Scenario } from '../types';
import MetricCard from './MetricCard';

interface Props {
  values: MatrixValues;
  scenario: Scenario;
}

const MetricsPanel: React.FC<Props> = ({ values, scenario }) => {
  const { tp, tn, fp, fn } = values;
  
  // Safe division
  const div = (n: number, d: number) => (d === 0 ? 0 : n / d);

  const accuracy = div(tp + tn, tp + tn + fp + fn);
  const precision = div(tp, tp + fp);
  const recall = div(tp, tp + fn); // Sensitivity
  const specificity = div(tn, tn + fp);
  const f1 = div(2 * precision * recall, precision + recall);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      <MetricCard 
        label="Accuracy" 
        value={accuracy} 
        formula="(TP + TN) / Total"
        color="#3b82f6" 
        scenario={scenario}
      />
      <MetricCard 
        label="Precision" 
        value={precision} 
        formula="TP / (TP + FP)"
        color="#ef4444" 
        scenario={scenario}
      />
      <MetricCard 
        label="Recall (Sensitivity)" 
        value={recall} 
        formula="TP / (TP + FN)"
        color="#b91c1c" 
        scenario={scenario}
      />
      <MetricCard 
        label="Specificity" 
        value={specificity} 
        formula="TN / (TN + FP)"
        color="#10b981" 
        scenario={scenario}
      />
      <MetricCard 
        label="F1 Score" 
        value={f1} 
        formula="2*P*R / (P+R)"
        color="#f97316" 
        scenario={scenario}
      />
    </div>
  );
};

export default MetricsPanel;