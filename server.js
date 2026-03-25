const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = 8888;

const server = http.createServer((req, res) => {
  // Proxy CDX API requests
  if (req.url.startsWith('/api/cdx?')) {
    const queryStr = req.url.slice('/api/cdx?'.length);
    const parsed = new URLSearchParams(queryStr);
    // CDX API needs decoded values (slashes, colons, etc.)
    const parts = [];
    for (const [k, v] of parsed) parts.push(`${k}=${v}`);
    const cdxUrl = `https://web.archive.org/cdx/search/cdx?${parts.join('&')}`;

    const cdxParsed = new URL(cdxUrl);
    const options = {
      hostname: cdxParsed.hostname,
      path: cdxParsed.pathname + cdxParsed.search,
      timeout: 20000,
      headers: { 'User-Agent': 'InternetArchaeologyDig/1.0' }
    };
    https.get(options, (proxyRes) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(proxyRes.statusCode);
      proxyRes.pipe(res);
    }).on('error', (err) => {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    });
    return;
  }

  // Serve static files
  let filePath = req.url === '/' ? '/index.html' : req.url;
  filePath = path.join(__dirname, filePath);

  const ext = path.extname(filePath);
  const mimeTypes = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
  const contentType = mimeTypes[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  });
});

server.listen(PORT, () => {
  console.log(`\n  ~ * ~ Internet Archaeology Dig ~ * ~`);
  console.log(`  Open http://localhost:${PORT} in your browser\n`);
});
