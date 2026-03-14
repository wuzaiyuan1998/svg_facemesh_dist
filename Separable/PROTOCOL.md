# 📡 分布式面捕系统 - 数据传输协议 v3.0

## 概述

本协议定义了面捕端与渲染端之间的 WebSocket 数据通信格式。

**🔥 v3.0 版本：回归原始设计，直接发送 468 个 landmarks**

---

## 架构

```
┌─────────────┐      WebSocket (ws://IP:16666/ws)      ┌─────────────┐
│  面捕端     │ ─────────────────────────────────────► │  渲染端     │
│  (Capture)  │                                        │ (Renderer)  │
│  电脑 B     │                                        │  电脑 A     │
└─────────────┘                                        └─────────────┘
     │                                                       │
     ▼                                                       ▼
摄像头采集                                              接收 468 landmarks
MediaPipe 检测                                         完整表情计算
468 landmarks                                          SVG 分层动画
直接发送                                              驱动六角恐龙
```

---

## 消息类型

### 1. 注册消息

#### 1.1 面捕端注册
```json
{ "type": "register_capture" }
```

#### 1.2 渲染端注册
```json
{ "type": "register_renderer" }
```

### 2. 面部数据消息（v3.0）

```json
{
  "type": "facemesh",
  "timestamp": 1710378000123,
  "landmarks": [
    { "x": 0.5, "y": 0.3, "z": 0.05 },
    { "x": 0.51, "y": 0.31, "z": 0.06 },
    // ... 共 468 个点
  ]
}
```

**特点：**
- ✅ 简单直接
- ✅ 无额外计算
- ✅ 渲染端完整控制
- ✅ 局域网带宽充足

---

## 数据结构详解

### Landmarks (完整版 - 468 个点)

```json
"landmarks": [
  { "x": 0.512, "y": 0.324, "z": 0.015 },  // 索引 0
  { "x": 0.498, "y": 0.331, "z": 0.012 },  // 索引 1
  // ...
  { "x": 0.505, "y": 0.420, "z": 0.025 }   // 索引 467
]
```

**关键点索引参考：**

| 区域 | 索引示例 | 数量 |
|------|---------|------|
| 面部轮廓 | 10, 152, 234, 454, ... | ~100+ |
| 左眼 | 33, 133, 159, 145, ... | ~30 |
| 右眼 | 362, 263, 386, 374, ... | ~30 |
| 虹膜 | 468-475 | 8 |
| 嘴巴 | 13, 14, 61, 291, ... | ~40 |
| 眉毛 | 70, 105, 107, ... | ~20 |
| 鼻子 | 1, 4, 5, 273, ... | ~10 |
| 脸颊 | 116, 345 | 2 |
| **总计** | | **468** |

---

## 带宽计算

### v3.0 (完整版)

```
468 个点 × 3 坐标 × 10 字节 ≈ 14 KB/帧
30 FPS ≈ 420 KB/s ≈ 3.4 Mbps

局域网环境：完全够用 ✅
```

---

## 兼容性

| 版本 | 数据格式 | 状态 |
|------|---------|------|
| v1.0 | 468 landmarks | ✅ 当前版本 |
| v2.0 | 精简 landmarks + blendshapes | ⚠️ 已废弃 |
| v3.0 | 468 landmarks (最简版) | ✅ 当前版本 |

---

### Blendshapes (表情系数)

预计算的表情系数，范围 0~1，渲染端可直接使用。

```json
"blendshapes": {
  // 眼部 - 眨眼
  "eyeBlinkLeft": 0.95,      // 左眼睁开程度 (0=闭合，1=睁开)
  "eyeBlinkRight": 0.93,     // 右眼睁开程度
  
  // 眼部 - 视线方向
  "eyeLookLeft": 0.0,        // 向左看 (0~1)
  "eyeLookRight": 0.15,      // 向右看 (0~1)
  "eyeLookUp": 0.0,          // 向上看 (0~1)
  "eyeLookDown": 0.0,        // 向下看 (0~1)
  
  // 嘴部
  "jawOpen": 0.1,            // 张嘴程度 (0~1)
  "mouthSmileLeft": 0.65,    // 左嘴角上扬 (0~1)
  "mouthSmileRight": 0.68,   // 右嘴角上扬 (0~1)
  "mouthPucker": 0.0,        // 嘟嘴程度 (0~1)
  
  // 头部姿态 (归一化 -1~1)
  "headPitch": -0.15,        // 俯仰 (-1=低头，1=抬头)
  "headYaw": 0.08,           // 偏航 (-1=左转，1=右转)
  "headRoll": 0.02,          // 翻滚 (-1=左歪，1=右歪)
  
  // 眉毛
  "browInnerUp": 0.0,        // 眉毛上扬 (0~1)
  "browLeftUp": 0.0,         // 左眉上扬 (0~1)
  "browRightUp": 0.0         // 右眉上扬 (0~1)
}
```

