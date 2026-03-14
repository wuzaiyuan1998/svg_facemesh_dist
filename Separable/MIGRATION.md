# 🦎 六角恐龙模型移植说明

## 概述

已将 `liujiao-facemesh-tasks-dev.html` 中的完整六角恐龙模型和渲染逻辑移植到分布式渲染端 `Separable/renderer-remote.html`。

---

## 移植内容

### 1️⃣ SVG 模型结构

完整移植了分层 SVG 结构：

| 图层 | 元素 | 功能 |
|------|------|------|
| `layer-body-group` | 身体组 | 整体平移 + 缩放 |
| `layer-tail` | 尾巴 | 独立摆动动画 |
| `layer-head` | 头部 | 相对平移 |
| `head-spots` | 头部斑点 | 装饰 |
| `layer-gills` | 外鳃 | 独立摆动 |
| `layer-eyes` | 眼睛 | 眼眶平移 + 瞳孔追踪 + 眨眼 |
| `layer-blush` | 腮红 | 独立动捕 |
| `layer-belly` | 腹部 | 装饰 |
| `layer-mouth` | 嘴巴 | 张嘴/微笑变形 |
| `layer-limbs` | 四肢 | 装饰 |
| `bubble-container` | 泡泡 | 吐泡泡特效 |

### 2️⃣ 渲染逻辑

#### 核心功能移植

| 功能 | 原模型 | 移植后 | 状态 |
|------|--------|--------|------|
| 身体组平移缩放 | ✅ | ✅ | 完成 |
| 头部相对平移 | ✅ | ✅ | 完成 |
| 腮红独立追踪 | ✅ | ✅ | 完成 |
| 外鳃摆动 | ✅ | ✅ | 完成 |
| 眼睛眼眶平移 | ✅ | ✅ | 完成 |
| 瞳孔追踪 | ✅ | ✅ | 完成 |
| 眨眼检测 | ✅ | ✅ | 完成 |
| 瞳孔缩放 (惊讶) | ✅ | ✅ | 完成 |
| 高光跟随 | ✅ | ✅ | 完成 |
| 嘴巴变形 | ✅ | ✅ | 完成 |
| 尾巴待机动画 | ✅ | ✅ | 完成 |
| 吐泡泡特效 | ✅ | ✅ | 完成 |

#### 平滑滤波

```javascript
// 死区阈值
const deadZone = 0.003;
const irisDeadZone = 0.012;

// 平滑系数
const smoothingFactor = 0.3;

// 平滑函数
function smoothValue(current, prev, factor) {
    return prev + (current - prev) * factor;
}

function applyDeadZone(value, threshold) {
    if (Math.abs(value) < threshold) return 0;
    return value;
}

// S 形曲线映射
function mapIrisMovement(value, maxRange) {
    const normalized = value / maxRange;
    return Math.sin(normalized * Math.PI / 2) * maxRange;
}
```

---

## 数据流对比

### 原模型 (本地)

```
摄像头 → MediaPipe Tasks Vision → 468 landmarks + Blendshapes
                                    ↓
                            applyExpression()
                                    ↓
                              SVG 动画
```

### 移植后 (分布式)

```
电脑 B: 摄像头 → MediaPipe → 468 landmarks
              ↓
       FaceAnalyzer 计算
              ↓
    blendshapes + headPose
              ↓
       WebSocket (2.15KB/帧)
              ════════════════
                                    ↓
                              电脑 A: WebSocket
                                    ↓
              updateAnimationWithBlendshapes()
                                    ↓
                              SVG 动画
```

---

## 数据协议

### 面捕端发送

```json
{
  "type": "facemesh",
  "timestamp": 1710378000123,
  "landmarks": {
    "contour": [...],    // 10 个点
    "leftEye": [...],    // 6 个点
    "rightEye": [...],   // 6 个点
    "iris": [...],       // 8 个点
    "mouth": [...],      // 12 个点
    "brows": [...],      // 6 个点
    "nose": [...],       // 5 个点
    "cheeks": [...]      // 2 个点
  },
  "blendshapes": {
    "eyeBlinkLeft": 0.95,
    "eyeBlinkRight": 0.93,
    "eyeLookLeft": 0.0,
    "eyeLookRight": 0.15,
    "eyeLookUp": 0.0,
    "eyeLookDown": 0.0,
    "jawOpen": 0.1,
    "mouthSmileLeft": 0.65,
    "mouthSmileRight": 0.68,
    "mouthPucker": 0.0,
    "headPitch": -0.15,
    "headYaw": 0.08,
    "headRoll": 0.02,
    "browInnerUp": 0.0,
    "browLeftUp": 0.0,
    "browRightUp": 0.0
  },
  "headPose": {
    "pitch": -0.118,
    "yaw": 0.063,
    "roll": 0.016
  },
  "meta": {
    "version": "2.0",
    "fps": 30,
    "landmarkCount": 468
  }
}
```

