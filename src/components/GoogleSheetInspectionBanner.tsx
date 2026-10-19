import React, { useState } from 'react';
import {
  FileSpreadsheet,
  ExternalLink,
  Copy,
  Check,
  Eye,
  CheckCircle2,
  Clock,
  Sparkles,
  LogIn,
  PlusCircle,
  Link as LinkIcon,
  Loader2,
  X,
  AlertCircle
} from 'lucide-react';
import { HvacInspectionRecord } from '../utils/hvac-data';
import { createHvacMasterSheet } from '../services/workspace-services';

interface GoogleSheetInspectionBannerProps {
  sheetUrl: string;
  sheetId?: string | null;
  lastRecord?: HvacInspectionRecord;
  accessToken: string | null;
  onOpenPreview: () => void;
  onConnectGoogle?: () => Promise<void> | void;
  onUpdateSheetUrl?: (newId: string, newUrl: string) => void;
}

export const GoogleSheetInspectionBanner: React.FC<GoogleSheetInspectionBannerProps> = ({
  sheetUrl,
  sheetId,
  lastRecord,
  accessToken,
  onOpenPreview,
  onConnectGoogle,
  onUpdateSheetUrl
}) => {
  const [copied, setCopied] = useState(false);
  const [isCreatingSheet, setIsCreatingSheet] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [inputUrlOrId, setInputUrlOrId] = useState('');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Check if current URL is the unconfigured dummy placeholder
  const isPlaceholder =
    !sheetUrl ||
    sheetUrl.includes('1B01-QT04-SGN-KTG-DQT-HVAC-MASTER') ||
    sheetUrl.includes('1-B01-QT04-SGN-KTG-DQT-HVAC-MASTER');

  const handleCopy = () => {
    navigator.clipboard.writeText(sheetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Safe handler to open Google Sheet
  const handleOpenSheet = () => {
    if (isPlaceholder) {
      // If it's the dummy placeholder, opening it leads to Google Drive 404
      // Open in-app Live Sheet Preview instead and alert user
      onOpenPreview();
      setActionNotice(
        'Đang mở Bảng Tính Trực Tuyến nội bộ (Live Sheet). Để mở trực tiếp trên Google Drive riêng, hãy bấm "Tạo Google Sheet mới trên Drive" hoặc "Dán link Sheet của bạn".'
      );
    } else {
      window.open(sheetUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // Quick 1-click create real Google Sheet on user's Drive
  const handleQuickCreateSheet = async () => {
    if (!accessToken) {
      if (onConnectGoogle) {
        setActionNotice('Vui lòng hoàn tất kết nối Google Workspace để ứng dụng tạo Sheet trên Drive của bạn.');
        await onConnectGoogle();
      }
      return;
    }

    setIsCreatingSheet(true);
    try {
      const res = await createHvacMasterSheet(
        accessToken,
        `Sổ Nhật Ký BMS Chiller - B01.QT04 (${new Date().toLocaleDateString('vi-VN')})`
      );
      if (onUpdateSheetUrl) {
        onUpdateSheetUrl(res.spreadsheetId, res.spreadsheetUrl);
      }
      setActionNotice(`✅ Đã tạo thành công Google Sheet mới trên Drive của bạn! Bấm "Mở Google Sheet" để kiểm tra.`);
    } catch (err: any) {
      alert(`Không thể tạo Google Sheet: ${err.message || 'Lỗi kết nối'}`);
    } finally {
      setIsCreatingSheet(false);
    }
  };

  // Apply custom sheet ID or full URL
  const handleSaveCustomSheet = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = inputUrlOrId.trim();
    if (!raw) return;

    // Support full Google Sheets URL regex or raw ID
    const urlMatch = raw.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    const cleanId = urlMatch ? urlMatch[1] : raw;
    const finalUrl = `https://docs.google.com/spreadsheets/d/${cleanId}/edit`;

    if (onUpdateSheetUrl) {
      onUpdateSheetUrl(cleanId, finalUrl);
    }
    setIsConfigModalOpen(false);
    setInputUrlOrId('');
    setActionNotice(`✅ Đã liên kết thành công với Google Sheet ID: ${cleanId}`);
  };

  return (
    <>
      <div className="bg-gradient-to-r from-emerald-950/90 via-slate-900 to-cyan-950/90 border-2 border-emerald-500/50 rounded-xl p-4 sm:p-5 shadow-2xl space-y-3.5 transition">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-emerald-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-900/70 border border-emerald-500/60 flex items-center justify-center text-emerald-300 shadow">
              <FileSpreadsheet className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-sm font-bold text-emerald-200">
                  Đường Link Google Sheet Kiểm Tra Nhật Ký Ca Trực
                </h4>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-900/90 text-emerald-300 border border-emerald-600/70 font-bold flex items-center gap-1 shadow-sm">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ĐÃ CẬP NHẬT 30 THÔNG SỐ
                </span>
                {!isPlaceholder ? (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700/80 font-bold">
                    🟢 ĐÃ KẾT NỐI DRIVE RIÊNG
                  </span>
                ) : (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-950/90 text-amber-300 border border-amber-700/70 font-bold">
                    🔷 BẢNG TÍNH TRỰC TUYẾN NỘI BỘ
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Biểu mẫu kỹ thuật chuẩn B01.QT04/SGN-KTG-ĐQT • Số liệu đã tự động cập nhật và sẵn sàng kiểm tra
              </p>
            </div>
          </div>

          {/* Quick status badge */}
          {lastRecord && (
            <div className="flex items-center gap-2 text-xs font-mono bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800 shadow-sm shrink-0">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-slate-400">Ca trực:</span>
              <span className="text-cyan-300 font-bold">{lastRecord.chillerId}</span>
              <span className="text-slate-600">|</span>
              <span className="text-amber-300 font-semibold">{lastRecord.scheduledTime}</span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-300">{lastRecord.operatingDate}</span>
            </div>
          )}
        </div>

        {/* Temporary Notification Banner */}
        {actionNotice && (
          <div className="p-3 bg-emerald-950/70 border border-emerald-700/80 rounded-lg text-emerald-200 text-xs flex items-center justify-between gap-2 animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{actionNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setActionNotice(null)}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Main Sheet URL display & Action buttons */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-slate-950/90 p-3 rounded-lg border border-emerald-900/50">
          <div className="flex-1 min-w-0 flex items-center gap-2">
            <span className="text-xs text-slate-400 shrink-0 font-medium hidden sm:inline">
              Đường link Sheet:
            </span>
            <div className="flex-1 font-mono text-xs text-emerald-300 bg-slate-900 px-3 py-2 rounded border border-slate-800 truncate select-all">
              {sheetUrl}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Copy Button */}
            <button
              type="button"
              onClick={handleCopy}
              className="px-3 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-1.5 active:scale-95"
              title="Sao chép đường link"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Đã chép link!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-300" />
                  <span>Sao chép link</span>
                </>
              )}
            </button>

            {/* In-app live preview button */}
            <button
              type="button"
              onClick={onOpenPreview}
              className="px-3 py-2 text-xs font-semibold rounded-lg bg-cyan-950/70 hover:bg-cyan-900 text-cyan-300 border border-cyan-800/90 transition flex items-center gap-1.5 active:scale-95"
              title="Xem trước bảng tính trực tiếp trong ứng dụng"
            >
              <Eye className="w-3.5 h-3.5 text-cyan-400" />
              <span>Xem trực tiếp (Live Sheet)</span>
            </button>

            {/* Open Google Sheet External Button */}
            <button
              type="button"
              onClick={handleOpenSheet}
              className="px-4 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/50 transition flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <ExternalLink className="w-4 h-4 text-emerald-100" />
              <span>Mở Google Sheet kiểm tra ngay</span>
            </button>

            {/* Configure / Link custom sheet */}
            <button
              type="button"
              onClick={() => setIsConfigModalOpen(true)}
              className="px-3 py-2 text-xs font-medium rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition flex items-center gap-1"
              title="Nhập URL hoặc ID Google Sheet của bạn"
            >
              <LinkIcon className="w-3.5 h-3.5" />
              <span>Đổi link Sheet</span>
            </button>
          </div>
        </div>

        {/* Quick Sheet Creation Actions */}
        <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs text-slate-400 border-t border-slate-800/60">
          <div className="flex items-center gap-1.5 text-emerald-300/90">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>
              {isPlaceholder
                ? 'Bạn muốn tạo bảng tính chính thức mới trên Google Drive của mình để lưu trữ vĩnh viễn?'
                : 'Bảng tính Google Sheets đã được liên kết với ca trực.'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {accessToken ? (
              <button
                type="button"
                onClick={handleQuickCreateSheet}
                disabled={isCreatingSheet}
                className="px-3 py-1 rounded-md bg-emerald-700/80 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 transition disabled:opacity-50"
              >
                {isCreatingSheet ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang khởi tạo Sheet...</span>
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-3.5 h-3.5 text-emerald-200" />
                    <span>Tạo Google Sheet mới trên Drive</span>
                  </>
                )}
              </button>
            ) : (
              onConnectGoogle && (
                <button
                  type="button"
                  onClick={onConnectGoogle}
                  className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 underline flex items-center gap-1"
                >
                  <LogIn className="w-3 h-3" />
                  Kết nối Google Workspace để tạo Sheet riêng
                </button>
              )
            )}

            <a
              href="https://sheets.new"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-slate-200 underline text-[11px]"
            >
              Mở sheets.new
            </a>
          </div>
        </div>
      </div>

      {/* Modal: Configure / Paste Custom Sheet URL */}
      {isConfigModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>Liên Kết Đường Link Google Sheet Của Bạn</span>
              </div>
              <button
                type="button"
                onClick={() => setIsConfigModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Dán toàn bộ đường link Google Sheet (ví dụ: <code className="text-cyan-300 bg-slate-950 px-1 py-0.5 rounded">https://docs.google.com/spreadsheets/d/1abcXYZ.../edit</code>) hoặc mã Spreadsheet ID của bạn. Hệ thống sẽ tự động cập nhật liên kết và lưu số liệu trực tiếp.
            </p>

            <form onSubmit={handleSaveCustomSheet} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Đường Link hoặc ID Google Sheet:
                </label>
                <input
                  type="text"
                  value={inputUrlOrId}
                  onChange={(e) => setInputUrlOrId(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-emerald-300 focus:outline-hidden focus:border-emerald-500"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsConfigModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={!inputUrlOrId.trim()}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-xs"
                >
                  Lưu &amp; Liên Kết Sheet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
