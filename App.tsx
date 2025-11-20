import React, { useState, useMemo } from 'react';
import { MatrixValues, Scenario, CurvePoint, MatrixRegion } from './types';
import { generateScenario } from './services/geminiService';
import DistributionVis from './components/DistributionVis';
import MatrixGrid from './components/MatrixGrid';
import MetricsPanel from './components/MetricsPanel';
import Curves from './components/Curves';
import SimulationControl from './components/SimulationControl';
import { BrainCircuit, RefreshCw, Settings2, ToggleLeft, ToggleRight } from 'lucide-react';

// Constants for simulation
const TOTAL_SAMPLES = 1000;

// Math helper for Gaussian CDF approximation
function normalCDF(x: number, mean: number, std: number) {
  const z = (x - mean) / std;
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp(-z * z / 2);
  let prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  if (z > 0) prob = 1 - prob;
  return prob;
}

// Inverse Normal Cumulative Distribution (Acklam's algorithm approximation)
// Used to reverse-engineer the threshold from probability
function normInv(p: number): number {
    if (p <= 0) return -5; // clamp for visualization
    if (p >= 1) return 5;
    
    const a1 = -3.969683028665376e+01;
    const a2 = 2.209460984245205e+02;
    const a3 = -2.759285104469687e+02;
    const a4 = 1.383577518672690e+02;
    const a5 = -3.066479806614716e+01;
    const a6 = 2.506628277459239e+00;

    const b1 = -5.447609879822406e+01;
    const b2 = 1.615858368580409e+02;
    const b3 = -1.556989798598866e+02;
    const b4 = 6.680131188771972e+01;
    const b5 = -1.328068155288572e+01;

    const c1 = -7.784894002430293e-03;
    const c2 = -3.223964580411365e-01;
    const c3 = -2.400758277161838e+00;
    const c4 = -2.549732539343734e+00;
    const c5 = 4.374664141464968e+00;
    const c6 = 2.938163982698783e+00;

    const d1 = 7.784695709041462e-03;
    const d2 = 3.224671290700398e-01;
    const d3 = 2.445134137142996e+00;
    const d4 = 3.754408661907416e+00;

    const p_low = 0.02425;
    const p_high = 1 - p_low;

    let q, r;

    if (p < p_low) {
        q = Math.sqrt(-2 * Math.log(p));
        return (((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6) /
               ((((d1 * q + d2) * q + d3) * q + d4) * q + 1);
    } else if (p <= p_high) {
        q = p - 0.5;
        r = q * q;
        return (((((a1 * r + a2) * r + a3) * r + a4) * r + a5) * r + a6) * q /
               (((((b1 * r + b2) * r + b3) * r + b4) * r + b5) * r + 1);
    } else {
        q = Math.sqrt(-2 * Math.log(1 - p));
        return -(((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6) /
                ((((d1 * q + d2) * q + d3) * q + d4) * q + 1);
    }
}

const App: React.FC = () => {
  // Mode State
  const [isManualMode, setIsManualMode] = useState(false);
  
  // Interaction State (Hover Linking)
  const [hoveredRegion, setHoveredRegion] = useState<MatrixRegion>(null);
  
  // State for simulation parameters (interactive mode)
  const [simThreshold, setSimThreshold] = useState(0.5);
  const [simSeparation, setSimSeparation] = useState(0.4); 
  const [simNoise, setSimNoise] = useState(0.15); 
  const [simBalance, setSimBalance] = useState(0.5);

  // State for Manual Values
  const [manualValues, setManualValues] = useState({ tp: 450, tn: 450, fp: 50, fn: 50 });

  // Scenario State
  const [topicInput, setTopicInput] = useState("");
  const [scenario, setScenario] = useState<Scenario>({
    topic: "Kiểm tra chất lượng (Quality Control)",
    positiveLabel: "Lỗi (Fail)",
    negativeLabel: "Bình thường (Normal)",
    description: "Hệ thống tự động phát hiện sản phẩm bị lỗi trên dây chuyền sản xuất.",
    fpConsequence: "Báo động giả: Sản phẩm tốt bị loại bỏ sai, gây lãng phí chi phí sản xuất.",
    fnConsequence: "Bỏ sót lỗi: Sản phẩm lỗi bị lọt ra thị trường, gây mất uy tín và khiếu nại từ khách hàng."
  });
  const [loadingScenario, setLoadingScenario] = useState(false);

  // Handle AI Scenario Generation
  const handleGenerateScenario = async () => {
    if (!topicInput) return;
    setLoadingScenario(true);
    try {
      const newScenario = await generateScenario(topicInput);
      setScenario(newScenario);
    } catch (e) {
      alert("Không thể tạo kịch bản. Kiểm tra API Key.");
    } finally {
      setLoadingScenario(false);
    }
  };

  // --- Logic Engine ---

  // 1. Derived Parameters from Manual Inputs (Reverse Engineering)
  const derivedParams = useMemo(() => {
     const { tp, tn, fp, fn } = manualValues;
     const total = tp + tn + fp + fn || 1;
     const posCount = tp + fn;
     const negCount = tn + fp;
     
     // Balance
     const balance = posCount / total;

     // Estimates
     // Recall (TPR) = TP / (TP+FN) -> Area to right of threshold on Pos curve
     // Specificity (TNR) = TN / (TN+FP) -> Area to left of threshold on Neg curve
     
     // Clamp to avoid infinity in normInv
     const safeTPR = Math.max(0.001, Math.min(0.999, tp / (posCount || 1)));
     const safeTNR = Math.max(0.001, Math.min(0.999, tn / (negCount || 1)));
     
     const zPos = normInv(1 - safeTPR); // Threshold Z-score relative to Pos Mean
     const zNeg = normInv(safeTNR);     // Threshold Z-score relative to Neg Mean

     // We assume Noise (sigma) is constant to solve for Separation and Threshold
     // T = PosMean + zPos*sigma
     // T = NegMean + zNeg*sigma
     // PosMean = 0.5 + Sep/2
     // NegMean = 0.5 - Sep/2
     // (0.5 + Sep/2) + zPos*sigma = (0.5 - Sep/2) + zNeg*sigma
     // Sep + sigma(zPos) = zNeg*sigma
     // Sep = sigma * (zNeg - zPos)

     const sigma = 0.15; // fixed noise for manual viz
     let calcSeparation = sigma * (zNeg - zPos);
     
     // Clamp separation for visual sanity
     calcSeparation = Math.max(0, Math.min(0.9, calcSeparation));
     
     // Calculate Threshold
     // T = 0.5 - Sep/2 + zNeg*sigma
     let calcThreshold = (0.5 - calcSeparation/2) + zNeg * sigma;
     calcThreshold = Math.max(0, Math.min(1, calcThreshold));

     return {
         threshold: calcThreshold,
         separation: calcSeparation,
         noise: sigma,
         balance: balance
     };
  }, [manualValues]);

  // 2. Active Parameters (Switch between Sim and Derived)
  const activeThreshold = isManualMode ? derivedParams.threshold : simThreshold;
  const activeSeparation = isManualMode ? derivedParams.separation : simSeparation;
  const activeNoise = isManualMode ? derivedParams.noise : simNoise;
  const activeBalance = isManualMode ? derivedParams.balance : simBalance;

  // 3. Calculate Matrix (for Simulation Mode) - Or pass Manual Values
  const matrix = useMemo<MatrixValues>(() => {
    if (isManualMode) {
        return { ...manualValues, threshold: activeThreshold };
    }

    // Simulation Calculation
    const distParams = {
        negMean: 0.5 - (activeSeparation / 2),
        posMean: 0.5 + (activeSeparation / 2),
        std: activeNoise
    };

    const posCount = TOTAL_SAMPLES * activeBalance;
    const negCount = TOTAL_SAMPLES * (1 - activeBalance);

    const tpr = 1 - normalCDF(activeThreshold, distParams.posMean, distParams.std);
    const tnr = normalCDF(activeThreshold, distParams.negMean, distParams.std);

    return { 
        tp: posCount * tpr, 
        fn: posCount * (1 - tpr), 
        tn: negCount * tnr, 
        fp: negCount * (1 - tnr), 
        threshold: activeThreshold 
    };
  }, [isManualMode, manualValues, activeThreshold, activeSeparation, activeNoise, activeBalance]);

  // 4. Curve Points (Always based on current separation/noise properties)
  const curvePoints = useMemo<CurvePoint[]>(() => {
    const points: CurvePoint[] = [];
    const distParams = {
        negMean: 0.5 - (activeSeparation / 2),
        posMean: 0.5 + (activeSeparation / 2),
        std: activeNoise
    };
    const posCount = TOTAL_SAMPLES * activeBalance;
    const negCount = TOTAL_SAMPLES * (1 - activeBalance);

    for (let t = 0; t <= 1.0; t += 0.01) {
      const tpr = 1 - normalCDF(t, distParams.posMean, distParams.std);
      const tnr = normalCDF(t, distParams.negMean, distParams.std);
      const fpr = 1 - tnr;

      const tp = posCount * tpr;
      const fp = negCount * fpr;
      
      const precision = (tp + fp) === 0 ? (tpr === 0 ? 1 : 0) : tp / (tp + fp);
      points.push({ threshold: t, tpr, fpr, precision });
    }
    return points;
  }, [activeSeparation, activeNoise, activeBalance]);

  const updateManualValue = (key: keyof typeof manualValues, value: number) => {
      setManualValues(prev => ({
          ...prev,
          [key]: Math.max(0, value)
      }));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-red-600 p-2 rounded-lg text-white">
              <BrainCircuit size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">Confusion Matrix <span className="text-red-600">Simulator</span></h1>
              <p className="text-xs text-gray-500">Học máy trực quan & tương tác</p>
            </div>
          </div>
          
          <div className="flex gap-2">
             <input 
                type="text" 
                placeholder="VD: Ung thư, Gian lận tài chính..." 
                className="border border-gray-300 rounded px-3 py-1 text-sm w-64 focus:ring-2 focus:ring-red-500 outline-none hidden sm:block"
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGenerateScenario()}
             />
             <button 
                onClick={handleGenerateScenario}
                disabled={loadingScenario}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-1 rounded text-sm font-medium transition-colors flex items-center gap-2"
             >
                {loadingScenario ? <RefreshCw className="animate-spin" size={16}/> : "Tạo kịch bản AI"}
             </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        
        {/* Scenario Description */}
        <section className="bg-white border border-gray-200 shadow-sm rounded-xl p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-1">{scenario.topic}</h2>
            <p className="text-gray-600 mb-2">{scenario.description}</p>
            <div className="flex flex-wrap gap-4 text-sm mt-3">
                <span className="bg-red-50 px-3 py-1 rounded border border-red-200 text-red-700">
                    <strong>Positive (1):</strong> {scenario.positiveLabel}
                </span>
                <span className="bg-emerald-50 px-3 py-1 rounded border border-emerald-200 text-emerald-700">
                    <strong>Negative (0):</strong> {scenario.negativeLabel}
                </span>
            </div>
        </section>

        {/* Main Simulation Control */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column: Visualization & Controls */}
            <div className="lg:col-span-2 space-y-6">
                
                {/* Mode Toggle Toolbar */}
                <div className="flex justify-between items-center bg-gray-100 p-1 rounded-lg border border-gray-200 mb-2">
                    <button 
                        onClick={() => setIsManualMode(false)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${!isManualMode ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <Settings2 size={16} />
                        Chế độ Mô phỏng
                    </button>
                    <button 
                        onClick={() => setIsManualMode(true)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${isManualMode ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        {isManualMode ? <ToggleRight size={16}/> : <ToggleLeft size={16}/>}
                        Chế độ Thủ công (Nhập số)
                    </button>
                </div>

                <div className={`bg-white p-6 rounded-xl shadow-sm border border-gray-200 transition-opacity duration-300`}>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-gray-700 flex items-center gap-2">
                            Mô phỏng phân phối & Ngưỡng
                        </h3>
                        <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                            Rê chuột vào ma trận hoặc biểu đồ để liên kết
                        </span>
                    </div>
                    
                    {/* The Interactive Chart */}
                    <DistributionVis 
                        threshold={activeThreshold} 
                        setThreshold={setSimThreshold}
                        separation={activeSeparation}
                        noise={activeNoise}
                        readOnly={isManualMode}
                        hoveredRegion={hoveredRegion}
                        setHoveredRegion={setHoveredRegion}
                    />

                    {/* Sliders using New Component with AI Help */}
                    <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 bg-gray-50 p-4 rounded-lg transition-opacity ${isManualMode ? 'opacity-50 pointer-events-none' : ''}`}>
                         <SimulationControl 
                             label="Độ phân tách"
                             paramNameForAI="Độ phân tách (Separation) của phân phối dữ liệu"
                             value={activeSeparation}
                             onChange={setSimSeparation}
                             min={0} max={0.8} step={0.01}
                             scenario={scenario}
                             disabled={isManualMode}
                         />
                         
                         <SimulationControl 
                             label="Độ nhiễu (Noise)"
                             paramNameForAI="Độ nhiễu (Noise/Standard Deviation) của dữ liệu"
                             value={activeNoise}
                             onChange={setSimNoise}
                             min={0.05} max={0.3} step={0.01}
                             scenario={scenario}
                             disabled={isManualMode}
                         />
                         
                         <SimulationControl 
                             label="Tỉ lệ Positive"
                             paramNameForAI="Sự mất cân bằng dữ liệu (Class Balance/Imbalance)"
                             value={activeBalance}
                             onChange={setSimBalance}
                             min={0.1} max={0.9} step={0.05}
                             scenario={scenario}
                             disabled={isManualMode}
                         />
                    </div>
                    {isManualMode && <p className="text-xs text-center text-gray-400 mt-2 italic">Các thanh trượt bị vô hiệu hóa. Biểu đồ được tạo ngược từ số liệu bạn nhập.</p>}
                </div>

                {/* Metrics */}
                <MetricsPanel values={matrix} scenario={scenario} />
            </div>

            {/* Right Column: Matrix & Quick Stats */}
            <div className="space-y-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <MatrixGrid 
                        values={matrix} 
                        scenario={scenario} 
                        isManualMode={isManualMode}
                        onUpdate={updateManualValue}
                        hoveredRegion={hoveredRegion}
                        setHoveredRegion={setHoveredRegion}
                    />
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-sm text-blue-800">
                    {isManualMode ? (
                         <p><strong>Chế độ Thủ công:</strong> Bạn có thể nhập trực tiếp số lượng TP, TN, FP, FN vào ma trận bên trên để xem các chỉ số thay đổi như thế nào.</p>
                    ) : (
                        <>
                            <p className="mb-2"><strong>Mẹo:</strong> Di chuyển thanh dọc (Threshold) trên biểu đồ để xem sự đánh đổi (trade-off) giữa Precision và Recall.</p>
                            <ul className="list-disc pl-4 space-y-1 text-xs">
                                <li>Kéo sang phải: Tăng Precision, Giảm Recall (Chặt chẽ hơn).</li>
                                <li>Kéo sang trái: Tăng Recall, Giảm Precision (Bắt nhầm còn hơn bỏ sót).</li>
                            </ul>
                        </>
                    )}
                </div>
            </div>
        </div>

        {/* Curves Section */}
        <section className="transition-all">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">Đường cong đánh giá (Evaluation Curves)</h2>
                {isManualMode && <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">Ước lượng từ dữ liệu thủ công</span>}
            </div>
            <Curves points={curvePoints} currentThreshold={activeThreshold} />
        </section>

      </main>
    </div>
  );
};

export default App;