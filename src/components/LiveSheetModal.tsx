import React from 'react';
import {
  FileSpreadsheet,
  ExternalLink,
  Download,
  X,
  CheckCircle2,
  Clock,
  ShieldCheck
} from 'lucide-react';
import {
  HvacInspectionRecord,
  CHILLER_PARAMETERS,
  FORM_METADATA,
  generateCsvExport
} from '../utils/hvac-data';

interface LiveSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: HvacInspectionRecord[];
  activeSheetUrl: string | null;
  activeSheetId: string | null;
}

export const LiveSheetModal: React.FC<LiveSheetModalProps> = ({
  isOpen,
  onClose,
  records,
  activeSheetUrl,
  activeSheetId
}) => {
  if (!isOpen) return null;

  const isPlaceholder =
    !activeSheetUrl ||
    activeSheetUrl.includes('1-B01-QT04') ||
    activeSheetUrl.includes('1B01-QT04') ||
    !activeSheetId ||
    activeSheetId.includes('1-B01-QT04') ||
    activeSheetId.includes('1B01-QT04');

  const displaySheetUrl =
    activeSheetUrl ||
    (activeSheetId
      ? `https://docs.google.com/spreadsheets/d/${activeSheetId}/edit`
      : 'https://docs.google.com/spreadsheets/d/1-B01-QT04-SGN-KTG-DQT-HVAC-MASTER/edit');

  const handleOpenSheetSafe = () => {
    if (isPlaceholder) {
      const openNew = window.confirm(
        'Đường link hiện tại là Bảng Tính Trực Tuyến mô phỏng của hệ thống.\n\nBạn có muốn mở trang tạo Google Sheet mới (sheets.new) để liên kết Google Drive của bạn không?'
      );
      if (openNew) {
        window.open('https://sheets.new', '_blank', 'noopener,noreferrer');
      }
    } else {
      window.open(displaySheetUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleDownloadCsv = () => {
    const csvStr = generateCsvExport(records);
    const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csvStr], {
      type: 'text/csv;charset=utf-8;'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Google_Sheet_${FORM_METADATA.formCode.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-6xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">
                  Kiểm Tra Sổ Nhật Ký Google Sheet ({FORM_METADATA.formCode})
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                  Sheet Trực Tuyến
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Xem trước cấu trúc bảng tính chuẩn 30 thông số đã lưu trữ theo ca trực
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenSheetSafe}
              className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center gap-1.5 shadow cursor-pointer active:scale-95"
            >
              <span>Mở trên Google Sheets</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Link Banner */}
        <div className="px-6 py-3 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <span className="font-semibold text-emerald-400">Đường link Google Sheet:</span>
            <button
              type="button"
              onClick={handleOpenSheetSafe}
              className="text-cyan-400 hover:underline font-mono truncate max-w-md sm:max-w-xl text-left cursor-pointer"
            >
              {displaySheetUrl}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadCsv}
              className="px-2.5 py-1 text-xs font-medium rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-1"
            >
              <Download className="w-3 h-3 text-cyan-400" />
              <span>Tải bản sao (.csv)</span>
            </button>
          </div>
        </div>

        {/* Spreadsheet Data Grid */}
        <div className="flex-1 overflow-auto p-4 bg-slate-950/60">
          <div className="border border-slate-800 rounded-xl overflow-hidden shadow-inner">
            <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
              <thead>
                <tr className="bg-slate-900 text-slate-300 border-b border-slate-800 font-mono text-[11px]">
                  <th className="py-2.5 px-3 border-r border-slate-800 bg-slate-900/90 sticky left-0 z-10 text-center w-12">
                    #
                  </th>
                  <th className="py-2.5 px-3 border-r border-slate-800 font-bold text-cyan-400">
                    Mã bản ghi
                  </th>
                  <th className="py-2.5 px-3 border-r border-slate-800">Ngày vận hành</th>
                  <th className="py-2.5 px-3 border-r border-slate-800">Ca trực</th>
                  <th className="py-2.5 px-3 border-r border-slate-800">Mốc giờ</th>
                  <th className="py-2.5 px-3 border-r border-slate-800">Thiết bị</th>
                  <th className="py-2.5 px-3 border-r border-slate-800">Người kiểm tra</th>
                  <th className="py-2.5 px-3 border-r border-slate-800 text-center">Trạng thái</th>
                  {CHILLER_PARAMETERS.map((p) => (
                    <th
                      key={p.id}
                      className="py-2.5 px-3 border-r border-slate-800 font-medium"
                      title={p.descriptionVi}
                    >
                      P{p.id}. {p.nameVi} {p.unit ? `(${p.unit})` : ''}
                    </th>
                  ))}
                  <th className="py-2.5 px-3">Ghi chú kíp trực</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 font-mono text-xs">
                {records.length === 0 ? (
                  <tr>
                    <td colSpan={38} className="py-8 text-center text-slate-500 font-sans">
                      Chưa có bản ghi nhật ký nào. Vui lòng xác nhận bản ghi đầu tiên để lưu vào Sheet.
                    </td>
                  </tr>
                ) : (
                  records.map((rec, idx) => (
                    <tr key={rec.recordId || idx} className="hover:bg-slate-800/40">
                      <td className="py-2 px-3 border-r border-slate-800 bg-slate-950/90 sticky left-0 z-10 text-center text-slate-500 font-bold">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-800 text-cyan-300 font-bold">
                        {rec.recordId}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-800 text-slate-300">
                        {rec.operatingDate}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-800 text-slate-300">
                        {rec.shift === 'DAY' ? 'Ca ngày' : 'Ca đêm'}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-800 text-slate-300 font-bold">
                        {rec.scheduledTime}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-800 text-slate-200">
                        {rec.chillerId}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-800 text-slate-300 font-sans">
                        {rec.inspectorName}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-800 text-center font-sans">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
                          {rec.overallStatus === 'APPROVED' ? 'Đã duyệt' : 'Chờ ktra'}
                        </span>
                      </td>
                      {CHILLER_PARAMETERS.map((p) => {
                        const r = rec.readings[p.id];
                        const isWarn = r?.severity === 'WARNING';
                        const isCrit = r?.severity === 'CRITICAL';
                        return (
                          <td
                            key={p.id}
                            className={`py-2 px-3 border-r border-slate-800 text-center ${
                              isCrit
                                ? 'text-red-400 font-bold bg-red-950/20'
                                : isWarn
                                ? 'text-amber-400 font-bold bg-amber-950/20'
                                : 'text-slate-300'
                            }`}
                          >
                            {r?.value || '—'}
                          </td>
                        );
                      })}
                      <td className="py-2 px-3 text-slate-400 font-sans truncate max-w-xs">
                        {rec.notes || '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>
            Tổng cộng: <strong className="text-white">{records.length}</strong> hàng dữ liệu ca trực
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition font-medium"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