### 渲染端处理

```javascript
// 优先使用 blendshapes (高性能)
if (data.blendshapes && data.headPose) {
    updateAnimationWithBlendshapes(data.blendshapes, data.headPose, data.landmarks);
}
// 降级使用 landmarks (兼容旧版)
else if (data.landmarks) {
    updateAnimationWithLandmarks(data.landmarks);
}
```

---

## 动画分层控制

### 1. 身体组 (`layer-body-group`)

```javascript
const bodyOffsetX = headPose.yaw * 100;
const bodyOffsetY = headPose.pitch * 80;
const bodyScale = 1 + blendshapes.jawOpen * 0.1;

svgElements.bodyGroup.setAttribute('transform',
    `translate(${bodyOffsetX}, ${bodyOffsetY}) scale(${bodyScale})`);
```

### 2. 头部 (`layer-head`)

```javascript
const headOffsetX = headPose.yaw * 25;
const headOffsetY = headPose.pitch * 15;

svgElements.layerHead.setAttribute('transform',
    `translate(${headOffsetX}, ${headOffsetY})`);
```

### 3. 腮红 (`layer-blush`)

```javascript
const blushLeftX = blendshapes.mouthSmileLeft * 20;
const blushLeftY = blendshapes.jawOpen * 15;
const blushOpacity = 0.5 + blendshapes.jawOpen * 0.3;

svgElements.blushLeft.setAttribute('transform', `translate(${blushLeftX}, ${blushLeftY})`);
svgElements.blushLeft.setAttribute('opacity', blushOpacity);
```

### 4. 外鳃 (`layer-gills`)

```javascript
const gillAngle = Math.sin(tailTime * 2) * 8;
svgElements.gillLeft.setAttribute('transform', `rotate(${gillAngle} 300 250)`);
svgElements.gillRight.setAttribute('transform', `rotate(${-gillAngle} 570 250)`);
```

### 5. 眼睛系统

**眼眶平移：**
```javascript
const eyeOffsetLeftX = (blendshapes.eyeLookRight - blendshapes.eyeLookLeft) * 30;
const eyeOffsetLeftY = (blendshapes.eyeLookDown - blendshapes.eyeLookUp) * 25;
```

**瞳孔追踪 + 眨眼：**
```javascript
const leftPupilX = (blendshapes.eyeLookRight - blendshapes.eyeLookLeft) * 40;
const leftPupilY = (blendshapes.eyeLookDown - blendshapes.eyeLookUp) * 30;
const pupilScale = 1 + blendshapes.jawOpen * 0.2;

if (blinkLeft > 0.6) {
    // 完全闭眼：压扁成一条线
    svgElements.eyeLeftInner.setAttribute('ry', 2 * pupilScale);
    svgElements.eyeLeftInner.setAttribute('rx', 32);
} else if (blinkLeft > 0.3) {
    // 半闭眼：渐进压扁
    const squashFactor = (blinkLeft - 0.3) / 0.3;
    const currentRy = (32 - squashFactor * 30) * pupilScale;
    svgElements.eyeLeftInner.setAttribute('ry', currentRy);
} else {
    // 睁眼：正常圆形 + 追踪
    svgElements.eyeLeftInner.setAttribute('ry', 32 * pupilScale);
    svgElements.eyeLeftInner.setAttribute('rx', 32 * pupilScale);
    svgElements.eyeLeftInner.setAttribute('cx', 380 + eyeOffsetLeftX + leftPupilX);
    svgElements.eyeLeftInner.setAttribute('cy', 320 + eyeOffsetLeftY + leftPupilY);
}
```

### 6. 嘴巴 (`layer-mouth`)

```javascript
if (jawOpen > 0.3) {
    // 张嘴 - 填充模式
    svgElements.mouth.setAttribute('fill', '#E76F51');
    const openDepth = Math.min(jawOpen * 60, 50);
    mouthPath = `M420 Q420 ${425 + openDepth * 0.3} ...`;
} else {
    // 闭嘴 - 线条模式
    svgElements.mouth.setAttribute('fill', 'none');
    const smile = (mouthSmileLeft + mouthSmileRight) / 2;
    const smileCurve = 20 + smile * 30;
    mouthPath = `M420 420 Q450 ${420 + Math.max(smileCurve, 15)} 480 420`;
}
```

### 7. 尾巴待机动画

