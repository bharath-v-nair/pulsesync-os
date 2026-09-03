// PulseSync Life OS - Local Wi-Fi Sync Server
// Zero dependencies (Native Node.js http & fs)
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 8080;
const DATA_FILE = path.join(__dirname, 'data', 'workouts.json');

// Ensure data file exists
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
}

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon'
};

function readLogs() {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data || '[]');
  } catch (err) {
    console.error('Error reading workouts.json:', err);
    return [];
  }
}

function writeLogs(logs) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(logs, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing workouts.json:', err);
    return false;
  }
}

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // CORS headers for local network access
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // API Route: GET /api/logs
  if (pathname === '/api/logs' && req.method === 'GET') {
    const logs = readLogs();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(logs));
    return;
  }

  // API Route: POST /api/logs (Add or replace log array)
  if (pathname === '/api/logs' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        let logs = readLogs();
        if (Array.isArray(payload)) {
          // Bulk sync
          logs = payload;
        } else if (payload && payload.id) {
          // Single item add / update
          const idx = logs.findIndex(item => item.id === payload.id);
          if (idx >= 0) {
            logs[idx] = payload;
          } else {
            logs.push(payload);
          }
        }
        writeLogs(logs);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, count: logs.length }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
      }
    });
    return;
  }

  // API Route: DELETE /api/logs/:id
  if (pathname.startsWith('/api/logs/') && req.method === 'DELETE') {
    const id = pathname.replace('/api/logs/', '');
    let logs = readLogs();
    const initialLen = logs.length;
    logs = logs.filter(item => item.id !== id);
    writeLogs(logs);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, deleted: initialLen - logs.length }));
    return;
  }

  // Static File Serving
  let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);
  const ext = path.extname(filePath).toLowerCase();

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`⚡ PulseSync Local Wi-Fi Sync Server running on port ${PORT}`);
  console.log(`👉 Access on Mac: http://localhost:${PORT}`);
  console.log(`👉 Access on Phone: http://<YOUR_MAC_IP>:${PORT} (e.g. http://192.168.1.8:${PORT})`);
});
