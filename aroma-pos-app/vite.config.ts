import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { compression } from 'vite-plugin-compression2';

function antDesignTreeShakePlugin() {
  return {
    name: 'ant-design-tree-shake',
    transform(code: string, id: string) {
      const normalizedId = id.replace(/\\/g, '/');

      // Process all JS/TS/JSX/TSX files in the project
      if (!/\.[jt]sx?$/.test(normalizedId)) {
        return null;
      }

      let hasChanged = false;
      let transformedCode = code;

      const importRegex = /import\s+((?:(?!import)[\s\S])*?)\s+from\s+['"](antd|@ant-design\/icons)['"];?/g;
      
      transformedCode = transformedCode.replace(importRegex, (match, importClause, library) => {
        if (match.trim().startsWith('import type')) {
          return match;
        }

        hasChanged = true;
        
        // Strip curly braces
        const cleanClause = importClause.trim().replace(/^\{([\s\S]*)\}$/, '$1').trim();
        
        const specifiers = cleanClause
          .split(',')
          .map((s: string) => s.trim())
          .filter(Boolean);

        const replacements: string[] = [];
        const typesToKeep: string[] = [];

        for (const specifier of specifiers) {
          if (specifier.trim().startsWith('type ')) {
            typesToKeep.push(specifier);
            continue;
          }

          let name = specifier;
          let alias = specifier;
          if (specifier.includes(' as ')) {
            const parts = specifier.split(' as ').map((x: string) => x.trim());
            name = parts[0];
            alias = parts[1];
          }

          if (library === '@ant-design/icons') {
            replacements.push(`import ${alias} from '@ant-design/icons/es/icons/${name}';`);
          } else {
            const kebabName = name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
            
            if (name === 'theme') {
              replacements.push(`import theme from 'antd/es/theme';`);
            } else if (name === 'notification') {
              replacements.push(`import notification from 'antd/es/notification';`);
            } else if (name === 'message') {
              replacements.push(`import message from 'antd/es/message';`);
            } else {
              replacements.push(`import ${alias} from 'antd/es/${kebabName}';`);
            }
          }
        }

        if (typesToKeep.length > 0) {
          replacements.push(`import type { ${typesToKeep.join(', ')} } from '${library}';`);
        }

        return replacements.join('\n');
      });

      if (hasChanged) {
        return {
          code: transformedCode,
          map: null
        };
      }

      return null;
    }
  };
}

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const isProd = mode === 'production';

    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        antDesignTreeShakePlugin(),
        react(),
        compression({
          algorithms: ['gzip', 'brotliCompress'],
          exclude: [/\.(map)$/, /\.html$/],
        }),
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        // In production replace every console.* with a no-op so the bundler
        // dead-code-eliminates the surrounding log statements entirely.
        ...(isProd && {
          'console.log':            '(()=>{})',
          'console.warn':           '(()=>{})',
          'console.error':          '(()=>{})',
          'console.info':           '(()=>{})',
          'console.debug':          '(()=>{})',
          'console.group':          '(()=>{})',
          'console.groupCollapsed': '(()=>{})',
          'console.groupEnd':       '(()=>{})',
        }),
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
