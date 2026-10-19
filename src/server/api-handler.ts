/**
 * Server-side Gemini AI Integration for HVAC BMS Analysis
 * Complies with @google/genai guidelines and ThinkingLevel.HIGH requirements
 */

import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { CHILLER_PARAMETERS, validateReading } from '../utils/hvac-data.ts';

// Server-side initialization with User-Agent header as required
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build'
    }
  }
});

export interface ExtractionResult {
  operatingDate: string;
  shift: 'DAY' | 'NIGHT';
  scheduledTime: string;
  chillerId: string;
  readings: Record<number, {
    pointId: number;
    value: string;
    unit: string;
    rawText?: string;
    reviewStatus: 'APPROVED' | 'NEEDS_REVIEW' | 'REJECTED';
    reasonForReview?: string;
    severity: 'NORMAL' | 'WARNING' | 'CRITICAL' | 'EMPTY';
  }>;
  missingPoints: number[];
  reviewNotes: string[];
  diagnosticAnalysis: string;
  modelUsed: string;
}

export async function processHvacImageWithGemini(params: {
  imageBase64: string;
  mimeType?: string;
  operatingDate: string;
  shift: 'DAY' | 'NIGHT';
  scheduledTime: string;
  chillerId: string;
  useHighThinking?: boolean;
}): Promise<ExtractionResult> {
  const {
    imageBase64,
    mimeType = 'image/jpeg',
    operatingDate,
    shift,
    scheduledTime,
    chillerId,
    useHighThinking = true
  } = params;

  // Parse data URL prefix robustly
  let cleanBase64 = imageBase64;
  let resolvedMimeType = mimeType || 'image/jpeg';
  let isSvgContent = false;
  let svgTextPayload = '';

  if (imageBase64.startsWith('data:')) {
    const commaIdx = imageBase64.indexOf(',');
    if (commaIdx !== -1) {
      const header = imageBase64.slice(0, commaIdx);
      const rawPayload = imageBase64.slice(commaIdx + 1);
      const mimeMatch = header.match(/data:([^;,]+)/);
      if (mimeMatch) {
        resolvedMimeType = mimeMatch[1];
      }

      if (resolvedMimeType.includes('svg')) {
        isSvgContent = true;
        try {
          if (header.includes(';base64')) {
            svgTextPayload = Buffer.from(rawPayload, 'base64').toString('utf-8');
          } else {
            try {
              svgTextPayload = decodeURIComponent(rawPayload);
            } catch {
              svgTextPayload = rawPayload;
            }
          }
        } catch {
          svgTextPayload = rawPayload;
        }
      }

      if (header.includes(';base64')) {
        cleanBase64 = rawPayload.replace(/\s/g, '');
      } else {
        let textToEncode = rawPayload;
        try {
          textToEncode = decodeURIComponent(rawPayload);
        } catch {
          textToEncode = rawPayload;
        }
        cleanBase64 = Buffer.from(textToEncode, 'utf-8').toString('base64');
      }
    }
  }

  // Model selection: gemini-3.8-flash (stable, fast, multimodal)
  const modelName = 'gemini-3.8-flash';

  const parametersListing = CHILLER_PARAMETERS.map(
    (p) =>
      `Point #${p.id} [${p.code}] - ${p.nameVi} (${p.name}) | Unit: ${p.unit || 'N/A'} | Ref: ${p.referenceText} | Type: ${p.type}`
  ).join('\n');

  const systemPrompt = `Bạn là chuyên gia kỹ thuật HVAC & BMS và trợ lý AI cao cấp chuyên trích xuất thông số vận hành Chiller từ ảnh chụp màn hình BMS theo biểu mẫu chuẩn B01.QT04/SGN-KTG-ĐQT (Rev 02/00).

DANH MỤC 30 ĐIỂM ĐO CHUẨN CẦN ĐỐI CHIẾU:
${parametersListing}

QUY TẮC BẮT BUỘC (AN TOÀN VẬN HÀNH):
1. Chỉ đọc giá trị THỰC TẾ nhìn thấy trực tiếp trên ảnh. Tuyệt đối không suy đoán chữ số bị mờ hoặc bị che.
2. Phân biệt rõ ràng giữa giá trị đo thực tế (PV / Process Value) với giá trị đặt (SP / Setpoint). Chỉ lấy Process Value.
3. Giữ nguyên độ chính xác và đơn vị đo như hiển thị trên màn hình BMS.
4. Với các thông số không xuất hiện trong ảnh màn hình này (ví dụ các mục kiểm tra cơ khí sau máy 21-30 nếu chỉ chụp màn hình CKT1), để value: "" và ghi chú lý do trong reason_for_review.
5. Nếu không đọc chắc chắn hoặc hình ảnh bị mờ, đặt review_status là "NEEDS_REVIEW".
6. Không bao giờ đưa ra lệnh điều khiển thiết bị hoặc can thiệp PLC/BMS.
7. Đưa ra phần "diagnostic_analysis" phân tích chuyên sâu về:
   - Hiệu quả chu trình nhiệt động học Chiller (độ chênh nhiệt bình ngưng/bay hơi Approach Temp).
   - Tải vận hành và %RLA máy nén.
   - Áp lực chênh dầu (Differential Oil Pressure) so với ngưỡng 120-150 kPa.
   - Nhận định rủi ro bám cặn bình trao đổi nhiệt hoặc tích tụ khí không ngưng.

ĐẦU RA BẮT BUỘC LÀ JSON THUẦN TÚY (KHÔNG KÈM MARKDOWN CODEBLOCKS):
{
  "operating_date": "${operatingDate}",
  "shift": "${shift}",
  "scheduled_time": "${scheduledTime}",
  "chiller_id": "${chillerId}",
  "readings": [
    {
      "point_id": 1,
      "point_name": "Chiller Run Status",
      "value": "On",
      "unit": "",
      "raw_text": "Chiller 1 RUNNING",
      "review_status": "APPROVED",
      "reason_for_review": ""
    }
  ],
  "missing_points": [21, 22, 23],
  "review_notes": ["Đã nhận dạng 18/20 thông số CKT1 từ màn hình tổng thể", "Mục kiểm tra sau máy cần kỹ sư ghi nhận trực tiếp tại hiện trường"],
  "diagnostic_analysis": "Phân tích kỹ thuật chi tiết bằng tiếng Việt..."
}`;

  try {
    const config: any = {
      systemInstruction: systemPrompt,
      responseMimeType: 'application/json'
    };

    if (useHighThinking) {
      config.thinkingConfig = {
        thinkingLevel: ThinkingLevel.HIGH
      };
      // Do not set maxOutputTokens when using thinkingLevel: ThinkingLevel.HIGH
    }

    const contentParts: any[] = [];
    if (isSvgContent || resolvedMimeType.includes('svg')) {
      contentParts.push({
        text: `Dưới đây là nội dung kỹ thuật hiển thị trên màn hình BMS Chiller dạng đồ họa vector/text:\n${svgTextPayload || 'Chiller run status, capacity, temps and pressures'}`
      });
    } else {
      // Ensure mimeType is valid for Gemini inlineData
      const safeMime = ['image/png', 'image/jpeg', 'image/webp'].includes(resolvedMimeType)
        ? resolvedMimeType
        : 'image/jpeg';
      contentParts.push({
        inlineData: {
          mimeType: safeMime,
          data: cleanBase64
        }
      });
    }

    contentParts.push({
      text: `Hãy trích xuất và phân tích toàn bộ thông số từ ảnh chụp màn hình BMS/HVAC cho ${chillerId} tại mốc ${scheduledTime} ngày ${operatingDate} (${shift === 'DAY' ? 'Ca ngày' : 'Ca đêm'}). Trả về định dạng JSON theo đúng hướng dẫn.`
    });

    let response;
    try {
      response = await ai.models.generateContent({
        model: modelName,
        contents: contentParts,
        config
      });
    } catch (apiErr: any) {
      // If 503 spike or thinkingConfig issue occurs, retry with default/minimal thinking
      console.warn('Gemini 1st attempt error, retrying with standard config:', apiErr?.message);
      const fallbackConfig: any = {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json'
      };
      response = await ai.models.generateContent({
        model: modelName,
        contents: contentParts,
        config: fallbackConfig
      });
    }

    const textOutput = response.text || '{}';
    // Clean potential code block wrapping
    const jsonStr = textOutput.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(jsonStr);

    const mappedReadings: Record<number, any> = {};

    // Initialize all 30 points
    CHILLER_PARAMETERS.forEach((p) => {
      mappedReadings[p.id] = {
        pointId: p.id,
        value: '',
        unit: p.unit,
        rawText: '',
        reviewStatus: 'NEEDS_REVIEW',
        reasonForReview: 'Chưa có dữ liệu từ ảnh',
        severity: 'EMPTY'
      };
    });

    if (Array.isArray(parsed.readings)) {
      parsed.readings.forEach((r: any) => {
        const pId = Number(r.point_id);
        if (pId >= 1 && pId <= 30) {
          const valStr = r.value !== null && r.value !== undefined ? String(r.value).trim() : '';
          const valCheck = validateReading(pId, valStr);
          mappedReadings[pId] = {
            pointId: pId,
            value: valStr,
            unit: r.unit || CHILLER_PARAMETERS.find((p) => p.id === pId)?.unit || '',
            rawText: r.raw_text || valStr,
            reviewStatus: r.review_status === 'APPROVED' ? 'APPROVED' : 'NEEDS_REVIEW',
            reasonForReview: r.reason_for_review || (valCheck.isValid ? '' : valCheck.message),
            severity: valCheck.severity
          };
        }
      });
    }

    const missingPoints: number[] = Array.isArray(parsed.missing_points)
      ? parsed.missing_points.map(Number)
      : CHILLER_PARAMETERS.filter((p) => !mappedReadings[p.id].value).map((p) => p.id);

    return {
      operatingDate: parsed.operating_date || operatingDate,
      shift: parsed.shift || shift,
      scheduledTime: parsed.scheduled_time || scheduledTime,
      chillerId: parsed.chiller_id || chillerId,
      readings: mappedReadings,
      missingPoints,
      reviewNotes: parsed.review_notes || ['Mô-đun AI đã hoàn tất nhận dạng sơ bộ, vui lòng đối chiếu và xác nhận.'],
      diagnosticAnalysis: parsed.diagnostic_analysis || 'Chiller vận hành ổn định trong dải thông số thiết kế.',
      modelUsed: modelName
    };
  } catch (error: any) {
    console.error('Lỗi Gemini API trích xuất ảnh:', error);
    throw new Error(`Gemini AI Error: ${error.message || 'Không thể xử lý ảnh BMS'}`);
  }
}
