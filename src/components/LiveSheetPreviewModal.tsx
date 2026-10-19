import React, { useState } from 'react';
import {
  FileSpreadsheet,
  X,
  ExternalLink,
  Download,
  Copy,
  Check,
  CheckCircle2,
  AlertTriangle,
  Search
} from 'lucide-react';
import { CHILLER_PARAMETERS, HvacInspectionRecord, generateCsvExport } from '../utils/hvac-data';

interface LiveSheetPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: HvacInspectionRecord[];
  sheetUrl: string;
}

export const LiveSheetPreviewModal: React.FC<LiveSheetPreviewModalProps> = ({
  isOpen,
  onClose,
  records,
  sheetUrl
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [copied, setCopied] = useState(false);

  const isPlaceholder =
    !sheetUrl ||
    sheetUrl.includes('1B01-QT04-SGN-KTG-DQT-HVAC-MASTER') ||
    sheetUrl.includes('1-B01-QT04-SGN-KTG-DQT-HVAC-MASTER');

  const handleOpenSheetSafe = () => {
    if (isPlaceholder) {
      const openNew = window.confirm(
        'Đường link hiện tại là Bảng Tính Trực Tuyến nội bộ của ứng dụng.\n\nBạn có muốn mở Google Sheets mới (sheets.new) để tạo file trên Google Drive của mình không?'
      );
      if (openNew) {
        window.open('https://sheets.new', '_blank', 'noopener,noreferrer');
      }
    } else {
      window.open(sheetUrl, '_blank', 'noopener,noreferrer');
    }
  };

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(sheetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCsv = () => {
    const csvStr = generateCsvExport(records);
    const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csvStr], {
      type: 'text/csv;charset=utf-8;'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `So_Nhat_Ky_BMS_Chiller_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredRecords = records.filter((r) => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return (
      r.recordId.toLowerCase().includes(s) ||
      r.chillerId.toLowerCase().includes(s) ||
      r.operatingDate.includes(s) ||
      r.scheduledTime.includes(s) ||
      r.inspectorName.toLowerCase().includes(s)
    );
  });

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-6xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-700 text-emerald-400 flex items-center justify-center shadow">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  Xem Trước Bảng Tính Google Sheet - Sổ Nhật Ký BMS Chiller
                </h3>
                <span className="text-xs font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                  {records.length} hàng dữ liệu
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Cấu trúc chuẩn theo Biểu mẫu B01.QT04/SGN-KTG-ĐQT (Rev 02/00) gồm 30 cột thông số kỹ thuật
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenSheetSafe}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow cursor-pointer active:scale-95"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Mở Google Sheet</span>
            </button>
            <button
              type="button"
              onClick={handleCopyLink}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition flex items-center gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Đã chép' : 'Chép link'}</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadCsv}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Tải CSV</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar & Search */}
        <div className="p-3 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Lọc theo mã bản ghi, thiết bị, mốc giờ..."
              className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
          <div className="text-xs text-slate-400 font-mono">
            Hiển thị <span className="text-cyan-400 font-bold">{filteredRecords.length}</span> / {records.length} bản ghi ca trực
          </div>
        </div>

        {/* Spreadsheet Data Grid */}
        <div className="flex-1 overflow-auto bg-slate-950 p-4">
          <div className="inline-block min-w-full align-middle">
            <table className="min-w-full border-collapse border border-slate-700 text-xs text-slate-200">
              <thead className="bg-slate-900 text-slate-300 font-bold sticky top-0 z-10">
                <tr className="border-b border-slate-700">
                  <th className="border border-slate-700 p-2 text-center whitespace-nowrap bg-slate-900">#</th>
                  <th className="border border-slate-700 p-2 text-left whitespace-nowrap bg-slate-900">Mã bản ghi</th>
                  <th className="border border-slate-700 p-2 text-center whitespace-nowrap bg-slate-900">Ngày vận hành</th>
                  <th className="border border-slate-700 p-2 text-center whitespace-nowrap bg-slate-900">Ca trực</th>
                  <th className="border border-slate-700 p-2 text-center whitespace-nowrap bg-slate-900">Mốc giờ</th>
                  <th className="border border-slate-700 p-2 text-left whitespace-nowrap bg-slate-900">Thiết bị</th>
                  <th className="border border-slate-700 p-2 text-left whitespace-nowrap bg-slate-900">Người kiểm tra</th>
                  <th className="border border-slate-700 p-2 text-center whitespace-nowrap bg-slate-900">Trạng thái</th>
                  {CHILLER_PARAMETERS.map((p) => (
                    <th
                      key={p.id}
                      className="border border-slate-700 p-2 text-center whitespace-nowrap font-mono text-[11px] bg-slate-900/95"
                      title={`${p.nameVi} (${p.referenceText})`}
                    >
                      [{p.id}] {p.code} - {p.nameVi} {p.unit ? `(${p.unit})` : ''}
                    </th>
                  ))}
                  <th className="border border-slate-700 p-2 text-left whitespace-nowrap bg-slate-900">Ghi chú</th>
                  <th className="border border-slate-700 p-2 text-left whitespace-nowrap bg-slate-900">Ý kiến AI Chẩn đoán</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredRecords.map((rec, idx) => (
                  <tr
                    key={rec.recordId}
                    className={`hover:bg-slate-800/60 transition ${
                      idx === 0 ? 'bg-cyan-950/20 font-medium' : ''
                    }`}
                  >
                    <td className="border border-slate-700/80 p-2 text-center text-slate-500 font-mono text-[11px]">
                      {idx + 1}
                    </td>
                    <td className="border border-slate-700/80 p-2 font-mono text-[11px] text-cyan-300 whitespace-nowrap font-bold">
                      {rec.recordId}
                      {idx === 0 && (
                        <span className="ml-1.5 px-1 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-700 text-[9px]">
                          VỪA LƯU
                        </span>
                      )}
                    </td>
                    <td className="border border-slate-700/80 p-2 text-center font-mono whitespace-nowrap">
                      {rec.operatingDate}
                    </td>
                    <td className="border border-slate-700/80 p-2 text-center whitespace-nowrap">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                          rec.shift === 'DAY'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                        }`}
                      >
                        {rec.shift === 'DAY' ? 'Ca ngày' : 'Ca đêm'}
                      </span>
                    </td>
                    <td className="border border-slate-700/80 p-2 text-center font-mono font-bold text-amber-400 whitespace-nowrap">
                      {rec.scheduledTime}
                    </td>
                    <td className="border border-slate-700/80 p-2 whitespace-nowrap font-medium text-slate-200">
                      {rec.chillerId}
                    </td>
                    <td className="border border-slate-700/80 p-2 whitespace-nowrap text-slate-300">
                      {rec.inspectorName}
                    </td>
                    <td className="border border-slate-700/80 p-2 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                          rec.overallStatus === 'APPROVED'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-amber-950 text-amber-300 border border-amber-800'
                        }`}
                      >
                        {rec.overallStatus === 'APPROVED' ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> ĐÃ DUYỆT
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-3 h-3 text-amber-400" /> CHỜ DUYỆT
                          </>
                        )}
                      </span>
                    </td>

                    {/* 30 Parameters Columns */}
                    {CHILLER_PARAMETERS.map((p) => {
                      const reading = rec.readings[p.id];
                      const val = reading?.value || '—';
                      const isAlert = reading?.severity === 'WARNING' || reading?.severity === 'CRITICAL';
                      return (
                        <td
                          key={p.id}
                          className={`border border-slate-700/80 p-2 text-center font-mono whitespace-nowrap ${
                            isAlert
                              ? 'bg-amber-950/40 text-amber-300 font-bold'
                              : val === '—'
                              ? 'text-slate-600'
                              : 'text-slate-200'
                          }`}
                        >
                          {val}
                        </td>
                      );
                    })}

                    <td className="border border-slate-700/80 p-2 text-slate-400 text-[11px] max-w-xs truncate">
                      {rec.notes || '—'}
                    </td>
                    <td className="border border-slate-700/80 p-2 text-slate-400 text-[11px] max-w-sm truncate">
                      {rec.aiDiagnosticSummary || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Google Sheets Sync Ready • Định dạng dữ liệu tương thích 100% với Google Workspace</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
