import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [
      react(), 
      tailwindcss(),
      {
        name: 'pinterest-proxy',
        configureServer(server) {
          server.middlewares.use('/api/pinterest-proxy', async (req, res) => {
            try {
              const urlObj = new URL(req.url || '', 'http://localhost:3000');
              const targetUrl = urlObj.searchParams.get('url');
              if (!targetUrl) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'Missing target url parameter' }));
                return;
              }
              const upstream = await fetch(targetUrl, {
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                  'Accept': 'application/rss+xml, application/xml, text/xml, */*',
                },
              });
              const xml = await upstream.text();
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.setHeader('Content-Type', 'application/xml; charset=utf-8');
              res.statusCode = upstream.status;
              res.end(xml);
            } catch (err: any) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message }));
            }
          });
        },
      }
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
