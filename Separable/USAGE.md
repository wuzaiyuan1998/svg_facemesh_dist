# FaceMesh 分布式面捕系统 - 使用文档

## 📖 快速开始

### 系统要求

| 组件 | 要求 |
|------|------|
| **电脑 B（面捕端）** | Node.js 16+, 摄像头，Chrome/Edge 浏览器 |
| **电脑 A（OBS 端）** | Node.js 16+, OBS Studio 28+ |
| **网络** | 两台电脑在同一局域网 |

---

## 🚀 部署步骤

### 步骤 1：准备项目文件

将 `svg_facemesh_dist` 文件夹复制到电脑 B：

```bash
# 方法 1：使用 scp
scp -r svg_facemesh_dist/ user@电脑B:/home/user/

# 方法 2：使用 U 盘拷贝
# 直接复制整个文件夹

# 方法 3：使用 git
git clone <你的仓库地址>
```

### 步骤 2：安装依赖（电脑 B）

```bash
cd svg_facemesh_dist
npm install
```

### 步骤 3：启动服务（电脑 B）

**启动面捕端服务器**（端口 16666）：
```bash
npm run capture
```

**启动渲染端服务器**（端口 16667）：
```bash
npm run renderer
```

看到以下输出表示成功：
```
🎭 面捕端服务器已启动（电脑 B）
端口：16666 (HTTP)
访问地址：http://localhost:16666/capture.html

🦎 渲染端服务器已启动（电脑 A）
端口：16667 (HTTP)
访问地址：http://localhost:16667/
```

### 步骤 4：配置面捕端（电脑 B）

1. 打开 Chrome 浏览器
2. 访问：`http://localhost:16666/capture.html`
3. 点击 "🚀 启动面捕" 按钮
4. 浏览器弹窗询问摄像头权限 → 点击 "**允许**"
5. 看到摄像头画面和 FPS 显示表示成功

**🔥 性能提示：**
- 左上角 FPS 应显示 **≥ 25**
- 如果 FPS < 20，请查看 [DEBUG.md](DEBUG.md) 排查指南
- 默认已关闭网格绘制（调试模式），如需启用请修改 `DEBUG_MODE = true`
- 默认分辨率：320x240（性能优先）

---

## 🧪 性能测试

如果面捕端 FPS 低于预期，请使用测试页面诊断：

1. 访问：`http://localhost:16666/test-performance.html`
2. 点击"启动"开始测试
3. 观察 FPS、发送速率、数据大小

**正常值：**
- FPS: ≥ 25
- 发送/秒：≈ 30
- 数据大小：≈ 14 KB

### 步骤 5：配置 OBS（电脑 A）

1. 打开 OBS Studio
2. 在"来源"区域点击 "+" 按钮
3. 选择 "浏览器"
4. 命名来源（如 "FaceMesh 渲染"）
5. 填写设置：

| 设置项 | 值 |
|--------|-----|
| **URL** | `http://电脑 B 的 IP:16667/` |
| **宽度** | `1920` |
| **高度** | `1080` |
| **关闭时刷新** | ✅ 勾选 |
| **控制音频** | ❌ 不勾选 |

6. 点击 "确定"

### 步骤 6：测试效果

1. 对着电脑 B 的摄像头做表情
2. 观察电脑 A 的 OBS 中六角恐龙是否同步动作
3. 调整 OBS 浏览器源的位置和大小

---

## 🖥️ 使用场景

### 场景 1：单电脑测试（开发调试）

**所有服务在同一台电脑：**

1. 启动两个服务：
   ```bash
   npm run capture
   npm run renderer
   ```

2. 打开 Chrome 访问面捕端：
   ```
   http://localhost:16666/capture.html
   ```

3. 打开另一个 Chrome 标签访问渲染端：
   ```
   http://localhost:16667/
   ```

4. 测试效果

---

### 场景 2：双电脑部署（生产环境）

**电脑 B（面捕端）：**
- 运行 `npm run capture` 和 `npm run renderer`
- Chrome 访问 `http://localhost:16666/capture.html`
- 保持运行在后台

**电脑 A（OBS 端）：**
- OBS 浏览器源访问 `http://电脑B 的 IP:16667/`
- 用于直播或录制

---

### 场景 3：直播推流

**完整直播工作流：**

```
电脑 B（面捕端）                    电脑 A（直播推流）
┌─────────────┐                   ┌─────────────┐
│  摄像头     │                   │   OBS       │
│    ↓        │                   │   ↓         │
│  FaceMesh   │───── WebSocket ──▶│  浏览器源    │
│    ↓        │                   │    ↓        │
│  后台运行   │                   │  场景合成    │
│             │                   │    ↓        │
│             │                   │  推流到平台  │
└─────────────┘                   └─────────────┘
```

**OBS 场景建议：**

1. 添加 FaceMesh 浏览器源
2. 添加游戏捕获/窗口捕获
3. 添加摄像头（可选）
4. 添加麦克风音频
5. 调整图层顺序
6. 设置推流地址

---

## ⚙️ 配置选项

### 修改 WebSocket 地址

如果渲染端无法自动连接，可以在页面底部手动配置：

1. 访问渲染端页面：`http://电脑B 的 IP:16667/`
2. 在底部配置框输入 WebSocket 地址：
   ```
   ws://电脑B 的 IP:16666/ws
   ```
3. 点击 "💾 保存并重新连接"

配置会自动保存到浏览器 localStorage。

---

### 修改摄像头分辨率

编辑 `capture.html`：

