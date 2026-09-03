const http = require('http');
const fs = require('fs');
const path = require('path');
const PORT = 8766;

// Config file
const CONFIG_PATH = path.join(__dirname, 'config.json');
let config = { audioDir: 'D:\\church\\audio', bookmarkDir: 'D:\\church\\bookmarks', modules: ['player', 'bookmarks', 'file-tree', 'settings'] };
if (fs.existsSync(CONFIG_PATH)) {
  try { config = { ...config, ...JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8')) }; } catch(e) {}
}
// Resolve to absolute paths
config.audioDir = path.resolve(config.audioDir);
config.bookmarkDir = path.resolve(config.bookmarkDir);
const AUDIO_DIR = config.audioDir;
const BOOKMARKS_DIR = config.bookmarkDir;

// MIME types
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.flac': 'audio/flac',
  '.m4a': 'audio/mp4',
  '.webm': 'audio/webm',
  '.opus': 'audio/opus',
  '.aac': 'audio/aac',
  '.wma': 'audio/x-ms-wma',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

// Recursively scan directory for audio files
function scanDir(dir, prefix = '') {
  const exts = new Set(['.mp3','.wav','.ogg','.flac','.m4a','.webm','.opus','.aac','.wma']);
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = prefix + entry.name;
    if (entry.isDirectory()) {
      results = results.concat(scanDir(fullPath, relPath + '/'));
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if (exts.has(ext)) {
        const stat = fs.statSync(fullPath);
        results.push({
          name: entry.name,
          path: relPath,
          size: stat.size,
          ext: ext,
        });
      }
    }
  }
  return results;
}

// Ensure bookmarks dir exists
if (!fs.existsSync(BOOKMARKS_DIR)) fs.mkdirSync(BOOKMARKS_DIR, { recursive: true });

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  let urlPath = url.pathname;

  // API: get config
  if (urlPath === '/api/config') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ audioDir: config.audioDir, bookmarkDir: config.bookmarkDir, modules: config.modules }));
    return;
  }

  // API: update config
  if (urlPath === '/api/config' && req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        if (data.audioDir) config.audioDir = path.resolve(data.audioDir);
        if (data.bookmarkDir) config.bookmarkDir = path.resolve(data.bookmarkDir);
        if (data.modules) config.modules = data.modules;
        fs.writeFileSync(CONFIG_PATH, JSON.stringify({ audioDir: config.audioDir, bookmarkDir: config.bookmarkDir, modules: config.modules }, null, 2));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, audioDir: config.audioDir, bookmarkDir: config.bookmarkDir, modules: config.modules }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // API: list audio files
  if (urlPath === '/api/audio-list') {
    const list = scanDir(AUDIO_DIR);
    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify(list));
    return;
  }

  // API: get bookmark for a given audio name
  if (urlPath.startsWith('/api/bookmark/')) {
    const fileName = decodeURIComponent(urlPath.split('/api/bookmark/')[1]);
    const jsonName = fileName.replace(/\.[^.]+$/, '') + '.json';
    const jsonPath = path.join(BOOKMARKS_DIR, jsonName);
    if (fs.existsSync(jsonPath)) {
      const data = fs.readFileSync(jsonPath, 'utf-8');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(data);
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'not found' }));
    }
    return;
  }

  // API: save bookmark
  if (urlPath === '/api/bookmark' && req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const jsonName = data.fileName.replace(/\.[^.]+$/, '') + '.json';
        const jsonPath = path.join(BOOKMARKS_DIR, jsonName);
        fs.writeFileSync(jsonPath, JSON.stringify({ file: data.fileName, bookmarks: data.bookmarks }, null, 2));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // Serve static files
  // Strip leading / for relative paths
  if (urlPath.startsWith('/')) urlPath = urlPath.slice(1);
  if (!urlPath) urlPath = 'index.html';

  // Map /audio/... to AUDIO_DIR
  if (urlPath.startsWith('audio/') || urlPath === 'audio') {
    const relativePath = urlPath.replace(/^audio\/?/, '');
    let decodedPath;
    try { decodedPath = decodeURIComponent(relativePath); } catch(e) { decodedPath = relativePath; }
    const filePath = path.join(AUDIO_DIR, decodedPath);
    serveFile(filePath, res, true);
    return;
  }

  // Decode URL-encoded characters (for Chinese filenames)
  try { urlPath = decodeURIComponent(urlPath); } catch(e) {}

  const filePath = path.join(__dirname, urlPath);

  // Security: prevent directory traversal
  const resolved = path.resolve(filePath);
  if (!resolved.startsWith(path.resolve(__dirname))) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  // If it's a directory, try index.html
  let stat;
  try {
    stat = fs.statSync(filePath);
  } catch (e) {
    res.writeHead(404);
    res.end('Not found: ' + urlPath);
    return;
  }

  if (stat.isDirectory()) {
    const indexPath = path.join(filePath, 'index.html');
    if (fs.existsSync(indexPath)) {
      serveFile(indexPath, res);
    } else {
      res.writeHead(403);
      res.end('Directory listing not allowed');
    }
    return;
  }

  serveFile(filePath, res);
});

function serveFile(filePath, res, isAudio) {
  const ext = path.extname(filePath).toLowerCase();
  const mimeType = MIME[ext] || 'application/octet-stream';

  // Support range requests for audio streaming
  let stat;
  try {
    stat = fs.statSync(filePath);
  } catch(e) {
    res.writeHead(404);
    res.end('Not found: ' + filePath);
    return;
  }
  const range = res.req.headers.range;

  if (range && (mimeType.startsWith('audio/') || mimeType.startsWith('video/'))) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
    const chunkSize = end - start + 1;

    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${stat.size}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': mimeType,
    });

    const stream = fs.createReadStream(filePath, { start, end });
    stream.pipe(res);
    return;
  }

  res.writeHead(200, {
    'Content-Type': mimeType,
    'Content-Length': stat.size,
    'Cache-Control': 'no-cache',
  });

  const stream = fs.createReadStream(filePath);
  stream.pipe(res);
}

server.listen(PORT, () => {
  console.log(`\n🎵 AudioMark Server running at http://localhost:${PORT}`);
  console.log(`   Audio directory: ${AUDIO_DIR}`);
  console.log(`   Bookmarks saved to: ${BOOKMARKS_DIR}\n`);

  // Auto-open browser
  const open = require('child_process').exec;
  open(`start http://localhost:${PORT}`);
});
