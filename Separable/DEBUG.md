# 🧪 性能诊断指南

## FPS 只有 10 帧？逐步排查

### 步骤 1：检查面捕端配置

打开 `capture.html`，确认以下配置：

```javascript
const VIDEO_WIDTH = 320;   // ✅ 低分辨率
const VIDEO_HEIGHT = 240;
const DEBUG_MODE = false;  // ✅ 关闭网格绘制
```

### 步骤 2：检查浏览器性能

1. 打开 Chrome DevTools（F12）
2. 切换到 **Performance** 标签
3. 点击录制，然后启动面捕
4. 录制 10 秒后停止
5. 查看：
   - **CPU 占用**：是否 > 80%？
   - **Green 帧**：绿色帧占比多少？
   - **FaceMesh.send()**：耗时多少？

### 步骤 3：检查 MediaPipe 版本

确认使用的是最新版 MediaPipe：

```html
<script src="https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js"></script>
```

如果 CDN 慢，可以尝试：
```html
<script src="https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task"></script>
```

### 步骤 4：检查 WebSocket 连接

在面捕端控制台输入：

```javascript
// 检查 WebSocket 状态
console.log('WebSocket 状态:', ws.readyState);
console.log('发送数据大小:', JSON.stringify({landmarks: Array(468).fill({x:0.5,y:0.5,z:0})}).length);
```

如果 `readyState !== 1`，说明连接未建立。

### 步骤 5：降低计算负载

**临时方案 1**：关闭渲染端
```bash
# 停止渲染端服务器
# 只运行面捕端，测试纯采集 FPS
```

**临时方案 2**：降低渲染质量
```javascript
// 在 renderer-remote.html 中
// 减少平滑滤波计算
const smoothingFactor = 0.5;  // 从 0.3 提高到 0.5
```

---

## 常见性能问题

### 问题 1：CPU 占用 100%

**原因**：`requestAnimationFrame` 无限循环

**解决**：
```javascript
// 已优化：使用异步发送，不阻塞
function processFrame() {
    if (!isRunning) return;
    faceMesh.send({ image: video }).catch(err => console.error(err));
    requestAnimationFrame(processFrame);
}
```

### 问题 2：Canvas 绘制太慢

**原因**：`drawConnectors` 绘制 468 个点的连线

**解决**：
```javascript
// 已优化：只在 DEBUG_MODE=true 时绘制
if (window.DEBUG_MODE) {
    drawConnectors(...);
}
```

### 问题 3：WebSocket 发送阻塞

**原因**：每帧都发送，没有限流

**解决**：
```javascript
// 已优化：限制 30 FPS
const SEND_INTERVAL = 1000 / 30;
if (now - lastSendTime < SEND_INTERVAL) return;
```

### 问题 4：摄像头分辨率太高

**原因**：640x480 或更高分辨率

**解决**：
```javascript
// 已优化：使用 320x240
const VIDEO_WIDTH = 320;
const VIDEO_HEIGHT = 240;
```

---

## 性能基准

### 正常情况

| 配置 | FPS | CPU |
|------|-----|-----|
| i5-8400, 320x240 | 30+ | 40-50% |
| i5-8400, 640x480 | 25-30 | 60-70% |
| i3-10100, 320x240 | 25-30 | 50-60% |

### 异常情况

| FPS | CPU | 可能原因 |
|-----|-----|---------|
| 10 | 100% | CPU 太弱/分辨率太高 |
| 10 | 50% | MediaPipe 模型问题 |
| 10 | 30% | WebSocket 阻塞 |

---

## 快速修复

### 如果 FPS < 20

1. **降低分辨率**
```javascript
const VIDEO_WIDTH = 160;  // 极限低分辨率
const VIDEO_HEIGHT = 120;
```

2. **关闭 refineLandmarks**（牺牲虹膜追踪）
```javascript
refineLandmarks: false
```

3. **降低检测频率**
```javascript
// 每 2 帧发送一次
let frameSkip = 0;
function processFrame() {
    frameSkip++;
    if (frameSkip % 2 === 0) {
        faceMesh.send({ image: video });
    }
    requestAnimationFrame(processFrame);
}
```

---

## 最终测试

启动面捕端后，在控制台输入：

```javascript
// 实时打印 FPS
setInterval(() => {
    console.log('当前 FPS:', document.getElementById('fps').textContent);
}, 5000);
```

**预期结果**：
- FPS ≥ 25：✅ 正常
- FPS 15-24：⚠️ 可接受
- FPS < 15：❌ 需要优化

---

## 联系支持

如果以上方法都无效，请提供：
1. CPU 型号
2. 浏览器版本
3. DevTools Performance 截图
4. 控制台错误信息
