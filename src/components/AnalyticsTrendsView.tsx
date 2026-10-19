import React from 'react';
import {
  TrendingUp,
  Activity,
  Flame,
  Thermometer,
  ShieldAlert,
  Droplet,
  Gauge,
  Info
} from 'lucide-react';
import { HvacInspectionRecord } from '../utils/hvac-data';

interface AnalyticsTrendsViewProps {
  records: HvacInspectionRecord[];
}

export const AnalyticsTrendsView: React.FC<AnalyticsTrendsViewProps> = ({ records }) => {
  // Sort chronologically
  const sortedRecords = [...records].slice(-10);

  return (
    <div className="space-y-4">
      {/* Overview Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-cyan-950 border border-cyan-800 rounded-xl text-cyan-400">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              Phân Tích Xu Hướng &amp; Cảnh Báo Sớm Hỏng Hóc Chiller
            </h3>
            <p className="text-xs text-slate-400">
              Giám sát độ chênh nhiệt tiếp cận (Approach Temperature), chênh áp dầu và dòng tải điện qua các ca trực
            </p>
          </div>
        </div>
      </div>

      {/* Grid of 3 Major Trend Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Chart 1: Approach Temperatures (Evaporator & Condenser) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-cyan-400" />
              <h4 className="text-xs font-bold text-slate-200">
                Xu Hướng Chênh Lệch Nhiệt Độ Tiếp Cận (Approach Temperature)
              </h4>
            </div>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
              Dự báo bám cặn
            </span>
          </div>

          <div className="space-y-3">
            <div className="h-44 bg-slate-950 rounded-lg p-3 border border-slate-800 flex items-end justify-between gap-2">
              {sortedRecords.length === 0 ? (
                <div className="m-auto text-xs text-slate-500">Chưa có đủ dữ liệu lịch sử</div>
              ) : (
                sortedRecords.map((rec, i) => {
                  const evap = parseFloat(rec.readings[5]?.value || '0.8');
                  const cond = parseFloat(rec.readings[8]?.value || '1.2');
                  const maxDisplay = 4.0;
                  const evapPct = Math.min(100, Math.max(10, (evap / maxDisplay) * 100));
                  const condPct = Math.min(100, Math.max(10, (cond / maxDisplay) * 100));

                  return (
                    <div key={rec.recordId || i} className="flex-1 flex flex-col items-center gap-1 group relative">
                      <div className="w-full flex justify-center items-end gap-1 h-32">
                        {/* Evaporator Bar */}
                        <div
                          style={{ height: `${evapPct}%` }}
                          className={`w-3 rounded-t transition-all ${
                            evap > 2.0 ? 'bg-red-500' : 'bg-cyan-500'
                          }`}
                          title={`Bay hơi (P5): ${evap} °C`}
                        />
                        {/* Condenser Bar */}
                        <div
                          style={{ height: `${condPct}%` }}
                          className={`w-3 rounded-t transition-all ${
                            cond > 3.0 ? 'bg-red-500' : 'bg-emerald-500'
                          }`}
                          title={`Bình ngưng (P8): ${cond} °C`}
                        />
                      </div>
                      <span className="text-[9px] font-mono text-slate-500 truncate max-w-[36px]">
                        {rec.scheduledTime}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 font-mono pt-1">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-cyan-500 inline-block"></span>
                  <span>Bay hơi (Chuẩn: 0.1 - 2.0 °C)</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block"></span>
                  <span>Bình ngưng (Chuẩn: 0.1 - 3.0 °C)</span>
                </span>
              </div>
              <span className="text-[10px] text-amber-400">Đỏ = Vượt ngưỡng</span>
            </div>
          </div>
        </div>

        {/* Chart 2: Differential Oil Pressure Over Shifts */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Droplet className="w-4 h-4 text-amber-400" />
              <h4 className="text-xs font-bold text-slate-200">
                Chênh Lệch Áp Suất Dầu Bôi Trơn (Differential Oil Pressure)
              </h4>
            </div>
            <span className="text-[10px] font-mono text-amber-400 bg-amber-950 px-2 py-0.5 rounded border border-amber-800">
              Chuẩn 120 - 150 kPa
            </span>
          </div>

          <div className="space-y-3">
            <div className="h-44 bg-slate-950 rounded-lg p-3 border border-slate-800 flex items-end justify-between gap-2">
              {sortedRecords.length === 0 ? (
                <div className="m-auto text-xs text-slate-500">Chưa có đủ dữ liệu lịch sử</div>
              ) : (
                sortedRecords.map((rec, i) => {
                  const oilPress = parseFloat(rec.readings[19]?.value || '135');
                  const isSafe = oilPress >= 120 && oilPress <= 150;
                  const pct = Math.min(100, Math.max(10, ((oilPress - 80) / 100) * 100));

                  return (
                    <div key={rec.recordId || i} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full flex justify-center items-end h-32">
                        <div
                          style={{ height: `${pct}%` }}
                          className={`w-5 rounded-t transition-all ${
                            isSafe ? 'bg-amber-500' : 'bg-red-500'
                          }`}
                          title={`Chênh áp dầu (P19): ${oilPress} kPa`}
                        />
                      </div>
                      <span className="text-[9px] font-mono text-slate-500 truncate max-w-[36px]">
                        {rec.scheduledTime}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 font-mono pt-1">
              <span>Biên an toàn: 120 - 150 kPa</span>
              <span className="text-slate-500">Bảo vệ bạc đạn máy nén</span>
            </div>
          </div>
        </div>
      </div>

      {/* Operational Principles Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl text-xs space-y-3">
        <h4 className="font-bold text-slate-200 flex items-center gap-2">
          <Info className="w-4 h-4 text-cyan-400" />
          Quy Tắc Đánh Giá Xu Hướng Kỹ Thuật HVAC
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-slate-300 leading-relaxed">
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
            <span className="font-bold text-cyan-400 block mb-1">1. Cáu cặn bình ngưng</span>
            Nếu Condenser Approach Temp tăng liên tục qua 3 mốc giờ và vượt 3.0°C, ống chùm bình ngưng đang có dấu hiệu đóng cặn bùn hoặc tháp giải nhiệt làm mát kém.
          </div>
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
            <span className="font-bold text-cyan-400 block mb-1">2. Áp suất dầu máy nén</span>
            Áp lực chênh dầu dưới 120 kPa là chỉ báo tắc nghẽn phin lọc dầu hoặc dầu loãng do lẫn môi chất lạnh lỏng. Cần kiểm tra sấy dầu ngay lập tức.
          </div>
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
            <span className="font-bold text-cyan-400 block mb-1">3. Khí không ngưng (Purge)</span>
            Nếu tổng thời gian bơm xả khí trong 24 giờ (Purge 24 Hour Pump out) vượt quá 20 phút, hệ thống đang bị rò rỉ lọt không khí vào buồng chân không bay hơi.
          </div>
        </div>
      </div>
    </div>
  );
};
