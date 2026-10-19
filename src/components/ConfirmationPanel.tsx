import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  FileSpreadsheet,
  HardDrive,
  Mail,
  FileText,
  Download,
  Printer,
  CheckCircle,
  AlertTriangle,
  Loader2,
  ExternalLink,
  Send,
  PlusCircle,
  X,
  Clock
} from 'lucide-react';
import {
  FORM_METADATA,
  HvacInspectionRecord,
  calculateRecordStats,
  generateCsvExport,
  generateMarkdownReport,
  getHandoverInfo
} from '../utils/hvac-data';
import {
  createHvacMasterSheet,
  appendHvacRecordToSheet,
  saveReportFileToDrive,
  sendShiftReportEmail,
  createHvacGoogleForm
} from '../services/workspace-services';
import { googleSignIn } from '../services/firebase-auth';

interface ConfirmationPanelProps {
  currentRecord: HvacInspectionRecord;
  onRecordApproved: (updatedRecord: HvacInspectionRecord) => void;
  accessToken: string | null;
  activeSheetId: string | null;
  activeSheetUrl: string | null;
  setActiveSheetId: (id: string, url: string) => void;
  onOpenLiveSheetModal?: () => void;
}

export const ConfirmationPanel: React.FC<ConfirmationPanelProps> = ({
  currentRecord,
  onRecordApproved,
  accessToken,
  activeSheetId,
  activeSheetUrl,
  setActiveSheetId,
  onOpenLiveSheetModal
}) => {
  const [operatorConfirmed, setOperatorConfirmed] = useState(false);
  const [operatorNotes, setOperatorNotes] = useState(currentRecord.notes || '');
  const [reviewerName, setReviewerName] = useState(currentRecord.inspectorName || 'Kỹ sư trực ca');

  // Async action statuses
  const [isSavingSheet, setIsSavingSheet] = useState(false);
  const [isSavingDrive, setIsSavingDrive] = useState(false);
  const [isCreatingForm, setIsCreatingForm] = useState(false);

  // Email modal
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailTo, setEmailTo] = useState('vanhanhdienQT@gmail.com');
  const [emailSubject, setEmailSubject] = useState(
    `[BÁO CÁO CA TRỰC] ${currentRecord.chillerId} - ${currentRecord.operatingDate} (${currentRecord.scheduledTime})`
  );
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  useEffect(() => {
    const isHandover = currentRecord.scheduledTime === '19:15' || currentRecord.scheduledTime === '07:15';
    const tag = isHandover ? '[BIÊN BẢN GIAO CA TRỰC]' : '[BÁO CÁO THÔNG SỐ BMS]';
    setEmailSubject(
      `${tag} ${currentRecord.chillerId} - ${currentRecord.operatingDate} (${currentRecord.scheduledTime} - ${currentRecord.shift === 'DAY' ? 'Ca ngày: 07h30-19h30' : 'Ca đêm: 19h30-07h30'})`
    );
  }, [currentRecord.chillerId, currentRecord.operatingDate, currentRecord.scheduledTime, currentRecord.shift]);

  // Success message states
  const [sheetSyncSuccess, setSheetSyncSuccess] = useState<string | null>(null);
  const [driveSyncSuccess, setDriveSyncSuccess] = useState<string | null>(null);
  const [emailSendSuccess, setEmailSendSuccess] = useState<string | null>(null);
  const [formCreatedUrl, setFormCreatedUrl] = useState<string | null>(null);

  const stats = calculateRecordStats(currentRecord.readings);

  const currentSheetUrl =
    activeSheetUrl ||
    (activeSheetId
      ? `https://docs.google.com/spreadsheets/d/${activeSheetId}/edit`
      : 'https://docs.google.com/spreadsheets/d/1-B01-QT04-SGN-KTG-DQT-HVAC-MASTER/edit');

  const isPlaceholderUrl = (url: string) => {
    return !url || url.includes('1-B01-QT04') || url.includes('1B01-QT04');
  };

  const handleOpenSheetSafe = () => {
    if (isPlaceholderUrl(currentSheetUrl)) {
      if (onOpenLiveSheetModal) {
        onOpenLiveSheetModal();
      } else {
        alert(
          'Đang mở Bảng tính trực tuyến nội bộ. Để mở trực tiếp trên Google Drive riêng của bạn, vui lòng bấm "Tạo Sheet Mới" bên dưới để khởi tạo file trên Drive cá nhân.'
        );
      }
    } else {
      window.open(currentSheetUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // 1. Approve record and auto save to shift log
  const handleApprove = async () => {
    if (!operatorConfirmed) {
      alert('Vui lòng tích chọn cam kết xác nhận số liệu đã đối chiếu thực tế với màn hình BMS.');
      return;
    }

    const updated: HvacInspectionRecord = {
      ...currentRecord,
      inspectorName: reviewerName,
      reviewedBy: reviewerName,
      reviewedAt: new Date().toLocaleTimeString('vi-VN') + ' ' + new Date().toLocaleDateString('vi-VN'),
      notes: operatorNotes,
      overallStatus: 'APPROVED',
      syncStatus: accessToken ? 'SYNCED' : 'PENDING',
      googleSheetUrl: currentSheetUrl
    };

    onRecordApproved(updated);
    setSheetSyncSuccess(
      `✅ Đã lưu nhật ký ca trực mới thành công (${currentRecord.chillerId} - ${currentRecord.scheduledTime})! Xem đường link Google Sheet bên dưới để kiểm tra.`
    );

    // If Google Workspace token is active, save to Google Sheets directly
    if (accessToken) {
      handleSaveToGoogleSheets();
    }
  };

  // 2. Save / Sync to Google Sheets
  const handleSaveToGoogleSheets = async () => {
    let token = accessToken;
    if (!token) {
      const confirmAuth = window.confirm(
        'Bạn chưa đăng nhập Google Workspace. Bạn có muốn kết nối tài khoản Google ngay bây giờ để đồng bộ trực tiếp vào Google Sheets không?'
      );
      if (confirmAuth) {
        try {
          const authRes = await googleSignIn();
          if (authRes?.accessToken) {
            token = authRes.accessToken;
          } else {
            return;
          }
        } catch (e: any) {
          alert(`Đăng nhập Google thất bại: ${e.message}`);
          return;
        }
      } else {
        return;
      }
    }

    if (currentRecord.overallStatus !== 'APPROVED' && !operatorConfirmed) {
      alert('Chỉ dữ liệu đã được nhân viên vận hành xác nhận mới được ghi vào Google Sheets chính thức.');
      return;
    }

    setIsSavingSheet(true);
    setSheetSyncSuccess(null);

    try {
      let sheetId = activeSheetId;
      let sheetUrl = activeSheetUrl;

      // If no active sheet, create one automatically
      if (!sheetId) {
        const newSheet = await createHvacMasterSheet(token);
        sheetId = newSheet.spreadsheetId;
        sheetUrl = newSheet.spreadsheetUrl;
        setActiveSheetId(sheetId, sheetUrl);
      }

      await appendHvacRecordToSheet(token, sheetId, currentRecord);

      setSheetSyncSuccess(`Đã ghi thành công 1 hàng dữ liệu vào Google Sheet! Đường link để kiểm tra: ${sheetUrl}`);
      const updated: HvacInspectionRecord = {
        ...currentRecord,
        syncStatus: 'SYNCED',
        googleSheetUrl: sheetUrl || undefined
      };
      onRecordApproved(updated);
    } catch (err: any) {
      alert(`Lỗi khi lưu Google Sheets: ${err.message || 'Không thể ghi dữ liệu'}`);
    } finally {
      setIsSavingSheet(false);
    }
  };

  // 3. Save to Google Drive
  const handleSaveToGoogleDrive = async () => {
    if (!accessToken) {
      alert('Vui lòng nhấp "Kết nối Google Workspace" ở thanh điều hướng để cấp quyền truy cập Google Drive.');
      return;
    }

    setIsSavingDrive(true);
    setDriveSyncSuccess(null);

    try {
      const fileName = `HVAC_Report_${currentRecord.chillerId.replace(/\s+/g, '_')}_${currentRecord.operatingDate}_${currentRecord.scheduledTime.replace(':', 'h')}.md`;
      const reportMd = generateMarkdownReport(currentRecord);

      const res = await saveReportFileToDrive(accessToken, fileName, reportMd, 'text/markdown');
      setDriveSyncSuccess(res.webViewLink || 'Đã lưu tệp báo cáo vào Google Drive thành công!');
    } catch (err: any) {
      alert(`Lỗi lưu tệp lên Google Drive: ${err.message || 'Lỗi mạng'}`);
    } finally {
      setIsSavingDrive(false);
    }
  };

  // 4. Send Gmail handover
  const handleExecuteSendEmail = async () => {
    if (!accessToken) {
      alert('Vui lòng kết nối Google Workspace để gửi email qua Gmail.');
      return;
    }

    setIsSendingEmail(true);
    setEmailSendSuccess(null);

    try {
      const reportMd = generateMarkdownReport(currentRecord);
      await sendShiftReportEmail(accessToken, {
        to: emailTo,
        subject: emailSubject,
        reportMarkdown: reportMd,
        record: currentRecord
      });

      setEmailSendSuccess(`Đã gửi email báo cáo giao ca thành công tới ${emailTo}`);
      setIsEmailModalOpen(false);
    } catch (err: any) {
      alert(`Lỗi khi gửi email qua Gmail: ${err.message || 'Lỗi gửi mail'}`);
    } finally {
      setIsSendingEmail(false);
    }
  };

  // 5. Create Google Form
  const handleCreateGoogleForm = async () => {
    if (!accessToken) {
      alert('Vui lòng kết nối Google Workspace để tạo Google Form.');
      return;
    }

    setIsCreatingForm(true);
    try {
      const form = await createHvacGoogleForm(accessToken);
      setFormCreatedUrl(form.responderUri);
    } catch (err: any) {
      alert(`Lỗi tạo Google Form: ${err.message}`);
    } finally {
      setIsCreatingForm(false);
    }
  };

  // 6. Local CSV Download
  const handleDownloadCsv = () => {
    const csvStr = generateCsvExport([currentRecord]);
    const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csvStr], {
      type: 'text/csv;charset=utf-8;'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `HVAC_${currentRecord.chillerId}_${currentRecord.operatingDate}_${currentRecord.scheduledTime}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // 7. Local Markdown Download
  const handleDownloadMarkdown = () => {
    const mdStr = generateMarkdownReport(currentRecord);
    const blob = new Blob([mdStr], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `BaoCao_HVAC_${currentRecord.chillerId}_${currentRecord.operatingDate}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-5">
      {/* Step Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-md bg-emerald-950 border border-emerald-800 text-emerald-400 flex items-center justify-center text-xs font-bold">
            4
          </span>
          <h3 className="text-sm font-bold text-slate-100">
            Xác nhận Kíp trực &amp; Lưu trữ Google Workspace
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Handover Indicator Badge */}
          {(currentRecord.scheduledTime === '19:15' || currentRecord.scheduledTime === '07:15') && (
            <span className="px-2.5 py-1 rounded-full font-bold flex items-center gap-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/50">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Biên bản giao ca (-15p)</span>
            </span>
          )}

          {/* Shift Badge */}
          <span className="px-2.5 py-1 rounded-full font-medium bg-slate-800 text-slate-300 border border-slate-700 font-mono">
            {currentRecord.shift === 'DAY' ? 'Ca ngày (07:30 - 19:30)' : 'Ca đêm (19:30 - 07:30)'}
          </span>

          <span
            className={`px-2.5 py-1 rounded-full font-bold flex items-center gap-1.5 ${
              currentRecord.overallStatus === 'APPROVED'
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                : 'bg-amber-950 text-amber-300 border border-amber-800'
            }`}
          >
            {currentRecord.overallStatus === 'APPROVED' ? (
              <>
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>Hồ sơ: ĐÃ DUYỆT CHÍNH THỨC</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>Hồ sơ: DỮ LIỆU NHÁP CHỜ DUYỆT</span>
              </>
            )}
          </span>
        </div>
      </div>

      {/* Operator Verification Card */}
      <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-4">
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="operatorVerification"
            checked={operatorConfirmed}
            onChange={(e) => setOperatorConfirmed(e.target.checked)}
            className="w-4 h-4 mt-1 rounded bg-slate-900 border-slate-700 text-cyan-600 focus:ring-cyan-500 focus:ring-offset-slate-950 cursor-pointer"
          />
          <label
            htmlFor="operatorVerification"
            className="text-xs text-slate-200 cursor-pointer leading-relaxed font-medium"
          >
            <span className="font-bold text-cyan-300">Cam kết an toàn vận hành: </span>
            Tôi xác nhận đã trực tiếp kiểm tra, đối chiếu toàn bộ 30 thông số trên bảng với màn hình thực tế của hệ thống BMS ({currentRecord.chillerId} - Mốc {currentRecord.scheduledTime}). Số liệu được ghi chép trung thực, phục vụ hồ sơ pháp lý kỹ thuật của đơn vị.
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-900">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Người ký xác nhận / Chức danh kíp trực
            </label>
            <input
              type="text"
              value={reviewerName}
              onChange={(e) => setReviewerName(e.target.value)}
              placeholder="Ví dụ: Kỹ sư Nguyễn Văn A - Trưởng ca"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Ghi chú kíp trực &amp; Bàn giao ca
            </label>
            <input
              type="text"
              value={operatorNotes}
              onChange={(e) => setOperatorNotes(e.target.value)}
              placeholder="Tình trạng hoạt động, sự cố nhỏ, công việc cần theo dõi..."
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Local approval button */}
        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={handleApprove}
            disabled={!operatorConfirmed}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white font-bold text-xs tracking-wide transition flex items-center gap-2 shadow"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Phê Duyệt Số Liệu Bản Ghi</span>
          </button>
        </div>
      </div>

      {/* Permanent Active Google Sheet Link Card */}
      <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-slate-400 font-medium shrink-0">Đường link Google Sheet:</span>
          <span className="font-mono text-emerald-300 truncate">{currentSheetUrl}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(currentSheetUrl);
              alert('Đã sao chép đường link Google Sheet vào clipboard!');
            }}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-mono text-[11px]"
          >
            Sao chép link
          </button>
          <button
            type="button"
            onClick={handleOpenSheetSafe}
            className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1 shadow cursor-pointer active:scale-95"
          >
            Mở Sheet kiểm tra <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Sync Success Alerts */}
      {sheetSyncSuccess && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-800 rounded-lg text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{sheetSyncSuccess}</span>
          </div>
          <button
            type="button"
            onClick={handleOpenSheetSafe}
            className="font-bold underline flex items-center gap-1 hover:text-emerald-200 shrink-0 cursor-pointer"
          >
            Mở Sheet kiểm tra <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      )}

      {driveSyncSuccess && (
        <div className="p-3 bg-blue-950/60 border border-blue-800 rounded-lg text-blue-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-blue-400" />
            <span>Đã tạo tệp báo cáo vận hành trên Google Drive!</span>
          </div>
          {driveSyncSuccess.startsWith('http') && (
            <a
              href={driveSyncSuccess}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold underline flex items-center gap-1 hover:text-blue-200"
            >
              Xem tệp Drive <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      )}

      {emailSendSuccess && (
        <div className="p-3 bg-purple-950/60 border border-purple-800 rounded-lg text-purple-300 text-xs flex items-center gap-2">
          <Mail className="w-4 h-4 text-purple-400" />
          <span>{emailSendSuccess}</span>
        </div>
      )}

      {formCreatedUrl && (
        <div className="p-3 bg-indigo-950/60 border border-indigo-800 rounded-lg text-indigo-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-400" />
            <span>Google Form chuẩn B01.QT04 đã sẵn sàng cho nhân viên đi ca!</span>
          </div>
          <a
            href={formCreatedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold underline flex items-center gap-1 hover:text-indigo-200"
          >
            Mở Form <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}

      {/* Integration Action Buttons Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Button 1: Google Sheets */}
        <button
          type="button"
          onClick={handleSaveToGoogleSheets}
          disabled={isSavingSheet}
          className="p-3.5 rounded-xl border border-emerald-800/80 bg-emerald-950/40 hover:bg-emerald-900/40 text-left transition space-y-1.5 group active:scale-[0.99] disabled:opacity-50"
        >
          <div className="flex items-center justify-between text-emerald-400">
            <span className="font-bold text-xs flex items-center gap-1.5">
              <FileSpreadsheet className="w-4 h-4" />
              Lưu Google Sheets
            </span>
            {isSavingSheet ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-900/60 text-emerald-300">
                Tự động
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400">
            {activeSheetId
              ? 'Thêm hàng mới vào bảng tính chuẩn B01.QT04 đang kết nối'
              : 'Tự động tạo bảng tính Google Sheets mới và chèn số liệu'}
          </p>
        </button>

        {/* Button 2: Google Drive */}
        <button
          type="button"
          onClick={handleSaveToGoogleDrive}
          disabled={isSavingDrive}
          className="p-3.5 rounded-xl border border-blue-800/80 bg-blue-950/40 hover:bg-blue-900/40 text-left transition space-y-1.5 group active:scale-[0.99] disabled:opacity-50"
        >
          <div className="flex items-center justify-between text-blue-400">
            <span className="font-bold text-xs flex items-center gap-1.5">
              <HardDrive className="w-4 h-4" />
              Lưu vào Google Drive
            </span>
            {isSavingDrive ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-900/60 text-blue-300">
                .md / .csv
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400">
            Tạo tệp báo cáo ca trực định dạng Markdown chuẩn trên Google Drive của bạn
          </p>
        </button>

        {/* Button 3: Gmail */}
        <button
          type="button"
          onClick={() => setIsEmailModalOpen(true)}
          className="p-3.5 rounded-xl border border-purple-800/80 bg-purple-950/40 hover:bg-purple-900/40 text-left transition space-y-1.5 group active:scale-[0.99]"
        >
          <div className="flex items-center justify-between text-purple-400">
            <span className="font-bold text-xs flex items-center gap-1.5">
              <Mail className="w-4 h-4" />
              Gửi Email Bàn Giao (Gmail)
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-900/60 text-purple-300">
              Giao ca
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Gửi email báo cáo kỹ thuật tới ban quản lý / kỹ sư trưởng qua Gmail API
          </p>
        </button>

        {/* Button 4: Google Forms */}
        <button
          type="button"
          onClick={handleCreateGoogleForm}
          disabled={isCreatingForm}
          className="p-3.5 rounded-xl border border-indigo-800/80 bg-indigo-950/40 hover:bg-indigo-900/40 text-left transition space-y-1.5 group active:scale-[0.99] disabled:opacity-50"
        >
          <div className="flex items-center justify-between text-indigo-400">
            <span className="font-bold text-xs flex items-center gap-1.5">
              <FileText className="w-4 h-4" />
              Tạo Google Form
            </span>
            {isCreatingForm ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-900/60 text-indigo-300">
                Điện thoại
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400">
            Tạo biểu mẫu Google Forms trực tuyến phục vụ kiểm tra hiện trường
          </p>
        </button>
      </div>

      {/* Local Download & Print Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800 text-xs">
        <span className="text-slate-400">
          Xuất dữ liệu dự phòng cục bộ (Không cần internet):
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadCsv}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Tải CSV B01.QT04</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadMarkdown}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span>Tải Markdown (.md)</span>
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5 text-slate-300" />
            <span>In Phiếu Ký Giấy</span>
          </button>
        </div>
      </div>

      {/* Explicit Gmail Confirmation Modal (Workspace Guidelines requirement) */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-purple-950 text-purple-400 border border-purple-800">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">
                    Xác nhận Gửi Email Báo Cáo Ca Trực
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Ứng dụng sẽ gửi thư điện tử qua tài khoản Gmail của bạn
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEmailModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Người nhận (Email kỹ sư trưởng / bộ phận kỹ thuật)
                </label>
                <input
                  type="email"
                  value={emailTo}
                  onChange={(e) => setEmailTo(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Tiêu đề email
                </label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-1.5">
                <div className="font-semibold text-slate-300">Nội dung tóm tắt đính kèm:</div>
                <div className="text-[11px] text-slate-400 font-mono">
                  • Thiết bị: {currentRecord.chillerId} ({currentRecord.operatingDate} - {currentRecord.scheduledTime})<br />
                  • Người kiểm tra &amp; xác nhận: {reviewerName}<br />
                  • Trạng thái: {stats.normalCount} chuẩn, {stats.warningCount} cảnh báo lệch ngưỡng<br />
                  • Kèm đầy đủ bảng 30 thông số và nhận định phân tích của AI
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsEmailModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleExecuteSendEmail}
                disabled={isSendingEmail || !emailTo}
                className="px-5 py-2 text-xs font-bold rounded-lg bg-purple-600 hover:bg-purple-500 text-white transition flex items-center gap-2 disabled:opacity-50 shadow"
              >
                {isSendingEmail ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang gửi qua Gmail API...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Xác nhận &amp; Gửi Email Ngay</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
