const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const NOVEL_DIR = path.join(__dirname, '../novel');

const server = http.createServer((req, res) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  
  // 设置 CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  
  // 提供 index.html
  if (req.url === '/' || req.url === '/index.html') {
    fs.readFile(path.join(__dirname, 'index.html'), 'utf8', (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end('Error loading index.html');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(data);
    });
    return;
  }
  
  // API: 获取文件列表
  if (req.url === '/api/files') {
    fs.readdir(NOVEL_DIR, (err, files) => {
      if (err) {
        res.writeHead(500);
        res.end(JSON.stringify({ error: 'Failed to read directory' }));
        return;
      }
      // 只返回 .md 文件
      const mdFiles = files.filter(f => f.endsWith('.md')).sort();
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ files: mdFiles }));
    });
    return;
  }
  
  // API: 获取文件内容
  if (req.url.startsWith('/api/file?name=')) {
    const fileName = decodeURIComponent(req.url.split('?name=')[1]);
    const filePath = path.join(NOVEL_DIR, fileName);
    
    // 安全检查：确保文件在 novel 目录内
    if (!filePath.startsWith(NOVEL_DIR)) {
      res.writeHead(403);
      res.end(JSON.stringify({ error: 'Access denied' }));
      return;
    }
    
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'File not found' }));
        return;
      }
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ content: data }));
    });
    return;
  }
  
  // 404
  res.writeHead(404);
  res.end('Not Found');
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});

