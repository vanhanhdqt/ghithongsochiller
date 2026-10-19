/**
 * Main Application Component: Vận Hành Hệ Thống HVAC & BMS
 * Standard Form B01.QT04/SGN-KTG-ĐQT (Rev 02/00)
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { AiImageScanner } from './components/AiImageScanner';
import { ChecklistTable } from './components/ChecklistTable';
import { AiDiagnosticCard } from './components/AiDiagnosticCard';
import { ConfirmationPanel } from './components/ConfirmationPanel';
import { HistoryLogView } from './components/HistoryLogView';
import { AnalyticsTrendsView } from './components/AnalyticsTrendsView';
import { SettingsWorkspaceModal } from './components/SettingsWorkspaceModal';
import {
  CHILLER_PARAMETERS,
  HvacInspectionRecord,
  ReadingValue,
  validateReading,
  determineShift,
  FORM_METADATA
} from './utils/hvac-data';
import { BMS_PRESETS } from './utils/mock-presets';
import { initAuth, getCurrentUser, getAccessToken, googleSignIn } from './services/firebase-auth';
import { appendHvacRecordToSheet } from './services/workspace-services';
import { GoogleSheetInspectionBanner } from './components/GoogleSheetInspectionBanner';
import { LiveSheetPreviewModal } from './components/LiveSheetPreviewModal';
import type { User } from 'firebase/auth';

const DEFAULT_SHEET_ID = '1B01-QT04-SGN-KTG-DQT-HVAC-MASTER';
const DEFAULT_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1B01-QT04-SGN-KTG-DQT-HVAC-MASTER/edit';

export default function App() {
  const [activeTab, setActiveTab] = useState<'scan' | 'history' | 'trends' | 'settings'>('scan');

  // Google Workspace Auth & Sheet link
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [activeSheetId, setActiveSheetIdState] = useState<string | null>(() => {
    return localStorage.getItem('hvac_active_sheet_id') || DEFAULT_SHEET_ID;
  });
  const [activeSheetUrl, setActiveSheetUrlState] = useState<string | null>(() => {
    return localStorage.getItem('hvac_active_sheet_url') || DEFAULT_SHEET_URL;
  });
  const [defaultEmail, setDefaultEmail] = useState<string>('vanhanhdienQT@gmail.com');
  const [isLiveSheetModalOpen, setIsLiveSheetModalOpen] = useState(false);
  const [lastSavedRecord, setLastSavedRecord] = useState<HvacInspectionRecord | undefined>(undefined);

  // Current Operational Session
  const todayStr = new Date().toISOString().split('T')[0];
  const [operatingDate, setOperatingDate] = useState<string>(todayStr);
  const [scheduledTime, setScheduledTime] = useState<string>('07:30');
  const [shift, setShift] = useState<'DAY' | 'NIGHT'>('DAY');
  const [chillerId, setChillerId] = useState<string>('Chiller 01');
  const [inspectorName, setInspectorName] = useState<string>('Kỹ sư trực ca');
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [diagnosticAnalysis, setDiagnosticAnalysis] = useState<string>('');
  const [modelUsed, setModelUsed] = useState<string>('gemini-3.8-flash');

  // Initialize 30 empty/initial readings
  const initialReadings = (): Record<number, ReadingValue> => {
    const map: Record<number, ReadingValue> = {};
    const defaultPreset = BMS_PRESETS[0];

    CHILLER_PARAMETERS.forEach((p) => {
      const mockVal = defaultPreset.mockValues[p.id] || '';
      const check = validateReading(p.id, mockVal);
      map[p.id] = {
        pointId: p.id,
        value: mockVal,
        unit: p.unit,
        rawText: `PV: ${mockVal}`,
        reviewStatus: 'NEEDS_REVIEW',
        reasonForReview: '',
        severity: check.severity
      };
    });
    return map;
  };

  const [readings, setReadings] = useState<Record<number, ReadingValue>>(initialReadings);

  // Historical Records Seed
  const [recordsHistory, setRecordsHistory] = useState<HvacInspectionRecord[]>([
    {
      recordId: 'REC-20261017-0730-CH01',
      operatingDate: '2026-10-17',
      shift: 'DAY',
      scheduledTime: '07:30',
      chillerId: 'Chiller 01',
      inspectorName: 'Kỹ sư Nguyễn Văn A',
      capturedAt: '2026-10-17T07:35:00.000Z',
      reviewedAt: '07:42 17/10/2026',
      reviewedBy: 'Kỹ sư Nguyễn Văn A',
      overallStatus: 'APPROVED',
      syncStatus: 'SYNCED',
      readings: initialReadings(),
      notes: 'Nhận ca trực ngày lúc 07h30, hệ thống Chiller 01 và các bơm tuần hoàn hoạt động bình thường.',
      aiDiagnosticSummary: 'Chu trình làm lạnh tối ưu, độ chênh nhiệt bay hơi 0.8°C.'
    },
    {
      recordId: 'REC-20261017-1330-CH02',
      operatingDate: '2026-10-17',
      shift: 'DAY',
      scheduledTime: '13:30',
      chillerId: 'Chiller 02',
      inspectorName: 'Kỹ sư Trần Đức B',
      capturedAt: '2026-10-17T13:34:00.000Z',
      reviewedAt: '13:40 17/10/2026',
      reviewedBy: 'Kỹ sư Trần Đức B',
      overallStatus: 'APPROVED',
      syncStatus: 'SYNCED',
      readings: initialReadings(),
      notes: 'Tải làm mát cao điểm 95%, tháp giải nhiệt xả đáy theo chu kỳ.',
      aiDiagnosticSummary: 'Dòng tải %RLA đồng bộ với công suất hoạt động.'
    },
    {
      recordId: 'REC-20261017-1915-CH05',
      operatingDate: '2026-10-17',
      shift: 'DAY',
      scheduledTime: '19:15',
      chillerId: 'Chiller 05',
      inspectorName: 'Kỹ sư Hoàng Minh D',
      capturedAt: '2026-10-17T19:15:00.000Z',
      reviewedAt: '19:22 17/10/2026',
      reviewedBy: 'Kỹ sư Hoàng Minh D',
      overallStatus: 'APPROVED',
      syncStatus: 'SYNCED',
      readings: initialReadings(),
      notes: 'Biên bản chốt giao ca lúc 19:15 (trước 15 phút đổi sang ca đêm 19h30). Chiller 05 ổn định, thông số kỹ thuật chuẩn.',
      aiDiagnosticSummary: 'Chiller 05 vận hành ổn định, sẵn sàng chuyển giao cho kíp trực đêm.'
    },
    {
      recordId: 'REC-20261017-2230-CH01',
      operatingDate: '2026-10-17',
      shift: 'NIGHT',
      scheduledTime: '22:30',
      chillerId: 'Chiller 01',
      inspectorName: 'Kỹ sư Lê Văn C',
      capturedAt: '2026-10-17T22:35:00.000Z',
      reviewedAt: '22:42 17/10/2026',
      reviewedBy: 'Kỹ sư Lê Văn C',
      overallStatus: 'APPROVED',
      syncStatus: 'SYNCED',
      readings: initialReadings(),
      notes: 'Chuyển chế độ vận hành đêm Eco, tắt bớt bơm thứ cấp.',
      aiDiagnosticSummary: 'Tải giảm còn 45%, áp suất bay hơi duy trì ổn định.'
    }
  ]);

  // Current session record object
  const currentRecord: HvacInspectionRecord = {
    recordId: `REC-${operatingDate.replace(/-/g, '')}-${scheduledTime.replace(':', '')}-${chillerId.replace(/\s+/g, '')}`,
    operatingDate,
    shift,
    scheduledTime,
    chillerId,
    inspectorName,
    capturedAt: new Date().toISOString(),
    readings,
    overallStatus: 'NEEDS_REVIEW',
    syncStatus: 'PENDING',
    sourceImageBase64: currentImage || undefined,
    aiDiagnosticSummary: diagnosticAnalysis,
    googleSheetUrl: activeSheetUrl || undefined
  };

  // Init Auth on App Load
  useEffect(() => {
    initAuth(
      (u, token) => {
        setUser(u);
        setAccessToken(token);
        if (u.displayName) setInspectorName(u.displayName);
      },
      () => {
        setUser(getCurrentUser());
      }
    );
  }, []);

  // Update a single reading value
  const handleUpdateReading = (
    pointId: number,
    val: string,
    status: 'APPROVED' | 'NEEDS_REVIEW' | 'REJECTED' = 'NEEDS_REVIEW'
  ) => {
    const valCheck = validateReading(pointId, val);
    setReadings((prev) => ({
      ...prev,
      [pointId]: {
        pointId,
        value: val,
        unit: CHILLER_PARAMETERS.find((p) => p.id === pointId)?.unit || '',
        rawText: prev[pointId]?.rawText || `PV: ${val}`,
        reviewStatus: status,
        reasonForReview: valCheck.isValid ? '' : valCheck.message,
        severity: valCheck.severity
      }
    }));
  };

  // Bulk approve normal readings
  const handleApproveAllNormal = () => {
    setReadings((prev) => {
      const next = { ...prev };
      CHILLER_PARAMETERS.forEach((p) => {
        const item = next[p.id];
        if (item && item.severity === 'NORMAL' && item.value) {
          next[p.id] = { ...item, reviewStatus: 'APPROVED' };
        }
      });
      return next;
    });
  };

  // Reset readings
  const handleResetReadings = () => {
    setReadings(initialReadings());
  };

  // AI Analysis Callbacks
  const handleAnalyzeStart = () => {
    setIsAnalyzing(true);
  };

  const handleAnalyzeSuccess = (data: any) => {
    setIsAnalyzing(false);
    const updatedReadings = data.readings || readings;

    if (data.readings) {
      setReadings(data.readings);
    }
    if (data.diagnosticAnalysis) {
      setDiagnosticAnalysis(data.diagnosticAnalysis);
    }
    if (data.modelUsed) {
      setModelUsed(data.modelUsed);
    }

    // Auto-create and auto-save the shift log record immediately!
    const recId = `REC-${operatingDate.replace(/-/g, '')}-${scheduledTime.replace(':', '')}-${chillerId.replace(/\s+/g, '')}`;
    const newRecord: HvacInspectionRecord = {
      recordId: recId,
      operatingDate,
      shift,
      scheduledTime,
      chillerId,
      inspectorName,
      capturedAt: new Date().toISOString(),
      reviewedAt: new Date().toLocaleTimeString('vi-VN') + ' ' + new Date().toLocaleDateString('vi-VN'),
      reviewedBy: inspectorName,
      overallStatus: 'APPROVED',
      syncStatus: accessToken ? 'SYNCED' : 'PENDING',
      readings: updatedReadings,
      notes: `Đã đối chiếu và trích xuất từ ảnh chụp BMS ${chillerId} (${scheduledTime})`,
      aiDiagnosticSummary: data.diagnosticAnalysis || diagnosticAnalysis,
      googleSheetUrl: activeSheetUrl || DEFAULT_SHEET_URL
    };

    // Prepend or update in records history
    setRecordsHistory((prev) => {
      const idx = prev.findIndex((r) => r.recordId === recId);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = newRecord;
        return copy;
      }
      return [newRecord, ...prev];
    });

    setLastSavedRecord(newRecord);

    // If Google Workspace accessToken is present, append row directly to active Google Sheet
    if (accessToken && activeSheetId) {
      appendHvacRecordToSheet(accessToken, activeSheetId, newRecord).catch((err) => {
        console.warn('Lỗi ghi nền Google Sheet:', err);
      });
    }
  };

  const handleAnalyzeError = (errMsg: string) => {
    setIsAnalyzing(false);
    alert(`Không thể phân tích hình ảnh: ${errMsg}`);
  };

  // Record Approved Callback
  const handleRecordApproved = (updatedRecord: HvacInspectionRecord) => {
    setRecordsHistory((prev) => {
      const existingIdx = prev.findIndex((r) => r.recordId === updatedRecord.recordId);
      if (existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx] = updatedRecord;
        return copy;
      }
      return [updatedRecord, ...prev];
    });
    setLastSavedRecord(updatedRecord);
  };

  // Set active sheet info with persistent localStorage
  const handleSetActiveSheet = (id: string, url: string) => {
    setActiveSheetIdState(id);
    setActiveSheetUrlState(url);
    try {
      localStorage.setItem('hvac_active_sheet_id', id);
      localStorage.setItem('hvac_active_sheet_url', url);
    } catch (e) {
      console.warn('Không thể lưu localStorage:', e);
    }
  };

  // Load a record from history into active editor
  const handleSelectHistoryRecord = (rec: HvacInspectionRecord) => {
    setOperatingDate(rec.operatingDate);
    setShift(rec.shift);
    setScheduledTime(rec.scheduledTime);
    setChillerId(rec.chillerId);
    setInspectorName(rec.inspectorName);
    setReadings(rec.readings);
    if (rec.aiDiagnosticSummary) setDiagnosticAnalysis(rec.aiDiagnosticSummary);
    if (rec.sourceImageBase64) setCurrentImage(rec.sourceImageBase64);
    setActiveTab('scan');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        accessToken={accessToken}
        activeSheetUrl={activeSheetUrl || undefined}
        onAuthSuccess={(u, token) => {
          setUser(u);
          setAccessToken(token);
          if (u.displayName) setInspectorName(u.displayName);
        }}
        onAuthLogout={() => {
          setUser(null);
          setAccessToken(null);
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {activeTab === 'scan' && (
          <div className="space-y-6">
            {/* Step 1 & 2: Shift Setup & Image Telemetry */}
            <AiImageScanner
              operatingDate={operatingDate}
              setOperatingDate={setOperatingDate}
              shift={shift}
              setShift={setShift}
              scheduledTime={scheduledTime}
              setScheduledTime={setScheduledTime}
              chillerId={chillerId}
              setChillerId={setChillerId}
              inspectorName={inspectorName}
              setInspectorName={setInspectorName}
              currentImage={currentImage}
              setCurrentImage={setCurrentImage}
              onAnalyzeStart={handleAnalyzeStart}
              onAnalyzeSuccess={handleAnalyzeSuccess}
              onAnalyzeError={handleAnalyzeError}
              isAnalyzing={isAnalyzing}
            />

            {/* Google Sheet Live Inspection Banner - Prominent Link */}
            <GoogleSheetInspectionBanner
              sheetUrl={activeSheetUrl || DEFAULT_SHEET_URL}
              sheetId={activeSheetId}
              lastRecord={lastSavedRecord || recordsHistory[0]}
              accessToken={accessToken}
              onOpenPreview={() => setIsLiveSheetModalOpen(true)}
              onUpdateSheetUrl={handleSetActiveSheet}
              onConnectGoogle={async () => {
                try {
                  const res = await googleSignIn();
                  if (res) {
                    setUser(res.user);
                    setAccessToken(res.accessToken);
                    if (res.user.displayName) setInspectorName(res.user.displayName);
                  }
                } catch (err: any) {
                  alert(`Đăng nhập Google thất bại: ${err.message || 'Lỗi kết nối'}`);
                }
              }}
            />

            {/* Step 3: Interactive 30 Parameter Checklist */}
            <ChecklistTable
              readings={readings}
              onUpdateReading={handleUpdateReading}
              onApproveAllNormal={handleApproveAllNormal}
              onResetReadings={handleResetReadings}
            />

            {/* AI Diagnostics & Thermodynamic Reasoning */}
            <AiDiagnosticCard
              readings={readings}
              diagnosticAnalysis={diagnosticAnalysis}
              modelUsed={modelUsed}
              isAnalyzing={isAnalyzing}
            />

            {/* Step 4 & 5: Operator Verification & Google Workspace Sync */}
            <ConfirmationPanel
              currentRecord={currentRecord}
              onRecordApproved={handleRecordApproved}
              accessToken={accessToken}
              activeSheetId={activeSheetId}
              activeSheetUrl={activeSheetUrl}
              setActiveSheetId={handleSetActiveSheet}
              onOpenLiveSheetModal={() => setIsLiveSheetModalOpen(true)}
            />
          </div>
        )}

        {activeTab === 'history' && (
          <HistoryLogView
            records={recordsHistory}
            onSelectRecord={handleSelectHistoryRecord}
          />
        )}

        {activeTab === 'trends' && (
          <AnalyticsTrendsView records={recordsHistory} />
        )}

        {activeTab === 'settings' && (
          <SettingsWorkspaceModal
            accessToken={accessToken}
            activeSheetId={activeSheetId}
            activeSheetUrl={activeSheetUrl}
            setActiveSheetId={handleSetActiveSheet}
            defaultEmail={defaultEmail}
            setDefaultEmail={setDefaultEmail}
          />
        )}
      </main>

      {/* Live Google Sheet Preview Modal */}
      <LiveSheetPreviewModal
        isOpen={isLiveSheetModalOpen}
        onClose={() => setIsLiveSheetModalOpen(false)}
        records={recordsHistory}
        sheetUrl={activeSheetUrl || DEFAULT_SHEET_URL}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            Hệ thống Quản lý Vận hành HVAC &amp; BMS • Biểu mẫu {FORM_METADATA.formCode} (Rev {FORM_METADATA.revision})
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Google Drive &amp; Sheets Synced</span>
            <span>•</span>
            <span>Gemini Vision Core</span>
            <span>•</span>
            <span className="text-emerald-400">Trực ca an toàn</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
