import React, { useState } from 'react';
import {
  CheckCircle,
  AlertTriangle,
  AlertOctagon,
  HelpCircle,
  Edit3,
  Sliders,
  Filter,
  Check,
  RotateCcw,
  Sparkles,
  Info
} from 'lucide-react';
import {
  CHILLER_PARAMETERS,
  ParameterDef,
  ReadingValue,
  validateReading,
  calculateRecordStats
} from '../utils/hvac-data';

interface ChecklistTableProps {
  readings: Record<number, ReadingValue>;
  onUpdateReading: (pointId: number, val: string, status?: 'APPROVED' | 'NEEDS_REVIEW' | 'REJECTED') => void;
  onApproveAllNormal: () => void;
  onResetReadings: () => void;
}

export const ChecklistTable: React.FC<ChecklistTableProps> = ({
  readings,
  onUpdateReading,
  onApproveAllNormal,
  onResetReadings
}) => {
  const [filterTab, setFilterTab] = useState<'all' | 'ckt1' | 'saumay' | 'alerts' | 'empty'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const stats = calculateRecordStats(readings);

  // Filter items based on active tab and search
  const filteredParameters = CHILLER_PARAMETERS.filter((p) => {
    // Search
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      const matchText = `${p.id} ${p.name.toLowerCase()} ${p.nameVi.toLowerCase()} ${p.code.toLowerCase()}`;
      if (!matchText.includes(s)) return false;
    }

    const r = readings[p.id];
    const severity = r?.severity || 'EMPTY';

    if (filterTab === 'ckt1') return p.code === 'CKT1';
    if (filterTab === 'saumay') return p.code === 'SAU MAY';
    if (filterTab === 'alerts') return severity === 'WARNING' || severity === 'CRITICAL';
    if (filterTab === 'empty') return !r || !r.value || severity === 'EMPTY';

    return true;
  });

  return (
    <div id="checklist-table-section" className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4 scroll-mt-20">
      {/* Top Header & Quick Metrics */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-cyan-950 border border-cyan-800 text-cyan-400 flex items-center justify-center text-xs font-bold">
              3
            </span>
            <h3 className="text-sm font-bold text-slate-100">
              Bảng kiểm tra 30 thông số chuẩn (Đối chiếu & Xác nhận)
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Nhân viên kiểm tra đối chiếu từng thông số trước khi ký số và đồng bộ Google Sheets / Drive
          </p>
        </div>

        {/* Status Metrics Counters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono">
            <span className="text-slate-400">Điểm đo: </span>
            <span className="font-bold text-cyan-400">
              {stats.filled}/{stats.total}
            </span>
            <span className="text-slate-500 text-[10px] ml-1">({stats.completionRate}%)</span>
          </div>

          <div className="px-2.5 py-1 rounded-lg bg-emerald-950/50 border border-emerald-800/60 text-xs font-mono text-emerald-300 flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>{stats.normalCount} Chuẩn</span>
          </div>

          {stats.warningCount > 0 && (
            <div className="px-2.5 py-1 rounded-lg bg-amber-950/60 border border-amber-800/80 text-xs font-mono text-amber-300 flex items-center gap-1.5 animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>{stats.warningCount} Cảnh báo</span>
            </div>
          )}

          {stats.criticalCount > 0 && (
            <div className="px-2.5 py-1 rounded-lg bg-red-950/60 border border-red-800/80 text-xs font-mono text-red-300 flex items-center gap-1.5">
              <AlertOctagon className="w-3.5 h-3.5 text-red-400" />
              <span>{stats.criticalCount} Lỗi nghiêm trọng</span>
            </div>
          )}
        </div>
      </div>

      {/* Filter Tabs & Quick Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto p-1 bg-slate-950 rounded-lg border border-slate-800">
          <button
            type="button"
            onClick={() => setFilterTab('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition whitespace-nowrap ${
              filterTab === 'all'
                ? 'bg-cyan-600 text-white font-bold shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Tất cả (30)
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('ckt1')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition whitespace-nowrap ${
              filterTab === 'ckt1'
                ? 'bg-cyan-600 text-white font-bold shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Phần 1: CKT1 (1–20)
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('saumay')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition whitespace-nowrap ${
              filterTab === 'saumay'
                ? 'bg-cyan-600 text-white font-bold shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Phần 2: Sau máy (21–30)
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('alerts')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition whitespace-nowrap flex items-center gap-1 ${
              filterTab === 'alerts'
                ? 'bg-amber-600 text-white font-bold shadow'
                : 'text-amber-400 hover:text-amber-300'
            }`}
          >
            <AlertTriangle className="w-3 h-3" />
            <span>Lệch chuẩn ({stats.warningCount + stats.criticalCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('empty')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition whitespace-nowrap ${
              filterTab === 'empty'
                ? 'bg-slate-700 text-white font-bold shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Thiếu dữ liệu ({stats.emptyCount})
          </button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Tìm theo tên thông số..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-48 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
          />

          <button
            type="button"
            onClick={onApproveAllNormal}
            className="px-3 py-1.5 text-xs font-semibold text-emerald-300 bg-emerald-950/60 border border-emerald-800 hover:bg-emerald-900/60 rounded-lg transition whitespace-nowrap flex items-center gap-1.5"
            title="Đánh dấu tất cả thông số trong chuẩn là Đã Duyệt"
          >
            <Check className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Duyệt chuẩn</span>
          </button>
        </div>
      </div>

      {/* Main Parameters Table */}
      <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-950/50">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 font-mono uppercase text-[11px]">
              <th className="py-2.5 px-3 w-12 text-center">STT</th>
              <th className="py-2.5 px-3 w-20">Mã</th>
              <th className="py-2.5 px-3">Tên Thông Số (Việt / Anh)</th>
              <th className="py-2.5 px-3 w-48 text-center">Giá Trị Thực Tế</th>
              <th className="py-2.5 px-3 w-16 text-center">Đơn vị</th>
              <th className="py-2.5 px-3 w-36">Dải Tham Chiếu</th>
              <th className="py-2.5 px-3 w-32 text-center">Đánh Giá</th>
              <th className="py-2.5 px-3 w-28 text-center">Xác Nhận</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {filteredParameters.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-500">
                  Không tìm thấy điểm đo phù hợp với bộ lọc hiện tại.
                </td>
              </tr>
            ) : (
              filteredParameters.map((param) => {
                const r = readings[param.id] || {
                  pointId: param.id,
                  value: '',
                  unit: param.unit,
                  reviewStatus: 'NEEDS_REVIEW',
                  severity: 'EMPTY'
                };

                const isWarning = r.severity === 'WARNING';
                const isCritical = r.severity === 'CRITICAL';
                const isNormal = r.severity === 'NORMAL';
                const isEmpty = r.severity === 'EMPTY';

                return (
                  <tr
                    key={param.id}
                    className={`hover:bg-slate-800/40 transition-colors ${
                      isCritical
                        ? 'bg-red-950/15'
                        : isWarning
                        ? 'bg-amber-950/15'
                        : r.reviewStatus === 'APPROVED'
                        ? 'bg-emerald-950/10'
                        : ''
                    }`}
                  >
                    {/* Index */}
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-300">
                      {param.id}
                    </td>

                    {/* Section Code */}
                    <td className="py-2.5 px-3 font-mono text-[11px] text-cyan-400">
                      <span className="px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/50">
                        {param.code}
                      </span>
                    </td>

                    {/* Parameter Name */}
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-100 flex items-center gap-1.5">
                        <span>{param.nameVi}</span>
                        {r.rawText && r.rawText !== r.value && (
                          <span
                            title={`AI OCR: "${r.rawText}"`}
                            className="text-[10px] text-purple-400 cursor-help"
                          >
                            <Sparkles className="w-3 h-3 inline" />
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {param.name}
                      </div>
                      {r.reasonForReview && (
                        <div className="text-[10px] text-amber-300/90 mt-0.5 flex items-center gap-1">
                          <Info className="w-3 h-3 shrink-0" />
                          <span>{r.reasonForReview}</span>
                        </div>
                      )}
                    </td>

                    {/* Value Input Editor */}
                    <td className="py-2.5 px-3">
                      {param.type === 'number' ? (
                        <div className="relative">
                          <input
                            type="text"
                            value={r.value || ''}
                            placeholder="Chưa có số..."
                            onChange={(e) => onUpdateReading(param.id, e.target.value)}
                            className={`w-full font-mono font-bold text-center py-1.5 px-2 rounded-lg border text-xs focus:outline-none transition ${
                              isCritical
                                ? 'bg-red-950/40 border-red-500 text-red-200 focus:ring-1 focus:ring-red-400'
                                : isWarning
                                ? 'bg-amber-950/40 border-amber-500 text-amber-200 focus:ring-1 focus:ring-amber-400'
                                : isNormal
                                ? 'bg-slate-950 border-emerald-700/70 text-emerald-300 focus:border-cyan-400'
                                : 'bg-slate-950 border-slate-700 text-slate-300 focus:border-cyan-400'
                            }`}
                          />
                        </div>
                      ) : param.options ? (
                        <div className="flex items-center justify-center gap-1">
                          {param.options.map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => onUpdateReading(param.id, opt)}
                              className={`px-2 py-1 rounded text-[11px] font-semibold border transition ${
                                r.value === opt
                                  ? opt === 'Yes' && param.id === 2
                                    ? 'bg-red-600 border-red-400 text-white shadow'
                                    : opt.includes('Bình thường') || opt === 'On' || opt === 'No' || opt.includes('Normal') || opt === 'Đầy'
                                    ? 'bg-emerald-600 border-emerald-400 text-white shadow'
                                    : 'bg-amber-600 border-amber-400 text-white shadow'
                                  : 'bg-slate-950 border-slate-700 text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={r.value || ''}
                          onChange={(e) => onUpdateReading(param.id, e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                        />
                      )}
                    </td>

                    {/* Unit */}
                    <td className="py-2.5 px-3 text-center font-mono text-slate-400">
                      {param.unit || '—'}
                    </td>

                    {/* Reference Range */}
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400">
                      <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        {param.referenceText}
                      </span>
                    </td>

                    {/* Severity Evaluation Status */}
                    <td className="py-2.5 px-3 text-center">
                      {isEmpty ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                          <HelpCircle className="w-3 h-3" /> Trống
                        </span>
                      ) : isCritical ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-red-300 bg-red-950 px-2 py-0.5 rounded border border-red-800 font-semibold">
                          <AlertOctagon className="w-3 h-3 text-red-400" /> Bất thường
                        </span>
                      ) : isWarning ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-amber-300 bg-amber-950 px-2 py-0.5 rounded border border-amber-800 font-semibold">
                          <AlertTriangle className="w-3 h-3 text-amber-400" /> Cảnh báo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800 font-semibold">
                          <CheckCircle className="w-3 h-3 text-emerald-400" /> Chuẩn
                        </span>
                      )}
                    </td>

                    {/* Verification Status Action */}
                    <td className="py-2.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateReading(
                            param.id,
                            r.value,
                            r.reviewStatus === 'APPROVED' ? 'NEEDS_REVIEW' : 'APPROVED'
                          )
                        }
                        className={`px-2.5 py-1 rounded text-[11px] font-semibold border transition flex items-center justify-center gap-1 mx-auto ${
                          r.reviewStatus === 'APPROVED'
                            ? 'bg-emerald-950/70 border-emerald-700 text-emerald-300'
                            : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {r.reviewStatus === 'APPROVED' ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span>Đã duyệt</span>
                          </>
                        ) : (
                          <span>Cần ktra</span>
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
