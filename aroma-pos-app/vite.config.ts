import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { compression } from 'vite-plugin-compression2';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        compression({
          algorithms: ['gzip', 'brotliCompress'],
          exclude: [/\.(map)$/, /\.html$/],
        }),
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        rollupOptions: {
          output: {
            manualChunks(id) {
              if (id.includes('node_modules')) {
                if (id.includes('react') || id.includes('scheduler')) {
                  return 'react-vendor';
                }
                if (id.includes('@ant-design/icons')) {
                  return 'antd-icons-vendor';
                }
                if (id.includes('antd') || id.includes('@ant-design')) {
                  return 'antd-vendor';
                }
                if (id.includes('@tanstack')) {
                  return 'tanstack-vendor';
                }
                return 'vendor';
              }
            }
          }
        }
      }
    };
});
