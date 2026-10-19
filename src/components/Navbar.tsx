import React, { useState, useEffect } from 'react';
import {
  Activity,
  FileSpreadsheet,
  HardDrive,
  Mail,
  ShieldCheck,
  Clock,
  LogIn,
  LogOut,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { FORM_METADATA, determineShift, getHandoverInfo } from '../utils/hvac-data';
import { googleSignIn, logout } from '../services/firebase-auth';
import type { User } from 'firebase/auth';

interface NavbarProps {
  activeTab: 'scan' | 'history' | 'trends' | 'settings';
  setActiveTab: (tab: 'scan' | 'history' | 'trends' | 'settings') => void;
  user: User | null;
  accessToken: string | null;
  activeSheetUrl?: string;
  onAuthSuccess: (user: User, token: string) => void;
  onAuthLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  user,
  accessToken,
  activeSheetUrl,
  onAuthSuccess,
  onAuthLogout
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentShift, setCurrentShift] = useState<'Ca ngày' | 'Ca đêm'>('Ca ngày');
  const [handoverInfo, setHandoverInfo] = useState<{
    isHandover: boolean;
    label: string;
    description: string;
    targetShiftName: string;
  }>({
    isHandover: false,
    label: '',
    description: '',
    targetShiftName: ''
  });
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const dateStr = now.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
      setCurrentTime(`${timeStr} - ${dateStr}`);

      const timeHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const shiftType = determineShift(timeHHMM);
      setCurrentShift(shiftType === 'DAY' ? 'Ca ngày' : 'Ca đêm');

      const handover = getHandoverInfo(now);
      setHandoverInfo(handover);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    try {
      const res = await googleSignIn();
      if (res) {
        onAuthSuccess(res.user, res.accessToken);
      }
    } catch (err: any) {
      alert(`Đăng nhập Google thất bại: ${err.message || 'Lỗi kết nối'}`);
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    if (window.confirm('Bạn có chắc muốn đăng xuất tài khoản Google Workspace?')) {
      await logout();
      onAuthLogout();
    }
  };

  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-40">
      {/* Top Banner with Operational Form info */}
      <div className="bg-slate-950/80 px-4 py-1.5 border-b border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/50">
            <ShieldCheck className="w-3.5 h-3.5" />
            {FORM_METADATA.formCode} (Lần BH: {FORM_METADATA.revision})
          </span>
          <span className="hidden sm:inline text-slate-400">
            {FORM_METADATA.formTitle}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-mono text-slate-300">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>{currentTime || 'Đang đồng bộ giờ...'}</span>
          </div>

          {handoverInfo.isHandover && (
            <span
              title={handoverInfo.description}
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/50 animate-pulse shadow-sm shadow-amber-950"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{handoverInfo.label}</span>
            </span>
          )}

          <span
            className={`px-2.5 py-0.5 rounded text-[11px] font-semibold border flex items-center gap-1.5 ${
              currentShift === 'Ca ngày'
                ? 'bg-amber-950/60 text-amber-300 border-amber-800/60'
                : 'bg-indigo-950/60 text-indigo-300 border-indigo-800/60'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            {currentShift === 'Ca ngày' ? 'Ca ngày (07h30 - 19h30)' : 'Ca đêm (19h30 - 07h30)'}
          </span>
        </div>
      </div>

      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-cyan-600 to-blue-700 rounded-xl shadow-lg shadow-cyan-950/50 border border-cyan-400/30">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white tracking-tight">
                Vận Hành Hệ Thống HVAC & BMS
              </h1>
              <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                AI Vision Core
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Số hóa thông số Chiller 30 tiêu chuẩn • Phân tích AI • Tự động đồng bộ Google Drive & Sheets
            </p>
          </div>
        </div>

        {/* Google Workspace Auth & Status */}
        <div className="flex items-center gap-3">
          {accessToken && user ? (
            <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700 rounded-lg p-1.5 pr-3">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-7 h-7 rounded-full border border-slate-600"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-cyan-700 flex items-center justify-center text-xs font-bold text-white">
                  {user.email ? user.email[0].toUpperCase() : 'U'}
                </div>
              )}
              <div className="text-left hidden md:block">
                <div className="text-xs font-medium text-slate-200 truncate max-w-[140px]">
                  {user.displayName || user.email?.split('@')[0]}
                </div>
                <div className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                  <CheckCircle2 className="w-3 h-3" /> Workspace kết nối
                </div>
              </div>
              <button
                onClick={handleSignOut}
                title="Đăng xuất tài khoản Google"
                aria-label="Đăng xuất tài khoản Google"
                className="p-1.5 text-slate-400 hover:text-red-400 transition ml-1 rounded hover:bg-slate-700/50"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleSignIn}
              disabled={isSigningIn}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-white text-slate-900 hover:bg-slate-100 transition shadow border border-slate-200 active:scale-95 disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{isSigningIn ? 'Đang kết nối...' : 'Kết nối Google Workspace'}</span>
            </button>
          )}

          {activeSheetUrl && (
            <a
              href={activeSheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-300 bg-emerald-950/60 border border-emerald-800/80 rounded-lg hover:bg-emerald-900/60 transition"
              title="Mở Google Sheet chính thức"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Google Sheet</span>
            </a>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 flex space-x-1 border-t border-slate-800/60 overflow-x-auto">
        <button
          onClick={() => setActiveTab('scan')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'scan'
              ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Ghi nhận & Quét AI</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'history'
              ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Nhật ký ca trực ({FORM_METADATA.formCode})</span>
        </button>

        <button
          onClick={() => setActiveTab('trends')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'trends'
              ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          <Activity className="w-4 h-4 text-emerald-400" />
          <span>Biểu đồ & Phân tích Nhiệt</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'settings'
              ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          <HardDrive className="w-4 h-4 text-blue-400" />
          <span>Google Drive & Biểu Mẫu</span>
        </button>
      </div>
    </header>
  );
};
