/**
 * Sample BMS Telemetry Presets & Simulated Screen Visuals
 * Allows testing AI OCR & extraction immediately even without a live BMS camera feed.
 */

export interface BmsPreset {
  id: string;
  title: string;
  description: string;
  shift: 'DAY' | 'NIGHT';
  time: string;
  chillerId: string;
  isAnomaly: boolean;
  sampleSvgDataUrl: string;
  mockValues: Record<number, string>;
}

// Generate authentic looking BMS screens as Data URLs for immediate testing
function generateBmsScreenSvg(options: {
  chillerId: string;
  status: string;
  capacity: number;
  evapPress: number;
  evapTemp: number;
  condPress: number;
  condTemp: number;
  evapApproach: number;
  condApproach: number;
  oilPress: number;
  oilTemp: number;
  rla: number;
  hours: number;
  starts: number;
  alarmText?: string;
}): string {
  const isAlarm = !!options.alarmText;
  const statusColor = options.status === 'RUNNING' ? '#22c55e' : '#eab308';
  const alarmBg = isAlarm ? '#ef4444' : '#1e293b';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 600" width="960" height="600" style="background:#090d16; font-family: monospace;">
    <!-- Background Grid -->
    <defs>
      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#131b2e" stroke-width="1"/>
      </pattern>
    </defs>
    <rect width="960" height="600" fill="url(#grid)" />

    <!-- Top Header Bar -->
    <rect x="0" y="0" width="960" height="52" fill="#0f172a" stroke="#334155" stroke-width="1"/>
    <text x="24" y="32" fill="#38bdf8" font-size="20" font-weight="bold">BMS CENTRAL HVAC MONITORING - SYSTEM OVERVIEW</text>
    <rect x="620" y="12" width="160" height="28" rx="4" fill="${statusColor}" fill-opacity="0.2" stroke="${statusColor}"/>
    <text x="700" y="31" fill="${statusColor}" font-size="14" font-weight="bold" text-anchor="middle">${options.chillerId}: ${options.status}</text>
    <text x="880" y="31" fill="#94a3b8" font-size="13" text-anchor="middle">CKT-1 ONLINE</text>

    <!-- Alarm Status Bar -->
    <rect x="24" y="68" width="912" height="36" rx="4" fill="${alarmBg}" stroke="#475569"/>
    <text x="44" y="91" fill="#ffffff" font-size="14" font-weight="bold">${isAlarm ? '⚠️ CẢNH BÁO: ' + options.alarmText : '🟢 THÔNG BÁO HỆ THỐNG: Khóa an toàn [No] | Báo lỗi hiện hành [Normal (Nor)]'}</text>

    <!-- Main Chiller CKT1 Schematics & Data Panel -->
    <!-- Box 1: Evaporator (Bình bay hơi) -->
    <rect x="24" y="120" width="288" height="210" rx="8" fill="#0b1329" stroke="#1e3a8a" stroke-width="2"/>
    <rect x="24" y="120" width="288" height="34" rx="8" fill="#1e3a8a"/>
    <text x="36" y="142" fill="#93c5fd" font-size="14" font-weight="bold">EVAPORATOR (BÌNH BAY HƠI - CKT1)</text>
    
    <text x="40" y="180" fill="#94a3b8" font-size="13">Evap Refrigerant Pressure:</text>
    <text x="280" y="180" fill="#38bdf8" font-size="15" font-weight="bold" text-anchor="end">${options.evapPress} kPa</text>
    
    <text x="40" y="215" fill="#94a3b8" font-size="13">Evap Refrigerant Temp:</text>
    <text x="280" y="215" fill="#38bdf8" font-size="15" font-weight="bold" text-anchor="end">${options.evapTemp} °C</text>
    
    <text x="40" y="250" fill="#94a3b8" font-size="13">Evaporator Approach Temp:</text>
    <text x="280" y="250" fill="${options.evapApproach > 2.0 ? '#f87171' : '#4ade80'}" font-size="15" font-weight="bold" text-anchor="end">${options.evapApproach} °C</text>
    
    <text x="40" y="285" fill="#94a3b8" font-size="13">Chilled Water Temp Delta:</text>
    <text x="280" y="285" fill="#38bdf8" font-size="15" font-weight="bold" text-anchor="end">4.8 °C</text>

    <!-- Box 2: Condenser (Bình ngưng) -->
    <rect x="336" y="120" width="288" height="210" rx="8" fill="#141a1a" stroke="#065f46" stroke-width="2"/>
    <rect x="336" y="120" width="288" height="34" rx="8" fill="#065f46"/>
    <text x="348" y="142" fill="#6ee7b7" font-size="14" font-weight="bold">CONDENSER (BÌNH NGƯNG - CKT1)</text>
    
    <text x="352" y="180" fill="#94a3b8" font-size="13">Cond Refrigerant Pressure:</text>
    <text x="592" y="180" fill="#34d399" font-size="15" font-weight="bold" text-anchor="end">${options.condPress} kPa</text>
    
    <text x="352" y="215" fill="#94a3b8" font-size="13">Cond Refrigerant Temp:</text>
    <text x="592" y="215" fill="#34d399" font-size="15" font-weight="bold" text-anchor="end">${options.condTemp} °C</text>
    
    <text x="352" y="250" fill="#94a3b8" font-size="13">Condenser Approach Temp:</text>
    <text x="592" y="250" fill="${options.condApproach > 3.0 ? '#f87171' : '#4ade80'}" font-size="15" font-weight="bold" text-anchor="end">${options.condApproach} °C</text>
    
    <text x="352" y="285" fill="#94a3b8" font-size="13">Cooling Water Delta:</text>
    <text x="592" y="285" fill="#34d399" font-size="15" font-weight="bold" text-anchor="end">5.1 °C</text>

    <!-- Box 3: Compressor & Lubrication (Máy nén & Dầu) -->
    <rect x="648" y="120" width="288" height="210" rx="8" fill="#1e1814" stroke="#9a3412" stroke-width="2"/>
    <rect x="648" y="120" width="288" height="34" rx="8" fill="#9a3412"/>
    <text x="660" y="142" fill="#fdba74" font-size="14" font-weight="bold">COMPRESSOR &amp; OIL (MÁY NÉN)</text>
    
    <text x="664" y="180" fill="#94a3b8" font-size="13">Operating Capacity:</text>
    <text x="904" y="180" fill="#fb923c" font-size="15" font-weight="bold" text-anchor="end">${options.capacity} %</text>
    
    <text x="664" y="215" fill="#94a3b8" font-size="13">Compressor Current (%RLA):</text>
    <text x="904" y="215" fill="#fb923c" font-size="15" font-weight="bold" text-anchor="end">${options.rla} %</text>
    
    <text x="664" y="250" fill="#94a3b8" font-size="13">Diff Oil Pressure:</text>
    <text x="904" y="250" fill="${options.oilPress < 120 ? '#f87171' : '#4ade80'}" font-size="15" font-weight="bold" text-anchor="end">${options.oilPress} kPa</text>
    
    <text x="664" y="285" fill="#94a3b8" font-size="13">Compressor Oil Temp:</text>
    <text x="904" y="285" fill="#fb923c" font-size="15" font-weight="bold" text-anchor="end">${options.oilTemp} °C</text>

    <!-- Bottom Row: Purge & Runtime telemetry -->
    <rect x="24" y="348" width="450" height="220" rx="8" fill="#111827" stroke="#374151"/>
    <text x="44" y="378" fill="#e2e8f0" font-size="15" font-weight="bold">PURGE UNIT (BỘ LỌC TÁCH KHÍ CKT1)</text>
    
    <text x="44" y="415" fill="#9ca3af" font-size="13">Purge Refrigeration Circuit:</text>
    <text x="440" y="415" fill="#e2e8f0" font-size="14" font-weight="bold" text-anchor="end">On</text>
    
    <text x="44" y="450" fill="#9ca3af" font-size="13">Purge Regenerating Status:</text>
    <text x="440" y="450" fill="#e2e8f0" font-size="14" font-weight="bold" text-anchor="end">No</text>
    
    <text x="44" y="485" fill="#9ca3af" font-size="13">Purge 24 Hour Pump Out Time:</text>
    <text x="440" y="485" fill="#38bdf8" font-size="14" font-weight="bold" text-anchor="end">6 Min</text>
    
    <text x="44" y="520" fill="#9ca3af" font-size="13">Alarm Locked Status:</text>
    <text x="440" y="520" fill="#4ade80" font-size="14" font-weight="bold" text-anchor="end">No</text>

    <!-- Bottom Row Right: Motor & Running Hours -->
    <rect x="486" y="348" width="450" height="220" rx="8" fill="#111827" stroke="#374151"/>
    <text x="506" y="378" fill="#e2e8f0" font-size="15" font-weight="bold">MOTOR &amp; ACCUMULATED HOURS</text>
    
    <text x="506" y="415" fill="#9ca3af" font-size="13">Compressor Running Status:</text>
    <text x="904" y="415" fill="#4ade80" font-size="14" font-weight="bold" text-anchor="end">On</text>
    
    <text x="506" y="450" fill="#9ca3af" font-size="13">Compressor Run Time Hours:</text>
    <text x="904" y="450" fill="#fbbf24" font-size="14" font-weight="bold" text-anchor="end">${options.hours} Hours</text>
    
    <text x="506" y="485" fill="#9ca3af" font-size="13">Compressor Starts (Lũy kế):</text>
    <text x="904" y="485" fill="#fbbf24" font-size="14" font-weight="bold" text-anchor="end">${options.starts} Lần</text>

    <text x="506" y="520" fill="#9ca3af" font-size="13">BMS Protocol / RTU Status:</text>
    <text x="904" y="520" fill="#38bdf8" font-size="14" font-weight="bold" text-anchor="end">BACnet/IP CONNECTED</text>
  </svg>`;

  const base64Data =
    typeof btoa !== 'undefined'
      ? btoa(unescape(encodeURIComponent(svg)))
      : Buffer.from(svg).toString('base64');

  return `data:image/svg+xml;base64,${base64Data}`;
}

export const BMS_PRESETS: BmsPreset[] = [
  {
    id: 'preset-day-normal',
    title: 'Ca Ngày 10:30 - Tải tiêu chuẩn 82% (Bình thường)',
    description: 'Chiller 01 hoạt động ổn định, các thông số nhiệt độ bay hơi, ngưng tụ và áp lực dầu đều trong ngưỡng chuẩn.',
    shift: 'DAY',
    time: '10:30',
    chillerId: 'Chiller 01',
    isAnomaly: false,
    sampleSvgDataUrl: generateBmsScreenSvg({
      chillerId: 'CHILLER 01',
      status: 'RUNNING',
      capacity: 82,
      evapPress: -52,
      evapTemp: 6.8,
      condPress: 48.5,
      condTemp: 35.4,
      evapApproach: 0.8,
      condApproach: 1.2,
      oilPress: 138,
      oilTemp: 52.3,
      rla: 78,
      hours: 14280,
      starts: 432
    }),
    mockValues: {
      1: 'On',
      2: 'No',
      3: 'Normal (Nor)',
      4: '82',
      5: '0.8',
      6: '-52',
      7: '6.8',
      8: '1.2',
      9: '48.5',
      10: '35.4',
      11: 'On',
      12: 'No',
      13: '6',
      14: 'On',
      15: '14280',
      16: '432',
      17: '78',
      18: '52.3',
      19: '138',
      20: '4.8',
      21: 'Đầy',
      22: 'No',
      23: 'Yes',
      24: '√ Bình thường',
      25: '√ Bình thường',
      26: '√ Bình thường',
      27: '√ Bình thường',
      28: '2.4',
      29: '1248.5',
      30: '2.5'
    }
  },
  {
    id: 'preset-day-high-load',
    title: 'Ca Ngày 13:30 - Cao điểm nắng nóng tải 95%',
    description: 'Tải làm mát đỉnh điểm vào đầu giờ chiều, công suất đạt 95%, dòng %RLA 92%, nhiệt độ dầu 61°C.',
    shift: 'DAY',
    time: '13:30',
    chillerId: 'Chiller 02',
    isAnomaly: false,
    sampleSvgDataUrl: generateBmsScreenSvg({
      chillerId: 'CHILLER 02',
      status: 'RUNNING',
      capacity: 95,
      evapPress: -48,
      evapTemp: 7.4,
      condPress: 68.2,
      condTemp: 39.8,
      evapApproach: 1.1,
      condApproach: 1.8,
      oilPress: 142,
      oilTemp: 61.2,
      rla: 92,
      hours: 9840,
      starts: 285
    }),
    mockValues: {
      1: 'On',
      2: 'No',
      3: 'Normal (Nor)',
      4: '95',
      5: '1.1',
      6: '-48',
      7: '7.4',
      8: '1.8',
      9: '68.2',
      10: '39.8',
      11: 'On',
      12: 'No',
      13: '8',
      14: 'On',
      15: '9840',
      16: '285',
      17: '92',
      18: '61.2',
      19: '142',
      20: '5.2',
      21: 'Đầy',
      22: 'No',
      23: 'Yes',
      24: '√ Bình thường',
      25: '√ Bình thường',
      26: '√ Bình thường',
      27: '√ Bình thường',
      28: '2.3',
      29: '1251.2',
      30: '2.6'
    }
  },
  {
    id: 'preset-night-eco',
    title: 'Ca Đêm 22:30 - Tải thấp ban đêm 40% (Eco Run)',
    description: 'Vận hành ban đêm tiết kiệm năng lượng, công suất hạ xuống 40%, áp suất ngưng tụ giảm, bình ổn định.',
    shift: 'NIGHT',
    time: '22:30',
    chillerId: 'Chiller 01',
    isAnomaly: false,
    sampleSvgDataUrl: generateBmsScreenSvg({
      chillerId: 'CHILLER 01',
      status: 'RUNNING',
      capacity: 40,
      evapPress: -58,
      evapTemp: 5.6,
      condPress: 32.1,
      condTemp: 31.2,
      evapApproach: 0.5,
      condApproach: 0.7,
      oilPress: 126,
      oilTemp: 38.4,
      rla: 38,
      hours: 14310,
      starts: 432
    }),
    mockValues: {
      1: 'On',
      2: 'No',
      3: 'Normal (Nor)',
      4: '40',
      5: '0.5',
      6: '-58',
      7: '5.6',
      8: '0.7',
      9: '32.1',
      10: '31.2',
      11: 'Off',
      12: 'No',
      13: '2',
      14: 'On',
      15: '14310',
      16: '432',
      17: '38',
      18: '38.4',
      19: '126',
      20: '2.8',
      21: 'Đầy',
      22: 'No',
      23: 'Yes',
      24: '√ Bình thường',
      25: '√ Bình thường',
      26: '√ Bình thường',
      27: '√ Bình thường',
      28: '2.5',
      29: '1254.0',
      30: '2.4'
    }
  },
  {
    id: 'preset-anomaly-oil-pressure',
    title: '⚠️ Cảnh báo: Áp lực chênh dầu thấp (112 kPa < 120)',
    description: 'Tình huống bất thường: Chênh lệch áp suất dầu tụt xuống 112 kPa (dưới dải chuẩn 120-150 kPa), cảnh báo nghẹt lọc dầu.',
    shift: 'DAY',
    time: '16:30',
    chillerId: 'Chiller 03',
    isAnomaly: true,
    sampleSvgDataUrl: generateBmsScreenSvg({
      chillerId: 'CHILLER 03',
      status: 'WARNING',
      capacity: 65,
      evapPress: -50,
      evapTemp: 6.2,
      condPress: 51.4,
      condTemp: 36.1,
      evapApproach: 0.9,
      condApproach: 1.4,
      oilPress: 112, // Anomaly!
      oilTemp: 68.4,
      rla: 64,
      hours: 18920,
      starts: 512,
      alarmText: 'DIFF OIL PRESSURE LOW WARNING (112 kPa)'
    }),
    mockValues: {
      1: 'On',
      2: 'No',
      3: 'Normal (Nor)',
      4: '65',
      5: '0.9',
      6: '-50',
      7: '6.2',
      8: '1.4',
      9: '51.4',
      10: '36.1',
      11: 'On',
      12: 'No',
      13: '14',
      14: 'On',
      15: '18920',
      16: '512',
      17: '64',
      18: '68.4',
      19: '112', // Warning!
      20: '3.6',
      21: 'Đầy',
      22: 'Yes', // Bọt dầu cảnh báo
      23: 'Yes',
      24: '√ Bình thường',
      25: '√ Bình thường',
      26: '√ Bình thường',
      27: '√ Bình thường',
      28: '2.1',
      29: '1258.4',
      30: '2.2'
    }
  },
  {
    id: 'preset-chiller-05-handover',
    title: '⏱️ Chốt Giao Ca 19:15 - Chiller 05 (Trước 15 phút)',
    description: 'Kíp trực ngày chốt sổ giao ca lúc 19:15 (trước 15 phút đổi ca 19:30). Chiller 05 phụ tải 86%, hoàn tất kiểm tra 30 điểm đo.',
    shift: 'DAY',
    time: '19:15',
    chillerId: 'Chiller 05',
    isAnomaly: false,
    sampleSvgDataUrl: generateBmsScreenSvg({
      chillerId: 'CHILLER 05',
      status: 'RUNNING',
      capacity: 86,
      evapPress: -51,
      evapTemp: 6.7,
      condPress: 52.3,
      condTemp: 36.8,
      evapApproach: 0.9,
      condApproach: 1.3,
      oilPress: 136,
      oilTemp: 54.1,
      rla: 82,
      hours: 7420,
      starts: 198
    }),
    mockValues: {
      1: 'On',
      2: 'No',
      3: 'Normal (Nor)',
      4: '86',
      5: '0.9',
      6: '-51',
      7: '6.7',
      8: '1.3',
      9: '52.3',
      10: '36.8',
      11: 'On',
      12: 'No',
      13: '8',
      14: 'On',
      15: '7420',
      16: '198',
      17: '82',
      18: '54.1',
      19: '136',
      20: '4.9',
      21: 'Đầy',
      22: 'No',
      23: 'Yes',
      24: '√ Bình thường',
      25: '√ Bình thường',
      26: '√ Bình thường',
      27: '√ Bình thường',
      28: '2.3',
      29: '1256.0',
      30: '2.5'
    }
  }
];
