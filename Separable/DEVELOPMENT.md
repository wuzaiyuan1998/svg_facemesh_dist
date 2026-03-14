# FaceMesh 分布式面捕系统 - 二次开发文档

## 📋 项目概述

这是一个基于 MediaPipe FaceMesh 的分布式面部捕捉系统，支持面捕端和渲染端分离部署。

### 技术栈

- **前端**: HTML5 + JavaScript + SVG
- **面部识别**: MediaPipe FaceMesh
- **通信**: WebSocket (ws://)
- **后端**: Node.js + ws 库
- **渲染**: SVG 动画

### 架构设计

```
┌─────────────────────────────────────────────────────────────┐
│                      电脑 B（面捕端）                        │
│  ┌──────────────┐      ┌──────────────┐      ┌───────────┐ │
│  │ capture.html │ ────▶│ capture-     │ ◀───▶│ WebSocket │ │
│  │ (摄像头采集) │      │ server.js    │      │  :16666   │ │
│  └──────────────┘      └──────────────┘      └─────┬─────┘ │
│         ▲                                           │       │
│         │ HTTP:16666                                │ WS    │
└─────────┴───────────────────────────────────────────┼───────┘
                                                      │
                                                      │ ws://
                                                      ▼
┌─────────────────────────────────────────────────────────────┐
│                      电脑 A（OBS 渲染端）                     │
│  ┌──────────────┐      ┌──────────────┐                     │
│  │ OBS 浏览器源  │ ◀───│ renderer-    │                     │
│  │              │      │ server.js    │                     │
│  └──────────────┘      └──────────────┘                     │
│         ▲                   ▲                                │
│         │ HTTP:16667        │                                │
└─────────┴───────────────────┴────────────────────────────────┘
```

---

## 📁 文件结构

```
svg_facemesh_dist/
├── DEVELOPMENT.md          # 二次开发文档（本文件）
├── README.md               # 使用文档
├── package.json            # Node.js 依赖配置
│
├── capture-server.js       # 面捕端服务器（HTTPS/HTTP + WebSocket）
├── capture.html            # 面捕端页面（摄像头采集 + FaceMesh）
│
├── renderer-server.js      # 渲染端服务器（HTTP）
├── renderer-remote.html    # 渲染端页面（OBS 浏览器源）
│
├── server.js               # 【已废弃】单服务器版本
├── renderer.html           # 【已废弃】旧版渲染端
├── cert.pem                # SSL 证书（可选，HTTP 模式不需要）
└── key.pem                 # SSL 私钥（可选，HTTP 模式不需要）
```

---

## 🔧 核心模块说明

### 1. capture-server.js（面捕端服务器）

**功能**：
- HTTP 服务器：提供 `capture.html` 页面
- WebSocket 服务器：接收面捕数据并转发给渲染端

**关键代码**：
```javascript
// WebSocket 消息处理
wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    const data = JSON.parse(message);
    
    if (data.type === 'facemesh') {
      // 接收面捕数据并广播给渲染端
      rendererClients.forEach(client => {
        client.send(message);
      });
    }
  });
});
```

**配置项**：
```javascript
const PORT = 16666;  // HTTP 和 WebSocket 共用端口
```

---

### 2. capture.html（面捕端页面）

**功能**：
- 访问摄像头
- MediaPipe FaceMesh 识别面部 468 个关键点
- 通过 WebSocket 发送数据到服务器

**核心流程**：
```
摄像头视频流 → FaceMesh 识别 → 提取关键点 → WebSocket 发送
```

**关键代码**：
```javascript
// 发送面捕数据
function sendFaceMeshData(results) {
  const data = {
    type: 'facemesh',
    timestamp: Date.now(),
    landmarks: results.multiFaceLandmarks[0].map(lm => ({
      x: lm.x,
      y: lm.y,
      z: lm.z
    }))
  };
  ws.send(JSON.stringify(data));
}
```

**可配置项**：
```javascript
const WS_URL = `ws://${window.location.hostname}:16666/ws`;
const VIDEO_WIDTH = 640;   // 摄像头分辨率
const VIDEO_HEIGHT = 480;
```

---

### 3. renderer-server.js（渲染端服务器）

**功能**：
- HTTP 服务器：提供 `renderer-remote.html` 页面
- 不需要 WebSocket（渲染端主动连接面捕端服务器）

**配置项**：
```javascript
const PORT = 16667;  // HTTP 端口
```

---

### 4. renderer-remote.html（渲染端页面）

**功能**：
- 连接面捕端 WebSocket 服务器
- 接收面部关键点数据
- 驱动 SVG 六角恐龙动画

**动画映射**：

| 面部动作 | 关键点 | 动画效果 |
|----------|--------|----------|
| 头部旋转 | 鼻子 + 脸颊 | SVG 平移 + 旋转 |
| 眨眼 | 上下眼睑 | 眼睛缩放 |
| 张嘴 | 上下唇 | 嘴巴路径变形 |
| 尾巴摆动 | 时间函数 | 周期性旋转 |

**关键代码**：
```javascript
// 更新动画
function updateAnimation(landmarks) {
  // 计算头部旋转
  const noseTip = landmarks[1];
  const headX = (noseTip.y - 0.5) * 0.3;
  const headY = (noseTip.x - 0.5) * 0.3;
  
  // 应用变换
  layerHead.setAttribute('transform', 
    `translate(${headY * 100}, ${headX * 100})`);
  
  // 计算眨眼
  const leftEyeTop = landmarks[159];
  const leftEyeBottom = landmarks[145];
  const leftEyeOpen = 1 - Math.abs(leftEyeTop.y - leftEyeBottom.y) * 3;
  eyeLeft.setAttribute('transform', `scale(1, ${leftEyeOpen})`);
}
```

---

## 🎨 自定义角色

### 修改 SVG 角色

编辑 `renderer-remote.html` 中的 SVG 部分：

```html
<svg id="character" viewBox="0 0 800 800">
  <!-- 在这里修改你的角色 -->
  <g id="layer-head">...</g>
  <g id="layer-eyes">...</g>
  <path id="mouth" .../>
</svg>
```

### 添加新的动画部位

1. **在 SVG 中添加元素**：
```html
<g id="layer-eyebrow">...</g>
```

2. **在 JavaScript 中获取引用**：
```javascript
const layerEyebrow = document.getElementById('layer-eyebrow');
```

3. **在 updateAnimation 中添加逻辑**：
```javascript
// 眉毛上扬（基于额头关键点）
const forehead = landmarks[10];
const eyebrowRaise = (forehead.y - 0.3) * 50;
layerEyebrow.setAttribute('transform', `translate(0, ${eyebrowRaise})`);
```

---

## 📡 通信协议

### WebSocket 消息格式

**面捕端 → 服务器**：
```json
{
  "type": "facemesh",
  "timestamp": 1710378000123,
  "landmarks": [
    { "x": 0.5, "y": 0.3, "z": 0.1 },
    { "x": 0.51, "y": 0.31, "z": 0.12 },
    ...
  ]
}
```

**渲染端 → 服务器**：
```json
{
  "type": "register_renderer"
}
```

---

## 🔌 API 扩展

### 添加新的消息类型

1. **在 capture.html 中发送**：
```javascript
ws.send(JSON.stringify({
  type: 'custom_event',
  data: { ... }
}));
```

2. **在 capture-server.js 中处理**：
```javascript
if (data.type === 'custom_event') {
  // 处理自定义事件
}
```

3. **在 renderer-remote.html 中接收**：
```javascript
if (data.type === 'custom_event') {
  // 处理自定义事件
}
```

---

## 🐛 调试技巧

### 1. 查看服务器日志

```bash
# 服务器运行时会输出连接信息
[02:00:26] WebSocket 新连接：192.168.1.200
[02:00:27] 渲染端注册，当前渲染端数量：1
```

### 2. 浏览器控制台

- 面捕端：`http://localhost:16666/capture.html` 按 F12
- 渲染端：OBS 浏览器源右键 → 交互

### 3. 网络调试

```bash
# 检查端口是否监听
netstat -tlnp | grep 16666
netstat -tlnp | grep 16667

# 测试 WebSocket 连接
curl -i http://localhost:16666/capture.html
```

---

## 🚀 性能优化

### 1. 降低数据传输量

只传输必要的关键点（而不是全部 468 个）：

```javascript
// 只传输关键点位
const keyPoints = {
  nose: landmarks[1],
  leftEye: landmarks[159],
  rightEye: landmarks[386],
  mouth: landmarks[13]
};
```

### 2. 降低摄像头分辨率

```javascript
const VIDEO_WIDTH = 320;   // 从 640 降到 320
const VIDEO_HEIGHT = 240;  // 从 480 降到 240
```

### 3. 限制帧率

```javascript
let lastSendTime = 0;
const FPS_LIMIT = 30;

if (Date.now() - lastSendTime > 1000 / FPS_LIMIT) {
  sendFaceMeshData(results);
  lastSendTime = Date.now();
}
```

---

## 📦 依赖说明

### Node.js 依赖

```json
{
  "dependencies": {
    "ws": "^8.14.2"
  }
}
```

### 前端 CDN 依赖

- MediaPipe Camera Utils
- MediaPipe FaceMesh
- MediaPipe Drawing Utils

这些通过 CDN 自动加载，不需要本地安装。

---

## 🔐 安全考虑

### HTTP vs HTTPS

| 场景 | 推荐协议 | 原因 |
|------|----------|------|
| 本地测试（localhost） | HTTP | 浏览器允许摄像头 |
| 局域网部署 | HTTP | OBS 浏览器源不支持 WSS |
| 公网部署 | HTTPS | 安全传输 |

### 防火墙配置

```bash
# Ubuntu/Debian
sudo ufw allow 16666/tcp
sudo ufw allow 16667/tcp

# Windows
# 在"高级安全 Windows Defender 防火墙"添加入站规则
```

---

## 📝 开发清单

### 添加新功能

- [ ] 更新 `capture.html`（数据采集）
- [ ] 更新 `capture-server.js`（消息处理）
- [ ] 更新 `renderer-remote.html`（动画/显示）

### 测试清单

- [ ] 面捕端摄像头权限
- [ ] WebSocket 连接稳定性
- [ ] 渲染端动画流畅度
- [ ] 跨网络延迟测试

---

## 📞 常见问题

### Q: 如何添加更多表情？

A: 在 `updateAnimation` 函数中添加更多关键点映射逻辑。

### Q: 如何支持多人脸？

A: 修改 `capture.html` 中的 `maxNumFaces` 选项，并在服务器端区分不同用户。

### Q: 如何录制面捕数据？

A: 在 `capture-server.js` 的 WebSocket 消息处理中添加文件写入逻辑。

---

## 📄 License

ISC
