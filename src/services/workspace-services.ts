/**
 * Google Workspace Services: Sheets, Drive, Gmail, Forms
 * Adheres to Least Privilege Principle & User Confirmation requirements
 */

import { CHILLER_PARAMETERS, FORM_METADATA, HvacInspectionRecord } from '../utils/hvac-data';

export interface DriveFileInfo {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  createdTime?: string;
}

/**
 * 1. GOOGLE SHEETS SERVICES
 */

/**
 * Create a new standardized Google Spreadsheet for HVAC Log B01.QT04/SGN-KTG-ĐQT
 */
export async function createHvacMasterSheet(
  accessToken: string,
  title?: string
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  const sheetTitle = title || `Sổ Ghi Thông Số HVAC BMS - ${FORM_METADATA.formCode} (${new Date().getFullYear()})`;

  const headers = [
    'Mã bản ghi',
    'Ngày vận hành',
    'Ca trực',
    'Mốc giờ',
    'Thiết bị',
    'Người kiểm tra',
    'Thời điểm ghi nhận',
    'Trạng thái kiểm tra',
    ...CHILLER_PARAMETERS.map((p) => `[${p.id}] ${p.nameVi} (${p.unit ? p.unit : p.referenceText})`),
    'Ghi chú vận hành',
    'Ý kiến AI Chẩn đoán'
  ];

  const payload = {
    properties: {
      title: sheetTitle
    },
    sheets: [
      {
        properties: {
          title: 'Nhat_Ky_BMS_Chiller',
          gridProperties: {
            frozenRowCount: 1
          }
        },
        data: [
          {
            startRow: 0,
            startColumn: 0,
            rowData: [
              {
                values: headers.map((h) => ({
                  userEnteredValue: { stringValue: h },
                  userEnteredFormat: {
                    backgroundColor: { red: 0.08, green: 0.15, blue: 0.25 },
                    textFormat: {
                      bold: true,
                      foregroundColor: { red: 1, green: 1, blue: 1 },
                      fontSize: 10
                    },
                    horizontalAlignment: 'CENTER'
                  }
                }))
              }
            ]
          }
        ]
      }
    ]
  };

  const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Không thể tạo Google Sheet (${res.status})`);
  }

  const data = await res.json();
  return {
    spreadsheetId: data.spreadsheetId,
    spreadsheetUrl: data.spreadsheetUrl
  };
}

/**
 * Append verified HVAC record to Google Sheet
 */
export async function appendHvacRecordToSheet(
  accessToken: string,
  spreadsheetId: string,
  record: HvacInspectionRecord
): Promise<{ updatedRows: number }> {
  const rowValues = [
    record.recordId,
    record.operatingDate,
    record.shift === 'DAY' ? 'Ca ngày' : 'Ca đêm',
    record.scheduledTime,
    record.chillerId,
    record.inspectorName,
    record.reviewedAt || record.capturedAt,
    record.overallStatus,
    ...CHILLER_PARAMETERS.map((p) => record.readings[p.id]?.value || ''),
    record.notes || '',
    record.aiDiagnosticSummary || ''
  ];

  const range = 'Nhat_Ky_BMS_Chiller!A:AH';
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      range,
      majorDimension: 'ROWS',
      values: [rowValues]
    })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Không thể ghi vào Google Sheet (${res.status})`);
  }

  const data = await res.json();
  return {
    updatedRows: data.updates?.updatedRows || 1
  };
}

/**
 * 2. GOOGLE DRIVE SERVICES
 */

/**
 * Save report file (Markdown or CSV) to Google Drive
 */
export async function saveReportFileToDrive(
  accessToken: string,
  fileName: string,
  content: string,
  mimeType: 'text/markdown' | 'text/csv' | 'application/json' = 'text/markdown'
): Promise<{ fileId: string; webViewLink?: string }> {
  const metadata = {
    name: fileName,
    mimeType: mimeType,
    description: `Báo cáo vận hành HVAC BMS theo chuẩn ${FORM_METADATA.formCode}`
  };

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    `Content-Type: ${mimeType}; charset=UTF-8\r\n\r\n` +
    content +
    closeDelimiter;

  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`
    },
    body: multipartRequestBody
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Không thể tải tệp lên Google Drive (${res.status})`);
  }

  const data = await res.json();
  return {
    fileId: data.id,
    webViewLink: data.webViewLink
  };
}

/**
 * List files created by app in Google Drive
 */
export async function listRecentDriveLogs(
  accessToken: string
): Promise<DriveFileInfo[]> {
  const q = `name contains 'HVAC' or name contains 'Chiller' or name contains 'B01.QT04' and trashed = false`;
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&pageSize=20&fields=files(id,name,mimeType,webViewLink,createdTime)&orderBy=createdTime desc`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Lỗi truy vấn danh sách tệp Google Drive`);
  }

  const data = await res.json();
  return data.files || [];
}

/**
 * 3. GMAIL SERVICES
 * Send handover email with operator report
 */
