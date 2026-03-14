const https = require('https');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');

// 配置
const PORT = 16666;

// SSL 证书路径
const SSL_CERT = path.join(__dirname, 'cert.pem');
const SSL_KEY = path.join(__dirname, 'key.pem');

// 检查证书文件
if (!fs.existsSync(SSL_CERT) || !fs.existsSync(SSL_KEY)) {
  console.error('❌ SSL 证书文件不存在！');
  console.error('请确保 cert.pem 和 key.pem 在服务器目录中');
  console.error('');
  console.error('可以使用以下命令生成自签名证书（仅用于测试）：');
  console.error('openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes');
  process.exit(1);
}

// SSL 选项
const sslOptions = {
  cert: fs.readFileSync(SSL_CERT),
  key: fs.readFileSync(SSL_KEY)
};

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
  '.ico': 'image/x-icon',
  '.pem': 'application/x-pem-file'
};

// HTTPS 服务器（提供静态文件）
const httpsServer = https.createServer(sslOptions, (req, res) => {
  console.log(`[${new Date().toLocaleTimeString()}] HTTP 请求：${req.url}`);
  
  let urlPath = req.url.split('?')[0];
  let filePath = path.join(__dirname, urlPath === '/' ? 'renderer.html' : urlPath);
  
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

// WebSocket 服务器（与 HTTPS 共用端口）
const wss = new WebSocketServer({ server: httpsServer, path: '/ws' });

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
httpsServer.listen(PORT, '0.0.0.0', () => {
  console.log('='.repeat(50));
  console.log('🚀 FaceMesh HTTPS 服务器已启动');
  console.log('='.repeat(50));
  console.log(`端口：${PORT}`);
  console.log('');
  console.log('⚠️  注意：使用自签名证书，浏览器会提示不安全，点击"继续访问"即可');
  console.log('');
  console.log('使用说明：');
  console.log('1. 电脑 B（面捕端）: 访问 https://localhost:16666/capture.html');
  console.log('2. 电脑 A（渲染端）: 访问 https://<电脑 B 的 IP>:16666/');
  console.log('3. 确保两台电脑在同一局域网');
  console.log('='.repeat(50));
});

process.on('SIGINT', () => {
  console.log('\n服务器关闭中...');
  wss.clients.forEach(client => client.close());
  httpsServer.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});
