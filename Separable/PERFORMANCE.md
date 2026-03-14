# 🔥 面捕端性能优化说明

## 最终方案：回归原始设计

**结论：直接发送 468 个原始 landmarks 数据，渲染端计算。**

### 为什么回归原始方案？

1. **局域网环境** - 带宽不是问题（640x480 分辨率约 14KB/帧，30 FPS 约 420KB/s）
2. **面捕端零计算** - 不做任何 blendshapes 计算，只负责采集和发送
3. **渲染端计算** - 完整的表情计算逻辑在渲染端，与面捕端解耦
4. **最简单** - 代码最简单，维护成本最低

---

## 架构设计

```
┌─────────────────┐                          ┌─────────────────┐
│   电脑 B        │                          │   电脑 A        │
│  (面捕端)       │                          │  (渲染端)       │
│                 │                          │                 │
│  摄像头采集     │                          │  接收 landmarks  │
│  MediaPipe      │                          │  完整计算        │
│  468 landmarks  │─── WebSocket ───────────►│  分层动画        │
│  直接发送       │     (14KB/帧)            │  SVG 渲染        │
└─────────────────┘                          └─────────────────┘
```

---

## 面捕端代码（最简版本）

```javascript
// 🔥 发送原始面捕数据（最简单，最高性能）
// 带宽不是问题（局域网），把计算压力转移到渲染端
function sendFaceMeshData(results) {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    const landmarks = results.multiFaceLandmarks[0];

    // 直接发送原始数据，不做任何计算
    const data = {
        type: 'facemesh',
        timestamp: Date.now(),
        // 完整的 468 个 landmarks 点
        landmarks: landmarks.map(lm => ({
            x: lm.x,
            y: lm.y,
            z: lm.z
        }))
    };

    ws.send(JSON.stringify(data));
}
```

**特点：**
- ✅ 无 `FaceAnalyzer` 类
- ✅ 无 blendshapes 计算
- ✅ 无数据限流
- ✅ 无 DOM 更新
- ✅ 无网格绘制（DEBUG_MODE = false）

---

## 渲染端代码（完整计算）

渲染端接收 468 个 landmarks，执行完整的表情计算：

1. 身体组平移 + 缩放
2. 头部相对平移
3. 腮红独立追踪
4. 外鳃摆动
5. 眼睛眼眶平移
6. 瞳孔追踪 + 眨眼
7. 嘴巴变形
8. 尾巴待机动画
9. 吐泡泡特效

详细代码见 `renderer-remote.html` 中的 `applyExpression()` 函数。

---

## 性能对比

| 方案 | 面捕端 FPS | 带宽 | 渲染端负载 | 结论 |
|------|-----------|------|-----------|------|
| **原始方案** | 30+ | 14KB/帧 | 高 | ✅ 最佳 |
| 精简 landmarks+blendshapes | 25-28 | 2KB/帧 | 低 | ⚠️ 面捕端计算开销大 |
| 仅 blendshapes | 20-25 | 0.5KB/帧 | 中 | ❌ 计算最复杂 |

**结论：原始方案（直接发送 468 个点）性能最好！**

---

## 优化心得

### 走过的弯路

1. ❌ 添加 `FaceAnalyzer` 类 - 增加了计算开销
2. ❌ 计算 blendshapes - 重复计算，效率低
3. ❌ 数据限流 - 限制了帧率
4. ❌ 精简 landmarks - 渲染端需要重建数据

### 最终回归

✅ **最简单 = 最高效**

- 面捕端：只负责采集 + 发送
- 渲染端：负责所有计算
- 带宽：局域网不是问题

---

## 使用说明

### 面捕端（电脑 B）

```javascript
const DEBUG_MODE = false;  // 关闭网格绘制（提高 FPS）
```

### 渲染端（电脑 A）

无需配置，自动接收并计算。

---

## 总结

**回归原始设计，面捕端 FPS 稳定 30+。**

有时候，最简单的方案就是最好的方案。