```javascript
const VIDEO_WIDTH = 640;   // 改为 320 降低带宽
const VIDEO_HEIGHT = 480;  // 改为 240
```

---

### 修改动画灵敏度

编辑 `renderer-remote.html` 中的 `updateAnimation` 函数：

```javascript
// 头部旋转灵敏度（默认 0.3）
const headX = (noseTip.y - 0.5) * 0.3;  // 改为 0.5 更灵敏

// 眨眼灵敏度（默认 3）
const leftEyeOpen = 1 - Math.abs(leftEyeTop.y - leftEyeBottom.y) * 3;  // 改为 2 更敏感

// 嘴巴开合灵敏度（默认 2）
const mouthOpen = Math.abs(mouthTop.y - mouthBottom.y) * 2;  // 改为 3 更夸张
```

---

## 🔧 故障排查

### 问题 1：面捕端无法访问摄像头

**错误信息**：`Cannot read properties of undefined (reading 'getUserMedia')`

**解决方案**：
1. 确保使用 **localhost** 访问：`http://localhost:16666/capture.html`
2. 不要用 IP 地址访问面捕端（浏览器限制）
3. 检查浏览器是否允许摄像头权限
4. 关闭其他占用摄像头的程序

---

### 问题 2：OBS 浏览器源显示空白

**可能原因**：
1. URL 地址错误
2. 网络不通
3. 防火墙阻止

**解决方案**：
1. 检查 URL 格式：`http://电脑B 的 IP:16667/`
2. 在电脑 A 的浏览器中测试访问：`http://电脑B 的 IP:16667/`
3. 检查电脑 B 的防火墙设置

**Windows 防火墙配置**：
```
控制面板 → Windows Defender 防火墙 → 高级设置
→ 入站规则 → 新建规则
→ 端口 → TCP → 16666, 16667 → 允许连接
```

**Linux 防火墙配置**：
```bash
sudo ufw allow 16666/tcp
sudo ufw allow 16667/tcp
```

---

### 问题 3：动画不同步或延迟高

**可能原因**：
1. 网络延迟
2. 帧率过低
3. 数据传输量大

**解决方案**：
1. 确保两台电脑在同一局域网（最好有线连接）
2. 降低摄像头分辨率（见配置选项）
3. 检查服务器日志中的连接状态

---

### 问题 4：OBS 浏览器源无法连接 WebSocket

**错误信息**：控制台显示连接失败

**解决方案**：
1. 确认面捕端服务器正在运行
2. 检查 WebSocket 地址配置
3. OBS 浏览器源只支持 **WS**，不支持 WSS
4. 确保使用 HTTP 而不是 HTTPS

---

### 问题 5：动画卡顿

**解决方案**：
1. 降低摄像头分辨率：
   ```javascript
   const VIDEO_WIDTH = 320;
   const VIDEO_HEIGHT = 240;
   ```

2. 限制帧率（在 `capture.html` 中）：
   ```javascript
   const FPS_LIMIT = 30;  // 改为 20 或 15
   ```

3. 简化 SVG 动画（减少节点数量）

---

## 📊 性能参考

| 配置 | 分辨率 | 帧率 | 延迟 | 适用场景 |
|------|--------|------|------|----------|
| 高质量 | 640x480 | 30 FPS | <50ms | 有线局域网 |
| 标准 | 320x240 | 30 FPS | <100ms | 无线局域网 |
| 低带宽 | 320x240 | 15 FPS | <200ms | 跨网络 |

---

## 🎯 最佳实践

### 1. 网络配置

- ✅ 使用有线网络连接（更稳定）
- ✅ 两台电脑在同一子网
- ✅ 关闭不必要的后台程序

### 2. 摄像头设置

- ✅ 保证充足光线
- ✅ 摄像头正对面部
- ✅ 避免强烈背光

### 3. OBS 设置

- ✅ 浏览器源刷新率：60 FPS
- ✅ 关闭 "控制音频"（不需要）
- ✅ 勾选 "关闭时刷新"

### 4. 服务管理

```bash
# 使用 screen 后台运行（Linux）
screen -S facemesh-capture
npm run capture

screen -S facemesh-renderer
npm run renderer

# 使用 Ctrl+A, D 退出 screen
# 使用 screen -r 恢复
```

---

## 📝 常用命令

### 启动服务

```bash
# 面捕端
npm run capture

# 渲染端
npm run renderer

# 同时启动两个服务（需要两个终端）
```

### 查看运行状态

```bash
# 检查端口监听
netstat -tlnp | grep 16666
netstat -tlnp | grep 16667

# 检查进程
ps aux | grep node
```

### 停止服务

```bash
# Ctrl+C 停止当前服务

# 或强制停止所有 node 服务
pkill -f "node.*server"
```

---

## 🆘 获取帮助

### 查看日志

**服务器日志**：
```
[02:00:26] WebSocket 新连接：192.168.1.200
[02:00:27] 渲染端注册，当前渲染端数量：1
```

**浏览器控制台**：
- 面捕端：F12 → Console
- 渲染端：OBS 浏览器源右键 → 交互 → F12

### 测试连接

```bash
# 测试面捕端 HTTP
curl http://localhost:16666/capture.html

# 测试渲染端 HTTP
curl http://localhost:16667/
```

---

## 📄 License

ISC

---

## 🎉 开始使用

现在你已经了解了所有使用方法，开始享受面部捕捉的乐趣吧！🦎

如有问题，请参考故障排查部分或查看 `DEVELOPMENT.md` 了解更多技术细节。