export async function sendShiftReportEmail(
  accessToken: string,
  options: {
    to: string;
    subject: string;
    reportMarkdown: string;
    record: HvacInspectionRecord;
  }
): Promise<{ id: string }> {
  // Convert markdown to clean HTML email body
  const stats = [
    `Mã phiếu: ${FORM_METADATA.formCode}`,
    `Thiết bị: ${options.record.chillerId}`,
    `Ngày: ${options.record.operatingDate} (${options.record.shift === 'DAY' ? 'Ca ngày' : 'Ca đêm'}) - ${options.record.scheduledTime}`,
    `Người lập & duyệt: ${options.record.inspectorName}`,
    `Trạng thái: ${options.record.overallStatus === 'APPROVED' ? 'ĐÃ PHÊ DUYỆT' : 'CHỜ KIỂM TRA'}`
  ].join('<br>');

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 680px; margin: 0 auto; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #0f172a; color: #ffffff; padding: 20px; text-align: center;">
        <h2 style="margin: 0; font-size: 18px; color: #38bdf8;">BÁO CÁO GIAO CA VẬN HÀNH BMS - HVAC</h2>
        <p style="margin: 4px 0 0; font-size: 13px; color: #94a3b8;">${FORM_METADATA.formTitle} (${FORM_METADATA.formCode})</p>
      </div>
      <div style="padding: 24px;">
        <div style="background: #f8fafc; border-left: 4px solid #0284c7; padding: 12px 16px; margin-bottom: 20px; font-size: 14px;">
          ${stats}
        </div>
        <h4 style="color: #0f172a; margin-bottom: 8px;">Nhật ký & Nhận định kỹ thuật:</h4>
        <pre style="background: #f1f5f9; padding: 14px; border-radius: 6px; font-size: 12px; white-space: pre-wrap; font-family: monospace;">${options.reportMarkdown}</pre>
        <p style="font-size: 12px; color: #64748b; margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 12px;">
          * Email này được gửi tự động từ Ứng dụng Vận hành Hệ thống HVAC & BMS theo xác nhận của nhân viên trực ca.
        </p>
      </div>
    </div>
  `;

  const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(options.subject)))}?=`;
  const messageParts = [
    `To: ${options.to}`,
    'Content-Type: text/html; charset=utf-8',
    'MIME-Version: 1.0',
    `Subject: ${utf8Subject}`,
    '',
    htmlBody
  ];
  const message = messageParts.join('\r\n');

  // URL-safe base64 encoding
  const encodedMessage = btoa(unescape(encodeURIComponent(message)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ raw: encodedMessage })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Không thể gửi email qua Gmail API (${res.status})`);
  }

  return await res.json();
}

/**
 * 4. GOOGLE FORMS SERVICES
 * Create a standardized Google Form for field mobile survey
 */
export async function createHvacGoogleForm(
  accessToken: string,
  title?: string
): Promise<{ formId: string; responderUri: string }> {
  const formTitle = title || `Phiếu Kiểm Tra Chiller - ${FORM_METADATA.formCode}`;

  // 1. Create empty form
  const createRes = await fetch('https://forms.googleapis.com/v1/forms', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      info: {
        title: formTitle,
        documentTitle: formTitle
      }
    })
  });

  if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({}));
    throw new Error(err.error?.message || `Không thể tạo Google Form (${createRes.status})`);
  }

  const formData = await createRes.json();
  const formId = formData.formId;

  // 2. Batch add key checklist items
  const requests = [
    {
      createItem: {
        item: {
          title: 'Ngày & Mốc giờ vận hành',
          description: 'Ví dụ: 2026-10-18 - 08:00 (Ca ngày)',
          textQuestion: { paragraph: false }
        },
        location: { index: 0 }
      }
    },
    {
      createItem: {
        item: {
          title: 'Mã thiết bị Chiller',
          choiceQuestion: {
            type: 'RADIO',
            options: FORM_METADATA.chillerOptions.map((c) => ({ value: c })),
            shuffle: false
          }
        },
        location: { index: 1 }
      }
    },
    {
      createItem: {
        item: {
          title: '[CKT1] 01. Trạng thái Chiller Run Status',
          choiceQuestion: {
            type: 'RADIO',
            options: [{ value: 'On' }, { value: 'Off' }]
          }
        },
        location: { index: 2 }
      }
    },
    {
      createItem: {
        item: {
          title: '[CKT1] 04. Công suất hoạt động (%) [Ngưỡng: 30-100%]',
          textQuestion: { paragraph: false }
        },
        location: { index: 3 }
      }
    },
    {
      createItem: {
        item: {
          title: '[CKT1] 19. Chênh lệch áp suất dầu Differential Oil Pressure (kPa) [Ngưỡng: 120-150]',
          textQuestion: { paragraph: false }
        },
        location: { index: 4 }
      }
    },
    {
      createItem: {
        item: {
          title: '[SAU MAY] 21. Tỷ lệ dầu trong mặt kính',
          choiceQuestion: {
            type: 'RADIO',
            options: [{ value: 'Đầy (1)' }, { value: 'Không (0)' }]
          }
        },
        location: { index: 5 }
      }
    }
  ];

  await fetch(`https://forms.googleapis.com/v1/forms/${formId}:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ requests })
  }).catch((e) => console.warn('Lưu ý khi thêm các câu hỏi vào Google Form:', e));

  return {
    formId,
    responderUri: formData.responderUri || `https://docs.google.com/forms/d/${formId}/viewform`
  };
}
