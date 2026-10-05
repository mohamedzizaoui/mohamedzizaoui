// Kleine statische server voor de demo: node serve.mjs  →  http://localhost:8190/demo/
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const port = Number(process.env.PORT) || 8190;
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.png': 'image/png', '.md': 'text/plain; charset=utf-8' };

// /haal?url=<tijdelijke downloadlink>&naam=<wagen-id> : haalt een model-zip op naar tools/download/
// (omzeilt de Chrome-blokkade op meerdere automatische downloads; alleen sketchfab-links)
async function haal(req, res) {
  const u = new URL(req.url, 'http://x');
  const bron = u.searchParams.get('url') || '', naam = (u.searchParams.get('naam') || 'model').replace(/[^a-z0-9-]/gi, '');
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (!/^https:\/\/([a-z0-9.-]+\.)?(sketchfab\.com|amazonaws\.com|cloudfront\.net)\//i.test(bron)) { res.writeHead(400); return res.end('link niet toegestaan'); }
  try {
    const r = await fetch(bron);
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const buf = Buffer.from(await r.arrayBuffer());
    const { mkdirSync, writeFileSync } = await import('node:fs');
    mkdirSync(join(root, 'tools', 'download'), { recursive: true });
    writeFileSync(join(root, 'tools', 'download', naam + '.zip'), buf);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ naam, bytes: buf.length }));
  } catch (e) { res.writeHead(500); res.end(String(e.message)); }
}

createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {   // Chrome-preflight voor toegang tot het lokale netwerk vanaf een https-site
    res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Private-Network': 'true', 'Access-Control-Allow-Local-Network': 'true' });
    return res.end();
  }
  if (req.url.startsWith('/haal?')) return haal(req, res);
  if (req.method === 'POST' && req.url.startsWith('/shot?')) {   // schermafbeelding uit de 3D-pagina bewaren (test/shots/)
    const naam = (new URL(req.url, 'http://x').searchParams.get('naam') || 'shot').replace(/[^a-z0-9-]/gi, '');
    const delen = []; req.on('data', d => delen.push(d));
    req.on('end', async () => {
      const { mkdirSync, writeFileSync } = await import('node:fs');
      mkdirSync(join(root, 'test', 'shots'), { recursive: true });
      const b64 = Buffer.concat(delen).toString().replace(/^data:image\/png;base64,/, '');
      writeFileSync(join(root, 'test', 'shots', naam + '.png'), Buffer.from(b64, 'base64'));
      res.writeHead(200, { 'Access-Control-Allow-Origin': '*' }); res.end('ok');
    });
    return;
  }
  let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (path === '/') { res.writeHead(302, { Location: '/demo/' }); return res.end(); }
  if (path.endsWith('/')) path += 'index.html';
  const file = normalize(join(root, path));
  if (!file.startsWith(root)) { res.writeHead(403); return res.end(); }
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*' });
    res.end(body);
  } catch {
    res.writeHead(404); res.end('Niet gevonden');
  }
}).listen(port, () => console.log(`AVD demo op http://localhost:${port}/demo/`));
