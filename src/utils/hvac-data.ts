/**
 * Standard Checklist Definition and Validation Rules
 * Conforms to Form B01.QT04/SGN-KTG-ĐQT (Rev 02/00)
 * "PHIẾU KIỂM TRA HỆ THỐNG CHILLER"
 */

export type ParameterType = 'toggle' | 'radio' | 'number' | 'text';

export type ReviewStatus = 'APPROVED' | 'NEEDS_REVIEW' | 'REJECTED';
export type SyncStatus = 'PENDING' | 'SYNCED' | 'ERROR';
export type SeverityLevel = 'NORMAL' | 'WARNING' | 'CRITICAL' | 'EMPTY';

export interface ParameterDef {
  id: number;
  code: string;
  name: string; // English title
  nameVi: string; // Vietnamese title
  unit: string;
  type: ParameterType;
  min: number | null;
  max: number | null;
  options: string[] | null;
  referenceText: string;
  descriptionVi: string;
}

export interface ReadingValue {
  pointId: number;
  value: string;
  unit: string;
  rawText?: string;
  reviewStatus: ReviewStatus;
  reasonForReview?: string;
  severity: SeverityLevel;
}

export interface HvacInspectionRecord {
  recordId: string;
  operatingDate: string; // YYYY-MM-DD
  shift: 'DAY' | 'NIGHT';
  scheduledTime: string; // '08:00', '11:00', '14:00', '18:00' | '20:00', '22:00', '00:00', '04:00'
  chillerId: string; // 'Chiller 01', 'Chiller 02', etc.
  inspectorName: string;
  capturedAt: string; // ISO string
  reviewedAt?: string;
  reviewedBy?: string;
  readings: Record<number, ReadingValue>;
  overallStatus: 'APPROVED' | 'NEEDS_REVIEW' | 'DRAFT';
  syncStatus: SyncStatus;
  notes?: string;
  sourceImageBase64?: string;
  aiDiagnosticSummary?: string;
  googleSheetUrl?: string;
  googleDriveFileId?: string;
}

export const FORM_METADATA = {
  formCode: 'B01.QT04/SGN-KTG-ĐQT',
  formTitle: 'PHIẾU KIỂM TRA HỆ THỐNG CHILLER',
  revision: '02/00',
  // Ca ngày: 07h30 - 19h30, mốc giao ca trước 15 phút (19h15)
  dayShiftHours: ['07:30', '10:30', '13:30', '16:30', '19:15'],
  // Ca đêm: 19h30 - 07h30, mốc giao ca trước 15 phút (07h15)
  nightShiftHours: ['19:30', '22:30', '01:30', '04:30', '07:15'],
  // Hỗ trợ đầy đủ 5 cụm máy Chiller
  chillerOptions: ['Chiller 01', 'Chiller 02', 'Chiller 03', 'Chiller 04', 'Chiller 05'],
  handoverMinutesBefore: 15
};

