import React from 'react';
import {
  Brain,
  Zap,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Gauge,
  Thermometer,
  ShieldAlert,
  Flame,
  Droplet
} from 'lucide-react';
import { CHILLER_PARAMETERS, ReadingValue } from '../utils/hvac-data';

interface AiDiagnosticCardProps {
  readings: Record<number, ReadingValue>;
  diagnosticAnalysis?: string;
  modelUsed?: string;
  isAnalyzing?: boolean;
}

export const AiDiagnosticCard: React.FC<AiDiagnosticCardProps> = ({
  readings,
  diagnosticAnalysis,
  modelUsed = 'gemini-3.8-flash',
  isAnalyzing = false
}) => {
  // Extract key thermodynamics indicators
  const evapApproach = parseFloat(readings[5]?.value || '0');
  const condApproach = parseFloat(readings[8]?.value || '0');
  const diffOilPress = parseFloat(readings[19]?.value || '0');
  const operatingCap = parseFloat(readings[4]?.value || '0');
  const compRla = parseFloat(readings[17]?.value || '0');

  // Heat exchanger fouling status
  const isEvapFoulingRisk = evapApproach > 2.0;
  const isCondFoulingRisk = condApproach > 3.0;

  // Lubrication safety
  const isOilPressAnomaly = diffOilPress > 0 && (diffOilPress < 120 || diffOilPress > 150);

  // Electrical load correlation
  const loadRatio = operatingCap > 0 && compRla > 0 ? (compRla / operatingCap).toFixed(2) : '1.0';

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-purple-950/70 border border-purple-800/80 text-purple-400">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              Trợ lý Phán đoán & Chẩn đoán Nghiệp vụ AI
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800/80 font-normal">
                {modelUsed} (ThinkingLevel.HIGH)
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Phân tích chu trình nhiệt động học Chiller, độ chênh nhiệt và cảnh báo sớm bám cặn
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
          <span>Phân tích thời gian thực</span>
        </div>
      </div>

      {/* 4 Technical Thermodynamic KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* KPI 1: Evaporator Approach Temp */}
        <div className={`p-3 rounded-lg border bg-slate-950/70 space-y-1.5 ${
          isEvapFoulingRisk ? 'border-red-800 bg-red-950/20' : 'border-slate-800'
        }`}>
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1 font-medium">
              <Thermometer className="w-3.5 h-3.5 text-blue-400" />
              Approach Bay Hơi
            </span>
            <span className="text-[10px] font-mono">0.1 - 2.0 °C</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className={`text-xl font-bold font-mono ${
              isEvapFoulingRisk ? 'text-red-400' : 'text-slate-100'
            }`}>
              {evapApproach ? `${evapApproach} °C` : '—'}
            </span>
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
              isEvapFoulingRisk
                ? 'bg-red-950 text-red-300 border border-red-800'
                : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
            }`}>
              {isEvapFoulingRisk ? 'Nguy cơ bám cặn' : 'Trao đổi nhiệt tốt'}
            </span>
          </div>
          <p className="text-[10px] text-slate-500">
            Độ chênh nhiệt độ nước lạnh ra & nhiệt độ sôi môi chất lạnh
          </p>
        </div>

        {/* KPI 2: Condenser Approach Temp */}
        <div className={`p-3 rounded-lg border bg-slate-950/70 space-y-1.5 ${
          isCondFoulingRisk ? 'border-red-800 bg-red-950/20' : 'border-slate-800'
        }`}>
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1 font-medium">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              Approach Bình Ngưng
            </span>
            <span className="text-[10px] font-mono">0.1 - 3.0 °C</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className={`text-xl font-bold font-mono ${
              isCondFoulingRisk ? 'text-red-400' : 'text-slate-100'
            }`}>
              {condApproach ? `${condApproach} °C` : '—'}
            </span>
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
              isCondFoulingRisk
                ? 'bg-red-950 text-red-300 border border-red-800'
                : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
            }`}>
              {isCondFoulingRisk ? 'Ống ngưng tụ bẩn' : 'Giải nhiệt tối ưu'}
            </span>
          </div>
          <p className="text-[10px] text-slate-500">
            Chỉ báo quan trọng nhất để lên lịch tẩy cáu cặn bình ngưng
          </p>
        </div>

        {/* KPI 3: Differential Oil Pressure */}
        <div className={`p-3 rounded-lg border bg-slate-950/70 space-y-1.5 ${
          isOilPressAnomaly ? 'border-amber-800 bg-amber-950/20' : 'border-slate-800'
        }`}>
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1 font-medium">
              <Droplet className="w-3.5 h-3.5 text-cyan-400" />
              Áp Lực Chênh Dầu
            </span>
            <span className="text-[10px] font-mono">120 - 150 kPa</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className={`text-xl font-bold font-mono ${
              isOilPressAnomaly ? 'text-amber-400' : 'text-slate-100'
            }`}>
              {diffOilPress ? `${diffOilPress} kPa` : '—'}
            </span>
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
              isOilPressAnomaly
                ? 'bg-amber-950 text-amber-300 border border-amber-800'
                : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
            }`}>
              {isOilPressAnomaly ? 'Kiểm tra lọc dầu' : 'Bôi trơn an toàn'}
            </span>
          </div>
          <p className="text-[10px] text-slate-500">
            Đảm bảo dầu bôi trơn bạc đạn & trục vít máy nén
          </p>
        </div>

        {/* KPI 4: Operating Load & Current Correlation */}
        <div className="p-3 rounded-lg border border-slate-800 bg-slate-950/70 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1 font-medium">
              <Gauge className="w-3.5 h-3.5 text-purple-400" />
              Tải &amp; Dòng %RLA
            </span>
            <span className="text-[10px] font-mono">Hệ số {loadRatio}</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-bold font-mono text-slate-100">
              {operatingCap}% <span className="text-xs text-slate-400 font-normal">/ {compRla}% RLA</span>
            </span>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
              Hiệu suất tốt
            </span>
          </div>
          <p className="text-[10px] text-slate-500">
            Tương quan công suất đặt và dòng điện đầy tải thực tế
          </p>
        </div>
      </div>

      {/* AI Reasoning Detailed Text Block */}
      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/90 space-y-2">
        <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
          <Zap className="w-4 h-4 text-cyan-400" />
          Nhận Định Kỹ Thuật Chuyên Nghiệp (Gemini AI Engine)
        </h4>

        {isAnalyzing ? (
          <div className="py-4 text-center text-xs text-cyan-400 animate-pulse font-mono">
            Mô hình đang thực hiện chuỗi suy luận nhiệt động học và so sánh lịch sử vận hành...
          </div>
        ) : (
          <div className="text-xs text-slate-300 leading-relaxed space-y-2">
            <p>
              {diagnosticAnalysis ||
                'Hệ thống Chiller đang làm việc trong vùng thông số an toàn. Độ chênh nhiệt độ tiếp cận (Approach Temperature) tại bình bay hơi và bình ngưng đạt tiêu chuẩn, cho thấy các bề mặt ống truyền nhiệt đang sạch, lưu lượng nước lạnh tuần hoàn và nước giải nhiệt tháp làm mát ổn định.'}
            </p>
            {isOilPressAnomaly && (
              <div className="p-2.5 rounded-lg bg-amber-950/60 border border-amber-800 text-amber-200 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Khuyến cáo bảo dưỡng: </span>
                  Áp suất chênh dầu ({diffOilPress} kPa) lệch khỏi khoảng chuẩn (120 - 150 kPa). Đề nghị kỹ sư kíp trực kiểm tra độ nhớt dầu máy nén, xem xét thời gian thay phin lọc dầu gần nhất và theo dõi thêm mức dầu qua kính quan sát.
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
