import { processHvacImageWithGemini } from '../../src/server/api-handler.ts';

export const handler = async (event: {
  path?: string;
  rawUrl?: string;
  httpMethod?: string;
  body?: string | null;
}) => {
  const path = event.path || '';
  const httpMethod = event.httpMethod || 'GET';

  // Handle CORS preflight
  if (httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      },
      body: '',
    };
  }

  // Health check endpoint
  if (path.endsWith('/health') || path.includes('/health')) {
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'HVAC-BMS-Operations-AI',
        form: 'B01.QT04/SGN-KTG-ĐQT',
        runtime: 'Netlify Functions'
      })
    };
  }

  // Gemini AI analysis endpoint
  if (path.endsWith('/analyze-hvac') || path.includes('analyze-hvac')) {
    if (httpMethod !== 'POST') {
      return {
        statusCode: 405,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Method Not Allowed' })
      };
    }

    try {
      const body = JSON.parse(event.body || '{}');
      const {
        imageBase64,
        mimeType,
        operatingDate,
        shift,
        scheduledTime,
        chillerId,
        useHighThinking
      } = body;

      if (!imageBase64) {
        return {
          statusCode: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({ error: 'Thiếu dữ liệu ảnh BMS (imageBase64).' })
        };
      }

      const result = await processHvacImageWithGemini({
        imageBase64,
        mimeType: mimeType || 'image/png',
        operatingDate: operatingDate || new Date().toISOString().split('T')[0],
        shift: shift || 'DAY',
        scheduledTime: scheduledTime || '07:30',
        chillerId: chillerId || 'Chiller 01',
        useHighThinking: useHighThinking !== false
      });

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify(result)
      };
    } catch (error: any) {
      console.error('Netlify Function Gemini Error:', error);
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          error: error.message || 'Lỗi xử lý hình ảnh qua mô-đun AI trên Netlify Function'
        })
      };
    }
  }

  return {
    statusCode: 404,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({ error: 'API route not found on Netlify Functions' })
  };
};
