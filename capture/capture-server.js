/**
 * 面捕端服务器（运行在电脑 B）
 * HTTP + WebSocket + capture.html
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');

// 配置
const PORT = 16666;

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
  let filePath = path.join(__dirname, urlPath === '/' ? 'capture.html' : urlPath);
  
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

// WebSocket 服务器
const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

let captureClient = null;
let rendererClients = [];

wss.on('connection', (ws, req) => {
  const ip = req.socket.remoteAddress;
  console.log(`[${new Date().toLocaleTimeString()}] WebSocket 新连接：${ip}`);
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      if (data.type === 'facemesh') {
        captureClient = ws;
        // 广播给所有渲染端
        rendererClients.forEach(client => {
          if (client.readyState === 1) {
            client.send(message);
          }
        });
      }
      else if (data.type === 'register_renderer') {
        if (!rendererClients.includes(ws)) {
          rendererClients.push(ws);
          console.log(`[${new Date().toLocaleTimeString()}] 渲染端注册，当前渲染端数量：${rendererClients.length}`);
        }
      }
      else if (data.type === 'register_capture') {
        captureClient = ws;
        console.log(`[${new Date().toLocaleTimeString()}] 面捕端注册`);
      }
    } catch (e) {
      console.error('消息解析错误:', e);
    }
  });
  
  ws.on('close', () => {
    if (captureClient === ws) {
      captureClient = null;
      console.log(`[${new Date().toLocaleTimeString()}] 面捕端断开`);
    }
    const idx = rendererClients.indexOf(ws);
    if (idx > -1) {
      rendererClients.splice(idx, 1);
      console.log(`[${new Date().toLocaleTimeString()}] 渲染端断开，当前渲染端数量：${rendererClients.length}`);
    }
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket 错误:', error);
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
  console.log('🎭 面捕端服务器已启动（电脑 B）');
  console.log('='.repeat(60));
  console.log(`端口：${PORT} (HTTP)`);
  console.log('');
  console.log('访问地址：');
  console.log(`  本地：http://localhost:${PORT}/capture.html`);
  console.log(`  局域网：http://${localIP}:${PORT}/capture.html`);
  console.log('');
  console.log('⚠️  注意：HTTP 模式下摄像头可能需要用户手动允许');
  console.log('');
  console.log('WebSocket 地址（渲染端需要）：');
  console.log(`  ws://${localIP}:${PORT}/ws`);
  console.log('='.repeat(60));
});

process.on('SIGINT', () => {
  console.log('\n服务器关闭中...');
  wss.clients.forEach(client => client.close());
  httpServer.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});