export const CHILLER_PARAMETERS: ParameterDef[] = [
  // ==========================================
  // PHẦN 1: THÔNG SỐ CHILLER CKT1 (1 - 20)
  // ==========================================
  {
    id: 1,
    code: 'CKT1',
    name: 'Chiller Run Status',
    nameVi: 'Trạng thái Chiller',
    unit: '',
    type: 'toggle',
    min: null,
    max: null,
    options: ['On', 'Off'],
    referenceText: 'On/Off',
    descriptionVi: 'Trạng thái vận hành của cụm máy Chiller'
  },
  {
    id: 2,
    code: 'CKT1',
    name: 'Alarm Locked',
    nameVi: 'Lỗi làm khoá Chiller',
    unit: '',
    type: 'radio',
    min: null,
    max: null,
    options: ['No', 'Yes'],
    referenceText: 'No',
    descriptionVi: 'Khóa an toàn do sự cố dừng khẩn cấp'
  },
  {
    id: 3,
    code: 'CKT1',
    name: 'Alarm Present',
    nameVi: 'Đang có lỗi',
    unit: '',
    type: 'radio',
    min: null,
    max: null,
    options: ['Normal (Nor)', 'Error'],
    referenceText: 'Normal (Nor)',
    descriptionVi: 'Cảnh báo lỗi hiện hành trên màn hình'
  },
  {
    id: 4,
    code: 'CKT1',
    name: 'Operating Capacity',
    nameVi: 'Công suất hoạt động',
    unit: '%',
    type: 'number',
    min: 30,
    max: 100,
    options: null,
    referenceText: '30–100 %',
    descriptionVi: 'Tỷ lệ tải vận hành máy nén'
  },
  {
    id: 5,
    code: 'CKT1',
    name: 'Evaporator Approach Temperature',
    nameVi: 'Chênh lệch nhiệt độ trong bình bay hơi',
    unit: '°C',
    type: 'number',
    min: 0.1,
    max: 2.0,
    options: null,
    referenceText: '0.1–2.0 °C',
    descriptionVi: 'Độ chênh nhiệt độ nước lạnh ra và nhiệt độ bay hơi gas'
  },
  {
    id: 6,
    code: 'CKT1',
    name: 'Evaporator Refrigerant Pressure',
    nameVi: 'Áp suất gas trong bình bay hơi',
    unit: 'kPa',
    type: 'number',
    min: -62,
    max: -41,
    options: null,
    referenceText: '-62–-41 kPa',
    descriptionVi: 'Áp suất môi chất lạnh buồng bay hơi (chân không)'
  },
  {
    id: 7,
    code: 'CKT1',
    name: 'Evaporator Refrigerant Temperature',
    nameVi: 'Nhiệt độ gas trong bình bay hơi',
    unit: '°C',
    type: 'number',
    min: 5.0,
    max: 15.0,
    options: null,
    referenceText: '5.0–15 °C',
    descriptionVi: 'Nhiệt độ bão hòa môi chất lạnh bình bay hơi'
  },
  {
    id: 8,
    code: 'CKT1',
    name: 'Condenser Approach Temperature',
    nameVi: 'Chênh lệch nhiệt độ trong bình ngưng',
    unit: '°C',
    type: 'number',
    min: 0.1,
    max: 3.0,
    options: null,
    referenceText: '0.1–3.0 °C',
    descriptionVi: 'Độ chênh nhiệt độ ngưng tụ gas và nước giải nhiệt ra'
  },
  {
    id: 9,
    code: 'CKT1',
    name: 'Condenser Refrigerant Pressure',
    nameVi: 'Áp suất gas trong bình ngưng',
    unit: 'kPa',
    type: 'number',
    min: 13.7,
    max: 82.7,
    options: null,
    referenceText: '13.7–82.7 kPa',
    descriptionVi: 'Áp suất môi chất lạnh tại bình ngưng'
  },
  {
    id: 10,
    code: 'CKT1',
    name: 'Condenser Refrigerant Temperature',
    nameVi: 'Nhiệt độ gas trong bình ngưng',
    unit: '°C',
    type: 'number',
    min: 30.0,
    max: 45.0,
    options: null,
    referenceText: '30–45 °C',
    descriptionVi: 'Nhiệt độ bão hòa môi chất lạnh bình ngưng'
  },
  {
    id: 11,
    code: 'CKT1',
    name: 'Purge Refrigeration Circuit',
    nameVi: 'Tình trạng bộ lọc khí',
    unit: '',
    type: 'toggle',
    min: null,
    max: null,
    options: ['On', 'Off'],
    referenceText: 'On/Off',
    descriptionVi: 'Trạng thái hoạt động cụm xả khí không ngưng'
  },
  {
    id: 12,
    code: 'CKT1',
    name: 'Purge Regenerating',
    nameVi: 'Hoạt động tách khí',
    unit: '',
    type: 'radio',
    min: null,
    max: null,
    options: ['Yes', 'No'],
    referenceText: 'Yes/No',
    descriptionVi: 'Chu trình hoàn nguyên/tách khí purge'
  },
  {
    id: 13,
    code: 'CKT1',
    name: 'Purge 24 Hour Pump out',
    nameVi: 'Thời gian xả khí trong 24 giờ',
    unit: 'Min',
    type: 'number',
    min: 0,
    max: 20,
    options: null,
    referenceText: '0–20 Min',
    descriptionVi: 'Tổng thời gian bơm purge hoạt động trong 24h qua'
  },
  {
    id: 14,
    code: 'CKT1',
    name: 'Compressor Status',
    nameVi: 'Trạng thái máy nén',
    unit: '',
    type: 'toggle',
    min: null,
    max: null,
    options: ['On', 'Off'],
    referenceText: 'On/Off',
    descriptionVi: 'Máy nén đang chạy hay dừng'
  },
  {
    id: 15,
    code: 'CKT1',
    name: 'Compressor Run Time',
    nameVi: 'Số giờ hoạt động',
    unit: 'Hours',
    type: 'number',
    min: null,
    max: null,
    options: null,
    referenceText: 'Giờ chạy tích lũy',
    descriptionVi: 'Tổng giờ chạy lũy kế máy nén'
  },
  {
    id: 16,
    code: 'CKT1',
    name: 'Compressor Starts',
    nameVi: 'Số lần khởi động',
    unit: '',
    type: 'number',
    min: null,
    max: null,
    options: null,
    referenceText: 'Lũy kế số lần',
    descriptionVi: 'Tổng số chu kỳ khởi động của máy nén'
  },
  {
    id: 17,
    code: 'CKT1',
    name: 'Compressor Current (%RLA)',
    nameVi: 'Dòng máy nén (%RLA)',
    unit: '%',
    type: 'number',
    min: 30,
    max: 100,
    options: null,
    referenceText: '30–100 %',
    descriptionVi: 'Tỷ lệ phần trăm dòng điện danh định đầy tải (RLA)'
  },
  {
    id: 18,
    code: 'CKT1',
    name: 'Compressor Oil Temp.',
    nameVi: 'Nhiệt độ dầu',
    unit: '°C',
    type: 'number',
    min: 26.6,
    max: 72.0,
    options: null,
    referenceText: '26.6–72 °C',
    descriptionVi: 'Nhiệt độ dầu bôi trơn máy nén'
  },
  {
    id: 19,
    code: 'CKT1',
    name: 'Differential Oil Pressure',
    nameVi: 'Chênh lệch áp suất dầu',
    unit: 'kPa',
    type: 'number',
    min: 120,
    max: 150,
    options: null,
    referenceText: '120–150 kPa',
    descriptionVi: 'Áp lực bơm dầu trừ áp suất khoang máy nén'
  },
  {
    id: 20,
    code: 'CKT1',
    name: 'Chilled Water Temp Delta',
    nameVi: 'Chênh lệch nhiệt độ nước vào/ra bình bay hơi',
    unit: '°C',
    type: 'number',
    min: 0.1,
    max: 5.5,
    options: null,
    referenceText: '0.1–5.5 °C',
    descriptionVi: 'Độ chênh nhiệt độ nước lạnh vào Chiller và ra tải'
  },

  // ==========================================
  // PHẦN 2: KIỂM TRA THÔNG SỐ SAU MÁY (21 - 30)
  // ==========================================
  {
    id: 21,
    code: 'SAU MAY',
    name: 'Oil level in sight glass',
    nameVi: 'Mức dầu trong kính dưới/kính trên',
    unit: '',
    type: 'radio',
    min: null,
    max: null,
    options: ['Đầy', 'Không'],
    referenceText: 'Đầy=1, Không=0',
    descriptionVi: 'Tỉ lệ dầu qua mắt kính quan sát bình dầu (Đầy / Không)'
  },
  {
    id: 22,
    code: 'SAU MAY',
    name: 'Oil foaming',
    nameVi: 'Dầu có bọt',
    unit: '',
    type: 'radio',
    min: null,
    max: null,
    options: ['No', 'Yes'],
    referenceText: 'No',
    descriptionVi: 'Hiện tượng sôi bọt trong dầu bôi trơn'
  },
  {
    id: 23,
    code: 'SAU MAY',
    name: 'Normal oil color',
    nameVi: 'Màu dầu bình thường',
    unit: '',
    type: 'radio',
    min: null,
    max: null,
    options: ['Yes', 'No'],
    referenceText: 'Yes',
    descriptionVi: 'Độ trong và sắc thái màu vàng trong suốt của dầu máy'
  },
  {
    id: 24,
    code: 'SAU MAY',
    name: 'Chiller operating condition',
    nameVi: 'Tình trạng hoạt động của Chiller',
    unit: '',
    type: 'radio',
    min: null,
    max: null,
    options: ['√ Bình thường', 'X Bất thường'],
    referenceText: '√ Bình thường',
    descriptionVi: 'Đánh giá cơ học tổng quan âm thanh rung động máy'
  },
  {
    id: 25,
    code: 'SAU MAY',
    name: 'Cooling water pump condition',
    nameVi: 'Tình trạng hoạt động bơm giải nhiệt',
    unit: '',
    type: 'radio',
    min: null,
    max: null,
    options: ['√ Bình thường', 'X Bất thường'],
    referenceText: '√ Bình thường',
    descriptionVi: 'Bơm nước ngưng tháp giải nhiệt (CWP)'
  },
  {
    id: 26,
    code: 'SAU MAY',
    name: 'Primary pump condition',
    nameVi: 'Tình trạng hoạt động bơm sơ cấp',
    unit: '',
    type: 'radio',
    min: null,
    max: null,
    options: ['√ Bình thường', 'X Bất thường'],
    referenceText: '√ Bình thường',
    descriptionVi: 'Bơm nước lạnh sơ cấp tuần hoàn Chiller (P-CHWP)'
  },
  {
    id: 27,
    code: 'SAU MAY',
    name: 'Secondary pump condition',
    nameVi: 'Tình trạng hoạt động bơm thứ cấp',
    unit: '',
    type: 'radio',
    min: null,
    max: null,
    options: ['√ Bình thường', 'X Bất thường'],
    referenceText: '√ Bình thường',
    descriptionVi: 'Bơm nước lạnh thứ cấp cấp cho các AHU/PAU (S-CHWP)'
  },
  {
    id: 28,
    code: 'SAU MAY',
    name: 'Expansion tank water supply pressure',
    nameVi: 'Áp lực nước cấp cho bình giãn nở',
    unit: 'kgf/cm²',
    type: 'number',
    min: 2.0,
    max: 3.0,
    options: null,
    referenceText: '2–3 kgf/cm²',
    descriptionVi: 'Áp kế đường nước cấp bù bình giãn nở kín'
  },
  {
    id: 29,
    code: 'SAU MAY',
    name: 'Expansion tank water supply flow reading',
    nameVi: 'Chỉ số lưu lượng nước cấp bình giãn nở',
    unit: 'm³',
    type: 'number',
    min: null,
    max: null,
    options: null,
    referenceText: 'Chỉ số đồng hồ (m³)',
    descriptionVi: 'Chỉ số đồng hồ đo lưu lượng nước cấp bù'
  },
  {
    id: 30,
    code: 'SAU MAY',
    name: 'Cooling tower water supply pressure',
    nameVi: 'Áp lực nước cấp cho tháp giải nhiệt',
    unit: 'kgf/cm²',
    type: 'number',
    min: 2.0,
    max: 3.0,
    options: null,
    referenceText: '2–3 kgf/cm²',
    descriptionVi: 'Áp lực cấp nước bổ sung vào bể tháp giải nhiệt'
  }
];

