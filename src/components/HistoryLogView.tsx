import React, { useState } from 'react';
import {
  FileText,
  Search,
  Filter,
  Download,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  AlertOctagon,
  Eye,
  ExternalLink,
  HardDrive,
  FileSpreadsheet,
  X,
  FileCheck
} from 'lucide-react';
import {
  HvacInspectionRecord,
  CHILLER_PARAMETERS,
  FORM_METADATA,
  generateCsvExport,
  generateMarkdownReport
} from '../utils/hvac-data';

interface HistoryLogViewProps {
  records: HvacInspectionRecord[];
  onSelectRecord: (record: HvacInspectionRecord) => void;
}

export const HistoryLogView: React.FC<HistoryLogViewProps> = ({
  records,
  onSelectRecord
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterShift, setFilterShift] = useState<'ALL' | 'DAY' | 'NIGHT'>('ALL');
  const [filterChiller, setFilterChiller] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [inspectModalRecord, setInspectModalRecord] = useState<HvacInspectionRecord | null>(null);

  const filtered = records.filter((rec) => {
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const match =
        rec.recordId.toLowerCase().includes(q) ||
        rec.inspectorName.toLowerCase().includes(q) ||
        rec.chillerId.toLowerCase().includes(q) ||
        (rec.notes || '').toLowerCase().includes(q);
      if (!match) return false;
    }

    if (filterShift !== 'ALL' && rec.shift !== filterShift) return false;
    if (filterChiller !== 'ALL' && rec.chillerId !== filterChiller) return false;
    if (filterStatus !== 'ALL' && rec.overallStatus !== filterStatus) return false;

    return true;
  });

  const handleExportAllCsv = () => {
    if (records.length === 0) {
      alert('Chưa có bản ghi nào để xuất file.');
      return;
    }
    const csv = generateCsvExport(records);
    const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csv], {
      type: 'text/csv;charset=utf-8;'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `HVAC_ToanBoNhatKy_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-cyan-950 border border-cyan-800 rounded-lg text-cyan-400">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                Sổ Nhật Ký Vận Hành BMS &amp; Tra Cứu Hồ Sơ
              </h3>
              <p className="text-xs text-slate-400">
                Lưu trữ lịch sử kiểm tra theo ca, đối chiếu sai số và truy vết xác nhận của người trực
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportAllCsv}
              className="px-3 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Xuất toàn bộ CSV ({records.length})</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mt-3 pt-3 border-t border-slate-800">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Tìm theo mã, tên kỹ sư..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <select
              value={filterShift}
              onChange={(e) => setFilterShift(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 font-medium"
            >
              <option value="ALL">Tất cả ca trực</option>
              <option value="DAY">Ca ngày (07h30 - 19h30)</option>
              <option value="NIGHT">Ca đêm (19h30 - 07h30)</option>
            </select>
          </div>

          <div>
            <select
              value={filterChiller}
              onChange={(e) => setFilterChiller(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 font-medium"
            >
              <option value="ALL">Tất cả thiết bị Chiller</option>
              {FORM_METADATA.chillerOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 font-medium"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="APPROVED">Đã duyệt chính thức</option>
              <option value="NEEDS_REVIEW">Chờ kiểm tra</option>
            </select>
          </div>
        </div>
      </div>

      {/* Records Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 font-mono uppercase text-[11px]">
                <th className="py-3 px-4">Mã Bản Ghi</th>
                <th className="py-3 px-4">Ngày &amp; Giờ Vận Hành</th>
                <th className="py-3 px-4">Thiết Bị</th>
                <th className="py-3 px-4">Người Kiểm Tra</th>
                <th className="py-3 px-4 text-center">Tiến Độ Điểm Đo</th>
                <th className="py-3 px-4 text-center">Trạng Thái Hồ Sơ</th>
                <th className="py-3 px-4 text-center">Google Sync</th>
                <th className="py-3 px-4 text-center">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    Chưa có bản ghi nào phù hợp với bộ lọc tìm kiếm.
                  </td>
                </tr>
              ) : (
                filtered.map((rec) => {
                  const filledCount = Object.values(rec.readings).filter(
                    (r) => r.value && r.severity !== 'EMPTY'
                  ).length;
                  const alertCount = Object.values(rec.readings).filter(
                    (r) => r.severity === 'WARNING' || r.severity === 'CRITICAL'
                  ).length;

                  return (
                    <tr
                      key={rec.recordId}
                      className="hover:bg-slate-800/40 transition-colors"
                    >
                      {/* ID */}
                      <td className="py-3 px-4 font-mono font-bold text-cyan-400">
                        {rec.recordId}
                      </td>

                      {/* Date & Time */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-200">
                          {rec.operatingDate}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3 text-cyan-400" />
                          <span>
                            {rec.scheduledTime} ({rec.shift === 'DAY' ? 'Ca ngày' : 'Ca đêm'})
                          </span>
                        </div>
                      </td>

                      {/* Chiller */}
                      <td className="py-3 px-4 font-medium text-slate-300">
                        <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 font-mono">
                          {rec.chillerId}
                        </span>
                      </td>

                      {/* Inspector */}
                      <td className="py-3 px-4 text-slate-300">
                        <div className="font-medium">{rec.inspectorName}</div>
                        {rec.reviewedAt && (
                          <div className="text-[10px] text-slate-500 font-mono">
                            Duyệt: {rec.reviewedAt}
                          </div>
                        )}
                      </td>

                      {/* Progress / Alerts */}
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5 font-mono">
                          <span className="text-slate-200 font-bold">{filledCount}/30</span>
                          {alertCount > 0 && (
                            <span className="text-[10px] font-semibold text-amber-400 bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-800">
                              {alertCount} lệch chuẩn
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Review status */}
                      <td className="py-3 px-4 text-center">
                        {rec.overallStatus === 'APPROVED' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                            <CheckCircle className="w-3 h-3 text-emerald-400" /> Đã duyệt
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-300 bg-amber-950 px-2 py-0.5 rounded border border-amber-800">
                            <AlertTriangle className="w-3 h-3 text-amber-400" /> Chờ ktra
                          </span>
                        )}
                      </td>

                      {/* Sync status */}
                      <td className="py-3 px-4 text-center font-mono text-[11px]">
                        {rec.syncStatus === 'SYNCED' ? (
                          <span className="text-emerald-400">Đã đồng bộ</span>
                        ) : (
                          <span className="text-slate-500">Chưa đẩy Drive</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setInspectModalRecord(rec)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-cyan-300 transition"
                            title="Xem chi tiết 30 thông số"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onSelectRecord(rec)}
                            className="px-2 py-1 rounded bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 text-[11px] font-semibold transition"
                          >
                            Tải lại
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Modal Details */}
      {inspectModalRecord && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Chi Tiết Bản Ghi: {inspectModalRecord.recordId}</span>
                  <span className="text-xs font-normal font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                    {FORM_METADATA.formCode}
                  </span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  {inspectModalRecord.chillerId} • {inspectModalRecord.operatingDate} (
                  {inspectModalRecord.scheduledTime}) • Người lập: {inspectModalRecord.inspectorName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setInspectModalRecord(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                {CHILLER_PARAMETERS.map((p) => {
                  const r = inspectModalRecord.readings[p.id];
                  const isWarn = r?.severity === 'WARNING';
                  const isCrit = r?.severity === 'CRITICAL';

                  return (
                    <div
                      key={p.id}
                      className={`p-2.5 rounded-lg border bg-slate-950/80 space-y-1 ${
                        isCrit
                          ? 'border-red-800 bg-red-950/20'
                          : isWarn
                          ? 'border-amber-800 bg-amber-950/20'
                          : 'border-slate-800'
                      }`}
                    >
                      <div className="text-[11px] text-slate-400 flex items-center justify-between font-mono">
                        <span>P{p.id} [{p.code}]</span>
                        <span className="text-[10px] text-slate-500">{p.unit || p.referenceText}</span>
                      </div>
                      <div className="font-semibold text-slate-200 line-clamp-1">
                        {p.nameVi}
                      </div>
                      <div className="flex items-baseline justify-between pt-1">
                        <span className={`font-mono font-bold ${
                          isCrit ? 'text-red-400' : isWarn ? 'text-amber-400' : 'text-cyan-300'
                        }`}>
                          {r?.value || '—'} {p.unit}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          Ref: {p.referenceText}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {inspectModalRecord.aiDiagnosticSummary && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-xs">
                  <div className="font-bold text-cyan-400">Nhận định AI:</div>
                  <p className="text-slate-300 leading-relaxed">
                    {inspectModalRecord.aiDiagnosticSummary}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Ghi chú: {inspectModalRecord.notes || 'Không có ghi chú'}
              </span>
              <button
                type="button"
                onClick={() => setInspectModalRecord(null)}
                className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
