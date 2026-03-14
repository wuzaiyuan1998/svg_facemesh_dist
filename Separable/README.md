# 🦎 分布式 FaceMesh 面捕系统（双服务器版）

## 📚 文档索引

| 文档 | 说明 | 适合人群 |
|------|------|----------|
| **[QUICKSTART.md](QUICKSTART.md)** | 🚀 快速部署指南（5 分钟上手） | 新手用户 |
| **[USAGE.md](USAGE.md)** | 📖 详细使用文档（故障排查/配置） | 普通用户 |
| **[DEVELOPMENT.md](DEVELOPMENT.md)** | 🔧 二次开发文档（架构/API） | 开发者 |
| **README.md** | 📋 项目概述和架构说明 | 所有人 |

---

## 项目说明

这个项目实现了**分布式面部捕捉**功能，采用双服务器架构：

- **电脑 B**（有摄像头）：运行面捕端服务器（HTTPS + WebSocket）
- **电脑 A**（无摄像头）：运行渲染端服务器（HTTP），接收数据并驱动动画

## 架构示意

```
┌─────────────────┐                          ┌─────────────────┐
│   电脑 B        │                          │   电脑 A        │
│  (面捕端)       │                          │  (渲染端)       │
│                 │                          │                 │
│  capture-server │                          │ renderer-server │
│  HTTPS:16666    │                          │ HTTP:16667      │
│  WebSocket:16666│◄───── WebSocket ─────────│                 │
│                 │                          │                 │
│  capture.html   │                          │renderer-remote  │
│  (摄像头采集)   │                          │ (动画渲染)      │
└─────────────────┘                          └─────────────────┘
```

## 文件结构

```
svg_facemesh_dist/
├── capture-server.js      # 面捕端服务器（电脑 B 使用）
├── renderer-server.js     # 渲染端服务器（电脑 A 使用）
├── capture.html           # 面捕端页面
├── renderer-remote.html   # 渲染端页面（连接远程 WebSocket）
├── renderer.html          # 渲染端页面（单服务器版，兼容旧版）
├── server.js              # 单服务器版（已废弃）
├── package.json           # Node.js 依赖配置
├── cert.pem               # SSL 证书（自动生成）
└── key.pem                # SSL 私钥（自动生成）
```

## 快速开始

### 1️⃣ 在电脑 B 上（有摄像头）

```bash
# 进入项目目录
cd /path/to/svg_facemesh_dist

# 安装依赖（只需要一次）
npm install

# 启动面捕端服务器
npm run capture
```

服务器启动后会显示：
```
🎭 面捕端服务器已启动（电脑 B）
端口：16666 (HTTPS)

访问地址：
  本地：https://localhost:16666/capture.html
  局域网：https://192.168.1.100:16666/capture.html

WebSocket 地址（渲染端需要）：
  wss://192.168.1.100:16666/ws
```

**记下电脑 B 的 IP 地址**（例如：`192.168.1.100`）

### 2️⃣ 在电脑 B 上访问面捕端

打开浏览器访问：
```
https://localhost:16666/capture.html
```

⚠️ **第一次访问会提示证书不安全**，点击"高级" → "继续访问"即可。

点击"🚀 启动面捕"，允许摄像头权限。

### 3️⃣ 在电脑 A 上（无摄像头）

```bash
# 进入项目目录（可以复制整个文件夹到电脑 A）
cd /path/to/svg_facemesh_dist

# 安装依赖
npm install

# 启动渲染端服务器
npm run renderer
```

服务器启动后会显示：
```
🦎 渲染端服务器已启动（电脑 A）
端口：16667 (HTTP)

访问地址：
  本地：http://localhost:16667/
  局域网：http://192.168.1.101:16667/
```

### 4️⃣ 配置渲染端连接电脑 B

打开浏览器访问：
```
http://localhost:16667/
```

在页面底部的配置框中，输入**电脑 B 的 WebSocket 地址**：
```
wss://192.168.1.100:16666/ws
```

点击"💾 保存并重新连接"，连接成功后六角恐龙会同步电脑 B 的面部表情！

## 使用说明

| 步骤 | 电脑 B（面捕端） | 电脑 A（渲染端） |
|------|-----------------|-----------------|
| 1 | `npm run capture` | `npm run renderer` |
| 2 | 访问 `https://localhost:16666/capture.html` | 访问 `http://localhost:16667/` |
| 3 | 点击"启动面捕" | 配置 WebSocket 地址 |
| 4 | 对着摄像头做表情 | 六角恐龙同步你的表情！ |

## 技术细节

### 通信协议

- **面捕端端口**: 16666 (HTTPS + WebSocket)
- **渲染端端口**: 16667 (HTTP)
- **数据格式**: JSON
  ```json
  {
    "type": "facemesh",
    "timestamp": 1710378000123,
    "landmarks": [{ "x": 0.5, "y": 0.3, "z": 0.1 }, ...]
  }
  ```

### 网络要求

- 两台电脑必须在**同一局域网**
- 确保防火墙允许 16666 和 16667 端口
- 渲染端需要能访问面捕端的 WebSocket 地址

### 延迟优化

- 局域网延迟：< 50ms
- 只传输关键点数据（468 个点 × 3 坐标）
- 实时 WebSocket 双向通信

## 故障排查

### 渲染端无法连接 WebSocket

1. 检查电脑 B 的面捕端服务器是否运行
2. 确认 WebSocket 地址正确（`wss://电脑 B 的 IP:16666/ws`）
3. 检查防火墙设置：
   ```bash
   # Ubuntu/Debian
   sudo ufw allow 16666/tcp
   sudo ufw allow 16667/tcp
   ```

### 摄像头无法访问

1. 确保使用 HTTPS 访问（`https://`）
2. 浏览器允许摄像头权限
3. 检查是否有其他程序占用摄像头

### 动画不流畅

1. 检查网络延迟
2. 查看面捕端 FPS 显示（左上角）
3. 降低摄像头分辨率（修改 capture.html 中的 VIDEO_WIDTH/HEIGHT）

## 旧版兼容

如果只想在单台电脑上运行（面捕 + 渲染在一起），可以使用旧版：

```bash
node server.js
```

- 面捕端：`https://localhost:16666/capture.html`
- 渲染端：`http://localhost:16666/`

## License

ISC
