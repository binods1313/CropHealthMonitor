import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  // Expose env to process.env for local API handlers
  Object.entries(env).forEach(([key, value]) => {
    process.env[key] = value;
  });

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [
      react(),
      {
        name: 'api-middleware',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (req.url?.startsWith('/api/')) {
              const url = new URL(req.url, `http://${req.headers.host}`);
              const apiPath = url.pathname.replace('/api/', '');
              const filePath = path.resolve(__dirname, 'api', `${apiPath}.ts`);

              try {
                console.log(`[API Request] ${req.method} ${req.url}`);
                // Read and parse body if it's a POST request
                let body = {};
                if (req.method === 'POST') {
                  const bodyPromise = new Promise<string>((resolve) => {
                    let data = '';
                    req.on('data', chunk => data += chunk);
                    req.on('end', () => resolve(data));
                  });
                  const rawBody = await bodyPromise;
                  if (rawBody) body = JSON.parse(rawBody);
                }

                // Dynamic import the API handler
                // We use srv.ssrLoadModule to handle TS files
                const module = await server.ssrLoadModule(filePath);
                const handler = module.default;

                if (typeof handler === 'function') {
                  // Mock res methods that Vercel provides
                  const mockRes = {
                    status: (code: number) => {
                      res.statusCode = code;
                      return mockRes;
                    },
                    json: (data: any) => {
                      res.setHeader('Content-Type', 'application/json');
                      res.end(JSON.stringify(data));
                      return mockRes;
                    },
                    setHeader: (name: string, value: string) => {
                      res.setHeader(name, value);
                      return mockRes;
                    },
                    end: (data: any) => {
                      res.end(data);
                      return mockRes;
                    }
                  };

                  await handler({ ...req, body }, mockRes);
                  return;
                }
              } catch (error: any) {
                console.error(`[API Error] ${req.url}:`, error);
                res.statusCode = 500;
                res.end(JSON.stringify({ error: 'Internal Server Error', details: error.message }));
                return;
              }
            }
            next();
          });
        }
      }
    ],
    define: {
      'process.env': JSON.stringify(process.env),
      'process.env.VITE_NASA_API_KEY': JSON.stringify(env.VITE_NASA_API_KEY),
      'process.env.VITE_OPENWEATHER_API_KEY': JSON.stringify(env.VITE_OPENWEATHER_API_KEY),
      'process.env.VITE_FIRECRAWL_API_KEY': JSON.stringify(env.VITE_FIRECRAWL_API_KEY),
      'process.env.VITE_GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY),
      'process.env.VITE_MAPBOX_API_KEY': JSON.stringify(env.VITE_MAPBOX_API_KEY),
      'process.env.VITE_PERPLEXITY_API_KEY': JSON.stringify(env.VITE_PERPLEXITY_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    ssr: {
      noExternal: ['@mendable/firecrawl-js'] // Include Firecrawl in SSR build
    },
    build: {
      outDir: 'dist',
      rollupOptions: {
        external: ['undici', 'node:events', 'events'],
        output: {
          globals: {
            'undici': 'undici',
            'events': 'events'
          }
        }
      }
    }
  };
});
