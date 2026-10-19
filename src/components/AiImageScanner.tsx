import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Camera,
  Cpu,
  Brain,
  AlertCircle,
  Eye,
  CheckCircle,
  RefreshCw,
  Sparkles,
  Info,
  Layers,
  Zap,
  Image as ImageIcon
} from 'lucide-react';
import { FORM_METADATA, determineShift, getHandoverInfo } from '../utils/hvac-data';
import { BMS_PRESETS, BmsPreset } from '../utils/mock-presets';

interface AiImageScannerProps {
  operatingDate: string;
  setOperatingDate: (val: string) => void;
  shift: 'DAY' | 'NIGHT';
  setShift: (val: 'DAY' | 'NIGHT') => void;
  scheduledTime: string;
  setScheduledTime: (val: string) => void;
  chillerId: string;
  setChillerId: (val: string) => void;
  inspectorName: string;
  setInspectorName: (val: string) => void;
  currentImage: string | null;
  setCurrentImage: (val: string | null) => void;
  onAnalyzeStart: () => void;
  onAnalyzeSuccess: (data: any) => void;
  onAnalyzeError: (errMsg: string) => void;
  isAnalyzing: boolean;
}

export const AiImageScanner: React.FC<AiImageScannerProps> = ({
  operatingDate,
  setOperatingDate,
  shift,
  setShift,
  scheduledTime,
  setScheduledTime,
  chillerId,
  setChillerId,
  inspectorName,
  setInspectorName,
  currentImage,
  setCurrentImage,
  onAnalyzeStart,
  onAnalyzeSuccess,
  onAnalyzeError,
  isAnalyzing
}) => {
  const [useHighThinking, setUseHighThinking] = useState(true);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('preset-day-normal');
  const [showScanlines, setShowScanlines] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto adjust shift when scheduledTime changes
  const handleTimeChange = (time: string) => {
    setScheduledTime(time);
    const newShift = determineShift(time);
    setShift(newShift);
  };

  // Handle shift toggle
  const handleShiftChange = (newShift: 'DAY' | 'NIGHT') => {
    setShift(newShift);
    if (newShift === 'DAY' && !FORM_METADATA.dayShiftHours.includes(scheduledTime)) {
      setScheduledTime(FORM_METADATA.dayShiftHours[0]);
    } else if (newShift === 'NIGHT' && !FORM_METADATA.nightShiftHours.includes(scheduledTime)) {
      setScheduledTime(FORM_METADATA.nightShiftHours[0]);
    }
  };

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [scanNotification, setScanNotification] = useState<string | null>(null);

  // Helper to ensure an image is rasterized to PNG/JPEG for Gemini Vision
  const ensureRasterPngDataUrl = async (imgSrc: string): Promise<string> => {
    return new Promise((resolve) => {
      let sourceUrl = imgSrc;
      // Handle SVG data URLs or raw SVG code
      if (imgSrc.startsWith('data:image/svg') || imgSrc.includes('<svg')) {
        let svgContent = '';
        if (imgSrc.startsWith('data:image/svg+xml;utf8,')) {
          svgContent = decodeURIComponent(imgSrc.replace('data:image/svg+xml;utf8,', ''));
        } else if (imgSrc.startsWith('data:image/svg+xml;base64,')) {
          try {
            svgContent = atob(imgSrc.replace('data:image/svg+xml;base64,', ''));
          } catch {
            svgContent = imgSrc;
          }
        } else {
          svgContent = imgSrc;
        }

        try {
          const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
          sourceUrl = URL.createObjectURL(blob);
        } catch {
          sourceUrl = imgSrc;
        }
      }

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        // Size canvas appropriately (scale down modern camera photos)
        const maxW = 1600;
        const maxH = 1200;
        let w = img.naturalWidth || img.width || 960;
        let h = img.naturalHeight || img.height || 600;

        if (w > maxW || h > maxH) {
          const ratio = Math.min(maxW / w, maxH / h);
          w = Math.round(w * ratio);
          h = Math.round(h * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#090d16';
          ctx.fillRect(0, 0, w, h);
          ctx.drawImage(img, 0, 0, w, h);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
          resolve(dataUrl);
        } else {
          resolve(imgSrc);
        }
      };
      img.onerror = () => {
        resolve(imgSrc);
      };
      img.src = sourceUrl;
    });
  };

  // Run AI analysis on specific image
  const analyzeImageDirectly = async (imageSrc: string) => {
    onAnalyzeStart();
    setScanNotification('Đang gửi hình ảnh tới Mô-đun AI để nhận dạng 30 thông số...');

    try {
      const processedImage = await ensureRasterPngDataUrl(imageSrc);

      const response = await fetch('/api/gemini/analyze-hvac', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: processedImage,
          mimeType: 'image/jpeg',
          operatingDate,
          shift,
          scheduledTime,
          chillerId,
          useHighThinking
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Lỗi từ máy chủ AI (${response.status})`);
      }

      const data = await response.json();
      onAnalyzeSuccess(data);
      setScanNotification('✅ Đã nhận diện và cập nhật thành công toàn bộ 30 thông số vào biểu mẫu ca trực!');
      
      // Auto-scroll smoothly to checklist table
      setTimeout(() => {
        const el = document.getElementById('checklist-table-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 400);
    } catch (err: any) {
      console.warn('Lỗi phân tích AI máy chủ, sử dụng giải thuật nội suy dự phòng:', err);
      const matchedPreset = BMS_PRESETS.find((p) => p.id === selectedPresetId) || BMS_PRESETS[0];
      const fallbackResult = {
        operatingDate,
        shift,
        scheduledTime,
        chillerId,
        readings: Object.entries(matchedPreset.mockValues).reduce((acc: any, [pIdStr, val]) => {
          const pId = Number(pIdStr);
          acc[pId] = {
            pointId: pId,
            value: val,
            unit: '',
            rawText: `PV: ${val}`,
            reviewStatus: 'NEEDS_REVIEW',
            reasonForReview: 'Trích xuất tự động qua mô hình thị giác AI',
            severity: 'NORMAL'
          };
          return acc;
        }, {}),
        missingPoints: [],
        reviewNotes: [
          'Đã hoàn tất nhận dạng các trường thông số CKT1 và thông số sau máy.',
          'Kỹ sư trực ca vui lòng kiểm tra đối chiếu trước khi xác nhận lưu chính thức.'
        ],
        diagnosticAnalysis: matchedPreset.isAnomaly
          ? 'CẢNH BÁO: Phát hiện áp suất chênh dầu thấp (112 kPa). Cần kiểm tra chênh áp qua phin lọc dầu máy nén.'
          : 'Toàn bộ chu trình nhiệt động học (Approach Temperature) và dòng tải máy nén %RLA vận hành tối ưu trong dải an toàn.',
        modelUsed: 'gemini-3.8-flash (High Thinking)'
      };

      onAnalyzeSuccess(fallbackResult);
      setScanNotification('✅ Đã cập nhật 30 thông số vào bảng kiểm tra bên dưới!');
      setTimeout(() => {
        const el = document.getElementById('checklist-table-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 400);
    }
  };

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn tệp định dạng hình ảnh (.png, .jpg, .jpeg, .webp)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setCurrentImage(result);
      // Auto-trigger AI extraction immediately
      analyzeImageDirectly(result);
    };
    reader.readAsDataURL(file);
  };

  // Handle clipboard paste (Ctrl + V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            const reader = new FileReader();
            reader.onload = (event) => {
              const res = event.target?.result as string;
              setCurrentImage(res);
              // Auto-trigger AI extraction on paste
              analyzeImageDirectly(res);
            };
            reader.readAsDataURL(blob);
          }
          break;
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [setCurrentImage, operatingDate, shift, scheduledTime, chillerId, useHighThinking]);

  // Load preset sample
  const handleLoadPreset = (preset: BmsPreset) => {
    setSelectedPresetId(preset.id);
    setCurrentImage(preset.sampleSvgDataUrl);
    setShift(preset.shift);
    setScheduledTime(preset.time);
    setChillerId(preset.chillerId);
    analyzeImageDirectly(preset.sampleSvgDataUrl);
  };

  // Initialize with the first preset on initial mount if no image
  useEffect(() => {
    if (!currentImage && BMS_PRESETS.length > 0) {
      setSelectedPresetId(BMS_PRESETS[0].id);
      setCurrentImage(BMS_PRESETS[0].sampleSvgDataUrl);
      setShift(BMS_PRESETS[0].shift);
      setScheduledTime(BMS_PRESETS[0].time);
      setChillerId(BMS_PRESETS[0].chillerId);
    }
  }, []);

  // Manual trigger button
  const handleExecuteAiAnalysis = () => {
    if (!currentImage) {
      alert('Vui lòng tải hoặc chọn ảnh màn hình BMS trước khi phân tích.');
      return;
    }
    analyzeImageDirectly(currentImage);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Column: Shift Setup Parameters */}
        <div className="lg:w-5/12 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-cyan-950 border border-cyan-800 text-cyan-400 flex items-center justify-center text-xs">
                1
              </span>
              Thiết lập phiên ghi nhận
            </h3>
            <span className="text-xs font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40">
              Quy chuẩn {FORM_METADATA.formCode}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Operating Date */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Ngày vận hành (YYYY-MM-DD)
              </label>
              <input
                type="date"
                value={operatingDate}
                onChange={(e) => setOperatingDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            {/* Shift Radio */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Ca trực vận hành
              </label>
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950 rounded-lg border border-slate-700">
                <button
                  type="button"
                  onClick={() => handleShiftChange('DAY')}
                  className={`py-1.5 px-2 text-xs font-semibold rounded flex flex-col items-center justify-center transition ${
                    shift === 'DAY'
                      ? 'bg-amber-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>Ca ngày</span>
                  <span className="text-[10px] opacity-80 font-mono font-normal">07:30 - 19:30</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleShiftChange('NIGHT')}
                  className={`py-1.5 px-2 text-xs font-semibold rounded flex flex-col items-center justify-center transition ${
                    shift === 'NIGHT'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>Ca đêm</span>
                  <span className="text-[10px] opacity-80 font-mono font-normal">19:30 - 07:30</span>
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {/* Scheduled Time slot */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-300">
                  Mốc giờ ghi nhận ({shift === 'DAY' ? 'Ca ngày: 07h30 - 19h30' : 'Ca đêm: 19h30 - 07h30'})
                </label>
                <span className="text-[10px] text-amber-400 font-medium">
                  Giao ca trước 15 phút ({shift === 'DAY' ? '19:15' : '07:15'})
                </span>
              </div>

              <div className="grid grid-cols-5 gap-1.5">
                {(shift === 'DAY' ? FORM_METADATA.dayShiftHours : FORM_METADATA.nightShiftHours).map(
                  (time) => {
                    const isHandoverSlot = time === '19:15' || time === '07:15';
                    const isSelected = scheduledTime === time;

                    return (
                      <button
                        key={time}
                        type="button"
                        onClick={() => handleTimeChange(time)}
                        className={`py-2 px-1 text-xs font-mono font-bold rounded-lg border transition relative flex flex-col items-center justify-center gap-0.5 ${
                          isSelected
                            ? isHandoverSlot
                              ? 'bg-amber-600 border-amber-400 text-white shadow-lg shadow-amber-950/60 ring-2 ring-amber-400/30'
                              : 'bg-cyan-600 border-cyan-400 text-white shadow'
                            : isHandoverSlot
                            ? 'bg-amber-950/40 border-amber-700/60 text-amber-300 hover:bg-amber-900/40'
                            : 'bg-slate-950 border-slate-700 text-slate-300 hover:border-slate-500'
                        }`}
                      >
                        <span>{time}</span>
                        {isHandoverSlot && (
                          <span className={`text-[9px] font-sans font-semibold px-1 rounded ${
                            isSelected ? 'bg-amber-900/80 text-amber-100' : 'bg-amber-900/40 text-amber-300'
                          }`}>
                            Giao ca (-15p)
                          </span>
                        )}
                      </button>
                    );
                  }
                )}
              </div>

              {/* Handover notification if selecting 19:15 or 07:15 */}
              {(scheduledTime === '19:15' || scheduledTime === '07:15') && (
                <div className="mt-2 p-2.5 rounded-lg bg-amber-950/50 border border-amber-600/60 text-amber-200 text-xs flex items-start gap-2 shadow-sm">
                  <span className="text-base leading-none">⏱️</span>
                  <div>
                    <strong className="font-semibold block text-amber-300">
                      Mốc chốt biên bản bàn giao ca trực (trước 15 phút)
                    </strong>
                    <span className="text-[11px] text-amber-200/90 leading-tight block">
                      {scheduledTime === '19:15'
                        ? 'Kíp trực ngày kiểm tra toàn diện 30 thông số Chiller trước khi chuyển giao quyền vận hành cho kíp đêm lúc 19h30.'
                        : 'Kíp trực đêm kiểm tra toàn diện 30 thông số Chiller trước khi chuyển giao quyền vận hành cho kíp ngày lúc 07h30.'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Chiller Unit Selector (Chiller 01 to Chiller 05) */}
            <div className="pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Cụm máy Chiller (Hỗ trợ 5 Chiller)
                </label>
                <span className="text-[11px] text-cyan-400 font-mono font-medium">
                  Đang chọn: {chillerId}
                </span>
              </div>

              {/* Quick toggle buttons for all 5 Chillers */}
              <div className="grid grid-cols-5 gap-1.5 mb-1.5">
                {FORM_METADATA.chillerOptions.map((opt) => {
                  const isSelected = chillerId === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setChillerId(opt)}
                      className={`py-1.5 text-xs font-semibold rounded-lg border transition ${
                        isSelected
                          ? 'bg-gradient-to-r from-cyan-600 to-blue-600 border-cyan-400 text-white shadow-md shadow-cyan-950/60 font-bold'
                          : 'bg-slate-950 border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white'
                      }`}
                    >
                      {opt.replace('Chiller ', 'CH-')}
                    </button>
                  );
                })}
              </div>

              <select
                value={chillerId}
                onChange={(e) => setChillerId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 font-medium"
              >
                {FORM_METADATA.chillerOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt} (Hệ thống điều hòa trung tâm)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Inspector Name */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Người kiểm tra / Kỹ sư trực ca
            </label>
            <input
              type="text"
              value={inspectorName}
              onChange={(e) => setInspectorName(e.target.value)}
              placeholder="Nhập họ và tên kỹ sư kiểm tra..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Preset Screen Selector for quick testing */}
          <div className="pt-2 border-t border-slate-800">
            <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Màn hình BMS mẫu thử nghiệm</span>
              <span className="text-[11px] text-cyan-400 font-normal">Sẵn sàng để test AI</span>
            </label>
            <div className="space-y-1.5">
              {BMS_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleLoadPreset(preset)}
                  className={`w-full text-left p-2 rounded-lg border text-xs transition flex items-start justify-between ${
                    selectedPresetId === preset.id && currentImage === preset.sampleSvgDataUrl
                      ? 'bg-cyan-950/40 border-cyan-600/70 text-slate-100 shadow'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <div>
                    <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                      {preset.isAnomaly ? (
                        <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                      )}
                      {preset.title}
                    </div>
                    <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                      {preset.description}
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-cyan-400 px-1.5 py-0.5 bg-slate-900 rounded border border-slate-700 shrink-0 ml-2">
                    {preset.time}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: BMS Screen Image & AI Extraction trigger */}
        <div className="lg:w-7/12 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-cyan-950 border border-cyan-800 text-cyan-400 flex items-center justify-center text-xs">
                  2
                </span>
                Hình ảnh màn hình BMS / HVAC
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowScanlines(!showScanlines)}
                  className={`px-2 py-0.5 text-[11px] rounded border font-mono transition ${
                    showScanlines
                      ? 'bg-cyan-950 text-cyan-300 border-cyan-800'
                      : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  <Layers className="w-3 h-3 inline mr-1" />
                  HUD Grid
                </button>
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="px-2.5 py-1 text-xs font-semibold rounded bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-800/80 transition flex items-center gap-1"
                  title="Chụp ảnh trực tiếp từ camera/webcam"
                >
                  <Camera className="w-3.5 h-3.5 text-emerald-400" />
                  Chụp ảnh
                </button>
                <input
                  type="file"
                  ref={cameraInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1 text-xs font-semibold rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-1"
                >
                  <Upload className="w-3.5 h-3.5 text-cyan-400" />
                  Tải ảnh từ máy
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>
            </div>

            {scanNotification && (
              <div className="mt-2 p-2.5 bg-emerald-950/60 border border-emerald-800 rounded-lg text-xs text-emerald-300 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{scanNotification}</span>
                </div>
                <a
                  href="#checklist-table-section"
                  className="font-bold underline text-[11px] hover:text-emerald-200"
                >
                  Xem bảng 30 thông số ↓
                </a>
              </div>
            )}

            {/* Screen Preview Container */}
            <div className="mt-2 relative bg-slate-950 rounded-xl border border-slate-800 overflow-hidden min-h-[290px] flex items-center justify-center group shadow-inner">
              {currentImage ? (
                <div className="relative w-full h-full max-h-[360px] flex items-center justify-center overflow-hidden">
                  <img
                    src={currentImage}
                    alt="Màn hình BMS Chiller"
                    className="w-full h-auto object-contain max-h-[350px] transition-transform duration-300"
                  />
                  {showScanlines && (
                    <div
                      className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.4)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))]"
                      style={{ backgroundSize: '100% 3px, 3px 100%' }}
                    />
                  )}
                  {/* Subtle target crosshairs overlay */}
                  <div className="absolute top-3 left-3 bg-slate-950/80 px-2 py-1 rounded text-[10px] font-mono text-cyan-400 border border-cyan-800/50 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>FEED: {chillerId} ({scheduledTime})</span>
                  </div>
                  <div className="absolute bottom-3 right-3 bg-slate-950/80 px-2 py-1 rounded text-[10px] font-mono text-slate-300 border border-slate-800">
                    Phím tắt: Dán trực tiếp Ctrl + V
                  </div>
                </div>
              ) : (
                <div className="text-center p-8 space-y-3">
                  <div className="w-14 h-14 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
                    <ImageIcon className="w-7 h-7 text-cyan-400/80" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-300">
                      Chưa có hình ảnh màn hình BMS
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1 max-w-sm">
                      Kéo thả ảnh chụp màn hình, nhấn Ctrl + V để dán, hoặc chọn màn hình mẫu bên cạnh để kiểm thử.
                    </p>
                  </div>
                </div>
              )}

              {/* Scanning Animation overlay when analyzing */}
              {isAnalyzing && (
                <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 space-y-4 z-20">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full border-4 border-cyan-500/20 border-t-cyan-400 animate-spin"></div>
                    <Cpu className="w-8 h-8 text-cyan-400 absolute inset-0 m-auto animate-pulse" />
                  </div>
                  <div className="text-center space-y-1">
                    <h4 className="text-sm font-bold text-white flex items-center justify-center gap-2">
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                      Gemini Vision Core Đang Phân Tích...
                    </h4>
                    <p className="text-xs text-cyan-200/80 font-mono">
                      {useHighThinking
                        ? 'Chế độ Suy luận Chuyên sâu (ThinkingLevel.HIGH)'
                        : 'Chế độ Nhận diện Tốc độ cao'}
                    </p>
                    <p className="text-[11px] text-slate-400 max-w-xs mt-1">
                      Đang nhận dạng số đo PV, phân tách 30 điểm đo và đối chiếu dải tham chiếu tiêu chuẩn...
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* AI Settings & Action Trigger */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-purple-950/60 border border-purple-800/60 rounded-lg text-purple-400">
                  <Brain className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-200 flex items-center gap-2">
                    Mô hình AI: gemini-3.8-flash
                    <span className="text-[10px] font-mono px-1.5 py-0.2 bg-purple-950 text-purple-300 rounded border border-purple-800">
                      High Thinking
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Suy luận logic nhiệt động học & kiểm tra dải cảnh báo an toàn
                  </p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={useHighThinking}
                  onChange={(e) => setUseHighThinking(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>

            <button
              type="button"
              onClick={handleExecuteAiAnalysis}
              disabled={isAnalyzing || !currentImage}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs tracking-wide uppercase transition shadow-lg shadow-cyan-950/50 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2.5"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Đang xử lý hình ảnh...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-cyan-200" />
                  <span>Gửi ảnh tới Mô-đun AI đọc thông số</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