/**
 * Validate a specific parameter reading against reference ranges
 */
export function validateReading(
  pointId: number,
  valStr: string | null | undefined
): { isValid: boolean; severity: SeverityLevel; message?: string } {
  const def = CHILLER_PARAMETERS.find((p) => p.id === pointId);
  if (!def) {
    return { isValid: false, severity: 'CRITICAL', message: 'Mã điểm đo không tồn tại' };
  }

  if (valStr === null || valStr === undefined || valStr.trim() === '') {
    return { isValid: false, severity: 'EMPTY', message: 'Chưa có dữ liệu' };
  }

  const clean = valStr.trim();

  if (def.type === 'number') {
    const num = parseFloat(clean.replace(',', '.'));
    if (isNaN(num)) {
      return { isValid: false, severity: 'CRITICAL', message: 'Giá trị phải là số' };
    }

    if (def.min !== null && def.max !== null) {
      if (num < def.min || num > def.max) {
        // Small deviation is warning, large deviation is critical
        const span = Math.abs(def.max - def.min);
        const outBy = num < def.min ? def.min - num : num - def.max;
        const severity: SeverityLevel = outBy > span * 0.25 ? 'CRITICAL' : 'WARNING';
        return {
          isValid: false,
          severity,
          message: `Ngoài ngưỡng tham chiếu (${def.min} - ${def.max} ${def.unit})`
        };
      }
    } else if (def.min !== null && num < def.min) {
      return {
        isValid: false,
        severity: 'WARNING',
        message: `Thấp hơn ngưỡng tối thiểu (${def.min} ${def.unit})`
      };
    } else if (def.max !== null && num > def.max) {
      return {
        isValid: false,
        severity: 'WARNING',
        message: `Cao hơn ngưỡng tối đa (${def.max} ${def.unit})`
      };
    }

    return { isValid: true, severity: 'NORMAL' };
  }

  // Handle radio/toggle
  if (def.id === 2 && clean.toLowerCase() === 'yes') {
    return { isValid: false, severity: 'CRITICAL', message: 'Chiller bị khoá lỗi' };
  }
  if (def.id === 3 && (clean.toLowerCase().includes('error') || clean.toLowerCase() === 'có lỗi')) {
    return { isValid: false, severity: 'CRITICAL', message: 'Hệ thống đang có báo lỗi' };
  }
  if (def.id === 22 && clean.toLowerCase() === 'yes') {
    return { isValid: false, severity: 'WARNING', message: 'Dầu có bọt bất thường' };
  }
  if (def.id === 23 && clean.toLowerCase() === 'no') {
    return { isValid: false, severity: 'WARNING', message: 'Màu dầu biến đổi' };
  }
  if ([24, 25, 26, 27].includes(def.id) && (clean.includes('X') || clean.toLowerCase().includes('bất thường'))) {
    return { isValid: false, severity: 'WARNING', message: 'Tình trạng thiết bị bất thường' };
  }

  return { isValid: true, severity: 'NORMAL' };
}

