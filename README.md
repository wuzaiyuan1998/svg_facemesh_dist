# 🦎 分布式 FaceMesh 面捕系统 - 六角恐龙

## 📁 目录结构

```
Separable/
├── package.json              # 项目配置
├── README.md                 # 项目说明
├── node_modules/             # npm 依赖（运行 npm install 后生成）
│
├── capture/                  # 面捕端（电脑 B 使用）
│   ├── capture-server.js     # 面捕端服务器（HTTP + WebSocket）
│   └── capture.html          # 面捕端页面（摄像头采集）
│
└── renderer/                 # 渲染端（电脑 A 使用）
    ├── renderer-server.js    # 渲染端服务器（HTTP）
    └── renderer-remote.html  # 渲染端页面（接收数据 + 动画渲染）
```

---

## 🚀 快速开始

### 1️⃣ 安装依赖

```bash
cd Separable
npm install
```

### 2️⃣ 一键启动（推荐）

**Windows 用户**可以选择以下方式：

#### 方式 A：使用 PowerShell 脚本（支持中文）

右键点击 `start-all.ps1` → "使用 PowerShell 运行"

#### 方式 B：使用 CMD 脚本（英文界面）

双击运行：
- `start-all.cmd` - 同时启动面捕端和渲染端（单电脑测试）
- `start-capture.cmd` - 只启动面捕端（电脑 B）
- `start-renderer.cmd` - 只启动渲染端（电脑 A）

### 3️⃣ 命令行启动

或者使用命令行启动：

**面捕端（电脑 B - 有摄像头）：**
```bash
npm run capture
```

**访问地址：**
- 本地：`http://localhost:16666/capture.html`
- 局域网：`http://你的 IP:16666/capture.html`

**WebSocket 地址（渲染端需要）：**
```
ws://你的 IP:16666/ws
```

---

**渲染端（电脑 A - 无摄像头）：**
```bash
npm run renderer
```

**访问地址：**
- 本地：`http://localhost:16667/`
- 局域网：`http://你的 IP:16667/`

**配置：**
在渲染端页面底部的配置框中，输入**电脑 B 的 WebSocket 地址**：
```
ws://电脑 B 的 IP:16666/ws
```

---

## 📊 使用说明

| 步骤 | 电脑 B（面捕端） | 电脑 A（渲染端） |
|------|-----------------|-----------------|
| 1 | `npm run capture` | `npm run renderer` |
| 2 | 访问 `http://IP:16666/capture.html` | 访问 `http://IP:16667/` |
| 3 | 点击"启动面捕" | 配置 WebSocket 地址 |
| 4 | 对着摄像头做表情 | 六角恐龙同步表情！ |

---

## 🔧 端口说明

| 服务 | 端口 | 协议 |
|------|------|------|
| 面捕端 HTTP | 16666 | HTTP |
| 面捕端 WebSocket | 16666 | WebSocket |
| 渲染端 HTTP | 16667 | HTTP |

---

## 📝 功能特性

- ✅ **实时面部捕捉** - 468 个面部关键点
- ✅ **分层动画** - 头部/眼睛/尾巴独立控制
- ✅ **张嘴吐泡泡** - 张嘴时触发泡泡特效
- ✅ **直播模式** - 透明背景，可用于 OBS
- ✅ **局域网同步** - 低延迟 WebSocket 通信

---

## 🎮 渲染端特性

### 吐泡泡逻辑
- **触发条件**：张嘴后闭嘴时触发
- **泡泡大小**：张嘴时间越长，泡泡越大（+ 随机系数）
- **出生位置**：从嘴巴中心位置生成
- **漂移效果**：继承上一个泡泡的漂移趋势，更自然

### 性能显示
- **渲染 FPS** - 右上角蓝色框显示
- **连接状态** - 底部显示 WebSocket 状态
- **延迟显示** - 实时显示数据传输延迟

---

## 🐛 故障排查

### 渲染端无法连接 WebSocket

1. 检查电脑 B 的面捕端服务器是否运行
2. 确认 WebSocket 地址正确（`ws://电脑 B 的 IP:16666/ws`）
3. 检查防火墙设置，确保 16666 端口开放

### 摄像头无法访问

1. 确保浏览器允许摄像头权限
2. 检查是否有其他程序占用摄像头
3. 使用 Chrome/Edge 浏览器（推荐）

### 动画不流畅

1. 检查网络延迟（应 < 50ms）
2. 查看面捕端 FPS（应 ≥ 25）
3. 确保两台电脑在同一局域网

---

## 📄 License

ISC
