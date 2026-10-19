import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { processHvacImageWithGemini } from './src/server/api-handler.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'HVAC-BMS-Operations-AI',
    form: 'B01.QT04/SGN-KTG-ĐQT'
  });
});

// Gemini AI analysis endpoint
app.post('/api/gemini/analyze-hvac', async (req, res) => {
  try {
    const {
      imageBase64,
      mimeType,
      operatingDate,
      shift,
      scheduledTime,
      chillerId,
      useHighThinking
    } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Thiếu dữ liệu ảnh BMS (imageBase64).' });
    }

    const result = await processHvacImageWithGemini({
      imageBase64,
      mimeType: mimeType || 'image/png',
      operatingDate: operatingDate || new Date().toISOString().split('T')[0],
      shift: shift || 'DAY',
      scheduledTime: scheduledTime || '08:00',
      chillerId: chillerId || 'Chiller 01',
      useHighThinking: useHighThinking !== false
    });

    res.json(result);
  } catch (error: any) {
    console.error('API Error /api/gemini/analyze-hvac:', error);
    res.status(500).json({
      error: error.message || 'Lỗi xử lý hình ảnh qua mô-đun AI'
    });
  }
});

// Serve static frontend files in production
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server listening on port ${port}`);
});