/**
 * Determine operational shift based on scheduled hour
 * - Ca ngày: 07h30 - 19h30 (tổng phút 450 đến 1169)
 * - Ca đêm: 19h30 - 07h30 (tổng phút >= 1170 hoặc < 450)
 */
export function determineShift(scheduledTime: string): 'DAY' | 'NIGHT' {
  const parts = (scheduledTime || '').split(':');
  const hour = parseInt(parts[0], 10) || 0;
  const minute = parseInt(parts[1], 10) || 0;
  const totalMinutes = hour * 60 + minute;

  // 07:30 = 7*60 + 30 = 450 phút
  // 19:30 = 19*60 + 30 = 1170 phút
  if (totalMinutes >= 450 && totalMinutes < 1170) {
    return 'DAY';
  }
  return 'NIGHT';
}

/**
 * Check if a given time or current date is in the 15-minute handover window:
 * - 19:15 - 19:30: Giao ca Ngày ➡️ Đêm (trước 15 phút so với giờ đổi ca 19h30)
 * - 07:15 - 07:30: Giao ca Đêm ➡️ Ngày (trước 15 phút so với giờ đổi ca 07h30)
 */
export function getHandoverInfo(timeOrDate?: string | Date): {
  isHandover: boolean;
  handoverType: 'DAY_TO_NIGHT' | 'NIGHT_TO_DAY' | null;
  label: string;
  description: string;
  targetShiftName: string;
} {
  let hour: number;
  let minute: number;

  if (timeOrDate instanceof Date) {
    hour = timeOrDate.getHours();
    minute = timeOrDate.getMinutes();
  } else if (typeof timeOrDate === 'string' && timeOrDate.includes(':')) {
    const parts = timeOrDate.split(':');
    hour = parseInt(parts[0], 10) || 0;
    minute = parseInt(parts[1], 10) || 0;
  } else {
    const now = new Date();
    hour = now.getHours();
    minute = now.getMinutes();
  }

  const totalMinutes = hour * 60 + minute;

  // Window 1: 19:15 to 19:30 (1155 to 1170) -> Ca ngày giao ca cho ca đêm
  if (totalMinutes >= 1155 && totalMinutes < 1170) {
    return {
      isHandover: true,
      handoverType: 'DAY_TO_NIGHT',
      label: 'Giao ca Ngày ➡️ Đêm (19:15 - 19:30)',
      description: 'Thời gian bàn giao ca trực trước 15 phút (chuẩn bị bàn giao cho kíp trực đêm 19h30)',
      targetShiftName: 'Ca đêm'
    };
  }

  // Window 2: 07:15 to 07:30 (435 to 450) -> Ca đêm giao ca cho ca ngày
  if (totalMinutes >= 435 && totalMinutes < 450) {
    return {
      isHandover: true,
      handoverType: 'NIGHT_TO_DAY',
      label: 'Giao ca Đêm ➡️ Ngày (07:15 - 07:30)',
      description: 'Thời gian bàn giao ca trực trước 15 phút (chuẩn bị bàn giao cho kíp trực ngày 07h30)',
      targetShiftName: 'Ca ngày'
    };
  }

  return {
    isHandover: false,
    handoverType: null,
    label: '',
    description: '',
    targetShiftName: ''
  };
}

