
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  if (!env.OTP_API_KEY) {
    throw new Error('OTP_API_KEY is missing from .env.local');
  }

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://localhost:8080',
          changeOrigin: true,
          headers: {
            'X-API-Key': env.OTP_API_KEY
          }
        }
      }
    }
  };
});
