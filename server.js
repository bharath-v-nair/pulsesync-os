// PulseSync Life OS - Local Wi-Fi Sync Server (Move & Focus Engines)
// Zero dependencies (Native Node.js http & fs)
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 8080;
const DATA_DIR = path.join(__dirname, 'data');
const WORKOUTS_FILE = path.join(DATA_DIR, 'workouts.json');
const FOCUS_FILE = path.join(DATA_DIR, 'focus.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(WORKOUTS_FILE)) {
  fs.writeFileSync(WORKOUTS_FILE, JSON.stringify([], null, 2));
}

if (!fs.existsSync(FOCUS_FILE)) {
  fs.writeFileSync(FOCUS_FILE, JSON.stringify({ tasks: [], sessions: [], stats: { activeSeconds: 0, breakSeconds: 0 } }, null, 2));
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

function readJsonFile(filePath, defaultVal) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data || JSON.stringify(defaultVal));
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return defaultVal;
  }
}

function writeJsonFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
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

  // --- MOVE API ROUTES ---
  // GET /api/logs
  if (pathname === '/api/logs' && req.method === 'GET') {
    const logs = readJsonFile(WORKOUTS_FILE, []);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(logs));
    return;
  }

  // POST /api/logs
  if (pathname === '/api/logs' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        let logs = readJsonFile(WORKOUTS_FILE, []);
        if (Array.isArray(payload)) {
          logs = payload;
        } else if (payload && payload.id) {
          const idx = logs.findIndex(item => item.id === payload.id);
          if (idx >= 0) logs[idx] = payload;
          else logs.push(payload);
        }
        writeJsonFile(WORKOUTS_FILE, logs);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, count: logs.length }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
      }
    });
    return;
  }

  // DELETE /api/logs/:id
  if (pathname.startsWith('/api/logs/') && req.method === 'DELETE') {
    const id = pathname.replace('/api/logs/', '');
    let logs = readJsonFile(WORKOUTS_FILE, []);
    const initialLen = logs.length;
    logs = logs.filter(item => item.id !== id);
    writeJsonFile(WORKOUTS_FILE, logs);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, deleted: initialLen - logs.length }));
    return;
  }

  // --- FOCUS API ROUTES ---
  // GET /api/focus
  if (pathname === '/api/focus' && req.method === 'GET') {
    const focusData = readJsonFile(FOCUS_FILE, { tasks: [], sessions: [], stats: { activeSeconds: 0, breakSeconds: 0 } });
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(focusData));
    return;
  }

  // POST /api/focus
  if (pathname === '/api/focus' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        writeJsonFile(FOCUS_FILE, payload);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
      }
    });
    return;
  }

  // --- STATIC FILE SERVING ---
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
  console.log(`👉 Access on Phone: http://<YOUR_MAC_IP>:${PORT}`);
});