/**
 * Calculate statistics for a completed reading set
 */
export function calculateRecordStats(readings: Record<number, ReadingValue>): {
  total: number;
  filled: number;
  normalCount: number;
  warningCount: number;
  criticalCount: number;
  emptyCount: number;
  completionRate: number;
} {
  const total = CHILLER_PARAMETERS.length;
  let filled = 0;
  let normalCount = 0;
  let warningCount = 0;
  let criticalCount = 0;
  let emptyCount = 0;

  CHILLER_PARAMETERS.forEach((p) => {
    const r = readings[p.id];
    if (!r || r.value === '' || r.severity === 'EMPTY') {
      emptyCount++;
    } else {
      filled++;
      if (r.severity === 'NORMAL') normalCount++;
      else if (r.severity === 'WARNING') warningCount++;
      else if (r.severity === 'CRITICAL') criticalCount++;
    }
  });

  return {
    total,
    filled,
    normalCount,
    warningCount,
    criticalCount,
    emptyCount,
    completionRate: Math.round((filled / total) * 100)
  };
}

/**
 * Generate standard CSV export string conforming to B01.QT04/SGN-KTG-ĐQT
 */
export function generateCsvExport(records: HvacInspectionRecord[]): string {
  const headers = [
    'Ma_Ban_Ghi',
    'Ngay_Van_Hanh',
    'Ca_Truc',
    'Moc_Gio',
    'Thiet_Bi',
    'Nguoi_Kiem_Tra',
    'Trang_Thai_Xac_Nhan',
    ...CHILLER_PARAMETERS.map((p) => `P${p.id}_${p.name.replace(/[^a-zA-Z0-9]/g, '_')}`),
    'Ghi_Chu'
  ];

  const rows = records.map((rec) => {
    const colValues = [
      rec.recordId,
      rec.operatingDate,
      rec.shift === 'DAY' ? 'Ca ngày' : 'Ca đêm',
      rec.scheduledTime,
      rec.chillerId,
      `"${rec.inspectorName.replace(/"/g, '""')}"`,
      rec.overallStatus,
      ...CHILLER_PARAMETERS.map((p) => {
        const val = rec.readings[p.id]?.value || '';
        return `"${val.replace(/"/g, '""')}"`;
      }),
      `"${(rec.notes || '').replace(/"/g, '""')}"`
    ];
    return colValues.join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

/**
 * Generate Markdown handover report for Shift End
 */
export function generateMarkdownReport(record: HvacInspectionRecord): string {
  const stats = calculateRecordStats(record.readings);
  const outOfRange = CHILLER_PARAMETERS.filter((p) => {
    const r = record.readings[p.id];
    return r && (r.severity === 'WARNING' || r.severity === 'CRITICAL');
  });

  return `# BÁO CÁO THÔNG SỐ VẬN HÀNH CHILLER (${FORM_METADATA.formCode})
**Biểu mẫu:** ${FORM_METADATA.formTitle} (Lần BH/SĐ: ${FORM_METADATA.revision})  
**Thời gian:** ${record.operatingDate} | ${record.scheduledTime} (${record.shift === 'DAY' ? 'Ca ngày' : 'Ca đêm'})  
**Thiết bị:** ${record.chillerId}  
**Người kiểm tra & xác nhận:** ${record.inspectorName} (${record.reviewedAt || 'Đã ký số'})  
**Trạng thái hồ sơ:** ${record.overallStatus === 'APPROVED' ? '✅ ĐÃ DUYỆT (CHÍNH THỨC)' : '⏳ CHỜ KIỂM TRA'}  

---

## 1. TỔNG QUAN TÌNH TRẠNG VẬN HÀNH
- **Tỷ lệ hoàn thành điểm đo:** ${stats.completionRate}% (${stats.filled}/${stats.total} thông số)
- **Thông số chuẩn (Bình thường):** ${stats.normalCount}
- **Cảnh báo lệch ngưỡng (Warning):** ${stats.warningCount}
- **Bất thường nghiêm trọng (Critical):** ${stats.criticalCount}

${
  outOfRange.length > 0
    ? `### ⚠️ DANH SÁCH THÔNG SỐ CẦN LƯU Ý ĐẶC BIỆT:
| STT | Tên thông số | Giá trị đo | Đơn vị | Ngưỡng chuẩn | Đánh giá |
|:---|:---|:---|:---|:---|:---|
${outOfRange
  .map((p) => {
    const r = record.readings[p.id];
    return `| ${p.id} | ${p.nameVi} (${p.name}) | **${r?.value || '-'}** | ${p.unit} | ${p.referenceText} | ${r?.severity === 'CRITICAL' ? '🔴 BẤT THƯỜNG' : '🟡 CẢNH BÁO'} |`;
  })
  .join('\n')}`
    : '✅ *Toàn bộ các thông số đo đều nằm trong dải làm việc tiêu chuẩn của nhà sản xuất.*'
}

---

## 2. BẢNG CHI TIẾT 30 THÔNG SỐ ĐÃ XÁC NHẬN
| STT | Mã | Tên thông số (Vi / En) | Giá trị thực tế | Đơn vị | Dải tham chiếu | Trạng thái |
|:---:|:---:|:---|:---:|:---:|:---:|:---:|
${CHILLER_PARAMETERS.map((p) => {
  const r = record.readings[p.id];
  const icon = !r || r.value === '' ? '⚪' : r.severity === 'NORMAL' ? '🟢' : r.severity === 'WARNING' ? '🟡' : '🔴';
  return `| ${p.id} | ${p.code} | ${p.nameVi} <br><small>(${p.name})</small> | **${r?.value || ''}** | ${p.unit} | ${p.referenceText} | ${icon} ${r?.reviewStatus || 'APPROVED'} |`;
}).join('\n')}

---

## 3. Ý KIẾN TRỢ LÝ AI & CHẨN ĐOÁN
${record.aiDiagnosticSummary || 'Không có ghi chú bất thường từ mô-đun AI.'}

**Ghi chú của kíp trực:**  
${record.notes || 'Vận hành ổn định, không có can thiệp cơ điện bất thường.'}
`;
}
