import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import dotenv from 'dotenv';
import { processHvacImageWithGemini } from './src/server/api-handler.ts';

dotenv.config();

function apiServerPlugin(): Plugin {
  return {
    name: 'api-server-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url === '/api/health' && req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ status: 'ok', time: new Date().toISOString() }));
          return;
        }

        if (req.url === '/api/gemini/analyze-hvac' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', async () => {
            try {
              const data = JSON.parse(body);
              const result = await processHvacImageWithGemini({
                imageBase64: data.imageBase64,
                mimeType: data.mimeType || 'image/png',
                operatingDate: data.operatingDate || new Date().toISOString().split('T')[0],
                shift: data.shift || 'DAY',
                scheduledTime: data.scheduledTime || '08:00',
                chillerId: data.chillerId || 'Chiller 01',
                useHighThinking: data.useHighThinking !== false
              });
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(result));
            } catch (err: any) {
              console.error('Lỗi phân tích Gemini:', err);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err.message || 'Lỗi xử lý hình ảnh' }));
            }
          });
          return;
        }

        next();
      });
    }
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), apiServerPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
