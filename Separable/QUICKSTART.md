# 🚀 快速部署指南

## 📦 打包文件

项目已打包为：`svg_facemesh_dist.tar.gz`（22KB）

**位置**：`/home/wuzaiyuan/.openclaw/workspace/svg_facemesh_dist.tar.gz`

---

## 📥 部署到电脑 B

### 1. 传输文件到电脑 B

```bash
# 方法 1：使用 scp
scp svg_facemesh_dist.tar.gz user@电脑B:/home/user/

# 方法 2：使用 U 盘
# 复制 tar.gz 文件到 U 盘，然后拷贝到电脑 B

# 方法 3：使用局域网共享
# 通过 Samba/NFS 共享传输
```

### 2. 解压文件（电脑 B）

```bash
cd /home/user/
tar -xzf svg_facemesh_dist.tar.gz
cd svg_facemesh_dist
```

### 3. 安装依赖（电脑 B）

```bash
npm install
```

### 4. 启动服务（电脑 B）

**打开终端 1 - 启动面捕端：**
```bash
npm run capture
```

**打开终端 2 - 启动渲染端：**
```bash
npm run renderer
```

### 5. 访问面捕端（电脑 B）

用 Chrome 浏览器访问：
```
http://localhost:16666/capture.html
```

点击 "🚀 启动面捕"，允许摄像头权限。

---

## 🖥️ 配置电脑 A（OBS）

### 1. 获取电脑 B 的 IP 地址

在电脑 B 上执行：
```bash
ip addr show | grep "inet "
# 或
hostname -I
```

记下 IP 地址（如：`192.168.1.100`）

### 2. 配置 OBS 浏览器源

1. 打开 OBS Studio
2. 来源 → "+" → 浏览器
3. 填写设置：

| 设置项 | 值 |
|--------|-----|
| **URL** | `http://电脑B 的 IP:16667/` |
| **宽度** | `1920` |
| **高度** | `1080` |
| **关闭时刷新** | ✅ 勾选 |

4. 点击 "确定"

---

## ✅ 测试效果

1. 对着电脑 B 的摄像头做表情
2. OBS 中的六角恐龙应该同步动作

---

## 📋 文件清单

打包文件中包含：

```
svg_facemesh_dist/
├── capture-server.js      # 面捕端服务器
├── capture.html           # 面捕端页面
├── renderer-server.js     # 渲染端服务器
├── renderer-remote.html   # 渲染端页面（OBS 用）
├── package.json           # Node.js 配置
├── README.md              # 项目说明
├── USAGE.md               # 使用文档
├── DEVELOPMENT.md         # 二次开发文档
├── QUICKSTART.md          # 本文件
├── cert.pem               # SSL 证书（可选）
└── key.pem                # SSL 私钥（可选）
```

---

## 🔧 常用命令

### 启动服务
```bash
npm run capture    # 面捕端（端口 16666）
npm run renderer   # 渲染端（端口 16667）
```

### 查看进程
```bash
ps aux | grep node
```

### 停止服务
```bash
pkill -f "node.*server"
```

### 查看端口
```bash
netstat -tlnp | grep 16666
netstat -tlnp | grep 16667
```

---

## ⚠️ 注意事项

1. **防火墙**：确保电脑 B 允许 16666 和 16667 端口
2. **网络**：两台电脑必须在同一局域网
3. **摄像头**：面捕端必须用 localhost 访问（不能用 IP）
4. **OBS**：只支持 WS，不支持 WSS

---

## 📖 更多文档

- **README.md** - 项目概述和架构说明
- **USAGE.md** - 详细使用文档
- **DEVELOPMENT.md** - 二次开发文档

---

## 🆘 遇到问题？

查看 `USAGE.md` 的故障排查部分，或检查：

1. 服务是否正常启动
2. 防火墙是否放行端口
3. 网络是否连通
4. 浏览器控制台错误信息

祝使用愉快！🎉