---

### HeadPose (头部欧拉角)

由 blendshapes 转换而来的欧拉角，单位：弧度。

```json
"headPose": {
  "pitch": -0.118,    // 俯仰角 (-π/4 ~ π/4)
  "yaw": 0.063,       // 偏航角 (-π/4 ~ π/4)
  "roll": 0.016       // 翻滚角 (-π/4 ~ π/4)
}
```

---

### Meta (元数据)

```json
"meta": {
  "version": "2.0",           // 协议版本
  "fps": 30,                  // 面捕端 FPS
  "landmarkCount": 468        // 原始 landmarks 数量
}
```

---

## 带宽对比

### v1.0 (旧版 - 全量 landmarks)

```
468 个点 × 3 坐标 × 10 字节 ≈ 14 KB/帧
30 FPS ≈ 420 KB/s ≈ 3.4 Mbps
```

### v2.0 (新版 - 精简 + Blendshapes)

```
55 个点 × 3 坐标 × 10 字节 ≈ 1.65 KB/帧
Blendshapes ≈ 0.5 KB/帧
总计 ≈ 2.15 KB/帧
30 FPS ≈ 64.5 KB/s ≈ 0.52 Mbps

带宽减少：约 85%
```

---

## 使用示例

### 渲染端接收处理

```javascript
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  if (data.type === 'facemesh') {
    // 优先使用 blendshapes (高性能)
    if (data.blendshapes) {
      applyBlendshapes(data.blendshapes);
      applyHeadPose(data.headPose);
    }
    // 降级使用 landmarks (兼容旧版)
    else if (data.landmarks) {
      applyLandmarks(data.landmarks);
    }
  }
};

function applyBlendshapes(bs) {
  // 眨眼
  const eyeScaleLeft = Math.max(0.05, bs.eyeBlinkLeft);
  const eyeScaleRight = Math.max(0.05, bs.eyeBlinkRight);
  leftEye.setAttribute('transform', `scale(1, ${eyeScaleLeft})`);
  rightEye.setAttribute('transform', `scale(1, ${eyeScaleRight})`);
  
  // 微笑
  const smile = (bs.mouthSmileLeft + bs.mouthSmileRight) / 2;
  mouth.setAttribute('d', `M400 450 Q440 ${480 - smile * 40} 480 450`);
}

function applyHeadPose(pose) {
  const { pitch, yaw, roll } = pose;
  head.setAttribute('transform', 
    `translate(${yaw * 80}, ${pitch * 60}) rotate(${roll * 20})`);
}
```

---

## 兼容性

| 版本 | 特性 | 兼容性 |
|------|------|--------|
| v1.0 | 全量 landmarks | 向后兼容 |
| v2.0 | 精简 landmarks + blendshapes | 向前兼容 |

渲染端处理逻辑：
```javascript
if (data.blendshapes) {
  // v2.0 新模式
  useBlendshapes(data.blendshapes);
} else if (data.landmarks) {
  // v1.0 旧模式 (兼容)
  useLandmarks(data.landmarks);
}
```

---

## 扩展性

### 未来可添加的字段

```json
{
  "type": "facemesh",
  // ... 现有字段
  
  // 扩展：多面部支持
  "faces": [
    { "id": 0, "landmarks": {...}, "blendshapes": {...} },
    { "id": 1, "landmarks": {...}, "blendshapes": {...} }
  ],
  
  // 扩展：手势数据
  "handLandmarks": {...},
  
  // 扩展：身体姿态
  "poseLandmarks": {...},
  
  // 扩展：音频数据
  "audioLevel": 0.5
}
```

---

## 错误处理

### 常见错误码

| 错误 | 原因 | 处理 |
|------|------|------|
| `landmarks.length < 468` | 面部检测失败 | 保持上一帧状态 |
| `blendshapes 缺失` | 旧版面捕端 | 降级到 landmarks 模式 |
| `timestamp 过期` | 网络延迟 | 插值补偿 |

---

## 性能优化建议

1. **使用 blendshapes** - 减少渲染端计算
2. **死区过滤** - 面捕端过滤微小抖动
3. **平滑滤波** - 指数移动平均 (EMA)
4. **按需传输** - 只传输变化的数据
5. **二进制协议** - 需要时可用 MessagePack

---

## License

ISC
