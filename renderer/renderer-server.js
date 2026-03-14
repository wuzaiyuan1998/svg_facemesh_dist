/**
 * 渲染端服务器（运行在电脑 A）
 * HTTP + renderer.html
 * 连接电脑 B 的 WebSocket
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// 配置
const PORT = 16667;

// MIME 类型映射
const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// HTTP 服务器
const httpServer = http.createServer((req, res) => {
  console.log(`[${new Date().toLocaleTimeString()}] HTTP 请求：${req.url}`);
  
  let urlPath = req.url.split('?')[0];
  let filePath = path.join(__dirname, urlPath === '/' ? 'renderer-remote.html' : urlPath);
  
  const ext = path.extname(filePath);
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  
  fs.readFile(filePath, (err, content) => {
    if (err) {
      console.log(`文件不存在：${filePath}`);
      res.writeHead(404);
      res.end('File not found: ' + req.url);
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

// 启动服务器
httpServer.listen(PORT, '0.0.0.0', () => {
  // 获取本机 IP
  const os = require('os');
  const interfaces = os.networkInterfaces();
  let localIP = 'localhost';
  for (let iface of Object.values(interfaces)) {
    if (!iface) continue;
    for (let config of iface) {
      if (config.family === 'IPv4' && !config.internal) {
        localIP = config.address;
        break;
      }
    }
  }
  
  console.log('='.repeat(60));
  console.log('🦎 渲染端服务器已启动（电脑 A）');
  console.log('='.repeat(60));
  console.log(`端口：${PORT} (HTTP)`);
  console.log('');
  console.log('访问地址：');
  console.log(`  本地：http://localhost:${PORT}/`);
  console.log(`  局域网：http://${localIP}:${PORT}/`);
  console.log('');
  console.log('⚠️  使用前请确保：');
  console.log('  1. 电脑 B（面捕端）服务器已启动');
  console.log('  2. 在 renderer-remote.html 中配置正确的电脑 B 地址');
  console.log('='.repeat(60));
});

process.on('SIGINT', () => {
  console.log('\n服务器关闭中...');
  httpServer.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});
