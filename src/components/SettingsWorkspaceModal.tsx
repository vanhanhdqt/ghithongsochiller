import React, { useState } from 'react';
import {
  Settings,
  FileSpreadsheet,
  HardDrive,
  Mail,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  PlusCircle,
  Loader2,
  FileText
} from 'lucide-react';
import { FORM_METADATA } from '../utils/hvac-data';
import { createHvacMasterSheet } from '../services/workspace-services';

interface SettingsWorkspaceModalProps {
  accessToken: string | null;
  activeSheetId: string | null;
  activeSheetUrl: string | null;
  setActiveSheetId: (id: string, url: string) => void;
  defaultEmail: string;
  setDefaultEmail: (email: string) => void;
}

export const SettingsWorkspaceModal: React.FC<SettingsWorkspaceModalProps> = ({
  accessToken,
  activeSheetId,
  activeSheetUrl,
  setActiveSheetId,
  defaultEmail,
  setDefaultEmail
}) => {
  const [manualSheetId, setManualSheetId] = useState(activeSheetId || '');
  const [isCreatingNewSheet, setIsCreatingNewSheet] = useState(false);
  const [customTitle, setCustomTitle] = useState('');

  const handleCreateNewMaster = async () => {
    if (!accessToken) {
      alert('Vui lòng kết nối tài khoản Google Workspace trước khi tạo bảng tính.');
      return;
    }

    setIsCreatingNewSheet(true);
    try {
      const res = await createHvacMasterSheet(accessToken, customTitle || undefined);
      setActiveSheetId(res.spreadsheetId, res.spreadsheetUrl);
      setManualSheetId(res.spreadsheetId);
      alert('Đã khởi tạo thành công Google Sheet chuẩn với tiêu đề cột!');
    } catch (err: any) {
      alert(`Lỗi tạo bảng tính: ${err.message || 'Lỗi mạng'}`);
    } finally {
      setIsCreatingNewSheet(false);
    }
  };

  const handleApplyManualSheetId = () => {
    if (!manualSheetId.trim()) return;
    const raw = manualSheetId.trim();
    const urlMatch = raw.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    const cleanId = urlMatch ? urlMatch[1] : raw;
    const url = `https://docs.google.com/spreadsheets/d/${cleanId}/edit`;
    setActiveSheetId(cleanId, url);
    setManualSheetId(cleanId);
    alert('Đã cập nhật mã Google Spreadsheet liên kết thành công!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-cyan-950 border border-cyan-800 rounded-xl text-cyan-400">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              Cấu Hình Biểu Mẫu &amp; Kết Nối Google Workspace
            </h3>
            <p className="text-xs text-slate-400">
              Quản lý biểu mẫu chuẩn B01.QT04/SGN-KTG-ĐQT, liên kết Google Sheets, Google Drive, Gmail và Google Forms
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Box 1: Form Specs */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <h4 className="text-xs font-bold text-slate-200">
              Thông Tin Biểu Mẫu Kỹ Thuật Tiêu Chuẩn
            </h4>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Mã hiệu văn bản:</span>
              <span className="font-mono font-bold text-cyan-400">{FORM_METADATA.formCode}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Tên biểu mẫu:</span>
              <span className="font-semibold text-slate-200">{FORM_METADATA.formTitle}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Lần ban hành / sửa đổi:</span>
              <span className="font-mono text-slate-200">{FORM_METADATA.revision}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Số lượng thông số chuẩn:</span>
              <span className="font-mono font-bold text-emerald-400">30 thông số (20 CKT1 + 10 Sau máy)</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Mốc giờ kiểm tra Ca Ngày:</span>
              <span className="font-mono text-slate-200">08:00, 11:00, 14:00, 18:00</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Mốc giờ kiểm tra Ca Đêm:</span>
              <span className="font-mono text-slate-200">20:00, 22:00, 00:00, 04:00</span>
            </div>
          </div>

          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <span className="font-bold text-cyan-400 block">Quy tắc an toàn vận hành:</span>
            <p>
              • Trí tuệ nhân tạo (Gemini AI) đóng vai trò nhận diện thị giác và hỗ trợ tính toán sai số, không bao giờ gửi lệnh can thiệp BMS/PLC.
            </p>
            <p>
              • Không âm thầm ghi đè dữ liệu. Mọi bản ghi chỉ được lưu chính thức sau khi kỹ sư kíp trực xác nhận.
            </p>
          </div>
        </div>

        {/* Box 2: Google Workspace Integration Hub */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <h4 className="text-xs font-bold text-slate-200">
              Cấu Hình Google Sheets Đồng Bộ
            </h4>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Google Spreadsheet ID hiện tại
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Dán mã ID hoặc link Google Sheet..."
                  value={manualSheetId}
                  onChange={(e) => setManualSheetId(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="button"
                  onClick={handleApplyManualSheetId}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
                >
                  Áp dụng
                </button>
              </div>
            </div>

            {activeSheetUrl && (
              <div className="p-3 bg-emerald-950/60 border border-emerald-800 rounded-lg text-xs flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Đang kết nối với Google Sheet</span>
                </div>
                <a
                  href={activeSheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 font-bold underline flex items-center gap-1 hover:text-emerald-300"
                >
                  Mở Sheet <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            <div className="pt-2 border-t border-slate-800 space-y-2">
              <label className="block text-xs font-medium text-slate-300">
                Tạo nhanh Bảng tính Google Sheets mới (1-Click)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Tên sổ ghi (Tùy chọn)..."
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="button"
                  onClick={handleCreateNewMaster}
                  disabled={isCreatingNewSheet}
                  className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isCreatingNewSheet ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <PlusCircle className="w-4 h-4" />
                  )}
                  <span>Tạo Sheet mới</span>
                </button>
              </div>
            </div>

            {/* Default Email for Shift Handover */}
            <div className="pt-2 border-t border-slate-800">
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Email mặc định nhận bàn giao ca (Gmail)
              </label>
              <input
                type="email"
                value={defaultEmail}
                onChange={(e) => setDefaultEmail(e.target.value)}
                placeholder="vanhanhdienQT@gmail.com"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