```javascript
function animateTail() {
    tailTime += 0.05;
    const tailAngle = Math.sin(tailTime) * 5;
    svgElements.tail.setAttribute('transform', `rotate(${tailAngle} 200 450)`);
    requestAnimationFrame(animateTail);
}
```

### 8. 吐泡泡特效

```javascript
function createBubble() {
    const bubble = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    const size = Math.random() * 15 + 10;
    const x = Math.random() * 60 + 420;
    const y = 440;
    // ... 设置属性
    svgElements.bubbleContainer.appendChild(bubble);
    // 动画上升
}

setInterval(createBubble, 3000);
```

---

## 特殊效果

### 1. 瞳孔缩放 (惊讶/兴奋)

```javascript
const pupilScale = 1 + jawOpen * 0.2;  // 最大放大 1.2 倍
```

### 2. 渐进式眨眼

```javascript
// 闭眼过程：正常 → 半闭 → 全闭
if (blinkFactor > 0.6) {
    // 完全闭眼
} else if (blinkFactor > 0.3) {
    // 半闭眼：逐渐压扁
} else {
    // 睁眼
}
```

### 3. 微颤噪声 (增加真实感)

```javascript
function microTremor(time, amplitude = 0.8) {
    return Math.sin(time * 2.3) * Math.sin(time * 1.7) * amplitude;
}
```

### 4. 高光跟随

```javascript
if (!isBlinking) {
    svgElements.eyeLeftHighlight.setAttribute('cx', 
        396 + eyeOffsetLeftX + leftPupilX * 0.6);
    svgElements.eyeLeftHighlight.setAttribute('cy', 
        306 + eyeOffsetLeftY + leftPupilY * 0.6);
}
```

---

## 性能对比

| 指标 | 原模型 | 移植后 |
|------|--------|--------|
| 计算位置 | 本地 | 面捕端 |
| 数据传输 | N/A | 2.15 KB/帧 |
| 渲染延迟 | 0ms | ~10-30ms |
| FPS | 30 | 30 |
| 平滑度 | 高 | 高 |

---

## 兼容性

### 双模式支持

渲染端支持两种数据模式：

1. **Blendshapes 模式** (v2.0) - 优先使用
   - 面捕端预计算表情系数
   - 渲染端直接使用，无需计算
   - 性能最优

2. **Landmarks 模式** (v1.0) - 兼容旧版
   - 传输精简 landmarks
   - 渲染端重建完整数据
   - 兼容旧版面捕端

---

## 使用说明

### 启动面捕端 (电脑 B)

```bash
cd Separable
npm install
npm run capture
```

访问：`http://localhost:16666/capture.html`

### 启动渲染端 (电脑 A)

```bash
cd Separable
npm install
npm run renderer
```

访问：`http://localhost:16667/`

配置 WebSocket 地址：`ws://电脑 B 的 IP:16666/ws`

---

## 直播模式

渲染端支持直播模式（透明背景）：

1. 点击"📺 直播模式"按钮
2. 页面背景和控制面板隐藏
3. 只保留六角恐龙 SVG 动画
4. 可用于 OBS 等直播软件采集

---

## 故障排查

### 动画不流畅

1. 检查网络延迟（应 < 50ms）
2. 查看面捕端 FPS（应 ≥ 25）
3. 确认 WebSocket 连接稳定

### 表情不准确

1. 调整死区阈值 (`deadZone`)
2. 调整平滑系数 (`smoothingFactor`)
3. 检查面捕端光线条件

### 连接失败

1. 确认两台电脑在同一局域网
2. 检查防火墙设置（端口 16666）
3. 确认 WebSocket 地址正确

---

## 文件清单

| 文件 | 说明 | 状态 |
|------|------|------|
| `Separable/capture.html` | 面捕端（含 FaceAnalyzer） | ✅ 已优化 |
| `Separable/renderer-remote.html` | 渲染端（六角恐龙模型） | ✅ 已移植 |
| `Separable/capture-server.js` | 面捕端服务器 | ✅ 不变 |
| `Separable/renderer-server.js` | 渲染端服务器 | ✅ 不变 |
| `Separable/PROTOCOL.md` | 数据传输协议 | ✅ 已更新 |
| `Separable/MIGRATION.md` | 移植说明（本文档） | ✅ 新建 |

---

## 下一步优化建议

1. **二进制协议** - 使用 MessagePack 进一步减少带宽
2. **预测插值** - 网络延迟时的动作平滑
3. **多面部支持** - 同时追踪多个人脸
4. **手势扩展** - 添加手势识别
5. **音频同步** - 口型与语音同步

---

## License

ISC
